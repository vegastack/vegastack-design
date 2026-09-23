// @vegastack signup-01@0.15.0 sha256-lu0UN7cyymMSO/OvajorH//yLUK/GW1vTVe9aIZ17vM=

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
