import { defineStory } from '@/lib/story';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Story explorer for `Checkbox` — controls auto-generated from `CheckboxProps` by the
 * Story build plugin. Uncontrolled via `defaultChecked`; standalone checkboxes carry an
 * `aria-label` since there is no Field to name them here.
 */
export const story = defineStory({
  Component: Checkbox,
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
