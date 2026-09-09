import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./card";

test("renders title and content", async () => {
  const screen = await render(
    <Card>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>$20 / user / month</CardDescription>
      </CardHeader>
      <CardContent>Everything in Pro, plus SSO.</CardContent>
    </Card>,
  );
  await expect.element(screen.getByText("Team plan")).toBeInTheDocument();
  await expect
    .element(screen.getByText("$20 / user / month"))
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("Everything in Pro, plus SSO."))
    .toBeInTheDocument();
});

test("root carries data-slot and default data-size", async () => {
  const screen = await render(<Card>Body</Card>);
  const card = screen.getByText("Body");
  await expect.element(card).toHaveAttribute("data-slot", "card");
  await expect.element(card).toHaveAttribute("data-size", "md");
});

test('size="sm" sets the data-size attribute', async () => {
  const screen = await render(<Card size="sm">Compact</Card>);
  await expect
    .element(screen.getByText("Compact"))
    .toHaveAttribute("data-size", "sm");
});

test("each compound part exposes its data-slot", async () => {
  const screen = await render(
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Desc</CardDescription>
        <CardAction>
          <button type="button">More</button>
        </CardAction>
      </CardHeader>
      <CardContent>Content</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>,
  );
  const { container } = screen;
  expect(container.querySelector('[data-slot="card-header"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="card-title"]')).not.toBeNull();
  expect(
    container.querySelector('[data-slot="card-description"]'),
  ).not.toBeNull();
  expect(container.querySelector('[data-slot="card-action"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="card-content"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="card-footer"]')).not.toBeNull();
});

test("forwards ref to the underlying card root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Card ref={ref}>Ref</Card>);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("card");
});

test("no a11y violations", async () => {
  const screen = await render(
    <Card>
      <CardHeader>
        <CardTitle>Accessible card</CardTitle>
        <CardDescription>A simple, accessible content surface.</CardDescription>
      </CardHeader>
      <CardContent>Body content goes here.</CardContent>
      <CardFooter>
        <button type="button">Action</button>
      </CardFooter>
    </Card>,
  );
  await expectNoA11yViolations(screen.container);
});

/* ------------------------------------------------------------------------------------------------
 * Coverage added for B7-10 — the audit found six tests and no assertion on the footer wash, the
 * density contract, or a header that carries its own action.
 * ----------------------------------------------------------------------------------------------*/

test("the footer is a real wash, not a bare row", async () => {
  const screen = await render(
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent>4,102 runs</CardContent>
      <CardFooter>Updated 2 minutes ago</CardFooter>
    </Card>,
  );
  const footer = screen.container.querySelector(
    '[data-slot="card-footer"]',
  ) as HTMLElement;
  expect(footer).not.toBeNull();
  // The footer reads as a distinct band; a card is flat (borders-only canon), so the separation
  // is a surface rung PLUS the hairline — never a shadow.
  expect(footer.className).toContain("bg-surface-1");
  expect(footer.className).toContain("border-t");
  expect(footer.className).not.toContain("shadow-");
});

test("density reaches the parts through the root's group, not per-part props", async () => {
  // The parts carry `group-data-[size=sm]/card:*`, which resolves ONLY because the root declares
  // `group/card` AND `data-size`. Asserting the pair is what catches a root that stops naming the
  // group — the failure mode that would silently leave every part at the roomy tier.
  // NOTE: computed padding cannot be asserted here. The browser-unit env mounts components without
  // the compiled Tailwind sheet, so every `getComputedStyle(...).padding*` reads `0px` and such a
  // test either fails for the wrong reason or passes vacuously. Real geometry is the contract lane.
  const screen = await render(
    <Card size="sm">
      <CardHeader>
        <CardTitle>Dense</CardTitle>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>,
  );
  const root = screen.container.querySelector(
    '[data-slot="card"]',
  ) as HTMLElement;
  expect(root.className).toContain("group/card");
  expect(root).toHaveAttribute("data-size", "sm");
  for (const slot of ["card-content", "card-footer"]) {
    const part = screen.container.querySelector(
      `[data-slot="${slot}"]`,
    ) as HTMLElement;
    expect(part.className).toContain("group-data-[size=sm]/card:");
  }
});

test.each(["sm", "md"] as const)(
  "a card is flat at size=%s — the hairline does the work, never a shadow",
  async (size) => {
    const screen = await render(
      <Card size={size}>
        <CardContent>Body</CardContent>
      </Card>,
    );
    const root = screen.container.querySelector(
      '[data-slot="card"]',
    ) as HTMLElement;
    // Class-level, not `getComputedStyle().boxShadow` — with no compiled sheet in this env that
    // reads "none" for any markup at all, so it is an assertion that cannot fail.
    expect(root.className).not.toMatch(/(^|\s)shadow-/);
    expect(root.className).toContain("border-border");
  },
);
