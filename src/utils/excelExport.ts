import * as XLSX from 'xlsx';
import { UserTable, TableRowData } from '../types';
import { getFormattedDateTime } from './storage';

/**
 * Exports a UserTable to a genuine, modern Excel (.xlsx) workbook.
 * Formats column 1 (№) and column 2 (Sana va vaqt) automatically,
 * followed by user-defined columns with optimized column widths.
 */
export function exportTableToExcel(
  table: UserTable,
  rowsToExport?: TableRowData[],
  _filterNote?: string
): void {
  const rows = rowsToExport || table.rows;
  const exportTime = getFormattedDateTime();
  const sanitizedTitle = table.name.trim() || 'Jadval';

  // 1. Prepare Headers (Col 1: №, Col 2: Sana va vaqt, Col 3+: User columns)
  const headers = table.columns.map((col) => col.name);

  // 2. Prepare Data Rows
  const sheetData: (string | number)[][] = [headers];

  rows.forEach((row, rowIndex) => {
    const rowValues: (string | number)[] = [];

    table.columns.forEach((col, colIndex) => {
      if (colIndex === 0) {
        // 1-ustun: Tartib raqam
        const val = row.values[col.key];
        const num = Number(val);
        rowValues.push(!isNaN(num) && val ? num : rowIndex + 1);
      } else if (colIndex === 1) {
        // 2-ustun: Sana va vaqt
        const val = row.values[col.key];
        if (val && val.trim().length > 0) {
          rowValues.push(val.trim());
        } else if (row.createdAt) {
          const d = new Date(row.createdAt);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          const secs = String(d.getSeconds()).padStart(2, '0');
          rowValues.push(`${day}.${month}.${year} ${hours}:${mins}:${secs}`);
        } else {
          rowValues.push(exportTime);
        }
      } else {
        // 3-ustun va keyingilari
        const val = row.values[col.key];
        const strVal = val !== undefined && val !== null ? String(val).trim() : '';
        const numVal = Number(strVal.replace(/[\$,\s]/g, ''));

        // If numeric value without special characters, store as number
        if (!isNaN(numVal) && strVal !== '' && !strVal.includes('-') && !strVal.includes(':') && !strVal.includes('.')) {
          rowValues.push(numVal);
        } else {
          rowValues.push(strVal || '-');
        }
      }
    });

    sheetData.push(rowValues);
  });

  // 3. Create Worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // 4. Calculate Column Widths for comfortable readability
  const colWidths = table.columns.map((col, colIndex) => {
    if (colIndex === 0) return { wch: 8 }; // №
    if (colIndex === 1) return { wch: 22 }; // Sana va vaqt

    let maxLen = col.name.length;
    rows.forEach((r) => {
      const val = r.values[col.key];
      if (val) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });

    return { wch: Math.min(Math.max(maxLen + 4, 14), 50) };
  });

  worksheet['!cols'] = colWidths;

  // 5. Create Workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  const safeSheetName = sanitizedTitle.replace(/[:\\/?*\[\]]/g, '_').substring(0, 31) || 'Jadval';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // 6. Generate filename and trigger download as modern .xlsx
  const fileDate = exportTime.split(' ')[0].replace(/\./g, '-');
  const filename = `${sanitizedTitle.replace(/[\\/:*?"<>|\s]+/g, '_')}_${fileDate}.xlsx`;

  XLSX.writeFile(workbook, filename, { bookType: 'xlsx', compression: true });
}
