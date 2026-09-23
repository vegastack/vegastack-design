// @vegastack signup-03@0.14.0 sha256-M6RYwG83fIYb9CvRT8//Up7v7Xv8w02vW/ac2o16FWk=

import { SignupForm } from "./components/signup-form";
import { GalleryVerticalEndIcon } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Acme Inc.
        </a>
        <SignupForm />
      </div>
    </div>
  );
}
