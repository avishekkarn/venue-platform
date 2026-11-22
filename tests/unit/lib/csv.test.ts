import { describe, it, expect } from "vitest";
import { escapeCsvCell, toCsvRow, serializeCsv } from "@/lib/csv";

describe("RFC 4180 CSV Serializer with UTF-8 BOM", () => {
  it("escapes quotes, commas, and newlines properly", () => {
    expect(escapeCsvCell('Hello "World"')).toBe('"Hello ""World"""');
    expect(escapeCsvCell("Apples, Oranges")).toBe('"Apples, Oranges"');
    expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });

  it("formats single CSV rows", () => {
    const row = toCsvRow(["Table 1", 10, "150.00"]);
    expect(row).toBe('"Table 1",10,"150.00"');
  });

  it("prepends UTF-8 BOM and separates lines with CRLF", () => {
    const headers = ["Item", "Revenue"];
    const rows = [
      ["Burger", "15.00"],
      ["Pizza, Margherita", "20.00"],
    ];

    const csv = serializeCsv(headers, rows);
    expect(csv.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM
    expect(csv).toContain('"Item","Revenue"\r\n');
    expect(csv).toContain('"Burger","15.00"\r\n');
    expect(csv).toContain('"Pizza, Margherita","20.00"');
  });
});
