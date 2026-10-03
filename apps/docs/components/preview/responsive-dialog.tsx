"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";

/** A members dialog: a Dialog on wide screens, a bottom sheet on a phone — no layout code. */
export function responsiveDialog(): ReactNode {
  return (
    <Wrapper>
      <ResponsiveDialog>
        <ResponsiveDialogTrigger render={<Button variant="outline" />}>
          Members
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent size="md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Members · Product</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Resize the window across 768px: the container swaps between a
              dialog and a bottom sheet.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <Input aria-label="Find a member" placeholder="Find a member…" />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose render={<Button variant="secondary" />}>
              Cancel
            </ResponsiveDialogClose>
            <Button>Add</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Wrapper>
  );
}

/** Every Dialog size step applies from 768px up; the phone sheet is always full width. */
export function responsiveDialogSizes(): ReactNode {
  return (
    <Wrapper>
      {(["default", "md", "lg"] as const).map((size) => (
        <ResponsiveDialog key={size}>
          <ResponsiveDialogTrigger render={<Button variant="outline" />}>
            {size}
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent size={size}>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>
                size=&quot;{size}&quot;
              </ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose render={<Button variant="secondary" />}>
                Close
              </ResponsiveDialogClose>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      ))}
    </Wrapper>
  );
}
