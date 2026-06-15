import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { cn } from "@/lib/utils";

const items = [
  {
    done: true,
    title: "SEASON 0 — GENESIS",
    body: "Core game live. Flap or die. Leaderboard on-chain. Real market, real scores.",
  },
  {
    done: false,
    title: "SEASON 1 — PHYSICS ROOMS",
    body: "Different rooms, different physics. High gravity rooms. Moon gravity rooms. Speed rooms. Each room its own chaos. Room-by-room leaderboards — rule your room.",
  },
  {
    done: false,
    title: "SEASON 2 — THE AD VAULT",
    body: "Background assets become NFTs. Brands, protocols, and partners lease visual space inside the game world — billboards, pipe skins, background panels. Visible to every player in every run. The game world becomes a living ad network owned by the community.",
  },
  {
    done: false,
    title: "SEASON 3 — BULL REWARDS",
    body: "Players earn. Top performers, daily grinders, season champions — rewards flow on-chain. The leaderboard becomes a money game.",
  },
  {
    done: false,
    title: "SEASON 4 — SEEKER & BEYOND",
    body: "Launch on Seeker and additional platforms. More assets. More markets. Let ETH/USD have a turn. The bull runs everywhere.",
  },
];

export function Roadmap() {
  return (
    <Section
      divider
      width="narrow"
      label="// WHAT'S NEXT"
      title="This is just the beginning of the run."
    >
      <div className="relative pl-8">
        {/* Animated vertical progress line */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-green via-neon-purple to-neon-purple/20" />
        {items.map(({ done, title, body }) => (
          <ScrollReveal key={title} className="mb-12 relative">
            <div
              className={cn(
                "absolute -left-[41px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs",
                done
                  ? "border-neon-green bg-neon-green/20 text-neon-green shadow-[0_0_16px_rgba(20,241,149,0.7)] animate-[pulse-glow_2s_ease-in-out_infinite]"
                  : "border-neon-purple bg-background text-neon-purple shadow-[0_0_10px_rgba(153,69,255,0.5)]"
              )}
            >
              {done ? "✓" : "→"}
            </div>
            <h3 className="font-heading font-bold text-neon-amber mb-2 text-sm tracking-wide">
              {title}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed font-body">{body}</p>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
