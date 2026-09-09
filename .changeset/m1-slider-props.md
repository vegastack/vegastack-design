---
"@vegastack/ui": minor
---

🔧 **`Slider` grows the props the players were faking with descendant selectors.** `variant`
(`default · media · overlay · bare`), `orientation` (vertical is now supported and is how the volume
rail is built), `thumb` (`always · hover · none`), `marks` and `showValue`. Every
`[&_[data-slot=slider-*]]` override in the players is deleted.
[docs](https://design.vegastack.com/docs/components/slider)
