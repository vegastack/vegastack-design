import { defineStory } from '@/lib/story';
import { PasswordInput } from '@/components/ui/password-input';

/**
 * Story explorer for `PasswordInput` — controls auto-generated from
 * `PasswordInputProps` by the Story build plugin.
 */
export const story = defineStory({
  Component: PasswordInput,
  args: [
    {
      variant: 'Default',
      initial: {
        'aria-label': 'Password',
        placeholder: 'Enter password',
      },
    },
    {
      variant: 'With requirements',
      initial: {
        'aria-label': 'New password',
        placeholder: 'Enter new password',
      },
      fixed: {
        requirements: [
          { label: 'At least 8 characters', met: true },
          { label: 'Contains a number', met: false },
        ],
      },
    },
  ],
});
