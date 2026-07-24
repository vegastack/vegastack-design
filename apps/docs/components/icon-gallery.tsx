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
 * PERF (measured, unresolved): this is registered in the GLOBAL MDX component map, so the 439
 * motion client components behind `AnimatedIconWall` reach the client graph of EVERY docs route —
 * `/docs/components/button` ships ~2.27 MB of icon-wall JS for a wall it never renders.
 *
 * A dynamic `import()` of the wall was tried and rejected: it isolates the icons into their own
 * 921 KB chunk, but button.html still fetches that chunk and its total script payload is unchanged
 * at 3873 KB — because the catch-all `app/docs/[[...slug]]` route has a single client-reference
 * manifest shared by every docs page. A real fix needs either a dedicated route segment for
 * `/docs/foundations/icons` or a server-rendered (non-client) icon wall, so it is left as an
 * explicit decision rather than a half-measure.
 */
export function IconGallery() {
  return (
    <div className="not-prose my-6 space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-fd-foreground">
          Functional — `Icon` (lucide)
        </p>
        <div className="flex flex-wrap gap-4">
          {FUNCTIONAL.map(({ as, label }) => (
            <div
              key={label}
              className="flex w-20 flex-col items-center gap-2 rounded-lg border border-fd-border bg-fd-card p-3 text-fd-foreground"
            >
              <Icon as={as} size="lg" aria-label={label} />
              <span className="text-xs leading-4 text-fd-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-fd-foreground">
          Brand — `BrandIcon` (thesvg)
        </p>
        <div className="flex flex-wrap gap-4">
          {BRANDS.map((icon) => (
            <div
              key={icon.slug}
              className="flex w-20 flex-col items-center gap-2 rounded-lg border border-fd-border bg-fd-card p-3"
            >
              <BrandIcon icon={icon} variant="auto" size="lg" />
              <span className="text-xs leading-4 text-fd-muted-foreground">
                {icon.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-fd-foreground">
          Motion — `AnimatedIcon` (lucide-animated) · hover or focus the card to
          animate
        </p>
        <div className="space-y-6">
          {ANIMATED_ICON_CHUNKS.map((chunk, chunkIndex) => (
            <section
              key={chunkIndex}
              data-vrt-icon-chunk={chunkIndex}
              aria-label={`Animated icons ${chunkIndex * ANIMATED_ICON_CHUNK_SIZE + 1}–${chunkIndex * ANIMATED_ICON_CHUNK_SIZE + chunk.length}`}
              className="rounded-lg border border-fd-border p-3"
            >
              <p className="mb-3 text-sm text-fd-muted-foreground">
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
                    className="flex w-20 cursor-default flex-col items-center gap-2 rounded-lg border border-fd-border bg-fd-card p-3 text-fd-foreground hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fd-ring"
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
