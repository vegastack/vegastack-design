import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Build-time readers for the two machine authorities the generated docs sections draw from
 * (AGENTS.md §Truth hierarchy #2): `packages/ui/component-contracts.json` (inventory, states,
 * `dataAttributes`) and `packages/ui/registry.json` (install command, registry dependencies,
 * engine dependencies). Server-only — every caller is a React Server Component or a route
 * handler, and `process.cwd()` is `apps/docs` for both `next build` and `next dev` (the same
 * assumption `ComponentPreview`'s `readFileSync(file)` already makes).
 */
const REPO_ROOT = path.resolve(process.cwd(), "../..");
const CONTRACTS_PATH = path.join(
  REPO_ROOT,
  "packages/ui/component-contracts.json",
);
const REGISTRY_PATH = path.join(REPO_ROOT, "packages/ui/registry.json");

export interface ContractStatus {
  status: string;
  values: string[];
  evidence: string;
}

export interface ContractPublicSymbol {
  name: string;
  kind: string;
  source: string;
}

/**
 * `data-*` attributes and CSS custom properties one exported part renders, extracted from the
 * canonical source by `tooling/verify-component-contracts.mjs --write-data-attributes` and
 * checked against the source on every `design:verify`. A literal value is listed; an attribute
 * whose value mirrors a prop or state is recorded with `values: []`.
 */
export interface ContractDataAttributes {
  attributes: { name: string; values: string[] }[];
  cssVariables: string[];
}

export interface ContractRecord {
  name: string;
  registryType: string;
  title: string;
  summary: string;
  family: string;
  docsSlug: string;
  publicSymbols: ContractPublicSymbol[];
  states: {
    behavior: ContractStatus;
    accessibility: ContractStatus;
    visual: ContractStatus;
  };
  engines: { package: string; role: string }[];
  registryDependencies: string[];
  dataAttributes?: Record<string, ContractDataAttributes>;
}

interface ContractInventory {
  components: ContractRecord[];
  hooks: ContractRecord[];
  blocks: ContractRecord[];
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
}

interface RegistryIndex {
  items: RegistryItem[];
}

let inventory: ContractInventory | undefined;
let registry: RegistryIndex | undefined;

export function getContractInventory(): ContractInventory {
  inventory ??= JSON.parse(readFileSync(CONTRACTS_PATH, "utf8"));
  return inventory!;
}

/** Every non-icon contract record (components, hooks, blocks), by registry item name. */
export function getContractRecord(name: string): ContractRecord {
  const { components, hooks, blocks } = getContractInventory();
  const record = [...components, ...hooks, ...blocks].find(
    (candidate) => candidate.name === name,
  );
  if (!record) {
    throw new Error(
      `No component-contracts.json record named "${name}" — the generated docs sections take the registry item name (e.g. "data-grid"), not the title.`,
    );
  }
  return record;
}

export function getRegistryItem(name: string): RegistryItem {
  registry ??= JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const item = registry!.items.find((candidate) => candidate.name === name);
  if (!item) {
    throw new Error(
      `No registry.json item named "${name}" — install steps need a real \`shadcn add\` target.`,
    );
  }
  return item;
}

/**
 * The sanctioned renderer/behaviour engines the item pulls in, derived from its npm dependencies
 * the same way `tooling/verify-component-contracts.mjs` derives the contract's `engines` list.
 * Everything else in `dependencies` is the shared baseline (Base UI, CVA, lucide, the two
 * `@vegastack/*` packages) and is not an engine.
 */
const BASELINE_DEPENDENCIES = new Set([
  "@base-ui/react",
  "class-variance-authority",
  "lucide-react",
  "@vegastack/design",
  "@vegastack/design-tokens",
]);

/**
 * The registry roster for `llms.txt` (`08-docs-structure.md` §3): every installable item with its
 * docs page, its `shadcn add` target and the contract route the behaviour lane exercises — so an
 * agent goes from "I need a data grid" to the page, the contract and the install command without
 * scraping 110 HTML pages first.
 */
export interface RosterEntry {
  name: string;
  title: string;
  summary: string;
  kind: "component" | "hook" | "block";
  docsRoute: string;
  install: string;
}

export function getRegistryRoster(): RosterEntry[] {
  const { components, hooks, blocks } = getContractInventory();
  const rows: RosterEntry[] = [];
  for (const [kind, records] of [
    ["component", components],
    ["hook", hooks],
    ["block", blocks],
  ] as const) {
    for (const record of records) {
      rows.push({
        name: record.name,
        title: record.title,
        summary: record.summary,
        kind,
        docsRoute: record.docsSlug,
        install: `pnpm dlx shadcn@latest add @vegastack/${record.name}`,
      });
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/**
 * The public agent skills, read from `skills/public/*\/SKILL.md`'s YAML frontmatter. These are the
 * consumer-facing skills mirrored into `@vegastack/design`; listing them in `llms.txt` is how an
 * agent discovers that installable guidance exists at all.
 */
export interface SkillEntry {
  name: string;
  description: string;
}

export function getPublicSkills(): SkillEntry[] {
  const root = path.join(REPO_ROOT, "skills/public");
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const source = readFileSync(
        path.join(root, entry.name, "SKILL.md"),
        "utf8",
      );
      const frontmatter = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? "";
      // `description:` may be a folded block; collapse it to the single line llms.txt wants.
      const description =
        /^description:\s*(?:>-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|$)/m
          .exec(frontmatter)?.[1]
          .replace(/\s+/g, " ")
          .replace(/^["']|["']$/g, "")
          .trim();
      if (!description) {
        throw new Error(
          `skills/public/${entry.name}/SKILL.md has no \`description\` frontmatter`,
        );
      }
      return { name: entry.name, description };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function getEngineDependencies(item: RegistryItem): string[] {
  return (
    (item.dependencies ?? [])
      // Strip a trailing version range (`lucide-react@^1.24.0`), never a scope (`@shadcn/react/…`).
      .map((spec) => spec.replace(/(?!^)@[^@/]*$/, ""))
      .filter((name) => !BASELINE_DEPENDENCIES.has(name))
  );
}
