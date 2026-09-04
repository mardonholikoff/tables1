import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Table as TableIcon,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  X,
  Filter,
  Calendar,
  Hash,
  Activity,
  Maximize2,
  ExternalLink,
  GitCompare,
  Link2,
  ArrowUpDown,
  Sliders,
  Check,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { UserTable, TableRowData } from '../types';
import { CHART_COLORS } from '../utils/analytics';
import { exportTableToExcel } from '../utils/excelExport';

interface CrossTableInsightsViewProps {
  tables: UserTable[];
  onSelectTable?: (tableId: string) => void;
  onInspectCell?: (colKey: string, colName: string, val: string, rIdx: number, tableId: string) => void;
  isReadOnly?: boolean;
}

interface CommonEntity {
  value: string;
  tablesCount: number;
  totalOccurrences: number;
  tableIds: string[];
  tableNames: string[];
  sampleColumnNames: string[];
}

interface SearchMatch {
  table: UserTable;
  row: TableRowData;
  rowIndex: number;
  matchedColumnKey: string;
  matchedColumnName: string;
  matchedValue: string;
}

// Pairwise Table Similarity
interface TablePairSimilarity {
  table1: UserTable;
  table2: UserTable;
  sharedValuesCount: number;
  jaccardPercent: number;
  topSharedValues: string[];
}

// Pearson Correlation Pair
interface NumericCorrelationResult {
  table1: UserTable;
  col1Key: string;
  col1Name: string;
  table2: UserTable;
  col2Key: string;
  col2Name: string;
  joinKeyName: string;
  r: number;
  strength: 'strong_positive' | 'moderate_positive' | 'weak' | 'moderate_negative' | 'strong_negative';
  dataPoints: { x: number; y: number; label: string }[];
}

export const CrossTableInsightsView: React.FC<CrossTableInsightsViewProps> = ({
  tables,
  onSelectTable,
  onInspectCell,
  isReadOnly = false,
}) => {
  // 1. By default, NO tables are selected
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  
  // Navigation sub-tab inside Insights: 'entities' (Bir xil ma'lumotlar) or 'correlations' (Korrelyatsiyalar)
  const [activeInsightsTab, setActiveInsightsTab] = useState<'entities' | 'correlations'>('entities');

  // Search & Active selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEntity, setActiveEntity] = useState<string | null>(null);
  const [resultTableFilter, setResultTableFilter] = useState<string>('all');

  // Correlation interactive controls
  const [corrTable1Id, setCorrTable1Id] = useState<string>('');
  const [corrTable2Id, setCorrTable2Id] = useState<string>('');
  const [corrCol1Key, setCorrCol1Key] = useState<string>('');
  const [corrCol2Key, setCorrCol2Key] = useState<string>('');

  // Selected tables objects
  const selectedTables = useMemo(() => {
    return tables.filter((t) => selectedTableIds.includes(t.id));
  }, [tables, selectedTableIds]);

  // Toggle single table selection
  const handleToggleTable = (tableId: string) => {
    setSelectedTableIds((prev) => {
      const next = prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId];
      // Reset correlation pickers if needed
      if (!next.includes(corrTable1Id)) setCorrTable1Id(next[0] || '');
      if (!next.includes(corrTable2Id)) setCorrTable2Id(next[1] || next[0] || '');
      return next;
    });
  };

  // Select all tables
  const handleSelectAll = () => {
    setSelectedTableIds(tables.map((t) => t.id));
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedTableIds([]);
    setActiveEntity(null);
    setSearchQuery('');
  };

  // -------------------------------------------------------------
  // DETECT IDENTICAL / COMMON ENTITIES ACROSS SELECTED TABLES
  // -------------------------------------------------------------
  const commonEntities = useMemo<CommonEntity[]>(() => {
    if (selectedTables.length < 2) return [];

    // Map: normalized lowercased value -> info
    const valueMap: Record<
      string,
      {
        originalVal: string;
        tableOccurrences: Record<string, number>;
        columns: Set<string>;
      }
    > = {};

    selectedTables.forEach((table) => {
      table.rows.forEach((row) => {
        table.columns.forEach((col) => {
          const rawVal = (row.values[col.key] || '').trim();
          if (
            !rawVal ||
            rawVal.toLowerCase() === 'nomsiz' ||
            rawVal.length < 2 ||
            (/^\d+$/.test(rawVal) && rawVal.length < 3) // ignore tiny numeric indices
          ) {
            return;
          }

          const normalized = rawVal.toLowerCase();
          if (!valueMap[normalized]) {
            valueMap[normalized] = {
              originalVal: rawVal,
              tableOccurrences: {},
              columns: new Set(),
            };
          }

          valueMap[normalized].tableOccurrences[table.id] =
            (valueMap[normalized].tableOccurrences[table.id] || 0) + 1;
          valueMap[normalized].columns.add(col.name);
        });
      });
    });

    const result: CommonEntity[] = [];

    Object.entries(valueMap).forEach(([_, data]) => {
      const tableIdsWithVal = Object.keys(data.tableOccurrences);
      if (tableIdsWithVal.length >= 2) {
        const totalOccurrences = Object.values(data.tableOccurrences).reduce((a, b) => a + b, 0);
        const tableNames = tableIdsWithVal
          .map((id) => selectedTables.find((t) => t.id === id)?.name || '')
          .filter(Boolean);

        result.push({
          value: data.originalVal,
          tablesCount: tableIdsWithVal.length,
          totalOccurrences,
          tableIds: tableIdsWithVal,
          tableNames,
          sampleColumnNames: Array.from(data.columns).slice(0, 3),
        });
      }
    });

    // Sort: items present in ALL selected tables first, then by table count, then total occurrences
    return result.sort((a, b) => {
      if (b.tablesCount !== a.tablesCount) {
        return b.tablesCount - a.tablesCount;
      }
      return b.totalOccurrences - a.totalOccurrences;
    });
  }, [selectedTables]);

  // Active search or entity selection
  const effectiveTerm = useMemo(() => {
    if (activeEntity) return activeEntity;
    return searchQuery.trim();
  }, [activeEntity, searchQuery]);

  // All matches for current term across selected tables
  const searchMatches = useMemo<SearchMatch[]>(() => {
    if (!effectiveTerm || selectedTables.length === 0) return [];

    const query = effectiveTerm.toLowerCase();
    const matches: SearchMatch[] = [];

    selectedTables.forEach((table) => {
      table.rows.forEach((row, rowIndex) => {
        let hasMatchedInRow = false;
        table.columns.forEach((col) => {
          const val = (row.values[col.key] || '').trim();
          if (val && val.toLowerCase().includes(query)) {
            if (!hasMatchedInRow) {
              matches.push({
                table,
                row,
                rowIndex,
                matchedColumnKey: col.key,
                matchedColumnName: col.name,
                matchedValue: val,
              });
              hasMatchedInRow = true;
            }
          }
        });
      });
    });

    return matches;
  }, [effectiveTerm, selectedTables]);

  // Distinct tables that contain the effective term
  const tablesWithMatches = useMemo(() => {
    const map = new Map<string, { table: UserTable; count: number }>();
    searchMatches.forEach((m) => {
      const existing = map.get(m.table.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(m.table.id, { table: m.table, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [searchMatches]);

  // -------------------------------------------------------------
  // PER-TABLE BREAKDOWN FOR THE SELECTED ENTITY
  // "u qaysi jadvalda qanday shu ham umumiy ko'rinishda tahliliy chiqadigan qil"
  // -------------------------------------------------------------
  const entityPerTableAnalysis = useMemo(() => {
    if (!effectiveTerm || selectedTables.length === 0) return [];

    const termLower = effectiveTerm.toLowerCase();

    return selectedTables.map((table) => {
      const matchingRowsWithIndex: { row: TableRowData; rowIndex: number }[] = [];
      table.rows.forEach((row, rowIndex) => {
        const hasMatch = table.columns.some((col) => {
          const v = (row.values[col.key] || '').trim().toLowerCase();
          return v.includes(termLower);
        });
        if (hasMatch) {
          matchingRowsWithIndex.push({ row, rowIndex });
        }
      });

      // Calculate numeric totals for this table if any
      let tableNumericSum = 0;
      let numericValsCount = 0;
      matchingRowsWithIndex.forEach(({ row }) => {
        table.columns.forEach((col) => {
          const raw = (row.values[col.key] || '').replace(/[\$,\s]/g, '');
          const num = Number(raw);
          if (!isNaN(num) && raw !== '') {
            tableNumericSum += num;
            numericValsCount++;
          }
        });
      });

      return {
        table,
        isFound: matchingRowsWithIndex.length > 0,
        count: matchingRowsWithIndex.length,
        matchingRowsWithIndex,
        tableNumericSum,
        numericValsCount,
      };
    });
  }, [effectiveTerm, selectedTables]);

  // Filtered search matches by selected table tab
  const filteredSearchMatches = useMemo(() => {
    if (resultTableFilter === 'all') return searchMatches;
    return searchMatches.filter((m) => m.table.id === resultTableFilter);
  }, [searchMatches, resultTableFilter]);

  // Comparative Stats for the active entity
  const comparativeStats = useMemo(() => {
    if (!effectiveTerm || selectedTables.length === 0) return null;

    const totalSelected = selectedTables.length;
    const tablesPresentCount = tablesWithMatches.length;
    const isPresentInAll = totalSelected > 0 && tablesPresentCount === totalSelected;
    const totalOccurrences = searchMatches.length;

    // Distribution data for Bar chart
    const barData = selectedTables.map((tbl) => {
      const matchInThisTable = searchMatches.filter((m) => m.table.id === tbl.id);
      return {
        tableId: tbl.id,
        name: tbl.name.length > 14 ? tbl.name.slice(0, 12) + '...' : tbl.name,
        fullName: tbl.name,
        count: matchInThisTable.length,
      };
    });

    // Distribution data for Pie chart
    const pieData = tablesWithMatches.map((item, idx) => ({
      name: item.table.name,
      value: item.count,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));

    // Numerical aggregation across matched rows
    let totalNumericSum = 0;
    let numericValuesFound = 0;
    const numericBreakdownByTable: { tableName: string; sum: number }[] = [];

    entityPerTableAnalysis.forEach((analysis) => {
      if (analysis.isFound && analysis.tableNumericSum > 0) {
        totalNumericSum += analysis.tableNumericSum;
        numericValuesFound += analysis.numericValsCount;
        numericBreakdownByTable.push({
          tableName: analysis.table.name,
          sum: analysis.tableNumericSum,
        });
      }
    });

    return {
      effectiveTerm,
      totalSelected,
      tablesPresentCount,
      isPresentInAll,
      totalOccurrences,
      barData,
      pieData,
      totalNumericSum,
      numericValuesFound,
      numericBreakdownByTable,
    };
  }, [effectiveTerm, selectedTables, tablesWithMatches, searchMatches, entityPerTableAnalysis]);

  // -------------------------------------------------------------
  // CORRELATION MODULE 1: PAIRWISE TABLE SIMILARITY & OVERLAP
  // -------------------------------------------------------------
  const tablePairwiseSimilarities = useMemo<TablePairSimilarity[]>(() => {
    if (selectedTables.length < 2) return [];

    const pairs: TablePairSimilarity[] = [];

    for (let i = 0; i < selectedTables.length; i++) {
      for (let j = i + 1; j < selectedTables.length; j++) {
        const t1 = selectedTables[i];
        const t2 = selectedTables[j];

        const set1 = new Set<string>();
        t1.rows.forEach((r) => {
          t1.columns.forEach((c) => {
            const v = (r.values[c.key] || '').trim().toLowerCase();
            if (v && v.length >= 2 && v !== 'nomsiz' && !(/^\d+$/.test(v) && v.length < 3)) {
              set1.add(v);
            }
          });
        });

        const set2 = new Set<string>();
        t2.rows.forEach((r) => {
          t2.columns.forEach((c) => {
            const v = (r.values[c.key] || '').trim().toLowerCase();
            if (v && v.length >= 2 && v !== 'nomsiz' && !(/^\d+$/.test(v) && v.length < 3)) {
              set2.add(v);
            }
          });
        });

        // Calculate intersection
        const intersection: string[] = [];
        set1.forEach((val) => {
          if (set2.has(val)) {
            intersection.push(val);
          }
        });

        const unionSize = new Set([...Array.from(set1), ...Array.from(set2)]).size;
        const jaccardPercent = unionSize > 0 ? Math.round((intersection.length / unionSize) * 100) : 0;

        pairs.push({
          table1: t1,
          table2: t2,
          sharedValuesCount: intersection.length,
          jaccardPercent,
          topSharedValues: intersection.slice(0, 5),
        });
      }
    }

    return pairs.sort((a, b) => b.sharedValuesCount - a.sharedValuesCount);
  }, [selectedTables]);

  // -------------------------------------------------------------
  // CORRELATION MODULE 2: PEARSON CORRELATION & SCATTER PLOT
  // -------------------------------------------------------------
  // Get active pair tables for numeric correlation
  const targetTable1 = useMemo(() => {
    return selectedTables.find((t) => t.id === corrTable1Id) || selectedTables[0];
  }, [selectedTables, corrTable1Id]);

  const targetTable2 = useMemo(() => {
    return (
      selectedTables.find((t) => t.id === corrTable2Id) ||
      selectedTables[1] ||
      selectedTables[0]
    );
  }, [selectedTables, corrTable2Id]);

  // Numeric columns in targetTable1 and targetTable2
  const t1NumericCols = useMemo(() => {
    if (!targetTable1) return [];
    return targetTable1.columns.filter((col) => {
      const sample = targetTable1.rows
        .map((r) => (r.values[col.key] || '').replace(/[\$,\s]/g, ''))
        .filter((v) => v !== '');
      return sample.length > 0 && sample.every((v) => !isNaN(Number(v)));
    });
  }, [targetTable1]);

  const t2NumericCols = useMemo(() => {
    if (!targetTable2) return [];
    return targetTable2.columns.filter((col) => {
      const sample = targetTable2.rows
        .map((r) => (r.values[col.key] || '').replace(/[\$,\s]/g, ''))
        .filter((v) => v !== '');
      return sample.length > 0 && sample.every((v) => !isNaN(Number(v)));
    });
  }, [targetTable2]);

  // Effective columns for correlation
  const activeCol1Key = corrCol1Key || (t1NumericCols[0]?.key ?? '');
  const activeCol2Key = corrCol2Key || (t2NumericCols[0]?.key ?? '');

  const numericCorrelationResult = useMemo<NumericCorrelationResult | null>(() => {
    if (!targetTable1 || !targetTable2 || !activeCol1Key || !activeCol2Key) return null;

    const col1 = targetTable1.columns.find((c) => c.key === activeCol1Key);
    const col2 = targetTable2.columns.find((c) => c.key === activeCol2Key);
    if (!col1 || !col2) return null;

    // Match rows between table1 and table2
    // 1. First, check if there's a common identifier column or identical values
    // Find candidate key columns (non-numeric, e.g., name, id, date, code)
    const t1TextCols = targetTable1.columns.filter((c) => c.key !== activeCol1Key);
    const t2TextCols = targetTable2.columns.filter((c) => c.key !== activeCol2Key);

    let bestJoinCol1 = t1TextCols[0]?.key;
    let bestJoinCol2 = t2TextCols[0]?.key;
    let joinName = 'Qator tartibi / Moslik';

    // Attempt to match by common text column name or exact matches
    for (const c1 of t1TextCols) {
      for (const c2 of t2TextCols) {
        if (c1.name.toLowerCase() === c2.name.toLowerCase()) {
          bestJoinCol1 = c1.key;
          bestJoinCol2 = c2.key;
          joinName = c1.name;
          break;
        }
      }
    }

    const dataPoints: { x: number; y: number; label: string }[] = [];

    // Map table 2 values by joinKey
    const t2Map = new Map<string, number>();
    targetTable2.rows.forEach((r, idx) => {
      const keyVal = bestJoinCol2 ? (r.values[bestJoinCol2] || '').trim().toLowerCase() : String(idx);
      const numVal = Number((r.values[activeCol2Key] || '').replace(/[\$,\s]/g, ''));
      if (!isNaN(numVal) && keyVal) {
        t2Map.set(keyVal, numVal);
      }
    });

    // Join with table 1
    targetTable1.rows.forEach((r, idx) => {
      const keyVal = bestJoinCol1 ? (r.values[bestJoinCol1] || '').trim().toLowerCase() : String(idx);
      const num1 = Number((r.values[activeCol1Key] || '').replace(/[\$,\s]/g, ''));

      if (!isNaN(num1)) {
        let num2: number | undefined = t2Map.get(keyVal);
        // If no direct key match, match by row index if same size
        if (num2 === undefined && idx < targetTable2.rows.length) {
          const fallbackNum = Number((targetTable2.rows[idx].values[activeCol2Key] || '').replace(/[\$,\s]/g, ''));
          if (!isNaN(fallbackNum)) {
            num2 = fallbackNum;
          }
        }

        if (num2 !== undefined) {
          dataPoints.push({
            x: num1,
            y: num2,
            label: (r.values[bestJoinCol1 || ''] || `Qator #${idx + 1}`),
          });
        }
      }
    });

    if (dataPoints.length < 2) return null;

    // Calculate Pearson correlation coefficient r
    const n = dataPoints.length;
    const meanX = dataPoints.reduce((sum, p) => sum + p.x, 0) / n;
    const meanY = dataPoints.reduce((sum, p) => sum + p.y, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    dataPoints.forEach((p) => {
      const diffX = p.x - meanX;
      const diffY = p.y - meanY;
      numerator += diffX * diffY;
      sumSqX += diffX * diffX;
      sumSqY += diffY * diffY;
    });

    const denominator = Math.sqrt(sumSqX * sumSqY);
    const r = denominator === 0 ? 0 : Number((numerator / denominator).toFixed(3));

    let strength: NumericCorrelationResult['strength'] = 'weak';
    if (r >= 0.7) strength = 'strong_positive';
    else if (r >= 0.35) strength = 'moderate_positive';
    else if (r <= -0.7) strength = 'strong_negative';
    else if (r <= -0.35) strength = 'moderate_negative';
    else strength = 'weak';

    return {
      table1: targetTable1,
      col1Key: activeCol1Key,
      col1Name: col1.name,
      table2: targetTable2,
      col2Key: activeCol2Key,
      col2Name: col2.name,
      joinKeyName: joinName,
      r,
      strength,
      dataPoints,
    };
  }, [targetTable1, targetTable2, activeCol1Key, activeCol2Key]);

  // Export search results to Excel
  const handleExportSearchResults = () => {
    if (filteredSearchMatches.length === 0) return;

    const firstMatch = filteredSearchMatches[0];
    const syntheticTable: UserTable = {
      id: 'insaytlar_export_' + Date.now(),
      name: `Insayt_${effectiveTerm || 'Natijalar'}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: [
        { id: 'c_tbl', name: 'Jadval Nomi', key: 'col_table_name' },
        ...firstMatch.table.columns,
      ],
      rows: filteredSearchMatches.map((m, idx) => ({
        id: `r_${idx}`,
        createdAt: m.row.createdAt,
        values: {
          col_table_name: m.table.name,
          ...m.row.values,
        },
      })),
    };

    exportTableToExcel(syntheticTable);
  };

  return (
    <div className="space-y-6 font-mono text-sky-950">
      {/* -------------------------------------------------------- */}
      {/* TOP BANNER & TABLE MULTI-SELECTOR                       */}
      {/* -------------------------------------------------------- */}
      <div className="p-6 bg-white border border-sky-200 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-900 px-2.5 py-1 rounded-full bg-sky-100 border border-sky-300 inline-flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-sky-700" />
                <span>Jadvallararo Insaytlar & Korrelyatsiyalar</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 rounded-md font-mono">
                Cross-Table Analytics
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-sky-950 tracking-tight font-mono">
              Insaytlar va O'zaro Korrelyatsiyalar Markazi
            </h2>
            <p className="text-xs sm:text-sm text-sky-900 mt-1 max-w-2xl font-medium">
              Barcha jadvallardan bir nechtasini tanlang. Ularning ichidagi bir xil ma'lumotlarni tahlil qiling,
              har bir jadvalda qanday aks etganini umumiy ko'rinishda ko'ring yoki o'zaro korrelyatsiyalarini o'rganing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedTableIds.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <X className="w-3.5 h-3.5 text-sky-700" />
                <span>Tanlovni tozalash</span>
              </button>
            )}

            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs border border-sky-700"
            >
              <CheckSquare className="w-3.5 h-3.5 text-white" />
              <span>Barcha jadvallarni tanlash ({tables.length})</span>
            </button>
          </div>
        </div>

        {/* Table Selector Pills */}
        <div className="mt-6 pt-5 border-t border-sky-200">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-700" />
              <span>Jadvallarni tanlang ({selectedTableIds.length} / {tables.length} ta tanlangan):</span>
            </span>
            <span className="text-[11px] text-sky-800 font-bold">
              {selectedTableIds.length === 0 ? "Boshlash uchun jadvallarni tanlang" : `${selectedTableIds.length} ta jadval faol`}
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="text-xs text-sky-800 p-3 bg-sky-50 rounded-xl border border-sky-200">
              Mavjud jadvallar topilmadi. Avval yangi jadval yarating.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {tables.map((table) => {
                const isSelected = selectedTableIds.includes(table.id);
                return (
                  <button
                    key={table.id}
                    onClick={() => handleToggleTable(table.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition cursor-pointer font-mono ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                        : 'bg-sky-50/70 hover:bg-sky-100 text-sky-950 border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-sky-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-sky-950'}`}>
                          {table.name}
                        </div>
                        <div className={`text-[10px] font-medium ${isSelected ? 'text-sky-100' : 'text-sky-800'}`}>
                          {table.rows.length} qator • {table.columns.length} ustun
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* BY DEFAULT: EMPTY STATE WHEN NO TABLES ARE SELECTED      */}
      {/* -------------------------------------------------------- */}
      {selectedTableIds.length === 0 ? (
        <div className="p-12 sm:p-16 bg-white border border-sky-200 rounded-3xl text-center shadow-sm space-y-4 font-mono text-sky-950">
          <div className="w-16 h-16 rounded-3xl bg-sky-100 border border-sky-300 text-sky-700 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-8 h-8 text-sky-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg sm:text-xl font-black text-sky-950 tracking-tight">
              Hozircha hech qaysi jadval tanlanmagan
            </h3>
            <p className="text-xs sm:text-sm text-sky-900 leading-relaxed font-medium">
              Jadvallar ichidagi bir xil ma'lumotlarni aniqlash, ularni har bir jadval bo'yicha tahlil qilish
              yoki o'zaro korrelyatsiyalarni hisoblash uchun yuqoridagi ro'yxatdan kamida 2 ta jadvalni tanlang.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSelectAll}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer inline-flex items-center gap-2 shadow-xs border border-sky-700"
            >
              <CheckSquare className="w-4 h-4 text-white" />
              <span>Barcha ({tables.length} ta) jadvallarni tanlash</span>
            </button>
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------- */
        /* WHEN AT LEAST ONE TABLE IS SELECTED                     */
        /* -------------------------------------------------------- */
        <div className="space-y-6">
          {/* TAB SWITCHER: Bir xil ma'lumotlar vs Korrelyatsiyalar */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-sky-300 rounded-2xl shadow-xs font-mono">
            <button
              onClick={() => setActiveInsightsTab('entities')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                activeInsightsTab === 'entities'
                  ? 'bg-sky-600 text-white shadow-xs border border-sky-700'
                  : 'text-sky-900 hover:bg-sky-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>1. Bir Xil Ma'lumotlar & Qiyosiy Tahlil</span>
              {commonEntities.length > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeInsightsTab === 'entities' ? 'bg-sky-800 text-white' : 'bg-sky-100 text-sky-950'
                  }`}
                >
                  {commonEntities.length} ta topildi
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveInsightsTab('correlations')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                activeInsightsTab === 'correlations'
                  ? 'bg-sky-600 text-white shadow-xs border border-sky-700'
                  : 'text-sky-900 hover:bg-sky-50'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>2. Jadvallararo Korrelyatsiyalar (Bog'liqlik)</span>
              {tablePairwiseSimilarities.length > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeInsightsTab === 'correlations' ? 'bg-sky-800 text-white' : 'bg-sky-100 text-sky-950'
                  }`}
                >
                  {tablePairwiseSimilarities.length} juftlik
                </span>
              )}
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: BIR XIL MA'LUMOTLAR VA HAR BIR JADVALDAGI HOLATI */}
          {/* ======================================================== */}
          {activeInsightsTab === 'entities' && (
            <div className="space-y-6">
              {/* SEARCH & COMMON DISCOVERY CARD */}
              <div className="p-6 bg-white border border-sky-200 rounded-3xl shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-sky-950 uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Search className="w-4 h-4 text-sky-700" />
                      <span>Tanlangan jadvallar bo'ylab umumiy qidiruv</span>
                    </h3>
                    <p className="text-xs text-sky-900 font-medium">
                      Istalgan mahsulot, mijoz, status yoki qiymatni kiriting — barcha tanlangan jadvallardan qidiriladi va qiyoslanadi.
                    </p>
                  </div>

                  {effectiveTerm && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveEntity(null);
                      }}
                      className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
                    >
                      <X className="w-3.5 h-3.5 text-sky-700" />
                      <span>Qidiruvni tozalash</span>
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-sky-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveEntity(null);
                    }}
                    placeholder="Tanlangan jadvallar ichidan qidirish (masalan: Toshkent, Bajarildi, Nexia, Cobalt...)"
                    className="w-full pl-11 pr-10 py-3 bg-sky-50/60 border border-sky-300 rounded-2xl text-xs sm:text-sm text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-medium transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-600 hover:text-sky-950 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* COMMON ENTITIES QUICK PILLS */}
                {commonEntities.length > 0 ? (
                  <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs font-bold text-sky-950 flex items-center gap-2 font-mono">
                        <Sparkles className="w-4 h-4 text-sky-700" />
                        <span>Bir xil uchragan umumiy ma'lumotlar ({commonEntities.length} ta):</span>
                      </div>
                      <span className="text-[10px] text-sky-800 font-bold">
                        Birini tanlang va har bir jadvaldagi holatini solishtiring
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {commonEntities.slice(0, 18).map((item) => {
                        const isSelected = effectiveTerm.toLowerCase() === item.value.toLowerCase();
                        const isAll = item.tablesCount === selectedTables.length;

                        return (
                          <button
                            key={item.value}
                            onClick={() => {
                              setActiveEntity(item.value);
                              setSearchQuery(item.value);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                              isSelected
                                ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-2 ring-sky-400'
                                : isAll
                                ? 'bg-white text-sky-950 border-sky-400 hover:bg-sky-100 shadow-xs'
                                : 'bg-white text-sky-900 border-sky-300 hover:bg-sky-100'
                            }`}
                            title={`${item.value}: ${item.tablesCount} ta jadvalda, jami ${item.totalOccurrences} marta uchradi`}
                          >
                            {isAll && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Barcha tanlangan jadvallarda mavjud" />
                            )}
                            <span>{item.value}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                isSelected
                                  ? 'bg-sky-800 text-white'
                                  : isAll
                                  ? 'bg-sky-200 text-sky-950'
                                  : 'bg-sky-100 text-sky-900'
                              }`}
                            >
                              {item.tablesCount} ta jadvalda ({item.totalOccurrences})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  selectedTables.length >= 2 && (
                    <div className="p-3 bg-sky-50 text-sky-800 text-xs rounded-xl border border-sky-200">
                      Tanlangan jadvallarda kamida 2 ta jadvalda bir xil takrorlangan matnli ma'lumot topilmadi.
                      Yuqoridagi qidiruv maydoni orqali istalgan so'zni kiritib qidirishingiz mumkin.
                    </div>
                  )
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* "U QAYSI JADVALDA QANDAY SHU HAM UMUMIY KO'RINISHDA TAHLILIY CHIQADIGAN QIL" */}
              {/* PER-TABLE BREAKDOWN CARDS MATRIX                                 */}
              {/* ------------------------------------------------------------------ */}
              {effectiveTerm && (
                <div className="p-6 bg-white border border-sky-200 rounded-3xl shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-sky-100 text-sky-700 rounded-lg">
                          <Layers className="w-4 h-4" />
                        </span>
                        <h3 className="text-base font-black text-sky-950 font-mono tracking-tight">
                          "{effectiveTerm}" — Jadvallar Bo'yicha Qiyosiy Tahlil
                        </h3>
                      </div>
                      <p className="text-xs text-sky-900 font-medium mt-0.5">
                        Har bir jadvalda ushbu ma'lumot mavjudligi, qanday ustunlar va yozuvlar bilan kelgani qiyosiy taqqoslanmoqda:
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-3 py-1 bg-sky-50 border border-sky-300 rounded-xl text-sky-950">
                        Qamrov: {tablesWithMatches.length} / {selectedTables.length} ta jadval
                      </span>
                    </div>
                  </div>

                  {/* Grid of per-table status & preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {entityPerTableAnalysis.map((item) => (
                      <div
                        key={item.table.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                          item.isFound
                            ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                            : 'bg-white border-sky-200/80 opacity-75'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Table Header & Status Badge */}
                          <div className="flex items-center justify-between gap-2 border-b border-sky-200 pb-2.5">
                            <div className="flex items-center gap-2 truncate">
                              <TableIcon className="w-4 h-4 text-sky-700 shrink-0" />
                              <span className="text-xs font-bold text-sky-950 truncate font-mono">
                                {item.table.name}
                              </span>
                            </div>

                            {item.isFound ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{item.count} ta yozuv</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1 shrink-0">
                                <XCircle className="w-3 h-3 text-slate-400" />
                                <span>Mavjud emas</span>
                              </span>
                            )}
                          </div>

                          {/* Content if found */}
                          {item.isFound ? (
                            <div className="space-y-2.5">
                              <div className="text-[11px] text-sky-900 font-medium">
                                Jadvalda {item.count} ta qatorda uchradi.
                                {item.tableNumericSum > 0 && (
                                  <span className="block text-sky-950 font-bold mt-0.5">
                                    Bog'liq summa: {item.tableNumericSum.toLocaleString('uz-UZ')}
                                  </span>
                                )}
                              </div>

                              {/* Sample records inside this table */}
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {item.matchingRowsWithIndex.slice(0, 3).map(({ row, rowIndex }) => (
                                  <div
                                    key={row.id}
                                    className="p-2 bg-white rounded-xl border border-sky-200 text-xs space-y-1"
                                  >
                                    <div className="text-[10px] font-bold text-sky-700">
                                      Qator #{rowIndex + 1}:
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                      {item.table.columns.slice(0, 4).map((col) => {
                                        const val = row.values[col.key] || '';
                                        const isColMatch = val.toLowerCase().includes(effectiveTerm.toLowerCase());
                                        return (
                                          <div key={col.id} className="truncate">
                                            <span className="text-sky-800 text-[10px] block">{col.name}:</span>
                                            <span className={`truncate font-mono ${isColMatch ? 'font-black text-sky-950 bg-sky-200 px-1 rounded' : 'text-sky-900'}`}>
                                              {val || '-'}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                                {item.matchingRowsWithIndex.length > 3 && (
                                  <div className="text-[10px] text-center text-sky-700 font-bold pt-1">
                                    + yana {item.matchingRowsWithIndex.length - 3} ta qator
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center text-xs text-slate-500 italic">
                              "{effectiveTerm}" qiymati ushbu jadvaldagi hech bir ustunda qayd etilmagan.
                            </div>
                          )}
                        </div>

                        {/* Footer action */}
                        {onSelectTable && item.isFound && (
                          <div className="pt-3 border-t border-sky-200 mt-3 flex justify-end">
                            <button
                              onClick={() => onSelectTable(item.table.id)}
                              className="text-[11px] text-sky-700 hover:text-sky-950 font-bold underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Jadvalga o'tish</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------ */}
              {/* COMPARATIVE DASHBOARD CHARTS FOR SELECTED ENTITY                   */}
              {/* ------------------------------------------------------------------ */}
              {comparativeStats && (
                <div className="p-6 bg-white border border-sky-200 rounded-3xl shadow-sm space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-sky-700" />
                        <h3 className="text-base sm:text-lg font-black text-sky-950 font-mono tracking-tight">
                          Umumiy Dashboard: "{comparativeStats.effectiveTerm}"
                        </h3>
                      </div>
                      <p className="text-xs text-sky-900 font-medium">
                        Ushbu ma'lumotning barcha tanlangan jadvallar bo'ylab taqsimoti, foiz ulushi va raqamli ko'rsatkichlari.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportSearchResults}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs border border-sky-700"
                        title="Ushbu ma'lumot bo'yicha barcha yozuvlarni Excel formatida yuklash"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white" />
                        <span>Excel Eksport</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200">
                      <span className="text-[11px] font-bold text-sky-800 uppercase block font-mono">
                        Qamrov (Jadvallar)
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-sky-950 font-mono mt-0.5">
                        {comparativeStats.tablesPresentCount}{' '}
                        <span className="text-xs text-sky-800 font-medium">/ {comparativeStats.totalSelected} ta</span>
                      </div>
                      <div className="text-[10px] text-sky-800 font-mono mt-1 font-bold">
                        {Math.round((comparativeStats.tablesPresentCount / comparativeStats.totalSelected) * 100)}% qamrov
                      </div>
                    </div>

                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200">
                      <span className="text-[11px] font-bold text-sky-800 uppercase block font-mono">
                        Jami Qatorlar
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-sky-950 font-mono mt-0.5">
                        {comparativeStats.totalOccurrences} ta
                      </div>
                      <div className="text-[10px] text-sky-800 font-mono mt-1 font-bold">
                        barcha jadvallarda
                      </div>
                    </div>

                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200">
                      <span className="text-[11px] font-bold text-sky-800 uppercase block font-mono">
                        Eng Ko'p Uchrash
                      </span>
                      <div className="text-sm font-bold text-sky-950 truncate mt-1">
                        {tablesWithMatches[0]?.table.name || 'Mavjud emas'}
                      </div>
                      <div className="text-[10px] text-sky-800 font-mono mt-0.5 font-bold">
                        {tablesWithMatches[0]?.count || 0} ta yozuvda
                      </div>
                    </div>

                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200">
                      <span className="text-[11px] font-bold text-sky-800 uppercase block font-mono">
                        Bog'liq Raqamli Summa
                      </span>
                      <div className="text-lg sm:text-xl font-black text-sky-950 font-mono truncate mt-0.5">
                        {comparativeStats.totalNumericSum > 0
                          ? comparativeStats.totalNumericSum.toLocaleString('uz-UZ')
                          : 'Mavjud emas'}
                      </div>
                      <div className="text-[10px] text-sky-800 font-mono mt-1 font-bold">
                        {comparativeStats.numericValuesFound > 0 ? `${comparativeStats.numericValuesFound} ta qiymat yig'indisi` : 'faqat matnli'}
                      </div>
                    </div>
                  </div>

                  {/* CHARTS: Bar comparison + Pie distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* 1. Bar Chart: Occurrences per table */}
                    <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <BarChart3 className="w-3.5 h-3.5 text-sky-700" />
                          <span>Jadvallar Bo'yicha Yozuvlar Soni</span>
                        </span>
                        <span className="text-[10px] text-sky-800 font-bold font-mono">
                          Yozuvlar
                        </span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparativeStats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" opacity={0.6} />
                            <XAxis
                              dataKey="name"
                              tick={{ fill: '#082f49', fontSize: 11, fontFamily: 'monospace' }}
                              interval={0}
                              angle={-15}
                              textAnchor="end"
                            />
                            <YAxis
                              tick={{ fill: '#082f49', fontSize: 11, fontFamily: 'monospace' }}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#bae6fd',
                                borderRadius: '0.75rem',
                                color: '#082f49',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                              }}
                              formatter={(val: any, name: any, item: any) => [
                                `${val} ta qator`,
                                item.payload.fullName,
                              ]}
                            />
                            <Bar dataKey="count" name="Yozuvlar" fill="#0284c7" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 2. Pie Chart: Shares between tables */}
                    <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <PieChartIcon className="w-3.5 h-3.5 text-sky-700" />
                          <span>Jadvallardagi Ulushi (%)</span>
                        </span>
                        <span className="text-[10px] text-sky-800 font-bold font-mono">
                          Foiz taqsimoti
                        </span>
                      </div>

                      <div className="h-64 w-full">
                        {comparativeStats.pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={comparativeStats.pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={42}
                                paddingAngle={3}
                                label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                              >
                                {comparativeStats.pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#ffffff',
                                  borderColor: '#bae6fd',
                                  borderRadius: '0.75rem',
                                  color: '#082f49',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                }}
                                formatter={(val: any) => [
                                  `${val} ta (${Math.round((Number(val) / comparativeStats.totalOccurrences) * 100)}%)`,
                                  'Yozuvlar',
                                ]}
                              />
                              <Legend
                                wrapperStyle={{
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  color: '#082f49',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-sky-800">
                            Ma'lumot topilmadi
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: JADVALLARARO KORRELYATSIYALAR & O'ZARO BOG'LIQLIK */}
          {/* ======================================================== */}
          {activeInsightsTab === 'correlations' && (
            <div className="space-y-6">
              {/* 1. Table Similarity & Overlap Matrix */}
              <div className="p-6 bg-white border border-sky-200 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200">
                  <div>
                    <h3 className="text-sm font-bold text-sky-950 uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Link2 className="w-4 h-4 text-sky-700" />
                      <span>Jadvallararo O'zaro Bog'liqlik va O'xshashlik Matritsasi</span>
                    </h3>
                    <p className="text-xs text-sky-900 font-medium">
                      Tanlangan jadvallarning o'zaro umumiy ma'lumotlari hajmi va Jaccard o'xshashlik indeksi:
                    </p>
                  </div>
                  <span className="text-xs text-sky-800 font-mono font-bold">
                    {tablePairwiseSimilarities.length} ta jadval juftligi
                  </span>
                </div>

                {tablePairwiseSimilarities.length === 0 ? (
                  <div className="p-8 text-center bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-800">
                    Jadvallar o'rtasida o'xshashlikni hisoblash uchun kamida 2 ta jadval tanlangan bo'lishi kerak.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tablePairwiseSimilarities.map((pair, idx) => (
                      <div
                        key={`${pair.table1.id}_${pair.table2.id}_${idx}`}
                        className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs font-bold text-sky-950 truncate font-mono">
                              {pair.table1.name}
                            </span>
                            <ArrowUpDown className="w-3.5 h-3.5 text-sky-600 rotate-90 shrink-0" />
                            <span className="text-xs font-bold text-sky-950 truncate font-mono">
                              {pair.table2.name}
                            </span>
                          </div>

                          <div className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-xs font-bold shrink-0">
                            {pair.jaccardPercent}% moslik
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-sky-900 font-medium">
                          <span>Umumiy yagona qiymatlar:</span>
                          <strong className="text-sky-950">{pair.sharedValuesCount} ta ma'lumot</strong>
                        </div>

                        {/* Top shared pills */}
                        {pair.topSharedValues.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-sky-800 font-bold block">
                              Umumiy kalitlar namunasi:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {pair.topSharedValues.map((v) => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    setActiveEntity(v);
                                    setActiveInsightsTab('entities');
                                  }}
                                  className="px-2 py-0.5 bg-white border border-sky-300 rounded-md text-[11px] font-mono text-sky-900 hover:bg-sky-100 transition cursor-pointer"
                                  title="Ushbu ma'lumot bo'yicha tahlilni ochish"
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. NUMERIC PEARSON CORRELATION & SCATTER PLOT */}
              <div className="p-6 bg-white border border-sky-200 rounded-3xl shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200">
                  <div>
                    <h3 className="text-sm font-bold text-sky-950 uppercase tracking-wider flex items-center gap-2 font-mono">
                      <TrendingUp className="w-4 h-4 text-sky-700" />
                      <span>Raqamli Korrelyatsiya (Pearson Koeffitsienti & Scatter Plot)</span>
                    </h3>
                    <p className="text-xs text-sky-900 font-medium">
                      Ikkita jadval o'rtasidagi sonli ko'rsatkichlarning o'zaro bog'liqligi va tarqoqlik grafigi ($r \in [-1, 1]$):
                    </p>
                  </div>
                </div>

                {/* Interactive Selectors for Tables and Columns */}
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-sky-800 block uppercase mb-1">
                      1-Jadval:
                    </label>
                    <select
                      value={targetTable1?.id || ''}
                      onChange={(e) => setCorrTable1Id(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    >
                      {selectedTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-sky-800 block uppercase mb-1">
                      1-Jadval Sonli Ustuni:
                    </label>
                    <select
                      value={activeCol1Key}
                      onChange={(e) => setCorrCol1Key(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    >
                      {t1NumericCols.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                      {t1NumericCols.length === 0 && <option value="">Sonli ustun yo'q</option>}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-sky-800 block uppercase mb-1">
                      2-Jadval:
                    </label>
                    <select
                      value={targetTable2?.id || ''}
                      onChange={(e) => setCorrTable2Id(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    >
                      {selectedTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-sky-800 block uppercase mb-1">
                      2-Jadval Sonli Ustuni:
                    </label>
                    <select
                      value={activeCol2Key}
                      onChange={(e) => setCorrCol2Key(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    >
                      {t2NumericCols.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                      {t2NumericCols.length === 0 && <option value="">Sonli ustun yo'q</option>}
                    </select>
                  </div>
                </div>

                {/* Correlation Result Box & Scatter Chart */}
                {numericCorrelationResult ? (
                  <div className="space-y-4">
                    {/* KPI & Interpretation */}
                    <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sky-900 uppercase">
                            Pearson Korrelyatsiya Koeffitsienti (r):
                          </span>
                          <span className="text-lg font-black text-sky-950 px-2 py-0.5 bg-white border border-sky-300 rounded-lg">
                            {numericCorrelationResult.r > 0 ? '+' : ''}
                            {numericCorrelationResult.r}
                          </span>
                        </div>
                        <p className="text-xs text-sky-900 font-medium">
                          {numericCorrelationResult.strength === 'strong_positive' && (
                            <span className="text-emerald-700 font-bold">
                              Kuchli to'g'ri (musbat) korrelyatsiya: 1-jadvaldagi ko'rsatkich oshganda 2-jadvaldagi ko'rsatkich ham sezilarli darajada mutanosib oshadi.
                            </span>
                          )}
                          {numericCorrelationResult.strength === 'moderate_positive' && (
                            <span className="text-sky-800 font-bold">
                              O'rtacha to'g'ri korrelyatsiya: Ko'rsatkichlar o'rtasida ijobiy bog'liqlik mavjud.
                            </span>
                          )}
                          {numericCorrelationResult.strength === 'weak' && (
                            <span className="text-slate-700 font-bold">
                              Zaif yoki chiziqli bog'liqlik mavjud emas (ko'rsatkichlar mustaqil harakatlanmoqda).
                            </span>
                          )}
                          {numericCorrelationResult.strength === 'moderate_negative' && (
                            <span className="text-amber-800 font-bold">
                              O'rtacha teskari (manfiy) korrelyatsiya: Biri oshganda ikkinchisi pasayish tendensiyasiga ega.
                            </span>
                          )}
                          {numericCorrelationResult.strength === 'strong_negative' && (
                            <span className="text-red-700 font-bold">
                              Kuchli teskari (manfiy) korrelyatsiya: Ko'rsatkichlar bir-biriga qat'iy teskari mutanosib.
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="text-xs text-sky-800 font-bold shrink-0">
                        {numericCorrelationResult.dataPoints.length} ta taqqoslangan nuqta
                      </div>
                    </div>

                    {/* Scatter Chart */}
                    <div className="h-72 w-full p-2 bg-sky-50/40 rounded-2xl border border-sky-200">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" opacity={0.6} />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name={numericCorrelationResult.col1Name}
                            tick={{ fill: '#082f49', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: `${numericCorrelationResult.table1.name} (${numericCorrelationResult.col1Name})`,
                              position: 'insideBottom',
                              offset: -10,
                              fill: '#082f49',
                              fontSize: 11,
                              fontFamily: 'monospace',
                            }}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name={numericCorrelationResult.col2Name}
                            tick={{ fill: '#082f49', fontSize: 11, fontFamily: 'monospace' }}
                            label={{
                              value: `${numericCorrelationResult.table2.name} (${numericCorrelationResult.col2Name})`,
                              angle: -90,
                              position: 'insideLeft',
                              offset: 0,
                              fill: '#082f49',
                              fontSize: 11,
                              fontFamily: 'monospace',
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderColor: '#bae6fd',
                              borderRadius: '0.75rem',
                              color: '#082f49',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                            }}
                            formatter={(val: any, name: any) => [val, name]}
                          />
                          <Scatter
                            name="Ko'rsatkichlar"
                            data={numericCorrelationResult.dataPoints}
                            fill="#0284c7"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-800">
                    Tanlangan jadvallarda mos keluvchi sonli ustunlar yetarli emas yoki umumiy bog'lanuvchi yozuvlar soni kam.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
