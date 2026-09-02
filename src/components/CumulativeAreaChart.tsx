import React from 'react';
import { AreaChart as AreaIcon, TrendingUp, Layers } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { UserTable } from '../types';
import { CHART_COLORS } from '../utils/analytics';

interface CumulativeAreaChartProps {
  table: UserTable;
}

export const CumulativeAreaChart: React.FC<CumulativeAreaChartProps> = ({ table }) => {
  // Find numeric columns
  const numericColumns = table.columns.filter((col) => {
    const valid = table.rows
      .map((r) => Number((r.values[col.key] || '').replace(/[\$,\s]/g, '')))
      .filter((n) => !isNaN(n));
    return valid.length > 0 && valid.length >= table.rows.length * 0.5;
  });

  if (numericColumns.length === 0 || table.rows.length === 0) return null;

  // Compute cumulative values running totals
  const runningTotals: Record<string, number> = {};
  numericColumns.forEach((c) => (runningTotals[c.key] = 0));

  const cumulativeData = table.rows.map((row, idx) => {
    const nameCol = table.columns[0]?.key;
    const rowName = row.values[nameCol] || `#${idx + 1}`;

    const dataPoint: Record<string, any> = {
      index: idx + 1,
      name: rowName.length > 12 ? rowName.slice(0, 10) + '...' : rowName,
    };

    numericColumns.forEach((col) => {
      const val = Number((row.values[col.key] || '0').replace(/[\$,\s]/g, ''));
      const cleanVal = isNaN(val) ? 0 : val;
      runningTotals[col.key] += cleanVal;
      dataPoint[`${col.name} (Kümülyativ)`] = runningTotals[col.key];
    });

    return dataPoint;
  });

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <AreaIcon className="w-4 h-4 text-cyan-400" />
            <span>Kümülyativ O'sish Maydoni (Cumulative Growth Area)</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Yozuvlar davomida ko'rsatkichlarning jamlanib, yig'ilib borish hajmi
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={cumulativeData}
            margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
          >
            <defs>
              {numericColumns.map((col, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <linearGradient
                    key={col.key}
                    id={`grad-${col.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            {numericColumns.map((col, idx) => {
              const color = CHART_COLORS[idx % CHART_COLORS.length];
              return (
                <Area
                  key={col.key}
                  type="monotone"
                  dataKey={`${col.name} (Kümülyativ)`}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#grad-${col.key})`}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
