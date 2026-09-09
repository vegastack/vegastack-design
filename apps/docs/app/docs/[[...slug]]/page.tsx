import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { ComponentPreview } from "@/components/component-preview";
import { PageActions, PageFacts } from "@/components/page-header";
import { gitConfig } from "@/lib/shared";
import {
  createMetadata,
  createPageStructuredData,
  defaultDescription,
  serializeStructuredData,
} from "@/lib/metadata";
import type { Metadata } from "next";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page);
  // Canon row 0: the `shadcn add @vegastack/<name>` target is declared frontmatter, never
  // inferred from the slug — an inferred value lets a wrong or missing one pass silently.
  const registryName = page.data.registry;
  const description = page.data.description ?? defaultDescription;
  const structuredData = createPageStructuredData({
    title: page.data.title,
    description,
    pathname: page.url,
    modifiedTime: page.data.lastModified,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(structuredData),
        }}
      />
      {/* `id="content"` is the skip-link target (DC-06), on the docs and home roots alike. */}
      <DocsPage id="content" toc={page.data.toc} full={page.data.full}>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-0">{description}</DocsDescription>
        <PageFacts
          status={page.data.status}
          since={page.data.since}
          a11y={page.data.a11y}
        />
        <PageActions
          markdownUrl={markdownUrl}
          registryName={registryName}
          lastModified={page.data.lastModified}
        >
          <ViewOptionsPopover
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`}
          />
        </PageActions>
        <DocsBody>
          {/* The hero fixture renders through the SAME frame as every example (DC-05): identical
              chrome, width toggle, fullscreen and product type scope — Preview tab only. */}
          {page.data.preview ? (
            <ComponentPreview name={page.data.preview} hero />
          ) : null}
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page),
            })}
          />
        </DocsBody>
      </DocsPage>
    </>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return createMetadata({
    title: page.data.title,
    description: page.data.description ?? defaultDescription,
    pathname: page.url,
    image: {
      url: getPageImage(page).url,
      alt: `${page.data.title} — VegaStack Design documentation`,
    },
    type: "article",
    modifiedTime: page.data.lastModified,
  });
}
