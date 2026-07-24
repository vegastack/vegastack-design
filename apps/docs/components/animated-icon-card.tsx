"use client";

import * as React from "react";
import {
  AnimatedIcon,
  type AnimatedIconComponent,
  type AnimatedIconHandle,
} from "@vegastack/design/icons";

/**
 * `AnimatedIconCard` — a gallery tile whose WHOLE surface drives the icon's motion.
 *
 * Why this lives here (a client leaf) and not inside `AnimatedIcon`: the shared
 * `AnimatedIcon` wrapper is deliberately hook-free so it stays server-safe — it
 * ships in the same bundle entry as `Icon`/`BrandIcon`, and adding `useRef`/
 * `useEffect` there would force a `'use client'` boundary onto those server-safe
 * components too. The mirrored `lucide-animated` icons already expose an
 * imperative handle for exactly this, so the ancestor-hover wiring belongs in the
 * interactive leaf that needs it.
 *
 * The mechanism: attaching a ref flips the mirrored icon into "controlled" mode,
 * which disables its own glyph-only hover — so the card's handlers become the
 * single source of truth. Pointer AND keyboard are wired, so a tab-focused card
 * animates exactly like a hovered one.
 */
export function AnimatedIconCard({
  as,
  label,
  className,
}: {
  as: AnimatedIconComponent;
  label: string;
  className?: string;
}) {
  const icon = React.useRef<AnimatedIconHandle>(null);
  const start = React.useCallback(() => icon.current?.startAnimation(), []);
  const stop = React.useCallback(() => icon.current?.stopAnimation(), []);

  return (
    <div
      tabIndex={0}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
      className={className}
    >
      <AnimatedIcon ref={icon} as={as} size="lg" aria-label={label} />
      <span className="text-xs leading-4 text-fd-muted-foreground">
        {label}
      </span>
    </div>
  );
}
