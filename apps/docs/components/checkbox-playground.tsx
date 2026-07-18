'use client';

import type { ReactNode } from 'react';
import { Checkbox, type CheckboxProps } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type CheckboxPlaygroundKey = 'size' | 'disabled' | 'indeterminate';

const SIZE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'sm', label: 'Small' },
] as const;

const checkboxPlaygroundConfig: PlaygroundConfig<CheckboxPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
    { type: 'switch', key: 'indeterminate', label: 'Indeterminate', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <Field label="Accept terms" orientation="horizontal">
      <Checkbox
        size={state.size as CheckboxProps['size']}
        disabled={Boolean(state.disabled)}
        indeterminate={Boolean(state.indeterminate)}
      />
    </Field>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    if (state.disabled) props.push('disabled');
    if (state.indeterminate) props.push('indeterminate');
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return [
      '<Field label="Accept terms" orientation="horizontal">',
      `  <Checkbox${propsString} />`,
      '</Field>',
    ].join('\n');
  },
};

/**
 * `CheckboxPlayground` — interactive props playground for `Checkbox` (size / disabled /
 * indeterminate), rendered inside a horizontal `Field` for a visible, auto-associated label.
 * Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/checkbox.mdx`.
 */
export function CheckboxPlayground() {
  return <PropsPlayground {...checkboxPlaygroundConfig} />;
}
