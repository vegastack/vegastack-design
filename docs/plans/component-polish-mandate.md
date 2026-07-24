# Component Polish Mandate — Fumadocs Showcase

**Owner:** MK (mk@vegastack.com) · **Agent:** Claude Code · **Started:** 2026-06-23
**Operating mode:** build LOCAL, stop at publish/deploy. No token/architecture decisions without approval.

---

## 1. Goal

Polish every component shown on the Fumadocs docs site (`http://localhost:3000/docs/components/*`) to
production quality. Feedback arrives as **voice-recording transcripts** from MK reviewing the live
preview. Each transcript is turned into a **surgical, systemic fix in the design system library** — not a
one-off patch on a single demo.

Three non-negotiable principles drive every fix:

1. **No local styles.** A component must carry its own styling. If a `Button` is used inside a `Dialog`,
   its appearance comes from `Button` itself — never from styling added at the Dialog call site. Same for
   `Label`, `Input`, `Badge`, icons, etc. Demos (`apps/docs/components/preview/*`) compose components;
   they must not restyle them. Any styling required to make a demo "look right" is a **bug in the
   component**, and the fix belongs in the component.
2. **Tokens are the only source of truth.** Every value (color, spacing, type, radius, motion) comes from
   the semantic Tailwind tokens / theme CSS variables defined in `design.md` → `theme.css`. No hardcoded
   hex/px, no raw palette utilities (`bg-neutral-900`), no ad-hoc font sizes. Labels, helper text, etc.
   must use the design system's type tokens, not improvised classes.
3. **Adversarial & skeptical, always.** Trust nothing at face value — not the feedback, not the existing
   code, not my own fix. Treat each transcript as a _symptom_, not the whole bug: hunt the root cause and
   the entire class of the defect. Assume more issues exist than were reported and go looking. Assume the
   existing code is wrong until proven right (the stale registry JSONs proved this). **Try to break every
   fix** before calling it done — every state (hover/focus-visible/active/disabled/loading/empty/error/
   success), dark mode, RTL, keyboard-only, long text, overflow, zero/one/many items, narrow viewport.
   Never claim "fixed everywhere" without a search that proves it; never claim "verified" from a guess —
   inspect the computed result in the live preview.

---

## 2. Critical architecture — SINGLE SOURCE OF TRUTH (edit ONE file, regenerate the rest)

Each component exists in **three synced places**, but only **one is hand-edited**:

| Role                          | Path                                      | Edit it?                                                                                                                              |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Canonical source**          | `packages/ui/registry/ui/<name>.tsx`      | ✅ **EDIT THIS — the only file you change.**                                                                                          |
| **Consumed copy (generated)** | `apps/docs/components/ui/<name>.tsx`      | ❌ Never hand-edit. Re-synced byte-for-byte from canonical. Imported as `@/components/ui/<name>` — what the preview actually renders. |
| **Registry JSON (generated)** | `apps/docs/public/r/<name>.json`          | ❌ Never hand-edit. Holds `meta.integrity` SHA-256 + provenance header.                                                               |
| Demo (compose only)           | `apps/docs/components/preview/<name>.tsx` | ❌ Never fix component styling here — demos only COMPOSE.                                                                             |

**Regeneration:** after editing canonical, run **`npm run registry:build`**
(= `shadcn build` → `registry-stamp` → `registry-header` → `verify-headers`). It re-syncs the copy-in
byte-for-byte, regenerates the JSON, and re-stamps the `// @vegastack <name>@<ver> sha256-…` provenance
headers. It is **idempotent and fully local** (no publish/push) — fits build-local mode.
PATH needs `/opt/homebrew/opt/node@24/bin`.

> **Do NOT** hand-edit the copy-in (the old "edit both files" framing was the drift footgun MK flagged —
> there is ONE source of truth). The copy-in deliberately dogfoods the `shadcn add` distribution
> (`verify-shadcn-consume.mjs` runs the real CLI) — do not alias/symlink it to canonical without
> reopening the locked distribution decision. Verified working 2026-06-23 via a canonical-only edit →
> rebuild → copy auto-synced round-trip.

**Token/theme layer (ripples across everything):**

- `design.md` — master spec (source of intent)
- `packages/tokens/tokens/*.json` — token source (primitives / semantic / dark)
- `packages/tokens/dist/theme.css` + `base.css` — compiled, imported by docs via `apps/docs/app/global.css`

---

## 3. Per-feedback workflow (locked with MK)

For **each** transcript, follow this loop:

### Step A — Diagnose (no edits yet)

1. Parse the transcript; identify the exact component(s) and the precise visual/behavioral issue.
2. Open the live preview, **inspect the element** (`preview_inspect` / `preview_snapshot`) to confirm the
   real computed cause — not a guess. Read the canonical + copy source.
3. Determine root cause and classify it: local-style leak, missing token usage, wrong token, global/theme
   gap, a11y/state gap, etc.

### Step B — Systemic scan (**list first, then fix** — locked)

4. Search the **whole library** for the same class of issue (e.g. if a child `Button` is restyled in
   Dialog, check every overlay/compound component for the same leak).
5. Present MK a **diagnosis + full list of affected components + the planned fix** and **wait for
   "go"** before editing. (Decision: _Diagnose-then-confirm_.)

### Step C — Fix (after approval)

6. Edit **canonical only** (`packages/ui/registry/ui/<name>.tsx`) for every affected component, then run
   **`npm run registry:build`** to regenerate the copy-ins + JSONs + headers. Never hand-edit the copy-in
   or fix styling in `preview/*.tsx`. (Run rebuild **per approved batch**; per component if isolated.)
7. **Component-level styling → auto-fix** across all affected components in one pass.
   **Token/theme/`design.md` changes → propose first, wait for approval** (they ripple everywhere).
   (Decision: _Propose-first for tokens, auto for components_.)

### Step D — Verify (adversarially — try to break it)

8. Reload preview, re-inspect to confirm the fix on the originally-reported component **and** on the
   other components found in the sweep. Confirm by **inspecting the computed result**, never by assuming
   the edit "should" work.
9. **Attack the fix:** exercise every state (hover/focus-visible/active/disabled/loading/empty/error/
   success), toggle **dark mode**, resize **narrow viewport**, test **keyboard-only** + `axe`, and push
   edge cases (long/overflowing text, zero/one/many items, RTL). A fix isn't done until it survives these.
10. Run `design-lint` to confirm no token/style violations were introduced; `verify-headers` clean.
11. Capture a screenshot as proof for visual changes.

### Step E — Report

11. Show MK a **report table** (see §5) of components checked + fixed, in plain language, with clickable
    preview links.

**Git/VRT:** All changes stay **uncommitted** in the working tree. I commit only on MK's explicit
"commit" (then build + full-diff review + approval per standard workflow). VRT screenshot baselines are
**not** touched unless MK asks. (Decision: _Leave uncommitted, commit on command_.)

---

## 4. Standing audit checklist (applied to every component I touch)

- [ ] **No local styles** — no `className` overrides on child components that should be self-styled.
- [ ] **Tokens only** — no hex/px/raw-palette; spacing on the 4px scale; type via type tokens.
- [ ] **Labels & text** use the design system type tokens (`design.md` typography), not ad-hoc classes.
- [ ] **Icons** only via `Icon`/`BrandIcon` from approved sources (lucide / lucide-animated / thesvg).
- [ ] **All states** present & correct: default / hover / focus-visible / active / loading / empty /
      error / success / disabled.
- [ ] **A11y**: WCAG 2.1 AA, visible `:focus-visible`, passes `axe`.
- [ ] **Edited canonical only → ran `registry:build`** → copy-in + JSON regenerated, headers re-stamped
      (`diff packages/ui/registry/ui/<n>.tsx apps/docs/components/ui/<n>.tsx` is clean; `verify-headers` passes).
- [ ] **Dark mode** correct (`preview_resize` / theme toggle).
- [ ] **design-lint passes.**

---

## 5. Report format (shown after each batch)

**Checked**

| Component    | Preview                         | Result                              |
| ------------ | ------------------------------- | ----------------------------------- |
| Dialog       | `/docs/components/dialog`       | ✅ Issue confirmed & fixed          |
| Alert Dialog | `/docs/components/alert-dialog` | ✅ Same issue found & fixed (sweep) |
| Popover      | `/docs/components/popover`      | ☑️ Checked, clean                   |

**Fixed — what changed (plain language)**

| Component | What was wrong                          | What I did                                            |
| --------- | --------------------------------------- | ----------------------------------------------------- |
| Dialog    | Footer button had a local size override | Removed override; size now comes from `Button` itself |

Links are relative preview paths MK can open directly.

---

## 6. Proactive scope (encouraged, within the rules above)

While fixing, I will proactively flag/fix:

- The same issue class anywhere else in the library (the §3B sweep).
- Misses where components don't follow `globals.css` / `theme.css` / `base.css` (component-level → fix;
  token/theme source → propose).
- Missing UI states, a11y gaps, inconsistencies vs `design.md`.

I will **not**, without approval: change tokens/`design.md`, commit, publish, deploy, regenerate VRT
baselines, or make architecture decisions (all pre-locked in `docs/requirements.md` §3).

---

## 7. Environment

- **Dev server:** `apps/docs`, port **3000** (`.claude/launch.json` → "docs"). I'll free any running
  preview and start a fresh one via the preview tools.
- **Preview URL:** `http://localhost:3000/docs/components/<name>`.
- **Lint:** `node tooling/design-lint.mjs registry` (canonical) and `--token-css app` (docs CSS).
- **Regenerate after a fix:** `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run registry:build`
  (edit canonical only; this syncs copy-in + JSON + headers; idempotent, local, no publish).
