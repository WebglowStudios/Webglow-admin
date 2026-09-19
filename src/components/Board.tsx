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
      <div className="flex items-start gap-4 min-w-max pb-6">
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
        <div className="w-80 shrink-0">
          {isAddingCol ? (
            <form
              onSubmit={handleAddColumn}
              className="p-3.5 rounded-2xl bg-[#0a1329]/90 border border-cyan-500/50 shadow-xl shadow-cyan-950/40 backdrop-blur-md"
            >
              <input
                autoFocus
                type="text"
                placeholder="List title (e.g. Blocked, Testing)..."
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-blue-950/60 border border-blue-800/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <div className="flex items-center justify-end gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCol(false);
                    setNewColTitle('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
                >
                  Add List
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCol(true)}
              className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-blue-900/40 hover:border-cyan-500/40 bg-blue-950/20 hover:bg-blue-950/40 text-slate-400 hover:text-cyan-300 text-sm font-semibold flex items-center justify-center gap-2 transition-all group"
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
