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
import { gitConfig } from "@/lib/shared";
import { createMetadata, defaultDescription } from "@/lib/metadata";
import type { Metadata } from "next";
import { SafeMarkdownCopyButton } from "@/components/safe-markdown-copy-button";

const LAST_UPDATED_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function LastUpdated({ date }: { date: Date }) {
  return (
    <p className="ms-auto text-sm text-fd-muted-foreground">
      Last updated{" "}
      <time dateTime={date.toISOString()}>
        {LAST_UPDATED_FORMAT.format(date)}
      </time>
    </p>
  );
}

export default async function Page(props: PageProps<"/internal/[...slug]">) {
  const params = await props.params;
  const page = internalSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <SafeMarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/internal/${page.path}`}
        />
        {page.data.lastModified ? (
          <LastUpdated date={page.data.lastModified} />
        ) : null}
      </div>
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
