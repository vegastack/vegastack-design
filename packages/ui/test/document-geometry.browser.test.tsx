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
  DocumentLayoutIcon,
  DocumentLayoutMargin,
  DocumentLayoutMeta,
  DocumentLayoutMetaBadge,
  DocumentLayoutMetaField,
  DocumentLayoutMetaGroup,
  DocumentLayoutMetaItem,
  DocumentLayoutSkeleton,
  DocumentLayoutTitle,
  DocumentLayoutTitleGroup,
  useDocumentLayoutTier,
  type DocumentLayoutTier,
} from "../registry/ui/document-layout";
import { MarkdownView } from "../registry/ui/markdown-view";
import { TableOfContents } from "../registry/ui/table-of-contents";
import { TextEdit, preloadTextEdit } from "../registry/ui/text-edit";
// Characters a line are counted in Geist: load the real face, or the lane measures a fallback font.
import geistVariable from "../../../apps/docs/node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2?url";

/**
 * The document type scale (TYP-20), `DocumentLayout`'s fluid column and tiers, and Button's
 * coarse hit area (A11Y-24), measured in compiled CSS: the 14/24 and 16/26 metrics, the text
 * column each width gets, the tier it lands in, no shift from the read view into the editor,
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
  /** Render the contents rail (its gutter is kept either way, so the text never moves for it). */
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
          <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
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

test("14/24 text, 12px paragraphs, 24 · 20 · 16 headings", async () => {
  await page.viewport(1440, 900);
  await render(<Page width={1120} />);
  const paragraph = document.querySelector<HTMLElement>(
    "[data-slot=markdown-view] p",
  )!;
  const style = getComputedStyle(paragraph);
  expect(style.fontSize).toBe("14px");
  expect(style.lineHeight).toBe("24px");
  expect(style.marginBottom).toBe("12px");
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

test("a narrow window reads at 16/26 across the whole width", async () => {
  await page.viewport(600, 900);
  await render(<Page width={600} margin={false} contents={false} />);
  const paragraph = document.querySelector<HTMLElement>(
    "[data-slot=markdown-view] p",
  )!;
  const style = getComputedStyle(paragraph);
  expect(style.fontSize).toBe("16px");
  expect(style.lineHeight).toBe("26px");
  expect(slot("document-layout-body").getBoundingClientRect().width).toBe(600);
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
  await page.viewport(2200, 900);
  const tiers: DocumentLayoutTier[] = [];
  const onTier = (tier: DocumentLayoutTier) => tiers.push(tier);
  const screen = await render(<Page width={500} onTier={onTier} />);
  const shown = (name: string) =>
    getComputedStyle(slot(name)).display !== "none";
  const expectTier = async (
    width: number,
    tier: DocumentLayoutTier,
    contents: boolean,
    margin: boolean,
  ) => {
    await screen.rerender(<Page width={width} onTier={onTier} />);
    await vi.waitFor(() => expect(tiers.at(-1)).toBe(tier));
    expect(shown("document-layout-contents"), `${tier}: contents`).toBe(
      contents,
    );
    expect(shown("document-layout-margin"), `${tier}: margin`).toBe(margin);
  };
  await expectTier(500, "s", false, false);
  await expectTier(800, "m", true, false);
  await expectTier(1120, "l", true, true);
  await expectTier(1600, "xl", true, true);
  await expectTier(2000, "2xl", true, true);
});

/** The text column's width with and without the margin, and the block's place, at `width`. */
async function measure(
  width: number,
  props: { margin?: boolean; measure?: "document" | "wide" } = {},
) {
  const screen = await render(<Page width={width} {...props} />);
  const box = (name: string) => slot(name).getBoundingClientRect();
  const result = {
    layout: box("document-layout"),
    body: box("document-layout-body"),
    rail: box("document-layout-contents"),
    margin: box("document-layout-margin"),
  };
  await screen.unmount();
  return result;
}

test("the text is fluid — about three quarters of the layout — within each tier's bounds", async () => {
  await page.viewport(2400, 900);
  const text = async (width: number) =>
    (await measure(width, { margin: false })).body.width;
  // M: max(36rem, 75%); L: clamp(40rem, 75%, 52rem); XL 60rem; 2XL 64rem.
  expect(await text(700)).toBe(576);
  expect(await text(900)).toBe(675);
  expect(await text(1100)).toBe(825);
  expect(await text(1300)).toBe(832);
  expect(await text(1600)).toBe(960);
  expect(await text(2200)).toBe(1024);
});

test("characters a line at each tier's text width, in Geist at 14px", async () => {
  await page.viewport(2400, 900);
  const perTier: Record<string, number> = {};
  for (const [tier, width] of [
    ["m", 800],
    ["l", 1300],
    ["xl", 1600],
    ["2xl", 2200],
  ] as const) {
    const screen = await render(<Page width={width} margin={false} />);
    const lines = charactersPerLine(
      document.querySelector<HTMLElement>("[data-slot=markdown-view] p")!,
    );
    perTier[tier] = Math.round(
      lines.reduce((sum, n) => sum + n, 0) / lines.length,
    );
    await screen.unmount();
  }
  // About 88 a line at M's 36rem, rising to about 160 at 2XL's 64rem (0.663em a character).
  expect(perTier.m).toBeGreaterThanOrEqual(80);
  expect(perTier["2xl"]).toBeLessThanOrEqual(170);
  expect(perTier.m! < perTier.l! && perTier.l! < perTier.xl!).toBe(true);
  console.info("characters a line", JSON.stringify(perTier));
});

test("the contents rail sits in the gutter before the text and never moves it", async () => {
  await page.viewport(2400, 900);
  for (const width of [800, 1120, 1600, 2200]) {
    const withRail = await measure(width);
    const without = await render(<Page width={width} contents={false} />);
    const body = slot("document-layout-body").getBoundingClientRect();
    await without.unmount();
    expect(body.left, `${width}`).toBe(withRail.body.left);
    expect(body.width, `${width}`).toBe(withRail.body.width);
    expect(withRail.rail.right, `${width}`).toBeLessThanOrEqual(
      withRail.body.left,
    );
    expect(withRail.rail.left, `${width}`).toBeGreaterThanOrEqual(
      withRail.layout.left,
    );
  }
});

test("a comment margin keeps the text's width and shifts the block to the start", async () => {
  await page.viewport(2400, 900);
  for (const width of [1600, 2200]) {
    const plain = await measure(width, { margin: false });
    const withMargin = await measure(width);
    expect(withMargin.body.width, `${width}`).toBe(plain.body.width);
    // The block — text and margin — is centred, so the text moves by half the margin.
    expect(plain.body.left - withMargin.body.left, `${width}`).toBe(
      withMargin.margin.width / 2,
    );
    expect(withMargin.margin.left).toBe(withMargin.body.right);
    expect(withMargin.margin.width).toBe(384);
    const middle = withMargin.layout.left + withMargin.layout.width / 2;
    const block = (withMargin.body.left + withMargin.margin.right) / 2;
    expect(Math.abs(block - middle)).toBeLessThanOrEqual(1);
  }
});

test("the text gives way only when the width can't hold text, margin and gutters", async () => {
  await page.viewport(2400, 900);
  // L from 60rem: at 960 the margin shows and the text takes what is left, 960 − 2 × 48 − 320.
  expect((await measure(960)).body.width).toBe(544);
  expect((await measure(960, { margin: false })).body.width).toBe(720);
  // L at 1120: 75% is 840 (52rem caps it at 832), but 1120 − 2 × 48 − 320 leaves 704.
  const tight = await measure(1120);
  expect(tight.body.width).toBe(704);
  expect(tight.margin.width).toBe(320);
  expect(tight.body.left - tight.layout.left).toBe(48);
  expect(tight.layout.right - tight.margin.right).toBe(48);
  // Without the margin the same width keeps the tier's text.
  expect((await measure(1120, { margin: false })).body.width).toBe(832);
});

test("Wide is the whole width less the gutters and the margin", async () => {
  await page.viewport(2400, 900);
  expect(
    (await measure(1600, { measure: "wide", margin: false })).body.width,
  ).toBe(1600 - 2 * 64);
  expect((await measure(1600, { measure: "wide" })).body.width).toBe(
    1600 - 2 * 64 - 384,
  );
  expect(
    (await measure(800, { measure: "wide", margin: false })).body.width,
  ).toBe(800 - 2 * 48);
});

test("the open contents panel takes the pointer over the text, and its frame bridges the gap from the rail", async () => {
  await page.viewport(1440, 900);
  const outline = ["Pricing", "Seats", "Terms"].map((text, index) => ({
    id: `h-${index}`,
    level: index + 1,
    text,
  }));
  await render(
    <div style={{ width: 1120 }}>
      <DocumentLayout margin>
        <DocumentLayoutContents>
          <TableOfContents
            variant="rail"
            side="start"
            sticky={false}
            items={outline}
          />
        </DocumentLayoutContents>
        <DocumentLayoutBody>
          {/* Positioned content (an editor's blocks are) paints over static siblings. */}
          <div className="relative h-96">Text</div>
        </DocumentLayoutBody>
        <DocumentLayoutMargin>
          <div className="relative h-96">Thread</div>
        </DocumentLayoutMargin>
      </DocumentLayout>
    </div>,
  );
  const nav = slot("table-of-contents");
  const trigger = slot("table-of-contents-trigger");
  await page.elementLocator(trigger).hover();
  await vi.waitFor(() => expect(nav.hasAttribute("data-expanded")).toBe(true));
  // Every point between the rail and the panel belongs to the outline: a pointer crossing it
  // never leaves, so the panel never starts to close on the way.
  const rail = trigger.getBoundingClientRect();
  const panel = slot("table-of-contents-panel").getBoundingClientRect();
  expect(panel.left).toBeGreaterThan(rail.right);
  for (let x = Math.ceil(rail.right); x < panel.left; x++) {
    const hit = document.elementFromPoint(x, rail.top + 4);
    expect(nav.contains(hit), `x ${x}`).toBe(true);
  }
  // Every row is hit where it is drawn, over the positioned text.
  const links = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-slot=table-of-contents-link]",
    ),
  ];
  expect(panel.right).toBeGreaterThan(
    slot("document-layout-body").getBoundingClientRect().left,
  );
  for (const link of links) {
    const rect = link.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    expect(link === hit || link.contains(hit), link.textContent ?? "").toBe(
      true,
    );
  }
  // Rows indent by level: 12px a step (once the panel has finished scaling in).
  await vi.waitFor(() => {
    const starts = links.map(
      (link) =>
        link
          .querySelector("[data-slot=table-of-contents-label]")!
          .getBoundingClientRect().left,
    );
    expect(starts[1]! - starts[0]!).toBe(12);
    expect(starts[2]! - starts[1]!).toBe(12);
  });
});

test("the skeleton's header is as tall as the page's — with an emoji or an Add icon", async () => {
  await page.viewport(1440, 900);
  const top = () => slot("document-layout-body").getBoundingClientRect().top;
  const header = (icon: React.ReactNode) => (
    <div style={{ width: 1120 }}>
      <DocumentLayout margin>
        <DocumentLayoutHeader>
          <DocumentLayoutTitleGroup>
            {icon}
            <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
          </DocumentLayoutTitleGroup>
          <p className="text-sm text-muted-foreground">Updated 3m ago</p>
          <p className="text-sm text-muted-foreground">Owner Sanjay</p>
        </DocumentLayoutHeader>
        <DocumentLayoutBody>Text</DocumentLayoutBody>
      </DocumentLayout>
    </div>
  );
  const tops: number[] = [];
  for (const icon of [
    <DocumentLayoutIcon key="add" reveal>
      <Button variant="ghost" size="xs">
        Add icon
      </Button>
    </DocumentLayoutIcon>,
    <DocumentLayoutIcon key="emoji">
      <span aria-hidden>📘</span>
    </DocumentLayoutIcon>,
    <DocumentLayoutIcon key="change">
      <Button variant="ghost" aria-label="Change icon">
        <span aria-hidden>📘</span>
      </Button>
    </DocumentLayoutIcon>,
  ]) {
    const screen = await render(header(icon));
    tops.push(top());
    await screen.unmount();
  }
  expect(new Set(tops).size).toBe(1);
  await render(
    <div style={{ width: 1120 }}>
      <DocumentLayoutSkeleton margin icon metaLines={2} />
    </div>,
  );
  expect(top()).toBe(tops[0]);
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
  expect(slot("document-layout-body").getBoundingClientRect().width).toBe(704);
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

/** A status row: owner and its chip as one unit, then a flag and a review chip with a short form. */
function StatusRow({
  width,
  variant = "status",
}: {
  width: number;
  variant?: "status" | "line";
}) {
  return (
    <div style={{ width }}>
      <DocumentLayoutMeta variant={variant} watch={[width]}>
        <DocumentLayoutMetaGroup>
          <DocumentLayoutMetaField label="Owner">
            Sanjay Desai
          </DocumentLayoutMetaField>
          <DocumentLayoutMetaBadge label="Verified · Oct 14" short="Verified" />
        </DocumentLayoutMetaGroup>
        <DocumentLayoutMetaGroup kind="flow">
          <DocumentLayoutMetaItem>
            <DocumentLayoutMetaBadge variant="warning">
              2 out of date
            </DocumentLayoutMetaBadge>
          </DocumentLayoutMetaItem>
          <DocumentLayoutMetaItem yields>
            <DocumentLayoutMetaBadge
              label="Approved · Oct 19 by Asha Menon"
              short="Approved"
            />
          </DocumentLayoutMetaItem>
        </DocumentLayoutMetaGroup>
      </DocumentLayoutMeta>
    </div>
  );
}

const metaRow = () => slot("document-layout-meta-row");

test("the status row is one 24px line with room, its chips at full words; tight, they drop to short forms before it wraps", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<StatusRow width={900} />);
  await vi.waitFor(() =>
    expect(metaRow().getBoundingClientRect().height).toBe(24),
  );
  expect(document.querySelectorAll("[data-compact]")).toHaveLength(0);
  expect(metaRow().hasAttribute("data-wrap")).toBe(false);
  // Narrower: the longest rest goes first, the row stays one line.
  await screen.rerender(<StatusRow width={420} />);
  await vi.waitFor(() =>
    expect(document.querySelectorAll("[data-compact]").length).toBeGreaterThan(
      0,
    ),
  );
  expect(metaRow().getBoundingClientRect().height).toBe(24);
  expect(metaRow().hasAttribute("data-wrap")).toBe(false);
  // Too narrow even for short forms: it wraps instead of truncating.
  await screen.rerender(<StatusRow width={220} />);
  await vi.waitFor(() =>
    expect(metaRow().hasAttribute("data-wrap")).toBe(true),
  );
  // A plain line is never fitted: what the status row left behind is cleared.
  await screen.rerender(<StatusRow width={220} variant="line" />);
  await vi.waitFor(() => {
    expect(metaRow().hasAttribute("data-wrap")).toBe(false);
    expect(document.querySelectorAll("[data-compact]")).toHaveLength(0);
  });
});

test("on a phone the status row is two lines from the first paint; the clipped row never starts a line with a dot", async () => {
  await page.viewport(375, 812);
  await render(<StatusRow width={343} />);
  expect(metaRow().getBoundingClientRect().height).toBeGreaterThanOrEqual(52);
  const box = slot("document-layout-meta").getBoundingClientRect();
  // The first dot sits outside the clip box, so it is never seen.
  const dot = document.querySelector<HTMLElement>(
    "[data-slot=document-layout-meta-dot]",
  )!;
  expect(dot.getBoundingClientRect().right).toBeLessThanOrEqual(box.left + 1);
});
