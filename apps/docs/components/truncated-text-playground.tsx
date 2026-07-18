'use client';

import type { ReactNode } from 'react';
import { TruncatedText, type TruncatedTextProps } from '@/components/ui/truncated-text';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type TruncatedTextPlaygroundKey = 'lines' | 'tooltipSide' | 'as';

/**
 * Long enough to overflow a `max-w-48` box at every offered line budget, so the
 * truncation (and the overflow Tooltip) always actually engages.
 */
const LONG_TEXT =
  'Quarterly infrastructure migration retrospective — capacity planning, on-call rotation, and budget notes for the platform team';

const LINES_OPTIONS = [
  { value: '1', label: '1 (single line)' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
] as const;

const SIDE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
] as const;

const AS_OPTIONS = [
  { value: 'span', label: 'span' },
  { value: 'p', label: 'p' },
  { value: 'div', label: 'div' },
] as const;

const truncatedTextPlaygroundConfig: PlaygroundConfig<TruncatedTextPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'lines', label: 'Lines', options: LINES_OPTIONS, defaultValue: '1' },
    { type: 'select', key: 'tooltipSide', label: 'Tooltip side', options: SIDE_OPTIONS, defaultValue: 'top' },
    { type: 'select', key: 'as', label: 'Element', options: AS_OPTIONS, defaultValue: 'span' },
  ],
  render: (state): ReactNode => (
    // The constrained box is what makes the text overflow — width is owned by the
    // parent, so it is part of the generated JSX too.
    <div className="w-full max-w-48">
      <TruncatedText
        lines={Number(state.lines)}
        tooltipSide={state.tooltipSide as TruncatedTextProps['tooltipSide']}
        as={state.as as TruncatedTextProps['as']}
      >
        {LONG_TEXT}
      </TruncatedText>
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.lines !== '1') props.push(`lines={${state.lines}}`);
    if (state.tooltipSide !== 'top') props.push(`tooltipSide="${state.tooltipSide}"`);
    if (state.as !== 'span') props.push(`as="${state.as}"`);
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return `<div className="max-w-48">
  <TruncatedText${propsString}>{longText}</TruncatedText>
</div>`;
  },
};

/**
 * `TruncatedTextPlayground` — interactive props playground for `TruncatedText`
 * (lines / tooltipSide / as), backed by the generic {@link PropsPlayground}. The demo string
 * overflows its constrained box at every line budget, so the overflow Tooltip is always live.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/truncated-text.mdx`.
 */
export function TruncatedTextPlayground() {
  return <PropsPlayground {...truncatedTextPlaygroundConfig} />;
}
