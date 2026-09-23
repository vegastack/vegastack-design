// @vegastack command@0.13.0 sha256-WNo1G2P6IOKgITkzSO+inu2tBZuVFxqMJvEkJo8Mtaw=

"use client";

import * as React from "react";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { cn, mergeRefs } from "@vegastack/design";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { SearchIcon, CheckIcon } from "lucide-react";

import { useAnnouncer } from "@/components/ui/use-announcer";

function CommandResultAnnouncer() {
  const { announce, Announcer } = useAnnouncer();
  const search = useCommandState((state) => state.search);
  const count = useCommandState((state) => state.filtered.count);

  React.useEffect(() => {
    if (!search) return;
    announce(`${count} ${count === 1 ? "result" : "results"}`);
  }, [announce, count, search]);

  return <Announcer />;
}

function Command({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex min-h-0 size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <CommandResultAnnouncer />
    </CommandPrimitive>
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-var(--spacing)*8)] grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-xl! p-0",
          className,
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:ps-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            // A11Y-2: cmdk's input carries no height of its own, so it measures its line box —
            // 20px inside the 32px InputGroup, under the 24px target floor the geometry lane
            // probes with a real `elementFromPoint`. `min-h-6` is the same correction Batch 3
            // applied to `ComboboxChipsInput` and the calendar's month/year dropdown.
            "min-h-6 w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CommandList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const count = useCommandState((state) => state.filtered.count);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(listRef, ref),
    [ref],
  );

  // A11Y-7 (a role only where the context licenses it): a list with no options is not a listbox.
  // cmdk hard-codes `role="listbox"` AFTER spreading props, so the role can only be taken off the
  // node — and while the filtered count is 0 the element owns nothing but the empty message, which
  // axe reports as a critical `aria-required-children` violation. No dependency array on purpose:
  // React never re-applies an attribute it believes is unchanged, so every render has to reassert
  // this.
  React.useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) return;
    if (count === 0) node.removeAttribute("role");
    else node.setAttribute("role", "listbox");
  });

  return (
    <CommandPrimitive.List
      data-slot="command-list"
      ref={setRef}
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    >
      {/* A11Y-3: cmdk hard-codes `role="presentation"` on the empty slot too, so the polite role
          goes on the message itself. It is only ever rendered while the list above it has had its
          `role="listbox"` removed (A11Y-7), so a status is never nested inside a listbox. */}
      <span role="status">{children}</span>
    </CommandPrimitive.Empty>
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ms-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
