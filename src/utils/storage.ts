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

export function getFormattedDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
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
      { id: 'c1', key: 'c1', name: '№' },
      { id: 'c2', key: 'c2', name: 'Sana va vaqt' },
      { id: 'c3', key: 'c3', name: 'Mahsulot nomi' },
      { id: 'c4', key: 'c4', name: 'Kategoriya' },
      { id: 'c5', key: 'c5', name: 'Narxi ($)' },
      { id: 'c6', key: 'c6', name: 'Sotilgan miqdori (dona)' },
      { id: 'c7', key: 'c7', name: 'Holati' },
    ],
    rows: [
      {
        id: 'r1',
        createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        values: { c1: '1', c2: '28.08.2026 10:15:00', c3: 'Dvigatel moyi 5W-30', c4: 'Moylar', c5: '35', c6: '120', c7: 'Mavjud' },
      },
      {
        id: 'r2',
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        values: { c1: '2', c2: '29.08.2026 14:22:30', c3: 'Tormoz kolodkasi (Old)', c4: 'Tormoz tizimi', c5: '28', c6: '85', c7: 'Mavjud' },
      },
      {
        id: 'r3',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        values: { c1: '3', c2: '30.08.2026 09:05:12', c3: 'Havo filtri Nexia/Cobalt', c4: 'Filtrlar', c5: '12', c6: '210', c7: 'Kamyob' },
      },
      {
        id: 'r4',
        createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        values: { c1: '4', c2: '31.08.2026 16:40:55', c3: 'Shamdonlar to\'plami (Spark)', c4: 'Elektr', c5: '18', c6: '140', c7: 'Mavjud' },
      },
      {
        id: 'r5',
        createdAt: new Date().toISOString(),
        values: { c1: '5', c2: '01.09.2026 11:30:18', c3: 'Amortizator (Gentra)', c4: 'Podveska', c5: '65', c6: '45', c7: 'Buyurtmada' },
      },
    ],
  };
}
