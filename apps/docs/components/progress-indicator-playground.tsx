'use client';

import type { ReactNode } from 'react';
import { ProgressIndicator, type ProgressIndicatorProps } from '@/components/ui/progress-indicator';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type ProgressIndicatorPlaygroundKey = 'value' | 'size' | 'shape';

const VALUE_OPTIONS = [
  { value: '25', label: '25%' },
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '100', label: '100%' },
] as const;

const SIZE_OPTIONS = [
  { value: 'xs', label: 'Extra small' },
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const SHAPE_OPTIONS = [
  { value: 'circle', label: 'Circle' },
  { value: 'squircle', label: 'Squircle' },
] as const;

const progressIndicatorPlaygroundConfig: PlaygroundConfig<ProgressIndicatorPlaygroundKey> = {
  controls: [
    // `value` starts at 50% (the component's own default is `0` = empty track; the playground
    // shows a visible fill, so `value` is always emitted in the code).
    { type: 'select', key: 'value', label: 'Value', options: VALUE_OPTIONS, defaultValue: '50' },
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'select', key: 'shape', label: 'Shape', options: SHAPE_OPTIONS, defaultValue: 'circle' },
  ],
  render: (state): ReactNode => (
    <ProgressIndicator
      value={Number(state.value)}
      size={state.size as ProgressIndicatorProps['size']}
      shape={state.shape as ProgressIndicatorProps['shape']}
    />
  ),
  toCode: (state) => {
    const props: string[] = [`value={${state.value}}`];
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    if (state.shape !== 'circle') props.push(`shape="${state.shape}"`);
    return `<ProgressIndicator ${props.join(' ')} />`;
  },
};

/**
 * `ProgressIndicatorPlayground` — interactive props playground for `ProgressIndicator`
 * (value / size / shape), backed by the generic {@link PropsPlayground}. Changing the value sweeps
 * the pie wedge via the component's own token-driven stroke transition. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/progress-indicator.mdx`.
 */
export function ProgressIndicatorPlayground() {
  return <PropsPlayground {...progressIndicatorPlaygroundConfig} />;
}
