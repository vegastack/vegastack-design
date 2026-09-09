import {
  createGenerator,
  createFileSystemGeneratorCache,
} from "fumadocs-typescript";

/**
 * ONE data path for every API table (DS-02/DS-03): the human `<ApiTable>` and the markdown
 * renderer in `lib/markdown-export.ts` both call `getApiDocs()` and render the same rows, so an
 * agent reading `button.md` sees exactly what a reader sees on `/docs/components/button`.
 *
 * Own props only. ts-morph's property-symbol enumeration order is NOT stable across program
 * instances and the generator cache lives in `.next` (cleared between builds), so rows are
 * sorted deterministically: required first, then alphabetical. Own-ness is stamped as a marker
 * tag inside the generator's `transform` hook — that runs before the cache write, so cached
 * entries keep it. Expanding inherited DOM/aria/Base UI props made the top pages 9–16 MB of HTML
 * each; inherited surface is what TypeScript is for, and the shadcn/Radix convention is to document
 * the component's own API.
 */
const OWN_PROP_TAG = "vs-own-prop";

const generator = createGenerator({
  cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

export interface ApiEntry {
  name: string;
  /** The literal type, unions expanded — `"default" | "sm" | "lg"`, never `union`. */
  type: string;
  /** The `@default` JSDoc value, or `undefined` when the source declares none. */
  defaultValue?: string;
  description: string;
  required: boolean;
  deprecated: boolean;
}

export interface ApiDoc {
  /** The exported type name the table was generated from (`ButtonProps`). */
  name: string;
  /** The part the props belong to — `ButtonProps` → `Button`. */
  part: string;
  description?: string;
  entries: ApiEntry[];
}

export interface ApiTableSource {
  /** Source file, relative to `apps/docs` (the same value the MDX pages pass today). */
  path: string;
  /** Exported type name. */
  name: string;
}

/** Strip the optional-only members TypeScript appends so an optional prop's type reads as authored. */
function presentType(type: string, required: boolean) {
  if (required) return type;
  return type
    .split(" | ")
    .filter((member) => member !== "undefined" && member !== "null")
    .join(" | ");
}

function defaultFrom(tags: { name: string; text: string }[]) {
  const tag = tags.find(
    (candidate) =>
      candidate.name === "default" || candidate.name === "defaultValue",
  );
  const text = tag?.text.trim();
  return text && text !== "undefined" ? text : undefined;
}

export async function getApiDocs(source: ApiTableSource): Promise<ApiDoc[]> {
  const docs = await generator.generateTypeTable(source, {
    transform(entry, _propertyType, propertySymbol) {
      // fumadocs-typescript 5.4 swapped ts-morph for the native TypeScript 7 API
      // (`typescript/unstable/sync`): `propertySymbol` is now a `Symbol` whose `declarations`
      // are `NodeHandle`s — lazy references carrying the declaring file as `.path` — instead of
      // ts-morph declaration objects with `getSourceFile().getFilePath()`. Reading `.path`
      // keeps the own-prop test free of a `resolve()` round-trip per property.
      const own = propertySymbol.declarations.some(
        (declaration) => !String(declaration.path).includes("node_modules"),
      );
      if (own) entry.tags.push({ name: OWN_PROP_TAG, text: "" });
    },
  });
  if (docs.length === 0) {
    throw new Error(
      `API table: "${source.name}" is not exported from ${source.path}. Fix the MDX \`name\`/\`path\` — an empty table is never rendered.`,
    );
  }
  return docs.map((doc) => ({
    name: doc.name,
    part: doc.name.replace(/Props$/, ""),
    description: doc.description?.trim() || undefined,
    entries: doc.entries
      .filter((entry) => entry.tags.some((tag) => tag.name === OWN_PROP_TAG))
      .sort((a, b) => {
        if (a.required !== b.required) return a.required ? -1 : 1;
        return a.name.localeCompare(b.name, "en");
      })
      .map((entry) => ({
        name: entry.name,
        type: presentType(entry.type, entry.required),
        defaultValue: defaultFrom(entry.tags),
        description: entry.description.trim(),
        required: entry.required,
        deprecated: entry.deprecated,
      })),
  }));
}

/**
 * The one sentence a part without own props gets instead of placeholder rows (DS-03). Shared by
 * both renderers so the human page and the markdown export say the same thing.
 */
export function noOwnPropsSentence(part: string) {
  return `\`${part}\` adds no props of its own — it accepts everything the underlying element or Base UI primitive accepts (\`className\`, \`ref\`, ARIA attributes, event handlers).`;
}
