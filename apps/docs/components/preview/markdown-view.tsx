"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/markdown-view` (dogfoods the registry) → auto-scanned.
import { MarkdownView } from "@/components/ui/markdown-view";

// A rich sample exercising the full token-styled prose surface: heading, lead
// paragraph with a link and inline code, a bullet list, a fenced code block,
// and a blockquote.
const SAMPLE = `# Deployment summary

Render a markdown string to **safe, token-styled** HTML. The agent wrote this
[changelog](https://vegastack.com) using inline \`code\` and the blocks below.

## What changed

- Migrated tokens to the warm-neutral ramp
- Rationed colour to a neutral \`primary\` and \`info\`
- Flattened surfaces to a single border

\`\`\`ts
function deploy(target: string) {
  return \`Deploying to \${target}…\`;
}
\`\`\`

> Links use the \`info\` blue, headings settle at weight 500 — never bold.
`;

const GFM = `## GitHub-flavored markdown

A table, ~~strikethrough~~, and a task list:

| Feature | Status |
| ------- | ------ |
| Tables | Done |
| Task lists | Done |

- [x] Render tables
- [x] Render task lists
- [ ] Add raw HTML (never)
`;

const CODE = `### Code blocks

Inline \`const x = 1\` and a fenced block:

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`
`;

// Kitchen-sink: exercises EVERY styled element so the full prose surface renders
// in one view — all six heading levels (h4/h5/h6 are otherwise never shown), an
// ordered list, a horizontal rule, and an image.
const KITCHEN_SINK = `# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

A paragraph with **bold**, _italic_, ~~strikethrough~~, and inline \`code\`.

1. First ordered step
2. Second ordered step
3. Third ordered step

- Unordered item
- Another item

> A blockquote settles at the muted foreground.

---

![A scenic landscape](/preview/landscape.svg)
`;

// External links open in a new tab (target=_blank rel=noreferrer noopener);
// relative/internal links stay in the same tab.
const LINKS = `Links adapt to their destination:

- [External link](https://vegastack.com) opens in a new tab.
- [Internal link](/docs/components/markdown-view) stays in the same tab.
`;

export function markdownView(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <div className="w-full max-w-prose text-left">
        <MarkdownView>{SAMPLE}</MarkdownView>
      </div>
    </Wrapper>
  );
}

export function markdownViewGfm(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <div className="w-full max-w-prose text-left">
        <MarkdownView>{GFM}</MarkdownView>
      </div>
    </Wrapper>
  );
}

export function markdownViewCode(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <div className="w-full max-w-prose text-left">
        <MarkdownView>{CODE}</MarkdownView>
      </div>
    </Wrapper>
  );
}

export function markdownViewKitchenSink(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <div className="w-full max-w-prose text-left">
        <MarkdownView>{KITCHEN_SINK}</MarkdownView>
      </div>
    </Wrapper>
  );
}

export function markdownViewLinks(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <div className="w-full max-w-prose text-left">
        <MarkdownView>{LINKS}</MarkdownView>
      </div>
    </Wrapper>
  );
}
