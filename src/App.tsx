import React, { useState, useEffect, useMemo } from 'react';
import { AuthUser, UserTable, TableRowData, ViewMode, ColumnFilter, CellInspection, ActivityLog } from './types';
import { getSavedTables, saveTables, getSavedAuth, saveAuth, getFormattedDateTime } from './utils/storage';
import {
  subscribeToFirebaseTables,
  saveTableToFirebase,
  deleteTableFromFirebase,
  clearAllTablesFromFirebase,
  logActivityToFirebase,
  subscribeToFirebaseLogs,
  SyncStatus,
} from './firebase/config';
import { initPWAInstallPrompt, promptPWAInstall } from './utils/pwa';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { CreateTableModal } from './components/CreateTableModal';
import { EditTableModal } from './components/EditTableModal';
import { AddRecordModal } from './components/AddRecordModal';
import { EditRecordModal } from './components/EditRecordModal';
import { TableView } from './components/TableView';
import { AutoDashboard } from './components/AutoDashboard';
import { GlobalDashboardOverview } from './components/GlobalDashboardOverview';
import { CrossTableInsightsView } from './components/CrossTableInsightsView';
import { CellInspectorModal } from './components/CellInspectorModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuditLogsModal } from './components/AuditLogsModal';
import { Table as TableIcon, Plus, Trash2, Edit3, WifiOff, BarChart3 } from 'lucide-react';
import { isRowMatchingAllFilters } from './utils/filterUtils';
import { fetchClientIp } from './utils/ipService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getSavedAuth());
  const [tables, setTables] = useState<UserTable[]>(() => getSavedTables());
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = getSavedAuth();
    return saved?.role === 'viewer' ? 'dashboard_only' : 'split';
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [clientIp, setClientIp] = useState<string>('192.168.1.1');

  // Fetch client public IP for admindw audit logs
  useEffect(() => {
    fetchClientIp().then((ip) => {
      if (ip) setClientIp(ip);
    });
  }, []);

  // Ensure admindw always stays in analytical views (dashboard_only or insights)
  useEffect(() => {
    if (currentUser?.role === 'viewer' && viewMode !== 'dashboard_only' && viewMode !== 'insights') {
      setViewMode('dashboard_only');
    }
  }, [currentUser, viewMode]);

  // Firebase sync & Network state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasPendingWrites: false,
    fromCache: false,
    lastSyncTime: null,
  });

  // PWA Install state
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  // Active filters per table { tableId: ColumnFilter[] }
  const [tableFilters, setTableFilters] = useState<Record<string, ColumnFilter[]>>({});

  // Cell inspector modal state
  const [activeCellInspection, setActiveCellInspection] = useState<CellInspection | null>(null);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'table' | 'all';
    targetTable?: UserTable;
  }>({
    isOpen: false,
    type: 'table',
  });

  // Modals state
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<UserTable | null>(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<{ table: UserTable; row: TableRowData } | null>(null);

  // Is current active session read-only (e.g. admindw)
  const isReadOnly = currentUser?.role === 'viewer';

  // Listen to PWA install prompts
  useEffect(() => {
    initPWAInstallPrompt(({ isInstallable }) => {
      setIsInstallable(isInstallable);
    });
  }, []);

  // Listen to network online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
    };
    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time Firebase tables subscription
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToFirebaseTables(
      (remoteTables, status) => {
        if (remoteTables && remoteTables.length > 0) {
          setTables(remoteTables);
          saveTables(remoteTables);
        }
        setSyncStatus(status);
      },
      (err) => {
        console.warn('Firebase realtime subscription fallback to local cache:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Real-time Firebase audit logs subscription
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeLogs = subscribeToFirebaseLogs(
      (remoteLogs) => {
        if (remoteLogs) {
          setLogs(remoteLogs);
        }
      },
      (err) => {
        console.warn('Firebase logs subscription fallback:', err);
      }
    );

    return () => {
      unsubscribeLogs();
    };
  }, [currentUser]);

  // Set default selected table when tables change
  useEffect(() => {
    if (tables.length > 0) {
      if (!selectedTableId || !tables.some((t) => t.id === selectedTableId)) {
        setSelectedTableId(tables[0].id);
      }
    } else {
      setSelectedTableId('');
    }
  }, [tables, selectedTableId]);

  // Save tables locally whenever they change
  const updateTablesState = (newTables: UserTable[]) => {
    setTables(newTables);
    saveTables(newTables);
  };

  // Activity logger helper
  const trackAction = (
    actionType: ActivityLog['actionType'],
    actionTitle: string,
    tableName?: string,
    tableId?: string,
    details?: string
  ) => {
    if (!currentUser) return;
    const log: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      userRole: currentUser.role,
      ipAddress: clientIp,
      actionType,
      actionTitle,
      tableName,
      tableId,
      details,
    };

    setLogs((prev) => [log, ...prev]);

    logActivityToFirebase(log).catch((err) => {
      console.warn('Local log recorded, cloud pending:', err);
    });
  };

  // Auth Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    saveAuth(user);
    if (user.role === 'viewer') {
      setViewMode('dashboard_only');
    }
    trackAction('login', `Foydalanuvchi tizimga kirdi`, undefined, undefined, `Rol: ${user.role} | IP: ${clientIp}`);
  };

  const handleLogout = () => {
    if (currentUser) {
      trackAction('logout', `Foydalanuvchi tizimdan chiqdi`);
    }
    setCurrentUser(null);
    saveAuth(null);
  };

  // Active current table
  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0] || null;
  }, [tables, selectedTableId]);

  // Current filters for active table
  const currentFilters = useMemo(() => {
    if (!currentTable) return [];
    return tableFilters[currentTable.id] || [];
  }, [tableFilters, currentTable]);

  // Filtered rows for active table
  const filteredTable = useMemo(() => {
    if (!currentTable) return null;
    if (currentFilters.length === 0) return currentTable;

    const filteredRows = currentTable.rows.filter((row) =>
      isRowMatchingAllFilters(row, currentFilters)
    );

    return {
      ...currentTable,
      rows: filteredRows,
    };
  }, [currentTable, currentFilters]);

  // Table CRUD handlers
  const handleTableCreated = async (newTable: UserTable) => {
    const updated = [...tables, newTable];
    updateTablesState(updated);
    setSelectedTableId(newTable.id);

    trackAction(
      'create_table',
      `Yangi "${newTable.name}" jadvali yaratildi`,
      newTable.name,
      newTable.id,
      `Jami ${newTable.columns.length} ta ustun bilan yaratildi`
    );

    try {
      await saveTableToFirebase(newTable);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  const handleTableUpdated = async (updatedTable: UserTable, changeSummary: string) => {
    const updated = tables.map((t) => (t.id === updatedTable.id ? updatedTable : t));
    updateTablesState(updated);

    trackAction(
      'edit_table',
      `"${updatedTable.name}" jadvali strukturasi o'zgartirildi`,
      updatedTable.name,
      updatedTable.id,
      changeSummary
    );

    try {
      await saveTableToFirebase(updatedTable);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  const handleRecordAdded = async (tableId: string, row: TableRowData) => {
    const target = tables.find((t) => t.id === tableId);
    if (!target) return;

    const updatedTable: UserTable = {
      ...target,
      updatedAt: new Date().toISOString(),
      rows: [...target.rows, row],
    };

    const updated = tables.map((t) => (t.id === tableId ? updatedTable : t));
    updateTablesState(updated);

    const firstCustomVal = row.values[target.columns[2]?.key] || 'yozuv';
    trackAction(
      'add_row',
      `"${target.name}" jadvaliga yangi qator qo'shildi`,
      target.name,
      target.id,
      `Yozuv: ${firstCustomVal} (№${row.values[target.columns[0]?.key]})`
    );

    try {
      await saveTableToFirebase(updatedTable);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  const handleRecordUpdated = async (tableId: string, updatedRow: TableRowData) => {
    const target = tables.find((t) => t.id === tableId);
    if (!target) return;

    const updatedRows = target.rows.map((r) => (r.id === updatedRow.id ? updatedRow : r));
    const updatedTable: UserTable = {
      ...target,
      updatedAt: new Date().toISOString(),
      rows: updatedRows,
    };

    const updated = tables.map((t) => (t.id === tableId ? updatedTable : t));
    updateTablesState(updated);

    trackAction(
      'edit_row',
      `"${target.name}" jadvalidagi yozuv tahrirlandi`,
      target.name,
      target.id,
      `Qator: №${updatedRow.values[target.columns[0]?.key]}`
    );

    try {
      await saveTableToFirebase(updatedTable);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  const handleDeleteRecord = async (tableId: string, rowId: string) => {
    const target = tables.find((t) => t.id === tableId);
    if (!target) return;

    const deletedRow = target.rows.find((r) => r.id === rowId);
    const seqNum = deletedRow ? deletedRow.values[target.columns[0]?.key] : '';

    const updatedRows = target.rows
      .filter((r) => r.id !== rowId)
      .map((r, idx) => ({
        ...r,
        values: {
          ...r.values,
          [target.columns[0]?.key || 'c1']: (idx + 1).toString(),
        },
      }));

    const updatedTable: UserTable = {
      ...target,
      updatedAt: new Date().toISOString(),
      rows: updatedRows,
    };

    const updated = tables.map((t) => (t.id === tableId ? updatedTable : t));
    updateTablesState(updated);

    trackAction(
      'delete_row',
      `"${target.name}" jadvalidan qator o'chirildi`,
      target.name,
      target.id,
      `O'chirilgan qator: №${seqNum || 'nomalum'}`
    );

    try {
      await saveTableToFirebase(updatedTable);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  const confirmDeleteTable = async (tableId: string) => {
    const target = tables.find((t) => t.id === tableId);
    const updated = tables.filter((t) => t.id !== tableId);
    updateTablesState(updated);

    if (target) {
      trackAction(
        'delete_table',
        `"${target.name}" jadvali butunlay o'chirildi`,
        target.name,
        target.id,
        `${target.rows.length} ta yozuv o'chirildi`
      );
    }

    try {
      await deleteTableFromFirebase(tableId);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  const confirmClearAll = async () => {
    const tableIds = tables.map((t) => t.id);
    updateTablesState([]);

    trackAction(
      'clear_all',
      `Barcha jadvallar tozalandi va o'chirildi`,
      undefined,
      undefined,
      `Jami ${tableIds.length} ta jadval o'chirildi`
    );

    try {
      await clearAllTablesFromFirebase(tableIds);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  // Filter modifiers
  const handleUpdateFilters = (tableId: string, newFilters: ColumnFilter[]) => {
    setTableFilters((prev) => ({
      ...prev,
      [tableId]: newFilters,
    }));
  };

  const handleResetFilters = (tableId: string) => {
    setTableFilters((prev) => {
      const copy = { ...prev };
      delete copy[tableId];
      return copy;
    });
  };

  const handleInstallPWA = async () => {
    const installed = await promptPWAInstall();
    if (installed) {
      setIsInstallable(false);
    }
  };

  const handleExportExcelLogged = (table: UserTable, rowCount: number) => {
    trackAction(
      'export_excel',
      `"${table.name}" jadvali Excel .xlsx formatida eksport qilindi`,
      table.name,
      table.id,
      `Jami ${rowCount} ta qator eksport qilindi`
    );
  };

  // If user is not logged in -> Auth Screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#edf6fe] text-sky-950 flex flex-col font-mono selection:bg-sky-200 selection:text-sky-900">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenCreateTable={() => setIsCreateTableOpen(true)}
        onOpenAddRecord={() => setIsAddRecordOpen(true)}
        onClearAllTables={
          !isReadOnly && tables.length > 0
            ? () =>
                setDeleteModalState({
                  isOpen: true,
                  type: 'all',
                })
            : undefined
        }
        onOpenAuditLogs={isReadOnly ? () => setIsAuditLogsOpen(true) : undefined}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasTables={tables.length > 0}
        syncStatus={syncStatus}
        isInstallable={isInstallable}
        onInstallPWA={handleInstallPWA}
      />

      {/* Offline Alert Banner if offline */}
      {!syncStatus.isOnline && (
        <div className="bg-sky-200/90 border-b border-sky-300 px-4 py-2 text-xs text-sky-950 flex items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <WifiOff className="w-4 h-4 text-sky-800 shrink-0" />
            <span>
              <strong>Offlayn rejimdasiz:</strong> Barcha kiritilgan va tahrirlangan ma'lumotlar qurilmangizda saqlanadi. Internet ulanganda baza bilan avtomatik sinxronlanadi.
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {tables.length === 0 ? (
          /* Empty state for newly logged in user */
          <EmptyState
            onOpenCreateTable={() => setIsCreateTableOpen(true)}
            isReadOnly={isReadOnly}
          />
        ) : viewMode === 'insights' ? (
          /* Cross-Table Insights & Multi-Table Analytics / Search */
          <CrossTableInsightsView
            tables={tables}
            onSelectTable={(tableId) => {
              setSelectedTableId(tableId);
              setViewMode(isReadOnly ? 'dashboard_only' : 'split');
            }}
            onInspectCell={(colKey, colName, val, rIdx, tableId) => {
              setActiveCellInspection({
                tableId,
                columnKey: colKey,
                columnName: colName,
                value: val,
                rowIndex: rIdx,
              });
            }}
            isReadOnly={isReadOnly}
          />
        ) : (
          /* Active Table & Dynamic Analytics View */
          <div className="space-y-6">
            {/* Table Selection Tabs & Quick Actions */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-sky-200 custom-scrollbar font-mono">
              <div className="flex items-center gap-2">
                <span className="text-xs text-sky-900 font-bold uppercase tracking-wider mr-1 hidden sm:inline font-mono">
                  Jadvallar:
                </span>
                {tables.map((tbl) => {
                  const hasActiveFilters = (tableFilters[tbl.id] || []).length > 0;

                  return (
                    <button
                      key={tbl.id}
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border font-mono ${
                        selectedTableId === tbl.id
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-white text-sky-900 border-sky-300 hover:bg-sky-100'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>{tbl.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${selectedTableId === tbl.id ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-900'}`}>
                        {tbl.rows.length}
                      </span>
                      {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-sky-300" title="Filtr faol" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono">
                {!isReadOnly && currentTable && (
                  <button
                    onClick={() => {
                      setEditingTable(currentTable);
                      setIsEditTableOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-900 bg-white hover:bg-sky-100 border border-sky-300 transition whitespace-nowrap cursor-pointer shadow-xs"
                    title="Jadval nomini, ustunlarini tahrirlash yoki yangi ustun qo'shish"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-700" />
                    <span>Jadvalni tahrirlash</span>
                  </button>
                )}

                {!isReadOnly && (
                  <button
                    onClick={() => setIsCreateTableOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 border border-sky-700 transition whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Yangi jadval</span>
                  </button>
                )}

                {!isReadOnly && currentTable && (
                  <button
                    onClick={() =>
                      setDeleteModalState({
                        isOpen: true,
                        type: 'table',
                        targetTable: currentTable,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-900 hover:text-red-700 bg-white hover:bg-sky-100 border border-sky-300 transition whitespace-nowrap cursor-pointer shadow-xs"
                    title="Joriy jadvalni o'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Jadvalni o'chirish</span>
                  </button>
                )}

                {isReadOnly && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-900 text-xs font-mono font-bold shadow-xs">
                    <BarChart3 className="w-3.5 h-3.5 text-sky-700" />
                    <span>Tahliliy Dashboard & Analitika</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile View Mode Switcher */}
            <div className="flex md:hidden items-center gap-1 p-1 bg-white rounded-xl border border-sky-300 text-xs font-mono shadow-xs overflow-x-auto custom-scrollbar">
              {!isReadOnly && (
                <>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 text-center font-bold rounded-lg whitespace-nowrap ${
                      viewMode === 'split' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-900'
                    }`}
                  >
                    Yonma-yon
                  </button>
                  <button
                    onClick={() => setViewMode('table_only')}
                    className={`px-3 py-1.5 text-center font-bold rounded-lg whitespace-nowrap ${
                      viewMode === 'table_only' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-900'
                    }`}
                  >
                    Jadval
                  </button>
                </>
              )}
              <button
                onClick={() => setViewMode('dashboard_only')}
                className={`px-3 py-1.5 text-center font-bold rounded-lg whitespace-nowrap ${
                  viewMode === 'dashboard_only' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('insights')}
                className={`px-3 py-1.5 text-center font-bold rounded-lg whitespace-nowrap ${
                  viewMode === 'insights' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-900'
                }`}
              >
                Insaytlar
              </button>
            </div>

            {/* Main Views Container */}
            {currentTable && filteredTable && (
              <div>
                {/* admindw (viewer): exclusively show the comprehensive analytical dashboard */}
                {isReadOnly ? (
                  <div className="w-full">
                    <AutoDashboard
                      table={filteredTable}
                      originalTable={currentTable}
                      isFiltered={currentFilters.length > 0}
                      filters={currentFilters}
                      onFiltersChange={(newFilters) => handleUpdateFilters(currentTable.id, newFilters)}
                      onClearFilters={() => handleResetFilters(currentTable.id)}
                      onSelectCellInspector={(colKey, colName, val) => {
                        setActiveCellInspection({
                          tableId: currentTable.id,
                          columnKey: colKey,
                          columnName: colName,
                          value: val,
                          rowIndex: 0,
                        });
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {viewMode === 'split' && (
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        {/* Left: Table View (6/12 on wide) */}
                        <div className="xl:col-span-6">
                          <TableView
                            table={currentTable}
                            originalTable={currentTable}
                            onAddRecord={() => setIsAddRecordOpen(true)}
                            onEditRecord={(row) => setEditingRow({ table: currentTable, row })}
                            onDeleteRecord={handleDeleteRecord}
                            onRequestDeleteTable={(t) =>
                              setDeleteModalState({
                                isOpen: true,
                                type: 'table',
                                targetTable: t,
                              })
                            }
                            onEditTable={() => {
                              setEditingTable(currentTable);
                              setIsEditTableOpen(true);
                            }}
                            onExportExcelLogged={handleExportExcelLogged}
                            onInspectCell={(colKey, colName, val, rIdx) => {
                              setActiveCellInspection({
                                tableId: currentTable.id,
                                columnKey: colKey,
                                columnName: colName,
                                value: val,
                                rowIndex: rIdx,
                              });
                            }}
                            filters={currentFilters}
                            onFiltersChange={(newFilters) => handleUpdateFilters(currentTable.id, newFilters)}
                            onResetFilters={() => handleResetFilters(currentTable.id)}
                            isReadOnly={isReadOnly}
                          />
                        </div>

                        {/* Right: Dynamic Dashboard (6/12 on wide) */}
                        <div className="xl:col-span-6">
                          <AutoDashboard
                            table={filteredTable}
                            originalTable={currentTable}
                            isFiltered={currentFilters.length > 0}
                            filters={currentFilters}
                            onFiltersChange={(newFilters) => handleUpdateFilters(currentTable.id, newFilters)}
                            onClearFilters={() => handleResetFilters(currentTable.id)}
                            onSelectCellInspector={(colKey, colName, val) => {
                              setActiveCellInspection({
                                tableId: currentTable.id,
                                columnKey: colKey,
                                columnName: colName,
                                value: val,
                                rowIndex: 0,
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {viewMode === 'table_only' && (
                      <TableView
                        table={currentTable}
                        originalTable={currentTable}
                        onAddRecord={() => setIsAddRecordOpen(true)}
                        onEditRecord={(row) => setEditingRow({ table: currentTable, row })}
                        onDeleteRecord={handleDeleteRecord}
                        onRequestDeleteTable={(t) =>
                          setDeleteModalState({
                            isOpen: true,
                            type: 'table',
                            targetTable: t,
                          })
                        }
                        onEditTable={() => {
                          setEditingTable(currentTable);
                          setIsEditTableOpen(true);
                        }}
                        onExportExcelLogged={handleExportExcelLogged}
                        onInspectCell={(colKey, colName, val, rIdx) => {
                          setActiveCellInspection({
                            tableId: currentTable.id,
                            columnKey: colKey,
                            columnName: colName,
                            value: val,
                            rowIndex: rIdx,
                          });
                        }}
                        filters={currentFilters}
                        onFiltersChange={(newFilters) => handleUpdateFilters(currentTable.id, newFilters)}
                        onResetFilters={() => handleResetFilters(currentTable.id)}
                        isReadOnly={isReadOnly}
                      />
                    )}

                    {viewMode === 'dashboard_only' && (
                      <div className="w-full">
                        <AutoDashboard
                          table={filteredTable}
                          originalTable={currentTable}
                          isFiltered={currentFilters.length > 0}
                          filters={currentFilters}
                          onFiltersChange={(newFilters) => handleUpdateFilters(currentTable.id, newFilters)}
                          onClearFilters={() => handleResetFilters(currentTable.id)}
                          onSelectCellInspector={(colKey, colName, val) => {
                            setActiveCellInspection({
                              tableId: currentTable.id,
                              columnKey: colKey,
                              columnName: colName,
                              value: val,
                              rowIndex: 0,
                            });
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {!isReadOnly && (
        <>
          <CreateTableModal
            isOpen={isCreateTableOpen}
            onClose={() => setIsCreateTableOpen(false)}
            onTableCreated={handleTableCreated}
          />

          {editingTable && (
            <EditTableModal
              isOpen={isEditTableOpen}
              onClose={() => {
                setIsEditTableOpen(false);
                setEditingTable(null);
              }}
              table={editingTable}
              onSave={handleTableUpdated}
            />
          )}

          <AddRecordModal
            isOpen={isAddRecordOpen}
            onClose={() => setIsAddRecordOpen(false)}
            tables={tables}
            selectedTableId={selectedTableId}
            onRecordAdded={handleRecordAdded}
          />

          {editingRow && (
            <EditRecordModal
              isOpen={!!editingRow}
              onClose={() => setEditingRow(null)}
              table={editingRow.table}
              row={editingRow.row}
              onSave={handleRecordUpdated}
            />
          )}
        </>
      )}

      {/* Audit Logs Modal for admindw */}
      {isReadOnly && (
        <AuditLogsModal
          isOpen={isAuditLogsOpen}
          onClose={() => setIsAuditLogsOpen(false)}
          logs={logs}
          currentIp={clientIp}
          isAdmindw={true}
        />
      )}

      {/* Cell Inspector Modal */}
      {activeCellInspection && currentTable && (
        <CellInspectorModal
          inspection={activeCellInspection}
          table={currentTable}
          onClose={() => setActiveCellInspection(null)}
          onApplyAsFilter={(columnKey, val) => {
            const existing = currentFilters.filter((f) => f.columnKey !== columnKey);
            handleUpdateFilters(currentTable.id, [
              ...existing,
              {
                columnKey,
                selectedValues: [val],
              },
            ]);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {!isReadOnly && (
        <DeleteConfirmModal
          isOpen={deleteModalState.isOpen}
          onClose={() => setDeleteModalState({ isOpen: false, type: 'table' })}
          onConfirm={() => {
            if (deleteModalState.type === 'all') {
              confirmClearAll();
            } else if (deleteModalState.targetTable) {
              confirmDeleteTable(deleteModalState.targetTable.id);
            }
          }}
          title={
            deleteModalState.type === 'all'
              ? "Barcha jadvallarni o'chirish"
              : `"${deleteModalState.targetTable?.name}" jadvalini o'chirish`
          }
          description={
            deleteModalState.type === 'all'
              ? "Haqiqatdan ham tizimdagi barcha jadvallar va ularning barcha yozuvlarini o'chirib yubormoqchimisiz? Barcha ma'lumotlar butunlay o'chiriladi."
              : `"${deleteModalState.targetTable?.name}" jadvalidagi barcha ustunlar, ${deleteModalState.targetTable?.rows.length || 0} ta yozuv va unga tegishli dashboardlar o'chiriladi.`
          }
        />
      )}
    </div>
  );
}
