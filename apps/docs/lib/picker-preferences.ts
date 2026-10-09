// @vegastack picker-preferences@0.25.1 sha256-0a81/pt9y8wLWNi/VCuPX6eW2EA1OlhosuFZkcoC6Mk=

/** Best-effort storage for picker conveniences; never a record's source of truth. */
const memory = new Map<string, unknown>();
const unsaved = new Set<string>();
/** Read JSON safely, retaining an in-memory fallback when browser storage is unavailable. */
export function readPickerPreference(key: string): unknown {
  if (unsaved.has(key)) return memory.get(key);
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const value: unknown = JSON.parse(raw);
        memory.set(key, value);
        return value;
      }
      memory.delete(key);
      return undefined;
    } catch {
      /* Storage is optional. */
    }
  }
  return memory.get(key);
}
/** Save a preference locally, falling back to the page's memory. */
export function writePickerPreference(key: string, value: unknown): void {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    unsaved.delete(key);
  } catch {
    unsaved.add(key);
  }
}
/** Read a bounded, deduplicated recent-item list. */
export function readPickerRecents(key: string, limit = 16): string[] {
  const value = readPickerPreference(key);
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item): item is string => typeof item === "string"),
        ),
      ].slice(0, limit)
    : [];
}
/** Remember a selected item and return the updated list. */
export function rememberPickerRecent(
  key: string,
  value: string,
  limit = 16,
): string[] {
  const next = [
    value,
    ...readPickerRecents(key, limit).filter((item) => item !== value),
  ].slice(0, limit);
  writePickerPreference(key, next);
  return next;
}
