#![deny(clippy::float_arithmetic)]
#![deny(clippy::cast_precision_loss)]

mod flags;
pub use flags::{FLAG_ALIVE, is_alive, set_dead};

/// Fixed-point sim state — 32 bytes, Copy, repr(C)
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(C)]
pub struct SimState {
    pub bull_y: i32,         // pixels * SCALE (256 units/px)
    pub vel_y: i32,          // units/tick; negative = up
    pub channel_center: i32, // fixed-point channel center
    pub tick: u32,
    pub score: u32,
    pub price: i64,          // price * PRICE_FRAC_SCALE (100_000)
    pub flags: u32,          // bit 0 = alive
}

/// All physics params — no floats
#[derive(Clone, Copy, Debug)]
#[repr(C)]
pub struct SeasonConfig {
    pub gravity: i32,
    pub tap_boost: i32,
    pub max_up_vel: i32,
    pub max_vel_y: i32,
    pub scale: i32,
    pub canvas_h_px: i32,
    pub bull_radius_px: i32,
    pub channel_half_min: i32,
    pub lerp_num_base: i32,
    pub lerp_den: i32,
    pub lerp_num_fast: i32,
    pub price_vel_fast_thresh: i64,
    pub price_frac_scale: i64,
    pub season: u8,
    pub _pad: [u8; 3],
}

impl Default for SeasonConfig {
    fn default() -> Self {
        SeasonConfig {
            gravity: 32,
            tap_boost: 768,
            max_up_vel: 900,
            max_vel_y: 1536,
            scale: 256,
            canvas_h_px: 500,
            bull_radius_px: 14,
            channel_half_min: 70,
            lerp_num_base: 4,
            lerp_den: 100,
            lerp_num_fast: 10,
            price_vel_fast_thresh: 8000,
            price_frac_scale: 100_000,
            season: 1,
            _pad: [0; 3],
        }
    }
}

/// Canonical deterministic step. Returns next SimState.
pub fn step(s: SimState, cfg: &SeasonConfig, tap: bool, price_sample: i64) -> SimState {
    // 0. Dead fast-path
    if !is_alive(s.flags) {
        return s;
    }

    // 1. Price update
    let price = if price_sample != 0 { price_sample } else { s.price };

    // 2. Channel center lerp (integer, truncate-toward-zero)
    let frac: i64 = price.abs() % cfg.price_frac_scale;
    let target: i32 = ((frac * cfg.canvas_h_px as i64) / cfg.price_frac_scale) as i32 * cfg.scale;
    let price_vel = price - s.price;
    let lerp_num = if price_vel.abs() >= cfg.price_vel_fast_thresh {
        cfg.lerp_num_fast
    } else {
        cfg.lerp_num_base
    };
    let delta: i64 = (target as i64 - s.channel_center as i64) * lerp_num as i64 / cfg.lerp_den as i64;
    let channel_center: i32 = s.channel_center + delta as i32;

    // 3. Tap impulse
    let vel_y = if tap {
        let v = s.vel_y - cfg.tap_boost;
        if v < -cfg.max_up_vel { -cfg.max_up_vel } else { v }
    } else {
        s.vel_y
    };

    // 4. Gravity (assists are cosmetic-only; step() does not apply them)
    let vel_y = {
        let v = vel_y + cfg.gravity;
        if v > cfg.max_vel_y { cfg.max_vel_y } else { v }
    };

    // 5. Position
    let bull_y = s.bull_y + vel_y;

    // 6. Canvas bounds death (strict < and >)
    let ceil_bound = cfg.bull_radius_px * cfg.scale;
    let floor_bound = (cfg.canvas_h_px - cfg.bull_radius_px) * cfg.scale;
    if bull_y < ceil_bound || bull_y > floor_bound {
        return SimState {
            bull_y,
            vel_y,
            channel_center,
            tick: s.tick + 1,
            score: s.score,
            price,
            flags: set_dead(s.flags),
        };
    }

    // 7. Channel collision (gap = channel_center ± channel_half_min * scale)
    let gap_half = cfg.channel_half_min * cfg.scale;
    let bull_top = bull_y - cfg.bull_radius_px * cfg.scale;
    let bull_bot = bull_y + cfg.bull_radius_px * cfg.scale;
    if bull_top < channel_center - gap_half || bull_bot > channel_center + gap_half {
        return SimState {
            bull_y,
            vel_y,
            channel_center,
            tick: s.tick + 1,
            score: s.score,
            price,
            flags: set_dead(s.flags),
        };
    }

    // 8. Alive tick
    SimState {
        bull_y,
        vel_y,
        channel_center,
        tick: s.tick + 1,
        score: s.score + 1,
        price,
        flags: s.flags | FLAG_ALIVE,
    }
}

/// FNV-1a 64-bit hash of all state fields (explicit LE bytes — no transmute).
pub fn state_hash(s: &SimState) -> u64 {
    const OFFSET: u64 = 0xcbf29ce484222325;
    const PRIME: u64 = 0x00000100000001b3;
    let mut h = OFFSET;
    let mut mix = |bytes: &[u8]| {
        for &b in bytes {
            h ^= b as u64;
            h = h.wrapping_mul(PRIME);
        }
    };
    mix(&s.bull_y.to_le_bytes());
    mix(&s.vel_y.to_le_bytes());
    mix(&s.channel_center.to_le_bytes());
    mix(&s.tick.to_le_bytes());
    mix(&s.score.to_le_bytes());
    mix(&s.price.to_le_bytes());
    mix(&s.flags.to_le_bytes());
    h
}

/// Initialize a fresh alive state.
pub fn init_state(bull_y: i32, channel_center: i32, price: i64) -> SimState {
    SimState {
        bull_y,
        vel_y: 0,
        channel_center,
        tick: 0,
        score: 0,
        price,
        flags: FLAG_ALIVE,
    }
}

#[cfg(feature = "wasm")]
mod wasm_bindings {
    use super::*;
    use wasm_bindgen::prelude::*;

    /// Flat WASM-friendly SimState (i64 price split into lo/hi u32).
    #[wasm_bindgen]
    #[derive(Clone, Copy)]
    pub struct WasmSimState {
        pub bull_y: i32,
        pub vel_y: i32,
        pub channel_center: i32,
        pub tick: u32,
        pub score: u32,
        pub price_lo: u32,
        pub price_hi: i32,
        pub flags: u32,
        pub state_hash: u32,
    }

    fn from_sim(s: SimState) -> WasmSimState {
        let h = state_hash(&s);
        WasmSimState {
            bull_y: s.bull_y,
            vel_y: s.vel_y,
            channel_center: s.channel_center,
            tick: s.tick,
            score: s.score,
            price_lo: (s.price & 0xFFFF_FFFF) as u32,
            price_hi: (s.price >> 32) as i32,
            flags: s.flags,
            state_hash: h as u32,
        }
    }

    fn to_sim(w: &WasmSimState) -> SimState {
        let price = ((w.price_hi as i64) << 32) | (w.price_lo as i64);
        SimState {
            bull_y: w.bull_y,
            vel_y: w.vel_y,
            channel_center: w.channel_center,
            tick: w.tick,
            score: w.score,
            price,
            flags: w.flags,
        }
    }

    /// Flat WASM-friendly SeasonConfig (i64 fields split into lo/hi).
    #[wasm_bindgen]
    #[derive(Clone, Copy)]
    pub struct WasmSeasonConfig {
        pub gravity: i32,
        pub tap_boost: i32,
        pub max_up_vel: i32,
        pub max_vel_y: i32,
        pub scale: i32,
        pub canvas_h_px: i32,
        pub bull_radius_px: i32,
        pub channel_half_min: i32,
        pub lerp_num_base: i32,
        pub lerp_den: i32,
        pub lerp_num_fast: i32,
        pub price_vel_fast_thresh_lo: u32,
        pub price_vel_fast_thresh_hi: i32,
        pub price_frac_scale_lo: u32,
        pub price_frac_scale_hi: i32,
        pub season: u8,
    }

    fn cfg_from_wasm(w: &WasmSeasonConfig) -> SeasonConfig {
        SeasonConfig {
            gravity: w.gravity,
            tap_boost: w.tap_boost,
            max_up_vel: w.max_up_vel,
            max_vel_y: w.max_vel_y,
            scale: w.scale,
            canvas_h_px: w.canvas_h_px,
            bull_radius_px: w.bull_radius_px,
            channel_half_min: w.channel_half_min,
            lerp_num_base: w.lerp_num_base,
            lerp_den: w.lerp_den,
            lerp_num_fast: w.lerp_num_fast,
            price_vel_fast_thresh: ((w.price_vel_fast_thresh_hi as i64) << 32)
                | (w.price_vel_fast_thresh_lo as i64),
            price_frac_scale: ((w.price_frac_scale_hi as i64) << 32)
                | (w.price_frac_scale_lo as i64),
            season: w.season,
            _pad: [0; 3],
        }
    }

    #[wasm_bindgen]
    pub fn wasm_step(
        state: WasmSimState,
        cfg: WasmSeasonConfig,
        tap: bool,
        price_lo: u32,
        price_hi: i32,
    ) -> WasmSimState {
        let s = to_sim(&state);
        let c = cfg_from_wasm(&cfg);
        let price_sample = ((price_hi as i64) << 32) | (price_lo as i64);
        from_sim(step(s, &c, tap, price_sample))
    }

    #[wasm_bindgen]
    pub fn wasm_init_state(
        bull_y: i32,
        channel_center: i32,
        price_lo: u32,
        price_hi: i32,
    ) -> WasmSimState {
        let price = ((price_hi as i64) << 32) | (price_lo as i64);
        from_sim(init_state(bull_y, channel_center, price))
    }

    #[wasm_bindgen]
    pub fn wasm_default_config() -> WasmSeasonConfig {
        let cfg = SeasonConfig::default();
        WasmSeasonConfig {
            gravity: cfg.gravity,
            tap_boost: cfg.tap_boost,
            max_up_vel: cfg.max_up_vel,
            max_vel_y: cfg.max_vel_y,
            scale: cfg.scale,
            canvas_h_px: cfg.canvas_h_px,
            bull_radius_px: cfg.bull_radius_px,
            channel_half_min: cfg.channel_half_min,
            lerp_num_base: cfg.lerp_num_base,
            lerp_den: cfg.lerp_den,
            lerp_num_fast: cfg.lerp_num_fast,
            price_vel_fast_thresh_lo: (cfg.price_vel_fast_thresh & 0xFFFF_FFFF) as u32,
            price_vel_fast_thresh_hi: (cfg.price_vel_fast_thresh >> 32) as i32,
            price_frac_scale_lo: (cfg.price_frac_scale & 0xFFFF_FFFF) as u32,
            price_frac_scale_hi: (cfg.price_frac_scale >> 32) as i32,
            season: cfg.season,
        }
    }
}
