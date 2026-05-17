export interface TableColumn {
  header: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}

export function renderTable(columns: TableColumn[], rows: string[][]): string {
  const widths = columns.map((col, i) =>
    col.width ?? Math.max(col.header.length, ...rows.map(r => (r[i] ?? '').length))
  );

  const separator = widths.map(w => '─'.repeat(w + 2)).join('┼');
  const headerRow = columns.map((col, i) => ` ${col.header.padEnd(widths[i])} `).join('│');

  const dataRows = rows.map(row =>
    row.map((cell, i) => {
      const w = widths[i];
      const align = columns[i].align ?? 'left';
      if (align === 'right') return ` ${cell.padStart(w)} `;
      if (align === 'center') return ` ${cell.padStart(Math.floor((w + cell.length) / 2)).padEnd(w)} `;
      return ` ${cell.padEnd(w)} `;
    }).join('│')
  );

  return [headerRow, separator, ...dataRows].join('\n');
}
