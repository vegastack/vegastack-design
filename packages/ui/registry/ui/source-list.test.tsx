import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { MarkdownView } from "./markdown-view";
import {
  SiteIcon,
  SourceList,
  siteOf,
  sourceCitations,
  type WebSource,
} from "./source-list";

const SOURCES: WebSource[] = [
  {
    href: "https://www.ies.org/standards/tm-21",
    title: "TM-21-21",
    icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/>",
  },
  { href: "https://cibse.org/lg7" },
];

test("closed it is one line, 'Sources · 2'; open, one numbered row per page", async () => {
  const screen = await render(<SourceList sources={SOURCES} />);
  const trigger = screen.getByRole("button", { name: /Sources · 2/ });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await expectNoA11yViolations(screen.container);
  await userEvent.click(trigger);
  const list = screen.getByRole("list", { name: "Sources" });
  await expect.element(list).toBeVisible();
  const rows = [...list.element().querySelectorAll<HTMLAnchorElement>("a")];
  expect(rows.map((row) => row.getAttribute("href"))).toEqual([
    "https://www.ies.org/standards/tm-21",
    "https://cibse.org/lg7",
  ]);
  expect(rows[0]!.textContent).toBe("1TM-21-21ies.org(opens in new tab)");
  // A page with no title shows its site once, not twice.
  expect(rows[1]!.textContent).toBe("2cibse.org(opens in new tab)");
  expect(rows.every((row) => row.target === "_blank")).toBe(true);
  await expectNoA11yViolations(screen.container);
});

test("no sources, no list", async () => {
  const screen = await render(<SourceList sources={[]} />);
  expect(
    screen.container.querySelector('[data-slot="source-list"]'),
  ).toBeNull();
});

test("a site's icon sits on a light tile in dark mode; a missing one is a globe", async () => {
  const screen = await render(
    <>
      <SiteIcon src={SOURCES[0]!.icon} />
      <SiteIcon />
    </>,
  );
  const [withImage, fallback] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="site-icon"]',
  );
  expect(withImage!.className).toContain("dark:bg-foreground");
  expect(withImage!.dataset.fallback).toBeUndefined();
  expect(fallback!.dataset.fallback).toBe("");
  expect(fallback!.querySelector("svg")).not.toBeNull();
});

test("siteOf drops www and falls back to the address", () => {
  expect(siteOf({ href: "https://www.ies.org/x" })).toBe("ies.org");
  expect(siteOf({ href: "https://a.b/x", site: "Named" })).toBe("Named");
  expect(siteOf({ href: "not a url" })).toBe("not a url");
});

test("sourceCitations: [[n]] is page n, named by its title; past the list stays text", async () => {
  const screen = await render(
    <MarkdownView citation={sourceCitations(SOURCES)}>
      {"Drift needs 6,000 h [[1]], glare UGR 19 [[3]]."}
    </MarkdownView>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Source 1: TM-21-21" }))
    .toBeVisible();
  expect(screen.container.textContent).toContain("[[3]]");
});
