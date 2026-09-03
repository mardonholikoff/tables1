import React, { useState } from 'react';
import { ScatterChart as ScatterIcon } from 'lucide-react';
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
      <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center font-mono text-sky-950">
        <ScatterIcon className="w-8 h-8 text-sky-600 mb-2 opacity-60" />
        <h4 className="text-xs font-bold text-sky-950 mb-1">
          Korrelyatsiya uchun kamida 2 ta raqamli ustun kerak
        </h4>
        <p className="text-[11px] text-sky-900 max-w-xs font-medium">
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
    <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm space-y-4 font-mono text-sky-950">
      {/* Header & Axis controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <ScatterIcon className="w-4 h-4 text-sky-700" />
            <span>Bog'liqlik va Korrelyatsiya (Scatter Plot)</span>
          </h4>
          <p className="text-[11px] text-sky-900 font-mono font-medium">
            Ikki xil ustun ko'rsatkichlarining o'zaro bog'liqlik nuqtalari
          </p>
        </div>

        {/* X and Y column pickers */}
        <div className="flex items-center gap-2 text-xs flex-wrap font-mono">
          <div className="flex items-center gap-1 bg-sky-50 px-2.5 py-1.5 rounded-xl border border-sky-200">
            <span className="text-sky-900 font-bold">X-o'qi:</span>
            <select
              value={colX.key}
              onChange={(e) => setColXKey(e.target.value)}
              className="bg-transparent text-sky-950 font-bold focus:outline-none cursor-pointer"
            >
              {numericColumns.map((c) => (
                <option key={c.key} value={c.key} className="bg-white text-sky-950">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-sky-50 px-2.5 py-1.5 rounded-xl border border-sky-200">
            <span className="text-sky-900 font-bold">Y-o'qi:</span>
            <select
              value={colY.key}
              onChange={(e) => setColYKey(e.target.value)}
              className="bg-transparent text-sky-950 font-bold focus:outline-none cursor-pointer"
            >
              {numericColumns.map((c) => (
                <option key={c.key} value={c.key} className="bg-white text-sky-950">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, bottom: 20, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" opacity={0.8} />
            <XAxis
              type="number"
              dataKey="x"
              name={colX.name}
              stroke="#0369a1"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={colY.name}
              stroke="#0369a1"
              fontSize={10}
              tickLine={false}
            />
            <ZAxis type="number" dataKey="z" range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#bae6fd',
                borderRadius: '0.75rem',
                color: '#082f49',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.1)',
              }}
            />
            <Scatter name="Yozuvlar" data={scatterData} fill="#0284c7" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
