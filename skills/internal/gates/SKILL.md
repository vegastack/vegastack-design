---
name: gates
description: Interpret a blocked commit or a failed verification run in the vegastack-design repo — what the pre-commit hook checks, what `pnpm verify` runs, and how to classify a failure at its root cause rather than working around it. Use when a git hook blocked a commit, when `pnpm verify` or CI failed and the cause is not obvious, or when asked what the verification ladder is.
---

# Interpret a failed verification run

> **This skill is being retired.** The gate ladder it documented — `pnpm gates:commit/push/component/ship`,
> the `.gates/` report directory, and the `.gates/receipt.json` attestation — was removed by
> `docs/plans/2026-09-08-verification-rebuild.md`. What remains is three commands and two hooks, and
> they are short enough that this page is mostly the reasoning, not a procedure. WP6 folds the
> remainder into the `review` skill and deletes this directory.

**Never self-clear a failure.** Classify it, fix the root cause, re-run. If a failure looks
environmental, say so with the evidence and let MK decide — the same discipline
`skills/internal/ship/references/visual-review.md` imposes on pixels.

## The ladder, in full

```bash
pnpm check:component <name>   # ~5s     design-lint · typecheck · that one component's test
pnpm verify                   # ~2.5min typecheck · lint · design:verify · browser suite · design CLI tests
pnpm verify:release           # ~7min   BOTH docs matrices · links · registry · consume · 3 engines
```

`pnpm verify` is the whole gate. It is byte-for-byte the command `ci.yml` runs on a pull request,
`release.yml` runs before a publish, and `deploy.yml` runs before a deploy — so a green run here is a
green run there, and a red one here is exactly the failure CI will report. Nothing is scoped to a
diff, nothing is attested, and nothing is bound to a tree hash.

`pnpm verify:release` runs only in `deploy.yml`. Run it locally only when you are investigating
something that lives in it: the docs export, the link or metadata checks, the shadcn consume
round-trip, or a cross-engine difference.

## The hooks

- **`pre-commit`** — `tooling/design-lint.mjs` over the registry, plus `prettier --check` on the
  staged set (symlinks excluded — `.claude/skills/*` and `.agents/skills/*` are links, and prettier
  would check the target). ~4 s. It is the cheapest possible signal and blocks nothing that matters:
  a commit is not a publication boundary, and WIP commits, `--amend`, and `rebase -i` all fire it.
- **`commit-msg`** — the conventional-commit prefix.
- **There is no `pre-push` hook**, and `--no-verify` / `HUSKY=0` are no longer policy words. CI
  executes the same command you do, so a local run before pushing is a convenience rather than a
  gate. Nothing is lost by skipping it except your own turnaround.

## Reading a failure

Failures now arrive as ordinary command output in the terminal that ran them; there is no
`.gates/` directory and no JSON report to read. `pnpm verify` names the step it stopped at
(`verify: FAILED at lint`), and each step's own output follows the conventions of the tool under it.

Classify against the root, not the symptom:

| What you see                                          | Root cause                                                                                                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design-lint` rule id                                 | A build rule in AGENTS.md § Build rules. `skills/internal/review/references/lint-rules.md` explains each id.                                                     |
| `design:derived:check` or `design:sync:check` fails   | A generated surface is stale. Run `pnpm design:derived` / `pnpm design:sync` — never hand-edit the output.                                                       |
| `registry:build` leaves a dirty tree                  | The same, for the registry's three stamped surfaces.                                                                                                             |
| The browser suite HANGS rather than failing           | Something invoked `pnpm --filter @vegastack/ui test` directly. Turbo's `^build` is what builds `@vegastack/design`'s gitignored dist; go through `pnpm verify`.  |
| `ENOENT … design-tokens/dist/theme.css`               | A bare `turbo run lint` in a tree whose token dist was never built. `turbo.json` declares that dependency; if you see it, the declaration is wrong, not the run. |
| A contract assertion (320px reflow, RTL, 24px target) | `packages/ui/test/geometry.browser.test.tsx`. A real defect in the named fixture — read the assertion, not the stack.                                            |
| Green locally, red in CI                              | Compare Node versions first (`.node-version`, `engine-strict=true`), then look for something uncommitted. The commands are identical by construction.            |

## What went away, and what replaced it

| Gone                                                | Replaced by                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.gates/receipt.json` and every `receipt-guard` job | CI **executes** the browser lanes on the LAN Linux runners in the pinned Playwright container. |
| `pnpm gates:commit/push/component/ship`             | `pnpm check:component <name>` · `pnpm verify` · `pnpm verify:release`                          |
| `.husky/pre-push`                                   | Nothing. CI runs the same command.                                                             |
| `pnpm classify` and route scoping                   | Nothing. Every run is the full two-minute loop; there is nothing left to scope.                |
| The `gates-digest` SessionStart hook                | Nothing. There is no report to digest.                                                         |

The receipt was **attestation, not proof** — `--no-verify` plus a hand-edited JSON defeated it — and
it existed only because no free runner could launch a browser. On 2026-09-07 the LAN Debian boxes ran
Chromium, Firefox, and WebKit. The premise was gone, so the mechanism went with it.
