import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { BellIcon, MessageSquareIcon } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { TooltipProvider } from "./tooltip";
import { ToolGroup, ToolGroupItem, ToolGroupMore } from "./tool-group";

test("a labelled group of 28px ghost tools, two pixels apart, each named by its label", async () => {
  const screen = await render(
    <ToolGroup aria-label="Page tools">
      <ToolGroupItem label="Watch" aria-pressed>
        <BellIcon />
      </ToolGroupItem>
      <ToolGroupMore />
    </ToolGroup>,
  );
  const group = screen.getByRole("group", { name: "Page tools" });
  await expect.element(group).toHaveClass("gap-0.5");
  const watch = screen.getByRole("button", { name: "Watch" });
  await expect.element(watch).toHaveClass("size-7");
  await expect.element(watch).toHaveClass("state-layer");
  await expect.element(watch).toHaveAttribute("aria-pressed", "true");
  await expect.element(watch).toHaveAttribute("data-slot", "tool-group-item");
  await expect
    .element(screen.getByRole("button", { name: "More" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("ICO-9: More is the horizontal ellipsis, never the vertical one", async () => {
  const screen = await render(<ToolGroupMore />);
  const svg = screen.container.querySelector("svg")!;
  expect(svg.getAttribute("class")).toMatch(
    /lucide-(more-horizontal|ellipsis)\b/,
  );
  expect(svg.getAttribute("class")).not.toMatch(/vertical/);
});

test("a count sits beside the icon, joins the name and caps at 99+", async () => {
  const screen = await render(
    <ToolGroup aria-label="Tools">
      <ToolGroupItem label="Comments" count={9}>
        <MessageSquareIcon />
      </ToolGroupItem>
      <ToolGroupItem label="Mentions" count={140}>
        <MessageSquareIcon />
      </ToolGroupItem>
      <ToolGroupItem label="Replies" count={0}>
        <MessageSquareIcon />
      </ToolGroupItem>
    </ToolGroup>,
  );
  const comments = screen.getByRole("button", { name: "Comments, 9" });
  await expect.element(comments).toHaveClass("h-7");
  await expect
    .element(screen.getByRole("button", { name: "Mentions, 99+" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Replies" }))
    .toHaveClass("size-7");
  await expectNoA11yViolations(screen.container);
});

test("the tooltip shows the label on hover", async () => {
  const screen = await render(
    <TooltipProvider>
      <div style={{ padding: 150 }}>
        <ToolGroupItem label="Star">
          <BellIcon />
        </ToolGroupItem>
      </div>
    </TooltipProvider>,
  );
  const star = screen.getByRole("button", { name: "Star" });
  await userEvent.hover(star);
  await expect.element(star).toHaveAttribute("data-popup-open", "");
  expect(
    document.querySelector('[data-slot="tooltip-content"]')?.textContent,
  ).toBe("Star");
});

test("More opens a menu as its trigger", async () => {
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<ToolGroupMore />} />
      <DropdownMenuContent>
        <DropdownMenuItem>Copy link</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const more = screen.getByRole("button", { name: "More" });
  await more.click();
  await expect.element(more).toHaveAttribute("aria-expanded", "true");
  await expect
    .element(screen.getByRole("menuitem", { name: "Copy link" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body);
});
