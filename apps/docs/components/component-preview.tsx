import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { highlight } from "fumadocs-core/highlight";
import { readFileSync, existsSync } from "node:fs";
import * as Preview from "./preview";
import { CopyPromptButton } from "./copy-prompt";
import {
  PreviewControlsProvider,
  FrameWidthToggle,
  FullscreenToggle,
  PreviewFrameContainer,
} from "./preview-controls";

// Only `components/preview/<name>.tsx` demos map 1:1 onto a registry item (`file` can also point
// at a block page or a shared non-component demo file — `dashboard-01`, `utilities`, `wrapper` —
// which have no `shadcn add` target). Gate on BOTH the naming convention and the registry item
// actually existing, so "Copy Prompt" only ever appears where an install command is real.
const PREVIEW_FILE_PATTERN = /^components\/preview\/([\w-]+)\.tsx$/;

function getRegistryComponentName(file?: string): string | undefined {
  if (!file) return undefined;
  const match = PREVIEW_FILE_PATTERN.exec(file);
  if (!match) return undefined;
  const [, name] = match;
  // Resolved relative to `apps/docs` (this file's own `readFileSync(file, …)` below proves that
  // cwd — `file="../../packages/ui/registry/blocks/dashboard-01/page.tsx"` elsewhere in the repo
  // already round-trips through it).
  return existsSync(`../../packages/ui/registry/ui/${name}.tsx`)
    ? name
    : undefined;
}

/**
 * `<ComponentPreview name="buttonVariants" file="components/preview/index.tsx" />`
 * — Preview ⇄ Code toggle. Renders the live example (from ./preview) above the
 * highlighted source, read from disk at build time (compatible with output:'export').
 *
 * The `Tabs` `label` slot carries a toolbar (docs-infra Phase D): a responsive-frame width
 * toggle (always) and a "Copy Prompt" button (only when `file` resolves to a real registry
 * component — see {@link getRegistryComponentName}). Both live in `PreviewControlsProvider` so
 * the width toggle and the frame it drives — separate subtrees of the same `<Tabs>` — share
 * state. This renders once per `<ComponentPreview>` call, so a page with several previews of the
 * same component (e.g. Button's Variants/Sizes/States/Matrix) shows the toolbar that many times —
 * page.tsx-level placement (once per page, next to the existing "Copy Markdown" button) is out of
 * scope here (`apps/docs/app/**` is owned by another phase).
 */
export async function ComponentPreview({
  name,
  file,
}: {
  name: string;
  file?: string;
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
    const source = readFileSync(file, "utf8");
    codeNode = await highlight(source, {
      lang: "tsx",
      themes: { light: "github-light", dark: "github-dark" },
      components: { pre: Pre },
    });
  }

  const componentName = getRegistryComponentName(file);
  const toolbar = (
    <div className="flex items-center gap-2">
      <FrameWidthToggle />
      <FullscreenToggle />
      {componentName ? (
        <CopyPromptButton componentName={componentName} />
      ) : null}
    </div>
  );

  return (
    <PreviewControlsProvider>
      <Tabs items={file ? ["Preview", "Code"] : ["Preview"]} label={toolbar}>
        <Tab value="Preview">
          {/* Product type-scale scope (T1/CX-6): demos render on the product ladder while the
              surrounding docs shell stays on the doc ladder. Portaled popups re-enter via
              [data-base-ui-portal] in global.css. */}
          <div className="vs-type-product" data-vrt-preview={name}>
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
