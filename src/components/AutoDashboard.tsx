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
  Activity,
  Filter,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import { UserTable, ColumnFilter } from '../types';
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
import { FilterBar } from './FilterBar';
import { hasActiveFilter } from '../utils/filterUtils';

interface AutoDashboardProps {
  table: UserTable;
  originalTable: UserTable;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  onSelectCellInspector?: (columnKey: string, columnName: string, val: string) => void;
  filters?: ColumnFilter[];
  onFiltersChange?: (filters: ColumnFilter[]) => void;
}

export const AutoDashboard: React.FC<AutoDashboardProps> = ({
  table,
  originalTable,
  isFiltered = false,
  onClearFilters,
  onSelectCellInspector,
  filters = [],
  onFiltersChange,
}) => {
  // Always show data filter bar by default so users can filter table data immediately
  const [showDashboardFilterBar, setShowDashboardFilterBar] = useState<boolean>(true);

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
    <div className="space-y-5 font-mono text-sky-950">
      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-sky-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm border border-sky-500">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-sky-950 tracking-tight font-mono">
                Avtomatik Analitik Dashboard
              </h3>
              {isFiltered ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1 font-mono">
                  <Filter className="w-3 h-3 text-sky-700" />
                  Filtrlangan ({table.rows.length} / {originalTable.rows.length})
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                  Jonli Tahlil
                </span>
              )}
            </div>
            <p className="text-xs text-sky-900 font-medium">
              "{table.name}" jadvali ma'lumotlari asosida real-vaqt statistikasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onFiltersChange && (
            <button
              onClick={() => setShowDashboardFilterBar(!showDashboardFilterBar)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer shadow-xs ${
                filters.some(hasActiveFilter)
                  ? 'bg-sky-600 text-white border-sky-700'
                  : showDashboardFilterBar
                  ? 'bg-sky-100 text-sky-950 border-sky-300 hover:bg-sky-200'
                  : 'bg-white hover:bg-sky-50 text-sky-900 border-sky-300'
              }`}
              title="Jadval ma'lumotlari (nomlar, sana, narxlar) bo'yicha filtr paneli"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showDashboardFilterBar ? "Ma'lumotlar filtrini yopish" : "Ma'lumotlar bo'yicha filtr"}</span>
              {filters.filter(hasActiveFilter).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-sky-800 text-[10px] font-black flex items-center justify-center">
                  {filters.filter(hasActiveFilter).length}
                </span>
              )}
            </button>
          )}

          {isFiltered && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-900 text-xs font-bold rounded-xl border border-sky-300 transition cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-700" />
              <span>Filtrni bekor qilish</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Smart Filter Bar in Dashboard */}
      {showDashboardFilterBar && onFiltersChange && (
        <FilterBar
          table={table}
          originalTable={originalTable}
          filters={filters}
          onFilterChange={onFiltersChange}
          onResetFilters={onClearFilters || (() => {})}
          filteredCount={table.rows.length}
          totalCount={originalTable.rows.length}
          title="Dashboard Ma'lumotlari Bo'yicha Filtr"
          subtitle="Ustun nomiga bosib, undagi ma'lumotlar (a, b...) bo'yicha saralang — dashboarddagi barcha grafik va hisob-kitoblar faqat ushbu tanlangan ma'lumotlar asosida hisoblanadi"
          isDashboardMode={true}
        />
      )}

      {/* Analytical Instruments Selector Bar */}
      <InstrumentsSelectorBar
        selectedInstruments={selectedInstruments}
        onChange={setSelectedInstruments}
      />

      {/* Column Scope Selector */}
      <div className="p-3.5 bg-white border border-sky-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-sky-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950 font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-700" />
            <span>Grafiklarda Ko'rsatiladigan Ustunlar ({activeColumns.length}/{table.columns.length}):</span>
          </div>
          {activeColumns.length < table.columns.length && (
            <button
              onClick={selectAllColumns}
              className="text-[11px] text-sky-700 hover:text-sky-950 hover:underline cursor-pointer font-mono font-bold"
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer border font-mono font-bold ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                    : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100 line-through opacity-70'
                }`}
                title={isSelected ? "O'chirish uchun bosing" : "Qo'shish uchun bosing"}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
                <span>{col.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty rows prompt if no rows exist */}
      {totalRows === 0 ? (
        <div className="p-8 bg-white border border-dashed border-sky-300 rounded-2xl text-center">
          <Activity className="w-8 h-8 text-sky-600 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-sky-950 mb-1 font-mono">
            {isFiltered ? "Filtrga mos keluvchi ma'lumot topilmadi" : "Analitika ma'lumot kutilmoqda"}
          </h4>
          <p className="text-xs text-sky-900 max-w-md mx-auto font-medium">
            {isFiltered
              ? "Filtr parametrlarini o'zgartiring yoki filtrlarni tozalang."
              : "Jadvalga yangi yozuvlar kiritganingiz sari diagrammalar, dinamika va taqsimot grafiklari avtomatik shakllanadi."}
          </p>
        </div>
      ) : selectedInstruments.length === 0 ? (
        <div className="p-8 bg-white border border-sky-200 rounded-2xl text-center shadow-sm">
          <Wand2 className="w-8 h-8 text-sky-600 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-sky-950 mb-1 font-mono">
            Hech qanday analitik instrument tanlanmagan
          </h4>
          <p className="text-xs text-sky-900 max-w-md mx-auto mb-4 font-medium">
            Yuqoridagi paneldan bir yoki bir nechta analitik vositalarni (KPI, Trend, Radar, Taqqoslash, Formula va h.k.) yoqing.
          </p>
          <button
            onClick={() => setSelectedInstruments(DEFAULT_SELECTED_INSTRUMENTS)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Standart to'plamni yoqish
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. INSTRUMENT: KPI Metrikalar Kartochkalari */}
          {isInstrumentActive('kpi_cards') && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider font-mono">
                    {isFiltered ? 'Filtrlangan Qatorlar' : 'Jami Yozuvlar'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-950 font-mono">{totalRows}</div>
                <div className="text-[11px] text-sky-800 mt-1 font-mono font-medium">
                  {isFiltered ? `Umumiy ${originalTable.rows.length} tadan` : "Barcha qatorlar"}
                </div>
              </div>

              <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider font-mono">
                    Ustunlar Soni
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center">
                    <Hash className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-950 font-mono">{totalColumns}</div>
                <div className="text-[11px] text-sky-800 mt-1 font-mono font-medium">
                  {numericColumns.length} raqamli, {categoricalColumns.length} matnli
                </div>
              </div>

              <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider font-mono">
                    To'ldirilganlik
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-950 font-mono">{completionRate}%</div>
                <div className="text-[11px] text-sky-800 mt-1 font-mono font-medium">{filledCellsCount} to'liq kataklar</div>
              </div>

              <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider font-mono">
                    "Nomsiz" Kataklar
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-950 font-mono">{nomsizCellsCount}</div>
                <div className="text-[11px] text-sky-800 mt-1 font-mono font-medium">Bo'sh qoldirilgan qiymatlar</div>
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
                <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <TrendingUp className="w-4 h-4 text-sky-700" />
                        <span>Ustunlar Bo'yicha Taqqoslash (Bar Chart)</span>
                      </h4>
                      <p className="text-[11px] text-sky-800 font-mono font-medium">
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
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" opacity={0.8} />
                          <XAxis dataKey="name" stroke="#0369a1" fontSize={10} tickLine={false} />
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
                    <div className="h-64 flex items-center justify-center text-xs text-sky-900 font-mono">
                      Raqamli ustunlar mavjud emas
                    </div>
                  )}
                </div>
              )}

              {/* 4. INSTRUMENT: Kategoriyalar Taqsimoti (Pie/Donut Chart) */}
              {isInstrumentActive('pie_distribution') && (
                <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <PieChartIcon className="w-4 h-4 text-sky-700" />
                        <span>
                          {primaryCategory ? `"${primaryCategory.name}" Taqsimoti` : "Kategoriyalar Taqsimoti"}
                        </span>
                      </h4>
                      <p className="text-[11px] text-sky-800 font-mono font-medium">
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
                                backgroundColor: '#ffffff',
                                borderColor: '#bae6fd',
                                borderRadius: '0.75rem',
                                color: '#082f49',
                                fontSize: '12px',
                                boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.1)',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="w-full sm:w-1/2 space-y-1.5 pl-2 max-h-56 overflow-y-auto custom-scrollbar">
                        {primaryCategory.distribution.map((item, idx) => (
                          <div
                            key={item.name}
                            onClick={() =>
                              onSelectCellInspector &&
                              onSelectCellInspector(primaryCategory.key, primaryCategory.name, item.name)
                            }
                            className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 cursor-pointer transition"
                            title="Tahlil qilish uchun bosing"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                              />
                              <span className="text-sky-950 font-semibold truncate">{item.name}</span>
                            </div>
                            <span className="font-mono text-sky-950 font-bold text-[11px] shrink-0">
                              {item.value} ({item.percent}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-sky-900 font-mono">
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
