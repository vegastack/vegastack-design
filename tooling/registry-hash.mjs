// Shared canonical hash for registry items — covers the WHOLE item (not just file content).
import { createHash } from 'node:crypto';

// Provenance header (requirements §157.3 + G23): `// @vegastack <name>@<version> sha256-<sha>`.
// The header is line 1 of every shipped file (registry source, registry-JSON `files[].content`,
// and the copied-in file). Because the header EMBEDS the item's sha256 integrity, but the
// integrity is itself computed over the file content, we MUST hash over the HEADERLESS content —
// otherwise stamping the header would change the hash, which would change the header, forever.
// stripProvenanceHeader removes a leading `// @vegastack …@… sha256-…` line plus the single
// blank separator line that follows it, leaving the original component code untouched. The result
// is byte-identical to pre-header content, so meta.integrity is invariant under (re)stamping.
const PROVENANCE_HEADER_RE = /^\/\/ @vegastack \S+@\S+ sha256-\S+\n(?:\n)?/;

export function stripProvenanceHeader(content) {
  if (typeof content !== 'string') return content;
  return content.replace(PROVENANCE_HEADER_RE, '');
}

// Build the canonical provenance header line for an item (no trailing newline).
export function provenanceHeader(name, version, integrity) {
  return `// @vegastack ${name}@${version} ${integrity}`;
}

// Prepend (or refresh) the provenance header on a file's content: strip any existing header,
// then write `<header>\n\n<original code>`. Idempotent — re-applying yields the same bytes.
export function applyProvenanceHeader(content, name, version, integrity) {
  const body = stripProvenanceHeader(content);
  return `${provenanceHeader(name, version, integrity)}\n\n${body}`;
}

// Read the embedded header sha (the `sha256-…` token) from a file's content, or null if absent.
export function readProvenanceHeader(content) {
  if (typeof content !== 'string') return null;
  const m = content.match(/^\/\/ @vegastack (\S+)@(\S+) (sha256-\S+)\n/);
  return m ? { name: m[1], version: m[2], integrity: m[3] } : null;
}

export function canonical(o) {
  if (Array.isArray(o)) return o.map(canonical);
  if (o && typeof o === 'object') {
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canonical(o[k])]));
  }
  return o;
}

export function itemHash(item) {
  const { meta = {}, files, ...rest } = item;
  const m = { ...meta };
  delete m.integrity;
  // Hash over headerless file content so the embedded sha stays self-consistent (see above).
  const f = Array.isArray(files)
    ? files.map((file) =>
        file && typeof file === 'object' && 'content' in file
          ? { ...file, content: stripProvenanceHeader(file.content) }
          : file,
      )
    : files;
  return (
    'sha256-' +
    createHash('sha256')
      .update(JSON.stringify(canonical({ ...rest, ...(f !== undefined ? { files: f } : {}), meta: m })))
      .digest('base64')
  );
}
