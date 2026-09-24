---
"@vegastack/ui": minor
---

🔧 Page chrome and pickers gain the props the facelift pages need: a framework back link and a page container, zone-correct relative dates, one inline picker tier, Field-wired chips and pickers, and one toast queue.

- **PageHeader**: `backRender` takes your router's link element for the back affordance, `titleLines` clamps or frees the title (`"none"` wraps), `meta` is a `<div>` row that can hold controls, and the title renders the page-heading face `font-heading text-2xl font-semibold`. [docs](https://design.vegastack.com/docs/components/page-header)
- **AppShellPage** (new part): the one page container — page gutters, a `gap-6` rhythm and a `size` measure of `narrow` (768px), `default` (1280px) or `full`; `AppShellSkeleton` uses the same gutters. [docs](https://design.vegastack.com/docs/components/app-shell)
- **RelativeTime**: `timeZone` decides the calendar day in the label, the server render and the tooltip; `capitalize`, `formatOptions` and `withTime` shape the day label; a label with no tooltip is plain inline text. [docs](https://design.vegastack.com/docs/components/relative-time)
- **SearchableSelect** and **DatePicker**: `size="sm"` and `variant="ghost"` form one inline tier with `Select`; clearing returns focus to the trigger. SearchableSelect is named by its `FieldLabel` inside a `Field` and takes `name`, `required` and `contentClassName`; DatePicker takes `clearable`, `clearLabel` and `renderValue`. [docs](https://design.vegastack.com/docs/components/searchable-select)
- **ChipInput**: inside a `Field` the label, description and error reach the input; `name` posts every chip, and `max`/`maxLabel` cap the entries. [docs](https://design.vegastack.com/docs/components/chip-input)
- **EditableCell**: `renderValue` shows a label for an id in display mode. [docs](https://design.vegastack.com/docs/components/editable-cell)
- **MultiStepForm**: `MultiStepFormActions sticky` (or `"narrow"`) keeps the action row in view on a long step and reports `data-stuck`. [docs](https://design.vegastack.com/docs/components/multi-step-form)
- **FilterBuilder**: `maxDepth={1}` shows no group control, operators declare a `valueShape` and a shape change clears the value, "Value required" waits for a touch or a submit, and the cap copy is singular for one. [docs](https://design.vegastack.com/docs/components/filter-bar-managed)
- **Toast** and **VegaStackProvider**: the provider carries the module `toast` manager and a `Toaster` below it reuses that provider, so `toast()` and `useToastManager()` feed one queue with one viewport (OVL-17). [docs](https://design.vegastack.com/docs/components/toast)
- **AnimatedNumber**: the default face is the regular font with tabular digits, not mono. [docs](https://design.vegastack.com/docs/components/animated-number)
- Migration: a test pinning `font-mono` on AnimatedNumber, the PageHeader title classes, a "Value required" message on an untouched FilterBuilder row, or a 24px box around a RelativeTime with `title={false}` sees the new output.
