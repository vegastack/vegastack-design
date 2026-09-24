/**
 * `review-split-01.test.tsx` — the block's browser contract: one `h1`; a wide container shows the
 * three panels side by side with no tablist, a narrow one shows tabs over the SAME three panels;
 * crossing the boundary switches layout and mode together without remounting a panel; and both
 * modes are axe-clean. Compiled layout and contrast are proven in `test/contrast.browser.test.tsx`.
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { ReviewSplit } from "./components/review-split";
import {
  ACTION_ITEMS,
  SEGMENTS,
  SPEAKERS,
  SUMMARY,
} from "./components/sample-meeting";
import ReviewSplit01Page from "./page";

const panels = () =>
  document.querySelectorAll<HTMLElement>('[data-slot="review-split-panel"]');

test("review-split-01 has one h1", async () => {
  const screen = await render(<ReviewSplit01Page />);
  await expect
    .element(
      screen.getByRole("heading", {
        level: 1,
        name: "Weekly sync with Skyline",
      }),
    )
    .toBeInTheDocument();
  expect(document.querySelectorAll("h1")).toHaveLength(1);
});

test("layout and mode switch together at the boundary, and panels keep their state", async () => {
  const screen = await render(
    <div style={{ width: 1000 }}>
      <ReviewSplit01Page />
    </div>,
  );
  const host = screen.container.firstElementChild as HTMLElement;
  await expect
    .poll(() =>
      document
        .querySelector('[data-slot="review-split"]')
        ?.getAttribute("data-mode"),
    )
    .toBe("wide");
  expect(document.querySelector('[role="tablist"]')).toBeNull();
  expect(panels()).toHaveLength(3);
  for (const panel of panels()) {
    expect(panel.hidden).toBe(false);
    expect(panel.inert).toBe(false);
    expect(panel.getAttribute("role")).toBeNull();
  }
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  // A state inside a panel, and the panel node itself, must survive the switch.
  const first = screen.getByRole("checkbox", {
    name: "Send the regional teams the event numbers",
  });
  // Unstyled, the checkbox span has no box to click; its bound label toggles it, as a pointer would.
  await screen.getByText("Send the regional teams the event numbers").click();
  await expect.element(first).toBeChecked();
  const before = [...panels()];

  host.style.width = "800px";
  await expect
    .poll(() => document.querySelector('[role="tablist"]'))
    .not.toBeNull();
  expect([...panels()]).toEqual(before);
  expect(panels()).toHaveLength(3);
  expect([...panels()].filter((p) => !p.hidden)).toHaveLength(1);
  await expect
    .element(screen.getByRole("tab", { name: "Action items 2 open" }))
    .toBeInTheDocument();
  await screen.getByRole("tab", { name: "Action items 2 open" }).click();
  await expect
    .element(
      screen.getByRole("checkbox", {
        name: "Send the regional teams the event numbers",
      }),
    )
    .toBeChecked();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("the first render assumes narrow, and loading keeps each panel", async () => {
  const screen = await render(
    <div style={{ width: 600 }}>
      <ReviewSplit
        loading
        summary={SUMMARY}
        actionItems={ACTION_ITEMS}
        segments={SEGMENTS}
        speakers={SPEAKERS}
        recordingSrc="/recordings/weekly-sync.mp3"
      />
    </div>,
  );
  await expect
    .element(screen.getByRole("tab", { name: "Summary" }))
    .toBeInTheDocument();
  expect(panels()).toHaveLength(3);
  expect(
    document.querySelectorAll('[data-slot="skeleton"]').length,
  ).toBeGreaterThan(0);
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("the docked player is a named region at the end of the column", async () => {
  const screen = await render(
    <div style={{ width: 1000 }}>
      <ReviewSplit01Page />
    </div>,
  );
  await expect
    .element(screen.getByRole("region", { name: "Meeting recording" }))
    .toBeInTheDocument();
  expect(document.querySelector('[role="toolbar"]')).toBeNull();
  // The player's sticky containing block is the whole left column, not a wrapper of its own height.
  const player = document.querySelector('[data-slot="audio-player"]')!;
  expect(player.parentElement?.getAttribute("data-slot")).toBe(
    "review-split-column",
  );
  expect(
    player.parentElement?.querySelector('[data-panel="actions"]'),
  ).not.toBeNull();
});
