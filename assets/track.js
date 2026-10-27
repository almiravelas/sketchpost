// Client tracking page (/t/CODE). Read-only, and dressed in the artist's own studio colors.
import { isConfigured } from './firebase-config.js';
import * as ui from './ui.js';

const $ = id => document.getElementById(id);
const ticketEl = $('ticket'), routeEl = $('route'), stagesEl = $('stages');
const lookupEl = $('lookup'), msgEl = $('message');

let parcel = null, artist = null, images = [], firstDraw = true;
const openProofs = new Set();

const lightbox = ui.createLightbox(id => {
  const st = parcel && parcel.stages.find(s => s.id === id);
  return st ? { name: st.name, images: ui.groupImages(images).get(id) || [] } : null;
});

$('logoMotif').innerHTML = ui.ICONS.envelope;

/* ---------- routing: /t/CODE (Vercel) or ?t=CODE ---------- */
function getCode() {
  const m = location.pathname.match(/^\/t\/([^/]+)\/?$/);
  const raw = m ? decodeURIComponent(m[1]) : (new URLSearchParams(location.search).get('t') || '');
  return raw.trim().toUpperCase();
}
const validCode = c => /^[A-Z0-9][A-Z0-9-]{2,29}$/.test(c);

/* ---------- views ---------- */
function showLookup(note) {
  lookupEl.hidden = false;
  const n = $('lookupNote');
  n.hidden = !note; n.textContent = note || '';
}
function showMessage(title, text, loading = false) {
  msgEl.hidden = false;
  msgEl.innerHTML = `${loading ? `<div class="loading-mail" aria-hidden="true">${ui.MAIL}</div>` : ''}<h2>${ui.esc(title)}</h2>${text ? `<p class="lede">${ui.esc(text)}</p>` : ''}`;
}
function clearParcel() { ticketEl.hidden = routeEl.hidden = true; stagesEl.innerHTML = ''; }

function dressUp(a) {
  artist = a;
  ui.applyTheme(a.theme);
  $('logoMotif').innerHTML = ui.ICONS[a.logo] || ui.ICONS.envelope;
  $('studioLine').textContent = a.handle ? `${a.studioName} · @${a.handle}` : a.studioName;
  $('headline').textContent = a.headline;
}

function draw() {
  if (!parcel) return;
  msgEl.hidden = true; lookupEl.hidden = true;
  document.title = `${parcel.title || 'Your commission'} · ${artist ? artist.studioName : 'Parcel Post'}`;
  const st = parcel.stages, n = st.length, label = ui.postLabel(artist);
  if (firstDraw) { const c = st.find(s => s.status === 'current'); if (c) openProofs.add(c.id); firstDraw = false; }
  ticketEl.hidden = false; ticketEl.innerHTML = ui.ticketHTML(parcel);
  routeEl.hidden = !n; routeEl.innerHTML = n ? ui.routeHTML(st) : '';
  const groups = ui.groupImages(images);
  stagesEl.innerHTML = n
    ? st.map((s, i) => `<article class="stage s-${s.status}" data-id="${s.id}">${ui.stampCol(s, i, label)}<div class="card">${ui.viewCard(s, i, n, groups.get(s.id) || [], openProofs.has(s.id), parcel.eta)}</div></article>`).join('')
    : `<div class="empty">Your parcel is being packed. Check back soon!</div>`;
}

/* ---------- interactions ---------- */
stagesEl.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const sid = b.closest('[data-id]')?.dataset.id; if (!sid) return;
  if (b.dataset.act === 'toggle-proofs') {
    const open = !openProofs.has(sid);
    open ? openProofs.add(sid) : openProofs.delete(sid);
    b.setAttribute('aria-expanded', open);
    b.nextElementSibling.hidden = !open;
  } else if (b.dataset.act === 'open') {
    lightbox.open(sid, +b.dataset.k);
  }
});

$('lookupForm').addEventListener('submit', e => {
  e.preventDefault();
  const code = $('lookupInput').value.trim().toUpperCase().replace(/\s+/g, '');
  if (!validCode(code)) { showLookup('Tracking numbers use letters, numbers and dashes.'); return; }
  location.href = `/t/${encodeURIComponent(code)}`;
});

/* ---------- start ---------- */
async function start() {
  const code = getCode();

  if (!isConfigured) {
    $('banner').hidden = false;
    const demo = ui.demoCommission();
    dressUp(ui.demoArtist());
    parcel = demo.commission; images = demo.images;
    draw();
    return;
  }

  if (!code) { showLookup(); return; }
  if (!validCode(code)) { showLookup('That tracking number doesn’t look right. Check for typos?'); return; }
  $('lookupInput').value = code;

  showMessage('Fetching your parcel…', '', true);
  let fb;
  try { fb = await import('./firebase.js'); }
  catch (err) { console.error(err); showMessage('Couldn’t reach the post office', 'Check your connection and refresh the page.'); return; }

  let ownerLoaded = null;
  fb.onSnapshot(fb.doc(fb.db, 'parcels', code), async snap => {
    if (!snap.exists()) {
      parcel = null; clearParcel(); msgEl.hidden = true;
      showLookup(`We couldn’t find parcel ${code}. Double-check the tracking number?`);
      return;
    }
    const d = snap.data();
    if (d.ownerId && d.ownerId !== ownerLoaded) {
      ownerLoaded = d.ownerId;
      try {
        const a = await fb.getDoc(fb.doc(fb.db, 'artists', d.ownerId));
        if (a.exists()) dressUp(ui.normalizeArtist(a.data()));
      } catch (err) { console.error(err); }
    }
    parcel = ui.normalizeCommission(snap.id, d);
    draw();
  }, err => {
    console.error(err);
    clearParcel();
    showMessage('Couldn’t load this parcel', 'Please refresh in a moment.');
  });

  fb.onSnapshot(fb.query(fb.collection(fb.db, 'parcels', code, 'images'), fb.orderBy('order')), qs => {
    images = qs.docs.map(d => ({ id: d.id, ...d.data() }));
    draw();
  }, err => console.error(err));
}
start();
