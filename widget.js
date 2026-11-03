/* Customer-service chat widget. Add to any page:  <script src="widget.js" defer></script>
   Optional settings before it:  <script>window.BOT_CONFIG={autoOpen:true,contactUrl:'mailto:tuki@yritys.fi'}</script>
   Lives in a shadow root, so it cannot clash with the page's own styles or ids. Talks to /api/bot (netlify/functions/bot.mjs). */
(() => {
'use strict';
const CFG = Object.assign({
  endpoint: '/api/bot', fabLabel: 'Kysy meiltä', title: 'Asiakaspalvelu', sub: 'Tekoälyavustaja, 18+',
  contactLabel: 'Ota yhteyttä asiakaspalveluun', contactUrl: '', autoOpen: false,
  hello: 'Hei! Olen tekoälyavustaja. Autan cashbackiin ja palveluun liittyvissä kysymyksissä. Mitä haluat tietää?',
  quick: ['Miten cashback toimii?', 'Milloin cashback maksetaan?', 'Cashbackia ei ole tullut', 'Tarvitsen apua pelaamiseen']
}, window.BOT_CONFIG || {});
const ERR = { not_configured: 'Botti ei ole vielä käytössä. Yritä myöhemmin.', busy: 'Botti lepää tältä päivältä. Ota yhteyttä asiakaspalveluun.', upstream: 'Yhteys botin palveluun epäonnistui. Yritä hetken päästä uudelleen.', empty: 'En saanut vastausta. Yritä uudelleen.', bad_messages: 'Viesti on liian pitkä tai keskustelu liian pitkä. Päivitä sivu ja aloita uusi keskustelu.' };

const host = document.createElement('div'); host.id = 'bot-widget'; document.body.appendChild(host);
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>
:host{--bg:#f4f6f5;--card:#fff;--ink:#14231f;--mut:#5b6b66;--line:#dde4e1;--pri:#0f5c4a;--onpri:#fff;--me:#e3f1ec;--warn:#fef3c7;--warnink:#7a4a05;all:initial}
@media(prefers-color-scheme:dark){:host{--bg:#0f1715;--card:#17211e;--ink:#e8f0ed;--mut:#9fb0aa;--line:#2a3a35;--pri:#4cc2a1;--onpri:#04140f;--me:#173a31;--warn:#3a2c0c;--warnink:#fbbf24}}
*{box-sizing:border-box}
#fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;border:0;border-radius:999px;background:var(--pri);color:var(--onpri);font:700 15px system-ui,sans-serif;padding:13px 20px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}
#chat{position:fixed;right:16px;bottom:16px;z-index:2147483001;width:min(380px,calc(100vw - 32px));height:min(580px,calc(100vh - 32px));background:var(--card);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden}
#chat.open{display:flex}
.hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line)}
.hd b{display:block}.hd small{color:var(--mut)}
.hd button{border:0;background:transparent;color:var(--ink);font-size:22px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}
#log{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.m{max-width:86%;padding:8px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}
.m.bot{background:var(--bg);align-self:flex-start;border-bottom-left-radius:4px}
.m.me{background:var(--me);align-self:flex-end;border-bottom-right-radius:4px}
.m.err{background:var(--warn);color:var(--warnink);align-self:flex-start}
.m a{color:var(--pri)}.typing{color:var(--mut)}
.hand{align-self:flex-start;display:inline-block;border:1px solid var(--pri);color:var(--pri);border-radius:999px;padding:7px 14px;text-decoration:none;font-weight:600}
.quick{display:flex;flex-wrap:wrap;gap:6px}.quick button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 12px;font:inherit;cursor:pointer}
form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line)}
textarea{flex:1;resize:none;font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;max-height:90px}
form button{border:0;background:var(--pri);color:var(--onpri);font:inherit;font-weight:700;border-radius:10px;padding:0 16px;cursor:pointer}
form button:disabled{opacity:.5;cursor:default}
.ft{padding:6px 14px 10px;color:var(--mut);font-size:12px}.ft a{color:var(--mut)}
:focus-visible{outline:2px solid var(--pri);outline-offset:2px}
</style>
<button id="fab" aria-haspopup="dialog"></button>
<section id="chat" role="dialog" aria-label="Asiakaspalvelu">
  <div class="hd"><div><b id="t"></b><small id="st"></small></div><button id="x" aria-label="Sulje chat">×</button></div>
  <div id="log" aria-live="polite"></div>
  <form id="f"><textarea id="q" rows="1" maxlength="800" placeholder="Kirjoita kysymys…" aria-label="Viesti"></textarea><button id="s">Lähetä</button></form>
  <div class="ft">Tekoäly voi erehtyä. Älä jaa salasanoja tai pankkitietoja. Peliongelmiin apua: <a href="https://www.peluuri.fi" target="_blank" rel="noopener">peluuri.fi</a></div>
</section>`;
const $ = id => root.getElementById(id), log = $('log'), q = $('q'), s = $('s');
$('fab').textContent = CFG.fabLabel; $('t').textContent = CFG.title; $('st').textContent = CFG.sub;
const history = []; let busy = false, started = false;

function linkify(el, text) {            // text only; links are real elements, never HTML strings
  const re = /https:\/\/[^\s)]+/g; let i = 0, m;
  while ((m = re.exec(text))) { el.append(text.slice(i, m.index)); const a = document.createElement('a'); a.href = m[0]; a.textContent = m[0]; a.target = '_blank'; a.rel = 'noopener noreferrer'; el.append(a); i = m.index + m[0].length; }
  el.append(text.slice(i));
}
function add(cls, text) { const d = document.createElement('div'); d.className = 'm ' + cls; linkify(d, text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
function contact(url) {
  const u = url || CFG.contactUrl, a = document.createElement('a'); a.className = 'hand'; a.textContent = CFG.contactLabel;
  if (u && /^(https:|mailto:)/.test(u)) a.href = u; else { a.href = '#'; a.onclick = e => e.preventDefault(); a.title = 'Yhteystieto puuttuu demosta'; }
  log.appendChild(a); log.scrollTop = log.scrollHeight;
}
function open() {
  $('chat').classList.add('open'); $('fab').style.display = 'none';
  if (!started) {
    started = true; add('bot', CFG.hello);
    const qd = document.createElement('div'); qd.className = 'quick';
    CFG.quick.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => { qd.remove(); send(t); }; qd.appendChild(b); });
    log.appendChild(qd);
  }
  q.focus();
}
function close() { $('chat').classList.remove('open'); $('fab').style.display = ''; $('fab').focus(); }
async function send(text) {
  text = text.trim(); if (!text || busy) return; busy = true; s.disabled = true;
  add('me', text); history.push({ role: 'user', content: text }); q.value = '';
  const wait = add('bot typing', 'Kirjoittaa…');
  try {
    const r = await fetch(CFG.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-11) }) });
    const j = await r.json().catch(() => ({})); wait.remove();
    if (!r.ok || !j.reply) { history.pop(); add('err', ERR[j.error] || ERR.upstream); if (j.error === 'busy' || j.error === 'not_configured') contact(''); }
    else { history.push({ role: 'assistant', content: j.reply }); add('bot', j.reply); if (j.handoff) contact(j.contact); }
  } catch (e) { wait.remove(); history.pop(); add('err', ERR.upstream); }
  busy = false; s.disabled = false; q.focus();
}
$('fab').onclick = open; $('x').onclick = close;
$('f').onsubmit = e => { e.preventDefault(); send(q.value); };
q.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(q.value); } if (e.key === 'Escape') close(); };
if (CFG.autoOpen) open();
})();
