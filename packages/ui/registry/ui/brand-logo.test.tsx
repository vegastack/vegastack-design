import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css"; // compiled Tailwind + token theme: real sizes and colours
import { BrandLogo, type Brand } from "./brand-logo";

const BRANDS: Brand[] = [
  "anthropic",
  "openai",
  "google",
  "openrouter",
  "claude",
  "claude-code",
  "chatgpt",
  "codex",
  "cursor",
  "copilot",
  "gemini",
  "slack",
  "gmail",
  "mcp",
];
const LETTERS: Partial<Record<Brand, string>> = {
  openai: "O",
  chatgpt: "C",
  codex: "C",
  copilot: "C",
  slack: "S",
};

const tileOf = (c: HTMLElement) =>
  c.querySelector<HTMLSpanElement>('[data-slot="brand-logo"]')!;

test("without a label the tile is decorative: aria-hidden, no role, a size-5 muted tile", async () => {
  const screen = await render(<BrandLogo brand="anthropic" />);
  const tile = tileOf(screen.container);
  expect(tile.getAttribute("aria-hidden")).toBe("true");
  expect(tile.hasAttribute("role")).toBe(false);
  expect(tile.hasAttribute("aria-label")).toBe(false);
  expect(tile.dataset.size).toBe("default");
  expect(tile.className).toContain("size-5");
  expect(tile.className).toContain("bg-muted");
  expect(tile.className).toContain("text-foreground");
  expect(tile.getBoundingClientRect().width).toBe(20);
  await expectNoA11yViolations(screen.container);
});

test("with a label the tile is an image named by it", async () => {
  const screen = await render(<BrandLogo brand="slack" label="Slack" />);
  const tile = tileOf(screen.container);
  expect(tile.getAttribute("role")).toBe("img");
  expect(tile.getAttribute("aria-label")).toBe("Slack");
  expect(tile.hasAttribute("aria-hidden")).toBe(false);
  await expect
    .element(screen.getByRole("img", { name: "Slack" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test('size="sm" renders a size-4 tile', async () => {
  const screen = await render(<BrandLogo brand="gmail" size="sm" />);
  const tile = tileOf(screen.container);
  expect(tile.dataset.size).toBe("sm");
  expect(tile.className).toContain("size-4");
  expect(tile.className).not.toContain("size-5");
  expect(tile.getBoundingClientRect().width).toBe(16);
});

test("every brand renders: a currentColor glyph, or its first letter where Simple Icons has no CC0 mark", async () => {
  const screen = await render(
    <>
      {BRANDS.map((b) => (
        <BrandLogo key={b} brand={b} label={b} />
      ))}
    </>,
  );
  const tiles = [
    ...screen.container.querySelectorAll<HTMLSpanElement>(
      '[data-slot="brand-logo"]',
    ),
  ];
  expect(tiles).toHaveLength(14);
  for (const tile of tiles) {
    const brand = tile.dataset.brand as Brand;
    const letter = LETTERS[brand];
    if (letter) {
      expect(tile.dataset.mark, brand).toBe("letter");
      expect(tile.querySelector("svg"), brand).toBeNull();
      expect(tile.textContent, brand).toBe(letter);
    } else {
      expect(tile.dataset.mark, brand).toBe("glyph");
      const svg = tile.querySelector("svg")!;
      expect(svg, brand).not.toBeNull();
      expect(svg.getAttribute("fill"), brand).toBe("currentColor");
      expect(svg.querySelectorAll("path"), brand).toHaveLength(1);
      // Monochrome: the glyph paints in the tile's ink, never a brand colour.
      expect(getComputedStyle(svg.querySelector("path")!).fill).toBe(
        getComputedStyle(tile).color,
      );
    }
  }
  expect(screen.container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  await expectNoA11yViolations(screen.container);
});

test("forwards ref and extra props to the tile", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const screen = await render(
    <BrandLogo brand="mcp" ref={ref} className="rounded-md" title="MCP" />,
  );
  const tile = tileOf(screen.container);
  expect(ref.current).toBe(tile);
  expect(tile.className).toContain("rounded-md");
  expect(tile.className).not.toContain("rounded-sm");
  expect(tile.getAttribute("title")).toBe("MCP");
});
