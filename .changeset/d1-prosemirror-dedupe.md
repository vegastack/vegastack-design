---
---

🐛 **tiptap 3.31.3 loaded `prosemirror-model` twice, and TextEdit's suite died on it.**
`@tiptap/pm@3.31.3` declares `prosemirror-model` directly and resolved to 1.25.11, while its siblings
stayed on the 1.25.9 the pre-bump lockfile already carried — `pnpm install` only re-resolves what it
must. ProseMirror compares node types by object identity, so a fragment built by one copy is
unconvertible by the other (`RangeError: Can not convert <> to a Fragment`). `pnpm dedupe` collapses
the tree to a single 1.25.11 and removes 34 packages. `packages/ui/vitest.config.ts` also stops
pre-bundling `clsx` and `tailwind-merge`, which are `@vegastack/design`'s dependencies rather than
`@vegastack/ui`'s and printed a resolve failure on every run.
