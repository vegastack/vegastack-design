---
name: gates
description: Read and act on the local verification gates in the vegastack-design repo — interpret a failed pre-commit or pre-push run, classify each failure at its root cause, and explain what the gate receipt means. Use when a git hook blocked a commit or push, when .gates/last-failure.json exists, when asked why CI rejected a receipt, or when asked to run the gate ladder before shipping.
---

# Interpret the gate ladder

The gates are programmatic; the interpretation is yours. Every gate writes structured JSON precisely
so that you can say **what** broke and **why**, instead of handing a developer raw output.

**Never self-clear a failure.** Classify it, fix the root cause, re-run. If a failure looks
environmental, say so with the evidence and let MK decide — the same discipline
`skills/internal/ship/references/visual-review.md` imposes on pixels.

## 1. Read the reports first

```bash
cat .gates/last-failure.json      # the failing gate, its assertion, file:line, raw output slice
ls .gates/                        # commit.json · push.json · ship.json · contracts.json · receipt.json
```

`.gates/last-failure.json` exists only while a run is failing; a passing run deletes it. Its
`reports` array lists the per-gate JSON worth opening next. Read the report, not just the exit code.

## 2. Classify every failure before fixing anything

Four categories, and they need different responses. Getting the category wrong wastes the fix.

| Category                   | How it looks                                                                                                                       | What to do                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Token / rule violation** | `design-lint` names a rule and a `file:line`                                                                                       | Fix at the source. The rule vocabulary is `skills/internal/review/references/lint-rules.md`; never widen a rule to pass.                    |
| **Real regression**        | a contract assertion fails with measured numbers — a control under 24×24, `scrollWidth > clientWidth` at 320px, no focus indicator | Fix the component. The numbers in the message are the specification.                                                                        |
| **Stale generated file**   | `design:derived:check`, `sync-changelog --check`, or the registry idempotency step reports drift                                   | Regenerate through the authority (`pnpm design:derived`, `pnpm registry:build`) and commit the output. Never hand-edit a generated file.    |
| **Flake**                  | passes on re-run with no change; timing or animation wording in the message                                                        | Say it is a flake AND why you believe that. Do not retry silently — a flake that is really a race will come back on someone else's machine. |

## 3. The contract lane, specifically

`.gates/contracts.json` carries the scope decision, not just the result. Read `scope.reason` before
`results` — a green run over the wrong routes is the failure mode this whole design guards against.

```bash
node -p "const r=require('./.gates/contracts.json'); [r.status, r.scope.reason, r.scope.routes.length+' routes', r.executed+' executed'].join(' · ')"
```

- `status: "skipped"` means **no contract surface changed**. Report it as skipped. It is not evidence
  that the contracts pass.
- `status: "no-evidence"` means a non-empty scope executed zero tests. That is a defect in the scope
  or the spec, never a pass.
- A failure lists `failures[]` with `title`, `project`, and the assertion message. The project name
  matters: a failure only in `mobile-chromium` is a narrow-viewport problem, only in `*-dark` is a
  token problem.

Re-run one route while iterating:

```bash
node tooling/contracts-run.mjs --routes /docs/components/<name>
```

## 4. Explain the receipt honestly when asked

`.gates/receipt.json` binds the browser lanes to a tree hash. It is **attestation, not proof** —
`--no-verify`, or `HUSKY=0`, plus a hand-edited JSON defeats it. Its value is that skipping a browser
gate becomes visible and auditable instead of silent. Say that plainly; a receipt read as proof is
worse than no receipt.

**Schema 2** (since 2026-09-07) records **every** gate a run executed — including the three that only
`pnpm gates:ship` runs (`all-browsers`, `registry`, `consume`) — and **every** failed gate id under
`skips`. Schema 1 dropped both, which is why a deploy could be satisfied by a scoped one-route push
receipt and why `GATES_SKIP` past a failing ship-only gate recorded nothing. Two consequences worth
stating when asked:

- `pnpm gates:push` writes a **push** receipt. That is what a PR and a push to `main` need.
- **A deploy needs a `pnpm gates:ship` receipt and nothing else will do.** `deploy.yml` runs
  `verify-gate-receipt.mjs --require-full-sweep`, which demands `mode: "ship"`, every gate passing,
  and a contract lane run with `full: true` over every component route. A green push receipt on
  `main` blocks the deploy — that is the intended cost, not a fault, and the fix is to run
  `pnpm gates:ship` and commit the receipt it writes. Never hand-edit one.

Common CI rejections and what each actually means:

| `verify-gate-receipt` says                                      | Cause                                                       | Fix                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| produced against tree X but this tree is Y                      | code changed after the gates ran                            | `pnpm gates:push`, commit the receipt                             |
| requires the `contracts` gate and the receipt does not carry it | the change touched a contract surface the local run skipped | re-run `pnpm gates:push` on the current tree                      |
| ran against @playwright/test A but this tree pins B             | gates ran on a stale install                                | `pnpm install`, re-run                                            |
| reports pass but executed 0 tests                               | an empty scope reported as green                            | investigate the scope; do not re-run hoping it changes            |
| was deliberately skipped … needs MK acknowledgement             | `GATES_SKIP` was used                                       | MK's call, not yours. Present the reason recorded in the receipt. |
| schema is 1, expected 2                                         | a receipt minted before 2026-09-07                          | `pnpm gates:push` (or `gates:ship` before a deploy) and commit it |
| written by `gates push`, but a deploy requires the full sweep   | a push receipt reached the deploy guard                     | `pnpm gates:ship` on the tree being deployed, commit that receipt |
| covered N route(s) but this tree has M component routes         | the sweep predates a component being added or removed       | re-run `pnpm gates:ship`; do not edit the receipt                 |
| records a skip for an unknown gate                              | a hand-edited or corrupted receipt                          | investigate — the ladder never writes a gate id it does not run   |

## 5. Running the ladder

```bash
pnpm gates:commit                 # ~3s   static gates, staged files
pnpm gates:push                   # ~35-80s  + unit · smoke · scoped contracts, writes the receipt
pnpm gates:component <name>       # the inner loop while building one component
pnpm gates:ship                   # the full sweep — /ship requires it
```

`--verbose` streams each gate instead of capturing it. Use it when a gate hangs; the captured form is
better for everything else because it keeps a green ladder to four lines.

## 6. The ordering that matters

**Run the gates BEFORE committing, then commit the code and `.gates/receipt.json` together.**

That works because `.gates/` is excluded from the tree hash the receipt binds to — so adding the
receipt to the commit cannot invalidate the receipt it wrote. Commit FIRST and the receipt in `HEAD`
describes the _previous_ tree, and every workflow's `receipt-guard` rejects the push.

`gates push` checks this itself and refuses the push with the exact fix, so the mistake costs
seconds rather than a red CI run eight minutes later. If you see it:

```bash
git add .gates/receipt.json && git commit --amend --no-edit && git push
```

The gates already passed at that point — only the record was missing from the commit.
