---
"@vegastack/ui": minor
---

⚠ **[Toast](/docs/components/toast) is the one notification engine — `Sonner` is retired**, and Toast gains position, anchored toasts, custom bodies and a band of its own above the modal scrim (OVL-10, OVL-15, COL-23).

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
