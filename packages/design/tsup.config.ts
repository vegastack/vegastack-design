import { defineConfig } from 'tsup';

// Three public entries, one package:
//   .        → cn() + TIMINGS/FLOATING constants (server-safe, no React)
//   ./icons  → Icon / BrandIcon / AnimatedIcon runtime (React 19 peer)
//   ./preset → Tailwind v4 preset metadata (the real preset is preset.css)
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'icons/index': 'src/icons/index.tsx',
    preset: 'src/preset.ts',
  },
  format: 'esm',
  dts: true,
  outDir: 'dist',
  external: ['react', 'react-dom'],
});
