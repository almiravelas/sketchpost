// About page: fills in the stamp art, stickers and today's postmark, and wires the feedback note to the feedback letter.
import * as ui from './ui.js';

const FLOWER = `<svg viewBox="0 0 60 60"><g fill="#f4a3a3" stroke="${ui.N}" stroke-width="2.6" stroke-linejoin="round">
  <circle cx="30" cy="15" r="10"/><circle cx="44.3" cy="25.4" r="10"/><circle cx="38.8" cy="42.1" r="10"/><circle cx="21.2" cy="42.1" r="10"/><circle cx="15.7" cy="25.4" r="10"/></g>
  <circle cx="30" cy="30" r="8" fill="#f6c944" stroke="${ui.N}" stroke-width="2.6"/></svg>`;

document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = el.dataset.icon === 'flower' ? FLOWER : (ui.ICONS[el.dataset.icon] || '');
});
document.getElementById('pcPostmark').outerHTML = ui.postmark(ui.todayISO(), 'SKETCHPOST');

// The feedback button only appears once the feedback letter (assets/feedback.js) is set up.
const fbBtn = document.getElementById('aboutFeedback');
function hookFeedback() {
  if (!window.SketchPostFeedback) return false;
  fbBtn.hidden = false;
  fbBtn.addEventListener('click', () => window.SketchPostFeedback.open());
  return true;
}
if (!hookFeedback()) window.addEventListener('sketchpost-feedback-ready', hookFeedback, { once: true });
