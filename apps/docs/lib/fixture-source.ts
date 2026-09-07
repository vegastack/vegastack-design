import { readFileSync } from "node:fs";
import ts from "typescript";

/**
 * The source a `<ComponentPreview name file />` shows — in the Code tab AND in the agent
 * markdown (DS-01): the preview file's import block plus the ONE named fixture function, not the
 * whole file. Every fixture in `components/preview/*.tsx` is an `export function <name>()`
 * (512 of 512 at the time of writing), so the extraction is by name through the TypeScript AST
 * and fails closed when the function is missing — a page can never silently show the wrong
 * example.
 *
 * Paths are relative to `apps/docs` (the cwd of `next build` and `next dev`), exactly as the
 * MDX pages pass them today.
 *
 * One page points `file` somewhere else on purpose: `blocks/dashboard-01` shows the block's own
 * `page.tsx`, because that whole file IS the example a consumer installs. For a file outside
 * `components/preview/`, the whole source is the snippet. Inside it, extraction fails closed.
 */
const PREVIEW_FIXTURE_FILE = /^components\/preview\//;

export function readFixtureSource(file: string, name: string): string {
  const source = readFileSync(file, "utf8");
  if (!PREVIEW_FIXTURE_FILE.test(file)) return source;
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const imports: string[] = [];
  let fixture: string | undefined;
  for (const statement of ast.statements) {
    if (ts.isImportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier.getText(ast).slice(1, -1);
      // The demo `Wrapper` is docs-site chrome, not part of the example.
      if (specifier === "./wrapper") continue;
      imports.push(statement.getText(ast));
      continue;
    }
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === name &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      fixture = unwrapDemoFrame(statement, ast);
    }
  }

  if (!fixture) {
    throw new Error(
      `Fixture "${name}" is not an \`export function\` in ${file}. Preview fixtures must be named exported functions so the Code tab and the markdown export can show exactly that example.`,
    );
  }
  return imports.length > 0
    ? `${imports.join("\n")}\n\n${fixture}\n`
    : `${fixture}\n`;
}

/**
 * `<Wrapper>` (`components/preview/wrapper.tsx`, the ONLY export of that module) is the docs demo
 * frame — flex/padding classes that centre an example inside the preview panel. It is not part of
 * the example, so its import is dropped above; leaving the element behind would emit a snippet
 * referencing an undefined component. This replaces each `<Wrapper …>…</Wrapper>` with its
 * children, so the snippet a human copies from the Code tab and the one an agent reads in the
 * `.md` are both real, compiling component usage.
 *
 * The frame is the returned root, so its children are frequently siblings: collapsing it to a
 * fragment (`<>…</>`) is the only rewrite that stays valid JSX. A single child is unwrapped
 * outright and dedented to the wrapper's own column, which is the common and tidier case.
 */
function unwrapDemoFrame(
  fn: ts.FunctionDeclaration,
  ast: ts.SourceFile,
): string {
  const start = fn.getStart(ast);
  const text = fn.getText(ast);
  const edits: { from: number; to: number; replacement: string }[] = [];

  const visit = (node: ts.Node) => {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(ast) === "Wrapper"
    ) {
      const from = node.getStart(ast);
      const to = node.getEnd();
      const inner = ast.text.slice(
        node.openingElement.getEnd(),
        node.closingElement.getStart(ast),
      );
      const substantive = node.children.filter(
        (child) => !ts.isJsxText(child) || child.getText(ast).trim().length > 0,
      );
      edits.push({
        from,
        to,
        replacement:
          substantive.length === 1
            ? dedentTo(inner, columnOf(ast, from))
            : `<>${inner.replace(/\s+$/, "")}\n${" ".repeat(columnOf(ast, from))}</>`,
      });
      // The frame never nests, and children are re-emitted verbatim — do not descend.
      return;
    }
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(ast) === "Wrapper"
    ) {
      edits.push({
        from: node.getStart(ast),
        to: node.getEnd(),
        replacement: "null",
      });
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(fn);

  let result = text;
  // Apply back to front so earlier offsets stay valid.
  for (const edit of edits.sort((a, b) => b.from - a.from)) {
    result =
      result.slice(0, edit.from - start) +
      edit.replacement +
      result.slice(edit.to - start);
  }
  return result;
}

function columnOf(ast: ts.SourceFile, position: number) {
  return ast.getLineAndCharacterOfPosition(position).character;
}

/** Children source shifted so its shallowest line sits at `column`, with the outer blank lines cut. */
function dedentTo(inner: string, column: number) {
  const lines = inner.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.length - line.trimStart().length);
  const shift = Math.min(...indents, Number.POSITIVE_INFINITY) - column;
  if (!Number.isFinite(shift) || shift <= 0)
    return lines.join("\n").trimStart();
  return lines
    .map((line) => (line.trim().length > 0 ? line.slice(shift) : line))
    .join("\n")
    .trimStart();
}
