/**
 * Build-time link validation (fumadocs "Validate Links" integration, `next-validate-link`).
 *
 * Bootstrap: registers the fumadocs-mdx Node runtime loader FIRST (the `.source` entry imports
 * `.mdx` files directly, which plain Node/tsx can't parse), then dynamically imports the real
 * check so the loader hook is active for every transitive import.
 *
 * Run: `pnpm --filter @vegastack/docs lint:links` (fail-closed; wired into the package lint).
 */
import { register } from 'fumadocs-mdx/node';

register();

await import('./lint-links-impl');
