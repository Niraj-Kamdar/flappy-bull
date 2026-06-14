import {
  SCALE,
  GRAVITY,
  TAP_BOOST,
  MAX_UP_VEL,
  MAX_VEL_Y,
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
  assist: "none" | "rocket" | "parachute";
  assistTicks: number;
};

export function initState(canvasH: number): GameState {
  return {
    phase: "IDLE",
    bullY: (canvasH / 2) * SCALE,
    velY: 0,
    score: 0,
    channelCenter: (canvasH / 2) * SCALE,
    assist: "none",
    assistTicks: 0,
  };
}

// Pure physics update — no pipe collision (handled per-pipe in GameCanvas)
export function tick(s: GameState): GameState {
  if (s.phase !== "PLAYING") return s;

  let velY = s.velY;
  let assist = s.assist;
  let assistTicks = s.assistTicks;

  if (assist === "rocket") {
    velY = Math.min(velY + (-GRAVITY / 2), MAX_VEL_Y);
  } else if (assist === "parachute") {
    velY = Math.round(velY * 0.88);
    velY = Math.min(velY + GRAVITY, MAX_VEL_Y);
  } else {
    velY = Math.min(velY + GRAVITY, MAX_VEL_Y);
  }

  if (assistTicks > 0) {
    assistTicks--;
    if (assistTicks === 0) assist = "none";
  }

  const bullY = s.bullY + velY;

  // Canvas ceiling/floor death
  if (bullY < BULL_RADIUS * SCALE || bullY > (CANVAS_H - BULL_RADIUS) * SCALE) {
    return { ...s, bullY, velY, phase: "DEAD", assist: "none", assistTicks: 0 };
  }

  return { ...s, bullY, velY, assist, assistTicks };
}

export function applyTap(s: GameState, canvasH: number): GameState {
  if (s.phase === "IDLE") {
    return { ...s, phase: "PLAYING", velY: -TAP_BOOST };
  }
  if (s.phase === "PLAYING") {
    return { ...s, velY: Math.max(s.velY - TAP_BOOST, -MAX_UP_VEL) };
  }
  // DEAD → restart: preserve channelCenter so gap doesn't snap to midpoint
  return { ...initState(canvasH ?? CANVAS_H), channelCenter: s.channelCenter };
}
