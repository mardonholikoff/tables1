import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  ChevronDown,
  SlidersHorizontal,
  X,
  Filter,
} from 'lucide-react';
import { UserTable, ColumnFilter } from '../types';
import { hasActiveFilter } from '../utils/filterUtils';
import { ColumnValueFilterDropdown } from './ColumnValueFilterDropdown';

interface FilterBarProps {
  table: UserTable;
  originalTable?: UserTable;
  filters: ColumnFilter[];
  onFilterChange: (filters: ColumnFilter[]) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  title?: string;
  subtitle?: string;
  isDashboardMode?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  table,
  originalTable,
  filters,
  onFilterChange,
  onResetFilters,
  filteredCount,
  totalCount,
  title,
  subtitle,
  isDashboardMode = false,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<{
    key: string;
    rect: DOMRect;
  } | null>(null);

  // Use originalTable (if available) so that all distinct values remain selectable
  const dataSourceTable = originalTable || table;

  // Get active filter object for a specific column
  const getFilter = (key: string): ColumnFilter | undefined =>
    filters.find((f) => f.columnKey === key);

  // Check if a specific column has an active filter
  const isColumnFiltered = (key: string) => {
    return hasActiveFilter(getFilter(key));
  };

  // Global search filter (_all_)
  const globalFilter = getFilter('_all_');
  const globalSearchVal = globalFilter?.textQuery || '';

  const handleGlobalSearchChange = (val: string) => {
    if (!val || val.trim() === '') {
      onFilterChange(filters.filter((f) => f.columnKey !== '_all_'));
    } else {
      const existing = globalFilter || {
        columnKey: '_all_',
        textQuery: '',
      };
      const others = filters.filter((f) => f.columnKey !== '_all_');
      onFilterChange([...others, { ...existing, textQuery: val }]);
    }
  };

  const handleClearColumnFilter = (columnKey: string) => {
    onFilterChange(filters.filter((f) => f.columnKey !== columnKey));
  };

  const activeFiltersCount = filters.filter(hasActiveFilter).length;

  return (
    <div className="bg-sky-50/95 border border-sky-200 rounded-2xl p-3.5 space-y-3 font-mono text-sky-950 shadow-xs">
      {/* Filter Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-200 text-sky-800 border border-sky-300 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-sky-800" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-sky-950 uppercase tracking-wider font-mono">
                {title || "Ustun Ma'lumotlari Bo'yicha Filtr"}
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-600 text-white font-mono shadow-xs">
                  {activeFiltersCount} ta ustunda filtr faol
                </span>
              )}
            </div>
            <span className="text-[10px] text-sky-700 font-medium">
              {subtitle || "Ustun nomiga bosing va ichidagi ma'lumotlarni (a, b...) tanlang"}
            </span>
          </div>
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
              className="flex items-center gap-1 text-xs text-sky-900 hover:bg-sky-200 transition cursor-pointer px-2.5 py-1 bg-white rounded-lg border border-sky-300 font-mono font-bold shadow-xs active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-sky-700" />
              <span>Filtrlarni tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Row Search Field */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-sky-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={globalSearchVal}
          onChange={(e) => handleGlobalSearchChange(e.target.value)}
          placeholder="Jadval qatorlari bo'yicha tezkor qidiruv..."
          className="w-full pl-8 pr-7 py-1.5 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-medium shadow-xs"
        />
        {globalSearchVal && (
          <button
            onClick={() => handleGlobalSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-500 hover:text-sky-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Column Name Buttons Row */}
      <div className="space-y-1 pt-1 border-t border-sky-200/80">
        <div className="text-[10px] text-sky-800 font-bold uppercase tracking-wide">
          Ustunlar bo'yicha ma'lumotlarni tanlash (Nomiga bosing):
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar font-mono">
          {table.columns.map((col) => {
            const isFiltered = isColumnFiltered(col.key);
            const currentFilter = getFilter(col.key);
            const selectedVals = currentFilter?.selectedValues || [];

            // Human-readable summary of selected values
            let badgeText: string | null = null;
            if (selectedVals.length === 1) {
              badgeText = selectedVals[0];
            } else if (selectedVals.length > 1) {
              badgeText = `${selectedVals.length} ta`;
            } else if (currentFilter?.textQuery) {
              badgeText = `"${currentFilter.textQuery}"`;
            }

            return (
              <div key={col.id} className="relative shrink-0 flex items-center">
                {/* Column Name Trigger Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setActiveDropdown(
                      activeDropdown?.key === col.key ? null : { key: col.key, rect }
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border font-mono ${
                    isFiltered
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-300'
                      : 'bg-white text-sky-900 border-sky-300 hover:bg-sky-100'
                  }`}
                  title={`${col.name} ustuni ichidagi ma'lumotlarni tanlash`}
                >
                  <Filter className={`w-3 h-3 ${isFiltered ? 'text-white' : 'text-sky-600'}`} />
                  <span>{col.name}</span>

                  {badgeText && (
                    <span className="px-1.5 py-0.2 rounded-md bg-white text-sky-800 text-[10px] font-black truncate max-w-[100px]">
                      {badgeText}
                    </span>
                  )}

                  <ChevronDown className="w-3 h-3 text-current opacity-70" />
                </button>

                {/* Quick clear button on active filter */}
                {isFiltered && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearColumnFilter(col.key);
                    }}
                    className="ml-1 text-sky-700 hover:text-red-700 text-xs font-bold p-1 hover:bg-sky-200 rounded-md"
                    title="Ushbu ustun filtrini tozalash"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Column Value Filter Dropdown */}
      {activeDropdown && (
        <ColumnValueFilterDropdown
          column={table.columns.find((c) => c.key === activeDropdown.key)!}
          allRows={dataSourceTable.rows}
          currentFilteredRows={table.rows}
          currentFilter={getFilter(activeDropdown.key)}
          onFilterChange={(updated) => {
            if (!updated) {
              handleClearColumnFilter(activeDropdown.key);
            } else {
              const others = filters.filter((f) => f.columnKey !== activeDropdown.key);
              onFilterChange([...others, updated]);
            }
          }}
          isOpen={true}
          onClose={() => setActiveDropdown(null)}
          anchorRect={activeDropdown.rect}
        />
      )}
    </div>
  );
};
