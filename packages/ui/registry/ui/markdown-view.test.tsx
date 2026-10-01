import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeAll, expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { proseClassName } from "@vegastack/design";
import {
  MarkdownView,
  headingIds,
  markdownExtrasClassName,
  mentionMarkdown,
  parseMentionLink,
} from "./markdown-view";
import { preloadTextEdit, TextEdit } from "./text-edit";

// TextEdit renders a light read view and loads its editor on intent; these tests exercise the
// editor itself, so load it up front — every TextEdit then swaps it in right after mounting.
beforeAll(() => preloadTextEdit());

/** The class list of a prose root, as a set, so order never matters. */
function classes(element: Element): Set<string> {
  return new Set(element.className.split(/\s+/).filter(Boolean));
}

test("renders a heading from markdown", async () => {
  const screen = await render(<MarkdownView># Hello world</MarkdownView>);
  const heading = screen.getByRole("heading", {
    level: 1,
    name: "Hello world",
  });
  await expect.element(heading).toBeInTheDocument();
});

test("headingOffset shifts every heading down, capped at h6", async () => {
  const screen = await render(
    <MarkdownView headingOffset={2}>
      {"# One\n\n## Two\n\n#### Four\n\n##### Five"}
    </MarkdownView>,
  );
  const levels = [
    ...screen.container.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  ].map((h) => `${h.tagName.toLowerCase()} ${h.textContent}`);
  expect(levels).toEqual(["h3 One", "h4 Two", "h6 Four", "h6 Five"]);
});

test("renders headings, links, code, and list elements", async () => {
  const md = [
    "## Section",
    "",
    "A [link](https://example.com) and `inline code`.",
    "",
    "- one",
    "- two",
    "",
    "1. first",
    "2. second",
  ].join("\n");

  const screen = await render(<MarkdownView>{md}</MarkdownView>);
  const { container } = screen;

  // Heading
  await expect
    .element(screen.getByRole("heading", { level: 2, name: "Section" }))
    .toBeInTheDocument();
  // Link (with safe rel)
  // The accessible name carries the sr-only external-link affordance.
  const link = screen.getByRole("link", { name: "link (opens in new tab)" });
  await expect.element(link).toHaveAttribute("href", "https://example.com");
  await expect.element(link).toHaveAttribute("rel", "noreferrer noopener");
  // Inline code + lists exist in the DOM
  expect(container.querySelector("code")).not.toBeNull();
  expect(container.querySelector("ul")).not.toBeNull();
  expect(container.querySelector("ol")).not.toBeNull();
});

test("MarkdownView and TextEdit wear the identical prose recipe", async () => {
  // The B4-09 acceptance — "the two surfaces render the same computed styles" — is guaranteed here
  // STRUCTURALLY rather than measured: identical class strings on identical elements cannot compile
  // to different styles. That is deliberate. This harness builds no Tailwind CSS (only
  // `test/contrast.css`), so a `getComputedStyle` comparison would find both surfaces at browser
  // defaults and pass no matter how far they had drifted — a green test asserting nothing. The
  // rendered pixels are covered where real CSS exists: `design-lint --emitted-css`, which reads the
  // built stylesheet and rejects a prose default no override actually covers.
  const screen = await render(
    <div>
      <MarkdownView>{"# Title\n\nA paragraph with `code` in it."}</MarkdownView>
      <TextEdit
        aria-label="Body"
        defaultValue="<h1>Title</h1><p>A paragraph with <code>code</code> in it.</p>"
      />
    </div>,
  );
  const rendered = screen.container.querySelector(
    '[data-slot="markdown-view"]',
  ) as HTMLElement;
  await expect
    .poll(() => screen.container.querySelector(".tiptap"))
    .not.toBeNull();
  const edited = screen.container.querySelector(".tiptap") as HTMLElement;

  // Every rule of the recipe — and of the chips, callouts and toggles both surfaces render — is on
  // BOTH roots: neither surface may keep a private copy.
  const recipe = [
    ...proseClassName.split(/\s+/).filter(Boolean),
    ...markdownExtrasClassName.split(/\s+/).filter(Boolean),
  ];
  expect(recipe.length).toBeGreaterThan(50);
  const renderedClasses = classes(rendered);
  const editedClasses = classes(edited);
  for (const rule of recipe) {
    expect(renderedClasses.has(rule), `MarkdownView lost ${rule}`).toBe(true);
    expect(editedClasses.has(rule), `TextEdit lost ${rule}`).toBe(true);
  }

  // And neither adds typography of its own: what is left over is structural only.
  // `tiptap` and `ProseMirror` are the editor's own marker classes on the editable root — the first
  // from @tiptap/react, the second written by prosemirror-view (`attrs.class = "ProseMirror"`).
  // They carry no typography, and they are not ours to add or remove.
  const editorMarkers = new Set(["tiptap", "ProseMirror"]);
  const extras = [...new Set([...renderedClasses, ...editedClasses])].filter(
    (rule) => !recipe.includes(rule) && !editorMarkers.has(rule),
  );
  // The editor's ProseMirror resets (placeholder pseudo-element, table scroll box, selection
  // washes, the column-resize line) are layout parity with MarkdownView, not typography.
  expect(extras.sort()).toEqual(
    [
      "min-h-6",
      "max-w-full",
      "outline-none",
      "[&_p.is-editor-empty:first-child]:before:pointer-events-none",
      "[&_p.is-editor-empty:first-child]:before:float-start",
      "[&_p.is-editor-empty:first-child]:before:h-0",
      "[&_p.is-editor-empty:first-child]:before:text-muted-foreground/60",
      "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
      "[&.ProseMirror-focused_p.is-editor-empty:first-child]:before:content-['Type_/_for_commands']",
      "[&_.tableWrapper]:max-w-full",
      "[&_.tableWrapper]:my-2",
      "[&_.tableWrapper]:w-full",
      "[&_.tableWrapper]:overflow-x-auto",
      "[&_.selectedCell]:bg-accent",
      "[&_td]:relative",
      "[&_th]:relative",
      "[&_.column-resize-handle]:pointer-events-none",
      "[&_.column-resize-handle]:absolute",
      "[&_.column-resize-handle]:-inset-y-px",
      "[&_.column-resize-handle]:-end-px",
      "[&_.column-resize-handle]:w-0.5",
      "[&_.column-resize-handle]:bg-primary/50",
      "[&.resize-cursor]:cursor-col-resize",
      "[&_.ProseMirror-selectednode:not([data-slot=text-edit-image-node])]:rounded-sm",
      "[&_.ProseMirror-selectednode:not([data-slot=text-edit-image-node])]:bg-accent",
      "[&_table]:table-fixed",
      "[&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:pointer-events-none",
      "[&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:float-start",
      "[&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:h-0",
      "[&_[data-slot=toggle-content]>[data-node-view-content-react]>.is-empty]:before:text-muted-foreground/60",
      "[&_[data-slot=toggle-content]>[data-node-view-content-react]>[data-slot=toggle-summary].is-empty]:before:content-[attr(data-placeholder)]",
      "[&_[data-slot=toggle-content]>[data-node-view-content-react]>p.is-empty]:before:content-['Empty_toggle._Type_or_press_/_for_commands']",
    ].sort(),
  );

  // Both actually rendered the elements the recipe styles.
  for (const selector of ["h1", "p", "code"]) {
    expect(
      rendered.querySelector(selector),
      `MarkdownView is missing ${selector}`,
    ).not.toBeNull();
    expect(
      edited.querySelector(selector),
      `TextEdit is missing ${selector}`,
    ).not.toBeNull();
  }
});

test("renders fenced code blocks inside a <pre>", async () => {
  const md = ["```js", "console.log('hi')", "```"].join("\n");
  const screen = await render(<MarkdownView>{md}</MarkdownView>);
  const pre = screen.container.querySelector("pre");
  expect(pre).not.toBeNull();
  expect(pre?.querySelector("code")).not.toBeNull();
  expect(pre?.textContent).toContain("console.log('hi')");
});

test("renders blockquotes", async () => {
  const screen = await render(<MarkdownView>{"> quoted text"}</MarkdownView>);
  const quote = screen.container.querySelector("blockquote");
  expect(quote).not.toBeNull();
  expect(quote?.textContent).toContain("quoted text");
});

test("renders GFM tables, strikethrough, and task lists", async () => {
  const md = [
    "| A | B |",
    "| - | - |",
    "| 1 | 2 |",
    "",
    "~~struck~~",
    "",
    "- [x] done",
    "- [ ] todo",
  ].join("\n");

  const screen = await render(<MarkdownView>{md}</MarkdownView>);
  const { container } = screen;
  expect(container.querySelector("table")).not.toBeNull();
  expect(container.querySelector("del")).not.toBeNull();
  // A GFM task list is rendered with the DESIGN-SYSTEM `Checkbox`, not react-markdown's native
  // `<input type="checkbox">`. Asserting on that input was false coverage: Base UI's own
  // `CheckboxRoot` renders a visually-hidden input of its own, so the old assertion passed on
  // Base UI's element and would have passed identically if the swap had regressed. This is what
  // let Batch 7c find a broken task list (the inert tick had taken its own line) with the suite
  // green. Assert the slot and its state instead.
  const tick = container.querySelector('[data-slot="checkbox"]');
  expect(tick).not.toBeNull();
  expect(tick).toHaveAttribute("data-checked");
  // Inert but full-contrast: it is content, not a control the reader could have used.
  expect(tick!.className).toContain("disabled:opacity-100");
  // …and inline, so the label sits beside its tick rather than wrapping under it.
  expect(tick!.className).toContain("inline-flex");
});

test("a table cell's <br>, <br/> and <br /> are line breaks; elsewhere raw HTML stays text", async () => {
  const md = [
    "| Head<br>line | B |",
    "| - | - |",
    "| one<br>two | three<br/>four |",
    "| five<br />six | <b>bold</b> |",
    "",
    "Outside<br>a cell",
  ].join("\n");
  const screen = await render(<MarkdownView>{md}</MarkdownView>);
  const { container } = screen;
  const cells = [...container.querySelectorAll("th, td")];
  for (const [index, text] of [
    [0, "Headline"],
    [2, "onetwo"],
    [3, "threefour"],
    [4, "fivesix"],
  ] as const) {
    expect(cells[index]!.querySelectorAll("br")).toHaveLength(1);
    expect(cells[index]!.textContent).toBe(text);
  }
  // Only `<br>` is let through in a cell: any other tag is still its text.
  expect(cells[5]!.querySelector("b")).toBeNull();
  expect(cells[5]!.textContent).toBe("<b>bold</b>");
  // Outside a table, `<br>` is still shown as the text it is.
  const paragraph = container.querySelector("p")!;
  expect(paragraph.querySelector("br")).toBeNull();
  expect(paragraph.textContent).toBe("Outside<br>a cell");
});

test("accepts markdown via the content prop", async () => {
  const screen = await render(<MarkdownView content="**bold via content**" />);
  const strong = screen.container.querySelector("strong");
  expect(strong).not.toBeNull();
  expect(strong?.textContent).toBe("bold via content");
});

test("does NOT execute raw HTML / script (XSS-safe)", async () => {
  const malicious = [
    "Safe text.",
    "",
    "<script>window.__xss = true;</script>",
    "",
    '<img src="x" onerror="window.__xss = true;" />',
    "",
    '<div onclick="window.__xss = true;">click</div>',
  ].join("\n");

  const screen = await render(<MarkdownView>{malicious}</MarkdownView>);
  const { container } = screen;

  // No live <script> element is injected, and no event-handler-bearing elements.
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("[onerror]")).toBeNull();
  expect(container.querySelector("[onclick]")).toBeNull();
  // The raw HTML never ran.
  expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  // The legitimate text still rendered.
  await expect.element(screen.getByText("Safe text.")).toBeInTheDocument();
});

test("does not render javascript: protocol links as executable", async () => {
  const screen = await render(
    <MarkdownView>{"[click](javascript:alert(1))"}</MarkdownView>,
  );
  const link = screen.container.querySelector("a");
  // react-markdown drops unsafe URL protocols → no javascript: href reaches the DOM.
  expect(link?.getAttribute("href") ?? "").not.toContain("javascript:");
});

test("keeps relative links in the current browsing context", async () => {
  const screen = await render(
    <MarkdownView>{"[internal](/docs/components/button)"}</MarkdownView>,
  );
  const link = screen.getByRole("link", { name: "internal" });
  await expect.element(link).toHaveAttribute("href", "/docs/components/button");
  await expect.element(link).not.toHaveAttribute("target");
  await expect.element(link).not.toHaveAttribute("rel");
});

test("allows relative Markdown images without a network-origin exception", async () => {
  const screen = await render(
    <MarkdownView>{"![Local preview](/preview/landscape.svg)"}</MarkdownView>,
  );
  const image = screen.getByRole("img", { name: "Local preview" });
  await expect.element(image).toHaveAttribute("src", "/preview/landscape.svg");
  await expect.element(image).toHaveAttribute("loading", "lazy");
  await expect.element(image).not.toHaveAttribute("referrerpolicy");
});

test("blocks remote Markdown images by default", async () => {
  const screen = await render(
    <MarkdownView>
      {"![Tracking pixel](https://tracker.example/pixel.gif)"}
    </MarkdownView>,
  );
  expect(screen.container.querySelector("img")).toBeNull();
  const blocked = screen.container.querySelector(
    '[data-slot="markdown-image-blocked"]',
  );
  expect(blocked?.textContent).toBe("Tracking pixel");
});

test("allows only exact configured image origins and suppresses the referrer", async () => {
  const allowed = await render(
    <MarkdownView allowedImageOrigins={["https://media.example"]}>
      {"![Allowed](https://media.example/image.png)"}
    </MarkdownView>,
  );
  const image = allowed.getByRole("img", { name: "Allowed" });
  await expect
    .element(image)
    .toHaveAttribute("src", "https://media.example/image.png");
  await expect.element(image).toHaveAttribute("referrerpolicy", "no-referrer");

  const subdomain = await render(
    <MarkdownView allowedImageOrigins={["https://media.example"]}>
      {"![Blocked](https://evil.media.example/image.png)"}
    </MarkdownView>,
  );
  expect(subdomain.container.querySelector("img")).toBeNull();
  expect(
    subdomain.container.querySelector('[data-slot="markdown-image-blocked"]')
      ?.textContent,
  ).toBe("Blocked");
});

test("root carries the data-slot attribute", async () => {
  const screen = await render(<MarkdownView>text</MarkdownView>);
  expect(
    screen.container.querySelector('[data-slot="markdown-view"]'),
  ).not.toBeNull();
});

test("renders nothing for empty / whitespace input", async () => {
  const screen = await render(<MarkdownView>{"   "}</MarkdownView>);
  expect(
    screen.container.querySelector('[data-slot="markdown-view"]'),
  ).toBeNull();
});

test("merges a custom className onto the root", async () => {
  const screen = await render(
    <MarkdownView className="custom-md">hi</MarkdownView>,
  );
  const root = screen.container.querySelector('[data-slot="markdown-view"]');
  expect(root?.classList.contains("custom-md")).toBe(true);
});

test("forwards ref to the root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<MarkdownView ref={ref}>hi</MarkdownView>);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("markdown-view");
});

test("no a11y violations", async () => {
  const md = [
    "# Accessible document",
    "",
    "A paragraph with a [link](https://example.com) and `code`.",
    "",
    "- list item one",
    "- list item two",
    "",
    "> A blockquote.",
  ].join("\n");
  const screen = await render(<MarkdownView>{md}</MarkdownView>);
  await expectNoA11yViolations(screen.container);
});

// ---- Library constructs: mentions, file chips, callouts, toggles, heading ids ------------------

test("mentions render as chips: a page links through mentionHref, a person and a restricted target never do", async () => {
  const screen = await render(
    <MarkdownView mentionHref={(kind, id) => `/go/${kind}/${id}`}>
      {
        "Ask [@Asha Rao](mention://user/u1) about [@Q3 plan](mention://page/p1) and [@Private page](mention://page/restricted:p9)."
      }
    </MarkdownView>,
  );
  const chips = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="inline-chip"]',
    ),
  ];
  expect(chips.map((chip) => chip.textContent)).toEqual([
    "Asha Rao",
    "Q3 plan",
    "Private page",
  ]);
  expect(chips.map((chip) => chip.tagName)).toEqual(["SPAN", "A", "SPAN"]);
  expect(chips[1]).toHaveAttribute("href", "/go/page/p1");
  expect(chips[2]).toHaveAttribute("data-restricted", "");
  expect(screen.container.textContent).not.toContain("mention://");
});

test("a mention label keeps escaped brackets, and mentionMarkdown writes what parseMentionLink reads", async () => {
  const md = mentionMarkdown("page", "p2", "Plan [draft] \\ v2");
  expect(md).toBe("[@Plan \\[draft\\] \\\\ v2](mention://page/p2)");
  expect(parseMentionLink(`${md} tail`)).toEqual({
    raw: md,
    kind: "page",
    id: "p2",
    label: "Plan [draft] \\ v2",
  });
  const screen = await render(<MarkdownView>{`See ${md}`}</MarkdownView>);
  expect(
    screen.container.querySelector('[data-slot="inline-chip"]')?.textContent,
  ).toBe("Plan [draft] \\ v2");
});

test("a link under fileLinkPrefix renders as a file chip; javascript: links are still emptied", async () => {
  const screen = await render(
    <MarkdownView>
      {
        "Attached [report.pdf](/api/files/f2/download) and [bad](javascript:alert(1))."
      }
    </MarkdownView>,
  );
  const chip = screen.container.querySelector(
    '[data-slot="inline-chip"][data-kind="file"]',
  );
  expect(chip?.tagName).toBe("A");
  expect(chip).toHaveAttribute("href", "/api/files/f2/download");
  expect(chip?.textContent).toBe("report.pdf");
  expect(chip?.querySelector("svg")).not.toBeNull();
  const bad = [...screen.container.querySelectorAll("a")].find(
    (a) => a.textContent === "bad",
  );
  expect(bad?.getAttribute("href")).toBe("");
});

test("callouts render as notes with their tone; a toggle is a closed native disclosure", async () => {
  const screen = await render(
    <MarkdownView>
      {
        "> [!TIP]\n> Use a 25 A breaker\n\n> [!WARNING]\n> Isolate first.\n\n<details><summary>Wiring **plan**</summary>\n\n- red\n- black\n\n</details>"
      }
    </MarkdownView>,
  );
  const callouts = [
    ...screen.container.querySelectorAll('[data-slot="callout"]'),
  ];
  expect(callouts.map((c) => c.getAttribute("data-tone"))).toEqual([
    "tip",
    "warning",
  ]);
  expect(callouts[0]).toHaveAttribute("role", "note");
  expect(callouts[0]?.textContent).toBe("Use a 25 A breaker");
  const details = screen.container.querySelector("details");
  expect(details).not.toBeNull();
  expect(details!.open).toBe(false);
  expect(details!.querySelector("summary strong")?.textContent).toBe("plan");
  expect(details!.querySelectorAll("li")).toHaveLength(2);
  expect(screen.container.textContent).not.toContain("<details>");
  await expectNoA11yViolations(screen.container);
});

test("headingIds gives every heading a stable id, a repeat suffixed", async () => {
  expect(headingIds(["Setup", "Wiring plan", "Setup", "Setup"])).toEqual([
    "setup",
    "wiring-plan",
    "setup-1",
    "setup-2",
  ]);
  const screen = await render(
    <MarkdownView headingIds>{"## Setup\n\ntext\n\n## Setup"}</MarkdownView>,
  );
  expect([...screen.container.querySelectorAll("h2")].map((h) => h.id)).toEqual(
    ["setup", "setup-1"],
  );
});

test("headingScale=\"document\" gives a page's headings a document scale; compact keeps the app's", async () => {
  const screen = await render(
    <>
      <MarkdownView headingScale="document">{"## Scope"}</MarkdownView>
      <MarkdownView>{"## Notes"}</MarkdownView>
    </>,
  );
  const [doc, compact] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="markdown-view"]',
  );
  expect(doc!.className).toContain("[&_h2]:text-2xl");
  expect(doc!.className).not.toContain("[&_h2]:text-base");
  expect(compact!.className).toContain("[&_h2]:text-base");
});

test("citation turns [[n]] into a named marker; without it, and in code, the text stays", async () => {
  const selected: number[] = [];
  const screen = await render(
    <MarkdownView
      citation={(n) =>
        n === 2 ? { label: "Source 2", onSelect: () => selected.push(n) } : null
      }
    >
      {"Ship Friday [[2]] and [[3]], not `[[2]]`."}
    </MarkdownView>,
  );
  await screen.getByRole("button", { name: "Source 2" }).click();
  expect(selected).toEqual([2]);
  const text = screen.container.textContent;
  expect(text).toContain("[[3]]");
  expect(screen.container.querySelector("code")?.textContent).toBe("[[2]]");
  const plain = await render(
    <MarkdownView>{"Ship Friday [[2]]"}</MarkdownView>,
  );
  expect(plain.container.textContent).toBe("Ship Friday [[2]]");
});

test("video, audio, wrapped code, open toggles and alert callouts", async () => {
  const screen = await render(
    <MarkdownView>
      {[
        '<video src="/files/clip.mp4"></video>',
        '<audio src="https://evil.example/a.mp3"></audio>',
        "```ts wrap\nconst a = 1;\n```",
        "<details open><summary>Open</summary>\n\nBody\n\n</details>",
        "> [!CAUTION]\n> Careful.",
      ].join("\n\n")}
    </MarkdownView>,
  );
  const root = screen.container;
  expect(root.querySelector("video")?.getAttribute("src")).toBe(
    "/files/clip.mp4",
  );
  // A remote origin outside `images` is blocked, as an image is.
  expect(root.querySelector("audio")).toBeNull();
  expect(
    root
      .querySelector('[data-slot="code-block"]')
      ?.getAttribute("data-language"),
  ).toBe("ts");
  expect(root.querySelector("pre[data-wrap]")).not.toBeNull();
  expect(root.querySelector("details")?.open).toBe(true);
  const callout = root.querySelector('[data-slot="callout"]')!;
  expect(callout.getAttribute("data-tone")).toBe("caution");
  expect(callout.getAttribute("role")).toBe("note");
});
