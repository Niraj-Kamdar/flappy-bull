import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export type PixiAppRef = PIXI.Application | null;

export function PixiCanvas({
  appRef,
}: {
  appRef: React.MutableRefObject<PixiAppRef>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const app = new PIXI.Application();
    let mounted = true;
    let initialized = false;

    app
      .init({
        resizeTo: container,
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
        appRef.current = app;

        const fpsText = new PIXI.Text({
          text: "FPS: --",
          style: { fill: "#00ff88", fontSize: 14, fontFamily: "monospace" },
        });
        fpsText.x = 10;
        fpsText.y = 10;
        app.stage.addChild(fpsText);

        app.ticker.add(() => {
          fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
        });
      });

    return () => {
      mounted = false;
      appRef.current = null;
      if (initialized) {
        app.destroy(true, { children: true });
      }
    };
  }, [appRef]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "400px", position: "relative" }}
    />
  );
}
