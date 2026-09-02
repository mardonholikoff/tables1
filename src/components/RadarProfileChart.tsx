import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { UserTable } from '../types';
import { CHART_COLORS } from '../utils/analytics';

interface RadarProfileChartProps {
  table: UserTable;
}

export const RadarProfileChart: React.FC<RadarProfileChartProps> = ({ table }) => {
  // Find numeric columns
  const numericColumns = table.columns.filter((col) => {
    const valid = table.rows
      .map((r) => Number((r.values[col.key] || '').replace(/[\$,\s]/g, '')))
      .filter((n) => !isNaN(n));
    return valid.length > 0 && valid.length >= table.rows.length * 0.4;
  });

  if (numericColumns.length < 2 || table.rows.length === 0) {
    return (
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
        <Compass className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
        <h4 className="text-xs font-bold text-slate-300 mb-1">
          Ko'p O'lchovli Profil (Radar) uchun kamida 2 ta raqamli ustun kerak
        </h4>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Jadvalingizda bir nechta raqamli ustunlar mavjud bo'lganda, ularning o'zaro nisbati radar ko'rinishida hosil bo'ladi.
        </p>
      </div>
    );
  }

  // Calculate radar data: for each numeric column, find max and normalize average, max, and min (scale 0-100)
  const radarData = numericColumns.map((col) => {
    const vals = table.rows
      .map((r) => Number((r.values[col.key] || '0').replace(/[\$,\s]/g, '')))
      .filter((n) => !isNaN(n));

    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = vals.length > 0 ? sum / vals.length : 0;
    const maxVal = vals.length > 0 ? Math.max(...vals) : 100;
    const minVal = vals.length > 0 ? Math.min(...vals) : 0;

    // We can show raw values or normalized values
    return {
      metric: col.name.length > 12 ? col.name.slice(0, 10) + '..' : col.name,
      "O'rtacha": Math.round(avg),
      Maksimal: Math.round(maxVal),
      Minimal: Math.round(minVal),
    };
  });

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Ko'p O'lchovli Profil (Radar / Spider Chart)</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Barcha raqamli ko'rsatkichlarning o'zaro balansi va o'lchov profili
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={10} />
            <PolarRadiusAxis stroke="#64748b" fontSize={9} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Radar
              name="Maksimal"
              dataKey="Maksimal"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.25}
            />
            <Radar
              name="O'rtacha"
              dataKey="O'rtacha"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.4}
            />
            <Radar
              name="Minimal"
              dataKey="Minimal"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
