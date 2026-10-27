---
"@vegastack/ui": patch
---

🐛 Enter that confirms an input-method (IME) candidate no longer submits or commits early. The Enter that ends an IME composition can arrive with `isComposing` already false and `keyCode` 229, and Enter-to-submit only checked `isComposing`. It now checks both, in **Textarea** `submitOnEnter`, **ChipInput**, **PickerPanel** search, **TaskInline**, **EditableCell**, `useInlineEdit`, **SearchInput** `onValueCommitted`, **DocumentLayout** find, **Transcript** search and speaker rename, and the **AgentPanel** and **DelegatePopover** ⌘Enter send. SuggestionMenu, DataGrid, FieldCell, InlineChip and the TextEdit editor already checked both.
