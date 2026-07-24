import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { MarkdownView } from "./markdown-view";

test("renders a heading from markdown", async () => {
  const screen = await render(<MarkdownView># Hello world</MarkdownView>);
  const heading = screen.getByRole("heading", {
    level: 1,
    name: "Hello world",
  });
  await expect.element(heading).toBeInTheDocument();
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
  const link = screen.getByRole("link", { name: "link" });
  await expect.element(link).toHaveAttribute("href", "https://example.com");
  await expect.element(link).toHaveAttribute("rel", "noreferrer noopener");
  // Inline code + lists exist in the DOM
  expect(container.querySelector("code")).not.toBeNull();
  expect(container.querySelector("ul")).not.toBeNull();
  expect(container.querySelector("ol")).not.toBeNull();
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
  // remark-gfm task lists serialize disabled checkboxes
  expect(container.querySelector('input[type="checkbox"]')).not.toBeNull();
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
