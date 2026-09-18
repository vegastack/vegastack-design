import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { Button } from "./button";
import { DirectionProvider } from "./direction";
import { Field, FieldGroup, FieldLabel } from "./field";
import { Input } from "./input";

const slot = (name: string, root: ParentNode = document) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const slots = (name: string, root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

function Subject(props: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible {...props}>
      <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
      <CollapsibleContent>
        Yes. Free to use for personal and commercial projects.
      </CollapsibleContent>
    </Collapsible>
  );
}

test("renders every exported part with its data-slot (Usage)", async () => {
  const screen = await render(<Subject defaultOpen />);
  expect(slot("collapsible", screen.container)).not.toBeNull();
  expect(slot("collapsible-trigger", screen.container)).not.toBeNull();
  expect(slot("collapsible-content", screen.container)).not.toBeNull();
});

test("the panel is absent while closed and mounts on open (Usage)", async () => {
  const screen = await render(<Subject />);
  expect(slot("collapsible-content", screen.container)).toBeNull();
  await userEvent.click(screen.getByRole("button"));
  await expect
    .poll(() => slot("collapsible-content", screen.container))
    .not.toBeNull();
});

test("Composition: the trigger names the panel it controls", async () => {
  const screen = await render(<Subject defaultOpen />);
  const trigger = slot("collapsible-trigger", screen.container) as HTMLElement;
  const panel = slot("collapsible-content", screen.container) as HTMLElement;
  expect(trigger.tagName).toBe("BUTTON");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
});

test("Controlled State: `open` drives the panel and every toggle is reported", async () => {
  const seen: boolean[] = [];
  function Controlled() {
    const [open, setOpen] = React.useState(false);
    return (
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          seen.push(next);
          setOpen(next);
        }}
      >
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
  }
  const screen = await render(<Controlled />);
  expect(slot("collapsible-content", screen.container)).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  await expect
    .poll(() => slot("collapsible-content", screen.container))
    .not.toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  await expect
    .poll(() => slot("collapsible-content", screen.container))
    .toBeNull();
  expect(seen).toEqual([true, false]);
});

test("Controlled State: a pinned `open` cannot be toggled from the trigger", async () => {
  const screen = await render(<Subject open={false} />);
  await userEvent.click(screen.getByRole("button"));
  expect(slot("collapsible-content", screen.container)).toBeNull();
});

test("Basic: the trigger marks itself data-panel-open while the panel is open", async () => {
  const screen = await render(
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="ghost" />}>
        Product details
      </CollapsibleTrigger>
      <CollapsibleContent>Additional content.</CollapsibleContent>
    </Collapsible>,
  );
  const trigger = slot("collapsible-trigger", screen.container) as HTMLElement;
  // This attribute is the whole mechanism behind the chevron rotation in the docs example — the
  // trigger's own state, read by a `group-data-panel-open/button:` variant on a descendant.
  expect(trigger.hasAttribute("data-panel-open")).toBe(false);
  await userEvent.click(trigger);
  await expect.poll(() => trigger.hasAttribute("data-panel-open")).toBe(true);
  // Rendering into a Button keeps the Button's group name available to that variant.
  expect(trigger.className).toContain("group/button");
});

test("Settings Panel: fields revealed by the panel are labelled and reachable", async () => {
  const screen = await render(
    <Collapsible defaultOpen>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="radius-x">Radius X</FieldLabel>
          <Input id="radius-x" defaultValue={0} />
        </Field>
        <CollapsibleContent>
          <Field>
            <FieldLabel htmlFor="radius-y">Radius Y</FieldLabel>
            <Input id="radius-y" defaultValue={0} />
          </Field>
        </CollapsibleContent>
      </FieldGroup>
      <CollapsibleTrigger render={<Button variant="outline" />}>
        More corners
      </CollapsibleTrigger>
    </Collapsible>,
  );
  const revealed = screen.getByLabelText("Radius Y");
  await expect.element(revealed).toBeInTheDocument();
  await userEvent.fill(revealed, "8");
  await expect.element(revealed).toHaveValue("8");
});

test("File Tree: nested collapsibles open independently (File Tree)", async () => {
  const screen = await render(
    <Collapsible>
      <CollapsibleTrigger>components</CollapsibleTrigger>
      <CollapsibleContent>
        <Collapsible>
          <CollapsibleTrigger>ui</CollapsibleTrigger>
          <CollapsibleContent>button.tsx</CollapsibleContent>
        </Collapsible>
        <span>login-form.tsx</span>
      </CollapsibleContent>
    </Collapsible>,
  );
  await userEvent.click(screen.getByRole("button", { name: "components" }));
  await expect.element(screen.getByText("login-form.tsx")).toBeInTheDocument();
  // The inner branch is still closed: nothing coordinates the two roots.
  expect(slots("collapsible-content", screen.container)).toHaveLength(1);
  await userEvent.click(screen.getByRole("button", { name: "ui" }));
  await expect
    .poll(() => slots("collapsible-content", screen.container).length)
    .toBe(2);
  await expect.element(screen.getByText("button.tsx")).toBeInTheDocument();
});

test("RTL: direction reaches the panel; the component adds none of its own (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Subject defaultOpen />
      </div>
    </DirectionProvider>,
  );
  const panel = slot("collapsible-content", screen.container) as HTMLElement;
  expect(getComputedStyle(panel).direction).toBe("rtl");
  // Whatever flips under RTL is the content, not the component: it spells no logical or physical
  // utility of its own.
  expect(panel.className).toBe("");
});

test("disabled: the root disables the trigger without removing it from the page", async () => {
  const screen = await render(<Subject disabled />);
  const trigger = slot("collapsible-trigger", screen.container) as HTMLElement;
  expect(trigger.getAttribute("data-disabled")).toBe("");
  trigger.click();
  expect(slot("collapsible-content", screen.container)).toBeNull();
});

test("hiddenUntilFound keeps the closed panel in the DOM for find-in-page", async () => {
  const screen = await render(
    <Collapsible>
      <CollapsibleTrigger>Release notes</CollapsibleTrigger>
      <CollapsibleContent hiddenUntilFound>
        Everything that changed.
      </CollapsibleContent>
    </Collapsible>,
  );
  const panel = slot("collapsible-content", screen.container) as HTMLElement;
  expect(panel).not.toBeNull();
  expect(panel.getAttribute("hidden")).toBe("until-found");
});

test("DOC-1: the three parts are pass-throughs — they contribute no classes of their own", async () => {
  // The patch for this component carries NO STYLING HUNK AT ALL. That claim is only true while
  // every part renders with exactly the className the call site passed, and nothing else.
  const bare = await render(<Subject defaultOpen />);
  for (const name of [
    "collapsible",
    "collapsible-trigger",
    "collapsible-content",
  ]) {
    expect((slot(name, bare.container) as HTMLElement).className).toBe("");
  }
  const styled = await render(
    <Collapsible className="root-only">
      <CollapsibleTrigger className="trigger-only">Toggle</CollapsibleTrigger>
      <CollapsibleContent className="panel-only">Content</CollapsibleContent>
    </Collapsible>,
  );
  await userEvent.click(styled.getByRole("button", { name: "Toggle" }));
  await expect
    .poll(() => slot("collapsible-content", styled.container))
    .not.toBeNull();
  expect((slot("collapsible", styled.container) as HTMLElement).className).toBe(
    "root-only",
  );
  expect(
    (slot("collapsible-trigger", styled.container) as HTMLElement).className,
  ).toBe("trigger-only");
  expect(
    (slot("collapsible-content", styled.container) as HTMLElement).className,
  ).toBe("panel-only");
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow or suppresses the outline", async () => {
  const screen = await render(<Subject defaultOpen />);
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
    expect(classes).not.toMatch(/(?:^|\s)outline-hidden(?:\s|$)/);
  }
});

test("no a11y violations — closed", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Subject defaultOpen />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Subject disabled />);
  await expectNoA11yViolations(screen.container);
});
