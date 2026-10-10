---
"@vegastack/ui": patch
---

🐛 **NumberField**: the − and + steppers draw one divider each against the input, inside the field's single border. Before, each stepper painted its own full box, doubling the outer edge and the dividers in light and dark. The divider no longer nudges a pixel on press. **Tabs**: a click on a panel's empty space no longer tints the whole panel once a key is pressed (⌘ alone was enough in Chromium, turning a drawer body grey). A panel reached with the keyboard still shows the focus tint. **SortableList**: a new `footer` row, such as an "Add a value" field and its Add button, lines up with the rows' content, between the handle gutter and the × gutter.
[docs](https://design.vegastack.com/docs/components/sortable-list)
