import * as React from "react";
import { render } from "vitest-browser-react";
// Real layout: the faces, the pill and the count measure from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  MembersStack,
  membersOverflowLabel,
  orderMembers,
} from "./members-stack";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

const PEOPLE = [
  { name: "Asha Rao", email: "asha@acme.com", hue: "blue" as const },
  { name: "Dev Menon", hue: "green" as const },
  { name: "Kavya Iyer" },
  { name: "Ravi Shah" },
  { name: "Mira Das" },
];

test("shows at most three faces, then a +N pill counted from total", async () => {
  const screen = await render(<MembersStack people={PEOPLE} total={23} />);
  const faces = screen.container.querySelectorAll(
    '[data-slot="members-stack-faces"] [data-slot="avatar"]',
  );
  expect(faces).toHaveLength(3);
  const pill = screen.container.querySelector<HTMLElement>(
    '[data-slot="members-stack-overflow"]',
  );
  expect(pill?.textContent).toBe("+20");
  // The pill is the faces' height, never larger.
  const face = faces[0] as HTMLElement;
  expect(pill!.getBoundingClientRect().height).toBe(
    face.getBoundingClientRect().height,
  );
  expect(face.getBoundingClientRect().height).toBe(24);
  await expectNoA11yViolations(screen.container);
});

test("overlaps faces by 6px", async () => {
  const screen = await render(<MembersStack people={PEOPLE} />);
  const [a, b] = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="members-stack-faces"] > span',
    ),
  );
  expect(
    a!.getBoundingClientRect().right - b!.getBoundingClientRect().left,
  ).toBe(6);
});

test("caps the pill at 99+", () => {
  expect(membersOverflowLabel(12)).toBe("+12");
  expect(membersOverflowLabel(99)).toBe("+99");
  expect(membersOverflowLabel(140)).toBe("99+");
});

test("puts active people first and never you first unless alone", () => {
  const order = orderMembers([
    { name: "You", you: true },
    { name: "Asha" },
    { name: "Dev", active: true },
  ]).map((p) => p.name);
  expect(order).toEqual(["Dev", "You", "Asha"]);
  expect(
    orderMembers([{ name: "You", you: true }, { name: "Asha" }]).map(
      (p) => p.name,
    ),
  ).toEqual(["Asha", "You"]);
  expect(orderMembers([{ name: "You", you: true }])[0]!.name).toBe("You");
});

test("marks people active now with a dot", async () => {
  const screen = await render(
    <MembersStack people={[{ name: "Asha Rao", active: true }]} />,
  );
  expect(
    screen.container.querySelector('[data-slot="members-stack-active"]'),
  ).not.toBeNull();
});

test("names everyone on the button and lists them in the popover with the footer", async () => {
  const screen = await render(
    <MembersStack
      people={PEOPLE}
      total={14}
      footer={<button type="button">Manage members</button>}
    />,
  );
  const stack = screen.getByRole("button", {
    name: /^Members: Asha Rao, .* and 9 more$/,
  });
  await stack.click();
  await expect
    .element(screen.getByRole("list", { name: "Members" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Manage members" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body);
});

test("only you is a lock and words, with no button", async () => {
  const screen = await render(<MembersStack audience="only-you" />);
  await expect.element(screen.getByText("Only you")).toBeVisible();
  expect(screen.container.querySelector("button")).toBeNull();
});

test("a whole space is its tile and Everyone in …; a team its tile, name and count", async () => {
  const space = await render(
    <MembersStack
      audience="everyone"
      group={{ name: "General", kind: "workspace", hue: "blue" }}
    />,
  );
  await expect
    .element(
      space.getByRole("button", { name: "Members: Everyone in General" }),
    )
    .toBeVisible();
  const team = await render(
    <MembersStack
      audience="team"
      total={8}
      group={{ name: "Sales", kind: "team", hue: "green" }}
    />,
  );
  await expect.element(team.getByText("Sales · 8")).toBeVisible();
});

test("draws nothing with nobody to show", async () => {
  const screen = await render(<MembersStack people={[]} />);
  expect(screen.container.textContent).toBe("");
});

test("a row's stack ends in the count, 8px on", async () => {
  const screen = await render(
    <MembersStack people={PEOPLE} total={23} count />,
  );
  const count = screen.container.querySelector<HTMLElement>(
    '[data-slot="members-stack-count"]',
  );
  expect(count?.textContent).toBe("23 members");
  const faces = screen.container.querySelector<HTMLElement>(
    '[data-slot="members-stack-faces"]',
  );
  expect(
    count!.getBoundingClientRect().left - faces!.getBoundingClientRect().right,
  ).toBe(8);
});
