import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Tailwind v4 compiles the three CSS entries in the suite — `test/contrast.css` (rendered
  // color-contrast gate), `test/geometry.css` (the behaviour contracts) and `test/stacking.css`
  // (the z-band contract, added by G1-b) — so each runs against REAL token colors and REAL
  // compiled dimensions. Other test files import no CSS, so they stay fast structural a11y
  // checks, unaffected by this plugin.
  plugins: [tailwindcss()],
  resolve: {
    // Single React instance — Base UI subpaths (e.g. `@base-ui/react/field`) get
    // pre-bundled into their own optimized chunk; without deduping, that chunk
    // can resolve a second React and crash on `useId` (null React internals).
    dedupe: ["react", "react-dom"],
    // Order matters: Vite takes the first matching alias prefix, so every more-specific entry
    // must precede the shorter one it would otherwise be swallowed by.
    alias: {
      // The next three entries exist for `geometry.browser.test.tsx`, which mounts the docs
      // preview fixtures. Those fixtures import components as `@/components/ui/<name>` — inside
      // the docs app that means the generated copy-in. Point them at the CANONICAL registry
      // instead: the copy-in is byte-identical (asserted by `registry:build` idempotency) and is
      // proven as a distribution surface by `verify-shadcn-consume`, so this lane never needs to
      // reach into the docs app for component source at all.
      "@/components/preview": r("../../apps/docs/components/preview"),
      "@/components/ui": r("./registry/ui"),
      "@/components": r("./registry"),
      // The docs app's `@/lib/cn` re-exports `cn` from `@vegastack/design`; the registry's own
      // re-export is `registry/lib/utils`. Same binding, canonical source. Precedes `@/lib`.
      "@/lib/cn": r("./registry/lib/utils"),
      "@/lib": r("./registry/lib"),
      "@/hooks": r("./registry/hooks"),
      // One fixture uses `next/dynamic` for a bundler reason that does not exist here.
      // See `test/next-dynamic-stub.tsx`.
      "next/dynamic": r("./test/next-dynamic-stub.tsx"),
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
      // Sheet runs on Drawer (audit D15). Without pre-bundling it, Vite discovers the subpath
      // mid-run, re-optimizes, reloads the page and splits React module identity — which fails
      // whichever unrelated tests happen to be in flight (emoji-picker, date-picker).
      "@base-ui/react/drawer",
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
      // next-themes (the provider's `useTheme`) — pre-bundle so it shares the single
      // deduped React copy (otherwise `useContext`/`useId` resolve a second React and
      // crash with null internals).
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
      // Everything below was still being DISCOVERED by Vite on a cold cache (a fresh clone or
      // worktree with no `node_modules/.vite`): three "new dependencies optimized … reloading"
      // events fired mid-run and reloaded live test pages, failing every test in the file that was
      // executing (measured 2026-09-07: dropzone 20/20 failed cold, 20/20 passed warm). Listing them
      // makes the first run behave like every later one. The set is the union of the three reload
      // events, minus anything this workspace does not itself depend on — `clsx` and
      // `tailwind-merge` are @vegastack/design's dependencies and reach a test only through its
      // built dist, so naming them here produced "Failed to resolve dependency … present in client
      // 'optimizeDeps.include'" on every run. A new engine or shared runtime import belongs here on
      // the day it is added.
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "vitest-browser-react",
      "axe-core",
      "class-variance-authority",
      "lucide-react",
      "@tanstack/react-table",
      "@tanstack/react-virtual",
      "react-dropzone",
      "@atlaskit/pragmatic-drag-and-drop/utils/combine",
      "@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter",
      "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/attach-closest-edge",
      "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/extract-closest-edge",
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
      // Pin the browser context locale so date/number formatting is identical on every
      // developer machine. Playwright's Chromium defaults to en-US regardless of the host,
      // but Firefox (and WebKit) inherit the OS locale — on a non-US host (e.g. en-IN/en-GB)
      // Intl.DateTimeFormat then renders "1 Jun 2026" instead of "Jun 1, 2026", and every
      // test that asserts a US-formatted date times out on the cross-engine lane only.
      //
      // `reducedMotion: "reduce"` is deliberately NOT set here, even though the geometry
      // contracts want it. `contextOptions` apply to every file in the run, and measured
      // 2026-09-08 it turns `contrast.browser.test.tsx` red in both themes ("expected >=1px
      // outline offset, got 0px"): the token base stylesheet's sanctioned
      // `prefers-reduced-motion` override starts matching and the focus ring is read
      // mid-transition. The geometry lane neutralises motion in its own stylesheet instead —
      // see the block at the end of `test/geometry.css`.
      //
      // `colorScheme` is likewise left at Playwright's default (light), which is the single
      // scheme the geometry lane asserts; nothing there applies the `.dark` class.
      provider: playwright({
        contextOptions: {
          locale: "en-US",
        },
      }),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
