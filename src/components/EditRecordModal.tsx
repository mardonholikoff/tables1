import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Edit3 } from 'lucide-react';
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
    table.columns.forEach((col, idx) => {
      if (idx === 0 || idx === 1) {
        // 1-ustun va 2-ustun o'zgarmas saqlanadi
        finalValues[col.key] = row.values[col.key] || (idx === 0 ? '1' : '');
      } else {
        const v = (values[col.key] || '').trim();
        finalValues[col.key] = v.length > 0 ? v : 'nomsiz';
      }
    });

    const updated: TableRowData = {
      ...row,
      values: finalValues,
    };

    onSave(table.id, updated);
    onClose();
  };

  // Foydalanuvchi tahrirlaydigan ustunlar (3-ustundan boshlab)
  const editableColumns = table.columns.slice(2);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-md overflow-y-auto font-mono text-sky-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white border border-sky-300 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sky-200 bg-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center border border-sky-700">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-sky-950 font-mono">Yozuvni Tahrirlash</h2>
                <p className="text-xs text-sky-900 font-medium">"{table.name}" jadvali</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-sky-900 hover:bg-sky-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono">
            {/* Foydalanuvchi tahrirlaydigan ustunlar */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {editableColumns.length === 0 ? (
                <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-center text-xs text-sky-900 font-bold">
                  Tahrirlanadigan qo'shimcha ustunlar mavjud emas.
                </div>
              ) : (
                editableColumns.map((col, idx) => {
                  const colNumber = idx + 3;
                  return (
                    <div key={col.id} className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-sky-950">
                          {colNumber}-ustun: <span className="text-sky-800">{col.name}</span>
                        </span>
                        <span className="text-[10px] text-sky-800 font-bold font-mono">c{colNumber}</span>
                      </div>
                      <input
                        type="text"
                        value={values[col.key] || ''}
                        onChange={(e) => handleChange(col.key, e.target.value)}
                        placeholder={`"${col.name}" qiymati...`}
                        className="w-full px-3 py-2 bg-white border border-sky-300 rounded-lg text-sky-950 placeholder-sky-400 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono font-medium"
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-sky-200 flex items-center justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-sky-900 hover:bg-sky-100 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs border border-sky-700 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4 text-white" />
                <span>O'zgarishlarni saqlash</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
