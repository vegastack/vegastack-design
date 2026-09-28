"use client";

import { type ReactNode, useState } from "react";
import { CircleAlert, Package } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  RecordDiff,
  RecordList,
  RecordListGroup,
  RecordListItem,
  RecordListMore,
} from "@/components/ui/record-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { RecordTabCount } from "@/components/ui/record-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRODUCTS = Array.from({ length: 23 }, (_, i) => ({
  id: `p${i + 1}`,
  name: [
    "Orbit Track 30W",
    "Halo Downlight 12W",
    "Linea Profile 2m",
    "Nova Pendant",
    "Arc Wall Washer",
  ][i % 5]!.concat(i >= 5 ? ` · ${Math.floor(i / 5) + 1}` : ""),
  draft: i % 4 === 1,
  issue: i % 3 === 0 ? "Missing beam angle" : undefined,
}));

/** The affected records in a confirmation: numbered, a muted type icon, name, ↗ link, badge. */
export function recordList(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-md">
        <RecordList aria-label="Affected products">
          {PRODUCTS.slice(0, 4).map((p) => (
            <RecordListItem
              key={p.id}
              icon={<Package />}
              title={p.name}
              href={`#${p.id}`}
              badge={p.draft ? <Badge variant="secondary">Draft</Badge> : null}
              description={p.issue}
            />
          ))}
        </RecordList>
      </div>
    </Wrapper>
  );
}

/** "Show more" appends to the same list, so the numbers continue: 1–10, then 11–20. */
export function recordListShowMore(): ReactNode {
  const [shown, setShown] = useState(10);
  return (
    <Wrapper className="block">
      <div className="mx-auto flex max-h-96 w-full max-w-md flex-col gap-2 overflow-y-auto">
        <RecordList aria-label="Affected products">
          {PRODUCTS.slice(0, shown).map((p) => (
            <RecordListItem
              key={p.id}
              icon={<Package />}
              title={p.name}
              href={`#${p.id}`}
            />
          ))}
        </RecordList>
        <RecordListMore
          remaining={PRODUCTS.length - shown}
          onShowMore={() => setShown((n) => n + 10)}
        />
      </div>
    </Wrapper>
  );
}

/* ------------------------------------------------------------- patterns */

const REMOVE = Array.from({ length: 758 }, (_, i) => ({
  id: `d${i + 1}`,
  name: `Alpha 86mm · ${[6, 10, 15][i % 3]}W · ${["2700K", "3000K", "4000K"][i % 3]} · ${["Black", "White"][i % 2]}`,
}));
const STAY = [
  {
    id: "s1",
    name: "Alpha 86mm · 10W · 3000K · Black",
    reason: "Edited by Ravi",
  },
  {
    id: "s2",
    name: "Alpha 86mm · 10W · 4000K · White",
    reason: "Moved to Active",
  },
  {
    id: "s3",
    name: "Alpha 86mm · 15W · 2700K · Black",
    reason: "Edited by Sana",
  },
  {
    id: "s4",
    name: "Alpha 86mm · 6W · 3000K · White",
    reason: "Has a data sheet",
  },
  {
    id: "s5",
    name: "Alpha 86mm · 15W · 4000K · Black",
    reason: "Moved to Active",
  },
  {
    id: "s6",
    name: "Alpha 86mm · 6W · 2700K · White",
    reason: "Edited by Ravi",
  },
];

/**
 * The review list dialog: a title, one plain line, pill tabs with a count each, a numbered list
 * that scrolls under the fixed header, and the footer's Cancel + the destructive action.
 */
export function recordListReviewDialog(): ReactNode {
  const [shown, setShown] = useState(20);
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Undo this run
        </DialogTrigger>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Undo this run?</DialogTitle>
            <DialogDescription>
              758 draft products will be removed. 6 stay because someone changed
              them.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="remove" className="min-h-0">
            <TabsList>
              <TabsTrigger value="remove">
                Will be removed <RecordTabCount count={REMOVE.length} />
              </TabsTrigger>
              <TabsTrigger value="stay">
                Will stay <RecordTabCount count={STAY.length} />
              </TabsTrigger>
            </TabsList>
            <DialogBody>
              <TabsContent value="remove" className="flex flex-col gap-2">
                <RecordList aria-label="Products that will be removed">
                  {REMOVE.slice(0, shown).map((p) => (
                    <RecordListItem
                      key={p.id}
                      icon={<Package />}
                      title={p.name}
                      href={`#${p.id}`}
                    />
                  ))}
                </RecordList>
                <RecordListMore
                  remaining={REMOVE.length - shown}
                  onShowMore={() => setShown((n) => n + 20)}
                />
              </TabsContent>
              <TabsContent value="stay">
                <RecordList aria-label="Products that will stay">
                  {STAY.map((p) => (
                    <RecordListItem
                      key={p.id}
                      icon={<Package />}
                      title={p.name}
                      description={p.reason}
                      href={`#${p.id}`}
                    />
                  ))}
                </RecordList>
              </TabsContent>
            </DialogBody>
          </Tabs>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive">Remove 758 products</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

/**
 * A single conflict: what happened, one plain line, the clashing record with its ↗ link, and the
 * compact "what differs" table — the choices match, so the product counts as the same.
 */
export function recordListConflict(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-lg">
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>This product already exists</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>
              Every choice matches a product in this family. Change at least one
              choice to save it.
            </p>
            <RecordList aria-label="Matching product">
              <RecordListItem
                icon={<Package />}
                title="Alpha 86mm · 10W · 3000K · Black"
                description="Active · created by the generator"
                href="#p-existing"
              />
            </RecordList>
            <RecordDiff
              columns={["This product", "Existing product"]}
              rows={[
                { label: "Power", values: ["10W", "10W"] },
                { label: "Colour temperature", values: ["3000K", "3000K"] },
                { label: "Trim", values: ["Black", "Black"] },
                { label: "Beam angle", values: ["24°", "24°"] },
                { label: "Lumen output", values: ["980 lm", "1,020 lm"] },
                { label: "Cable length", values: ["", "2 m"] },
              ]}
            />
          </AlertDescription>
        </Alert>
      </div>
    </Wrapper>
  );
}

/**
 * Grouped conflicts: a save that would make several sets of records identical lists each set
 * under its own heading, numbered, with ↗ links, so the reader can fix them first.
 */
export function recordListConflictGroups(): ReactNode {
  const groups = [
    [
      "Alpha 86mm · 10W · 3000K · Black · 24°",
      "Alpha 86mm · 10W · 3000K · Black · 36°",
      "Alpha 86mm · 10W · 3000K · Black · 60°",
    ],
    [
      "Alpha 86mm · 15W · 4000K · White · 24°",
      "Alpha 86mm · 15W · 4000K · White · 36°",
    ],
  ];
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-lg">
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Can't save these settings</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>
              Without Beam angle, the products in each group below would be
              identical. Delete or change them first.
            </p>
            {groups.map((names, g) => (
              <RecordListGroup
                key={g}
                title={`Group ${g + 1} · ${names.length} products`}
              >
                <RecordList aria-label={`Group ${g + 1}`}>
                  {names.map((name, i) => (
                    <RecordListItem
                      key={name}
                      icon={<Package />}
                      title={name}
                      href={`#g${g}-${i}`}
                    />
                  ))}
                </RecordList>
              </RecordListGroup>
            ))}
          </AlertDescription>
        </Alert>
      </div>
    </Wrapper>
  );
}
