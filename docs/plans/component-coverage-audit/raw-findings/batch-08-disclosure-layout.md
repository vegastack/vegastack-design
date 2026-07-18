# BATCH 8 — Disclosure & Layout/Structure — Documentation Coverage Audit

READ-ONLY audit. Ground truth = canonical `.tsx` + `.test.tsx`. Demonstrated = `.mdx` + `preview/*.tsx`.

## BATCH SUMMARY

- Components audited: **6** (accordion, collapsible, card, separator, scroll-area, page-header)
- Files present: **24/24** (all four files exist for every component)
- Overall: docs quality is **high** across the batch. No missing pages, no thin previews. Gaps are mostly **VARIANT/MATRIX** (a few CVA/enum values not demonstrated in a preview) and a couple of **API** completeness items (un-documented subcomponent type, plus AutoTypeTable coverage of `ScrollBar` thumb/corner).
- Most-complete: **accordion**, **collapsible**, **card** (near-perfect). Most gaps: **scroll-area** (`both` axis undemonstrated), **page-header** (`onBack`/`secondaryMenu`/back-button not shown in a live preview, only code blocks).

| Component | Proposed Category | One-line reason |
| --- | --- | --- |
| accordion | Disclosure | A single/multiple-open group of collapsible sections with a coordinated open model. |
| collapsible | Disclosure | A single toggleable show/hide region (the atomic disclosure primitive). |
| card | Layout & Structure | A borders-only content-grouping surface with compound header/content/footer parts. |
| separator | Layout & Structure | A thin rule that divides content; structural/visual, not interactive. |
| scroll-area | Layout & Structure | A bounded scroll container with custom scrollbars; a layout/overflow primitive. |
| page-header | Layout & Structure | The standardized page-top header composition (title + breadcrumb + actions). |

Coverage scoring legend: ✓ full · ◑ minor gap · ◔ notable gap.

---

## accordion
- files: canonical ✓ | test ✓ | mdx (`accordion.mdx`) ✓ | preview ✓
- exports/subcomponents: `Accordion` (Root), `AccordionItem`, `AccordionTrigger`, `AccordionContent`. (Note: no `AccordionHeader` is exported — the heading wrapper is internal to `AccordionTrigger`.)
- proposed category: **Disclosure** — coordinated single/multiple-open group of collapsible sections.

### API surface (ground truth)
- `Accordion` = Base UI `Accordion.Root` props. Key behavioral props: `multiple` (single-open default vs multiple-open), `value`/`onValueChange` (controlled, array), `defaultValue` (uncontrolled, array). (canonical:14, :22–23, doc-comment :22–23)
- `AccordionItem` = `Accordion.Item` props; key prop `value` (unique id) + `disabled` (lock section). (canonical:54–59)
- `AccordionTrigger` = `Accordion.Trigger` props; renders `ChevronDown` that rotates 180° via `group-data-[panel-open]`. (canonical:78, :101–107)
- `AccordionContent` = `Accordion.Panel` props; height-animates via `--accordion-panel-height`. (canonical:120, :133–139)
- States: collapsed/expanded (`data-panel-open`, `aria-expanded`), disabled (`data-disabled`), single vs multiple open. (test:33–39, :60–67, :69–80)

### Currently demonstrated
- preview `accordion` → 3-item FAQ, `defaultValue={['what']}`, **single-open default**. (preview:13–40)
- preview `accordionMultiple` → `multiple` + `defaultValue={['shipping','returns']}` (two open at once) + one `disabled` item. (preview:42–67)
- mdx sections: Installation ✓, Usage ✓, Anatomy ✓ (all 4 parts described w/ data-slots), Examples ✓ (both previews), API Reference ✓ (4 AutoTypeTables), Accessibility ✓ (button-in-heading, aria-controls/aria-expanded, key table, disabled), Do/Don't ✓.
- API table status: AutoTypeTable present for **all 4** subcomponents (mdx:79–85). ✓ Complete.

### GAPS
- [VARIANT] none — single, multiple, disabled, default-open all demonstrated.
- [MATRIX] none — the two previews cover the meaningful axis (single vs multiple).
- [API] Controlled mode (`value`/`onValueChange`) is described in prose/Anatomy (mdx:57) but never shown in a code block or preview; minor. AutoTypeTable coverage itself is complete.
- [PROSE] Minor stale/inaccuracy: Anatomy says `AccordionItem` has "`data-open` when expanded" (mdx:59) — the canonical item sets no `data-open`; Base UI emits `data-panel-open` on the trigger (tests assert `data-panel-open`/`aria-expanded`, not `data-open`, accordion.test:33–41). Verify the item attribute name before trusting this line.
- [STRUCTURE] none — standard section order present.
- [MISSING] none.

### Verdict
- coverage: ✓ (excellent)
- effort: **S**
- top 3 fixes: (1) confirm/correct the `AccordionItem` "`data-open`" claim in Anatomy (mdx:59); (2) optional: add a controlled-mode code snippet; (3) none material otherwise.

---

## collapsible
- files: canonical ✓ | test ✓ | mdx (`collapsible.mdx`) ✓ | preview ✓
- exports/subcomponents: `Collapsible` (Root), `CollapsibleTrigger`, `CollapsibleContent`.
- proposed category: **Disclosure** — the atomic single-region show/hide primitive.

### API surface (ground truth)
- `Collapsible` = Base UI `Collapsible.Root` props. Key: `open`/`onOpenChange` (controlled), `defaultOpen` (uncontrolled), `disabled`. (canonical:21, :29–31; test:60–71 disabled)
- `CollapsibleTrigger` = `Collapsible.Trigger`; open state via `data-panel-open`; composed chevron rotates via `data-[panel-open]:[&_svg]:rotate-180`. (canonical:55, :73)
- `CollapsibleContent` = `Collapsible.Panel`; height-animates via `--collapsible-panel-height`; unmounted while closed by default (`keepMounted={false}`), supports `keepMounted`/`hiddenUntilFound`. (canonical:88; mdx:75; test:28 asserts panel absent when closed)
- States: open/closed (`aria-expanded`, `data-open`/`data-panel-open`), disabled (`data-disabled`). (test:31–41, :60–71)

### Currently demonstrated
- preview `collapsible` (default preview) → `defaultOpen`, bordered Pro-plan disclosure with chevron. (preview:9–26)
- preview `collapsibleStates` → 3 stacked: **closed-by-default**, **open-by-default**, **disabled**. (preview:28–60)
- mdx sections: Installation ✓, Usage ✓ (w/ chevron + padding note), Anatomy ✓, **Padding callout** ✓ (blockquote, mdx:50), Examples ✓, API Reference ✓ (3 AutoTypeTables), Accessibility ✓ (aria-expanded/controls, keepMounted/hiddenUntilFound note, key table), Do/Don't ✓ (correctly steers to Accordion for single-open groups).
- API table status: AutoTypeTable for **all 3** parts (mdx:60–70). ✓ Complete.

### GAPS
- [VARIANT] none — open, closed, disabled, default-open all shown.
- [MATRIX] none.
- [API] Controlled `open`/`onOpenChange` mentioned in Anatomy (mdx:46) but not shown in a snippet; `keepMounted`/`hiddenUntilFound` mentioned in Accessibility (mdx:75) but not demonstrated. Both minor; AutoTypeTable coverage complete.
- [PROSE] none stale found — Padding callout, the "use Accordion instead" Do/Don't, and the `keepMounted={false}` claim all match canonical/tests.
- [STRUCTURE] none.
- [MISSING] none.

### Verdict
- coverage: ✓ (excellent)
- effort: **S**
- top 3 fixes: (1) optional controlled-mode snippet; (2) optional `keepMounted`/`hiddenUntilFound` example for in-page find; (3) none material.

---

## card
- files: canonical ✓ | test ✓ | mdx (`card.mdx`) ✓ | preview ✓
- exports/subcomponents: `Card` (root, with dotted parts) + flat exports `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`. (canonical:183–200)
- proposed category: **Layout & Structure** — a borders-only content-grouping surface with compound parts.

### API surface (ground truth)
- `Card` (root) CVA-ish prop: **`size`** = `'default' | 'sm'` (`sm` tightens padding/gaps via `data-size`). (canonical:10–16, :46–49; test:29–32)
- Footer-aware padding: `has-data-[slot=card-footer]:pb-0` (root drops bottom pad when a footer is present). (canonical:48)
- `Card.Header` switches to two-column grid when a `Card.Action` is present (`has-data-[slot=card-action]:grid-cols-[1fr_auto]`). (canonical:73)
- All 7 parts are plain server-safe `div`s with `data-slot` + forwarded ref; no `'use client'`. (canonical:3, header note)
- Parts: Header, Title, Description, Action, Content, Footer. (test:34–55 asserts all 6 slot attrs)

### Currently demonstrated
- preview `card` (default) → Header (Title + Description) + Content, no footer. (preview:10–24)
- preview `cardWithFooter` → Header + **Action** (`Badge color="purple"`) + Content + **Footer** (Cancel/Upgrade buttons, `justify-end`). (preview:26–47)
- mdx sections: Installation ✓, Usage ✓, Anatomy ✓ (all 7 parts + data-slots + "flat named exports" note mdx:54), Examples ✓ (`cardWithFooter`), API Reference ✓ (**7 AutoTypeTables** — root + all 6 parts), Accessibility ✓ (presentational/no role, real heading inside Title, borders-only/forced-colors), Do/Don't ✓.
- API table status: AutoTypeTable for root + **every** part (mdx:67–97). ✓ Complete — best-in-batch subcomponent coverage.

### GAPS
- [VARIANT] `size="sm"` (the only real variant axis) is **never demonstrated in a preview** — only described in Anatomy (mdx:46) and tested (test:29). A `default` vs `sm` side-by-side would show the density difference. Tagged real.
- [MATRIX] A small **default vs sm** grid would reveal the padding/gap/title-size delta (canonical:49, :94, :149, :170). Worth adding; this is the one MATRIX gap in the card.
- [API] none — AutoTypeTable coverage is complete for all parts incl. `CardActionProps`.
- [PROSE] none stale found. Accessibility correctly notes Title is a `div` and recommends a real heading inside (matches canonical:85 `div`). The footer-present `pb-0` behavior is not called out in prose (cosmetic, optional).
- [STRUCTURE] none.
- [MISSING] none.

### Verdict
- coverage: ◑ (one real variant undemonstrated)
- effort: **S**
- top 3 fixes: (1) add a `size="sm"` preview (or default-vs-sm pair); (2) optionally note footer-present padding behavior in Anatomy; (3) none otherwise.

---

## separator
- files: canonical ✓ | test ✓ | mdx (`separator.mdx`) ✓ | preview ✓
- exports/subcomponents: `Separator` (single component).
- proposed category: **Layout & Structure** — a thin dividing rule (visual/semantic), non-interactive.

### API surface (ground truth)
- Props: **`orientation`** = `'horizontal' | 'vertical'` (default `horizontal`); **`decorative`** = boolean (default `true`). (canonical:9–25)
- `decorative=true` → `role="presentation"` + `aria-hidden`, `aria-orientation` removed; `decorative=false` → real `role="separator"` + `aria-orientation`. (canonical:43–45; test:7–30)
- `data-orientation` set on both. (test:12, :28)

### Currently demonstrated
- preview `separator` (default) → horizontal rule between blocks + inline **vertical, semantic** dividers (`decorative={false} orientation="vertical"`) between Docs/Components/Tokens. (preview:8–27)
- preview `separatorVertical` → 3 inline **vertical, semantic** dividers in a flex row. (preview:29–41)
- mdx sections: Installation ✓, Usage ✓, Examples ✓, **Orientation** section ✓ (separate preview), API Reference ✓ (1 AutoTypeTable), Accessibility ✓ (decorative-by-default rationale + attribute table), Do/Don't ✓.
- API table status: AutoTypeTable `SeparatorProps` present (mdx:39). ✓ (single component, fully covered.)

### GAPS
- [VARIANT] Both `orientation` values shown ✓. `decorative` axis is **lopsided**: every demonstrated separator that's labeled is `decorative={false}` (preview:19,21,34,36); the **default decorative horizontal** rule appears (preview:16 `<Separator className="my-4" />`) but the doc never visibly contrasts decorative vs semantic (they render identically, so this is acceptable — flagging as minor only). No `decorative={true}` vertical shown, but that combination is rarely meaningful.
- [MATRIX] none needed — a decorative-vs-semantic grid wouldn't reveal a *visual* difference (the difference is ARIA-only, already covered by the attribute table mdx:50–54).
- [API] none.
- [PROSE] none stale. Attribute table (mdx:50–54) accurately matches canonical role/aria behavior and tests.
- [STRUCTURE] none — note it adds a dedicated "Orientation" section (good).
- [MISSING] none.

### Verdict
- coverage: ✓ (excellent for a 2-prop primitive)
- effort: **S**
- top 3 fixes: (1) none material; optionally note in prose that the default horizontal rule in the first preview is decorative to make the contrast explicit; (2)/(3) n/a.

---

## scroll-area
- files: canonical ✓ | test ✓ | mdx (`scroll-area.mdx`) ✓ | preview ✓
- exports/subcomponents: `ScrollArea` (composes Root→Viewport→Scrollbar→Thumb→Corner) + `ScrollBar` (single-axis bar, exported for custom layouts). Internal slots: `scroll-area-viewport`, `scroll-area-scrollbar`, `scroll-area-thumb`, `scroll-area-corner`.
- proposed category: **Layout & Structure** — bounded scroll/overflow container with custom scrollbars.

### API surface (ground truth)
- `ScrollArea.orientation` = `'vertical' | 'horizontal' | 'both'` (default `vertical`); `both` also renders the corner. (canonical:59–68, :115–123)
- `ScrollArea.scrollbarProps` (props forwarded to auto-rendered bars, e.g. `keepMounted`). (canonical:75–79; test uses it throughout)
- `ScrollArea` accepts `aria-label`/`aria-labelledby` → applied to the focusable viewport (`tabIndex={0}`). (canonical:96–110; test:30–42)
- `ScrollBar.orientation` = `'vertical' | 'horizontal'` (default `vertical`); auto-hides, fades on `data-hovering`/`data-scrolling`. (canonical:9–17, :38–44)

### Currently demonstrated
- preview `scrollArea` (default) → **vertical** bounded list (`h-56 w-56`), 40 tags. (preview:10–28)
- preview `scrollAreaHorizontal` → **horizontal** row (`orientation="horizontal"`, width-bounded). (preview:30–47)
- mdx sections: Installation ✓, Usage ✓ (+ bounded-size note), Anatomy ✓ (Root/Viewport/Scrollbar/Thumb/Corner + `scrollbarProps`), Examples ✓ (Vertical + Horizontal subsections), API Reference ✓ (2 AutoTypeTables: `ScrollAreaProps`, `ScrollBarProps`), Accessibility ✓ (focusable viewport, aria-label passthrough, scroll-key table, overscroll-contain), Do/Don't ✓.
- API table status: AutoTypeTable for `ScrollAreaProps` + `ScrollBarProps` (mdx:72–80). ✓ Both public prop interfaces covered.

### GAPS
- [VARIANT] **`orientation="both"`** is documented in Anatomy/Usage (mdx:35, :50 corner) and tested (test:79–103) but has **no preview** — the dual-axis + corner case (the most visually distinct one) is undemonstrated. Tagged real. (Only `vertical` and `horizontal` previews exist.)
- [MATRIX] A `vertical | horizontal | both` trio would be useful precisely because `both` adds the corner and dual scrollbars — the one place a matrix reveals a real difference. Currently 2 of 3 axes shown.
- [API] Minor: `scrollbarProps` is a real prop but only shown in Anatomy text (mdx:47–48); the thumb/corner are runtime sub-elements (not exported components) so AutoTypeTable for them isn't applicable — documenting them via the slot list (mdx:49–50) is the right call. No missing AutoTypeTable.
- [PROSE] none stale found. The bounded-size requirement, auto-hide behavior, and `overscroll-contain` claims all match canonical.
- [STRUCTURE] none.
- [MISSING] **`orientation="both"` preview** is the one missing demonstration.

### Verdict
- coverage: ◑ (`both` axis undemonstrated)
- effort: **S–M**
- top 3 fixes: (1) add a `orientation="both"` dual-axis preview (shows the corner + both bars); (2) optionally a `scrollbarProps`/`keepMounted` note in Usage; (3) none otherwise.

---

## page-header
- files: canonical ✓ | test ✓ | mdx (`page-header.mdx`) ✓ | preview ✓
- exports/subcomponents: `PageHeader` (main) + `FavoriteStar` (exported, canonical:232). Type interfaces: `PageHeaderProps`, `PageHeaderFavorite`. Internal slots: `page-header`, `-breadcrumb`, `-back`, `-title`, `-favorite`, `-description`, `-actions`.
- proposed category: **Layout & Structure** — the standardized page-top header composition.

### API surface (ground truth)
- `PageHeaderProps`: `title` (ReactNode→`<h1>`, required), `description?`, `breadcrumb?`, `backHref?` (→`<a>`), `onBack?` (→`<button>`, takes precedence over `backHref`, canonical:170,181–202), `backLabel?` (default `'Go back'`), `actions?`, `secondaryMenu?`, `favorite?: PageHeaderFavorite`, plus `children` (rendered below the row). (canonical:43–91)
- `PageHeaderFavorite`: `active?` (controlled), `defaultActive?` (uncontrolled, default false), `onToggle?`, `label?` (default `'Favorite'`), `disabled?`. Star uses `aria-pressed` + `data-active`, fill `text-warning-text`. (canonical:15–41, :97–128; test:64–90)
- States: with/without back (link vs button), with/without breadcrumb, with/without actions, with/without secondaryMenu, favorite controlled/uncontrolled/disabled. (test throughout)

### Currently demonstrated
- preview `pageHeader` (default) → title + description + **favorite star** (`defaultActive`) + single action. (preview:10–21)
- preview `pageHeaderWithBreadcrumb` → **backHref** (link) + full **Breadcrumb** + description + two **actions**. (preview:23–56)
- mdx sections: Installation ✓, Usage ✓ (+ presentational note + client-render rationale), Anatomy ✓ (all 7 slots described), Examples ✓ (1 preview + 3 code-only subsections: Back navigation, Favorite star, Secondary menu), API Reference ✓ (2 AutoTypeTables: `PageHeaderProps` + `PageHeaderFavorite`), Accessibility ✓ (single h1, labelled nav, aria-pressed star, focus-visible), Do/Don't ✓.
- API table status: AutoTypeTable for `PageHeaderProps` + `PageHeaderFavorite` (mdx:120–122). ✓ Both interfaces covered. (`FavoriteStar` component export has no AutoTypeTable, but its props ARE `PageHeaderFavorite`, which is documented — acceptable.)

### GAPS
- [VARIANT] **`onBack` (imperative button back affordance)** is shown only as a code snippet (mdx:84), never in a live preview — only `backHref` (link) is rendered (preview:27). The two render different elements (`<button>` vs `<a>`, canonical:181–202), so a preview of the button path is warranted. Tagged real.
- [VARIANT] **`secondaryMenu`** slot — code-only (mdx:105–116), no live preview. Minor (it's a host-composed slot), but the actions+secondaryMenu right-side layout is never shown rendered.
- [VARIANT] **`favorite` controlled** + **`disabled`** states — code-only (mdx:96, canonical disabled:118); only uncontrolled `defaultActive` is rendered. Minor.
- [MATRIX] A "minimal `<PageHeader title>` only" vs "fully-loaded" pair would show the progressive-disclosure of slots; currently both previews are fairly loaded. Low value — optional.
- [API] none — both public interfaces have AutoTypeTables. `FavoriteStar` export is undocumented as a standalone component but its prop type is documented; flag as cosmetic only.
- [PROSE] none stale found. Anatomy slot list, the `onBack`-takes-precedence note, and single-h1 a11y claims all match canonical/tests. `children`-renders-below is stated (mdx:53) and matches canonical:227.
- [STRUCTURE] none — rich Examples section with multiple subsections.
- [MISSING] No rendered preview for the `onBack` button path or `secondaryMenu`; these are the meaningful undemonstrated render branches.

### Verdict
- coverage: ◑ (back-button/onBack + secondaryMenu rendered states missing; code-only)
- effort: **M**
- top 3 fixes: (1) add a preview using `onBack` (renders the `<button>` back affordance) and/or `secondaryMenu` rendered; (2) optionally a controlled/disabled favorite preview; (3) optionally a minimal title-only preview to anchor the progressive composition.
