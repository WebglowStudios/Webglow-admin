'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, User, Trash2, Plus, Users } from 'lucide-react';
import { UserPresence, AgencyMember } from '../types/kanban';
import {
  getStoredTeamMembers,
  deleteStoredTeamMember,
  addStoredTeamMember,
  TEAM_UPDATED_EVENT,
} from '../lib/teamMembers';

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

  // Dynamic team members list
  const [members, setMembers] = useState<AgencyMember[]>(() => getStoredTeamMembers());

  // Add member inline form state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#0c66e4');

  // Keep members in sync with external updates
  useEffect(() => {
    const handleUpdate = () => {
      setMembers(getStoredTeamMembers());
    };
    window.addEventListener(TEAM_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(TEAM_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Update form if currentUser prop changes
  useEffect(() => {
    setName(currentUser.name);
    setRole(currentUser.role);
    setColor(currentUser.avatarColor);
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSelectPreset = (member: AgencyMember) => {
    setName(member.name);
    setRole(member.role);
    setColor(member.avatarColor);
  };

  const handleDeleteMember = (e: React.MouseEvent, member: AgencyMember) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete "${member.name}"? This will remove them from the team and purge their work logs.`
      )
    ) {
      const remaining = deleteStoredTeamMember(member.id);
      setMembers(remaining);
      if (name === member.name) {
        const next = remaining[0] || {
          name: 'Studio Admin',
          role: 'Agency Lead',
          avatarColor: '#0c66e4',
        };
        setName(next.name);
        setRole(next.role);
        setColor(next.avatarColor);
      }
    }
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: AgencyMember = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Team Member',
      avatarColor: newMemberColor,
    };

    const updated = addStoredTeamMember(newMember);
    setMembers(updated);
    handleSelectPreset(newMember);
    setNewMemberName('');
    setNewMemberRole('');
    setIsAddingMember(false);
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
        className="w-full max-w-lg rounded-2xl bg-[#1d2125] border border-[#384148] shadow-2xl p-6 text-[#b6c2cf] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#282e33]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Collaborator Profile & Team</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#282e33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agency Team Members & Preset Personas */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Agency Team Members ({members.length})</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingMember(!isAddingMember)}
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingMember ? 'Cancel' : 'Add Member'}</span>
            </button>
          </div>

          {/* Inline Add Member Form */}
          {isAddingMember && (
            <form
              onSubmit={handleCreateMember}
              className="mb-3 p-3 rounded-xl bg-[#161a1d] border border-sky-500/30 space-y-2.5 animate-in fade-in duration-100"
            >
              <div className="text-xs font-semibold text-white">Register New Team Member</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Sarah Connor)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-[#22272b] border border-[#384148] text-white focus:outline-none focus:border-sky-400"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Sales Lead)"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-[#22272b] border border-[#384148] text-white focus:outline-none focus:border-sky-400"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {AVATAR_COLORS.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewMemberColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newMemberColor === c ? 'scale-125 ring-2 ring-white' : ''
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Save Member
                </button>
              </div>
            </form>
          )}

          {/* Members Grid with Delete Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {members.map((member) => {
              const isSelected = name === member.name;
              return (
                <div
                  key={member.id}
                  onClick={() => handleSelectPreset(member)}
                  className={`group relative flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-400 text-white ring-1 ring-sky-400/30'
                      : 'bg-[#22272b] border-[#384148] text-neutral-400 hover:bg-[#282e33] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      style={{ backgroundColor: member.avatarColor }}
                      className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center shrink-0 shadow-xs"
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate text-white">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">{member.role}</div>
                    </div>
                  </div>

                  {/* Delete Button for User / Preset */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMember(e, member)}
                    title={`Delete ${member.name}`}
                    className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all shrink-0 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          {members.length === 0 && (
            <p className="text-xs text-neutral-500 italic py-2">
              No team members remaining. Add a member above or customize your profile below.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 pt-4 border-t border-[#282e33]">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Active Collaborator Details
          </div>

          {/* Custom Name */}
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1">
              Your Display Name
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
            <div className="flex items-center gap-2 flex-wrap">
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
