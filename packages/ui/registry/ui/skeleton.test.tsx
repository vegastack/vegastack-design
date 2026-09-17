import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Skeleton } from "./skeleton";

/** The one element this component renders, addressed the way every fixture addresses it. */
function skeletonsIn(container: Element): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];
}

/** The first skeleton in a fixture that renders exactly one. */
function skeletonIn(container: Element): HTMLElement {
  const [skeleton] = skeletonsIn(container);
  expect(skeleton).toBeDefined();
  return skeleton!;
}

test("renders a div carrying data-slot and the upstream recipe", async () => {
  const screen = await render(<Skeleton />);
  const skeleton = skeletonIn(screen.container);
  expect(skeleton.tagName).toBe("DIV");
  for (const className of ["animate-pulse", "rounded-md", "bg-muted"]) {
    expect(skeleton.className.split(/\s+/)).toContain(className);
  }
});

test("the caller's className joins the recipe rather than replacing it (Usage)", async () => {
  const screen = await render(
    <Skeleton className="h-[20px] w-[100px] rounded-full" />,
  );
  const skeleton = skeletonIn(screen.container);
  const classes = skeleton.className.split(/\s+/);
  expect(classes).toContain("animate-pulse");
  expect(classes).toContain("h-[20px]");
  expect(classes).toContain("w-[100px]");
  // `cn` resolves the radius conflict in the caller's favour — one radius survives.
  expect(classes).toContain("rounded-full");
  expect(classes).not.toContain("rounded-md");
});

test("arbitrary div props are forwarded (Avatar, Card)", async () => {
  const screen = await render(
    <Skeleton
      id="avatar-placeholder"
      data-testid="avatar"
      aria-hidden="true"
    />,
  );
  const skeleton = skeletonIn(screen.container);
  expect(skeleton.id).toBe("avatar-placeholder");
  expect(skeleton.getAttribute("data-testid")).toBe("avatar");
  expect(skeleton.getAttribute("aria-hidden")).toBe("true");
});

test("a composed placeholder renders one element per skeleton (Text)", async () => {
  const screen = await render(
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>,
  );
  expect(skeletonsIn(screen.container)).toHaveLength(3);
});

test("a repeated row shape keeps a fixed count (Table)", async () => {
  const screen = await render(
    <div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index}>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>,
  );
  expect(skeletonsIn(screen.container)).toHaveLength(10);
});

test("the placeholder carries no role, name or text of its own", async () => {
  const screen = await render(<Skeleton />);
  const skeleton = skeletonIn(screen.container);
  expect(skeleton.hasAttribute("role")).toBe(false);
  expect(skeleton.hasAttribute("aria-label")).toBe(false);
  expect(skeleton.textContent).toBe("");
});

test("no a11y violations — rest", async () => {
  const screen = await render(
    <div aria-busy="true" aria-label="Loading profile">
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-4 w-[150px]" />
      <Skeleton className="h-4 w-[100px]" />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a loading region (Form)", async () => {
  const screen = await render(
    <section aria-busy="true" aria-label="Loading form">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-24" />
    </section>,
  );
  await expectNoA11yViolations(screen.container);
});
