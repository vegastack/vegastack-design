import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { SettingsCard, SettingsRow, SettingsSection } from './settings-row';

test('renders the row label and its control slot', async () => {
  const screen = await render(
    <SettingsRow label="Workspace name" description="Shown across the product.">
      <button type="button">Edit</button>
    </SettingsRow>,
  );
  await expect.element(screen.getByText('Workspace name')).toBeInTheDocument();
  await expect.element(screen.getByText('Shown across the product.')).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
});

test('row carries its data-slot and divider parts', async () => {
  const screen = await render(
    <SettingsRow label="Email">
      <span>on</span>
    </SettingsRow>,
  );
  const { container } = screen;
  const row = container.querySelector('[data-slot="settings-row"]');
  expect(row).not.toBeNull();
  expect(container.querySelector('[data-slot="settings-row-label"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="settings-row-control"]')).not.toBeNull();
});

test('renders a real label when controlId is provided', async () => {
  const screen = await render(
    <SettingsRow label="Workspace name" controlId="workspace-name">
      <input id="workspace-name" defaultValue="Acme" />
    </SettingsRow>,
  );
  const input = screen.getByLabelText('Workspace name');
  await expect.element(input).toBeInTheDocument();
});

test('row is its own named @container and its inner layout row responds to container width, not viewport', async () => {
  const screen = await render(
    <SettingsRow label="Long setting">
      <button type="button">Edit</button>
    </SettingsRow>,
  );
  const row = screen.container.querySelector('[data-slot="settings-row"]');
  // The row establishes the container itself — works standalone, no SettingsCard required.
  expect(row?.className).toContain('@container/settings-row');
  // The inner layout row (the row's direct child) stacks by default and queries the
  // `settings-row` container — a `sm:` viewport breakpoint would ignore a narrow ancestor
  // (e.g. a settings row in a narrow card on a wide screen); a container query doesn't.
  const layout = row?.firstElementChild;
  expect(layout?.className).toContain('flex-col');
  expect(layout?.className).toContain('@sm/settings-row:flex-row');
});

// Note: this suite compiles no CSS (see vitest.config.ts / the note in
// truncated-text.test.tsx), so the `@container`/`@sm:` utilities above are inert class
// strings here — real container-query engagement (the row measuring its OWN ancestor width
// vs. the viewport) is proven visually by the VRT layer, not this fast structural suite.

test('section renders its title and description', async () => {
  const screen = await render(
    <SettingsSection title="Notifications" description="Choose what you hear about.">
      <div>body</div>
    </SettingsSection>,
  );
  await expect.element(screen.getByText('Notifications')).toBeInTheDocument();
  await expect.element(screen.getByText('Choose what you hear about.')).toBeInTheDocument();
  await expect.element(screen.getByText('body')).toBeInTheDocument();
});

test('compound parts each expose their data-slot', async () => {
  const screen = await render(
    <SettingsSection title="Account">
      <SettingsCard>
        <SettingsRow label="Name">
          <span>Ada</span>
        </SettingsRow>
        <SettingsRow label="Plan">
          <span>Pro</span>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>,
  );
  const { container } = screen;
  expect(container.querySelector('[data-slot="settings-section"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="settings-section-title"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="settings-card"]')).not.toBeNull();
  expect(container.querySelectorAll('[data-slot="settings-row"]')).toHaveLength(2);
});

test('forwards ref to the underlying row element', async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <SettingsRow ref={ref} label="Ref">
      <span>x</span>
    </SettingsRow>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe('settings-row');
});

test('no a11y violations', async () => {
  const screen = await render(
    <SettingsSection title="Notifications" description="Choose what you hear about.">
      <SettingsCard>
        <SettingsRow label="Email" description="Product updates and tips.">
          <button type="button" aria-label="Toggle email notifications">
            Toggle
          </button>
        </SettingsRow>
        <SettingsRow label="SMS" description="Critical alerts only.">
          <button type="button" aria-label="Toggle SMS notifications">
            Toggle
          </button>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>,
  );
  await expectNoA11yViolations(screen.container);
});
