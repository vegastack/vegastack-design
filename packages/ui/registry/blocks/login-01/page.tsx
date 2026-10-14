// @vegastack login-01@0.25.34 sha256-TvLRPpuo/2MLWChq2wQZGhh/Q2GsTD8Te3JFv8tIz00=

import { LoginForm } from "./components/login-form";

/**
 * The sign-in route: `LoginForm` centred on the page at a readable width, filling the small
 * viewport height (`min-h-svh`) so the card never sits under a mobile browser's toolbar.
 *
 * @example
 * ```tsx
 * // app/login-01/page.tsx — installed by `shadcn add @vegastack/login-01`
 * export default function Page() {
 *   return <LoginPage />;
 * }
 * ```
 */
export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
