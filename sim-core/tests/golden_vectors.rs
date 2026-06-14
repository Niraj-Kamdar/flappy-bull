use serde::Deserialize;
use sim_core::{SeasonConfig, SimState, FLAG_ALIVE, is_alive, state_hash, step};

#[derive(Deserialize)]
struct JsonCfg {
    gravity: i32, tap_boost: i32, max_up_vel: i32, max_vel_y: i32,
    scale: i32, canvas_h_px: i32, bull_radius_px: i32, channel_half_min: i32,
    lerp_num_base: i32, lerp_den: i32, lerp_num_fast: i32,
    price_vel_fast_thresh: i64, price_frac_scale: i64, season: u8,
}

#[derive(Deserialize)]
struct JsonState {
    bull_y: i32, vel_y: i32, channel_center: i32,
    tick: u32, score: u32, price: i64, flags: u32,
}

#[derive(Deserialize)]
struct PriceSample { tick: u32, price: i64 }

#[derive(Deserialize)]
struct Expected {
    score: Option<u32>,
    tick: Option<u32>,
    alive: Option<bool>,
    bull_y: Option<i32>,
    vel_y: Option<i32>,
    channel_center: Option<i32>,
    state_hash: Option<u32>,
}

#[derive(Deserialize)]
struct Fixture {
    id: String,
    season_config: JsonCfg,
    start_state: JsonState,
    taps: Vec<u32>,
    price_samples: Vec<PriceSample>,
    steps: u32,
    expected: Expected,
}

#[derive(Deserialize)]
struct ModuloCase {
    label: String,
    start_state: JsonState,
    taps: Vec<u32>,
    price_samples: Vec<PriceSample>,
    steps: u32,
    expected: Expected,
}

#[derive(Deserialize)]
struct ModuloFixture {
    id: String,
    season_config: JsonCfg,
    cases: Vec<ModuloCase>,
}

fn make_cfg(j: &JsonCfg) -> SeasonConfig {
    SeasonConfig {
        gravity: j.gravity, tap_boost: j.tap_boost, max_up_vel: j.max_up_vel,
        max_vel_y: j.max_vel_y, scale: j.scale, canvas_h_px: j.canvas_h_px,
        bull_radius_px: j.bull_radius_px, channel_half_min: j.channel_half_min,
        lerp_num_base: j.lerp_num_base, lerp_den: j.lerp_den, lerp_num_fast: j.lerp_num_fast,
        price_vel_fast_thresh: j.price_vel_fast_thresh, price_frac_scale: j.price_frac_scale,
        season: j.season, _pad: [0; 3],
    }
}

fn make_state(j: &JsonState) -> SimState {
    SimState {
        bull_y: j.bull_y, vel_y: j.vel_y, channel_center: j.channel_center,
        tick: j.tick, score: j.score, price: j.price, flags: j.flags,
    }
}

fn run_fixture(mut s: SimState, cfg: &SeasonConfig, steps: u32, taps: &[u32], samples: &[PriceSample]) -> SimState {
    let smap: std::collections::HashMap<u32, i64> = samples.iter().map(|p| (p.tick, p.price)).collect();
    for t in 0..steps {
        let tap = taps.contains(&t);
        let ps = smap.get(&t).copied().unwrap_or(0);
        s = step(s, cfg, tap, ps);
    }
    s
}

fn check(id: &str, label: &str, r: &SimState, exp: &Expected) {
    if let Some(v) = exp.score { assert_eq!(r.score, v, "{}/{}: score", id, label); }
    if let Some(v) = exp.tick { assert_eq!(r.tick, v, "{}/{}: tick", id, label); }
    if let Some(v) = exp.alive { assert_eq!(is_alive(r.flags), v, "{}/{}: alive", id, label); }
    if let Some(v) = exp.bull_y { assert_eq!(r.bull_y, v, "{}/{}: bull_y", id, label); }
    if let Some(v) = exp.vel_y { assert_eq!(r.vel_y, v, "{}/{}: vel_y", id, label); }
    if let Some(v) = exp.channel_center { assert_eq!(r.channel_center, v, "{}/{}: channel_center", id, label); }
    if let Some(v) = exp.state_hash { assert_eq!(state_hash(r) as u32, v, "{}/{}: state_hash", id, label); }
}

fn run_standard(json: &str) {
    let f: Fixture = serde_json::from_str(json).expect("parse fixture");
    let cfg = make_cfg(&f.season_config);
    let s = make_state(&f.start_state);
    let r = run_fixture(s, &cfg, f.steps, &f.taps, &f.price_samples);
    check(&f.id, "main", &r, &f.expected);
}

#[test]
fn golden_basic_survival() {
    run_standard(include_str!("golden/basic_survival.json"));
}

#[test]
fn golden_tap_boundary() {
    run_standard(include_str!("golden/tap_boundary.json"));
}

#[test]
fn golden_death_ceiling() {
    run_standard(include_str!("golden/death_ceiling.json"));
}

#[test]
fn golden_death_floor() {
    run_standard(include_str!("golden/death_floor.json"));
}

#[test]
fn golden_long_run() {
    run_standard(include_str!("golden/long_run.json"));
}

#[test]
fn golden_modulo_wrap() {
    let f: ModuloFixture = serde_json::from_str(include_str!("golden/modulo_wrap.json"))
        .expect("parse modulo fixture");
    let cfg = make_cfg(&f.season_config);
    for case in &f.cases {
        let s = make_state(&case.start_state);
        let r = run_fixture(s, &cfg, case.steps, &case.taps, &case.price_samples);
        check(&f.id, &case.label, &r, &case.expected);
    }
}
