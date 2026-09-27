
// =====================================================================
// Setting up camp: the game opens with nothing built. Gather sticks, stones and grass, combine them
// (two things at first, then three), and set the pieces down on the marks: fire ring, workbench, tent.
// =====================================================================
// stones from the riverbank, sticks from the forest, and rabbit fluff from the windy fields to the south
const RAW = { stick: 'Stick', stone: 'River stone', fluff: 'Rabbit fluff', glue: 'Rabbit glue', firering: 'Fire ring', benchkit: 'Workbench' };
const RECIPES = [
  { out: 'glue', in: ['fluff', 'fluff'], line: 'Pip\'s patented rabbit glue. Don\'t ask how.' },
  { out: 'firering', in: ['stone', 'stone', 'stick'], line: 'river stones in a ring, kindling in the middle', piece: 'fire' },
  { out: 'benchkit', in: ['stick', 'stick', 'glue'], line: 'sticks, stuck together. Mostly.', piece: 'bench' },
];
const PIECE_OF = { fire: 'firering', bench: 'benchkit' };
const campBuilt = p => !!rtFor('camp').flags['built_' + p];
const campDone = () => ['fire', 'tent', 'bench'].every(campBuilt);
function rawOf() { const inv = state.inv; return inv.raw || (inv.raw = {}); }
function matAvailable(k) { return (rawOf()[k] || 0) - (state.mat || []).filter(m => m === k).length; }
function matMatch() {
  const m = (state.mat || []).slice().sort().join('+');
  return RECIPES.find(r => r.in.length <= (state.inv.craftSlots || 2) && r.in.slice().sort().join('+') === m) || null;
}
function craftNow() {
  const r = matMatch(), inv = state.inv, raw = rawOf();
  if (!r) { state.mat = []; sfx.tock(); return; }
  for (const k of r.in) raw[k]--;
  raw[r.out] = (raw[r.out] || 0) + 1;
  const first = !(inv.known || {})[r.out];
  (inv.known = inv.known || {})[r.out] = true;
  state.mat = [];
  sfx.forge(); state.menu && (state.menu.note = `Made: ${RAW[r.out]}${first ? ' (new!)' : ''}`);
  if ((inv.craftSlots || 2) < 3) { inv.craftSlots = 3; state.menu && (state.menu.note += '. Now you can combine three things.'); }
}
// the Craft tab: the mat, what it makes, and the things you can put on it
function craftCells() {
  const r = matMatch(), cells = [{ icon: r ? r.out : 'mat', name: r ? `Combine: ${RAW[r.out]}` : (state.mat || []).length ? 'Clear the mat' : 'The mat', line: r ? r.line : (state.mat || []).length ? 'that doesn\'t make anything yet' : 'pick things below to put them on the mat', mat: true }];
  for (const k of Object.keys(RAW)) if ((rawOf()[k] || 0) > 0) cells.push({ icon: k, name: RAW[k], count: matAvailable(k), line: RECIPES.find(x => x.out === k && x.piece) ? 'set it down on its mark at camp' : 'tap to put it on the mat', raw: k });
  return cells;
}
function craftCellAct(c) {
  if (!c) return;
  if (c.mat) { craftNow(); return; }
  if (RECIPES.find(x => x.out === c.raw && x.piece)) { state.menu.note = 'Set it down on its mark at camp.'; return; }
  const slots = state.inv.craftSlots || 2;
  if ((state.mat || []).length >= slots) { state.menu.note = 'The mat is full. Combine or clear it.'; return; }
  if (matAvailable(c.raw) <= 0) return;
  (state.mat = state.mat || []).push(c.raw); sfx.tock();
}
function drawCraftMat(px, y, pwide, fs) {
  const slots = state.inv.craftSlots || 2, s = Math.max(48, Math.min(64, UNIT * 1.5)), gap = 12, r = matMatch();
  const total = slots * (s + gap) + fs * 2 + s, x0 = (W - total) / 2;
  ctx.textAlign = 'center';
  for (let i = 0; i < slots; i++) {
    const x = x0 + i * (s + gap), k = (state.mat || [])[i];
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = 'rgba(255,227,138,.45)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeRect(x, y, s, s); ctx.setLineDash([]);
    if (k) drawItemIcon(k, x + s / 2, y + s / 2, s * 0.62);
    if (i < slots - 1) { ctx.fillStyle = '#d8d0c0'; ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.fillText('+', x + s + gap / 2, y + s / 2 + fs * 0.35); }
  }
  const ex = x0 + slots * (s + gap);
  ctx.fillStyle = '#d8d0c0'; ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.fillText('=', ex + fs * 0.6, y + s / 2 + fs * 0.35);
  const rx = ex + fs * 1.6;
  ctx.fillStyle = r ? 'rgba(242,201,76,.25)' : 'rgba(255,255,255,.04)'; ctx.fillRect(rx, y, s, s);
  ctx.strokeStyle = r ? '#ffe38a' : 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.strokeRect(rx, y, s, s);
  if (r) drawItemIcon(r.out, rx + s / 2, y + s / 2, s * 0.62); else { ctx.fillStyle = 'rgba(253,246,227,.35)'; ctx.fillText('?', rx + s / 2, y + s / 2 + fs * 0.35); }
  // recipes you've made, as little sums
  const known = RECIPES.filter(x => (state.inv.known || {})[x.out]);
  let kx = px, ky = y + s + fs * 1.2; const ks = fs * 1.3;
  ctx.textAlign = 'left'; ctx.font = `${Math.round(fs * 0.7)}px "Courier New", monospace`;
  for (const k of known) {
    let x = kx;
    k.in.forEach((it, j) => { drawItemIcon(it, x + ks / 2, ky, ks * 0.8); x += ks; if (j < k.in.length - 1) { ctx.fillStyle = '#b0a898'; ctx.fillText('+', x, ky + 4); x += fs * 0.6; } });
    ctx.fillStyle = '#b0a898'; ctx.fillText('=', x + 2, ky + 4); x += fs * 0.8; drawItemIcon(k.out, x + ks / 2, ky, ks * 0.8); x += ks + fs;
    kx = x; if (kx > px + pwide - ks * 5) { kx = px; ky += ks * 1.1; }
  }
  if (state.menu && state.menu.note) { ctx.textAlign = 'center'; ctx.fillStyle = '#b8f28a'; ctx.font = `${Math.round(fs * 0.85)}px "Courier New", monospace`; ctx.fillText(state.menu.note, W / 2, y - fs * 0.5); }
  ctx.textAlign = 'center';
  return ky + ks * 0.8 - y;                            // height used
}
// camp marks: a dashed outline where each piece goes, until it's built
function drawBuildSpots(sc) {
  for (const b of sc.feat.buildSpots || []) {
    if (campBuilt(b.piece)) continue;
    const x = b.fx * W, y = b.fy * H, u = UNIT, r = b.r * u;
    ctx.strokeStyle = `rgba(255,240,200,${0.45 + 0.2 * Math.sin(state.time * 3)})`; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.35; drawItemIcon(PIECE_OF[b.piece], x, y - u * 0.1, u * 0.9); ctx.globalAlpha = 1;
  }
}
function placePiece(b) {
  const raw = rawOf(), k = PIECE_OF[b.piece], rt = rtFor('camp');
  raw[k]--; rt.flags['built_' + b.piece] = true;
  refreshSceneGeometry(); sfx.forge(); sfx.pickup(); zoomPulse(b.fx * W, b.fy * H, 'pickup'); spark(b.fx * W, b.fy * H, '#ffe38a', 14, 3);
  if (b.piece === 'fire') state.fireLit = 1;
}
// icons for the raw stuff and what it becomes
function drawRawIcon(type, s) {
  switch (type) {
    case 'stick': ctx.save(); ctx.rotate(-0.6); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-s * 0.42, -s * 0.05, s * 0.84, s * 0.1); ctx.fillRect(s * 0.1, -s * 0.05, s * 0.18, -s * 0.1); ctx.restore(); return true;
    case 'stone': ctx.fillStyle = '#9a948a'; ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.32, s * 0.24, 0.2, 0, 6.28); ctx.fill(); ctx.fillStyle = '#b8b2a6'; ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.03, s * 0.12, s * 0.07, 0.2, 0, 6.28); ctx.fill(); return true;
    case 'fluff': ctx.fillStyle = '#f2ece0'; for (const [ox, oy, r] of [[-0.12, 0.02, 0.2], [0.1, -0.04, 0.22], [0, 0.1, 0.18], [0.02, -0.14, 0.14]]) { ctx.beginPath(); ctx.arc(ox * s, oy * s, r * s, 0, 6.28); ctx.fill(); } ctx.fillStyle = 'rgba(180,160,140,.4)'; ctx.beginPath(); ctx.arc(0.05 * s, 0.05 * s, 0.08 * s, 0, 6.28); ctx.fill(); return true;
    case 'glue': ctx.fillStyle = '#d9c9a0'; ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.3, s * 0.26, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#f2ece0'; for (const [ox, oy] of [[-0.2, -0.12], [0.18, -0.16], [0.24, 0.12]]) { ctx.beginPath(); ctx.arc(ox * s, oy * s, s * 0.08, 0, 6.28); ctx.fill(); } ctx.strokeStyle = 'rgba(140,110,70,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-s * 0.1, s * 0.25); ctx.quadraticCurveTo(-s * 0.08, s * 0.4, -s * 0.12, s * 0.45); ctx.stroke(); return true;
    case 'fiber': ctx.strokeStyle = '#8fae4a'; ctx.lineWidth = Math.max(1.5, s * 0.06); for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.05, s * 0.35); ctx.quadraticCurveTo(i * s * 0.12, 0, i * s * 0.2, -s * 0.38); ctx.stroke(); } return true;
    case 'cloth': ctx.fillStyle = '#b05a4a'; ctx.fillRect(-s * 0.34, -s * 0.28, s * 0.68, s * 0.56); ctx.strokeStyle = '#e0c090'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.34, i * s * 0.16); ctx.lineTo(s * 0.34, i * s * 0.16); ctx.stroke(); } return true;
    case 'cord': ctx.strokeStyle = '#c9b070'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.beginPath(); for (let a = 0; a < 12; a += 0.3) ctx.lineTo(Math.cos(a) * s * (0.1 + a * 0.02), Math.sin(a) * s * (0.1 + a * 0.02)); ctx.stroke(); return true;
    case 'stake': ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.moveTo(-s * 0.06, -s * 0.4); ctx.lineTo(s * 0.06, -s * 0.4); ctx.lineTo(s * 0.06, s * 0.2); ctx.lineTo(0, s * 0.42); ctx.lineTo(-s * 0.06, s * 0.2); ctx.fill(); return true;
    case 'firering': for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.2, s * 0.1, s * 0.08, 0, 0, 6.28); ctx.fill(); } ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-s * 0.15, -s * 0.03, s * 0.3, s * 0.06); return true;
    case 'benchkit': ctx.fillStyle = '#7a5a34'; ctx.fillRect(-s * 0.4, -s * 0.12, s * 0.8, s * 0.14); ctx.fillRect(-s * 0.32, 0, s * 0.08, s * 0.3); ctx.fillRect(s * 0.24, 0, s * 0.08, s * 0.3); return true;
    case 'tentkit': ctx.fillStyle = '#b05a4a'; ctx.beginPath(); ctx.moveTo(0, -s * 0.38); ctx.lineTo(s * 0.4, s * 0.3); ctx.lineTo(-s * 0.4, s * 0.3); ctx.fill(); ctx.fillStyle = '#3a2616'; ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.lineTo(s * 0.12, s * 0.3); ctx.lineTo(-s * 0.12, s * 0.3); ctx.fill(); return true;
    case 'mat': ctx.strokeStyle = 'rgba(255,227,138,.7)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.strokeRect(-s * 0.35, -s * 0.3, s * 0.7, s * 0.6); ctx.setLineDash([]); return true;
  }
  return false;
}

// ---------------- the story's first steps: jetty, garden, the camp spot ----------------
const STORY = { garden: 1, tocamp: 2, gather: 3, adventure: 4 };
const storyAt = k => (state.inv.story || 0) >= STORY[k];
// the old fishing jetty on this side of the river, where it all starts: short, weathered, a board missing
function placeOldJetty(sc) {
  const r = sc.river, half = r.w * UNIT / 2, R = [W * 0.6, H * 0.52];
  let best = null;
  for (let i = 0; i < r.pts.length - 1; i++) {
    const ax = r.pts[i][0] * W, ay = r.pts[i][1] * H, bx = r.pts[i + 1][0] * W, by = r.pts[i + 1][1] * H, vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((R[0] - ax) * vx + (R[1] - ay) * vy) / (vx * vx + vy * vy))), qx = ax + vx * t, qy = ay + vy * t, d = Math.hypot(R[0] - qx, R[1] - qy);
    if (!best || d < best.d) best = { d, qx, qy };
  }
  const nx = (R[0] - best.qx) / best.d, ny = (R[1] - best.qy) / best.d;
  sc.feat.oldJetty = [(best.qx + nx * (half + UNIT * 0.4)) / W, (best.qy + ny * (half + UNIT * 0.4)) / H, -nx, -ny];
}
function drawOldJetty(sc) {
  const [fx, fy, dx, dy] = sc.feat.oldJetty, x = fx * W, y = fy * H, u = UNIT, len = u * 1.6, wid = u * 0.8;
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, -wid / 2 + 3, len, wid);
  for (let i = 0; i < 6; i++) { if (i === 4) continue; ctx.fillStyle = i % 2 ? '#7d6547' : '#8a7152'; ctx.fillRect(i * len / 6, -wid / 2 + Math.sin(i * 7) * 2, len / 6 - 2, wid); }
  ctx.fillStyle = '#4a3a28'; for (const px of [u * 0.1, len - u * 0.1]) for (const py of [-wid / 2 - 2, wid / 2 - 4]) ctx.fillRect(px - 3, py, 6, 6);
  ctx.restore();
}
// the lean-to, from the inside: a leaning wall of mismatched sticks and a blanket, daylight through every crack
function drawTentRoom() {
  const u = UNIT, t = state.time, j = k => Math.sin(k * 12.9898) * 0.5;
  ctx.fillStyle = '#5e4a32'; ctx.fillRect(0, 0, W, H);                                                   // packed dirt floor
  for (let k = 0; k < 40; k++) { ctx.fillStyle = 'rgba(40,28,16,.25)'; ctx.beginPath(); ctx.ellipse(((k * 0.618) % 1) * W, ((k * 0.377) % 1) * H, u * 0.25, u * 0.1, k, 0, 6.28); ctx.fill(); }
  const top = H * 0.3;                                                                                    // the slanted wall overhead: sticks of every length, a few crooked
  for (let k = 0; k < 26; k++) {
    const x = (k + 0.5) / 26 * W, w = W / 26 - 3 + j(k) * 5, len = top + j(k + 3) * u * 0.6;
    ctx.save(); ctx.translate(x, 0); ctx.rotate(j(k + 7) * 0.06);
    ctx.fillStyle = k % 5 === 2 ? '#8a6a44' : k % 3 ? '#6b4e30' : '#765838'; ctx.fillRect(-w / 2, -4, w, len + 4);
    ctx.restore();
  }
  ctx.fillStyle = '#b05a4a'; ctx.beginPath(); ctx.moveTo(W * 0.55, 0); ctx.lineTo(W * 0.92, 0); ctx.lineTo(W * 0.88, top * 0.8); ctx.lineTo(W * 0.6, top * 0.95); ctx.fill();   // Pip's old blanket, flung over one end
  ctx.strokeStyle = '#e0c090'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.57, top * 0.3); ctx.lineTo(W * 0.9, top * 0.25); ctx.moveTo(W * 0.58, top * 0.6); ctx.lineTo(W * 0.89, top * 0.55); ctx.stroke();
  ctx.fillStyle = '#4e3a24'; ctx.fillRect(0, top - u * 0.15, W, u * 0.3);                                // the crossbar it all leans on
  ctx.strokeStyle = '#c9b070'; ctx.lineWidth = 2; for (let k = 1; k < 6; k++) { const x = W * k / 6; ctx.beginPath(); ctx.moveTo(x - 6, top - u * 0.15); ctx.lineTo(x + 6, top + u * 0.15); ctx.moveTo(x + 6, top - u * 0.15); ctx.lineTo(x - 6, top + u * 0.15); ctx.stroke(); }   // lashings
  for (let k = 0; k < 7; k++) {                                                                           // light through the cracks, falling across the floor
    const x = W * (0.08 + k * 0.13 + j(k + 11) * 0.03);
    if (x > W * 0.55 && x < W * 0.92) continue;                                                             // not through the blanket
    const a = 0.1 + 0.06 * Math.sin(t * 0.7 + k), wdt = u * (0.12 + 0.1 * (k % 2));
    const g = ctx.createLinearGradient(0, top, 0, H * 0.95); g.addColorStop(0, `rgba(255,236,180,${a + 0.08})`); g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + wdt, top); ctx.lineTo(x + wdt + u * 1.6, H * 0.95); ctx.lineTo(x + u * 1.2, H * 0.95); ctx.fill();
    ctx.fillStyle = `rgba(255,240,190,${a + 0.12})`; ctx.fillRect(x, top - u * 0.2, wdt, u * 0.2);      // the bright gap itself
    for (let m = 0; m < 3; m++) { const p = ((t * 0.05 + m * 0.33 + k * 0.1) % 1), dx = x + wdt * 0.5 + p * u * 1.4, dy = top + p * (H * 0.6); ctx.fillStyle = 'rgba(255,245,210,.5)'; ctx.fillRect(dx + Math.sin(t + m) * 3, dy, 2, 2); }   // dust drifting in the beam
  }
  ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.fillRect(W * 0.38, H - u * 1.1, W * 0.24, u * 1.1);        // the open side, where you crawled in
  if (state.dusk) drawLamps();
}
// twilight: the room dims to blue, and small flames warm it: two candles on the crate, an oil lamp on the crossbar
function drawLamps() {
  const u = UNIT, t = state.time;
  ctx.fillStyle = 'rgba(20,24,60,.45)'; ctx.fillRect(0, 0, W, H);
  const flames = [[W * 0.46, H * 0.25], [W * 0.54, H * 0.25], [W * 0.78, H * 0.3 + u * 0.4], [W * 0.22, H * 0.62]];
  flames.forEach(([x, y], i) => {
    const f = 0.85 + 0.15 * Math.sin(t * (9 + i) + i * 2) + 0.05 * Math.sin(t * 23 + i);
    const g = ctx.createRadialGradient(x, y, 0, x, y, u * (i === 2 ? 4.5 : 3) * f);
    g.addColorStop(0, 'rgba(255,190,110,.35)'); g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, u * 4.5, 0, 6.28); ctx.fill();
    if (i === 2) {                                    // the oil lamp: a little glass body on a wire
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, H * 0.3 - u * 0.15); ctx.lineTo(x, y - u * 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,220,160,.5)'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.2, u * 0.26, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - u * 0.2, y + u * 0.2, u * 0.4, u * 0.1);
    } else if (i < 2) { ctx.fillStyle = '#f2ead8'; ctx.fillRect(x - u * 0.05, y, u * 0.1, u * 0.28); }   // candles
    else { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - u * 0.06, y, u * 0.12, u * 0.22); }
    ctx.fillStyle = `rgba(255,${200 + 30 * f},${110 + 40 * f},.95)`; ctx.beginPath(); ctx.ellipse(x, y - u * 0.05, u * 0.05, u * 0.11 * f, 0, 0, 6.28); ctx.fill();
  });
}

// ---------------- the quest log ----------------
// Each quest is a short chain of steps. A step is done the first time its test passes (after the step before it),
// and that moment goes into inv.qlog. The Quests tab shows what's current, newest quest first, and a folded log
// underneath, newest first. Story beats elsewhere stay the source of truth; this only watches them.
const plantedIn = id => ((rtFor(id).flags.plots) || []).filter(p => p.s === 1).length;
function campHave() {                                    // raw counted with what's already crafted or built into it
  const raw = rawOf(), inv = state.inv, known = inv.known || {};
  const ring = campBuilt('fire') || (raw.firering || 0) > 0, bench = campBuilt('bench') || (raw.benchkit || 0) > 0;
  const glue = bench || (raw.glue || 0) > 0 || !!known.glue;
  return { stone: (raw.stone || 0) + (ring ? 2 : 0), stick: (raw.stick || 0) + (ring ? 1 : 0) + (bench ? 2 : 0), fluff: (raw.fluff || 0) + (glue ? 2 : 0) };
}
const QUESTS = [
  { id: 'garden', name: 'Pip\'s garden', icon: 'seed', start: () => storyAt('garden'), steps: [
    { id: 'seeds', name: 'Gather seeds', line: () => 'Run at the robin in the meadow. It drops a seed.', done: () => (state.inv.bag.seed || 0) > 0 || plantedIn('meadow') > 0 || storyAt('tocamp') },
    { id: 'plant', name: 'Plant seeds', line: () => `Stand on Pip's rich soil and press ${seedKeyLabel()}. ${Math.min(2, plantedIn('meadow'))} of 2 planted.`, done: () => storyAt('tocamp') },
    { id: 'later', name: 'Come back later', line: () => 'They grow while you are out. Come back to the meadow and harvest.', done: () => (state.inv.harvests || 0) > 0 || Object.keys(state.inv.cropXp || {}).length > 0 },
  ] },
  { id: 'camp', name: 'Set up camp', icon: 'firering', start: () => storyAt('tocamp'), steps: [
    { id: 'follow', name: 'Follow Pip to the camp spot', line: () => 'North of the glade. Pip knows the way.', done: () => storyAt('gather') },
    { id: 'gather', name: 'Gather for the camp', line: () => { const c = campHave(); return `River stones ${Math.min(2, c.stone)}/2, sticks ${Math.min(3, c.stick)}/3, rabbit fluff ${Math.min(2, c.fluff)}/2.`; }, done: () => { const c = campHave(); return c.stone >= 2 && c.stick >= 3 && c.fluff >= 2; } },
    { id: 'fire', name: 'Build the fire ring', line: () => 'Craft it on the mat (pack, Craft tab), then set it on the marks at camp.', done: () => campBuilt('fire') },
    { id: 'bench', name: 'Build the bench', line: () => 'Two sticks and rabbit glue. Set it on the marks at camp.', done: () => campBuilt('bench') },
  ] },
  { id: 'pip', name: 'Find Pip', icon: 'heart', start: () => state.inv.pipTaken || state.inv.pipSaved, steps: [
    { id: 'rescue', name: 'Find Pip', line: () => 'The gremlins took Pip down a hole in the woods.', done: () => state.inv.pipSaved },
  ] },
  { id: 'beans', name: 'The toad\'s beans', icon: 'bean', start: () => rtFor('m2').flags.metToad || state.inv.beans || state.inv.fire, steps: [
    { id: 'beans', name: 'Bring the toad beans', line: () => `${state.inv.beans || 0} of ${BEANS} beans.`, done: () => !!state.inv.fire },
  ] },
  { id: 'journal', name: 'The stolen journal', icon: 'journal', start: () => state.inv.journal, steps: [
    { id: 'pages', name: 'Get the journal back', line: () => `Pages: ${state.inv.pages}. The thief runs toward the woods.`, done: () => state.inv.journal >= 3 },
  ] },
  { id: 'raft', name: 'Downriver', icon: 'driftwood', start: () => state.inv.raft, steps: [
    { id: 'build', name: 'Build a raft', line: () => `Driftwood ${state.inv.mats.driftwood}/4, thorns ${state.inv.mats.thorn}/2.`, done: () => state.inv.raft >= 2 },
    { id: 'ride', name: 'Ride it downriver', line: () => 'The raft waits at the jetty.', done: () => state.inv.raft >= 3 },
  ] },
  { id: 'shrooms', name: 'Traveler\'s mushrooms', icon: 'spores', start: () => state.inv.pipSaved || Object.keys(state.inv.shrooms).length > 0, steps: [
    { id: 'all', name: 'Find the traveler\'s mushrooms', line: () => `${Object.keys(state.inv.shrooms).length} of 6 found.`, done: () => Object.keys(state.inv.shrooms).length >= 6 },
  ] },
];
const QUEST_COLOR = '#ffe38a';
function questState(q) { const qs = state.inv.quests || (state.inv.quests = {}); return qs[q.id] || null; }
// runs a few times a second; quiet right after a load or a new game, so an old save's progress is filed without fanfare
function updateQuests(force) {
  if (ARENA || PUZZLE || !state.inv) return;
  if (!force && state.time - (state.questT || -9) < 0.25) return;
  state.questT = state.time;
  const inv = state.inv, qs = inv.quests || (inv.quests = {}), log = inv.qlog || (inv.qlog = []), quiet = !!state.questQuiet;
  state.questQuiet = false;
  const t = quiet && !log.length ? null : Math.floor(state.playTime || 0);
  for (const q of QUESTS) {
    let s = qs[q.id];
    if (!s) { if (!q.start()) continue; s = qs[q.id] = { at: t, step: 0 }; if (!quiet) showTitle('New quest', q.name, 'area', 2.6); }
    while (s.step < q.steps.length && q.steps[s.step].done()) {
      log.push({ q: q.id, s: q.steps[s.step].id, t });
      s.step++;
      if (s.step >= q.steps.length) { s.done = t; if (!quiet) { showTitle('Quest complete', q.name, 'area', 2.6); sfx.heart(); } }
    }
  }
}
// what the tab shows: current objectives (newest quest first) and the log (newest first)
function questView() {
  updateQuests(true);
  const inv = state.inv, qs = inv.quests || {}, cur = [];
  for (const q of QUESTS) { const s = qs[q.id]; if (s && s.step < q.steps.length) cur.push({ q, s, step: q.steps[s.step] }); }
  cur.sort((a, b) => (b.s.at ?? -1) - (a.s.at ?? -1) || QUESTS.indexOf(b.q) - QUESTS.indexOf(a.q));
  const log = (inv.qlog || []).map((e, i) => { const q = QUESTS.find(x => x.id === e.q), st = q && q.steps.find(x => x.id === e.s); return q && st ? { q, st, t: e.t, i, last: st === q.steps[q.steps.length - 1] } : null; }).filter(Boolean).reverse();
  return { cur, log };
}
const clock = t => t == null ? '' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
