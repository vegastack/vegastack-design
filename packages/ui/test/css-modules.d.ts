// The browser lanes import their compiled-CSS entry for its side effect
// (`import "./geometry.css"`), which `@tailwindcss/vite` turns into a stylesheet at run time.
// TypeScript has no notion of that, so without this declaration every lane fails `tsc` with
// TS2882 the moment `test/` enters the tsconfig `include` — which is precisely why the directory
// had been left out, and why the repo's newest browser gate went un-typechecked.
declare module "*.css";

// Batch 3 of the shadcn reset: `select.test.tsx` reads its own component's SOURCE, because Base UI
// mounts the select's scroll arrows only while the popup really overflows and the unit lane
// compiles no CSS — so the INT-1 exemption those two elements carry has no DOM to be read off.
// `?raw` is Vite's string import; TypeScript needs to be told it is one.
declare module "*?raw" {
  const content: string;
  export default content;
}

// `?inline` is Vite's COMPILED-stylesheet string import. `filter-bar.test.tsx` mounts the geometry
// lane's sheet for one containment test only, because every other test in that file measures
// against its own style mirror and must not see real CSS.
declare module "*?inline" {
  const content: string;
  export default content;
}
