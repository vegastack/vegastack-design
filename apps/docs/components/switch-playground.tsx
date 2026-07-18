'use client';

import type { ReactNode } from 'react';
import { Switch, type SwitchProps } from '@/components/ui/switch';
import { Field } from '@/components/ui/field';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type SwitchPlaygroundKey = 'size' | 'disabled';

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const switchPlaygroundConfig: PlaygroundConfig<SwitchPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <Field label="Email notifications" orientation="horizontal">
      <Switch size={state.size as SwitchProps['size']} disabled={Boolean(state.disabled)} />
    </Field>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    if (state.disabled) props.push('disabled');
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return [
      '<Field label="Email notifications" orientation="horizontal">',
      `  <Switch${propsString} />`,
      '</Field>',
    ].join('\n');
  },
};

/**
 * `SwitchPlayground` — interactive props playground for `Switch` (size / disabled), rendered
 * inside a horizontal `Field` for a visible, auto-associated label. Backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/switch.mdx`.
 */
export function SwitchPlayground() {
  return <PropsPlayground {...switchPlaygroundConfig} />;
}
