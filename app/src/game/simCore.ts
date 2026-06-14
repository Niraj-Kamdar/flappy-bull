import init, {
  wasm_step,
  wasm_init_state,
  wasm_default_config,
  WasmSimState,
  WasmSeasonConfig,
} from "../wasm/sim-core/sim_core";

let ready = false;

export async function initSimCore(): Promise<void> {
  if (ready) return;
  await init();
  ready = true;
}

export { wasm_step, wasm_init_state, wasm_default_config, WasmSimState, WasmSeasonConfig };

export const FLAG_ALIVE = 1 << 0;
export const isAlive = (flags: number) => (flags & FLAG_ALIVE) !== 0;

// Price i64 split helpers (price in game is a JS number = float64, safe up to 2^53)
export function priceToLo(price: number): number {
  return (price * 100_000) & 0xffffffff;
}
export function priceToHi(price: number): number {
  return Math.floor((price * 100_000) / 0x100000000);
}
// Read price back from lo/hi
export function priceFromLoHi(lo: number, hi: number): number {
  return (hi * 0x100000000 + (lo >>> 0)) / 100_000;
}
