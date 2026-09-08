---
"@vegastack/ui": minor
---

🔧 **Reduced motion is stated once, globally.** All seventeen `motion-reduce:` copies across
eleven components were deleted — the registry now carries zero. The `base.css` reset owns the rule
with the one sanctioned `!important`, so a per-component restatement adds nothing and is a second
copy that can drift. One copy looked load-bearing and exposed a hole in the reset instead: it zeroed
animation _duration_ but not _delay_, so `StaggeredTextReveal` still played its words out one by one
over the full stagger window.
[docs](https://design.vegastack.com/docs/foundations/motion)
