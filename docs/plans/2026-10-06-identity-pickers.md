# Identity picker implementation

Approved directly by MK in Codex on 6 October 2026. Implement 160 curated outline icons, a generic IconGlyph renderer and IconPicker with optional Icons/Emoji line tabs, shared search/category/recent content, and a nested ColorPicker using the ten existing hues. Keep existing EmojiPicker insertion APIs. Standard grids have eight columns, compact grids seven; recents occupy at most two rows. Selection is a persistent outer-cell border; keyboard focus remains the global DS tint.

Delete SpaceAvatar and its registry/docs surfaces after migrating all dependents. Regent composes generic DS components without new local visual styles, retains privacy-safe app helpers, combines name and picker in Create/Settings, and moves Members above Access. Store Lucide selections as validated lucide:<name> strings while retaining legacy emoji; no DB migration.

Canonical source owns every visual. Generated copies are rebuilt, then consumed from saved hash-verified artifacts and checked offline. Verification is affected browser tests, required static checks, targeted light/dark and short viewport acceptance, and independent review. Publication, deployment and main integration are excluded.
