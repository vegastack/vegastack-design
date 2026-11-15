import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TextSpinner } from "./text-spinner";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

test("working is the default: thirteen bolt dots, each striking on its own row, hidden from assistive technology", async () => {
  const screen = await render(<TextSpinner />);
  const root = slot(screen.container, "text-spinner");
  expect(root.dataset.variant).toBe("working");
  expect(root.className).toContain("text-muted-foreground");
  const bolt = slot(screen.container, "text-spinner-bolt");
  expect(bolt.getAttribute("aria-hidden")).toBe("true");
  expect(bolt.getAttribute("class")).not.toContain("motion-pulse");
  const dots = [...bolt.querySelectorAll("circle")];
  expect(dots).toHaveLength(13);
  // Six rows, top to bottom: each dot starts its row's frame later, so the bolt fills downwards.
  expect(
    new Set(dots.map((dot) => dot.style.getPropertyValue("--vs-row"))),
  ).toEqual(new Set(["0", "1", "2", "3", "4", "5"]));
  for (const dot of dots)
    expect(dot.getAttribute("class")).toBe("motion-strike");
});

test("waiting pulses the whole bolt and leaves the dots unstepped", async () => {
  const screen = await render(<TextSpinner variant="waiting" />);
  expect(slot(screen.container, "text-spinner").dataset.variant).toBe(
    "waiting",
  );
  const bolt = slot(screen.container, "text-spinner-bolt");
  expect(bolt.getAttribute("class")).toContain("motion-pulse");
  for (const dot of bolt.querySelectorAll("circle")) {
    expect(dot.getAttribute("class")).toBeNull();
    expect(dot.style.getPropertyValue("--vs-row")).toBe("");
  }
});

test("a screen reader hears the label, Working by default, and nothing when the label is empty", async () => {
  const named = await render(<TextSpinner />);
  expect(named.container.querySelector(".sr-only")?.textContent).toBe(
    "Working",
  );
  const custom = await render(<TextSpinner label="Reconnecting" />);
  expect(custom.container.querySelector(".sr-only")?.textContent).toBe(
    "Reconnecting",
  );
  const silent = await render(<TextSpinner label="" />);
  expect(silent.container.querySelector(".sr-only")).toBeNull();
});

test("no a11y violations — working and waiting", async () => {
  const screen = await render(
    <p>
      <TextSpinner /> Searching <TextSpinner variant="waiting" label="" />
    </p>,
  );
  await expectNoA11yViolations(screen.container);
});

test("compiled: the bolt is as tall as capital letters, in a fixed slot, on the two loader utilities", async () => {
  const screen = await render(
    <p className="text-sm">
      <TextSpinner label="" />
      <TextSpinner variant="waiting" label="" />
    </p>,
  );
  const [working, waiting] = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="text-spinner"]',
    ),
  ];
  const fontSize = parseFloat(getComputedStyle(working!).fontSize);
  const bolt = slot(working!, "text-spinner-bolt").getBoundingClientRect();
  expect(bolt.height).toBeCloseTo(fontSize * 0.72, 0);
  expect(bolt.width).toBeCloseTo(fontSize * 0.48, 0);
  expect(working!.getBoundingClientRect().width).toBeCloseTo(fontSize * 0.6, 0);
  expect(
    getComputedStyle(working!.querySelector("circle")!).animationName,
  ).toBe("vs-strike");
  expect(
    getComputedStyle(slot(waiting!, "text-spinner-bolt")).animationName,
  ).toBe("vs-pulse");
});
