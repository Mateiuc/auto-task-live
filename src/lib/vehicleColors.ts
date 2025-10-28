/**
 * Vehicle Color System
 * Deterministically assigns a unique color scheme to each vehicle based on its ID
 */

export interface VehicleColorScheme {
  card: string;
  border: string;
  session: string;
  gradient: string;
  name: string;
}

const colorSchemes: VehicleColorScheme[] = [
  {
    name: 'blue',
    card: 'bg-blue-50/80 dark:bg-blue-950/30',
    border: 'border-blue-300/40 dark:border-blue-700/40',
    session: 'bg-blue-500/10 border-blue-500/20',
    gradient: 'bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-blue-950/50',
  },
  {
    name: 'green',
    card: 'bg-green-50/80 dark:bg-green-950/30',
    border: 'border-green-300/40 dark:border-green-700/40',
    session: 'bg-green-500/10 border-green-500/20',
    gradient: 'bg-gradient-to-br from-green-100 via-green-50 to-green-100 dark:from-green-950/50 dark:via-green-900/30 dark:to-green-950/50',
  },
  {
    name: 'purple',
    card: 'bg-purple-50/80 dark:bg-purple-950/30',
    border: 'border-purple-300/40 dark:border-purple-700/40',
    session: 'bg-purple-500/10 border-purple-500/20',
    gradient: 'bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 dark:from-purple-950/50 dark:via-purple-900/30 dark:to-purple-950/50',
  },
  {
    name: 'orange',
    card: 'bg-orange-50/80 dark:bg-orange-950/30',
    border: 'border-orange-300/40 dark:border-orange-700/40',
    session: 'bg-orange-500/10 border-orange-500/20',
    gradient: 'bg-gradient-to-br from-orange-100 via-orange-50 to-orange-100 dark:from-orange-950/50 dark:via-orange-900/30 dark:to-orange-950/50',
  },
  {
    name: 'pink',
    card: 'bg-pink-50/80 dark:bg-pink-950/30',
    border: 'border-pink-300/40 dark:border-pink-700/40',
    session: 'bg-pink-500/10 border-pink-500/20',
    gradient: 'bg-gradient-to-br from-pink-100 via-pink-50 to-pink-100 dark:from-pink-950/50 dark:via-pink-900/30 dark:to-pink-950/50',
  },
  {
    name: 'cyan',
    card: 'bg-cyan-50/80 dark:bg-cyan-950/30',
    border: 'border-cyan-300/40 dark:border-cyan-700/40',
    session: 'bg-cyan-500/10 border-cyan-500/20',
    gradient: 'bg-gradient-to-br from-cyan-100 via-cyan-50 to-cyan-100 dark:from-cyan-950/50 dark:via-cyan-900/30 dark:to-cyan-950/50',
  },
  {
    name: 'amber',
    card: 'bg-amber-50/80 dark:bg-amber-950/30',
    border: 'border-amber-300/40 dark:border-amber-700/40',
    session: 'bg-amber-500/10 border-amber-500/20',
    gradient: 'bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100 dark:from-amber-950/50 dark:via-amber-900/30 dark:to-amber-950/50',
  },
  {
    name: 'indigo',
    card: 'bg-indigo-50/80 dark:bg-indigo-950/30',
    border: 'border-indigo-300/40 dark:border-indigo-700/40',
    session: 'bg-indigo-500/10 border-indigo-500/20',
    gradient: 'bg-gradient-to-br from-indigo-100 via-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:via-indigo-900/30 dark:to-indigo-950/50',
  },
  {
    name: 'rose',
    card: 'bg-rose-50/80 dark:bg-rose-950/30',
    border: 'border-rose-300/40 dark:border-rose-700/40',
    session: 'bg-rose-500/10 border-rose-500/20',
    gradient: 'bg-gradient-to-br from-rose-100 via-rose-50 to-rose-100 dark:from-rose-950/50 dark:via-rose-900/30 dark:to-rose-950/50',
  },
  {
    name: 'emerald',
    card: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    border: 'border-emerald-300/40 dark:border-emerald-700/40',
    session: 'bg-emerald-500/10 border-emerald-500/20',
    gradient: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:via-emerald-900/30 dark:to-emerald-950/50',
  },
  {
    name: 'teal',
    card: 'bg-teal-50/80 dark:bg-teal-950/30',
    border: 'border-teal-300/40 dark:border-teal-700/40',
    session: 'bg-teal-500/10 border-teal-500/20',
    gradient: 'bg-gradient-to-br from-teal-100 via-teal-50 to-teal-100 dark:from-teal-950/50 dark:via-teal-900/30 dark:to-teal-950/50',
  },
  {
    name: 'violet',
    card: 'bg-violet-50/80 dark:bg-violet-950/30',
    border: 'border-violet-300/40 dark:border-violet-700/40',
    session: 'bg-violet-500/10 border-violet-500/20',
    gradient: 'bg-gradient-to-br from-violet-100 via-violet-50 to-violet-100 dark:from-violet-950/50 dark:via-violet-900/30 dark:to-violet-950/50',
  },
];

/**
 * Simple hash function to convert a string to a number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent color scheme for a vehicle based on its ID
 */
export function getVehicleColorScheme(vehicleId: string): VehicleColorScheme {
  if (!vehicleId) {
    // Fallback to neutral gray for missing vehicle IDs
    return {
      name: 'gray',
      card: 'bg-gray-50/80 dark:bg-gray-950/30',
      border: 'border-gray-300/40 dark:border-gray-700/40',
      session: 'bg-gray-500/10 border-gray-500/20',
      gradient: 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-950/50 dark:via-gray-900/30 dark:to-gray-950/50',
    };
  }

  const hash = hashString(vehicleId);
  const index = hash % colorSchemes.length;
  return colorSchemes[index];
}
