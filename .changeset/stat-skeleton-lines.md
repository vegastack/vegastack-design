---
"@vegastack/ui": patch
---

🐛 **StatSkeleton**: each bar sits in the line box of the text it stands in for (the label's 16px, the value's 20px or 32px), so a loading stat is exactly as tall as a loaded one — dashboard tiles no longer grow 8px when their counts arrive.
