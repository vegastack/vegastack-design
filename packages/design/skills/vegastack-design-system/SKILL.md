---
name: vegastack-design-system
description: Build product UI with the VegaStack design system — which component to pick, the semantic token vocabulary, composition patterns for forms and overlays, and the do/don't rules that keep code on-system. Use before generating or editing any UI code in a project that consumes @vegastack/design.
---

# VegaStack design system

Base UI + Tailwind v4 + OKLCH semantic tokens, on shadcn's `base-nova` style. Components are copy-in
via a private shadcn registry; the runtime and token layer are public npm.

Load this before writing UI code. For first-time project setup (installing packages, wiring the
provider, configuring registry access), use the `vegastack-consume` skill instead.

**The shadcn reset is a clean break, with no compatibility layer** — no aliases, no deprecation
shims, no re-exports. It ships as an ordinary minor release, so the version number does not warn you;
this section does. Every component shadcn ships is now upstream's own file, so its API is upstream's
API. The complete break is in the shadcn-reset migration guide that ships with the release notes; the
live contract for any single component is its page at
<https://design.vegastack.com/docs/components>. The headlines, because they decide most code an agent
writes:

- **Retired, with no drop-in:** `IconButton` → `Button size="icon*"` · `OTPInput` → `InputOTP` ·
  `PasswordInput` → an `InputGroup` composition · `CheckboxGroup` → `FieldSet` + `Checkbox` ·
  `FieldInline` → `EditableCell` · `Segmented` → a joined `ToggleGroup` · `SplitButton` → a
  `ButtonGroup` composition · `ProgressIndicator` → `Progress` + `Spinner` · `OnboardingChecklist` →
  the `onboarding-01` block. The ten marketing components were deleted outright.
- **Gone from the token layer:** the surface ladder (`surface-1/2/3`), every `--alpha-*` and
  `--opacity-*`, `--size-*`, `--icon-*`, `--z-*`, `--shadow-overlay`, and the role type scale
  (`text-h1`, `text-label`, `text-code`, `text-mono-label`, `text-display-*`).
- **Gone from `@vegastack/design`:** `surfaceInteractive`, `surfaceInteractiveGroup`,
  `fillInteractive`, `FillTone`, `fieldControl`, `fieldControlGroup`, `selectedChipVariants`.
  `cn`, `TIMINGS`, `FLOATING`, `mergeRefs`, `prose`/`proseClassName` and the icon runtime all stay.

## Pick a component

[references/components.md](references/components.md) is the complete roster, grouped by family, with
each component's one-line purpose. Read it when choosing between components.

You can also query the live registry, which carries `meta.whenToUse` / `meta.whenNotToUse` on every
item to disambiguate close calls (primary vs. ghost vs. destructive):

```bash
pnpm dlx shadcn@latest list @vegastack
```

Rules that decide most component questions:

- **`Button` is one axis** — `variant` is `default · outline · secondary · ghost · destructive ·
link` (upstream's set, verbatim). `destructive` is a soft tint, not a solid red fill. Icon-only
  actions are `<Button size="icon">` (or `icon-xs` / `icon-sm` / `icon-lg`) with an `aria-label`;
  an icon in a bare `<button>` is off-system. An icon-only LINK stays an `<a>` styled with
  `buttonVariants({ variant, size: "icon" })` — never a `Button`, which would put `role="button"`
  on navigation. `loading` is ours: it holds the label's box and sets `aria-busy`.
- **Control sizes are upstream's names: `default · xs · sm · lg`**, plus
  `icon · icon-xs · icon-sm · icon-lg` where a square tier exists. The old `md` default is gone, and
  most of the components that are ours dropped their `size` prop entirely and take their height from
  what they compose. Four keepers still carry a small private axis over something that is not a
  control height — `Chip` (`sm`/`md`, the inline and control pill scales), `StatusIcon`, `Stat` and
  `Image`'s corner — and they say so on their own pages.
- **Compose `app-shell`** for a sidebar + header + main layout — never hand-roll the landmark trio.
- **`select`** for a short fixed option set; **`searchable-select`** when the list is long enough to
  need a search field (it is the preset `country-select` and `region-select` are built from — reach
  for it before composing `combobox` by hand); **`combobox`** directly only for free text,
  suggestions or multi-select chips.
- **`toggle-group`** with `spacing={0}` for 2–5 exclusive options inline; **`tabs`** when the
  choice switches page regions.
- **`alert`** for an in-content notice — `variant` is `default · destructive · success · warning ·
info`, each an ink on the `card` surface with a required icon; **`announcement-banner`** only for
  the full-width inverse strip at the very top of the page.
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

## Tokens

Semantic CSS custom properties from `@vegastack/design-tokens/theme.css` (OKLCH, `:root` + `.dark`),
on shadcn's `neutral` base. Always use the utility, never a raw value.

| Role     | Utilities                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface  | `bg-background` (page) · `bg-card` · `bg-popover` · `bg-sidebar`                                                                                                                                                    |
| Fill     | `bg-primary` (solid action, every checked control) · `bg-secondary` (soft) · `bg-muted` (well, track, skeleton) · `bg-accent` (hover)                                                                               |
| Text     | `text-foreground` · `text-muted-foreground` · `text-{primary,secondary,accent,card,popover}-foreground`                                                                                                             |
| Status   | `bg-{destructive,success,warning,info}` · `-foreground` (ink ON the fill) · `-text` (ink on the page or on the family's own tint)                                                                                   |
| Border   | `border-border` · `border-input` — there are no rings; focus is one global outline                                                                                                                                  |
| Radius   | `rounded-{sm,md,lg,xl,2xl}` — all derived from the single `--radius`                                                                                                                                                |
| Type     | Tailwind's own `text-{xs…7xl}`. `text-sm` is 14px, `text-base` is 16px. Line-height and letter-spacing above `text-base` come from the theme — never write `tracking-*`, an arbitrary `text-[13px]`, or `uppercase` |
| Font     | `font-sans` `font-mono` `font-serif` `font-heading`                                                                                                                                                                 |
| Motion   | `duration-{fast,base,slow}` · `ease-{standard,emphasized,exit,spring}` — or Tailwind's own steps                                                                                                                    |
| Entrance | `motion-pop-in` `motion-enter-up` `motion-shake` `motion-flash`                                                                                                                                                     |
| Docked   | `motion-dock-in` / `motion-dock-out` — a control parked at a viewport edge, 150ms in / 100ms out                                                                                                                    |
| Prose    | `proseClassName` from `@vegastack/design` — the whole rendered-rich-text recipe, one class                                                                                                                          |

**Hover and pressed are written, not imported.** A component owns its own interaction chrome, the
way shadcn writes it:

```tsx
// A transparent control on a known surface.
<button className="rounded-md px-2 hover:bg-accent hover:text-accent-foreground" />;

// A solid.
<button className="bg-primary text-primary-foreground hover:bg-primary/80" />;

// A tinted status control. The ink on a tint is `-text`, never the fill.
<button className="bg-destructive/10 text-destructive-text hover:bg-destructive/20" />;
```

A pressed step is optional. `surfaceInteractive`, `fillInteractive`, `fieldControl`,
`fieldControlGroup` and `selectedChipVariants` were **deleted** from `@vegastack/design` with no
alias; if you are upgrading, replace each with the literal it expanded to.

**Rendered rich text comes from a recipe.** Anything the system did not author element by element —
markdown, a contenteditable, CMS copy — wears one class on its root:

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

`muted`, `accent` and `secondary` share one value in this base, and all three are kept: name the one
whose ROLE you mean, so a consumer can retune one without moving the others.

**Status colour has two inks.** `-foreground` is the ink on the solid fill; `-text` is the ink on the
page and on the family's own `/10`-`/30` tint. Using the fill itself as text on a tint measures
3.98-4.35:1, which the contrast gate rejects. `info` is links and informational UI only.

`--brand` is a marker-role accent only — never a functional state colour, and never a text ink
(`--brand-text` is the readable half).

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

- **Forms are composed, not configured** — `Field` is layout and copy: `FieldLabel` bound with
  `htmlFor`, the control, then `FieldDescription` and `FieldError` as CHILDREN. There is no `label`,
  `description` or `error` prop, and no context that reaches into the control. State is written where
  it belongs: `aria-invalid` on the control (for assistive tech), `data-invalid` / `data-disabled` on
  the `Field` (for the block's styling). `FieldError` is `role="alert"`, carries a leading icon so an
  error is never colour alone, and takes either children or an `errors` array it de-duplicates.
  react-hook-form's `register` wires straight to the control; there is no `Controller` indirection.
- **A set of related checkboxes is a `FieldSet` + `FieldLegend` + one `Field` per option** — that is
  the composition upstream documents, and it is what `Checkbox`'s own docs page shows. Compute
  `checked` / `indeterminate` for a select-all parent in your own state, as the Table example does.
- **Click-to-edit is `useInlineEdit`** — draft, commit, cancel, focus restoration and the
  double-commit guard, with no opinion about the editor or the display. `EditableCell` is built
  on it.
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
- Let the parent decide a form control's width — every control is `w-full`.
- Reach for a plain Tailwind utility for size, radius, shadow, z-index, alpha, weight and motion:
  `h-8`, `size-4`, `rounded-xl`, `shadow-md`, `z-50`, `bg-foreground/10`, `opacity-50`,
  `font-semibold`, `transition-colors duration-100 ease-in-out` are all on-system now.

**Don't**

- Hardcode a hex, a px value, or a raw Tailwind palette class (`bg-neutral-900`, `text-red-500`).
- Add a focus ring or glow. Focus is one global outline, and text entry tints its border instead;
  `ring-3`, `ring-ring/50` and `focus-visible:ring-*` are rejected by lint.
- Set `outline-none` without providing another focus affordance.
- Use a status FILL as ink on its own tint — `bg-destructive/10 text-destructive` measures 3.99:1.
  The ink on a tint is `-text`.
- Pull in a second icon library, hand-write an inline `<svg>` as an icon, or pass
  `size`/`width`/`height` to a lucide component.
- Hand-roll a removable pill, or a `role="status"` live region with its own sequence counter.
- Give a form control a fixed width (`w-56`, `w-64`) — it reads fine on the page it was tuned for
  and overflows at 320px. Constrain the parent instead.
- Expect a compatibility shim from before the reset. There is none — see the migration guide.

## Reference

Full component documentation, live previews, prop tables, and accessibility notes:
<https://design.vegastack.com/docs/components>. Machine-readable summaries for agents are at
`/llms.txt` and `/llms-full.txt` on the same host.
