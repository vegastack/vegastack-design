# @vegastack/ui

## 0.2.0

### Minor Changes

- [`c7de692`](https://github.com/vegastack/vegastack-design/commit/c7de6929416086bd0d4c6ca0b1957247c6b202a7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `provider` registry item — `VegaStackProvider` + `useVegaStackTheme` ship as a copy-in
  (`shadcn add @vegastack/provider`, composing the `sonner` Toaster item), closing the gap where
  downstream projects had no sanctioned install path for the app-root wiring (theme, toasts,
  tooltip coordination, direction). The private package's provider is now a documented mirror of
  the canonical registry source.

### Patch Changes

- Updated dependencies [[`9532d42`](https://github.com/vegastack/vegastack-design/commit/9532d4295807dd4f37ddefb514641249e1002911)]:
  - @vegastack/design@0.1.1

## 0.1.0 — first release (2026-07-18)

Private package — components are distributed via the **signed shadcn registry**
(`design.vegastack.com/r`), never npm. This changelog is the consumer-facing record per version;
per-component change signals are the `// @vegastack <name>@<version> sha256-…` provenance headers.

83 components on Base UI 1.6 + Tailwind v4, 525 registry items (incl. 440 animated-icon mirrors,
2 hooks, the `dashboard-01` block):

- Actions/forms: 15-variant Button family (icon-proportional ladder, in-ink loading spinner),
  full form suite with border-tint focus (no rings) and auto shake-on-invalid.
- Combobox + Command rebuilt data-driven on Base UI (cmdk removed); Select-style popup search
  (`ComboboxPopupInput`); pickers (date/color/emoji/country/region).
- Display/data: badges, cards, tables, DataList, charts (mono numerals), Empty, Item, Attachment,
  AnimatedNumber, Resizable.
- Shell: AppShell + Sidebar (Sheet mode, rail, cookie persistence), PageHeader, breadcrumbs.
- Chat: Marker, Message, Bubble, MessageScroller. Marketing: 8 `.vs-marketing` primitives.
- Every component: token-only styling, WCAG 2.1 AA, both themes, ref-as-prop, flat exports —
  audit-swept with per-variant screenshot evidence before this release.
