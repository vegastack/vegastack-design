import {
  getContractRecord,
  getEngineDependencies,
  getRegistryItem,
} from "@/lib/contracts";

/**
 * Data for the canon's generated sections (`08-docs-structure.md` §2 rows 1, 4, 8), computed once
 * from the two machine authorities and rendered by BOTH the React components in
 * `components/generated/*` and the markdown renderers in `lib/markdown-export.ts`.
 */

export interface InstallStep {
  text: string;
  command?: string;
}

/** Row 1 — Install: the `shadcn add` command, then what it pulls in, generated from `registry.json`. */
export function getInstallSteps(name: string): InstallStep[] {
  const item = getRegistryItem(name);
  const steps: InstallStep[] = [
    {
      text: `Add \`${item.title}\` from the VegaStack registry. The CLI verifies the item's integrity hash before writing it.`,
      command: `pnpm dlx shadcn@latest add @vegastack/${item.name}`,
    },
  ];
  const registryDependencies = item.registryDependencies ?? [];
  if (registryDependencies.length > 0) {
    steps.push({
      text: `The same command installs the registry items it composes: ${registryDependencies
        .map((dependency) => `\`${dependency}\``)
        .join(", ")}.`,
    });
  }
  const engines = getEngineDependencies(item);
  if (engines.length > 0) {
    const record = getContractRecord(name);
    steps.push({
      text: `It also adds the sanctioned engine${engines.length > 1 ? "s" : ""} to your \`package.json\`: ${engines
        .map((engine) => {
          const role = record.engines.find(
            (candidate) => candidate.package === engine,
          )?.role;
          return role ? `\`${engine}\` (${role})` : `\`${engine}\``;
        })
        .join(", ")}.`,
    });
  }
  return steps;
}

export interface AnatomyPart {
  name: string;
  /** `data-slot` values the part renders, from the contract's `dataAttributes`. */
  slots: string[];
}

/** Row 4 — Anatomy: every exported component part with its `data-slot` names. */
export function getAnatomy(name: string): { parts: AnatomyPart[] } {
  const record = getContractRecord(name);
  const parts = record.publicSymbols
    .filter((symbol) => symbol.kind === "component")
    .map((symbol) => ({
      name: symbol.name,
      slots:
        record.dataAttributes?.[symbol.name]?.attributes.find(
          (attribute) => attribute.name === "data-slot",
        )?.values ?? [],
    }));
  if (parts.length === 0) {
    throw new Error(`Anatomy: "${name}" exports no component parts`);
  }
  return { parts };
}

export interface StatesRow {
  label: string;
  values: string[];
}

/** Row 8 — Accessibility "states tested", straight from the contract's `states` field. */
export function getStatesTested(name: string): StatesRow[] {
  const { states } = getContractRecord(name);
  return [
    { label: "Behaviour", values: states.behavior.values },
    { label: "Accessibility", values: states.accessibility.values },
    { label: "Visual", values: states.visual.values },
  ].filter((row) => row.values.length > 0);
}
