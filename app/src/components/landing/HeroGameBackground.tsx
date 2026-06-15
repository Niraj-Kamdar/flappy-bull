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
  PIPE_WIDTH,
} from "../../game/constants";
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
} from "../../game/simCore";

const EMPTY_PIPE = -2147483648; // i32::MIN sentinel from sim-core

// Render-only pipe derived from the authoritative wasm state.
type Pipe = { x: number; gapCenterY: number; gapHalf: number };

// Hero attract mode runs at a constant price, so pipes always use the NORMAL palette.
const PIPE_BODY = 0x1a3a3a;
const PIPE_CAP = 0x2a5a5a;
const PIPE_EDGE = 0x4488aa;

/**
 * Self-playing fork of GameCanvas for the hero background. Reuses the real WASM
 * physics: an autopilot taps to thread each pipe and the run loops forever on
 * death. No wallet, no on-chain session, no input — pure ambient animation.
 */
export function HeroGameBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wasmStateRef = useRef<WasmSimState | null>(null);
  const wasmCfgRef = useRef<WasmSeasonConfig | null>(null);
  const wasmReadyRef = useRef(false);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!containerRef.current) return;
    const container = containerRef.current;

    initSimCore().then(() => {
      wasmCfgRef.current = getSimConfig();
      const mid = (CANVAS_H / 2) * SCALE;
      wasmStateRef.current = wasm_init_state(mid, mid, 0, 0);
      wasmReadyRef.current = true;
    });

    const app = new PIXI.Application();
    let mounted = true;
    let initialized = false;
    let observer: IntersectionObserver | null = null;

    app
      .init({
        width: CANVAS_W,
        height: CANVAS_H,
        resolution: Math.min(window.devicePixelRatio ?? 1, 2),
        autoDensity: true,
        backgroundAlpha: 0,
      })
      .then(() => {
        if (!mounted) {
          app.destroy(true);
          return;
        }
        initialized = true;
        container.appendChild(app.canvas);
        app.canvas.style.width = "100%";
        app.canvas.style.height = "100%";
        app.canvas.style.objectFit = "cover";

        const bgGraphics = new PIXI.Graphics();
        app.stage.addChild(bgGraphics);
        const pipeGraphics = new PIXI.Graphics();
        app.stage.addChild(pipeGraphics);
        const bullGfx = new PIXI.Graphics();
        bullGfx.circle(0, 0, BULL_RADIUS);
        bullGfx.fill({ color: 0xffcc00 });
        bullGfx.x = BULL_X;
        app.stage.addChild(bullGfx);

        let pulse = 0;

        function wasmPipes(ws: WasmSimState, gapHalfPx: number): Pipe[] {
          const xs = [ws.pipe0_x, ws.pipe1_x, ws.pipe2_x, ws.pipe3_x];
          const gaps = [ws.pipe0_gap, ws.pipe1_gap, ws.pipe2_gap, ws.pipe3_gap];
          const out: Pipe[] = [];
          for (let i = 0; i < 4; i++) {
            if (xs[i] === EMPTY_PIPE) continue;
            out.push({ x: xs[i] / SCALE, gapCenterY: gaps[i] / SCALE, gapHalf: gapHalfPx });
          }
          return out;
        }

        function drawBg(scrollOffset: number) {
          bgGraphics.clear();
          bgGraphics.setStrokeStyle({ width: 1, color: 0x1a1a2e });
          const startX = -(scrollOffset % GRID_SPACING);
          for (let x = startX; x < CANVAS_W; x += GRID_SPACING) {
            bgGraphics.moveTo(x, 0);
            bgGraphics.lineTo(x, CANVAS_H);
          }
          bgGraphics.stroke();
        }

        function drawPipes(pipeList: Pipe[]) {
          pipeGraphics.clear();
          for (const pipe of pipeList) {
            const gapTop = pipe.gapCenterY - pipe.gapHalf;
            const gapBot = pipe.gapCenterY + pipe.gapHalf;
            const capH = 12;

            if (gapTop > capH) {
              pipeGraphics.rect(pipe.x, 0, PIPE_WIDTH, gapTop - capH);
              pipeGraphics.fill({ color: PIPE_BODY });
            }
            pipeGraphics.rect(pipe.x - 4, gapTop - capH, PIPE_WIDTH + 8, capH);
            pipeGraphics.fill({ color: PIPE_CAP });
            pipeGraphics.rect(pipe.x - 4, gapBot, PIPE_WIDTH + 8, capH);
            pipeGraphics.fill({ color: PIPE_CAP });
            if (gapBot + capH < CANVAS_H) {
              pipeGraphics.rect(pipe.x, gapBot + capH, PIPE_WIDTH, CANVAS_H - gapBot - capH);
              pipeGraphics.fill({ color: PIPE_BODY });
            }

            pipeGraphics.setStrokeStyle({ width: 2, color: PIPE_EDGE, alpha: 0.75 });
            pipeGraphics.moveTo(pipe.x - 4, gapTop - capH);
            pipeGraphics.lineTo(pipe.x + PIPE_WIDTH + 4, gapTop - capH);
            pipeGraphics.stroke();
            pipeGraphics.moveTo(pipe.x - 4, gapBot + capH);
            pipeGraphics.lineTo(pipe.x + PIPE_WIDTH + 4, gapBot + capH);
            pipeGraphics.stroke();
          }
        }

        app.ticker.add(() => {
          if (!wasmReadyRef.current || !wasmCfgRef.current || !wasmStateRef.current) return;
          const ws = wasmStateRef.current;
          const cfg = wasmCfgRef.current;

          // Auto-reset on death so the attract loop never ends.
          if (!isAlive(ws.flags)) {
            const mid = (CANVAS_H / 2) * SCALE;
            wasmStateRef.current = wasm_init_state(mid, mid, 0, 0);
            return;
          }

          // Autopilot: aim at the nearest upcoming pipe's gap center.
          const bullYPx = ws.bull_y / SCALE;
          const xs = [ws.pipe0_x, ws.pipe1_x, ws.pipe2_x, ws.pipe3_x];
          const gaps = [ws.pipe0_gap, ws.pipe1_gap, ws.pipe2_gap, ws.pipe3_gap];
          let targetGap = ws.channel_center;
          let nearestX = Infinity;
          for (let i = 0; i < 4; i++) {
            if (xs[i] === EMPTY_PIPE) continue;
            const xp = xs[i] / SCALE;
            if (xp > BULL_X && xp < nearestX) {
              nearestX = xp;
              targetGap = gaps[i];
            }
          }
          const tap = bullYPx > targetGap / SCALE;

          const p = effectivePrice(null);
          wasm_step(ws, cfg, tap, priceToLo(p), priceToHi(p));

          scrollOffsetRef.current = (scrollOffsetRef.current + SCROLL_SPEED) % GRID_SPACING;
          pulse++;
          drawBg(scrollOffsetRef.current);
          drawPipes(wasmPipes(ws, cfg.channel_half_min));
          bullGfx.y = ws.bull_y / SCALE;
        });

        // Pause the loop when the hero scrolls off-screen.
        observer = new IntersectionObserver(
          ([e]) => {
            if (e.isIntersecting) app.ticker.start();
            else app.ticker.stop();
          },
          { threshold: 0 }
        );
        observer.observe(container);
      });

    return () => {
      mounted = false;
      if (observer) observer.disconnect();
      if (initialized) app.destroy(true, { children: true });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0d0d2b_0%,_#050510_70%)]"
      style={{ pointerEvents: "none", opacity: 0.45 }}
    />
  );
}
