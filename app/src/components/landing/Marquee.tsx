interface MarqueeProps {
  items: string[];
  /** Accent color class for the text, e.g. "text-neon-green/70". */
  accent?: string;
}

/** Scrolling arcade ticker strip — seamless loop via duplicated content. */
export function Marquee({ items, accent = "text-neon-green/70" }: MarqueeProps) {
  return (
    <div className="relative overflow-hidden border-y border-neon-purple/20 bg-surface/40 py-3 backdrop-blur-sm">
      <div className="flex w-max animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {items.map((t) => (
              <span
                key={`${dup}-${t}`}
                className={`mx-5 inline-flex items-center gap-2 font-pixel text-[9px] tracking-widest ${accent}`}
              >
                <span className="text-neon-purple/70">◆</span>
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
