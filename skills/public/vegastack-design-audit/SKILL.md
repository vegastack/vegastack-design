---
name: vegastack-design-audit
description: Read-only audit of an application that consumes the VegaStack design system — finds hardcoded colours and sizes, off-system utility classes, raw HTML where a component exists, accessibility gaps, provider/setup mistakes, and component copies that have drifted from the registry. Reports file:line findings with severity; never edits. Use when asked to audit a project for design-system alignment, check token compliance, or find stale VegaStack components.
---

# Consumer design audit (read-only)

**Reports findings; never edits.** Output is a grouped `file:line · rule · fix · severity` list.

This audits an application that consumes VegaStack. Scope it to your own UI source — **exclude
`components/ui/`**, which holds copied-in VegaStack components you do not own. Drift there is a
separate check (§5), not a styling finding.

## 1. Drift and setup first

These are mechanical and catch the highest-value problems:

```bash
npx --package=@vegastack/design vegastack-design check-updates
```

`⬆ update` means the registry has a newer version. `≈ drift` means the installed file differs from
the registry item — either an upstream change or a local edit to a file you do not own. Both are
findings; a local edit to a copied-in component is a **high** finding, because the next
`--overwrite` silently destroys it. The fix is to move the customisation into your own wrapper
component or a token override.

Then verify setup, since these failures look like component bugs:

- Is `@vegastack/design/theme.css` (or `preset.css`) imported before your own CSS?
- Does the app root have `isolation: isolate` — either via `base.css` or `className="isolate"`?
  Without it, portaled popups render under page chrome.
- Is `<VegaStackProvider>` mounted once at the app root, with `suppressHydrationWarning` on `<html>`?
- Are there two providers, or a provider mounted below a route boundary? Both cause theme and toast
  bugs that present as random.

## 2. Hardcoded visual values

Every visual value must resolve through a semantic token.

**The searches below produce candidates, not findings.** Open every hit before reporting it. A `#`
match inside a comment, a URL fragment, a CSS id selector, or a string that documents some library's
default is not a hardcoded colour. A `[…]` arbitrary value is legitimate when it holds a
`var(--token)`, a `calc()` containing one, a layout primitive (`fr`, `%`, `auto`, `min-content`), or
a CSS keyword. Reporting a comment as an error costs the owner more trust than the finding is worth.

```bash
rg -n '#[0-9a-fA-F]{3,8}\b' --glob '!components/ui/**' --glob '*.{ts,tsx,css}'
rg -n '\b(bg|text|border|fill|stroke|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}' --glob '!components/ui/**'
rg -n '\[[0-9]+(px|rem|em)\]' --glob '!components/ui/**'
rg -n 'style=\{\{' --glob '!components/ui/**'
```

- **hardcoded colour** — a hex literal used as a style value. Use a semantic token. **error**
- **raw palette** — a Tailwind palette class. Use `bg-primary`, `text-muted-foreground`,
  `border-border`, or a status family. **error**
- **hardcoded dimension** — an arbitrary px/rem value. Use the size, spacing, or radius scale.
  **error**
- **inline style** — allowed only when every key is a `--*` custom property. Any direct visual
  property is a finding. **error**

## 3. Off-system utilities

```bash
rg -n '\b(rounded-xl|rounded-2xl|rounded-3xl|text-4xl|text-5xl|text-6xl|font-bold|font-semibold|transition-all|transition-colors|z-[0-9]+|opacity-[0-9]+|tracking-[a-z]+|shadow-[a-z]+|blur-[a-z]+)\b' --glob '!components/ui/**'
```

- `rounded-xl` and larger do not exist — the scale caps at `rounded-lg`. **error**
- `text-4xl` and larger are off-scale — use `text-display-sm/md/lg/xl`. **error**
- `font-bold`/`font-semibold` — the weight ladder is 400/500, owned by the type roles. **error**
- `transition-all` / `transition-colors` — colour changes are immediate; enumerate the causal
  opacity, transform, or geometry properties. **error**
- a raw `z-N` — two bands only: `z-(--z-raised)`, `z-(--z-overlay)`. **error**
- a raw `opacity-NN` — use an `--opacity-*` role (`opacity-0`/`opacity-100` are exempt). **warning**
- raw `tracking-*`, `shadow-*`, `blur-*` — owned by the type and effect roles. **warning**
- a raw `/NN` colour-alpha step — use an `--alpha-*` role. Alpha and opacity are different roles and
  are not interchangeable. **warning**
- `uppercase` on non-mono type, or above 14px. Uppercase is mono-exclusive. **warning**

Every `transition*` utility must pair a `duration-*` **and** an `ease-*` token in the same class
string, or it silently inherits a default curve. **warning**

## 4. Component substitution and accessibility

- **Raw HTML where a component exists** — a native `<button>`, `<input>`, `<select>`, `<textarea>`,
  or a hand-rolled dialog, dropdown, tooltip, or tab set. Use the VegaStack component; it carries the
  states, keyboard model, and ARIA. **warning**
- **A second icon library**, or a hand-written inline `<svg>` used as an icon. Only `lucide-react`
  and `Icon`/`BrandIcon` from `@vegastack/design/icons` are sanctioned. **error**
- **`outline-none` with no replacement focus affordance** anywhere in the file. **error**
- **Icon-only controls with no accessible name** — a button with no visible text needs `aria-label`
  or `aria-labelledby`. Prefer `IconButton`, which requires it at the type level. **error**
- **Missing states** — a surface that fetches data needs loading, empty, and error states, not just
  the success path. **warning**
- **Truncation** — `truncate`/`line-clamp-*` on the same element as `flex`/`inline-flex` silently
  does nothing, because `flex` wins the display conflict. Put `min-w-0` on the flex container and
  `truncate` on an inner span. **warning**
- **Touch targets** below 24×24 — expand with an invisible hit area
  (`relative` + `before:absolute before:-inset-N`), not a larger visual control. **warning**

## 5. Local edits to copied-in components

```bash
rg -n '@vegastack' components/ui/ -l
```

A copied-in component is yours to keep but not to edit — the next `--overwrite` overwrites it. Any
diff reported by `check-updates` as `≈ drift` on a file you did not intend to change is a **high**
finding. Route customisation through a token override, a wrapper component, or a `className` prop.

A missing `// @vegastack …` provenance header is **normal** and never a finding on its own: the
shadcn CLI strips leading comments during copy-in.

## 6. Output

Group by file. Each finding: `file:line` · rule · suggested fix · severity.

- **error** — a hardcoded visual value, an accessibility violation, or an edited copied-in component.
- **warning** — raw HTML where a component exists, a missing state, an off-system utility with a
  working fallback.
- **info** — a component with an available update worth a deliberate `--diff` review.

Never auto-fix. Report, and let the owner decide.
