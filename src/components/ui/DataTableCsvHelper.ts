export interface CsvExportOptions<T> {
  filename: string;
  headers: string[];
  rowSerializer: (row: T) => (string | number | null | undefined)[];
}

export function escapeCsvCell(val: string | number | null | undefined): string {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const bom = "\uFEFF";
  const csv = bom + rows.map(row => row.map(escapeCsvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
