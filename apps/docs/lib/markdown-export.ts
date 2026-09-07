import { renderPlaceholder } from "fumadocs-core/mdx-plugins/remark-llms.runtime";
import { getApiDocs, noOwnPropsSentence } from "@/lib/api-table";
import { readFixtureSource } from "@/lib/fixture-source";
import { lookupDataAttributes } from "@/components/api-table";
import {
  getInstallSteps,
  getAnatomy,
  getStatesTested,
} from "@/lib/generated-sections";
import { getComponentChangelog } from "@/lib/changelog";
import {
  RUNTIME_PLACEHOLDERS,
  assertKnownPlaceholders,
} from "@/lib/mdx-manifest";

/**
 * Runtime half of the agent export (DS-01). The compile-time stringifier
 * (`lib/mdx-markdown.ts`) leaves `\0{json}\0` placeholders for the elements that need the file
 * system or the type generator; this module renders them to markdown with the SAME data path the
 * React components use — `getApiDocs`, `readFixtureSource`, the contract readers — so the `.md`
 * route, `llms-full.txt` and the HTML page cannot drift apart.
 */
interface Placeholder {
  name: string | null;
  attributes: Record<string, unknown>;
  children: string;
}

function attr(data: Placeholder, name: string): string | undefined {
  const value = data.attributes[name];
  return typeof value === "string" ? value : undefined;
}

function fence(lang: string, code: string) {
  return `\`\`\`${lang}\n${code.trimEnd()}\n\`\`\``;
}

function cell(text: string) {
  return text.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

export async function apiTableMarkdown(path: string, name: string) {
  const docs = await getApiDocs({ path, name });
  return docs
    .map((doc) => {
      const parts: string[] = [];
      if (doc.entries.length === 0) {
        parts.push(noOwnPropsSentence(doc.part));
      } else {
        parts.push(
          "| Prop | Type | Default | Description |",
          "| --- | --- | --- | --- |",
          ...doc.entries.map(
            (entry) =>
              `| \`${entry.name}${entry.required ? "" : "?"}\` | \`${cell(entry.type)}\` | ${
                entry.defaultValue ? `\`${cell(entry.defaultValue)}\`` : "—"
              } | ${entry.deprecated ? "Deprecated. " : ""}${cell(entry.description)} |`,
          ),
        );
      }
      const dataAttributes = lookupDataAttributes(path, doc.part);
      if (dataAttributes) {
        parts.push(
          "",
          `Data attributes and CSS variables on \`${doc.part}\`:`,
          "",
          "| Attribute | Values |",
          "| --- | --- |",
          ...dataAttributes.attributes.map(
            (attribute) =>
              `| \`${attribute.name}\` | ${
                attribute.values.length > 0
                  ? `\`${attribute.values.map((v) => `"${v}"`).join(" \\| ")}\``
                  : "mirrors a prop or state value"
              } |`,
          ),
          ...dataAttributes.cssVariables.map(
            (variable) => `| \`${variable}\` | CSS custom property |`,
          ),
        );
      }
      return parts.join("\n");
    })
    .join("\n\n");
}

function componentPreviewMarkdown(data: Placeholder) {
  const name = attr(data, "name");
  const file = attr(data, "file");
  if (!name) throw new Error("ComponentPreview placeholder without a name");
  if (!file) {
    return `_Live preview \`${name}\` — browser only (a hero fixture without a Code tab)._`;
  }
  return `Example \`${name}\`:\n\n${fence("tsx", readFixtureSource(file, name))}`;
}

const RENDERERS: Record<
  string,
  (data: Placeholder) => Promise<string> | string
> = {
  ComponentPreview: componentPreviewMarkdown,
  ApiTable: (data) =>
    apiTableMarkdown(attr(data, "path")!, attr(data, "name")!),
  AutoTypeTable: (data) =>
    apiTableMarkdown(attr(data, "path")!, attr(data, "name")!),
  InstallSteps: (data) => {
    const steps = getInstallSteps(attr(data, "name")!);
    return steps
      .map((step, index) => {
        const body = [
          step.text,
          step.command ? fence("bash", step.command) : undefined,
        ]
          .filter(Boolean)
          .join("\n\n");
        return `${index + 1}. ${body.replace(/\n/g, "\n   ")}`;
      })
      .join("\n\n");
  },
  Anatomy: (data) => {
    const anatomy = getAnatomy(attr(data, "name")!);
    return anatomy.parts
      .map(
        (part) =>
          `- \`${part.name}\`${
            part.slots.length > 0
              ? ` — \`data-slot="${part.slots.join('" | "')}"\``
              : ""
          }`,
      )
      .join("\n");
  },
  StatesTested: (data) => {
    const states = getStatesTested(attr(data, "name")!);
    return [
      "| Contract | States tested |",
      "| --- | --- |",
      ...states.map(
        (row) =>
          `| ${row.label} | ${row.values.map((v) => `\`${v}\``).join(", ")} |`,
      ),
    ].join("\n");
  },
  ComponentChangelog: (data) => {
    const entries = getComponentChangelog(attr(data, "name")!);
    if (entries.length === 0)
      return "_No changelog entries name this item yet._";
    return entries
      .map(
        (entry) =>
          `- **${entry.version}** (${entry.date}) — ${entry.section}: ${entry.text}`,
      )
      .join("\n");
  },
};

/**
 * The manifest and the renderer table must name exactly the same set. Checked at module load, so
 * a placeholder added to the manifest without a renderer fails `next build` rather than silently
 * degrading to its children in every `.md` file.
 */
const rendererNames = new Set(Object.keys(RENDERERS));
{
  const missing = [...RUNTIME_PLACEHOLDERS].filter(
    (name) => !rendererNames.has(name),
  );
  const extra = [...rendererNames].filter(
    (name) => !RUNTIME_PLACEHOLDERS.has(name),
  );
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `lib/markdown-export.ts RENDERERS and RUNTIME_PLACEHOLDERS disagree — ` +
        `${missing.length > 0 ? `no renderer for ${missing.join(", ")}; ` : ""}` +
        `${extra.length > 0 ? `renderer for unlisted ${extra.join(", ")}` : ""}`.trim(),
    );
  }
}

/** Resolve every runtime placeholder in processed markdown; unknown names fail the build. */
export async function renderAgentMarkdown(processed: string) {
  assertKnownPlaceholders(processed, rendererNames);
  const rendered = await renderPlaceholder(processed, RENDERERS);
  if (rendered.includes("\0")) {
    throw new Error(
      "Agent markdown still contains an unresolved placeholder — a RUNTIME_PLACEHOLDERS name has no renderer in lib/markdown-export.ts",
    );
  }
  return rendered;
}
