import { useState, useEffect } from 'react';
import { capacitorStorage } from '@/lib/capacitorStorage';
import { Client, Vehicle, Task, Settings } from '@/types';

export const useClients = () => {
  const [clients, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const loadedClients = await capacitorStorage.getClients();
        setClientsState(loadedClients);
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  const setClients = async (clients: Client[]) => {
    try {
      await capacitorStorage.setClients(clients);
      setClientsState(clients);
    } catch (error) {
      console.error('Failed to save clients:', error);
    }
  };

  const addClient = async (client: Client) => {
    const updated = [...clients, client];
    await setClients(updated);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const updated = clients.map(c => c.id === id ? { ...c, ...updates } : c);
    await setClients(updated);
  };

  const deleteClient = async (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    await setClients(updated);
  };

  return { clients, setClients, addClient, updateClient, deleteClient, loading };
};

export const useVehicles = () => {
  const [vehicles, setVehiclesState] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const loadedVehicles = await capacitorStorage.getVehicles();
        setVehiclesState(loadedVehicles);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, []);

  const setVehicles = async (vehicles: Vehicle[]) => {
    try {
      await capacitorStorage.setVehicles(vehicles);
      setVehiclesState(vehicles);
    } catch (error) {
      console.error('Failed to save vehicles:', error);
    }
  };

  const addVehicle = async (vehicle: Vehicle) => {
    const updated = [...vehicles, vehicle];
    await setVehicles(updated);
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const updated = vehicles.map(v => v.id === id ? { ...v, ...updates } : v);
    await setVehicles(updated);
  };

  const deleteVehicle = async (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    await setVehicles(updated);
  };

  return { vehicles, setVehicles, addVehicle, updateVehicle, deleteVehicle, loading };
};

export const useTasks = () => {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const loadedTasks = await capacitorStorage.getTasks();
        setTasksState(loadedTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const setTasks = async (tasks: Task[]) => {
    try {
      await capacitorStorage.setTasks(tasks);
      setTasksState(tasks);
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  };

  const addTask = async (task: Task) => {
    const updated = [...tasks, task];
    await setTasks(updated);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    await setTasks(updated);
  };

  const deleteTask = async (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    await setTasks(updated);
  };

  const batchUpdateTasks = async (updates: Array<{ id: string; updates: Partial<Task> }>) => {
    const updated = tasks.map(task => {
      const update = updates.find(u => u.id === task.id);
      return update ? { ...task, ...update.updates } : task;
    });
    await setTasks(updated);
  };

  return { tasks, setTasks, addTask, updateTask, deleteTask, batchUpdateTasks, loading };
};

export const useSettings = () => {
  const [settings, setSettingsState] = useState<Settings>({ defaultHourlyRate: 75 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await capacitorStorage.getSettings();
        setSettingsState(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const setSettings = async (settings: Settings) => {
    try {
      await capacitorStorage.setSettings(settings);
      setSettingsState(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return { settings, setSettings, loading };
};
