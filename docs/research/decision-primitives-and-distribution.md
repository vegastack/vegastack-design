# Decision dossier — Primitives, Distribution, Tailwind v4 boundary

> Durable reference. Adversarial research, June 2026, cited to primary sources. Backs requirements §4, §5, §9 and decisions D1, D2, D11. Preserve in full.

## 1. Base UI vs Radix (→ D1: Base UI via shadcn, reversible)

### Base UI — verified facts
- `@base-ui/react` (formerly `@base-ui-components/react`), unstyled/headless. About page (verbatim): *"From the creators of Radix, Material UI, and Floating UI, Base UI is an unstyled React component library for building accessible user interfaces."* Maintainers incl. **Colm Tuite (Radix founder)**, **James Nelson (Floating UI)**, MUI core (Michał Dudak, Marija Najdova, Albert Yu, Lukas Tyla), Aarón García, Jenna Smith. Repo under `mui/base-ui` but positioned as independent. → **origin claim TRUE.**
- **Stable v1 shipped Dec 11 2025** (ended long beta). Cadence since: v1.5.0 (May 19 2026), **v1.6.0 (Jun 17 2026, latest)** — ~monthly minors, perf work, stability promotions.
- Coverage (35+): Accordion, Alert Dialog, Avatar, Checkbox(+Group), Collapsible, **Combobox**, Context Menu, Dialog, Drawer, Field/Fieldset/Form, Input, Menu/**Menubar**, Meter, Navigation Menu, Number Field, **OTP Field**, Popover, Preview Card, Progress, Radio, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Toggle/Group, **Toolbar**, Tooltip + utilities (Direction/CSP Provider, `mergeProps`, `useRender`). **Ships Combobox/Autocomplete/multi-select/Toolbar/Menubar natively — Radix's real gaps.**
- API: composition via **`render` prop** (vs Radix `asChild`). Single tree-shakable package. React 17+. Client-component primitives (not true RSC — normal for headless).
- Sources: base-ui.com/react/overview/{about,releases,quick-start}; npmjs.com/package/@base-ui/react.

### Radix — "stagnation" claim OVERSTATED
- Maintained by **WorkOS** (acquired Modulz 2022). **Commit log active through Jun 15 2026** incl. *"Stabilize composed ref identities to end React 19 render loop (#3963)"*; steady June commits. ~1,764 commits; 285 open issues / 122 PRs (heavy-use backlog, not abandonment). Maintainer **Chance Strickland** driving React 19 compat. `@radix-ui/react-slot` ~131M weekly downloads.
- **Bear case:** post-acquisition original team left; slow cadence for years; long gaps (Combobox/multi-select). Medium piece quotes Colm calling Radix a "liability" — **but Colm now leads Base UI; most conflicted possible source, discount heavily.**
- **Bull case:** WorkOS investing, weekly commits in 2026 incl. React 19, mature/battle-tested, massive install base.
- Sources: github.com/radix-ui/primitives/commits/main; softwareengineeringdaily.com Chance Strickland interview.

### Verdict
Base UI for **longevity** (active greenfield from the category's inventors, better coverage), **routed through shadcn so it's swappable** (Radix = reversible fallback). Not out of Radix-fear — Radix isn't dying — but because Base UI is the forward project. **Risks:** Base UI young (v1 ~6mo), smaller ecosystem, most AI-generated code still assumes Radix (→ agents need registry/skill guidance to target Base UI). **Evidence caveat:** no primary-source bundle-size benchmark found; LogRocket declined a full size/SSR comparison — treat KB claims skeptically.

### shadcn + Base UI
shadcn supports Radix **or** Base UI, switchable per `components.json`. The choice is not irreversible.

## 2. shadcn "never edit, always wrap" — MYTH (kernel of truth)
- shadcn is copy-in: *"once you install the components, they become your code and you are responsible for updating them."* No auto-update (not a dependency).
- Upgrade tooling current (CLI v4, Mar 2026): `add --overwrite` re-pulls; **`--diff`** previews upstream-vs-local; `--dry-run`/`--view`. (`diff` NOT deprecated.)
- The value IS owning/editing the code. Real practice = **hybrid**: edit-in-place where a component must diverge (accept merge cost via pristine-copy + `--diff`), wrap for additive behavior, centralize authoring in **your own custom registry**.
- Sources: ui.shadcn.com/docs/cli; /docs/changelog/2026-03-cli-v4; github.com/shadcn-ui/ui/discussions/7170.

## 3. Distribution: npm vs registry vs hybrid (→ D2 Hybrid)

| | npm package | shadcn registry |
|---|---|---|
| Code | `node_modules` (opaque) | copied into downstream repo |
| Ownership | central | downstream |
| Update | `npm update` (auto) | re-run `add` (manual/pull) |
| Customize | exposed props / wrap only | fully (their file) |
| Agent-editable | ❌ | ✅ |

- **Mature systems = npm** (Polaris `@shopify/polaris`, React Spectrum `@adobe/react-spectrum`, Primer `@primer/react`, Atlaskit `@atlaskit/*`) — central control; deep customization = "drop to React Aria/Stately and rebuild" (the styled pkg isn't meant to be edited).
- **Registry = copy-in ownership**, agent-native, can ship tokens+config+components together (CLI v4 `registry:base` ships a whole DS as one payload; `registry:font`). Updates manual.
- **Hybrid = production sweet spot.** Concrete documented example: **OpenStatus** — monorepo `packages/ui` consumed internally as a dep AND exposed as a shadcn registry; a publish-time transform rewrites `@openstatus/ui/...` → `@/...` for external consumers (`npx shadcn add https://openstatus.dev/r/status-banner.json`). shadcn `init --monorepo` scaffolds this shape (Turborepo web+ui, Tailwind v4 OKLCH vars).
- **Fundamental tension (sourced):** npm = central control + trivial updates but locked; registry = full customization + ownership but **no auto-propagation** (re-pull + merge). Hybrid puts each layer on its favorable side.
- **Honesty:** even your own registry does NOT auto-propagate — downstream must re-run `add`. Registry centralizes *authoring*, not *distribution*. "Registry = npm auto-update" is FALSE.
- Sources: openstatus.dev/blog/shadcn-component-registry; ui.shadcn.com/docs/{monorepo,registry/*,changelog/2026-03-cli-v4}; jishulabs/buildmvpfast/zenn analyses.

### Auth
- **Private registry:** `components.json` `registries` map + `${ENV}` interpolation; Bearer header / custom headers (`X-API-Key`) / query token. `REGISTRY_TOKEN=… npx shadcn add @private/button`. HTTPS mandatory.
  ```json
  { "registries": { "@vegastack": {
      "url": "https://design.vegastack.com/r/{name}.json",
      "headers": { "Authorization": "Bearer ${REGISTRY_TOKEN}" } } } }
  ```
  (For our CF-Access approach use `CF-Access-Client-Id`/`-Secret` headers instead.)
- **Private npm (GitHub Packages):** `.npmrc` scope map + `_authToken`:
  ```
  @vegastack:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
  ```
  **Gotcha:** GitHub Packages npm does **NOT** support fine-grained PATs — classic PAT (`read:packages`/`write:packages`) or CI `GITHUB_TOKEN` only. #1 setup failure.
- Sources: ui.shadcn.com/docs/registry/{authentication,namespace}; docs.github.com/packages.

### How agents consume each
- npm → agent imports a typed but **opaque** API; can't see/edit internals; must wrap. (MCP introspection helps, e.g. `@atlaskit/ads-mcp`.)
- registry → agent runs `shadcn add` then **reads/edits copied-in source** — explicitly "open code for LLMs to read, understand, improve." More agent-native. `--dry-run`/`--diff`/`--view` let agents inspect before writing. shadcn ships an MCP server + `shadcn/skills` + `llms.txt`.
- **Atlassian A/B test (load-bearing):** static markdown spec (DESIGN.md) → agents re-implement components (~92% more tokens, ~30% coverage); **MCP/registry pointing at real importable components → ~80%.** → ship registry/MCP for components, markdown only for rules.

## 4. Tailwind v4 across the package boundary (→ §5.3)
- **Don't bundle Tailwind / don't ship compiled utility CSS.** Consumer owns `@import "tailwindcss"`; library ships raw class names.
- npm-packaged component → consumer adds a **tightly-scoped** `@source`:
  ```css
  @import "tailwindcss";
  @source "../node_modules/@vegastack/ui/dist/**/*.{js,jsx,ts,tsx}";
  ```
  **Registry copy-in components need NO `@source`** (they land in `src/`, auto-scanned) — a real simplification.
- Remove `@import "tailwindcss"` from the library's own CSS (consumer provides it; double-import breaks).
- **Everyone on v4** — a v3 consumer silently won't style v4 components (#1 real-world failure).
- Tokens travel as **`@theme` CSS variables** → centralized, overridable theming (one-file override). v4.1: `@source not` (exclude), `@source inline(...)` (safelist dynamic classes).
- Sources: github.com/tailwindlabs/tailwindcss/discussions/{18545,18758}; tailwindcss.com/docs/functions-and-directives; tailwindcss.com/blog/tailwindcss-v4.

## Bottom-line verdicts
1. Base UI via shadcn (reversible); Radix not dying but Base UI is the forward bet.
2. "Never edit shadcn" is a myth; hybrid + custom registry is the real practice.
3. Hybrid distribution: private registry (components, agent-editable) + npm (tokens/utils, auto-propagate). Registry centralizes authoring, not distribution.
4. Tailwind v4: don't bundle; consumer owns; raw classes + scoped `@source` (only for npm pkg); align everyone on v4; tokens as `@theme` vars.
