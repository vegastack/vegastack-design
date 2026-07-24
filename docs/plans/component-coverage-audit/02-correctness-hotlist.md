# P0 — Correctness Hotlist (verified stale docs)

These are docs that **actively contradict the component**. Each was independently grep-verified against canonical source (not just agent-reported). They mislead consumers, so they take priority over coverage gaps — and most are one-line prose edits with no new previews needed.

Legend: each item lists the **doc file:line**, the **stale text**, the **ground truth (canonical file:line)**, and the **fix**.

---

## 1. `label.mdx` — describes a required-asterisk the component deliberately does NOT render ⛔ (highest trust impact)

Four locations describe a `text-destructive` asterisk. Canonical `label.tsx:7-13` JSDoc is explicit: `required` only sets `data-required` — **"a styling/automation hook — no visual asterisk."** `label.test.tsx:27-33` asserts `[data-slot="label-required"]` is **null** ("No decorative asterisk").

| Loc                         | Stale text                                                                                                 | Fix                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `label.mdx:3` (frontmatter) | "…an optional **required indicator**."                                                                     | "…and a `data-required` styling hook."                                                                                |
| `label.mdx:34-35`           | "Pass `required` to append a **`text-destructive` asterisk**… The asterisk is decorative (`aria-hidden`)…" | Describe `data-required` as a non-visual styling/automation hook; enforce requiredness on the control + `FieldError`. |
| `label.mdx:58`              | "The `required` **asterisk** is `aria-hidden`…"                                                            | Remove asterisk claim; restate the `data-required` hook.                                                              |
| `label.mdx:71` (Do/Don't)   | "…rely on the **asterisk** alone…"                                                                         | Reword to "rely on `data-required` styling alone."                                                                    |

Also reconcile the `labelRequired` preview, which currently implies a visible indicator that doesn't render.

---

## 2. `input.mdx` — claims a focus ring the standalone Input has NO class for

Canonical `input.tsx:40` has only `focus:border-ring/70` — **no `focus-visible:ring*`, no `outline-ring`.** (Textarea + OTP genuinely add the ring; Input does not.)

| Loc                         | Stale text                                                                    | Fix                                                            |
| --------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `input.mdx:3` (frontmatter) | "…focus-visible ring…"                                                        | "…focus re-colors the border (`ring` token)…"                  |
| `input.mdx:54`              | "`:focus-visible` shows a 2px ring (`outline-ring`) — never `outline: none`." | "`:focus-visible` re-colors the border with the `ring` token." |

**Propagates** to two more pages that inherit the standalone Input:

- `password-input.mdx:60-61` — "2px ring (`outline-ring`) **on both the field and the toggle**" — doubly wrong: the field has no ring, and the toggle uses `focus-visible:text-foreground` (a color change, not a ring).
- `auto-save-input.mdx:76-77` — same inherited "2px ring" claim; the underlying Input has no ring.

> This is the tip of a cross-cutting pattern — see **Sweep A** in `03` (the same line is copy-pasted onto 12 pages; fix all against each component's real focus classes).

---

## 3. `alert.mdx` + `empty-state.mdx` — wrong status-token recipe (`bg-X/10`)

Canonical uses `bg-X-subtle`, not `bg-X/10`. (Verified: `alert.tsx:30-34` → `bg-purple-subtle`, `bg-info-subtle`, etc.)

| Loc                  | Stale text                                                | Fix                                     |
| -------------------- | --------------------------------------------------------- | --------------------------------------- |
| `alert.mdx:46`       | "status color tokens (`bg-X/10 text-X-text border-X/20`)" | "`bg-X-subtle text-X-text border-X/20`" |
| `empty-state.mdx:52` | "semantic status tokens (`bg-X/10 text-X`)"               | "`bg-X-subtle text-X-text`"             |

> Sweep G confirms these are the **only** two pages with the `bg-X/10` recipe — scoped fix.

---

## 4. "64 components" → 68 (two files)

Verified: 68 mdx pages, 68 non-divider meta entries.

| Loc                     | Stale                            | Fix             |
| ----------------------- | -------------------------------- | --------------- |
| `index.mdx:6`           | "**64 components**"              | "68 components" |
| `app/(home)/page.tsx:8` | "Tokens, 64 components, a live…" | "68 components" |

---

## 5. `color-picker.mdx:27` — "round swatch" trigger

Canonical `color-picker.tsx:156` comment: trigger is a control → `rounded-md` (Button's native radius); **"no `rounded-full`."** Only the in-grid swatches are `rounded-full`.

- Stale: "The trigger is a **round swatch** showing the current selection"
- Fix: "The trigger is a `rounded-md` swatch button showing the current selection" (the palette swatches inside are round).

---

## 6. `toggle-group.tsx` preview comments — "fills solid primary" (×2)

Canonical `toggle.tsx:17,22`: pressed item uses `data-pressed:bg-foreground/10` — **"a clear light grey, NOT a brand colour."** The MDX body correctly says "evident neutral fill"; only the preview code comments are stale.

| Loc                           | Stale comment                              | Fix                                                    |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| `preview/toggle-group.tsx:10` | "…the selected item fills solid primary."  | "…fills an evident neutral grey (`bg-foreground/10`)." |
| `preview/toggle-group.tsx:42` | "…each selected item fills solid primary." | same correction                                        |

---

## 7. `accordion.mdx:59` — wrong data attribute (`data-open`)

Canonical exposes `data-panel-open` (Base UI), not `data-open`. The same mdx says `data-panel-open` correctly two lines later (`:61`).

- Stale: "…(`AccordionItem` … `data-open` when expanded)."
- Fix: drop the `data-open` claim (open state is `data-panel-open` on the trigger, already stated at `:61`).

---

## 8. `sidebar.mdx:157-158` — aspirational focus-ring a11y claim

Claims `SidebarMenuButton`/`SidebarTrigger` show an `outline-ring` `:focus-visible` ring. **Verified: `sidebar.tsx` has no `outline-ring` / `focus-visible` class at all** for these. Contrast with `tabs.tsx`, which DOES set `focus-visible:outline-ring` explicitly.

- Either (a) **fix the component** to actually apply `focus-visible:outline-ring` (recommended for real a11y — this is a canonical edit → needs `registry:build`), or (b) **fix the prose** to describe the actual focus treatment. Recommend (a): a sidebar nav rail that lacks a visible focus ring is a real WCAG gap, not just a doc error.

---

## 9. `scroll-fade.mdx` Classes table — missing per-edge sized variants

Impl ships `scroll-fade-t-*`, `scroll-fade-b-*`, `scroll-fade-s-*`, `scroll-fade-e-*` (`dist/utilities.css:422-437`); the Classes table lists only the global `scroll-fade-*`. Add the four rows.

---

## 10. `data-list.mdx:48` — Anatomy column shape omits `interactive?`

The documented `DataListColumn` shape in the Anatomy code block lists `{ key, header, render?, sortable?, align?, className?, headerClassName? }` but **omits `interactive?`** (canonical `data-list.tsx:71`). Add it.

---

## 11. `select.mdx` Do/Don't — contradicts the `multiple` API (needs product decision)

`select.mdx` Do/Don't says "never use a Select for picking multiple values inline (use checkboxes)," but `SelectProps<Value, Multiple>` exposes a `multiple` type param (`select.tsx:44-47`). This is **Decision #5** in the README — not a pure stale fix:

- (a) document multi-select + drop the contradictory Don't, or
- (b) mark `multiple` intentionally unsupported and note it.

---

### Verification note

Items 1–10 were grep-confirmed against source during this audit (see the session log). Item 8's recommended path (a) and item 11 require a product/owner call. Items 1–7, 9, 10 are pure doc/preview edits — no canonical change, no `registry:build`.
