"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/field` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function field(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldSet className="mx-auto w-full max-w-sm">
        <FieldLegend>Profile</FieldLegend>
        <FieldDescription>
          This appears on invoices and emails.
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-name">Full name</FieldLabel>
            <Input
              id="field-name"
              autoComplete="off"
              placeholder="Evil Rabbit"
            />
            <FieldDescription>
              This appears on invoices and emails.
            </FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="field-username">Username</FieldLabel>
            <Input id="field-username" autoComplete="off" aria-invalid />
            <FieldError>Choose another username.</FieldError>
          </Field>
          <Field orientation="horizontal">
            <Switch id="field-newsletter" />
            <FieldLabel htmlFor="field-newsletter">
              Subscribe to the newsletter
            </FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function fieldComposition(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-sm">
        <Field>
          <FieldLabel htmlFor="composition-email">Email</FieldLabel>
          <Input id="composition-email" placeholder="name@example.com" />
          <FieldDescription>Field · FieldLabel · Input.</FieldDescription>
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel htmlFor="composition-note">Note</FieldLabel>
          <Textarea id="composition-note" placeholder="Anything else?" />
          <FieldDescription>
            FieldGroup · FieldSeparator · Field.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function fieldAnatomy(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto w-full max-w-sm" data-invalid>
        <FieldLabel htmlFor="anatomy-input">Label</FieldLabel>
        <Input id="anatomy-input" aria-invalid placeholder="Control" />
        <FieldDescription>Optional helper text.</FieldDescription>
        <FieldError>Validation message.</FieldError>
      </Field>
    </Wrapper>
  );
}

export function fieldForm(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <form
        className="mx-auto w-full max-w-sm"
        onSubmit={(event) => event.preventDefault()}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="form-field-email">Email</FieldLabel>
            <Input
              id="form-field-email"
              type="email"
              placeholder="name@example.com"
              required
            />
            <FieldDescription>We only use it to sign you in.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Button type="reset" variant="outline">
              Reset
            </Button>
            <Button type="submit">Continue</Button>
          </Field>
        </FieldGroup>
      </form>
    </Wrapper>
  );
}

export function fieldInput(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldSet className="mx-auto w-full max-w-xs">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-input-username">Username</FieldLabel>
            <Input
              id="field-input-username"
              type="text"
              placeholder="Max Leiter"
            />
            <FieldDescription>
              Choose a unique username for your account.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="field-input-password">Password</FieldLabel>
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
            <Input
              id="field-input-password"
              type="password"
              placeholder="••••••••"
            />
          </Field>
        </FieldGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function fieldTextarea(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldSet className="mx-auto w-full max-w-xs">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-feedback">Feedback</FieldLabel>
            <Textarea
              id="field-feedback"
              placeholder="Your feedback helps us improve..."
              rows={4}
            />
            <FieldDescription>
              Share your thoughts about our service.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
    </Wrapper>
  );
}

const departments = [
  { label: "Choose department", value: null },
  { label: "Engineering", value: "engineering" },
  { label: "Design", value: "design" },
  { label: "Marketing", value: "marketing" },
  { label: "Sales", value: "sales" },
];

export function fieldSelect(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto w-full max-w-xs">
        <FieldLabel>Department</FieldLabel>
        <Select items={departments}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {departments.map((item) => (
                <SelectItem key={String(item.value)} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>
          Select your department or area of work.
        </FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function fieldSlider(): ReactNode {
  const [value, setValue] = React.useState([200, 800]);

  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto w-full max-w-xs">
        <FieldTitle>Price Range</FieldTitle>
        <FieldDescription>
          Set your budget range ($
          <span className="font-medium tabular-nums">{value[0]}</span> –{" "}
          <span className="font-medium tabular-nums">{value[1]}</span>).
        </FieldDescription>
        <Slider
          value={value}
          onValueChange={(next) => setValue(next as number[])}
          max={1000}
          min={0}
          step={10}
          className="mt-2 w-full"
          aria-label="Price Range"
        />
      </Field>
    </Wrapper>
  );
}

export function fieldFieldset(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldSet className="mx-auto w-full max-w-sm">
        <FieldLegend>Address Information</FieldLegend>
        <FieldDescription>
          We need your address to deliver your order.
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="street">Street Address</FieldLabel>
            <Input id="street" type="text" placeholder="123 Main St" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" type="text" placeholder="New York" />
            </Field>
            <Field>
              <FieldLabel htmlFor="zip">Postal Code</FieldLabel>
              <Input id="zip" type="text" placeholder="90502" />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function fieldCheckbox(): ReactNode {
  const items = [
    { id: "hard-disks", label: "Hard disks" },
    { id: "external-disks", label: "External disks" },
    { id: "connected-servers", label: "Connected servers" },
  ];
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-xs">
        <FieldSet>
          <FieldLegend variant="label">
            Show these items on the desktop
          </FieldLegend>
          <FieldDescription>
            Select the items you want to show on the desktop.
          </FieldDescription>
          <FieldGroup className="gap-3">
            {items.map((item) => (
              <Field key={item.id} orientation="horizontal">
                <Checkbox id={`field-${item.id}`} />
                <FieldLabel
                  htmlFor={`field-${item.id}`}
                  className="font-normal"
                >
                  {item.label}
                </FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </Wrapper>
  );
}

export function fieldRadio(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldSet className="mx-auto w-full max-w-xs">
        <FieldLegend variant="label">Notify me about</FieldLegend>
        <RadioGroup defaultValue="all">
          <Field orientation="horizontal">
            <RadioGroupItem value="all" id="field-radio-all" />
            <FieldLabel htmlFor="field-radio-all" className="font-normal">
              All new messages
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="mentions" id="field-radio-mentions" />
            <FieldLabel htmlFor="field-radio-mentions" className="font-normal">
              Direct messages and mentions
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="none" id="field-radio-none" />
            <FieldLabel htmlFor="field-radio-none" className="font-normal">
              Nothing
            </FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function fieldSwitch(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field orientation="horizontal" className="mx-auto w-full max-w-sm">
        <FieldContent>
          <FieldLabel htmlFor="field-switch-2fa">
            Two-factor authentication
          </FieldLabel>
          <FieldDescription>
            Ask for a code from your authenticator app on every sign-in.
          </FieldDescription>
        </FieldContent>
        <Switch id="field-switch-2fa" defaultChecked />
      </Field>
    </Wrapper>
  );
}

export function fieldChoiceCard(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-xs">
        <FieldSet>
          <FieldLegend variant="label">Compute Environment</FieldLegend>
          <FieldDescription>
            Select the compute environment for your cluster.
          </FieldDescription>
          <RadioGroup defaultValue="kubernetes">
            <FieldLabel htmlFor="kubernetes-r2h">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Kubernetes</FieldTitle>
                  <FieldDescription>
                    Run GPU workloads on a K8s cluster.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="kubernetes" id="kubernetes-r2h" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="vm-z4k">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Virtual Machine</FieldTitle>
                  <FieldDescription>
                    Access a cluster to run GPU workloads.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="vm" id="vm-z4k" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
      </FieldGroup>
    </Wrapper>
  );
}

export function fieldFieldGroup(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-xs">
        <FieldSet>
          <FieldLabel>Responses</FieldLabel>
          <FieldDescription>
            Get notified when a long-running request finishes.
          </FieldDescription>
          <FieldGroup data-slot="checkbox-group">
            <Field orientation="horizontal" data-disabled>
              <Checkbox id="push" defaultChecked disabled />
              <FieldLabel htmlFor="push" className="font-normal">
                Push notifications
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLabel>Tasks</FieldLabel>
          <FieldDescription>
            Get notified when tasks you have created have updates.
          </FieldDescription>
          <FieldGroup data-slot="checkbox-group">
            <Field orientation="horizontal">
              <Checkbox id="push-tasks" />
              <FieldLabel htmlFor="push-tasks" className="font-normal">
                Push notifications
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="email-tasks" />
              <FieldLabel htmlFor="email-tasks" className="font-normal">
                Email notifications
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </Wrapper>
  );
}

export function fieldRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <FieldSet className="mx-auto w-full max-w-xs" dir="ltr">
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-rtl-ltr">Full name</FieldLabel>
            <Input id="field-rtl-ltr" placeholder="Ada Lovelace" />
            <FieldDescription>Shown on invoices.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Switch id="field-rtl-ltr-switch" />
            <FieldLabel htmlFor="field-rtl-ltr-switch">
              Subscribe to the newsletter
            </FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSet className="mx-auto w-full max-w-xs" dir="rtl">
        <FieldLegend>الملف الشخصي</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-rtl-ar">الاسم الكامل</FieldLabel>
            <Input id="field-rtl-ar" placeholder="آدا لوفلايس" />
            <FieldDescription>يظهر على الفواتير.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Switch id="field-rtl-ar-switch" />
            <FieldLabel htmlFor="field-rtl-ar-switch">
              الاشتراك في النشرة
            </FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function fieldResponsiveLayout(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-lg">
        <form onSubmit={(event) => event.preventDefault()}>
          <FieldSet>
            <FieldLegend>Profile</FieldLegend>
            <FieldDescription>
              Fill in your profile information.
            </FieldDescription>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor="responsive-name">Name</FieldLabel>
                  <FieldDescription>
                    Provide your full name for identification.
                  </FieldDescription>
                </FieldContent>
                <Input
                  id="responsive-name"
                  placeholder="Evil Rabbit"
                  required
                />
              </Field>
              <Field orientation="responsive">
                <Button type="submit">Submit</Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      </div>
    </Wrapper>
  );
}

export function fieldValidationAndErrors(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-sm">
        <Field data-invalid>
          <FieldLabel htmlFor="validation-email">Email</FieldLabel>
          <Input id="validation-email" type="email" aria-invalid />
          <FieldError>Enter a valid email address.</FieldError>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="validation-password">Password</FieldLabel>
          <Input id="validation-password" type="password" aria-invalid />
          <FieldError
            errors={[
              { message: "Must be at least 8 characters." },
              { message: "Must contain a number." },
            ]}
          />
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

/**
 * API-26: no ids, no `htmlFor`, no `aria-*` — `Field` wires the label, the description, the error
 * and the invalid state onto the control, and only while each is rendered.
 */
export function fieldAutomaticWiring(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-sm">
        <Field>
          <FieldLabel>Company name</FieldLabel>
          <Input placeholder="Acme Inc." />
          <FieldDescription>Shown on invoices.</FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel>Notes</FieldLabel>
          <Textarea defaultValue="Ship before the end of the quarter, and" />
          <FieldDescription>Up to 40 characters.</FieldDescription>
          <FieldError>Notes are too long.</FieldError>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function fieldAccessibility(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldSet className="mx-auto w-full max-w-xs">
        <FieldLegend>Shipping speed</FieldLegend>
        <FieldDescription>
          The legend names the group; each label names its own control.
        </FieldDescription>
        <RadioGroup defaultValue="standard">
          <Field orientation="horizontal">
            <RadioGroupItem value="standard" id="a11y-standard" />
            <FieldLabel htmlFor="a11y-standard" className="font-normal">
              Standard
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="express" id="a11y-express" />
            <FieldLabel htmlFor="a11y-express" className="font-normal">
              Express
            </FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
    </Wrapper>
  );
}

/**
 * Ours, and a geometry canary (`component-contracts.json` → affectedTestPolicy.geometryCanaries):
 * the three orientations and the invalid and disabled blocks in one frame.
 */
export function fieldStates(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-sm">
        <Field>
          <FieldLabel htmlFor="state-vertical">Vertical</FieldLabel>
          <Input id="state-vertical" placeholder="Rest" />
          <FieldDescription>The default orientation.</FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="state-horizontal">Horizontal</FieldLabel>
          <Input id="state-horizontal" placeholder="Rest" />
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="state-invalid">Invalid</FieldLabel>
          <Input id="state-invalid" aria-invalid defaultValue="Invalid" />
          <FieldError>Something is wrong with this value.</FieldError>
        </Field>
        <Field data-disabled>
          <FieldLabel htmlFor="state-disabled">Disabled</FieldLabel>
          <Input id="state-disabled" disabled defaultValue="Disabled" />
          <FieldDescription>The whole block dims.</FieldDescription>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}
