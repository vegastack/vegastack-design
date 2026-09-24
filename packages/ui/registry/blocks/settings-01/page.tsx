// @vegastack settings-01@0.20.0 sha256-uLHiL9X2FpXjullLVP+uAdbBtKw13qGldKCU0BxSb7c=

"use client";

import * as React from "react";

import { ActionBar, ActionBarButton } from "@/components/ui/action-bar";
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

/**
 * `settings-01` — the settings starter page and the conforming reference for a settings screen:
 * an `AppShellPage size="narrow"` with a `PageHeader`, three `SettingsSection` groups of
 * `SettingsRow`s over full-width `Field` controls, an `ActionBar` save bar that appears only once
 * something changed, and a destructive action confirmed in an `AlertDialog` whose confirm button
 * repeats the verb.
 *
 * Every control is uncontrolled sample state: the form tracks only whether it is dirty, and
 * Discard remounts it to its defaults. Wire each row to your own state (and Save to your own
 * mutation) once it is installed.
 *
 * @example
 * // app/settings/page.tsx, straight after `shadcn add @vegastack/settings-01`
 * export { default } from "./page";
 */
export default function Page() {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [dirty, setDirty] = React.useState(false);
  const [version, setVersion] = React.useState(0);
  const discard = () => {
    setVersion((v) => v + 1);
    setDirty(false);
  };

  return (
    <AppShellPage size="narrow" ref={contentRef} className="pb-24">
      <PageHeader
        title="Settings"
        description="Workspace preferences for everyone on the Acme team."
      />

      <form
        key={version}
        className="flex flex-col gap-8"
        onChange={() => setDirty(true)}
        onSubmit={(event) => {
          event.preventDefault();
          setDirty(false);
        }}
      >
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
              <Input id="workspace-name" defaultValue="Acme" />
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
              />
            </SettingsRow>
            <SettingsRow
              label="Default role"
              description="The role a new member starts with."
              controlId="workspace-role"
            >
              <NativeSelect id="workspace-role" defaultValue="member">
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
              <Switch
                id="notify-failures"
                defaultChecked
                onCheckedChange={() => setDirty(true)}
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
                onCheckedChange={() => setDirty(true)}
              />
            </SettingsRow>
            <SettingsRow
              label="Product updates"
              description="Occasional notes about what shipped."
              controlId="notify-product"
            >
              <Switch
                id="notify-product"
                onCheckedChange={() => setDirty(true)}
              />
            </SettingsRow>
          </SettingsCard>
        </SettingsSection>
      </form>

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

      <ActionBar
        open={dirty}
        status="Unsaved changes"
        containerRef={contentRef}
      >
        <ActionBarButton
          render={<Button variant="ghost" size="sm" />}
          onClick={discard}
        >
          Discard
        </ActionBarButton>
        <ActionBarButton
          render={<Button size="sm" />}
          onClick={() => setDirty(false)}
        >
          Save changes
        </ActionBarButton>
      </ActionBar>
    </AppShellPage>
  );
}
