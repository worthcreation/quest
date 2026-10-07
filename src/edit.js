// ===== edit.js: the layout editor (build 215): ?edit=<scene> on a plates screen (one with a layout: LAYOUTS[id],
// src/layouts/<id>.js). On the main game's code: the scene is entered as a test link and the world stands still (the
// hero parked where he stood, drawn faint) while you lay plates, pits and seams; what you lay is relaid at once
// (plateLayout reads the editor's copy), so collision and the drawing are the one shape as in play. Keys:
// - arrows pan, the wheel zooms about the cursor (Ross: a scroll never edits by accident); drag on open ground pans;
//   Q and Z (or shift and the wheel) tilt the view, from straight down to nearly level (223); a drag with the middle
//   button (the wheel pressed) orbits as Maya tumbles (229, Ross): across turns the view left or right (224:
//   state.edit.yaw, the camera's c.yaw; mtnProj turns the ground about the view's middle and every draw key is a depth
//   along the turned south, platesOrder), up and down tilts it; shift and the middle drag pans; alt and a left drag
//   tumbles too, alt and the middle pans, alt and the right drag zooms (Maya's own keys); V resets
//   the view, T tries the layout at the game's own camera (never turned)
// - click selects (a pit inside a plate before the plate, a seam by its line), drag moves it (a plate takes the ones
//   stacked on it along); click on open ground clears the selection
// - L W D A B E pick what [ ] change on the selected thing: length (x), width (y), depth (a plate's thickness), all
//   three together (the whole plate scaled, Ross's lwd), base (a plate then stands on nothing; a pit: its floor), ledge
//   (a pit's); [ ] smaller and bigger; a seam only has its width. R turns it; U copies it (the same size, the same
//   spot: a plate stacked straight on the selected one, a pit a tile over); Delete removes (the plates on a removed
//   one stand on what it stood on)
// - B the slab brush (227): [ ] set its reach (a circle at the cursor), a drag sweeps a strip (previewed), release
//   makes a 0.5 slab in that shape (layout kind 'brush': its points and radius, rebuilt the same way at every load,
//   brushOutline), stacked on whatever its middle lands on and selected, so [ ] then change its thickness as any slab;
//   the brush stays in hand for the next stroke, B puts it away. L W scale its points, A everything, E its radius, R turns its points. A stroke that
//   crosses a slab at the level it lands on merges into that slab (228, Ross: one shape, no doubled tops or reversed
//   faces): the slab becomes a brush slab of all its parts (its strokes, and the plain plate it was) at its own
//   thickness, every slab the stroke crosses at that level folded in; a stroke wholly on a slab's top stacks on it
// - X the ravine brush (232; angled edges 233): [ ] set its width, D then [ ] its depth, E then [ ] its slope (the run
//   per tile of depth: 1 is 45 degrees; W back to the width), a drag sweeps it, release cuts a ravine on the layer its
//   first point lands on, its sides a V you slide into (plateRavine); selected, W D E and [ ] change it, drag moves
//   it; X again cuts another, X with the brush in hand puts it away
// - N a new plate under the cursor (on the plate there, if any), P a pit there, C starts a crack and clicks lay its
//   points (C again ends it; 231: it belongs to the layer the first click lands on: on the base a hairline, on a layer
//   a slit down through everything under it, wider the deeper; [ ] change that depth), G a tunnel the same way (G ends it; 1.4 wide, roof 1.2: W, B and E change them), T drops the hero at the cursor to try it (the game runs: T again parks him there)
// - S saves: copies the layout as the file src/layouts/<scene>.js (the save is pasting it over that file); O opens one
//   pasted. One line at the bottom shows the selected thing's numbers and what [ ] change; H opens the key sheet.
// Every plate shows its thickness, coloured by kind (step green, hop yellow, high hop orange, face red); the selected
// one its base too, with a dashed outline. tests/edit.js drives it through editDown/editMove/editUp/editWheel.
var EDIT_SCENE = typeof location !== 'undefined' ? ((/[?&]edit=([a-z0-9]+)/.exec(location.search) || [])[1] || null) : null;
const ED_KIND = { step: '#8fd18f', hop: '#f0d060', high: '#f0a040', face: '#f06060' };
const ED_DIMS = { l: 'length', w: 'width', d: 'depth', a: 'all three', b: 'base', e: 'ledge, roof, reach or slope' };                     // what [ ] change, by its key
const editM = () => state.edit && MTN[state.edit.id];
const editCopy = L => JSON.parse(JSON.stringify(L));
function startEdit(id) {
  const m = MTN[id]; startTestScene(id, m && m.inX != null ? m.inX / m.len : undefined, m && m.inX != null ? m.pathY(m.inX) / m.D : undefined);   // parked at the way in
  const h = state.hero;
  if (!m || !m.plates) { showScroll('Not a plates screen', `${id} has no layout to edit.`); return; }
  state.edit = { p: mtnView(m, h.x / UNIT), yaw: 0, id, layout: editCopy({ plates: [], pits: [], seams: [], ...(LAYOUTS[id] || {}), tunnels: (LAYOUTS[id] || {}).tunnels || [], ravines: (LAYOUTS[id] || {}).ravines || [] }), zoom: 1, cx: h.x / UNIT, cy: h.y / UNIT, sel: null, dim: 'd', help: false, cur: [h.x / UNIT, h.y / UNIT], down: null, crack: null, brush: null, brushR: 1.2, ravW: 2.4, ravD: 1.4, ravS: 1, trying: false, msg: '' };
  editNorm(); editRelay(); mtnCamera(0, state.mtn, true);
  showScroll('The editor', 'Arrows pan, the wheel zooms. Click selects, drag moves. H shows the keys.');
}
// relay the plates from the editor's copy: collision, drawing and the labels all read the one lay
function editRelay() { const m = editM(); if (!m) return; m.pl = null; platesLay(m); const h = state.hero; h.liftAt = null; }
const editSel = () => { const E = state.edit; return E && E.sel ? E.sel : null; };
// the screen to the base plate's ground, in tiles (the projection run backwards; the ground's height found by iteration)
function editTile(X, Y) {
  const c = state.mtn, m = c.m, s = mtnZoom(c.p, m), th = m.tilt * c.p; let z = c.ch, x = c.cx, y = c.cy;
  for (let i = 0; i < 4; i++) { const k = mtnPush(z, c) * UNIT * s, [dx, dy] = editUnturn((X - SW / 2) / k, ((Y - SH / 2) / k + (z - c.ch) * Math.sin(th)) / Math.cos(th)); x = c.cx + dx; y = c.cy + dy; z = mtnH(m, x, y); }
  return [x, y];
}
// a step across and along the turned view (in tiles) back to a step in x and y (the turn run backwards)
const editUnturn = (a, d) => { const ps = state.mtn && state.mtn.yaw || 0; if (!ps) return [a, d]; const cs = Math.cos(ps), sn = Math.sin(ps); return [a * cs + d * sn, -a * sn + d * cs]; };
const editPr = () => { const c = state.mtn, m = c.m; return (x, y, z) => mtnProj(x, y, mtnH(m, x, y) + z, c); };
// what is under a point on the screen: a pit (inside its ring at its top), else the highest plate whose top holds it,
// else a seam within half a tile of its line. Returns { kind, i } into the layout, or null
function editPick(X, Y) {
  const E = state.edit, m = editM(), pl = platesLay(m), pr = editPr(), L = E.layout;
  const np = L.pits.length; for (let i = 0; i < pl.pits.length; i++) { const q = pl.pits[i]; if (plateIn(q.P.map(([x, y]) => pr(x, y, q.crack ? q.top0 : q.tunnel ? q.floor : q.top)), X, Y)) return q.rav != null ? { kind: 'ravine', i: q.rav } : q.crack ? { kind: 'seam', i: q.li } : i < np ? { kind: 'pit', i } : { kind: 'tunnel', i: i - np }; }   // (pits first, then tunnels: pl.pits lists them in that order; a tunnel by its strip on its floor)
  let best = null; for (const p of pl.list) if (plateIn(p.P.map(([x, y]) => pr(x, y, plateTop(p))), X, Y) && (!best || plateTop(p) > plateTop(best))) best = p;   // (the list is in the painter's order, not the layout's: li is its line)
  if (best) return best.rav != null ? { kind: 'ravine', i: best.rav } : { kind: 'plate', i: best.li };   // (a ravine's own ledge picks the ravine)
  const us = UNIT * mtnZoom(state.mtn.p, m);
  for (let i = 0; i < L.seams.length; i++) { if (L.seams[i].top > 0) continue; const C = L.seams[i].spine.map(([x, y]) => pr(x, y, 0)); for (let k = 1; k < C.length; k++) { const [ax, ay] = C[k - 1], [bx, by] = C[k], dx = bx - ax, dy = by - ay, t = mtnClamp(((X - ax) * dx + (Y - ay) * dy) / (dx * dx + dy * dy || 1e-9)); if (Math.hypot(X - ax - dx * t, Y - ay - dy * t) < us * 0.3) return { kind: 'seam', i }; } }
  return null;
}
const ED_PMAX = 1.45, ED_TURN = Math.PI / 2 / 360;                                        // the editor's tilt reaches p 1.45: about 79 degrees from straight down; a middle drag of 360 px is a quarter turn
const ED_LIST = { plate: 'plates', pit: 'pits', seam: 'seams', tunnel: 'tunnels', ravine: 'ravines' }, ED_SPINE = { seam: 1, tunnel: 1, ravine: 1 };   // a selection's list in the layout; the ones laid as a spine
const editObj = sel => sel ? state.edit.layout[ED_LIST[sel.kind]][sel.i] : null;
const brushPts = o => { const B = brushParts(o); return B.strokes.flatMap(st => st.pts).concat(B.plates.map(q => [q.x, q.y])); };   // the points a brush slab's parts are laid by
const editXY = o => { if (o.kind === 'brush') { const b = plateBox(brushPts(o)); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; } return [o.x, o.y]; };   // a layout line's spot: a brush slab's the middle of its parts
const editNorm = () => { for (const o of state.edit.layout.plates) if (o.kind === 'brush' && !o.strokes) { Object.assign(o, brushParts(o)); delete o.pts; delete o.r; } for (const sm of state.edit.layout.seams) { sm.spine = sm.spine.map(q => [q[0], q[1]]); sm.top = sm.top || 0; } };   // (a seam before 231 carried a width per point; now its layer)   // every brush line in the parts form (a 227 line had one stroke as pts and r)
const brushEach = (o, fn) => { const B = brushParts(o); for (const st of B.strokes) for (const q of st.pts) { const [x, y] = fn(q[0], q[1]); q[0] = x; q[1] = y; } for (const q of B.plates) { const [x, y] = fn(q.x, q.y); q.x = x; q.y = y; } o.strokes = B.strokes; o.plates = B.plates; delete o.pts; delete o.r; };   // every point of its parts moved by fn (a 227 line becomes a strokes line)
const editUnder = (m, x, y) => { let under = -1, top = -1; for (const p of platesLay(m).list) if (plateHas(p, x, y) && plateTop(p) > top) { top = plateTop(p); under = p.li; } return { under, base: under >= 0 ? top : 0 }; };   // what a new slab at x, y stands on: the highest plate there (its line), and the base that gives
const editOn = i => state.edit.layout.plates.map((p, k) => p.under === i ? k : -1).filter(k => k >= 0);   // the plates standing straight on plate i
// move a plate and every plate stacked on it (a pit, a seam: just itself)
function editShift(sel, dx, dy) {
  const o = editObj(sel); if (!o) return;
  if (ED_SPINE[sel.kind]) { for (const q of o.spine) { q[0] += dx; q[1] += dy; } return; }
  if (o.kind === 'brush') brushEach(o, (x, y) => [x + dx, y + dy]); else { o.x += dx; o.y += dy; } if (sel.kind === 'plate') for (const k of editOn(sel.i)) editShift({ kind: 'plate', i: k }, dx, dy);
}
// a plate's base is the top of the one it stands on (the chain settled after any change of thickness or base)
function editBases() { const P = state.edit.layout.plates; for (let r = 0; r < 8; r++) for (const p of P) if (p.under >= 0 && P[p.under]) p.base = +(P[p.under].base + P[p.under].thick).toFixed(3); }
function editRemove(sel) {
  const L = state.edit.layout;
  if (sel.kind === 'plate') { const gone = L.plates[sel.i]; for (const k of editOn(sel.i)) L.plates[k].under = gone.under; L.plates.splice(sel.i, 1); for (const p of L.plates) if (p.under > sel.i) p.under--; editBases(); }
  else L[ED_LIST[sel.kind]].splice(sel.i, 1);
  state.edit.sel = null;
}
const editSeed = () => +(Math.max(0, ...state.edit.layout.plates.map(p => p.seed), ...state.edit.layout.pits.map(q => q.seed), ...(state.edit.layout.ravines || []).map(q => q.seed)) + 7).toFixed(2);
// the mouse (edit.js listens on the canvas; the test calls these): a press, a move with it held, its release, the wheel
const ED_TILT = ED_PMAX / 300;                                                           // a middle drag of 300 px up or down tilts the whole range
// the camera's drag (229): 'tumble' (across turns, up and down tilts), 'pan', 'zoom'; Maya's: the middle tumbles, shift
// and the middle pans; alt and the left tumbles, alt and the middle pans, alt and the right zooms
const editCamDrag = (button, mods = {}) => mods.alt ? ['tumble', 'pan', 'zoom'][button] || null : button === 1 ? (mods.shift ? 'pan' : 'tumble') : null;
function editDown(X, Y, button = 0, mods = {}) { const E = state.edit; if (!E || E.trying || state.menu) return; const cam = editCamDrag(button, mods); if (cam) { E.turn = { x: X, y: Y, X, Y, mode: cam }; return; }
  if (E.brush) { const [x, y] = editTile(X, Y); E.brush.pts = [[+x.toFixed(2), +y.toFixed(2)]]; E.brush.z = editUnder(editM(), x, y).base;   /* (the ravine brush too: its layer) */ E.down = { X, Y, x: X, y: Y, moved: false, stroke: true }; return; }   // the brush: a press starts the stroke E.down = { X, Y, x: X, y: Y, moved: false, pick: E.crack || E.tun ? null : editPick(X, Y) }; }   // (the middle button: a turn starts)
  E.down = { X, Y, x: X, y: Y, moved: false, pick: E.crack || E.tun ? null : editPick(X, Y) };
}
function editMove(X, Y) {
  const E = state.edit; if (!E) return; E.cur = editTile(X, Y);
  if (E.turn && !E.trying) { const T = E.turn, dx = X - T.x, dy = Y - T.y, c = state.mtn;   // a camera drag (229): tumble, pan or zoom
    if (T.mode === 'tumble') { E.yaw = ((E.yaw + dx * ED_TURN + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; E.p = mtnClamp(E.p - dy * ED_TILT, 0, ED_PMAX); mtnCamera(0, c, true); }   // (right turns the view right: the ground slides left; up tips it toward level, down toward straight down)
    else if (T.mode === 'pan') { const k = UNIT * mtnZoom(c.p, c.m), [ux, uy] = editUnturn(dx / k, dy / (k * Math.cos(c.m.tilt * c.p))); E.cx -= ux; E.cy -= uy; mtnCamera(0, c, true); }   // (the ground follows the hand)
    else if (T.mode === 'zoom') { E.zoom = mtnClamp(E.zoom * Math.exp((dx - dy) * 0.005), 0.3, 4); mtnCamera(0, c, true); }   // (right or up zooms in)
    T.x = X; T.y = Y; E.cur = editTile(X, Y); return; }
  const d = E.down; if (!d || E.trying) return;
  if (d.stroke) { const [x, y] = E.cur, P = E.brush.pts, [lx, ly] = P[P.length - 1]; if (Math.hypot(x - lx, y - ly) >= 0.15) P.push([+x.toFixed(2), +y.toFixed(2)]); return; }   // the stroke: a point every 0.15 tiles
  if (!d.moved && Math.hypot(X - d.X, Y - d.Y) < 3) return; d.moved = true;
  const c = state.mtn, m = c.m, s = mtnZoom(c.p, m), th = m.tilt * c.p;
  if (d.pick) { const o = editObj(d.pick), z = d.pick.kind === 'plate' ? o.base + o.thick : d.pick.kind === 'pit' ? platesLay(m).pits[d.pick.i].top : d.pick.kind === 'tunnel' ? o.floor : d.pick.kind === 'seam' || d.pick.kind === 'ravine' ? o.top || 0 : 0, [ox, oy] = ED_SPINE[d.pick.kind] ? o.spine[0] : editXY(o), k = mtnPush(mtnH(m, ox, oy) + z, c) * UNIT * s;   // dragged at its own height on the screen
    editShift(d.pick, ...editUnturn((X - d.x) / k, (Y - d.y) / (k * Math.cos(th)))); E.sel = d.pick; editRelay(); }
  else { const k = UNIT * s, [dx, dy] = editUnturn((X - d.x) / k, (Y - d.y) / (k * Math.cos(th))); E.cx -= dx; E.cy -= dy; mtnCamera(0, c, true); }   // open ground: pan
  d.x = X; d.y = Y;
}
function editUp(X, Y) {
  const E = state.edit; if (!E || E.trying) return; if (E.turn) { E.turn = null; return; } const d = E.down; E.down = null; if (!d) return;
  if (d.stroke) { if (E.brush && E.brush.rav) editRavLay(); else editBrushLay(); return; }
  if (d.moved) { if (d.pick) editRound(d.pick); return; }                                                 // a drag done: what moved settles on a hundredth of a tile
  const [x, y] = editTile(X, Y);
  if (E.crack) { if (!E.crack.spine.length) { E.crack.top = editUnder(editM(), x, y).base; E.msg = E.crack.top > 0 ? 'a crack on the layer at ' + E.crack.top.toFixed(2) + ': ' + crackWidth(E.crack.top).toFixed(2) + ' wide' : 'a crack on the base: a hairline'; } E.crack.spine.push([+x.toFixed(3), +y.toFixed(3)]); return; }
  if (E.tun) { E.tun.spine.push([+x.toFixed(2), +y.toFixed(2)]); return; }                                  // a click lays the tunnel's next point                   // a click lays the crack's next point
  E.sel = d.pick;
}
// the stroke released: a 0.5 slab in the swept shape, on whatever the stroke's middle lands on, selected, with [ ] on its thickness
function editBrushLay() {
  const E = state.edit, L = E.layout, B = E.brush, m = editM(); if (!B || !B.pts || !B.pts.length) return; E.brush = { r: B.r, pts: null };   // (the brush stays in hand for the next stroke; B puts it away)
  const pl = platesLay(m), stroke = { pts: polyThin(B.pts, 0.03), r: B.r }, lands = B.pts.map(([x, y]) => editUnder(m, x, y));   // where each point of the stroke lands
  const u = lands.every(l => l.under === lands[0].under) ? lands[0] : lands.reduce((a, l) => l.base < a.base ? l : a);   // wholly on one slab's top: it stacks there; else it stands at the lowest level it touches (the ground, if it runs off a slab)
  const S = stroke.pts, near = (x, y) => { let d = Infinity; for (let i = 0; i < S.length; i++) { const [ax, ay] = S[i], [bx, by] = S[Math.min(S.length - 1, i + 1)], e = segDist(x, y, ax, ay, bx, by); if (e < d) d = e; } return d <= B.r; };
  const crossed = L.plates.map((q, i) => i).filter(i => Math.abs(L.plates[i].base - u.base) < 0.01 && (() => { const p = pl.list.find(p => p.li === i); return p && (p.P.some(([x, y]) => near(x, y)) || B.pts.some(([x, y]) => plateHas(p, x, y))); })());   // the slabs at the level it lands on that its strip crosses
  if (crossed.length) {                                                                   // merged (228): the first crossed slab takes the stroke and every other crossed slab's parts, at its own thickness
    const ti = crossed[0], t = L.plates[ti], parts = q => q.kind === 'brush' ? brushParts(q) : { strokes: [], plates: [{ x: q.x, y: q.y, w: q.w, h: q.h, seed: q.seed, rot: q.rot || 0 }] };
    const M = { kind: 'brush', strokes: [], plates: [], seed: t.seed, base: t.base, thick: t.thick, tone: t.tone, under: t.under };
    for (const i of crossed) { const P = parts(L.plates[i]); M.strokes.push(...P.strokes); M.plates.push(...P.plates); } M.strokes.push(stroke);
    L.plates[ti] = M; for (const i of crossed.slice(1).sort((a, b) => b - a)) { for (const k of editOn(i)) L.plates[k].under = ti; editRemove({ kind: 'plate', i }); }
    E.sel = { kind: 'plate', i: ti }; E.msg = 'merged into slab ' + ti + ' (' + M.strokes.length + ' strokes, ' + M.plates.length + ' plates)'; }
  else { L.plates.push({ kind: 'brush', strokes: [stroke], plates: [], seed: editSeed(), base: u.base, thick: 0.5, tone: PL_TONE, under: u.under }); E.sel = { kind: 'plate', i: L.plates.length - 1 }; E.msg = 'a brush slab: [ ] change its depth; sweep again, or B puts the brush away'; }
  E.dim = 'd'; editBases(); editRelay();
}
// the ravine brush's stroke released (232): a ravine on the layer it was pressed on, selected, the brush kept in hand
function editRavLay() {
  const E = state.edit, L = E.layout, B = E.brush; if (!B || !B.pts || B.pts.length < 2) { E.brush = { r: B.r, rav: true, pts: null }; return; }
  L.ravines.push({ spine: polyThin(B.pts, 0.03), w: E.ravW, depth: E.ravD, slope: E.ravS, top: B.z || 0, seed: editSeed() });
  E.sel = { kind: 'ravine', i: L.ravines.length - 1 }; E.brush = { r: B.r, rav: true, pts: null }; E.dim = 'w'; E.msg = 'a ravine: W, D or E then [ ] change its width, depth or slope; X puts the brush away'; editBases(); editRelay();
}
// (editRound: a brush slab is shifted as a whole onto the hundredth, so its shape, and its cached outline, stay as they were)
const editRound = sel => { const o = editObj(sel); if (o && !ED_SPINE[sel.kind]) { if (o.kind === 'brush') { const [x0, y0] = brushPts(o)[0], dx = +x0.toFixed(2) - x0, dy = +y0.toFixed(2) - y0; brushEach(o, (x, y) => [+(x + dx).toFixed(4), +(y + dy).toFixed(4)]); } else { o.x = +o.x.toFixed(2); o.y = +o.y.toFixed(2); } if (sel.kind === 'plate') for (const k of editOn(sel.i)) editRound({ kind: 'plate', i: k }); editRelay(); } else if (o) { for (const q of o.spine) { q[0] = +q[0].toFixed(3); q[1] = +q[1].toFixed(3); } editRelay(); } };   // (a plate: the slabs carried along on its stack too)
function editWheel(dy, X, Y, tilt = false) {
  const E = state.edit; if (!E || E.trying) return; const c = state.mtn;
  if (tilt) { E.p = mtnClamp(E.p + (dy > 0 ? 0.05 : -0.05), 0, ED_PMAX); mtnCamera(0, c, true); return; }   // (shift and the wheel: tilt)
  const [bx, by] = editTile(X, Y); E.zoom = mtnClamp(E.zoom * (dy > 0 ? 1 / 1.12 : 1.12), 0.3, 4); mtnCamera(0, c, true);
  const [ax, ay] = editTile(X, Y); E.cx += bx - ax; E.cy += by - ay; mtnCamera(0, c, true);                    // about the cursor: the tile under it stays put
}
// the layout as its file, src/layouts/<id>.js (S copies it; the save is pasting it over that file)
function editText(L, id) {
  const n = v => +(+v).toFixed(3), line = o => JSON.stringify(o).replace(/"(\w+)":/g, '"$1": ').replace(/,/g, ', ');
  const pts = P => '[' + P.map(q => '[' + q.map(n).join(', ') + ']').join(', ') + ']';
  const plates = L.plates.map(p => '    ' + (p.kind === 'brush' ? line({ kind: 'brush', seed: n(p.seed), base: n(p.base), thick: n(p.thick), tone: p.tone, under: p.under >= 0 ? p.under : -1 }).slice(0, -1) + ', "strokes": [' + brushParts(p).strokes.map(st => `{ "r": ${n(st.r)}, "pts": ${pts(st.pts)} }`).join(', ') + '], "plates": [' + brushParts(p).plates.map(q => line({ x: n(q.x), y: n(q.y), w: n(q.w), h: n(q.h), seed: n(q.seed), rot: n(q.rot || 0) })).join(', ') + '] }' : line({ x: n(p.x), y: n(p.y), w: n(p.w), h: n(p.h), seed: n(p.seed), base: n(p.base), thick: n(p.thick), tone: p.tone, rot: n(p.rot || 0), under: p.under >= 0 ? p.under : -1 })));
  const pits = L.pits.map(q => '    ' + line({ x: n(q.x), y: n(q.y), w: n(q.w), h: n(q.h), seed: n(q.seed), floor: n(q.floor), ledge: n(q.ledge) }));
  const seams = L.seams.map(s => '    { "spine": [' + s.spine.map(q => '[' + q.slice(0, 2).map(n).join(', ') + ']').join(', ') + `], "top": ${n(s.top || 0)} }`);
  const tunnels = (L.tunnels || []).map(t => '    { "spine": [' + t.spine.map(q => '[' + q.map(n).join(', ') + ']').join(', ') + `], "w": ${n(t.w)}, "floor": ${n(t.floor)}, "roof": ${n(t.roof)} }`);
  const ravines = (L.ravines || []).map(r => '    { "spine": [' + r.spine.map(q => '[' + q.map(n).join(', ') + ']').join(', ') + `], "w": ${n(r.w)}, "depth": ${n(r.depth)}, "slope": ${n(r.slope || 1)}, "top": ${n(r.top || 0)}, "seed": ${n(r.seed)} }`);
  const block = (name, rows) => `  "${name}": [\n${rows.join(',\n')}\n  ]`;
  return `// ===== layouts/${id}.js: ${id}'s plates, pits and seams, laid in the editor (?edit=${id}; S copies this file: paste it over\n// this one). plateLayout reads it at enterScene. A plate: its middle x, y and size w, h in tiles, its outline's seed and\n// turn (rot), base and thickness above the base plate, tone, and under (the index of the plate it stands on, or -1).\n// A brush slab (kind brush): its parts instead of x, y, w, h and rot: strokes (each its points and radius r) and the\n// plain plates merged into it, one outline from all of them (brushOutline).\n// A tunnel: its spine in tiles, width w, floor and roof (the plates between are cut along it). A seam is a crack: its\n// spine and the top of the layer it is drawn on (0 the base: a hairline; higher: a slit down through the layers under it).\n// A ravine (232, angled edges 233): its spine, width w, depth, slope (the run per tile of depth), its layer's top, seed.\nLAYOUTS.${id} = {\n${[block('plates', plates), block('pits', pits), block('seams', seams)].concat(tunnels.length ? [block('tunnels', tunnels)] : [], ravines.length ? [block('ravines', ravines)] : []).join(',\n')}\n};\n`;
}
// a pasted layout: the file above, or its bare object
function editLoad(text) {
  const E = state.edit; let t = String(text || '').trim(); const i = t.indexOf('{'), j = t.lastIndexOf('}'); if (i < 0 || j < i) return false;
  try { const L = JSON.parse(t.slice(i, j + 1)); if (!Array.isArray(L.plates)) return false; E.layout = { plates: L.plates, pits: L.pits || [], seams: L.seams || [], tunnels: L.tunnels || [], ravines: L.ravines || [] }; E.sel = null; editNorm(); editBases(); editRelay(); return true; } catch (e) { return false; }
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
  const tl = (state.keys.z ? 1 : 0) - (state.keys.q ? 1 : 0); if (tl) { E.p = mtnClamp(E.p + tl * 0.8 * dt, 0, ED_PMAX); mtnCamera(0, state.mtn, true); }   // Q flatter (toward straight down), Z tipped further
  if (tap('v')) { E.p = mtnView(m, E.cx); E.zoom = 1; E.yaw = 0; mtnCamera(0, state.mtn, true); E.msg = 'view reset'; }
  const pan = 14 * dt / E.zoom, pa = (state.keys.arrowright ? pan : 0) - (state.keys.arrowleft ? pan : 0), pd = (state.keys.arrowdown ? pan : 0) - (state.keys.arrowup ? pan : 0);   // (across and along the view as it is turned)
  if (pa || pd) { const [dx, dy] = editUnturn(pa, pd); E.cx += dx; E.cy += dy; }
  const [cx, cy] = E.cur.map(v => +v.toFixed(2));
  if (tap('c')) { if (E.crack) { if (E.crack.spine.length >= 2) { L.seams.push({ spine: E.crack.spine, top: E.crack.top || 0 }); E.sel = { kind: 'seam', i: L.seams.length - 1 }; } E.crack = null; editRelay(); } else { E.crack = { spine: [], top: 0 }; E.sel = null; E.brush = null; E.msg = 'click to lay the crack (the first click picks its layer); C ends it'; } }
  else if (tap('g')) { if (E.tun) { if (E.tun.spine.length >= 2) { L.tunnels.push({ spine: E.tun.spine, w: 1.4, floor: 0, roof: 1.2 }); E.sel = { kind: 'tunnel', i: L.tunnels.length - 1 }; } E.tun = null; editRelay(); } else { E.tun = { spine: [] }; E.crack = null; E.sel = null; E.msg = 'click to lay the tunnel; G ends it'; } }   // a tunnel: 1.4 wide, its roof 1.2 up (walked under: PL_HEAD)
  else if (tap('x')) { if (E.brush && E.brush.rav) { E.brush = null; E.msg = 'ravine brush put away'; } else { E.brush = { r: E.ravW / 2, rav: true, pts: null }; E.crack = null; E.tun = null; E.sel = null; E.dim = 'w'; E.msg = '[ ] set the ravine\'s width, D then [ ] its depth; drag to cut it; X puts it away'; } }
  else if (tap('b') && (E.brush || !o)) { if (E.brush) { E.brush = null; E.msg = 'brush put away'; } else { E.brush = { r: E.brushR, pts: null }; E.crack = null; E.tun = null; E.msg = '[ ] set the brush; drag to sweep a slab; B puts it away'; } }   // (the brush in hand: a press sweeps, B puts it away; B with something selected and no brush picks the base, as before)
  else if (tap('n')) { const u = editUnder(m, cx, cy); L.plates.push({ x: cx, y: cy, w: 4, h: 2.6, seed: editSeed(), base: u.base, thick: 0.4, tone: PL_TONE, rot: 0, under: u.under }); E.sel = { kind: 'plate', i: L.plates.length - 1 }; }
  else if (tap('p')) { L.pits.push({ x: cx, y: cy, w: 3.4, h: 3, seed: editSeed(), floor: 0, ledge: 0.55 }); E.sel = { kind: 'pit', i: L.pits.length - 1 }; }
  else if (tap('h')) E.help = !E.help;
  else if (tap('s')) editCopyOut();
  else if (tap('o')) { const t = typeof prompt === 'function' ? prompt('Paste a layout (the file, or its object)') : null; E.msg = t == null ? E.msg : editLoad(t) ? 'loaded' : 'that was not a layout'; }
  else if (Object.keys(ED_DIMS).some(k => tap(k) && (E.dim = k))) E.msg = '[ ] change ' + ED_DIMS[E.dim];
  else if (o && (tap('delete') || tap('backspace'))) editRemove(sel);
  else if (o && tap('u')) { if (sel.kind === 'plate') { L.plates.push({ ...o, ...(o.kind === 'brush' ? editCopy(brushParts(o)) : {}), seed: editSeed(), base: +(o.base + o.thick).toFixed(3), under: sel.i }); E.sel = { kind: 'plate', i: L.plates.length - 1 }; } else if (sel.kind === 'pit') { L.pits.push({ ...o, x: o.x + 1, y: o.y + 1, seed: editSeed() }); E.sel = { kind: 'pit', i: L.pits.length - 1 }; } else if (sel.kind === 'tunnel') { L.tunnels.push({ ...o, spine: o.spine.map(([x, y]) => [x + 1, y + 1]) }); E.sel = { kind: 'tunnel', i: L.tunnels.length - 1 }; } }
  else if (o && tap('r') && !ED_SPINE[sel.kind]) { if (o.kind === 'brush') { const [mx, my] = editXY(o), ct = Math.cos(Math.PI / 12), st = Math.sin(Math.PI / 12); brushEach(o, (x, y) => [+(mx + (x - mx) * ct - (y - my) * st).toFixed(2), +(my + (x - mx) * st + (y - my) * ct).toFixed(2)]); for (const q of o.plates) q.rot = +((q.rot || 0) + Math.PI / 12).toFixed(3); } else o.rot = +((o.rot || 0) + Math.PI / 12).toFixed(3); }
  else if (!o && E.brush && !E.brush.pts) { const dir = (tap(']') ? 1 : 0) - (tap('[') ? 1 : 0); if (!dir) return true;
    if (E.brush.rav) { if (E.dim === 'd') E.ravD = +mtnClamp(E.ravD + dir * 0.1, PL_RAV.dMin, PL_RAV.dMax).toFixed(2); else if (E.dim === 'e') E.ravS = +mtnClamp(E.ravS + dir * 0.1, PL_RAV.sMin, PL_RAV.sMax).toFixed(2); else E.ravW = +mtnClamp(E.ravW + dir * 0.2, PL_RAV.wMin, PL_RAV.wMax).toFixed(2); E.brush.r = E.ravW / 2; E.msg = 'ravine ' + E.ravW.toFixed(1) + ' wide, ' + E.ravD.toFixed(1) + ' deep, slope ' + E.ravS.toFixed(1); return true; }   // the ravine brush: its width, (D) its depth, (E) its slope
    E.brush.r = E.brushR = +mtnClamp(E.brush.r + dir * 0.1, PL_BRUSH.min, PL_BRUSH.max).toFixed(2); E.msg = 'brush ' + E.brush.r.toFixed(1) + ' tiles'; return true; }   // [ ] before the stroke: its reach
  else if (o) {
    const dir = (tap(']') ? 1 : 0) - (tap('[') ? 1 : 0); if (!dir) return true; const k = E.dim, f = dir > 0 ? 1.1 : 1 / 1.1;   // [ ] on the picked dimension: a fifth of a tile across, a twentieth up, all three by a tenth
    if (sel.kind === 'ravine') { if (k === 'd') o.depth = +mtnClamp(o.depth + dir * 0.1, PL_RAV.dMin, PL_RAV.dMax).toFixed(2); else if (k === 'e') o.slope = +mtnClamp((o.slope || 1) + dir * 0.1, PL_RAV.sMin, PL_RAV.sMax).toFixed(2); else if (k === 'w' || k === 'l') o.w = +mtnClamp(o.w + dir * 0.2, PL_RAV.wMin, PL_RAV.wMax).toFixed(2); else if (k === 'b') o.top = +Math.max(0, (o.top || 0) + dir * 0.05).toFixed(2); else return true; }   // a ravine: its width, depth, (E) slope, or (B) its layer
    else if (sel.kind === 'seam') o.top = +Math.max(0, (o.top || 0) + dir * 0.05).toFixed(2);   // a crack: the layer it is drawn on (0 the base)
    else if (sel.kind === 'tunnel') { if (k === 'w' || k === 'l') o.w = +Math.max(0.6, o.w + dir * 0.1).toFixed(2); else if (k === 'b') o.floor = +Math.max(0, o.floor + dir * 0.05).toFixed(2); else if (k === 'e') o.roof = +Math.max(o.floor + 0.3, o.roof + dir * 0.05).toFixed(2); else return true; }
    else if (o.kind === 'brush') { const [mx, my] = editXY(o), sc = (fx, fy) => { brushEach(o, (x, y) => [+(mx + (x - mx) * fx).toFixed(2), +(my + (y - my) * fy).toFixed(2)]); for (const q of o.plates) { q.w = +Math.max(1, q.w * fx).toFixed(2); q.h = +Math.max(1, q.h * fy).toFixed(2); } }, reach = d => { for (const st of brushParts(o).strokes) st.r = +mtnClamp(d(st.r), PL_BRUSH.min, PL_BRUSH.max).toFixed(2); };   // a brush slab: its stroke scaled about its middle (L along x, W along y, A both with its radius and depth), E its radius
      if (k === 'l') sc(f, 1); else if (k === 'w') sc(1, f); else if (k === 'a') { sc(f, f); reach(r => r * f); o.thick = +Math.max(0.05, o.thick * f).toFixed(2); } else if (k === 'e') reach(r => r + dir * 0.1); else if (k === 'd') o.thick = +Math.max(0.05, o.thick + dir * 0.05).toFixed(2); else if (k === 'b') { o.base = +Math.max(0, o.base + dir * 0.05).toFixed(2); o.under = -1; } else return true; }
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
    pl.list.filter(p => p.rav == null).forEach(p => { const T = p.P.map(([x, y]) => pr(x, y, plateTop(p))), [X, Y] = mid(T), on = sel && sel.kind === 'plate' && sel.i === p.li; if (on) dashed(T); label(X, Y, on ? `${p.thick.toFixed(2)} on ${p.base.toFixed(2)}` : p.thick.toFixed(2), ED_KIND[p.kind]); });
    pl.pits.filter(q => q.rav != null).forEach(q => { const R = q.P.map(([x, y]) => pr(x, y, q.top0)), on = sel && sel.kind === 'ravine' && sel.i === q.rav; if (on) dashed(R); const [X, Y] = mid(R); label(X, Y, `ravine ${q.w.toFixed(1)} wide, ${q.depth.toFixed(2)} deep, slope ${q.slope.toFixed(1)}`, '#9fb8ff'); });
    pl.pits.filter(q => !q.tunnel).forEach((q, i) => { const R = q.P.map(([x, y]) => pr(x, y, q.top)), [X, Y] = mid(R), on = sel && sel.kind === 'pit' && sel.i === i; if (on) dashed(R); label(X, Y, `pit floor ${q.floor.toFixed(2)} ledge ${q.ledge.toFixed(2)}`, '#9fd8ff'); });
    pl.pits.filter(q => q.tunnel && !q.crack && q.rav == null).forEach((q, i) => { const R = q.P.map(([x, y]) => pr(x, y, q.floor)), on = sel && sel.kind === 'tunnel' && sel.i === i; if (on) dashed(R); else { ctx.save(); ctx.strokeStyle = 'rgba(160,220,255,.6)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); plPath(R); ctx.stroke(); ctx.restore(); } const [X, Y] = mid(R); label(X, Y, `tunnel floor ${q.floor.toFixed(2)} roof ${q.roof.toFixed(2)} width ${q.w.toFixed(2)}`, '#9fd8ff'); });
    pl.seams.forEach(sm => { const i = sm.li; const C = sm.spine.map(([x, y]) => pr(x, y, 0)), on = sel && sel.kind === 'seam' && sel.i === i; if (on) { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); C.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); ctx.restore(); } const [X, Y] = C[Math.floor(C.length / 2)]; label(X, Y, 'crack on the base', '#d0c8ff'); });
    pl.pits.filter(q => q.crack && q.rav == null).forEach(q => { const R = q.P.map(([x, y]) => pr(x, y, q.top0)), on = sel && sel.kind === 'seam' && sel.i === q.li; if (on) dashed(R); const [X, Y] = mid(R); label(X, Y, `crack ${q.top0.toFixed(2)} deep, ${q.w.toFixed(2)} wide`, '#d0c8ff'); });
    if (E.brush) { const c = state.mtn, B = E.brush, P = B.pts && B.pts.length ? B.pts : [E.cur], [mx, my] = P[0], z = B.pts ? B.z || 0 : 0, k = mtnPush(mtnH(m, mx, my) + z, c) * us;   // the brush: a circle at the cursor; while dragging, only the strip it has swept, a wide line at the height it was pressed on (229: nothing is worked out until the button comes up)
      const C = P.map(([x, y]) => pr(x, y, z)); ctx.save(); ctx.strokeStyle = B.rav ? 'rgba(90,110,160,.5)' : 'rgba(255,230,140,.45)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Math.max(2, 2 * B.r * k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (C.length > 1) { ctx.beginPath(); C.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); } else { ctx.beginPath(); ctx.ellipse(C[0][0], C[0][1], B.r * k, B.r * k * Math.cos(m.tilt * E.p), 0, 0, 6.28); ctx.fill(); }
      ctx.restore(); }
    if (E.tun) { const C = E.tun.spine.map(([x, y]) => pr(x, y, 0)).concat([pr(E.cur[0], E.cur[1], 0)]); ctx.save(); ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = Math.max(2, 1.4 * us); ctx.globalAlpha = 0.5; ctx.lineCap = 'round'; ctx.beginPath(); C.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); ctx.restore(); }
    if (E.crack) { const C = E.crack.spine.map(([x, y]) => pr(x, y, 0)).concat([pr(E.cur[0], E.cur[1], 0)]); ctx.save(); ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); C.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); ctx.restore(); }
    const [CX, CY] = pr(E.cur[0], E.cur[1], 0); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(CX - us * 0.3, CY); ctx.lineTo(CX + us * 0.3, CY); ctx.moveTo(CX, CY - us * 0.3); ctx.lineTo(CX, CY + us * 0.3); ctx.stroke();
  }
  // the panel: what is selected and its numbers, which dimension [ ] change, the keys
  const o = editObj(sel), n2 = v => (+v).toFixed(2), onS = sel && sel.kind === 'plate' && o.under >= 0 ? ` (on ${o.under})` : '';
  const line1 = !sel || (E.brush && E.brush.pts) ? (E.brush && E.brush.rav ? (E.brush.pts ? `ravine: ${E.brush.pts.length} points swept, release cuts it` : `ravine brush ${E.ravW.toFixed(1)} wide, ${E.ravD.toFixed(1)} deep, slope ${E.ravS.toFixed(1)}: [ ] change the ${E.dim === 'd' ? 'depth' : E.dim === 'e' ? 'slope' : 'width'} (W, D, E), drag to cut, X puts it away`) : E.brush ? (E.brush.pts ? `brush: ${E.brush.pts.length} points swept, release lays the slab` : `brush ${E.brush.r.toFixed(1)} tiles: [ ] change it, drag to sweep a slab, B puts it away`) : E.crack ? `crack: ${E.crack.spine.length} points laid, C ends it` : E.tun ? `tunnel: ${E.tun.spine.length} points laid, G ends it` : 'nothing selected: click a plate, a pit, a tunnel or a seam') : sel.kind === 'ravine' ? `ravine ${sel.i}: ${o.spine.length} points  width ${n2(o.w)}  depth ${n2(o.depth)}  slope ${n2(o.slope || 1)}  on the layer at ${n2(o.top || 0)}` : sel.kind === 'tunnel' ? `tunnel ${sel.i}: ${o.spine.length} points  width ${n2(o.w)}  floor ${n2(o.floor)}  roof ${n2(o.roof)}` : sel.kind === 'plate' && o.kind === 'brush' ? `brush slab ${sel.i}: ${brushParts(o).strokes.length} strokes, ${brushParts(o).plates.length} plates  reach ${n2(brushParts(o).strokes.length ? brushParts(o).strokes[0].r : 0)}  depth ${n2(o.thick)} (${plateKind(o.thick)})  base ${n2(o.base)}${onS}` : sel.kind === 'plate' ? `plate ${sel.i}: length ${n2(o.w)}  width ${n2(o.h)}  depth ${n2(o.thick)} (${plateKind(o.thick)})  base ${n2(o.base)}${onS}` : sel.kind === 'pit' ? `pit ${sel.i}: length ${n2(o.w)}  width ${n2(o.h)}  floor ${n2(o.floor)}  ledge ${n2(o.ledge)}` : `crack ${sel.i}: ${o.spine.length} points, on the layer at ${n2(o.top || 0)}${o.top > 0 ? ', ' + n2(crackWidth(o.top)) + ' wide down to the base' : ' (the base: a hairline)'}`;
  // one line at the bottom: what is selected and its numbers, what [ ] change; H opens the key sheet (Ross, 218: the
  // five-line panel was a mash)
  const fs = 14; ctx.font = `${fs}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const bottom = E.trying ? `trying it   T parks you where you stand   ${E.msg}` : `${line1}   [ ] change ${ED_DIMS[E.dim]}   tilt ${Math.round(state.mtn.m.tilt * E.p * 180 / Math.PI)} deg   turn ${Math.round(E.yaw * 180 / Math.PI)} deg   H keys   ${E.msg}`;
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(8, H - fs - 18, Math.min(W - 16, 12 + ctx.measureText(bottom).width + 12), fs + 10); ctx.fillStyle = '#fdf6e3'; ctx.fillText(bottom, 16, H - 14);
  if (E.help && !E.trying) {                                                             // the key sheet: three columns, grouped
    const cols = [['LOOK', 'arrows      pan', 'wheel       zoom', 'drag ground pan', 'Q Z  tilt (or shift+wheel)', 'middle drag  orbit (turn, tilt)', 'shift+middle  pan', 'alt+left orbit, alt+middle pan,', '  alt+right zoom (Maya)', 'V    reset the view', '', 'PICK', 'click       select', 'drag        move it', 'click ground  clear'],
      ['LAY', 'N   new plate here', 'P   pit here', 'C   crack: clicks lay it, C ends;', '    the first click picks its layer', 'G   tunnel: the same, G ends', 'B   brush: [ ] its reach, a drag', '    sweeps a slab; B puts it away', 'X   ravine brush: [ ] width,', '    D [ ] depth, E [ ] slope', 'U   copy it on top', 'Delete  remove it', '', 'TRY AND SAVE', 'T   try it (walk; T parks you)', 'S   save (copies the file)', 'O   open a pasted layout'],
      ['CHANGE THE SELECTED', '[   smaller   ]   bigger', 'in: L length (east-west)', '    W width (north-south)', '    D depth (how thick)', '    A all three (scale)', '    B base, or a pit floor', '    E ledge (pit), roof (tunnel),', '      reach (brush slab)', '    a crack: [ ] its layer', '    a ravine: W D E [ ], B its layer', 'R   turn it', '', `now: ${ED_DIMS[E.dim]}`]];
    const lh = fs + 5, bw = Math.min(W - 40, 3 * 300 + 40), bh = (Math.max(...cols.map(c => c.length)) + 2) * lh + 30, bx = (W - bw) / 2, by = Math.max(10, (H - bh) / 2 - 40);
    ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = '#ffe080'; ctx.fillText(`THE EDITOR'S KEYS   (H closes this)`, bx + 20, by + 24);
    cols.forEach((col, ci) => col.forEach((t, i) => { const head = t === t.toUpperCase() && /[A-Z]/.test(t) && !/^[A-Z] {2,}/.test(t) && t.length >= 3 && !t.startsWith('now'); ctx.fillStyle = head ? '#ffe080' : t.startsWith('now') ? '#9fd8ff' : '#fdf6e3'; ctx.fillText(t, bx + 20 + ci * (bw - 40) / 3, by + 24 + (i + 2) * lh); }));
  }
}
if (typeof canvas !== 'undefined' && canvas && canvas.addEventListener && EDIT_SCENE) {
  canvas.addEventListener('pointerdown', e => { if (e.button <= 2 && (e.button !== 2 || e.altKey)) editDown(e.clientX, e.clientY, e.button, { shift: e.shiftKey, alt: e.altKey }); });
  canvas.addEventListener('contextmenu', e => e.preventDefault());                          // (alt and the right drag zooms: no menu)
  canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });                       // (the middle button's autoscroll stays off)
  canvas.addEventListener('auxclick', e => e.preventDefault());
  canvas.addEventListener('pointermove', e => editMove(e.clientX, e.clientY));
  canvas.addEventListener('pointerup', e => editUp(e.clientX, e.clientY));
  canvas.addEventListener('wheel', e => { e.preventDefault(); editWheel(e.deltaY, e.clientX, e.clientY, e.shiftKey); }, { passive: false });
}
