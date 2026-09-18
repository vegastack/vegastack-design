---
"@vegastack/ui": major
---

⚠️ **1.0 — every component shadcn ships is now upstream's own file plus a recorded patch, and there is no compatibility layer.**

62 upstream components were reset onto pinned `shadcn@4.21.0` `base-nova`, so their props, variants
and behaviour are upstream's; 13 are new here (`aspect-ratio`, `button-group`, `calendar`, `carousel`,
`direction`, `drawer`, `input-group`, `input-otp`, `menubar`, `native-select`, `questionnaire`,
`sonner`, `panel-search`); 10 are **retired** onto an upstream replacement (`icon-button`,
`otp-input`, `password-input`, `checkbox-group`, `field-inline`, `segmented`, `split-button`,
`progress-indicator`, `onboarding-checklist`, `floating-surface`); and the 10 marketing components are
**removed outright** with their scope mechanism and tokens. Button's `variant × tone` axis becomes
upstream's flat `variant`, `IconButton` becomes `Button size="icon*"`, `Field` composes its label,
description and error as children, the toast manager is `toast.add`/`toast.close`/`toast.promise`,
`Sheet` moves off Base UI Drawer onto Dialog, and a long list of `size` axes is gone. Visible without
touching any code: one 2px focus outline instead of the ring glow, a hand cursor on every control,
shadcn's own neutral, no surface ladder, and Tailwind's stock radius, shadow and type scales. The
registry ships 689 items, including 100 blocks.

What is ours is 60 recorded exceptions, every one traceable: a component's docs page closes with a
`## Deviations` section naming the decision IDs behind its patch.

**Who this affects:** every consumer. Re-pull every copied-in component; a retired import fails to
resolve, and each retirement's prop map — including what did **not** survive it — is in
`docs/MIGRATING-1.0.md` § 7.
