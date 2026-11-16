import { getLLMText, source } from "@/lib/source";
import omitted from "@/lib/llms-full-omitted.json";

/**
 * The release log and the point-in-time shadcn-reset guide are the corpus's two largest pages and
 * neither is guidance an agent needs whole; they stay on the site, in llms.txt and as `.md` (R11).
 */
const OMITTED = new Set<string>(omitted.routes);

export const revalidate = false;

export async function GET() {
  const scanned = await Promise.all(
    source
      .getPages()
      .filter((page) => !OMITTED.has(page.url))
      .sort((a, b) => a.url.localeCompare(b.url))
      .map(getLLMText),
  );
  return new Response(`${scanned.join("\n\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
