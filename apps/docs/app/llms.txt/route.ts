import { source } from "@/lib/source";
import { siteUrl } from "@/lib/metadata";
import { llms } from "fumadocs-core/source";

export const revalidate = false;

// `/design.md` is the design contract itself, not a docs page, so fumadocs' page index never sees
// it. llms.txt is the channel agents actually read to discover what a site offers, so the artifact
// is appended explicitly — otherwise it is only reachable by someone already knowing the URL.
const DESIGN_CONTRACT = `## Design contract

- [design.md](${new URL("/design.md", siteUrl).href}): the complete VegaStack design doctrine —
  token scales, semantic roles, component recipes, and the accessibility contract. Generated from
  the same source the shipped components are built against, so it is authoritative rather than a
  written-by-hand summary.
`;

export function GET() {
  return new Response(`${llms(source).index()}\n\n${DESIGN_CONTRACT}`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
