---
"@vegastack/ui": patch
---

🐛 **TextEdit**: node views follow the editor's editability. Checklist boxes, live task lists (`renderTaskQuery`'s `editable` and `setQuery`), callouts, toggles and code blocks redraw when `setEditable` runs, so an editor that mounts read-only and turns editable (a collaborative page whose room becomes ready) no longer keeps disabled checkboxes and a read-only task list.
