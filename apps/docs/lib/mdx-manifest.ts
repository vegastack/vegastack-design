/**
 * The MDX element manifest — ONE exhaustive classification of every element name the docs MDX may
 * contain, shared by the three surfaces that would otherwise each hold their own idea of it:
 *
 *   - `components/mdx.tsx` — the React map. It validates its own repo-owned keys against
 *     `MDX_COMPONENT_NAMES` at module load, so a component added to the map without a manifest
 *     entry (or removed from the map while the manifest still lists it) fails the build.
 *   - `lib/mdx-markdown.ts` — the compile-time stringifier for the agent export. It classifies
 *     through `classifyMdxElement()` and THROWS on anything unclassified.
 *   - `lib/markdown-export.ts` — the runtime placeholder renderer. It validates every placeholder
 *     name against `RUNTIME_PLACEHOLDERS` before handing the text to fumadocs, whose
 *     `renderPlaceholder` silently substitutes `children` for a name it has no renderer for.
 *
 * **Why a manifest rather than a fallback.** Before this file the stringifier ended in
 * `default: return children || " "`. A component the map knows and the stringifier does not —
 * `stringifyMdxForAgents(<BrandNewWidget />)` — produced a single space, and a placeholder whose
 * runtime renderer was missing produced its children with no residue: in both cases the agent
 * export silently lost the section and no gate could see it, because there was nothing left to
 * find. The children-only fallback survives only for the element names explicitly listed as
 * structural wrappers, where children ARE the content.
 */

/** Elements resolved at build time because they read the file system or run the type generator. */
export const RUNTIME_PLACEHOLDERS = new Set([
  "ComponentPreview",
  "ApiTable",
  "AutoTypeTable",
  "InstallSteps",
  "Anatomy",
  "StatesTested",
  "ComponentChangelog",
]);

/** Browser-only surfaces, replaced by an explicit note (never dropped silently). */
export const BROWSER_ONLY_NOTES: Record<string, string> = {
  IconGallery:
    "_Icon gallery — browser only. The icon inventory is listed under Registry items in llms.txt._",
  ColorPalette:
    "_Colour token specimen — browser only; the values are in design.md §Colours._",
  SurfaceLadder:
    "_Surface-ladder specimen — browser only; it renders both themes side by side. The rungs and their alpha twins are in design.md §Colours → Surfaces — the ladder._",
  TypeScale:
    "_Type scale specimen — browser only; the ladder is in design.md §Typography._",
  TypeScaleSizes:
    "_Type size specimen — browser only; the ladder is in design.md §Typography._",
  TypeCoreLadder:
    "_Type ladder specimen — browser only; the ladder is in design.md §Typography._",
  RadiusScale:
    "_Radius specimen — browser only; the scale is in design.md §Shapes._",
  ShadowScale:
    "_Shadow specimen — browser only; the two sanctioned shadows are in design.md §Elevation._",
  SpacingScale:
    "_Spacing specimen — browser only; the 4px ladder is in design.md §Layout._",
  MotionSpecimen:
    "_Motion specimen — browser only; the tokens are in design.md §Motion._",
  FocusRingSpecimen:
    "_Focus-ring specimen — browser only; the contract is in design.md §Accessibility._",
};

/**
 * The curated per-component playgrounds (canon row 6). Listed by name rather than matched on a
 * `*Playground` suffix: a suffix test accepts a component nobody registered, which is the exact
 * silent-acceptance this manifest exists to remove.
 */
export const PLAYGROUND_COMPONENTS = new Set([
  "AlertPlayground",
  "AnimatedNumberPlayground",
  "AttachmentPlayground",
  "AvatarPlayground",
  "BadgePlayground",
  "BubblePlayground",
  "ButtonPlayground",
  "CardPlayground",
  "CheckboxPlayground",
  "ComboboxPlayground",
  "CopyButtonPlayground",
  "DialogPlayground",
  "EmptyPlayground",
  "FieldInlinePlayground",
  "FieldPlayground",
  "IconButtonPlayground",
  "ImagePlayground",
  "InputPlayground",
  "ItemPlayground",
  "KbdPlayground",
  "NotificationBellPlayground",
  "OTPInputPlayground",
  "PaginationPlayground",
  "PopoverPlayground",
  "ProgressIndicatorPlayground",
  "ProgressPlayground",
  "RadioGroupPlayground",
  "RelativeTimePlayground",
  "ResizablePlayground",
  "ScrollAreaPlayground",
  "SelectPlayground",
  "SeparatorPlayground",
  "SheetPlayground",
  "SkeletonPlayground",
  "SpinnerPlayground",
  "SplitButtonPlayground",
  "StatusIconPlayground",
  "SwitchPlayground",
  "TabsPlayground",
  "TextareaPlayground",
  "ToastPlayground",
  "ToggleGroupPlayground",
  "TogglePlayground",
  "TooltipPlayground",
  "TruncatedTextPlayground",
]);

/**
 * The Story explorer (DD-3). `<story.WithControl />` is a NAMESPACED name — `story` is the module
 * namespace the MDX page imports — so it never reaches the React map as a key and only the
 * stringifier and the export gate see it.
 */
export const STORY_EXPLORER_ELEMENT = "story.WithControl";

/**
 * Elements the stringifier renders with a dedicated branch. Each name here MUST have a `case` in
 * `stringifyMdxForAgents`; `verify-docs-export.mjs`'s `manifestCoverageProblems()` proves the two
 * agree, in both directions, from the two files' own source.
 */
export const RENDERED_ELEMENTS = new Set([
  "Callout",
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
      `(with a case in lib/mdx-markdown.ts), or STRUCTURAL_WRAPPERS. A component the agent export ` +
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

/**
 * Every placeholder name in a processed markdown string, in document order, including the nested
 * ones `renderPlaceholder` recurses into: a placeholder's `children` are JSON-encoded, so the outer
 * scan cannot see them and an unrenderable nested name would degrade just as silently.
 */
export function placeholderNames(processed: string): (string | null)[] {
  const names: (string | null)[] = [];
  for (const match of processed.matchAll(/\0(.+?)\0/gs)) {
    let data: { name?: unknown; children?: unknown };
    try {
      data = JSON.parse(match[1]) as { name?: unknown; children?: unknown };
    } catch {
      // `renderPlaceholder` swallows a parse failure and re-emits the raw `\0…\0` match, which
      // would then reach the built `.md` as residue. Surface it as an unnamed placeholder.
      names.push(null);
      continue;
    }
    names.push(typeof data.name === "string" ? data.name : null);
    if (typeof data.children === "string") {
      names.push(...placeholderNames(data.children));
    }
  }
  return names;
}

/**
 * Validate before rendering. `renderPlaceholder` (fumadocs-core 16.11.5) substitutes `data.children`
 * for any name it has no renderer for and re-emits the raw match when the JSON does not parse — in
 * both cases the section vanishes or corrupts with no residue a gate could find. So the names are
 * checked here, against the same manifest the stringifier classifies with.
 */
export function assertKnownPlaceholders(
  processed: string,
  knownNames: ReadonlySet<string>,
) {
  const unknown = placeholderNames(processed).filter(
    (name) => name === null || !knownNames.has(name),
  );
  if (unknown.length === 0) return;
  const labels = [...new Set(unknown.map((name) => name ?? "<unparseable>"))];
  throw new Error(
    `Agent markdown carries ${unknown.length} placeholder(s) no renderer resolves: ${labels.join(", ")}. ` +
      `fumadocs' renderPlaceholder would silently emit their children instead — add the renderer in ` +
      `lib/markdown-export.ts and the name to RUNTIME_PLACEHOLDERS in lib/mdx-manifest.ts.`,
  );
}
