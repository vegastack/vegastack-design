import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Tailwind v4 compiles `test/contrast.css` (the only CSS import in the suite) so the rendered
  // color-contrast a11y gate runs against REAL token colors. Other test files import no CSS, so they
  // stay fast structural a11y checks, unaffected by this plugin.
  plugins: [tailwindcss()],
  resolve: {
    // Single React instance — Base UI subpaths (e.g. `@base-ui/react/field`) get
    // pre-bundled into their own optimized chunk; without deduping, that chunk
    // can resolve a second React and crash on `useId` (null React internals).
    dedupe: ["react", "react-dom"],
    alias: {
      "@/components/ui": r("./registry/ui"),
      "@/components": r("./registry"),
      "@/lib": r("./registry/lib"),
      "@/hooks": r("./registry/hooks"),
    },
  },
  optimizeDeps: {
    // Pre-bundle the Base UI subpaths we consume so they share one React copy
    // (otherwise a subpath's optimized chunk can resolve a second React and crash on useId).
    include: [
      "@base-ui/react/use-render",
      // The headless message-scroller primitive (the one non-Base-UI primitive) — pre-bundle so it
      // shares the single deduped React copy (otherwise its chunk resolves a 2nd React → useId crash).
      "@shadcn/react/message-scroller",
      "@base-ui/react/input",
      "@base-ui/react/field",
      "@base-ui/react/form",
      "@base-ui/react/dialog",
      "@base-ui/react/alert-dialog",
      "@base-ui/react/button",
      "@base-ui/react/popover",
      "@base-ui/react/tooltip",
      "@base-ui/react/menu",
      "@base-ui/react/navigation-menu",
      "@base-ui/react/context-menu",
      "@base-ui/react/select",
      "@base-ui/react/combobox",
      "@base-ui/react/tabs",
      "@base-ui/react/checkbox",
      "@base-ui/react/checkbox-group",
      "@base-ui/react/switch",
      "@base-ui/react/radio",
      "@base-ui/react/radio-group",
      "@base-ui/react/slider",
      "@base-ui/react/toggle",
      "@base-ui/react/toggle-group",
      "@base-ui/react/accordion",
      "@base-ui/react/collapsible",
      "@base-ui/react/scroll-area",
      "@base-ui/react/separator",
      "@base-ui/react/progress",
      "@base-ui/react/avatar",
      "@base-ui/react/preview-card",
      "@base-ui/react/number-field",
      // X2 component third-party engines — same single-React-copy rationale.
      "react-resizable-panels",
      "recharts",
      "@base-ui/react/otp-field",
      "react-day-picker",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@base-ui/react/direction-provider",
      // Sonner (Toaster) + next-themes (its `useTheme`) — pre-bundle so they
      // share the single deduped React copy (otherwise `useContext`/`useId`
      // resolve a second React and crash with null internals).
      "sonner",
      "next-themes",
      // react-hook-form + the zod resolver back the documented Field form-integration
      // test. Pre-bundle them for the same reason: otherwise their optimized chunk
      // resolves a second React and `useRef`/`useId` crash on null internals.
      "react-hook-form",
      "@hookform/resolvers/zod",
      // Full three-engine lane imports that are not reached by the generated
      // smoke subset. Prebundle them up front so Vite never reloads an active
      // browser test page and splits React module identity mid-run.
      "motion/react",
      "react-dom/server",
      "react-markdown",
      "remark-gfm",
      "zod",
    ],
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // Keep browser-file concurrency bounded. On high-core hosts Vitest otherwise
    // launches most of the 100+ files together; trusted click/focus operations
    // then queue behind one Chromium process and produce false 15s timeouts.
    // Four workers keeps the full and three-engine release lanes deterministic.
    maxWorkers: 4,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
