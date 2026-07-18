import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { Mail, User } from "lucide-react";
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

/* ------------------------------------------------------------------------------------------------
 * Structure / roles
 * ----------------------------------------------------------------------------------------------*/

test("renders title and description content", async () => {
  const screen = await render(
    <ItemGroup>
      <Item>
        <ItemContent>
          <ItemTitle>New message</ItemTitle>
          <ItemDescription>Ada Lovelace sent you a message.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  await expect.element(screen.getByText("New message")).toBeInTheDocument();
  await expect.element(screen.getByText("Ada Lovelace sent you a message.")).toBeInTheDocument();
});

test("Item defaults to role=listitem, data-slot=item", async () => {
  const screen = await render(
    <ItemGroup>
      <Item>
        <ItemContent>
          <ItemTitle>Row</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  const item = screen.container.querySelector('[data-slot="item"]');
  expect(item).not.toBeNull();
  expect(item).toHaveAttribute("role", "listitem");
});

test("ItemGroup exposes role=list and groups multiple Items", async () => {
  const screen = await render(
    <ItemGroup>
      <Item>
        <ItemContent>
          <ItemTitle>First</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemContent>
          <ItemTitle>Second</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  const group = screen.container.querySelector('[data-slot="item-group"]');
  expect(group).toHaveAttribute("role", "list");
  const items = screen.container.querySelectorAll('[data-slot="item"][role="listitem"]');
  expect(items.length).toBe(2);
});

test("a role prop explicitly passed overrides the listitem default", async () => {
  const screen = await render(
    <Item role="button">
      <ItemContent>
        <ItemTitle>Custom role</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const item = screen.container.querySelector('[data-slot="item"]');
  expect(item).toHaveAttribute("role", "button");
});

test("an interactive (render prop) Item does not default to role=listitem", async () => {
  const screen = await render(
    <Item render={<a href="#detail" />}>
      <ItemContent>
        <ItemTitle>Open detail</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const item = screen.container.querySelector('[data-slot="item"]');
  // Forcing `listitem` here would clobber the anchor's native `link` role (ARIA has no dual-role
  // concept) and hide the interactive affordance from assistive tech.
  expect(item).not.toHaveAttribute("role");
});

/* ------------------------------------------------------------------------------------------------
 * Variants
 * ----------------------------------------------------------------------------------------------*/

test("applies variant and size data attributes", async () => {
  const screen = await render(
    <Item variant="outline" size="sm">
      <ItemContent>
        <ItemTitle>Row</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const item = screen.container.querySelector('[data-slot="item"]');
  expect(item).toHaveAttribute("data-variant", "outline");
  expect(item).toHaveAttribute("data-size", "sm");
});

test("defaults to variant=default and size=default", async () => {
  const screen = await render(
    <Item>
      <ItemContent>
        <ItemTitle>Row</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const item = screen.container.querySelector('[data-slot="item"]');
  expect(item).toHaveAttribute("data-variant", "default");
  expect(item).toHaveAttribute("data-size", "default");
});

test.each(["default", "icon", "image"] as const)(
  "ItemMedia variant=%s applies the data-variant attribute",
  async (variant) => {
    const screen = await render(
      <Item>
        <ItemMedia variant={variant}>
          {variant === "image" ? <img src="/avatar.png" alt="" /> : <Mail />}
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Row</ItemTitle>
        </ItemContent>
      </Item>,
    );
    const media = screen.container.querySelector('[data-slot="item-media"]');
    expect(media).toHaveAttribute("data-variant", variant);
  },
);

/* ------------------------------------------------------------------------------------------------
 * ItemSeparator semantics
 * ----------------------------------------------------------------------------------------------*/

test("ItemSeparator renders as a decorative, presentational divider", async () => {
  const screen = await render(
    <ItemGroup>
      <Item>
        <ItemContent>
          <ItemTitle>First</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>Second</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  const separator = screen.container.querySelector('[data-slot="item-separator"]');
  expect(separator).not.toBeNull();
  // Decorative Separator (the default) → role="presentation" + aria-hidden, so it never
  // violates the ARIA "list" owned-elements contract on the surrounding role="list" group.
  expect(separator).toHaveAttribute("role", "presentation");
  expect(separator).toHaveAttribute("aria-hidden", "true");
});

/* ------------------------------------------------------------------------------------------------
 * render prop (interactive link item) + keyboard focus
 * ----------------------------------------------------------------------------------------------*/

test("renders the whole row as a link via the render prop", async () => {
  const screen = await render(
    <Item render={<a href="/settings/billing" />}>
      <ItemContent>
        <ItemTitle>Billing</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const link = screen.getByRole("link", { name: "Billing" });
  await expect.element(link).toHaveAttribute("href", "/settings/billing");
  await expect.element(link).toHaveAttribute("data-slot", "item");
  // The native `link` role is kept — NOT overridden by the `listitem` default — so the row
  // stays discoverable via `getByRole("link", …)` and announces as a link to assistive tech.
  await expect.element(link).not.toHaveAttribute("role");
});

test("a link item is keyboard-focusable and activates on Enter", async () => {
  const onClick = () => {
    clicked = true;
  };
  let clicked = false;
  const screen = await render(
    <Item render={<a href="#detail" onClick={onClick} />}>
      <ItemContent>
        <ItemTitle>Open detail</ItemTitle>
      </ItemContent>
    </Item>,
  );
  const link = screen.getByRole("link", { name: "Open detail" }).element() as HTMLAnchorElement;
  link.focus();
  expect(document.activeElement).toBe(link);
  await userEvent.keyboard("{Enter}");
  expect(clicked).toBe(true);
});

test("Tab moves focus onto a link item and past a non-interactive item", async () => {
  const screen = await render(
    <ItemGroup>
      <Item>
        <ItemContent>
          <ItemTitle>Not interactive</ItemTitle>
        </ItemContent>
      </Item>
      <Item render={<a href="#next" />}>
        <ItemContent>
          <ItemTitle>Interactive</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  const link = screen.getByRole("link", { name: "Interactive" }).element();
  document.body.focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(link);
});

/* ------------------------------------------------------------------------------------------------
 * Refs
 * ----------------------------------------------------------------------------------------------*/

test("forwards refs to each part's root element", async () => {
  const itemRef = React.createRef<HTMLDivElement>();
  const mediaRef = React.createRef<HTMLDivElement>();
  const contentRef = React.createRef<HTMLDivElement>();
  const titleRef = React.createRef<HTMLDivElement>();
  const descRef = React.createRef<HTMLParagraphElement>();
  const actionsRef = React.createRef<HTMLDivElement>();

  await render(
    <Item ref={itemRef}>
      <ItemMedia ref={mediaRef}>
        <User />
      </ItemMedia>
      <ItemContent ref={contentRef}>
        <ItemTitle ref={titleRef}>Row</ItemTitle>
        <ItemDescription ref={descRef}>Details</ItemDescription>
      </ItemContent>
      <ItemActions ref={actionsRef}>
        <button type="button">Act</button>
      </ItemActions>
    </Item>,
  );

  expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  expect(itemRef.current?.dataset.slot).toBe("item");
  expect(mediaRef.current).toBeInstanceOf(HTMLDivElement);
  expect(mediaRef.current?.dataset.slot).toBe("item-media");
  expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  expect(contentRef.current?.dataset.slot).toBe("item-content");
  expect(titleRef.current).toBeInstanceOf(HTMLDivElement);
  expect(titleRef.current?.dataset.slot).toBe("item-title");
  expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
  expect(descRef.current?.dataset.slot).toBe("item-description");
  expect(actionsRef.current).toBeInstanceOf(HTMLDivElement);
  expect(actionsRef.current?.dataset.slot).toBe("item-actions");
});

/* ------------------------------------------------------------------------------------------------
 * Accessibility — axe across variants / sizes / media types / composed states
 * ----------------------------------------------------------------------------------------------*/

test("no a11y violations: default group with media, header, actions, footer", async () => {
  const screen = await render(
    <ItemGroup>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Mail />
        </ItemMedia>
        <ItemContent>
          <ItemHeader>
            <ItemTitle>New message</ItemTitle>
          </ItemHeader>
          <ItemDescription>Ada Lovelace sent you a message.</ItemDescription>
          <ItemFooter>
            <span>2 minutes ago</span>
          </ItemFooter>
        </ItemContent>
        <ItemActions>
          <button type="button">View</button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="muted" size="sm">
        <ItemMedia variant="image">
          <img src="/avatar.png" alt="" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Ada Lovelace</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test.each(["default", "outline", "muted"] as const)(
  "no a11y violations: variant=%s",
  async (variant) => {
    const screen = await render(
      <ItemGroup>
        <Item variant={variant}>
          <ItemContent>
            <ItemTitle>Row</ItemTitle>
            <ItemDescription>Supporting text.</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>,
    );
    await expectNoA11yViolations(screen.container);
  },
);

test("no a11y violations: link item (render prop)", async () => {
  // NOT wrapped in ItemGroup: an interactive Item keeps its native `link`/`button` role (see the
  // Item JSDoc), so a role="list" ItemGroup around ONLY interactive rows would fail axe's
  // aria-required-children rule (a `list` requires `listitem`/`none`/`presentation` children).
  // Interactive rows are composed standalone, or alongside non-interactive rows within a group.
  const screen = await render(
    <Item render={<a href="/settings/billing" />}>
      <ItemMedia variant="icon">
        <User />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Billing</ItemTitle>
        <ItemDescription>Manage your plan and payment method.</ItemDescription>
      </ItemContent>
    </Item>,
  );
  await expectNoA11yViolations(screen.container);
});
