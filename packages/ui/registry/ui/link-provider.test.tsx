import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { InlineChip } from "./inline-chip";
import {
  AppLink,
  LinkProvider,
  inAppPath,
  isPlainClick,
  linkAction,
} from "./link-provider";
import { MarkdownView } from "./markdown-view";
import { RecordChip } from "./record-chip";
import { TextEdit } from "./text-edit";

const ORIGIN = "https://app.example.com";

function click(element: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
  element.dispatchEvent(event);
  return event;
}

test("inAppPath: a path, or a full address on the origin, is in-app; anything else is not", () => {
  expect(inAppPath("/tasks/1")).toBe("/tasks/1");
  expect(inAppPath(`${ORIGIN}/tasks/1?x=1#c`, ORIGIN)).toBe("/tasks/1?x=1#c");
  expect(inAppPath("https://example.org/a", ORIGIN)).toBeNull();
  expect(inAppPath(`${ORIGIN}/a`)).toBeNull();
  expect(inAppPath("//evil.example/a", ORIGIN)).toBeNull();
  expect(
    inAppPath("https://app.example.com@evil.example/a", ORIGIN),
  ).toBeNull();
  expect(inAppPath("https://user@app.example.com/a", ORIGIN)).toBeNull();
  expect(inAppPath("mailto:a@example.org", ORIGIN)).toBeNull();
  expect(inAppPath("#section", ORIGIN)).toBeNull();
});

test("linkAction: navigate with a router, the browser without one, a new tab for another origin", () => {
  const navigate = () => {};
  expect(linkAction("/a", { navigate })).toEqual({
    kind: "navigate",
    path: "/a",
  });
  expect(linkAction("/a", {})).toEqual({ kind: "browser", href: "/a" });
  expect(
    linkAction("https://example.org", { navigate, origin: ORIGIN }),
  ).toEqual({
    kind: "external",
    href: "https://example.org",
  });
  expect(linkAction("mailto:a@example.org", { navigate })).toEqual({
    kind: "browser",
    href: "mailto:a@example.org",
  });
});

test("isPlainClick: only a primary click with no modifier", () => {
  const base = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  };
  expect(isPlainClick(base)).toBe(true);
  expect(isPlainClick({ ...base, metaKey: true })).toBe(false);
  expect(isPlainClick({ ...base, ctrlKey: true })).toBe(false);
  expect(isPlainClick({ ...base, shiftKey: true })).toBe(false);
  expect(isPlainClick({ ...base, altKey: true })).toBe(false);
  expect(isPlainClick({ ...base, button: 1 })).toBe(false);
  expect(isPlainClick({ ...base, defaultPrevented: true })).toBe(false);
});

test("AppLink: a plain click on an in-app link navigates in place; a modified click is the browser's", async () => {
  const navigate = vi.fn();
  const screen = await render(
    <LinkProvider navigate={navigate} origin={ORIGIN}>
      <AppLink href={`${ORIGIN}/tasks/42`}>TSK-42</AppLink>
    </LinkProvider>,
  );
  const link = screen.getByRole("link", { name: "TSK-42" }).element();
  expect(link.getAttribute("href")).toBe("/tasks/42");
  expect(link.hasAttribute("target")).toBe(false);
  expect(click(link).defaultPrevented).toBe(true);
  expect(navigate).toHaveBeenCalledWith("/tasks/42");
  navigate.mockClear();
  expect(click(link, { metaKey: true }).defaultPrevented).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("AppLink: another origin opens a new tab and never navigates", async () => {
  const navigate = vi.fn();
  const screen = await render(
    <LinkProvider navigate={navigate} origin={ORIGIN}>
      <AppLink href="https://example.org/spec">Spec</AppLink>
    </LinkProvider>,
  );
  const link = screen.getByRole("link", { name: "Spec" }).element();
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  link.addEventListener("click", (event) => event.preventDefault());
  click(link);
  expect(navigate).not.toHaveBeenCalled();
});

test("AppLink without a provider is a plain link (no router to hand it to)", async () => {
  const screen = await render(<AppLink href="/tasks/1">Task</AppLink>);
  const link = screen.getByRole("link", { name: "Task" }).element();
  link.addEventListener("click", (event) => event.preventDefault());
  expect(link.getAttribute("href")).toBe("/tasks/1");
  expect(link.hasAttribute("target")).toBe(false);
});

test("MarkdownView: an agent's full app address is an in-app link that opens in place; another site opens a new tab", async () => {
  const navigate = vi.fn();
  const screen = await render(
    <LinkProvider navigate={navigate} origin={ORIGIN}>
      <MarkdownView untrusted showLinkDomains>
        {`See [the task](${ORIGIN}/tasks/7) and [the spec](https://example.org/spec).`}
      </MarkdownView>
    </LinkProvider>,
  );
  const task = screen.getByRole("link", { name: "the task" }).element();
  expect(task.getAttribute("href")).toBe("/tasks/7");
  expect(task.hasAttribute("target")).toBe(false);
  expect(task.textContent).toBe("the task");
  expect(click(task).defaultPrevented).toBe(true);
  expect(navigate).toHaveBeenCalledWith("/tasks/7");
  const spec = screen.getByRole("link", { name: /the spec/ }).element();
  expect(spec.getAttribute("target")).toBe("_blank");
  expect(spec.textContent).toContain("(example.org)");
});

test("MarkdownView: a view's own onNavigate wins over the provider", async () => {
  const navigate = vi.fn();
  const own = vi.fn();
  const screen = await render(
    <LinkProvider navigate={navigate} origin={ORIGIN}>
      <MarkdownView onNavigate={own}>{"[Home](/home)"}</MarkdownView>
    </LinkProvider>,
  );
  click(screen.getByRole("link", { name: "Home" }).element());
  expect(own).toHaveBeenCalledWith("/home", expect.anything());
  expect(navigate).not.toHaveBeenCalled();
});

test("InlineChip: with no onOpen, a plain click on a record chip opens it through the provider", async () => {
  const navigate = vi.fn();
  const screen = await render(
    <LinkProvider navigate={navigate} origin={ORIGIN}>
      <InlineChip kind="task" label="Ship it" href="/tasks/3" />
    </LinkProvider>,
  );
  const chip = screen.getByRole("link", { name: /Ship it/ }).element();
  expect(click(chip).defaultPrevented).toBe(true);
  expect(navigate).toHaveBeenCalledWith("/tasks/3");
});

test("RecordChip: its ↗ link follows the provider by default", async () => {
  const navigate = vi.fn();
  const screen = await render(
    <LinkProvider navigate={navigate} origin={ORIGIN}>
      <RecordChip value="Acme" href="/customers/1" linkLabel="Open Acme" />
    </LinkProvider>,
  );
  const link = screen.getByRole("link", { name: "Open Acme" }).element();
  expect(click(link).defaultPrevented).toBe(true);
  expect(navigate).toHaveBeenCalledWith("/customers/1");
});

test("TextEdit, read-only: a plain click on an in-app link opens it in place, not in a new tab", async () => {
  const navigate = vi.fn();
  const screen = await render(
    <LinkProvider navigate={navigate} origin={ORIGIN}>
      <TextEdit
        format="markdown"
        aria-label="Body"
        readOnly
        defaultValue={`See [the table](${ORIGIN}/library/9) and [a site](https://example.org).`}
      />
    </LinkProvider>,
  );
  const table = await screen.getByRole("link", { name: "the table" }).element();
  expect(click(table).defaultPrevented).toBe(true);
  expect(navigate).toHaveBeenCalledWith("/library/9");
  navigate.mockClear();
  const site = screen.container.querySelector(
    'a[href^="https://example.org"]',
  )!;
  site.addEventListener("click", (event) => event.preventDefault());
  click(site);
  expect(navigate).not.toHaveBeenCalled();
});
