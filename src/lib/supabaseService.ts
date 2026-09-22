import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  KanbanCard,
  KanbanColumn,
  DailyWorkLog,
  ClientRecord,
  AgencyMember,
  CardTag,
  ActivityEvent,
} from '../types/kanban';
import {
  INITIAL_CARDS,
  INITIAL_COLUMNS,
  INITIAL_WORK_LOGS,
  INITIAL_CLIENTS,
  AGENCY_MEMBERS,
  DEFAULT_TAG_OPTIONS,
} from './mockData';

const DEFAULT_BOARD_ID = 'default-board';

// ==============================================================================
// 1. Database Row <-> Frontend TypeScript Type Mappers
// ==============================================================================

export function mapDbCardToCard(row: Record<string, unknown>): KanbanCard {
  return {
    id: String(row.id),
    columnId: String(row.column_id),
    title: String(row.title || ''),
    description: String(row.description || ''),
    priority: (row.priority as KanbanCard['priority']) || 'medium',
    tags: Array.isArray(row.tags) ? (row.tags as CardTag[]) : [],
    assignees: Array.isArray(row.assignees) ? (row.assignees as KanbanCard['assignees']) : [],
    dueDate: row.due_date ? String(row.due_date) : null,
    checklist: Array.isArray(row.checklist) ? (row.checklist as KanbanCard['checklist']) : [],
    order: typeof row.order_index === 'number' ? row.order_index : 0,
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    leadValue: String(row.lead_value || ''),
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

export function mapCardToDb(card: KanbanCard, boardId = DEFAULT_BOARD_ID): Record<string, unknown> {
  return {
    id: card.id,
    column_id: card.columnId,
    board_id: boardId,
    title: card.title,
    description: card.description || '',
    priority: card.priority || 'medium',
    tags: card.tags || [],
    assignees: card.assignees || [],
    due_date: card.dueDate || null,
    checklist: card.checklist || [],
    order_index: typeof card.order === 'number' ? card.order : 0,
    phone: card.phone || '',
    email: card.email || '',
    lead_value: card.leadValue || '',
    created_at: card.createdAt || new Date().toISOString(),
    updated_at: card.updatedAt || new Date().toISOString(),
  };
}

export function mapDbColumnToColumn(row: Record<string, unknown>): KanbanColumn {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    order: typeof row.order_index === 'number' ? row.order_index : 0,
    colorDot: row.color_dot ? String(row.color_dot) : '#3b82f6',
  };
}

export function mapColumnToDb(col: KanbanColumn, boardId = DEFAULT_BOARD_ID): Record<string, unknown> {
  return {
    id: col.id,
    board_id: boardId,
    title: col.title,
    order_index: typeof col.order === 'number' ? col.order : 0,
    color_dot: col.colorDot || '#3b82f6',
  };
}

export function mapDbLogToDailyWorkLog(row: Record<string, unknown>): DailyWorkLog {
  return {
    id: String(row.id),
    memberId: String(row.member_id || ''),
    memberName: String(row.member_name || ''),
    memberRole: String(row.member_role || ''),
    avatarColor: String(row.avatar_color || '#3b82f6'),
    date: String(row.date || ''),
    isPresent: row.is_present !== false,
    hoursWorked: Number(row.hours_worked) || 0,
    tasksDone: String(row.tasks_done || ''),
    logType: (row.log_type as 'developer' | 'sales') || 'sales',
    dmsSent: Number(row.dms_sent) || 0,
    callsDone: Number(row.calls_done) || 0,
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
  };
}

export function mapDailyWorkLogToDb(log: DailyWorkLog): Record<string, unknown> {
  return {
    id: log.id,
    member_id: log.memberId,
    member_name: log.memberName,
    member_role: log.memberRole,
    avatar_color: log.avatarColor || '#3b82f6',
    date: log.date,
    is_present: log.isPresent ?? true,
    hours_worked: Number(log.hoursWorked) || 0,
    tasks_done: log.tasksDone || '',
    log_type: log.logType || 'sales',
    dms_sent: Number(log.dmsSent) || 0,
    calls_done: Number(log.callsDone) || 0,
    created_at: log.createdAt || new Date().toISOString(),
  };
}

export function mapDbClientToClientRecord(row: Record<string, unknown>): ClientRecord {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    type: (row.type as ClientRecord['type']) || 'production',
    status: (row.status as ClientRecord['status']) || 'active',
    services: String(row.services || ''),
    revenueCollected: Number(row.revenue_collected) || 0,
    monthlyRetainer: row.monthly_retainer ? Number(row.monthly_retainer) : 0,
    closedDate: row.closed_date ? String(row.closed_date) : undefined,
    contactName: row.contact_name ? String(row.contact_name) : undefined,
    contactEmail: row.contact_email ? String(row.contact_email) : undefined,
    contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
    startDate: row.start_date ? String(row.start_date) : undefined,
    completionDate: row.completion_date ? String(row.completion_date) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

export function mapClientToDb(client: ClientRecord): Record<string, unknown> {
  return {
    id: client.id,
    name: client.name,
    type: client.type,
    status: client.status,
    services: client.services || '',
    revenue_collected: Number(client.revenueCollected) || 0,
    monthly_retainer: Number(client.monthlyRetainer) || 0,
    closed_date: client.closedDate || null,
    contact_name: client.contactName || null,
    contact_email: client.contactEmail || null,
    contact_phone: client.contactPhone || null,
    start_date: client.startDate || null,
    completion_date: client.completionDate || null,
    notes: client.notes || '',
    created_at: client.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function mapDbMemberToAgencyMember(row: Record<string, unknown>): AgencyMember {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    role: String(row.role || 'Collaborator'),
    avatarColor: String(row.avatar_color || '#0c66e4'),
  };
}

export function mapAgencyMemberToDb(member: AgencyMember): Record<string, unknown> {
  return {
    id: member.id,
    name: member.name,
    role: member.role || 'Collaborator',
    avatar_color: member.avatarColor || '#0c66e4',
  };
}

export function mapDbActivityToActivityEvent(row: Record<string, unknown>): ActivityEvent {
  const createdAt = row.created_at ? new Date(String(row.created_at)) : new Date();
  return {
    id: String(row.id),
    userName: String(row.user_name || 'Collaborator'),
    userColor: String(row.user_color || '#0c66e4'),
    action: String(row.action || ''),
    target: String(row.target || ''),
    timestamp: createdAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

// ==============================================================================
// 2. Initial Setup & Cloud Seeding Functions
// ==============================================================================

/**
 * Ensure default board and initial columns exist in Supabase
 */
export async function ensureInitialBoardAndColumns(): Promise<KanbanColumn[]> {
  const supa = getSupabase();
  if (!supa) return INITIAL_COLUMNS;

  try {
    // 1. Ensure board exists
    await supa.from('boards').upsert(
      {
        id: DEFAULT_BOARD_ID,
        title: 'Webglow Agency Board',
        description: 'Real-time collaborative production board',
      },
      { onConflict: 'id' }
    );

    // 2. Fetch columns
    const { data: cols, error: colsErr } = await supa
      .from('columns')
      .select('*')
      .eq('board_id', DEFAULT_BOARD_ID)
      .order('order_index', { ascending: true });

    if (!colsErr && cols && cols.length > 0) {
      return cols.map(mapDbColumnToColumn);
    }

    // 3. Seed columns if empty
    const dbCols = INITIAL_COLUMNS.map((c) => mapColumnToDb(c, DEFAULT_BOARD_ID));
    const { data: insertedCols, error: insertErr } = await supa
      .from('columns')
      .upsert(dbCols, { onConflict: 'id' })
      .select('*');

    if (!insertErr && insertedCols && insertedCols.length > 0) {
      return insertedCols.map(mapDbColumnToColumn);
    }
  } catch (err) {
    console.error('Error initializing board & columns in Supabase:', err);
  }

  return INITIAL_COLUMNS;
}

/**
 * Fetch cards from Supabase, or seed initial cards if table is empty
 */
export async function loadOrSeedCards(): Promise<KanbanCard[]> {
  const supa = getSupabase();
  if (!supa) return INITIAL_CARDS;

  try {
    const { data: cards, error } = await supa
      .from('cards')
      .select('*')
      .eq('board_id', DEFAULT_BOARD_ID)
      .order('order_index', { ascending: true });

    if (!error && cards && cards.length > 0) {
      return cards.map(mapDbCardToCard);
    }

    // Table is empty, seed INITIAL_CARDS
    const dbCards = INITIAL_CARDS.map((c) => mapCardToDb(c, DEFAULT_BOARD_ID));
    const { data: inserted, error: insertErr } = await supa
      .from('cards')
      .upsert(dbCards, { onConflict: 'id' })
      .select('*');

    if (!insertErr && inserted && inserted.length > 0) {
      return inserted.map(mapDbCardToCard);
    }
  } catch (err) {
    console.error('Error loading or seeding cards in Supabase:', err);
  }

  return INITIAL_CARDS;
}

/**
 * Fetch work logs from Supabase, or seed initial logs if table is empty
 */
export async function loadOrSeedWorkLogs(): Promise<DailyWorkLog[]> {
  const supa = getSupabase();
  if (!supa) return INITIAL_WORK_LOGS;

  try {
    const { data: logs, error } = await supa
      .from('daily_work_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && logs && logs.length > 0) {
      return logs.map(mapDbLogToDailyWorkLog);
    }

    // Seed INITIAL_WORK_LOGS
    const dbLogs = INITIAL_WORK_LOGS.map(mapDailyWorkLogToDb);
    const { data: inserted, error: insertErr } = await supa
      .from('daily_work_logs')
      .upsert(dbLogs, { onConflict: 'id' })
      .select('*');

    if (!insertErr && inserted && inserted.length > 0) {
      return inserted.map(mapDbLogToDailyWorkLog);
    }
  } catch (err) {
    console.error('Error loading or seeding daily work logs in Supabase:', err);
  }

  return INITIAL_WORK_LOGS;
}

/**
 * Fetch clients from Supabase, or seed initial clients if table is empty
 */
export async function loadOrSeedClients(): Promise<ClientRecord[]> {
  const supa = getSupabase();
  if (!supa) return INITIAL_CLIENTS;

  try {
    const { data: clients, error } = await supa
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && clients && clients.length > 0) {
      return clients.map(mapDbClientToClientRecord);
    }

    // Seed INITIAL_CLIENTS
    const dbClients = INITIAL_CLIENTS.map(mapClientToDb);
    const { data: inserted, error: insertErr } = await supa
      .from('clients')
      .upsert(dbClients, { onConflict: 'id' })
      .select('*');

    if (!insertErr && inserted && inserted.length > 0) {
      return inserted.map(mapDbClientToClientRecord);
    }
  } catch (err) {
    console.error('Error loading or seeding clients in Supabase:', err);
  }

  return INITIAL_CLIENTS;
}

/**
 * Fetch team members from Supabase, or seed default members if table is empty
 */
export async function loadOrSeedTeamMembers(): Promise<AgencyMember[]> {
  const supa = getSupabase();
  if (!supa) return AGENCY_MEMBERS.slice(0, 3);

  try {
    const { data: members, error } = await supa
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && members && members.length > 0) {
      return members.map(mapDbMemberToAgencyMember);
    }
  } catch (err) {
    console.error('Error loading team members from Supabase:', err);
  }

  return AGENCY_MEMBERS.slice(0, 3);
}

/**
 * Fetch tag options from Supabase, or seed default tags if empty
 */
export async function loadOrSeedTagOptions(): Promise<CardTag[]> {
  const supa = getSupabase();
  if (!supa) return DEFAULT_TAG_OPTIONS;

  try {
    const { data: tags, error } = await supa.from('tag_options').select('*');
    if (!error && tags && tags.length > 0) {
      return tags.map((t) => ({ id: String(t.id), name: String(t.name), color: String(t.color) }));
    }

    // Seed default tag options
    const dbTags = DEFAULT_TAG_OPTIONS.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
    }));
    await supa.from('tag_options').upsert(dbTags, { onConflict: 'id' });
  } catch (err) {
    console.error('Error loading or seeding tag options in Supabase:', err);
  }

  return DEFAULT_TAG_OPTIONS;
}

/**
 * Fetch activity logs from Supabase
 */
export async function loadActivityLogs(): Promise<ActivityEvent[]> {
  const supa = getSupabase();
  if (!supa) return [];

  try {
    const { data, error } = await supa
      .from('activity_logs')
      .select('*')
      .eq('board_id', DEFAULT_BOARD_ID)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      return data.map(mapDbActivityToActivityEvent);
    }
  } catch (err) {
    console.error('Error loading activity logs from Supabase:', err);
  }

  return [];
}

// ==============================================================================
// 3. Persistent CRUD Operations
// ==============================================================================

// --- Cards ---
export async function dbSaveCard(card: KanbanCard, boardId = DEFAULT_BOARD_ID): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('cards').upsert(mapCardToDb(card, boardId), { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase dbSaveCard error:', e);
  }
}

export async function dbDeleteCard(cardId: string): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('cards').delete().eq('id', cardId);
  } catch (e) {
    console.warn('Supabase dbDeleteCard error:', e);
  }
}

export async function dbBatchUpdateCards(cards: KanbanCard[], boardId = DEFAULT_BOARD_ID): Promise<void> {
  const supa = getSupabase();
  if (!supa || cards.length === 0) return;
  try {
    const dbRows = cards.map((c) => mapCardToDb(c, boardId));
    await supa.from('cards').upsert(dbRows, { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase dbBatchUpdateCards error:', e);
  }
}

// --- Columns ---
export async function dbSaveColumn(column: KanbanColumn, boardId = DEFAULT_BOARD_ID): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('columns').upsert(mapColumnToDb(column, boardId), { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase dbSaveColumn error:', e);
  }
}

export async function dbDeleteColumn(columnId: string): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('columns').delete().eq('id', columnId);
  } catch (e) {
    console.warn('Supabase dbDeleteColumn error:', e);
  }
}

// --- Daily Work Logs / Attendance ---
export async function dbSaveWorkLog(log: DailyWorkLog): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('daily_work_logs').upsert(mapDailyWorkLogToDb(log), { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase dbSaveWorkLog error:', e);
  }
}

export async function dbDeleteWorkLog(logId: string): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('daily_work_logs').delete().eq('id', logId);
  } catch (e) {
    console.warn('Supabase dbDeleteWorkLog error:', e);
  }
}

export async function dbResetWorkLogs(): Promise<DailyWorkLog[]> {
  const supa = getSupabase();
  if (!supa) return INITIAL_WORK_LOGS;
  try {
    // Delete all existing logs
    await supa.from('daily_work_logs').delete().neq('id', 'non-existent-id');
    // Reinsert initial logs
    const dbLogs = INITIAL_WORK_LOGS.map(mapDailyWorkLogToDb);
    const { data } = await supa.from('daily_work_logs').insert(dbLogs).select('*');
    if (data && data.length > 0) {
      return data.map(mapDbLogToDailyWorkLog);
    }
  } catch (e) {
    console.warn('Supabase dbResetWorkLogs error:', e);
  }
  return INITIAL_WORK_LOGS;
}

// --- Clients ---
export async function dbSaveClient(client: ClientRecord): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('clients').upsert(mapClientToDb(client), { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase dbSaveClient error:', e);
  }
}

export async function dbDeleteClient(clientId: string): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('clients').delete().eq('id', clientId);
  } catch (e) {
    console.warn('Supabase dbDeleteClient error:', e);
  }
}

// --- Team Members ---
export async function dbSaveTeamMember(member: AgencyMember): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('team_members').upsert(mapAgencyMemberToDb(member), { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase dbSaveTeamMember error:', e);
  }
}

export async function dbDeleteTeamMember(memberId: string): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('team_members').delete().eq('id', memberId);
  } catch (e) {
    console.warn('Supabase dbDeleteTeamMember error:', e);
  }
}

// --- Tag Options ---
export async function dbSaveTagOption(tag: CardTag): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('tag_options').upsert(
      {
        id: tag.id,
        name: tag.name,
        color: tag.color,
      },
      { onConflict: 'id' }
    );
  } catch (e) {
    console.warn('Supabase dbSaveTagOption error:', e);
  }
}

// --- Activity Logs ---
export async function dbLogActivity(event: ActivityEvent, boardId = DEFAULT_BOARD_ID): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  try {
    await supa.from('activity_logs').insert({
      id: event.id,
      board_id: boardId,
      user_name: event.userName,
      user_color: event.userColor,
      action: event.action,
      target: event.target,
    });
  } catch (e) {
    console.warn('Supabase dbLogActivity error:', e);
  }
}

// --- Board Reset ---
export async function dbResetBoardToDefault(): Promise<{ cards: KanbanCard[]; columns: KanbanColumn[] }> {
  const supa = getSupabase();
  if (!supa) return { cards: INITIAL_CARDS, columns: INITIAL_COLUMNS };

  try {
    // 1. Delete all cards
    await supa.from('cards').delete().eq('board_id', DEFAULT_BOARD_ID);

    // 2. Delete all columns
    await supa.from('columns').delete().eq('board_id', DEFAULT_BOARD_ID);

    // 3. Reinsert default columns
    const dbCols = INITIAL_COLUMNS.map((c) => mapColumnToDb(c, DEFAULT_BOARD_ID));
    await supa.from('columns').insert(dbCols);

    // 4. Reinsert default cards
    const dbCards = INITIAL_CARDS.map((c) => mapCardToDb(c, DEFAULT_BOARD_ID));
    await supa.from('cards').insert(dbCards);

    return { cards: INITIAL_CARDS, columns: INITIAL_COLUMNS };
  } catch (e) {
    console.warn('Supabase dbResetBoardToDefault error:', e);
    return { cards: INITIAL_CARDS, columns: INITIAL_COLUMNS };
  }
}
