---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **TextEdit**: in `collaboration`, two people typing at the same spot no longer get one side's characters reversed (`12345678` landing as `87654321`). After a collaborator's change the caret now stays exactly where Yjs puts it whenever its text still exists, instead of the binding re-placing it by its old offset in a paragraph whose text changed.
[docs](https://design.vegastack.com/docs/components/text-edit)
