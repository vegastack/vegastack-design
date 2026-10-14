"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { MarkdownView } from "@/components/ui/markdown-view";
import { MermaidBlock, mermaidBlockView } from "@/components/ui/mermaid-block";
import { TextEdit } from "@/components/ui/text-edit";

const FLOW = `flowchart LR
  accTitle: Publishing a page
  accDescr: A draft goes to review, then is published or sent back for changes.
  draft[Draft] --> review{Review}
  review -->|Approved| published([Published])
  review -->|Changes| draft
  class draft step
  class review decision
  class published outcome`;

const SEQUENCE = `sequenceDiagram
  accTitle: Saving a page
  accDescr: The editor sends changes to the server, which stores them and confirms.
  participant Editor
  participant Server
  Editor->>Server: Changes
  Server-->>Editor: Saved`;

/** A flowchart in token colours, named by its accTitle; drawn when it nears the viewport. */
export function mermaidBlock(): ReactNode {
  return (
    <Wrapper className="block">
      <MermaidBlock source={FLOW} />
    </Wrapper>
  );
}

/** Another diagram type, and a source that does not parse: the line, the problem and the source. */
export function mermaidBlockStates(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-1 gap-6">
      <MermaidBlock source={SEQUENCE} />
      <MermaidBlock source={"flowchart LR\n  draft --> review\n  review -->"} />
    </Wrapper>
  );
}

const PAGE = `Every page goes through review before it is published.

\`\`\`mermaid
${FLOW}
\`\`\`

The reviewer is the space's editor.`;

/** `MarkdownView` with `blockViews`: the fence is a Diagram block — Preview / Code, Expand, ⋯. */
export function mermaidBlockMarkdownView(): ReactNode {
  return (
    <Wrapper className="block">
      <MarkdownView blockViews={{ mermaid: mermaidBlockView }}>
        {PAGE}
      </MarkdownView>
    </Wrapper>
  );
}

/**
 * `TextEdit` with `blockViews`: click into the page to edit; Code opens the source beside a live
 * preview on a wide block, ⌘Enter or Escape go back. "/diagram" inserts a new one.
 */
export function mermaidBlockTextEdit(): ReactNode {
  return (
    <Wrapper className="block">
      <TextEdit
        format="markdown"
        defaultValue={PAGE}
        blockViews={{ mermaid: mermaidBlockView }}
        aria-label="Page"
      />
    </Wrapper>
  );
}
