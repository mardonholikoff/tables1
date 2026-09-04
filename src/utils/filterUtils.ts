import { ColumnFilter, TableRowData } from '../types';

/**
 * Parses numeric value from cell string, stripping currency symbols, spaces, commas.
 */
export const parseNumericValue = (val: string | undefined | null): number | null => {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;
  // Remove currency signs, spaces, words like so'm, sum, uzs, usd
  const cleaned = str
    .replace(/[\$,\s]/g, '')
    .replace(/so'?m/gi, '')
    .replace(/uzs/gi, '')
    .replace(/usd/gi, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Extracts YYYY-MM-DD from various date/time formats:
 * - ISO: 2026-09-03, 2026-09-03T14:20:00Z, 2026/09/03
 * - European/Uzbek: 03.09.2026, 03/09/2026, 03-09-2026
 * - Locale strings: 03.09.2026 14:30:00
 */
export const extractDateString = (val: string | undefined | null): string | null => {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  // 1. Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Check DD.MM.YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. Fallback Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    const y = dt.getFullYear();
    if (y >= 1990 && y <= 2100) {
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return null;
};

/**
 * Returns today's date in YYYY-MM-DD format based on local time
 */
export const getTodayDateString = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Returns yesterday's date in YYYY-MM-DD format based on local time
 */
export const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Checks if a specific row matches a specific column filter
 */
export const isRowMatchingFilter = (row: TableRowData, f: ColumnFilter): boolean => {
  // Global search across all cell values in this row
  if (f.columnKey === '_all_' || f.columnKey === 'global') {
    if (f.textQuery && f.textQuery.trim().length > 0) {
      const q = f.textQuery.trim().toLowerCase();
      const anyMatch = Object.values(row.values).some((v) =>
        (v || '').toLowerCase().includes(q)
      );
      if (!anyMatch) return false;
    }
    return true;
  }

  const rawVal = (row.values[f.columnKey] || '').trim();
  const displayVal = !rawVal || rawVal.toLowerCase() === 'nomsiz' ? 'nomsiz' : rawVal;

  // 1. Text Query (Nomlar bo'yicha substring qidiruv: masalan "kolodka")
  if (f.textQuery && f.textQuery.trim().length > 0) {
    const query = f.textQuery.trim().toLowerCase();
    if (!displayVal.toLowerCase().includes(query)) {
      return false;
    }
  }

  // 2. Selected Values (Mavjud alohida qiymatlar checkboxes - eski holatdagi filtr)
  if (f.selectedValues && f.selectedValues.length > 0) {
    const isMatched = f.selectedValues.some((sel) => {
      if (sel.toLowerCase() === 'nomsiz') {
        return displayVal === 'nomsiz';
      }
      return displayVal.toLowerCase() === sel.trim().toLowerCase();
    });
    if (!isMatched) {
      return false;
    }
  }

  // 3. Price / Number Range (Narxlar va sonlar bo'yicha)
  if (f.numericMin !== undefined && f.numericMin !== null) {
    const num = parseNumericValue(rawVal);
    if (num === null || num < f.numericMin) {
      return false;
    }
  }
  if (f.numericMax !== undefined && f.numericMax !== null) {
    const num = parseNumericValue(rawVal);
    if (num === null || num > f.numericMax) {
      return false;
    }
  }

  // 4. Exact Date (Sana bo'yicha: masalan aniq tanlangan sana)
  if (f.dateExact && f.dateExact.trim().length > 0) {
    const targetDate = f.dateExact.trim();
    const cellDate = extractDateString(rawVal);
    if (cellDate) {
      if (cellDate !== targetDate) return false;
    } else {
      // Fallback: check if raw string contains date part
      if (!rawVal.toLowerCase().includes(targetDate.toLowerCase())) {
        return false;
      }
    }
  }

  // 5. Date Preset (Bugun, Kecha, Shu hafta, Shu oy)
  if (f.datePreset && f.datePreset !== 'all') {
    const cellDate = extractDateString(rawVal);
    if (!cellDate) return false;

    const today = getTodayDateString();
    if (f.datePreset === 'today') {
      if (cellDate !== today) return false;
    } else if (f.datePreset === 'yesterday') {
      if (cellDate !== getYesterdayDateString()) return false;
    } else if (f.datePreset === 'this_week') {
      const now = new Date();
      const cellD = new Date(cellDate);
      const diffDays = (now.getTime() - cellD.getTime()) / (1000 * 3600 * 24);
      if (diffDays < 0 || diffDays > 7) return false;
    } else if (f.datePreset === 'this_month') {
      const now = new Date();
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (!cellDate.startsWith(currentMonthPrefix)) return false;
    }
  }

  return true;
};

/**
 * Checks if a row satisfies ALL active filters
 */
export const isRowMatchingAllFilters = (
  row: TableRowData,
  filters: ColumnFilter[]
): boolean => {
  if (!filters || filters.length === 0) return true;
  return filters.every((f) => isRowMatchingFilter(row, f));
};

/**
 * Checks if a column filter is actively filtering anything
 */
export const hasActiveFilter = (f: ColumnFilter | undefined): boolean => {
  if (!f) return false;
  if (f.textQuery && f.textQuery.trim().length > 0) return true;
  if (f.selectedValues && f.selectedValues.length > 0) return true;
  if (f.numericMin !== undefined && f.numericMin !== null) return true;
  if (f.numericMax !== undefined && f.numericMax !== null) return true;
  if (f.dateExact && f.dateExact.trim().length > 0) return true;
  if (f.datePreset && f.datePreset !== 'all') return true;
  return false;
};

/**
 * Detect column primary semantic type: 'date' | 'price' | 'text'
 */
export const detectColumnSemanticType = (
  columnName: string,
  sampleValues: string[]
): 'date' | 'price' | 'text' => {
  const nameLower = columnName.toLowerCase();

  // Name based heuristics
  if (
    nameLower.includes('sana') ||
    nameLower.includes('vaqt') ||
    nameLower.includes('date') ||
    nameLower.includes('time') ||
    nameLower.includes('kun')
  ) {
    return 'date';
  }

  if (
    nameLower.includes('narx') ||
    nameLower.includes('summa') ||
    nameLower.includes('qiymat') ||
    nameLower.includes('price') ||
    nameLower.includes('cost') ||
    nameLower.includes('miqdor') ||
    nameLower.includes('jami') ||
    nameLower.includes('total') ||
    nameLower.includes('daromad')
  ) {
    return 'price';
  }

  // Value based heuristics
  let dateMatches = 0;
  let numericMatches = 0;
  let totalChecked = 0;

  for (const val of sampleValues.slice(0, 10)) {
    if (!val || val.trim() === '' || val.toLowerCase() === 'nomsiz') continue;
    totalChecked++;
    if (extractDateString(val)) dateMatches++;
    if (parseNumericValue(val) !== null) numericMatches++;
  }

  if (totalChecked > 0) {
    if (dateMatches / totalChecked >= 0.5) return 'date';
    if (numericMatches / totalChecked >= 0.5) return 'price';
  }

  return 'text';
};
