---
"@vegastack/ui": patch
---

🐛 **TextEdit**: a heading's `#` link stays on its own heading. While it shows it follows the heading wherever the page moves it (content arriving above the editor, a resize), instead of staying at the coordinates it was drawn at — where it could sit beside a meta line or a paragraph that had moved into the heading's place. It hides while the page scrolls and returns a beat after, and a collaborator's edit drops a hovered position until the pointer moves again.
