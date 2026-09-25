// @vegastack toggle-group@0.23.8 sha256-PaHYRVarXaOEEu3wAHs938Qce62Ya2MJf55TNPR1/KY=

"use client";

import * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { type VariantProps } from "class-variance-authority";
import { cn, mergeRefs } from "@vegastack/design";

import { toggleVariants } from "@/components/ui/toggle";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
});

/**
 * Mark the first and last item of every visual row of a wrapped, joined (`spacing={0}`) group, so
 * each row gets its own rounded ends and its own leading border — a row start is not `:first-child`
 * once the items wrap, and CSS has no selector for it. Re-marked whenever the group resizes or
 * its items change.
 */
function useWrappedRowEnds(group: HTMLElement | null, active: boolean) {
  React.useLayoutEffect(() => {
    if (!group || !active) return;
    const items = () => [
      ...group.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]'),
    ];
    const mark = () => {
      const list = items();
      const rects = list.map((item) => item.getBoundingClientRect());
      list.forEach((item, index) => {
        const previous = rects[index - 1];
        const next = rects[index + 1];
        const rect = rects[index]!;
        item.toggleAttribute(
          "data-row-start",
          !previous || rect.top >= previous.bottom - 0.5,
        );
        item.toggleAttribute(
          "data-row-end",
          !next || next.top >= rect.bottom - 0.5,
        );
      });
    };
    mark();
    const resize = new ResizeObserver(mark);
    resize.observe(group);
    const mutation = new MutationObserver(mark);
    mutation.observe(group, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
      for (const item of items()) {
        item.removeAttribute("data-row-start");
        item.removeAttribute("data-row-end");
      }
    };
  }, [group, active]);
}

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  deselectable = true,
  wrap = false,
  multiple,
  onValueChange,
  ref,
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
    deselectable?: boolean;
    wrap?: boolean;
  }) {
  const [group, setGroup] = React.useState<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(() => mergeRefs(setGroup, ref), [ref]);
  useWrappedRowEnds(
    group,
    wrap && spacing === 0 && orientation === "horizontal",
  );
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      orientation={orientation}
      data-wrap={wrap ? "" : undefined}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-vertical:flex-col data-vertical:items-stretch",
        "data-wrap:flex-wrap data-wrap:data-[spacing=0]:gap-y-2",
        className,
      )}
      ref={mergedRef}
      multiple={multiple}
      onValueChange={(value, eventDetails) => {
        // A single-mode view switch always has a view: pressing the pressed item would empty the
        // group, so that one change is cancelled before Base UI commits it.
        if (!deselectable && !multiple && value.length === 0) {
          eventDetails.cancel();
          return;
        }
        onValueChange?.(value, eventDetails);
      }}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pe-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:ps-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-s-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-e-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-s-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-s group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        "group-data-wrap/toggle-group:data-[spacing=0]:data-row-start:rounded-s-lg group-data-wrap/toggle-group:data-[spacing=0]:data-row-end:rounded-e-lg group-data-wrap/toggle-group:data-[spacing=0]:data-[variant=outline]:data-row-start:border-s",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
