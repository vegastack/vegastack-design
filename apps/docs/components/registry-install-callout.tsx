import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * The registry-auth notice, on the system `Alert` (DC-08): logical spacing, `Link`, no bespoke
 * box. The canon renders this ONCE per site as the docs `Banner` (`app/docs/layout.tsx`); the
 * per-page usage is removed when Do1-b migrates the page bodies.
 */
export function RegistryInstallCallout() {
  return (
    <Alert intent="info" className="not-prose my-4">
      <AlertTitle>Registry setup required</AlertTitle>
      <AlertDescription>
        Run this command only after configuring the Base UI shadcn project, the{" "}
        <code>@vegastack</code> registry namespace, and the Cloudflare Access
        service-token headers in{" "}
        <Link className="underline underline-offset-4" href="/docs/install">
          Install from the VegaStack registry
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}
