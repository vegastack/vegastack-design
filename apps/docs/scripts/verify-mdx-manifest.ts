/**
 * verify-mdx-manifest — the negative self-tests for the agent-export manifest (DS-01).
 *
 * The gate in `tooling/verify-docs-export.mjs` reads the BUILT markdown, so it can only see a
 * defect that leaves an artefact behind. These failures leave none, so each must THROW:
 *
 *   1. an MDX element the manifest does not classify reaching the compile-time filter;
 *   2. an element name with no markdown form reaching the runtime renderer (fumadocs would
 *      serialise it as JSX text);
 *   3. a component registered in the MDX map but absent from the manifest, or the reverse;
 *   4. a manifest name without a markdown form, or a markdown form for an unlisted name.
 *
 *   pnpm --filter @vegastack/docs verify:mdx-manifest
 */
import { filterMdxElementForAgents } from "../lib/mdx-markdown";
import {
  agentMarkdownComponents,
  agentMarkdownCoverageProblems,
} from "../lib/markdown-export";
import {
  assertMdxMapMatchesManifest,
  classifyMdxElement,
} from "../lib/mdx-manifest";

let failures = 0;

function check(label: string, assertion: () => void) {
  try {
    assertion();
    console.log(`  ✓ ${label}`);
  } catch (error) {
    failures++;
    console.error(`  ✗ ${label}: ${(error as Error).message}`);
  }
}

function expectThrows(label: string, run: () => unknown) {
  check(label, () => {
    let threw = false;
    try {
      run();
    } catch {
      threw = true;
    }
    if (!threw) throw new Error("did not throw");
  });
}

/** A minimal mdast JSX element, shaped as `remarkLLMs` hands one to the filter. */
function jsxElement(name: string) {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: [],
    children: [],
  } as never;
}

console.log("verify-mdx-manifest:");

expectThrows("an unknown MDX element throws in the compile-time filter", () =>
  filterMdxElementForAgents(jsxElement("BrandNewWidget")),
);

expectThrows(
  "an unknown custom element throws in the compile-time filter",
  () => filterMdxElementForAgents(jsxElement("api-table")),
);

check(
  "the filter keeps components, unwraps HTML and drops the Story explorer",
  () => {
    const expected: [string, unknown][] = [
      ["Callout", true],
      ["ComponentPreview", true],
      ["kbd", "children-only"],
      ["story.WithControl", false],
    ];
    for (const [name, value] of expected) {
      const actual = filterMdxElementForAgents(jsxElement(name));
      if (actual !== value) {
        throw new Error(
          `${name} filtered as ${String(actual)}, expected ${String(value)}`,
        );
      }
    }
  },
);

expectThrows("an unknown name throws in the runtime renderer", () =>
  Reflect.get(agentMarkdownComponents, "BrandNewWidget"),
);

check("every manifest name has exactly one markdown form", () => {
  const problems = agentMarkdownCoverageProblems();
  if (problems.length > 0) throw new Error(problems.join("; "));
});

check("a missing or unlisted markdown form is reported", () => {
  if (agentMarkdownCoverageProblems([]).length === 0)
    throw new Error("an empty map was accepted");
  if (
    !agentMarkdownCoverageProblems([
      ...Object.keys(agentMarkdownComponents),
      "BrandNewWidget",
    ]).some((problem) => problem.includes("BrandNewWidget"))
  )
    throw new Error("an unlisted markdown form was accepted");
});

check("an unknown name is unclassified", () => {
  if (classifyMdxElement("BrandNewWidget") !== undefined) {
    throw new Error("BrandNewWidget was classified");
  }
  if (classifyMdxElement("api-table") !== undefined) {
    throw new Error("the custom element `api-table` was classified");
  }
});

check("the known kinds still classify", () => {
  const expected: [string, string][] = [
    ["ComponentPreview", "runtime-placeholder"],
    ["ColorPalette", "browser-only"],
    ["InputPlayground", "playground"],
    ["story.WithControl", "story-explorer"],
    ["Callout", "rendered"],
    ["StoryExplorer", "structural-wrapper"],
    ["kbd", "html"],
  ];
  for (const [name, kind] of expected) {
    const actual = classifyMdxElement(name);
    if (actual !== kind) {
      throw new Error(`${name} classified as ${actual}, expected ${kind}`);
    }
  }
});

expectThrows("a map key absent from the manifest throws", () =>
  assertMdxMapMatchesManifest(["BrandNewWidget"]),
);

expectThrows("a manifest name absent from the map throws", () =>
  assertMdxMapMatchesManifest([]),
);

if (failures > 0) {
  console.error(`✗ verify-mdx-manifest: ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log(
  "✓ verify-mdx-manifest: unknown elements (compile time and runtime), missing markdown forms and map/manifest drift all fail closed",
);
