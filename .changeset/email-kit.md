---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 Add the `email-kit` block: server-rendered HTML email that installs into `components/email/` (`shadcn add @vegastack/email-kit`).

- Three templates, every string a prop: `NotificationEmail` (one event — heading, quotes, a record card, one button), `DigestEmail` (grouped rows and "Open inbox") and `ActionEmail` (an invite or reset — button, raw-link fallback, expiry note).
- `EmailLayout` and its parts — `EmailHeading`, `EmailText`, `EmailLink`, `EmailButton`, `EmailCard`, `EmailQuote`, `EmailItems`, `EmailDivider` — on React Email's tables: a text wordmark, a 600px fluid card, the system font stack, a 46px bulletproof button that goes full width on a phone, and a footer with the reason, preference links and "Sent with VegaStack".
- Light colours inline; dark mode from `prefers-color-scheme` and, in its own style block, the Outlook.com `[data-ogsc]`/`[data-ogsb]` hooks; a 600px ghost table for classic Outlook. The colours are the design tokens converted to hex by `tooling/generate-email-tokens.mjs`, AA in both modes and never pure white or black; `design:verify` fails if `email-tokens.ts` drifts.
- `renderEmail(element)` returns `{ html, text }`; each template renders to about 10 KB.
- The docs page shows every template light and dark and carries the "Writing notifications" rules for in-app, push and email copy.
  [docs](https://design.vegastack.com/docs/blocks/email-kit)
