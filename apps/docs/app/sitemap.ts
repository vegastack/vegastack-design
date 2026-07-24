import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/metadata";
import { source } from "@/lib/source";

// Static-export-compatible: no request-time APIs, no dynamic params — computed once at build.
export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();

  // `source.getPages()` already includes the `/docs` index page (content/docs/index.mdx), so no
  // separate entry for it is needed here.
  const pages = source
    .getPages()
    .map((page): MetadataRoute.Sitemap[number] => ({
      url: url(page.url),
      ...(page.data.lastModified
        ? { lastModified: page.data.lastModified }
        : {}),
      changeFrequency: "weekly",
      priority: page.url === "/docs" ? 0.8 : 0.5,
    }));

  return [{ url: url("/"), changeFrequency: "monthly", priority: 1 }, ...pages];
}
