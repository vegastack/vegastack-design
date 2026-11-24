// AUTO-GENERATED — do not edit.
/** The accent themes in picker order. */
export const ACCENTS = [
  {
    "id": "black",
    "label": "Black"
  },
  {
    "id": "blue",
    "label": "Blue"
  },
  {
    "id": "violet",
    "label": "Violet"
  },
  {
    "id": "pink",
    "label": "Pink"
  },
  {
    "id": "orange",
    "label": "Orange"
  },
  {
    "id": "green",
    "label": "Green"
  },
  {
    "id": "teal",
    "label": "Teal"
  }
] as const;
export type AccentId = (typeof ACCENTS)[number]["id"];
/** The accent of anyone who has not chosen one. */
export const DEFAULT_ACCENT: AccentId = "black";
/** The cookie `AccentScript` reads before the first paint. */
export const ACCENT_COOKIE = "vs_accent";
export function isAccentId(value: unknown): value is AccentId {
  return ACCENTS.some((accent) => accent.id === value);
}
/** The first value that is a known accent, else Black: `resolveAccent(own, workspace)`. */
export function resolveAccent(...values: unknown[]): AccentId {
  return values.find(isAccentId) ?? DEFAULT_ACCENT;
}
