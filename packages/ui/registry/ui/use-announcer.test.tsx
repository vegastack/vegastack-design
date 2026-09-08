import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { useAnnouncer } from "./use-announcer";

function Harness({ text = "Saved" }: { text?: string }) {
  const { announce, Announcer } = useAnnouncer();
  const renders = React.useRef(0);
  renders.current += 1;
  return (
    <div>
      <button type="button" onClick={() => announce(text)}>
        Announce
      </button>
      <span data-testid="host-renders">{renders.current}</span>
      <Announcer />
    </div>
  );
}

function region(container: HTMLElement): HTMLElement {
  const node = container.querySelector<HTMLElement>('[data-slot="announcer"]');
  if (!node) throw new Error("no announcer region rendered");
  return node;
}

test("the region is mounted, empty and polite from first paint", async () => {
  const screen = await render(<Harness />);
  const live = region(screen.container);
  // Mounted BEFORE it has content: a live region inserted at the moment it gains text is
  // frequently never announced, because the platform was not observing it.
  expect(live.getAttribute("role")).toBe("status");
  expect(live.getAttribute("aria-live")).toBe("polite");
  expect(live.getAttribute("aria-atomic")).toBe("true");
  expect(live.className).toContain("sr-only");
  expect(live.textContent).toBe("");
  await expectNoA11yViolations(screen.container);
});

test("announce puts the text in the region", async () => {
  const screen = await render(<Harness text="Row moved to position 3 of 7" />);
  await userEvent.click(screen.getByRole("button", { name: "Announce" }));
  expect(region(screen.container).textContent).toBe(
    "Row moved to position 3 of 7",
  );
});

test("an IDENTICAL consecutive announcement still replaces the DOM node", async () => {
  const screen = await render(<Harness text="Save failed" />);
  const button = screen.getByRole("button", { name: "Announce" });
  await userEvent.click(button);
  const first = region(screen.container).firstElementChild;
  expect(first?.textContent).toBe("Save failed");
  await userEvent.click(button);
  const second = region(screen.container).firstElementChild;
  // The whole point of the sequence key: a same-string setState is a React bail-out, so
  // without the re-key the DOM never mutates and assistive tech never re-announces.
  expect(second?.textContent).toBe("Save failed");
  expect(second).not.toBe(first);
});

test("announcing does not re-render the host component", async () => {
  const screen = await render(<Harness />);
  const before = screen.getByTestId("host-renders").element().textContent;
  await userEvent.click(screen.getByRole("button", { name: "Announce" }));
  expect(region(screen.container).textContent).toBe("Saved");
  // Announcement state lives in the hook's store, which only `Announcer` subscribes to —
  // the copies this hook replaced re-rendered the whole DataGrid on every announcement.
  expect(screen.getByTestId("host-renders").element().textContent).toBe(before);
});

test("the Announcer component keeps a stable identity across announcements", async () => {
  const seen: React.ComponentType<unknown>[] = [];
  function IdentityHarness() {
    const [tick, setTick] = React.useState(0);
    const { announce, Announcer } = useAnnouncer();
    seen.push(Announcer as React.ComponentType<unknown>);
    return (
      <div>
        <button type="button" onClick={() => announce(`x${tick}`)}>
          Announce
        </button>
        <button type="button" onClick={() => setTick((t) => t + 1)}>
          Re-render
        </button>
        <Announcer />
      </div>
    );
  }
  const screen = await render(<IdentityHarness />);
  await userEvent.click(screen.getByRole("button", { name: "Re-render" }));
  await userEvent.click(screen.getByRole("button", { name: "Re-render" }));
  await userEvent.click(screen.getByRole("button", { name: "Announce" }));
  expect(seen.length).toBeGreaterThan(1);
  // A component whose TYPE changed would be unmounted and remounted, destroying the region
  // the platform is observing — which is exactly what a `useCallback`-wrapped component does.
  expect(new Set(seen).size).toBe(1);
});

test("className merges onto sr-only rather than replacing it", async () => {
  function Custom() {
    const { Announcer } = useAnnouncer();
    return <Announcer className="absolute" />;
  }
  const screen = await render(<Custom />);
  const live = region(screen.container);
  expect(live.className).toContain("sr-only");
  expect(live.className).toContain("absolute");
});

test("two hooks in one tree keep independent regions", async () => {
  function Two() {
    const a = useAnnouncer();
    const b = useAnnouncer();
    return (
      <div>
        <button type="button" onClick={() => a.announce("first")}>
          A
        </button>
        <button type="button" onClick={() => b.announce("second")}>
          B
        </button>
        <span data-testid="a">
          <a.Announcer />
        </span>
        <span data-testid="b">
          <b.Announcer />
        </span>
      </div>
    );
  }
  const screen = await render(<Two />);
  await userEvent.click(screen.getByRole("button", { name: "A" }));
  expect(
    region(screen.getByTestId("a").element() as HTMLElement).textContent,
  ).toBe("first");
  expect(
    region(screen.getByTestId("b").element() as HTMLElement).textContent,
  ).toBe("");
});
