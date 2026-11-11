// @vegastack markdown-as-typed@0.66.0 sha256-2/s/TBAQ4EjP6SNcGIpgw0dIEkG+iK5txq1y7RVIBvY=

/* ---
`markdown-as-typed.ts` — stored Markdown as the person typed it. Pure strings, no dependencies, so
server and worker code (an agent's turn input) can import it without the editor.
--- */

/**
 * Stored Markdown as the person typed it, for a reader that isn't a Markdown renderer — a model
 * reading a chat message, a bubble showing it. Real formatting stays as Markdown (`**bold**`, a
 * list, a link); what the writer escaped only so Markdown would not read it as syntax reads as
 * itself (`\_\_init\_\_` → `__init__`, `\*` → `*`), and a hard break (`\` at a line's end) is
 * the newline it stands for. Code is kept byte for byte: a fenced block's lines and a code span
 * keep every backslash. Never feed the result back to `text-edit-markdown`'s `markdownToDoc`: it is the reading form, and
 * `__init__` would then parse as bold.
 *
 * @example
 * markdownAsTyped("rename \\_\\_init\\_\\_ to **setup**"); // "rename __init__ to **setup**"
 */
export function markdownAsTyped(markdown: string): string {
  let fence: string | null = null;
  return markdown
    .split("\n")
    .map((line, i, lines) => {
      const opens = /^ {0,3}(`{3,}|~{3,})/u.exec(line)?.[1];
      if (fence) {
        if (opens && opens[0] === fence[0] && opens.length >= fence.length)
          fence = null;
        return line;
      }
      if (opens) {
        fence = opens;
        return line;
      }
      // A hard break: the backslash at the end of a line that has a next one.
      const text = i < lines.length - 1 ? line.replace(/\\$/u, "") : line;
      // Code spans (a run of backticks to the same run) stay as written; the rest is unescaped.
      return text
        .split(/(`+[^`]*?`+)/u)
        .map((piece, j) =>
          j % 2 ? piece : piece.replace(/\\([!-/:-@[-`{-~])/gu, "$1"),
        )
        .join("");
    })
    .join("\n");
}
