---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
---

⚠️ Agent faces are Pebbles only: the Dot family is removed, a Pebble is one colour throughout, and its eyes and mouth stay on its face.

- 🗑 Removed: `AgentFaceSpec.family`, `FaceFamily`, `FACE_FAMILIES`, the Dot renderer, `data-family` and `data-form="dot"` (`data-form` is now `"pebble"` or `"mini"`), the `face-dot-ink` token and the `motion-face-chase` and `motion-face-wave` utilities. A stored face that still carries `family` draws as a Pebble; drop the field from your types.
- 🔧 Every part of a Pebble is its own palette: a Stack's lower layers and a Cairn's top stone no longer take a second colour (a blue Stack showed green discs). Lower layers step a little deeper in the same palette so the layers still read. Palettes lose `companion`; the phone's JSON keeps `companion` naming the palette itself, so a phone build draws one colour too.
- 🔧 The eyes, brows and mouth never leave the face: the generator works out each preset's face area (`pebble.face`: a Stack's or Cairn's top layer, a Prism's lit side, else the body), and each state's look moves the features only as far as that area holds them, eye motion included. Where a face is small, the glance, drift, scan and read travel less (`--face-room`).
- 🔧 Mist and Glass give the thought cloud a deeper edge on a light page, so it no longer vanishes into white; dark mode is unchanged. Palettes flag the neutrals with `neutral`.
