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
      className="w-full max-w-3xl mx-auto my-8 p-8 sm:p-12 bg-slate-900/80 border border-slate-800 rounded-3xl text-center backdrop-blur-xl shadow-2xl relative overflow-hidden"
    >
      {/* Glow effect */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/30 mb-6 shadow-inner">
        <Table className="w-10 h-10" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif mb-3">
        Hozircha hech qanday jadval mavjud emas
      </h2>

      <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
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
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi jadval yaratish</span>
          </button>
        </div>
      )}

      {/* Feature cards below */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-slate-800/80 text-left">
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5">
            <Plus className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-200 mb-1">Moslashuvchan Ustunlar</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ixtiyoriy miqdorda ustunlar belgilang va nomlarini erkin kiriting.
          </p>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-200 mb-1">Oson Yozuv Qo'shish</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ustunlar avtomatik shakllanadi, to'ldirilmagan joylar "nomsiz" saqlanadi.
          </p>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2.5">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-200 mb-1">Avtomatik Dashboard</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Har bir yozuv kiritilishi bilan diagrammalar real-vaqtda o'zgaradi.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
