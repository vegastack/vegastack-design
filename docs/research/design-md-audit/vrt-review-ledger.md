# VRT review ledger

Authoritative screenshots are produced only by
`mcr.microsoft.com/playwright:v1.61.0-noble` in `.github/workflows/vrt.yml`. Local macOS images are
not accepted or copied between lanes.

## Current reconciliation

| Surface                                                                | Expected |                      Present | Missing | Orphaned | Review state                        |
| ---------------------------------------------------------------------- | -------: | ---------------------------: | ------: | -------: | ----------------------------------- |
| Full pages: 114 routes × light/dark desktop/mobile                     |      456 | 200 legacy light-lane images |     256 |        0 | Linux refresh required              |
| Component fixtures: 97 routes × light/dark desktop/mobile              |      388 |                            0 |     388 |        0 | Linux bootstrap required            |
| Animated-icon chunks: 9 chunks (439 icons) × light/dark desktop/mobile |       36 |                            0 |      36 |        0 | Linux bootstrap required            |
| **Total**                                                              |  **880** |                      **200** | **680** |    **0** | blocked outside the pinned workflow |

The two previously orphaned images were removed from the current worktree. No baseline has been
fabricated, duplicated, or marked reviewed without a pinned-Linux render.

## Review protocol for the required workflow artifact

For every changed image, the maintainer records one of:

- **intended** — names the source/token change and the visible consequence;
- **unintended, fixed** — names the defect and the source correction, then reviews the regenerated image;
- **unresolved** — blocks completion and release.

Full-page snapshots use a fixed `maxDiffPixels: 100` allowance. Element-scoped component fixtures use
`maxDiffPixels: 0`. A page-size ratio is never accepted.
