// @vegastack signup-01@0.11.0 sha256-LpXJWmnfbviIZXXl9YMQGISJKQruSP38c9xEzstH+fk=

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
