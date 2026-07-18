import { defineStory } from '@/lib/story';
import { SwitchStory } from '@/components/stories/story-shims';

/**
 * Story explorer for `Switch` — controls are generated from the narrow-prop client shim
 * (see `story-shims.tsx`: the raw Base UI prop graph serializes to ~24MB and breaks the
 * Cloudflare per-asset limit). Uncontrolled via `defaultChecked`; standalone switches
 * carry an `aria-label` since there is no Field to name them here.
 */
export const story = defineStory({
  Component: SwitchStory,
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
