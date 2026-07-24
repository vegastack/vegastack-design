import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import { MarketingSurface } from "./marketing-surface";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

test("renders a div by default carrying the scope class + data-slot", async () => {
  const screen = await render(
    <MarketingSurface data-testid="surface">Hero copy</MarketingSurface>,
  );
  const el = screen.getByTestId("surface").element() as HTMLElement;
  expect(el.tagName).toBe("DIV");
  expect(el.dataset.slot).toBe("marketing-surface");
  expect(el.classList.contains("vs-marketing")).toBe(true);
  expect(el.classList.contains("bg-background")).toBe(true);
  expect(el.classList.contains("text-foreground")).toBe(true);
  await expect.element(screen.getByText("Hero copy")).toBeInTheDocument();
});

test("composes a different host element via render", async () => {
  const screen = await render(
    <MarketingSurface render={<section />} data-testid="surface">
      Content
    </MarketingSurface>,
  );
  const el = screen.getByTestId("surface").element() as HTMLElement;
  expect(el.tagName).toBe("SECTION");
  expect(el.dataset.slot).toBe("marketing-surface");
  expect(el.classList.contains("vs-marketing")).toBe(true);
});

test("merges a consumer className alongside the scope class", async () => {
  const screen = await render(
    <MarketingSurface className="px-6" data-testid="surface">
      Content
    </MarketingSurface>,
  );
  const el = screen.getByTestId("surface").element() as HTMLElement;
  expect(el.classList.contains("vs-marketing")).toBe(true);
  expect(el.classList.contains("px-6")).toBe(true);
});

test("forwards ref to the underlying element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<MarketingSurface ref={ref}>Content</MarketingSurface>);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("marketing-surface");
});

test("no a11y violations", async () => {
  const screen = await render(
    <MarketingSurface>
      <h1>Ship agentic UI, fast.</h1>
    </MarketingSurface>,
  );
  await expectNoA11yViolations(screen.container);
});

test("propagates the marketing scope to every portaled dialog layer", async () => {
  const screen = await render(
    <MarketingSurface>
      <Dialog defaultOpen>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Scoped portal</DialogTitle>
        </DialogContent>
      </Dialog>
    </MarketingSurface>,
  );

  await expect
    .element(screen.getByRole("dialog", { name: "Scoped portal" }))
    .toBeInTheDocument();
  for (const slot of ["dialog-backdrop", "dialog-viewport", "dialog-content"]) {
    const layer = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    expect(layer, `expected ${slot} to render`).not.toBeNull();
    expect(layer?.classList.contains("vs-marketing")).toBe(true);
  }
});

test("leaves the same portaled dialog layers unscoped outside MarketingSurface", async () => {
  const screen = await render(
    <Dialog defaultOpen>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Page-theme portal</DialogTitle>
      </DialogContent>
    </Dialog>,
  );

  await expect
    .element(screen.getByRole("dialog", { name: "Page-theme portal" }))
    .toBeInTheDocument();
  for (const slot of ["dialog-backdrop", "dialog-viewport", "dialog-content"]) {
    const layer = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    expect(layer, `expected ${slot} to render`).not.toBeNull();
    expect(layer?.classList.contains("vs-marketing")).toBe(false);
  }
});

test("propagates the scope to floating positioner, surface, and viewport layers", async () => {
  const screen = await render(
    <MarketingSurface>
      <Popover defaultOpen>
        <PopoverTrigger>Anchor</PopoverTrigger>
        <PopoverContent viewportProps={{ className: "consumer-viewport" }}>
          Scoped floating portal
        </PopoverContent>
      </Popover>
    </MarketingSurface>,
  );

  await expect
    .element(screen.getByText("Scoped floating portal"))
    .toBeInTheDocument();
  for (const slot of [
    "popover-positioner",
    "popover-content",
    "popover-viewport",
  ]) {
    const layer = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    expect(layer, `expected ${slot} to render`).not.toBeNull();
    expect(layer?.classList.contains("vs-marketing")).toBe(true);
  }
});

test("propagates the scope to Select positioner and popup layers", async () => {
  const screen = await render(
    <MarketingSurface>
      <Select items={[{ label: "Scoped option", value: "Scoped option" }]}>
        <SelectTrigger aria-label="Scoped select">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Scoped option">Scoped option</SelectItem>
        </SelectContent>
      </Select>
    </MarketingSurface>,
  );

  await screen.getByRole("combobox", { name: "Scoped select" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Scoped option" }))
    .toBeInTheDocument();
  for (const slot of ["select-positioner", "select-content"]) {
    const layer = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    expect(layer, `expected ${slot} to render`).not.toBeNull();
    expect(layer?.classList.contains("vs-marketing")).toBe(true);
  }
});

test("propagates the scope to Combobox positioner and popup layers", async () => {
  const items = ["Scoped result"];
  const screen = await render(
    <MarketingSurface>
      <Combobox items={items}>
        <ComboboxInput aria-label="Scoped combobox" />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </MarketingSurface>,
  );

  await screen.getByRole("combobox", { name: "Scoped combobox" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Scoped result" }))
    .toBeInTheDocument();
  for (const slot of ["combobox-positioner", "combobox-content"]) {
    const layer = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    expect(layer, `expected ${slot} to render`).not.toBeNull();
    expect(layer?.classList.contains("vs-marketing")).toBe(true);
  }
});
