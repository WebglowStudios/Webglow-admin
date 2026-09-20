export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CardTag {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
}

export interface UserPresence {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  lastActive: number;
  viewingCardId?: string | null;
  activeColumnId?: string | null;
}

export interface AgencyMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
}

export interface TagOption {
  id: string;
  name: string;
  color: string;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  priority: Priority;
  tags: CardTag[];
  assignees: {
    id: string;
    name: string;
    avatarColor: string;
    role?: string;
  }[];
  dueDate?: string | null;
  checklist: ChecklistItem[];
  order: number;
  createdAt: string;
  updatedAt: string;

  // Multi-purpose Lead / Sales & CRM fields
  phone?: string;
  email?: string;
  leadValue?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  colorDot?: string;
}

export interface ActivityEvent {
  id: string;
  userName: string;
  userColor: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface BoardFilter {
  search: string;
  priority: Priority | 'all';
  tag: string | 'all';
  assignee: string | 'all';
}

export type ActiveNavView = 'board' | 'attendance' | 'clients';

export type AttendanceStatus = 'present' | 'remote' | 'late' | 'half-day' | 'absent';

export interface DailyWorkLog {
  id: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  avatarColor: string;
  date: string; // YYYY-MM-DD
  isPresent: boolean; // Are you present / willing to work today?
  hoursWorked: number; // Hours of effort put in
  tasksDone: string; // What did you do today?
  dmsSent: number; // Number of DMs sent
  callsDone: number; // Number of calls done
  clientsCount?: number; // Optional legacy field
  outcome?: string; // Optional legacy field
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  avatarColor: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  workMode: 'office' | 'remote';
  notes?: string;
}

export type ClientType = 'production' | 'maintenance' | 'both';
export type ClientStatus = 'active' | 'completed' | 'in_progress' | 'paused';

export interface ClientRecord {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  services: string;
  revenueCollected: number;
  monthlyRetainer?: number;
  closedDate?: string; // YYYY-MM-DD - Date the client was closed
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  startDate?: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
