---
"@vegastack/design": minor
"@vegastack/ui": minor
---

📦 **Five mechanical dependency majors.** `motion` 12.42.2 → 13.2.0 (its only import site is the
animated-icon factory; the 13.0 removal of the optional `@emotion/is-prop-valid` dependency does not
apply — no CSS-in-JS library wraps a `motion` component here — and `useReducedMotion()` is still the
one-shot `useState` read the factory deliberately replaces with a live `useSyncExternalStore`
subscription). `react-dropzone` 19.1.1 → 20.1.1, whose only breaking change is a Node 22 floor
(this repo pins Node 24.20.0). `@atlaskit/pragmatic-drag-and-drop` 2.0.1 → 3.1.0 plus `-hitbox`
2.0.0 → 2.2.0, whose 3.0.0 renamed every entry point: `use-drag-reorder` now imports from
`/adapter/element-adapter`, `/utils/combine`, `/closest-edge/attach-closest-edge`,
`/closest-edge/extract-closest-edge` and `/types` rather than the deprecated compatibility shims.
`@testing-library/jest-dom` 6.9.1 → 7.0.1, which makes `@testing-library/dom` a required peer — now
declared explicitly at 10.4.1. `globals` 16.5.0 → 17.12.0, whose 17.0.0 split the `audioWorklet`
environment out of `browser`; the shared ESLint config uses `browser` + `node` only. Behaviour of
the drag keyboard layer, the live-region announcements, the "Move to…" menu equivalents and the
paste-acquisition path is unchanged — all of it is ours, not the engines'.
[docs](https://design.vegastack.com/docs/components/board)
