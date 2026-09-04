export interface ColumnDefinition {
  id: string;
  name: string;
  key: string;
}

export interface TableRowData {
  id: string;
  createdAt: string;
  values: Record<string, string>;
}

export interface UserTable {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  columns: ColumnDefinition[];
  rows: TableRowData[];
  description?: string;
  themeColor?: string;
}

export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  loggedInAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  userRole?: UserRole;
  ipAddress?: string;
  actionType: 'create_table' | 'edit_table' | 'add_row' | 'edit_row' | 'delete_row' | 'delete_table' | 'clear_all' | 'login' | 'logout' | 'export_csv' | 'export_excel';
  actionTitle: string;
  tableName?: string;
  tableId?: string;
  details?: string;
}

export type ViewMode = 'split' | 'table_only' | 'dashboard_only' | 'insights';

export interface ColumnFilter {
  columnKey: string;
  selectedValues?: string[]; // specific values selected (checkboxes)
  textQuery?: string; // sub-string search (e.g. "kolodka")
  numericMin?: number | null; // Narx / son minimal qiymati
  numericMax?: number | null; // Narx / son maksimal qiymati
  dateExact?: string; // Aniq sana (YYYY-MM-DD)
  datePreset?: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month'; // Sana tezkori
}

export interface CellInspection {
  tableId: string;
  columnKey: string;
  columnName: string;
  value: string;
  rowIndex: number;
}

export type AnalyticalInstrumentId =
  | 'kpi_cards'
  | 'dynamics_trend'
  | 'bar_comparison'
  | 'pie_distribution'
  | 'cumulative_area'
  | 'radar_profile'
  | 'math_statistics'
  | 'top_bottom_ranking'
  | 'correlation_scatter';

export interface AnalyticalInstrumentInfo {
  id: AnalyticalInstrumentId;
  name: string;
  description: string;
  iconName: string;
  category: 'overview' | 'charts' | 'statistics' | 'ranking';
  badge?: string;
}

