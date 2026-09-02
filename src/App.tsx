import React, { useState, useEffect, useMemo } from 'react';
import { AuthUser, UserTable, TableRowData, ViewMode, ColumnFilter, CellInspection, ActivityLog } from './types';
import { getSavedTables, saveTables, getSavedAuth, saveAuth } from './utils/storage';
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
import { CellInspectorModal } from './components/CellInspectorModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuditLogsModal } from './components/AuditLogsModal';
import { Table as TableIcon, BarChart3, Plus, Trash2, Edit3, Filter, Sparkles, SlidersHorizontal, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getSavedAuth());
  const [tables, setTables] = useState<UserTable[]>(() => getSavedTables());
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);

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

  // Real-time Firestore synchronization for tables
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseTables(
      (remoteTables, status) => {
        setSyncStatus(status);
        // If remote has data, update tables
        if (remoteTables) {
          setTables(remoteTables);
          saveTables(remoteTables);
        }
      },
      (err) => {
        console.warn('Firebase sync notice:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time Firestore synchronization for activity logs
  useEffect(() => {
    const unsubscribeLogs = subscribeToFirebaseLogs(
      (remoteLogs) => {
        if (remoteLogs) {
          setLogs(remoteLogs);
        }
      },
      (err) => {
        console.warn('Firebase logs notice:', err);
      }
    );

    return () => {
      unsubscribeLogs();
    };
  }, []);

  // Sync active table if tables change
  useEffect(() => {
    if (tables.length > 0) {
      if (!selectedTableId || !tables.some((t) => t.id === selectedTableId)) {
        setSelectedTableId(tables[0].id);
      }
    } else {
      setSelectedTableId('');
    }
    saveTables(tables);
  }, [tables, selectedTableId]);

  // Current active table
  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0];
  }, [tables, selectedTableId]);

  // Current active filters for active table
  const currentFilters = useMemo(() => {
    if (!currentTable) return [];
    return tableFilters[currentTable.id] || [];
  }, [tableFilters, currentTable]);

  // Filtered rows for active table
  const filteredTable = useMemo<UserTable | null>(() => {
    if (!currentTable) return null;
    if (currentFilters.length === 0) return currentTable;

    const filteredRows = currentTable.rows.filter((row) => {
      return currentFilters.every((f) => {
        const rawVal = (row.values[f.columnKey] || '').trim();
        const displayVal = !rawVal || rawVal.toLowerCase() === 'nomsiz' ? 'nomsiz' : rawVal;

        if (f.selectedValues && f.selectedValues.length > 0) {
          if (!f.selectedValues.includes(displayVal)) {
            return false;
          }
        }

        if (f.textQuery && f.textQuery.trim()) {
          const q = f.textQuery.toLowerCase().trim();
          if (!displayVal.toLowerCase().includes(q)) {
            return false;
          }
        }

        if (f.numericMin !== undefined || f.numericMax !== undefined) {
          const num = parseFloat(rawVal.replace(/[^0-9.-]+/g, ''));
          if (isNaN(num)) return false;
          if (f.numericMin !== undefined && num < f.numericMin) {
            return false;
          }
          if (f.numericMax !== undefined && num > f.numericMax) {
            return false;
          }
        }

        return true;
      });
    });

    return {
      ...currentTable,
      rows: filteredRows,
    };
  }, [currentTable, currentFilters]);

  // Helper to safely dispatch audit log
  const trackAction = (
    actionType: ActivityLog['actionType'],
    actionTitle: string,
    tableName?: string,
    tableId?: string,
    details?: string
  ) => {
    if (!currentUser) return;
    logActivityToFirebase({
      username: currentUser.username,
      actionType,
      actionTitle,
      tableName,
      tableId,
      details,
    });
  };

  // Handle Login
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    saveAuth(user);
    logActivityToFirebase({
      username: user.username,
      actionType: 'login',
      actionTitle: `${user.name} (${user.username}) tizimga kirdi`,
      details: `Rol: ${user.role === 'admin' ? 'Administrator (daewoouser)' : 'Nazoratchi (admindw)'}`,
    });
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    saveAuth(null);
  };

  // Handle Table Created
  const handleTableCreated = async (newTable: UserTable) => {
    if (isReadOnly) return;
    const updated = [newTable, ...tables];
    setTables(updated);
    setSelectedTableId(newTable.id);
    setViewMode('split');
    saveTables(updated);

    // Track activity log
    trackAction(
      'create_table',
      `"${newTable.name}" yangi jadvali yaratildi`,
      newTable.name,
      newTable.id,
      `${newTable.columns.length} ta ustun (${newTable.columns.map((c) => c.name).join(', ')})`
    );

    // Persist to Firebase (offline supported)
    try {
      await saveTableToFirebase(newTable);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  // Handle Table Updated (Name, columns, reordering)
  const handleTableUpdated = async (updatedTable: UserTable, changeSummary: string) => {
    if (isReadOnly) return;
    const updated = tables.map((t) => (t.id === updatedTable.id ? updatedTable : t));
    setTables(updated);
    saveTables(updated);

    // Clean up filters if columns were deleted
    setTableFilters((prev) => {
      const existingFilters = prev[updatedTable.id] || [];
      const validColKeys = new Set(updatedTable.columns.map((c) => c.key));
      const cleaned = existingFilters.filter((f) => validColKeys.has(f.columnKey));
      return { ...prev, [updatedTable.id]: cleaned };
    });

    trackAction(
      'edit_table',
      `"${updatedTable.name}" jadvali tahrirlandi`,
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

  // Handle Record Added
  const handleRecordAdded = async (tableId: string, newRow: TableRowData) => {
    if (isReadOnly) return;
    let targetUpdatedTable: UserTable | null = null;
    const updated = tables.map((t) => {
      if (t.id === tableId) {
        const updatedTable: UserTable = {
          ...t,
          updatedAt: new Date().toISOString(),
          rows: [...t.rows, newRow],
        };
        targetUpdatedTable = updatedTable;
        return updatedTable;
      }
      return t;
    });

    setTables(updated);
    saveTables(updated);

    if (targetUpdatedTable) {
      // Track activity log
      const previewValues = Object.entries(newRow.values)
        .slice(0, 3)
        .map(([k, v]) => v)
        .filter(Boolean)
        .join(', ');

      trackAction(
        'add_row',
        `"${(targetUpdatedTable as UserTable).name}" jadvaliga yangi yozuv qo'shildi`,
        (targetUpdatedTable as UserTable).name,
        (targetUpdatedTable as UserTable).id,
        previewValues ? `Kiritilgan ma'lumotlar: ${previewValues}` : undefined
      );

      try {
        await saveTableToFirebase(targetUpdatedTable);
      } catch (err) {
        console.warn('Queued locally for sync:', err);
      }
    }
  };

  // Handle Record Updated
  const handleRecordUpdated = async (tableId: string, updatedRow: TableRowData) => {
    if (isReadOnly) return;
    let targetUpdatedTable: UserTable | null = null;
    const updated = tables.map((t) => {
      if (t.id === tableId) {
        const updatedTable: UserTable = {
          ...t,
          updatedAt: new Date().toISOString(),
          rows: t.rows.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
        };
        targetUpdatedTable = updatedTable;
        return updatedTable;
      }
      return t;
    });

    setTables(updated);
    saveTables(updated);

    if (targetUpdatedTable) {
      const previewValues = Object.entries(updatedRow.values)
        .slice(0, 3)
        .map(([k, v]) => v)
        .filter(Boolean)
        .join(', ');

      trackAction(
        'edit_row',
        `"${(targetUpdatedTable as UserTable).name}" jadvalida yozuv tahrirlandi`,
        (targetUpdatedTable as UserTable).name,
        (targetUpdatedTable as UserTable).id,
        `Yangi qiymatlar: ${previewValues}`
      );

      try {
        await saveTableToFirebase(targetUpdatedTable);
      } catch (err) {
        console.warn('Queued locally for sync:', err);
      }
    }
  };

  // Handle Record Deleted
  const handleDeleteRecord = async (tableId: string, rowId: string) => {
    if (isReadOnly) return;
    let targetUpdatedTable: UserTable | null = null;
    const targetTableObj = tables.find((t) => t.id === tableId);
    const targetRow = targetTableObj?.rows.find((r) => r.id === rowId);

    const updated = tables.map((t) => {
      if (t.id === tableId) {
        const updatedTable: UserTable = {
          ...t,
          updatedAt: new Date().toISOString(),
          rows: t.rows.filter((r) => r.id !== rowId),
        };
        targetUpdatedTable = updatedTable;
        return updatedTable;
      }
      return t;
    });

    setTables(updated);
    saveTables(updated);

    if (targetUpdatedTable) {
      const previewValues = targetRow
        ? Object.values(targetRow.values).slice(0, 2).join(', ')
        : '';

      trackAction(
        'delete_row',
        `"${(targetUpdatedTable as UserTable).name}" jadvalidan yozuv o'chirildi`,
        (targetUpdatedTable as UserTable).name,
        (targetUpdatedTable as UserTable).id,
        previewValues ? `O'chirilgan qator: ${previewValues}` : undefined
      );

      try {
        await saveTableToFirebase(targetUpdatedTable);
      } catch (err) {
        console.warn('Queued locally for sync:', err);
      }
    }
  };

  // Handle Table Deleted Confirmation
  const confirmDeleteTable = async (tableId: string) => {
    if (isReadOnly) return;
    const targetTableObj = tables.find((t) => t.id === tableId);
    const updated = tables.filter((t) => t.id !== tableId);
    setTables(updated);
    saveTables(updated);
    if (selectedTableId === tableId) {
      setSelectedTableId(updated.length > 0 ? updated[0].id : '');
    }

    if (targetTableObj) {
      trackAction(
        'delete_table',
        `"${targetTableObj.name}" jadvali butunlay o'chirildi`,
        targetTableObj.name,
        targetTableObj.id,
        `${targetTableObj.rows.length} ta yozuv o'chirildi`
      );
    }

    try {
      await deleteTableFromFirebase(tableId);
    } catch (err) {
      console.warn('Queued locally for sync:', err);
    }
  };

  // Handle Clear All Tables
  const confirmClearAll = async () => {
    if (isReadOnly) return;
    const tableIds = tables.map((t) => t.id);
    const totalCount = tables.length;
    setTables([]);
    setSelectedTableId('');
    setTableFilters({});
    saveTables([]);

    trackAction(
      'clear_all',
      `Barcha jadvallar tozalab tashlandi`,
      undefined,
      undefined,
      `Jami ${totalCount} ta jadval o'chirildi`
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

  // If user is not logged in -> Auth Screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Offlayn rejimdasiz:</strong> Barcha kiritilgan va tahrirlangan ma'lumotlar qurilmangizda saqlanadi. Internet ulanganda Google Firebase bilan avtomatik sinxronlanadi.
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
        ) : viewMode === 'overview' ? (
          /* Global Overview across all tables */
          <GlobalDashboardOverview
            tables={tables}
            onSelectTable={(tableId, mode) => {
              setSelectedTableId(tableId);
              setViewMode(mode || 'split');
            }}
            onOpenCreateTable={() => setIsCreateTableOpen(true)}
            onOpenAddRecord={(tableId) => {
              if (tableId) setSelectedTableId(tableId);
              setIsAddRecordOpen(true);
            }}
            onRequestDeleteTable={(table) =>
              setDeleteModalState({
                isOpen: true,
                type: 'table',
                targetTable: table,
              })
            }
            onEditTable={(table) => {
              setEditingTable(table);
              setIsEditTableOpen(true);
            }}
            isReadOnly={isReadOnly}
          />
        ) : (
          /* Active Table & Dynamic Analytics View */
          <div className="space-y-6">
            {/* Table Selection Tabs & Quick Actions */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1 hidden sm:inline">
                  Jadvallar:
                </span>
                {tables.map((tbl) => {
                  const hasActiveFilters = (tableFilters[tbl.id] || []).length > 0;

                  return (
                    <button
                      key={tbl.id}
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                        selectedTableId === tbl.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>{tbl.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/30 font-mono">
                        {tbl.rows.length}
                      </span>
                      {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="Filtr faol" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isReadOnly && currentTable && (
                  <button
                    onClick={() => {
                      setEditingTable(currentTable);
                      setIsEditTableOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition whitespace-nowrap cursor-pointer shadow-sm"
                    title="Jadval nomini, ustunlarini tahrirlash yoki yangi ustun qo'shish"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Jadvalni tahrirlash</span>
                  </button>
                )}

                {!isReadOnly && (
                  <button
                    onClick={() => setIsCreateTableOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition whitespace-nowrap cursor-pointer"
                    title="Joriy jadvalni o'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Jadvalni o'chirish</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile View Mode Switcher */}
            <div className="flex md:hidden items-center justify-between p-1.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`flex-1 py-1.5 text-center font-medium rounded-lg ${
                  viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Yonma-yon
              </button>
              <button
                onClick={() => setViewMode('table_only')}
                className={`flex-1 py-1.5 text-center font-medium rounded-lg ${
                  viewMode === 'table_only' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Jadval
              </button>
              <button
                onClick={() => setViewMode('dashboard_only')}
                className={`flex-1 py-1.5 text-center font-medium rounded-lg ${
                  viewMode === 'dashboard_only' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Dashboard
              </button>
            </div>

            {/* Main Views Container */}
            {currentTable && filteredTable && (
              <div>
                {viewMode === 'split' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left: Table View (6/12 on wide) */}
                    <div className="xl:col-span-6">
                      <TableView
                        table={currentTable}
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

                    {/* Right: Dynamic Auto Dashboard (6/12 on wide) */}
                    <div className="xl:col-span-6">
                      <AutoDashboard
                        table={filteredTable}
                        originalTable={currentTable}
                        isFiltered={currentFilters.length > 0}
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
                  <div className="max-w-5xl mx-auto">
                    <AutoDashboard
                      table={filteredTable}
                      originalTable={currentTable}
                      isFiltered={currentFilters.length > 0}
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
