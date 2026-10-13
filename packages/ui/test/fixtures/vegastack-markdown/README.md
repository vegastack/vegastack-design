# VegaStack Markdown round-trip corpus

The data-loss invariant behind `registry/lib/text-edit-markdown.ts`. Every case runs in Node
(`tooling/test/vegastack-markdown.test.mjs`, no DOM) and in Chromium
(`registry/lib/text-edit-markdown.test.ts`) against the same expected output; the checks are in
`test/vegastack-markdown-corpus.ts`.

## Adding a case

- `<group>/<name>.md` — Markdown in. Groups: `blocks`, `inline`, `extensions`, `tables`,
  `regressions` (one file per fixed bug, named after it).
- `editor-json/<name>.json` — a document the editor can hold that Markdown may not (a list in a
  table cell, a hard break in a heading). Needs `<name>.out.md`.
- `<name>.out.md` — the canonical Markdown, when it differs from the input.
- `<name>.loss` — an accepted VegaStack Markdown v1 loss: one reason per line, and
  `words: a b` for input words the document may drop. Only for losses the spec documents; the
  document (and its Yjs state) still keeps what Markdown cannot hold.

Each case must: parse to a valid document keeping every input word; serialize to the expected
output; be a fixed point (serializing its output again changes nothing); parse back to the same
document unless a loss is declared; and survive a Y.Doc unchanged.

Every file is byte-exact (blank lines, trailing spaces, CRLF, a BOM): Prettier ignores this folder.
