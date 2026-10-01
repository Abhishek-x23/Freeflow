export interface Agent {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
}

export const KNOWN_AGENTS: Agent[] = [
  { id: 'agent-1', name: 'Priya', avatarColor: 'bg-indigo-600', initials: 'PR' },
  { id: 'agent-2', name: 'Rahul', avatarColor: 'bg-emerald-600', initials: 'RA' },
  { id: 'agent-3', name: 'Meera', avatarColor: 'bg-amber-600', initials: 'ME' },
];

export const VALID_AGENT_IDS = ['agent-1', 'agent-2', 'agent-3'] as const;

export function isValidAgentId(id: string | null | undefined): boolean {
  if (!id) return false;
  return VALID_AGENT_IDS.includes(id as (typeof VALID_AGENT_IDS)[number]);
}

export function getAgentById(id: string | null | undefined): Agent | null {
  if (!id) return null;
  return KNOWN_AGENTS.find((a) => a.id === id) || null;
}
