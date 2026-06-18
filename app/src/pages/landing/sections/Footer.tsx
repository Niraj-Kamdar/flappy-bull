import { useNavigate } from "react-router-dom";

const PROGRAM_ID = "4pRUMdU5Ha9G2MSriNM5NqhwhYo6Mvuq827FVMBTjHzm";

export function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="pt-16 pb-28 md:pb-16 px-4 border-t border-neon-purple/20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <p className="font-heading font-bold text-text-primary text-lg mb-1">Metasquare Studio</p>
          <p className="font-body text-text-secondary text-sm">
            Building games at the intersection of on-chain infrastructure and arcade culture.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-mono text-text-secondary">
          <button onClick={() => navigate("/play")} className="hover:text-neon-green transition-colors">
            Play
          </button>
          <a href="#leaderboard" className="hover:text-neon-green transition-colors">
            Leaderboard
          </a>
          <a
            href="https://github.com/magicblock-labs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-green transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com/magicblock"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-green transition-colors"
          >
            Twitter/X
          </a>
          <a
            href="https://discord.gg/magicblock"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-green transition-colors"
          >
            Discord
          </a>
        </div>

        <div className="text-center space-y-3">
          <p className="font-mono text-xs text-background/40 text-text-secondary opacity-50">
            Flappy Bull is a game. It does not constitute financial advice. SOL/USD data used for gameplay only.
          </p>
          <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[11px] sm:text-xs text-neon-teal/80 bg-surface/60 border border-neon-teal/30 rounded-2xl sm:rounded-full px-3 py-1.5">
            <span className="text-text-secondary">Program</span>
            <span className="break-all">{PROGRAM_ID}</span>
            <span className="text-text-secondary">(devnet)</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
