import { Hero } from "./sections/Hero";
import { WhatIsFlappyBull } from "./sections/WhatIsFlappyBull";
import { HowItsDifferent } from "./sections/HowItsDifferent";
import { GameMechanics } from "./sections/GameMechanics";
import { TrustlessScoring } from "./sections/TrustlessScoring";
import { LiveLeaderboard } from "./sections/LiveLeaderboard";
import { Roadmap } from "./sections/Roadmap";
import { TechStack } from "./sections/TechStack";
import { Footer } from "./sections/Footer";
import { StickyPlayBar } from "@/components/landing/StickyPlayBar";

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      <div className="scanlines" />
      <div className="crt-vignette" />

      <Hero />
      <WhatIsFlappyBull />
      <HowItsDifferent />
      <GameMechanics />
      <TrustlessScoring />
      <LiveLeaderboard />
      <Roadmap />
      <TechStack />
      <Footer />

      <StickyPlayBar />
    </div>
  );
}
