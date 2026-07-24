---
version: alpha
name: Aster
description:
  A light-mode AI workspace web app (Chat / Agent / Code / Design) with a
  full-bleed pure-white canvas, neutral-gray hairline-only depth, and scoped
  pastel accents. The hero surface is a centered composer with an upgrade strip,
  suggestion cards, and a connect-channel banner.

colors:
  # ---- Surfaces ----
  canvas: "#ffffff"           # pure-white canvas (topbar, sidebar, main) — full-bleed
  surface-card: "#ffffff"     # cards, composer, inputs — same white, hairline-separated
  surface-strip: "#fafafa"    # upgrade strip / inset fills (measured)
  surface-tile: "#f5f5f5"     # artifact preview tile fill
  skeleton: "#e9e9e9"         # solid placeholder bars in previews

  # ---- Ink ramp (neutral, not warm) ----
  ink: "#1a1a1a"
  text-secondary: "#555555"
  text-muted: "#8a8a8a"
  text-faint: "#a9a9a9"
  text-label: "#404040"       # 500-weight list labels ("What you get:") — measured; between ink and secondary

  # ---- Hairlines (neutral black at very low alpha) ----
  hairline: "rgba(0,0,0,0.07)"
  hairline-soft: "rgba(0,0,0,0.04)"

  # ---- Interaction fills ----
  fill-active: "#f5f5f5"               # active pill (tab, nav row) — measured
  fill-hover: "rgba(0,0,0,0.03)"
  fill-cta: "#333333"                  # filled CTA charcoal (Upgrade pill, button-primary) — measured #333, NOT ink
  badge-neutral: "#f0f0f0"             # neutral gray wash ("Free" plan badge, app-grid add button) — measured; one step below fill-active
  scrim: "rgba(0,0,0,0.28)"            # modal backdrop wash over a 10px blur — measured (white 255 → 184)
  modal-border: "rgba(0,0,0,0.4)"      # dialog edge line — measured ≈ #999 at the card boundary; the one
                                       # heavy border in light mode (hairlines would vanish over the scrim)

  # ---- Scoped accents (each bound to exactly one role) ----
  accent-new: "#e5484d"        # red "New" feature badge (sidebar)
  accent-new-soft: "#fff2f2"   # red badge wash (measured)
  accent-danger: "#e5484d"     # destructive button fill (dark: #ff5d62)
  accent-danger-soft: "#fff2f2"# destructive outline hover wash (dark: red @18%)
  accent-info: "#3b82f6"       # blue "New" capability badge (composer)
  accent-info-soft: "#eaf1fe"  # blue badge wash
  accent-model: "#e5532d"      # red-orange starburst model mark (Opus)
  accent-send: "#b7d9f8"       # soft blue send button (idle, measured)
  accent-gold: "#f2c14e"       # sticky-note gold (banner stack)
  avatar-a: "#b79cff"          # avatar gradient start
  avatar-b: "#7a5af8"          # avatar gradient end
  # (Book-a-Demo CTA fill folded into accent-info — was its own blue #0391ff)
  accent-price-deep: "#0169a8" # price badge text ("$650/month", measured)
  accent-price-soft: "#f0f9ff" # price badge wash (measured)

  # ---- Banner tile gradient + channel dots ----
  tile-grad-a: "#c5d8f7"
  tile-grad-b: "#e3d3f3"
  tile-grad-c: "#f5d9e2"
  dot-teal: "#2aabc8"
  dot-green: "#43c463"
  dot-blue: "#4f7df9"

  # ---- Terminal traffic lights (welcome page terminal card only) ----
  traffic-red: "#ff5f57"
  traffic-amber: "#febc2e"
  traffic-green: "#28c840"

  # ---- Device panel gradient + run status (mobile pair page) ----
  panel-grad-sky: "#84c3f9"    # blue bloom, panel mid-left (measured)
  panel-grad-lav: "#e2e0fc"    # lavender, panel top-left (measured)
  panel-grad-peri: "#9badf9"   # periwinkle, panel bottom (measured)
  panel-grad-deep: "#6592f8"   # deep blue, panel bottom-right (measured)
  status-run: "#00bcff"        # active-run indicator dot — sidebar + phone recents (measured)

  # ---- Onboarding-modal art (welcome-page dialog header; imagery — holds
  # light values in both themes) ----
  modal-grad-violet: "#b173f9" # left-edge bloom (measured)
  modal-grad-peri: "#a49efa"   # periwinkle top band (measured)
  modal-grad-sky: "#d0e6fc"    # pale cyan top-right corner (measured)

  # ---- Plan-banner art (plans page card headers; imagery — holds light
  # values in both themes) ----
  plan-grad-cyan: "#76d3e2"    # starter banner base (measured)
  plan-grad-gold: "#f9d286"    # starter bloom core (measured)
  plan-grad-sand: "#e0d9d4"    # starter cream corner (measured)
  plan-grad-blue: "#8db5df"    # pro banner base (measured)
  plan-grad-amber: "#f3b24e"   # pro bloom core (measured — NOT accent-gold)
  plan-grad-orchid: "#efbdd7"  # pro pink petals (measured)

  # ---- Marketplace banner art (apps page promo banner; imagery — holds
  # light values in both themes) ----
  apps-grad-violet: "#af92f0"  # left bloom (measured)
  apps-grad-indigo: "#707eee"  # top-left accent (measured)
  apps-grad-sky: "#89c9f1"     # right field (measured)
  apps-grad-cyan: "#64bce6"    # bottom-right edge (measured)

  # ---- Dark theme (html[data-theme="dark"]) — measured from the dark-mode
  # reference screenshots (home, plans, artifacts/agent quadrants). Like light
  # mode, dark is flat and full-bleed: canvas = topbar = sidebar, separated by
  # hairlines only. Receding insets/strips drop to #1c1c1c; the composer, cards,
  # and inputs lift to #212121; filled buttons to #3a3a3a ----
  dark-canvas: "#1a1a1a"            # canvas / topbar / sidebar — flat, hairline-separated (measured)
  dark-surface-chrome: "#1a1a1a"    # topbar + sidebar = canvas, hairline-only (measured)
  dark-surface-card: "#212121"      # composer, cards, inputs, search (measured)
  dark-surface-strip: "#161616"     # recessed footer tray — upgrade strip / inset fills (deepened from measured #1c for separation)
  dark-surface-tile: "#212121"      # preview tiles (measured)
  dark-ink: "#ffffff"               # headings, primary labels (measured exact)
  dark-text-secondary: "rgba(255,255,255,0.78)"  # body / card descriptions (measured #c8c8c8)
  dark-text-muted: "rgba(255,255,255,0.58)"      # placeholder, icons, captions (measured #a0a0a0)
  dark-text-faint: "rgba(255,255,255,0.45)"      # section labels (measured #828282)
  dark-text-label: "rgba(255,255,255,0.70)"      # 500-weight list labels (measured #b8b8b8)
  dark-hairline: "rgba(255,255,255,0.06)"        # card / chip border (measured)
  dark-hairline-soft: "rgba(255,255,255,0.04)"   # Codex border-light
  dark-divider: "rgba(255,255,255,0.08)"         # sidebar/main + topbar dividers (measured)
  dark-fill-active: "rgba(255,255,255,0.05)"        # active nav pill (measured #212121)
  dark-fill-hover: "rgba(255,255,255,0.03)"
  dark-skeleton: "#333333"          # placeholder bars — lifted to clear the sheet (measured)
  dark-accent-new: "#ff3771"        # red "New" badge text (measured)
  dark-accent-info: "#4285fd"       # blue "New" badge text (measured #3873fd)
  dark-accent-info-soft: "#172552"  # blue badge wash (measured)
  dark-accent-cta: "#3a3a3a"         # neutral filled CTA — Explore / Upgrade / button-primary (lifted from #262626 for legibility)
  dark-accent-send: "#0090f8"     # send button — solid blue (measured)
  dark-send-icon: "#ffffff"         # send arrow stays white on the blue fill (measured)
  dark-badge-neutral: "rgba(255,255,255,0.08)"   # gray plan-badge wash on dark
  dark-badge-neutral-hover: "rgba(255,255,255,0.14)"  # add-button hover — steps past the 8% resting badge wash to register
  dark-accent-price-deep: "#5cb4f8"  # price badge text steps lighter (measured)
  dark-accent-price-soft: "rgba(3,145,255,0.18)"  # price badge wash (measured #082e43)
  dark-scrim: "rgba(0,0,0,0.5)"     # modal backdrop steps heavier over the dark canvas (estimated — no dark mock)
  dark-modal-border: "rgba(255,255,255,0.16)"    # dialog edge goes white-alpha, = border-heavy (estimated)

typography:
  hero:
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif"
    fontSize: 17px
    fontWeight: 400              # measured regular — the hero is NOT medium
    lineHeight: 1.4
  display:                       # doc-page section headings (welcome, mobile pair)
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 21px
    fontWeight: 400              # regular — size + ink contrast carry the hierarchy
    letterSpacing: -0.2px
    lineHeight: 1.3
  title-lg:                      # feature-row titles (mobile pair page)
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 15px
    fontWeight: 400              # regular — ink-vs-muted separates title from subtitle
    lineHeight: 1.4
  title-dialog:                  # onboarding-modal title — between hero (17) and display (21)
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.4
  title:                         # Connect-apps footer title, artifact card titles
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
  badge:
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.3
  body-lg:                       # welcome-page ledes and list copy
    fontFamily: "{typography.hero.fontFamily}"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  code:                          # command snippets
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5

rounded:
  sm: 6px        # sticky note, micro elements
  md: 8px        # tabs, nav rows, search field, chips
  lg: 12px       # suggestion cards, banner tile, stacked card edge
  xl: 16px       # banner card, terminal card, apps banner
  "2xl": 20px    # composer card, upgrade strip, plan cards
  "3xl": 28px    # device gradient panel, onboarding modal
  pill: 9999px   # mini buttons, send, badges, Upgrade CTA, avatar

spacing:
  "1": 4px
  "1.5": 6px
  "2": 8px
  "2.5": 10px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "8": 32px
  topbar-h: 48px
  sidebar-w: 216px
  content-w: 600px   # hero column (composer + cards)
  content-doc: 680px # doc column (welcome + apps pages), centered in main
  device-panel-w: 556px # device gradient panel (mobile pair page)
  plan-card-w: 303px    # plan card (plans page) — two cards + 24px gap = 630px column, centered

components:
  app-shell:
    backgroundColor: "{colors.canvas}"   # full-bleed, fills the viewport
  topbar:
    height: "{spacing.topbar-h}"
    paddingX: "{spacing.5}"
    backgroundColor: "{colors.canvas}"   # chrome — {colors.dark-surface-chrome} in dark
    borderBottom: "1px solid {colors.hairline-soft}"  # {colors.dark-divider} in dark
  tab:
    height: 28px
    paddingX: "{spacing.2.5}"
    rounded: "{rounded.md}"
    textColor: "{colors.text-secondary}"   # {colors.dark-text-muted} in dark
    fontWeight: 400
  tab-active:
    backgroundColor: "{colors.fill-active}"
    textColor: "{colors.ink}"
  search-field:
    width: 270px
    height: 30px
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    placeholderColor: "{colors.text-faint}"
  side-row:
    height: 28px
    marginBottom: 2px                  # vertical gap so adjacent active/hover pills never touch
    paddingX: "{spacing.2}"
    rounded: "{rounded.md}"
    textColor: "{colors.text-secondary}"
    iconColor: "{colors.text-muted}"   # one step lighter than the label (measured #8a vs #5d); = {colors.dark-text-muted} in dark
    hoverBackground: "{colors.fill-hover}"
  side-row-active:
    backgroundColor: "{colors.fill-active}"
    textColor: "{colors.ink}"
  side-section-label:
    fontSize: "{typography.body-sm.fontSize}"
    textColor: "{colors.text-faint}"
  composer:
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"   # light only; dark mode is borderless — the #212121 card fill carries separation
    rounded: "{rounded.2xl}"
    padding: "{spacing.4} 14px {spacing.3}"
    shadow: "0 2px 6px rgba(33,32,28,0.04)"   # the single shadow in the system
    width: "{spacing.content-w}"
    placeholderColor: "{colors.text-faint}"
    inputFontSize: 13px                 # measured — 14px reads too heavy
  composer-mini-btn:
    size: 28px
    border: "1px solid {colors.hairline}"
    rounded: 9px                        # rounded square, NOT a pill
    iconColor: "{colors.text-secondary}"  # {colors.dark-text-muted} in dark
  capability-chip:                      # "Super Computer" + New badge
    height: 28px
    fontSize: 13px
    textColor: "{colors.text-secondary}"  # measured #5d-gray, not ink
    icon: "paper-plane, 15px, {colors.text-secondary}"
  model-picker:
    height: 28px
    fontSize: 13px
    textColor: "{colors.text-secondary}"  # measured #5d-gray, not ink
    mark: "12-spoke starburst, 15px, {colors.accent-model}"
  send-button:
    size: 28px
    rounded: "{rounded.pill}"
    backgroundColor: "{colors.accent-send}"   # {colors.dark-accent-send} in dark
    iconColor: "#ffffff"                      # {colors.dark-send-icon} in dark — polarity flips
  upgrade-strip:
    backgroundColor: "{colors.surface-strip}"
    border: none
    rounded: "0 0 {rounded.xl} {rounded.xl}"  # square top corners — sides run
                                              # straight past the composer curve
    textColor: "{colors.text-secondary}"      # measured #5d
    fontSize: "{typography.body-sm.fontSize}" # 12px
    icon: "filled crown, 12px, {colors.text-secondary}"
    visiblePadding: "7px 14px 8px"            # ~33px visible below the composer
  upgrade-pill:
    height: 19px                         # measured (28px @1.5x) — compact, not 24px; odd height
                                         # centers the 12px label's 9px cap-to-baseline span exactly
    paddingX: "{spacing.2}"
    rounded: "{rounded.pill}"
    backgroundColor: "{colors.fill-cta}" # {colors.dark-accent-cta} in dark (blue CTA)
    textColor: "#ffffff"                 # white in both themes
    fontSize: "{typography.body-sm.fontSize}"
    fontWeight: 400
    centering: "flex center + line-height 1. Engines disagree by 1px on SF's baseline here:
      Blink lands the label 1px high, WebKit centers it correctly. So a +1px top-padding
      nudge is applied, and reverted for WebKit via @supports (font: -apple-system-body).
      Verified equal cap-top/baseline-bottom gaps (5px/5px) in Chromium at 1x/1.8x/2x;
      WebKit balance derived from a Safari screenshot measurement."
  suggest-card:
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.4}"
    iconGapBelow: "{spacing.4}"        # icon-to-title air
    titleGapBelow: "{spacing.1}"
    titleColor: "{colors.ink}"         # 13px/400 — regular, not medium
    subColor: "{colors.text-secondary}"  # {colors.dark-text-muted} in dark
    iconColor: "{colors.text-muted}"
  banner:
    width: 456px
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "{spacing.2}"
  banner-tile:
    size: 56px
    rounded: "{rounded.lg}"
    background: "linear-gradient(135deg, {colors.tile-grad-a}, {colors.tile-grad-b} 55%, {colors.tile-grad-c})"
  # One pill, two color roles. CSS: .badge-new (red base) + .badge-new--info (blue modifier).
  badge-new-red:                          # .badge-new — sidebar feature badge
    backgroundColor: "{colors.accent-new-soft}"
    textColor: "{colors.accent-new}"
    rounded: "{rounded.pill}"
    padding: "1px 6px"
    fontSize: "{typography.badge.fontSize}"
    fontWeight: 500
  badge-new-blue:                         # .badge-new.badge-new--info — composer capability badge (color override only)
    extends: badge-new-red
    backgroundColor: "{colors.accent-info-soft}"
    textColor: "{colors.accent-info}"
  avatar:
    size: 24px
    rounded: "{rounded.pill}"
    background: "radial-gradient(circle at 30% 30%, {colors.avatar-a}, {colors.avatar-b})"
  theme-toggle:
    placement: "top bar, immediately left of the bell icon; floats top-right (absolute,
      {spacing.3}/{spacing.4}) on screens with no top bar — the templates and plans pages"
    size: 28px
    rounded: "{rounded.md}"
    icon: "moon in light mode, sun in dark — 16px, {colors.text-muted}"
    behavior: "toggles html[data-theme], persisted to localStorage (aster-theme); ?theme= URL param overrides"
  page-header:
    iconSize: 16px
    iconColor: "{colors.text-secondary}"
    titleFontSize: 16px
    titleFontWeight: 500
    titleColor: "{colors.ink}"
    marginBelow: "{spacing.6}"
  button-primary:
    height: 24px
    paddingX: "{spacing.2.5}"
    rounded: "{rounded.md}"
    backgroundColor: "{colors.fill-cta}" # {colors.dark-accent-cta} in dark (blue CTA)
    textColor: "#ffffff"
    fontSize: "{typography.body-sm.fontSize}"
    fontWeight: 500
  artifact-card:
    layout: "tile above, 13px/500 ink title, 12px faint timestamp"
    tileGapBelow: "{spacing.4}"
    titleGapBelow: 4px
  artifact-tile:
    height: 110px
    rounded: "{rounded.lg}"
    backgroundColor: "{colors.surface-tile}"
    overflow: hidden
  artifact-sheet:
    width: "83% of tile, centered, top inset 21px"
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}, no bottom"
    rounded: "{rounded.md} {rounded.md} 0 0"
    padding: 14px
    clipped: "extends past the tile bottom edge"
  skeleton-bar:
    height: 5px
    rounded: "{rounded.pill}"
    backgroundColor: "{colors.skeleton}"
    gap: "{spacing.2.5}"
  welcome-mascot:
    size: 56px
    style: "hand-drawn line illustration (alpaca with coffee mug), 1.5px {colors.ink} strokes"
    marginBelow: "{spacing.5}"
  display-title:
    font: "{typography.display}"         # 21px/400 — biggest type on the surface, still regular
    textColor: "{colors.ink}"
    marginBelow: "{spacing.3}"
  lede:
    font: "{typography.body-lg}"
    textColor: "{colors.text-secondary}"
  code-snippet:
    backgroundColor: "{colors.surface-tile}"
    border: none
    rounded: "{rounded.lg}"
    padding: "{spacing.2.5} {spacing.4}"
    font: "{typography.code}"
    textColor: "{colors.text-secondary}"
    copyButton: "24px, {rounded.sm}, 15px copy glyph in {colors.text-muted}, flushed right"
  terminal-card:
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "{spacing.5}"
  traffic-dots:
    size: 10px
    gap: 7px
    rounded: "{rounded.pill}"
    colors: "{colors.traffic-red}, {colors.traffic-amber}, {colors.traffic-green}"
    marginBelow: "{spacing.5}"
  terminal-step:
    icon: "16px, {colors.text-muted}"
    fontSize: 14px
    textColor: "{colors.text-muted}"
    rowGap: "{spacing.5}"
  check-item:
    icon: "15px check, 1.5px stroke, {colors.text-faint}"
    font: "{typography.body-lg}"
    textColor: "{colors.text-muted}"
    rowGap: "{spacing.5}"
  section-divider:
    height: 1px
    backgroundColor: "{colors.hairline-soft}"
  split-section:
    layout: "2 equal columns, 40px gap, on the {spacing.content-doc} column"
  modal-scrim:
    background: "{colors.scrim}"         # {colors.dark-scrim} in dark
    blur: "10px backdrop blur"
    layout: "fixed full-viewport overlay, centers the dialog"
    dismiss: "Explore CTA or Escape; ?modal=0 URL param suppresses it"
  onboarding-modal:
    width: 456px                         # same width as the connect banner
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.modal-border}"  # {colors.dark-modal-border} in dark
    rounded: "{rounded.3xl}"             # measured ~28-30 from the mock corner curve — rounder than any card
    shadow: "0 12px 20px -14px rgba(0,0,0,0.55) — bottom-only and tight (measured: ~25% peak
             just below the foot, gone by ~50px, near-zero at the sides). A wide soft
             shadow would swallow the 1px border — the sides must stay clean for it to read."
    overflow: hidden                     # header art bleeds to the card edges
    bodyPadding: "0 28px 28px"
  modal-art:
    height: 247px
    sheetInset: "39px 28px 0"            # padding around the terminal sheet
    background: "layered radial pastels under a faint white halftone dot screen —
                 a {colors.modal-grad-violet} bloom hugging the left edge,
                 a {colors.modal-grad-peri} band across the top, and
                 {colors.modal-grad-sky} in the top-right corner, fading to white;
                 holds light values in both themes (imagery, not chrome)"
  modal-sheet:
    backgroundColor: "#ffffff"           # white in both themes (imagery, like the phone screen)
    rounded: "{rounded.lg} {rounded.lg} 0 0"  # bottom edge merges with the white body
    padding: "11px 12px 0"
    contents: "traffic-dots (24px below-gap) over five terminal-step rows
               (12px gap, fixed light-value #8a8a8a text + icons) — replays the
               welcome page's launch narrative"
  modal-title:
    font: "{typography.title-dialog}"    # 19px/400
    textColor: "{colors.ink}"
    margin: "26px 0 8px"
  modal-cta:
    base: "button-cta geometry — 40px {colors.fill-cta} pill ({colors.dark-accent-cta} in dark)"
    width: "100% of the body minus an extra 8px inset each side (36px from the card edge)"
    fontSize: "{typography.body.fontSize}"  # 13px label, smaller than the standalone button-cta's 15px
    marginAbove: 30px
  button-cta:
    height: 40px
    paddingX: "{spacing.6}"
    rounded: "{rounded.pill}"
    backgroundColor: "{colors.fill-cta}"   # {colors.dark-accent-cta} in dark
    textColor: "#ffffff"
    fontSize: 15px
  feature-list:
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    rowPadding: "{spacing.5} {spacing.6}"
    rowDivider: "1px solid {colors.hairline-soft}"
  feature-row:
    icon: "22px filled glyph, {colors.text-secondary}"
    title: "{typography.title-lg}, {colors.ink}"
    sub: "{typography.body-lg}, {colors.text-muted}"
    titleGapBelow: "{spacing.1}"
  status-dot:
    size: 6px                  # outer footprint — identical for both variants
    run: "{colors.status-run} fill"
    idle: "1.3px ring, {colors.text-muted}, no fill — ring draws inside the 6px box (border-box), never outside it"
  device-panel:
    width: "{spacing.device-panel-w}"
    rounded: "{rounded.3xl}"
    margin: "26px 24px 12px 0"
    background: "layered radial pastels — {colors.panel-grad-sky/lav/peri/deep}
                 over a 180° blue base, with a white bloom behind the phone;
                 holds light values in both themes (imagery, not chrome)"
  phone-mockup:
    size: "288 × 622px"
    frame: "9px solid #111111, 44px radius (one-off, device-scale)"
    screen: "#ffffff in both themes, light-value text grays"
    island: "84 × 25px black pill, top-centered"
    shadow: "0 18px 40px rgba(40,60,120,0.18) — decorative, scoped to the mockup"
    cta: "New task — full-width 40px {colors.fill-cta} pill, inset 16px at the bottom"
  plan-card:                             # all plans-page values measured at 1.5x and ÷1.5
    width: "{spacing.plan-card-w}"       # 303px
    minHeight: 455px
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.2xl}"
    overflow: hidden                     # banner art bleeds to the card edges
    bodyPadding: "{spacing.4} {spacing.6} {spacing.5}"  # 16 top / 24 text inset / 20 foot
  plan-banner:
    height: 76px
    background: "flower blooms under a faint white halftone dot screen — a
                 {colors.plan-grad-gold} (starter) / {colors.plan-grad-amber} (pro)
                 core ringed by petal radials (white on starter,
                 {colors.plan-grad-orchid} pink on pro) over a
                 {colors.plan-grad-cyan} / {colors.plan-grad-blue} base; starter adds a
                 {colors.plan-grad-sand} corner; holds light values in both themes"
  plan-name:
    fontSize: 17px                       # hero size
    fontWeight: 400
    textColor: "{colors.ink}"
  badge-plan:
    rounded: "{rounded.pill}"
    padding: "3px 8px"                   # ~19px tall — the upgrade-pill height
    fontSize: "{typography.badge.fontSize}"
    fontWeight: 400                      # quieter than the New badges
    variants: "free → {colors.text-secondary} on {colors.badge-neutral};
               price → {colors.accent-price-deep} on {colors.accent-price-soft}"
  plan-label:                            # "What you get:"
    fontSize: "{typography.body-sm.fontSize}"  # 12px — a step below the perks
    fontWeight: 500
    textColor: "{colors.text-label}"     # {colors.dark-text-label} in dark
  plan-perk:
    icon: "17px circled check, 1.3px stroke, {colors.text-muted}, {spacing.1.5} gap"
    fontSize: 13px
    lineHeight: 27px                     # solid — gives the measured 27px row pitch, no margins
    textColor: "{colors.text-secondary}"
  plan-cta:
    height: 38px
    width: "card width minus a 20px inset each side — outdents 4px past the 24px body padding"
    rounded: "{rounded.pill}"
    fontSize: 13px
    fontWeight: 400
    variants: "neutral (Create Account) → {colors.fill-cta}, white label — inverts to
               #ffffff with a near-ink label in dark (the dark-CTA blue stays reserved;
               it would collide with the adjacent info blue);
               info (Book a Demo) → {colors.accent-info}, white label in both themes"
  marketplace-search:
    width: "100% of the doc column"
    height: 34px
    rounded: "{rounded.pill}"            # capsule — unlike the rounded-md topbar search
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    placeholderColor: "{colors.text-faint}"
  apps-banner:
    size: "{spacing.content-doc} × 200px"
    rounded: "{rounded.xl}"
    padding: "0 {spacing.8}"
    background: "layered radial pastels — {colors.apps-grad-violet/indigo/sky/cyan}
                 over a 100° violet→sky base with a pale bloom center;
                 imagery, holds light values in both themes"
  prompt-pill:
    height: 30px
    padding: "0 {spacing.4} 0 {spacing.2.5}"
    rounded: "{rounded.pill}"
    backgroundColor: "#ffffff"           # stays white on the art in both themes
    content: "14px brand glyph + 12px/500 brand-colored app name + 12px light-secondary prompt"
    stagger: "stacked with 12px gaps; rows indent 0 / 24 / 32px"
  app-card:
    layout: "app-tile + name/desc + trailing add button; 2-up grid on the
             doc column (32px column gap, 24px row gap)"
    name: "15px/500 {colors.ink}, 2px below gap"
    desc: "14px {colors.text-muted}, one line, ellipsis"
  app-tile:
    size: 38px
    rounded: "{rounded.lg}"
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.hairline}"
    glyph: "20px full-color brand logo"
  app-add-btn:
    size: 30px
    rounded: "{rounded.md}"
    backgroundColor: "{colors.badge-neutral}"
    hoverBackground: "{colors.fill-active}"  # one step up in light; {colors.dark-badge-neutral-hover} (white 14%) in dark — dark fill-active equals the 8% resting wash and would read as no change
    iconColor: "{colors.text-secondary}"
    connectedState: "bare 16px check in {colors.text-muted}, no fill"
---

## Overview

Aster is a light-mode AI workspace web app — a calm, white-on-white shell that hosts four product modes (Chat, Agent, Code, Design) behind a single tabbed top bar. The app is **full-bleed**: a pure-white `{colors.canvas}` (#ffffff) canvas fills the viewport edge-to-edge. Depth is hairline-only — cards share the canvas's white and are articulated purely by very light neutral hairlines, never drop shadows or tinted fills.

The home screen is an empty state organized around a single centered column: the ✱ brand mark, the question "Where should we begin?", a white composer card with a gray **upgrade strip tucked beneath it**, a row of three suggestion cards, and a connect-channel banner that sits near the bottom as a small stacked deck (white card edge + gold sticky note peeking out behind).

**Key Characteristics:**

- **White on white.** Canvas and cards are both #ffffff; only hairlines (neutral black at 4–7%) articulate structure. Ink is neutral #1a1a1a.
- **Hairline-only depth.** 1px neutral borders carry all separation; the composer's faint lift is the single shadow.
- **One neutral system, many scoped accents.** The UI chrome is entirely neutral; each chromatic accent is bound to exactly one role (red = feature badge, blue = capability badge, terracotta = model mark, periwinkle = send, gold = sticky note, violet = avatar).
- **Small, quiet type.** Base body is 13px/400 — including the composer, its chips, and card titles; weight 500 is reserved for a few labels (footer title, badges), never bold. The hero question is just 17px/400.
- **Soft-pill interaction language.** Active states are ink-alpha pills (`{colors.fill-active}`); mini-buttons, badges, and CTAs are full-round.
- **Playful margins.** Decorative touches (dot-matrix texture band at the canvas top, pastel gradient tile, sticky-note stack) live at the edges and never interfere with the working column.

---

## Colors

### Surfaces

- **Canvas** (`{colors.canvas}` — #ffffff): Pure white — top bar, sidebar, and main share it; regions are separated by hairlines, not fills.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Composer, suggestion cards, search field, banner — the same white; the hairline alone marks the edge.
- **Surface Strip** (`{colors.surface-strip}` — #fafafa): The upgrade strip and other inset fills, one step below white (measured).

### Ink & Text

- **Ink** (`{colors.ink}` — #1a1a1a): Headings, active labels, card titles. Neutral near-black.
- **Secondary** (`{colors.text-secondary}` — #555555): The workhorse chrome gray (measured #5d on white) — sidebar rows and icons, inactive tabs, topbar icons, composer chips ("Super Computer", "Opus 4.7"), strip text, card subtitles, banner title. In dark mode the icon/label uses map to `{colors.dark-text-muted}` (50% white), not the near-white dark secondary.
- **Muted** (`{colors.text-muted}` — #8a8a8a): Mic/chevron glyphs, card icons, banner subtitle.
- **Faint** (`{colors.text-faint}` — #a9a9a9): Placeholders, section labels, ⌘K hint.

### Hairlines & Fills

- **Hairline** (`{colors.hairline}` — black @ 7%): Card borders.
- **Hairline Soft** (`{colors.hairline-soft}` — black @ 4%): Region dividers (topbar bottom, sidebar right).
- **Modal Border** (`{colors.modal-border}` — black @ 40%): The onboarding dialog's edge line only (measured ≈ #999) — the one heavy border in light mode; a 7% hairline would vanish against the scrim.
- **Fill Active** (`{colors.fill-active}` — #f5f5f5): Selected tab / nav row pill (measured).
- **Fill Hover** (`{colors.fill-hover}` — black @ 3%): Hover wash on any interactive row or chip.
- **Fill CTA** (`{colors.fill-cta}` — #333333): The filled-button charcoal (Upgrade pill, button-primary) — measured #333 exactly; deliberately softer than ink.

### Scoped Accents

Each accent appears in exactly one place — never reuse them as general UI color:

- **New (red)** (`{colors.accent-new}` — #e5484d): Sidebar feature badge text, on its `{colors.accent-new-soft}` pill wash.
- **Danger (red)** (`{colors.accent-danger}` — #e5484d; #ff5d62 on dark): Destructive button intent (`.btn--danger`) — solid fill, or a tinted line + `{colors.accent-danger-soft}` hover when outlined. Shares the New red's hue but is a separate, button-only role.
- **New (blue)** (`{colors.accent-info}` on `{colors.accent-info-soft}`): Capability badge pill in the composer ("Super Computer · New").
- **Model red-orange** (`{colors.accent-model}` — #e5532d): The model-mark glyph beside "Opus 4.7".
- **Send soft-blue** (`{colors.accent-send}` — #b7d9f8): The idle send button fill (white arrow).
- **Sticky gold** (`{colors.accent-gold}` — #f2c14e): The note peeking from the banner stack.
- **Avatar violet** (`{colors.avatar-a}` → `{colors.avatar-b}`): Account avatar radial gradient.
- **Banner pastels** (`{colors.tile-grad-a/b/c}` + `{colors.dot-teal/green/blue}`): The connect-channel tile gradient and its overlapping channel dots.
- **Traffic lights** (`{colors.traffic-red/amber/green}`): The three 10px window dots atop the welcome page's terminal card — never reused as status colors elsewhere.
- **Run cyan** (`{colors.status-run}` — #00bcff): The 6px active-run dot on Agent-mode recents (sidebar and phone). Idle items get a `{colors.text-muted}` ring instead — the cyan never marks anything but a live run.
- **Device-panel pastels** (`{colors.panel-grad-sky/lav/peri/deep}`): The mobile pair page's gradient panel only; they hold their light values in both themes.
- **Info blue** (`{colors.accent-info}` — #3b82f6): The one accent blue — the "New" capability badge _and_ the `.btn--info` fill (e.g. the Book-a-Demo CTA on the plans page). Formerly two separate blues (`accent-demo` #0391ff + `accent-info`); merged into one.
- **Price blue** (`{colors.accent-price-deep}` on `{colors.accent-price-soft}`): A standalone deep-text-on-pale-wash pair for the plan price badge ("$650/month") — its own cyan-leaning family, not reused elsewhere.
- **Plan-banner pastels** (`{colors.plan-grad-cyan/gold/sand}` + `{colors.plan-grad-blue/amber/orchid}`): The plan cards' gradient art headers only; imagery that holds its light values in both themes. The amber bloom (#f3b24e) is deliberately NOT `accent-gold` — the sticky note keeps its own scoped value.
- **Modal pastels** (`{colors.modal-grad-violet/peri/sky}`): The onboarding modal's gradient art header only; imagery that holds its light values in both themes. The violet family is adjacent to the avatar gradient but deliberately its own tokens — the avatar keeps its scoped pair.
- **Marketplace pastels** (`{colors.apps-grad-violet/indigo/sky/cyan}`): The apps page's promo banner only; imagery that holds its light values in both themes. Adjacent to the device-panel family but its own tokens — each art surface keeps its own scoped set.

### Dark Theme (measured from reference screenshots)

Dark mode is **measured from the dark-mode reference screenshots** (home, plans, and the artifacts/agent quadrants, retina-sampled). The key correction over the earlier draft: dark is **flat and full-bleed, exactly like light mode** — it does _not_ layer the chrome lighter than the canvas. Regions are separated by hairlines, not by surface steps:

- **Surfaces:** the canvas, topbar, and sidebar all sit at `{colors.dark-canvas}` (#1a1a1a, measured) — one flat base, hairline-separated, mirroring light mode's white-on-white. The composer, cards, inputs, and the search field lift to `{colors.dark-surface-card}` (#212121, measured); filled buttons (Explore, Upgrade pill, primary) go one step further to `{colors.dark-accent-cta}` (#3a3a3a — lifted from the measured #262626, which read too dull on dark). Receding insets — the "Upgrade to PRO" strip tucked under the composer — drop to `{colors.dark-surface-strip}` (#161616, a recessed footer tray; the reference measures ~#1c1c1c but that barely clears the canvas, so it is deepened for clear separation from the #212121 card and to let the Upgrade pill pop). The suggestion cards stay **transparent on the canvas** (border-defined, not filled) — exactly like light mode, where a card fill equals the white canvas and so reads as nothing.
- **Dividers and borders stay soft:** the sidebar/main boundary and topbar underline are `{colors.dark-divider}` (white @ 8% — measured), and card/chip borders are `{colors.dark-hairline}` (white @ 6%, measured) — no heavy region lines.
- **Text:** ink is white (headings measured #ffffff exact); body and card descriptions read at `{colors.dark-text-secondary}` (white @ 78%, measured #c8c8c8); the "What you get" labels at `{colors.dark-text-label}` (white @ 70%, measured #b8b8b8); placeholders, icons, and captions at `{colors.dark-text-muted}` (white @ 58%, measured #a0a0a0); section labels at `{colors.dark-text-faint}` (white @ 45%, measured #828282).
- **Fills:** active pill white @ 5% (measured #212121), hover @ 3%. One consequence: surfaces that _rest_ on an 8% wash (the marketplace `app-add-btn`) can't hover to fill-active — they step to `{colors.dark-badge-neutral-hover}` (white @ 14%) instead.
- **Accents:** red badge → `{colors.dark-accent-new}` (#ff3771 text, measured) on a deep-crimson wash (`{colors.dark-accent-new-soft}`, measured #4f0117); blue badge → `{colors.dark-accent-info}` (#4285fd, measured #3873fd) on the navy `{colors.dark-accent-info-soft}` (#172552, measured). The model starburst, gold note, avatar gradient, banner pastels, terminal traffic lights, run cyan, the device-panel gradient (plus its phone mockup), the onboarding modal's art header (plus its white terminal sheet), and the marketplace banner (plus its white prompt pills) hold their light values — they sit on enough contrast already.
- **The modal scrim:** `{colors.scrim}` (black @ 28%, measured) → `{colors.dark-scrim}` (black @ 50%, estimated — the plans-modal backdrop reads ~#141414 but is not cleanly separable from the window frame).
- **Filled CTAs are neutral gray, not blue:** `modal-cta` (Explore), `upgrade-pill`, and `button-primary` switch from the charcoal `{colors.fill-cta}` to `{colors.dark-accent-cta}` (#3a3a3a — lifted from the measured #262626, which read too dull) with a white label; the blue is reserved for the `.btn--info` CTA (`{colors.accent-info}`) so the two never collide.
- **Send button stays a blue circle:** the send becomes a solid `{colors.dark-accent-send}` (#0090f8, measured) circle with a white arrow (`{colors.dark-send-icon}` #ffffff) — same polarity as light, just a more saturated blue. The price badge text lifts to `{colors.dark-accent-price-deep}` (#5cb4f8, measured) on the `{colors.dark-accent-price-soft}` wash (measured #082e43).
- **Skeleton bars** → `{colors.dark-skeleton}` (#333333, measured — lifted so they clear the sheet); ghost dots flip to white at the same alphas.

Switching: a `theme-toggle` icon button in the top bar (left of the bell) flips `html[data-theme]` between light and dark, persists the choice to `localStorage` (`aster-theme`), and a `?theme=dark|light` URL parameter overrides it. The saved theme is applied before first paint to avoid a flash.

---

## Typography

### Font Family

System-native sans: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`. No display family; hierarchy is carried by size steps of 1–2px and a single weight bump to 500.

### Hierarchy

| Token                       | Size | Weight | Use                                                                          |
| --------------------------- | ---- | ------ | ---------------------------------------------------------------------------- |
| `{typography.display}`      | 21px | 400    | Doc-page section headings ("Build AI apps locally", "Pair with Mobile app"). |
| `{typography.title-dialog}` | 19px | 400    | Onboarding-modal title ("Welcome to Alpaca").                                |
| `{typography.hero}`         | 17px | 400    | "Where should we begin?" empty-state question — regular, not medium.         |
| `{typography.title-lg}`     | 15px | 400    | Feature-row titles on the mobile pair page — ink against muted subtitles.    |
| `{typography.body-lg}`      | 15px | 400    | Doc-page ledes, checklist items, feature-row subtitles.                      |
| `{typography.title}`        | 13px | 500    | Connect-apps footer title, artifact card titles.                             |
| `{typography.body}`         | 13px | 400    | Default — nav rows, tabs, chips, composer input, card titles, subtitles.     |
| `{typography.code}`         | 13px | 400    | Command snippets — the only monospace on the surface.                        |
| `{typography.body-sm}`      | 12px | 400    | Section labels, descriptions, strip text, Upgrade pill.                      |
| `{typography.badge}`        | 11px | 500    | "New" badges.                                                                |

### Principles

- **Weight 400 is the default everywhere; 500 is scarce.** The hero, tabs, card titles, banner title, doc-page display headings, feature titles, and even the Upgrade pill are regular — 500 appears only on small labels: the footer title, artifact titles, page headers, badges, marketplace app and prompt-pill names, the plan "What you get:" label, and `button-primary`. Nothing on the surface is bold (600+); emphasis comes from size steps and ink-vs-muted contrast alone.
- **Scale is compressed.** The app chrome lives between 11px and 17px; only the doc pages' display headings step up to 21px.
- **Color does hierarchy work.** Title (ink) over subtitle (muted) at nearly the same size reads as two clear levels.
- **Monospace is scoped to commands.** `{typography.code}` appears only inside `code-snippet` wells — never in running copy.

---

## Layout

### Spacing System

- **Base unit:** 4px. Tokens `{spacing.1}` 4px through `{spacing.8}` 32px.
- **Shell:** full-bleed viewport; top bar `{spacing.topbar-h}` 48px; sidebar `{spacing.sidebar-w}` 216px.
- **Rows:** sidebar rows 28px tall, 8px horizontal padding, 8px icon-label gap, 2px vertical gap between rows so an active pill never touches an adjacent hovered one.

### Grid & Container

- **Hero column:** everything in the main area centers on a `{spacing.content-w}` (600px) column — composer, strip, and the 3-card suggestion row (equal thirds, 16px gaps).
- **Banner:** 456px, horizontally centered, pinned toward the bottom with the stacked-deck decoration behind it.
- **Artifact grid:** list screens reuse the same 600px column as a 2-up grid (16px column gap, 32px row gap), headed by a `page-header` row.
- **Doc column:** the welcome page widens to `{spacing.content-doc}` (680px), centered in the main area; sections stack with 64px air, separated once by a `section-divider`, and the feature row splits into a 2-up `split-section` (40px gap).
- **Pair split:** the mobile pair page splits the main area into a flexible content column (copy + feature list, max 460px) and a fixed `{spacing.device-panel-w}` (556px) `device-panel` pinned right with 26/24/12px margins.
- **Plan column:** the plans page centers a 630px row — two `{spacing.plan-card-w}` (303px) cards with a 24px gap — beneath its hero stack; no shell chrome around it.
- **Marketplace column:** the apps page reuses the `{spacing.content-doc}` (680px) doc column — centered heading, full-width `marketplace-search`, the `apps-banner`, then the 2-up `app-card` grid (32px column gap, 24px row gap).
- **Sidebar:** fixed 216px; nav → Projects section → Recents → spring → Connect-apps footer. The nav set swaps per mode — Agent mode shows New task / Workspace / Active runs / Live Artifacts / Plugins / Mobile, a "Workspace" project section, dot-status recents, and no Connect-apps footer.

### Whitespace Philosophy

The working column is compact (28px rows, 13px type) while the canvas around it stays open — emptiness is part of the empty state. Decorations (dot-matrix band, banner stack) occupy the margins so the center remains a single calm task: the composer.

---

## Elevation & Depth

**Hairline-only, with three exceptions.** The composer card carries a single faint lift shadow (`0 2px 6px` ink @ 4%) so it reads as floating over its upgrade strip; the pair page's `phone-mockup` carries a soft ambient shadow scoped to the device imagery; and the `onboarding-modal` carries a deeper drop over its scrim — the one true floating layer in the system. Nothing else has a shadow.

| Level   | Treatment                                                                                                      | Use                             |
| ------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Canvas  | `{colors.canvas}` white, full-bleed, regions split by `{colors.hairline-soft}`                                 | Top bar, sidebar, main          |
| Card    | `{colors.surface-card}` + 1px `{colors.hairline}`                                                              | Composer, cards, search, banner |
| Inset   | `{colors.surface-strip}`                                                                                       | Upgrade strip                   |
| Stack   | offset card edge + rotated gold note behind the banner                                                         | Decorative depth only           |
| Overlay | `{colors.scrim}` wash + 10px backdrop blur, dialog with its scoped shadow and 1px `{colors.modal-border}` edge | Onboarding modal                |

### Decorative Depth

- **Stacked deck:** the banner reveals a white card edge below and a `{colors.accent-gold}` sticky note rotated ~-7° peeking bottom-left — depth by overlap, not shadow.
- **Dot-matrix band:** a faint speckled dot texture at the canvas top (two offset dot grids at ~10–16% ink, masked to fade out toward the edges and bottom), purely atmospheric — not text.
- **Pastel tile:** the banner's gradient tile with overlapping channel dots adds chromatic depth without elevation.

---

## Shapes

### Border Radius Scale

| Token            | Value  | Use                                                                                             |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `{rounded.sm}`   | 6px    | Sticky note, micro chips.                                                                       |
| `{rounded.md}`   | 8px    | Tabs, nav rows, search field, model chips.                                                      |
| 9px (one-off)    | 9px    | Composer mini-buttons (rounded squares).                                                        |
| `{rounded.lg}`   | 12px   | Suggestion cards, banner tile, stacked edge, code snippets, modal terminal sheet (top corners). |
| `{rounded.xl}`   | 16px   | Banner card, terminal card.                                                                     |
| `{rounded.2xl}`  | 20px   | Composer card, upgrade strip, plan cards.                                                       |
| `{rounded.3xl}`  | 28px   | Device gradient panel (mobile pair page), onboarding modal.                                     |
| 44px (one-off)   | 44px   | Phone-mockup frame — device-scale, not a UI radius.                                             |
| `{rounded.pill}` | 9999px | Mini buttons, send, badges, CTAs, avatar, channel + status dots.                                |

**Rule:** the bigger and more focal the surface, the rounder it gets (banner 16 → composer 20); anything small and interactive is either an 8px soft rect or a full pill.

---

## Motion & Animation

Minimal and functional: hover fills and active pills transition `background-color` over **0.15s** with `cubic-bezier(.4, 0, .2, 1)`; the send button transitions opacity. All transitions collapse to 0s under `prefers-reduced-motion: reduce`. No entrance choreography is specified for the home screen.

---

## Components

### App Shell (`app-shell`)

The app is a full-bleed web shell: the `{colors.canvas}` fill covers the entire viewport with no outer margin, border, or rounding.

### Top Bar (`topbar`)

48px, chrome fill (canvas-white in light; `{colors.dark-surface-chrome}` in dark), `{colors.hairline-soft}` bottom border (`{colors.dark-divider}` in dark). Left: ✱ logo + mode tabs (`tab` — 28px, `{rounded.md}`, secondary 13px/400; active gets `{colors.fill-active}` + ink). Center: `search-field` (270×30 white, hairline, magnifier + "Search" + ⌘K hint in faint). Right: bell and notes icon buttons (secondary), "Invite" with person-plus (13px/400 secondary), then the violet-gradient `avatar` (24px).

### Sidebar

216px, chrome fill (canvas-white in light; `{colors.dark-surface-chrome}` in dark), soft hairline on its trailing edge (`{colors.dark-divider}` in dark).

- **Nav rows** (`side-row`): 28px, `{rounded.md}`, 14px icons in **muted** beside 13px labels in **secondary** — the icon sits one gray step lighter than its label (measured #8a vs #5d); hover `{colors.fill-hover}`; active (`side-row-active`) ink text _and_ ink icon on `{colors.fill-active}`. "Apps" carries the red `badge-new-red` pill.
- **Section labels** (`side-section-label`): 12px faint ("Projects", "Recents").
- **Recents:** icon-less 27px rows.
- **Footer:** hairline-topped block — "Connect apps" (13px/500 ink), two-line description (12px faint), and a row of six 15px third-party app icons (the chrome's only full-color glyphs — elsewhere, brand logos appear only as marketplace content: `app-tile`s and `prompt-pill`s on the apps page).

### Composer (`composer`)

The hero control: 600px white card, `{rounded.2xl}`, hairline border, and the system's only shadow (faint lift). "Ask anything..." placeholder in faint **13px** over a roomy input area. Footer row: two bordered 28px **rounded-square** `composer-mini-btn`s (+ and a ⌘-style tools glyph, secondary), the `capability-chip` — paper-plane icon + "Super Computer" in secondary 13px + blue `badge-new-blue` — then right-aligned: `model-picker` (red-orange 12-spoke starburst + "Opus 4.7" in secondary 13px + chevron), mic, and the periwinkle `send-button` (28px pill, white up arrow). Everything in the footer is 13px/400 gray — nothing in the composer is ink except typed text.

### Upgrade Strip (`upgrade-strip`)

Tucks under the composer (negative margin, lower z-index): borderless `{colors.surface-strip}` fill with **square top corners** — its sides run straight down past the composer's bottom-corner curves so no gray pokes out — and only the bottom corners rounded `{rounded.xl}`. The strip is **shallow**: ~33px visible (7px above the pill, 8px below). Contents: a **filled** 12px crown icon + "Upgrade to PRO" in secondary 12px, and the charcoal `upgrade-pill` ("Upgrade", 19px tall, 12px/400 white on `{colors.fill-cta}`, full-round, label optically centered — equal cap-top and baseline-bottom gaps) flushed right. Keep both small — an oversized strip or pill is the most visible way to break this design.

### Suggestion Cards (`suggest-card`)

Three equal cards under the composer (Create / Find / Research): white, `{rounded.lg}`, hairline, 16px padding; 16px muted icon top-left followed by a **16px air gap**, then the 13px/400 ink title, 4px, and a 13px secondary subtitle ("Tasks, Images, Docs" · "Answers & Files" · "Apps & Web"). Titles are regular weight — the ink-vs-gray contrast alone separates title from subtitle.

### Connect Banner (`banner`)

456px white card near the bottom: a 56px `banner-tile` (pastel 135° gradient with three overlapping 22px white-ringed channel dots — teal, green, blue) beside "Connect your channel" (13px/400 secondary) and a truncating muted subtitle. Behind it, the **stacked deck**: an inset white card edge and the rotated gold sticky note.

### Page Header & Primary Button (`page-header`, `button-primary`)

List screens (e.g. Artifacts) open with a header row on the 600px column: a 16px secondary-colored icon beside a 16px/500 ink title, with the `button-primary` flushed right — the only ink-filled rectangular button (24px tall, `{rounded.md}`, white 12px/500 label, e.g. "New artifact"). Distinct from `upgrade-pill`, which is full-round.

### Artifact Cards (`artifact-card`)

A 2-up grid of borderless cards. Each is: an `artifact-tile` — a 110px `{colors.surface-tile}` rounded-`{rounded.lg}` well with `overflow: hidden` — containing an `artifact-sheet`, a white hairline-bordered mini page (83% width, 21px from the tile top, top corners `{rounded.md}`) that **extends past the tile's bottom edge** so it reads as a document peeking into frame. The sheet holds a 13px muted icon, a 12px muted one-line caption (must fit without truncation), then **solid full-width `skeleton-bar`s** — 5px tall, pill-rounded, `{colors.skeleton}`, 10px apart — clipping at the tile edge. Below the tile, a roomy 16px gap, then the 13px/500 ink title, 4px, and a 12px faint timestamp ("1h ago"). The tile darkens one step on hover.

### Badges

- `badge-new-red` (`.badge-new`): 11px/500 red text on a soft-red (`{colors.accent-new-soft}`) full-round pill, right-aligned in its row. The base "New" pill.
- `badge-new-blue` (`.badge-new.badge-new--info`): the same pill with a blue color override — soft-blue wash, blue text. Same geometry as the red base; only the two color lines differ.

### Welcome Page (`welcome-mascot`, `display-title`, `code-snippet`, `terminal-card`, `check-item`)

An onboarding doc screen on the 680px `{spacing.content-doc}` column, under the same shell and ghost-dots band. Top to bottom:

- **Mascot:** a 56px hand-drawn line illustration (`welcome-mascot` — an alpaca in round glasses holding a steaming mug), drawn in 1.5px ink strokes like an oversized line icon.
- **Display heading + lede:** `display-title` (21px/400 ink — the biggest type on the surface, still regular) over a `lede` (15px secondary, 1.6 line height): "Build AI apps locally" / "Run powerful open models in minutes."
- **Code snippet (`code-snippet`):** a full-column borderless `{colors.surface-tile}` well, `{rounded.lg}`, 10×16px padding, 13px monospace command in secondary, with a 24px copy icon button flushed right. The well reuses the tile gray — no new surface.
- **Section divider:** a single 1px `{colors.hairline-soft}` rule 28px below the snippet; sections after it stack with 64px air.
- **Split section (`split-section`):** two equal columns, 40px gap. Left, a `terminal-card` — white card, `{rounded.xl}`, hairline, 20px padding — topped by three 10px `traffic-dots` (red/amber/green, the macOS window glyph) over five `terminal-step` rows (16px muted line icon + 14px muted label, 20px row gap) narrating the launch ("alpaca launch openclaw" → "openclaw is running"). Right, a `display-title` + `lede` + column-width `code-snippet`.
- **Closing section:** `display-title` + `lede` ("Local first. Cloud ready."), then a `check-item` list — 15px faint check glyph beside 15px muted copy, 20px row gap.

### Onboarding Modal (`modal-scrim`, `onboarding-modal`, `modal-art`, `modal-sheet`, `modal-title`, `modal-cta`)

A welcome dialog over the welcome page (measured from the modal mock at 1.5× scale). The page dims and softens behind a `modal-scrim` — `{colors.scrim}` (black @ 28%) over a **10px backdrop blur** — and the 456px `onboarding-modal` (the banner's width, `{rounded.3xl}` — the roundest surface in the system, fitting the focality rule) floats on it with the system's deepest shadow **and its one heavy border**: a 1px `{colors.modal-border}` edge line (measured ≈ #999 — the standard 7% hairline would vanish against the scrim). Top to bottom:

- **Art header (`modal-art`):** a 247px gradient zone bleeding to the card edges — a `{colors.modal-grad-violet}` bloom hugging the left edge, a `{colors.modal-grad-peri}` band across the top, `{colors.modal-grad-sky}` in the top-right corner, all fading to white under a faint white halftone dot screen. Imagery: light values in both themes.
- **Terminal sheet (`modal-sheet`):** a white sheet inset 39px from the top and 28px from the sides, top corners `{rounded.lg}`, its bottom edge merging seamlessly into the white body below. It **replays the welcome page's launch narrative** — the same `traffic-dots` and five `terminal-step` rows ("alpaca launch openclaw" → "openclaw is running") at a tighter 12px row gap. Like the phone screen, the sheet holds light values (white fill, #8a8a8a steps) in both themes.
- **Body:** `modal-title` ("Welcome to Alpaca", `{typography.title-dialog}` 19px/400 ink) over a standard `lede`, on 28px side padding.
- **CTA (`modal-cta`):** a full-width `button-cta`-style 40px `{colors.fill-cta}` pill ("Explore") with a 13px label, indented a further 8px past the body padding (36px from the card edge). Goes `{colors.dark-accent-cta}` blue in dark.
- **Behavior:** Explore or Escape dismisses; a `?modal=0` URL parameter suppresses it. No entrance animation — consistent with the system's no-choreography rule.

### Plans Page (`plan-card`, `plan-banner`, `badge-plan`, `plan-perk`, `plan-cta`)

A standalone plan-select screen — **no top bar or sidebar**, just the ghost-dots band over a centered stack: a 22px ✱ mark, a `{typography.hero}` headline ("Start free, no demo required"), a 13px secondary subline, then two `plan-card`s side by side (`{spacing.plan-card-w}` 303px each, 24px gap, centered — a 630px column). All values were measured on the 1.5×-scale pricing mock and divided by 1.5; the type sizes that fall out (17px hero, 13px body, 12px label, 11px badge, 19px badge pill) snap exactly onto the existing token scale, confirming the capture scale.

- **Hero rhythm (measured):** mark top ~100px from the canvas top → 24px → heading → 12px → subline → 48px → cards. The whole stack sits high; the canvas below the cards stays empty.
- **Card:** `{rounded.2xl}` white card, hairline border, `overflow: hidden`, ~455px tall. The CTA pins to the bottom; the air lives **between the perks and the CTA** (~112px), not spread through the body.
- **Banner art (`plan-banner`):** a 76px art header bleeding to the card edges — each banner is a **flower**: a gold (starter) or amber (pro) core ringed by petal radials — white petals on a cyan sky for Starter (plus a sand corner), pink (`{colors.plan-grad-orchid}`) petals on blue for Pro — under a faint white halftone dot screen. Imagery: light values in both themes.
- **Body rhythm (measured):** 21px banner→name, 15px name→description (13px/1.5 — normal leading), 36px description→label, 14px label→perks.
- **Head row:** `plan-name` (17px/400 ink — the hero size, repeated inside the card) with a `badge-plan` pill flushed right — "Free" in secondary on `{colors.badge-neutral}`, or the price in `{colors.accent-price-deep}` on `{colors.accent-price-soft}`. Plan badges are 11px/400, ~19px tall (3×8px padding) — the `upgrade-pill` height.
- **Perks:** `plan-label` ("What you get:", **12px**/500 `{colors.text-label}` — a step smaller than the perks it introduces) over three `plan-perk` rows — 17px circled-check in muted, 6px gap, 13px secondary copy on a solid 27px line (no margins — the line-height IS the pitch).
- **CTA (`plan-cta`):** a 38px pill — the `button-cta` scale, not a compact control. It outdents 4px past the 24px body padding to a 20px card inset and sits 20px off the card foot. Two variants: **neutral** (Create Account — `{colors.fill-cta}` charcoal, inverts to white-on-dark in dark mode) and **info** (Book a Demo — `{colors.accent-info}`, white label in both themes). The neutral CTA does not take the dark-CTA blue: side by side with the info blue, it must stay neutral.

### Mobile Pair Page (`button-cta`, `feature-list`, `status-dot`, `device-panel`, `phone-mockup`)

An Agent-mode screen that splits the main area: copy on the left, a device showcase on the right. The sidebar swaps to the Agent nav set (New task, Workspace, Active runs, Live Artifacts, Plugins, **Mobile** active — the one filled glyph in the nav) and its recents trade icons for `status-dot`s: 6px `{colors.status-run}` cyan for live runs, a `{colors.text-muted}` ring for idle items.

- **Left column** (max 460px, under the ghost-dots band): a 34px filled Apple mark, `display-title` ("Pair with Mobile app") + `lede`, then `button-cta` — the large 40px `{colors.fill-cta}` pill ("Connect device", white 15px label; the only large CTA in the system, distinct from the 19px `upgrade-pill` and rectangular `button-primary`).
- **Feature list** (`feature-list`): one hairline card, `{rounded.lg}`, three rows split by `{colors.hairline-soft}` — each a 22px **filled** secondary glyph (cast / terminal-circle / paper plane) beside a `title-lg` (15px/400 ink) title and a 15px muted subtitle — same size, ink-vs-muted does the separating. The filled glyphs are the deliberate counterpoint to the line-icon chrome.
- **Device panel** (`device-panel`): a `{rounded.3xl}` rounded panel pinned right (556px), painted with layered radial pastels (`panel-grad-sky/lav/peri/deep` over a vertical blue base, white bloom behind the phone). It reads as imagery: light values in both themes.
- **Phone mockup** (`phone-mockup`): a 288×622 white iPhone — 9px #111 frame, 44px radius, dynamic-island pill, 9:41 status bar — running a mini Alpaca Labs screen: ✱ mark, 16px/400 title, 13px nav rows (MCP carries the red "New"), faint section labels, dot-status recents, and a full-width `{colors.fill-cta}` "New task" pill inset at the bottom. The phone holds light values in both themes and carries the system's only other shadow (a soft ambient lift, scoped to the mockup).

### Apps Marketplace Page (`marketplace-search`, `apps-banner`, `prompt-pill`, `app-card`, `app-add-btn`)

The Apps screen (Chat-mode sidebar, **Apps** active with its red New badge) on the 680px `{spacing.content-doc}` column under the ghost-dots band. Top to bottom:

- **Centered heading:** the shared `display-title` (21px/400 ink), centered: "Connect the tools your team already uses".
- **Marketplace search (`marketplace-search`):** a full-column capsule variant of the search field — 34px, `{rounded.pill}`, hairline, magnifier + "Search marketplace..." in faint. Same anatomy as the topbar search, different proportions.
- **Promo banner (`apps-banner`):** a 200px `{rounded.xl}` art panel (violet→sky pastels, `apps-grad-*`) holding three left-aligned, **staggered** `prompt-pill`s — white 30px capsules pairing a 14px brand glyph + brand-colored 12px/500 app name with a 12px example prompt ("Slack · Summarize key updates from recent conversations"). The pills stay white with light-value text in both themes; the stagger (0/24/32px indents) gives the art a casual, chat-like rhythm.
- **Featured grid:** a `page-header`-type "Featured" label (16px/500 ink), then a 2-up grid of `app-card` rows — a 38px hairline `app-tile` with a 20px full-color brand logo, a 15px/500 ink name over a truncating 14px muted description, and a trailing 30px `app-add-btn` (`{colors.badge-neutral}` rounded square, secondary + glyph). A connected app (X) swaps the button for a bare muted check — no fill marks done states.

### CSS Architecture — Shared Component Layer

`globals.css` is organized as a **shared component layer above per-page sections**, mirroring this spec's one-entry-per-component structure. Anything that repeats across screens is defined **once** with a bare class selector; pages only carry their genuine differences. Two component families lead the file:

- **Buttons** — a `.btn` base (inline-flex, 13px/400, `{rounded.md}`, 0.15s color/opacity transition) plus composable modifiers across four axes — **size** (`.btn--sm` 24px·12px, `.btn--md` 28px, `.btn--lg` 36px·14px), **shape** (`.btn--pill`, `.btn--bordered`, `.btn--icon` — icon honours sm/lg as a square), **intent** (`.btn--primary`, `.btn--neutral` = secondary, `.btn--danger`, `.btn--info`, `.btn--send`, `.btn--quiet`, `.btn--muted` = ghost/text), and **state** (`:hover` and `:active` are built in per intent; `:disabled` dims to 45% and blocks pointer input — except `.btn--send`, whose idle is a _designed_ soft-blue state, not a greyed-out one). **Outlined** variants come from `.btn--bordered` + an intent: `+ .btn--primary` paints an ink line, `+ .btn--danger` a tinted red line that hovers to `{colors.accent-danger-soft}`, others read as a neutral hairline outline. Destructive intent uses `{colors.accent-danger}` (#e5484d; #ff5d62 on dark). The role buttons above (`button-primary`, `button-cta`, `upgrade-pill`, `plan-cta`, `modal-cta`, `send-button`) compose a base + modifiers; their one-off geometry stays in a small "keeper" rule on the original class (and ignores the `--sm/md/lg` scale).
- **App shell** — the page reset, the `.app` frame, the top bar (`.topbar`, `.logo-mark`, `.tabs`/`.tab`, `.topbar-search`/`.kbd`, `.topbar-actions`, `.avatar`, and the `.theme-toggle` light/dark icon swap), the sidebar (`.body`, `.sidebar`, `.side-row` + states, `.side-section`, `.sidebar-footer`, `.badge-new`, `.app-icons`), and the `.main` scroll region with its `.ghost-dots` band — each defined once and picked up by every page that uses the class.
- **Content typography** — the doc-page heading and lede are shared too: `.display-title` (21px/400 ink, `marginBelow {spacing.3}`) and `.lede` (15px/1.6 secondary). The apps page centers its `.display-title` (keeper); the templates page runs a tighter 13px `.lede` variant (keeper). Note: templates' equivalent heading is still named `.page-title` — same visual as `.display-title`, a leftover naming inconsistency.

**Page deltas are keepers, not copies.** Where a screen diverges, a single `html[data-page="…"] .x { … }` rule overrides only the changed properties (a page-scoped selector always outranks the bare base). The genuine deltas today: **templates** lays `.app` as a row and gives `.sidebar-footer` a flex avatar+meta row; **plans** centers `.app` as a scrolling column and tightens the `.ghost-dots` top margin; **mobile** makes `.main` a row and narrows `.ghost-dots`; **templates/plans** float the `.theme-toggle` top-right (no top bar to host it). Each page section opens with a one-line note when its chrome is pure shared defaults.

**Global rules** apply once across all pages: the **focus ring** (a 1px neutral `{colors.text-muted}` outline for buttons and links — never an accent/blue ring, suppressing the browser default); the **reduced-motion reset** (`@media (prefers-reduced-motion)` zeroes every transition); and the **responsive shell** (`@media (max-width: 860px)` hides `.sidebar` and shrinks `.topbar-search` to 180px). Pages add only their own responsive tweaks (grid reflow, banner clamp) on top.

---

## Do's and Don'ts

### Do

- Keep canvas and cards the same pure white; let hairlines alone articulate structure.
- Separate every region with neutral hairlines at 4–7% black — never tinted fills.
- Keep each accent in its single scoped role (red badge, blue badge, terracotta model, periwinkle send, gold note, violet avatar, terminal traffic lights, run cyan, device-panel pastels, demo blue, plan-banner pastels, marketplace pastels).
- Cap emphasis at weight 500 everywhere; build hierarchy with size steps (up to the 21px display heading) and ink-vs-faint contrast, never weight.
- Use full-round pills for anything small and interactive; 20px radius for the focal composer.
- Keep decorations (dot-matrix band, sticky stack, pastel tile) at the margins of the working column.

### Don't

- Don't add drop shadows beyond the composer's faint lift, the phone mockup's scoped ambient shadow, and the onboarding modal's drop over its scrim — depth is hairlines and overlap.
- Don't promote an accent into general UI chrome (no blue buttons, no red highlights).
- Don't use blue focus rings — keyboard focus is a 1px neutral `{colors.text-muted}` outline, never an accent color (and never the browser's default blue ring).
- Don't use bold (600+) anywhere on this surface — doc-page display headings and feature titles included; they are regular weight, distinguished by size and ink alone.
- Don't put fills behind inactive chrome; inactive = muted text on canvas, nothing more.
- Don't let the working column exceed 600px (680px on the doc pages — welcome and apps) or the banner detach from its stack.

---

## Responsive Behavior

### Breakpoints

| Range      | Behavior                                                              |
| ---------- | --------------------------------------------------------------------- |
| < 860px    | Sidebar hides; search compresses to 180px; banner clamps to viewport. |
| 860–1280px | Full shell; hero column stays 600px centered.                         |
| > 1280px   | Identical; extra space becomes canvas margin.                         |

### Touch & Hit Targets

- Interactive rows are 27–30px — dense desktop targets; mini-buttons (24px) rely on surrounding whitespace.
- Composer is the only large target and stays ≥ 600×90.

### Collapsing Strategy

- Sidebar disappears entirely below 860px (no rail state observed).
- The suggestion row may wrap below the composer width; the banner truncates its subtitle with ellipsis first.
- The welcome `split-section` stacks to a single column below 860px; snippets scroll their command horizontally rather than wrap.
- The `device-panel` (and its phone) hides entirely below ~1100px — the pair page's copy column never competes with the showcase for space.
- The plans page's two cards stack to a single centered column below ~700px.
- The apps page's `app-card` grid stacks to a single column below 860px; descriptions keep truncating with ellipsis first.

---

## Iteration Guide

1. Work one component at a time, referencing its `components:` entry.
2. Shared chrome (buttons, app shell, top bar, sidebar, main) lives once in the global component layer (see _CSS Architecture_); add a page rule only for a genuine per-screen delta, overriding just the changed properties — never re-declare a whole shared rule under `html[data-page="…"]`.
3. Never inline hex — every value routes through the token tables above.
4. New interactive elements default to: 13px/400 secondary text, `{rounded.md}`, `{colors.fill-hover}` hover, `{colors.fill-active}` active.
5. New surfaces are white cards with 1px `{colors.hairline}` — pick radius by focality (12 → 16 → 20).
6. A new accent requires a new scoped role; if a role exists, reuse its token.
7. Keep motion at 0.15s background/opacity transitions with the standard ease and a reduced-motion gate.

## Known Gaps

- Derived from static screenshots — hover/active states beyond the visible pills and focus styles are unobserved (focus ring is a 1px neutral `{colors.text-muted}` outline — accent-blue rings are explicitly banned). The dark theme is measured from the dark-mode reference screenshots (home, plans, artifacts/agent quadrants); small-text alphas (secondary/muted/faint) carry ±5–10% anti-aliasing uncertainty, and the saturated badge/CTA blues sampled over dark fills carry ±1–2 steps of anti-aliasing pull. The dark skeleton, hover fill, and modal scrim are the only values still partly estimated (no clean isolated sample appears in the references).
- The exact brand font is unknown; the system stack with Inter fallback is the substitute.
- Chat/Agent/Code/Design mode screens and dropdowns are out of scope; the one specified dialog is the onboarding modal. Its dark-mode scrim (`{colors.dark-scrim}`) is estimated — the plans-modal backdrop reads ~#141414 but is not cleanly separable from the window frame.
- The dot-matrix band is reproduced as two offset CSS dot grids under an elliptical fade mask; the original may be a baked texture asset.
- The reference's icon set is approximated with hand-drawn 16px line icons (1.3px stroke).
- Surface and fill hexes (#ffffff canvas, #fafafa strip, #f5f5f5 pill, #b7d9f8 send, #333333 CTA) were pixel-sampled from the reference captures. Light-mode type sizes, weights, and grays were re-measured against the 1.5×-scale home reference (image_1780696276010): glyph cap-heights and string widths give 13px chrome type, 12px strip type, and regular (400) weight throughout the chrome; darkest-stroke sampling gives the #5d/#555 chrome gray, #a1 placeholder, and #333 CTA fill (±1px / ±1 gray step from anti-aliasing). Saturated accent hexes were NOT re-sampled from that capture (color-profile shift risk) — they stay snapped to the extracted Codex token set.
