import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { CoverageBanner } from "./coverage-banner";

const person = { name: "Rohan", avatar: <span aria-hidden>R</span> };

test("a banner states who covers, with one action; warning marks an urgent step", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <>
      <CoverageBanner
        person={person}
        text="Rohan covers expense approvals until 30 Nov"
        action={{ label: "Change", onClick }}
      />
      <CoverageBanner
        person={person}
        tone="warning"
        text="Rohan covers this approval, due today"
      />
    </>,
  );
  const [info, warning] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="coverage-banner"]',
  );
  expect(info!.textContent).toContain(
    "Rohan covers expense approvals until 30 Nov",
  );
  expect(info!.getAttribute("role")).toBe("status");
  expect(warning!.dataset.tone).toBe("warning");
  await page.getByRole("button", { name: "Change" }).click();
  expect(onClick).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("inline is one muted line with no action", async () => {
  const screen = await render(
    <CoverageBanner
      person={person}
      variant="inline"
      text="Rohan covers until 30 Nov"
      action={{ label: "End", onClick: vi.fn() }}
    />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="coverage-banner"]',
  )!;
  expect(root.dataset.variant).toBe("inline");
  expect(root.querySelector("button")).toBeNull();
  expect(root.textContent).toContain("Rohan covers until 30 Nov");
  await expectNoA11yViolations(screen.container);
});
