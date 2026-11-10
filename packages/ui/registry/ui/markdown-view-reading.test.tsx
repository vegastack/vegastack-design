import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { completeStreamingMarkdown, MarkdownView } from "./markdown-view";
import "../../test/geometry.css";

// The reading scale and the citation pill, measured with the compiled token CSS: the class list
// alone cannot say a line keeps its height or a pill sits on the middle line.

/** The class list of a prose root, as a set, so order never matters. */
function classes(element: Element): Set<string> {
  return new Set(element.className.split(/\s+/).filter(Boolean));
}

test("typeScale reading: the document body under the compact headings, 12px paragraphs and lists", async () => {
  const screen = await render(
    <MarkdownView typeScale="reading">
      {"## Answer\n\nOne.\n\n- a\n- b\n\n| A | B |\n| - | - |\n| 1 | 2 |"}
    </MarkdownView>,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="markdown-view"]',
  )!;
  const names = classes(root);
  expect(root.dataset.typeScale).toBe("reading");
  for (const name of [
    "text-sm/6",
    "pointer-coarse:text-base/6.5",
    "[&_h1]:text-lg",
    "[&_h2]:text-base",
    "[&_p]:my-3",
    "[&_ul]:my-3",
    "[&_li]:mt-1",
    "[&_details]:my-3",
  ])
    expect(names.has(name), name).toBe(true);
  for (const name of ["text-sm", "[&_p]:my-2", "[&_details]:my-2"])
    expect(names.has(name), name).toBe(false);
  // Measured: 14/24 (16/26 on a coarse pointer or a narrow window), a table cell at the body's size.
  const p = root.querySelector("p")!;
  expect([
    ["14px", "24px"],
    ["16px", "26px"],
  ]).toContainEqual([
    getComputedStyle(p).fontSize,
    getComputedStyle(p).lineHeight,
  ]);
  expect(getComputedStyle(root.querySelector("td")!).fontSize).toBe(
    getComputedStyle(p).fontSize,
  );
  await expectNoA11yViolations(screen.container);
});

test("a citation is an inline pill on the middle line that keeps the line's height", async () => {
  const screen = await render(
    <MarkdownView
      typeScale="reading"
      citation={(n) => ({ label: `Source ${n}`, content: "IES card" })}
    >
      {"TM-21 [[1]] applies."}
    </MarkdownView>,
  );
  const marker = screen.container.querySelector<HTMLElement>(
    '[data-slot="markdown-citation"]',
  )!;
  expect(marker.tagName).toBe("SPAN");
  expect(screen.container.querySelector("sup")).toBeNull();
  expect(getComputedStyle(marker).verticalAlign).toBe("middle");
  const p = screen.container.querySelector("p")!;
  // One line of text, with the pill inside it: the paragraph is exactly one line high.
  expect(p.getBoundingClientRect().height).toBe(
    parseFloat(getComputedStyle(p).lineHeight),
  );
  const pill = marker.getBoundingClientRect();
  const line = p.getBoundingClientRect();
  expect(pill.top).toBeGreaterThanOrEqual(line.top);
  expect(pill.bottom).toBeLessThanOrEqual(line.bottom);
  // Without onSelect a click opens the card and goes nowhere.
  await screen.getByRole("button", { name: "Source 1" }).click();
  await expect.element(screen.getByText("IES card")).toBeVisible();
});

test("streaming: the last block's open syntax is closed, half-written links and markers wait", () => {
  const cases: [string, string][] = [
    ["Use **TM-21 for `L70", "Use **TM-21 for `L70`**"],
    ["A *projection ", "A *projection*"],
    ["Struck ~~out", "Struck ~~out~~"],
    ["Read [the standard](https://ies.or", "Read the standard"],
    ["Read [the stand", "Read the stand"],
    ["Projected six times [[2", "Projected six times "],
    ["Projected six times [[2]", "Projected six times "],
    ["Done [[2]] and see [1]", "Done [[2]] and see [1]"],
    ["```ts\nconst a = 1;", "```ts\nconst a = 1;\n```"],
    ["- item one\n- item *two", "- item one\n- item *two*"],
    ["Plain text.", "Plain text."],
    ["Use `array[0", "Use `array[0`"],
    ["~~~\n```\nstill code", "~~~\n```\nstill code\n~~~"],
  ];
  for (const [input, output] of cases)
    expect(completeStreamingMarkdown(input), input).toBe(output);
});

test("streaming: a whole marker is a pill even in the last block, a half-written one waits", async () => {
  const screen = await render(
    <MarkdownView
      streaming
      typeScale="reading"
      citation={(n) => ({ label: `Source ${n}` })}
    >
      {
        "LM-80 runs 6,000 hours [[1]].\n\nTM-21 projects **six times [[2]] the [[3"
      }
    </MarkdownView>,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="markdown-view"]',
  )!;
  expect(root.dataset.streaming).toBe("");
  const markers = root.querySelectorAll("[data-slot=markdown-citation]");
  // A list or paragraph still streaming shows its whole markers as pills, never as `[[2]]`.
  expect([...markers].map((m) => m.textContent)).toEqual(["1", "2"]);
  expect(root.textContent).not.toContain("[[");
  // The open `**` is closed: no raw asterisks on screen.
  expect(root.querySelector("strong")?.textContent).toContain("six times");
  expect(root.textContent).not.toContain("**");
});

test("adjacent markers group into one pill, '1 +2', whose card lists every source", async () => {
  const screen = await render(
    <MarkdownView
      citation={(n) => ({ label: `Source ${n}`, content: `Card ${n}` })}
    >
      {"Six times the tested hours [[1]][[2]] [[3]], see [[4]]."}
    </MarkdownView>,
  );
  const markers = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=markdown-citation]",
  );
  expect(markers).toHaveLength(2);
  expect(markers[0]!.textContent).toBe("1+2");
  const pill = screen.getByRole("button", {
    name: "Source 1, Source 2, Source 3",
  });
  await pill.click();
  for (const n of [1, 2, 3])
    await expect.element(screen.getByText(`Card ${n}`)).toBeVisible();
  expect(markers[1]!.textContent).toBe("4");
});

test("streaming keeps reference definitions across blocks", async () => {
  const screen = await render(
    <MarkdownView streaming>
      {"[id]: https://example.com\n\nRead the [docs][id] and"}
    </MarkdownView>,
  );
  expect(screen.container.querySelector("a")?.getAttribute("href")).toBe(
    "https://example.com",
  );
});

test("a group keeps unresolved markers as text, and actionable sources keep a pill each", async () => {
  const half = await render(
    <MarkdownView citation={(n) => (n === 1 ? { label: "Source 1" } : null)}>
      {"Claim [[1]][[2]]."}
    </MarkdownView>,
  );
  expect(
    half.container.querySelectorAll("[data-slot=markdown-citation]"),
  ).toHaveLength(1);
  expect(half.container.textContent).toContain("[[2]]");
  const selected: number[] = [];
  const both = await render(
    <MarkdownView
      citation={(n) => ({
        label: `Clip ${n}`,
        onSelect: () => selected.push(n),
      })}
    >
      {"Said twice [[1]][[2]]."}
    </MarkdownView>,
  );
  await both.getByRole("button", { name: "Clip 2" }).click();
  expect(selected).toEqual([2]);
});
