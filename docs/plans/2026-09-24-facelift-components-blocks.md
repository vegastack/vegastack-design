# Plan: Facelift transcript, audio dock, board lanes and a conforming block set (00c)

**Status:** approved by MK 24-09-2026 ("Approve all as recommended", Regent #140 plan approval): D1–D7 as recommended. Task 1 ships as PR 1 of 5.
**Origin:** Regent issue `vegastack/engg-clients-regent-ai-platform-web-app-v2#140` (brief 00c of the facelift epic #135, approved by MK 24-09-2026). It owns DS-49, DS-51, DS-52, DS-53, DS-55, DS-56, DS-57, DS-58, DS-59, DS-60, DS-77, DS-78, DS-79 and DS-80. DS-50 and DS-54 are dropped.
**Branch / worktree:** `feat/facelift-components-blocks` off `origin/main` (`dc228eb2c`, `@vegastack/ui` 0.16.1, `@vegastack/design` 0.7.2), at `~/projects/vegastack-design-facelift-blocks`. The brief suggested `feat/facelift-new-components-blocks` and `…-new-components-blocks.md`. The operator's planning instruction named this branch and file, and they are used here. The branch tracks `origin/main`, so the first push is `git push -u origin feat/facelift-components-blocks`.
**Lands after:** #136 (00d: DS-73 conventions, block rules, DS-25 link-button recipe, DS-26, DS-29 empty tiers, DS-74, DS-75), #137 (00a: DS-02, DS-11, DS-19, DS-23, DS-24's neighbours, DS-47, DS-68, DS-69) and #138 (00e: DS-04, DS-05, DS-06, DS-07, DS-12, DS-13, DS-14, DS-16, DS-24 `settings-01`, DS-62, DS-63). Several tasks also compose #139 (00b), as the dependency table shows. Every task starts with `git fetch origin && git rebase origin/main`.
**No decision rows are proposed.** `transcript` is ours. `audio-player`, `board`, `notification-bell`, `use-platform` and `shortcut-overlay` are already ours (`ours.json`). The decisions below are dependency and tooling questions.

## Re-grounding against `main` (dc228eb2c): corrections to the brief

1. **Contract records are a top-level `blocks` array** in `packages/ui/component-contracts.json` (:24621), not `contracts.blocks`. Families in use are `auth-block`, `shell-block` and `starter-block`. `expectedCounts.blocks` is 32 and `totalRegistryItems` is 692.
2. **`dashboard-01` is hard-coded in the contracts gate.** `expectedWaveMembers.Block` is `["dashboard-01"]` and `expectedWaveCounts.Block` is 1. Both are asserted in `tooling/verify-component-contracts.mjs:1112-1115, 1127`. `tooling/test/affected-tests.test.mjs:94-96` expects `["dashboard-01"]` from a `dashboard-01/page.tsx` change. Both move to a kept block (decision D4).
3. **`excluded.json` has no block mechanism.** It holds `_note` and `components` only, and `tooling/upstream/lib.mjs:110-111` reads `.components`. No parity gate compares vendor blocks with registry blocks. `BLOCKS` in `tooling/upstream/pull.mjs:76-87` only stages upstream blocks on a pull. Decision D3 covers how the removals are recorded.
4. **All 28 removed blocks have a preview file** (`apps/docs/components/preview/{login-02…05,signup-01…05,sidebar-01…16,dashboard-01,preview-03,onboarding-01}.tsx`), not only the ten the brief named. Their barrel exports are at `apps/docs/components/preview/index.tsx:107-146`.
5. **More references than the brief listed** (`git grep -P`; the brief's `-E …\b` pattern matches no `sidebar-NN` on macOS). They are `README.md:10` ("32 starter blocks"), `design.md:1075` and its docs copy `apps/docs/public/design.md:1075`, `AGENTS.md:75,80` (+ § Numbers, generated), `packages/design/skills/vegastack-design-system/SKILL.md:26` (package mirror), `references/components.md:6` in both skill copies (generated from the contracts), `packages/ui/upstream/exception-map.json:2` (`_note`), `apps/docs/package.json:25-28` (`@dnd-kit`), `packages/ui/vitest.config.ts:144` (names `@tanstack/react-table`, which stays), `tooling/design-lint.mjs:374,1539` (comments), `tooling/verify-token-references.mjs:120-128,190-191` (a regex naming `dashboard-01/components/data-table.tsx`), and `tooling/verify-component-contracts.mjs:1474` (blocks nav). History files are not touched: `packages/ui/CHANGELOG.md`, `apps/docs/content/docs/changelog.mdx`, `docs/ledger/**`, `docs/research/**`, `docs/audits/**` and `docs/plans/**`.
6. **`thesvg` is used only by removed blocks** in `packages/ui` (`package.json:63`; imported by `login-02…05`, `signup-02/04/05`). `@vegastack/design` keeps its own `thesvg` for `Icon`/`BrandIcon` (decision D2).
7. **Block tests cannot enable `color-contrast`.** Every block test passes `["color-contrast"]` to `expectNoA11yViolations` because the unit lane runs without compiled CSS (`packages/ui/test/a11y.ts:17-24`). Compiled contrast is proven in `packages/ui/test/contrast.browser.test.tsx`, whose `contrast.css` scans `../registry/ui/**` only. The brief's "axe-clean with `color-contrast` enabled" is met by adding each new block's page to that gate and `@source '../registry/blocks/**/*.tsx'` to `contrast.css` (decision D6).
8. **`ActionBar` has no `onOpenChange`.** It has `open?: boolean = true` (`action-bar.tsx:43,113`), which drives `data-active` and `inert`, plus `motion-dock-in/out` (:193). DS-77 reuses `open`, `inert` and the dock utilities, and adds `onOpenChange` to AudioPlayer, because the dock has a close button.
9. **`BoardColumn` has no `count` or `emptyLabel`.** It has `id`, `title`, `items`, `droppable?`, `lockedReason?` and `collapsed?` (:70-97). The count is a `Badge` of `items.length`, and the empty state is a hard-coded "No cards" (:431-440). DS-51's count is therefore a visible change (`🔧`).
10. **`formatShortcutKey` already exists, privately**, in `shortcut-overlay.tsx:35-37` over `MODIFIER_LABEL` (:24-32). DS-57 moves it into `use-platform.ts` and exports it.
11. **"404 - Not Found" is preview copy**, in `apps/docs/components/preview/empty.tsx:218`, not `registry/ui/empty.tsx`.
12. **`login-01` is an upstream block** (listed in the vendor manifest), so it is exempt from `verify-public-api-docs`. After DS-79 its source is ours, so its parts gain JSDoc, and its `meta.whenToUse` stops saying "upstream's Login 01 composition". It stays in `pull.mjs` `BLOCKS`, because pulls stage upstream for comparison only.
13. MessageScroller's primitive (`@shadcn/react@0.3.1`, `dist/message-scroller/index.d.ts`) exposes `defaultScrollPosition`, `autoScroll`, `scrollToMessage(id, opts)`, `useMessageScrollerVisibility()` → `{ currentAnchorId, visibleMessageIds }` and Item `messageId`. Our `message-scroller.tsx` re-exports the hooks (:136-144). This matches the brief.
14. Kept-block anchors: `app-shell-01/page.tsx:72-83` (hand-rolled stat cards), `board-01/components/board-view.tsx:140-182` (toolbar), and :170-181 (an uncontrolled List toggle nothing reads).

## Decisions MK makes on this plan

| ID  | Question                                                                                                                                                                                                                                                                                                                                             | Recommendation                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Remove the `@dnd-kit` engine** (`@dnd-kit/{core,modifiers,sortable,utilities}` from `packages/ui/package.json:39-42` and `apps/docs/package.json:25-28`, the engine identity in `verify-component-contracts.mjs:109` and `component-contracts.json:24987`, and the AGENTS.md:75 entry in the doctrine PR). This is a sanctioned-dependency change. | Remove it. `dashboard-01` is its only user, and `@atlaskit/pragmatic-drag-and-drop` stays the system's drag engine. If MK keeps it, only the block goes, and the packages and entry stay. |
| D2  | Drop `thesvg` from `packages/ui/package.json` (only removed blocks import it)                                                                                                                                                                                                                                                                        | Drop it. `@vegastack/design` keeps its own copy for `Icon`/`BrandIcon`, and no icon rule changes.                                                                                         |
| D3  | How removed upstream blocks are recorded: (a) delete them from `pull.mjs` `BLOCKS` with a comment naming DS-78, or (b) a new `excluded.json` `blocks` key plus a parity rule                                                                                                                                                                         | (a). No gate reads blocks today, so (b) would add tooling that enforces a list nobody else reads.                                                                                         |
| D4  | The contracts gate's Block wave canary (`expectedWaveMembers.Block`, the affected-tests fixture) moves from `dashboard-01` to a kept block                                                                                                                                                                                                           | `board-01`: an ours block that composes an engine-backed component.                                                                                                                       |
| D5  | The 68 `chart-*` blocks (out of scope here): keep them as they are, give them the same conformance pass later, or remove them                                                                                                                                                                                                                        | Keep them as they are. They are the chart docs galleries, not page references.                                                                                                            |
| D6  | Block contrast is proven in the compiled gate (`contrast.browser.test.tsx` + `contrast.css` `@source` of blocks), and the block unit test keeps the `a11y.ts` policy                                                                                                                                                                                 | Yes. It is the repo's existing compensating gate. A block unit test with contrast on would report false failures.                                                                         |
| D7  | Release cadence: five change PRs (removal, components, board, blocks on 00a/00e, blocks on 00b), each on its own `ship it`                                                                                                                                                                                                                           | Five PRs, so 00b's and 00a's consumers aren't held behind the largest one.                                                                                                                |

## Dependencies (which upstream PR must be on `main` first)

| Task                  | Waits for                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (removal)           | 00a merged (brief), D1–D4 answered                                                                                                           |
| 2 transcript          | 00e DS-07 (`Item` parts), 00a DS-68                                                                                                          |
| 3 audio dock          | none beyond 00a/00e                                                                                                                          |
| 4 bell/platform parts | 00e DS-04 (count rule)                                                                                                                       |
| 5 board               | 00a DS-69 (lane labels, `getItemLabel`), #139 task 1 (`LoadMore`) and task 3 (`RowActionsMenu`)                                              |
| 6–9 (PR 4)            | 00a DS-47 (Field), DS-19 (`AppShellPage`), DS-02; 00e DS-14 (`CardTitle`/`EmptyTitle` `render`), DS-63 (Alert live), DS-07; 00d DS-25, DS-29 |
| 10 full-page flow     | #139 task 15 (DS-76), 00a DS-23, DS-02                                                                                                       |
| 11–15 (PR 5)          | #139 PRs 1–3 (DS-30…DS-38), 00e DS-04, DS-05, DS-06, DS-12, DS-13, DS-16; task 2–5 here                                                      |
| 16 doctrine           | 00d's doctrine PR merged; lines ride its next doctrine PR                                                                                    |

## PR breakdown

Each component item carries the four artefacts (source, test with `expectNoA11yViolations` per distinct state, MDX, changeset). With them go its `registry.json` item (`meta.whenToUse`/`whenNotToUse`, `registryDependencies` as `@vegastack/<name>`), its contract record + `pnpm design:derived`, its preview + barrel, and its `meta.json` nav entry. Each block carries `packages/ui/registry/blocks/<name>/page.tsx` + `components/*.tsx` (relative imports only), `<name>.test.tsx` (mounts, shows its content, axe per state with the `a11y.ts` contrast policy), a `registry.json` `registry:block` item (files typed `registry:page`/`registry:component`, targets `app/<name>/…`), a top-level `blocks` contract record, `apps/docs/content/docs/blocks/<name>.mdx` (`registry`/`preview` frontmatter), a `<name>Demo` preview + barrel export, a `blocks/meta.json` entry, a case in `packages/ui/test/contrast.browser.test.tsx`, and a changeset. Every block follows 00d DS-73's block rules: `AppShellPage`/`PageHeader` where the page has them, one `h1`, real `<a href>`, container queries first, `dvh`/`svh`, sentence case with realistic content, and the DS-75 rhythm.

- **PR 1: removal** (task 1) · DS-78 · `🗑`, `@vegastack/ui` minor, `@vegastack/design` patch (the regenerated skill roster)
- **PR 2: components** (tasks 2–4) · DS-49, DS-77, DS-56/DS-57 parts · `🧩` transcript, `🔧` audio-player, notification-bell, use-platform, shortcut-overlay
- **PR 3: board** (task 5) · DS-51 · `🔧`
- **PR 4: blocks and examples on 00a/00e** (tasks 6–10) · DS-79, DS-53, DS-60, DS-59, DS-55 · `🧩` settings-02, status-pages-01; `🔧` login-01; `📚` stat, multi-step-form guide
- **PR 5: blocks on 00b** (tasks 11–15) · DS-52, DS-56, DS-57, DS-58, DS-80 · `🧩` list-page-01, notifications-01, command-search-01, review-split-01; `🔧` app-shell-01, board-01
- **Doctrine lines** (task 16), in 00d's next doctrine PR

## Tasks

- [x] **Task 1: DS-78 remove 28 non-conforming demo blocks (+ `@dnd-kit` per D1, `thesvg` per D2)**
  - Files — Delete: `packages/ui/registry/blocks/{login-02,login-03,login-04,login-05,signup-01,signup-02,signup-03,signup-04,signup-05,sidebar-01…sidebar-16,dashboard-01,preview-03,onboarding-01}/**`, `apps/docs/content/docs/blocks/<same>.mdx`, `apps/docs/components/preview/<same>.tsx` · Modify: `packages/ui/registry.json` (28 items), `packages/ui/component-contracts.json` (28 `blocks` records; `expectedCounts.blocks` 32→4, `totalRegistryItems`; `expectedWaveMembers.Block` → `["board-01"]` per D4; the `@dnd-kit` engine record :24987; the thesvg dep entries), `tooling/verify-component-contracts.mjs` (:109 `@dnd-kit` identity, :1112-1115 and :1127 Block roster, :1474 nav), `tooling/test/affected-tests.test.mjs` (:94-96 → `board-01/page.tsx` → `["board-01"]`), `tooling/upstream/pull.mjs` (:76-87 `BLOCKS` keeps `login-01` only + `preview`, `preview-02` as today, with a DS-78 comment, per D3), `packages/ui/upstream/ours.json` (:93 rationale; `onboarding-01` entry if listed), `packages/ui/upstream/exception-map.json` (`_note` mention), `apps/docs/components/preview/index.tsx` (:107-146), `apps/docs/lib/fixture-source.ts` (:15), `apps/docs/content/docs/blocks/meta.json` (regroup: `---Auth---` login-01 · `---Shell---` app-shell-01 · `---App pages---` settings-01, board-01 · `---Charts---` charts-*), `apps/docs/content/docs/guides/components.mdx` (:18, :167 → `list-page-01` + `app-shell-01`, landing in PR 5; until then `app-shell-01`), `apps/docs/content/docs/guides/quickstart.mdx` (:218, :286), `apps/docs/content/docs/guides/migrating-shadcn-reset.mdx` (:753-756 → the `item.mdx` "Checklist" example; :1096), `apps/docs/content/docs/foundations/motion.mdx` (:35), `apps/docs/content/internal/internal-projects.mdx` (:44), `apps/docs/content/docs/components/item.mdx` + `apps/docs/components/preview/item.tsx` (new "Checklist" example: `ItemGroup` of `Item size="sm"` + `Checkbox`/`StatusIcon`), `tooling/design-lint.mjs` (:278-290 exemptions, :459-463, comments :374, :1539), `tooling/verify-shadcn-consume.mjs` (:137, :621 "dashboard-block" rule → `board-01`), `tooling/verify-design-lint-structural.mjs` (:463 comment), `tooling/verify-token-references.mjs` (:120-128, :190-191), `tooling/registry-header.mjs` (:181 comment), `packages/ui/package.json` (`@dnd-kit/*` :39-42 per D1, `thesvg` :63 per D2), `apps/docs/package.json` (:25-28 per D1), `pnpm-lock.yaml`, `.changeset/remove-demo-blocks.md` (`🗑`, names all 28 and where each recipe went). Generated by `pnpm registry:build` / `pnpm design:derived`: `apps/docs/public/r/*`, `integrity-manifest.json`, `docs/ledger/component-matrix.md`, `skills/public/vegastack-design-system/references/components.md` + its `packages/design/skills/**` mirror (so the changeset also bumps `@vegastack/design` patch).
  - Rev 2 additions (24-09-2026). **Per (kmanojkumar)'s PR 1 instruction** ("Update every reference (… skills — both skill copies, README, design.md, AGENTS.md, token-reference check)"; "Only this removal PR; the rest of #140 waits for #139"): the removal's doctrine lines land here, not in task 16 — `AGENTS.md` (the `@dnd-kit` primitive entry, the count, the `dashboard-01` sonner clause), `design.md` :1075 + `pnpm design:sync`, `skills/public/vegastack-design-system/SKILL.md` :26 + its package mirror; `README.md` and § Numbers regenerate. Task 1 therefore ships before 00a/00d merge; it overlaps them only in contract-owned and generated files (`component-contracts.json`, `registry.json`, `public/r`, the integrity manifest, the doctrine files), so whichever lands second rebases and regenerates. **Implementer ruling (not an MK decision)**: the two `[docs](…/blocks/dashboard-01)` links in `/CHANGELOG.md` are unlinked (text kept) and the docs page re-synced, because `lint:links` fails on them; precedent #169 (76fa8d317) did the same for Sonner. MK may reverse it. `docs/research/design-md-audit/*.json` are `design:derived` outputs, not history.
  - Interfaces — Produces: a registry with 4 non-chart blocks (`login-01`, `app-shell-01`, `board-01`, `settings-01`) and no import of a removed path. Consumed by tasks 6–15 (nav groups) and task 16 (the new blocks' roster).
  - Steps: delete and edit → verify: `git grep -nP "login-0[2-5]|signup-0[1-5]|sidebar-(0[1-9]|1[0-6])\b|dashboard-01|preview-03|onboarding-01" -- . ':!vendor' ':!**/CHANGELOG.md' ':!apps/docs/content/docs/changelog.mdx' ':!docs'` lists only the migration guide's history lines (`migrating-shadcn-reset.mdx` § 8.9 and § 11) and the changeset; `pnpm install`; `pnpm registry:build && git status --short` (only intended changes); `pnpm design:derived && pnpm design:derived:check`; `node tooling/verify-component-contracts.mjs`; `pnpm upstream:check && pnpm upstream:selftest`; `pnpm test:tooling`; `node tooling/content-lint.mjs`; `pnpm -F @vegastack/docs lint:links`; `pnpm -F @vegastack/docs typecheck`; `pnpm lint` → commit `refactor(blocks): remove 28 non-conforming demo blocks (DS-78)`. Stop condition: a gate that special-cases a removed block in a way not listed here means stop, list it, and extend this task. No dangling exemption stays.

- [ ] **Task 2: DS-49 `transcript` (new, ours) on MessageScroller's primitive**
  - Files — Create: `packages/ui/registry/ui/transcript.tsx`, `packages/ui/registry/ui/transcript.test.tsx`, `apps/docs/components/preview/transcript.tsx`, `apps/docs/content/docs/components/transcript.mdx` (Usage, Anatomy, Examples "With audio", "Search", "Read-only", API, Accessibility keyboard table, Do/Don't vs MessageScroller and Timeline), `.changeset/transcript.md` (`🧩`) · Modify: `packages/ui/upstream/ours.json` (`items.transcript` + counts), `packages/ui/registry.json` (new item; `registryDependencies` `@vegastack/message-scroller`, `@vegastack/item`, `@vegastack/button`, `@vegastack/panel-search`, `@vegastack/use-announcer`, `@vegastack/skeleton`, `@vegastack/media-player-controls`), `packages/ui/component-contracts.json` (component record; `expectedCounts.components` +1), `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/components/meta.json` (Chat & Communication, after `message-scroller`), `packages/ui/test/geometry.browser.test.tsx` (transcript list fixture)
  - Interfaces — Consumes: `MessageScroller*` parts and `useMessageScroller`/`useMessageScrollerVisibility` from `@/components/ui/message-scroller`, `formatDefaultTime` (`media-player-controls.tsx:170`), `useAnnouncer` · Produces: `export type TranscriptSegment = { id: string; start: number; end?: number; speaker: string; text: string }`; `export function Transcript(props: { segments: TranscriptSegment[]; speakerName?: (id: string) => string; currentTime?: number; onSeek?: (seconds: number) => void; follow?: boolean; defaultFollow?: boolean; onFollowChange?: (f: boolean) => void; query?: string; onQueryChange?: (q: string) => void; formatTime?: (s: number) => string; loading?: boolean; emptyState?: React.ReactNode; backLabel?: string /* "Back to current line" */; "aria-label": string; children: React.ReactNode })`; `export function TranscriptSearch(props: { label?: string /* "Search transcript" */ })`; `export function TranscriptList(props: { className?: string })`. Each row is an `Item` with `messageId`, a speaker, a timestamp `Button` "Play from 12:04" (text when there is no `onSeek`) and text. The active row (binary search on `start`) gets `aria-current="true"`. Follow uses `scrollToMessage(activeId, { align: "center" })`. A user scroll pauses follow, and the back button shows only while the active id is not in `visibleMessageIds`.
  - Steps: tests first →
    ```tsx
    test("seek fires with the segment start and focus stays put on time updates", async () => {
      const onSeek = vi.fn();
      const screen = await render(
        <Transcript
          aria-label="Transcript"
          segments={segs}
          currentTime={0}
          onSeek={onSeek}
        >
          <TranscriptList />
        </Transcript>,
      );
      await screen.getByRole("button", { name: "Play from 0:12" }).click();
      expect(onSeek).toHaveBeenCalledWith(12);
      const focused = document.activeElement;
      await screen.rerender(
        <Transcript
          aria-label="Transcript"
          segments={segs}
          currentTime={40}
          onSeek={onSeek}
        >
          <TranscriptList />
        </Transcript>,
      );
      expect(document.activeElement).toBe(focused);
      await expect
        .element(screen.getByText(segs[2].text))
        .toHaveAttribute("aria-current", "true"); // closest Item
    });
    ```
    plus: follow pauses on wheel/keyboard/touch and resumes from the button, the button hides while the active row is visible, search wraps `<mark>` and announces "{i} of {n}"/"No matches", Enter/Shift+Enter move, empty and loading, no `onSeek` means no buttons, "Now playing" changes once per segment, 2,000 segments stay under 16 ms per `currentTime` update (browser test), axe per state → run `pnpm check:component transcript`, expect FAIL (module missing) → implement → `pnpm registry:build && pnpm design:derived && pnpm check:component transcript` PASS; `node tooling/verify-public-api-docs.mjs` → commit `feat(transcript): timestamped speaker list on MessageScroller (DS-49)`. Stop condition: if `autoScroll={false}` still pins on append, or start positioning fights follow, stop and ask. No scroll logic of our own, no virtualization engine.

- [ ] **Task 3: DS-77 AudioPlayer dock options**
  - Files — Modify: `packages/ui/registry/ui/audio-player.tsx` (`src` :124 widened; `docked`, `open`, `onOpenChange`, `closeLabel`, `loading`, `error`, `loadingLabel`, `retryLabel`, `actionsRef`; `ref` stays the root div :154/:252), `packages/ui/registry/ui/audio-player.test.tsx`, `apps/docs/content/docs/components/audio-player.mdx` ("Docked with close", "Lazy source", "Seek from outside" with both `mediaRef` and `actionsRef`, Do/Don't vs ActionBar), `apps/docs/components/preview/audio-player.tsx`, `packages/ui/test/geometry.browser.test.tsx` (dock at the column bottom + safe-area fixture), `packages/ui/registry.json` (meta), `packages/ui/component-contracts.json` (states: hidden/open/loading/error; motion `motion-dock-in/out`), `.changeset/audio-player-dock.md` (`🔧`)
  - Interfaces — Produces: `AudioPlayerProps.src: string | (() => Promise<string>)` (a function resolves once, on first play), `docked?: boolean` (sticky bottom of its scroll column, `border bg-popover shadow-md`, safe-area padding, `role="region"` named by `label`, not a toolbar), `open?: boolean`, `onOpenChange?: (open: boolean) => void` (hidden = `inert` + `data-[active=false]:motion-dock-out`), `closeLabel?: string` ("Close player"; the close pauses, calls `onOpenChange(false)` and returns focus to the opener), `loading?: boolean`, `error?: React.ReactNode` (`role="alert"` `-text` ink + "Try again"), `loadingLabel?: string` ("Loading audio…"), `retryLabel?: string`, `actionsRef?: React.Ref<AudioPlayerActions>`; `export type AudioPlayerActions = { seek(seconds: number, opts?: { play?: boolean }): void; play(): void; pause(): void }` (a seek before metadata is queued and applied on `loadedmetadata`). Escape does not close. Consumed by task 14 and Regent 04.
  - Steps: tests first →
    ```tsx
    test("a lazy src resolves once on first play and a queued seek applies on metadata", async () => {
      const src = vi.fn(async () => "/a.mp3");
      const actions = React.createRef<AudioPlayerActions>();
      const screen = await render(
        <AudioPlayer
          label="Meeting recording"
          docked
          open
          src={src}
          actionsRef={actions}
        />,
      );
      actions.current!.seek(42, { play: true });
      await screen.getByRole("button", { name: "Play" }).click();
      expect(src).toHaveBeenCalledOnce();
      const audio = screen.container.querySelector("audio")!;
      audio.dispatchEvent(new Event("loadedmetadata"));
      expect(audio.currentTime).toBe(42);
      expect(screen.container.querySelector('[role="toolbar"]')).toBeNull();
    });
    ```
    plus: open/close with focus return, close pauses, loading announced once, error + retry, `ref` is still the root, `inert` while hidden, Tab reaches every control, axe open/loading/error → FAIL → implement → `pnpm check:component audio-player` PASS → commit `feat(audio-player): docked, closable, lazy source, imperative seek (DS-77)`. Stop condition: if making the dock focus-safe needs changes to `media-player-controls` slider keys, stop and ask.

- [ ] **Task 4: DS-56/DS-57 parts: `NotificationDot`, bell `countLabel`, `formatShortcutKey`/`formatShortcut`**
  - Files — Modify: `packages/ui/registry/ui/notification-bell.tsx` (dot :155 → exported `NotificationDot`, `tone`; `countLabel` at :96-102), `packages/ui/registry/ui/notification-bell.test.tsx`, `packages/ui/registry/ui/use-platform.ts` (exports), `packages/ui/registry/ui/use-platform.test.ts` (create if absent + contract `testFiles`), `packages/ui/registry/ui/shortcut-overlay.tsx` (drop `MODIFIER_LABEL` :24-32 and the private `formatShortcutKey` :35-37; import from `use-platform`), `packages/ui/registry/ui/shortcut-overlay.test.tsx`, `apps/docs/content/docs/components/notification-bell.mdx` ("Shared unread dot", "Count label"), `apps/docs/components/preview/notification-bell.tsx`, `packages/ui/registry.json` (shortcut-overlay `registryDependencies` + `@vegastack/use-platform`), `packages/ui/component-contracts.json` (three records), `.changeset/bell-dot-shortcut-format.md` (`🔧`: the dot's default tone changes from destructive to primary)
  - Interfaces — Produces: `export function NotificationDot(props: { tone?: "default" | "destructive"; className?: string })` (`data-slot="notification-bell-dot"`, `aria-hidden`, default `bg-primary`); `NotificationBellProps.countLabel?: (n: number) => string` (default "{n} unread"); `export function formatShortcutKey(key: string, os: PlatformOS): string` and `export function formatShortcut(keys: string[], os: PlatformOS): string` (⌘ on macOS, Ctrl elsewhere). Consumed by tasks 12, 13 and 15.
  - Steps: tests first →
    ```ts
    test.each([
      ["mod", "mac", "⌘"],
      ["mod", "windows", "Ctrl"],
      ["shift", "mac", "⇧"],
    ])("formatShortcutKey(%s, %s)", (k, os, out) => {
      expect(formatShortcutKey(k, os as PlatformOS)).toBe(out);
    });
    ```
    plus: ShortcutOverlay output is unchanged (snapshot of its rendered key labels before and after), the dot's class is `bg-primary` by default and `bg-destructive` with `tone="destructive"`, the bell name uses `countLabel`, axe → FAIL → implement → `pnpm check:component notification-bell && pnpm check:component use-platform && pnpm check:component shortcut-overlay` PASS → commit `feat: shared unread dot, bell count label, exported shortcut formatting (DS-56, DS-57)`

- [ ] **Task 5: DS-51 Board paged lanes, states, card links and actions**
  - Files — Modify: `packages/ui/registry/ui/board.tsx` (`BoardColumn` :70-97; count Badge; empty :431-440; card render :517; `defaultCollapsed`), `packages/ui/registry/ui/board.test.tsx`, `apps/docs/content/docs/components/board.mdx` ("Paged lanes", "Cards as links with actions"), `apps/docs/components/preview/board.tsx`, `packages/ui/test/geometry.browser.test.tsx` (lane footer fixture), `packages/ui/registry.json` (+ `@vegastack/load-more`, `@vegastack/data-table-parts`), `packages/ui/component-contracts.json`, `.changeset/board-paged-lanes.md` (`🔧`: the lane count becomes the muted count)
  - Interfaces — Consumes: `LoadMoreState`/`LoadMore`, `RowAction`/`RowActionsMenu` (#139 tasks 1 and 3), 00a DS-69 lane `label` + `getItemLabel` · Produces: `BoardColumn.count?: number` (muted `count ?? items.length`), `loadMore?: LoadMoreState`, `loading?: boolean` (skeleton cards, `aria-busy`), `emptyState?: React.ReactNode`, `defaultCollapsed?: boolean` (`collapsed` kept as its alias); `BoardProps<T>.countLabel?: (n: number) => string`, `getItemHref?: (item: T) => string | undefined`, `itemLinkRender?: React.ReactElement` (the DataList convention), `getItemActions?: (item: T) => RowAction[]` (merged with Move in one ⋯ menu). The sideways scroll (:353) stays.
  - Steps: tests first →
    ```tsx
    test("lane count shows the total, not the loaded rows", async () => {
      const screen = await render(
        <Board
          columns={[
            {
              id: "open",
              label: "Open",
              items: twoTasks,
              count: 14,
              loadMore: { hasMore: true, onLoadMore: () => {} },
            },
          ]}
          getItemId={(t) => t.id}
          getItemLabel={(t) => t.title}
          renderCard={(t) => t.title}
          onMove={() => {}}
        />,
      );
      await expect
        .element(screen.getByRole("region", { name: "Open, 14 tasks" }))
        .toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Load more" }))
        .toBeInTheDocument();
    });
    ```
    plus: lane Load more appends into that lane, drag between lanes with a partial lane, loading and empty lanes, a card link opens with modifiers, the card menu holds host actions + Move, no nested interactive (axe `nested-interactive`), axe → FAIL → implement → `pnpm check:component board` PASS → commit `feat(board): paged lanes, lane states, card links and actions (DS-51)`

- [ ] **Task 6: DS-79 `login-01` rebuilt to the rulebook**
  - Files — Modify: `packages/ui/registry/blocks/login-01/page.tsx`, `packages/ui/registry/blocks/login-01/components/login-form.tsx`, `packages/ui/registry/blocks/login-01/login-01.test.tsx`, `apps/docs/content/docs/blocks/login-01.mdx` ("Sign up" and "Forgot password" sections on the same frame), `apps/docs/components/preview/login-01.tsx`, `packages/ui/registry.json` (item: `registryDependencies` + `@vegastack/password-input`, `@vegastack/alert`; `meta.whenToUse` "Sign-in page for an app"), `packages/ui/component-contracts.json` (record states), `packages/ui/test/contrast.browser.test.tsx` + `packages/ui/test/contrast.css` (`@source '../registry/blocks/**/*.tsx'`, D6), `.changeset/login-01-rebuilt.md` (`🔧`)
  - Interfaces — Consumes: 00a DS-47 Field wiring, 00e DS-14 `CardTitle render`, DS-63 `Alert live`, `PasswordInput` · Produces: a centred `Card` (`min-h-svh`), `CardTitle render={<h1 />}` "Sign in", Email (`autoComplete="email"`), Password (`autoComplete="current-password"`), a "Forgot password?" `<a href="/forgot-password">`, `FieldError` per field, a form-level `Alert live`, and `Button type="submit" loading` "Sign in"
  - Steps: tests first →
    ```tsx
    test("login-01 has one h1 and announces the form error only after submit", async () => {
      const screen = await render(<Login01Page />);
      expect(document.querySelectorAll("h1")).toHaveLength(1);
      expect(document.querySelector('[role="alert"]')).toBeNull();
      await screen.getByRole("button", { name: "Sign in" }).click();
      await expect.element(screen.getByRole("alert")).toBeInTheDocument();
      await expectNoA11yViolations(document.body, ["color-contrast"]);
    });
    ```
    plus: labels bound, submit loading keeps width, and the contrast gate case in both themes → FAIL → implement → `pnpm registry:build && pnpm check:component login-01 && pnpm --filter @vegastack/ui exec vitest run test/contrast.browser.test.tsx` PASS; `node tooling/verify-public-api-docs.mjs` (login-01 parts now carry JSDoc) → commit `feat(login-01): rebuild the sign-in block to the rulebook (DS-79)`

- [ ] **Task 7: DS-53 block `settings-02` (settings hub)**
  - Files — Create: `packages/ui/registry/blocks/settings-02/page.tsx`, `packages/ui/registry/blocks/settings-02/settings-02.test.tsx`, `apps/docs/content/docs/blocks/settings-02.mdx`, `apps/docs/components/preview/settings-02.tsx`, `.changeset/settings-02.md` (`🧩`) · Modify: `packages/ui/registry.json`, `packages/ui/component-contracts.json` (`blocks` record, `starter-block`; `expectedCounts.blocks` +1), `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/blocks/meta.json` (App pages), `packages/ui/test/contrast.browser.test.tsx`
  - Interfaces — Consumes: `AppShellPage` (00a DS-19), `PageHeader`, `SettingsSection`, `Item`/`ItemContent`/`ItemTitle`/`ItemDescription`/`ItemActions`, `Badge` · Produces: per section a `grid gap-3 @sm:grid-cols-2 @4xl:grid-cols-3` of `Item variant="outline" render={<a href />}` tiles with a one-fact description and an `aria-hidden` chevron. A non-link "TBD" tile (`Badge variant="outline"`) is not focusable.
  - Steps: tests first →
    ```tsx
    test("each tile is one link named by its title and described by its fact", async () => {
      const screen = await render(<Settings02Page />);
      const members = screen.getByRole("link", { name: "Members" });
      await expect
        .element(members)
        .toHaveAccessibleDescription("8 active · 1 invited");
      expect(screen.container.querySelectorAll("a button, a a")).toHaveLength(
        0,
      );
    });
    ```
    plus: the TBD tile is out of the tab order, 1 column at 390px and 3 at 1440px (geometry fixture), axe → FAIL → implement → `pnpm registry:build && pnpm check:component settings-02` PASS → commit `feat(blocks): settings-02 settings hub (DS-53)`

- [ ] **Task 8: DS-60 block `status-pages-01` + Empty preview copy**
  - Files — Create: `packages/ui/registry/blocks/status-pages-01/page.tsx`, `packages/ui/registry/blocks/status-pages-01/components/{not-found-page,forbidden-page,error-page}.tsx`, `packages/ui/registry/blocks/status-pages-01/status-pages-01.test.tsx`, `apps/docs/content/docs/blocks/status-pages-01.mdx`, `apps/docs/components/preview/status-pages-01.tsx`, `.changeset/status-pages-01.md` (`🧩`) · Modify: `apps/docs/components/preview/empty.tsx` (:218 "404 - Not Found" → "Page not found"), `packages/ui/registry.json`, `packages/ui/component-contracts.json`, `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/blocks/meta.json`, `packages/ui/test/contrast.browser.test.tsx`
  - Interfaces — Consumes: `Empty`, `EmptyTitle render={<h1 />}` (00e DS-14), `EmptyMedia variant="icon"`, `buttonVariants` on a link (00d DS-25), `CopyButton` · Produces: `NotFoundPage`, `ForbiddenPage` and `ErrorPage({ digest?: string; onRetry: () => void; standalone?: boolean })` with the brief's copy. The error icon is `TriangleAlert` in `text-destructive-text`. The footnote "Reference: {digest}" + `CopyButton aria-label="Copy reference"` is omitted without a digest. The in-shell mode is `min-h-[60svh]`, and standalone is `min-h-svh`.
  - Steps: tests first →
    ```tsx
    test("error page omits the reference without a digest", async () => {
      const screen = await render(<ErrorPage onRetry={() => {}} />);
      await expect
        .element(
          screen.getByRole("heading", {
            level: 1,
            name: "This page didn't load",
          }),
        )
        .toBeInTheDocument();
      expect(screen.container.textContent).not.toContain("Reference:");
    });
    ```
    plus: one `h1` per page, the icon uses `-text` ink, axe per page and mode → FAIL → implement → `pnpm registry:build && pnpm check:component status-pages-01 && pnpm check:component empty` PASS → commit `feat(blocks): status-pages-01 for 404, 403 and errors (DS-60)`

- [ ] **Task 9: DS-59 "Linked stat tiles" docs example**
  - Files — Modify: `apps/docs/content/docs/components/stat.mdx` ("Linked stat tiles"), `apps/docs/components/preview/stat.tsx` (new `statLinkedTiles` export), `apps/docs/components/preview/index.tsx`, `.changeset/stat-linked-tiles.md` (`📚`)
  - Interfaces — Consumes: `Item variant="outline" render={<a href />}`, `ItemContent`, `Stat size="lg"`, `StatLabel`, `StatValue`, `Skeleton` · Produces: the preview `statLinkedTiles` (a `grid gap-3 grid-cols-2 @3xl:grid-cols-4` of links, label first, `tabular-nums` in the regular font, no delta or sparkline), which task 15 reuses
  - Steps: edit → verify: `pnpm --filter @vegastack/ui exec vitest run test/geometry.browser.test.tsx -t statLinkedTiles`; the docs preview test mounts it and axe passes; each tile is a link named "Overdue tasks 3"; `node tooling/content-lint.mjs`; `pnpm upstream:check` (stat is ours, so no variant-coverage constraint) → commit `docs(stat): linked stat tiles example (DS-59)`

- [ ] **Task 10: DS-55 "Full-page flow" docs example**
  - Files — Modify: `apps/docs/content/docs/guides/multi-step-form.mdx` ("Full-page flow"), `apps/docs/components/preview/multi-step-form.tsx` (new `multiStepFormFullPage` export), `apps/docs/components/preview/index.tsx`, `.changeset/multi-step-form-full-page.md` (`📚`)
  - Interfaces — Consumes: `MultiStepForm step onStepChange(id, { replace })` (#139 task 15), `MultiStepFormActions sticky="narrow"` (00a DS-23), `PageHeader backRender` (00a DS-02), `AppShellPage`, `PropertyList`, `Item size="sm"` · Produces: the preview `multiStepFormFullPage`: controlled `step` from a route stand-in, `navigable="auto" dirty layout="flow"` in `grid md:grid-cols-[14rem_1fr]`, a vertical nav, a Review step with one `PropertyList` per step and "Change" links, and a checklist with lucide Check/X in `-text` ink. Hash `urlSync` is shown only as the alternative.
  - Steps: edit → verify: the preview test mounts it, clicks "Change" and asserts the route stand-in received `(id, { replace: false })`; geometry fixture: sticky actions at 390px; axe; `node tooling/content-lint.mjs` → commit `docs(multi-step-form): full-page flow example (DS-55)`

- [ ] **Task 11: DS-52 block `list-page-01` (grid | list view)**
  - Files — Create: `packages/ui/registry/blocks/list-page-01/page.tsx`, `packages/ui/registry/blocks/list-page-01/components/{list-toolbar,list-view,grid-view,list-empty}.tsx`, `packages/ui/registry/blocks/list-page-01/list-page-01.test.tsx`, `apps/docs/content/docs/blocks/list-page-01.mdx` (with the `sessionStorage` view/filter recipe and the "preset route" recipe), `apps/docs/components/preview/list-page-01.tsx`, `.changeset/list-page-01.md` (`🧩`) · Modify: `packages/ui/registry.json`, `packages/ui/component-contracts.json`, `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/blocks/meta.json`, `apps/docs/content/docs/guides/components.mdx` + `guides/quickstart.mdx` (starter example → `list-page-01` + `app-shell-01`), `packages/ui/test/contrast.browser.test.tsx`
  - Interfaces — Consumes: `AppShellPage`, `PageHeader`, `FilterBar searchPlacement="start"` + `search.onValueCommitted`, `FilterBarFacet`, `ToggleGroup deselectable={false}` (00e DS-16), `DataList getRowHref rowLinkRender rowActionsColumn loadMore sections`, `Item`, `ItemGroup`, `Badge`, `Empty` (#139 tasks 1–4, 8–9) · Produces: a framework-neutral page with a `useState` stand-in. Mine | Team and Grid | List toggles (items `aria-label` "Grid"/"List"). The list view has two-line primary cells, `tabular-nums` numbers and `mobile` on every column. The grid view has per-category `h2` in the section face over an `ItemGroup` of whole-tile links. There are three empty tiers: own-empty (with a read-only variant), "No matches" + "Clear filters", and "Couldn't load customers." + "Try again".
  - Steps: tests first →
    ```tsx
    test("grid and list show the same records and the view toggle never empties", async () => {
      const screen = await render(<ListPage01 />);
      const listNames = [...document.querySelectorAll("tbody a")].map(
        (a) => a.textContent,
      );
      await screen.getByRole("radio", { name: "Grid" }).click();
      const gridNames = [
        ...document.querySelectorAll(
          '[data-slot="item"] a, a[data-slot="item"]',
        ),
      ].map((a) => a.textContent?.split("\n")[0]);
      expect(new Set(gridNames)).toEqual(new Set(listNames));
      await screen.getByRole("radio", { name: "Grid" }).click();
      await expect
        .element(screen.getByRole("radio", { name: "Grid" }))
        .toBeChecked();
    });
    ```
    plus: rows and tiles are single links, Load more appends, each empty tier renders its copy, no overflow at 320px (geometry), axe per tier and view → FAIL → implement → `pnpm registry:build && pnpm check:component list-page-01` PASS → commit `feat(blocks): list-page-01 with grid and list views (DS-52)`. Stop condition: a part missing from 00a/00b means stop and add it to the right issue. No local primitive in the block.

- [ ] **Task 12: DS-56 block `notifications-01`**
  - Files — Create: `packages/ui/registry/blocks/notifications-01/page.tsx`, `packages/ui/registry/blocks/notifications-01/components/{inbox-sheet,inbox-row}.tsx`, `packages/ui/registry/blocks/notifications-01/notifications-01.test.tsx`, `apps/docs/content/docs/blocks/notifications-01.mdx`, `apps/docs/components/preview/notifications-01.tsx`, `.changeset/notifications-01.md` (`🧩`) · Modify: `packages/ui/registry.json`, `packages/ui/component-contracts.json`, `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/blocks/meta.json`, `packages/ui/test/contrast.browser.test.tsx`
  - Interfaces — Consumes: `SidebarMenuButton badge badgeLabel` (00e DS-04), `NotificationBell countLabel` + `NotificationDot` (task 4), `Sheet`/`SheetContent size`/`SheetHeader`/`SheetAction`/`SheetBody` (00e DS-13), `ToggleGroup`, `ItemGroupLabel` (00e DS-07), `RelativeTime` (00a DS-11/DS-68), `LoadMore label="Load older"`, `useAnnouncer` · Produces: an Inbox sheet with All | Unread, Today / Earlier groups of `Item size="sm" render={<a href />}` rows (unread = dot + `font-medium` + sr-only "Unread"), "Mark all read" announced once, and the empty/error/skeleton states from the brief
  - Steps: tests first →
    ```tsx
    test("bell and sidebar row share one name, and mark-all announces once", async () => {
      const screen = await render(<Notifications01 />);
      expect(
        screen.getByRole("button", { name: "Inbox, 3 unread" }).elements()
          .length,
      ).toBeGreaterThan(0);
      await screen
        .getByRole("button", { name: "Inbox, 3 unread" })
        .first()
        .click();
      await screen.getByRole("button", { name: "Mark all read" }).click();
      await expect
        .element(screen.getByRole("status"))
        .toHaveTextContent("Marked all read");
    });
    ```
    plus: rows keep the link role inside the group, focus returns to the trigger on close, All/Unread never empty, the dot's class is the primary token, axe empty/unread/error/loading → FAIL → implement → `pnpm registry:build && pnpm check:component notifications-01` PASS → commit `feat(blocks): notifications-01 inbox sheet (DS-56)`

- [ ] **Task 13: DS-57 block `command-search-01`**
  - Files — Create: `packages/ui/registry/blocks/command-search-01/page.tsx`, `packages/ui/registry/blocks/command-search-01/components/{command-search,search-stub}.tsx`, `packages/ui/registry/blocks/command-search-01/command-search-01.test.tsx`, `apps/docs/content/docs/blocks/command-search-01.mdx`, `apps/docs/components/preview/command-search-01.tsx`, `.changeset/command-search-01.md` (`🧩`) · Modify: `packages/ui/registry.json`, `packages/ui/component-contracts.json`, `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/blocks/meta.json`, `packages/ui/test/contrast.browser.test.tsx`
  - Interfaces — Consumes: `CommandDialog size="lg"`, `CommandLoading`, `CommandFooter` (00e DS-06, API-18), `ItemTitle`/`ItemDescription` (API-19), `ToggleGroup wrap size="sm"`, `KbdGroup`, `formatShortcut` (task 4) · Produces: a palette with `shouldFilter={false}`, scope chips as a separate Tab stop, Alt+←/→ to switch scope from the input (re-query, keep the query), recents when empty, per-type groups, "No results", an error line + "Try again", footer hints built with `formatShortcut` and hidden below `sm`, ⌘/Ctrl+Enter opening the selected href in a new tab, and a stub `search(query: string, scope: string, signal: AbortSignal): Promise<SearchResult[]>`
  - Steps: tests first →
    ```tsx
    test("changing scope re-queries and keeps the query", async () => {
      const search = vi.fn(async () => []);
      const screen = await render(
        <CommandSearch01 search={search} defaultOpen />,
      );
      await userEvent.type(screen.getByRole("combobox"), "sky");
      await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(search).toHaveBeenLastCalledWith(
        "sky",
        "meetings",
        expect.any(AbortSignal),
      );
      await expect.element(screen.getByRole("combobox")).toHaveValue("sky");
    });
    ```
    plus: the listbox role only with options, the ⌘↵ path, the result count announced once per settle, axe loading/empty/results/error → FAIL → implement → `pnpm registry:build && pnpm check:component command-search-01` PASS → commit `feat(blocks): command-search-01 palette (DS-57)`

- [ ] **Task 14: DS-58 block `review-split-01`**
  - Files — Create: `packages/ui/registry/blocks/review-split-01/page.tsx`, `packages/ui/registry/blocks/review-split-01/components/review-split.tsx`, `packages/ui/registry/blocks/review-split-01/review-split-01.test.tsx`, `apps/docs/content/docs/blocks/review-split-01.mdx`, `apps/docs/components/preview/review-split-01.tsx`, `.changeset/review-split-01.md` (`🧩`) · Modify: `packages/ui/registry.json`, `packages/ui/component-contracts.json`, `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/blocks/meta.json`, `packages/ui/test/geometry.browser.test.tsx` (boundary-width fixture), `packages/ui/test/contrast.browser.test.tsx`
  - Interfaces — Consumes: `useContainerWidth` (`data-table-parts.tsx:345`), `Tabs`/`TabsList variant="line"` (00e DS-12), `Transcript` (task 2), `AudioPlayer docked` (task 3) · Produces: one measure (container `@container/review` + `useContainerWidth` at 56rem; `serverFallback` = narrow), wide = `grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]` with a sticky right pane (`max-h-[calc(100dvh-var(--review-split-offset))]`), narrow = `Tabs` over the same once-mounted panels ("Summary · Action items (N) · Transcript"), and the docked AudioPlayer at the end of the left column
  - Steps: tests first →
    ```tsx
    test("layout and mode switch together at the boundary", async () => {
      const screen = await render(
        <div style={{ width: 1000 }}>
          <ReviewSplit01 />
        </div>,
      );
      expect(document.querySelector('[role="tablist"]')).toBeNull();
      (screen.container.firstElementChild as HTMLElement).style.width = "800px";
      await expect
        .poll(() => document.querySelector('[role="tablist"]'))
        .not.toBeNull();
      expect(
        document.querySelectorAll('[data-slot="review-split-panel"]'),
      ).toHaveLength(3);
    });
    ```
    plus: panel state is kept across a switch (no remount), the right pane scrolls independently, no overflow at 320px, axe both modes → FAIL → implement → `pnpm registry:build && pnpm check:component review-split-01` PASS → commit `feat(blocks): review-split-01 two-pane review (DS-58)`. Stop condition: if the measurement flashes the wrong mode on hydration, stop and ask. Don't switch one half to a viewport query.

- [ ] **Task 15: DS-80 modernise `app-shell-01` and `board-01`**
  - Files — Modify: `packages/ui/registry/blocks/app-shell-01/page.tsx` (:72-83 stats → the `statLinkedTiles` recipe; `text-start`), `packages/ui/registry/blocks/app-shell-01/components/app-sidebar.tsx` (Search row with `Kbd` from `formatShortcut`, Inbox `badge`/`badgeLabel`, `SidebarGroupLabel` groups, a collapsible "Coming soon" group, `aria-current`, `NavUser` footer with the theme `DropdownMenuRadioGroup`, the workspace button as a real menu trigger), `packages/ui/registry/blocks/app-shell-01/app-shell-01.test.tsx`, `packages/ui/registry/blocks/board-01/page.tsx`, `packages/ui/registry/blocks/board-01/components/board-view.tsx` (:140-182 toolbar → `FilterBar` + a facet; drop the dead List toggle :170-181 and `w-40`/`sm:w-64`; `Board` with lane `label`, `count`, `loadMore`, `getItemHref`, `getItemActions`; a "No matches" state), `packages/ui/registry/blocks/board-01/board-01.test.tsx`, `apps/docs/content/docs/blocks/app-shell-01.mdx` (shows `SidebarStateScript`), `apps/docs/content/docs/blocks/board-01.mdx`, both previews, `packages/ui/registry.json` (both items' deps + `whenToUse`), `packages/ui/component-contracts.json`, `apps/docs/content/docs/blocks/meta.json` (final groups: Auth · Shell · App pages · Charts), `packages/ui/test/contrast.browser.test.tsx`, `.changeset/app-shell-board-blocks.md` (`🔧`)
  - Interfaces — Consumes: tasks 4, 5, 9; 00e DS-04, DS-05; 00d DS-26 · Produces: `app-shell-01` as the one shell and sidebar reference (carrying the `sidebar-02` collapsible group and the `sidebar-07` NavUser recipes removed in task 1), and `board-01` as the board page reference
  - Steps: tests first →
    ```tsx
    test("app-shell-01 has landmarks, a skip link and one h1", async () => {
      await render(<AppShell01Page />);
      expect(document.querySelectorAll("h1")).toHaveLength(1);
      expect(document.querySelector("nav")).not.toBeNull();
      expect(
        document.querySelector(
          'a[href="#main"], a[data-slot="app-shell-skip-link"]',
        ),
      ).not.toBeNull();
      expect(document.querySelector('[aria-current="page"]')).not.toBeNull();
    });
    ```
    (with the desktop `matchMedia` mock the component skill § 6 requires), plus board lanes are named "{label}, {n} tasks", no `href="#"`, axe → FAIL → implement → `pnpm registry:build && pnpm check:component app-shell-01 && pnpm check:component board-01` PASS → commit `feat(blocks): modernise app-shell-01 and board-01 (DS-80)`

- [ ] **Task 16: doctrine lines for 00d's next doctrine PR** (rev 2: the removal's lines moved to task 1; what remains is the roster of the NEW blocks and `transcript`/AudioPlayer `docked`)
  - Files — Modify (in the doctrine branch): `skills/public/vegastack-design-system/SKILL.md` (:26 blocks roster: login-01, app-shell-01, list-page-01, settings-01, settings-02, board-01, notifications-01, command-search-01, review-split-01, status-pages-01; `transcript` and AudioPlayer `docked` in "Which component for X"), `design.md` block list if it names blocks + `pnpm design:sync`. (Rev 2: the `@dnd-kit` entry, the `dashboard-01` clause and `design.md` :1075 already landed in task 1; README counts are generated.)
  - Interfaces — Consumes: merged PRs 1–5 · Produces: doctrine that names only shipped blocks and engines
  - Steps: edit → verify: `node tooling/skill-lint.mjs`; `node tooling/sync-package-skills.mjs && node tooling/sync-package-skills.mjs --check`; `pnpm design:sync:check`; `git grep -nP "dashboard-01|sidebar-(0[1-9]|1[0-6])\b|@dnd-kit" -- AGENTS.md README.md design.md skills packages/design/skills` is empty → commit `docs: blocks roster and engines after the facelift block set`

- [ ] **Task 17: per-PR proof, hand back, ship on MK's `ship it`**
  - Files — none beyond the changesets above
  - Interfaces — Produces: a published `@vegastack/ui` minor (+ `@vegastack/design` patch for the regenerated skills), deployed to design.vegastack.com. Regent #140 consumes that version.
  - Steps: per PR run `pnpm upstream:check`, `pnpm registry:build && git status --short` (clean after), `pnpm design:derived:check`, `node tooling/verify-component-contracts.mjs`, `pnpm check:affected`, `pnpm lint`, `node tooling/changeset-lint.mjs`, `node tooling/changelog-assemble.mjs --dry-run && node tooling/changelog-assemble.mjs --check`, and the ship skill's package-vs-changeset diff. Then do the visual review per `skills/internal/ship/references/visual-review.md` in light/dark at 320px and wide: transcript follow/pause, the dock at the bottom of a long column, each block page and each empty tier (captures not committed). Hand back to MK and stop. On MK's own `ship it` in this repo: PR, `PR quality`, exact-SHA squash merge, Version Packages PR (`action_required` approval), exact-SHA merge, OIDC publish, `deploy.yml`, production probe (`docs/RELEASING.md`) → verify `npm view @vegastack/design version` and the live registry version.

## Stop points

1. **Plan approval.** No code before MK approves this file.
2. **Decisions.** D1 blocks the dependency half of task 1 (the block removal still goes ahead). D3/D4 block task 1. D2, D5 and D6 have recommended defaults but are still MK's call.
3. **Ship it.** Each PR waits for MK's `ship it` in this repo. Regent's standing approval does not cover the DS release.
4. The brief's stop conditions, repeated in tasks 1, 2, 3, 11 and 14, plus any release step that crosses a trust boundary.

## Out of scope

Everything the brief lists: 00a/00b/00d/00e items, the 68 chart blocks (D5 only asks), `media-dock`/`MediaDockSpacer`/a `fixed` dock, `record-01`, `tile-grid`, a full-page inbox, a video dock, `nav-rail`, rebuilding any removed block, Regent pages and wrappers, the Regent dev.md #83/#86 lines (13 proposes them), and a transcript virtualization engine.

Revisions: v2 — 24-09-2026: task 1 carries the removal's doctrine lines and ships ahead of 00a/00d; task 16 narrowed to the new blocks' roster, per (kmanojkumar) PR 1 instruction; the CHANGELOG unlink is recorded as an implementer ruling
