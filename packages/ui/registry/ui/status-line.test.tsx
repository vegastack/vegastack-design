import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { StatusLine } from "./status-line";

test("progress is a status, error is an alert with its action", async () => {
  const onRetry = vi.fn();
  const screen = await render(
    <>
      <StatusLine status="progress">Transcribing…</StatusLine>
      <StatusLine
        status="error"
        action={
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        }
      >
        Transcription failed
      </StatusLine>
    </>,
  );
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Transcribing…");
  await expect
    .element(screen.getByRole("alert").getByText("Transcription failed"))
    .toBeVisible();
  await screen.getByRole("button", { name: "Retry" }).click();
  expect(onRetry).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("live={false} drops the role and keeps the look", async () => {
  const screen = await render(
    <StatusLine status="error" live={false}>
      It stopped.
    </StatusLine>,
  );
  const line = screen.container.querySelector("[data-slot=status-line]")!;
  expect(line.getAttribute("role")).toBeNull();
  expect(line.getAttribute("data-status")).toBe("error");
});
