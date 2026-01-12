export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  hourlyRate?: number;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  clientId: string;
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
}

export interface Part {
  name: string;
  quantity: number;
  price: number;
  description?: string;
}

export interface WorkPeriod {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
}

export interface WorkSession {
  id: string;
  createdAt: Date;
  completedAt?: Date;
  description?: string;
  periods: WorkPeriod[];
  parts: Part[];
}

export type TaskStatus = 'pending' | 'in-progress' | 'paused' | 'completed' | 'billed' | 'paid';

export interface Task {
  id: string;
  clientId: string;
  vehicleId: string;
  customerName: string;
  carVin: string;
  status: TaskStatus;
  totalTime: number; // seconds
  needsFollowUp: boolean;
  sessions: WorkSession[];
  createdAt: Date;
  startTime?: Date;
  activeSessionId?: string; // Track which session is currently being worked on
}

export interface BackupSettings {
  lastBackupDate?: string;
  autoBackupEnabled?: boolean;
  lastBackupStatus?: 'success' | 'failed';
}

export interface Settings {
  defaultHourlyRate: number;
  googleApiKey?: string;
  grokApiKey?: string;
  ocrSpaceApiKey?: string;
  ocrProvider?: 'gemini' | 'grok' | 'ocrspace' | 'tesseract';
  backup?: BackupSettings;
}
