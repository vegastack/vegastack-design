import { source } from "@/lib/source";
import { siteUrl } from "@/lib/metadata";
import { llms } from "fumadocs-core/source";
import {
  getPublicSkills,
  getRegistryRoster,
  type RosterEntry,
} from "@/lib/contracts";

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

/**
 * The registry roster (`08-docs-structure.md` §3). The page index above lists documentation; this
 * lists what is INSTALLABLE, with the `shadcn add` target beside the page, so an agent can go from
 * "I need a data grid" to the page and the install command in one read instead of scraping 110
 * HTML pages. Generated from `component-contracts.json` + `registry.json`, so it cannot drift.
 */
function registryRoster() {
  const rows = getRegistryRoster();
  const section = (kind: RosterEntry["kind"], heading: string) => {
    const entries = rows.filter((row) => row.kind === kind);
    if (entries.length === 0) return "";
    return `### ${heading} (${entries.length})\n\n${entries
      .map(
        (row) =>
          `- [${row.title}](${row.docsRoute}) \`${row.name}\` — ${row.summary} Install: \`${row.install}\``,
      )
      .join("\n")}\n`;
  };
  return `## Registry items

Every item the private registry serves. Installing needs the registry setup in
[Install From VegaStack Registry](/docs/install). The full markdown for any page below is that page's
URL with \`.md\` appended; \`/llms-full.txt\` is every page at once.

${section("component", "Components")}
${section("hook", "Hooks")}
${section("block", "Blocks")}`;
}

/**
 * The public agent skills, mirrored into `@vegastack/design` and installable into Claude Code or
 * Codex. An agent reading llms.txt should learn that this guidance exists rather than re-deriving
 * the rules from the docs prose.
 */
function skillRoster() {
  return `## Agent skills

Consumer-facing skills shipped in \`@vegastack/design\`; see [Agent skills](/docs/guides/agent-skills)
for the install command.

${getPublicSkills()
  .map((skill) => `- \`${skill.name}\` — ${skill.description}`)
  .join("\n")}
`;
}

export function GET() {
  return new Response(
    [
      llms(source).index(),
      DESIGN_CONTRACT,
      registryRoster(),
      skillRoster(),
    ].join("\n\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
