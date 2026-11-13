import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ModelEffortMenu,
  type EffortLevel,
  type ModelEffortMenuProps,
} from "./model-effort-menu";
import "../../test/geometry.css";

const MODELS = [
  {
    id: "sonnet",
    label: "Sonnet 5.5",
    description: "Everyday work",
    available: true,
  },
  { id: "opus", label: "Opus 5.5", available: true },
  { id: "haiku", label: "Haiku 5.5", available: true },
];
const MORE = [
  { id: "gemini", label: "Gemini 3 Pro", available: true },
  { id: "gpt", label: "GPT-6", available: false },
];

function Menu(props: Partial<ModelEffortMenuProps>) {
  const [model, setModel] = React.useState("sonnet");
  const [effort, setEffort] = React.useState<EffortLevel>("high");
  return (
    <ModelEffortMenu
      models={MODELS}
      moreModels={MORE}
      modelId={model}
      onModel={setModel}
      efforts={["low", "medium", "high", "max"]}
      recommended="high"
      effort={effort}
      onEffort={setEffort}
      {...props}
    />
  );
}

const trigger = () => page.getByRole("button", { name: /^Model:/ });

test("the trigger reads the model and effort; the menu lists models with ✓ and numbers", async () => {
  const screen = await render(<Menu />);
  await expect
    .element(trigger())
    .toHaveAccessibleName("Model: Sonnet 5.5, effort High");
  await trigger().click();
  const sonnet = page.getByRole("menuitem", { name: /Sonnet 5\.5/ });
  await expect.element(sonnet).toHaveAttribute("data-selected", "");
  await expect
    .element(page.getByRole("menuitem", { name: /Opus 5\.5/ }))
    .toHaveAttribute("aria-keyshortcuts", "2");
  await expectNoA11yViolations(screen.container);
});

test("a number key picks a model and closes the menu", async () => {
  await render(<Menu />);
  await trigger().click();
  await vi.waitFor(() =>
    expect(
      document
        .querySelector("[data-slot=chat-menu-content]")
        ?.contains(document.activeElement),
    ).toBe(true),
  );
  await userEvent.keyboard("3");
  await expect
    .element(trigger())
    .toHaveAccessibleName("Model: Haiku 5.5, effort High");
  await vi.waitFor(() =>
    expect(document.querySelector("[data-slot=chat-menu-content]")).toBeNull(),
  );
});

test("→ opens Effort: the note, only the given levels, Recommended and the warning on Max", async () => {
  await render(
    <Menu
      efforts={["low", "medium", "high", "max"]}
      maxWarning="about 3× usage"
    />,
  );
  await trigger().click();
  const effort = page.getByRole("menuitem", { name: /Effort/ });
  (effort.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowRight}");
  await vi.waitFor(() =>
    expect(
      document.querySelector("[data-slot=chat-menu-sub-note]")?.textContent,
    ).toContain("Higher effort"),
  );
  const levels = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-slot=chat-menu-sub-content] [data-slot=chat-menu-item]",
    ),
  ];
  expect(levels).toHaveLength(4);
  expect(levels[2]!.textContent).toContain("Recommended");
  expect(levels[3]!.textContent).toContain("about 3× usage");
  expect(
    document.querySelectorAll("[data-slot=model-effort-menu-warning]"),
  ).toHaveLength(1);
  await userEvent.click(levels[0]!);
  await expect
    .element(trigger())
    .toHaveAccessibleName("Model: Sonnet 5.5, effort Low");
});

test("a model with fewer levels hides the rest; none hides the Effort row", async () => {
  const screen = await render(<Menu efforts={["low", "medium", "high"]} />);
  await trigger().click();
  await userEvent.click(page.getByRole("menuitem", { name: /Effort/ }));
  await vi.waitFor(() =>
    expect(
      document.querySelectorAll(
        "[data-slot=chat-menu-sub-content] [data-slot=chat-menu-item]",
      ),
    ).toHaveLength(3),
  );
  expect(
    document.querySelector("[data-slot=model-effort-menu-warning]"),
  ).toBeNull();
  await userEvent.keyboard("{Escape}{Escape}");
  await screen.rerender(<Menu efforts={[]} />);
  await expect.element(trigger()).toHaveAccessibleName("Model: Sonnet 5.5");
  await trigger().click();
  expect(page.getByRole("menuitem", { name: /Effort/ }).query()).toBeNull();
});

test("More models lists unusable ones muted with Off · ask an admin", async () => {
  await render(<Menu />);
  await trigger().click();
  await userEvent.click(page.getByRole("menuitem", { name: /More models/ }));
  const gpt = page.getByRole("menuitem", { name: /GPT-6/ });
  await expect.element(gpt).toHaveAttribute("data-muted", "");
  await expect.element(gpt).toHaveAttribute("aria-disabled", "true");
  expect(gpt.element().textContent).toContain("Off · ask an admin");
  await userEvent.click(page.getByRole("menuitem", { name: /Gemini 3 Pro/ }));
  await expect.element(trigger()).toHaveAccessibleName(/Model: Gemini 3 Pro/);
});

test("Escape closes the menu", async () => {
  await render(<Menu />);
  await trigger().click();
  await vi.waitFor(() =>
    expect(
      document.querySelector("[data-slot=chat-menu-content]"),
    ).not.toBeNull(),
  );
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector("[data-slot=chat-menu-content]")).toBeNull(),
  );
});

test("with shortcuts, ⌘⇧E opens the menu at Effort with focus on the chat's level", async () => {
  await render(<Menu shortcuts />);
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? "Meta" : "Control";
  await userEvent.keyboard(`{${mod}>}{Shift>}E{/Shift}{/${mod}}`);
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toContain("High"),
  );
  await userEvent.keyboard("{Escape}{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector("[data-slot=chat-menu-content]")).toBeNull(),
  );
  await userEvent.keyboard(`{${mod}>}{Shift>}I{/Shift}{/${mod}}`);
  await vi.waitFor(() =>
    expect(
      document.querySelector("[data-slot=chat-menu-content]"),
    ).not.toBeNull(),
  );
});

test("readOnly shows the same words with the reason as a tooltip, and no menu", async () => {
  const screen = await render(<Menu readOnly="Set on the agent" />);
  const words = screen.container.querySelector<HTMLElement>(
    "[data-slot=model-effort-menu]",
  )!;
  expect(words.dataset.readonly).toBe("");
  expect(words.textContent).toBe("Sonnet 5.5High");
  await userEvent.hover(words);
  await vi.waitFor(() =>
    expect(
      document.querySelector("[data-slot=tooltip-content]")?.textContent,
    ).toBe("Set on the agent"),
  );
  await expectNoA11yViolations(screen.container);
});
