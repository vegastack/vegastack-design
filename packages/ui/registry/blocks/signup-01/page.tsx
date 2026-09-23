// @vegastack signup-01@0.16.0 sha256-KFNyjZ8drQUPT7wV6EnuZ20XcXi6mlG/d+30hky4o3E=

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
