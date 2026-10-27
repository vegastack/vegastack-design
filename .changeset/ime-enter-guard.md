---
"@vegastack/ui": patch
---

🐛 Enter that confirms an input-method (IME) candidate no longer submits or commits early. The Enter that ends an IME composition can arrive with `isComposing` already false and `keyCode` 229, and Enter-to-submit only checked `isComposing`. It now checks both, in **Textarea** `submitOnEnter`, **ChipInput**, **PickerPanel** search, **TaskInline**, **EditableCell**, `useInlineEdit`, **SearchInput** `onValueCommitted`, **DocumentLayout** find, **Transcript** search and speaker rename, the **AgentPanel** reply and instructions and the **DelegatePopover** ⌘Enter send, **TextEdit** (⌘Enter submit, block exits, the bookmark field, find and replace), the editor suggestion menus (`suggestionMenuKeyDown`, used by TextEdit and TemplateEditor), **BlockView**'s ⌘Enter, and the search-palette block's ⌘Enter. DataGrid, FieldCell and InlineChip already checked both.
