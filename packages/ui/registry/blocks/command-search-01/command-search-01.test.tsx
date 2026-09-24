/**
 * `command-search-01.test.tsx` — the block's browser contract: changing scope (chip or Alt+→)
 * re-asks with the same query; results are grouped options, "No results" and the error line with
 * "Try again" have their states; ⌘↵ / Ctrl+↵ opens the selection in a new tab; Enter on a scope
 * chip switches scope rather than opening a result; a `javascript:` href is never followed; a
 * settled search announces its count once, and never "0 results" while in flight; axe-clean.
 */

import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { CommandSearch, type SearchResult } from "./components/command-search";
import { INDEX, sampleSearch } from "./components/sample-search";

const skyline = INDEX.filter((r) => r.title.includes("Skyline"));

test("changing scope re-queries and keeps the query", async () => {
  const search = vi.fn(
    async (
      _q: string,
      _scope: string,
      _signal: AbortSignal,
    ): Promise<SearchResult[]> => skyline,
  );
  const screen = await render(<CommandSearch search={search} defaultOpen />);
  const input = screen.getByRole("combobox");
  await userEvent.type(input, "sky");
  await expect
    .poll(() => search.mock.lastCall?.slice(0, 2))
    .toEqual(["sky", "all"]);
  await expect
    .element(screen.getByRole("option", { name: /Weekly sync with Skyline/ }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
  await expect
    .poll(() => search.mock.lastCall?.slice(0, 2))
    .toEqual(["sky", "meetings"]);
  expect(search.mock.lastCall?.[2]).toBeInstanceOf(AbortSignal);
  await expect.element(input).toHaveValue("sky");
});

test("Mod+Enter opens the selected result in a new tab", async () => {
  const open = vi.spyOn(window, "open").mockImplementation(() => null);
  const screen = await render(
    <CommandSearch search={async () => skyline} defaultOpen />,
  );
  await userEvent.type(screen.getByRole("combobox"), "sky");
  await expect
    .element(screen.getByRole("option", { name: /Weekly sync with Skyline/ }))
    .toBeInTheDocument();
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(open).toHaveBeenCalledWith(skyline[0]!.href, "_blank", "noopener");
  open.mockRestore();
});

test("no results and a failed search have their own states", async () => {
  const empty = await render(
    <CommandSearch search={async () => []} defaultOpen />,
  );
  await userEvent.type(empty.getByRole("combobox"), "zzz");
  await expect
    .poll(
      () => document.querySelector('[data-slot="command-empty"]')?.textContent,
    )
    .toBe("No results");
  // …and the live region says so once, in the same words.
  await expect
    .poll(() =>
      [...document.querySelectorAll('[role="status"]')].some(
        (region) => region.textContent === "No results",
      ),
    )
    .toBe(true);
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await empty.unmount();

  const failing = await render(
    <CommandSearch
      search={async () => {
        throw new Error("offline");
      }}
      defaultOpen
    />,
  );
  await userEvent.type(failing.getByRole("combobox"), "sky");
  await expect
    .element(failing.getByText("Couldn’t search"))
    .toBeInTheDocument();
  expect(
    failing.getByText("Couldn’t search").element().closest('[role="alert"]'),
  ).not.toBeNull();
  await expect
    .element(failing.getByRole("button", { name: "Try again" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("Enter on a scope chip switches scope and opens nothing", async () => {
  const onOpenChange = vi.fn();
  const search = vi.fn(async (): Promise<SearchResult[]> =>
    skyline.map((r) => ({ ...r, href: `#${r.id}` })),
  );
  const screen = await render(
    <CommandSearch search={search} defaultOpen onOpenChange={onOpenChange} />,
  );
  await userEvent.type(screen.getByRole("combobox"), "sky");
  await expect
    .element(screen.getByRole("option", { name: /Weekly sync with Skyline/ }))
    .toBeInTheDocument();
  (
    screen.getByRole("button", { name: "Tasks" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  await expect
    .poll(() => search.mock.lastCall?.slice(0, 2))
    .toEqual(["sky", "tasks"]);
  expect(onOpenChange).not.toHaveBeenCalled();
});

test("a javascript: href is not followed", async () => {
  const onOpenChange = vi.fn();
  const open = vi.spyOn(window, "open").mockImplementation(() => null);
  const unsafe = { ...skyline[0]!, href: "javascript:void(0)" };
  const screen = await render(
    <CommandSearch
      search={async () => [unsafe]}
      defaultOpen
      onOpenChange={onOpenChange}
    />,
  );
  await userEvent.type(screen.getByRole("combobox"), "sky");
  await expect
    .element(screen.getByRole("option", { name: /Weekly sync with Skyline/ }))
    .toBeInTheDocument();
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  await userEvent.keyboard("{Enter}");
  expect(open).not.toHaveBeenCalled();
  expect(onOpenChange).not.toHaveBeenCalled();
  open.mockRestore();
});

test("a settled search announces its count once, and nothing while it is in flight", async () => {
  const spoken: string[] = [];
  const observer = new MutationObserver(() => {
    for (const region of document.querySelectorAll('[role="status"]')) {
      const text = region.textContent?.trim();
      if (text && text !== "Searching…" && spoken.at(-1) !== text)
        spoken.push(text);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  const screen = await render(
    <CommandSearch search={sampleSearch} defaultOpen />,
  );
  await userEvent.type(screen.getByRole("combobox"), "sky");
  const count = INDEX.filter((r) =>
    r.title.toLowerCase().includes("sky"),
  ).length;
  await expect.poll(() => spoken).toContain(`${count} results`);
  await userEvent.clear(screen.getByRole("combobox"));
  await userEvent.type(screen.getByRole("combobox"), "colour");
  await expect.poll(() => spoken).toContain("1 result");
  observer.disconnect();
  expect(spoken).toEqual([`${count} results`, "1 result"]);
});
