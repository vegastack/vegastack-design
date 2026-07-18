'use client';

import type { ReactNode } from 'react';
import { Field, FieldGroup, type FieldProps } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type FieldPlaygroundKey = 'orientation' | 'showDescription' | 'showError' | 'disabled';

const ORIENTATION_OPTIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'responsive', label: 'Responsive' },
] as const;

const DESCRIPTION = "We'll never share it.";
const ERROR = 'Enter a valid email address.';

const fieldPlaygroundConfig: PlaygroundConfig<FieldPlaygroundKey> = {
  controls: [
    {
      type: 'select',
      key: 'orientation',
      label: 'Orientation',
      options: ORIENTATION_OPTIONS,
      defaultValue: 'vertical',
    },
    { type: 'switch', key: 'showDescription', label: 'Description', defaultValue: false },
    { type: 'switch', key: 'showError', label: 'Error', defaultValue: false },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
  ],
  render: (state): ReactNode => {
    const field = (
      <Field
        label="Email"
        orientation={state.orientation as FieldProps['orientation']}
        description={state.showDescription ? DESCRIPTION : undefined}
        // Toggling Error on freshly mounts FieldError — its motion-enter-up entrance replays.
        error={state.showError ? ERROR : undefined}
        disabled={Boolean(state.disabled)}
      >
        <Input type="email" placeholder="you@vegastack.com" />
      </Field>
    );
    // `responsive` reacts to the wrapping FieldGroup's @container width; the others don't need it.
    return state.orientation === 'responsive' ? (
      <FieldGroup className="w-80">{field}</FieldGroup>
    ) : (
      <div className="w-80">{field}</div>
    );
  },
  toCode: (state) => {
    const props: string[] = ['label="Email"'];
    if (state.orientation !== 'vertical') props.push(`orientation="${state.orientation}"`);
    if (state.showDescription) props.push(`description="${DESCRIPTION}"`);
    if (state.showError) props.push(`error="${ERROR}"`);
    if (state.disabled) props.push('disabled');
    const field = [
      `<Field ${props.join(' ')}>`,
      '  <Input type="email" placeholder="you@vegastack.com" />',
      '</Field>',
    ];
    if (state.orientation === 'responsive') {
      return ['<FieldGroup>', ...field.map((line) => `  ${line}`), '</FieldGroup>'].join('\n');
    }
    return field.join('\n');
  },
};

/**
 * `FieldPlayground` — interactive props playground for `Field` (orientation / description /
 * error / disabled) wrapping an `Input`. Toggling Error on demonstrates the `FieldError`
 * motion-enter-up entrance plus the control's auto-shake. Backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/field.mdx`.
 */
export function FieldPlayground() {
  return <PropsPlayground {...fieldPlaygroundConfig} />;
}
