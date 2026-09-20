'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  KanbanCard,
  KanbanColumn,
  UserPresence,
  ActivityEvent,
  BoardFilter,
} from '../types/kanban';
import {
  INITIAL_CARDS,
  INITIAL_COLUMNS,
} from '../lib/mockData';
import {
  getStoredTeamMembers,
  deleteStoredTeamMember,
  TEAM_UPDATED_EVENT,
} from '../lib/teamMembers';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const STORAGE_KEY_CARDS = 'webglow_kanban_cards_v1';
const STORAGE_KEY_COLUMNS = 'webglow_kanban_columns_v1';
const STORAGE_KEY_USER = 'webglow_kanban_user_v1';
const STORAGE_KEY_ACTIVITY = 'webglow_kanban_activity_v1';

function getInitialCards(): KanbanCard[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
  }
  return INITIAL_CARDS;
}

function getInitialColumns(): KanbanColumn[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
  }
  return INITIAL_COLUMNS;
}

function getInitialActivity(): ActivityEvent[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
  }
  return [];
}

function getInitialUser(): UserPresence {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
  }
  const members = getStoredTeamMembers();
  const randomMember =
    members.length > 0
      ? members[Math.floor(Math.random() * members.length)]
      : { name: 'Studio Admin', role: 'Agency Lead', avatarColor: '#0c66e4' };
  return {
    id: `user-${Math.random().toString(36).substring(2, 9)}`,
    name: randomMember.name,
    role: randomMember.role,
    avatarColor: randomMember.avatarColor,
    lastActive: Date.now(),
    viewingCardId: null,
  };
}

export function useRealtimeKanban() {
  const [columns, setColumns] = useState<KanbanColumn[]>(getInitialColumns);
  const [cards, setCards] = useState<KanbanCard[]>(getInitialCards);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>(getInitialActivity);
  const [isSupabaseMode] = useState<boolean>(() => isSupabaseConfigured());
  const [viewingCardId, setViewingCardId] = useState<string | null>(null);

  const [filter, setFilter] = useState<BoardFilter>({
    search: '',
    priority: 'all',
    tag: 'all',
    assignee: 'all',
  });

  const [currentUser, setCurrentUser] = useState<UserPresence>(getInitialUser);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const supabaseRef = useRef(getSupabase());
  const currentUserRef = useRef<UserPresence>(currentUser);

  // Keep ref up to date outside render
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Save current user to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Broadcast helper (BroadcastChannel + Supabase)
  const broadcastEvent = useCallback(
    (type: string, payload: unknown) => {
      // 1. BroadcastChannel (local multiplayer across tabs/windows)
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type,
            payload,
            senderId: currentUserRef.current.id,
          });
        } catch (e) {
          console.warn('BroadcastChannel error', e);
        }
      }

      // 2. Supabase Realtime Broadcast (cross-network multiplayer)
      const supa = supabaseRef.current;
      if (supa) {
        try {
          const channel = supa.channel('webglow-kanban-live');
          channel.send({
            type: 'broadcast',
            event: 'kanban_message',
            payload: {
              type,
              payload,
              senderId: currentUserRef.current.id,
            },
          });
        } catch (e) {
          console.warn('Supabase broadcast error', e);
        }
      }
    },
    []
  );

  // Synchronize cards and currentUser when team members are updated or deleted
  useEffect(() => {
    const handleTeamUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ action?: string; memberId?: string }>;
      if (customEvent.detail?.action === 'delete' && customEvent.detail?.memberId) {
        const delId = customEvent.detail.memberId;
        setActiveUsers((prev) => prev.filter((u) => u.id !== delId));
        broadcastEvent('TEAM_MEMBER_DELETED', { memberId: delId });
      }

      if (typeof window !== 'undefined') {
        const savedCards = localStorage.getItem(STORAGE_KEY_CARDS);
        if (savedCards) {
          try {
            setCards(JSON.parse(savedCards));
          } catch {}
        }
        const savedUser = localStorage.getItem(STORAGE_KEY_USER);
        if (savedUser) {
          try {
            setCurrentUser(JSON.parse(savedUser));
          } catch {}
        }
      }
    };
    window.addEventListener(TEAM_UPDATED_EVENT, handleTeamUpdate);
    return () => {
      window.removeEventListener(TEAM_UPDATED_EVENT, handleTeamUpdate);
    };
  }, [broadcastEvent]);

  // Record an activity item
  const recordActivity = useCallback(
    (action: string, target: string, broadcast = true) => {
      const newEvent: ActivityEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userName: currentUserRef.current.name,
        userColor: currentUserRef.current.avatarColor,
        action,
        target,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setActivityLog((prev) => {
        const next = [newEvent, ...prev.slice(0, 49)];
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(next));
        }
        return next;
      });

      if (broadcast) {
        broadcastEvent('ACTIVITY_LOGGED', newEvent);
      }
    },
    [broadcastEvent]
  );

  // Handle incoming remote events
  const handleIncomingEvent = useCallback(
    (type: string, payload: unknown) => {
      switch (type) {
        case 'USER_HEARTBEAT': {
          const user = payload as UserPresence;
          setActiveUsers((prev) => {
            const idx = prev.findIndex((u) => u.id === user.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...user, lastActive: Date.now() };
              return copy;
            }
            return [...prev, { ...user, lastActive: Date.now() }];
          });
          break;
        }
        case 'CARD_MOVED': {
          const { cardId, targetColumnId, newOrder } = payload as {
            cardId: string;
            targetColumnId: string;
            newOrder: number;
          };
          setCards((prev) => {
            const card = prev.find((c) => c.id === cardId);
            if (!card) return prev;
            const remaining = prev.filter((c) => c.id !== cardId);
            const colCards = remaining
              .filter((c) => c.columnId === targetColumnId)
              .sort((a, b) => a.order - b.order);
            const updatedCard = {
              ...card,
              columnId: targetColumnId,
              order: newOrder,
              updatedAt: new Date().toISOString(),
            };
            colCards.splice(newOrder, 0, updatedCard);
            colCards.forEach((c, i) => {
              c.order = i;
            });
            const nextCards = [
              ...remaining.filter((c) => c.columnId !== targetColumnId),
              ...colCards,
            ];
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(nextCards));
            }
            return nextCards;
          });
          break;
        }
        case 'CARD_UPDATED': {
          const updatedCard = payload as KanbanCard;
          setCards((prev) => {
            const next = prev.map((c) => (c.id === updatedCard.id ? updatedCard : c));
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(next));
            }
            return next;
          });
          break;
        }
        case 'CARD_CREATED': {
          const newCard = payload as KanbanCard;
          setCards((prev) => {
            if (prev.some((c) => c.id === newCard.id)) return prev;
            const next = [newCard, ...prev];
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(next));
            }
            return next;
          });
          break;
        }
        case 'CARD_DELETED': {
          const { cardId } = payload as { cardId: string };
          setCards((prev) => {
            const next = prev.filter((c) => c.id !== cardId);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(next));
            }
            return next;
          });
          break;
        }
        case 'COLUMN_ADDED': {
          const newCol = payload as KanbanColumn;
          setColumns((prev) => {
            if (prev.some((c) => c.id === newCol.id)) return prev;
            const next = [...prev, newCol];
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(next));
            }
            return next;
          });
          break;
        }
        case 'COLUMN_DELETED': {
          const { columnId } = payload as { columnId: string };
          setColumns((prev) => {
            const next = prev.filter((c) => c.id !== columnId);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(next));
            }
            return next;
          });
          break;
        }
        case 'ACTIVITY_LOGGED': {
          const act = payload as ActivityEvent;
          setActivityLog((prev) => {
            if (prev.some((a) => a.id === act.id)) return prev;
            const next = [act, ...prev.slice(0, 49)];
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(next));
            }
            return next;
          });
          break;
        }
        case 'USER_VIEWING_CARD': {
          const { userId, cardId } = payload as { userId: string; cardId: string | null };
          setActiveUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, viewingCardId: cardId } : u))
          );
          break;
        }
        case 'RESET_BOARD': {
          setCards(INITIAL_CARDS);
          setColumns(INITIAL_COLUMNS);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(INITIAL_CARDS));
            localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(INITIAL_COLUMNS));
          }
          break;
        }
        case 'TEAM_MEMBER_DELETED': {
          const { memberId } = payload as { memberId: string };
          if (memberId) {
            deleteStoredTeamMember(memberId);
            setActiveUsers((prev) => prev.filter((u) => u.id !== memberId));
            setCards((prev) =>
              prev.map((c) => ({
                ...c,
                assignees: (c.assignees || []).filter((a) => a.id !== memberId),
              }))
            );
          }
          break;
        }
      }
    },
    []
  );

  // Setup Realtime Sync Engine (BroadcastChannel + Supabase)
  useEffect(() => {
    // 1. BroadcastChannel setup
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('webglow_kanban_sync');
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const data = event.data;
        if (!data || data.senderId === currentUserRef.current.id) {
          return;
        }
        handleIncomingEvent(data.type, data.payload);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }

    // 2. Supabase Realtime setup if configured
    const supa = supabaseRef.current;
    let supaChannel: RealtimeChannel | null = null;

    if (supa) {
      supaChannel = supa.channel('webglow-kanban-live', {
        config: {
          presence: {
            key: currentUserRef.current.id,
          },
        },
      });

      supaChannel
        .on('broadcast', { event: 'kanban_message' }, ({ payload }) => {
          if (payload && payload.senderId !== currentUserRef.current.id) {
            handleIncomingEvent(payload.type, payload.payload);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = supaChannel?.presenceState<{
            id: string;
            name: string;
            role: string;
            avatarColor: string;
            viewingCardId: string | null;
          }>();
          if (state) {
            const users: UserPresence[] = [];
            Object.values(state).forEach((presences) => {
              presences.forEach((p) => {
                users.push({
                  id: p.id,
                  name: p.name,
                  role: p.role,
                  avatarColor: p.avatarColor,
                  lastActive: Date.now(),
                  viewingCardId: p.viewingCardId,
                });
              });
            });
            setActiveUsers(users);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await supaChannel?.track({
              id: currentUserRef.current.id,
              name: currentUserRef.current.name,
              role: currentUserRef.current.role,
              avatarColor: currentUserRef.current.avatarColor,
              viewingCardId: currentUserRef.current.viewingCardId,
            });
          }
        });
    }

    // Heartbeat for Local BroadcastChannel presence
    const heartbeatInterval = setInterval(() => {
      broadcastEvent('USER_HEARTBEAT', {
        id: currentUserRef.current.id,
        name: currentUserRef.current.name,
        role: currentUserRef.current.role,
        avatarColor: currentUserRef.current.avatarColor,
        viewingCardId: currentUserRef.current.viewingCardId,
        lastActive: Date.now(),
      });

      // Prune inactive users (older than 8 seconds)
      setActiveUsers((prev) =>
        prev.filter((u) => u.id === currentUserRef.current.id || Date.now() - u.lastActive < 8000)
      );
    }, 2500);

    // Initial broadcast of presence
    broadcastEvent('USER_HEARTBEAT', {
      id: currentUserRef.current.id,
      name: currentUserRef.current.name,
      role: currentUserRef.current.role,
      avatarColor: currentUserRef.current.avatarColor,
      viewingCardId: currentUserRef.current.viewingCardId,
      lastActive: Date.now(),
    });

    return () => {
      clearInterval(heartbeatInterval);
      if (bc) {
        try {
          bc.close();
        } catch {
          // ignore
        }
      }
      if (supaChannel && supa) {
        supa.removeChannel(supaChannel);
      }
    };
  }, [broadcastEvent, handleIncomingEvent]);

  // Sync state changes to localStorage
  const saveCardsLocally = (newCards: KanbanCard[]) => {
    setCards(newCards);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(newCards));
    }
  };

  const saveColumnsLocally = (newCols: KanbanColumn[]) => {
    setColumns(newCols);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(newCols));
    }
  };

  // Actions
  const moveCard = useCallback(
    (cardId: string, targetColumnId: string, targetOrder?: number) => {
      setCards((prev) => {
        const card = prev.find((c) => c.id === cardId);
        if (!card) return prev;

        const targetColumn = columns.find((c) => c.id === targetColumnId);
        const sourceColName = columns.find((c) => c.id === card.columnId)?.title || 'Column';
        const targetColName = targetColumn?.title || 'Column';

        const remaining = prev.filter((c) => c.id !== cardId);
        const colCards = remaining
          .filter((c) => c.columnId === targetColumnId)
          .sort((a, b) => a.order - b.order);

        const newOrder = typeof targetOrder === 'number' ? targetOrder : colCards.length;

        const updatedCard: KanbanCard = {
          ...card,
          columnId: targetColumnId,
          order: newOrder,
          updatedAt: new Date().toISOString(),
        };

        colCards.splice(newOrder, 0, updatedCard);
        colCards.forEach((c, idx) => {
          c.order = idx;
        });

        const nextCards = [
          ...remaining.filter((c) => c.columnId !== targetColumnId),
          ...colCards,
        ];

        saveCardsLocally(nextCards);

        broadcastEvent('CARD_MOVED', {
          cardId,
          targetColumnId,
          newOrder,
        });

        if (card.columnId !== targetColumnId) {
          recordActivity('moved', `"${card.title}" to ${targetColName}`);
        } else {
          recordActivity('reordered', `"${card.title}" in ${sourceColName}`);
        }

        return nextCards;
      });
    },
    [columns, broadcastEvent, recordActivity]
  );

  const updateCard = useCallback(
    (updatedCard: KanbanCard) => {
      setCards((prev) => {
        const nextCards = prev.map((c) => (c.id === updatedCard.id ? updatedCard : c));
        saveCardsLocally(nextCards);
        broadcastEvent('CARD_UPDATED', updatedCard);
        recordActivity('updated', `"${updatedCard.title}"`);
        return nextCards;
      });
    },
    [broadcastEvent, recordActivity]
  );

  const addCard = useCallback(
    (columnId: string, title: string) => {
      const colCards = cards.filter((c) => c.columnId === columnId);
      const colName = columns.find((c) => c.id === columnId)?.title || 'Column';
      const newCard: KanbanCard = {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        columnId,
        title: title.trim(),
        description: '',
        priority: 'medium',
        tags: [],
        assignees: [
          {
            id: currentUserRef.current.id,
            name: currentUserRef.current.name,
            avatarColor: currentUserRef.current.avatarColor,
            role: currentUserRef.current.role,
          },
        ],
        dueDate: null,
        checklist: [],
        order: colCards.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextCards = [...cards, newCard];
      saveCardsLocally(nextCards);
      broadcastEvent('CARD_CREATED', newCard);
      recordActivity('created', `"${newCard.title}" in ${colName}`);
      return newCard;
    },
    [cards, columns, broadcastEvent, recordActivity]
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      const nextCards = cards.filter((c) => c.id !== cardId);
      saveCardsLocally(nextCards);
      broadcastEvent('CARD_DELETED', { cardId });
      if (card) {
        recordActivity('deleted', `"${card.title}"`);
      }
    },
    [cards, broadcastEvent, recordActivity]
  );

  const addColumn = useCallback(
    (title: string) => {
      const dotColors = ['#3b82f6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'];
      const newCol: KanbanColumn = {
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        order: columns.length,
        colorDot: dotColors[columns.length % dotColors.length],
      };
      const nextCols = [...columns, newCol];
      saveColumnsLocally(nextCols);
      broadcastEvent('COLUMN_ADDED', newCol);
      recordActivity('added list', `"${newCol.title}"`);
    },
    [columns, broadcastEvent, recordActivity]
  );

  const deleteColumn = useCallback(
    (columnId: string) => {
      const col = columns.find((c) => c.id === columnId);
      const nextCols = columns.filter((c) => c.id !== columnId);
      const nextCards = cards.filter((c) => c.columnId !== columnId);
      saveColumnsLocally(nextCols);
      saveCardsLocally(nextCards);
      broadcastEvent('COLUMN_DELETED', { columnId });
      if (col) {
        recordActivity('removed list', `"${col.title}"`);
      }
    },
    [columns, cards, broadcastEvent, recordActivity]
  );

  const setCardViewing = useCallback(
    (cardId: string | null) => {
      setViewingCardId(cardId);
      setCurrentUser((prev) => ({
        ...prev,
        viewingCardId: cardId,
      }));
      broadcastEvent('USER_VIEWING_CARD', {
        userId: currentUserRef.current.id,
        cardId,
      });
    },
    [broadcastEvent]
  );

  const updateUserIdentity = useCallback(
    (name: string, role: string, avatarColor: string) => {
      const updated: UserPresence = {
        ...currentUser,
        name: name.trim() || 'Collaborator',
        role: role.trim() || 'Team Member',
        avatarColor,
        lastActive: Date.now(),
      };
      setCurrentUser(updated);
      recordActivity('joined as', `${updated.name} (${updated.role})`);
    },
    [currentUser, recordActivity]
  );

  const resetToDemoData = useCallback(() => {
    saveCardsLocally(INITIAL_CARDS);
    saveColumnsLocally(INITIAL_COLUMNS);
    recordActivity('reset board', 'to default agency template');
    broadcastEvent('RESET_BOARD', null);
  }, [recordActivity, broadcastEvent]);

  // Filtered Cards
  const filteredCards = cards.filter((card) => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchDesc = (card.description || '').toLowerCase().includes(q);
      const matchTag = card.tags.some((t) => t.name.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }
    if (filter.priority !== 'all' && card.priority !== filter.priority) {
      return false;
    }
    if (filter.tag !== 'all' && !card.tags.some((t) => t.id === filter.tag)) {
      return false;
    }
    if (filter.assignee !== 'all' && !card.assignees.some((a) => a.id === filter.assignee)) {
      return false;
    }
    return true;
  });

  return {
    columns,
    cards: filteredCards,
    allCards: cards,
    activeUsers,
    currentUser,
    activityLog,
    isSupabaseMode,
    viewingCardId,
    filter,
    setFilter,
    moveCard,
    updateCard,
    addCard,
    deleteCard,
    addColumn,
    deleteColumn,
    setCardViewing,
    updateUserIdentity,
    resetToDemoData,
  };
}
