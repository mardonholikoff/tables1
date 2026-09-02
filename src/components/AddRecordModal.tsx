import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, FileSpreadsheet, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { UserTable, TableRowData } from '../types';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: UserTable[];
  selectedTableId?: string;
  onRecordAdded: (tableId: string, row: TableRowData) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  tables,
  selectedTableId,
  onRecordAdded,
}) => {
  // 1. Select table from dropdown menu
  const [activeTableId, setActiveTableId] = useState<string>('');
  
  // Dynamic column inputs state (key -> value)
  const [columnValues, setColumnValues] = useState<Record<string, string>>({});
  
  const [error, setError] = useState('');

  // Find currently active table
  const currentTable = tables.find((t) => t.id === activeTableId) || tables[0];

  useEffect(() => {
    if (selectedTableId && tables.some((t) => t.id === selectedTableId)) {
      setActiveTableId(selectedTableId);
    } else if (tables.length > 0 && !activeTableId) {
      setActiveTableId(tables[0].id);
    }
  }, [selectedTableId, tables, activeTableId]);

  // Reset/initialize column input values whenever active table changes
  useEffect(() => {
    if (currentTable) {
      const initial: Record<string, string> = {};
      currentTable.columns.forEach((col) => {
        initial[col.key] = '';
      });
      setColumnValues(initial);
      setError('');
    }
  }, [currentTable?.id]);

  const handleValueChange = (colKey: string, val: string) => {
    setColumnValues((prev) => ({
      ...prev,
      [colKey]: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentTable) {
      setError('Iltimos, avval jadvalni tanlang yoki yarating.');
      return;
    }

    // Default to "nomsiz" if left blank as explicitly instructed: "ularni to'ldirmasa default nomsiz bo'lib qoladi"
    const finalValues: Record<string, string> = {};
    currentTable.columns.forEach((col) => {
      const entered = (columnValues[col.key] || '').trim();
      finalValues[col.key] = entered.length > 0 ? entered : 'nomsiz';
    });

    const newRow: TableRowData = {
      id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      values: finalValues,
    };

    onRecordAdded(currentTable.id, newRow);

    // Reset input fields
    const reset: Record<string, string> = {};
    currentTable.columns.forEach((col) => {
      reset[col.key] = '';
    });
    setColumnValues(reset);
    onClose();
  };

  if (!isOpen) return null;

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
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Yangi Yozuv Qo'shish</h2>
                <p className="text-xs text-slate-400">Tanlangan jadvalga qator ma'lumotlarini kiritish</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Mavjud jadvallardan birini tanlash (Select Menu) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>1. Mavjud Jadvalni Tanlang</span>
                <span className="text-[11px] text-blue-400 font-normal">
                  Jami: {tables.length} ta jadval
                </span>
              </label>

              {tables.length === 0 ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                  Hozircha hech qanday jadval mavjud emas. Avval jadval yarating.
                </div>
              ) : (
                <select
                  id="add-record-table-select"
                  value={activeTableId || (currentTable ? currentTable.id : '')}
                  onChange={(e) => setActiveTableId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition"
                >
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id} className="bg-slate-900 text-white py-2">
                      {tbl.name} ({tbl.columns.length} ta ustun, {tbl.rows.length} ta qator)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Jadvalning har bir columni uchun alohida form maydoni */}
            {currentTable && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    2. Jadval Ustunlari ({currentTable.columns.length} ta)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Bo'sh qolsa: default <span className="text-amber-400 font-mono">"nomsiz"</span>
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {currentTable.columns.map((col, idx) => (
                    <div key={col.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-200">
                          {col.name}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                          {col.key} (ustun #{idx + 1})
                        </span>
                      </div>
                      <input
                        id={`add-record-column-${col.key}`}
                        type="text"
                        value={columnValues[col.key] || ''}
                        onChange={(e) => handleValueChange(col.key, e.target.value)}
                        placeholder={`"${col.name}" qiymatini kiriting (bo'sh qolsa: nomsiz)`}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                id="add-record-submit-button"
                type="submit"
                disabled={!currentTable}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yozuvni qo'shish</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
