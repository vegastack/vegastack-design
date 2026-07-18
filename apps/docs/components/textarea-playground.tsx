'use client';

import type { ReactNode } from 'react';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type TextareaPlaygroundKey = 'size' | 'autoGrow' | 'disabled' | 'invalid';

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const textareaPlaygroundConfig: PlaygroundConfig<TextareaPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'autoGrow', label: 'Auto-grow', defaultValue: false },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
    { type: 'switch', key: 'invalid', label: 'Invalid', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <div className="w-64">
      <Textarea
        size={state.size as TextareaProps['size']}
        autoGrow={Boolean(state.autoGrow)}
        placeholder="Tell us about your project…"
        aria-label="Project details"
        disabled={Boolean(state.disabled)}
        aria-invalid={state.invalid ? true : undefined}
      />
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    if (state.autoGrow) props.push('autoGrow');
    props.push('placeholder="Tell us about your project…"');
    if (state.disabled) props.push('disabled');
    if (state.invalid) props.push('aria-invalid="true"');
    return `<Textarea ${props.join(' ')} />`;
  },
};

/**
 * `TextareaPlayground` — interactive props playground for `Textarea` (size / autoGrow /
 * disabled / invalid). Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/textarea.mdx`.
 */
export function TextareaPlayground() {
  return <PropsPlayground {...textareaPlaygroundConfig} />;
}
