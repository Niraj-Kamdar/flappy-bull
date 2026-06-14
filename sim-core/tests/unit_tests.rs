use sim_core::{SeasonConfig, SimState, FLAG_ALIVE, init_state, is_alive, state_hash, step};

fn cfg() -> SeasonConfig {
    SeasonConfig::default()
}

fn alive_state() -> SimState {
    let c = cfg();
    // Center of canvas in fixed-point
    let mid = (c.canvas_h_px / 2) * c.scale;
    init_state(mid, mid, 17_612_345)
}

// ── gravity & motion ─────────────────────────────────────────────────────────

#[test]
fn gravity_no_tap() {
    let c = cfg();
    let mid = (c.canvas_h_px / 2) * c.scale;
    // price = 150_000 → frac = 50_000 → target_px = 50_000*500/100_000 = 250 = mid
    // channel_center stays at mid each tick, no channel collision for small drift
    let price: i64 = 150_000;
    let mut s = SimState {
        bull_y: mid,
        vel_y: 0,
        channel_center: mid,
        tick: 0,
        score: 0,
        price,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    for i in 1..=10u32 {
        s = step(s, &c, false, price);
        let expected_vel = (i as i32 * c.gravity).min(c.max_vel_y);
        assert_eq!(s.vel_y, expected_vel, "tick {i}: wrong vel");
    }
}

#[test]
fn tap_reduces_vel() {
    let c = cfg();
    let mut s = alive_state();
    // Apply some gravity first
    for _ in 0..5 {
        s = step(s, &c, false, 0);
    }
    let vel_before = s.vel_y;
    s = step(s, &c, true, 0);
    // After tap: vel = vel_before - tap_boost + gravity (tap applied then gravity)
    let expected = (vel_before - c.tap_boost + c.gravity).min(c.max_vel_y);
    assert_eq!(s.vel_y, expected);
}

#[test]
fn tap_clamped_max_up() {
    let c = cfg();
    let mut s = alive_state();
    // Spam taps; vel_y should never go below -max_up_vel
    for _ in 0..30 {
        s = step(s, &c, true, 0);
        assert!(s.vel_y >= -c.max_up_vel, "vel {} below clamp {}", s.vel_y, -c.max_up_vel);
    }
}

#[test]
fn terminal_velocity() {
    let c = cfg();
    let mut s = alive_state();
    // Step enough ticks without tap to hit terminal vel; only test vel, not death
    for _ in 0..200 {
        if !is_alive(s.flags) {
            break;
        }
        s = step(s, &c, false, 0);
    }
    // At some point vel should have been clamped
    assert!(s.vel_y <= c.max_vel_y);
}

// ── death ────────────────────────────────────────────────────────────────────

#[test]
fn floor_death_exact() {
    let c = cfg();
    // Place bull just above floor; one step should kill it
    let floor_bound = (c.canvas_h_px - c.bull_radius_px) * c.scale;
    // vel_y = 1 so next bull_y = floor_bound + 1 (past floor)
    let s = SimState {
        bull_y: floor_bound,
        vel_y: 1,
        channel_center: floor_bound, // match center to avoid channel death
        tick: 0,
        score: 0,
        price: 17_612_345,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    let next = step(s, &c, false, 0);
    assert!(!is_alive(next.flags), "should be dead at floor");
    assert_eq!(next.score, 0, "death tick must not increment score");
}

#[test]
fn ceiling_death_exact() {
    let c = cfg();
    let ceil_bound = c.bull_radius_px * c.scale;
    // vel must stay negative after gravity to actually hit ceiling:
    // vel_after_gravity = vel + gravity < 0  →  vel < -gravity = -32
    // Use vel = -64: after gravity → -32, bull_y = ceil_bound - 32 < ceil_bound → DEAD
    let s = SimState {
        bull_y: ceil_bound,
        vel_y: -64,
        channel_center: ceil_bound,
        tick: 0,
        score: 0,
        price: 17_612_345,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    let next = step(s, &c, false, 0);
    assert!(!is_alive(next.flags), "should be dead at ceiling");
    assert_eq!(next.score, 0, "death tick must not increment score");
}

#[test]
fn dead_state_immutable() {
    let c = cfg();
    let s = SimState {
        bull_y: 64000,
        vel_y: 100,
        channel_center: 64000,
        tick: 5,
        score: 3,
        price: 17_612_345,
        flags: 0, // dead
        ..Default::default()
    };
    let next = step(s, &c, true, 99_999);
    assert_eq!(next, s, "dead state must be unchanged");
}

// ── score ────────────────────────────────────────────────────────────────────

#[test]
fn score_increments_alive() {
    let c = cfg();
    let mut s = alive_state();
    let n = 20u32;
    for _ in 0..n {
        assert!(is_alive(s.flags));
        s = step(s, &c, true, 0); // tap to stay near center
    }
    assert_eq!(s.score, n);
}

#[test]
fn score_no_increment_on_death() {
    let c = cfg();
    let floor_bound = (c.canvas_h_px - c.bull_radius_px) * c.scale;
    let s = SimState {
        bull_y: floor_bound,
        vel_y: 1,
        channel_center: floor_bound,
        tick: 0,
        score: 7,
        price: 17_612_345,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    let next = step(s, &c, false, 0);
    assert!(!is_alive(next.flags));
    assert_eq!(next.score, 7, "score must not change on death tick");
}

#[test]
fn tap_death_same_tick() {
    // Tap with vel already at max_up_vel near ceiling → still dies (tap clamped, gravity can't save)
    let c = cfg();
    let ceil_bound = c.bull_radius_px * c.scale;
    let s = SimState {
        bull_y: ceil_bound,
        vel_y: -c.max_up_vel, // already at upward clamp
        channel_center: ceil_bound,
        tick: 0,
        score: 0,
        price: 17_612_345,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    // Tap: vel = -max_up_vel - tap_boost → clamped to -max_up_vel
    // Gravity: vel = -max_up_vel + gravity = -900 + 32 = -868 (still strongly upward)
    // bull_y = ceil_bound + (-868) < ceil_bound → DEAD
    let next = step(s, &c, true, 0);
    assert!(!is_alive(next.flags));
    assert_eq!(next.score, 0);
}

// ── channel lerp ─────────────────────────────────────────────────────────────

#[test]
fn channel_lerp_exact() {
    let c = cfg();
    // Known target and center; verify delta matches formula exactly
    let center = 50_000i32; // arbitrary fixed-point center
    let target_px: i64 = 200; // some target in pixels
    let target = (target_px * c.canvas_h_px as i64 / c.canvas_h_px as i64) as i32 * c.scale;
    // Construct state with stable price (price_vel = 0 → lerp_num_base)
    let price: i64 = 17_612_345;
    // frac = price.abs() % 100_000 = 12345
    // target = 12345 * 500 / 100_000 = 61 (int trunc) * 256 = 15616
    let frac = price.abs() % c.price_frac_scale;
    let expected_target = ((frac * c.canvas_h_px as i64) / c.price_frac_scale) as i32 * c.scale;
    let expected_delta = (expected_target as i64 - center as i64) * c.lerp_num_base as i64 / c.lerp_den as i64;
    let expected_center = center + expected_delta as i32;

    let _ = target; // suppress unused warning
    let s = SimState {
        bull_y: center, // doesn't matter for lerp test
        vel_y: 0,
        channel_center: center,
        tick: 0,
        score: 0,
        price,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    let next = step(s, &c, false, price); // same price_sample → price_vel = 0
    assert_eq!(next.channel_center, expected_center);
}

#[test]
fn price_to_center_modulo() {
    let c = cfg();
    // price = 100_100 → frac = 100, target_px = 100*500/100000 = 0, target_fp = 0
    let price: i64 = 100_100;
    let frac = price.abs() % c.price_frac_scale; // = 100
    let expected_target = ((frac * c.canvas_h_px as i64) / c.price_frac_scale) as i32 * c.scale;
    // = (100 * 500 / 100_000) * 256 = 0 * 256 = 0
    assert_eq!(expected_target, 0);

    let mid = (c.canvas_h_px / 2) * c.scale;
    let s = SimState {
        bull_y: mid,
        vel_y: 0,
        channel_center: mid,
        tick: 0,
        score: 0,
        price,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    let next = step(s, &c, false, price);
    let expected_delta = (0i64 - mid as i64) * c.lerp_num_base as i64 / c.lerp_den as i64;
    let expected_center = mid + expected_delta as i32;
    assert_eq!(next.channel_center, expected_center);
}

#[test]
fn modulo_negative_price() {
    let c = cfg();
    let pos_price: i64 = 17_612_345;
    let neg_price: i64 = -17_612_345;

    let mid = (c.canvas_h_px / 2) * c.scale;
    let make = |price: i64| SimState {
        bull_y: mid,
        vel_y: 0,
        channel_center: mid,
        tick: 0,
        score: 0,
        price,
        flags: FLAG_ALIVE,
        ..Default::default()
    };

    let next_pos = step(make(pos_price), &c, false, pos_price);
    let next_neg = step(make(neg_price), &c, false, neg_price);

    // price.abs() → same frac → same target center
    assert_eq!(
        next_pos.channel_center, next_neg.channel_center,
        "negative price should produce same center as positive"
    );
}

// ── state_hash ───────────────────────────────────────────────────────────────

#[test]
fn state_hash_deterministic() {
    let s = SimState {
        bull_y: 64000,
        vel_y: -128,
        channel_center: 64000,
        tick: 42,
        score: 10,
        price: 17_612_345,
        flags: FLAG_ALIVE,
        ..Default::default()
    };
    let h1 = state_hash(&s);
    let h2 = state_hash(&s);
    assert_eq!(h1, h2, "same state must produce same hash");

    let s2 = SimState { score: 11, ..s };
    let h3 = state_hash(&s2);
    assert_ne!(h1, h3, "different state must produce different hash");
}
