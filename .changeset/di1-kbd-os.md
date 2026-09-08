---
"@vegastack/ui": minor
---

⚠️ **`Kbd` defaults to `os="other"`.** It reads no `navigator` — that is what keeps it
server-safe — so the platform is the caller's to resolve: run `usePlatform()` and pass the answer
down. The old default shipped mac glyphs to a Windows majority. `TooltipKbd` takes the same `os`
prop.
[docs](https://design.vegastack.com/docs/components/kbd)
