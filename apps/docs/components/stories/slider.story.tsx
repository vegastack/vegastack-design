import { defineStory } from '@/lib/story';
import { Slider } from '@/components/ui/slider';

/**
 * Story explorer for `Slider` — controls auto-generated from `SliderProps` by the Story
 * build plugin. Uncontrolled via `defaultValue`; pass an array for a range.
 */
export const story = defineStory({
  Component: Slider,
  args: [
    {
      variant: 'Default',
      initial: {
        defaultValue: 40,
        'aria-label': 'Volume',
      },
    },
    {
      variant: 'Range',
      initial: {
        'aria-label': 'Price',
      },
      fixed: {
        defaultValue: [20, 80],
        thumbAriaLabels: ['Minimum price', 'Maximum price'],
      },
    },
  ],
});
