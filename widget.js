/* Customer-service chat widget. Add to any page:  <script src="widget.js" defer></script>
   Optional settings before it:  <script>window.BOT_CONFIG={autoOpen:true,contactUrl:'mailto:tuki@yritys.fi'}</script>
   Lives in a shadow root, so it cannot clash with the page's own styles or ids. Talks to /api/bot and /api/ticket (netlify/functions).
   Features: restart button, answer choices for clarifying questions, Peluuri button, leave-a-message ticket form when a human is needed,
   congestion notice from the admin page. */
(() => {
'use strict';
const CFG = Object.assign({
  endpoint: '/api/bot', ticketEndpoint: '/api/ticket', fabLabel: 'Kysy meiltä', title: 'Asiakaspalvelu', sub: 'Tekoälyavustaja, 18+',
  restartLabel: '↺ Alusta alusta',
  contactLabel: 'Ota yhteyttä asiakaspalveluun', contactUrl: '', autoOpen: false,
  hello: 'Hei! Olen tekoälyavustaja. Autan cashbackiin ja palveluun liittyvissä kysymyksissä. Mitä haluat tietää?',
  quick: ['Miten cashback toimii?', 'Milloin cashback maksetaan?', 'Cashbackia ei ole tullut', 'Tarvitsen apua pelaamiseen']
}, window.BOT_CONFIG || {});
const ERR = { not_configured: 'Botti ei ole vielä käytössä. Yritä myöhemmin.', busy: 'Botti lepää tältä päivältä.', upstream: 'Yhteys botin palveluun epäonnistui. Yritä hetken päästä uudelleen.', empty: 'En saanut vastausta. Yritä uudelleen.', bad_messages: 'Viesti on liian pitkä tai keskustelu liian pitkä. Paina "Alusta alusta" ja aloita uusi keskustelu.' };

const host = document.createElement('div'); host.id = 'bot-widget'; document.body.appendChild(host);
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>
:host{--bg:#f4f6f5;--card:#fff;--ink:#14231f;--mut:#5b6b66;--line:#dde4e1;--pri:#0f5c4a;--onpri:#fff;--me:#e3f1ec;--warn:#fef3c7;--warnink:#7a4a05;all:initial}
@media(prefers-color-scheme:dark){:host{--bg:#0f1715;--card:#17211e;--ink:#e8f0ed;--mut:#9fb0aa;--line:#2a3a35;--pri:#4cc2a1;--onpri:#04140f;--me:#173a31;--warn:#3a2c0c;--warnink:#fbbf24}}
*{box-sizing:border-box}
#fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;border:0;border-radius:999px;background:var(--pri);color:var(--onpri);font:700 15px system-ui,sans-serif;padding:13px 20px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}
#chat{position:fixed;right:16px;bottom:16px;z-index:2147483001;width:min(380px,calc(100vw - 32px));height:min(580px,calc(100vh - 32px));background:var(--card);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden}
#chat.open{display:flex}
.hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line)}
.hd b{display:block}.hd small{color:var(--mut)}
.act{display:flex;align-items:center;gap:6px}
.hd button{border:0;background:transparent;color:var(--ink);font-size:22px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}
.hd #rs{font-size:13px;line-height:1.2;border:1px solid var(--line);border-radius:999px;padding:5px 10px;color:var(--pri);font-weight:600;white-space:nowrap}
.hd #rs:hover{border-color:var(--pri)}
#log{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.m{max-width:86%;padding:8px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}
.m.bot{background:var(--bg);align-self:flex-start;border-bottom-left-radius:4px}
.m.me{background:var(--me);align-self:flex-end;border-bottom-right-radius:4px}
.m.err{background:var(--warn);color:var(--warnink);align-self:flex-start}
.m.notice{background:var(--warn);color:var(--warnink);align-self:stretch;max-width:100%;font-size:14px}
.m a{color:var(--pri)}.typing{color:var(--mut)}
.hand{align-self:flex-start;display:inline-block;border:1px solid var(--pri);color:var(--pri);border-radius:999px;padding:7px 14px;text-decoration:none;font-weight:600}
.quick{display:flex;flex-wrap:wrap;gap:6px}.quick button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 12px;font:inherit;cursor:pointer}
.tk{align-self:stretch;border:1px solid var(--line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;background:var(--bg)}
.tk p{margin:0;font-size:14px}.tk small{color:var(--mut);font-size:12px}
.tk textarea,.tk input{width:100%;min-height:0;font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
.tk textarea{min-height:72px;max-height:140px;resize:vertical}
.tk button{border:0;background:var(--pri);color:var(--onpri);font:inherit;font-weight:700;border-radius:10px;padding:8px 14px;cursor:pointer;align-self:flex-start}
.tk button:disabled{opacity:.5;cursor:default}
.tk .e{color:var(--warnink);font-size:13px}
form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line)}
form textarea{flex:1;resize:none;font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;max-height:90px}
form button{border:0;background:var(--pri);color:var(--onpri);font:inherit;font-weight:700;border-radius:10px;padding:0 16px;cursor:pointer}
form button:disabled{opacity:.5;cursor:default}
.ft{padding:6px 14px 10px;color:var(--mut);font-size:12px}.ft a{color:var(--mut)}
:focus-visible{outline:2px solid var(--pri);outline-offset:2px}
</style>
<button id="fab" aria-haspopup="dialog"></button>
<section id="chat" role="dialog" aria-label="Asiakaspalvelu">
  <div class="hd"><div><b id="t"></b><small id="st"></small></div><div class="act"><button id="rs" type="button" title="Tyhjennä keskustelu ja palaa alkuun"></button><button id="x" aria-label="Sulje chat">×</button></div></div>
  <div id="log" aria-live="polite"></div>
  <form id="f"><textarea id="q" rows="1" maxlength="800" placeholder="Kirjoita kysymys…" aria-label="Viesti"></textarea><button id="s">Lähetä</button></form>
  <div class="ft">Tekoäly voi erehtyä. Älä jaa salasanoja tai pankkitietoja. Peliongelmiin apua: <a href="https://www.peluuri.fi" target="_blank" rel="noopener">peluuri.fi</a></div>
</section>`;
const $ = id => root.getElementById(id), log = $('log'), q = $('q'), s = $('s');
$('fab').textContent = CFG.fabLabel; $('t').textContent = CFG.title; $('st').textContent = CFG.sub; $('rs').textContent = CFG.restartLabel;
const history = []; let busy = false, started = false, gen = 0;

/* Human support is open Monday-Friday 08:00-16:00 Finnish time (public holidays are not handled). */
function supportOpen() {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
    const wd = p.find(x => x.type === 'weekday').value; let h = parseInt(p.find(x => x.type === 'hour').value, 10); if (h === 24) h = 0;
    return wd !== 'Sat' && wd !== 'Sun' && h >= 8 && h < 16;
  } catch (e) { return true; }
}

function linkify(el, text) {            // text only; links are real elements, never HTML strings
  const re = /https:\/\/[^\s)]+/g; let i = 0, m;
  while ((m = re.exec(text))) { el.append(text.slice(i, m.index)); const a = document.createElement('a'); a.href = m[0]; a.textContent = m[0]; a.target = '_blank'; a.rel = 'noopener noreferrer'; el.append(a); i = m.index + m[0].length; }
  el.append(text.slice(i));
}
function put(node) { log.appendChild(node); log.scrollTop = log.scrollHeight; return node; }
function add(cls, text) { const d = document.createElement('div'); d.className = 'm ' + cls; linkify(d, text); return put(d); }
function link(href, label) { const a = document.createElement('a'); a.className = 'hand'; a.textContent = label; a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return put(a); }
function contact(url) {
  if (url && /^(https:|mailto:)/.test(url)) link(url, CFG.contactLabel);
  else if (CFG.contactUrl && /^(https:|mailto:)/.test(CFG.contactUrl)) link(CFG.contactUrl, CFG.contactLabel);
}
function chips(labels) {
  const qd = document.createElement('div'); qd.className = 'quick';
  labels.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => send(t); qd.appendChild(b); });
  put(qd);
}
function ticketForm() {
  const open = supportOpen(), g = gen;
  const box = document.createElement('div'); box.className = 'tk';
  const p = document.createElement('p');
  p.textContent = open ? 'Voit jättää asiasi tähän. Asiakaspalvelija näkee sen keskusteluineen, eikä sinun tarvitse kirjoittaa kaikkea uudelleen.'
    : 'Asiakaspalvelu on nyt kiinni (arkisin klo 8–16). Jätä asiasi tähän, niin se on valmiina heti seuraavana arkipäivänä.';
  const ta = document.createElement('textarea'); ta.maxLength = 1000; ta.placeholder = 'Kerro, mitä tapahtui'; ta.setAttribute('aria-label', 'Viesti asiakaspalvelulle');
  const em = document.createElement('input'); em.type = 'email'; em.maxLength = 150; em.placeholder = 'Sähköposti vastausta varten (valinnainen)'; em.setAttribute('aria-label', 'Sähköposti');
  const note = document.createElement('small'); note.textContent = 'Demo: viesti tallentuu vain testidataan eikä mene oikealle asiakaspalvelijalle. Älä kirjoita oikeita henkilötietoja.';
  const err = document.createElement('div'); err.className = 'e'; err.hidden = true;
  const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Lähetä viesti';
  btn.onclick = async () => {
    const message = ta.value.trim();
    if (message.length < 5) { err.textContent = 'Kirjoita viestiin vähintään muutama sana.'; err.hidden = false; return; }
    err.hidden = true; btn.disabled = true;
    try {
      const r = await fetch(CFG.ticketEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message, email: em.value.trim(), transcript: history.slice(-8) }) });
      const j = await r.json().catch(() => ({}));
      if (g !== gen) return;
      if (r.ok && j.ok) { box.remove(); add('bot', open ? 'Kiitos, viestisi on tallennettu. Asiakaspalvelija näkee sen keskusteluineen.' : 'Kiitos, viestisi on tallennettu. Se on asiakaspalvelun nähtävillä seuraavana arkipäivänä.'); return; }
      err.textContent = j.error === 'bad_email' ? 'Sähköpostiosoite näyttää virheelliseltä.' : j.error === 'busy' ? 'Viestejä on tänään jo paljon. Yritä huomenna uudelleen.' : 'Viestin tallennus epäonnistui. Yritä hetken päästä uudelleen.';
    } catch (e) { if (g !== gen) return; err.textContent = 'Viestin tallennus epäonnistui. Yritä hetken päästä uudelleen.'; }
    err.hidden = false; btn.disabled = false;
  };
  box.append(p, ta, em, btn, err, note); put(box);
}
async function showNotice(g) {           // congestion notice written on the admin page
  try {
    const r = await fetch(CFG.endpoint); const j = await r.json();
    if (g !== gen || !j || !j.campaign) return;
    const d = document.createElement('div'); d.className = 'm notice'; d.textContent = j.campaign;
    log.insertBefore(d, log.firstChild);
  } catch (e) { /* the notice is optional */ }
}
function start() {
  add('bot', CFG.hello); chips(CFG.quick); showNotice(gen);
}
function open() {
  $('chat').classList.add('open'); $('fab').style.display = 'none';
  if (!started) { started = true; start(); }
  q.focus();
}
function close() { $('chat').classList.remove('open'); $('fab').style.display = ''; $('fab').focus(); }
function restart() {                    // clear the conversation and show the start menu again
  gen++; busy = false; s.disabled = false; history.length = 0; log.textContent = ''; q.value = '';
  start(); q.focus();
}
async function send(text) {
  text = text.trim(); if (!text || busy) return; busy = true; s.disabled = true;
  const g = gen;
  log.querySelectorAll('.quick').forEach(e => e.remove());
  add('me', text); history.push({ role: 'user', content: text }); q.value = '';
  const wait = add('bot typing', 'Kirjoittaa…');
  try {
    const r = await fetch(CFG.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-11) }) });
    const j = await r.json().catch(() => ({}));
    if (g !== gen) return;              // the conversation was restarted while waiting: drop this answer
    wait.remove();
    if (!r.ok || !j.reply) {
      history.pop();
      add('err', (ERR[j.error] || ERR.upstream) + (j.error === 'upstream' ? ' (koodi: ' + (j.status || '?') + (j.type ? ', ' + j.type : '') + ')' : (r.status === 404 ? ' (koodi: 404, funktiota ei löydy)' : '')));
      if (j.error === 'busy' || j.error === 'not_configured') ticketForm();
    } else {
      history.push({ role: 'assistant', content: j.reply }); add('bot', j.reply);
      if (j.rg) link('https://www.peluuri.fi', 'Peluuri: maksutonta ja luottamuksellista apua');
      if (j.handoff) { ticketForm(); contact(j.contact); }
      if (Array.isArray(j.options) && j.options.length) chips(j.options);
    }
  } catch (e) { if (g !== gen) return; wait.remove(); history.pop(); add('err', ERR.upstream); }
  busy = false; s.disabled = false; q.focus();
}
$('fab').onclick = open; $('x').onclick = close; $('rs').onclick = restart;
$('f').onsubmit = e => { e.preventDefault(); send(q.value); };
q.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(q.value); } if (e.key === 'Escape') close(); };
if (CFG.autoOpen) open();
})();
