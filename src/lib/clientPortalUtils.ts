import { Client, Vehicle, Task, TaskStatus, Part } from '@/types';

export interface SessionCostDetail {
  description: string;
  date: Date;
  duration: number;
  laborCost: number;
  parts: Part[];
  partsCost: number;
  status: TaskStatus;
}

export interface VehicleCostSummary {
  vehicle: Vehicle;
  sessions: SessionCostDetail[];
  totalLabor: number;
  totalParts: number;
  vehicleTotal: number;
}

export interface ClientCostSummary {
  client: Client;
  vehicles: VehicleCostSummary[];
  grandTotalLabor: number;
  grandTotalParts: number;
  grandTotal: number;
}

export function generateAccessCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function calculateClientCosts(
  client: Client,
  vehicles: Vehicle[],
  tasks: Task[],
  defaultHourlyRate: number
): ClientCostSummary {
  const hourlyRate = client.hourlyRate || defaultHourlyRate;
  const clientVehicles = vehicles.filter(v => v.clientId === client.id);
  
  let grandTotalLabor = 0;
  let grandTotalParts = 0;

  const vehicleSummaries: VehicleCostSummary[] = clientVehicles.map(vehicle => {
    const vehicleTasks = tasks.filter(t => t.vehicleId === vehicle.id);
    let totalLabor = 0;
    let totalParts = 0;
    
    const sessions: SessionCostDetail[] = [];

    vehicleTasks.forEach(task => {
      task.sessions.forEach(session => {
        const duration = session.periods.reduce((sum, p) => sum + p.duration, 0);
        const laborCost = (duration / 3600) * hourlyRate;
        const partsCost = (session.parts || []).reduce((sum, p) => sum + p.price * p.quantity, 0);
        
        totalLabor += laborCost;
        totalParts += partsCost;

        sessions.push({
          description: session.description || 'Work session',
          date: session.createdAt,
          duration,
          laborCost,
          parts: session.parts || [],
          partsCost,
          status: task.status,
        });
      });
    });

    grandTotalLabor += totalLabor;
    grandTotalParts += totalParts;

    return {
      vehicle,
      sessions,
      totalLabor,
      totalParts,
      vehicleTotal: totalLabor + totalParts,
    };
  });

  return {
    client,
    vehicles: vehicleSummaries.filter(v => v.sessions.length > 0),
    grandTotalLabor,
    grandTotalParts,
    grandTotal: grandTotalLabor + grandTotalParts,
  };
}

// Encode client data into a compressed base64 string for URL sharing
export async function encodeClientData(data: ClientCostSummary, accessCode: string): Promise<string> {
  const payload = JSON.stringify({ data, accessCode });
  const blob = new Blob([payload]);
  const cs = new CompressionStream('gzip');
  const compressedStream = blob.stream().pipeThrough(cs);
  const compressedBlob = await new Response(compressedStream).blob();
  const buffer = await compressedBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

// Decode client data from a compressed base64 string
export async function decodeClientData(encoded: string): Promise<{ data: ClientCostSummary; accessCode: string }> {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes]);
  const ds = new DecompressionStream('gzip');
  const decompressedStream = blob.stream().pipeThrough(ds);
  const text = await new Response(decompressedStream).text();
  return JSON.parse(text);
}
