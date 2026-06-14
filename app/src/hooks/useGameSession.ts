import { useState, useCallback, useEffect, useRef } from "react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { GetCommitmentSignature } from "@magicblock-labs/ephemeral-rollups-sdk";
import {
  baseConnection,
  makeErConnection,
  getDelegationStatus,
  DelegationStatus,
} from "../lib/connections";
import { derivePythFeedAddress } from "./usePriceOracle";
import idlJson from "../idl/flappy_bull.json";

const PROGRAM_ID = new PublicKey("5JSBorB2EgNM2edr8iAvqh3tHkAVQk5HnAGRYMNjj4XQ");

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
  submitTap: (tick: number, priceLo: number, priceHi: number) => Promise<void>;
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

  // Serializes ER taps so they land in tick order (out-of-order taps fail the
  // on-chain monotonic check and desync the simulation).
  const tapQueueRef = useRef<Promise<void>>(Promise.resolve());

  // ── Re-hydrate session state from chain ─────────────────────────────────

  useEffect(() => {
    if (!publicKey) {
      setPhase("IDLE");
      setSessionPda(null);
      setGameState(null);
      erConnectionRef.current = null;
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
        if (erConn) erConnectionRef.current = erConn;

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
        erConnectionRef.current = makeErConnection(status.fqdn);
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

  // ── submitTap: called by game loop on user input ────────────────────────

  const submitTap = useCallback(
    async (tick: number, priceLo: number, priceHi: number) => {
      if (!sessionPda || !anchorWallet) return;
      const erConn = erConnectionRef.current;
      if (!erConn) {
        if (!erWarnedRef.current) {
          erWarnedRef.current = true;
          console.warn("[submitTap] No ER connection (local-only mode)");
        }
        return;
      }

      // Chain onto the queue so taps are sent strictly in tick order.
      const run = tapQueueRef.current.then(async () => {
        try {
          const program = makeProgram(
            erConn,
            keypairWallet(ephemeralRef.current)
          );
          const seasonPda = getSeasonPda();
          const pythFeed = derivePythFeedAddress();

          const ix = await program.methods
            .submitTap(tick, priceLo, priceHi)
            .accounts({
              authority: ephemeralRef.current.publicKey,
              gameSession: sessionPda,
              seasonParams: seasonPda,
              pythPriceFeed: pythFeed,
            })
            .instruction();

          await sendErRaw(erConn, ix, ephemeralRef.current);
        } catch (e: any) {
          // Log but don't error-out the game for transient failures
          console.warn("[submitTap] error:", e.message);
          if (typeof e.getLogs === "function") {
            try {
              console.warn("[submitTap] logs:", await e.getLogs(erConn));
            } catch {}
          } else if (e.logs) {
            console.warn("[submitTap] logs:", e.logs);
          }
        }
      });
      tapQueueRef.current = run;
      return run;
    },
    [sessionPda, anchorWallet]
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

    // Drain the tap queue so every tap lands on-chain before we commit +
    // undelegate. Otherwise finish_run runs with a partial tap set and the
    // forward-sim kills the bull early, diverging from the client.
    try {
      await tapQueueRef.current;
    } catch {
      // individual tap errors are already logged in submitTap
    }

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
    submitTap,
    finishRun,
    submitScore,
  };
}
