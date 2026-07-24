# detail/03 — Fumadocs Showcase (verbatim)

> Historical implementation plan. Its Fumadocs showcase decisions remain useful, but current
> metadata, Markdown-route, and access behavior is defined by
> [`../public-docs-cutover.md`](../public-docs-cutover.md).

Verified 2026-06-21 against the cloned `references/fumadocs` (its `packages/*` ARE the published npm sources; `apps/docs/content/**` mirrors fumadocs.dev). Cited repo paths per item.

> **Corrections that matter:** (1) `fumadocs-ui` source = `packages/radix-ui` (Radix-internal, `fd-*`/`--color-fd-*` namespaced — coexists cleanly with our Base UI showcased components). (2) Fumadocs ships **no** built-in `<ComponentPreview>` toggle — we author it (§4) over the `preview:` frontmatter registry. (3) Next **16.x.x**, React **^19.2**, Node **>= 24.14**, Tailwind **^4.3.1**, TS **^6** are hard peers for fumadocs v16.10.5.

## 1. Install

```bash
pnpm add fumadocs-ui@16.10.5 fumadocs-core@16.10.5 fumadocs-mdx@15.0.12 \
  fumadocs-typescript@5.2.6 fumadocs-twoslash@3.2.0 twoslash \
  next@16.2.9 react@^19.2.7 react-dom@^19.2.7 lucide-react@^1.20.0 @orama/orama@^3.1.18

pnpm add -D @tailwindcss/postcss@^4.3.1 tailwindcss@^4.3.1 postcss@^8.5.15 \
  @types/mdx@^2.0.14 @types/react@^19.2.17 @types/react-dom@^19.2.3 \
  @types/node@^25.9.3 typescript@^6.0.3 serve@^14.2.6
```

## 2. Scaffold

```bash
npx create-fumadocs-app@16.0.126 apps/docs \
  --template +next+fuma-docs-mdx+static \
  --search orama --pm pnpm --no-git
```

> `--src` is a value-less boolean flag in `create-fumadocs-app`; **do not pass `--src false`** (Codex F8). Omitting it gives the no-`src/` layout (the default this plan assumes).
> Use the `+static` template (we deploy static to Cloudflare). Resulting tree (canonical preview example = `examples/next-shadcn`):

```
apps/docs/
├── app/
│   ├── (docs)/[[...slug]]/page.tsx
│   ├── (docs)/layout.tsx
│   ├── api/search/route.ts
│   ├── llms.txt/route.ts
│   ├── llms-full.txt/route.ts
│   ├── llms.mdx/docs/[[...slug]]/route.ts
│   ├── global.css
│   └── layout.tsx
├── components/ { mdx.tsx, component-preview.tsx, props-table.tsx, do-dont.tsx, preview/ , search.tsx, provider.tsx }
├── content/docs/ { foundations/, components/ }
├── lib/ { source.ts, layout.shared.tsx, cn.ts }
├── next.config.mjs · postcss.config.mjs · source.config.ts · tsconfig.json · wrangler.jsonc · package.json
```

## 3. Config files (verbatim — `examples/next-shadcn/*`, extended where noted)

`source.config.ts` (with `preview` frontmatter + processed markdown for llms + AutoTypeTable remark):

```ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";
import { pageSchema, metaSchema } from "fumadocs-core/source/schema";
import {
  remarkAutoTypeTable,
  createGenerator,
  createFileSystemGeneratorCache,
} from "fumadocs-typescript";
import { transformerTwoslash } from "fumadocs-twoslash";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";

const generator = createGenerator({
  cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema.extend({ preview: z.string().optional() }),
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    rehypeCodeOptions: {
      themes: { light: "github-light", dark: "github-dark" },
      langs: ["js", "jsx", "ts", "tsx", "css", "bash"],
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash(),
      ],
    },
  },
});
```

`next.config.mjs` (static export + twoslash externalized):

```js
import { createMDX } from "fumadocs-mdx/next";
const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  reactStrictMode: true,
  serverExternalPackages: ["typescript", "twoslash"],
};
export default withMDX(config);
```

`lib/source.ts`:

```ts
import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

export const source = loader({ baseUrl: "/", source: docs.toFumadocsSource() });

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const processed = await page.data.getText("processed");
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}

// Codex F7: defined HERE (no separate @/lib/source-urls module). The route appends a "content.md"
// marker that its GET strips via slug.slice(0, -1).
export function getPageMarkdownUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "content.md"];
  return { url: `/llms.mdx/docs/${segments.join("/")}`, segments };
}
```

`lib/layout.shared.tsx`:

```tsx
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
export function baseOptions(): BaseLayoutProps {
  return { nav: { title: "VegaStack Design" } };
}
```

`app/(docs)/layout.tsx`:

```tsx
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
```

`app/(docs)/[[...slug]]/page.tsx` (renders the `preview` above the MDX body):

```tsx
import { source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { createRelativeLink } from "fumadocs-ui/mdx";
import * as Preview from "@/components/preview";
import type { Metadata } from "next";

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const PreviewComp =
    page.data.preview && page.data.preview in Preview
      ? Preview[page.data.preview as keyof typeof Preview]
      : null;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {PreviewComp ? <PreviewComp /> : null}
        <MDX
          components={getMDXComponents({ a: createRelativeLink(source, page) })}
        />
      </DocsBody>
    </DocsPage>
  );
}
export async function generateStaticParams() {
  return source.generateParams();
}
export async function generateMetadata(
  props: PageProps<"/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
```

`app/layout.tsx` (uses our `Provider` from §7 for static search):

```tsx
import "./global.css";
import { Provider } from "@/components/provider";
export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

`postcss.config.mjs`:

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

`tsconfig.json` paths (the `collections/*` → `.source/*` alias is required by `lib/source.ts`):

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"], "collections/*": ["./.source/*"] },
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "plugins": [{ "name": "next" }]
  }
}
```

`package.json` scripts:

```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "serve out",
    "types:check": "fumadocs-mdx && next typegen && tsc --noEmit"
  }
}
```

## 4. The `ComponentPreview` (Preview ⇄ Code) — site-authored

`components/preview/wrapper.tsx` (`apps/docs/components/preview/wrapper.tsx`):

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
export function Wrapper(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-lg border border-fd-border p-6 not-prose flex items-center justify-center",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
```

`components/preview/index.tsx` (one named export per showcased example — the live preview):

```tsx
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button"; // copied INTO apps/docs via `shadcn add @vegastack/button` at docs setup (Codex F6) → auto-scanned, no @source needed

export function button(): ReactNode {
  return (
    <Wrapper>
      <Button>Save</Button>
    </Wrapper>
  );
}
// ...one export per component example
```

`components/component-preview.tsx` (the Preview⇄Code toggle = `<Tabs>` wrapping the live preview + the source code block). Source code is read at build by a small loader; for v1, pass `code` explicitly or load from the file:

```tsx
import { Tabs, Tab } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import * as Preview from "./preview";
import { readFileSync } from "node:fs";
import { highlight } from "fumadocs-core/highlight";

export async function ComponentPreview({
  name,
  file,
}: {
  name: string;
  file: string;
}) {
  const Comp = Preview[name as keyof typeof Preview] as () => React.ReactNode;
  const source = readFileSync(file, "utf8");
  const rendered = await highlight(source, {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    components: { pre: Pre },
  });
  return (
    <Tabs items={["Preview", "Code"]}>
      <Tab value="Preview">
        <Comp />
      </Tab>
      <Tab value="Code">
        <CodeBlock>{rendered}</CodeBlock>
      </Tab>
    </Tabs>
  );
}
```

- This runs at **build time** (FS read) → compatible with `output: 'export'` (DL7/DL8).
- Alternatively use the frontmatter `preview:` field alone (page renders the live preview above the body; the MDX body holds the code fence) — the lightest path, exactly how fumadocs.dev does it. The `<Tabs>` toggle above is the shadcn-style upgrade.
- For an **editable** code demo use `DynamicCodeBlock` from `fumadocs-ui/components/dynamic-codeblock` (client).
  Source: `references/fumadocs/apps/docs/components/preview/*`, `.../content/docs/ui/components/accordion.mdx`.

## 5. Props table (`AutoTypeTable`)

Register in `components/mdx.tsx` (§10). RSC component reads the filesystem at build (compatible with export). MDX:

```mdx
<AutoTypeTable
  path="../../packages/ui/src/components/button/button.tsx"
  name="ButtonProps"
/>
```

JSDoc tags consumed: prop description, `@default`, `@param`/`@returns`, `@internal` (hides), `@remarks` `X`, `@fumadocsType` `X`, `@fumadocsHref #anchor`. The remark-plugin variant `<auto-type-table path="./props.ts" name="ButtonProps" />` (lowercase, path relative to the MDX file) is wired in `source.config.ts` §3. Authoring rule: export a named `interface`/`type` matching `name`, one `/** */` per prop, `@default` on every prop with a runtime default.
Source: `apps/docs/content/docs/ui/components/auto-type-table.mdx`.

## 6. Shiki + Twoslash

Shiki is built in (`source.config.ts` §3 `rehypeCodeOptions.themes`). Twoslash: install `fumadocs-twoslash@3.2.0 twoslash` (done §1), externalize in `next.config.mjs` (§3 `serverExternalPackages`), add the transformer + `langs` (§3), add CSS `@import 'fumadocs-twoslash/twoslash.css';` to `global.css` (§9), register `import * as Twoslash from 'fumadocs-twoslash/ui'` into MDX components (§10). Use ` ```ts twoslash `.
Source: `apps/docs/content/docs/(framework)/markdown/twoslash.mdx`.

## 7. Static search (Orama) — required for `output:'export'`

`app/api/search/route.ts`:

```ts
import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source, {
  language: "english",
});
```

`components/search.tsx` (browser-side search dialog):

```tsx
"use client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsSearch } from "fumadocs-core/search/client";
import { oramaStaticClient } from "fumadocs-core/search/client/orama-static";
import { create } from "@orama/orama";
import { useI18n } from "fumadocs-ui/contexts/i18n";

function initOrama() {
  return create({ schema: { _: "string" }, language: "english" });
}

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({
    client: oramaStaticClient({ initOrama, locale }),
  });
  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== "empty" ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  );
}
```

`components/provider.tsx`:

```tsx
"use client";
import SearchDialog from "@/components/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
export function Provider({ children }: { children: ReactNode }) {
  return <RootProvider search={{ SearchDialog }}>{children}</RootProvider>;
}
```

Source: `references/fumadocs/examples/next-static/{app/api/search/route.ts,components/search.tsx,components/provider.tsx}`.

## 8. llms.txt (static-compatible)

`app/llms.txt/route.ts`:

```ts
import { source } from "@/lib/source";
import { llms } from "fumadocs-core/source";
export const revalidate = false;
export function GET() {
  return new Response(llms(source).index());
}
```

`app/llms-full.txt/route.ts`:

```ts
import { getLLMText, source } from "@/lib/source";
export const revalidate = false;
export async function GET() {
  const scanned = await Promise.all(source.getPages().map(getLLMText));
  return new Response(scanned.join("\n\n"));
}
```

`app/llms.mdx/docs/[[...slug]]/route.ts` (per-page markdown; has `generateStaticParams` so it survives export):

```ts
import { getLLMText, getPageMarkdownUrl, source } from "@/lib/source"; // Codex F7: helper lives in lib/source.ts
import { notFound } from "next/navigation";
export const revalidate = false;
export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">,
) {
  const { slug } = await params;
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();
  return new Response(await getLLMText(page), {
    headers: { "Content-Type": "text/markdown" },
  });
}
export function generateStaticParams() {
  return source
    .getPages()
    .map((page) => ({ slug: getPageMarkdownUrl(page).segments }));
}
```

> `Accept`-header content negotiation (`proxy.ts`) does NOT work under static export — rely on explicit `.md` URLs. Source: `examples/next-static/app/{llms.txt,llms-full.txt,llms.mdx/...}/route.ts`.

## 9. `global.css` (Fumadocs + our tokens)

```css
@import "tailwindcss";
@import "fumadocs-ui/css/shadcn.css"; /* maps shadcn --background/--foreground onto --color-fd-* */
@import "fumadocs-ui/css/preset.css";
@import "@vegastack/tokens/theme.css"; /* our tokens (after preset so they can remap fd vars) */
@import "tw-animate-css";
@import "fumadocs-twoslash/twoslash.css";

@custom-variant dark (&:where(.dark, .dark *));

/* OPTIONAL — ONLY if previews import WORKSPACE ui source (not copied-in). Path is relative to THIS
   file (apps/docs/app/global.css); repo-root packages/ui needs THREE "../" (Codex F6). If components
   are copied into apps/docs via `shadcn add`, omit this — Tailwind auto-scans apps/docs. */
@source '../../../packages/ui/src/**/*.{ts,tsx}';

html {
  scrollbar-gutter: stable;
}
html > body[data-scroll-locked] {
  margin-right: 0px !important;
  --removed-body-scroll-bar-size: 0px !important;
}
```

- NO `tailwind.config.js`. Fumadocs internals are `fd-`/`--color-fd-*` namespaced → no collision with our tokens.
- `@vegastack/tokens` must expose a CSS entry (`exports["./theme.css"]`, detail/01 §4) for `@import '@vegastack/tokens/theme.css'` to resolve.
  Source: `examples/next-shadcn/app/global.css`, `packages/radix-ui/css/{preset.css,shadcn.css}`.

## 10. Register MDX components

`components/mdx.tsx`:

```tsx
import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import { AutoTypeTable, type AutoTypeTableProps } from "fumadocs-typescript/ui";
import {
  createGenerator,
  createFileSystemGeneratorCache,
} from "fumadocs-typescript";
import * as Twoslash from "fumadocs-twoslash/ui";
import type { MDXComponents } from "mdx/types";
import { ComponentPreview } from "@/components/component-preview";
import { DoDont } from "@/components/do-dont";

const generator = createGenerator({
  cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...Twoslash,
    TypeTable,
    AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
    ComponentPreview,
    DoDont,
    ...components,
  } satisfies MDXComponents;
}
export const useMDXComponents = getMDXComponents;
declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
```

MDX usage (no per-file import needed): `<ComponentPreview name="button" file="..." />`, `<AutoTypeTable path="..." name="ButtonProps" />`, `<DoDont do="Use tokens" dont="Hardcode hex" />`.
`DoDont` is authored by us (two-column, uses `--color-fd-*`).
Source: `apps/docs/components/mdx.tsx`.

## 11. Per-component MDX template (the §7.3 sections)

````mdx
---
title: Button
description: Trigger an action.
preview: button
---

## Installation

\```bash
pnpm dlx shadcn@latest add @vegastack/button
\```

## Usage

\```tsx
import { Button } from '@/components/ui/button';

<Button>Save</Button>
\```

## Examples

<ComponentPreview name="buttonVariants" file="..." />

## API Reference

<AutoTypeTable
  path="../../packages/ui/src/components/button/button.tsx"
  name="ButtonProps"
/>

## Accessibility

... keyboard table ...

## Do / Don't

<DoDont do="..." dont="..." />
````

## Flags

- `create-fumadocs-app` is `16.0.126` (independent version line from core/ui `16.10.5`).
- `@fumadocs/tailwind@0.0.5` is transitive via `fumadocs-ui` — do NOT install directly.
- Static export breaks: dynamic API routes/server actions, on-demand `next/og`, ISR. All our routes use `revalidate=false`/`generateStaticParams` → compatible.
