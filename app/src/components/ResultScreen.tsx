import type { GamePhase, GameState, LeaderboardEntry } from "../hooks/useGameSession";

type Props = {
  phase: GamePhase;
  gameState: GameState | null;
  leaderboard: LeaderboardEntry[];
  error: string | null;
  onPlayAgain: () => void;
  onSubmitScore: () => void;
};

export function ResultScreen({
  phase,
  gameState,
  leaderboard,
  error,
  onPlayAgain,
  onSubmitScore,
}: Props) {
  const score = gameState?.score ?? 0;
  const settled = gameState?.settled ?? false;
  const isBusy = phase === "FINISHING" || phase === "SETTLING";

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
      {isBusy && (
        <>
          <div
            style={{
              width: 24,
              height: 24,
              border: "3px solid #333",
              borderTop: "3px solid #ffcc00",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: 16,
            }}
          />
          <p style={{ color: "#aaa", fontSize: 14 }}>
            {phase === "FINISHING"
              ? "Finalizing run on-chain..."
              : "Updating leaderboard..."}
          </p>
        </>
      )}

      {phase === "DONE" && (
        <>
          <h2 style={{ color: "#ff4444", marginBottom: 8, fontSize: 28 }}>
            LIQUIDATED
          </h2>
          <p style={{ color: "#ffcc00", fontSize: 36, marginBottom: 24 }}>
            Score: {score}
          </p>

          {!settled && (
            <button
              onClick={onSubmitScore}
              style={{
                background: "#1a3a1a",
                border: "1px solid #44aa44",
                color: "#88ff88",
                padding: "10px 24px",
                fontSize: 14,
                fontFamily: "monospace",
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              Submit to Leaderboard
            </button>
          )}

          {leaderboard.length > 0 && (
            <div style={{ marginBottom: 20, minWidth: 260 }}>
              <div
                style={{
                  color: "#888",
                  fontSize: 13,
                  marginBottom: 4,
                  textAlign: "center",
                }}
              >
                Leaderboard
              </div>
              {leaderboard.map((e, i) => (
                <div
                  key={i}
                  style={{
                    color: i === 0 ? "#ffcc00" : "#888",
                    fontSize: 12,
                    padding: "2px 0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    #{i + 1} {e.player.slice(0, 6)}...
                  </span>
                  <span>{e.score}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onPlayAgain}
            style={{
              background: "#1a1a2e",
              border: "1px solid #4488aa",
              color: "#88ccff",
              padding: "10px 24px",
              fontSize: 14,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            Play Again
          </button>
        </>
      )}

      {phase === "ERROR" && error && (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#ff4444", marginBottom: 16, maxWidth: 360 }}>
            {error}
          </p>
          <button
            onClick={onPlayAgain}
            style={{
              background: "#1a1a2e",
              border: "1px solid #4488aa",
              color: "#88ccff",
              padding: "10px 24px",
              fontSize: 14,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
