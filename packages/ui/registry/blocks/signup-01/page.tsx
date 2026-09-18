// @vegastack signup-01@0.10.0 sha256-RJ99BvkN6N6Iar0ycpu8+dB6PAkOA/oOAo3iFOJ0TFg=

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
