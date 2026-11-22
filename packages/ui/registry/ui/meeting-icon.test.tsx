import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  MeetingIcon,
  meetingIconKind,
  RecordingActionIcon,
} from "./meeting-icon";

test("one speaker is a person, two or more or unknown a group, live statuses the spinner", () => {
  expect(meetingIconKind({ status: "processed", speakerCount: 1 })).toBe(
    "person",
  );
  expect(meetingIconKind({ status: "processed", speakerCount: 3 })).toBe(
    "group",
  );
  expect(meetingIconKind({ status: "processed", speakerCount: null })).toBe(
    "group",
  );
  expect(
    meetingIconKind({ status: "failed_processing", speakerCount: 0 }),
  ).toBe("group");
  for (const status of [
    "recording",
    "uploading",
    "uploaded",
    "transcribing",
    "processing",
  ])
    expect(meetingIconKind({ status, speakerCount: 1 })).toBe("live");
});

test("decorative by default; a label makes it an image, the spinner too", async () => {
  const screen = await render(
    <div>
      <MeetingIcon status="processed" speakerCount={1} />
      <MeetingIcon status="recording" label="Recording" />
    </div>,
  );
  const icons = screen.container.querySelectorAll('[data-slot="meeting-icon"]');
  expect(icons[0]).toHaveAttribute("aria-hidden", "true");
  expect(icons[0]).toHaveAttribute("data-kind", "person");
  await expect
    .element(screen.getByRole("img", { name: "Recording" }))
    .toHaveAttribute("data-kind", "live");
  expect(screen.container.querySelector('[role="status"]')).toBeNull();
});

test("no a11y violations", async () => {
  const screen = await render(
    <div>
      <MeetingIcon status="processed" speakerCount={2} label="Meeting" />
      <MeetingIcon status="transcribing" />
      <RecordingActionIcon action="start" />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
