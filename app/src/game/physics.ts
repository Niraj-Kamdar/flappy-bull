import {
  SCALE,
  GRAVITY,
  TAP_VEL,
  MAX_VEL_Y,
  CHANNEL_HALF,
  BULL_RADIUS,
  CANVAS_H,
} from "./constants";

export type GamePhase = "IDLE" | "PLAYING" | "DEAD";

export type GameState = {
  phase: GamePhase;
  bullY: number;
  velY: number;
  score: number;
  channelCenter: number;
};

export function initState(canvasH: number): GameState {
  return {
    phase: "IDLE",
    bullY: (canvasH / 2) * SCALE,
    velY: 0,
    score: 0,
    channelCenter: (canvasH / 2) * SCALE,
  };
}

export function tick(s: GameState): GameState {
  if (s.phase !== "PLAYING") return s;

  const velY = Math.min(s.velY + GRAVITY, MAX_VEL_Y);
  const bullY = s.bullY + velY;

  const ceilBound = (s.channelCenter / SCALE - CHANNEL_HALF + BULL_RADIUS) * SCALE;
  const floorBound = (s.channelCenter / SCALE + CHANNEL_HALF - BULL_RADIUS) * SCALE;

  if (bullY <= ceilBound || bullY >= floorBound) {
    return { ...s, bullY, velY, phase: "DEAD" };
  }

  return { ...s, bullY, velY, score: s.score + 1 };
}

export function applyTap(s: GameState, canvasH: number): GameState {
  if (s.phase === "IDLE") {
    return { ...s, phase: "PLAYING", velY: TAP_VEL };
  }
  if (s.phase === "PLAYING") {
    return { ...s, velY: TAP_VEL };
  }
  // DEAD → restart
  return initState(canvasH ?? CANVAS_H);
}
