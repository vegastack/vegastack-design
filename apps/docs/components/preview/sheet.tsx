"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/sheet` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetAction,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Every fixture stays CLOSED at rest: a sheet covers a whole screen edge, and the geometry lane
 * mounts each fixture as-is.
 */

/** The paragraph upstream repeats to give the panel more content than it has room for. */
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

const SHEET_SIDES = ["top", "right", "bottom", "left"] as const;

export function sheet(): ReactNode {
  return (
    <Wrapper>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </SheetDescription>
          </SheetHeader>
          <FieldGroup className="px-4">
            <Field>
              <FieldLabel htmlFor="sheet-demo-name">Name</FieldLabel>
              <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
            </Field>
            <Field>
              <FieldLabel htmlFor="sheet-demo-username">Username</FieldLabel>
              <Input id="sheet-demo-username" defaultValue="@peduarte" />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit">Save changes</Button>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Wrapper>
  );
}

export function sheetComposition(): ReactNode {
  return (
    <Wrapper>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Are you absolutely sure?</SheetTitle>
            <SheetDescription>This action cannot be undone.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>
              Cancel
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Wrapper>
  );
}

export function sheetSide(): ReactNode {
  return (
    <Wrapper>
      {SHEET_SIDES.map((side) => (
        <Sheet key={side}>
          <SheetTrigger
            render={<Button variant="outline" className="capitalize" />}
          >
            {side}
          </SheetTrigger>
          <SheetContent
            side={side}
            className="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
          >
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </SheetDescription>
            </SheetHeader>
            <div className="no-scrollbar overflow-y-auto px-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <p key={index} className="mb-2 leading-relaxed">
                  {LOREM}
                </p>
              ))}
            </div>
            <SheetFooter>
              <Button type="submit">Save changes</Button>
              <SheetClose render={<Button variant="outline" />}>
                Cancel
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </Wrapper>
  );
}

export function sheetNoCloseButton(): ReactNode {
  return (
    <Wrapper>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Open Sheet
        </SheetTrigger>
        <SheetContent showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>No Close Button</SheetTitle>
            <SheetDescription>
              This sheet doesn&apos;t have a close button in the top-right
              corner.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Wrapper>
  );
}

export function sheetRtl(): ReactNode {
  return (
    <Wrapper>
      <DirectionProvider direction="ltr">
        <div dir="ltr">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>
              Open
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </SheetDescription>
              </SheetHeader>
              <FieldGroup className="px-4">
                <Field>
                  <FieldLabel htmlFor="sheet-ltr-name">Name</FieldLabel>
                  <Input id="sheet-ltr-name" defaultValue="Pedro Duarte" />
                </Field>
              </FieldGroup>
              <SheetFooter>
                <Button type="submit">Save changes</Button>
                <SheetClose render={<Button variant="outline" />}>
                  Close
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </DirectionProvider>
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>
              فتح
            </SheetTrigger>
            <SheetContent side="left" dir="rtl">
              <SheetHeader>
                <SheetTitle>تعديل الملف الشخصي</SheetTitle>
                <SheetDescription>
                  قم بإجراء تغييرات على ملفك الشخصي هنا. انقر حفظ عند الانتهاء.
                </SheetDescription>
              </SheetHeader>
              <FieldGroup className="px-4">
                <Field>
                  <FieldLabel htmlFor="sheet-rtl-name">الاسم</FieldLabel>
                  <Input id="sheet-rtl-name" defaultValue="آدا لوفلايس" />
                </Field>
              </FieldGroup>
              <SheetFooter>
                <Button type="submit">حفظ التغييرات</Button>
                <SheetClose render={<Button variant="outline" />}>
                  إغلاق
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </DirectionProvider>
    </Wrapper>
  );
}

export function sheetSizes(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-wrap gap-2">
        {(["sm", "default", "lg", "xl"] as const).map((size) => (
          <Sheet key={size}>
            <SheetTrigger render={<Button variant="outline" />}>
              {size}
            </SheetTrigger>
            <SheetContent size={size}>
              <SheetHeader>
                <SheetTitle>size=&quot;{size}&quot;</SheetTitle>
                <SheetDescription>
                  A side sheet steps Dialog&apos;s width scale from the sm
                  breakpoint up; below it every size is full width.
                </SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <SheetClose render={<Button variant="outline" />}>
                  Close
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    </Wrapper>
  );
}

export function sheetScrollingBody(): ReactNode {
  return (
    <Wrapper>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Edit record
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit record</SheetTitle>
            <SheetDescription>
              The body scrolls; the header and the footer stay put.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <FieldGroup>
              {Array.from({ length: 10 }, (_, index) => (
                <Field key={index}>
                  <FieldLabel htmlFor={`sheet-body-field-${index}`}>
                    Field {index + 1}
                  </FieldLabel>
                  <Input id={`sheet-body-field-${index}`} />
                </Field>
              ))}
            </FieldGroup>
          </SheetBody>
          <SheetFooter>
            <Button type="submit">Save changes</Button>
            <SheetClose render={<Button variant="outline" />}>
              Cancel
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Wrapper>
  );
}

export function sheetHeaderAction(): ReactNode {
  return (
    <Wrapper>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Open invoice
        </SheetTrigger>
        <SheetContent closeLabel="Close invoice">
          <SheetHeader>
            <SheetTitle>Invoice INV-2041</SheetTitle>
            <SheetDescription>
              Issued 12 September, due in 30 days.
            </SheetDescription>
            <SheetAction>
              <Button size="sm" variant="outline">
                Duplicate
              </Button>
            </SheetAction>
          </SheetHeader>
          <SheetBody>
            <p className="leading-relaxed">{LOREM}</p>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </Wrapper>
  );
}
