-- ==============================================================================
-- Webglow Admin: Real-Time Kanban Board Database Schema for Supabase
-- Run this in your Supabase project's SQL Editor (Table Editor > SQL Editor > New query)
-- ==============================================================================

-- 1. Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Webglow Agency Board',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create columns table
CREATE TABLE IF NOT EXISTS public.columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  color_dot TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create cards table
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

-- 4. Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) with open collaboration policies for agency
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for team collaboration (or replace with auth.uid() = ... for auth-only)
CREATE POLICY "Allow public read boards" ON public.boards FOR SELECT USING (true);
CREATE POLICY "Allow public insert boards" ON public.boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update boards" ON public.boards FOR UPDATE USING (true);

CREATE POLICY "Allow public read columns" ON public.columns FOR SELECT USING (true);
CREATE POLICY "Allow public insert columns" ON public.columns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update columns" ON public.columns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete columns" ON public.columns FOR DELETE USING (true);

CREATE POLICY "Allow public read cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Allow public insert cards" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update cards" ON public.cards FOR UPDATE USING (true);
CREATE POLICY "Allow public delete cards" ON public.cards FOR DELETE USING (true);

CREATE POLICY "Allow public read activity" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert activity" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- 6. Enable Realtime Publications on the tables
-- This allows Supabase to broadcast database changes to all connected clients!
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- 7. Seed Initial Default Board
INSERT INTO public.boards (id, title, description)
VALUES ('default-board', 'Webglow Agency Board', 'Real-time collaborative production board')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Columns
INSERT INTO public.columns (id, board_id, title, order_index, color_dot)
VALUES
  ('col-backlog', 'default-board', 'Backlog / Ideas', 0, '#64748b'),
  ('col-progress', 'default-board', 'In Progress', 1, '#3b82f6'),
  ('col-review', 'default-board', 'Code & QA Review', 2, '#f59e0b'),
  ('col-client', 'default-board', 'Client Approval', 3, '#a855f7'),
  ('col-done', 'default-board', 'Done / Shipped', 4, '#10b981')
ON CONFLICT (id) DO NOTHING;
