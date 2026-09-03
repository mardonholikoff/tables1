import React from 'react';
import { motion } from 'motion/react';
import { Table, Plus, BarChart3, FileSpreadsheet } from 'lucide-react';

interface EmptyStateProps {
  onOpenCreateTable: () => void;
  isReadOnly?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenCreateTable,
  isReadOnly = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto my-8 p-8 sm:p-12 bg-white border border-sky-200 rounded-3xl text-center shadow-sm relative overflow-hidden font-mono text-sky-950"
    >
      {/* Soft Blue glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none opacity-80" />

      {/* Main icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-100 text-sky-700 border border-sky-300 mb-6 shadow-xs font-bold">
        <Table className="w-10 h-10" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight mb-3 font-mono">
        Hozircha hech qanday jadval mavjud emas
      </h2>

      <p className="text-sm sm:text-base text-sky-900 max-w-lg mx-auto mb-8 leading-relaxed font-medium">
        {isReadOnly
          ? "Hozircha daewoouser tomonidan birorta ham jadval kiritilmagan. Foydalanuvchi jadval yaratganda u ushbu ekranda paydo bo'ladi."
          : "Birinchi jadvalingizni yarating. Jadval nomi va ustunlar sonini kiritsangiz, tizim avtomatik tarzda unga mos analitik dashboard va diagrammalarni yaratadi."}
      </p>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-center">
          <button
            id="empty-state-create-table-btn"
            onClick={onOpenCreateTable}
            className="px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-xs border border-sky-700 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Yangi jadval yaratish</span>
          </button>
        </div>
      )}

      {/* Feature cards below */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-sky-200 text-left">
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-sky-200 text-sky-800 border border-sky-300 flex items-center justify-center mb-2.5 font-bold">
            <Plus className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-sky-950 mb-1 font-mono">Moslashuvchan Ustunlar</h4>
          <p className="text-[11px] text-sky-900 leading-relaxed font-medium">
            Jadvalni istalgan ustunlar soni va nomlari bilan moslashtiring.
          </p>
        </div>

        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-sky-200 text-sky-800 border border-sky-300 flex items-center justify-center mb-2.5 font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-sky-950 mb-1 font-mono">Avtomatik Dashboard</h4>
          <p className="text-[11px] text-sky-900 leading-relaxed font-medium">
            Kiritilgan qiymatlar real-vaqtda chizma, grafik va KPI larga aylanadi.
          </p>
        </div>

        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-sky-200 text-sky-800 border border-sky-300 flex items-center justify-center mb-2.5 font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-sky-950 mb-1 font-mono">Excel & CSV Eksport</h4>
          <p className="text-[11px] text-sky-900 leading-relaxed font-medium">
            Barcha ma'lumotlarni to'liq Excel (.xlsx) formatida saqlang.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
