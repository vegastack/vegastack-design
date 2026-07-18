import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { GeistPixelSquare } from 'geist/font/pixel';
import { cn } from '@/lib/cn';
import { MarketingSurface } from '@/components/ui/marketing-surface';
import { SectionHeader } from '@/components/ui/section-header';
import { StaggeredTextReveal } from '@/components/ui/staggered-text-reveal';
import { FigureFrame } from '@/components/ui/figure-frame';
import { LogoRow } from '@/components/ui/logo-row';
import { Testimonial } from '@/components/ui/testimonial';
import { Terminal } from '@/components/ui/terminal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HomeHeroParticles } from '@/components/home-hero-particles';

// Fictional, generic wordmarks ONLY — never a real company's name/logo without clearance
// (see LogoRow's component note).
const LOGO_ROW_ITEMS = [
  { name: 'ACME' },
  { name: 'NIMBUS' },
  { name: 'COREBASE' },
  { name: 'LATTICE' },
  { name: 'OUTPOST' },
];

export default function HomePage() {
  return (
    // The docs-home IS the marketing surface (STEP 1/3, audit 17-brand-direction, CX-10): one
    // outer `MarketingSurface` renders the whole page on the brand's dark warm ground,
    // independent of the product `.dark` class — the rest of `/docs` stays the light-primary
    // product surface. That single boundary at the home → docs nav transition is the deliberate
    // "cross-temperature bridge" the audit calls out (dark marketing → light product).
    <MarketingSurface render={<main />} className="flex flex-1 flex-col">
      {/* ── Hero ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden px-6 py-24 sm:py-32">
        <HomeHeroParticles seed={7} count={56} />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          {/*
           * THE single sanctioned Geist Pixel hero flourish (D17/T6): one deliberate decorative
           * glyph, once per surface, never a headline/body face. Do not add a second use anywhere
           * on this page (or reuse the pattern elsewhere) without re-opening that decision.
           */}
          <span
            aria-hidden="true"
            className={cn('text-2xl text-brand', GeistPixelSquare.className)}
          >
            ▪
          </span>
          <SectionHeader
            align="center"
            size="xl"
            eyebrow="VegaStack Design"
            title={
              <>
                <StaggeredTextReveal text="Ship agentic UI," />{' '}
                <em className="font-serif italic">fast</em>.
              </>
            }
            description="An internal design system built on Base UI + Tailwind v4 — tokens, components, a live showcase, and a private registry, consumable by humans and AI agents alike."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/*
             * `render` composes Button's variant styling onto a real `next/link` anchor — the
             * sanctioned pattern for a navigation CTA (per Button's own JSDoc: style an anchor
             * with `buttonVariants`/`render` for URL navigation, don't treat Button itself as a
             * link). Using `render` (not calling `buttonVariants()` directly) also keeps this a
             * Server Component: `buttonVariants` is exported from button.tsx's `'use client'`
             * module, so calling it as a plain function from server code crosses the RSC
             * boundary illegally — rendering `Button` as JSX does not.
             */}
            <Button
              variant="cta"
              size="lg"
              nativeButton={false}
              render={<Link href="/docs/foundations/colors" />}
            >
              Explore foundations
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/docs/components/button" />}
            >
              Browse components
            </Button>
          </div>
        </div>
      </section>

      {/* ── Logo row ──────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <LogoRow label="Built with" items={LOGO_ROW_ITEMS} />
        </div>
      </section>

      {/* ── Platform ──────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            eyebrow="Platform"
            title="One system, every surface."
            description="Tokens, primitives, and a private registry — the same source of truth for product UI and marketing pages alike."
          />
        </div>
      </section>

      {/* ── Install ───────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <SectionHeader eyebrow="Get started" title="One command." size="sm" />
          <Terminal
            title="Install"
            lines={[
              'pnpm dlx shadcn@latest add @vegastack/button',
              { output: '✓ Installed 1 component' },
            ]}
          />
        </div>
      </section>

      {/* ── Live preview ──────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <SectionHeader eyebrow="Preview" title="Every component, live." size="sm" />
          <FigureFrame figureNumber="01" caption="Button — every semantic variant, composed live">
            <div className="flex size-full flex-wrap items-center justify-center gap-3 bg-card p-8">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Badge intent="success" dot>
                Active
              </Badge>
            </div>
          </FigureFrame>
        </div>
      </section>

      {/* ── Testimonial ───────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <Testimonial
            quote="One registry, tokens everywhere — our marketing site and product finally read as one brand."
            name="A. Rivera"
            role="Design Systems, VegaStack"
          />
        </div>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <SectionHeader align="center" size="md" eyebrow="Ready" title="Start building today." />
          <Button
            variant="cta"
            size="lg"
            nativeButton={false}
            render={<Link href="/docs/foundations/colors" />}
          >
            Get started
            <ChevronRight />
          </Button>
        </div>
      </section>
    </MarketingSurface>
  );
}
