import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod";
import { metaSchema } from "fumadocs-core/source/schema";
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

// Self-contained shallow frontmatter schema (the fields the showcase actually uses). Extending
// fumadocs' `pageSchema` trips TS2589 ("Type instantiation is excessively deep") under TS 6 + Zod 4
// during `next build`'s typecheck; a flat schema avoids the deep pageSchema type entirely.
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
  preview: z.string().optional(),
});

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: docFrontmatterSchema,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export const internalDocs = defineDocs({
  dir: "content/internal",
  docs: {
    schema: docFrontmatterSchema,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export default defineConfig({
  // Git-derived `lastModified` on every doc — rendered as DocsPage's `lastUpdate` stamp.
  plugins: [lastModified()],
  mdxOptions: {
    remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    rehypeCodeOptions: {
      // Fumadocs v16 defaults to Shiki's JavaScript RegExp engine for runtime portability. This
      // project highlights at build time on Node, where Shiki recommends Oniguruma for maximum
      // TextMate-grammar compatibility. More importantly, the JS engine emitted different TSX token
      // scopes across two identical-tree parallel Next builds (VRT review 2026-07-29). Pinning the
      // engine makes the exported HTML, and therefore visual evidence, reproducible.
      engine: "oniguruma",
      themes: { light: "github-light", dark: "github-dark" },
      langs: ["js", "jsx", "ts", "tsx", "css", "bash"],
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash(),
      ],
    },
  },
});
