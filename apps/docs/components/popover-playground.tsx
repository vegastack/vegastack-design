'use client';

import type { ReactNode } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  type PopoverContentProps,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type PopoverPlaygroundKey = 'side' | 'arrow';

const SIDE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
] as const;

const popoverPlaygroundConfig: PlaygroundConfig<PopoverPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'side', label: 'Side', options: SIDE_OPTIONS, defaultValue: 'bottom' },
    { type: 'switch', key: 'arrow', label: 'Arrow', defaultValue: false },
  ],
  // Renders CLOSED — the reader opens it via the trigger, so the initial state is deterministic.
  render: (state): ReactNode => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
      <PopoverContent
        side={state.side as PopoverContentProps['side']}
        arrow={Boolean(state.arrow)}
      >
        <PopoverTitle>About this layer</PopoverTitle>
        <PopoverDescription>Floats arbitrary content next to the trigger.</PopoverDescription>
      </PopoverContent>
    </Popover>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.side !== 'bottom') props.push(`side="${state.side}"`);
    if (state.arrow) props.push('arrow');
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return [
      '<Popover>',
      '  <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />',
      `  <PopoverContent${propsString}>`,
      '    <PopoverTitle>About this layer</PopoverTitle>',
      '    <PopoverDescription>Floats arbitrary content next to the trigger.</PopoverDescription>',
      '  </PopoverContent>',
      '</Popover>',
    ].join('\n');
  },
};

/**
 * `PopoverPlayground` — interactive props playground for `Popover` (`PopoverContent` side /
 * arrow), backed by the generic {@link PropsPlayground}. The popover renders closed; the reader
 * opens it from the trigger. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/popover.mdx`.
 */
export function PopoverPlayground() {
  return <PropsPlayground {...popoverPlaygroundConfig} />;
}
