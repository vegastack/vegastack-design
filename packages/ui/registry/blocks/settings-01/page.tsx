// @vegastack settings-01@0.23.126 sha256-YxeSIfjUX6hbQaPWM4okpBmwufXBYCDoI6BehyL5TNw=

"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppShellPage } from "@/components/ui/app-shell";
import {
  AutoSaveIndicator,
  AutoSaveInput,
  useAutoSave,
} from "@/components/ui/auto-save-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "@/components/ui/settings-row";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/** Sample persistence: resolves after a short delay. Replace with your own mutation. */
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 400));

/**
 * `settings-01` — the settings starter page and the conforming reference for a settings screen:
 * an `AppShellPage size="prose"` with a `PageHeader` and three `SettingsSection` groups of
 * `SettingsRow`s. **Every field autosaves** — text after a short debounce (`AutoSaveInput`,
 * `useAutoSave`), pickers and switches at once — each with its own quiet status; there is no save
 * bar. A consequential action (delete) confirms in an `AlertDialog` whose confirm button repeats
 * the verb.
 *
 * Persistence is a sample `save()` that resolves after a short delay. Wire each field to your own
 * mutation, and on a failed save roll the value back and show a toast with Retry.
 *
 * @example
 * // app/settings/page.tsx, straight after `shadcn add @vegastack/settings-01`
 * export { default } from "./page";
 */
export default function Page() {
  const [description, setDescription] = React.useState(
    "Support automation for the Acme platform.",
  );
  const descriptionSave = useAutoSave({
    value: { description },
    onSave: save,
    delay: 800,
  });
  const [role, setRole] = React.useState("member");
  const roleSave = useAutoSave({ value: { role }, onSave: save, delay: 0 });

  return (
    <AppShellPage size="prose">
      <PageHeader
        title="Settings"
        description="Workspace preferences for everyone on the Acme team. Changes save as you go."
      />

      <SettingsSection
        titleAs="h2"
        title="Workspace"
        description="How this workspace is named and described across the product."
      >
        <SettingsCard>
          <SettingsRow
            label="Workspace name"
            description="Shown in the sidebar and on every invitation."
            controlId="workspace-name"
          >
            <AutoSaveInput
              id="workspace-name"
              defaultValue="Acme"
              onSave={save}
              validate={(value) => value.trim().length > 0}
            />
          </SettingsRow>
          <SettingsRow
            label="Description"
            description="A sentence teammates see when they join."
            controlId="workspace-description"
          >
            <Field>
              <Textarea
                id="workspace-description"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => void descriptionSave.flush()}
              />
              <AutoSaveIndicator status={descriptionSave.status} />
            </Field>
          </SettingsRow>
          <SettingsRow
            label="Default role"
            description="The role a new member starts with."
            controlId="workspace-role"
          >
            <div className="flex items-center gap-2">
              <NativeSelect
                id="workspace-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <NativeSelectOption value="viewer">Viewer</NativeSelectOption>
                <NativeSelectOption value="member">Member</NativeSelectOption>
                <NativeSelectOption value="admin">Admin</NativeSelectOption>
              </NativeSelect>
              <AutoSaveIndicator variant="icon" status={roleSave.status} />
            </div>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        titleAs="h2"
        title="Notifications"
        description="Choose what Acme sends you and where."
      >
        <SettingsCard>
          <SettingsRow
            label="Agent failures"
            description="Email the workspace owners when a run fails twice."
            controlId="notify-failures"
          >
            <Switch
              id="notify-failures"
              defaultChecked
              onCheckedChange={() => void save()}
            />
          </SettingsRow>
          <SettingsRow
            label="Weekly summary"
            description="A Monday digest of runs, escalations and spend."
            controlId="notify-summary"
          >
            <Switch
              id="notify-summary"
              defaultChecked
              onCheckedChange={() => void save()}
            />
          </SettingsRow>
          <SettingsRow
            label="Product updates"
            description="Occasional notes about what shipped."
            controlId="notify-product"
          >
            <Switch id="notify-product" onCheckedChange={() => void save()} />
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        titleAs="h2"
        title="Danger zone"
        description="These actions affect everyone in the workspace."
      >
        <SettingsCard>
          <SettingsRow
            label="Transfer ownership"
            description="Move billing and admin rights to another member."
          >
            <Field orientation="horizontal">
              <FieldLabel htmlFor="transfer-to" className="sr-only">
                New owner
              </FieldLabel>
              <Input id="transfer-to" placeholder="teammate@acme.com" />
              <Button variant="outline">Transfer</Button>
            </Field>
          </SettingsRow>
          <SettingsRow
            label="Delete workspace"
            description="Permanently removes agents, runs and history."
          >
            <Field>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  Delete workspace
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete the Acme workspace?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Every agent, run and piece of history goes with it. This
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive">
                      Delete workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <FieldDescription>This cannot be undone.</FieldDescription>
            </Field>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>
    </AppShellPage>
  );
}
