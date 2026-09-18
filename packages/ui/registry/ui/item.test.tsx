import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";

/** Upstream's three variants (docs § Variant). */
const VARIANTS = ["default", "outline", "muted"] as const;

/** Upstream's three size tiers (docs § Size). */
const SIZES = ["default", "sm", "xs"] as const;

/** Upstream's three media variants (docs § API Reference — ItemMedia). */
const MEDIA_VARIANTS = ["default", "icon", "image"] as const;

/** The canonical source as text, for the deviation assertions below. */
const SOURCE =
  Object.values(
    import.meta.glob<string>("./item.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
      // The repo's ambient `ImportMeta.glob` (declared in animated-icons.test.tsx) is narrower
      // than Vite's own signature; the assertion re-widens it without loosening the call.
    } as { eager: true }),
  )[0] ?? "";

/** The class string `itemVariants` produced for one combination, read off the rendered root. */
async function rootClasses(
  variant: (typeof VARIANTS)[number],
  size: (typeof SIZES)[number],
): Promise<string> {
  const screen = await render(
    <Item variant={variant} size={size}>
      <ItemContent>
        <ItemTitle>Title</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const root = screen.container.querySelector("[data-slot=item]");
  return root?.className ?? "";
}

test("renders a div carrying data-slot, data-variant and data-size", async () => {
  const screen = await render(
    <Item>
      <ItemContent>
        <ItemTitle>Basic Item</ItemTitle>
      </ItemContent>
    </Item>,
  );
  await expect.element(screen.getByText("Basic Item")).toBeInTheDocument();
  const root = screen.container.querySelector("[data-slot=item]");
  expect(root?.tagName).toBe("DIV");
  expect(root?.getAttribute("data-variant")).toBe("default");
  expect(root?.getAttribute("data-size")).toBe("default");
});

test("every exported part renders with its own data-slot", async () => {
  const screen = await render(
    <ItemGroup>
      <Item>
        <ItemHeader>Header</ItemHeader>
        <ItemMedia variant="icon">
          <svg aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Title</ItemTitle>
          <ItemDescription>Description</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button type="button">Action</button>
        </ItemActions>
        <ItemFooter>Footer</ItemFooter>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>Second</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  for (const slot of [
    "item-group",
    "item",
    "item-header",
    "item-media",
    "item-content",
    "item-title",
    "item-description",
    "item-actions",
    "item-footer",
    "item-separator",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${slot}"]`),
    ).not.toBeNull();
  }
});

test("Variant: every upstream variant produces its own class string", async () => {
  const seen = new Set<string>();
  for (const variant of VARIANTS)
    seen.add(await rootClasses(variant, "default"));
  expect(seen.size).toBe(VARIANTS.length);
});

test("Variant: the rendered root carries the fill and border it was asked for", async () => {
  expect(await rootClasses("default", "default")).toContain(
    "border-transparent",
  );
  expect(await rootClasses("outline", "default")).toContain("border-border");
  expect(await rootClasses("muted", "default")).toContain("bg-muted/50");
});

test("Size: every upstream size stamps its own data-size, and xs has its own recipe", async () => {
  const seen = new Set<string>();
  for (const size of SIZES) {
    const screen = await render(
      <Item size={size}>
        <ItemContent>
          <ItemTitle>Title</ItemTitle>
        </ItemContent>
      </Item>,
    );
    const root = screen.container.querySelector("[data-slot=item]");
    expect(root?.getAttribute("data-size")).toBe(size);
    seen.add(root?.getAttribute("data-size") ?? "");
  }
  expect(seen.size).toBe(SIZES.length);

  // Upstream deliberately gives `default` and `sm` the SAME padding recipe; the two tiers differ
  // through `data-size`, which the descendant selectors on ItemMedia/ItemContent/ItemDescription
  // key on. Asserting three distinct class strings here would be asserting a fiction.
  const xs = await rootClasses("default", "xs");
  expect(xs).toContain("gap-2 px-2.5 py-2");
  expect(xs).not.toBe(await rootClasses("default", "default"));
  expect(await rootClasses("default", "default")).toBe(
    await rootClasses("default", "sm"),
  );
});

test("Composition: header and footer take a full basis, so they leave the media row", async () => {
  const screen = await render(
    <Item>
      <ItemHeader>Header</ItemHeader>
      <ItemContent>
        <ItemTitle>Title</ItemTitle>
      </ItemContent>
      <ItemFooter>Footer</ItemFooter>
    </Item>,
  );
  const header = screen.container.querySelector("[data-slot=item-header]");
  const footer = screen.container.querySelector("[data-slot=item-footer]");
  expect(header?.className).toContain("basis-full");
  expect(footer?.className).toContain("basis-full");
  // The root wraps, which is what makes a full basis break onto its own line.
  expect(
    screen.container.querySelector("[data-slot=item]")?.className,
  ).toContain("flex-wrap");
});

test("Item vs Field: an Item is content, so it takes no role and no tabindex of its own", async () => {
  const screen = await render(
    <Item>
      <ItemContent>
        <ItemTitle>Title</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const root = screen.container.querySelector("[data-slot=item]");
  expect(root?.hasAttribute("role")).toBe(false);
  expect(root?.hasAttribute("tabindex")).toBe(false);
});

test("Icon: ItemMedia variant=icon sizes an unsized svg and marks the media", async () => {
  const screen = await render(
    <Item>
      <ItemMedia variant="icon">
        <svg aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Security Alert</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const media = screen.container.querySelector("[data-slot=item-media]");
  expect(media?.getAttribute("data-variant")).toBe("icon");
  expect(media?.className).toContain("[&_svg:not([class*='size-'])]:size-4");
});

test("Avatar: the default media variant adds no fill of its own", async () => {
  const screen = await render(
    <Item>
      <ItemMedia>
        <span data-slot="avatar">AL</span>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Grace Hopper</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const media = screen.container.querySelector("[data-slot=item-media]");
  expect(media?.getAttribute("data-variant")).toBe("default");
  expect(media?.className).toContain("bg-transparent");
});

test("Image: ItemMedia variant=image is a clipped square that tracks the item size", async () => {
  const screen = await render(
    <Item>
      <ItemMedia variant="image">
        <img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Midnight City Lights</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const media = screen.container.querySelector("[data-slot=item-media]");
  expect(media?.className).toContain("size-10");
  expect(media?.className).toContain("overflow-hidden");
  expect(media?.className).toContain("group-data-[size=sm]/item:size-8");
  expect(media?.className).toContain("group-data-[size=xs]/item:size-6");
});

test("Image: every ItemMedia variant produces its own class string", async () => {
  const seen = new Set<string>();
  for (const variant of MEDIA_VARIANTS) {
    const screen = await render(
      <Item>
        <ItemMedia variant={variant}>
          <svg aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Title</ItemTitle>
        </ItemContent>
      </Item>,
    );
    const media = screen.container.querySelector("[data-slot=item-media]");
    seen.add(media?.className ?? "");
  }
  expect(seen.size).toBe(MEDIA_VARIANTS.length);
});

test("Group: ItemGroup is a list, and ItemSeparator rules between its items", async () => {
  const screen = await render(
    <ItemGroup>
      <Item role="listitem">
        <ItemContent>
          <ItemTitle>ada</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item role="listitem">
        <ItemContent>
          <ItemTitle>linus</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  const list = screen.getByRole("list");
  await expect.element(list).toHaveAttribute("data-slot", "item-group");
  expect(list.element().querySelectorAll('[role="listitem"]').length).toBe(2);
  const separator = screen.container.querySelector(
    "[data-slot=item-separator]",
  );
  expect(separator?.getAttribute("role")).toBe("separator");
  expect(separator?.className).toContain("my-2");
});

test("Group: the group tightens its own gap for the smaller item sizes", async () => {
  const screen = await render(
    <ItemGroup>
      <Item size="sm">
        <ItemContent>
          <ItemTitle>ada</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  const group = screen.container.querySelector("[data-slot=item-group]");
  expect(group?.className).toContain("has-data-[size=sm]:gap-2.5");
  expect(group?.className).toContain("has-data-[size=xs]:gap-2");
});

test("Header: ItemHeader spans the row and justifies its ends", async () => {
  const screen = await render(
    <Item>
      <ItemHeader>
        <span>Cover</span>
      </ItemHeader>
      <ItemContent>
        <ItemTitle>vs-1.5-sm</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const header = screen.container.querySelector("[data-slot=item-header]");
  expect(header?.className).toContain("basis-full");
  expect(header?.className).toContain("justify-between");
});

test("Link: render turns the item into an anchor that keeps its recipe", async () => {
  const screen = await render(
    <Item render={<a href="#docs" />}>
      <ItemContent>
        <ItemTitle>Visit our documentation</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const link = screen.getByRole("link", { name: "Visit our documentation" });
  await expect.element(link).toHaveAttribute("href", "#docs");
  await expect.element(link).toHaveAttribute("data-slot", "item");
  expect(link.element().className).toContain("[a]:hover:bg-muted");
});

test("Dropdown: the xs tier drops its padding inside a dropdown menu content", async () => {
  expect(await rootClasses("default", "xs")).toContain(
    "in-data-[slot=dropdown-menu-content]:p-0",
  );
});

test("RTL: the recipe is written in logical properties, never left/right", async () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const classes = await rootClasses(variant, size);
      expect(classes).not.toMatch(/(?:^|\s)(?:ml|mr|pl|pr|left|right)-/);
    }
  }
});

test("FOC-1/FOC-6: no focus glow and no outline suppression anywhere in the recipe", async () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const classes = await rootClasses(variant, size);
      expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
      expect(classes).not.toContain("focus-visible:ring-");
      expect(classes).not.toContain("focus-visible:border-ring");
      expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
    }
  }
});

test("FOC-1/FOC-6: the itemVariants literal itself carries no ring and no outline-none", async () => {
  const match = /const itemVariants = cva\(\s*"([^"]*)"/.exec(SOURCE);
  expect(match).not.toBeNull();
  const recipe = match?.[1] ?? "";
  expect(recipe.length).toBeGreaterThan(0);
  expect(recipe).not.toContain("ring-3");
  expect(recipe).not.toContain("ring-[3px]");
  expect(recipe).not.toContain("focus-visible:ring-");
  expect(recipe).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
});

test("LAY-11: ItemTitle never clamps on the element that is also a flex container", async () => {
  const screen = await render(
    <Item>
      <ItemContent>
        <ItemTitle>
          <span className="truncate">A very long song title</span>
        </ItemTitle>
      </ItemContent>
    </Item>,
  );
  const title = screen.container.querySelector("[data-slot=item-title]");
  expect(title?.className).toContain("flex");
  expect(title?.className).not.toMatch(/line-clamp-/);
  expect(title?.className).not.toContain("truncate");
  // The clamp lives on the inner span instead.
  expect(title?.querySelector("span")?.className).toContain("truncate");
});

test("DOC-2: the canonical source imports cn from the published package", async () => {
  expect(SOURCE).toContain('from "@vegastack/design"');
  expect(SOURCE).not.toContain('from "cn"');
});

test("no a11y violations — a basic item with actions", async () => {
  const screen = await render(
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>Basic Item</ItemTitle>
        <ItemDescription>A simple item.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <button type="button">Action</button>
      </ItemActions>
    </Item>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a group of list items", async () => {
  const screen = await render(
    <ItemGroup>
      <Item role="listitem">
        <ItemContent>
          <ItemTitle>ada</ItemTitle>
        </ItemContent>
      </Item>
      <Item role="listitem">
        <ItemContent>
          <ItemTitle>linus</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a group whose separators are hidden from the a11y tree", async () => {
  // `role="list"` admits only `listitem` children, so a bare `ItemSeparator` between two rows is a
  // critical `aria-required-children` violation — upstream's own § API Reference composition. The
  // rule itself is a divider: the list already conveys the separation, so hide it.
  const screen = await render(
    <ItemGroup>
      <Item role="listitem">
        <ItemContent>
          <ItemTitle>ada</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator aria-hidden="true" />
      <Item role="listitem">
        <ItemContent>
          <ItemTitle>linus</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — an item rendered as a link", async () => {
  const screen = await render(
    <Item render={<a href="#docs" />}>
      <ItemContent>
        <ItemTitle>Visit our documentation</ItemTitle>
        <ItemDescription>Learn how to get started.</ItemDescription>
      </ItemContent>
    </Item>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — every variant and size", async () => {
  const screen = await render(
    <div>
      {VARIANTS.map((variant) =>
        SIZES.map((size) => (
          <Item key={`${variant}-${size}`} variant={variant} size={size}>
            <ItemMedia variant="icon">
              <svg aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{`${variant} ${size}`}</ItemTitle>
            </ItemContent>
          </Item>
        )),
      )}
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
