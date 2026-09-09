---
"@vegastack/ui": minor
---

🔧 **DatePicker, Board and Dropzone.** DatePicker and DateRangePicker triggers are `w-full` like
every other form control: the fixed `w-56` and `w-72` were the only fixed-width controls in the
system and overflowed a 320px content area. The calendar caption is now a real `auto 1fr auto` grid
(`navLayout="around"`) instead of an absolutely positioned nav over a `px-7` clearance, and the
selected day carries a pressed rung (`hover:bg-primary-hover active:bg-primary-active`) instead of
pinning its rest fill. Board's grab cursor appears only where a pointer drag can actually start and
its column body height is the new `columnMaxHeight` prop. Dropzone paints the drag-over state on its
own surface, so a dropzone wrapping anything other than an `Empty` finally shows one, and a new
`dragState` prop paints either state for documentation and automated checks.
[docs](/docs/components/date-picker)
