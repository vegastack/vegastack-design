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
  await expect.element(card).toHaveAttribute("data-size", "default");
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
