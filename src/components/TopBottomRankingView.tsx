import React, { useState } from 'react';
import { Trophy, ArrowUpRight, ArrowDownRight, Award, Layers } from 'lucide-react';
import { UserTable } from '../types';

interface TopBottomRankingViewProps {
  table: UserTable;
  onInspectCell?: (columnKey: string, columnName: string, val: string) => void;
}

export const TopBottomRankingView: React.FC<TopBottomRankingViewProps> = ({
  table,
  onInspectCell,
}) => {
  // Find numeric columns
  const numericColumns = table.columns.filter((col) => {
    const valid = table.rows
      .map((r) => Number((r.values[col.key] || '').replace(/[\$,\s]/g, '')))
      .filter((n) => !isNaN(n));
    return valid.length > 0 && valid.length >= table.rows.length * 0.4;
  });

  const [activeColumnKey, setActiveColumnKey] = useState<string>(
    numericColumns[0]?.key || table.columns[0]?.key || ''
  );

  const selectedCol =
    numericColumns.find((c) => c.key === activeColumnKey) || numericColumns[0];

  if (!selectedCol || table.rows.length === 0) {
    return null;
  }

  // Parse and sort rows by selected column
  const parsedRows = table.rows
    .map((row, idx) => {
      const raw = row.values[selectedCol.key] || '0';
      const num = Number(raw.replace(/[\$,\s]/g, ''));
      const labelCol = table.columns.find((c) => c.key !== selectedCol.key)?.key || table.columns[0]?.key;
      const label = row.values[labelCol] || `Yozuv #${idx + 1}`;

      return {
        row,
        idx,
        label,
        num: isNaN(num) ? 0 : num,
        displayVal: raw || 'nomsiz',
      };
    })
    .sort((a, b) => b.num - a.num);

  const topRows = parsedRows.slice(0, 5);
  const bottomRows = [...parsedRows].reverse().slice(0, 5);
  const maxVal = topRows[0]?.num || 1;

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
      {/* Header & Column Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Ekstremumlar va Reyting (Top & Bottom 5)</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Tanlangan ustun bo'yicha eng yuqori va eng quyi ko'rsatkichli yozuvlar
          </p>
        </div>

        {numericColumns.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-slate-400 shrink-0">Ustun:</span>
            {numericColumns.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveColumnKey(c.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  activeColumnKey === c.key
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top 5 & Bottom 5 Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 Box */}
        <div className="p-4 bg-slate-950/60 border border-emerald-900/30 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" />
              Eng Yuqori 5 ta Yozuv (Top 5)
            </span>
            <span className="text-[10px] text-slate-400">Maksimal qiymatlar</span>
          </div>

          <div className="space-y-2">
            {topRows.map((item, idx) => {
              const widthPercent = maxVal > 0 ? Math.max(8, (item.num / maxVal) * 100) : 10;
              return (
                <div
                  key={`top-${item.row.id}`}
                  onClick={() =>
                    onInspectCell &&
                    onInspectCell(selectedCol.key, selectedCol.name, item.displayVal)
                  }
                  className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <span className="text-slate-200 font-medium truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {item.displayVal}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom 5 Box */}
        <div className="p-4 bg-slate-950/60 border border-rose-900/30 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4" />
              Eng Quyi 5 ta Yozuv (Bottom 5)
            </span>
            <span className="text-[10px] text-slate-400">Minimal qiymatlar</span>
          </div>

          <div className="space-y-2">
            {bottomRows.map((item, idx) => {
              const widthPercent = maxVal > 0 ? Math.max(8, (item.num / maxVal) * 100) : 10;
              return (
                <div
                  key={`bot-${item.row.id}`}
                  onClick={() =>
                    onInspectCell &&
                    onInspectCell(selectedCol.key, selectedCol.name, item.displayVal)
                  }
                  className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[10px] flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <span className="text-slate-200 font-medium truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-rose-400 text-xs">
                      {item.displayVal}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
