// @vegastack signup-05@0.15.0 sha256-m2L8KAvHDbJLxQZ9zOAZXtsXaegrVcpYQx7uesdkO2o=

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
