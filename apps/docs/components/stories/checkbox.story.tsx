import { defineStory } from '@/lib/story';
import { CheckboxStory } from '@/components/stories/story-shims';

/**
 * Story explorer for `Checkbox` — controls are generated from the narrow-prop client shim
 * (see `story-shims.tsx`: the raw Base UI prop graph serializes to ~24MB and breaks the
 * Cloudflare per-asset limit). Uncontrolled via `defaultChecked`; standalone checkboxes
 * carry an `aria-label` since there is no Field to name them here.
 */
export const story = defineStory({
  Component: CheckboxStory,
  args: [
    {
      variant: 'Default',
      initial: {
        defaultChecked: true,
        'aria-label': 'Accept terms',
      },
    },
    {
      variant: 'Indeterminate',
      initial: {
        indeterminate: true,
        'aria-label': 'Select all rows',
      },
    },
  ],
});
