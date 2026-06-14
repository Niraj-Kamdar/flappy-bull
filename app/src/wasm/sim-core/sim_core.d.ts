/* tslint:disable */
/* eslint-disable */

/**
 * Flat WASM-friendly SeasonConfig (i64 fields split into lo/hi).
 */
export class WasmSeasonConfig {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    bull_radius_px: number;
    bull_x_px: number;
    canvas_h_px: number;
    canvas_w_px: number;
    channel_half_min: number;
    gravity: number;
    lerp_den: number;
    lerp_num_base: number;
    lerp_num_fast: number;
    max_up_vel: number;
    max_vel_y: number;
    pipe_scroll: number;
    pipe_spacing_px: number;
    pipe_width_px: number;
    price_frac_scale_hi: number;
    price_frac_scale_lo: number;
    price_vel_fast_thresh_hi: number;
    price_vel_fast_thresh_lo: number;
    scale: number;
    season: number;
    tap_boost: number;
}

/**
 * Flat WASM-friendly SimState (i64 price split into lo/hi u32).
 */
export class WasmSimState {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    bull_y: number;
    channel_center: number;
    flags: number;
    pipe0_gap: number;
    pipe0_x: number;
    pipe1_gap: number;
    pipe1_x: number;
    pipe2_gap: number;
    pipe2_x: number;
    pipe3_gap: number;
    pipe3_x: number;
    price_hi: number;
    price_lo: number;
    score: number;
    state_hash: number;
    tick: number;
    vel_y: number;
}

export function wasm_default_config(): WasmSeasonConfig;

export function wasm_init_state(bull_y: number, channel_center: number, price_lo: number, price_hi: number): WasmSimState;

export function wasm_step(state: WasmSimState, cfg: WasmSeasonConfig, tap: boolean, price_lo: number, price_hi: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_get_wasmseasonconfig_bull_radius_px: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_bull_x_px: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_canvas_h_px: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_canvas_w_px: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_channel_half_min: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_gravity: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_lerp_den: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_lerp_num_base: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_lerp_num_fast: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_max_up_vel: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_max_vel_y: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_pipe_scroll: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_pipe_spacing_px: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_pipe_width_px: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_price_frac_scale_hi: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_price_frac_scale_lo: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_price_vel_fast_thresh_hi: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_price_vel_fast_thresh_lo: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_scale: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_season: (a: number) => number;
    readonly __wbg_get_wasmseasonconfig_tap_boost: (a: number) => number;
    readonly __wbg_set_wasmseasonconfig_bull_radius_px: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_bull_x_px: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_canvas_h_px: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_canvas_w_px: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_channel_half_min: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_gravity: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_lerp_den: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_lerp_num_base: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_lerp_num_fast: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_max_up_vel: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_max_vel_y: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_pipe_scroll: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_pipe_spacing_px: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_pipe_width_px: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_price_frac_scale_hi: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_price_frac_scale_lo: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_price_vel_fast_thresh_hi: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_price_vel_fast_thresh_lo: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_scale: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_season: (a: number, b: number) => void;
    readonly __wbg_set_wasmseasonconfig_tap_boost: (a: number, b: number) => void;
    readonly __wbg_wasmseasonconfig_free: (a: number, b: number) => void;
    readonly __wbg_wasmsimstate_free: (a: number, b: number) => void;
    readonly wasm_default_config: () => number;
    readonly wasm_init_state: (a: number, b: number, c: number, d: number) => number;
    readonly wasm_step: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly __wbg_get_wasmsimstate_bull_y: (a: number) => number;
    readonly __wbg_get_wasmsimstate_channel_center: (a: number) => number;
    readonly __wbg_get_wasmsimstate_flags: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe0_gap: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe0_x: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe1_gap: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe1_x: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe2_gap: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe2_x: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe3_gap: (a: number) => number;
    readonly __wbg_get_wasmsimstate_pipe3_x: (a: number) => number;
    readonly __wbg_get_wasmsimstate_price_hi: (a: number) => number;
    readonly __wbg_get_wasmsimstate_price_lo: (a: number) => number;
    readonly __wbg_get_wasmsimstate_score: (a: number) => number;
    readonly __wbg_get_wasmsimstate_state_hash: (a: number) => number;
    readonly __wbg_get_wasmsimstate_tick: (a: number) => number;
    readonly __wbg_get_wasmsimstate_vel_y: (a: number) => number;
    readonly __wbg_set_wasmsimstate_bull_y: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_channel_center: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_flags: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe0_gap: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe0_x: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe1_gap: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe1_x: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe2_gap: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe2_x: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe3_gap: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_pipe3_x: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_price_hi: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_price_lo: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_score: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_state_hash: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_tick: (a: number, b: number) => void;
    readonly __wbg_set_wasmsimstate_vel_y: (a: number, b: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
