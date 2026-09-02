import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Columns, Table as TableIcon, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { UserTable, ColumnDefinition } from '../types';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableCreated: (newTable: UserTable) => void;
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  onTableCreated,
}) => {
  // Jadval nomi - majburiy
  const [tableName, setTableName] = useState('');
  
  // Jadval ustidagi columnlar soni - default 1 ta
  const [columnCount, setColumnCount] = useState<number>(1);
  
  // Columnlar nomlari - default tanlanmasa "nomsiz" bo'ladi
  const [columnNames, setColumnNames] = useState<string[]>(['']);
  
  const [error, setError] = useState('');

  // Sync columnNames array length whenever columnCount changes
  useEffect(() => {
    setColumnNames((prev) => {
      const updated = [...prev];
      if (columnCount > updated.length) {
        while (updated.length < columnCount) {
          updated.push('');
        }
      } else if (columnCount < updated.length) {
        return updated.slice(0, columnCount);
      }
      return updated;
    });
  }, [columnCount]);

  const handleColumnCountChange = (count: number) => {
    const valid = Math.max(1, Math.min(20, count || 1));
    setColumnCount(valid);
  };

  const handleColumnNameChange = (index: number, val: string) => {
    setColumnNames((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handlePresetSelect = (preset: { name: string; cols: string[] }) => {
    setTableName(preset.name);
    setColumnCount(preset.cols.length);
    setColumnNames(preset.cols);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Jadval nomi - majburiy tekshiruvi
    if (!tableName.trim()) {
      setError("Jadval nomi majburiy! Iltimos, jadval nomini kiriting.");
      return;
    }

    // Columnlar nomlarini tekshirish va default "nomsiz" qo'yish
    const finalColumns: ColumnDefinition[] = [];
    const count = Math.max(1, columnCount || 1);

    for (let i = 0; i < count; i++) {
      const rawName = columnNames[i]?.trim();
      // Agar nom yozilmagan bo'lsa default "nomsiz" (agar bir nechta bo'lsa nomsiz, nomsiz 2...)
      const resolvedName = rawName && rawName.length > 0 ? rawName : (i === 0 ? 'nomsiz' : `nomsiz ${i + 1}`);
      
      finalColumns.push({
        id: `c${i + 1}`,
        key: `c${i + 1}`,
        name: resolvedName,
      });
    }

    const tableId = 'tbl_' + Date.now();
    const newTable: UserTable = {
      id: tableId,
      name: tableName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: finalColumns,
      rows: [], // starts empty for new table
    };

    onTableCreated(newTable);
    
    // Reset form
    setTableName('');
    setColumnCount(1);
    setColumnNames(['']);
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
          className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <TableIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Yangi Jadval Yaratish</h2>
                <p className="text-xs text-slate-400">Jadval tuzilishi va ustunlarini belgilang</p>
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

            {/* 1. Jadval nomi - MAJBURUY */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Jadval nomi <span className="text-rose-400 font-bold">* (Majburiy)</span>
              </label>
              <input
                id="create-table-name-input"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Masalan: Mahsulotlar ro'yxati, Mijozlar bazasi..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoFocus
              />
            </div>

            {/* Quick Presets helper */}
            <div>
              <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Tezkor tayyor andozalar:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Ombor Mahsulotlari', cols: ['Mahsulot kodi', 'Nomi', 'Miqdori', 'Narxi', 'Holati'] },
                  { name: 'Kunlik Savdolar', cols: ['Sana', 'Mijoz', 'Mahsulot', 'Summa', 'To\'lov turi'] },
                  { name: 'Xodimlar Ro\'yxati', cols: ['F.I.SH', 'Lavozimi', 'Bo\'lim', 'Maoshi', 'Telefon'] },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Columnlar sonini tanlash - default tanlamasa 1 ta bo'ladi */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Columns className="w-4 h-4 text-blue-400" />
                  <span>Columnlar sonini tanlash</span>
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  (tanlanmasa: default <strong className="text-blue-400">1 ta</strong>)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="create-table-column-count-input"
                  type="number"
                  min="1"
                  max="20"
                  value={columnCount}
                  onChange={(e) => handleColumnCountChange(parseInt(e.target.value, 10))}
                  className="w-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleColumnCountChange(num)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                        columnCount === num
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {num} ta
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Columnlar nomlarini yozish - default tanlanmasa "nomsiz" bo'lib qoladi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Columnlar nomlarini yozish ({columnCount} ta)
                </label>
                <span className="text-[11px] text-slate-400">
                  Bo'sh qoldirilsa: default <span className="text-amber-400 font-mono">"nomsiz"</span>
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                {Array.from({ length: columnCount }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono text-blue-400 shrink-0">
                      c{idx + 1}
                    </div>
                    <input
                      id={`create-column-name-${idx + 1}`}
                      type="text"
                      value={columnNames[idx] || ''}
                      onChange={(e) => handleColumnNameChange(idx, e.target.value)}
                      placeholder={`Column ${idx + 1} nomi (bo'sh bo'lsa: nomsiz)`}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Jadval yaratish tugmasi oxirida */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                id="create-table-submit-button"
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Jadval yaratish</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
