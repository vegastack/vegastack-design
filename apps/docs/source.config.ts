import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod";
import { metaSchema } from "fumadocs-core/source/schema";
import { transformerTwoslash } from "fumadocs-twoslash";
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { remarkNpm } from "fumadocs-core/mdx-plugins";
import {
  filterMdxElementForAgents,
  remarkAgentNpmFences,
} from "./lib/mdx-markdown";
import { PAGE_STATUSES } from "./lib/shared";

/**
 * Frontmatter — canon row 0 (`design.md` § Docs canon). `registry`, `status`, `since` and `a11y`
 * are shape-validated here and are REQUIRED on every component page; `tooling/content-lint.mjs`
 * owns that requirement, because the schema is shared with the guide and foundation collections
 * where the four fields do not apply.
 *
 * Self-contained shallow schema (the fields the showcase actually uses). Extending fumadocs'
 * `pageSchema` trips TS2589 ("Type instantiation is excessively deep") under TS 6 + Zod 4 during
 * `next build`'s typecheck; a flat schema avoids the deep pageSchema type entirely.
 */
const docFrontmatterSchema = z.object({
  title: z.string().min(1).max(70),
  description: z
    .string()
    .min(60)
    .max(160)
    .refine(
      (value) => !/<[^>]+>|&(?:[a-z]+|#\d+);/i.test(value),
      "Descriptions must be plain text without HTML or unresolved entities",
    ),
  audience: z.enum(["public", "internal"]),
  icon: z.string().optional(),
  full: z.boolean().optional(),
  /** Hero fixture — a named export of `components/preview`. */
  preview: z.string().optional(),
  /** Registry item name (`data-grid`), the `shadcn add @vegastack/<registry>` target. */
  registry: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "registry must be a kebab-case item name",
    )
    .optional(),
  status: z.enum(PAGE_STATUSES).optional(),
  /** Design-system version the item first shipped in. */
  since: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "since must be a semver version, e.g. 0.4.0")
    .optional(),
  /** Accessibility pattern name — `APG grid`, `native button`. */
  a11y: z.string().min(1).max(60).optional(),
});

/**
 * Agent export (DS-01): `getText("processed", { components })` behind the per-page `.md` route and
 * `llms-full.txt`. `output: "function"` keeps MDX components as JSX; `lib/markdown-export.ts`
 * supplies their markdown form, and `filterMdxElementForAgents` fails the compile on any element
 * the manifest does not classify.
 */
const includeProcessedMarkdown = {
  output: "function",
  filterElement: filterMdxElementForAgents,
} as const;

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: docFrontmatterSchema,
    postprocess: { includeProcessedMarkdown },
  },
  meta: { schema: metaSchema },
});

export const internalDocs = defineDocs({
  dir: "content/internal",
  docs: {
    schema: docFrontmatterSchema,
    postprocess: { includeProcessedMarkdown },
  },
  meta: { schema: metaSchema },
});

const agentNpmFences = remarkAgentNpmFences();

export default defineConfig({
  // Git-derived `lastModified` on every doc — rendered as DocsPage's `lastUpdate` stamp.
  plugins: [lastModified()],
  mdxOptions: {
    // Around fumadocs' own remark-npm: the agent export shows an ```npm fence as its pnpm command.
    remarkPlugins: (plugins) => {
      const index = plugins.findIndex(
        (plugin) => Array.isArray(plugin) && plugin[0] === remarkNpm,
      );
      if (index === -1)
        throw new Error("source.config.ts: remark-npm is not in the preset");
      return [
        ...plugins.slice(0, index),
        agentNpmFences.before,
        plugins[index],
        agentNpmFences.after,
        ...plugins.slice(index + 1),
      ];
    },
    rehypeCodeOptions: {
      themes: { light: "github-light", dark: "github-dark" },
      langs: ["js", "jsx", "ts", "tsx", "css", "bash"],
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        // Cache twoslash type results on disk (.next/cache), so an unchanged code block is not
        // re-typechecked on every build.
        transformerTwoslash({ typesCache: createFileSystemTypesCache() }),
      ],
    },
  },
});
