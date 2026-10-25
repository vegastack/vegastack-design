---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **field-cell**: a link cell's chips no longer break inside a name. A chip's first word may wrap in running text, and inside a host's prose (`overflow-wrap: break-word`, an editor's embedded table) a narrow column split its letters ("Merid / ian"). Each chip in `FieldCellDisplay` now stays on one line, cut with an ellipsis and its full name on hover; a host that lets the cell grow (`className="flex-wrap"`) wraps whole chips onto new lines. [docs](https://design.vegastack.com/docs/components/field-cell)
