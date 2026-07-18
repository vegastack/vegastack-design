import { Icon, BrandIcon, AnimatedIcon } from '@vegastack/design/icons';
import { Check, Search, Settings, Bell, Heart, Star, Trash2, Download } from 'lucide-react';
import github from 'thesvg/github';
import slack from 'thesvg/slack';
import figma from 'thesvg/figma';
import { ActivityIcon } from '@/components/ui/icons/activity';
import { BellIcon } from '@/components/ui/icons/bell';
import { DownloadIcon } from '@/components/ui/icons/download';
import { HeartIcon } from '@/components/ui/icons/heart';
import { LoaderIcon } from '@/components/ui/icons/loader';
import { SearchIcon } from '@/components/ui/icons/search';
import { SparklesIcon } from '@/components/ui/icons/sparkles';
import { RocketIcon } from '@/components/ui/icons/rocket';

const FUNCTIONAL = [
  { as: Check, label: 'Check' },
  { as: Search, label: 'Search' },
  { as: Settings, label: 'Settings' },
  { as: Bell, label: 'Bell' },
  { as: Heart, label: 'Heart' },
  { as: Star, label: 'Star' },
  { as: Trash2, label: 'Trash' },
  { as: Download, label: 'Download' },
] as const;

const BRANDS = [github, slack, figma];

const ANIMATED = [
  { as: ActivityIcon, label: 'Activity' },
  { as: BellIcon, label: 'Bell' },
  { as: DownloadIcon, label: 'Download' },
  { as: HeartIcon, label: 'Heart' },
  { as: LoaderIcon, label: 'Loader' },
  { as: SearchIcon, label: 'Search' },
  { as: SparklesIcon, label: 'Sparkles' },
  { as: RocketIcon, label: 'Rocket' },
] as const;

/** Live gallery — renders `Icon` (lucide) + `BrandIcon` (thesvg) from `@vegastack/design/icons`. */
export function IconGallery() {
  return (
    <div className="not-prose my-6 space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-fd-foreground">Functional — `Icon` (lucide)</p>
        <div className="flex flex-wrap gap-4">
          {FUNCTIONAL.map(({ as, label }) => (
            <div
              key={label}
              className="flex w-20 flex-col items-center gap-2 rounded-lg border border-fd-border bg-fd-card p-3 text-fd-foreground"
            >
              <Icon as={as} size="lg" aria-label={label} />
              <span className="text-[11px] text-fd-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-fd-foreground">Brand — `BrandIcon` (thesvg)</p>
        <div className="flex flex-wrap gap-4">
          {BRANDS.map((icon) => (
            <div
              key={icon.slug}
              className="flex w-20 flex-col items-center gap-2 rounded-lg border border-fd-border bg-fd-card p-3"
            >
              <BrandIcon icon={icon} size="lg" />
              <span className="text-[11px] text-fd-muted-foreground">{icon.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-fd-foreground">
          Motion — `AnimatedIcon` (lucide-animated) · hover to animate
        </p>
        <div className="flex flex-wrap gap-4">
          {ANIMATED.map(({ as, label }) => (
            <div
              key={label}
              className="flex w-20 flex-col items-center gap-2 rounded-lg border border-fd-border bg-fd-card p-3 text-fd-foreground"
            >
              <AnimatedIcon as={as} size="lg" aria-label={label} />
              <span className="text-[11px] text-fd-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
