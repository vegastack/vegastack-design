#!/usr/bin/env node

/** Fail closed on public component/props documentation declared by the component contract. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contracts = JSON.parse(
  readFileSync(join(root, "packages/ui/component-contracts.json"), "utf8"),
);
const records = [
  ...contracts.components,
  ...contracts.hooks,
  ...contracts.blocks,
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
