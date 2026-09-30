---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `AlertAction` now lays its children out in a wrapping flex row with a `gap-2` gap, so two buttons (a "Resend invite" beside a "Revoke invite", say) go straight inside it with no `ButtonGroup` or wrapper `div`, and wrap onto a second line when the alert is narrow. The Alert docs gain a Two actions example.
