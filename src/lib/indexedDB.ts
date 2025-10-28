import { Client, Vehicle, Task, Settings } from '@/types';

const DB_NAME = 'AutoTimeDB';
const DB_VERSION = 1;

const STORES = {
  CLIENTS: 'clients',
  VEHICLES: 'vehicles',
  TASKS: 'tasks',
  SETTINGS: 'settings',
} as const;

export interface DatabaseExport {
  clients: Client[];
  vehicles: Vehicle[];
  tasks: Task[];
  settings: Settings;
  exportDate: string;
  version: string;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
          db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.VEHICLES)) {
          db.createObjectStore(STORES.VEHICLES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }
      };
    });

    return this.initPromise;
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(this.reviveDates(request.result));
      request.onerror = () => reject(request.error);
    });
  }

  private async setAll<T extends { id?: string }>(storeName: string, items: T[]): Promise<void> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Clear existing data
      store.clear();

      // Add all items
      items.forEach(item => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async getSingle<T>(storeName: string, key: string): Promise<T | undefined> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(this.reviveDates(request.result));
      request.onerror = () => reject(request.error);
    });
  }

  private async setSingle<T>(storeName: string, key: string, value: T): Promise<void> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Date revival helper
  private reviveDates(data: any): any {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.reviveDates(item));
    }
    
    if (typeof data === 'object') {
      const result: any = {};
      for (const key in data) {
        const value = data[key];
        // Handle ISO date strings
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          const dateObj = new Date(value);
          result[key] = isNaN(dateObj.getTime()) ? value : dateObj;
        } 
        // Handle Date objects that may have been serialized and lost their type
        else if (value && typeof value === 'object' && !(value instanceof Date)) {
          result[key] = this.reviveDates(value);
        }
        // Pass through existing Date objects and primitives
        else {
          result[key] = value;
        }
      }
      return result;
    }
    
    return data;
  }

  // Public API
  async getClients(): Promise<Client[]> {
    return this.getAll<Client>(STORES.CLIENTS);
  }

  async setClients(clients: Client[]): Promise<void> {
    return this.setAll(STORES.CLIENTS, clients);
  }

  async getVehicles(): Promise<Vehicle[]> {
    return this.getAll<Vehicle>(STORES.VEHICLES);
  }

  async setVehicles(vehicles: Vehicle[]): Promise<void> {
    return this.setAll(STORES.VEHICLES, vehicles);
  }

  async getTasks(): Promise<Task[]> {
    const tasks = await this.getAll<Task>(STORES.TASKS);
    
    // Data migration: Convert old workSessions to new sessions structure
    return tasks.map((task: any) => {
      if (!task.sessions && task.workSessions) {
        task.sessions = task.workSessions;
        delete task.workSessions;
      }
      // Ensure sessions array exists
      if (!task.sessions) {
        task.sessions = [];
      }
      return task;
    });
  }

  async setTasks(tasks: Task[]): Promise<void> {
    return this.setAll(STORES.TASKS, tasks);
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.getSingle<Settings>(STORES.SETTINGS, 'default');
    return settings || { defaultHourlyRate: 75 };
  }

  async setSettings(settings: Settings): Promise<void> {
    return this.setSingle(STORES.SETTINGS, 'default', settings);
  }

  async exportAllData(): Promise<DatabaseExport> {
    const [clients, vehicles, tasks, settings] = await Promise.all([
      this.getClients(),
      this.getVehicles(),
      this.getTasks(),
      this.getSettings(),
    ]);

    return {
      clients,
      vehicles,
      tasks,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
  }

  async importAllData(data: DatabaseExport): Promise<void> {
    await Promise.all([
      this.setClients(data.clients || []),
      this.setVehicles(data.vehicles || []),
      this.setTasks(data.tasks || []),
      this.setSettings(data.settings || { defaultHourlyRate: 75 }),
    ]);
  }

  async clearAll(): Promise<void> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORES.CLIENTS, STORES.VEHICLES, STORES.TASKS, STORES.SETTINGS],
        'readwrite'
      );

      transaction.objectStore(STORES.CLIENTS).clear();
      transaction.objectStore(STORES.VEHICLES).clear();
      transaction.objectStore(STORES.TASKS).clear();
      transaction.objectStore(STORES.SETTINGS).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const indexedDB = new IndexedDBStorage();
