/**
 * "One core, two targets, one truth" — the same Rust sim-core compiles to WASM
 * (browser) and SBF (chain); the chain replays your run and computes the
 * canonical score. Responsive vertical flow with neon connectors.
 */
function Connector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-5 w-px bg-gradient-to-b from-neon-teal/60 to-neon-purple/60" />
      <span className="my-1 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
        {label}
      </span>
      <div className="h-5 w-px bg-gradient-to-b from-neon-purple/60 to-neon-amber/60" />
    </div>
  );
}

export function ReplayDiagram() {
  return (
    <div className="glass-card glow-purple mx-auto max-w-xl p-6 text-center">
      {/* source of truth */}
      <div className="inline-flex items-center gap-2 rounded-lg border border-neon-teal/50 bg-neon-teal/10 px-5 py-3">
        <span className="text-xl">🦀</span>
        <span className="font-heading text-sm font-bold tracking-wide text-neon-teal">
          ONE RUST SIM-CORE
        </span>
      </div>

      <Connector label="compiles once →" />

      {/* two identical targets */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neon-green/40 bg-neon-green/5 p-3">
          <div className="mb-0.5 text-lg">🌐</div>
          <div className="font-mono text-xs font-bold text-neon-green">BROWSER</div>
          <div className="font-mono text-[10px] text-text-secondary">WASM · 60fps</div>
        </div>
        <div className="rounded-lg border border-neon-purple/40 bg-neon-purple/5 p-3">
          <div className="mb-0.5 text-lg">⛓️</div>
          <div className="font-mono text-xs font-bold text-neon-purple">SOLANA</div>
          <div className="font-mono text-[10px] text-text-secondary">on-chain SBF</div>
        </div>
      </div>

      <Connector label="same code · same math" />

      {/* canonical result */}
      <div className="inline-flex items-center gap-2 rounded-lg border border-neon-amber/50 bg-neon-amber/10 px-5 py-3">
        <span className="font-mono text-base font-bold tabular-nums text-neon-amber">= 4,829</span>
        <span className="font-heading text-xs font-bold tracking-wide text-neon-amber">
          CANONICAL ✓
        </span>
      </div>
    </div>
  );
}
