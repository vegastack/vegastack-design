// @vegastack field@0.1.0 sha256-dYUyMEM8lf2hlSESOrFxid7buV0+P+U31QwJzH8IGfA=

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Field as BaseField } from '@base-ui/react/field';
import { cn } from '@vegastack/design';
import { Input } from '@/components/ui/input';

/**
 * Field layout variants. `orientation` controls how the label sits relative to
 * the control: `vertical` stacks label-above-control (text inputs, selects),
 * `horizontal` places the control before an inline label (checkboxes, switches).
 * Every value is a semantic token (no hardcoded spacing colors).
 */
export const fieldVariants = cva('group/field flex w-full text-foreground', {
  variants: {
    orientation: {
      vertical: 'flex-col gap-2',
      horizontal: 'flex-row flex-wrap items-center gap-2',
      /** Vertical by default, horizontal from the `@md` width of the wrapping FieldGroup container. */
      responsive:
        'flex-col gap-2 @md/field-group:flex-row @md/field-group:flex-wrap @md/field-group:items-center',
    },
  },
  defaultVariants: { orientation: 'vertical' },
});

/* ------------------------------------------------------------------------------------------------
 * Primitives — thin token-styled wrappers over Base UI Field parts. Each carries
 * a `data-slot` and forwards its ref. Base UI auto-wires `id`/`aria-describedby`/
 * `aria-invalid` across Root → Label → Control → Description → Error.
 * ----------------------------------------------------------------------------------------------*/

export type FieldRootProps = React.ComponentProps<typeof BaseField.Root> &
  VariantProps<typeof fieldVariants>;

/**
 * `FieldRoot` — groups all parts of a field and wires accessibility between
 * them. Renders a `<div>`. Use the prop-driven {@link Field} for the common case;
 * reach for the primitives when you need full control over composition.
 */
export function FieldRoot({ className, orientation = 'vertical', ref, ...props }: FieldRootProps) {
  return (
    <BaseField.Root
      ref={ref}
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

export type FieldLabelProps = React.ComponentProps<typeof BaseField.Label>;

/**
 * `FieldLabel` — accessible label, auto-associated with the field control.
 * Renders a `<label>`. Uses the `text-label-sm` token (12/500) in `foreground`,
 * non-selectable; dims when the field group is disabled.
 */
export function FieldLabel({ className, ref, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      ref={ref}
      data-slot="field-label"
      className={cn(
        'flex items-center gap-2 text-label-sm text-foreground select-none',
        'group-has-disabled/field:opacity-(--opacity-dim)',
        className,
      )}
      {...props}
    />
  );
}

export type FieldControlProps = React.ComponentProps<typeof BaseField.Control>;

/**
 * `FieldControl` — the form control to label and validate. Renders the
 * {@link Input} component (the single source of field styling) composed into the
 * Base UI field context, so `id` / `aria-describedby` / `aria-invalid` are wired
 * automatically. Pass `render` to swap in another control, or skip `FieldControl`
 * and drop a sibling control (`<Input>`, `<Checkbox>`, `<Select>`, …) into the field.
 */
export function FieldControl({ ref, ...props }: FieldControlProps) {
  return (
    <BaseField.Control ref={ref} render={<Input data-slot="field-control" />} {...props} />
  );
}

export type FieldDescriptionProps = React.ComponentProps<typeof BaseField.Description>;

/**
 * `FieldDescription` — supporting helper text. Renders a `<p>`, linked to the
 * control via `aria-describedby`. Links inside underline and tint on hover.
 */
export function FieldDescription({ className, ref, ...props }: FieldDescriptionProps) {
  return (
    <BaseField.Description
      ref={ref}
      data-slot="field-description"
      className={cn(
        'text-sm leading-normal text-muted-foreground',
        '[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-info-text',
        className,
      )}
      {...props}
    />
  );
}

export type FieldErrorProps = React.ComponentProps<typeof BaseField.Error>;

/**
 * `FieldError` — validation error message. Renders a `<div role="alert">` only
 * when the control is invalid (or `match` says so). Tinted destructive.
 *
 * Base UI mounts this element fresh each time the field transitions into invalid (it isn't
 * rendered at all while valid), so `motion-enter-up` — the same mount-triggered slide+fade used
 * for chat-message/skeleton-reveal arrivals — replays for free on every new error, no JS needed.
 *
 * This is deliberately the ONLY auto-motion `Field` adds for the invalid transition. The control
 * itself (`Input`, `Checkbox`, `RadioGroupItem`, `OTPInput` — all self-register with Base UI's
 * Field context, so they receive `aria-invalid`/`data-invalid` directly from `Field` without any
 * extra wiring here) already shakes itself via `useShakeOnInvalid`. Having `Field` ALSO shake a
 * wrapper around the control would double up: the row would shake AND the control inside it would
 * shake again, stacking into an amplified, un-subtle motion for the common `<Field><Input /></Field>`
 * composition. So the message sliding in + the control shaking — the classic combo — is produced by
 * two independent, already-correct mechanisms rather than one delegating to the other.
 */
export function FieldError({ className, ref, ...props }: FieldErrorProps) {
  return (
    <BaseField.Error
      ref={ref}
      // Base UI's Field.Error has no role; announce the message to assistive tech.
      role="alert"
      data-slot="field-error"
      className={cn('motion-enter-up text-sm leading-normal text-destructive-text', className)}
      {...props}
    />
  );
}

export type FieldSuccessProps = React.ComponentProps<'p'>;

/**
 * `FieldSuccess` — positive confirmation message (Base UI Field has no success
 * part, so this is a plain token-styled `<p>`). Tinted success.
 */
export function FieldSuccess({ className, ref, ...props }: FieldSuccessProps) {
  return (
    <p
      ref={ref}
      data-slot="field-success"
      className={cn('text-sm leading-normal text-success-text', className)}
      {...props}
    />
  );
}


export type FieldGroupProps = React.ComponentProps<'div'>;

/**
 * `FieldGroup` — stacks a set of fields with consistent rhythm and provides the
 * `@container` that `orientation="responsive"` fields respond to (shadcn Field
 * anatomy).
 */
export function FieldGroup({ className, ...props }: FieldGroupProps) {
  return (
    <div
      data-slot="field-group"
      className={cn('@container/field-group flex w-full flex-col gap-6', className)}
      {...props}
    />
  );
}

export type FieldSetProps = React.ComponentProps<'fieldset'>;

/**
 * `FieldSet` — a semantic `<fieldset>` grouping related fields under a
 * {@link FieldLegend}; dims as a unit when disabled.
 */
export function FieldSet({ className, ...props }: FieldSetProps) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn('flex flex-col gap-4 disabled:opacity-(--opacity-dim)', className)}
      {...props}
    />
  );
}

export type FieldLegendProps = React.ComponentProps<'legend'>;

/** `FieldLegend` — the `<legend>` for a {@link FieldSet}, set in the label style. */
export function FieldLegend({ className, ...props }: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      className={cn('mb-1.5 text-label text-foreground', className)}
      {...props}
    />
  );
}

export type FieldContentProps = React.ComponentProps<'div'>;

/**
 * `FieldContent` — groups a label + description column beside a control in
 * horizontal/responsive fields (shadcn Field anatomy).
 */
export function FieldContent({ className, ...props }: FieldContentProps) {
  return (
    <div
      data-slot="field-content"
      className={cn('flex flex-1 flex-col gap-1', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Prop-driven Field — the ergonomic default. Composes the primitives from
 * `label` / `description` / `error` / `success` props around a single control.
 * ----------------------------------------------------------------------------------------------*/

export interface FieldProps extends FieldRootProps {
  /**
   * The field label, rendered above (vertical) or beside (horizontal) the
   * control and auto-associated with it for accessibility.
   */
  label?: React.ReactNode;
  /**
   * Inline action rendered on the same row as the label, end-aligned — e.g. a
   * "Forgot password?" link. Vertical orientation only.
   */
  labelAction?: React.ReactNode;
  /**
   * Helper text rendered under the label. Linked to the control via
   * `aria-describedby`.
   */
  description?: React.ReactNode;
  /**
   * Error message. When set (and `invalid` is not explicitly `false`), the field
   * is treated as invalid: the message shows in destructive color and the
   * control receives `aria-invalid`.
   */
  error?: React.ReactNode;
  /**
   * Positive confirmation message, rendered in success color below the control.
   * Ignored while `error` is present.
   */
  success?: React.ReactNode;
  /**
   * Strip the border, background, and shadow from the child control — for inline
   * editing (titles, descriptions). The control keeps its focus border tint.
   * @default false
   */
  borderless?: boolean;
  /** The field control(s) — an `<Input>`, `<Checkbox>`, `FieldControl`, etc. */
  children: React.ReactNode;
}

/** Child-control styling hooks, keyed by the control's own `data-slot`. */
const CONTROL_SLOTS = '[&_[data-slot=field-control]]:text-base [&_[data-slot=input]]:text-base';

/** Borderless overrides — flatten inputs/textareas/select-triggers for inline edit. */
const BORDERLESS =
  '[&_[data-slot=field-control]]:border-none [&_[data-slot=field-control]]:bg-transparent [&_[data-slot=field-control]]:px-0 [&_[data-slot=field-control]]:shadow-none ' +
  '[&_[data-slot=input]]:border-none [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:px-0 [&_[data-slot=input]]:shadow-none ' +
  '[&_[data-slot=textarea]]:border-none [&_[data-slot=textarea]]:bg-transparent [&_[data-slot=textarea]]:px-0 [&_[data-slot=textarea]]:shadow-none ' +
  '[&_[data-slot=select-trigger]]:border-none [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:px-0 [&_[data-slot=select-trigger]]:shadow-none';

/**
 * `Field` — the ergonomic, prop-driven form-field wrapper. Composes a Base UI
 * `Field.Root` with a label (+ optional inline `labelAction`), `description`,
 * and `error`/`success` message around a single control passed as `children`.
 * Base UI auto-wires `aria-describedby`/`aria-invalid` between the parts.
 *
 * For full control over composition, use the exported primitives directly:
 * `FieldRoot`, `FieldLabel`, `FieldControl`, `FieldDescription`, `FieldError`.
 *
 * @example
 * // Vertical (default) — label above input
 * <Field label="Email" description="We'll never share it.">
 *   <Input type="email" placeholder="you@vegastack.com" />
 * </Field>
 *
 * @example
 * // With an inline label action + error
 * <Field label="Password" labelAction={<a href="/forgot">Forgot?</a>} error="Required">
 *   <Input type="password" />
 * </Field>
 *
 * @example
 * // Horizontal — control beside label (checkboxes, switches)
 * <Field label="Set as default" orientation="horizontal">
 *   <Checkbox />
 * </Field>
 */
export function Field({
  className,
  orientation = 'vertical',
  label,
  labelAction,
  description,
  error,
  success,
  borderless = false,
  invalid,
  children,
  ...props
}: FieldProps) {
  const isHorizontal = orientation === 'horizontal';
  const isResponsive = orientation === 'responsive';
  const isInvalid = invalid ?? Boolean(error);
  const hasHeader = label != null || labelAction != null;

  return (
    <FieldRoot
      orientation={orientation}
      invalid={isInvalid}
      className={cn(CONTROL_SLOTS, borderless && BORDERLESS, className)}
      {...props}
    >
      {isResponsive ? (
        <>
          {/* Responsive: label+description form a FieldContent column that sits left of the
              control from the wrapping FieldGroup's @md width, stacked below it. */}
          <FieldContent>
            {label != null ? <FieldLabel>{label}</FieldLabel> : null}
            {description != null ? <FieldDescription>{description}</FieldDescription> : null}
          </FieldContent>
          {children}
        </>
      ) : isHorizontal ? (
        <>
          {children}
          {label != null ? <FieldLabel className="cursor-pointer">{label}</FieldLabel> : null}
          {/* Description wraps to its own full-width line under the control+label row,
              mirroring FieldError's horizontal treatment (register P0-05). */}
          {description != null ? (
            <FieldDescription className="basis-full">{description}</FieldDescription>
          ) : null}
        </>
      ) : (
        <>
          {hasHeader ? (
            <div
              data-slot="field-header"
              className="flex items-baseline justify-between gap-2"
            >
              {label != null ? <FieldLabel>{label}</FieldLabel> : <span />}
              {labelAction != null ? (
                <span
                  data-slot="field-label-action"
                  className="text-label-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-info-text"
                >
                  {labelAction}
                </span>
              ) : null}
            </div>
          ) : null}
          {description != null ? <FieldDescription>{description}</FieldDescription> : null}
          {children}
        </>
      )}
      {error != null ? (
        <FieldError match={isInvalid} className={cn(isHorizontal && 'basis-full')}>
          {error}
        </FieldError>
      ) : success != null ? (
        <FieldSuccess className={cn(isHorizontal && 'basis-full')}>{success}</FieldSuccess>
      ) : null}
    </FieldRoot>
  );
}
