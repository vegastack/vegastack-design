---
"@vegastack/ui": patch
---

🐛 **Share dialog** (`share-01`) — switching between Share and Publish no longer leaves the other tab's controls painted for a beat (the Publish switch over the Invite button, or Invite and Copy link over the Publish row). The hidden panel and the hidden footer hide with `visibility`, which upstream's `transition-all` on Button, Switch and Select animated; descendants of a hidden box now carry no transition, so they hide in the same frame.
[docs](https://design.vegastack.com/docs/blocks/share-01)
