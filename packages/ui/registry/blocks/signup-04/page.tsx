// @vegastack signup-04@0.11.0 sha256-F08zEtKpKG8c8APAi+aZmuMA1WzP0d+havbY3PeIE5I=

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
