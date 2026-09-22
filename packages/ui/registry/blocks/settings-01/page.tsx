// @vegastack settings-01@0.11.0 sha256-Ce1iAFBskTbDMBwEpvdrOqjMNphQjrcSp3WObMjWDlU=

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "@/components/ui/settings-row";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * `settings-01` — the settings starter page: three `SettingsSection` groups of `SettingsRow`s
 * over `Field` controls, closed by a sticky save bar.
 *
 * Every control is uncontrolled sample state, so the page is server-safe; wire each row to your
 * own state (and the save bar to your own mutation) once it is installed.
 *
 * @example
 * // app/settings/page.tsx, straight after `shadcn add @vegastack/settings-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 p-4 pb-24 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Workspace preferences for everyone on the Acme team.
        </p>
      </div>

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
            <Input
              id="workspace-name"
              defaultValue="Acme"
              className="sm:w-64"
            />
          </SettingsRow>
          <SettingsRow
            label="Description"
            description="A sentence teammates see when they join."
            controlId="workspace-description"
          >
            <Textarea
              id="workspace-description"
              rows={2}
              defaultValue="Support automation for the Acme platform."
              className="sm:w-64"
            />
          </SettingsRow>
          <SettingsRow
            label="Default role"
            description="The role a new member starts with."
            controlId="workspace-role"
          >
            <NativeSelect
              id="workspace-role"
              defaultValue="member"
              className="sm:w-64"
            >
              <NativeSelectOption value="viewer">Viewer</NativeSelectOption>
              <NativeSelectOption value="member">Member</NativeSelectOption>
              <NativeSelectOption value="admin">Admin</NativeSelectOption>
            </NativeSelect>
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
            <Switch id="notify-failures" defaultChecked />
          </SettingsRow>
          <SettingsRow
            label="Weekly summary"
            description="A Monday digest of runs, escalations and spend."
            controlId="notify-summary"
          >
            <Switch id="notify-summary" defaultChecked />
          </SettingsRow>
          <SettingsRow
            label="Product updates"
            description="Occasional notes about what shipped."
            controlId="notify-product"
          >
            <Switch id="notify-product" />
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
              <Input
                id="transfer-to"
                placeholder="teammate@acme.com"
                className="sm:w-56"
              />
              <Button variant="outline">Transfer</Button>
            </Field>
          </SettingsRow>
          <SettingsRow
            label="Delete workspace"
            description="Permanently removes agents, runs and history."
          >
            <Field>
              <Button variant="destructive">Delete workspace</Button>
              <FieldDescription>This cannot be undone.</FieldDescription>
            </Field>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
          <Button variant="ghost">Discard</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
