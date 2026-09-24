"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// The docs app itself is wrapped in the root provider, so previews demonstrate the
// CAPABILITIES the provider unlocks (theme, toasts, tooltip coordination) rather than
// mounting a second VegaStackProvider — its Toaster is a mount-once portal.
import { useVegaStackTheme } from "@/components/ui/provider";
import { toast } from "@/components/ui/toast";

export function providerDemo(): ReactNode {
  return (
    <Wrapper>
      <ThemeMenuDemo />
      <Button
        variant="outline"
        onClick={() =>
          toast.add({ type: "success", title: "Wired through the provider" })
        }
      >
        Fire a toast
      </Button>
    </Wrapper>
  );
}

// Theme is a preference, so it is chosen from a menu (in an app, the user menu) as a
// Light / Dark / System radio group bound to `theme` — never a local toggle button.
function ThemeMenuDemo() {
  const { theme, setTheme } = useVegaStackTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Theme
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme ?? "system"}
            onValueChange={(value) => setTheme(value)}
          >
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function providerTooltips(): ReactNode {
  return (
    <Wrapper>
      {/* Shared-delay proof: hover the first, then move across — the rest follow instantly. */}
      {(["Cut", "Copy", "Paste"] as const).map((label) => (
        <Tooltip key={label}>
          <TooltipTrigger render={<Button variant="outline">{label}</Button>} />
          <TooltipContent>{label} selection</TooltipContent>
        </Tooltip>
      ))}
    </Wrapper>
  );
}
