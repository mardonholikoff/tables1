import React, { useState, useMemo } from 'react';
import {
  Activity,
  User,
  Clock,
  Search,
  Filter,
  Shield,
  FileSpreadsheet,
  PlusCircle,
  Edit3,
  Trash2,
  Download,
  LogIn,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { ActivityLog } from '../types';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<'all' | 'daewoouser' | 'admindw'>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // User filter
      if (selectedUserFilter !== 'all') {
        if (log.username !== selectedUserFilter) return false;
      }

      // Action type filter
      if (selectedActionFilter !== 'all') {
        if (log.actionType !== selectedActionFilter) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = log.actionTitle?.toLowerCase().includes(query);
        const matchesDetails = log.details?.toLowerCase().includes(query);
        const matchesTable = log.tableName?.toLowerCase().includes(query);
        const matchesUser = log.username?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDetails && !matchesTable && !matchesUser) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchTerm, selectedUserFilter, selectedActionFilter]);

  if (!isOpen) return null;

  const getActionBadge = (actionType: ActivityLog['actionType']) => {
    switch (actionType) {
      case 'create_table':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Layers className="w-3 h-3 text-blue-400" />
            Jadval yaratildi
          </span>
        );
      case 'add_row':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <PlusCircle className="w-3 h-3 text-emerald-400" />
            Qator qo'shildi
          </span>
        );
      case 'edit_row':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Edit3 className="w-3 h-3 text-amber-400" />
            Tahrirlandi
          </span>
        );
      case 'delete_row':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <Trash2 className="w-3 h-3 text-rose-400" />
            Qator o'chirildi
          </span>
        );
      case 'delete_table':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600/20 text-red-300 border border-red-500/40">
            <Trash2 className="w-3 h-3 text-red-400" />
            Jadval o'chirildi
          </span>
        );
      case 'clear_all':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <AlertTriangle className="w-3 h-3 text-purple-400" />
            Barcha jadvallar tozalash
          </span>
        );
      case 'export_csv':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Download className="w-3 h-3 text-cyan-400" />
            CSV Eksport
          </span>
        );
      case 'login':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <LogIn className="w-3 h-3 text-indigo-400" />
            Tizimga kirish
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Amal
          </span>
        );
    }
  };

  const daewooUserCount = logs.filter((l) => l.username === 'daewoouser').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Foydalanuvchi Amallari Tarixi (Audit Log)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                  AdminDW Nazorati
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong>daewoouser</strong> hisobining saytda amalga oshirgan barcha real vaqt amallari xronologiyasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Amal nomi, jadval yoki tafsilot bo'yicha qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* User Filter */}
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Barcha foydalanuvchilar</option>
              <option value="daewoouser">daewoouser ({daewooUserCount})</option>
              <option value="admindw">admindw</option>
            </select>

            {/* Action Type Filter */}
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Barcha amal turlari</option>
              <option value="create_table">Jadval yaratish</option>
              <option value="add_row">Qator qo'shish</option>
              <option value="edit_row">Tahrirlash</option>
              <option value="delete_row">Qator o'chirish</option>
              <option value="delete_table">Jadval o'chirish</option>
              <option value="clear_all">Tozalash</option>
              <option value="login">Kirish (Login)</option>
            </select>
          </div>
        </div>

        {/* Logs Table / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Hozircha amallar logi mavjud emas</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Foydalanuvchi jadvallarga ma'lumot kiritganda, tahrirlaganda yoki tizimga kirganda barcha amallar bu yerda xronologik tartibda aks etadi.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const formattedTime = dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const formattedDate = dateObj.toLocaleDateString('uz-UZ');

                return (
                  <div
                    key={log.id}
                    className="p-3.5 sm:p-4 bg-slate-950/70 border border-slate-800/90 rounded-2xl hover:border-slate-700/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getActionBadge(log.actionType)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-white">
                            {log.actionTitle}
                          </span>
                          {log.tableName && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                              {log.tableName}
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0 sm:border-l sm:border-slate-800 sm:pl-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className={log.username === 'daewoouser' ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                          {log.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formattedDate} {formattedTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Jami qaydlar: <strong className="text-white">{filteredLogs.length}</strong> / {logs.length}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Firebase Firestore orqali sinxronlangan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
