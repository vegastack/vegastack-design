# @vegastack/ui

## 0.23.42

### Patch Changes

- [#341](https://github.com/vegastack/vegastack-design/pull/341) [`74adb14`](https://github.com/vegastack/vegastack-design/commit/74adb1451e5fd6e14ddc7025251e08dbb82ceab8) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 One list toolbar for every list page. `FilterBar`'s filter row is hidden by default and never opens by itself when a filter becomes set — the Filters toggle shows it and carries the applied count meanwhile; `autoOpenFilters` opts back in, and `filtersOpenStorageKey` remembers the toggle per page for the browser session. Row 1 is the search taking the free space, then the Filters toggle, then the `view` switch at the far end. On a tablet-width bar (below `@3xl`) the Filters toggle and the view go icon-only, with the count as a badge; below `@lg` the search takes its own row and the icon-only toggle and view share the next one, start and end. `PageHeader` drops the `view` slot (and `page-header-view`) added in 0.7.42: the layout switch belongs only in the `FilterBar`'s `view`, and the header's `tabs` hold the scope. `list-page-01` moves its Grid | List switch into the toolbar and uses the bar's "Clear". Docs: FilterBar gains a Breakpoints example, and the PageHeader "View tabs", DataList "View toggle" and list-page-01 pages show the layout.

## 0.23.41

### Patch Changes

- [#339](https://github.com/vegastack/vegastack-design/pull/339) [`fe030ca`](https://github.com/vegastack/vegastack-design/commit/fe030ca5e15e240103d9e669314812f74431c44e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `RecordChip` gains `variant="ghost"` for property values: no border and no fill, the value in plain body text (the same size, weight and colour as a plain `PropertyValue`), the standard tint on hover and keyboard focus, and a ▾ that fades in then and stays while the menu is open. A status or priority icon keeps its colour, and any other leading icon is dropped. A new `person` prop shows a 20px avatar (initials fallback) and an "Inactive"-style badge. A `DueLabel` value keeps its overdue colour, and an empty chip shows the muted placeholder. `PropertyValue` hangs a ghost chip's padding and 28px height outside the cell, so its text starts where plain values do and every row is the same height. `SplitChip`'s name segment drops the button's transparent border, so its hover background sits the same 2px from the pill's border as the ↗ segment's on every side and around the separator. `PropertyPerson`'s avatar is 20px, matching the ghost chip. Date labels lose `tabular-nums` (`BoardCard`'s due badge, `MediaCard`'s timestamp), so dates use Geist's proportional figures everywhere, and tabular figures stay only on live timers. Docs: the RecordChip and PropertyList pages and the issue-detail-01 block show both variants and every state.

## 0.23.40

### Patch Changes

- [#335](https://github.com/vegastack/vegastack-design/pull/335) [`5674880`](https://github.com/vegastack/vegastack-design/commit/5674880da439732cf937680ae6341e761613d378) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Comments: each posted comment sits in its own card (the composer's `bg-muted/30` surface, `border-border`, `rounded-xl`), and so do the deleted placeholder and edit mode; the border never changes on hover or focus. The add-reaction and ⋯ buttons are identical ghost `icon-sm` buttons at the card's top-right, both shown on hover or focus-within (kept while their popup is open, always on touch). The ⋯ menu is sized to its content with muted Link, Pencil and destructive Trash2 icons. `ReactionAdd` gains a `size` prop (`icon-xs` default, `icon-sm`).

- [#335](https://github.com/vegastack/vegastack-design/pull/335) [`5674880`](https://github.com/vegastack/vegastack-design/commit/5674880da439732cf937680ae6341e761613d378) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 A border never changes colour on focus or while active (FOC-14). Every control keeps its resting `border-border`/`border-input` in every state, and the focus cue is `base.css`'s background tint everywhere — text entry included. A bordered field group (`InputGroup`, `NumberField`, `ChipInput`, `ComboboxChips`, `PanelSearch`, now all `data-field-group`) wears the tint on the group; `TextEdit` stays caret-only, and the comment composer box no longer re-borders when active. `Input`, `Textarea`, `NativeSelect`, `Select`, `Combobox`, `InputOTP` (the active slot takes the tint), `Questionnaire`, `DatePicker` and `SearchableSelect` ghost triggers, and `MediaPlayerControls`' seek thumb lose their focus border; the ghost `Select` no longer re-borders while open. The invalid state keeps its destructive border in every state, focused or not (the `not-focus:` guards are gone from `Button`, `Badge`, `Toggle`, `Checkbox`, `RadioGroup`, `Switch` and the fields). `design-lint` gains `no-focus-border`, and the geometry focus sweep fails any control whose border colour moves on focus.

- Updated dependencies [[`5674880`](https://github.com/vegastack/vegastack-design/commit/5674880da439732cf937680ae6341e761613d378)]:
  - @vegastack/design@0.7.46
  - @vegastack/design-tokens@0.7.46

## 0.23.39

### Patch Changes

- Updated dependencies [[`1100891`](https://github.com/vegastack/vegastack-design/commit/11008911198cffda80bcd7da0bed7aaf87a3b2ec)]:
  - @vegastack/design-tokens@0.7.45
  - @vegastack/design@0.7.45

## 0.23.38

### Patch Changes

- [#333](https://github.com/vegastack/vegastack-design/pull/333) [`43e36b5`](https://github.com/vegastack/vegastack-design/commit/43e36b5214c3bd902d3aeb79ac24e11e87c48e18) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Notion-grade `TextEdit`. The editor has no fill in any state (the caret is the focus cue, `data-focus-cue="caret"`) and never widens the page — long words, URLs and inline code wrap, code blocks and tables scroll in their own box (`prose` gains `min-w-0 wrap-anywhere`). Every menu floats in a `<body>` portal and flips to stay in view, so no container clips it. The slash menu adds Heading 4, Table and Image (URL and alt text); the bubble menu adds Turn into, Clear formatting and Open / Remove on links; code blocks get a language selector. GFM tables get a table menu (insert, move, delete rows and columns), drag grips to reorder columns and rows, and Tab / Shift+Tab between cells. A ⋮⋮ block handle drags any block or list item (`dragHandles`, on by default), and ⌘⇧↑ / ⌘⇧↓ move the caret's block. New shortcuts: ⇧⌘X strikethrough. Image-only paragraphs now round-trip. `RelativeTime` defaults to the compact house form everywhere — "now", "19m ago", "3h ago", "2d ago", "3w ago", "5mo ago", "1y ago" — with `format` choosing `suffix` (default), `minimal` or `long`; the Intl short style with periods ("19 min. ago") is gone and `unitStyle` is deprecated. Comments: a lighter composer and edit box (`bg-muted/30`, hairline border), "Add a comment…" as the default placeholder, auto-grow to about twelve lines, a legible disabled send button, and no drag handles.

- Updated dependencies [[`43e36b5`](https://github.com/vegastack/vegastack-design/commit/43e36b5214c3bd902d3aeb79ac24e11e87c48e18)]:
  - @vegastack/design@0.7.44

## 0.23.37

### Patch Changes

- [#330](https://github.com/vegastack/vegastack-design/pull/330) [`a7e0e2b`](https://github.com/vegastack/vegastack-design/commit/a7e0e2b014bb7fec0b75b6ce7ab18a542f104beb) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Emoji reactions. New `Reactions` (pills with counts that toggle, a hover card naming who reacted, an add button with quick reactions 👍 ❤️ 😄 🎉 👀 🙏) and `toggleReaction` for optimistic updates. `CommentItem` and `CommentList` take `onReactionToggle` and read each comment's `reactions`; the add button joins the hover actions. `EmojiPicker` gains a quick row, a category bar, a Recent section, `size="sm"`, a skeleton and a DS empty state, and loads its data lazily from the new `emoji-data` lib (`EMOJI` moved there).

## 0.23.36

### Patch Changes

- [#328](https://github.com/vegastack/vegastack-design/pull/328) [`ec9fb47`](https://github.com/vegastack/vegastack-design/commit/ec9fb477d0eb18722bca9a2521c00cb5b6b2e112) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 The `date-time` lib's module doc now reaches consumers: `shadcn add` drops every comment before a file's first statement, so the doc moves below `DateInput`. The code is unchanged.

## 0.23.35

### Patch Changes

- [#325](https://github.com/vegastack/vegastack-design/pull/325) [`3c3b145`](https://github.com/vegastack/vegastack-design/commit/3c3b1458b1bad6062d15fb2b3dc578c1d271fb05) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Every empty list, grid, table and board lane renders the design-system `Empty` with an icon: an Inbox icon and "Nothing here" by default. Change the copy with the new `empty` prop (`{ icon, title, description, action }`) on DataList, on a DataList section and on a Board column; `emptyState` still replaces it outright, and the new `DataListEmptyState` is the same state outside a DataList. `NoResultsEmpty` takes an `icon`. Board lanes keep their `columnWidth` however many lanes are collapsed, instead of stretching into the space a collapsed lane frees. `base.css` renders text-entry controls at 16px or more on touch pointers so iOS Safari never zooms into a focused field; the install docs and consume guide add the viewport's `maximumScale: 1`.

- [#326](https://github.com/vegastack/vegastack-design/pull/326) [`aeb7442`](https://github.com/vegastack/vegastack-design/commit/aeb7442e885751af210e6a536a8054fed987fc55) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 TextEdit's markdown output is clean: blank lines typed with Enter no longer serialize as `&nbsp;` between extra blank lines — empty paragraphs collapse, so paragraphs are separated by one blank line and the output reloads to itself. Blank lines inside fenced code are kept. Input no longer exports `inputVariants` (nothing used it, and its fixed heights broke the data-table squeeze census).

- Updated dependencies [[`3c3b145`](https://github.com/vegastack/vegastack-design/commit/3c3b1458b1bad6062d15fb2b3dc578c1d271fb05)]:
  - @vegastack/design@0.7.43
  - @vegastack/design-tokens@0.7.43

## 0.23.34

### Patch Changes

- [#323](https://github.com/vegastack/vegastack-design/pull/323) [`efb06cc`](https://github.com/vegastack/vegastack-design/commit/efb06cc88aeacf169cba1b85749eb87f8da8d02e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Editing a comment uses the composer's compact box with icon buttons: a round ↑ Save (disabled while the text is empty or unchanged) and a ghost × Cancel, each with a tooltip; Cmd/Ctrl+Enter saves and Escape cancels. TextEdit's tests now cover every markdown element's round-trip (headings, strike, inline code, code blocks, quotes, dividers, task and nested lists, blank lines), commit on blur and unmount, Escape revert, autosave, slash-menu keys, undo/redo, paste and bubble-menu links.

## 0.23.33

### Patch Changes

- [#320](https://github.com/vegastack/vegastack-design/pull/320) [`2bf27bf`](https://github.com/vegastack/vegastack-design/commit/2bf27bfc0b516ba041c681462d3db4e441a312fb) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 PageHeader gains `tabs` and `view` slots: a list page's view tabs sit on their own row directly under the title, with the layout switch (`ViewToggle`) pinned to that row's end. The list-page-01 block moves its Mine | Team scope (now default `Tabs`) and Grid | List toggle there, out of the FilterBar.

- Updated dependencies [[`2bf27bf`](https://github.com/vegastack/vegastack-design/commit/2bf27bfc0b516ba041c681462d3db4e441a312fb)]:
  - @vegastack/design@0.7.42

## 0.23.32

### Patch Changes

- [#318](https://github.com/vegastack/vegastack-design/pull/318) [`41c25fe`](https://github.com/vegastack/vegastack-design/commit/41c25fecf0139618385feb57c7b1a3e267dd9ecb) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Comments go Linear style: `CommentComposer` is a soft filled box with a round ↑ send button (Cmd/Ctrl+Enter sends), an `attachments` slot and no avatar (`author` is gone); `CommentList` gets an Oldest / Newest first toggle (`order`, `onOrderChange`) and an empty state whose "Add a comment" reveals and focuses the composer; editing a comment uses a compact box with Cancel and Save. New block `issue-detail-01`: a Linear-style issue page composed of the real components.

- [#319](https://github.com/vegastack/vegastack-design/pull/319) [`9ae6bb2`](https://github.com/vegastack/vegastack-design/commit/9ae6bb291d0f8864966c94aad0ff4faca491be1b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 TextEdit has no toolbar: type `/` for a slash menu (headings, lists, task list, quote, code block, divider, link) and select text for a bubble menu (bold, italic, strikethrough, inline code, link). `slashCommands` limits the menu — `TEXT_EDIT_SLASH_COMMANDS` is the full set, `TEXT_EDIT_COMPACT_SLASH_COMMANDS` the comment-sized one. Hover and focus tint the surface, and every change leaves through one `onCommit` path; the `toolbar`, `variant`, `onSave`, `onCancel`, `saveLabel` and `cancelLabel` props are removed. Blank lines round-trip in markdown. Input gains `variant="ghost"` (borderless, tinted on hover and focus) and `size="lg"` (heading type) for a title field, and `InputGroupInput` accepts Input's props. EditableCell `variant="heading"` has no box padding, so a title is edited exactly where it renders. PropertyRow top-aligns its label on the value's first line. Prose list markers inherit the item's colour and use proportional figures, so lists read exactly like body text.

- Updated dependencies [[`41c25fe`](https://github.com/vegastack/vegastack-design/commit/41c25fecf0139618385feb57c7b1a3e267dd9ecb), [`9ae6bb2`](https://github.com/vegastack/vegastack-design/commit/9ae6bb291d0f8864966c94aad0ff4faca491be1b)]:
  - @vegastack/design@0.7.41

## 0.23.31

### Patch Changes

- [#317](https://github.com/vegastack/vegastack-design/pull/317) [`8e5f523`](https://github.com/vegastack/vegastack-design/commit/8e5f523c22d20aba56a813256ecc1d2055fa2824) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Dates and times (RelativeTime, DateTime, DueLabel, Duration) render in the body font with proportional figures, like the text around them, instead of tabular figures that read as monospace. Live timers keep tabular figures.

- [#315](https://github.com/vegastack/vegastack-design/pull/315) [`3da5a55`](https://github.com/vegastack/vegastack-design/commit/3da5a558c7d7364cb357b16c43a96104a1c99053) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 TextEdit is Notion-style: no border, ground or focus ring, and no view mode — it rests looking exactly like `MarkdownView`; click anywhere and type. The Save/Cancel buttons are gone: leaving the editor calls the new `onCommit(value)` when the document changed, Escape reverts and calls `onRevert()`, Cmd/Ctrl+Enter calls `onSubmit` (or commits), and `autosave` commits after an idle gap. The formatting toolbar is a compact row under the text, shown only while focused (minimal included). `onSave`/`onCancel` still work as aliases; `variant`, `saveLabel` and `cancelLabel` are ignored. The `prose` recipe is now the app's body text: `text-sm`, body family and `foreground` ink for paragraphs, lists, list markers, links, quotes and table cells (no relaxed leading, no muted markers), headings on the app scale (`#` text-lg, `##` text-base, the rest body size, all `font-heading`), and only inline code and code blocks in mono — identical in MarkdownView and TextEdit.

- [#314](https://github.com/vegastack/vegastack-design/pull/314) [`384ff99`](https://github.com/vegastack/vegastack-design/commit/384ff993de899ae0f168500794bc8323e2980303) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Toasts are tighter: 12px padding (was 16px), 10px between the icon, text and actions (was 12px), and 2px between title and description (was 4px). Close and action buttons are unchanged.

- Updated dependencies [[`3da5a55`](https://github.com/vegastack/vegastack-design/commit/3da5a558c7d7364cb357b16c43a96104a1c99053)]:
  - @vegastack/design@0.7.40

## 0.23.30

### Patch Changes

- [#309](https://github.com/vegastack/vegastack-design/pull/309) [`cc7d5ba`](https://github.com/vegastack/vegastack-design/commit/cc7d5ba97f7a65b31b9424db1d1b88bd93fc506c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Comments: `CommentList` (heading with a count, Load earlier, skeleton, "No comments yet"), `CommentItem` (avatar, name and badge, relative time, "edited", ⋯ Copy link / Edit / Delete, in-place Markdown editing, `#comment-<id>` highlight, a replies slot) and `CommentComposer` (avatar and a minimal Markdown editor; Cmd/Ctrl+Enter or Comment posts, with posting and error states).

- Updated dependencies [[`cc7d5ba`](https://github.com/vegastack/vegastack-design/commit/cc7d5ba97f7a65b31b9424db1d1b88bd93fc506c)]:
  - @vegastack/design@0.7.39

## 0.23.29

### Patch Changes

- [#304](https://github.com/vegastack/vegastack-design/pull/304) [`ffa5257`](https://github.com/vegastack/vegastack-design/commit/ffa5257f1da13a020e6f41bbdc5c19a365e42883) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Toast actions close their toast: clicking the action (e.g. "Undo") runs it and dismisses the toast; `data: { keepOpen: true }` opts out. Tooltips open after 250ms everywhere (`TIMINGS.tooltipOpenDelayMs`, was 300), and RelativeTime's date tooltips now use that shared delay instead of opening instantly.

- Updated dependencies [[`ffa5257`](https://github.com/vegastack/vegastack-design/commit/ffa5257f1da13a020e6f41bbdc5c19a365e42883)]:
  - @vegastack/design@0.7.38

## 0.23.28

### Patch Changes

- Updated dependencies [[`4781f95`](https://github.com/vegastack/vegastack-design/commit/4781f95e6a9231c99b238aca7fd048deb2b7233b)]:
  - @vegastack/design@0.7.37

## 0.23.27

### Patch Changes

- Updated dependencies [[`8334813`](https://github.com/vegastack/vegastack-design/commit/8334813fbe7e046bb1ca3c678f49f3d8db347d8e)]:
  - @vegastack/design@0.7.36

## 0.23.26

### Patch Changes

- Updated dependencies [[`7fafdc5`](https://github.com/vegastack/vegastack-design/commit/7fafdc5505cc39c51b68874fcb6452a957123c48)]:
  - @vegastack/design@0.7.35

## 0.23.25

### Patch Changes

- Updated dependencies [[`4e40109`](https://github.com/vegastack/vegastack-design/commit/4e40109e4d758447efd865f9c415eea8c477a685), [`98045ec`](https://github.com/vegastack/vegastack-design/commit/98045ec0bdacbaf49e10d5bd8752361e0960e72c)]:
  - @vegastack/design@0.7.34

## 0.23.24

### Patch Changes

- [#296](https://github.com/vegastack/vegastack-design/pull/296) [`7d9d485`](https://github.com/vegastack/vegastack-design/commit/7d9d4855470cb4a36c213ea9bdca6429d52404bd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 No focus rings anywhere, Tabs included (FOC-13): tab triggers and panels take the same background tint as everything else, and clicking a tab shows nothing. Every clear and dismiss × (FilterBar facet and date clear, Chip remove, SearchableSelect, Combobox and DatePicker clear, Dialog and Sheet close) opts out of Button's press nudge and centres with inset and auto margins, so it never jumps when pressed. Transcript: the search field is capped at `max-w-sm`, the speaker name in each turn is an inline `EditableCell` when `onSpeakerRename` is set (a rename applies to every turn with that speaker), and `TranscriptSpeakers` is deprecated. Empty's icon tile is 40px with a 20px icon (32px / 16px at `size="sm"`), and the tile sizes any icon passed in.

- Updated dependencies [[`12744e2`](https://github.com/vegastack/vegastack-design/commit/12744e22a4f2841fd633a17301b7eb0679b52864), [`7d9d485`](https://github.com/vegastack/vegastack-design/commit/7d9d4855470cb4a36c213ea9bdca6429d52404bd)]:
  - @vegastack/design@0.7.33
  - @vegastack/design-tokens@0.7.33

## 0.23.23

### Patch Changes

- [#284](https://github.com/vegastack/vegastack-design/pull/284) [`c6920d0`](https://github.com/vegastack/vegastack-design/commit/c6920d047a16e4d7647fa12ae40c4532885c34a3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Markdown view and edit share one typography: `TextEdit` gains `toolbar` levels (minimal/standard/full or an action array) that set the schema, a selection bubble menu, a link popover (⌘K), task lists, tables, code blocks and images, markdown paste, `onSave`/`onCancel` (⌘Enter/Esc) with toolbar Save/Cancel, optional `autosave`, a borderless `ghost` variant and a zero-shift placeholder; `MarkdownView` task items take the same DOM through the new `prose.taskList` rules. New Markdown guide shows every element in view and edit.

- [#289](https://github.com/vegastack/vegastack-design/pull/289) [`e706cd9`](https://github.com/vegastack/vegastack-design/commit/e706cd97beb94bea37c1ea0cd709de4ebf8659ae) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Combobox's clear and chip-remove × no longer move when pressed (API-31). RecordLayout gains `RecordLayoutPanels`, `RecordTabCount` and `RecordLayoutMainSkeleton`; RecordChip gains `RecordChipMenu`, the flush picker popover a pill opens. RecordLayout picks the rail from its own width (container query, `useRecordLayoutWide`) and gains `RecordTabsRow` / `RecordTabsActions`.

- [#293](https://github.com/vegastack/vegastack-design/pull/293) [`78d1263`](https://github.com/vegastack/vegastack-design/commit/78d1263220b9c48315269b7f97811e7106d986af) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Toolbar switches use the default Tabs. `ViewToggle` now renders the default (pill) `Tabs` (at the bar's h-8 tier, which FilterBar also lifts a `TabsList size="sm"` scope to) instead of an outline `ToggleGroup`, keeping its icons (List, `Columns3` for Board, LayoutGrid) with labels hidden on a phone. The `FilterBar` `scope` and `view` slot guidance, the FilterBar, ViewToggle and DataList docs, and the skill now say every scope or view switch in a table or list toolbar is a default `Tabs`, never a `ToggleGroup` or line tabs.

- Updated dependencies [[`c6920d0`](https://github.com/vegastack/vegastack-design/commit/c6920d047a16e4d7647fa12ae40c4532885c34a3), [`e706cd9`](https://github.com/vegastack/vegastack-design/commit/e706cd97beb94bea37c1ea0cd709de4ebf8659ae), [`78d1263`](https://github.com/vegastack/vegastack-design/commit/78d1263220b9c48315269b7f97811e7106d986af)]:
  - @vegastack/design@0.7.32

## 0.23.22

### Patch Changes

- [#295](https://github.com/vegastack/vegastack-design/pull/295) [`f2d4304`](https://github.com/vegastack/vegastack-design/commit/f2d430440e8e854e3cdbc547c97ac3bf7525f52e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `EditableCell` keyboard focus shows only the system focus tint (FOC-13), the same as hover: no focus ring or outline. The 0.7.30 changelog entry now describes the shared box correctly (the text sizes the box and the field is laid over it).

- [#292](https://github.com/vegastack/vegastack-design/pull/292) [`fae1529`](https://github.com/vegastack/vegastack-design/commit/fae15291746a7f1fa205b6d67085ec548b10b9e2) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 SettingsSection takes `actions`, right-aligned on the title's row. Row ⋯ menus (RowActionsMenu) are at least 192px and as wide as their longest item, so labels never wrap, and a disabled item's `disabledReason` is a tooltip on the item (still its accessible description) instead of a wrapped second line.

- Updated dependencies [[`f2d4304`](https://github.com/vegastack/vegastack-design/commit/f2d430440e8e854e3cdbc547c97ac3bf7525f52e), [`fae1529`](https://github.com/vegastack/vegastack-design/commit/fae15291746a7f1fa205b6d67085ec548b10b9e2)]:
  - @vegastack/design@0.7.31

## 0.23.21

### Patch Changes

- [#283](https://github.com/vegastack/vegastack-design/pull/283) [`50f37dd`](https://github.com/vegastack/vegastack-design/commit/50f37ddfb0a460193ed708abdabd6b81fd21a2f7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Inline edit rework. `EditableCell`'s edit mode now looks like its view: no border, ring or background, and the field inherits font, size, weight, line height, tracking and colour, so only the caret and the selection show it is editing. The display and the field share one box (the text sizes the box and the field is laid over it), so the field grows with its content, wraps when the value wraps and nothing shifts entering or leaving edit. New props: `onSave` (the promise API; `onCommit` still works), `variant` (`inline` · `cell` fills a table cell and lets clicks beside the text reach the row link · `heading` keeps the title's size and weight and wraps), `multiline` (⌘/Ctrl+Enter saves), `required` + `requiredMessage`, `onNavigate` (Enter or Tab saves and moves on), `tooltip` and `saveErrorToast`. Saves are optimistic, the trailing spinner shows only after 300ms, and a failure rolls back, is announced and raises a toast with Retry. Read mode is a button labelled `Edit {label}`; F2 starts editing. `useInlineEdit` gains `multiline` and ignores keys during IME composition.

- Updated dependencies [[`50f37dd`](https://github.com/vegastack/vegastack-design/commit/50f37ddfb0a460193ed708abdabd6b81fd21a2f7)]:
  - @vegastack/design@0.7.30

## 0.23.20

### Patch Changes

- [#287](https://github.com/vegastack/vegastack-design/pull/287) [`1ccbcee`](https://github.com/vegastack/vegastack-design/commit/1ccbcee028dc6351861892d37d445b81970b64f8) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 AvatarStack: truly stacked 24px avatars (overlapping, background ring, "+N") as one button that lists everyone, with a hover preview per avatar; PersonCard never truncates. RecordChip: `placeholder={null}` shows the icon alone, and the chevron sits as far from the divider as the ↗ does. Clear and remove × controls (DatePicker, SearchableSelect, FilterBar, Chip, SearchInput, AnnouncementBanner, RecordAsideAction) no longer move when pressed: the absolutely centred ones used `-translate-y-1/2`, which Button's press nudge replaced.

- Updated dependencies [[`1ccbcee`](https://github.com/vegastack/vegastack-design/commit/1ccbcee028dc6351861892d37d445b81970b64f8)]:
  - @vegastack/design@0.7.29

## 0.23.19

### Patch Changes

- [#277](https://github.com/vegastack/vegastack-design/pull/277) [`e2ef1fc`](https://github.com/vegastack/vegastack-design/commit/e2ef1fc45aab188dfdc7d658f7fc12823cc44a41) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 PersonHoverCard: `AvatarStack` (stacked avatars, max 5, the rest behind "+N" as rows), `PersonHoverCard` (hover, focus or tap: a compact 240px card, a 32px avatar with the name and muted email stacked beside it), `PersonCard` and `PersonAvatar`; people without an account show initials and the name. Card gains `variant="outline"` (a border, no fill; API-30). RecordAside cards are outline, the inline PropertyList has a fixed 112px label column with values left-aligned, and the rail has layout-matching skeletons. Stat gains `StatSkeleton`.

- [#277](https://github.com/vegastack/vegastack-design/pull/277) [`e2ef1fc`](https://github.com/vegastack/vegastack-design/commit/e2ef1fc45aab188dfdc7d658f7fc12823cc44a41) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 RecordAside: the record rail's cards — `RecordAsideCard`, `RecordAsideSection` (title, count, a tooltip icon action), full-width `ActionList` rows on Item (edge to edge, hover tint, no underline) with a one-line `ActionListEmpty`, and `PropertyPerson`, `PropertyPeople` (+N) and `PropertyClamp` (Show more). PropertyList gains `variant="inline"`, `PropertyEmpty` and `PropertySection`. People icons are the round lucide set (UserRound, UsersRound, CircleUserRound).

- Updated dependencies [[`e2ef1fc`](https://github.com/vegastack/vegastack-design/commit/e2ef1fc45aab188dfdc7d658f7fc12823cc44a41), [`e2ef1fc`](https://github.com/vegastack/vegastack-design/commit/e2ef1fc45aab188dfdc7d658f7fc12823cc44a41), [`2c9582f`](https://github.com/vegastack/vegastack-design/commit/2c9582f887c14a0d389346e13002f76cadaa3b80), [`c6ea931`](https://github.com/vegastack/vegastack-design/commit/c6ea931d7dd81bceacc0cb0bea1c9898e26fb69f)]:
  - @vegastack/design@0.7.28

## 0.23.18

### Patch Changes

- Updated dependencies [[`cccb347`](https://github.com/vegastack/vegastack-design/commit/cccb347a2f7394bd35956d0557f9b57f0b042a15)]:
  - @vegastack/design@0.7.27

## 0.23.17

### Patch Changes

- [#268](https://github.com/vegastack/vegastack-design/pull/268) [`3f83fa2`](https://github.com/vegastack/vegastack-design/commit/3f83fa2923080d8c21bcb9e73df29797d45a3446) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Board redesign and the new `BoardCard`. `Board` lanes now fill the viewport below the board (`height="fill"`, cards scroll inside each 320px lane, the page never scrolls), with sticky headers, a ⋯ menu that collapses a lane to a slim strip (`collapsible`, `collapsedColumns`, `onCollapsedChange`, `getColumnActions`), "+ Add" at each lane's foot (`onAdd`, `addLabel`, per-lane `addable`), dashed "Nothing here" / "Drop here" empty zones, per-lane skeletons and load-on-scroll paging with `LoadMore` as the fallback, a hidden-scrollbar board with edge fades, and one lane at a time with a lane strip on a phone. Dragging is live (`usePointerDrag` in `use-drag-reorder`): the card lifts with a shadow and tilt, other cards make room and it settles; touch picks up on a 250ms long-press; lanes and the board auto-scroll; the keyboard picks up with Space, moves with the arrows, drops with Space and cancels with Escape. Moves are optimistic and a rejected `onMove` snaps back with a toast (`moveErrorToast`); `readOnly` turns moves off. New `BoardCard`: a round done tick, a two-line title, a context line, due and priority chips and the assignee's avatar. `DataList`'s board view renders `BoardCard`s (`boardCard`) and passes `onAddToSection`, `addLabel`, `collapsedSections`, `onCollapsedSectionsChange` and `boardHeight` through, with section `defaultCollapsed`, `droppable`, `lockedReason` and `addable`. `RowAction` items take `items` for a submenu. The `list-page-01` and `board-01` blocks now use a `FilterBar` toolbar over `DataList` views.

- Updated dependencies [[`3f83fa2`](https://github.com/vegastack/vegastack-design/commit/3f83fa2923080d8c21bcb9e73df29797d45a3446)]:
  - @vegastack/design@0.7.26

## 0.23.16

### Patch Changes

- [#274](https://github.com/vegastack/vegastack-design/pull/274) [`8d8eb5b`](https://github.com/vegastack/vegastack-design/commit/8d8eb5b64b70fd8cd90cbb3cec37c33570d530a0) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 StatusIcon and PriorityIcon keep their semantic colour on hover, focus and highlight inside dropdown, context-menu, menubar, select, combobox, command, sidebar, navigation-menu, toggle, button and item rows: both icons carry `data-icon-tone`, and the rows' muted-icon default and state recolours skip it. Add `data-icon-tone` to any other semantic-coloured icon to get the same behaviour.

- Updated dependencies [[`8d8eb5b`](https://github.com/vegastack/vegastack-design/commit/8d8eb5b64b70fd8cd90cbb3cec37c33570d530a0)]:
  - @vegastack/design@0.7.25

## 0.23.15

### Patch Changes

- [#273](https://github.com/vegastack/vegastack-design/pull/273) [`12ba8d9`](https://github.com/vegastack/vegastack-design/commit/12ba8d9373c59dd01c08065617f0cd0500e6c150) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 RecordChip: the picker and the ↗ link now sit inside one shared `p-0.5` inset, both 24px tall and rounded-full, so their hover and open backgrounds keep the same gap from the pill's border on every side (the pill grows from 28px to 30px). The shell is exported as `SplitChip` with `SplitChipButton`, `SplitChipSeparator` and `splitChipIconActionClassName` for any main-action-plus-icon-action pill; documented under Record Chip.

- [#272](https://github.com/vegastack/vegastack-design/pull/272) [`6ae4f3a`](https://github.com/vegastack/vegastack-design/commit/6ae4f3a758f6594b0eec7b4cb9fa4ff1ada5a128) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 RecordLayout: a record page's main column beside a sticky 320px right rail of cards (from `lg` up, scrolling on its own), with `RecordDetailsSheet` — a ghost ⓘ button that opens the details in a Sheet from the right — in its place on small screens.

- Updated dependencies [[`12ba8d9`](https://github.com/vegastack/vegastack-design/commit/12ba8d9373c59dd01c08065617f0cd0500e6c150), [`6ae4f3a`](https://github.com/vegastack/vegastack-design/commit/6ae4f3a758f6594b0eec7b4cb9fa4ff1ada5a128)]:
  - @vegastack/design@0.7.24

## 0.23.14

### Patch Changes

- [#270](https://github.com/vegastack/vegastack-design/pull/270) [`49ce48f`](https://github.com/vegastack/vegastack-design/commit/49ce48fa6a1d92bf8d10d0327ecce67a132c1bc7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 FieldDescription `variant="footnote"`: a centred 12px muted line with a small gap above, the documented footer style for login-01 and the sign-up, forgot password and set password variants.

- Updated dependencies [[`49ce48f`](https://github.com/vegastack/vegastack-design/commit/49ce48fa6a1d92bf8d10d0327ecce67a132c1bc7)]:
  - @vegastack/design@0.7.23

## 0.23.13

### Patch Changes

- [#265](https://github.com/vegastack/vegastack-design/pull/265) [`e42fe8c`](https://github.com/vegastack/vegastack-design/commit/e42fe8c5b956fb46fd3cbe36da5070de2405a667) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Inbox: infinite scroll — `onLoadMore` / `hasMore` / `loadingMore` (and `loadMoreError`, `endLabel`) page through an IntersectionObserver sentinel, show three skeleton rows while a page loads (no spinner), a ghost "Try again" after a failure and "You’re all caught up" at the end (15 rows a page). Day-group labels drop their dividers and stick within the scroll area with 16px above (not on the first group) and 6px below; rows keep a 1px divider between them only. Titles are regular weight — foreground when unread, muted once read — with the actor and record in medium. The row ⋯ menu sizes to its content (224–320px). notifications-01 uses the new API in place of LoadMore, names its row item "Mute this type" (tooltip "Stop notifications like this") and demonstrates the loading, error and end states.

- [#264](https://github.com/vegastack/vegastack-design/pull/264) [`248dd90`](https://github.com/vegastack/vegastack-design/commit/248dd90189ced5f313c316460ee377c16fe68b2e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 StatusIcon gains `cancelled` (CircleX, muted) and a static `progress` (CircleDashed; `animated` keeps the spinning Loader), `blocked` becomes CircleSlash in the warning ink and `done` a filled CircleCheck; new `PriorityIcon` (urgent / high / medium / low / none flags in semantic colours); docs recipes for a Status menu and Priority menu (DropdownMenu + icons + shortcuts O/P/B/D/C and 1/2/3/4/0, Alt-click for quick Done) and icons leading Select/Combobox options.

- Updated dependencies [[`e42fe8c`](https://github.com/vegastack/vegastack-design/commit/e42fe8c5b956fb46fd3cbe36da5070de2405a667), [`248dd90`](https://github.com/vegastack/vegastack-design/commit/248dd90189ced5f313c316460ee377c16fe68b2e)]:
  - @vegastack/design@0.7.22

## 0.23.12

### Patch Changes

- [#262](https://github.com/vegastack/vegastack-design/pull/262) [`adce170`](https://github.com/vegastack/vegastack-design/commit/adce17090e8d8025c60e2051bf8fae7beb737821) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 SearchableSelect (and so FilterBarFacet): a remote search that is `loading` with no rows yet shows five Skeleton rows the height of real options (two lines with `itemToSecondaryLabel`) instead of a blank panel; with rows already shown they stay and a small spinner marks the fetch.

- Updated dependencies [[`adce170`](https://github.com/vegastack/vegastack-design/commit/adce17090e8d8025c60e2051bf8fae7beb737821)]:
  - @vegastack/design@0.7.21

## 0.23.11

### Patch Changes

- [#260](https://github.com/vegastack/vegastack-design/pull/260) [`08196ae`](https://github.com/vegastack/vegastack-design/commit/08196aeb64a1ff8fcfbc85dbfcb99fe812d86d35) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 DataList views: `view` is `"list"`, `"grid"` or `"board"` over the same items, sections, sort, filters, paging, loading, empty and no-results states. The grid renders a MediaCard per row (sections as "Label · n" headings over a 1/2/3-column container grid, `gridSize="lg"` for a 16:9 image, `renderCard` to override); the board renders sections as Board lanes with `onMove(row, from, to)` and a per-section `loading`/`loadMore`/`emptyState`. `onViewChange` mounts the new ViewToggle (Grid | List | Board, labels hidden on a phone) in the FilterBar `view` slot and remembers the view for the session; `views` picks the offered views. Columns take a `thumbnail` (32px Thumbnail with `thumbnailFallback`). New MediaCard (whole-card link, 48px thumbnail, meta, badge, timestamp, ⋯ on hover/focus/touch, `lg` size), Thumbnail (32/48px, cover-fit, fallback) and ViewToggle; RowAction entries can be `{ type: "separator" }` between groups (and an item can take `separatorBefore`), in row, grid-card and board-card menus; the Badge page documents the warning pill.

- Updated dependencies [[`08196ae`](https://github.com/vegastack/vegastack-design/commit/08196aeb64a1ff8fcfbc85dbfcb99fe812d86d35)]:
  - @vegastack/design@0.7.20

## 0.23.10

### Patch Changes

- [#258](https://github.com/vegastack/vegastack-design/pull/258) [`ffbf133`](https://github.com/vegastack/vegastack-design/commit/ffbf1337bff1a8de29b8d977b77b8d2e4c3c935b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Meeting page parts: AudioPlayer gains `variant="floating"` (a centred pill) and a global player — `AudioPlayerProvider`, `GlobalAudioPlayer`, `useGlobalPlayer` and `useGlobalPlayerTime` — that keeps one recording playing across routes with a title link back; Transcript turns show time, a coloured speaker dot and the name above full-width text, `TranscriptSpeakers` adds speaker chips with rename (`onSpeakerRename`), and long transcripts mount progressively (`batchSize`); new `MetaLine`, `RecordChip` and `StatusLine`; new `useTabsSwipe` hook for touch swipe between Tabs, documented with the full-width default variant; review-split-01 shows the speaker chips.

- Updated dependencies [[`ffbf133`](https://github.com/vegastack/vegastack-design/commit/ffbf1337bff1a8de29b8d977b77b8d2e4c3c935b)]:
  - @vegastack/design@0.7.19

## 0.23.9

### Patch Changes

- [#255](https://github.com/vegastack/vegastack-design/pull/255) [`283057d`](https://github.com/vegastack/vegastack-design/commit/283057db0d97a549f5194a46054e6b4830b89f61) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 List toolbars, tables and focus: FilterBar puts search (~320px) left and a Filters (n) toggle, scope Tabs and the view switch right, with compact rounded-md filter chips (tinted when set, a fixed 24px ×, "Status: 2") on a toggled row 12px below that scrolls sideways on a phone (the bottom sheet is gone); new DateRangeFilter with presets; SearchableSelect ticks async options and gains a person option (name plus muted email, both searched); DataList adds sortable columns with an indicator, `compare`/`sortFirst`/`sortMode`, a standard `rowActions` ⋯ column (32px, always last), un-underlined row links, and `noResults`; Empty always renders an icon; TabsList gains `size="sm"`; buttons inside a status Alert hover in the family's own tint; Dialog and Sheet open onto the first field, never the ×; and no focus rings anywhere except Tabs — keyboard focus is a subtle background tint (a border tint on text entry).

- Updated dependencies [[`283057d`](https://github.com/vegastack/vegastack-design/commit/283057db0d97a549f5194a46054e6b4830b89f61)]:
  - @vegastack/design@0.7.18
  - @vegastack/design-tokens@0.7.18

## 0.23.8

### Patch Changes

- [#254](https://github.com/vegastack/vegastack-design/pull/254) [`6353561`](https://github.com/vegastack/vegastack-design/commit/6353561da5b861c1120c7745bd46409cacafd01c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 notifications-01 is rebuilt on the Inbox component to match the Regent app (Mark all read and ⋯, All | Unread chips, day groups, avatar or icon rows with the unread tint, action chips, "You’re all caught up"); command-search-01 uses CommandFilters, the built-in CommandFooter hints and the wide default size; the alert, checkbox (circle preview) and sidebar docs pages describe the current behaviour.

- Updated dependencies [[`6353561`](https://github.com/vegastack/vegastack-design/commit/6353561da5b861c1120c7745bd46409cacafd01c)]:
  - @vegastack/design@0.7.17

## 0.23.7

### Patch Changes

- [#251](https://github.com/vegastack/vegastack-design/pull/251) [`ca2bd35`](https://github.com/vegastack/vegastack-design/commit/ca2bd35aa8c0118c963eb5b4a60382572d518d19) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 InboxItem: unread rows drop the dot for a soft full-bleed tint and a medium title (regular when read); a fixed right column keeps the time on top with the read toggle and ⋯ menu below it on hover or focus.

- Updated dependencies [[`ca2bd35`](https://github.com/vegastack/vegastack-design/commit/ca2bd35aa8c0118c963eb5b4a60382572d518d19)]:
  - @vegastack/design@0.7.16

## 0.23.6

### Patch Changes

- [#244](https://github.com/vegastack/vegastack-design/pull/244) [`164e490`](https://github.com/vegastack/vegastack-design/commit/164e490846805a4529c324837be25a064d7b6523) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Leading icons are muted and follow their row** — menu, select, combobox, command, sidebar, navigation-menu, toggle, ghost/outline button, breadcrumb and item-media icons rest at `text-muted-foreground` and go full colour on hover, focus, highlight, selection, active, open and pressed. Destructive rows keep `text-destructive`.

- Updated dependencies [[`164e490`](https://github.com/vegastack/vegastack-design/commit/164e490846805a4529c324837be25a064d7b6523)]:
  - @vegastack/design@0.7.15

## 0.23.5

### Patch Changes

- [#245](https://github.com/vegastack/vegastack-design/pull/245) [`323e8c8`](https://github.com/vegastack/vegastack-design/commit/323e8c84dc1ebb54f44eef2bd713248e70bb4065) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Dates & times: one Intl-based module (`@/lib/date-time`) — formatRelative, formatDuration, formatDate, formatDateTime, formatDateRange, formatTimeOfDay, formatDueLabel, groupByDay, getTimeZone and the `tz` cookie script — plus `DateTime`, `Duration`, `DueLabel`, `TimeZoneProvider`/`useTimeZone`/`TimeZoneScript` beside `RelativeTime` (new `format` prop). The Relative Time docs page becomes "Dates & times" with a where-to-use table, and the design-system skill says which to pick.

- [#247](https://github.com/vegastack/vegastack-design/pull/247) [`af1194d`](https://github.com/vegastack/vegastack-design/commit/af1194d973e6c82f5beff593da9490ea2ae72526) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Inbox: `Inbox`, `InboxFilters`, `InboxGroup`, `InboxItem` (avatar or muted icon, rich titles, action chips with loading and done states, hover/focus read toggle and menu, grouped counts), `InboxEmpty`, `InboxSkeleton` and `InboxError` for notification panels.

- Updated dependencies [[`323e8c8`](https://github.com/vegastack/vegastack-design/commit/323e8c84dc1ebb54f44eef2bd713248e70bb4065), [`af1194d`](https://github.com/vegastack/vegastack-design/commit/af1194d973e6c82f5beff593da9490ea2ae72526)]:
  - @vegastack/design@0.7.14

## 0.23.4

### Patch Changes

- [#242](https://github.com/vegastack/vegastack-design/pull/242) [`5789ff6`](https://github.com/vegastack/vegastack-design/commit/5789ff6977dcc8d50cde26d39281e7913a6d374e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Sidebar rows breathe and the user menu is one standard** — `SidebarMenu` puts a 2px gap between rows so a hovered row never touches the active one, and `SidebarGroup` sits tighter so groups stack closer. The `app-shell-01` user menu is now the standard account menu: avatar, name and role on the trigger; the same row with the email as the menu header; Profile, Settings, a Theme submenu (Light · Dark · System with icons and a check), Keyboard shortcuts, and Sign out — every item with an icon. See [App shell 01](/docs/blocks/app-shell-01).

- Updated dependencies [[`5789ff6`](https://github.com/vegastack/vegastack-design/commit/5789ff6977dcc8d50cde26d39281e7913a6d374e)]:
  - @vegastack/design@0.7.13

## 0.23.3

### Patch Changes

- [#243](https://github.com/vegastack/vegastack-design/pull/243) [`e5a31c1`](https://github.com/vegastack/vegastack-design/commit/e5a31c17c9b2f0aaaca9fcfd145fe821e4701086) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Command palette: `CommandFilters` row for type chips and selects, built-in `Kbd` key hints in `CommandFooter`, animated search icon in `CommandLoading`, the wide 820px palette as `CommandDialog`'s default size, and no blank space below the footer.

- Updated dependencies [[`e5a31c1`](https://github.com/vegastack/vegastack-design/commit/e5a31c17c9b2f0aaaca9fcfd145fe821e4701086)]:
  - @vegastack/design@0.7.12

## 0.23.2

### Patch Changes

- [#240](https://github.com/vegastack/vegastack-design/pull/240) [`a3ddf24`](https://github.com/vegastack/vegastack-design/commit/a3ddf2470802ee9492b5cee5f19fc4d11feb02d1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **FilterBar is a two-row table toolbar** — search, `scope`, `view` and `actions` on the first row; facets, "More" and `onClear`'s "Clear" on the second, folding into a "Filters (n)" sheet on a narrow bar. An unset facet reads just its label and a set one is a filled pill with a "Clear Status" ×; `searchPlacement` and `anyLabel` are deprecated and ignored.

- [#239](https://github.com/vegastack/vegastack-design/pull/239) [`f22ce1f`](https://github.com/vegastack/vegastack-design/commit/f22ce1f6ea20f408a9216333ba47195f13de8f87) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Overlay footers are as plain as their headers** — `DialogFooter` and `AlertDialogFooter` drop the muted, top-bordered band and sit in the popup's own padding. `SheetFooter` right-aligns its actions at every width instead of stacking them full width; give a Cancel `data-slot="sheet-cancel"` to seat it at the start edge. Secondary actions use `variant="secondary"`: `AlertDialogCancel`, `DialogFooter showCloseButton`, and `MultiStepForm`'s Back, Skip and Exit now default to it, and the `MultiStepFormActions` row is right-aligned with no divider. See [Sheet](/docs/components/sheet) and [Dialog](/docs/components/dialog).

- Updated dependencies [[`a3ddf24`](https://github.com/vegastack/vegastack-design/commit/a3ddf2470802ee9492b5cee5f19fc4d11feb02d1), [`f22ce1f`](https://github.com/vegastack/vegastack-design/commit/f22ce1f6ea20f408a9216333ba47195f13de8f87)]:
  - @vegastack/design@0.7.11

## 0.23.1

### Patch Changes

- [#235](https://github.com/vegastack/vegastack-design/pull/235) [`c126f9f`](https://github.com/vegastack/vegastack-design/commit/c126f9f577015ba497473e6f0f66a01855368285) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Alert has no focus ring** — an app can move focus to an error `Alert` so screen readers announce it; the alert no longer shows the focus ring, since it is not an interactive control. `SheetContent` takes `showOverlay={false}` to drop the backdrop for a non-modal panel docked beside the page.

- [#236](https://github.com/vegastack/vegastack-design/pull/236) [`499e2dd`](https://github.com/vegastack/vegastack-design/commit/499e2ddb0ecfedb962f2e4aef02d6cb9a233f45e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Checkbox takes `shape="circle"`** — a round check for marking a task or to-do done; `square` stays the default for selection and form fields.

- [#238](https://github.com/vegastack/vegastack-design/pull/238) [`008bea6`](https://github.com/vegastack/vegastack-design/commit/008bea6b4db39564bb49bef1fd9f76d335f54c7c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **No focus ring on programmatic focus targets** — `AppShellContent`'s `<main>` (the skip-link and route-change focus target) no longer draws a focus outline, which showed as a line under the app header after navigation. The same applies to `SheetContent`'s popup, the `MultiStepForm` step heading and section list, and the `Stepper` summary; interactive controls keep their focus rings.

- Updated dependencies [[`c126f9f`](https://github.com/vegastack/vegastack-design/commit/c126f9f577015ba497473e6f0f66a01855368285), [`499e2dd`](https://github.com/vegastack/vegastack-design/commit/499e2ddb0ecfedb962f2e4aef02d6cb9a233f45e), [`008bea6`](https://github.com/vegastack/vegastack-design/commit/008bea6b4db39564bb49bef1fd9f76d335f54c7c)]:
  - @vegastack/design@0.7.10

## 0.23.0

### Minor Changes

- [#233](https://github.com/vegastack/vegastack-design/pull/233) [`ac4341c`](https://github.com/vegastack/vegastack-design/commit/ac4341ca9c80c821cf9e18620e16df0c180f27f2) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Last facelift gaps** — `DataList` (and `DataGrid`) reserve the first column and every `mobile: "visible"` column before fitting the rest, so a trailing Status or actions column no longer leaves a narrow table squeezed while an earlier column that should fold stays. `tabsListVariants` and `tabsTriggerVariants` draw horizontal tabs — the list height and the line indicator — whenever the `group/tabs` ancestor is not vertical, so route tabs need no `data-orientation` at all, and a scrolling route list keeps its indicator inside the scroll box. `SearchableSelect`'s in-panel search keeps its own name inside a `Field` instead of taking the Field label, and `searchLabel` is now optional (default "Search"). [docs](https://design.vegastack.com/docs/components/data-list)

### Patch Changes

- Updated dependencies [[`ac4341c`](https://github.com/vegastack/vegastack-design/commit/ac4341ca9c80c821cf9e18620e16df0c180f27f2)]:
  - @vegastack/design@0.7.9

## 0.22.0

### Minor Changes

- [#231](https://github.com/vegastack/vegastack-design/pull/231) [`f15f6da`](https://github.com/vegastack/vegastack-design/commit/f15f6dacf06d6b009aab10182e40e4947f812a63) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Facelift gaps, all opt-in and backward compatible** — `EditableCell` takes `wrap` (a page title wraps instead of truncating) and `flush` (its text lines up with the line below). `DataList` columns take `mergedRender`, so a value folded into the first column on a phone keeps its context ("4 to review", not "4") and `mergedLayout="line"` joins folded values into one compact meta line ("Today · High · Arjun Mehta"), and the list takes `rowProps` for per-row `data-*` attributes, a class and a `highlighted` state that flashes a new row. `AudioPlayer` takes `onSourceExpired`: a media error renews an expired signed URL once and resumes at the same position. `MarkdownView` takes `headingOffset`, moving every heading down that many levels (capped at h6). `tabsListVariants` scrolls a list that carries no `data-orientation` (route tabs), and only a vertical list turns the scroll box off. `Board`'s card `href` now wins over one on the `itemLinkRender` template, as `DataList`'s row link already did (the template's own ref still lands), and a card with a menu reserves end padding so a long title wraps before the ⋯ trigger. The Alert page documents a caller `role` (`role="note"`) as the way to keep a page-load alert out of every live region, and the agent skill shipped in `@vegastack/design` names the new props. [docs](https://design.vegastack.com/docs/components/data-list)

### Patch Changes

- Updated dependencies [[`f15f6da`](https://github.com/vegastack/vegastack-design/commit/f15f6dacf06d6b009aab10182e40e4947f812a63)]:
  - @vegastack/design@0.7.8

## 0.21.2

### Patch Changes

- [#229](https://github.com/vegastack/vegastack-design/pull/229) [`638d754`](https://github.com/vegastack/vegastack-design/commit/638d75416ba35a345ee92bd0971a3a1aa98830a3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 `useAsyncSearch` aborts the in-flight request as soon as the query changes, so a slow response for the previous text can no longer fill the list while the new query waits out its debounce.

## 0.21.1

### Patch Changes

- [#227](https://github.com/vegastack/vegastack-design/pull/227) [`c911726`](https://github.com/vegastack/vegastack-design/commit/c911726ca91c368b018c3d8a6e8bf17458a59a8c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 A pinned `MultiStepFormActions` row paints the surface it sits on — a card, a dialog, a sheet or a drawer, not always the page — so it no longer shows as a black band in dark mode. The Tabs page gains the DS-62 recipes Regent's list pages use: vertical tabs that turn into a horizontal line list below an `@md` container, and vertical route tabs with counts that become a `NativeSelect` jump in a narrow column. The docs' code blocks keep their copy button clear of a long first line. [docs](https://design.vegastack.com/docs/components/tabs)

## 0.21.0

### Minor Changes

- [#223](https://github.com/vegastack/vegastack-design/pull/223) [`1f8da35`](https://github.com/vegastack/vegastack-design/commit/1f8da357dc34df3e6e496ece21f9816b5de2ed56) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 The board-01 block pages its Backlog and gives each card its own menu (DS-80).

  - **board-01**: the Backlog lane shows its full count and loads the rest with Load more (`loadMore`), and each card has Edit and Archive above Move in its ⋯ menu (`getItemActions`). [docs](https://design.vegastack.com/docs/blocks/board-01)

- [#223](https://github.com/vegastack/vegastack-design/pull/223) [`1f8da35`](https://github.com/vegastack/vegastack-design/commit/1f8da357dc34df3e6e496ece21f9816b5de2ed56) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 Three new blocks: a list page, the notification inbox and the search palette.

  - **list-page-01**: search first, a Status `FilterBarFacet`, and Mine | Team and Grid | List switches that never deselect. It shows the same records as a `DataList` with row links and row actions, or as industry-grouped grids of linked tiles, pages both views with Load more, and has three empty tiers: nothing yet, no matches and couldn't load (DS-52). [docs](https://design.vegastack.com/docs/blocks/list-page-01)
  - **notifications-01**: `InboxSheet`. The rail row and the bell carry the unread count in their names. The sheet has All | Unread, Today and Earlier groups of linked rows with the neutral unread dot, "Mark all read" announced once, Load older, and loading, empty, caught-up and error states (DS-56). [docs](https://design.vegastack.com/docs/blocks/notifications-01)
  - **command-search-01**: `CommandSearch` has scope chips (Alt+←/→ from the input), recents, results grouped by type, and aborted stale searches. It has loading, no-results and error states, footer hints from `formatShortcut`, and ⌘↵ / Ctrl+↵ to open in a new tab (DS-57). [docs](https://design.vegastack.com/docs/blocks/command-search-01)

### Patch Changes

- [#225](https://github.com/vegastack/vegastack-design/pull/225) [`5f33be1`](https://github.com/vegastack/vegastack-design/commit/5f33be13532ff52ede7514459194e873031280a6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 Fixes from the consolidated review of the facelift design-system work (Regent #136–#140).

  - **Two-line rows** (Command, Select, Combobox and the three menus): the second line is read once, as the row's description, and no longer repeated inside its name. A caller's own `aria-describedby` still wins, and the second line then stays in the name. [docs](https://design.vegastack.com/docs/components/item)
  - **CommandLoading** reads "Searching…" by default. With a `progress` value it stays a labelled `progressbar`, so the value reaches assistive technology. [docs](https://design.vegastack.com/docs/components/command)
  - **LoadMore**: when the last batch arrives the footer keeps the focus its button had, instead of dropping it to the page, and reads its `endLabel` (or "End of list"). It is now a client component.
  - **SortableList and Board**: a row or card action that removes its row moves focus to the row that took its place (its handle, or its menu when the row is locked). SortableList takes the accessor as `getItemActions`, Board's name; `menuItems` is deprecated. Board takes `actionsLabel`, a lane's `loadMore` takes the footer's labels, and a read-only lane keeps a card's own actions (only the Move items go). [docs](https://design.vegastack.com/docs/components/sortable-list)
  - **RowActionsMenu**: a disabled single icon action is described by its `disabledReason`, not only in its tooltip.
  - **FilterBar**: facets have their own seat (`facets`), after the search and before the chips; an "Add filter" option with an `editor` opens it on the new chip; `FilterChip` takes `defaultEditorOpen`. **FilterBarFacet**: the pinned "Selected" group comes first and is taken when the list opens, so toggling a row no longer moves it; the facet is the bar's height (`h-8`); `removeLabel`, `selectedGroupLabel` and `moreGroupLabel` override its strings. [docs](https://design.vegastack.com/docs/components/filter-bar)
  - **FilterBuilder** (`filter-bar-managed`): `fieldPicker="searchable"` (with `fieldPickerProps`) searches the fields, an option value with more than seven options is a search picker and a several-values editor is `SearchableSelect multiple`, and a row error is tied to the field picker whenever the operator takes no value. [docs](https://design.vegastack.com/docs/components/filter-bar-managed)
  - **SearchInput**: a value reset from outside (a host's "Clear filters") drops the typed value's pending `onValueCommitted`.
  - **SearchableSelect**: a server search with no rows yet shows its loading line; `groupOrder` puts named groups first; its fallback name no longer overrides a `<label for>`; it takes `aria-invalid` and `aria-describedby`.
  - **TextEdit**: a disabled Base UI `Field` disables the editor.
  - **RelativeTime**: `formatOptions` with `dateStyle` or `timeStyle` no longer throws for another year's date or with `withTime`.
  - **useAsyncSearch**: Load more waits out a typed query's debounce instead of pairing the new query with the old cursor.
  - **Transcript**: matches after characters whose lower case is longer are highlighted exactly; segments that only add matches keep the reader's position without a new announcement; a press on the scrollbar pauses follow; the loading line is a status.
  - **AudioPlayer**: a rejected lazy `src` or a failed media load shows the player's own error line (`loadErrorLabel`); the loading glyph is `Spinner`. **AttachmentProgress** speaks a clamped percent.
  - **VegaStackProvider**: a custom `toaster={<Toaster limit timeout />}` sets the provider's queue, and a `Toaster` on another manager brings its own provider.
  - **AppShell** takes `keyboardShortcut` (or `false`), forwarded to the sidebar. **SidebarStateScript** takes a `nonce`. The sidebar docs render a collapsible menu row as the `SidebarMenuItem`, show the unavailable item's `TBD` badge and reason, and format the shortcut per platform.
  - **DataList** section rows use the group-label face; **SettingsSection** titles use the heading face; **Board** keeps one stable ref per card.
  - **Blocks**: command-search-01 keeps Enter on its scope chips and Try again, follows only http(s) links, debounces its search, announces a scope change and a settled result count once, and has all ten scopes; the Mod+K shortcuts in command-search-01 and app-shell-01 ignore text fields; list-page-01 searches on the settled query, adds an Industry facet, sets `mobile` on every column, takes `readOnly`, and moves focus to the search after "Clear filters", as board-01 does; both use one control height per row; notifications-01 and list-page-01 take `loading` / `error` (and notifications-01 `loadMore`) instead of `status` / `loadOlder`; review-split-01 keeps its player docked in its column and names its tab count; counts in tabs are muted tabular numbers with a spoken suffix.
  - **Docs**: Stat shows linked tiles; Dropzone's upload queue has per-file fields and a save retry; Pagination describes its `<a>` links; list-page-01 keeps view state in guarded `sessionStorage`.
  - **`vegastack-design doctor`** points retired `text-h1`/`text-h2` at the page and section heading faces.
  - Migration: the `data-slot` values `notification-bell-dot`, `row-action` and `row-actions-trigger` are now `notification-dot`, `row-actions-menu-action` and `row-actions-menu-trigger`. Copied blocks are yours: re-add list-page-01 or notifications-01 to take the prop renames. From 0.19.0 (not in its notes): a mixed checkbox shows a minus, disabled checkboxes and radios dim outside a Field too, and `Card` and `Empty` are client modules.

- [#223](https://github.com/vegastack/vegastack-design/pull/223) [`1f8da35`](https://github.com/vegastack/vegastack-design/commit/1f8da357dc34df3e6e496ece21f9816b5de2ed56) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The multi-step form guide gains a "Full-page flow" example with the step in the route.

  - **MultiStepForm**: the example keeps the step in the route with a controlled `step`, `onStepChange(id, { replace })`, a vertical nav, sticky actions on a phone, and a Review step with Change links and a checklist (DS-55). [docs](https://design.vegastack.com/docs/guides/multi-step-form)

- Updated dependencies [[`4178c7f`](https://github.com/vegastack/vegastack-design/commit/4178c7f1d9390fccf40a8f05519ede8b55d662bd), [`5f33be1`](https://github.com/vegastack/vegastack-design/commit/5f33be13532ff52ede7514459194e873031280a6)]:
  - @vegastack/design@0.7.7

## 0.20.0

### Minor Changes

- [#217](https://github.com/vegastack/vegastack-design/pull/217) [`a109931`](https://github.com/vegastack/vegastack-design/commit/a109931ebf6f124af0e14139c55884999f497585) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 The app-shell-01 and board-01 blocks are modernised as the shell and board references (DS-80).

  - **app-shell-01**: the rail has a workspace menu (a real menu trigger) and a Search row that opens a palette on ⌘K / Ctrl+K, with its hint from `formatShortcut`. It also has an Inbox row whose unread count is part of its name, grouped links with `aria-current="page"`, a collapsible "Coming soon" group, and a user menu with the theme choice. The page is `AppShellPage` › `PageHeader` h1 › linked stat tiles, which replace the hand-rolled stat cards. The docs page shows `SidebarStateScript`. [docs](https://design.vegastack.com/docs/blocks/app-shell-01)
  - **board-01**: `AppShellPage` › `PageHeader` h1 › a `FilterBar` (search plus an Assignee facet) over `Board`. Lanes are named with their count ("Backlog, 3 tasks"), cards link to their task, and filters that match nothing show "No matches" with "Clear filters". [docs](https://design.vegastack.com/docs/blocks/board-01)
  - Migration: the board's view switch that nothing read and its fixed toolbar widths are gone, and every `href="#"` in both blocks is a real route. A copy you already own is unaffected until you copy the block again.

- [#215](https://github.com/vegastack/vegastack-design/pull/215) [`ce43c9b`](https://github.com/vegastack/vegastack-design/commit/ce43c9beaa008db42c309c6500f85ed3dc02b9fe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Board** lanes page with `column.loadMore` (the shared LoadMore footer inside the lane's scroll), and cards take their own actions through `getItemActions` — listed first in the card's ⋯ menu above the Move items, which is then named `Actions for {card}`. **SortableList** rows do the same through `menuItems`, on locked rows too.
  [docs](https://design.vegastack.com/docs/components/board) · [docs](https://design.vegastack.com/docs/components/sortable-list)

- [#198](https://github.com/vegastack/vegastack-design/pull/198) [`c087ef9`](https://github.com/vegastack/vegastack-design/commit/c087ef9f785880750917622ec69531d8b959612d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `Combobox` exports `ComboboxStatus`, Base UI's own polite status region for a list that loads asynchronously. Render it as a sibling of `ComboboxList` and change its children ("Searching…", then the result count) rather than mounting it conditionally. It is screen-reader-only by default; `visible` shows the message as a muted row above the list. It carries `data-slot="combobox-status"` (decision API-27).

- [#217](https://github.com/vegastack/vegastack-design/pull/217) [`a109931`](https://github.com/vegastack/vegastack-design/commit/a109931ebf6f124af0e14139c55884999f497585) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 Three new blocks: a settings hub, the status pages and a two-pane review page.

  - **settings-02**: the settings landing page. It has one section per area, and each area is a container-query grid of whole-tile links, each named by its title and described by one fact. An area that isn't built yet is a plain "TBD" tile, not a tab stop (DS-53). [docs](https://design.vegastack.com/docs/blocks/settings-02)
  - **status-pages-01**: `NotFoundPage`, `ForbiddenPage` and `ErrorPage`, each usable in the shell or standalone. Each is an `Empty` whose title is the page's `h1` and gives one way out. The error page adds "Try again" and, when there is a digest, the reference with a copy button (DS-60). [docs](https://design.vegastack.com/docs/blocks/status-pages-01)
  - **review-split-01**: `ReviewSplit` puts the summary and action items beside a sticky transcript, with the docked `AudioPlayer` at the end of the column. The block measures its own container: the layout and the switch to tabs change together at 56rem, and each panel mounts once (DS-58). [docs](https://design.vegastack.com/docs/blocks/review-split-01)

- [#213](https://github.com/vegastack/vegastack-design/pull/213) [`a08665c`](https://github.com/vegastack/vegastack-design/commit/a08665c857fd70a05e463c38689e655783a203ad) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **settings-01** is now the reference settings page, and **ToggleGroup** moves with the up and down arrows when vertical.

  - **settings-01**: an `AppShellPage size="narrow"` with a `PageHeader`, full-width controls, an `ActionBar` save bar that appears only once something changed (Discard restores the defaults), and "Delete workspace" confirmed in an `AlertDialog`. [docs](https://design.vegastack.com/docs/blocks/settings-01)
  - **ToggleGroup**: `orientation="vertical"` now reaches the primitive, so the arrow keys follow the column. [docs](https://design.vegastack.com/docs/components/toggle-group)
  - **AppShell**: the docs show a static or cached shell kept collapsed on first paint with `SidebarStateScript` and `useSidebarCookieOpen`, and the preview's counts use `badgeLabel`. [docs](https://design.vegastack.com/docs/components/app-shell)

- [#221](https://github.com/vegastack/vegastack-design/pull/221) [`c4c7dff`](https://github.com/vegastack/vegastack-design/commit/c4c7dffbd404903c23b94e503760b5779ee31a2d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **FilterBar** gains `FilterBarFacet` — a "Status: Open" facet on SearchableSelect, single or multiple, local or server-searched, pinnable and removable — and chips that edit in place: a filter's `editor` opens from its label and value (`FilterChipTrigger`), Escape returns focus to the chip, and `onEditorOpenChange` reports it. **DataList** rows become real links with `getRowHref` (and `rowLinkRender` for a router link): modifier and middle clicks work anywhere on the row, and `getRowLabel` names each selection checkbox.
  [docs](https://design.vegastack.com/docs/components/filter-bar) · [docs](https://design.vegastack.com/docs/components/data-list)

- [#215](https://github.com/vegastack/vegastack-design/pull/215) [`ce43c9b`](https://github.com/vegastack/vegastack-design/commit/ce43c9beaa008db42c309c6500f85ed3dc02b9fe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **SearchInput** and **FilterBar** send a settled query. SearchInput gains `onValueCommitted`, which fires after `debounceMs` of quiet (default `TIMINGS.searchDebounceMs`, 300 ms) and at once on Enter and on clear, while `onValueChange` keeps the field instant; FilterBar's `search` passes both through. FilterBar gains `searchPlacement="start"` for search-first lists, its chips now read "Label: value" with the colon the docs always promised, and `children` is gone from its type (it was silently dropped).
  [docs](https://design.vegastack.com/docs/components/search-input) · [docs](https://design.vegastack.com/docs/components/filter-bar)

- [#215](https://github.com/vegastack/vegastack-design/pull/215) [`ce43c9b`](https://github.com/vegastack/vegastack-design/commit/ce43c9beaa008db42c309c6500f85ed3dc02b9fe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **FilterBuilder** edits flat condition rules: `allowGroups={false}`, a `prefix` that names the rule ("Required when"), `labels` for its own words, `conditionError` for a row's own message, and `summary="sentence"` for a read-only sentence. `describeFilter` and `formatRange` print a tree or a range as text, fields take `options` and a `unit`, and five value editors ship with it — `TextValueEditor`, `NumberValueEditor`, `NumberRangeEditor`, `OptionValueEditor`, `OptionsValueEditor` — picked by default from the operator's `valueShape`.
  [docs](https://design.vegastack.com/docs/components/filter-bar-managed)

- [#215](https://github.com/vegastack/vegastack-design/pull/215) [`ce43c9b`](https://github.com/vegastack/vegastack-design/commit/ce43c9beaa008db42c309c6500f85ed3dc02b9fe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **DataList** gains collapsible `sections` (with `getRowSection` and `groupState`/`defaultGroupState`/`onGroupStateChange`) and a `rowActionsColumn` helper: one ⋯ menu per row, named `Actions for {row}`, with link actions, destructive ink, disabled actions that stay reachable and read their reason, and a single-icon shortcut. The parts behind them — `SectionRow`, `SectionToggle`, `GroupState`, `RowAction`, `RowActionsMenu`, `RowActionMenuItems` — are exported from `data-table-parts`. **DataGrid**'s group header now uses the same toggle: its count reads in muted tabular numerals without parentheses ("Open 2", heard as "Open, 2 rows").
  [docs](https://design.vegastack.com/docs/components/data-list) · [docs](https://design.vegastack.com/docs/components/data-grid)

- [#212](https://github.com/vegastack/vegastack-design/pull/212) [`f3dbf16`](https://github.com/vegastack/vegastack-design/commit/f3dbf1633f5412664efb42d1bc382ced3b6055d4) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 The login-01 block is rebuilt as a real sign-in page to the block rules (DS-79).

  - **login-01**: one `h1` "Sign in" (`CardTitle render={<h1 />}`), Email (`autoComplete="email"`) and Password through `PasswordInput` (`autoComplete="current-password"`), each labelled and described by its `Field`, a `FieldError` per field with focus on the first invalid one, a live destructive `Alert` shown only after a rejected sign-in, and a submit `Button` that loads in place without changing width. [docs](https://design.vegastack.com/docs/blocks/login-01)
  - **LoginForm** takes your `signIn` call; "Forgot password?" and "Sign up" are real links (`forgotPasswordHref`, `signUpHref`). The docs page adds sign-up and forgot-password recipes on the same frame.
  - Migration: the "Login with Google" button and every `href="#"` are gone; a copy you already own is unaffected until you copy the block again.

- [#198](https://github.com/vegastack/vegastack-design/pull/198) [`c087ef9`](https://github.com/vegastack/vegastack-design/commit/c087ef9f785880750917622ec69531d8b959612d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **MultiStepForm** tells a route-driven host whether to push or replace: `onStepChange(id, { replace })` passes `replace: false` for Next, Back and rail jumps, and `true` when the form clamps a step it will not admit or follows the address bar's hash. One-argument handlers keep working. [docs](https://design.vegastack.com/docs/components/multi-step-form)

- [#221](https://github.com/vegastack/vegastack-design/pull/221) [`c4c7dff`](https://github.com/vegastack/vegastack-design/commit/c4c7dffbd404903c23b94e503760b5779ee31a2d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **SearchableSelect** searches on the server and picks several values: `remote` stops local filtering, `onSearchChange`/`loading`/`error`/`onRetry`/`loadMore` take `useAsyncSearch` as-is (with "Searching…" announced through the panel's own status region and the Load more footer under the rows), `leadingItems` stay first and unfiltered, `multiple` makes the value an array (`{a}, {b}` or `{n} selected`), `itemToDescription` and `itemToDisabledReason` add a described second line, `groupBy` adds headings and `renderTriggerValue` rewrites the trigger text.
  [docs](https://design.vegastack.com/docs/components/searchable-select)

- [#215](https://github.com/vegastack/vegastack-design/pull/215) [`ce43c9b`](https://github.com/vegastack/vegastack-design/commit/ce43c9beaa008db42c309c6500f85ed3dc02b9fe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **useAsyncSearch** — a new hook for server search over a cursor-paged list: the query updates as you type and the request waits for `TIMINGS.searchDebounceMs` (a new 300 ms timing in `@vegastack/design`), a newer request aborts the last and late responses are dropped, `loadMore` pages with the returned cursor, and a failure keeps the loaded items with a retry. Documented in the [components guide](https://design.vegastack.com/docs/guides/components).

### Patch Changes

- [#220](https://github.com/vegastack/vegastack-design/pull/220) [`ad7294f`](https://github.com/vegastack/vegastack-design/commit/ad7294f547747dd5d58028c67550bf6902ff0ac1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 Board type-checks in apps without `@types/node`: its dev-only lane-name warning declares the `process.env.NODE_ENV` it reads. The sortable-list page quotes `Actions for {label}` as code, and scroll-area documents its props in a table, so the public docs build and export pass again.

- [#217](https://github.com/vegastack/vegastack-design/pull/217) [`a109931`](https://github.com/vegastack/vegastack-design/commit/a109931ebf6f124af0e14139c55884999f497585) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The Stat page gains a "Linked stat tiles" example: each count is a whole-tile link to the list it counts.

  - **Stat**: tiles are `Item variant="outline"` rendered as a link, in a container-query grid. The name reads label first ("Overdue tasks 3"), the value is `tabular-nums` in the regular font, and a `Skeleton` holds each tile's box while loading (DS-59). [docs](https://design.vegastack.com/docs/components/stat)
  - **Empty**: the docs example's "404 - Not Found" now reads "Page not found". [docs](https://design.vegastack.com/docs/components/empty)

- Updated dependencies [[`1786767`](https://github.com/vegastack/vegastack-design/commit/1786767749742f6b72e1267675c8cf14323e638d), [`ce43c9b`](https://github.com/vegastack/vegastack-design/commit/ce43c9beaa008db42c309c6500f85ed3dc02b9fe)]:
  - @vegastack/design@0.7.6

## 0.19.0

### Minor Changes

- [#203](https://github.com/vegastack/vegastack-design/pull/203) [`d5e9404`](https://github.com/vegastack/vegastack-design/commit/d5e9404d754449c94fcc4d72bd0cd4f38ba60039) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `Attachment` now covers file and media tiles on any surface, not only chat. `AttachmentGroup` takes `layout="grid"` to wrap tiles into equal columns (the scrolling row stays the default), a new `AttachmentProgress` part shows a determinate upload bar built on `Progress` that announces its percentage, and `muted` dims the media of a file no longer in use. Image media now styles a nested `<img>`, so the system `Image` and its fallback fill the slot. The item now depends on `@vegastack/progress` (decision API-28).

- [#208](https://github.com/vegastack/vegastack-design/pull/208) [`10f8d06`](https://github.com/vegastack/vegastack-design/commit/10f8d06129151232c554e448278847198dad4132) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **AudioPlayer** docks, closes, loads its source lazily and seeks from outside. `docked` pins it to the bottom of its scroll column (sticky, bordered, on the popover surface, clear of the bottom safe area) as a `region` named by `label`. `open` and `onOpenChange` hide it with a close button (`closeLabel`, "Close player") that pauses, reports `false` and returns focus to the control that opened it; a hidden player stays mounted and `inert`, and Escape does not close it. `src` also takes a function, resolved once on the first play. `loading` shows and announces "Loading audio…" (`loadingLabel`) once, and `error` renders an alert with "Try again" (`retryLabel`, `onRetry`). `actionsRef` exposes `seek(seconds, { play })`, `play()` and `pause()`; a seek before the metadata loads is applied when it does. `ref` is still the root element.
  [docs](https://design.vegastack.com/docs/components/audio-player)

- [#208](https://github.com/vegastack/vegastack-design/pull/208) [`10f8d06`](https://github.com/vegastack/vegastack-design/commit/10f8d06129151232c554e448278847198dad4132) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **NotificationBell** exports `NotificationDot`, the one unread dot for rows, inbox items and nav items (`intent` `default` or `destructive`, decorative), and its dot mode now draws it: **the dot's default intent changes from destructive to primary**, and its `data-slot` is `notification-bell-dot` (the count pill keeps `notification-bell-badge`). A new `countLabel` words the count in the accessible name ("Notifications, 3 unread" by default). **usePlatform** now exports `formatShortcutKey` and `formatShortcut`, which turn `"mod"` into ⌘ on macOS and Ctrl elsewhere; **ShortcutOverlay** uses them and renders the same key labels as before.
  [docs](https://design.vegastack.com/docs/components/notification-bell) · [docs](https://design.vegastack.com/docs/components/shortcut-overlay)

- [#199](https://github.com/vegastack/vegastack-design/pull/199) [`88b7a1e`](https://github.com/vegastack/vegastack-design/commit/88b7a1e909c86d0de8042a891a6cfcfaedca03ee) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Board lanes show their total as a muted count, lanes and cards have names, and cards can be links. The lane count is now muted `tabular-nums` text instead of a `Badge`, and it shows `count` (the lane's total) when the lane has loaded only some of its cards. [docs](https://design.vegastack.com/docs/components/board)

  - Names: a lane takes a plain-text `label` (required when its `title` is not a string; development warns without one), and `getItemLabel` names each card. Each lane is a region named "Open, 14 tasks" (`countLabel` supplies the noun, default "cards"), the Move menu says "Move to In progress", each card's menu control is "Move Write spec", and move announcements name the card and the lane instead of a column id.
  - Lane states: `loading` shows skeleton cards and marks the lane `aria-busy`; `emptyState` replaces the default "No cards" drop target; `defaultCollapsed` starts a lane collapsed (`collapsed` stays as its alias). "Drag a card here" shows only where a pointer drag can start.
  - Cards as links: `getItemHref` renders a card as a real link (`itemLinkRender` swaps in your router's link). Clicks and modifier clicks are the browser's own, Enter follows the link, and Space still lifts the card into move mode. Card content no longer adds a second tab stop through `TruncatedText`.

- [#196](https://github.com/vegastack/vegastack-design/pull/196) [`d7e9562`](https://github.com/vegastack/vegastack-design/commit/d7e95629a18315a85150a5861dcd15a6dc2ac62f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **DataList** and **DataGrid** page keyset lists with the shared LoadMore footer. DataList gains `loadMore` (the footer sits above `footer`, the loaded rows stay while the next batch loads, and the table reports `aria-rowcount="-1"` while more rows exist). DataGrid's footer is now LoadMore too: an outline button instead of a ghost one, Try again after `loadMore.error`, and no "All rows loaded" caption unless you pass `loadMore.endLabel`. `DataGridLoadMore` is a deprecated alias of `LoadMoreState`.
  [docs](https://design.vegastack.com/docs/components/data-list) · [docs](https://design.vegastack.com/docs/components/data-grid)

- [#205](https://github.com/vegastack/vegastack-design/pull/205) [`70ff12f`](https://github.com/vegastack/vegastack-design/commit/70ff12f8955f0f7783f5f44b5274a2992194835a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Page chrome and pickers gain the props the facelift pages need: a framework back link and a page container, zone-correct relative dates, one inline picker tier, Field-wired chips and pickers, and one toast queue.

  - **PageHeader**: `backRender` takes your router's link element for the back affordance, `titleLines` clamps or frees the title (`"none"` wraps), `meta` is a `<div>` row that can hold controls, and the title renders the page-heading face `font-heading text-2xl font-semibold`. [docs](https://design.vegastack.com/docs/components/page-header)
  - **AppShellPage** (new part): the one page container — page gutters, a `gap-6` rhythm and a `size` measure of `narrow` (768px), `default` (1280px) or `full`; `AppShellSkeleton` uses the same gutters. [docs](https://design.vegastack.com/docs/components/app-shell)
  - **RelativeTime**: `timeZone` decides the calendar day in the label, the server render and the tooltip; `capitalize`, `formatOptions` and `withTime` shape the day label; a label with no tooltip is plain inline text. [docs](https://design.vegastack.com/docs/components/relative-time)
  - **SearchableSelect** and **DatePicker**: `size="sm"` and `variant="ghost"` form one inline tier with `Select`; clearing returns focus to the trigger. SearchableSelect is named by its `FieldLabel` inside a `Field` and takes `name`, `required` and `contentClassName`; DatePicker takes `clearable`, `clearLabel` and `renderValue`. [docs](https://design.vegastack.com/docs/components/searchable-select)
  - **ChipInput**: inside a `Field` the label, description and error reach the input; `name` posts every chip, and `max`/`maxLabel` cap the entries. [docs](https://design.vegastack.com/docs/components/chip-input)
  - **EditableCell**: `renderValue` shows a label for an id in display mode. [docs](https://design.vegastack.com/docs/components/editable-cell)
  - **MultiStepForm**: `MultiStepFormActions sticky` (or `"narrow"`) keeps the action row in view on a long step and reports `data-stuck`. [docs](https://design.vegastack.com/docs/components/multi-step-form)
  - **FilterBuilder**: `maxDepth={1}` shows no group control, operators declare a `valueShape` and a shape change clears the value, "Value required" waits for a touch or a submit, and the cap copy is singular for one. [docs](https://design.vegastack.com/docs/components/filter-bar-managed)
  - **Toast** and **VegaStackProvider**: the provider carries the module `toast` manager and a `Toaster` below it reuses that provider, so `toast()` and `useToastManager()` feed one queue with one viewport (OVL-17). [docs](https://design.vegastack.com/docs/components/toast)
  - **AnimatedNumber**: the default face is the regular font with tabular digits, not mono. [docs](https://design.vegastack.com/docs/components/animated-number)
  - Migration: a test pinning `font-mono` on AnimatedNumber, the PageHeader title classes, a "Value required" message on an untouched FilterBuilder row, or a 24px box around a RelativeTime with `title={false}` sees the new output.

- [#211](https://github.com/vegastack/vegastack-design/pull/211) [`4b9f0d0`](https://github.com/vegastack/vegastack-design/commit/4b9f0d05d29454ace2b099cf613cef0ab7e89e2b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 Tables and pagers read and tab the way they should: headers in the sans face, no tab stop per timestamp, pagination links that are links, and pager controls that are buttons.

  - **DataList** and **DataGrid**: a `mono` column's header is in the sans face — `mono` styles body cells only, for codes and IDs (DS-01) — and clipped text or a `RelativeTime` in a cell is no longer a tab stop (DS-68). `headerCellClass` is exported from the shared table parts. [docs](https://design.vegastack.com/docs/components/data-list)
  - **Pagination**: `PaginationLink` is a real `<a>` wearing the button recipe, so it keeps the link role (A11Y-23); the landmark is named "Pagination" (`label`) and the ellipsis copy is `morePagesLabel` (VOI-1). [docs](https://design.vegastack.com/docs/components/pagination)
  - **DataListPager**: page controls are buttons with `aria-current="page"` on the current page; `onPageSizeChange` is optional, and without it there is no rows-per-page chooser (DS-27, DS-71). [docs](https://design.vegastack.com/docs/components/data-list-pager)
  - **TruncatedText**: `IconText`'s label slot is `icon-text-label`, and `TableCellText mono` is `text-sm`. [docs](https://design.vegastack.com/docs/components/truncated-text)
  - **useDragReorder** (and **SortableList**, **Board**): a handle that mounts after its row still owns the pointer drag (DS-70). [docs](https://design.vegastack.com/docs/components/sortable-list)
  - Migration: a test that asserts `role="button"` on a pagination link, `font-mono` on a mono column's header, a timestamp in a table as a tab stop, `text-xs` on `TableCellText mono`, or the `icon-text-sm font-medium` slot now sees the new output; a DataListPager page control is a `<button>`, not an `<a>`.

- [#207](https://github.com/vegastack/vegastack-design/pull/207) [`1ae9f5b`](https://github.com/vegastack/vegastack-design/commit/1ae9f5b8b3bdead93c0700e862097290168c932c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 Sixteen upstream-backed components gain the facelift fixes: counts and current page read correctly in the sidebar, two-line rows link their description, overlays get sizes and scrolling bodies, and built-in copy is sentence case.

  - **Sidebar**: `SidebarMenuButton` takes `badge`/`badgeLabel`, so the count is part of the item's name and the visual badge is `aria-hidden`. An active link carries `aria-current="page"`. The trigger reads "Toggle sidebar" (`triggerLabel`). Mod+B ignores text fields and takes `keyboardShortcut` (`false` turns it off). Skeleton widths are deterministic. `SidebarStateScript` and `useSidebarCookieOpen` keep a collapsed sidebar collapsed on a static shell's first paint, and a controlled provider writes no cookie. [docs](https://design.vegastack.com/docs/components/sidebar)
  - **Item**: a link or button row inside `ItemGroup` keeps its own role, and a `listitem` wrapper takes the list role. New `ItemGroupLabel` names the group. [docs](https://design.vegastack.com/docs/components/item)
  - **Command**: `CommandDialog` takes `size`; new `CommandLoading` and `CommandFooter`; two-line results; `resultsLabel`. Default copy is "Command palette" and "Search for a command…". [docs](https://design.vegastack.com/docs/components/command)
  - **Select**, **Combobox**, **DropdownMenu**, **ContextMenu** and **Menubar**: a two-line row (`ItemTitle` + `ItemDescription`) reads its second line as the row's description, which is where a disabled row gives its reason. [docs](https://design.vegastack.com/docs/components/dropdown-menu)
  - **Checkbox**: the mixed state shows a minus. **Checkbox** and **RadioGroup** dim when disabled outside a `Field` too. [docs](https://design.vegastack.com/docs/components/checkbox)
  - **Tabs**: `orientation="vertical"` now reaches the primitive, so arrow keys and `aria-orientation` follow it. A line tab list scrolls inside itself. `tabsTriggerVariants` is exported for route tabs. [docs](https://design.vegastack.com/docs/components/tabs)
  - **Sheet** and **Dialog**: side sheets take `size` (`sm`, `default`, `lg`, `xl`). New `SheetBody` and `DialogBody` scroll between a fixed header and footer, new `SheetAction` sits beside the close button, and `closeLabel` renames the close control. [docs](https://design.vegastack.com/docs/components/sheet)
  - **CardTitle** and **EmptyTitle** take `render`, so a title can be a real heading. [docs](https://design.vegastack.com/docs/components/card)
  - **Alert**: the role is `status` unless `live` is set on a destructive or warning alert. Pass `live` for an alert that appears after a user action. `AlertAction` now takes its own column beside the text and drops below it on a narrow alert, so a long label never overlaps the title. [docs](https://design.vegastack.com/docs/components/alert)
  - **ToggleGroup**: takes `deselectable={false}` to always keep one item pressed, and `wrap`. [docs](https://design.vegastack.com/docs/components/toggle-group)
  - **Badge**: exports `BadgeVariant`. [docs](https://design.vegastack.com/docs/components/badge)
  - **ScrollArea**: `aria-label` names the scrolling viewport, which becomes a region, and `viewportRef` reaches it. [docs](https://design.vegastack.com/docs/components/scroll-area)
  - Migration: the default copy changed ("Toggle sidebar", "Command palette"). Link rows in an `ItemGroup` gain a wrapper `div`. An Alert that was assertive at load is now `status`.

- [#196](https://github.com/vegastack/vegastack-design/pull/196) [`d7e9562`](https://github.com/vegastack/vegastack-design/commit/d7e95629a18315a85150a5861dcd15a6dc2ac62f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **LoadMore** — the one "Load more" footer for keyset lists: an outline button that keeps its width and focus while the next batch loads, an error line with Try again, and an optional `endLabel` once the list has ended. `LoadMoreState` (`hasMore`, `onLoadMore`, `loading`, `error`) is the shape lists, board lanes and data hooks pass around.
  [docs](https://design.vegastack.com/docs/components/load-more)

- [#201](https://github.com/vegastack/vegastack-design/pull/201) [`5500590`](https://github.com/vegastack/vegastack-design/commit/550059080d45eb6c11ec94fddc020cdc7a198978) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `sortable-list` keeps a locked row in the list: a row with `disabled: true` now shows a spacer the size of the handle (`data-slot="sortable-list-handle-spacer"`) and KEEPS its row menu with the Move items disabled, where it used to lose both. New props: `lockedReason` (the accessible description of a locked row's disabled Move items), `renderActions` (inline actions before the row menu), `actionsLabel` (the menu trigger's name) and `layout="grid"` (auto-fill image tiles with the handle and actions over the tile's top corners). The row menu trigger is now named "Actions for {label}" by default, where it was "Move {label}". `use-drag-reorder` gains `columns` (a number or `"auto"`, measured from where items wrap) so ↑/↓ in keyboard move mode step a whole row when a horizontal axis wraps into a grid, and `drag-item` draws the left and right drop-edge hairlines a horizontal axis reports. The component roster in the shipped `vegastack-design-system` skill describes the new surface.

- [#206](https://github.com/vegastack/vegastack-design/pull/206) [`6fda658`](https://github.com/vegastack/vegastack-design/commit/6fda65834d36d03ae3008fece8f08c83c746117e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **TextEdit** edits Markdown: `format="markdown"` makes `value`, `onValueChange` and `onSubmit` carry Markdown instead of HTML (through Tiptap's own `@tiptap/markdown`, a new dependency of the item), and loading a document never fires `onValueChange`. New `readOnly` (no toolbar, `aria-readonly`) and `disabled` (no toolbar, dimmed, `aria-disabled`) props; `editable` is deprecated — `editable={false}` means `readOnly`.
  [docs](https://design.vegastack.com/docs/components/text-edit)

- [#200](https://github.com/vegastack/vegastack-design/pull/200) [`b38e9a7`](https://github.com/vegastack/vegastack-design/commit/b38e9a7f4044afa687091e3a32e8c62a824d1966) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 Transcript is a new component for the text of a recording: timestamped, speaker-labelled lines on MessageScroller's engine.

  - The line playing at `currentTime` gets `aria-current="true"` and stays centred while following. Scrolling the list pauses following, and "Back to current line" brings it back.
  - Each timestamp is a "Play from 0:15" button that calls `onSeek`. Without `onSeek`, timestamps are plain text.
  - `TranscriptSearch` highlights matches with `<mark>`. Enter and Shift+Enter move between them, and each move announces "2 of 5" or "No matches".
  - `loading` and `emptyState` cover the states before there is any text.
  - Add it with `shadcn add @vegastack/transcript`.

### Patch Changes

- [#203](https://github.com/vegastack/vegastack-design/pull/203) [`d5e9404`](https://github.com/vegastack/vegastack-design/commit/d5e9404d754449c94fcc4d72bd0cd4f38ba60039) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The Dropzone page gains an "Upload queue" example: accepted files upload through a host-owned `uploadFile(file, { onProgress, signal })` call and render as `Attachment` tiles in an `AttachmentGroup layout="grid"`, each with `AttachmentProgress`, cancel, retry and discard, while refused files join the queue as error tiles that say why.

- [#210](https://github.com/vegastack/vegastack-design/pull/210) [`a6362db`](https://github.com/vegastack/vegastack-design/commit/a6362db8e320a9792cfbafa4d39219ff1b317201) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 Inside a `Field`, a **Combobox**'s "Show suggestions" toggle keeps its own name instead of taking the Field's label, so the input is the one element the Field names.

  - Since 0.18.0 the toggle answered to the field's name too: a screen reader heard a second button with the label, and a `getByLabel` query found two elements. [docs](https://design.vegastack.com/docs/components/combobox)
  - The geometry lane gets back the Select width and ButtonGroup checks and the `textEditInsideField` dynamic-DOM selector that a later merge dropped.

- [#205](https://github.com/vegastack/vegastack-design/pull/205) [`70ff12f`](https://github.com/vegastack/vegastack-design/commit/70ff12f8955f0f7783f5f44b5274a2992194835a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 Inside a `Field`, a **RadioGroup** is the control the Field names and each radio item keeps its own name, instead of every item answering to the Field's label.

  - An item in a `Field` of its own (the per-item pattern) still takes that Field's label. [docs](https://design.vegastack.com/docs/components/radio-group)

- Updated dependencies [[`10f8d06`](https://github.com/vegastack/vegastack-design/commit/10f8d06129151232c554e448278847198dad4132), [`10f8d06`](https://github.com/vegastack/vegastack-design/commit/10f8d06129151232c554e448278847198dad4132), [`88b7a1e`](https://github.com/vegastack/vegastack-design/commit/88b7a1e909c86d0de8042a891a6cfcfaedca03ee), [`d7e9562`](https://github.com/vegastack/vegastack-design/commit/d7e95629a18315a85150a5861dcd15a6dc2ac62f), [`5500590`](https://github.com/vegastack/vegastack-design/commit/550059080d45eb6c11ec94fddc020cdc7a198978), [`b38e9a7`](https://github.com/vegastack/vegastack-design/commit/b38e9a7f4044afa687091e3a32e8c62a824d1966)]:
  - @vegastack/design@0.7.5

## 0.18.0

### Minor Changes

- [#197](https://github.com/vegastack/vegastack-design/pull/197) [`b5daf25`](https://github.com/vegastack/vegastack-design/commit/b5daf257293874a3010940bfffc6af4e6ba107ab) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Field** now wires the control inside it — label, description, error and invalid state — and a **Select** trigger fills its parent by default, with a new `ghost` inline variant.

  - **Field** renders Base UI's Field underneath (API-26): a control inside a `Field` gets its label, the ids of the `FieldDescription` and `FieldError` that are rendered, and `aria-invalid` from `data-invalid`, with no `id`, `htmlFor` or `aria-*` props. An explicit `id` still wins, and an explicit `aria-describedby` keeps its ids first with the Field's ids after them. `FieldTitle`'s slot is now `field-title`. [docs](https://design.vegastack.com/docs/components/field)
  - **Input**, **Select**, **Combobox**, **NumberField**, **PasswordInput**, **Checkbox**, **RadioGroup**, **Switch** and **Slider** read the Field through Base UI; **Textarea** (now a client component), **InputGroup**, **DatePicker**, **DateRangePicker** and **TextEdit** render their focusable element through Base UI `Field.Control`.
  - **NumberField** puts `aria-describedby`, `aria-labelledby` and `aria-invalid` on its `<input>`, never the group `div`, and an explicit `id` labels it inside a `Field` (DS-67). [docs](https://design.vegastack.com/docs/components/number-field)
  - **Select**: the default trigger is `w-full` instead of `w-fit` (inside a ButtonGroup it still sizes to its content), and `variant="ghost"` is the inline, content-width trigger with no border at rest (API-24). [docs](https://design.vegastack.com/docs/components/select)
  - Migration: a Select trigger that should size to its content outside a ButtonGroup now needs `variant="ghost"` or a width class. A test asserting that a control inside a `Field` has no `aria-describedby` or `aria-invalid` now sees the Field's ids and state; a selector for `[data-slot="field-label"]` no longer matches `FieldTitle`; and a standalone Textarea, DatePicker trigger or TextEdit now carries a generated `id`, as Base UI's Input already did.

## 0.17.1

### Patch Changes

- [#194](https://github.com/vegastack/vegastack-design/pull/194) [`1f11fbc`](https://github.com/vegastack/vegastack-design/commit/1f11fbcfc1ada1a42c98a9f4286b0d2852d7f242) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The docs and the agent skills now state one convention per concern: numbers, page headings, link buttons, theme choice, empty states, view switches, page spacing and the conventions for components we own.

  - Numbers (counts, dates, amounts) are the regular font with `tabular-nums`; `font-mono` is for code and identifiers only. [docs](https://design.vegastack.com/docs/foundations/typography)
  - One page heading: `PageHeader`, `font-heading text-2xl font-semibold`; a section is `font-heading text-base font-medium`.
  - One link-button recipe: `<Link className={buttonVariants({ variant, size })}>`, never `Button render={<Link/>}`. [docs](https://design.vegastack.com/docs/components/button)
  - Theme choice is a Light / Dark / System radio group in the user menu. [docs](https://design.vegastack.com/docs/guides/provider-setup)
  - Two new empty-state tiers, "No matches" and "Couldn't load", plus default copy rules. [docs](https://design.vegastack.com/docs/foundations/empty-states)
  - One view-switch rule: RadioGroup for a form value, ToggleGroup for a view or scope switch, Tabs for page regions, links for URLs.
  - A page-rhythm recipe for gutters and gaps. [docs](https://design.vegastack.com/docs/foundations/spacing)
  - `design.md` gains the conventions for components we own and a component / part / block / example decision tree; the public skill gains "Names hide abilities" and "Which component for X".
  - Registry metadata for button, label, chip, filter-bar-managed, select, command, emoji-picker, chip-input, message-scroller, badge, toggle-group and radio-group now says only what the components do.
  - The shadcn-reset decision register is tracked in git, with true counts (180 rows: 108 shadcn, 72 ours).

- Updated dependencies [[`1f11fbc`](https://github.com/vegastack/vegastack-design/commit/1f11fbcfc1ada1a42c98a9f4286b0d2852d7f242)]:
  - @vegastack/design@0.7.4

## 0.17.0

### Minor Changes

- [#192](https://github.com/vegastack/vegastack-design/pull/192) [`27433fe`](https://github.com/vegastack/vegastack-design/commit/27433fe24ec045ecfc9386d17e439421ab7245ad) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **Demo blocks** — the registry no longer serves 28 demo blocks that did not meet the rulebook (27 upstream compositions and our `onboarding-01`), and the `@dnd-kit` drag engine they needed is gone with them.

  - Removed: `dashboard-01`, `login-02`…`login-05`, `signup-01`…`signup-05`, `sidebar-01`…`sidebar-16`, `preview-03` and `onboarding-01`.
  - Kept: `login-01`, `app-shell-01`, `board-01`, `settings-01` and the 68 chart blocks.
  - Where each recipe went: shells and the sidebar variants → `app-shell-01` and the Sidebar page; sign-in → `login-01`; sign-up → compose it from `login-01`'s frame with Field and PasswordInput; the dashboard and `preview-03` showcase → `app-shell-01` plus the Chart and Stat pages; the getting-started checklist → the Item page's Checklist example.
  - `@dnd-kit/*` and `thesvg` leave `@vegastack/ui`; `@atlaskit/pragmatic-drag-and-drop` stays the one drag engine, and `Icon`/`BrandIcon` in `@vegastack/design` keep their own `thesvg`.
  - An installed copy of a removed block is yours and keeps working; `shadcn add` of a removed name now fails.
    [docs](https://design.vegastack.com/docs/blocks/app-shell-01)

### Patch Changes

- [#192](https://github.com/vegastack/vegastack-design/pull/192) [`27433fe`](https://github.com/vegastack/vegastack-design/commit/27433fe24ec045ecfc9386d17e439421ab7245ad) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 **Item** — a new Checklist example composes a getting-started checklist from `Progress`, `ItemGroup`, `Item` and `StatusIcon`.
  [docs](https://design.vegastack.com/docs/components/item)
- Updated dependencies [[`27433fe`](https://github.com/vegastack/vegastack-design/commit/27433fe24ec045ecfc9386d17e439421ab7245ad)]:
  - @vegastack/design@0.7.3

## 0.16.1

### Patch Changes

- [#190](https://github.com/vegastack/vegastack-design/pull/190) [`cefa8f5`](https://github.com/vegastack/vegastack-design/commit/cefa8f5b09308df1bc84072f53f305f5f7258c50) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 `stepper` and `multi-step-form` keep the current-step marker (`aria-current="step"`, the step count and focus-follow) when the current step fails validation. `StepperStep` gains an optional `current` flag that marks the step current alongside an `error` or `warning` state; `MultiStepForm` sets it, so a refused step now reads as both current and in error.

## 0.16.0

### Minor Changes

- [#188](https://github.com/vegastack/vegastack-design/pull/188) [`ee0cbfd`](https://github.com/vegastack/vegastack-design/commit/ee0cbfd4d70992dc21a5879345b13689543b4f4e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **DatePicker / DateRangePicker bind to a `FieldLabel`, and a long EditableCell value truncates with its full text on hover.** Both pickers now accept `id`, `aria-describedby` and `aria-invalid` and forward them to the trigger button, so `<FieldLabel htmlFor>` names the picker (clicking the label opens it) and a `FieldDescription`/`FieldError` and the invalid border work as they do for `Input`. `EditableCell`'s display stays on one line and ellipsizes to its container — a long page title at 390px no longer overflows — and when the value is actually clipped the display carries it as `title` and `data-truncated` (measured with `use-overflow`, now a registry dependency); the editor still opens with the whole value.

## 0.15.0

### Minor Changes

- [#185](https://github.com/vegastack/vegastack-design/pull/185) [`f93704e`](https://github.com/vegastack/vegastack-design/commit/f93704e9ae36f31fa3231f3547c40a017d523441) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `DialogContent` takes a `size` prop — `sm`, `default`, `lg` or `xl`, published as `data-size` — so a bulk-edit table or an attribute editor gets a wider dialog without a `className` override. `default` keeps upstream's `sm:max-w-sm`; `sm`, `lg` and `xl` step the cap to `max-w-xs`, `max-w-2xl` and `max-w-5xl`. The axis mirrors `AlertDialogContent`'s (decision OVL-16).

- [#187](https://github.com/vegastack/vegastack-design/pull/187) [`e4c7208`](https://github.com/vegastack/vegastack-design/commit/e4c7208e9f63227a2e07b2984c4fc0672655040f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `EditableCell` inherits the surrounding type instead of fixing its display and editor at `text-sm`, so it can edit a page title at the heading's size and weight (`<h1 className="text-3xl font-semibold"><EditableCell … /></h1>`) without descendant-selector overrides. At the 14px body default it looks as before; below `md` the editor still never drops under 16px.

## 0.14.0

### Minor Changes

- [#183](https://github.com/vegastack/vegastack-design/pull/183) [`c2a246e`](https://github.com/vegastack/vegastack-design/commit/c2a246ea63479a81b8a4174e62343f30caa287dd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 PasswordInput is back as a thin InputGroup composition with a show/hide toggle.

  - The toggle is a `type="button"` icon button named "Show password" / "Hide password" with `aria-pressed`, so it never submits a form.
  - Every native input prop (`id`, `name`, `autoComplete`, `aria-invalid`) and the React 19 `ref` land on the inner input, so it works inside `Field`.
  - Add it with `shadcn add @vegastack/password-input`.

### Patch Changes

- Updated dependencies [[`c2a246e`](https://github.com/vegastack/vegastack-design/commit/c2a246ea63479a81b8a4174e62343f30caa287dd)]:
  - @vegastack/design@0.7.2

## 0.13.0

### Minor Changes

- [#181](https://github.com/vegastack/vegastack-design/pull/181) [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 DataList never forces a horizontal scroll, and the new DataListPager pages it.

  - DataList columns take the same responsive posture as DataGrid — `minWidth` (default 120) and `mobile: "visible" | "hidden" | "merge"` (default `"merge"`) — now declared once on the shared column layout. In a narrow container, overflow columns stack into the first cell, `hidden` columns are dropped and counted in a line the table is described by, and `visible` columns never hide (if they still do not fit, the table is squeezed). See [Fitting the width](/docs/components/data-list).
  - A merged value always wraps and wears its own column's face, so a `mono` or end-aligned first column no longer pins the stack to one line. If the table still overflows after that — a long unbroken value, a one-line mono id, several `visible` columns — it is squeezed (`data-squeezed`): every cell, and the text a custom `render` puts in it, may break rather than scroll. A `truncate` span or a `whitespace-nowrap` row wraps instead (an auto-layout table cannot truncate), and text-like parts grow taller to hold a wrapped label: a Badge (or `badgeVariants()` on your own element, or ToolCallChip), a Chip or Tag, a link-variant Button (or `buttonVariants({ variant: "link" })`) and EditableCell's value. Controls and fixed-size content are never wrapped, so their label never spills their box — recognised by what reaches the DOM: every other Button and any element styled with `buttonVariants()`, `toggleVariants()`, `navigationMenuTriggerStyle()`, `tabsListVariants()` or `stepperNodeVariants()`, a native `button`/`input`/`select`/`textarea`, the control roles, an Avatar and a Kbd (held on one line at full width). The row grows taller instead; only a kept part wider than the container itself still scrolls the table (see [Fitting the width](/docs/components/data-list)). A Checkbox, Switch or Radio in the last column keeps 12px of end padding, so its 24px pointer target no longer scrolls the table.
  - When the sorted column is merged or hidden, a "Sorted by …" line under the table states the order its header can no longer show. DataGrid does the same in its toolbar, describes the grid by both lines, and now gives merged values their header as a screen-reader prefix.
  - DataList always renders one `data-list-root` stack, so its status lines never land in your own grid or flex container.
  - Sortable headers use the plain header's `text-sm font-medium` and foreground ink in DataList and DataGrid, and their label now lines up with the column's values (it sat about 5px in): the start of a start column, the end of an end column, where the sort arrow leads instead of trailing. `SortHeaderButton` takes the column's `align`. A selected row is `bg-muted/50`, so a `secondary` Badge on it stays visible.
  - New [DataListPager](/docs/components/data-list-pager) for DataList's `footer` slot: a controlled range summary ("1–15 of 40"), a rows-per-page Select (15 / 30 / 50 by default), and windowed Pagination that hides on a single page. The page list narrows with the pager's width (`data-layout`: full, compact, minimal); a page count that outgrows its layout (three digits at exactly 240px, four or five digits wider) steps down one more (re-checked on any width change, however small, and when the page list's own content changes size, as when a web font swaps in), number slots grow to hold their number, and at the last step the position reads "N / M" (`data-short`) and may truncate while screen readers still hear "Page N of M" — so the page list never scrolls sideways. The range and the rows-per-page chooser each stay on one line, which puts the pager's floor at about 200px. A `NaN`, `undefined` or negative `total` reads as 0, and a `pageSize` of 0 or less shows the first `pageSizes` entry instead of adding a bogus option.
  - Chip's height and EditableCell's display height are now floors (`min-h-7` / `min-h-8`), not fixed boxes: identical on one line, and a wrapped label grows the box instead of spilling it. `stepperNodeVariants` output carries a `group/stepper-node` hook.

- [#181](https://github.com/vegastack/vegastack-design/pull/181) [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Cards and floating surfaces draw a real border instead of a ring outline, destructive menu rows clear AA, three components mirror under RTL, and FilterBar and DatePicker fit their space.

  - **Border, not ring (BRD-1).** `card`, `dialog`, `alert-dialog`, `popover`, `hover-card`,
    `select`, `combobox`, `dropdown-menu`, `context-menu`, `menubar` (content and sub-content) and
    `navigation-menu` swap upstream's `ring-1 ring-foreground/10` box-shadow for a 1px
    `border border-border`, and the floating `sidebar` swaps its `ring-sidebar-border` outline for
    `border border-sidebar-border`, so `SettingsCard` and `Board` columns follow. The ring read as a stray
    outline and disappeared in forced-colours mode. A border takes 1px of layout on each side: under
    Tailwind's `border-box` sizing a surface with a fixed width or height keeps that size and its
    content area shrinks by 2px, while a content-sized surface grows by 2px. `Board`'s drop-over highlight now recolours that
    border (`data-drop-over:border-primary/50`). See [Elevation](/docs/foundations/elevation).
  - **Destructive menu rows (A11Y-13).** A focused `variant="destructive"` item in `dropdown-menu`,
    `context-menu` and `menubar` reads `text-destructive-text` on its `/10` wash (it read 3.99:1 in
    light). `QuestionnaireError` takes the same `-text` ink as `FieldError`.
  - **Logical direction.** `PageHeader`'s actions and `FilterBar`'s search and trailing slot push with
    `ms-auto`, and `DatePicker`'s preset rail divides with `border-e`, so all three mirror under a
    `DirectionProvider`.
  - **FilterBar never overflows.** `SearchInput`'s clear button sat in an addon whose box ended about
    4px outside the input (upstream's inline-end `-0.3rem` margin), so a search filling a narrow
    `FilterBar` pushed the bar 4px past its container at 320px. The addon now stays inside; the clear
    button keeps its position.
  - **DatePicker's popup is one surface.** The calendar inside `DatePicker` / `DateRangePicker` is
    transparent, so it no longer paints `bg-background` over the popup's `bg-popover` (a visible second
    tone in dark). With `presets`, the rail now sits beside the calendar from `sm` up, as documented —
    it had stacked above it at every width — and its one divider sits between rail and calendar
    instead of doubling the popup's edge.

### Patch Changes

- [#181](https://github.com/vegastack/vegastack-design/pull/181) [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 `AppShellSkeleton` no longer causes a hydration mismatch. Its nav rows used upstream's `SidebarMenuSkeleton`, which picks a random width per mount, so the server HTML and the client's hydration never agreed in a `loading.tsx`. The rows now take their widths from a fixed cycle — same shape, same 50–90% band, identical on server and client.

- Updated dependencies [[`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66), [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66), [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66)]:
  - @vegastack/design@0.7.1
  - @vegastack/design-tokens@0.7.1

## 0.12.2

### Patch Changes

- [#179](https://github.com/vegastack/vegastack-design/pull/179) [`9ad0966`](https://github.com/vegastack/vegastack-design/commit/9ad09666c312458896da24bbbf4b1372fc0f5e15) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 The Version PR head is read from REST and the exact-SHA comparison retries.

  `gh pr view --json headRefOid` served a stale head for minutes on release run 35763347504 — the
  branch ref was already at `49486dab0` while the PR API still reported `6a359a602`. The comparison
  against the branch ref had no retry of its own (only the PR lookup above it did), so a Version PR
  that had been generated correctly was left behind a red run.

  The head now comes from `repos/{owner}/{repo}/pulls/{n}` (REST answered correctly and immediately
  throughout that incident) and the comparison retries on the same bounded schedule. The check itself
  is unchanged: two genuinely different shas still fail, because that comparison is the exact-SHA
  protection boundary.

  The negative harness gained the mutation that boundary never had — replacing the branch-ref lookup
  with the PR's own head, making the comparison vacuous. 36/36 rejected.

  Both reads now tolerate a failing call, because under `set -e` a transient `gh api` error aborted
  the step at the command substitution before the retry could do anything, with no message at all.
  An empty read never compares equal, so it falls through to the same bounded retry.

## 0.12.1

### Patch Changes

- [#170](https://github.com/vegastack/vegastack-design/pull/170) [`cbc3c9a`](https://github.com/vegastack/vegastack-design/commit/cbc3c9a89c9d5b65ddebf8fbeee94b1c4eaf8563) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The registry-auth banner no longer paints over the site header on a phone.

  Fumadocs' `Banner` is a fixed-height sticky box — it writes the same `height` into its own inline
  style and into `--fd-banner-height`, which every sticky offset below it is measured from. The notice
  was long enough to need six lines at 320px inside that 48px box, so 72px of it overflowed and, at
  `z-40` over the header's `z-30`, rendered on top of the VegaStack logo row. The layout boxes never
  overlapped and there was no horizontal scroll, which is why nothing caught it: the defect was
  content overflowing its own container, not a broken grid.

  The trailing enumeration — the Base UI shadcn project, the `@vegastack` namespace, the Cloudflare
  Access service token — is now shown from `lg` up, which is measured rather than guessed: the full
  sentence occupies six lines at 320px, three at 480px, two at 768px and one from 1024px. Below that
  the lead sentence and its link to [the registry setup](/docs/install) are unconditional, so the
  notice itself is intact at every width and the detail is deferred to the page that performs it,
  one tap away. The banner stays one line and 48px everywhere, and the wide layout is unchanged.

## 0.12.0

### Minor Changes

- [#169](https://github.com/vegastack/vegastack-design/pull/169) [`76fa8d3`](https://github.com/vegastack/vegastack-design/commit/76fa8d3171a81226dd2bfd29ba676a699353e8e6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Typography: a global Geist-spec ramp replaces per-component type decisions

  The system had no typography contract at all — the shadcn reset resolved TYP-1…TYP-9 and TYP-11 as
  **shadcn**, which left every size, weight, line-height and letter-spacing to Tailwind's stock values
  plus 229 local decisions across 112 component files. Nothing was globally declared, and nothing
  carried letter-spacing at any size.

  Four new decisions (MK, 2026-09-22), all declared once and inherited everywhere:

  - **TYP-15 — heading-tier optical metrics.** At `text-lg` and above, line-height and letter-spacing
    follow Geist's heading spec, declared as per-size `--text-*--line-height` and
    `--text-*--letter-spacing` in the `@theme inline` bridge. Tracking runs −0.012em at 18px to
    −0.06em at 72px. Geist's copy tier carries zero letter-spacing, and this system's body sizes are
    its copy tier, so `text-xs`/`text-sm`/`text-base` are untouched and render byte-identically.
    SIZES do not move, so TYP-1 stays **shadcn** and a pasted shadcn snippet still renders at
    upstream's size.
  - **TYP-16 — Geist rendering.** `-webkit-font-smoothing: antialiased` on `body`. Geist is drawn for
    it; without it the same weight renders heavier and softer than the identical weight elsewhere.
  - **TYP-17 — a declared 14px default body size**, on `body` and never on `html`. `rem` resolves
    against the root, so an `html` size would rescale every token and override the reader's browser
    font-size preference. Previously unclassed text fell back to 16px while components were 14px.
    The docs shell keeps its 16px reading size.
  - **TYP-18 — no arbitrary font size.** Upstream's `text-[0.8rem]` (`button` sm, `toggle` sm,
    `calendar`) and `text-[0.625rem]` (`questionnaire`) now sit on the ramp. Upstream's ladder does
    scale type with control size and is KEPT — the `sm` half-step resolves down to `text-xs` rather
    than flattening up to 14px.

  Also enforced: **TYP-10** ("tabular figures on code and data") had been **ours** since the reset
  with no gate at all, and `number-field` shipped proportional digits whose value jittered on every
  stepper press. It now carries `tabular-nums`, and three new `design-lint` rules — `raw-tracking`,
  `arbitrary-text-size` and `tabular-figures` — hold all of the above, each with negative-specimen
  coverage in `verify-design-lint-structural`.

  Block heading weight is normalised to `font-semibold`; chart figure labels keep `font-bold`.

  **Markdown surfaces.** `prose.root` never declared a font family, and neither of its two consumers
  (`MarkdownView`, `TextEdit`) sets one — so prose inherited whatever surrounded it, and inside any
  mono container the whole tree rendered in Geist Mono: headings, paragraphs, table cells, and the
  `1.` / `2.` markers of an ordered list, since `::marker` inherits font properties from its element.
  The recipe now declares `font-sans`, making mono the exception it names explicitly (`code`, `pre`,
  `pre code`) rather than something prose falls into by accident.

  **No uppercase, anywhere.** `design.md` § Voice & content has always said sentence case for
  everything and TYP-7 resolves as **shadcn** ("No uppercase"), but twelve `font-mono text-xs
uppercase tracking-wide` eyebrows had survived across the docs shell, plus the `terminal` and
  `code-block` header labels and the OG card. Two were a correctness bug rather than a style one: the
  home page rendered real CSS custom-property names through the transform, so `--text-lg` displayed
  as `--TEXT-LG`. All of it is removed and gated by a new `uppercase-transform` rule, which bans the
  CSS transform rather than uppercase text — if a string is uppercase, write it that way. That also
  removed the only justification for positive `tracking-*`, which existed to make uppercase legible,
  so `raw-tracking` now allows `tracking-widest` alone (the menu shortcut hint). `code-block` now
  shows `tsx` as given instead of `TSX`, and `terminal` shows `Terminal`.

  The principle applied throughout: **mono is for code, uppercase is for nothing** — content that is
  code keeps `font-mono`, content that is language is `font-sans` in sentence case.

  **The docs site.** Fumadocs' `.prose` writes `font-size` directly rather than through a utility, so
  its headings tracked the ramp's sizes but never its letter-spacing, `h1` rendered at weight 800
  (`h1 strong` at 900) and `h3` at 1.6 leading. All four now reference the ramp variables at weight 600. Two arbitrary sizes baked into Fumadocs' own class strings — 15px on the sidebar, tabs and
  accordion, 13px on code blocks — are pulled onto `--text-sm`, putting every piece of docs chrome at
  the same 14px as the product layer. Prose body stays 16px; it is a reading surface.

- [#169](https://github.com/vegastack/vegastack-design/pull/169) [`76fa8d3`](https://github.com/vegastack/vegastack-design/commit/76fa8d3171a81226dd2bfd29ba676a699353e8e6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 [MultiStepForm](/docs/components/multi-step-form) — a guarded, branching flow around [Stepper](/docs/components/stepper), with no opinion about your fields.

  - **It owns the flow and refuses to own your form.** `steps` declares labels, branches and guards; each `MultiStepFormStep` declares one body, and only the current one renders. A body is whatever you put in it — a [Field](/docs/components/field) form, a review table, an upload surface, nothing. That boundary is what keeps it at **zero new dependencies**: a guard is an ordinary function returning a promise, so React Hook Form, Zod or a hand-written check all plug in from the app side, and none of them becomes a dependency of the design system.
  - **Guards, forwards and backwards.** `beforeNext` and `beforeBack` return `true` to pass or a sentence to refuse, and may be async — while one runs the step is `loading` in the rail and the action is a loading [Button](/docs/components/button). The flow never advances optimistically. `canGoNext` is the cheap synchronous gate for the case with no reason worth showing.
  - **A refusal sits beside the control it blocks, and its weight follows its cause.** A check that ran and failed renders an assertive [Alert](/docs/components/alert) and marks the step; a gate not yet satisfied renders a quiet polite line and leaves the rail alone. Either is tied to the forward button through `aria-describedby`, so it reads out with the control and persists — which a toast cannot do (WCAG 3.3.1). The one failure a toast belongs to is the check that could not run at all, and that arrives as `onTransportError`.
  - **Conditional steps.** A step whose `when` is `false` leaves the rail, the count and the sequence, so "step 3 of 4" stays true when a branch drops one — and a branch closing under the current step rewinds rather than stranding it.
  - **One predicate decides four behaviours.** Mark a step `satisfied` when its data already exists, and reachability follows: which steps a `#step=…` deep link may open, whether the rail starts complete, whether jumping is offered, and which layout a phone gets. There is no `mode="create" | "edit"` to keep in sync.
  - **`lock` seals what has been committed.** Once a locking step is passed, Back is disabled for good and neither a jump nor a forged hash can reopen what came before it.
  - **Optional steps, resume and deep links.** `optional` adds the affix and a Skip that records `skipped` rather than complete. `urlSync` writes a namespaced `#step=<id>` so the browser's Back moves a step, and no router adapter is needed. `persistKey` restores the position and the steps passed for the life of the tab — opt-in, `sessionStorage`, and never for payment data.
  - **`layout="panel"` is the shape for a dialog.** Inside a [Dialog](/docs/components/dialog), [Sheet](/docs/components/sheet) or [Drawer](/docs/components/drawer) the nav and the action row hold their place while the step body becomes the one scrolling region, so the frame cannot grow past the viewport and take its own footer with it.
  - **`MultiStepFormExit` guards unsaved work.** `dirty` is yours to define; while it is true, leaving raises an [AlertDialog](/docs/components/alert-dialog) first and the browser warns on a refresh or a closed tab — the half no component can fake. With nothing dirty it simply calls `onExit`, because a confirmation nobody needs is the fastest way to teach people to dismiss confirmations unread.
  - **Phones get the layout their flow can honour.** Reachable steps become a tappable section list that drills into a step; a strictly linear flow keeps the rail, which collapses itself to a line and a bar, because rows would promise navigation the flow does not offer.
  - The multi-step form guide is rewritten from a recipe you assemble into a map of which component to reach for, and [Stepper](/docs/components/stepper)'s page now leads with the case that needs no buttons at all.

- [#169](https://github.com/vegastack/vegastack-design/pull/169) [`76fa8d3`](https://github.com/vegastack/vegastack-design/commit/76fa8d3171a81226dd2bfd29ba676a699353e8e6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠ [Stepper](/docs/components/stepper) is rebuilt: the rail now carries the progress, and the refusal message moves out of it.

  - **Removed: `blockedReason` and `blockedReasonId`.** They rendered under the current step's label — a one-column-wide ribbon in a horizontal rail, and nothing at all once the rail collapses — so the single placement they had was the one layout they did not fit. A reason the flow cannot advance now belongs beside the control it blocks: an [Alert](/docs/components/alert) for a check that failed, a quiet line for a gate not yet satisfied, wired to your own Next button's `aria-describedby`.
  - **Removed: the root is a `<div>`, not the `<ol>`.** The list is now nested inside it as `data-slot="stepper-list"`, so a ref or a selector aimed at the old root resolves to the wrapper. Every other `data-slot` survives.
  - **Changed: the navigable step is a plain row, not a link-styled `Button`.** `data-slot="stepper-trigger"` is the target and `data-slot="stepper-label"` stays on the label itself; anything selecting the old inner `Button` classes will not match.
  - **New states.** `loading` is what an async advance gate occupies while it runs — the state the previous four could not express without a checking step pretending to be idle. `warning` is a step that is passable but carries something to know, and `skipped` is one passed over rather than failed. `optional` on a step renders an affix beside its label.
  - **New: numbered nodes and a rail that fills in.** Connectors behind the flow take `bg-primary` and those ahead `bg-border` — read from each step's own state, never from its index — so the component is its own progress bar. A completed step's ordinal gives way to a check; colour appears only for `warning` and `error`, whose labels take the family's `-text` ink per A11Y-13 while the node fill carries its `-foreground`.
  - **New: `orientation="auto"` (the default)** flips to vertical at `verticalFrom` steps (6), because a rail long enough to crush its own labels reads better down the page. **`collapse="auto"` (the default)** replaces the rail with the current step's name, its position and a [Progress](/docs/components/progress) bar below a width derived from the step count — a container query, so a rail inside a narrow dialog collapses on a wide screen too. Focus follows the process into whichever of the two is laid out.
  - **New: `size` (`default`, `sm`), `labelPosition` (`below`, `inline`) and `showCount`.** `inline` sets each label beside its node with the connector running on from it, from the same DOM and reading order as the default.

- [#169](https://github.com/vegastack/vegastack-design/pull/169) [`76fa8d3`](https://github.com/vegastack/vegastack-design/commit/76fa8d3171a81226dd2bfd29ba676a699353e8e6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠ **[Toast](/docs/components/toast) is the one notification engine — `Sonner` is retired**, and Toast gains position, anchored toasts, custom bodies and a band of its own above the modal scrim (OVL-10, OVL-15, COL-23).

  - **Removed: the `sonner` registry item, its docs page and the `sonner` dependency.** Upstream ships both `toast` (Base UI) and `sonner`, and the shadcn reset shipped both; two engines for one job meant two live regions and two fixed viewports competing for the same corner. Toast was already the default — `provider` has always mounted it — so the migration is the import and the call shape:

    ```diff
    - import { Toaster } from "@/components/ui/sonner";
    - import { toast } from "sonner";
    + import { Toaster, toast } from "@/components/ui/toast";

    - toast.success("Event created", { description: "Sunday at 9:00 AM" });
    + toast.add({ type: "success", title: "Event created", description: "Sunday at 9:00 AM" });
    ```

    `toast()` / `toast.success()` / `toast.error()` / `toast.info()` / `toast.warning()` become `toast.add({ type, title, description })`; `duration` becomes `timeout` (and `0`, not `Infinity`, disables auto-dismiss); `action: { label, onClick }` becomes `actionProps: { children, onClick }`; `toast.dismiss(id)` becomes `toast.close(id)` — **with one real difference: `close()` with no id closes the FRONTMOST toast, where sonner's `dismiss()` closed every one.** `toast.promise` keeps its `{ loading, success, error }` shape. A copy you already installed keeps working; it just stops receiving updates. Upstream's `dashboard-01` block now fires our manager.

  - **New: `position` on `Toaster`** — six logical corners (`top`/`bottom` × `start`/`center`/`end`, default `bottom-end`). Inline names are logical, so `bottom-end` is bottom-right in an LTR document and bottom-left in an RTL one. The stack's growth direction and its swipe direction follow the corner, so a toast always enters and leaves through the edge it is pinned to.
  - **New: anchored toasts.** `ToastPositioner` and `ToastArrow` wrap the two Base UI parts upstream wraps neither of, so a confirmation can position against the control that caused it instead of stacking in the corner.
  - **New: custom bodies.** A toast carrying `data.render` draws its own content and keeps the surface, the stack, swipe-to-dismiss, `Escape` and the viewport's live region — an avatar or a thumbnail no longer means opting out of the toast contract.
  - **Fixed: a toast fired while a modal is open is no longer hidden behind the scrim.** The viewport moves to a `z-60` band, one above the single `z-50` overlay band every other surface shares. It has to be a band rather than DOM order, because the viewport mounts with the provider before any dialog exists. Nothing else leaves `z-50`.
  - **Fixed: a toast with only a description read in the secondary ink.** Base UI renders `Toast.Title` as `null` when there is no title, so `toast.add({ description })` — the shape upstream's own examples use — painted the toast's only line, its primary message, in muted grey. The description now takes the default ink exactly when it leads, and stays muted under a title.

### Patch Changes

- Updated dependencies [[`76fa8d3`](https://github.com/vegastack/vegastack-design/commit/76fa8d3171a81226dd2bfd29ba676a699353e8e6)]:
  - @vegastack/design@0.7.0
  - @vegastack/design-tokens@0.7.0

## 0.11.3

### Patch Changes

- [#167](https://github.com/vegastack/vegastack-design/pull/167) [`80e127a`](https://github.com/vegastack/vegastack-design/commit/80e127abe1cfbc2022ae9162e7a60beb67f2acb6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The reference-consumer starter is no longer part of the project workflow. The `ship` skill's post-release step, the [Quickstart](/docs/guides/quickstart), [Troubleshooting](/docs/guides/troubleshooting) and [Production checklist](/docs/guides/production-checklist) guides, the repo map and the internal operations guide no longer reference it, and the guides state what is actually true of themselves rather than deriving their authority from a repo nobody can run. Release verification is now the npm versions plus the production-boundary probe. Historical records in `docs/ledger/` and `docs/plans/` are untouched: they record what was decided at the time.

## 0.11.2

### Patch Changes

- [#165](https://github.com/vegastack/vegastack-design/pull/165) [`38ad929`](https://github.com/vegastack/vegastack-design/commit/38ad92969b237bd57a1ea177161110b869bf2242) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 The indeterminate loading mark is now lucide `Loader` everywhere, in place of `LoaderCircle`.

  - [Spinner](/docs/components/spinner), [Toast](/docs/components/toast)'s loading icon and [Sonner](/docs/components/sonner)'s loading icon move from `Loader2Icon` — an alias of lucide's `LoaderCircle` — to `LoaderIcon`, so they match [StatusIcon](/docs/components/status-icon)'s `progress` and upstream's own `dashboard-01` block. One loader shape across the system.
  - Every component that composes `Spinner` inherits the new mark, including [Button](/docs/components/button) and [Toggle](/docs/components/toggle) in their `loading` state.
  - Recorded as decision ICO-8 and enforced by design-lint's new `loader-mark` rule, so the upstream mark cannot return one file at a time.

- [#165](https://github.com/vegastack/vegastack-design/pull/165) [`38ad929`](https://github.com/vegastack/vegastack-design/commit/38ad92969b237bd57a1ea177161110b869bf2242) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 A loading [Toggle](/docs/components/toggle) no longer paints its label underneath the spinner.

  - The label wrapper was `display: contents`, which generates no box and therefore accepts no `opacity`, so `opacity-0` had nothing to apply to and the label stayed fully visible. It is now a real `inline-flex` box inheriting the control's own `gap`, matching Button.
  - This is the same defect that was fixed on Button; Toggle was the only other component carrying the pattern.

## 0.11.1

### Patch Changes

- Updated dependencies [[`997dfb8`](https://github.com/vegastack/vegastack-design/commit/997dfb89dfacff822a43bc468bb4d7b248fc2ad8)]:
  - @vegastack/design@0.6.1

## 0.11.0

### Minor Changes

- [#161](https://github.com/vegastack/vegastack-design/pull/161) [`6ed3e37`](https://github.com/vegastack/vegastack-design/commit/6ed3e373d277fa725d4ab28b696f9dadc6e866b2) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - 🧩 SearchInput now provides a token-safe clear action with controlled, uncontrolled, keyboard, and native form behavior across supported browsers.

  - Use the new reusable SearchInput for consistent search semantics and styling.
  - FilterBar now composes SearchInput while preserving its existing controlled search API.

### Patch Changes

- [#155](https://github.com/vegastack/vegastack-design/pull/155) [`e7097d9`](https://github.com/vegastack/vegastack-design/commit/e7097d9c88a99f1c0b1421276b1ad652fa645f98) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - 🐛 Loading Buttons now hide their label through a real layout box, preventing the centered spinner from overlapping visible text while preserving the button’s size and accessible name.

- [#158](https://github.com/vegastack/vegastack-design/pull/158) [`cfe049d`](https://github.com/vegastack/vegastack-design/commit/cfe049d1ca30a8c777da0636bef51a2484b50756) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - 🔧 Avatar fallback initials now use the smaller `text-xs` size across all three avatar diameters.

  - Preserve the existing `sm`, `default`, and `lg` diameters and public API.
  - Keep explicit consumer typography overrides and standalone group-count typography unchanged.

- [#160](https://github.com/vegastack/vegastack-design/pull/160) [`1689201`](https://github.com/vegastack/vegastack-design/commit/1689201717ea406677234d9dbe1585af486fd8a5) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - 🐛 Command dialogs now stay centered inside short viewports while their results scroll and composed footers remain visible.

- Updated dependencies [[`14c88ce`](https://github.com/vegastack/vegastack-design/commit/14c88ce14a3849f7f12af2720373fd78f88e388c)]:
  - @vegastack/design@0.6.0

## 0.10.0

### Minor Changes

- [#151](https://github.com/vegastack/vegastack-design/pull/151) [`72ae827`](https://github.com/vegastack/vegastack-design/commit/72ae827666bc9b03cd6d197e27cd3e0ec9ee0044) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **The shadcn `base-nova` reset — every component shadcn ships is now upstream's own file plus a recorded patch, and there is no compatibility layer.**

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

  What is ours is 61 recorded exceptions, every one traceable: a component's docs page closes with a
  `## Deviations` section naming the decision IDs behind its patch. One of them is new to this
  release: `TooltipContent` and `DropdownMenuContent` (and so `DropdownMenuSubContent`) take an
  optional `container`, forwarded to their portal, so chrome drawn over a fullscreen surface renders
  inside it instead of behind it — which is what makes a fullscreen player show its control labels
  and its settings menu again. Leaving `container` unset is upstream's default.

  **Who this affects:** every consumer. Re-pull every copied-in component; a retired import fails to
  resolve, and each retirement's prop map — including what did **not** survive it — is in
  the migration guide § 7.

### Patch Changes

- Updated dependencies [[`72ae827`](https://github.com/vegastack/vegastack-design/commit/72ae827666bc9b03cd6d197e27cd3e0ec9ee0044), [`72ae827`](https://github.com/vegastack/vegastack-design/commit/72ae827666bc9b03cd6d197e27cd3e0ec9ee0044)]:
  - @vegastack/design@0.5.0
  - @vegastack/design-tokens@0.5.0

## 0.9.1

### Patch Changes

- [#142](https://github.com/vegastack/vegastack-design/pull/142) [`6ec9d54`](https://github.com/vegastack/vegastack-design/commit/6ec9d54fd6b53e1b60c3b25705b4bfea3779be6b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **Selection controls** — Give ToggleGroup, Segmented, and pill Tabs a persistent semantic boundary, and use Segmented for the documentation preview's device modes.

- [#142](https://github.com/vegastack/vegastack-design/pull/142) [`6ec9d54`](https://github.com/vegastack/vegastack-design/commit/6ec9d54fd6b53e1b60c3b25705b4bfea3779be6b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **Verification and release** — Run deterministic affected component tests once on pull requests and automate the authorized publish-and-deploy chain.

- Updated dependencies [[`6ec9d54`](https://github.com/vegastack/vegastack-design/commit/6ec9d54fd6b53e1b60c3b25705b4bfea3779be6b)]:
  - @vegastack/design@0.4.1

## 0.9.0

### Minor Changes

- [#139](https://github.com/vegastack/vegastack-design/pull/139) [`31e915d`](https://github.com/vegastack/vegastack-design/commit/31e915d0e09ec8226f16e66572b50a288f1940b9) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Toast** — center the copy and controls vertically in single- and two-line notifications,
  give the labelled action the same quiet ghost treatment as dismissal, and complete the docs
  Scope and part API sections.
  [docs](https://design.vegastack.com/docs/components/toast)

## 0.8.2

### Patch Changes

- [#134](https://github.com/vegastack/vegastack-design/pull/134) [`c371d09`](https://github.com/vegastack/vegastack-design/commit/c371d09e2508a35b6023d9794f26326d747aade1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Dropzone docs** — keep the three-state drag preview within 320px by giving its narrow layout
  an explicit zero-minimum grid track before the three-column breakpoint.
  [docs](https://design.vegastack.com/docs/components/dropzone)

## 0.8.1

### Patch Changes

- [#132](https://github.com/vegastack/vegastack-design/pull/132) [`9390ce4`](https://github.com/vegastack/vegastack-design/commit/9390ce4654317f0b687138bf225e8656064d61c4) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **Geometry diagnostics** — name the elements and computed paint geometry that own a horizontal
  overflow, so a cross-engine failure identifies its cause instead of reporting only the page width.

## 0.8.0

### Minor Changes

- [#130](https://github.com/vegastack/vegastack-design/pull/130) [`f4fec28`](https://github.com/vegastack/vegastack-design/commit/f4fec283450bd2e10bea297033a5f5f85f8d3d86) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Keep Dropzone drag feedback inside narrow WebKit viewports.** The drag-state stroke now sits
  one stroke-width inside the surface and uses explicit border-box sizing. This avoids WebKit counting
  the stroke's two edges as horizontal scroll overflow at 320px while preserving the design system's
  independent focus-visible outline.
  [docs](https://design.vegastack.com/docs/components/dropzone)

## 0.7.5

### Patch Changes

- [#128](https://github.com/vegastack/vegastack-design/pull/128) [`e5ba405`](https://github.com/vegastack/vegastack-design/commit/e5ba405a8f312187f96d8b80150c18b5d3e7f848) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Dropzone** — paint drag feedback with an inset overlay that cannot expand WebKit scrollable
  overflow.

## 0.7.4

### Patch Changes

- [#126](https://github.com/vegastack/vegastack-design/pull/126) [`e45defd`](https://github.com/vegastack/vegastack-design/commit/e45defd2a5769e877eeb5baf747b9e40c93a9dfc) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **VideoPlayer WebKit contract** — separate pointer-leave hiding from the intentional
  focus-retention behavior in the browser test.

## 0.7.3

### Patch Changes

- [#124](https://github.com/vegastack/vegastack-design/pull/124) [`7c5a9e8`](https://github.com/vegastack/vegastack-design/commit/7c5a9e8ac998a26339d542d235d649ef5cbeafc9) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **WebKit release contracts** — keep Dropzone drag outlines inside the viewport and make
  AudioPlayer media-time tests use an engine-independent writable clock.

## 0.7.2

### Patch Changes

- [#122](https://github.com/vegastack/vegastack-design/pull/122) [`9a1c6ec`](https://github.com/vegastack/vegastack-design/commit/9a1c6ece991f3537450a95c1d1705776842ea591) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Docs-shell verification** — assert native modal isolation directly instead of requiring a
  platform-dependent focus-guard escape after the injected defect.

## 0.7.1

### Patch Changes

- [#120](https://github.com/vegastack/vegastack-design/pull/120) [`ae881cc`](https://github.com/vegastack/vegastack-design/commit/ae881ccca4c230905ec8f299b1df3fb7f6bc3181) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Docs-shell verification** — make the modal native-inert negative proof remove every outside
  descendant and keep the injected defect active for the full focus walk.

## 0.7.0

### Minor Changes

- [#57](https://github.com/vegastack/vegastack-design/pull/57) [`f1d7d2f`](https://github.com/vegastack/vegastack-design/commit/f1d7d2fbc5f9c52aa13ff9ddfc869cb71c6ae163) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **Animated icons are one factory plus 439 data modules.** Every mirrored `lucide-animated`
  icon used to carry its own copy of the controller — the animation controls, the reduced-motion gate,
  five pointer/focus handlers, the imperative handle and a block-level host — so a change to any of
  that meant regenerating 439 files and trusting that all 439 agreed. The controller now lives once in
  `createAnimatedIcon`, exported from the new `@vegastack/design/create-animated-icon` subpath, and
  each icon is a `createAnimatedIcon({ … })` call describing only its geometry, its Motion variants,
  and (for 49 icons) its non-default start/stop steps. `motion` becomes an OPTIONAL peer dependency —
  only an animated icon pulls it in, so `Icon`/`BrandIcon` consumers are unaffected. The corpus went
  from 79,078 lines to 12,951 (-84%) and from 2.06 MiB to 0.57 MiB of source; the served registry fell
  from 4.48 MiB to 2.92 MiB. `tooling/mirror-animated-icons.mjs` emits the data modules and fails
  closed on any upstream archetype it cannot model; `tooling/verify-animated-icons.mjs` asserts the
  controller contract once against the factory, holds every module to a schema whose central clause is
  that a data module contains no controller at all, pins each generated module by SHA-256 in
  `packages/ui/animated-icon-sources.json` so a hand-edited path or timing value is rejected outright,
  and carries a `--self-test` that proves seventeen distinct regressions are rejected.
  [docs](https://design.vegastack.com/docs/foundations/icons)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Seven animated icons drop a deprecated handle alias; an eighth renames its handle
  type.** `BotMessageSquareHandle`, `ConciergeBellHandle`, `KeyIconHandle` (on both `key-circle` and
  `key-square`), `RefreshCCWIconWIcon` (on `refresh-cw`), `ActivityIconHandle` (on `square-activity`)
  and `ZapHandle` were `@deprecated` aliases left behind by upstream naming quirks; each of those icons
  still exports its `<Name>IconHandle` and only the alias is gone. `chevron-first` is the different
  case and is a **rename, not an alias removal**: upstream had copy-pasted a `displayName` from another
  icon, so the primary interface was called `ChevronsDownUpIconHandle` and `ChevronFirstIconHandle` was
  the `@deprecated` alias of it. The exported component symbol is authoritative, so the name that
  survives is the one that matches it — **`ChevronsDownUpIconHandle` → `ChevronFirstIconHandle`**.
  Consumers of the old name must rename; no compatibility alias is kept.
  [docs](https://design.vegastack.com/docs/foundations/icons)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Animated icons** — the host element is now an `inline-flex` `<span>` rather than a
  block-level `<div>`, so an icon placed in a line of text no longer breaks the line box, and
  `AnimatedIconComponent` types its host as `HTMLSpanElement`. Reduced motion is now a live
  subscription to `(prefers-reduced-motion: reduce)`, so turning the preference on settles every
  mounted icon immediately instead of only affecting icons mounted afterwards. Motion's own hooks
  cannot do this: in 12.42.2 `useReducedMotion()` is `useState(prefersReducedMotion.current)` — a
  one-shot read of a module singleton captured at first import, with a standing `TODO` about not
  updating — and `useReducedMotionConfig()` layers `<MotionConfig>` on that same one-shot value. Worse,
  the OS preference was never consulted at all unless the application happened to mount a
  `<MotionConfig>`: `useReducedMotionConfig()` returns `false` outright when the context says
  `reducedMotion: "never"`, and `"never"` is precisely Motion's **default** context value. The factory
  now treats the preference as the base value and lets `<MotionConfig reducedMotion="always">` add
  reduction on top; the override is one-way, because an explicit `reducedMotion="never"` is
  byte-identical to no provider at all and honouring it would switch reduced motion off for everyone
  who configured nothing. Public icon names, the `size` prop and the `startAnimation`/`stopAnimation`
  handle are unchanged.
  [docs](https://design.vegastack.com/docs/foundations/icons)

- [#114](https://github.com/vegastack/vegastack-design/pull/114) [`64ba720`](https://github.com/vegastack/vegastack-design/commit/64ba720e64d3c57d0f0730cfa6fc8af0dcd44d87) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **`AppShell`'s skip link now targets its own content region.** The skip link and
  `AppShellContent` both hard-coded the id `main-content`, so a page holding more than one shell
  published that id twice and EVERY skip link resolved to the first region — measured on the
  `app-shell` docs page, where four embedded previews each carried it and the documented
  "Tab once, press Enter" flow landed the reader in the wrong preview from every frame but the first.
  `AppShell` now mints the id once with `React.useId()` and shares it to `AppShellContent`, with a new
  `contentId` prop for when the id has to be known (a deep link, an external `aria-controls`, a test
  harness). Setting `id` on `AppShellContent` moves the element but does not rewire the link; that is
  what `contentId` is for. Sharing a generated id is why `app-shell.tsx` now carries a client boundary
  at the shell root — `createContext`/`useContext` are unavailable under the `react-server` condition —
  which is where `SidebarProvider`'s own client context already lives; page content passed as
  `children` still renders on the server.
  [docs](https://design.vegastack.com/docs/components/app-shell)

- [#76](https://github.com/vegastack/vegastack-design/pull/76) [`8c18d2b`](https://github.com/vegastack/vegastack-design/commit/8c18d2bb8c6119ff3fb856982542ca50e05f6716) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Alert` is `role="status"`, not `role="alert"`, and `Item` takes `role="listitem"` only inside
  an `ItemGroup`.** Every alert used to be an assertive live region, so a page rendered with three
  static alerts interrupted a screen reader three times before the user had read anything. The banner
  is now polite for every intent; pass the new `live` prop for a banner raised by a user action, and a
  `destructive` or `warning` intent then escalates to the assertive `alert` role. `AnnouncementBanner`
  drops its `role="status"` at load and takes the same `live` prop. Tests asserting
  `getByRole("alert")` on a static banner should read `getByRole("status")`. Separately, `Item`
  applied `role="listitem"` to every non-`render` row, so a standalone `Item` was an axe
  `aria-required-parent` critical and `Timeline` had to document `role="none"` as a workaround;
  `ItemGroup` now provides the context that licenses the role, and outside one a row carries no role at
  all. Remove any `role="none"` passed to work around the old default.
  [docs](https://design.vegastack.com/docs/components/alert)

- [#76](https://github.com/vegastack/vegastack-design/pull/76) [`8c18d2b`](https://github.com/vegastack/vegastack-design/commit/8c18d2bb8c6119ff3fb856982542ca50e05f6716) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Empty` has one container axis.** `variant: plain | card | dashed` replaces the `bordered`
  flag crossed with `surface`, a pair that could ask for a dashed card and resolved it only by letting
  tw-merge pick a winner. Rename map: `bordered` → `variant="dashed"`, `surface="card"` →
  `variant="card"`, `surface="transparent"` (the default) → `variant="plain"`. The `data-bordered` and
  `data-surface` attributes are replaced by `data-variant`. `EmptyTitle` also takes an `as` prop, so
  the hard-coded `<h3>` no longer guesses at the host page's heading outline — pass `as="h2"` when the
  empty state replaces a page body, or `as="p"` when the surrounding card already carries the heading.
  [docs](https://design.vegastack.com/docs/components/empty)

- [#76](https://github.com/vegastack/vegastack-design/pull/76) [`8c18d2b`](https://github.com/vegastack/vegastack-design/commit/8c18d2bb8c6119ff3fb856982542ca50e05f6716) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **A list row is 14/500 over 12, disclosures hover with the row wash, and the checklist composes
  the progress primitive.** `ItemTitle` moves from 12px to `text-label` — the same type Sidebar menu
  rows, DataList cells, menu items and Message rows already use, because a 12px Item title beside a
  14px sidebar row read as two systems; `size="sm"` keeps the denser 12/12 pair. Accordion and
  Collapsible triggers dropped `hover:underline` — underlining on hover is the link affordance — and
  took `surfaceInteractive` together with the padding, inner radius and ≥4px hairline inset that the
  wash requires, with the accordion panel taking the same horizontal padding so the body stays aligned
  under its label and row heights unchanged. `OnboardingChecklist`'s segmented bar was a second
  hand-rolled `role="progressbar"` next to the primitive that already draws one, so it now composes
  `ProgressIndicator segments`; the primitive gains `segmentsFill` (segments share the container width
  instead of a fixed bar width) and accepts a single segment. A navigable `Stepper` label is now a
  `link`-variant Button instead of a `ghost` Button with its height and padding stripped to imitate
  inline text. [docs](https://design.vegastack.com/docs/components/item)

- [#76](https://github.com/vegastack/vegastack-design/pull/76) [`8c18d2b`](https://github.com/vegastack/vegastack-design/commit/8c18d2bb8c6119ff3fb856982542ca50e05f6716) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **The notification badge pops for real activity only.** `NotificationBell` read a mount ref during
  render and flipped it in an effect that scheduled no re-render, so the pop-in class first landed on
  whatever unrelated re-render happened next: a parent state change animated the badge with no new
  notification behind it. The previous count is now held in state and the cue is replayed through
  `useAnimationReplay` when the count rises after mount **and** the badge visibly changes — so it never
  fires on mount, never on a re-render, and never for 100 → 101 (both read `"99+"`). The `Timeline`
  hero fixture, which sat under the 24px pointer-target floor, is lifted off it.
  [docs](https://design.vegastack.com/docs/components/notification-bell)

- [#72](https://github.com/vegastack/vegastack-design/pull/72) [`5b03e3b`](https://github.com/vegastack/vegastack-design/commit/5b03e3b80dd102a01a6aeb99eee6048c6b6301d3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Base UI 1.6.0 → 1.8.0, `@shadcn/react` 0.2.1 → 0.3.1.** Fifteen upgrade deltas were executed and
  observed in a browser rather than assumed from a green suite; only MessageScroller needed a source
  change. Its viewport now answers the primitive's new `data-pending-scroll` attribute with
  `invisible`, so a server-rendered transcript no longer paints the top of the thread for one frame
  before jumping to the bottom — `visibility: hidden` rather than `display: none` on purpose, because
  the primitive measures `clientHeight`/`scrollHeight` to decide where to scroll and a display-none
  viewport measures zero. A regression test asserts the attribute never sticks. `message-scroller`'s
  declared `@shadcn/react` range moves to `^0.3.1`; it and `date-picker` carry new integrity hashes.
  Two user-visible upstream changes are kept as shipped: a `readOnly` Select/Combobox now opens and
  browses (reached through `editable-cell`), and start/end-aligned popups take their pop-in
  `--transform-origin` from the aligned edge.
  [docs](https://design.vegastack.com/docs/components/message-scroller)

- [#91](https://github.com/vegastack/vegastack-design/pull/91) [`3b37dde`](https://github.com/vegastack/vegastack-design/commit/3b37ddeef9193895ee186d990a399958b2c3b532) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **Dependency batches 5–6: the Fumadocs 16.15.8 family, lucide-react 1.42, axe-core 4.13,
  Playwright 1.63 and recharts 3.10.**

  Fumadocs 16.11.5 → 16.15.8 (`fumadocs-ui`, `fumadocs-core`, `fumadocs-mdx` 15.4.0,
  `fumadocs-typescript` 5.4.0, `@fumadocs/story` 1.3.0; `fumadocs-twoslash` takes the TS 6-safe 3.3.1
  patch rather than 4.0, which needs TypeScript 7) is two migrations rather than a bump.
  `fumadocs-core` 16.14 replaced Orama with ZBSearch behind the same module path — `oramaStaticClient`
  is now a deprecated alias for `staticClient`, the client builds its own database, and the
  `initOrama` factory plus the direct `@orama/orama` dependency are gone. `fumadocs-typescript` 5.4
  swapped ts-morph for the native TypeScript 7 API, so the docs' own-props filter reads a property
  symbol's `declarations[].path` instead of `getDeclarations()[].getSourceFile().getFilePath()`; the
  generator cache is TypeScript-version bound and was cleared.

  Two Fumadocs behaviour changes were audited and deliberately left alone. 16.13's global `d` theme
  hotkey is inert here — `RootProvider` mounts its window-level `keydown` listener inside the
  `theme.enabled !== false` branch and this site disables fumadocs' theme provider outright, so
  nothing is registered; the reasoning is now recorded at the call site so re-enabling that provider
  cannot silently reintroduce a hotkey that swallows a letter on every interactive page. 16.12 stopped
  force-mounting inactive `Tabs` panels, so a `ComponentPreview`'s hidden Code panel is no longer in
  the prerendered HTML; nothing depends on it, because the visual-surface contracts read the always-
  mounted Preview panel and the markdown export reads fixture source from disk, so no `forceMount`
  was added.

  Nothing in the component sources changed for the icon or chart bumps. The lucide 1.25 → 1.42 rename
  sweep is a no-op: all 126 distinct lucide names imported across the registry, the design package and
  the docs app — 125 icons plus the `LucideIcon` type — resolve against the installed 1.42.0 module,
  and lucide keeps every historical rename as a named alias, so there is nothing to sweep. The 439
  animated-icon data modules regenerate byte-identical through the factory, with the 28 new upstream
  icons left unadopted. axe-core 4.12.1 → 4.13.0 expands `aria-prohibited-attr` and
  `role=image`, and the browser axe lane reports no new violation. recharts 3.9.2 → 3.10.1 deprecates
  `Legend`'s `align`/`verticalAlign` in favour of `position`/`offset`; no `ChartLegend` call site
  passes either and `Legend` still injects `verticalAlign` into custom content, so
  `ChartLegendContent` keeps reading it. Only `chart`'s registry item changes, and only because its
  documentation comment records that migration.

- [#97](https://github.com/vegastack/vegastack-design/pull/97) [`36ebf9d`](https://github.com/vegastack/vegastack-design/commit/36ebf9d4046e8e87c9580d1b825e26222a543a3b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **`@tanstack/react-table` 8.21.3 → 9.2.4, in `data-grid` alone.** v9 replaces `useReactTable`
  with `useTable` and stops bundling every feature into every table: a table now declares the features
  it uses, and row models are feature slots rather than table options. `data-grid` declares exactly
  one — `rowSortingFeature` with `createSortedRowModel()` — which turns the sanctioned-exception
  boundary from a claim into something the module reads back: `columnVisibilityFeature`,
  `columnOrderingFeature` and `rowSelectionFeature` all exist in v9 and none is adopted, because
  column visibility, column order and row selection are `data-grid`'s own state, and the APG grid
  keyboard layer (roving gridcell tabindex, Enter/F2 edit mode, Escape restore) is unchanged
  this-file-only code. `getCoreRowModel()` is gone (the core model is automatic) and `manualPagination`
  went with `rowPaginationFeature`, where it was already inert. The four built-in comparators v8 kept
  permanently in its registry — `alphanumeric`, `basic`, `datetime`, `text` — are registered
  explicitly in the `sortFns` slot so `getAutoSortFn` resolves the same comparator per column as it
  did under v8. No public prop, type or behaviour of `DataGrid` changes; `@tanstack/react-virtual` is
  untouched.
  [docs](https://design.vegastack.com/docs/components/data-grid)

- [#95](https://github.com/vegastack/vegastack-design/pull/95) [`452df99`](https://github.com/vegastack/vegastack-design/commit/452df99a039dc145a801deb9b548458bb993ad41) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **Five mechanical dependency majors.** `motion` 12.42.2 → 13.2.0 (its only import site is the
  animated-icon factory; the 13.0 removal of the optional `@emotion/is-prop-valid` dependency does not
  apply — no CSS-in-JS library wraps a `motion` component here — and `useReducedMotion()` is still the
  one-shot `useState` read the factory deliberately replaces with a live `useSyncExternalStore`
  subscription). `react-dropzone` 19.1.1 → 20.1.1, whose only breaking change is a Node 22 floor
  (this repo pins Node 24.20.0). `@atlaskit/pragmatic-drag-and-drop` 2.0.1 → 3.1.0 plus `-hitbox`
  2.0.0 → 2.2.0, whose 3.0.0 renamed every entry point: `use-drag-reorder` now imports from
  `/adapter/element-adapter`, `/utils/combine`, `/closest-edge/attach-closest-edge`,
  `/closest-edge/extract-closest-edge` and `/types` rather than the deprecated compatibility shims.
  `@testing-library/jest-dom` 6.9.1 → 7.0.1, which makes `@testing-library/dom` a required peer — now
  declared explicitly at 10.4.1. `globals` 16.5.0 → 17.12.0, whose 17.0.0 split the `audioWorklet`
  environment out of `browser`; the shared ESLint config uses `browser` + `node` only. Behaviour of
  the drag keyboard layer, the live-region announcements, the "Move to…" menu equivalents and the
  paste-acquisition path is unchanged — all of it is ours, not the engines'.
  [docs](https://design.vegastack.com/docs/components/board)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Badge speaks the same variant vocabulary as Button.** `variant` is now
  `solid · soft · outline · minimal`: `subtle` is renamed **`soft`**, with no alias — a stale
  `variant="subtle"` is a type error. The three sizes become three REAL heights, `sm` **16px** · `md`
  **20px** · `lg` **24px**; `sm` used to be `md` with 2px less horizontal padding, which is a padding
  value, not a size. `minimal` becomes ink only — no fill, no border, no horizontal padding — so it
  sits flush in a table cell instead of faking a pill, and it now carries a **leading dot by
  default**, because a badge with no container has nothing but colour left to signal status with (WCAG
  1.4.1). Pass `dot={false}` to opt out, or the new `icon` prop to take the dot's place.
  [docs](https://design.vegastack.com/docs/components/badge)

- [#62](https://github.com/vegastack/vegastack-design/pull/62) [`42aa455`](https://github.com/vegastack/vegastack-design/commit/42aa455b00d1a50bb919ecfb7112a1e4f8c5d244) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **One key chip, and the display leaves move onto role tokens.** `TooltipKbd` renders
  `Kbd size="xs"` instead of restyling a second `<kbd>`, so a shortcut hint reads identically wherever
  it appears — and inherits the OS rewrite. `Kbd`'s three sizes now use one type role
  (`text-code-sm`); `md` reached the same 12px through `text-sm`, the same pixel size named twice, and
  the meaningless `pointer-events-none` on a `<kbd>` is gone. `StatusIcon` sizes become the
  `--icon-inline` / `default` / `action` / `feature` role tokens (14 / 16 / 20 / 24px), the ladder
  Spinner already uses, instead of raw `size-N` steps spelling the same four values. A `Skeleton` line
  moves to the text radius (`rounded-sm`): 8px on a 16px bar reads as a pill, not as text.
  [docs](https://design.vegastack.com/docs/components/kbd)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Kbd` defaults to `os="other"`.** It reads no `navigator` — that is what keeps it
  server-safe — so the platform is the caller's to resolve: run `usePlatform()` and pass the answer
  down. The old default shipped mac glyphs to a Windows majority. `TooltipKbd` takes the same `os`
  prop.
  [docs](https://design.vegastack.com/docs/components/kbd)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Reduced motion is stated once, globally.** All seventeen `motion-reduce:` copies across
  eleven components were deleted — the registry now carries zero. The `base.css` reset owns the rule
  with the one sanctioned `!important`, so a per-component restatement adds nothing and is a second
  copy that can drift. One copy looked load-bearing and exposed a hole in the reset instead: it zeroed
  animation _duration_ but not _delay_, so `StaggeredTextReveal` still played its words out one by one
  over the full stagger window.
  [docs](https://design.vegastack.com/docs/foundations/motion)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **An indeterminate `Progress` no longer reads as 100% complete.** Base UI writes no inline
  width when `value` is `null`, so an indicator styled only for the determinate case inherited the
  track's full width — an upload in progress looked finished. It is now a 35% segment sweeping the
  track on the one sanctioned looping utility, `motion-indeterminate`, whose keyframes rest on the same
  frame at both ends so reduced motion leaves a static segment rather than a full bar, and
  `aria-valuenow` is omitted.
  [docs](https://design.vegastack.com/docs/components/progress)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **`RelativeTime` no longer renders an empty first frame.** A relative label needs
  `Date.now()`, which the server cannot reproduce, so it used to render `""` until hydration — a
  visible pop and a layout shift on every row of a list. Server and hydration render now agree on the
  **absolute** date (`"Mar 15, 2025"`), derived from the target instant alone, and the swap to the
  relative label is a text change inside a box that is already the right size.
  [docs](https://design.vegastack.com/docs/components/relative-time)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Twelve components are server-safe again.** Avatar, Button, Collapsible, Field, Progress,
  Resizable, ScrollArea, Separator, Slider, Switch, Tabs and Toggle carried `"use client"` without
  touching a hook or a handler. A client module poisons every RSC importer downstream —
  `buttonVariants` could not be read from a server component. 84 client leaves in the registry became 72.
  [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`text-xs` is mono-only.** Seven sites across Attachment, AudioPlayer, Chart and
  ProgressIndicator were reaching 11px in Geist Sans for density; sans copy now floors at `text-sm`
  (12px).
  [docs](https://design.vegastack.com/docs/foundations/typography)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`TruncatedText` gains `focusable`,** with a `TruncationFocusProvider` that sets it for a
  whole region. Clipped text becomes a Tooltip trigger and takes a tab stop — in a 50-row table that is
  50 extra tab stops layered on a grid's own roving focus, and CSS truncation never hides anything from
  a screen reader, so the tooltip only ever served sighted keyboard users. `IconText`, `TableCellText`
  and `RelativeTime` take the same prop.
  [docs](https://design.vegastack.com/docs/components/truncated-text)

- [#105](https://github.com/vegastack/vegastack-design/pull/105) [`7153311`](https://github.com/vegastack/vegastack-design/commit/71533116d42d143abc95e573e8f347d0682958a3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 **Every component page now follows the page canon, and a gate says so.** All 116 pages carry the
  canon's frontmatter (`registry`, `status`, `since`, `a11y`), the `## Installation` heading is now
  `## Install`, and the five generated sections — install steps, anatomy, API tables, states tested
  and the per-item changelog — are rendered from `registry.json`, `component-contracts.json` and
  `CHANGELOG.md` on every page instead of being hand-typed on three. `tooling/content-lint.mjs`
  enforces the section vocabulary, the section order, "nothing after Do / Don't except the
  Changelog", and generated-not-typed, with a `--self-test` that observes each rule failing;
  `tooling/verify-docs-export.mjs` additionally requires a playground or Story explorer to render
  under the page's `## Playground` heading. The `registry` frontmatter field is required and is no
  longer inferred from the page slug, so a wrong or missing item name fails the build rather than
  composing the wrong `shadcn add` target. The `AutoTypeTable` alias for `ApiTable` is gone. On the
  Command page the live dialog demo moved to ⌘J, because the docs site itself owns ⌘K and both
  dialogs were opening at once.
  [docs](https://design.vegastack.com/docs/components/button)

- [#55](https://github.com/vegastack/vegastack-design/pull/55) [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Button**, **Select**, **Sidebar**, **Toggle**, **Tabs**, **Table**, **DataGrid**,
  **DataList**, **Board**, **Item**, **Pagination**, **NavigationMenu**, **Combobox**, **DatePicker**,
  **Dialog**, **Sheet**, **Popover**, **HoverCard**, **Segmented**, **TagGroup**, **Bubble**, **Card**,
  **AppShell**, **EmojiPicker**, **FieldInline**, **MessageScroller**, **NumberField**,
  **OnboardingChecklist**, **ShortcutOverlay**, **Sonner**, **Switch**, **ToolCallChip** and the
  **dashboard-01** block — every hover now climbs one rung and **every control has a pressed step**.
  Previously only the solid primary Button darkened on `:active`; a state probe found 268 elements
  where pressing changed nothing. Select's trigger hovered only in dark mode; it now hovers in both.
  The current sidebar row rests on `surface-3` so hovering it still moves. ComparisonMatrix and
  PricingSection stop using `info` (blue) for the promoted column and the highlighted plan — `info` is
  links and informational UI only; promotion is a neutral ladder rung.
  [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Button` has no icon size tier.** `size="icon"` / `icon-xs` / `icon-sm` / `icon-lg`
  are gone; every icon-only action is `IconButton`, which makes the missing `aria-label` a type error
  and now owns `shape="square" | "round"`.
  [docs](https://design.vegastack.com/docs/components/icon-button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **A loading Button no longer changes width.** The spinner is taken out of flow and stacked
  over the label, which keeps its box behind `opacity-0` — not `visibility: hidden`, which would drop
  the label out of the accessibility tree and leave a pending button with no name; previously a "Save
  changes" button jumped about 20px the moment a request started.
  [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **Button `glass`, and the seven colour-in-the-name variants.** The frosted `glass` variant
  had no product consumer; media chrome uses the theme-invariant `--media-*` tokens instead. `success`,
  `warning`, `info`, `destructive-outline`, `success-outline`, `warning-outline` and `info-outline`
  baked a colour into a name and are replaced by the `tone` axis.
  [docs](https://design.vegastack.com/docs/components/button)

- [#60](https://github.com/vegastack/vegastack-design/pull/60) [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Button is two axes, not fifteen variants.** `variant` is now the SHAPE — `solid` ·
  `soft` · `outline` · `ghost` · `link` · `cta` — and the new `tone` prop is the HUE — `neutral`
  (default) · `destructive` · `success` · `warning` · `info`. Every recipe is written once as ten class
  strings and reads the hue from `--btn-*` custom properties, so all thirty cells share one
  hover/pressed grammar. Rename map: `default` → `solid`, `secondary` → `soft`, `destructive` → `soft`

  - `tone="destructive"`, `success`/`warning`/`info` → `soft` + the matching tone, `{family}-outline` →
    `outline` + the matching tone; `outline`, `ghost`, `link` and `cta` keep their names. A destructive
    action is **never** a solid red button — `tone="destructive"` with `variant="solid"` does not
    type-check.
    [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`disabled` is `aria-disabled`, not the native attribute.** Button, IconButton and
  SplitButton keep their pointer events and stay focusable when disabled, so a Tooltip can explain why
  the action is unavailable. Base UI still suppresses activation. Code asserting `element.disabled`
  should read `aria-disabled` instead.
  [docs](https://design.vegastack.com/docs/components/button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **IconButton everywhere.** The dismiss, pager and toggle controls that were hand-rolled
  `<button>` elements in Alert, AnnouncementBanner, Dialog, Sheet, Pagination, OnboardingChecklist and
  FilterBar are now `IconButton`, and CopyButton, MessageScrollerButton, ColorPicker, EmojiPicker and
  SplitButton's chevron half compose it too — so they all inherit the matrix, the focus ring, the
  loading contract and the required accessible name. New `iconButtonGeometry(size, shape)` styles an
  icon-only **link**: navigation stays a real `<a>` (PageHeader's back affordance) instead of acquiring
  `role="button"`.
  [docs](https://design.vegastack.com/docs/components/icon-button)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **One size vocabulary: `xs · sm · md · lg`.** The tier every component called `default`
  is now `md`, matching the `--size-*` tokens it was always built from. This is a rename across Button,
  IconButton, SplitButton, Badge, Input, Textarea, Select, Combobox, Avatar, Card, Item, Empty, Kbd,
  Dialog, Switch, Checkbox, RadioGroup, Toggle, ToggleGroup, Segmented, Stat, Spinner, StatusIcon,
  Progress, ProgressIndicator, OTPInput, NumberField, Attachment, ChipInput, Pagination and Sidebar.
  There is no alias — `size="default"` is a type error.
  [docs](https://design.vegastack.com/docs/components/button)

- [#116](https://github.com/vegastack/vegastack-design/pull/116) [`02ba364`](https://github.com/vegastack/vegastack-design/commit/02ba364991737f7a8222fd6007790269d1e7102f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Four controls shipped with utilities silently destroyed, and a `Field > Textarea` was
  unlabelled.** In five places two adjacent class-string literals were concatenated with no
  separating space, so JavaScript welded them into one word and the utility on _both_ sides of the
  seam vanished. The **Switch had no track colour in either state** — measured
  `background-color: rgba(0, 0, 0, 0)` and `padding: 0px` unchecked _and_ checked, with on/off
  conveyed only by thumb position on a `background`-coloured thumb; only a hovered checked switch
  painted, so the control appeared under the cursor and nowhere else. The switch thumb ran on
  Chromium's default curve instead of `--motion-ease-standard`; a focused **OTP** slot wore the global
  2px focus ring that text entry exists to suppress; and the **NumberField** steppers rendered at full
  `--foreground` with no hover step. All four are repaired, and `design-lint` gained a structural
  `class-glue` rule that rejects the seam at the AST — the existing rules read one literal at a time
  and could not see it, which is why `transition-pairing` passed on an element with no ease token.

  `<Field label="…"><Textarea /></Field>` produced a textarea with no `id`, no `aria-labelledby`, no
  `aria-describedby` and no `aria-invalid`: the `<label for>` pointed at nothing, the error message was
  not linked, and axe reported `label` at **critical**. `Textarea` now renders through Base UI's
  `Field.Control`, like every sibling control, so the wiring and the destructive border tint arrive
  automatically. Standalone use is unchanged.

  Also fixed: `aria-invalid` was accepted and inert on a standalone `OTPInput` (it landed on the root,
  never on the slots) and on a standalone `NumberField` (the group's `:has()` selector cannot match the
  group's own attribute); a read-only `EditableCell` with a `select` editor rendered the raw stored
  value where the editable cell rendered the option label; and a `borderless` `Field` showed no resting
  border when invalid.
  [docs](https://design.vegastack.com/docs/components/switch)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Helper text moved below the control, and `Field` owns validation feedback.** A field's
  description now renders **under** the control with the error under that — above the control it
  pushed the input away from its own label, and a wrapped description put two lines of prose between
  the two things the eye pairs. The invalid **shake** moved with it: `Input`, `Checkbox`,
  `RadioGroupItem`, `OTPInput`, `NumberField` and `ChipInput` no longer take `shakeSignal` and no
  longer shake on their own — `Field` does, for every control it wraps, so `Textarea` gains the
  behaviour it never had. A bare `<Input aria-invalid>` outside a `Field` still tints its border; wrap
  it in a `Field` for the motion, or move `shakeSignal` onto the `Field`.
  [docs](https://design.vegastack.com/docs/components/field)

  **Inline validation announces as `role="status"`, not `role="alert"`.** `FieldError` and
  `FieldInline`'s error are polite live regions: the person just typed or submitted and is looking at
  the field, and `alert` interrupts whatever the screen reader was saying. `alert` stays reserved for
  something that arrives without being asked for. Tests asserting `getByRole("alert")` on a field
  error should read `getByRole("status")`.
  [docs](https://design.vegastack.com/docs/components/field)

  **Form controls keep their pointer events when disabled.** `disabled:pointer-events-none` is gone
  from Input, Textarea, NumberField, OTPInput, Select, Combobox, ChipInput, Checkbox and RadioGroup,
  matching the Button contract — an unavailable control must stay hoverable so a Tooltip can say why.
  `cursor-not-allowed` and the dim stay; Base UI suppresses activation either way.
  [docs](https://design.vegastack.com/docs/components/input)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **One field chrome.** The border/hover/focus/invalid/disabled grammar was copy-pasted in Input,
  Textarea and NumberField, restated a fourth time as slot overrides in Field, and again in Combobox
  and ChipInput. It is now `fieldControl` / `fieldControlGroup` in `@vegastack/design`, which Input,
  Textarea, NumberField, OTPInput, the Select trigger, the Combobox input and its input-group, and
  ChipInput all spread — so retuning the field is one edit.
  [docs](https://design.vegastack.com/docs/components/input)

  **Checkbox, RadioGroup, Switch and the Select trigger hover in both themes, checked included.** A
  state probe found no hover treatment at all on 31 checkbox/radio/switch fixtures, and a ticked
  control read dead under the cursor while an unticked one moved. They now step through the same
  neutral border rung every field wears, and a filled control steps through the solid's own darker
  rungs.
  [docs](https://design.vegastack.com/docs/components/checkbox)

  **NumberField's ± steppers no longer run their hover fill into the field border.** The wash was
  full-bleed, so it met the field's hairline on three sides with a square inner corner against the
  rounded outer one. It is now an inset chip with its own radius; the button keeps the full pointer
  target.
  [docs](https://design.vegastack.com/docs/components/number-field)

  **`Label` is `inline-flex` by default**, so it composes into a sentence instead of breaking the line
  around itself; `layout="block"` is the explicit opt-in for the stacked form row.
  [docs](https://design.vegastack.com/docs/components/label)

  **PasswordInput's eye toggle is an `IconButton`** in the ghost recipe, and the eye swap has no
  motion. It replayed `motion-pop-in` behind a guard whose only job was to stop the animation firing
  on first paint — a tell that the animation did not belong there.
  [docs](https://design.vegastack.com/docs/components/password-input)

  **FieldInline and EditableCell run on `useInlineEdit`**, and FieldInline's rest hover is the shared
  interactive-surface recipe, so it is visible on a card rather than only on the page ground.
  [docs](https://design.vegastack.com/docs/components/field-inline)

  **AutoSaveInput** drops a `cn(className)` no-op, sizes its status slot with `--icon-default` instead
  of a raw `size-4`, and marks its spinner `decorative`.
  [docs](https://design.vegastack.com/docs/components/auto-save-input)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **CheckboxGroup** — shared state for a set of checkboxes, with first-class "select all". Base UI
  ships the parent/child arithmetic (`allValues` plus a `parent` child gives the mixed state and the
  whole-set toggle) and the system had no wrapper for it, so DataGrid, DataList and every permissions
  block computed it by hand. There is no `CheckboxGroupItem` — a child is a plain `Checkbox` with a
  `value`.
  [docs](https://design.vegastack.com/docs/components/checkbox-group)

  **`useInlineEdit`** — the click-to-edit machine: draft, commit, cancel, focus restoration and the
  double-commit guard (Enter closes the edit, which unmounts the input, which fires blur, which would
  commit a second time). `FieldInline` and `EditableCell` had each written it, and the copies had
  already drifted — only one re-armed the guard when a controlled host flipped `editing` on, and only
  one restored focus after a keyboard commit. It owns no DOM and no persistence, so it also serves a
  cell editor that is a `Select` popup with no text input at all.
  [docs](https://design.vegastack.com/docs/guides/components)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`selection:*` in form controls** — Input, Textarea, OTPInput, NumberField and the Combobox input
  repainted selected text near-black on near-white. Native selection is what users expect and it
  respects the OS and accessibility settings.
  [docs](https://design.vegastack.com/docs/components/input)

  **`shakeSignal` on Input, Checkbox, RadioGroupItem, OTPInput, NumberField and ChipInput** — the prop
  lives on `Field`, which owns the shake.
  [docs](https://design.vegastack.com/docs/components/field)

  **`Spinner label=""` as the way to say "decorative"** — `decorative` is now the sanctioned spelling.
  `label=""` still means the same thing; it just says it by passing a value that reads as a mistake at
  the call site.
  [docs](https://design.vegastack.com/docs/components/spinner)

- [#107](https://github.com/vegastack/vegastack-design/pull/107) [`cff5ccb`](https://github.com/vegastack/vegastack-design/commit/cff5ccb0c71af274c3607047ba1dc56247f4251b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Text-entry focus** — a text field's border is its only focus channel, and two other states were
  taking it. An `aria-invalid` field kept its destructive border when focused, and a `Field borderless`
  control kept its transparent one, so both showed **no focus indicator at all** (WCAG 2.2 §2.4.7). The
  invalid tint in `fieldControl` / `fieldControlGroup` and on TextEdit's container now stands down on
  `focus`/`focus-within`, `borderless` flattens only while unfocused, and `Input`'s `outline-hidden` —
  lost to a missing space in a string concatenation — applies again. The focus tint is now contrast-gated
  as the composite users actually see: 4.04–4.51:1 light, 6.31–7.72:1 dark.
  [docs](https://design.vegastack.com/docs/components/input)

- [#113](https://github.com/vegastack/vegastack-design/pull/113) [`18e2208`](https://github.com/vegastack/vegastack-design/commit/18e22087c75bdd116554c9cf85523d4be20c7b61) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Two shipped WCAG 1.4.3 failures in brand and status colour, and the three gates that could not
  see them.** The `destructive` `Bubble` was the only place in the registry that used a solid FILL
  token as body text — `text-destructive` over `bg-destructive/(--alpha-soft-surface)` measured
  5.24 / 4.31 / 4.44:1 in light and 2.56 / 2.37 / 1.78:1 in dark across rest/hover/pressed, and its
  light ladder inverted (hover L 0.874, pressed L 0.883) because the pressed step jumped to a
  precomposed token sitting on a different ground. It is now the same soft recipe the four soft
  Buttons use — `bg-destructive-subtle` / `-hover` / `-active` with `destructive-text` ink — measuring
  5.80 / 5.13 / 4.69 light and 6.14 / 5.02 / 4.61 dark, monotone in both. The `tinted` variant's
  pressed step, which composited to L 0.921 against a `surface-3` hover at 0.922, moves to
  `--alpha-ink-tint-strong` so a press is visible. The `cta` Button painted its 0.75rem/400 mono label
  in `text-brand`, a 3.5:1 MARKER value, measuring 3.41 / 3.33 / 3.21:1 in light on the public docs
  playground; the family now ships **`brand-text`**, the page-readable half every chromatic family
  already has, and the label re-measures 5.93 / 5.80 / 5.59 light and 11.41 / 10.90 / 10.13 dark. The
  hovered-link dim (`--alpha-link-hover`, on the `link` Button, every rendered rich-text link through
  `prose`, and PropertyList) composited `success`/`info`/`warning` ink to 4.03–4.11:1 in light at 80%
  and is now 88%, re-measured 4.74–4.83:1. `--alpha-soft-hover` and `--alpha-soft-surface` are
  **removed**: their only consumer was that Bubble line, and `--alpha-soft-hover` was a second, 13pp
  different answer to the role `sd-hooks.mjs`'s `SUBTLE_HOVER_ALPHA` already owns.
  `--font-display` / `--font-pixel` are now bridged into `@theme inline`, so D17's sanctioned Geist
  Pixel flourish is reachable. Gates: `contrast-check.mjs` measures `brand-text` and the link-hover
  composite (both observed failing on the pre-fix theme); `design-lint` gains `fill-token-as-text` and
  `field-group-pairing`, both with negative fixtures; `verify-token-references` and `design-lint` now
  cover `packages/design/src`, where every shared recipe lives and where a bogus token previously
  exited 0; and `verify-docs-base-mirror` now mirrors the `::view-transition-*` reduced-motion
  companion rule the docs copy had silently lost.
  [docs](https://design.vegastack.com/docs/components/button)

- [#98](https://github.com/vegastack/vegastack-design/pull/98) [`2035023`](https://github.com/vegastack/vegastack-design/commit/2035023a124bde7a6fff673365ad8820e0794b55) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **28 new `lucide-animated` icons adopted — the mirror moves 439 → 467.** Upstream had drifted
  28 items ahead of the pinned manifest, and because `tooling/mirror-animated-icons.mjs` fails closed
  on an unexpected upstream item count, `--refresh` could not be run at all. The new items are
  `binary`, `cigarette`, `cigarette-off`, `circle-gauge`, `cloud-backup`, `cloud-sync`,
  `external-link`, `hat-glasses`, `leaf`, `leafy-green`, `link-2`, `monitor-cog`, `palette`,
  `plane-landing`, `plane-takeoff`, `server`, `server-cog`, `server-crash`, `ship-wheel`, `shredder`,
  `soup`, `spray-can`, `ticket`, `tree-deciduous`, `tree-pine`, `user-plus`, `waves-arrow-down` and
  `waves-arrow-up` — each `shadcn add @vegastack/icon-<name>`, each generated by the mirror rather
  than authored, and each inheriting the single `createAnimatedIcon` controller with its
  reduced-motion gate. None replaces an existing icon: the refresh removed nothing, the 439 pinned
  upstream and generated-module hashes are byte-identical, and every new item maps to its own
  `lucide-react` icon module rather than to an alias of one already mirrored. Registry items go
  568 → 596. `tooling/verify-animated-icons.mjs` gains two sanctioned Motion easings
  (`[0.25, 1, 0.5, 1]`, `[0.65, 0, 0.35, 1]`), two durations (0.12s, 0.32s) and a narrow
  staggered-duration form whose base and per-index step are each held to a sanctioned vocabulary; its
  `--self-test` grows to seventeen mutations, two of them new — an off-vocabulary stagger step, and a
  one-digit glyph edit inside one of the newly adopted modules.
  [docs](https://design.vegastack.com/docs/foundations/icons)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`AttachmentTrigger` shows a real focus indicator.** It dropped `outline-none` and a border
  tint as its only keyboard cue; the standard outline is drawn inset so the card's radius does not
  clip it. A border tint is the text-entry treatment, not a button's.
  [docs](https://design.vegastack.com/docs/components/attachment)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **AudioPlayer gains mute and a volume rail in both layouts.** Audio previously had no
  visible volume control at all and mute was reachable only from the M key. The rail is a vertical
  `Slider` opened from the mute button, rendered inline rather than portaled — the video frame is the
  fullscreen element, so a portal to `<body>` would put the rail outside it. The seek thumb is now
  hidden at rest only where a pointer can hover; on touch it stays visible, because otherwise there is
  no scrub affordance at all.
  [docs](https://design.vegastack.com/docs/components/audio-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`MediaPlayerControls` moved out of `audio-player` into its own registry item.** It was
  exported from `audio-player` even though the video player was its main consumer. Run
  `shadcn add @vegastack/media-player-controls` and import from `@/components/ui/media-player-controls`;
  `video-player` declares it as a registry dependency, so a fresh `shadcn add @vegastack/video-player`
  pulls it in automatically.
  [docs](https://design.vegastack.com/docs/components/media-player-controls)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Slider's internals are no longer restyled from outside.** Anything reaching into
  `[&_[data-slot=slider-track]]` / `-indicator` / `-thumb` to build a media rail should pass
  `variant="media"` or `variant="overlay"` with `thumb="hover"` instead. The internal slots keep their
  `data-slot` names, but their rest appearance is now the `variant`'s to decide.
  [docs](https://design.vegastack.com/docs/components/slider)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **The video player's tooltips and settings menu are visible in fullscreen.** They portaled
  to `<body>`, which the browser does not paint inside a fullscreen element — the playback-speed and
  quality menus were unusable in fullscreen. `MediaPlayerControls` takes a `portalContainer` and
  `VideoPlayer` passes its frame; the volume panel already avoided this by rendering inline.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **The video overlay's seek rail rests at its own thickness and thickens on engagement
  again.** Its `h-1` tied on specificity with the shared track's `h-1.5`, so Tailwind's sort order
  picked the default 6px rail and the hover/focus thickening had nothing to thicken from.
  [docs](https://design.vegastack.com/docs/components/slider)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **A viewer's chosen playback speed no longer resets while the media plays.** The
  media-element effect listed the consumer's `onTimeChange` among its dependencies; `timeupdate` fires
  ~4×/s and re-renders the controls, so a player given an inline callback re-applied
  `defaultPlaybackRate` several times a second and 2× snapped back to 1×.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`Image` lazy-loads and decodes off-thread by default.** `loading="lazy" decoding="async"`
  are now the defaults, matching what MarkdownView already did for its images. Pass `loading="eager"`
  for an above-the-fold hero, where deferring the fetch delays LCP rather than saving it.
  [docs](https://design.vegastack.com/docs/components/image)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Media chrome is theme-invariant.** The video overlay was built on `primary`, which flips
  with the theme — in dark it rendered a near-white scrim behind near-black icons. Scrim, pills and
  ink now come from `--media-scrim`, `--media-scrim-strong` and `--media-foreground`, which are the
  same values in both themes, and a compiled-CSS test pins scrim lightness under 0.3 with overlay ink
  over 0.85. Overlay controls are `IconButton variant="ghost" shape="round"` on the scrim.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Media controls keep the system's focus outline.** The `ring-2 ring-ring/50` glow that
  media invented for itself, and the forced-colours carve-out beside it, are gone; the standard 2px
  `:focus-visible` outline applies, inset with `-outline-offset-2` so an `overflow-hidden` frame
  cannot clip it. `tabIndex={0}` now appears only on genuinely scrollable regions.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`media-player-controls`** — the shared media transport, lifted out of `audio-player` (which
  owned the video player's controls too). It carries the control surface and `useMediaShortcuts`: ONE
  keyboard map for both players (Space/K play, J/L and arrows skip, M mute, F fullscreen), scoped
  `surface` vs `controls` so a shortcut can never steal a key from the focused control. The
  `assignRef` / `getMediaDuration` / `clampTime` helpers live here as well, instead of in a copy per
  player. `audio-player` drops from 1,431 lines to 305.
  [docs](https://design.vegastack.com/docs/components/media-player-controls)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`Slider` grows the props the players were faking with descendant selectors.** `variant`
  (`default · media · overlay · bare`), `orientation` (vertical is now supported and is how the volume
  rail is built), `thumb` (`always · hover · none`), `marks` and `showValue`. Every
  `[&_[data-slot=slider-*]]` override in the players is deleted.
  [docs](https://design.vegastack.com/docs/components/slider)

- [#65](https://github.com/vegastack/vegastack-design/pull/65) [`aa5fa0d`](https://github.com/vegastack/vegastack-design/commit/aa5fa0d56884c2690dc00fa5adfd0d31ad199bcd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`VideoPlayer` gains `controlsVisible`.** `true` pins the overlay open and `false` keeps it
  closed, for kiosk players — and for static fixtures, since the auto-reveal never fires without a
  pointer and the docs page therefore never showed the video controls.
  [docs](https://design.vegastack.com/docs/components/video-player)

- [#64](https://github.com/vegastack/vegastack-design/pull/64) [`2a3fc24`](https://github.com/vegastack/vegastack-design/commit/2a3fc24196b2a94171bce34478cd18a792bdc550) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Rich text is one recipe**, and the bars that promise arrow-key traversal now implement it.

  - **MarkdownView and TextEdit share the `prose` recipe.** Both restated the same heading, paragraph,
    list, quote and code recipe in their own grammar and had already drifted (`h4`–`h6`, tables and
    images existed on one side only). They now wear the same class from `@vegastack/design`, so
    rendered markdown and edited rich text are one typography — asserted structurally: a unit test
    requires every rule of the recipe on both roots, and no typography of their own.
    TextEdit's fenced-code block stops being a third copy of `CodeBlock`'s surface,
    and the editor's links no longer all light up when the editor itself is hovered.
  - **TextEdit's formatting row is a Base UI `Toolbar`** — one tab stop, arrow keys across three
    labelled groups, `Shift`+`Tab` out. It was a `role="toolbar"` of eight independent tab stops.
  - **ActionBar is a Base UI `Toolbar`** with new `ActionBarButton` and `ActionBarSeparator` parts.
    Compose the actions from them: a toolbar builds its single tab stop from the items that register
    with it, so a bare `<Button>` renders but keeps its own tab stop.
  - **ActionBar and MessageScrollerButton use the shared `motion-dock-in` / `motion-dock-out` pair**
    instead of two copies of a recipe that exited more slowly than it entered, with a scale on a bar
    that slides off its own edge.
  - **MessageScrollerButton defaults to `variant="outline"`** with no inline colour override — after
    the Button matrix, `outline` already is a page-coloured face with the one hairline and the
    surface-ladder hover.

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **dashboard-01's KPI labels no longer truncate.** Every stat label was cut at the 2-column width
  ("Active agen…", "Tasks compl…", "API calls (24…"). The label now wraps to two lines across the full
  header and the trend badge sits on the value row, beside a short mono figure; the header breadcrumb
  collapses at `maxItems={2}` so it stays one line at 320px.
  [docs](https://design.vegastack.com/docs/blocks/dashboard-01)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **`useIsMobile` reported `false` on the server**, so SSR rendered the desktop layout on a phone
  until the effect ran — Board enabled pointer drag and then disabled it. It now renders the
  `serverFallback` the caller declares. `usePlatform`'s `isTouch` was frozen at the post-hydration
  value; the primary pointer can change mid-session — a 2-in-1 detaching its keyboard — and a drag
  affordance gated on `isTouch` has to follow it, so that half is now the live `(pointer: coarse)`
  query.
  [docs](https://design.vegastack.com/docs/guides/components)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **ParticleField froze the brand colour of the theme it mounted in.** The ink was read once, into
  a `const`, inside an effect keyed on nothing the theme touches — so a light-mounted field kept the
  light `--brand` after a toggle to dark until something forced a remount. It now reads the canvas's
  own resolved `color` per frame, and the single static reduced-motion frame repaints on a theme
  change too.
  [docs](https://design.vegastack.com/docs/components/particle-field)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **LogoRow shows marks, not links.** The underline is gone — wordmarks rest in
  `text-muted-foreground` and lift to `text-foreground` on hover, because a wall of underlined text
  reads as a paragraph of links. Cell seams are logical (`-ms-px border-s`), so RTL keeps its inner
  rules instead of doubling the outer edge, and `wallColumns` is now a MAXIMUM over an `auto-fill`
  track with an 8rem cell floor: a 4-column wall at 320px gave 80px cells and clipped every mark.
  [docs](https://design.vegastack.com/docs/components/logo-row)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **PlanCard's promoted plan is a ladder rung, not a border colour.** It now lifts onto `surface-3`
  with its hairline tinted `primary` at `--alpha-outline-border`. A full-strength `border-primary`
  read as the active/invalid state of a form control — the wrong signal on a card someone is being
  invited to choose.
  [docs](https://design.vegastack.com/docs/components/pricing-section)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`mergeRefs` no longer ships from the `use-animation-replay` registry item, and
  `media-player-controls` no longer exports `assignRef`.** Both were spellings of the same merge; the
  one implementation now lives in `@vegastack/design` and every registry file imports it there
  alongside `cn`. `grep -rn 'typeof ref === "function"' packages/ui/registry/ui` is 0.
  [docs](https://design.vegastack.com/docs/guides/components)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`SettingsSection` gained `titleAs`** (`h2`…`h6`, default `h3`). A settings page nests sections
  at different depths, and a hard-coded `<h3>` everywhere breaks heading navigation. The visual size is
  unchanged; only the document structure moves.
  [docs](https://design.vegastack.com/docs/components/settings-row)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **StaggeredTextReveal waits for the scroll** (`whenVisible`, on by default). A reveal below the
  fold used to finish before anyone scrolled to it. The gate only ever REMOVES the reveal — the
  server-rendered markup animates and the client pulls off-screen words back before the first paint —
  so a page whose JavaScript never runs still shows its text.
  [docs](https://design.vegastack.com/docs/components/staggered-text-reveal)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Testimonial takes its quotation marks from CSS.** The quote renders inside a `<q>`, so the
  browser inserts the pair the ACTIVE language uses (`„…“`, `« … »`, `「…」`) instead of the hard-coded
  English `“…”` — which also kept the marks out of the copied text.
  [docs](https://design.vegastack.com/docs/components/testimonial)

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`use-media-query`** — the system's one `matchMedia` subscription, on `useSyncExternalStore`
  with a caller-declared `serverFallback`. Five files each hand-rolled the same `useState(false)` +
  `useEffect` shape, and every one of them reported `false` on the server, so a phone rendered the
  DESKTOP branch of every JS-driven layout until an effect ran. Ships `usePrefersReducedMotion` as its
  named reduced-motion reader; `useIsMobile` and `usePlatform`'s touch half are now one-liners over it.
  [docs](https://design.vegastack.com/docs/guides/components)

- [#73](https://github.com/vegastack/vegastack-design/pull/73) [`fdaed05`](https://github.com/vegastack/vegastack-design/commit/fdaed057ba85871fe99849a2cdaea0bdc3d5ee14) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **The collapsed-breadcrumb trigger was a 20×20 pointer target.** Its visible box was the 20px
  `BreadcrumbEllipsis` glyph and nothing expanded it, so the one control that reveals a trail's
  hidden segments sat under the WCAG 2.5.8 24×24 CSS px floor — measured 20.00×20.00 on all three
  breadcrumb fixtures. `BreadcrumbCollapsed`'s trigger now carries a transparent `::before`
  expansion (`relative before:absolute before:-inset-0.5`) that brings the EFFECTIVE target to
  exactly 24×24 with no change to the visible glyph and no change to the trail's line height; 2px per
  side stays inside `BreadcrumbList`'s 6px gap, so it never reaches into a neighbouring segment.
  `BreadcrumbEllipsis` is decorative and stays 20px — its doc comment now says the wrapping trigger
  owns the target, and the manual-composition example demonstrates it.
  [docs](https://design.vegastack.com/docs/components/breadcrumb)

- [#73](https://github.com/vegastack/vegastack-design/pull/73) [`fdaed05`](https://github.com/vegastack/vegastack-design/commit/fdaed057ba85871fe99849a2cdaea0bdc3d5ee14) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Four navigation and layout accessibility defects.** **`BreadcrumbPage` announced the current
  page as a disabled link** — it rendered `<span role="link" aria-disabled="true">`, so screen readers
  described a non-interactive segment as a dimmed link; it is a plain `<span aria-current="page">`,
  and the ARIA misuse was inherited from shadcn. **Focus rings were clipped on scroll viewports** —
  `ScrollArea`'s and `MessageScroller`'s viewports and the sidebar rail offset their focus outline
  OUTWARD under a clipping ancestor, so the ring was cut in half or lost; all three inset it now.
  **Every shell and sidebar docs fixture rendered a duplicate `<main>`** inside the docs page's own,
  failing axe's `landmark-no-duplicate-main`; they render `landmark="region"`. And **`TabsContent`,
  `BreadcrumbCollapsed`'s trigger and `AppShell`'s skip link each restated the global
  `:focus-visible` rule** — two copies of one rule can only drift, so the copies are gone.
  [docs](https://design.vegastack.com/docs/components/breadcrumb)

- [#73](https://github.com/vegastack/vegastack-design/pull/73) [`fdaed05`](https://github.com/vegastack/vegastack-design/commit/fdaed057ba85871fe99849a2cdaea0bdc3d5ee14) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Navigation and layout take one selection recipe and one hover geometry.** **Tabs**,
  **Segmented**, **Toggle** and **ToggleGroup** move onto the shared `selectedChipVariants` recipe
  from `@vegastack/design`, and a **selected** chip now hovers and presses again — it used to be
  excluded from both by `not-data-pressed:*`/`not-data-[active]`, so the one chip a user is most
  likely to click was the one that answered nothing. The **Tabs `line`** trigger's hover wash used to
  end exactly on the rule the underline indicator rides along, in both orientations; it is held one
  4px step off it with a logical margin, so the vertical variant mirrors onto the inline-start rail
  and RTL follows for free. **`SidebarProvider`** gains `persist` (default `true`) around the cookie
  write: `persist={false}` keeps the component out of `document.cookie` entirely and `onOpenChange`
  fires either way, so a host under a consent regime persists the state itself and loses nothing — the
  docs section is renamed from "SSR persistence" to "Persistence". **`ScrollArea`**'s viewport is a
  tab stop only once its content actually overflows, measured on mount and on resize; Board's column
  viewports inherit it. **`AppShellContent`** and **`SidebarInset`** gain `landmark="region"`, which
  renders a `<div role="region">` instead of a `<main>` for a shell embedded in a page that already
  owns one. **`SidebarTrigger`** is an `IconButton` rather than a hand-rolled `useRender` button, so
  it inherits the one box, ink and hover/pressed grammar, and **`PageHeader`**'s back affordance swaps
  its physical `-ml-2` for a logical `-ms-2`. **`PageHeader`**'s active favourite star fills with
  `foreground` instead of `warning` ink, which read as caution on a control that means "I marked
  this".
  [docs](https://design.vegastack.com/docs/components/tabs)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`AlertDialogContent intent`** — it wrote a `data-intent` hint and nothing else, leaving
  two props named for one concept with one of them inert. `AlertDialogAction intent` is the single
  owner of a confirmation's tone.
  [docs](https://design.vegastack.com/docs/components/alert-dialog)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`floating-surface`** — the shared floating-overlay module every anchored overlay now
  composes: one `Portal → Positioner → Popup (→ Viewport)` composer, one theme-scope hand-off across
  the portal boundary, one arrow, and four painted surfaces (`panel` at the 16px tier, `menu` at list
  density, `tooltip` as the inverted ink chip, `navigation` for the morphing mega-menu). It also owns
  `menuItemVariants` — the one list-item recipe behind menu items, select options, combobox options and
  command rows — and `PanelSearchFrame`, the in-panel search row.
  [docs](https://design.vegastack.com/docs/components/floating-surface)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Menu items take `tone`, not `variant`.** `DropdownMenuItem`, `ContextMenuItem` and
  their checkbox/radio siblings use `tone="destructive"`, matching Button's tone axis. The state
  attribute moves with the prop: items expose `data-tone`, not `data-variant`.
  [docs](https://design.vegastack.com/docs/components/dropdown-menu)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **Hand-written `100dvh` overlay height calcs** — replaced by
  `--layout-overlay-max-height` and Base UI's `--available-height`.
  [docs](https://design.vegastack.com/docs/components/dialog)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Popover** and **Select** document their modality. Both are modal by default so the page
  cannot scroll out from under an open panel; pass `modal={false}` for a lightweight one. Combobox
  stays non-modal and says why in its source.
  [docs](https://design.vegastack.com/docs/components/select)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Overlay motion follows one measured scale.** Every floating surface enters and leaves at
  `duration-fast` (150ms); NavigationMenu takes `duration-base` (200ms) because it resizes between
  items rather than simply appearing; the modal family — Dialog, AlertDialog, Sheet — is
  `duration-base`. Timings were measured against Vercel and Linear rather than chosen.
  [docs](https://design.vegastack.com/docs/foundations/motion)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Overlay padding has two tiers, not per-surface literals.** 24px (`p-6`) for Dialog,
  AlertDialog and Sheet; 16px (`p-4`) for Popover and HoverCard; menus keep list density. Panel widths
  come from `--panel-width-*`, and a viewport-capped popup uses Base UI's `--available-height` instead
  of a hand-written `100dvh` calc. `DialogContent` and Command size through `size`.
  [docs](https://design.vegastack.com/docs/components/dialog)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Popover**, **HoverCard**, **Tooltip**, **DropdownMenu**, **ContextMenu**, **Select**,
  **Combobox**, **NavigationMenu** — eight lookalike overlays became one module. Each now composes
  `floating-surface` instead of restating its own portal, positioner, popup surface, arrow and
  theme-scope plumbing. `ContextMenu` is bound to the same item parts as `DropdownMenu` through
  `createMenuParts` (Base UI's `ContextMenu` namespace re-exports `Menu`'s parts verbatim), so the two
  menus can no longer drift.
  [docs](https://design.vegastack.com/docs/components/floating-surface)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **In-panel search fields are a `searchbox`.** Every panel-search row renders
  `type="search"`, so `ShortcutOverlay`'s filter (and any other field inside the shared row) exposes the
  `searchbox` role rather than a generic textbox. Selecting one by role in a test or script must change
  with it.
  [docs](https://design.vegastack.com/docs/components/shortcut-overlay)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Command**, **Combobox**, **EmojiPicker**, **ShortcutOverlay** — the in-panel search row
  is one recipe. A bordered `Input` inside a bordered popup drew two borders; `PanelSearchFrame` is a
  sticky, full-bleed header row with a leading glyph, no box of its own and a hairline below.
  [docs](https://design.vegastack.com/docs/components/command)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Sheet` runs on Base UI's `Drawer`.** It gains swipe-to-dismiss, snap points (`snapPoints` /
  `snapPoint` / `onSnapPointChange` pass straight through) and `SheetVirtualKeyboardProvider` for
  bottom sheets containing fields. `side` moves from `SheetContent` to the `Sheet` root, because it
  selects the dismiss gesture as well as the pinned edge, and a `side` on the content could disagree
  with the gesture. `SheetContent` now sizes through `size` — `sm · md · lg · full` from the shared
  `--panel-width-*` vocabulary replaces `className` width overrides, and one tier means a width on a
  `left`/`right` sheet and a height on a `top`/`bottom` one. Swipe is always an addition: `Esc`, the
  close button and a backdrop press still close the panel.
  [docs](https://design.vegastack.com/docs/components/sheet)

- [#90](https://github.com/vegastack/vegastack-design/pull/90) [`d5e2de2`](https://github.com/vegastack/vegastack-design/commit/d5e2de2b3ea2f3e74bab8548b0a5e9fd1d4a1d99) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Toasts run on Base UI, and the `toast()` API changed with them.** `sonner` is removed from the
  system and the registry item is renamed `sonner` → `toast`. `toast()` now takes a title plus Base
  UI's options: `action: { label, onClick }` becomes `actionProps: { children, onClick }`, `duration`
  becomes `timeout` (and `0`, not `Infinity`, disables auto-dismiss), and ids are strings.
  `toast.message` is gone — it was `toast()`. `toast.custom` now renders the toast BODY inside a real
  toast, so a custom notification keeps stacking, swipe-to-dismiss, `Escape` and the live region
  instead of opting out of them. Resolving a loading toast is `toast.update(id, …)` rather than
  re-firing with the same id. `Toaster` loses sonner's props: `position` values are logical
  (`bottom-end`, not `bottom-right`), `expand` is gone because the stack expands on hover by design,
  and `offset` / `mobileOffset` / `theme` are gone — the viewport carries the safe-area insets itself
  and reads the theme from the cascade. `VegaStackProvider` always mounts the toast context now:
  `toaster={false}` still suppresses the visible viewport — the part that must not mount twice — but
  the provider `toast()` writes into is unconditional, so a host rendering its own `<Toaster />`
  shares one queue. `@vegastack/design` gains `TIMINGS.tooltipOpenDelayMs` /
  `TIMINGS.tooltipCloseDelayMs`, which the provider applies to `Tooltip.Provider` so every tooltip in
  an app shares one rhythm. `@vegastack/design-tokens` gains a third z band, `--z-toast` (60): the
  toast viewport mounts with the app provider, before any dialog exists, so DOM order alone would put
  every later-opened dialog on top of it — and a toast fired from inside a modal must stay visible.
  Sonner supplied that from its own private z-index, which is why elevation doctrine carried a
  library-shaped exception; it is now a token with exactly one caller.
  [docs](https://design.vegastack.com/docs/components/toast)

- [#75](https://github.com/vegastack/vegastack-design/pull/75) [`45cde26`](https://github.com/vegastack/vegastack-design/commit/45cde26d287595d2a0d4d2413320d004badd1f0d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 The **DatePicker caption dropdown** was a 21px-tall pointer target. `captionLayout="dropdown"`
  renders a transparent `<select>` stretched over the caption root (`absolute inset-0`), and that root
  — an `items-center` child of a 32px row — collapsed to its 21px line box, so the real control
  measured 50.36×21.00 against the system's 24px effective-target floor (WCAG 2.2 §2.5.8). The root now
  takes `self-stretch`, handing the select the row's full height. Nothing in that root paints, so the
  month/year label and its chevron are pixel-identical. Its entry in the geometry lane's `EXCLUDED`
  map is deleted. [docs](/docs/components/date-picker)

- [#75](https://github.com/vegastack/vegastack-design/pull/75) [`45cde26`](https://github.com/vegastack/vegastack-design/commit/45cde26d287595d2a0d4d2413320d004badd1f0d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`CountrySelect` / `RegionSelect` internals.** `COUNTRIES`, `Country`, `getCountryByCode`,
  `REGIONS_BY_COUNTRY`, `Region`, `getRegionsByCountry` and `hasRegions` are no longer exported from
  `country-select` / `region-select`, and `region-select-data.ts` is gone — import `COUNTRIES`,
  `REGIONS`, `getCountryByCode` and `getRegions` from `@/lib/geo-data` (`getRegionsByCountry` →
  `getRegions`; `hasRegions(c)` → `getRegions(c).length > 0`). `RegionSelect` no longer clears by
  re-selecting the current state; clearing is the explicit `clearable` control on the trigger, on by
  default. Both selects now render a wrapper, so `data-slot="country-select"` / `"region-select"` is
  on the wrapper and the trigger carries the `-trigger` suffix.
  [docs](/docs/components/region-select)

- [#75](https://github.com/vegastack/vegastack-design/pull/75) [`45cde26`](https://github.com/vegastack/vegastack-design/commit/45cde26d287595d2a0d4d2413320d004badd1f0d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **DatePicker, Board and Dropzone.** DatePicker and DateRangePicker triggers are `w-full` like
  every other form control: the fixed `w-56` and `w-72` were the only fixed-width controls in the
  system and overflowed a 320px content area. The calendar caption is now a real `auto 1fr auto` grid
  (`navLayout="around"`) instead of an absolutely positioned nav over a `px-7` clearance, and the
  selected day carries a pressed rung (`hover:bg-primary-hover active:bg-primary-active`) instead of
  pinning its rest fill. Board's grab cursor appears only where a pointer drag can actually start and
  its column body height is the new `columnMaxHeight` prop. Dropzone paints the drag-over state on its
  own surface, so a dropzone wrapping anything other than an `Empty` finally shows one, and a new
  `dragState` prop paints either state for documentation and automated checks.
  [docs](/docs/components/date-picker)

- [#75](https://github.com/vegastack/vegastack-design/pull/75) [`45cde26`](https://github.com/vegastack/vegastack-design/commit/45cde26d287595d2a0d4d2413320d004badd1f0d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`geo-data` and `drag-item`** — the first two `registry:lib` items: plain `.ts` modules that
  install under a consumer's `lib` alias and are pulled in automatically as dependencies. `geo-data`
  holds the ISO 3166-1 country list, the states/provinces map and their two lookups, so a consumer
  installing both geography selects copies the data once (`region-select.json` 67 KB → 7.4 KB).
  `drag-item` holds the one visual recipe for a `use-drag-reorder` item — drop-edge hairlines, lift
  dim, pending shimmer — which `Board` and `SortableList` had each copied.
  [docs](/docs/guides/components)

- [#75](https://github.com/vegastack/vegastack-design/pull/75) [`45cde26`](https://github.com/vegastack/vegastack-design/commit/45cde26d287595d2a0d4d2413320d004badd1f0d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`searchable-select`** — the one Select-shaped Combobox preset: a full-width trigger, the shared
  in-panel search row, a check on the selected row, a `--anchor-width` panel and an optional clear
  control. `CountrySelect` and `RegionSelect` are now thin data-fed wrappers over it. Two rules it
  exists to hold: selection runs through Base UI's `value`/`onValueChange` and nothing else (the old
  `RegionSelect` computed the value inside each row's click handler with the root deliberately
  unwired, so keyboard <kbd>Enter</kbd> and a pointer click reached it by two different paths), and
  the clear control is a SIBLING of the trigger, never a child, because an interactive control may not
  contain another. [docs](/docs/components/searchable-select)

- [#61](https://github.com/vegastack/vegastack-design/pull/61) [`6d25185`](https://github.com/vegastack/vegastack-design/commit/6d2518573d9e375d333d5a88cba2d2969ffd1160) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **A table's selection checkbox did not own its own 24px hit area.** `TableHead` and `TableCell`
  collapsed the trailing padding of a checkbox column to `pe-0`, so the checkbox's 6px `::before`
  overhang fell outside its own cell — the neighbouring header's sort control owned part of the
  centred 24×24 square. Both cells now use `pe-2`, the least that contains the target, and the sort
  control no longer carries a negative inline margin (`SortableHead` narrows its own cell padding
  instead, so the label alignment is unchanged).
  [docs](https://design.vegastack.com/docs/components/table)

- [#61](https://github.com/vegastack/vegastack-design/pull/61) [`6d25185`](https://github.com/vegastack/vegastack-design/commit/6d2518573d9e375d333d5a88cba2d2969ffd1160) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`data-table-parts`** — the chrome `DataList` and `DataGrid` had each grown separately: the sort
  header, the select-all / per-row selection arithmetic, the skeleton rows, the empty row and the
  column class rules, twice each. They now come from one registry item, installed automatically with
  either renderer through `registryDependencies`. `SortableHead` and `SortHeaderButton` compose the
  system `Button` instead of a hand-rolled `<button>`, and emit `aria-sort` on every sortable column
  (`"none"` included). The doctrinal split is unchanged — `DataList` stays presentational, `DataGrid`
  keeps its engines.
  [docs](https://design.vegastack.com/docs/components/data-table-parts)

- [#61](https://github.com/vegastack/vegastack-design/pull/61) [`6d25185`](https://github.com/vegastack/vegastack-design/commit/6d2518573d9e375d333d5a88cba2d2969ffd1160) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Two focus rings that never painted.** Charts were focusable with no visible ring — recharts'
  `accessibilityLayer` makes the plot `<svg>` a tab stop, and `ChartContainer`'s own
  `.recharts-surface` outline reset then poisoned `--tw-outline-style` on the very element that takes
  focus, so even the global `:focus-visible` rule resolved to `outline-style: none`. The reset is now
  scoped to `:not(:focus-visible)`. And the `DataGrid` roving cell's ring was clipped, because the
  cell lives inside the table's scroll viewport, which clips its overflow — it is now inset.
  `PropertyList` values stop truncating for the same reason: the `overflow: hidden` that `truncate`
  implies was clipping the focus ring of any link inside a value.
  [docs](https://design.vegastack.com/docs/components/chart)

- [#61](https://github.com/vegastack/vegastack-design/pull/61) [`6d25185`](https://github.com/vegastack/vegastack-design/commit/6d2518573d9e375d333d5a88cba2d2969ffd1160) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`Table`, `DataList`, `DataGrid`, `ComparisonMatrix`, `Terminal`** — a scroll viewport is now a
  named, keyboard-reachable region, and it is measured rather than guessed. A wide table could
  previously only be scrolled with a pointer (axe `scrollable-region-focusable` on the Table page and
  the dashboard block), while `ComparisonMatrix` and `Terminal` carried an unconditional tab stop that
  was dead on every instance that fits. Each viewport now measures itself through `useOverflow` and
  takes a tab stop **only while it can actually scroll**; name it with `scrollLabel` (falling back to
  the table's `aria-label`) and it is exposed as `role="region"`, unnamed it stays a plain focusable
  container. Its focus outline is inset, because the viewport clips its own overflow. Names and roles
  do not move with the measurement — `Terminal`'s name and `group` role stay unconditional. `Table`
  and `Terminal` both stay server-safe: the measurement lives in a `'use client'` leaf
  (`table-scroll-region.tsx`, `terminal-body.tsx`).
  [docs](https://design.vegastack.com/docs/components/table)

- [#61](https://github.com/vegastack/vegastack-design/pull/61) [`6d25185`](https://github.com/vegastack/vegastack-design/commit/6d2518573d9e375d333d5a88cba2d2969ffd1160) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **`DataGrid`, `DataList`, `Table`, `PropertyList`, `Chart`** — the rest of the table-family pass.
  `DataGrid` gains `columnPicker` (default `true`): the "Columns" picker used to render whenever the
  grid had any columns — i.e. always, even for a three-column read-only grid — and it now sits in the
  toolbar's trailing slot beside the hidden-columns hint. `DataList` and `DataGrid` gain a `mono`
  column flag (mono numeral face plus `tabular-nums`, `nowrap` by default) and a `nowrap` flag;
  together with the shared chrome that is 249 fewer lines across the two files. `TableRow` no longer
  tints the header row on hover — it styles every row it renders, including the header row the two
  renderers build with it, so hovering a header washed it as if it were actionable. `PropertyList`
  becomes a container query: the label track was a fixed 112px regardless of the pane, and is now
  content-sized above an 80px floor at `@xs` and stacked below it, with values wrapping instead of
  truncating. `Chart` moves axis labels from 11px to 12px (11px is reserved for mono) with the
  numerals on the mono `text-code-sm` tier, and the tooltip follows.
  [docs](https://design.vegastack.com/docs/components/data-grid)

- [#61](https://github.com/vegastack/vegastack-design/pull/61) [`6d25185`](https://github.com/vegastack/vegastack-design/commit/6d2518573d9e375d333d5a88cba2d2969ffd1160) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Table cells wrap by default.** Every head and cell carried `whitespace-nowrap`, so one long
  value forced the whole table to scroll instead of wrapping at a word boundary. Body cells now use
  `overflow-wrap: anywhere` over a `--table-cell-min-width` floor, and scrolling is reserved for
  tables that are genuinely wide. Two column shapes opt back out automatically — `align="end"` figures
  and the new `mono` columns — and `DataListColumn.nowrap` / `DataGridColumn.nowrap` override the
  inference either way. A layout that relied on single-line cells should set `nowrap: true` (or
  `whitespace-nowrap` on a raw `TableCell`). Two further breaks land with it: `DataGrid`'s `mobile`
  posture now defaults to `"merge"` rather than `"hidden"`, so overflow columns stack into the primary
  cell instead of disappearing — `mobile: "hidden"` is still available, and when it drops anything the
  toolbar states "N columns hidden"; and `Table`'s `containerClassName` is removed, because it did
  exactly what `containerProps.className` does.
  [docs](https://design.vegastack.com/docs/components/table)

- [#61](https://github.com/vegastack/vegastack-design/pull/61) [`6d25185`](https://github.com/vegastack/vegastack-design/commit/6d2518573d9e375d333d5a88cba2d2969ffd1160) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`use-overflow`** — the system's one overflow measurement, live across resizes AND content
  growth: it observes the element and its children, so a table widening inside a fixed viewport is not
  missed. It backs `TruncatedText`'s clipping check, the `Table` scroll region's focusability,
  `ComparisonMatrix` and `Terminal`'s command pane.
  [docs](https://design.vegastack.com/docs/components/table)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **EditableCell**, **ChipInput**, **DataGrid**, **CopyButton**, **SortableList**,
  **Board**, **Dropzone** — all announce through `use-announcer`, one live region each, replacing five
  identical hand-rolled `{ text, seq }` regions plus CopyButton's. EditableCell's visible status slot is
  no longer itself a live region, so it stops announcing its own icon swaps. `Pagination`'s
  `PaginationLink` takes its hover and pressed steps from `surfaceInteractive` instead of restated
  `hover:bg-surface-2` / `active:bg-surface-3` literals.
  [docs](https://design.vegastack.com/docs/components/editable-cell)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`useDragReorder` and `useFileDrop` return `Announcer`, not `getLiveRegionProps()`.** Render
  `<reorder.Announcer />` / `<drop.Announcer />` in place of
  `<span {...reorder.getLiveRegionProps()} />`. The props-getter shape could not keep the region
  mounted across an announcement, which is the property that makes it audible.
  [docs](https://design.vegastack.com/docs/components/sortable-list)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Tag**, **FilterChip**, **ComboboxChip**, **ChipInput**, **TagGroup** — all now compose
  the `chip` primitive. Three consequences are visible: a `Tag` is 28px rather than 20px and a
  `FilterChip` is a pill rather than a rounded rectangle (chips are `rounded-full` by doctrine); the
  neutral chip rests on `surface-1` and an applied filter sits on `surface-2` instead of the `accent`
  alias; and every remove control is the same 24×24 target. That last one fixes `ComboboxChipRemove`, a
  bare 16px box with no hit-area expansion at all (a WCAG 2.5.8 failure), and retires `Tag`'s
  `::before` hit area, which a nested native `<button>` clipped and so never actually expanded
  anything. TagGroup's `+N` overflow control is itself a chip, so the whole 28px pill is the pointer
  target and its hover/pressed steps come from the shared `surfaceInteractive` recipe rather than a
  hand-written descendant selector.
  [docs](https://design.vegastack.com/docs/components/chip)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`chip`** — THE labelled pill, and the only one. `hue` (10 decorative tag hues, or neutral) ×
  `size` (`sm` 28px inline · `md` 32px control-scale) × `active` (the neutral chip's promotion to the
  `surface-2` selection rung), with `onRemove` mounting a round ghost `IconButton size="xs"` whose
  **real** border box is 24×24. `Tag`, `FilterChip`, `ComboboxChip` and ChipInput's chips are all this
  one primitive composed through Base UI `render`.
  [docs](https://design.vegastack.com/docs/components/chip)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`Pagination` no longer hard-codes its accessible name.** It renders a plain `<nav>`
  (no `role="navigation"`) and `aria-label` defaults to "Pagination". A page with more than one pager
  must name each one — two identically named landmarks are an axe `landmark-unique` failure.
  [docs](https://design.vegastack.com/docs/components/pagination)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`TagHue`** — the hue vocabulary moved to the Chip primitive and is exported as
  **`ChipHue`** from `@vegastack/chip`. `Tag`'s `hue` prop is unchanged; only the type's name and home
  moved.
  [docs](https://design.vegastack.com/docs/components/chip)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`use-announcer`** — the one polite live region. Destructure `announce` and `Announcer`
  from `useAnnouncer()` and render the `Announcer` element once per component. It keeps the region
  mounted and observed from first paint, re-keys it per call so an identical consecutive announcement
  is still spoken, and holds its state outside the host so announcing no longer re-renders a whole
  DataGrid.
  [docs](https://design.vegastack.com/docs/guides/components)

### Patch Changes

- [#118](https://github.com/vegastack/vegastack-design/pull/118) [`78ed487`](https://github.com/vegastack/vegastack-design/commit/78ed48741747429211c1ab3a25f914fe348ae076) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 **The `input` and `textarea` summaries no longer promise a focus ring they never had.** Both
  text-entry controls signal focus with a border tint, not an outline — that is the rule in
  [Accessibility](https://design.vegastack.com/docs/foundations/accessibility) and it is what the
  shared field recipe implements — but `component-contracts.json`, the machine authority that feeds
  the shipped design-system skill, still described "a focus-visible ring" for each. Both summaries are
  corrected, so an agent reading the packaged skill roster is told what the components actually do.
  The other 114 component summaries were audited for the same class of claim and hold.

  Doctrine, in the same pass: `react-markdown` and `remark-gfm` are now sanctioned renderer engines
  rather than an undocumented exception, and two version decisions are written down with their
  evidence — TypeScript stays at 6.0.3 while no shipped `typescript-eslint` supports TypeScript 7, and
  `tw-animate-css` stays bundled in `preset.css` because it is consumer-facing API that
  [Quickstart](https://design.vegastack.com/docs/guides/quickstart) and
  [Troubleshooting](https://design.vegastack.com/docs/guides/troubleshooting) both document.

- [#54](https://github.com/vegastack/vegastack-design/pull/54) [`d5c960a`](https://github.com/vegastack/vegastack-design/commit/d5c960a3e704f730893303fe0aef1d4b49812ce3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **`verify-component-contracts --write-data-attributes`** records each registry part's
  `data-*` attributes and CSS variables in `component-contracts.json`, extracted from the canonical
  source through the TypeScript AST, so the docs API tables and the agent markdown export list them.
  The default mode fails when the contract drifts from the source, and a `--self-test` drifts a
  `dataAttributes` record in memory and requires the reconciliation to reject it — so the gate cannot
  pass by never having run.
  [docs](https://design.vegastack.com/docs/components/dialog)

- [#108](https://github.com/vegastack/vegastack-design/pull/108) [`c352ba9`](https://github.com/vegastack/vegastack-design/commit/c352ba92c213e178d411e435e36fda2eac0e49a8) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 **A component page's `status` and `since` are now machine authorities, not hand-typed prose.**
  Both are recorded per component in `packages/ui/component-contracts.json`, written onto the page by
  `pnpm design:derived`, and compared against the contract by `tooling/content-lint.mjs`, so a page
  cannot claim a status or an origin version the contract does not hold. `status` was 116 identical
  `stable` strings with nothing behind them; every component is genuinely `stable` — each has a
  registry item, a docs page, a preview and required test coverage, and no ledger, changelog or source
  records a deprecation or a preview-quality component. `since` was derived once from
  `git log --follow` and is now pinned data, never computed: the values were verified against
  /CHANGELOG.md's enumerated release lists (0.2.0 1/1, 0.3.0 12/12, 0.4.0 12/12, 0.5.0 2/2) and
  against `packages/ui/registry.json` as it stood at each release commit (0.1.0 82/82). That check
  corrected one page — **MediaPlayerControls** now reads `since: 0.7.0`, not 0.5.0: `--follow` had
  walked into the `audio-player` source it was extracted from, while the item itself has never
  shipped. A component authored between releases carries the next version, and
  `tooling/version-sync.mjs` re-stamps it at version time with the version actually being released, so
  a different bump than the author guessed cannot publish a wrong `since`.
  [docs](https://design.vegastack.com/docs/components/media-player-controls)

- [#111](https://github.com/vegastack/vegastack-design/pull/111) [`6a5a49e`](https://github.com/vegastack/vegastack-design/commit/6a5a49e4da7d48bf2ac6ee583e587b4ffccf0e8a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **A `Timeline`'s last row lost the bottom of its pointer target.** `TimelineItem`'s `<li>` uses
  `content-visibility: auto` for render skipping, which brings paint containment with it, so anything
  a child paints outside the box is clipped and stops being hit-testable. `timeline-content` dropped
  its bottom padding on the last item, and a trailing `RelativeTime` — whose 24px pointer target comes
  from a 4px `before:-inset-y-1` overhang — had that overhang fall outside the clip: the effective
  target collapsed to the row's own 23px, under the WCAG 2.2 SC 2.5.8 floor. The last row now keeps
  4px of bottom padding, exactly the depth of that hit area. Trailing whitespace under the final row
  grows by 4px; nothing else moves.
  [docs](https://design.vegastack.com/docs/components/timeline)

- [#110](https://github.com/vegastack/vegastack-design/pull/110) [`1b11aa1`](https://github.com/vegastack/vegastack-design/commit/1b11aa1f7e65d9e66f9f50f28e8db47a09a6402b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Pointer targets** — nine WCAG 2.2 §2.5.8 misses recorded by the geometry lane are closed at
  the root. `IconText`'s row and a `Marker` rendered as a link or a button each carry an invisible
  hit area, so a clipped row and an action marker measure 24px to the pointer and not one pixel
  differently to the eye. In the docs, the attachment demo composed its actions above the card
  trigger — the reverse of the documented order, which made the remove button unclickable — the
  scroll-fade demos now reflow at 320px instead of scrolling the page sideways, and the
  message-scroller outline entries sit on a target-sized pitch. The lane itself learned two facts it
  was missing: an `inert` control accepts no pointer action, and a `role="tabpanel"` is not a target.
  [docs](https://design.vegastack.com/docs/components/truncated-text)

- [#117](https://github.com/vegastack/vegastack-design/pull/117) [`1e439d9`](https://github.com/vegastack/vegastack-design/commit/1e439d985b8f4b6ac545db76b09c036e2481d804) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Toasts appear again, and three appearance-probe defects close.** The docs site mounted the
  registry copy-in `Toaster` under the package provider's `ToastProvider`, and each toast module owns
  a module-scope manager — so the viewport listened to one store while every preview's `toast()` wrote
  to the other, and the [Toast](https://design.vegastack.com/docs/components/toast) page had been
  silently dead since toasts moved to Base UI. The copy-in now brings its own provider, a gate refuses
  a `Toaster` whose provider comes from a different module, and a browser test pins both halves of the
  rule. [Tabs](https://design.vegastack.com/docs/components/tabs)' count badge stacks its ink wash on
  whatever the trigger paints, which put muted ink at 3.43:1 on a selected pill in dark; it takes body
  ink now, the token gate learned to check a wash painted on a ladder rung, and the rendered-contrast
  lane covers every variant in both themes.
  [DatePicker](https://design.vegastack.com/docs/components/date-picker)'s `data-day` hook is a stable
  `YYYY-MM-DD` instead of a locale-formatted string, which is what made a prerendered calendar throw a
  hydration error in every browser whose locale was not the build host's, and the page now says
  prerendering a formatted date needs an explicit `locale`.
  [NumberField](https://design.vegastack.com/docs/components/number-field)'s addon slots hold an
  interactive control off the field's hairlines and keep its focus ring out of the clip, so the money
  recipe's currency `Select` stops painting into the rule.

- [#86](https://github.com/vegastack/vegastack-design/pull/86) [`af61a44`](https://github.com/vegastack/vegastack-design/commit/af61a4464eae51f8f077e83c8995a3f7b2871173) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **`release-detect --check-npm` fails closed instead of fail-open, and `docs/RELEASING.md` matches
  reality.** The registry probe spawned `npm view` with cwd = the repo root, where `package.json`
  declares `devEngines.runtime` node 24.20.0; npm enforces that field, does not honour pnpm's
  `onFail: download`, and exits `EBADDEVENGINES` on any other Node before it reaches the network. The
  old `status !== 0` branch read that as "not published", so every push to `main` reported both live
  public packages as unpublished, forced `publish=true`, ran `quality-gate`, and armed the
  OIDC-capable `publish` job on changeset-free pushes (release run 34323665258 shows
  `unpublished: @vegastack/design (none) → 0.3.2` with 0.3.2 live). The query now runs in an empty
  temporary directory carrying a copy of the repo `.npmrc`, out of `devEngines`' reach but still on
  the repo's own registry mapping, and `npm view --json` is parsed into three outcomes: **published**,
  **absent** (a genuine `E404` — the only answer that may mean unpublished), and **unknown** (engine
  refusal, transport, auth, missing npm, unparseable output). An unknown never contributes to
  `publish`, is retried once, and exits non-zero when it was the only thing that could have set
  `publish` — fail-closed and loud rather than a `false` that was never established. Nine cases in
  `tooling/test/release-detect.test.mjs` pin it against a stubbed npm; six of them fail against the
  previous script. `docs/RELEASING.md` no longer calls this public repo private in four places, states
  the real reason provenance is off (npm rejects a self-hosted bundle with E422, not repository
  visibility), describes the merged `build-sign-deploy` job rather than the deleted three-job artifact
  split, and records that releases deliberately create no git tag or GitHub release. `AGENTS.md` gains
  that tag decision and reconciles two deviations from the verification-rebuild plan.
- Updated dependencies [[`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`f1d7d2f`](https://github.com/vegastack/vegastack-design/commit/f1d7d2fbc5f9c52aa13ff9ddfc869cb71c6ae163), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`78ed487`](https://github.com/vegastack/vegastack-design/commit/78ed48741747429211c1ab3a25f914fe348ae076), [`452df99`](https://github.com/vegastack/vegastack-design/commit/452df99a039dc145a801deb9b548458bb993ad41), [`42aa455`](https://github.com/vegastack/vegastack-design/commit/42aa455b00d1a50bb919ecfb7112a1e4f8c5d244), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`065315d`](https://github.com/vegastack/vegastack-design/commit/065315d56e23fd33614f6c9e9a9965f166c063e1), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd), [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd), [`02ba364`](https://github.com/vegastack/vegastack-design/commit/02ba364991737f7a8222fd6007790269d1e7102f), [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64), [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64), [`cff5ccb`](https://github.com/vegastack/vegastack-design/commit/cff5ccb0c71af274c3607047ba1dc56247f4251b), [`18e2208`](https://github.com/vegastack/vegastack-design/commit/18e22087c75bdd116554c9cf85523d4be20c7b61), [`2a3fc24`](https://github.com/vegastack/vegastack-design/commit/2a3fc24196b2a94171bce34478cd18a792bdc550), [`2a3fc24`](https://github.com/vegastack/vegastack-design/commit/2a3fc24196b2a94171bce34478cd18a792bdc550), [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b), [`fdaed05`](https://github.com/vegastack/vegastack-design/commit/fdaed057ba85871fe99849a2cdaea0bdc3d5ee14), [`d5e2de2`](https://github.com/vegastack/vegastack-design/commit/d5e2de2b3ea2f3e74bab8548b0a5e9fd1d4a1d99), [`45cde26`](https://github.com/vegastack/vegastack-design/commit/45cde26d287595d2a0d4d2413320d004badd1f0d)]:
  - @vegastack/design@0.4.0
  - @vegastack/design-tokens@0.4.0

## 0.6.0

### Minor Changes

- [#26](https://github.com/vegastack/vegastack-design/pull/26) [`43eb359`](https://github.com/vegastack/vegastack-design/commit/43eb359a9157bce16a361ba929a8bf68e05d44e7) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Rework AudioPlayer's transport. On a wide player it is a single line: play/pause, rewind/forward (±15s), the combined elapsed/duration readout, a flexible seek bar, and a tappable playback-speed control that cycles rates (1x → 1.25x → 1.5x → 2x → 0.5x), all in subdued secondary emphasis instead of the primary accent, with a smoothed waveform progress edge that fills continuously. Audio carries no volume control — mute stays on the M key. On a narrow, mobile-width player it reflows to two lines: the seek bar with elapsed/duration pinned to either edge in a smaller font on top, and a centred play/pause flanked by rewind/forward on the bottom, with an optional transcript control (new `onTranscriptClick`, lucide `audio-lines`) on the leading edge and the speed control on the trailing edge. VideoPlayer's overlay controls are unchanged.

### Patch Changes

- Updated dependencies [[`43eb359`](https://github.com/vegastack/vegastack-design/commit/43eb359a9157bce16a361ba929a8bf68e05d44e7)]:
  - @vegastack/design@0.3.2

## 0.5.0

### Minor Changes

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Fix component behavior and responsive presentation found during manual QA, including range selection, compact navigation, overflow handling, and responsive pricing and comparison layouts. Improve the published examples for dropzones, menus, charts, mobile shells, and the dashboard starter.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Add AudioPlayer and VideoPlayer registry components with shared custom transport controls, including
  a smoothly expanding video progress rail, contained volume rocker, larger overlay actions, and
  state-aware fullscreen controls. The AudioPlayer mirrors the video control surface statically — a
  full-width solid scrubber, a background-free primary play control with a combined `elapsed / duration`
  readout, and matching settings submenus — and gains a `variant="waveform"` that renders the decoded
  audio as an interactive, seekable waveform.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Add ProgressIndicator value display variants for inline and contained percentage labels.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Keep the desktop Sidebar and its footer pinned to the viewport while page or navigation content scrolls.

### Patch Changes

- Updated dependencies [[`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c)]:
  - @vegastack/design@0.3.1

## 0.4.1

### Patch Changes

- [#19](https://github.com/vegastack/vegastack-design/pull/19) [`a3de5ed`](https://github.com/vegastack/vegastack-design/commit/a3de5eded041ad1fdbba537eda9d8510e8fc50ab) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Prevent horizontal Stepper labels from overlapping at narrow container widths.

## 0.4.0

### Minor Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`5f17c36`](https://github.com/vegastack/vegastack-design/commit/5f17c36f042ff39c5e4d1b61f9b593e90ca5e57b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `action-bar` component — a floating contextual bar with a status region and action children.
  Bulk selection ("5 selected · Tag · Archive") is its most common recipe, never its identity: the
  same object serves unsaved-changes and batch-progress bars. It never owns selection (the host's
  list keeps `selectedIds`), announces status changes politely, inerts its actions while `pending`,
  sits flat in the raised band (covered by any dialog), and enters/exits with the CSS-only
  translate/scale/opacity recipe MessageScrollerButton established. `containerRef` switches from
  viewport centring (auto margins — never `left: 50%`) to ResizeObserver-measured centring over a
  content area beside a sidebar.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`cb15077`](https://github.com/vegastack/vegastack-design/commit/cb15077278e9e327b453a185f4e063af2388c9c3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `board` component — kanban columns over the `use-drag-reorder` seam with the reference
  implementation's content/chrome split: the host renders card content only and owns the move command
  (`onMove`, promise-refusable with pending shimmer and announced snap-back); the board owns column
  shells, counts, `Empty bordered` drop targets, collapsed read-only lanes, drag + keyboard models,
  and the lossless per-card "Move to…" menu with visible lock reasons. Below 768px pointer drag
  disables outright — the keyboard move mode and the menu are the only, lossless paths. Cards form
  one roving tab stop (↑/↓ within a column, RTL-aware ←/→ across at a clamped index, M opens the
  menu, Enter activates, Space lifts). A dragged card gains no shadow — flat by doctrine. Selected
  for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`6633fc8`](https://github.com/vegastack/vegastack-design/commit/6633fc866bf50eb6b0501ab46503437e3ee2864e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Remove the `active:translate-y-px` press nudge from `buttonVariants`. Pressed feedback across
  Button and every component composing it (IconButton, SplitButton, toolbars, pickers) is now
  colour-only via the existing `active:bg-*` states — no press motion anywhere in the system. The
  motion foundations doctrine is updated to match.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`cf154ee`](https://github.com/vegastack/vegastack-design/commit/cf154ee2533d36830335a435372d9bb894464cbe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `chip-input` component — free-token entry for tags, recipients, domains, and webhook events.
  Enter/comma/paste-split commit chips; Backspace in the empty input removes the last one. The field
  chrome is the Combobox input group's (borrowed literally, retargeted at the inner real `Input` — no
  raw `<input>`, no lint exemption), the chips are real `Tag`s with named 24px remove targets.
  Validation is per-chip and non-destructive: invalid entries are added and flagged (`data-invalid` +
  destructive outline-border pair + text description) rather than silently dropped, duplicates are
  rejected and announced, and all outcomes flow through a polite live region.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`019b921`](https://github.com/vegastack/vegastack-design/commit/019b921d0768693736dc877719fafa972556e2f2) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New component: `DataGrid` — the full-parity grid DataList's docs always pointed to. TanStack Table computes the sorted row model (multi-key sort with visible ordinals, shift-click additive); TanStack Virtual windows rows behind the `virtualize` flag; the APG grid keyboard layer — roving cell focus with RTL-aware arrows, Enter/F2 into `EditableCell` managed editing, Escape restore — is the component's own. Also: column picker + responsive column revelation (visible/hidden/merge), collapsible per-value grouping as real `tbody` sections, keyboard-continuous load-more, and row selection. Install with `shadcn add @vegastack/data-grid`.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`dc088f5`](https://github.com/vegastack/vegastack-design/commit/dc088f56d3ec83c58089230935fc3337c20567d6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `editable-cell` component — an inline-editable value with an async commit lifecycle. Composes
  `FieldInline` as the text leaf and reuses `AutoSaveInput`'s `AutoSaveStatus` vocabulary
  (`idle | saving | saved | error`) for its status indicator. A promise-returning `onCommit` shows the
  committed value optimistically, then flips to saved — or reverts to `value` and politely announces
  the revert on rejection (the version-conflict path). Editors are typed and open:
  `text` (FieldInline), `select` (a Select whose popover is the editor), and `custom` for app editors.
  `focusMode: "standalone" | "managed"` decides whether the cell owns its tab stop or defers to a
  grid's roving focus model.

  `FieldInline` gains three additive props to support this without being forked: controlled
  `editing` / `onEditingChange`, and a `tabIndex` override for the display element. No behaviour
  change for existing consumers.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`42427ad`](https://github.com/vegastack/vegastack-design/commit/42427ad24313e6cc83842bae741829dce6cb6f3f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `filter-bar-managed` component (`FilterBuilder`) — the stateful nested and/or filter builder
  the `filter-bar` docs recorded as deferred. The grammar is host-injected: the component owns the
  tree shape (`FilterNode` groups and conditions) and its editing surface, while the app supplies the
  field `vocabulary` (operators per field, `requiresValue`, formatting) and a per-type `editors`
  registry (text is built in). Nested groups render as fieldset/legend — deliberately not
  `role="tree"` — with depth and condition caps whose disabled add affordances carry readable
  reasons, a missing-value check with visible text, focus-managed removal (next sibling, else the
  group's add button), and a `readOnly` summary of removable `FilterChip`s. It never validates field
  semantics, never serialises, and never executes the filter — that would adopt one app's AST.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`49a0519`](https://github.com/vegastack/vegastack-design/commit/49a0519db34238685c163374de8a3309dd54ffd5) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `number-field` component — the roster's first numeric input. Wraps Base UI's NumberField
  (locale-aware Intl parsing/formatting, `min`/`max`/`step` with `snapOnStep`, keyboard stepping,
  wheel scrub) in `Input`'s exact addon-group chrome, with full-height − / + steppers whose pointer
  targets meet the 24px floor without hit-area expansion. Money is a `format` prop
  (`{ style: "currency", currency }`) plus a documented minor-units recipe — deliberately not a
  separate money-input. Like `Input`, the `size` prop replaces the native numeric `size` attribute.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`488cc09`](https://github.com/vegastack/vegastack-design/commit/488cc091ae5304d1377271bfd03ecbe57f158da1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `shortcut-overlay` component — the `?`-triggered dialog listing keyboard shortcuts, rendered
  from a declaration registry (keys, label, category, optional `when`) instead of hand-listed markup,
  so the surface cannot go stale. Shortcuts group by category in declaration order, render as
  description-list pairs with real `Kbd` keys whose modifier glyphs follow the user's platform via
  `use-platform`, and large sets get an automatic filter. The global binding never fires from a text
  field and defers to a `shouldHandle` predicate while another overlay owns the keyboard.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`c183905`](https://github.com/vegastack/vegastack-design/commit/c18390507ac7e5970be148264d613576d757022a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `sortable-list` component — reorderable rows on `ItemGroup`/`Item`, driven by
  `use-drag-reorder`: pointer drag with 2px closest-edge drop indicators, the keyboard move mode,
  per-step polite announcements, and the required lossless Move menu (up / down / to top / to
  bottom). Controlled — the host owns the order and can refuse a move by rejecting the `onReorder`
  promise (pending shimmer, announced snap-back). Deliberately owns no selection: reordering and
  multi-select on one surface make drag intent ambiguous. The `data-list` scope table's
  "drag-and-drop reordering" row is reconciled: the persisted order stays app-coupled, the mechanism
  now lives in the system. Selected for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`accf555`](https://github.com/vegastack/vegastack-design/commit/accf555aef523991f582b52f15f10891f180df28) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `stepper` component — a bounded linear process as an ordered list with
  `aria-current="step"`, deliberately not `Tabs` (tab semantics promise free navigation a wizard
  doesn't offer). Per-step complete/current/upcoming/**error** states map 1:1 onto `StatusIcon`'s
  vocabulary and always carry icon shape plus visually hidden text; a `blockedReason` renders against
  the current step, announces politely, and wires to the host's Next button via `aria-describedby`;
  focus moves to the new current step's label on change (never on mount); horizontal and vertical
  orientations share one DOM order; `navigable` mode turns completed steps into real buttons.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`6ce022d`](https://github.com/vegastack/vegastack-design/commit/6ce022d7ee12d72abbdd80c48404fa12f29239ae) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Give `Table` a styling hook for its scroll container, and let `DataList` pass the whole Table
  surface through.

  - `Table` gains `containerClassName` and `containerProps` (including `ref`), both forwarded to the
    existing `data-slot="table-container"` element that owns `overflow-x-auto`. Sticky headers,
    fixed-height viewports, and virtualizers finally have somewhere to attach — the `<table>` itself
    cannot own a scroll viewport.
  - `DataListProps` now extends `Omit<TableProps, "children">` instead of the raw `<table>` props, so
    `grid`, `headerTone`, `density`, and the new container hooks type-check on `DataList` (they always
    reached `Table` at runtime; TypeScript rejected them).
  - `DataListColumn` gains `cellClassName?: (row, index) => string | undefined` — a per-cell class
    hook merged after the per-column `className`.
  - A column `render` now receives an optional third argument, `DataListCellContext`
    (`{ rowId, columnKey, selected }`). Existing two-argument render functions are unaffected.

  All additive; no behaviour or visual change for existing consumers.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`2d1707f`](https://github.com/vegastack/vegastack-design/commit/2d1707ffb624196cd912513fa15258ef1efc68e8) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `timeline` component — rail geometry only, deliberately: a continuous vertical connector with a
  node per entry (`Timeline`/`TimelineItem`/`TimelineSeparator`), while rows compose the existing
  `Item` parts, timestamps are `RelativeTime`, and group headers render through `Marker`'s separator
  variant. No `TimelineTitle`/`TimelineDescription` — that would fork `Item`'s vocabulary. Entries
  carry the `content-visibility` render-skipping recipe for long feeds with zero dependencies, the
  rail is `aria-hidden` decorative geometry, and the whole family is server-safe (no `'use client'`).

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`37d31dd`](https://github.com/vegastack/vegastack-design/commit/37d31ddb57c179d5afdc0cc07aa176a265585335) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-drag-reorder` registry hook — the system's one drag-engine seam, wrapping the newly
  sanctioned `@atlaskit/pragmatic-drag-and-drop` (D3). Pragmatic owns pointer/touch mechanics and
  closest-edge hit-testing; the hook owns what must match this system's voice: a keyboard move mode
  (Space/Enter lifts, arrows commit one announced step at a time, Escape ends — Atlassian's own
  user-tested commit-per-step pattern), an overridable live-region vocabulary
  (lifted/moved/ended/rejected), a `requestMove` entry point for the mandatory menu equivalents, and
  the async drop contract no drag library models: a promise-returning `onReorder` is `pending` until
  it settles and a rejection announces + clears, so server-refused moves snap back. One API covers a
  single list and cross-container boards. Selected for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`abe32d8`](https://github.com/vegastack/vegastack-design/commit/abe32d8187b4783da987e7e2070f602e9281a9e7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-file-drop` hook and `dropzone` component (D4). The hook is the one file importing the
  sanctioned `react-dropzone` engine — drag-depth handling, directory traversal, accept matching,
  keyboard activation of the drop surface — and adds the system's vocabulary on top: the paste
  path (`clipboardData.files`, the composer case) under the same accept/size/count constraints as
  drop, typed `FileDropRejection` reasons aligned with `AttachmentState`, a polite announcement
  payload that states WHY a file was refused, and a ref-counted document-level missed-drop guard
  scoped to file-bearing drags (`preventWindowDrop`). `Dropzone` is a deliberately thin shell over it: the surface is the named
  focusable control (`role="button"`), the real `<input type="file">` behind it is the picker
  bridge (the one reviewed raw-interactive exemption),
  `data-dragging`/`data-drag-invalid` styling flags, and children compose `Empty bordered` for the
  classic drop-zone look. No `attachments` prop by design — acquisition ends at a plain `File[]`
  callback where `Attachment`'s state machine takes over. Dropzone is selected for cross-engine
  smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`296b3fe`](https://github.com/vegastack/vegastack-design/commit/296b3fedf005cbc13c19211279e3d1f23d16f906) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-list-nav` registry hook — roving-tabindex keyboard navigation for a list or grid of
  focusable items. One Tab stop per collection, RTL-aware ArrowLeft/Right (direction read live from
  the container), ArrowUp/Down by row via `columns`, and Home/End jumps scoped by
  `homeEndScope: "collection" | "row"` (default `"collection"`, matching the shipped pickers). A
  `shouldHandle` predicate suppresses navigation while an overlay above the list owns the arrow keys.
  Extracts the block color-picker and emoji-picker each hand-rolled; they adopt it in a follow-up.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`eb857f3`](https://github.com/vegastack/vegastack-design/commit/eb857f31a08dcbe976c8c302f91655f1b440c091) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-platform` registry hook — SSR-safe platform detection returning `{ os, isTouch }`
  (`os: "mac" | "windows" | "linux" | "other"`, touch from the `(pointer: coarse)` media query). The
  server render and hydration render report caller-supplied fallbacks so markup agrees on first
  paint; the real value lands in a client-only effect. Fills the hole behind `Kbd`'s manual `os`
  prop: callers run the hook and pass `os === "mac" ? "mac" : "other"` down — `Kbd` itself stays
  server-safe and unchanged.

### Patch Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`76acdca`](https://github.com/vegastack/vegastack-design/commit/76acdcaa2f67d26c989ced01058f3e9bb074a4cc) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - `Kbd` mac modifier glyphs now pair the visual glyph with visually hidden spoken names ("Command",
  "Shift", "Option", "Control", "Return", "Delete") while the glyph itself goes `aria-hidden` — screen
  readers no longer hear "place of interest sign" (or nothing) for `⌘`. Non-mac word rewriting is
  unchanged. Surfaced by shortcut-overlay, the one surface built on the real `Kbd`; fixed at the root.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`ff66002`](https://github.com/vegastack/vegastack-design/commit/ff660024e11358b44698b954cf59d08230c2755a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - `color-picker` and `emoji-picker` adopt the shared `use-list-nav` hook for their roving-tabindex
  grids — internal refactor, no visual or API change. Both items gain `@vegastack/use-list-nav` in
  `registryDependencies`, so `check-updates` will report an update for each; it is safe to take or
  skip. Home/End behaviour is unchanged (whole-grid, the hook's default). One correction rides along:
  emoji-picker's ArrowLeft/ArrowRight are now RTL-aware, matching color-picker — previously they were
  LTR-only in RTL contexts.
- Updated dependencies [[`9d0a2ef`](https://github.com/vegastack/vegastack-design/commit/9d0a2efae46de237bf1a9f54a99bdebc4badc840), [`630ca84`](https://github.com/vegastack/vegastack-design/commit/630ca84084199e75c5a0a80184aa726552070994), [`6633fc8`](https://github.com/vegastack/vegastack-design/commit/6633fc866bf50eb6b0501ab46503437e3ee2864e)]:
  - @vegastack/design@0.3.0

## 0.3.0

### Minor Changes

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Add AnnouncementBanner, CodeBlock, ComparisonMatrix, NavigationMenu, OnboardingChecklist,
  PricingSection, PropertyList, RuledBand, Segmented, Stat, TagGroup, and ToolCallChip, and reconcile all
  96 registry components, 439 animated icons, two hooks, and the dashboard block across styling, portal
  theming, accessibility, responsive behavior, documentation, tests, and generated registry integrity.

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - **Breaking (both packages — `minor` is the breaking position pre-1.0).** Two changes here alter
  existing behaviour and were previously filed as `patch`, which would have broken consumers on an
  upgrade they had no reason to review:

  - `vegastack-design verify --post-write` now **requires** `--expected-integrity <sha256-base64>`,
    a flag that did not exist before. Any existing consumer CI step invoking `--post-write` with just
    `--item`/`--target-dir` now exits 2. Take the value from the pre-write run, which prints the exact
    integrity-pinned command to use.
  - `MarkdownView` images are **same-origin by default**. Remote `<img>` sources previously rendered
    unconditionally and are now dropped unless their origin is listed in the new `allowedImageOrigins`
    prop. Consumers rendering markdown that references remote images must opt those origins in.

  Constrain registry credentials and copied-file verification to trusted origins and contained paths,
  pin post-write checks to a digest retained before copy-in, match shadcn's inherited TypeScript alias
  resolution, and make Markdown images same-origin by default with an explicit remote-origin allowlist.

  Refuse to place credential material in a registry URL, and redact it from CLI output. The
  trusted-origin check only inspected request HEADERS, so a `components.json` registry entry such as
  `"@vegastack": "http://host/r/{name}.json?k=${CF_ACCESS_CLIENT_SECRET}"` declared no headers, skipped
  the check entirely, and sent the Cloudflare Access service token to an arbitrary origin over plain
  http — while `check-updates` exited 0. The token was also echoed verbatim into stderr, and therefore
  into CI logs. Credentials now must travel as headers: a URL is recorded in server access, proxy and
  CDN logs even when the origin is fully trusted, so the refusal is unconditional rather than
  origin-scoped. Applied identically in `check-updates`, `verify`, and the shared internal helper so
  the three do not diverge on this boundary. Uncredentialed registries (including plain-http localhost
  mirrors) are unaffected.

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`09fa52c`](https://github.com/vegastack/vegastack-design/commit/09fa52ce0838cd8b3a48e6dd1abc29b6e47c2d0c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Fix `Terminal`'s scrollable command pane having no visible focus indicator under
  `forced-colors: active`.

  The pane is keyboard-focusable and signalled focus with a border tint plus `outline-none`. Forced
  colors replaces `border-color` outright, so the tint vanished, and Tailwind v4's `outline-none`
  suppresses the shared `:focus-visible` outline with no forced-colors carve-out — leaving no
  indicator at all in the forced palette. The affordance is now that shared outline, inset with a
  negative offset so neither the terminal's `overflow-hidden` root nor `scroll-fade-x`'s mask can clip
  it. The layout-reserving transparent border is removed with the tint it existed for, so the pane
  renders 2px shorter.

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`7595cfd`](https://github.com/vegastack/vegastack-design/commit/7595cfd7c7eeaaafa95c7bd8d621cd4e5cb5087f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Give `Terminal`'s scrollable command pane an accessible name, and accept `aria-label` /
  `aria-labelledby` to override it.

  The pane is keyboard-focusable — a scrollable region has to be reachable without a pointer — but it
  was a bare `<div tabIndex={0}>` with no role and no name, so a screen reader announced it as an
  unnamed stop in the tab order (WCAG 4.1.2). It is now a `group` labelled by the visible `title`, so
  `title="Install"` reads as "Install, group" with no caller changes. `group` rather than `region`
  because `region` is a landmark and a page with several install snippets should not gain several
  landmarks.

  `aria-label` and `aria-labelledby` passed to `Terminal` now apply to that pane instead of the outer
  block, matching `ScrollArea`. On the outer block they had no effect — it carries no role — so nothing
  that previously worked stops working.

### Patch Changes

- Updated dependencies [[`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f)]:
  - @vegastack/design@0.2.0
  - @vegastack/design-tokens@0.2.0

## 0.2.0

### Minor Changes

- [`c7de692`](https://github.com/vegastack/vegastack-design/commit/c7de6929416086bd0d4c6ca0b1957247c6b202a7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `provider` registry item — `VegaStackProvider` + `useVegaStackTheme` ship as a copy-in
  (`shadcn add @vegastack/provider`, composing the `sonner` Toaster item), closing the gap where
  downstream projects had no sanctioned install path for the app-root wiring (theme, toasts,
  tooltip coordination, direction). The private package's provider is now a documented mirror of
  the canonical registry source.

### Patch Changes

- Updated dependencies [[`9532d42`](https://github.com/vegastack/vegastack-design/commit/9532d4295807dd4f37ddefb514641249e1002911)]:
  - @vegastack/design@0.1.1

## 0.1.0 — first release (2026-07-18)

Private package — components are distributed via the **signed shadcn registry**
(`design.vegastack.com/r`), never npm. This changelog is the consumer-facing record per version;
per-component change signals are the `// @vegastack <name>@<version> sha256-…` provenance headers.

83 components on Base UI 1.6 + Tailwind v4, 525 registry items (incl. 440 animated-icon mirrors,
2 hooks, the `dashboard-01` block):

- Actions/forms: 15-variant Button family (icon-proportional ladder, in-ink loading spinner),
  full form suite with border-tint focus (no rings) and auto shake-on-invalid.
- Combobox + Command rebuilt data-driven on Base UI (cmdk removed); Select-style popup search
  (`ComboboxPopupInput`); pickers (date/color/emoji/country/region).
- Display/data: badges, cards, tables, DataList, charts (mono numerals), Empty, Item, Attachment,
  AnimatedNumber, Resizable.
- Shell: AppShell + Sidebar (Sheet mode, rail, cookie persistence), PageHeader, breadcrumbs.
- Chat: Marker, Message, Bubble, MessageScroller. Marketing: 8 `.vs-marketing` primitives.
- Every component: token-only styling, WCAG 2.1 AA, both themes, ref-as-prop, flat exports —
  audit-swept with per-variant screenshot evidence before this release.
