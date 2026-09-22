// @vegastack login-03@0.11.1 sha256-LY23Zyw/MqYAxNCXEYKf5WJxU72EPwsWrr6f456mJC8=

import { LoginForm } from "./components/login-form";
import { GalleryVerticalEndIcon } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Acme Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
