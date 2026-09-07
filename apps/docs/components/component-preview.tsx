import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { highlight } from "fumadocs-core/highlight";
import * as Preview from "./preview";
import { readFixtureSource } from "@/lib/fixture-source";
import {
  PreviewControlsProvider,
  FrameWidthToggle,
  FullscreenToggle,
  PreviewFrameContainer,
} from "./preview-controls";

/**
 * `<ComponentPreview name="buttonVariants" file="components/preview/button.tsx" />`
 * — Preview ⇄ Code toggle. Renders the live example (from ./preview) above the highlighted
 * source of THAT fixture — the import block plus the one named function, read from disk at build
 * time through `readFixtureSource` (compatible with output:'export'). The markdown export inlines
 * the identical snippet, so a reader and an agent see the same code (DS-01).
 *
 * The `Tabs` `label` slot carries the per-frame controls: the responsive-frame width toggle and
 * the fullscreen toggle (DD-2). "Copy Prompt" lives once in the page header, not here (DC-04).
 * Without `file` (the frontmatter hero, DC-05) only the "Preview" tab renders, in the same frame
 * as every other example.
 *
 * `hero` suppresses the `data-vrt-preview` key, and that is load-bearing rather than cosmetic.
 * That attribute is the probe key for two lanes, and `contracts.spec.ts` probes
 * `page.locator("[data-vrt-preview]").first()` — ONE fixture per route. Stamping it on the hero
 * would not add coverage; it would silently MOVE the blocking gate from the documented example
 * fixture to the hero, for all 110 routes, as a side effect of a chrome change. Which fixture the
 * lane measures is a decision for `component-contracts.json`, so the hero renders identical chrome
 * and stays out of the probe. Measured: moving it fails timeline, data-grid and text-edit on the
 * 24px target floor — real, previously unmeasured defects, recorded in `docs/ledger/bugs.md`
 * (2026-09-07) with the one-line reproduction, for the component batches to fix.
 */
export async function ComponentPreview({
  name,
  file,
  hero = false,
}: {
  name: string;
  file?: string;
  hero?: boolean;
}) {
  const Comp = Preview[name as keyof typeof Preview] as
    (() => React.ReactNode) | undefined;
  if (!Comp) {
    const available = Object.keys(Preview).sort().join(", ");
    throw new Error(
      `Missing component preview "${name}". Add it to apps/docs/components/preview or fix the MDX preview name. Available previews: ${available}`,
    );
  }

  let codeNode: React.ReactNode = null;
  if (file) {
    codeNode = await highlight(readFixtureSource(file, name), {
      lang: "tsx",
      themes: { light: "github-light", dark: "github-dark" },
      components: { pre: Pre },
    });
  }

  const toolbar = (
    <div className="flex items-center gap-2">
      <FrameWidthToggle />
      <FullscreenToggle />
    </div>
  );

  return (
    <PreviewControlsProvider>
      <Tabs items={file ? ["Preview", "Code"] : ["Preview"]} label={toolbar}>
        <Tab value="Preview">
          {/* Product type-scale scope (T1/CX-6, DC-01): demos render on the product ladder —
              font-size included — while the surrounding docs shell stays on the doc ladder.
              Portaled popups re-enter via [data-base-ui-portal] in global.css. */}
          <div
            className="vs-type-product"
            data-vrt-preview={hero ? undefined : name}
          >
            <PreviewFrameContainer>
              <Comp />
            </PreviewFrameContainer>
          </div>
        </Tab>
        {file ? (
          <Tab value="Code">
            <CodeBlock>{codeNode}</CodeBlock>
          </Tab>
        ) : null}
      </Tabs>
    </PreviewControlsProvider>
  );
}
