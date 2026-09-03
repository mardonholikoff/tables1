import { UserTable } from '../types';

export interface ColumnMetric {
  key: string;
  name: string;
  isNumeric: boolean;
  totalValues: number;
  nomsizCount: number;
  uniqueCount: number;
  // If numeric
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  median?: number;
  stdDev?: number;
  numericValues?: number[];
  // If categorical / text
  distribution?: { name: string; value: number; percent: number }[];
}

export interface TableAnalyticsSummary {
  totalRows: number;
  totalColumns: number;
  nomsizCellsCount: number;
  filledCellsCount: number;
  completionRate: number;
  columnMetrics: Record<string, ColumnMetric>;
  numericColumns: ColumnMetric[];
  categoricalColumns: ColumnMetric[];
  recentActivity: { index: number; name: string; date: string; rowData: Record<string, string> }[];
}

export function computeTableAnalytics(table: UserTable): TableAnalyticsSummary {
  const totalRows = table.rows.length;
  const totalColumns = table.columns.length;
  let nomsizCellsCount = 0;
  let filledCellsCount = 0;

  const columnMetrics: Record<string, ColumnMetric> = {};

  table.columns.forEach((col) => {
    const rawValues = table.rows.map((row) => (row.values[col.key] || '').trim());
    
    // Check if numeric (ignoring empty or 'nomsiz' as non-numeric unless all valid numbers)
    const validNumericValues: number[] = [];
    let nomsizCount = 0;
    const frequencyMap: Record<string, number> = {};

    rawValues.forEach((val) => {
      if (!val || val.toLowerCase() === 'nomsiz') {
        nomsizCount++;
      } else {
        filledCellsCount++;
        frequencyMap[val] = (frequencyMap[val] || 0) + 1;
        
        // Clean numeric format (remove $ or % or commas if simple)
        const cleaned = val.replace(/[\$,\s]/g, '');
        const num = Number(cleaned);
        if (!isNaN(num) && cleaned !== '') {
          validNumericValues.push(num);
        }
      }
    });

    const isNumeric =
      validNumericValues.length > 0 &&
      validNumericValues.length >= (rawValues.length - nomsizCount) * 0.7;

    const uniqueCount = Object.keys(frequencyMap).length;

    // Build distribution
    const distribution = Object.entries(frequencyMap)
      .map(([name, count]) => ({
        name,
        value: count,
        percent: totalRows > 0 ? Math.round((count / totalRows) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 items

    const metric: ColumnMetric = {
      key: col.key,
      name: col.name,
      isNumeric,
      totalValues: rawValues.length,
      nomsizCount,
      uniqueCount,
      distribution,
    };

    if (isNumeric && validNumericValues.length > 0) {
      const sum = validNumericValues.reduce((acc, curr) => acc + curr, 0);
      const avg = Number((sum / validNumericValues.length).toFixed(2));
      const sorted = [...validNumericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

      const variance =
        validNumericValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
        validNumericValues.length;
      const stdDev = Number(Math.sqrt(variance).toFixed(2));

      metric.sum = sum;
      metric.avg = avg;
      metric.min = Math.min(...validNumericValues);
      metric.max = Math.max(...validNumericValues);
      metric.numericValues = validNumericValues;
      metric.median = median;
      metric.stdDev = stdDev;
    }

    columnMetrics[col.key] = metric;
  });

  const allCells = totalRows * totalColumns;
  const completionRate = allCells > 0 ? Math.round(((allCells - nomsizCellsCount) / allCells) * 100) : 100;

  const numericColumns = Object.values(columnMetrics).filter((c) => c.isNumeric);
  const categoricalColumns = Object.values(columnMetrics).filter((c) => !c.isNumeric);

  const recentActivity = table.rows.slice(-10).map((row, idx) => ({
    index: idx + 1,
    name: row.values[table.columns[0]?.key] || `Yozuv #${idx + 1}`,
    date: row.createdAt ? new Date(row.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : 'Hozirgina',
    rowData: row.values,
  }));

  return {
    totalRows,
    totalColumns,
    nomsizCellsCount,
    filledCellsCount,
    completionRate,
    columnMetrics,
    numericColumns,
    categoricalColumns,
    recentActivity,
  };
}

export interface AnalyticalInstrumentDef {
  id: string;
  name: string;
  description: string;
  category: 'overview' | 'charts' | 'statistics' | 'ranking';
  icon: string;
  badge?: string;
}

export const AVAILABLE_INSTRUMENTS: AnalyticalInstrumentDef[] = [
  {
    id: 'kpi_cards',
    name: 'Asosiy KPI Metrikalar',
    description: 'Yozuvlar soni, ustunlar, to\'ldirilganlik va bo\'sh kataklar',
    category: 'overview',
    icon: 'Layers',
    badge: 'Asosiy',
  },
  {
    id: 'dynamics_trend',
    name: 'Ketma-ketlik va Trend Dinamikasi',
    description: 'Yozuvlarning vaqt va tartib bo\'yicha o\'sish/pasayish chizig\'i (Line Chart)',
    category: 'charts',
    icon: 'TrendingUp',
    badge: 'Dinamika',
  },
  {
    id: 'bar_comparison',
    name: 'Ustunlar Bo\'yicha Taqqoslash',
    description: 'Raqamli ko\'rsatkichlarning ustunli diagrammasi (Bar Chart)',
    category: 'charts',
    icon: 'BarChart2',
  },
  {
    id: 'pie_distribution',
    name: 'Kategoriyalar Taqsimoti',
    description: 'Matnli ustunlar ulushi va foiz taqsimoti (Pie/Donut Chart)',
    category: 'charts',
    icon: 'PieChart',
  },
  {
    id: 'cumulative_area',
    name: 'Kümülyativ O\'sish Maydoni',
    description: 'Jami summaning yig\'ilib borish traektoriyasi (Area Chart)',
    category: 'charts',
    icon: 'AreaChart',
    badge: 'Yangi',
  },
  {
    id: 'radar_profile',
    name: 'Ko\'p O\'lchovli Profil (Radar)',
    description: 'Bir nechta parametrlar balansi va ko\'pburchakli taqqoslama',
    category: 'charts',
    icon: 'Compass',
    badge: 'Radar',
  },
  {
    id: 'math_statistics',
    name: 'Statistik & Matematik Formulalar',
    description: 'Jami summa, o\'rtacha, mediana, min/max va standart og\'ish',
    category: 'statistics',
    icon: 'Calculator',
  },
  {
    id: 'top_bottom_ranking',
    name: 'Ekstremumlar va Reyting (Top & Bottom)',
    description: 'Eng yuqori va eng past 5 ta ko\'rsatkichli yozuvlar',
    category: 'ranking',
    icon: 'Trophy',
    badge: 'Reyting',
  },
  {
    id: 'correlation_scatter',
    name: 'Bog\'liqlik va Korrelyatsiya (Scatter)',
    description: 'Ikki xil raqamli ustun o\'rtasidagi o\'zaro bog\'liqlik nuqtalari',
    category: 'statistics',
    icon: 'ScatterPlot',
  },
];

export const INSTRUMENT_PRESETS = [
  {
    id: 'all',
    name: 'Barcha Instrumentlar',
    description: 'Barcha 9 ta analitik instrument faol',
    instruments: [
      'kpi_cards',
      'dynamics_trend',
      'bar_comparison',
      'pie_distribution',
      'cumulative_area',
      'radar_profile',
      'math_statistics',
      'top_bottom_ranking',
      'correlation_scatter',
    ],
  },
  {
    id: 'finance_trend',
    name: 'Moliya & Trend Dinamikasi',
    description: 'Dinamika, kümülyativ o\'sish, hisob-kitob va reytinglar',
    instruments: [
      'kpi_cards',
      'dynamics_trend',
      'cumulative_area',
      'math_statistics',
      'top_bottom_ranking',
    ],
  },
  {
    id: 'structure_distribution',
    name: 'Taqsimot & Tuzilma Tahlili',
    description: 'Doiraviy taqsimot, ustunli taqqoslama va radar profil',
    instruments: [
      'kpi_cards',
      'pie_distribution',
      'bar_comparison',
      'radar_profile',
    ],
  },
  {
    id: 'compact',
    name: 'Minimal & Ixcham',
    description: 'Faqatgina asosiy KPI va Trend chizig\'i',
    instruments: ['kpi_cards', 'dynamics_trend'],
  },
];

export const DEFAULT_SELECTED_INSTRUMENTS = [
  'kpi_cards',
  'dynamics_trend',
  'bar_comparison',
  'pie_distribution',
  'math_statistics',
];

export const CHART_COLORS = [
  '#0284c7', // sky 600
  '#2563eb', // blue 600
  '#0d9488', // teal 600
  '#7c3aed', // violet 600
  '#ea580c', // orange 600
  '#059669', // emerald 600
  '#4f46e5', // indigo 600
  '#db2777', // pink 600
  '#0891b2', // cyan 600
  '#334155', // slate 700
];
