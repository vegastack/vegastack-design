import type { Metadata } from "next";
import { appName } from "./shared";

// Canonical host confirmed in docs/plans/detail/04-registry-and-cloudflare.md. The docs
// app and the `/r/*` registry are served from the same Worker, with separate Access apps.
export const siteUrl = new URL("https://design.vegastack.com");

export const homeTitle = "VegaStack Design — Components, Tokens & Patterns";

export const defaultDescription =
  "VegaStack components, design tokens, interaction patterns, implementation guidance, and authenticated registry installation for product teams and AI agents.";

export const homeOgTitle = "Components, Tokens & Patterns";
export const homeOgDescription = defaultDescription;

/**
 * Explicit build-time discovery mode. Production sets `public`; local builds fail closed to
 * `private`. This never grants or removes network access — Cloudflare Access owns authorization.
 */
const configuredVisibility = process.env.SITE_VISIBILITY ?? "private";
if (configuredVisibility !== "private" && configuredVisibility !== "public") {
  throw new Error(
    `Invalid SITE_VISIBILITY "${configuredVisibility}"; expected "private" or "public".`,
  );
}
export const siteVisibility = configuredVisibility;
export const isPublicSite = siteVisibility === "public";

export const privateRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
};

const publicRobots: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
};

interface MetadataImage {
  url: string;
  alt: string;
}

interface CreateMetadataOptions {
  title: string;
  description: string;
  pathname: string;
  image?: MetadataImage;
  type?: "website" | "article";
  modifiedTime?: Date;
  robotsPolicy?: "site" | "private";
}

/**
 * Complete page metadata. Open Graph and Twitter objects are intentionally self-contained:
 * Next.js replaces nested metadata objects rather than deep-merging them across layouts.
 */
export function createMetadata({
  title,
  description,
  pathname,
  image,
  type = "website",
  modifiedTime,
  robotsPolicy = "site",
}: CreateMetadataOptions): Metadata {
  const isHome = pathname === "/";
  const documentTitle = isHome ? title : `${title} · ${appName}`;
  const canonical = new URL(pathname, siteUrl).toString();
  const absoluteImage = image
    ? {
        url: new URL(image.url, siteUrl).toString(),
        width: 1200,
        height: 630,
        type: "image/png",
        alt: image.alt,
      }
    : undefined;

  return {
    title: { absolute: documentTitle },
    description,
    alternates: { canonical },
    applicationName: appName,
    referrer: "strict-origin-when-cross-origin",
    manifest: "/manifest.webmanifest",
    robots:
      robotsPolicy === "private" || !isPublicSite
        ? privateRobots
        : publicRobots,
    openGraph: {
      title: documentTitle,
      description,
      url: canonical,
      siteName: appName,
      type,
      ...(type === "article" && modifiedTime
        ? { modifiedTime: modifiedTime.toISOString() }
        : {}),
      ...(absoluteImage ? { images: [absoluteImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
      description,
      ...(absoluteImage ? { images: [absoluteImage] } : {}),
    },
  };
}

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": new URL("/#organization", siteUrl).toString(),
      name: "VegaStack",
      url: siteUrl.toString(),
      logo: new URL("/brand/icon-512.png", siteUrl).toString(),
    },
    {
      "@type": "WebSite",
      "@id": new URL("/#website", siteUrl).toString(),
      name: appName,
      description: defaultDescription,
      url: siteUrl.toString(),
      publisher: { "@id": new URL("/#organization", siteUrl).toString() },
    },
  ],
};

interface PageStructuredDataOptions {
  title: string;
  description: string;
  pathname: string;
  modifiedTime?: Date;
}

export function createPageStructuredData({
  title,
  description,
  pathname,
  modifiedTime,
}: PageStructuredDataOptions) {
  const pageUrl = new URL(pathname, siteUrl).toString();
  const docsUrl = new URL("/docs", siteUrl).toString();
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: appName,
      item: siteUrl.toString(),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: pathname === "/docs" ? title : "Docs",
      item: docsUrl,
    },
  ];

  if (pathname !== "/docs") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: title,
      item: pageUrl,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${pageUrl}#article`,
        headline: title,
        description,
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        ...(modifiedTime ? { dateModified: modifiedTime.toISOString() } : {}),
        publisher: { "@id": new URL("/#organization", siteUrl).toString() },
        isPartOf: { "@id": new URL("/#website", siteUrl).toString() },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: breadcrumbItems,
      },
    ],
  };
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
