import { useWallet } from "@solana/wallet-adapter-react";
import { useGameSession } from "../hooks/useGameSession";
import { baseConnection } from "../lib/connections";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";

export function DelegateTest() {
  const { connected } = useWallet();
  const {
    state,
    pda,
    delegationStatus,
    lastTxSig,
    error,
    initializeSession,
    delegateSession,
    undelegateSession,
  } = useGameSession();

  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    if (!pda) return;
    let cancelled = false;
    const poll = async () => {
      const info = await baseConnection.getAccountInfo(pda);
      if (!cancelled) setOwner(info?.owner.toBase58() ?? null);
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pda]);

  const row = (label: string, val: string | null | undefined) => (
    <div style={{ display: "flex", gap: "12px", marginBottom: "4px" }}>
      <span style={{ color: "#888", minWidth: "140px" }}>{label}</span>
      <span style={{ color: "#eee", wordBreak: "break-all" }}>{val ?? "—"}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "monospace", fontSize: "13px", padding: "16px", border: "1px solid #333", marginTop: "16px" }}>
      <div style={{ color: "#888", marginBottom: "12px" }}>Delegate Round-trip</div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Btn
          label="Initialize"
          disabled={!connected || state !== "IDLE"}
          onClick={initializeSession}
        />
        <Btn
          label="Delegate"
          disabled={state !== "INITIALIZED"}
          onClick={delegateSession}
        />
        <Btn
          label="Undelegate"
          disabled={state !== "DELEGATED"}
          onClick={undelegateSession}
        />
      </div>

      {row("state", state)}
      {row("PDA", pda?.toBase58())}
      {row("owner (base)", owner)}
      {row("isDelegated", delegationStatus?.isDelegated?.toString())}
      {row("fqdn", delegationStatus?.fqdn)}
      {row("last tx", lastTxSig ? lastTxSig.slice(0, 20) + "…" : null)}
      {error && <div style={{ color: "#ff4444", marginTop: "8px" }}>Error: {error}</div>}
    </div>
  );
}

function Btn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#1a1a1a" : "#1a2e1a",
        border: `1px solid ${disabled ? "#333" : "#44aa44"}`,
        color: disabled ? "#555" : "#88ff88",
        padding: "6px 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "monospace",
        fontSize: "13px",
      }}
    >
      {label}
    </button>
  );
}
