import React from 'react';
import {
  Plus,
  Table as TableIcon,
  BarChart3,
  LogOut,
  LayoutGrid,
  Columns2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Database,
  Trash2,
  Wifi,
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
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-blue-400/20 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg font-serif block">
                DAEWOO
              </span>
            </div>

            {/* Offline / Cloud Firebase Sync Status Badge */}
            <div className="hidden sm:flex items-center">
              {!isOnline ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-medium"
                  title="Internet yo'q. Barcha o'zgarishlar qurilmada xavfsiz saqlanmoqda va internet kelgach Firebase ga avtomatik tushadi."
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Offlayn rejim</span>
                </div>
              ) : hasPendingWrites ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-medium"
                  title="O'zgarishlar Firebase bazasiga yuklanmoqda..."
                >
                  <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                  <span>Sinxronlanmoqda...</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium"
                  title="Google Firebase Firestore bilan to'liq sinxronlangan"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Firebase Jonli</span>
                </div>
              )}
            </div>
          </div>

          {/* View mode switcher (if tables exist) */}
          {hasTables && (
            <div className="hidden md:flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
              <button
                id="view-mode-split"
                onClick={() => onViewModeChange('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Jadval va Dashboard yonma-yon"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Yonma-yon</span>
              </button>

              <button
                id="view-mode-table"
                onClick={() => onViewModeChange('table_only')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'table_only'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Faqat Jadval ko'rinishi"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Jadval</span>
              </button>

              <button
                id="view-mode-dashboard"
                onClick={() => onViewModeChange('dashboard_only')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'dashboard_only'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Faqat Dashboard ko'rinishi"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                id="view-mode-overview"
                onClick={() => onViewModeChange('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'overview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Barcha jadvallar statistikasi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Umumiy</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audit Logs button for AdminDW only */}
            {isReadOnly && onOpenAuditLogs && (
              <button
                id="navbar-audit-logs-btn"
                onClick={onOpenAuditLogs}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white text-xs font-semibold rounded-xl border border-indigo-500/40 transition cursor-pointer"
                title="Foydalanuvchi (daewoouser) amallari audit loglari"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Amallar Logi</span>
                <span className="sm:hidden">Loglar</span>
              </button>
            )}

            {/* PWA Install Button */}
            {isInstallable && onInstallPWA && (
              <button
                onClick={onInstallPWA}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                title="Ilovani qurilmangizga o'rnatish (PWA)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ilovani o'rnatish</span>
                <span className="sm:hidden">PWA</span>
              </button>
            )}

            {/* Non-ReadOnly Controls: Jadval yaratish & Yozuv qo'shish */}
            {!isReadOnly && (
              <>
                <button
                  id="navbar-create-table-btn"
                  onClick={onOpenCreateTable}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Jadval yaratish</span>
                  <span className="sm:hidden">Jadval</span>
                </button>

                <button
                  id="navbar-add-record-btn"
                  onClick={onOpenAddRecord}
                  disabled={!hasTables}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer border ${
                    hasTables
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={!hasTables ? 'Avval jadval yarating' : 'Mavjud jadvalga yangi qator kiritish'}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Yozuv qo'shish</span>
                  <span className="sm:hidden">Yozuv</span>
                </button>

                {hasTables && onClearAllTables && (
                  <button
                    onClick={onClearAllTables}
                    className="hidden lg:flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl border border-slate-800 hover:border-rose-900/50 transition cursor-pointer"
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
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Faqat ko'rish</span>
              </div>
            )}

            {/* User profile & Logout */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-white">
                  {user.username}
                </div>
                <div className="text-[10px] text-emerald-400">
                  {isReadOnly ? 'Nazoratchi' : 'Faol hisob'}
                </div>
              </div>

              <button
                id="navbar-logout-btn"
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 transition cursor-pointer"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

