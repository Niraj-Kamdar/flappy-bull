//! Cross-build determinism check.
//!
//! Runs a fixed scenario through `step`/`state_hash` and asserts the hash equals
//! a value computed on the native target. When this test is compiled to wasm32
//! (`wasm-pack test --node sim-core -- --features wasm`) a mismatch means a
//! `usize`/float divergence leaked into the scored path. On native it runs as a
//! plain `#[test]` and guards against accidental `step` logic changes.

use sim_core::{SeasonConfig, init_state, state_hash, step};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen_test::wasm_bindgen_test;

/// Native-computed FNV-1a hash of the scenario below. Regenerate by setting to 0,
/// running `cargo test -p sim-core wasm_identity`, and copying the reported value.
const EXPECTED_HASH: u64 = 4_283_330_002_414_317_598;

fn run_scenario() -> u64 {
    let cfg = SeasonConfig::default();
    let mut s = init_state(64_000, 64_000, 50_000);
    for tick in 0..120u32 {
        let tap = tick % 12 == 0;
        let price_sample = 50_000 + (tick as i64) * 137;
        s = step(s, &cfg, tap, price_sample);
    }
    state_hash(&s)
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
#[cfg_attr(not(target_arch = "wasm32"), test)]
fn cross_build_hash_matches_native() {
    assert_eq!(run_scenario(), EXPECTED_HASH);
}
