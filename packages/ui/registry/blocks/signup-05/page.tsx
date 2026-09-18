// @vegastack signup-05@0.9.1 sha256-dIoBIVBB4GwW1HzV2O6tjvoT8jweyKZQKin9mf+Ph7c=

import { SignupForm } from "./components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
