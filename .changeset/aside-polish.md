---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 AvatarStack: truly stacked 24px avatars (overlapping, background ring, "+N") as one button that lists everyone, with a hover preview per avatar; PersonCard never truncates. RecordChip: `placeholder={null}` shows the icon alone, and the chevron sits as far from the divider as the ↗ does. Clear and remove × controls (DatePicker, SearchableSelect, FilterBar, Chip, SearchInput, AnnouncementBanner, RecordAsideAction) no longer move when pressed: the absolutely centred ones used `-translate-y-1/2`, which Button's press nudge replaced.
