// @vegastack button@0.138.0 sha256-smnWXGmz7agOZRtq5GgLLNJ3QdtRoSctSPOMEvouZ6M=

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all select-none pointer-coarse:after:absolute pointer-coarse:after:content-[''] pointer-coarse:[:is(button,a[href],input,select,textarea,[role=button])+&]:after:start-0 pointer-coarse:[&:has(+:is(button,a[href],input,select,textarea,[role=button]))]:after:end-0 active:not-aria-[haspopup]:not-data-disabled:translate-y-px aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 data-disabled:not-data-loading:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:not-data-disabled:bg-primary-pressed",
        outline:
          "state-layer border-border bg-background hover:text-foreground aria-expanded:layer-selected aria-expanded:text-foreground [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground hover:**:[svg:not([data-icon-tone])]:text-foreground aria-expanded:**:[svg:not([data-icon-tone])]:text-foreground dark:border-input dark:bg-input/30",
        secondary:
          "state-layer bg-secondary text-secondary-foreground aria-expanded:layer-selected aria-expanded:text-secondary-foreground",
        ghost:
          "state-layer hover:text-foreground aria-expanded:bg-state-selected aria-expanded:text-foreground [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground hover:**:[svg:not([data-icon-tone])]:text-foreground aria-expanded:**:[svg:not([data-icon-tone])]:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive-text hover:bg-destructive/20 active:not-data-disabled:bg-destructive/25 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:active:not-data-disabled:bg-destructive/35",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 pointer-coarse:after:-inset-1.75",
        xs: "h-6 gap-1 rounded-segment px-2 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3 pointer-coarse:after:-inset-2.75",
        sm: "h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5 pointer-coarse:after:-inset-2.25",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 pointer-coarse:after:-inset-1.25",
        icon: "size-8 rounded-icon pointer-coarse:after:-inset-1.75",
        "icon-xs":
          "size-6 rounded-segment [&_svg:not([class*='size-'])]:size-3 pointer-coarse:after:-inset-2.75",
        "icon-sm": "size-7 rounded-icon pointer-coarse:after:-inset-2.25",
        "icon-lg": "size-9 rounded-icon pointer-coarse:after:-inset-1.25",
      },
      /**
       * BRD-12 (corner shapes round 2): `rect` takes the corner of its context — `control` in the
       * page, a capsule inside a `capsule-scope` (the top bar, floating bars). `pill` makes one
       * button a capsule where its row is pills (a chip row's add button); it is never a way to
       * pick a look button by button.
       */
      shape: {
        rect: "",
        pill: "rounded-capsule",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "rect",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  shape = "rect",
  loading = false,
  disabled,
  focusableWhenDisabled,
  children,
  "aria-busy": ariaBusy,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /**
     * Shows a spinner over the label, blocks activation and sets `aria-busy`. The label keeps its
     * box at `opacity: 0`, so the button's width does not move and its accessible name survives
     * (API-5, A11Y-12).
     */
    loading?: boolean;
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-shape={shape === "pill" ? "pill" : undefined}
      data-loading={loading ? "" : undefined}
      aria-busy={loading ? true : ariaBusy}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled ?? true}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    >
      {loading ? (
        <>
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
          >
            <Spinner aria-label={undefined} />
          </span>
          <span className="inline-flex items-center justify-center gap-[inherit] opacity-0">
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
