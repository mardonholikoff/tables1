import { UserTable, AuthUser } from '../types';

const STORAGE_KEY_TABLES = 'daewoo_user_tables_v1';
const STORAGE_KEY_AUTH = 'daewoo_active_user_session';

export function getSavedTables(): UserTable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TABLES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load tables from storage:', err);
    return [];
  }
}

export function saveTables(tables: UserTable[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(tables));
  } catch (err) {
    console.error('Failed to save tables to storage:', err);
  }
}

export function getSavedAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveAuth(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch (err) {
    console.error('Failed to save auth state:', err);
  }
}

const STORAGE_KEY_INSTRUMENTS = 'daewoo_selected_instruments_v1';

export function getSavedInstruments(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSTRUMENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveSavedInstruments(instruments: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INSTRUMENTS, JSON.stringify(instruments));
  } catch (err) {
    console.error('Failed to save selected instruments:', err);
  }
}

export function generateSampleData(): UserTable {
  const tableId = 'sample_' + Date.now();
  return {
    id: tableId,
    name: 'Avtomobil ehtiyot qismlari & Sotuvlar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    themeColor: 'blue',
    columns: [
      { id: 'c1', key: 'c1', name: 'Mahsulot nomi' },
      { id: 'c2', key: 'c2', name: 'Kategoriya' },
      { id: 'c3', key: 'c3', name: 'Narxi ($)' },
      { id: 'c4', key: 'c4', name: 'Sotilgan miqdori (dona)' },
      { id: 'c5', key: 'c5', name: 'Holati' },
    ],
    rows: [
      {
        id: 'r1',
        createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        values: { c1: 'Dvigatel moyi 5W-30', c2: 'Moylar', c3: '35', c4: '120', c5: 'Mavjud' },
      },
      {
        id: 'r2',
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        values: { c1: 'Tormoz kolodkasi (Old)', c2: 'Tormoz tizimi', c3: '28', c4: '85', c5: 'Mavjud' },
      },
      {
        id: 'r3',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        values: { c1: 'Havo filtri Nexia/Cobalt', c2: 'Filtrlar', c3: '12', c4: '210', c5: 'Kamyob' },
      },
      {
        id: 'r4',
        createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        values: { c1: 'Shamdonlar to\'plami (Spark)', c2: 'Elektr', c3: '18', c4: '140', c5: 'Mavjud' },
      },
      {
        id: 'r5',
        createdAt: new Date().toISOString(),
        values: { c1: 'Amortizator (Gentra)', c2: 'Podveska', c3: '65', c4: '45', c5: 'Buyurtmada' },
      },
    ],
  };
}
