// @vegastack file-viewer@0.23.95 sha256-FRvkq8vyWcWEVCquTm6LdZcvWh+3UEnhjNfIqI/TFeY=

/* ---
The Excel and Word readers behind `file-viewer`. The viewer imports this file dynamically, the
first time a spreadsheet or a `.docx` opens, and this file imports its engine the same way — SheetJS
(`xlsx`) for a workbook, `mammoth` for a Word document — so neither ever reaches a page that opens
no Office file. A file over `OFFICE_MAX_BYTES` is never fetched; any failure throws, and the viewer
shows its Download card instead.
--- */

/** The largest Office file the viewer reads (20 MB); anything larger shows the Download card. */
export const OFFICE_MAX_BYTES = 20 * 1024 * 1024;

/** One sheet of a workbook: its name, its first rows (the first is the header) and its size. */
export interface OfficeSheet {
  name: string;
  rows: string[][];
  /** Data rows in the whole sheet. */
  totalRows: number;
}

/** Fetch a whole file, refusing one over the cap before and after it arrives. */
async function fetchCapped(
  url: string,
  size: number | null | undefined,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  if ((size ?? 0) > OFFICE_MAX_BYTES) throw new Error("Too large to preview");
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (Number(response.headers.get("content-length")) > OFFICE_MAX_BYTES)
    throw new Error("Too large to preview");
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > OFFICE_MAX_BYTES)
    throw new Error("Too large to preview");
  return buffer;
}

/**
 * Read a workbook's sheets, each to its first `maxRows` data rows as display text (what Excel
 * shows in the cell, not the raw value).
 */
export async function readWorkbook(
  url: string,
  size: number | null | undefined,
  signal: AbortSignal,
  maxRows: number,
): Promise<OfficeSheet[]> {
  const buffer = await fetchCapped(url, size, signal);
  const XLSX = await import("xlsx");
  const book = XLSX.read(buffer, { type: "array", cellDates: true });
  return book.SheetNames.map((name) => {
    const sheet = book.Sheets[name]!;
    const all = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
    const rows = all
      .slice(0, maxRows + 1)
      .map((row) => row.map((cell) => (cell == null ? "" : String(cell))));
    return { name, rows, totalRows: Math.max(0, all.length - 1) };
  });
}

/**
 * Convert a `.docx` to HTML with mammoth. The viewer never injects it: `MarkdownView`'s `html`
 * format rebuilds it through its allowlist (no scripts, handlers or styles).
 */
export async function readWordDocument(
  url: string,
  size: number | null | undefined,
  signal: AbortSignal,
): Promise<string> {
  const buffer = await fetchCapped(url, size, signal);
  const mammoth = await import("mammoth");
  const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return value;
}
