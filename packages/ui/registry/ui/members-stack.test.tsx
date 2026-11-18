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
    '[data-members-stack-faces] [data-slot="avatar"]',
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
      "[data-members-stack-faces] > span",
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
  expect(stack.element().getAttribute("data-slot")).toBe("members-stack");
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
  // The visible count leads the accessible name.
  await expect
    .element(
      screen.getByRole("button", { name: /^Members: 23 members, Asha Rao/ }),
    )
    .toBeVisible();
  const faces = screen.container.querySelector<HTMLElement>(
    "[data-members-stack-faces]",
  );
  expect(
    count!.getBoundingClientRect().left - faces!.getBoundingClientRect().right,
  ).toBe(8);
});

test("in a clickable row, the stack and its popover never open the row", async () => {
  let opened = 0;
  const screen = await render(
    <div onClick={() => (opened += 1)}>
      <MembersStack
        people={PEOPLE}
        footer={<button type="button">Manage members</button>}
      />
    </div>,
  );
  await screen.getByRole("button", { name: /^Members:/ }).click();
  await screen.getByText("Dev Menon").click();
  await screen.getByRole("button", { name: "Manage members" }).click();
  expect(opened).toBe(0);
});

test("right to left, every face still overlaps the next by 6px", async () => {
  const screen = await render(
    <div dir="rtl">
      <MembersStack people={PEOPLE} total={23} />
    </div>,
  );
  const parts = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      "[data-members-stack-faces] > span",
    ),
  );
  expect(parts).toHaveLength(4);
  for (let i = 0; i < parts.length - 1; i++)
    expect(
      parts[i + 1]!.getBoundingClientRect().right -
        parts[i]!.getBoundingClientRect().left,
    ).toBe(6);
});

test("an agent in the stack gets its shaped halo", async () => {
  const screen = await render(
    <MembersStack
      people={[{ name: "Asha Rao" }, { name: "Orbit", kind: "agent" }]}
    />,
  );
  const agent = screen.container.querySelector<HTMLElement>(
    '[data-members-stack-faces] [data-kind="agent"]',
  )!;
  expect(
    getComputedStyle(agent).getPropertyValue("--person-avatar-halo").trim(),
  ).not.toBe("");
});

test("viewers: 22px faces overlapped by 8px, the one viewing now first with a 1.5px ring in their hue, three then +N", async () => {
  const screen = await render(
    <MembersStack
      variant="viewers"
      people={[
        { name: "Dev Menon", hue: "green", viewedAt: Date.now() - 3_600_000 },
        { name: "Asha Rao", hue: "blue", active: true },
        { name: "Kavya Iyer", viewedAt: Date.now() - 86_400_000 },
        { name: "Ravi Shah", viewedAt: Date.now() - 172_800_000 },
      ]}
    />,
  );
  const faces = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-members-stack-faces] [data-slot="avatar"]',
    ),
  ];
  expect(faces).toHaveLength(3);
  const [a, b] = faces.map((f) => f.getBoundingClientRect());
  expect(a!.width).toBe(22);
  expect(Math.round(a!.right - b!.left)).toBe(8);
  // The viewer here now leads, ringed in their own hue; no dot.
  expect(faces[0]!.closest("[data-active]")).not.toBeNull();
  expect(faces[0]!.className).toContain("ring-tag-blue");
  expect(getComputedStyle(faces[0]!).boxShadow).toContain("1.5px");
  expect(
    screen.container.querySelector('[data-slot="members-stack-active"]'),
  ).toBeNull();
  const pill = screen.container.querySelector<HTMLElement>(
    '[data-slot="members-stack-overflow"]',
  )!;
  expect(pill.textContent).toBe("+1");
  expect(pill.getBoundingClientRect().height).toBe(22);
});

test("viewers: the popover groups Viewing now and Viewed, with when each last looked, then the footer", async () => {
  const screen = await render(
    <MembersStack
      variant="viewers"
      people={[
        { name: "Asha Rao", hue: "blue", active: true },
        { name: "Dev Menon", viewedAt: Date.now() - 3 * 3_600_000 },
      ]}
      footer={<button type="button">Manage access</button>}
    />,
  );
  await screen
    .getByRole("button", { name: /^Viewers: Asha Rao, Dev Menon$/ })
    .click();
  const now = screen.getByRole("list", { name: "Viewing now" });
  await expect.element(now).toBeVisible();
  expect(now.element().textContent).toContain("Asha Rao");
  const viewed = screen.getByRole("list", { name: "Viewed" });
  expect(viewed.element().textContent).toContain("Dev Menon");
  expect(viewed.element().textContent).toContain("3h ago");
  await expect
    .element(screen.getByRole("button", { name: "Manage access" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body);
});
