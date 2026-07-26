---
"@vegastack/ui": minor
---

New `use-platform` registry hook — SSR-safe platform detection returning `{ os, isTouch }`
(`os: "mac" | "windows" | "linux" | "other"`, touch from the `(pointer: coarse)` media query). The
server render and hydration render report caller-supplied fallbacks so markup agrees on first
paint; the real value lands in a client-only effect. Fills the hole behind `Kbd`'s manual `os`
prop: callers run the hook and pass `os === "mac" ? "mac" : "other"` down — `Kbd` itself stays
server-safe and unchanged.
