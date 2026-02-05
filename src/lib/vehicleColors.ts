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
    card: 'bg-blue-100 dark:bg-blue-900/60',
    border: 'border-blue-400/60 dark:border-blue-600/60',
    session: 'bg-blue-500/25 border-blue-500/40',
    gradient: 'bg-gradient-to-br from-blue-200 via-blue-100 to-blue-200 dark:from-blue-900/70 dark:via-blue-800/50 dark:to-blue-900/70',
  },
  {
    name: 'green',
    card: 'bg-green-100 dark:bg-green-900/60',
    border: 'border-green-400/60 dark:border-green-600/60',
    session: 'bg-green-500/25 border-green-500/40',
    gradient: 'bg-gradient-to-br from-green-200 via-green-100 to-green-200 dark:from-green-900/70 dark:via-green-800/50 dark:to-green-900/70',
  },
  {
    name: 'purple',
    card: 'bg-purple-100 dark:bg-purple-900/60',
    border: 'border-purple-400/60 dark:border-purple-600/60',
    session: 'bg-purple-500/25 border-purple-500/40',
    gradient: 'bg-gradient-to-br from-purple-200 via-purple-100 to-purple-200 dark:from-purple-900/70 dark:via-purple-800/50 dark:to-purple-900/70',
  },
  {
    name: 'orange',
    card: 'bg-orange-100 dark:bg-orange-900/60',
    border: 'border-orange-400/60 dark:border-orange-600/60',
    session: 'bg-orange-500/25 border-orange-500/40',
    gradient: 'bg-gradient-to-br from-orange-200 via-orange-100 to-orange-200 dark:from-orange-900/70 dark:via-orange-800/50 dark:to-orange-900/70',
  },
  {
    name: 'pink',
    card: 'bg-pink-100 dark:bg-pink-900/60',
    border: 'border-pink-400/60 dark:border-pink-600/60',
    session: 'bg-pink-500/25 border-pink-500/40',
    gradient: 'bg-gradient-to-br from-pink-200 via-pink-100 to-pink-200 dark:from-pink-900/70 dark:via-pink-800/50 dark:to-pink-900/70',
  },
  {
    name: 'cyan',
    card: 'bg-cyan-100 dark:bg-cyan-900/60',
    border: 'border-cyan-400/60 dark:border-cyan-600/60',
    session: 'bg-cyan-500/25 border-cyan-500/40',
    gradient: 'bg-gradient-to-br from-cyan-200 via-cyan-100 to-cyan-200 dark:from-cyan-900/70 dark:via-cyan-800/50 dark:to-cyan-900/70',
  },
  {
    name: 'amber',
    card: 'bg-amber-100 dark:bg-amber-900/60',
    border: 'border-amber-400/60 dark:border-amber-600/60',
    session: 'bg-amber-500/25 border-amber-500/40',
    gradient: 'bg-gradient-to-br from-amber-200 via-amber-100 to-amber-200 dark:from-amber-900/70 dark:via-amber-800/50 dark:to-amber-900/70',
  },
  {
    name: 'indigo',
    card: 'bg-indigo-100 dark:bg-indigo-900/60',
    border: 'border-indigo-400/60 dark:border-indigo-600/60',
    session: 'bg-indigo-500/25 border-indigo-500/40',
    gradient: 'bg-gradient-to-br from-indigo-200 via-indigo-100 to-indigo-200 dark:from-indigo-900/70 dark:via-indigo-800/50 dark:to-indigo-900/70',
  },
  {
    name: 'rose',
    card: 'bg-rose-100 dark:bg-rose-900/60',
    border: 'border-rose-400/60 dark:border-rose-600/60',
    session: 'bg-rose-500/25 border-rose-500/40',
    gradient: 'bg-gradient-to-br from-rose-200 via-rose-100 to-rose-200 dark:from-rose-900/70 dark:via-rose-800/50 dark:to-rose-900/70',
  },
  {
    name: 'emerald',
    card: 'bg-emerald-100 dark:bg-emerald-900/60',
    border: 'border-emerald-400/60 dark:border-emerald-600/60',
    session: 'bg-emerald-500/25 border-emerald-500/40',
    gradient: 'bg-gradient-to-br from-emerald-200 via-emerald-100 to-emerald-200 dark:from-emerald-900/70 dark:via-emerald-800/50 dark:to-emerald-900/70',
  },
  {
    name: 'teal',
    card: 'bg-teal-100 dark:bg-teal-900/60',
    border: 'border-teal-400/60 dark:border-teal-600/60',
    session: 'bg-teal-500/25 border-teal-500/40',
    gradient: 'bg-gradient-to-br from-teal-200 via-teal-100 to-teal-200 dark:from-teal-900/70 dark:via-teal-800/50 dark:to-teal-900/70',
  },
  {
    name: 'violet',
    card: 'bg-violet-100 dark:bg-violet-900/60',
    border: 'border-violet-400/60 dark:border-violet-600/60',
    session: 'bg-violet-500/25 border-violet-500/40',
    gradient: 'bg-gradient-to-br from-violet-200 via-violet-100 to-violet-200 dark:from-violet-900/70 dark:via-violet-800/50 dark:to-violet-900/70',
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
      card: 'bg-gray-100 dark:bg-gray-900/60',
      border: 'border-gray-400/60 dark:border-gray-600/60',
      session: 'bg-gray-500/25 border-gray-500/40',
      gradient: 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-900/70 dark:via-gray-800/50 dark:to-gray-900/70',
    };
  }

  const hash = hashString(vehicleId);
  const index = hash % colorSchemes.length;
  return colorSchemes[index];
}
