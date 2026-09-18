#!/usr/bin/env node

/** Fail closed on public component/props documentation declared by the component contract. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { migrated } from "./upstream/lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contracts = JSON.parse(
  readFileSync(join(root, "packages/ui/component-contracts.json"), "utf8"),
);
/**
 * The shadcn reset (docs/plans/2026-09-18-shadcn-reset/) makes every shared component UPSTREAM'S
 * FILE PLUS AN APPROVED PATCH, and upstream ships no JSDoc on its exports. Adding a doc comment to
 * each one would be "improving it in passing" — the mandate's first non-negotiable forbids exactly
 * that, and `verify-parity.mjs` would then demand a patch hunk per comment with no decision ID
 * behind it. So this gate stops at the boundary the reset draws: an UPSTREAM-BACKED component
 * documents its API on its docs page (whose section list `verify-variant-coverage.mjs` holds to
 * upstream's), and every component that is OURS — the extras, the hooks and the blocks — keeps the
 * full JSDoc + `@example` requirement.
 *
 * This NARROWS the gate; it does not disable it, and the boundary is DERIVED rather than listed:
 * `migrated()` reads `vendor/<cli>/ui/*.tsx`, so a name is exempt here exactly while upstream ships
 * a file for it, and the same name is under the parity and variant-coverage gates for exactly as
 * long. Editing a JSON list used to move all three at once (Codex review of `main..HEAD`,
 * 2026-09-18).
 */
const exemptFromJsdoc = migrated();
/**
 * The same boundary, one level up, for BLOCKS (Batch 8 of the shadcn reset, 2026-09-18). 96 of the
 * 100 blocks are upstream's own files — the 28 Base UI blocks copied out of `vendor/` with their
 * import paths adjusted, and the 68 chart cards ported from `new-york-v4`. Upstream ships no JSDoc
 * on them either, and a doc comment per part would be the same "improving it in passing" the
 * mandate's first non-negotiable forbids. The authority for what is upstream's is the pull
 * manifest, not a hand-kept list: a block that leaves `vendor/.../manifest.json` immediately owes
 * its JSDoc again. The four blocks this repository AUTHORED keep the full requirement.
 */
const vendored = new Set([
  ...JSON.parse(
    readFileSync(join(root, "vendor/shadcn/4.21.0/manifest.json"), "utf8"),
  ).blocks,
  ...JSON.parse(
    readFileSync(join(root, "vendor/shadcn/4.21.0/manifest.json"), "utf8"),
  ).chartBlocks,
]);
const records = [
  ...contracts.components.filter((record) => !exemptFromJsdoc.has(record.name)),
  ...contracts.hooks,
  ...contracts.blocks.filter((record) => !vendored.has(record.name)),
];
const problems = [];

function documentation(node, sourceFile) {
  return ts
    .getJSDocCommentsAndTags(node)
    .map((comment) => comment.getText(sourceFile))
    .join("\n");
}

function declarations(sourceFile, name) {
  const found = [];
  for (const statement of sourceFile.statements) {
    if (statement.name?.text === name)
      found.push({ node: statement, declaration: statement });
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === name
        ) {
          found.push({ node: statement, declaration });
        }
      }
    }
  }
  return found;
}

for (const record of records) {
  const parsed = record.sourceFiles
    .filter((path) => /\.tsx?$/.test(path))
    .map((path) => {
      const source = readFileSync(join(root, path), "utf8");
      return {
        path,
        source,
        sourceFile: ts.createSourceFile(
          path,
          source,
          ts.ScriptTarget.Latest,
          true,
          path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        ),
      };
    });

  for (const symbol of record.publicSymbols) {
    if (symbol.kind !== "component" && !symbol.name.endsWith("Props")) continue;
    const matches = parsed.flatMap((file) =>
      declarations(file.sourceFile, symbol.name).map((match) => ({
        ...file,
        ...match,
      })),
    );
    if (matches.length !== 1) {
      problems.push(
        `${record.name}/${symbol.name}: expected one source declaration, found ${matches.length}`,
      );
      continue;
    }
    const match = matches[0];
    const docs = documentation(match.node, match.sourceFile);
    const line =
      match.sourceFile.getLineAndCharacterOfPosition(match.node.getStart())
        .line + 1;
    const label = `${match.path}:${line} ${symbol.name}`;
    if (!docs) problems.push(`${label}: public ${symbol.kind} needs JSDoc`);
    if (symbol.kind === "component" && !/@example\b/.test(docs)) {
      problems.push(`${label}: public component JSDoc needs @example`);
    }

    const declaration = match.declaration;
    const members = ts.isInterfaceDeclaration(declaration)
      ? declaration.members
      : ts.isTypeAliasDeclaration(declaration) &&
          ts.isTypeLiteralNode(declaration.type)
        ? declaration.type.members
        : [];
    for (const member of members) {
      if (!member.name) continue;
      const memberName = member.name.getText(match.sourceFile);
      const memberLine =
        match.sourceFile.getLineAndCharacterOfPosition(member.getStart()).line +
        1;
      const memberDocs = documentation(member, match.sourceFile);
      if (!memberDocs) {
        problems.push(
          `${match.path}:${memberLine} ${symbol.name}.${memberName}: public prop needs JSDoc`,
        );
      }
      if (member.questionToken && !/@default\b/.test(memberDocs)) {
        problems.push(
          `${match.path}:${memberLine} ${symbol.name}.${memberName}: optional public prop needs @default`,
        );
      }
    }
  }
}

if (problems.length) {
  console.error(`✗ verify-public-api-docs: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log(
  `✓ public API docs: ${records.length} component/hook/block records have JSDoc, defaults, and component examples`,
);
