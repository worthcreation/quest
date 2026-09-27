
// =====================================================================
// Input: arrows move. F sword/grab/talk, D throw, A dash, S eat, E marsh fire,
// Space menu. R starts over at the ending.
// =====================================================================
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  if (!state.started) { begin(); return; }
  if (e.repeat) return;
  if (state.remap) { assignKey(state.remap, k); return; }
  state.keys[k] = true;
  if (k === 'r' && state.won) { newGame(); return; }
  if ((k === state.settings.keys.menu || k === 'escape') && !state.won) toggleMenu();
});
function assignKey(action, k) {
  if (k === 'escape') { state.remap = null; return; }
  const map = state.settings.keys;
  for (const a in map) if (map[a] === k) map[a] = map[action];     // swap if the key was taken
  map[action] = k;
  state.remap = null; state.keys = {}; state.prevKeys = {};
  refreshK(); saveSettings(); sfx.pickup();
}
window.addEventListener('keyup', e => { state.keys[e.key.toLowerCase()] = false; });
document.querySelectorAll('#pad button').forEach(b => {
  const map = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' };
  bindHold(b, map[b.dataset.dir]);
});
function bindHold(el, key) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); state.keys[key] = true; begin();
    if (key === 'btnswap') { try { el.setPointerCapture(e.pointerId); } catch (_) {} state.radialPtr = null; }
  });
  // on the swap button, dragging the thumb points the quick-select wheel
  if (key === 'btnswap') el.addEventListener('pointermove', e => {
    if (!state.keys.btnswap) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    state.radialPtr = Math.hypot(dx, dy) > 18 ? [dx, dy] : null;
  });
  ['pointerup', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => { state.keys[key] = false; }));
  el.addEventListener('pointerleave', () => { if (key !== 'btnswap') state.keys[key] = false; });
}
bindHold(document.getElementById('act'), 'btnact');
bindHold(document.getElementById('jump'), 'btnjump');
bindHold(document.getElementById('throw'), 'btnswap');
bindHold(document.getElementById('dash'), 'btndash');
bindHold(document.getElementById('eat'), 'btneat');
bindHold(document.getElementById('slotd'), 'btnslotd');
bindHold(document.getElementById('fire'), 'btnfire');
document.getElementById('menubtn').addEventListener('pointerdown', e => { e.preventDefault(); if (state.started && !state.won) toggleMenu(); });
canvas.addEventListener('pointerdown', e => {
  if (state.won) { newGame(); return; }
  if (state.menu) menuTap(e.clientX, e.clientY);
  else if (state.choice) { const r = (state.choiceRects || []).find(o => e.clientX >= o.x && e.clientX <= o.x + o.w && e.clientY >= o.y && e.clientY <= o.y + o.h); if (r) { const c = state.choice; state.choice = null; c.cb(r.i); } }
});

const kk = a => !!state.keys[state.settings.keys[a]];
const held = {
  act:   () => kk('act') || !!(state.keys.enter || state.keys.btnact),
  jump:  () => kk('jump') || !!state.keys.btnjump,
  swap:  () => kk('swap') || !!state.keys.btnswap,
  dash:  () => kk('dash') || !!state.keys.btndash,
  eat:   () => kk('eat') || !!state.keys.btneat,
  slotd: () => kk('slotd') || !!state.keys.btnslotd,
  fire:  () => kk('fire') || !!state.keys.btnfire,
  up:    () => kk('up') || !!state.keys.arrowup,
  down:  () => kk('down') || !!state.keys.arrowdown,
  left:  () => kk('left') || !!state.keys.arrowleft,
  right: () => kk('right') || !!state.keys.arrowright,
};
const pressedNow = {};
function readPresses() {
  for (const k in held) { const v = held[k](); pressedNow[k] = v && !state.prevKeys[k]; state.prevKeys[k] = v; }
}
function inputVector() {
  if (state.radial) return { x: 0, y: 0 };          // arrows point the wheel instead
  let x = 0, y = 0;
  if (held.up()) y -= 1;
  if (held.down()) y += 1;
  if (held.left()) x -= 1;
  if (held.right()) x += 1;
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}
function refreshButtons() {
  const inv = state.inv;
  { const sl = slotsOf(), lab = s => !s ? '' : s.kind === 'ability' ? (s.id === 'dodge' ? 'dodge' : 'fire') : s.kind === 'food' ? 'eat' : s.kind === 'seed' ? 'plant' : s.id;
    for (const [id, k] of [['dash', 'a'], ['eat', 's'], ['slotd', 'd']]) { const el = document.getElementById(id); if (!el) continue; el.classList.toggle('hidden', !sl[k] || (k === 'a' && sl.a.kind === 'ability' && sl.a.id === 'dodge' && !inv.step)); el.textContent = lab(sl[k]); } }
  document.getElementById('eat').classList.toggle('hidden', !inv.food.length);
  document.getElementById('fire').classList.toggle('hidden', !inv.fire);
  document.getElementById('throw').classList.toggle('hidden', !(inv.sword || inv.acorns || inv.food.length));
  document.getElementById('throw').textContent = 'swap';
}

// =====================================================================
// Audio (all synthesized, no files)
// =====================================================================
let audio, master, musicGain, noiseBuf, soundOn = true;
let currentMusic = 'forest', nextNoteTime = 0, noteIndex = 0, musicTimer = null, nextFrog = 0;
let amb = null, pendingAmb = 'none';

function initAudio() {
  if (audio) return;
  audio = new (window.AudioContext || window.webkitAudioContext)();
  master = audio.createGain(); master.gain.value = soundOn ? 0.9 : 0; master.connect(audio.destination);
  musicGain = audio.createGain(); musicGain.gain.value = 1; musicGain.connect(master);
  noiseBuf = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function tone(freq, start, dur, { type = 'triangle', vol = 0.12, attack = 0.03, to = null, pan = 0, dest = master } = {}) {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain();
  const t = audio.currentTime + start;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o.connect(g);
  if (pan && audio.createStereoPanner) { const p = audio.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node = g.connect(p); }
  node.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(start, dur, { vol = 0.2, freq = 400, q = 1, type = 'lowpass', dest = master } = {}) {
  if (!audio) return;
  const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
  const t = audio.currentTime + start;
  s.buffer = noiseBuf; s.loop = true;
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(dest);
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
const panOf = x => (x / W) * 1.6 - 0.8;

// Music: one entry per step, [melody midi, bass midi], 0 = rest. All original.
const CAVE_LOOP = [
  [62,38],[0,0],[0,0],[65,0],[0,0],[0,0],[64,0],[0,0],
  [0,0],[0,0],[61,0],[0,0],[0,0],[0,0],[0,0],[0,0],
  [0,34],[0,0],[69,0],[0,0],[0,0],[70,0],[0,0],[69,0],
  [0,0],[0,0],[65,0],[0,0],[64,0],[0,0],[0,0],[0,0],
  [0,38],[0,0],[57,0],[0,0],[0,0],[58,0],[0,0],[0,0],
  [61,0],[0,0],[0,0],[0,0],[62,0],[0,0],[0,0],[0,0],
];
const MUSIC = {
  forest: {
    step: 60 / 92 / 2, shift: 0, shimmer: true,
    lead: { type: 'triangle', vol: 0.10, len: 1.6 }, bass: { type: 'sine', vol: 0.14, len: 3.2 },
    loop: [
      [67,43],[71,0],[74,0], [79,50],[74,0],[71,0], [69,45],[71,0],[74,0], [76,0],[0,0],[74,0],
      [72,48],[74,0],[76,0], [79,52],[76,0],[74,0], [71,43],[69,0],[67,0], [69,0],[0,0],[0,0],
      [67,43],[71,0],[74,0], [79,50],[81,0],[79,0], [76,45],[74,0],[71,0], [74,0],[0,0],[76,0],
      [79,48],[78,0],[76,0], [74,52],[71,0],[69,0], [67,43],[0,0],[0,0],   [62,43],[0,0],[0,0],
    ],
  },
  field: {                       // restless low pulse under long, uneasy notes
    step: 60 / 104 / 2, shift: 0,
    lead: { type: 'triangle', vol: 0.07, len: 5 }, bass: { type: 'triangle', vol: 0.09, len: 1.3 },
    loop: [
      [76,45],[0,0],[0,45],[0,0],[0,45],[0,0],[77,52],[0,0],
      [76,46],[0,0],[0,46],[0,0],[0,46],[0,0],[74,53],[0,0],
      [72,45],[0,0],[0,45],[0,0],[71,45],[0,0],[0,52],[0,0],
      [69,43],[0,0],[0,43],[0,0],[68,43],[0,0],[0,50],[0,0],
      [0,45],[0,0],[0,45],[0,0],[0,45],[0,0],[0,52],[0,0],
      [81,46],[0,0],[0,46],[0,0],[80,46],[0,0],[0,53],[0,0],
      [77,45],[0,0],[0,45],[0,0],[76,45],[0,0],[0,52],[0,0],
      [71,40],[0,0],[0,40],[0,0],[0,44],[0,0],[0,44],[0,0],
    ],
  },
  woods: {                       // the forest tune, lower, slower, no sparkle
    step: 60 / 76 / 2, shift: -5, shimmer: false,
    lead: { type: 'sine', vol: 0.08, len: 2.2 }, bass: { type: 'triangle', vol: 0.1, len: 4 },
    loop: null,
  },
  night: { step: 60 / 60 / 2, shift: -12, shimmer: true, lead: { type: 'sine', vol: 0.07, len: 3 }, bass: { type: 'sine', vol: 0.08, len: 6 }, loop: null },
  cave:  { step: 60 / 44 / 2, shift: 0, lead: { type: 'sine', vol: 0.08, len: 3.5 }, bass: { type: 'triangle', vol: 0.09, len: 9 }, loop: CAVE_LOOP },
  cave2: { step: 60 / 52 / 2, shift: -3, lead: { type: 'sine', vol: 0.08, len: 3 }, bass: { type: 'sawtooth', vol: 0.035, len: 9 }, loop: CAVE_LOOP },
  boss: {
    step: 60 / 150 / 2, shift: 0,
    lead: { type: 'square', vol: 0.045, len: 1.4 }, bass: { type: 'sawtooth', vol: 0.06, len: 0.9 },
    loop: [
      [0,40],[0,40],[64,52],[0,40],[0,40],[0,40],[67,52],[0,43],
      [0,40],[0,40],[65,52],[0,40],[0,46],[0,46],[64,58],[0,45],
      [0,40],[0,40],[64,52],[0,40],[0,40],[0,40],[70,52],[0,43],
      [0,41],[0,41],[69,53],[0,41],[0,39],[0,39],[63,51],[0,39],
    ],
  },
  marsh: {
    step: 60 / 58 / 2, shift: 0, frogs: true,
    lead: { type: 'sine', vol: 0.07, len: 4 }, bass: { type: 'sine', vol: 0.12, len: 11 },
    loop: [
      [65,41],[0,0],[0,0],[68,0],[0,0],[0,0],[70,0],[0,0],[0,0],[0,0],[68,0],[0,0],
      [63,39],[0,0],[0,0],[0,0],[66,0],[0,0],[0,0],[65,0],[0,0],[0,0],[0,0],[0,0],
    ],
  },
};
// when the gremlins come: a slow, low pedal with a tritone lurch and creeping half steps
MUSIC.sinister = {
  step: 60 / 66 / 2, shift: 0,
  lead: { type: 'sawtooth', vol: 0.03, len: 3 }, bass: { type: 'triangle', vol: 0.11, len: 3.5 },
  loop: [[62,38],[0,0],[63,0],[0,0],[0,38],[0,0],[68,0],[0,0],[67,44],[0,0],[0,0],[63,0],[0,44],[0,0],[62,0],[61,0],
         [62,38],[0,0],[63,0],[0,0],[0,38],[0,0],[70,0],[0,0],[69,44],[0,0],[68,0],[0,0],[0,44],[0,0],[0,0],[0,0]],
};
MUSIC.swamp = { ...MUSIC.marsh, step: 60 / 48 / 2, shift: -4, lead: { type: 'triangle', vol: 0.06, len: 5 } };
MUSIC.woods.loop = MUSIC.forest.loop;
MUSIC.night.loop = MUSIC.forest.loop;
function scheduleMusic() {
  const m = MUSIC[currentMusic];
  while (nextNoteTime < audio.currentTime + 0.3) {
    const [mel, bass] = m.loop[noteIndex % m.loop.length];
    const s = Math.max(0, nextNoteTime - audio.currentTime);
    if (mel) tone(midiHz(mel + m.shift), s, m.step * m.lead.len, { type: m.lead.type, vol: m.lead.vol, attack: 0.05, dest: musicGain });
    if (mel && m.shimmer) tone(midiHz(mel) * 2, s, m.step * 0.9, { type: 'sine', vol: 0.025, attack: 0.02, dest: musicGain });
    if (bass) tone(midiHz(bass + m.shift), s, m.step * m.bass.len, { type: m.bass.type, vol: m.bass.vol, attack: m.bass.len < 2 ? 0.01 : 0.3, dest: musicGain });
    nextNoteTime += m.step;
    noteIndex++;
  }
  if (m.frogs && audio.currentTime > nextFrog) {
    const p = Math.random() * 1.6 - 0.8, f = 150 + Math.random() * 80;
    for (let i = 0; i < 2 + (Math.random() * 3 | 0); i++) tone(f, i * 0.13, 0.1, { type: 'square', vol: 0.03, attack: 0.005, to: f * 0.7, pan: p, dest: musicGain });
    nextFrog = audio.currentTime + 1.5 + Math.random() * 4;
  }
}
function setMusic(name) {
  if (!audio) { currentMusic = name; return; }
  if (name === currentMusic) return;
  const t = audio.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
  currentMusic = name;
  setTimeout(() => {
    noteIndex = 0;
    nextNoteTime = audio.currentTime + 0.1;
    const t2 = audio.currentTime;
    musicGain.gain.cancelScheduledValues(t2);
    musicGain.gain.setValueAtTime(0.0001, t2);
    musicGain.gain.linearRampToValueAtTime(1, t2 + 1.5);
  }, 650);
}
function startMusic() {
  initAudio();
  if (audio.state === 'suspended') audio.resume();
  nextNoteTime = audio.currentTime + 0.1;
  clearInterval(musicTimer);
  musicTimer = setInterval(scheduleMusic, 100);
  setAmbience(pendingAmb);
}

// Ambience beds: wind, waterfall, marsh hum
function setAmbience(type) {
  pendingAmb = type;
  if (!audio) return;
  if (amb && amb.type === type) return;
  if (amb) { const a = amb; a.g.gain.setTargetAtTime(0.0001, audio.currentTime, 0.3); setTimeout(() => { try { a.src.stop(); } catch (e) {} }, 1500); }
  amb = null;
  if (type === 'none') return;
  const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
  src.buffer = noiseBuf; src.loop = true;
  if (type === 'wind') { f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.7; }
  if (type === 'falls') { f.type = 'lowpass'; f.frequency.value = 900; }
  if (type === 'marsh') { f.type = 'lowpass'; f.frequency.value = 260; }
  if (type === 'rain') { f.type = 'highpass'; f.frequency.value = 1800; }
  g.gain.value = 0.0001;
  src.connect(f).connect(g).connect(master);
  src.start();
  amb = { type, src, f, g, next: 0 };
}
function ambLevel(v, freq) {
  if (!amb || audio.currentTime < amb.next) return;
  amb.next = audio.currentTime + 0.1;
  amb.g.gain.setTargetAtTime(Math.max(0.0001, v), audio.currentTime, 0.25);
  if (freq) amb.f.frequency.setTargetAtTime(freq, audio.currentTime, 0.3);
}

// sound effects
const sfx = {
  drip(pan) { const f = 1400 + Math.random() * 900; tone(f, 0, 0.12, { type: 'sine', vol: 0.07, attack: 0.002, to: f * 0.4, pan, dest: musicGain }); tone(f, 0.28, 0.1, { type: 'sine', vol: 0.02, attack: 0.002, to: f * 0.4, pan: -pan, dest: musicGain }); },
  fall()   { [784, 659, 523, 392, 311, 233].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'triangle', vol: 0.12 })); },
  growl()  { noise(0, 1.1, { vol: 0.35, freq: 260, q: 4 }); tone(70, 0, 1.0, { type: 'sawtooth', vol: 0.07, attack: 0.15, to: 48 }); },
  roar()   { noise(0, 2.0, { vol: 0.5, freq: 320, q: 3 }); tone(80, 0, 1.8, { type: 'sawtooth', vol: 0.1, attack: 0.2, to: 40 }); tone(60, 0.1, 1.8, { type: 'square', vol: 0.05, to: 30 }); },
  snort()  { noise(0, 0.5, { vol: 0.25, freq: 700, q: 3 }); tone(90, 0, 0.5, { type: 'sawtooth', vol: 0.05, to: 60 }); },
  windup() { noise(0, 0.4, { vol: 0.18, freq: 500, q: 6 }); tone(110, 0, 0.4, { type: 'sawtooth', vol: 0.05, to: 160 }); },
  skitter(pan) { for (let i = 0; i < 5; i++) noise(i * 0.06, 0.03, { vol: 0.12, freq: 3500, q: 6, type: 'bandpass' }); tone(1800, 0, 0.8, { type: 'sine', vol: 0.03, to: 500, pan }); },
  hit()    { tone(160, 0, 0.35, { type: 'sine', vol: 0.4, attack: 0.005, to: 45 }); noise(0, 0.25, { vol: 0.3, freq: 1200 }); },
  swoosh() { noise(0, 0.18, { vol: 0.22, freq: 2500, q: 1.5, type: 'bandpass' }); },
  charge() { tone(880, 0, 0.15, { type: 'sine', vol: 0.08, to: 1320 }); },
  stab()   { noise(0, 0.14, { vol: 0.25, freq: 3800, q: 2, type: 'bandpass' }); tone(500, 0, 0.12, { type: 'triangle', vol: 0.08, to: 900 }); },
  clang()  { [1250, 1870, 2630].forEach(f => tone(f, 0, 0.45, { type: 'square', vol: 0.04, attack: 0.002, to: f * 0.97 })); noise(0, 0.12, { vol: 0.25, freq: 5000, type: 'highpass' }); },
  whack()  { tone(220, 0, 0.18, { type: 'square', vol: 0.08, attack: 0.002, to: 90 }); noise(0, 0.1, { vol: 0.2, freq: 1500 }); },
  crash()  { noise(0, 0.6, { vol: 0.45, freq: 500 }); tone(90, 0, 0.5, { type: 'sine', vol: 0.3, to: 40 }); },
  boing()  { tone(300, 0, 0.35, { type: 'sine', vol: 0.18, to: 700 }); tone(600, 0.05, 0.25, { type: 'triangle', vol: 0.06, to: 350 }); },
  death()  { noise(0, 1.2, { vol: 0.3, freq: 400, q: 3 }); tone(200, 0, 1.2, { type: 'sawtooth', vol: 0.07, to: 35 }); },
  pickup() { [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.25, { type: 'triangle', vol: 0.1 })); },
  heart()  { [880, 1175, 1760].forEach((f, i) => tone(f, i * 0.06, 0.3, { type: 'sine', vol: 0.1 })); },
  munch()  { for (let i = 0; i < 3; i++) noise(i * 0.12, 0.08, { vol: 0.2, freq: 1800, q: 2, type: 'bandpass' }); tone(523, 0.38, 0.2, { type: 'triangle', vol: 0.08, to: 784 }); },
  dash()   { noise(0, 0.25, { vol: 0.25, freq: 1200, q: 1, type: 'bandpass' }); tone(300, 0, 0.2, { type: 'sine', vol: 0.06, to: 900 }); },
  pop()    { tone(260, 0, 0.18, { type: 'sine', vol: 0.25, to: 800 }); noise(0, 0.15, { vol: 0.15, freq: 900 }); },
  strain() { noise(0, 0.35, { vol: 0.12, freq: 300, q: 2 }); tone(95, 0, 0.3, { type: 'sawtooth', vol: 0.04, to: 80 }); },
  creak(up){ const f = up ? 180 : 140; tone(f, 0, 0.35, { type: 'sawtooth', vol: 0.05, attack: 0.05, to: f * 1.35 }); noise(0, 0.25, { vol: 0.06, freq: 900, q: 8 }); },
  rumble() { noise(0, 0.9, { vol: 0.3, freq: 140, q: 2 }); tone(42, 0, 0.9, { type: 'sine', vol: 0.2, attack: 0.2 }); },
  splash() { noise(0, 0.5, { vol: 0.3, freq: 1600, q: 0.8 }); tone(200, 0, 0.3, { type: 'sine', vol: 0.1, to: 90 }); },
  bubble() { for (let i = 0; i < 4; i++) tone(300 + Math.random() * 300, i * 0.12, 0.08, { type: 'sine', vol: 0.06, to: 700 }); },
  whoosh() { noise(0, 1.2, { vol: 0.3, freq: 700, q: 0.8, type: 'bandpass' }); tone(200, 0, 1.2, { type: 'sine', vol: 0.05, to: 600 }); },
  plummet(){ tone(900, 0, 0.9, { type: 'sine', vol: 0.12, to: 120 }); },
  land()   { tone(110, 0, 0.3, { type: 'sine', vol: 0.3, to: 55 }); noise(0, 0.2, { vol: 0.2, freq: 600 }); },
  chirp(pan) { tone(2600, 0, 0.08, { type: 'sine', vol: 0.05, to: 3400, pan }); tone(3100, 0.12, 0.09, { type: 'sine', vol: 0.05, to: 2300, pan }); tone(3300, 0.26, 0.07, { type: 'sine', vol: 0.04, to: 3600, pan }); },
  flap(pan) { for (let i = 0; i < 6; i++) noise(i * 0.07, 0.05, { vol: 0.12, freq: 900 + i * 60, q: 1.5, type: 'bandpass' }); },
  shing()  { noise(0, 0.5, { vol: 0.2, freq: 6000, q: 1 }); tone(1200, 0, 0.6, { type: 'sine', vol: 0.12, to: 2400 }); },
  fanfare() {                       // short-short-short-long, then a bright chord
    [[392, 0], [392, 0.1], [392, 0.2], [523, 0.32]].forEach(([f, t], i) => {
      tone(f, t, i === 3 ? 0.45 : 0.09, { type: 'sawtooth', vol: 0.07, attack: 0.005 });
      tone(f * 1.5, t, i === 3 ? 0.45 : 0.09, { type: 'square', vol: 0.03, attack: 0.005 });
    });
    [523, 659, 784, 1047].forEach(f => tone(f, 0.8, 1.2, { type: 'triangle', vol: 0.08, attack: 0.02 }));
  },
  flash()  { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.04, 1.4, { type: 'triangle', vol: 0.07 })); noise(0, 0.6, { vol: 0.12, freq: 7000, type: 'highpass' }); },
  thunder() { noise(0, 0.15, { vol: 0.5, freq: 3000, type: 'highpass' }); noise(0.05, 2.6, { vol: 0.55, freq: 180, q: 1 }); tone(50, 0.05, 2.2, { type: 'sine', vol: 0.25, to: 30 }); },
  crackle() { for (let i = 0; i < 3; i++) noise(Math.random() * 0.3, 0.03, { vol: 0.06, freq: 2500, q: 3, type: 'bandpass' }); },
  hiss()   { noise(0, 0.25, { vol: 0.08, freq: 900, q: 0.7, type: 'bandpass' }); },
  spark()  { noise(0, 0.08, { vol: 0.2, freq: 6000, type: 'highpass' }); tone(2200, 0, 0.08, { type: 'square', vol: 0.03 }); },
  whumpf() { noise(0, 0.9, { vol: 0.4, freq: 350, q: 0.8 }); tone(70, 0, 0.8, { type: 'sine', vol: 0.3, to: 40 }); },
  burp()   { tone(110, 0, 0.9, { type: 'sawtooth', vol: 0.09, attack: 0.05, to: 70 }); noise(0, 0.9, { vol: 0.12, freq: 300, q: 4 }); },
  flip()   { tone(1800, 0, 0.12, { type: 'sine', vol: 0.04, to: 2600 }); },
  glint()  { tone(3100, 0, 0.25, { type: 'sine', vol: 0.025, to: 3600 }); },
  flipStrike() { [880, 1320, 1760].forEach((f, i) => tone(f, i * 0.03, 0.4, { type: 'triangle', vol: 0.08 })); noise(0, 0.2, { vol: 0.25, freq: 4500, q: 1, type: 'bandpass' }); },
  throw()  { noise(0, 0.15, { vol: 0.15, freq: 1400, q: 1.2, type: 'bandpass' }); },
  tock()   { tone(700, 0, 0.06, { type: 'square', vol: 0.06, to: 400 }); },
  rustle() { noise(0, 0.35, { vol: 0.14, freq: 2200, q: 0.8, type: 'bandpass' }); },
  lift()   { noise(0, 0.3, { vol: 0.15, freq: 400 }); tone(150, 0, 0.3, { type: 'sawtooth', vol: 0.04, to: 220 }); },
  plant()  { noise(0, 0.2, { vol: 0.12, freq: 700 }); tone(660, 0.1, 0.2, { type: 'sine', vol: 0.06, to: 880 }); },
  tired()  { tone(300, 0, 0.3, { type: 'sine', vol: 0.06, to: 180 }); },
  cackle() { for (let i = 0; i < 6; i++) tone(700 + Math.random() * 500, i * 0.08, 0.07, { type: 'square', vol: 0.04, to: 500 + Math.random() * 300 }); },
  jump()   { tone(330, 0, 0.14, { type: 'triangle', vol: 0.07, to: 520 }); },
  slam()   { tone(120, 0, 0.5, { type: 'sine', vol: 0.4, to: 40 }); noise(0, 0.45, { vol: 0.4, freq: 600 }); [220, 330].forEach(f => tone(f, 0, 0.25, { type: 'square', vol: 0.04, to: f * 0.5 })); },
  spin()   { noise(0, 0.4, { vol: 0.3, freq: 2200, q: 1, type: 'bandpass' }); [660, 880, 1100, 1320].forEach((f, i) => tone(f, i * 0.05, 0.3, { type: 'triangle', vol: 0.06 })); },
  grow()   { [523, 659, 784].forEach((f, i) => tone(f, i * 0.1, 0.5, { type: 'sine', vol: 0.08 })); },
  sizzle() { noise(0, 0.3, { vol: 0.1, freq: 3000, q: 1, type: 'bandpass' }); },
  beat()   { tone(1320, 0, 0.06, { type: 'square', vol: 0.03 }); },
  whirlUp(n) { tone(440 * Math.pow(1.06, n), 0, 0.2, { type: 'triangle', vol: 0.08, to: 660 * Math.pow(1.06, n) }); noise(0, 0.2, { vol: 0.2, freq: 2400, q: 1, type: 'bandpass' }); },
  dizzy()  { tone(600, 0, 0.5, { type: 'sine', vol: 0.08, to: 250 }); },
  forge()  { [1500, 1500, 2200].forEach((f, i) => { tone(f, i * 0.18, 0.3, { type: 'square', vol: 0.04, to: f * 0.9 }); noise(i * 0.18, 0.08, { vol: 0.2, freq: 5000, type: 'highpass' }); }); },
  spores() { for (let i = 0; i < 8; i++) tone(900 + Math.random() * 1400, i * 0.06, 0.25, { type: 'sine', vol: 0.03, to: 2400 }); noise(0, 0.8, { vol: 0.12, freq: 1800, q: 1, type: 'bandpass' }); },
  talk()   { for (let i = 0; i < 3; i++) tone(300 + Math.random() * 200, i * 0.07, 0.06, { type: 'square', vol: 0.03 }); },
  croak()  { tone(120, 0, 0.35, { type: 'square', vol: 0.06, to: 85 }); tone(100, 0.25, 0.3, { type: 'square', vol: 0.05, to: 75 }); },
  victory() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => tone(f, i * 0.11, 0.18, { type: 'square', vol: 0.1, attack: 0.005 }));
    tone(1568, notes.length * 0.11, 0.8, { type: 'triangle', vol: 0.16 });
  },
};

function setSound(on) {
  soundOn = on;
  if (master) master.gain.value = soundOn ? 0.9 : 0;
  state.settings.sound = on; saveSettings();
}

// =====================================================================
// Camera: gentle focus zoom plus bouncing zoom ripples of varying size
// =====================================================================
const ZP = {          // amount, duration, bounces
  tap:    [0.015, 0.25, 1],
  hit:    [0.035, 0.35, 2],
  hurt:   [0.05, 0.45, 2],
  parry:  [0.07, 0.55, 3],
  kill:   [0.09, 0.8, 3],
  pickup: [0.05, 0.6, 2],
  land:   [0.12, 0.9, 4],
  boss:   [0.15, 1.5, 5],
  title:  [0.05, 1.1, 2],
};
function zoomPulse(x, y, preset) { const [a, d, b] = ZP[preset]; state.cam.pulses.push({ x, y, a, d, b, t: 0 }); }
function updateCam(dt) {
  const c = state.cam;
  let add = 0, wx = 0, wy = 0, ws = 0;
  for (let i = c.pulses.length - 1; i >= 0; i--) {
    const p = c.pulses[i]; p.t += dt;
    const k = p.t / p.d;
    if (k >= 1) { c.pulses.splice(i, 1); continue; }
    const v = p.a * (1 - k) * (1 - k) * Math.abs(Math.sin(Math.PI * p.b * k));
    add += v; wx += p.x * v; wy += p.y * v; ws += v;
  }
  const f = c.focus;
  const tz = f ? f.z : 1;
  const [tx, ty] = f ? f.at() : [W / 2, H / 2];
  const k = 1 - Math.exp(-(f ? 5 : 3) * dt);
  c.z += (tz - c.z) * k; c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
  c.ez = Math.max(1, c.z + add);
  const m = Math.min(1, ws * 5);
  c.ex = ws ? c.x + (wx / ws - c.x) * m : c.x;
  c.ey = ws ? c.y + (wy / ws - c.y) * m : c.y;
  const hw = W / (2 * c.ez), hh = H / (2 * c.ez);
  c.ex = Math.max(hw, Math.min(W - hw, c.ex));
  c.ey = Math.max(hh, Math.min(H - hh, c.ey));
}
const toScreen = (x, y) => [(x - state.cam.ex) * state.cam.ez + W / 2, (y - state.cam.ey) * state.cam.ez + H / 2];

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
function speakingNow() { return !!state.npcTalk || state.texts.some(t => SPEECH.has(t.key) && t.t < t.life - 0.3); }
function say(text, x, y, opts = {}) {
  if (opts.tip) { rememberTip(text); return; }
  const badge = promptKey(text);
  if (badge) { rememberTip(text); return; }          // "F to ..." prompts are replaced by the shine and label
  if (opts.key) {                                 // same message still showing: keep it, don't restart it
    const o = state.texts.find(o => o.key === opts.key && o.text === text);
    if (o) { o.x = x; o.y = y; o.life = Math.max(o.life, o.t + (opts.life || 3.2) * 0.5); return; }
  }
  const t = { text, x, y, t: 0, life: opts.life || 3.2, key: opts.key || null, follow: x == null, size: opts.size || 1, color: opts.color || '#fdf6e3', badge, hint: !opts.color && !SPEECH.has(opts.key) && !badge };
  if (t.key) state.texts = state.texts.filter(o => o.key !== t.key);
  if (t.follow) state.texts = state.texts.filter(o => !o.follow);
  // the same words from somewhere else just refresh; too many at once drops the oldest non-reading one
  const dup = state.texts.find(o => o.text === text);
  if (dup) { dup.life = Math.max(dup.life, dup.t + t.life); return; }
  state.texts.push(t);
  while (state.texts.length > 6) state.texts.splice(state.texts.findIndex(o => o.text.length <= 110), 1);
}
function sayHero(text, opts) { say(text, null, null, opts); }
function unsay(key) { state.texts = state.texts.filter(o => o.key !== key); }
function showTitle(text, sub, style = 'area', life = 3) {
  const t = { text, sub, style, t: 0, life, at: state.time };
  if (speakingNow()) { (state.titleQ = state.titleQ || []).push(t); return; }   // wait until nobody is talking
  state.title = t;
}
