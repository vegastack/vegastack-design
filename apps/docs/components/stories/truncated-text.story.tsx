import { defineStory } from '@/lib/story';
import { TruncatedText } from '@/components/ui/truncated-text';

/** Long fixture so truncation actually engages inside the constrained box. */
const LONG_TEXT =
  'A long file name that overflows its constrained container and reveals the full text on hover or focus';

/**
 * Story explorer for `TruncatedText` — controls auto-generated from
 * `TruncatedTextProps` by the Story build plugin. The `className` constrains the
 * width so the ellipsis engages.
 */
export const story = defineStory({
  Component: TruncatedText,
  args: [
    {
      variant: 'Single line',
      initial: {
        children: LONG_TEXT,
        className: 'max-w-48',
      },
    },
    {
      variant: 'Multi-line clamp',
      initial: {
        children: LONG_TEXT,
        lines: 3,
        className: 'max-w-64',
      },
    },
  ],
});
