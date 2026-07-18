import { defineStory } from '@/lib/story';
import { Switch } from '@/components/ui/switch';

/**
 * Story explorer for `Switch` — controls auto-generated from `SwitchProps` by the Story
 * build plugin. Uncontrolled via `defaultChecked`; standalone switches carry an
 * `aria-label` since there is no Field to name them here.
 */
export const story = defineStory({
  Component: Switch,
  args: [
    {
      variant: 'Default',
      initial: {
        defaultChecked: true,
        'aria-label': 'Email notifications',
      },
    },
    {
      variant: 'Large',
      initial: {
        'aria-label': 'Dark mode',
      },
      fixed: {
        size: 'lg',
      },
    },
  ],
});
