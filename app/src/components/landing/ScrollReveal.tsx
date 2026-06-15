import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps { children: ReactNode; className?: string; style?: CSSProperties; }

export function ScrollReveal({ children, className, style }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={style}
      className={cn("opacity-0", visible && "animate-[slide-up_0.5s_ease-out_forwards]", className)}
    >
      {children}
    </div>
  );
}
