---
"@vegastack/ui": patch
---

🐛 **TextEdit**:

- **Find:** ⌘F with words selected now searches for them and typing replaces the term. It used to append to it, and a whole selected block was taken as the term.
- **Heading links:** the `#` copy link follows its heading when the text above it changes, instead of staying where the heading was.
- **MermaidBlock:** printing from dark mode prints the light diagram (drawn while the page is idle), not dark shapes on white paper.
- **Block views:** a new Diagram (or any block view) holding its starter opens in Code, as documented, instead of Preview.
  [docs](https://design.vegastack.com/docs/components/text-edit)
