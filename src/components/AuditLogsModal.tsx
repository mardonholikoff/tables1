import React, { useState, useMemo } from 'react';
import {
  Activity,
  User,
  Clock,
  Search,
  Shield,
  PlusCircle,
  Edit3,
  Trash2,
  Download,
  LogIn,
  Layers,
  X,
  Globe,
} from 'lucide-react';
import { ActivityLog } from '../types';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  currentIp?: string;
  isAdmindw?: boolean;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  currentIp,
  isAdmindw = true,
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
        const matchesIp = log.ipAddress?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDetails && !matchesTable && !matchesUser && !matchesIp) {
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 font-mono">
            <Layers className="w-3 h-3 text-sky-700" />
            Jadval yaratildi
          </span>
        );
      case 'add_row':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 font-mono">
            <PlusCircle className="w-3 h-3 text-sky-700" />
            Qator qo'shildi
          </span>
        );
      case 'edit_row':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 font-mono">
            <Edit3 className="w-3 h-3 text-sky-700" />
            Tahrirlandi
          </span>
        );
      case 'delete_row':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300 font-mono">
            <Trash2 className="w-3 h-3 text-red-700" />
            Qator o'chirildi
          </span>
        );
      case 'delete_table':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white border border-red-700 font-mono">
            <Trash2 className="w-3 h-3 text-white" />
            Jadval o'chirildi
          </span>
        );
      case 'export_excel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
            <Download className="w-3 h-3 text-emerald-700" />
            Excel Eksport
          </span>
        );
      case 'login':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-600 text-white border border-sky-700 font-mono">
            <LogIn className="w-3 h-3 text-white" />
            Tizimga kirish
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 font-mono">
            <Activity className="w-3 h-3" />
            Boshqa amal
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200 font-mono text-sky-950">
      <div className="bg-white border border-sky-300 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-5 bg-sky-50 border-b border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center border border-sky-700">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-sky-950 tracking-tight font-mono">
                  Audit Jurnali & Harakatlar Tarixi
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                  {logs.length} ta yozuv
                </span>
              </div>
              <p className="text-xs text-sky-900 font-medium">
                Kim qachon nima amal bajarganini kuzatish tizimi (daewoouser & admindw)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-sky-900 hover:bg-sky-200 rounded-xl transition cursor-pointer self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-sky-50/50 border-b border-sky-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-700 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Amal, jadval nomi, IP manzil yoki matn bo'yicha qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-medium"
            />
          </div>

          {/* User Selector Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
            >
              <option value="all">Barcha foydalanuvchilar</option>
              <option value="daewoouser">daewoouser (Boshqaruvchi)</option>
              <option value="admindw">admindw (Nazoratchi)</option>
            </select>

            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
            >
              <option value="all">Barcha amallar</option>
              <option value="create_table">Jadval yaratish</option>
              <option value="add_row">Qator qo'shish</option>
              <option value="edit_row">Tahrirlash</option>
              <option value="delete_row">Qator o'chirish</option>
              <option value="delete_table">Jadval o'chirish</option>
              <option value="export_excel">Excel Eksport</option>
              <option value="login">Tizimga kirish</option>
            </select>
          </div>
        </div>

        {/* Logs Table / Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Activity className="w-10 h-10 text-sky-400 mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-sky-950 mb-1 font-mono">
                Mos keluvchi audit yozuvi topilmadi
              </h4>
              <p className="text-xs text-sky-900 max-w-xs font-medium">
                Qidiruv so'zini yoki filtrlarni tozalab ko'ring.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-white border border-sky-200 hover:border-sky-400 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.actionType)}

                    {log.tableName && (
                      <span className="text-xs font-bold text-sky-950 px-2 py-0.5 rounded bg-sky-50 border border-sky-200">
                        {log.tableName}
                      </span>
                    )}

                    <span className="text-xs font-bold text-sky-950 font-mono">
                      {log.actionTitle}
                    </span>
                  </div>

                  <p className="text-xs text-sky-950 pl-0.5 font-mono font-medium">
                    {log.details}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-sky-100 font-mono text-xs gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-sky-950">
                    <User className="w-3.5 h-3.5 text-sky-700" />
                    <span>{log.username}</span>
                  </div>

                  {/* IP Address badge for admindw */}
                  {isAdmindw && (
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
                      <Globe className="w-3 h-3 text-sky-700 shrink-0" />
                      <span>IP: {log.ipAddress || currentIp || '195.158.30.12'}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-sky-900 font-medium">
                    <Clock className="w-3 h-3 text-sky-700" />
                    <span>
                      {new Date(log.timestamp).toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      , {new Date(log.timestamp).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-sky-50 border-t border-sky-200 flex items-center justify-between text-xs text-sky-950 font-mono font-medium">
          <div>
            Ko'rsatilmoqda: <strong className="text-sky-950 font-bold">{filteredLogs.length}</strong> / {logs.length} harakat
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold transition cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
