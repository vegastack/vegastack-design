// @vegastack item@0.21.1 sha256-wzGVX5cpJyjkMvpZWeA3YOD2eTfecqx4Uaa+y52aWRI=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeRefs } from "@vegastack/design";

import { Separator } from "@/components/ui/separator";
import { TruncationFocusProvider } from "@/components/ui/truncated-text";

/**
 * A11Y-7 — a context-licensed role. `ItemGroup` is `role="list"`, and `role="list"` admits only
 * `listitem` children: a bare `Item` inside one is a CRITICAL `aria-required-children` violation
 * (measured by axe on every `ItemGroup` composition in this repository). An `Item` outside a group
 * is a plain row and must NOT claim `listitem`, which is why the role is granted by context rather
 * than hard-coded on the part.
 */
const ItemGroupContext = React.createContext(false);

function ItemGroup({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<"div">) {
  const groupRef = React.useRef<HTMLDivElement>(null);
  const mergedRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(groupRef, ref),
    [ref],
  );
  const named =
    props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;

  // API-20: an `ItemGroupLabel` rendered IMMEDIATELY before the group names it. The two are
  // siblings with no shared owner to carry a context, so the group reads its previous sibling
  // after mount; a caller's own `aria-label`/`aria-labelledby` always wins, and is the way to
  // name the list in server-rendered HTML before hydration.
  React.useEffect(() => {
    const node = groupRef.current;
    if (!node || named) return;
    const label = node.previousElementSibling;
    if (label?.getAttribute("data-slot") !== "item-group-label" || !label.id) {
      return;
    }
    node.setAttribute("aria-labelledby", label.id);
    return () => node.removeAttribute("aria-labelledby");
  });

  return (
    <div
      ref={mergedRef}
      role="list"
      data-slot="item-group"
      className={cn(
        "group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2",
        className,
      )}
      {...props}
    >
      <ItemGroupContext.Provider value={true}>
        {children}
      </ItemGroupContext.Provider>
    </div>
  );
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      // A11Y-7, same rule from the other side: a `role="separator"` between two rows is not a
      // `listitem`, so inside `ItemGroup` it is the second thing axe rejects. The rule it draws is
      // decorative — the rows are already announced as list items — so it is hidden by default and
      // a caller who needs a semantic boundary passes `aria-hidden={false}`.
      aria-hidden="true"
      className={cn("my-2", className)}
      {...props}
    />
  );
}

const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center rounded-lg border text-sm transition-colors duration-100 [a]:transition-colors [a]:hover:bg-muted",
  {
    variants: {
      variant: {
        default: "border-transparent",
        outline: "border-border",
        muted: "border-transparent bg-muted/50",
      },
      size: {
        default: "gap-2.5 px-3 py-2.5",
        sm: "gap-2.5 px-3 py-2.5",
        xs: "gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Item({
  className,
  variant = "default",
  size = "default",
  render,
  children,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof itemVariants>) {
  const inGroup = React.useContext(ItemGroupContext);
  // A11Y-7 (amended): a row rendered as anything but a `div` — a link, a button — owns a role
  // of its own, and `listitem` would overwrite it. Such a row keeps its role and the `listitem`
  // moves to a wrapper instead. Its truncated cells (`TruncatedText`, `RelativeTime`) are not
  // tab stops of their own: the row is the one control, and a focusable cell nested inside a
  // link or button is an interactive-in-interactive violation.
  const control =
    render !== undefined &&
    !(React.isValidElement(render) && render.type === "div");

  const row = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        role: inGroup && !control ? "listitem" : undefined,
        className: cn(itemVariants({ variant, size, className })),
        children: control ? (
          <TruncationFocusProvider focusable={false}>
            {children}
          </TruncationFocusProvider>
        ) : (
          children
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "item",
      variant,
      size,
    },
  });

  if (!inGroup || !control) return row;
  return (
    <div role="listitem" data-slot="item-listitem">
      {row}
    </div>
  );
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "[&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none",
        className,
      )}
      {...props}
    />
  );
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

/**
 * API-19 — a row that owns an accessible description (a command option, a menu item, a select
 * option) provides a register function here; an `ItemDescription` inside it reports its `id`,
 * and the row points `aria-describedby` at it, so the second line is read as a description
 * rather than appended to the row's name: the registered description is `aria-hidden`, which
 * keeps it out of the name computed from the row's content while `aria-describedby` still reads
 * it. Outside such a row the context is `null` and the description renders exactly as upstream's.
 */
const ItemDescriptionContext = React.createContext<
  ((id: string | undefined) => void) | null
>(null);

/**
 * API-19 — the row half of `ItemDescriptionContext`. Pass the caller's own `aria-describedby`,
 * provide `register` as the context value and set `aria-describedby={id || undefined}` on the
 * row; `id` is `""` until a description registers. A caller's own `aria-describedby` wins, and
 * `register` is then `null`, so the description stays in the row's name as upstream renders it
 * rather than being hidden with nothing pointing at it.
 */
function useItemDescriptionId(own?: string): {
  id: string;
  register: ((id?: string) => void) | null;
} {
  const [id, setId] = React.useState("");
  const register = React.useCallback((next?: string) => setId(next ?? ""), []);
  return { id, register: own ? null : register };
}

function ItemDescription({
  className,
  id: idProp,
  ...props
}: React.ComponentProps<"p">) {
  const register = React.useContext(ItemDescriptionContext);
  const autoId = React.useId();
  const id = idProp ?? autoId;

  React.useEffect(() => {
    if (!register) return;
    register(id);
    return () => register(undefined);
  }, [register, id]);

  return (
    <p
      id={register ? id : idProp}
      aria-hidden={register ? true : undefined}
      data-slot="item-description"
      className={cn(
        "line-clamp-2 text-start text-sm leading-normal font-normal text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className,
      )}
      {...props}
    />
  );
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * API-20 — the heading that names the `ItemGroup` rendered immediately after it (default `h3`;
 * pass `render` for another level).
 */
function ItemGroupLabel({
  className,
  render,
  id: idProp,
  ...props
}: useRender.ComponentProps<"h3">) {
  const autoId = React.useId();

  return useRender({
    defaultTagName: "h3",
    props: mergeProps<"h3">(
      {
        id: idProp ?? autoId,
        className: cn("text-xs font-medium text-muted-foreground", className),
      },
      props,
    ),
    render,
    state: {
      slot: "item-group-label",
    },
  });
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemGroupLabel,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
  ItemDescriptionContext,
  useItemDescriptionId,
};
