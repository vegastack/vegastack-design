---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 The `FolderTree` docs page builds again: its accessibility notes named the disclosure button with a bare `{name}`, which MDX read as an expression and the docs export failed on.
