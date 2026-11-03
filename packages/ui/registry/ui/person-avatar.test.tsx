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
  expect(tiles[0]!.className).toContain("rounded-md");
  expect(fallback(tiles[0]!).textContent).toBe("AL");
  expect(fallback(tiles[0]!).className).toContain("rounded-[inherit]");
  const logo = tiles[1]!.querySelector<HTMLImageElement>("img")!;
  expect(logo.className).toContain("object-contain");
  expect(logo.className).not.toContain("rounded-full");
  await expectNoA11yViolations(screen.container);
});

const claude = { name: "Claude Code", kind: "agent" as const, via: "Manoj" };

test("an agent is a bot on its hue, purple when it has none", async () => {
  const screen = await render(
    <div>
      <PersonAvatar person={claude} />
      <PersonAvatar person={{ ...claude, hue: "blue" }} />
    </div>,
  );
  const [plain, blue] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="avatar"]',
  );
  expect(plain!.dataset.kind).toBe("agent");
  expect(fallback(plain!).dataset.hue).toBe("purple");
  expect(fallback(blue!).dataset.hue).toBe("blue");
  expect(fallback(plain!).textContent).toBe("");
  expect(fallback(plain!).querySelector("svg.lucide-bot")).not.toBeNull();
  await expectNoA11yViolations(screen.container);
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
    agent!.querySelector('[data-slot="person-name-via"]')!.textContent,
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

test("PersonName: no label by default (the hexagon says agent) but keeps the spoken agent", async () => {
  const screen = await render(<PersonName person={claude} />);
  expect(
    screen.container.querySelector('[data-slot="person-agent-label"]'),
  ).toBeNull();
  expect(screen.container.querySelector(".sr-only")!.textContent).toBe(
    "Claude Code for Manoj, agent",
  );
});

test("personDisplayName and personAccessibleName", () => {
  expect(personDisplayName(claude)).toBe("Claude Code (for Manoj)");
  expect(personDisplayName({ name: "Codex", kind: "agent" })).toBe("Codex");
  expect(personDisplayName({ name: "Asha Rao", via: "x" })).toBe("Asha Rao");
  expect(personAccessibleName(claude)).toBe("Claude Code for Manoj, agent");
  expect(personAccessibleName({ name: "Codex", kind: "agent" })).toBe(
    "Codex, agent",
  );
  expect(personAccessibleName({ name: "Asha Rao" })).toBe("Asha Rao");
});

const GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
// A 1×1 PNG that decodes (the GIF above has no image data, so it fails to load).
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const box = (el: Element) => el.getBoundingClientRect();

test("size steps: 16 to 64px, with the icon at about 60% and no className needed", async () => {
  const sizes = ["2xs", "xs", "sm", "default", "lg", "xl"] as const;
  const px = [16, 20, 24, 32, 40, 64];
  const icon = [10, 12, 14, 18, 24, 36];
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
    expect(box(roots[i]!.querySelector("svg")!).width).toBe(icon[i]);
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

test("an agent is a hexagon: masked, with no circle, and its hairline in the shape", async () => {
  const screen = await render(
    <PersonAvatar person={{ name: "Bot", kind: "agent" }} size="default" />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="avatar"]',
  )!;
  expect(root.style.getPropertyValue("--person-avatar-shape")).toContain(
    "data:image/svg+xml",
  );
  expect(getComputedStyle(root).borderRadius).toBe("0px");
  expect(getComputedStyle(fallback(screen.container)).maskImage).toContain(
    "url(",
  );
  const hairline = getComputedStyle(root, "::after");
  expect(hairline.maskComposite).toContain("exclude");
  expect(hairline.borderTopWidth).toBe("0px");
});

test("an agent's mark: inset on a tile and clear of the edges, or full-bleed; a failed mark falls back to the bot", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <PersonAvatar
        size="2xs"
        person={{ name: "A", kind: "agent", mark: { src: PNG, alt: "" } }}
      />
      <PersonAvatar
        size="lg"
        person={{ name: "B", kind: "agent", mark: { src: PNG, fit: "fill" } }}
      />
      <PersonAvatar
        size="sm"
        person={{ name: "C", kind: "agent", mark: { src: GIF } }}
      />
      <PersonAvatar
        size="sm"
        person={{ name: "D", kind: "agent" }}
        mark={<svg data-testid="node-mark" />}
      />
      <PersonAvatar
        size="sm"
        person={{ name: "Ed Bot", kind: "agent" }}
        agentFallback="initials"
      />
    </div>,
  );
  const [inset, fill, broken, node, initials] =
    screen.container.querySelectorAll<HTMLElement>('[data-slot="avatar"]');
  await expect
    .poll(() =>
      inset!
        .querySelector('[data-slot="person-avatar-mark"]')
        ?.classList.contains("invisible"),
    )
    .toBe(false);
  // Inset: the mark sits inside the box with room on every side, on the neutral tile.
  const markImg = inset!.querySelector("img")!;
  const [o, m] = [box(inset!), box(markImg)];
  expect(m.left - o.left).toBeGreaterThanOrEqual(3);
  expect(o.right - m.right).toBeGreaterThanOrEqual(3);
  expect(m.top - o.top).toBeGreaterThanOrEqual(3);
  expect(o.bottom - m.bottom).toBeGreaterThanOrEqual(3);
  expect(
    inset!.querySelector('[data-slot="person-avatar-mark"]')!.className,
  ).toContain("bg-background");
  expect(inset!.querySelector('[data-slot="avatar-fallback"]')).toBeNull();
  // Fill: the mark covers the shape.
  await expect
    .poll(() => fill!.querySelector('[data-slot="avatar-fallback"]'))
    .toBeNull();
  expect(box(fill!.querySelector("img")!).width).toBe(40);
  // A mark that fails to load gives way to the bot.
  await expect
    .poll(() => broken!.querySelector('[data-slot="person-avatar-mark"]'))
    .toBeNull();
  expect(broken!.querySelector("svg.lucide-bot")).not.toBeNull();
  // A node mark shows at once; initials replace the bot on request.
  expect(node!.querySelector('[data-testid="node-mark"]')).not.toBeNull();
  expect(fallback(initials!).textContent).toBe("EB");
  // No badge: the hexagon itself says agent.
  expect(
    screen.container.querySelector('[data-slot="person-avatar-agent-badge"]'),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("a mark is only for agents: a person's image stays their photo", async () => {
  const screen = await render(
    <PersonAvatar person={{ name: "Asha", image: PNG, mark: { src: PNG } }} />,
  );
  expect(
    screen.container.querySelector('[data-slot="person-avatar-mark"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="avatar-image"]'),
  ).not.toBeNull();
});

test("indicator: sized to the step at the corner, on a circle and a hexagon", async () => {
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
  // On the hexagon the dot moves in to sit on the shape's lower edge.
  const hex = box(dots[1]!.parentElement!);
  expect(box(dots[1]!).right).toBeLessThan(hex.right);
});

test("in a group an agent drops the circular ring for a halo in its own shape", async () => {
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
  expect(getComputedStyle(agent!, "::before").backgroundColor).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
});
