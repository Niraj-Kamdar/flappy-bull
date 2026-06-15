interface SectionLabelProps { children: string; }

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="font-mono text-xs text-neon-amber tracking-widest uppercase mb-4">
      {children}
    </p>
  );
}
