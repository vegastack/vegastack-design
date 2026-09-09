---
"@vegastack/ui": minor
---

⚠️ **`Alert` is `role="status"`, not `role="alert"`, and `Item` takes `role="listitem"` only inside
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
