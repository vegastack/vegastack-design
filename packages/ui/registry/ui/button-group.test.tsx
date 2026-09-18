import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
} from "./button-group";

/** Upstream's two orientations, in the order its docs page documents them. */
const ORIENTATIONS = ["horizontal", "vertical"] as const;

function bySlot(container: Element, slot: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  expect(element, `no element carrying data-slot="${slot}"`).not.toBeNull();
  return element as HTMLElement;
}

test("renders a div carrying role=group and data-slot", async () => {
  const screen = await render(
    <ButtonGroup aria-label="Message actions">
      <Button variant="outline">Archive</Button>
      <Button variant="outline">Report</Button>
    </ButtonGroup>,
  );
  const group = screen.getByRole("group", { name: "Message actions" });
  await expect.element(group).toBeInTheDocument();
  await expect.element(group).toHaveAttribute("data-slot", "button-group");
  expect((group.element() as HTMLElement).tagName).toBe("DIV");
});

test("every exported part renders and stamps its own data-slot (Composition)", async () => {
  const screen = await render(
    <ButtonGroup>
      <ButtonGroupText>https://</ButtonGroupText>
      <input aria-label="Domain" defaultValue="design.vegastack.com" />
      <ButtonGroupSeparator />
      <Button variant="outline">Copy</Button>
    </ButtonGroup>,
  );
  const group = bySlot(screen.container, "button-group");
  expect(group.querySelector('[data-slot="button-group-text"]')).not.toBeNull();
  expect(
    group.querySelector('[data-slot="button-group-separator"]'),
  ).not.toBeNull();
  expect(group.querySelector('[data-slot="button"]')).not.toBeNull();
  expect(group.querySelector("input")).not.toBeNull();
});

test("every upstream orientation produces its own class string", async () => {
  const seen = new Set<string>();
  for (const orientation of ORIENTATIONS) {
    const classes = buttonGroupVariants({ orientation });
    expect(classes.length).toBeGreaterThan(0);
    seen.add(classes);
  }
  expect(seen.size).toBe(ORIENTATIONS.length);
});

test("the default orientation is horizontal, and every orientation welds its own axis", async () => {
  // `orientation` is undefined by default, so CVA resolves the horizontal recipe while the
  // data attribute stays unset — the same shape upstream ships.
  expect(buttonGroupVariants({})).toBe(
    buttonGroupVariants({ orientation: "horizontal" }),
  );
  expect(buttonGroupVariants({ orientation: "horizontal" })).toContain(
    "rounded-e-none",
  );
  expect(buttonGroupVariants({ orientation: "vertical" })).toContain(
    "rounded-b-none",
  );
  expect(buttonGroupVariants({ orientation: "vertical" })).toContain(
    "flex-col",
  );
});

test("Orientation: the rendered group reflects the orientation as a data attribute", async () => {
  for (const orientation of ORIENTATIONS) {
    const screen = await render(
      <ButtonGroup orientation={orientation} aria-label="Media controls">
        <Button variant="outline">One</Button>
        <Button variant="outline">Two</Button>
      </ButtonGroup>,
    );
    const group = bySlot(screen.container, "button-group");
    expect(group.getAttribute("data-orientation")).toBe(orientation);
    expect(group.className).toContain(buttonGroupVariants({ orientation }));
  }
});

test("Separator: renders a separator with the orientation it defaults to", async () => {
  const screen = await render(
    <ButtonGroup>
      <Button variant="secondary">Copy</Button>
      <ButtonGroupSeparator />
      <Button variant="secondary">Paste</Button>
    </ButtonGroup>,
  );
  const separator = bySlot(screen.container, "button-group-separator");
  expect(separator.getAttribute("role")).toBe("separator");
  // The component defaults to `vertical` — a divider BETWEEN buttons on a horizontal row.
  expect(separator.getAttribute("aria-orientation")).toBe("vertical");
  expect(separator.className).toContain("self-stretch");
});

test("Separator: the orientation is overridable (Split, vertical groups)", async () => {
  const screen = await render(
    <ButtonGroup orientation="vertical">
      <Button variant="secondary">Up</Button>
      <ButtonGroupSeparator orientation="horizontal" />
      <Button variant="secondary">Down</Button>
    </ButtonGroup>,
  );
  const separator = bySlot(screen.container, "button-group-separator");
  // Base UI omits `aria-orientation` for the horizontal default; the data attribute is the proof.
  expect(separator.getAttribute("data-orientation")).toBe("horizontal");
});

test("the text addon renders a div by default and carries the muted chrome", async () => {
  const screen = await render(<ButtonGroupText>https://</ButtonGroupText>);
  const text = bySlot(screen.container, "button-group-text");
  expect(text.tagName).toBe("DIV");
  expect(text.textContent).toBe("https://");
  const classes = text.className.split(/\s+/);
  expect(classes).toContain("bg-muted");
  expect(classes).toContain("border");
  expect(classes).toContain("rounded-lg");
});

test("the text addon composes through `render`, keeping its own classes", async () => {
  const screen = await render(
    <ButtonGroup>
      <ButtonGroupText render={<label htmlFor="bg-name" />}>
        Name
      </ButtonGroupText>
      <input id="bg-name" defaultValue="acme" />
    </ButtonGroup>,
  );
  const text = bySlot(screen.container, "button-group-text");
  expect(text.tagName).toBe("LABEL");
  expect(text.getAttribute("for")).toBe("bg-name");
  expect(text.className).toContain("bg-muted");
});

test("Nested: a group whose children are groups opens a gap between them", async () => {
  expect(buttonGroupVariants({})).toContain(
    "has-[>[data-slot=button-group]]:gap-2",
  );
  const screen = await render(
    <ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">One</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Two</Button>
      </ButtonGroup>
    </ButtonGroup>,
  );
  const groups = screen.container.querySelectorAll(
    '[data-slot="button-group"]',
  );
  expect(groups).toHaveLength(3);
});

test("Input: the recipe stretches a direct input child", async () => {
  expect(buttonGroupVariants({})).toContain("[&>input]:flex-1");
});

test("Select: the recipe restores the trailing trigger's inline-end radius", async () => {
  const classes = buttonGroupVariants({});
  expect(classes).toContain(
    "[data-slot=select-trigger]:last-of-type]:rounded-e-lg",
  );
  expect(classes).toContain(
    "[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit",
  );
});

test("Dropdown Menu / Popover: a focused member is raised above its neighbour's seam", async () => {
  const classes = buttonGroupVariants({});
  expect(classes).toContain("*:focus-visible:relative");
  expect(classes).toContain("*:focus-visible:z-10");
});

test("a caller's className is merged onto the group, never replacing the recipe", async () => {
  const screen = await render(
    <ButtonGroup className="w-full max-w-sm">
      <Button variant="outline">One</Button>
    </ButtonGroup>,
  );
  const classes = bySlot(screen.container, "button-group").className.split(
    /\s+/,
  );
  expect(classes).toContain("max-w-sm");
  expect(classes).toContain("items-stretch");
});

test("RTL: `dir` passes straight through to the group element", async () => {
  const screen = await render(
    <ButtonGroup dir="rtl" aria-label="إجراءات الرسالة">
      <Button variant="outline">أرشفة</Button>
    </ButtonGroup>,
  );
  expect(bySlot(screen.container, "button-group").getAttribute("dir")).toBe(
    "rtl",
  );
});

test("FOC-6: no part's recipe carries a focus glow, even though there is no patch", async () => {
  const recipes = [
    buttonGroupVariants({}),
    ...ORIENTATIONS.map((orientation) => buttonGroupVariants({ orientation })),
  ];
  const screen = await render(
    <ButtonGroup>
      <ButtonGroupText>https://</ButtonGroupText>
      <ButtonGroupSeparator />
    </ButtonGroup>,
  );
  recipes.push(bySlot(screen.container, "button-group-text").className);
  recipes.push(bySlot(screen.container, "button-group-separator").className);

  for (const classes of recipes) {
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("focus-visible:border-ring");
    expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  }
});

test("no a11y violations — a labelled horizontal group", async () => {
  const screen = await render(
    <ButtonGroup aria-label="Message actions">
      <Button variant="outline">Archive</Button>
      <Button variant="outline">Report</Button>
    </ButtonGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a vertical icon-only group", async () => {
  const screen = await render(
    <ButtonGroup orientation="vertical" aria-label="Media controls">
      <Button variant="outline" size="icon" aria-label="Increase">
        <svg aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Decrease">
        <svg aria-hidden="true" />
      </Button>
    </ButtonGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a split group with a separator", async () => {
  const screen = await render(
    <ButtonGroup aria-label="Clipboard">
      <Button variant="secondary">Copy</Button>
      <ButtonGroupSeparator />
      <Button variant="secondary">Paste</Button>
    </ButtonGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a text addon labelling an input", async () => {
  const screen = await render(
    <ButtonGroup aria-label="Project domain">
      <ButtonGroupText render={<label htmlFor="bg-a11y-name" />}>
        https://
      </ButtonGroupText>
      <input id="bg-a11y-name" defaultValue="acme" />
      <Button variant="outline">Copy</Button>
    </ButtonGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — right to left", async () => {
  const screen = await render(
    <ButtonGroup dir="rtl" aria-label="إجراءات الرسالة">
      <Button variant="outline">أرشفة</Button>
      <Button variant="outline">تقرير</Button>
    </ButtonGroup>,
  );
  await expectNoA11yViolations(screen.container);
});
