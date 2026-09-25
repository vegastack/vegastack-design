"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/dialog` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DirectionProvider } from "@/components/ui/direction";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Every fixture stays CLOSED at rest: the trigger is the component's real entry point, and the
 * geometry lane mounts each fixture as-is, so an overlay that opened itself would cover the page.
 */

/** The paragraph upstream repeats to give a dialog more content than it has room for. */
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

export function dialog(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <form>
          <DialogTrigger render={<Button variant="outline" />}>
            Open Dialog
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="dialog-name">Name</FieldLabel>
                <Input
                  id="dialog-name"
                  name="name"
                  defaultValue="Pedro Duarte"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="dialog-username">Username</FieldLabel>
                <Input
                  id="dialog-username"
                  name="username"
                  defaultValue="@peduarte"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="secondary" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </Wrapper>
  );
}

export function dialogComposition(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Open
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Cancel
            </DialogClose>
            <Button>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export function dialogCustomCloseButton(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Share
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share link</DialogTitle>
            <DialogDescription>
              Anyone who has this link will be able to view this.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-2">
              <FieldLabel htmlFor="dialog-link" className="sr-only">
                Link
              </FieldLabel>
              <Input
                id="dialog-link"
                defaultValue="https://design.vegastack.com/docs/components/dialog"
                readOnly
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose render={<Button type="button" />}>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export function dialogNoCloseButton(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          No Close Button
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No Close Button</DialogTitle>
            <DialogDescription>
              This dialog doesn&apos;t have a close button in the top-right
              corner.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export function dialogStickyFooter(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Sticky Footer
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sticky Footer</DialogTitle>
            <DialogDescription>
              This dialog has a sticky footer that stays visible while the
              content scrolls.
            </DialogDescription>
          </DialogHeader>
          <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <p key={index} className="mb-4 leading-normal">
                {LOREM}
              </p>
            ))}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export function dialogScrollableContent(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Scrollable Content
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scrollable Content</DialogTitle>
            <DialogDescription>
              This is a dialog with scrollable content.
            </DialogDescription>
          </DialogHeader>
          <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <p key={index} className="mb-4 leading-normal">
                {LOREM}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export function dialogSizes(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-wrap gap-2">
        {(["sm", "default", "lg", "xl"] as const).map((size) => (
          <Dialog key={size}>
            <DialogTrigger render={<Button variant="outline" />}>
              {size}
            </DialogTrigger>
            <DialogContent size={size}>
              <DialogHeader>
                <DialogTitle>size=&quot;{size}&quot;</DialogTitle>
                <DialogDescription>
                  The width cap steps with the size; below the sm breakpoint
                  every size fills the viewport less a 1rem gutter.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="secondary" />}>
                  Close
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </Wrapper>
  );
}

export function dialogRtl(): ReactNode {
  return (
    <Wrapper>
      <DirectionProvider direction="ltr">
        <div dir="ltr">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Open Dialog
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="secondary" />}>
                  Cancel
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DirectionProvider>
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              فتح الحوار
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm" dir="rtl">
              <DialogHeader>
                <DialogTitle>تعديل الملف الشخصي</DialogTitle>
                <DialogDescription>
                  قم بإجراء تغييرات على ملفك الشخصي هنا. انقر فوق حفظ عند
                  الانتهاء.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="secondary" />}>
                  إلغاء
                </DialogClose>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DirectionProvider>
    </Wrapper>
  );
}

export function dialogScrollingBody(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Edit attributes
        </DialogTrigger>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Edit attributes</DialogTitle>
            <DialogDescription>
              The body scrolls; the header and the footer stay in view.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              {Array.from({ length: 12 }, (_, index) => (
                <Field key={index}>
                  <FieldLabel htmlFor={`dialog-body-field-${index}`}>
                    Attribute {index + 1}
                  </FieldLabel>
                  <Input id={`dialog-body-field-${index}`} />
                </Field>
              ))}
            </FieldGroup>
          </DialogBody>
          <DialogFooter showCloseButton closeLabel="Cancel">
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
