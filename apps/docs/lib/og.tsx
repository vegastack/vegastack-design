import { readFile } from "node:fs/promises";
import path from "node:path";

// Literal (non-CSS-variable) colors baked in for Satori/ImageResponse, which cannot read the
// runtime `oklch()` custom properties from packages/design-tokens. Sourced from the dark-theme build
// (packages/design-tokens/dist/theme.css `.dark` block) — background, foreground, and muted foreground.
// Satori (the ImageResponse renderer) evaluates styles in an isolated non-DOM context — it never
// loads app/global.css, so `var(--background)` etc. would resolve to nothing. Literal values are
// the only option here; each is a direct copy of its token's compiled value (cited above).
/* eslint-disable no-restricted-syntax -- literals required, see comment above */
const OG_BACKGROUND = "#11100f";
const OG_FOREGROUND = "#e6e5e3";
const OG_MUTED = "#939290";
/* eslint-enable no-restricted-syntax */

function arrayBuffer(bytes: Buffer) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

let fontsPromise: Promise<
  Array<{
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: "normal";
  }>
> | null = null;

/** Build-local fonts, including an OFL symbol face for glyphs such as U+2318 COMMAND PLACE. */
export function getOGFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(process.cwd(), "assets", "fonts", "Geist-Regular.ttf")),
    readFile(path.join(process.cwd(), "assets", "fonts", "Geist-Bold.ttf")),
    readFile(
      path.join(
        process.cwd(),
        "assets",
        "fonts",
        "NotoSansSymbols2-Regular.woff",
      ),
    ),
  ]).then(([regular, bold, symbols]) => [
    {
      name: "VegaStack Sans",
      data: arrayBuffer(regular),
      weight: 400,
      style: "normal",
    },
    {
      name: "VegaStack Sans",
      data: arrayBuffer(bold),
      weight: 700,
      style: "normal",
    },
    {
      name: "VegaStack Symbols",
      data: arrayBuffer(symbols),
      weight: 400,
      style: "normal",
    },
  ]);
  return fontsPromise;
}

interface OGImageProps {
  title: string;
  description?: string;
  eyebrow?: string;
  wordmarkSrc: string;
}

/** Build-local data URI: ImageResponse never needs to fetch a protected production asset. */
export async function getOGWordmarkDataUri() {
  const bytes = await readFile(
    path.join(process.cwd(), "public", "brand", "vegastack-wordmark-og.png"),
  );
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

/** Branded 1200x630 OG image body, rendered inside `next/og`'s `ImageResponse`. */
export function OGImage({
  title,
  description,
  eyebrow,
  wordmarkSrc,
}: OGImageProps) {
  const denseTitle = title.length > 48;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: OG_BACKGROUND,
        color: OG_FOREGROUND,
        padding: "72px",
        borderTop: `6px solid ${OG_FOREGROUND}`,
        fontFamily: "VegaStack Sans, VegaStack Symbols",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <img
          alt="VegaStack"
          src={wordmarkSrc}
          width={420}
          height={73}
          style={{
            objectFit: "contain",
            objectPosition: "left center",
          }}
        />
        <span
          style={{
            display: "flex",
            alignItems: "center",
            border: `1px solid ${OG_MUTED}`,
            padding: "10px 16px",
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: OG_MUTED,
          }}
        >
          {eyebrow ?? "Design System"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <span
          style={{
            fontSize: denseTitle ? "60px" : "76px",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            maxWidth: "980px",
          }}
        >
          {title}
        </span>
        {description ? (
          <span
            style={{
              fontSize: denseTitle ? "28px" : "34px",
              color: OG_MUTED,
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            {description}
          </span>
        ) : null}
      </div>

      <span style={{ fontSize: "26px", color: OG_MUTED }}>
        design.vegastack.com
      </span>
    </div>
  );
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";
