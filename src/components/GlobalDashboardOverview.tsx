import React from 'react';
import {
  Table as TableIcon,
  BarChart3,
  Plus,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Trash2,
  Edit3,
} from 'lucide-react';
import { UserTable } from '../types';

interface GlobalDashboardOverviewProps {
  tables: UserTable[];
  onSelectTable: (tableId: string, view?: 'table_only' | 'dashboard_only' | 'split') => void;
  onOpenCreateTable: () => void;
  onOpenAddRecord: (tableId?: string) => void;
  onRequestDeleteTable: (table: UserTable) => void;
  onEditTable?: (table: UserTable) => void;
  isReadOnly?: boolean;
}

export const GlobalDashboardOverview: React.FC<GlobalDashboardOverviewProps> = ({
  tables,
  onSelectTable,
  onOpenCreateTable,
  onOpenAddRecord,
  onRequestDeleteTable,
  onEditTable,
  isReadOnly = false,
}) => {
  const totalTables = tables.length;
  const totalRows = tables.reduce((acc, t) => acc + t.rows.length, 0);
  const totalColumns = tables.reduce((acc, t) => acc + t.columns.length, 0);

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 inline-block mb-2">
              Daewoo Ishchi Muhiti
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
              Barcha Jadvallar va Dashboardlar Umumiy Ko'rinishi
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              {isReadOnly
                ? "Barcha mavjud jadvallar va ularning dinamik analitik dashboardlarini kuzatishingiz mumkin."
                : "Mavjud jadvallarni boshqaring, ularga yangi ma'lumotlar qo'shing, dinamikasini tahlil qiling va avtomatik yaratilgan dashboardlarni kuzating."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isReadOnly ? (
              <button
                onClick={onOpenCreateTable}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi jadval</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 bg-slate-800/80 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium">
                AdminDW Nazoratchi (Faqat Ko'rish)
              </div>
            )}
          </div>
        </div>

        {/* Global Summary Counter */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400">Jami Jadvallar</span>
            <div className="text-2xl font-bold text-white font-mono">{totalTables}</div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Jami Yozuvlar (Qatorlar)</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{totalRows}</div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Jami Ustunlar</span>
            <div className="text-2xl font-bold text-indigo-400 font-mono">{totalColumns}</div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Mavjud Jadvallar Ro'yxati ({tables.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            return (
              <div
                key={table.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition shadow-lg flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <TableIcon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {new Date(table.createdAt).toLocaleDateString('uz-UZ')}
                      </span>
                      {/* Edit button on card (Only if not read only) */}
                      {!isReadOnly && onEditTable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTable(table);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition cursor-pointer"
                          title="Jadvalni tahrirlash (nomi va ustunlar)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Delete button on card (Only if not read only) */}
                      {!isReadOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDeleteTable(table);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Jadvalni o'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition mb-1">
                    {table.name}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span>{table.columns.length} ta ustun</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{table.rows.length} ta yozuv</span>
                  </div>

                  {/* Columns pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {table.columns.slice(0, 4).map((col) => (
                      <span
                        key={col.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 truncate max-w-[120px]"
                      >
                        {col.name}
                      </span>
                    ))}
                    {table.columns.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                        +{table.columns.length - 4} yana
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {!isReadOnly ? (
                    <button
                      onClick={() => onOpenAddRecord(table.id)}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yozuv</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>Analitika tayyor</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectTable(table.id, 'split')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tahlil & Jadval</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
