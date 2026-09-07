import { docs, internalDocs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { docsRoute, internalRoute } from "./shared";
import { renderAgentMarkdown } from "./markdown-export";

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
});

export const internalSource = loader({
  baseUrl: internalRoute,
  source: internalDocs.toFumadocsSource(),
});

type PublicPage = (typeof source)["$inferPage"];
type InternalPage = (typeof internalSource)["$inferPage"];
type MarkdownPage = PublicPage | InternalPage;

export function getPageMarkdownUrl(page: MarkdownPage) {
  if (process.env.NODE_ENV === "development") {
    return `${getPageMarkdownStagingRoute(page)}/content.md`;
  }
  return `${page.url}.md`;
}

export function getPageMarkdownStagingRoute(page: MarkdownPage) {
  return `/llms.mdx${page.url}`;
}

export function getPageMarkdownStagingSegments(page: MarkdownPage) {
  return [...page.slugs, "content.md"];
}

export function getPageImage(page: PublicPage) {
  const segments = [...page.slugs, "image.png"];
  return { segments, url: `/og/docs/${segments.join("/")}` };
}

/**
 * The agent-facing markdown for one page (DS-01): title, the frontmatter facts a reader sees in
 * the page header (description, status, since, a11y pattern, install target), then the processed
 * body with every MDX component rendered to markdown — fixture source, flat API tables, install
 * steps — by `lib/markdown-export.ts`. Serves the `.md` sibling route, the dev-only
 * `/llms.mdx/**` staging route, and `llms-full.txt`.
 */
export async function getLLMText(page: MarkdownPage) {
  const { title, description, status, since, a11y, registry } = page.data;
  const facts = [
    status ? `Status: ${status}` : undefined,
    since ? `Since: ${since}` : undefined,
    a11y ? `Accessibility pattern: ${a11y}` : undefined,
    registry
      ? `Install: \`pnpm dlx shadcn@latest add @vegastack/${registry}\``
      : undefined,
  ].filter(Boolean);
  const header = [
    `# ${title} (${page.url})`,
    description ? `> ${description}` : undefined,
    facts.length > 0 ? facts.map((fact) => `- ${fact}`).join("\n") : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
  const processed = await page.data.getText("processed");
  return `${header}\n\n${await renderAgentMarkdown(processed)}`;
}
