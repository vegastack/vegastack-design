import { defineConfig } from "tsup";

// @vegastack/ui ships ONE entry (src/index.ts) and it is 100% client-only: every module it
// re-exports — the provider (next-themes/Base UI context), the Toaster (Sonner + useTheme), and
// useVegaStackTheme (a React hook) — begins with `'use client'` and uses client-only React APIs.
//
// tsup/esbuild STRIP the `'use client'` directive when they bundle (the emitted dist/index.js starts
// with imports/comments), which breaks Next App Router consumers: importing `VegaStackProvider` from a
// server `app/layout.tsx` requires the directive at the TOP of the module. We restore it with a banner.
//
// SAFE as a blanket banner precisely because the entry is all-client — there are no server-safe utils
// in this entry to over-mark. (If a server-safe export is ever added here, switch to per-module
// directive preservation, e.g. esbuild-plugin-preserve-directives, instead of this blanket banner.)
// tooling/verify-ui-use-client.mjs fails the build if the directive is ever missing from the output.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  external: ["react", "react-dom"],
  banner: { js: "'use client';" },
});
