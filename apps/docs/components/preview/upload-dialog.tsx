"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadDialog,
  UploadDialogFileRow,
  type UploadDialogFile,
} from "@/components/ui/upload-dialog";

const CATEGORIES = [
  { value: "images", label: "Product images" },
  { value: "ies", label: "IES" },
  { value: "technical", label: "Technical files" },
];
const defaultCategory = (file: File) =>
  file.type.startsWith("image/")
    ? "images"
    : /\.(ies|ldt)$/i.test(file.name)
      ? "ies"
      : "technical";

/**
 * Default — "Add files" opens the dialog: drop or browse, review the files, Next to each file's
 * name and category, then Add. The host keeps the details, keyed by the staged file's id.
 */
export function uploadDialog(): ReactNode {
  const [open, setOpen] = React.useState(false);
  const [details, setDetails] = React.useState<
    Record<string, { name: string; category: string }>
  >({});
  const [added, setAdded] = React.useState<string[]>([]);
  const detailOf = (f: UploadDialogFile) =>
    details[f.id] ?? {
      name: f.file.name.replace(/\.[^.]+$/, ""),
      category: defaultCategory(f.file),
    };
  return (
    <Wrapper className="flex-col items-start gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add files
      </Button>
      {added.length ? (
        <p className="text-sm text-muted-foreground">
          Added: {added.join(", ")}
        </p>
      ) : null}
      <UploadDialog
        open={open}
        onOpenChange={setOpen}
        dropHint="or click to browse — images up to 20 MB, other files up to 500 MB"
        renderDetails={(files) =>
          files.map((f) => {
            const d = detailOf(f);
            const set = (patch: Partial<typeof d>) =>
              setDetails((all) => ({ ...all, [f.id]: { ...d, ...patch } }));
            return (
              <UploadDialogFileRow key={f.id} file={f}>
                <Field>
                  <FieldLabel htmlFor={`${f.id}-name`}>Name</FieldLabel>
                  <Input
                    id={`${f.id}-name`}
                    value={d.name}
                    onChange={(e) => set({ name: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    value={d.category}
                    items={CATEGORIES}
                    onValueChange={(v) => set({ category: String(v) })}
                  >
                    <SelectTrigger aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </UploadDialogFileRow>
            );
          })
        }
        detailsValid={(files) => files.every((f) => detailOf(f).name.trim())}
        onSubmit={(files) => setAdded(files.map((f) => detailOf(f).name))}
      />
    </Wrapper>
  );
}

/**
 * Without details — images have no properties, so the dialog adds straight from the staged list.
 * `maxFiles` caps how many can be staged.
 */
export function uploadDialogImagesOnly(): ReactNode {
  const [open, setOpen] = React.useState(false);
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add images
      </Button>
      <UploadDialog
        open={open}
        onOpenChange={setOpen}
        title="Add images"
        dropTitle="Drop images here"
        dropHint="or click to browse — JPEG, PNG or WebP, up to 20 MB each"
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        maxFiles={4}
        onSubmit={() => {}}
      />
    </Wrapper>
  );
}
