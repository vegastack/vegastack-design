# BATCH 11 — sonner/toast, notification-bell, relative-time, markdown-view, message, bubble, message-scroller

## BATCH SUMMARY

All 7 components have a full file set (canonical ✓ / test ✓ / mdx ✓ / preview ✓). Coverage is generally strong; the recurring gap is **API completeness** — most multi-part components document only one `*Props` type via `AutoTypeTable` and leave sibling subcomponents/exports undocumented.

Counts:

- Components audited: 7
- Missing pages: 0 | Thin previews: 0
- Components fully clean (no gaps): 0
- Components with API-table gaps: 5 (sonner-N/A type, notification-bell omits `dot`-vs-table reconcile is fine, message, bubble, message-scroller, markdown-view minor)
- Components with VARIANT gaps: 4 (sonner — `loading`/`message`/`custom`/`closeButton`/`expand`/`position`; relative-time — `refresh` live-update not visibly demonstrable; bubble — `secondary` shown only in grid; message-scroller — `last-anchor` / `scrollPreviousItemPeek` props)
- Naming mismatch flagged: 1 (sonner canonical ↔ `toast.mdx` slug)

### Proposed category table

| Component         | Proposed category    | Reason                                                      |
| ----------------- | -------------------- | ----------------------------------------------------------- |
| sonner (toast)    | Feedback & Status    | Transient non-blocking notifications with status variants.  |
| notification-bell | Feedback & Status    | Unread-count status affordance in app chrome.               |
| relative-time     | Typography & Content | Formats a timestamp into inline prose; presentational text. |
| markdown-view     | Typography & Content | Renders a markdown string into token-styled prose.          |
| message           | Chat & Communication | Layout primitives for a single conversation row.            |
| bubble            | Chat & Communication | Speech-bubble surface inside a conversation.                |
| message-scroller  | Chat & Communication | Auto-scrolling conversation viewport engine.                |

---

## sonner

- files: canonical ✓ (`packages/ui/registry/ui/sonner.tsx`) | test ✓ (`sonner.test.tsx`) | mdx (`apps/docs/content/docs/components/toast.mdx`) ✓ | preview ✓ (`apps/docs/components/preview/sonner.tsx`)
- exports/subcomponents: `Toaster` (component), `ToasterProps`, `toast` (re-exported imperative fn from sonner with `.success/.error/.warning/.info/.loading/.message/.promise/.custom/.dismiss`)
- proposed category: **Feedback & Status** — token-styled Sonner toaster, status variants, theme-following.

### API surface (ground truth)

- `ToasterProps extends SonnerToasterProps` with documented overrides: `position` (6 edges, default `'bottom-right'`), `theme` (`'light'|'dark'|'system'`, default resolves from next-themes), `closeButton` (bool, default false), `expand` (bool, default false). All other Sonner Toaster props pass through (`...props`).
- Imperative `toast()` variants wired with icons: `success` (CircleCheck), `info` (Info), `warning` (TriangleAlert), `error` (OctagonX). `loading` has no custom icon mapping (Sonner default spinner). Variants exist for: default, success, error, warning, info, loading, promise, action, description, cancel button.
- States/options: `description`, `action` button, `cancelButton`, `toast.promise(loading→success/error)`.

### Currently demonstrated

- preview exports: `sonner` (bare toast), `toastDemo` (frontmatter `preview`, success), `sonnerVariants` (default/success/info/warning/error — 5 variants), `sonnerStates` (with-action, promise).
- mdx sections present: Installation, Usage, Examples (×2 previews), API Reference (AutoTypeTable `ToasterProps` + prose listing imperative variants), Accessibility, Do/Don't. **No Anatomy** (acceptable — single host).
- API table status: `AutoTypeTable name="ToasterProps"` present + correct; imperative `toast()` API surface documented in prose (line 75-78) — good given it's a function, not a Props type.

### GAPS

- [STRUCTURE] Name mismatch: canonical/test/preview file = `sonner`; doc page slug + title = `toast` (`toast.mdx`, meta.json line registers `"toast"`). This is **intentional and explicitly explained** in mdx Usage (lines 17-19: "documented as Toast because that is the design-system pattern; the registry item is named `sonner`"). Verdict: keep as-is; the install snippet correctly uses `@vegastack/sonner` (line 10) and import path `@/components/ui/sonner` (line 26) — consistent. No fix needed, but flagging per instructions.
- [VARIANT] `toast.loading(...)` standalone is never demonstrated (only appears as the `loading` phase of `toast.promise`). The mapped loading icon path is also untested.
- [VARIANT] `toast.message(...)` and `toast.custom(...)` listed in API prose (line 77) but never shown in any preview.
- [VARIANT] `closeButton` and `expand` Toaster props are documented in `ToasterProps` but **never demonstrated** — and since the docs `<Toaster/>` is mounted once in the provider, a consumer can't see these without re-mounting. No preview exercises them.
- [VARIANT] `position` (6 edges) documented but not visually demonstrated (single mounted toaster).
- [MATRIX] No full variant grid showing all 5 surface tints side-by-side simultaneously (they fire sequentially via buttons) — acceptable given toast is transient, but a static "all variants" visual is impossible by nature. Note only.
- [PROSE] none — reality matches; a11y covers aria-live/role=status, color+icon redundancy, theme contrast.
- [API] none — surface is fully covered (type + prose).

### Verdict

- coverage: **High (~85%)**. effort: **S**.
- top 3 fixes: (1) add a `toast.loading` + dismiss preview; (2) demonstrate `closeButton`/`position` (e.g. a local `<Toaster closeButton position="top-center" />` example or at least a code snippet); (3) show `toast.message`/`toast.custom` or drop them from the prose list to avoid documenting-but-not-demonstrating.

---

## notification-bell

- files: canonical ✓ | test ✓ | mdx (`notification-bell.mdx`) ✓ | preview ✓
- exports/subcomponents: `NotificationBell`, `NotificationBellProps` (single component)
- proposed category: **Feedback & Status** — unread-count badge on a bell IconButton.

### API surface (ground truth)

- Props: `count?` (number, default 0; `0`/omitted hides badge; `>99` → `"99+"`; negatives clamped, fractions floored), `dot?` (bool, default false — minimal dot vs number), `aria-label?` (string, default `'Notifications'`; count folded in automatically). Extends `IconButtonProps` minus `children`/`aria-label`/`label`. Forwards ref to underlying button (Pattern D).
- States: empty (count 0, no badge), unread (numeric), max-overflow (`99+`), dot mode.

### Currently demonstrated

- preview exports: `notificationBell` (frontmatter preview, count=3), `notificationBellCounts` (count 0, 5, 42, 250→"99+", 8+dot).
- mdx sections present: Installation, Usage, Examples (1 preview), API Reference, Accessibility (+key table), Do/Don't. No Anatomy (single component — fine).
- API table status: `AutoTypeTable name="NotificationBellProps"` present + correct.

### GAPS

- [VARIANT] All four states (empty/numeric/max/dot) are demonstrated in `notificationBellCounts`. The boundary case `count={99}` (exact max, still numeric) vs `count={100}` (first overflow) is not individually shown — `250` proves overflow but not the 99/100 edge. Minor.
- [VARIANT] `count` with a negative or fractional value (clamp/floor logic at canonical line 66) is tested but not demonstrated — acceptable (edge defensive behavior, not a user-facing variant).
- [API] `IconButtonProps` pass-through (e.g. `size`, `variant` on the underlying IconButton) is inherited but not surfaced in the table (AutoTypeTable only shows the 3 own props). A reader won't know they can pass `size`/`variant`. Minor — consider a one-line note linking to IconButton.
- [PROSE] none — a11y is exemplary (count folded into accessible name, badge aria-hidden, key table). Reality matches.
- [STRUCTURE] none.
- [MISSING] none.

### Verdict

- coverage: **High (~90%)**. effort: **S**.
- top 3 fixes: (1) add a one-line note that IconButton props (`size`/`variant`) pass through; (2) optionally show `count={99}` vs `count={100}` boundary; (3) nothing else material.

---

## relative-time

- files: canonical ✓ | test ✓ | mdx (`relative-time.mdx`) ✓ | preview ✓
- exports/subcomponents: `RelativeTime`, `RelativeTimeProps` (single component)
- proposed category: **Typography & Content** — inline timestamp prose via native Intl.

### API surface (ground truth)

- Props: `date` (Date|string|number, required), `mode?` (`'ago'|'day'`, default `'ago'`), `now?` (epoch ms — controlled/deterministic, disables timer), `refresh?` (bool, default true — adaptive live timer: 10s <1h, 60s <1d, off ≥1d), `locale?` (string|string[]), `title?` (bool|string, default true — tooltip with absolute date), `tooltipDelay?` (number ms, default 0). Extends `<time>` props minus `title`/`children`. Renders semantic `<time dateTime>`.
- Formats: ago (`"2 hours ago"`, `"in 3 days"`, sub-minute → `"now"`); day (`"today"/"yesterday"/"tomorrow"`, else absolute `"March 15"` / `"March 15, 2025"`).
- States: tooltip on (default), custom-string tooltip, tooltip off; invalid date → empty `<time>` no `dateTime`.

### Currently demonstrated

- preview exports: `relativeTime` (frontmatter, -2h), `relativeTimeExamples` (-30s/-5m/-2h/-3d/+2h/+3d — past+future+now), `relativeTimeModes` (ago vs day: yesterday/today/tomorrow/absolute), `relativeTimeStates` (tooltip default / off / custom label).
- mdx sections present: Installation, Usage, Examples, **Modes**, **States**, **Determinism** (with `now`/`refresh` snippet), API Reference, Accessibility (+key table), Do/Don't. Rich structure.
- API table status: `AutoTypeTable name="RelativeTimeProps"` present + correct.

### GAPS

- [VARIANT] **Live-update (`refresh`)**: every preview passes a fixed `now={NOW}`, which **disables the timer** (canonical `isControlled` short-circuits refresh). So the self-updating behavior — the component's headline feature — is **never visibly demonstrated** in the docs (it can't tick with a frozen clock). Documented in the "Determinism" section and Usage prose, but no live example. Inherent tension (live demo = non-deterministic screenshots); consider one un-frozen `<RelativeTime date={Date.now()-30000} />` example explicitly labeled "live".
- [VARIANT] `locale` prop (localization) is documented + Do/Don't praises it ("localizes for free via the locale prop") but **no preview passes `locale`** to show a non-English render. Gap between claim and demonstration.
- [VARIANT] `tooltipDelay` documented but not demonstrated (all examples use default 0).
- [VARIANT] Invalid-date state (empty `<time>`) tested but not demonstrated — acceptable (defensive).
- [API] none — single Props type, complete.
- [PROSE] none — a11y strong (`<time dateTime>`, focusable trigger, focus-visible ring, color-independent). Reality matches.
- [STRUCTURE] none.

### Verdict

- coverage: **High (~85%)**. effort: **S–M**.
- top 3 fixes: (1) add one live (non-frozen `now`) example to actually show refresh ticking; (2) add a `locale="de-DE"` (or similar) example to back the localization claim; (3) optionally show `tooltipDelay`.

---

## markdown-view

- files: canonical ✓ | test ✓ | mdx (`markdown-view.mdx`) ✓ | preview ✓
- exports/subcomponents: `MarkdownView`, `MarkdownViewProps` (single component; `markdownComponents` element map is internal)
- proposed category: **Typography & Content** — renders markdown to token-styled, XSS-safe HTML.

### API surface (ground truth)

- Props: `children?` (string markdown, preferred), `content?` (string markdown, alternative; children wins). Extends `<div>` props. Server-safe (no `'use client'`). Renders null for empty/whitespace.
- Element coverage (per `markdownComponents`): h1–h6, p, a (external→`target=_blank rel=noreferrer noopener`), ul, ol, li, blockquote, code (inline chip vs fenced), pre, hr, table/thead/tr/th/td (in overflow wrapper), img, strong, em, del. GFM via remark-gfm: tables, strikethrough, task lists, autolinks. XSS-safe (no rehype-raw, no dangerouslySetInnerHTML, drops `javascript:`).

### Currently demonstrated

- preview exports: `markdownView` (heading, lead w/ link+inline code, bullet list, fenced ts block, blockquote), `markdownViewGfm` (table, strikethrough, task list), `markdownViewCode` (inline + fenced).
- mdx sections present: Installation, Usage (children + content prop), Examples (Default / GFM / Code blocks — 3 previews), API Reference, Accessibility (+key table), Do/Don't.
- API table status: `AutoTypeTable name="MarkdownViewProps"` present + correct.

### GAPS

- [VARIANT] **Element coverage not fully demonstrated.** Headings shown only at h1/h2/h3 level (SAMPLE uses `#`/`##`, GFM/CODE use `##`/`###`); **h4/h5/h6 never rendered** in any preview, so the distinct h5 (sm muted-foreground? no — h5 is foreground, h6 is muted-foreground) styling is unverified visually. `hr` (`---`), `img`, and **ordered list (`ol`)** are styled in canonical but **never appear in any preview** (`markdownView` uses only a bullet list; tests cover `ol` but docs don't show it). `del`/`em`/`strong` appear; `em` shown via prose? `strong` yes (`**bold**`).
- [VARIANT] External vs internal link distinction (external opens new tab, internal stays) is a notable behavior — only an external link is shown (`https://vegastack.com`); the internal-link/`target`-less path is tested but not demonstrated.
- [MATRIX] A single "kitchen-sink" sample exercising **every** element (all 6 heading levels, ol, hr, img) would reveal the full prose surface in one view — currently spread thin and missing several elements. Worth adding.
- [API] none — single Props type complete. (Internal element map is intentionally not a public API.)
- [PROSE] none — a11y excellent (semantic HTML mapping, XSS-safe rationale, rel-safe links, color-independent links). Reality matches.
- [STRUCTURE] none.

### Verdict

- coverage: **Medium-High (~80%)**. effort: **S**.
- top 3 fixes: (1) add h4/h5/h6, ordered list, `hr`, and `img` to a sample so all styled elements render; (2) demonstrate an internal (relative) link alongside the external one; (3) optionally one consolidated kitchen-sink preview.

---

## message

- files: canonical ✓ | test ✓ | mdx (`message.mdx`) ✓ | preview ✓
- exports/subcomponents: `Message` + `MessageProps`, `MessageGroup` + `MessageGroupProps`, `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter` (6 components)
- proposed category: **Chat & Communication** — layout primitives for a conversation row.

### API surface (ground truth)

- `Message`: `align?` (`'start'|'end'`, default `'start'` — sets `data-align`, reverses row on end). Server-safe.
- `MessageGroup`/`MessageAvatar`/`MessageContent`/`MessageHeader`/`MessageFooter`: plain `<div>` props, no own variant props. MessageAvatar lifts when a footer is present; MessageHeader/Footer drop inline padding under a `ghost` bubble; MessageFooter justifies end on end-aligned rows.
- States: start vs end alignment; with/without avatar, header, footer; grouped.

### Currently demonstrated

- preview exports: `message` (start+end conversation, avatar, header, footer), `messageGroup` (3 stacked muted bubbles, avatar once), `messageHeaderFooter` (header + footer both sides, "Read" status), `messageActions` (icon-button row in footer; destructive bubble + Retry on failed message), `messageAttachment` (ghost bubble for media, outline bubble for file chip).
- mdx sections present: Installation, Usage, **Anatomy** (lists all 6 parts + Marker), Examples (×5: conversation/group/header-footer/actions/attachments), API Reference, Accessibility, Do/Don't. Strong structure.
- API table status: **only `MessageProps`** documented via AutoTypeTable.

### GAPS

- [API] AutoTypeTable covers **only `MessageProps`** (the single `align` prop). The other 5 exported subcomponents (`MessageGroup`, `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter`) have **no Props rows** — they're plain `<div>` pass-throughs so there's little to table, but the Anatomy list (lines 44-49) is the only place they're enumerated. Acceptable per shadcn norms, but flagged: a reader gets no typed surface for them. Consider noting "all accept standard `div` props."
- [VARIANT] `MessageHeader`/`MessageFooter` ghost-bubble padding-drop behavior (`group-has-data-[variant=ghost]`) is real but never demonstrated (no preview pairs a header/footer with a `ghost` bubble where the padding change is visible). `messageAttachment` uses a ghost bubble but no header/footer on it.
- [MATRIX] none needed — examples cover the meaningful combinations.
- [PROSE] none — a11y correctly notes Message adds no roles, DOM order stays logical, defers conversation semantics to container (`log`/`feed`). Reality matches. Marker link resolves (`marker.mdx` exists).
- [STRUCTURE] none.

### Verdict

- coverage: **High (~85%)**. effort: **S**.
- top 3 fixes: (1) add a one-liner that the layout subcomponents accept standard `div` props (since AutoTypeTable can't); (2) optionally demonstrate header/footer with a ghost bubble to show padding behavior; (3) nothing else material.

---

## bubble

- files: canonical ✓ | test ✓ | mdx (`bubble.mdx`) ✓ | preview ✓
- exports/subcomponents: `Bubble` + `BubbleProps`, `BubbleContent` + `BubbleContentProps`, `BubbleGroup` + `BubbleGroupProps`, `BubbleReactions` + `BubbleReactionsProps`, `bubbleVariants`, `bubbleReactionsVariants`, `BubbleVariant` type (4 components)
- proposed category: **Chat & Communication** — speech-bubble surface inside a Message.

### API surface (ground truth)

- `Bubble`: `variant?` (7 values: `default`/`secondary`/`muted`/`tinted`/`outline`/`ghost`/`destructive`, default `default`), `align?` (`'start'|'end'`, default `'start'`).
- `BubbleContent`: `render?` (Base UI RenderProp — render as `button`/`a` for interactive bubble; gets hover surface + focus-visible ring). Forwards ref.
- `BubbleReactions`: `side?` (`'top'|'bottom'`, default `'bottom'`), `align?` (`'start'|'end'`, default `'end'`). Floating chip with `ring-card` gap.
- `BubbleGroup`: plain div.

### Currently demonstrated

- preview exports: `bubble` (all 7 variants stacked), `bubbleAlignment` (start/end), `bubbleGroup` (3 grouped + 1 reply), `bubbleConversation` (sent/received + reactions chip), `bubbleReactions` (bottom-start / top-end multi / overflow count — exercises both `side` + `align`), `bubbleInteractive` (button quick-replies + link bubble), `bubbleCollapsible` (Collapsible inside), `bubblePopover` (error details popover off reaction chip), `bubbleTooltip` (read-receipt tooltip).
- mdx sections present: Installation, Usage, **Anatomy**, Examples (×8), API Reference (2 AutoTypeTables), Accessibility, Do/Don't. Very rich.
- API table status: `AutoTypeTable name="BubbleProps"` + `AutoTypeTable name="BubbleReactionsProps"` — 2 of 4 component Props types documented.

### GAPS

- [VARIANT] All 7 `variant` values render in the `bubble` preview ✓. `align` both values ✓. `BubbleReactions` `side`×`align` corners ✓. **Complete variant coverage** — no missing CVA value.
- [API] `BubbleContentProps` (carries the `render` prop — the interactive-bubble API) is **not documented via AutoTypeTable**. The `render` prop is shown in examples + Anatomy prose (line 33-34) but absent from the API Reference table. This is the most consequential prop (button/link composition) and lacks a typed row. Also `BubbleGroupProps` undocumented (plain div — minor).
- [MATRIX] none needed — variant grid present.
- [PROSE] none — a11y notes interactive-only-when-actionable, token contrast both themes, presentational reactions need own labels. Reality matches. Previews correctly add `role="img"`/`aria-label` on decorative emoji reactions.
- [STRUCTURE] none.

### Verdict

- coverage: **High (~90%)**. effort: **S**.
- top 3 fixes: (1) add `AutoTypeTable name="BubbleContentProps"` to document the `render` prop (highest value); (2) optionally note `BubbleGroup` accepts div props; (3) nothing else material — this is one of the best-covered pages in the batch.

---

## message-scroller

- files: canonical ✓ | test ✓ | mdx (`message-scroller.mdx`) ✓ | preview ✓
- exports/subcomponents: `MessageScrollerProvider`, `MessageScroller`, `MessageScrollerViewport`, `MessageScrollerContent`, `MessageScrollerItem`, `MessageScrollerButton` + `MessageScrollerButtonProps`, and 3 re-exported hooks (`useMessageScroller`, `useMessageScrollerScrollable`, `useMessageScrollerVisibility`). Built on `@shadcn/react/message-scroller` (the one sanctioned non-Base-UI primitive).
- proposed category: **Chat & Communication** — auto-scrolling conversation viewport engine.

### API surface (ground truth)

- `MessageScrollerProvider`: `autoScroll`, `defaultScrollPosition` (`'start'|'end'|'last-anchor'`), `scrollPreviousItemPeek`, `scrollMargin` (props of the underlying primitive Provider — typed by `React.ComponentProps<typeof Primitive.Provider>`).
- `MessageScrollerItem`: `scrollAnchor` (bool, default false), `messageId` (target for `scrollToMessage`).
- `MessageScrollerButton`: `direction` (`'end'|'start'`, default `'end'`), `variant`/`size` (from ButtonProps, defaults `secondary`/`icon-sm`), `render`. Sets `data-active` (slides in when scrolled away).
- Hooks: `useMessageScroller()` → `scrollToEnd/scrollToStart/scrollToMessage`; `useMessageScrollerScrollable()` → `{start,end}`; `useMessageScrollerVisibility()` → `{currentAnchorId, visibleMessageIds}`.
- States: auto-scroll/pin-to-latest, prepend-preserves-position, anchor tracking, loading-more/streaming (`aria-busy`), button active/inactive.

### Currently demonstrated

- preview exports: `messageScroller` (auto-scroll + send), `messageScrollerCommands` (scrollToMessage via Jump menu), `messageScrollerScrollable` (useScrollable + start/end buttons), `messageScrollerStreaming` (`aria-busy` + shimmer typing bubble + autoScroll follow), `messageScrollerVisibility` (currentAnchorId outline + scrollToMessage).
- mdx sections present: Installation (+ primitive note), Usage, **Anatomy** (all parts + props enumerated + **Hooks** subsection), Examples (×5), API Reference, Accessibility, Do/Don't. Excellent structure.
- API table status: `AutoTypeTable` documents **only `MessageScrollerButtonProps`**.

### GAPS

- [API] AutoTypeTable covers **only `MessageScrollerButtonProps`**. The most important configuration surface — `MessageScrollerProvider` props (`autoScroll`, `defaultScrollPosition`, `scrollPreviousItemPeek`, `scrollMargin`) and `MessageScrollerItemProps` (`scrollAnchor`, `messageId`) — has **no typed table**; they're only described in Anatomy prose (lines 55-69). These types are `React.ComponentProps<typeof Primitive.*>` so AutoTypeTable may not resolve them cleanly (re-exported primitive types), which is likely why prose was used — but the gap is real: a reader gets no typed Provider/Item API. Flag: confirm whether AutoTypeTable can resolve the aliased types; if not, the prose enumeration is the documented surface (acceptable fallback) but should be explicit that it's the full list.
- [VARIANT] `defaultScrollPosition="last-anchor"` is documented (Anatomy line 56) but **never demonstrated** (previews use `end`/`start` only). `scrollPreviousItemPeek` documented but never shown. `MessageScrollerButton` `variant`/`size` overrides not demonstrated (all use defaults).
- [VARIANT] `useMessageScrollerVisibility().visibleMessageIds` is part of the hook return but only `currentAnchorId` is demonstrated (in `messageScrollerVisibility`). `useMessageScroller().scrollToEnd/scrollToStart` direct calls not shown (only `scrollToMessage`); the buttons cover end/start visually though.
- [MATRIX] none needed.
- [PROSE] none — a11y strong (viewport aria-label, sr-only button label, out-of-tab-order while inactive, aria-busy streaming, prefers-reduced-motion). Reality matches; button sr-only label matches test expectation ("Scroll to end").
- [STRUCTURE] none.

### Verdict

- coverage: **High (~85%)**. effort: **M** (API-table resolution for aliased primitive types is the real work).
- top 3 fixes: (1) add typed tables (or explicit confirmation that the Anatomy list is exhaustive) for `MessageScrollerProvider` + `MessageScrollerItem` props — the core config surface; (2) demonstrate `defaultScrollPosition="last-anchor"` and `scrollPreviousItemPeek`; (3) optionally show `visibleMessageIds` and a button `variant`/`size` override.

---

## Cross-batch notes

- **API-table-completeness is the systemic gap**: message, bubble, and message-scroller each document only ONE `*Props` type while exporting 4–6 components/Props types. bubble's missing `BubbleContentProps` (the `render` prop) and message-scroller's missing Provider/Item tables are the highest-value omissions. Where subcomponents are plain `div` pass-throughs (message layout parts, BubbleGroup), a single "accepts standard div props" note suffices.
- **Documented-but-not-demonstrated props** recur: sonner `closeButton`/`expand`/`position`/`toast.message`/`toast.custom`; relative-time `locale`/`tooltipDelay`/live `refresh`; message-scroller `last-anchor`/`scrollPreviousItemPeek`; bubble `render` (shown in examples but not tabled). Each is either a quick preview add or a prose trim.
- **Inherent-determinism tension** (relative-time live refresh, sonner transient toasts): these features can't be shown in a static screenshot. Worth one explicitly-labeled "live" example each rather than leaving the headline behavior undemonstrated.
- No missing pages, no thin previews, no stale prose found. The sonner↔toast naming is intentional and self-documented — not a defect.
