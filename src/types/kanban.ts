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
