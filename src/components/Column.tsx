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
      className={`flex flex-col w-72 shrink-0 rounded-xl bg-[#101214] border border-[#22272b] shadow-xl transition-all duration-150 ${
        isOver
          ? 'border-sky-400/80 bg-[#161a1d] ring-2 ring-sky-400/30'
          : 'hover:border-[#384148]'
      }`}
    >
      {/* Column Header (Trello style) */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: column.colorDot || '#388bff' }}
          />
          <h2 className="text-sm font-semibold text-neutral-200 truncate">
            {column.title}
          </h2>
          <span className="text-xs text-neutral-400 font-normal">
            {columnCards.length}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#22272b] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showColMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColMenu(false);
                }}
              />
              <div
                className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[#1d2125] border border-[#384148] shadow-2xl py-1 z-30 text-xs text-neutral-200"
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
            </>
          )}
        </div>
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-175px)] min-h-[80px]">
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
          <div className="flex flex-col items-center justify-center h-20 border border-dashed border-[#22272b] rounded-lg text-neutral-500 text-xs text-center p-2">
            <span>Drop cards here</span>
          </div>
        )}

        {/* Inline Card Creation Form */}
        {isAddingCard && (
          <form
            onSubmit={handleCreateCard}
            className="p-2 rounded-lg bg-[#22272b] border border-sky-500 shadow-md"
          >
            <textarea
              autoFocus
              rows={2}
              placeholder="Enter a title for this card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard(e);
                }
              }}
              className="w-full p-1.5 text-xs rounded bg-[#101214] border border-[#384148] text-white placeholder-neutral-400 focus:outline-none focus:border-sky-400 resize-none transition-colors"
            />
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="p-1 text-neutral-400 hover:text-white text-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded text-xs font-semibold flex items-center gap-1 shadow transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Column Footer: Add Card Button (Trello style) */}
      {!isAddingCard && (
        <div className="px-2 pb-2">
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full py-1.5 px-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#22272b] flex items-center gap-1.5 transition-all text-left"
          >
            <Plus className="w-4 h-4" />
            <span>Add a card</span>
          </button>
        </div>
      )}
    </div>
  );
};
