import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { UserTable } from '../types';
import { CHART_COLORS } from '../utils/analytics';

interface DynamicsTrendChartProps {
  table: UserTable;
  filteredRowsCount: number;
}

export const DynamicsTrendChart: React.FC<DynamicsTrendChartProps> = ({
  table,
  filteredRowsCount,
}) => {
  // Find all numeric columns
  const numericColumns = table.columns.filter((col) => {
    const validNumbers = table.rows
      .map((r) => Number((r.values[col.key] || '').replace(/[\$,\s]/g, '')))
      .filter((n) => !isNaN(n));
    return validNumbers.length > 0 && validNumbers.length >= table.rows.length * 0.5;
  });

  // Prepare chronological or sequential data
  const trendData = table.rows.map((row, idx) => {
    const nameCol = table.columns[0]?.key;
    const rowName = row.values[nameCol] || `#${idx + 1}`;

    const dataPoint: Record<string, any> = {
      index: idx + 1,
      name: rowName.length > 15 ? rowName.slice(0, 12) + '...' : rowName,
    };

    numericColumns.forEach((col) => {
      const val = Number((row.values[col.key] || '0').replace(/[\$,\s]/g, ''));
      dataPoint[col.name] = isNaN(val) ? 0 : val;
    });

    return dataPoint;
  });

  // Calculate quick velocity / delta for first numeric column
  const firstNumeric = numericColumns[0];
  let deltaPercent: string | null = null;
  let isPositiveDelta = true;

  if (firstNumeric && trendData.length >= 2) {
    const firstVal = Number(trendData[0][firstNumeric.name] || 0);
    const lastVal = Number(trendData[trendData.length - 1][firstNumeric.name] || 0);

    if (firstVal !== 0) {
      const delta = ((lastVal - firstVal) / Math.abs(firstVal)) * 100;
      deltaPercent = delta.toFixed(1);
      isPositiveDelta = delta >= 0;
    }
  }

  if (trendData.length === 0) return null;

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Yozuvlar Ketma-ketligi va Dinamika Tahlili</span>
            </h4>
            {deltaPercent !== null && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isPositiveDelta
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {isPositiveDelta ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositiveDelta ? '+' : ''}
                {deltaPercent}% umumiy dinamika
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Kiritilgan {trendData.length} ta yozuvning vaqt/tartib bo'yicha rivojlanish traektoriyasi
          </p>
        </div>
      </div>

      {numericColumns.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
              />
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
              {numericColumns.map((col, idx) => (
                <Line
                  key={col.key}
                  type="monotone"
                  dataKey={col.name}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-slate-950/40 rounded-xl border border-slate-800">
          <Activity className="w-6 h-6 text-slate-500 mb-2" />
          <p className="text-xs text-slate-400">
            Dinamika chizig'ini qurish uchun jadvalda kamida bitta raqamli ustun (masalan, Narx, Miqdor, Ball) bo'lishi lozim.
          </p>
        </div>
      )}
    </div>
  );
};
