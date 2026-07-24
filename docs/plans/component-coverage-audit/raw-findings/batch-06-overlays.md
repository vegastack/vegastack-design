# BATCH 6 — Overlays (dialog, alert-dialog, sheet, popover, hover-card, tooltip)

## BATCH SUMMARY

All 6 components have complete file sets (canonical + test + mdx + preview) and pages. None are missing or thin. Coverage is uniformly strong on the headline axes (dialog size, sheet side, popover/tooltip/hover-card side). The recurring gap across the three positioning overlays is **`align` (start/center/end) is never demonstrated anywhere** — no side×align matrix exists despite `align` being a documented prop with a `<AutoTypeTable>` entry. Secondary gaps: popover's `arrow` and `modal={false}` are documented-but-not-demonstrated; dialog/sheet `showCloseButton={false}` / `closeLabel` are documented-but-not-demonstrated; alert-dialog `intent` does not visibly restyle the popup (only the Action button) which the preview cannot reveal.

Counts:

- Components audited: 6
- Missing pages: 0 | Thin previews: 0
- Components fully clean (no gaps): 0
- Components with only minor gaps (S effort): 6
- Most common gap dimension: [VARIANT]/[MATRIX] `align` undemonstrated (popover, hover-card, tooltip)

| Component    | Proposed Category | One-line reason                                                            |
| ------------ | ----------------- | -------------------------------------------------------------------------- |
| dialog       | Overlays          | Centered modal dialog; size scale + header/footer.                         |
| alert-dialog | Overlays          | Modal confirmation; non-dismissable, intent-tinted confirm action.         |
| sheet        | Overlays          | Edge-anchored dialog (drawer); four sides.                                 |
| popover      | Overlays          | Click-triggered floating panel; side/align/arrow positioning.              |
| hover-card   | Overlays          | Hover/focus preview panel (interactive); side/align/arrow positioning.     |
| tooltip      | Overlays          | Hover/focus floating label (non-interactive); side/align/arrow + kbd hint. |

---

## dialog

- files: canonical ✓ | test ✓ | mdx (`dialog.mdx`) ✓ | preview ✓
- exports/subcomponents: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`; plus `dialogContentVariants`, type `DialogContentSize`. (dialog.tsx:77-265)
- proposed category: Overlays — centered modal overlay with a size scale and header/footer layout.

### API surface (ground truth)

- CVA axis: `size` = `xs` | `sm` | `default` | `lg` | `full` (dialog.tsx:38-44), default `default`.
- `DialogContentProps` booleans/strings: `showCloseButton` (default `true`, dialog.tsx:112), `closeLabel` (default `"Close"`, dialog.tsx:117), `size` (dialog.tsx:107). Reflected as `data-size` on the popup (dialog.tsx:151).
- Root props (`DialogProps`): `open` / `defaultOpen` / `onOpenChange` (Base UI Dialog.Root); modal by default (focus trap + scroll lock).
- States: closed (no DOM) / open / focus-trapped / Escape-close / X-close / DialogClose-action-close — all asserted in test (dialog.test.tsx:34-110). role=dialog + aria-modal, aria-labelledby/describedby wired (test:53-66).

### Currently demonstrated

- preview exports: `dialog` (hero — destructive delete, default size, both footer buttons are `DialogClose`) + `dialogSizes` (all five sizes xs/sm/default/lg/full mapped from `DialogContentSize`, preview/dialog.tsx:46-79).
- mdx sections: Installation, Usage, Anatomy (full part-by-part + data-slots), Mobile callout, Sizes (`<ComponentPreview name="dialogSizes">`), API Reference (8 AutoTypeTables — every subcomponent), Accessibility (role/aria/focus-trap/return-focus/scroll-lock + key table), Do/Don't. Order is standard.
- API table status: all 8 prop types present and correctly named (DialogProps, DialogTriggerProps, DialogContentProps, DialogHeaderProps, DialogFooterProps, DialogTitleProps, DialogDescriptionProps, DialogCloseProps). Complete.

### GAPS

- [VARIANT] `showCloseButton={false}` never demonstrated — documented prop (dialog.tsx:112) but no preview shows the no-X variant.
- [VARIANT] `closeLabel` override never demonstrated — documented prop (dialog.tsx:117); only the default `"Close"` is exercised.
- [VARIANT] Scrollable / overflowing content never demonstrated — `max-h-[calc(100dvh-…)]` + `overflow-y-auto` viewport (dialog.tsx:29,146) is a real behavior; previews are all short. A long-body example would show the scroll affordance.
- [API] none — every subcomponent has an AutoTypeTable.
- [PROSE] none material. Frontmatter description ("five sizes") matches the five-value CVA. Anatomy, Accessibility, Do/Don't all match canonical reality.
- [STRUCTURE] none — all standard sections present and ordered.

### Verdict

- coverage: ~90% (size scale fully shown; only `showCloseButton`/`closeLabel`/scrollable unshown).
- effort: S
- top 3 fixes: (1) add a `showCloseButton={false}` example or note; (2) add a scrollable-content example; (3) optionally show `closeLabel` override.

---

## alert-dialog

- files: canonical ✓ | test ✓ | mdx (`alert-dialog.mdx`) ✓ | preview ✓
- exports/subcomponents: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`; type `AlertDialogIntent`. (alert-dialog.tsx:50-305)
- proposed category: Overlays — modal confirmation dialog, intentionally non-dismissable, intent-tinted confirm.

### API surface (ground truth)

- Enum axis: `intent` = `default` | `destructive` | `success` | `warning` (alert-dialog.tsx:83-87). On `AlertDialogContent` it sets only `data-intent` (does NOT restyle the popup — alert-dialog.tsx:96-98,132). On `AlertDialogAction` it maps to a Button variant: default→`default`, destructive→`destructive-outline`, success→`success-outline`, warning→`warning-outline` (alert-dialog.tsx:242-250).
- No `size` prop (fixed `sm:max-w-sm`, alert-dialog.tsx:136). No close (X) button by design. No `showCloseButton`.
- Root props: `open` / `defaultOpen` / `onOpenChange`; always modal; backdrop NON-dismissable; Escape = cancel.
- States: closed / open / focus-trap / Escape-cancel / Cancel-close / Action-close(+onClick fires) / backdrop-NO-close — all asserted (alert-dialog.test.tsx:46-136). role=alertdialog + aria wiring (test:64-91).

### Currently demonstrated

- preview exports: `alertDialog` (hero — destructive intent) + `alertDialogIntents` (all four intents default/destructive/success/warning with bespoke copy, preview/alert-dialog.tsx:43-100).
- mdx sections: Installation, Usage, "Unlike Dialog…" prose, Anatomy (full + data-slots), non-dismissable callout, Intents (`<ComponentPreview name="alertDialogIntents">`), API Reference (9 AutoTypeTables, each under its own `###` heading), Accessibility (role/aria/focus/return-focus/non-dismissable rationale + key table), Do/Don't. Order standard.
- API table status: all 9 subcomponent prop types present and correctly named. Complete.

### GAPS

- [VARIANT] The `intent` on `AlertDialogContent` has no visible effect (only `data-intent`); the preview pairs it with a matching `AlertDialogAction intent`, so the visible difference is entirely in the Action button. This is correct per canonical, but a reader may expect the popup to tint — mdx Intents prose ("for grouping") is honest about it; no fix strictly required, flag for awareness only.
- [VARIANT] Scrollable / long-body content never demonstrated (same `max-h` + overflow behavior as dialog, alert-dialog.tsx:134).
- [API] none — every subcomponent documented.
- [PROSE] none material. "four semantic intents" (frontmatter) matches. Non-dismissable claim verified against test (test:118-127). Esc-as-cancel claim verified (test:129-136).
- [STRUCTURE] none — standard sections present and ordered; nicest API layout of the batch (per-subcomponent `###` headings).

### Verdict

- coverage: ~92% (all 4 intents shown; only scrollable-content unshown; intent-on-Content visual is inherently subtle).
- effort: S
- top 3 fixes: (1) add a scrollable/long-body example; (2) optionally a one-line note that `intent` on Content is metadata-only and the visible tint comes from Action; (3) none else needed.

---

## sheet

- files: canonical ✓ | test ✓ | mdx (`sheet.mdx`) ✓ | preview ✓
- exports/subcomponents: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose`; plus `sheetVariants`, type `SheetSide`. (sheet.tsx:86-271)
- proposed category: Overlays — edge-anchored dialog (drawer) built on Base UI Dialog (not vaul).

### API surface (ground truth)

- CVA axis: `side` = `top` | `right` | `bottom` | `left` (sheet.tsx:39-55), default `right`. Reflected as `data-side` (sheet.tsx:156). `left`/`right` cap width (`w-3/4 max-w-sm`); `top`/`bottom` cap height — no width/size sub-axis.
- `SheetContentProps`: `side` (sheet.tsx:114), `showCloseButton` (default `true`, sheet.tsx:119), `closeLabel` (default `"Close"`, sheet.tsx:124).
- Root props: `open` / `defaultOpen` / `onOpenChange`; modal (focus trap + scroll lock).
- States: closed / open / default-side(right) / chosen-side(left) / X-close / SheetClose-action-close / Escape-close — all asserted (sheet.test.tsx:36-124). role=dialog + aria wiring (test:53-66).

### Currently demonstrated

- preview exports: `sheet` (hero — right side, scrollable body region) + `sheetSides` (ALL four sides top/right/bottom/left from `SheetSide`, preview/sheet.tsx:47-82). Each side demo includes a scrolling middle region.
- mdx sections: Installation, Usage, Anatomy (full + data-slots), Sheet-vs-Dialog callout (links to /docs/components/dialog), Sides (`<ComponentPreview name="sheetSides">`), API Reference (8 AutoTypeTables — every subcomponent), Accessibility (role/aria/focus-trap/return-focus/scroll-lock + key table), Do/Don't. Order standard.
- API table status: all 8 subcomponent prop types present and correctly named. Complete.

### GAPS

- [MATRIX] No side×size grid — but this is correct: there is no `size` prop on Sheet (left/right cap width to `max-w-sm`, top/bottom cap height). The prompt's hypothetical "sheet side×size grid" does not apply to this implementation. Flagging only to record the absence is intentional, not a gap.
- [VARIANT] `showCloseButton={false}` never demonstrated — documented prop (sheet.tsx:119).
- [VARIANT] `closeLabel` override never demonstrated — documented prop (sheet.tsx:124).
- [VARIANT] Custom width override (`className="max-w-md"` etc.) never demonstrated — the canonical caps at `max-w-sm`; a wider/narrower panel is a common real need not shown.
- [API] none.
- [PROSE] none material. "four sides" (frontmatter) matches. "NOT vaul / built on Base UI Dialog" claim in canonical comment (sheet.tsx:12) is consistent with imports.
- [STRUCTURE] none — standard sections present and ordered.

### Verdict

- coverage: ~90% (all four sides shown with scroll; only close-button/label/width overrides unshown).
- effort: S
- top 3 fixes: (1) show `showCloseButton={false}` or a width override (`className`); (2) optionally `closeLabel`; (3) none else needed.

---

## popover

- files: canonical ✓ | test ✓ | mdx (`popover.mdx`) ✓ | preview ✓
- exports/subcomponents: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverClose`, `PopoverArrow`, `PopoverTitle`, `PopoverDescription`. (popover.tsx:50-264)
- proposed category: Overlays — click-triggered floating panel for arbitrary content; side/align/arrow positioning.

### API surface (ground truth)

- `PopoverProps`: `modal` (default `true` — popover.tsx:50; documented `modal={false}` escape hatch), `open`/`defaultOpen`/`onOpenChange`.
- `PopoverContentProps` positioning: `side` (default `bottom`, popover.tsx:79), `sideOffset` (default `8`), `align` (default `center`, popover.tsx:92), `collisionPadding` (default `8`), `arrow` (default `false`, popover.tsx:119), pass-throughs `portalProps` / `positionerProps` / `viewportProps`.
- `side` ∈ top/right/bottom/left; `align` ∈ start/center/end (Base UI Positioner). Reflected as `data-side`/`data-align` on positioner (test:81-82).
- States: closed (no content) / open / aria-labelledby+describedby (when Title/Description present) / side-forwarded / arrow-rendered / PopoverClose-close / Escape-close — all asserted (popover.test.tsx:30-167). Built-in outside-press + Escape dismiss.

### Currently demonstrated

- preview exports: `popover` (hero — rename form, default position, no arrow) + `popoverForm` (`<ComponentPreview name="popoverForm">` — dimensions form, `className="w-80"` width override, no arrow). Both use `PopoverClose` for actions.
- mdx sections: Installation, Usage, Anatomy (full + data-slots, incl. `modal={false}` mention), Examples → Form panel (`<ComponentPreview name="popoverForm">`), API Reference (7 AutoTypeTables — every subcomponent incl. PopoverArrowProps), Accessibility (aria/focus-into-panel/return-focus/dismiss + key table), Do/Don't. Order standard.
- API table status: all 7 subcomponent prop types present and correctly named. Complete.

### GAPS

- [VARIANT] `arrow` NEVER demonstrated for popover — documented prop (popover.tsx:119), has an AutoTypeTable (`PopoverArrowProps`) and dedicated `PopoverArrow` export, but no preview/example renders `arrow`. Note hover-card and tooltip BOTH demonstrate `arrow`; popover is the inconsistent omission.
- [VARIANT] `side` NEVER demonstrated visually — only the default `bottom` is shown. (popover.test.tsx:63 exercises `side="right"` but no preview does.) hover-card and tooltip both ship a 4-side preview; popover ships none.
- [VARIANT][MATRIX] `align` (start/center/end) never demonstrated — no side×align grid. This is the batch-wide gap; popover is one of three offenders.
- [VARIANT] `modal={false}` never demonstrated — documented in Anatomy prose (popover.mdx:56) and a real behavioral switch (scroll-lock vs not), but no preview shows the non-blocking variant.
- [API] none — all subcomponents documented.
- [PROSE] none material. "Modal by default … pass `modal={false}`" matches canonical (popover.tsx:50). Frontmatter "an optional arrow" is accurate to the API even though no preview shows it.
- [STRUCTURE] none — standard sections present; Examples section has only one sub-example (Form panel) vs hover-card/tooltip which have 2–3.

### Verdict

- coverage: ~70% (form content shown well, but side/align/arrow/modal=false all undemonstrated — weakest positioning coverage of the three floating panels).
- effort: M
- top 3 fixes: (1) add a sides preview (4-side, matching hover-card/tooltip); (2) add an `arrow` example; (3) add an `align` (and/or `modal={false}`) example.

---

## hover-card

- files: canonical ✓ | test ✓ | mdx (`hover-card.mdx`) ✓ | preview ✓
- exports/subcomponents: `HoverCard`, `HoverCardTrigger`, `HoverCardContent`, `HoverCardArrow`. (hover-card.tsx:81-263) Built on Base UI `PreviewCard`.
- proposed category: Overlays — interactive hover/focus preview panel; side/align/arrow + open/close delays.

### API surface (ground truth)

- `HoverCardProps`: `openDelay` (default `700`, hover-card.tsx:69), `closeDelay` (default `300`, hover-card.tsx:75), `open`/`defaultOpen`/`onOpenChange`. Delays flow root→trigger via context.
- `HoverCardContentProps` positioning: `side` (default `bottom`, hover-card.tsx:128), `sideOffset` (default `8`), `align` (default `center`, hover-card.tsx:143), `collisionPadding` (default `16`), `arrow` (default `false`, hover-card.tsx:170), pass-throughs portal/positioner/viewport.
- Trigger renders an `<a>` by default (hover-card.tsx:108-122) — distinct from popover/tooltip which render `<button>`.
- PRESENTATIONAL (G7): renders children only; no data fetching (hover-card.tsx:34-37).
- States: trigger-renders / closed-no-content / open-on-hover / open-on-focus / side-forwarded / arrow / arbitrary-interactive-children / a11y(closed+open) — all asserted (hover-card.test.tsx:25-171).

### Currently demonstrated

- preview exports: `hoverCard` (hero — Avatar + name + stats + "View profile" button, default position) + `hoverCardSides` (ALL four sides top/right/bottom/left) + `hoverCardArrow` (`arrow` + interactive content). Three previews.
- mdx sections: Installation, Usage, Presentational `<Callout>`, Anatomy (full + data-slots), Examples → Direction (`hoverCardSides`) + Interactive content with an arrow (`hoverCardArrow`), API Reference (4 AutoTypeTables — every subcomponent), Accessibility (hover+focus open, blur/Esc close, collision, focus-visible + key table), Do/Don't (tooltip-vs-hovercard-vs-dialog distinction). Order standard.
- API table status: all 4 subcomponent prop types present and correctly named. Complete.

### GAPS

- [VARIANT][MATRIX] `align` (start/center/end) never demonstrated — sides are covered, but no side×align grid. Batch-wide gap.
- [VARIANT] `openDelay` / `closeDelay` overrides never demonstrated — headline props of THIS component (the forgiving-delay distinction from tooltip is its raison d'être), documented in Anatomy (`<HoverCard openDelay={700} closeDelay={300}>`) but no preview varies them. Hard to show statically, but worth at least a fast-delay example.
- [API] none.
- [PROSE] none material. "four directions" / "forgiving open/close delays" (frontmatter) match canonical defaults. Presentational/G7 claim matches canonical comment. Trigger-renders-`<a>` is documented (mdx:58-59) and verified in test (test:160).
- [STRUCTURE] none — strongest example set in the batch (3 previews).

### Verdict

- coverage: ~90% (sides + arrow + interactive content all shown; only align and delay-tuning unshown).
- effort: S
- top 3 fixes: (1) add an `align` example (or side×align note); (2) optionally a delay-tuning example; (3) none else needed.

---

## tooltip

- files: canonical ✓ | test ✓ | mdx (`tooltip.mdx`) ✓ | preview ✓
- exports/subcomponents: `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipArrow`, `TooltipKbd`. (tooltip.tsx:29-243) Built on Base UI `Tooltip`.
- proposed category: Overlays — non-interactive hover/focus floating label; side/align/arrow + keyboard-hint slot + provider-shared delay.

### API surface (ground truth)

- `TooltipProvider` (re-export, tooltip.tsx:29) — shared open/close delay; mount once near root (lives in VegaStackProvider).
- `TooltipProps`: `delay` (override provider delay, tooltip.tsx:45), `open`/`defaultOpen`/`onOpenChange`.
- `TooltipContentProps` positioning: `side` (default `top`, tooltip.tsx:96), `sideOffset` (default `6`, accepts offset functions — test:97), `align` (default `center`, tooltip.tsx:108), `arrow` (default `false`, tooltip.tsx:129), pass-throughs portal/positioner/viewport. (No `collisionPadding` prop — unlike popover/hover-card.)
- `TooltipKbd`: `keys` = string (split per glyph) | string[] (tooltip.tsx:220-243). Inverted `bg-foreground`/`text-background` surface; role="tooltip" (tooltip.tsx:162). Non-interactive by design.
- States: trigger / closed-no-content / open-on-hover / open-on-focus / side-forwarded / functional-sideOffset / kbd-hint / a11y(closed+open) — all asserted (tooltip.test.tsx:36-158).

### Currently demonstrated

- preview exports: `tooltip` (hero — default top) + `tooltipSides` (ALL four sides) + `tooltipKbd` (`TooltipKbd ⌘K`) + `tooltipArrow` (`arrow`). Four previews — the richest set.
- mdx sections: Installation, Provider (dedicated section explaining the shared-delay provider), Usage, Anatomy (full + data-slots incl. `delay`), Examples → Positioning (`tooltipSides`, mentions offset functions) + Keyboard hint (`tooltipKbd`) + Arrow (`tooltipArrow`), API Reference (5 AutoTypeTables — every subcomponent incl. TooltipKbdProps), Accessibility (role=tooltip, hover+focus not hover-only, supplement-not-name, non-interactive + key table), Do/Don't (tooltip-vs-popover). Order standard.
- API table status: all 5 subcomponent prop types present and correctly named. `TooltipProvider` has no AutoTypeTable (it is a bare Base UI re-export with no wrapper props — acceptable; documented in the Provider prose section instead).

### GAPS

- [VARIANT][MATRIX] `align` (start/center/end) never demonstrated — sides covered, no side×align grid. Batch-wide gap.
- [VARIANT] `delay` override never demonstrated visually — documented in Anatomy (`<Tooltip delay={400}>`), but no preview varies it (inherently hard to show statically).
- [VARIANT] `sideOffset` / offset-function never demonstrated in a preview — mdx Positioning prose claims "`sideOffset` accepts … offset functions" (tooltip.mdx:66) and the test exercises `sideOffset={() => 6}` (test:97), but no preview shows a non-default offset.
- [API] none — every wrapper subcomponent documented; `TooltipProvider` intentionally prose-only.
- [PROSE] none material. Frontmatter "smart shared delay, rich content, optional keyboard hints, collision-aware" all match canonical. role=tooltip claim verified (test:70). Non-interactive / "put actions in a Popover" guidance matches the no-focus-trap design.
- [STRUCTURE] none — richest example set in the batch (4 previews) + a dedicated Provider section.

### Verdict

- coverage: ~92% (sides + arrow + kbd shown; only align, delay-tuning, and sideOffset unshown).
- effort: S
- top 3 fixes: (1) add an `align` example; (2) optionally a `sideOffset` / offset-function example to back the prose claim; (3) optionally a `delay` example.

---

## Cross-component notes (overlay consistency)

- **`align` is undemonstrated across ALL three positioning overlays** (popover, hover-card, tooltip) despite being a first-class documented prop with an AutoTypeTable on each `*ContentProps`. A shared side×align matrix (or one `align` example per page) is the single highest-leverage fix for the batch. [MATRIX]
- **`arrow` coverage is inconsistent**: hover-card ✓ and tooltip ✓ demonstrate it; **popover does NOT**, even though popover has a dedicated `PopoverArrow` export + `PopoverArrowProps` table. [VARIANT]
- **`side` previews are inconsistent**: hover-card and tooltip each ship a 4-side preview; **popover ships none** (only the default `bottom`). [VARIANT]
- **Close-button overrides** (`showCloseButton={false}`, `closeLabel`) are documented but undemonstrated on both dialog and sheet. [VARIANT]
- **Delay tuning** (`openDelay`/`closeDelay` on hover-card, `delay` on tooltip) — the defining UX knob of these two — is documented but never shown varied (acknowledged as hard to convey statically). [VARIANT]
- Accessibility prose is strong and matches tests on every component (role values, aria-labelledby/describedby wiring, focus trap + return focus for dialog/alert-dialog/sheet, hover+focus parity + role=tooltip for tooltip, interactive-card rationale for hover-card, non-dismissable rationale for alert-dialog). No stale/incorrect accessibility claims found.
