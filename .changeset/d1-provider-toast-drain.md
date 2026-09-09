---
---

🐛 **The `provider` unit test no longer races sonner's toast timer.** Sonner's toast store is a module
singleton, so a toast fired by one test kept rendering — close button and all — into the next test in
the same file for its full 4 s lifetime, and an unscoped `getByRole("button")` there became a
strict-mode violation under load. The toast is now dismissed and drained where it is fired, and the
theme probe is queried by accessible name. Test-only; no component changed.
[`89146d6`](https://github.com/VegaStack/vegastack-design/commit/89146d6)
