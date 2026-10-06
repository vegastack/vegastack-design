# Migrating identity pickers

`SpaceAvatar` and `SpaceOption` are removed. Render identity glyphs with `IconGlyph` in the existing DS item/media/content parts. The application owns initial fallbacks, personal-space icons and privacy-safe labels. Existing SpacePicker/AccessChip presentation types now live with SpacePicker. Replace the old SpaceIcon alias with Lucide Layers.

Use `IconPicker` with `modes={["icon", "emoji"]}` for identity editing and a custom InputGroupButton trigger. `closeOnSelect={false}` lets users change the glyph and hue together. One enabled mode omits tabs. EmojiPicker continues to return characters for text insertion and reactions.

Pass the record's hue, including null for Default, when editing an existing record. Undefined allows the locally remembered default; merely opening the picker never calls change callbacks. A new icon commits that effective hue. Scope preferenceKey to the account/workspace. Persist each entity's own hue separately.

The catalogue exposes IconName, IconValue and isIconName without React. Persist icons with a discriminator such as `lucide:<name>` and validate the suffix; continue reading existing emoji. Unknown catalogue names fall back safely. Do not render stored identifiers as text.

ColorPicker supports custom triggers, controlled popup state and closeOnSelect. Its default columns change from seven to six; explicit columns remain unchanged. Clearing is a separate action, not an extra swatch. Selection marks the outer cell and does not obscure its fill.

Consume generated registry artifacts through pre-write verification, copy-in and offline post-write verification. Local hash-only integration proves byte integrity, not released provenance. Publish through the existing signed release workflow when separately authorised.
