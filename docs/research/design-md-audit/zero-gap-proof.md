# Zero-gap proof

Status: **implementation reconciled; final acceptance externally blocked**.

The final proof is generated from and cross-checked against:

- `source-manifest.json` and `unified-reference.md` — external-source and doctrine evidence;
- `audit-register.json` — the unique registry records (regenerated from the contract);
- `audits/coverage.json` — class/wave reconciliation;
- `remediation-ledger.md` — severity and disposition;
- `vrt-review-ledger.md` — exact visual inventory and review state.

(The per-agent `audits/agents/*.md` transcripts and the `baseline.json` worktree freeze were
dropped before commit: they carried machine-local paths and froze a snapshot this changeset
invalidates. The reconciliation they supported is regenerated and gated by
`tooling/verify-component-contracts.mjs`, which is the durable authority.)

Completion may be declared only after the authoritative gate results and any external blocker are
recorded here. In particular, 539/539 contract reconciliation is necessary but is not treated as a
substitute for green behavior, accessibility, install, starter, and visual evidence.

## Exact reconciliation

| Class          | Expected | Reconciled | Duplicate/missing |
| -------------- | -------: | ---------: | ----------------: |
| Components     |       97 |         97 |                 0 |
| Animated icons |      439 |        439 |                 0 |
| Hooks          |        2 |          2 |                 0 |
| Block          |        1 |          1 |                 0 |
| **Total**      |  **539** |    **539** |             **0** |

The contract verifier also reconciles all 97 component source/test/docs/navigation/preview/VRT
records, all 439 generator-owned icon members, seven generated derivative files, ten intentional
cross-browser smoke files, and four explicit non-rendering/shared-surface exemptions.

## Final-tree deterministic gates

All commands in this table ran under Node 24.14.0 and pnpm 11.9.0 after the final canonical
Breadcrumb, AnnouncementBanner, and TagGroup changes and `registry:build`.

| Gate                                                       | Result                                                                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Registry validate/build/stamp                              | green: 539 items, 539 index entries, 546 valid line-1 provenance headers, dependency parity                    |
| Root typecheck                                             | green: 7/7 Turbo tasks                                                                                         |
| Package/docs lint without remote shadcn metadata preflight | green: 7/7 Turbo tasks; four design-lint profiles, ESLint, 123-page link check, content and changelog checks   |
| Unified design verification                                | green: 185 resolved tokens per theme, 42 recipe references, four foundation tables, byte-identical public copy |
| Token/accessibility verification                           | green: 334 contrast checks; 85 exact `.dark`/`.vs-marketing` variables; 12/12 portal scopes                    |
| Contract/API/icon verification                             | green: 539/539 inventory, 100 public API records, 439/439 icons                                                |
| Local integrity negatives                                  | green: 539/539 hashes; tampered item and manifest entry rejected                                               |
| Registry breadth consumption                               | green: 539/539 graphs in each of two layouts, including post-write verification and `tsc`                      |

The independent hit-area audit initially found six fail-closed gaps. The final tree narrows the
inactive-pointer exemption to the mounted inactive MessageScroller button, maps only TextEdit's
contenteditable surface to the composite focus border, tests the target at 11.999px from centre,
adds 24px width floors to Breadcrumb and Announcement actions, and gives TagGroup's overflow focus
owner a concentric 24px pill geometry. Static lint, formatting, typecheck, registry, and provenance
checks are green after those corrections.

## Earlier browser and consumer evidence

Before the final three target-width/geometry changes, the complete Chromium suite passed 106 files /
1,247 tests, the selected cross-engine smoke lane passed 30 browser-file instances / 465 tests, and
the complete Chromium/WebKit/Firefox lane passed 318 browser-file instances / 3,747 tests. A focused
cross-engine interaction closeout independently passed 12/12 browser-file instances and 228/228
tests. The reference starter's fresh production server passed 10/10 Chromium smoke scenarios with
server reuse disabled.

These results remain valuable regression evidence but are deliberately not labeled final-tree
acceptance evidence.

## Blocking acceptance evidence

| Blocker                               | Exact current evidence                                                                                                                                                                                                                   | Required closeout                                                                                                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser unit and docs-contract reruns | macOS launch services return error 141, `Reentrancy avoided`; Chromium fails `MachPortRendezvousServer`, Firefox aborts, and WebKit aborts before a page is created. Computer-control startup fails in the same desktop host.            | Restart into a healthy launchd/XPC session, then rerun root Chromium, selected smoke, full three-engine, focused seven-route docs contracts, and the complete 776-test docs-contract sweep. |
| Aggregate root lint preflight         | remote `https://ui.shadcn.com/r/index.json` lookup fails `ENOTFOUND`; all following local lint stages were run independently and are green.                                                                                              | Rerun exact `pnpm lint` when DNS is restored.                                                                                                                                               |
| Production docs build                 | package builds are green; Next reaches production optimization, then `next/font/google` cannot fetch Newsreader because Google Fonts DNS is unavailable. The locked doctrine intentionally specifies build-time Newsreader self-hosting. | Rerun exact `pnpm build` with DNS, or separately approve a source-controlled Newsreader asset before changing the locked delivery contract.                                                 |
| Real shadcn CLI final-tree install    | both 13-root layouts stop before `shadcn add` because npm cannot resolve `typescript` (`ENOTFOUND`); the all-539 × two-layout breadth path is green.                                                                                     | Rerun `pnpm registry:verify-consume` with npm DNS; require 26/26 real graphs plus the already-green breadth path.                                                                           |
| Authoritative visual set              | expected 880, present 200, missing 680, orphaned 0.                                                                                                                                                                                      | Approved pinned-Linux VRT workflow, green baseline verifier, and an intended/unintended review entry for every changed/generated image.                                                     |
| Signed-manifest trust boundary        | local 539 hashes and mutation negatives are green; signer-bound Sigstore verification requires GitHub OIDC.                                                                                                                              | Run only through the separately approved deploy workflow; require positive signer identity plus tampered item, tampered manifest, and wrong-signer negatives.                               |

No publish, push, deployment, release, VRT workflow dispatch, or signer workflow was performed.
