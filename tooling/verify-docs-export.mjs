#!/usr/bin/env node
/**
 * verify-docs-export — the DS-01 regression guard over the agent export.
 *
 * Reads the BUILT markdown (`apps/docs/out/**\/*.md` and `apps/docs/out/llms-full.txt`) and fails
 * when any page still carries what an agent cannot use:
 *
 *   1. a JSX tag (`<Capitalised …>`) outside a code fence or inline code — an MDX component the
 *      compile-time stringifier (`apps/docs/lib/mdx-markdown.ts`) did not render;
 *   2. an unresolved `\0…\0` placeholder — a runtime renderer missing in
 *      `apps/docs/lib/markdown-export.ts`;
 *   3. an empty API table — a `| Prop |` header with no rows.
 *
 * Code fences are stripped before the scan because example source legitimately contains
 * `<Button>`; the raw `grep -c "<[A-Z]"` from the audit therefore never reaches zero and is not
 * the measure — this scan is.
 *
 * It also enforces the Explorer policy on the SOURCE pages (DD-3): a component page carries either
 * a curated `<…Playground />` or the Story `<story.WithControl />`, never both.
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
const TABLE_HEADER = /^\| Prop \|/;

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
    const source = readFileSync(join(contentDir, file), "utf8");
    const playground = /<\w+Playground\s*\/>/.test(source);
    const explorer = /<story\.WithControl\s*\/>/.test(source);
    if (playground && explorer) {
      problems.push(
        `components/${file}: carries both a curated playground and the Story explorer — the explorer is sanctioned only where no playground exists (DD-3)`,
      );
    }
    if (explorer && !/<StoryExplorer>/.test(source)) {
      problems.push(
        `components/${file}: the Story explorer must render inside <StoryExplorer>`,
      );
    }
  }
  return problems;
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
  ];
  for (const [label, fixture] of cases) {
    if (findProblems(fixture).length === 0) {
      console.error(
        `✗ verify-docs-export self-test: "${label}" fixture was NOT rejected`,
      );
      process.exit(1);
    }
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
    "✓ verify-docs-export self-test: JSX, placeholder, empty table and inline JSX fixtures rejected; clean fixture (fenced, inline and indented-fence code) accepted",
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
  const failures = [];
  for (const file of files) {
    for (const problem of findProblems(readFileSync(file, "utf8"))) {
      failures.push(`${relative(root, file)}: ${problem}`);
    }
  }
  failures.push(...explorerPolicyProblems());
  if (failures.length > 0) {
    console.error(`✗ verify-docs-export: ${failures.length} problem(s)`);
    for (const failure of failures.slice(0, 60))
      console.error(`  ✗ ${failure}`);
    if (failures.length > 60) console.error(`  … ${failures.length - 60} more`);
    process.exit(1);
  }
  console.log(
    `✓ verify-docs-export: ${files.length} markdown files agent-clean (no JSX outside code, no placeholders, no empty API tables); Explorer policy holds`,
  );
}
