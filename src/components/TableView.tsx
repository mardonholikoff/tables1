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
  Layers,
  Calendar,
  Sparkles,
  Filter,
  Info,
  SlidersHorizontal,
  Settings,
} from 'lucide-react';
import { UserTable, TableRowData, ColumnFilter } from '../types';
import { FilterBar } from './FilterBar';

interface TableViewProps {
  table: UserTable;
  onAddRecord: () => void;
  onEditRecord: (row: TableRowData) => void;
  onDeleteRecord: (tableId: string, rowId: string) => void;
  onRequestDeleteTable: (table: UserTable) => void;
  onInspectCell: (columnKey: string, columnName: string, value: string, rowIndex: number) => void;
  onEditTable?: () => void;
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full space-y-3">
      {/* Table Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {table.name}
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {table.columns.length} ustun • {table.rows.length} yozuv
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Yaratilgan: {new Date(table.createdAt).toLocaleDateString('uz-UZ')}</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Edit Table Schema / Columns / Name (Only if not read only) */}
          {!isReadOnly && onEditTable && (
            <button
              id="tableview-edit-table-btn"
              onClick={onEditTable}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
              title="Jadval nomini o'zgartirish, yangi ustun qo'shish yoki mavjud ustunlarni tahrirlash"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Jadvalni tahrirlash</span>
            </button>
          )}

          {/* Quick Add Row (Only if not read only) */}
          {!isReadOnly && (
            <button
              onClick={onAddRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yozuv qo'shish</span>
            </button>
          )}

          {/* Toggle Filter Bar */}
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Filtr paneli"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrlar</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={table.rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium rounded-xl transition cursor-pointer disabled:opacity-40"
            title="CSV formatida yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Delete Table Button with clear warning (Only if not read only) */}
          {!isReadOnly && (
            <button
              onClick={() => onRequestDeleteTable(table)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/60 rounded-xl border border-rose-900/40 transition cursor-pointer text-xs font-medium"
              title="Jadvalni butunlay o'chirish"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Jadvalni o'chirish</span>
            </button>
          )}

          {isReadOnly && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium">
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
      <div className="px-4 py-2 bg-slate-950/60 border-y border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Jadval bo'ylab matn qidirish..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Katak ustiga bosib, uning tahlilini ochishingiz mumkin.</span>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="overflow-x-auto flex-1 min-h-[300px] px-4">
        {table.rows.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Jadvalda yozuvlar yo'q</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Jadvalga birinchi ma'lumotingizni qo'shing va avtomatik analitikani kuzating.
            </p>
            <button
              onClick={onAddRecord}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yozuv qo'shish</span>
            </button>
          </div>
        ) : filteredAndSortedRows.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <Filter className="w-8 h-8 text-amber-400 mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-white mb-1">Filtrga mos keluvchi yozuv topilmadi</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-3">
              Qidiruv so'zini yoki ustun filtrlarini tozalab ko'ring.
            </p>
            <button
              onClick={onResetFilters}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center text-[10px] text-slate-400">#</th>
                {table.columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  const hasColFilter = filters.some((f) => f.columnKey === col.key);

                  return (
                    <th
                      key={col.id}
                      onClick={() => handleSort(col.key)}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-800/60 transition group select-none whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={hasColFilter ? 'text-blue-400 font-bold' : ''}>
                            {col.name}
                          </span>
                          {hasColFilter && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          )}
                          <span className="text-slate-400 group-hover:text-blue-400 transition">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                            )}
                          </span>
                        </div>

                        {!isReadOnly && onEditTable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTable();
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/50 rounded transition cursor-pointer"
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
                  <th className="py-3 px-3 text-right w-20">Amallar</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAndSortedRows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/40 transition group"
                >
                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                    {rowIdx + 1}
                  </td>
                  {table.columns.map((col) => {
                    const cellVal = row.values[col.key] || '';
                    const isNomsiz = !cellVal || cellVal.toLowerCase() === 'nomsiz';

                    return (
                      <td
                        key={col.id}
                        onClick={() => onInspectCell(col.key, col.name, cellVal, rowIdx)}
                        className="py-2.5 px-3 text-slate-200 cursor-pointer hover:bg-blue-500/10 hover:text-blue-200 transition group/cell"
                        title="Ushbu katak tahlilini ko'rish"
                      >
                        {isNomsiz ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 group-hover/cell:border-blue-400/40">
                            nomsiz
                          </span>
                        ) : (
                          <span className="font-medium group-hover/cell:underline decoration-blue-400/40 underline-offset-2">
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
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-950/40 rounded-md transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRecord(table.id, row.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition cursor-pointer"
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
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          Ko'rsatilmoqda:{' '}
          <strong className="text-white font-semibold">{filteredAndSortedRows.length}</strong> / {table.rows.length} qator
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-vaqt analitikasiga ulangan</span>
        </div>
      </div>
    </div>
  );
};
