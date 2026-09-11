/**
 * verify-mdx-manifest — the negative self-tests for the agent-export manifest (DS-01).
 *
 * The gate in `tooling/verify-docs-export.mjs` reads the BUILT markdown, so it can only see a
 * defect that leaves an artefact behind. The three failures fixed here leave none:
 *
 *   1. an MDX component the stringifier does not know rendered to a single space;
 *   2. a placeholder whose runtime renderer is missing rendered to its bare children;
 *   3. a component registered in the MDX map but absent from the manifest did both.
 *
 * Each must now THROW. These assertions prove it by execution, on the real modules, rather than by
 * reading the code — and they are the reason the manifest is not just documentation.
 *
 *   pnpm --filter @vegastack/docs verify:mdx-manifest
 */
import { stringifyMdxForAgents } from "../lib/mdx-markdown";
import {
  RUNTIME_PLACEHOLDERS,
  assertKnownPlaceholders,
  assertMdxMapMatchesManifest,
  classifyMdxElement,
  placeholderNames,
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

/** A minimal mdast JSX element, shaped as `remarkLLMs` hands one to the stringifier. */
function jsxElement(name: string) {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: [],
    children: [],
  } as never;
}

const state = {
  containerFlow: () => "",
  containerPhrasing: () => "",
} as never;

console.log("verify-mdx-manifest:");

expectThrows(
  "an unknown MDX component throws in the stringifier instead of rendering a space",
  () =>
    stringifyMdxForAgents(
      jsxElement("BrandNewWidget"),
      undefined as never,
      state,
      {} as never,
      // `ctx` — the fifth parameter of fumadocs' `stringify`; unused by this stringifier.
      undefined as never,
    ),
);

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
    ["ButtonPlayground", "playground"],
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

expectThrows(
  "a placeholder with no renderer throws instead of degrading to its children",
  () =>
    assertKnownPlaceholders(
      `\0${JSON.stringify({ name: "BrandNewWidget", attributes: {}, children: "body" })}\0`,
      new Set(RUNTIME_PLACEHOLDERS),
    ),
);

expectThrows(
  "an unparseable placeholder throws instead of re-emitting its raw match",
  () => assertKnownPlaceholders("\0not json\0", new Set(RUNTIME_PLACEHOLDERS)),
);

expectThrows("a NESTED unrenderable placeholder throws too", () =>
  assertKnownPlaceholders(
    `\0${JSON.stringify({
      name: "ComponentPreview",
      attributes: {},
      children: `\0${JSON.stringify({ name: "Nope", attributes: {}, children: "" })}\0`,
    })}\0`,
    new Set(RUNTIME_PLACEHOLDERS),
  ),
);

check("a known placeholder is accepted, nested ones included", () => {
  assertKnownPlaceholders(
    `\0${JSON.stringify({
      name: "ApiTable",
      attributes: { path: "x", name: "Y" },
      children: `\0${JSON.stringify({ name: "Anatomy", attributes: {}, children: "" })}\0`,
    })}\0`,
    new Set(RUNTIME_PLACEHOLDERS),
  );
  const names = placeholderNames(
    `\0${JSON.stringify({ name: "ApiTable", attributes: {}, children: "" })}\0`,
  );
  if (names.length !== 1 || names[0] !== "ApiTable") {
    throw new Error(`placeholderNames returned ${JSON.stringify(names)}`);
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
  "✓ verify-mdx-manifest: unknown components, unrenderable placeholders (nested included) and map/manifest drift all fail closed",
);
