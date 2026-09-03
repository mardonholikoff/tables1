import React from 'react';
import {
  Table as TableIcon,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Trash2,
  Edit3,
} from 'lucide-react';
import { UserTable } from '../types';
import { exportTableToExcel } from '../utils/excelExport';

interface GlobalDashboardOverviewProps {
  tables: UserTable[];
  onSelectTable: (tableId: string, view?: 'table_only' | 'dashboard_only' | 'split') => void;
  onOpenCreateTable: () => void;
  onOpenAddRecord: (tableId?: string) => void;
  onRequestDeleteTable: (table: UserTable) => void;
  onEditTable?: (table: UserTable) => void;
  onExportExcelLogged?: (table: UserTable, count: number) => void;
  isReadOnly?: boolean;
}

export const GlobalDashboardOverview: React.FC<GlobalDashboardOverviewProps> = ({
  tables,
  onSelectTable,
  onOpenCreateTable,
  onOpenAddRecord,
  onRequestDeleteTable,
  onEditTable,
  onExportExcelLogged,
  isReadOnly = false,
}) => {
  const totalTables = tables.length;
  const totalRows = tables.reduce((acc, t) => acc + t.rows.length, 0);
  const totalColumns = tables.reduce((acc, t) => acc + t.columns.length, 0);

  return (
    <div className="space-y-6 font-mono text-sky-950">
      {/* Workspace Banner */}
      <div className="p-6 bg-white border border-sky-200 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-900 px-2.5 py-1 rounded-full bg-sky-100 border border-sky-300 inline-block mb-2 font-mono">
              Daewoo Ishchi Muhiti
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-sky-950 tracking-tight">
              Barcha Jadvallar va Dashboardlar Umumiy Ko'rinishi
            </h2>
            <p className="text-xs sm:text-sm text-sky-900 mt-1 max-w-xl font-medium">
              {isReadOnly
                ? "Barcha mavjud jadvallar va ularning dinamik analitik dashboardlarini kuzatishingiz mumkin."
                : "Mavjud jadvallarni boshqaring, ularga yangi ma'lumotlar qo'shing, dinamikasini tahlil qiling va avtomatik yaratilgan dashboardlarni kuzating."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isReadOnly ? (
              <button
                onClick={onOpenCreateTable}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs border border-sky-700 flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Yangi jadval</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 bg-sky-100 text-sky-950 border border-sky-300 rounded-xl text-xs font-bold font-mono">
                AdminDW Nazoratchi (Faqat Ko'rish)
              </div>
            )}
          </div>
        </div>

        {/* Global Summary Counter */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-sky-200">
          <div>
            <span className="text-xs text-sky-900 font-bold">Jami Jadvallar</span>
            <div className="text-2xl font-black text-sky-950 font-mono">{totalTables}</div>
          </div>
          <div>
            <span className="text-xs text-sky-900 font-bold">Jami Yozuvlar</span>
            <div className="text-2xl font-black text-sky-950 font-mono">{totalRows}</div>
          </div>
          <div>
            <span className="text-xs text-sky-900 font-bold">Jami Ustunlar</span>
            <div className="text-2xl font-black text-sky-950 font-mono">{totalColumns}</div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div>
        <h3 className="text-xs font-bold text-sky-950 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-sky-700" />
          <span>Mavjud Jadvallar Ro'yxati ({tables.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            return (
              <div
                key={table.id}
                className="p-5 bg-white border border-sky-200 hover:border-sky-400 rounded-2xl transition shadow-sm flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center shadow-xs">
                      <TableIcon className="w-5 h-5 text-sky-700" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-900 border border-sky-200">
                        {new Date(table.createdAt).toLocaleDateString('uz-UZ')}
                      </span>
                      {/* Quick Excel Export button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportTableToExcel(table);
                          if (onExportExcelLogged) {
                            onExportExcelLogged(table, table.rows.length);
                          }
                        }}
                        className="p-1.5 text-sky-900 hover:bg-sky-100 rounded-lg transition cursor-pointer border border-sky-300 bg-white"
                        title="Excel (.xlsx) formatida yuklab olish"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
                      </button>
                      {/* Edit button on card */}
                      {!isReadOnly && onEditTable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTable(table);
                          }}
                          className="p-1.5 text-sky-900 hover:bg-sky-100 rounded-lg transition cursor-pointer border border-sky-300 bg-white"
                          title="Jadvalni tahrirlash (nomi va ustunlar)"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-700" />
                        </button>
                      )}
                      {/* Delete button on card */}
                      {!isReadOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDeleteTable(table);
                          }}
                          className="p-1.5 text-sky-900 hover:text-red-700 hover:bg-sky-100 rounded-lg transition cursor-pointer border border-sky-300 bg-white"
                          title="Jadvalni o'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-sky-950 group-hover:text-sky-700 transition mb-1">
                    {table.name}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-sky-900 mb-4 font-mono font-medium">
                    <span>{table.columns.length} ta ustun</span>
                    <span>•</span>
                    <span className="text-sky-950 font-bold">{table.rows.length} ta yozuv</span>
                  </div>

                  {/* Columns pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {table.columns.slice(0, 4).map((col) => (
                      <span
                        key={col.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-950 border border-sky-200 truncate max-w-[120px] font-mono font-bold"
                      >
                        {col.name}
                      </span>
                    ))}
                    {table.columns.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-sky-800 font-bold font-mono">
                        +{table.columns.length - 4} yana
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="pt-3 border-t border-sky-200 flex items-center justify-between gap-2">
                  {!isReadOnly ? (
                    <button
                      onClick={() => onOpenAddRecord(table.id)}
                      className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-sky-900 rounded-xl text-xs font-bold border border-sky-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-700" />
                      <span>Yozuv</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-sky-900 flex items-center gap-1 font-mono font-bold">
                      <Sparkles className="w-3 h-3 text-sky-700" />
                      <span>Analitika tayyor</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectTable(table.id, 'split')}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs border border-sky-700 transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>Tahlil & Jadval</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
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
