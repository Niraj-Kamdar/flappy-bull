import { useWallet } from "@solana/wallet-adapter-react";

type Props = {
  phase: "IDLE" | "STARTING" | "DELEGATING";
  onStart: () => void;
};

export function StartScreen({ phase, onStart }: Props) {
  const { connected } = useWallet();

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        zIndex: 10,
        fontFamily: "monospace",
      }}
    >
      {phase === "IDLE" && (
        <>
          <h2 style={{ color: "#fff", marginBottom: 8, fontSize: 28 }}>
            FLAPPY BULL
          </h2>
          <p
            style={{
              color: "#aaa",
              marginBottom: 24,
              textAlign: "center",
              maxWidth: 360,
              lineHeight: 1.5,
            }}
          >
            Survive the volatility. Every tap verified on-chain against live
            SOL/USD price.
          </p>
          {connected ? (
            <button
              onClick={onStart}
              style={{
                background: "#1a3a1a",
                border: "1px solid #44aa44",
                color: "#88ff88",
                padding: "12px 32px",
                fontSize: 18,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              NEW GAME
            </button>
          ) : (
            <p style={{ color: "#888" }}>Connect wallet to play</p>
          )}
        </>
      )}

      {(phase === "STARTING" || phase === "DELEGATING") && (
        <>
          <div
            style={{
              width: 24,
              height: 24,
              border: "3px solid #333",
              borderTop: "3px solid #44aa44",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: 16,
            }}
          />
          <p style={{ color: "#aaa", fontSize: 14 }}>
            {phase === "STARTING"
              ? "Creating game session..."
              : "Delegating to rollup..."}
          </p>
          <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
            No wallet approval needed — gas is on us
          </p>
        </>
      )}
    </div>
  );
}
