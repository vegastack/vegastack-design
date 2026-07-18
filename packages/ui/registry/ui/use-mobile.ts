// @vegastack use-mobile@0.1.0 sha256-n8DQ1PvhUun2lD68D6R0Dx0YMvN6cpj/WQvl3HYd67o=

'use client';

import * as React from 'react';

/**
 * SSR-safe read of `(max-width: <breakpoint - 1>px)` — true once the viewport has narrowed
 * past `breakpoint`. Mirrors `truncated-text.tsx`'s `getPrefersNoHover`: returns `false`
 * (desktop) on the server and whenever `matchMedia` is unavailable, so the pre-hydration
 * render never assumes mobile.
 */
function getIsMobile(breakpoint: number): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
}

/**
 * `useIsMobile` — tracks whether the viewport is narrower than `breakpoint`, live (resizes,
 * device rotation, and devtools viewport changes all re-fire it). SSR-safe: the initial
 * render always returns `false` and the real value lands in a client-only effect, exactly
 * like `truncated-text.tsx`'s `usePrefersNoHover` — so server and client markup agree on
 * first paint and React never warns about a hydration mismatch.
 *
 * @param breakpoint - Viewport width (px) at and above which the layout is "desktop". Below
 *   it, `useIsMobile` reports `true`.
 *   @default 768
 *
 * @example
 * // Switch a nav rail into a slide-in Sheet below 768px
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 *
 * @example
 * // Custom breakpoint
 * const isCompact = useIsMobile(1024);
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = React.useState(() => getIsMobile(breakpoint));

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQueryList = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mediaQueryList.matches);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQueryList.addEventListener('change', onChange);
    return () => mediaQueryList.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
