import React from 'react';
import {
  Sparkles,
  Search,
  Filter,
  BarChart2,
  ListFilter,
  X,
  CheckCircle2,
  Percent,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CellInspection, UserTable } from '../types';
import { CHART_COLORS } from '../utils/analytics';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Katakcha Tahlili (Cell Inspector)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Qator #{rowIndex + 1}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ustun: <strong className="text-slate-200">{columnName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Target Value Display */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Tanlangan katak qiymati:</span>
              <div className="text-lg font-bold text-white break-all flex items-center gap-2">
                {isNomsiz ? (
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    nomsiz
                  </span>
                ) : (
                  <span>{value}</span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onApplyAsFilter(columnKey, isNomsiz ? 'nomsiz' : value);
                onClose();
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition cursor-pointer shrink-0 ml-3"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Faqat shuni filtrla</span>
            </button>
          </div>

          {/* Quick Frequency KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Ushbu ustundagi uchrashi
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {occurrences} <span className="text-xs font-normal text-slate-400">/ {totalRows} qatorda</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                Ustundagi ulushi
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {percentage}%
              </div>
            </div>
          </div>

          {/* Numeric Statistics if number */}
          {numericStats && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                Raqamli Ko'rsatkichlar Taqqoslashi
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Ustun o'rtacha qiymati:</span>
                  <span className="text-white font-mono font-bold">{numericStats.avg}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">O'rtachadan farqi:</span>
                  <span
                    className={`font-mono font-bold ${
                      Number(numericStats.diffFromAvgPercent) >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {Number(numericStats.diffFromAvgPercent) >= 0 ? '+' : ''}
                    {numericStats.diffFromAvgPercent}%
                  </span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Kattaroq yozuvlar:</span>
                  <span className="text-slate-200 font-mono">{numericStats.higherCount} ta</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Kichikroq yozuvlar:</span>
                  <span className="text-slate-200 font-mono">{numericStats.lowerCount} ta</span>
                </div>
              </div>
            </div>
          )}

          {/* List of other rows matching this cell value */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Shu qiymatga ega barcha yozuvlar ({matchingRows.length})
              </h4>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {matchingRows.map((r, idx) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl text-xs flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                    <span className="text-slate-200 font-medium truncate">
                      {table.columns
                        .slice(0, 3)
                        .map((c) => `${c.name}: ${r.values[c.key] || 'nomsiz'}`)
                        .join(' • ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
