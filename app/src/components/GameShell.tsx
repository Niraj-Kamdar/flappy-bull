import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameSessionContext } from "../context/GameSessionContext";
import { GameCanvas } from "./GameCanvas";
import { StartScreen } from "./StartScreen";
import { ResultScreen } from "./ResultScreen";
import { CANVAS_W, CANVAS_H } from "../game/constants";

const HEADER_H = 60;
const MOBILE_W = 360;
const MOBILE_H = 640;

type Props = { price: number | null };

export function GameShell({ price }: Props) {
  const { connected } = useWallet();
  const session = useGameSessionContext();
  const [scale, setScale] = useState(1);
  const [canvasW, setCanvasW] = useState(CANVAS_W);
  const [canvasH, setCanvasH] = useState(CANVAS_H);

  useEffect(() => {
    function update() {
      const portrait = window.innerWidth < window.innerHeight;
      const cW = portrait ? MOBILE_W : CANVAS_W;
      const cH = portrait ? MOBILE_H : CANVAS_H;
      setCanvasW(cW);
      setCanvasH(cH);
      const scaleX = window.innerWidth / cW;
      const scaleY = (window.innerHeight - HEADER_H) / cH;
      setScale(Math.min(scaleX, scaleY));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
    <div style={{ width: canvasW * scale, height: canvasH * scale, position: "relative" }}>
      <div
        style={{
          width: canvasW,
          height: canvasH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <GameCanvas
          key={`${canvasW}x${canvasH}`}
          canvasW={canvasW}
          canvasH={canvasH}
          price={price}
          sessionPhase={session.phase}
          submitFrame={session.submitFrame}
          finishRun={session.finishRun}
          roomConfig={session.roomConfig}
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
    </div>
  );
}
