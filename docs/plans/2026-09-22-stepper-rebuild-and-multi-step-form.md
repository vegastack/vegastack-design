# Stepper rebuild and the multi-step form

**Date:** 2026-09-22 · **Status:** PR 1 and PR 2 both shipped · **Owner:** MK

Two registry items change: `stepper` is rebuilt (breaking allowed), and `multi-step-form` is added
as a new component that owns flow and guards but knows nothing about forms.

## Requirements captured from MK, 2026-09-22

| Question           | MK's answer                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| Packaging          | Compound component. **Headless hook dropped from v1** (second pass)                 |
| Ownership          | Flow and guards only — content-agnostic, zero new dependencies                      |
| Stepper redesign   | Full rebuild, **breaking changes allowed**                                          |
| v1 features        | Conditional steps · modal support · resume/persistence · URL sync + exit guard      |
| URL sync mechanism | Hash, not query string                                                              |
| Orientation        | Both, **auto-selected** — vertical above five visible steps, horizontal at or below |
| Refusal surface    | Persistent inline reason; a toast only for transport failures (see § Refusals)      |
| Deep-link policy   | Derived from per-step `isSatisfied`, not from a create/edit mode flag               |
| Action row         | Back far left, Continue far right; both labels overridable per step                 |
| Phone rail         | Section-list rows when steps are reachable, compact line when they are not          |

## Two facts that make this possible

`stepper` is **ours**. There is no `vendor/shadcn/4.21.0/ui/stepper.tsx`, no
`packages/ui/upstream/patches/stepper.patch`, and `stepper` is one of the 61 names in
`packages/ui/upstream/ours.json`. Redesigning it therefore needs no row on the shadcn-reset
decision register and is bound only by the § Build rules in `AGENTS.md`.

No registry item imports Next. `grep -rlE "from \"next[/\"]" packages/ui/registry/` returns
nothing, across components and blocks. That is why URL sync is hash-based: reading a query
parameter correctly requires the host framework's router, which a framework-agnostic registry item
cannot import.

## What this reverses

`packages/ui/registry/ui/stepper.tsx`'s header records the opposite decision: _"The multi-step-form
assembly (stepper + Field + validation) is a Guides page."_ That guide exists at
`apps/docs/content/docs/guides/multi-step-form.mdx`, and `apps/docs/content/docs/components/stepper.mdx`
§ Scope repeats it in a table. All three become wrong the moment `multi-step-form` ships and are
rewritten in PR 2 — not left to contradict the code.

The three judgments the current Stepper got right are preserved verbatim, and each is a test:

1. `<ol>` with `aria-current="step"`, never `role="tab"` — tab semantics promise free navigation a
   gated flow does not offer.
2. Focus moves to the new step's label when the current step changes, and never on first mount.
3. Step states are explicit, never derived from an index — a failed or skipped step must stay
   expressible.

---

# PR 1 — Stepper rebuild — SHIPPED 2026-09-22

Changeset marker `⚠` (Breaking), `@vegastack/ui` MINOR. Four artefacts: the source, its browser
suite, its MDX page, and the changeset. 53 tests green across the component suite, the
accessible-name lane and the geometry lane; `design:verify` clean.

## What shipped, where it differs from the sketch above

| Sketched                         | Shipped                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `size: sm \| md`                 | `size: default \| sm` — upstream's size vocabulary, as the authoring canon requires                                                       |
| `labelPosition` default `inline` | default `below`, matching the ASCII MK approved; `inline` is the compact alternative                                                      |
| `collapseBelow: sm`              | `collapse: auto \| sm…2xl \| false`, default `auto` — see below                                                                           |
| six states                       | seven: `warning` was added on MK's second pass, so a passable step carrying a caveat is not forced to masquerade as `error`               |
| a plain `button` row             | `Button variant="ghost"` — `raw-interactive-html` forbids a native control where a VegaStack one substitutes, and Button substitutes here |

**`collapse="auto"` was not in the plan and is the one design change made during implementation.**
A fixed breakpoint is wrong in both directions: it collapses a three-step rail with room to spare,
and leaves a five-step rail shredded. `auto` derives the container-query breakpoint from the step
count (≤2 → `@sm`, 3 → `@md`, 4 → `@lg`, ≥5 → `@xl`), at roughly 115px of rail per label. Only
horizontal rails reach it — `orientation="auto"` has already gone vertical by six steps.

## API, as shipped

Removed — the breaking half:

- `blockedReason` and `blockedReasonId`. § Refusals above is why: they had one placement, and it was
  the one layout they did not fit. The host now renders the reason beside its own Next button.
- The root is a `<div data-slot="stepper">`; the list is nested as `data-slot="stepper-list"`. A ref
  or selector aimed at the old `<ol>` root resolves to the wrapper.
- The navigable step is `data-slot="stepper-trigger"` (a ghost `Button` row) with
  `data-slot="stepper-label"` still on the label itself, so anything selecting the old link-styled
  Button's classes no longer matches.

Added:

- `StepperStepState` gains `loading`, `warning` and `skipped`; `StepperStep` gains `optional`.
- `orientation: "horizontal" | "vertical" | "auto"` (default `auto`) with `verticalFrom` (default 6).
- `size`, `labelPosition`, `showCount`, `collapse`, and the exported `stepperNodeVariants` and
  `StepperCollapse`.

## Tests, as shipped

`packages/ui/registry/ui/stepper.test.tsx`, 34 tests, one render each — the suite has no global
cleanup, so a document-wide query would answer with an earlier test's DOM, and a mid-test
`unmount()` + re-render is what broke the first draft.

Covered: the `<ol>`/`aria-current` contract including a `loading` step still being current; ref
forwarding to the new root; all seven states carrying sr-only text; the ordinal giving way to a
glyph; colour reaching only `warning` and `error`, with the label on the `-text` ink and the node
fill on `-foreground` (A11Y-13); the loading glyph spinning and no other; `optional` as a label
rather than a state; the connector filling from state and never from index, including an error step
refusing to claim it was passed; auto orientation either side of the threshold and an explicit
orientation overriding it; `collapse="auto"` widening with the count, a named breakpoint pinning it,
and `collapse={false}`; the summary being a named `progressbar`; navigable offering exactly
complete/skipped/error and not current/upcoming/disabled; focus on transition but never on mount.

**Two assertions deliberately live elsewhere, because this lane compiles no CSS.** The 24px touch
floor is proved by `packages/ui/test/geometry.browser.test.tsx`, which compiles Tailwind and
hit-tests the effective target with `elementFromPoint`; the resolved status-ink contrast is proved
by `contrast-check.mjs`. A pixel or colour assertion in the unit lane measures an unstyled box and
passes or fails for the wrong reason — the first draft asserted 24px there and read 21.

# PR 2 — `multi-step-form` — SHIPPED 2026-09-22

Marker `🧩`. New `registry:ui` item; new entry in `ours.json`,
`packages/ui/component-contracts.json`, `packages/ui/registry.json`, the docs `meta.json`, and the
preview barrel.

## Scope boundary

The component owns sequencing, guards, focus, announcements and URL/persistence plumbing. It owns
no fields, no schema and no validation library. A step body is arbitrary children — a `Field` form,
a static review table, a `dropzone`, a chart. This is what keeps the dependency count at zero:
`react-hook-form` and `zod` are each a new sanctioned dependency exception and therefore a separate
MK decision, and the guard contract being a promise means any of them plugs in from the host side.

## Surface

Compound parts — `MultiStepForm` (root), `MultiStepFormNav`, `MultiStepFormStep`,
`MultiStepFormActions`, `MultiStepFormBack`, `MultiStepFormNext`, `MultiStepFormSkip`. **No headless hook in v1** — MK
dropped it on the second pass; a host needing wizard behaviour without our chrome composes `Stepper`
directly, as today's guide already describes. Adding it later breaks nothing.

Each step declares:

| Field         | Purpose                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `id`          | Stable identifier; also the hash fragment value when URL sync is on                              |
| `label`       | Shown in the rail                                                                                |
| `description` | Optional secondary line                                                                          |
| `optional`    | Renders the "Optional" affix; a skip control appears in the actions row                          |
| `when`        | `(values) => boolean` — conditional steps                                                        |
| `canGoNext`   | Sync boolean for cheap gates                                                                     |
| `beforeNext`  | `(ctx) => true \| string \| Promise<true \| string>` — a returned string becomes `blockedReason` |
| `beforeBack`  | Same contract for backward movement                                                              |
| `lock`        | Once passed, earlier steps are permanently sealed (post-payment)                                 |

### Conditional steps

`when` is evaluated against current values on every render; hidden steps leave the rail and the
sequence entirely, so "step 2 of 4" stays truthful when a branch removes one. All index maths goes
through a single derived `visibleSteps` array — nothing else in the component sees raw indices.
This is the part that cannot be retrofitted cheaply and is the reason it is in v1.

### Guards

`beforeNext` is awaited. While it is in flight the step is `loading` (the new Stepper state) and
the Next button is a loading `Button`. The flow **never advances optimistically**. A returned
string becomes the rail's `blockedReason`, and `MultiStepFormNext` wires its own
`aria-describedby` to the rail's `blockedReasonId`, so the reason reads out with the control it
blocks. `lock` seals history rather than merely disabling Back, so a browser Back or a stale hash
cannot walk back into a committed step.

### Resume

Opt-in `persistKey` only. Off by default — wizard data is frequently personal, and silently writing
it to `sessionStorage` is not a default a design system gets to choose. `sessionStorage`, not
`localStorage`, so it dies with the tab. Documented explicitly as unsuitable for payment data.

### URL sync

Opt-in `urlSync`, hash-based: `#step=payment`. Namespaced with the `step=` prefix so it cannot
collide with in-page heading anchors, and no router adapter is required from the host. Browser Back
moves a step back rather than leaving the page. A hash naming a step the guards forbid is ignored
and rewritten, so a pasted link cannot bypass a gate.

### Modal placement

Works inside `dialog`, `sheet` and `drawer`: the rail and the actions row stay fixed, the step body
scrolls. Verified in a geometry fixture — the sticky footer is the thing that usually gets bolted
on late and breaks.

### Exit guard

`onBeforeExit` raises an `alert-dialog` when a step is dirty. The component does not itself decide
what dirty means; the host reports it.

### Accessibility

Exactly one focus move per transition. `Stepper` already owns it, so the form must not also focus
the first field — this is an explicit test, not a comment. `use-announcer` announces
"Step 2 of 5, Map columns". Enter inside a step body submits that step, not the whole wizard.
Direction-aware step transitions use logical properties, since the repo pulls with `--rtl`.

## Reuse

Nothing below is rebuilt.

| Need                | Item                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rail, compact rail  | `stepper`, `progress`                                                                                                                                                                             |
| Step body           | `field` and every control it wraps — `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `number-field`, `date-picker`, `combobox`, `searchable-select`, `chip-input`, `dropzone` |
| Actions row         | `button`, `button-group`                                                                                                                                                                          |
| Containers          | `card`; `dialog` / `sheet` / `drawer`                                                                                                                                                             |
| Review step         | `data-list`, `property-list`, `separator`                                                                                                                                                         |
| Blocking and errors | `alert`, `field`'s `FieldError`                                                                                                                                                                   |
| Announcements       | `use-announcer`                                                                                                                                                                                   |
| Responsive collapse | `use-media-query`, `use-mobile`                                                                                                                                                                   |
| Exit guard          | `alert-dialog`                                                                                                                                                                                    |
| Success and loading | `empty`, `status-icon`, `spinner`                                                                                                                                                                 |

Adjacent but not this: `questionnaire` is upstream's one-question-at-a-time engine — a step here is
a page of fields, not a question — and `onboarding-01` is an upstream block, not a reusable wizard.

## Tests (PR 2)

Sequencing with and without conditional steps, including a branch that removes a step mid-flow and
keeps the count truthful; each guard shape (sync false, string rejection, promise rejection,
promise acceptance) and the loading state while one is pending; no optimistic advance; `lock`
sealing history against both Back and a forged hash; the single-focus-move contract; hash round
trip including a forbidden target; `persistKey` restore and its absence by default; the modal
fixture's sticky footer and scrolling body; the exit guard; RTL transition direction.

## Docs

`apps/docs/content/docs/components/multi-step-form.mdx` under the component canon, closing with
Do/Don't (not Deviations — the component is ours, not a reset page). Generated sections
(`InstallSteps`, `Anatomy`, `ApiTable`, `StatesTested`) stay generated. Curated playground, so no
Story explorer per DD-3.

`apps/docs/content/docs/guides/multi-step-form.mdx` is rewritten from "here is the recipe you
assemble yourself" to "here is the component, and here is when to drop to `useMultiStepForm()`
instead". `stepper.mdx` § Scope and the `stepper.tsx` header comment are corrected in the same PR.

---

## Sequence and gates

1. **PR 1** — Stepper rebuild, its tests, its docs page, one `🛠` changeset with the migration note.
2. **PR 2** — `multi-step-form`, its tests, its docs page, the three rewritten prose surfaces, one
   `🧩` changeset.

Every component that is ours carries JSDoc plus an `@example` on each exported part
(`tooling/verify-public-api-docs.mjs`), so both items do. Local loop is `pnpm verify`; a failure
names its stage, and the `review` skill classifies it rather than the failure being self-cleared.

Zero new dependencies. Nothing here touches a trust boundary, a workflow, a runner, or the decision
register. Shipping remains a separate explicit decision.

## Open for MK

1. Exporting `useMultiStepForm()` from the component file is assumed. It costs one export and no
   registry item; say so if you would rather ship the component alone.
2. `blockedReason` moving from `warning-text` to a destructive ink is flagged, not decided — it
   moves only if `contrast-check.mjs` measures the pair at or over the AA floor, and only with your
   word.

---

# Second pass — resolved 2026-09-22

## Refusals: inline persists, toast is for transport only

MK asked whether the refusal should be a `toast` (the Base UI surface, not `sonner`). It cannot be
the only channel. A toast is transient and is not programmatically tied to the control it blocks, so
a refusal delivered only by toast fails WCAG 3.3.1 — the reason is gone before a slow reader, a
screen-reader user, or anyone who tabs back to Continue can reach it.

The split that is correct, and that the component enforces:

| What happened                                            | Surface                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| A guard refused — the answer is wrong or incomplete      | Persistent inline reason under the rail, `aria-describedby` on Continue |
| The check could not run — network down, server 500       | `toast`, tone `destructive`, with a Retry action                        |
| A soft gate not yet satisfied ("pick at least one")      | Inline, `warning` ink                                                   |
| A guard actively failed ("your bank declined this card") | Inline, `destructive` ink                                               |

So the ink question resolves as "both, by cause" — and the component decides it, not the app: a
guard returning a string is a refusal (destructive), a guard returning `{ soft: true, reason }` is a
gate not yet met (warning). `onTransportError` is the only hook that reaches for a toast, and the
app supplies the toast.

## Deep links: one rule, no mode flag

MK's case: opening an existing product should land on the exact step in the URL, because every step
already holds data; creating a new product must always start at step 1. Both fall out of one
declaration per step — `isSatisfied(values)` — with no `mode="create" | "edit"` anywhere:

- A step is **reachable** when every step before it is satisfied.
- A deep link to an unreachable step rewinds to the furthest reachable one. No error state to design.
- New product: nothing satisfied, so only step 1 is reachable — a bookmark to step 4 lands on step 1.
- Existing product: loaded values satisfy every step, so every step is reachable and the link opens
  exactly where it points.
- Resume mid-create: the saved values satisfy steps 1–2, so the link opens step 3 and no further.

The same predicate drives three other things, which is why it earns its place: the rail's initial
states (all `complete` when editing an existing record, all `upcoming` when creating), whether
`navigable` has anything to offer, and which of the two phone layouts renders.

`isSatisfied` defaults to "this step has been passed in this session", so a plain create flow needs
no configuration at all.

## Orientation: automatic, overridable

`orientation` defaults to `"auto"` — vertical above five **visible** steps (counted after `when`
filtering, so a branch that adds a sixth step flips the layout), horizontal at five or fewer.
`"horizontal"` and `"vertical"` force it.

## Node icons: colour is exceptional, not decorative

Every node is neutral by default — the numbered ring, becoming a solid check when passed. Colour
enters only when a step needs attention: amber `circle-alert` for `warning`, red `circle-alert` for
`error`. A green check on every completed step would make the common case loud and leave nothing
louder for the exceptional one, and "done" is not a success condition — it is just progress.

This adds a seventh state, `warning`, distinct from `error`: the step is passable but carries
something the user should know ("VAT number unverified").

## Actions

Back sits at the far left, Continue at the far right, on one row separated by a rule. Labels are
overridable globally (`backLabel`, `nextLabel`, `submitLabel`) and per step, because the last step
of a create flow says "Create account" while the same step of an edit flow says "Save changes".

## Phone layout

Below the breakpoint the rail is replaced, and which replacement depends on the same `isSatisfied`
predicate:

- **Steps not reachable** (a linear create flow) — a compact line, `Billing · Step 3 of 5`, over a
  progress bar. Rows would promise navigation the flow does not offer.
- **Steps reachable** (editing an existing record) — a full-width section list, one row per step,
  each carrying its status icon, its label, and a chevron. Tapping a row opens that step full width
  with a back chevron to the list. This is MK's requested shape and it is honest exactly when every
  row is genuinely tappable.

---

# PR 2 as shipped — what changed from the sketch

Changeset marker `🧩`, `@vegastack/ui` MINOR, `since: 0.12.0`. Four artefacts plus the registry
item, the `ours.json` entry, the contract record, the nav entry, the rewritten guide, and the
`Navigation/layout` roster inside `tooling/verify-component-contracts.mjs`, which is hard-coded and
therefore has to be edited by hand whenever a component joins a wave.

## Decisions made during implementation

**`when` and `satisfied` are booleans, not functions over a values store.** MK chose "flow and
guards, content-agnostic", and a predicate taking `values` would have forced the component to hold
answers it had just been told not to hold. The host already has that state, so a branch is an
ordinary re-render. This is also what keeps the dependency count at zero.

**The navigable step row and the phone section rows are `Button`s.** `raw-interactive-html` forbids
a native control where a VegaStack one substitutes, and it does here. A consequence worth knowing in
tests: a disabled Button keeps pointer events and reports `aria-disabled`, not the native attribute,
so the MOVE has to refuse as well — the control's appearance cannot be the only gate. Both
directions are guarded inside `move()` and covered.

**`StepperNode` was extracted and exported from PR 1's component.** The phone section rows need the
same glyph-and-ordinal branch, and a second copy would drift the first time a state is added. It
carries its own tests, including one asserting the standalone node and the rail's node resolve to
the same class string.

**No direction-aware slide.** It would need a new `motion-*` utility, which is a token change and
belongs in a wave PR. Step bodies mount with `motion-enter-up`, the sanctioned keyed-presence
mechanism, which the global reduced-motion reset already collapses.

**The phone drill-in uses `useIsMobile`.** Mounting a different tree is the sanctioned use of the JS
branch (the ladder's last rung), and it follows `Sidebar`'s precedent of swapping to a Sheet. The
alternative — a CSS-only section list stacked above the body — puts a five-row list between the
reader and every field on a 390px screen.

## Tests, as shipped

`packages/ui/registry/ui/multi-step-form.test.tsx`, 35 tests: sequencing and submit; label
overrides global and per step; a hidden step leaving the rail, count and sequence, and a branch
closing UNDER the current step rewinding rather than stranding it; each guard shape including
async, with the loading state and no optimistic advance; a guard that throws reaching
`onTransportError`, and an inline fallback when no handler is given so it is never silent;
`beforeBack`; `lock` sealing Back and jump targets; Skip recording `skipped`; reachability driving
deep links for fresh, partly-satisfied and fully-satisfied flows; `navigable="auto"`; hash round
trip including a forged target being corrected; resume and its absence by default; both phone
layouts; the single focus move; four axe states; and a part rendered outside the root failing
loudly through an error boundary.

Every test states which side of the mobile breakpoint it is on. The first run did not, and the
runner's own viewport is under 768px — so the whole file silently exercised the phone layout, which
is exactly the class of false pass this note exists to prevent.

## Verification

`design:verify` clean. `pnpm check:component multi-step-form` 43 tests, `pnpm check:component
stepper` 96, both green. `upstream:check` clean — neither component is upstream-backed, and both are
recorded in `ours.json`, now 62 entries.

---

# Adversarial review, 2026-09-22

Scope: every file this session changed, excluding the concurrent toast/sonner/button work in the
same tree. Verdict: **needs-attention (1 high · 2 medium)** on the first pass, all three fixed at the
root and each now pinned by a test that would have caught it.

## high

**`multi-step-form.tsx` — focus did not follow the process on a phone.** In the drill-in view the
rail is not rendered, so `Stepper`'s focus move had no target and the flow's one accessibility
guarantee silently became ZERO moves. The component's own JSDoc, its docs page, its changeset and
its test all claimed "exactly one focus move per transition" — a false coverage claim, which is the
most expensive kind. The desktop test passed because browser mode runs at desktop width.
_Fix:_ `MultiStepFormNav` owns the move for the phone branch, on the same terms as `Stepper` owns it
for the rail (live transition only, never first mount), targeting the drill-in heading or the
section list. The two branches are mutually exclusive, so there is still exactly one mover.

## medium

**`multi-step-form.tsx` — the phone overview could not finish the record.** `MultiStepFormActions`
returned `null` in the overview, so a mobile edit flow's only way out was to drill into an arbitrary
step and submit from there — and MK's approved design had a Save action on that screen.
_Fix:_ the overview renders the one action that belongs to the record rather than to a step, taking
the ROOT `submitLabel` so a per-step override cannot leak into it.

**`multi-step-form.tsx` — a rejected `step` was ignored rather than corrected.** A host passing an
unreachable step (from its own router, say) got a different step rendered and was never told, so its
state stayed wrong until the next move produced an inexplicable jump.
_Fix:_ the resolution is reported through `onStepChange`, once per resolution, so a host that
ignores it cannot be spun.

## Also found and fixed

**`stepper.mdx` § Scope still pointed at the retired guide recipe.** The edit that was supposed to
rewrite that table used `str.replace` with no assertion and matched nothing, because Prettier had
reformatted the column widths between writing the pattern and running it. The page therefore shipped
a row reading "see the multi-step form guide" next to a paragraph introducing `MultiStepForm`.
_Class, not instance:_ every scripted edit in this round now asserts its pattern matched before
writing. A silent no-op replace is indistinguishable from success in the diff.

## Scope gaps — two plan-promised features were simply absent

Checking the implementation against the plan's own feature list, rather than against memory of
it, found two v1 features MK selected that had never been built. Both are now implemented,
documented, fixtured and tested.

**Modal placement** (§ Modal placement above, which claimed "Verified in a geometry fixture").
There was no `layout` prop, no dialog fixture and no test. Now `layout="flow" | "panel"`: in a
panel the nav and the action row are `shrink-0` and the step body takes `min-h-0 flex-1
overflow-y-auto`, so the frame holds and only the middle scrolls. A `multiStepFormDialog`
fixture exercises it inside a real `Dialog` with an overflowing body, and the affected planner
now selects six geometry fixtures rather than five.

**Exit guard** (§ Exit guard above). There was no `onBeforeExit`, no `dirty`, no `AlertDialog`.
Shipped instead as `dirty` + `onExit` + a `MultiStepFormExit` part, because a component that does
not own the dialog cannot intercept its close — the host triggers the exit and the component
decides whether to ask. `dirty` also attaches the browser's own `beforeunload` warning, which is
the half no component can fake, and detaches it the moment the flow unmounts.

## Two more test-harness defects, both the same class as before

**A spy on `window.addEventListener` took four unrelated tests down with it.** Asserting the
BEHAVIOUR — dispatch a cancelable `beforeunload` and read `defaultPrevented` — needs no global at
all and is the stronger claim.

**`unmount()` followed by another `render()` inside one test detaches the container**, exactly as
the Stepper suite already documents. The refresh-warning test was split in two.

**And the same silent-no-op replace struck twice more**, once inserting tests against a marker
whose dash count Prettier had changed, and once in a script that asserted a later pattern and
therefore never wrote the earlier, already-applied one. Every scripted edit in this round now
asserts before writing, and the write happens only once all patterns have matched.

## Checked and clean

Regenerators idempotent (`registry:build`, `design:derived` twice, no growth) · `design-lint` clean
over `packages/ui/registry` including the AST passes · `upstream:check` clean, both components
recorded in `ours.json` · the affected planner selects all five `multiStepForm*` geometry fixtures,
so the visual lane is not vacuous · no stale `blockedReason`, `stepperBlocked` or old-guide-title
reference outside the historical ledgers, audits and CHANGELOG, where they are correct · a disabled
`Button` was PROVED not to fire `onClick`, so the section rows need no second guard · the contract
record's `dataAttributes` went stale the moment the overview action landed and was regenerated from
source rather than hand-patched.
