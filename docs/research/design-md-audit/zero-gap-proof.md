# Zero-gap proof

Status: **implementation and local acceptance reconciled; outward release/deploy acceptance pending explicit approval**.

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
recorded here. In particular, 538/538 contract reconciliation is necessary but is not treated as a
substitute for green behavior, accessibility, install, starter, and visual evidence.

## Exact reconciliation

| Class          | Expected | Reconciled | Duplicate/missing |
| -------------- | -------: | ---------: | ----------------: |
| Components     |       96 |         96 |                 0 |
| Animated icons |      439 |        439 |                 0 |
| Hooks          |        2 |          2 |                 0 |
| Block          |        1 |          1 |                 0 |
| **Total**      |  **538** |    **538** |             **0** |

The contract verifier also reconciles all 96 component source/test/docs/navigation/preview/VRT
records, all 439 generator-owned icon members, the generated derivative set, ten intentional
cross-browser smoke files, and four explicit non-rendering/shared-surface exemptions.

## Final-tree deterministic gates

All commands in this table ran under Node 24.14.0 and pnpm 11.9.0 after the final canonical
Breadcrumb, AnnouncementBanner, and TagGroup changes and `registry:build`.

| Gate                                                       | Result                                                                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Registry validate/build/stamp                              | green: 538 items, 538 index entries, exact provenance/dependency parity                                        |
| Root typecheck                                             | green: 7/7 Turbo tasks                                                                                         |
| Package/docs lint without remote shadcn metadata preflight | green: 7/7 Turbo tasks; four design-lint profiles, ESLint, 123-page link check, content and changelog checks   |
| Unified design verification                                | green: 186 resolved tokens per theme, 42 recipe references, four foundation tables, byte-identical public copy |
| Token/accessibility verification                           | green: 344 contrast checks; 86 exact `.dark`/`.vs-marketing` variables; 12/12 portal scopes                    |
| Contract/API/icon verification                             | green: 538/538 inventory, 99 public API records, 439/439 icons                                                 |
| Local integrity negatives                                  | green: 538/538 hashes; tampered item and manifest entry rejected                                               |
| Registry breadth consumption                               | green: 538/538 graphs in each of two layouts plus 13 real CLI graph exemplars per layout                       |
| Pinned-Linux visual contract                               | green: 876/876 exact images across full pages, component fixtures, four lanes, and icon chunks                 |

The independent hit-area audit initially found six fail-closed gaps. The final tree narrows the
inactive-pointer exemption to the mounted inactive MessageScroller button, maps only TextEdit's
contenteditable surface to the composite focus border, tests the target at 11.999px from centre,
adds 24px width floors to Breadcrumb and Announcement actions, and gives TagGroup's overflow focus
owner a concentric 24px pill geometry. Static lint, formatting, typecheck, registry, and provenance
checks are green after those corrections.

## Final-tree browser and consumer evidence

The complete Chromium component suite passes 105 files / 1,251 tests; the selected WebKit/Firefox
smoke lane passes 468 tests. Real shadcn consumption passes all 13 dependency-graph exemplars in
both supported layouts, and private/public production docs builds both export 386 routes. The
pinned-Linux workflow captured all 876 authoritative screenshots; exact membership, PNG validity,
and representative visual review are recorded in `vrt-review-ledger.md`.

## Remaining outward acceptance

| Boundary                          | Exact current evidence                                                                                                        | Required closeout                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewed integration              | The implementation and VRT closeout are prepared on the release branch; local gates and the pinned-Linux bootstrap are green. | Require branch CI, then open and independently review the implementation PR before merge.                                              |
| Signed publish/deploy trust chain | Local 538 hashes and mutation negatives are green; signer-bound Sigstore verification requires the approved GitHub flow.      | At separately approved release/deploy gates, require positive signer identity, mutation negatives, Cloudflare deploy, and live probes. |

No changeset-bearing commit, publish, merge, release, deployment, public cutover, or signer workflow
has been performed. The only outward actions were the explicitly approved implementation branch
push and pinned-Linux VRT bootstrap.
