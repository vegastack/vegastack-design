---
"@vegastack/ui": patch
---

🔧 Blur placeholders reach record grids and lists. `MediaCard` takes `imagePlaceholder` (a data URL blurred over the image area until it loads), `imageSrcSet` and `imageSizes`, passed to its thumbnail. A `DataList` column's `thumbnail` may return `{ src, placeholder?, srcSet?, sizes? }` (the `DataListThumbnail` type) as well as a URL string, forwarded to the row's `Thumbnail` and to the grid's `MediaCard`; string thumbnails work as before.
`AvatarPicker` names a refused HEIC/HEIF photo (“`<name>` is a HEIC photo. Export it as JPEG and try again.”) and announces every refusal and every `error` exactly once through one polite live region.
