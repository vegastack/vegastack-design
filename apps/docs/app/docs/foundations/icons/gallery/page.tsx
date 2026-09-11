import Link from "next/link";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { IconGallery } from "@/components/icon-gallery";
import {
  createMetadata,
  createPageStructuredData,
  serializeStructuredData,
} from "@/lib/metadata";

const pathname = "/docs/foundations/icons/gallery";
const title = "Animated icon gallery";
const description =
  "Browse and replay every lucide-animated icon available through the VegaStack registry.";

export const metadata = createMetadata({
  title,
  description,
  pathname,
  type: "article",
  image: {
    // The gallery is the interactive continuation of the Icons foundation page, so it shares the
    // same generated social card rather than adding a second OG renderer outside the MDX source.
    url: "/og/docs/foundations/icons/image.png",
    alt: "Animated icon gallery — VegaStack Design documentation",
  },
});

export default function AnimatedIconGalleryPage() {
  const structuredData = createPageStructuredData({
    title,
    description,
    pathname,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(structuredData),
        }}
      />
      <DocsPage id="content" toc={[]} full>
        <DocsTitle>{title}</DocsTitle>
        <DocsDescription className="mb-0">{description}</DocsDescription>
        <DocsBody>
          <p>
            <Link href="/docs/foundations/icons">
              Return to icon guidance and installation
            </Link>
          </p>
          <IconGallery />
        </DocsBody>
      </DocsPage>
    </>
  );
}
