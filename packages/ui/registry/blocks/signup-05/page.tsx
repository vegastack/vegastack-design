// @vegastack signup-05@0.11.1 sha256-Wg+NY21PeVxHyACCIa56Ug8sX/yj4ejj5Vo8PE6kf1E=

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
