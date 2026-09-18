"use client";

import { type ReactNode, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDown,
  FileIcon,
  FolderIcon,
  MaximizeIcon,
  MinimizeIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/collapsible` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DirectionProvider } from "@/components/ui/direction";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/*
 * Upstream's own examples, adapted only for import paths, for RTL (upstream's `useTranslation` and
 * `language-selector` do not exist here), and for the one Radix-era selector upstream's File Tree
 * still carries — Base UI's trigger marks itself `data-panel-open`, which is the form upstream's
 * own Basic example uses.
 */

export function collapsible(): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Wrapper>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex w-full max-w-[350px] flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-4 px-4">
          <h4 className="text-sm font-semibold">Order 4189-B</h4>
          <CollapsibleTrigger
            render={<Button variant="ghost" size="icon" className="size-8" />}
          >
            <ChevronsUpDown />
            <span className="sr-only">Toggle details</span>
          </CollapsibleTrigger>
        </div>
        <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">Shipped</span>
        </div>
        <CollapsibleContent className="flex flex-col gap-2">
          <div className="rounded-md border px-4 py-2 text-sm">
            <p className="font-medium">Shipping address</p>
            <p className="text-muted-foreground">
              100 Market St, San Francisco
            </p>
          </div>
          <div className="rounded-md border px-4 py-2 text-sm">
            <p className="font-medium">Items</p>
            <p className="text-muted-foreground">2x Studio Headphones</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Wrapper>
  );
}

export function collapsibleComposition(): ReactNode {
  return (
    <Wrapper>
      <Collapsible className="flex w-full max-w-[350px] flex-col gap-2">
        <CollapsibleTrigger render={<Button variant="outline" />}>
          Can I use this in my project?
        </CollapsibleTrigger>
        <CollapsibleContent className="text-sm text-muted-foreground">
          Yes. Free to use for personal and commercial projects. No attribution
          required.
        </CollapsibleContent>
      </Collapsible>
    </Wrapper>
  );
}

export function collapsibleControlledState(): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <p className="text-sm text-muted-foreground">
        State owned by the parent:{" "}
        <span className="font-mono text-foreground">{String(open)}</span>
      </p>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="flex w-full max-w-[350px] flex-col gap-2 self-center"
      >
        <CollapsibleTrigger render={<Button variant="outline" />}>
          Toggle
        </CollapsibleTrigger>
        <CollapsibleContent className="text-sm text-muted-foreground">
          The panel follows `open`, and every toggle is reported through
          `onOpenChange` — which is what lets a second control drive the same
          panel.
        </CollapsibleContent>
      </Collapsible>
    </Wrapper>
  );
}

export function collapsibleBasic(): ReactNode {
  return (
    <Wrapper>
      <Card className="mx-auto w-full max-w-sm">
        <CardContent>
          <Collapsible className="rounded-md data-open:bg-muted">
            <CollapsibleTrigger
              render={<Button variant="ghost" className="w-full" />}
            >
              Product details
              <ChevronDownIcon className="ml-auto group-data-panel-open/button:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
              <div>
                This panel can be expanded or collapsed to reveal additional
                content.
              </div>
              <Button size="xs">Learn More</Button>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export function collapsibleSettingsPanel(): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Wrapper>
      <Card className="mx-auto w-full max-w-xs" size="sm">
        <CardHeader>
          <CardTitle>Radius</CardTitle>
          <CardDescription>
            Set the corner radius of the element.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="flex items-start gap-2"
          >
            <FieldGroup className="grid w-full grid-cols-2 gap-2">
              <Field>
                <FieldLabel htmlFor="radius-x" className="sr-only">
                  Radius X
                </FieldLabel>
                <Input id="radius-x" placeholder="0" defaultValue={0} />
              </Field>
              <Field>
                <FieldLabel htmlFor="radius-y" className="sr-only">
                  Radius Y
                </FieldLabel>
                <Input id="radius-y" placeholder="0" defaultValue={0} />
              </Field>
              <CollapsibleContent className="col-span-full grid grid-cols-subgrid gap-2">
                <Field>
                  <FieldLabel htmlFor="radius-x2" className="sr-only">
                    Radius X, second corner
                  </FieldLabel>
                  <Input id="radius-x2" placeholder="0" defaultValue={0} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="radius-y2" className="sr-only">
                    Radius Y, second corner
                  </FieldLabel>
                  <Input id="radius-y2" placeholder="0" defaultValue={0} />
                </Field>
              </CollapsibleContent>
            </FieldGroup>
            <CollapsibleTrigger
              render={<Button variant="outline" size="icon" />}
            >
              {isOpen ? <MinimizeIcon /> : <MaximizeIcon />}
              <span className="sr-only">
                {isOpen ? "Show fewer corners" : "Show every corner"}
              </span>
            </CollapsibleTrigger>
          </Collapsible>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

type FileTreeItem = { name: string } | { name: string; items: FileTreeItem[] };

const fileTree: FileTreeItem[] = [
  {
    name: "components",
    items: [
      {
        name: "ui",
        items: [
          { name: "button.tsx" },
          { name: "card.tsx" },
          { name: "dialog.tsx" },
        ],
      },
      { name: "login-form.tsx" },
    ],
  },
  {
    name: "lib",
    items: [{ name: "utils.ts" }, { name: "cn.ts" }],
  },
  { name: "app.tsx" },
  { name: "package.json" },
];

function renderFileTreeItem(fileItem: FileTreeItem): ReactNode {
  if ("items" in fileItem) {
    return (
      <Collapsible key={fileItem.name}>
        <CollapsibleTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start transition-none hover:bg-accent hover:text-accent-foreground"
            />
          }
        >
          <ChevronRightIcon className="transition-transform group-data-panel-open/button:rotate-90" />
          <FolderIcon />
          {fileItem.name}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 ml-5">
          <div className="flex flex-col gap-1">
            {fileItem.items.map((child) => renderFileTreeItem(child))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  return (
    <Button
      key={fileItem.name}
      variant="link"
      size="sm"
      className="w-full justify-start gap-2 text-foreground"
    >
      <FileIcon />
      <span>{fileItem.name}</span>
    </Button>
  );
}

export function collapsibleFileTree(): ReactNode {
  return (
    <Wrapper>
      <Card className="mx-auto w-full max-w-[16rem] gap-2" size="sm">
        <CardHeader>
          <Tabs defaultValue="explorer">
            <TabsList className="w-full">
              <TabsTrigger value="explorer">Explorer</TabsTrigger>
              <TabsTrigger value="outline">Outline</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {fileTree.map((item) => renderFileTreeItem(item))}
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

/** Upstream drives its RTL copy through `useTranslation`; the Arabic strings are inline here. */
const arabic = {
  orderNumber: "الطلب 4189-B",
  status: "الحالة",
  shipped: "تم الشحن",
  shippingAddress: "عنوان الشحن",
  address: "100 Market St, San Francisco",
  items: "العناصر",
  itemsDescription: "2x سماعات الاستوديو",
  toggle: "تبديل التفاصيل",
};

export function collapsibleRtl(): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DirectionProvider direction="rtl">
      <Wrapper dir="rtl">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="flex w-full max-w-[350px] flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-4 px-4">
            <h4 className="text-sm font-semibold">{arabic.orderNumber}</h4>
            <CollapsibleTrigger
              render={<Button variant="ghost" size="icon" className="size-8" />}
            >
              <ChevronsUpDown />
              <span className="sr-only">{arabic.toggle}</span>
            </CollapsibleTrigger>
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
            <span className="text-muted-foreground">{arabic.status}</span>
            <span className="font-medium">{arabic.shipped}</span>
          </div>
          <CollapsibleContent className="flex flex-col gap-2">
            <div className="rounded-md border px-4 py-2 text-sm">
              <p className="font-medium">{arabic.shippingAddress}</p>
              <p className="text-muted-foreground">{arabic.address}</p>
            </div>
            <div className="rounded-md border px-4 py-2 text-sm">
              <p className="font-medium">{arabic.items}</p>
              <p className="text-muted-foreground">{arabic.itemsDescription}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Wrapper>
    </DirectionProvider>
  );
}
