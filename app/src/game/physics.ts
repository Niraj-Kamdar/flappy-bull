import { SCALE, TAP_BOOST, MAX_UP_VEL, CANVAS_H } from "./constants";

export type GamePhase = "IDLE" | "PLAYING" | "DEAD";

// Cosmetic-only TS state: phase + assist visuals. Score/physics live in wasm.
export type GameState = {
  phase: GamePhase;
  bullY: number;   // kept for initState compatibility (wasm is authoritative)
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

// Handles phase transitions: IDLE→PLAYING, PLAYING (tap), DEAD→IDLE
// Does NOT update physics (wasm_step is authoritative).
export function applyTap(s: GameState, canvasH: number): GameState {
  if (s.phase === "IDLE") {
    return { ...s, phase: "PLAYING", velY: -TAP_BOOST };
  }
  if (s.phase === "PLAYING") {
    return { ...s, velY: Math.max(s.velY - TAP_BOOST, -MAX_UP_VEL) };
  }
  // DEAD → IDLE: reset cosmetic state
  return {
    ...initState(canvasH ?? CANVAS_H),
    channelCenter: s.channelCenter,
    assist: "none",
    assistTicks: 0,
  };
}
