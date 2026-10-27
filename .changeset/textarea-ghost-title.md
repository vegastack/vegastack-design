---
"@vegastack/ui": patch
---

🔧 **Textarea** takes `variant` (`"default" | "ghost"`) and `size` (`"default" | "lg"`), as **Input** does, and `submitOnEnter` (decision API-40). `variant="ghost"` is borderless and transparent, starts at one row and grows with its text; `size="lg"` is the heading size — `<Textarea variant="ghost" size="lg" submitOnEnter />` is a big title that wraps. With `submitOnEnter`, Enter submits the form (`requestSubmit`) and Shift+Enter adds a line; IME composition is left alone. Existing textareas are unchanged. [docs](https://design.vegastack.com/docs/components/textarea)
