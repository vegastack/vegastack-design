import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { Steps, Step } from "fumadocs-ui/components/steps";
import { Files, File, Folder } from "fumadocs-ui/components/files";
import * as Twoslash from "fumadocs-twoslash/ui";
import { ApiTable, TypeTable } from "@/components/api-table";
import {
  Anatomy,
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
  TypeScale,
  RadiusScale,
  ShadowScale,
  SpacingScale,
  MotionSpecimen,
  TypeScaleSizes,
  FocusRingSpecimen,
} from "@/components/foundations";
import { RegistryInstallCallout } from "@/components/registry-install-callout";
import { AnimatedNumberPlayground } from "@/components/animated-number-playground";
import { AttachmentPlayground } from "@/components/attachment-playground";
import { CheckboxPlayground } from "@/components/checkbox-playground";
import { ComboboxPlayground } from "@/components/combobox-playground";
import { CopyButtonPlayground } from "@/components/copy-button-playground";
import { DialogPlayground } from "@/components/dialog-playground";
import { FieldPlayground } from "@/components/field-playground";
import { ImagePlayground } from "@/components/image-playground";
import { InputPlayground } from "@/components/input-playground";
import { NotificationBellPlayground } from "@/components/notification-bell-playground";
import { PaginationPlayground } from "@/components/pagination-playground";
import { PopoverPlayground } from "@/components/popover-playground";
import { ProgressPlayground } from "@/components/progress-playground";
import { RadioGroupPlayground } from "@/components/radio-group-playground";
import { RelativeTimePlayground } from "@/components/relative-time-playground";
import { ResizablePlayground } from "@/components/resizable-playground";
import { ScrollAreaPlayground } from "@/components/scroll-area-playground";
import { SelectPlayground } from "@/components/select-playground";
import { SheetPlayground } from "@/components/sheet-playground";
import { StatusIconPlayground } from "@/components/status-icon-playground";
import { SwitchPlayground } from "@/components/switch-playground";
import { TabsPlayground } from "@/components/tabs-playground";
import { TextareaPlayground } from "@/components/textarea-playground";
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
    ComponentPreview,
    StoryExplorer,
    RegistryInstallCallout,
    DoDont,
    ColorPalette,
    TypeScale,
    RadiusScale,
    ShadowScale,
    SpacingScale,
    MotionSpecimen,
    TypeScaleSizes,
    FocusRingSpecimen,
    AnimatedNumberPlayground,
    AttachmentPlayground,
    CheckboxPlayground,
    ComboboxPlayground,
    CopyButtonPlayground,
    DialogPlayground,
    FieldPlayground,
    ImagePlayground,
    InputPlayground,
    NotificationBellPlayground,
    PaginationPlayground,
    PopoverPlayground,
    ProgressPlayground,
    RadioGroupPlayground,
    RelativeTimePlayground,
    ResizablePlayground,
    ScrollAreaPlayground,
    SelectPlayground,
    SheetPlayground,
    StatusIconPlayground,
    SwitchPlayground,
    TabsPlayground,
    TextareaPlayground,
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
