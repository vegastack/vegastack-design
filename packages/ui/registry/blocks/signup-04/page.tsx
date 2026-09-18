// @vegastack signup-04@0.9.1 sha256-BxBF4IwOuaknN/zekYhV+aNOlI30HUPL/025GC23c0Y=

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
