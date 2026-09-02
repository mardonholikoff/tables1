import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Columns,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { UserTable, ColumnDefinition } from '../types';

interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: UserTable;
  onSave: (updatedTable: UserTable, changeSummary: string) => void;
}

interface EditableColumn {
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
  const [columns, setColumns] = useState<EditableColumn[]>([]);
  const [error, setError] = useState('');

  // Synchronize when table opens/changes
  useEffect(() => {
    if (table) {
      setTableName(table.name);
      setColumns(
        table.columns.map((c) => ({
          id: c.id,
          key: c.key,
          name: c.name,
        }))
      );
      setError('');
    }
  }, [table, isOpen]);

  const handleColumnNameChange = (index: number, newName: string) => {
    setColumns((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const handleAddColumn = () => {
    if (columns.length >= 30) {
      setError("Ustunlar soni ko'pi bilan 30 tagacha bo'lishi mumkin.");
      return;
    }
    const newId = `col_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newColNumber = columns.length + 1;
    const newCol: EditableColumn = {
      id: newId,
      key: newId,
      name: `nomsiz ${newColNumber}`,
      isNew: true,
    };
    setColumns((prev) => [...prev, newCol]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) {
      setError("Jadvalda kamida 1 ta ustun bo'lishi shart!");
      return;
    }
    setColumns((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    setColumns((prev) => {
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

    const trimmedName = tableName.trim();
    if (!trimmedName) {
      setError("Jadval nomi majburiy! Iltimos, jadval nomini kiriting.");
      return;
    }

    if (columns.length === 0) {
      setError("Jadvalda kamida 1 ta ustun bo'lishi kerak!");
      return;
    }

    // Finalize columns: sanitize empty names to 'nomsiz'
    const finalColumns: ColumnDefinition[] = columns.map((col, idx) => {
      const raw = col.name.trim();
      const resolvedName = raw.length > 0 ? raw : idx === 0 ? 'nomsiz' : `nomsiz ${idx + 1}`;
      return {
        id: col.id,
        key: col.key,
        name: resolvedName,
      };
    });

    // Determine what changed for the audit log summary
    const nameChanged = trimmedName !== table.name;
    const addedColumnsCount = finalColumns.filter(
      (fc) => !table.columns.some((tc) => tc.key === fc.key)
    ).length;
    const removedColumnsCount = table.columns.filter(
      (tc) => !finalColumns.some((fc) => fc.key === tc.key)
    ).length;
    const renamedColumns = finalColumns.filter((fc) => {
      const original = table.columns.find((tc) => tc.key === fc.key);
      return original && original.name !== fc.name;
    });

    const changeNotes: string[] = [];
    if (nameChanged) {
      changeNotes.push(`Nomi: "${table.name}" → "${trimmedName}"`);
    }
    if (addedColumnsCount > 0) {
      changeNotes.push(`${addedColumnsCount} ta yangi ustun qo'shildi`);
    }
    if (removedColumnsCount > 0) {
      changeNotes.push(`${removedColumnsCount} ta ustun o'chirildi`);
    }
    if (renamedColumns.length > 0) {
      changeNotes.push(
        `Ustunlar qayta nomlandi: ${renamedColumns.map((r) => `"${r.name}"`).join(', ')}`
      );
    }

    // Clean up rows if columns were removed
    const validKeys = new Set(finalColumns.map((c) => c.key));
    const updatedRows = table.rows.map((row) => {
      const newValues: Record<string, string> = {};
      finalColumns.forEach((col) => {
        newValues[col.key] = row.values[col.key] || '';
      });
      return {
        ...row,
        values: newValues,
      };
    });

    const updatedTable: UserTable = {
      ...table,
      name: trimmedName,
      updatedAt: new Date().toISOString(),
      columns: finalColumns,
      rows: updatedRows,
    };

    const summaryText =
      changeNotes.length > 0
        ? changeNotes.join('; ')
        : "Jadval parametrlari yangilandi";

    onSave(updatedTable, summaryText);
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
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Jadvalni Tahrirlash</h2>
                <p className="text-xs text-slate-400">
                  Jadval nomi, ustunlar nomlari va yangi ustunlarni boshqarish
                </p>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Table Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Jadval nomi <span className="text-rose-400 font-bold">* (Majburiy)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Jadval nomini kiriting..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Jadval nomini o'zgartirsangiz, barcha hisobotlar va tahlillar yangi nom bilan ko'rsatiladi.
              </p>
            </div>

            {/* 2. Column Management */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Jadval Ustunlari ({columns.length} ta)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Ustun nomlarini tahrirlang, tartibini o'zgartiring yoki yangi ustun qo'shing
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yangi ustun qo'shish</span>
                </button>
              </div>

              {/* Columns list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {columns.map((col, index) => (
                  <div
                    key={col.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
                      col.isNew
                        ? 'bg-indigo-950/30 border-indigo-500/40'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    {/* Index badge */}
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>

                    {/* Column name input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => handleColumnNameChange(index, e.target.value)}
                        placeholder={`Ustun #${index + 1} nomi (default: nomsiz)`}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {col.isNew && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        Yangi
                      </span>
                    )}

                    {/* Move Up/Down Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition cursor-pointer"
                        title="Yuqoriga surish"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(index, 'down')}
                        disabled={index === columns.length - 1}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition cursor-pointer"
                        title="Pastga surish"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete Column button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(index)}
                      disabled={columns.length <= 1}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 disabled:opacity-30 disabled:hover:bg-transparent rounded-md transition cursor-pointer shrink-0"
                      title={
                        columns.length <= 1
                          ? "Kamida bitta ustun qolishi kerak"
                          : "Ushbu ustunni o'chirish"
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add column bottom button */}
              <button
                type="button"
                onClick={handleAddColumn}
                className="w-full mt-2.5 py-2 px-3 border border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Yana yangi ustun qo'shish</span>
              </button>
            </div>

            {/* Explanatory Info Card */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Muhim ma'lumot:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>
                  Mavjud ustun nomlarini o'zgartirsangiz, barcha yozuvlardagi qiymatlar to'liq saqlanib qoladi.
                </li>
                <li>
                  Yangi ustun qo'shsangiz, mavjud qatorlarda yangi ustun bo'sh bo'ladi va uni xohlagan payt tahrirlash mumkin.
                </li>
                <li>
                  Barcha o'zgarishlar Google Firebase va mahalliy xotirada darhol yangilanadi hamda audit logida qayd etiladi.
                </li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>O'zgarishlarni saqlash</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
