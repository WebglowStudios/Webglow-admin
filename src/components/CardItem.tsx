'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  MoreVertical,
  ChevronRight,
  User,
  Trash2,
  Eye,
  GripVertical,
} from 'lucide-react';
import { KanbanCard, KanbanColumn, Priority, UserPresence } from '../types/kanban';

interface CardItemProps {
  card: KanbanCard;
  columns: KanbanColumn[];
  activeUsers: UserPresence[];
  currentUserId: string;
  onCardClick: (card: KanbanCard) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, targetColumnId: string) => void;
}

const PRIORITY_STYLES: Record<Priority, { label: string; class: string }> = {
  urgent: { label: 'Urgent', class: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  high: { label: 'High', class: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  medium: { label: 'Medium', class: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  low: { label: 'Low', class: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
};

export const CardItem: React.FC<CardItemProps> = ({
  card,
  columns,
  activeUsers,
  currentUserId,
  onCardClick,
  onDeleteCard,
  onMoveCard,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Check if someone else is currently viewing or editing this card
  const viewers = activeUsers.filter(
    (u) => u.viewingCardId === card.id && u.id !== currentUserId
  );

  const checklistTotal = card.checklist?.length || 0;
  const checklistDone = card.checklist?.filter((c) => c.completed).length || 0;

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ cardId: card.id, sourceCol: card.columnId }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative rounded-xl p-3.5 bg-[#0e1b3d]/90 hover:bg-[#13234d] border transition-all duration-200 select-none cursor-pointer ${
        isDragging
          ? 'opacity-40 border-dashed border-blue-400 scale-[0.98]'
          : 'border-blue-900/40 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-950/60'
      }`}
      onClick={() => onCardClick(card)}
    >
      {/* Live Active Collaborator Viewing Pill */}
      {viewers.length > 0 && (
        <div className="absolute -top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10px] font-semibold shadow-lg shadow-cyan-950/80 animate-pulse z-10">
          <Eye className="w-3 h-3 text-cyan-300" />
          <span>{viewers[0].name.split(' ')[0]} viewing</span>
        </div>
      )}

      {/* Top Header: Priority Badge & Drag handle & Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
              PRIORITY_STYLES[card.priority].class
            }`}
          >
            {PRIORITY_STYLES[card.priority].label}
          </span>
          {card.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className={`px-1.5 py-0.5 rounded-md text-[10px] border ${tag.color}`}
            >
              {tag.name}
            </span>
          ))}
          {card.tags?.length > 2 && (
            <span className="text-[10px] text-slate-400">+{card.tags.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-slate-500 cursor-grab" />
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-blue-900/40 text-slate-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Quick action menu */}
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#070e22] border border-blue-800/60 shadow-xl py-1 z-30 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Move to list
                </div>
                {columns.map((col) => (
                  <button
                    key={col.id}
                    disabled={col.id === card.columnId}
                    onClick={() => {
                      onMoveCard(card.id, col.id);
                      setShowMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors ${
                      col.id === card.columnId
                        ? 'text-slate-500 cursor-default'
                        : 'text-slate-300 hover:bg-blue-900/40 hover:text-white'
                    }`}
                  >
                    <span>{col.title}</span>
                    {col.id !== card.columnId && <ChevronRight className="w-3 h-3 text-slate-500" />}
                  </button>
                ))}
                <div className="border-t border-blue-900/40 my-1" />
                <button
                  onClick={() => {
                    onDeleteCard(card.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Card</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Title */}
      <h3 className="text-sm font-semibold text-slate-100 leading-snug mb-1 group-hover:text-cyan-200 transition-colors">
        {card.title}
      </h3>

      {/* Card Description Excerpt */}
      {card.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {card.description}
        </p>
      )}

      {/* Checklist Progress Bar if present */}
      {checklistTotal > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-cyan-400" />
              <span>Checklist</span>
            </span>
            <span className="font-mono text-[10px]">
              {checklistDone}/{checklistTotal}
            </span>
          </div>
          <div className="w-full bg-blue-950 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                checklistDone === checklistTotal
                  ? 'bg-emerald-400'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Footer: Due Date & Assignee Avatars */}
      <div className="flex items-center justify-between pt-2 border-t border-blue-900/30 text-xs text-slate-400">
        {card.dueDate ? (
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{new Date(card.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        ) : (
          <span />
        )}

        <div className="flex -space-x-1.5 ml-auto">
          {card.assignees?.map((a) => (
            <div
              key={a.id}
              title={a.name}
              style={{ backgroundColor: a.avatarColor || '#3b82f6' }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-[#0e1b3d]"
            >
              {a.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {(!card.assignees || card.assignees.length === 0) && (
            <div className="w-5 h-5 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-slate-500">
              <User className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
