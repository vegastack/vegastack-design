---
"@vegastack/ui": patch
---

⚠️ **TextEdit**: Escape in a `document` editor now keeps the text, commits and blurs (it reverted unless `autosave` was set) — reverting a document erased text people had typed; `boxed` and `composer` fields still revert, and `escapeBehavior` still chooses either way. A `readOnly` editor is now a document (`role="document"`) rather than a read-only text box: no `aria-readonly` or `aria-multiline`, so assistive tech announces content, not a field.
[docs](https://design.vegastack.com/docs/components/text-edit)
