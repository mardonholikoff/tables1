import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
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
    <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm font-mono text-sky-950">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Activity className="w-4 h-4 text-sky-700" />
              <span>Yozuvlar Ketma-ketligi va Dinamika Tahlili</span>
            </h4>
            {deltaPercent !== null && (
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-sky-100 text-sky-900 border border-sky-300"
              >
                {isPositiveDelta ? (
                  <TrendingUp className="w-3 h-3 text-emerald-700" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                {isPositiveDelta ? '+' : ''}
                {deltaPercent}% umumiy dinamika
              </span>
            )}
          </div>
          <p className="text-[11px] text-sky-900 font-mono font-medium">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" opacity={0.8} />
              <XAxis
                dataKey="name"
                stroke="#0369a1"
                fontSize={10}
                tickLine={false}
              />
              <YAxis stroke="#0369a1" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#bae6fd',
                  borderRadius: '0.75rem',
                  color: '#082f49',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#082f49' }} />
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
        <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-sky-50 rounded-xl border border-sky-200">
          <Activity className="w-6 h-6 text-sky-600 mb-2" />
          <p className="text-xs text-sky-950 font-mono font-medium">
            Dinamika chizig'ini qurish uchun jadvalda kamida bitta raqamli ustun (masalan, Narx, Miqdor, Ball) bo'lishi lozim.
          </p>
        </div>
      )}
    </div>
  );
};
