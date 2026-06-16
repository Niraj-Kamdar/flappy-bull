import { Hero } from "./sections/Hero";
import { WhatIsFlappyBull } from "./sections/WhatIsFlappyBull";
import { TrustlessScoring } from "./sections/TrustlessScoring";
import { LiveLeaderboard } from "./sections/LiveLeaderboard";
import { Footer } from "./sections/Footer";
import { StickyPlayBar } from "@/components/landing/StickyPlayBar";
import { MarketBackdrop } from "@/components/landing/MarketBackdrop";
import { Marquee } from "@/components/landing/Marquee";

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      <MarketBackdrop />
      <div className="scanlines" />
      <div className="crt-vignette" />

      <Hero />
      <Marquee
        items={["FLAP OR DIE", "THE CHART IS THE COURSE", "ON-CHAIN SCORES", "NO TWO RUNS ALIKE", "TAP TO SURVIVE", "MARKET = DIFFICULTY"]}
      />
      <WhatIsFlappyBull />
      <TrustlessScoring />
      <Marquee
        accent="text-neon-teal/70"
        items={["RUST SIM-CORE", "WEBASSEMBLY", "SOLANA SBF", "MAGICBLOCK ER", "PYTH ORACLE", "SESSION KEYS", "60 FPS", "ZERO MID-RUN PROMPTS"]}
      />
      <LiveLeaderboard />
      <Footer />

      <StickyPlayBar />
    </div>
  );
}
