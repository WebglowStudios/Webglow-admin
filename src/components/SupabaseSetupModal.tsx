'use client';

import React, { useState } from 'react';
import { X, Check, Copy, Database, ExternalLink, Cloud } from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupabaseMode: boolean;
}

const SQL_SCHEMA = `-- Webglow Admin: Real-Time Kanban Board Database Schema for Supabase
-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.boards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Webglow Agency Board',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  color_dot TEXT DEFAULT '#388bff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  column_id TEXT NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  board_id TEXT NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  tags JSONB DEFAULT '[]'::jsonb,
  assignees JSONB DEFAULT '[]'::jsonb,
  due_date TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Open collaboration policies
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all boards" ON public.boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all columns" ON public.columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all activity" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 3. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;`;

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  isSupabaseMode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#1d2125] border border-[#384148] shadow-2xl overflow-hidden text-[#b6c2cf]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282e33] bg-[#161a1d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Free Hosting & Supabase Setup
              </h2>
              <p className="text-xs text-neutral-400">
                100% Free Stack: Vercel + Supabase Realtime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#282e33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Current Engine Status */}
          <div className="p-3.5 rounded-xl bg-[#22272b] border border-[#384148] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isSupabaseMode ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'
                }`}
              />
              <div>
                <div className="font-semibold text-white">
                  {isSupabaseMode
                    ? 'Connected to Live Supabase'
                    : 'Local Multi-Tab Co-op Engine Active'}
                </div>
                <div className="text-neutral-400 text-[11px]">
                  {isSupabaseMode
                    ? 'Changes sync cross-device via Supabase WebSockets.'
                    : 'Zero-config mode: open another browser window to see instant live sync!'}
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isSupabaseMode
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-sky-500/15 text-sky-300 border-sky-400/30'
              }`}
            >
              {isSupabaseMode ? 'ONLINE CLOUD' : 'ZERO-CONFIG READY'}
            </span>
          </div>

          {/* 3 Steps Guide */}
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
              How to Connect Free Supabase in 2 Minutes:
            </h3>

            <div className="space-y-2.5 text-neutral-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#22272b]/60 border border-[#282e33]">
                <span className="w-5 h-5 rounded-full bg-[#0c66e4] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <span className="font-semibold text-white">Create a free Supabase Project</span>
                  <p className="text-neutral-400 mt-0.5">
                    Go to{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 underline inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    and create a new free project (e.g. &quot;webglow-board&quot;).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#22272b]/60 border border-[#282e33]">
                <span className="w-5 h-5 rounded-full bg-[#0c66e4] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Run the Database Schema</span>
                    <button
                      onClick={handleCopySql}
                      className="flex items-center gap-1 text-[11px] font-semibold text-sky-300 hover:text-white bg-[#101214] px-2 py-1 rounded-md border border-[#384148] transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                    </button>
                  </div>
                  <p className="text-neutral-400 mt-0.5">
                    In Supabase, click <strong>SQL Editor</strong> &gt; <strong>New query</strong>, paste the script, and click <strong>Run</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#22272b]/60 border border-[#282e33]">
                <span className="w-5 h-5 rounded-full bg-[#0c66e4] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <span className="font-semibold text-white">Add Keys to .env.local</span>
                  <p className="text-neutral-400 mt-0.5">
                    Copy your Project URL and Publishable key from <strong>Project Settings &gt; API</strong> and add them to <code className="text-sky-300 bg-[#101214] px-1 py-0.5 rounded border border-[#384148]">.env.local</code>:
                  </p>
                  <pre className="mt-1.5 p-2 rounded-lg bg-[#101214] text-[11px] text-sky-300 overflow-x-auto border border-[#384148] font-mono">
                    NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co{'\n'}
                    NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Vercel Free Deployment */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-[#384148]">
            <div className="flex items-center gap-2 mb-1.5">
              <Cloud className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white text-xs">Deploy Free to Vercel</span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Push this repository to GitHub and import it on{' '}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 underline font-semibold"
              >
                Vercel.com
              </a>
              . Add the two Supabase environment variables into Vercel Settings &gt; Environment Variables. Next.js App Router deploys automatically with global CDN and edge optimization!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#282e33] bg-[#161a1d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-semibold rounded-xl text-xs transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
