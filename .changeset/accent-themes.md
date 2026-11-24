---
"@vegastack/ui": minor
"@vegastack/design": patch
"@vegastack/design-tokens": minor
---

🧩 Accent themes (COL-27): a person picks one of seven colours and Black, the default, changes nothing. New `accent` item (`setAccent`, `useAccent`, `restoreAccent`, `AccentScope`, `AccentPicker`, `AccentPreview`, `AccentScript`), `data-accent` token blocks for Blue, Violet, Pink, Orange, Green and Teal in light and dark, `@vegastack/design-tokens/accents`, `accents.json` and `accents.dart`. New roles `primary-hover`, `primary-pressed`, `primary-text`, `link`, `link-hover`, `unread`, `nav-selected`, `nav-selected-foreground`, `nav-selected-icon`, and `check`, `mark`, `ink`, `ink-foreground`, which no accent changes; every component names its role, and design-lint `accent-role` refuses `text-primary` and opacity hovers of a primary fill. Email kit templates, `EmailLayout` and `EmailButton` take `accent`. An app that overrides `--primary` overrides `--primary-hover`, `--primary-pressed` and `--primary-text` too.
