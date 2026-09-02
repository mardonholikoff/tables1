import React, { useState } from 'react';
import {
  Filter,
  X,
  RotateCcw,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserTable, ColumnFilter } from '../types';

interface FilterBarProps {
  table: UserTable;
  filters: ColumnFilter[];
  onFilterChange: (filters: ColumnFilter[]) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  table,
  filters,
  onFilterChange,
  onResetFilters,
  filteredCount,
  totalCount,
}) => {
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [searchValInDropdown, setSearchValInDropdown] = useState('');

  // Get active filter for a column
  const getFilter = (key: string) => filters.find((f) => f.columnKey === key);

  // Check if a specific column has active filter
  const isColumnFiltered = (key: string) => {
    const f = getFilter(key);
    return f && (f.selectedValues.length > 0 || (f.textQuery && f.textQuery.trim().length > 0));
  };

  // Get distinct values for a column
  const getDistinctValues = (key: string) => {
    const counts: Record<string, number> = {};
    table.rows.forEach((r) => {
      const val = (r.values[key] || '').trim();
      const displayVal = !val || val.toLowerCase() === 'nomsiz' ? 'nomsiz' : val;
      counts[displayVal] = (counts[displayVal] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  };

  const handleToggleValue = (columnKey: string, val: string) => {
    const existing = getFilter(columnKey);
    let updatedSelected: string[] = [];

    if (!existing) {
      updatedSelected = [val];
    } else {
      if (existing.selectedValues.includes(val)) {
        updatedSelected = existing.selectedValues.filter((v) => v !== val);
      } else {
        updatedSelected = [...existing.selectedValues, val];
      }
    }

    if (updatedSelected.length === 0 && (!existing?.textQuery || existing.textQuery.trim() === '')) {
      // Remove filter for this column
      onFilterChange(filters.filter((f) => f.columnKey !== columnKey));
    } else {
      const newFilter: ColumnFilter = {
        columnKey,
        selectedValues: updatedSelected,
        textQuery: existing?.textQuery || '',
      };
      const filteredOut = filters.filter((f) => f.columnKey !== columnKey);
      onFilterChange([...filteredOut, newFilter]);
    }
  };

  const handleClearColumnFilter = (columnKey: string) => {
    onFilterChange(filters.filter((f) => f.columnKey !== columnKey));
  };

  const activeFiltersCount = filters.reduce(
    (acc, f) => acc + (f.selectedValues.length > 0 || f.textQuery ? 1 : 0),
    0
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
      {/* Filter Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Ustunlar Bo'yicha Filtr
          </span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white animate-pulse">
              {activeFiltersCount} ta faol filtr
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">
            Natija:{' '}
            <strong className={filteredCount < totalCount ? 'text-amber-400 font-mono' : 'text-emerald-400 font-mono'}>
              {filteredCount}
            </strong>{' '}
            / {totalCount} ta yozuv
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer px-2 py-1 bg-rose-950/30 hover:bg-rose-950/60 rounded-lg border border-rose-900/40"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Barcha filtrlarni tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Column Buttons Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {table.columns.map((col) => {
          const isFiltered = isColumnFiltered(col.key);
          const currentFilter = getFilter(col.key);
          const distinct = getDistinctValues(col.key);
          const isOpen = openDropdownKey === col.key;

          return (
            <div key={col.id} className="relative shrink-0">
              <button
                onClick={() => {
                  setOpenDropdownKey(isOpen ? null : col.key);
                  setSearchValInDropdown('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                  isFiltered
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <span>{col.name}</span>
                {isFiltered && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {currentFilter?.selectedValues.length || 1}
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {/* Dropdown with unique values and search */}
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenDropdownKey(null)}
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">
                        {col.name}
                      </span>
                      {isFiltered && (
                        <button
                          onClick={() => handleClearColumnFilter(col.key)}
                          className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>

                    {/* Filter quick search inside dropdown */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchValInDropdown}
                        onChange={(e) => setSearchValInDropdown(e.target.value)}
                        placeholder="Qiymatlarni qidirish..."
                        className="w-full pl-7 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Values list */}
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {distinct
                        .filter((d) =>
                          d.value.toLowerCase().includes(searchValInDropdown.toLowerCase())
                        )
                        .map((d) => {
                          const isSelected =
                            currentFilter?.selectedValues.includes(d.value) || false;

                          return (
                            <button
                              key={d.value}
                              onClick={() => handleToggleValue(col.key, d.value)}
                              className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-blue-600 text-white font-medium'
                                  : 'hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    isSelected
                                      ? 'bg-white border-white text-blue-600'
                                      : 'border-slate-600 bg-slate-950'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="truncate">
                                  {d.value === 'nomsiz' ? (
                                    <em className="text-amber-300 font-mono text-[11px] not-italic">
                                      nomsiz
                                    </em>
                                  ) : (
                                    d.value
                                  )}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                  isSelected
                                    ? 'bg-blue-700 text-blue-100'
                                    : 'bg-slate-950 text-slate-400'
                                }`}
                              >
                                {d.count}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
