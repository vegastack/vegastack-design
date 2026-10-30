/**
 * The MDX element manifest — ONE exhaustive classification of every element name the docs MDX may
 * contain, shared by the three surfaces that would otherwise each hold their own idea of it:
 *
 *   - `components/mdx.tsx` — the React map. It validates its own repo-owned keys against
 *     `MDX_COMPONENT_NAMES` at module load, so a component added to the map without a manifest
 *     entry (or removed from the map while the manifest still lists it) fails the build.
 *   - `lib/mdx-markdown.ts` — the compile-time filter for the agent export. It classifies every
 *     element through `classifyMdxElement()` and THROWS on anything unclassified.
 *   - `lib/markdown-export.ts` — the markdown form of every classified element, checked against
 *     this manifest at module load; any other name throws when rendered.
 *
 * **Why a manifest rather than a fallback.** Before this file the stringifier ended in
 * `default: return children || " "`. A component the map knows and the stringifier does not —
 * `stringifyMdxForAgents(<BrandNewWidget />)` — produced a single space, and a placeholder whose
 * runtime renderer was missing produced its children with no residue: in both cases the agent
 * export silently lost the section and no gate could see it, because there was nothing left to
 * find. The children-only fallback survives only for the element names explicitly listed as
 * structural wrappers, where children ARE the content.
 */

/** Elements whose markdown reads the file system or runs the type generator. */
export const RUNTIME_PLACEHOLDERS = new Set([
  "ComponentPreview",
  "ApiTable",
  "InstallSteps",
  "Anatomy",
  "StatesTested",
]);

/** Browser-only surfaces, replaced by an explicit note (never dropped silently). */
export const BROWSER_ONLY_NOTES: Record<string, string> = {
  ColorPalette:
    "_Colour token specimen — browser only; the token set is in design.md §Tokens we add._",
  TypeScale:
    "_Type scale specimen — browser only; the scale is Tailwind's own, unmodified._",
  TypeScaleSizes:
    "_Type size specimen — browser only; the scale is Tailwind's own, unmodified._",
  RadiusScale:
    "_Radius specimen — browser only; every step derives from one `--radius`._",
  ShadowScale:
    "_Shadow specimen — browser only; the steps are Tailwind's `shadow-sm`/`-md`/`-lg`._",
  SpacingScale:
    "_Spacing specimen — browser only; the 4px ladder is Tailwind's own._",
  PageLayoutSpecimen:
    "_Page layout specimen — browser only; the widths and the gutter scale are in the tables on this page._",
  MotionSpecimen:
    "_Motion specimen — browser only; the duration and easing tokens are in design.md §Tokens we add._",
  FocusRingSpecimen:
    "_Focus-ring specimen — browser only; the contract is in design.md §Accessibility._",
};

/**
 * The curated per-component playgrounds (canon row 6). Listed by name rather than matched on a
 * `*Playground` suffix: a suffix test accepts a component nobody registered, which is the exact
 * silent-acceptance this manifest exists to remove.
 */
export const PLAYGROUND_COMPONENTS = new Set([
  "AnimatedNumberPlayground",
  "AttachmentPlayground",
  "CheckboxPlayground",
  "ComboboxPlayground",
  "CopyButtonPlayground",
  "DialogPlayground",
  "FieldPlayground",
  "ImagePlayground",
  "InputPlayground",
  "NotificationBellPlayground",
  "PaginationPlayground",
  "PopoverPlayground",
  "ProgressPlayground",
  "RadioGroupPlayground",
  "RelativeTimePlayground",
  "ResizablePlayground",
  "ScrollAreaPlayground",
  "SelectPlayground",
  "SheetPlayground",
  "StatusIconPlayground",
  "SwitchPlayground",
  "TabsPlayground",
  "TextareaPlayground",
  "TruncatedTextPlayground",
]);

/**
 * The Story explorer (DD-3). `<story.WithControl />` is a NAMESPACED name — `story` is the module
 * namespace the MDX page imports — so it never reaches the React map as a key and only the
 * stringifier and the export gate see it.
 */
export const STORY_EXPLORER_ELEMENT = "story.WithControl";

/**
 * Elements rendered from their attributes and children. Each name here has its markdown form in
 * `lib/markdown-export.ts`, checked at module load.
 */
export const RENDERED_ELEMENTS = new Set([
  "Callout",
  "Mermaid",
  "Steps",
  "Tabs",
  "Files",
  "Folder",
  "File",
  "TypeTable",
  "DoDont",
  "RegistryInstallCallout",
  "CodeBlockTabs",
  "CodeBlockTabsList",
  "CodeBlockTabsTrigger",
]);

/**
 * The ONLY names that keep the children-only fallback: wrappers whose own markup carries no
 * content an agent needs, and whose children are the content.
 *
 * `Step`, `Tab` and `CodeBlockTab` are consumed by their parent's branch (`Steps`, `Tabs`,
 * `CodeBlockTabs`) and reach the stringifier on their own only if a page nests one outside its
 * parent; `TabsContent`/`TabsList`/`TabsTrigger` are the fumadocs-ui primitives behind `Tabs`;
 * `StoryExplorer` is the frame around `<story.WithControl />`; `CalloutTitle` is the title slot.
 */
export const STRUCTURAL_WRAPPERS = new Set([
  "CalloutTitle",
  "CodeBlockTab",
  "Step",
  "StoryExplorer",
  "Tab",
  "TabsContent",
  "TabsList",
  "TabsTrigger",
]);

/**
 * Standard HTML element names. MDX parses `<kbd>Tab</kbd>` as a JSX element too, so the
 * stringifier sees them; they render as their children (the surrounding markdown already carries
 * the emphasis an agent needs). A lowercase name that is NOT a standard element — `<api-table />`,
 * `<my-widget />` — is a custom element nobody registered, and throws.
 */
export const HTML_ELEMENTS = new Set([
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "search",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  // SVG, for the rare inline illustration in a docs page (never as an icon — AGENTS.md §Icons).
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "g",
  "defs",
  "clipPath",
  "mask",
  "text",
  "tspan",
  "use",
  "ellipse",
]);

/**
 * Every repo-owned name the React map in `components/mdx.tsx` must register. Names fumadocs
 * supplies through its own spreads (`defaultMdxComponents`, the Tabs module, Twoslash) are NOT
 * here — the map validates only the keys it adds itself.
 */
export const MDX_COMPONENT_NAMES: ReadonlySet<string> = new Set([
  ...RUNTIME_PLACEHOLDERS,
  ...Object.keys(BROWSER_ONLY_NOTES),
  ...PLAYGROUND_COMPONENTS,
  "DoDont",
  "Mermaid",
  "RegistryInstallCallout",
  "StoryExplorer",
  // Re-registered from fumadocs' own modules so a page can use them without importing.
  "Steps",
  "Step",
  "Files",
  "File",
  "Folder",
  "TypeTable",
]);

export type MdxElementKind =
  | "fragment"
  | "runtime-placeholder"
  | "browser-only"
  | "playground"
  | "story-explorer"
  | "rendered"
  | "structural-wrapper"
  | "html";

/**
 * Classify one MDX element name, or `undefined` when the manifest does not know it. Callers turn
 * `undefined` into a thrown build error — never into a silent fallback.
 */
export function classifyMdxElement(
  name: string | null,
): MdxElementKind | undefined {
  if (!name) return "fragment";
  if (RUNTIME_PLACEHOLDERS.has(name)) return "runtime-placeholder";
  if (name in BROWSER_ONLY_NOTES) return "browser-only";
  if (PLAYGROUND_COMPONENTS.has(name)) return "playground";
  if (name === STORY_EXPLORER_ELEMENT) return "story-explorer";
  if (RENDERED_ELEMENTS.has(name)) return "rendered";
  if (STRUCTURAL_WRAPPERS.has(name)) return "structural-wrapper";
  if (HTML_ELEMENTS.has(name)) return "html";
  return undefined;
}

export function unknownElementError(name: string, where: string) {
  return new Error(
    `Unknown MDX element <${name}> reached ${where}. Every element name must be classified in ` +
      `apps/docs/lib/mdx-manifest.ts — add it to RUNTIME_PLACEHOLDERS (with a renderer in ` +
      `lib/markdown-export.ts), BROWSER_ONLY_NOTES, PLAYGROUND_COMPONENTS, RENDERED_ELEMENTS ` +
      `(with its markdown form in lib/markdown-export.ts), or STRUCTURAL_WRAPPERS. A component the agent export ` +
      `does not know is a section agents silently never see.`,
  );
}

/**
 * Fails when the React map and the manifest disagree in either direction. Called at module load
 * from `components/mdx.tsx`, so the mismatch surfaces during `next build`, not in a review.
 */
export function assertMdxMapMatchesManifest(ownKeys: readonly string[]) {
  const registered = new Set(ownKeys);
  const missing = [...MDX_COMPONENT_NAMES].filter(
    (name) => !registered.has(name),
  );
  const unlisted = ownKeys.filter((name) => !MDX_COMPONENT_NAMES.has(name));
  if (missing.length === 0 && unlisted.length === 0) return;
  const parts = [];
  if (missing.length > 0) {
    parts.push(
      `listed in the manifest but absent from the MDX map: ${missing.join(", ")}`,
    );
  }
  if (unlisted.length > 0) {
    parts.push(
      `registered in the MDX map but absent from the manifest: ${unlisted.join(", ")}`,
    );
  }
  throw new Error(
    `apps/docs/lib/mdx-manifest.ts and apps/docs/components/mdx.tsx disagree — ${parts.join("; ")}. ` +
      `An unlisted component renders for humans and vanishes from the agent export.`,
  );
}
