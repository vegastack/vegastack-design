---
"@vegastack/ui": minor
---

🔧 `PeekSheet` and `Peek` take `finalFocus`, Base UI's drawer option for where focus goes when the phone sheet closes. `Peek`'s sheet now hands focus back to the row that opened it, or leaves it where it is, and never returns it to a text field such as the page's search box, which raised a phone's keyboard on close.
