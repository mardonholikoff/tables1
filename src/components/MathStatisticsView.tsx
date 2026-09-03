import React from 'react';
import { Calculator, Sigma, Hash } from 'lucide-react';
import { TableAnalyticsSummary } from '../utils/analytics';

interface MathStatisticsViewProps {
  analytics: TableAnalyticsSummary;
}

export const MathStatisticsView: React.FC<MathStatisticsViewProps> = ({ analytics }) => {
  const { numericColumns } = analytics;

  if (numericColumns.length === 0) {
    return (
      <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm text-center font-mono text-sky-950">
        <Calculator className="w-8 h-8 text-sky-600 mx-auto mb-2 opacity-60" />
        <h4 className="text-xs font-bold text-sky-950 mb-1">
          Raqamli ustunlar hisob-kitobi uchun ma'lumot kutilmoqda
        </h4>
        <p className="text-[11px] text-sky-900 font-medium">
          Jadvalingizda raqamli qiymatlar mavjud bo'lganda bu yerda avtomatik matematik formulalar chiqariladi.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm space-y-4 font-mono text-sky-950">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Calculator className="w-4 h-4 text-sky-700" />
            <span>Matematik va Statistik Hisob-kitoblar Formulalari</span>
          </h4>
          <p className="text-[11px] text-sky-900 font-mono font-medium">
            Jami summa (∑), o'rtacha (μ), mediana (M), min/max va standart og'ish (σ) ko'rsatkichlari
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {numericColumns.map((col) => (
          <div
            key={col.key}
            className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3 font-mono"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-sky-200">
              <span className="text-xs font-bold text-sky-950 truncate">{col.name}</span>
              <span className="text-[10px] font-mono text-sky-950 bg-white px-2 py-0.5 rounded-md border border-sky-300 font-bold">
                {col.totalValues} ta qiymat
              </span>
            </div>

            {/* Core Calculations Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xl border border-sky-200">
                <span className="text-[10px] text-sky-900 font-bold flex items-center gap-1">
                  <Sigma className="w-3 h-3 text-sky-700" />
                  Jami Summa (∑):
                </span>
                <span className="text-sky-950 font-mono font-bold text-sm block truncate">
                  {col.sum?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-sky-200">
                <span className="text-[10px] text-sky-900 font-bold flex items-center gap-1">
                  <Hash className="w-3 h-3 text-sky-700" />
                  O'rtacha Qiymat (μ):
                </span>
                <span className="text-sky-950 font-mono font-bold text-sm block truncate">
                  {col.avg?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-sky-200">
                <span className="text-[10px] text-sky-900 font-bold block">Mediana (M):</span>
                <span className="text-sky-950 font-mono font-bold text-sm block truncate">
                  {col.median?.toLocaleString() || col.avg?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-sky-200">
                <span className="text-[10px] text-sky-900 font-bold block">Standart Og'ish (σ):</span>
                <span className="text-sky-950 font-mono font-bold text-sm block truncate">
                  {col.stdDev?.toLocaleString() || '0'}
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-sky-200">
                <span className="text-[10px] text-sky-900 font-bold block">Eng Kichik (Min):</span>
                <span className="text-sky-950 font-mono font-bold block truncate">
                  {col.min?.toLocaleString()}
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-sky-200">
                <span className="text-[10px] text-sky-900 font-bold block">Eng Katta (Max):</span>
                <span className="text-sky-950 font-mono font-bold block truncate">
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
