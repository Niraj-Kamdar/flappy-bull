import { useState, useCallback, useEffect } from "react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { GetCommitmentSignature } from "@magicblock-labs/ephemeral-rollups-sdk";
import {
  baseConnection,
  makeErConnection,
  getDelegationStatus,
  DelegationStatus,
} from "../lib/connections";
import idlJson from "../idl/flappy_bull.json";

export type SessionState =
  | "IDLE"
  | "INITIALIZING"
  | "INITIALIZED"
  | "DELEGATING"
  | "DELEGATED"
  | "UNDELEGATING"
  | "DONE"
  | "ERROR";

type GameSessionHook = {
  state: SessionState;
  pda: PublicKey | null;
  delegationStatus: DelegationStatus | null;
  lastTxSig: string | null;
  error: string | null;
  initializeSession: () => Promise<void>;
  delegateSession: () => Promise<void>;
  undelegateSession: () => Promise<void>;
};

const PROGRAM_ID = new PublicKey(idlJson.address);

function getSessionPda(player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("session"), player.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function useGameSession(): GameSessionHook {
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const [state, setState] = useState<SessionState>("IDLE");
  const [pda, setPda] = useState<PublicKey | null>(null);
  const [delegationStatus, setDelegationStatus] = useState<DelegationStatus | null>(null);
  const [lastTxSig, setLastTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [erConnection, setErConnection] = useState<Connection | null>(null);

  // Re-hydrate state from chain when wallet connects
  useEffect(() => {
    if (!publicKey) {
      setState("IDLE");
      setPda(null);
      setDelegationStatus(null);
      setErConnection(null);
      return;
    }
    const sessionPda = getSessionPda(publicKey);
    setPda(sessionPda);
    let cancelled = false;
    baseConnection.getAccountInfo(sessionPda).then(async (info) => {
      if (cancelled || !info) return;
      try {
        const status = await getDelegationStatus(sessionPda);
        if (cancelled) return;
        setDelegationStatus(status);
        if (status.isDelegated) {
          setState("DELEGATED");
          if (status.fqdn) setErConnection(makeErConnection(status.fqdn));
        } else {
          setState("INITIALIZED");
        }
      } catch {
        if (!cancelled) setState("INITIALIZED");
      }
    });
    return () => { cancelled = true; };
  }, [publicKey]);

  const makeProgram = useCallback(
    (connection: Connection) => {
      if (!wallet) throw new Error("Wallet not connected");
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      return new Program(idlJson as unknown as Idl, provider);
    },
    [wallet]
  );

  const initializeSession = useCallback(async () => {
    if (!publicKey || !wallet) return;
    setState("INITIALIZING");
    setError(null);
    try {
      const program = makeProgram(baseConnection);
      const sessionPda = getSessionPda(publicKey);
      setPda(sessionPda);

      const sig = await program.methods
        .initialize()
        .accounts({ player: publicKey, gameSession: sessionPda })
        .rpc({ commitment: "confirmed" });

      setLastTxSig(sig);
      setState("INITIALIZED");
    } catch (e: any) {
      setError(e.message);
      setState("ERROR");
    }
  }, [publicKey, wallet, makeProgram]);

  const delegateSession = useCallback(async () => {
    if (!publicKey || !wallet || !pda) return;
    setState("DELEGATING");
    setError(null);
    try {
      const program = makeProgram(baseConnection);

      const sig = await program.methods
        .delegate()
        .accounts({ payer: publicKey, gameSession: pda })
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      setLastTxSig(sig);

      await new Promise((r) => setTimeout(r, 3000));
      const status = await getDelegationStatus(pda);
      setDelegationStatus(status);

      if (status.fqdn) {
        setErConnection(makeErConnection(status.fqdn));
      }
      setState("DELEGATED");
    } catch (e: any) {
      setError(e.message);
      setState("ERROR");
    }
  }, [publicKey, wallet, pda, makeProgram]);

  const undelegateSession = useCallback(async () => {
    if (!publicKey || !wallet || !pda) return;
    const conn =
      erConnection ??
      makeErConnection(
        delegationStatus?.fqdn ?? "https://devnet-as.magicblock.app/"
      );
    setState("UNDELEGATING");
    setError(null);
    try {
      const program = makeProgram(conn);

      const sig = await program.methods
        .undelegate()
        .accounts({ payer: publicKey, gameSession: pda })
        .rpc({ skipPreflight: true });

      setLastTxSig(sig);

      const commitSig = await GetCommitmentSignature(sig, conn);
      setLastTxSig(commitSig ?? sig);

      await new Promise((r) => setTimeout(r, 2000));
      const status = await getDelegationStatus(pda);
      setDelegationStatus(status);
      setState("DONE");
    } catch (e: any) {
      setError(e.message);
      setState("ERROR");
    }
  }, [publicKey, wallet, pda, erConnection, delegationStatus, makeProgram]);

  return {
    state,
    pda,
    delegationStatus,
    lastTxSig,
    error,
    initializeSession,
    delegateSession,
    undelegateSession,
  };
}
