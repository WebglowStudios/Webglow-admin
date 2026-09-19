'use client';

import React, { useState } from 'react';
import { X, Check, User } from 'lucide-react';
import { UserPresence } from '../types/kanban';
import { AGENCY_MEMBERS } from '../lib/mockData';

interface UserIdentityModalProps {
  isOpen: boolean;
  currentUser: UserPresence;
  onClose: () => void;
  onSave: (name: string, role: string, avatarColor: string) => void;
}

const AVATAR_COLORS = [
  '#0c66e4', // Trello Blue
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
];

export const UserIdentityModal: React.FC<UserIdentityModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState(currentUser.role);
  const [color, setColor] = useState(currentUser.avatarColor);

  if (!isOpen) return null;

  const handleSelectPreset = (member: (typeof AGENCY_MEMBERS)[0]) => {
    setName(member.name);
    setRole(member.role);
    setColor(member.avatarColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), role.trim() || 'Collaborator', color);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#1d2125] border border-[#384148] shadow-2xl p-6 text-[#b6c2cf]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#282e33]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Your Collaborator Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#282e33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Agency Preset Personas */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
            Pick an Agency Persona (or customize below)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AGENCY_MEMBERS.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectPreset(member)}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                  name === member.name
                    ? 'bg-sky-950/40 border-sky-400 text-white ring-1 ring-sky-400/30'
                    : 'bg-[#22272b] border-[#384148] text-neutral-400 hover:bg-[#282e33] hover:text-white'
                }`}
              >
                <div
                  style={{ backgroundColor: member.avatarColor }}
                  className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                >
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate text-white">{member.name}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{member.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Custom Name */}
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Leo Vance"
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#22272b] border border-[#384148] text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1">
              Agency Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Designer"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#22272b] border border-[#384148] text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-2">
              Avatar Color
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110'
                  }`}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[#282e33]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-semibold text-xs rounded-xl shadow transition-all"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
