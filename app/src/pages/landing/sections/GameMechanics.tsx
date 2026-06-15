import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const cards = [
  {
    mode: "SQUEEZE MODE",
    glowClass: "glow-amber border-neon-amber/40",
    titleColor: "text-neon-amber",
    body: "SOL goes flat. The channel narrows to a razor gap. One bad tap and you're rekt. This is the low-vol grind. Amber pipes. Tight margins. Pure skill.",
  },
  {
    mode: "BREAKOUT MODE",
    glowClass: "glow-green border-neon-green/40",
    titleColor: "text-neon-green",
    body: "SOL moves hard. The channel explodes open. Golden coins spawn. It's free money — if you can grab it without flying into the walls.",
  },
  {
    mode: "ASSISTS",
    glowClass: "glow-purple border-neon-purple/40",
    titleColor: "text-neon-purple",
    body: "Big pump? Rocket mode — reduced gravity, float like you're on the moon. Sharp dump? Parachute — air resistance kicks in, you drift slow. The market tries to kill you. The game gives you one last chance.",
  },
];

export function GameMechanics() {
  return (
    <Section
      divider
      label="// UNDER THE HOOD (FOR DEGENS)"
      title="Market volatility = difficulty. Literally."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <ScrollReveal key={c.mode}>
            <div className={`glass-card border card-hover ${c.glowClass} p-6 h-full`}>
              <h3 className={`font-mono text-xs tracking-widest font-bold mb-4 ${c.titleColor}`}>
                {c.mode}
              </h3>
              <p className="font-body text-text-secondary text-sm leading-relaxed">{c.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
