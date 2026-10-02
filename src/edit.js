// ===== edit.js: the layout editor (build 215): ?edit=<scene> on a plates screen (one with a layout: LAYOUTS[id],
// src/layouts/<id>.js). On the main game's code: the scene is entered as a test link and the world stands still (the
// hero parked where he stood, drawn faint) while you lay plates, pits and seams; what you lay is relaid at once
// (plateLayout reads the editor's copy), so collision and the drawing are the one shape as in play. Keys:
// - arrows pan, the wheel zooms about the cursor (Ross: a scroll never edits by accident); drag on open ground pans
// - click selects (a pit inside a plate before the plate, a seam by its line), drag moves it (a plate takes the ones
//   stacked on it along); click on open ground clears the selection
// - L W D A B E pick what [ ] change on the selected thing: length (x), width (y), depth (a plate's thickness), all
//   three together (the whole plate scaled, Ross's lwd), base (a plate then stands on nothing; a pit: its floor), ledge
//   (a pit's); [ ] smaller and bigger; a seam only has its width. R turns it; U copies it up the stack (shifted along
//   the stack's lean, a little smaller, a little thinner; a pit a tile over); Delete removes (the plates on a removed
//   one stand on what it stood on)
// - N a new plate under the cursor (on the plate there, if any), P a pit there, C starts a crack and clicks lay its
//   points (C again ends it), T drops the hero at the cursor to try it (the game runs: T again parks him there)
// - S saves: copies the layout as the file src/layouts/<scene>.js (the save is pasting it over that file); O opens one
//   pasted. The help panel at the bottom shows the selected thing's numbers and which dimension [ ] change.
// Every plate shows its thickness, coloured by kind (step green, hop yellow, high hop orange, face red); the selected
// one its base too, with a dashed outline. tests/edit.js drives it through editDown/editMove/editUp/editWheel.
var EDIT_SCENE = typeof location !== 'undefined' ? ((/[?&]edit=([a-z0-9]+)/.exec(location.search) || [])[1] || null) : null;
const ED_KIND = { step: '#8fd18f', hop: '#f0d060', high: '#f0a040', face: '#f06060' }, ED_LEAN = [0.5, -0.3];
const ED_DIMS = { l: 'length', w: 'width', d: 'depth', a: 'all three', b: 'base', e: 'ledge' };                     // what [ ] change, by its key
const editM = () => state.edit && MTN[state.edit.id];
const editCopy = L => JSON.parse(JSON.stringify(L));
function startEdit(id) {
  const m = MTN[id]; startTestScene(id, m && m.inX != null ? m.inX / m.len : undefined, m && m.inX != null ? m.pathY(m.inX) / m.D : undefined);   // parked at the way in
  const h = state.hero;
  if (!m || !m.plates) { showScroll('Not a plates screen', `${id} has no layout to edit.`); return; }
  state.edit = { id, layout: editCopy(LAYOUTS[id] || { plates: [], pits: [], seams: [] }), zoom: 1, cx: h.x / UNIT, cy: h.y / UNIT, sel: null, dim: 'd', cur: [h.x / UNIT, h.y / UNIT], down: null, crack: null, trying: false, msg: '' };
  editRelay(); mtnCamera(0, state.mtn, true);
  showScroll('The editor', 'Arrows pan, the wheel zooms. Click selects, drag moves. The keys are on the panel at the bottom.');
}
// relay the plates from the editor's copy: collision, drawing and the labels all read the one lay
function editRelay() { const m = editM(); if (!m) return; m.pl = null; platesLay(m); const h = state.hero; h.liftAt = null; }
const editSel = () => { const E = state.edit; return E && E.sel ? E.sel : null; };
// the screen to the base plate's ground, in tiles (the projection run backwards; the ground's height found by iteration)
function editTile(X, Y) {
  const c = state.mtn, m = c.m, s = mtnZoom(c.p, m), th = m.tilt * c.p; let z = c.ch, x = c.cx, y = c.cy;
  for (let i = 0; i < 4; i++) { const k = mtnPush(z, c) * UNIT * s; x = c.cx + (X - SW / 2) / k; y = c.cy + ((Y - SH / 2) / k + (z - c.ch) * Math.sin(th)) / Math.cos(th); z = mtnH(m, x, y); }
  return [x, y];
}
const editPr = () => { const c = state.mtn, m = c.m; return (x, y, z) => mtnProj(x, y, mtnH(m, x, y) + z, c); };
// what is under a point on the screen: a pit (inside its ring at its top), else the highest plate whose top holds it,
// else a seam within half a tile of its line. Returns { kind, i } into the layout, or null
function editPick(X, Y) {
  const E = state.edit, m = editM(), pl = platesLay(m), pr = editPr(), L = E.layout;
  for (let i = 0; i < pl.pits.length; i++) { const q = pl.pits[i]; if (plateIn(q.P.map(([x, y]) => pr(x, y, q.top)), X, Y)) return { kind: 'pit', i }; }
  let best = null; pl.list.forEach((p, i) => { if (plateIn(p.P.map(([x, y]) => pr(x, y, plateTop(p))), X, Y) && (!best || plateTop(p) > plateTop(pl.list[best.i]))) best = { kind: 'plate', i }; });
  if (best) return best;
  const us = UNIT * mtnZoom(state.mtn.p, m);
  for (let i = 0; i < L.seams.length; i++) { const C = L.seams[i].spine.map(([x, y]) => pr(x, y, 0)); for (let k = 1; k < C.length; k++) { const [ax, ay] = C[k - 1], [bx, by] = C[k], dx = bx - ax, dy = by - ay, t = mtnClamp(((X - ax) * dx + (Y - ay) * dy) / (dx * dx + dy * dy || 1e-9)); if (Math.hypot(X - ax - dx * t, Y - ay - dy * t) < us * 0.3) return { kind: 'seam', i }; } }
  return null;
}
const editObj = sel => { const L = state.edit.layout; return sel ? (sel.kind === 'plate' ? L.plates : sel.kind === 'pit' ? L.pits : L.seams)[sel.i] : null; };
const editOn = i => state.edit.layout.plates.map((p, k) => p.under === i ? k : -1).filter(k => k >= 0);   // the plates standing straight on plate i
// move a plate and every plate stacked on it (a pit, a seam: just itself)
function editShift(sel, dx, dy) {
  const o = editObj(sel); if (!o) return;
  if (sel.kind === 'seam') { for (const q of o.spine) { q[0] += dx; q[1] += dy; } return; }
  o.x += dx; o.y += dy; if (sel.kind === 'plate') for (const k of editOn(sel.i)) editShift({ kind: 'plate', i: k }, dx, dy);
}
// a plate's base is the top of the one it stands on (the chain settled after any change of thickness or base)
function editBases() { const P = state.edit.layout.plates; for (let r = 0; r < 8; r++) for (const p of P) if (p.under >= 0 && P[p.under]) p.base = +(P[p.under].base + P[p.under].thick).toFixed(3); }
function editRemove(sel) {
  const L = state.edit.layout;
  if (sel.kind === 'plate') { const gone = L.plates[sel.i]; for (const k of editOn(sel.i)) L.plates[k].under = gone.under; L.plates.splice(sel.i, 1); for (const p of L.plates) if (p.under > sel.i) p.under--; editBases(); }
  else (sel.kind === 'pit' ? L.pits : L.seams).splice(sel.i, 1);
  state.edit.sel = null;
}
const editSeed = () => +(Math.max(0, ...state.edit.layout.plates.map(p => p.seed), ...state.edit.layout.pits.map(q => q.seed)) + 7).toFixed(2);
// the mouse (edit.js listens on the canvas; the test calls these): a press, a move with it held, its release, the wheel
function editDown(X, Y) { const E = state.edit; if (!E || E.trying || state.menu) return; E.down = { X, Y, x: X, y: Y, moved: false, pick: E.crack ? null : editPick(X, Y) }; }
function editMove(X, Y) {
  const E = state.edit; if (!E) return; E.cur = editTile(X, Y); const d = E.down; if (!d || E.trying) return;
  if (!d.moved && Math.hypot(X - d.X, Y - d.Y) < 3) return; d.moved = true;
  const c = state.mtn, m = c.m, s = mtnZoom(c.p, m), th = m.tilt * c.p;
  if (d.pick) { const o = editObj(d.pick), z = d.pick.kind === 'plate' ? o.base + o.thick : d.pick.kind === 'pit' ? platesLay(m).pits[d.pick.i].top : 0, [ox, oy] = d.pick.kind === 'seam' ? o.spine[0] : [o.x, o.y], k = mtnPush(mtnH(m, ox, oy) + z, c) * UNIT * s;   // dragged at its own height on the screen
    editShift(d.pick, (X - d.x) / k, (Y - d.y) / (k * Math.cos(th))); E.sel = d.pick; editRelay(); }
  else { const k = UNIT * s; E.cx -= (X - d.x) / k; E.cy -= (Y - d.y) / (k * Math.cos(th)); mtnCamera(0, c, true); }   // open ground: pan
  d.x = X; d.y = Y;
}
function editUp(X, Y) {
  const E = state.edit; if (!E || E.trying) return; const d = E.down; E.down = null; if (!d) return;
  if (d.moved) { if (d.pick) editRound(d.pick); return; }                                                 // a drag done: what moved settles on a hundredth of a tile
  const [x, y] = editTile(X, Y);
  if (E.crack) { E.crack.spine.push([+x.toFixed(3), +y.toFixed(3), E.crack.hw]); return; }                   // a click lays the crack's next point
  E.sel = d.pick;
}
const editRound = sel => { const o = editObj(sel); if (o && sel.kind !== 'seam') { o.x = +o.x.toFixed(2); o.y = +o.y.toFixed(2); editRelay(); } else if (o) { for (const q of o.spine) { q[0] = +q[0].toFixed(3); q[1] = +q[1].toFixed(3); } editRelay(); } };
function editWheel(dy, X, Y) {
  const E = state.edit; if (!E || E.trying) return; const c = state.mtn;
  const [bx, by] = editTile(X, Y); E.zoom = mtnClamp(E.zoom * (dy > 0 ? 1 / 1.12 : 1.12), 0.3, 4); mtnCamera(0, c, true);
  const [ax, ay] = editTile(X, Y); E.cx += bx - ax; E.cy += by - ay; mtnCamera(0, c, true);                    // about the cursor: the tile under it stays put
}
// the layout as its file, src/layouts/<id>.js (S copies it; the save is pasting it over that file)
function editText(L, id) {
  const n = v => +(+v).toFixed(3), line = o => JSON.stringify(o).replace(/"(\w+)":/g, '"$1": ').replace(/,/g, ', ');
  const plates = L.plates.map(p => '    ' + line({ x: n(p.x), y: n(p.y), w: n(p.w), h: n(p.h), seed: n(p.seed), base: n(p.base), thick: n(p.thick), tone: p.tone, rot: n(p.rot || 0), under: p.under >= 0 ? p.under : -1 }));
  const pits = L.pits.map(q => '    ' + line({ x: n(q.x), y: n(q.y), w: n(q.w), h: n(q.h), seed: n(q.seed), floor: n(q.floor), ledge: n(q.ledge) }));
  const seams = L.seams.map(s => '    { "spine": [' + s.spine.map(q => '[' + q.map(n).join(', ') + ']').join(', ') + '] }');
  const block = (name, rows) => `  "${name}": [\n${rows.join(',\n')}\n  ]`;
  return `// ===== layouts/${id}.js: ${id}'s plates, pits and seams, laid in the editor (?edit=${id}; S copies this file: paste it over\n// this one). plateLayout reads it at enterScene. A plate: its middle x, y and size w, h in tiles, its outline's seed and\n// turn (rot), base and thickness above the base plate, tone, and under (the index of the plate it stands on, or -1).\nLAYOUTS.${id} = {\n${[block('plates', plates), block('pits', pits), block('seams', seams)].join(',\n')}\n};\n`;
}
// a pasted layout: the file above, or its bare object
function editLoad(text) {
  const E = state.edit; let t = String(text || '').trim(); const i = t.indexOf('{'), j = t.lastIndexOf('}'); if (i < 0 || j < i) return false;
  try { const L = JSON.parse(t.slice(i, j + 1)); if (!Array.isArray(L.plates)) return false; E.layout = { plates: L.plates, pits: L.pits || [], seams: L.seams || [] }; E.sel = null; editBases(); editRelay(); return true; } catch (e) { return false; }
}
function editCopyOut() {
  const E = state.edit, text = editText(E.layout, E.id);
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { E.msg = 'copied: paste over src/layouts/' + E.id + '.js'; }, () => { E.msg = 'the clipboard refused; the layout is in the prompt'; if (typeof prompt === 'function') prompt('The layout', text); });
  else { E.msg = 'no clipboard here: the layout is in the prompt'; if (typeof prompt === 'function') prompt('The layout', text); }
}
// the keys, each frame; true while editing (the world stands still), false while trying it (the game runs)
function updateEdit(dt) {
  const E = state.edit; if (!E) return false; const h = state.hero, m = editM(), tap = k => { if (state.keys[k]) { state.keys[k] = false; return true; } return false; };
  if (tap('t')) {                                                                        // try it: the hero to the cursor and the game runs; again: parked where he is now
    if (E.trying) { if (state.scene === E.id) { E.trying = false; E.cx = h.x / UNIT; E.cy = h.y / UNIT; mtnCamera(0, state.mtn, true); } else E.msg = 'come back to ' + E.id + ' to edit'; }
    else { const [x, y] = E.cur; h.x = x * UNIT; h.y = y * UNIT; h.vx = h.vy = 0; h.z = 0; h.vz = 0; h.liftAt = null; h.plPrev = [h.x, h.y]; E.trying = true; E.zoom = 1; E.sel = null; E.crack = null; }
    return !E.trying; }
  if (E.trying) return false;
  const L = E.layout, sel = editSel(), o = editObj(sel), step = (k, v) => tap(k) ? v : 0;
  const pan = 14 * dt / E.zoom; if (state.keys.arrowleft) E.cx -= pan; if (state.keys.arrowright) E.cx += pan; if (state.keys.arrowup) E.cy -= pan; if (state.keys.arrowdown) E.cy += pan;
  const [cx, cy] = E.cur.map(v => +v.toFixed(2));
  if (tap('c')) { if (E.crack) { if (E.crack.spine.length >= 2) { L.seams.push({ spine: E.crack.spine }); E.sel = { kind: 'seam', i: L.seams.length - 1 }; } E.crack = null; editRelay(); } else { E.crack = { spine: [], hw: 0.08 }; E.sel = null; E.msg = 'click to lay the crack; C ends it'; } }
  else if (tap('n')) { const pl = platesLay(m); let under = -1, top = -1; pl.list.forEach((p, i) => { if (plateHas(p, cx, cy) && plateTop(p) > top) { top = plateTop(p); under = i; } }); L.plates.push({ x: cx, y: cy, w: 4, h: 2.6, seed: editSeed(), base: under >= 0 ? top : 0, thick: 0.4, tone: PL_TONE, rot: 0, under }); E.sel = { kind: 'plate', i: L.plates.length - 1 }; }
  else if (tap('p')) { L.pits.push({ x: cx, y: cy, w: 3.4, h: 3, seed: editSeed(), floor: 0, ledge: 0.55 }); E.sel = { kind: 'pit', i: L.pits.length - 1 }; }
  else if (tap('s')) editCopyOut();
  else if (tap('o')) { const t = typeof prompt === 'function' ? prompt('Paste a layout (the file, or its object)') : null; E.msg = t == null ? E.msg : editLoad(t) ? 'loaded' : 'that was not a layout'; }
  else if (Object.keys(ED_DIMS).some(k => tap(k) && (E.dim = k))) E.msg = '[ ] change ' + ED_DIMS[E.dim];
  else if (o && (tap('delete') || tap('backspace'))) editRemove(sel);
  else if (o && tap('u')) { if (sel.kind === 'plate') { L.plates.push({ ...plateNext(o, ED_LEAN, Math.max(0.2, +(o.thick * 0.9).toFixed(2))), under: sel.i }); E.sel = { kind: 'plate', i: L.plates.length - 1 }; } else if (sel.kind === 'pit') { L.pits.push({ ...o, x: o.x + 1, y: o.y + 1, seed: editSeed() }); E.sel = { kind: 'pit', i: L.pits.length - 1 }; } }
  else if (o && tap('r') && sel.kind !== 'seam') o.rot = +((o.rot || 0) + Math.PI / 12).toFixed(3);
  else if (o) {
    const dir = (tap(']') ? 1 : 0) - (tap('[') ? 1 : 0); if (!dir) return true; const k = E.dim, f = dir > 0 ? 1.1 : 1 / 1.1;   // [ ] on the picked dimension: a fifth of a tile across, a twentieth up, all three by a tenth
    if (sel.kind === 'seam') { for (const q of o.spine) q[2] = +mtnClamp(q[2] + dir * 0.02, 0.02, 0.24).toFixed(3); }
    else if (k === 'l') o.w = +Math.max(1, o.w + dir * 0.2).toFixed(2); else if (k === 'w') o.h = +Math.max(1, o.h + dir * 0.2).toFixed(2);
    else if (k === 'a') { o.w = +Math.max(1, o.w * f).toFixed(2); o.h = +Math.max(1, o.h * f).toFixed(2); if (sel.kind === 'plate') o.thick = +Math.max(0.05, o.thick * f).toFixed(2); }
    else if (sel.kind === 'plate') { if (k === 'd') o.thick = +Math.max(0.05, o.thick + dir * 0.05).toFixed(2); else if (k === 'b') { o.base = +Math.max(0, o.base + dir * 0.05).toFixed(2); o.under = -1; } else return true; }
    else { if (k === 'b') o.floor = +Math.max(0, o.floor + dir * 0.05).toFixed(2); else if (k === 'e') o.ledge = +Math.max(0, o.ledge + dir * 0.05).toFixed(2); else return true; }
  }
  else return true;
  editBases(); editRelay(); return true;
}
// the overlay: every plate's thickness in its kind's colour at its top's middle (the selected one's base too, and a
// dashed outline), each pit's floor and ledge, each seam's width, the crack being laid, the cursor, the help line
function drawEdit() {
  const E = state.edit, m = editM(); if (!E || !m || state.scene !== E.id) return;
  const pl = platesLay(m), pr = editPr(), sel = editSel(), s = mtnZoom(state.mtn.p, m), us = UNIT * s;
  const mid = R => { let x = 0, y = 0; for (const [X, Y] of R) { x += X / R.length; y += Y / R.length; } return [x, y]; };
  const label = (X, Y, text, col) => { ctx.font = `${Math.max(10, Math.min(16, 12 * s)).toFixed(0)}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(text).width + 8; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(X - w / 2, Y - 8, w, 16); ctx.fillStyle = col; ctx.fillText(text, X, Y); };
  const dashed = R => { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); plPath(R); ctx.stroke(); ctx.restore(); };
  if (!E.trying) {
    pl.list.forEach((p, i) => { const T = p.P.map(([x, y]) => pr(x, y, plateTop(p))), [X, Y] = mid(T), on = sel && sel.kind === 'plate' && sel.i === i; if (on) dashed(T); label(X, Y, on ? `${p.thick.toFixed(2)} on ${p.base.toFixed(2)}` : p.thick.toFixed(2), ED_KIND[p.kind]); });
    pl.pits.forEach((q, i) => { const R = q.P.map(([x, y]) => pr(x, y, q.top)), [X, Y] = mid(R), on = sel && sel.kind === 'pit' && sel.i === i; if (on) dashed(R); label(X, Y, `pit floor ${q.floor.toFixed(2)} ledge ${q.ledge.toFixed(2)}`, '#9fd8ff'); });
    pl.seams.forEach((sm, i) => { const C = sm.spine.map(([x, y]) => pr(x, y, 0)), on = sel && sel.kind === 'seam' && sel.i === i; if (on) { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); C.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); ctx.restore(); } const [X, Y] = C[Math.floor(C.length / 2)]; label(X, Y, `seam ${(Math.max(...sm.spine.map(q => q[2])) * 2).toFixed(2)}`, '#d0c8ff'); });
    if (E.crack) { const C = E.crack.spine.map(([x, y]) => pr(x, y, 0)).concat([pr(E.cur[0], E.cur[1], 0)]); ctx.save(); ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); C.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); ctx.restore(); }
    const [CX, CY] = pr(E.cur[0], E.cur[1], 0); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(CX - us * 0.3, CY); ctx.lineTo(CX + us * 0.3, CY); ctx.moveTo(CX, CY - us * 0.3); ctx.lineTo(CX, CY + us * 0.3); ctx.stroke();
  }
  // the panel: what is selected and its numbers, which dimension [ ] change, the keys
  const o = editObj(sel), n2 = v => (+v).toFixed(2), onS = sel && sel.kind === 'plate' && o.under >= 0 ? ` (on ${o.under})` : '';
  const line1 = !sel ? (E.crack ? `crack: ${E.crack.spine.length} points laid, C ends it` : 'nothing selected: click a plate, a pit or a seam') : sel.kind === 'plate' ? `plate ${sel.i}: length ${n2(o.w)}  width ${n2(o.h)}  depth ${n2(o.thick)} (${plateKind(o.thick)})  base ${n2(o.base)}${onS}` : sel.kind === 'pit' ? `pit ${sel.i}: length ${n2(o.w)}  width ${n2(o.h)}  floor ${n2(o.floor)}  ledge ${n2(o.ledge)}` : `seam ${sel.i}: ${o.spine.length} points, width ${n2(Math.max(...o.spine.map(q => q[2])) * 2)}`;
  const dims = Object.keys(ED_DIMS).map(k => (k === E.dim ? '>' : ' ') + k.toUpperCase() + ' ' + ED_DIMS[k]).join('   ');
  const lines = E.trying ? [`trying it: walk about; T parks you where you stand and edits again   ${E.msg}`] : [
    `editing ${E.id}   cursor ${E.cur[0].toFixed(1)}, ${E.cur[1].toFixed(1)}   zoom ${E.zoom.toFixed(2)}   ${E.msg}`, line1,
    `[ ] make it smaller / bigger in:  ${dims}`,
    'N new plate   P pit   C crack   U copy it up the stack   Delete   R turn   T try it   S save (copies the file)   O open a pasted one',
    'arrows pan   wheel zoom   click select   drag move   drag the ground to pan'];
  const fs = 14, bh = lines.length * (fs + 6) + 10; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(8, H - bh - 8, Math.min(W - 16, 1040), bh);
  ctx.font = `${fs}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  lines.forEach((t, i) => { ctx.fillStyle = i === 2 && !E.trying ? '#ffe080' : '#fdf6e3'; ctx.fillText(t, 16, H - bh - 8 + 5 + (i + 1) * (fs + 6) - 4); });
}
if (typeof canvas !== 'undefined' && canvas && canvas.addEventListener && EDIT_SCENE) {
  canvas.addEventListener('pointerdown', e => { if (e.button === 0) editDown(e.clientX, e.clientY); });
  canvas.addEventListener('pointermove', e => editMove(e.clientX, e.clientY));
  canvas.addEventListener('pointerup', e => editUp(e.clientX, e.clientY));
  canvas.addEventListener('wheel', e => { e.preventDefault(); editWheel(e.deltaY, e.clientX, e.clientY); }, { passive: false });
}
