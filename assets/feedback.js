// SketchPost feedback letter
// A floating messenger button (bottom-right) that opens a letter-style feedback form.
// Letters are emailed to the site creator through Web3Forms (https://web3forms.com).
//
// Setup:
//   1. Go to https://web3forms.com, enter your email, and copy the access key they email you.
//   2. Paste it below in ACCESS_KEY.
//   3. Add this line just before </body> on every page where the button should appear:
//        <script src="/assets/feedback.js" defer></script>

(() => {
  const ACCESS_KEY = 'PASTE_YOUR_WEB3FORMS_ACCESS_KEY';
  const NUDGE_DELAY_MS = 6000;           // when the "How's SketchPost so far?" bubble pops up (once per visitor)
  const NUDGE_KEY = 'sp-feedback-nudged';

  // Until the access key is pasted in, the button stays hidden so visitors never see a form that can't send.
  if (ACCESS_KEY.startsWith('PASTE')) { console.info('SketchPost feedback: add your Web3Forms access key in assets/feedback.js to show the button.'); return; }

  /* ---------- styles (use the site's theme colors, with fallbacks) ---------- */
  const css = `
  .fb-launch{position:fixed;right:18px;bottom:18px;z-index:30;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;
    background:var(--red,#e5463b);color:var(--on-accent,#fff);display:grid;place-items:center;
    box-shadow:0 4px 0 color-mix(in srgb,var(--red,#e5463b),#000 32%),0 10px 24px rgba(0,0,0,.18);transition:transform .15s}
  .fb-launch:hover{transform:translateY(-2px) rotate(-4deg)}
  .fb-launch:active{transform:translateY(2px)}
  .fb-launch:focus-visible{outline:3px solid var(--yellow,#f6c944);outline-offset:3px}
  .fb-launch svg{width:30px;height:30px}
  .fb-launch.pop{animation:fb-pop .6s ease-out 1}
  .fb-nudge{position:fixed;right:84px;bottom:28px;z-index:30;max-width:220px;background:var(--paper,#fffaf1);color:var(--ink,#25304d);
    font:800 13px/1.35 'Nunito',system-ui,sans-serif;padding:10px 30px 10px 14px;border-radius:14px 14px 4px 14px;
    box-shadow:0 4px 0 var(--shadow,rgba(28,52,130,.38));animation:fb-in .3s ease-out}
  .fb-nudge button{position:absolute;top:4px;right:6px;border:0;background:none;color:var(--muted,#6c7591);font:900 16px/1 'Nunito',sans-serif;cursor:pointer;padding:4px}
  .fb-overlay{position:fixed;inset:0;z-index:55;background:rgba(18,32,82,.55);display:flex;align-items:flex-end;justify-content:flex-end;padding:16px}
  .fb-overlay[hidden]{display:none}
  .fb-letter{position:relative;width:min(380px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--paper,#fffaf1);color:var(--ink,#25304d);
    border-radius:16px;box-shadow:0 6px 0 var(--shadow,rgba(28,52,130,.38)),0 18px 40px rgba(0,0,0,.25);font:600 14px/1.45 'Nunito',system-ui,sans-serif;animation:fb-in .25s ease-out;margin-bottom:70px}
  .fb-airmail{height:10px;border-radius:16px 16px 0 0;background:repeating-linear-gradient(-45deg,var(--red,#e5463b) 0 12px,var(--paper,#fffaf1) 12px 20px,var(--navy,#2f4fa8) 20px 32px,var(--paper,#fffaf1) 32px 40px)}
  .fb-body{padding:16px 18px 18px}
  .fb-close{position:absolute;top:16px;right:12px;border:0;background:none;color:var(--muted,#6c7591);font:900 22px/1 'Nunito',sans-serif;cursor:pointer;padding:4px 6px}
  .fb-letter h2{font:700 30px/1 'Gaegu',cursive;color:var(--navy,#2f4fa8);margin:2px 0 4px}
  .fb-letter .fb-sub{margin:0 0 12px;color:var(--muted,#6c7591);font-size:13px}
  .fb-letter label{display:block;font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#6c7591);margin:10px 0 4px}
  .fb-letter input,.fb-letter textarea{width:100%;box-sizing:border-box;font:700 14px/1.35 'Nunito',sans-serif;color:#25304d;background:#fff;border:2px solid var(--line,#e4dccb);border-radius:10px;padding:9px 11px}
  .fb-letter input:focus,.fb-letter textarea:focus{outline:none;border-color:var(--blue,#5b8def)}
  .fb-letter textarea{resize:vertical;min-height:110px;font-family:'Gaegu',cursive;font-size:19px;line-height:1.3;
    background-image:repeating-linear-gradient(transparent 0 24px,var(--line,#e4dccb) 24px 25px);background-attachment:local}
  .fb-roles{display:flex;gap:6px;flex-wrap:wrap}
  .fb-roles input{position:absolute;opacity:0;pointer-events:none}
  .fb-roles span{display:inline-block;padding:7px 12px;border-radius:999px;border:2px solid var(--line,#e4dccb);background:#fff;color:#25304d;font:800 12px/1 'Nunito',sans-serif;cursor:pointer;text-transform:none;letter-spacing:0}
  .fb-roles input:checked + span{background:var(--navy,#2f4fa8);border-color:var(--navy,#2f4fa8);color:#fff}
  .fb-roles input:focus-visible + span{outline:3px solid var(--yellow,#f6c944);outline-offset:2px}
  .fb-roles label{margin:0;letter-spacing:0;text-transform:none}
  .fb-sign{margin:12px 0 0;font:700 18px/1 'Gaegu',cursive;color:var(--navy,#2f4fa8)}
  .fb-send{margin-top:14px;width:100%;border:2px solid color-mix(in srgb,var(--red,#e5463b),#000 18%);border-radius:999px;padding:12px 16px;cursor:pointer;
    background:var(--red,#e5463b);color:var(--on-accent,#fff);font:900 14px/1 'Nunito',sans-serif;box-shadow:0 3px 0 color-mix(in srgb,var(--red,#e5463b),#000 32%)}
  .fb-send:disabled{opacity:.6;cursor:progress}
  .fb-error{margin:10px 0 0;color:var(--red,#e5463b);font-weight:800;font-size:13px}
  .fb-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
  .fb-done{text-align:center;padding:26px 18px 24px}
  .fb-done svg{width:72px;height:auto;animation:fb-pop .6s ease-out 1}
  .fb-done h2{margin-top:10px}
  @keyframes fb-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @keyframes fb-pop{0%{transform:scale(.6) rotate(-10deg)}60%{transform:scale(1.1) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
  @media (max-width:560px){.fb-overlay{align-items:flex-end;justify-content:center;padding:10px}.fb-letter{margin-bottom:0}.fb-nudge{right:80px;bottom:24px}}
  @media (prefers-reduced-motion:reduce){.fb-launch,.fb-launch.pop,.fb-letter,.fb-nudge,.fb-done svg{animation:none;transition:none}}
  `;

  /* ---------- icons ---------- */
  const MESSENGER = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 4C9.4 4 4 8.9 4 15c0 3.3 1.6 6.3 4.2 8.3V28l4.3-2.4c1.1.3 2.3.4 3.5.4 6.6 0 12-4.9 12-11S22.6 4 16 4Z" fill="currentColor"/><rect x="9.5" y="11" width="13" height="9" rx="1.6" fill="var(--red,#e5463b)"/><path d="M10.2 11.8 16 16l5.8-4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
  const SENT = `<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="7" y="15" width="46" height="31" rx="3" fill="var(--paper,#fffaf1)" stroke="var(--navy,#2f4fa8)" stroke-width="2.6"/><path d="M8 17 L30 33 L52 17" fill="none" stroke="var(--navy,#2f4fa8)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M30 42 c-5-3.4-7.5-5.8-7.5-8.6 a3.6 3.6 0 0 1 7.5-1.4 a3.6 3.6 0 0 1 7.5 1.4 c0 2.8-2.5 5.2-7.5 8.6z" fill="var(--red,#e5463b)"/></svg>`;

  /* ---------- build ---------- */
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const launch = document.createElement('button');
  launch.className = 'fb-launch pop';
  launch.type = 'button';
  launch.setAttribute('aria-label', 'Send feedback about SketchPost');
  launch.setAttribute('aria-haspopup', 'dialog');
  launch.innerHTML = MESSENGER;

  const overlay = document.createElement('div');
  overlay.className = 'fb-overlay'; overlay.hidden = true;
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-labelledby', 'fbTitle');

  const formHTML = `
    <div class="fb-letter">
      <div class="fb-airmail"></div>
      <button type="button" class="fb-close" aria-label="Close">×</button>
      <form class="fb-body" novalidate>
        <h2 id="fbTitle">Dear SketchPost,</h2>
        <p class="fb-sub">Found a bug, have an idea, or just want to say hi? This letter goes straight to the creator.</p>
        <label id="fbRoleLabel">I’m a…</label>
        <div class="fb-roles" role="radiogroup" aria-labelledby="fbRoleLabel">
          <label><input type="radio" name="role" value="Artist"><span>Artist</span></label>
          <label><input type="radio" name="role" value="Client"><span>Client</span></label>
          <label><input type="radio" name="role" value="Just visiting" checked><span>Just visiting</span></label>
        </div>
        <label for="fbMessage">Your letter</label>
        <textarea id="fbMessage" name="message" maxlength="3000" placeholder="Write your feedback here…" required></textarea>
        <label for="fbName">Your name (optional)</label>
        <input id="fbName" name="name" maxlength="80" autocomplete="name">
        <label for="fbEmail">Your email, if you'd like a reply (optional)</label>
        <input id="fbEmail" name="email" type="email" maxlength="120" autocomplete="email">
        <div class="fb-hp" aria-hidden="true"><input type="checkbox" name="botcheck" tabindex="-1"></div>
        <p class="fb-error" role="alert" hidden></p>
        <button class="fb-send" type="submit">Send letter ✉</button>
      </form>
    </div>`;
  const doneHTML = `
    <div class="fb-letter">
      <div class="fb-airmail"></div>
      <button type="button" class="fb-close" aria-label="Close">×</button>
      <div class="fb-done">${SENT}<h2>Letter sent!</h2><p class="fb-sub">Thank you for helping SketchPost grow. 💌</p></div>
    </div>`;

  document.body.append(launch, overlay);
  window.SketchPostFeedback = { open: () => open() };
  window.dispatchEvent(new Event('sketchpost-feedback-ready'));

  /* ---------- open / close ---------- */
  let lastFocus = null;
  function open() {
    removeNudge(true);
    if (!overlay.querySelector('form')) overlay.innerHTML = formHTML;
    overlay.hidden = false;
    lastFocus = document.activeElement;
    setTimeout(() => overlay.querySelector('textarea, .fb-close').focus(), 30);
  }
  function close() {
    overlay.hidden = true;
    if (overlay.querySelector('.fb-done')) overlay.innerHTML = '';   // fresh letter next time
    (lastFocus && lastFocus.isConnected ? lastFocus : launch).focus();
  }
  launch.addEventListener('click', open);
  overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('.fb-close')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });

  overlay.addEventListener('input', () => { const err = overlay.querySelector('.fb-error'); if (err) err.hidden = true; });

  /* ---------- send ---------- */
  overlay.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, err = f.querySelector('.fb-error'), btn = f.querySelector('.fb-send');
    const message = f.message.value.trim();
    const showError = t => { err.textContent = t; err.hidden = false; };
    err.hidden = true;
    if (!message) { showError('Please write a few words first.'); f.message.focus(); return; }
    if (f.email.value && !f.email.checkValidity()) { showError('That email doesn’t look right.'); f.email.focus(); return; }
    if (ACCESS_KEY.startsWith('PASTE')) { showError('Feedback isn’t set up yet (missing access key).'); return; }

    const role = (f.querySelector('input[name=role]:checked') || {}).value || 'Just visiting';
    btn.disabled = true; btn.textContent = 'Posting your letter…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `SketchPost feedback · ${role}`,
          from_name: 'SketchPost Feedback',
          botcheck: f.botcheck.checked,
          Role: role,
          Name: f.name.value.trim() || '(not given)',
          email: f.email.value.trim() || undefined,
          Message: message,
          Page: location.href
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || 'Send failed');
      overlay.innerHTML = doneHTML;
      overlay.querySelector('.fb-close').focus();
    } catch (e2) {
      console.error(e2);
      showError('Your letter couldn’t be sent. Check your connection and try again.');
      btn.disabled = false; btn.textContent = 'Send letter ✉';
    }
  });

  /* ---------- one-time nudge bubble ---------- */
  let nudge = null;
  function removeNudge(remember) {
    if (nudge) { nudge.remove(); nudge = null; }
    if (remember) { try { localStorage.setItem(NUDGE_KEY, '1'); } catch (e) {} }
  }
  let seen = false;
  try { seen = localStorage.getItem(NUDGE_KEY) === '1'; } catch (e) {}
  if (!seen) {
    setTimeout(() => {
      if (!overlay.hidden) return;
      const loader = document.getElementById('loader');
      if (loader && !loader.hidden) return;            // don't pop up over a loading screen
      nudge = document.createElement('div');
      nudge.className = 'fb-nudge'; nudge.setAttribute('role', 'status');
      nudge.innerHTML = `How’s SketchPost so far? Send us a letter! <button type="button" aria-label="Dismiss">×</button>`;
      nudge.querySelector('button').addEventListener('click', () => removeNudge(true));
      nudge.addEventListener('click', e => { if (!e.target.closest('button')) open(); });
      document.body.appendChild(nudge);
    }, NUDGE_DELAY_MS);
  }
})();
