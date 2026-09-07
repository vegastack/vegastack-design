import { defineConfig } from "tsup";

// Five public entries, one package:
//   .                      → cn() + TIMINGS/FLOATING constants (server-safe, no React)
//   ./icons                → Icon / BrandIcon / AnimatedIcon runtime (React 19 peer)
//   ./create-animated-icon → the animated-icon factory (React 19 + motion peers)
//   ./preset               → Tailwind v4 preset metadata (the real preset is preset.css)
//   ./theme-scope          → @internal portal theme plumbing (client-only: module-scope createContext)
//
// create-animated-icon MUST stay separate from ./icons. It is the only entry that
// imports `motion`, and ./icons deliberately does not — the AnimatedIcon wrapper
// standardizes size and a11y for an icon that carries Motion itself, so a consumer
// using Icon/BrandIcon must not be forced to install the animation engine.
//
// theme-scope MUST stay a separate entry. It is a client module, and bundling it into `.`
// would put `React.createContext()` at the module scope of the entry that every server-safe
// component imports `cn` from — `createContext` is `undefined` under the `react-server`
// condition, so those components would throw a TypeError on import in any RSC.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "icons/index": "src/icons/index.tsx",
    "create-animated-icon": "src/icons/create-animated-icon.tsx",
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
  external: ["react", "react-dom", "motion", "motion/react"],
});
