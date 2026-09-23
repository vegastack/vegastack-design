---
"@vegastack/ui": patch
---

🐛 `stepper` and `multi-step-form` keep the current-step marker (`aria-current="step"`, the step count and focus-follow) when the current step fails validation. `StepperStep` gains an optional `current` flag that marks the step current alongside an `error` or `warning` state; `MultiStepForm` sets it, so a refused step now reads as both current and in error.
