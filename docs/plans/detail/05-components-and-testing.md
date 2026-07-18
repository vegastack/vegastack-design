# detail/05 — Components, Forms & Testing (verbatim)

Verified 2026-06-21 against npm (versions), base-ui.com, react-hook-form.com, zod.dev, vitest.dev, playwright.dev, and `references/fumadocs`.

## icons — three sanctioned sources (G1)
`packages/icons` exports an `Icon` + `BrandIcon` convention; nothing else may be used.
```tsx
// packages/icons/src/icon.tsx — functional UI icons (lucide)
import type { LucideIcon } from 'lucide-react';
const SIZES = { xs: 14, sm: 16, md: 20, lg: 24 } as const;
export function Icon({ as: Cmp, size = 'md', 'aria-label': label, ...props }:
  { as: LucideIcon; size?: keyof typeof SIZES; 'aria-label'?: string } & React.SVGProps<SVGSVGElement>) {
  return <Cmp width={SIZES[size]} height={SIZES[size]} strokeWidth={1.75} aria-hidden={label ? undefined : true} aria-label={label} {...props} />;
}
```
- Color = `currentColor` (inherits text color → themes automatically). `aria-hidden` unless `aria-label` is given.
- **Brand/logo icons** = `BrandIcon` over `thesvg` (npm `thesvg`, MIT, multi-variant: default colored, `variant="mono"` inherits `currentColor`). Has an MCP for agent selection.
- **Animated icons** = lucide-animated (MIT, motion-based) mirrored into our registry as copy-in items; pull `motion` only when used.
- **Enforcement:** ESLint rule + the design-audit skill reject any icon import outside `lucide-react`/`thesvg`/our animated registry, and any inline `<svg>` used as an icon. AGENTS.md constrains agents to `Icon`/`BrandIcon`.

## Base UI patterns (DL1) — `@base-ui/react@1.6.0`
`'use client'` is required on any file using interactive components. Per-component subpath imports (`@base-ui/react/dialog`, `/field`, `/form`, `/tooltip`, …). Enter/exit transitions via `data-starting-style`/`data-ending-style` (no JS animation lib).

Dialog (canonical, Tailwind v4):
```tsx
'use client';
import { Dialog } from '@base-ui/react/dialog';
export function ConfirmDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<button className="...">Open</button>} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/20 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-1/2 rounded-lg border bg-popover p-4 transition-[scale,opacity] duration-150 data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
          <Dialog.Title className="text-base font-semibold">Title</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">Body.</Dialog.Description>
          <Dialog.Close className="...">Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```
**`render` prop (composition):** every part accepts `render={<MyEl />}` or `render={(props, state) => <el {...props} />}` to swap the element while keeping behavior.
Source: https://base-ui.com/react/components/dialog · https://base-ui.com/react/components/field

## Per-component quality contract (requirements §7.6 — CI-gated)
A component ships only if it has: all applicable UI states (default/hover/focus/loading/empty/error/success/disabled); the knobs contract (`className` passthrough cn-merged, `render`, CVA variant/size, `data-*` state, forwarded ref, slot props); a11y (keyboard map, ARIA, `:focus-visible`, passing `axe`); a complete Fumadocs page (all §7.3 sections, live preview of real source, AutoTypeTable); a changeset; and a registry item with `meta.integrity` + `@vegastack/tokens` range. Authoring scaffold + CI enforce all of it.

Component file shape (scaffolded by `vegastack-add-component`):
```
packages/ui/src/components/button/
  button.tsx     # 'use client' if interactive; Base UI + CVA; cn() from @vegastack/utils
  index.ts       # export { Button } and export type { ButtonProps }
```
CVA + cn pattern (carry from Vega, formalized):
```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@vegastack/utils';
const buttonVariants = cva('inline-flex items-center justify-center rounded-md outline-none transition-colors ...', {
  variants: { variant: { default: 'bg-primary text-primary-foreground hover:bg-primary/90', /* ... */ }, size: { sm: 'h-7 px-2.5 text-xs', default: 'h-8 px-3', lg: 'h-9 px-4' } },
  defaultVariants: { variant: 'default', size: 'default' },
});
export interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```
JSDoc every public prop (`@default`, `@param`/`@returns`) so `AutoTypeTable` renders a complete table (detail/03 §5).

## forms (DL12) — Base UI Field + RHF Controller + Zod 4
```bash
pnpm add react-hook-form@7.80.0 @hookform/resolvers@5.4.0 zod@4.4.3
```
Use RHF `Controller` (Field.Control emits `onValueChange`, not a raw `onChange`). Zod 4 uses top-level `z.email()` (not `z.string().email()`). Base UI Field auto-wires `aria-describedby`/`aria-invalid` — no manual ARIA.
```tsx
'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@base-ui/react/form';
import { Field } from '@base-ui/react/field';

const schema = z.object({ username: z.string().min(1, 'Required'), email: z.email('Invalid email') });
type Values = z.infer<typeof schema>;

export function SignupForm() {
  const { control, handleSubmit } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { username: '', email: '' } });
  return (
    <Form onSubmit={handleSubmit((d) => console.log(d))}>
      <Controller name="username" control={control} render={({ field: { name, ref, value, onBlur, onChange }, fieldState: { invalid, isTouched, isDirty, error } }) => (
        <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
          <Field.Label>Username</Field.Label>
          <Field.Control value={value} onBlur={onBlur} onValueChange={onChange} ref={ref} />
          <Field.Error match={!!error}>{error?.message}</Field.Error>
        </Field.Root>
      )} />
      <button type="submit">Submit</button>
    </Form>
  );
}
```
Source: https://base-ui.com/react/handbook/forms · https://github.com/react-hook-form/resolvers · https://zod.dev/v4

## test — Vitest 4 browser mode (DL11)
```bash
pnpm add -D vitest@4.1.9 @vitest/browser-playwright @vitest/coverage-v8 \
  vitest-browser-react@2.2.0 playwright@1.61.0 @playwright/test@1.61.0 \
  vitest-axe@0.1.0 axe-core@4.12.1 @testing-library/jest-dom@6.9.1 @testing-library/user-event@14.6.1
pnpm exec playwright install --with-deps chromium
```
`vitest.config.ts` (browser mode, Playwright provider — real Chromium for reliable a11y/focus; jsdom only for pure-logic tests):
```ts
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    browser: { enabled: true, provider: playwright(), headless: true, instances: [{ browser: 'chromium' }] },
  },
});
```
`vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
```
`vitest-axe.d.ts`:
```ts
import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';
declare module 'vitest' {
  export interface Assertion extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}
```
Component + a11y test (browser mode uses `vitest-browser-react`'s `render` + locators):
```tsx
import { render } from 'vitest-browser-react';
import { axe } from 'vitest-axe';
import { expect, test, vi } from 'vitest';
import { Button } from './button';

test('clicks', async () => {
  const onClick = vi.fn();
  const screen = await render(<Button onClick={onClick}>Save</Button>);
  await screen.getByRole('button', { name: 'Save' }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test('no a11y violations', async () => {
  const screen = await render(<Button>Save</Button>);
  expect(await axe(screen.container)).toHaveNoViolations();
});
```
> `vitest-axe@0.1.0` is lightly maintained (last publish 2025-01-22) — pin `axe-core@4.12.1`. Alternative maintained path: `@axe-core/playwright@4.11.3` in the VRT suite.
Source: https://vitest.dev/guide/browser/ · https://github.com/chaance/vitest-axe

## test — Playwright VRT
`playwright.config.ts` (deterministic; animations off; runs in the pinned Docker image in CI):
```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './vrt',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.01, threshold: 0.2 } },
  use: { baseURL: 'http://localhost:3000', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-US' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'pnpm build && pnpm start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
```
`vrt/components.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
const pages = ['/components/button', '/components/dialog', '/components/field'];
for (const path of pages) {
  test(`VRT ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${path.replaceAll('/', '_')}.png`, { fullPage: true });
  });
}
```
**Font determinism (critical):** generate + compare baselines inside the pinned image so local==CI:
```bash
docker run --rm -v "$(pwd)":/work -w /work mcr.microsoft.com/playwright:v1.61.0-noble \
  pnpm exec playwright test --update-snapshots
```
Commit the `*-snapshots/` `-linux` PNGs; CI runs the same image (detail/01 §6).
Source: https://playwright.dev/docs/test-snapshots · https://playwright.dev/docs/docker

## ci — gate order (recap; full workflow in detail/01 §6)
`pnpm install --frozen-lockfile` → `tsc --noEmit` → `pnpm lint` (incl. design-lint: no hex/px, sanctioned icons only — G18) → `vitest run` (unit + a11y) → `playwright test` (VRT) → `pnpm build` → `registry:build` + `git diff --exit-code -- apps/docs/public/r` (stale-registry/hash check — Codex F5) → `changeset status --since=origin/main`. Checkout with `fetch-depth: 0`. All in `mcr.microsoft.com/playwright:v1.61.0-noble`.

## skill — `vegastack-add-component`
A skill that, given a component name, scaffolds the full contract in one run: (1) `packages/ui/src/components/<name>/{<name>.tsx,index.ts}` (Base UI + CVA + JSDoc); (2) a `registry-item` entry in `registry.json` (deps incl. `@vegastack/tokens` range, `meta.whenToUse`); (3) the Fumadocs MDX page (all §7.3 sections) + a `preview/<name>` export; (4) Vitest behavior + a11y tests; (5) a VRT page entry; (6) a changeset. Then runs `registry:build` (hash) + the CI gate locally. Companion skills: **`vegastack-consume`** (downstream init; runs the **fail-closed integrity preflight** then `shadcn add`, then post-write re-hash — detail/04 §3; plus `--primary`-style token-override setup), `vegastack-release` (changeset/semver/codemod), `vegastack-design-audit` (integrity-drift + design-lint + **`shadcn add <comp> --diff` upstream-surfacing into a scratch dir** for Model-A cherry-pick of shadcn improvements, read-only), `vegastack-brand` (stub until brand assets — O5).

## prop extraction (DL4)
Use Fumadocs `AutoTypeTable` (`fumadocs-typescript@5.2.6`, ts-morph) — NOT `react-docgen-typescript` (stale; weak on Base UI namespaced prop types). Config + JSDoc rules in detail/03 §5.
