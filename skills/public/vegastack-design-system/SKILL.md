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

- **`Button` is two axes** — `variant` is the shape (`solid · soft · outline · ghost · link · cta`),
  `tone` is the hue (`neutral · destructive · success · warning · info`). A destructive action is
  `variant="soft" tone="destructive"`; a solid red button does not type-check. Icon-only actions are
  **`IconButton`** (`shape="square" | "round"`) — `Button` has no icon size, and an icon in a bare
  `<button>` is off-system. An icon-only LINK stays an `<a>`, styled with
  `buttonVariants(...) + iconButtonGeometry(size)` — never an `IconButton`, which would put
  `role="button"` on navigation.
- **One size vocabulary everywhere** — `xs · sm · md · lg`, with `md` the default. No component has a
  size called `default`.
- **Compose `app-shell`** for a sidebar + header + main layout — never hand-roll the landmark trio.
- **`segmented`** for 2–5 exclusive options inline; **`tabs`** when the choice switches page regions.
- **`alert` variant=strip** for in-content notices and plan/trial rows; **`announcement-banner`** only
  for the full-width inverse strip at the very top of the page.
- **`chip` is the ONE pill** — `hue` × `size` (`sm` inline · `md` control-scale) × `active`, with
  `onRemove` giving a real 24×24 remove control. `Tag`, `FilterChip` and `ComboboxChip` are that
  primitive composed through `render`; never hand-roll a pill with its own height, radius, or a
  sub-24px `×`. A **`badge`** is the different job: status, never removable, never a selection.
- **`useAnnouncer` is the one live region** — destructure `announce` and `Announcer` from it and
  render ONE `Announcer` element per component, mounted for its life. It keeps the region observed from first paint
  and re-keys it per call, so repeating an identical string still announces. Do not hand-roll a
  `role="status"` node with a `{text, seq}` counter.
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
| Surface  | `bg-background` (page) · `bg-card` (every surface; `popover`/`sidebar` ARE `card`)               |
| Ladder   | `bg-surface-1` (rest fill / well) · `bg-surface-2` (hover) · `bg-surface-3` (pressed / selected) |
| Text     | `text-foreground` `text-muted-foreground` `text-{primary,accent,popover}-foreground`             |
| Status   | `bg-{destructive,success,warning,info}` + `-subtle` / `-hover` / `-text` / `-foreground`         |
| Border   | `border-border` `border-input` — there are no rings; focus is the native outline                 |
| Radius   | `rounded-{xs,sm,md,lg}` — `lg` is the cap, `xl` does not exist                                   |
| Type     | `text-{xs…3xl}` · `text-h1…h4` · `text-label` · `text-mono-label` · `text-display-{sm,md,lg,xl}` |
| Font     | `font-sans` `font-mono` `font-serif`                                                             |
| Motion   | `duration-{fast,base,slow}` paired with `ease-{standard,emphasized,exit,spring}`                 |
| Entrance | `motion-pop-in` `motion-enter-up` `motion-shake` `motion-flash`                                  |
| Docked   | `motion-dock-in` / `motion-dock-out` — a control parked at a viewport edge, 150ms in / 100ms out |
| Prose    | `proseClassName` from `@vegastack/design` — the whole rendered-rich-text recipe, one class       |

**Hover and pressed come from a recipe, never a literal.** Import the two class strings rather than
writing `hover:bg-*` by hand — that is how a control gets both steps and stays on the ladder:

```tsx
import { cn, surfaceInteractive, fillInteractive } from "@vegastack/design";

// A transparent control on a known surface.
<button className={cn("rounded-md px-2", surfaceInteractive)} />;
// hover:bg-surface-2 active:bg-surface-3

// A control on an unknown backdrop, or one that hovers in its own hue.
<button className={cn("bg-destructive-subtle", fillInteractive.destructive)} />;
// hover:bg-destructive/(--alpha-hover) active:bg-destructive/(--alpha-pressed)
```

A **solid** fill uses neither — it steps through its own darker `-hover` / `-active` tokens.

**Rendered rich text comes from a recipe too.** Anything the system did not author element by element
— markdown, a contenteditable, CMS copy — wears one class on its root:

```tsx
import { cn, proseClassName } from "@vegastack/design";

<div
  className={cn(proseClassName, className)}
  dangerouslySetInnerHTML={html}
/>;
```

`MarkdownView` and `TextEdit` both wear it, so they render identical typography. It is expressed as
descendant rules (`[&_h1]:…`), which means an element-level class on a child **loses** to it
(specificity (0,1,0) against (0,1,1)) — restyle by composing `prose` (the per-element record), never
by setting a class on the rendered element.

`secondary`, `muted`, `accent` and the `sidebar-*` family are **aliases** of ladder rungs
(`secondary` = `muted` = `surface-1`, `accent` = `sidebar-accent` = `surface-2`, `sidebar` = `card`).
They still compile; name the rung in new code.

`border` is one translucent hairline — `foreground` at `--alpha-border` — so it reads on the page, on
a card and inside a well alike. `info` is **links and informational UI only**: promotion and
selection take a ladder rung or `primary`.

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
  emits `onValueChange`, not a DOM `onChange` event. **`Field` owns the feedback layer**: helper text
  renders below the control, the error below that as a polite `role="status"`, and the invalid shake
  belongs to the field — wrap a control in a `Field` to get it, and pass `shakeSignal` (a
  submit-attempt counter) there to re-shake a field that never stopped being invalid. A bare
  `<Input aria-invalid>` outside a `Field` tints its border and does not move.
- **A set of related checkboxes is a `CheckboxGroup`** — pass `allValues` and mark one child
  `parent` to get select-all with the mixed state, rather than computing checked/indeterminate in
  your own state. Name the group with a `FieldSet`/`FieldLegend` or `aria-labelledby`.
- **Click-to-edit is `useInlineEdit`** — draft, commit, cancel, focus restoration and the
  double-commit guard, with no opinion about the editor or the display. `FieldInline` and
  `EditableCell` are built on it.
- **Overlays** — enter/exit is driven by `data-starting-style`/`data-ending-style` on the popup root,
  inside a portal + positioner. Theme, toast, tooltip, and direction providers all come from
  `<VegaStackProvider>`; your app root needs `isolation: isolate` or portaled popups can render under
  page chrome.
- **Compound parts import flat** — `import { DialogTrigger, DialogContent }`. Sub-property access
  (`<Dialog.Trigger>`) only works inside a `'use client'` file, because across the RSC boundary the
  compound is a client-reference proxy and the sub-property is `undefined`.
- **Polymorphism** uses Base UI's `render` prop, never Radix's `asChild`. When `render` swaps a
  button-like component's element for a non-button (e.g. `Button render={<Link/>}`), also pass
  `nativeButton={false}` — Base UI warns otherwise.

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
- Hand-roll a removable pill, or a `role="status"` live region with its own sequence counter.

## Reference

Full component documentation, live previews, prop tables, and accessibility notes:
<https://design.vegastack.com/docs/components>. Machine-readable summaries for agents are at
`/llms.txt` and `/llms-full.txt` on the same host.
