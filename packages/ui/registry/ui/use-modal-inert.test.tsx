import * as React from "react";
import { createPortal } from "react-dom";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { useModalInert } from "./use-modal-inert";

function Harness({
  enabled = true,
  ref,
}: {
  enabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const popupRef = useModalInert<HTMLDivElement>({ enabled, ref });
  return createPortal(
    <div data-base-ui-portal="">
      <div ref={popupRef}>Popup</div>
    </div>,
    document.body,
  );
}

function outsideRoot(originallyInert = false) {
  const element = document.createElement("button");
  element.textContent = "Outside";
  element.inert = originallyInert;
  element.setAttribute("data-base-ui-inert", "");
  document.body.prepend(element);
  return element;
}

test("mirrors live Base UI markers and restores the original inert value", async () => {
  const outside = outsideRoot();
  try {
    const screen = await render(<Harness />);
    await expect.poll(() => outside.inert).toBe(true);

    outside.removeAttribute("data-base-ui-inert");
    await expect.poll(() => outside.inert).toBe(false);

    outside.setAttribute("data-base-ui-inert", "");
    await expect.poll(() => outside.inert).toBe(true);
    await screen.unmount();
    expect(outside.inert).toBe(false);
  } finally {
    outside.remove();
  }
});

test("keeps an originally inert outside root inert after release", async () => {
  const outside = outsideRoot(true);
  try {
    const screen = await render(<Harness />);
    await expect.poll(() => outside.inert).toBe(true);
    await screen.unmount();
    expect(outside.inert).toBe(true);
  } finally {
    outside.remove();
  }
});

test("preserves Base UI's live-region exception as notifications mount and unmount", async () => {
  const outside = document.createElement("div");
  const backgroundButton = document.createElement("button");
  const liveRegion = document.createElement("div");
  outside.setAttribute("data-base-ui-inert", "");
  backgroundButton.textContent = "Background action";
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("role", "status");
  outside.append(backgroundButton);
  document.body.prepend(outside);
  try {
    const screen = await render(<Harness />);
    await expect.poll(() => outside.inert).toBe(true);

    outside.append(liveRegion);
    expect(outside.inert).toBe(true);

    liveRegion.setAttribute("role", "region");
    await expect.poll(() => outside.inert).toBe(false);
    expect(backgroundButton.inert).toBe(true);
    expect(liveRegion.inert).toBe(false);

    liveRegion.setAttribute("role", "status");
    await expect.poll(() => outside.inert).toBe(true);
    expect(backgroundButton.inert).toBe(false);

    liveRegion.setAttribute("role", "region");
    await expect.poll(() => outside.inert).toBe(false);
    expect(backgroundButton.inert).toBe(true);

    liveRegion.remove();
    await expect.poll(() => outside.inert).toBe(true);
    expect(backgroundButton.inert).toBe(false);
    await screen.unmount();
    expect(outside.inert).toBe(false);
  } finally {
    outside.remove();
  }
});

test("does not let a control-local status announcer punch through the modal boundary", async () => {
  const outside = outsideRoot();
  const announcer = document.createElement("span");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("role", "status");
  outside.append(announcer);
  try {
    const screen = await render(<Harness />);
    await expect.poll(() => outside.inert).toBe(true);
    await screen.unmount();
    expect(outside.inert).toBe(false);
  } finally {
    outside.remove();
  }
});

test("reference-counts overlapping modal owners", async () => {
  const outside = outsideRoot();
  try {
    const first = await render(<Harness />);
    const second = await render(<Harness />);
    await expect.poll(() => outside.inert).toBe(true);

    await first.unmount();
    expect(outside.inert).toBe(true);
    await second.unmount();
    expect(outside.inert).toBe(false);
  } finally {
    outside.remove();
  }
});

test("enabled=false preserves outside interaction", async () => {
  const outside = outsideRoot();
  try {
    const screen = await render(<Harness enabled={false} />);
    expect(outside.inert).toBe(false);
    await screen.unmount();
  } finally {
    outside.remove();
  }
});

test("merges the caller ref with its lifecycle ref", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(<Harness ref={ref} />);
  expect(ref.current?.textContent).toBe("Popup");
  await screen.unmount();
  expect(ref.current).toBeNull();
});
