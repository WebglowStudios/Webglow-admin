'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  ChevronRight,
  User,
  Trash2,
  Eye,
  GripVertical,
  CheckSquare,
  Phone,
  DollarSign,
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
  medium: { label: 'Medium', class: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  low: { label: 'Low', class: 'bg-neutral-600/30 text-neutral-300 border-neutral-600/40' },
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
  const isChecklistComplete = checklistTotal > 0 && checklistDone === checklistTotal;

  // DNP 6 detection
  const hasDnp6 = card.tags?.some(
    (t) =>
      t.id === 'tag-dnp-6' ||
      t.name.toLowerCase().includes('dnp 6') ||
      t.name.toLowerCase().includes('dnp6')
  );

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
      className={`group relative rounded-lg p-2.5 bg-[#22272b] hover:bg-[#282e33] border border-[#22272b] hover:border-[#384148] transition-all duration-150 select-none cursor-pointer shadow-xs ${
        isDragging
          ? 'opacity-35 border-dashed border-sky-400 scale-[0.98]'
          : 'hover:shadow'
      }`}
      onClick={() => onCardClick(card)}
    >
      {/* Live Active Collaborator Viewing Pill */}
      {viewers.length > 0 && (
        <div className="absolute -top-2.5 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-950 border border-sky-400 text-sky-200 text-[10px] font-semibold shadow-md animate-pulse z-10">
          <Eye className="w-3 h-3 text-sky-300" />
          <span>{viewers[0].name.split(' ')[0]} viewing</span>
        </div>
      )}

      {/* Top Header: Priority Badge, Tags & Drag handle & Menu */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
              PRIORITY_STYLES[card.priority].class
            }`}
          >
            {PRIORITY_STYLES[card.priority].label}
          </span>
          {card.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className={`px-1.5 py-0.5 rounded text-[10px] border ${tag.color}`}
            >
              {tag.name}
            </span>
          ))}
          {card.tags?.length > 3 && (
            <span className="text-[10px] text-neutral-400">+{card.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-neutral-400 cursor-grab" />
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-[#1d2125] text-neutral-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {/* Quick action menu */}
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#1d2125] border border-[#384148] shadow-2xl py-1 z-30 text-xs text-neutral-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
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
                        ? 'text-neutral-500 cursor-default bg-black/20'
                        : 'text-neutral-200 hover:bg-[#282e33] hover:text-white'
                    }`}
                  >
                    <span>{col.title}</span>
                    {col.id !== card.columnId && <ChevronRight className="w-3 h-3 text-neutral-400" />}
                  </button>
                ))}
                <div className="border-t border-[#384148] my-1" />
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

      {/* Card Title (with green checkmark indicator if checklist complete, matching screenshot) */}
      <div className="flex items-start gap-1.5 mb-1">
        {isChecklistComplete && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <h3 className="text-sm font-medium text-neutral-100 leading-snug group-hover:text-white transition-colors">
          {card.title}
        </h3>
      </div>

      {/* Card Description Excerpt */}
      {card.description && (
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-2">
          {card.description}
        </p>
      )}

      {/* Lead Info Strip (Phone & Deal Value if present) */}
      {(card.phone || card.leadValue) && (
        <div className="flex items-center gap-2 flex-wrap mb-2 text-[11px]">
          {card.phone && (
            <span
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              <Phone className="w-3 h-3" />
              <a href={`tel:${card.phone}`} className="hover:underline">
                {card.phone}
              </a>
            </span>
          )}
          {card.leadValue && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              <DollarSign className="w-2.5 h-2.5" />
              <span>{card.leadValue.replace('$', '')}</span>
            </span>
          )}
        </div>
      )}

      {/* Checklist Progress Pill if present and not complete */}
      {checklistTotal > 0 && !isChecklistComplete && (
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mb-2">
          <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[10px]">
            {checklistDone}/{checklistTotal}
          </span>
          <div className="flex-1 bg-[#101214] rounded-full h-1 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* DNP6 Quick Delete Trigger for Exhausted Leads */}
      {hasDnp6 && (
        <div className="mb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete exhausted lead "${card.title}" (DNP 6)?`)) {
                onDeleteCard(card.id);
              }
            }}
            className="w-full py-1 px-2 rounded bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            <span>Delete Lead (DNP 6)</span>
          </button>
        </div>
      )}

      {/* Card Footer: Due Date & Assignee Avatars */}
      <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
        {card.dueDate ? (
          <div className="flex items-center gap-1 text-[11px] text-neutral-300">
            <Clock className="w-3 h-3 text-sky-400" />
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
              style={{ backgroundColor: a.avatarColor || '#0c66e4' }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-[#22272b]"
            >
              {a.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {(!card.assignees || card.assignees.length === 0) && (
            <div className="w-5 h-5 rounded-full bg-[#101214] border border-[#384148] flex items-center justify-center text-neutral-500">
              <User className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
