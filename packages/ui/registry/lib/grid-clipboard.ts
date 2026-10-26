// @vegastack grid-clipboard@0.25.87 sha256-EWNCnbr44sEJcdUTwq9oUZfBgh7jkHnmwYXbKqppMXI=

/* ---
`grid-clipboard` is the spreadsheet clipboard as data: what a grid writes when it copies a range
and what it reads back when something is pasted into it. React-free and DOM-light (only
`parseHtmlTable` needs a `DOMParser`), so a server or a worker can run it too.

What it decides is written by people, in other apps, so the rules come from recorded clipboards
(Regent Tables G3, 23-10-2026), not from a format specification nobody follows:

- `text/plain` is the source of truth for values: tab-separated, LF, CRLF or CR row ends, one
  trailing row end dropped (Excel adds one, Sheets does not), trailing empty fields kept. A field
  is quoted only when it STARTS with `"` (a cell holding a line break, a tab or a quote), and `""`
  inside a quoted field is `"`.
- `text/html` is used for its structure (merged cells, `<br>` line breaks) and never its styles.
  Google Sheets no longer writes `data-sheets-value`; it is read when present, as Excel's `x:num`
  is.
- Google Sheets' own `application/x-vnd.google-spreadsheet-compact-table+json` carries the exact
  numbers behind the displayed ones (0.10866227820675683 behind "0.1086622782", a date's day
  serial behind "2019-01-11"). Its shape is undocumented, so it is read best-effort: only when it
  lines up cell for cell with the plain text, and never instead of it.

Deliberately NOT done here:
- No knowledge of field types: a cell is `text` plus, when the source said so, an exact `number`.
  What "1,5" or "23/10/2026" means is the host's call (per column `parse`).
- No clipboard access. A grid reads the `paste` event's `DataTransfer` and hands the strings in.
--- */

/** One pasted cell: the text as displayed in its source, plus the exact number when known. */
export interface GridClipboardCell {
  /** The cell as its source displayed it ("1,234.50", "12.5%", "2019-01-11"). */
  text: string;
  /**
   * The exact number behind the text, when the source carried one (Google Sheets' typed values,
   * Excel's `x:num`). A date is its day serial (1899-12-30 epoch). Absent for text.
   */
  number?: number;
}

/** A rectangular paste: rows of cells, every row as long as the longest. */
export type GridClipboardMatrix = GridClipboardCell[][];

/** The clipboard types a paste may carry, as strings read from `DataTransfer.getData`. */
export interface GridClipboardData {
  /** `text/plain`. */
  text?: string;
  /** `text/html`. */
  html?: string;
  /** `application/x-vnd.google-spreadsheet-compact-table+json` (Google Sheets). */
  sheets?: string;
}

/** The MIME type Google Sheets writes its typed values under. */
export const SHEETS_COMPACT_TABLE_TYPE =
  "application/x-vnd.google-spreadsheet-compact-table+json";

/** Pad every row to the widest, so a matrix is always rectangular. */
function rectangular(rows: string[][]): string[][] {
  const width = Math.max(0, ...rows.map((row) => row.length));
  return rows.map((row) =>
    row.length < width ? [...row, ...Array(width - row.length).fill("")] : row,
  );
}

/**
 * Parse tab-separated text into rows of fields. Quoting follows what spreadsheets write: a field
 * that starts with `"` runs to the next `"` not followed by another (`""` is a literal quote) and
 * may hold tabs and line breaks; a `"` anywhere else is literal. LF, CRLF and CR end rows; one
 * trailing row end is dropped; trailing empty fields are kept. The result is rectangular.
 *
 * @example
 * parseTsv('a\t"line one\nline two"\r\nb\t\r\n'); // [["a","line one\nline two"],["b",""]]
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  // A quoted field exists even when it is empty (`""`).
  let quoted = false;
  let i = 0;
  const n = text.length;
  const endRow = () => {
    row.push(field);
    rows.push(row);
    row = [];
    field = "";
    quoted = false;
  };
  while (i < n) {
    const ch = text[i]!;
    if (field === "" && ch === '"') {
      // A quoted field: up to the closing quote, `""` being one literal quote.
      let j = i + 1;
      let value = "";
      let closed = false;
      while (j < n) {
        const c = text[j]!;
        if (c === '"') {
          if (text[j + 1] === '"') {
            value += '"';
            j += 2;
            continue;
          }
          closed = true;
          j += 1;
          break;
        }
        value += c;
        j += 1;
      }
      const next = text[j];
      if (
        closed &&
        (j >= n || next === "\t" || next === "\n" || next === "\r")
      ) {
        field = value.replace(/\r\n?/g, "\n");
        quoted = true;
        i = j;
        continue;
      }
      // Not a well-formed quoted field (`"abc"def`): the quote was literal after all.
      field = ch;
      i += 1;
      continue;
    }
    if (ch === "\t") {
      row.push(field);
      field = "";
      quoted = false;
      i += 1;
    } else if (ch === "\n" || ch === "\r") {
      endRow();
      i += ch === "\r" && text[i + 1] === "\n" ? 2 : 1;
    } else {
      field += ch;
      i += 1;
    }
  }
  // The last row: present unless the text ended on a row end (dropped, once).
  if (field !== "" || quoted || row.length > 0) endRow();
  else if (n === 0) return [];
  return rectangular(rows);
}

/** Whether a field must be quoted to survive `parseTsv`. */
function needsQuotes(value: string): boolean {
  return /[\t\n\r]/.test(value) || value.startsWith('"');
}

/**
 * Serialise rows of strings as tab-separated text the way spreadsheets read it: a field holding
 * a tab, a line break or a leading quote is quoted with `""` escapes; rows end with `\n`, with no
 * trailing row end. `parseTsv(serializeTsv(rows))` returns `rows`.
 *
 * @example
 * serializeTsv([["Name", "Notes"], ["SR-12", "line one\nline two"]]);
 */
export function serializeTsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((row) =>
      // A row of one empty cell is written `""`: an empty line would read as no row at all.
      row.length === 1 && row[0] === ""
        ? '""'
        : row
            .map((value) =>
              needsQuotes(value) ? `"${value.replace(/"/g, '""')}"` : value,
            )
            .join("\t"),
    )
    .join("\n");
}

/** Escape text for an HTML text node or attribute. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The `text/html` a grid writes beside its TSV: a bare `<table>` (no styles), line breaks as
 * `<br>`. Spreadsheets keep cells with line breaks whole from it.
 *
 * @example
 * serializeHtmlTable([["Name"], ["line one\nline two"]]);
 */
export function serializeHtmlTable(
  rows: readonly (readonly string[])[],
): string {
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (value) => `<td>${escapeHtml(value).replace(/\n/g, "<br>")}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `<table><tbody>${body}</tbody></table>`;
}

/** A cell's text from HTML: `<br>` is a line break, whitespace collapses as rendered. */
function cellText(cell: Element): string {
  let out = "";
  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3)
        out += (child.textContent ?? "").replace(/\s+/g, " ");
      else if (child.nodeName === "BR") out += "\n";
      else if (child.nodeType === 1) {
        const name = child.nodeName;
        if (name === "STYLE" || name === "SCRIPT") return;
        walk(child);
        if (name === "P" || name === "DIV") out += "\n";
      }
    });
  };
  walk(cell);
  return out
    .replace(/ *\n */g, "\n")
    .replace(/\n+$/, "")
    .trim();
}

/**
 * Parse the first `<table>` in clipboard HTML into a rectangular matrix — `null` when there is
 * none. The document is parsed inert (`DOMParser`, nothing executes or loads) and only text is
 * read: styles never. A merged cell keeps its value in its top-left position and leaves the rest
 * of its span empty, as Excel's own TSV does. An exact number comes from `data-sheets-value`
 * (older Google Sheets) or Excel's `x:num`, when present.
 *
 * @example
 * parseHtmlTable('<table><tr><td x:num="1234.5">1,234.50</td></tr></table>');
 * // [[{ text: "1,234.50", number: 1234.5 }]]
 */
export function parseHtmlTable(html: string): GridClipboardMatrix | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) return null;
  const rows = [...table.querySelectorAll("tr")].filter(
    (tr) => tr.closest("table") === table,
  );
  // A paste no grid could hold is not a table: it is refused whole, before it can exhaust memory.
  if (rows.length > MAX_HTML_ROWS) return null;
  const grid: (GridClipboardCell | undefined)[][] = [];
  let cells = 0;
  let width = 0;
  for (let r = 0; r < rows.length; r += 1) {
    grid[r] ??= [];
    let c = 0;
    for (const cell of rows[r]!.children) {
      if (cell.nodeName !== "TD" && cell.nodeName !== "TH") continue;
      while (grid[r]![c] !== undefined) c += 1;
      const colSpan = span(cell.getAttribute("colspan"));
      const rowSpan = span(cell.getAttribute("rowspan"));
      cells += colSpan * rowSpan;
      if (
        r + rowSpan > MAX_HTML_ROWS ||
        c + colSpan > MAX_HTML_COLUMNS ||
        cells > MAX_HTML_CELLS
      )
        return null;
      const value: GridClipboardCell = { text: cellText(cell) };
      const num = readNumberAttribute(cell);
      if (num !== undefined) value.number = num;
      for (let dr = 0; dr < rowSpan; dr += 1)
        for (let dc = 0; dc < colSpan; dc += 1) {
          grid[r + dr] ??= [];
          grid[r + dr]![c + dc] = dr === 0 && dc === 0 ? value : { text: "" };
        }
      c += colSpan;
      width = Math.max(width, c);
    }
  }
  // The rectangle it pads out to counts too: one wide row over many short ones is still big.
  if (grid.length * width > MAX_HTML_CELLS) return null;
  return grid.map((row) =>
    Array.from({ length: width }, (_, index) => row[index] ?? { text: "" }),
  );
}

/** The most rows and columns a pasted HTML table may span (a spreadsheet paste is far smaller). */
const MAX_HTML_ROWS = 10_000;
const MAX_HTML_COLUMNS = 1_000;
/** The most cells a pasted HTML table may expand to, spans included. */
const MAX_HTML_CELLS = 200_000;

/** A `colspan`/`rowspan` as a whole number from 1 to 1,000 (HTML's own colspan ceiling). */
function span(value: string | null): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 1000) : 1;
}

/** The exact number a source wrote on a cell: Excel's `x:num`, older Sheets' `data-sheets-value`. */
function readNumberAttribute(cell: Element): number | undefined {
  const excel = cell.getAttribute("x:num");
  if (excel != null && excel !== "") {
    const value = Number(excel);
    if (Number.isFinite(value)) return value;
  }
  const sheets = cell.getAttribute("data-sheets-value");
  if (sheets) {
    try {
      const parsed = JSON.parse(sheets) as Record<string, unknown>;
      if (typeof parsed["3"] === "number" && Number.isFinite(parsed["3"]))
        return parsed["3"];
    } catch {
      // Not JSON: no typed value.
    }
  }
  return undefined;
}

/**
 * Lay Google Sheets' typed values over the plain-text matrix. The compact table lists one type per
 * NON-EMPTY cell in row-major order (`1` number, `2` text) with the numbers and strings in their
 * own arrays. It is undocumented, so it is used only when its count of non-empty cells matches
 * the text's exactly; otherwise the text stands alone.
 */
function withSheetsNumbers(
  matrix: GridClipboardMatrix,
  sheets: string,
): GridClipboardMatrix {
  let types: unknown;
  let numbers: unknown;
  let strings: unknown;
  let size: unknown;
  try {
    const parsed = JSON.parse(sheets) as Record<
      string,
      Record<string, unknown>
    >;
    types = parsed["3"]?.["1"];
    numbers = parsed["3"]?.["3"];
    strings = parsed["3"]?.["4"];
    size = parsed["15"];
  } catch {
    return matrix;
  }
  // A copy of numbers alone may leave its (empty) strings list out.
  if (strings === undefined) strings = [];
  if (
    !Array.isArray(types) ||
    !Array.isArray(numbers) ||
    !Array.isArray(strings)
  )
    return matrix;
  // Every check must agree before a single number is trusted: the table's size, one type per
  // non-empty cell, one number per numeric type and one string per text type.
  const dims = size as { "1"?: unknown; "2"?: unknown } | undefined;
  if (dims?.["1"] !== matrix.length || dims?.["2"] !== (matrix[0]?.length ?? 0))
    return matrix;
  const filled = matrix.flat().filter((cell) => cell.text !== "").length;
  const numeric = types.filter((type) => type === 1).length;
  const textual = types.filter((type) => type === 2).length;
  if (
    filled !== types.length ||
    numeric + textual !== types.length ||
    numbers.length !== numeric ||
    strings.length !== textual ||
    !numbers.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    )
  )
    return matrix;
  // Its text cells must read exactly as the plain text does, in order — the one thing both
  // sides state alike — or the table describes some other copy.
  let t = 0;
  let k = 0;
  let j = 0;
  const typed: GridClipboardMatrix = [];
  for (const row of matrix) {
    const out: GridClipboardCell[] = [];
    for (const cell of row) {
      if (cell.text === "") {
        out.push(cell);
        continue;
      }
      const type = types[t];
      t += 1;
      if (type === 2) {
        if (strings[j] !== cell.text) return matrix;
        j += 1;
        out.push(cell);
      } else {
        out.push({ ...cell, number: numbers[k] as number });
        k += 1;
      }
    }
    typed.push(out);
  }
  return typed;
}

/**
 * Read a paste: `text/plain` for the values (the source of truth), HTML for its structure when
 * there is no text or the text lost it, Google Sheets' compact table for exact numbers.
 *
 * @example
 * const matrix = parseClipboard({
 *   text: event.clipboardData.getData("text/plain"),
 *   html: event.clipboardData.getData("text/html"),
 *   sheets: event.clipboardData.getData(SHEETS_COMPACT_TABLE_TYPE),
 * });
 */
export function parseClipboard(data: GridClipboardData): GridClipboardMatrix {
  const html = data.html ? parseHtmlTable(data.html) : null;
  let matrix: GridClipboardMatrix;
  if (data.text != null && data.text !== "") {
    matrix = parseTsv(data.text).map((row) => row.map((text) => ({ text })));
    // HTML of the same shape adds what text cannot carry: Excel's exact numbers.
    if (
      html &&
      html.length === matrix.length &&
      html.every((row, r) => row.length === matrix[r]!.length)
    )
      matrix = matrix.map((row, r) =>
        row.map((cell, c) => {
          const typed = html[r]![c]!.number;
          return typed === undefined ? cell : { ...cell, number: typed };
        }),
      );
  } else matrix = html ?? [];
  return data.sheets ? withSheetsNumbers(matrix, data.sheets) : matrix;
}

/** A target range: its size in rows and columns. */
export interface GridClipboardRange {
  rows: number;
  columns: number;
}

/**
 * Fit a pasted matrix to a selected range. A single cell fills every cell of the range; a matrix
 * that divides the range evenly tiles over it (two rows pasted into six repeat three times);
 * anything else keeps its own size (the host decides what overflows — "Add 38 rows?").
 *
 * @example
 * expandPaste({ rows: 3, columns: 2 }, [[{ text: "x" }]]); // a 3 × 2 matrix of "x"
 */
export function expandPaste<C>(
  range: GridClipboardRange,
  matrix: readonly (readonly C[])[],
): C[][] {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  if (height === 0 || width === 0) return [];
  const tiles =
    range.rows >= height &&
    range.columns >= width &&
    range.rows % height === 0 &&
    range.columns % width === 0;
  if (!tiles) return matrix.map((row) => [...row]);
  return Array.from({ length: range.rows }, (_, r) =>
    Array.from(
      { length: range.columns },
      (_, c) => matrix[r % height]![c % width]!,
    ),
  );
}
