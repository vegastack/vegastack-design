---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **DocumentLayout**: a fluid text column on five tiers by the layout's own width — S < 40rem (full width), M 40–60rem (max(36rem, 75%)), L 60–90rem (clamp(40rem, 75%, 52rem)), XL 90–120rem (60rem), 2XL ≥ 120rem (64rem) — replacing the 47ch measure; Wide is the whole width less the gutters and the margin. The contents rail moves to the gutter before the text (`TableOfContents side="start"`) and stacks above the text and the comment margin, so its open panel takes the pointer over both. A comment margin (20rem, 24rem from XL) keeps the text's width and shifts the centred block to the start; the text gives way only when text, margin and gutters can't all fit. `DocumentLayoutTier` adds `2xl`. New `DocumentLayoutTitleGroup`, `DocumentLayoutIcon` (`reveal` for an Add icon control) and `DocumentLayoutTitle` (30/36, one step above the text's `#`). **TableOfContents**: the rail's panel sits in a frame that bridges the gap to the rail, with 300ms of grace before it closes, and marks the reached heading with a bar. **CommentComposer**: `size="sm"` pads the card 12/8 for a comment margin or popover, where the composer is the card.
