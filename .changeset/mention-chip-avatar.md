---
"@vegastack/ui": patch
---

🐛 Mention chips keep their avatar inside the chip, at every text size, and never spellcheck.

- The photo no longer drops out of the chip in rendered text and the editor: a prose root's picture rule (block, margin, border) reached the avatar's `<img>`; the chip now pins it to the circle.
- Initials scale with the text (`55%` of the chip's size, not a fixed 12px), so "MA" fits its circle in a comment, a paragraph or a heading. The avatar is `1.1em`, an `inline-block` centred on the label, so it no longer drops by half its height when it shows initials.
- A chip is `spellcheck="false"`, and in `TextEdit` its node view is also `contenteditable="false"`: no red underline under a name.
- A long name still breaks inside a narrow column (the prose root's `wrap-anywhere`), so a chip never overflows it.
- New `InlineChipPerson.inactive`: the name is followed by the person surfaces' small muted outline "Inactive" badge, and the chip carries `data-inactive`. The label text is unchanged, so comment anchors keep matching.
