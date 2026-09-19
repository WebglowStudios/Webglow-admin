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
        className="w-full max-w-sm h-full flex flex-col bg-[#101214] border-l border-[#282e33] shadow-2xl animate-in slide-in-from-right duration-200 text-[#b6c2cf]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282e33] bg-[#161a1d]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Live Activity Feed</h2>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-semibold border border-sky-400/30">
              {activityLog.length} events
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#282e33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {activityLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-500 text-xs">
              <Sparkles className="w-6 h-6 text-neutral-600 mb-2" />
              <p>No activity yet</p>
              <p className="text-[11px] text-neutral-600 mt-1">
                Move cards or edit tasks to see live activity streamed here!
              </p>
            </div>
          ) : (
            activityLog.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#22272b] border border-[#282e33] hover:border-[#384148] transition-colors text-xs"
              >
                <div
                  style={{ backgroundColor: event.userColor || '#0c66e4' }}
                  className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-[#101214]"
                >
                  {event.userName ? event.userName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-neutral-200 leading-snug">
                    <span className="font-semibold text-white">{event.userName}</span>{' '}
                    <span className="text-sky-400 font-normal">{event.action}</span>{' '}
                    <span className="text-neutral-300">{event.target}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                    {event.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282e33] bg-[#161a1d] text-[11px] text-neutral-500 text-center">
          Events are synchronized in real-time across all connected clients.
        </div>
      </div>
    </div>
  );
};
