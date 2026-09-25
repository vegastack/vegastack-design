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
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Transcription failed");
  await screen.getByRole("button", { name: "Retry" }).click();
  expect(onRetry).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});
