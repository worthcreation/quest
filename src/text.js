// ===== text.js: Speech and titles: say() with pages and holds, showTitle, dismissHeld, updateTexts.
canvas.addEventListener('pointerdown', e => {
  if (state.won) { newGame(); return; }
  if (state.menu) menuTap(e.clientX, e.clientY);
  else if (!state.choice && TOUCH && heldText()) dismissHeld();   // a tap on the screen reads on, same as the action button
  else if (state.choice) { const r = (state.choiceRects || []).find(o => e.clientX >= o.x && e.clientX <= o.x + o.w && e.clientY >= o.y && e.clientY <= o.y + o.h); if (r) { const c = state.choice; state.choice = null; c.cb(r.i); } }
});

// =====================================================================
// Floating text, anchored near whatever it talks about
// =====================================================================
// Minimal text: tips never appear in the world (they scroll along the bottom of the menu instead),
// "F to do something" prompts shrink to a key badge, and while someone is talking, hints and titles wait.
const SPEECH = new Set(['pip', 'npc']);
function rememberTip(text) { const p = state.tipPool || (state.tipPool = []); if (!p.includes(text)) p.push(text); }
function promptKey(text) {
  for (const k of Object.values(K).filter(Boolean).sort((a, b) => b.length - a.length)) if (text.startsWith(k + ' to ') || text.startsWith(k + ' now to ')) return k;
  return null;
}
function say(text, x, y, opts = {}) {
  if (opts.tip) { rememberTip(text); return; }
  const badge = promptKey(text);
  if (badge) { rememberTip(text); return; }          // "F to ..." prompts are replaced by the shine and label
  if (opts.key) {                                 // same message still showing: keep it, don't restart it
    const o = state.texts.find(o => o.key === opts.key && (o.full || o.text) === text);
    if (o) { o.x = x; o.y = y; if (!o.hold) o.life = Math.max(o.life, o.t + (opts.life || 3.2) * 0.5); return; }
  }
  // speech (Pip, people) stays on screen until you press the action key: nothing you're meant to read walks off on its own
  const hold = SPEECH.has(opts.key) && opts.hold !== false;
  // speech comes a sentence or two at a time, near whoever is saying it: never a wall of words
  const pages = SPEECH.has(opts.key) ? speechPages(text) : [text];
  const t = { text: pages[0], full: text, more: pages.slice(1), hold0: hold, who: opts.who || (opts.key === 'pip' ? 'pip' : null), x, y, t: 0, life: hold ? 1e9 : (opts.life && pages.length === 1 ? opts.life : readTime(pages[0])), hold, site: opts.site || null, key: opts.key || null, follow: x == null, size: opts.size || 1, color: opts.color || '#fdf6e3', badge, hint: !opts.color && !SPEECH.has(opts.key) && !badge };
  if (t.key) state.texts = state.texts.filter(o => o.key !== t.key);
  if (t.follow) state.texts = state.texts.filter(o => !o.follow);
  // the same words from somewhere else just refresh; too many at once drops the oldest non-reading one
  const dup = state.texts.find(o => (o.full || o.text) === text);
  if (dup) { dup.life = Math.max(dup.life, dup.t + t.life); return; }
  state.texts.push(t);
  while (state.texts.length > 6) state.texts.splice(state.texts.findIndex(o => o.text.length <= 110), 1);
}
function sayHero(text, opts) { say(text, null, null, opts); }
// level-ups and the like: a small parchment scroll in the lower half of the screen, a few seconds, then gone
function showScroll(title, text) { (state.scrolls = state.scrolls || []).push({ title, text, t: 0, life: 4.8 }); sfx.heart(); }
// split speech into pages of a sentence or two (about 80 characters at most)
function speechPages(text, max = 80) {
  const lead = (text.match(/^\.{2,}\s*/) || [''])[0], body = text.slice(lead.length);   // "...no, LISTEN." keeps its ellipsis: the scene opens mid-conversation
  const sent = body.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g) || [body], out = [];
  let cur = '';
  for (const s0 of sent) { const s = s0.trim(); if (!s) continue; if (cur && (cur + ' ' + s).length > max) { out.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s; }
  if (cur) out.push(cur);
  if (out.length && lead) out[0] = lead.trim() + out[0];
  return out.length ? out : [text];
}
const readTime = s => Math.min(7, 2.4 + s.length / 16);
// the next page of what someone is saying, if there is one
function nextPage(t) {
  if (!t.more || !t.more.length) return false;
  t.text = t.more.shift(); t.t = 0; t.pos = null; t.ly = null; t.hold = t.hold0; t.life = t.hold ? 1e9 : readTime(t.text);
  return true;
}
// anything waiting to be read? (a held title or held speech)
function heldText() { return (state.title && state.title.hold) || state.texts.some(t => t.hold); }
// the action key clears one thing at a time: the quest alert first, then the oldest held speech.
// Returns true when the press was used up this way.
function dismissHeld() {
  if (state.title && state.title.hold) { state.title.life = state.title.t + (state.title.style === 'herald' ? 1.1 : 0.3); state.title.hold = false; sfx.tock(); return true; }
  const t = state.texts.find(o => o.hold);
  if (t) { sfx.tock(); if (nextPage(t)) return true; t.hold = false; t.life = t.t + 0.25; t.done = state.time; return true; }
  return false;
}
function unsay(key) { state.texts = state.texts.filter(o => o.key !== key); }
// a title with hold: true (quest alerts) waits on screen until you clear it with the action key
function showTitle(text, sub, style = 'area', life = 3, hold = false) {
  if (style === 'relic' || style === 'quest') { style = 'herald'; life = Math.max(life, 3.6); }   // one kind of banner for everything notable: the region's ribbon
  const t = { text, sub, style, t: 0, life: hold ? 1e9 : life, at: state.time, hold };
  if (speakingNow()) { (state.titleQ = state.titleQ || []).push(t); return; }   // wait until nobody is talking
  state.title = t;
}

// floating text timers
function updateTexts(dt) {
  if (!state.title && state.titleQ && state.titleQ.length && !speakingNow()) {
    const t = state.titleQ.shift();
    if (t.style !== 'area' || state.time - t.at < 8) { t.t = 0; state.title = t; }   // stale place names are dropped
  }
  // held words stay while they're about what's in front of you. Walk away from the place they're about (or, for
  // anything someone said, far from where they said it) and they let go and fade.
  const h = state.hero;
  for (const t of state.texts) if (t.hold && h && !t.follow) {
    const s = t.site, far = s ? Math.hypot(h.x - s.x, h.y - s.y) > UNIT * s.r : t.x != null && Math.hypot(h.x - t.x, h.y - t.y) > UNIT * 11;
    if (far) { t.hold = false; t.life = t.t + 0.8; }
  }
  for (let i = state.texts.length - 1; i >= 0; i--) { const t = state.texts[i]; t.t += dt; if (t.t > t.life && !(t.done == null && nextPage(t))) state.texts.splice(i, 1); }
  if (state.title) { state.title.t += dt; if (state.title.t > state.title.life) state.title = null; }
}
