import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";

/**
 * Every shipped semantic token (the `--<name>` CSS vars in `@vegastack/design-tokens/theme.css`),
 * grouped by role. Kept in sync with theme.css — if you add a token there, add it here.
 */
const COLOR_GROUPS: { label: string; tokens: string[] }[] = [
  {
    // The four neutral surface roles and the text ramp. `muted`, `accent` and `secondary` share
    // one value today and are kept as three roles on purpose, so a consumer can retune a hover
    // without moving every well.
    label: "Surfaces & text",
    tokens: [
      "background",
      "foreground",
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
    ],
  },
  {
    label: "Action — neutral ink",
    tokens: ["primary", "primary-foreground"],
  },
  {
    // Each status family is written in upstream's own `destructive` shape — a fill, an on-fill
    // ink — plus the `-text` ink ours adds for the page and for the family's own tint.
    label: "Info — links & informational (the one chromatic accent)",
    tokens: ["info", "info-foreground", "info-text"],
  },
  {
    label: "Destructive",
    tokens: ["destructive", "destructive-foreground", "destructive-text"],
  },
  {
    label: "Success",
    tokens: ["success", "success-foreground", "success-text"],
  },
  {
    label: "Warning",
    tokens: ["warning", "warning-foreground", "warning-text"],
  },
  {
    label: "Lines & focus",
    tokens: ["border", "input", "ring"],
  },
  {
    label: "Brand",
    tokens: ["brand", "brand-text"],
  },
  {
    // Theme-invariant on purpose: chrome over video is a dark scrim with light ink in both themes.
    label: "Media chrome",
    tokens: ["media-scrim", "media-scrim-strong", "media-foreground"],
  },
  {
    label: "Charts — categorical series",
    tokens: [
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",
      "chart-6",
      "chart-7",
      "chart-8",
      "chart-single",
    ],
  },
  {
    label: "Tags — categorical metadata (not status)",
    tokens: [
      "blue",
      "cyan",
      "green",
      "lime",
      "yellow",
      "orange",
      "red",
      "pink",
      "magenta",
      "purple",
    ].flatMap((hue) => [`tag-${hue}`, `tag-${hue}-subtle`, `tag-${hue}-text`]),
  },
  {
    label: "Sidebar surface",
    tokens: [
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ],
  },
];

/** Live swatch grid — each chip reads the real `--<token>` CSS variable, grouped by role. */
export function ColorPalette() {
  return (
    <div className="not-prose my-6 space-y-6">
      {COLOR_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map((name) => (
              <div
                key={name}
                className="overflow-hidden rounded-lg border border-border"
              >
                <div
                  className="h-12"
                  style={{ backgroundColor: `var(--${name})` }}
                />
                <div className="bg-card px-2 py-1.5 font-mono text-xs text-muted-foreground">
                  --{name}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Live type-scale specimen — Geist across the stock Tailwind ladder plus the mono voice. */
export function TypeScale() {
  return (
    <div className="not-prose my-6 space-y-4 rounded-lg border border-border bg-card p-6">
      <p className="font-sans text-5xl font-semibold text-foreground">
        Geist display — hero heading
      </p>
      <p className="font-sans text-2xl font-semibold text-foreground">
        Geist — section heading
      </p>
      <p className="font-sans text-base text-foreground">
        Geist sans — body copy.
      </p>
      <p className="font-sans text-sm text-muted-foreground">
        Geist sans — caption / muted.
      </p>
      <p className="font-mono text-sm text-foreground">
        Geist Mono — $1,234.56 · code · numbers
      </p>
    </div>
  );
}

/**
 * Corner-radius ramp. Each swatch reads the real `--radius-*` CSS variable, every one of which is
 * derived from the single `--radius` token exactly as upstream derives it.
 */
const RADIUS_STEPS: { token: string; value: string }[] = [
  { token: "--radius-sm", value: "0.6 × --radius · 6px" },
  { token: "--radius-md", value: "0.8 × --radius · 8px" },
  { token: "--radius-lg", value: "1 × --radius · 10px" },
  { token: "--radius-xl", value: "1.4 × --radius · 14px" },
];

/** Live radius specimen — each tile is rounded using its `--radius-*` token. */
export function RadiusScale() {
  return (
    <div className="not-prose my-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {RADIUS_STEPS.map(({ token, value }) => (
        <div key={token} className="flex flex-col items-center gap-2">
          <div
            className="h-16 w-16 border border-border bg-muted"
            style={{ borderRadius: `var(${token})` }}
          />
          <div className="text-center">
            <p className="font-mono text-xs text-foreground">{token}</p>
            <p className="font-mono text-xs text-muted-foreground">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Elevation specimen. There is no single named overlay role any more: a floating surface takes
 * Tailwind's own `shadow-sm`/`shadow-md`/`shadow-lg`, at the weight upstream gives that component.
 */
const SHADOW_STEPS: { utility: string; role: string }[] = [
  {
    utility: "shadow-sm",
    role: "active tab chip · floating sidebar · inset main",
  },
  { utility: "shadow-md", role: "popover · menu · select" },
  { utility: "shadow-lg", role: "sheet · submenu" },
];

export function ShadowScale() {
  return (
    <div className="not-prose my-6">
      <div className="flex flex-wrap items-start gap-6 rounded-xl bg-background p-8">
        {SHADOW_STEPS.map(({ utility, role }) => (
          <div key={utility} className="flex flex-col items-start gap-2">
            <div
              className={`rounded-xl border border-border bg-card px-5 py-4 ${utility}`}
            >
              <p className="text-sm font-medium text-foreground">
                Floating surface
              </p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">{utility}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4px spacing ladder. Each bar's width is derived from Tailwind v4's base
 * `--spacing` unit (0.25rem) via `calc(var(--spacing) * step)`, so the bars
 * track the real token rather than hardcoded px.
 */
const SPACING_STEPS = [1, 2, 3, 4, 6, 8, 12, 16];

/** Live spacing specimen — horizontal bars at the 4px scale steps. */
export function SpacingScale() {
  return (
    <div className="not-prose my-6 space-y-2">
      {SPACING_STEPS.map((step) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className="h-4 rounded-sm bg-primary"
            style={{ width: `calc(var(--spacing) * ${step})` }}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {step} · calc(var(--spacing) * {step}) · {step * 4}px
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Motion specimen. Demonstrates each duration (`--duration-*`) and each easing
 * (`--motion-ease-*`) with a looping translate. Honors `prefers-reduced-motion`
 * via `motion-reduce:animate-none` (and the global token-level enforcement in
 * base.css), so the dots freeze when the user opts out of motion.
 */
const DURATION_DEMOS: { token: string; value: string }[] = [
  { token: "--duration-fast", value: "150ms" },
  { token: "--duration-base", value: "200ms" },
  { token: "--duration-slow", value: "300ms" },
];

const EASING_DEMOS: { token: string; value: string }[] = [
  { token: "--motion-ease-standard", value: "cubic-bezier(0.2, 0, 0, 1)" },
  { token: "--motion-ease-emphasized", value: "cubic-bezier(0.3, 0, 0, 1)" },
  { token: "--motion-ease-exit", value: "cubic-bezier(0.4, 0, 1, 1)" },
];

function MotionTrack({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style: CSSProperties;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-6 overflow-hidden rounded-md border border-border bg-muted">
        <span
          className="absolute start-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-primary"
          style={style}
        />
      </div>
      <p className="font-mono text-xs text-foreground">{label}</p>
      <p className="font-mono text-xs text-muted-foreground">{value}</p>
    </div>
  );
}

/** Live motion specimen — looping demos per duration + per easing token. */
export function MotionSpecimen() {
  return (
    <div className="not-prose my-6 space-y-6">
      <style>{`
        @keyframes vega-motion-slide {
          from { inset-inline-start: var(--spacing); }
          to   { inset-inline-start: calc(100% - (var(--spacing) * 5)); }
        }
      `}</style>
      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          Duration
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {DURATION_DEMOS.map(({ token, value }) => (
            <MotionTrack
              key={token}
              label={token}
              value={value}
              style={{
                animation: `vega-motion-slide var(${token}) var(--motion-ease-standard) infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          Easing
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {EASING_DEMOS.map(({ token, value }) => (
            <MotionTrack
              key={token}
              label={token}
              value={value}
              style={{
                animation: `vega-motion-slide var(--duration-slow) var(${token}) infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The type ramp. One scale now — Tailwind's own — so a row simply wears the utility it names and
 * the specimen cannot drift from what a consumer gets.
 */
// size / line-height / letter-spacing, as declared in the `@theme` bridge. The copy tier
// (`text-base` and below) carries NO letter-spacing on purpose — that is Geist's own copy/heading
// split, so those rows show a dash rather than a zero. Keep in sync with the ramp; the rows below
// render live, so a wrong number here is visible next to the thing it describes.
const TYPE_STEPS: { token: string; px: string; ls?: string; note?: string }[] =
  [
    { token: "text-7xl", px: "72 / 72", ls: "−0.06em", note: "display" },
    { token: "text-6xl", px: "60 / 64", ls: "−0.06em", note: "display" },
    { token: "text-5xl", px: "48 / 56", ls: "−0.06em", note: "display" },
    { token: "text-4xl", px: "36 / 44", ls: "−0.05em" },
    { token: "text-3xl", px: "30 / 38", ls: "−0.04em" },
    { token: "text-2xl", px: "24 / 32", ls: "−0.04em" },
    { token: "text-xl", px: "20 / 26", ls: "−0.02em" },
    { token: "text-lg", px: "18 / 26", ls: "−0.012em" },
    { token: "text-base", px: "16 / 24", note: "prose body" },
    {
      token: "text-sm",
      px: "14 / 20",
      note: "default body · the control voice",
    },
    { token: "text-xs", px: "12 / 16" },
  ];

/** Live type-ramp specimen. Every row wears the utility it names, so it reads the real value. */
export function TypeScaleSizes() {
  return (
    <div className="not-prose my-6 divide-y divide-border rounded-lg border border-border">
      {TYPE_STEPS.map(({ token, px, ls, note }) => (
        <div
          key={token}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3"
        >
          <span className={`font-sans text-foreground ${token}`}>
            Geist — the quick brown fox
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {token} · {px}
            {ls ? ` · ${ls}` : ""}
            {note ? ` · ${note}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Focus-ring specimen. The system uses a single `:focus-visible` outline keyed
 * off `--ring`. Tab into the controls below to see the treatment — it appears
 * only on keyboard focus, never on mouse click.
 */
export function FocusRingSpecimen() {
  return (
    <div className="not-prose my-6 space-y-3 rounded-lg border border-border bg-card p-6">
      <p className="text-xs text-muted-foreground">
        Press <Kbd>Tab</Kbd> to move focus onto these controls and reveal the{" "}
        <span className="font-mono">--ring</span> outline.
      </p>
      {/* The real components (DC-09): the specimen demonstrates the ring `Button` gets from the
          global `:focus-visible` rule and the border tint `Input` uses instead — not a copy of
          either. */}
      <div className="flex flex-wrap items-center gap-3">
        <Button>Focusable button</Button>
        <Input
          type="text"
          placeholder="Focusable input"
          aria-label="Focusable input"
          className="w-48"
        />
      </div>
    </div>
  );
}
