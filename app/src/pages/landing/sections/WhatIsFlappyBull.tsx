import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { ChannelArt } from "@/components/landing/illustrations/ChannelArt";

const pillars = [
  { icon: "🐂", title: "THE BULL", desc: "Tap to flap. Gravity never quits." },
  { icon: "📈", title: "THE CHANNEL", desc: "Live SOL/USD carves every gap." },
  { icon: "🏆", title: "THE SCORE", desc: "Lands on-chain. Stays forever." },
];

export function WhatIsFlappyBull() {
  return (
    <Section
      label="// WHAT IS THIS THING"
      title="Flappy Bird ate a SOL candle."
      intro={
        <p>
          One tap to flap. The live{" "}
          <span className="text-neon-green font-semibold">SOL/USD chart is the course</span> — pumps
          lift the ceiling, dumps cave the floor. Kiss a wall and you're{" "}
          <span className="text-neon-red font-semibold">liquidated</span>.
        </p>
      }
    >
      <ScrollReveal className="mb-10">
        <ChannelArt />
      </ScrollReveal>

      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        {pillars.map((p) => (
          <ScrollReveal key={p.title}>
            <div className="glass-card glow-purple card-hover corner-frame relative h-full p-4 text-center sm:p-8">
              <div className="mb-2 text-3xl sm:mb-4 sm:text-5xl">{p.icon}</div>
              <h3 className="mb-1 font-heading text-[11px] font-bold tracking-widest text-neon-amber sm:mb-2 sm:text-sm">
                {p.title}
              </h3>
              <p className="font-body text-xs text-text-secondary sm:text-sm">{p.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
