'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { KanbanCard, KanbanColumn, UserPresence } from '../types/kanban';
import { Column } from './Column';

interface BoardProps {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  activeUsers: UserPresence[];
  currentUserId: string;
  onCardClick: (card: KanbanCard) => void;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, targetColumnId: string, targetOrder?: number) => void;
  onAddColumn: (title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const Board: React.FC<BoardProps> = ({
  columns,
  cards,
  activeUsers,
  currentUserId,
  onCardClick,
  onAddCard,
  onDeleteCard,
  onMoveCard,
  onAddColumn,
  onDeleteColumn,
}) => {
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    onAddColumn(newColTitle.trim());
    setNewColTitle('');
    setIsAddingCol(false);
  };

  // Sort columns by order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 w-full overflow-x-auto p-4 sm:p-6">
      <div className="flex items-start gap-3.5 min-w-max pb-6">
        {sortedColumns.map((col) => (
          <Column
            key={col.id}
            column={col}
            cards={cards.filter((c) => c.columnId === col.id)}
            columns={columns}
            activeUsers={activeUsers}
            currentUserId={currentUserId}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
            onDeleteCard={onDeleteCard}
            onMoveCard={onMoveCard}
            onDeleteColumn={onDeleteColumn}
          />
        ))}

        {/* Add New Column Container */}
        <div className="w-72 shrink-0">
          {isAddingCol ? (
            <form
              onSubmit={handleAddColumn}
              className="p-3 rounded-xl bg-[#101214] border border-sky-500/60 shadow-2xl"
            >
              <input
                autoFocus
                type="text"
                placeholder="List title (e.g. Blocked, Testing)..."
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#22272b] border border-[#384148] text-white placeholder-neutral-400 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCol(false);
                    setNewColTitle('');
                  }}
                  className="p-1 text-neutral-400 hover:text-white text-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg text-xs font-semibold shadow transition-all"
                >
                  Add List
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCol(true)}
              className="w-full py-3 px-3.5 rounded-xl bg-white/15 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm group border border-white/10"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Add another list</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
