---
name: vegastack-design-skills
description: Use when building UI with the VegaStack design system. Routes to use-the-system, component authoring, downstream consumption, release safety, and design audit skills.
metadata:
  author: vegastack
  version: "0.1.0"
---

# VegaStack Design Skills

The skill suite for building with, contributing to, and consuming the VegaStack design system
(`@vegastack/*`). Base UI + Tailwind v4 + OKLCH tokens; components are copy-in via a private shadcn
registry; the token layer is public npm.

## Available skills

| Skill | Type | Use when | Path |
|---|---|---|---|
| `vegastack-design-system` | Use-the-system | Building product UI — which component, token reference, composition patterns, do/don't | [design-system/SKILL.md](design-system/SKILL.md) |
| `vegastack-consume` | Use-the-system | Initialising a downstream project: install tokens, wire the provider, `shadcn add`, override tokens | [consume/SKILL.md](consume/SKILL.md) |
| `vegastack-add-component` | Authoring | Scaffolding a NEW component (source + registry item + Fumadocs page + tests + changeset) in one run | [add-component/SKILL.md](add-component/SKILL.md) |
| `vegastack-release` | Release-safety | Authoring a changeset, choosing the semver bump, generating a codemod, running the safe-release flow | [release/SKILL.md](release/SKILL.md) |
| `vegastack-design-audit` | Release-safety | Auditing a codebase for hardcoded hex/px, non-token classes, raw HTML, stale usage, integrity drift | [design-audit/SKILL.md](design-audit/SKILL.md) |
| `vegastack-brand` | Brand | Marketing/external visual identity — **stub until brand assets land (O5)** | [brand/SKILL.md](brand/SKILL.md) |

## Hard rules (every skill enforces)
- **Semantic tokens only** — `bg-primary`, `text-muted-foreground`, `border-border`. NEVER hex, raw
  palettes (`bg-neutral-900`), or off-scale arbitrary values.
- **Base UI** primitives via the `render` prop (not Radix `asChild`); CVA for variants; `cn()` from
  `@vegastack/design`; `data-*` for state.
- **Icons** only via `@vegastack/design/icons` `Icon`/`BrandIcon` (lucide / thesvg) — no other libraries.
- **A11y** WCAG 2.1 AA; visible `:focus-visible`; pass `axe`. Every applicable UI state implemented.
- **Server-safe by default**; `'use client'` only at the interactive leaf.
