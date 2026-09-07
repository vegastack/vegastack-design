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
 * boundary onto those server-safe components too. The mirrored `lucide-animated` icons already
 * expose an imperative handle for exactly this, so the wiring belongs in the interactive leaf
 * that needs it.
 *
 * The mechanism: attaching a ref flips the mirrored icon into "controlled" mode, which disables
 * ALL of its own triggers — hover, focus, and the touch `pointerdown` tap — so the card must
 * re-provide every one of them or that input silently stops working. Hover, focus, tap and click
 * are therefore all wired here, under the same pointer-type rules the factory applies: a coarse
 * pointer plays on `pointerdown` (a touch "hover" is meaningless), a fine pointer plays on enter
 * and rests on leave.
 *
 * The glyph is decorative because the button carries the name.
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

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch") start();
    },
    [start],
  );
  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch") stop();
    },
    [stop],
  );
  // The tap driver the ref latch takes away. Without it the whole gallery is
  // inert on a touch device: no hover exists there, and nothing else plays.
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "touch") start();
    },
    [start],
  );

  return (
    <button
      type="button"
      aria-label={`${label} icon — play animation`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
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
