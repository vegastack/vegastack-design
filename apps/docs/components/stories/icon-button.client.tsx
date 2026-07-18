'use client';

import { Plus } from 'lucide-react';
import { IconButton, type IconButtonProps } from '@/components/ui/icon-button';

export interface IconButtonStoryProps {
  variant?: IconButtonProps['variant'];
  size?: IconButtonProps['size'];
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
}

/**
 * Narrow story host for the IconButton Explorer. The real `IconButtonProps`
 * (an `Omit<>` over Base UI's Button surface, whose `className`/`render` accept
 * state-function types) sends Fumadocs Story's DEV-time control analyzer into a
 * multi-minute type walk that 500s the page (build is unaffected — dev-only).
 * Hand-declaring the design-relevant axes here keeps the Explorer interactive
 * and the page fast; the full inherited surface is documented by AutoTypeTable.
 */
export function IconButtonStory({
  'aria-label': ariaLabel = 'Add item',
  ...props
}: IconButtonStoryProps) {
  return (
    <IconButton aria-label={ariaLabel} {...props}>
      <Plus />
    </IconButton>
  );
}
