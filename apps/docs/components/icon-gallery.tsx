import { Icon, BrandIcon } from "@vegastack/design/icons";
import { AnimatedIconCard } from "@/components/animated-icon-card";
import {
  ANIMATED_ICON_CHUNKS,
  ANIMATED_ICON_CHUNK_SIZE,
} from "@/components/animated-icon-gallery.generated";
import {
  Check,
  Search,
  Settings,
  Bell,
  Heart,
  Star,
  Trash2,
  Download,
} from "lucide-react";
import github from "thesvg/github";
import slack from "thesvg/slack";
import figma from "thesvg/figma";

const FUNCTIONAL = [
  { as: Check, label: "Check" },
  { as: Search, label: "Search" },
  { as: Settings, label: "Settings" },
  { as: Bell, label: "Bell" },
  { as: Heart, label: "Heart" },
  { as: Star, label: "Star" },
  { as: Trash2, label: "Trash" },
  { as: Download, label: "Download" },
] as const;

const BRANDS = [github, slack, figma];

/**
 * Live gallery — renders `Icon` (lucide) + `BrandIcon` (thesvg) from `@vegastack/design/icons`.
 *
 * PERF: this component is imported ONLY by `/docs/foundations/icons/gallery`, a dedicated App
 * Router segment. It must not enter the global MDX component map: doing so puts every generated
 * client components back into every catch-all docs route's client graph. The public export gate
 * finds this wall by its `data-icon-chunk` sentinel and proves no ordinary docs HTML references
 * the chunk.
 */
export function IconGallery() {
  return (
    <div className="not-prose my-6 space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Functional — `Icon` (lucide)
        </p>
        <div className="flex flex-wrap gap-4">
          {FUNCTIONAL.map(({ as, label }) => (
            <div
              key={label}
              className="flex w-20 flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-foreground"
            >
              <Icon as={as} size="lg" aria-label={label} />
              <span className="text-xs leading-4 text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Brand — `BrandIcon` (thesvg)
        </p>
        <div className="flex flex-wrap gap-4">
          {BRANDS.map((icon) => (
            <div
              key={icon.slug}
              className="flex w-20 flex-col items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <BrandIcon icon={icon} variant="auto" size="lg" />
              <span className="text-xs leading-4 text-muted-foreground">
                {icon.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Motion — `AnimatedIcon` (lucide-animated) · hover or focus the card to
          animate
        </p>
        <div className="space-y-6">
          {ANIMATED_ICON_CHUNKS.map((chunk, chunkIndex) => (
            <section
              key={chunkIndex}
              data-icon-chunk={chunkIndex}
              aria-label={`Animated icons ${chunkIndex * ANIMATED_ICON_CHUNK_SIZE + 1}–${chunkIndex * ANIMATED_ICON_CHUNK_SIZE + chunk.length}`}
              className="rounded-lg border border-border p-3"
            >
              <p className="mb-3 text-sm text-muted-foreground">
                Icons {chunkIndex * ANIMATED_ICON_CHUNK_SIZE + 1}–
                {chunkIndex * ANIMATED_ICON_CHUNK_SIZE + chunk.length}
              </p>
              <div className="flex flex-wrap gap-3">
                {chunk.map(({ as, label }) => (
                  // The whole CARD drives the motion (hover or keyboard focus), not just
                  // the glyph — see AnimatedIconCard for why the wiring lives there.
                  <AnimatedIconCard
                    key={label}
                    as={as}
                    label={label}
                    // A real button: the global `:focus-visible` outline applies, no hand-typed
                    // ring (DC-09/DC-12).
                    className="flex w-20 flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-foreground hover:bg-accent active:bg-surface-3"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
