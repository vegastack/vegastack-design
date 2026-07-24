"use client";
import type { FC } from "react";
import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox";
import { Switch, type SwitchProps } from "@/components/ui/switch";

/**
 * Narrow-prop client wrappers for Story explorers whose real prop types explode under the
 * Story build plugin's TypeScript introspection. Base UI's `Checkbox.Root` / `Switch.Root`
 * prop graphs are pathologically recursive and serialize to ~24MB of controls JSON per page
 * in the static export — over Cloudflare's 25MiB per-asset limit (deploy.yml guards this).
 * The `Pick` keeps every control a human would actually toggle; runtime behavior is
 * unchanged. Must be a `'use client'` module: stories pass the component across the RSC
 * boundary, which only client references survive.
 */

type CheckboxStoryProps = Pick<
  CheckboxProps,
  | "checked"
  | "defaultChecked"
  | "indeterminate"
  | "disabled"
  | "required"
  | "size"
  | "aria-label"
>;

export const CheckboxStory: FC<CheckboxStoryProps> = (props) => (
  <Checkbox {...props} />
);
CheckboxStory.displayName = "Checkbox";

type SwitchStoryProps = Pick<
  SwitchProps,
  "checked" | "defaultChecked" | "disabled" | "required" | "size" | "aria-label"
>;

export const SwitchStory: FC<SwitchStoryProps> = (props) => (
  <Switch {...props} />
);
SwitchStory.displayName = "Switch";
