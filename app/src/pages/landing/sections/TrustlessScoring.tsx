import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { Badge } from "@/components/ui/badge";

const badges = [
  "Rust sim-core",
  "WebAssembly",
  "Solana SBF",
  "MagicBlock Ephemeral Rollup",
  "Pyth Oracle",
  "Session Keys",
];

export function TrustlessScoring() {
  return (
    <Section
      divider
      label="// THE CHAIN DOESN'T LIE"
      title="You can't fake your score. The blockchain replays your run."
    >
      <ScrollReveal>
        <div className="glass-card glow-purple card-hover p-8 mb-8">
          <div className="font-body text-text-secondary text-base leading-relaxed space-y-4">
            <p>Most on-chain games trust the client. We don't.</p>
            <p>
              Flappy Bull uses a{" "}
              <span className="text-neon-green font-semibold">single physics engine</span> — written
              once in Rust — that runs identically in your browser (via WebAssembly) and on the
              Solana program (via on-chain replay). When your run ends, the on-chain program replays
              every tap and every price tick you experienced. The score it computes is{" "}
              <span className="text-neon-green font-semibold">canonical</span>. The client can lie.
              The chain won't care.
            </p>
            <p>
              Zero wallet prompts during your run. One approval at the start — a throwaway session
              key handles everything else. No popups. No friction. Just play.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="flex flex-wrap gap-3">
        {badges.map((t, i) => (
          <ScrollReveal key={t} style={{ animationDelay: `${i * 80}ms` }}>
            <Badge className="font-mono text-xs bg-surface border border-neon-teal/40 text-neon-teal px-3 py-1 transition-all hover:border-neon-teal hover:shadow-[0_0_16px_rgba(0,194,199,0.5)] hover:-translate-y-0.5">
              {t}
            </Badge>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
