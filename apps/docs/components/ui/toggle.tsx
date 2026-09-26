// @vegastack toggle@0.23.41 sha256-crkk3iQAOVrMTFruE5AA6aXZy58jWUfrlbnouVurmfo=

"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

import { Spinner } from "@/components/ui/spinner";

const toggleVariants = cva(
  "group/toggle relative inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all hover:bg-muted hover:text-foreground aria-invalid:border-destructive disabled:not-data-loading:opacity-50 aria-pressed:bg-muted data-[state=on]:bg-muted [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-']):not([data-icon-tone])]:text-muted-foreground hover:**:[svg:not([data-icon-tone])]:text-foreground aria-pressed:**:[svg:not([data-icon-tone])]:text-foreground data-[state=on]:**:[svg:not([data-icon-tone])]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-muted",
      },
      size: {
        default:
          "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  "aria-busy": ariaBusy,
  ...props
}: TogglePrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    /**
     * Shows a spinner over the label, blocks activation and sets `aria-busy`. The label keeps its
     * box at `opacity: 0`, so the toggle's width does not move and its accessible name survives
     * (API-5, A11Y-12). The wrapper is a real `inline-flex` box inheriting the root's `gap`, never
     * `display: contents`: a box-less element accepts no `opacity`, so the label would paint at
     * full strength under the spinner.
     */
    loading?: boolean;
  }) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      data-loading={loading ? "" : undefined}
      aria-busy={loading ? true : ariaBusy}
      disabled={disabled || loading}
      className={cn(toggleVariants({ variant, size, className }))}
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
    </TogglePrimitive>
  );
}

export { Toggle, toggleVariants };
