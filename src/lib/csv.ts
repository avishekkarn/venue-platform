/**
 * RFC 4180 compliant CSV serializer with UTF-8 BOM encoding.
 *
 * Governed by:
 * - DECISIONS.md D-12.2, D-12.5 (CSV-only export standard).
 * - BUILD.md §7.1 (decimal-money strings quoted).
 *
 * Prepends UTF-8 BOM (\uFEFF) to guarantee seamless encoding recognition in
 * Microsoft Excel, Apple Numbers, and Google Sheets across Windows and macOS.
 */

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const str = String(value);

  // If the cell contains quotes, commas, newlines, or carriage returns, wrap in quotes and escape internal quotes
  if (/[",\r\n]/.test(str) || typeof value === "string") {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function toCsvRow(cells: readonly unknown[]): string {
  return cells.map(escapeCsvCell).join(",");
}

export function serializeCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
  comments?: readonly string[]
): string {
  const commentLines = comments ? comments.map((c) => (c.startsWith("#") ? c : `# ${c}`)) : [];
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((r) => r.map(escapeCsvCell).join(","));

  // UTF-8 BOM + comment lines + header + lines separated by RFC 4180 CRLF
  const allLines = [...commentLines, headerLine, ...dataLines];
  return "\uFEFF" + allLines.join("\r\n");
}
