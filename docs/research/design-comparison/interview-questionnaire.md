# VegaStack Design System — Discovery Questionnaire

> The goal: produce **the best `design.md`**, synthesized from the best (Vercel's rigor, ElevenLabs'
> & Cursor's character) and tuned to _us_ — an agentic-enterprise product system, 2026-and-beyond,
> with **character + consistency**, minimalist, flat, clean, modern, _not_ over-customized.

## How to use this doc (the rules of engagement)

- **You decide every call.** I (the design lead) supply: the reference precedents, the current VegaStack
  stance (so you know what you'd be changing), the options with trade-offs, and a **⚠ Cohesion flag**
  wherever a choice would fight the rest of the system. **I draw no conclusions** — the `→ Your call:`
  line is yours.
- **I will push back.** If an answer breaks cohesion with earlier answers or the overall POV, I'll say so
  before recording it. Correcting drift is my job.
- **Foundation first.** Parts 1–6 cascade into everything; answer them before the component parts. A late
  change to (say) warmth or radius re-opens dozens of component answers.
- **Format per decision:** `Refs` = what Vercel(V) / ElevenLabs(E) / Cursor(C) did · `Now` = our current
  `design.md` stance · `Options` · `⚠` = cohesion risk · `→ Your call:`.
- **Reference genre note:** V is a _product_ system (our sibling). E and C are _brand/marketing-site_ style
  guides — borrow their _character moves_ (warmth, type stance, color rationing, motif), not their
  component lists (they have no dropdowns/dialogs/tables).

---

# PART 1 — Brand soul & character

_Everything downstream cascades from here. This is the part we skipped, and the part the other two
references are built around._

#### Q1.1 — The one-line claim

**The question:** What is the single sentence that makes VegaStack _unmistakably_ itself? (E: "parchment command terminal, sound made visible." C: "warm paper command center, espresso ink, one underline-orange.")
**Now:** "Calm neutral chrome, white-on-hairline" — a _description_, not a claim. ⚠ My pushback: this is generic.
**→ Your call:** ________

#### Q1.2 — Personality (pick 3–5 adjectives, rank them)

**Refs:** E = restrained, editorial, tactile, authoritative-by-whisper. C = warm, editorial, confident, code-adjacent.
**Now:** quiet, precise, neutral, enterprise-trustworthy.
**Options to react to:** _precise · calm · warm · editorial · technical · confident · futuristic · human · serious · playful · premium · utilitarian._
**→ Your call (ranked):** ________

#### Q1.3 — Which reference feels most "us"?

**Options:** A) Vercel (clinical, neutral, product-grade) B) ElevenLabs (warm paper, light-weight type, color-as-art) C) Cursor (warm editorial, espresso ink, rationed orange) D) None — a 4th direction (describe).
**⚠** Your answer here pre-loads warmth, type, and color decisions below.
**→ Your call:** ________

#### Q1.4 — Brand vs product: one system or two layers?

**The question:** Do marketing/site surfaces and product/app surfaces share ONE system, or a **brand layer** (expressive: display font, big type, motif) sitting over a **product layer** (the restrained component system)? E and C are _only_ brand layers; V is _only_ product; we likely need both.
**Now:** product layer only; no brand/marketing layer defined.
**→ Your call:** ________

#### Q1.5 — The signature / motif (the "agent" identity)

**The question:** Do we have a signature visual device? E has the violet-orange **voice orb** (sound→color). C has the **product-screenshot-as-hero**. For an AI/agent product, the "agent presence" is the natural motif.
**Now:** none — `agent` is a purple token, with no visual device.
**Options:** A) none (pure restraint) B) a generative/ambient mark (orb/aurora/particle) for AI moments C) a typographic/glyph motif D) a gradient signature (agent purple → action blue).
**→ Your call:** ________

#### Q1.6 — Default theme & which theme is "the brand"

**The question:** Dev/agent tools skew dark (Cursor/Linear/v0); enterprise admin skews light; our refs are all light. Which is the _default_, and which theme defines the brand's first impression?
**Now:** light-first, dark co-primary (both built & gate-verified).
**Options:** A) light default B) dark default C) system/auto, brand-shots in dark D) revisit "co-primary."
**→ Your call:** ________

#### Q1.7 — Degree of customization (the tension you named)

**The question:** "Character but not too much customization." How many _strong, opinionated_ moves do we allow? The best refs commit to **1–2** (E: light display font + color-as-art; C: warm ink + one orange) and stay ruthless elsewhere.
**→ Your call (which 1–2 are our hills to die on?):** ________

#### Q1.8 — Era & longevity

**The question:** "2026 and beyond" — do we optimize for _timeless_ (Vercel-neutral, ages slowly) or _of-the-moment-2026_ (warm, light-weight type, P3 color, which reads current but dates faster)?
**→ Your call:** ________

---

# PART 2 — Color

_The biggest character lever after type. We currently have pure-gray neutrals + 5 chromatic families +
8 charts, all OKLCH, dark co-primary._

#### Q2.1 — Neutral temperature ⚠ (high impact)

**The question:** Warm, cool, or pure-neutral greys?
**Refs:** E = **warm** (parchment `#fdfcfc`/sand `#f5f3f1`). C = **warm** (parchment `#f7f7f4`/stone `#e6e5e0`). V = pure cool-neutral.
**Now:** pure neutral (OKLCH chroma 0).
**Options:** A) keep pure neutral (safe, clinical) B) warm (parchment/sand — character, "human", both character-refs chose this) C) cool (slightly blue, "techy") D) warm light / cool dark.
**⚠** This re-tints every surface, border, and text token in both themes. Decide early.
**→ Your call:** ________

#### Q2.2 — Pure black vs tinted near-black for ink

**Refs:** C bans pure `#000` ("Espresso Ink `#26251e`"). E uses pure `#000`. V uses `#171717` (near-black, neutral).
**Now:** `foreground` = `neutral-900` `#191919` (pure grey).
**→ Your call:** ________

#### Q2.3 — Color philosophy: rationed vs full-semantic

**The question:** How much color, and where?
**Refs:** E = **none** at UI layer (no status colors). C = **rationed** to interactive moments ("95% achromatic"). V = **full** semantic (blue/red/amber/green/teal/purple/pink, intent-encoded).
**Now:** full semantic (destructive/success/warning/action/agent) + 8 charts.
**⚠** A product _needs_ error/success states (refs are marketing sites that don't). The real question is _prominence_ and _whether non-status accents (action/agent) earn their keep._
**→ Your call:** ________

#### Q2.4 — Token architecture: intent-scales vs semantic-ramps ⚠

**The question:** Vercel's **10-step intent scale** (the step _encodes_ the role: 100 bg, 400 border, 700 fill, 1000 text) vs our **6-token semantic ramp** per family (fill/hover/active/foreground/subtle/text).
**Now:** semantic ramps + a documented neutral ramp.
**Options:** A) keep semantic (shadcn-aligned, what 64 comps use) B) adopt Vercel's intent-scales as the public API C) hybrid: semantic API + a documented intent-labeled neutral ramp underneath (we leaned here).
**→ Your call:** ________

#### Q2.5 — The brand / primary accent

**The question:** Is there ONE color that is _VegaStack's_? C = orange `#f54e00`. E = none (mono). V = blue `#006bff`. Ours is grayscale `primary` (charcoal) + `action` blue + `agent` purple — **no owned brand hue.**
**Options:** A) stay grayscale-primary (no brand color) B) `action` blue becomes the brand C) `agent` purple becomes the brand (AI-forward) D) a new distinctive brand hue.
**→ Your call:** ________

#### Q2.6 — Accent count & roster

**The question:** How many accents total, and which? We have `action`(blue) + `agent`(purple). Do we need both? Add/drop any?
**→ Your call:** ________

#### Q2.7 — Status palette: which states & how many

**The question:** destructive/success/warning/info(=action) — enough? Agentic/observability often needs _running / queued / paused / cancelled_ too.
**Now:** 4 states; agent sub-states deferred.
**→ Your call:** ________

#### Q2.8 — Status fill style: solid vs soft default

**Refs:** V solid fills (`red-800`). C soft/outline ("not as background"). E none.
**Now:** white-on-solid fills, with soft (`subtle`) variants.
**→ Your call:** ________

#### Q2.9 — Dark theme character

**The question:** Is dark just inverted-light, or its own character (e.g., warm-charcoal vs true-black vs blue-black)?
**Now:** neutral dark, co-derived (not inverted-by-formula).
**→ Your call:** ________

#### Q2.10 — P3 / wide-gamut strategy

**Refs:** V ships sRGB hex + `*-p3` oklch fallback. We're **OKLCH-native** already.
**The question:** Ship OKLCH primary (P3-capable) with hex fallback (our current), or hex-primary + P3 variants (Vercel)?
**→ Your call:** ________

#### Q2.11 — Charts: confirm or expand

**Now:** 8-hue categorical (in-gamut, ≥3:1, light+dark). Confirm 8? Need sequential/diverging scales for heatmaps/gradients too?
**→ Your call:** ________

#### Q2.12 — Gradients / chromatic decoration

**The question:** Do we allow gradients at all? E uses them _only_ in the orb (decorative). C: none. V: none.
**Now:** none (flat).
**→ Your call:** ________

---

# PART 3 — Typography

_The second-biggest character lever. We use Geist Sans/Mono, 6-size scale, 600 headings, 14px body._

#### Q3.1 — Display/brand typeface ⚠ (high impact)

**The question:** Off-the-shelf or a **custom/brand display face**?
**Refs:** E = custom Waldenburg (+ Inter UI). C = custom CursorGothic (everything). V = Geist (own, but functional not "display").
**Now:** Geist Sans for all (no display face).
**Options:** A) Geist everywhere (current, neutral) B) Geist UI + a distinctive _display_ face for headings/marketing (character) C) a single custom face with personality (Cursor model) D) license a characterful sans (e.g., a grotesk/humanist with DNA).
**→ Your call:** ________

#### Q3.2 — Headline weight ⚠ (high impact, very "2026")

**The question:** Bold or light headlines?
**Refs:** E = **300 (light)**, anti-convention "whisper authority." C = **400 single-weight**, "editorial authority without bold." V = 600.
**Now:** 600 (bold).
**Options:** A) 600 bold (conventional, safe) B) 500 medium C) **single-weight 400** (editorial) D) **light 300** display, regular UI (most distinctive, most 2026).
**⚠** This is _the_ move that separates "generic dev tool" from "characterful." But light type needs care for legibility/contrast.
**→ Your call:** ________

#### Q3.3 — Type-scale model & granularity

**The question:** Our **6 role sizes** (h1–h4/body/small) vs Vercel's **role-family system** (heading / label / copy / button, each at many sizes) vs E/C's brand scale.
**Now:** 6 sizes. ⚠ Vercel's label-vs-copy-vs-button distinction (same px, different line-height/weight/role) is more expressive for a product — worth considering.
**→ Your call:** ________

#### Q3.4 — Base body size (re-confirm)

**Refs:** V `copy-14`/`label-14` default (14). E body 16. C body 13–16, compact.
**Now:** 14px (revised from 13). Confirm 14? Compact 13 density token?
**→ Your call:** ________

#### Q3.5 — Tracking / letter-spacing philosophy

**Refs:** all three tighten tracking as size grows (V to `-4.32px@72`; C `-0.03em@72`; E `-0.02em`). E also adds _positive_ micro-tracking to small UI text (`0.01em`).
**Now:** slight negative on h1/h2 only.
**→ Your call:** ________

#### Q3.6 — Monospace: role & prominence

**Refs:** all use a mono (Geist Mono / berkeleyMono) for code/data. C gives mono its own _weight 500_ emphasis. For an _agent_ product, mono is heavy-use (tool output, code, logs).
**Now:** Geist Mono for code/data/tabular.
**→ Your call (where exactly does mono appear? numbers? IDs? agent output?):** ________

#### Q3.7 — Serif accent?

**Refs:** C uses **EB Garamond** sparingly for editorial pull-quotes ("literary counterpoint"). E/V: none.
**Now:** none.
**→ Your call:** ________

#### Q3.8 — Tabular numerals & data type

**The question:** Enterprise = lots of numbers/tables. Tabular figures everywhere numbers align? Dedicated `data`/`metric` type token?
**→ Your call:** ________

#### Q3.9 — Number of weights allowed per view

**Refs:** V "never more than two font weights in one view."
**Now:** 400/500/600.
**→ Your call:** ________

---

# PART 4 — Shape & form (radius, density, borders)

#### Q4.1 — Button shape ⚠ (high-visibility character)

**The question:** Pill or rounded-rect buttons?
**Refs:** E **pill (9999px) on ALL buttons.** C **pill on all buttons** (tags/inputs 4px). V rounded-rect 6px.
**Now:** rounded-`md` 8px rects.
**Options:** A) rects (current, product-conventional) B) pills (strong character, both character-refs) C) pills for primary/marketing CTAs, rects for dense product controls.
**→ Your call:** ________

#### Q4.2 — Overall radius character

**Refs:** E soft/large (cards 20–24px). C tight (4/8/pill). V tight (6/12/16/pill).
**Now:** 4-step 6/8/12/full.
**Options:** A) tight & sharp (techy, V/C) B) soft & rounded (friendly, E) C) current mid.
**→ Your call:** ________

#### Q4.3 — Radius scale count & values (re-confirm)

**Now:** sm6/md8/lg12/full. V: sm6/md12/lg16/full. E: many. Keep 4? Values?
**→ Your call:** ________

#### Q4.4 — Density

**Refs:** E "comfortable", C "compact", V mid. Control heights: V 32/40/48, C compact pills.
**Now:** 28/34/40 (sm/md/lg).
**→ Your call:** ________

#### Q4.5 — Border style (re-confirm)

**Refs:** E/C hairline warm borders (`#e5e5e5` / `#d9d5cf`). V translucent `gray-alpha`. We: alpha hairlines (9–16%).
**Now:** alpha hairlines + `border-strong` for data-dense. Confirm?
**→ Your call:** ________

#### Q4.6 — Inputs: filled vs outlined, and radius vs buttons

**Refs:** E inputs **0px radius** ("editorial/typewritten", distinct from pills). C inputs filled stone, 4px. V outlined, 6px.
**Now:** `secondary` subtle fill + hairline border, `md` radius.
**⚠** E's "inputs are flat, buttons are pills" is a deliberate _contrast_ device. Do inputs and buttons share a shape language or deliberately differ?
**→ Your call:** ________

---

# PART 5 — Elevation & depth

#### Q5.1 — Elevation signal: surface-contrast vs shadow ⚠

**Refs:** E **surface-contrast first**, shadows = sub-pixel hairlines only ("never soft blurs"). C **soft layered shadows** for screenshot cards/modals (heavier). V **tonal surfaces + borders first**, then subtle multi-tier shadows.
**Now:** flat by default + ONE subtle overlay shadow.
**Options:** A) flat + 1 overlay shadow (current) B) flat + hairline-only (E, most minimal) C) tiered shadow system (V: raised/popover/modal) D) bolder shadows for floating cards (C).
**→ Your call:** ________

#### Q5.2 — Shadow vocabulary / tiers

**The question:** How many elevation levels? V defines 3 (raised card / popover / modal). We define 1.
**→ Your call:** ________

#### Q5.3 — Inset / "pressed" treatment

**Refs:** E uses inset shadows for active tabs/wells. Do we? (active segmented, pressed states.)
**→ Your call:** ________

---

# PART 6 — Motion

#### Q6.1 — Motion stance

**Refs:** V "0ms is often the best choice"; ease `cubic-bezier(0.175,0.885,0.32,1.1)` (springy); 150/200/300ms tiers. E/C minimal.
**Now:** 150/200/300, ease `cubic-bezier(0.4,0,0.2,1)` (Material-ish).
**Options:** A) snappy/near-instant (V) B) gentle/physical C) springy (V's bezier).
**→ Your call (default duration + easing):** ________

#### Q6.2 — Agent-native motion ⚠ (future)

**The question:** Streaming text, "thinking" pulse, tool-call progress, token-by-token reveal — these are core to an agent product and have _no precedent_ in the refs. Do we define a motion language for AI?
**→ Your call:** ________

#### Q6.3 — Reduced-motion contract

**Now:** honor `prefers-reduced-motion`. Confirm the rule (drop non-essential vs essential-only)?
**→ Your call:** ________

---

# PART 7 — The 50+ components

_Foundation (Pts 1–6) determines most of this. Below: the decisions a component makes that the
foundation doesn't already settle. Per-component micro-decisions use the template at the end (Q7.X)._

### 7A — Per-component decision template (applies to EVERY current & future component)

For each component, we must lock: **(1)** variants/intents · **(2)** sizes · **(3)** every state
(default/hover/active/focus/disabled/loading/error/empty/selected/read-only) · **(4)** radius family ·
**(5)** which tokens it consumes · **(6)** density/padding · **(7)** a11y (roles, keyboard, focus) ·
**(8)** RTL/i18n · **(9)** does it need a _compact_ and a _comfortable_ density · **(10)** dark-theme deltas.
_Use this as the intake checklist for any new component so nothing ships half-specified._

### 7B — Actions

#### Q7.1 — Button: variant roster

**Now:** primary(charcoal)/secondary/ghost/action/agent/destructive + soft. **Refs:** V primary/secondary/tertiary/error + sizes; E/C primary-pill/ghost-outline. **Decide:** final variant list, which is "the one primary", do `action`/`agent` get _filled_ buttons or only accents?
**→ Your call:** ________

#### Q7.2 — Button sizes, icon-only, loading, split-button, button-group

**Decide:** sizes (xs/sm/md/lg?), icon-only shape (square vs pill), loading spinner placement, split-button divider, toggle-button, button-group seams.
**→ Your call:** ________

#### Q7.3 — Icon button / Copy button / Toggle / Toggle-group

**Decide:** square vs circular, hover treatment, active/pressed, copy-confirm feedback.
**→ Your call:** ________

### 7C — Forms (input, textarea, field, field-inline, label, checkbox, switch, radio, slider, select, password, otp, auto-save, country/state-select, date/color/emoji-picker)

#### Q7.4 — Field anatomy

**Decide:** label position (top/inline/floating), required/optional marker, help text, error placement, character count, the label↔control↔help spacing.
**→ Your call:** ________

#### Q7.5 — Control fill & focus (inherits Q4.6, Q-focus)

**Decide:** fill vs outline (confirm), focus = neutral border shift (confirmed), error = `destructive` border, disabled treatment, read-only treatment.
**→ Your call:** ________

#### Q7.6 — Selection controls character

**Decide:** checkbox shape/check style, radio dot, switch track/thumb proportions & on-color (`action`?), slider thumb/track/fill.
**→ Your call:** ________

#### Q7.7 — Pickers (date/color/emoji/country/state)

**Decide:** popover vs inline vs dialog, calendar grid style, search-in-picker, the picker shadow/elevation tier.
**→ Your call:** ________

#### Q7.8 — OTP / password / auto-save

**Decide:** OTP cell shape & focus, password reveal affordance, auto-save status indicator (saving…/saved).
**→ Your call:** ________

### 7D — Overlays (dialog, alert-dialog, sheet, popover, tooltip, hover-card, dropdown-menu, context-menu, command-menu)

#### Q7.9 — Overlay surface & elevation (inherits Pt 5)

**Decide:** shared `popover` surface, `overlay-border`, shadow tier, scrim opacity, blur on/off, corner radius family (V: 12px for menus/modals).
**→ Your call:** ________

#### Q7.10 — Dialog/modal anatomy

**Decide:** max-widths, header/body/footer rhythm, close affordance, action alignment (right? full-width on mobile?), stacked-dialog behavior.
**→ Your call:** ________

#### Q7.11 — Menus (dropdown/context/command)

**Decide:** item height, hover fill (`accent`), icon/shortcut/submenu treatment, separators, destructive items, command-menu (⌘K) search + groups + recent.
**→ Your call:** ________

#### Q7.12 — Tooltip / hover-card

**Decide:** dark-on-light vs surface-colored tooltip, delay, max-width, arrow on/off, hover-card richness.
**→ Your call:** ________

#### Q7.13 — Sheet / drawer

**Decide:** sides, sizes, scrim, mobile = sheet vs dialog.
**→ Your call:** ________

### 7E — Navigation (tabs, breadcrumb, pagination, page-header, sidebar, command-menu)

#### Q7.14 — Tabs

**Decide:** underline vs pill vs segmented; active indicator color (`action`?); scrollable/overflow.
**→ Your call:** ________

#### Q7.15 — Sidebar ⚠ (the app shell — high impact)

**Decide:** width, collapsed/rail mode, nav-row hover/active (radius `md`, `accent` fill — confirmed), sections, footer, mobile behavior, the sidebar's own surface/temperature.
**→ Your call:** ________

#### Q7.16 — Page header / breadcrumb / pagination

**Decide:** header layout (title/desc/actions), breadcrumb separators, pagination style (numbered vs prev/next vs load-more).
**→ Your call:** ________

### 7F — Data display (table, data-list, card, avatar, badge, kbd, status-icon, progress, progress-indicator, truncated-text, separator, accordion, collapsible, relative-time, markdown-view, settings-row, image, filter-bar)

#### Q7.17 — Table ⚠ (enterprise core)

**Decide:** row height/density, header style, zebra vs `border-strong` separators, sticky header/column, sort/filter affordances, selection, row hover, empty/loading, expandable rows, cell types (mono numbers?).
**→ Your call:** ________

#### Q7.18 — Card

**Decide:** flat (confirmed), padding scale, header/media/footer, interactive (hover) vs static, the card-on-card nesting rule.
**→ Your call:** ________

#### Q7.19 — Badge / chip / tag / kbd

**Decide:** radius (pill vs `sm`), status variants (subtle vs solid vs dot), count badge, kbd key style.
**→ Your call:** ________

#### Q7.20 — Avatar

**Decide:** shape (circle vs squircle), gradient/initials/image, status-dot, group/stack, the avatar gradient palette (currently decorative violet — tokenize?).
**→ Your call:** ________

#### Q7.21 — Accordion / collapsible / settings-row / data-list

**Decide:** chevron style, divider vs card, expand animation, settings-row layout (label/desc/control), data-list density.
**→ Your call:** ________

#### Q7.22 — markdown-view (agent output — heavy use)

**Decide:** prose type scale, code-block style, table-in-markdown, link color (`action`), the rendering of agent-generated content.
**→ Your call:** ________

### 7G — Feedback (alert, toast/sonner, skeleton, spinner, empty-state, notification-bell, status-icon, progress)

#### Q7.23 — Alert / toast

**Decide:** soft (subtle bg + text + icon — confirmed) vs solid, icon-required (confirmed), toast position/stacking/duration, action-in-toast.
**→ Your call:** ________

#### Q7.24 — Empty state ⚠ (needs art? — links to Pt 9)

**Decide:** icon vs illustration vs nothing, copy pattern (Vercel's "point to first action"), CTA.
**→ Your call:** ________

#### Q7.25 — Skeleton / spinner / progress

**Decide:** skeleton style (pulse vs shimmer), spinner style, progress bar vs ring, indeterminate treatment.
**→ Your call:** ________

### 7H — Component intake (future components)

#### Q7.26 — Governance for new components

**The question:** Every future component runs the 7A template + a cohesion review against the locked POV. Who approves a _new_ token vs reusing existing? What's the bar for adding a component to the registry?
**→ Your call:** ________

---

# PART 8 — Agent-native / AI patterns

_No precedent in the references — this is where an agentic-enterprise system must lead._

#### Q8.1 — Reasoning / "thinking" block

**Decide:** collapsible? color (`agent` purple — current), the "Reasoned for Ns" affordance, streaming reveal.
**→ Your call:** ________

#### Q8.2 — Tool-call / action block

**Decide:** card vs inline chip, running/done/error states, collapsible output, diff rendering (success/destructive tints — current), terminal/log style.
**→ Your call:** ________

#### Q8.3 — Agent run states ⚠

**Decide:** running/queued/paused/cancelled/succeeded/failed — colors, dots, the live "pulse." (Deferred earlier — do we define now?)
**→ Your call:** ________

#### Q8.4 — Streaming & token reveal (links Q6.2)

**Decide:** cursor, fade-in, typewriter vs chunk, "stop" affordance.
**→ Your call:** ________

#### Q8.5 — Plan / todo / multi-step UI

**Decide:** checklist style, step states, the agent-plan widget.
**→ Your call:** ________

#### Q8.6 — Citations / sources / confidence

**Decide:** inline citation style, source chips, confidence indicators.
**→ Your call:** ________

#### Q8.7 — Token/cost meters, model picker, composer

**Decide:** meter style, model chip, the chat composer (fill — confirmed `secondary`, send = `action`).
**→ Your call:** ________

#### Q8.8 — The "AI surface" distinction

**The question:** Should AI-generated/agent surfaces be _visually distinct_ from normal UI (purple accent, subtle tint, motif)? How far?
**→ Your call:** ________

---

# PART 9 — Imagery, illustration, icons, brand assets

#### Q9.1 — Icon system

**Decide:** library (lucide — current), stroke weight, size scale, two-tone vs mono, when brand/`thesvg` icons appear.
**→ Your call:** ________

#### Q9.2 — Illustration / empty-state art

**The question:** Do we have an illustration system at all? E = orbs only; C = screenshots only (no illustration).
**Decide:** none / geometric / generative / spot-illustrations; style if any.
**→ Your call:** ________

#### Q9.3 — Product screenshots & framing

**Decide:** how product UI is framed in marketing (C's floating screenshot card model), device frames, shadows.
**→ Your call:** ________

#### Q9.4 — The brand motif (links Q1.5)

**Decide:** the signature device (orb/aurora/gradient/glyph) — form, where it appears, animated or static.
**→ Your call:** ________

#### Q9.5 — Logo & wordmark

**Decide:** wordmark typeface/tracking (E's `WaldenburgFH 0.05em` model), lockup, clear-space, mono/color variants.
**→ Your call:** ________

#### Q9.6 — Photography

**Decide:** any? (E/C: essentially none.) Treatment if yes.
**→ Your call:** ________

---

# PART 10 — Voice & content

#### Q10.1 — Adopt Vercel's voice rules?

**The question:** V's voice section is excellent (we already borrowed it): Title Case labels / sentence body; verb+noun actions; errors = what+fix; toasts drop "successfully" & trailing period; empty states point to first action; present-participle for in-progress; numerals, curly quotes, ellipsis; no "please"/superlatives. **Adopt verbatim, or tune?**
**→ Your call:** ________

#### Q10.2 — Agent/AI voice

**The question:** How does the _agent_ speak? (Confidence, hedging, error honesty, "thinking" copy.) The refs don't cover this; an agent product must.
**→ Your call:** ________

#### Q10.3 — Terminology & casing for AI concepts

**Decide:** "agent" vs "assistant", "reasoning" vs "thinking", capitalization of AI features.
**→ Your call:** ________

---

# PART 11 — Accessibility & inclusivity

#### Q11.1 — Contrast contract

**Now:** WCAG 2.1 AA, fail-closed gate. Confirm AA (vs AAA for some)? Non-text 1.4.11 stance (the input-border tension — strict VPAT or documented deviation)?
**→ Your call:** ________

#### Q11.2 — Focus (re-confirm) ⚠

**Now:** neutral `ring` shift, keyboard-only, never blue, never removed. ⚠ This _diverges from Vercel_ (V uses a 2-layer blue focus ring) — is the neutral-no-ring choice final for an enterprise product (VPAT scrutiny)?
**→ Your call:** ________

#### Q11.3 — Color-independence, motion, keyboard, screen-reader

**Decide:** never-color-alone (confirmed), full keyboard nav, SR landmarks/labels, reduced-motion, target sizes (24/44px).
**→ Your call:** ________

#### Q11.4 — Internationalization

**Decide:** RTL support, CJK type fallback, number/date locale, dynamic text length.
**→ Your call:** ________

---

# PART 12 — Governance, theming, distribution & the `design.md` itself

#### Q12.1 — Theming / white-label

**The question:** Is this _only_ VegaStack, or a themeable base others reskin (override `--primary` etc.)? How far can a consumer customize before it's "not VegaStack"?
**→ Your call:** ________

#### Q12.2 — `design.md` format & generation

**The question:** Single self-contained file (V/E/C model — we have this) **generated from `@vegastack/tokens`** with a CI drift-check (our plan), plus a Resend-style skill pointer. Confirm? Light + dark = one file or two (V splits `/design.dark.md`)?
**→ Your call:** ________

#### Q12.3 — What lives in `design.md` vs the skill vs Storybook

**Decide:** the boundary between the spec (`design.md`), the agent skill (`references/`), and component docs.
**→ Your call:** ________

#### Q12.4 — Versioning & change control

**Decide:** how the design.md versions, who signs off token changes, the relationship to the Changesets release flow.
**→ Your call:** ________

#### Q12.5 — "Similar brands" / positioning

**The question:** E/C both list peer brands to anchor the aesthetic. Who are _our_ aesthetic peers, and who do we explicitly _not_ want to look like?
**→ Your call:** ________

---

## Closing — sequence I recommend we work through

1. **Part 1** (soul) in one sitting — it unlocks everything.
2. Then **2–6** (color, type, shape, elevation, motion) — the cascade.
3. Then **7** family-by-family, **8** (agent), **9** (brand assets).
4. **10–12** are mostly confirmations.
   After each part, I'll (a) record your calls, (b) flag any answer that fights an earlier one, and (c) show
   the running picture so we catch incoherence early — exactly how an agency runs a design sprint.

> When every `→ Your call:` is filled and cohesion-checked, _that_ is the brief I generate the final
> `design.md` from. Until then, the current `design.md` stands as our working draft.
