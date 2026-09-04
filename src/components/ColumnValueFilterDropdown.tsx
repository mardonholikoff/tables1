import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Check,
  X,
  Filter,
  ArrowUpAZ,
  ArrowDownZA,
  RotateCcw,
} from 'lucide-react';
import { ColumnDefinition, TableRowData, ColumnFilter } from '../types';

interface ColumnValueFilterDropdownProps {
  column: ColumnDefinition;
  allRows: TableRowData[];
  currentFilteredRows?: TableRowData[];
  currentFilter?: ColumnFilter;
  onFilterChange: (updatedFilter: ColumnFilter | null) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  onSort?: (direction: 'asc' | 'desc') => void;
  currentSort?: 'asc' | 'desc' | null;
}

export const ColumnValueFilterDropdown: React.FC<ColumnValueFilterDropdownProps> = ({
  column,
  allRows,
  currentFilteredRows,
  currentFilter,
  onFilterChange,
  isOpen,
  onClose,
  anchorRect,
  onSort,
  currentSort,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract distinct values from allRows with counts
  const distinctValues = useMemo(() => {
    const countsMap = new Map<string, { display: string; totalCount: number; currentCount: number }>();

    // Count in allRows
    allRows.forEach((r) => {
      const raw = (r.values[column.key] || '').trim();
      const displayVal = !raw || raw.toLowerCase() === 'nomsiz' ? 'nomsiz' : raw;
      const key = displayVal.toLowerCase();

      const existing = countsMap.get(key);
      if (existing) {
        existing.totalCount += 1;
      } else {
        countsMap.set(key, { display: displayVal, totalCount: 1, currentCount: 0 });
      }
    });

    // Count in currentFilteredRows (if available)
    if (currentFilteredRows) {
      currentFilteredRows.forEach((r) => {
        const raw = (r.values[column.key] || '').trim();
        const displayVal = !raw || raw.toLowerCase() === 'nomsiz' ? 'nomsiz' : raw;
        const key = displayVal.toLowerCase();
        const existing = countsMap.get(key);
        if (existing) {
          existing.currentCount += 1;
        }
      });
    }

    // Sort by count descending, then alphabetical
    return Array.from(countsMap.values()).sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.display.localeCompare(b.display);
    });
  }, [allRows, currentFilteredRows, column.key]);

  if (!isOpen) return null;

  const selectedValues = currentFilter?.selectedValues || [];

  // Filter distinct values by search query
  const filteredDistinctValues = distinctValues.filter((item) =>
    item.display.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Toggle a single value (e.g. check "a", then check "b")
   */
  const handleToggleValue = (value: string) => {
    const isCurrentlySelected = selectedValues.some(
      (v) => v.toLowerCase() === value.toLowerCase()
    );

    let nextSelected: string[];
    if (isCurrentlySelected) {
      nextSelected = selectedValues.filter(
        (v) => v.toLowerCase() !== value.toLowerCase()
      );
    } else {
      nextSelected = [...selectedValues, value];
    }

    if (nextSelected.length === 0) {
      // Clear filter
      onFilterChange(null);
    } else {
      const updated: ColumnFilter = {
        ...(currentFilter || { columnKey: column.key }),
        columnKey: column.key,
        selectedValues: nextSelected,
      };
      onFilterChange(updated);
    }
  };

  /**
   * Select ONLY this value (e.g. click "Faqat a")
   */
  const handleSelectOnly = (value: string) => {
    const updated: ColumnFilter = {
      ...(currentFilter || { columnKey: column.key }),
      columnKey: column.key,
      selectedValues: [value],
    };
    onFilterChange(updated);
  };

  /**
   * Clear all selections for this column
   */
  const handleClearFilter = () => {
    onFilterChange(null);
  };

  /**
   * Select all distinct values (equivalent to showing everything / no restriction)
   */
  const handleSelectAll = () => {
    onFilterChange(null);
  };

  // Position calculation
  let topPos = 100;
  let leftPos = 100;

  if (anchorRect) {
    topPos = anchorRect.bottom + 6;
    leftPos = Math.max(12, Math.min(anchorRect.left, window.innerWidth - 336));
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/10 transition-opacity"
        onClick={onClose}
      />

      {/* Popover Card */}
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${topPos}px`,
          left: `${leftPos}px`,
          zIndex: 9999,
        }}
        className="w-80 bg-white border-2 border-sky-300 rounded-2xl shadow-2xl p-3.5 space-y-3 font-mono text-sky-950 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-sky-200">
          <div className="flex items-center gap-1.5 truncate">
            <Filter className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="text-xs font-black text-sky-950 truncate max-w-[170px]" title={column.name}>
              {column.name}
            </span>
            <span className="text-[10px] text-sky-600 font-bold shrink-0">
              ({distinctValues.length} xil)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sky-600 hover:text-sky-900 hover:bg-sky-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Actions (if onSort passed) */}
        {onSort && (
          <div className="flex items-center gap-1.5 pb-2 border-b border-sky-100">
            <span className="text-[10px] text-sky-700 font-bold uppercase mr-1">
              Saralash:
            </span>
            <button
              type="button"
              onClick={() => onSort('asc')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                currentSort === 'asc'
                  ? 'bg-sky-600 text-white border-sky-700'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
              }`}
            >
              <ArrowUpAZ className="w-3.5 h-3.5" />
              <span>A → Z</span>
            </button>
            <button
              type="button"
              onClick={() => onSort('desc')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                currentSort === 'desc'
                  ? 'bg-sky-600 text-white border-sky-700'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
              }`}
            >
              <ArrowDownZA className="w-3.5 h-3.5" />
              <span>Z → A</span>
            </button>
          </div>
        )}

        {/* Guidance Prompt */}
        <div className="text-[11px] text-sky-800 bg-sky-50/90 border border-sky-200 rounded-lg p-2 font-medium leading-relaxed">
          Kerakli qiymatlarni tanlang. Masalan: <strong>a</strong> tanlansa barcha <strong>a</strong> lar, <strong>a va b</strong> tanlansa barcha <strong>a va b</strong> lar chiqadi.
        </div>

        {/* Search input for values */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-sky-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Qiymatni qidirish..."
            className="w-full pl-8 pr-7 py-1.5 bg-sky-50/50 border border-sky-300 rounded-xl text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-500 hover:text-sky-800"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Selection Tools (Barchasi / Tozalash) */}
        <div className="flex items-center justify-between text-[11px] font-bold px-1 text-sky-900 border-b border-sky-100 pb-1.5">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sky-700 hover:text-sky-950 hover:underline cursor-pointer"
          >
            Barchasini ko'rsatish
          </button>
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Filtrni tozalash</span>
            </button>
          )}
        </div>

        {/* Values List with Checkboxes */}
        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {filteredDistinctValues.length === 0 ? (
            <div className="text-xs text-sky-600 p-4 text-center">
              Mos keluvchi qiymat topilmadi
            </div>
          ) : (
            filteredDistinctValues.map((item) => {
              const isSelected = selectedValues.some(
                (v) => v.toLowerCase() === item.display.toLowerCase()
              );

              return (
                <div
                  key={item.display}
                  className={`group flex items-center justify-between p-1.5 rounded-xl text-xs transition font-mono ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'hover:bg-sky-100 text-sky-900'
                  }`}
                >
                  {/* Checkbox and Value text */}
                  <button
                    type="button"
                    onClick={() => handleToggleValue(item.display)}
                    className="flex items-center gap-2 truncate flex-1 cursor-pointer text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition ${
                        isSelected
                          ? 'bg-white border-white text-sky-700 shadow-xs'
                          : 'border-sky-300 bg-white group-hover:border-sky-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">
                      {item.display === 'nomsiz' ? (
                        <em className="text-sky-700 not-italic">(bo'sh)</em>
                      ) : (
                        item.display
                      )}
                    </span>
                  </button>

                  {/* Count & "Faqat" shortcut */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                        isSelected
                          ? 'bg-sky-200 text-sky-950'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {item.totalCount} ta
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectOnly(item.display)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md transition cursor-pointer font-bold ${
                        isSelected
                          ? 'text-white hover:bg-sky-700'
                          : 'text-sky-700 hover:text-sky-950 hover:bg-sky-200'
                      }`}
                      title={`Faqat "${item.display}" ni tanlash`}
                    >
                      Faqat
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & OK button */}
        <div className="pt-2 border-t border-sky-200 flex items-center justify-between">
          <div className="text-[11px] text-sky-800 font-bold">
            {selectedValues.length > 0 ? (
              <span>{selectedValues.length} ta tanlandi</span>
            ) : (
              <span className="text-sky-600 font-normal">Hammasi ko'rsatilmoqda</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow-xs active:scale-95"
          >
            Tayyor
          </button>
        </div>
      </div>
    </>
  );
};
