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
} from "../lib/connections";
import idlJson from "../idl/flappy_bull.json";

const PROGRAM_ID = new PublicKey("5JSBorB2EgNM2edr8iAvqh3tHkAVQk5HnAGRYMNjj4XQ");

// Pre-computed constants for hot-path instruction building (use web APIs — Buffer unavailable at module init time)
const SEASON_PDA = PublicKey.findProgramAddressSync(
  [new TextEncoder().encode("season")],
  PROGRAM_ID
)[0];
// sha256("global:submit_tap")[0..8]
const SUBMIT_TAP_DISC = new Uint8Array([117, 171, 17, 53, 85, 233, 67, 235]);

// ── Types ──────────────────────────────────────────────────────────────────

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

function getSeasonPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("season")],
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
 * Session key is persisted per player in localStorage so it survives page
 * reloads. Without this, a fresh `Keypair.generate()` each mount would not
 * match the on-chain `session_key` set at start_run, and every ER tap would
 * fail with `Unauthorized` (0x1770).
 */
function sessionKeyStorageKey(player: PublicKey): string {
  return `flappybull:sessionkey:${player.toBase58()}`;
}

function loadOrCreateSessionKey(player: PublicKey): Keypair {
  try {
    const raw = localStorage.getItem(sessionKeyStorageKey(player));
    if (raw) {
      return Keypair.fromSecretKey(
        Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
      );
    }
  } catch {
    // fall through to generate
  }
  const kp = Keypair.generate();
  try {
    localStorage.setItem(
      sessionKeyStorageKey(player),
      btoa(String.fromCharCode(...kp.secretKey))
    );
  } catch {
    // localStorage unavailable — key won't persist, but game still works in-session
  }
  return kp;
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
  const { publicKey } = useWallet();

  const [phase, setPhase] = useState<GamePhase>("IDLE");
  const [sessionPda, setSessionPda] = useState<PublicKey | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Ephemeral keypair for ER signing — generate once per mount
  const ephemeralRef = useRef<Keypair>(Keypair.generate());
  const [sessionKey, setSessionKey] = useState<PublicKey | null>(
    ephemeralRef.current.publicKey
  );

  // ER connection (set after delegation)
  const erConnectionRef = useRef<Connection | null>(null);
  const erWarnedRef = useRef(false);

  // Set when rehydrate finds a delegated-but-dead (stuck) session that must be
  // committed + undelegated before a new game can start.
  const autoFinishRef = useRef(false);

  // Latest blockhash for fire-and-forget frame submissions
  const blockhashRef = useRef<string | null>(null);
  const blockhashTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Frame sequence counter for sampled error logging
  const frameSeqRef = useRef(0);

  // ── Blockhash pump ───────────────────────────────────────────────────────

  function startBlockhashPump(erConn: Connection) {
    erConn
      .getLatestBlockhash("confirmed")
      .then((r) => { blockhashRef.current = r.blockhash; })
      .catch(() => {});

    if (blockhashTimerRef.current) clearInterval(blockhashTimerRef.current);
    blockhashTimerRef.current = setInterval(() => {
      erConn
        .getLatestBlockhash("confirmed")
        .then((r) => { blockhashRef.current = r.blockhash; })
        .catch(() => {}); // Keep last good hash on transient error
    }, 2000);
  }

  function stopBlockhashPump() {
    if (blockhashTimerRef.current) {
      clearInterval(blockhashTimerRef.current);
      blockhashTimerRef.current = null;
    }
  }

  // Stop pump on unmount
  useEffect(() => {
    return () => { stopBlockhashPump(); };
  }, []);

  // ── Re-hydrate session state from chain ─────────────────────────────────

  useEffect(() => {
    if (!publicKey) {
      setPhase("IDLE");
      setSessionPda(null);
      setGameState(null);
      erConnectionRef.current = null;
      stopBlockhashPump();
      return;
    }

    // Load (or create) the persisted session key for this player.
    const kp = loadOrCreateSessionKey(publicKey);
    ephemeralRef.current = kp;
    setSessionKey(kp.publicKey);

    const pda = getSessionPda(publicKey);
    setSessionPda(pda);

    let cancelled = false;

    async function hydrate() {
      try {
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
          startBlockhashPump(erConn);
        }

        let alive = false;
        let settled = false;
        try {
          const program = makeProgram(erConn ?? baseConnection, anchorWallet!);
          const gs = await (program.account as any).gameSession.fetch(pda);
          alive = gs.alive;
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
          if (alive) {
            setPhase("PLAYING");
          } else {
            // Stuck: delegated but dead. Must finish (commit + undelegate)
            // before a new game can start.
            autoFinishRef.current = true;
            setPhase("FINISHING");
          }
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
  }, [publicKey, anchorWallet]);

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
      const seasonPda = getSeasonPda();
      const sk = ephemeralRef.current.publicKey;

      // Step 1: start_run
      await program.methods
        .startRun(sk)
        .accounts({
          player: publicKey,
          gameSession: pda,
          seasonParams: seasonPda,
          systemProgram: new PublicKey("11111111111111111111111111111111"),
        })
        .rpc({ commitment: "confirmed" });

      setSessionPda(pda);
      setSessionKey(sk);

      // Step 2: delegate
      setPhase("DELEGATING");
      await program.methods
        .delegate()
        .accounts({ payer: publicKey, gameSession: pda })
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      // Wait for delegation to propagate
      await new Promise((r) => setTimeout(r, 3000));
      const status = await getDelegationStatus(pda);

      if (status.fqdn) {
        const erConn = makeErConnection(status.fqdn);
        erConnectionRef.current = erConn;
        startBlockhashPump(erConn);
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
  }, [publicKey, anchorWallet]);

  // ── submitFrame: fire-and-forget per-frame streaming ───────────────────

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
      const blockhash = blockhashRef.current;
      if (!blockhash) return;

      const seq = ++frameSeqRef.current;
      const ephemeral = ephemeralRef.current;

      // Build instruction data directly — avoids Anchor's async promise chain at 60fps.
      // Layout: discriminator(8) + tick(4,u32le) + tap(1,bool) + priceLo(4,u32le) + priceHi(4,i32le)
      const data = new Uint8Array(21);
      data.set(SUBMIT_TAP_DISC, 0);
      const view = new DataView(data.buffer);
      view.setUint32(8, tick, true);
      view.setUint8(12, tap ? 1 : 0);
      view.setUint32(13, priceLo, true);
      view.setInt32(17, priceHi, true);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: ephemeral.publicKey, isSigner: true, isWritable: true },
          { pubkey: sessionPda, isSigner: false, isWritable: true },
          { pubkey: SEASON_PDA, isSigner: false, isWritable: false },
        ],
        data: data as unknown as Buffer,
      });

      const tx = new Transaction().add(ix);
      tx.feePayer = ephemeral.publicKey;
      tx.recentBlockhash = blockhash;
      tx.sign(ephemeral);

      erConn
        .sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 0 })
        .catch((e: any) => {
          if (seq % 30 === 0) {
            console.warn("[submitFrame] error (sampled):", e.message);
          }
        });
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

    // Short drain delay so trailing fire-and-forget frames land before commit.
    await new Promise((r) => setTimeout(r, 200));

    try {
      const program = makeProgram(erConn, keypairWallet(ephemeralRef.current));
      const seasonPda = getSeasonPda();

      const ix = await program.methods
        .finishRun()
        .accounts({
          payer: ephemeralRef.current.publicKey,
          gameSession: sessionPda,
          seasonParams: seasonPda,
        })
        .instruction();

      const sig = await sendErRaw(erConn, ix, ephemeralRef.current);

      // Stop pump — no more frames after commit
      stopBlockhashPump();

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
  }, [sessionPda, anchorWallet]);

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
    if (!publicKey || !anchorWallet || !sessionPda) return;
    setPhase("SETTLING");
    setError(null);

    try {
      const program = makeProgram(baseConnection, anchorWallet);
      const lbPda = getLeaderboardPda();

      await program.methods
        .updateLeaderboard()
        .accounts({
          player: publicKey,
          gameSession: sessionPda,
          leaderboard: lbPda,
        })
        .rpc({ commitment: "confirmed" });

      // Refresh leaderboard
      await fetchLeaderboard();

      setGameState((prev) => (prev ? { ...prev, settled: true } : null));
      setPhase("DONE");
    } catch (e: any) {
      setError(e.message);
      setPhase("ERROR");
    }
  }, [publicKey, anchorWallet, sessionPda, fetchLeaderboard]);

  return {
    phase,
    sessionPda,
    sessionKey,
    gameState,
    leaderboard,
    error,
    startNewGame,
    submitFrame,
    finishRun,
    submitScore,
  };
}
