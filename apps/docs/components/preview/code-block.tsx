"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/code-block` (dogfoods the registry) → auto-scanned.
import { CodeBlock } from "@/components/ui/code-block";

const SQL = `SELECT
  COALESCE(primary_location.country_code, 'Not recorded') AS country,
  COUNT(record_id) AS company_count
FROM companies
GROUP BY country
ORDER BY company_count DESC;`;

export function codeBlock(): ReactNode {
  // The shared code surface: sunken mono panel + mono-label language header + copy.
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <CodeBlock language="sql" copyValue={SQL}>
        {SQL}
      </CodeBlock>
      <CodeBlock>{`# headerless: no language, no copy\npnpm run registry:build`}</CodeBlock>
    </Wrapper>
  );
}

const LONG_LINE = `docker run --rm -it --name vegastack-registry --env REGISTRY_BASE_URL=https://design.vegastack.com/r --env CF_ACCESS_CLIENT_ID=$CF_ACCESS_CLIENT_ID --volume "$PWD":/workspace ghcr.io/vegastack/registry-preflight:latest --verify --fail-closed`;

/**
 * A line far wider than the panel. The block scrolls inside its own
 * `overflow-x` container rather than widening the page — the audit's 320px
 * reflow contract fails the moment a code sample pushes the document sideways
 * (B4-11: there was no fixture for this, so the contract lane never checked it).
 */
export function codeBlockOverflow(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <CodeBlock language="bash" copyValue={LONG_LINE}>
        {LONG_LINE}
      </CodeBlock>
    </Wrapper>
  );
}
