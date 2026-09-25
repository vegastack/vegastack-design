// @vegastack settings-02@0.23.25 sha256-+4eq9YubV+LKrpsWqQe9V+sHo5SFOAuY/0oMJLqI73s=

import { ChevronRight } from "lucide-react";

import { AppShellPage } from "@/components/ui/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsSection } from "@/components/ui/settings-row";

interface SettingsTile {
  id: string;
  title: string;
  /** One fact about the area, e.g. "8 active · 1 invited". */
  fact: string;
  /** Where the tile goes. Leave it out for an area that is not built yet. */
  href?: string;
}

interface SettingsArea {
  id: string;
  title: string;
  description: string;
  tiles: SettingsTile[];
}

const AREAS: SettingsArea[] = [
  {
    id: "account",
    title: "Your account",
    description: "What only you see and change.",
    tiles: [
      {
        id: "profile",
        title: "Profile",
        fact: "Name, photo and sign-in email",
        href: "/settings/profile",
      },
      {
        id: "notifications",
        title: "Notifications",
        fact: "Email on · push off",
        href: "/settings/notifications",
      },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Shared by everyone in Acme.",
    tiles: [
      {
        id: "members",
        title: "Members",
        fact: "8 active · 1 invited",
        href: "/settings/members",
      },
      {
        id: "roles",
        title: "Roles",
        fact: "4 roles",
        href: "/settings/roles",
      },
      {
        id: "billing",
        title: "Billing",
        fact: "Team plan · renews 1 Oct",
        href: "/settings/billing",
      },
    ],
  },
  {
    id: "catalogue",
    title: "Product configuration",
    description: "The lists and fields your catalogue is built from.",
    tiles: [
      {
        id: "families",
        title: "Families",
        fact: "12 families",
        href: "/settings/families",
      },
      {
        id: "attributes",
        title: "Attributes",
        fact: "46 attributes · 9 picklists",
        href: "/settings/attributes",
      },
      { id: "integrations", title: "Integrations", fact: "Not built yet" },
    ],
  },
];

/**
 * One settings area: a whole-tile link named by its title and described by its one fact, with a
 * decorative chevron. An area with no `href` is not built yet — it renders as a plain tile with a
 * "TBD" badge, so it is not a tab stop and never pretends to be a link.
 */
function SettingsTileItem({ tile }: { tile: SettingsTile }) {
  const titleId = `settings-02-${tile.id}-title`;
  const factId = `settings-02-${tile.id}-fact`;
  const content = (
    <ItemContent>
      <ItemTitle id={titleId}>{tile.title}</ItemTitle>
      <ItemDescription id={factId} className="tabular-nums">
        {tile.fact}
      </ItemDescription>
    </ItemContent>
  );

  if (!tile.href) {
    return (
      <Item variant="outline">
        {content}
        <ItemActions>
          <Badge variant="outline">TBD</Badge>
        </ItemActions>
      </Item>
    );
  }

  return (
    <Item
      variant="outline"
      render={
        <a
          href={tile.href}
          aria-labelledby={titleId}
          aria-describedby={factId}
        />
      }
    >
      {content}
      <ItemActions>
        <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
      </ItemActions>
    </Item>
  );
}

/**
 * `settings-02` — the settings hub: a `PageHeader` h1 over one `SettingsSection` per area, each a
 * container-query grid of whole-tile links (`Item variant="outline"` rendered as an `<a>`). A tile
 * carries one fact about its area, not a menu of actions, so there is never a button inside a link.
 *
 * Server-safe. Replace `AREAS` with your own areas and each `href` with your routes; an area with no
 * `href` shows a "TBD" badge until it exists.
 *
 * @example
 * // app/settings/page.tsx, straight after `shadcn add @vegastack/settings-02`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <AppShellPage>
      <PageHeader
        title="Settings"
        description="Your account, your workspace and how your catalogue is set up."
      />
      <div className="@container flex flex-col gap-8">
        {AREAS.map((area) => (
          <SettingsSection
            key={area.id}
            titleAs="h2"
            title={area.title}
            description={area.description}
          >
            <ItemGroup
              aria-label={area.title}
              className="grid gap-3 @sm:grid-cols-2 @4xl:grid-cols-3"
            >
              {area.tiles.map((tile) => (
                <SettingsTileItem key={tile.id} tile={tile} />
              ))}
            </ItemGroup>
          </SettingsSection>
        ))}
      </div>
    </AppShellPage>
  );
}
