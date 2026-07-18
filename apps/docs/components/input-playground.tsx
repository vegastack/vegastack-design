'use client';

import type { ReactNode } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type InputPlaygroundKey = 'type' | 'size' | 'disabled' | 'invalid';

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'password', label: 'Password' },
] as const;

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const inputPlaygroundConfig: PlaygroundConfig<InputPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'type', label: 'Type', options: TYPE_OPTIONS, defaultValue: 'text' },
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
    { type: 'switch', key: 'invalid', label: 'Invalid', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <div className="w-64">
      <Input
        type={state.type as string}
        size={state.size as InputProps['size']}
        placeholder="you@vegastack.com"
        aria-label="Email"
        disabled={Boolean(state.disabled)}
        // The false→true edge also replays the built-in shake (useShakeOnInvalid).
        aria-invalid={state.invalid ? true : undefined}
      />
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.type !== 'text') props.push(`type="${state.type}"`);
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    props.push('placeholder="you@vegastack.com"');
    if (state.disabled) props.push('disabled');
    if (state.invalid) props.push('aria-invalid="true"');
    return `<Input ${props.join(' ')} />`;
  },
};

/**
 * `InputPlayground` — interactive props playground for `Input` (type / size / disabled /
 * invalid). Flipping Invalid on replays the built-in shake and re-colors the border with the
 * destructive tint. Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/input.mdx`.
 */
export function InputPlayground() {
  return <PropsPlayground {...inputPlaygroundConfig} />;
}
