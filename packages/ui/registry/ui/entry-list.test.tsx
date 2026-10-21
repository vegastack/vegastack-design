import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Entry, EntryActions, EntryList, EntryMeta } from "./entry-list";

test("an entry list is a real list; entries carry their details and actions", async () => {
  const screen = await render(
    <EntryList className="gap-1">
      <Entry>
        Section moved <EntryMeta>(Asha, 2h ago)</EntryMeta>
        <EntryActions>
          <button type="button">Open</button>
        </EntryActions>
      </Entry>
      <Entry layout="stack">
        <EntryMeta>2h ago · Asha</EntryMeta>
        Rewrote the warranty section
      </Entry>
    </EntryList>,
  );
  await expect.element(screen.getByRole("list")).toBeInTheDocument();
  expect(screen.getByRole("listitem").elements()).toHaveLength(2);
  const [row, stack] = screen.container.querySelectorAll("[data-slot=entry]");
  expect(row!.getAttribute("data-layout")).toBe("row");
  expect(stack!.getAttribute("data-layout")).toBe("stack");
  await expect
    .element(screen.getByRole("button", { name: "Open" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});
