import type { CSSProperties } from 'react';

/**
 * Every shipped semantic token (the `--<name>` CSS vars in `@vegastack/design-tokens/theme.css`),
 * grouped by role. Kept in sync with theme.css — if you add a token there, add it here.
 */
const COLOR_GROUPS: { label: string; tokens: string[] }[] = [
  {
    label: 'Surfaces & text',
    tokens: [
      'background', 'foreground',
      'card', 'card-foreground',
      'popover', 'popover-foreground',
      'secondary', 'secondary-foreground',
      'muted', 'muted-foreground', 'muted-foreground-faint',
      'accent', 'accent-foreground',
    ],
  },
  {
    label: 'Action — neutral ink',
    tokens: ['primary', 'primary-foreground', 'primary-hover', 'primary-active'],
  },
  {
    label: 'Info — links & informational (the one chromatic accent)',
    tokens: ['info', 'info-foreground', 'info-hover', 'info-active', 'info-subtle', 'info-text'],
  },
  {
    label: 'Destructive',
    tokens: ['destructive', 'destructive-foreground', 'destructive-hover', 'destructive-active', 'destructive-subtle', 'destructive-text'],
  },
  {
    label: 'Success',
    tokens: ['success', 'success-foreground', 'success-hover', 'success-active', 'success-subtle', 'success-text'],
  },
  {
    label: 'Warning',
    tokens: ['warning', 'warning-foreground', 'warning-hover', 'warning-active', 'warning-subtle', 'warning-text'],
  },
  { label: 'Lines & utility', tokens: ['border', 'input', 'ring', 'track', 'overlay'] },
  { label: 'Charts — categorical series', tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7', 'chart-8'] },
  {
    label: 'Sidebar surface',
    tokens: [
      'sidebar', 'sidebar-foreground',
      'sidebar-primary', 'sidebar-primary-foreground',
      'sidebar-accent', 'sidebar-accent-foreground',
      'sidebar-border', 'sidebar-ring',
    ],
  },
];

/** Live swatch grid — each chip reads the real `--<token>` CSS variable, grouped by role. */
export function ColorPalette() {
  return (
    <div className="not-prose my-6 space-y-6">
      {COLOR_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-xs font-medium text-fd-muted-foreground">{group.label}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map((name) => (
              <div key={name} className="overflow-hidden rounded-lg border border-fd-border">
                <div className="h-12" style={{ backgroundColor: `var(--${name})` }} />
                <div className="bg-fd-card px-2 py-1.5 font-mono text-[11px] text-fd-muted-foreground">
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

/** Live type-scale specimen — Geist display/heading/body plus the mono voice layer. */
export function TypeScale() {
  return (
    <div className="not-prose my-6 space-y-4 rounded-lg border border-fd-border bg-fd-card p-6">
      <p
        className="font-sans text-fd-foreground"
        style={{
          fontSize: 'var(--text-display-sm)',
          lineHeight: 'var(--text-display-sm--line-height)',
          fontWeight: 'var(--text-display-sm--font-weight)',
          letterSpacing: 'var(--text-display-sm--letter-spacing)',
        }}
      >
        Geist display — hero heading
      </p>
      <p
        className="font-sans text-fd-foreground"
        style={{
          fontSize: 'var(--text-h2)',
          lineHeight: 'var(--text-h2--line-height)',
          fontWeight: 'var(--text-h2--font-weight)',
          letterSpacing: 'var(--text-h2--letter-spacing)',
        }}
      >
        Geist — section heading at 400
      </p>
      <p className="font-sans text-base text-fd-foreground">Geist sans — body copy.</p>
      <p className="font-sans text-sm text-fd-muted-foreground">Geist sans — caption / muted.</p>
      <p className="font-mono text-sm text-fd-foreground">Geist Mono — $1,234.56 · code · numbers</p>
    </div>
  );
}

/**
 * Corner-radius ramp. Each swatch reads the real `--radius-*` CSS variable.
 * `--radius-xl` is bridged in `@theme inline` as `calc(var(--radius-lg) + 0.25rem)`.
 */
const RADIUS_STEPS: { token: string; value: string }[] = [
  { token: '--radius-sm', value: '0.375rem' },
  { token: '--radius-md', value: '0.5rem' },
  { token: '--radius', value: '0.75rem' },
  { token: '--radius-lg', value: '0.75rem' },
  { token: '--radius-xl', value: 'calc(--radius-lg + 0.25rem)' },
];

/** Live radius specimen — each tile is rounded using its `--radius-*` token. */
export function RadiusScale() {
  return (
    <div className="not-prose my-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {RADIUS_STEPS.map(({ token, value }) => (
        <div key={token} className="flex flex-col items-center gap-2">
          <div
            className="h-16 w-16 border border-fd-border bg-fd-muted"
            style={{ borderRadius: `var(${token})` }}
          />
          <div className="text-center">
            <p className="font-mono text-[11px] text-fd-foreground">{token}</p>
            <p className="font-mono text-[10px] text-fd-muted-foreground">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Elevation specimen. The system ships exactly ONE sanctioned shadow:
 * `--shadow-overlay`, reserved for floating overlays (popovers, dialogs, menus).
 */
export function ShadowScale() {
  return (
    <div className="not-prose my-6">
      <div className="flex flex-col items-start gap-3 rounded-lg bg-fd-background p-8">
        <div
          className="rounded-lg border border-fd-border bg-fd-card px-5 py-4"
          style={{ boxShadow: 'var(--shadow-overlay)' }}
        >
          <p className="text-sm font-medium text-fd-foreground">Overlay surface</p>
          <p className="text-xs text-fd-muted-foreground">Floating panel — popover, dialog, menu.</p>
        </div>
        <p className="font-mono text-[11px] text-fd-muted-foreground">--shadow-overlay</p>
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
            className="h-4 rounded-sm bg-fd-primary"
            style={{ width: `calc(var(--spacing) * ${step})` }}
          />
          <span className="font-mono text-[11px] text-fd-muted-foreground">
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
  { token: '--duration-fast', value: '150ms' },
  { token: '--duration-base', value: '200ms' },
  { token: '--duration-slow', value: '300ms' },
];

const EASING_DEMOS: { token: string; value: string }[] = [
  { token: '--motion-ease-standard', value: 'cubic-bezier(0.2, 0, 0, 1)' },
  { token: '--motion-ease-emphasized', value: 'cubic-bezier(0.3, 0, 0, 1)' },
  { token: '--motion-ease-exit', value: 'cubic-bezier(0.4, 0, 1, 1)' },
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
      <div className="relative h-6 overflow-hidden rounded-md border border-fd-border bg-fd-muted">
        <span
          className="absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-fd-primary motion-reduce:animate-none"
          style={style}
        />
      </div>
      <p className="font-mono text-[11px] text-fd-foreground">{label}</p>
      <p className="font-mono text-[10px] text-fd-muted-foreground">{value}</p>
    </div>
  );
}

/** Live motion specimen — looping demos per duration + per easing token. */
export function MotionSpecimen() {
  return (
    <div className="not-prose my-6 space-y-6">
      <style>{`
        @keyframes vega-motion-slide {
          from { transform: translateX(0) translateY(-50%); }
          to   { transform: translateX(calc(100% - 1.5rem)) translateY(-50%); }
        }
      `}</style>
      <div>
        <h3 className="mb-2 text-xs font-medium text-fd-muted-foreground">Duration</h3>
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
        <h3 className="mb-2 text-xs font-medium text-fd-muted-foreground">Easing</h3>
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
 * Numeric type ramp from the real `--text-*` tokens bridged in `@theme inline`.
 * Three tiers (plan v5 T1): the CORE ladder (token-driven text-xs…3xl, base = 14px),
 * the ROLE tokens (h1…h4, label*, code*), and the DISPLAY tier (32/40/56/72 with the
 * tokenized negative tracking ramp). Each row reads its size + line-height var live.
 * The container carries `vs-type-product` so the specimen shows the PRODUCT ladder —
 * the docs shell itself is bound to the doc ladder (see global.css boundary).
 */
const TYPE_STEPS: { token: string; size: string; leading: string; note?: string }[] = [
  { token: '--text-display-xl', size: '4.5rem', leading: '4.75rem', note: '−0.06em' },
  { token: '--text-display-lg', size: '3.5rem', leading: '3.75rem', note: '−0.05em' },
  { token: '--text-display-md', size: '2.5rem', leading: '2.75rem', note: '−0.045em' },
  { token: '--text-display-sm', size: '2rem', leading: '2.25rem', note: '−0.04em' },
  { token: '--text-h1', size: '1.5rem', leading: '2rem', note: '−0.02em' },
  { token: '--text-h2', size: '1.25rem', leading: '1.75rem', note: '−0.015em' },
  { token: '--text-h3', size: '1.125rem', leading: '1.5rem', note: '−0.01em' },
  { token: '--text-h4', size: '1rem', leading: '1.375rem' },
  { token: '--text-label', size: '0.875rem', leading: '1.25rem' },
  { token: '--text-label-sm', size: '0.75rem', leading: '1rem' },
  { token: '--text-code', size: '0.8125rem', leading: '1.25rem' },
  { token: '--text-code-sm', size: '0.75rem', leading: '1rem' },
];

/** The core product ladder — what `text-xs…text-3xl` resolve to on product surfaces. */
const CORE_STEPS: { token: string; px: string }[] = [
  { token: '--text-3xl', px: '24 / 32' },
  { token: '--text-2xl', px: '20 / 28' },
  { token: '--text-xl', px: '18 / 26' },
  { token: '--text-lg', px: '16 / 24' },
  { token: '--text-base', px: '14 / 21 · default body' },
  { token: '--text-sm', px: '12 / 16' },
  { token: '--text-xs', px: '11 / 16' },
];

/** Live numeric type-ramp specimen reading the `--text-*` size/leading tokens. */
export function TypeScaleSizes() {
  return (
    <div className="vs-type-product not-prose my-6 divide-y divide-fd-border rounded-lg border border-fd-border">
      {TYPE_STEPS.map(({ token, size, leading, note }) => (
        <div key={token} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
          <span
            className={/code/.test(token) ? 'font-mono text-fd-foreground' : 'font-sans text-fd-foreground'}
            style={{
              fontSize: `var(${token})`,
              lineHeight: `var(${token}--line-height)`,
              fontWeight: `var(${token}--font-weight, 400)`,
              letterSpacing: `var(${token}--letter-spacing, 0em)`,
            }}
          >
            Geist — the quick brown fox
          </span>
          <span className="font-mono text-[11px] text-fd-muted-foreground">
            {token} · {size} / {leading}
            {note ? ` · ${note}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Live core-ladder specimen — the token-driven values behind `text-xs…text-3xl`. */
export function TypeCoreLadder() {
  return (
    <div className="vs-type-product not-prose my-6 divide-y divide-fd-border rounded-lg border border-fd-border">
      {CORE_STEPS.map(({ token, px }) => (
        <div key={token} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
          <span
            className="font-sans text-fd-foreground"
            style={{ fontSize: `var(${token})`, lineHeight: `var(${token}--line-height)` }}
          >
            Geist — the quick brown fox
          </span>
          <span className="font-mono text-[11px] text-fd-muted-foreground">
            {token} · {px}px
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
    <div className="not-prose my-6 space-y-3 rounded-lg border border-fd-border bg-fd-card p-6">
      <p className="text-xs text-fd-muted-foreground">
        Press <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-[10px]">Tab</kbd> to
        move focus onto these controls and reveal the <span className="font-mono">--ring</span> outline.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
        >
          Focusable button
        </button>
        <input
          type="text"
          placeholder="Focusable input"
          className="rounded-md border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
        />
      </div>
    </div>
  );
}
