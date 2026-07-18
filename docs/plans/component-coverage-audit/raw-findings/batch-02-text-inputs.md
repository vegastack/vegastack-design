# Batch 02 — Text Inputs (documentation-coverage audit)

## BATCH SUMMARY

- Components audited (6): `input`, `textarea`, `password-input`, `otp-input`, `auto-save-input`, `text-edit`
- All 6 have all four files present (canonical ✓, test ✓, mdx ✓, preview ✓). No missing pages, no missing previews.
- Major-gap components: **0**. Minor-gap components: **6** (every page is structurally solid; gaps are demonstrated-state and prose-accuracy nits).
- Standout cross-batch issues:
  - **Frontmatter drift on `input`**: description claims a "focus-visible ring", but the canonical `fieldClasses` for standalone `Input` has **no `focus-visible:ring`** (only `focus:border-ring/70`). Textarea/OTP genuinely have the ring; Input does not. The Accessibility prose on `input.mdx` also asserts a "2px ring (`outline-ring`)" that the standalone field does not render. This is a real TRUTH-vs-DOC contradiction shared by both the frontmatter and the a11y bullet.
  - **`onValueChange` on `Input`** (Base UI prop) is documented in the canonical JSDoc/usage prose and tested, but never demonstrated in any preview and not surfaced as a distinct example.
  - Hover/focus interactive states are described in prose across the batch but, as static previews, are inherently not shown — acceptable for a static gallery, flagged once per component as [VARIANT] where the prose over-promises.

### Category-assignment table

| Component | Proposed category | One-line reason |
|---|---|---|
| input | Form & Inputs | Base text field; the canonical single-line input primitive. |
| textarea | Form & Inputs | Multi-line text entry field; sibling of Input. |
| password-input | Form & Inputs | Password field with reveal toggle + requirements checklist. |
| otp-input | Form & Inputs | Multi-slot one-time-passcode entry field. |
| auto-save-input | Form & Inputs | Debounced text input with inline persistence status. |
| text-edit | Typography & Content | Rich-text (Tiptap) editor producing HTML; content-authoring surface rather than a simple form value. (Alt: Form & Inputs.) |

---

## input
- files: canonical ✓ | test ✓ | mdx (`input.mdx`) ✓ | preview ✓
- exports/subcomponents: `Input` (single forwardRef); data-slots `input`, `input-group`, `input-prefix`, `input-suffix`
- proposed category: Form & Inputs — the canonical single-line text field primitive every other input in this batch wraps.
### API surface (ground truth)
- CVA axes: none (no CVA; no size/variant axis — fixed `h-8`).
- boolean/enum props: `type` (any HTML input type, default `'text'`), `disabled`, `readOnly`, `aria-invalid` (all native/Base UI); no component-specific booleans.
- key props: `prefix?: ReactNode`, `suffix?: ReactNode` (switch into addon-group mode), `containerClassName?` (addon wrapper), `className?` (Base UI state-function form supported), `onValueChange` (Base UI), `render` (Base UI composition), forwarded ref → `<input>`.
- states supported: default, placeholder, with-value (filled), disabled, readOnly, aria-invalid (error), focus (`focus:border-ring/70`), selection styling, `file:` input styling, addon mode (prefix/suffix) with `focus-within`/`has-aria-invalid`/`has-disabled` group reactions, dark mode (`dark:bg-input/30`).
### Currently demonstrated
- preview exports:
  - `input` → single email field (default).
  - `inputStates` → default, with-placeholder, with-value, disabled, invalid, readOnly (6-up vertical).
  - `inputWithAddon` → prefix string, suffix string, prefix icon (search). 3 examples.
- mdx sections present: Installation, Usage, States, Addons, API Reference, Accessibility, Do/Don't.
- API table: `<AutoTypeTable path="../../packages/ui/registry/ui/input.tsx" name="InputProps" />` — path & exported type name correct; `InputProps` exists and includes all four documented props.
### GAPS
- [PROSE] Frontmatter `description` claims "focus-visible ring" but standalone `Input` `fieldClasses` (input.tsx:38–46) has NO `focus-visible:ring*` — only `focus:border-ring/70`. Stale/incorrect. (Textarea & OTP have the ring; Input does not.)
- [PROSE] Accessibility bullet "`:focus-visible` shows a 2px ring (`outline-ring`)" (input.mdx:54) is inaccurate for the standalone field — no ring class is present; the field shows only a border-color change. QUOTE: "`:focus-visible` shows a 2px ring (`outline-ring`) — never `outline: none`."
- [VARIANT] `onValueChange` (Base UI) is in Usage prose + tested but never demonstrated in a preview — no example shows the Base UI value callback distinct from `onChange`.
- [VARIANT] `render` (Base UI composition / polymorphism) prop mentioned in Usage prose but never demonstrated.
- [VARIANT] `type` variety is only lightly shown (email, search). Common types the field explicitly forwards (number, tel, url, password, date) are not in any matrix — minor, since type is native.
- [VARIANT] Addon mode `disabled` / `aria-invalid` group reactions (`has-disabled`, `has-aria-invalid` on `groupClasses`) are not shown — `inputWithAddon` shows only the neutral addon state. A disabled/invalid addon row would reveal the wrapper-level styling that standalone state previews don't.
- [MATRIX] No size×state grid (n/a — single fixed size, so correctly absent).
### Verdict
- coverage: Minor gaps
- effort to fix: S
- top 3 fixes: 1) Correct the "focus-visible ring" claim in BOTH frontmatter `description` and the Accessibility bullet (Input has no ring — say "focus re-colors the border with `ring`"). 2) Add a disabled/invalid addon example to `inputWithAddon` to demonstrate the group-level `has-*` reactions. 3) Add a tiny `onValueChange`/`render` note or example so the Base UI surface in the prose is demonstrated.

---

## textarea
- files: canonical ✓ | test ✓ | mdx (`textarea.mdx`) ✓ | preview ✓
- exports/subcomponents: `Textarea` (single forwardRef); data-slot `textarea`
- proposed category: Form & Inputs — multi-line text entry, the sibling field to Input.
### API surface (ground truth)
- CVA axes: none (no CVA; fixed `min-h-16`).
- boolean/enum props: `autoGrow?: boolean` (default false — the only component-specific prop); plus native `disabled`, `readOnly`, `aria-invalid`, `rows`, `required`, `maxLength`, etc.
- key props: `autoGrow` (CSS `field-sizing: content`; toggles `resize-none field-sizing-content` vs `resize-y`), `className`, forwarded ref → `<textarea>`.
- states supported: default, placeholder, with-value, disabled, readOnly, aria-invalid, focus (`focus:border-ring/70`) + **explicit `focus-visible:ring-2 ring-ring/20`** (unlike Input), selection styling, dark mode, vertical-resize (default) vs autoGrow.
### Currently demonstrated
- preview exports:
  - `textarea` → single placeholder field (default).
  - `textareaStates` → default, with-placeholder, with-value, disabled, invalid, readOnly, AND autoGrow (7-up).
- mdx sections present: Installation, Usage, States, Auto-grow, API Reference, Accessibility, Do/Don't.
- API table: `name="TextareaProps"` at correct path — exists, includes `autoGrow`. Correct.
### GAPS
- [VARIANT] `autoGrow` is shown in the `textareaStates` preview, but the dedicated "Auto-grow" mdx section uses only a fenced code block (textarea.mdx:47–49) with NO live `<ComponentPreview>` — the growing-with-content behavior (the whole point) is never rendered interactively in its own section. The static `autoGrow` cell in the states grid looks identical to a default field until typed into.
- [VARIANT] `rows` (documented as the autoGrow starting-height companion) is not demonstrated with a value in any preview.
- [PROSE] Accessibility "`:focus-visible` shows a 2px ring (`outline-ring`)" — here it is ACCURATE (textarea has `focus-visible:ring-2`), good; no fix. (Contrast with Input where the same line is wrong.)
- [MATRIX] No size matrix (n/a — single size).
### Verdict
- coverage: Minor gaps
- effort to fix: S
- top 3 fixes: 1) Add a `<ComponentPreview>` to the Auto-grow section (or a dedicated `textareaAutoGrow` export) so the grow-to-content behavior is actually visible, not just code. 2) Demonstrate `rows` as the starting height in the autoGrow example. 3) None critical beyond the above — page is otherwise complete.

---

## password-input
- files: canonical ✓ | test ✓ | mdx (`password-input.mdx`) ✓ | preview ✓
- exports/subcomponents: `PasswordInput` (forwardRef), `PasswordRequirement` (interface); data-slots `password-input`, `password-input-toggle`, `password-input-requirements`
- proposed category: Form & Inputs — password field with reveal toggle + live requirements checklist.
### API surface (ground truth)
- CVA axes: none.
- boolean/enum props: none component-specific beyond the props below; native `disabled` cascades to both field and toggle.
- key props: `requirements?: PasswordRequirement[]` (`{ label, met }` rows), `toggleAriaLabel?` (default "Toggle password visibility"), inherits Input props except `type`/`prefix`/`suffix` (omitted), `aria-describedby` (merged with generated requirement ids), forwarded ref → `<input>`.
- states supported: masked default (`type=password`), revealed (`type=text` via local state), toggle `aria-pressed`, disabled (field + toggle), aria-invalid, requirements met/unmet rows (`text-success-text` / `text-muted-foreground`, Check/X icons), sr-only met/not-met text, polite live "N of M met" summary, keyboard-reachable toggle.
### Currently demonstrated
- preview exports:
  - `passwordInput` → with-placeholder, with-value, disabled, invalid (4-up). NOTE this maps to the frontmatter `preview: passwordInput`, used as the page hero.
  - `passwordInputRequirements` → controlled field with a 3-rule live checklist.
- mdx sections present: Installation, Usage, Requirements, API Reference, Accessibility, Do/Don't.
- API table: `name="PasswordInputProps"` at correct path — exists, includes `requirements` & `toggleAriaLabel`. Correct.
### GAPS
- [VARIANT] The **revealed state** (`type=text`, eye toggled, `aria-pressed=true`, `EyeOff` icon) is never shown statically — every preview field starts masked. A static "revealed" example (or a note) would show the toggle's two icons; currently only `Eye` is visible in the gallery.
- [VARIANT] `toggleAriaLabel` override is documented + tested but not demonstrated in any preview.
- [VARIANT] No "all requirements met" terminal state shown — `passwordInputRequirements` starts empty (all unmet); the success/`text-success-text` rows only appear if the reader types. A second static example with `met: true` rows would show the satisfied look without interaction.
- [STRUCTURE] No dedicated "States" section — the masked/disabled/invalid states ride in the hero `passwordInput` preview without an explanatory States heading (Input/Textarea both have one). Minor inconsistency in section structure.
- [PROSE] Accessibility "`:focus-visible` shows a 2px ring (`outline-ring`) on both the field and the toggle" (password-input.mdx:60–61) — the *toggle* uses `focus-visible:text-foreground` (a color change, NOT a ring); the *field* is the standalone Input which (as noted) has no ring either. So the "2px ring on both" claim is doubly inaccurate. QUOTE: "`:focus-visible` shows a 2px ring (`outline-ring`) on both the field and the toggle — never `outline: none`."
### Verdict
- coverage: Minor gaps
- effort to fix: S
- top 3 fixes: 1) Fix the Accessibility focus-ring claim — the toggle uses a text-color focus treatment and the field has no ring; reword to match reality. 2) Add a "revealed" / `toggleAriaLabel` example (or a fully-met requirements example) so the EyeOff icon and the satisfied checklist appear without typing. 3) Add a small States heading for the masked/disabled/invalid grid to match Input/Textarea structure.

---

## otp-input
- files: canonical ✓ | test ✓ | mdx (`otp-input.mdx`) ✓ | preview ✓
- exports/subcomponents: `OTPInput` (forwardRef on Base UI `OTPField.Root`); data-slots `otp-input`, `otp-input-slot`, `otp-input-separator`
- proposed category: Form & Inputs — multi-slot one-time-passcode entry.
### API surface (ground truth)
- CVA axes: none.
- boolean/enum props: `mask?: boolean` (default false), `disabled?: boolean` (default false); plus Base UI `validationType` (numeric by default, not re-exposed but inherited via spread).
- key props: `length?` (default 6), `groups?: readonly number[]` (e.g. `[3,3]`; defines length when length omitted), `separator?: ReactNode` (default `'-'`), `separatorClassName?`, `value?`/`defaultValue?`/`onValueChange?`/`onValueComplete?` (Base UI change/complete callbacks with `eventDetails.reason`), `slotClassName?`, `aria-label?`/`aria-labelledby?` (wraps in visually-hidden label when bare aria-label), forwarded ref → root `<div>`.
- states supported: empty (border-input), focused slot (`focus:z-10 focus:border-ring/70` + `focus-visible:ring-2 ring-ring/20`), filled, masked, grouped (separator), disabled (every slot), `data-invalid` (`data-invalid:border-destructive/70`), dark mode.
### Currently demonstrated
- preview exports:
  - `otpInput` → controlled 6-digit grouped `[3,3]` (hero, default).
  - `otpInputStates` → empty, filled grouped, masked, disabled (4-up).
- mdx sections present: Installation, Usage, States, Grouped, With a label, API Reference, Accessibility, Do/Don't. (Richest structure in the batch.)
- API table: `name="OTPInputProps"` at correct path — exists, includes length/groups/separator/mask/value/onValueChange/onValueComplete etc. Correct & complete.
### GAPS
- [VARIANT] `data-invalid` / invalid (error) state is part of `slotClasses` (`data-invalid:border-destructive/70`, otp-input.tsx:93) and is NOT shown in `otpInputStates` — no invalid/error OTP example exists anywhere. The states grid shows empty/filled/masked/disabled but skips error, which is a real visual state.
- [VARIANT] `separator` customization (non-default separator node) and `separatorClassName` are documented but never demonstrated — only the default `'-'` appears. `length` other than 6 (e.g. 4) is not shown either.
- [VARIANT] `onValueComplete` (auto-submit) is shown only as a fenced code snippet in Usage (otp-input.mdx:32–41), not in a live preview — the "fires when filled" behavior isn't demonstrated interactively.
- [PROSE] "Grouped" + "With a label" mdx sections are code-block only (no `<ComponentPreview>`); the Field-association example (otp-input.mdx:70–80) is never rendered, so the auto-labeled-first-slot behavior is asserted but unshown.
- [MATRIX] A small mask×grouped or length variation grid would add signal but is optional.
### Verdict
- coverage: Minor gaps
- effort to fix: S–M
- top 3 fixes: 1) Add an invalid/error OTP cell to `otpInputStates` (set `data-invalid` / wrap in an invalid Field) — it's a styled state with zero coverage. 2) Demonstrate a non-default `length` (e.g. 4) and/or a custom `separator` so those props are visible. 3) Convert the "Grouped"/"With a label" code blocks into (or add) live `<ComponentPreview>`s so grouping + Field label association render.

---

## auto-save-input
- files: canonical ✓ | test ✓ | mdx (`auto-save-input.mdx`) ✓ | preview ✓
- exports/subcomponents: `AutoSaveInput` (forwardRef), `AutoSaveStatus` (type `'idle'|'saving'|'saved'|'error'`); data-slots `auto-save-input`, `auto-save-input-status`
- proposed category: Form & Inputs — debounced text input with inline persistence status.
### API surface (ground truth)
- CVA axes: none.
- boolean/enum props: none boolean; `AutoSaveStatus` enum drives the indicator (idle/saving/saved/error).
- key props: `onSave: (value)=>Promise<void>` (required), `value?`/`defaultValue?`/`onValueChange?` (controlled or uncontrolled draft), `debounceMs?` (default 800), `validate?: (value)=>boolean` (sync guard → error), `onStatusChange?: (status)=>void`, inherits Input props except `value`/`defaultValue`/`onChange`/`suffix` (omitted), forwarded ref → `<input>`.
- states supported: idle (no icon), saving (spinning `Loader`, `motion-reduce:animate-none`), saved (`text-success-text` Check), error (`text-destructive-text` X + `aria-invalid`), polite live `role="status"` announcing Saving/Saved/Save failed, controlled record-switch baseline reset.
### Currently demonstrated
- preview exports:
  - `autoSaveInput` → 4 fields, one per outcome (idle / slow-saving / saved / error via rejecting onSave). Real component, no status hack — but each requires the reader to TYPE and pause to reach its state.
- mdx sections present: Installation, Usage, (Callout: Presentational), Examples, API Reference, Accessibility (+ key table), Do/Don't.
- API table: `name="AutoSaveInputProps"` at correct path — exists, includes onSave/debounceMs/validate/onStatusChange/value/onValueChange. Correct.
### GAPS
- [VARIANT] All four status icons (spinner/check/cross + idle-blank) exist in code, but in the *static* gallery every field renders **idle** (no icon) until the reader interacts — the saving/saved/error visuals are never shown at rest. No static snapshot of the spinner/check/cross. (A row of pre-set status illustrations, or screenshots, would show the indicators without typing.)
- [VARIANT] Controlled `value` + `onValueChange` usage (and the record-switch baseline-reset behavior, a non-obvious feature heavily tested) is documented in prose/JSDoc but not demonstrated in a preview — only the uncontrolled `defaultValue` path is shown.
- [VARIANT] `debounceMs`, `onStatusChange` props documented but not demonstrated (onStatusChange driving surrounding UI would be a strong example).
- [PROSE] Accessibility "`:focus-visible` shows a 2px ring (`outline-ring`)" (auto-save-input.mdx:76–77) — inherits the standalone-Input ring inaccuracy (the underlying Input has no ring). Same stale claim as input.mdx.
- [STRUCTURE] No "States" section heading; states are folded into "Examples". Acceptable but inconsistent with Input/Textarea.
### Verdict
- coverage: Minor gaps
- effort to fix: M
- top 3 fixes: 1) Make the saving/saved/error indicators visible at rest (e.g. an illustrative row, or note that the live fields must be edited) so the three icons aren't invisible in a static gallery. 2) Add a controlled `value`/`onValueChange` example demonstrating the record-switch baseline reset (the signature feature). 3) Fix the inherited focus-ring a11y claim (Input has no ring).

---

## text-edit
- files: canonical ✓ | test ✓ | mdx (`text-edit.mdx`) ✓ | preview ✓
- exports/subcomponents: `TextEdit` (function component with `ref` prop), internal `Toolbar`; data-slots `text-edit`, `text-edit-toolbar`, `text-edit-content`
- proposed category: Typography & Content — a rich-text authoring surface emitting HTML (heavier than a form value; alt Form & Inputs).
### API surface (ground truth)
- CVA axes: none.
- boolean/enum props: `editable?: boolean` (default true); `aria-invalid` accepts boolean | "grammar" | "spelling".
- key props: `value?`/`defaultValue?`/`onValueChange?` (HTML strings, controlled/uncontrolled), `placeholder?`, `editable?`, `onSubmit?` (Cmd/Ctrl+Enter), `minHeight?`/`maxHeight?` (number→px or string; fed to `--te-min-h`/`--te-max-h`), `aria-label?`/`aria-invalid?`/`aria-describedby?`, `className?`, `ref` → root `<div>`. Toolbar buttons: bold, italic, strike, heading(2), bullet list, ordered list, blockquote, inline code.
- states supported: editing (toolbar visible, focus-within ring on container), read-only (`editable={false}`, toolbar hidden, `contenteditable=false`), empty (placeholder overlay), invalid (`has-aria-invalid:border-destructive/70`, `data-invalid`), per-button pressed/disabled (toolbar disabled when non-editable), min/max-height scrolling.
### Currently demonstrated
- preview exports:
  - `textEdit` → live controlled editor seeded with rich HTML (hero; toolbar, links, code chip).
  - `textEditStates` → empty-with-placeholder editor + read-only editor (toolbar hidden).
- mdx sections present: Installation (+ peer-dep note), Usage (controlled + uncontrolled), Anatomy, Examples, API Reference, Accessibility (+ keymap table), Scope (capability split table), Do/Don't. Most thorough page in the batch.
- API table: `name="TextEditProps"` at correct path — exists, includes value/defaultValue/onValueChange/placeholder/editable/onSubmit/minHeight/maxHeight/aria-*/className. Correct & complete.
### GAPS
- [VARIANT] **Invalid state never demonstrated** — `aria-invalid` (and the resulting `has-aria-invalid:border-destructive/70` + `data-invalid`) is documented, tested, and described in Anatomy, but no preview renders an invalid editor. No error-state example exists.
- [VARIANT] `onSubmit` (Cmd/Ctrl+Enter) is documented in canonical JSDoc + Scope + tested, but appears in NO preview and is NOT in the mdx keymap table (the table lists bold/italic/undo/redo/Enter/Tab but omits the Cmd/Ctrl+Enter submit affordance the component explicitly adds). QUOTE-able omission: keymap table has no Cmd/Ctrl+Enter row despite `onSubmit`.
- [VARIANT] `minHeight` / `maxHeight` (scrolling content area) documented + tested but not demonstrated in any preview — the scroll-past-max behavior isn't shown.
- [VARIANT] `aria-invalid="grammar" | "spelling"` enum values are supported (isAriaInvalid handles them) but not mentioned in prose nor shown — niche, minor.
- [PROSE] mdx keymap table omits the `onSubmit` Cmd/Ctrl+Enter shortcut that the component implements — a real prose/behavior gap (the shortcut is a headline feature in Scope yet absent from the key reference).
- [MATRIX] An editable×invalid or read-only×content grid is optional; the missing invalid cell (above) is the one worth adding.
### Verdict
- coverage: Minor gaps
- effort to fix: M
- top 3 fixes: 1) Add an invalid-state example (`aria-invalid` + `aria-describedby` error text) — the destructive container ring has zero visual coverage. 2) Add the Cmd/Ctrl+Enter `onSubmit` shortcut to the keymap table AND demonstrate it (with min/max height) in a preview. 3) Demonstrate `minHeight`/`maxHeight` so the fixed/scrolling content area is visible.
