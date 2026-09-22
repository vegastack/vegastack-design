// @vegastack signup-01@0.11.2 sha256-tCpwa2lMMd5wHZBs7kOlT4cMnf9Ey25dhMVa2i6n4KI=

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
