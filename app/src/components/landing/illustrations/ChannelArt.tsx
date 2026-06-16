/**
 * Candlestick "pipes" forming a Flappy channel — the live chart IS the course.
 * Top candles hang from the ceiling, bottom candles rise from the floor, and the
 * bull threads the gap between them. Pure SVG, on-brand neon palette.
 */
const W = 480;
const H = 200;
const N = 11;
const STEP = W / N;

// Channel walls (y where each candle ends and the gap begins).
const ceiling = [62, 54, 70, 48, 60, 52, 66, 50, 58, 64, 56];
const floor = [150, 160, 148, 164, 150, 168, 152, 162, 154, 158, 150];
// Mostly green with red volatility spikes.
const up = [true, true, false, true, true, false, true, false, true, true, false];

const BODY = 14;
const WICK = 9;
const BULL_I = 5; // bull rides the center column

export function ChannelArt() {
  const cx = (i: number) => i * STEP + STEP / 2;
  const bullX = cx(BULL_I);
  const bullY = (ceiling[BULL_I] + floor[BULL_I]) / 2;

  // Soft fill of the playable channel.
  const channelPath =
    `M ${cx(0)} ${ceiling[0]} ` +
    ceiling.map((y, i) => `L ${cx(i)} ${y}`).join(" ") +
    ` L ${cx(N - 1)} ${floor[N - 1]} ` +
    floor.map((y, i) => `L ${cx(N - 1 - i)} ${floor[N - 1 - i]}`).join(" ") +
    " Z";

  return (
    <div className="glass-card overflow-hidden rounded-xl p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="A channel of price candles with the bull flying through the gap"
      >
        <defs>
          <linearGradient id="channelFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14F195" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#9945FF" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* playable gap */}
        <path d={channelPath} fill="url(#channelFill)" />

        {/* candle pipes */}
        {Array.from({ length: N }).map((_, i) => {
          const color = up[i] ? "#14F195" : "#FF3B5C";
          const x = cx(i);
          return (
            <g key={i} stroke={color} fill={color}>
              {/* top candle: hangs from the top edge down to the ceiling */}
              <line x1={x} y1={ceiling[i]} x2={x} y2={ceiling[i] + WICK} strokeWidth={2} />
              <rect x={x - BODY / 2} y={-4} width={BODY} height={ceiling[i] + 4} rx={2} opacity={0.9} />
              {/* bottom candle: rises from the bottom edge up to the floor */}
              <line x1={x} y1={floor[i] - WICK} x2={x} y2={floor[i]} strokeWidth={2} />
              <rect x={x - BODY / 2} y={floor[i]} width={BODY} height={H - floor[i] + 4} rx={2} opacity={0.9} />
            </g>
          );
        })}

        {/* the bull */}
        <g className="animate-[float_3s_ease-in-out_infinite]">
          <circle cx={bullX} cy={bullY} r={16} fill="#0D0D2B" stroke="#F5A623" strokeWidth={2} />
          <circle cx={bullX} cy={bullY} r={16} fill="none" stroke="#F5A623" strokeWidth={2} opacity={0.4}>
            <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={bullX} y={bullY + 6} textAnchor="middle" fontSize="18">
            🐂
          </text>
        </g>
      </svg>
    </div>
  );
}
