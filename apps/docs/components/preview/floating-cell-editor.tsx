"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { FieldCellEditor } from "@/components/ui/field-cell";
import { FloatingCellEditor } from "@/components/ui/floating-cell-editor";

export function floatingCellEditor(): ReactNode {
  const [value, setValue] = React.useState("Quarterly planning notes");
  const [editing, setEditing] = React.useState(false);
  return (
    <Wrapper>
      <div className="w-72 rounded-lg border border-border">
        <div
          role="gridcell"
          className="flex h-9 items-center justify-between gap-2 px-3 text-sm"
        >
          {editing ? (
            <FloatingCellEditor
              size="text"
              onDismiss={() => setEditing(false)}
              face={<span className="truncate">{value}</span>}
            >
              <FieldCellEditor
                variant="cell"
                type="text"
                label="Title"
                value={value}
                onCommit={(next) => {
                  setValue(String(next ?? ""));
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            </FloatingCellEditor>
          ) : (
            <>
              <span className="truncate">{value}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
