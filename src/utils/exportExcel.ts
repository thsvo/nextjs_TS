/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx';

export function exportRowsToExcel(rows: any[], filename: string, sheetName = 'Sheet1') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
