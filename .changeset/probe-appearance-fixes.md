---
"@vegastack/ui": patch
---

🐛 **Toasts appear again, and three appearance-probe defects close.** The docs site mounted the
registry copy-in `Toaster` under the package provider's `ToastProvider`, and each toast module owns
a module-scope manager — so the viewport listened to one store while every preview's `toast()` wrote
to the other, and the [Toast](https://design.vegastack.com/docs/components/toast) page had been
silently dead since toasts moved to Base UI. The copy-in now brings its own provider, a gate refuses
a `Toaster` whose provider comes from a different module, and a browser test pins both halves of the
rule. [Tabs](https://design.vegastack.com/docs/components/tabs)' count badge stacks its ink wash on
whatever the trigger paints, which put muted ink at 3.43:1 on a selected pill in dark; it takes body
ink now, the token gate learned to check a wash painted on a ladder rung, and the rendered-contrast
lane covers every variant in both themes.
[DatePicker](https://design.vegastack.com/docs/components/date-picker)'s `data-day` hook is a stable
`YYYY-MM-DD` instead of a locale-formatted string, which is what made a prerendered calendar throw a
hydration error in every browser whose locale was not the build host's, and the page now says
prerendering a formatted date needs an explicit `locale`.
[NumberField](https://design.vegastack.com/docs/components/number-field)'s addon slots hold an
interactive control off the field's hairlines and keep its focus ring out of the clip, so the money
recipe's currency `Select` stops painting into the rule.
