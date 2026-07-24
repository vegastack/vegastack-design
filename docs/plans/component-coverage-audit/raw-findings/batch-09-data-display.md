# BATCH 9 — Data Display / Content audit (table, avatar, badge, image, truncated-text, marker)

## BATCH SUMMARY

Files present for all six: canonical ✓ · test ✓ · mdx ✓ · preview ✓ (6/6 complete, no missing pages, no thin previews).

Findings by component (count of tagged GAP lines):

- **table** — 4 (1 VARIANT, 1 PROSE, 1 STRUCTURE, 1 MATRIX)
- **avatar** — 3 (2 API, 1 PROSE) — biggest gap: undocumented `AvatarGroup.spacing`, undocumented `fallbackDelay`, "status" claimed by audit prompt but **not** in API (correctly absent).
- **badge** — 2 (1 MATRIX, 1 VARIANT) — strongest page in the batch.
- **image** — 3 (1 VARIANT, 1 API, 1 PROSE) — `rounded` axis entirely undemonstrated.
- **truncated-text** — 1 (1 VARIANT) — `IconText`/`TableCellText` have NO live preview (code-block only).
- **marker** — 2 (1 API, 1 PROSE) — `MarkerIconProps`/`MarkerContentProps` missing from API Reference.

Overall coverage is high; no catastrophic gaps. Recurring theme: **secondary subcomponents and secondary CVA axes are documented in prose/code-blocks but not given AutoTypeTable rows or live previews** (avatar group spacing, marker icon/content, image rounded, truncated-text IconText/TableCellText).

### Proposed category table

| Component      | Category                            | One-line reason                                         |
| -------------- | ----------------------------------- | ------------------------------------------------------- |
| table          | Data Display                        | Tabular data primitives (thead/tbody/tfoot/caption).    |
| avatar         | Data Display                        | User/entity identity media + group stack.               |
| badge          | Data Display (Status)               | Compact status/label chip with semantic color families. |
| image          | Data Display (Media)                | Framed presentational media with loading/error states.  |
| truncated-text | Typography & Content                | Text clamping + overflow-aware tooltip reveal.          |
| marker         | Typography & Content (Conversation) | Inline thread annotation rows (status/separator/link).  |

---

## table

- files: canonical ✓ | test ✓ | mdx (`table.mdx`) ✓ | preview ✓
- exports/subcomponents: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` (8 parts; all `React.ComponentPropsWithoutRef<native>`, no CVA on any part)
- proposed category: **Data Display** — semantic native-table primitives for tabular data.

### API surface (ground truth)

- No CVA axes anywhere; every part is a thin styled wrapper over a native element with `data-slot`. Props = native element props + `className` (canonical:7,50,70,90,113,137,162,186).
- States expressed via attributes, not props: `TableRow` hover → `hover:bg-accent`; selected → `data-selected:bg-accent` (canonical:128). `TableHead` collapses right padding for `[role=checkbox]` (canonical:153); `TableCell` same (canonical:177).
- `TableFooter` = muted bg + top border for totals (canonical:103). `Table` always wraps a scroll container `data-slot="table-container"` (canonical:38).
- Test confirms: caption/header/body/cells render (test:16), all 8 data-slots present incl. footer (test:46–74), `data-selected` on row (test:77), ref→`HTMLTableElement` (test:94), axe clean with `scope="col"` + caption + footer (test:109).

### Currently demonstrated

- preview exports: `table` (invoice table: scope=col heads, Badge status cells, font-mono amounts, NO caption/footer) and `tableWithCaptionAndFooter` (caption + a `data-selected` row on INV-002 + footer totals row with `colSpan={2}`).
- mdx sections: Installation · Usage · **Anatomy** (full part-by-part list) · Examples (only `tableWithCaptionAndFooter`) · API Reference (8 AutoTypeTables — one per part) · Accessibility (caption, scope, data-selected↔aria-selected, forced-colors) · Do/Don't. Strong, complete prose.
- API table status: **complete** — all 8 subcomponent prop types have an AutoTypeTable (mdx:92–130). Note these resolve to bare native props (no custom fields), so rows will be generic, but coverage is correct.

### GAPS

- [VARIANT] Hover state is never _shown_ as a distinct visual in any preview (it's interaction-only and static screenshots can't capture it) — acceptable, but the **checkbox-cell padding collapse** (`[&:has([role=checkbox])]:pr-0`, canonical:153,177) and a **selectable/checkbox-column table** are never demonstrated. The selection story is only a passive `data-selected` highlight; no row-with-checkbox example exists.
- [MATRIX] No example pairs a **header row + footer in the same default (non-overflow) layout next to a wide/horizontally-scrolling table** — the `overflow-x-auto` container (canonical:38, the component's headline feature) is never demonstrated overflowing (both previews use `justify-stretch` and fit). The signature "wide tables never overflow" behavior is undemonstrated.
- [PROSE] Anatomy bullet for `Table` says `data-slot="table"` but the _container_ is `data-slot="table-container"` — mdx:70 correctly notes both, no error. However Usage import block (mdx:18–25) **omits `TableFooter` and `TableCaption`** from the example import though both appear in Anatomy/Examples — minor inconsistency for a copy-paste user.
- [STRUCTURE] Sections present and well-ordered (Installation→Usage→Anatomy→Examples→API→Accessibility→Do/Don't). No dedicated "States" section, but table has no prop-driven states so this is fine. The keyboard table (mdx:145) is generic Tab/Enter — accurate.

### Verdict

- coverage: **High (~85%)** — prose and API tables are exemplary; only the overflow-scroll headline feature and a checkbox/selectable column lack a live demo.
- effort: **S**
- top 3 fixes: (1) add a preview that actually overflows horizontally to show the scroll container; (2) add a selectable example with a `[role=checkbox]` column (exercises the `pr-0` padding rule); (3) add `TableFooter`/`TableCaption` to the Usage import snippet.

---

## avatar

- files: canonical ✓ | test ✓ | mdx (`avatar.mdx`) ✓ | preview ✓
- exports/subcomponents: `Avatar`, `AvatarGroup`, plus exported `avatarVariants`, `avatarGroupVariants`. Types `AvatarProps`, `AvatarGroupProps`.
- proposed category: **Data Display** — identity media (image+initials) and a collaborator stack.

### API surface (ground truth)

- `Avatar` CVA axis: **size** = `xs`(24) / `sm`(28) / `default`(32) / `lg`(40) / `xl`(48) (canonical:23–29). 5 values.
- `Avatar` key props: `src`/`alt` (discriminated union `AvatarImageContract` — alt required when src given, optional otherwise; canonical:35–55), `fallback` (ReactNode), **`fallbackDelay`** (ms before showing fallback, forwarded to Base UI `Avatar.Fallback`; canonical:69–73,126).
- `AvatarGroup` CVA axis: **spacing** = `tight`(-space-x-3) / `default`(-space-x-2) / `loose`(-space-x-1) (canonical:148–154). 3 values. Each child gets `ring-2 ring-background` (canonical:146).
- States: image-loading (fallback shows), image-error (fallback shows), no-src (bare `bg-accent` circle or fallback). **No status/online-dot prop exists** (audit prompt mentions "status" — correctly NOT in the API; do not flag as missing feature).
- Test: fallback when no src + no `<img>` (test:12), img+alt when loaded (test:23), decorative `alt=""` (test:33), `data-size` attr (test:42), group renders children+slot (test:49), refs (test:63,70), axe clean (test:81).

### Currently demonstrated

- preview exports: `avatar` (image avatar + initials-only fallback), `avatarSizes` (all 5 sizes xs→xl, **all with src** — fallback never visible at non-default sizes), `avatarGroup` (3 images + "+5" overflow, **default spacing only**).
- mdx sections: Installation · Usage · presentational callout · Anatomy · **Sizes** · **Fallback** · **Group** · API Reference (AvatarProps + AvatarGroupProps) · Accessibility (alt/decorative/fallback/wrap-in-interactive) · Do/Don't. Well structured.
- API table status: `AvatarProps` + `AvatarGroupProps` both present (mdx:67–75).

### GAPS

- [API] **`fallbackDelay`** prop is in `AvatarProps` (canonical:69–73) and will appear in the AutoTypeTable, but is **never demonstrated or even mentioned in prose** — no example shows the delay-before-fallback behavior. Documented by the type table only.
- [API] **`AvatarGroup.spacing`** has 3 values (`tight`/`default`/`loose`) but the preview only shows `default`, and prose names the three options (mdx:61) without a visual. No matrix of the spacing axis — `tight` vs `loose` overlap difference is invisible.
- [PROSE] The "Fallback" section (mdx:52) and `avatar` preview show the fallback only via the _no-src_ path. The **image-error fallback path** (the more important "never a broken-image icon" guarantee, canonical:118–125) is never shown in a preview — there is no broken-`src` avatar example (contrast with `image.tsx` which does show its error fallback). Frontmatter description (mdx:3) claims "five sizes" — accurate.

### Verdict

- coverage: **High (~80%)** — sizes + group + fallback-by-absence all shown; the two CVA-adjacent gaps are `spacing` matrix and `fallbackDelay`, plus the error-path fallback.
- effort: **S**
- top 3 fixes: (1) add an `AvatarGroup` spacing matrix (tight/default/loose side by side); (2) add a broken-`src` avatar so the error→initials fallback is visible; (3) mention/demo `fallbackDelay` (even one line).

---

## badge

- files: canonical ✓ | test ✓ | mdx (`badge.mdx`) ✓ | preview ✓
- exports/subcomponents: `Badge`, `badgeVariants`. Type `BadgeProps`. (single component, no subparts)
- proposed category: **Data Display (Status)** — compact status/label chip.

### API surface (ground truth)

- CVA axes: **variant** = `subtle`(default) / `solid` / `minimal` (canonical:24–27); **color** = `default` / `purple` / `success` / `warning` / `destructive` / `info` (6, canonical:29–36); **size** = `sm` / `default` / `lg` (canonical:37–42). Full grid = 3×6×3 = 54 combos, governed by compound variants (canonical:44–116).
- Boolean props: **`dot`** (leading indicator, colored per family; suppressed while loading; canonical:168–173,205), **`loading`** (spinner + `aria-busy`, takes precedence over dot/icon; canonical:174–179,223). **`render`** for polymorphism (canonical:180–184).
- Icons composed as `children` (leading svg auto-sized via `[&_svg]` rules canonical:38–41).
- Test: default span+slot (test:7), variant/color/size data-attrs (test:14), dot renders aria-hidden (test:26), loading→aria-busy+data-loading+spinner+motion-reduce (test:33), render→link (test:48), axe (test:55), ref (test:60).

### Currently demonstrated

- preview exports: `badge` (success+dot), `badgeVariants` (subtle/solid/minimal, **all purple**), `badgeColors` (all 6 colors in **subtle** row + all 6 in **solid** row), `badgeSizes` (sm/default/lg, all info), `badgeStates` (dot, icon, loading, solid+icon, minimal+icon).
- mdx sections: Installation · Usage · **Variants** · **Colors** · **Sizes** · **States** · API Reference (BadgeProps) · Accessibility (non-interactive span, decorative dot/spinner, aria-busy, motion-reduce, render-link) · Do/Don't. Complete and well-organized.
- API table status: `BadgeProps` present (mdx:54).

### GAPS

- [MATRIX] **`minimal` variant is shown only once** (purple, in `badgeVariants`, and info in `badgeStates`). The `badgeColors` matrix (mdx:37) covers **subtle × 6 + solid × 6 but omits the entire `minimal × 6` row** — so 6 of the 18 variant×color compound-variant pairs (canonical:106–115) are never rendered. The minimal treatment per color family is undemonstrated.
- [VARIANT] **`dot` on `solid` variant** uses a special branch `dotClass = "bg-current"` (canonical:207) instead of the family color — this distinct behavior is never shown (all `dot` examples are subtle/minimal; `badgeStates` solid example uses an icon, not a dot). The solid-dot rendering path has no preview.

### Verdict

- coverage: **High (~90%)** — the strongest page in the batch; all three axes + dot + loading + icon + render covered.
- effort: **S**
- top 3 fixes: (1) add the `minimal × 6 colors` row to the Colors matrix; (2) add a `solid` + `dot` example to show the `bg-current` dot; (3) (nice-to-have) note in States that `dot` is ignored while `loading` (canonical:205 — tested but not in prose).

---

## image

- files: canonical ✓ | test ✓ | mdx (`image.mdx`) ✓ | preview ✓
- exports/subcomponents: `Image`, `imageVariants`. Type `ImageProps`. (single component)
- proposed category: **Data Display (Media)** — framed presentational image with loading/error states.

### API surface (ground truth)

- CVA axes: **aspectRatio** = `square`(1:1) / `video`(16:9) / `auto`(default) (canonical:18–26); **rounded** = `none` / `sm` / `md`(default) / `lg` / `full` (canonical:27–33). 5 rounded values.
- Key props: `src?` (optional — absent ⇒ error/fallback state, canonical:122–125), `alt` **required** (canonical:53), `fallback` (ReactNode shown on error or no-src, canonical:69–73).
- States (internal `status`): **loading** (pulsing `bg-muted` skeleton, `aria-hidden`, motion-reduce-safe; canonical:159–165), **loaded** (image fades in `opacity-100`, `object-cover`; canonical:148–153), **error/empty** (`fallback` slot; canonical:168–175). `data-state` reflects status (canonical:139).
- Test: img src+alt (test:11), `data-aspect-ratio` (test:18), error→fallback (test:29), no-src→fallback (test:41), decorative `alt=""` (test:46), ref→inner img with `data-slot=image-img` (test:53), axe (test:64).

### Currently demonstrated

- preview exports: `image` (single video-ratio, rounded=lg, loaded) and `imageAspectRatios` (3 square tiles: loaded / no-src placeholder `fallback={null}` / broken-src `<ImageOff>` error fallback).
- mdx sections: Installation · Usage · presentational callout (R2/platform parity) · **Aspect ratios** · **States** (loading/loaded/error described in prose) · API Reference (ImageProps) · Accessibility · Do/Don't.
- API table status: `ImageProps` present (mdx:59).

### GAPS

- [VARIANT] **`rounded` axis is entirely undemonstrated as a matrix** — 5 values (`none`/`sm`/`md`/`lg`/`full`), but previews only ever use `lg` and `md`; `full` (avatar-like circular image) and `none` are never shown. No section walks the rounding scale.
- [VARIANT] **`aspectRatio="auto"`** (the default!) is never shown — both previews force `square`/`video`. The "intrinsic size drives the box" behavior (canonical:24) has no example, despite being the default value.
- [API] The **loading skeleton** state can't be captured in a static preview (fast data-URL/loaded), so the headline "skeleton pulses until decode" is described in prose (mdx:46) but never visually demonstrated — inherent limitation, but worth a note that there's no live loading-state demo.
- [PROSE] States section is prose + a code block (mdx:52–55) rather than a live preview of the square+fallback example; the actual error fallback IS shown in `imageAspectRatios` tile 3 — so prose and demo align. No stale text found.

### Verdict

- coverage: **High (~75%)** — both `aspectRatio` non-default values + error + empty shown; the `rounded` axis and the _default_ `auto` ratio are the real gaps.
- effort: **S–M**
- top 3 fixes: (1) add a `rounded` scale row (none→full, esp. `full` for circular); (2) add an `aspectRatio="auto"` example (the default value, currently invisible); (3) note that the loading skeleton can't be statically previewed (or add a slow-loading demo).

---

## truncated-text

- files: canonical ✓ | test ✓ | mdx (`truncated-text.mdx`) ✓ | preview ✓
- exports/subcomponents: `TruncatedText`, `IconText`, `TableCellText` (3 components, no CVA — config via props). Types `TruncatedTextProps`, `IconTextProps`, `TableCellTextProps`.
- proposed category: **Typography & Content** — clamp text + overflow-aware tooltip reveal.

### API surface (ground truth)

- `TruncatedText` props: **`lines`** (1=`truncate`, 2–6=`line-clamp-N`, >6 falls back to clamp-6; canonical:15–21,104), **`tooltipSide`** (top/right/bottom/left, default top; canonical:38–40), **`as`** (`span`/`p`/`div`, default span; canonical:44–46). Tooltip mounts **only when actually overflowing** (ResizeObserver, canonical:97,129–146).
- `IconText` props: `icon` (decorative, aria-hidden), `text`, `trailing?`, `tooltipSide` (canonical:148–164). Only the label truncates; icon/trailing pinned `shrink-0`.
- `TableCellText` props: `text`, `width?` (CSS var `--cell-w`, canonical:242–251), `lines?`, `mono?` (font-mono text-xs), `className?`.
- Test: renders text (test:21), default truncate+data-slot+data-lines (test:26), line-clamp-2 (test:34), `as="p"` (test:41), ref-merge (test:55), IconText icon/label/trailing + slot + truncate (test:64), IconText ref (test:82), TableCellText slot+truncate (test:104), TableCellText mono (test:115), TableCellText lines=2 clamp (test:126), axe on all three (test:50,93,137).

### Currently demonstrated

- preview exports: `truncatedText` (single-line clipped LONG_TITLE in w-56 box) and `truncatedTextMultiline` (`as="p" lines={2}` clamped LONG_DESCRIPTION). **Only `TruncatedText` has live previews.**
- mdx sections: Installation · Usage · Examples → Single-line (preview) · Multi-line (preview) · **IconText (code block only)** · **TableCellText (code block only)** · API Reference (all 3 AutoTypeTables, mdx:86–96) · Accessibility (measured-overflow, hover+focus, tooltip role, no interactive content) · Do/Don't.
- API table status: **complete** — `TruncatedTextProps`, `IconTextProps`, `TableCellTextProps` all have AutoTypeTables (mdx:88–96).

### GAPS

- [VARIANT] **`IconText` and `TableCellText` have NO live `<ComponentPreview>`** — both are documented with static code blocks only (mdx:54–62, 73–82). The preview file (`truncated-text.tsx`) doesn't even import them. So two of the three exported components are never rendered in the docs. `tooltipSide` (all 4 sides) and `TableCellText`'s `mono`/`width` are likewise never visually demonstrated.
- [VARIANT] `lines` is shown only for `1` and `2`; the upper range (3–6) and the >6→clamp-6 fallback (canonical:104) are not demonstrated (minor — visually similar).

### Verdict

- coverage: **Medium (~60%)** — `TruncatedText` itself is well covered, but a third of the public API (`IconText`, `TableCellText`) has zero live preview despite having full AutoTypeTables.
- effort: **M**
- top 3 fixes: (1) add `iconText` + `tableCellText` preview exports and swap the two code blocks for `<ComponentPreview>`; (2) demonstrate `TableCellText` `mono` and `width` (the IDs/paths use case); (3) optionally show `tooltipSide` variation.

---

## marker

- files: canonical ✓ | test ✓ | mdx (`marker.mdx`) ✓ | preview ✓
- exports/subcomponents: `Marker`, `MarkerIcon`, `MarkerContent`, plus `markerVariants` and type `MarkerVariant`. Types `MarkerProps`, `MarkerIconProps`, `MarkerContentProps`.
- proposed category: **Typography & Content (Conversation)** — inline thread annotation rows.

### API surface (ground truth)

- `Marker` CVA axis: **variant** = `default` / `separator` (centred label + flanking divider lines) / `border` (bottom hairline) (canonical:18–32). 3 values.
- `Marker` props: `variant`, **`render`** (polymorphic to link/button via Base UI useRender; canonical:51–55,84). `group/marker` root so `MarkerContent` reacts to variant (canonical:17,130).
- `MarkerIcon` = `ComponentProps<"span">`, decorative `aria-hidden`, sizes bare svg to `size-4` (canonical:97–116). `MarkerContent` = `ComponentProps<"span">`, wraps + centres under separator (canonical:118–136).
- Nested `<a>` styled underline + hover→foreground (canonical:17,130).
- Test: content+slot+default variant (test:7), variant data-attr separator (test:21), render→link keeps data-slot (test:34), MarkerIcon aria-hidden (test:45), ref (test:59), axe on link+icon+content (test:70).

### Currently demonstrated

- preview exports: `marker` (3 status markers incl. wrapped multiline), `markerVariants` (border/separator/default), `markerSeparator` (3 separators), `markerBorder` (3 border rows), `markerStatus` (`role="status"` + Spinner, default + separator), `markerStreaming` (`shimmer` class, with/without spinner), `markerLinkButton` (`render={<a>}` and `render={<button>}` with toast). **Very thorough — 7 previews.**
- mdx sections: Installation · Usage · Anatomy · Examples → Status markers · Variants · Separators · Bordered list · Status (live region) · Streaming text · As link/button · API Reference (**only MarkerProps**) · Accessibility (icon aria-hidden, render focus-visible, role=status, shimmer motion-reduce) · Do/Don't.
- API table status: **only `MarkerProps`** has an AutoTypeTable (mdx:90).

### GAPS

- [API] **`MarkerIconProps` and `MarkerContentProps` have NO AutoTypeTable** — only `MarkerProps` is documented (mdx:90). Both subcomponents are exported types (canonical:97,118) and are described in Anatomy prose, but the API Reference omits them. Inconsistent with `table`/`avatar`/`truncated-text` which give every exported subcomponent type a table. (They resolve to bare `span` props, but the same is true of table parts which DO get tables.)
- [PROSE] The `markerStreaming` example and Accessibility both reference the `shimmer` utility and link `/docs/utilities/shimmer` (mdx:76,100) and `/docs/components/spinner` (mdx:70) — verify those target pages exist (cross-page link integrity; not checkable from these 4 files alone). Frontmatter/description accurate; no stale text in the component prose.

### Verdict

- coverage: **High (~90%)** — every `variant` value, `render` link+button, status/streaming all shown across 7 previews; the only real gap is missing API tables for the two subcomponents.
- effort: **S**
- top 3 fixes: (1) add `MarkerIconProps` + `MarkerContentProps` AutoTypeTables to API Reference; (2) verify the `/docs/utilities/shimmer` and `/docs/components/spinner` cross-links resolve; (3) (optional) explicitly show the underlined nested-`<a>`-inside-content affordance (canonical:130) distinct from whole-row `render`.
