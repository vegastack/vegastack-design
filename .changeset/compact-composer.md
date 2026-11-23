---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🔧 **ChatComposer rests at one line.** With `rest`, a card that nothing in it has focus and that holds nothing to keep in view (files, a notice, steers, an error, a menu open from one of its controls, `data-composer-hold`, `holdOpen`) is one 48px capsule: the agent's avatar, the first line of the text (a draft leads with a dot, its Send filled) and Send or Stop. Focus or a click opens it; its height eases between the two (`duration-layout`, instant under reduced motion). `ChatComposerInput` takes `restPlaceholder`. ⚠️ **`ChatComposerHeader` and `ChatComposerHeaderTrigger` are removed**, with no alias: who the message goes to is the new `ChatComposerAgent`, after + in `ChatComposerActionsStart` (the name alone as its child; long names truncate, the whole name stays in its label and hover title; at rest only its avatar shows). Plan moves to the + menu and shows as a pressed `ComposerChip` after the agent while on.
