import "./geometry.css"; // compiled Tailwind + @vegastack token theme
import * as React from "react";
import { render } from "vitest-browser-react";
import { cdp, page } from "vitest/browser";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { Button } from "../registry/ui/button";
import {
  DocumentLayout,
  DocumentLayoutBody,
  DocumentLayoutContents,
  DocumentLayoutHeader,
  DocumentLayoutMargin,
  DocumentLayoutSkeleton,
  useDocumentLayoutTier,
  type DocumentLayoutTier,
} from "../registry/ui/document-layout";
import { MarkdownView } from "../registry/ui/markdown-view";
import { TextEdit, preloadTextEdit } from "../registry/ui/text-edit";
// The measure is set in `ch` of Geist: load the real face, or the lane measures a fallback font.
import geistVariable from "../../../apps/docs/node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2?url";

/**
 * The document type scale (TYP-20), `DocumentLayout`'s measure and tiers, and Button's coarse hit
 * area (A11Y-24), measured in compiled CSS: a reading measure of about 67 characters, the 14/24
 * and 16/26 metrics, the tier each width lands in, no shift from the read view into the editor,
 * and a 44px target on a coarse pointer (emulated through CDP touch emulation, which makes
 * `(pointer: coarse)` match).
 */

beforeAll(async () => {
  const face = new FontFace("Geist", `url(${geistVariable})`, {
    weight: "100 900",
  });
  document.fonts.add(await face.load());
  await preloadTextEdit();
});
afterEach(async () => {
  await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page.viewport(414, 896);
});

const PROSE =
  "Pricing for the annual plan is set per seat and billed once a year. Teams that grow during the term add seats at the same rate, prorated to the renewal date, and a team that shrinks keeps its seats until the term ends. Discounts apply from twenty seats, and every plan includes the same support, the same storage and the same security review, so the choice between plans is about the number of people, never about features.";

/** How many characters each full line of a paragraph holds (the last, partial line excluded). */
function charactersPerLine(paragraph: HTMLElement): number[] {
  const text = paragraph.firstChild as Text;
  const range = document.createRange();
  const lines: number[] = [];
  let top: number | null = null;
  let count = 0;
  for (let index = 0; index < text.length; index++) {
    range.setStart(text, index);
    range.setEnd(text, index + 1);
    const rect = range.getClientRects()[0];
    if (!rect) continue;
    if (top !== null && rect.top > top + 4) {
      lines.push(count);
      count = 0;
    }
    if (top === null || rect.top > top + 4) top = rect.top;
    count++;
  }
  return lines;
}

function Page({
  width,
  measure,
  margin = true,
  contents = true,
  onTier,
}: {
  width: number;
  measure?: "document" | "wide";
  margin?: boolean;
  /** Render the contents rail (it takes no column, so the text never moves for it). */
  contents?: boolean;
  onTier?: (tier: DocumentLayoutTier) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const tier = useDocumentLayoutTier(ref);
  React.useEffect(() => {
    onTier?.(tier);
  }, [tier, onTier]);
  return (
    <div style={{ width }}>
      <DocumentLayout ref={ref} margin={margin} measure={measure}>
        <DocumentLayoutHeader>
          <h1 className="text-4xl font-semibold">Pricing v2</h1>
        </DocumentLayoutHeader>
        {contents ? (
          <DocumentLayoutContents>
            <span data-testid="rail" className="block h-24 w-6" />
          </DocumentLayoutContents>
        ) : null}
        <DocumentLayoutBody>
          <MarkdownView typeScale="document">
            {`# Pricing\n\n${PROSE}\n\n## Seats\n\n${PROSE}\n\n### Terms\n\n${PROSE}`}
          </MarkdownView>
        </DocumentLayoutBody>
        <DocumentLayoutMargin>Thread</DocumentLayoutMargin>
      </DocumentLayout>
    </div>
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot=${name}]`)!;
const px = (value: string) => Number.parseFloat(value);

test("1440: 14/24 text at a measure of about 67 characters, 12px paragraphs, 24 · 20 · 16 headings", async () => {
  await page.viewport(1440, 900);
  await render(<Page width={1120} />);
  const paragraph = document.querySelector<HTMLElement>(
    "[data-slot=markdown-view] p",
  )!;
  const style = getComputedStyle(paragraph);
  expect(style.fontSize).toBe("14px");
  expect(style.lineHeight).toBe("24px");
  expect(style.marginBottom).toBe("12px");
  const lines = charactersPerLine(paragraph);
  expect(lines.length).toBeGreaterThan(3);
  const average = lines.reduce((sum, n) => sum + n, 0) / lines.length;
  expect(average).toBeGreaterThanOrEqual(64);
  expect(average).toBeLessThanOrEqual(71);
  // The measure is the body column's width: 47ch of the body font.
  expect(
    slot("document-layout-body").getBoundingClientRect().width,
  ).toBeCloseTo(47 * 14 * 0.663, -1);
  const sizes = ["h1", "h2", "h3"].map((tag) => {
    const heading = getComputedStyle(
      document.querySelector(`[data-slot=markdown-view] ${tag}`)!,
    );
    return `${tag} ${heading.fontSize}/${heading.lineHeight}`;
  });
  expect(sizes).toEqual(["h1 24px/32px", "h2 20px/28px", "h3 16px/24px"]);
  // The first block of the document starts flush with the column.
  expect(
    getComputedStyle(document.querySelector("[data-slot=markdown-view] h1")!)
      .marginTop,
  ).toBe("0px");
});

test("a narrow window reads at 16/26 and keeps the same characters a line", async () => {
  await page.viewport(600, 900);
  await render(<Page width={600} margin={false} contents={false} />);
  const paragraph = document.querySelector<HTMLElement>(
    "[data-slot=markdown-view] p",
  )!;
  const style = getComputedStyle(paragraph);
  expect(style.fontSize).toBe("16px");
  expect(style.lineHeight).toBe("26px");
  const lines = charactersPerLine(paragraph);
  const average = lines.reduce((sum, n) => sum + n, 0) / lines.length;
  expect(average).toBeGreaterThanOrEqual(64);
  expect(average).toBeLessThanOrEqual(71);
  // H3 steps up to 18 over 16px body text.
  expect(
    getComputedStyle(document.querySelector("[data-slot=markdown-view] h3")!)
      .fontSize,
  ).toBe("18px");
});

test("a coarse pointer reads at 16/26 at any width", async () => {
  await page.viewport(1440, 900);
  await cdp().send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 5,
  });
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
  await render(<Page width={1120} />);
  const style = getComputedStyle(
    document.querySelector<HTMLElement>("[data-slot=markdown-view] p")!,
  );
  expect(style.fontSize).toBe("16px");
  expect(style.lineHeight).toBe("26px");
});

test("each width lands in its tier, read by useDocumentLayoutTier from the CSS", async () => {
  await page.viewport(1440, 900);
  const tiers: DocumentLayoutTier[] = [];
  const onTier = (tier: DocumentLayoutTier) => tiers.push(tier);
  const screen = await render(<Page width={500} onTier={onTier} />);
  const shown = (name: string) =>
    getComputedStyle(slot(name)).display !== "none";
  const expectTier = async (
    width: number,
    tier: DocumentLayoutTier,
    visible: Record<string, boolean>,
  ) => {
    await screen.rerender(<Page width={width} onTier={onTier} />);
    await vi.waitFor(() => expect(tiers.at(-1)).toBe(tier));
    for (const [name, on] of Object.entries(visible))
      expect(shown(name), `${tier}: ${name}`).toBe(on);
  };
  await expectTier(500, "s", {
    "document-layout-contents": false,
    "document-layout-margin": false,
  });
  await expectTier(700, "m", {
    "document-layout-contents": true,
    "document-layout-margin": false,
  });
  await expectTier(900, "l", {
    "document-layout-contents": true,
    "document-layout-margin": true,
  });
  await expectTier(1120, "xl", {
    "document-layout-contents": true,
    "document-layout-margin": true,
  });
  // XL: text, margin 2rem + 18rem side by side; the rail floats at the inline-end edge, in the
  // grid's 2.5rem gutter, clear of the margin.
  const rail = slot("document-layout-contents").getBoundingClientRect();
  const body = slot("document-layout-body").getBoundingClientRect();
  const margin = slot("document-layout-margin").getBoundingClientRect();
  const layout = slot("document-layout").getBoundingClientRect();
  expect(margin.width).toBe(320);
  expect(margin.left).toBeGreaterThanOrEqual(body.right);
  expect(rail.right).toBe(layout.right);
  expect(rail.left).toBeGreaterThanOrEqual(margin.right);
});

test("the contents rail takes no column: the text sits where it does without one, at every tier", async () => {
  await page.viewport(1440, 900);
  for (const width of [700, 900, 1120]) {
    const without = await render(<Page width={width} contents={false} />);
    const left = slot("document-layout-body").getBoundingClientRect().left;
    const textWidth = slot("document-layout-body").getBoundingClientRect()
      .width;
    await without.unmount();
    const withRail = await render(<Page width={width} />);
    expect(slot("document-layout-body").getBoundingClientRect().left).toBe(
      left,
    );
    expect(slot("document-layout-body").getBoundingClientRect().width).toBe(
      textWidth,
    );
    await withRail.unmount();
  }
});

test("with room for a margin on both sides the text column sits in the middle; the margin hangs to its right", async () => {
  await page.viewport(1440, 900);
  await render(<Page width={1400} />);
  const body = slot("document-layout-body").getBoundingClientRect();
  const layout = slot("document-layout").getBoundingClientRect();
  const margin = slot("document-layout-margin").getBoundingClientRect();
  expect(
    Math.abs(body.left + body.width / 2 - (layout.left + layout.width / 2)),
  ).toBeLessThanOrEqual(1);
  expect(margin.left).toBeGreaterThanOrEqual(body.right);
});

test("with less room the text moves as near the middle as the margin allows, never squeezing its measure", async () => {
  await page.viewport(1440, 900);
  await render(<Page width={1120} />);
  const body = slot("document-layout-body").getBoundingClientRect();
  const layout = slot("document-layout").getBoundingClientRect();
  const margin = slot("document-layout-margin").getBoundingClientRect();
  expect(body.width).toBeCloseTo(47 * 14 * 0.663, -1);
  expect(
    Math.abs(body.left + body.width / 2 - (layout.left + layout.width / 2)),
  ).toBeLessThanOrEqual(24);
  expect(margin.right).toBeLessThanOrEqual(layout.right - 40 + 1);
});

test("Wide grows the text column into the room the window has, up to 60rem", async () => {
  await page.viewport(1440, 900);
  await render(<Page width={1400} measure="wide" />);
  const width = slot("document-layout-body").getBoundingClientRect().width;
  expect(width).toBeGreaterThan(47 * 14 * 0.663 + 100);
  expect(width).toBeLessThanOrEqual(960);
});

test("the skeleton sketches lines at the text's own pitch, on the same grid", async () => {
  await page.viewport(1440, 900);
  await render(
    <div style={{ width: 1120 }}>
      <DocumentLayoutSkeleton margin />
    </div>,
  );
  const lines = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-slot=document-layout-skeleton-line]",
    ),
  ];
  expect(lines).toHaveLength(8);
  expect(lines[0]!.getBoundingClientRect().height).toBe(24);
  expect(
    (lines[0]!.firstElementChild as HTMLElement).getBoundingClientRect().height,
  ).toBe(14);
  // A paragraph gap is 12px, as between real paragraphs.
  expect(
    lines[3]!.getBoundingClientRect().top -
      lines[2]!.getBoundingClientRect().bottom,
  ).toBe(12);
  expect(
    slot("document-layout-body").getBoundingClientRect().width,
  ).toBeCloseTo(47 * 14 * 0.663, -1);
});

test("the editor swaps in for the read view at the document scale without moving the text", async () => {
  await page.viewport(1440, 900);
  const value = `# Pricing\n\n${PROSE}\n\n## Seats\n\n- One seat\n- Two seats\n\n${PROSE}`;
  const screen = await render(
    <div style={{ width: 600 }}>
      <TextEdit
        aria-label="Body"
        format="markdown"
        typeScale="document"
        defaultValue={value}
      />
    </div>,
  );
  const read = screen.container.querySelector<HTMLElement>(
    "[data-slot=text-edit-read]",
  );
  const before = read
    ? read.getBoundingClientRect().height
    : screen.container
        .querySelector<HTMLElement>(".ProseMirror")!
        .getBoundingClientRect().height;
  const editor = await vi.waitFor(() => {
    const node = screen.container.querySelector<HTMLElement>(".ProseMirror");
    if (!node) throw new Error("editor not in yet");
    return node;
  });
  expect(
    Math.abs(editor.getBoundingClientRect().height - before),
  ).toBeLessThanOrEqual(1);
  expect(getComputedStyle(editor.querySelector("p")!).lineHeight).toBe("24px");
});

test("A11Y-24: on a coarse pointer every Button size answers a tap 44px tall and wide, and neighbours' areas never overlap", async () => {
  await page.viewport(1024, 1400);
  await cdp().send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 5,
  });
  const sizes = [
    "xs",
    "sm",
    "default",
    "lg",
    "icon-xs",
    "icon-sm",
    "icon",
    "icon-lg",
  ] as const;
  const screen = await render(
    <div className="flex flex-col items-start gap-16 p-16">
      {/* Each alone (no interactive neighbour beside it), so it expands on every side. */}
      {sizes.map((size) => (
        <div key={size}>
          <Button size={size} variant="outline" aria-label={size}>
            {size.startsWith("icon") ? "+" : "OK"}
          </Button>
        </div>
      ))}
      <div data-testid="row" className="flex gap-0.5">
        {["a", "b", "c"].map((name) => (
          <Button key={name} size="icon-xs" variant="ghost" aria-label={name}>
            +
          </Button>
        ))}
      </div>
    </div>,
  );
  for (const size of sizes) {
    const button = screen
      .getByRole("button", { name: size })
      .element() as HTMLElement;
    const box = button.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    // 21px out from the centre on each axis — inside a 44px target, outside every visual box.
    for (const [x, y] of [
      [cx, cy - 21.5],
      [cx, cy + 21.5],
      [cx - 21.5, cy],
      [cx + 21.5, cy],
    ] as const) {
      const hit = document.elementFromPoint(x, y);
      expect(
        hit === button || button.contains(hit),
        `${size} at ${x - cx},${y - cy}`,
      ).toBe(true);
    }
  }
  // A dense row — the find bar's 24px buttons 2px apart: the hit areas never overlap. Every point
  // of each button's own box lands on that button (a neighbour's area never steals it), and each
  // is still 44px tall.
  const row = screen.getByTestId("row").element().getBoundingClientRect();
  const buttons = ["a", "b", "c"].map(
    (name) => screen.getByRole("button", { name }).element() as HTMLElement,
  );
  const owner = (x: number, y: number) =>
    buttons.find((button) => {
      const hit = document.elementFromPoint(x, y);
      return hit === button || button.contains(hit);
    }) ?? null;
  for (const button of buttons) {
    const box = button.getBoundingClientRect();
    const cy = box.top + box.height / 2;
    for (let x = Math.ceil(box.left) + 0.5; x < box.right; x += 1)
      expect(owner(x, cy), `${button.ariaLabel} at ${x - box.left}`).toBe(
        button,
      );
    const cx = box.left + box.width / 2;
    expect(owner(cx, cy - 21.5)).toBe(button);
    expect(owner(cx, cy + 21.5)).toBe(button);
  }
  expect(row.width).toBeGreaterThan(0);
});

test("print: a code block wraps its long lines on paper", async () => {
  await page.viewport(1440, 900);
  await render(
    <div style={{ width: 400 }}>
      <MarkdownView typeScale="document">
        {"```ts\nconst line = '" + "x".repeat(200) + "';\n```"}
      </MarkdownView>
    </div>,
  );
  const pre = document.querySelector<HTMLElement>(
    "[data-slot=code-block-pre]",
  )!;
  expect(getComputedStyle(pre).whiteSpace).toBe("pre");
  await cdp().send("Emulation.setEmulatedMedia", { media: "print" });
  try {
    expect(getComputedStyle(pre).whiteSpace).toBe("pre-wrap");
    expect(getComputedStyle(pre).overflowWrap).toBe("anywhere");
    expect(pre.scrollWidth).toBeLessThanOrEqual(pre.clientWidth + 1);
  } finally {
    await cdp().send("Emulation.setEmulatedMedia", { media: "" });
  }
});
