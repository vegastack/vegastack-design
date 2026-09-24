# Plan: Facelift component fixes and small variants (00a)

**Status:** approved by MK 24-09-2026 ("Approve all as recommended", Regent #137), including every proposed decision row (API-26, API-24, OVL-17, A11Y-23, VOI-1) and D1–D4 as recommended. Shipping runs under MK's standing "Standing ship-it for the facelift" (24-09-2026).
**Origin:** Regent issue `vegastack/engg-clients-regent-ai-platform-web-app-v2#137` (brief 00a of the facelift epic #135, approved by MK on 24-09-2026). It owns DS-01, DS-02, DS-03 (source half), DS-11, DS-17, DS-18, DS-19, DS-21, DS-22, DS-23, DS-27, DS-28, DS-47, DS-64, DS-67, DS-68, DS-69, DS-70 and DS-71. It also carries the source halves of 00d's DS-72 (JSDoc examples) and DS-74 (AnimatedNumber face, TableCellText `mono` size, `data-table-parts` JSDoc). The canonical DS-ID table is in the #137 brief.
**Branch and worktree:** `fix/facelift-component-fixes`, cut from `origin/main` (`dc228eb2c`, registry 0.16.1, `@vegastack/design` 0.7.2), at `~/projects/vegastack-design-facelift-fixes`.
**Sibling plans:** 00d doctrine is `docs/facelift-doctrine` (`docs/plans/2026-09-24-facelift-doctrine.md`). 00e, the upstream-backed pack and `settings-01`, is `fix/facelift-upstream-pack` (`docs/plans/2026-09-24-facelift-upstream-pack.md`).

## Shape: three PRs in the order the brief sets

| PR   | Name                    | Items                                                                                                                  | Files (canonical)                                                                                                                                                                                                                                                                                      | Lands                  |
| ---- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| PR 1 | Forms wiring            | DS-47, DS-67, DS-17 (Select hunk)                                                                                      | `field.tsx`, `input.tsx`, `textarea.tsx`, `input-group.tsx`, `select.tsx`, `combobox.tsx`, `number-field.tsx`, `password-input.tsx`, `date-picker.tsx` (Field.Control only), `text-edit.tsx` (Field.Control only), plus patches                                                                        | First                  |
| PR 2 | Page chrome and pickers | DS-02, DS-03 source, DS-11, DS-17 (ours half), DS-18, DS-19, DS-21, DS-22, DS-23, DS-28, DS-64, DS-74 (AnimatedNumber) | `page-header.tsx`, `app-shell.tsx`, `relative-time.tsx`, `editable-cell.tsx`, `chip-input.tsx`, `searchable-select.tsx`, `date-picker.tsx`, `multi-step-form.tsx`, `filter-bar-managed.tsx`, `provider.tsx`, `toast.tsx` + patch, `animated-number.tsx`, plus the `packages/ui/src/provider/*` mirrors | Rebased on merged PR 1 |
| PR 3 | Data                    | DS-01, DS-27, DS-68, DS-69, DS-70, DS-71, DS-72 (JSDoc), DS-74 (TableCellText, `mono` JSDoc)                           | `data-table-parts.tsx`, `data-list.tsx`, `data-grid.tsx`, `data-list-pager.tsx`, `truncated-text.tsx`, `board.tsx`, `use-drag-reorder.ts`, `pagination.tsx` + patch, `timeline.tsx`, `tool-call-chip.tsx`                                                                                              | Rebased on merged PR 2 |

**Branch layout.** Commits go onto `fix/facelift-component-fixes` in task order, so PR 1's commits come first, then PR 2's, then PR 3's. The PR boundaries are recorded in the ledger. When MK says `ship it`, PR 1 is pushed from its last commit as `fix/facelift-forms-wiring` and merged. PR 2 (`fix/facelift-chrome-pickers`) is then rebased onto the new `main`, pushed and merged, and PR 3 (`fix/facelift-data`) follows the same way. The Version Packages PR assembles all three, and the 00e PRs when they are ready, into one release (D4).

**Every item carries these files.** The component skill (§ 6) requires them, and each task below lists them by path:

- Source: `packages/ui/registry/ui/<name>.tsx`. For an upstream-backed item, also `packages/ui/upstream/patches/<name>.patch` (regenerated, never hand-edited).
- Test: `packages/ui/registry/ui/<name>.test.tsx`, with `expectNoA11yViolations` (`packages/ui/test/a11y.ts`) for every distinct state and one assertion for each decision ID a patch implements.
- Docs: `apps/docs/content/docs/components/<name>.mdx`, where new sections become `<ComponentPreview>`s, plus `apps/docs/components/preview/<name>.tsx` and the barrel `apps/docs/components/preview/index.tsx`. Ours pages close on Do/Don't and upstream-backed pages close on `## Deviations`.
- `packages/ui/registry.json`: the item's `meta.whenToUse`/`whenNotToUse` wherever scope changes, and `registryDependencies` as `@vegastack/<name>`.
- `packages/ui/component-contracts.json`: the record's variants, sizes, states, parts, `publicSymbols` and test files. Then run `pnpm design:derived`.
- Changeset: `.changeset/<slug>.md`, one per PR. `"@vegastack/ui": minor`, and the body opens with `🔧` (PR 2) or `🐛` (PRs 1 and 3, which carry the consumer-visible fixes). Each consumer-visible change gets a migration line.
- Generated files, never hand-edited: `apps/docs/components/ui/<name>.tsx` and `apps/docs/public/r/<name>.json` (from `pnpm registry:build`), and `packages/ui/src/provider/toaster.tsx` (from `node tooling/sync-toaster-mirror.mjs`).

The upstream-backed loop is run for each file, every time:

```bash
N=<name>
cp vendor/shadcn/4.21.0/ui/$N.tsx packages/ui/registry/ui/$N.tsx   # upstream, verbatim
# re-apply the existing patch's decisions + the newly approved row, nothing else
pnpm upstream:diff $N                                              # regenerate; write the header
pnpm registry:build && pnpm check:component $N
```

## Re-grounding against `main` (dc228eb2c): corrections to the brief

1. **Two plan files, not one.** The brief names one shared plan, `2026-09-24-facelift-ds-fixes.md`, and the worktree `../vegastack-design-wt/fix-facelift-ds`. By MK's instruction the work is split into this plan (00a) and `2026-09-24-facelift-upstream-pack.md` (00e), each with its own worktree and branch. The PR numbering (PR 1 to PR 5) is unchanged.
2. **DS-19's axis is `size: "narrow" | "default" | "full"`.** The coordinator decided this on 24-09-2026 to match the Regent spacing audit and the child briefs, which already use `size="narrow"`. It replaces the brief's `default | lg | full`. The mapping is `narrow` = `max-w-3xl` (768px, for forms and settings), `default` = `max-w-7xl` (1280px) and `full` = no max. `narrow` is not on DS-73's `xs|sm|default|lg` size ladder, so the doctrine PR lists it as a known deviation (flagged to 00d). The spacing audit also proposes a "LAY-13" for form measure. That number is taken by 00e's DS-05 row, so if the form-measure rule ever becomes a row, it takes the next free LAY number.
3. **Next free IDs, verified.** `packages/ui/upstream/decisions.json` has 180 rows (72 ours). The highest ID in each family is INT-10, FOC-12, COL-23, BRD-11, TYP-18, MOT-13, LAY-12, A11Y-16, FRM-14, OVL-16, ICO-8, API-17 and DOC-12. There is no VOI family yet. A11Y-14 and A11Y-15 are burned. None of this plan's proposed IDs (VOI-1, A11Y-23, OVL-17, API-24, API-26) appears in `decisions.json` or in the register (`docs/plans/2026-09-18-shadcn-reset/decisions.md`). `parseDecisionsMarkdown` (`tooling/upstream/lib.mjs:127`) accepts any `[A-Z0-9]+-\d+` ID, so a new `## 14. Voice & copy` section parses without a tooling change.
4. **The register is git-excluded until 00d Task 1 lands.** `.git/info/exclude` excludes `docs/plans/2026-09-18-shadcn-reset/`, and a fresh worktree has no copy of it. No row is added here until 00d's REG commit is on `main`. This branch then rebases, and rows are added to the tracked file.
5. **The provider and toaster exist twice.** `packages/ui/src/provider/vegastack-provider.tsx` mirrors `registry/ui/provider.tsx`. `packages/ui/src/provider/toaster.tsx` is generated from `toast.tsx` by `tooling/sync-toaster-mirror.mjs`, and `design:verify` runs `--check`. DS-64 edits the canonical provider and the package provider, regenerates the toaster mirror, and extends `packages/ui/test/toast-manager-binding.browser.test.tsx`.
6. **Hooks and shared internals have no docs page.** `use-drag-reorder` and `data-table-parts` have no MDX page. Their docs go on the pages that use them: `sortable-list.mdx` and `board.mdx` for DS-70, and `data-list.mdx` and `data-grid.mdx` for DS-01.
7. **`textarea.tsx` is server-safe today** (no `'use client'`). `Field.Control` is hook-backed, so DS-47 adds the directive there. That is API-16's lowest-leaf rule, because the textarea is the leaf. `field.tsx` is already a client module.
8. **DatePicker already forwards `id`, `aria-describedby` and `aria-invalid` to its trigger** (#188, `.changeset/date-picker-field-binding-editable-cell-truncation.md`). DS-47 changes where those values come from (the Field context) and keeps the explicit props winning.
9. **The Base UI API is present in the installed 1.8.0.** It has `Field.Root` (`invalid`, `name`), `Field.Label`, `Field.Description`, `Field.Error` (`match`), `Field.Control`, and Combobox root `name`, `required` and `itemToStringValue`. The worktree needs `pnpm install --frozen-lockfile` before any command runs.

## Decisions MK makes on this plan

**Decision rows.** Each is added only after MK approves it, lands in the PR that first uses it, and goes into the register, `decisions.json` (regenerated with `node tooling/upstream/verify-parity.mjs --sync-decisions`) and `exception-map.json`:

| Row     | Proposed text                                                                                                                                             | Items                               | Components (exception-map)                            | PR                                      |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| API-26  | `Field` parts render Base UI `Field` underneath; controls read it                                                                                         | DS-47                               | field, input, textarea, input-group, select, combobox | PR 1                                    |
| API-24  | Select `variant="ghost"`; the default trigger is `w-full`                                                                                                 | DS-17                               | select                                                | PR 1                                    |
| OVL-17  | One toast store: the provider passes the module manager, and Toaster reuses an existing provider                                                          | DS-64                               | toast                                                 | PR 2                                    |
| A11Y-23 | Pagination links render as `<a className={buttonVariants()}>` and keep the link role                                                                      | DS-71                               | pagination                                            | PR 3                                    |
| VOI-1   | Upstream default English copy is rewritten to sentence case with the ellipsis character, and every built-in string is an overridable `<action>Label` prop | DS-71 (and 00e DS-04, DS-06, DS-13) | pagination (00e adds sidebar, command, sheet, dialog) | PR 3, or 00e's PR 4 if that lands first |

`amend A11Y-7` (the `listitem` wrapper) is 00e's. The DS-68 `item.tsx` hunk rides it there, so this plan does not touch `item.tsx`.

**Other choices:**

- **D1 (DS-17, Select width):** the default Select trigger becomes `w-full`, as API-24 proposes. This is consumer-visible (`🐛`). If MK declines, API-24 is recorded as "Select keeps upstream's `w-fit`; `variant="ghost"` is added", no width changes, and `select.mdx` Deviations says so. Recommended: `w-full`.
- **D2 (DS-19 naming):** `size="narrow"` is already decided (re-grounding 2). The plan only asks MK to note that it becomes a DS-73 known deviation.
- **D3 (DS-47 spike):** before any other DS-47 code, Task 1 proves `Field.Control render={…}` on one non-input control (the Textarea) and one button trigger (the DatePicker). If the button trigger cannot take its ids without restructuring an upstream file, DS-47 stops, and DS-21 and DS-22 ship only their explicit-prop halves (brief § Risks). Recommended: accept the stop rule as written.
- **D4 (release grouping):** one `ship it` covers PR 1, PR 2 and PR 3, merged in order. 00e's PR 4 and PR 5 join the same Version Packages PR when they are ready (one registry minor). Recommended: yes.

## Ordering and dependencies

```
00d REG (register committed) ──► rows may be added here
00d doctrine PR ── lands first or alongside; its Task 9 lines wait for PR 1 (DS-47), PR 2 (DS-64), PR 3 (DS-71)
PR 1 forms wiring (DS-47 first) ──► PR 2 (DS-21, DS-22 consume Field wiring) ──► PR 3
                     └──────────────► 00e PR 4 (SelectItem/ComboboxItem description context; after PR 1 and PR 2)
PR 2 (PageHeader, AppShellPage) ────► 00e PR 5 settings-01, 00e DS-05 (app-shell)
```

- DS-47 is the first commit series in PR 1. DS-21 and DS-22 (PR 2) and 00b's DS-42 editors build on it.
- 00b (`feat/facelift-lists-filters-forms`) and 00c (`feat/facelift-components-blocks`) rebase onto `main` after these PRs merge.

## Tasks

- [ ] **Task 0: worktree ready and row gate**
  - Files — none
  - Interfaces — Produces: an installed worktree on a `main` that contains 00d's REG commit. Rows are added only after that.
  - Steps: `cd ~/projects/vegastack-design-facelift-fixes && pnpm install --frozen-lockfile` → `git fetch origin && git log origin/main --oneline -- docs/plans/2026-09-18-shadcn-reset/decisions.md` shows 00d's REG commit (if it does not, only the tasks that need no row and do not depend on Task 1 may proceed: 6, 7, 8, 10, 12, 13, 15, 17, 18, 20, 21 and 22. Their commits are reordered into their PR's range at the boundary.) → `git rebase origin/main` → verify: `pnpm upstream:check` is green on the untouched tree.

### PR 1: forms wiring

- [ ] **Task 1: DS-47, `Field` on Base UI Field parts (API-26)**
  - Files — Modify: `packages/ui/registry/ui/field.tsx`, `packages/ui/upstream/patches/field.patch`, `packages/ui/upstream/decisions.json`, `packages/ui/upstream/exception-map.json` (API-26 → field, input, textarea, input-group, select, combobox), `docs/plans/2026-09-18-shadcn-reset/decisions.md` (API-26 row), `packages/ui/component-contracts.json` (field record) · Test: `packages/ui/registry/ui/field.test.tsx` · Docs: `apps/docs/content/docs/components/field.mdx` ("Automatic wiring" + Deviations API-26), `apps/docs/components/preview/field.tsx` (`fieldAutomaticWiring`)
  - Interfaces — Produces: `Field(props: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants> & { "data-invalid"?: boolean | "true" | "false" })`, which renders `FieldPrimitive.Root` with `invalid` taken from `data-invalid` and keeps `data-slot="field"`, `orientation` and classes. `FieldLabel` renders `FieldPrimitive.Label` (the choice-card form is kept). `FieldDescription` renders `FieldPrimitive.Description` (a `<p>`). `FieldError` renders `FieldPrimitive.Error match` only while it has content (`errors[]`, the icon and `role="alert"` are kept). `FieldTitle`'s `data-slot` becomes `"field-title"`, and the dead selectors (`field.tsx:49`, `:162`) are removed (D1 B12–B14). Consumed by Tasks 2, 3, 9 and 11.
  - Steps: spike (D3). Wrap a `Textarea` and a `DatePicker` trigger in `FieldPrimitive.Control render={…}` in a scratch test and confirm that the ids land. If the button trigger fails, stop here per D3 → write the failing test:
    ```tsx
    test("Field wires label, description, error and invalid onto the control", async () => {
      const screen = await render(
        <Field data-invalid>
          <FieldLabel>Name</FieldLabel>
          <Input />
          <FieldDescription>Shown on invoices</FieldDescription>
          <FieldError>Name is required</FieldError>
        </Field>,
      );
      const input = screen.getByRole("textbox", { name: "Name" });
      await expect.element(input).toHaveAttribute("aria-invalid", "true");
      await expect
        .element(input)
        .toHaveAccessibleDescription(/Shown on invoices/);
      await expect
        .element(input)
        .toHaveAccessibleDescription(/Name is required/);
    });
    ```
    → run `pnpm --filter @vegastack/ui exec vitest run registry/ui/field.test.tsx`, which is expected to FAIL (no `aria-invalid`, no description) → add the API-26 row after MK approves it, then `node tooling/upstream/verify-parity.mjs --sync-decisions` → run the upstream loop for `field` → add the remaining tests: the description id is present only while it is rendered, explicit `id`/`aria-describedby` wins, a control outside a `Field` is unchanged, the `FieldTitle` slot, and axe for valid and invalid → PASS → `pnpm registry:build && pnpm check:component field` → commit `fix(field): wire controls through Base UI Field (DS-47, API-26)`

- [ ] **Task 2: DS-47, upstream-backed controls read the Field**
  - Files — Modify: `packages/ui/registry/ui/textarea.tsx` (`'use client'` + `FieldPrimitive.Control render={<textarea/>}`), `packages/ui/registry/ui/input-group.tsx` (`InputGroupInput` and `InputGroupTextarea` through `Field.Control`), `packages/ui/upstream/patches/{textarea,input-group}.patch`, `packages/ui/upstream/patches/{input,select,combobox}.patch` (header only: API-26 as a NO-HUNK claim, because Base UI Input, Select and Combobox already read the Field context) · Test: `packages/ui/registry/ui/{input,textarea,input-group,select,combobox}.test.tsx` · Docs: `apps/docs/content/docs/components/{input,textarea,input-group,select,combobox}.mdx` (Deviations: API-26)
  - Interfaces — Consumes: Task 1's `Field`. Produces: each control inside `<Field>` gets the label, the `aria-describedby` ids and `aria-invalid` with no props. Outside a `Field`, the rendered DOM is the same as today.
  - Steps: failing test, repeated in each control's suite with that control:
    ```tsx
    test("inside a Field the textarea is labelled, described and invalid", async () => {
      const screen = await render(
        <Field data-invalid>
          <FieldLabel>Notes</FieldLabel>
          <Textarea />
          <FieldError>Too long</FieldError>
        </Field>,
      );
      const box = screen.getByRole("textbox", { name: "Notes" });
      await expect.element(box).toHaveAttribute("aria-invalid", "true");
      await expect.element(box).toHaveAccessibleDescription(/Too long/);
    });
    ```
    → FAIL for textarea and input-group, and expected PASS for input, select and combobox (those three are the engine-satisfied, no-hunk claim) → run the upstream loop for `textarea` and `input-group`, then header-only regeneration for `input`, `select` and `combobox` → add axe valid/invalid for each control → PASS → `pnpm registry:build && pnpm check:component textarea && pnpm check:component input-group` → commit `fix(forms): upstream controls read the enclosing Field (DS-47)`

- [ ] **Task 3: DS-47 and DS-67, controls we own**
  - Files — Modify: `packages/ui/registry/ui/password-input.tsx`, `packages/ui/registry/ui/date-picker.tsx` (trigger through `Field.Control`), `packages/ui/registry/ui/text-edit.tsx` (editable root through `Field.Control`), `packages/ui/registry/ui/number-field.tsx` (`aria-describedby`, `aria-invalid`, `aria-labelledby` and `id` onto the `<input>`, not `rootProps`, at `:156-183`) · Test: `packages/ui/registry/ui/{password-input,date-picker,text-edit,number-field}.test.tsx` · Docs: `apps/docs/content/docs/components/{password-input,date-picker,text-edit,number-field}.mdx` ("Inside a Field" example) · Contract: the four records' `testFiles`/states
  - Interfaces — Consumes: Task 1's `Field`. Produces: `NumberFieldProps["aria-describedby" | "aria-invalid" | "aria-labelledby" | "id"]`, which land on `input[data-slot="number-field-input"]`. Explicit props still win in all four components.
  - Steps: failing test:
    ```tsx
    test("aria-describedby lands on the input, not the group", async () => {
      const screen = await render(
        <>
          <NumberField aria-label="Qty" aria-describedby="err" />
          <p id="err">Too many</p>
        </>,
      );
      const input = screen.getByRole("textbox", { name: "Qty" });
      await expect.element(input).toHaveAttribute("aria-describedby", "err");
    });
    ```
    → FAIL (the attribute sits on the group `div`) → move the four props → add a Field-wiring test for each of the four controls and axe for valid/invalid → PASS → `pnpm check:component number-field` (and the same for the other three) → commit `fix(forms): owned controls read the Field; NumberField ids on the input (DS-47, DS-67)`

- [ ] **Task 4: DS-17, Select `variant="ghost"` and the full-width default trigger (API-24)**
  - Files — Modify: `packages/ui/registry/ui/select.tsx` (`SelectTrigger` CVA: `variant: "outline" | "ghost"`, default `outline` = `w-full`, ghost = `w-fit`, no border at rest, border on hover, focus and `data-popup-open`), `packages/ui/upstream/patches/select.patch`, `packages/ui/upstream/exception-map.json` (API-24 → select), `packages/ui/upstream/decisions.json`, the register (API-24 row) · Test: `packages/ui/registry/ui/select.test.tsx`, `packages/ui/test/geometry.browser.test.tsx` (fixture `select-trigger-width`) · Docs: `apps/docs/content/docs/components/select.mdx` ("Inline trigger" + Deviations API-24), `apps/docs/components/preview/select.tsx` (`selectInlineTrigger`) · Registry: `packages/ui/registry.json` select `meta.whenToUse` ("inline ghost trigger in rows") · Contract: select variants
  - Interfaces — Produces: `SelectTrigger({ size?: "sm" | "default"; variant?: "outline" | "ghost" })` with `data-variant`. Task 9 matches `size="sm"` (h-7) and `variant="ghost"` on SearchableSelect and DatePicker.
  - Steps: failing test:
    ```tsx
    test("default trigger fills its parent; ghost sizes to content", async () => {
      const screen = await render(
        <div style={{ width: 320 }}>
          <Select>
            <SelectTrigger data-testid="a">
              <SelectValue placeholder="Pick" />
            </SelectTrigger>
          </Select>
          <Select>
            <SelectTrigger data-testid="b" variant="ghost">
              <SelectValue placeholder="Pick" />
            </SelectTrigger>
          </Select>
        </div>,
      );
      expect(
        (screen.getByTestId("a").element() as HTMLElement).offsetWidth,
      ).toBe(320);
      expect(
        (screen.getByTestId("b").element() as HTMLElement).offsetWidth,
      ).toBeLessThan(320);
    });
    ```
    → FAIL (`w-fit`) → MK approves API-24 (D1) → run the upstream loop for `select` (re-apply the existing decisions + API-24) → add tests: the ghost border appears on focus and when open, `data-variant`, and axe at rest, open and invalid → PASS → `pnpm check:component select` → commit `fix(select): full-width default trigger and a ghost inline variant (DS-17, API-24)`

- [ ] **Task 5: PR 1 changeset and proof**
  - Files — Create: `.changeset/facelift-forms-wiring.md` (`"@vegastack/ui": minor`, body opens `🐛`. The Field wiring and the default Select width are consumer-visible, with the migration lines "tests asserting no `aria-describedby` on a Field control" and "a Select trigger now fills its parent; pass `variant="ghost"` or a width class for content width")
  - Interfaces — Consumes: Tasks 1–4. Produces: a PR 1 commit range that passes `PR quality` locally.
  - Steps: write the changeset → verify with the "Local proof" block below, then with the visual review of the `field`, `input`, `textarea`, `input-group`, `select`, `combobox`, `number-field`, `password-input`, `date-picker` and `text-edit` previews (valid, invalid, disabled and focus-visible, light and dark, 320px and 1280px) → commit `chore: changeset for the forms wiring`, and record the PR 1 boundary SHA in the ledger.

### PR 2: page chrome and pickers

- [ ] **Task 6: DS-02 and DS-03, PageHeader `backRender`, `titleLines`, `meta` and the page-heading face**
  - Files — Modify: `packages/ui/registry/ui/page-header.tsx` (`:244-254` back link, `:262` title class) · Test: `packages/ui/registry/ui/page-header.test.tsx` · Docs: `apps/docs/content/docs/components/page-header.mdx` ("Framework link for back", "Wrapping title", "Metadata with controls"), `apps/docs/components/preview/page-header.tsx` (`pageHeaderBackRender`, `pageHeaderWrappingTitle`, `pageHeaderMeta`) · Registry: page-header `meta.whenToUse` (meta slot for pickers) · Contract: page-header props and parts (`page-header-meta` slot)
  - Interfaces — Produces: `PageHeaderProps.backRender?: React.ReactElement` (merged with `useRender` into `buttonVariants({ variant: "ghost", size: "icon-sm" })`, `aria-label={backLabel}` and `data-slot="page-header-back"`). `backHref` stays as the shorthand for `backRender={<a href={backHref} />}`. `titleLines?: number | "none"` (default `1`, passed to `TruncatedText lines`; `"none"` renders no truncation wrapper). `meta?: React.ReactNode` (`<div data-slot="page-header-meta" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">`). The title class is `font-heading text-2xl font-semibold`. Consumed by 00e Task 15 (settings-01) and 00c.
  - Steps: failing test:
    ```tsx
    test("backRender renders the passed link element", async () => {
      const screen = await render(
        <PageHeader
          title="Family"
          backLabel="Back to products"
          backRender={<a href="/products" />}
        />,
      );
      const back = screen.getByRole("link", { name: "Back to products" });
      await expect.element(back).toHaveAttribute("href", "/products");
      await expect
        .element(back)
        .toHaveAttribute("data-slot", "page-header-back");
    });
    ```
    → FAIL (unknown prop) → implement → add tests: `titleLines={2}` sets `lines=2`, `"none"` renders no wrapper, `meta` holds a `button` with no DOM-nesting warning (spy on `console.error`), the title class list contains `font-heading`, RTL, and axe for each variant → PASS → `pnpm check:component page-header && node tooling/content-lint.mjs` → commit `feat(page-header): framework back link, wrapping title, meta slot, one heading face (DS-02, DS-03)`

- [ ] **Task 7: DS-19, `AppShellPage`**
  - Files — Modify: `packages/ui/registry/ui/app-shell.tsx` (new part after `AppShellContent`, `:329`; `AppShellSkeleton`, `:398`, uses the same gutters) · Test: `packages/ui/registry/ui/app-shell.test.tsx`, `packages/ui/test/geometry.browser.test.tsx` (fixture `app-shell-page-320`) · Docs: `apps/docs/content/docs/components/app-shell.mdx` ("Page container"), `apps/docs/components/preview/app-shell.tsx` (`appShellPage`) · Registry: app-shell `meta.whenToUse` · Contract: app-shell parts + `AppShellPageProps`
  - Interfaces — Produces: `AppShellPage({ size?: "narrow" | "default" | "full"; className?; children })`, which renders `<div data-slot="app-shell-page" data-size={size} className="mx-auto flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8 …">`. The widths are `max-w-3xl` (narrow), `max-w-7xl` (default) and none (full, plus `min-h-0 grow basis-0` for bounded pages). The gutters are DS-75's recipe as the approved 00d plan states it. Consumed by 00e Task 15 and Regent child 01.
  - Steps: failing test:
    ```tsx
    test("AppShellPage narrow caps the measure at max-w-3xl", async () => {
      const screen = await render(<AppShellPage size="narrow">x</AppShellPage>);
      const page = screen.container.querySelector(
        '[data-slot="app-shell-page"]',
      )!;
      expect(page.getAttribute("data-size")).toBe("narrow");
      expect(getComputedStyle(page).maxWidth).toBe("48rem");
    });
    ```
    → FAIL (no export) → implement → add tests: at 320px with a long unbroken child, `document.documentElement.scrollWidth <= 320`; `full` fills the height; one `main` landmark; axe → PASS → `pnpm check:component app-shell` → commit `feat(app-shell): AppShellPage page container (DS-19)`

- [ ] **Task 8: DS-11, RelativeTime `capitalize`, `formatOptions`, `timeZone`, `withTime`**
  - Files — Modify: `packages/ui/registry/ui/relative-time.tsx` (`:72-74` day math, `:81-85` `formatDay`, `:103` SSR `formatAbsolute`, `:309` `min-h-6 inline-flex` only on a tooltip trigger, `:323-326` tooltip label) · Test: `packages/ui/registry/ui/relative-time.test.tsx` · Docs: `apps/docs/content/docs/components/relative-time.mdx` ("Standalone label", "Fixed time zone", "Day with time"), `apps/docs/components/preview/relative-time.tsx` · Contract: relative-time props
  - Interfaces — Produces: `RelativeTimeProps.capitalize?: boolean`, `formatOptions?: Intl.DateTimeFormatOptions` (default `{ month: "long", day: "numeric" }`, plus `year` when it is not the current year), `timeZone?: string` (used in all four places) and `withTime?: boolean` (in `mode="day"`, "Today, 11:30").
  - Steps: failing test:
    ```tsx
    test("timeZone decides the calendar day in label and tooltip", async () => {
      vi.setSystemTime(new Date("2026-09-22T23:30:00Z")); // 05:00 on 23 Sep in IST
      const screen = await render(
        <RelativeTime
          mode="day"
          capitalize
          timeZone="Asia/Kolkata"
          date={new Date("2026-09-22T20:00:00Z")}
        />,
      );
      await expect.element(screen.getByText("Today")).toBeInTheDocument();
    });
    ```
    → FAIL (the day is computed in the runner's zone, lowercase) → implement → add tests: `formatOptions` gives "22 Sep" in `en-IN`, `withTime`, SSR text equals the client text (`renderToString`), and axe → PASS → `pnpm check:component relative-time` → commit `feat(relative-time): time zone, capitalize, format options, with time (DS-11)`

- [ ] **Task 9: DS-17 (ours half) and DS-22, the SearchableSelect and DatePicker inline tier and clear rule**
  - Files — Modify: `packages/ui/registry/ui/searchable-select.tsx` (`size`, `variant`, `contentClassName`; stop forcing `aria-label` at `:185`, `:194-195`, `:219`; root under `Field.Control`; `name`, `required` and `itemToStringValue={itemToKey}` on the Combobox root; clear at `:265-276` focuses the trigger before it unmounts), `packages/ui/registry/ui/date-picker.tsx` (`size`, `variant`, `clearable`, `clearLabel`, `renderValue`) · Test: `packages/ui/registry/ui/searchable-select.test.tsx`, `packages/ui/registry/ui/date-picker.test.tsx`, `packages/ui/test/geometry.browser.test.tsx` (fixture `inline-trigger-row`: Select, SearchableSelect and DatePicker `sm` share one height; each clear target is at least 24px, checked with `elementFromPoint`) · Docs: `apps/docs/content/docs/components/searchable-select.mdx` ("Inline in a row", "Inside a Field"), `apps/docs/content/docs/components/date-picker.mdx` ("Clearable", "Inline in a row"), previews `searchable-select.tsx`, `date-picker.tsx` · Registry: both items' `meta.whenToUse` · Contract: sizes/variants/states
  - Interfaces — Consumes: Task 1's `Field`, Task 4's `SelectTrigger` `sm`/`ghost` classes. Produces: `SearchableSelectProps.size?: "sm" | "default"`, `variant?: "outline" | "ghost"`, `contentClassName?: string`, `name?: string`, `required?: boolean`. `DatePickerProps.size?: "sm" | "default"`, `variant?: "outline" | "ghost"`, `clearable?: boolean` (default `false`), `clearLabel?: string` (default "Clear date") and `renderValue?: (date: Date) => React.ReactNode`. One clear rule: the clear button is a sibling after the trigger, and focus returns to the trigger with no announcement.
  - Steps: failing test:
    ```tsx
    test("inside a Field the trigger is named by its label, not its value", async () => {
      const screen = await render(
        <Field>
          <FieldLabel>Country</FieldLabel>
          <SearchableSelect
            items={COUNTRIES}
            value={COUNTRIES[0]}
            onValueChange={() => {}}
          />
        </Field>,
      );
      await expect
        .element(screen.getByRole("combobox", { name: "Country" }))
        .toBeInTheDocument();
    });
    ```
    → FAIL (named "India") → implement → add tests: invalid border, `FieldError` in the description, `required` blocks submit, the form posts the key, focus is on the trigger after clear (both components), `renderValue`, the ghost border on focus and open, the geometry fixture, and axe for valid, invalid and open → PASS → `pnpm check:component searchable-select && pnpm check:component date-picker` → commit `feat(pickers): one inline trigger tier and clear rule; SearchableSelect Field wiring (DS-17, DS-22)`

- [ ] **Task 10: DS-18, EditableCell `renderValue`**
  - Files — Modify: `packages/ui/registry/ui/editable-cell.tsx` (display, `:466-480`) · Test: `packages/ui/registry/ui/editable-cell.test.tsx` · Docs: `apps/docs/content/docs/components/editable-cell.mdx` ("Custom editor with a label"), preview `editable-cell.tsx` · Contract: props
  - Interfaces — Produces: `EditableCellProps.renderValue?: (value: string) => React.ReactNode`, used in display mode for every editor type. The empty display keeps the placeholder.
  - Steps: failing test:
    ```tsx
    test("renderValue shows the label, not the id", async () => {
      const screen = await render(
        <EditableCell
          value="u_7"
          onCommit={() => {}}
          editor={{ type: "custom", render: () => null }}
          renderValue={(id) => (id === "u_7" ? "Asha Rao" : id)}
        />,
      );
      await expect.element(screen.getByText("Asha Rao")).toBeInTheDocument();
    });
    ```
    → FAIL → implement → add tests: commit and revert unchanged, the empty value shows the placeholder, and axe → PASS → `pnpm check:component editable-cell` → commit `feat(editable-cell): renderValue for display (DS-18)`

- [ ] **Task 11: DS-21, ChipInput on the Field wiring**
  - Files — Modify: `packages/ui/registry/ui/chip-input.tsx` (`:51-121`: inner input through `Field.Control`; one hidden input for each chip when `name` is set; `max`, `maxLabel`) · Test: `packages/ui/registry/ui/chip-input.test.tsx` · Docs: `apps/docs/content/docs/components/chip-input.mdx` ("Inside a Field", "Maximum entries"), preview `chip-input.tsx` · Registry: chip-input `registryDependencies` gains `@vegastack/field` if it is imported · Contract: props
  - Interfaces — Consumes: Task 1's `Field`. Produces: `ChipInputProps.name?: string`, `max?: number`, `maxLabel?: (max: number) => string` (default `` (n) => `Up to ${n} entries` ``). Per-chip invalid is OR-ed with the Field's invalid.
  - Steps: failing test:
    ```tsx
    test("FieldLabel click focuses the chip input", async () => {
      const screen = await render(
        <Field>
          <FieldLabel>Synonyms</FieldLabel>
          <ChipInput value={[]} onValueChange={() => {}} />
        </Field>,
      );
      await screen.getByText("Synonyms").click();
      await expect
        .element(screen.getByRole("textbox", { name: "Synonyms" }))
        .toHaveFocus();
    });
    ```
    → FAIL (no `id`) → implement → add tests: the `FieldError` id appears only while it is rendered, `max` blocks adding and announces, the form posts every chip, and axe → PASS → `pnpm check:component chip-input` → commit `feat(chip-input): Field wiring, name, max (DS-21)`

- [ ] **Task 12: DS-23, MultiStepForm sticky actions**
  - Files — Modify: `packages/ui/registry/ui/multi-step-form.tsx` (`MultiStepFormActions`, `:1293-1296`; a sentinel sets `data-stuck`) · Test: `packages/ui/registry/ui/multi-step-form.test.tsx` · Docs: `apps/docs/content/docs/components/multi-step-form.mdx` ("Sticky actions"), `apps/docs/content/docs/guides/multi-step-form.mdx`, preview `multi-step-form.tsx` · Contract: states (`stuck`)
  - Interfaces — Produces: `MultiStepFormActionsProps.sticky?: boolean | "narrow"`. `"narrow"` applies only below the form's `@md/stepper` container rung (LAY-9). Classes: `sticky bottom-0 bg-background pb-[env(safe-area-inset-bottom)]`, plus `border-t` only when `data-stuck`.
  - Steps: failing test:
    ```tsx
    test("sticky actions stay in view on a long step", async () => {
      await page.viewport(390, 700);
      const screen = await render(<LongStepFixture sticky />);
      const row = screen.container.querySelector(
        '[data-slot="multi-step-form-actions"]',
      )!;
      expect(row.getBoundingClientRect().bottom).toBeLessThanOrEqual(700);
    });
    ```
    → FAIL → implement → add tests: `border-t` only when stuck, focus order unchanged, the refusal Alert stays above the row, and axe → PASS → `pnpm check:component multi-step-form` → commit `feat(multi-step-form): sticky action row (DS-23)`

- [ ] **Task 13: DS-28, FilterBuilder fixes**
  - Files — Modify: `packages/ui/registry/ui/filter-bar-managed.tsx` (`~:536-547` depth UI, `~:640-673` operator change, `:482-484` touched gate, `:620`/`:643` add buttons to `aria-disabled` with live pointer events) · Test: `packages/ui/registry/ui/filter-bar-managed.test.tsx` · Docs: `apps/docs/content/docs/components/filter-bar-managed.mdx` ("One level", "Operators and value shapes") · Contract: props
  - Interfaces — Produces: `FilterOperator.valueShape?: "none" | "scalar" | "list" | "range"`. When the operator changes to a different shape, `value` resets. `maxDepth={1}` renders no add-group control and no hint. The hint copy is "Groups can nest {n} level deep at most" or "{n} levels". "Value required" shows only after the value control was touched or on submit.
  - Steps: failing test:
    ```tsx
    test("maxDepth 1 renders no group control", async () => {
      const screen = await render(
        <FilterBuilder
          fields={FIELDS}
          maxDepth={1}
          value={EMPTY}
          onValueChange={() => {}}
        />,
      );
      expect(
        screen.container.querySelector(
          '[data-slot="filter-builder-add-group"]',
        ),
      ).toBeNull();
    });
    ```
    → FAIL → implement → add tests: plural copy, "is" → "is any of" clears a scalar, an untouched row shows no error, the disabled add button stays focusable with `aria-disabled`, and axe → PASS → `pnpm check:component filter-bar-managed` → commit `fix(filter-builder): depth-1, value shapes, touched errors, focusable disabled (DS-28)`

- [ ] **Task 14: DS-64, one toast queue (OVL-17)**
  - Files — Modify: `packages/ui/registry/ui/provider.tsx` (`:93` `<ToastProvider toastManager={toast}>`, and the doc claim at `:46-50`), `packages/ui/src/provider/vegastack-provider.tsx` (the same change against `./toaster`), `packages/ui/registry/ui/toast.tsx` (`:428`: `Toaster` renders only its viewport when a `ToastProvider` context already exists), `packages/ui/upstream/patches/toast.patch`, `packages/ui/upstream/exception-map.json` (OVL-17 → toast), `decisions.json`, the register (OVL-17 row) · Generated: `packages/ui/src/provider/toaster.tsx` (`node tooling/sync-toaster-mirror.mjs`) · Test: `packages/ui/test/toast-manager-binding.browser.test.tsx`, `packages/ui/registry/ui/toast.test.tsx`, `packages/ui/registry/ui/provider.test.tsx` · Docs: `apps/docs/content/docs/components/toast.mdx` (Deviations OVL-17; the "one toast per action" doctrine line is 00d Task 9)
  - Interfaces — Produces: `toast()` and `useToastManager()` share one store under `VegaStackProvider`, and exactly one `[data-slot="toast-viewport"]` exists.
  - Steps: failing test:
    ```tsx
    test("useToastManager().add() under the provider renders in the Toaster", async () => {
      function Fire() {
        const manager = useToastManager();
        React.useEffect(() => {
          manager.add({ title: "Saved" });
        }, [manager]);
        return null;
      }
      await render(
        <VegaStackProvider>
          <Fire />
        </VegaStackProvider>,
      );
      await vi.waitUntil(() => hasToast("Saved"));
      expect(
        document.querySelectorAll('[data-slot="toast-viewport"]').length,
      ).toBe(1);
    });
    ```
    → FAIL (the hook writes to a store no viewport renders) → MK approves OVL-17 → run the upstream loop for `toast`, edit both providers, `node tooling/sync-toaster-mirror.mjs` → add tests: `toast.add()` still works, one toast region, and axe → PASS → `pnpm check:component toast && pnpm check:component provider && node tooling/sync-toaster-mirror.mjs --check` → commit `fix(toast): one queue for toast() and useToastManager (DS-64, OVL-17)`

- [ ] **Task 15: DS-74 source half, the AnimatedNumber default face**
  - Files — Modify: `packages/ui/registry/ui/animated-number.tsx` (`:306`: default class `tabular-nums` without `font-mono`) · Test: `packages/ui/registry/ui/animated-number.test.tsx` · Docs: `apps/docs/content/docs/components/animated-number.mdx` (the face sentence)
  - Interfaces — Produces: the default face `font-sans tabular-nums`, which matches `StatValue`.
  - Steps: failing test:
    ```tsx
    test("default face is tabular sans, not mono", async () => {
      const screen = await render(<AnimatedNumber value={42} />);
      const el = screen.container.querySelector(
        '[data-slot="animated-number"]',
      )!;
      expect(el.className).toContain("tabular-nums");
      expect(el.className).not.toContain("font-mono");
    });
    ```
    → FAIL → implement → PASS → `pnpm check:component animated-number` → commit `fix(animated-number): regular face with tabular digits (DS-74)`

- [ ] **Task 16: PR 2 changeset and proof**
  - Files — Create: `.changeset/facelift-chrome-pickers.md` (`"@vegastack/ui": minor`, `🔧`, one line for each item. The migration lines cover the AnimatedNumber face and PageHeader's `font-heading`.)
  - Interfaces — Consumes: Tasks 6–15. Produces: the PR 2 commit range.
  - Steps: write the changeset → verify with the "Local proof" block below, then with the visual review of the `page-header`, `app-shell`, `relative-time`, `searchable-select`, `date-picker`, `editable-cell`, `chip-input`, `multi-step-form`, `filter-bar-managed`, `toast` and `animated-number` previews (states from the brief's "UI states": default, hover, focus-visible, disabled, loading, empty, invalid, open, stuck; light and dark; 320px and 1280px) → commit `chore: changeset for page chrome and pickers`, and record the PR 2 boundary in the ledger.

### PR 3: data

- [ ] **Task 17: DS-01 and the DS-74 `mono` JSDoc, sans header cells**
  - Files — Modify: `packages/ui/registry/ui/data-table-parts.tsx` (`SortableHead`, `:613`: a layout-only class instead of `columnCellClass`, which drops `font-mono text-sm` and keeps `tabular-nums` for numeric columns; the `mono` JSDoc says "for codes and IDs; numbers use `align: "end"` + `className: "tabular-nums"`") · Test: `packages/ui/registry/ui/data-list.test.tsx`, `packages/ui/registry/ui/data-grid.test.tsx` · Docs: `apps/docs/content/docs/components/data-list.mdx` and `data-grid.mdx` (column API note "`mono` styles body cells only") · Contract: data-table-parts summary unchanged
  - Interfaces — Produces: `headerCellClass(column: DataTableColumnLayout): string` (align, nowrap, minWidth, mobile, `tabular-nums` when the column is numeric), used by `SortableHead` and, through it, by DataList and DataGrid (`data-grid.tsx:955`). Body cells keep `columnCellClass`.
  - Steps: failing test:
    ```tsx
    test("a mono column's header is sans; its body cell is mono", async () => {
      const screen = await render(
        <DataList
          columns={[
            { id: "sku", header: "SKU", mono: true, cell: (r) => r.sku },
          ]}
          data={[{ sku: "A-1" }]}
          getRowId={(r) => r.sku}
        />,
      );
      expect(
        screen.getByRole("columnheader", { name: "SKU" }).element().className,
      ).not.toContain("font-mono");
      expect(
        screen.getByRole("cell", { name: "A-1" }).element().className,
      ).toContain("font-mono");
    });
    ```
    → FAIL → implement → add the same test for DataGrid, and axe for loading, empty and rows → PASS → `pnpm check:component data-table-parts` → commit `fix(data-table): header cells in the sans face (DS-01)`

- [ ] **Task 18: DS-68 and the DS-74 TableCellText size, no extra tab stops**
  - Files — Modify: `packages/ui/registry/ui/data-list.tsx` and `packages/ui/registry/ui/data-grid.tsx` (wrap the body cells in `<TruncationFocusProvider focusable={false}>`; DS-72: `data-list.tsx:318-319` JSDoc uses the `mono` column option and `:338` uses `DataListPager`), `packages/ui/registry/ui/truncated-text.tsx` (`:451` slot `icon-text`; `:541` `TableCellText mono` drops `text-xs`) · Test: `packages/ui/registry/ui/{data-list,data-grid,truncated-text}.test.tsx` · Docs: `apps/docs/content/docs/components/truncated-text.mdx` ("Inside tables and link rows") · Contract: truncated-text slots
  - Interfaces — Consumes: `TruncationFocusProvider` (`truncated-text.tsx:69`). Produces: a `RelativeTime` or clipped `TruncatedText` in a DataList or DataGrid body cell has `tabIndex` -1 or none. 00e Task 4 applies the same provider to `Item` link rows, and Task 21 applies it to Board cards.
  - Steps: failing test:
    ```tsx
    test("Tab from a row link skips the timestamp", async () => {
      const screen = await render(
        <DataList
          columns={COLS_WITH_LINK_AND_TIME}
          data={TWO_ROWS}
          getRowId={(r) => r.id}
        />,
      );
      await userEvent.click(screen.getByRole("link", { name: "Row 1" }));
      await userEvent.tab();
      await expect
        .element(screen.getByRole("link", { name: "Row 2" }))
        .toHaveFocus();
    });
    ```
    → FAIL (focus lands on the timestamp) → implement → add tests: the tooltip still opens on hover, the slot name is `icon-text`, the `TableCellText mono` class has no `text-xs`, and axe → PASS → `pnpm check:component truncated-text` → commit `fix(data): timestamps and clipped cells are not tab stops (DS-68)`

- [ ] **Task 19: DS-27 and DS-71, pager and Pagination links (A11Y-23, VOI-1)**
  - Files — Modify: `packages/ui/registry/ui/pagination.tsx` (`PaginationLink`, `:53-66`: `<a className={buttonVariants({ variant, size })}>` with `aria-current="page"` kept; `:17` `aria-label` from `label?`, default "Pagination"; `:122` "More pages" from `morePagesLabel?`), `packages/ui/upstream/patches/pagination.patch`, `packages/ui/upstream/exception-map.json` (A11Y-23, VOI-1 → pagination), `decisions.json`, the register (A11Y-23 row, VOI-1 row with a new `## 14. Voice & copy` section), `packages/ui/registry/ui/data-list-pager.tsx` (`:111-116` `onPageSizeChange?` optional, and no page-size select without it; `:431-441` and `:481-493` native `button`s through `buttonVariants`; Previous and Next use `aria-disabled` and stay focusable) · Test: `packages/ui/registry/ui/pagination.test.tsx`, `packages/ui/registry/ui/data-list-pager.test.tsx` · Docs: `apps/docs/content/docs/components/pagination.mdx` (Accessibility + Deviations A11Y-23, VOI-1), `apps/docs/content/docs/components/data-list-pager.mdx` ("Without page size") · Registry: pagination and data-list-pager `meta` · Contract: props
  - Interfaces — Produces: `PaginationProps.label?: string`, `PaginationEllipsisProps.morePagesLabel?: string`, `PaginationLink` = an anchor with role `link`, and `DataListPagerProps.onPageSizeChange?: (size: number) => void`.
  - Steps: failing test:
    ```tsx
    test("pagination links keep the link role", async () => {
      const screen = await render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="?page=2">2</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>,
      );
      await expect
        .element(screen.getByRole("link", { name: "2" }))
        .toHaveAttribute("href", "?page=2");
      await expect
        .element(screen.getByRole("navigation", { name: "Pagination" }))
        .toBeInTheDocument();
    });
    ```
    → FAIL (`role="button"`, "pagination") → MK approves A11Y-23 and VOI-1 → run the upstream loop for `pagination` → edit the pager → add tests: the pager's page controls are `button`s, `aria-current` on the current page, the pager with no size select, and axe → fix every block or docs test that asserted `role="button"` on a pagination link (list them in the PR body) → PASS → `pnpm check:component pagination && pnpm check:component data-list-pager` → commit `fix(pagination): links stay links; pager controls are buttons (DS-27, DS-71)`

- [ ] **Task 20: DS-72 JSDoc examples in files this issue does not otherwise touch**
  - Files — Modify: `packages/ui/registry/ui/timeline.tsx` (`:94` `<Avatar size="xs" src>` becomes real `Avatar`/`AvatarImage`/`AvatarFallback` parts), `packages/ui/registry/ui/tool-call-chip.tsx` (`:52` `<Spinner size="inherit" label="">` becomes a real `Spinner` usage)
  - Interfaces — Produces: `@example` blocks that typecheck against the current exports.
  - Steps: edit → verify: `node tooling/verify-public-api-docs.mjs`; paste both examples into a scratch `packages/ui/registry/ui/__jsdoc-scratch.tsx`, run `pnpm --filter @vegastack/ui exec tsc --noEmit`, then delete the scratch file → commit `docs(jsdoc): timeline and tool-call-chip examples use real props (DS-72)`

- [ ] **Task 21: DS-69, Board names**
  - Files — Modify: `packages/ui/registry/ui/board.tsx` (`:444-448` lane list name, `:615-617` menu copy, `:228-245` announcements, `:531` card control name, `:436-437` "Drag a card here" only when drag is on; cards wrapped in `TruncationFocusProvider focusable={false}`; the lane count is muted `tabular-nums` text inside the lane name) · Test: `packages/ui/registry/ui/board.test.tsx` · Docs: `apps/docs/content/docs/components/board.mdx` ("Lane and card labels") · Contract: props
  - Interfaces — Produces: `BoardColumn.label?: string` (required when `title` is not a string, enforced by a dev warning) and `BoardProps<T>.getItemLabel?: (item: T) => string`. Announcements are built from lane and card labels. The lane name is "In progress, 4 cards".
  - Steps: failing test:
    ```tsx
    test("menu moves use the lane label", async () => {
      const screen = await render(
        <Board
          columns={[
            {
              id: "in_progress",
              title: <Badge>In progress</Badge>,
              label: "In progress",
            },
            TODO_COL,
          ]}
          items={ITEMS}
          getItemId={(i) => i.id}
          getItemLabel={(i) => i.title}
          onMove={() => {}}
        />,
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Move Write spec" }),
      );
      await expect
        .element(screen.getByRole("menuitem", { name: "Move to In progress" }))
        .toBeInTheDocument();
    });
    ```
    → FAIL ("Move to in_progress", "Move card") → implement → add tests: the lane list is named by `label`, announcement text uses labels, there is no "Drag a card here" below 768px, and axe → PASS → `pnpm check:component board` → commit `fix(board): lanes, cards and announcements have names (DS-69)`

- [ ] **Task 22: DS-70, late handle registration**
  - Files — Modify: `packages/ui/registry/ui/use-drag-reorder.ts` (`:410`: `getHandleProps` registers on ref attach and unregisters on detach; the drag source reads the current handle at drag start) · Test: `packages/ui/registry/ui/use-drag-reorder.test.tsx`, `packages/ui/registry/ui/sortable-list.test.tsx` · Docs: `apps/docs/content/docs/components/sortable-list.mdx` (a note under "Drag handle")
  - Interfaces — Produces: `getHandleProps(itemId: string): { ref: React.RefCallback<HTMLElement>; … }`, whose registration is live.
  - Steps: failing test:
    ```tsx
    test("a handle mounted after the row still owns the drag", async () => {
      const screen = await render(<SortableFixture initiallyDisabled />);
      await screen.getByRole("button", { name: "Enable row 1" }).click();
      await userEvent.dragAndDrop(
        screen.getByRole("textbox", { name: "Row 1 name" }),
        screen.getByText("Row 3"),
      );
      expect(screen.getByTestId("order").element().textContent).toBe("1,2,3");
    });
    ```
    → FAIL (the whole row drags) → implement → add the positive case (dragging from the handle reorders) → PASS → `pnpm check:component use-drag-reorder` → commit `fix(use-drag-reorder): register handles that mount late (DS-70)`

- [ ] **Task 23: PR 3 changeset and proof**
  - Files — Create: `.changeset/facelift-data.md` (`"@vegastack/ui": minor`, `🐛`, with migration lines "pagination links now have role link", "table headers are no longer mono", "timestamps in tables are no longer tab stops" and "`TableCellText mono` is `text-sm`")
  - Interfaces — Consumes: Tasks 17–22. Produces: the PR 3 commit range.
  - Steps: write the changeset → verify with the "Local proof" block below, then with the visual review of the `data-list`, `data-grid`, `data-list-pager`, `pagination`, `truncated-text`, `board` and `sortable-list` previews (rows, loading, empty, focus-visible, disabled pager; light and dark; 320px and 1280px) → commit `chore: changeset for the data fixes`

### Release and consume

- [ ] **Task 24: hand back, then ship on MK's own `ship it`**
  - Files — none
  - Interfaces — Produces: a published registry minor, deployed to design.vegastack.com, with the version recorded for Regent.
  - Steps: report to MK with the branch, the three PR ranges, verification output, the rows used and any stop taken → stop. On MK's own `ship it` in this repo (Regent's standing approval does not cover it), follow `skills/internal/ship/SKILL.md` for each PR in order: push, PR, green `PR quality`, exact-SHA squash merge. Then the Version Packages PR (approve its `action_required` run), exact-SHA merge, OIDC publish, `deploy.yml`, production probe → verify: `npm view @vegastack/design version`, and the registry version and `/r/field.json` integrity on design.vegastack.com.

- [ ] **Task 25: Regent consume (in the Regent repo, branch `chore/137-consume-ds-fixes`)**
  - Files — Modify: `package.json` + `pnpm-lock.yaml` (`@vegastack/design`), `src/components/ui/{field,input,textarea,input-group,select,combobox,password-input,date-picker,page-header,app-shell,relative-time,editable-cell,multi-step-form,provider,toast,data-table-parts,data-list,data-list-pager,truncated-text,board,use-drag-reorder,pagination}.tsx` (the `shadcn` overwrite), `.agents/skills/**` + `.claude/skills/**` (refresh), `CHANGELOG.md` (`[Unreleased]`), and only the tests that the refresh breaks
  - Interfaces — Consumes: the published registry version from Task 24. Produces: `pnpm check:design-drift` clean for every item listed.
  - Steps: `pnpm up @vegastack/design@<version> && pnpm install` → `pnpm exec vegastack-design skills install --force && diff -r .agents/skills .claude/skills` is empty → `pnpm exec vegastack-design check-updates` → for each item, `pnpm exec shadcn add @vegastack/<name> --diff`, read the diff (stop if it shows changes this issue did not make), then `--overwrite` → fix only the tests the refresh broke → verify: `pnpm check:design-drift`, `pnpm run ci`, `pnpm test:browser` → changelog line from the brief → run `node scripts/check-review-policy.mjs` before dispatching review → commit `chore: consume design-system facelift fixes`

## Local proof (each PR, before hand-back)

```bash
pnpm upstream:check && pnpm upstream:selftest
pnpm registry:build && git status --short            # the tree must be clean after the build commits
pnpm design:derived && pnpm design:derived:check
pnpm check:affected                                   # the plan's selection is read, not just the exit code
pnpm lint                                              # includes changeset-lint and the upstream gates
pnpm verify:static
pnpm verify                                            # static + working-tree affected Chromium
node tooling/changelog-assemble.mjs --dry-run && node tooling/changelog-assemble.mjs --check
node tooling/changelog-lint.mjs
node tooling/sync-toaster-mirror.mjs --check           # PR 2
pnpm --filter @vegastack/ui exec vitest run test/geometry.browser.test.tsx -t "select-trigger-width|inline-trigger-row|app-shell-page-320"
```

Visual review follows `skills/internal/ship/references/visual-review.md`: start `pnpm -F @vegastack/docs dev` in the worktree and check each touched preview in light and dark at 320px and 1280px, with the states named in the task. Captures are temporary and never committed. The PR body names what was inspected.

## Stop points

1. **Plan approval**: MK approves this file before any code.
2. **Register gate**: 00d's REG commit is on `main`. Before that, only the tasks Task 0 lists proceed.
3. **Each decision row**: API-26, API-24, OVL-17, A11Y-23 and VOI-1 are each added only after MK approves that row. A declined row stops its item. The rest ships, and the blocked Regent child issues are named in the hand-back.
4. **DS-47 spike (D3)**: a structural rewrite of an upstream file stops DS-47.
5. **`ship it`**: MK's own words in this repo. Nothing is pushed before then.
6. **Standing stops**: a consumer diff showing items this issue did not touch; any trust-boundary change (secrets, Access, workflow permissions, runner trust, sanctioned dependencies, version reversal); `npx`/`dlx @latest` with CF Access vars loaded.

## Out of scope

Everything the brief excludes: 00d doctrine (DS-03 doc half, DS-25, DS-26, DS-29, DS-72 meta strings, DS-73…DS-75 prose, the register commit), 00e items (including the `item.tsx` DS-68 hunk, which rides 00e's A11Y-7 amendment), 00b and 00c items, the deferred optional items, the low-severity audit bugs listed for a follow-up issue, Regent page changes and wrapper deletions, and any sanctioned-dependency, CI, runner, Access or version-reversal change.
