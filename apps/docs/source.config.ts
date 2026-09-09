import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod";
import { metaSchema } from "fumadocs-core/source/schema";
import { transformerTwoslash } from "fumadocs-twoslash";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { stringifyMdxForAgents } from "./lib/mdx-markdown";
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
 * Agent export (DS-01): the processed markdown behind `getText("processed")`, the per-page `.md`
 * route and `llms-full.txt`. `stringifyMdxForAgents` renders every MDX component to markdown at
 * compile time or leaves a placeholder for `lib/markdown-export.ts` to resolve at build time.
 */
const includeProcessedMarkdown = { stringify: stringifyMdxForAgents };

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

export default defineConfig({
  // Git-derived `lastModified` on every doc — rendered as DocsPage's `lastUpdate` stamp.
  plugins: [lastModified()],
  mdxOptions: {
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
