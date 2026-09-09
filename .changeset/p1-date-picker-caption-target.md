---
"@vegastack/ui": minor
---

🐛 The **DatePicker caption dropdown** was a 21px-tall pointer target. `captionLayout="dropdown"`
renders a transparent `<select>` stretched over the caption root (`absolute inset-0`), and that root
— an `items-center` child of a 32px row — collapsed to its 21px line box, so the real control
measured 50.36×21.00 against the system's 24px effective-target floor (WCAG 2.2 §2.5.8). The root now
takes `self-stretch`, handing the select the row's full height. Nothing in that root paints, so the
month/year label and its chevron are pixel-identical. Its entry in the geometry lane's `EXCLUDED`
map is deleted. [docs](/docs/components/date-picker)
