export function RegistryInstallCallout() {
  return (
    <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-sm text-info-text">
      <p className="font-medium text-foreground">Registry setup required</p>
      <p className="mt-1 text-muted-foreground">
        Run this command only after configuring the Base UI shadcn project, the
        <code className="mx-1 rounded bg-background px-1 py-0.5">@vegastack</code>
        registry namespace, and Cloudflare Access service-token headers in
        <a className="ml-1 underline underline-offset-4" href="/docs/install">
          Install From VegaStack Registry
        </a>
        .
      </p>
    </div>
  );
}
