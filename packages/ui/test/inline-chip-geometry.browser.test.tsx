import "./geometry.css"; // compiled Tailwind + @vegastack token theme
import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import photo from "../../../apps/docs/public/preview/avatar-1.svg?no-inline";
import {
  InlineChip,
  InlineChipProvider,
  type InlineChipPerson,
} from "../registry/ui/inline-chip";
import { FieldCellDisplay } from "../registry/ui/field-cell";
import { MarkdownView } from "../registry/ui/markdown-view";
import { TextEdit, preloadTextEdit } from "../registry/ui/text-edit";

/**
 * A mention chip's avatar — a photo, initials, a photo that fails, an unknown person — stays
 * inside the chip's ground, centred with the text, at every size it is rendered in: a prose
 * heading, paragraph, list, table, an editor, small comment text and large text. A prose root's
 * `img` rule (block, margin, border) once pushed the photo out of the chip, and the initials sat
 * at a fixed 12px whatever the text size.
 */
const people: Record<string, InlineChipPerson> = {
  photo: { name: "Asha Rao", image: photo },
  initials: { name: "Mahesh Anand", hue: "orange" },
  broken: { name: "Broken Image", image: "/missing/avatar.png" },
  gone: { name: "Gone Person", hue: "purple", inactive: true },
};
const chips =
  "[@Asha Rao](mention://user/photo) [@Mahesh Anand](mention://user/initials) [@Broken Image](mention://user/broken) [@Nobody Known](mention://user/unknown) [@Gone Person](mention://user/gone)";
const markdown = [
  `# Heading ${chips}`,
  `Paragraph ${chips}`,
  `- Item ${chips}`,
  `| A | B |\n| --- | --- |\n| Row | ${chips} |`,
].join("\n\n");

async function mountAll() {
  await preloadTextEdit();
  const screen = await render(
    <InlineChipProvider value={{ person: (id) => people[id] ?? null }}>
      <div style={{ width: 1200 }}>
        <MarkdownView typeScale="document">{markdown}</MarkdownView>
        <p className="text-xs">
          Small <InlineChip kind="user" targetId="photo" label="Asha Rao" />{" "}
          <InlineChip kind="user" targetId="initials" label="Mahesh Anand" />
        </p>
        <p className="text-3xl">
          Large <InlineChip kind="user" targetId="photo" label="Asha Rao" />{" "}
          <InlineChip kind="user" targetId="initials" label="Mahesh Anand" />
        </p>
        <p
          className="text-sm wrap-anywhere"
          style={{ width: 120 }}
          data-testid="narrow"
        >
          <InlineChip
            kind="user"
            targetId="initials"
            label="Maheshwaranandakrishnan Anand"
          />{" "}
          <InlineChip kind="user" targetId="initials" label="WWWWWWWWWWWW" />
        </p>
        <p className="text-sm" style={{ width: 160 }}>
          Use the{" "}
          <InlineChip
            kind="product"
            label="Sub Flood lights green 1000 mm 120 W"
            data-testid="product"
          />
        </p>
        <TextEdit
          format="markdown"
          aria-label="Notes"
          defaultValue={`Editor ${chips}`}
          mentionImage={(id) => people[id]?.image ?? null}
        />
      </div>
    </InlineChipProvider>,
  );
  await vi.waitFor(
    () => expect(screen.container.querySelector(".ProseMirror")).not.toBeNull(),
    { timeout: 10_000 },
  );
  // The photo has decoded and the broken one has fallen back to initials, everywhere.
  await vi.waitFor(() => {
    const avatars = [
      ...screen.container.querySelectorAll('[data-slot="inline-chip-avatar"]'),
    ];
    for (const avatar of avatars) {
      const img = avatar.querySelector("img");
      if (
        avatar
          .closest("[data-slot=inline-chip]")
          ?.textContent?.endsWith("Asha Rao")
      )
        expect(img?.complete && img.naturalWidth > 0).toBe(true);
      else if (img) expect(img.complete && img.naturalWidth > 0).toBe(true);
    }
    expect(
      screen.container.querySelectorAll('img[src="/missing/avatar.png"]'),
    ).toHaveLength(0);
  });
  return screen;
}

const within = (inner: DOMRect, outer: DOMRect, slack = 0.5) =>
  inner.top >= outer.top - slack &&
  inner.bottom <= outer.bottom + slack &&
  inner.left >= outer.left - slack &&
  inner.right <= outer.right + slack;

test("inline-chip-avatar: inside the chip, sized and centred with the text, in every context", async () => {
  const screen = await mountAll();
  const chipEls = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="inline-chip"][data-kind="user"]',
    ),
  ];
  // 5 chips × (heading, paragraph, item, cell, editor) + 2 small + 2 large + 2 narrow.
  expect(chipEls).toHaveLength(31);
  for (const chip of chipEls) {
    const name = `${chip.textContent} in <${chip.closest("h1,p,li,td,.ProseMirror")?.tagName}>`;
    const fontSize = parseFloat(getComputedStyle(chip).fontSize);
    const avatar = chip.querySelector('[data-slot="inline-chip-avatar"]')!;
    const a = avatar.getBoundingClientRect();
    // The chip's own ground: its first line box (a long name may wrap).
    const ground = chip.getClientRects()[0]!;
    expect(within(a, ground), `${name}: avatar inside the chip`).toBe(true);
    expect(a.height, `${name}: avatar 1.1em`).toBeCloseTo(fontSize * 1.1, 0);
    // Centred on the label: the avatar's middle within 1px + 5% of the ground's middle.
    expect(
      Math.abs(a.top + a.height / 2 - (ground.top + ground.height / 2)),
      `${name}: avatar centred`,
    ).toBeLessThanOrEqual(1 + fontSize * 0.05);

    const img = avatar.querySelector("img");
    if (img) {
      const i = img.getBoundingClientRect();
      expect(within(i, a), `${name}: photo fills the avatar`).toBe(true);
      expect(i.width, `${name}: photo fills the avatar`).toBeCloseTo(
        a.width,
        0,
      );
    } else {
      const initials = avatar.querySelector('[data-slot="avatar-fallback"]')!;
      expect(
        parseFloat(getComputedStyle(initials).fontSize),
        `${name}: initials scale with the text`,
      ).toBeCloseTo(fontSize * 0.55, 0);
      const range = document.createRange();
      range.selectNodeContents(initials);
      expect(
        within(range.getBoundingClientRect(), a, 1),
        `${name}: initials inside the avatar`,
      ).toBe(true);
    }
    expect(chip).toHaveAttribute("spellcheck", "false");
  }
  // An inactive member keeps their name and gains the "Inactive" badge, inside the chip.
  const gone = chipEls.filter((c) => c.textContent?.includes("Gone Person"));
  expect(gone).toHaveLength(5);
  for (const chip of gone) {
    expect(chip).toHaveAttribute("data-inactive");
    const badge = chip.querySelector('[data-slot="inline-chip-badge"]')!;
    expect(badge).toHaveTextContent("Inactive");
    const lines = [...chip.getClientRects()];
    const b = badge.getBoundingClientRect();
    expect(
      lines.some((line) => within(b, line, 1.5)),
      `${chip.textContent}: badge inside the chip`,
    ).toBe(true);
  }
});

test("inline-chip-wrap: a long first word still breaks inside a narrow column", async () => {
  const screen = await mountAll();
  const column = screen.getByTestId("narrow").element();
  expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
});

test("inline-chip-editor: a mention in the editor is atomic and never spellchecked", async () => {
  const screen = await mountAll();
  const editor = screen.container.querySelector(".ProseMirror")!;
  const chips = [...editor.querySelectorAll('[data-slot="inline-chip"]')];
  expect(chips).toHaveLength(5);
  for (const chip of chips) {
    const view = chip.closest("[data-node-view-wrapper]")!;
    expect(view).toHaveAttribute("contenteditable", "false");
    expect(view).toHaveAttribute("spellcheck", "false");
  }
});

test("inline-chip-lead: a wrapping chip never breaks between its icon and the label's first word", async () => {
  const screen = await mountAll();
  const chip = screen.getByTestId("product").element();
  const lead = chip.querySelector("[data-slot=inline-chip-lead]")!;
  const icon = lead
    .querySelector("[data-slot=inline-chip-icon]")!
    .getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(lead.lastElementChild!);
  const word = range.getBoundingClientRect();
  expect(lead.textContent).toBe("Sub");
  const centre = (r: DOMRect) => r.top + r.height / 2;
  // On one line: their centres sit well within a line's height of each other.
  expect(Math.abs(centre(word) - centre(icon))).toBeLessThan(6);
  expect(chip.getClientRects().length).toBeGreaterThan(1);
});

test("a cell's link chips never break inside a name, even in a narrow cell inside prose", async () => {
  // An editor's prose breaks long words (`overflow-wrap: break-word`) and a chip's first word may
  // wrap in running text; in a cell each chip stays one line (an inline chip broken across lines
  // has one box per line), and a cell that grows wraps whole chips.
  const screen = await render(
    <div
      style={{
        width: 120,
        overflowWrap: "break-word",
        whiteSpace: "break-spaces",
      }}
    >
      <FieldCellDisplay
        type="link"
        className="flex-wrap"
        value={[
          { id: "a", label: "Meridian Hotels", kind: "customer", href: "/c/a" },
          {
            id: "b",
            label: "Skyline Developers",
            kind: "customer",
            href: "/c/b",
          },
        ]}
      />
    </div>,
  );
  const tops = new Set<number>();
  for (const name of ["Meridian", "Skyline"]) {
    const chip = screen
      .getByText(name, { exact: false })
      .element()
      .closest("[data-slot=inline-chip]")!;
    expect(chip.getClientRects().length).toBe(1);
    tops.add(Math.round(chip.getBoundingClientRect().top));
  }
  expect(tops.size).toBe(2);
});
