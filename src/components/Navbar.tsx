import React from 'react';
import {
  Plus,
  Table as TableIcon,
  BarChart3,
  LogOut,
  LayoutGrid,
  Columns2,
  FileSpreadsheet,
  Database,
  Trash2,
  WifiOff,
  RefreshCw,
  Download,
  Cloud,
  Shield,
  Activity,
} from 'lucide-react';
import { AuthUser, ViewMode } from '../types';
import { SyncStatus } from '../firebase/config';

interface NavbarProps {
  user: AuthUser;
  onLogout: () => void;
  onOpenCreateTable: () => void;
  onOpenAddRecord: () => void;
  onClearAllTables?: () => void;
  onOpenAuditLogs?: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasTables: boolean;
  syncStatus?: SyncStatus;
  isInstallable?: boolean;
  onInstallPWA?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenCreateTable,
  onOpenAddRecord,
  onClearAllTables,
  onOpenAuditLogs,
  viewMode,
  onViewModeChange,
  hasTables,
  syncStatus,
  isInstallable,
  onInstallPWA,
}) => {
  const isOnline = syncStatus ? syncStatus.isOnline : navigator.onLine;
  const hasPendingWrites = syncStatus?.hasPendingWrites;
  const isReadOnly = user.role === 'viewer';

  return (
    <header className="sticky top-0 z-30 bg-[#e0f0fe]/95 backdrop-blur-xl border-b border-sky-200 shadow-sm font-mono text-sky-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand & Status */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-105 border border-sky-500">
                <Database className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sky-950 tracking-widest text-lg font-mono">
                  DAEWOO
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold bg-sky-200 text-sky-900 border border-sky-300 rounded-md font-mono">
                  PRO
                </span>
              </div>
            </div>

            {/* Offline / Cloud Firebase Sync Status Badge */}
            <div className="hidden sm:flex items-center">
              {!isOnline ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-200 text-sky-950 border border-sky-300 text-[11px] font-bold font-mono"
                  title="Internet yo'q. Barcha o'zgarishlar qurilmada saqlanmoqda."
                >
                  <WifiOff className="w-3.5 h-3.5 text-sky-900 animate-pulse" />
                  <span>Offlayn</span>
                </div>
              ) : hasPendingWrites ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-200 text-sky-950 border border-sky-300 text-[11px] font-bold font-mono"
                  title="O'zgarishlar Firebase bazasiga yuklanmoqda..."
                >
                  <RefreshCw className="w-3 h-3 text-sky-800 animate-spin" />
                  <span>Sinxronlanmoqda...</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-sky-900 border border-sky-300 text-[11px] font-bold shadow-xs font-mono"
                  title="Google Firebase Firestore bilan to'liq sinxronlangan"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                  <Cloud className="w-3 h-3 text-sky-700" />
                  <span>Firebase Jonli</span>
                </div>
              )}
            </div>
          </div>

          {/* View mode switcher (if tables exist) */}
          {hasTables && (
            <div className="hidden md:flex items-center p-1 bg-sky-200/80 rounded-xl border border-sky-300 text-xs shadow-xs font-mono">
              <button
                id="view-mode-split"
                onClick={() => onViewModeChange('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition duration-150 cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-sky-950 shadow-xs border border-sky-300'
                    : 'text-sky-900 hover:bg-sky-100'
                }`}
                title="Jadval va Dashboard yonma-yon"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Yonma-yon</span>
              </button>

              <button
                id="view-mode-table"
                onClick={() => onViewModeChange('table_only')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition duration-150 cursor-pointer ${
                  viewMode === 'table_only'
                    ? 'bg-white text-sky-950 shadow-xs border border-sky-300'
                    : 'text-sky-900 hover:bg-sky-100'
                }`}
                title="Faqat Jadval ko'rinishi"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Jadval</span>
              </button>

              <button
                id="view-mode-dashboard"
                onClick={() => onViewModeChange('dashboard_only')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition duration-150 cursor-pointer ${
                  viewMode === 'dashboard_only'
                    ? 'bg-white text-sky-950 shadow-xs border border-sky-300'
                    : 'text-sky-900 hover:bg-sky-100'
                }`}
                title="Faqat Dashboard ko'rinishi"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                id="view-mode-overview"
                onClick={() => onViewModeChange('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition duration-150 cursor-pointer ${
                  viewMode === 'overview'
                    ? 'bg-white text-sky-950 shadow-xs border border-sky-300'
                    : 'text-sky-900 hover:bg-sky-100'
                }`}
                title="Barcha jadvallar statistikasi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Umumiy</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 font-mono">
            {/* Audit Logs button for AdminDW only */}
            {isReadOnly && onOpenAuditLogs && (
              <button
                id="navbar-audit-logs-btn"
                onClick={onOpenAuditLogs}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-sky-50 text-sky-900 text-xs font-bold rounded-xl border border-sky-300 transition cursor-pointer shadow-xs"
                title="Foydalanuvchi (daewoouser) amallari audit loglari"
              >
                <Activity className="w-3.5 h-3.5 text-sky-700" />
                <span className="hidden sm:inline">Amallar Logi</span>
                <span className="sm:hidden">Loglar</span>
              </button>
            )}

            {/* PWA Install Button */}
            {isInstallable && onInstallPWA && (
              <button
                onClick={onInstallPWA}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-sky-50 text-sky-900 text-xs font-bold rounded-xl border border-sky-300 transition cursor-pointer shadow-xs"
                title="Ilovani qurilmangizga o'rnatish (PWA)"
              >
                <Download className="w-3.5 h-3.5 text-sky-700" />
                <span className="hidden sm:inline">O'rnatish</span>
                <span className="sm:hidden">PWA</span>
              </button>
            )}

            {/* Non-ReadOnly Controls: Jadval yaratish & Yozuv qo'shish */}
            {!isReadOnly && (
              <>
                <button
                  id="navbar-create-table-btn"
                  onClick={onOpenCreateTable}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs border border-sky-700 transition duration-150 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Jadval yaratish</span>
                  <span className="sm:hidden">Jadval</span>
                </button>

                <button
                  id="navbar-add-record-btn"
                  onClick={onOpenAddRecord}
                  disabled={!hasTables}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition duration-150 cursor-pointer border ${
                    hasTables
                      ? 'bg-white hover:bg-sky-50 text-sky-900 border-sky-300 shadow-xs active:scale-95'
                      : 'bg-sky-100 text-sky-400 border-sky-200 cursor-not-allowed opacity-50'
                  }`}
                  title={!hasTables ? 'Avval jadval yarating' : 'Mavjud jadvalga yangi qator kiritish'}
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                  <span className="hidden sm:inline">Yozuv qo'shish</span>
                  <span className="sm:hidden">Yozuv</span>
                </button>

                {hasTables && onClearAllTables && (
                  <button
                    onClick={onClearAllTables}
                    className="hidden lg:flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-sky-900 hover:text-red-700 hover:bg-sky-200/80 rounded-xl border border-sky-300 transition cursor-pointer"
                    title="Barcha jadvallarni o'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tozalash</span>
                  </button>
                )}
              </>
            )}

            {/* Read-Only Badge for admindw */}
            {isReadOnly && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-900 text-xs font-mono font-bold">
                <Shield className="w-3.5 h-3.5 text-sky-700" />
                <span>Faqat ko'rish</span>
              </div>
            )}

            {/* User profile & Logout */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-sky-300">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-sky-950 leading-tight font-mono">
                  {user.username}
                </div>
                <div className="text-[10px] text-sky-700 font-bold font-mono">
                  {isReadOnly ? 'Nazoratchi' : 'Faol hisob'}
                </div>
              </div>

              <button
                id="navbar-logout-btn"
                onClick={onLogout}
                className="p-2 rounded-xl text-sky-900 hover:bg-sky-200 border border-transparent hover:border-sky-300 transition cursor-pointer"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-4 h-4 text-sky-900" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
