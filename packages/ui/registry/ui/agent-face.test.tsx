import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/contrast.css";
import { AgentFace, type AgentFaceSpec, type FaceState } from "./agent-face";

const scout: AgentFaceSpec = { v: 1, preset: "squish", palette: "violet" };
const STATES: FaceState[] = [
  "idle",
  "thinking",
  "working",
  "writing",
  "needs-you",
  "replied",
  "failed",
  "scheduled",
  "paused",
];
const faceOf = (c: Element) =>
  c.querySelector<SVGSVGElement>('[data-slot="agent-face"]')!;

test("the Pebble from 40px and the Mini below, at the size asked, named for screen readers", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <AgentFace face={scout} size={40} label="Scout, agent" />
      <AgentFace face={scout} size={32} label="Scout, agent" />
      <AgentFace face={scout} size={16} label="" />
      <AgentFace face={scout} size={40} />
    </div>,
  );
  const [pebble, dot, quiet, unnamed] =
    screen.container.querySelectorAll<SVGSVGElement>(
      '[data-slot="agent-face"]',
    );
  expect(pebble!.dataset.form).toBe("pebble");
  expect(dot!.dataset.form).toBe("mini");
  expect(pebble!.getBoundingClientRect().width).toBe(40);
  expect(quiet!.getBoundingClientRect().width).toBe(16);
  expect(pebble!.getAttribute("role")).toBe("img");
  expect(pebble!.getAttribute("aria-label")).toBe("Scout, agent");
  // An empty label hides it: the words beside it say who it is.
  expect(quiet!.getAttribute("aria-hidden")).toBe("true");
  expect(quiet!.getAttribute("role")).toBeNull();
  // No label at all is hidden too, never an image without a name.
  expect(unnamed!.getAttribute("aria-hidden")).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("every state has its own cue beside the Pebble's head; idle has none", async () => {
  const cues: Partial<Record<FaceState, string>> = {
    thinking: "thought",
    working: "gear",
    writing: "speech",
    "needs-you": "ticks",
    replied: "sparkle",
    failed: "alert",
    scheduled: "sleep",
    paused: "pause",
  };
  const screen = await render(
    <div className="flex flex-wrap gap-2">
      {STATES.map((state) => (
        <AgentFace key={state} face={scout} size={64} state={state} label="" />
      ))}
    </div>,
  );
  const faces = screen.container.querySelectorAll<SVGSVGElement>(
    '[data-slot="agent-face"]',
  );
  STATES.forEach((state, i) => {
    expect(faces[i]!.dataset.state).toBe(state);
    const cue = faces[i]!.querySelector<SVGGElement>(
      '[data-slot="agent-face-cue"]',
    );
    expect(cue?.dataset.cue ?? null).toBe(cues[state] ?? null);
  });
});

test("the Mini badges only the states that need a person: amber, blue, red", async () => {
  const screen = await render(
    <div className="flex gap-2">
      {STATES.map((state) => (
        <AgentFace key={state} face={scout} size={24} state={state} label="" />
      ))}
    </div>,
  );
  const badges = [
    ...screen.container.querySelectorAll<SVGGElement>(
      '[data-slot="agent-face-badge"]',
    ),
  ].map((b) => b.getAttribute("data-badge"));
  expect(badges).toEqual(["needs-you", "replied", "failed"]);
  expect(
    screen.container.querySelector('[data-slot="agent-face-cue"]'),
  ).toBeNull();
});

test("it moves only when asked: no motion classes in the still pose", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <AgentFace face={scout} size={64} state="working" label="" />
      <AgentFace face={scout} size={64} state="working" motion label="" />
    </div>,
  );
  const [still, moving] = screen.container.querySelectorAll<SVGSVGElement>(
    '[data-slot="agent-face"]',
  );
  expect(still!.querySelector('[class*="motion-face-"]')).toBeNull();
  expect(moving!.querySelector(".motion-face-bob")).not.toBeNull();
  expect(moving!.querySelector(".motion-face-scan")).not.toBeNull();
});

test("a face that can't act fades toward grey; a palette sets its colours as tokens", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <AgentFace face={scout} size={64} label="" />
      <AgentFace face={scout} size={64} state="paused" label="" />
    </div>,
  );
  const [idle, paused] = screen.container.querySelectorAll<SVGSVGElement>(
    '[data-slot="agent-face"]',
  );
  expect(idle!.style.getPropertyValue("--fa")).toBe("var(--face-violet-a)");
  expect(paused!.style.getPropertyValue("--fa")).toContain("color-mix");
  expect(paused!.style.getPropertyValue("--fa")).toContain("--face-grey-a");
  expect(faceOf(screen.container).dataset.palette).toBe("violet");
});
