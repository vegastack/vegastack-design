---
---

🛠 `changelog-lint` refuses a bare `{…}` outside inline code: the docs changelog is MDX, so an unescaped brace evaluates as JavaScript and breaks the public docs build.
