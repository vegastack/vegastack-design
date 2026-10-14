"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { EMBED_PROVIDERS } from "@/lib/embed-providers";
import { Input } from "@/components/ui/input";
// Copied INTO apps/docs via `shadcn add @vegastack/markdown-view` (dogfoods the registry) → auto-scanned.
import {
  MarkdownView,
  type MarkdownAnnotation,
} from "@/components/ui/markdown-view";

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
 * Embeds — a YouTube or Loom link alone on its line renders as a facade: the provider's glyph, its
 * name and Play. Nothing loads from the provider until Play; printed, it is the URL.
 */
export function markdownViewEmbeds(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <MarkdownView embeds={EMBED_PROVIDERS}>
        {[
          "The walkthrough:",
          "",
          "https://youtu.be/aqz-KE-bpKQ",
          "",
          "A link in a sentence stays a link: https://youtu.be/aqz-KE-bpKQ.",
        ].join("\n")}
      </MarkdownView>
    </Wrapper>
  );
}

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

const DOCUMENT = `# Pricing

Pricing for the annual plan is set per seat and billed once a year. Teams that grow during the term add seats at the same rate, prorated to the renewal date.

## Seats

A team that shrinks keeps its seats until the term ends. Discounts apply from twenty seats, and every plan includes the same \`support\`, storage and security review.

### Renewal

- Annual plans renew on the same date each year
- Monthly plans can move to annual at any time

| Plan | Seats | Price |
| --- | --- | --- |
| Starter | 1–19 | $12 a seat |
| Team | 20–99 | $10 a seat |
`;

/**
 * The document type scale (`typeScale="document"`): 14/24 text at the reading rhythm — 12px
 * between paragraphs, `#` 24 · `##` 20 · `###` 16 — the scale a page reads at, against the app's
 * compact one in a comment.
 */
export function markdownViewDocument(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto max-w-[47ch]">
        <MarkdownView typeScale="document">{DOCUMENT}</MarkdownView>
      </div>
    </Wrapper>
  );
}

const READ = `# Pricing review

Check the annual price before renewal, and confirm the seat count with finance.

## Annual plan

The annual price is set per seat. A team that shrinks keeps its seats until the term ends.

<details><summary>Earlier prices</summary>

The 2025 price was $14 a seat.

</details>

## Limits

Seats are capped at 500 per workspace.`;

/**
 * Read mode: comment highlights (one active, with count pills), heading copy links, a toggle each
 * reader opens for themself, and find — the matches highlighted without touching the DOM, with a
 * match bar. No editor is loaded.
 */
export function markdownViewReadMode(): ReactNode {
  const [active, setActive] = React.useState<string | null>("t1");
  const [query, setQuery] = React.useState("price");
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  return (
    <Wrapper className="block">
      <div className="mx-auto flex max-w-[47ch] flex-col gap-4">
        <Input
          aria-label="Find in page"
          placeholder="Find in page"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <MarkdownView
          typeScale="document"
          annotations={[
            {
              id: "t1",
              anchor: { quote: "annual price", prefix: "Check the " },
              count: 3,
            },
            { id: "t2", anchor: { quote: "seat count" } },
          ]}
          activeAnnotationId={active}
          onAnnotationClick={setActive}
          annotationCounts="always"
          headingLinkHref={(anchor) => `#${anchor.slug}`}
          toggleState={{
            isOpen: (id, fallback) => open.has(id) || fallback,
            onToggle: (id, next) =>
              setOpen((current) => {
                const copy = new Set(current);
                if (next) copy.add(id);
                else copy.delete(id);
                return copy;
              }),
          }}
          findQuery={query}
          onFindClose={() => setQuery("")}
        >
          {READ}
        </MarkdownView>
      </div>
    </Wrapper>
  );
}

const COMMENTABLE = `## Renewal

Check the annual price before renewal, and confirm the seat count with finance. A team that shrinks keeps its seats until the term ends.`;

/**
 * Comment on a selection: select words and press Comment. The anchor comes back over the same text
 * highlights resolve against, so it highlights exactly the selected words; the button keeps clear
 * of a 56px sticky header (`floatingSafeArea`).
 */
export function markdownViewComment(): ReactNode {
  const [threads, setThreads] = React.useState<MarkdownAnnotation[]>([]);
  return (
    <Wrapper className="block">
      <div className="mx-auto max-w-[47ch]">
        <MarkdownView
          typeScale="document"
          annotations={threads}
          annotationCounts="always"
          onCreateAnnotation={(anchor) =>
            setThreads((current) => [
              ...current,
              { id: `c${current.length + 1}`, anchor },
            ])
          }
          floatingSafeArea={{ top: 56 }}
        >
          {COMMENTABLE}
        </MarkdownView>
      </div>
    </Wrapper>
  );
}
