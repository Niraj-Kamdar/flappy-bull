import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const pillars = [
  {
    icon: "🐂",
    title: "THE BULL",
    desc: "Tap to flap. Gravity is always pulling.",
  },
  {
    icon: "📈",
    title: "THE CHANNEL",
    desc: "Live SOL/USD price shapes every gap.",
  },
  {
    icon: "🏆",
    title: "THE LEADERBOARD",
    desc: "Your score lives on-chain. Forever.",
  },
];

export function WhatIsFlappyBull() {
  return (
    <Section
      label="// WHAT IS THIS THING"
      title="Flappy Bird Ate a SOL Candle and Lived to Tell the Tale."
      intro={
        <>
          <p>
            Flappy Bull is a real-time arcade game where the live{" "}
            <span className="text-neon-green font-semibold">SOL/USD price line is the course itself</span>.
          </p>
          <p>
            The market pumps? Your ceiling rises. SOL dumps? The floor caves. Low volatility squeezes
            the channel to a knife's edge. Breakout? Coins rain down.
          </p>
          <p>
            One tap = one flap. Touch the walls and you're{" "}
            <span className="text-neon-red font-semibold">liquidated</span>.
          </p>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <ScrollReveal key={p.title}>
            <div className="glass-card glow-purple card-hover p-8 text-center h-full">
              <div className="text-5xl mb-4">{p.icon}</div>
              <h3 className="font-heading font-bold text-neon-amber text-sm tracking-widest mb-2">
                {p.title}
              </h3>
              <p className="font-body text-text-secondary text-sm">{p.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
