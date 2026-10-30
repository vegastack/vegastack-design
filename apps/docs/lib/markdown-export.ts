import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { asMarkdown, md } from "fumadocs-core/server";
import type { MDXComponents } from "mdx/types";
import { getApiDocs, noOwnPropsSentence } from "@/lib/api-table";
import { readFixtureSource } from "@/lib/fixture-source";
import { lookupDataAttributes } from "@/components/api-table";
import {
  getInstallSteps,
  getAnatomy,
  getStatesTested,
} from "@/lib/generated-sections";
import {
  BROWSER_ONLY_NOTES,
  PLAYGROUND_COMPONENTS,
  RENDERED_ELEMENTS,
  RUNTIME_PLACEHOLDERS,
  STRUCTURAL_WRAPPERS,
  unknownElementError,
} from "@/lib/mdx-manifest";

/**
 * Runtime half of the agent export (DS-01). `remarkLLMs` runs with `output: "function"`
 * (`source.config.ts`), so `getText("processed", { components })` renders the page's MDX elements
 * through `renderToMarkdown`; this module is that `components` map. Elements that read the file
 * system or run the type generator use the SAME data path the React components use —
 * `getApiDocs`, `readFixtureSource`, the contract readers — so the `.md` route, `llms-full.txt` and
 * the HTML page cannot drift apart.
 *
 * Every classified element name in `lib/mdx-manifest.ts` has exactly one entry here (checked at
 * module load), and the map throws on any other name: fumadocs' own fallback would serialise an
 * unknown component as JSX text, a section agents could not use.
 */
type Props = Record<string, unknown> & { children?: ReactNode };

type MarkdownComponent = (props: Props) => string | Promise<string>;

/** A markdown component: opts into `renderToMarkdown` and returns its markdown. */
function markdown(render: MarkdownComponent): MarkdownComponent {
  return (props) => {
    asMarkdown();
    return render(props);
  };
}

/** Block-level markdown, padded so it never glues onto the line around the element. */
function block(text: string) {
  return text.trim() ? `\n${text.trim()}\n\n` : "";
}

async function childrenText(props: Props) {
  return (await md`${props.children}`).trim();
}

/** The children of one element type, e.g. the `<Step>`s of a `<Steps>`. */
function childrenOfType(children: ReactNode, type: MarkdownComponent) {
  return Children.toArray(children).filter(
    (child): child is ReactElement<Props> =>
      isValidElement(child) && child.type === type,
  );
}

function indentLines(text: string, prefix: string) {
  return text
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : line))
    .join("\n");
}

function attr(props: Props, name: string): string | undefined {
  const value = props[name];
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

function componentPreviewMarkdown(props: Props) {
  const name = attr(props, "name");
  const file = attr(props, "file");
  if (!name) throw new Error("ComponentPreview without a name");
  if (!file) {
    return `_Live preview \`${name}\` — browser only (a hero fixture without a Code tab)._`;
  }
  return `Example \`${name}\`:\n\n${fence("tsx", readFixtureSource(file, name))}`;
}

/**
 * `<TypeTable type={{ prop: { type, description, default } }} />` — the attribute is an object
 * literal authored in this repo's own MDX, rendered into the same flat table shape `ApiTable` uses.
 */
export function typeTableMarkdown(
  table: Record<
    string,
    {
      type?: string;
      description?: string;
      default?: string;
      required?: boolean;
    }
  >,
): string {
  const rows = Object.entries(table).map(
    ([name, entry]) =>
      `| \`${name}${entry.required ? "" : "?"}\` | \`${entry.type ?? "—"}\` | ${
        entry.default ? `\`${entry.default}\`` : "—"
      } | ${String(entry.description ?? "")
        .replace(/\n+/g, " ")
        .trim()} |`,
  );
  if (rows.length === 0) throw new Error("TypeTable: empty `type` object");
  return [
    "| Prop | Type | Default | Description |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

export const REGISTRY_NOTICE_MARKDOWN =
  "> **Registry setup required.** Run the install command only after configuring the Base UI shadcn project, the `@vegastack` registry namespace, and the Cloudflare Access service-token headers described in [Install from the VegaStack registry](/docs/install).";

export function doDontMarkdown(doText: string, dontText: string) {
  return `**Do** — ${doText}\n\n**Don't** — ${dontText}`;
}

const childrenOnly = markdown(async (props) => {
  const text = await md`${props.children}`;
  return text;
});

const Step = childrenOnly;
const Tab = childrenOnly;
const CodeBlockTab = childrenOnly;
const Folder = markdown(async (props) => {
  const body = await childrenText(props);
  return `- ${attr(props, "name") ?? ""}/\n${indentLines(body, "  ")}\n`;
});
const File = markdown((props) => `- ${attr(props, "name") ?? ""}\n`);

const PLAYGROUND_NOTE =
  "_Interactive playground — browser only. The prop surface is in the API Reference below._";
const STORY_NOTE =
  "_Story explorer — browser only. Every prop is listed in the API Reference below._";

const OWN_COMPONENTS: Record<string, MarkdownComponent> = {
  // Runtime data: the file system and the type generator.
  ComponentPreview: markdown((props) => block(componentPreviewMarkdown(props))),
  ApiTable: markdown(async (props) =>
    block(await apiTableMarkdown(attr(props, "path")!, attr(props, "name")!)),
  ),
  InstallSteps: markdown((props) => {
    const steps = getInstallSteps(attr(props, "name")!);
    return block(
      steps
        .map((step, index) => {
          const body = [
            step.text,
            step.command ? fence("bash", step.command) : undefined,
          ]
            .filter(Boolean)
            .join("\n\n");
          return `${index + 1}. ${body.replace(/\n/g, "\n   ")}`;
        })
        .join("\n\n"),
    );
  }),
  Anatomy: markdown((props) => {
    const anatomy = getAnatomy(attr(props, "name")!);
    return block(
      anatomy.parts
        .map(
          (part) =>
            `- \`${part.name}\`${
              part.slots.length > 0
                ? ` — \`data-slot="${part.slots.join('" | "')}"\``
                : ""
            }`,
        )
        .join("\n"),
    );
  }),
  StatesTested: markdown((props) => {
    const states = getStatesTested(attr(props, "name")!);
    return block(
      [
        "| Contract | States tested |",
        "| --- | --- |",
        ...states.map(
          (row) =>
            `| ${row.label} | ${row.values.map((v) => `\`${v}\``).join(", ")} |`,
        ),
      ].join("\n"),
    );
  }),

  // Rendered from attributes and children.
  Callout: markdown(async (props) => {
    const title = attr(props, "title");
    const body = await childrenText(props);
    return block(
      indentLines(title ? `**${title}**\n\n${body}` : body, "> ").replace(
        /^$/gm,
        ">",
      ),
    );
  }),
  Steps: markdown(async (props) => {
    const steps = await Promise.all(
      childrenOfType(props.children, Step).map((step) =>
        childrenText(step.props),
      ),
    );
    return block(
      steps
        .map(
          (body, index) =>
            `${index + 1}. ${indentLines(body, "   ").trimStart()}`,
        )
        .join("\n\n"),
    );
  }),
  Tabs: markdown(async (props) => {
    const tabs = await Promise.all(
      childrenOfType(props.children, Tab).map(
        async (tab) =>
          `**${attr(tab.props, "value") ?? "Tab"}**\n\n${await childrenText(tab.props)}`,
      ),
    );
    return block(tabs.join("\n\n"));
  }),
  // The ```npm fence expands into four package-manager tabs; agents get the one this repo
  // standardises on. `CodeBlockTab` carries the fence as its only child.
  CodeBlockTabs: markdown(async (props) => {
    const tabs = childrenOfType(props.children, CodeBlockTab);
    const chosen =
      tabs.find((tab) => attr(tab.props, "value") === "pnpm") ?? tabs[0];
    return chosen ? block(await childrenText(chosen.props)) : "";
  }),
  CodeBlockTabsList: markdown(() => ""),
  CodeBlockTabsTrigger: markdown(() => ""),
  Files: markdown(async (props) => block(await childrenText(props))),
  Folder,
  File,
  TypeTable: markdown((props) => {
    if (!props.type || typeof props.type !== "object")
      throw new Error("TypeTable without a `type` object");
    return block(typeTableMarkdown(props.type as never));
  }),
  DoDont: markdown((props) =>
    block(doDontMarkdown(attr(props, "do") ?? "", attr(props, "dont") ?? "")),
  ),
  RegistryInstallCallout: markdown(() => block(REGISTRY_NOTICE_MARKDOWN)),
  Mermaid: markdown((props) =>
    block("```mermaid\n" + (attr(props, "source") ?? "").trim() + "\n```"),
  ),

  // Structural wrappers: their children are the content.
  Step,
  Tab,
  CodeBlockTab,
  CalloutTitle: childrenOnly,
  TabsContent: childrenOnly,
  TabsList: childrenOnly,
  TabsTrigger: childrenOnly,
  // The frame around `<story.WithControl />`, which the compile-time filter drops.
  StoryExplorer: markdown(() => block(STORY_NOTE)),

  // Browser-only surfaces: an explicit note, never a silent omission.
  ...Object.fromEntries(
    Object.entries(BROWSER_ONLY_NOTES).map(([name, note]) => [
      name,
      markdown(() => block(note)),
    ]),
  ),
  ...Object.fromEntries(
    [...PLAYGROUND_COMPONENTS].map((name) => [
      name,
      markdown(() => block(PLAYGROUND_NOTE)),
    ]),
  ),
};

/**
 * The manifest and this map must name exactly the same set. Checked at module load, so an element
 * classified in the manifest without a markdown form fails `next build`.
 */
const MANIFEST_NAMES = new Set([
  ...RUNTIME_PLACEHOLDERS,
  ...Object.keys(BROWSER_ONLY_NOTES),
  ...PLAYGROUND_COMPONENTS,
  ...RENDERED_ELEMENTS,
  ...STRUCTURAL_WRAPPERS,
  "StoryExplorer",
]);
export function agentMarkdownCoverageProblems(
  names: Iterable<string> = Object.keys(OWN_COMPONENTS),
) {
  const own = new Set(names);
  return [
    ...[...MANIFEST_NAMES]
      .filter((name) => !own.has(name))
      .map((name) => `no markdown form for ${name}`),
    ...[...own]
      .filter((name) => !MANIFEST_NAMES.has(name))
      .map((name) => `markdown form for unlisted ${name}`),
  ];
}
{
  const problems = agentMarkdownCoverageProblems();
  if (problems.length > 0) {
    throw new Error(
      `lib/markdown-export.ts and lib/mdx-manifest.ts disagree — ${problems.join("; ")}`,
    );
  }
}

/**
 * The `components` for `getText("processed")`. A name outside the map throws instead of becoming
 * fumadocs' JSX-text stub.
 */
export const agentMarkdownComponents: MDXComponents = new Proxy(
  OWN_COMPONENTS,
  {
    get(target, key) {
      if (typeof key !== "string" || key in target)
        return target[key as string];
      throw unknownElementError(key, "the agent-export renderer");
    },
  },
);
