"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { TemplateEditorToken } from "@/components/ui/template-editor";
import { Wrapper } from "./wrapper";

// TemplateEditor pulls in Tiptap; keep it out of the all-preview barrel's initial module graph.
const TemplateEditor = dynamic(
  () =>
    import("@/components/ui/template-editor").then(
      (module) => module.TemplateEditor,
    ),
  { ssr: false },
);

const SPECS: TemplateEditorToken[] = [
  { id: "power", label: "Power", hint: "W" },
  { id: "efficacy", label: "Efficacy", hint: "lm/W" },
  { id: "lumens", label: "Luminous flux", hint: "lm" },
  { id: "cct", label: "Colour temperature", hint: "K" },
  { id: "cri", label: "CRI", hint: "Ra" },
  { id: "beam", label: "Beam angle", hint: "°" },
  { id: "ip", label: "IP rating", hint: "Protection" },
  { id: "cutout", label: "Cut-out", hint: "mm" },
];

/**
 * A marketing paragraph with spec placeholders. Type `@` or `{{` to pick one; the stored string
 * underneath is what `onChange` receives.
 */
export function templateEditor(): ReactNode {
  const [value, setValue] = useState(
    "Recessed {{power}} downlight with {{efficacy}} efficacy and {{cri}} colour rendering.\n\nFits a {{cutout}} cut-out.",
  );
  return (
    <Wrapper className="flex-col items-stretch">
      <Field>
        <FieldLabel>Marketing description</FieldLabel>
        <TemplateEditor
          value={value}
          onChange={setValue}
          tokens={SPECS}
          placeholder="Type @ to insert a spec"
        />
        <FieldDescription>
          Type @ or {"{{"} to insert a spec. Enter starts a new paragraph.
        </FieldDescription>
      </Field>
      <pre className="min-w-0 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
        {value}
      </pre>
    </Wrapper>
  );
}

/** Empty, with the placeholder showing. */
export function templateEditorEmpty(): ReactNode {
  const [value, setValue] = useState("");
  return (
    <Wrapper className="flex-col items-stretch">
      <TemplateEditor
        aria-label="Product description"
        value={value}
        onChange={setValue}
        tokens={SPECS}
        placeholder="Recessed @Power downlight with @Efficacy…"
      />
    </Wrapper>
  );
}

/**
 * A placeholder the caller rejects (`invalidTokenIds`) and one whose id is not in `tokens` both
 * render in the destructive style; the unknown one shows its raw id, so nothing is lost.
 */
export function templateEditorInvalidTokens(): ReactNode {
  const [value, setValue] = useState(
    "Rated {{power}} at {{cct}}, with a {{finish}} finish.",
  );
  return (
    <Wrapper className="flex-col items-stretch">
      <Field>
        <FieldLabel>Short description</FieldLabel>
        <TemplateEditor
          value={value}
          onChange={setValue}
          tokens={SPECS}
          invalidTokenIds={["cct"]}
        />
        <FieldDescription>
          Colour temperature has no value on this product, and “finish” is not a
          spec.
        </FieldDescription>
      </Field>
    </Wrapper>
  );
}

/** Invalid (a destructive border, focused or not) and disabled, like `Textarea`. */
export function templateEditorStates(): ReactNode {
  const [value, setValue] = useState("");
  return (
    <Wrapper className="flex-col items-stretch">
      <Field data-invalid>
        <FieldLabel>Description</FieldLabel>
        <TemplateEditor
          value={value}
          onChange={setValue}
          tokens={SPECS}
          placeholder="Required"
        />
        <FieldError>Add a description.</FieldError>
      </Field>
      <Field>
        <FieldLabel>Family description</FieldLabel>
        <TemplateEditor
          value="Recessed {{power}} downlight with {{efficacy}} efficacy."
          onChange={() => {}}
          tokens={SPECS}
          disabled
        />
      </Field>
    </Wrapper>
  );
}
