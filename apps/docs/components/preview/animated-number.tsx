'use client';

import { useState, type ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/animated-number` (dogfoods the registry) → auto-scanned.
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Basic count-up: a plain integer stat that tweens up on each click. The resting render (no
// interaction) is fully deterministic — a fixed starting count, no Math.random — so VRT screenshots
// the same static digits every run.
export function animatedNumber(): ReactNode {
  const [count, setCount] = useState(128);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Card className="w-full max-w-xs">
        <CardHeader>
          <CardDescription>Total signups</CardDescription>
          <CardTitle className="text-3xl">
            <AnimatedNumber value={count} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => setCount((c) => c + 37)}>
            Simulate signups
          </Button>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

// Currency format — `format` intermediate frames animate through the SAME
// `Intl.NumberFormat({ style: 'currency' })` used for the settled value, so the $ symbol and cent
// grouping stay correct throughout the tween, not just at rest.
export function animatedNumberCurrency(): ReactNode {
  const [revenue, setRevenue] = useState(48250);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Card className="w-full max-w-xs">
        <CardHeader>
          <CardDescription>Revenue this month</CardDescription>
          <CardTitle className="text-3xl">
            <AnimatedNumber value={revenue} format={{ style: 'currency', currency: 'USD' }} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => setRevenue((v) => v + 1250)}>
            Record a sale
          </Button>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

// Compact notation — "12.4K" style. Repeated clicks stack, letting the tween cross a notation
// boundary (e.g. 900 -> 1.2K) to show the formatter re-deriving the compact suffix mid-count.
export function animatedNumberCompact(): ReactNode {
  const [followers, setFollowers] = useState(12400);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Card className="w-full max-w-xs">
        <CardHeader>
          <CardDescription>Followers</CardDescription>
          <CardTitle className="text-3xl">
            <AnimatedNumber value={followers} format={{ notation: 'compact', maximumFractionDigits: 1 }} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => setFollowers((v) => v + 2100)}>
            +2.1K followers
          </Button>
        </CardContent>
      </Card>
    </Wrapper>
  );
}
