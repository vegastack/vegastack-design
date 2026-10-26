"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/settings-row` (dogfoods the registry) → auto-scanned.
import {
  SettingsCard,
  SettingsMatrix,
  SettingsRow,
  SettingsSection,
} from "@/components/ui/settings-row";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const THEMES = { system: "System", light: "Light", dark: "Dark" };

export function settingsRow(): ReactNode {
  return (
    <Wrapper className="block">
      <SettingsCard className="mx-auto w-full max-w-md">
        <SettingsRow
          label="Email notifications"
          description="Product updates, tips, and offers."
        >
          <Switch defaultChecked aria-label="Email notifications" />
        </SettingsRow>
        <SettingsRow
          label="Theme"
          description="How the interface looks on this device."
        >
          <Select items={THEMES} defaultValue="system">
            <SelectTrigger size="sm" aria-label="Theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          label="Two-factor authentication"
          description="Require a code at sign-in."
        >
          <Switch aria-label="Two-factor authentication" />
        </SettingsRow>
      </SettingsCard>
    </Wrapper>
  );
}

export function settingsSection(): ReactNode {
  return (
    <Wrapper className="block">
      <SettingsSection
        title="Notifications"
        description="Choose what you want to hear about."
        className="mx-auto w-full max-w-md"
      >
        <SettingsCard>
          <SettingsRow label="Email" description="Product updates and tips.">
            <Switch defaultChecked aria-label="Email" />
          </SettingsRow>
          <SettingsRow label="SMS" description="Critical alerts only.">
            <Switch aria-label="SMS" />
          </SettingsRow>
          <SettingsRow
            label="Desktop push"
            description="Real-time alerts on this device."
          >
            <Switch defaultChecked aria-label="Desktop push" />
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>
    </Wrapper>
  );
}

export function settingsRowControlId(): ReactNode {
  return (
    <Wrapper className="block">
      <SettingsCard className="mx-auto w-full max-w-md">
        {/* `controlId` wires the row label to a native input via `<label htmlFor>`. */}
        <SettingsRow
          label="Workspace name"
          description="Shown across the product."
          controlId="settings-workspace-name"
        >
          <Input id="settings-workspace-name" defaultValue="Acme Inc." />
        </SettingsRow>
        {/* `labelProps` merges attributes onto the generated <label> element — here a
            non-visual `id` hook (for aria-labelledby / test targeting), so the label
            still reads like every other label. */}
        <SettingsRow
          label="Support email"
          description="Where customer replies are sent."
          controlId="settings-support-email"
          labelProps={{ id: "settings-support-email-label" }}
        >
          <Input
            id="settings-support-email"
            type="email"
            defaultValue="help@acme.com"
          />
        </SettingsRow>
      </SettingsCard>
    </Wrapper>
  );
}

export function settingsRowControlTypes(): ReactNode {
  return (
    <Wrapper className="block">
      <SettingsCard className="mx-auto w-full max-w-md">
        {/* Input control */}
        <SettingsRow label="Display name" controlId="settings-display-name">
          <Input id="settings-display-name" defaultValue="Ada" />
        </SettingsRow>
        {/* Switch control */}
        <SettingsRow
          label="Email notifications"
          description="Product updates and tips."
        >
          <Switch defaultChecked aria-label="Email notifications" />
        </SettingsRow>
        {/* Read-only value */}
        <SettingsRow label="Workspace ID" description="Used in API requests.">
          <span className="font-mono text-sm text-muted-foreground">
            ws_8f3a1c
          </span>
        </SettingsRow>
        {/* Badge as status */}
        <SettingsRow label="Plan" description="Your current subscription tier.">
          <Badge variant="info">Pro</Badge>
        </SettingsRow>
        {/* Button control */}
        <SettingsRow
          label="Active sessions"
          description="Sign out everywhere else."
        >
          <Button variant="outline" size="sm">
            Sign out all
          </Button>
        </SettingsRow>
        {/* Label-only row — no children, so no control slot renders. */}
        <SettingsRow
          label="Danger zone"
          description="Deleting the workspace is permanent and cannot be undone."
        />
      </SettingsCard>
    </Wrapper>
  );
}

const ZONES = { utc: "UTC", ist: "India (IST)", pst: "Pacific (PT)" };

export function settingsRowControlSize(): ReactNode {
  return (
    <Wrapper className="block">
      <SettingsCard className="mx-auto w-full max-w-xl">
        {/* No controlSize: a field control takes md (256px). */}
        <SettingsRow label="Name" controlId="settings-size-name">
          <Input id="settings-size-name" defaultValue="Acme Inc." />
        </SettingsRow>
        <SettingsRow label="Time zone">
          <Select items={ZONES} defaultValue="ist">
            <SelectTrigger aria-label="Time zone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ZONES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          label="Short code"
          description="Prefixes every task key."
          controlSize="sm"
          controlId="settings-size-code"
        >
          <Input id="settings-size-code" defaultValue="ACME" />
        </SettingsRow>
        <SettingsRow
          label="Support email"
          controlSize="lg"
          controlId="settings-size-email"
        >
          <Input
            id="settings-size-email"
            type="email"
            defaultValue="help@acme.com"
          />
        </SettingsRow>
        {/* A switch keeps its own width and ends on the same right edge. */}
        <SettingsRow label="Daily digest">
          <Switch defaultChecked aria-label="Daily digest" />
        </SettingsRow>
      </SettingsCard>
    </Wrapper>
  );
}

const CATEGORIES = [
  { key: "assigned", label: "Assigned to me" },
  {
    key: "mentions",
    label: "Mentions",
    description: "When someone @mentions you.",
  },
  { key: "comments", label: "Comments and replies" },
  { key: "due", label: "Due soon", description: "A day before a due date." },
] as const;

export function settingsMatrix(): ReactNode {
  const [values, setValues] = useState<Record<string, boolean[]>>({
    assigned: [true, true],
    mentions: [true, true],
    comments: [true, false],
    due: [false, true],
  });
  return (
    <Wrapper className="block">
      <SettingsSection
        titleAs="h2"
        title="What you hear about"
        description="In-app: always. Push goes to the mobile app."
        className="mx-auto w-full max-w-xl"
      >
        <SettingsMatrix
          label="Category"
          columns={["Push", "Email"]}
          rows={CATEGORIES.map((category) => ({
            id: category.key,
            label: category.label,
            description:
              "description" in category ? category.description : undefined,
            values: values[category.key] ?? [],
            onChange: (column, checked) =>
              setValues((current) => {
                const next = [...(current[category.key] ?? [])];
                next[column] = checked;
                return { ...current, [category.key]: next };
              }),
          }))}
        />
      </SettingsSection>
    </Wrapper>
  );
}
