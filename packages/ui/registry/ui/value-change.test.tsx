import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ValueChange } from "./value-change";

// Every query is scoped to its own render's container — nothing under `packages/ui` has a
// global cleanup, so a document-wide lookup would answer with an earlier test's DOM.
function slot(root: ParentNode, name: string): HTMLElement | null {
  return root.querySelector(`[data-slot="${name}"]`);
}

function srText(root: ParentNode): string {
  return Array.from(root.querySelectorAll(".sr-only"))
    .map((el) => el.textContent)
    .join("|");
}

test("a change renders before in a del, a hidden arrow, and after in an ins", async () => {
  const screen = await render(<ValueChange before="Draft" after="Published" />);
  const root = slot(screen.container, "value-change")!;
  expect(root.dataset.change).toBe("changed");

  const before = slot(root, "value-change-before")!;
  const after = slot(root, "value-change-after")!;
  expect(before.tagName).toBe("DEL");
  expect(before.textContent).toBe("Draft");
  expect(after.tagName).toBe("INS");
  expect(after.textContent).toBe("Published");

  const arrow = slot(root, "value-change-arrow")!;
  expect(arrow.getAttribute("aria-hidden")).toBe("true");
  // Screen readers hear one sentence, built around the visible values.
  expect(root.textContent).toBe("changed from Draft to Published");
  await expectNoA11yViolations(screen.container);
});

test("the inks are the status families' -text tokens, with no underline on the addition", async () => {
  const screen = await render(<ValueChange before={3} after={5} />);
  const before = slot(screen.container, "value-change-before")!.className;
  const after = slot(screen.container, "value-change-after")!.className;
  expect(before).toContain("text-destructive-text");
  expect(before).toContain("line-through");
  expect(after).toContain("text-success-text");
  expect(after).toContain("no-underline");
  expect(
    slot(screen.container, "value-change-arrow")!.getAttribute("class"),
  ).toContain("text-muted-foreground");
});

test("only after is an addition", async () => {
  const screen = await render(<ValueChange before={null} after="Asha" />);
  const root = slot(screen.container, "value-change")!;
  expect(root.dataset.change).toBe("added");
  expect(slot(root, "value-change-before")).toBeNull();
  expect(slot(root, "value-change-arrow")).toBeNull();
  expect(srText(root)).toBe("added ");
  expect(root.textContent).toBe("added Asha");
  await expectNoA11yViolations(screen.container);
});

test("only before is a removal", async () => {
  const screen = await render(<ValueChange before="Asha" after={null} />);
  const root = slot(screen.container, "value-change")!;
  expect(root.dataset.change).toBe("removed");
  expect(slot(root, "value-change-after")).toBeNull();
  expect(slot(root, "value-change-arrow")).toBeNull();
  expect(root.textContent).toBe("removed Asha");
  await expectNoA11yViolations(screen.container);
});

test("an empty string or false counts as absent; zero does not", async () => {
  const screen = await render(
    <>
      <ValueChange before="" after="New" data-testid="a" />
      <ValueChange before={0} after={false} data-testid="b" />
    </>,
  );
  const [a, b] = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="value-change"]',
    ),
  );
  expect(a!.dataset.change).toBe("added");
  expect(b!.dataset.change).toBe("removed");
  expect(b!.textContent).toBe("removed 0");
});

test("neither side renders nothing", async () => {
  const screen = await render(<ValueChange before={null} after={undefined} />);
  expect(slot(screen.container, "value-change")).toBeNull();
});

test("takes rich values and forwards its ref and props", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const screen = await render(
    <ValueChange
      ref={ref}
      className="text-sm"
      before={<strong>Low</strong>}
      after={<strong>High</strong>}
    />,
  );
  expect(ref.current).toBe(slot(screen.container, "value-change"));
  expect(ref.current!.className).toContain("text-sm");
  expect(
    slot(screen.container, "value-change-after")!.querySelector("strong"),
  ).not.toBeNull();
});
