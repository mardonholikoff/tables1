import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  Info,
} from 'lucide-react';
import { UserTable, TableRowData, ColumnFilter } from '../types';
import { FilterBar } from './FilterBar';
import { exportTableToExcel } from '../utils/excelExport';

interface TableViewProps {
  table: UserTable;
  onAddRecord: () => void;
  onEditRecord: (row: TableRowData) => void;
  onDeleteRecord: (tableId: string, rowId: string) => void;
  onRequestDeleteTable: (table: UserTable) => void;
  onInspectCell: (columnKey: string, columnName: string, value: string, rowIndex: number) => void;
  onEditTable?: () => void;
  onExportExcelLogged?: (table: UserTable, count: number) => void;
  // External filter control
  filters: ColumnFilter[];
  onFiltersChange: (filters: ColumnFilter[]) => void;
  onResetFilters: () => void;
  isReadOnly?: boolean;
}

export const TableView: React.FC<TableViewProps> = ({
  table,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onRequestDeleteTable,
  onInspectCell,
  onEditTable,
  onExportExcelLogged,
  filters,
  onFiltersChange,
  onResetFilters,
  isReadOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilterBar, setShowFilterBar] = useState(true);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Filter and sort rows
  const filteredAndSortedRows = useMemo(() => {
    let result = [...table.rows];

    // 1. Text search across entire table
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row.values).some((val) =>
          String(val || '').toLowerCase().includes(term)
        )
      );
    }

    // 2. Specific Column Filters
    if (filters.length > 0) {
      result = result.filter((row) => {
        return filters.every((f) => {
          const rawVal = (row.values[f.columnKey] || '').trim();
          const displayVal = !rawVal || rawVal.toLowerCase() === 'nomsiz' ? 'nomsiz' : rawVal;

          // Check selected values (e.g. from dropdown checkbox)
          if (f.selectedValues && f.selectedValues.length > 0) {
            if (!f.selectedValues.includes(displayVal)) {
              return false;
            }
          }

          // Check text query
          if (f.textQuery && f.textQuery.trim().length > 0) {
            if (!displayVal.toLowerCase().includes(f.textQuery.trim().toLowerCase())) {
              return false;
            }
          }

          return true;
        });
      });
    }

    // 3. Sorting
    if (sortKey) {
      result.sort((a, b) => {
        const valA = (a.values[sortKey] || '').toLowerCase();
        const valB = (b.values[sortKey] || '').toLowerCase();

        // If both are numbers
        const numA = Number(valA.replace(/[\$,\s]/g, ''));
        const numB = Number(valB.replace(/[\$,\s]/g, ''));

        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
    }

    return result;
  }, [table.rows, searchTerm, filters, sortKey, sortDirection]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (table.rows.length === 0) return;
    const filterNote = filters.length > 0 ? `Filtrlangan (${filteredAndSortedRows.length} / ${table.rows.length})` : undefined;
    exportTableToExcel(table, filteredAndSortedRows, filterNote);
    if (onExportExcelLogged) {
      onExportExcelLogged(table, filteredAndSortedRows.length);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (table.rows.length === 0) return;

    const headers = table.columns.map((c) => `"${c.name}"`).join(',');
    const rowsCSV = filteredAndSortedRows.map((row) =>
      table.columns
        .map((col) => `"${(row.values[col.key] || '').replace(/"/g, '""')}"`)
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rowsCSV].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${table.name.replace(/\s+/g, '_')}_jadval.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFiltersCount = filters.length;

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full space-y-3 font-mono text-sky-950">
      {/* Table Top Header */}
      <div className="p-4 sm:p-5 border-b border-sky-200 bg-sky-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-600 shadow-xs" />
            <h3 className="text-lg font-black text-sky-950 tracking-tight font-mono">
              {table.name}
            </h3>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 border border-sky-300">
              {table.rows.length} qator
            </span>
          </div>
          <p className="text-xs text-sky-800 mt-1 flex items-center gap-1.5 font-mono font-medium">
            <Calendar className="w-3.5 h-3.5 text-sky-700" />
            <span>Yaratilgan: {new Date(table.createdAt).toLocaleDateString('uz-UZ')}</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Edit Table Schema / Columns / Name */}
          {!isReadOnly && onEditTable && (
            <button
              id="tableview-edit-table-btn"
              onClick={onEditTable}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs active:scale-95"
              title="Jadval nomini o'zgartirish, yangi ustun qo'shish yoki mavjud ustunlarni tahrirlash"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-700" />
              <span>Jadvalni tahrirlash</span>
            </button>
          )}

          {/* Quick Add Row */}
          {!isReadOnly && (
            <button
              onClick={onAddRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs border border-sky-700 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Yozuv qo'shish</span>
            </button>
          )}

          {/* Toggle Filter Bar */}
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                : 'bg-white hover:bg-sky-50 text-sky-900 border-sky-300'
            }`}
            title="Filtr paneli"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrlar</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-sky-800 text-[10px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Export Excel (.xlsx) */}
          <button
            id="tableview-export-excel-btn"
            onClick={handleExportExcel}
            disabled={table.rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-40"
            title="Excel (.xlsx) formatida to'liq jadval sifatida yuklab olish"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={table.rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
            title="CSV formatida yuklab olish"
          >
            <Download className="w-3.5 h-3.5 text-sky-700" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Delete Table Button */}
          {!isReadOnly && (
            <button
              onClick={() => onRequestDeleteTable(table)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sky-900 hover:text-red-700 bg-white hover:bg-sky-50 rounded-xl border border-sky-300 transition cursor-pointer text-xs font-bold"
              title="Jadvalni butunlay o'chirish"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">O'chirish</span>
            </button>
          )}

          {isReadOnly && (
            <span className="px-2.5 py-1 rounded-lg bg-sky-200 text-sky-900 border border-sky-300 text-[11px] font-bold font-mono">
              Faqat ko'rish rejimi
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar Component */}
      {showFilterBar && (
        <div className="px-4">
          <FilterBar
            table={table}
            filters={filters}
            onFilterChange={onFiltersChange}
            onResetFilters={onResetFilters}
            filteredCount={filteredAndSortedRows.length}
            totalCount={table.rows.length}
          />
        </div>
      )}

      {/* Quick Search & Hint */}
      <div className="px-4 py-2 bg-sky-50/50 border-y border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-sky-700 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Jadval bo'ylab matn qidirish..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-sky-300 rounded-lg text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-medium"
          />
        </div>

        <div className="text-[11px] text-sky-900 flex items-center gap-1.5 font-mono font-semibold">
          <Info className="w-3.5 h-3.5 text-sky-700 shrink-0" />
          <span>Katak ustiga bosib, uning tahlilini ochishingiz mumkin.</span>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="overflow-x-auto flex-1 min-h-[300px] px-4">
        {table.rows.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 border border-sky-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-sky-950 mb-1 font-mono">Jadvalda yozuvlar yo'q</h4>
            <p className="text-xs text-sky-800 max-w-xs mb-4 font-medium">
              Jadvalga birinchi ma'lumotingizni qo'shing va avtomatik analitikani kuzating.
            </p>
            <button
              onClick={onAddRecord}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Yozuv qo'shish</span>
            </button>
          </div>
        ) : filteredAndSortedRows.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <Filter className="w-8 h-8 text-sky-400 mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-sky-950 mb-1 font-mono">Filtrga mos keluvchi yozuv topilmadi</h4>
            <p className="text-xs text-sky-800 max-w-xs mb-3 font-medium">
              Qidiruv so'zini yoki ustun filtrlarini tozalab ko'ring.
            </p>
            <button
              onClick={onResetFilters}
              className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sky-100/70 border-b border-sky-200 text-sky-950 font-black uppercase tracking-wider text-[11px] font-mono">
                {table.columns.map((col, cIdx) => {
                  const isSorted = sortKey === col.key;
                  const hasColFilter = filters.some((f) => f.columnKey === col.key);
                  const isSystemCol = cIdx < 2;

                  return (
                    <th
                      key={col.id}
                      onClick={() => handleSort(col.key)}
                      className={`py-3 px-3 cursor-pointer hover:bg-sky-200/60 transition group select-none whitespace-nowrap ${
                        cIdx === 0 ? 'w-14 text-center' : ''
                      }`}
                    >
                      <div className={`flex items-center gap-2 ${cIdx === 0 ? 'justify-center' : 'justify-between'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={hasColFilter ? 'text-sky-800 font-black underline' : isSystemCol ? 'text-sky-950 font-black' : 'text-sky-950 font-bold'}>
                            {col.name}
                          </span>
                          {hasColFilter && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                          )}
                          <span className="text-sky-700 group-hover:text-sky-950 transition">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-sky-950" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-sky-950" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                            )}
                          </span>
                        </div>

                        {!isReadOnly && onEditTable && !isSystemCol && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTable();
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-sky-900 hover:bg-sky-200 rounded transition cursor-pointer"
                            title={`"${col.name}" ustunini tahrirlash yoki yangi ustun qo'shish`}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
                {!isReadOnly && (
                  <th className="py-3 px-3 text-right w-20 font-mono text-sky-950 font-black">Amallar</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {filteredAndSortedRows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className="hover:bg-sky-50/80 transition group border-b border-sky-100"
                >
                  {table.columns.map((col, cIdx) => {
                    const cellVal = row.values[col.key] || '';
                    const isNomsiz = !cellVal || cellVal.toLowerCase() === 'nomsiz';

                    return (
                      <td
                        key={col.id}
                        onClick={() => onInspectCell(col.key, col.name, cellVal, rowIdx)}
                        className={`py-2.5 px-3 text-sky-950 cursor-pointer hover:bg-sky-100/70 transition group/cell ${
                          cIdx === 0 ? 'text-center font-mono text-sky-900 font-bold' : ''
                        }`}
                        title="Ushbu katak tahlilini ko'rish"
                      >
                        {isNomsiz ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-sky-100 text-sky-800 border border-sky-200 group-hover/cell:border-sky-400">
                            nomsiz
                          </span>
                        ) : (
                          <span className="font-semibold text-sky-950 group-hover/cell:underline decoration-sky-600 underline-offset-2">
                            {cellVal}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {!isReadOnly && (
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRecord(row);
                          }}
                          className="p-1 text-sky-900 hover:bg-sky-200 rounded-md transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRecord(table.id, row.id);
                          }}
                          className="p-1 text-sky-900 hover:text-red-700 hover:bg-sky-200 rounded-md transition cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-sky-50 border-t border-sky-200 text-[11px] text-sky-900 flex items-center justify-between font-mono font-medium">
        <div>
          Ko'rsatilmoqda:{' '}
          <strong className="text-sky-950 font-black">{filteredAndSortedRows.length}</strong> / {table.rows.length} qator
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
          <span className="font-bold text-sky-900">Real-vaqt sinxronlangan</span>
        </div>
      </div>
    </div>
  );
};
