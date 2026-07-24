import { defineConfig } from "tsup";

// Four public entries, one package:
//   .             → cn() + TIMINGS/FLOATING constants (server-safe, no React)
//   ./icons       → Icon / BrandIcon / AnimatedIcon runtime (React 19 peer)
//   ./preset      → Tailwind v4 preset metadata (the real preset is preset.css)
//   ./theme-scope → @internal portal theme plumbing (client-only: module-scope createContext)
//
// theme-scope MUST stay a separate entry. It is a client module, and bundling it into `.`
// would put `React.createContext()` at the module scope of the entry that every server-safe
// component imports `cn` from — `createContext` is `undefined` under the `react-server`
// condition, so those components would throw a TypeError on import in any RSC.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "icons/index": "src/icons/index.tsx",
    preset: "src/preset.ts",
    "theme-scope": "src/theme-scope.tsx",
  },
  format: ["esm", "cjs"],
  dts: true,
  outDir: "dist",
  clean: true,
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
  external: ["react", "react-dom"],
});
