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
  - Nested item

- [x] Done task
- [ ] Open task
  - [ ] Nested task

> A blockquote settles at the muted foreground.

\`\`\`python
print("fenced code keeps its language")
\`\`\`

| Owner | Task          |
| ----- | ------------- |
| Ada   | Release notes |
| Grace | Pricing page  |

A long URL wraps inside the line: https://example.com/a/very/long/path/that/would/otherwise/widen/the/page/and/scroll/it/sideways

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

// `TextEdit`'s `format="html"` output — the shape its task list and code block take — rendered
// through the HTML allowlist. The `<script>` and the `onerror` handler are dropped.
const HTML = `<h2>Release checklist</h2><p>Ship the <strong>lazy editor</strong> and <a href="https://vegastack.com">tell the team</a>.</p><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Read view renders on the server</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Editor loads on intent</p></div></li></ul><pre><code class="language-ts">const editor = await import("./text-edit-editor");</code></pre><script>alert(1)</script><p><img src="/preview/landscape.svg" alt="A scenic landscape" onerror="alert(1)"></p>`;

export function markdownViewHtml(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <div className="w-full max-w-prose text-left">
        <MarkdownView format="html">{HTML}</MarkdownView>
      </div>
    </Wrapper>
  );
}

const LIBRARY = `## Kitchen circuit

Ask [@Asha Rao](mention://user/u1) before changing [@Breaker sizing](mention://page/p2). The layout is in [panel-layout.pdf](/api/files/f1/download); [@Private page](mention://page/restricted:p9) stays muted.

> [!NOTE]
> The panel is labelled left to right.

> [!TIP]
> Use a 25 A breaker for the kitchen circuit.

> [!WARNING]
> Isolate the supply before opening the panel.

<details><summary>Wiring colours</summary>

- Brown: live
- Blue: neutral

</details>

## Kitchen circuit
`;

/**
 * TextEdit's Markdown constructs, rendered: mention chips (a page links through `mentionHref`, a
 * person and a `restricted:` target never do), a file chip, callouts in three tones, a toggle
 * (collapsed), and `headingIds` — the repeated heading gets `-1`.
 */
export function markdownViewLibrary(): ReactNode {
  return (
    <Wrapper className="block">
      <MarkdownView headingIds mentionHref={(kind, id) => `#${kind}-${id}`}>
        {LIBRARY}
      </MarkdownView>
    </Wrapper>
  );
}

const CITED = `## Decisions

- Ship the pricing page on Friday [[1]]
- Keep the free tier, capped at three seats [[2]][[3]]
- Revisit the enterprise quote after legal's review [[9]]`;

const SOURCES: Record<number, { who: string; at: string; quote: string }> = {
  1: { who: "Asha Rao", at: "04:12", quote: "Let's just ship it Friday." },
  2: { who: "Raj Patel", at: "11:40", quote: "The free tier stays." },
  3: { who: "Asha Rao", at: "12:05", quote: "Three seats, no more." },
};

/**
 * Citation markers: `[[n]]` renders as a superscript `n` whose popover shows the quote on hover,
 * focus or a long press, and whose click would seek the recording. `[[9]]` has no source, so it
 * stays literal text.
 */
export function markdownViewCitations(): ReactNode {
  return (
    <Wrapper className="block">
      <MarkdownView
        citation={(n) => {
          const source = SOURCES[n];
          if (!source) return null;
          return {
            label: `Source ${n}`,
            content: (
              <span className="flex flex-col gap-1">
                <span>“{source.quote}”</span>
                <span className="text-xs text-muted-foreground">
                  {source.who} · {source.at}
                </span>
              </span>
            ),
            onSelect: () => {},
          };
        }}
      >
        {CITED}
      </MarkdownView>
    </Wrapper>
  );
}
