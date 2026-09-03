import React from 'react';
import {
  Sparkles,
  Filter,
  X,
  Percent,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { CellInspection, UserTable } from '../types';

interface CellInspectorModalProps {
  inspection: CellInspection | null;
  table: UserTable;
  onClose: () => void;
  onApplyAsFilter: (columnKey: string, value: string) => void;
}

export const CellInspectorModal: React.FC<CellInspectorModalProps> = ({
  inspection,
  table,
  onClose,
  onApplyAsFilter,
}) => {
  if (!inspection) return null;

  const { columnKey, columnName, value, rowIndex } = inspection;
  const isNomsiz = !value || value.toLowerCase() === 'nomsiz';

  // Statistics for this specific cell value in this table
  const totalRows = table.rows.length;
  const matchingRows = table.rows.filter((r) => {
    const v = r.values[columnKey] || '';
    if (isNomsiz) {
      return !v || v.toLowerCase() === 'nomsiz';
    }
    return v.trim().toLowerCase() === value.trim().toLowerCase();
  });

  const occurrences = matchingRows.length;
  const percentage = totalRows > 0 ? ((occurrences / totalRows) * 100).toFixed(1) : '0';

  // Check if numeric
  const numericVal = Number((value || '').replace(/[\$,\s]/g, ''));
  const isNumeric = !isNaN(numericVal) && value.trim() !== '' && !isNomsiz;

  // If numeric, find rank or min/max comparisons
  let numericStats = null;
  if (isNumeric) {
    const allNumericInCol = table.rows
      .map((r) => Number((r.values[columnKey] || '').replace(/[\$,\s]/g, '')))
      .filter((n) => !isNaN(n));

    if (allNumericInCol.length > 0) {
      const sum = allNumericInCol.reduce((a, b) => a + b, 0);
      const avg = sum / allNumericInCol.length;
      const max = Math.max(...allNumericInCol);
      const min = Math.min(...allNumericInCol);
      const higherCount = allNumericInCol.filter((n) => n > numericVal).length;
      const lowerCount = allNumericInCol.filter((n) => n < numericVal).length;

      numericStats = {
        avg: avg.toFixed(2),
        max,
        min,
        diffFromAvgPercent: avg !== 0 ? (((numericVal - avg) / avg) * 100).toFixed(1) : '0',
        higherCount,
        lowerCount,
      };
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200 font-mono text-sky-950">
      <div className="bg-white border border-sky-300 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-sky-50 border-b border-sky-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center border border-sky-700">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-sky-950 tracking-tight font-mono">
                  Katakcha Tahlili (Cell Inspector)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                  Qator #{rowIndex + 1}
                </span>
              </div>
              <p className="text-xs text-sky-900 font-medium">
                Ustun: <strong className="text-sky-950">{columnName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-sky-900 hover:bg-sky-200 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Value Spotlight Card */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar font-mono">
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
            <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider block font-mono">
              Tanlangan Qiymat
            </span>
            <div className="text-xl font-bold text-sky-950 break-words font-mono">
              {value || <em className="text-sky-400">nomsiz</em>}
            </div>
            <div className="text-xs text-sky-900 pt-1 font-medium">
              Ushbu ustun bo'yicha takrorlanish: <strong className="text-sky-950 font-bold">{occurrences} ta</strong> ({percentage}%)
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white border border-sky-200 rounded-xl space-y-1 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-sky-900 font-bold">
                <Layers className="w-3.5 h-3.5 text-sky-700" />
                <span>Takrorlanish soni</span>
              </div>
              <div className="text-lg font-bold text-sky-950">
                {occurrences} <span className="text-xs text-sky-900 font-medium font-mono">/ {totalRows} qatordan</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-sky-200 rounded-xl space-y-1 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-sky-900 font-bold">
                <Percent className="w-3.5 h-3.5 text-sky-700" />
                <span>Jadvaldagi ulushi</span>
              </div>
              <div className="text-lg font-bold text-sky-950">
                {percentage}%
              </div>
            </div>
          </div>

          {/* If numeric, show deep stats */}
          {numericStats && (
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-950">
                <TrendingUp className="w-4 h-4 text-sky-700" />
                <span>Raqamli Ko'rsatkichlar & Taqqoslash</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 bg-white rounded-xl border border-sky-200">
                  <span className="text-[10px] text-sky-800 block font-bold">O'rtacha</span>
                  <span className="font-bold text-sky-950">{numericStats.avg}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-sky-200">
                  <span className="text-[10px] text-sky-800 block font-bold">Maksimum</span>
                  <span className="font-bold text-sky-950">{numericStats.max}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-sky-200">
                  <span className="text-[10px] text-sky-800 block font-bold">Minimum</span>
                  <span className="font-bold text-sky-950">{numericStats.min}</span>
                </div>
              </div>

              <p className="text-xs text-sky-950 font-medium">
                Bu qiymat ustun o'rtacha qiymatidan{' '}
                <strong className="text-sky-950 font-bold">
                  {Number(numericStats.diffFromAvgPercent) >= 0 ? '+' : ''}
                  {numericStats.diffFromAvgPercent}%
                </strong>{' '}
                farq qiladi. ({numericStats.higherCount} ta kattaroq, {numericStats.lowerCount} ta kichikroq qator mavjud).
              </p>
            </div>
          )}

          {/* Action to filter */}
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-center justify-between gap-3">
            <div className="text-xs text-sky-950 font-medium">
              Ushbu qiymat bo'yicha butun jadvalni filtrlashni xohlaysizmi?
            </div>
            <button
              onClick={() => {
                onApplyAsFilter(columnKey, value);
                onClose();
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs border border-sky-700 flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Filter className="w-3.5 h-3.5 text-white" />
              <span>Filtr sifatida qo'llash</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-sky-50 border-t border-sky-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-sky-100 border border-sky-300 rounded-xl text-xs font-bold text-sky-900 transition cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
