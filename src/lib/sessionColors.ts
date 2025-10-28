export interface SessionColorScheme {
  session: string;      // Lightest shade (for session container)
  period: string;       // Medium shade (for period cards)
  part: string;         // Darkest shade (for part cards)
  name: string;
}

const sessionColorSchemes: SessionColorScheme[] = [
  {
    name: 'blue',
    session: 'bg-blue-500/10 border-blue-500/20',
    period: 'bg-blue-500/20 border-blue-500/30',
    part: 'bg-blue-500/30 border-blue-500/40',
  },
  {
    name: 'green',
    session: 'bg-green-500/10 border-green-500/20',
    period: 'bg-green-500/20 border-green-500/30',
    part: 'bg-green-500/30 border-green-500/40',
  },
  {
    name: 'purple',
    session: 'bg-purple-500/10 border-purple-500/20',
    period: 'bg-purple-500/20 border-purple-500/30',
    part: 'bg-purple-500/30 border-purple-500/40',
  },
  {
    name: 'orange',
    session: 'bg-orange-500/10 border-orange-500/20',
    period: 'bg-orange-500/20 border-orange-500/30',
    part: 'bg-orange-500/30 border-orange-500/40',
  },
  {
    name: 'pink',
    session: 'bg-pink-500/10 border-pink-500/20',
    period: 'bg-pink-500/20 border-pink-500/30',
    part: 'bg-pink-500/30 border-pink-500/40',
  },
  {
    name: 'cyan',
    session: 'bg-cyan-500/10 border-cyan-500/20',
    period: 'bg-cyan-500/20 border-cyan-500/30',
    part: 'bg-cyan-500/30 border-cyan-500/40',
  },
  {
    name: 'amber',
    session: 'bg-amber-500/10 border-amber-500/20',
    period: 'bg-amber-500/20 border-amber-500/30',
    part: 'bg-amber-500/30 border-amber-500/40',
  },
  {
    name: 'indigo',
    session: 'bg-indigo-500/10 border-indigo-500/20',
    period: 'bg-indigo-500/20 border-indigo-500/30',
    part: 'bg-indigo-500/30 border-indigo-500/40',
  },
  {
    name: 'rose',
    session: 'bg-rose-500/10 border-rose-500/20',
    period: 'bg-rose-500/20 border-rose-500/30',
    part: 'bg-rose-500/30 border-rose-500/40',
  },
  {
    name: 'emerald',
    session: 'bg-emerald-500/10 border-emerald-500/20',
    period: 'bg-emerald-500/20 border-emerald-500/30',
    part: 'bg-emerald-500/30 border-emerald-500/40',
  },
  {
    name: 'teal',
    session: 'bg-teal-500/10 border-teal-500/20',
    period: 'bg-teal-500/20 border-teal-500/30',
    part: 'bg-teal-500/30 border-teal-500/40',
  },
  {
    name: 'violet',
    session: 'bg-violet-500/10 border-violet-500/20',
    period: 'bg-violet-500/20 border-violet-500/30',
    part: 'bg-violet-500/30 border-violet-500/40',
  },
];

/**
 * Hash a string to a consistent number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get a unique color scheme for a session based on session ID
 */
export function getSessionColorScheme(sessionId: string): SessionColorScheme {
  if (!sessionId) {
    return {
      name: 'gray',
      session: 'bg-gray-500/10 border-gray-500/20',
      period: 'bg-gray-500/20 border-gray-500/30',
      part: 'bg-gray-500/30 border-gray-500/40',
    };
  }

  const hash = hashString(sessionId);
  const index = hash % sessionColorSchemes.length;
  return sessionColorSchemes[index];
}
