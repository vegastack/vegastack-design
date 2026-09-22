// @vegastack signup-04@0.11.1 sha256-ru4zyiIDiaAWwq6/HXgFOrYyX4wY7PovIR2lSoOT6w8=

import { SignupForm } from "./components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  );
}
