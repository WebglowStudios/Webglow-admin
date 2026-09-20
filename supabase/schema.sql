-- ==============================================================================
-- Webglow Admin: Complete Database Schema for Supabase
-- Covers: Boards, Columns, Cards (with Lead/CRM fields), Activity Logs,
--         Team Members, Clients & Retainers, Daily Work Logs, and Custom Tags.
-- Run this in your Supabase project's SQL Editor (Dashboard > SQL Editor > New query)
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

-- 3. Create cards table (with Lead / CRM fields)
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
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  lead_value TEXT DEFAULT '',
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

-- 5. Create agency team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Collaborator',
  avatar_color TEXT NOT NULL DEFAULT '#0c66e4',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create clients & retainers table
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'production', -- 'production', 'maintenance', 'both'
  status TEXT NOT NULL DEFAULT 'active',   -- 'active', 'completed', 'in_progress', 'paused'
  services TEXT DEFAULT '',
  revenue_collected NUMERIC NOT NULL DEFAULT 0,
  monthly_retainer NUMERIC DEFAULT 0,
  closed_date TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  start_date TEXT,
  completion_date TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create daily work logs & attendance table
CREATE TABLE IF NOT EXISTS public.daily_work_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  member_role TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  date TEXT NOT NULL,                      -- YYYY-MM-DD
  is_present BOOLEAN NOT NULL DEFAULT true,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  tasks_done TEXT NOT NULL DEFAULT '',
  dms_sent INTEGER NOT NULL DEFAULT 0,
  calls_done INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create custom tag options table
CREATE TABLE IF NOT EXISTS public.tag_options (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) & Open Collaboration Policies
-- ==============================================================================
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all boards" ON public.boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all columns" ON public.columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all activity" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all daily_work_logs" ON public.daily_work_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all tag_options" ON public.tag_options FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Enable Realtime Broadcasts on All Tables
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_work_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tag_options;

-- ==============================================================================
-- Seed Initial Default Data
-- ==============================================================================

-- 1. Default Board
INSERT INTO public.boards (id, title, description)
VALUES ('default-board', 'Webglow Agency Board', 'Real-time collaborative production board')
ON CONFLICT (id) DO NOTHING;

-- 2. Default Columns
INSERT INTO public.columns (id, board_id, title, order_index, color_dot)
VALUES
  ('col-backlog', 'default-board', 'Backlog / Ideas', 0, '#64748b'),
  ('col-progress', 'default-board', 'In Progress', 1, '#3b82f6'),
  ('col-review', 'default-board', 'Code & QA Review', 2, '#f59e0b'),
  ('col-client', 'default-board', 'Client Approval', 3, '#a855f7'),
  ('col-done', 'default-board', 'Done / Shipped', 4, '#10b981')
ON CONFLICT (id) DO NOTHING;

-- 3. Default Team Members
INSERT INTO public.team_members (id, name, role, avatar_color)
VALUES
  ('user-1', 'Leo Vance', 'Lead Architect', '#3b82f6'),
  ('user-2', 'Elena Rostova', 'UI/UX Director', '#06b6d4'),
  ('user-3', 'Marcus Chen', 'Fullstack Engineer', '#6366f1')
ON CONFLICT (id) DO NOTHING;

-- 4. Default Clients
INSERT INTO public.clients (id, name, type, status, services, revenue_collected, monthly_retainer, closed_date)
VALUES
  ('client-1', 'Apex Dynamics', 'both', 'active', 'Next.js Web Platform, Enterprise Portal & Monthly SLA Retainer', 38500, 2200, '2026-09-08'),
  ('client-2', 'Luminova Health', 'production', 'completed', 'HIPAA-Compliant Patient Portal & Brand Identity System', 42000, 0, '2026-06-15'),
  ('client-3', 'FinScale Cloud Technologies', 'maintenance', 'active', '24/7 Security Patches, Uptime Monitoring & DevOps SLA', 19200, 2400, '2026-08-10')
ON CONFLICT (id) DO NOTHING;
