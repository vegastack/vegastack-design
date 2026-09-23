---
"@vegastack/ui": minor
---

🧩 PasswordInput is back as a thin InputGroup composition with a show/hide toggle.

- The toggle is a `type="button"` icon button named "Show password" / "Hide password" with `aria-pressed`, so it never submits a form.
- Every native input prop (`id`, `name`, `autoComplete`, `aria-invalid`) and the React 19 `ref` land on the inner input, so it works inside `Field`.
- Add it with `shadcn add @vegastack/password-input`.
