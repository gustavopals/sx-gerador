export function escapeCsvCell(value: string, delimiter: ';' | ',' = ';'): string {
  if (value.includes('"') || value.includes('\n') || value.includes(delimiter)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatCsvRow(cells: string[], delimiter: ';' | ',' = ';'): string {
  return cells.map((c) => escapeCsvCell(c, delimiter)).join(delimiter);
}

export function formatCsv(headers: string[], rows: string[][], delimiter: ';' | ',' = ';'): string {
  const lines = [formatCsvRow(headers, delimiter)];
  for (const row of rows) {
    lines.push(formatCsvRow(row, delimiter));
  }
  return `${lines.join('\n')}\n`;
}
