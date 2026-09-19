'use client';

import React from 'react';
import {
  Kanban,
  CalendarCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { ActiveNavView, UserPresence } from '../types/kanban';

interface SidebarProps {
  activeView: ActiveNavView;
  onSelectView: (view: ActiveNavView) => void;
  leadsCount: number;
  presentCount: number;
  totalRevenue: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: UserPresence;
  onOpenIdentityModal: () => void;
  isSupabaseMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  leadsCount,
  presentCount,
  totalRevenue,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  onOpenIdentityModal,
  isSupabaseMode,
}) => {
  const formatCompactNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${Math.round(num / 1000)}k`;
    return `$${num}`;
  };

  const navItems = [
    {
      id: 'board' as ActiveNavView,
      label: 'Sales Board',
      description: 'Leads & Task Pipeline',
      icon: Kanban,
      badge: `${leadsCount}`,
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    {
      id: 'attendance' as ActiveNavView,
      label: 'Work Logs & Attendance',
      description: 'Daily Effort & Weekly Logs',
      icon: CalendarCheck,
      badge: `${presentCount} active`,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'clients' as ActiveNavView,
      label: 'Clients & Revenue',
      description: 'Production & Retainers',
      icon: Building2,
      badge: formatCompactNumber(totalRevenue),
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono',
    },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col shrink-0 transition-all duration-200 select-none bg-[#101214]/90 backdrop-blur-md border-r border-[#22272b] ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#22272b]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide truncate">
                  WEBGLOW
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 truncate">Agency Operations</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        )}

        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="p-1 rounded-lg hover:bg-[#1d2125] text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* If collapsed, show expand button below header */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-[#22272b]">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="p-1.5 rounded-lg hover:bg-[#1d2125] text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Section */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 pb-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Workspace
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition-all ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5 text-left'
              } ${
                isActive
                  ? 'bg-sky-500/15 text-white border border-sky-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1d2125]/80 border border-transparent'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-[#161a1d] text-neutral-400 group-hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-neutral-100 truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {item.description}
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ml-2 shrink-0 ${item.badgeClass}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer: User Profile & Database Status */}
      <div className="p-2 border-t border-[#22272b] space-y-1.5 bg-[#0b0d0e]/60">
        <button
          type="button"
          onClick={onOpenIdentityModal}
          title="Switch User Persona / Edit Profile"
          className={`w-full flex items-center rounded-xl p-2 hover:bg-[#1d2125] transition-colors ${
            isCollapsed ? 'justify-center' : 'gap-2.5 text-left'
          }`}
        >
          <div
            style={{ backgroundColor: currentUser.avatarColor || '#388bff' }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-1 ring-white/20 shadow-xs"
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-neutral-200 truncate flex items-center gap-1">
                <span>{currentUser.name}</span>
                <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
              </div>
              <div className="text-[10px] text-neutral-400 truncate">{currentUser.role}</div>
            </div>
          )}
        </button>

        {!isCollapsed && (
          <div className="px-2 py-1 flex items-center justify-between text-[10px] text-neutral-400 border-t border-[#22272b]/60 pt-2">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-sky-400" />
              <span>{isSupabaseMode ? 'Supabase Live' : 'Local Storage'}</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
