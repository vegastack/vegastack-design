---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Meeting page parts: AudioPlayer gains `variant="floating"` (a centred pill) and a global player — `AudioPlayerProvider`, `GlobalAudioPlayer`, `useGlobalPlayer` and `useGlobalPlayerTime` — that keeps one recording playing across routes with a title link back; Transcript turns show time, a coloured speaker dot and the name above full-width text, `TranscriptSpeakers` adds speaker chips with rename (`onSpeakerRename`), and long transcripts mount progressively (`batchSize`); new `MetaLine`, `RecordChip` and `StatusLine`; new `useTabsSwipe` hook for touch swipe between Tabs, documented with the full-width default variant; review-split-01 shows the speaker chips.
