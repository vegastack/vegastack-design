import "./geometry.css"; // compiled Tailwind + @vegastack token theme
import * as React from "react";
import { render } from "vitest-browser-react";
import { cdp, page } from "vitest/browser";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { Button } from "../registry/ui/button";
import {
  DocumentLayout,
  DocumentLayoutAside,
  DocumentLayoutBody,
  DocumentLayoutContents,
  DocumentLayoutContentsButton,
  DocumentLayoutDecisionBar,
  DocumentLayoutDecisionBarActions,
  DocumentLayoutDecisionBarText,
  DocumentLayoutFloatingButton,
  DocumentLayoutHeader,
  DocumentLayoutIcon,
  DocumentLayoutMargin,
  DocumentLayoutMeta,
  DocumentLayoutMetaBadge,
  DocumentLayoutMetaField,
  DocumentLayoutMetaGroup,
  DocumentLayoutMetaItem,
  DocumentLayoutMetaLink,
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

test("a comment margin keeps the text's width and centre while the width holds it on both sides", async () => {
  await page.viewport(2400, 900);
  // 2XL at 2200: room for the margin on both sides, so the text does not move at all.
  const plain = await measure(2200, { margin: false });
  const roomy = await measure(2200);
  expect(roomy.body.width).toBe(plain.body.width);
  expect(roomy.body.left).toBe(plain.body.left);
  expect(roomy.margin.left).toBe(roomy.body.right);
  expect(roomy.margin.width).toBe(384);
  // XL at 1600: 960 + 384 + 64 leaves 192 before the text — less than the end side's 448, so the
  // start track takes all of it and the text moves to the start by what is missing, no more.
  const plainXl = await measure(1600, { margin: false });
  const xl = await measure(1600);
  expect(xl.body.width).toBe(plainXl.body.width);
  expect(xl.body.left - xl.layout.left).toBe(192);
  expect(xl.layout.right - xl.margin.right).toBe(64);
  expect(plainXl.body.left - xl.body.left).toBe(128);
});

test("the text gives way only when the width can't hold text, margin and gutters", async () => {
  await page.viewport(2400, 900);
  // L from 64rem: at 1040 the margin shows and the text takes what is left, 1040 − 2 × 48 − 320.
  expect((await measure(1040)).body.width).toBe(624);
  expect((await measure(1040, { margin: false })).body.width).toBe(780);
  // L at 1120: 75% is 840 (52rem caps it at 832), but 1120 − 2 × 48 − 320 leaves 704.
  const tight = await measure(1120);
  expect(tight.body.width).toBe(704);
  expect(tight.margin.width).toBe(320);
  expect(tight.body.left - tight.layout.left).toBe(48);
  expect(tight.layout.right - tight.margin.right).toBe(48);
  // Without the margin the same width keeps the tier's text.
  expect((await measure(1120, { margin: false })).body.width).toBe(832);
});

test("Wide is the whole width less the gutters and the margin, up to 1200px", async () => {
  await page.viewport(2400, 900);
  expect(
    (await measure(1200, { measure: "wide", margin: false })).body.width,
  ).toBe(1200 - 2 * 48);
  expect(
    (await measure(1600, { measure: "wide", margin: false })).body.width,
  ).toBe(1200);
  expect(
    (await measure(2200, { measure: "wide", margin: false })).body.width,
  ).toBe(1200);
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

test("a nowrap fact stays on one line with its link truncated, a plain fact wraps whole, and meta lines print", async () => {
  await page.viewport(1440, 900);
  await render(
    <div style={{ width: 320 }}>
      <DocumentLayoutMeta>
        <DocumentLayoutMetaItem nowrap>
          From meeting
          <DocumentLayoutMetaLink href="#m">
            A very long weekly product sync about the lighting range and its
            accessories
          </DocumentLayoutMetaLink>
          · Oct 14
        </DocumentLayoutMetaItem>
        <DocumentLayoutMetaItem>
          <span>
            Updated yesterday by Alexandra Montgomery from the platform
            engineering team
          </span>
        </DocumentLayoutMetaItem>
      </DocumentLayoutMeta>
    </div>,
  );
  const [item, plain] = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-slot=document-layout-meta-item]",
    ),
  ];
  expect(item!.getBoundingClientRect().height).toBeLessThanOrEqual(20);
  // A long plain fact wraps inside the line's width rather than running past the clip.
  const box = slot("document-layout-meta").getBoundingClientRect();
  expect(plain!.getBoundingClientRect().height).toBeGreaterThan(20);
  expect(plain!.getBoundingClientRect().right).toBeLessThanOrEqual(
    box.right + 1,
  );
  const link = slot("document-layout-meta-link");
  expect(link.scrollWidth).toBeGreaterThan(link.clientWidth);
  await cdp().send("Emulation.setEmulatedMedia", { media: "print" });
  try {
    expect(getComputedStyle(slot("document-layout-meta")).display).not.toBe(
      "none",
    );
  } finally {
    await cdp().send("Emulation.setEmulatedMedia", { media: "" });
  }
});

test("on a phone both floating buttons clear a decision bar however tall it wraps", async () => {
  await page.viewport(320, 700);
  await render(
    <DocumentLayout>
      <DocumentLayoutBody>
        <DocumentLayoutDecisionBar aria-label="Your review">
          <DocumentLayoutDecisionBarText>
            Asha Menon asked you to review this page before the supplier meeting
            on Thursday · due Oct 24
          </DocumentLayoutDecisionBarText>
          <DocumentLayoutDecisionBarActions>
            <Button size="sm" variant="ghost">
              Compare
            </Button>
            <Button size="sm" variant="outline">
              Request changes
            </Button>
            <Button size="sm">Approve</Button>
          </DocumentLayoutDecisionBarActions>
        </DocumentLayoutDecisionBar>
        Text
      </DocumentLayoutBody>
      <DocumentLayoutContentsButton />
      <DocumentLayoutFloatingButton>Edit</DocumentLayoutFloatingButton>
    </DocumentLayout>,
  );
  const bar = slot("document-layout-decision-bar").getBoundingClientRect();
  expect(bar.height).toBeGreaterThan(60);
  await vi.waitFor(() => {
    for (const name of [
      "document-layout-contents-button",
      "document-layout-floating-button",
    ])
      expect(
        slot(name).getBoundingClientRect().bottom,
        name,
      ).toBeLessThanOrEqual(bar.top);
  });
});

test("on a phone the page's last lines scroll clear of a decision bar", async () => {
  await page.viewport(320, 700);
  await render(
    <DocumentLayout>
      <DocumentLayoutBody>
        <DocumentLayoutDecisionBar aria-label="Your review">
          <DocumentLayoutDecisionBarText>
            Asha Menon asked you to review this page before the supplier meeting
            on Thursday
          </DocumentLayoutDecisionBarText>
          <DocumentLayoutDecisionBarActions>
            <Button size="sm" variant="outline">
              Request changes
            </Button>
            <Button size="sm">Approve</Button>
          </DocumentLayoutDecisionBarActions>
        </DocumentLayoutDecisionBar>
        <div style={{ height: 2000 }} />
        <p data-testid="last">The last line</p>
      </DocumentLayoutBody>
    </DocumentLayout>,
  );
  await vi.waitFor(() =>
    expect(
      getComputedStyle(slot("document-layout")).getPropertyValue(
        "--document-layout-dock",
      ),
    ).not.toBe(""),
  );
  window.scrollTo(0, document.documentElement.scrollHeight);
  await vi.waitFor(() => {
    const bar = slot("document-layout-decision-bar").getBoundingClientRect();
    const last = document
      .querySelector("[data-testid=last]")!
      .getBoundingClientRect();
    expect(last.bottom).toBeLessThanOrEqual(bar.top);
  });
  window.scrollTo(0, 0);
});

test("first in the body, the decision bar stays under the top bar while the text scrolls", async () => {
  await page.viewport(1440, 900);
  await render(
    <DocumentLayout>
      <DocumentLayoutHeader>
        <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
      </DocumentLayoutHeader>
      <DocumentLayoutBody>
        <DocumentLayoutDecisionBar aria-label="Your review">
          <DocumentLayoutDecisionBarText>
            Review this page
          </DocumentLayoutDecisionBarText>
        </DocumentLayoutDecisionBar>
        <div data-testid="text" style={{ height: 3000 }}>
          Text
        </div>
      </DocumentLayoutBody>
    </DocumentLayout>,
  );
  // 24px between the bar and the text it leads, the gap the header keeps from the text.
  expect(
    document.querySelector("[data-testid=text]")!.getBoundingClientRect().top -
      slot("document-layout-decision-bar").getBoundingClientRect().bottom,
  ).toBe(24);
  window.scrollTo(0, 1200);
  await vi.waitFor(() =>
    expect(
      slot("document-layout-decision-bar").getBoundingClientRect().top,
    ).toBe(56),
  );
  window.scrollTo(0, 0);
});

// ---- The aside: the discussion rail and the pinned outline -------------------------------------

function AsidePage({
  width,
  aside,
  measure,
  margin = false,
}: {
  width: number;
  aside: "discussion" | "outline" | null | undefined;
  measure?: "document" | "wide";
  margin?: boolean;
}) {
  return (
    <div style={{ width }}>
      <DocumentLayout aside={aside} measure={measure} margin={margin}>
        <DocumentLayoutHeader>
          <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
        </DocumentLayoutHeader>
        <DocumentLayoutContents>
          <span className="block h-24 w-6" />
        </DocumentLayoutContents>
        <DocumentLayoutBody>
          <MarkdownView typeScale="document">{PROSE}</MarkdownView>
        </DocumentLayoutBody>
        <DocumentLayoutMargin>Thread</DocumentLayoutMargin>
        <DocumentLayoutAside
          count={2}
          onClose={() => {}}
          tabs={[
            { value: "open", label: "Open", count: 2, content: <p>Open</p> },
            { value: "page", label: "Page", content: <p>Page</p> },
          ]}
        />
        <DocumentLayoutAside kind="outline">
          <p>Seats · Terms</p>
        </DocumentLayoutAside>
      </DocumentLayout>
    </div>
  );
}

async function measureAside(
  width: number,
  aside: "discussion" | "outline" | null | undefined,
  props: { measure?: "document" | "wide"; margin?: boolean } = {},
) {
  const screen = await render(
    <AsidePage width={width} aside={aside} {...props} />,
  );
  const shown = (selector: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    return !!el && getComputedStyle(el).display !== "none";
  };
  const result = {
    layout: slot("document-layout").getBoundingClientRect(),
    body: slot("document-layout-body").getBoundingClientRect(),
    discussion: document
      .querySelector("aside[data-kind=discussion]")!
      .getBoundingClientRect(),
    discussionShown: shown("aside[data-kind=discussion]"),
    outlineShown: shown("aside[data-kind=outline]"),
    marginShown: shown("[data-slot=document-layout-margin]"),
    contentsShown: shown("[data-slot=document-layout-contents]"),
  };
  await screen.unmount();
  return result;
}

test("the discussion opens beside a text that never moves: the same place and width open or closed, at every inline tier", async () => {
  await page.viewport(2400, 900);
  for (const width of [1040, 1200, 1440, 1600, 2200]) {
    const closed = await measureAside(width, null);
    const open = await measureAside(width, "discussion");
    expect(open.body.left, `${width}`).toBe(closed.body.left);
    expect(open.body.width, `${width}`).toBe(closed.body.width);
    expect(closed.discussionShown, `${width}`).toBe(false);
    expect(open.discussionShown, `${width}`).toBe(true);
    // The rail sits after the text, inside the layout's end gutter.
    expect(open.discussion.left, `${width}`).toBe(open.body.right);
    expect(open.discussion.right, `${width}`).toBeLessThanOrEqual(
      open.layout.right,
    );
  }
  // The rail is the margin's track: 20rem at L, 24rem from XL (its 2rem gap inside).
  expect((await measureAside(1200, "discussion")).discussion.width).toBe(320);
  expect((await measureAside(1600, "discussion")).discussion.width).toBe(384);
});

test("an open discussion takes the margin's place; without aside the layout is as before", async () => {
  await page.viewport(2400, 900);
  const open = await measureAside(1600, "discussion", { margin: true });
  expect(open.marginShown).toBe(false);
  expect(open.discussionShown).toBe(true);
  const closed = await measureAside(1600, null, { margin: true });
  expect(closed.marginShown).toBe(true);
  // No aside at all: the old geometry (no track kept) and no rail.
  const none = await measureAside(1600, undefined);
  const plain = await measure(1600, { margin: false });
  expect(none.body.left - none.layout.left).toBe(
    plain.body.left - plain.layout.left,
  );
  expect(none.body.width).toBe(plain.body.width);
  expect(none.discussionShown).toBe(false);
});

test("wide is 1200px less the open aside; a closed aside keeps no track in wide", async () => {
  await page.viewport(2400, 900);
  expect((await measureAside(1600, null, { measure: "wide" })).body.width).toBe(
    1200,
  );
  expect(
    (await measureAside(1600, "discussion", { measure: "wide" })).body.width,
  ).toBe(1600 - 2 * 64 - 384);
  expect(
    (await measureAside(2200, "discussion", { measure: "wide" })).body.width,
  ).toBe(1200);
});

test("the outline pins from XL in place of the contents rail's ticks; below XL the ticks stay", async () => {
  await page.viewport(2400, 900);
  const xl = await measureAside(1600, "outline");
  expect(xl.outlineShown).toBe(true);
  expect(xl.contentsShown).toBe(false);
  const closed = await measureAside(1600, null);
  expect(xl.body.left).toBe(closed.body.left);
  expect(xl.body.width).toBe(closed.body.width);
  const l = await measureAside(1200, "outline");
  expect(l.outlineShown).toBe(false);
  expect(l.contentsShown).toBe(true);
});

test("below L the discussion is a bottom sheet, the whole screen on a phone", async () => {
  await page.viewport(900, 800);
  const screen = await render(<AsidePage width={900} aside="discussion" />);
  const sheet = await vi.waitFor(() => {
    const el = document.querySelector<HTMLElement>(
      "[data-slot=document-layout-aside-sheet]",
    );
    expect(el).not.toBeNull();
    return el!;
  });
  expect(
    getComputedStyle(document.querySelector("aside[data-kind=discussion]")!)
      .display,
  ).toBe("none");
  await expect
    .element(screen.getByRole("dialog", { name: "Comments 2" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("tab", { name: "Open 2" }))
    .toBeInTheDocument();
  expect(Math.round(sheet.getBoundingClientRect().height)).toBe(
    Math.round(800 * 0.7),
  );
  await screen.unmount();

  await page.viewport(390, 844);
  const phone = await render(<AsidePage width={390} aside="discussion" />);
  const full = await vi.waitFor(() => {
    const el = document.querySelector<HTMLElement>(
      "[data-slot=document-layout-aside-sheet]",
    );
    expect(el).not.toBeNull();
    return el!;
  });
  await vi.waitFor(() =>
    expect(Math.round(full.getBoundingClientRect().height)).toBe(844),
  );
  await phone.unmount();
});
