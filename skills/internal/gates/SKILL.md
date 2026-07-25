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

Common CI rejections and what each actually means:

| `verify-gate-receipt` says                                      | Cause                                                       | Fix                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| produced against tree X but this tree is Y                      | code changed after the gates ran                            | `pnpm gates:push`, commit the receipt                             |
| requires the `contracts` gate and the receipt does not carry it | the change touched a contract surface the local run skipped | re-run `pnpm gates:push` on the current tree                      |
| ran against @playwright/test A but this tree pins B             | gates ran on a stale install                                | `pnpm install`, re-run                                            |
| reports pass but executed 0 tests                               | an empty scope reported as green                            | investigate the scope; do not re-run hoping it changes            |
| was deliberately skipped … needs MK acknowledgement             | `GATES_SKIP` was used                                       | MK's call, not yours. Present the reason recorded in the receipt. |

## 5. Running the ladder

```bash
pnpm gates:commit                 # ~3s   static gates, staged files
pnpm gates:push                   # ~35-80s  + unit · smoke · scoped contracts, writes the receipt
pnpm gates:component <name>       # the inner loop while building one component
pnpm gates:ship                   # the full sweep — /ship requires it
```

`--verbose` streams each gate instead of capturing it. Use it when a gate hangs; the captured form is
better for everything else because it keeps a green ladder to four lines.

After `gates:push` or `gates:ship` succeeds, **commit `.gates/receipt.json` with the change.** CI
verifies it against the pushed tree, and a push without it is rejected.
