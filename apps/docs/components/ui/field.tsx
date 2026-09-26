// @vegastack field@0.23.43 sha256-olsvoFSB/VNkJ1bSqa2zyGm8w0Sd/31I4qzdyakJYnU=

"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn } from "@vegastack/design";
import { CircleAlertIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// API-26: the Base UI Field parts need a `Field.Root` above them, and upstream also places these
// parts outside one (a FieldDescription in a FieldSet, a FieldLabel wrapping a choice-card Field, a
// standalone FieldError). Each part renders its Base UI part only inside a `Field`, and upstream's
// plain element everywhere else.
const FieldScope = createContext<object | false>(false);

/**
 * The enclosing `Field`'s identity, or `false` outside one. A composite control reads it to tell
 * its own `Field` from the one around a part of it — `RadioGroup` names only the group from its
 * Field, while an item inside its own nested `Field` still takes that Field's label (API-26).
 *
 * @example
 * const field = useFieldScope();
 */
function useFieldScope(): object | false {
  return useContext(FieldScope);
}

function FieldPartLabel(props: React.ComponentProps<typeof Label>) {
  return <FieldPrimitive.Label render={<Label />} {...props} />;
}

function FieldPartError(props: React.ComponentProps<"div">) {
  return <FieldPrimitive.Error match {...props} />;
}

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  );
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className,
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive-text",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  },
);

function Field({
  className,
  orientation = "vertical",
  "data-invalid": dataInvalid,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof fieldVariants> & {
    "data-invalid"?: boolean | "true" | "false";
  }) {
  // A stable identity per Field, so `useFieldScope` can tell one Field from another.
  const [scope] = useState(() => ({}));
  return (
    <FieldPrimitive.Root
      role="group"
      data-slot="field"
      data-orientation={orientation}
      data-invalid={dataInvalid}
      invalid={dataInvalid === true || dataInvalid === "true"}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    >
      <FieldScope.Provider value={scope}>{children}</FieldScope.Provider>
    </FieldPrimitive.Root>
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const Root = useContext(FieldScope) ? FieldPartLabel : Label;
  return (
    <Root
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-title"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"p"> & {
  /** `footnote`: a centred 12px muted line with a small gap above, for form and auth-block footers. */
  variant?: "default" | "footnote";
}) {
  const Root = useContext(FieldScope) ? FieldPrimitive.Description : "p";
  return (
    <Root
      data-slot="field-description"
      data-variant={variant}
      className={cn(
        "text-start text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        variant === "footnote" && "mt-2 text-center text-xs last:mt-2",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const Root = useContext(FieldScope) ? FieldPartError : "div";
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ms-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>,
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <Root
      role="alert"
      data-slot="field-error"
      className={cn(
        "flex items-start gap-1.5 text-sm font-normal text-destructive-text [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <CircleAlertIcon aria-hidden />
      <span className="flex-1">{content}</span>
    </Root>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
  useFieldScope,
};
