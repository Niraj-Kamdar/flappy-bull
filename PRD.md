# Flappy Bull: Live Stream — Product Requirements Document

> **Status:** Draft v1 · High-level PRD + high-level architecture
> **Scope:** v1 (MVP). Trustless scoring, staking, and multi-asset are explicitly out of scope (see §12).

---

## 1. Product overview

**Flappy Bull** is a real-time, web-based arcade game where the **live SOL/USD price line
is the safe zone**. Players tap to keep the Bull floating inside a glowing price channel
that scrolls endlessly; touching the overbought ceiling or oversold floor ends the run.
Scores post to a **live, shared on-chain leaderboard** powered by a MagicBlock Ephemeral
Rollup (ER).

**One-liner:** *Flappy Bird, except the candle is the course and the leaderboard is on-chain
and live.*

**Why on-chain / why MagicBlock:** the leaderboard is a shared, real-time social object —
scores update live for all spectators and settle permanently on Solana. The ER gives the
~10–50ms write latency that makes a live shared leaderboard feel real-time, which base-layer
Solana (~400ms) cannot.

---

## 2. Goals & non-goals (v1)

**Goals**
- Fun, juicy, 60fps arcade loop driven by the real SOL/USD price.
- Wallet connect → play → see your score on a **live, shared leaderboard** → settle on Solana.
- Smooth UX: no wallet pop-up per tap (session keys handle the hot path).
- Ship a coherent MVP on **devnet** first.

**Non-goals (v1)**
- Trustless / cheat-proof scoring (this is **social/cosmetic** — see §4).
- Any economy beyond a leaderboard: no staking, wagers, tokens, or payouts.
- Multi-asset (SOL/USD only).
- Mobile-native app (responsive web is enough).

---

## 3. Target users & personas

| Persona | Wants | Implication |
|---|---|---|
| **Crypto-native gamer** | quick dopamine, on-chain bragging rights | wallet-first, live leaderboard, shareable score |
| **Casual web player** | pick-up-and-play arcade fun | playable before/without deep wallet friction; juice & feel matter most |
| **Spectator / degen** | watch the live board, see the market as a game | real-time shared leaderboard is the hook |

---

## 4. Locked decisions

| Decision | Choice | Consequence |
|---|---|---|
| **Trust target** | Social / cosmetic | **Client-authoritative scoring (model A).** No on-chain physics/anti-cheat in v1. |
| **Price source** | MagicBlock **pricing oracle** (SOL/USD) | Client reads price from the oracle; no on-chain price feed needed. |
| **Asset** | **SOL/USD** | The channel is built from live SOL price. |
| **Economy** | **Leaderboard only** | No tokens, stakes, or payouts. |
| **Frontend** | **React (Vite) shell + PixiJS renderer + own fixed-point loop** | React = UI shell only; Pixi = WebGL render; custom rAF loop owns physics. |
| **Network** | **Devnet first** | Mainnet is a later milestone. |

> Note on the fixed-point loop: even though v1 scoring is client-authoritative (so the loop
> doesn't have to match any on-chain authority), we still build the physics in **fixed-point
> integer math** for frame-rate-independent consistency across devices and to keep the door
> open to upgrade to trustless scoring (model C) later without rewriting the core.

---

## 5. User requirements (stories)

- **U1 — Play instantly:** As a player, I can start a run quickly and tap to keep the Bull in the channel.
- **U2 — Connect wallet:** As a player, I can connect a Solana wallet to record scores on-chain.
- **U3 — No tap friction:** As a player, after one approval at round start I never see another wallet pop-up mid-run.
- **U4 — Live leaderboard:** As a player/spectator, I see scores (mine and others') updating in **real time**.
- **U5 — Permanent score:** As a player, my final score is sealed to the Solana base layer leaderboard.
- **U6 — Market-driven juice:** As a player, the game reacts to real market moves (pumps, dumps, low-vol squeeze).
- **U7 — Fair survival:** As a player, violent price moves are survivable via assist mechanics (jetpack/parachute), and only truly extreme moves end the run.
- **U8 — Share:** As a player, I can share my score/rank.

---

## 6. Game mechanics

### 6.1 Core loop — "The Volatility Tunnel"
- The screen shows a scrolling, live-updating **SOL/USD price line** with a glowing **price
  channel** around it (ceiling = overbought, floor = oversold).
- **Tap** to keep the Bull floating **inside** the channel.
- Touch ceiling or floor → **crash** (run ends).
- Score = distance/time survived (+ collected coins, see 6.4).

### 6.2 Dynamic camera & "elastic band" (survivability)
- Canvas scrolls right infinitely; camera auto-centers on the live price.
- On a sharp pump, camera pans up fast; on a dump, it pans down fast.
- **Assists so big moves are fair, not instant-death:**
  - **Green Rocket** — on a strong green candle, brief reduced/reversed gravity to climb with the rising camera.
  - **Parachute** — on a sharp drop, extra floatiness so the Bull doesn't smash the ceiling as the camera drops.
- **Natural game-over:** a move so violent you can't react → "liquidated."

### 6.3 Volatility-driven states (juice)
- **Squeeze:** low volatility → channel narrows → harder.
- **Breakout:** range break → channel widens + spawns Golden Coins.
- **Flash effects:** rapid drop → dark-red background + sirens; pump → fireworks.

### 6.4 Collectibles (cosmetic, score only)
- **Golden Coins** spawn on breakouts; collecting adds score. (v1: deterministic/heuristic
  spawns — provably-fair VRF spawns are a §12 future item.)

### 6.5 Hitbox vs cosmetic boundary (build rule)
- **Physics/hitbox:** gravity, tap impulse, channel bounds, camera→hitbox mapping, jetpack,
  parachute, squeeze-narrowing → in the **fixed-point core**.
- **Cosmetic only:** fireworks, sirens, screen-shake, color, particles → render layer (PixiJS).

---

## 7. System architecture (high level)

```
┌──────────────────────────────────────────────────────────┐
│  CLIENT (browser)                                          │
│  React (Vite) shell ── wallet, menus, HUD, leaderboard UI  │
│  PixiJS renderer ──── tunnel, Bull, particles/juice        │
│  Fixed-point game loop (rAF) ── physics, collision, score  │
│  Session key signer ── signs ER writes, no wallet prompts  │
└───────┬───────────────────────┬───────────────────────────┘
        │ read price             │ stream score (session key)
        ▼                        ▼
┌─────────────────┐     ┌─────────────────────┐  commit+undelegate
│ MagicBlock      │     │  Ephemeral Rollup   │ ───────────────────►┐
│ Pricing Oracle  │     │  (GameSession PDA,  │                     │
│ (SOL/USD)       │     │   live score)       │ ◄── read live board  │
└─────────────────┘     └─────────────────────┘                     ▼
                                                        ┌─────────────────────┐
                                                        │  Solana base layer   │
                                                        │  Leaderboard PDA      │
                                                        │  (Magic Action seal)  │
                                                        └─────────────────────┘
```

### Responsibility split

| Concern | Off-chain (client) | MagicBlock ER | Solana base layer |
|---|---|---|---|
| 60fps render + juice | ✅ PixiJS | | |
| Physics, collision, **score** | ✅ fixed-point loop (authoritative in v1) | | |
| Live SOL/USD price | ✅ reads MagicBlock pricing oracle | | |
| Live in-progress score | pushes via session key | ✅ `GameSession` PDA (delegated) | |
| Real-time shared leaderboard read | ✅ subscribes to ER | ✅ serves live scores | |
| Final score seal | triggers commit | ✅ `commit_and_undelegate` + Magic Action | ✅ `Leaderboard` PDA updated |
| Wallet auth, delegate/undelegate | ✅ real wallet signs | | ✅ delegation on base |

**Key cost note:** ER score-stream writes are cheap ER txns, **not** base-layer commits. A
whole run **commits once** (at game-over), well within the 10 free sponsored commits per
delegation.

---

## 8. Data flow

**Price → render (continuous):**
`MagicBlock pricing oracle → client polls/subscribes SOL/USD → fixed-point loop builds channel → PixiJS draws tunnel + Bull`

**Play → live score (during run):**
`tap → loop updates score → session key signs ER write → GameSession PDA updates → other clients read live board from ER`

**Game-over → permanent score (once):**
`collision detected (client) → client sends settle tx → ER commit_and_undelegate(GameSession) + add_post_commit_actions(update_leaderboard) → Leaderboard PDA updated on base layer`

---

## 9. User flow

1. **Land** → see game + live leaderboard (playable/preview before connecting).
2. **Connect wallet** (base layer, real wallet).
3. **Start run:** create/init `GameSession`, **delegate** it to the ER (base-layer tx), and
   authorize a **session key** for the run — *one* approval.
4. **Play:** tap loop; score streams to ER via session key (no prompts); live board updates for everyone.
5. **Crash:** client finalizes score → `commit_and_undelegate` seals it to the base-layer leaderboard.
6. **Result:** show rank + share; offer replay (next run re-delegates, refreshing commit quota).

---

## 10. Tech stack

| Layer | Choice | Version / notes |
|---|---|---|
| UI shell | React + Vite + TypeScript | menus, wallet, HUD, leaderboard |
| Renderer | PixiJS (WebGL 2D) | tunnel, Bull, particles |
| Game loop | custom `requestAnimationFrame` + fixed-point integer physics | owns simulation |
| Wallet | Solana wallet-standard adapter | base-layer auth + delegate/undelegate |
| Session keys | MagicBlock **Session Key Program** (`KeyspM2ss…`) | no-prompt ER hot path |
| Solana client | `@coral-xyz/anchor` **0.32.1** + legacy `@solana/web3.js` + `@magicblock-labs/ephemeral-rollups-sdk` **0.14.3** | pinned by ER SDK — do **not** use `@solana/kit` |
| On-chain program | Anchor **1.0.2** + `ephemeral-rollups-sdk` **0.14.3** (`anchor` feature), `#[ephemeral]` | delegation + commit + Magic Action |
| Price | MagicBlock **pricing oracle** (SOL/USD) | exact read API confirmed in Phase 0 (§13) |
| Connections | base `rpc.magicblock.app/devnet` · router `devnet-router.magicblock.app` · ER `fqdn` from `getDelegationStatus` | dual-connection |

---

## 11. Data model (high-level PDAs)

```
GameSession   seeds=[b"session", player]        per player; delegated during a run
              { player, score, started_at, alive, session_key, settled }

Leaderboard   seeds=[b"leaderboard"]            global; base layer; top-N
              { top: [(player, score, ts); K] }   updated via Magic Action on settle
```
- `PlayerProfile` (aggregate stats) is optional and may be deferred past v1.
- No `PriceFeed` PDA in v1 — price is a client-side read from the oracle (scoring is client-authoritative).

---

## 12. Out of scope (future milestones)

- **Trustless scoring (model C):** on-chain fixed-point integrator, validator-timestamped
  `flap`/`tick`, replay-settle — needed only if scores ever back prizes/wagers.
- **Economy:** staking, entry fees, token rewards, payouts (via Magic Actions / Ephemeral SPL).
- **VRF Golden Coins:** provably-fair spawn positions (`DEFAULT_EPHEMERAL_QUEUE`).
- **Multi-asset:** BTC, ETH, memecoins as selectable courses.
- **Mainnet launch.**

---

## 13. Open questions

1. **Pricing oracle read API** — confirm exactly how the client reads SOL/USD from MagicBlock's
   pricing oracle (account to poll, endpoint, or WS), and its update cadence. *Owner: Phase 0 spike.*
2. **Live-leaderboard scope** — full real-time streaming (uses ER's strength; needs session
   keys) vs. simpler "final score only" (ER barely used). *Recommendation: streaming — it's the
   differentiator. Falls back cleanly if cadence/cost surprises.*
3. **Pre-connect play** — allow playing before wallet connect (score discarded), or gate play
   behind connect? *Recommendation: allow play; gate only score submission.*
4. **Leaderboard size & reset** — top-N value of K, and all-time vs. periodic (daily/seasonal) boards.

---

## 14. Success metrics (v1)

- A connected player completes: connect → play → live score visible to others → final score on base-layer leaderboard.
- No wallet prompt during an active run (only at round start).
- Live leaderboard reflects an in-progress score within ~sub-second of a milestone.
- Median run feels 60fps with juice on a typical laptop browser.

---

## 15. Suggested build phases

| Phase | Delivers | Done when |
|---|---|---|
| **0 — Spike** | Confirm pricing-oracle read; bootstrap Vite+React+Pixi; dual connection + delegate round-trip | a delegated `GameSession` round-trips base→ER→base on devnet; SOL/USD renders |
| **1 — Core game** | Fixed-point loop, tunnel/Bull/collision, camera + assists, juice | a full local run plays at 60fps and produces a score |
| **2 — On-chain leaderboard** | `GameSession` delegate + session-key score stream + `commit_and_undelegate` + `Leaderboard` Magic Action | a run's final score lands on the base-layer leaderboard |
| **3 — Live & polish** | Real-time shared leaderboard read, share, replay-redelegate, error/edge handling | spectators see live scores; replay refreshes commit quota |
```
