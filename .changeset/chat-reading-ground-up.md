---
"@vegastack/ui": minor
"@vegastack/design": minor
---

🧩 Agent chat, ground up: a reading type scale, a citation pill, and the parts a conversation needs.

- `@vegastack/design`: `proseReading` and `proseReadingClassName`, the reading overlay on `prose` (TYP-20): the document's 14/24 body (16/26 on a coarse pointer or a narrow window) under the compact headings, 12px between paragraphs and lists, 4px between list items.
- `MarkdownView`: `typeScale="reading"` for long-form agent and AI text; `streaming` completes the last block of a stream (open code fence, code span, `**`, `*`, `~~`; a half-written link shows its words, a half-written `[[n]]` waits) and renders citations in settled blocks only; `completeStreamingMarkdown` is exported.
- Citations: a `[[n]]` marker is now a numbered pill on the text's middle line instead of a superscript, so it keeps the line's height; adjacent markers group into one pill ("1 +2") whose card lists every source (`MarkdownCitationMarker` gains `more`). Without `onSelect`, a click or tap opens the card and never navigates.
- `message-parts`: `MessageBubble` (a person's message on the muted surface, line breaks kept, reading metrics), `MessageTime` (`RelativeTime` for a message, `reveal` `always` or `hover`), `MessageSourceList` (a rounded "Sources · N" pill with site icons that opens to numbered link rows; `MessageSource`), and `MessageActivity` with `MessageActivityNote`, `MessageActivityStep` and `MessageActivityResults` (the turn's thinking and steps: a shimmer and live timer while running, a summary and `ms` when done, opens while running and closes once a second after, a timeline with nested results). `MessageStepStatus` gains `pending`. `MessageActions` sizes every `Toggle` to the 28px square of `Button size="icon-sm"`.
- `ChatComposer`: `notice` with the new `ChatComposerNotice` (icon by `tone`, an action, ✕ through `onDismiss`, `live`), attached to the top of the box; `onRemoveLastAttachment` for Backspace in an empty box; the box takes the larger radius and a light shadow in light mode.
