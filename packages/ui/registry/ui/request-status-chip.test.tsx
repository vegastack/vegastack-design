import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import {
  REQUEST_STATE_LABEL,
  RequestStatusChip,
  type RequestState,
} from "./request-status-chip";

const STATES = Object.keys(REQUEST_STATE_LABEL) as RequestState[];

test("every state has its words and a tone that follows the state", async () => {
  const screen = await render(
    <>
      {STATES.map((state) => (
        <RequestStatusChip key={state} state={state} />
      ))}
    </>,
  );
  const chips = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="request-status-chip"]',
    ),
  ];
  expect(chips.map((chip) => chip.textContent)).toEqual([
    "Draft",
    "Open",
    "In progress",
    "Awaiting approval",
    "Approved",
    "Declined",
    "Completed",
    "Cancelled",
  ]);
  expect(chips.map((chip) => chip.dataset.state)).toEqual(STATES);
  await expectNoA11yViolations(screen.container);
});

test("a label renames the words but never the tone; sm is the dense size", async () => {
  const screen = await render(
    <>
      <RequestStatusChip
        state="in_progress"
        label="Awaiting receipt"
        size="sm"
      />
      <RequestStatusChip state="in_progress" />
    </>,
  );
  const [renamed, plain] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="request-status-chip"]',
  );
  expect(renamed!.textContent).toBe("Awaiting receipt");
  expect(renamed!.dataset.size).toBe("sm");
  expect(renamed!.dataset.variant).toBe(plain!.dataset.variant);
});
