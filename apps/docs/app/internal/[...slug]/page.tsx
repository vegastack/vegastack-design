import { getPageMarkdownUrl, internalSource } from "@/lib/source";
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
import { PageActions } from "@/components/page-header";
import { gitConfig } from "@/lib/shared";
import { createMetadata, defaultDescription } from "@/lib/metadata";
import type { Metadata } from "next";

export default async function Page(props: PageProps<"/internal/[...slug]">) {
  const params = await props.params;
  const page = internalSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page);

  return (
    <DocsPage id="content" toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <PageActions
        markdownUrl={markdownUrl}
        lastModified={page.data.lastModified}
      >
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/internal/${page.path}`}
        />
      </PageActions>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(internalSource, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return internalSource.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/internal/[...slug]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = internalSource.getPage(params.slug);
  if (!page) notFound();
  return createMetadata({
    title: page.data.title,
    description: page.data.description ?? defaultDescription,
    pathname: page.url,
    image: {
      url: "/og/home/image.png",
      alt: "VegaStack Design",
    },
    type: "article",
    modifiedTime: page.data.lastModified,
    robotsPolicy: "private",
  });
}
