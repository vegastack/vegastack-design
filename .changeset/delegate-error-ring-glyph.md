---
"@vegastack/ui": minor
---

🔧 `DelegatePopover` takes `error` and `onRetry`: when the agents couldn't be read it says so with Try again, instead of skeletons forever or the connect state (which would claim there are none). `AgentStateRing` takes `glyph`, which badges a ringed state's icon (needs you, failed) on the avatar's corner, so a narrow cell never tells the state by colour alone.
