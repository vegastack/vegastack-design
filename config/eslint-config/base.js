// @vegastack/eslint-config/base — shared flat config (ESLint 9).
// Pairs with `tooling/design-lint.mjs` (token rules) and `tsc --noEmit` (types).
import tseslint from 'typescript-eslint';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export const base = [
  {
    ignores: ['dist/**', '.next/**', 'out/**', '.source/**', '**/*.test.tsx', '**/*.test.ts'],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Design-system guardrails complementing tooling/design-lint.mjs.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message: 'Hardcoded hex color — use a semantic token (bg-primary, text-foreground, …).',
        },
        {
          selector: "JSXAttribute[name.name='style'] Literal[value=/!important/]",
          message: 'Avoid !important — use semantic tokens and the cascade.',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default base;
