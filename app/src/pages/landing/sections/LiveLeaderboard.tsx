import { Section } from "@/components/landing/Section";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { useNavigate } from "react-router-dom";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const MEDALS: Record<number, { badge: string; color: string }> = {
  1: { badge: "🥇", color: "text-neon-amber" },
  2: { badge: "🥈", color: "text-text-primary" },
  3: { badge: "🥉", color: "text-neon-amber/70" },
};

export function LiveLeaderboard() {
  const navigate = useNavigate();
  const { entries, loading } = useLeaderboard();

  const rows = entries.slice(0, 10);

  return (
    <Section
      id="leaderboard"
      divider
      label="// HALL OF DEGENS"
      title="The leaderboard is live. The scores are real. The chain is the judge."
      intro={
        <p>
          Scores stream to a{" "}
          <span className="text-neon-purple font-semibold">shared real-time leaderboard</span> as
          players tap. Spectate anyone in real-time. When a run ends, the final score commits
          permanently to Solana. Top 10 all-time, per season. Can you dethrone the bull whisperers?
        </p>
      }
    >
      <ScrollReveal>
        <div className="glass-card glow-purple overflow-hidden mb-8">
          <div className="grid grid-cols-[56px_1fr_auto] sm:grid-cols-[80px_1fr_1fr_1fr] bg-surface/80 border-b border-neon-purple/30 text-[10px] sm:text-xs font-mono text-text-secondary tracking-widest">
            <div className="p-3 sm:p-4">RANK</div>
            <div className="p-3 sm:p-4">PLAYER</div>
            <div className="p-3 sm:p-4 text-right">SCORE</div>
            <div className="hidden sm:block p-4 text-right">CHAIN</div>
          </div>

          {loading && (
            <div className="p-8 text-center font-mono text-xs text-text-secondary animate-pulse">
              FETCHING FROM SOLANA...
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="p-8 text-center font-mono text-xs text-text-secondary">
              NO SCORES YET — BE THE FIRST
            </div>
          )}

          {rows.map((row) => {
            const medal = MEDALS[row.rank];
            return (
              <div
                key={row.rank}
                className={`grid grid-cols-[56px_1fr_auto] sm:grid-cols-[80px_1fr_1fr_1fr] border-b border-neon-purple/10 last:border-0 transition-colors hover:bg-neon-purple/5 ${
                  row.rank === 1 ? "bg-neon-amber/[0.06] shadow-[inset_0_0_30px_rgba(245,166,35,0.15)]" : ""
                }`}
              >
                <div className={`p-3 sm:p-4 font-mono text-sm font-bold flex items-center gap-0.5 ${medal ? medal.color : "text-text-secondary"}`}>
                  {medal ? medal.badge : ""}#{row.rank}
                </div>
                <div className="p-3 sm:p-4 font-mono text-xs sm:text-sm text-text-primary truncate">{row.player}</div>
                <div className="p-3 sm:p-4 font-mono text-xs sm:text-sm text-neon-green font-bold text-right tabular-nums">
                  {row.score.toLocaleString()}
                </div>
                <div className="hidden sm:block p-4 font-mono text-xs text-neon-purple/70 text-right">SOLANA</div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="text-center">
          <button
            onClick={() => navigate("/play")}
            className="px-8 py-4 rounded-lg bg-neon-purple text-white font-bold font-heading tracking-wide text-sm hover:scale-105 transition-transform glow-purple"
          >
            PLAY AND CLAIM YOUR SPOT
          </button>
        </div>
      </ScrollReveal>
    </Section>
  );
}
