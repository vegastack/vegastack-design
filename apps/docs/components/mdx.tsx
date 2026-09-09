import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { Steps, Step } from "fumadocs-ui/components/steps";
import { Files, File, Folder } from "fumadocs-ui/components/files";
import * as Twoslash from "fumadocs-twoslash/ui";
import { ApiTable, TypeTable } from "@/components/api-table";
import {
  Anatomy,
  ComponentChangelog,
  InstallSteps,
  StatesTested,
} from "@/components/generated-sections";
import type { MDXComponents } from "mdx/types";
import { assertMdxMapMatchesManifest } from "@/lib/mdx-manifest";
import { ComponentPreview } from "@/components/component-preview";
import { StoryExplorer } from "@/components/story-explorer";
import { DoDont } from "@/components/do-dont";
import {
  ColorPalette,
  SurfaceLadder,
  TypeScale,
  RadiusScale,
  ShadowScale,
  SpacingScale,
  MotionSpecimen,
  TypeScaleSizes,
  TypeCoreLadder,
  FocusRingSpecimen,
} from "@/components/foundations";
import { IconGallery } from "@/components/icon-gallery";
import { RegistryInstallCallout } from "@/components/registry-install-callout";
import { AlertPlayground } from "@/components/alert-playground";
import { AnimatedNumberPlayground } from "@/components/animated-number-playground";
import { AttachmentPlayground } from "@/components/attachment-playground";
import { AvatarPlayground } from "@/components/avatar-playground";
import { BadgePlayground } from "@/components/badge-playground";
import { BubblePlayground } from "@/components/bubble-playground";
import { ButtonPlayground } from "@/components/button-playground";
import { CardPlayground } from "@/components/card-playground";
import { CheckboxPlayground } from "@/components/checkbox-playground";
import { ComboboxPlayground } from "@/components/combobox-playground";
import { CopyButtonPlayground } from "@/components/copy-button-playground";
import { DialogPlayground } from "@/components/dialog-playground";
import { EmptyPlayground } from "@/components/empty-playground";
import { FieldInlinePlayground } from "@/components/field-inline-playground";
import { FieldPlayground } from "@/components/field-playground";
import { IconButtonPlayground } from "@/components/icon-button-playground";
import { ImagePlayground } from "@/components/image-playground";
import { InputPlayground } from "@/components/input-playground";
import { ItemPlayground } from "@/components/item-playground";
import { KbdPlayground } from "@/components/kbd-playground";
import { NotificationBellPlayground } from "@/components/notification-bell-playground";
import { OTPInputPlayground } from "@/components/otp-input-playground";
import { PaginationPlayground } from "@/components/pagination-playground";
import { PopoverPlayground } from "@/components/popover-playground";
import { ProgressIndicatorPlayground } from "@/components/progress-indicator-playground";
import { ProgressPlayground } from "@/components/progress-playground";
import { RadioGroupPlayground } from "@/components/radio-group-playground";
import { RelativeTimePlayground } from "@/components/relative-time-playground";
import { ResizablePlayground } from "@/components/resizable-playground";
import { ScrollAreaPlayground } from "@/components/scroll-area-playground";
import { SelectPlayground } from "@/components/select-playground";
import { SeparatorPlayground } from "@/components/separator-playground";
import { SheetPlayground } from "@/components/sheet-playground";
import { SkeletonPlayground } from "@/components/skeleton-playground";
import { ToastPlayground } from "@/components/toast-playground";
import { SpinnerPlayground } from "@/components/spinner-playground";
import { SplitButtonPlayground } from "@/components/split-button-playground";
import { StatusIconPlayground } from "@/components/status-icon-playground";
import { SwitchPlayground } from "@/components/switch-playground";
import { TabsPlayground } from "@/components/tabs-playground";
import { TextareaPlayground } from "@/components/textarea-playground";
import { ToggleGroupPlayground } from "@/components/toggle-group-playground";
import { TogglePlayground } from "@/components/toggle-playground";
import { TooltipPlayground } from "@/components/tooltip-playground";
import { TruncatedTextPlayground } from "@/components/truncated-text-playground";

/**
 * Names fumadocs supplies through its own spreads. Everything else in the map below is repo-owned
 * and MUST be classified in `lib/mdx-manifest.ts`, which the agent-export stringifier and the
 * runtime placeholder renderer read — a component that renders for humans and is unknown to the
 * manifest is a section agents silently never see.
 */
const INHERITED_MDX_KEYS = new Set([
  ...Object.keys(defaultMdxComponents),
  ...Object.keys(TabsComponents),
  ...Object.keys(Twoslash),
]);

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...Twoslash,
    Steps,
    Step,
    Files,
    File,
    Folder,
    // One flat renderer for every API table (DS-02/DS-03).
    ApiTable,
    TypeTable,
    InstallSteps,
    Anatomy,
    StatesTested,
    ComponentChangelog,
    ComponentPreview,
    StoryExplorer,
    RegistryInstallCallout,
    DoDont,
    ColorPalette,
    SurfaceLadder,
    TypeScale,
    RadiusScale,
    ShadowScale,
    SpacingScale,
    MotionSpecimen,
    TypeScaleSizes,
    TypeCoreLadder,
    FocusRingSpecimen,
    IconGallery,
    AlertPlayground,
    AnimatedNumberPlayground,
    AttachmentPlayground,
    AvatarPlayground,
    BadgePlayground,
    BubblePlayground,
    ButtonPlayground,
    CardPlayground,
    CheckboxPlayground,
    ComboboxPlayground,
    CopyButtonPlayground,
    DialogPlayground,
    EmptyPlayground,
    FieldInlinePlayground,
    FieldPlayground,
    IconButtonPlayground,
    ImagePlayground,
    InputPlayground,
    ItemPlayground,
    KbdPlayground,
    NotificationBellPlayground,
    OTPInputPlayground,
    PaginationPlayground,
    PopoverPlayground,
    ProgressIndicatorPlayground,
    ProgressPlayground,
    RadioGroupPlayground,
    RelativeTimePlayground,
    ResizablePlayground,
    ScrollAreaPlayground,
    SelectPlayground,
    SeparatorPlayground,
    SheetPlayground,
    SkeletonPlayground,
    ToastPlayground,
    SpinnerPlayground,
    SplitButtonPlayground,
    StatusIconPlayground,
    SwitchPlayground,
    TabsPlayground,
    TextareaPlayground,
    ToggleGroupPlayground,
    TogglePlayground,
    TooltipPlayground,
    TruncatedTextPlayground,
    ...components,
  } satisfies MDXComponents;
}

// Module load, so the mismatch fails `next build` rather than surfacing in a review. `components`
// is omitted: per-render overrides are the caller's, not the page vocabulary.
assertMdxMapMatchesManifest(
  Object.keys(getMDXComponents()).filter(
    (name) => !INHERITED_MDX_KEYS.has(name),
  ),
);

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
