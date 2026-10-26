import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css"; // compiled Tailwind + token theme: real sizes and colours
import { QrCode } from "./qr-code";

const URL = "https://app.example.com/meetings/42/record?from=web";

const svgOf = (c: HTMLElement) =>
  c.querySelector<SVGSVGElement>('svg[data-slot="qr-code"]')!;
const extentOf = (svg: SVGSVGElement) =>
  Number(svg.getAttribute("viewBox")!.split(" ")[2]);

test("draws one crisp path of dark modules, named as an image, at size-40 by default", async () => {
  const screen = await render(
    <QrCode value={URL} label="Open this meeting on your phone" />,
  );
  const svg = svgOf(screen.container);
  expect(svg.dataset.state).toBe("ready");
  expect(svg.dataset.errorCorrection).toBe("M");
  expect(svg.getAttribute("shape-rendering")).toBe("crispEdges");
  expect(svg.querySelectorAll("path")).toHaveLength(1);
  expect(svg.querySelector("path")!.getAttribute("d")).toMatch(/^M\d+ \d+h\d+/);
  expect(svg.getAttribute("class")).toContain("size-40");
  await expect
    .element(
      screen.getByRole("img", { name: "Open this meeting on your phone" }),
    )
    .toBeInTheDocument();
  expect(svg.getBoundingClientRect().width).toBe(160);
  await expectNoA11yViolations(screen.container);
});

test("the quiet zone is inside the drawing: 4 modules by default, configurable", async () => {
  const screen = await render(
    <>
      <QrCode value="hello" label="Default zone" />
      <QrCode value="hello" label="Narrow zone" quietZone={2} />
    </>,
  );
  const [wide, narrow] = Array.from(
    screen.container.querySelectorAll<SVGSVGElement>(
      'svg[data-slot="qr-code"]',
    ),
  );
  // "hello" fits version 1: a 21-module matrix.
  expect(extentOf(wide!)).toBe(21 + 8);
  expect(extentOf(narrow!)).toBe(21 + 4);
  // The first dark module (the finder pattern's corner) sits right after the zone.
  expect(wide!.querySelector("path")!.getAttribute("d")).toMatch(/^M4 4h7/);
  expect(narrow!.querySelector("path")!.getAttribute("d")).toMatch(/^M2 2h7/);
});

test("errorCorrection changes the module count for a long value", async () => {
  const screen = await render(
    <>
      <QrCode value={URL} label="Low" errorCorrection="L" />
      <QrCode value={URL} label="High" errorCorrection="H" />
    </>,
  );
  const [low, high] = Array.from(
    screen.container.querySelectorAll<SVGSVGElement>(
      'svg[data-slot="qr-code"]',
    ),
  );
  expect(low!.dataset.errorCorrection).toBe("L");
  expect(high!.dataset.errorCorrection).toBe("H");
  expect(extentOf(high!)).toBeGreaterThan(extentOf(low!));
});

test.each(["light", "dark"])(
  "dark modules on a light tile in the %s theme",
  async (theme) => {
    const screen = await render(
      <div
        className={`${theme === "dark" ? "dark " : ""}bg-background text-foreground`}
      >
        <QrCode value={URL} label={`Scan (${theme})`} />
      </div>,
    );
    const svg = svgOf(screen.container);
    const tile = getComputedStyle(svg).backgroundColor;
    const ink = getComputedStyle(svg.querySelector("path")!).fill;
    // White tile, black ink, whatever the page theme.
    expect(tile).toMatch(/oklch\(1 0 0\)|rgb\(255, 255, 255\)/);
    expect(ink).toMatch(/oklch\(0 0 0\)|rgb\(0, 0, 0\)/);
    expect(getComputedStyle(svg).borderTopLeftRadius).not.toBe("0px");
  },
);

test("an empty or unencodable value draws the empty tile and keeps its name; never throws", async () => {
  const screen = await render(
    <>
      <QrCode value="" label="Nothing yet" />
      <QrCode value={"x".repeat(5000)} label="Too long" />
    </>,
  );
  const [empty, tooLong] = Array.from(
    screen.container.querySelectorAll<SVGSVGElement>(
      'svg[data-slot="qr-code"]',
    ),
  );
  for (const svg of [empty!, tooLong!]) {
    expect(svg.dataset.state).toBe("invalid");
    expect(svg.querySelector("path")).toBeNull();
    expect(extentOf(svg)).toBe(21 + 8);
  }
  await expect
    .element(screen.getByRole("img", { name: "Too long" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("className sizes it; ref reaches the svg", async () => {
  const ref = React.createRef<SVGSVGElement>();
  const screen = await render(
    <QrCode ref={ref} value={URL} label="Scan" className="size-56" />,
  );
  expect(ref.current).toBe(svgOf(screen.container));
  expect(ref.current!.getBoundingClientRect().width).toBe(224);
});

test("renders on the server", async () => {
  const { renderToString } = await import("react-dom/server");
  const html = renderToString(<QrCode value={URL} label="Scan" />);
  expect(html).toContain('role="img"');
  expect(html).toContain("<path");
});
