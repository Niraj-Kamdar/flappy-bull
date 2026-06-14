use sim_core::{SeasonConfig, SimState, init_state, is_alive, state_hash, step};

fn run(mut s: SimState, cfg: &SeasonConfig, n: u32, taps: &[u32], samples: &[(u32, i64)]) -> SimState {
    let mut smap = std::collections::HashMap::new();
    for (t, p) in samples { smap.insert(t, p); }
    for t in 0..n {
        let tap = taps.contains(&t);
        let ps = smap.get(&t).copied().copied().unwrap_or(0);
        s = step(s, cfg, tap, ps);
    }
    s
}

// Tap when bull_y > channel_center + pos_thresh (lower half of channel)
fn greedy_pos(mut s: SimState, cfg: &SeasonConfig, n: u32, pos_thresh: i32, ps: i64) -> (SimState, Vec<u32>) {
    let mut taps = vec![];
    for t in 0..n {
        let tap = is_alive(s.flags) && s.bull_y > s.channel_center + pos_thresh;
        if tap { taps.push(t); }
        s = step(s, cfg, tap, ps);
    }
    (s, taps)
}

fn main() {
    let cfg = SeasonConfig::default();
    let mid = (cfg.canvas_h_px / 2) * cfg.scale;
    let pm: i64 = 150_000; // frac=50000 → target_px=250=mid, channel stays stable

    // basic_survival:
    let s0 = init_state(mid, mid, pm);
    let (r_basic, taps_basic) = greedy_pos(s0, &cfg, 120, 4000, pm);
    println!("basic_survival taps={:?}", taps_basic);
    println!("  alive={} score={} by={} vy={} cc={} hash_lo={}",
        is_alive(r_basic.flags), r_basic.score, r_basic.bull_y, r_basic.vel_y,
        r_basic.channel_center, state_hash(&r_basic) as u32);

    // long_run: same controller, 1000 ticks
    let s0 = init_state(mid, mid, pm);
    let (r_long, taps_long) = greedy_pos(s0, &cfg, 1000, 4000, pm);
    println!("long_run taps={:?}", taps_long);
    println!("  alive={} score={} tick={} hash_lo={}",
        is_alive(r_long.flags), r_long.score, r_long.tick, state_hash(&r_long) as u32);

    // tap_boundary: start at max_up_vel, single tap, 10 ticks
    let s = SimState { vel_y: -cfg.max_up_vel, ..init_state(mid, mid, pm) };
    let r = run(s, &cfg, 10, &[0], &[(0, pm)]);
    println!("tap_boundary alive={} score={} vy={} hash_lo={}",
        is_alive(r.flags), r.score, r.vel_y, state_hash(&r) as u32);

    // death_ceiling: bull near ceiling, upward vel, no tap
    let ceil_b = cfg.bull_radius_px * cfg.scale + 500;
    let s = SimState { bull_y: ceil_b, vel_y: -cfg.max_up_vel, ..init_state(mid, mid, pm) };
    let r = run(s, &cfg, 5, &[], &[(0, pm)]);
    println!("death_ceiling alive={} tick={} score={} by={} hash_lo={}",
        is_alive(r.flags), r.tick, r.score, r.bull_y, state_hash(&r) as u32);

    // death_floor: bull near floor, max downward vel, no tap
    let floor_b = (cfg.canvas_h_px - cfg.bull_radius_px) * cfg.scale - 500;
    let s = SimState { bull_y: floor_b, vel_y: cfg.max_vel_y, ..init_state(mid, mid, pm) };
    let r = run(s, &cfg, 5, &[], &[(0, pm)]);
    println!("death_floor alive={} tick={} score={} by={} hash_lo={}",
        is_alive(r.flags), r.tick, r.score, r.bull_y, state_hash(&r) as u32);

    // modulo_wrap: frac=0 (price=200_000) and frac=99999 (price=199_999)
    for (nm, pr) in [("frac0", 200_000i64), ("frac_max", 199_999i64)] {
        let s = init_state(mid, mid, pr);
        let r = run(s, &cfg, 10, &[0, 3, 6], &[(0, pr)]);
        println!("modulo_{} cc={} score={} alive={} hash_lo={}",
            nm, r.channel_center, r.score, is_alive(r.flags), state_hash(&r) as u32);
    }
}
