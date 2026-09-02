import React, { useState } from 'react';
import { ScatterChart as ScatterIcon, Layers } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { UserTable } from '../types';

interface CorrelationScatterChartProps {
  table: UserTable;
  onInspectCell?: (columnKey: string, columnName: string, val: string) => void;
}

export const CorrelationScatterChart: React.FC<CorrelationScatterChartProps> = ({
  table,
  onInspectCell,
}) => {
  const numericColumns = table.columns.filter((col) => {
    const valid = table.rows
      .map((r) => Number((r.values[col.key] || '').replace(/[\$,\s]/g, '')))
      .filter((n) => !isNaN(n));
    return valid.length > 0 && valid.length >= table.rows.length * 0.4;
  });

  const [colXKey, setColXKey] = useState<string>(numericColumns[0]?.key || '');
  const [colYKey, setColYKey] = useState<string>(
    numericColumns[1]?.key || numericColumns[0]?.key || ''
  );

  if (numericColumns.length < 2 || table.rows.length === 0) {
    return (
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
        <ScatterIcon className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
        <h4 className="text-xs font-bold text-slate-300 mb-1">
          Korrelyatsiya uchun kamida 2 ta raqamli ustun kerak
        </h4>
        <p className="text-[11px] text-slate-500 max-w-xs">
          X va Y o'qlari bo'yicha nuqtaviy bog'liqlikni tahlil qilish uchun jadvalda 2 ta sonli ustun bo'lishi lozim.
        </p>
      </div>
    );
  }

  const colX = numericColumns.find((c) => c.key === colXKey) || numericColumns[0];
  const colY =
    numericColumns.find((c) => c.key === colYKey) || numericColumns[1] || numericColumns[0];

  const scatterData = table.rows.map((row, idx) => {
    const nameCol = table.columns[0]?.key;
    const name = row.values[nameCol] || `#${idx + 1}`;
    const xVal = Number((row.values[colX.key] || '0').replace(/[\$,\s]/g, ''));
    const yVal = Number((row.values[colY.key] || '0').replace(/[\$,\s]/g, ''));

    return {
      name,
      x: isNaN(xVal) ? 0 : xVal,
      y: isNaN(yVal) ? 0 : yVal,
      z: 1,
      rowId: row.id,
    };
  });

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
      {/* Header & Axis controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <ScatterIcon className="w-4 h-4 text-violet-400" />
            <span>Bog'liqlik va Korrelyatsiya (Scatter Plot)</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Ikki xil ustun ko'rsatkichlarining o'zaro bog'liqlik nuqtalari
          </p>
        </div>

        {/* X and Y column pickers */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold">X-o'qi:</span>
            <select
              value={colX.key}
              onChange={(e) => setColXKey(e.target.value)}
              className="bg-transparent text-violet-300 font-medium focus:outline-none cursor-pointer"
            >
              {numericColumns.map((c) => (
                <option key={c.key} value={c.key} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold">Y-o'qi:</span>
            <select
              value={colY.key}
              onChange={(e) => setColYKey(e.target.value)}
              className="bg-transparent text-emerald-300 font-medium focus:outline-none cursor-pointer"
            >
              {numericColumns.map((c) => (
                <option key={c.key} value={c.key} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              type="number"
              dataKey="x"
              name={colX.name}
              stroke="#94a3b8"
              fontSize={10}
              label={{ value: colX.name, position: 'insideBottom', offset: -10, fill: '#818cf8', fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={colY.name}
              stroke="#94a3b8"
              fontSize={10}
              label={{ value: colY.name, angle: -90, position: 'insideLeft', fill: '#34d399', fontSize: 10 }}
            />
            <ZAxis type="number" dataKey="z" range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(val: any, name: any) => [val, name]}
            />
            <Scatter name="Yozuvlar" data={scatterData} fill="#8b5cf6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
