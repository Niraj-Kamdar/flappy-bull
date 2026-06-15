import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./SectionLabel";
import { ScrollReveal } from "./ScrollReveal";

interface SectionProps {
  children: ReactNode;
  id?: string;
  label?: string;
  title?: string;
  /** Body copy rendered under the title (optional). */
  intro?: ReactNode;
  width?: "default" | "narrow";
  /** Render a neon divider above the section. */
  divider?: boolean;
  className?: string;
}

/**
 * Standardizes vertical rhythm + width + heading reveal across landing sections.
 * Replaces the repeated `py-24 px-4 max-w-5xl mx-auto` + manual ScrollReveal headers.
 */
export function Section({
  children,
  id,
  label,
  title,
  intro,
  width = "default",
  divider = false,
  className,
}: SectionProps) {
  return (
    <>
      {divider && (
        <div className="mx-auto max-w-5xl px-4">
          <hr className="section-divider" />
        </div>
      )}
      <section
        id={id}
        className={cn(
          "mx-auto px-4 py-20 md:py-28",
          width === "narrow" ? "max-w-3xl" : "max-w-5xl",
          className
        )}
      >
        {(label || title || intro) && (
          <ScrollReveal className="mb-12">
            {label && <SectionLabel>{label}</SectionLabel>}
            {title && (
              <h2 className="font-heading font-bold text-text-primary leading-tight text-[clamp(1.6rem,4vw,2.5rem)]">
                {title}
              </h2>
            )}
            {intro && (
              <div className="mt-6 font-body text-text-secondary text-base md:text-lg leading-relaxed space-y-4">
                {intro}
              </div>
            )}
          </ScrollReveal>
        )}
        {children}
      </section>
    </>
  );
}
