// @vegastack tabs@0.26.2 sha256-+hUq0r+HSGsklnryz3SaZwQsbxgWKnws109SZzz19Mg=

"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOverflowFold } from "@/components/ui/use-overflow-fold";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-not-data-vertical/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
      size: {
        default: "",
        sm: "group-not-data-vertical/tabs:h-7",
      },
      overflow: {
        visible: "",
        menu: "",
        scroll:
          "relative not-data-vertical:max-w-full not-data-vertical:min-w-0 not-data-vertical:scroll-fade-x not-data-vertical:justify-start not-data-vertical:scrollbar-none not-data-vertical:overflow-x-auto not-data-vertical:overflow-y-hidden not-data-vertical:overscroll-x-contain not-data-vertical:[&>*]:after:bottom-[-4px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      overflow: "visible",
    },
  },
);

/**
 * Keep the active trigger inside a scrolling list's visible box: on mount, and whenever the
 * selection changes — a click, a keyboard commit or a controlled `value` from outside. Only the
 * list's own `scrollLeft` moves, never the page (`scrollIntoView` would scroll every ancestor).
 */
function useActiveTabInView(list: HTMLElement | null) {
  React.useEffect(() => {
    if (!list) return;
    const reveal = () => {
      const active = list.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      if (!active) return;
      const box = list.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      if (tab.left < box.left) list.scrollLeft += tab.left - box.left;
      else if (tab.right > box.right) list.scrollLeft += tab.right - box.right;
    };
    reveal();
    const observer = new MutationObserver(reveal);
    observer.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-selected"],
    });
    return () => observer.disconnect();
  }, [list]);
}

function TabsList({
  className,
  variant = "default",
  size = "default",
  overflow,
  ref,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const resolvedOverflow =
    overflow ?? (variant === "line" ? "scroll" : "visible");
  const [list, setList] = React.useState<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(() => mergeRefs(setList, ref), [ref]);
  useActiveTabInView(resolvedOverflow === "scroll" ? list : null);
  if (resolvedOverflow === "menu")
    return (
      <TabsFoldList
        className={className}
        variant={variant}
        size={size}
        ref={ref}
        {...props}
      />
    );
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      data-overflow={resolvedOverflow}
      ref={mergedRef}
      className={cn(
        tabsListVariants({ variant, size, overflow: resolvedOverflow }),
        className,
      )}
      {...props}
    />
  );
}

/** The tab triggers among a list's children, fragments included, in order. */
function flattenTabs(
  children: React.ReactNode,
): React.ReactElement<TabsPrimitive.Tab.Props>[] {
  const out: React.ReactElement<TabsPrimitive.Tab.Props>[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      out.push(
        ...flattenTabs(
          (child.props as { children?: React.ReactNode }).children,
        ),
      );
      return;
    }
    if ((child.props as { value?: unknown }).value !== undefined)
      out.push(child as React.ReactElement<TabsPrimitive.Tab.Props>);
  });
  return out;
}

/**
 * LAY-14 `overflow="menu"` (widened MK 2026-10-29, list-toolbar T4): the list folds into one
 * dropdown when it does not fit the room it is given — measured by `useOverflowFold`, not set by a
 * breakpoint. Folded, the list stays mounted out of flow and hidden (so it is still measured and
 * Base UI still owns the value), and the dropdown's trigger shows the active tab; picking an item
 * activates that tab.
 */
function TabsFoldList({
  className,
  variant,
  size,
  ref,
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const { rootRef, contentRef, folded } = useOverflowFold<
    HTMLDivElement,
    HTMLDivElement
  >();
  const [list, setList] = React.useState<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(
    () => mergeRefs(setList, contentRef, ref),
    [contentRef, ref],
  );
  // The triggers, read from the children: a menu item per tab, labelled as the tab is.
  const tabs = flattenTabs(children);
  // Which tab is selected, read back from the list (Base UI owns the value).
  const [selected, setSelected] = React.useState(0);
  React.useEffect(() => {
    if (!list) return;
    const read = () => {
      const all = Array.from(list.querySelectorAll('[role="tab"]'));
      const index = all.findIndex(
        (tab) => tab.getAttribute("aria-selected") === "true",
      );
      setSelected(index < 0 ? 0 : index);
    };
    read();
    const observer = new MutationObserver(read);
    // Tabs added, removed or reordered re-read the selection too.
    observer.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-selected"],
    });
    return () => observer.disconnect();
  }, [list]);
  const active = tabs[selected];
  return (
    <div
      ref={rootRef}
      data-slot="tabs-fold"
      data-folded={folded ? "" : undefined}
      // Folded, the measuring list is wider than the room: clipped sideways so it never widens
      // the page.
      className={cn(
        "relative flex w-full min-w-0 items-center",
        folded && "overflow-x-clip",
      )}
    >
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        data-size={size}
        data-overflow="menu"
        data-fold-content=""
        aria-hidden={folded || undefined}
        ref={mergedRef}
        className={cn(
          tabsListVariants({ variant, size, overflow: "menu" }),
          folded &&
            "pointer-events-none invisible absolute start-0 top-0 max-w-none",
          className,
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
      {folded ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size={size === "sm" ? "sm" : "default"}
                data-slot="tabs-fold-trigger"
                data-fold-trigger=""
                aria-label={
                  props["aria-label"]
                    ? `${props["aria-label"]}: ${list?.querySelectorAll('[role="tab"]')[selected]?.textContent ?? ""}`
                    : undefined
                }
                className="h-8 max-w-full min-w-0 gap-1 px-2 text-sm font-medium [&_svg:not([class*='size-'])]:size-4"
              >
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden [&>svg]:shrink-0">
                  {active?.props.children as React.ReactNode}
                </span>
                <ChevronDown aria-hidden className="text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuRadioGroup
              value={String(selected)}
              onValueChange={(value) => {
                const tab =
                  list?.querySelectorAll<HTMLElement>('[role="tab"]')[
                    Number(value)
                  ];
                tab?.click();
              }}
            >
              {tabs.map((tab, index) => (
                <DropdownMenuRadioItem
                  key={String(tab.props.value)}
                  value={String(index)}
                  disabled={tab.props.disabled}
                >
                  {tab.props.children as React.ReactNode}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

const tabsTriggerVariants = cva([
  "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground disabled:opacity-50 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
  "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
  "group-data-[size=sm]/tabs-list:px-2 group-data-[size=sm]/tabs-list:[&_svg:not([class*='size-'])]:size-3.5",
  // A11Y-24: on a coarse pointer a horizontal tab's hit area reaches 44px tall (an invisible
  // `before:` box; `after:` is the line indicator), never wider, so neighbouring tabs never
  // overlap. Only where the list does not scroll: a scrolling list clips its overflow, and a
  // vertical list's neighbours sit above and below.
  "group-data-[overflow=visible]/tabs-list:group-not-data-vertical/tabs:pointer-coarse:before:absolute group-data-[overflow=visible]/tabs-list:group-not-data-vertical/tabs:pointer-coarse:before:inset-x-0 group-data-[overflow=visible]/tabs-list:group-not-data-vertical/tabs:pointer-coarse:before:-inset-y-2 group-data-[overflow=visible]/tabs-list:group-not-data-vertical/tabs:pointer-coarse:before:content-[''] group-data-[size=sm]/tabs-list:group-data-[overflow=visible]/tabs-list:group-not-data-vertical/tabs:pointer-coarse:before:-inset-y-2.5",
  "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-not-data-vertical/tabs:after:inset-x-0 group-not-data-vertical/tabs:after:bottom-[-5px] group-not-data-vertical/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-end-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
]);

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants(), className)}
      {...props}
    />
  );
}

/**
 * FOC-1: the panel is a tab stop (Base UI's `tabindex="0"`, for the APG reason), so it takes the
 * focus tint when the keyboard lands on it. A pointer press on the panel's own empty space also
 * focuses it, and in Chromium the next key press — ⌘ or Shift alone is enough — flips that focus
 * to `:focus-visible`, which tinted the WHOLE panel (a drawer body turning grey after a ⌘-click).
 * A pointer-focused panel is marked `data-pointer-focus` and takes no tint; the mark clears when
 * focus moves into the panel's content or leaves the panel, so the next keyboard arrival tints it
 * again.
 */
function TabsContent({
  className,
  onPointerDown,
  onFocus,
  onBlur,
  ...props
}: TabsPrimitive.Panel.Props) {
  // Set by a press and read by the focus it causes (pointerdown → mousedown → focus, one task).
  const pressed = React.useRef(false);
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm data-pointer-focus:bg-none", className)}
      onPointerDown={(event) => {
        pressed.current = true;
        setTimeout(() => {
          pressed.current = false;
        });
        // Already focused (from the keyboard): a press on it is pointer focus from now on.
        if (document.activeElement === event.currentTarget)
          event.currentTarget.setAttribute("data-pointer-focus", "");
        onPointerDown?.(event);
      }}
      onFocus={(event) => {
        if (event.target === event.currentTarget && pressed.current)
          event.currentTarget.setAttribute("data-pointer-focus", "");
        else event.currentTarget.removeAttribute("data-pointer-focus");
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (
          event.target === event.currentTarget ||
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        )
          event.currentTarget.removeAttribute("data-pointer-focus");
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
};
