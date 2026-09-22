// @vegastack signup-01@0.11.1 sha256-2Vp+sluTJ+ytenEBvNp45uCe+0gGUf3A/qRQIwsTXUQ=

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
