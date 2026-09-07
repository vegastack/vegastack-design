"use client";

import * as React from "react";
import {
  AnimatedIcon,
  type AnimatedIconComponent,
  type AnimatedIconHandle,
} from "@vegastack/design/icons";

/**
 * `AnimatedIconCard` — a gallery tile whose WHOLE surface drives the icon's motion. A real
 * `<button type="button">` named by the icon (DC-12): one tab stop with a role and an accessible
 * name, not a focusable `div`. Activating it replays the animation.
 *
 * Why this lives here (a client leaf) and not inside `AnimatedIcon`: the shared `AnimatedIcon`
 * wrapper is deliberately hook-free so it stays server-safe — it ships in the same bundle entry
 * as `Icon`/`BrandIcon`, and adding `useRef`/`useEffect` there would force a `'use client'`
 * boundary onto those server-safe components too. Attaching a ref flips the mirrored icon into
 * "controlled" mode, which disables its own glyph-only hover — so the card's handlers become the
 * single source of truth. Pointer AND keyboard are wired, so a focused card animates exactly like
 * a hovered one.
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
    <button
      type="button"
      aria-label={`${label} icon — play animation`}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
      onClick={start}
      className={className}
    >
      <AnimatedIcon ref={icon} as={as} size="lg" aria-hidden />
      <span aria-hidden className="text-xs leading-4 text-muted-foreground">
        {label}
      </span>
    </button>
  );
}
