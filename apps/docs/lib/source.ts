import { docs, internalDocs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { docsRoute, internalRoute } from "./shared";

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

export async function getLLMText(page: MarkdownPage) {
  const processed = await page.data.getText("processed");
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
