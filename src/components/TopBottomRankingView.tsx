import React, { useState } from 'react';
import { Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm space-y-4 font-mono text-sky-950">
      {/* Header & Column Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Trophy className="w-4 h-4 text-sky-700" />
            <span>Ekstremumlar va Reyting (Top & Bottom 5)</span>
          </h4>
          <p className="text-[11px] text-sky-900 font-mono font-medium">
            Tanlangan ustun bo'yicha eng yuqori va eng quyi ko'rsatkichli yozuvlar
          </p>
        </div>

        {numericColumns.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-sky-900 shrink-0 font-mono font-bold">Ustun:</span>
            {numericColumns.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveColumnKey(c.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                  activeColumnKey === c.key
                    ? 'bg-sky-600 text-white border-sky-700 font-bold shadow-xs'
                    : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-50'
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
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200">
            <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5 font-mono">
              <ArrowUpRight className="w-4 h-4 text-emerald-700" />
              Eng Yuqori 5 ta Yozuv (Top 5)
            </span>
            <span className="text-[10px] text-sky-900 font-mono font-medium">Maksimal qiymatlar</span>
          </div>

          <div className="space-y-2">
            {topRows.map((item, index) => {
              const barWidth = maxVal > 0 ? Math.max(5, (item.num / maxVal) * 100) : 0;
              return (
                <div
                  key={item.row.id}
                  onClick={() =>
                    onInspectCell &&
                    onInspectCell(selectedCol.key, selectedCol.name, item.displayVal)
                  }
                  className="p-2 bg-white rounded-xl border border-sky-200 hover:border-sky-400 transition cursor-pointer space-y-1 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-sky-950 truncate">{item.label}</span>
                    </div>
                    <span className="font-bold text-sky-950 font-mono shrink-0">
                      {item.displayVal}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom 5 Box */}
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200">
            <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5 font-mono">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              Eng Quyi 5 ta Yozuv (Bottom 5)
            </span>
            <span className="text-[10px] text-sky-900 font-mono font-medium">Minimal qiymatlar</span>
          </div>

          <div className="space-y-2">
            {bottomRows.map((item, index) => {
              return (
                <div
                  key={item.row.id}
                  onClick={() =>
                    onInspectCell &&
                    onInspectCell(selectedCol.key, selectedCol.name, item.displayVal)
                  }
                  className="p-2 bg-white rounded-xl border border-sky-200 hover:border-sky-400 transition cursor-pointer space-y-1 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-red-100 text-red-900 border border-red-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        #{parsedRows.length - index}
                      </span>
                      <span className="font-bold text-sky-950 truncate">{item.label}</span>
                    </div>
                    <span className="font-bold text-sky-950 font-mono shrink-0">
                      {item.displayVal}
                    </span>
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
