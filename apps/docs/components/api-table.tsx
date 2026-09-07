import type { ReactNode } from "react";
import { getApiDocs, noOwnPropsSentence, type ApiEntry } from "@/lib/api-table";
import {
  getContractRecord,
  type ContractDataAttributes,
} from "@/lib/contracts";

/**
 * Render the subset of Markdown the JSDoc descriptions actually use — inline code. Anything else
 * stays literal text, which is exactly what the markdown export emits, so the two surfaces agree.
 */
export function inlineCode(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean);
  if (parts.length === 1 && !parts[0].startsWith("`")) return text;
  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={index}>{part.slice(1, -1)}</code>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export interface ApiTableProps {
  /** Source file, relative to `apps/docs` — `../../packages/ui/registry/ui/button.tsx`. */
  path: string;
  /** Exported props type — `ButtonProps`. */
  name: string;
}

/**
 * The registry item name a props table belongs to, from its source path. Used to look up the
 * contract's `dataAttributes` for the part; a page documenting a type from outside the registry
 * (a hook, a block) simply has no data-attribute table.
 */
function registryNameFromPath(path: string) {
  const match = /\/registry\/ui\/([\w-]+)\.tsx?$/.exec(path);
  return match?.[1];
}

export function lookupDataAttributes(
  path: string,
  part: string,
): ContractDataAttributes | undefined {
  const registryName = registryNameFromPath(path);
  if (!registryName) return undefined;
  const record = getContractRecord(registryName);
  const attributes = record.dataAttributes?.[part];
  if (
    !attributes ||
    (attributes.attributes.length === 0 && attributes.cssVariables.length === 0)
  ) {
    return undefined;
  }
  return attributes;
}

function PropsRows({ entries }: { entries: ApiEntry[] }) {
  return (
    <table className="vs-api-table">
      <thead>
        <tr>
          <th scope="col">Prop</th>
          <th scope="col">Type</th>
          <th scope="col">Default</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.name} data-deprecated={entry.deprecated || undefined}>
            <td>
              <code>{entry.name}</code>
              {entry.required ? (
                <span className="ms-1 text-destructive-text" title="Required">
                  *
                </span>
              ) : null}
            </td>
            <td>
              <code className="whitespace-pre-wrap break-words">
                {entry.type}
              </code>
            </td>
            <td>
              {entry.defaultValue ? (
                <code>{entry.defaultValue}</code>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td>
              {entry.deprecated ? (
                <span className="me-1 text-warning-text">Deprecated.</span>
              ) : null}
              {inlineCode(entry.description)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DataAttributesRows({ data }: { data: ContractDataAttributes }) {
  return (
    <table className="vs-api-table">
      <thead>
        <tr>
          <th scope="col">Attribute</th>
          <th scope="col">Values</th>
        </tr>
      </thead>
      <tbody>
        {data.attributes.map((attribute) => (
          <tr key={attribute.name}>
            <td>
              <code>{attribute.name}</code>
            </td>
            <td>
              {attribute.values.length > 0 ? (
                <code>{attribute.values.map((v) => `"${v}"`).join(" | ")}</code>
              ) : (
                <span className="text-muted-foreground">
                  mirrors a prop or state value
                </span>
              )}
            </td>
          </tr>
        ))}
        {data.cssVariables.map((variable) => (
          <tr key={variable}>
            <td>
              <code>{variable}</code>
            </td>
            <td>
              <span className="text-muted-foreground">CSS custom property</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * `<ApiTable path="…" name="ButtonProps" />` — one flat, expanded table per exported part:
 * name · literal type · default · description (DS-02). Own props only; a part without own
 * props gets ONE sentence, never placeholder rows (DS-03). When the contract records `data-*`
 * attributes or CSS variables for the part, a second small table follows (canon row 7).
 *
 * Registered in the MDX map under BOTH `ApiTable` and the legacy `AutoTypeTable` name so the
 * existing pages render the new table without a body rewrite; Do1-b renames the usages.
 */
export async function ApiTable({ path, name }: ApiTableProps) {
  const docs = await getApiDocs({ path, name });
  return docs.map((doc) => {
    const dataAttributes = lookupDataAttributes(path, doc.part);
    return (
      <div key={doc.name} data-api-table={doc.name}>
        {doc.entries.length > 0 ? (
          <PropsRows entries={doc.entries} />
        ) : (
          <p>{inlineCode(noOwnPropsSentence(doc.part))}</p>
        )}
        {dataAttributes ? (
          <>
            <p className="text-label text-foreground">
              Data attributes and CSS variables on <code>{doc.part}</code>
            </p>
            <DataAttributesRows data={dataAttributes} />
          </>
        ) : null}
      </div>
    );
  });
}

/**
 * `<TypeTable type={{ prop: { type, description, default } }} />` — the hand-typed table for
 * exports the generator cannot see (hook return shapes, data modules). Same flat rows as
 * `ApiTable`; the markdown export evaluates the same object literal at compile time.
 */
export interface TypeTableProps {
  type: Record<
    string,
    {
      type?: string;
      description?: string;
      default?: string;
      required?: boolean;
      deprecated?: boolean;
    }
  >;
}

export function TypeTable({ type }: TypeTableProps) {
  const entries: ApiEntry[] = Object.entries(type).map(([name, entry]) => ({
    name,
    type: entry.type ?? "—",
    defaultValue: entry.default,
    description: entry.description ?? "",
    required: entry.required ?? false,
    deprecated: entry.deprecated ?? false,
  }));
  if (entries.length === 0) throw new Error("TypeTable: empty `type` object");
  return <PropsRows entries={entries} />;
}
