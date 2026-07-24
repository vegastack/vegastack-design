import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import { AutoTypeTable, type AutoTypeTableProps } from "fumadocs-typescript/ui";
import {
  createGenerator,
  createFileSystemGeneratorCache,
} from "fumadocs-typescript";
import * as Twoslash from "fumadocs-twoslash/ui";
import type { MDXComponents } from "mdx/types";
import { ComponentPreview } from "@/components/component-preview";
import { DoDont } from "@/components/do-dont";
import {
  ColorPalette,
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
import { SonnerPlayground } from "@/components/sonner-playground";
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

const baseGenerator = createGenerator({
  cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

// ts-morph's property-symbol enumeration order is NOT stable across program instances, and the
// generator cache lives in `.next` (cleared between builds) — so without an explicit sort, API
// tables shuffle their inherited-prop rows on every rebuild (caught by VRT: baselines from one
// build failed the next). Deterministic order: props DECLARED IN THIS REPO first (the component's
// own API), then everything inherited (@types/react DOM/aria attributes, Base UI extras), required
// before optional and alphabetical within each group. Own-ness is stamped as a marker tag inside
// the generator's `transform` hook — that runs before the cache write, so cached entries keep it;
// the AutoTypeTable renderer ignores unknown tag names (verified in parseTags).
const OWN_PROP_TAG = "vs-own-prop";

const generator: typeof baseGenerator = {
  ...baseGenerator,
  async generateTypeTable(props, options) {
    const docs = await baseGenerator.generateTypeTable(props, {
      ...options,
      transform(entry, propertyType, propertySymbol) {
        options?.transform?.call(this, entry, propertyType, propertySymbol);
        const own = propertySymbol
          .getDeclarations()
          .some(
            (decl) =>
              !decl.getSourceFile().getFilePath().includes("node_modules"),
          );
        if (own) entry.tags.push({ name: OWN_PROP_TAG, text: "" });
      },
    });
    return docs.map((doc) => {
      // Phase D bloat fix: API tables list OWN props only. Expanding every inherited DOM/aria/Base
      // UI prop made the top pages 9–16MB of HTML each (plus 3× ~8MB RSC payload copies — 755MB of
      // the 785MB export was these tables). Inherited surface is what TypeScript is for; the docs
      // convention (shadcn/Radix alike) is to document the component's own API. Components that
      // add no props of their own get a single explanatory row instead of an empty table.
      const own = doc.entries.filter((e) =>
        e.tags.some((t) => t.name === OWN_PROP_TAG),
      );
      const entries = own.length
        ? own.sort((a, b) => {
            const aReq = a.required ? 0 : 1;
            const bReq = b.required ? 0 : 1;
            if (aReq !== bReq) return aReq - bReq;
            return a.name.localeCompare(b.name, "en");
          })
        : [
            {
              name: "(no own props)",
              description:
                "This part adds no props of its own — it accepts everything the underlying element/primitive accepts (className, ref, ARIA attributes, event handlers, …).",
              type: "—",
              typeHref: undefined,
              simplifiedType: "—",
              tags: [],
              // `required: true` — counter-intuitive, but the renderer appends the optional "?"
              // marker to non-required names, which made this placeholder read "(no own props)?"
              // (an audit finding: it looks like a broken prop name). It is not a prop at all.
              required: true,
              deprecated: false,
            },
          ];
      return { ...doc, entries };
    });
  },
};

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...Twoslash,
    TypeTable,
    AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
    ComponentPreview,
    RegistryInstallCallout,
    DoDont,
    ColorPalette,
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
    SonnerPlayground,
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

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
