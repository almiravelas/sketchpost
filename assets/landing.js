// Landing page: shows a sample parcel, sends artists to the studio, and lets clients look up a tracking number.
import * as ui from './ui.js';

const $ = id => document.getElementById(id);
$('logoMotif').innerHTML = ui.ICONS.envelope;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = ui.ICONS[el.dataset.icon]; });

/* sample parcel */
const { commission, images } = ui.demoCommission();
const artist = ui.demoArtist();
const groups = ui.groupImages(images);
const openProofs = new Set(['s2']);
const lightbox = ui.createLightbox(id => {
  const st = commission.stages.find(s => s.id === id);
  return st ? { name: st.name, images: groups.get(id) || [] } : null;
});
function drawDemo() {
  const st = commission.stages, n = st.length;
  $('demoTicket').innerHTML = ui.ticketHTML(commission);
  $('demoRoute').innerHTML = ui.routeHTML(st);
  $('demoStages').innerHTML = st.slice(0, 2).map((s, i) =>
    `<article class="stage s-${s.status}" data-id="${s.id}">${ui.stampCol(s, i, ui.postLabel(artist))}<div class="card">${ui.viewCard(s, i, n, groups.get(s.id) || [], openProofs.has(s.id), commission.eta)}</div></article>`).join('');
}
drawDemo();
$('demoStages').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const sid = b.closest('[data-id]').dataset.id;
  if (b.dataset.act === 'toggle-proofs') {
    openProofs.has(sid) ? openProofs.delete(sid) : openProofs.add(sid);
    drawDemo();
  } else if (b.dataset.act === 'open') lightbox.open(sid, +b.dataset.k);
});

/* tracking lookup */
$('lookupForm').addEventListener('submit', e => {
  e.preventDefault();
  const code = $('lookupInput').value.trim().toUpperCase().replace(/\s+/g, '');
  const note = $('lookupNote');
  if (!/^[A-Z0-9-]{4,40}$/.test(code)) { note.hidden = false; note.textContent = 'Tracking numbers look like XX-XXXX-XXXX.'; return; }
  location.href = `/t/${encodeURIComponent(code)}`;
});
