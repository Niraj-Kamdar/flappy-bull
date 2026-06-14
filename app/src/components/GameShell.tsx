import { useWallet } from "@solana/wallet-adapter-react";
import { useGameSessionContext } from "../context/GameSessionContext";
import { GameCanvas } from "./GameCanvas";
import { StartScreen } from "./StartScreen";
import { ResultScreen } from "./ResultScreen";

type Props = { price: number | null };

export function GameShell({ price }: Props) {
  const { connected } = useWallet();
  const session = useGameSessionContext();

  const showStart =
    !connected ||
    session.phase === "IDLE" ||
    session.phase === "STARTING" ||
    session.phase === "DELEGATING";

  const showResult =
    session.phase === "FINISHING" ||
    session.phase === "SETTLING" ||
    session.phase === "DONE" ||
    session.phase === "ERROR";

  return (
    <div style={{ position: "relative" }}>
      <GameCanvas
        price={price}
        sessionPhase={session.phase}
        submitTap={session.submitTap}
        finishRun={session.finishRun}
      />

      {showStart && (
        <StartScreen
          phase={
            session.phase === "STARTING"
              ? "STARTING"
              : session.phase === "DELEGATING"
                ? "DELEGATING"
                : "IDLE"
          }
          onStart={session.startNewGame}
        />
      )}

      {showResult && (
        <ResultScreen
          phase={session.phase}
          gameState={session.gameState}
          leaderboard={session.leaderboard}
          error={session.error}
          onPlayAgain={session.startNewGame}
          onSubmitScore={session.submitScore}
        />
      )}
    </div>
  );
}
