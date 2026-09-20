'use client';

import React, { useState, useRef } from 'react';
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
  Image as ImageIcon,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { UserPresence, BoardFilter, Priority } from '../types/kanban';
import { DEFAULT_TAG_OPTIONS } from '../lib/mockData';
import { getStoredTeamMembers, TEAM_UPDATED_EVENT } from '../lib/teamMembers';

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
  onUploadWallpaper: (dataUrl: string) => void;
  onResetWallpaper: () => void;
  currentWallpaper: string;
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
  onUploadWallpaper,
  onResetWallpaper,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [teamMemberIds, setTeamMemberIds] = useState<Set<string>>(
    () => new Set(getStoredTeamMembers().map((m) => m.id))
  );

  React.useEffect(() => {
    const handleUpdate = () => {
      setTeamMemberIds(new Set(getStoredTeamMembers().map((m) => m.id)));
    };
    window.addEventListener(TEAM_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(TEAM_UPDATED_EVENT, handleUpdate);
  }, []);

  // Combine active users ensuring current user is present and deleted members vanish
  const allOnline = [
    currentUser,
    ...activeUsers.filter((u) => u.id !== currentUser.id && teamMemberIds.has(u.id)),
  ];

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Read local file as Data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUploadWallpaper(event.target.result as string);
          setShowBgMenu(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#1d2125]/85 backdrop-blur-md px-4 sm:px-6 py-2.5 shadow-md text-[#b6c2cf]">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Section: Agency Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1d2125] rounded-full animate-ping" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#1d2125] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Webglow <span className="text-sky-300 font-semibold text-xs px-1.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30">Admin</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-neutral-200 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Co-op
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Multiplayer Agency Workflow Board &bull; Realtime Sync
            </p>
          </div>
        </div>

        {/* Center Section: Search & Quick Filters */}
        <div className="flex-1 max-w-md mx-0 md:mx-4 flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search cards, tags, descriptions..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-[#22272b] border border-[#384148] text-white placeholder-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 shrink-0 ${
              showFilters || filter.priority !== 'all' || filter.tag !== 'all'
                ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                : 'bg-[#22272b] border-[#384148] text-neutral-300 hover:text-white hover:bg-[#282e33]'
            }`}
            title="Toggle Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Right Section: Collaborators, Wallpaper, Identity & Actions */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-between md:justify-end">
          {/* Wallpaper / Background Upload Button & Menu */}
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => setShowBgMenu(!showBgMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22272b] hover:bg-[#282e33] border border-[#384148] text-xs font-medium text-neutral-200 transition-colors"
              title="Change or upload local background image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Background</span>
            </button>

            {showBgMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-[#1d2125] border border-[#384148] shadow-2xl p-2 z-50 text-xs text-neutral-200 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 border-b border-[#282e33] mb-1">
                  Board Wallpaper (Saved Locally)
                </div>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#282e33] text-left transition-colors text-white font-medium"
                >
                  <Upload className="w-4 h-4 text-sky-400" />
                  <div>
                    <div>Upload from Computer</div>
                    <div className="text-[10px] text-neutral-400 font-normal">
                      Stored only in your browser
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onResetWallpaper();
                    setShowBgMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#282e33] text-left transition-colors text-neutral-300"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset to Default Scenic</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Collaborator Avatars */}
          <div className="flex items-center bg-[#101214]/80 border border-white/10 rounded-full px-2.5 py-1">
            <div className="flex -space-x-2 mr-2">
              {allOnline.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  title={`${user.name} (${user.role})${user.id === currentUser.id ? ' - You' : ''}`}
                  style={{ backgroundColor: user.avatarColor }}
                  className="relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#101214] shadow-xs cursor-pointer transition-transform hover:scale-110 hover:z-10"
                >
                  {user.name.charAt(0).toUpperCase()}
                  {user.id === currentUser.id && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-sky-400 rounded-full ring-1 ring-[#101214]" />
                  )}
                </div>
              ))}
              {allOnline.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-[#22272b] ring-2 ring-[#101214] flex items-center justify-center text-[9px] text-neutral-300 font-semibold">
                  +{allOnline.length - 5}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-neutral-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {allOnline.length} active
            </span>
          </div>

          {/* Current User Identity Pill */}
          <button
            onClick={onOpenIdentityModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22272b] border border-[#384148] text-xs text-neutral-200 hover:bg-[#282e33] hover:text-white transition-colors"
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
            className="relative p-1.5 rounded-lg bg-[#22272b] border border-[#384148] text-neutral-300 hover:text-white hover:bg-[#282e33] transition-colors"
            title="Realtime Activity Feed"
          >
            <History className="w-4 h-4" />
            {activityCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activityCount > 9 ? '9+' : activityCount}
              </span>
            )}
          </button>

          {/* Supabase / Cloud Status Button */}
          <button
            onClick={onOpenSetupModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isSupabaseMode
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-[#22272b] border-[#384148] text-neutral-300 hover:text-white hover:bg-[#282e33]'
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0c66e4] hover:bg-[#0055cc] text-white text-xs font-semibold shadow transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-sky-200" />
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
        <div className="max-w-[1700px] mx-auto mt-2.5 pt-2.5 border-t border-white/10 flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium">Priority:</span>
            <select
              value={filter.priority}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, priority: e.target.value as Priority | 'all' }))
              }
              className="bg-[#22272b] border border-[#384148] text-white rounded px-2 py-1 focus:outline-none focus:border-sky-400"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="font-medium">Tag:</span>
            <select
              value={filter.tag}
              onChange={(e) => setFilter((prev) => ({ ...prev, tag: e.target.value }))}
              className="bg-[#22272b] border border-[#384148] text-white rounded px-2 py-1 focus:outline-none focus:border-sky-400"
            >
              <option value="all">All Tags</option>
              {DEFAULT_TAG_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {(filter.priority !== 'all' || filter.tag !== 'all' || filter.search) && (
            <button
              onClick={() => setFilter({ search: '', priority: 'all', tag: 'all', assignee: 'all' })}
              className="text-sky-400 hover:text-sky-300 hover:underline text-[11px] font-medium ml-auto"
            >
              Clear filters
            </button>
          )}

          <button
            onClick={onResetBoard}
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white ml-auto transition-colors"
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
