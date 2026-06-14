/* @ts-self-types="./sim_core.d.ts" */

/**
 * Flat WASM-friendly SeasonConfig (i64 fields split into lo/hi).
 */
export class WasmSeasonConfig {
    static __wrap(ptr) {
        const obj = Object.create(WasmSeasonConfig.prototype);
        obj.__wbg_ptr = ptr;
        WasmSeasonConfigFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSeasonConfigFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmseasonconfig_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get bull_radius_px() {
        const ret = wasm.__wbg_get_wasmseasonconfig_bull_radius_px(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get bull_x_px() {
        const ret = wasm.__wbg_get_wasmseasonconfig_bull_x_px(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get canvas_h_px() {
        const ret = wasm.__wbg_get_wasmseasonconfig_canvas_h_px(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get canvas_w_px() {
        const ret = wasm.__wbg_get_wasmseasonconfig_canvas_w_px(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get channel_half_min() {
        const ret = wasm.__wbg_get_wasmseasonconfig_channel_half_min(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get gravity() {
        const ret = wasm.__wbg_get_wasmseasonconfig_gravity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get lerp_den() {
        const ret = wasm.__wbg_get_wasmseasonconfig_lerp_den(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get lerp_num_base() {
        const ret = wasm.__wbg_get_wasmseasonconfig_lerp_num_base(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get lerp_num_fast() {
        const ret = wasm.__wbg_get_wasmseasonconfig_lerp_num_fast(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get max_up_vel() {
        const ret = wasm.__wbg_get_wasmseasonconfig_max_up_vel(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get max_vel_y() {
        const ret = wasm.__wbg_get_wasmseasonconfig_max_vel_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe_scroll() {
        const ret = wasm.__wbg_get_wasmseasonconfig_pipe_scroll(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe_spacing_px() {
        const ret = wasm.__wbg_get_wasmseasonconfig_pipe_spacing_px(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe_width_px() {
        const ret = wasm.__wbg_get_wasmseasonconfig_pipe_width_px(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get price_frac_scale_hi() {
        const ret = wasm.__wbg_get_wasmseasonconfig_price_frac_scale_hi(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get price_frac_scale_lo() {
        const ret = wasm.__wbg_get_wasmseasonconfig_price_frac_scale_lo(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get price_vel_fast_thresh_hi() {
        const ret = wasm.__wbg_get_wasmseasonconfig_price_vel_fast_thresh_hi(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get price_vel_fast_thresh_lo() {
        const ret = wasm.__wbg_get_wasmseasonconfig_price_vel_fast_thresh_lo(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get scale() {
        const ret = wasm.__wbg_get_wasmseasonconfig_scale(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get season() {
        const ret = wasm.__wbg_get_wasmseasonconfig_season(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get tap_boost() {
        const ret = wasm.__wbg_get_wasmseasonconfig_tap_boost(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set bull_radius_px(arg0) {
        wasm.__wbg_set_wasmseasonconfig_bull_radius_px(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set bull_x_px(arg0) {
        wasm.__wbg_set_wasmseasonconfig_bull_x_px(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set canvas_h_px(arg0) {
        wasm.__wbg_set_wasmseasonconfig_canvas_h_px(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set canvas_w_px(arg0) {
        wasm.__wbg_set_wasmseasonconfig_canvas_w_px(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set channel_half_min(arg0) {
        wasm.__wbg_set_wasmseasonconfig_channel_half_min(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set gravity(arg0) {
        wasm.__wbg_set_wasmseasonconfig_gravity(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set lerp_den(arg0) {
        wasm.__wbg_set_wasmseasonconfig_lerp_den(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set lerp_num_base(arg0) {
        wasm.__wbg_set_wasmseasonconfig_lerp_num_base(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set lerp_num_fast(arg0) {
        wasm.__wbg_set_wasmseasonconfig_lerp_num_fast(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set max_up_vel(arg0) {
        wasm.__wbg_set_wasmseasonconfig_max_up_vel(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set max_vel_y(arg0) {
        wasm.__wbg_set_wasmseasonconfig_max_vel_y(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe_scroll(arg0) {
        wasm.__wbg_set_wasmseasonconfig_pipe_scroll(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe_spacing_px(arg0) {
        wasm.__wbg_set_wasmseasonconfig_pipe_spacing_px(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe_width_px(arg0) {
        wasm.__wbg_set_wasmseasonconfig_pipe_width_px(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set price_frac_scale_hi(arg0) {
        wasm.__wbg_set_wasmseasonconfig_price_frac_scale_hi(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set price_frac_scale_lo(arg0) {
        wasm.__wbg_set_wasmseasonconfig_price_frac_scale_lo(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set price_vel_fast_thresh_hi(arg0) {
        wasm.__wbg_set_wasmseasonconfig_price_vel_fast_thresh_hi(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set price_vel_fast_thresh_lo(arg0) {
        wasm.__wbg_set_wasmseasonconfig_price_vel_fast_thresh_lo(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set scale(arg0) {
        wasm.__wbg_set_wasmseasonconfig_scale(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set season(arg0) {
        wasm.__wbg_set_wasmseasonconfig_season(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set tap_boost(arg0) {
        wasm.__wbg_set_wasmseasonconfig_tap_boost(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) WasmSeasonConfig.prototype[Symbol.dispose] = WasmSeasonConfig.prototype.free;

/**
 * Flat WASM-friendly SimState (i64 price split into lo/hi u32).
 */
export class WasmSimState {
    static __wrap(ptr) {
        const obj = Object.create(WasmSimState.prototype);
        obj.__wbg_ptr = ptr;
        WasmSimStateFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSimStateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmsimstate_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get bull_y() {
        const ret = wasm.__wbg_get_wasmsimstate_bull_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get channel_center() {
        const ret = wasm.__wbg_get_wasmsimstate_channel_center(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get flags() {
        const ret = wasm.__wbg_get_wasmsimstate_flags(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get pipe0_gap() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe0_gap(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe0_x() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe0_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe1_gap() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe1_gap(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe1_x() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe1_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe2_gap() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe2_gap(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe2_x() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe2_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe3_gap() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe3_gap(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get pipe3_x() {
        const ret = wasm.__wbg_get_wasmsimstate_pipe3_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get price_hi() {
        const ret = wasm.__wbg_get_wasmsimstate_price_hi(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get price_lo() {
        const ret = wasm.__wbg_get_wasmsimstate_price_lo(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get score() {
        const ret = wasm.__wbg_get_wasmsimstate_score(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get state_hash() {
        const ret = wasm.__wbg_get_wasmsimstate_state_hash(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get tick() {
        const ret = wasm.__wbg_get_wasmsimstate_tick(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get vel_y() {
        const ret = wasm.__wbg_get_wasmsimstate_vel_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set bull_y(arg0) {
        wasm.__wbg_set_wasmsimstate_bull_y(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set channel_center(arg0) {
        wasm.__wbg_set_wasmsimstate_channel_center(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set flags(arg0) {
        wasm.__wbg_set_wasmsimstate_flags(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe0_gap(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe0_gap(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe0_x(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe0_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe1_gap(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe1_gap(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe1_x(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe1_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe2_gap(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe2_gap(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe2_x(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe2_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe3_gap(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe3_gap(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set pipe3_x(arg0) {
        wasm.__wbg_set_wasmsimstate_pipe3_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set price_hi(arg0) {
        wasm.__wbg_set_wasmsimstate_price_hi(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set price_lo(arg0) {
        wasm.__wbg_set_wasmsimstate_price_lo(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set score(arg0) {
        wasm.__wbg_set_wasmsimstate_score(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set state_hash(arg0) {
        wasm.__wbg_set_wasmsimstate_state_hash(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set tick(arg0) {
        wasm.__wbg_set_wasmsimstate_tick(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set vel_y(arg0) {
        wasm.__wbg_set_wasmsimstate_vel_y(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) WasmSimState.prototype[Symbol.dispose] = WasmSimState.prototype.free;

/**
 * @returns {WasmSeasonConfig}
 */
export function wasm_default_config() {
    const ret = wasm.wasm_default_config();
    return WasmSeasonConfig.__wrap(ret);
}

/**
 * @param {number} bull_y
 * @param {number} channel_center
 * @param {number} price_lo
 * @param {number} price_hi
 * @returns {WasmSimState}
 */
export function wasm_init_state(bull_y, channel_center, price_lo, price_hi) {
    const ret = wasm.wasm_init_state(bull_y, channel_center, price_lo, price_hi);
    return WasmSimState.__wrap(ret);
}

/**
 * @param {WasmSimState} state
 * @param {WasmSeasonConfig} cfg
 * @param {boolean} tap
 * @param {number} price_lo
 * @param {number} price_hi
 */
export function wasm_step(state, cfg, tap, price_lo, price_hi) {
    _assertClass(state, WasmSimState);
    _assertClass(cfg, WasmSeasonConfig);
    wasm.wasm_step(state.__wbg_ptr, cfg.__wbg_ptr, tap, price_lo, price_hi);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_ea4887a5f8f9a9db: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./sim_core_bg.js": import0,
    };
}

const WasmSeasonConfigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmseasonconfig_free(ptr, 1));
const WasmSimStateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmsimstate_free(ptr, 1));

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('sim_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
