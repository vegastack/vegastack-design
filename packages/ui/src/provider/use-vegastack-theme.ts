'use client';

import { useTheme } from 'next-themes';

/**
 * `useVegaStackTheme` — thin wrapper over next-themes' `useTheme()`.
 * Returns the resolved theme + a `setTheme` setter (`'light' | 'dark' | 'system'`).
 */
export function useVegaStackTheme() {
  return useTheme();
}
