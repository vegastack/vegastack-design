---
"@vegastack/ui": patch
---

🔧 Emoji reactions. New `Reactions` (pills with counts that toggle, a hover card naming who reacted, an add button with quick reactions 👍 ❤️ 😄 🎉 👀 🙏) and `toggleReaction` for optimistic updates. `CommentItem` and `CommentList` take `onReactionToggle` and read each comment's `reactions`; the add button joins the hover actions. `EmojiPicker` gains a quick row, a category bar, a Recent section, `size="sm"`, a skeleton and a DS empty state, and loads its data lazily from the new `emoji-data` lib (`EMOJI` moved there).
