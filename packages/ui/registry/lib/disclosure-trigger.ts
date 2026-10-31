// @vegastack disclosure-trigger@0.27.0 sha256-vdcD2hpK9N3wQAB0m5NtOj0QGTJ3l/bkukvh6dUpeAY=

/**
 * disclosure-trigger — the ONE class recipe for a ghost `Button` that expands and collapses a
 * section in place (a collapsible header, a table group toggle), shared by `RecordAsideSection`,
 * `SectionToggle`, `AgentPanel`'s header and `ShareDialog`'s audience toggle.
 *
 * Upstream's ghost Button paints `aria-expanded:bg-state-selected` because, on a menu or popover trigger,
 * `aria-expanded` means "my popup is open". On a disclosure it means "this section is expanded" —
 * the resting state of most sections — so the grey would make every open section look pressed.
 * `disclosureTriggerClasses` clears that fill while the pointer is elsewhere and leaves hover and
 * press to the variant. Ink is the caller's: a trigger that rests on `text-muted-foreground`
 * restates it under `aria-expanded:` itself.
 *
 * Pass it in the Button's `className` (through `cn`). Every class is a literal so a consumer's
 * Tailwind scanner sees it.
 */

/** Clears the ghost Button's popup-open fill on an expanded section; hover still shows. */
export const disclosureTriggerClasses =
  "aria-expanded:not-hover:bg-transparent";
