import { BLOCK_ROUTES, COMPONENT_ROUTES } from "./contract-routes.generated";

// Shared authority for both capture and completeness verification. Keep this as data rather than
// parsing the Playwright spec: capture and verification must agree on every fixed route as well as
// the contract-derived component and block routes.
export const VRT_PAGE_ROUTES = [
  "/docs/foundations/colors",
  "/docs/foundations/typography",
  "/docs/foundations/icons",
  "/docs/foundations/motion",
  ...COMPONENT_ROUTES,
  "/docs/guides/quickstart",
  "/docs/guides/registry-auth",
  "/docs/guides/agent-skills",
  "/docs/guides/components",
  "/docs/guides/provider-setup",
  "/docs/guides/theming",
  "/internal/internal-projects",
  "/docs/guides/external-projects",
  "/docs/guides/production-checklist",
  "/docs/guides/troubleshooting",
  ...BLOCK_ROUTES,
  "/docs/utilities/shimmer",
  "/docs/utilities/scroll-fade",
  "/",
] as const;
