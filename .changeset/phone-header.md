---
"@vegastack/ui": minor
---

⚠️ Shell and Breadcrumb Cascade: the phone header, option A. At the top of a module the phone's top bar starts with one button, the workspace's 28px logo, the module's name and ⌄ (`ShellColumnSwitch`, logo as `media`), which opens the module's column as a sheet and replaces the lone ⌄ beside the title. On an inner page `BreadcrumbTrail compact` is now one link back, `‹ <parent>` to the nearest earlier step with an `href`, its name always shown (36px, 44px+ on touch), named "Back to <parent>" (`backLabel`). The new `ShellTopBarAccount` slot ends a phone's bar with Help and the avatar and takes no room above a phone. **Breaking:** `ShellColumnSwitch` takes `media` and its children instead of `label`; `ShellTopBarTitle` no longer renders it, and its `switchLabel` prop is gone; `BreadcrumbTrail`'s compact path menu and its `compactLabel` prop are removed, with no compatibility exports.
