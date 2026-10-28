---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **RecordPicker** browses folders: pass a `browse` loader (one folder's contents, `null` for the top) and mark folder rows `folder: true`, and the empty search box walks the app's folders — a folder opens instead of being picked, a breadcrumb (or Backspace in the empty box) climbs back, and typing still searches everything. With `multiple`, `selectAll` adds a "Select all" for the rows on screen; `kindFilter={false}` hides the kind filter. **RecordPickerDialog** takes a counting `confirmLabel` ("Add 3"), a `cancelLabel`, and an async `onConfirm` that keeps the dialog open and busy until it settles (`false` keeps it open); its confirm is off while nothing is picked. [docs](https://design.vegastack.com/docs/components/record-picker)
