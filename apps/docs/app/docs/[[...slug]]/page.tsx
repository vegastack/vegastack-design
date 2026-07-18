import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import * as Preview from '@/components/preview';
import { gitConfig } from '@/lib/shared';
import type { Metadata } from 'next';

/**
 * Deterministic, server-rendered "Last updated" stamp. Replaces fumadocs' `PageLastUpdate`,
 * which renders `toLocaleDateString()` (locale-dependent "7/18/2026") inside a client
 * `useEffect` — numeric US format + a visible hydration pop-in. This formats once on the
 * server as "Jul 18, 2026" with a semantic `<time>` element.
 */
const LAST_UPDATED_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function LastUpdated({ date }: { date: Date }) {
  return (
    <p className="ms-auto text-sm text-fd-muted-foreground">
      Last updated <time dateTime={date.toISOString()}>{LAST_UPDATED_FORMAT.format(date)}</time>
    </p>
  );
}

function getPreviewComponent(name: string | undefined) {
  if (!name) return null;

  const Comp = Preview[name as keyof typeof Preview] as (() => React.ReactNode) | undefined;
  if (!Comp) {
    const available = Object.keys(Preview).sort().join(', ');
    throw new Error(
      `Missing page preview "${name}". Add it to apps/docs/components/preview or fix the MDX frontmatter. Available previews: ${available}`,
    );
  }

  return Comp;
}

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const PreviewComp = getPreviewComponent(page.data.preview);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`}
        />
        {/* Git-derived timestamp (fumadocs-mdx last-modified plugin, source.config.ts). */}
        {page.data.lastModified ? <LastUpdated date={page.data.lastModified} /> : null}
      </div>
      <DocsBody>
        {PreviewComp ? <PreviewComp /> : null}
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const image = getPageImage(page).url;
  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: { images: image },
    twitter: { images: image },
  };
}
