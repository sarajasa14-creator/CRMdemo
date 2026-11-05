/* Shared helpers for bot.mjs, ticket.mjs and admin.mjs. All data lives in the Netlify Blobs store "bot". */
import { getStore } from '@netlify/blobs';

export const TOPICS = ['how_it_works', 'cashback_missing', 'application_rejected', 'kyc', 'timing', 'achievements', 'contact', 'responsible_gambling', 'other'];

export const json = (o, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
export const str = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
export const today = () => new Date().toISOString().slice(0, 10);

/* Human support hours: Monday-Friday 08:00-16:00 Finnish time (public holidays are not handled). */
export function supportOpenNow(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(d);
  const wd = parts.find(p => p.type === 'weekday').value;
  let h = parseInt(parts.find(p => p.type === 'hour').value, 10); if (h === 24) h = 0;
  return wd !== 'Sat' && wd !== 'Sun' && h >= 8 && h < 16;
}

/* Remove e-mail addresses and long digit strings before a question is stored in the statistics. */
export function redact(t) {
  return str(t, 400)
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[sähköposti]')
    .replace(/\d[\d\s-]{5,}\d[A-Za-z]?/g, '[numero]')
    .trim().slice(0, 140);
}

/* Settings written by the admin page (e.g. the congestion notice shown in the chat). Cached for 30 s. */
let cache = { t: 0, v: { campaign: '' } };
export async function getConfig() {
  if (Date.now() - cache.t < 30000) return cache.v;
  try {
    const v = await getStore('bot').get('config', { type: 'json' });
    cache = { t: Date.now(), v: v && typeof v === 'object' ? v : { campaign: '' } };
  } catch { /* keep the previous value */ }
  return cache.v;
}
export function resetConfigCache() { cache.t = 0; }

/* Best-effort statistics: one JSON document per day. A lost update is acceptable for a demo. */
export async function recordStat({ topic, handoff, question }) {
  try {
    const store = getStore('bot'), key = 'stats-' + today();
    const s = (await store.get(key, { type: 'json' })) || { total: 0, handoff: 0, topics: {}, unanswered: [] };
    s.total++;
    s.topics[topic] = (s.topics[topic] || 0) + 1;
    if (handoff) { s.handoff++; if (s.unanswered.length < 50) s.unanswered.push({ q: redact(question) }); }
    await store.setJSON(key, s);
  } catch { /* statistics must never break the chat */ }
}
