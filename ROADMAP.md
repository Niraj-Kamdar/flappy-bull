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
- Price → channel mapping: live SOL/USD position maps to vertical center of channel; channel scrolls to track it
- Elastic-band camera: sharp pump → camera pans up fast; sharp dump → camera pans down fast
- Dynamic channel width: low-volatility squeeze narrows channel; breakout widens it
- Assist mechanics (triggered by price velocity):
  - **Green Rocket**: strong up-move → reduced/reversed gravity for ~1s
  - **Parachute**: sharp down-move → increased air resistance for ~1s
- Golden Coins: spawn deterministically on breakout events; collecting adds +50 score
- Visual juice (PixiJS render layer only, no physics impact):
  - Pump → fireworks particle burst + green flash
  - Dump → dark-red background tint + siren overlay text
  - Squeeze → channel edges pulse/glow tighter
  - Screen shake on death
- Volatility state machine: `NORMAL` | `SQUEEZE` | `BREAKOUT`

### UAT
- [ ] Channel vertical position tracks live SOL/USD (move obviously follows price direction)
- [ ] During a sustained flat period, channel visibly narrows
- [ ] During a breakout, channel widens and golden coins appear
- [ ] After collecting 3+ coins, score reflects +50 each
- [ ] Simulate pump (or wait for one): green rocket animation triggers; Bull floats up with the camera
- [ ] Simulate dump: parachute animation triggers; Bull descends slowly
- [ ] Pump → fireworks visible on screen
- [ ] Dump → background turns dark red
- [ ] Run that would be instant-death on a violent move is survivable via assists (tester confirms "felt fair")
- [ ] 60fps maintained during juice effects (no drops to <50fps in DevTools)

---

## Phase 3 — On-Chain Score (Single Player, No Live Board)

**Goal:** A complete authenticated run commits a final score to the base-layer leaderboard. Zero wallet prompts during play.

### Deliverables
- Session key: generated client-side at run start; authorized via one wallet approval
- Score streaming to ER: each score milestone (every 100 pts or on coin collect) → session key signs ER write to `GameSession.score` — no wallet popup
- Game-over flow: client detects collision → sends `commit_and_undelegate` → Magic Action `update_leaderboard` executes → `Leaderboard` PDA updated on base layer
- `Leaderboard` PDA: `top: [(player, score, ts); 10]` updated in place (insertion sort)
- Post-run screen: shows final score + current leaderboard rank (read from base layer after commit)
- Error path: if commit fails, show retry button; score not discarded

### UAT
- [ ] Connect wallet → click "Start Run" → exactly **one** wallet approval dialog appears (session key auth)
- [ ] Play entire run (tap, collect coins, die) → zero additional wallet dialogs
- [ ] Death screen appears within 500ms of collision
- [ ] After death screen, wait ~5s → click "View Leaderboard" → player's score appears in the top-10 list (if high enough)
- [ ] Run same flow a second time with a higher score → leaderboard updates with new score
- [ ] Disconnect internet mid-run → crash → commit retry button appears → reconnect → retry succeeds and score lands
- [ ] Query `Leaderboard` PDA on-chain via Solana Explorer (devnet) → entry matches what UI shows

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
