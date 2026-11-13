---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
"@vegastack/design": patch
---

🧩 Desktop glass, for the VegaStack desktop app's floating windows that sit on the operating system's own glass. `surface-glass` is an opaque `popover` fill everywhere, transparent only when the host sets `<html data-native-glass>`, and opaque again under Reduce Transparency and Increase Contrast (with a 1px `--glass-edge` border). Tokens: `--glass-ink`, `--glass-ink-muted`, `--glass-edge` and a reserved `--glass-dim`; `contrast-check` gates both inks at AA on `popover` and on a worst-case native backdrop. It is not a CSS blur and not a return of the retired frosted glass: `doctor` still flags `backdrop-blur-glass`. See Foundations › Desktop glass.
