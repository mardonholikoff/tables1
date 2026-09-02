import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, Edit3 } from 'lucide-react';
import { UserTable, TableRowData } from '../types';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: UserTable | null;
  row: TableRowData | null;
  onSave: (tableId: string, updatedRow: TableRowData) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  table,
  row,
  onSave,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (row) {
      setValues({ ...row.values });
    }
  }, [row]);

  if (!isOpen || !table || !row) return null;

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalValues: Record<string, string> = {};
    table.columns.forEach((col) => {
      const v = (values[col.key] || '').trim();
      finalValues[col.key] = v.length > 0 ? v : 'nomsiz';
    });

    const updated: TableRowData = {
      ...row,
      values: finalValues,
    };

    onSave(table.id, updated);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Yozuvni Tahrirlash</h2>
                <p className="text-xs text-slate-400">"{table.name}" jadvali qatori</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {table.columns.map((col, idx) => (
                <div key={col.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{col.name}</span>
                    <span className="font-mono text-[10px] text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/60">
                      {col.key}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={values[col.key] ?? ''}
                    onChange={(e) => handleChange(col.key, e.target.value)}
                    placeholder="Bo'sh bo'lsa: nomsiz"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>O'zgarishlarni saqlash</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
