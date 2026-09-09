---
"@vegastack/ui": minor
---

⚠️ **Slider's internals are no longer restyled from outside.** Anything reaching into
`[&_[data-slot=slider-track]]` / `-indicator` / `-thumb` to build a media rail should pass
`variant="media"` or `variant="overlay"` with `thumb="hover"` instead. The internal slots keep their
`data-slot` names, but their rest appearance is now the `variant`'s to decide.
[docs](https://design.vegastack.com/docs/components/slider)
