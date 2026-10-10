// @vegastack picker-search@0.25.9 sha256-Iq/MIFQH/uzgnWNWpDzIpQHZDPItNOhaqRF0g7DghPM=

/** Searchable catalogue content, shared by icon and emoji panels. */
export interface PickerSearchEntry {
  /** Human-readable name. */
  label: string;
  /** Extra names, tags and spelling aliases. */
  keywords?: readonly string[];
}
/** Normalise a search phrase without destructive stemming. */
function normalisePickerQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
/** Stable ranked results: exact labels/aliases, prefixes, then all-token substring matches. */
export function filterPickerEntries<T extends PickerSearchEntry>(
  entries: readonly T[],
  query: string,
): T[] {
  const q = normalisePickerQuery(query);
  if (!q) return [...entries];
  const words = q.split(" ");
  return entries
    .map((entry, index) => {
      const terms = [entry.label, ...(entry.keywords ?? [])].map(
        normalisePickerQuery,
      );
      const matches = words.every((word) =>
        terms.some((term) => term.includes(word)),
      );
      return {
        entry,
        index,
        score: !matches
          ? -1
          : terms.includes(q)
            ? 3
            : terms.some((term) => term.startsWith(q))
              ? 2
              : 1,
      };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.entry);
}
