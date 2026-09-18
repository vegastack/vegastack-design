"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { GlobeIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/combobox` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroupAddon } from "@/components/ui/input-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

const frameworks = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro",
] as const;

function FrameworkList(): ReactNode {
  return (
    <ComboboxList>
      {(item: string) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  );
}

export function combobox(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="Select a framework"
            aria-label="Framework"
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxComposition(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="ComboboxInput"
            aria-label="Composition demo"
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

type Framework = { label: string; value: string };

const frameworkObjects: Framework[] = [
  { label: "Next.js", value: "next" },
  { label: "SvelteKit", value: "sveltekit" },
  { label: "Nuxt", value: "nuxt" },
];

const countries = [
  {
    code: "ar",
    value: "argentina",
    label: "Argentina",
    continent: "South America",
  },
  { code: "au", value: "australia", label: "Australia", continent: "Oceania" },
  { code: "br", value: "brazil", label: "Brazil", continent: "South America" },
  { code: "ca", value: "canada", label: "Canada", continent: "North America" },
  { code: "jp", value: "japan", label: "Japan", continent: "Asia" },
  { code: "ke", value: "kenya", label: "Kenya", continent: "Africa" },
  {
    code: "gb",
    value: "united-kingdom",
    label: "United Kingdom",
    continent: "Europe",
  },
];

export function comboboxCustomItems(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox
          items={countries}
          itemToStringValue={(country: (typeof countries)[number]) =>
            country.label
          }
        >
          <ComboboxInput
            placeholder="Search countries..."
            aria-label="Country"
          />
          <ComboboxContent>
            <ComboboxEmpty>No countries found.</ComboboxEmpty>
            <ComboboxList>
              {(country: (typeof countries)[number]) => (
                <ComboboxItem key={country.code} value={country}>
                  <Item size="xs" className="p-0">
                    <ItemContent>
                      <ItemTitle className="whitespace-nowrap">
                        {country.label}
                      </ItemTitle>
                      <ItemDescription>
                        {country.continent} ({country.code})
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxMultipleSelection(): ReactNode {
  const [value, setValue] = React.useState<Framework[]>([]);

  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox
          items={frameworkObjects}
          itemToStringValue={(item: Framework) => item.label}
          multiple
          value={value}
          onValueChange={setValue}
        >
          <ComboboxChips>
            <ComboboxValue>
              {value.map((item) => (
                <ComboboxChip key={item.value}>{item.label}</ComboboxChip>
              ))}
            </ComboboxValue>
            <ComboboxChipsInput
              placeholder="Add framework"
              aria-label="Add framework"
            />
          </ComboboxChips>
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item: Framework) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxBasic(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="Select a framework"
            aria-label="Framework"
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxMultiple(): ReactNode {
  const anchor = useComboboxAnchor();

  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox
          multiple
          autoHighlight
          items={frameworks}
          defaultValue={[frameworks[0]]}
        >
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(values: string[]) => (
                <React.Fragment>
                  {values.map((value) => (
                    <ComboboxChip key={value}>{value}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput aria-label="Add framework" />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxClearButton(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={frameworks} defaultValue={frameworks[0]}>
          <ComboboxInput
            placeholder="Select a framework"
            aria-label="Framework"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

const timezones = [
  {
    value: "Americas",
    items: ["(GMT-5) New York", "(GMT-8) Los Angeles", "(GMT-3) São Paulo"],
  },
  {
    value: "Europe",
    items: ["(GMT+0) London", "(GMT+1) Paris", "(GMT+1) Berlin"],
  },
  {
    value: "Asia/Pacific",
    items: ["(GMT+9) Tokyo", "(GMT+8) Singapore", "(GMT+11) Sydney"],
  },
] as const;

type TimezoneGroup = (typeof timezones)[number];

export function comboboxGroups(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={timezones}>
          <ComboboxInput
            placeholder="Select a timezone"
            aria-label="Timezone"
          />
          <ComboboxContent>
            <ComboboxEmpty>No timezones found.</ComboboxEmpty>
            <ComboboxList>
              {(group: TimezoneGroup, index: number) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                  {index < timezones.length - 1 && <ComboboxSeparator />}
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxInvalid(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field data-invalid className="mx-auto w-full max-w-xs">
        <FieldLabel htmlFor="combobox-invalid">Framework</FieldLabel>
        <Combobox items={frameworks}>
          <ComboboxInput
            id="combobox-invalid"
            placeholder="Select a framework"
            aria-invalid="true"
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
        <FieldError>Choose a framework to continue.</FieldError>
      </Field>
    </Wrapper>
  );
}

export function comboboxDisabled(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="Select a framework"
            aria-label="Framework"
            disabled
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxAutoHighlight(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={frameworks} autoHighlight>
          <ComboboxInput
            placeholder="Select a framework"
            aria-label="Framework"
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxPopup(): ReactNode {
  return (
    <Wrapper>
      <Combobox
        items={countries}
        itemToStringValue={(country: (typeof countries)[number]) =>
          country.label
        }
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-64 justify-between font-normal"
            />
          }
        >
          <ComboboxValue>Select country</ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput
            showTrigger={false}
            placeholder="Search"
            aria-label="Search countries"
          />
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
          <ComboboxList>
            {(country: (typeof countries)[number]) => (
              <ComboboxItem key={country.code} value={country}>
                {country.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Wrapper>
  );
}

export function comboboxInputGroup(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <Combobox items={timezones}>
          <ComboboxInput placeholder="Select a timezone" aria-label="Timezone">
            <InputGroupAddon>
              <GlobeIcon />
            </InputGroupAddon>
          </ComboboxInput>
          <ComboboxContent alignOffset={-28} className="w-60">
            <ComboboxEmpty>No timezones found.</ComboboxEmpty>
            <ComboboxList>
              {(group: TimezoneGroup) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

export function comboboxRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="mx-auto w-full max-w-xs" dir="ltr">
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="Select a framework"
            aria-label="Framework"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
      <div className="mx-auto w-full max-w-xs" dir="rtl">
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="اختر إطار عمل"
            aria-label="إطار العمل"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>لا توجد عناصر.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}

/** Ours: the closed input's rest, invalid and disabled chrome. */
export function comboboxStates(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-xs gap-4">
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="Rest" aria-label="Rest" />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="Invalid"
            aria-label="Invalid"
            aria-invalid="true"
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
        <Combobox items={frameworks}>
          <ComboboxInput
            placeholder="Disabled"
            aria-label="Disabled"
            disabled
          />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <FrameworkList />
          </ComboboxContent>
        </Combobox>
      </div>
    </Wrapper>
  );
}
