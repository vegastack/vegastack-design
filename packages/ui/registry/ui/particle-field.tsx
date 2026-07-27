// @vegastack particle-field@0.4.0 sha256-Ul0v2ruG0D3+mOZ5R4yJcllOdX19H2SSkxP8wF51lug=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

/**
 * Deterministic seeded PRNG (mulberry32) — NEVER `Math.random()` at render.
 * The same `seed` always produces the same particle layout, so a screenshot
 * (VRT) or a server/client re-render never drifts.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Particle {
  /** Normalized [0,1] position — multiplied by the canvas size at draw time. */
  x: number;
  y: number;
  /** Radius in CSS px (before devicePixelRatio scaling). */
  r: number;
  /** Normalized velocity per frame — deliberately tiny (subtle drift, not a flurry). */
  vx: number;
  vy: number;
  /** Per-particle alpha — every particle sits at "very low alpha" per the brand accent budget. */
  alpha: number;
}

/** The cap on particle count — stays subtle + performant regardless of the `count` prop. */
export const PARTICLE_FIELD_MAX_COUNT = 120;

function createParticles(count: number, seed: number): Particle[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: rand(),
    y: rand(),
    r: 0.5 + rand() * 1.25,
    vx: (rand() - 0.5) * 0.00035,
    vy: (rand() - 0.5) * 0.00035,
    alpha: 0.08 + rand() * 0.18,
  }));
}

/** Same SSR-safe pattern as `animated-number.tsx`'s `usePrefersReducedMotion`. */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return prefersReducedMotion;
}

/** Props accepted by `ParticleField`. */
export interface ParticleFieldProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * Deterministic PRNG seed. The same seed always produces the same particle
   * layout — change it to get a different (but still stable) field.
   * @default 1
   */
  seed?: number;
  /**
   * Particle count. Capped at {@link PARTICLE_FIELD_MAX_COUNT} regardless of
   * the value passed — stays subtle and performant by construction.
   * @default 48
   */
  count?: number;
}

/**
 * `ParticleField` — a very-low-alpha canvas field of drifting phosphor
 * (`--brand`) dots, meant as hero-background atmosphere, never a focal
 * element. Absolutely positioned to fill its parent (`inset-0`); wrap it in a
 * `relative` container.
 *
 * **Lazy by construction**: the draw/animate effect only starts once the
 * element is intersecting the viewport AND the browser reports idle
 * (`requestIdleCallback`, falling back to a `setTimeout(0)` where
 * unsupported) — a hero hidden below the fold never spends a frame budget
 * before it's visible. For true code-splitting (not loading the component's
 * JS at all until needed), wrap the IMPORT at the call site in
 * `next/dynamic(() => import(...), { ssr: false })` — see the docs-home hero
 * for the reference usage.
 *
 * **Reduced motion**: renders exactly ONE static frame (no `requestAnimationFrame`
 * loop at all) when `prefers-reduced-motion: reduce`.
 *
 * **Deterministic**: particle positions/velocities come from a seeded PRNG
 * (mulberry32) — never `Math.random()` — so the same `seed` always produces
 * the same layout (VRT-stable once the reduced-motion static frame is drawn).
 *
 * The root element carries `data-drawn` once the first frame has actually
 * painted — a VRT harness (or a test) can wait on that attribute instead of
 * guessing a delay.
 *
 * Purely decorative — rendered `aria-hidden`.
 *
 * @example
 * <div className="relative">
 *   <ParticleField seed={7} count={48} />
 *   <h1 className="relative">Ship agentic UI, fast.</h1>
 * </div>
 */
export function ParticleField({
  seed = 1,
  count = 48,
  className,
  ref,
  ...props
}: ParticleFieldProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const setMergedRef = React.useCallback(
    (instance: HTMLDivElement | null) => {
      setContainer(instance);
      if (typeof ref === "function") ref(instance);
      else if (ref) ref.current = instance;
    },
    [ref],
  );

  const prefersReducedMotion = usePrefersReducedMotion();
  const clampedCount = Math.max(0, Math.min(count, PARTICLE_FIELD_MAX_COUNT));

  const [isVisible, setIsVisible] = React.useState(false);
  React.useEffect(() => {
    if (!container) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsVisible(true);
        io.disconnect();
      }
    });
    io.observe(container);
    return () => io.disconnect();
  }, [container]);

  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!isVisible) return;
    if (
      typeof window !== "undefined" &&
      typeof window.requestIdleCallback === "function"
    ) {
      const id = window.requestIdleCallback(() => setReady(true));
      return () => window.cancelIdleCallback?.(id);
    }
    const id = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, [isVisible]);

  // Flips true once the first frame has actually painted — exposed as `data-drawn` so a
  // consumer (or a VRT harness) can wait for the field to settle instead of guessing a delay.
  const [drawn, setDrawn] = React.useState(false);

  React.useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = createParticles(clampedCount, seed);
    const dpr =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    // `currentColor` is the CSS-native fallback when the token stylesheet is unavailable (for
    // example, the CSS-less unit harness); the canvas itself carries `text-brand`, so production
    // rendering still resolves the semantic theme token with no duplicated color literal.
    const brand = (
      getComputedStyle(canvas).getPropertyValue("--brand") || "currentColor"
    ).trim();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
    }
    resize();

    function drawFrame() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = brand;
      for (const p of particles) {
        ctx!.globalAlpha = p.alpha;
        ctx!.beginPath();
        ctx!.arc(p.x * w, p.y * h, p.r * dpr, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      setDrawn(true);
    }

    if (prefersReducedMotion) {
      drawFrame();
      return;
    }

    let raf: number | null = null;
    function tick() {
      for (const p of particles) {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
      }
      drawFrame();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
          })
        : null;
    ro?.observe(canvas);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [ready, clampedCount, seed, prefersReducedMotion]);

  return (
    <div
      ref={setMergedRef}
      data-slot="particle-field"
      data-drawn={drawn ? "" : undefined}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        data-slot="particle-field-canvas"
        className="size-full text-brand"
      />
    </div>
  );
}
