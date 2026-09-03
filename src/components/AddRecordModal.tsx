import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { UserTable, TableRowData } from '../types';
import { getFormattedDateTime } from '../utils/storage';

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
  // Active table selector
  const [activeTableId, setActiveTableId] = useState<string>('');
  
  // Custom column values state (c3, c4, etc.)
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

  // Reset input fields when table changes or modal opens
  useEffect(() => {
    if (currentTable) {
      const initial: Record<string, string> = {};
      currentTable.columns.forEach((col, idx) => {
        if (idx >= 2) {
          initial[col.key] = '';
        }
      });
      setColumnValues(initial);
      setError('');
    }
  }, [currentTable?.id, isOpen]);

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

    // 1-ustun (№): Avtomatik tartib raqam
    // 2-ustun (Sana va vaqt): Avtomatik joriy sana va soat
    // 3-ustun va undan keyingilari: Foydalanuvchi kiritgan qiymat
    const finalValues: Record<string, string> = {};
    const autoSeq = (currentTable.rows.length + 1).toString();
    const autoDateTime = getFormattedDateTime();

    currentTable.columns.forEach((col, idx) => {
      if (idx === 0) {
        finalValues[col.key] = autoSeq;
      } else if (idx === 1) {
        finalValues[col.key] = autoDateTime;
      } else {
        const entered = (columnValues[col.key] || '').trim();
        finalValues[col.key] = entered.length > 0 ? entered : 'nomsiz';
      }
    });

    const newRow: TableRowData = {
      id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      values: finalValues,
    };

    onRecordAdded(currentTable.id, newRow);

    // Reset fields
    const reset: Record<string, string> = {};
    currentTable.columns.forEach((col, idx) => {
      if (idx >= 2) reset[col.key] = '';
    });
    setColumnValues(reset);
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
          className="w-full max-w-lg bg-white border border-sky-300 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sky-200 bg-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center border border-sky-700">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-sky-950 font-mono">Yangi Yozuv Qo'shish</h2>
                <p className="text-xs text-sky-900 font-medium">Jadvalga yangi qator kiritish</p>
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

            {/* Target table selector (if multiple tables) */}
            <div>
              <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider mb-1.5 font-mono">
                Jadvalni tanlang
              </label>
              <select
                id="add-record-table-select"
                value={activeTableId}
                onChange={(e) => setActiveTableId(e.target.value)}
                className="w-full px-4 py-2.5 bg-sky-50/50 border border-sky-300 rounded-xl text-sky-950 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white text-sky-950">
                    {t.name} ({t.rows.length} ta yozuv)
                  </option>
                ))}
              </select>
            </div>

            {/* Auto System Columns Notice */}
            <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 space-y-2 font-mono">
              <div className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                <span>Avtomatik shakllanadigan tizim ustunlari:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-950 font-medium">
                  <span className="text-[10px] text-sky-800 block font-bold">1-ustun (№):</span>
                  <strong>#{(currentTable?.rows.length || 0) + 1}</strong> (Avtomatik tartib)
                </div>
                <div className="p-2 bg-white rounded-lg border border-sky-200 text-sky-950 font-medium">
                  <span className="text-[10px] text-sky-800 block font-bold">2-ustun (Sana & Vaqt):</span>
                  <strong>{getFormattedDateTime()}</strong>
                </div>
              </div>
            </div>

            {/* User Custom Columns Input Form */}
            <div>
              <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider mb-2 font-mono">
                Ustunlar qiymatlari (3-ustundan boshlab)
              </label>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {currentTable?.columns.slice(2).length === 0 ? (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-center text-xs text-sky-900 font-bold">
                    Ushbu jadvalda faqat tizim ustunlari mavjud.
                  </div>
                ) : (
                  currentTable?.columns.slice(2).map((col, idx) => {
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
                          id={`add-record-input-${col.key}`}
                          type="text"
                          value={columnValues[col.key] || ''}
                          onChange={(e) => handleValueChange(col.key, e.target.value)}
                          placeholder={`"${col.name}" qiymati... (bo'sh qolsa "nomsiz")`}
                          className="w-full px-3 py-2 bg-white border border-sky-300 rounded-lg text-sky-950 placeholder-sky-400 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono font-medium"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-sky-200 flex items-center justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-sky-900 hover:bg-sky-100 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                id="add-record-submit-btn"
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs border border-sky-700 flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Yozuvni saqlash</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
