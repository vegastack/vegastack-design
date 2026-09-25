"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/multi-step-form` (dogfoods the registry).
import {
  MultiStepForm,
  MultiStepFormActions,
  MultiStepFormBack,
  MultiStepFormExit,
  MultiStepFormNav,
  MultiStepFormNext,
  MultiStepFormStep,
  type MultiStepFormStepSpec,
} from "@/components/ui/multi-step-form";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppShellPage } from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Check, X } from "lucide-react";
import {
  PropertyList,
  PropertyRow,
  PropertyLabel,
  PropertyValue,
} from "@/components/ui/property-list";

function delay<T>(value: T, ms = 900): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function multiStepForm(): ReactNode {
  const [type, setType] = useState("individual");
  const [name, setName] = useState("Manoj Kumar");
  const [email, setEmail] = useState("mk@vegastack.com");
  const [company, setCompany] = useState("");

  // `when` is an ordinary boolean the page computes — the component holds no answers of its
  // own, so a branch is just a re-render.
  const steps: MultiStepFormStepSpec[] = [
    { id: "account", label: "Account", description: "Name and email" },
    { id: "type", label: "Account type", description: "How you'll be billed" },
    {
      id: "company",
      label: "Business details",
      description: "Registration",
      when: type === "business",
    },
    { id: "review", label: "Review", description: "Confirm and submit" },
  ];

  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-2xl">
        <MultiStepForm steps={steps}>
          <MultiStepFormNav aria-label="Signup" />

          <MultiStepFormStep id="account">
            <Field>
              <FieldLabel htmlFor="msf-name">Full name</FieldLabel>
              <Input
                id="msf-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="msf-email">Work email</FieldLabel>
              <Input
                id="msf-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <FieldDescription>
                We&rsquo;ll send a confirmation here.
              </FieldDescription>
            </Field>
          </MultiStepFormStep>

          <MultiStepFormStep id="type">
            <RadioGroup value={type} onValueChange={(v) => setType(String(v))}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="individual" id="msf-individual" />
                <Label htmlFor="msf-individual">Individual</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="business" id="msf-business" />
                <Label htmlFor="msf-business">
                  Business — adds a step to this flow
                </Label>
              </div>
            </RadioGroup>
          </MultiStepFormStep>

          <MultiStepFormStep id="company">
            <Field>
              <FieldLabel htmlFor="msf-company">
                Registered company name
              </FieldLabel>
              <Input
                id="msf-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </Field>
          </MultiStepFormStep>

          <MultiStepFormStep id="review">
            {/* A step that collects nothing — the same component, with no form in it. */}
            <PropertyList>
              <PropertyRow>
                <PropertyLabel>Name</PropertyLabel>
                <PropertyValue>{name}</PropertyValue>
              </PropertyRow>
              <PropertyRow>
                <PropertyLabel>Email</PropertyLabel>
                <PropertyValue>{email}</PropertyValue>
              </PropertyRow>
              <PropertyRow>
                <PropertyLabel>Account type</PropertyLabel>
                <PropertyValue>
                  {type === "business" ? "Business" : "Individual"}
                </PropertyValue>
              </PropertyRow>
              {type === "business" ? (
                <PropertyRow>
                  <PropertyLabel>Company</PropertyLabel>
                  <PropertyValue>{company || "—"}</PropertyValue>
                </PropertyRow>
              ) : null}
            </PropertyList>
          </MultiStepFormStep>

          <MultiStepFormActions />
        </MultiStepForm>
      </div>
    </Wrapper>
  );
}

export function multiStepFormGuards(): ReactNode {
  const [card, setCard] = useState("4242 4242 4242 4242");
  const declined = card.trim().endsWith("0002");

  const steps: MultiStepFormStepSpec[] = [
    {
      id: "billing",
      label: "Billing",
      description: "Payment method",
      lock: true,
      // The guard is just a function returning a promise, which is why no validation
      // library is needed — or shipped.
      beforeNext: () =>
        delay(
          declined
            ? "Your bank declined this card. Try another, or pay by invoice."
            : (true as const),
        ),
    },
    { id: "done", label: "Confirmation", description: "All set" },
  ];

  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-2xl">
        <MultiStepForm steps={steps} submitLabel="Finish">
          <MultiStepFormNav aria-label="Checkout" />
          <MultiStepFormStep id="billing">
            <Field>
              <FieldLabel htmlFor="msf-card">Card number</FieldLabel>
              <Input
                id="msf-card"
                value={card}
                onChange={(event) => setCard(event.target.value)}
              />
              <FieldDescription>
                End the number in <code>0002</code> to watch the check fail.
              </FieldDescription>
            </Field>
          </MultiStepFormStep>
          <MultiStepFormStep id="done">
            <p className="text-sm text-muted-foreground">
              Payment taken — Back is sealed, because this step committed
              something.
            </p>
          </MultiStepFormStep>
          <MultiStepFormActions />
        </MultiStepForm>
      </div>
    </Wrapper>
  );
}

export function multiStepFormSoftGate(): ReactNode {
  const [columns, setColumns] = useState("");
  const steps: MultiStepFormStepSpec[] = [
    {
      id: "map",
      label: "Map columns",
      beforeNext: () =>
        columns.trim()
          ? (true as const)
          : {
              reason: "Map every required column to continue.",
              tone: "soft" as const,
            },
    },
    { id: "import", label: "Import" },
  ];
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-2xl">
        <MultiStepForm steps={steps}>
          <MultiStepFormNav aria-label="Import" />
          <MultiStepFormStep id="map">
            <Field>
              <FieldLabel htmlFor="msf-columns">Email column</FieldLabel>
              <Input
                id="msf-columns"
                placeholder="Leave empty and press Continue"
                value={columns}
                onChange={(event) => setColumns(event.target.value)}
              />
            </Field>
          </MultiStepFormStep>
          <MultiStepFormStep id="import">
            <p className="text-sm text-muted-foreground">Importing…</p>
          </MultiStepFormStep>
          <MultiStepFormActions />
        </MultiStepForm>
      </div>
    </Wrapper>
  );
}

export function multiStepFormEditing(): ReactNode {
  // Every step is satisfied by the record already loaded, so all of them are reachable: the
  // rail becomes navigable, a deep link opens where it points, and a phone gets the section
  // list. One predicate, four behaviours.
  const steps: MultiStepFormStepSpec[] = [
    { id: "details", label: "Details", satisfied: true },
    { id: "pricing", label: "Pricing", satisfied: true },
    {
      id: "inventory",
      label: "Inventory",
      description: "Low stock",
      satisfied: true,
      warning: true,
    },
    { id: "seo", label: "SEO", satisfied: true, optional: true },
  ];
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-2xl">
        <MultiStepForm
          steps={steps}
          defaultStep="pricing"
          submitLabel="Save changes"
        >
          <MultiStepFormNav aria-label="Edit product" />
          {steps.map((step) => (
            <MultiStepFormStep key={step.id} id={step.id}>
              <p className="text-sm text-muted-foreground">
                The {step.label.toLowerCase()} fields for this product.
              </p>
            </MultiStepFormStep>
          ))}
          <MultiStepFormActions />
        </MultiStepForm>
      </div>
    </Wrapper>
  );
}

export function multiStepFormOptional(): ReactNode {
  const steps: MultiStepFormStepSpec[] = [
    { id: "workspace", label: "Workspace" },
    { id: "invite", label: "Invite your team", optional: true },
    { id: "done", label: "Done" },
  ];
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-2xl">
        <MultiStepForm steps={steps} defaultStep="invite">
          <MultiStepFormNav aria-label="Onboarding" />
          {steps.map((step) => (
            <MultiStepFormStep key={step.id} id={step.id}>
              <p className="text-sm text-muted-foreground">
                {step.label} — press Skip to pass this one over.
              </p>
            </MultiStepFormStep>
          ))}
          <MultiStepFormActions />
        </MultiStepForm>
      </div>
    </Wrapper>
  );
}

export function multiStepFormDialog(): ReactNode {
  const [name, setName] = useState("");
  const steps: MultiStepFormStepSpec[] = [
    { id: "who", label: "People", description: "Who is joining" },
    { id: "role", label: "Role", description: "What they can do" },
    { id: "review", label: "Review" },
  ];
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Invite your team
        </DialogTrigger>
        <DialogContent className="flex max-h-[32rem] flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Invite your team</DialogTitle>
            <DialogDescription>
              The rail and the buttons hold their place; only the middle
              scrolls.
            </DialogDescription>
          </DialogHeader>
          <MultiStepForm
            steps={steps}
            layout="panel"
            dirty={name.trim().length > 0}
            submitLabel="Send invites"
          >
            <MultiStepFormNav aria-label="Invite" />
            <MultiStepFormStep id="who">
              <Field>
                <FieldLabel htmlFor="msf-emails">Email addresses</FieldLabel>
                <Input
                  id="msf-emails"
                  value={name}
                  placeholder="ravi@vegastack.com, sana@vegastack.com"
                  onChange={(event) => setName(event.target.value)}
                />
                <FieldDescription>
                  Type something, then press Cancel to see the exit guard.
                </FieldDescription>
              </Field>
              {Array.from({ length: 6 }, (_, i) => (
                <Field key={i}>
                  <FieldLabel htmlFor={`msf-extra-${i}`}>
                    Optional note {i + 1}
                  </FieldLabel>
                  <Input id={`msf-extra-${i}`} />
                </Field>
              ))}
            </MultiStepFormStep>
            <MultiStepFormStep id="role">
              <Field>
                <FieldLabel htmlFor="msf-role">Role</FieldLabel>
                <Input id="msf-role" defaultValue="Member" />
              </Field>
            </MultiStepFormStep>
            <MultiStepFormStep id="review">
              <p className="text-sm text-muted-foreground">
                {name.trim() || "Nobody yet"} will be invited as a Member.
              </p>
            </MultiStepFormStep>
            <MultiStepFormActions>
              <MultiStepFormExit>Cancel</MultiStepFormExit>
              <div className="flex items-center gap-2">
                <MultiStepFormBack />
                <MultiStepFormNext />
              </div>
            </MultiStepFormActions>
          </MultiStepForm>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

/**
 * DS-23: `sticky` keeps the refusal and the action row in reach while a long step scrolls under
 * them. This frame scrolls on its own so the row pins inside it; `sticky="narrow"` would pin only
 * below the form's `@md` rung.
 */
export function multiStepFormSticky(): ReactNode {
  const steps: MultiStepFormStepSpec[] = [
    { id: "details", label: "Details" },
    { id: "review", label: "Review" },
  ];
  return (
    <Wrapper className="block">
      {/* No bottom padding: the pinned row meets the scroll box's edge, so nothing scrolls
          visibly beneath it. The page surface is the one the row paints. */}
      <div className="mx-auto h-96 w-full max-w-2xl overflow-y-auto rounded-lg border bg-background px-4 pt-4">
        <MultiStepForm steps={steps}>
          <MultiStepFormNav aria-label="Product" />
          {steps.map((step) => (
            <MultiStepFormStep key={step.id} id={step.id}>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 12 }, (_, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {step.label} — paragraph {index + 1} of a long step.
                  </p>
                ))}
              </div>
            </MultiStepFormStep>
          ))}
          <MultiStepFormActions sticky />
        </MultiStepForm>
      </div>
    </Wrapper>
  );
}

const FULL_PAGE_STEPS: MultiStepFormStepSpec[] = [
  { id: "details", label: "Details", description: "Name and code" },
  { id: "pricing", label: "Pricing", description: "List price" },
  { id: "review", label: "Review", description: "Check and create" },
];

/**
 * The full-page flow (DS-55): the step lives in the route, so the page owns `step` and passes
 * `onStepChange(id, { replace })` to its router. A route stand-in plays the router here, and shows
 * the last navigation it received.
 */
function MultiStepFormFullPageDemo(): ReactNode {
  const [route, setRoute] = useState("details");
  const [lastNavigation, setLastNavigation] = useState("none yet");
  const [name, setName] = useState("Skyline pendant");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("240");

  // What `router.push` / `router.replace` would do: move to the step's own URL.
  function navigate(id: string, { replace }: { replace: boolean }) {
    setRoute(id);
    setLastNavigation(`${replace ? "replace" : "push"} /products/new/${id}`);
  }

  const checks = [
    { label: "Product name", done: name.trim() !== "" },
    { label: "Product code", done: code.trim() !== "" },
    { label: "List price", done: Number(price) > 0 },
  ];

  const changeLink = (id: string) => (
    <a
      href={`/products/new/${id}`}
      className="text-sm font-medium underline-offset-4 hover:underline"
      onClick={(event) => {
        event.preventDefault();
        navigate(id, { replace: false });
      }}
    >
      Change
    </a>
  );

  return (
    <AppShellPage size="default" className="px-0 py-0 md:px-0 md:py-0">
      <PageHeader
        title="New product"
        backRender={<a href="/products" />}
        backLabel="Back to Products"
        description={`Route: /products/new/${route} · last navigation: ${lastNavigation}`}
      />
      <MultiStepForm
        steps={FULL_PAGE_STEPS}
        step={route}
        onStepChange={navigate}
        navigable="auto"
        dirty={name !== "Skyline pendant" || code !== "" || price !== "240"}
        layout="flow"
        onExit={() => setLastNavigation("push /products")}
        className="grid gap-6 md:grid-cols-[14rem_1fr]"
      >
        <MultiStepFormNav aria-label="New product" orientation="vertical" />
        <div className="flex min-w-0 flex-col gap-6">
          <MultiStepFormStep id="details">
            <Field>
              <FieldLabel>Product name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Product code</FieldLabel>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
              <FieldDescription>The code on the price list.</FieldDescription>
            </Field>
          </MultiStepFormStep>
          <MultiStepFormStep id="pricing">
            <Field>
              <FieldLabel>List price (USD)</FieldLabel>
              <Input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          </MultiStepFormStep>
          <MultiStepFormStep id="review">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading text-base font-medium">Details</h3>
                {changeLink("details")}
              </div>
              <PropertyList>
                <PropertyRow>
                  <PropertyLabel>Name</PropertyLabel>
                  <PropertyValue>{name || "—"}</PropertyValue>
                </PropertyRow>
                <PropertyRow>
                  <PropertyLabel>Code</PropertyLabel>
                  <PropertyValue>{code || "—"}</PropertyValue>
                </PropertyRow>
              </PropertyList>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading text-base font-medium">Pricing</h3>
                {changeLink("pricing")}
              </div>
              <PropertyList>
                <PropertyRow>
                  <PropertyLabel>List price</PropertyLabel>
                  <PropertyValue className="tabular-nums">
                    {price ? `$${price}` : "—"}
                  </PropertyValue>
                </PropertyRow>
              </PropertyList>
              <ItemGroup aria-label="Before you create" className="gap-1">
                {checks.map((check) => (
                  <Item key={check.label} size="sm">
                    <ItemMedia>
                      {check.done ? (
                        <Check aria-hidden className="text-success-text" />
                      ) : (
                        <X aria-hidden className="text-destructive-text" />
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {check.label}
                        <span className="sr-only">
                          {check.done ? ", done" : ", missing"}
                        </span>
                      </ItemTitle>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            </div>
          </MultiStepFormStep>
          <MultiStepFormActions sticky="narrow">
            <MultiStepFormExit>Exit</MultiStepFormExit>
            <Button
              variant="secondary"
              onClick={() => setLastNavigation("saved a draft")}
            >
              Save draft
            </Button>
            <div className="ms-auto flex gap-2">
              <MultiStepFormBack />
              <MultiStepFormNext />
            </div>
          </MultiStepFormActions>
        </div>
      </MultiStepForm>
    </AppShellPage>
  );
}

export function multiStepFormFullPage(): ReactNode {
  return (
    <Wrapper className="block">
      <MultiStepFormFullPageDemo />
    </Wrapper>
  );
}
