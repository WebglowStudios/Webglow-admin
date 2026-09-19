'use client';

import React, { useState } from 'react';
import {
  X,
  Tag,
  CheckSquare,
  Users,
  Trash2,
  Layers,
  Plus,
  Check,
} from 'lucide-react';
import { KanbanCard, KanbanColumn, Priority, CardTag } from '../types/kanban';
import { INITIAL_TAGS, AGENCY_MEMBERS } from '../lib/mockData';

interface CardModalProps {
  card: KanbanCard | null;
  columns: KanbanColumn[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateCard: (updated: KanbanCard) => void;
  onDeleteCard: (cardId: string) => void;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

interface CardModalContentProps {
  card: KanbanCard;
  columns: KanbanColumn[];
  onClose: () => void;
  onUpdateCard: (updated: KanbanCard) => void;
  onDeleteCard: (cardId: string) => void;
}

const CardModalContent: React.FC<CardModalContentProps> = ({
  card,
  columns,
  onClose,
  onUpdateCard,
  onDeleteCard,
}) => {
  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [columnId, setColumnId] = useState(card.columnId);
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [tags, setTags] = useState<CardTag[]>(card.tags || []);
  const [checklist, setChecklist] = useState<KanbanCard['checklist']>(card.checklist || []);
  const [assignees, setAssignees] = useState<KanbanCard['assignees']>(card.assignees || []);
  const [newChecklistText, setNewChecklistText] = useState('');

  const handleSave = (customUpdates: Partial<KanbanCard> = {}) => {
    const updated: KanbanCard = {
      ...card,
      title: title.trim() || card.title,
      description,
      columnId,
      priority,
      dueDate: dueDate || null,
      tags,
      checklist,
      assignees,
      updatedAt: new Date().toISOString(),
      ...customUpdates,
    };
    onUpdateCard(updated);
  };

  const handleTitleBlur = () => {
    handleSave();
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    const nextChecklist = [...checklist, newItem];
    setChecklist(nextChecklist);
    setNewChecklistText('');
    handleSave({ checklist: nextChecklist });
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const nextChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(nextChecklist);
    handleSave({ checklist: nextChecklist });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const nextChecklist = checklist.filter((item) => item.id !== itemId);
    setChecklist(nextChecklist);
    handleSave({ checklist: nextChecklist });
  };

  const handleToggleTag = (tag: CardTag) => {
    const exists = tags.some((t) => t.id === tag.id);
    const nextTags = exists ? tags.filter((t) => t.id !== tag.id) : [...tags, tag];
    setTags(nextTags);
    handleSave({ tags: nextTags });
  };

  const handleToggleAssignee = (member: (typeof AGENCY_MEMBERS)[0]) => {
    const exists = assignees.some((a) => a.id === member.id);
    const nextAssignees = exists
      ? assignees.filter((a) => a.id !== member.id)
      : [...assignees, member];
    setAssignees(nextAssignees);
    handleSave({ assignees: nextAssignees });
  };

  const checklistDone = checklist.filter((c) => c.completed).length;

  return (
    <div
      className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#081129] border border-blue-800/60 shadow-2xl shadow-blue-950 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Modal Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/40 bg-[#060b18]/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Card Details
          </span>
          <span className="text-slate-600">&bull;</span>
          <select
            value={columnId}
            onChange={(e) => {
              setColumnId(e.target.value);
              handleSave({ columnId: e.target.value });
            }}
            className="bg-blue-950/60 border border-blue-800/40 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                In List: {col.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Card Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Task Title"
            className="w-full text-xl font-bold bg-transparent text-white border-b border-transparent hover:border-blue-800/40 focus:border-cyan-400 focus:outline-none pb-1 transition-colors"
          />
        </div>

        {/* Quick Properties Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/40">
          {/* Priority Select */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                const p = e.target.value as Priority;
                setPriority(p);
                handleSave({ priority: p });
              }}
              className="w-full bg-[#081129] border border-blue-800/50 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 capitalize"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                handleSave({ dueDate: e.target.value });
              }}
              className="w-full bg-[#081129] border border-blue-800/50 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Assignees Count */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Assignees
            </label>
            <div className="flex items-center gap-1">
              {assignees.map((a) => (
                <div
                  key={a.id}
                  title={a.name}
                  style={{ backgroundColor: a.avatarColor }}
                  className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-1 ring-blue-900"
                >
                  {a.name.charAt(0)}
                </div>
              ))}
              {assignees.length === 0 && (
                <span className="text-xs text-slate-500">None</span>
              )}
            </div>
          </div>

          {/* Card ID / Created */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Created
            </label>
            <span className="text-xs text-slate-400">
              {new Date(card.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Description</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleSave()}
            placeholder="Add more context, requirements, links, or notes for this task..."
            className="w-full p-3 rounded-xl bg-blue-950/40 border border-blue-900/40 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none transition-colors"
          />
        </div>

        {/* Tags Selection Section */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Tag className="w-4 h-4 text-blue-400" />
            <span>Tags</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INITIAL_TAGS.map((tag) => {
              const isSelected = tags.some((t) => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? `${tag.color} ring-1 ring-cyan-400/40`
                      : 'bg-blue-950/30 border-blue-900/40 text-slate-400 hover:text-white'
                  }`}
                >
                  {tag.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee Members Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Agency Team Members</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {AGENCY_MEMBERS.map((member) => {
              const isAssigned = assignees.some((a) => a.id === member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleToggleAssignee(member)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                    isAssigned
                      ? 'bg-blue-900/30 border-cyan-500/50 text-white ring-1 ring-cyan-500/20'
                      : 'bg-blue-950/20 border-blue-900/40 text-slate-400 hover:text-white hover:bg-blue-900/20'
                  }`}
                >
                  <div
                    style={{ backgroundColor: member.avatarColor }}
                    className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0"
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{member.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{member.role}</div>
                  </div>
                  {isAssigned && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Checklist</span>
            </label>
            {checklist.length > 0 && (
              <span className="text-xs text-slate-400 font-mono">
                {checklistDone} / {checklist.length} completed
              </span>
            )}
          </div>

          {/* Checklist Progress Bar */}
          {checklist.length > 0 && (
            <div className="w-full bg-blue-950 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(checklistDone / checklist.length) * 100}%`,
                }}
              />
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2 mb-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2.5 p-2 rounded-lg bg-blue-950/30 border border-blue-900/30 hover:border-blue-800/60 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleChecklistItem(item.id)}
                  className="w-4 h-4 rounded border-blue-700 bg-blue-950 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                />
                <span
                  className={`flex-1 text-xs text-slate-200 leading-snug ${
                    item.completed ? 'line-through text-slate-500' : ''
                  }`}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Checklist Item Form */}
          <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add an item to the checklist..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-blue-950/50 border border-blue-900/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal Footer Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-blue-900/40 bg-[#060b18]/60">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete "${card.title}"?`)) {
              onDeleteCard(card.id);
              onClose();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Card</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export const CardModal: React.FC<CardModalProps> = ({
  card,
  columns,
  isOpen,
  onClose,
  onUpdateCard,
  onDeleteCard,
}) => {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <CardModalContent
        key={card.id}
        card={card}
        columns={columns}
        onClose={onClose}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />
    </div>
  );
};
