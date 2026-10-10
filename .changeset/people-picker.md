---
"@vegastack/ui": patch
---

🧩 Add `PeoplePicker`, the one picker for people and teams; it replaces `PeopleInput`.

- `PeoplePicker` (`shadcn add @vegastack/people-picker`) chooses one person or, with `multiple`, several people and teams. Rows are the avatar, the name (the viewer's reads "(you)" and leads), then the email, a `description` or "Team · N people". The trigger matches `Button` and `Select` heights at `sm`, `default` and `lg`, so it sits flush in an "Add people… | Can edit | Add" row. Footer `actions` ("Assign to me", "Unassign"), `leadingOptions` ("Unassigned"), `exclude`, `viewerId` and a fixed `options` list are built in; loading shows skeleton rows, never a spinner.
- Only active people are listed: an option with `active: false` is hidden unless `includeInactive`, which badges it "Inactive".
- `PeoplePickerContent` is the popover body for a trigger the host owns (a record pill); `PeoplePickerMenu` is the same list inside a `DropdownMenu` submenu ("Assign ›").
- `FilterBarPeopleFacet` (in `filter-bar`) is a person filter chip over the same body.
- ⚠️ Breaking: `people-input` is removed — use `PeoplePicker multiple`. `ShareDialog`'s `search` is now a `PeoplePickerSearch` loader that resolves `{ items, nextCursor? }` (it was `Promise<Option[]>`), and its invitees are `PeoplePickerOption`s. The invite field is a picker trigger that reads the chosen names, not a chips field.
