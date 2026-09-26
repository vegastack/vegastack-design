// @vegastack person@0.23.43 sha256-0XiXUntsDA9HFLCx/GF5UgdVGd8z1k2naP4r1lBUyE8=

/**
 * person — the ONE initials rule for a person's avatar, shared by `PersonAvatar` and every
 * surface that draws a person, so a name reads the same initials everywhere (and in the apps that
 * mirror the rule).
 *
 * The rule, on the trimmed name:
 * - two or more words → the first letter of the first word and of the last word ("Asha K Rao" → "AR");
 * - one word → its first two letters ("Asha" → "AS");
 * - no name → the email's first two characters ("ar@acme.com" → "AR");
 * - always uppercase.
 */

/** The first `n` characters of a string, by code point, so an emoji or accent is never split. */
function head(value: string, n: number): string {
  return Array.from(value).slice(0, n).join("");
}

/**
 * The two initials of a person.
 *
 * @example
 * personInitials("Asha Rao"); // "AR"
 * personInitials("", "ops@acme.com"); // "OP"
 */
export function personInitials(name: string, email?: string | null): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return head((email ?? "").trim(), 2).toUpperCase();
  if (words.length === 1) return head(words[0]!, 2).toUpperCase();
  return (head(words[0]!, 1) + head(words.at(-1)!, 1)).toUpperCase();
}
