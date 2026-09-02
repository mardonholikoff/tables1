import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Layers,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Activity,
  Calculator,
  Filter,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import { UserTable } from '../types';
import {
  computeTableAnalytics,
  CHART_COLORS,
  DEFAULT_SELECTED_INSTRUMENTS,
} from '../utils/analytics';
import { getSavedInstruments, saveSavedInstruments } from '../utils/storage';
import { DynamicsTrendChart } from './DynamicsTrendChart';
import { InstrumentsSelectorBar } from './InstrumentsSelectorBar';
import { CumulativeAreaChart } from './CumulativeAreaChart';
import { RadarProfileChart } from './RadarProfileChart';
import { MathStatisticsView } from './MathStatisticsView';
import { TopBottomRankingView } from './TopBottomRankingView';
import { CorrelationScatterChart } from './CorrelationScatterChart';

interface AutoDashboardProps {
  table: UserTable;
  originalTable: UserTable; // unfiltered table reference for context
  isFiltered?: boolean;
  onClearFilters?: () => void;
  onSelectCellInspector?: (columnKey: string, columnName: string, val: string) => void;
}

export const AutoDashboard: React.FC<AutoDashboardProps> = ({
  table,
  originalTable,
  isFiltered = false,
  onClearFilters,
  onSelectCellInspector,
}) => {
  // Selected columns for dashboard calculation/focus
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() =>
    table.columns.map((c) => c.key)
  );

  // Selected analytical instruments (multi-selection)
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(() => {
    const saved = getSavedInstruments();
    return saved.length > 0 ? saved : DEFAULT_SELECTED_INSTRUMENTS;
  });

  // Save selected instruments when changed
  useEffect(() => {
    saveSavedInstruments(selectedInstruments);
  }, [selectedInstruments]);

  // Synchronize active columns
  const activeColumns = useMemo(() => {
    return table.columns.filter((c) => selectedColumnKeys.includes(c.key));
  }, [table.columns, selectedColumnKeys]);

  // Sub-table based on active selected columns
  const scopedTable = useMemo<UserTable>(() => {
    return {
      ...table,
      columns: activeColumns.length > 0 ? activeColumns : table.columns,
    };
  }, [table, activeColumns]);

  const analytics = useMemo(() => computeTableAnalytics(scopedTable), [scopedTable]);

  const {
    totalRows,
    totalColumns,
    nomsizCellsCount,
    filledCellsCount,
    completionRate,
    numericColumns,
    categoricalColumns,
    recentActivity,
  } = analytics;

  // Numerical columns chart data (rows vs numeric values)
  const numericRowData = useMemo(() => {
    if (numericColumns.length === 0 || totalRows === 0) return [];
    return table.rows.slice(-15).map((row, idx) => {
      const entry: Record<string, any> = {
        name: row.values[table.columns[0]?.key] || `#${idx + 1}`,
      };
      numericColumns.forEach((col) => {
        const val = Number((row.values[col.key] || '0').replace(/[\$,\s]/g, ''));
        entry[col.name] = isNaN(val) ? 0 : val;
      });
      return entry;
    });
  }, [table, numericColumns, totalRows]);

  // Primary categorical column distribution for Pie Chart
  const primaryCategory =
    categoricalColumns.find((c) => c.distribution && c.distribution.length > 0) || null;

  const toggleColumnSelection = (key: string) => {
    if (selectedColumnKeys.includes(key)) {
      if (selectedColumnKeys.length > 1) {
        setSelectedColumnKeys(selectedColumnKeys.filter((k) => k !== key));
      }
    } else {
      setSelectedColumnKeys([...selectedColumnKeys, key]);
    }
  };

  const selectAllColumns = () => {
    setSelectedColumnKeys(table.columns.map((c) => c.key));
  };

  const isInstrumentActive = (id: string) => selectedInstruments.includes(id);

  return (
    <div className="space-y-5">
      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Avtomatik Analitik Dashboard
              </h3>
              {isFiltered ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filtrlangan ({table.rows.length} / {originalTable.rows.length})
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Jonli Tahlil
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              "{table.name}" jadvali tuzilishi va qiymatlari asosida dinamik tahlillar
            </p>
          </div>
        </div>

        {isFiltered && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Filtrni bekor qilish</span>
          </button>
        )}
      </div>

      {/* Analytical Instruments Selector Bar (Bir nechta analitik vositalarni tanlash) */}
      <InstrumentsSelectorBar
        selectedInstruments={selectedInstruments}
        onChange={setSelectedInstruments}
      />

      {/* Column Scope Selector (Jadval qismlarini / ustunlarini tanlab tahlil qilish) */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Tahlil Qilinadigan Ustunlar ({activeColumns.length}/{table.columns.length}):</span>
          </div>
          {activeColumns.length < table.columns.length && (
            <button
              onClick={selectAllColumns}
              className="text-[11px] text-blue-400 hover:underline cursor-pointer"
            >
              Barchasini tanlash
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {table.columns.map((col) => {
            const isSelected = selectedColumnKeys.includes(col.key);
            return (
              <button
                key={col.id}
                onClick={() => toggleColumnSelection(col.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-medium'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-400 line-through'
                }`}
                title={isSelected ? "O'chirish uchun bosing" : "Qo'shish uchun bosing"}
              >
                {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                <span>{col.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty rows prompt if no rows exist */}
      {totalRows === 0 ? (
        <div className="p-8 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-center">
          <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-white mb-1">
            {isFiltered ? "Filtrga mos keluvchi ma'lumot topilmadi" : "Analitika ma'lumot kutilmoqda"}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isFiltered
              ? "Filtr parametrlarini o'zgartiring yoki filtrlarni tozalang."
              : "Jadvalga yangi yozuvlar kiritganingiz sari diagrammalar, dinamika va taqsimot grafiklari avtomatik shakllanadi."}
          </p>
        </div>
      ) : selectedInstruments.length === 0 ? (
        <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
          <Wand2 className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-white mb-1">
            Hech qanday analitik instrument tanlanmagan
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Yuqoridagi paneldan bir yoki bir nechta analitik vositalarni (KPI, Trend, Radar, Taqqoslash, Formula va h.k.) yoqing.
          </p>
          <button
            onClick={() => setSelectedInstruments(DEFAULT_SELECTED_INSTRUMENTS)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
          >
            Standart to'plamni yoqish
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. INSTRUMENT: KPI Metrikalar Kartochkalari */}
          {isInstrumentActive('kpi_cards') && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {isFiltered ? 'Filtrlangan Qatorlar' : 'Jami Yozuvlar'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">{totalRows}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {isFiltered ? `Umumiy ${originalTable.rows.length} tadan` : "Barcha qatorlar"}
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Ustunlar Soni
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Hash className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">{totalColumns}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {numericColumns.length} raqamli, {categoricalColumns.length} matnli
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    To'ldirilganlik
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">{completionRate}%</div>
                <div className="text-[11px] text-slate-400 mt-1">{filledCellsCount} to'liq kataklar</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    "Nomsiz" Kataklar
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400 font-mono">{nomsizCellsCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Bo'sh qoldirilgan qiymatlar</div>
              </div>
            </div>
          )}

          {/* 2. INSTRUMENT: Ketma-ketlik va Trend Dinamikasi (Line Chart) */}
          {isInstrumentActive('dynamics_trend') && (
            <DynamicsTrendChart table={scopedTable} filteredRowsCount={totalRows} />
          )}

          {/* Charts Grid (Bar & Pie) */}
          {(isInstrumentActive('bar_comparison') || isInstrumentActive('pie_distribution')) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 3. INSTRUMENT: Ustunlar Bo'yicha Taqqoslash (Bar Chart) */}
              {isInstrumentActive('bar_comparison') && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span>Ustunlar Bo'yicha Taqqoslash (Bar Chart)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {numericColumns.length > 0
                          ? `Ustunlar: ${numericColumns.map((c) => c.name).join(', ')}`
                          : 'Raqamli ustunlar kutilmoqda'}
                      </p>
                    </div>
                  </div>

                  {numericColumns.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={numericRowData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
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
                          {numericColumns.map((col, idx) => (
                            <Bar
                              key={col.key}
                              dataKey={col.name}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                              radius={[4, 4, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                      Raqamli ustunlar mavjud emas
                    </div>
                  )}
                </div>
              )}

              {/* 4. INSTRUMENT: Kategoriyalar Taqsimoti (Pie/Donut Chart) */}
              {isInstrumentActive('pie_distribution') && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <PieChartIcon className="w-4 h-4 text-emerald-400" />
                        <span>
                          {primaryCategory ? `"${primaryCategory.name}" Taqsimoti` : "Kategoriyalar Taqsimoti"}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {primaryCategory ? `${primaryCategory.uniqueCount} ta takrorlanmas qiymat` : "Avtomatik tahlil"}
                      </p>
                    </div>
                  </div>

                  {primaryCategory && primaryCategory.distribution && primaryCategory.distribution.length > 0 ? (
                    <div className="h-64 w-full flex flex-col sm:flex-row items-center">
                      <div className="w-full sm:w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={primaryCategory.distribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {primaryCategory.distribution.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '0.75rem',
                                color: '#fff',
                                fontSize: '12px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="w-full sm:w-1/2 space-y-1.5 pl-2 max-h-56 overflow-y-auto">
                        {primaryCategory.distribution.map((item, idx) => (
                          <div
                            key={item.name}
                            onClick={() =>
                              onSelectCellInspector &&
                              onSelectCellInspector(primaryCategory.key, primaryCategory.name, item.name)
                            }
                            className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition"
                            title="Tahlil qilish uchun bosing"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                              />
                              <span className="text-slate-300 truncate">{item.name}</span>
                            </div>
                            <span className="font-mono text-slate-400 text-[11px] shrink-0">
                              {item.value} ({item.percent}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                      Taqsimot yaratish uchun matnli ustunlar yetarli emas
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. INSTRUMENT: Kümülyativ O'sish Maydoni (Cumulative Area Chart) */}
          {isInstrumentActive('cumulative_area') && (
            <CumulativeAreaChart table={scopedTable} />
          )}

          {/* 6. INSTRUMENT: Ko'p O'lchovli Profil (Radar / Spider Chart) */}
          {isInstrumentActive('radar_profile') && (
            <RadarProfileChart table={scopedTable} />
          )}

          {/* 7. INSTRUMENT: Matematik & Statistik Formulalar */}
          {isInstrumentActive('math_statistics') && (
            <MathStatisticsView analytics={analytics} />
          )}

          {/* 8. INSTRUMENT: Ekstremumlar va Reyting (Top & Bottom 5) */}
          {isInstrumentActive('top_bottom_ranking') && (
            <TopBottomRankingView
              table={scopedTable}
              onInspectCell={onSelectCellInspector}
            />
          )}

          {/* 9. INSTRUMENT: Bog'liqlik va Korrelyatsiya (Scatter Plot) */}
          {isInstrumentActive('correlation_scatter') && (
            <CorrelationScatterChart
              table={scopedTable}
              onInspectCell={onSelectCellInspector}
            />
          )}
        </div>
      )}
    </div>
  );
};
