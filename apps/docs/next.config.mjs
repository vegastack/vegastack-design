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
  // Any *.vegastack.dev tunnel host may serve a dev preview (Cloudflare
  // tunnel → the mini's dev server); without it Next dev blocks /_next/*
  // cross-origin and nothing hydrates. Dev-only setting — ignored by
  // production builds.
  allowedDevOrigins: ["127.0.0.1", "*.vegastack.dev"],
  // `next dev` writes a managed <!-- BEGIN:nextjs-agent-rules --> block into an AGENTS.md /
  // CLAUDE.md in THIS directory whenever it detects a coding agent (Next 16.3+,
  // `ensureAgentRulesForDev`; the write is a plain join on the Next app dir, so it never reaches
  // the repo-root AGENTS.md). Off, deliberately: this repo's agent instructions are authored and
  // reviewed, AGENTS.md is the canonical cross-tool file, and a tool-managed block inside a
  // hand-authored one has no owner. It would also drop two untracked files into apps/docs/ and
  // trip the `git status --porcelain` idempotency gates.
  agentRules: false,
  serverExternalPackages: ["typescript", "twoslash"],
};

export default withStory(withMDX(config));
