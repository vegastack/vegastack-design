import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Trash2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { SplitButton } from "./split-button";
import { DropdownMenuItem } from "./dropdown-menu";

test("renders the primary action and the dropdown trigger", async () => {
  const screen = await render(
    <SplitButton actions={[{ label: "Save as draft" }]}>Save</SplitButton>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Save" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "More options" }))
    .toBeInTheDocument();
});

test("primary onClick fires (and does not open the menu)", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <SplitButton onClick={onClick} actions={[{ label: "Save as draft" }]}>
      Save
    </SplitButton>,
  );
  await screen.getByRole("button", { name: "Save" }).click();
  expect(onClick).toHaveBeenCalledOnce();
  expect(document.querySelector('[role="menu"]')).toBeNull();
});

test("trigger opens the menu and renders the action items", async () => {
  const screen = await render(
    <SplitButton
      actions={[{ label: "Save and close" }, { label: "Save as draft" }]}
    >
      Save
    </SplitButton>,
  );

  expect(document.querySelector('[role="menu"]')).toBeNull();

  await screen.getByRole("button", { name: "More options" }).click();

  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  await expect
    .element(page.getByRole("menuitem", { name: "Save and close" }))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole("menuitem", { name: "Save as draft" }))
    .toBeInTheDocument();
});

test("selecting an action fires its onClick and closes the menu", async () => {
  const onAction = vi.fn();
  const screen = await render(
    <SplitButton actions={[{ label: "Save as draft", onClick: onAction }]}>
      Save
    </SplitButton>,
  );

  await screen.getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: "Save as draft" }).click();

  expect(onAction).toHaveBeenCalledOnce();
  await vi.waitFor(() =>
    expect(document.querySelector('[role="menu"]')).toBeNull(),
  );
});

test("keyboard opens the menu from the trigger", async () => {
  const screen = await render(
    <SplitButton actions={[{ label: "Save as draft" }]}>Save</SplitButton>,
  );

  screen.getByRole("button", { name: "More options" }).element().focus();
  await userEvent.keyboard("{Enter}");

  await expect.element(page.getByRole("menu")).toBeInTheDocument();
});

test("marks a destructive action with the destructive variant", async () => {
  const screen = await render(
    <SplitButton
      actions={[{ label: "Delete", icon: <Trash2 />, destructive: true }]}
    >
      Save
    </SplitButton>,
  );

  await screen.getByRole("button", { name: "More options" }).click();
  await expect
    .element(page.getByRole("menuitem", { name: "Delete" }))
    .toHaveAttribute("data-variant", "destructive");
});

test("composes DropdownMenuItem children via the `menu` slot", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <SplitButton
      menu={<DropdownMenuItem onClick={onClick}>Schedule…</DropdownMenuItem>}
    >
      Publish
    </SplitButton>,
  );

  await screen.getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: "Schedule…" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test("passes variant + size through to both halves and tags the slot", async () => {
  const screen = await render(
    <SplitButton
      variant="destructive"
      size="lg"
      actions={[{ label: "Force delete" }]}
    >
      Delete
    </SplitButton>,
  );
  const primary = screen.getByRole("button", { name: "Delete" });
  const trigger = screen.getByRole("button", { name: "More options" });
  await expect.element(primary).toHaveAttribute("data-variant", "destructive");
  await expect.element(primary).toHaveAttribute("data-size", "lg");
  await expect
    .element(primary)
    .toHaveAttribute("data-slot", "split-button-primary");
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "split-button-trigger");
});

test("loading disables both halves", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <SplitButton
      loading
      onClick={onClick}
      actions={[{ label: "Save as draft" }]}
    >
      Save
    </SplitButton>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Save" }))
    .toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "More options" }))
    .toBeDisabled();
});

test("loading keeps the chevron un-dimmed (aria-disabled, NOT native disabled) and inert", async () => {
  // The pending state must read as ONE joined control: the primary half shows the spinner at
  // full opacity, so the chevron must not take the native-`disabled` opacity dim — it goes
  // aria-disabled (focusable, like Button's own loading contract) with pointer-events off.
  const screen = await render(
    <SplitButton loading actions={[{ label: "Save as draft" }]}>
      Save
    </SplitButton>,
  );
  const trigger = screen.getByRole("button", { name: "More options" });
  await expect.element(trigger).toHaveAttribute("aria-disabled", "true");
  await expect.element(trigger).not.toHaveAttribute("disabled");
  await expect.element(trigger).toHaveAttribute("data-loading");
  await expect.element(trigger).toHaveAttribute("aria-busy", "true");

  // Styling contract (this suite loads no compiled CSS — assert the class, like button.test.tsx's
  // cta tests): pointer events are cut via the data-loading variant, NOT via the native-disabled
  // dim, so the chevron stays full-opacity next to the spinning primary half.
  const el = trigger.element() as HTMLElement;
  expect(el.classList.contains("data-loading:pointer-events-none")).toBe(true);

  // Still non-interactive: neither a forced click nor keyboard activation opens the menu.
  await trigger.click({ force: true });
  expect(document.querySelector('[role="menu"]')).toBeNull();
  el.focus();
  await userEvent.keyboard("{Enter}");
  expect(document.querySelector('[role="menu"]')).toBeNull();
});

test("a true disabled prop natively disables (and dims) both halves", async () => {
  const screen = await render(
    <SplitButton disabled actions={[{ label: "Save as draft" }]}>
      Save
    </SplitButton>,
  );
  const primary = screen.getByRole("button", { name: "Save" });
  const trigger = screen.getByRole("button", { name: "More options" });
  await expect.element(primary).toHaveAttribute("disabled");
  await expect.element(trigger).toHaveAttribute("disabled");
});

test("no a11y violations — loading", async () => {
  const screen = await render(
    <SplitButton loading actions={[{ label: "Save as draft" }]}>
      Save
    </SplitButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <SplitButton disabled actions={[{ label: "Save as draft" }]}>
      Save
    </SplitButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations with the menu open", async () => {
  const screen = await render(
    <SplitButton
      actions={[
        { label: "Save and close" },
        { label: "Delete", destructive: true },
      ]}
    >
      Save
    </SplitButton>,
  );

  await screen.getByRole("button", { name: "More options" }).click();
  await expect.element(page.getByRole("menu")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

/* ---------------------------------------------------------------------------
 * Motion (Phase M) — n/a for this file.
 *
 * split-button.tsx has no state-driven icon swap of its own: `ChevronDown` is a
 * static trigger icon, unconditionally rendered whenever `hasMenu` is true — it
 * never changes based on `loading` / `disabled` / `variant` / `size`. The
 * primary half's loading spinner is rendered by `Button` (packages/ui/registry/ui/button.tsx),
 * which is out of scope for this pass (owned by another agent) — no icon in
 * split-button.tsx itself swaps. This test locks in that "no swap" finding so a
 * future change that accidentally introduces state-driven churn on the chevron
 * gets caught.
 * ------------------------------------------------------------------------------*/
test("the chevron trigger icon has no motion class and is stable across a loading change (no state-driven swap in this file)", async () => {
  function Host() {
    const [loading, setLoading] = React.useState(false);
    return (
      <>
        <button type="button" onClick={() => setLoading((v) => !v)}>
          Toggle loading
        </button>
        <SplitButton loading={loading} actions={[{ label: "Save as draft" }]}>
          Save
        </SplitButton>
      </>
    );
  }

  const screen = await render(<Host />);
  const trigger = screen
    .getByRole("button", { name: "More options" })
    .element() as HTMLElement;
  const icon = trigger.querySelector("svg");
  expect(icon).not.toBeNull();
  expect(icon?.classList.contains("motion-pop-in")).toBe(false);

  await screen.getByRole("button", { name: "Toggle loading" }).click();

  const iconAfter = trigger.querySelector("svg");
  // Same node — no remount, confirming there's no keyed-presence swap here.
  expect(iconAfter).toBe(icon);
});

test("forwards ref to the primary action button", async () => {
  // Delegating wrapper: {...props} (carrying ref) is spread onto the primary
  // Button, which forwards onto its <button> host. No code change (Pattern D).
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <SplitButton ref={ref} actions={[{ label: "Save as draft" }]}>
      Save
    </SplitButton>,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("split-button-primary");
});
