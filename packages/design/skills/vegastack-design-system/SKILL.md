---
name: vegastack-design-system
description: Build product UI with the VegaStack design system — which component to pick, the semantic token vocabulary, composition patterns for forms and overlays, and the do/don't rules that keep code on-system. Use before generating or editing any UI code in a project that consumes @vegastack/design.
---

# VegaStack design system

Base UI + Tailwind v4 + OKLCH semantic tokens. Components are copy-in via a private shadcn registry;
the runtime and token layer are public npm.

Load this before writing UI code. For first-time project setup (installing packages, wiring the
provider, configuring registry access), use the `vegastack-consume` skill instead.

## Pick a component

[references/components.md](references/components.md) is the complete roster, grouped by family, with
each component's one-line purpose. Read it when choosing between components.

You can also query the live registry, which carries `meta.whenToUse` / `meta.whenNotToUse` on every
item to disambiguate close calls (primary vs. ghost vs. destructive):

```bash
pnpm dlx shadcn@latest list @vegastack
```

Rules that decide most component questions:

- **Compose `app-shell`** for a sidebar + header + main layout — never hand-roll the landmark trio.
- **`segmented`** for 2–5 exclusive options inline; **`tabs`** when the choice switches page regions.
- **`alert` variant=strip** for in-content notices and plan/trial rows; **`announcement-banner`** only
  for the full-width inverse strip at the very top of the page.
- **`code-block`** for static syntax-highlighted source; **`terminal`** for command sessions.
- **`navigation-menu`** is top-level site navigation with panels, not a menu inside a page.
- **Marketing components** (`marketing-surface`, `section-header`, `figure-frame`, `terminal`,
  `logo-row`, `testimonial`, `staggered-text-reveal`, `particle-field`, `pricing-section`, and
  Button's `cta` variant) are scoped to `.vs-marketing` and must never appear in product UI.

## Tokens

Semantic CSS custom properties from `@vegastack/design-tokens/theme.css` (OKLCH, `:root` + `.dark`).
Always use the utility, never a raw value.

| Role     | Utilities                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------ |
| Surface  | `bg-background` `bg-card` `bg-popover` `bg-muted` `bg-accent` `bg-sidebar-*`                     |
| Text     | `text-foreground` `text-muted-foreground` `text-{primary,accent,popover}-foreground`             |
| Status   | `bg-{destructive,success,warning,info}` + `-subtle` / `-hover` / `-text` / `-foreground`         |
| Border   | `border-border` `border-input` — there are no rings; focus is the native outline                 |
| Radius   | `rounded-{xs,sm,md,lg}` — `lg` is the cap, `xl` does not exist                                   |
| Type     | `text-{xs…3xl}` · `text-h1…h4` · `text-label` · `text-mono-label` · `text-display-{sm,md,lg,xl}` |
| Font     | `font-sans` `font-mono` `font-serif`                                                             |
| Motion   | `duration-{fast,base,slow}` paired with `ease-{standard,emphasized,exit,spring}`                 |
| Entrance | `motion-pop-in` `motion-enter-up` `motion-shake`                                                 |

Alpha and opacity are **different roles**: colour compositing takes an `--alpha-*` token
(`bg-foreground/(--alpha-ink-tint)`), whole-element opacity takes an `--opacity-*` token
(`opacity-(--opacity-dim)`). A raw `/20` or `opacity-50` is wrong in both cases.

`--brand` is a marker-role accent only — never a functional state colour.

**Overriding tokens:** redefine one runtime variable in your global CSS and every component repaints
in both themes:

```css
:root {
  --primary: oklch(0.55 0.2 264);
}
```

Never override a `--color-*` variable — that is the build-inlined Tailwind bridge, not the runtime
contract.

## Composition patterns

- **Forms** — Base UI `Field` + react-hook-form `Controller` + Zod 4 (`z.email()`). `Field.Control`
  emits `onValueChange`, not a DOM `onChange` event.
- **Overlays** — enter/exit is driven by `data-starting-style`/`data-ending-style` on the popup root,
  inside a portal + positioner. Theme, toast, tooltip, and direction providers all come from
  `<VegaStackProvider>`; your app root needs `isolation: isolate` or portaled popups can render under
  page chrome.
- **Compound parts import flat** — `import { DialogTrigger, DialogContent }`. Sub-property access
  (`<Dialog.Trigger>`) only works inside a `'use client'` file, because across the RSC boundary the
  compound is a client-reference proxy and the sub-property is `undefined`.
- **Polymorphism** uses Base UI's `render` prop, never Radix's `asChild`.

## Do / Don't

**Do**

- Use a semantic token for every visual value.
- Use `render` for polymorphism and `cn()` from `@vegastack/design` for class merging.
- Use `Icon`/`BrandIcon` from `@vegastack/design/icons`, or `lucide-react` directly for internal
  chrome.
- Implement every applicable state: default, hover, focus, loading, empty, error, success, disabled.
- Put `truncate` on an inner span, with `min-w-0` on the flex container.

**Don't**

- Hardcode a hex, a px value, or a raw Tailwind palette class (`bg-neutral-900`, `text-red-500`).
- Use `font-bold`/`font-semibold` — the weight ladder is 400/500, owned by the type roles.
- Use `rounded-xl`, `text-4xl` or larger, a raw `z-N`, or `transition-all`/`transition-colors`.
- Set `outline-none` without providing another focus affordance.
- Pull in a second icon library or hand-write an inline `<svg>` as an icon.
- Put `uppercase` on non-mono type, or on anything above 14px.

## Reference

Full component documentation, live previews, prop tables, and accessibility notes:
<https://design.vegastack.com/docs/components>. Machine-readable summaries for agents are at
`/llms.txt` and `/llms-full.txt` on the same host.
