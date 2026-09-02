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
  actionType: 'create_table' | 'edit_table' | 'add_row' | 'edit_row' | 'delete_row' | 'delete_table' | 'clear_all' | 'login' | 'export_csv';
  actionTitle: string;
  tableName?: string;
  tableId?: string;
  details?: string;
}

export type ViewMode = 'split' | 'table_only' | 'dashboard_only' | 'overview';

export interface ColumnFilter {
  columnKey: string;
  selectedValues: string[]; // specific values selected
  textQuery?: string; // sub-string search
  numericMin?: number;
  numericMax?: number;
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

