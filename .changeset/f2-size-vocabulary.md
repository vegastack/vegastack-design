---
"@vegastack/ui": minor
---

⚠️ **One size vocabulary: `xs · sm · md · lg`.** The tier every component called `default`
is now `md`, matching the `--size-*` tokens it was always built from. This is a rename across Button,
IconButton, SplitButton, Badge, Input, Textarea, Select, Combobox, Avatar, Card, Item, Empty, Kbd,
Dialog, Switch, Checkbox, RadioGroup, Toggle, ToggleGroup, Segmented, Stat, Spinner, StatusIcon,
Progress, ProgressIndicator, OTPInput, NumberField, Attachment, ChipInput, Pagination and Sidebar.
There is no alias — `size="default"` is a type error.
[docs](https://design.vegastack.com/docs/components/button)
