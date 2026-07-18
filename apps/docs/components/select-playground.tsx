'use client';

import type { ReactNode } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  type SelectTriggerProps,
} from '@/components/ui/select';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type SelectPlaygroundKey = 'size' | 'disabled';

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const FONTS = { sans: 'Sans-serif', serif: 'Serif', mono: 'Monospace' };

const selectPlaygroundConfig: PlaygroundConfig<SelectPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <div className="w-56">
      <Select items={FONTS} defaultValue="serif" disabled={Boolean(state.disabled)}>
        <SelectTrigger
          size={state.size as SelectTriggerProps['size']}
          aria-label="Font family"
        >
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FONTS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
  toCode: (state) => {
    const rootProps = state.disabled ? ' disabled' : '';
    const triggerProps = state.size !== 'default' ? ` size="${state.size}"` : '';
    return [
      'const fonts = { sans: "Sans-serif", serif: "Serif", mono: "Monospace" };',
      '',
      `<Select items={fonts} defaultValue="serif"${rootProps}>`,
      `  <SelectTrigger${triggerProps} aria-label="Font family">`,
      '    <SelectValue placeholder="Select a font" />',
      '  </SelectTrigger>',
      '  <SelectContent>',
      '    <SelectItem value="sans">Sans-serif</SelectItem>',
      '    <SelectItem value="serif">Serif</SelectItem>',
      '    <SelectItem value="mono">Monospace</SelectItem>',
      '  </SelectContent>',
      '</Select>',
    ].join('\n');
  },
};

/**
 * `SelectPlayground` — interactive props playground for `Select` (trigger size / disabled) over
 * a small option list. Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/select.mdx`.
 */
export function SelectPlayground() {
  return <PropsPlayground {...selectPlaygroundConfig} />;
}
