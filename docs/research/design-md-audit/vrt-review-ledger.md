# VRT review ledger

Authoritative screenshots are produced only by
`mcr.microsoft.com/playwright:v1.61.0-noble` in `.github/workflows/vrt.yml`. Local macOS images are
not accepted or copied between lanes.

## Current reconciliation

| Surface                                                                | Expected | Present | Missing | Orphaned | Review state                           |
| ---------------------------------------------------------------------- | -------: | ------: | ------: | -------: | -------------------------------------- |
| Full pages: 114 routes × light/dark desktop/mobile                     |      456 |     456 |       0 |        0 | Linux artifact reviewed                |
| Component fixtures: 96 routes × light/dark desktop/mobile              |      384 |     384 |       0 |        0 | Linux artifact reviewed                |
| Animated-icon chunks: 9 chunks (439 icons) × light/dark desktop/mobile |       36 |      36 |       0 |        0 | Linux artifact reviewed                |
| **Total**                                                              |  **876** | **876** |   **0** |    **0** | exact pinned-Linux contract reconciled |

The workflow artifact is byte-identical to the repository snapshot tree. No baseline was fabricated,
duplicated across lanes, or accepted from a non-Linux renderer.

## Artifact disposition — 2026-07-24

- **Intended — 200 refreshed full-page images.** These capture the reviewed full-system component,
  docs, token, and homepage changes on the two previously committed light lanes.
- **Intended — 676 added images.** These complete the dark desktop/mobile lanes, all 96 isolated
  component fixtures, all nine animated-icon chunks, and full-page routes that had no committed
  baseline.
- **Unresolved — 0.** Exact membership, PNG signatures, and full-page lane widths pass. Representative
  homepage, mobile dark, AppShell, chart, control, component-state, and icon-chunk images were visually
  inspected with no unintended rendering found.

## Review protocol for the required workflow artifact

For every changed image, the maintainer records one of:

- **intended** — names the source/token change and the visible consequence;
- **unintended, fixed** — names the defect and the source correction, then reviews the regenerated image;
- **unresolved** — blocks completion and release.

Full-page snapshots use a fixed `maxDiffPixels: 100` allowance. Element-scoped component fixtures use
`maxDiffPixels: 0`. A page-size ratio is never accepted.
