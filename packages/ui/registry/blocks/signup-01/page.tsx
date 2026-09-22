// @vegastack signup-01@0.12.2 sha256-w89CmQR3sVTCadHW5trgtSLYKfsr6jkcfAq2l3XwnFo=

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
