---
"@vegastack/ui": patch
---

🧩 **DataList**: a `mergedLayout="line"` meta line stays ONE line in a squeezed phone row. The squeeze released every descendant of the fill cell, so a folder row's space, time, person and size each wrapped inside its own box ("Produc" / "t", "25" / "MB"). The line is now kept out of the release and contains its inline size, so it truncates and never widens the table.
