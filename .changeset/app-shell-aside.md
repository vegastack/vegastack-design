---
"@vegastack/ui": minor
---

🧩 `AppShellAside` and `AppShellAsideHeader`: a panel at the shell's end that stays across routes. Docked from 1280px, over the content below that, and a full-screen modal dialog on a phone, above the on-screen keyboard. It resizes from its start edge by pointer or keyboard, its children stay mounted through closing and breakpoints, and `AppShellAsideStateScript` with `useAppShellAsideCookie` makes a static shell paint it right the first time. `UploadPanel` stays clear of it through `--app-shell-aside-inset`.
