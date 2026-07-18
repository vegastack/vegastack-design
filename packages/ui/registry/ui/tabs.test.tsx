import * as React from 'react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

function Basic({ variant }: { variant?: 'line' | 'pill' } = {}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant={variant}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity" count={3}>
          Activity
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="activity">Activity panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  );
}

test('renders the tabs and the first panel', async () => {
  const screen = await render(<Basic />);
  await expect.element(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
  await expect.element(screen.getByText('Overview panel')).toBeInTheDocument();
});

test('the default tab is selected', async () => {
  const screen = await render(<Basic />);
  await expect
    .element(screen.getByRole('tab', { name: 'Overview' }))
    .toHaveAttribute('data-active');
});

test('clicking a tab switches the panel and sets data-active', async () => {
  const screen = await render(<Basic />);
  const settings = screen.getByRole('tab', { name: 'Settings' });
  await settings.click();
  await expect.element(settings).toHaveAttribute('data-active');
  await expect.element(screen.getByText('Settings panel')).toBeInTheDocument();
  // The previously active tab is no longer active.
  await expect
    .element(screen.getByRole('tab', { name: 'Overview' }))
    .not.toHaveAttribute('data-active');
});

test('arrow-key keyboard navigation moves between tabs', async () => {
  const screen = await render(<Basic />);
  const overview = screen.getByRole('tab', { name: 'Overview' });
  await overview.click();
  // Manual activation: arrow moves focus, Enter activates.
  await userEvent.keyboard('{ArrowRight}{Enter}');
  await expect
    .element(screen.getByRole('tab', { name: 'Activity' }))
    .toHaveAttribute('data-active');
  await expect.element(screen.getByText('Activity panel')).toBeInTheDocument();
});

test('renders a trailing count badge on a trigger', async () => {
  const screen = await render(<Basic />);
  const count = screen.container.querySelector('[data-slot="tabs-trigger-count"]');
  expect(count).not.toBeNull();
  expect(count).toHaveTextContent('3');
});

test('list variant is reflected on data-variant (line default)', async () => {
  const screen = await render(<Basic />);
  const list = screen.container.querySelector('[data-slot="tabs-list"]');
  expect(list).toHaveAttribute('data-variant', 'line');
});

test('pill variant sets data-variant and renders no moving indicator', async () => {
  const screen = await render(<Basic variant="pill" />);
  const list = screen.container.querySelector('[data-slot="tabs-list"]');
  expect(list).toHaveAttribute('data-variant', 'pill');
  expect(screen.container.querySelector('[data-slot="tabs-indicator"]')).toBeNull();
});

test('line variant renders the moving indicator', async () => {
  const screen = await render(<Basic variant="line" />);
  expect(screen.container.querySelector('[data-slot="tabs-indicator"]')).not.toBeNull();
});

test('content panel carries an explicit focus-visible outline class', async () => {
  const screen = await render(<Basic />);
  const panel = screen.container.querySelector('[data-slot="tabs-content"]');
  expect(panel?.className).toContain('focus-visible:outline-ring');
});

test('vertical orientation is reflected on the root', async () => {
  const screen = await render(
    <Tabs defaultValue="a" orientation="vertical">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A panel</TabsContent>
      <TabsContent value="b">B panel</TabsContent>
    </Tabs>,
  );
  const root = screen.container.querySelector('[data-slot="tabs"]');
  expect(root).toHaveAttribute('data-orientation', 'vertical');
});

test('disabled trigger does not activate on click', async () => {
  const screen = await render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b" disabled>
          B
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">A panel</TabsContent>
      <TabsContent value="b">B panel</TabsContent>
    </Tabs>,
  );
  const b = screen.getByRole('tab', { name: 'B' });
  await expect.element(b).toHaveAttribute('data-disabled');
  await expect.element(screen.getByText('A panel')).toBeInTheDocument();
});

test('no a11y violations', async () => {
  const screen = await render(<Basic />);
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — disabled tab', async () => {
  const screen = await render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b" disabled>
          B
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">A panel</TabsContent>
      <TabsContent value="b">B panel</TabsContent>
    </Tabs>,
  );
  await expectNoA11yViolations(screen.container);
});

test('horizontal list scrolls with a scroll-fade edge affordance (clipped tabs read as scrollable)', async () => {
  const screen = await render(<Basic />);
  const list = screen.container.querySelector('[data-slot="tabs-list"]') as HTMLElement;
  expect(list.classList.contains('group-data-[orientation=horizontal]/tabs:overflow-x-auto')).toBe(
    true,
  );
  expect(list.classList.contains('group-data-[orientation=horizontal]/tabs:scroll-fade-x')).toBe(
    true,
  );
});

test('forwards ref to the underlying tabs root element', async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Tabs ref={ref} defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
    </Tabs>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe('tabs');
});
