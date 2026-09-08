---
---

🐛 **The 320px contract check no longer races a re-rendering fixture** — a fixture that
re-renders on its own timer (relative-time reschedules a `setTimeout`) could detach between the
visibility assertion and `scrollIntoViewIfNeeded`, failing the sweep with "Element is not attached to
the DOM" on a different subset of Chromium projects each run — on unmodified `main` as well. The
scroll is now a bounded retry that re-resolves the locator; the assertions, the RTL and 24px
target-floor checks, and the fixture selection are unchanged.
[`138cefd`](https://github.com/VegaStack/vegastack-design/commit/138cefd)
