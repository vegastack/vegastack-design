import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { SearchInput } from "./search-input";

test("controlled pointer clear reports one empty value and restores focus", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <SearchInput
      value="regent"
      onValueChange={onValueChange}
      aria-label="Search"
    />,
  );
  const input = screen.getByRole("searchbox", { name: "Search" });
  await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenLastCalledWith("");
  expect(document.activeElement).toBe(input.element());
});

test.each(["Enter", " "])("keyboard clear via %s reports once", async (key) => {
  const onValueChange = vi.fn();
  const screen = await render(
    <SearchInput
      value="regent"
      onValueChange={onValueChange}
      aria-label="Search"
    />,
  );
  const input = screen.getByRole("searchbox", { name: "Search" });
  const clear = screen.getByRole("button", { name: "Clear search" });
  (clear.element() as HTMLElement).focus();
  await userEvent.keyboard(key === "Enter" ? "{Enter}" : " ");
  expect(onValueChange).toHaveBeenCalledOnce();
  expect(onValueChange).toHaveBeenCalledWith("");
  expect(document.activeElement).toBe(input.element());
});

test("controlled typing and external updates follow the owner", async () => {
  const onValueChange = vi.fn();
  function Fixture() {
    const [value, setValue] = React.useState("regent");
    return (
      <>
        <SearchInput
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          aria-label="Search"
        />
        <button type="button" onClick={() => setValue("external")}>
          Set
        </button>
      </>
    );
  }
  const screen = await render(<Fixture />);
  const input = screen.getByRole("searchbox", { name: "Search" });
  await input.fill("design");
  expect(onValueChange).toHaveBeenCalledOnce();
  expect(onValueChange).toHaveBeenCalledWith("design");
  await screen.getByRole("button", { name: "Set" }).click();
  await expect.element(input).toHaveValue("external");
});

test("uncontrolled input follows typing, clear, and native form reset", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <form>
      <SearchInput
        defaultValue="regent"
        name="query"
        aria-label="Search"
        onValueChange={onValueChange}
      />
      <button type="reset">Reset</button>
    </form>,
  );
  const input = screen.getByRole("searchbox", { name: "Search" });
  await input.fill("design");
  await screen.getByRole("button", { name: "Clear search" }).click();
  await expect.element(input).toHaveValue("");
  expect(onValueChange).toHaveBeenLastCalledWith("");
  await screen.getByRole("button", { name: "Reset" }).click();
  await expect.element(input).toHaveValue("regent");
  await expect
    .element(screen.getByRole("button", { name: "Clear search" }))
    .toBeInTheDocument();
});

test("Escape clears a filled input once and is a no-op when empty", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <SearchInput
      defaultValue="regent"
      onValueChange={onValueChange}
      aria-label="Search"
    />,
  );
  const input = screen.getByRole("searchbox", { name: "Search" });
  await input.click();
  await userEvent.keyboard("{Escape}");
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenCalledWith("");
  await userEvent.keyboard("{Escape}");
  expect(onValueChange).toHaveBeenCalledTimes(1);
});

test("forwards the input ref, attributes, handlers, and form value", async () => {
  const ref = React.createRef<HTMLInputElement>();
  const onInput = vi.fn();
  const screen = await render(
    <form>
      <label htmlFor="query">Query</label>
      <p id="hint">Search all records</p>
      <SearchInput
        ref={ref}
        id="query"
        name="query"
        required
        autoComplete="off"
        aria-describedby="hint"
        aria-invalid="true"
        onInput={onInput}
      />
    </form>,
  );
  const input = screen.getByRole("searchbox", { name: "Query" });
  expect(ref.current).toBe(input.element());
  await expect.element(input).toHaveAttribute("name", "query");
  await expect.element(input).toHaveAttribute("required");
  await expect.element(input).toHaveAttribute("autocomplete", "off");
  await expect.element(input).toHaveAttribute("aria-describedby", "hint");
  await input.fill("regent");
  expect(onInput).toHaveBeenCalled();
  expect(
    new FormData((input.element() as HTMLInputElement).form!).get("query"),
  ).toBe("regent");
});

test.each([
  ["empty", { value: "" }],
  ["disabled", { value: "regent", disabled: true }],
  ["read only", { value: "regent", readOnly: true }],
] as const)("%s input exposes no clear action", async (_state, props) => {
  const screen = await render(<SearchInput aria-label="Search" {...props} />);
  expect(
    screen.container.querySelector('[data-slot="search-input-clear"]'),
  ).toBeNull();
});

test("supports a custom clear label and suppresses the native cancel control", async () => {
  const screen = await render(
    <SearchInput
      defaultValue="regent"
      aria-label="Search"
      clearLabel="Remove query"
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Remove query" }))
    .toBeInTheDocument();
  expect(
    (screen.getByRole("searchbox", { name: "Search" }).element() as HTMLElement)
      .className,
  ).toContain("search-cancel-button");
});

test("renders logical icon order in RTL", async () => {
  const screen = await render(
    <div dir="rtl">
      <SearchInput defaultValue="بحث" aria-label="بحث" />
    </div>,
  );
  const group = screen.container.querySelector('[data-slot="search-input"]')!;
  const addons = group.querySelectorAll('[data-slot="input-group-addon"]');
  expect(addons[0]?.getAttribute("data-align")).toBe("inline-start");
  expect(addons[1]?.getAttribute("data-align")).toBe("inline-end");
});

test("Tab moves from the input to the clear action", async () => {
  const screen = await render(
    <SearchInput defaultValue="regent" aria-label="Search" />,
  );
  await screen.getByRole("searchbox", { name: "Search" }).click();
  await userEvent.keyboard("{Tab}");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Clear search" }).element(),
  );
});

test("stays contained at a 320px viewport", async () => {
  await page.viewport(320, 480);
  const screen = await render(
    <div style={{ width: "100%" }}>
      <SearchInput defaultValue="regent" aria-label="Search" />
    </div>,
  );
  const group = screen.container.querySelector(
    '[data-slot="search-input"]',
  ) as HTMLElement;
  expect(group.getBoundingClientRect().right).toBeLessThanOrEqual(320);
});

test("clear target is 24px and remains unobstructed", async () => {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="search-input"] { display: flex; width: 240px; }
    [data-slot="search-input-clear"] { display: inline-flex; box-sizing: border-box; width: 24px; height: 24px; }
  `;
  document.head.appendChild(style);
  try {
    const screen = await render(
      <SearchInput defaultValue="regent" aria-label="Search" />,
    );
    const button = screen
      .getByRole("button", { name: "Clear search" })
      .element() as HTMLElement;
    const rect = button.getBoundingClientRect();
    expect(rect.width).toBe(24);
    expect(rect.height).toBe(24);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const half = 12 - 0.5;
    const samples = [
      [centerX - half, centerY],
      [centerX + half, centerY],
      [centerX, centerY - half],
      [centerX, centerY + half],
      [centerX, centerY],
    ] as const;
    for (const [x, y] of samples) {
      const hit = document.elementFromPoint(x, y);
      expect(hit === button || button.contains(hit)).toBe(true);
    }
  } finally {
    style.remove();
  }
});

test.each(["light", "dark"])(
  "has no axe violations in %s mode",
  async (theme) => {
    const screen = await render(
      <div className={theme === "dark" ? "dark" : undefined}>
        <SearchInput defaultValue="regent" aria-label="Search" />
      </div>,
    );
    await expectNoA11yViolations(screen.container);
  },
);

// The clear button's addon stays inside the group box. Upstream's inline-end addon carries
// `has-[>button]:me-[-0.3rem]`, which put its box ~4px past the group's edge and made any container
// the SearchInput filled overflow by that much; the clear button itself keeps its position.
test("the clear addon stays inside the group, and the clear button keeps its inset", async () => {
  const screen = await render(
    <div style={{ width: 200 }}>
      <SearchInput defaultValue="Regent" aria-label="Search" />
    </div>,
  );
  const group = screen.container
    .querySelector('[data-slot="search-input"]')!
    .getBoundingClientRect();
  const addon = screen.container
    .querySelector('[data-slot="search-input-clear"]')!
    .closest('[data-slot="input-group-addon"]')!
    .getBoundingClientRect();
  const clear = screen.container
    .querySelector('[data-slot="search-input-clear"]')!
    .getBoundingClientRect();
  expect(addon.right).toBeLessThanOrEqual(group.right);
  // 1px border + ~4px of padding: the button sits where upstream's margin/padding pair put it.
  expect(group.right - clear.right).toBeGreaterThanOrEqual(4);
  expect(group.right - clear.right).toBeLessThanOrEqual(6);
});
