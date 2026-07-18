'use client';

import type { ReactNode } from 'react';
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  type ComboboxInputProps,
} from '@/components/ui/combobox';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type ComboboxPlaygroundKey = 'size' | 'disabled';

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const FONTS = ['Sans-serif', 'Serif', 'Monospace', 'Cursive', 'Fantasy'];

const comboboxPlaygroundConfig: PlaygroundConfig<ComboboxPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
  ],
  render: (state): ReactNode => {
    const size = state.size as ComboboxInputProps['size'];
    return (
      <Combobox items={FONTS} disabled={Boolean(state.disabled)}>
        <ComboboxInputGroup size={size} className="w-64">
          <ComboboxInput size={size} aria-label="Font family" placeholder="Search fonts…" />
          <ComboboxClear aria-label="Clear" />
          <ComboboxTrigger size={size} aria-label="Toggle fonts" />
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxEmpty>No fonts found.</ComboboxEmpty>
          {/* Function child = filtered rendering; static ComboboxItem children are NOT auto-filtered. */}
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
  toCode: (state) => {
    const sizeProp = state.size !== 'default' ? ` size="${state.size}"` : '';
    const rootProps = state.disabled ? ' disabled' : '';
    return [
      'const fonts = ["Sans-serif", "Serif", "Monospace", "Cursive", "Fantasy"];',
      '',
      `<Combobox items={fonts}${rootProps}>`,
      `  <ComboboxInputGroup${sizeProp} className="w-64">`,
      `    <ComboboxInput${sizeProp} aria-label="Font family" placeholder="Search fonts…" />`,
      '    <ComboboxClear aria-label="Clear" />',
      `    <ComboboxTrigger${sizeProp} aria-label="Toggle fonts" />`,
      '  </ComboboxInputGroup>',
      '  <ComboboxContent>',
      '    <ComboboxEmpty>No fonts found.</ComboboxEmpty>',
      '    <ComboboxList>',
      '      {(item: string) => (',
      '        <ComboboxItem key={item} value={item}>',
      '          {item}',
      '        </ComboboxItem>',
      '      )}',
      '    </ComboboxList>',
      '  </ComboboxContent>',
      '</Combobox>',
    ].join('\n');
  },
};

/**
 * `ComboboxPlayground` — interactive props playground for `Combobox` (size / disabled) over a
 * small filterable list, using the function-child `ComboboxList` rendering so typing actually
 * filters. Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/combobox.mdx`.
 */
export function ComboboxPlayground() {
  return <PropsPlayground {...comboboxPlaygroundConfig} />;
}
