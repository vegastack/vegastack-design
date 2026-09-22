// @vegastack signup-01@0.12.0 sha256-xuYYs7yKFwZPh6LF3FbwJBXA72fdb3F8P2v/Hw764rA=

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
