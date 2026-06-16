import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const rows = [
  ["Static, pre-set pipes", "Pipes shaped by live SOL/USD market data"],
  ["Same every run", "Every run is different — the market decides"],
  ["Dies and it's over", "Score settles permanently on Solana"],
  ["Local leaderboard, if any", "Shared live on-chain leaderboard — spectate anyone, anytime"],
  ["No stakes", "Market volatility = difficulty. Pumps and dumps change physics"],
  ["Random", "Deterministic, verifiable — the chain replays your run"],
  ["Forgettable", "Bragging rights sealed on-chain"],
];

export function HowItsDifferent() {
  return (
    <Section
      divider
      label="// NOT YOUR GRANDMA'S FLAPPY BIRD"
      title="Same one button. Completely different everything else."
    >
      <ScrollReveal>
        <div className="glass-card overflow-hidden mb-8">
          <div className="grid grid-cols-2 border-b border-neon-purple/30">
            <div className="p-3 sm:p-4 font-mono text-[10px] sm:text-xs text-neon-red/80 tracking-widest border-r border-neon-purple/30 bg-neon-red/5">
              CLASSIC FLAPPY BIRD
            </div>
            <div className="p-3 sm:p-4 font-mono text-[10px] sm:text-xs text-neon-green tracking-widest bg-neon-green/10 [text-shadow:0_0_8px_rgba(20,241,149,0.5)]">
              FLAPPY BULL
            </div>
          </div>
          {rows.map(([classic, bull], i) => (
            <div
              key={i}
              className={`grid grid-cols-2 border-b border-neon-purple/20 last:border-0 ${
                i % 2 === 1 ? "bg-surface/40" : ""
              }`}
            >
              <div className="p-3 sm:p-4 text-xs sm:text-sm text-text-secondary/70 border-r border-neon-purple/20 font-body line-through decoration-neon-red/30">
                {classic}
              </div>
              <div className="p-3 sm:p-4 text-xs sm:text-sm text-text-primary font-body bg-neon-green/[0.03]">{bull}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="animated-border rounded-xl p-6 glow-green card-hover">
          <p className="font-heading font-bold text-neon-green text-lg text-center">
            "The price feed IS the game engine. No two runs are alike. Ever."
          </p>
        </div>
      </ScrollReveal>
    </Section>
  );
}
