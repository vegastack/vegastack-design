---
"@vegastack/ui": patch
---

🐛 Agent faces: Glass fades toward grey when it couldn't finish, is scheduled or is paused, the same way every other palette does, instead of turning see-through.

- Glass's three colours mix toward the light-to-deep greys by the state's amount (failed 50%, scheduled 35%, paused 86%), so the body stays solid on any surface and no ring or lower layer shows through it.
- Paused features use a solid softer ink (`--fs`, the ink 40% toward the body) in place of 60% opacity.
