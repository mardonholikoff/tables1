import React, { useState } from 'react';
import {
  RotateCcw,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
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
    <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3.5 space-y-3 font-mono text-sky-950">
      {/* Filter Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-200 text-sky-800 border border-sky-300 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-sky-800" />
          </div>
          <span className="text-xs font-bold text-sky-950 uppercase tracking-wider font-mono">
            Ustunlar Bo'yicha Filtr
          </span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-600 text-white font-mono">
              {activeFiltersCount} ta faol filtr
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-sky-950 font-mono font-medium">
            Natija:{' '}
            <strong className="text-sky-950 font-black">
              {filteredCount}
            </strong>{' '}
            / {totalCount} ta yozuv
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-sky-900 hover:bg-sky-200 transition cursor-pointer px-2 py-1 bg-white rounded-lg border border-sky-300 font-mono font-bold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Barcha filtrlarni tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Column Buttons Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar font-mono">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border font-mono ${
                  isFiltered
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                    : 'bg-white text-sky-900 border-sky-300 hover:bg-sky-100'
                }`}
              >
                <span>{col.name}</span>
                {isFiltered && (
                  <span className="w-4 h-4 rounded-full bg-white text-sky-800 text-[10px] font-black flex items-center justify-center">
                    {currentFilter?.selectedValues.length || 1}
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {/* Dropdown with unique values and search */}
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenDropdownKey(null)}
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-white border border-sky-300 rounded-2xl shadow-xl p-3 space-y-2 animate-in fade-in duration-150 font-mono text-sky-950">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                      <span className="text-xs font-black text-sky-950 truncate max-w-[150px]">
                        {col.name}
                      </span>
                      {isFiltered && (
                        <button
                          onClick={() => handleClearColumnFilter(col.key)}
                          className="text-[11px] text-sky-700 hover:text-sky-950 font-bold hover:underline cursor-pointer"
                        >
                          Tozalash
                        </button>
                      )}
                    </div>

                    {/* Filter quick search inside dropdown */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-sky-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchValInDropdown}
                        onChange={(e) => setSearchValInDropdown(e.target.value)}
                        placeholder="Qiymatlarni qidirish..."
                        className="w-full pl-7 pr-2 py-1 bg-sky-50 border border-sky-300 rounded-lg text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-medium"
                      />
                    </div>

                    {/* Values list */}
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
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
                              className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition cursor-pointer text-left font-mono ${
                                isSelected
                                  ? 'bg-sky-600 text-white font-bold'
                                  : 'hover:bg-sky-100 text-sky-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    isSelected
                                      ? 'bg-white border-white text-sky-700'
                                      : 'border-sky-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="truncate">
                                  {d.value === 'nomsiz' ? (
                                    <em className="text-sky-800 font-mono text-[11px] not-italic">
                                      nomsiz
                                    </em>
                                  ) : (
                                    d.value
                                  )}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                  isSelected
                                    ? 'bg-sky-200 text-sky-950'
                                    : 'bg-sky-100 text-sky-900'
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
