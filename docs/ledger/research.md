# RESEARCH LEDGER

Every research query + source URL + conclusion. Append-only.

## 2026-06-21 — Initial spec ingestion (no external queries yet)

- Source: in-repo `docs/plans/detail/01..06`, `requirements.md`, `gap-analysis.md`, `research/catalog-vegastack-platform.md`. These are the verified verbatim specs — versions pinned, configs copy-paste. Conclusion: follow them; re-verify anything that fails against official docs as I go.
- Exact token values captured from `engg-vegastack-platform/src/app/globals.css` (`:root` + `.dark`) and `tailwind-palette.css`. Conclusion: port the full OKLCH semantic set (background/foreground/card/popover/primary/secondary/muted/accent/destructive/success/warning/info + overlay/border/input/ring + chart-1..5 + showcase-* + sidebar-*), light + dark, radius 0.625rem.

## 2026-07-29 — Deterministic build-time syntax highlighting

- Source: <https://www.fumadocs.dev/blog/v16> (official Fumadocs release notes; accessed
  2026-07-29). Installed relevance: `fumadocs-core` and `fumadocs-ui` are 16.11.5. Fumadocs v16
  changed `rehype-code` to Shiki's JavaScript RegExp engine by default for runtime portability and
  documents the `engine` option as the override. Conclusion: the default is intentional for broad
  runtimes, but it is not a locked requirement for VegaStack's Node build-time MDX compilation.
- Source: <https://shiki.style/guide/regex-engines> (official Shiki documentation; accessed
  2026-07-29). Installed relevance: `fumadocs-mdx` 15.2.0 resolves Shiki 4.3.1. Shiki explains that
  TextMate grammars target Oniguruma and recommends Oniguruma for Node/build-time highlighting when
  WebAssembly and bundle size are not constraints. Conclusion: pin `engine: "oniguruma"` for the
  static docs build; this changes rendered syntax-token colours where the two engines disagree but
  does not change browser runtime authorization or package APIs.
- Local controlled observation (measured, 2026-07-29, same working tree): the default JavaScript
  engine produced different TSX token scopes in two VRT builds. After the pin, 77,338 extracted
  Shiki `<pre>` blocks across consecutive complete static builds were byte-identical (one paired
  comparison; manifest SHA-256
  `5b9da83322de6ac8342b33d72994f891d62725304ded5b8af8785b782a3ced93`). Raw whole-page HTML was
  deliberately rejected as a determinism oracle because Next emitted different build-specific asset
  identifiers on all 141 HTML files. Plan effect: add an executable configuration mutation and
  stabilize Fumadocs' scroll-driven TOC only inside the full-page VRT harness; no rollout checkpoint
  or locked release topology changes.
