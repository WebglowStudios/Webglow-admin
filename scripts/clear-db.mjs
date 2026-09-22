import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if ((!url || !key) && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k === 'NEXT_PUBLIC_SUPABASE_URL') url = v.join('=').trim();
    if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') key = v.join('=').trim();
  }
}

if (!url || !key) {
  console.error('Supabase credentials missing in .env.local');
  process.exit(1);
}

const supa = createClient(url, key);

async function clearDatabase() {
  console.log('Clearing database tables...');
  
  await supa.from('cards').delete().neq('id', '___non_existent___');
  await supa.from('columns').delete().neq('id', '___non_existent___');
  await supa.from('boards').delete().neq('id', '___non_existent___');
  await supa.from('daily_work_logs').delete().neq('id', '___non_existent___');
  await supa.from('team_members').delete().neq('id', '___non_existent___');
  await supa.from('clients').delete().neq('id', '___non_existent___');
  await supa.from('activity_logs').delete().neq('id', '___non_existent___');
  await supa.from('tag_options').delete().neq('id', '___non_existent___');

  console.log('✓ All data wiped clean!');
  
  // Re-create board and empty columns structure
  await supa.from('boards').upsert({
    id: 'board-main',
    title: 'Webglow Agency Board',
    description: 'Real-time collaborative production board',
  });

  const columns = [
    { id: 'col-backlog', board_id: 'board-main', title: 'Backlog / Ideas', order_index: 0, color_dot: '#64748b' },
    { id: 'col-progress', board_id: 'board-main', title: 'In Progress', order_index: 1, color_dot: '#3b82f6' },
    { id: 'col-review', board_id: 'board-main', title: 'Code & QA Review', order_index: 2, color_dot: '#f59e0b' },
    { id: 'col-client', board_id: 'board-main', title: 'Client Approval', order_index: 3, color_dot: '#a855f7' },
    { id: 'col-done', board_id: 'board-main', title: 'Done / Shipped', order_index: 4, color_dot: '#10b981' },
  ];
  await supa.from('columns').upsert(columns, { onConflict: 'id' });

  console.log('✓ Clean board structure initialized with 0 cards, 0 members, 0 work logs, 0 clients.');
}

clearDatabase().catch((err) => {
  console.error('Failed to clear database:', err);
  process.exit(1);
});
