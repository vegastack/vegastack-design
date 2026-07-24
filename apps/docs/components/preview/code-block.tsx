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
