export interface SessionColorScheme {
  session: string;      // Lightest shade (for session container)
  period: string;       // Medium shade (for period cards)
  part: string;         // Darkest shade (for part cards)
  name: string;
}

const sessionColorSchemes: SessionColorScheme[] = [
  {
    name: 'blue',
    session: 'bg-blue-500/25 border-blue-500/40',
    period: 'bg-blue-500/35 border-blue-500/50',
    part: 'bg-blue-500/45 border-blue-500/60',
  },
  {
    name: 'green',
    session: 'bg-green-500/25 border-green-500/40',
    period: 'bg-green-500/35 border-green-500/50',
    part: 'bg-green-500/45 border-green-500/60',
  },
  {
    name: 'purple',
    session: 'bg-purple-500/25 border-purple-500/40',
    period: 'bg-purple-500/35 border-purple-500/50',
    part: 'bg-purple-500/45 border-purple-500/60',
  },
  {
    name: 'orange',
    session: 'bg-orange-500/25 border-orange-500/40',
    period: 'bg-orange-500/35 border-orange-500/50',
    part: 'bg-orange-500/45 border-orange-500/60',
  },
  {
    name: 'pink',
    session: 'bg-pink-500/25 border-pink-500/40',
    period: 'bg-pink-500/35 border-pink-500/50',
    part: 'bg-pink-500/45 border-pink-500/60',
  },
  {
    name: 'cyan',
    session: 'bg-cyan-500/25 border-cyan-500/40',
    period: 'bg-cyan-500/35 border-cyan-500/50',
    part: 'bg-cyan-500/45 border-cyan-500/60',
  },
  {
    name: 'amber',
    session: 'bg-amber-500/25 border-amber-500/40',
    period: 'bg-amber-500/35 border-amber-500/50',
    part: 'bg-amber-500/45 border-amber-500/60',
  },
  {
    name: 'indigo',
    session: 'bg-indigo-500/25 border-indigo-500/40',
    period: 'bg-indigo-500/35 border-indigo-500/50',
    part: 'bg-indigo-500/45 border-indigo-500/60',
  },
  {
    name: 'rose',
    session: 'bg-rose-500/25 border-rose-500/40',
    period: 'bg-rose-500/35 border-rose-500/50',
    part: 'bg-rose-500/45 border-rose-500/60',
  },
  {
    name: 'emerald',
    session: 'bg-emerald-500/25 border-emerald-500/40',
    period: 'bg-emerald-500/35 border-emerald-500/50',
    part: 'bg-emerald-500/45 border-emerald-500/60',
  },
  {
    name: 'teal',
    session: 'bg-teal-500/25 border-teal-500/40',
    period: 'bg-teal-500/35 border-teal-500/50',
    part: 'bg-teal-500/45 border-teal-500/60',
  },
  {
    name: 'violet',
    session: 'bg-violet-500/25 border-violet-500/40',
    period: 'bg-violet-500/35 border-violet-500/50',
    part: 'bg-violet-500/45 border-violet-500/60',
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
      session: 'bg-gray-500/25 border-gray-500/40',
      period: 'bg-gray-500/35 border-gray-500/50',
      part: 'bg-gray-500/45 border-gray-500/60',
    };
  }

  const hash = hashString(sessionId);
  const index = hash % sessionColorSchemes.length;
  return sessionColorSchemes[index];
}
