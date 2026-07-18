import { defineStory } from '@/lib/story';
import { NotificationBell } from '@/components/ui/notification-bell';

/**
 * Story explorer for `NotificationBell` — controls auto-generated from
 * `NotificationBellProps` by the Story build plugin. Complements the curated
 * NotificationBellPlayground.
 */
export const story = defineStory({
  Component: NotificationBell,
  args: [
    {
      variant: 'Default',
      initial: {
        count: 3,
      },
    },
    {
      variant: 'Dot',
      initial: {
        count: 3,
      },
      fixed: {
        dot: true,
      },
    },
  ],
});
