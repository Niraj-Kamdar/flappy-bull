// Deterministic candlestick series — one seamless half, rendered twice for an
// infinite horizontal scroll. Faint, fixed behind the whole page so the body
// sections read as a live trading terminal instead of flat black.
const CANDLES = Array.from({ length: 48 }, (_, i) => {
  // Cheap deterministic pseudo-noise — no Math.random (keeps SSR/replay stable).
  const n = Math.sin(i * 12.9898) * 43758.5453;
  const r = n - Math.floor(n);
  const n2 = Math.sin(i * 78.233) * 12543.123;
  const r2 = n2 - Math.floor(n2);
  const up = r > 0.45;
  const bodyH = 18 + r2 * 70; // px
  const wickH = bodyH + 14 + r * 40;
  const top = 30 + r * 90; // vertical offset within the band
  return { up, bodyH, wickH, top, key: i };
});

function CandleRow() {
  return (
    <div className="flex h-full shrink-0 items-center">
      {CANDLES.map((c) => (
        <div key={c.key} className="relative mx-[7px] flex w-[6px] justify-center">
          <span
            className="absolute w-px"
            style={{
              height: c.wickH,
              top: c.top - 7,
              background: c.up ? "#14F195" : "#FF3B5C",
            }}
          />
          <span
            className="absolute w-[6px] rounded-[1px]"
            style={{
              height: c.bodyH,
              top: c.top,
              background: c.up ? "#14F195" : "#FF3B5C",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function MarketBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 market-grid" />
      <div className="absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 opacity-[0.14]">
        <div className="flex h-full w-max animate-[chart-scroll_45s_linear_infinite]">
          <CandleRow />
          <CandleRow />
        </div>
      </div>
    </div>
  );
}
