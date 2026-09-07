# 01 — Dependencies: currency, security, and unused modern features

Compiled 2026-09-07 from five research passes (Tailwind, Next/React, Base UI, shadcn/Fumadocs,
tooling/pnpm). Every version was read from the npm registry that day; every feature claim carries the
source URL in the per-library sections. Installed versions come from `pnpm-lock.yaml`.

## Summary

1. **Security first.** Four installed packages carry published advisories: `@vitest/browser` 4.1.9
   (critical, provider commands bypass `allowWrite` — the browser lanes run on developer machines),
   `@tiptap/core` 3.27.4 (prototype pollution + paste XSS), `postcss` 8.5.19 (source-map file read),
   `style-dictionary` 5.5.0 (prototype pollution). All are patch/minor bumps.
2. **The docs app sits on an unmaintained Next line.** 16.2.x stopped receiving patches in July;
   16.3.3/16.3.4 carried two criticals that were not backported. The static export is not exploitable,
   but `next dev` is, and the line is dead. Move to 16.3.4; two config flags become no-ops.
3. **Fumadocs 16.11.5 → 16.15.8 is a real migration, not a bump.** Orama was replaced by ZBSearch in
   16.14 and `apps/docs/components/search.tsx` passes an Orama instance that no longer type-checks; the
   twoslash/typescript/story packages moved to a bundled TypeScript 7 and must move together.
4. **Nothing in Base UI 1.7/1.8 adds a primitive we lack**; 1.8.0 is a low-risk bump (typing of
   `render` callbacks, `aria-orientation` relocation, `readOnly` Select/Combobox now open, NavigationMenu
   keeps focus on the trigger). The primitives we still hand-roll that Base UI ships — `Toast`, `Drawer`,
   `Toolbar`, `CheckboxGroup`, `Fieldset`, `Menubar`, `Meter` — existed at 1.6.0 too; those are design
   decisions, not upgrade fallout.
5. **Three majors are not mechanical and should wait:** TypeScript 7 (no compiler API; tsup `dts` and
   typescript-eslint break), Vitest 5 (strict locators, `clearMocks` default, `.vitest/` output move),
   Changesets 3 (`changeset version` exits 1 with no changesets — breaks `release.yml` and the receipt
   carry; private packages stop versioning). Four majors are mechanical: `motion` 13, `react-dropzone` 20,
   `@testing-library/jest-dom` 7, `globals` 17, pragmatic-drag-and-drop 3.

## Version table

| package                                     | where                | installed        | latest           | gap                     | notes                                                                                                                                                                                                                |
| ------------------------------------------- | -------------------- | ---------------- | ---------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| next                                        | docs                 | 16.2.11          | 16.3.4           | minor                   | 16.2 line unpatched since 2026-07-25; 16.3 defaults `enablePrerenderSourceMaps` + Turbopack FS cache (already opted in), TS-CLI type check on by default, writes an agent-rules block into `AGENTS.md` on `next dev` |
| react / react-dom                           | catalog              | 19.2.8           | 19.2.8           | —                       | current; no 19.3 stable exists                                                                                                                                                                                       |
| typescript                                  | catalog              | 6.0.3            | 7.0.2            | **major**               | 6.x is terminal (no 6.0.4). TS 7 = Go compiler, no programmatic API until 7.1; blocks tsup `dts`, typescript-eslint; Next needs 16.3 first                                                                           |
| tailwindcss                                 | catalog              | 4.3.2            | 4.3.3            | patch                   | `@tailwindcss/node`/`oxide` pinned 4.3.1 — align all to 4.3.3                                                                                                                                                        |
| @base-ui/react                              | ui, docs (exact pin) | 1.6.0            | 1.8.0            | minor                   | see Base UI section for the 15 behavioural deltas                                                                                                                                                                    |
| shadcn                                      | root (exact pin)     | 4.13.0           | 4.21.0           | minor                   | 4.13.1 security (drops custom headers on cross-origin redirects, path traversal); 4.21 makes the `cn` package the upstream default → every `--diff` now shows import churn                                           |
| @shadcn/react                               | ui, docs             | 0.2.1            | 0.3.1            | minor                   | MessageScroller `data-pending-scroll` (0.3.1) fixes SSR top-flash; 0.3.0 adds a second headless primitive (`Questionnaire`) — using it is a new MK decision                                                          |
| fumadocs-ui / fumadocs-core                 | docs (exact)         | 16.11.5          | 16.15.8          | minor (breaking for us) | Orama→ZBSearch 16.14; Tabs stop force-mounting 16.12; `<main>` landmark 16.14.5; theme hotkey `D` 16.13; land on 16.15.8 (16.12–16.15.7 had a Tabs hash regression)                                                  |
| fumadocs-mdx                                | docs                 | 15.x             | 15.4.0           | minor                   | requires core ≥16.15.3                                                                                                                                                                                               |
| fumadocs-typescript                         | docs                 | 5.x              | 5.4.0            | minor                   | bundled TS 7.0.2; API tables may reorder members                                                                                                                                                                     |
| fumadocs-twoslash                           | docs                 | 3.3.0            | 4.0.0            | **major**               | requires TS 7 + core ≥16.15.7 + `@base-ui/react ^1.7`; 3.3.1 is the TS6-safe patch                                                                                                                                   |
| @fumadocs/story                             | docs                 | 1.2.x            | 1.3.0            | minor                   | bundled TS 7; control order may change                                                                                                                                                                               |
| lucide-react                                | ui, design, docs     | 1.24.0           | 1.41.0           | minor                   | `trash` removed (use `trash-2`); redesigned glyphs → rerun `verify-animated-icons`                                                                                                                                   |
| motion                                      | ui, docs             | 12.42.2          | 13.2.0           | **major**               | only break: emotion `isValidProp` — not used here; mechanical                                                                                                                                                        |
| recharts                                    | ui, docs             | 3.9.2            | 3.10.1           | minor                   | Legend `position`/`offset` props; pixel review                                                                                                                                                                       |
| @tiptap/*                                   | ui, docs             | 3.27.4           | 3.31.3           | minor                   | **security** 3.30.4 / 3.30.5 / 3.31.2                                                                                                                                                                                |
| @tanstack/react-table                       | ui, docs             | 8.21.3           | 9.2.4            | **major**               | `useTable` + `tableFeatures`, row models as feature slots, renames; touches only `data-grid`                                                                                                                         |
| @tanstack/react-virtual                     | ui, docs             | 3.14.8           | 3.14.10          | patch                   | —                                                                                                                                                                                                                    |
| @atlaskit/pragmatic-drag-and-drop (+hitbox) | ui, docs             | 2.0.1 / 2.0.0    | 3.1.0 / 2.2.0    | major                   | legacy entry points kept as shims; mechanical                                                                                                                                                                        |
| react-dropzone                              | ui, docs             | 19.1.1           | 20.1.1           | major                   | Node ≥22 only; mechanical                                                                                                                                                                                            |
| react-resizable-panels                      | ui, docs             | 4.12.2           | 4.12.3           | patch                   | —                                                                                                                                                                                                                    |
| sonner                                      | ui, docs             | 2.0.7            | 2.0.8            | patch                   | —                                                                                                                                                                                                                    |
| zod                                         | docs                 | 4.4.3            | 4.5.4            | minor                   | take 4.5.4, not 4.5.0                                                                                                                                                                                                |
| style-dictionary                            | tokens, root         | 5.5.0            | 5.5.3            | patch                   | **security** 5.5.1; 5.5.3 touches `color/css` alpha precision → rerun token build + `design:sync:check`                                                                                                              |
| postcss                                     | docs                 | 8.5.19           | 8.5.28           | patch                   | **security** 8.5.23; skip 8.5.27 (types regression)                                                                                                                                                                  |
| vitest / @vitest/browser-playwright         | ui, design           | 4.1.9            | 5.0.0            | **major**               | **critical advisory on 4.1.9 → 4.1.10 now**; v5 later                                                                                                                                                                |
| vitest-browser-react                        | ui                   | 2.x              | 2.3.0            | minor                   | supports vitest 5                                                                                                                                                                                                    |
| @testing-library/jest-dom                   | ui                   | 6.9.1            | 7.0.1            | major                   | needs `@testing-library/dom` peer; mechanical                                                                                                                                                                        |
| @testing-library/user-event                 | ui                   | 14.6.1           | 14.6.7           | patch                   | —                                                                                                                                                                                                                    |
| playwright / @playwright/test               | docs, ui             | 1.61             | 1.63.0           | minor                   | 1.62 removed `Locator.ariaRef()`; Chromium 153 / Firefox 155 / WebKit 26.6 → rerun cross-engine smoke                                                                                                                |
| axe-core                                    | ui                   | 4.12.1           | 4.13.0           | minor                   | expanded `aria-prohibited-attr`, `role=image`; expect new failures                                                                                                                                                   |
| turbo                                       | root                 | 2.10.5           | 2.10.12          | patch                   | —                                                                                                                                                                                                                    |
| tsup                                        | design, tokens       | 8.5.1            | 8.5.1            | —                       | broken on TS 7 (`dts`)                                                                                                                                                                                               |
| eslint / typescript-eslint                  | all                  | 10.7 / 8.64      | 10.10 / 8.69     | minor                   | typescript-eslint still `<6.1.0` TS peer                                                                                                                                                                             |
| globals                                     | root                 | 16.5.0           | 17.12.0          | major                   | `audioWorklet` split from `browser`; mechanical                                                                                                                                                                      |
| @changesets/cli / changelog-github          | root                 | 2.31.1 / 0.5.2   | 3.0.2 / 1.0.1    | **major**               | ESM-only; `version` exits 1 with nothing to do; private packages need `privatePackages: true`; pair with `changesets/action` v2                                                                                      |
| husky                                       | root                 | 9.1.7            | 9.1.7            | —                       | —                                                                                                                                                                                                                    |
| prettier                                    | root                 | 3.9.5            | 3.9.6            | patch                   | —                                                                                                                                                                                                                    |
| wrangler                                    | docs                 | 4.113            | 4.129            | minor                   | nothing static-assets-specific                                                                                                                                                                                       |
| @types/react / react-dom                    | all                  | 19.2.17 / 19.2.3 | 19.2.18 / 19.2.7 | patch                   | —                                                                                                                                                                                                                    |
| @types/node                                 | all                  | 25.9.4           | 26.4.1           | major                   | tracks Node 26; stay on 24/25 types while runtime is ≥24.14                                                                                                                                                          |
| pnpm (packageManager)                       | root                 | 11.7.0           | 12.3.4 (11.26.0) | major                   | pnpm 12 = Rust rewrite; unknown keys in `pnpm-workspace.yaml` become errors; lockfile re-keyed on first resolve                                                                                                      |
| thesvg                                      | design               | 3.2.6            | 3.3.2            | minor                   | no changelog; diff via icon gates                                                                                                                                                                                    |
| tsx                                         | tooling              | 4.23.1           | 4.23.13          | patch                   | —                                                                                                                                                                                                                    |

Transitive `pnpm audit` (read-only): 1 critical / 25 high / 19 moderate / 2 low — brace-expansion,
js-yaml, undici, hono, fast-uri, nanoid, browserslist, qs, sharp, ip-address, esbuild — mostly resolved by
a lockfile refresh plus a few `pnpm.overrides`.

## Modern features not leveraged, per library

### Tailwind 4.1–4.3 (installed 4.3.2)

Adopt now (token-neutral, serve existing rules):

- `wrap-anywhere` / `wrap-break-word` for long-URL cells and toasts (pairs with the `min-w-0` rule).
- `pointer-coarse:` variant — the 24px hit-area floor can become `pointer-coarse:min-h-(--size-touch)`
  instead of an always-on invisible expansion on every checkbox/radio/switch/slider thumb.
- `justify-center-safe` / `items-center-safe` on centred overflow containers (dialogs, toolbars) — serves
  the 320px reflow contract directly.
- `scrollbar-gutter-stable` on dialog/sheet bodies (no layout shift when overflow appears);
  `scrollbar-thin` + `scrollbar-thumb-border scrollbar-track-transparent` replaces any hand-written
  `::-webkit-scrollbar` escapes (data-grid, message-scroller) — add the prefixes to design-lint's colour list.
- `user-invalid:` for error borders only after interaction (better than `aria-invalid` alone for native
  constraint validation).
- `@source not` to exclude `.gates/`, `.vrt-review/`, generated JSON from scanning; `@source inline(…)` as
  the lint-friendly safelist for CVA classes.
- `font-features-*` → a named `--font-features-tabular` for data-grid numerics.
- `inset-s-*`/`inset-e-*` replace the **deprecated** `start-*`/`end-*` (4.2.0) — grep and migrate before 5.0.
- `details-content:` for native disclosures; `inverted-colors:invert` on `BrandIcon`.
  Skip: `text-shadow-*` (against flat doctrine), `zoom-*` (ban), `@container-size` (no block-axis need yet).
  Watch: the queued release refuses utilities with silently-ignored modifiers (`rounded-sm/[5]`) — a typo that
  emits nothing today will start failing.

### Next 16.3 (installed 16.2.11)

Applicable: the two already-enabled flags become defaults (delete them); `experimental.useTypeScriptCli`
now type-checks the whole project including tests during `next build`; prefetch inlining is free; the
`AGENTS.md` block that `next dev` writes needs a decision (commit it under `apps/docs/` or ignore).
Not applicable to `output: 'export'`: Cache Components/PPR, partial prefetching, `catchError` retry,
immutable assets (explicitly disabled for export), offline retries, root params.

### React 19.2 (installed 19.2.8)

- `useEffectEvent` (stable) is the textbook fit for `use-drag-reorder`, `use-list-nav`, `use-file-drop`
  and every component holding a "latest props" ref inside a subscription — audit, don't blanket-rewrite.
- `<Activity>` (stable) is legitimate for Tabs (preserve inactive panel state) — the repo does not use it
  today (grep confirms only lucide "activity" icons and a JSDoc example). Consumers must be on ≥19.2;
  check the `@vegastack/design` peer range. Base UI's Collapsible-inside-Activity transition glitch is
  still open upstream.
- `<ViewTransition>` / `addTransitionType` are **canary only**. Trap: they work inside the docs app
  because App Router vendors a 19.3 canary, but registry consumers on 19.2.8 get `undefined`. Do not ship.
- React Compiler 1.0: Next 16.3 does not default it; it cannot help a source-distributed registry. Take
  the `eslint-plugin-react-hooks@6` compiler-powered lint rules; leave the transform off.

### Base UI 1.8.0 (installed 1.6.0)

Upgrade deltas to verify: `render` callback typing tightened (#5104, `pnpm typecheck`); `Combobox.Input`
no longer injects `type="text"`; `Accordion.Root` no longer sets `dir` (#5117 — RTL contract); submenu
`onOpenChange` no longer fires twice; Select no longer force-mounts on programmatic value change;
`aria-orientation` moved to role owners (#5551); `readOnly` Select/Combobox now open and browse (#5531 —
`editable-cell` passes `readOnly`); NavigationMenu keeps focus on trigger on keyboard open (#5479);
async Field validation publishes neutral validity (#5600 — `auto-save-input`); `--transform-origin` for
start/end-aligned popups now the aligned edge (#5015 — pop-in origin visibly changes); new
`Avatar.Image keepMounted` + `data-loading`/`data-error`; `Combobox.createItems`.
Primitives we hand-roll that Base UI ships (all pre-1.6): `Toast` (vs sonner — sanctioned exception, MK
decision), `Drawer` (vs Sheet-on-Dialog: swipe, snap points, virtual keyboard), `Toolbar` (action-bar,
filter-bar, text-edit toolbar), `CheckboxGroup` (select-all patterns in DataGrid/DataList), `Fieldset`,
`Menubar`, `Meter`. Still no Base UI Calendar/DatePicker (removed before publish), Tree, Breadcrumb,
Pagination, Stepper, Tag input, Color picker, Table.

### shadcn CLI 4.21 (installed 4.13.0)

`registries` may now live in `package.json` (4.16/4.18) — the consume skill and `registry-request.mjs`
only read `components.json`; dynamic search/pagination fields in `registry.json` schema (4.16.1);
programmatic `addRegistryItems` (4.15) — keep the CLI spawn in `verify-shadcn-consume` because the
spawn _is_ the proof; `cn` package default (4.21) — decide whether `@vegastack/design`'s `cn` re-exports
it (new dependency → MK) or `--diff` reviews tolerate the churn line. `registry-item.json` build output
is byte-identical; `meta.integrity` remains our private convention.

### Fumadocs 16.15.8 (installed 16.11.5)

Required code changes: `search.tsx` (`initOrama` → `staticClient`, drop `@orama/orama`); decide
`theme={{ hotKey: false }}` (a global `D` hotkey inside a component showcase is a hazard for contract
runs); preview `Tabs` stop force-mounting inactive panels (`forceMount` where contracts need hidden
panels); Fumadocs now renders its own `<main>` — AppShell/Sidebar previews already trigger
`landmark-no-duplicate-main` in the sweep and will get worse. Opt-in wins: `renderToMarkdown` /
`includeProcessedMarkdown: { output: 'function' }` so `/llms.mdx/*` gets real Markdown for previews and
type tables; root-type versioning if the docs ever version per major.

### TypeScript 7 (installed 6.0.3)

Not now. Path: Next 16.3 first (its TS-CLI checker supports TS 7), then wait for TS 7.1's API so tsup
`dts` and typescript-eslint follow; `ignoreDeprecations: "6.0"` must be removed and whatever it silences
fixed before either. `baseUrl` is a hard error in 7 — check every tsconfig.

### Vitest 5 / Playwright 1.63 / pnpm 12 / Changesets 3

- Vitest 5: config API survives; test bodies may break on `locators.exact: true`, strict
  `toHaveTextContent`, `clearMocks: true` default, un-awaited `.resolves` failing, and reporter output
  moving to `.vitest/` (gitignore + gate report paths). Do after the security patch, as its own issue.
- Playwright 1.63: engine bumps → rerun the cross-engine smoke; `Locator.ariaRef()` removed.
- pnpm 12: mostly mechanical; expect a lockfile re-key; unknown `pnpm-workspace.yaml` keys become errors.
  pnpm 11 is also far behind on minors (11.7 → 11.26).
- Changesets 3: `changeset version` exit code and private-package versioning both hit `release.yml` and
  `tooling/gate-receipt-carry.mjs`; must move with `changesets/action` v2 in one reviewed change.

## Pins and release-age policy

- Exact pins: `@base-ui/react 1.6.0`, `shadcn 4.13.0`, `next 16.2.11`, `fumadocs-ui/core 16.11.5`.
  Justified for the two registry-shaping packages (Base UI, shadcn) because registry output and
  `verify-shadcn-consume` depend on them; keep exact pins but bump deliberately. Next and Fumadocs pins
  exist because of past breakage; keep exact, bump per batch below.
- `minimumReleaseAge` is **not set**, so pnpm 11's default of 1440 minutes applies to every package:
  anything published in the last 24h silently resolves to an older version. The
  `minimumReleaseAgeExclude` entries (`fumadocs-core@16.10.5`, `fumadocs-ui@16.10.5`) are **stale** — those
  versions are two minors old and the exclusion is a no-op. Set `minimumReleaseAge` explicitly (so
  `minimumReleaseAgeStrict` becomes true and a too-new version fails instead of silently downgrading),
  and delete the two stale excludes.
- `next.config.mjs` still calls 16.3 a prerelease — stale comment.

## Recommended update batches (ordered)

| #   | batch                                                                                                        | risk                    | contents                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Security patches**                                                                                         | low                     | `@vitest/browser` → 4.1.10 (override), `@tiptap/*` → 3.31.3, `postcss` → 8.5.28, `style-dictionary` → 5.5.3 (rerun token build + sync check), lockfile refresh for transitive advisories with `pnpm.overrides` where needed                              |
| 2   | **Patch/minor alignment**                                                                                    | low                     | Tailwind 4.3.3 (align `@tailwindcss/node`/`oxide`), `@types/*`, prettier, turbo, tsx, sonner, react-virtual, react-resizable-panels, zod 4.5.4, eslint/typescript-eslint minors, wrangler, user-event; then `pnpm-workspace.yaml` release-age policy fix |
| 3   | **Next 16.3.4**                                                                                              | low-medium              | delete the two now-default flags, verify `next build` under the TS-CLI checker (whole-project incl. tests), decide the `AGENTS.md` agent-rules block, fix the stale comment                                                                              |
| 4   | **Base UI 1.8.0 + shadcn 4.21 + @shadcn/react 0.3.1**                                                        | medium                  | run the 15 verification points; `registry:build` idempotency; `verify-shadcn-consume`; decide the `cn` package question; MessageScroller `data-pending-scroll` styling                                                                                   |
| 5   | **Fumadocs 16.15.8 family** (ui, core, mdx 15.4, typescript 5.4, story 1.3; twoslash stays 3.3.1 until TS 7) | medium-high             | search.tsx rewrite, `hotKey: false`, Tabs `forceMount` audit, duplicate-`main` fix in AppShell/Sidebar previews, clear `.next/fumadocs-typescript` cache, `verify-public-api-docs` rerun, vrt-review of API tables                                       |
| 6   | **lucide 1.41 + axe-core 4.13 + Playwright 1.63 + recharts 3.10**                                            | medium                  | icon rename sweep (`Trash` → `Trash2`), regenerate animated-icon mirrors, triage new axe rules, rerun three-engine suite, Legend prop migration                                                                                                          |
| 7   | **Mechanical majors**                                                                                        | low-medium              | `motion` 13, `react-dropzone` 20, pragmatic-dnd 3 (+ per-function imports), `@testing-library/jest-dom` 7 (+ `@testing-library/dom` peer), `globals` 17                                                                                                  |
| 8   | **TanStack Table 9**                                                                                         | medium                  | `data-grid` only: `useTable` + `tableFeatures`, feature-slot row models, renames; keep behind the sanctioned-exception boundary file                                                                                                                     |
| 9   | **Vitest 5 + vitest-browser-react 2.3**                                                                      | medium                  | after (1); own issue; gate report paths                                                                                                                                                                                                                  |
| 10  | **Changesets 3 + changesets/action v2 + pnpm 12**                                                            | high (release plumbing) | one reviewed change touching `release.yml`, the receipt carry, `.changeset/config.json` (`privatePackages`); MK-gated because it is the publish path                                                                                                     |
| —   | **TypeScript 7 / fumadocs-twoslash 4**                                                                       | blocked                 | revisit at TS 7.1 (API) + tsup/typescript-eslint support                                                                                                                                                                                                 |
