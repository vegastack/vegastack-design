"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

interface HomeProofStatementProps {
  id: string;
  text: string;
  className?: string;
}

type ProofStyle = React.CSSProperties & {
  "--home-proof-progress": number;
};

type WordStyle = React.CSSProperties & {
  "--home-proof-offset": number;
};

/**
 * A single scroll-scrubbed proof sentence for the docs homepage. The server
 * renders every word fully visible; the client progressively dims/reveals the
 * sentence only when motion is allowed. One passive scroll listener batches a
 * layout read and one custom-property write in requestAnimationFrame.
 */
export function HomeProofStatement({
  id,
  text,
  className,
}: HomeProofStatementProps) {
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const words = React.useMemo(() => text.split(/\s+/), [text]);

  React.useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;

    const writeProgress = () => {
      frame = null;
      if (motionQuery.matches) {
        heading.style.setProperty("--home-proof-progress", "1");
        return;
      }

      const rect = heading.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.9;
      const distance = viewportHeight * 0.68;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / distance));
      heading.style.setProperty("--home-proof-progress", String(progress));
    };

    const scheduleProgress = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(writeProgress);
    };

    scheduleProgress();
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress);
    motionQuery.addEventListener("change", scheduleProgress);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      motionQuery.removeEventListener("change", scheduleProgress);
    };
  }, []);

  return (
    <h2
      ref={headingRef}
      id={id}
      className={cn(
        "max-w-5xl text-balance text-display-lg text-foreground sm:text-display-xl",
        className,
      )}
      style={{ "--home-proof-progress": 1 } as ProofStyle}
    >
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span
            className="home-proof-word inline-block"
            style={
              {
                "--home-proof-offset":
                  words.length > 1 ? (index / (words.length - 1)) * 0.52 : 0,
              } as WordStyle
            }
          >
            {word}
          </span>{" "}
        </React.Fragment>
      ))}
    </h2>
  );
}
