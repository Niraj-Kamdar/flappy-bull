import { useState, useCallback, useEffect, useRef } from "react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { GetCommitmentSignature } from "@magicblock-labs/ephemeral-rollups-sdk";
import {
  baseConnection,
  makeErConnection,
  getDelegationStatus,
  DelegationStatus,
  RELAYER,
} from "../lib/connections";
import idlJson from "../idl/flappy_bull.json";

const PROGRAM_ID = new PublicKey("4pRUMdU5Ha9G2MSriNM5NqhwhYo6Mvuq827FVMBTjHzm");

// sha256("global:submit_taps")[0..8]
const SUBMIT_TAPS_DISC = new Uint8Array([136, 226, 222, 173, 237, 63, 94, 102]);

// Ticks per batch. Each batch tx is 20 + 9*BATCH_SIZE bytes (~920 B at 100),
// well under the 1232 B tx limit. One confirmation applies up to BATCH_SIZE
// ticks (~400 ticks/s) — far faster than the 60–120 fps producer.
const BATCH_SIZE = 100;

// GameSession account byte offsets (8-byte discriminator + borsh fields).
// player(32)+session_key(32)+season(1)+start_slot(8)+tap_count(4) -> alive @85;
// sim_state starts @87: bull_y,vel_y,channel_center,tick(@99),score(@103).
const OFF_ALIVE = 85;
const OFF_TICK = 99;
const OFF_SCORE = 103;

// ── Room helpers ──────────────────────────────────────────────────────────

function getRoomId(): number {
  return window.innerWidth < window.innerHeight ? 1 : 0;
}

function getRoomPda(roomId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("season"), Buffer.from([roomId])],
    PROGRAM_ID
  );
  return pda;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RoomConfig = {
  gravity: number;
  tapBoost: number;
  maxUpVel: number;
  maxVelY: number;
  scale: number;
  canvasHPx: number;
  canvasWPx: number;
  bullXPx: number;
  bullRadiusPx: number;
  pipeWidthPx: number;
  pipeScroll: number;
  pipeSpacingPx: number;
  channelHalfMin: number;
  lerpNumBase: number;
  lerpDen: number;
  lerpNumFast: number;
  priceVelFastThresh: any;
  priceFracScale: any;
};

export type GamePhase =
  | "IDLE"
  | "STARTING"
  | "DELEGATING"
  | "PLAYING"
  | "FINISHING"
  | "SETTLING"
  | "DONE"
  | "ERROR";

export type GameState = {
  alive: boolean;
  score: number;
  tapCount: number;
  tick: number;
  settled: boolean;
};

export type LeaderboardEntry = {
  player: string;
  score: number;
};

export type GameSessionHook = {
  phase: GamePhase;
  sessionPda: PublicKey | null;
  sessionKey: PublicKey | null;
  gameState: GameState | null;
  leaderboard: LeaderboardEntry[];
  error: string | null;
  roomConfig: RoomConfig | null;
  startNewGame: () => Promise<void>;
  submitFrame: (tick: number, tap: boolean, priceLo: number, priceHi: number) => void;
  finishRun: () => Promise<void>;
  submitScore: () => Promise<void>;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getSessionPda(player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), player.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

function getLeaderboardPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lb")],
    PROGRAM_ID
  );
  return pda;
}

/**
 * The ephemeral session key is now minted by the Worker relayer at `/start`
 * (keyed by player in KV) and returned to the client. We cache the secret in
 * localStorage so it survives reloads without a round-trip; on a cache miss it
 * is re-requested via `/session-key`. It must match the on-chain `session_key`
 * set at start_run, or every ER tap fails with `Unauthorized` (0x1770).
 */
function sessionKeyStorageKey(player: PublicKey): string {
  return `flappybull:sessionkey:${player.toBase58()}`;
}

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesToB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function loadSessionKeyCache(player: PublicKey): Keypair | null {
  try {
    const raw = localStorage.getItem(sessionKeyStorageKey(player));
    if (raw) return Keypair.fromSecretKey(b64ToBytes(raw));
  } catch {
    // fall through
  }
  return null;
}

function saveSessionKeyCache(player: PublicKey, kp: Keypair): void {
  try {
    localStorage.setItem(sessionKeyStorageKey(player), bytesToB64(kp.secretKey));
  } catch {
    // localStorage unavailable — key won't persist, recover via /session-key
  }
}

function makeProvider(connection: Connection, wallet: any): AnchorProvider {
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

function makeProgram(connection: Connection, wallet: any): Program {
  return new Program(
    idlJson as unknown as Idl,
    makeProvider(connection, wallet)
  );
}

/**
 * Send a single instruction on the ER, signing + paying with `signer`.
 *
 * We send raw (not via Anchor's `.rpc()`) because Anchor 0.32.1 wraps send
 * errors with `new SendTransactionError(err.message, logs)` (old positional
 * signature), which web3.js 1.98.4 mangles into "Unknown action 'undefined'".
 * Going through web3 directly surfaces the real error + `getLogs()`.
 * Preflight is left ON so program errors return synchronously with logs.
 */
async function sendErRaw(
  erConn: Connection,
  ix: any,
  signer: Keypair
): Promise<string> {
  const tx = new Transaction().add(ix);
  tx.feePayer = signer.publicKey;
  tx.recentBlockhash = (await erConn.getLatestBlockhash()).blockhash;
  tx.sign(signer);
  try {
    return await erConn.sendRawTransaction(tx.serialize());
  } catch (e: any) {
    // Pull the real program logs directly off the ER (getLogs() re-sim is flaky).
    try {
      const sim = await erConn.simulateTransaction(tx);
      console.warn("[sendErRaw] sim logs:", sim.value.logs);
    } catch {}
    throw e;
  }
}

/** Create a wallet-like object from a Keypair (for ER signing). */
function keypairWallet(kp: Keypair) {
  return {
    publicKey: kp.publicKey,
    signTransaction: async (tx: any) => {
      tx.sign(kp);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx) => tx.sign(kp));
      return txs;
    },
  } as any;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGameSession(): GameSessionHook {
  const anchorWallet = useAnchorWallet();
  const { publicKey, signMessage } = useWallet();

  // One off-chain auth signature, captured at connect and reused until expiry.
  // Every relayer request carries it; the Worker verifies player + nonce + sig.
  const authRef = useRef<{ message: string; signature: string } | null>(null);

  const [phase, setPhase] = useState<GamePhase>("IDLE");
  const [sessionPda, setSessionPda] = useState<PublicKey | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);

  // Season PDA for current room (updated in startNewGame)
  const seasonPdaRef = useRef<PublicKey>(getRoomPda(0));

  // Ephemeral keypair for ER signing — minted by the relayer at /start, cached
  // in localStorage, recoverable via /session-key. Null until first /start.
  const ephemeralRef = useRef<Keypair | null>(null);
  const [sessionKey, setSessionKey] = useState<PublicKey | null>(null);

  // ER connection (set after delegation)
  const erConnectionRef = useRef<Connection | null>(null);
  const erWarnedRef = useRef(false);

  // Set when rehydrate finds a delegated-but-dead (stuck) session that must be
  // committed + undelegated before a new game can start.
  const autoFinishRef = useRef(false);

  // ── Relayer auth + session-key recovery ─────────────────────────────────────

  // Produce (and cache) the one connect signature. The Worker verifies the
  // message prefix, player match, expiry, nonce-unseen and the ed25519 sig.
  async function ensureAuth(): Promise<{ message: string; signature: string }> {
    if (authRef.current) return authRef.current;
    if (!publicKey || !signMessage) {
      throw new Error("Wallet does not support message signing");
    }
    const nonce = crypto.randomUUID();
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1h
    const message = `flappy-bull:connect:${publicKey.toBase58()}:${nonce}:${expiry}`;
    const sig = await signMessage(new TextEncoder().encode(message));
    const auth = { message, signature: bytesToB64(sig) };
    authRef.current = auth;
    return auth;
  }

  // Resolve the ephemeral session key: in-memory → localStorage cache →
  // re-request from the Worker (which stored it at /start).
  async function ensureSessionKey(): Promise<Keypair> {
    if (ephemeralRef.current) return ephemeralRef.current;
    if (publicKey) {
      const cached = loadSessionKeyCache(publicKey);
      if (cached) {
        ephemeralRef.current = cached;
        setSessionKey(cached.publicKey);
        return cached;
      }
    }
    if (!publicKey) throw new Error("No wallet connected");
    const auth = await ensureAuth();
    const resp = await fetch(`${RELAYER}/session-key`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ player: publicKey.toBase58(), ...auth }),
    }).then((r) => r.json());
    if (resp.error || !resp.sessionSecretKey) {
      throw new Error(resp.error || "No session key on relayer");
    }
    const kp = Keypair.fromSecretKey(b64ToBytes(resp.sessionSecretKey));
    ephemeralRef.current = kp;
    saveSessionKeyCache(publicKey, kp);
    setSessionKey(kp.publicKey);
    return kp;
  }

  // ── Batch-stream reconciliation state ──────────────────────────────────────
  // inputLogRef: every frame's input, index == tick (the full replay log).
  // ackedTickRef: on-chain sim_state.tick = next tick the program will apply
  //   (0-based; equals count of applied ticks). Updated after each batch.
  // aliveOnChainRef: on-chain alive flag (false once the fatal tick is applied).
  // sendingRef/senderPromiseRef: single in-flight sender lock — only one batch
  //   loop runs at a time; new frames just extend the log and re-trigger.
  const inputLogRef = useRef<{ tap: boolean; pLo: number; pHi: number }[]>([]);
  const ackedTickRef = useRef(0);
  const aliveOnChainRef = useRef(true);
  const sendingRef = useRef(false);
  const senderPromiseRef = useRef<Promise<void> | null>(null);

  // Reset reconciliation state for a fresh run.
  function resetReconcile() {
    inputLogRef.current = [];
    ackedTickRef.current = 0;
    aliveOnChainRef.current = true;
    sendingRef.current = false;
    senderPromiseRef.current = null;
  }

  // Serial batch sender. While input remains unapplied, build a submit_taps tx
  // for the next [ackedTick .. ackedTick+BATCH_SIZE) slice, send + confirm it,
  // then read back the on-chain (tick, alive) to advance the cursor. Only one
  // loop runs at once; concurrent triggers return the in-flight promise. On any
  // error the loop exits and the next submitFrame/finishRun re-triggers it (a
  // fresh blockhash per send → unique sig → no "already processed" dedup).
  function kickSender(): Promise<void> {
    if (sendingRef.current) return senderPromiseRef.current ?? Promise.resolve();
    const erConn = erConnectionRef.current;
    const pda = sessionPda;
    const signer = ephemeralRef.current;
    if (!erConn || !pda || !signer) return Promise.resolve();

    sendingRef.current = true;
    const p = (async () => {
      try {
        for (;;) {
          const log = inputLogRef.current;
          const start = ackedTickRef.current;
          if (start >= log.length) break;
          const endExc = Math.min(start + BATCH_SIZE, log.length);
          const n = endExc - start;

          // Borsh: disc(8) + start_tick(u32) + taps-vec(len u32 + n×bool)
          //        + prices-vec(len u32 + n×i64 LE = [pLo u32, pHi i32]).
          const data = new Uint8Array(20 + 9 * n);
          data.set(SUBMIT_TAPS_DISC, 0);
          const view = new DataView(data.buffer);
          let o = 8;
          view.setUint32(o, start, true); o += 4;
          view.setUint32(o, n, true); o += 4;
          for (let i = 0; i < n; i++) data[o++] = log[start + i].tap ? 1 : 0;
          view.setUint32(o, n, true); o += 4;
          for (let i = 0; i < n; i++) {
            const inp = log[start + i];
            view.setUint32(o, inp.pLo, true); o += 4;
            view.setInt32(o, inp.pHi, true); o += 4;
          }

          const ix = new TransactionInstruction({
            programId: PROGRAM_ID,
            keys: [
              { pubkey: signer.publicKey, isSigner: true, isWritable: true },
              { pubkey: pda, isSigner: false, isWritable: true },
              { pubkey: seasonPdaRef.current, isSigner: false, isWritable: false },
            ],
            data: data as unknown as Buffer,
          });

          const sig = await sendErRaw(erConn, ix, signer);
          await erConn.confirmTransaction(sig, "confirmed");

          const acct = await erConn.getAccountInfo(pda);
          if (acct && acct.data.length >= OFF_SCORE + 4) {
            const d = acct.data;
            const dv = new DataView(d.buffer, d.byteOffset, d.length);
            ackedTickRef.current = dv.getUint32(OFF_TICK, true);
            aliveOnChainRef.current = d[OFF_ALIVE] === 1;
          }
          if (!aliveOnChainRef.current) break;
        }
      } catch (e: any) {
        // Exit loop; next submitFrame/finishRun re-triggers from ackedTick.
        console.warn("[kickSender] error:", e?.message);
      } finally {
        sendingRef.current = false;
      }
    })();
    senderPromiseRef.current = p;
    return p;
  }

  // ── Re-hydrate session state from chain ─────────────────────────────────

  useEffect(() => {
    if (!publicKey) {
      setPhase("IDLE");
      setSessionPda(null);
      setGameState(null);
      erConnectionRef.current = null;
      return;
    }

    // Load the cached session key if present (recovered from /session-key
    // otherwise, lazily, when an ER action needs it).
    const cached = loadSessionKeyCache(publicKey);
    ephemeralRef.current = cached;
    setSessionKey(cached ? cached.publicKey : null);

    const pda = getSessionPda(publicKey);
    setSessionPda(pda);

    let cancelled = false;

    async function hydrate() {
      try {
        // One-time connect prompt: capture the off-chain auth signature so all
        // later relayer calls are prompt-free. The only wallet prompt in the app.
        if (signMessage && !authRef.current) {
          try {
            await ensureAuth();
          } catch {
            // User declined or wallet lacks signMessage (Seeker fallback) —
            // relayer calls will surface a clear error when attempted.
          }
        }
        if (cancelled) return;
        // Check if GameSession account exists
        const accountInfo = await baseConnection.getAccountInfo(pda);
        if (cancelled || !accountInfo) {
          if (!cancelled) setPhase("IDLE");
          return;
        }

        // Check delegation status
        let status: DelegationStatus;
        try {
          status = await getDelegationStatus(pda);
        } catch {
          if (!cancelled) setPhase("IDLE");
          return;
        }
        if (cancelled) return;

        // A delegated account lives on the ER, not base — read state from
        // whichever layer currently owns it.
        const erConn =
          status.isDelegated && status.fqdn
            ? makeErConnection(status.fqdn)
            : null;
        if (erConn) {
          erConnectionRef.current = erConn;
          resetReconcile();
        }

        let settled = false;
        try {
          const program = makeProgram(erConn ?? baseConnection, anchorWallet!);
          const gs = await (program.account as any).gameSession.fetch(pda);
          settled = gs.settled;
          setGameState({
            alive: gs.alive,
            score: gs.simState.score,
            tapCount: gs.tapCount,
            tick: gs.simState.tick,
            settled: gs.settled,
          });
        } catch {
          // Account exists but can't decode — treat as IDLE below
        }
        if (cancelled) return;

        if (status.isDelegated) {
          // Any delegated session found at load is stuck: a crash/refresh lost
          // the in-memory input log, so we can't resume the stream. Auto-finish
          // (commit the real partial state + undelegate) frees the PDA so a new
          // game can start. Covers both dead sessions and abandoned-alive ones.
          autoFinishRef.current = true;
          setPhase("FINISHING");
        } else if (settled) {
          setPhase("DONE");
        } else {
          setPhase("IDLE");
        }
      } catch {
        if (!cancelled) setPhase("IDLE");
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [publicKey, anchorWallet, signMessage]);

  // ── Fetch leaderboard ──────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(async () => {
    try {
      const lbPda = getLeaderboardPda();
      const program = makeProgram(baseConnection, anchorWallet!);
      const lb = await (program.account as any).leaderboard.fetch(lbPda);
      const entries: LeaderboardEntry[] = [];
      for (let i = 0; i < lb.count; i++) {
        if (lb.scores[i] > 0) {
          entries.push({
            player: lb.players[i].toString(),
            score: lb.scores[i],
          });
        }
      }
      setLeaderboard(entries);
    } catch {
      // Leaderboard may not exist yet — ignore
      setLeaderboard([]);
    }
  }, [anchorWallet]);

  // Fetch leaderboard on mount and when phase changes to DONE
  useEffect(() => {
    if (publicKey && anchorWallet) {
      fetchLeaderboard();
    }
  }, [publicKey, anchorWallet, phase, fetchLeaderboard]);

  // ── startNewGame: startRun + delegate ───────────────────────────────────

  const startNewGame = useCallback(async () => {
    if (!publicKey || !anchorWallet) return;
    setPhase("STARTING");
    setError(null);

    try {
      const program = makeProgram(baseConnection, anchorWallet);
      const pda = getSessionPda(publicKey);
      const roomId = getRoomId();
      const roomPda = getRoomPda(roomId);
      seasonPdaRef.current = roomPda;

      // Fetch room config (read-only, no signature)
      const seasonData = await (program.account as any).seasonParams.fetch(roomPda);
      setRoomConfig(seasonData.physics as RoomConfig);

      // Relayer pays + broadcasts start_run + delegate. The user signs nothing
      // here — only the connect-time auth signature is reused. The Worker mints
      // the ephemeral session key, returns it, and we cache it for ER signing.
      const auth = await ensureAuth();
      const resp = await fetch(`${RELAYER}/start`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ player: publicKey.toBase58(), roomId, ...auth }),
      }).then((r) => r.json());
      if (resp.error || !resp.sessionSecretKey) {
        throw new Error(resp.error || "Relayer did not return a session key");
      }

      const sk = Keypair.fromSecretKey(b64ToBytes(resp.sessionSecretKey));
      ephemeralRef.current = sk;
      saveSessionKeyCache(publicKey, sk);

      setSessionPda(pda);
      setSessionKey(sk.publicKey);

      // Poll for delegation to propagate. A fixed wait is unreliable on slow /
      // mobile networks where delegation can take longer than a few seconds;
      // poll until the router reports the PDA delegated (with its ER fqdn),
      // tolerating transient router errors, up to a deadline.
      let status: DelegationStatus | null = null;
      const delegateDeadline = Date.now() + 20000;
      for (;;) {
        try {
          const s = await getDelegationStatus(pda);
          if (s.isDelegated && s.fqdn) {
            status = s;
            break;
          }
        } catch {
          // Router transient (rate limit / propagation) — keep polling.
        }
        if (Date.now() >= delegateDeadline) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      resetReconcile();
      if (status?.fqdn) {
        const erConn = makeErConnection(status.fqdn);
        erConnectionRef.current = erConn;
        erWarnedRef.current = false;
      }

      erWarnedRef.current = false;
      setGameState({
        alive: true,
        score: 0,
        tapCount: 0,
        tick: 0,
        settled: false,
      });
      setPhase("PLAYING");
    } catch (e: any) {
      setError(e.message);
      setPhase("ERROR");
    }
  }, [publicKey, anchorWallet, signMessage]);

  // ── submitFrame: record input, then trigger the batch sender ────────────

  const submitFrame = useCallback(
    (tick: number, tap: boolean, priceLo: number, priceHi: number): void => {
      if (!sessionPda) return;
      const erConn = erConnectionRef.current;
      if (!erConn) {
        if (!erWarnedRef.current) {
          erWarnedRef.current = true;
          console.warn("[submitFrame] No ER connection (local-only mode)");
        }
        return;
      }

      // Record this frame in the replay log (index == tick), then kick the
      // serial batch sender (non-blocking; no-ops if already running).
      inputLogRef.current[tick] = { tap, pLo: priceLo, pHi: priceHi };
      kickSender();
    },
    [sessionPda]
  );

  // ── finishRun: catch up + commit + undelegate on ER ─────────────────────

  const finishRun = useCallback(async () => {
    if (!sessionPda || !anchorWallet) return;
    setPhase("FINISHING");
    setError(null);

    const erConn = erConnectionRef.current;
    if (!erConn) {
      setError("No ER connection");
      setPhase("ERROR");
      return;
    }

    // The session key signs on the ER. After a reload/auto-finish it may not be
    // in memory — resolve it from cache or the relayer before committing.
    let signer: Keypair;
    try {
      signer = await ensureSessionKey();
    } catch (e: any) {
      setError(e.message);
      setPhase("ERROR");
      return;
    }

    // Drain: keep the batch sender running until the program has applied every
    // logged input (incl. the fatal tick) or the bull died on-chain. This
    // guarantees the committed score == client death tick, since finish_run
    // commits the on-chain state as-is (no forward-sim guess). On sustained
    // network failure the deadline expires and we commit the real partial state
    // rather than locking the PDA. The auto-recovery path (empty log) skips the
    // loop entirely and finalizes as-is.
    const drainDeadline = Date.now() + 15000;
    while (
      Date.now() < drainDeadline &&
      aliveOnChainRef.current &&
      ackedTickRef.current < inputLogRef.current.length
    ) {
      await kickSender();
      await new Promise((r) => setTimeout(r, 100));
    }

    try {
      const program = makeProgram(erConn, keypairWallet(signer));

      const ix = await program.methods
        .finishRun()
        .accounts({
          payer: signer.publicKey,
          gameSession: sessionPda,
        })
        .instruction();

      const sig = await sendErRaw(erConn, ix, signer);

      // Wait for commit signature
      const commitSig = await GetCommitmentSignature(sig, erConn);

      // Wait for base layer to reflect committed state
      await new Promise((r) => setTimeout(r, 3000));

      // Read back settled state
      const baseProgram = makeProgram(baseConnection, anchorWallet);
      const gs = await (baseProgram.account as any).gameSession.fetch(sessionPda);
      setGameState({
        alive: gs.alive,
        score: gs.simState.score,
        tapCount: gs.tapCount,
        tick: gs.simState.tick,
        settled: gs.settled,
      });

      setPhase("DONE");
    } catch (e: any) {
      console.warn("[finishRun] error:", e.message);
      if (typeof e.getLogs === "function") {
        try {
          console.warn("[finishRun] logs:", await e.getLogs(erConn));
        } catch {}
      } else if (e.logs) {
        console.warn("[finishRun] logs:", e.logs);
      }
      setError(e.message);
      setPhase("ERROR");
    }
  }, [sessionPda, anchorWallet, publicKey, signMessage]);

  // Recover a stuck (delegated + dead) session found during rehydrate by
  // committing + undelegating it. finish_run handles an already-dead bull.
  useEffect(() => {
    if (
      phase === "FINISHING" &&
      autoFinishRef.current &&
      erConnectionRef.current &&
      sessionPda
    ) {
      autoFinishRef.current = false;
      finishRun();
    }
  }, [phase, sessionPda, finishRun]);

  // ── submitScore: update leaderboard on base layer ───────────────────────

  const submitScore = useCallback(async () => {
    if (!publicKey || !sessionPda) return;
    setPhase("SETTLING");
    setError(null);

    try {
      // Relayer checks on-chain state and only submits update_leaderboard if the
      // score qualifies for top-10. `{ skipped: true }` = nothing to do (DONE).
      const auth = await ensureAuth();
      const resp = await fetch(`${RELAYER}/settle`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ player: publicKey.toBase58(), ...auth }),
      }).then((r) => r.json());
      if (resp.error) throw new Error(resp.error);

      // Refresh leaderboard
      await fetchLeaderboard();

      setGameState((prev) => (prev ? { ...prev, settled: true } : null));
      setPhase("DONE");
    } catch (e: any) {
      setError(e.message);
      setPhase("ERROR");
    }
  }, [publicKey, sessionPda, fetchLeaderboard, signMessage]);

  return {
    phase,
    sessionPda,
    sessionKey,
    gameState,
    leaderboard,
    error,
    roomConfig,
    startNewGame,
    submitFrame,
    finishRun,
    submitScore,
  };
}
