# Do1-a — Docs chrome on the system, agent export with real API tables, frontmatter schema

_Plan for the first half of issue #48 (audit 2026-09-07, `08-docs-structure.md` §2–§5,
`05-docs-chrome.md` DC-01…DC-17). The second half — migrating every page body to the canon, the
Playground/Explorer per-page policy lint, `component:new`, the extended `content-lint` — is Do1-b
(wave 5) and is deliberately out of scope here._

## Scope

1. **Frontmatter schema** (canon row 0) — `registry`, `status`, `since`, `a11y` validated in
   `source.config.ts` (optional until Do1-b migrates the pages); rendered in the page header.
2. **Agent export** (DS-01) — the per-page `.md` route and `llms-full.txt` contain the fixture
   source, flat prop tables, do/don't pairs, install steps; zero JSX tags outside code fences.
   `llms.txt` adds the component-contract route list and the public skill roster.
3. **API tables** (DS-02/DS-03) — one flat table per part, own props only, literal unions, `@default`
   column; parts without own props become one sentence; a `data-*`/CSS-variable table generated from
   a new `dataAttributes` contract field. Human and markdown renderers share one data path.
4. **Generated sections** (canon rows 1, 4, 8, 10) — `InstallSteps`, `Anatomy`, `StatesTested`,
   `ComponentChangelog` as MDX components; the registry notice once per site as a `Banner`.
5. **Gates** — `tooling/verify-docs-export.mjs` (JSX / placeholder residue / empty API table, with a
   negative self-test) and `tooling/verify-docs-base-mirror.mjs` (DC-17, with a negative self-test).
6. **Chrome** — DC-01…DC-15, DC-17 (DC-16 → I1; the duplicate-`main` half of DC-06 → N1).
7. **Doctrine** — `design.md` §Docs canon (amendment #12), AGENTS.md §Docs authoring, CHANGELOG
   `📚 Docs` under 0.7.0, ledgers.

## Non-goals

- Rewriting the 110 component page bodies to the canon (Do1-b). Only the three reference pages
  (button, dialog, data-grid) gain the generated sections so the reviewer can see them rendered.
- Wiring the new gates into root `pnpm lint` (G1-b) — they run in the docs package `build`/`lint`.
- Any dependency change (D1), any token/component-source change (F1), any `tooling/lib` change (G1-a).

## Library facts relied on (installed versions, read from `node_modules`)

- fumadocs-core **16.11.5** `remarkLLMs` — `LLMsOptions.mdxAsPlaceholder` + `stringify` callback
  (`dist/mdx-plugins/remark-llms.js`) and `renderPlaceholder(text, renderers)`
  (`dist/mdx-plugins/remark-llms.runtime.js`). The `output: "function"` / `asMarkdown()` /
  `getText("processed", { components })` API named in the issue does **not** exist in 16.11.5 —
  it is the later Fumadocs API D2 migrates to. Docs: https://fumadocs.dev/docs/headless/mdx/remark-llms.
- fumadocs-mdx **15.2.0** — `postprocess.includeProcessedMarkdown: boolean | LLMsOptions`
  (`dist/core-*.d.ts:53`); `getText("processed")` returns the `_markdown` export.
- fumadocs-typescript **5.3.0** — `createGenerator().generateTypeTable(props, options)` returns
  `GeneratedDoc[]` (`entries[]: { name, type, simplifiedType, description, tags, required }`), the
  data both renderers consume. `AutoTypeTable` from `fumadocs-typescript/ui` is no longer used.
- fumadocs-ui **16.11.5** — `Banner`, `Steps`/`Step`, `Files`/`File`, `Callout`, `DocsPage`
  (`ComponentProps<'article'>`, so it accepts `id`).
- Base UI **1.6** `Dialog` (via the copied-in system `Dialog`) for the fullscreen preview.

## Verification

Builds (both `SITE_VISIBILITY`), the counts (JSX in agent markdown, `(no own props)`), the emitted
CSS lint, the capture harness on button/dialog/data-grid (heading weight 500, skip link first,
no focusable div), the Playwright docs-shell spec (fullscreen trap, product font-size), `pnpm lint`,
`pnpm typecheck`, `design:derived`/`design:sync` clean, `pnpm gates:push`.

## Risks

- `mdxAsPlaceholder` captures children with `containerPhrasing`; block children (Callout, Tab)
  need `containerFlow` — handled by a custom `stringify` in `source.config.ts`.
- The contract byte change moves the SHA into nine derived files; `pnpm design:derived` re-syncs.
- `apps/docs/package.json` gains scripts only (no deps) — a trivial merge with D1.
