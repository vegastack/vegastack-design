import { defineStory } from '@/lib/story';
import { Kbd } from './kbd.client';

/**
 * Story explorer for `Kbd` — controls auto-generated from `KbdProps` by the Story build
 * plugin. The single-key form takes a `children` label; the combo form uses the `keys`
 * array (fixed — array props aren't editable as a control), OS-aware via `os`.
 */
export const story = defineStory({
  Component: Kbd,
  args: [
    {
      variant: 'Single key',
      initial: {
        children: '⌘',
        os: 'mac',
      },
    },
    {
      variant: 'Combo',
      initial: {
        os: 'mac',
      },
      fixed: {
        keys: ['⌘', 'K'],
      },
    },
  ],
});
