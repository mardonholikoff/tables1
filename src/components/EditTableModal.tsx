import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Edit3,
  Lock,
} from 'lucide-react';
import { UserTable, ColumnDefinition } from '../types';

interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: UserTable;
  onSave: (updatedTable: UserTable, changeSummary: string) => void;
}

interface EditableCustomColumn {
  id: string;
  key: string;
  name: string;
  isNew?: boolean;
}

export const EditTableModal: React.FC<EditTableModalProps> = ({
  isOpen,
  onClose,
  table,
  onSave,
}) => {
  const [tableName, setTableName] = useState(table.name);
  // Only user-defined custom columns (excluding system columns 1 and 2)
  const [customColumns, setCustomColumns] = useState<EditableCustomColumn[]>([]);
  const [error, setError] = useState('');

  // Synchronize when table opens/changes
  useEffect(() => {
    if (table) {
      setTableName(table.name);
      // System columns are at index 0 and 1, custom columns start from index 2
      const userCols = table.columns.slice(2).map((c) => ({
        id: c.id,
        key: c.key,
        name: c.name,
      }));
      setCustomColumns(userCols);
      setError('');
    }
  }, [table, isOpen]);

  const handleColumnNameChange = (index: number, newName: string) => {
    setCustomColumns((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const handleAddColumn = () => {
    if (customColumns.length >= 28) {
      setError("Qo'shimcha ustunlar soni ko'pi bilan 28 tagacha bo'lishi mumkin.");
      return;
    }
    const newColNumber = customColumns.length + 3; // 3, 4, 5...
    const newId = `c${newColNumber}_${Date.now()}`;
    const newCol: EditableCustomColumn = {
      id: newId,
      key: newId,
      name: customColumns.length === 0 ? 'nomsiz' : `nomsiz ${customColumns.length + 1}`,
      isNew: true,
    };
    setCustomColumns((prev) => [...prev, newCol]);
  };

  const handleRemoveColumn = (index: number) => {
    setCustomColumns((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= customColumns.length) return;

    setCustomColumns((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = tableName.trim();
    if (!cleanName) {
      setError("Jadval nomi majburiy!");
      return;
    }

    // Retain 1-ustun (№) and 2-ustun (Sana va vaqt)
    const systemCol1 = table.columns[0] || { id: 'c1', key: 'c1', name: '№' };
    const systemCol2 = table.columns[1] || { id: 'c2', key: 'c2', name: 'Sana va vaqt' };

    const newColumns: ColumnDefinition[] = [
      systemCol1,
      systemCol2,
      ...customColumns.map((col, idx) => ({
        id: col.id,
        key: col.key,
        name: col.name.trim().length > 0 ? col.name.trim() : `nomsiz ${idx + 1}`,
      })),
    ];

    // Align row values with updated columns
    const updatedRows = table.rows.map((row) => {
      const newVals: Record<string, string> = { ...row.values };
      customColumns.forEach((col) => {
        if (!newVals[col.key]) {
          newVals[col.key] = 'nomsiz';
        }
      });
      return {
        ...row,
        values: newVals,
      };
    });

    const updatedTable: UserTable = {
      ...table,
      name: cleanName,
      updatedAt: new Date().toISOString(),
      columns: newColumns,
      rows: updatedRows,
    };

    const changesText = `Jadval nomi "${cleanName}", jami ustunlar: ${newColumns.length} ta`;
    onSave(updatedTable, changesText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-md overflow-y-auto font-mono text-sky-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl bg-white border border-sky-300 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sky-200 bg-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center border border-sky-700">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-sky-950 font-mono">Jadval Strukturasi & Nomini Tahrirlash</h2>
                <p className="text-xs text-sky-900 font-medium">Ustunlarni qo'shish, o'chirish yoki tartibini o'zgartirish</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-sky-900 hover:bg-sky-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 font-mono">
            {error && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-center gap-2 text-xs text-red-800 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Jadval nomi */}
            <div>
              <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider mb-1.5 font-mono">
                Jadval nomi <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Jadval nomi..."
                className="w-full px-4 py-2.5 bg-sky-50/50 border border-sky-300 rounded-xl text-sky-950 placeholder-sky-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono font-medium"
                required
              />
            </div>

            {/* System Columns Protected Info */}
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1.5 font-mono">
              <div className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-700" />
                <span>Doimiy Tizim Ustunlari (Avtomatik boshqariladi):</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-950 font-bold flex items-center justify-between">
                  <span>1-ustun: №</span>
                  <span className="text-[10px] text-sky-800 font-bold">Avtomatik</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-950 font-bold flex items-center justify-between">
                  <span>2-ustun: Sana va vaqt</span>
                  <span className="text-[10px] text-sky-800 font-bold">Avtomatik</span>
                </div>
              </div>
            </div>

            {/* Custom columns manager */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-sky-950 uppercase tracking-wider font-mono">
                  Qo'shimcha ustunlar ({customColumns.length} ta)
                </label>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold border border-sky-700 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Yangi ustun qo'shish</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar font-mono">
                {customColumns.length === 0 ? (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-center text-xs text-sky-900 font-bold">
                    Hozircha qo'shimcha ustun yo'q. "Yangi ustun qo'shish" tugmasini bosing.
                  </div>
                ) : (
                  customColumns.map((col, idx) => {
                    const colNumber = idx + 3;
                    return (
                      <div
                        key={col.id}
                        className="flex items-center gap-2 p-2 bg-sky-50 rounded-xl border border-sky-200"
                      >
                        <div className="w-10 h-7 rounded-md bg-sky-100 border border-sky-300 flex items-center justify-center text-[11px] font-mono font-black text-sky-900 shrink-0">
                          c{colNumber}
                        </div>
                        <input
                          type="text"
                          value={col.name}
                          onChange={(e) => handleColumnNameChange(idx, e.target.value)}
                          placeholder={`${colNumber}-ustun nomi`}
                          className="flex-1 px-3 py-1.5 bg-white border border-sky-300 rounded-lg text-sky-950 text-xs placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-medium"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveColumn(idx, 'up')}
                            className="p-1 text-sky-900 hover:bg-sky-200 rounded disabled:opacity-20 cursor-pointer"
                            title="Yuqoriga surish"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === customColumns.length - 1}
                            onClick={() => handleMoveColumn(idx, 'down')}
                            className="p-1 text-sky-900 hover:bg-sky-200 rounded disabled:opacity-20 cursor-pointer"
                            title="Pastga surish"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(idx)}
                            className="p-1 text-sky-900 hover:text-red-700 hover:bg-sky-200 rounded cursor-pointer"
                            title="Ustunni o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submit */}
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
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>O'zgarishlarni saqlash</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
