// @vegastack/eslint-config/react — base + React rules-of-hooks.
import reactHooks from 'eslint-plugin-react-hooks';
import { base } from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export const react = [
  ...base,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default react;
