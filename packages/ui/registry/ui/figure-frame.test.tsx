import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { FigureFrame } from './figure-frame';

test('renders a figure with the media children', async () => {
  const screen = await render(
    <FigureFrame>
      <img src="/shot.png" alt="Screenshot" />
    </FigureFrame>
  );
  await expect.element(screen.getByRole('img', { name: 'Screenshot' })).toBeInTheDocument();
  const figure = screen.container.querySelector('[data-slot="figure-frame"]');
  expect(figure?.tagName).toBe('FIGURE');
});

test('omits the caption entirely when not provided', async () => {
  const screen = await render(
    <FigureFrame>
      <div />
    </FigureFrame>,
  );
  expect(screen.container.querySelector('[data-slot="figure-frame-caption"]')).toBeNull();
});

test('renders FIG. {number} before the caption text', async () => {
  const screen = await render(
    <FigureFrame figureNumber="01" caption="Component registry">
      <div />
    </FigureFrame>,
  );
  const caption = screen.container.querySelector('[data-slot="figure-frame-caption"]');
  expect(caption?.textContent).toBe('FIG. 01Component registry');
});

test('renders the caption without a figure number when omitted', async () => {
  const screen = await render(
    <FigureFrame caption="Just a caption">
      <div />
    </FigureFrame>,
  );
  expect(screen.container.querySelector('[data-slot="figure-frame-number"]')).toBeNull();
  await expect.element(screen.getByText('Just a caption')).toBeInTheDocument();
});

test('applies the aspectRatio via a scoped CSS custom property', async () => {
  const screen = await render(
    <FigureFrame aspectRatio="4/3">
      <div />
    </FigureFrame>,
  );
  const media = screen.container.querySelector('[data-slot="figure-frame-media"]') as HTMLElement;
  expect(media.style.getPropertyValue('--figure-frame-ratio')).toBe('4/3');
});

test('forwards ref to the underlying figure element', async () => {
  const ref = React.createRef<HTMLElement>();
  await render(
    <FigureFrame ref={ref}>
      <div />
    </FigureFrame>,
  );
  expect(ref.current?.tagName).toBe('FIGURE');
});

test('no a11y violations', async () => {
  const screen = await render(
    <FigureFrame figureNumber="01" caption="Component registry — live preview">
      <img src="/shot.png" alt="Screenshot" />
    </FigureFrame>,
  );
  await expectNoA11yViolations(screen.container);
});
