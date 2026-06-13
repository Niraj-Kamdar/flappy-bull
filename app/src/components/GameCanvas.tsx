import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import {
  CANVAS_W,
  CANVAS_H,
  BULL_X,
  BULL_RADIUS,
  CHANNEL_HALF,
  SCALE,
  SCROLL_SPEED,
  GRID_SPACING,
} from "../game/constants";
import { initState, tick, applyTap, GameState } from "../game/physics";

type Props = { price: number | null };

export function GameCanvas({ price }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(initState(CANVAS_H));
  const scrollOffsetRef = useRef(0);
  const priceRef = useRef<number | null>(price);
  priceRef.current = price;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const app = new PIXI.Application();
    let mounted = true;
    let initialized = false;

    app
      .init({
        width: CANVAS_W,
        height: CANVAS_H,
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

        const channelGraphics = new PIXI.Graphics();
        app.stage.addChild(channelGraphics);

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
        priceText.x = CANVAS_W - 140;
        priceText.y = 10;
        app.stage.addChild(priceText);

        const overlayContainer = new PIXI.Container();
        app.stage.addChild(overlayContainer);

        const overlayBg = new PIXI.Graphics();
        overlayBg.rect(0, 0, CANVAS_W, CANVAS_H);
        overlayBg.fill({ color: 0x000000, alpha: 0.55 });
        overlayContainer.addChild(overlayBg);

        const overlayTitle = new PIXI.Text({
          text: "TAP TO FLY",
          style: {
            fill: "#ffffff",
            fontSize: 36,
            fontFamily: "monospace",
            fontWeight: "bold",
          },
        });
        overlayTitle.anchor.set(0.5);
        overlayTitle.x = CANVAS_W / 2;
        overlayTitle.y = CANVAS_H / 2 - 20;
        overlayContainer.addChild(overlayTitle);

        const overlaySubtext = new PIXI.Text({
          text: "",
          style: { fill: "#aaaaaa", fontSize: 20, fontFamily: "monospace" },
        });
        overlaySubtext.anchor.set(0.5);
        overlaySubtext.x = CANVAS_W / 2;
        overlaySubtext.y = CANVAS_H / 2 + 30;
        overlayContainer.addChild(overlaySubtext);

        function drawBg(scrollOffset: number) {
          bgGraphics.clear();
          bgGraphics.rect(0, 0, CANVAS_W, CANVAS_H);
          bgGraphics.fill({ color: 0x0a0a14 });
          bgGraphics.setStrokeStyle({ width: 1, color: 0x1a1a2e });
          const startX = -(scrollOffset % GRID_SPACING);
          for (let x = startX; x < CANVAS_W; x += GRID_SPACING) {
            bgGraphics.moveTo(x, 0);
            bgGraphics.lineTo(x, CANVAS_H);
          }
          bgGraphics.stroke();
        }

        function drawChannel(centerPx: number) {
          channelGraphics.clear();
          const ceilY = centerPx - CHANNEL_HALF;
          const floorY = centerPx + CHANNEL_HALF;

          channelGraphics.rect(0, 0, CANVAS_W, ceilY);
          channelGraphics.fill({ color: 0x1a0a0a });

          channelGraphics.rect(0, floorY, CANVAS_W, CANVAS_H - floorY);
          channelGraphics.fill({ color: 0x1a0a0a });

          channelGraphics.rect(0, ceilY - 2, CANVAS_W, 4);
          channelGraphics.fill({ color: 0xff2222, alpha: 0.7 });
          channelGraphics.rect(0, floorY - 2, CANVAS_W, 4);
          channelGraphics.fill({ color: 0xff2222, alpha: 0.7 });
        }

        const onTap = () => {
          stateRef.current = applyTap(stateRef.current, CANVAS_H);
        };
        app.canvas.addEventListener("pointerdown", onTap);
        const onKey = (e: KeyboardEvent) => {
          if (e.code === "Space") onTap();
        };
        window.addEventListener("keydown", onKey);

        app.ticker.add(() => {
          stateRef.current = tick(stateRef.current);
          scrollOffsetRef.current =
            (scrollOffsetRef.current + SCROLL_SPEED) % GRID_SPACING;

          const state = stateRef.current;
          const bullYPx = state.bullY / SCALE;
          const centerPx = state.channelCenter / SCALE;

          drawBg(scrollOffsetRef.current);
          drawChannel(centerPx);

          bullGfx.y = bullYPx;
          scoreText.text = `FPS: ${Math.round(app.ticker.FPS)} | Score: ${state.score}`;

          const p = priceRef.current;
          priceText.text = p !== null ? `SOL: $${p.toFixed(2)}` : "SOL: --";

          if (state.phase === "IDLE") {
            overlayContainer.visible = true;
            overlayTitle.text = "TAP TO FLY";
            overlaySubtext.text = "";
          } else if (state.phase === "DEAD") {
            overlayContainer.visible = true;
            overlayTitle.text = "LIQUIDATED";
            overlaySubtext.text = `Score: ${state.score}   |   TAP TO RESTART`;
          } else {
            overlayContainer.visible = false;
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
        width: `${CANVAS_W}px`,
        height: `${CANVAS_H}px`,
        position: "relative",
        cursor: "pointer",
      }}
    />
  );
}
