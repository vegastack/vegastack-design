import type { LLMsOptions } from "fumadocs-core/mdx-plugins/remark-llms";
import { replaceSource } from "fumadocs-core/mdx-plugins/stringifier";
import { classifyMdxElement, unknownElementError } from "./mdx-manifest";

/**
 * Compile-time half of the agent export (DS-01). `remarkLLMs` (fumadocs-core 16.17) runs with
 * `output: "function"`: the processed markdown keeps every capitalised MDX element as JSX, and
 * `lib/markdown-export.ts` renders each one to markdown through `renderToMarkdown` when a route
 * calls `getText("processed", { components })`.
 *
 * This filter is the compile-time gate. Every JSX element name is classified by
 * `classifyMdxElement()`, and an unclassified one THROWS here, at build time, so an element the
 * manifest does not know can never reach the export as a silent stub:
 *
 * - **HTML elements** (`<kbd>`, `<br />`) keep only their children — the surrounding markdown
 *   carries the emphasis an agent needs. `remarkLLMs` would otherwise emit lowercase tags verbatim.
 * - **The Story explorer** (`<story.WithControl />`, a namespaced name `remarkLLMs` never turns into
 *   JSX) is dropped; its `<StoryExplorer>` frame renders the browser-only note in its place.
 *   `tooling/verify-docs-export.mjs` proves the explorer always sits inside that frame.
 * - Everything else stays JSX for the runtime renderer.
 *
 * `tooling/verify-docs-export.mjs` is the second line: it fails the build if any `<Capitalised`,
 * namespaced or custom-element tag survives outside a code fence.
 */
export const filterMdxElementForAgents: NonNullable<
  LLMsOptions["filterElement"]
> = (node) => {
  if (node.type !== "mdxJsxFlowElement" && node.type !== "mdxJsxTextElement")
    return true;
  const kind = classifyMdxElement(node.name);
  switch (kind) {
    case undefined:
      throw unknownElementError(node.name ?? "", "the agent-export filter");
    case "fragment":
    case "html":
      return "children-only";
    case "story-explorer":
      return false;
    default:
      return true;
  }
};

type ReplaceFile = Parameters<typeof replaceSource>[0];
type ReplaceNode = Parameters<typeof replaceSource>[1];

/** The few mdast fields these plugins read, kept local so the docs app needs no mdast types. */
interface MdNode {
  type: string;
  name?: string | null;
  lang?: string | null;
  value?: string;
  attributes?: { name?: string; value?: unknown }[];
  children?: MdNode[];
}

interface NpmFence {
  parent: MdNode & { children: MdNode[] };
  index: number;
  node: MdNode;
}

function collectNpmFences(parent: MdNode, found: NpmFence[]) {
  parent.children?.forEach((node, index) => {
    if (
      node.type === "code" &&
      (node.lang === "npm" || node.lang === "package-install")
    )
      found.push({ parent: parent as NpmFence["parent"], index, node });
    else collectNpmFences(node, found);
  });
}

/**
 * The ```npm fence: humans get remark-npm's four package-manager tabs; agents get the pnpm one this
 * repo standardises on, as a ```bash fence. remark-npm (16.17) keeps the authored ```npm fence in
 * the agent markdown, so this pair of plugins wraps it: `before` records each fence and where it
 * sits, `after` reads the pnpm tab remark-npm generated in its place and makes that the fence's
 * markdown (`replaceSource`: the last edit of a node wins).
 */
export function remarkAgentNpmFences() {
  const fences = new WeakMap<object, NpmFence[]>();
  const before = () => (tree: MdNode, file: object) => {
    const found: NpmFence[] = [];
    collectNpmFences(tree, found);
    fences.set(file, found);
  };
  const after = () => (_tree: MdNode, file: ReplaceFile) => {
    for (const { parent, index, node } of fences.get(file) ?? []) {
      const tabs = parent.children[index];
      if (tabs.name !== "CodeBlockTabs")
        throw new Error(
          "remarkAgentNpmFences: remark-npm did not replace an npm fence with CodeBlockTabs",
        );
      const pnpm = tabs.children?.find(
        (tab) =>
          tab.name === "CodeBlockTab" &&
          tab.attributes?.some((a) => a.name === "value" && a.value === "pnpm"),
      );
      const code = pnpm?.children?.[0];
      if (code?.type !== "code")
        throw new Error("remarkAgentNpmFences: no pnpm tab in CodeBlockTabs");
      replaceSource(
        file,
        node as unknown as ReplaceNode,
        "```bash\n" + code.value + "\n```",
      );
    }
  };
  return { before, after };
}
