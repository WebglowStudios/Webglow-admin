import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let url, key;
const content = fs.readFileSync(envPath, 'utf-8');
for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [k, ...v] = trimmed.split('=');
  if (k === 'NEXT_PUBLIC_SUPABASE_URL') url = v.join('=').trim();
  if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') key = v.join('=').trim();
}

const supa = createClient(url, key);

async function check() {
  const { data: members, error: mErr } = await supa.from('team_members').select('*');
  const { data: clients, error: cErr } = await supa.from('clients').select('*');
  const { data: logs, error: lErr } = await supa.from('daily_work_logs').select('*');
  const { data: cards, error: cardErr } = await supa.from('cards').select('*');
  const { data: boards } = await supa.from('boards').select('*');
  const { data: cols } = await supa.from('columns').select('*');

  console.log('--- SUPABASE DATABASE STATE ---');
  console.log('team_members count:', members?.length, members);
  console.log('clients count:', clients?.length, clients?.map(c => c.name));
  console.log('daily_work_logs count:', logs?.length, logs?.map(l => ({ name: l.member_name, date: l.date })));
  console.log('cards count:', cards?.length);
  console.log('boards:', boards);
  console.log('columns count:', cols?.length, cols?.map(c => ({ id: c.id, board_id: c.board_id })));
}

check();
