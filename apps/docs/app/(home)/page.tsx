import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleCheck,
  FileCheck2,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { Icon } from "@vegastack/design/icons";
import { HomeHeroParticles } from "@/components/home-hero-particles";
import { HomeProofStatement } from "@/components/home-proof-statement";
import { HomeSystemTrace } from "@/components/home-system-trace";
import { Button } from "@/components/ui/button";
import { MarketingSurface } from "@/components/ui/marketing-surface";
import { SectionHeader } from "@/components/ui/section-header";
import { StaggeredTextReveal } from "@/components/ui/staggered-text-reveal";
import { Terminal } from "@/components/ui/terminal";
import {
  HOME_ANIMATED_ICON_COUNT,
  HOME_BLOCK_COUNT,
  HOME_COMPONENT_COUNT,
  HOME_COMPONENT_GROUPS,
  HOME_HOOK_COUNT,
  HOME_TOTAL_REGISTRY_ITEM_COUNT,
} from "@/lib/home-component-catalog.generated";

const INVENTORY = [
  { value: String(HOME_COMPONENT_COUNT), label: "Production components" },
  {
    value: String(HOME_ANIMATED_ICON_COUNT),
    label: "Animated icon items",
  },
  {
    value: `${HOME_HOOK_COUNT} · ${HOME_BLOCK_COUNT}`,
    label: "Hooks · starter block",
  },
  { value: "WCAG 2.2", label: "AA accessibility target" },
] as const;

const MONOCHROME_BRAND_STYLE = {
  "--brand": "var(--foreground)",
} as CSSProperties;

const FOUNDATION_GROUPS = [
  {
    title: "Color & theming",
    description:
      "Semantic roles resolve independently in light and dark without changing component markup.",
    links: [
      ["Colors", "/docs/foundations/colors"],
      ["Theming", "/docs/foundations/theming"],
      ["Design principles", "/docs/foundations/design-principles"],
    ],
    specimen: (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {[
          ["Background", "bg-background"],
          ["Foreground", "bg-foreground"],
          ["Muted", "bg-muted"],
          ["Action", "bg-primary"],
        ].map(([label, className]) => (
          <div key={label} className="bg-card p-3">
            <span
              className={`block h-14 rounded-md border border-border ${className}`}
            />
            <span className="mt-2 block font-mono text-mono-label text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Typography & icons",
    description:
      "Size establishes hierarchy; mono carries metadata; one icon grammar handles function and motion.",
    links: [
      ["Typography", "/docs/foundations/typography"],
      ["Icons", "/docs/foundations/icons"],
      ["Accessibility", "/docs/foundations/accessibility"],
    ],
    specimen: (
      <div className="flex min-h-40 flex-col justify-center gap-3 rounded-lg border border-border bg-card p-5">
        <p className="text-display-sm text-foreground">Product hierarchy</p>
        <p className="text-h3 text-foreground">Clear at every density</p>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Body copy stays readable while labels and metadata remain compact.
        </p>
        <p className="font-mono text-mono-label text-muted-foreground">
          --text-h3 · --icon-default
        </p>
      </div>
    ),
  },
  {
    title: "Space, shape & elevation",
    description:
      "A 4px spacing foundation, restrained radii, and two named shadows keep surfaces coherent.",
    links: [
      ["Spacing", "/docs/foundations/spacing"],
      ["Radius", "/docs/foundations/radius"],
      ["Elevation", "/docs/foundations/elevation"],
    ],
    specimen: (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-border bg-muted/(--alpha-wash-faint) p-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-overlay">
          <div className="h-3 w-2/5 rounded-sm bg-foreground" />
          <div className="mt-4 h-2 w-full rounded-sm bg-muted" />
          <div className="mt-2 h-2 w-4/5 rounded-sm bg-muted" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <span className="h-(--size-lg) rounded-md border border-border bg-background" />
            <span className="h-(--size-lg) rounded-md border border-border bg-background" />
            <span className="h-(--size-lg) rounded-md border border-border bg-background" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Motion & interaction",
    description:
      "Quiet motion, visible focus, predictable empty states, and documented interaction patterns.",
    links: [
      ["Motion", "/docs/foundations/motion"],
      ["Interaction patterns", "/docs/foundations/interaction-patterns"],
      ["Empty states", "/docs/foundations/empty-states"],
    ],
    specimen: (
      <div className="flex min-h-40 flex-col justify-center gap-4 rounded-lg border border-border bg-card p-5">
        {[
          ["Fast response", "--duration-fast · 150ms", "w-1/3"],
          ["Standard movement", "--duration-base · 200ms", "w-2/3"],
          ["Emphasized change", "--duration-slow · 300ms", "w-full"],
        ].map(([label, token, width]) => (
          <div key={label} className="grid grid-cols-2 items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{label}</p>
              <p className="truncate font-mono text-mono-label text-muted-foreground">
                {token}
              </p>
            </div>
            <div className="h-1 rounded-full bg-muted">
              <span
                className={`block h-1 rounded-full bg-foreground ${width}`}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
] as const satisfies ReadonlyArray<{
  title: string;
  description: string;
  links: ReadonlyArray<readonly [string, string]>;
  specimen: ReactNode;
}>;

const QUALITY_EVIDENCE = [
  [
    "Canonical source",
    "One owned implementation drives the docs copy and registry payload.",
  ],
  [
    "Behavior & accessibility",
    "Browser tests cover semantics, keyboard behavior, focus, and axe assertions.",
  ],
  [
    "Documentation",
    "Live previews, variants, API, accessibility, and usage guidance stay reviewable in MDX.",
  ],
  [
    "Distribution",
    "Whole-item hashes, a signed manifest, and fail-closed verification protect copy-in source.",
  ],
  [
    "Visual release gate",
    "Light, dark, desktop, and mobile lanes are required before deployment.",
  ],
] as const;

const SYSTEM_PROMISE =
  "The same design decision should survive every interface.";

export default function HomePage() {
  return (
    <div
      className="flex flex-1 flex-col bg-background text-foreground"
      style={MONOCHROME_BRAND_STYLE}
    >
      <section className="relative isolate overflow-hidden border-b border-border px-6">
        <HomeHeroParticles seed={7} count={28} />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center py-24 text-center sm:py-32 lg:py-36">
          <div className="flex w-full flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-5">
              <p className="font-mono text-mono-label text-muted-foreground">
                Maintained by VegaStack team
              </p>
              <h1 className="max-w-5xl text-balance text-display-lg text-foreground sm:text-display-xl">
                <StaggeredTextReveal text="VegaStack Design System" />
              </h1>
              <p className="max-w-2xl text-pretty text-xl leading-relaxed text-muted-foreground">
                A production UI foundation for VegaStack: shared tokens,
                accessible components, reusable patterns, and implementation
                guidance for humans and AI agents.
              </p>
            </div>
            <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                render={<Link href="/docs" />}
              >
                Explore the system
                <Icon as={ArrowRight} size="sm" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                render={<Link href="#system-trace" />}
              >
                See how it works
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["Tailwind v4", "Base UI", "React 19"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Icon as={CircleCheck} size="sm" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Design system inventory" className="px-6">
        <div className="mx-auto grid max-w-6xl border-s border-border sm:grid-cols-2 lg:grid-cols-4">
          {INVENTORY.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 border-e border-b border-border px-6 py-7"
            >
              <span className="text-h2 tabular-nums text-foreground">
                {item.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <MarketingSurface
        render={<section />}
        id="system-promise"
        className="overflow-hidden border-b border-border px-6 py-24 sm:py-32 lg:py-36"
        aria-labelledby="system-promise-title"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          <p className="font-mono text-mono-label text-muted-foreground">
            One system contract
          </p>
          <HomeProofStatement id="system-promise-title" text={SYSTEM_PROMISE} />
          <div className="grid gap-8 border-t border-border pt-8 lg:grid-cols-3 lg:items-start">
            <p className="max-w-3xl text-pretty text-xl leading-relaxed text-muted-foreground lg:col-span-2">
              Tokens establish the rule. Components own the behavior. Patterns
              prove the result. Documentation and agent skills keep that
              contract intact from design intent to production source.
            </p>
            <div className="grid gap-3 text-label">
              {[
                ["Inspect the system trace", "#system-trace"],
                ["Browse the component catalog", "#component-catalog"],
                ["Read the implementation guide", "/docs/guides/quickstart"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-h-(--size-sm) items-center justify-between gap-4 border-b border-border text-foreground"
                >
                  {label}
                  <span className="inline-flex shrink-0 transition-transform duration-fast ease-standard group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none">
                    <Icon
                      as={ArrowRight}
                      size="sm"
                      className="text-muted-foreground group-hover:text-foreground"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </MarketingSurface>

      <section
        id="system-trace"
        className="scroll-mt-20 px-6 py-24 sm:py-32"
        aria-label="System trace"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <SectionHeader
              eyebrow="01 / System trace"
              title="Follow one decision from token to product."
              size="lg"
              className="max-w-3xl"
            />
            <p className="max-w-2xl text-pretty text-xl leading-relaxed text-muted-foreground lg:justify-self-end">
              Select a component and inspect the same decision across semantic
              foundations, owned behavior, and a recognizable product pattern.
            </p>
          </div>
          <HomeSystemTrace />
        </div>
      </section>

      <section
        id="foundations"
        className="scroll-mt-20 border-y border-border bg-muted/(--alpha-wash-faint) px-6 py-24 sm:py-32"
        aria-label="Design foundations"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <SectionHeader
              eyebrow="02 / Foundations"
              title="The rules are visible, not implied."
              size="lg"
              className="max-w-3xl"
            />
            <div className="flex max-w-2xl flex-col items-start gap-6 lg:justify-self-end">
              <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                Every foundation resolves to a token or documented behavior.
                Theme the values once; component markup remains stable.
              </p>
              <Button
                variant="outline"
                render={<Link href="/docs/foundations/design-principles" />}
              >
                Read the principles
                <Icon as={ArrowRight} size="sm" />
              </Button>
            </div>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {FOUNDATION_GROUPS.map((foundation) => (
              <article
                key={foundation.title}
                className="grid min-w-0 lg:grid-cols-5"
              >
                <div className="flex min-w-0 flex-col gap-5 py-8 sm:py-10 lg:col-span-2 lg:pe-10">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-h2 text-foreground">
                      {foundation.title}
                    </h3>
                    <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                      {foundation.description}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2">
                    {foundation.links.map(([label, href]) => (
                      <Link
                        key={href}
                        href={href}
                        className="text-label text-foreground underline-offset-4 hover:underline"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 border-t border-border py-8 sm:py-10 lg:col-span-3 lg:border-t-0 lg:border-s lg:ps-10">
                  {foundation.specimen}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="component-catalog"
        className="scroll-mt-20 border-b border-border px-6 py-24 sm:py-32"
        aria-label="Component catalog"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-14">
          <SectionHeader
            eyebrow="03 / Component catalog"
            title={`${HOME_COMPONENT_COUNT} components, organized by responsibility.`}
            description="Browse the complete production catalog by responsibility. Every title links to its documentation and stays synchronized with the verified component contract."
            size="md"
            className="max-w-3xl sm:[&_[data-slot=section-header-title]]:text-display-lg"
          />
          <div className="divide-y divide-border border-y border-border">
            {HOME_COMPONENT_GROUPS.map((group) => (
              <article
                key={group.title}
                className="grid min-w-0 gap-6 py-8 sm:py-10 lg:grid-cols-3 lg:gap-12"
              >
                <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
                  <div className="flex items-baseline justify-between gap-6 lg:flex-col lg:items-start lg:gap-2">
                    <h3 className="text-h3 text-foreground">{group.title}</h3>
                    <p className="shrink-0 font-mono text-mono-label text-muted-foreground">
                      {group.components.length} components
                    </p>
                  </div>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <div className="min-w-0 border-t border-border pt-5 lg:col-span-2 lg:border-t-0 lg:pt-0">
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 xl:grid-cols-4">
                    {group.components.map((component) => (
                      <li key={component.name} className="min-w-0">
                        <Link
                          href={component.href}
                          className="flex min-h-(--size-xs) min-w-0 items-center py-1 text-sm leading-snug text-foreground underline-offset-4 hover:underline"
                        >
                          {component.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="get-started"
        className="scroll-mt-20 bg-muted/(--alpha-wash-faint) px-6 py-24 sm:py-32"
        aria-label="Get started"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-14">
          <SectionHeader
            eyebrow="04 / Get started"
            title="Start with the system. Bring your agent."
            description="Choose the path you need. Every command is copied independently, and every access boundary is stated before you run it."
            size="lg"
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="divide-y divide-border border-y border-border">
            <article className="grid min-w-0 gap-6 py-8 sm:py-10 lg:grid-cols-4 lg:items-start lg:gap-10">
              <span className="font-mono text-mono-label text-muted-foreground">
                01 / Public runtime
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <h3 className="text-h2 text-foreground">
                  Install the foundation
                </h3>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  Add the runtime, preset, icons, and CLI. Design tokens arrive
                  as a dependency—one package is the supported quickstart.
                </p>
              </div>
              <Terminal
                title="Runtime"
                className="min-w-0 lg:col-span-2"
                style={MONOCHROME_BRAND_STYLE}
                lines={["pnpm add @vegastack/design"]}
              />
            </article>

            <article className="grid min-w-0 gap-6 py-8 sm:py-10 lg:grid-cols-4 lg:items-start lg:gap-10">
              <span className="font-mono text-mono-label text-muted-foreground">
                02 / Agent skill
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <h3 className="text-h2 text-foreground">
                  Teach your agent the system
                </h3>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  Install the packaged skill bundle for component choice,
                  tokens, composition, audits, and registry consumption. No
                  GitHub repository access is required.
                </p>
              </div>
              <Terminal
                title="Agent skill"
                className="min-w-0 lg:col-span-2"
                style={MONOCHROME_BRAND_STYLE}
                lines={["npx vegastack-design skills install"]}
              />
            </article>

            <article className="grid min-w-0 gap-6 py-8 sm:py-10 lg:grid-cols-4 lg:items-start lg:gap-10">
              <span className="font-mono text-mono-label text-muted-foreground">
                03 / Owned components
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <h3 className="text-h2 text-foreground">
                  Copy in production source
                </h3>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  Add the provider first, then the components your product
                  needs. This path requires configured registry credentials.
                </p>
              </div>
              <Terminal
                title="Authenticated registry"
                className="min-w-0 lg:col-span-2"
                style={MONOCHROME_BRAND_STYLE}
                lines={["pnpm dlx shadcn@latest add @vegastack/provider"]}
              />
            </article>
          </div>

          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/docs/guides/quickstart" />}>
              Open the quickstart
              <Icon as={ArrowRight} size="sm" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/docs/guides/registry-auth" />}
            >
              Configure registry access
            </Button>
          </div>
        </div>
      </section>

      <section
        id="evidence"
        className="scroll-mt-20 border-y border-border px-6 py-24 sm:py-32"
        aria-label="Quality evidence"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeader
              eyebrow="05 / Evidence"
              title="A release is a chain of evidence."
              description="The system does not treat a styled file as a finished component. Source, behavior, documentation, distribution, and visual review must agree."
              size="lg"
            />
          </div>
          <ol className="border-t border-border">
            {QUALITY_EVIDENCE.map(([title, description]) => (
              <li
                key={title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-b border-border py-6"
              >
                <span className="flex size-(--size-sm) items-center justify-center rounded-full border border-border bg-background">
                  <Icon as={Check} size="xs" />
                </span>
                <div className="min-w-0">
                  <p className="text-label text-foreground">{title}</p>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl border-s border-t border-border sm:grid-cols-3">
          {(
            [
              [
                FileCheck2,
                `${HOME_COMPONENT_COUNT} / ${HOME_COMPONENT_COUNT}`,
                "Component contracts reconciled",
              ],
              [
                PackageCheck,
                HOME_TOTAL_REGISTRY_ITEM_COUNT,
                "Registry items in the verified inventory",
              ],
              [
                ShieldCheck,
                "SHA-256",
                "Whole-item integrity with signed manifest",
              ],
              // `as const` keeps each row a TUPLE. Without it TypeScript widens the rows to
              // `(LucideIcon | string)[]`, so `icon` infers as `LucideIcon | string` and fails
              // `Icon`'s `as` prop.
            ] as const
          ).map(([icon, value, label]) => (
            <div
              key={label}
              className="flex items-start gap-4 border-e border-b border-border p-5"
            >
              <Icon
                as={icon}
                size="sm"
                className="mt-1 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="text-h3 tabular-nums text-foreground">
                  {String(value)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {String(label)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MarketingSurface
        render={<section />}
        id="build-with-vegastack"
        className="px-6 py-24 sm:py-32"
        aria-labelledby="closing-title"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex max-w-4xl flex-col items-start gap-5">
            <p className="font-mono text-mono-label text-muted-foreground">
              Ready to build
            </p>
            <h2
              id="closing-title"
              className="text-balance text-display-lg text-foreground sm:text-display-xl"
            >
              Build with the VegaStack Design System.
            </h2>
            <p className="max-w-2xl text-pretty text-xl leading-relaxed text-muted-foreground">
              Install the foundation, follow the implementation guide, and start
              composing production-ready interfaces.
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              render={<Link href="/docs/guides/quickstart" />}
            >
              Read the quickstart
              <Icon as={ArrowRight} size="sm" />
            </Button>
          </div>
        </div>
      </MarketingSurface>
    </div>
  );
}
