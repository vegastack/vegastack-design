---
"@vegastack/ui": patch
---

🐛 **A `Timeline`'s last row lost the bottom of its pointer target.** `TimelineItem`'s `<li>` uses
`content-visibility: auto` for render skipping, which brings paint containment with it, so anything
a child paints outside the box is clipped and stops being hit-testable. `timeline-content` dropped
its bottom padding on the last item, and a trailing `RelativeTime` — whose 24px pointer target comes
from a 4px `before:-inset-y-1` overhang — had that overhang fall outside the clip: the effective
target collapsed to the row's own 23px, under the WCAG 2.2 SC 2.5.8 floor. The last row now keeps
4px of bottom padding, exactly the depth of that hit area. Trailing whitespace under the final row
grows by 4px; nothing else moves.
[docs](https://design.vegastack.com/docs/components/timeline)
