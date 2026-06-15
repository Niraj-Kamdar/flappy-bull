import { useNavigate } from "react-router-dom";
import { HeroGameBackground } from "@/components/landing/HeroGameBackground";
import { usePriceOracle } from "@/hooks/usePriceOracle";

export function Hero() {
  const navigate = useNavigate();
  const { price } = usePriceOracle();
  const solPrice = (price && price > 0 ? price : 150).toFixed(2);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Live self-playing game canvas (back layer) */}
      <HeroGameBackground />

      {/* Dark veil so headline text stays legible over the canvas */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(5,5,16,0.55)_0%,_rgba(5,5,16,0.35)_45%,_rgba(5,5,16,0.85)_100%)]" />

      {/* Live SOL ticker pill */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-amber/40 bg-background/70 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
        <span className="font-mono text-xs text-neon-amber animate-[ticker-pulse_2.5s_ease-in-out_infinite]">
          SOL ${solPrice}
        </span>
      </div>

      {/* Live tag */}
      <div className="relative z-10 mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-purple/50 bg-neon-purple/10 text-neon-purple text-xs font-mono tracking-widest">
        <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
        ⚡ LIVE ON SOLANA
      </div>

      {/* Main headline */}
      <div className="relative z-10 animate-[float_3s_ease-in-out_infinite]">
        <h1
          className="neon-text font-pixel text-[clamp(2.25rem,9vw,5.5rem)] leading-[1.1] tracking-tight bg-gradient-to-r from-neon-purple via-neon-green to-neon-purple bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient-shift_6s_ease_infinite]"
          style={{ ["--neon-color" as string]: "#9945FF" }}
        >
          FLAPPY BULL
        </h1>
      </div>

      {/* Sub-headline */}
      <p className="relative z-10 mt-8 font-heading font-bold text-xl md:text-3xl text-text-primary mb-4">
        The SOL chart IS the course.
      </p>

      {/* Body */}
      <p className="relative z-10 font-body text-text-secondary text-base md:text-lg mb-10">
        Tap to survive. The market decides if you live.
      </p>

      {/* CTAs */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate("/play")}
          className="px-8 py-4 rounded-lg bg-neon-green text-background font-bold font-heading tracking-wide text-sm animate-[pulse-glow_2s_ease-in-out_infinite] hover:scale-105 transition-transform"
        >
          PLAY NOW
        </button>
        <a
          href="#leaderboard"
          className="px-8 py-4 rounded-lg border border-neon-purple text-neon-purple font-bold font-heading tracking-wide text-sm hover:bg-neon-purple/10 hover:scale-105 transition-all"
        >
          VIEW LEADERBOARD
        </a>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-secondary text-xs font-mono animate-bounce z-10">
        ↓ scroll
      </div>
    </section>
  );
}
