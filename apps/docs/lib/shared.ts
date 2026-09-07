export const appName = "VegaStack Design";
export const docsRoute = "/docs";
export const internalRoute = "/internal";

export const gitConfig = {
  user: "VegaStack",
  repo: "vegastack-design",
  branch: "main",
};

/** Canon row 0 — the lifecycle a component page declares in frontmatter. */
export const PAGE_STATUSES = ["stable", "preview", "deprecated"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];
