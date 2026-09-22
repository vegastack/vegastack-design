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
        {/* The enumeration is detail, and it only fits on the banner's one line from `lg` up
            (measured: the full sentence needs 6 lines at 320px, 2 at 768px, 1 at 1024px). Below
            that it is hidden rather than wrapped, because `Banner` is a FIXED-height sticky box —
            wrapped text overflows it and paints over the site header — and because the link
            beside it goes to the page that performs this setup, so nothing is lost, only deferred.
            The lead sentence and the link are unconditional: the notice itself is canon. */}
        <span className="ms-1 hidden lg:inline">
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
