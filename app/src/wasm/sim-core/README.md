# sim-core

The canonical, integer-deterministic physics engine for **Flappy Bull**. One Rust
crate, written once, compiled to three targets so that the browser client and the
on-chain program run *the exact same simulation byte-for-byte*.

## What it does

Flappy Bull uses **trustless scoring** (Model C): the score is not asserted by the
client — it is *replayed and verified* by the on-chain program. For that to work,
the client and the chain must agree on every tick of physics. Any divergence (a
float, a `usize`, a platform-dependent cast) would let the two builds disagree and
break verification.

`sim-core` is that single source of truth:

- **One pure function.** `step(state, config, tap, price_sample) -> state` advances
  the simulation exactly one tick. No I/O, no allocation, no globals, no floats.
- **Three builds from one source.** The same crate compiles to native (dev/test),
  `wasm32` (the 60 fps browser predictor), and `sbf` (the on-chain replay authority).
  No hand-written TypeScript mirror means no cross-language drift.
- **Deterministic hashing.** `state_hash()` is an FNV-1a hash over the explicit
  little-endian bytes of every state field — the fingerprint the client and program
  compare to prove they computed the same run.

State is a fixed 32-byte `repr(C)` struct of scalar integers (`i32`/`u32`/`i64`).
All scored math is integer-only; floats and lossy casts are **denied at compile
time** (`#![deny(clippy::float_arithmetic, clippy::cast_precision_loss)]`).

### Build targets

| Target | Used by | Built with |
|---|---|---|
| native (e.g. `aarch64-apple-darwin`) | dev/test on your machine | `cargo` |
| `wasm32-unknown-unknown` | Vite browser client (60 fps predictor) | `wasm-pack` |
| `sbf` / `bpf` | Anchor on-chain program (replay authority) | `anchor build` |

### Public API

| Item | Purpose |
|---|---|
| `step(state, &cfg, tap, price_sample) -> SimState` | Advance one deterministic tick |
| `init_state(bull_y, channel_center, price) -> SimState` | Fresh alive state |
| `state_hash(&SimState) -> u64` | FNV-1a fingerprint of a state |
| `is_alive(flags)` / `set_dead(flags)` / `FLAG_ALIVE` | Liveness bit helpers |
| `SimState`, `SeasonConfig` | 32-byte state + physics params (`Default` impl) |
| `wasm_*` exports (feature `wasm`) | Flat `#[wasm_bindgen]` wrappers for the JS client |

---

## Setup

```bash
# Rust toolchain (you have it if `cargo` runs)
rustup target add wasm32-unknown-unknown

# wasm-pack — 0.15.x
wasm-pack --version
```

`anchor build` (SBF target) additionally needs the Anchor + Solana toolchain; see
the repo root for that setup. Node.js is required only for the wasm node tests.

---

## Build

### WASM (browser client)

Compiles with `--features wasm`, which enables the `wasm_bindings` module (the
`#[wasm_bindgen]` exports).

```bash
# from repo root
wasm-pack build \
  --target web \
  --out-dir ../app/src/wasm/sim-core \
  sim-core \
  -- \
  --features wasm
```

- **Argument order matters.** `--target` and `--out-dir` come *before* the crate
  path; `--features wasm` goes *after* `--` as extra cargo args.
- **`--out-dir` is relative to the crate dir, not your shell cwd.** wasm-pack joins
  it onto the `sim-core` crate path, so it must be `../app/src/wasm/sim-core`. The
  bare `app/src/wasm/sim-core` would silently write to `sim-core/app/src/wasm/...`.

Output lands in `app/src/wasm/sim-core/` (gitignored — rebuild after cloning or
changing the crate). Verify:

```bash
ls app/src/wasm/sim-core/
# sim_core.js  sim_core_bg.wasm  sim_core_bg.wasm.d.ts  sim_core.d.ts  package.json
```

### SBF (on-chain program)

`sim-core` is a dependency of `programs/flappy-bull` and is compiled to SBF
automatically — with no features, so the `#[cfg(feature = "wasm")]` block is
excluded:

```bash
anchor build
```

---

## Test

### Native — fast, no WASM needed

```bash
# from repo root
cargo test -p sim-core
```

What runs:

- `tests/unit_tests.rs` — 14 physics sub-step tests
- `tests/golden_vectors.rs` — 6 JSON fixtures in `tests/golden/`
- `tests/wasm_identity.rs` — 1 cross-build determinism test (runs as a plain
  `#[test]` natively; see the wasm run below)

Lint — floats/lossy casts are enforced as hard errors:

```bash
cargo clippy -p sim-core -- -D warnings
```

### WASM — cross-build identity check

Re-runs the determinism scenario on `wasm32` and asserts its `state_hash` matches
the native value baked into the test. This is what catches a stray `usize`/float
leaking into the scored path — it would produce a different hash on wasm32 vs
native.

```bash
wasm-pack test --node sim-core --features wasm
```

- **No `--` here.** For `wasm-pack test`, everything after `--` is forwarded to the
  *test runner*, not cargo — so `-- --features wasm` makes the runner fail with an
  unknown-arg error. The crate path and `--features` are positional args to
  `wasm-pack test` directly.
- Requires the `wasm32-unknown-unknown` target and Node.js. Only
  `tests/wasm_identity.rs` runs here; the `unit_tests`/`golden_vectors` `#[test]`s
  report "no tests to run" on wasm32 — that is expected.

> `fuzz/` is scaffolded for a future 10k-vector cross-build fuzz harness but is not
> implemented yet.

---

## Golden vectors

The golden fixtures pin expected `score`/`bull_y`/`vel_y`/`alive`/`state_hash` for
known scenarios. If you change `step()` logic and need to recompute them:

```bash
cargo run -p sim-core --bin gen_golden --features native
```

`--features native` is required — the `gen_golden` bin is gated behind the `native`
feature (the bare command fails with `target 'gen_golden' ... requires the
features: 'native'`). Copy the printed `hash_lo`, `score`, `alive`, etc. into the
matching `tests/golden/*.json`, then re-run `cargo test -p sim-core` to confirm.

---

## Typical workflow after changing sim-core

```bash
# 1. Check logic and lint
cargo clippy -p sim-core -- -D warnings
cargo test -p sim-core

# 2. Cross-build determinism (wasm32 == native hash)
wasm-pack test --node sim-core --features wasm

# 3. Rebuild WASM for the browser client
wasm-pack build --target web --out-dir ../app/src/wasm/sim-core sim-core -- --features wasm

# 4. Confirm the Anchor program still compiles
anchor build

# 5. Play-test
cd app && npm run dev
```
