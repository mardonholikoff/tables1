import React from 'react';
import { Compass } from 'lucide-react';
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
      <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center font-mono text-sky-950">
        <Compass className="w-8 h-8 text-sky-600 mb-2 opacity-60" />
        <h4 className="text-xs font-bold text-sky-950 mb-1">
          Ko'p O'lchovli Profil (Radar) uchun kamida 2 ta raqamli ustun kerak
        </h4>
        <p className="text-[11px] text-sky-900 max-w-xs font-medium">
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

    return {
      metric: col.name.length > 12 ? col.name.slice(0, 10) + '..' : col.name,
      "O'rtacha": Math.round(avg),
      Maksimal: Math.round(maxVal),
      Minimal: Math.round(minVal),
    };
  });

  return (
    <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm font-mono text-sky-950">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Compass className="w-4 h-4 text-sky-700" />
            <span>Ko'p O'lchovli Profil (Radar / Spider Chart)</span>
          </h4>
          <p className="text-[11px] text-sky-900 font-mono font-medium">
            Barcha raqamli ko'rsatkichlarning o'zaro balansi va o'lchov profili
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#bae6fd" />
            <PolarAngleAxis dataKey="metric" stroke="#0369a1" fontSize={10} />
            <PolarRadiusAxis stroke="#0284c7" fontSize={9} />
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
            <Legend wrapperStyle={{ fontSize: '11px', color: '#082f49' }} />
            <Radar
              name="Maksimal"
              dataKey="Maksimal"
              stroke="#0284c7"
              fill="#0284c7"
              fillOpacity={0.3}
            />
            <Radar
              name="O'rtacha"
              dataKey="O'rtacha"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
