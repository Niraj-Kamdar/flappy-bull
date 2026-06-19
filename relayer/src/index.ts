// Flappy Bull relayer — a Cloudflare Worker that pays + broadcasts the
// base-layer txs so the user needs zero devnet SOL. The user signs ONE
// off-chain message at connect; this Worker is the only authorization gate.
//
// Trust trade-off (accepted, devnet-only): on-chain `player` is a plain pubkey,
// so anyone could call start_run/update_leaderboard directly. Damage is bounded
// by short auth expiry + the on-chain `settled` guard + the top-10 pre-check.
// Scores stay sim-honest regardless (submit_taps recomputes via step()).

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import nacl from "tweetnacl";
import idlJson from "../idl/flappy_bull.json";

interface Env {
  BASE_RPC: string;
  ALLOWED_ORIGIN: string;
  RELAYER_SECRET_KEY: string; // JSON byte array of a fresh devnet keypair file
  NONCES: KVNamespace;
  SESSIONS: KVNamespace;
}

const PROGRAM_ID = new PublicKey("4pRUMdU5Ha9G2MSriNM5NqhwhYo6Mvuq827FVMBTjHzm");

// Reject /start when the relayer can no longer cover rent + delegation escrow.
const BALANCE_FLOOR_LAMPORTS = 20_000_000; // 0.02 SOL

// ── base64 helpers (no Buffer needed) ───────────────────────────────────────

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ── PDA derivation ───────────────────────────────────────────────────────────

function sessionPda(player: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("session"), player.toBuffer()],
    PROGRAM_ID
  )[0];
}

function roomPda(roomId: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("season"), new Uint8Array([roomId])],
    PROGRAM_ID
  )[0];
}

function leaderboardPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("lb")],
    PROGRAM_ID
  )[0];
}

// ── relayer wallet + anchor program ──────────────────────────────────────────

function relayerKeypair(env: Env): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(env.RELAYER_SECRET_KEY)));
}

function makeProgram(env: Env, relayer: Keypair): Program {
  const connection = new Connection(env.BASE_RPC, "confirmed");
  const wallet = {
    publicKey: relayer.publicKey,
    signTransaction: async (tx: Transaction) => {
      tx.partialSign(relayer);
      return tx;
    },
    signAllTransactions: async (txs: Transaction[]) => {
      txs.forEach((tx) => tx.partialSign(relayer));
      return txs;
    },
  };
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  return new Program(idlJson as unknown as Idl, provider);
}

// ── auth ──────────────────────────────────────────────────────────────────────

type AuthBody = { player?: string; message?: string; signature?: string };

// Verify the connect signature: `flappy-bull:connect:<player>:<nonce>:<expiry>`.
// The one signature is reused for every request until expiry; the nonce is
// bound (in KV) to its player+expiry so a tampered message can't ride a seen
// nonce. Returns the validated player pubkey, or throws with a 4xx message.
async function verifyAuth(env: Env, body: AuthBody): Promise<PublicKey> {
  const { player, message, signature } = body;
  if (!player || !message || !signature) throw new HttpError(400, "Missing auth fields");

  const parts = message.split(":");
  if (parts.length !== 5 || parts[0] !== "flappy-bull" || parts[1] !== "connect") {
    throw new HttpError(401, "Bad auth message");
  }
  const [, , msgPlayer, nonce, expiryStr] = parts;
  if (msgPlayer !== player) throw new HttpError(401, "Player mismatch");

  const expiry = parseInt(expiryStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(expiry) || expiry <= now) throw new HttpError(401, "Auth expired");

  let playerKey: PublicKey;
  try {
    playerKey = new PublicKey(player);
  } catch {
    throw new HttpError(400, "Bad player pubkey");
  }

  const ok = nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    b64decode(signature),
    playerKey.toBytes()
  );
  if (!ok) throw new HttpError(401, "Bad signature");

  // Nonce binding: first sight stores player:expiry (TTL = remaining lifetime);
  // reuse must match. Bounds replay of a captured sig to its expiry window.
  const key = `nonce:${nonce}`;
  const binding = `${player}:${expiry}`;
  const existing = await env.NONCES.get(key);
  if (existing) {
    if (existing !== binding) throw new HttpError(401, "Nonce conflict");
  } else {
    await env.NONCES.put(key, binding, {
      expirationTtl: Math.max(60, expiry - now),
    });
  }

  return playerKey;
}

// ── HTTP plumbing ──────────────────────────────────────────────────────────────

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}

function json(env: Env, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(env) },
  });
}

// ── handlers ───────────────────────────────────────────────────────────────────

async function handleStart(env: Env, body: any): Promise<Response> {
  const playerKey = await verifyAuth(env, body);
  const roomId = Number(body.roomId);
  if (!Number.isInteger(roomId) || roomId < 0 || roomId > 255) {
    throw new HttpError(400, "Bad roomId");
  }

  const relayer = relayerKeypair(env);
  const program = makeProgram(env, relayer);
  const connection = program.provider.connection;

  const balance = await connection.getBalance(relayer.publicKey);
  if (balance < BALANCE_FLOOR_LAMPORTS) {
    throw new HttpError(503, "Relayer balance too low — try again later");
  }

  // The Worker mints the ephemeral session key, stores it (served on
  // re-request), and sets it as the on-chain session_key via start_run.
  const ephemeral = Keypair.generate();
  await env.SESSIONS.put(playerKey.toBase58(), b64encode(ephemeral.secretKey));

  const pda = sessionPda(playerKey);
  const room = roomPda(roomId);

  // start_run + delegate in one tx (delegate's CPI runs after init_if_needed).
  // Reuse the converted IDL so #[delegate]'s extra accounts auto-resolve.
  const startIx = await program.methods
    .startRun(playerKey, ephemeral.publicKey, roomId)
    .accounts({
      payer: relayer.publicKey,
      gameSession: pda,
      seasonParams: room,
      systemProgram: new PublicKey("11111111111111111111111111111111"),
    })
    .instruction();
  const delegateIx = await program.methods
    .delegate(playerKey)
    .accounts({ payer: relayer.publicKey, gameSession: pda })
    .instruction();

  const tx = new Transaction().add(startIx, delegateIx);
  const sig = await (program.provider as AnchorProvider).sendAndConfirm!(tx, [], {
    skipPreflight: true,
    commitment: "confirmed",
  });

  return json(env, 200, {
    sessionPda: pda.toBase58(),
    sessionSecretKey: b64encode(ephemeral.secretKey),
    signature: sig,
  });
}

async function handleSessionKey(env: Env, body: any): Promise<Response> {
  const playerKey = await verifyAuth(env, body);
  const stored = await env.SESSIONS.get(playerKey.toBase58());
  if (!stored) throw new HttpError(404, "No session key for player");
  return json(env, 200, { sessionSecretKey: stored });
}

async function handleSettle(env: Env, body: any): Promise<Response> {
  const playerKey = await verifyAuth(env, body);
  const relayer = relayerKeypair(env);
  const program = makeProgram(env, relayer);

  const pda = sessionPda(playerKey);
  const lbPda = leaderboardPda();

  let gs: any;
  try {
    gs = await (program.account as any).gameSession.fetch(pda);
  } catch {
    throw new HttpError(404, "No game session");
  }

  // Mirror the on-chain guards: finished, unsettled, has taps.
  if (gs.alive || gs.settled || gs.tapCount === 0) {
    return json(env, 200, { skipped: true, reason: "not settleable" });
  }

  const score: number = gs.simState.score;
  const lb = await (program.account as any).leaderboard.fetch(lbPda).catch(() => null);

  // Top-10 pre-check: only pay for the tx if it would actually land. The board
  // is sorted descending; the smallest entry is scores[count-1].
  const count: number = lb ? lb.count : 0;
  const qualifies = count < 10 || score > lb.scores[count - 1];
  if (!qualifies) {
    return json(env, 200, { skipped: true, reason: "score below top-10" });
  }

  const sig = await program.methods
    .updateLeaderboard()
    .accounts({
      payer: relayer.publicKey,
      gameSession: pda,
      leaderboard: lbPda,
    })
    .rpc({ skipPreflight: true, commitment: "confirmed" });

  return json(env, 200, { settled: true, signature: sig });
}

async function handleHealth(env: Env): Promise<Response> {
  const relayer = relayerKeypair(env);
  const connection = new Connection(env.BASE_RPC, "confirmed");
  const balance = await connection.getBalance(relayer.publicKey);
  return json(env, 200, {
    pubkey: relayer.publicKey.toBase58(),
    balanceLamports: balance,
    balanceSol: balance / 1e9,
    low: balance < BALANCE_FLOOR_LAMPORTS,
  });
}

// ── entry ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return await handleHealth(env);
      }
      if (request.method === "POST") {
        const body = await request.json();
        switch (url.pathname) {
          case "/start":
            return await handleStart(env, body);
          case "/session-key":
            return await handleSessionKey(env, body);
          case "/settle":
            return await handleSettle(env, body);
        }
      }
      return json(env, 404, { error: "Not found" });
    } catch (e: any) {
      if (e instanceof HttpError) return json(env, e.status, { error: e.message });
      console.error("[relayer]", e?.message, e?.stack);
      return json(env, 500, { error: e?.message ?? "Internal error" });
    }
  },
};
