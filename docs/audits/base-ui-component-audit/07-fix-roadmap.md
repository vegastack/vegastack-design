# Fix Roadmap

## Phase 1: Stop Drift and Broken Installs

1. Fix shadcn Base/Radix config drift so `shadcn info -c apps/docs --json` reports Base.
2. Add CI guard for the shadcn base.
3. Fix `Field` registry dependency on `Input`.
4. Reconcile package Toaster and registry `sonner` Toaster.
5. Remove direct `radix-ui` from docs package if validation passes; document `cmdk` transitive Radix exception.

## Phase 2: Make Gates Green

1. Fix the seven `design-lint` focus violations.
2. Add targeted real-CLI consume representatives for `field`, `sonner`, `text-edit`, and one search/select component.
3. Bootstrap VRT baselines through the documented CI path.
4. Keep Node 24.14+ in every validation environment.

## Phase 3: Base UI/API Alignment

1. Rework `Button` around Base UI Button semantics or implement equivalent `nativeButton`/`focusableWhenDisabled`.
2. Resolve `Accordion`/`ToggleGroup` alias/default decisions.
3. Standardize overlay portal/positioner prop APIs.
4. Add Select `alignItemWithTrigger` and API/docs coverage.
5. Improve Slider range labels and Country/State select API semantics.

## Phase 4: Docs as Consumer Contract

1. Add a top-level private registry install/auth guide.
2. Generate or complete API tables for compound components.
3. Standardize focus wording.
4. Explain Toast/Sonner naming.
5. Update stale component-count and scroll-lock comments.
6. Fail loudly for missing previews.

## Phase 5: Polish and Cleanup

1. Split unnecessary client boundaries into lower interactive leaves.
2. Replace stale source comments/JSDoc examples.
3. Add reduced-motion polish to loading spinners where missing.
4. Review semantic layer tokens for overlay `z-50`.
5. Add visual examples for empty/error/success/loading states where missing.
