/* Admin API for raportti.html (demo build 1). Every call needs the header  x-admin-key  that equals the environment variable ADMIN_KEY.
   GET  /api/admin?what=stats    -> statistics of the last 14 days (counts per topic, handoffs, redacted unanswered questions)
   GET  /api/admin?what=tickets  -> the stored tickets, newest first
   GET  /api/admin?what=config   -> { campaign }
   POST /api/admin  { action: 'campaign', text }  or  { action: 'delete_ticket', id } */
import { createHash, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json, str, resetConfigCache } from './lib/helpers.mjs';

export const config = {
  path: '/api/admin',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};

const sha = s => createHash('sha256').update(String(s)).digest();
function authorized(req) {
  const key = process.env.ADMIN_KEY;
  if (!key) return null;
  return timingSafeEqual(sha(req.headers.get('x-admin-key') || ''), sha(key));
}

export default async (req) => {
  const ok = authorized(req);
  if (ok === null) return json({ error: 'not_configured' }, 503);
  if (!ok) return json({ error: 'unauthorized' }, 401);
  const store = getStore('bot');
  try {
    if (req.method === 'GET') {
      const what = new URL(req.url).searchParams.get('what');
      if (what === 'config') { const c = (await store.get('config', { type: 'json' })) || {}; return json({ campaign: str(c.campaign, 300) }); }
      if (what === 'stats') {
        const days = [], topics = {}, unanswered = [];
        for (let i = 0; i < 14; i++) {
          const date = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
          const s = await store.get('stats-' + date, { type: 'json' });
          if (!s) continue;
          days.push({ date, total: s.total || 0, handoff: s.handoff || 0 });
          for (const [k, v] of Object.entries(s.topics || {})) topics[k] = (topics[k] || 0) + v;
          for (const u of (s.unanswered || [])) unanswered.push({ date, q: str(u.q, 140) });
        }
        return json({ days, topics, unanswered: unanswered.slice(0, 60) });
      }
      if (what === 'tickets') {
        const { blobs } = await store.list({ prefix: 'ticket-' });
        const out = [];
        for (const b of blobs.slice(-100)) { const t = await store.get(b.key, { type: 'json' }); if (t) out.push(t); }
        out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
        return json({ tickets: out });
      }
      return json({ error: 'bad_request' }, 400);
    }
    if (req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
      if (b && b.action === 'campaign') {
        await store.setJSON('config', { campaign: str(b.text, 300).trim(), updated: new Date().toISOString() });
        resetConfigCache();
        return json({ ok: true });
      }
      if (b && b.action === 'delete_ticket' && /^ticket-[\w-]+$/.test(String(b.id))) {
        await store.delete(String(b.id));
        return json({ ok: true });
      }
      return json({ error: 'bad_request' }, 400);
    }
    return json({ error: 'method' }, 405);
  } catch { return json({ error: 'storage' }, 500); }
};
