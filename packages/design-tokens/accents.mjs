// The accent themes (COL-27), resolved. One authority, `tokens/accents.tokens.json`, read here by
// the token build (theme.css, accents.json, accents.dart, src/accents.ts), the email generator and
// the gates, so no surface can disagree about a colour.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The accent everything starts from; it carries no values of its own. */
export const DEFAULT_ACCENT = "black";

/** Every custom property an accent block sets, in output order. `check`, `mark` and `ink` are never here. */
export const ACCENT_KEYS = [
  "primary",
  "primary-foreground",
  "primary-hover",
  "primary-pressed",
  "primary-text",
  "link",
  "link-hover",
  "unread",
  "nav-selected",
  "nav-selected-foreground",
  "nav-selected-icon",
];
/** What an accent authors per mode; the rest is derived below. */
export const AUTHORED_KEYS = ACCENT_KEYS.slice(0, 5);
/** The nav tint: the fill at this alpha. */
const NAV_ALPHA = { light: 0.1, dark: 0.2 };

export const formatOklch = ([l, c, h], alpha = 1) =>
  alpha === 1 ? `oklch(${l} ${c} ${h})` : `oklch(${l} ${c} ${h} / ${alpha})`;

export function parseOklch(text) {
  const match = /^oklch\(([^/)]+)(?:\/([^)]+))?\)$/.exec(text.trim());
  if (!match) throw new Error(`not an oklch() colour: ${text}`);
  return {
    components: match[1].trim().split(/\s+/).map(Number),
    alpha: match[2] === undefined ? 1 : Number(match[2]),
  };
}

/** OKLCH → 8-bit sRGB channels (clipped). */
export function toRgb8([L, C, H]) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const gamma = (x) => {
    const c = Math.max(0, Math.min(1, x));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.round(gamma(c) * 255));
}
const hexByte = (n) => n.toString(16).padStart(2, "0");
/** `#rrggbb`, or `#rrggbbaa` for a translucent colour. */
export function toHex(text) {
  const { components, alpha } = parseOklch(text);
  const rgb = toRgb8(components).map(hexByte).join("");
  return `#${rgb}${alpha === 1 ? "" : hexByte(Math.round(alpha * 255))}`;
}

const readSource = () =>
  JSON.parse(readFileSync(join(HERE, "tokens/accents.tokens.json"), "utf8"));

/** The accent ids in authored order. */
export const accentIds = () =>
  Object.keys(readSource()).filter((id) => !id.startsWith("$"));

/**
 * Every accent, in authored order: `{ id, label, light, dark }`, each mode a map from `ACCENT_KEYS`
 * to an `oklch()` string. `semantic` is the resolved light/dark contract; Black is read from it.
 */
export function buildAccents(semantic) {
  return Object.entries(readSource())
    .filter(([id]) => !id.startsWith("$"))
    .map(([id, entry]) => {
      const label = entry.$extensions?.["com.vegastack.accent"]?.label;
      if (!label) throw new Error(`accent ${id}: no label`);
      const modes = {};
      for (const mode of ["light", "dark"]) {
        if (id === DEFAULT_ACCENT) {
          modes[mode] = Object.fromEntries(
            ACCENT_KEYS.map((key) => [key, semantic[mode][key]]),
          );
          continue;
        }
        const authored = entry[mode] ?? {};
        const keys = Object.keys(authored);
        if (keys.join() !== AUTHORED_KEYS.join())
          throw new Error(
            `accent ${id}.${mode}: expected ${AUTHORED_KEYS.join(", ")}; found ${keys.join(", ")}`,
          );
        const out = {};
        for (const key of AUTHORED_KEYS) {
          const { components, alpha, hex } = authored[key].$value;
          if (alpha !== 1)
            throw new Error(`accent ${id}.${mode}.${key} must be opaque`);
          out[key] = formatOklch(components);
          if (toHex(out[key]) !== hex)
            throw new Error(
              `accent ${id}.${mode}.${key}: ${out[key]} is ${toHex(out[key])}, authored hex ${hex}`,
            );
        }
        out.link = out["primary-text"];
        out["link-hover"] =
          out[mode === "light" ? "primary-hover" : "primary-text"];
        // A 7px dot needs the brighter of the two in dark.
        out.unread = mode === "light" ? out.primary : out["primary-text"];
        out["nav-selected"] = formatOklch(
          authored.primary.$value.components,
          NAV_ALPHA[mode],
        );
        out["nav-selected-foreground"] = out["primary-text"];
        out["nav-selected-icon"] = out["primary-text"];
        modes[mode] = out;
      }
      return { id, label, ...modes };
    });
}

/** The selectors one accent's blocks are written under. */
export const accentSelectors = (id) => ({
  light: `[data-accent="${id}"]`,
  // On `<html class="dark">`, on a scope inside dark, and on a dark scope (the file viewer) inside
  // an accented page, unless that scope or one between carries an accent of its own. `:is()` keeps
  // it one step over the light block wherever both match; `:where()` adds no weight of its own.
  dark: `:is(.dark[data-accent="${id}"], .dark [data-accent="${id}"], [data-accent="${id}"] .dark:where(:not([data-accent], [data-accent="${id}"] [data-accent]:not([data-accent="${id}"]) *)))`,
});

const declarations = (values, indent) =>
  ACCENT_KEYS.map((key) => `${indent}--${key}: ${values[key]};`).join("\n");

/**
 * The accent blocks. Every value is concrete: a `var()` alias declared on `:root` would not
 * re-resolve inside a preview card. Black is written too, so a Black card inside a violet page is
 * black; on `<html>` Black is simply no attribute.
 */
export function accentCss(accents) {
  return accents
    .flatMap(({ id, light, dark }) => {
      const selectors = accentSelectors(id);
      return [
        `${selectors.light} {\n${declarations(light, "  ")}\n}`,
        `${selectors.dark} {\n${declarations(dark, "  ")}\n}`,
      ];
    })
    .join("\n\n")
    .concat("\n");
}

/** Inside `@media print`: paper is neutral whatever the accent, at either block's specificity. */
export function accentPrintCss(accents) {
  const black = accents.find(({ id }) => id === DEFAULT_ACCENT);
  return `  [data-accent],\n  .dark[data-accent],\n  .dark [data-accent],\n  [data-accent] .dark {\n${declarations(black.light, "    ")}\n  }\n`;
}

const camel = (key) => key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** `dist/accents.json`: the ids in order, labels, and each colour as sRGB hex. */
export function accentsJson(accents, version) {
  const mode = (values) =>
    Object.fromEntries(
      ACCENT_KEYS.map((key) => [camel(key), toHex(values[key])]),
    );
  return (
    JSON.stringify(
      {
        version,
        default: DEFAULT_ACCENT,
        order: accents.map(({ id }) => id),
        accents: Object.fromEntries(
          accents.map(({ id, label, light, dark }) => [
            id,
            { label, light: mode(light), dark: mode(dark) },
          ]),
        ),
      },
      null,
      2,
    ) + "\n"
  );
}

/** `dist/accents.dart`: the Flutter app's copy, pulled like `corners.dart`. */
export function accentsDart(accents, version) {
  const argb = (text) => {
    const hex = toHex(text).slice(1);
    const alpha = hex.length === 8 ? hex.slice(6) : "ff";
    return `Color(0x${(alpha + hex.slice(0, 6)).toUpperCase()})`;
  };
  const palette = (values, pad) =>
    `DesignAccentColors(\n${ACCENT_KEYS.map((key) => `${pad}  ${camel(key)}: ${argb(values[key])},`).join("\n")}\n${pad})`;
  const fields = ACCENT_KEYS.map(camel);
  return (
    `// GENERATED from @vegastack/design-tokens ${version} (COL-27) — do not edit.\n` +
    `// Pull a release with scripts/pull-design-corners.sh; change a value in the design system.\n\n` +
    `import 'dart:ui' show Color;\n\n` +
    `/// What an accent colours, in one brightness. Done checks and highlights are never here.\n` +
    `final class DesignAccentColors {\n` +
    `  const DesignAccentColors({\n${fields.map((f) => `    required this.${f},`).join("\n")}\n  });\n\n` +
    `${fields.map((f) => `  final Color ${f};`).join("\n")}\n}\n\n` +
    `/// The accent themes, in the order a picker shows them. [black] is the default.\n` +
    `enum DesignAccent {\n` +
    accents
      .map(
        ({ id, label, light, dark }) =>
          `  ${id}(\n    '${label}',\n    light: ${palette(light, "    ")},\n    dark: ${palette(dark, "    ")},\n  )`,
      )
      .join(",\n") +
    `;\n\n` +
    `  const DesignAccent(this.label, {required this.light, required this.dark});\n\n` +
    `  final String label;\n  final DesignAccentColors light;\n  final DesignAccentColors dark;\n\n` +
    `  /// The accent with this id, or [black] for null or an id this build does not know.\n` +
    `  static DesignAccent fromId(String? id) =>\n` +
    `      values.asNameMap()[id] ?? DesignAccent.${DEFAULT_ACCENT};\n}\n`
  );
}

/** `src/accents.ts` (published as `@vegastack/design-tokens/accents`). */
export function accentsTs(accents) {
  const list = accents.map(({ id, label }) => ({ id, label }));
  return `// AUTO-GENERATED — do not edit.
/** The accent themes in picker order. */
export const ACCENTS = ${JSON.stringify(list, null, 2)} as const;
export type AccentId = (typeof ACCENTS)[number]["id"];
/** The accent of anyone who has not chosen one. */
export const DEFAULT_ACCENT: AccentId = "${DEFAULT_ACCENT}";
/** The cookie \`AccentScript\` reads before the first paint. */
export const ACCENT_COOKIE = "vs_accent";
export function isAccentId(value: unknown): value is AccentId {
  return ACCENTS.some((accent) => accent.id === value);
}
/** The first value that is a known accent, else Black: \`resolveAccent(own, workspace)\`. */
export function resolveAccent(...values: unknown[]): AccentId {
  return values.find(isAccentId) ?? DEFAULT_ACCENT;
}
`;
}
