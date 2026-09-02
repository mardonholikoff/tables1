import React from 'react';
import { Calculator, Sigma, TrendingUp, BarChart, Percent, Hash } from 'lucide-react';
import { TableAnalyticsSummary, ColumnMetric } from '../utils/analytics';

interface MathStatisticsViewProps {
  analytics: TableAnalyticsSummary;
}

export const MathStatisticsView: React.FC<MathStatisticsViewProps> = ({ analytics }) => {
  const { numericColumns } = analytics;

  if (numericColumns.length === 0) {
    return (
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg text-center">
        <Calculator className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
        <h4 className="text-xs font-bold text-slate-300 mb-1">
          Raqamli ustunlar hisob-kitobi uchun ma'lumot kutilmoqda
        </h4>
        <p className="text-[11px] text-slate-500">
          Jadvalingizda raqamli qiymatlar mavjud bo'lganda bu yerda avtomatik matematik formulalar chiqariladi.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Matematik va Statistik Hisob-kitoblar Formulalari</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Jami summa (∑), o'rtacha (μ), mediana (M), min/max va standart og'ish (σ) ko'rsatkichlari
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {numericColumns.map((col) => (
          <div
            key={col.key}
            className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-2xl space-y-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white truncate">{col.name}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {col.totalValues} ta qiymat
              </span>
            </div>

            {/* Core Calculations Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-900/90 rounded-xl">
                <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                  <Sigma className="w-3 h-3 text-emerald-400" />
                  Jami Summa (∑):
                </span>
                <span className="text-emerald-400 font-mono font-bold text-sm block truncate">
                  {col.sum?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-slate-900/90 rounded-xl">
                <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                  <Hash className="w-3 h-3 text-blue-400" />
                  O'rtacha Qiymat (μ):
                </span>
                <span className="text-blue-400 font-mono font-bold text-sm block truncate">
                  {col.avg?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-slate-900/90 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Mediana (M):</span>
                <span className="text-indigo-300 font-mono font-bold text-sm block truncate">
                  {col.median?.toLocaleString() || col.avg?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-slate-900/90 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Standart Og'ish (σ):</span>
                <span className="text-purple-300 font-mono font-bold text-sm block truncate">
                  {col.stdDev?.toLocaleString() || '0'}
                </span>
              </div>

              <div className="p-2 bg-slate-900/90 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Eng Kichik (Min):</span>
                <span className="text-slate-300 font-mono font-semibold block truncate">
                  {col.min?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-slate-900/90 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Eng Katta (Max):</span>
                <span className="text-amber-300 font-mono font-semibold block truncate">
                  {col.max?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
