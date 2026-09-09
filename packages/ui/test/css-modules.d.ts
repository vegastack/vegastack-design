// The browser lanes import their compiled-CSS entry for its side effect
// (`import "./geometry.css"`), which `@tailwindcss/vite` turns into a stylesheet at run time.
// TypeScript has no notion of that, so without this declaration every lane fails `tsc` with
// TS2882 the moment `test/` enters the tsconfig `include` — which is precisely why the directory
// had been left out, and why the repo's newest browser gate went un-typechecked.
declare module "*.css";
