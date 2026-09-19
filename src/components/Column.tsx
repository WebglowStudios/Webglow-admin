'use client';

import React, { useState } from 'react';
import { Plus, MoreHorizontal, Trash2, X, Check } from 'lucide-react';
import { KanbanCard, KanbanColumn, UserPresence } from '../types/kanban';
import { CardItem } from './CardItem';

interface ColumnProps {
  column: KanbanColumn;
  cards: KanbanCard[];
  columns: KanbanColumn[];
  activeUsers: UserPresence[];
  currentUserId: string;
  onCardClick: (card: KanbanCard) => void;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, targetColumnId: string, targetOrder?: number) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  cards,
  columns,
  activeUsers,
  currentUserId,
  onCardClick,
  onAddCard,
  onDeleteCard,
  onMoveCard,
  onDeleteColumn,
}) => {
  const [isOver, setIsOver] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showColMenu, setShowColMenu] = useState(false);

  // Column cards sorted by order
  const columnCards = [...cards].sort((a, b) => a.order - b.order);

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only deactivate if leaving column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onMoveCard(cardId, column.id);
    }
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(column.id, newCardTitle.trim());
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-80 shrink-0 rounded-2xl bg-[#0a1329]/80 border backdrop-blur-md transition-all duration-200 ${
        isOver
          ? 'border-cyan-400/80 bg-blue-950/60 shadow-xl shadow-cyan-950/40 ring-2 ring-cyan-400/20'
          : 'border-blue-900/30'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-blue-900/20">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: column.colorDot || '#3b82f6' }}
          />
          <h2 className="text-sm font-bold text-slate-200 tracking-wide">
            {column.title}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[11px] font-semibold border border-blue-800/40">
            {columnCards.length}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-blue-900/30 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showColMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[#070e22] border border-blue-800/60 shadow-xl py-1 z-30 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onDeleteColumn(column.id);
                  setShowColMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Column</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[140px]">
        {columnCards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            columns={columns}
            activeUsers={activeUsers}
            currentUserId={currentUserId}
            onCardClick={onCardClick}
            onDeleteCard={onDeleteCard}
            onMoveCard={onMoveCard}
          />
        ))}

        {columnCards.length === 0 && !isAddingCard && (
          <div className="flex flex-col items-center justify-center h-28 border border-dashed border-blue-900/40 rounded-xl text-slate-500 text-xs text-center p-3">
            <span>Drop cards here</span>
            <span className="text-[10px] text-slate-600 mt-1">or add a new task below</span>
          </div>
        )}

        {/* Inline Card Creation Form */}
        {isAddingCard && (
          <form
            onSubmit={handleCreateCard}
            className="p-3 rounded-xl bg-[#0e1b3d] border border-cyan-500/40 shadow-lg shadow-cyan-950/40"
          >
            <textarea
              autoFocus
              rows={2}
              placeholder="Enter card title or task description..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard(e);
                }
              }}
              className="w-full p-2 text-xs rounded-lg bg-blue-950/60 border border-blue-800/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="p-1.5 text-slate-400 hover:text-white text-xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-md shadow-cyan-600/30 transition-all"
              >
                <Check className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Column Footer: Add Card Button */}
      {!isAddingCard && (
        <div className="p-2.5 pt-0">
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-blue-900/30 border border-transparent hover:border-blue-700/40 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
        </div>
      )}
    </div>
  );
};
