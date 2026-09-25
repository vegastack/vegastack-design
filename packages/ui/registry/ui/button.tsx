// @vegastack button@0.23.14 sha256-p/C1V0WHejWGweSVzIQWwq/dYPuHT2GlJME5Lg2l9p0=

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all select-none active:not-aria-[haspopup]:translate-y-px not-focus:aria-invalid:border-destructive data-disabled:not-data-loading:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground [&_svg:not([class*='text-'])]:text-muted-foreground hover:**:[svg]:text-foreground aria-expanded:**:[svg]:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground [&_svg:not([class*='text-'])]:text-muted-foreground hover:**:[svg]:text-foreground aria-expanded:**:[svg]:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive-text hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
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
      data-loading={loading ? "" : undefined}
      aria-busy={loading ? true : ariaBusy}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled ?? true}
      className={cn(buttonVariants({ variant, size, className }))}
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
