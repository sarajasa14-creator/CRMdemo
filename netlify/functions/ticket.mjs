/* Leave-a-message tickets (demo build 1).
   POST /api/ticket  { message, email (optional), transcript: [ { role, content } ] }  ->  { ok: true }
   Stored in the Netlify Blobs store "bot" under "ticket-<time>-<random>". Read and deleted on the admin page (raportti.html).
   Optional: TICKETS_DAILY (default 50 tickets per day). */
import { getStore } from '@netlify/blobs';
import { json, str, today } from './lib/helpers.mjs';

export const config = {
  path: '/api/ticket',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};

const DAILY = Math.max(1, parseInt(process.env.TICKETS_DAILY || '50', 10) || 50);
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,100}\.[^\s@]{2,}$/;

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const message = str(b && b.message, 1000).trim();
  if (message.length < 5) return json({ error: 'too_short' }, 400);
  const email = str(b && b.email, 150).trim();
  if (email && !EMAIL.test(email)) return json({ error: 'bad_email' }, 400);
  const transcript = (Array.isArray(b && b.transcript) ? b.transcript : []).slice(-8)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
    .map(m => ({ role: m.role, content: str(m.content, 500) }));
  let store;
  try {
    store = getStore('bot');
    const ck = 'tickets-day-' + today();
    const n = parseInt((await store.get(ck)) || '0', 10) || 0;
    if (n >= DAILY) return json({ error: 'busy' }, 429);
    await store.set(ck, String(n + 1));
    const id = 'ticket-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    await store.setJSON(id, { id, at: new Date().toISOString(), email, message, transcript });
    return json({ ok: true });
  } catch { return json({ error: 'storage' }, 500); }
};
