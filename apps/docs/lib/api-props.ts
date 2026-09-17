/**
 * Named prop types for the components the shadcn reset has put back on upstream's source.
 *
 * WHY THIS FILE EXISTS
 *   `<ApiTable>` (and the markdown export behind it) generates its rows from an EXPORTED TYPE in a
 *   source file — `generateTypeTable` returns nothing for a bare function component. Upstream's
 *   files export the component and its `cva` builder and no props type at all, and the reset's
 *   first non-negotiable forbids adding one "in passing": a hand-added `export type ButtonProps`
 *   would be a patch hunk with no decision ID behind it, which `verify-parity.mjs` refuses.
 *
 *   So the NAME lives here and the TYPE still comes from the component. Each alias is
 *   `React.ComponentProps<typeof Part>`, so it tracks the source exactly — rename a prop upstream
 *   and the table changes with it — while `lib/api-table.ts`'s own-prop filter keeps the rows to
 *   what the component itself declares (inherited DOM / Base UI props stay out, as everywhere
 *   else). Nothing is restated; there is nothing here to go stale.
 *
 *   Components that are OURS keep exporting their own props type and are documented straight from
 *   their source, exactly as before. This file grows by one import per component Batches 2-6 reset
 *   and is deleted the day upstream exports its own props types.
 */
import type * as React from "react";

import type { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AspectRatio } from "@/components/ui/aspect-ratio";
import type {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Badge } from "@/components/ui/badge";
import type { Button } from "@/components/ui/button";
import type {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";
import type {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import type { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { Label } from "@/components/ui/label";
import type { Separator } from "@/components/ui/separator";
import type { Skeleton } from "@/components/ui/skeleton";
import type { Spinner } from "@/components/ui/spinner";
import type { Toggle } from "@/components/ui/toggle";
import type { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AlertProps = React.ComponentProps<typeof Alert>;
export type AlertTitleProps = React.ComponentProps<typeof AlertTitle>;
export type AlertDescriptionProps = React.ComponentProps<typeof AlertDescription>;
export type AlertActionProps = React.ComponentProps<typeof AlertAction>;

export type AspectRatioProps = React.ComponentProps<typeof AspectRatio>;

export type AvatarProps = React.ComponentProps<typeof Avatar>;
export type AvatarImageProps = React.ComponentProps<typeof AvatarImage>;
export type AvatarFallbackProps = React.ComponentProps<typeof AvatarFallback>;
export type AvatarBadgeProps = React.ComponentProps<typeof AvatarBadge>;
export type AvatarGroupProps = React.ComponentProps<typeof AvatarGroup>;
export type AvatarGroupCountProps = React.ComponentProps<typeof AvatarGroupCount>;

export type BadgeProps = React.ComponentProps<typeof Badge>;

export type ButtonProps = React.ComponentProps<typeof Button>;

export type ButtonGroupProps = React.ComponentProps<typeof ButtonGroup>;
export type ButtonGroupTextProps = React.ComponentProps<typeof ButtonGroupText>;
export type ButtonGroupSeparatorProps = React.ComponentProps<typeof ButtonGroupSeparator>;

export type CardProps = React.ComponentProps<typeof Card>;
export type CardHeaderProps = React.ComponentProps<typeof CardHeader>;
export type CardTitleProps = React.ComponentProps<typeof CardTitle>;
export type CardDescriptionProps = React.ComponentProps<typeof CardDescription>;
export type CardActionProps = React.ComponentProps<typeof CardAction>;
export type CardContentProps = React.ComponentProps<typeof CardContent>;
export type CardFooterProps = React.ComponentProps<typeof CardFooter>;

export type EmptyProps = React.ComponentProps<typeof Empty>;
export type EmptyHeaderProps = React.ComponentProps<typeof EmptyHeader>;
export type EmptyMediaProps = React.ComponentProps<typeof EmptyMedia>;
export type EmptyTitleProps = React.ComponentProps<typeof EmptyTitle>;
export type EmptyDescriptionProps = React.ComponentProps<typeof EmptyDescription>;
export type EmptyContentProps = React.ComponentProps<typeof EmptyContent>;

export type ItemProps = React.ComponentProps<typeof Item>;
export type ItemMediaProps = React.ComponentProps<typeof ItemMedia>;
export type ItemContentProps = React.ComponentProps<typeof ItemContent>;
export type ItemTitleProps = React.ComponentProps<typeof ItemTitle>;
export type ItemDescriptionProps = React.ComponentProps<typeof ItemDescription>;
export type ItemActionsProps = React.ComponentProps<typeof ItemActions>;
export type ItemGroupProps = React.ComponentProps<typeof ItemGroup>;
export type ItemSeparatorProps = React.ComponentProps<typeof ItemSeparator>;
export type ItemHeaderProps = React.ComponentProps<typeof ItemHeader>;
export type ItemFooterProps = React.ComponentProps<typeof ItemFooter>;

export type KbdProps = React.ComponentProps<typeof Kbd>;
export type KbdGroupProps = React.ComponentProps<typeof KbdGroup>;

export type LabelProps = React.ComponentProps<typeof Label>;

export type SeparatorProps = React.ComponentProps<typeof Separator>;

export type SkeletonProps = React.ComponentProps<typeof Skeleton>;

export type SpinnerProps = React.ComponentProps<typeof Spinner>;

export type ToggleProps = React.ComponentProps<typeof Toggle>;

export type ToggleGroupProps = React.ComponentProps<typeof ToggleGroup>;
export type ToggleGroupItemProps = React.ComponentProps<typeof ToggleGroupItem>;

export type TooltipProps = React.ComponentProps<typeof Tooltip>;
export type TooltipProviderProps = React.ComponentProps<typeof TooltipProvider>;
export type TooltipTriggerProps = React.ComponentProps<typeof TooltipTrigger>;
export type TooltipContentProps = React.ComponentProps<typeof TooltipContent>;
