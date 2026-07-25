# @vegastack/ui

## 0.3.0

### Minor Changes

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Add AnnouncementBanner, CodeBlock, ComparisonMatrix, NavigationMenu, OnboardingChecklist,
  PricingSection, PropertyList, RuledBand, Segmented, Stat, TagGroup, and ToolCallChip, and reconcile all
  96 registry components, 439 animated icons, two hooks, and the dashboard block across styling, portal
  theming, accessibility, responsive behavior, documentation, tests, and generated registry integrity.

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - **Breaking (both packages — `minor` is the breaking position pre-1.0).** Two changes here alter
  existing behaviour and were previously filed as `patch`, which would have broken consumers on an
  upgrade they had no reason to review:

  - `vegastack-design verify --post-write` now **requires** `--expected-integrity <sha256-base64>`,
    a flag that did not exist before. Any existing consumer CI step invoking `--post-write` with just
    `--item`/`--target-dir` now exits 2. Take the value from the pre-write run, which prints the exact
    integrity-pinned command to use.
  - `MarkdownView` images are **same-origin by default**. Remote `<img>` sources previously rendered
    unconditionally and are now dropped unless their origin is listed in the new `allowedImageOrigins`
    prop. Consumers rendering markdown that references remote images must opt those origins in.

  Constrain registry credentials and copied-file verification to trusted origins and contained paths,
  pin post-write checks to a digest retained before copy-in, match shadcn's inherited TypeScript alias
  resolution, and make Markdown images same-origin by default with an explicit remote-origin allowlist.

  Refuse to place credential material in a registry URL, and redact it from CLI output. The
  trusted-origin check only inspected request HEADERS, so a `components.json` registry entry such as
  `"@vegastack": "http://host/r/{name}.json?k=${CF_ACCESS_CLIENT_SECRET}"` declared no headers, skipped
  the check entirely, and sent the Cloudflare Access service token to an arbitrary origin over plain
  http — while `check-updates` exited 0. The token was also echoed verbatim into stderr, and therefore
  into CI logs. Credentials now must travel as headers: a URL is recorded in server access, proxy and
  CDN logs even when the origin is fully trusted, so the refusal is unconditional rather than
  origin-scoped. Applied identically in `check-updates`, `verify`, and the shared internal helper so
  the three do not diverge on this boundary. Uncredentialed registries (including plain-http localhost
  mirrors) are unaffected.

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`09fa52c`](https://github.com/vegastack/vegastack-design/commit/09fa52ce0838cd8b3a48e6dd1abc29b6e47c2d0c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Fix `Terminal`'s scrollable command pane having no visible focus indicator under
  `forced-colors: active`.

  The pane is keyboard-focusable and signalled focus with a border tint plus `outline-none`. Forced
  colors replaces `border-color` outright, so the tint vanished, and Tailwind v4's `outline-none`
  suppresses the shared `:focus-visible` outline with no forced-colors carve-out — leaving no
  indicator at all in the forced palette. The affordance is now that shared outline, inset with a
  negative offset so neither the terminal's `overflow-hidden` root nor `scroll-fade-x`'s mask can clip
  it. The layout-reserving transparent border is removed with the tint it existed for, so the pane
  renders 2px shorter.

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`7595cfd`](https://github.com/vegastack/vegastack-design/commit/7595cfd7c7eeaaafa95c7bd8d621cd4e5cb5087f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Give `Terminal`'s scrollable command pane an accessible name, and accept `aria-label` /
  `aria-labelledby` to override it.

  The pane is keyboard-focusable — a scrollable region has to be reachable without a pointer — but it
  was a bare `<div tabIndex={0}>` with no role and no name, so a screen reader announced it as an
  unnamed stop in the tab order (WCAG 4.1.2). It is now a `group` labelled by the visible `title`, so
  `title="Install"` reads as "Install, group" with no caller changes. `group` rather than `region`
  because `region` is a landmark and a page with several install snippets should not gain several
  landmarks.

  `aria-label` and `aria-labelledby` passed to `Terminal` now apply to that pane instead of the outer
  block, matching `ScrollArea`. On the outer block they had no effect — it carries no role — so nothing
  that previously worked stops working.

### Patch Changes

- Updated dependencies [[`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f)]:
  - @vegastack/design@0.2.0
  - @vegastack/design-tokens@0.2.0

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
