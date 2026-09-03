import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Table as TableIcon, CheckCircle2, AlertCircle, Sparkles, Plus } from 'lucide-react';
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
  
  // Foydalanuvchi qo'shadigan custom columnlar soni (3-ustundan boshlab) - default 1 ta
  const [customColumnCount, setCustomColumnCount] = useState<number>(1);
  
  // Custom columnlar nomlari (3-ustun, 4-ustun...)
  const [customColumnNames, setCustomColumnNames] = useState<string[]>(['']);
  
  const [error, setError] = useState('');

  // Sync customColumnNames array length whenever customColumnCount changes
  useEffect(() => {
    setCustomColumnNames((prev) => {
      const updated = [...prev];
      if (customColumnCount > updated.length) {
        while (updated.length < customColumnCount) {
          updated.push('');
        }
      } else if (customColumnCount < updated.length) {
        return updated.slice(0, customColumnCount);
      }
      return updated;
    });
  }, [customColumnCount]);

  const handleColumnCountChange = (count: number) => {
    const valid = Math.max(1, Math.min(20, count || 1));
    setCustomColumnCount(valid);
  };

  const handleColumnNameChange = (index: number, val: string) => {
    setCustomColumnNames((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handlePresetSelect = (preset: { name: string; customCols: string[] }) => {
    setTableName(preset.name);
    setCustomColumnCount(preset.customCols.length);
    setCustomColumnNames(preset.customCols);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Jadval nomi - majburiy tekshiruvi
    if (!tableName.trim()) {
      setError("Jadval nomi majburiy! Iltimos, jadval nomini kiriting.");
      return;
    }

    // 1-ustun (№) va 2-ustun (Sana va vaqt) doimiy tizim ustunlari sifatida avtomatik qo'shiladi
    const finalColumns: ColumnDefinition[] = [
      {
        id: 'c1',
        key: 'c1',
        name: '№',
      },
      {
        id: 'c2',
        key: 'c2',
        name: 'Sana va vaqt',
      },
    ];

    // 3-ustundan boshlab foydalanuvchi kiritgan columnlar qo'shiladi
    const count = Math.max(1, customColumnCount || 1);
    for (let i = 0; i < count; i++) {
      const rawName = customColumnNames[i]?.trim();
      const colIndex = i + 3; // 3, 4, 5...
      const resolvedName =
        rawName && rawName.length > 0
          ? rawName
          : count === 1
          ? 'nomsiz'
          : `nomsiz ${i + 1}`;

      finalColumns.push({
        id: `c${colIndex}`,
        key: `c${colIndex}`,
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
      rows: [],
    };

    onTableCreated(newTable);
    
    // Reset form
    setTableName('');
    setCustomColumnCount(1);
    setCustomColumnNames(['']);
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
                <TableIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-sky-950 font-mono">Yangi Jadval Yaratish</h2>
                <p className="text-xs text-sky-900 font-medium">Jadval parametrlari va ustunlari</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-sky-900 hover:bg-sky-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                id="create-table-name-input"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Masalan: Ombor qoldiqlari, Buyurtmalar ro'yxati..."
                className="w-full px-4 py-2.5 bg-sky-50/50 border border-sky-300 rounded-xl text-sky-950 placeholder-sky-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono font-medium"
                autoFocus
              />
            </div>

            {/* Presets */}
            <div>
              <div className="text-[11px] font-bold text-sky-950 mb-1.5 flex items-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                <span>Tezkor andozalar:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {[
                  { name: 'Ombor Mahsulotlari', customCols: ['Mahsulot nomi', 'Miqdori', 'Narxi', 'Holati'] },
                  { name: 'Kunlik Savdolar', customCols: ['Mijoz', 'Mahsulot', 'Summa', 'To\'lov turi'] },
                  { name: 'Xodimlar Ro\'yxati', customCols: ['F.I.SH', 'Lavozimi', 'Bo\'lim', 'Maoshi'] },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="px-2.5 py-1 text-xs bg-white hover:bg-sky-100 text-sky-950 rounded-lg border border-sky-300 transition cursor-pointer font-bold"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ustunlar soni */}
            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 font-mono">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-sky-700" />
                  <span>Ustunlar soni (3-ustundan boshlab)</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="create-table-column-count-input"
                  type="number"
                  min="1"
                  max="20"
                  value={customColumnCount}
                  onChange={(e) => handleColumnCountChange(parseInt(e.target.value, 10))}
                  className="w-24 px-3 py-2 bg-white border border-sky-300 rounded-xl text-sky-950 font-mono text-center text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleColumnCountChange(num)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg font-mono transition cursor-pointer font-bold ${
                        customColumnCount === num
                          ? 'bg-sky-600 text-white border border-sky-700 shadow-xs'
                          : 'bg-white text-sky-900 hover:bg-sky-100 border border-sky-300'
                      }`}
                    >
                      +{num} ta
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ustun nomlari */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-sky-950 uppercase tracking-wider font-mono">
                  Ustun nomlari (3-ustundan boshlab)
                </label>
              </div>

              <div className="max-h-56 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar font-mono">
                {Array.from({ length: customColumnCount }).map((_, idx) => {
                  const colNumber = idx + 3;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-xs font-mono text-sky-900 font-black shrink-0">
                        c{colNumber}
                      </div>
                      <input
                        id={`create-column-name-${colNumber}`}
                        type="text"
                        value={customColumnNames[idx] || ''}
                        onChange={(e) => handleColumnNameChange(idx, e.target.value)}
                        placeholder={`${colNumber}-ustun nomi`}
                        className="flex-1 px-3 py-2 bg-white border border-sky-300 rounded-xl text-sky-950 placeholder-sky-400 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono font-medium"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Jadval yaratish tugmasi */}
            <div className="pt-3 border-t border-sky-200 flex items-center justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-sky-900 hover:bg-sky-100 transition cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                id="create-table-submit-button"
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs border border-sky-700 flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Jadval yaratish</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
