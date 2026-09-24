---
"@vegastack/ui": minor
---

🔧 The login-01 block is rebuilt as a real sign-in page to the block rules (DS-79).

- **login-01**: one `h1` "Sign in" (`CardTitle render={<h1 />}`), Email (`autoComplete="email"`) and Password through `PasswordInput` (`autoComplete="current-password"`), each labelled and described by its `Field`, a `FieldError` per field with focus on the first invalid one, a live destructive `Alert` shown only after a rejected sign-in, and a submit `Button` that loads in place without changing width. [docs](https://design.vegastack.com/docs/blocks/login-01)
- **LoginForm** takes your `signIn` call; "Forgot password?" and "Sign up" are real links (`forgotPasswordHref`, `signUpHref`). The docs page adds sign-up and forgot-password recipes on the same frame.
- Migration: the "Login with Google" button and every `href="#"` are gone; a copy you already own is unaffected until you copy the block again.
