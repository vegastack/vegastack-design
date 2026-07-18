'use client';

import type { ReactNode } from 'react';
import { RelativeTime, type RelativeTimeProps } from '@/components/ui/relative-time';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type RelativeTimePlaygroundKey = 'date' | 'mode' | 'unitStyle';

/**
 * Deterministic offsets from the live clock — each renders a stable string
 * ("5 minutes ago", "yesterday", …) regardless of when the page loads. `code`
 * is the copyable expression for the same instant.
 */
const DATE_OPTIONS = [
  { value: '5m', label: '5 minutes ago', offsetMs: 5 * 60_000, code: 'new Date(Date.now() - 5 * 60_000)' },
  { value: '26h', label: '26 hours ago', offsetMs: 26 * 3_600_000, code: 'new Date(Date.now() - 26 * 3_600_000)' },
  { value: '40d', label: '40 days ago', offsetMs: 40 * 86_400_000, code: 'new Date(Date.now() - 40 * 86_400_000)' },
  { value: 'in3d', label: 'In 3 days', offsetMs: -3 * 86_400_000, code: 'new Date(Date.now() + 3 * 86_400_000)' },
] as const;

const MODE_OPTIONS = [
  { value: 'ago', label: 'Ago (duration)' },
  { value: 'day', label: 'Day (calendar)' },
] as const;

const UNIT_STYLE_OPTIONS = [
  { value: 'long', label: 'Long — "2 hours ago"' },
  { value: 'short', label: 'Short — "2 hr. ago"' },
  { value: 'narrow', label: 'Narrow — "2h ago"' },
] as const;

function dateOption(value: string | boolean) {
  return DATE_OPTIONS.find((option) => option.value === value) ?? DATE_OPTIONS[0];
}

const relativeTimePlaygroundConfig: PlaygroundConfig<RelativeTimePlaygroundKey> = {
  controls: [
    { type: 'select', key: 'date', label: 'Date', options: DATE_OPTIONS, defaultValue: '5m' },
    { type: 'select', key: 'mode', label: 'Mode', options: MODE_OPTIONS, defaultValue: 'ago' },
    { type: 'select', key: 'unitStyle', label: 'Unit style', options: UNIT_STYLE_OPTIONS, defaultValue: 'long' },
  ],
  render: (state): ReactNode => (
    <RelativeTime
      date={new Date(Date.now() - dateOption(state.date).offsetMs)}
      mode={state.mode as RelativeTimeProps['mode']}
      unitStyle={state.unitStyle as RelativeTimeProps['unitStyle']}
    />
  ),
  toCode: (state) => {
    const props: string[] = [`date={${dateOption(state.date).code}}`];
    if (state.mode !== 'ago') props.push(`mode="${state.mode}"`);
    if (state.unitStyle !== 'long') props.push(`unitStyle="${state.unitStyle}"`);
    return `<RelativeTime ${props.join(' ')} />`;
  },
};

/**
 * `RelativeTimePlayground` — interactive props playground for `RelativeTime` (date offset / mode),
 * backed by the generic {@link PropsPlayground}. The date presets are fixed offsets from now, so
 * the displayed string is deterministic on load. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/relative-time.mdx`.
 */
export function RelativeTimePlayground() {
  return <PropsPlayground {...relativeTimePlaygroundConfig} />;
}
