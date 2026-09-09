import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Alert, AlertTitle, AlertDescription } from "./alert";

test("renders title and description content with the polite role=status", async () => {
  const screen = await render(
    <Alert>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Something happened.</AlertDescription>
    </Alert>,
  );
  const alert = screen.getByRole("status");
  await expect.element(alert).toBeInTheDocument();
  await expect.element(screen.getByText("Heads up")).toBeInTheDocument();
  await expect
    .element(screen.getByText("Something happened."))
    .toBeInTheDocument();
});

test("applies variant data attribute and default variant", async () => {
  const screen = await render(
    <Alert intent="success">
      <AlertTitle>Saved</AlertTitle>
    </Alert>,
  );
  await expect
    .element(screen.getByRole("status"))
    .toHaveAttribute("data-intent", "success");
});

test("dismiss click fires onDismiss", async () => {
  const onDismiss = vi.fn();
  const screen = await render(
    <Alert dismissable onDismiss={onDismiss}>
      <AlertTitle>Dismiss me</AlertTitle>
    </Alert>,
  );
  await screen.getByRole("button", { name: "Dismiss" }).click();
  expect(onDismiss).toHaveBeenCalledOnce();
});

test("dismiss button relies on the centralized focus outline (no per-component re-declaration)", async () => {
  const screen = await render(
    <Alert dismissable>
      <AlertTitle>Dismiss me</AlertTitle>
    </Alert>,
  );
  const dismiss = screen.getByRole("button", { name: "Dismiss" });
  // P2-35: components must NOT re-declare the base.css focus trio — the global
  // `:focus-visible` rule is the single source of the outline.
  expect(dismiss.element().className).not.toContain("focus-visible:outline");
});

test("self-dismisses (removes from DOM) when no onDismiss provided", async () => {
  const screen = await render(
    <Alert dismissable>
      <AlertTitle>Closable</AlertTitle>
    </Alert>,
  );
  await expect.element(screen.getByRole("status")).toBeInTheDocument();
  await screen.getByRole("button", { name: "Dismiss" }).click();
  await vi.waitFor(() =>
    expect(screen.container.querySelector('[data-slot="alert"]')).toBeNull(),
  );
});

test("hideIcon removes the leading icon", async () => {
  const screen = await render(
    <Alert hideIcon>
      <AlertTitle>No icon</AlertTitle>
    </Alert>,
  );
  expect(screen.container.querySelector('[data-slot="alert-icon"]')).toBeNull();
});

test("no a11y violations", async () => {
  const screen = await render(
    <Alert intent="info" dismissable>
      <AlertTitle>Info</AlertTitle>
      <AlertDescription>An accessible alert.</AlertDescription>
    </Alert>,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the root alert element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Alert ref={ref}>Heads up</Alert>);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("alert");
});

test("strip variant renders the compact ribbon with data-variant", async () => {
  const screen = await render(
    <Alert variant="strip" intent="info">
      <AlertDescription>Changes apply to all workspaces.</AlertDescription>
    </Alert>,
  );
  const alert = screen.getByRole("status");
  await expect.element(alert).toHaveAttribute("data-variant", "strip");
  expect((alert.element() as HTMLElement).className).toContain("py-2");
});

/* ------------------------------------------------------------------------------------------------
 * Live-region policy (D23 / B7-02)
 * ----------------------------------------------------------------------------------------------*/

test.each(["default", "info", "success", "warning", "destructive"] as const)(
  "a STATIC alert is the polite role=status — intent=%s",
  async (intent) => {
    const screen = await render(
      <Alert intent={intent}>
        <AlertTitle>Static</AlertTitle>
      </Alert>,
    );
    const root = screen.container.querySelector('[data-slot="alert"]');
    // A page carrying several static alerts must not announce several interruptions: a live
    // region already in the DOM at load announces nothing at all.
    expect(root).toHaveAttribute("role", "status");
    expect(root).not.toHaveAttribute("data-live");
  },
);

test.each(["destructive", "warning"] as const)(
  "a LIVE %s alert escalates to the assertive role=alert",
  async (intent) => {
    const screen = await render(
      <Alert intent={intent} live>
        <AlertTitle>Runtime</AlertTitle>
      </Alert>,
    );
    const root = screen.container.querySelector('[data-slot="alert"]');
    expect(root).toHaveAttribute("role", "alert");
    expect(root).toHaveAttribute("aria-live", "assertive");
    expect(root).toHaveAttribute("data-live", "");
  },
);

test.each(["default", "info", "success"] as const)(
  "a LIVE %s alert stays polite — only destructive/warning interrupt",
  async (intent) => {
    const screen = await render(
      <Alert intent={intent} live>
        <AlertTitle>Runtime</AlertTitle>
      </Alert>,
    );
    const root = screen.container.querySelector('[data-slot="alert"]');
    expect(root).toHaveAttribute("role", "status");
    expect(root).toHaveAttribute("aria-live", "polite");
  },
);
