import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/contrast.css";
import {
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
  expect(tiles[0]!.className).toContain("rounded-md");
  const tile = fallback(tiles[0]!);
  expect(tile.textContent).toBe("");
  expect(tile.dataset.hue).toBe("green");
  expect(tile.querySelector("svg.lucide-users-round")).not.toBeNull();
  expect(fallback(tiles[1]!).dataset.hue).toBeUndefined();
  await expectNoA11yViolations(screen.container);
});

const claude = { name: "Claude Code", kind: "agent" as const, via: "Manoj" };

test("an agent is a bot on the purple tag hue, whatever its own hue", async () => {
  const screen = await render(
    <PersonAvatar person={{ ...claude, hue: "blue" }} />,
  );
  const avatar = screen.container.querySelector<HTMLElement>(
    '[data-slot="avatar"]',
  )!;
  expect(avatar.dataset.kind).toBe("agent");
  expect(fallback(screen.container).dataset.hue).toBe("purple");
  expect(fallback(screen.container).textContent).toBe("");
  expect(
    fallback(screen.container).querySelector("svg.lucide-bot"),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("PersonName: an agent reads its name, via its owner, and the Agent label; a person just the name", async () => {
  const screen = await render(
    <p>
      <PersonName person={claude} /> and{" "}
      <PersonName person={{ name: "Asha Rao" }} />
    </p>,
  );
  const [agent, person] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="person-name"]',
  );
  expect(agent!.dataset.kind).toBe("agent");
  expect(
    agent!.querySelector('[data-slot="person-name-via"]')!.textContent,
  ).toBe(" via Manoj");
  const label = agent!.querySelector<HTMLElement>(
    '[data-slot="person-agent-label"]',
  )!;
  expect(label.textContent).toBe("Agent");
  expect(label.className).toContain("text-tag-purple-text");
  expect(agent!.querySelector(".sr-only")!.textContent).toBe(
    "Claude Code, agent of Manoj",
  );
  expect(person!.textContent).toBe("Asha Rao");
  expect(person!.dataset.kind).toBeUndefined();
  await expectNoA11yViolations(screen.container);
});

test("PersonName: agentLabel={false} drops the label but keeps the spoken agent", async () => {
  const screen = await render(
    <PersonName person={claude} agentLabel={false} />,
  );
  expect(
    screen.container.querySelector('[data-slot="person-agent-label"]'),
  ).toBeNull();
  expect(screen.container.querySelector(".sr-only")!.textContent).toBe(
    "Claude Code, agent of Manoj",
  );
});

test("personDisplayName and personAccessibleName", () => {
  expect(personDisplayName(claude)).toBe("Claude Code (via Manoj)");
  expect(personDisplayName({ name: "Codex", kind: "agent" })).toBe("Codex");
  expect(personDisplayName({ name: "Asha Rao", via: "x" })).toBe("Asha Rao");
  expect(personAccessibleName(claude)).toBe("Claude Code, agent of Manoj");
  expect(personAccessibleName({ name: "Codex", kind: "agent" })).toBe(
    "Codex, agent",
  );
  expect(personAccessibleName({ name: "Asha Rao" })).toBe("Asha Rao");
});
