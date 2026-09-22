// @vegastack signup-01@0.11.3 sha256-Kv+eCF55+IftePS2FxNZXXHU8akuZtYhkx3e49YXwPE=

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
