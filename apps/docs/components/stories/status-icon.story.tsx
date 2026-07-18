import { defineStory } from '@/lib/story';
import { StatusIcon } from './status-icon.client';

/**
 * Story explorer for `StatusIcon` — controls auto-generated from `StatusIconProps` by the
 * Story build plugin. Each `status` maps to an icon + semantic color token.
 */
export const story = defineStory({
  Component: StatusIcon,
  args: [
    {
      variant: 'Default',
      initial: {
        status: 'todo',
      },
    },
    {
      variant: 'In progress',
      fixed: {
        status: 'progress',
      },
    },
    {
      variant: 'Done',
      fixed: {
        status: 'done',
      },
    },
  ],
});
