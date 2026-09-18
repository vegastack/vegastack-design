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

import type {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import type { AspectRatio } from "@/components/ui/aspect-ratio";
import type {
  AlertDialogCancel,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import type { Command, CommandDialog } from "@/components/ui/command";
import type {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import type {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Drawer, DrawerContent } from "@/components/ui/drawer";
import type {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { HoverCardContent } from "@/components/ui/hover-card";
import type {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarRadioItem,
  MenubarSubTrigger,
} from "@/components/ui/menubar";
import type { PopoverContent } from "@/components/ui/popover";
import type { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Toaster as SonnerToaster } from "@/components/ui/sonner";
import type { Toast, ToastAction, ToastViewport } from "@/components/ui/toast";
import type {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Calendar } from "@/components/ui/calendar";
import type { Checkbox } from "@/components/ui/checkbox";
import type {
  ComboboxChip,
  ComboboxContent,
  ComboboxInput,
} from "@/components/ui/combobox";
import type { DirectionProvider } from "@/components/ui/direction";
import type { Field, FieldError, FieldLegend } from "@/components/ui/field";
import type { Input } from "@/components/ui/input";
import type {
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import type { InputOTP, InputOTPSlot } from "@/components/ui/input-otp";
import type { NativeSelect } from "@/components/ui/native-select";
import type { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SelectContent, SelectTrigger } from "@/components/ui/select";
import type { Slider } from "@/components/ui/slider";
import type { Switch } from "@/components/ui/switch";
import type { Textarea } from "@/components/ui/textarea";

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
import type {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import type {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AlertProps = React.ComponentProps<typeof Alert>;
export type AlertTitleProps = React.ComponentProps<typeof AlertTitle>;
export type AlertDescriptionProps = React.ComponentProps<
  typeof AlertDescription
>;
export type AlertActionProps = React.ComponentProps<typeof AlertAction>;

export type AspectRatioProps = React.ComponentProps<typeof AspectRatio>;

export type AvatarProps = React.ComponentProps<typeof Avatar>;
export type AvatarImageProps = React.ComponentProps<typeof AvatarImage>;
export type AvatarFallbackProps = React.ComponentProps<typeof AvatarFallback>;
export type AvatarBadgeProps = React.ComponentProps<typeof AvatarBadge>;
export type AvatarGroupProps = React.ComponentProps<typeof AvatarGroup>;
export type AvatarGroupCountProps = React.ComponentProps<
  typeof AvatarGroupCount
>;

export type BadgeProps = React.ComponentProps<typeof Badge>;

export type ButtonProps = React.ComponentProps<typeof Button>;

export type ButtonGroupProps = React.ComponentProps<typeof ButtonGroup>;
export type ButtonGroupTextProps = React.ComponentProps<typeof ButtonGroupText>;
export type ButtonGroupSeparatorProps = React.ComponentProps<
  typeof ButtonGroupSeparator
>;

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
export type EmptyDescriptionProps = React.ComponentProps<
  typeof EmptyDescription
>;
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

/* ── Batch 3 of the shadcn reset: forms ──────────────────────────────────────────────────────── */

export type CalendarProps = React.ComponentProps<typeof Calendar>;

export type CheckboxProps = React.ComponentProps<typeof Checkbox>;

export type ComboboxInputProps = React.ComponentProps<typeof ComboboxInput>;
export type ComboboxContentProps = React.ComponentProps<typeof ComboboxContent>;
export type ComboboxChipProps = React.ComponentProps<typeof ComboboxChip>;

export type DirectionProviderProps = React.ComponentProps<
  typeof DirectionProvider
>;

export type FieldProps = React.ComponentProps<typeof Field>;
export type FieldLegendProps = React.ComponentProps<typeof FieldLegend>;
export type FieldErrorProps = React.ComponentProps<typeof FieldError>;

export type InputProps = React.ComponentProps<typeof Input>;

export type InputGroupAddonProps = React.ComponentProps<typeof InputGroupAddon>;
export type InputGroupButtonProps = React.ComponentProps<
  typeof InputGroupButton
>;

export type InputOTPProps = React.ComponentProps<typeof InputOTP>;
export type InputOTPSlotProps = React.ComponentProps<typeof InputOTPSlot>;

export type NativeSelectProps = React.ComponentProps<typeof NativeSelect>;

export type RadioGroupProps = React.ComponentProps<typeof RadioGroup>;
export type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupItem>;

export type SelectTriggerProps = React.ComponentProps<typeof SelectTrigger>;
export type SelectContentProps = React.ComponentProps<typeof SelectContent>;

export type SliderProps = React.ComponentProps<typeof Slider>;

export type SwitchProps = React.ComponentProps<typeof Switch>;

export type TextareaProps = React.ComponentProps<typeof Textarea>;

export type DialogProps = React.ComponentProps<typeof Dialog>;
export type DialogContentProps = React.ComponentProps<typeof DialogContent>;
export type DialogFooterProps = React.ComponentProps<typeof DialogFooter>;

export type AlertDialogContentProps = React.ComponentProps<
  typeof AlertDialogContent
>;
export type AlertDialogCancelProps = React.ComponentProps<
  typeof AlertDialogCancel
>;

export type SheetProps = React.ComponentProps<typeof Sheet>;
export type SheetContentProps = React.ComponentProps<typeof SheetContent>;

export type DrawerProps = React.ComponentProps<typeof Drawer>;
export type DrawerContentProps = React.ComponentProps<typeof DrawerContent>;

export type PopoverContentProps = React.ComponentProps<typeof PopoverContent>;

export type HoverCardContentProps = React.ComponentProps<
  typeof HoverCardContent
>;

export type DropdownMenuContentProps = React.ComponentProps<
  typeof DropdownMenuContent
>;
export type DropdownMenuSubContentProps = React.ComponentProps<
  typeof DropdownMenuSubContent
>;
export type DropdownMenuItemProps = React.ComponentProps<
  typeof DropdownMenuItem
>;
export type DropdownMenuLabelProps = React.ComponentProps<
  typeof DropdownMenuLabel
>;
export type DropdownMenuSubTriggerProps = React.ComponentProps<
  typeof DropdownMenuSubTrigger
>;

export type ContextMenuContentProps = React.ComponentProps<
  typeof ContextMenuContent
>;
export type ContextMenuItemProps = React.ComponentProps<typeof ContextMenuItem>;
export type ContextMenuLabelProps = React.ComponentProps<
  typeof ContextMenuLabel
>;
export type ContextMenuSubTriggerProps = React.ComponentProps<
  typeof ContextMenuSubTrigger
>;

export type MenubarContentProps = React.ComponentProps<typeof MenubarContent>;
export type MenubarItemProps = React.ComponentProps<typeof MenubarItem>;
export type MenubarCheckboxItemProps = React.ComponentProps<
  typeof MenubarCheckboxItem
>;
export type MenubarRadioItemProps = React.ComponentProps<
  typeof MenubarRadioItem
>;
export type MenubarSubTriggerProps = React.ComponentProps<
  typeof MenubarSubTrigger
>;

export type CommandProps = React.ComponentProps<typeof Command>;
export type CommandDialogProps = React.ComponentProps<typeof CommandDialog>;

export type ToastProps = React.ComponentProps<typeof Toast>;
export type ToastViewportProps = React.ComponentProps<typeof ToastViewport>;
export type ToastActionProps = React.ComponentProps<typeof ToastAction>;

export type SonnerToasterProps = React.ComponentProps<typeof SonnerToaster>;
