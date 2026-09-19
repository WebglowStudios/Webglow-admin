'use client';

import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Users,
  Trash2,
  Layers,
  Plus,
  Check,
  Phone,
} from 'lucide-react';
import { KanbanCard, KanbanColumn, Priority, CardTag } from '../types/kanban';
import { AGENCY_MEMBERS } from '../lib/mockData';
import { TagDropdownSelector } from './TagDropdownSelector';

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

  // Lead / Sales fields
  const [phone, setPhone] = useState(card.phone || '');
  const [email, setEmail] = useState(card.email || '');
  const [leadValue, setLeadValue] = useState(card.leadValue || '');

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
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      leadValue: leadValue.trim() || undefined,
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

  // DNP 6 (6th unanswered call attempt)
  const hasDnp6 = tags.some(
    (t) =>
      t.id === 'tag-dnp-6' ||
      t.name.toLowerCase().includes('dnp 6') ||
      t.name.toLowerCase().includes('dnp6')
  );

  return (
    <div
      className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#1d2125] border border-[#384148] shadow-2xl shadow-black/80 overflow-hidden text-[#b6c2cf]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Modal Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#282e33] bg-[#161a1d]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
            Card Details
          </span>
          <span className="text-neutral-500">&bull;</span>
          <select
            value={columnId}
            onChange={(e) => {
              setColumnId(e.target.value);
              handleSave({ columnId: e.target.value });
            }}
            className="bg-[#22272b] border border-[#384148] text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-400"
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
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#282e33] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* DNP 6 Exhausted Lead Alert & Instant Delete */}
        {hasDnp6 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs shadow-md animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div>
                <span className="font-bold text-white">DNP 6 Limit Reached:</span>{' '}
                6 unanswered calls. This lead is exhausted and eligible for deletion.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete exhausted lead "${card.title}" (DNP 6)?`)) {
                  onDeleteCard(card.id);
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow transition-all shrink-0 ml-3"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Lead</span>
            </button>
          </div>
        )}

        {/* Card Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Lead or Task Title (e.g. John Doe, Production Update)"
            className="w-full text-xl font-bold bg-transparent text-white border-b border-transparent hover:border-[#384148] focus:border-sky-400 focus:outline-none pb-1 transition-colors"
          />
        </div>

        {/* Quick Properties Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#22272b]/80 border border-[#282e33]">
          {/* Priority Select */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                const p = e.target.value as Priority;
                setPriority(p);
                handleSave({ priority: p });
              }}
              className="w-full bg-[#161a1d] border border-[#384148] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400 capitalize"
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
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              Due Date / Follow-up
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                handleSave({ dueDate: e.target.value });
              }}
              className="w-full bg-[#161a1d] border border-[#384148] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Assignees Count */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              Assignee / Owner
            </label>
            <div className="flex items-center gap-1">
              {assignees.map((a) => (
                <div
                  key={a.id}
                  title={a.name}
                  style={{ backgroundColor: a.avatarColor }}
                  className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-1 ring-[#161a1d]"
                >
                  {a.name.charAt(0)}
                </div>
              ))}
              {assignees.length === 0 && (
                <span className="text-xs text-neutral-500">Unassigned</span>
              )}
            </div>
          </div>

          {/* Card ID / Created */}
          <div>
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
              Created
            </label>
            <span className="text-xs text-neutral-400">
              {new Date(card.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Lead & Sales Information (Multi-purpose) */}
        <div className="p-3.5 rounded-xl bg-[#22272b]/80 border border-[#282e33]">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Lead & Sales Details (Optional)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Phone */}
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                Phone Number / WhatsApp
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => handleSave()}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#161a1d] border border-[#384148] text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-sky-400"
                />
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:underline text-[10px] font-medium"
                    title="Click to call"
                  >
                    Call
                  </a>
                )}
              </div>
            </div>

            {/* Email / Social Handle */}
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                Email / Social Handle
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="contact@lead.com or @insta"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleSave()}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#161a1d] border border-[#384148] text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-sky-400"
                />
                {email && email.includes('@') && (
                  <a
                    href={`mailto:${email}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-400 hover:underline text-[10px] font-medium"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>

            {/* Deal / Lead Value */}
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                Deal / Lead Value
              </label>
              <input
                type="text"
                placeholder="$2,500"
                value={leadValue}
                onChange={(e) => setLeadValue(e.target.value)}
                onBlur={() => handleSave()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#161a1d] border border-[#384148] text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Tags & Status Dropdown Selector */}
        <TagDropdownSelector
          selectedTags={tags}
          onToggleTag={handleToggleTag}
        />

        {/* Description Section */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Notes & Context</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleSave()}
            placeholder="Add lead history, meeting notes, project requirements, or links..."
            className="w-full p-3 rounded-xl bg-[#22272b] border border-[#384148] text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-sky-400 resize-none transition-colors"
          />
        </div>

        {/* Assignee Members Selection */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Team Members</span>
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
                      ? 'bg-sky-950/40 border-sky-400 text-white ring-1 ring-sky-400/30'
                      : 'bg-[#22272b] border-[#384148] text-neutral-400 hover:text-white hover:bg-[#282e33]'
                  }`}
                >
                  <div
                    style={{ backgroundColor: member.avatarColor }}
                    className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0"
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate text-white">{member.name}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{member.role}</div>
                  </div>
                  {isAssigned && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Checklist & Action Items</span>
            </label>
            {checklist.length > 0 && (
              <span className="text-xs text-neutral-400 font-mono">
                {checklistDone} / {checklist.length} completed
              </span>
            )}
          </div>

          {/* Checklist Progress Bar */}
          {checklist.length > 0 && (
            <div className="w-full bg-[#161a1d] rounded-full h-1.5 mb-3 overflow-hidden">
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
                className="group flex items-center gap-2.5 p-2 rounded-lg bg-[#22272b] border border-[#282e33] hover:border-[#384148] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleChecklistItem(item.id)}
                  className="w-4 h-4 rounded border-[#384148] bg-[#161a1d] text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <span
                  className={`flex-1 text-xs text-neutral-200 leading-snug ${
                    item.completed ? 'line-through text-neutral-500' : ''
                  }`}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition-opacity"
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
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#22272b] border border-[#384148] text-white placeholder-neutral-400 focus:outline-none focus:border-sky-400 transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal Footer Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#282e33] bg-[#161a1d]">
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
          className="px-5 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-xl text-xs font-semibold shadow transition-all"
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
