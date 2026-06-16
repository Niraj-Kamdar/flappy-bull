import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import {
  CANVAS_W,
  CANVAS_H,
  BULL_X,
  BULL_RADIUS,
  SCALE,
  SCROLL_SPEED,
  GRID_SPACING,
  PUMP_VEL_THRESHOLD,
  DUMP_VEL_THRESHOLD,
  ASSIST_TICKS,
  PIPE_SPACING_MAX,
  PIPE_WIDTH,
} from "../game/constants";
import { initState, applyTap, GameState } from "../game/physics";
import {
  initSimCore,
  wasm_step,
  wasm_init_state,
  getSimConfig,
  WasmSimState,
  WasmSeasonConfig,
  isAlive,
  priceToLo,
  priceToHi,
  effectivePrice,
} from "../game/simCore";
import { usePriceChannel, PriceChannelState, VolatilityState } from "../hooks/usePriceChannel";
import type { GamePhase } from "../hooks/useGameSession";

type Props = {
  price: number | null;
  sessionPhase: GamePhase;
  submitFrame: (tick: number, tap: boolean, priceLo: number, priceHi: number) => void;
  finishRun: () => Promise<void>;
  canvasW?: number;
  canvasH?: number;
};

type Coin = { x: number; y: number; collected: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: number };
// Render-only pipe, derived each tick from the authoritative wasm sim state.
type Pipe = { x: number; gapCenterY: number; gapHalf: number; vol: VolatilityState };

const EMPTY_PIPE = -2147483648; // i32::MIN sentinel from sim-core

function pipeColors(vol: VolatilityState): { body: number; cap: number; edge: number } {
  if (vol === "SQUEEZE") return { body: 0x3a3000, cap: 0x5a4800, edge: 0xffaa00 };
  if (vol === "BREAKOUT") return { body: 0x003a1a, cap: 0x005a2a, edge: 0x00ff88 };
  return { body: 0x1a3a3a, cap: 0x2a5a5a, edge: 0x4488aa };
}

export function GameCanvas({ price, sessionPhase, submitFrame, finishRun, canvasW = CANVAS_W, canvasH = CANVAS_H }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // TS game state: phase transitions + cosmetic assists only
  const tsStateRef = useRef<GameState>(initState(canvasH));

  // WASM authoritative sim state
  const wasmStateRef = useRef<WasmSimState | null>(null);
  const wasmCfgRef = useRef<WasmSeasonConfig | null>(null);
  const wasmReadyRef = useRef(false);

  const scrollOffsetRef = useRef(0);
  const priceRef = useRef<number | null>(price);
  priceRef.current = price;

  const channelStateRef = useRef<PriceChannelState>({
    channelHalf: 75,
    pipeSpacing: PIPE_SPACING_MAX,
    volatilityState: "NORMAL",
    priceVelocity: 0,
  });
  const liveChannelState = usePriceChannel(price);
  channelStateRef.current = liveChannelState;

  // On-chain callbacks (from shared session via props)
  const submitFrameRef = useRef(submitFrame);
  submitFrameRef.current = submitFrame;
  const finishRunRef = useRef(finishRun);
  finishRunRef.current = finishRun;
  const sessionPhaseRef = useRef(sessionPhase);
  sessionPhaseRef.current = sessionPhase;
  // Track if we already called finishRun for current run
  const finishCalledRef = useRef(false);

  const pendingTapRef = useRef(false);
  const pendingAssistRef = useRef<"rocket" | "parachute" | null>(null);
  const prevVolStateRef = useRef<VolatilityState>("NORMAL");
  const shakeTicksRef = useRef(0);
  const pulseCounterRef = useRef(0);
  const sirenFadeRef = useRef(0);
  const prevWasDeadRef = useRef(false);

  // Init wasm on mount
  useEffect(() => {
    initSimCore().then(() => {
      const cfg = getSimConfig();
      cfg.canvas_h_px = canvasH;
      cfg.canvas_w_px = canvasW;
      wasmCfgRef.current = cfg;
      const mid = (canvasH / 2) * SCALE;
      wasmStateRef.current = wasm_init_state(mid, mid, 0, 0);
      wasmReadyRef.current = true;
    }).catch((e) => console.error("[DBG] wasm init FAILED", e));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const app = new PIXI.Application();
    let mounted = true;
    let initialized = false;

    app
      .init({
        width: canvasW,
        height: canvasH,
        resolution: window.devicePixelRatio ?? 1,
        autoDensity: true,
        background: "#0a0a14",
      })
      .then(() => {
        if (!mounted) {
          app.destroy(true);
          return;
        }
        initialized = true;
        container.appendChild(app.canvas);

        const bgGraphics = new PIXI.Graphics();
        app.stage.addChild(bgGraphics);

        const pipeGraphics = new PIXI.Graphics();
        app.stage.addChild(pipeGraphics);

        const particleGfx = new PIXI.Graphics();
        app.stage.addChild(particleGfx);

        const coinGfx = new PIXI.Graphics();
        app.stage.addChild(coinGfx);

        const bullGfx = new PIXI.Graphics();
        bullGfx.circle(0, 0, BULL_RADIUS);
        bullGfx.fill({ color: 0xffcc00 });
        bullGfx.x = BULL_X;
        app.stage.addChild(bullGfx);

        const scoreText = new PIXI.Text({
          text: "FPS: -- | Score: 0",
          style: { fill: "#00ff88", fontSize: 14, fontFamily: "monospace" },
        });
        scoreText.x = 10;
        scoreText.y = 10;
        app.stage.addChild(scoreText);

        const priceText = new PIXI.Text({
          text: "SOL: --",
          style: { fill: "#ffcc00", fontSize: 14, fontFamily: "monospace" },
        });
        priceText.x = canvasW - 140;
        priceText.y = 10;
        app.stage.addChild(priceText);

        const sirenText = new PIXI.Text({
          text: "!! DUMP !!",
          style: { fill: "#ff4444", fontSize: 28, fontFamily: "monospace", fontWeight: "bold" },
        });
        sirenText.anchor.set(0.5);
        sirenText.x = canvasW / 2;
        sirenText.y = 60;
        sirenText.visible = false;
        app.stage.addChild(sirenText);

        const overlayContainer = new PIXI.Container();
        app.stage.addChild(overlayContainer);

        const overlayBg = new PIXI.Graphics();
        overlayBg.rect(0, 0, canvasW, canvasH);
        overlayBg.fill({ color: 0x000000, alpha: 0.55 });
        overlayContainer.addChild(overlayBg);

        const overlayTitle = new PIXI.Text({
          text: "TAP TO FLY",
          style: { fill: "#ffffff", fontSize: 36, fontFamily: "monospace", fontWeight: "bold" },
        });
        overlayTitle.anchor.set(0.5);
        overlayTitle.x = canvasW / 2;
        overlayTitle.y = canvasH / 2 - 20;
        overlayContainer.addChild(overlayTitle);

        const overlaySubtext = new PIXI.Text({
          text: "",
          style: { fill: "#aaaaaa", fontSize: 20, fontFamily: "monospace" },
        });
        overlaySubtext.anchor.set(0.5);
        overlaySubtext.x = canvasW / 2;
        overlaySubtext.y = canvasH / 2 + 30;
        overlayContainer.addChild(overlaySubtext);

        const coins: Coin[] = [];
        const particles: Particle[] = [];

        // Derive the on-screen pipes straight from the authoritative wasm state,
        // so what is drawn is exactly what the sim collides against.
        function wasmPipes(ws: WasmSimState, gapHalfPx: number, vol: VolatilityState): Pipe[] {
          const xs = [ws.pipe0_x, ws.pipe1_x, ws.pipe2_x, ws.pipe3_x];
          const gaps = [ws.pipe0_gap, ws.pipe1_gap, ws.pipe2_gap, ws.pipe3_gap];
          const out: Pipe[] = [];
          for (let i = 0; i < 4; i++) {
            if (xs[i] === EMPTY_PIPE) continue;
            out.push({ x: xs[i] / SCALE, gapCenterY: gaps[i] / SCALE, gapHalf: gapHalfPx, vol });
          }
          return out;
        }

        function drawBg(scrollOffset: number, bgColor: number) {
          bgGraphics.clear();
          bgGraphics.rect(0, 0, canvasW, canvasH);
          bgGraphics.fill({ color: bgColor });
          bgGraphics.setStrokeStyle({ width: 1, color: 0x1a1a2e });
          const startX = -(scrollOffset % GRID_SPACING);
          for (let x = startX; x < canvasW; x += GRID_SPACING) {
            bgGraphics.moveTo(x, 0);
            bgGraphics.lineTo(x, canvasH);
          }
          bgGraphics.stroke();
        }

        function drawPipes(pipeList: Pipe[], pulse: number) {
          pipeGraphics.clear();
          for (const pipe of pipeList) {
            const { body, cap, edge } = pipeColors(pipe.vol);
            const gapTop = pipe.gapCenterY - pipe.gapHalf;
            const gapBot = pipe.gapCenterY + pipe.gapHalf;
            const capH = 12;

            if (gapTop > capH) {
              pipeGraphics.rect(pipe.x, 0, PIPE_WIDTH, gapTop - capH);
              pipeGraphics.fill({ color: body });
            }
            pipeGraphics.rect(pipe.x - 4, gapTop - capH, PIPE_WIDTH + 8, capH);
            pipeGraphics.fill({ color: cap });

            pipeGraphics.rect(pipe.x - 4, gapBot, PIPE_WIDTH + 8, capH);
            pipeGraphics.fill({ color: cap });
            if (gapBot + capH < canvasH) {
              pipeGraphics.rect(pipe.x, gapBot + capH, PIPE_WIDTH, canvasH - gapBot - capH);
              pipeGraphics.fill({ color: body });
            }

            const alpha =
              pipe.vol === "SQUEEZE" ? 0.4 + 0.35 * Math.sin(pulse * 0.15) : 0.75;
            pipeGraphics.setStrokeStyle({ width: 2, color: edge, alpha });
            pipeGraphics.moveTo(pipe.x - 4, gapTop - capH);
            pipeGraphics.lineTo(pipe.x + PIPE_WIDTH + 4, gapTop - capH);
            pipeGraphics.stroke();
            pipeGraphics.moveTo(pipe.x - 4, gapBot + capH);
            pipeGraphics.lineTo(pipe.x + PIPE_WIDTH + 4, gapBot + capH);
            pipeGraphics.stroke();
          }
        }

        const onTap = () => {
          const prev = tsStateRef.current;
          const sessPhase = sessionPhaseRef.current;

          // Gate: don't start game unless on-chain session is PLAYING
          if (prev.phase === "IDLE" && sessPhase !== "PLAYING") {
            return; // Overlay handles onboarding
          }

          // Gate: don't restart while session is settling
          if (prev.phase === "DEAD" && (sessPhase === "FINISHING" || sessPhase === "SETTLING")) {
            return;
          }

          // Drain into TS state for phase transitions (IDLE→PLAYING, DEAD→IDLE)
          tsStateRef.current = applyTap(tsStateRef.current, canvasH);
          console.log("[DBG] tap:", prev.phase, "->", tsStateRef.current.phase, "sess=", sessPhase, "wasmReady=", wasmReadyRef.current);

          if (prev.phase === "DEAD" && tsStateRef.current.phase === "IDLE") {
            // Restart: reset wasm state with price=0 to match on-chain start_run
            if (wasmReadyRef.current && wasmCfgRef.current) {
              const mid = (canvasH / 2) * SCALE;
              wasmStateRef.current = wasm_init_state(mid, mid, 0, 0);
            }
          } else if (prev.phase === "IDLE" && tsStateRef.current.phase === "PLAYING") {
            // First tap: init wasm with price=0 to match on-chain start_run
            if (wasmReadyRef.current && wasmCfgRef.current) {
              const mid = (canvasH / 2) * SCALE;
              wasmStateRef.current = wasm_init_state(mid, mid, 0, 0);
            }
          }

          pendingTapRef.current = true;
        };

        app.canvas.addEventListener("pointerdown", onTap);
        const onKey = (e: KeyboardEvent) => {
          if (e.code === "Space") onTap();
        };
        window.addEventListener("keydown", onKey);

        let dbgFrame = 0;
        let dbgErrored = false;
        app.ticker.add(() => {
         try {
          const { channelHalf, volatilityState, priceVelocity } = channelStateRef.current;
          const tsPhase = tsStateRef.current.phase;
          const assist = tsStateRef.current.assist;

          // On restart (DEAD→IDLE), clear cosmetics
          if (prevWasDeadRef.current && tsPhase === "IDLE") {
            coins.length = 0;
            particles.length = 0;
            finishCalledRef.current = false;
          }

          // Drain pending tap flag
          const tap = pendingTapRef.current;
          pendingTapRef.current = false;

          // ── WASM authoritative step ──────────────────────────────────────
          let bullYPx = (canvasH / 2);
          let channelCenterPx = (canvasH / 2);
          let wasmScore = 0;
          let wasmAlive = false;
          let tickBeforeStep = 0;

          if (wasmReadyRef.current && wasmCfgRef.current && wasmStateRef.current && tsPhase === "PLAYING") {
            const p = effectivePrice(priceRef.current);
            const pLo = priceToLo(p);
            const pHi = priceToHi(p);
            tickBeforeStep = wasmStateRef.current.tick;
            wasm_step(wasmStateRef.current, wasmCfgRef.current, tap, pLo, pHi);
            const ws = wasmStateRef.current;
            if (dbgFrame < 3) console.log("[DBG] post-step f=", dbgFrame, "bull_y=", ws.bull_y, "flags=", ws.flags, "score=", ws.score, "p0x=", ws.pipe0_x, "p0gap=", ws.pipe0_gap);
            if (dbgFrame % 60 === 0) console.log("[DBG] tick=", ws.tick, "p=", p, "pLo=", pLo, "center=", ws.channel_center,
              "gaps=", ws.pipe0_gap, ws.pipe1_gap, ws.pipe2_gap, ws.pipe3_gap,
              "xs=", ws.pipe0_x, ws.pipe1_x, ws.pipe2_x, ws.pipe3_x);
            dbgFrame++;
            bullYPx = ws.bull_y / SCALE;
            channelCenterPx = ws.channel_center / SCALE;
            wasmScore = ws.score;
            wasmAlive = isAlive(ws.flags);

            // Strict-nonce streaming: submit EVERY tick contiguously, including
            // the fatal one (the step that killed the bull). The program applies
            // the identical input stream in order and dies at the same tick, so
            // the committed score matches. Skipping ticks would stall the chain.
            submitFrameRef.current(tickBeforeStep, tap, pLo, pHi);

            // Propagate death to TS phase
            if (!wasmAlive && tsPhase === "PLAYING") {
              const ceil = wasmCfgRef.current.bull_radius_px * wasmCfgRef.current.scale;
              const floor = (wasmCfgRef.current.canvas_h_px - wasmCfgRef.current.bull_radius_px) * wasmCfgRef.current.scale;
              console.log("[DBG] DEATH tick=", ws.tick, "bull_y=", ws.bull_y, "ceil=", ceil, "floor=", floor,
                "p0x=", ws.pipe0_x, "p1x=", ws.pipe1_x, "p2x=", ws.pipe2_x, "p3x=", ws.pipe3_x, "tapThisFrame=", tap);
              tsStateRef.current = { ...tsStateRef.current, phase: "DEAD" };
              shakeTicksRef.current = 30;

              // Fire on-chain finishRun (async)
              if (!finishCalledRef.current) {
                finishCalledRef.current = true;
                finishRunRef.current();
              }
            }
          } else if (wasmStateRef.current) {
            bullYPx = wasmStateRef.current.bull_y / SCALE;
            channelCenterPx = wasmStateRef.current.channel_center / SCALE;
            wasmScore = wasmStateRef.current.score;
          }

          scrollOffsetRef.current = (scrollOffsetRef.current + SCROLL_SPEED) % GRID_SPACING;

          // ── Cosmetic assist detection (visual only) ─────────────────────
          if (tsPhase === "PLAYING") {
            if (priceVelocity >= PUMP_VEL_THRESHOLD && assist === "none" && pendingAssistRef.current === null) {
              pendingAssistRef.current = "rocket";
            }
            if (priceVelocity <= DUMP_VEL_THRESHOLD && assist === "none" && pendingAssistRef.current === null) {
              pendingAssistRef.current = "parachute";
            }
            if (pendingAssistRef.current && assist === "none") {
              const assistType = pendingAssistRef.current;
              tsStateRef.current = { ...tsStateRef.current, assist: assistType, assistTicks: ASSIST_TICKS };
              pendingAssistRef.current = null;
              if (assistType === "rocket") {
                for (let i = 0; i < 12; i++) {
                  const angle = (i / 12) * Math.PI * 2;
                  particles.push({ x: BULL_X, y: bullYPx, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 1.0, color: 0x00ff88 });
                }
              }
              if (assistType === "parachute") {
                sirenText.visible = true;
                sirenFadeRef.current = 90;
              }
            }
            // Tick down assist
            if (tsStateRef.current.assistTicks > 0) {
              const newTicks = tsStateRef.current.assistTicks - 1;
              tsStateRef.current = {
                ...tsStateRef.current,
                assistTicks: newTicks,
                assist: newTicks === 0 ? "none" : tsStateRef.current.assist,
              };
            }
          }

          // ── Cosmetic coin spawn on BREAKOUT (visual only; score from wasm) ──
          if (tsPhase === "PLAYING") {
            if (volatilityState === "BREAKOUT" && prevVolStateRef.current !== "BREAKOUT") {
              for (let i = 0; i < 4; i++) {
                const spread = (channelHalf - 20) * (2 * Math.random() - 1);
                coins.push({ x: canvasW + i * 90, y: channelCenterPx + spread, collected: false });
              }
            }
          }
          prevVolStateRef.current = volatilityState;

          // Coin scroll + collection (cosmetic; score comes from wasm)
          for (const c of coins) {
            if (c.collected) continue;
            c.x -= SCROLL_SPEED;
            if (
              tsPhase === "PLAYING" &&
              Math.abs(c.x - BULL_X) < BULL_RADIUS * 2 &&
              Math.abs(c.y - bullYPx) < BULL_RADIUS * 2
            ) {
              c.collected = true;
            }
          }
          while (coins.length && coins[0].x < -20) coins.shift();

          // ── Render ──────────────────────────────────────────────────────
          const currentAssist = tsStateRef.current.assist;
          const bgColor =
            currentAssist === "parachute" ? 0x140004 :
            currentAssist === "rocket"    ? 0x04140a :
            volatilityState === "SQUEEZE" ? 0x0a0a18 : 0x0a0a14;

          drawBg(scrollOffsetRef.current, bgColor);
          pulseCounterRef.current++;
          const renderPipes =
            wasmStateRef.current && wasmCfgRef.current
              ? wasmPipes(wasmStateRef.current, wasmCfgRef.current.channel_half_min, volatilityState)
              : [];
          drawPipes(renderPipes, pulseCounterRef.current);

          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 1 / 30;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
          }
          particleGfx.clear();
          for (const p of particles) {
            particleGfx.circle(p.x, p.y, 3 * p.life);
            particleGfx.fill({ color: p.color, alpha: p.life });
          }

          coinGfx.clear();
          for (const c of coins) {
            if (c.collected) continue;
            const r = 8;
            coinGfx.poly([c.x, c.y - r, c.x + r, c.y, c.x, c.y + r, c.x - r, c.y]);
            coinGfx.fill({ color: 0xffcc00 });
          }

          bullGfx.y = bullYPx;
          scoreText.text = `FPS: ${Math.round(app.ticker.FPS)} | Score: ${wasmScore}`;
          const p = effectivePrice(priceRef.current);
          priceText.text = `SOL: $${p.toFixed(2)}`;

          if (sirenFadeRef.current > 0) {
            sirenText.alpha = Math.min(1, sirenFadeRef.current / 20);
            sirenFadeRef.current--;
          } else {
            sirenText.visible = false;
          }

          if (shakeTicksRef.current > 0) {
            const intensity = 6 * (shakeTicksRef.current / 30);
            app.stage.x = (Math.random() - 0.5) * 2 * intensity;
            app.stage.y = (Math.random() - 0.5) * 2 * intensity;
            shakeTicksRef.current--;
          } else {
            app.stage.x = 0;
            app.stage.y = 0;
          }

          prevWasDeadRef.current = tsPhase === "DEAD";

          const sessPhase = sessionPhaseRef.current;
          if (tsPhase === "IDLE" && sessPhase === "PLAYING") {
            // Game delegated and ready — player hasn't tapped yet
            overlayContainer.visible = true;
            overlayTitle.text = "TAP TO FLY";
            overlaySubtext.text = "";
          } else if (tsPhase === "DEAD") {
            overlayContainer.visible = true;
            overlayTitle.text = "LIQUIDATED";
            overlaySubtext.text = `Score: ${wasmScore}`;
          } else if (tsPhase === "PLAYING") {
            overlayContainer.visible = false;
          } else {
            // IDLE (not yet PLAYING session): overlay handled by StartScreen
            overlayContainer.visible = false;
          }
         } catch (err) {
           if (!dbgErrored) { dbgErrored = true; console.error("[DBG] TICKER THREW (loop now dead):", err); }
           throw err;
         }
        });

        return () => {
          app.canvas.removeEventListener("pointerdown", onTap);
          window.removeEventListener("keydown", onKey);
        };
      });

    return () => {
      mounted = false;
      if (initialized) {
        app.destroy(true, { children: true });
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${canvasW}px`,
        height: `${canvasH}px`,
        position: "relative",
        cursor: "pointer",
      }}
    />
  );
}
