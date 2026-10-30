"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  OptionListEditor,
  type OptionListEditorOption,
} from "@/components/ui/option-list-editor";

export function optionListEditor(): ReactNode {
  const [options, setOptions] = React.useState<OptionListEditorOption[]>([
    { id: "todo", label: "To do", hue: "neutral" },
    { id: "doing", label: "In progress", hue: "blue" },
    { id: "done", label: "Done", hue: "green" },
  ]);
  const [saved, setSaved] = React.useState(options.length);
  return (
    <Wrapper>
      <div className="flex w-80 flex-col gap-2">
        <OptionListEditor
          options={options}
          onChange={setOptions}
          onCommit={(next) => setSaved(next.length)}
        />
        <p className="text-xs text-muted-foreground">
          Saved with {saved} {saved === 1 ? "option" : "options"}.
        </p>
      </div>
    </Wrapper>
  );
}
