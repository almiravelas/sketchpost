// Shared look-and-feel for the public tracker and the artist desk.
// Everything here builds HTML strings or small widgets; nothing talks to Firebase.

export const N = '#2f4fa8', P = '#fffaf1', R = '#e5463b';
export const COLORS = { pink:'#f4a3a3', yellow:'#f6c944', green:'#bcd84a', orange:'#f6ad4b', sky:'#a9c8ff', cream:'#fde8c4' };
const S = `stroke="${N}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
export const ICONS = {
  pencil:`<svg viewBox="0 0 60 60"><g transform="rotate(-35 30 30)"><rect x="24" y="8" width="12" height="34" rx="2" fill="${P}" ${S}/><rect x="24" y="8" width="12" height="7" fill="${R}" ${S}/><path d="M24 42 L30 54 L36 42 Z" fill="#f7d9a8" ${S}/><path d="M28.4 50.6 L30 54 L31.6 50.6Z" fill="${N}"/></g></svg>`,
  brush:`<svg viewBox="0 0 60 60"><g transform="rotate(35 30 30)"><rect x="26" y="3" width="8" height="27" rx="4" fill="${R}" ${S}/><rect x="25" y="29" width="10" height="8" fill="${P}" ${S}/><path d="M25 37 C25 46 30 55 30 55 C30 55 35 46 35 37Z" fill="${N}" ${S}/></g></svg>`,
  sparkle:`<svg viewBox="0 0 60 60"><path d="M30 7 C32 22 38 28 53 30 C38 32 32 38 30 53 C28 38 22 32 7 30 C22 28 28 22 30 7Z" fill="${P}" ${S}/><path d="M48 6 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="${N}"/><circle cx="12" cy="49" r="2.6" fill="${R}"/></svg>`,
  envelope:`<svg viewBox="0 0 60 60"><rect x="7" y="15" width="46" height="31" rx="3" fill="${P}" ${S}/><path d="M8 17 L30 33 L52 17" fill="none" ${S}/><path d="M30 42 c-5-3.4-7.5-5.8-7.5-8.6 a3.6 3.6 0 0 1 7.5-1.4 a3.6 3.6 0 0 1 7.5 1.4 c0 2.8-2.5 5.2-7.5 8.6z" fill="${R}"/></svg>`,
  heart:`<svg viewBox="0 0 60 60"><path d="M30 51 C14 41 8 32 8 23 C8 16 13 11 19 11 C24 11 28 14 30 18 C32 14 36 11 41 11 C47 11 52 16 52 23 C52 32 46 41 30 51Z" fill="${R}" ${S}/><path d="M17 21 q2-4 6-4" fill="none" stroke="${P}" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  star:`<svg viewBox="0 0 60 60"><path d="M30 7 L36.5 22.5 L53 23.5 L40.5 34 L44.5 51 L30 42 L15.5 51 L19.5 34 L7 23.5 L23.5 22.5Z" fill="${P}" ${S}/><circle cx="25" cy="31" r="2" fill="${N}"/><circle cx="35" cy="31" r="2" fill="${N}"/></svg>`
};
export const ICON_NAMES = { pencil:'Pencil', brush:'Paintbrush', sparkle:'Sparkle', envelope:'Envelope', heart:'Heart', star:'Star' };
export const CLIP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/></svg>`;
export const CHEV = `<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
export const UP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>`;
export const DOWN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
export const TRASH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`;
export const MAIL = `<svg viewBox="0 0 40 28"><rect x="2" y="2" width="36" height="24" rx="3" fill="${P}" stroke="${N}" stroke-width="2.5"/><path d="M3 4l17 12 17-12" fill="none" stroke="${N}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="20" cy="18" r="4" fill="${R}"/></svg>`;

/* ---------- small helpers ---------- */
export const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const uid = () => Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(36)).join('');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const parseISO = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const fmt = s => { const d = parseISO(s); return d ? d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—'; };
export const okSrc = s => typeof s === 'string' && /^(https?:|data:image\/)/i.test(s);

/* ---------- data shape ---------- */
export function normalizeStages(arr) {
  return (Array.isArray(arr) ? arr : []).map(s => ({
    id: String((s && s.id) || '').replace(/[^\w-]/g, '') || uid(),
    name: String((s && s.name) || 'Stage'),
    note: String((s && s.note) || ''),
    date: String((s && s.date) || ''),
    status: ['pending', 'current', 'done'].includes(s && s.status) ? s.status : 'pending',
    icon: s && has(ICONS, s.icon) ? s.icon : 'star',
    color: s && has(COLORS, s.color) ? s.color : 'pink'
  }));
}
export function normalizeCommission(id, d = {}) {
  return {
    id,
    title: String(d.title || ''),
    client: String(d.client || ''),
    artist: String(d.artist || ''),
    eta: String(d.eta || ''),
    stages: normalizeStages(d.stages)
  };
}
export const DEFAULT_STAGE_NAMES = ['Sketching', 'Rendering', 'Final touches', 'Delivered'];
const STAGE_ICON_GUESS = [
  [/sketch|draft|line|pencil|rough/i, 'pencil'], [/render|colou?r|paint|flat|shad/i, 'brush'],
  [/final|touch|polish|detail|clean/i, 'sparkle'], [/deliver|send|ship|done|mail/i, 'envelope'],
  [/revis|feedback|review|love|thank/i, 'heart']
];
const guessIcon = name => (STAGE_ICON_GUESS.find(([re]) => re.test(name)) || [, 'star'])[1];
export function defaultStages(names = DEFAULT_STAGE_NAMES) {
  const list = (names && names.length ? names : DEFAULT_STAGE_NAMES).slice(0, 20);
  const colors = Object.keys(COLORS);
  return list.map((name, i) => ({ id:uid(), name:String(name).slice(0, 40), note:'', date:'', status:'pending', icon:guessIcon(name), color:colors[i % colors.length] }));
}

/* ---------- artist profile & theming ---------- */
export const THEME_PRESETS = {
  'Post office': { bg:'#5b8def', paper:'#fffaf1', ink:'#2f4fa8', accent:'#e5463b', highlight:'#f6c944' },
  'Mint mail':   { bg:'#3fae8f', paper:'#fbfaf3', ink:'#1f5f4f', accent:'#e2603f', highlight:'#ffd166' },
  'Peach':       { bg:'#f2a07b', paper:'#fff8f1', ink:'#7a3b2e', accent:'#2f6fd6', highlight:'#ffe08a' },
  'Lavender':    { bg:'#9b8cf0', paper:'#fdfbff', ink:'#43358f', accent:'#e8508a', highlight:'#ffd36e' },
  'Cherry':      { bg:'#e5534b', paper:'#fffaf1', ink:'#8a1f2a', accent:'#2f4fa8', highlight:'#ffd166' },
  'Night mail':  { bg:'#23263a', paper:'#fff9ee', ink:'#2b3a78', accent:'#ff6b5e', highlight:'#ffc94a' }
};
export const DEFAULT_THEME = THEME_PRESETS['Post office'];
const HEX = /^#[0-9a-f]{6}$/i;
export function normalizeTheme(t = {}) {
  const out = {};
  for (const k of Object.keys(DEFAULT_THEME)) out[k] = HEX.test(t && t[k]) ? t[k].toLowerCase() : DEFAULT_THEME[k];
  return out;
}
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
export function luminance(h) {
  const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// Sets the CSS variables the stylesheet uses. Pass an element to theme only that area (e.g. a preview box).
export function applyTheme(theme, el = document.documentElement) {
  const t = normalizeTheme(theme);
  const lightPaper = luminance(t.paper) > 0.45;
  const vars = {
    '--blue': t.bg, '--paper': t.paper, '--navy': t.ink, '--red': t.accent, '--yellow': t.highlight,
    '--blue-2': t.ink,
    '--shadow': mix(t.bg, '#000000', 0.32),
    '--on-bg': luminance(t.bg) > 0.5 ? mix(t.ink, '#000000', 0.25) : '#ffffff',
    '--on-accent': luminance(t.accent) > 0.55 ? '#25304d' : '#ffffff',
    '--ink': lightPaper ? '#25304d' : '#f4f0e8',
    '--muted': lightPaper ? mix('#6c7591', t.ink, 0.15) : '#c9c4ba',
    '--paper-2': mix(t.paper, t.ink, 0.07),
    '--line': mix(t.paper, t.ink, 0.13)
  };
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
  if (el === document.documentElement) {
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = t.bg;
  }
}
export const cleanHandle = s => String(s || '').toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9._]/g, '').slice(0, 30);
export const cleanPrefix = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
export function normalizeArtist(d = {}) {
  const prefix = cleanPrefix(d.prefix);
  return {
    studioName: String(d.studioName || 'My studio').slice(0, 60),
    handle: cleanHandle(d.handle),
    headline: String(d.headline || 'Where’s my art?').slice(0, 60),
    thanks: String(d.thanks || 'Thanks for waiting. Good things take a few stamps.').slice(0, 160),
    prefix: prefix.length >= 2 ? prefix : 'PP',
    logo: has(ICONS, d.logo) ? d.logo : 'envelope',
    theme: normalizeTheme(d.theme),
    defaultStages: Array.isArray(d.defaultStages) && d.defaultStages.length
      ? d.defaultStages.map(s => String(s).trim()).filter(Boolean).slice(0, 20) : DEFAULT_STAGE_NAMES.slice()
  };
}
export const postLabel = artist => (artist && artist.studioName ? artist.studioName : 'SKETCHPOST').toUpperCase().slice(0, 13);
export function groupImages(images) {
  const map = new Map();
  for (const im of images || []) {
    if (!im || !okSrc(im.src)) continue;
    if (!map.has(im.stageId)) map.set(im.stageId, []);
    map.get(im.stageId).push(im);
  }
  return map;
}

/* ---------- render pieces ---------- */
export function summary(stages) {
  const total = stages.length;
  const done = stages.filter(s => s.status === 'done').length;
  const cur = stages.findIndex(s => s.status === 'current');
  let kind = 'created', label = 'Label created';
  if (total && done === total) { kind = 'delivered'; label = 'Delivered!'; }
  else if (cur >= 0) { kind = 'transit'; label = stages[cur].name; }
  else if (done > 0) { kind = 'transit'; label = 'Between stages'; }
  return { total, done, cur, kind, label };
}

export function barcode(text) {
  const s = (text || 'PARCEL').toUpperCase();
  let x = 0, bars = '';
  for (const ch of s + s) {
    const c = ch.charCodeAt(0), w1 = 1 + (c % 3), w2 = 1 + ((c >> 2) % 3);
    bars += `<rect x="${x}" y="0" width="${w1}" height="40"/>`;
    x += w1 + w2;
  }
  return `<svg class="barcode" viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}

export function ticketHTML(c) {
  const s = summary(c.stages);
  let status;
  if (s.kind === 'delivered') status = `<p class="eyebrow">Status</p><p class="status-text">Delivered!</p><p class="sub">Your artwork has arrived. Enjoy!</p>`;
  else if (s.kind === 'created') status = `<p class="eyebrow">Status</p><p class="status-text">Label created</p><p class="sub">Work hasn’t started yet.</p>`;
  else status = `<p class="eyebrow">In transit · now at</p><p class="status-text">${esc(s.label)}</p><p class="sub">${s.cur >= 0 ? `Stage ${s.cur + 1} of ${s.total}` : `${s.done} of ${s.total} stages cleared`}</p>`;
  return `<div class="airmail"></div>
    <div class="ticket-body">
      <div class="ticket-main">
        <p class="eyebrow">Tracking no.</p>
        <p class="tracking">${esc(c.id || '—')}</p>
        <h2>${esc(c.title || 'Untitled commission')}</h2>
        <dl class="meta">
          <div><dt>To</dt><dd>${esc(c.client || '—')}</dd></div>
          <div><dt>From</dt><dd>${esc(c.artist || '—')}</dd></div>
          <div><dt>Est. delivery</dt><dd>${fmt(c.eta)}</dd></div>
        </dl>
        ${barcode(c.id)}
      </div>
      <div class="ticket-status status-${s.kind}">${status}</div>
    </div>`;
}

export function routeHTML(stages) {
  const n = stages.length, s = summary(stages);
  const pos = i => n <= 1 ? 50 : (i / (n - 1)) * 100;
  let at = 0;
  if (s.kind === 'delivered') at = pos(n - 1);
  else if (s.cur >= 0) at = pos(s.cur);
  else if (s.done > 0) at = pos(stages.map(x => x.status).lastIndexOf('done'));
  return `<div class="route-head"><span class="eyebrow">Route</span><span>${s.done}/${n} stages cleared</span></div>
    <div class="track">
      <div class="line"></div><div class="fill" style="width:${at}%"></div>
      ${stages.map((x, i) => `<div class="stop st-${x.status}" style="left:${pos(i)}%"><span class="dot"></span><span class="stop-label">${esc(x.name)}</span></div>`).join('')}
      <div class="mail" style="left:${at}%" aria-hidden="true">${MAIL}</div>
    </div>`;
}

export function postmark(date, label = 'SKETCHPOST') {
  const d = parseISO(date);
  const day = d ? d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }).toUpperCase() : 'OK';
  const yr = d ? d.getFullYear() : '';
  const wave = y => `<path d="M100 ${y} q8 -7 16 0 t16 0 t16 0 t16 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
  return `<svg class="postmark" viewBox="0 0 170 100" aria-hidden="true">
    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="50" cy="50" r="31" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text font-family="Nunito, sans-serif" font-size="10" font-weight="900" letter-spacing="2" fill="currentColor"><textPath href="#pm-top" startOffset="50%" text-anchor="middle">${esc(label)}</textPath></text>
    <text font-family="Nunito, sans-serif" font-size="10" font-weight="900" letter-spacing="2" fill="currentColor"><textPath href="#pm-bot" startOffset="50%" text-anchor="middle">CLEARED</textPath></text>
    <text x="50" y="49" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="currentColor">${esc(day)}</text>
    <text x="50" y="62" text-anchor="middle" font-family="Nunito, sans-serif" font-size="10" font-weight="800" fill="currentColor">${yr}</text>
    ${wave(32)}${wave(45)}${wave(58)}${wave(71)}
  </svg>`;
}

export function stampCol(st, i, label) {
  return `<div class="stamp-col">
    <div class="stamp" style="--c:${COLORS[st.color] || COLORS.pink}">
      <div class="art">
        <span class="denom">${String(i + 1).padStart(2, '0')}</span>
        <span class="motif">${ICONS[st.icon] || ICONS.star}</span>
        <span class="stamp-label">${esc(st.name || 'Stage')}</span>
      </div>
    </div>
    ${st.status === 'done' ? postmark(st.date, label) : ''}
  </div>`;
}

// Small stamp used on the studio's parcel list: shows the stage the parcel is at.
export function miniStamp(stages) {
  const s = summary(stages);
  const idx = s.cur >= 0 ? s.cur : s.kind === 'delivered' ? stages.length - 1 : Math.max(0, stages.findIndex(x => x.status !== 'done'));
  const st = stages[idx] || { icon:'envelope', color:'sky' };
  return `<div class="stamp mini ${s.kind === 'created' ? 'is-pending' : ''}" style="--c:${COLORS[st.color] || COLORS.pink}"><div class="art"><span class="denom">${String(idx + 1).padStart(2, '0')}</span><span class="motif">${ICONS[st.icon] || ICONS.star}</span></div></div>`;
}

export const thumbBtn = (st, im, k) =>
  `<button class="thumb" data-act="open" data-k="${k}" aria-label="Open ${esc(st.name)} proof ${k + 1}"><img src="${esc(im.src)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('broken')"></button>`;

// eta: the parcel's estimated delivery date, shown on the final stage until it's cleared.
export function viewCard(st, i, n, imgs, open, eta = '') {
  const [pc, pt] = { done:['pill-done', 'Cleared'], current:['pill-current', 'In transit'], pending:['pill-pending', 'Awaiting'] }[st.status];
  const d = fmt(st.date);
  let when = st.status === 'done' ? `Postmarked ${d}` : st.status === 'current' ? (st.date ? `Picked up ${d}` : 'In progress') : (st.date ? `Scheduled ${d}` : 'Awaiting dispatch');
  if (i === n - 1 && st.status !== 'done' && parseISO(eta)) {
    when = st.status === 'current' ? `${when} · Est. delivery ${fmt(eta)}` : `Est. delivery ${fmt(eta)}`;
  }
  const proofs = imgs.length
    ? `<button class="proof-link" data-act="toggle-proofs" aria-expanded="${open}">${CLIP}View attached proof${imgs.length > 1 ? 's' : ''} (${imgs.length})${CHEV}</button>
       <div class="thumbs" ${open ? '' : 'hidden'}>${imgs.map((im, k) => thumbBtn(st, im, k)).join('')}</div>`
    : `<p class="no-proofs">No proofs posted yet.</p>`;
  return `<div class="card-top"><span class="eyebrow">Stage ${i + 1} of ${n}</span><span class="pill ${pc}">${pt}</span></div>
    <h3>${esc(st.name)}</h3>
    <p class="when">${when}</p>
    ${st.note ? `<p class="note">${esc(st.note)}</p>` : ''}
    <div class="proofs">${proofs}</div>`;
}

/* ---------- toast ---------- */
let toastEl, toastTimer;
export function toast(msg, ms = 2800) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

/* ---------- two-tap confirm ---------- */
export function twoStep(btn, fn) {
  if (btn.dataset.armed) { fn(); return; }
  btn.dataset.armed = '1';
  const old = btn.innerHTML;
  btn.classList.add('armed'); btn.textContent = btn.dataset.confirm || 'Sure?';
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.classList.remove('armed'); btn.innerHTML = old; } }, 2800);
}

/* ---------- lightbox ---------- */
// getStage(stageId) -> { name, images:[{src}] } | null
export function createLightbox(getStage) {
  const lb = document.createElement('div');
  lb.className = 'lightbox'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Proof preview');
  lb.innerHTML = `<button class="lb-btn lb-close" aria-label="Close">×</button>
    <button class="lb-btn lb-prev" aria-label="Previous proof">‹</button>
    <figure class="lb-figure"><img alt=""><figcaption></figcaption></figure>
    <button class="lb-btn lb-next" aria-label="Next proof">›</button>`;
  document.body.appendChild(lb);
  const img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
  let state = null, lastFocus = null;

  function show() {
    const st = getStage(state.stageId);
    if (!st || !st.images.length) { close(); return; }
    state.k = Math.min(state.k, st.images.length - 1);
    const n = st.images.length;
    img.src = st.images[state.k].src;
    img.alt = `${st.name}, proof ${state.k + 1}`;
    cap.textContent = `${st.name} · proof ${state.k + 1} of ${n}`;
    lb.querySelector('.lb-prev').hidden = lb.querySelector('.lb-next').hidden = n < 2;
  }
  function open(stageId, k) {
    const st = getStage(stageId); if (!st || !st.images[k]) return;
    state = { stageId, k }; lastFocus = document.activeElement;
    show(); lb.hidden = false; document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function step(d) { const n = getStage(state.stageId).images.length; state.k = (state.k + d + n) % n; show(); }
  function close() { lb.hidden = true; state = null; document.body.style.overflow = ''; if (lastFocus && lastFocus.isConnected) lastFocus.focus(); }

  lb.addEventListener('click', e => {
    if (e.target === lb || e.target.closest('.lb-close')) close();
    else if (e.target.closest('.lb-prev')) step(-1);
    else if (e.target.closest('.lb-next')) step(1);
  });
  document.addEventListener('keydown', e => {
    if (!state) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
  return { open, close, contains: el => lb.contains(el) };
}

/* ---------- image compression (keeps each proof under Firestore's 1 MB document limit) ---------- */
// ~330 KB per proof keeps the shared free database roomy for many artists.
const MAX_CHARS = 450000;
export async function compressImage(file) {
  const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  if (file.type === 'image/gif' && url.length < MAX_CHARS) return url;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`Couldn’t read ${file.name}`)); i.src = url; });
  let max = 1400, q = 0.82;
  for (let t = 0; t < 7; t++) {
    const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * sc)); c.height = Math.max(1, Math.round(img.naturalHeight * sc));
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    const out = c.toDataURL('image/jpeg', q);
    if (out.length < MAX_CHARS) return out;
    max = Math.round(max * 0.8); q = Math.max(0.55, q - 0.07);
  }
  throw new Error(`${file.name} is too large to post`);
}

/* ---------- demo content (shown before Firebase is connected) ---------- */
function doodle(kind) {
  const G = '#8b90a0';
  let art;
  if (kind === 'render') {
    art = `<circle cx="300" cy="360" r="235" fill="#d9e6ff"/>
      <g stroke="${N}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M210 402 q-38 150 14 222 h152 q52 -72 14 -222 Z" fill="#f4a3a3"/>
        <path d="M198 252 L212 150 L272 206 Z" fill="#f6c944"/><path d="M328 206 L388 150 L402 252 Z" fill="#f6c944"/>
        <ellipse cx="300" cy="300" rx="122" ry="108" fill="#f6c944"/>
        <path d="M216 400 q84 40 168 0" fill="none" stroke="${R}" stroke-width="20"/>
      </g>
      <circle cx="254" cy="298" r="11" fill="${N}"/><circle cx="346" cy="298" r="11" fill="${N}"/>
      <ellipse cx="224" cy="336" rx="20" ry="12" fill="#f08a8a"/><ellipse cx="376" cy="336" rx="20" ry="12" fill="#f08a8a"/>
      <path d="M284 334 q16 14 32 0" fill="none" stroke="${N}" stroke-width="6" stroke-linecap="round"/>`;
  } else {
    const rot = kind === 'sketch2' ? 'rotate(-9 300 380)' : 'rotate(0)';
    art = `<g transform="${rot}" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M198 252 L212 150 L272 206"/><path d="M328 206 L388 150 L402 252"/>
        <ellipse cx="300" cy="300" rx="122" ry="108"/><ellipse cx="303" cy="297" rx="128" ry="102" opacity=".45"/>
        <path d="M300 200 v200 M190 300 h220" opacity=".3"/>
        <circle cx="254" cy="298" r="9"/><circle cx="346" cy="298" r="9"/><path d="M284 334 q16 14 32 0"/>
        <path d="M210 402 q-38 150 14 222 h152 q52 -72 14 -222"/><path d="M216 398 q84 38 168 0" opacity=".6"/>
      </g>`;
  }
  const label = { sketch:'rough sketch · option A', sketch2:'rough sketch · option B', render:'flat colours · work in progress' }[kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><rect width="600" height="750" fill="${P}"/>${art}<text x="300" y="712" text-anchor="middle" font-family="Gaegu, 'Comic Sans MS', cursive" font-size="34" fill="${kind === 'render' ? N : G}">${label}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
export const demoArtist = () => normalizeArtist({ studioName:'sigbinnie', handle:'sigbinnie', prefix:'SB', logo:'envelope', theme:DEFAULT_THEME });
export function demoCommission() {
  const st = [
    { id:'s1', name:'Sketching', status:'done', date:'2026-10-16', icon:'pencil', color:'pink', note:'Rough poses and composition. You picked option B, thank you!' },
    { id:'s2', name:'Rendering', status:'current', date:'2026-10-22', icon:'brush', color:'yellow', note:'Flat colours are down. Now working on lighting and shading.' },
    { id:'s3', name:'Final touches', status:'pending', date:'', icon:'sparkle', color:'green', note:'Texture pass, small fixes, and one round of tiny tweaks.' },
    { id:'s4', name:'Delivered', status:'pending', date:'', icon:'envelope', color:'orange', note:'Full-resolution PNG and a print-ready file, sent to your inbox.' }
  ];
  return {
    commission: normalizeCommission('SB-DEMO-2026', { title:'Pet portrait: “Mochi in the garden”', client:'Bea S.', artist:'@sigbinnie', eta:'2026-11-14', stages:st }),
    images: [
      { id:'i1', stageId:'s1', src:doodle('sketch') },
      { id:'i2', stageId:'s1', src:doodle('sketch2') },
      { id:'i3', stageId:'s2', src:doodle('render') }
    ]
  };
}
