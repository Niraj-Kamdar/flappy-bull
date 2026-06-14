import init, {
  wasm_step,
  wasm_init_state,
  wasm_default_config,
  WasmSimState,
  WasmSeasonConfig,
} from "../wasm/sim-core/sim_core";

// Cache the promise (not a boolean): StrictMode fires init concurrently, and a
// boolean guard lets both calls pass before either resolves -> two wasm
// instances. Caching the promise guarantees init() runs exactly once.
let initPromise: Promise<void> | null = null;

export function initSimCore(): Promise<void> {
  if (!initPromise) initPromise = init().then(() => undefined);
  return initPromise;
}

// Single, permanently-referenced config. wasm-bindgen registers objects with a
// FinalizationRegistry; creating the config inside a (StrictMode-doubled) effect
// orphans a copy that GC then frees, corrupting the surviving handle. Caching it
// module-level guarantees exactly one instance that is never GC-eligible.
let cfg: WasmSeasonConfig | null = null;
export function getSimConfig(): WasmSeasonConfig {
  if (!cfg) cfg = wasm_default_config();
  return cfg;
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
