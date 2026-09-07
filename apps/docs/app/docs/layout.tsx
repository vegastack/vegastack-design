import Link from "next/link";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { Banner } from "fumadocs-ui/components/banner";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <>
      {/* The registry-auth notice ONCE per site (canon row 1), dismissible and remembered per
          browser by its `id` — not repeated on all 110 component pages. */}
      <Banner id="registry-auth" variant="normal">
        Component installs need the{" "}
        <Link
          href="/docs/install"
          className="ms-1 underline underline-offset-4"
        >
          registry setup
        </Link>
        <span className="ms-1">
          — the Base UI shadcn project, the <code>@vegastack</code> namespace
          and the Cloudflare Access service token.
        </span>
      </Banner>
      <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
        {children}
      </DocsLayout>
    </>
  );
}
