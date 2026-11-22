---
"@vegastack/ui": minor
---

🗑 **Shell Assistant is the docked card only** (Regent batch "Home, memory, For you and chats redesign", D11: floating chat mode dropped), with no compatibility code. `AssistantCard` loses `place` (and `data-place`): it is always the second card beside the page, the split view, rendered as `Shell`'s `assistant`, and it is a labelled `region`, never a dialog. Gone with the floating card: dragging by the header, Alt + arrow moves, the corner resize grip (`assistant-card-resize`), the `AssistantPlace` type, and `AssistantCardHeader`'s `place` and `onPlaceChange` with its "Float over the page" / "Dock beside the page" tool. `Shell` shows the card only while open and from 40rem; under 40rem it shows none (a phone puts the parts in a `PeekSheet`). Outside a shell the card fills its container. A consumer drops `place` from `AssistantCard` and `AssistantCardHeader`.
