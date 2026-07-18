import { createMDX } from 'fumadocs-mdx/next';
import { createNextStory } from '@fumadocs/story/next';

const withMDX = createMDX();
// Fumadocs Story: build-time plugin that transforms `*.story.tsx` files, generating the
// props-controls metadata from each component's TypeScript types.
const withStory = createNextStory();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  serverExternalPackages: ['typescript', 'twoslash'],
};

export default withStory(withMDX(config));
