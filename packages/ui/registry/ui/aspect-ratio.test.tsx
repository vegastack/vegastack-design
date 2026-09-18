import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AspectRatio } from "./aspect-ratio";

/** The ratios upstream's docs page documents: default (Usage), Square, Portrait. */
const RATIOS = [
  { label: "widescreen", ratio: 16 / 9 },
  { label: "square", ratio: 1 / 1 },
  { label: "portrait", ratio: 9 / 16 },
] as const;

/** The rendered root, by its slot — the component exposes no role of its own. */
function root(container: Element): HTMLElement {
  const element = container.querySelector<HTMLElement>(
    '[data-slot="aspect-ratio"]',
  );
  expect(element).not.toBeNull();
  return element as HTMLElement;
}

test("renders a div carrying data-slot", async () => {
  const screen = await render(
    <AspectRatio ratio={16 / 9}>
      <span>Content</span>
    </AspectRatio>,
  );
  const element = root(screen.container);
  expect(element.tagName).toBe("DIV");
  expect(element.getAttribute("data-slot")).toBe("aspect-ratio");
});

test("the only exported part renders its children", async () => {
  const screen = await render(
    <AspectRatio ratio={16 / 9}>
      <span data-testid="child">Photo</span>
    </AspectRatio>,
  );
  await expect.element(screen.getByTestId("child")).toBeInTheDocument();
});

test("the recipe is the ratio custom property plus the relative aspect box", async () => {
  const screen = await render(<AspectRatio ratio={16 / 9} />);
  const element = root(screen.container);
  expect(element.className.split(/\s+/)).toContain("relative");
  expect(element.className).toContain("aspect-(--ratio)");
});

test("every documented ratio writes its own --ratio value inline", async () => {
  const seen = new Set<string>();
  for (const { ratio } of RATIOS) {
    const screen = await render(<AspectRatio ratio={ratio} />);
    const value = root(screen.container).style.getPropertyValue("--ratio");
    expect(value).toBe(String(ratio));
    seen.add(value);
  }
  expect(seen.size).toBe(RATIOS.length);
});

test("a caller's className is merged, never replaced (Square, Portrait)", async () => {
  const screen = await render(
    <AspectRatio ratio={1 / 1} className="max-w-48 rounded-lg bg-muted" />,
  );
  const element = root(screen.container);
  const classes = element.className.split(/\s+/);
  expect(classes).toContain("relative");
  expect(classes).toContain("max-w-48");
  expect(classes).toContain("bg-muted");
});

test("arbitrary div props pass through to the element (RTL)", async () => {
  const screen = await render(
    <AspectRatio ratio={16 / 9} dir="rtl" aria-hidden="true" id="hero" />,
  );
  const element = root(screen.container);
  expect(element.getAttribute("dir")).toBe("rtl");
  expect(element.getAttribute("aria-hidden")).toBe("true");
  expect(element.id).toBe("hero");
});

test("FOC-6: the recipe carries no focus glow, even though it has no patch", async () => {
  const screen = await render(<AspectRatio ratio={16 / 9} />);
  const classes = root(screen.container).className;
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toContain("focus-visible:border-ring");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
});

test("no a11y violations — a labelled image inside the box", async () => {
  const screen = await render(
    <AspectRatio ratio={16 / 9}>
      <img
        src="/preview/landscape.svg"
        alt="A scenic landscape"
        className="absolute inset-0 size-full object-cover"
      />
    </AspectRatio>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a decorative image inside the box", async () => {
  const screen = await render(
    <AspectRatio ratio={1 / 1}>
      <img
        src="/preview/landscape.svg"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
    </AspectRatio>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a right-to-left figure", async () => {
  const screen = await render(
    <figure dir="rtl">
      <AspectRatio ratio={16 / 9}>
        <img
          src="/preview/landscape.svg"
          alt="منظر طبيعي جميل"
          className="absolute inset-0 size-full object-cover"
        />
      </AspectRatio>
      <figcaption>منظر طبيعي جميل</figcaption>
    </figure>,
  );
  await expectNoA11yViolations(screen.container);
});
