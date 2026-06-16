import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const stack = [
  { layer: "Renderer", tech: "PixiJS — WebGL 2D, 60fps" },
  { layer: "Physics", tech: "sim-core — Rust → WASM (browser) + SBF (chain)" },
  { layer: "Chain", tech: "Solana + MagicBlock Ephemeral Rollup" },
  { layer: "Price", tech: "Pyth Oracle via MagicBlock real-time pricing" },
  { layer: "Sessions", tech: "Throwaway keypair — no wallet mid-run" },
  { layer: "Framework", tech: "React + Vite + Anchor" },
];

export function TechStack() {
  return (
    <Section
      divider
      label="// BUILT DIFFERENT"
      title="60fps. On-chain. Real-time. No compromise."
    >
      <ScrollReveal>
        <div className="glass-card overflow-hidden mb-8">
          {stack.map(({ layer, tech }) => (
            <div
              key={layer}
              className="grid grid-cols-[110px_1fr] sm:grid-cols-2 border-b border-neon-purple/20 last:border-0 hover:bg-neon-purple/10 transition-colors"
            >
              <div className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-neon-amber tracking-widest border-r border-neon-purple/20">
                {layer}
              </div>
              <div className="p-4 sm:p-5 font-mono text-xs sm:text-sm text-text-primary break-words">{tech}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="animated-border rounded-xl p-6 text-center card-hover">
          <p className="font-heading font-bold text-neon-teal text-base">
            One Rust crate. Three targets. Identical output. That's the trick.
          </p>
        </div>
      </ScrollReveal>
    </Section>
  );
}
