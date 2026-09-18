// @vegastack signup-01@0.9.1 sha256-ZKeCDY9RZLZXJ4aJqGyu4fBlayT4M9nqz6+3FV+pZb4=

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
