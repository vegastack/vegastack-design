// @vegastack signup-01@0.12.1 sha256-yegUjb3Xx5a9+iYToQqd1u0WYp9fzShhbe/yqRkOzec=

import { SignupForm } from "./components/signup-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
