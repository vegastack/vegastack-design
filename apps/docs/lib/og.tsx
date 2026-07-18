import { appName } from './shared';

// Literal (non-CSS-variable) colors baked in for Satori/ImageResponse, which cannot read the
// runtime `oklch()` custom properties from packages/design-tokens. Sourced from the dark-theme build
// (packages/design-tokens/dist/theme.css `.dark` block) — background/foreground/muted-foreground/brand.
// `brand` (phosphor-green) is a "marker roles only" token per its DTCG description (never a fill,
// headline color, or button) — used here only as a thin top accent stripe + a small live-dot next
// to the wordmark, matching how it's used elsewhere in the system.
// Satori (the ImageResponse renderer) evaluates styles in an isolated non-DOM context — it never
// loads app/global.css, so `var(--background)` etc. would resolve to nothing. Literal values are
// the only option here; each is a direct copy of its token's compiled value (cited above).
/* eslint-disable no-restricted-syntax -- literals required, see comment above */
const OG_BACKGROUND = '#11100f';
const OG_FOREGROUND = '#e6e5e3';
const OG_MUTED = '#939290';
const OG_ACCENT = '#56f57c';
/* eslint-enable no-restricted-syntax */

interface OGImageProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

/** Branded 1200x630 OG image body, rendered inside `next/og`'s `ImageResponse`. */
export function OGImage({ title, description, eyebrow }: OGImageProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: OG_BACKGROUND,
        color: OG_FOREGROUND,
        padding: '72px',
        borderTop: `6px solid ${OG_ACCENT}`,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            width: '12px',
            height: '12px',
            borderRadius: '999px',
            backgroundColor: OG_ACCENT,
          }}
        />
        <span style={{ fontSize: '30px', fontWeight: 600, color: OG_MUTED }}>
          {eyebrow ?? appName}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          gap: '20px',
        }}
      >
        <span
          style={{
            fontSize: '76px',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: '980px',
          }}
        >
          {title}
        </span>
        {description ? (
          <span
            style={{
              fontSize: '34px',
              color: OG_MUTED,
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            {description}
          </span>
        ) : null}
      </div>

      <span style={{ fontSize: '26px', color: OG_MUTED }}>design.vegastack.com</span>
    </div>
  );
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = 'image/png';
