import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// FigureFrame is a marketing-tier component — demo it on the brand's dark ground
// (MarketingSurface), matching the logo-row / testimonial previews.
import { MarketingSurface } from '@/components/ui/marketing-surface';
import { FigureFrame } from '@/components/ui/figure-frame';

export function figureFrame(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <div className="mx-auto w-full max-w-md">
          <FigureFrame figureNumber="01" caption="Component registry — live preview">
            <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              16:9 media
            </div>
          </FigureFrame>
        </div>
      </MarketingSurface>
    </Wrapper>
  );
}

export function figureFrameAspectRatio(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="flex w-full flex-col items-start gap-6 rounded-lg p-8">
        <div className="w-56">
          <FigureFrame aspectRatio="1/1" caption="Square" figureNumber="A">
            <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              1:1
            </div>
          </FigureFrame>
        </div>
        <div className="w-56">
          <FigureFrame aspectRatio="4/3" caption="Standard" figureNumber="B">
            <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              4:3
            </div>
          </FigureFrame>
        </div>
      </MarketingSurface>
    </Wrapper>
  );
}

export function figureFrameNoCaption(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <div className="mx-auto w-full max-w-md">
          <FigureFrame>
            <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              No caption
            </div>
          </FigureFrame>
        </div>
      </MarketingSurface>
    </Wrapper>
  );
}
