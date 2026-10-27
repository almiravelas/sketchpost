// Artist studio: sign up with Google, customize your look, and manage any number of parcels.
// Every write is checked by firestore.rules, so artists can only ever touch their own studio and parcels.
import { isConfigured } from './firebase-config.js';
import * as ui from './ui.js';

const AUTH_URL = 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
const $ = id => document.getElementById(id);
const root = $('studio-root'), picker = $('filePicker');
const { esc } = ui;

let fb, authApi, auth;
let user = null, artist = null;            // signed-in user and their studio profile
let parcels = [];                           // summaries for the list view
let view = 'list', cur = null, data = null, images = [], unsubImages = null;
let saveTimer = null, settingsTimer = null, draft = null, pendingUpload = null;
const filter = { q: '', status: 'all' };

const lightbox = ui.createLightbox(id => {
  const st = data && data.stages.find(s => s.id === id);
  return st ? { name: st.name, images: imagesFor(id) } : null;
});

const parcelRef = code => fb.doc(fb.db, 'parcels', code);
const artistRef = () => fb.doc(fb.db, 'artists', user.uid);
const imagesCol = code => fb.collection(fb.db, 'parcels', code, 'images');
const imagesFor = stageId => images.filter(im => im.stageId === stageId && ui.okSrc(im.src));
const clientLink = code => `${location.origin}/t/${encodeURIComponent(code)}`;
const millis = v => typeof v === 'number' ? v : v && v.toMillis ? v.toMillis() : Date.now();
const label = () => ui.postLabel(artist);

function errMsg(err) {
  const c = err && err.code;
  if (c === 'permission-denied') return 'That change wasn’t allowed. Try signing out and back in.';
  if (c === 'unavailable') return 'You seem to be offline. Changes will retry when you reconnect.';
  if (c === 'auth/unauthorized-domain') return 'Add this site’s domain in Firebase → Authentication → Settings → Authorized domains.';
  if (c === 'auth/popup-blocked') return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
  return (err && err.message) || 'Something went wrong.';
}
const loadingHTML = t => `<section class="paper center"><div class="loading-mail" aria-hidden="true">${ui.MAIL}</div><h2>${esc(t)}</h2></section>`;

/* ======================================================================
   Header + theme
   ====================================================================== */
function dressHeader() {
  $('logoMotif').innerHTML = ui.ICONS[(draft || artist || {}).logo] || ui.ICONS.envelope;
  const a = draft || artist;
  $('studioEyebrow').textContent = a ? `SketchPost · ${a.handle ? '@' + a.handle : 'Studio'}` : 'SketchPost · Studio';
  $('studioTitle').textContent = a ? a.studioName : 'Your studio';
  ui.applyTheme(a ? a.theme : ui.DEFAULT_THEME);
}
dressHeader();

/* ======================================================================
   Auth
   ====================================================================== */
async function boot() {
  root.innerHTML = loadingHTML('Opening the studio…');
  fb = await import('./firebase.js');
  authApi = await import(AUTH_URL);
  auth = authApi.getAuth(fb.app);
  authApi.onAuthStateChanged(auth, u => {
    user = u;
    if (u) loadArtist(); else { reset(); renderSignIn(); }
  });
}
function reset() {
  if (unsubImages) { unsubImages(); unsubImages = null; }
  clearTimeout(saveTimer); clearTimeout(settingsTimer); saveTimer = settingsTimer = null;
  artist = null; draft = null; parcels = []; cur = null; data = null; images = [];
  dressHeader();
}

function renderSignIn() {
  root.innerHTML = `<section class="paper center">
    <h2>Welcome to your studio</h2>
    <p class="lede">Sign in with Google to create tracking pages for your commissions. It’s free, and your clients never need an account.</p>
    <button class="btn google" data-act="signin">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      Continue with Google
    </button>
  </section>`;
}

async function loadArtist() {
  root.innerHTML = loadingHTML('Unlocking your studio…');
  try {
    const snap = await fb.getDoc(artistRef());
    if (!snap.exists()) { renderOnboarding(); return; }
    artist = ui.normalizeArtist(snap.data());
    dressHeader();
    await loadParcels();
    renderShell();
    show(parseRoute());
  } catch (err) {
    console.error(err);
    root.innerHTML = `<section class="paper center"><h2>Couldn’t open your studio</h2><p class="lede">${esc(errMsg(err))}</p><button class="btn" data-act="signout">Sign out</button></section>`;
  }
}

/* ======================================================================
   Onboarding (first sign-in)
   ====================================================================== */
function presetButtons(selectedTheme) {
  return Object.entries(ui.THEME_PRESETS).map(([name, t]) => {
    const on = JSON.stringify(ui.normalizeTheme(selectedTheme)) === JSON.stringify(ui.normalizeTheme(t));
    return `<button type="button" class="preset ${on ? 'on' : ''}" data-act="preset" data-preset="${esc(name)}" aria-pressed="${on}">
      <span class="dots">${['bg', 'paper', 'ink', 'accent', 'highlight'].map(k => `<i style="background:${t[k]}"></i>`).join('')}</span>${esc(name)}</button>`;
  }).join('');
}

function renderOnboarding() {
  const suggested = ui.cleanHandle((user.email || '').split('@')[0]);
  draft = ui.normalizeArtist({ studioName: user.displayName || 'My studio', handle: suggested, theme: ui.DEFAULT_THEME });
  root.innerHTML = `<section class="paper center onboard">
    <h2>Set up your studio</h2>
    <p class="lede">You can change all of this later.</p>
    <form data-act="onboard">
      <label class="field"><span>Studio name</span><input name="studioName" value="${esc(draft.studioName)}" maxlength="60" required></label>
      <label class="field"><span>Handle (shown to clients)</span><input name="handle" value="${esc(draft.handle)}" maxlength="31" placeholder="yourname"></label>
      <div class="field"><span>Pick a look</span><div class="presets">${presetButtons(draft.theme)}</div></div>
      <button class="btn primary">Open my studio →</button>
    </form>
  </section>`;
}

async function finishOnboarding(form) {
  const studioName = form.elements.studioName.value.trim().slice(0, 60) || 'My studio';
  const handle = ui.cleanHandle(form.elements.handle.value);
  const prefix = ui.cleanPrefix(studioName).slice(0, 2).padEnd(2, 'P');
  const a = ui.normalizeArtist({ ...draft, studioName, handle, prefix });
  const btn = form.querySelector('button.primary'); btn.disabled = true;
  try {
    await fb.setDoc(artistRef(), { ...a, createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp() });
    artist = a; draft = null; parcels = [];
    dressHeader(); renderShell(); go({ view: 'list' }); ui.toast(`Welcome, ${a.studioName}!`);
  } catch (err) { console.error(err); ui.toast(errMsg(err)); btn.disabled = false; }
}

/* ======================================================================
   Routing inside the studio: list · parcel · settings
   ====================================================================== */
function parseRoute() {
  const q = new URLSearchParams(location.search);
  if (q.get('p')) return { view: 'parcel', code: q.get('p').toUpperCase() };
  if (q.get('view') === 'settings') return { view: 'settings' };
  return { view: 'list' };
}
const urlFor = r => r.view === 'parcel' ? `${location.pathname}?p=${encodeURIComponent(r.code)}`
  : r.view === 'settings' ? `${location.pathname}?view=settings` : location.pathname;
async function go(r) {
  await flushAll();
  history.pushState(null, '', urlFor(r));
  await show(r);
}
window.addEventListener('popstate', async () => { if (user && artist) { await flushAll(); show(parseRoute()); } });

async function show(r) {
  if (unsubImages && r.view !== 'parcel') { unsubImages(); unsubImages = null; }
  if (r.view !== 'settings' && draft) { draft = null; dressHeader(); }
  view = r.view;
  root.querySelectorAll('.bar-actions [data-nav]').forEach(b => b.toggleAttribute('aria-current', false));
  const navBtn = root.querySelector(`.bar-actions [data-nav="${view === 'settings' ? 'settings' : 'list'}"]`);
  if (navBtn) navBtn.setAttribute('aria-current', 'page');
  window.scrollTo(0, 0);
  if (r.view === 'settings') renderSettings();
  else if (r.view === 'parcel') await openParcel(r.code);
  else renderList();
}

function renderShell() {
  root.innerHTML = `
    <div class="desk-bar">
      <span>Signed in as <b>${esc(user.email || user.displayName || 'you')}</b></span>
      <div class="bar-actions">
        <button class="btn small ghost" data-act="nav-list" data-nav="list">Parcels</button>
        <button class="btn small ghost" data-act="nav-settings" data-nav="settings">Customize</button>
        <button class="btn small ghost" data-act="signout">Sign out</button>
      </div>
    </div>
    <div id="view"></div>`;
}
const viewEl = () => $('view');

/* ======================================================================
   Parcel list
   ====================================================================== */
async function loadParcels() {
  const qs = await fb.getDocs(fb.query(fb.collection(fb.db, 'parcels'), fb.where('ownerId', '==', user.uid)));
  parcels = qs.docs.map(d => toSummary(d.id, d.data())).sort((a, b) => b.updatedAt - a.updatedAt);
}
function toSummary(id, d) {
  const c = ui.normalizeCommission(id, d);
  return { id, title: c.title || 'Untitled', client: c.client, stages: c.stages, updatedAt: millis(d.updatedAt) };
}

function filtered() {
  const q = filter.q.trim().toLowerCase();
  return parcels.filter(p => {
    const kind = ui.summary(p.stages).kind;
    if (filter.status !== 'all' && kind !== filter.status) return false;
    return !q || `${p.title} ${p.client} ${p.id}`.toLowerCase().includes(q);
  });
}

function tileHTML(p) {
  const s = ui.summary(p.stages);
  const pct = s.total ? Math.round(((s.done + (s.cur >= 0 ? 0.5 : 0)) / s.total) * 100) : 0;
  const pill = s.kind === 'delivered' ? ['pill-done', 'Delivered'] : s.kind === 'created' ? ['pill-pending', 'Label created'] : ['pill-current', s.label];
  const when = new Date(p.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `<button class="parcel-tile" data-act="open-parcel" data-code="${esc(p.id)}">
    ${ui.miniStamp(p.stages)}
    <span class="tile-body">
      <span class="eyebrow tile-code">${esc(p.id)}</span>
      <span class="tile-title">${esc(p.title)}</span>
      <span class="tile-client">For ${esc(p.client || '—')} · updated ${esc(when)}</span>
      <span class="tile-progress"><span style="width:${pct}%"></span></span>
      <span class="tile-meta"><span class="pill ${pill[0]}">${esc(pill[1])}</span><span>${s.done}/${s.total} cleared</span></span>
    </span>
  </button>`;
}

function gridHTML() {
  if (!parcels.length) return `<div class="empty">No parcels yet. Tap <b>+ New parcel</b> to make your first one.</div>`;
  const list = filtered();
  return list.length ? list.map(tileHTML).join('') : `<div class="empty">No parcels match that search.</div>`;
}

function renderList() {
  const kinds = parcels.map(p => ui.summary(p.stages).kind);
  const count = k => kinds.filter(x => x === k).length;
  const chip = (k, t) => `<button class="chip" data-act="filter" data-status="${k}" aria-pressed="${filter.status === k}">${t}</button>`;
  viewEl().innerHTML = `
    <div class="list-head">
      <div><h2 class="list-title">Your parcels</h2>
        <p class="hint">${parcels.length} parcel${parcels.length === 1 ? '' : 's'} · ${count('transit')} in transit · ${count('delivered')} delivered</p></div>
      <button class="btn primary" data-act="new">+ New parcel</button>
    </div>
    <div id="newSlot"></div>
    <div class="list-tools">
      <input type="search" id="q" placeholder="Search by title, client or tracking no." value="${esc(filter.q)}" aria-label="Search parcels">
      <div class="chips">${chip('all', 'All')}${chip('transit', 'In transit')}${chip('created', 'Not started')}${chip('delivered', 'Delivered')}</div>
    </div>
    <div class="parcel-grid" id="grid">${gridHTML()}</div>`;
}

function makeCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const s = Array.from(crypto.getRandomValues(new Uint8Array(8)), n => A[n % A.length]).join('');
  return `${artist.prefix}-${s.slice(0, 4)}-${s.slice(4)}`;
}

// Tracking numbers: 3–30 characters, capital letters, numbers and dashes. They're also the link, so they must be unique.
const cleanCode = s => String(s || '').toUpperCase().trim().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
const validCode = c => /^[A-Z0-9][A-Z0-9-]{2,29}$/.test(c);
async function checkCode(code, current) {
  if (!validCode(code)) return 'Use 3–30 letters, numbers or dashes (e.g. SB-001 or MIKA-PORTRAIT).';
  if (code === current) return 'That’s already this parcel’s tracking number.';
  if ((await fb.getDoc(parcelRef(code))).exists()) return `${code} is already taken. Try another.`;
  return '';
}

function showNewForm() {
  const slot = $('newSlot'); if (!slot) return;
  slot.innerHTML = `<form class="desk-card new-parcel" data-act="create-parcel">
    <h2 class="rubber">New parcel</h2>
    <div class="linkbox" style="margin-top:6px">
      <label class="field grow"><span>Tracking number</span><input name="code" value="${esc(makeCode())}" maxlength="30" autocomplete="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase;font-family:ui-monospace,SFMono-Regular,Menlo,monospace" required></label>
      <button type="button" class="btn ghost" data-act="random-code">↻ Random</button>
    </div>
    <p class="drop-hint">Type your own (like SB-001) or keep the random one. Anyone who guesses a tracking number can view that parcel, so random codes are the most private.</p>
    <div class="desk-foot"><button class="btn primary">Create parcel</button><button type="button" class="btn ghost" data-act="cancel-new">Cancel</button></div>
  </form>`;
  const i = slot.querySelector('input'); i.focus(); i.select();
}

async function newParcel(form) {
  const btn = form.querySelector('button.primary'); btn.disabled = true;
  try {
    const code = cleanCode(form.elements.code.value);
    form.elements.code.value = code;
    const problem = await checkCode(code);
    if (problem) { ui.toast(problem, 4000); return; }
    const d = {
      ownerId: user.uid, title: 'New commission', client: '', artist: artist.handle ? '@' + artist.handle : artist.studioName,
      eta: '', stages: ui.defaultStages(artist.defaultStages), createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp()
    };
    await fb.setDoc(parcelRef(code), d);
    parcels.unshift(toSummary(code, { ...d, updatedAt: Date.now() }));
    await go({ view: 'parcel', code });
    ui.toast(`Parcel ${code} created`);
    const t = root.querySelector('[data-pfield="title"]'); if (t) { t.focus(); t.select(); }
  } catch (err) { console.error(err); ui.toast(errMsg(err)); }
  finally { if (btn.isConnected) btn.disabled = false; }
}

// Changing a tracking number moves the parcel (and its proofs) to the new number. The old link stops working.
async function renameParcel(newCode) {
  const oldCode = cur;
  await flushSave();
  const problem = await checkCode(newCode, oldCode);
  if (problem) { ui.toast(problem, 4000); return; }
  ui.toast(`Moving parcel to ${newCode}…`, 60000);
  try {
    const snap = await fb.getDoc(parcelRef(oldCode));
    await fb.setDoc(parcelRef(newCode), { ...snap.data(), ownerId: user.uid, updatedAt: fb.serverTimestamp() });
    if (unsubImages) { unsubImages(); unsubImages = null; }
    const imgs = await fb.getDocs(imagesCol(oldCode));
    for (const d of imgs.docs) await fb.setDoc(fb.doc(fb.db, 'parcels', newCode, 'images', d.id), d.data());
    await deleteDocs(imgs.docs.map(d => d.ref));
    await fb.deleteDoc(parcelRef(oldCode));
  } catch (err) { console.error(err); ui.toast(errMsg(err)); openParcel(cur); return; }
  const i = parcels.findIndex(p => p.id === oldCode);
  if (i >= 0) parcels[i] = { ...parcels[i], id: newCode, updatedAt: Date.now() };
  history.replaceState(null, '', urlFor({ view: 'parcel', code: newCode }));
  await openParcel(newCode);
  ui.toast(`Tracking number changed to ${newCode}. Send your client the new link.`, 5000);
}

/* ======================================================================
   Parcel editor
   ====================================================================== */
async function openParcel(code) {
  if (unsubImages) { unsubImages(); unsubImages = null; }
  cur = code; data = null; images = [];
  viewEl().innerHTML = `<button class="back" data-act="nav-list">← All parcels</button><div class="empty">Opening parcel ${esc(code)}…</div>`;
  let snap;
  try { snap = await fb.getDoc(parcelRef(code)); }
  catch (err) { console.error(err); ui.toast(errMsg(err)); return; }
  if (cur !== code || view !== 'parcel') return;
  if (!snap.exists() || snap.data().ownerId !== user.uid) {
    ui.toast('That parcel isn’t in your studio.');
    parcels = parcels.filter(p => p.id !== code);
    history.replaceState(null, '', urlFor({ view: 'list' })); view = 'list'; renderList(); return;
  }
  data = ui.normalizeCommission(snap.id, snap.data());
  renderEditor();
  unsubImages = fb.onSnapshot(fb.query(imagesCol(code), fb.orderBy('order')), qs => {
    if (cur !== code) return;
    images = qs.docs.map(d => ({ id: d.id, ...d.data() }));
    refreshThumbs();
  }, err => { console.error(err); ui.toast(errMsg(err)); });
}

/* saving */
function setSave(text, cls) { const el = $('saveState'); if (el) { el.textContent = text; el.className = `save-state ${cls || ''}`; } }
function scheduleSave() { setSave('Saving…', 'saving'); clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 700); }
async function doSave() {
  saveTimer = null;
  if (!cur || !data) return;
  const code = cur, s = JSON.parse(JSON.stringify(data));
  try {
    await fb.setDoc(parcelRef(code), {
      ownerId: user.uid, title: s.title, client: s.client, artist: s.artist, eta: s.eta, stages: s.stages, updatedAt: fb.serverTimestamp()
    }, { merge: true });
    if (code === cur && !saveTimer) setSave('Saved ✓', '');
    const i = parcels.findIndex(p => p.id === code);
    const sum = toSummary(code, { ...s, updatedAt: Date.now() });
    if (i >= 0) parcels.splice(i, 1);
    parcels.unshift(sum);
  } catch (err) {
    console.error(err);
    if (code === cur) setSave('Not saved', 'error');
    ui.toast(errMsg(err));
  }
}
async function flushSave() { if (saveTimer) { clearTimeout(saveTimer); await doSave(); } }
async function flushAll() { await flushSave(); await flushSettings(); }
window.addEventListener('beforeunload', e => { if (saveTimer || settingsTimer) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });

/* rendering */
const pf = (k, lbl, type = 'text') => `<label class="field"><span>${lbl}</span><input type="${type}" data-pfield="${k}" value="${esc(data[k])}" maxlength="${type === 'date' ? 10 : 80}"></label>`;
function posOptions() {
  const n = data.stages.length;
  return data.stages.map((s, i) => `<option value="${s.id}" ${i === n - 1 ? 'selected' : ''}>Before “${esc(s.name)}”</option>`).join('')
    + `<option value="end" ${n === 0 ? 'selected' : ''}>At the end</option>`;
}

function renderEditor() {
  const link = clientLink(data.id);
  viewEl().innerHTML = `
    <button class="back" data-act="nav-list">← All parcels</button>
    <section class="ticket" id="pvTicket" aria-label="Client preview">${ui.ticketHTML(data)}</section>
    <section class="route" id="pvRoute" aria-label="Route preview">${data.stages.length ? ui.routeHTML(data.stages) : ''}</section>
    <div class="desk-card">
      <div class="desk-head">
        <div><h2 class="rubber">Parcel details</h2>
          <p class="hint">Changes save automatically and show up on your client’s page right away. <span class="save-state" id="saveState">Saved ✓</span></p></div>
        <button class="btn primary" data-act="advance">Advance shipment →</button>
      </div>
      <div class="linkbox">
        <label class="field grow"><span>Tracking number</span><input id="codeInput" value="${esc(data.id)}" maxlength="30" autocomplete="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase;font-family:ui-monospace,SFMono-Regular,Menlo,monospace"></label>
        <button class="btn" data-act="rename" data-confirm="Old link will stop working. Tap again">Change</button>
      </div>
      <div class="linkbox">
        <label class="field grow"><span>Client tracking link</span><input id="clientLink" readonly value="${esc(link)}"></label>
        <button class="btn" data-act="copy">Copy link</button>
        <a class="btn ghost" href="${esc(link)}" target="_blank" rel="noopener">Open ↗</a>
      </div>
      <div class="grid-fields">${pf('title', 'Commission')}${pf('client', 'Client (to)')}${pf('artist', 'Artist (from)')}${pf('eta', 'Est. delivery', 'date')}</div>
      <form class="add-stage" data-act="add-stage">
        <label class="field grow"><span>New stage</span><input name="sname" placeholder="e.g. Revisions, Colour check" maxlength="40" required></label>
        <label class="field"><span>Place it</span><select name="pos">${posOptions()}</select></label>
        <button class="btn">+ Add stage</button>
      </form>
      <div class="desk-foot">
        <button class="btn small ghost" data-act="delete-parcel" data-confirm="Tap again to delete it and its proofs">Delete this parcel</button>
      </div>
    </div>
    <section class="stages" id="stagesEl">${stagesHTML()}</section>`;
}

function refreshPreview() {
  const t = $('pvTicket'), r = $('pvRoute');
  if (t) t.innerHTML = ui.ticketHTML(data);
  if (r) r.innerHTML = data.stages.length ? ui.routeHTML(data.stages) : '';
}
function thumbsHTML(st) {
  return imagesFor(st.id).map((im, k) => `<div class="thumb-wrap">${ui.thumbBtn(st, im, k)}<button class="rm" data-act="remove-img" data-img="${esc(im.id)}" aria-label="Remove proof ${k + 1}">×</button></div>`).join('')
    + `<button class="add-tile" data-act="upload">+ Upload<br>images</button>`;
}
function editCard(st, i, n) {
  const sel = v => st.status === v ? 'selected' : '';
  return `<div class="card-top"><span class="eyebrow">Stage ${i + 1} of ${n}</span>
      <div class="tools">
        <button class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move stage up">${ui.UP}</button>
        <button class="icon-btn" data-act="down" ${i === n - 1 ? 'disabled' : ''} aria-label="Move stage down">${ui.DOWN}</button>
        <button class="icon-btn" data-act="delete-stage" data-confirm="Delete?" aria-label="Delete stage">${ui.TRASH}</button>
      </div></div>
    <div class="edit-grid">
      <label class="field full"><span>Stage name</span><input data-field="name" value="${esc(st.name)}" maxlength="40"></label>
      <label class="field"><span>Status</span><select data-field="status">
        <option value="pending" ${sel('pending')}>Awaiting</option>
        <option value="current" ${sel('current')}>In transit (current)</option>
        <option value="done" ${sel('done')}>Cleared (done)</option></select></label>
      <label class="field"><span>Date</span><input type="date" data-field="date" value="${esc(st.date)}"></label>
      <label class="field full"><span>Note for your client</span><textarea data-field="note" rows="2" maxlength="600" placeholder="What’s happening at this stage?">${esc(st.note)}</textarea></label>
      <div class="field"><span>Stamp colour</span><div class="swatches">${Object.entries(ui.COLORS).map(([k, v]) => `<button class="swatch ${k === st.color ? 'on' : ''}" data-act="color" data-color="${k}" style="--sw:${v}" aria-label="${k}" aria-pressed="${k === st.color}"></button>`).join('')}</div></div>
      <label class="field"><span>Stamp icon</span><select data-field="icon">${Object.keys(ui.ICONS).map(k => `<option value="${k}" ${k === st.icon ? 'selected' : ''}>${ui.ICON_NAMES[k]}</option>`).join('')}</select></label>
    </div>
    <div class="dropzone">
      <p class="field-label">Proof images (<span class="dz-count">${imagesFor(st.id).length}</span>) · visible to anyone with the client link</p>
      <div class="thumbs dz-thumbs">${thumbsHTML(st)}</div>
      <form class="url-row" data-act="add-url"><input type="url" name="url" placeholder="…or paste an image link (https://)"><button class="btn small">Add link</button></form>
      <p class="drop-hint">You can also drag images onto this box.</p>
    </div>`;
}
function stagesHTML() {
  const n = data.stages.length;
  if (!n) return `<div class="empty">No stages yet. Add one above.</div>`;
  return data.stages.map((st, i) => `<article class="stage s-${st.status}" data-id="${st.id}">${ui.stampCol(st, i, label())}<div class="card">${editCard(st, i, n)}</div></article>`).join('');
}
function renderStages() {
  const el = $('stagesEl'); if (el) el.innerHTML = stagesHTML();
  refreshPreview();
  const sel = root.querySelector('select[name=pos]'); if (sel) sel.innerHTML = posOptions();
}
function refreshThumbs() {
  if (!data) return;
  for (const st of data.stages) {
    const art = root.querySelector(`article[data-id="${st.id}"]`); if (!art) continue;
    art.querySelector('.dz-thumbs').innerHTML = thumbsHTML(st);
    art.querySelector('.dz-count').textContent = imagesFor(st.id).length;
  }
}
function refreshStampCol(art, st) { art.querySelector('.stamp-col').outerHTML = ui.stampCol(st, data.stages.indexOf(st), label()); }

function advance() {
  const st = data.stages, t = ui.todayISO();
  const c = st.findIndex(s => s.status === 'current');
  if (c >= 0) { st[c].status = 'done'; if (!st[c].date) st[c].date = t; }
  const nx = st.findIndex((s, i) => i > c && s.status !== 'done');
  if (nx >= 0) { st[nx].status = 'current'; if (!st[nx].date) st[nx].date = t; ui.toast(`Now in transit: ${st[nx].name}`); }
  else if (c >= 0) ui.toast('All stages cleared. Delivered!');
  else { ui.toast('Everything is already delivered.'); return; }
  renderStages(); scheduleSave();
}

async function deleteDocs(refs) {
  for (let i = 0; i < refs.length; i += 20) await Promise.all(refs.slice(i, i + 20).map(r => fb.deleteDoc(r)));
}

async function addFiles(stageId, files) {
  const code = cur;
  const pics = [...files].filter(f => f.type.startsWith('image/'));
  if (!pics.length) { ui.toast('Those weren’t image files.'); return; }
  ui.toast(`Posting ${pics.length} proof${pics.length > 1 ? 's' : ''}…`, 60000);
  let ok = 0;
  for (const f of pics) {
    try {
      const src = await ui.compressImage(f);
      await fb.addDoc(imagesCol(code), { stageId, src, order: Date.now(), createdAt: fb.serverTimestamp() });
      ok++;
    } catch (err) { console.error(err); ui.toast(errMsg(err)); }
  }
  if (ok) { ui.toast(`${ok} proof${ok > 1 ? 's' : ''} posted`); if (code === cur) scheduleSave(); }
}

/* ======================================================================
   Customize
   ====================================================================== */
const COLOR_FIELDS = [['bg', 'Background'], ['paper', 'Paper'], ['ink', 'Headings'], ['accent', 'Accent'], ['highlight', 'Highlight']];

function renderSettings() {
  draft = JSON.parse(JSON.stringify(artist));
  const sf = (k, lbl, extra = '') => `<label class="field"><span>${lbl}</span><input data-sfield="${k}" value="${esc(draft[k])}" ${extra}></label>`;
  viewEl().innerHTML = `
    <button class="back" data-act="nav-list">← All parcels</button>
    <div class="desk-card">
      <div class="desk-head">
        <div><h2 class="rubber">Customize</h2>
          <p class="hint">This is how every client tracking page from your studio will look. <span class="save-state" id="settingsState">Saved ✓</span></p></div>
      </div>

      <h3 class="sect">Studio</h3>
      <div class="grid-fields" style="margin-top:0">
        ${sf('studioName', 'Studio name', 'maxlength="60"')}
        ${sf('handle', 'Handle (without @)', 'maxlength="31"')}
        ${sf('headline', 'Page headline', 'maxlength="60"')}
        ${sf('prefix', 'Tracking number prefix', 'maxlength="5" style="text-transform:uppercase"')}
      </div>

      <h3 class="sect">Colors</h3>
      <div class="presets" id="presets">${presetButtons(draft.theme)}</div>
      <div class="colors">${COLOR_FIELDS.map(([k, l]) => `<label class="color-field"><input type="color" data-tfield="${k}" value="${draft.theme[k]}">${l}</label>`).join('')}</div>

      <h3 class="sect">Logo stamp</h3>
      <div class="icon-pick" id="iconPick">${iconPickHTML()}</div>

      <h3 class="sect">Default stages for new parcels</h3>
      <label class="field"><span>One stage per line</span><textarea data-sfield="defaultStages" rows="5">${esc(draft.defaultStages.join('\n'))}</textarea></label>
      <p class="drop-hint">Existing parcels keep their own stages.</p>
    </div>
    <p class="preview-label">Client page preview</p>
    <div class="theme-preview" id="themePreview"></div>`;
  renderThemePreview();
}
function iconPickHTML() {
  return Object.keys(ui.ICONS).map(k => `<button type="button" class="${k === draft.logo ? 'on' : ''}" data-act="logo" data-icon="${k}" aria-label="${ui.ICON_NAMES[k]}" aria-pressed="${k === draft.logo}">${ui.ICONS[k]}</button>`).join('');
}
function renderThemePreview() {
  const el = $('themePreview'); if (!el) return;
  const demo = ui.demoCommission();
  const c = { ...demo.commission, id: `${ui.cleanPrefix(draft.prefix) || 'PP'}-7KQ2-M9XF`, artist: draft.handle ? '@' + ui.cleanHandle(draft.handle) : draft.studioName };
  const g = ui.groupImages(demo.images), lbl = ui.postLabel(draft), n = c.stages.length;
  el.innerHTML = `
    <header class="top"><div class="brand">
      <div class="stamp logo"><div class="art"><span class="motif">${ui.ICONS[draft.logo]}</span></div></div>
      <div><p class="eyebrow">${esc(draft.studioName)}${draft.handle ? ' · @' + esc(ui.cleanHandle(draft.handle)) : ''}</p><h1>${esc(draft.headline)}</h1></div>
    </div></header>
    <section class="ticket">${ui.ticketHTML(c)}</section>
    <section class="route">${ui.routeHTML(c.stages)}</section>
    <section class="stages">${c.stages.slice(0, 2).map((s, i) => `<article class="stage s-${s.status}">${ui.stampCol(s, i, lbl)}<div class="card">${ui.viewCard(s, i, n, g.get(s.id) || [], i === 1, c.eta)}</div></article>`).join('')}</section>
    <div class="foot"><p class="copy">© Almira Velasquez (@sigbinnie)</p></div>`;
}

function settingsChanged({ header = false } = {}) {
  if (header) dressHeader(); else ui.applyTheme(draft.theme);
  renderThemePreview();
  const st = $('settingsState'); if (st) { st.textContent = 'Saving…'; st.className = 'save-state saving'; }
  clearTimeout(settingsTimer); settingsTimer = setTimeout(saveSettings, 800);
}
async function saveSettings() {
  settingsTimer = null;
  if (!draft) return;
  const a = ui.normalizeArtist({
    ...draft,
    handle: ui.cleanHandle(draft.handle),
    prefix: ui.cleanPrefix(draft.prefix),
    defaultStages: String(Array.isArray(draft.defaultStages) ? draft.defaultStages.join('\n') : draft.defaultStages).split('\n')
  });
  try {
    await fb.setDoc(artistRef(), { ...a, updatedAt: fb.serverTimestamp() }, { merge: true });
    artist = a;
    const st = $('settingsState'); if (st && !settingsTimer) { st.textContent = 'Saved ✓'; st.className = 'save-state'; }
  } catch (err) {
    console.error(err);
    const st = $('settingsState'); if (st) { st.textContent = 'Not saved'; st.className = 'save-state error'; }
    ui.toast(errMsg(err));
  }
}
async function flushSettings() { if (settingsTimer) { clearTimeout(settingsTimer); await saveSettings(); } }

/* ======================================================================
   Events
   ====================================================================== */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.tagName === 'FORM' || b.disabled || lightbox.contains(b)) return;
  const act = b.dataset.act;
  if (act === 'nav-list' || act === 'nav-settings') {
    e.preventDefault();
    if (user && artist) go({ view: act === 'nav-list' ? 'list' : 'settings' });
    return;
  }
  if (!root.contains(b)) return;
  const art = b.closest('[data-id]'), sid = art && art.dataset.id;
  const st = sid && data ? data.stages.find(s => s.id === sid) : null;
  const idx = st ? data.stages.indexOf(st) : -1;

  switch (act) {
    case 'signin': {
      const provider = new authApi.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try { await authApi.signInWithPopup(auth, provider); }
      catch (err) { if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(err.code)) ui.toast(errMsg(err), 6000); }
      break;
    }
    case 'signout': await flushAll(); await authApi.signOut(auth); history.replaceState(null, '', location.pathname); break;
    case 'preset': {
      const t = ui.THEME_PRESETS[b.dataset.preset]; if (!t || !draft) break;
      draft.theme = { ...t };
      root.querySelectorAll('.preset').forEach(p => { const on = p === b; p.classList.toggle('on', on); p.setAttribute('aria-pressed', on); });
      root.querySelectorAll('[data-tfield]').forEach(i => { i.value = draft.theme[i.dataset.tfield]; });
      if (artist) settingsChanged(); else ui.applyTheme(draft.theme);
      break;
    }
    case 'logo': draft.logo = b.dataset.icon; $('iconPick').innerHTML = iconPickHTML(); settingsChanged({ header: true }); break;
    case 'new': showNewForm(); break;
    case 'random-code': { const i = b.closest('form').elements.code; i.value = makeCode(); i.focus(); break; }
    case 'cancel-new': $('newSlot').innerHTML = ''; break;
    case 'rename': {
      const next = cleanCode($('codeInput').value);
      $('codeInput').value = next;
      if (!b.dataset.armed) {
        const problem = await checkCode(next, cur);
        if (problem) { ui.toast(problem, 4000); break; }
      }
      ui.twoStep(b, () => renameParcel(next));
      break;
    }
    case 'filter': filter.status = b.dataset.status; renderList(); break;
    case 'open-parcel': go({ view: 'parcel', code: b.dataset.code }); break;
    case 'copy': {
      const link = clientLink(cur);
      try { await navigator.clipboard.writeText(link); ui.toast('Client link copied'); }
      catch (err) { const i = $('clientLink'); i.focus(); i.select(); ui.toast('Press copy to grab the selected link'); }
      break;
    }
    case 'advance': advance(); break;
    case 'delete-parcel':
      ui.twoStep(b, async () => {
        const code = cur;
        clearTimeout(saveTimer); saveTimer = null;
        try {
          const qs = await fb.getDocs(imagesCol(code));
          await deleteDocs(qs.docs.map(d => d.ref));
          await fb.deleteDoc(parcelRef(code));
        } catch (err) { console.error(err); ui.toast(errMsg(err)); return; }
        if (unsubImages) { unsubImages(); unsubImages = null; }
        parcels = parcels.filter(p => p.id !== code); cur = null; data = null; images = [];
        await go({ view: 'list' }); ui.toast('Parcel deleted');
      });
      break;
    case 'open': lightbox.open(sid, +b.dataset.k); break;
    case 'upload': pendingUpload = sid; picker.click(); break;
    case 'remove-img':
      try { await fb.deleteDoc(fb.doc(fb.db, 'parcels', cur, 'images', b.dataset.img)); scheduleSave(); }
      catch (err) { ui.toast(errMsg(err)); }
      break;
    case 'color': st.color = b.dataset.color; renderStages(); scheduleSave(); break;
    case 'up':
      if (idx > 0) { [data.stages[idx - 1], data.stages[idx]] = [data.stages[idx], data.stages[idx - 1]]; renderStages(); scheduleSave(); }
      break;
    case 'down':
      if (idx >= 0 && idx < data.stages.length - 1) { [data.stages[idx + 1], data.stages[idx]] = [data.stages[idx], data.stages[idx + 1]]; renderStages(); scheduleSave(); }
      break;
    case 'delete-stage':
      ui.twoStep(b, async () => {
        const name = st.name;
        try { await deleteDocs(imagesFor(st.id).map(im => fb.doc(fb.db, 'parcels', cur, 'images', im.id))); }
        catch (err) { ui.toast(errMsg(err)); return; }
        data.stages.splice(data.stages.indexOf(st), 1);
        renderStages(); scheduleSave(); ui.toast(`“${name}” removed`);
      });
      break;
  }
});

root.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  if (f.dataset.act === 'onboard') { finishOnboarding(f); return; }
  if (f.dataset.act === 'create-parcel') { newParcel(f); return; }
  if (f.dataset.act === 'add-url') {
    const sid = f.closest('[data-id]').dataset.id;
    const v = f.elements.url.value.trim();
    if (!/^https?:\/\//i.test(v)) { ui.toast('Paste a full image link starting with https://'); return; }
    try { await fb.addDoc(imagesCol(cur), { stageId: sid, src: v, order: Date.now(), createdAt: fb.serverTimestamp() }); f.reset(); ui.toast('Image link added'); scheduleSave(); }
    catch (err) { ui.toast(errMsg(err)); }
  }
  if (f.dataset.act === 'add-stage') {
    const name = f.elements.sname.value.trim(); if (!name) return;
    const pos = f.elements.pos.value;
    const [stage] = ui.defaultStages([name]);
    stage.color = Object.keys(ui.COLORS)[data.stages.length % Object.keys(ui.COLORS).length];
    let i = pos === 'end' ? data.stages.length : data.stages.findIndex(s => s.id === pos);
    if (i < 0) i = data.stages.length;
    data.stages.splice(i, 0, stage);
    f.elements.sname.value = '';
    renderStages(); scheduleSave(); ui.toast(`“${name}” added`);
  }
});

root.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { filter.q = t.value; $('grid').innerHTML = gridHTML(); return; }
  if (t.dataset.sfield && draft) {
    draft[t.dataset.sfield] = t.dataset.sfield === 'defaultStages' ? t.value.split('\n') : t.value;
    settingsChanged({ header: ['studioName', 'handle'].includes(t.dataset.sfield) });
    return;
  }
  if (t.dataset.tfield && draft) {
    draft.theme[t.dataset.tfield] = t.value;
    root.querySelectorAll('.preset').forEach(p => { p.classList.remove('on'); p.setAttribute('aria-pressed', 'false'); });
    settingsChanged();
    return;
  }
  if (t.dataset.pfield && data) { data[t.dataset.pfield] = t.value; refreshPreview(); scheduleSave(); return; }
  const f = t.dataset.field;
  if (f === 'name' || f === 'note' || f === 'date') {
    const art = t.closest('[data-id]'), st = data && data.stages.find(s => s.id === art.dataset.id); if (!st) return;
    st[f] = t.value; scheduleSave();
    if (f === 'name') {
      refreshStampCol(art, st); refreshPreview();
      const sel = root.querySelector('select[name=pos]'); if (sel) { const v = sel.value; sel.innerHTML = posOptions(); sel.value = v; }
    }
  }
});

root.addEventListener('change', e => {
  const t = e.target;
  const f = t.dataset.field; if (!f || !data) return;
  const art = t.closest('[data-id]'), st = art && data.stages.find(s => s.id === art.dataset.id); if (!st) return;
  if (f === 'status') {
    st.status = t.value;
    if (t.value === 'current') data.stages.forEach(s => { if (s !== st && s.status === 'current') s.status = 'pending'; });
    if (t.value !== 'pending' && !st.date) st.date = ui.todayISO();
    renderStages(); scheduleSave();
  } else if (f === 'icon') { st.icon = t.value; refreshStampCol(art, st); scheduleSave(); }
  else if (f === 'date') { refreshStampCol(art, st); refreshPreview(); }
});

picker.addEventListener('change', async () => {
  if (pendingUpload && picker.files.length) await addFiles(pendingUpload, picker.files);
  picker.value = ''; pendingUpload = null;
});

root.addEventListener('dragover', e => { const z = e.target.closest('.dropzone'); if (z) { e.preventDefault(); z.classList.add('over'); } });
root.addEventListener('dragleave', e => { const z = e.target.closest('.dropzone'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('over'); });
root.addEventListener('drop', e => {
  const z = e.target.closest('.dropzone'); if (!z) return;
  e.preventDefault(); z.classList.remove('over');
  addFiles(z.closest('[data-id]').dataset.id, e.dataTransfer.files);
});
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());

/* ---------- start ---------- */
if (!isConfigured) {
  root.innerHTML = `<section class="paper center"><h2>Almost there</h2>
    <p class="lede">Add your Firebase settings to <code>assets/firebase-config.js</code> to switch on sign-up. The README walks through it step by step.</p></section>`;
} else {
  boot().catch(err => {
    console.error(err);
    root.innerHTML = `<section class="paper center"><h2>Couldn’t start the studio</h2><p class="lede">${esc(errMsg(err))}</p></section>`;
  });
}
