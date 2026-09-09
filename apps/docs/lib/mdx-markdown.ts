import type { LLMsOptions } from "fumadocs-core/mdx-plugins/remark-llms";
import {
  BROWSER_ONLY_NOTES,
  RUNTIME_PLACEHOLDERS,
  classifyMdxElement,
  unknownElementError,
} from "./mdx-manifest";

/**
 * Compile-time half of the agent export (DS-01). `remarkLLMs` (fumadocs-core 16.11.5) keeps
 * every MDX JSX element verbatim in the processed markdown; this `stringify` callback decides,
 * per element, what an agent should read instead:
 *
 * - **Rendered here** — elements whose markdown needs nothing but their attributes and
 *   children: `Callout`, `Steps`/`Step`, `Tabs`/`Tab`, `Files`/`Folder`/`File`, `TypeTable`,
 *   `DoDont`, `RegistryInstallCallout`, and the `CodeBlockTabs` the ```npm fence expands into.
 * - **Deferred to runtime** — elements that need the file system or the type generator
 *   (`ComponentPreview`, `ApiTable`, the generated sections). They become the
 *   `\0{json}\0` placeholders `renderPlaceholder()` resolves in `lib/markdown-export.ts`, with
 *   block children stringified as flow (fumadocs' own `placeholder()` uses phrasing, which glues
 *   paragraphs together).
 * - **Browser-only** — playgrounds, the Story explorer, the foundation specimens and the icon
 *   gallery are replaced by an explicit one-line note so the omission is visible, never silent.
 * - **Structural wrappers and HTML elements** — children only, and ONLY for the names
 *   `lib/mdx-manifest.ts` lists as such.
 *
 * There is no catch-all. Every element name is classified by `classifyMdxElement()`, and an
 * unclassified one THROWS at build time: the previous `default: return children || " "` turned an
 * unregistered component into a single space and a placeholder with no runtime renderer into its
 * bare children, both of which the export gate could not see because nothing was left to find.
 *
 * `tooling/verify-docs-export.mjs` is the second line: it fails the build if any `<Capitalised`
 * tag, namespaced (`<story.WithControl />`) or custom-element (`<api-table />`) tag, or `\0`
 * residue survives outside a code fence.
 */
type Stringify = NonNullable<LLMsOptions["stringify"]>;
type Nodes = Parameters<Stringify>[0];
// [1] is the parent node; this stringifier decides per element and never consults it.
type State = Parameters<Stringify>[2];
type Info = Parameters<Stringify>[3];

interface JsxAttribute {
  type: "mdxJsxAttribute" | "mdxJsxExpressionAttribute";
  name?: string;
  value?: string | { type: string; value: string } | null;
}

interface JsxElement {
  type: "mdxJsxFlowElement" | "mdxJsxTextElement";
  name: string | null;
  attributes: JsxAttribute[];
  children: Nodes[];
}

function isJsx(node: Nodes): node is Nodes & JsxElement {
  return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
}

/** String attribute value, or the raw expression source for `attr={…}` (never evaluated here). */
export function attributeValue(
  element: JsxElement,
  name: string,
): string | undefined {
  const attribute = element.attributes.find(
    (candidate) =>
      candidate.type === "mdxJsxAttribute" && candidate.name === name,
  );
  if (!attribute) return undefined;
  if (typeof attribute.value === "string") return attribute.value;
  return attribute.value?.value;
}

function attributesRecord(element: JsxElement) {
  const record: Record<string, string> = {};
  for (const attribute of element.attributes) {
    if (attribute.type !== "mdxJsxAttribute" || !attribute.name) continue;
    const value = attributeValue(element, attribute.name);
    if (value !== undefined) record[attribute.name] = value;
  }
  return record;
}

function childrenMarkdown(element: JsxElement, state: State, info: Info) {
  if (element.type === "mdxJsxTextElement") {
    return state.containerPhrasing(element as never, info);
  }
  return state.containerFlow(element as never, info);
}

function placeholder(element: JsxElement, state: State, info: Info) {
  return `\0${JSON.stringify({
    name: element.name,
    attributes: attributesRecord(element),
    children: childrenMarkdown(element, state, info),
  })}\0`;
}

function indent(text: string, prefix: string) {
  return text
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : line))
    .join("\n");
}

/**
 * `<TypeTable type={{ prop: { type, description, default } }} />` — the attribute is an object
 * literal authored in this repo's own MDX, evaluated at compile time into the same flat table
 * shape `ApiTable` renders. A malformed literal fails the compile, never degrades to JSX text.
 */
export function typeTableMarkdown(expression: string): string {
  const table = new Function(`return (${expression});`)() as Record<
    string,
    {
      type?: string;
      description?: string;
      default?: string;
      required?: boolean;
    }
  >;
  const rows = Object.entries(table).map(
    ([name, entry]) =>
      `| \`${name}${entry.required ? "" : "?"}\` | \`${entry.type ?? "—"}\` | ${
        entry.default ? `\`${entry.default}\`` : "—"
      } | ${(entry.description ?? "").replace(/\n+/g, " ").trim()} |`,
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

export const stringifyMdxForAgents: Stringify = (
  node,
  _parent,
  state,
  info,
) => {
  if (!isJsx(node)) return undefined;
  const element = node as JsxElement;
  const name = element.name ?? "";

  // NOTE: `remarkLLMs` treats an empty string as "no override" and falls back to emitting the JSX
  // verbatim, so every branch below returns non-empty markdown.
  const kind = classifyMdxElement(element.name);
  switch (kind) {
    case undefined:
      throw unknownElementError(name, "the agent-export stringifier");
    case "fragment":
    case "structural-wrapper":
    case "html":
      return nonEmpty(childrenMarkdown(element, state, info));
    case "runtime-placeholder":
      return placeholder(element, state, info);
    case "browser-only":
      return BROWSER_ONLY_NOTES[name];
    case "playground":
      return "_Interactive playground — browser only. The prop surface is in the API Reference below._";
    case "story-explorer":
      // The Story explorer is generated from the same types the API Reference documents.
      return "_Story explorer — browser only. Every prop is listed in the API Reference below._";
    case "rendered":
      break;
  }

  switch (name) {
    case "CodeBlockTabs": {
      // The ```npm fence expands into four package-manager tabs; agents get the one this repo
      // standardises on. `CodeBlockTab` carries the fence as its only child.
      const tabs = element.children.filter(
        (child): child is Nodes & JsxElement =>
          isJsx(child) && child.name === "CodeBlockTab",
      );
      const chosen =
        tabs.find((tab) => attributeValue(tab, "value") === "pnpm") ?? tabs[0];
      return chosen ? nonEmpty(childrenMarkdown(chosen, state, info)) : " ";
    }
    case "CodeBlockTabsList":
    case "CodeBlockTabsTrigger":
      return " ";
    case "Callout": {
      const title = attributeValue(element, "title");
      const body = childrenMarkdown(element, state, info);
      return indent(title ? `**${title}**\n\n${body}` : body, "> ");
    }
    case "Steps": {
      const steps = element.children.filter(
        (child): child is Nodes & JsxElement =>
          isJsx(child) && child.name === "Step",
      );
      return steps
        .map((step, index) => {
          const body = childrenMarkdown(step, state, info);
          return `${index + 1}. ${indent(body, "   ").trimStart()}`;
        })
        .join("\n\n");
    }
    case "Tabs": {
      const tabs = element.children.filter(
        (child): child is Nodes & JsxElement =>
          isJsx(child) && child.name === "Tab",
      );
      return tabs
        .map((tab) => {
          const label = attributeValue(tab, "value") ?? "Tab";
          return `**${label}**\n\n${childrenMarkdown(tab, state, info)}`;
        })
        .join("\n\n");
    }
    case "Files":
      return childrenMarkdown(element, state, info);
    case "Folder": {
      const label = attributeValue(element, "name") ?? "";
      const body = childrenMarkdown(element, state, info);
      return `- ${label}/\n${indent(body, "  ")}`;
    }
    case "File":
      return `- ${attributeValue(element, "name") ?? ""}`;
    case "TypeTable": {
      const expression = attributeValue(element, "type");
      if (!expression) throw new Error("TypeTable without a `type` attribute");
      return typeTableMarkdown(expression);
    }
    case "DoDont":
      return doDontMarkdown(
        attributeValue(element, "do") ?? "",
        attributeValue(element, "dont") ?? "",
      );
    case "RegistryInstallCallout":
      return REGISTRY_NOTICE_MARKDOWN;
    default:
      // Unreachable: `kind === "rendered"` means the manifest lists this name in
      // RENDERED_ELEMENTS, and `verify-docs-export.mjs`'s manifest-coverage check proves every
      // such name has a case here.
      throw unknownElementError(
        name,
        "the agent-export stringifier's rendered branch",
      );
  }
};

/** A falsy return hands the element back to fumadocs, which would emit the JSX verbatim. */
function nonEmpty(markdown: string) {
  return markdown || " ";
}
