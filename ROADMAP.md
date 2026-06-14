# Flappy Bull — Build Roadmap

> Incremental phases. Each phase ends with a concrete UAT checklist. No phase starts before prior UAT passes.

---

## Phase 0 — Foundation & Spike

**Goal:** Prove every external integration works before building the game.

### Deliverables
- Vite + React + TypeScript project scaffolded
- PixiJS canvas mounted inside React shell, blank 60fps render loop running
- Dual-connection setup: base layer (`rpc.magicblock.app/devnet`) + ER router (`devnet-router.magicblock.app`)
- Wallet connect via Solana wallet-standard adapter (Phantom / Backpack)
- MagicBlock pricing oracle integrated — SOL/USD value polled/subscribed and rendered on screen
- Anchor program skeleton: `GameSession` PDA with `initialize`, `delegate`, `undelegate` instructions
- Full round-trip test: init `GameSession` on base layer → delegate to ER → query `getDelegationStatus` → undelegate back

### UAT
- [x] Page loads; blank PixiJS canvas visible; browser console shows stable 60fps via `requestAnimationFrame`
- [x] Connect wallet button works; wallet address shown in header
- [x] Live SOL/USD price number updates on screen (at least once per second)
- [x] Click "Delegate Test" → transaction signed on base layer → `getDelegationStatus` returns ER endpoint → `GameSession` account visible on ER
- [x] Click "Undelegate" → `GameSession` back on base layer, ER no longer serves it

---

## Phase 1 — Core Game Loop (Local, No Chain)

**Goal:** Playable arcade loop at 60fps, entirely local (no on-chain writes during play).

### Deliverables
- Fixed-point integer physics engine: gravity constant, tap impulse, position/velocity in integer units
- Bull sprite (placeholder art OK) rendered by PixiJS, position driven by physics state
- Static-width price channel (ceiling + floor) rendered as two horizontal bands; channel scrolls right
- Collision detection: Bull touching ceiling or floor → `DEAD` state
- Game states: `IDLE` → `PLAYING` → `DEAD` → `IDLE`
- Score counter: integer ticks survived, displayed in HUD
- Tap/click/spacebar input registered and forwarded to physics loop
- Start screen overlay; death screen overlay with final score

### UAT
- [x] Bull appears on screen; gravity pulls it down without input
- [x] Tap makes Bull jump; repeated taps keep it airborne
- [x] Bull touching channel ceiling → death screen shows with score
- [x] Bull touching channel floor → death screen shows with score
- [x] Score increments every frame while alive; resets to 0 on new run
- [x] Full run cycle (start → play → die → restart) works without page refresh
- [x] Browser DevTools performance tab shows consistent ~60fps; no frame-time spikes above 20ms

---

## Phase 2 — Live Price Channel & Game Feel

**Goal:** Channel driven by real SOL/USD; assists + juice make big moves survivable and fun.

### Deliverables
- Price → pipe center mapping: live SOL/USD fractional digits map to gap center target; lerp-smoothed so center tracks price direction without teleporting
- Obstacle design pivot: horizontal channel bands replaced with scrolling vertical pipes (Flappy Bird style); gap width and center driven by price/volatility
- Volatility state machine: `NORMAL` | `SQUEEZE` | `BREAKOUT` — derived from 30-tick rolling stddev of SOL price
- Dynamic gap width: `channelHalf` lerps between `CHANNEL_HALF_MIN=70` (squeeze) and `CHANNEL_HALF_MAX=130` (breakout)
- Pipe color by volatility: SQUEEZE = amber, BREAKOUT = green, NORMAL = teal; cap lips glow/pulse in squeeze
- Difficulty ramp (`rampT = pipesPassedRef / 30`):
  - Gap bonus: +30px half-width at pipe 0 → 0 by pipe 30 (forgiving onboarding)
  - X-spacing: volatility-driven 240–360px, tightens by 60px at full ramp
  - Center step cap: 90px → 160px (bounded-step prevents teleporting gaps; always reachable)
  - Score = pipes passed (not ticks survived); `pipesPassedRef` drives ramp, not score (coin +50 doesn't spike difficulty)
- Assist mechanics (triggered by price velocity thresholds):
  - **Green Rocket**: strong up-move → reduced/reversed gravity for ~1s
  - **Parachute**: sharp dump → increased air resistance for ~1s
- Golden Coins: 4 spawn on BREAKOUT transition; collecting adds +50 score each
- Visual juice (PixiJS render layer only, no physics impact):
  - Rocket → green particle burst around Bull
  - Dump → dark-red background tint + `!! DUMP !!` siren overlay (fades over 90 ticks)
  - Screen shake on pipe collision death
  - Background tint changes: parachute = dark red, rocket = dark green, squeeze = dark blue

### UAT
- [x] Pipe gap center tracks live SOL/USD (moves follow price direction via lerp)
- [x] During sustained flat period, gap visibly narrows (squeeze state)
- [x] During breakout, gap widens and golden coins spawn and scroll
- [x] After collecting 3+ coins, score reflects +50 each
- [x] Strong pump: green rocket triggers; Bull floats up; green particles burst
- [x] Sharp dump: parachute triggers; Bull descends slowly; siren overlay appears
- [x] Dump → background turns dark red
- [x] Early pipes (first ~10) have wide gaps and generous spacing; game feels easy to start
- [x] Around pipe 30, gaps tighten and center jumps grow — difficulty ramp confirmed
- [x] No pipe is ever unreachable from the previous one (bounded-step guarantee)
- [x] Comfortable score of 20+ achievable by a focused player; 100+ not trivially reached
- [x] Screen shakes on death
- [x] 60fps maintained during juice effects

---

## Phase 3 — Trustless On-Chain Scoring (Single Player, No Live Board)

**Goal:** A complete authenticated run produces a **canonical score the program itself computes** by replaying the run's on-chain inputs, then commits it to the base-layer leaderboard. Zero wallet prompts during play. Anyone can recompute the score from on-chain data and confirm it matches.

> **Pivot — Model A → Model C.** This supersedes the original client-authoritative scoring (PRD §4) and pulls forward trustless scoring (PRD §12). The program becomes the scorekeeper; the client downgrades to a *predictor* that must match an on-chain integer simulator. Verifiable machine = fixed start state + live validator-timestamped tap stream + program-attested price stream → integer-deterministic physics → canonical score.
>
> **Settled architecture:**
> - **Single-source sim via WASM** — one `sim-core` Rust crate compiled to `sbf` (program = replay authority) and `wasm32` (client = 60 fps predictor). No hand-written TS mirror → no cross-language drift.
> - **Lightweight session key** (not the gpl-session program) — throwaway client Keypair; program stores `session_key`; every ER instruction requires `signer == session_key`. ER gasless → no funding. One wallet approval at run start.
> - **On-chain attested price** — program reads a Pyth pull-oracle / MagicBlock real-time pricing-oracle account on the ER (~1 Hz) and stamps it into the log itself; client Hermes HTTP feed demoted to cosmetic.
> - **Live slot-stamped taps** — each tap is a live ER tx the validator timestamps; stale/future ticks rejected → blocks offline-precompute and end-batch-dump bots (real-time aimbot out of scope).
> - **Season physics on-chain** — `SeasonConfig` PDA keyed by `season: u8` holds all integer physics params; both program and client read it.
> - **Minimal verified core (MVP)** — integer physics + price-driven gap center + pipe collision, **score = ticks survived**. Coins dropped; assists + volatility-driven width deferred (cosmetic-only) to a later verifiable increment.

Delivered as four ordered sub-phases (de-risk earliest; 3c is spike-gated).

---

### Phase 3a — Single-source deterministic sim via WASM (off-chain, no chain work)

**Goal:** one canonical integer simulator, written once in Rust, compiled to `sbf` + `wasm32`, proven identical on both.

#### Deliverables
- New workspace crate `sim-core/` — `#![no_std]`, dep-free, pure `fn step(state, season_params, tap_this_tick, price_sample) -> state` over fixed-size scalar state.
- `programs/flappy-bull` depends on `sim-core` (sbf); a `wasm-bindgen` wrapper builds the same crate to wasm32, consumed by the Vite client via `vite-plugin-wasm` + top-level-await.
- Client 60 fps loop calls wasm `step()`; scored math removed from `physics.ts`/`GameCanvas.tsx`/`usePriceChannel.ts`. Cosmetics (particles, shake, siren, coins-as-eye-candy, color) stay in the unverified render layer.
- State layout: fixed ~32-byte scalar struct (`bullY:i32, velY:i32, channelCenter:i32, tick:u32, score:u32, price:i64, flags:u32`); price is `i64`; `step()` pure / IO-free (no Asyncify).
- Determinism rules (lint/test-enforced): no `usize` in sim math; widen intermediates to `i64/i128` then narrow; no float (defer assist `*0.88` → `velY*225>>8`; defer stddev volatility-width); drop `Math.random` coins from score; integer channel lerp; gap center = integer modulo on fixed-point price; pinned truncate-toward-zero division and `<`/`<=` death boundary; no heap in `step()`.
- Golden-vector regression suite: JSON `{season_config,start_state,taps,price_samples,expected:{score,bullY,velY,alive,state_hash}}` run against both builds.

#### UAT
- [ ] `sbf` and `wasm32` builds of `sim-core` produce identical score + `state_hash` on golden + 10k fuzz vectors (incl. boundaries: velocity clamp, tap+death same tick, modulo wrap, longest run)
- [ ] A deliberately-introduced `usize` or float fails the determinism lint/test
- [ ] Game still plays and feels the same in-browser using the wasm predictor
- [ ] No float / `Math.random` / unrounded division reachable from the scored core

---

### Phase 3b — On-chain plumbing: session key + input log + leaderboard + Magic Action

**Goal:** stand up the full account/instruction surface and the commit→leaderboard Magic Action, with `score` still client-set (verifier added in 3d). Proves the MagicBlock wiring independently.

#### Deliverables
- Extend `GameSession`: `season:u8`, `start_slot:u64`, `tick_count:u32`, `verified:bool`. Bump `space`; throwaway PDAs → require re-`initialize`.
- `SeasonConfig` PDA `[b"season", season]`, admin `init_season`, stores all integer physics params.
- `InputLog` PDA `[b"log", player]` (delegated with the session): `taps: Vec<u32>` (tick deltas), `price_samples: Vec<(u32 slot_delta, i64 price_fp)>`; realloc-grow.
- Instructions: `start_run` (stamps `session_key` = ephemeral pubkey, `start_slot`, `season`); `submit_tap` (ER, appends tick, `signer == session_key`); `finish_run` (replaces `undelegate`: `commit_and_undelegate([game_session, input_log]).add_post_commit_actions([update_leaderboard])`).
- `Leaderboard` PDA `[b"top", season]`: `[(player, score, ts); 10]` insertion-sort; `init_leaderboard`; `update_leaderboard` `#[action]` reads committed `GameSession.score`, filters by season.
- Client (`useGameSession.ts`): generate ephemeral `Keypair` at start, sign `start_run`/`submit_tap` on ER, `finish_run` on undelegate. Reuse dual-connection + `GetCommitmentSignature`.

#### UAT
- [ ] Connect wallet → "Start Run" → exactly **one** wallet approval; `session_key` stamped ≠ player wallet
- [ ] `submit_tap` signed by session key succeeds on ER; same tx signed by a different key is rejected
- [ ] After ~30 taps, `InputLog.taps` reflects them; realloc grew the account without error
- [ ] `finish_run` atomically commits + undelegates AND updates the per-season `Leaderboard` in one ER tx (verify via `GetCommitmentSignature` then base read)
- [ ] Insertion-sort correct (11th-best doesn't displace; ties by ts; wrong-season excluded)
- [ ] Error path: if commit fails, retry button appears; score not discarded

---

### Phase 3c — On-chain attested price sampling (external-risk phase — SPIKE FIRST)

**Goal:** replace the client price with a price the program reads on-chain during the run, stamping `(slot, price)` into `InputLog` ~1 Hz so price is attested, not client-claimed.

#### Deliverables
- **Spike gate (devnet, before building):** confirm the MagicBlock real-time pricing-oracle account (Pyth Lazer SOL/USD) is readable from inside an ER instruction, value advances during a run, `get_price_no_older_than` passes staleness, ER `Clock::get()` behaves. Status API `pricing_oracle` Operational for the delegated region.
- `sample_price` ER instruction (or folded into `submit_tap`): `PriceUpdateV2::try_deserialize_unchecked` → `get_price_no_older_than(&Clock, MAX_AGE, &feed_id)` → fixed-point **integer** (apply expo, no float) → append `(slot_delta, price_fp)`.
- Gap-center math fully on-chain-deterministic (integer modulo on fixed-point price). Client scored price source switches from Hermes to on-chain samples; Hermes stays cosmetic ticker only.
- Fallbacks: ER read unavailable → base-layer `sample_price` (~400 ms, gas, coarser cadence); weaker → physics-only verified score (constant gap center), price-attestation deferred.

#### UAT
- [ ] Spike PASS/FAIL recorded before building
- [ ] `price_samples` accumulates ~1/sec with advancing values over a 60 s run
- [ ] Rust (sbf) and wasm integer gap-center agree for the same sample stream
- [ ] A client that lies about price has zero effect — score depends only on program-written `price_samples`

---

### Phase 3d — Live slot-stamped taps + on-chain replay verifier (payoff)

**Goal:** the program recomputes `score` from `(SeasonConfig, InputLog)` and sets it; client score becomes advisory. Slot-binding kills precompute/batch-dump bots.

#### Deliverables
- Slot/tick clock: `TICK_HZ` in `SeasonConfig`; authoritative tick = `floor((Clock.unix_timestamp − start_unix) * TICK_HZ)`; `submit_tap` rejects a claimed tick beyond `±TICK_TOLERANCE`.
- Replay verifier `verify_run` / `verify_chunk` (ER, before commit): iterate ticks via `sim::step` with tap-at-tick + price-at-tick → canonical `score = ticks survived`; set `game_session.score`, `verified = true`; canonical wins over any client claim.
- Chunked verification (built from the start — ~60 s @ 60 Hz ≈ 0.9M CU, near the 1.4M cap): `verify_chunk(start, end)` carries a running `state_hash` + partial score across ER txs (~1–1.5k ticks/chunk); `finish_run` asserts `verified_through == tick_count`.
- Post-run screen: final (verified) score + current leaderboard rank; verified badge.

#### UAT
- [ ] Program-computed score == client-predicted score (verified core)
- [ ] `finish_run` submitted with an inflated `score` → leaderboard shows the canonical (lower) score
- [ ] `InputLog` with impossible-tick taps is rejected at submit time (slot-binding) → never reaches verify
- [ ] Batch-dump attack (all taps in the final ~200 ms) fails the tick spacing/monotonic check → run rejected
- [ ] Chunked path: a 60 s run verifies across K chunks, hash chains correctly, `verified_through == tick_count` enforced before leaderboard write
- [ ] Each verify tx stays under the ER per-tx CU limit with margin
- [ ] Query `Leaderboard` PDA on-chain via Solana Explorer (devnet) → entry matches the verified score the UI shows

---

## Phase 4 — Live Shared Leaderboard & Full Polish

**Goal:** Real-time spectator experience; shareable scores; replay flow; graceful error handling everywhere.

### Deliverables
- Live leaderboard panel: subscribes to ER `GameSession` accounts for all active players; scores update in real time for spectators without refreshing
- Pre-connect play: unauthenticated users can play; score is discarded at game-over with "Connect wallet to save score" prompt
- Share button: generates a URL/image with player rank + score + "I survived X seconds on the SOL chart"
- Replay / re-delegate: after game-over, "Play Again" re-initializes and re-delegates `GameSession` (refreshing the 10-commit quota)
- Leaderboard tabs: "Live" (active ER sessions) and "All-Time" (base-layer top-10)
- Disconnection resilience: ER connection drop → graceful degradation (score still tracked locally; commit on reconnect)
- Responsive layout: playable at 768px width (tablet); 1280px+ is primary target

### UAT
- [ ] Open game in two browser tabs (two different wallets). Tab A plays; Tab B (spectator) sees Tab A's score increment in real time without refreshing
- [ ] Tab B spectator score update latency < 1s from Tab A scoring a coin
- [ ] Open game without connecting wallet → "Play (guest)" → full run completes → death screen says "Connect wallet to save" → no leaderboard entry created
- [ ] Guest → connect wallet mid-session → "Start a new run to save score" flow works cleanly
- [ ] Share button → link opens in new tab → shows correct score and rank
- [ ] Die → click "Play Again" → exactly one wallet approval → new run starts; previous run's score still on leaderboard
- [ ] Simulate ER connection drop (block network in DevTools) mid-run → run continues locally → on reconnect → commit succeeds
- [ ] Game renders correctly at 768px viewport with no horizontal scroll

---

## Completion Criteria (Full v1)

All four phases pass UAT **and**:
- [ ] End-to-end run on devnet: connect → play → live score visible to a spectator → final score on base-layer Leaderboard PDA
- [ ] Zero wallet prompts during an active run
- [ ] Median run is 60fps on a mid-tier laptop browser (Chrome/Firefox)
- [ ] Leaderboard reflects an in-progress score within ~1s for a spectator
