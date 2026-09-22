import { AgencyMember, DailyWorkLog, KanbanCard, UserPresence } from '../types/kanban';
import { AGENCY_MEMBERS } from './mockData';
import { dbSaveTeamMember, dbDeleteTeamMember, loadOrSeedTeamMembers } from './supabaseService';

export const STORAGE_KEY_TEAM_MEMBERS = 'webglow_agency_members_v1';
const STORAGE_KEY_WORK_LOGS = 'webglow_daily_work_logs_v1';
const STORAGE_KEY_CARDS = 'webglow_kanban_cards_v1';
const STORAGE_KEY_USER = 'webglow_kanban_user_v1';
export const TEAM_UPDATED_EVENT = 'webglow_team_updated';

// Multi-tab synchronization: notify local tab if another tab changes team members in localStorage
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (
      event.key === STORAGE_KEY_TEAM_MEMBERS ||
      event.key === STORAGE_KEY_WORK_LOGS ||
      event.key === STORAGE_KEY_CARDS
    ) {
      window.dispatchEvent(
        new CustomEvent(TEAM_UPDATED_EVENT, {
          detail: { action: 'sync', members: getStoredTeamMembers() },
        })
      );
    }
  });
}

/**
 * Retrieve team members from localStorage or fall back to default presets
 */
export function getStoredTeamMembers(): AgencyMember[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAM_MEMBERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to read team members from localStorage', err);
    }
  }
  return AGENCY_MEMBERS.slice(0, 3);
}

/**
 * Fetch authoritative team members list from Supabase cloud
 */
export async function syncTeamMembersFromCloud(): Promise<AgencyMember[]> {
  try {
    const cloudMembers = await loadOrSeedTeamMembers();
    if (cloudMembers && cloudMembers.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TEAM_MEMBERS, JSON.stringify(cloudMembers));
        window.dispatchEvent(
          new CustomEvent(TEAM_UPDATED_EVENT, {
            detail: { action: 'sync', members: cloudMembers },
          })
        );
      }
      return cloudMembers;
    }
  } catch (err) {
    console.warn('Failed to sync team members from cloud', err);
  }
  return getStoredTeamMembers();
}

/**
 * Persist team members list and notify all subscribers
 */
export function saveStoredTeamMembers(
  members: AgencyMember[],
  action: 'update' | 'add' | 'delete' = 'update',
  memberId?: string
): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_TEAM_MEMBERS, JSON.stringify(members));
      window.dispatchEvent(
        new CustomEvent(TEAM_UPDATED_EVENT, {
          detail: { members, action, memberId },
        })
      );
    } catch (err) {
      console.error('Failed to save team members', err);
    }
  }
}

/**
 * Add a new team member
 */
export function addStoredTeamMember(member: AgencyMember): AgencyMember[] {
  const current = getStoredTeamMembers();
  const updated = [...current.filter((m) => m.id !== member.id), member];
  saveStoredTeamMembers(updated, 'add', member.id);
  dbSaveTeamMember(member);
  return updated;
}

/**
 * Delete a team member and cleanly cascade everywhere:
 * 1. Remove from team members list
 * 2. Purge their daily work logs from localStorage
 * 3. Unassign them from any Kanban cards in localStorage
 * 4. Switch current user persona if the deleted member was active
 * 5. Broadcast TEAM_UPDATED_EVENT with memberId
 */
export function deleteStoredTeamMember(memberId: string): AgencyMember[] {
  const current = getStoredTeamMembers();
  const updated = current.filter((m) => m.id !== memberId);
  dbDeleteTeamMember(memberId);

  if (typeof window !== 'undefined') {
    // 1. Clean up associated work logs
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEY_WORK_LOGS);
      if (savedLogs) {
        const logs: DailyWorkLog[] = JSON.parse(savedLogs);
        const filteredLogs = logs.filter((l) => l.memberId !== memberId);
        localStorage.setItem(STORAGE_KEY_WORK_LOGS, JSON.stringify(filteredLogs));
      }
    } catch (err) {
      console.error('Failed to clean up logs for deleted member', err);
    }

    // 2. Unassign from cards
    try {
      const savedCards = localStorage.getItem(STORAGE_KEY_CARDS);
      if (savedCards) {
        const cards: KanbanCard[] = JSON.parse(savedCards);
        const updatedCards = cards.map((c) => ({
          ...c,
          assignees: (c.assignees || []).filter((a) => a.id !== memberId),
        }));
        localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(updatedCards));
      }
    } catch (err) {
      console.error('Failed to unassign deleted member from cards', err);
    }

    // 3. If currently active user was this member, switch to the first remaining member
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        const currentUser: UserPresence = JSON.parse(savedUser);
        if (currentUser.id === memberId || currentUser.name === current.find((m) => m.id === memberId)?.name) {
          const fallback = updated[0] || {
            id: 'user-admin',
            name: 'Studio Admin',
            role: 'Agency Lead',
            avatarColor: '#0c66e4',
          };
          const newCurrent: UserPresence = {
            ...currentUser,
            id: fallback.id,
            name: fallback.name,
            role: fallback.role,
            avatarColor: fallback.avatarColor,
          };
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newCurrent));
        }
      }
    } catch (err) {
      console.error('Failed to update active user persona', err);
    }
  }

  saveStoredTeamMembers(updated, 'delete', memberId);
  return updated;
}
