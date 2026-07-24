import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  const scanned = await Promise.all(
    source
      .getPages()
      .sort((a, b) => a.url.localeCompare(b.url))
      .map(getLLMText),
  );
  return new Response(`${scanned.join("\n\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
