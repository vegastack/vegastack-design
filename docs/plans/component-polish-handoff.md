# Handoff — Component Polish Session

Paste the block below into a fresh Claude Code session in `/Users/kmanojkumar/code/org-design` to continue.

---

You are continuing the **component-polish workflow** for the VegaStack design system docs site. Read these first, in order:

1. `docs/plans/component-polish-mandate.md` — the full mandate (workflow, principles, locked decisions). This is your operating contract.
2. `AGENTS.md` "Editing a component — SINGLE SOURCE OF TRUTH" section + `CLAUDE.md`.
3. Your auto-memory: `component-single-source-of-truth`, `adversarial-skeptical-review`, `token-overhaul-status`.

**What this is:** MK reviews components in the live preview and sends feedback as **voice-recording transcripts**. Each transcript → a surgical, _systemic_ fix in the design-system library.

**Three non-negotiable principles:**

1. **No local styles** — a component carries its own styling. If a `Button` inside a `Dialog` needs a `className` to look right, that's a bug in `Button`, fixed in `Button`. Demos (`apps/docs/components/preview/*`) only compose; never fix styling there.
2. **Tokens are the only source of truth** — semantic Tailwind tokens / theme vars only (`design.md` → `theme.css`). No hex/px, no raw palettes, no ad-hoc type. Labels/text use the design-system type tokens.
3. **Adversarial & skeptical, always** — feedback is a _symptom_, not the whole bug. Assume more issues exist; assume existing code is wrong until proven right. Try to break every fix (all states, dark mode, RTL, keyboard/axe, overflow, zero/one/many, narrow viewport) before calling it done. Never claim "fixed everywhere" without a search proving it; never claim "verified" from a guess — inspect the computed result in the live preview.

**SINGLE SOURCE OF TRUTH (critical — don't repeat the old footgun):** each component lives in 3 synced places. **Edit canonical ONLY** → `packages/ui/registry/ui/<name>.tsx`, then run `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; npm run registry:build` to regenerate the copy-in (`apps/docs/components/ui/<name>.tsx`, what the preview renders) + registry JSON + integrity headers. **Never hand-edit the copy-in.** Verified working via round-trip on 2026-06-23.

**Per-feedback loop (locked with MK):**

- **Diagnose** — inspect the live element (don't guess), read canonical source, find root cause + classify.
- **Sweep then confirm** — search the whole library for the same issue class; present MK the diagnosis + full list of affected components + planned fix, and **wait for "go"** before editing (Diagnose-then-confirm; List-first-then-fix).
- **Fix** — canonical only → `registry:build`. Component-level styling: auto-fix all instances in one pass. **Token/theme/`design.md` changes: propose first, wait for approval** (they ripple).
- **Verify adversarially** — try to break it (above). Run `node tooling/design-lint.mjs registry` + `--token-css app`; `verify-headers` clean.
- **Report** — plain-language table of components checked + fixed, with clickable `/docs/components/<name>` preview links.

**Git/VRT:** everything stays **uncommitted**; commit ONLY on MK's explicit "commit" (then build + full-diff review + draft message for approval). Don't touch VRT screenshot baselines unless asked.

**Preview:** start the `docs` server via the preview tool (`.claude/launch.json` → "docs", port 3000). Pages at `http://localhost:3000/docs/components/<name>`.

**Open items carried over:**

- Working tree had ~251 uncommitted changes including a ~198-file **stale-registry-JSON regen** I ran on 2026-06-23 (the committed `public/r/*.json` + headers were stale vs already-edited canonical sources; `registry:build` brought all layers into agreement, `verify-headers` 64/64 valid). **MK has NOT decided keep vs revert** — confirm before committing.
- **Parallel multi-session split** was requested then deferred (needs: commit a clean base, then git worktrees + disjoint component groups + separate preview ports, because `registry:build` rewrites all 64 files and collides on a shared tree). Pick back up if MK wants it.

Confirm you've read the mandate, then ask MK for the first transcript (or which open item to handle first).
