import { Steps, Step } from "fumadocs-ui/components/steps";
import { Files, File } from "fumadocs-ui/components/files";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { highlight } from "fumadocs-core/highlight";
import { inlineCode } from "@/components/api-table";
import {
  getAnatomy,
  getInstallSteps,
  getStatesTested,
} from "@/lib/generated-sections";
import { getComponentChangelog } from "@/lib/changelog";

/**
 * The canon's generated sections (`08-docs-structure.md` §2 rows 1, 4, 8, 10) as MDX
 * components. Each takes the registry item name and reads the machine authorities through
 * `lib/generated-sections.ts` / `lib/changelog.ts` — the same functions the markdown export
 * renders from, so `button.md` and `/docs/components/button` show identical content.
 *
 * Usage (Do1-b places these on every page; the button, dialog and data-grid pages carry them now):
 *
 *   ## Install
 *   <InstallSteps name="button" />
 *   ## Anatomy
 *   <Anatomy name="dialog" />
 *   ## Accessibility
 *   <StatesTested name="button" />
 *   ## Changelog
 *   <ComponentChangelog name="button" />
 */
export interface GeneratedSectionProps {
  /** Registry item name — `data-grid`, never the title. */
  name: string;
}

async function Command({ command }: { command: string }) {
  const node = await highlight(command, {
    lang: "bash",
    themes: { light: "github-light", dark: "github-dark" },
    components: { pre: Pre },
  });
  return <CodeBlock>{node}</CodeBlock>;
}

export function InstallSteps({ name }: GeneratedSectionProps) {
  const steps = getInstallSteps(name);
  return (
    <Steps>
      {steps.map((step, index) => (
        <Step key={index}>
          <p>{inlineCode(step.text)}</p>
          {step.command ? <Command command={step.command} /> : null}
        </Step>
      ))}
    </Steps>
  );
}

export function Anatomy({ name }: GeneratedSectionProps) {
  const { parts } = getAnatomy(name);
  return (
    <Files>
      {parts.map((part) => (
        <File
          key={part.name}
          name={
            part.slots.length > 0
              ? `${part.name} — data-slot="${part.slots.join('" | "')}"`
              : part.name
          }
        />
      ))}
    </Files>
  );
}

export function StatesTested({ name }: GeneratedSectionProps) {
  const rows = getStatesTested(name);
  return (
    <table className="vs-api-table">
      <thead>
        <tr>
          <th scope="col">Contract</th>
          <th scope="col">States tested</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td>{row.label}</td>
            <td>
              {row.values.map((value, index) => (
                <span key={value}>
                  {index > 0 ? ", " : null}
                  <code>{value}</code>
                </span>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ComponentChangelog({ name }: GeneratedSectionProps) {
  const entries = getComponentChangelog(name);
  if (entries.length === 0) {
    return <p>No changelog entries name this item yet.</p>;
  }
  return (
    <ul>
      {entries.map((entry, index) => (
        <li key={index}>
          <strong>{entry.version}</strong> ({entry.date}) — {entry.section}:{" "}
          {inlineCode(entry.text)}
        </li>
      ))}
    </ul>
  );
}
