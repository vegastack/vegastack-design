# Reference — Showcase tooling, Component-page template, Agent enablement

> Durable reference. June-2026 research. Backs requirements §7.3, §8, §11 and decisions D8, D9. Preserve in full.

## 1. Docs/showcase tooling — current state

| Tool | Latest | State / fit |
|---|---|---|
| **Storybook** | 10.4.6 (2026-06-16) | SB10 (Oct 28 2025) ESM-only, −29% install. SB9 (Jun 2025): Vitest+Playwright component tests, a11y(axe), Chromatic, coverage; `addon-essentials` removed; `addon-docs` split out; Autodocs prop tables (react-docgen / -typescript); MDX Doc Blocks. SB10.3 (Apr 2026) added a **Storybook MCP**. Best-in-class for variants-as-tests + visual regression. Heaviest build. **NOT used as a public docs site by any major DS.** |
| **Ladle** | `@ladle/react@5.1.1` | Vite+SWC, ~1.2s cold start (~6.7× Storybook), React-only, CSF-compatible, MDX. **No auto prop-table from TS** (manual `args`/`argTypes`); no first-class Vitest story-test bridge. Fast workbench, weak as a deliverable. |
| **Histoire** | 1.0.0-beta.1 | Vue 3 + Svelte only — **React NOT supported**; stalled (last stable 0.17.17 Apr 2024). **Avoid.** |
| **Fumadocs** | `fumadocs-ui` 16.10.5 (2026-06-20) | Very active. MDX + Shiki + **Twoslash**; multi-provider search (Orama default); `fumadocs-openapi` v11 playground; **AutoTypeTable** (TS→props); AI page actions. Multi-framework since v15.2 (Next, TanStack Start, React Router, Waku, Vite). **What shadcn/ui docs run on.** Min React 19.2, Next 16+. |
| **Nextra 4** | 4.6.1 (2025-12-04) | App Router only, Pagefind search, RSC i18n, Turbopack. Opinionated, fastest content-first path, less flexible, no built-in TS prop-table. |
| **Custom Next.js + MDX** | — | `@next/mdx` (RSC) + Shiki 4.x (build-time, via rehype-pretty-code 0.14.x) + **react-live 4.1.8** (editable preview, Sucrase, tiny) + react-docgen-typescript 2.4.0 (props). **Avoid Sandpack (unmaintained Mar 17 2026)** and **Contentlayer (dead)**. |

### What real DS sites actually use (source-verified)
| Site | Framework | MDX | Live preview | Props table | Highlighter |
|---|---|---|---|---|---|
| shadcn/ui | Next 16 App Router (`apps/v4`) | **Fumadocs** | inline React from registry; iframe for blocks | **none** (defers to primitive) | Shiki + rehype-pretty-code |
| Radix | Next 16 App Router | mdx-bundler | inline React; StackBlitz to run | **hand-authored** `<PropsTable data={…}/>` | Prism |
| MUI | Next 16 Pages, static export | custom `marked` | react-runner inline; StackBlitz export | **auto from TS** (react-docgen v8 + TS) | Prism |
| React Spectrum | **Parcel** SSG | custom MDX | inline + prop controls | **auto from TS** (Babel-AST) | tree-sitter |
| Base UI | Next 16 App Router | `@next/mdx` + custom | inline `Demo` | **auto** (`@mui/internal-docs-infra`) | starry-night |
| Chakra v3 | Next 15 App Router | **Velite** | inline + StackBlitz | **auto** (Velite + ts-morph) | Shiki |
| Mantine | Next 16 Pages | `@next/mdx` | inline (`@docs/demos`) | **auto** (react-docgen-typescript) | Shiki |
| Ant Design | **dumi 2.4** | dumi md | dumi demos | mostly hand-authored | Prism |

**Signals:** none use Storybook as the public docs site (it's a workbench) · Contentlayer dead (shadcn moved to Fumadocs) · two prop-table camps — headless/wrapper libs hand-author/omit, full libraries auto-generate from TS · live preview ≈ real inline React (sandboxes relegated to "open/edit" buttons) · Next App Router default; Shiki/Prism split.

### Decision (D9)
**Fumadocs** for the showcase (live previews + `react-docgen-typescript` `<PropsTable>` + build-time Shiki + MDX do/don't + Orama search). MDX is the AI-readable source of truth. **Storybook deferred to phase 2** (visual-regression/interaction testing once components stabilize). The showcase also hosts the registry JSON (`shadcn build` → `apps/docs/public/r/*.json`) — one deploy.

## 2. Per-component page — section orders (verified, per-system top-to-bottom)

**Developer-first (code-centric, NO do/don't):**
- **shadcn Button:** Title → Installation (CLI/Manual) → Usage → Examples (Size, variants, Icon, AsChild, RTL…) → API Reference (bottom). **Dialog adds "Composition"** (its anatomy) between Usage and Examples.
- **Radix Primitives Dialog:** Title → **Features** (bullets) → **Anatomy** (part tree) → API Reference (props per part) → Examples → **Accessibility** (Keyboard Interactions table) → Custom APIs.
- **Radix Themes Button:** Hero → **API Reference (high, right after hero)** → Examples.
- **React Aria Button:** Intro → Vanilla CSS → Tailwind → Events → Pending → Link buttons → Examples → API. (De-emphasized standalone Anatomy/i18n vs old React Spectrum.)
- **React Spectrum Button (richest dev template):** Button → Example → Content(anatomy) → **Accessibility** → **Internationalization** → Events → Pending → Props → Visual options.
- **MUI:** usage page (examples-first) **split** from a separate `/api/button/` page (Props/Inheritance/Theme/CSS classes/Source).
- **Mantine / Chakra v3:** Usage → Examples → Customization → Props (bottom). No do/don't.

**Enterprise (these ADD Do/Don't on a design-guidelines page/tab):**
- **Adobe Spectrum:** Options → Anatomy → Behaviors → **Do/Don't pairs** → Content standards → Keyboard a11y → RTL → tokens.
- **Carbon:** tabbed Usage/Style/Code/Accessibility; Usage = Overview → Variants → Formatting(Anatomy) → Content → **Do/Don't pairs** → Behaviors → Related.
- **Atlassian:** Anatomy → Usage → States → **do/don't** → Accessibility (avoid `isDisabled`) → Content.
- **Polaris:** Examples → Props → **Best practices (Do/Don't)** → Content (sentence case, short labels).

### Universality
Universal: Title+desc · Usage · Examples/Variants (largest section) · API/Props (placement varies). Common in installable libs: Installation. Conditional: Anatomy (compound only), Accessibility (strong in Radix/Spectrum/enterprise; inlined in shadcn/Chakra/RA), i18n (Adobe/enterprise). **Do/Don't = enterprise-only** (Spectrum/Carbon/Atlassian/Polaris). Features-bullets = Radix signature. **Changelog never inline** — global, linked.

### Canonical template (→ requirements §7.3)
1. Title + one-line description
2. **Preview/Hero** (live, interactive default; Preview⇄Code)
3. Installation (`npx shadcn add @vegastack/<name>`)
4. Usage (import + minimal snippet)
5. **Anatomy/Composition** — *compound components only*
6. **Examples/Variants** (one live preview per variant·size·state: default/hover/disabled/loading/error; with-icon; RTL; asChild)
7. API Reference/Props (auto from TS; one table per part)
8. **Accessibility** (keyboard table + ARIA + focus)
9. Internationalization/RTL — *conditional*
10. **Do/Don't** (paired examples + content standards) — the enterprise differentiator we adopt
11. Changelog/status (badge; link out)

Rationale: 1–4 productive in seconds; 5–7 reference depth; 8–10 correctness; 11 lifecycle. 5 & 9 conditional; rest mandatory.

## 3. Agent-consumable design system (→ requirements §11)
**Priority order of artifacts:**
1. **shadcn-compatible `registry.json` + `registry-item.json`** (private, namespaced). Selection fields: `title`, `description`, `categories`, `docs`, `meta`. Install fields: `dependencies`, `registryDependencies`, `files`, `cssVars`. Extend `meta` with `whenToUse`/`whenNotToUse`/`selectionCriteria` (auto-gen from JSDoc to avoid drift).
2. **MCP server** — `npx shadcn@latest mcp` exposes `list_items_in_registries`, `search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`, `get_add_command_for_items`, `get_audit_checklist`. Good DS MCP = discrete discover→search→inspect→install→verify tools (not one opaque "generate UI"). MUI/Chakra/Ant/Mantine/HeroUI/Flowbite/Storybook all ship MCPs by mid-2026.
3. **`AGENTS.md`** (Linux Foundation standard, Nov 2025; read by Codex/Cursor/Copilot/Gemini) — "always use `@vegastack` components when one exists; always use tokens, never hardcode hex/px; query the MCP/registry before generating component code"; selection map; import conventions.
4. **`CLAUDE.md`** = `@AGENTS.md` + Claude-specific notes (Claude Code reads CLAUDE.md, NOT AGENTS.md).
5. **`SKILL.md`** suite (procedural do/don't, `paths:` auto-activation, instructs the agent to query MCP/`<cli> search` before generating). shadcn ships `pnpm dlx skills add shadcn/ui`.
6. **`llms.txt` + `llms-full.txt`** on the docs site (cheap discovery; shadcn ships one at ui.shadcn.com/llms.txt).

**Single-source-of-truth caveat:** make AGENTS.md + registry/MCP authoritative so one decision (e.g. primary color) isn't duplicated/drifting across tokens/DESIGN.md/manifest.

**Other manifest standards seen:** Storybook AI components manifest (`/manifests/components.json` — description from JSDoc, exact import, story code examples, `reactDocgen.props`); Custom Elements Manifest (web components). Ecosystem converging on **description + props + examples extracted from source**.

- Sources: atlassian.com/blog DESIGN.md findings; ui.shadcn.com/docs/{registry,mcp,skills}; ui.shadcn.com/llms.txt; storybook.js.org/docs/ai/manifests; agents.md; llmstxt.org.

## Caveats
Storybook "−29%/−48% leaner" are vendor figures (not independent benchmarks). Enterprise design-guideline pages (Spectrum/Carbon/Atlassian/Polaris) are client-rendered SPAs — section structure confirmed via indexed search, not direct DOM reads. Some adopter/star/download counts are approximate (aggregators); version numbers/dates anchored to npm registry + official changelogs.
