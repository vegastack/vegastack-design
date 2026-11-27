import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/contrast.css";
import {
  AgentFaceStateProvider,
  PersonAvatar,
  PersonName,
  personAccessibleName,
  personDisplayName,
  personInitials,
} from "./person-avatar";

const fallback = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;

test("initials on the person's hue", async () => {
  const screen = await render(
    <PersonAvatar person={{ name: "Asha K Rao", hue: "blue" }} />,
  );
  expect(fallback(screen.container).textContent).toBe("AR");
  expect(fallback(screen.container).dataset.hue).toBe("blue");
  expect(fallback(screen.container).className).toContain("bg-tag-blue-subtle");
  await expectNoA11yViolations(screen.container);
});

test("no hue keeps the muted fallback; no name uses the email", async () => {
  const screen = await render(
    <PersonAvatar person={{ name: "", email: "ops@acme.com" }} />,
  );
  expect(fallback(screen.container).textContent).toBe("OP");
  expect(fallback(screen.container).dataset.hue).toBeUndefined();
  expect(fallback(screen.container).className).toContain("bg-muted");
});

test("personInitials: first and last word, two letters of one word, else the email", () => {
  expect(personInitials("Asha Rao")).toBe("AR");
  expect(personInitials("  asha k  rao ")).toBe("AR");
  expect(personInitials("asha")).toBe("AS");
  expect(personInitials("", "ops@acme.com")).toBe("OP");
  expect(personInitials("   ")).toBe("");
});

test("a team is a rounded-square tile with the team icon on its hue, never initials", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <PersonAvatar person={{ name: "Sales", kind: "team", hue: "green" }} />
      <PersonAvatar person={{ name: "Ops" }} kind="team" size="lg" />
    </div>,
  );
  const tiles = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="avatar"][data-kind="team"]',
  );
  expect(tiles).toHaveLength(2);
  expect(tiles[0]!.className).toContain("rounded-tile");
  const tile = fallback(tiles[0]!);
  expect(tile.textContent).toBe("");
  expect(tile.dataset.hue).toBe("green");
  expect(tile.querySelector("svg.lucide-users-round")).not.toBeNull();
  expect(fallback(tiles[1]!).dataset.hue).toBeUndefined();
  await expectNoA11yViolations(screen.container);
});

test("a workspace is a rounded-square tile: its whole logo, else its initials on its hue", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <PersonAvatar
        person={{ name: "Acme Lighting", kind: "workspace", hue: "orange" }}
      />
      <PersonAvatar
        person={{
          name: "Acme",
          image: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
        }}
        kind="workspace"
      />
    </div>,
  );
  const tiles = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="avatar"][data-kind="workspace"]',
  );
  expect(tiles).toHaveLength(2);
  expect(tiles[0]!.className).toContain("rounded-tile");
  expect(fallback(tiles[0]!).textContent).toBe("AL");
  expect(fallback(tiles[0]!).className).toContain("rounded-[inherit]");
  const logo = tiles[1]!.querySelector<HTMLImageElement>("img")!;
  expect(logo.className).toContain("object-contain");
  expect(logo.className).not.toContain("rounded-full");
  await expectNoA11yViolations(screen.container);
});

const claude = { name: "Claude Code", kind: "agent" as const, for: "Manoj" };

test("an agent is its face: the Mini below 40px, the Pebble from 40px, and a stable face without a stored one", async () => {
  const scout = { v: 1, preset: "squish", palette: "violet" } as const;
  const screen = await render(
    <div className="flex gap-2">
      <PersonAvatar person={{ ...claude, face: scout }} size="default" />
      <PersonAvatar person={{ ...claude, face: scout }} size="lg" />
      <PersonAvatar person={claude} />
      <PersonAvatar person={claude} />
    </div>,
  );
  // The face loads on demand (its chunk), so wait for the four to draw.
  await expect
    .poll(
      () =>
        screen.container.querySelectorAll('[data-slot="agent-face"]').length,
    )
    .toBe(4);
  const [dot, pebble, a, b] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="avatar"]',
  );
  const faceOf = (el: HTMLElement) =>
    el.querySelector<SVGSVGElement>('[data-slot="agent-face"]')!;
  expect(dot!.dataset.kind).toBe("agent");
  expect(faceOf(dot!).dataset.form).toBe("mini");
  expect(faceOf(dot!).dataset.preset).toBe("squish");
  expect(faceOf(pebble!).dataset.form).toBe("pebble");
  // No circle, no fallback, no bot: the face is the whole avatar.
  expect(dot!.querySelector('[data-slot="avatar-fallback"]')).toBeNull();
  expect(dot!.querySelector("svg.lucide-bot")).toBeNull();
  // An agent with no stored face still gets the same one every time.
  expect(faceOf(a!).dataset.preset).toBe(faceOf(b!).dataset.preset);
  expect(faceOf(a!).dataset.palette).toBe(faceOf(b!).dataset.palette);
  await expectNoA11yViolations(screen.container);
});

test("faceState: the avatar's own, else the enclosing provider's, else idle", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <PersonAvatar person={claude} size="lg" faceState="thinking" />
      <AgentFaceStateProvider state="needs-you">
        <PersonAvatar person={claude} size="lg" />
        <PersonAvatar person={claude} size="lg" faceState="replied" />
      </AgentFaceStateProvider>
      <PersonAvatar person={claude} size="lg" />
    </div>,
  );
  const states = [
    ...screen.container.querySelectorAll<SVGSVGElement>(
      '[data-slot="agent-face"]',
    ),
  ].map((el) => el.dataset.state);
  expect(states).toEqual(["thinking", "needs-you", "replied", "idle"]);
});

test("PersonName: an agent reads its name, for its owner, and the Agent label when asked; a person just the name", async () => {
  const screen = await render(
    <p>
      <PersonName person={claude} agentLabel /> and{" "}
      <PersonName person={{ name: "Asha Rao" }} />
    </p>,
  );
  const [agent, person] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="person-name"]',
  );
  expect(agent!.dataset.kind).toBe("agent");
  expect(
    agent!.querySelector('[data-slot="person-name-for"]')!.textContent,
  ).toBe(" for Manoj");
  const label = agent!.querySelector<HTMLElement>(
    '[data-slot="person-agent-label"]',
  )!;
  expect(label.textContent).toBe("Agent");
  expect(label.className).toContain("text-tag-purple-text");
  expect(agent!.querySelector(".sr-only")!.textContent).toBe(
    "Claude Code for Manoj, agent",
  );
  expect(person!.textContent).toBe("Asha Rao");
  expect(person!.dataset.kind).toBeUndefined();
  await expectNoA11yViolations(screen.container);
});

test("PersonName: no label by default (the face says agent) but keeps the spoken agent", async () => {
  const screen = await render(<PersonName person={claude} />);
  expect(
    screen.container.querySelector('[data-slot="person-agent-label"]'),
  ).toBeNull();
  expect(screen.container.querySelector(".sr-only")!.textContent).toBe(
    "Claude Code for Manoj, agent",
  );
});

test("personDisplayName and personAccessibleName", () => {
  expect(personDisplayName(claude)).toBe("Claude Code for Manoj");
  expect(personDisplayName({ name: "Codex", kind: "agent" })).toBe("Codex");
  expect(personDisplayName({ name: "Asha Rao", for: "x" })).toBe("Asha Rao");
  expect(personAccessibleName(claude)).toBe("Claude Code for Manoj, agent");
  expect(personAccessibleName({ name: "Codex", kind: "agent" })).toBe(
    "Codex, agent",
  );
  expect(personAccessibleName({ name: "Asha Rao" })).toBe("Asha Rao");
});

const box = (el: Element) => el.getBoundingClientRect();

test("size steps: 16 to 64px, the face filling the agent's box, and no className needed", async () => {
  const sizes = ["2xs", "xs", "sm", "default", "lg", "xl"] as const;
  const px = [16, 20, 24, 32, 40, 64];
  const screen = await render(
    <div className="flex items-start gap-2">
      {sizes.map((size) => (
        <PersonAvatar
          key={size}
          size={size}
          person={{ name: "Bot", kind: "agent" }}
        />
      ))}
      {sizes.map((size) => (
        <PersonAvatar
          key={`p-${size}`}
          size={size}
          person={{ name: "Asha Rao" }}
        />
      ))}
    </div>,
  );
  const roots = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="avatar"]',
  );
  sizes.forEach((size, i) => {
    for (const root of [roots[i]!, roots[i + sizes.length]!]) {
      expect(root.dataset.size).toBe(size);
      expect(box(root).width).toBe(px[i]);
      expect(box(root).height).toBe(px[i]);
    }
    expect(
      box(roots[i]!.querySelector('[data-slot="agent-face"]')!).width,
    ).toBe(px[i]);
  });
  await expectNoA11yViolations(screen.container);
});

test("the row steps show one initial; larger steps two", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <PersonAvatar size="2xs" person={{ name: "Asha Rao" }} />
      <PersonAvatar size="xs" person={{ name: "Asha Rao" }} />
      <PersonAvatar size="sm" person={{ name: "Asha Rao" }} />
    </div>,
  );
  const texts = [
    ...screen.container.querySelectorAll('[data-slot="avatar-fallback"]'),
  ].map((el) => el.textContent);
  expect(texts).toEqual(["A", "A", "AR"]);
});

test("indicator: sized to the step at the corner, on a circle and a face", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <PersonAvatar
        size="default"
        person={{ name: "Asha" }}
        indicator={<span />}
      />
      <PersonAvatar
        size="2xs"
        person={{ name: "Bot", kind: "agent" }}
        indicator={<span />}
      />
    </div>,
  );
  const dots = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="person-avatar-indicator"]',
  );
  expect(box(dots[0]!).width).toBe(10);
  expect(box(dots[1]!).width).toBe(6);
});

test("in a group an agent drops the circular ring for a halo round its own silhouette", async () => {
  const screen = await render(
    <div data-slot="avatar-group" className="flex -space-x-1">
      <PersonAvatar
        person={{ name: "Asha" }}
        className="ring-2 ring-background"
      />
      <PersonAvatar
        person={{ name: "Bot", kind: "agent" }}
        className="ring-2 ring-background"
      />
    </div>,
  );
  const [person, agent] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="avatar"]',
  );
  expect(getComputedStyle(person!).boxShadow).toContain(" 2px");
  expect(getComputedStyle(agent!).boxShadow).not.toContain(" 2px");
  // The group gives the face its surface colour, which its halo strokes round its silhouette.
  expect(
    getComputedStyle(agent!).getPropertyValue("--person-avatar-halo").trim(),
  ).not.toBe("");
});

test("actingFor: the member as a small offset circle on an agent from sm up; never at the row steps or on a person", async () => {
  const manoj = { name: "Manoj Kumar", hue: "blue" as const };
  const screen = await render(
    <div className="flex gap-4 p-2">
      <PersonAvatar size="lg" person={claude} actingFor={manoj} />
      <PersonAvatar size="xl" person={claude} actingFor={manoj} />
      <PersonAvatar size="xs" person={claude} actingFor={manoj} />
      <PersonAvatar size="lg" person={{ name: "Asha" }} actingFor={manoj} />
      <PersonAvatar
        size="lg"
        person={claude}
        actingFor={manoj}
        indicator={<span />}
      />
    </div>,
  );
  const roots = screen.container.querySelectorAll<HTMLElement>(
    ':scope > div > [data-slot="avatar"]',
  );
  const actingFor = (el: HTMLElement) =>
    el.querySelector<HTMLElement>('[data-slot="person-avatar-acting-for"]');
  const [lg, xl, xs, person, withIndicator] = roots;
  const small = actingFor(lg!)!;
  expect(small.getAttribute("aria-hidden")).toBe("true");
  expect(box(small).width).toBe(16);
  // Two pixels out past the face's bottom-end corner.
  expect(box(small).right - box(lg!).right).toBe(2);
  expect(box(small).bottom - box(lg!).bottom).toBe(2);
  expect(
    small.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!.dataset
      .hue,
  ).toBe("blue");
  expect(box(actingFor(xl!)!).width).toBe(24);
  expect(actingFor(xs!)).toBeNull();
  expect(actingFor(person!)).toBeNull();
  // The indicator gives the bottom corner to the member and moves to the top.
  const dot = withIndicator!.querySelector<HTMLElement>(
    '[data-slot="person-avatar-indicator"]',
  )!;
  expect(box(dot).bottom).toBeLessThan(box(withIndicator!).top + 20);
  await expectNoA11yViolations(screen.container);
});

test('PersonName compact: a picker\'s "Claude Code · Manoj", spoken the same as the sentence form', async () => {
  const screen = await render(
    <PersonName person={claude} variant="compact" agentLabel />,
  );
  const name = screen.container.querySelector<HTMLElement>(
    '[data-slot="person-name"]',
  )!;
  expect(name.dataset.variant).toBe("compact");
  expect(name.querySelector('[data-slot="person-name-for"]')!.textContent).toBe(
    " · Manoj",
  );
  expect(name.querySelector('[data-slot="person-agent-label"]')).not.toBeNull();
  expect(name.querySelector(".sr-only")!.textContent).toBe(
    "Claude Code for Manoj, agent",
  );
});
