---
---

Reconcile stale npm dependency pins across registry items: `lucide-react` was declared as both
`^1.20.0` (35 items) and `^0.525.0` (6 items — across a major boundary) against an installed
`^1.24.0`, and `@shadcn/react` as `^0.1.0` against an installed `^0.2.1`. All 41 lucide pins and the
one `@shadcn/react` pin now match `packages/ui/package.json`, and `verify-registry-deps` gains a
fail-closed range check so a pin the installed version cannot satisfy fails `registry:build` instead
of passing silently. No version bump: metadata only, no source change to any item.
