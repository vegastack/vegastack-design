#!/usr/bin/env node
/**
 * verify-docs-export — the DS-01 regression guard over the agent export.
 *
 * Reads the BUILT markdown (`apps/docs/out/**\/*.md` and `apps/docs/out/llms-full.txt`) and fails
 * when any page still carries what an agent cannot use:
 *
 *   1. a JSX tag (`<Capitalised …>`) outside a code fence or inline code — an MDX component the
 *      compile-time stringifier (`apps/docs/lib/mdx-markdown.ts`) did not render;
 *   1b. a NAMESPACED tag (`<story.WithControl />`) or a custom element (`<api-table />`) — neither
 *      starts with a capital, so the rule above cannot see them;
 *   2. an unresolved `\0…\0` placeholder — a runtime renderer missing in
 *      `apps/docs/lib/markdown-export.ts`;
 *   3. an empty API table — a `| Prop |` header with no rows;
 *   4. a component page whose `## API Reference` section carries NEITHER a prop table NOR the
 *      "adds no props of its own" sentence. Rejecting a malformed table is not enough: the defect
 *      this export shipped with was a section that rendered to nothing at all, which leaves no
 *      malformed artefact behind to find.
 *
 * Code fences are stripped before the scan because example source legitimately contains
 * `<Button>`; the raw `grep -c "<[A-Z]"` from the audit therefore never reaches zero and is not
 * the measure — this scan is.
 *
 * It also enforces two SOURCE-level invariants:
 *
 *   - the Explorer policy (DD-3): a component page never carries BOTH a curated `<…Playground />`
 *     and the Story `<story.WithControl />`, and an Explorer always renders inside `<StoryExplorer>`.
 *     Carrying NEITHER is permitted — the Playground row of the canon applies "where curated"
 *     (DD-2/3 is a permission, not a requirement), and 59 of the 110 pages have neither today.
 *   - manifest coverage: every name in `RENDERED_ELEMENTS` (`apps/docs/lib/mdx-manifest.ts`) has a
 *     matching `case` in `stringifyMdxForAgents`, so the manifest cannot promise a rendering that
 *     the stringifier answers with a thrown error.
 *
 *   node tooling/verify-docs-export.mjs              # verify apps/docs/out
 *   node tooling/verify-docs-export.mjs --self-test  # prove every check fails on a bad fixture
 *
 * Runs in the docs package `build` (after `verify:metadata`) and `lint` (`verify:export`); G1-b
 * wires it into root `pnpm lint`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "apps/docs/out");
const contentDir = join(root, "apps/docs/content/docs/components");

/**
 * Markdown with fenced blocks and inline code removed, line structure preserved.
 *
 * The fence may be indented — a ```tsx block nested in a list item (filter-bar's "compose a
 * button into `trailing`" bullet) is indented two spaces — so neither the opening nor the closing
 * fence can be anchored hard to column 0.
 */
export function stripCode(markdown) {
  const withoutFences = markdown.replace(
    /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[^\n]*$/gm,
    (block) => block.replace(/[^\n]/g, ""),
  );
  return withoutFences.replace(/`[^`\n]*`/g, (span) => " ".repeat(span.length));
}

const JSX_TAG = /<[A-Z][\w.]*(?=[\s/>])/;
/** `<story.WithControl />` — a module-namespaced element; the leading segment is lowercase. */
const JSX_NAMESPACED_TAG = /<[a-z][\w]*(?:\.[A-Za-z][\w]*)+(?=[\s/>])/;
/** `<api-table />` — a hyphenated custom element name, which no standard HTML element has. */
const JSX_CUSTOM_ELEMENT = /<[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?=[\s/>])/;
const TABLE_HEADER = /^\| Prop \|/;
/** `## API Reference [#api-reference]` — fumadocs appends the anchor to the built heading. */
const API_HEADING = /^#{2,3}\s+API Reference\b/;
const ANY_HEADING = /^#{1,6}\s/;
/**
 * The `noOwnPropsSentence` shape, plus the hand-written plural three pages use. Matched against the
 * section's text with newlines collapsed: the sentence is hard-wrapped in the MDX source, so a
 * per-line test misses it on exactly the pages it exists to accept (accordion, collapsible).
 */
const NO_OWN_PROPS = /adds? no props of (?:its|their) own/;

/** Problems in one markdown document; empty when it is agent-clean. */
export function findProblems(markdown) {
  const problems = [];
  const stripped = stripCode(markdown);
  const lines = stripped.split("\n");
  lines.forEach((line, index) => {
    const tag = JSX_TAG.exec(line);
    if (tag)
      problems.push(
        `line ${index + 1}: JSX tag ${tag[0]}> survives outside code`,
      );
    const namespaced = JSX_NAMESPACED_TAG.exec(line);
    if (namespaced)
      problems.push(
        `line ${index + 1}: namespaced JSX tag ${namespaced[0]}> survives outside code`,
      );
    const custom = JSX_CUSTOM_ELEMENT.exec(line);
    if (custom)
      problems.push(
        `line ${index + 1}: custom-element tag ${custom[0]}> survives outside code`,
      );
    if (line.includes("\0"))
      problems.push(`line ${index + 1}: unresolved export placeholder`);
    if (TABLE_HEADER.test(line)) {
      const separator = lines[index + 1] ?? "";
      const firstRow = lines[index + 2] ?? "";
      if (!/^\|\s*-/.test(separator) || !firstRow.startsWith("|")) {
        problems.push(`line ${index + 1}: empty API table`);
      }
    }
  });
  return problems;
}

/**
 * A component page must DOCUMENT its API, not merely avoid a malformed table. Returns the problems
 * with one built component page: no `## API Reference` heading, or a heading whose section (up to
 * the next heading of any level) carries neither a `| Prop |` table nor the "adds no props of its
 * own" sentence.
 *
 * This is the check that would have caught the original DS-01 defect on its own. `<AutoTypeTable/>`
 * surviving verbatim was visible as a JSX tag; a component whose stringifier branch returns nothing
 * leaves an EMPTY section, and an empty section is invisible to every other rule here.
 */
export function apiSectionProblems(markdown) {
  const lines = stripCode(markdown).split("\n");
  const start = lines.findIndex((line) => API_HEADING.test(line));
  if (start === -1) {
    return [
      'no "## API Reference" section — canon row 7 is required on a component page',
    ];
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (ANY_HEADING.test(lines[index])) {
      end = index;
      break;
    }
  }
  const section = lines.slice(start + 1, end);
  const hasTable = section.some((line) => TABLE_HEADER.test(line));
  const hasSentence = NO_OWN_PROPS.test(section.join(" ").replace(/\s+/g, " "));
  // A subsection (`### ButtonProps`) pushes the table past the first heading; scan to the next
  // SAME-OR-HIGHER-level heading in that case rather than declaring the section empty.
  if (hasTable || hasSentence) return [];
  const level = /^(#{2,3})/.exec(lines[start])[1].length;
  let wide = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    const heading = /^(#{1,6})\s/.exec(lines[index]);
    if (heading && heading[1].length <= level) {
      wide = index;
      break;
    }
  }
  const whole = lines.slice(start + 1, wide);
  if (
    whole.some((line) => TABLE_HEADER.test(line)) ||
    NO_OWN_PROPS.test(whole.join(" ").replace(/\s+/g, " "))
  ) {
    return [];
  }
  return [
    `line ${start + 1}: the API Reference section documents no props — it carries neither a "| Prop |" table nor the "adds no props of its own" sentence`,
  ];
}

/**
 * Manifest coverage: every `RENDERED_ELEMENTS` name in `apps/docs/lib/mdx-manifest.ts` must have a
 * `case "<Name>":` in `stringifyMdxForAgents`. Read textually because the manifest is TypeScript
 * and this gate is Node — a second hand-written list would be the drift it is meant to prevent.
 */
export function manifestCoverageProblems(manifestSource, stringifierSource) {
  const block =
    /export const RENDERED_ELEMENTS = new Set\(\[([\s\S]*?)\]\);/.exec(
      manifestSource,
    );
  if (!block) {
    return [
      "lib/mdx-manifest.ts: RENDERED_ELEMENTS is not a `new Set([...])` literal this gate can read",
    ];
  }
  const declared = [...block[1].matchAll(/"([A-Z][\w.]*)"/g)].map((m) => m[1]);
  if (declared.length === 0) {
    return ["lib/mdx-manifest.ts: RENDERED_ELEMENTS is empty"];
  }
  const cases = new Set(
    [...stringifierSource.matchAll(/^\s{4}case "([A-Z][\w.]*)":/gm)].map(
      (m) => m[1],
    ),
  );
  return declared
    .filter((name) => !cases.has(name))
    .map(
      (name) =>
        `lib/mdx-manifest.ts lists ${name} in RENDERED_ELEMENTS, but lib/mdx-markdown.ts has no \`case "${name}":\` — the element would throw at build time instead of rendering`,
    );
}

/**
 * The DD-3 Explorer policy for ONE page source. Neither is allowed; both never is. Since Do1-b
 * this also covers canon row 6's PLACEMENT: whichever of the two a page carries lives under the
 * page's `## Playground` heading, so the section a reader (or an agent reading the markdown
 * export) is told to look in is the one that holds it.
 */
export function explorerProblems(label, source) {
  const problems = [];
  const playground = /<\w+Playground\s*\/>/.test(source);
  const explorer = /<story\.WithControl\s*\/>/.test(source);
  if (playground && explorer) {
    problems.push(
      `${label}: carries both a curated playground and the Story explorer — the explorer is sanctioned only where no playground exists (DD-3)`,
    );
  }
  if (explorer && !/<StoryExplorer>/.test(source)) {
    problems.push(
      `${label}: the Story explorer must render inside <StoryExplorer>`,
    );
  }
  if (playground || explorer) {
    const section = /^## Playground\s*$([\s\S]*?)(?=^## |\s*$(?![\s\S]))/m.exec(
      source,
    );
    const inSection =
      section &&
      (playground
        ? /<\w+Playground\s*\/>/.test(section[1])
        : /<story\.WithControl\s*\/>/.test(section[1]));
    if (!inSection) {
      problems.push(
        `${label}: the ${playground ? "curated playground" : "Story explorer"} must render under the page's "## Playground" heading (canon row 6)`,
      );
    }
  }
  return problems;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (path.endsWith(".md")) out.push(path);
  }
  return out;
}

function explorerPolicyProblems() {
  const problems = [];
  if (!existsSync(contentDir)) return problems;
  for (const file of readdirSync(contentDir).filter((f) =>
    f.endsWith(".mdx"),
  )) {
    problems.push(
      ...explorerProblems(
        `components/${file}`,
        readFileSync(join(contentDir, file), "utf8"),
      ),
    );
  }
  return problems;
}

function sourceCoverageProblems() {
  const manifest = join(root, "apps/docs/lib/mdx-manifest.ts");
  const stringifier = join(root, "apps/docs/lib/mdx-markdown.ts");
  if (!existsSync(manifest) || !existsSync(stringifier)) {
    return [
      "apps/docs/lib/mdx-manifest.ts or lib/mdx-markdown.ts is missing — the agent export has no manifest",
    ];
  }
  return manifestCoverageProblems(
    readFileSync(manifest, "utf8"),
    readFileSync(stringifier, "utf8"),
  );
}

function selfTest() {
  const cases = [
    ["JSX tag", '# Page\n\n<AutoTypeTable path="x" name="Y" />\n'],
    ["placeholder", '# Page\n\n\0{"name":"ComponentPreview"}\0\n'],
    [
      "empty table",
      "# Page\n\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n\nNext.\n",
    ],
    ["inline JSX", "Use <Button> here.\n"],
    // Neither of the next two starts with a capital, so the JSX_TAG rule alone accepted both.
    ["namespaced JSX", "# Page\n\n<story.WithControl />\n"],
    ["custom element", '# Page\n\n<api-table path="x" />\n'],
  ];
  for (const [label, fixture] of cases) {
    if (findProblems(fixture).length === 0) {
      console.error(
        `✗ verify-docs-export self-test: "${label}" fixture was NOT rejected`,
      );
      process.exit(1);
    }
  }

  // The API-section check — a page that renders no API at all leaves nothing else to find.
  const apiCases = [
    ["no API section", "# Button\n\n## Usage [#usage]\n\nText.\n"],
    [
      "empty API section",
      "# Button\n\n## API Reference [#api-reference]\n\n## Accessibility [#a11y]\n\nText.\n",
    ],
    [
      "API section with prose only",
      "# Button\n\n## API Reference [#api-reference]\n\nSee the source for the props.\n\n## Do / Don't\n",
    ],
  ];
  for (const [label, fixture] of apiCases) {
    if (apiSectionProblems(fixture).length === 0) {
      console.error(
        `✗ verify-docs-export self-test: "${label}" fixture was NOT rejected`,
      );
      process.exit(1);
    }
  }
  const apiAccepted = [
    [
      "table",
      "## API Reference [#api-reference]\n\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `a?` | `string` | — | x |\n\n## Accessibility\n",
    ],
    [
      "no-own-props sentence",
      "## API Reference [#api-reference]\n\n`Accordion` and `AccordionItem` add no props of their own — each accepts everything the Base UI part accepts.\n\n## Accessibility\n",
    ],
    [
      // Hard-wrapped exactly as accordion.mdx and collapsible.mdx author it.
      "no-own-props sentence wrapped across lines",
      "## API Reference [#api-reference]\n\n`Accordion`, `AccordionItem` and `AccordionTrigger` add no\nprops of their own — each accepts everything the Base UI part accepts.\n\n## Accessibility\n",
    ],
    [
      "table inside a subsection",
      "## API Reference [#api-reference]\n\nHand-maintained rows.\n\n### ResizablePanelGroup\n\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `a?` | `string` | — | x |\n\n## Accessibility\n",
    ],
  ];
  for (const [label, fixture] of apiAccepted) {
    if (apiSectionProblems(fixture).length > 0) {
      console.error(
        `✗ verify-docs-export self-test: the "${label}" API fixture was rejected`,
      );
      process.exit(1);
    }
  }

  // The DD-3 Explorer policy, both directions plus the permitted "neither".
  const explorerCases = [
    [
      "both a playground and an Explorer",
      "## Playground\n\n<ButtonPlayground />\n\n<StoryExplorer>\n  <story.WithControl />\n</StoryExplorer>\n",
    ],
    ["an unwrapped Explorer", "## Playground\n\n<story.WithControl />\n"],
    [
      "a playground outside the Playground section",
      "## Examples\n\n<ButtonPlayground />\n",
    ],
    [
      "an Explorer outside the Playground section",
      "## Examples\n\n<StoryExplorer>\n  <story.WithControl />\n</StoryExplorer>\n",
    ],
  ];
  for (const [label, fixture] of explorerCases) {
    if (explorerProblems("fixture.mdx", fixture).length === 0) {
      console.error(
        `✗ verify-docs-export self-test: "${label}" was NOT rejected`,
      );
      process.exit(1);
    }
  }
  for (const [label, fixture] of [
    ["a curated playground alone", "## Playground\n\n<ButtonPlayground />\n"],
    [
      "a wrapped Explorer alone",
      "## Playground\n\n<StoryExplorer>\n  <story.WithControl />\n</StoryExplorer>\n",
    ],
    // DD-2/3 is a PERMISSION, not a requirement: 65 pages carry neither today, by canon.
    ["neither (permitted by the canon)", "## Examples\n\nText only.\n"],
  ]) {
    if (explorerProblems("fixture.mdx", fixture).length > 0) {
      console.error(`✗ verify-docs-export self-test: "${label}" was rejected`);
      process.exit(1);
    }
  }

  // Manifest coverage, both directions.
  const manifest =
    'export const RENDERED_ELEMENTS = new Set([\n  "Callout",\n  "DoDont",\n]);\n';
  if (
    manifestCoverageProblems(
      manifest,
      '    case "Callout":\n    case "DoDont":\n',
    ).length > 0
  ) {
    console.error(
      "✗ verify-docs-export self-test: a covered manifest was rejected",
    );
    process.exit(1);
  }
  if (
    manifestCoverageProblems(manifest, '    case "Callout":\n').length === 0
  ) {
    console.error(
      "✗ verify-docs-export self-test: a manifest name with no stringifier case was NOT rejected",
    );
    process.exit(1);
  }
  if (manifestCoverageProblems("const OTHER = 1;", "").length === 0) {
    console.error(
      "✗ verify-docs-export self-test: an unreadable RENDERED_ELEMENTS was NOT rejected",
    );
    process.exit(1);
  }
  const clean =
    "# Page\n\n```tsx\n<Button>Save</Button>\n```\n\nInline `<Kbd>` is code.\n\n" +
    // An indented fence inside a list item is still code (filter-bar.mdx).
    '* **Clear-all** — compose:\n  ```tsx\n  <Button variant="ghost">Clear all</Button>\n  ```\n\n' +
    '| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `variant?` | `"a" \\| "b"` | — | Text |\n';
  if (findProblems(clean).length > 0) {
    console.error("✗ verify-docs-export self-test: clean fixture was rejected");
    process.exit(1);
  }
  console.log(
    "✓ verify-docs-export self-test: JSX (capitalised, namespaced, custom-element), placeholder, empty-table and inline-JSX fixtures rejected; missing/empty/prose-only API sections rejected and table, no-own-props and subsection forms accepted; both-playground-and-Explorer, unwrapped-Explorer and out-of-section playground/Explorer rejected while neither is accepted; an uncovered manifest name rejected; clean fixture (fenced, inline and indented-fence code) accepted",
  );
}

const args = process.argv.slice(2);
if (args.includes("--self-test")) {
  selfTest();
} else {
  if (!existsSync(outDir)) {
    console.error(
      `✗ verify-docs-export: ${relative(root, outDir)} does not exist — build the docs first`,
    );
    process.exit(2);
  }
  const files = [...walk(outDir), join(outDir, "llms-full.txt")].filter(
    existsSync,
  );
  const componentPages = join(outDir, "docs/components");
  let apiPagesChecked = 0;
  const failures = [];
  for (const file of files) {
    const markdown = readFileSync(file, "utf8");
    for (const problem of findProblems(markdown)) {
      failures.push(`${relative(root, file)}: ${problem}`);
    }
    if (file.startsWith(`${componentPages}/`) && file.endsWith(".md")) {
      apiPagesChecked++;
      for (const problem of apiSectionProblems(markdown)) {
        failures.push(`${relative(root, file)}: ${problem}`);
      }
    }
  }
  if (apiPagesChecked === 0) {
    failures.push(
      `no built component pages under ${relative(root, componentPages)} — the API-section check verified nothing`,
    );
  }
  failures.push(...explorerPolicyProblems());
  failures.push(...sourceCoverageProblems());
  if (failures.length > 0) {
    console.error(`✗ verify-docs-export: ${failures.length} problem(s)`);
    for (const failure of failures.slice(0, 60))
      console.error(`  ✗ ${failure}`);
    if (failures.length > 60) console.error(`  … ${failures.length - 60} more`);
    process.exit(1);
  }
  console.log(
    `✓ verify-docs-export: ${files.length} markdown files agent-clean (no JSX — capitalised, namespaced or custom-element — outside code, no placeholders, no empty API tables); ${apiPagesChecked} component pages document their API; Explorer policy holds; the MDX manifest and the stringifier agree`,
  );
}
