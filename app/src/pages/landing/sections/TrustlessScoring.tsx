import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { ReplayDiagram } from "@/components/landing/illustrations/ReplayDiagram";

const steps = [
  {
    n: "1",
    title: "PLAY",
    desc: "Every tap and every price tick you saw is recorded as you go.",
    color: "text-neon-green",
  },
  {
    n: "2",
    title: "REPLAY",
    desc: "Run ends. The Solana program re-runs your exact inputs on-chain.",
    color: "text-neon-purple",
  },
  {
    n: "3",
    title: "SETTLE",
    desc: "Same Rust core → one true score. A lying client gets rejected.",
    color: "text-neon-amber",
  },
];

export function TrustlessScoring() {
  return (
    <Section
      divider
      label="// THE CHAIN DOESN'T LIE"
      title="You can't fake your score."
      intro={
        <p>
          Most on-chain games trust the client. We don't — the blockchain{" "}
          <span className="text-neon-green font-semibold">replays your run</span> and decides.
        </p>
      }
    >
      <ScrollReveal className="mb-10">
        <ReplayDiagram />
      </ScrollReveal>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <ScrollReveal key={s.n}>
            <div className="glass-card card-hover h-full p-5">
              <div className={`mb-2 font-pixel text-xs ${s.color}`}>{s.n}</div>
              <h3 className={`mb-2 font-heading text-sm font-bold tracking-widest ${s.color}`}>
                {s.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-text-secondary">{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal>
        <div className="animated-border card-hover flex flex-col items-center justify-center gap-2 rounded-xl p-5 text-center sm:flex-row sm:gap-4">
          <span className="font-pixel text-lg text-neon-green">1</span>
          <span className="font-body text-sm text-text-secondary">
            signature at the start.
          </span>
          <span className="font-pixel text-lg text-neon-amber">0</span>
          <span className="font-body text-sm text-text-secondary">
            wallet prompts mid-run — a throwaway session key handles the rest.
          </span>
        </div>
      </ScrollReveal>
    </Section>
  );
}
