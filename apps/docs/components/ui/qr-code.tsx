// @vegastack qr-code@0.26.3 sha256-TAKyTn5twc6I4sDkamdt6FlB1o2qUaiSmBjuLb/JeCo=

import * as React from "react";
import { encode } from "uqr";
import { cn } from "@vegastack/design";

/** The four QR error-correction levels: how much of the code can be damaged and still scan. */
export type QrCodeErrorCorrection = "L" | "M" | "Q" | "H";

/** Props accepted by `QrCode`. */
export interface QrCodeProps extends Omit<
  React.ComponentProps<"svg">,
  "children" | "viewBox" | "role"
> {
  /**
   * The text the code carries — usually a URL. An empty value, or one too long for any QR
   * version at the chosen `errorCorrection`, draws the empty tile instead of throwing.
   */
  value: string;
  /**
   * The accessible name: what scanning the code does ("Open this meeting on your phone"). The
   * encoded value is not read out, so say where it leads.
   */
  label: string;
  /**
   * How much of the code can be lost and still scan: `L` 7%, `M` 15%, `Q` 25%, `H` 30%. A higher
   * level draws more, smaller modules for the same value.
   * @default "M"
   */
  errorCorrection?: QrCodeErrorCorrection;
  /**
   * The light margin around the code, in modules. The QR standard asks for 4; scanners struggle
   * below 2.
   * @default 4
   */
  quietZone?: number;
}

/**
 * The QR matrix as one SVG path: each run of dark modules in a row is one rectangle, offset by the
 * quiet zone. Returns `null` when the value cannot be encoded (empty, or too long).
 */
function qrPath(
  value: string,
  errorCorrection: QrCodeErrorCorrection,
  quietZone: number,
): { d: string; extent: number } | null {
  if (!value) return null;
  let matrix: boolean[][];
  try {
    matrix = encode(value, { ecc: errorCorrection, border: 0 }).data;
  } catch {
    return null;
  }
  let d = "";
  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y]!;
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run]) run++;
      d += `M${x + quietZone} ${y + quietZone}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return { d, extent: matrix.length + quietZone * 2 };
}

/**
 * `QrCode` — a QR code drawn as one SVG: dark modules on a light, rounded tile in both themes (a
 * code drawn light-on-dark does not scan everywhere), with the standard 4-module quiet zone inside
 * the tile. Server-safe: the matrix is computed during render by `uqr`, a pure encoder. Size it
 * with a `size-*` class; the default is `size-40` (160px).
 *
 * @example
 * <QrCode value="https://app.example.com/m/42/record" label="Open this meeting on your phone" />
 *
 * @example
 * <QrCode value={url} label="Scan to join" errorCorrection="Q" className="size-56" />
 */
export function QrCode({
  value,
  label,
  errorCorrection = "M",
  quietZone = 4,
  className,
  ...props
}: QrCodeProps) {
  const zone = Math.max(
    0,
    Math.floor(Number.isFinite(quietZone) ? quietZone : 4),
  );
  const drawing = React.useMemo(
    () => qrPath(value, errorCorrection, zone),
    [value, errorCorrection, zone],
  );
  // The empty tile keeps a version-1 footprint (21 modules plus the zone), so a value that
  // fails does not collapse the layout around it.
  const extent = drawing?.extent ?? 21 + zone * 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-slot="qr-code"
      data-state={drawing ? "ready" : "invalid"}
      data-error-correction={errorCorrection}
      role="img"
      aria-label={label}
      viewBox={`0 0 ${extent} ${extent}`}
      shapeRendering="crispEdges"
      className={cn(
        "size-40 shrink-0 rounded-md bg-scrim-foreground fill-scrim",
        className,
      )}
      {...props}
    >
      {drawing ? <path data-slot="qr-code-modules" d={drawing.d} /> : null}
    </svg>
  );
}
