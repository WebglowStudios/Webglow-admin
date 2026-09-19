'use client';

import React from 'react';
import { X, History, Sparkles, User } from 'lucide-react';
import { ActivityEvent } from '../types/kanban';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activityLog: ActivityEvent[];
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  isOpen,
  onClose,
  activityLog,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm h-full flex flex-col bg-[#070e22] border-l border-blue-900/40 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-900/40 bg-[#060b18]/60">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Live Activity Feed</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-semibold border border-cyan-500/20">
              {activityLog.length} events
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activityLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 text-slate-600 mb-2" />
              <p>No activity yet</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Move cards or edit tasks to see live activity streamed here!
              </p>
            </div>
          ) : (
            activityLog.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/30 hover:border-blue-800/60 transition-colors text-xs"
              >
                <div
                  style={{ backgroundColor: event.userColor || '#3b82f6' }}
                  className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  {event.userName ? event.userName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 font-medium leading-snug">
                    <span className="font-semibold text-white">{event.userName}</span>{' '}
                    <span className="text-cyan-400 font-normal">{event.action}</span>{' '}
                    <span className="text-slate-300">{event.target}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    {event.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-900/40 bg-[#060b18]/60 text-[11px] text-slate-500 text-center">
          Events are synchronized in real-time across all connected clients.
        </div>
      </div>
    </div>
  );
};
