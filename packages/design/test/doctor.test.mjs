// doctor — the retired-vocabulary scan must fail on what the shadcn reset deleted, and only on that.
//
// A retired utility compiles to nothing, so this scan is the only thing between a consumer and a
// page of headings silently rendered as body text (the Regent app carried 338 of them past every
// other check). The tests that matter are both halves: each retired spelling is reported with its
// file:line, and the look-alikes that are still legal — `--tag-*-subtle`, a project's OWN custom
// property, the ui alias directory `check-updates` owns, build output — are not.
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");
const {
  main,
  scanComposition,
  scanPageLayout,
  scanRetiredVocabulary,
  uiAliasDirs,
} = await import(join(PKG, "bin/doctor.mjs"));
const { ownedFiles, main: ownedFilesMain } = await import(
  join(PKG, "bin/owned-files.mjs")
);

let failures = 0;
const tmpRoots = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`  ✗ ${name}\n    ${error.message}`);
  }
}

function project(files) {
  const root = mkdtempSync(join(tmpdir(), "vegastack-doctor-test-"));
  tmpRoots.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function run(args) {
  const out = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a) => out.push(a.join(" "));
  console.error = (...a) => out.push(a.join(" "));
  try {
    return { code: main(args), output: out.join("\n") };
  } finally {
    console.log = log;
    console.error = err;
  }
}

const matches = (root, skipDirs = [], uiAlias = null) =>
  scanRetiredVocabulary(root, { skipDirs, uiAlias }).findings.map(
    (f) => `${f.file}:${f.line} ${f.match}`,
  );

console.log("doctor — retired vocabulary");

test("every retired utility, token and component import is reported with file:line", () => {
  const root = project({
    "src/page.tsx": [
      `import { IconButton } from "@/components/ui/icon-button";`,
      `import { Toaster } from "@/components/ui/sonner";`,
      `const Segmented = await import("@/components/ui/segmented");`,
      `<h1 className="text-h1">Title</h1>`,
      `<p className="text-label text-label-sm text-mono-label text-strong">x</p>`,
      `<p className="md:text-display-lg">x</p>`,
      `<div className="bg-destructive-subtle hover:bg-success-subtle-hover border-warning-subtle" />`,
      `<div className="bg-foreground/(--alpha-hover) opacity-(--opacity-dim) z-(--z-toast)" />`,
      `<div className="shadow-overlay backdrop-blur-glass" />`,
    ].join("\n"),
    "src/app.css": `.x { box-shadow: var(--shadow-overlay); }`,
  });
  const found = matches(root);
  for (const expected of [
    "src/page.tsx:1 import …/icon-button",
    "src/page.tsx:2 import …/sonner",
    "src/page.tsx:3 import …/segmented",
    "src/page.tsx:4 text-h1",
    "src/page.tsx:5 text-label",
    "src/page.tsx:5 text-label-sm",
    "src/page.tsx:5 text-mono-label",
    "src/page.tsx:5 text-strong",
    "src/page.tsx:6 text-display-lg",
    "src/page.tsx:7 bg-destructive-subtle",
    "src/page.tsx:7 bg-success-subtle-hover",
    "src/page.tsx:7 border-warning-subtle",
    "src/page.tsx:8 --alpha-hover",
    "src/page.tsx:8 --opacity-dim",
    "src/page.tsx:8 --z-toast",
    "src/page.tsx:9 shadow-overlay",
    "src/page.tsx:9 backdrop-blur-glass",
    "src/app.css:1 --shadow-overlay",
  ]) {
    assert.ok(
      found.includes(expected),
      `missing ${expected} in\n${found.join("\n")}`,
    );
  }
  assert.equal(found.length, 18, found.join("\n"));
});

test("each finding carries the migration guide's replacement", () => {
  const root = project({
    "a.tsx": `<h2 className="text-h2 bg-info-subtle opacity-(--opacity-hint)" />`,
  });
  const hints = Object.fromEntries(
    scanRetiredVocabulary(root).findings.map((f) => [f.match, f.hint]),
  );
  assert.match(hints["text-h2"], /font-heading text-base font-medium/);
  assert.match(hints["bg-info-subtle"], /bg-info\/10/);
  assert.equal(hints["--opacity-hint"], "opacity-70");
  assert.match(
    scanRetiredVocabulary(
      project({
        "b.css": `.x { z-index: var(--z-toast); color: var(--alpha-hover); }`,
      }),
    )
      .findings.map((f) => f.hint)
      .join("\n"),
    /^the literal \/7, e\.g\. bg-foreground\/7\nnothing — the Toast viewport sets its own z-60/,
  );
});

test("the look-alikes that are still legal are not reported", () => {
  const root = project({
    "src/ok.tsx": [
      `import { toast } from "sonner";`, // the npm package, not the retired registry item
      `import { Button } from "@/components/ui/button";`,
      `<div className="bg-tag-blue-subtle text-tag-blue-text text-3xl font-semibold" />`, // --tag-*-subtle is kept
      `<div className="context-h1 subtext-label" />`, // not a utility boundary
      `<div className="z-50 opacity-50 bg-foreground/10 shadow-md" />`,
    ].join("\n"),
    // A custom property the project DECLARES is the project's own, not a retired one.
    "src/theme.css": `:root { --z-header: 30; --alpha-brand: 0.4; }\n.h { z-index: var(--z-header); }`,
  });
  assert.deepEqual(matches(root), []);
});

test("the ui alias dir, node_modules and build output are skipped", () => {
  const retired = `<h1 className="text-h1" />`;
  const root = project({
    "components.json": JSON.stringify({ aliases: { ui: "@/components/ui" } }),
    "src/components/ui/card.tsx": retired,
    "node_modules/x/index.js": retired,
    ".next/static/chunk.js": retired,
    "dist/index.js": retired,
    "src/app/page.tsx": retired,
  });
  const skip = uiAliasDirs({ aliases: { ui: "@/components/ui" } }, root);
  assert.equal(skip.length, 1);
  assert.deepEqual(matches(root, skip), ["src/app/page.tsx:1 text-h1"]);
});

test("a retired component import counts only when it resolves into the ui alias dir", () => {
  const root = project({
    "src/components/ui/button.tsx": "",
    "src/components/app/page.tsx": [
      // the consumer's OWN components that happen to share a retired name — never reported
      `import { SectionHeader } from "@/components/layout/section-header";`,
      `import { Toaster } from "./sonner";`,
      `import { Segmented } from "../marketing/segmented";`,
      // registry copies, by every spelling that lands in the ui alias dir
      `import { IconButton } from "@/components/ui/icon-button";`,
      `import { ProgressIndicator } from "~/ui/progress-indicator";`,
      `import { FieldInline } from "../ui/field-inline";`,
    ].join("\n"),
  });
  const skip = uiAliasDirs({ aliases: { ui: "~/ui" } }, root);
  // `~/ui` resolves to nothing on disk here, so point the alias dir at the real folder too.
  const dirs = [...skip, join(root, "src/components/ui")];
  assert.deepEqual(matches(root, dirs, "~/ui"), [
    "src/components/app/page.tsx:4 import …/icon-button",
    "src/components/app/page.tsx:5 import …/progress-indicator",
    "src/components/app/page.tsx:6 import …/field-inline",
  ]);
});

test("comments and prose strings are not usage", () => {
  const root = project({
    "src/notes.tsx": [
      `/* --z-toast was retired; we used text-h1 */`,
      `// TODO: stop using text-label`,
      `const tip = "Use text-strong for emphasis";`,
      // a `//` inside a string is not a comment: the class string after it is still usage
      `const url = "https://example.com", cls = "text-h2"; // text-h3 in a trailing comment`,
      `/**`,
      ` * bg-destructive-subtle in a doc block`,
      ` */`,
      `<h1 className="text-h4" />`,
    ].join("\n"),
    "src/notes.css": `/* var(--z-overlay) */\n.x { color: red; }`,
  });
  assert.deepEqual(matches(root), [
    "src/notes.tsx:4 text-h2",
    "src/notes.tsx:8 text-h4",
  ]);
});

test("JSX text never hides the real usage after it on the same line", () => {
  // Round-2 review specimens: each line's class is real usage the comment/prose masking used to
  // swallow — an apostrophe in JSX text opened a pseudo-string to end of line, a URL's `//` read
  // as a line comment, a glob's `/*` opened a block comment, and `hidden!` (Tailwind's important
  // modifier) read as sentence punctuation that blanked its whole class string.
  const root = project({
    "src/app/page.tsx": [
      `export const A = () => <p>Don't worry. <span className="text-h1">T</span></p>;`,
      `export const B = () => <p>See https://x.dev <span className="text-h2">T</span></p>;`,
      `export const C = () => <div className="text-h3 hidden! md:flex" />;`,
      `export const D = () => <p>Match src/*.ts <span className="text-h4">T</span></p>;`,
      `export const E = () => <p>"Quoted," she said. <span className="text-label">T</span></p>;`,
      `export const F = () => <p>It's the user's <b className="text-strong">own</b></p>;`,
    ].join("\n"),
  });
  assert.deepEqual(matches(root), [
    "src/app/page.tsx:1 text-h1",
    "src/app/page.tsx:2 text-h2",
    "src/app/page.tsx:3 text-h3",
    "src/app/page.tsx:4 text-h4",
    "src/app/page.tsx:5 text-label",
    "src/app/page.tsx:6 text-strong",
  ]);
});

test("strings still start wherever an expression can, so prose strings stay masked", () => {
  const root = project({
    "src/strings.tsx": [
      `const a = "Use text-h1 for emphasis";`,
      `f("Use text-h2 here.", 'Keep text-h3 short.');`,
      `const b = ok ? "Pick text-h4 instead" : "Or text-label, please";`,
      `const c = () => "Try text-strong now";`,
      `function d() { return "Prefer text-code today"; }`,
      `const e = [\n  "Add text-code-sm later",\n];`,
      `const g = x || "Swap text-label-sm now";`,
    ].join("\n"),
  });
  assert.deepEqual(matches(root), []);
});

test("a class the project defines in its own CSS is not reported", () => {
  const root = project({
    "src/app.css": [
      `@utility text-h2 { font-size: 1.5rem; }`,
      `@utility text-display-* { font-size: --value(--text-*); }`,
      `@layer components { .text-strong, .card > .text-label { font-weight: 600; } }`,
    ].join("\n"),
    "src/page.tsx": `<p className="text-h2 text-display-lg text-strong text-label text-h1" />`,
  });
  assert.deepEqual(matches(root), ["src/page.tsx:1 text-h1"]);
});

test("third-party custom properties that share a retired prefix are not reported", () => {
  const root = project({
    "src/app.css": [
      `.a { z-index: var(--z-index); opacity: var(--opacity-disabled); }`,
      `.b { color: rgb(0 0 0 / var(--alpha-channel)); z-index: var(--z-modal); }`,
      `.c { z-index: var(--z-overlay); color: var(--alpha-border-subtle); }`,
    ].join("\n"),
  });
  assert.deepEqual(matches(root).sort(), [
    "src/app.css:3 --alpha-border-subtle",
    "src/app.css:3 --z-overlay",
  ]);
});

test("every --alpha-* the system ever shipped is reported, not just the reset's last nineteen", () => {
  // The design-tokens CHANGELOG retired five before the reset: fill-hover, input-hover and
  // surface-subtle (2026-09-08, "track is removed") and soft-hover and soft-surface (the Bubble
  // contrast fix). A var() naming any of them compiles to nothing.
  const root = project({
    "src/page.tsx": [
      `<div className="bg-primary/(--alpha-fill-hover)" />`,
      `<div className="dark:hover:bg-input/(--alpha-input-hover)" />`,
      `<div className="hover:bg-primary/(--alpha-surface-subtle)" />`,
      `<div className="bg-destructive/(--alpha-soft-surface) hover:bg-destructive/(--alpha-soft-hover)" />`,
    ].join("\n"),
  });
  const findings = scanRetiredVocabulary(root).findings;
  assert.deepEqual(
    findings.map((f) => `${f.line} ${f.match}`),
    [
      "1 --alpha-fill-hover",
      "2 --alpha-input-hover",
      "3 --alpha-surface-subtle",
      "4 --alpha-soft-surface",
      "4 --alpha-soft-hover",
    ],
  );
  const hint = (name) => findings.find((f) => f.match === name).hint;
  assert.match(hint("--alpha-fill-hover"), /\/80/);
  assert.match(hint("--alpha-input-hover"), /\/50/);
  assert.match(hint("--alpha-surface-subtle"), /\/10/);
  assert.match(hint("--alpha-soft-surface"), /\/10 .*dark.*\/20/);
  assert.match(hint("--alpha-soft-hover"), /\/20 .*dark.*\/30/);
});

test("*-subtle matches only the four status families, so its hint names a real token", () => {
  const root = project({
    "src/page.tsx": `<div className="bg-muted-subtle bg-accent-subtle bg-brand-subtle bg-warning-subtle" />`,
  });
  const findings = scanRetiredVocabulary(root).findings;
  assert.deepEqual(
    findings.map((f) => f.match),
    ["bg-warning-subtle"],
  );
  assert.match(findings[0].hint, /bg-warning\/10 .* text-warning-text/);
});

test("`doctor` fails with file:line when retired vocabulary is present, passes when clean", () => {
  const base = {
    "package.json": JSON.stringify({
      dependencies: { "@vegastack/design": "^0.7.0" },
    }),
    "postcss.config.mjs": `export default { plugins: { "@tailwindcss/postcss": {} } };`,
    "components.json": JSON.stringify({
      aliases: { ui: "@/components/ui" },
      registries: {
        "@vegastack": "https://design.vegastack.com/r/{name}.json",
      },
    }),
    "src/app/globals.css": `@import "@vegastack/design/preset.css";`,
    "src/components/ui/legacy.tsx": `<h1 className="text-h1" />`,
  };
  const clean = project({
    ...base,
    "src/app/page.tsx": `<h1 className="text-3xl font-semibold" />`,
  });
  const cleanRun = run(["--dir", clean]);
  assert.equal(cleanRun.code, 0, cleanRun.output);
  assert.match(cleanRun.output, /✓ no retired vocabulary/);

  const dirty = project({
    ...base,
    "src/app/page.tsx": `\n<h1 className="text-h1" />`,
  });
  const dirtyRun = run(["--dir", dirty]);
  assert.equal(dirtyRun.code, 1, dirtyRun.output);
  assert.match(
    dirtyRun.output,
    /✗ no retired vocabulary — 1 occurrence\(s\) in 1 file\(s\)/,
  );
  assert.match(
    dirtyRun.output,
    /src\/app\/page\.tsx:2 {2}text-h1 {2}→ {2}PageHeader \(font-heading text-2xl font-semibold/,
  );
});

test("page layout: an AppShellPage that sets its own width or gutter is reported; narrow is a warning", () => {
  const root = project({
    "src/app/a/page.tsx": [
      `<AppShellPage size="prose">ok</AppShellPage>`,
      `<AppShellPage className="max-w-2xl px-0 md:px-10">bad</AppShellPage>`,
      `<AppShellPage size="prose" className="pb-24 gap-4">ok</AppShellPage>`,
      `<AppShellPage className={cn("mx-auto", x && "p-0")} size="full">bad</AppShellPage>`,
      `<AppShellPage size="narrow">old</AppShellPage>`,
    ].join("\n"),
    "src/components/ui/app-shell.tsx": `<AppShellPage className="max-w-3xl" />`,
  });
  const { findings, deprecated } = scanPageLayout(root, {
    skipDirs: [join(root, "src/components/ui")],
  });
  assert.deepEqual(
    findings.map((f) => `${f.file}:${f.line} ${f.match}`),
    [
      "src/app/a/page.tsx:2 max-w-2xl",
      "src/app/a/page.tsx:2 px-0",
      "src/app/a/page.tsx:2 md:px-10",
      "src/app/a/page.tsx:4 mx-auto",
      "src/app/a/page.tsx:4 p-0",
    ],
  );
  assert.deepEqual(
    deprecated.map((f) => `${f.file}:${f.line}`),
    ["src/app/a/page.tsx:5"],
  );
});

// ---- composition: DS parts used as designed --------------------------------------------------

const UI = { "src/components/ui/button.tsx": "" };
const compositionOf = (root) =>
  scanComposition(root, { skipDirs: [join(root, "src/components/ui")] });
const lines = (findings) =>
  findings.map((f) => `${f.file}:${f.line} ${f.match}`);

console.log("doctor — composition");

test("`!` on a ui part is reported with the part and the token", () => {
  const root = project({
    ...UI,
    "src/home.tsx": [
      `import { ItemGroup } from "@/components/ui/item";`,
      `import { SidebarMenuButton as MenuButton } from "@/components/ui/sidebar";`,
      `import * as Ui from "../src/components/ui/popover";`,
      `<ItemGroup className="-mx-3 w-auto gap-0!">x</ItemGroup>`,
      `<MenuButton size="lg" className={cn("x", open && "group-data-[collapsible=icon]:p-1!")} />`,
      `<Ui.PopoverContent`,
      `  className="!p-0 md:!px-2"`,
      `/>`,
    ].join("\n"),
  });
  assert.deepEqual(lines(compositionOf(root).important), [
    "src/home.tsx:4 ItemGroup gap-0!",
    "src/home.tsx:5 SidebarMenuButton group-data-[collapsible=icon]:p-1!",
    "src/home.tsx:7 PopoverContent !p-0",
    "src/home.tsx:7 PopoverContent md:!px-2",
  ]);
});

test("`!` on the project's own components and plain elements, and JS `!`, are not reported", () => {
  const root = project({
    ...UI,
    "src/own.tsx": [
      `import { Card } from "@/components/app/card";`,
      `import { Button } from "@/components/ui/button";`,
      `<Card className="gap-0!" />`,
      `<div className="p-1!" />`,
      `<Button className={cn("gap-2", !open && "hidden")} disabled={!ok}>Done!</Button>`,
      `// <Button className="p-1!" /> in a comment`,
    ].join("\n"),
  });
  assert.deepEqual(compositionOf(root).important, []);
});

test("a width class on a popover, menu or select popup is reported; other parts are not", () => {
  const root = project({
    ...UI,
    "src/menus.tsx": [
      `import { PopoverContent } from "@/components/ui/popover";`,
      `import { DropdownMenuContent } from "@/components/ui/dropdown-menu";`,
      `import { SelectContent } from "@/components/ui/select";`,
      `import { DialogContent } from "@/components/ui/dialog";`,
      `<PopoverContent className="w-80 p-0" align="end">x</PopoverContent>`,
      `<DropdownMenuContent className="md:min-w-48 max-w-[calc(100vw-2rem)]" />`,
      `<SelectContent className="h-60" />`,
      `<DialogContent className="max-w-lg" />`,
      `<PopoverContent size="md">ok</PopoverContent>`,
    ].join("\n"),
  });
  assert.deepEqual(lines(compositionOf(root).widths), [
    "src/menus.tsx:5 PopoverContent w-80",
    "src/menus.tsx:6 DropdownMenuContent md:min-w-48",
    "src/menus.tsx:6 DropdownMenuContent max-w-[calc(100vw-2rem)]",
  ]);
});

test("a hand-written <header> inside Sheet/Drawer/Dialog content is reported; outside it is not", () => {
  const root = project({
    ...UI,
    "src/peek.tsx": [
      `import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";`,
      `import { SheetContent } from "@/components/ui/sheet";`,
      `export function Peek() {`,
      `  return (`,
      `    <Drawer>`,
      `      <DrawerContent style={{ width }} className="max-w-[calc(100vw-1rem)]">`,
      `        <div onKeyDown={(e) => { if (e.key === ">") e.stopPropagation(); }} />`,
      `        <header className="flex">bad</header>`,
      `        <DrawerHeader>ok</DrawerHeader>`,
      `      </DrawerContent>`,
      `      <header>after the content closes: ok</header>`,
      `      <SheetContent><section><header>bad</header></section></SheetContent>`,
      `    </Drawer>`,
      `  );`,
      `}`,
    ].join("\n"),
    "src/page.tsx": `export default () => <main><header>a page header</header></main>;`,
  });
  assert.deepEqual(lines(compositionOf(root).headers), [
    "src/peek.tsx:8 <header> in DrawerContent",
    "src/peek.tsx:12 <header> in SheetContent",
  ]);
});

const WIDTH_MAP = {
  "src/lib/page-layout.ts": [
    `/** @example definePageWidths({ "/": "full" }) */`,
    `export function definePageWidths(routes) { return routes; }`,
  ].join("\n"),
  "src/shell/page-widths.ts": [
    `import { MODULES } from "@/modules/registry";`,
    `import { definePageWidths } from "@/lib/page-layout";`,
    `export const pageWidths = definePageWidths({`,
    `  "/": "default",`,
    `  "/settings/profile": "prose",`,
    `  // "/settings/old": "full",`,
    `  ...Object.fromEntries(MODULES.flatMap((m) => Object.entries(m.shell.widths))),`,
    `});`,
  ].join("\n"),
  "src/modules/registry.ts": [
    `export const MODULES = [`,
    `  { id: "tasks", label: "Tasks", shell: { widths: {`,
    `    "/tasks": "default",`,
    `    "/tasks/board": "full",`,
    `    "/tasks/[taskId]": "default",`,
    `    "/tasks/new": "prose",`,
    `    "/docs/[[...slug]]": "full",`,
    `    "/docs/[id]": "prose",`,
    `  } }, nav: { "/tasks": "ignored" } },`,
    `];`,
  ].join("\n"),
};

test("AppShellPage size is compared with the route map, most specific row first", () => {
  const root = project({
    ...UI,
    ...WIDTH_MAP,
    "src/app/(app)/page.tsx": `<AppShellPage>home</AppShellPage>`,
    "src/app/(app)/settings/profile/page.tsx": `<AppShellPage size="prose">ok</AppShellPage>`,
    "src/app/(app)/tasks/board/page.tsx": `<AppShellPage size="default">bad</AppShellPage>`,
    "src/app/(app)/tasks/new/page.tsx": `\n<AppShellPage>bad</AppShellPage>`,
    "src/app/(app)/tasks/[taskId]/layout.tsx": `<AppShellPage size={"default"}>ok</AppShellPage>`,
    "src/app/(app)/tasks/page.tsx": `<AppShellPage size={board ? "full" : "default"}>skip</AppShellPage>`,
    "src/app/(app)/@modal/(.)tasks/new/page.tsx": `<AppShellPage size="prose">ok</AppShellPage>`,
    "src/app/(app)/reports/page.tsx": `<AppShellPage size="full">unlisted</AppShellPage>`,
    // `/docs/intro` is served by both `[id]` and `[[...slug]]`; the more specific `[id]` wins.
    "src/app/(app)/docs/intro/page.tsx": `<AppShellPage size="prose">ok</AppShellPage>`,
    "src/modules/tasks/tasks-page.tsx": `<AppShellPage size="full">not a route file</AppShellPage>`,
  });
  const { routeMap } = compositionOf(root);
  assert.equal(routeMap.rows, 8, JSON.stringify(routeMap));
  assert.deepEqual(routeMap.files, [
    "src/modules/registry.ts",
    "src/shell/page-widths.ts",
  ]);
  assert.deepEqual(lines(routeMap.mismatches), [
    'src/app/(app)/reports/page.tsx:1 size="full" on /reports',
    'src/app/(app)/tasks/board/page.tsx:1 size="default" on /tasks/board',
    'src/app/(app)/tasks/new/page.tsx:2 size="default" on /tasks/new',
  ]);
  assert.match(
    routeMap.mismatches[1].hint,
    /the map says "full" \(\/tasks\/board, src\/modules\/registry\.ts:4\)/,
  );
  assert.equal(routeMap.compared, 8);
  assert.equal(routeMap.dynamic, 1);
  assert.equal(routeMap.outside, 1);
});

test("`doctor` warns on composition findings, fails under --strict, and skips the route rule with no map", () => {
  const base = {
    "package.json": JSON.stringify({
      dependencies: { "@vegastack/design": "^0.8.0" },
    }),
    "postcss.config.mjs": `export default { plugins: { "@tailwindcss/postcss": {} } };`,
    "components.json": JSON.stringify({
      aliases: { ui: "@/components/ui" },
      registries: {
        "@vegastack": "https://design.vegastack.com/r/{name}.json",
      },
    }),
    "src/app/globals.css": `@import "@vegastack/design/preset.css";`,
    "src/components/ui/item.tsx": `<ItemGroup className="gap-0!" />`,
  };
  const clean = run([
    "--dir",
    project({
      ...base,
      "src/app/page.tsx": `import { ItemGroup } from "@/components/ui/item";\n<AppShellPage><ItemGroup /></AppShellPage>`,
    }),
    "--strict",
  ]);
  assert.equal(clean.code, 0, clean.output);
  assert.match(clean.output, /✓ important on DS parts/);
  assert.match(
    clean.output,
    /– page width vs route map — skipped \(no route map\)/,
  );

  const dirty = project({
    ...base,
    ...WIDTH_MAP,
    "src/app/(app)/tasks/board/page.tsx": [
      `import { ItemGroup } from "@/components/ui/item";`,
      `import { PopoverContent } from "@/components/ui/popover";`,
      `import { SheetContent } from "@/components/ui/sheet";`,
      `<AppShellPage>`,
      `  <ItemGroup className="gap-0!" />`,
      `  <PopoverContent className="w-80" />`,
      `  <SheetContent><header /></SheetContent>`,
      `</AppShellPage>`,
    ].join("\n"),
  });
  const warned = run(["--dir", dirty]);
  assert.equal(warned.code, 0, warned.output);
  for (const name of [
    "important on DS parts",
    "popup width",
    "overlay header",
    "page width vs route map",
  ])
    assert.match(warned.output, new RegExp(`! ${name} — 1 `));
  assert.match(
    warned.output,
    /src\/app\/\(app\)\/tasks\/board\/page\.tsx:5 {2}ItemGroup gap-0!/,
  );
  assert.match(warned.output, /setup looks correct \(4 warning\(s\)\)/);

  const strict = run(["--dir", dirty, "--strict"]);
  assert.equal(strict.code, 1, strict.output);
  assert.match(strict.output, /✗ popup width — 1 /);
  assert.match(strict.output, /4 problem\(s\)/);
});

// ---- owned-files ------------------------------------------------------------------------------

console.log("owned-files");

const HEADER = "// @vegastack date-time@0.25.80 sha256-abc=";
const INDEX = [
  {
    name: "button",
    type: "registry:ui",
    files: [{ target: "@ui/button.tsx" }],
  },
  {
    name: "date-time",
    type: "registry:lib",
    files: [{ target: "@lib/date-time.ts" }],
  },
  {
    name: "use-mobile",
    type: "registry:hook",
    files: [{ target: "@ui/use-mobile.ts" }],
  },
  {
    name: "email-kit",
    type: "registry:block",
    files: [
      { target: "components/email/render.ts" },
      { target: "components/email/missing.ts" },
    ],
  },
  { name: "card", type: "registry:ui", files: [{ target: "@ui/card.tsx" }] },
  {
    name: "evil",
    type: "registry:ui",
    files: [{ target: "@ui/../../../outside.ts" }],
  },
];
const OWNED = {
  "components.json": JSON.stringify({
    aliases: {
      ui: "@/components/ui",
      lib: "@/lib",
      hooks: "@/hooks",
      components: "@/components",
    },
  }),
  "src/components/ui/button.tsx": "export {}",
  "src/components/ui/use-mobile.ts": "export {}",
  "src/components/ui/my-own.tsx": "export {}",
  "src/components/app/legacy.tsx":
    "// @vegastack legacy-thing@0.1.0 sha256-x=\nexport {}",
  "src/lib/date-time.ts": `${HEADER}\nexport {}`,
  "src/lib/utils.ts": "export {}",
  "src/components/email/render.ts": "export {}",
};

test("owned-files lists installed index targets and header-carrying files, nothing else", () => {
  const root = project(OWNED);
  const cj = JSON.parse(OWNED["components.json"]);
  const owned = ownedFiles(root, cj, INDEX);
  assert.deepEqual(owned.files, [
    "src/components/app/legacy.tsx",
    "src/components/email/render.ts",
    "src/components/ui/button.tsx",
    "src/components/ui/use-mobile.ts",
    "src/lib/date-time.ts",
  ]);
  assert.deepEqual(
    owned.items.map((i) => `${i.name} ${i.type} ${i.version}`),
    [
      "button registry:ui null",
      "date-time registry:lib 0.25.80",
      "email-kit registry:block null",
      "legacy-thing null 0.1.0",
      "use-mobile registry:hook null",
    ],
  );
  // Offline: the provenance header is the only evidence.
  assert.deepEqual(ownedFiles(root, cj, null).files, [
    "src/components/app/legacy.tsx",
    "src/lib/date-time.ts",
  ]);
});

{
  const root = project({
    ...OWNED,
    "registry.json": JSON.stringify({ items: INDEX }),
  });
  const json = await (async () => {
    const out = [];
    const log = console.log;
    console.log = (...a) => out.push(a.join(" "));
    try {
      return {
        code: await ownedFilesMain([
          "--dir",
          root,
          "--index",
          join(root, "registry.json"),
          "--json",
        ]),
        output: out.join("\n"),
      };
    } finally {
      console.log = log;
    }
  })();
  test("owned-files --json prints { files, items } and exits 0; a bad flag exits 2", () => {
    assert.equal(json.code, 0, json.output);
    const parsed = JSON.parse(json.output);
    assert.equal(parsed.files.length, 5);
    assert.ok(Array.isArray(parsed.items));
  });
  const err = console.error;
  console.error = () => {};
  try {
    const bad = await ownedFilesMain([
      "--dir",
      root,
      "--offline",
      "--index",
      "x",
    ]);
    test("owned-files rejects --offline with --index", () =>
      assert.equal(bad, 2));
  } finally {
    console.error = err;
  }
}

test("strings, JSX text, generics and nested attributes never confuse the tag scan (review round 1)", () => {
  const root = project({
    ...UI,
    "src/edge.tsx": [
      `import { SheetContent } from "@/components/ui/sheet";`,
      `import { PopoverContent } from "@/components/ui/popover";`,
      `import { DataGrid } from "@/components/ui/data-grid";`,
      `import { Button } from "@/components/ui/button";`,
      `import { AppShellPage } from "@/components/ui/app-shell";`,
      // a closing tag in a string does not close the content
      `<SheetContent><div data-x="</SheetContent>" /><header /></SheetContent>`,
      // an opening tag in a string opens nothing
      `const text = '<SheetContent>'; const view = <header />;`,
      // an apostrophe in nested JSX text does not swallow the tag
      `<PopoverContent render={<span>Don't</span>} className="w-80" />`,
      // a TSX generic component is still a tag
      `<DataGrid<Row> className="p-0!" />`,
      // a nested element's attributes are not the outer tag's
      `<PopoverContent render={<div className="w-96" />} className="p-2" />`,
      // literal classes inside a template's interpolations are read; a JS \`!flag\` is not a class
      '<Button className={`gap-2 ${ok ? "p-0!" : "p-1"} ${!open && "hidden"}`} />',
      `<Button`,
      `  className={`,
      `    "p-3!"`,
      `  }`,
      `/>`,
    ].join("\n"),
  });
  const found = compositionOf(root);
  assert.deepEqual(lines(found.headers), [
    "src/edge.tsx:6 <header> in SheetContent",
  ]);
  assert.deepEqual(lines(found.widths), ["src/edge.tsx:8 PopoverContent w-80"]);
  assert.deepEqual(lines(found.important), [
    "src/edge.tsx:9 DataGrid p-0!",
    "src/edge.tsx:11 Button p-0!",
    "src/edge.tsx:14 Button p-3!",
  ]);
});

test("the route map takes only map rows, outside tests, and reports a conflicting row (review round 1)", () => {
  const root = project({
    ...UI,
    "src/shell/page-widths.ts": [
      `export const pageWidths = definePageWidths({ "/": "prose", "/docs/[id]": "full" });`,
      `const unrelated = { "/": "full" };`,
    ].join("\n"),
    "src/shell/page-widths.test.ts": `definePageWidths({ "/": "full" });`,
    "src/modules/a.ts": `export const a = { widths: { "/docs/[id]": "prose" } };`,
    "src/app/page.tsx": `<AppShellPage size="prose" />`,
    // an optional catch-all serves `/docs` (no row: `default`) AND `/docs/x` (`[id]`): no one size fits
    "src/app/docs/[[...slug]]/page.tsx": `<AppShellPage />`,
    // intercepting routes render the route they intercept
    "src/app/feed/@modal/(..)photo/[id]/page.tsx": `<AppShellPage size="prose" />`,
    // (the first row wins a conflict: files are read in path order, so a.ts's "prose")
    "src/app/feed/@modal/(...)docs/[id]/layout.tsx": `<AppShellPage size="prose" />`,
  });
  const { routeMap } = compositionOf(root);
  assert.equal(routeMap.rows, 2);
  assert.deepEqual(lines(routeMap.mismatches), [
    'src/app/docs/[[...slug]]/page.tsx:1 size="default" on /docs/[[...slug]]',
    'src/app/feed/@modal/(..)photo/[id]/page.tsx:1 size="prose" on /photo/[id]',
    'src/shell/page-widths.ts:1 route-map row "/docs/[id]": "full"',
  ]);
  assert.equal(routeMap.compared, 4);
});

test("owned-files never lists a file reached through a symlink out of the project (review round 1)", () => {
  const outside = project({ "button.tsx": "export {}", "x.ts": `${HEADER}\n` });
  const root = project({
    "components.json": JSON.stringify({
      aliases: { ui: "@/components/ui", lib: "@/lib" },
    }),
    "src/lib/real.ts": "export {}",
  });
  mkdirSync(join(root, "src/components"), { recursive: true });
  symlinkSync(outside, join(root, "src/components/ui"));
  symlinkSync(join(outside, "x.ts"), join(root, "src/lib/date-time.ts"));
  const cj = { aliases: { ui: "@/components/ui", lib: "@/lib" } };
  assert.deepEqual(ownedFiles(root, cj, INDEX).files, []);
});

{
  // A registry body that is not JSON must not echo a credential through the parser's error.
  const root = project({ "components.json": JSON.stringify({ aliases: {} }) });
  const fetch0 = globalThis.fetch;
  const env0 = process.env.CF_ACCESS_CLIENT_SECRET;
  const out = [];
  const err0 = console.error;
  process.env.CF_ACCESS_CLIENT_SECRET = "DEMO_SECRET_12345".repeat(8);
  globalThis.fetch = async () => ({
    ok: true,
    // Node quotes only a truncated prefix of the body: whole-value redaction cannot catch that.
    json: async () => JSON.parse("DEMO_SECRET_12345".repeat(8)),
  });
  console.error = (...a) => out.push(a.join(" "));
  let code;
  try {
    code = await ownedFilesMain(["--dir", root]);
  } finally {
    globalThis.fetch = fetch0;
    console.error = err0;
    if (env0 === undefined) delete process.env.CF_ACCESS_CLIENT_SECRET;
    else process.env.CF_ACCESS_CLIENT_SECRET = env0;
  }
  test("owned-files redacts a credential from a malformed index response (review round 1)", () => {
    assert.equal(code, 2);
    assert.match(out.join("\n"), /registry index is not JSON/);
    assert.doesNotMatch(out.join("\n"), /DEMO_SEC/);
  });
}

test("nested templates, object type arguments and string-borne map syntax (review round 2)", () => {
  const root = project({
    ...UI,
    "src/more.tsx": [
      `import { Button } from "@/components/ui/button";`,
      `import { DataGrid } from "@/components/ui/data-grid";`,
      "<Button className={`p-2 ${ok ? `p-0!` : `p-1`}`} />",
      '<Button className={`p-2 ${ok ? "}" : "p-3!"}`} />',
      `<DataGrid<{ id: string; name: string }> className="p-4!" />`,
    ].join("\n"),
    "src/shell/page-widths.ts": [
      `const extra = (label) => ({});`,
      `const example = 'definePageWidths({"/": "full"})';`,
      `export const pageWidths = definePageWidths({`,
      `  ...extra("}"),`,
      `  "/settings": "prose",`,
      `});`,
    ].join("\n"),
    "src/app/settings/page.tsx": `<AppShellPage size="prose" />`,
    "src/app/page.tsx": `<AppShellPage />`,
    // a catch-all serves `/docs/a` AND `/docs/a/b`: one sample is not enough
    "src/app/docs/[...slug]/page.tsx": `<AppShellPage size="full" />`,
    "src/modules/docs.ts": `export const m = { widths: { "/docs/[id]": "full" } };`,
  });
  const found = compositionOf(root);
  assert.deepEqual(lines(found.important), [
    "src/more.tsx:3 Button p-0!",
    "src/more.tsx:4 Button p-3!",
    "src/more.tsx:5 DataGrid p-4!",
  ]);
  assert.equal(found.routeMap.rows, 2);
  assert.deepEqual(lines(found.routeMap.mismatches), [
    'src/app/docs/[...slug]/page.tsx:1 size="full" on /docs/[...slug]',
  ]);
});

test("spread props make a size dynamic; a dynamic page is held to the static rows it serves (review round 3)", () => {
  const root = project({
    ...UI,
    "src/shell/page-widths.ts": `definePageWidths({ "/docs": "full", "/docs/new": "prose", "/docs/edit": "prose" });`,
    "src/app/docs/page.tsx": `const p = { size: "full" }; <AppShellPage {...p} />; <AppShellPage size="prose" {...p} />;`,
    // `[id]` also renders `/docs/new` (no page of its own) — prose — but not `/docs/edit`
    "src/app/docs/[id]/page.tsx": `<AppShellPage />`,
    "src/app/docs/edit/page.tsx": `<AppShellPage size="prose" />`,
  });
  const { routeMap } = compositionOf(root);
  assert.equal(routeMap.dynamic, 2);
  assert.deepEqual(lines(routeMap.mismatches), [
    'src/app/docs/[id]/page.tsx:1 size="default" on /docs/[id]',
  ]);
  assert.doesNotMatch(routeMap.mismatches[0].hint, /docs\/edit/);
});

{
  const root = project({
    // a missing quote around a value: the parser would quote the file's text back
    "components.json": `{"registries":{"@vegastack":{"url":TEST_CRED_VALUE}}}`,
  });
  const out = [];
  const err0 = console.error;
  console.error = (...a) => out.push(a.join(" "));
  let code;
  try {
    code = await ownedFilesMain(["--dir", root, "--offline"]);
  } finally {
    console.error = err0;
  }
  test("owned-files never quotes a malformed components.json (review round 3)", () => {
    assert.equal(code, 2);
    assert.match(out.join("\n"), /is not valid JSON/);
    assert.doesNotMatch(out.join("\n"), /TEST_CRED/);
  });
}

test("a layout answers for the pages it wraps, not its folder's own URL (review round 4)", () => {
  const root = project({
    ...UI,
    "src/shell/page-widths.ts": `definePageWidths({ "/settings/profile": "prose", "/settings/password": "prose", "/settings/members": "default", "/settings/members/invite": "prose" });`,
    "src/app/settings/(forms)/layout.tsx": `<AppShellPage size="prose">{children}</AppShellPage>`,
    "src/app/settings/(forms)/profile/page.tsx": `export default () => null;`,
    "src/app/settings/(forms)/password/page.tsx": `export default () => null;`,
    // this group's layout wraps a prose page and a default one: no one size fits
    "src/app/settings/(lists)/layout.tsx": `<AppShellPage>{children}</AppShellPage>`,
    "src/app/settings/(lists)/members/page.tsx": `export default () => null;`,
    "src/app/settings/(lists)/members/invite/page.tsx": `export default () => null;`,
  });
  const { routeMap } = compositionOf(root);
  assert.equal(routeMap.compared, 2);
  assert.deepEqual(lines(routeMap.mismatches), [
    'src/app/settings/(lists)/layout.tsx:1 size="default" on /settings',
  ]);
  assert.match(routeMap.mismatches[0].hint, /\/settings\/members\/invite/);
});

test("a dynamic route's own row does not hide a more specific static row it serves (review round 5)", () => {
  const root = project({
    ...UI,
    "src/shell/page-widths.ts": `definePageWidths({ "/docs/[id]": "default", "/docs/new": "prose" });`,
    "src/app/docs/[id]/page.tsx": `<AppShellPage />`,
    "src/app/docs/layout.tsx": `<AppShellPage>{children}</AppShellPage>`,
  });
  assert.deepEqual(lines(compositionOf(root).routeMap.mismatches), [
    'src/app/docs/[id]/page.tsx:1 size="default" on /docs/[id]',
    'src/app/docs/layout.tsx:1 size="default" on /docs',
  ]);
});

for (const dir of tmpRoots) rmSync(dir, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\n✗ doctor: ${failures} test(s) failed`);
  process.exit(1);
}
console.log("\n✓ doctor: all tests passed");
