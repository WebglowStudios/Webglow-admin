'use client';

import React from 'react';
import { CheckCircle2, Clock, Eye, Layers, Users } from 'lucide-react';
import { KanbanCard, KanbanColumn, UserPresence } from '../types/kanban';

interface StatsBarProps {
  cards: KanbanCard[];
  columns: KanbanColumn[];
  activeUsers: UserPresence[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ cards, columns, activeUsers }) => {
  const total = cards.length;
  const inProgressCount = cards.filter(
    (c) => c.columnId === 'col-progress' || c.columnId.includes('progress')
  ).length;
  const inReviewCount = cards.filter(
    (c) => c.columnId === 'col-review' || c.columnId === 'col-client' || c.columnId.includes('review')
  ).length;
  const completedCount = cards.filter(
    (c) => c.columnId === 'col-done' || c.columnId.includes('done')
  ).length;

  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total Tasks */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-white/10 text-sky-400 border border-white/10">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Total Tasks</div>
            <div className="text-sm font-bold text-white leading-none mt-0.5">
              {total} <span className="text-[10px] font-normal text-neutral-400">({columns.length} lists)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">In Progress</div>
            <div className="text-sm font-bold text-sky-300 leading-none mt-0.5">{inProgressCount}</div>
          </div>
        </div>

        {/* Metric 3: Under Review */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Under Review</div>
            <div className="text-sm font-bold text-amber-300 leading-none mt-0.5">{inReviewCount}</div>
          </div>
        </div>

        {/* Metric 4: Completed */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-[11px] text-neutral-400 font-medium">
              <span>Shipped</span>
              <span className="text-emerald-400 font-semibold">{completionRate}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 5: Online Team */}
        <div className="hidden lg:flex items-center gap-3 p-2 rounded-xl bg-[#101214]/80 backdrop-blur-md border border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Live Presence</div>
            <div className="text-sm font-bold text-indigo-300 leading-none mt-0.5">
              {activeUsers.length} Online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
