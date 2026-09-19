'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  History,
  Database,
  Share2,
  Check,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { UserPresence, BoardFilter, Priority } from '../types/kanban';
import { INITIAL_TAGS } from '../lib/mockData';

interface HeaderProps {
  currentUser: UserPresence;
  activeUsers: UserPresence[];
  filter: BoardFilter;
  setFilter: React.Dispatch<React.SetStateAction<BoardFilter>>;
  isSupabaseMode: boolean;
  activityCount: number;
  onOpenIdentityModal: () => void;
  onToggleActivityDrawer: () => void;
  onOpenSetupModal: () => void;
  onResetBoard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeUsers,
  filter,
  setFilter,
  isSupabaseMode,
  activityCount,
  onOpenIdentityModal,
  onToggleActivityDrawer,
  onOpenSetupModal,
  onResetBoard,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Combine active users ensuring current user is present
  const allOnline = [
    currentUser,
    ...activeUsers.filter((u) => u.id !== currentUser.id),
  ];

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-blue-900/40 bg-[#060b18]/85 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section: Agency Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/40">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#060b18] rounded-full animate-ping" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#060b18] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Webglow <span className="text-cyan-400 font-semibold text-sm px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">Admin</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Co-op
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multiplayer Agency Workflow Board &bull; Realtime Sync
            </p>
          </div>
        </div>

        {/* Center Section: Search & Quick Filters */}
        <div className="flex-1 max-w-md mx-0 md:mx-4 flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cards, tags, descriptions..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-blue-950/40 border border-blue-800/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 shrink-0 ${
              showFilters || filter.priority !== 'all' || filter.tag !== 'all'
                ? 'bg-blue-600/20 border-blue-500/50 text-cyan-300'
                : 'bg-blue-950/30 border-blue-900/40 text-slate-400 hover:text-white'
            }`}
            title="Toggle Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Right Section: Collaborators, Identity & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap justify-between md:justify-end">
          {/* Active Collaborator Avatars */}
          <div className="flex items-center bg-blue-950/50 border border-blue-800/30 rounded-full px-2.5 py-1">
            <div className="flex -space-x-2 mr-2">
              {allOnline.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  title={`${user.name} (${user.role})${user.id === currentUser.id ? ' - You' : ''}`}
                  style={{ backgroundColor: user.avatarColor }}
                  className="relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-[#060b18] shadow cursor-pointer transition-transform hover:scale-110 hover:z-10"
                >
                  {user.name.charAt(0).toUpperCase()}
                  {user.id === currentUser.id && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full ring-1 ring-[#060b18]" />
                  )}
                </div>
              ))}
              {allOnline.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-slate-800 ring-2 ring-[#060b18] flex items-center justify-center text-[10px] text-slate-300 font-semibold">
                  +{allOnline.length - 5}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {allOnline.length} active
            </span>
          </div>

          {/* Current User Identity Pill */}
          <button
            onClick={onOpenIdentityModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/20 border border-blue-700/30 text-xs text-slate-300 hover:bg-blue-800/30 hover:text-white transition-colors"
            title="Change your collaborator name/avatar"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentUser.avatarColor }}
            />
            <span className="font-medium truncate max-w-[90px] sm:max-w-[120px]">
              {currentUser.name}
            </span>
          </button>

          {/* Activity Log Toggle */}
          <button
            onClick={onToggleActivityDrawer}
            className="relative p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-slate-400 hover:text-cyan-300 hover:bg-blue-900/30 transition-colors"
            title="Realtime Activity Feed"
          >
            <History className="w-4 h-4" />
            {activityCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-[#060b18] text-[9px] font-bold rounded-full flex items-center justify-center">
                {activityCount > 9 ? '9+' : activityCount}
              </span>
            )}
          </button>

          {/* Supabase / Cloud Status Button */}
          <button
            onClick={onOpenSetupModal}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isSupabaseMode
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-blue-950/40 border-blue-800/40 text-slate-300 hover:text-cyan-300 hover:bg-blue-900/30'
            }`}
            title="Database Setup & Vercel Deploy Guide"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSupabaseMode ? 'Cloud Live' : 'Local Co-op'}
            </span>
          </button>

          {/* Share Board Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyan-200" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Filter Bar */}
      {showFilters && (
        <div className="max-w-[1700px] mx-auto mt-3 pt-3 border-t border-blue-900/30 flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Priority:</span>
            <select
              value={filter.priority}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, priority: e.target.value as Priority | 'all' }))
              }
              className="bg-blue-950/60 border border-blue-800/50 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Tag:</span>
            <select
              value={filter.tag}
              onChange={(e) => setFilter((prev) => ({ ...prev, tag: e.target.value }))}
              className="bg-blue-950/60 border border-blue-800/50 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Tags</option>
              {INITIAL_TAGS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {(filter.priority !== 'all' || filter.tag !== 'all' || filter.search) && (
            <button
              onClick={() => setFilter({ search: '', priority: 'all', tag: 'all', assignee: 'all' })}
              className="text-cyan-400 hover:underline text-[11px] ml-auto"
            >
              Clear filters
            </button>
          )}

          <button
            onClick={onResetBoard}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 ml-auto transition-colors"
            title="Restore default agency demo tasks"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Demo Data
          </button>
        </div>
      )}
    </header>
  );
};
