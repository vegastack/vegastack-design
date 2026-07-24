import { createMDX } from "fumadocs-mdx/next";
import { createNextStory } from "@fumadocs/story/next";

const withMDX = createMDX();
// Fumadocs Story: build-time plugin that transforms `*.story.tsx` files, generating the
// props-controls metadata from each component's TypeScript types.
const withStory = createNextStory();

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  // Next 16.3 enables these for production builds by default. Both are already available in the
  // stable 16.2 line, so opt in now without taking the 16.3 prerelease onto the public site.
  enablePrerenderSourceMaps: true,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
  serverExternalPackages: ["typescript", "twoslash"],
};

export default withStory(withMDX(config));
