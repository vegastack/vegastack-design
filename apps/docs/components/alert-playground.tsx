'use client';

import type { ReactNode } from 'react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
  type AlertIntent,
} from '@/components/ui/alert';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type AlertPlaygroundKey = 'intent' | 'hideIcon' | 'dismissable';

const INTENT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'destructive', label: 'Destructive' },
] as const;

const alertPlaygroundConfig: PlaygroundConfig<AlertPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'intent', label: 'Intent', options: INTENT_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'hideIcon', label: 'Hide icon', defaultValue: false },
    { type: 'switch', key: 'dismissable', label: 'Dismissable', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <Alert
      // Remount when `dismissable` toggles so a self-dismissed alert reappears
      // instead of leaving the preview empty.
      key={String(state.dismissable)}
      intent={state.intent as AlertIntent}
      hideIcon={Boolean(state.hideIcon)}
      dismissable={Boolean(state.dismissable)}
      className="max-w-md"
    >
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Your trial ends in 7 days.</AlertDescription>
    </Alert>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.intent !== 'default') props.push(`intent="${state.intent}"`);
    if (state.hideIcon) props.push('hideIcon');
    if (state.dismissable) props.push('dismissable');
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return [
      `<Alert${propsString}>`,
      '  <AlertTitle>Heads up</AlertTitle>',
      '  <AlertDescription>Your trial ends in 7 days.</AlertDescription>',
      '</Alert>',
    ].join('\n');
  },
};

/**
 * `AlertPlayground` — interactive props playground for `Alert` (intent / hideIcon /
 * dismissable), backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/alert.mdx`.
 */
export function AlertPlayground() {
  return <PropsPlayground {...alertPlaygroundConfig} />;
}
