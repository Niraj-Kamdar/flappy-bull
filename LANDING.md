# LANDING.md — Flappy Bull Landing Page Content & Design Spec

## Theme Direction

**Concept:** Arcade cabinet from the future, running on Solana.

Imagine a 90s neon arcade dropped inside a DeFi trading terminal. Dark background (deep space black `#050510`), electric neon accents — SOL purple `#9945FF`, breakout green `#14F195`, dump red `#FF3B5C`, squeeze amber `#F5A623`. Scanlines, CRT glow, pixel font headings alongside clean modern sans for body. Subtle animated price chart in the background, forever scrolling. The Bull sprite floats in the hero, flapping between pipes.

**Tone:** Punchy. Irreverent. Crypto-native but instantly legible to any gamer. No jargon walls. Short sentences. Big words. Visceral.

**Font stack:**
- Headings: `Press Start 2P` (pixel, game-cabinet energy)
- Sub-headings: `Space Grotesk Bold` (modern, tech)
- Body: `Inter` (clean, readable)

---

## Page Structure & Copy

---

### SECTION 1 — Hero

**Tag (floating above headline, glowing pill):**
> `⚡ LIVE ON SOLANA`

**Headline (massive, pixel font, gradient from SOL purple → green):**
> FLAPPY BULL

**Sub-headline:**
> The SOL chart IS the course.

**Body (1 line, center):**
> Tap to survive. The market decides if you live.

**CTA buttons:**
> `[ PLAY NOW ]` ← primary, neon green, pulsing glow
> `[ VIEW LEADERBOARD ]` ← secondary, outlined purple

**Hero visual:**
- Full-width animated canvas: Bull sprite navigating scrolling pipes. Pipes tinted by market volatility (amber = squeeze, green = breakout, teal = normal). Live SOL/USD ticker in top corner updating in real-time. Subtle CRT scanline overlay. Background scrolls dark green on pumps, dark red on dumps.

**Atmosphere:**
- Background: deep dark with subtle star field + faint animated candlestick chart
- Ambient coin jingle / 8-bit SFX on load (muted by default, toggle)
- Score counter clicking upward like an old arcade machine

---

### SECTION 2 — What Is Flappy Bull?

**Section label (small caps, neon amber):**
> `// WHAT IS THIS THING`

**Headline:**
> Flappy Bird Ate a SOL Candle and Lived to Tell the Tale.

**Body:**
> Flappy Bull is a real-time arcade game where the live **SOL/USD price line is the course itself**.
>
> The market pumps? Your ceiling rises. SOL dumps? The floor caves. Low volatility squeezes the channel to a knife's edge. Breakout? Coins rain down.
>
> One tap = one flap. Touch the walls and you're **liquidated**.

**3-column visual explainer (icon + label + 1-line desc):**

| | | |
|---|---|---|
| `[bull icon]` **THE BULL** | `[chart icon]` **THE CHANNEL** | `[coin icon]` **THE LEADERBOARD** |
| Tap to flap. Gravity is always pulling. | Live SOL/USD price shapes every gap. | Your score lives on-chain. Forever. |

---

### SECTION 3 — How It's Different (vs Classic Flappy Bird)

**Section label:**
> `// NOT YOUR GRANDMA'S FLAPPY BIRD`

**Headline:**
> Same one button. Completely different everything else.

**Comparison table — rendered as two-column arcade scoreboard style:**

| CLASSIC FLAPPY BIRD | FLAPPY BULL |
|---|---|
| Static, pre-set pipes | Pipes shaped by live SOL/USD market data |
| Same every run | Every run is different — the market decides |
| Dies and it's over | Score settles permanently on Solana |
| Local leaderboard, if any | Shared live on-chain leaderboard — spectate anyone, anytime |
| No stakes | Market volatility = difficulty. Pumps and dumps change physics |
| Random | Deterministic, verifiable — the chain replays your run |
| Forgettable | Bragging rights sealed on-chain |

**Pull quote / callout box (neon green border):**
> "The price feed IS the game engine. No two runs are alike. Ever."

---

### SECTION 4 — Game Mechanics Deep Cut

**Section label:**
> `// UNDER THE HOOD (FOR DEGENS)`

**Headline:**
> Market volatility = difficulty. Literally.

**Cards (3-up, dark glass morphism style):**

**Card 1 — SQUEEZE MODE** `[amber glow border]`
> SOL goes flat. The channel narrows to a razor gap. One bad tap and you're rekt. This is the low-vol grind. Amber pipes. Tight margins. Pure skill.

**Card 2 — BREAKOUT MODE** `[green glow border]`
> SOL moves hard. The channel explodes open. Golden coins spawn. It's free money — if you can grab it without flying into the walls.

**Card 3 — ASSISTS** `[purple glow border]`
> Big pump? **Rocket mode** — reduced gravity, float like you're on the moon.
> Sharp dump? **Parachute** — air resistance kicks in, you drift slow. The market tries to kill you. The game gives you one last chance.

---

### SECTION 5 — Trustless Scoring

**Section label:**
> `// THE CHAIN DOESN'T LIE`

**Headline:**
> You can't fake your score. The blockchain replays your run.

**Body:**
> Most on-chain games trust the client. We don't.
>
> Flappy Bull uses a **single physics engine** — written once in Rust — that runs identically in your browser (via WebAssembly) and on the Solana program (via on-chain replay). When your run ends, the on-chain program replays every tap and every price tick you experienced. The score it computes is **canonical**. The client can lie. The chain won't care.
>
> Zero wallet prompts during your run. One approval at the start — a throwaway session key handles everything else. No popups. No friction. Just play.

**Technical badges (pill tags):**
> `Rust sim-core` · `WebAssembly` · `Solana SBF` · `MagicBlock Ephemeral Rollup` · `Pyth Oracle` · `Session Keys`

---

### SECTION 6 — Live Leaderboard

**Section label:**
> `// HALL OF DEGENS`

**Headline:**
> The leaderboard is live. The scores are real. The chain is the judge.

**Body:**
> Scores stream to a **shared real-time leaderboard** as players tap. Spectate anyone in real-time. When a run ends, the final score commits permanently to Solana. Top 10 all-time, per season. Can you dethrone the bull whisperers?

**[LIVE LEADERBOARD EMBED]**
> — Real-time top-10 widget here, pulling from on-chain Leaderboard PDA —
> Columns: RANK | PLAYER | SCORE | DATE

**CTA:**
> `[ PLAY AND CLAIM YOUR SPOT ]`

---

### SECTION 7 — Roadmap

**Section label:**
> `// WHAT'S NEXT`

**Headline:**
> This is just the beginning of the run.

**Timeline — vertical arcade-style progress bar, neon checkmarks for done:**

**`[✓] SEASON 0 — GENESIS`**
> Core game live. Flap or die. Leaderboard on-chain. Real market, real scores.

**`[→] SEASON 1 — PHYSICS ROOMS`**
> Different rooms, different physics. High gravity rooms. Moon gravity rooms. Speed rooms. Each room its own chaos. Room-by-room leaderboards — rule your room.

**`[→] SEASON 2 — THE AD VAULT`**
> Background assets become NFTs. Brands, protocols, and partners lease visual space inside the game world — billboards, pipe skins, background panels. Visible to every player in every run. The game world becomes a living ad network owned by the community.

**`[→] SEASON 3 — BULL REWARDS`**
> Players earn. Top performers, daily grinders, season champions — rewards flow on-chain. The leaderboard becomes a money game.

**`[→] SEASON 4 — SEEKER & BEYOND`**
> Launch on Seeker and additional platforms. More assets. More markets. Let ETH/USD have a turn. The bull runs everywhere.

---

### SECTION 8 — Tech Stack (For the Curious)

**Section label:**
> `// BUILT DIFFERENT`

**Headline:**
> 60fps. On-chain. Real-time. No compromise.

**Stack grid (dark glass cards):**

| Layer | Tech |
|---|---|
| Renderer | PixiJS — WebGL 2D, 60fps |
| Physics | `sim-core` — Rust → WASM (browser) + SBF (chain) |
| Chain | Solana + MagicBlock Ephemeral Rollup |
| Price | Pyth Oracle via MagicBlock real-time pricing |
| Sessions | Throwaway keypair — no wallet mid-run |
| Framework | React + Vite + Anchor |

> One Rust crate. Three targets. Identical output. That's the trick.

---

### SECTION 9 — Footer

**Built with love by:**
> **Metasquare Studio**
> Building games at the intersection of on-chain infrastructure and arcade culture.

**Links:**
> `[Play]` · `[Leaderboard]` · `[GitHub]` · `[Twitter/X]` · `[Discord]`

**Legal micro-copy:**
> Flappy Bull is a game. It does not constitute financial advice. SOL/USD data used for gameplay only.

**Program ID badge (monospace, dim):**
> `Program: HvwtseJuzu9XzWQ9Xh323BTVqvwpywHz16PAduoQs8vS (devnet)`

---

## Visual Design Tokens

```
Colors
  background:     #050510  (deep space)
  surface:        #0D0D2B  (dark card)
  neon-purple:    #9945FF  (SOL brand, headings, borders)
  neon-green:     #14F195  (SOL brand, CTAs, breakout)
  neon-amber:     #F5A623  (squeeze state, warnings)
  neon-red:       #FF3B5C  (dump state, danger)
  neon-teal:      #00C2C7  (normal state, body accents)
  text-primary:   #F0F0FF
  text-secondary: #8888BB

Typography
  display:  Press Start 2P, 48–96px, gradient fill
  heading:  Space Grotesk Bold, 24–40px
  body:     Inter Regular, 16–18px, 1.6 line-height
  mono:     JetBrains Mono, program IDs, tech badges

Effects
  glow:        box-shadow 0 0 20px currentColor at 40% opacity
  scanlines:   repeating-linear-gradient overlay, 2px lines, 3% opacity
  crt-vignette: radial gradient darkening edges
  glass-card:  background rgba(13,13,43,0.8), backdrop-filter blur(12px), border 1px rgba(153,69,255,0.3)
  animate:     subtle float on Bull (translateY sinusoidal), price ticker scroll, pulsing CTA
```

## Animation Notes

- Hero Bull: infinite float loop, slight rotation on "flap" every 2s
- Background chart: scrolling left, faint, creates motion depth
- Price ticker: live feed if wallet connected; demo feed otherwise
- CTA button: pulse glow on hover, scale 1.02
- Roadmap items: reveal on scroll (intersection observer, slide-up)
- Leaderboard rows: flash highlight on new entry
- Section transitions: fade-in on scroll, no heavy parallax (perf)

## Mobile Considerations

- Hero text scales down to 32px display, 20px sub-head
- 3-column comparisons collapse to single column accordion
- Leaderboard table horizontally scrollable
- CTA buttons full-width below 480px
- Game canvas preview replaced with static screenshot on mobile
- Bottom sticky bar: `[ PLAY NOW ]` always visible on scroll

## SEO / Meta

```
title:       Flappy Bull — The SOL Chart is the Game
description: Tap to survive the live SOL/USD price channel. Real-time arcade game on Solana with on-chain leaderboard powered by MagicBlock Ephemeral Rollups.
og:image:    /og-flappy-bull.png  (Bull mid-flight, neon pipes, leaderboard visible)
twitter:card: summary_large_image
```
