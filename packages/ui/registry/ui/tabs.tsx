// @vegastack tabs@0.23.3 sha256-xdvjLTJT7+l4xeAi8KH5R31452VnV7jseRtDbGuc8Jc=

"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeRefs } from "@vegastack/design";

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
      overflow: {
        visible: "",
        scroll:
          "relative not-data-vertical:max-w-full not-data-vertical:min-w-0 not-data-vertical:scroll-fade-x not-data-vertical:justify-start not-data-vertical:scrollbar-none not-data-vertical:overflow-x-auto not-data-vertical:overflow-y-hidden not-data-vertical:overscroll-x-contain not-data-vertical:[&>*]:after:bottom-[-4px]",
      },
    },
    defaultVariants: {
      variant: "default",
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
  overflow,
  ref,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const resolvedOverflow =
    overflow ?? (variant === "line" ? "scroll" : "visible");
  const [list, setList] = React.useState<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(() => mergeRefs(setList, ref), [ref]);
  useActiveTabInView(resolvedOverflow === "scroll" ? list : null);
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-overflow={resolvedOverflow}
      ref={mergedRef}
      className={cn(
        tabsListVariants({ variant, overflow: resolvedOverflow }),
        className,
      )}
      {...props}
    />
  );
}

const tabsTriggerVariants = cva([
  "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground disabled:opacity-50 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
  "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
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

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm", className)}
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
