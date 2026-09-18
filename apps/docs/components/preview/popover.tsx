"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/popover` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

/*
 * Every fixture here renders CLOSED. A Popover is a dismissible surface anchored to its trigger, so
 * the trigger is the component's resting state and opening it is the reader's move — which is also
 * what upstream's own docs show. The geometry lane mounts all of these, and an open portal would
 * measure the popup rather than the control.
 */

export function popover(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>
          Open popover
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
          <FieldGroup className="gap-3">
            <Field orientation="horizontal">
              <FieldLabel htmlFor="popover-width" className="w-1/2">
                Width
              </FieldLabel>
              <Input id="popover-width" defaultValue="100%" />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="popover-max-width" className="w-1/2">
                Max. width
              </FieldLabel>
              <Input id="popover-max-width" defaultValue="300px" />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="popover-height" className="w-1/2">
                Height
              </FieldLabel>
              <Input id="popover-height" defaultValue="25px" />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="popover-max-height" className="w-1/2">
                Max. height
              </FieldLabel>
              <Input id="popover-max-height" defaultValue="none" />
            </Field>
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverComposition(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>
          Open Popover
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Title</PopoverTitle>
            <PopoverDescription>Description text here.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverBasic(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" className="w-fit" />}>
          Open Popover
        </PopoverTrigger>
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverAlign(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>
          Start
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40">
          Aligned to start
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>
          Center
        </PopoverTrigger>
        <PopoverContent align="center" className="w-40">
          Aligned to center
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>
          End
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40">
          Aligned to end
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverWithForm(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>
          Open Popover
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
          <FieldGroup className="gap-4">
            <Field orientation="horizontal">
              <FieldLabel htmlFor="popover-form-width" className="w-1/2">
                Width
              </FieldLabel>
              <Input id="popover-form-width" defaultValue="100%" />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="popover-form-height" className="w-1/2">
                Height
              </FieldLabel>
              <Input id="popover-form-height" defaultValue="25px" />
            </Field>
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

/** Physical sides stay put under RTL; the two logical sides swap with the reading direction. */
const physicalSides = ["left", "top", "bottom", "right"] as const;
const logicalSides = ["inline-start", "inline-end"] as const;

const arabic: Record<string, string> = {
  title: "الأبعاد",
  description: "تعيين الأبعاد للطبقة.",
  left: "يسار",
  top: "أعلى",
  bottom: "أسفل",
  right: "يمين",
  "inline-start": "بداية السطر",
  "inline-end": "نهاية السطر",
};

export function popoverRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper className="flex-col gap-4" dir="rtl">
        <div className="flex flex-wrap justify-center gap-2">
          {physicalSides.map((side) => (
            <Popover key={side}>
              <PopoverTrigger render={<Button variant="outline" />}>
                {arabic[side]}
              </PopoverTrigger>
              {/* `dir` on the content too: the popup portals out of the `dir="rtl"` subtree, so
                  the attribute has to travel with it or the text renders left-to-right. */}
              <PopoverContent side={side} dir="rtl">
                <PopoverHeader>
                  <PopoverTitle>{arabic.title}</PopoverTitle>
                  <PopoverDescription>{arabic.description}</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {logicalSides.map((side) => (
            <Popover key={side}>
              <PopoverTrigger render={<Button variant="outline" />}>
                {arabic[side]}
              </PopoverTrigger>
              <PopoverContent side={side} dir="rtl">
                <PopoverHeader>
                  <PopoverTitle>{arabic.title}</PopoverTitle>
                  <PopoverDescription>{arabic.description}</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </Wrapper>
    </DirectionProvider>
  );
}
