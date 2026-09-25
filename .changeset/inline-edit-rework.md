---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Inline edit rework. `EditableCell`'s edit mode now looks like its view: no border, ring or background, and the field inherits font, size, weight, line height, tracking and colour, so only the caret and the selection show it is editing. The display and the field share one box (the text sizes a grid cell the field is laid over), so the field grows with its content, wraps when the value wraps and nothing shifts entering or leaving edit. New props: `onSave` (the promise API; `onCommit` still works), `variant` (`inline` · `cell` fills a table cell and lets clicks beside the text reach the row link · `heading` keeps the title's size and weight and wraps), `multiline` (⌘/Ctrl+Enter saves), `required` + `requiredMessage`, `onNavigate` (Enter or Tab saves and moves on), `tooltip` and `saveErrorToast`. Saves are optimistic, the trailing spinner shows only after 300ms, and a failure rolls back, is announced and raises a toast with Retry. Read mode is a button labelled `Edit {label}`; F2 starts editing. `useInlineEdit` gains `multiline` and ignores keys during IME composition.
