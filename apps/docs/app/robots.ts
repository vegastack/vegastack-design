import type { MetadataRoute } from "next";
import { isPublicSite, siteUrl } from "@/lib/metadata";

// Static-export-compatible: no request-time APIs — computed once at build.
export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  if (!isPublicSite) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `/r/*` is the private shadcn registry (service-token-gated behind Cloudflare Access —
        // see AGENTS.md "Auth"); it isn't meant for human browsing or search indexing.
        disallow: ["/r/", "/internal/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
