//! Strict-nonce application parity + stall tests.
//!
//! Mirrors the on-chain `submit_tap` rule (`programs/flappy-bull/src/lib.rs`):
//! advance exactly one tick when `input.tick == state.tick`, reject otherwise.
//! These tests prove the netcode contract without a validator:
//!   - parity: a lossy network (drops, reorders, duplicates, delayed acks) that
//!     retransmits the contiguous unacked run converges to the same
//!     `state_hash` as the in-order reference run.
//!   - stall: a permanent gap (a tick that is never re-delivered) stalls the
//!     applier at that tick — it never fabricates a death or skips ahead.

use sim_core::{init_state, is_alive, state_hash, SeasonConfig, SimState};

#[derive(Clone, Copy)]
struct Input {
    tick: u32,
    tap: bool,
    price: i64,
}

fn cfg() -> SeasonConfig {
    SeasonConfig::default()
}

fn fresh() -> SimState {
    let c = cfg();
    let mid = (c.canvas_h_px / 2) * c.scale;
    // price 0 matches start_run / wasm_init_state(.., 0, 0): first step's price
    // velocity is computed against 0, exactly as on-chain.
    init_state(mid, mid, 0)
}

/// Same scenario as `wasm_identity.rs` — a known-good 120-tick input stream.
fn scenario_inputs() -> Vec<Input> {
    (0..120u32)
        .map(|tick| Input {
            tick,
            tap: tick % 12 == 0,
            price: 50_000 + (tick as i64) * 137,
        })
        .collect()
}

/// Strict-nonce applier — the exact acceptance rule the program enforces.
/// Returns true if the input was accepted (state advanced one tick).
fn try_apply(s: &mut SimState, c: &SeasonConfig, inp: &Input) -> bool {
    if !is_alive(s.flags) {
        return false; // BullDead
    }
    if inp.tick != s.tick {
        return false; // OutOfOrder (gap or already-consumed retransmit)
    }
    *s = sim_core::step(*s, c, inp.tap, inp.price);
    true
}

/// In-order reference run. `step()`'s dead fast-path freezes `tick`, so running
/// past death is a no-op — the final tick equals the death tick.
fn reference(c: &SeasonConfig, inputs: &[Input]) -> SimState {
    let mut s = fresh();
    for inp in inputs {
        s = sim_core::step(s, c, inp.tap, inp.price);
    }
    s
}

/// Tiny deterministic LCG so the chaos schedule is reproducible (no rand dep,
/// no `Math.random`-style nondeterminism).
struct Lcg(u64);
impl Lcg {
    fn next(&mut self) -> u64 {
        self.0 = self
            .0
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        self.0
    }
    fn below(&mut self, n: usize) -> usize {
        ((self.next() >> 33) as usize) % n
    }
    fn shuffle<T>(&mut self, v: &mut [T]) {
        for i in (1..v.len()).rev() {
            let j = self.below(i + 1);
            v.swap(i, j);
        }
    }
}

#[test]
fn lossy_network_with_retransmit_matches_reference() {
    let c = cfg();
    let inputs = scenario_inputs();
    let want = reference(&c, &inputs);
    // Sanity: scenario exercises many ticks (not a 1-tick degenerate run).
    assert!(want.tick > 5, "scenario too short to be meaningful");

    let mut got = fresh();
    let mut rng = Lcg(0x9E37_79B9_7F4A_7C15);
    let window = 4usize; // adaptive window; healthy retransmit run
    let mut rounds = 0;
    const MAX_ROUNDS: usize = 100_000;

    // Each round the client (re)sends the contiguous unacked run starting at the
    // acked nonce (`got.tick`). The network reorders, drops, and duplicates them;
    // the strict-nonce applier accepts only the matching tick.
    while got.tick < want.tick && rounds < MAX_ROUNDS {
        rounds += 1;
        let base = got.tick as usize;
        let end = (base + window).min(inputs.len());
        let mut win: Vec<Input> = inputs[base..end].to_vec();
        rng.shuffle(&mut win); // reorder

        for inp in &win {
            // ~30% packet loss
            if rng.below(10) < 3 {
                continue;
            }
            try_apply(&mut got, &c, inp);
            // ~20% duplicate delivery (must be an idempotent no-op once consumed)
            if rng.below(10) < 2 {
                try_apply(&mut got, &c, inp);
            }
        }
    }

    assert!(rounds < MAX_ROUNDS, "retransmit failed to converge");
    assert_eq!(got.tick, want.tick, "applier did not reach reference tick");
    assert_eq!(
        state_hash(&got),
        state_hash(&want),
        "strict-nonce apply diverged from in-order reference"
    );
}

#[test]
fn permanent_gap_stalls_without_fabricating_death() {
    let c = cfg();
    let inputs = scenario_inputs();
    const GAP: u32 = 3; // this tick is dropped and never retransmitted

    let mut got = fresh();
    // Deliver every input except the gap, in order — modeling the old bug where
    // a frame is lost and the program would (wrongly) have invented it.
    for inp in &inputs {
        if inp.tick == GAP {
            continue;
        }
        try_apply(&mut got, &c, inp);
    }

    // Applier consumes 0..GAP, then every later input rejects as OutOfOrder.
    assert_eq!(got.tick, GAP, "applier advanced past the gap");
    assert!(
        is_alive(got.flags),
        "stall fabricated a death instead of waiting for retransmit"
    );

    // Stalled state is exactly the correct state after GAP in-order steps.
    let mut want = fresh();
    for inp in inputs.iter().take(GAP as usize) {
        want = sim_core::step(want, &c, inp.tap, inp.price);
    }
    assert_eq!(state_hash(&got), state_hash(&want), "stalled state is wrong");
}
