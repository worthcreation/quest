// ===== plates.js: the mountain's stone is a PLATE (build 212, docs/mountain-plan.md "Plates"): a worn squarish
// outline in tiles (plateOutline: a superellipse's twelve points, two rounds of corner-cutting, a small wobble), a
// base and a thickness in tiles above the scene's base plate. One shape for drawing and collision (plateHas). Drawn
// with the mountain's one projection (mtnProj: the rise's tilt and zoom, then the eye's push-out from the screen's
// centre, 1 + z / m.eye). What a screen lays (m.plates, at mtnLand) becomes m.pl: plates, pits and seams.
// - faces: quads from the foot ring to the top ring on the edges whose foot lies outward of the lip and south of it
//   (faces north only, Ross 2 Oct: you see the faces of what stands north of you and the lips of what lies south);
//   one gradient per plate straight down the screen (the dark overhang band under the lip, lit stone, darker to the
//   foot), each face's facing only nudging it (0.5 to 1, lit from the west); strata as continuous rings over 0.3
//   thick; stones set in (drawJagged, clipped to their wall, feathered in) only on faces over 1.5.
// - tops: one texture each, painted once in tile space (plateTex: grit, short cracks and the odd long seam, lichen,
//   tone drift) and laid on through the projection each frame; then the brink (three strokes inside the edge, half
//   the ravine's weight) and the lip (a dark line and a light rim) round the whole ring, so a step is never invisible.
// - the base: one plate under the scene, its surface the slope and the generator's bumps (the ground's own rows,
//   their lean shading), the same texture denser as a wash over them (no fill of its own), loose stones lying on it,
//   laid in chunks of a few tiles and running PL_MARGIN tiles past the scene's edges so no edge of it shows.
// - pits: a hole through every plate above its floor; the tops cut at their own heights; one wall from the floor to
//   the top lip, lit by its own shade (0.8 to 0.96), a line where each cut plate meets the next; the floor darkest at
//   the far foot; brink and lip inside. Nothing of a hole is painted outside its lip.
// - seams: a crack under half a tile wide, its tones inside its own width (mid-dark, the east half near black),
//   painted on the base, then on each top after that top, clipped to it: it jogs up every face and a plate nearer the
//   eye hides it; it stops at a pit's rim.
// Kinds by thickness (plateKind): step up to 0.25, hop to 0.5, high hop to 1, face over 1. Until layered ground lays the
// ground in layers, every plate but the hero's holds (plateHold: the foot ring is a wall, as the mountain is).
// What a screen lays comes from its layout (LAYOUTS[id], src/layouts/<id>.js, laid in the editor: edit.js, 215):
// plates each { x, y, w, h, seed, base, thick, tone, rot, under }, pits { x, y, w, h, seed, floor, ledge }, seams
// { spine }. plateLayout reads it (the editor's working copy while that screen is being edited).

const LAYOUTS = {};                                                                     // a screen's laid plates by scene id (src/layouts/<id>.js fills it)
let PL_HERO = null;                                                                     // down a pit: { pit, lift, box } (drawMtn sets it each frame: the far walls above you leave your box out)
const PL_PX = 40, PL_N = 12, PL_TONE = 134, PL_MARGIN = 8, PL_TEX = new Map();                                            // texture px per tile; outline points before the cutting; the first plate's grey
function plateRng(seed) { const R = mulberry32((Math.floor(seed * 7919) * 2654435761) >>> 0); return (a = 0, b = 1) => a + R() * (b - a); }
// a plate's outline in tiles: squarish (a superellipse), corners knocked, a jog or two; worn, not cut
function plateOutline(cx, cy, w, h, seed, n = PL_N, turn = 0) {                        // turn: the editor's R, radians on top of the seed's own tilt
  const rnd = plateRng(seed), P = [], rot = rnd(-0.5, 0.5) * 0.35 + turn;
  for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rnd(-0.5, 0.5) * 0.25, ex = Math.cos(a), ey = Math.sin(a), rr = Math.pow(Math.pow(Math.abs(ex), 4) + Math.pow(Math.abs(ey), 4), -1 / 4), j = rnd(0.86, 1.1), px = ex * rr * w / 2 * j, py = ey * rr * h / 2 * j; P.push([cx + px * Math.cos(rot) - py * Math.sin(rot) * 0.5, cy + py * Math.cos(rot) + px * Math.sin(rot) * 0.5]); }
  let Q = P; for (let r = 0; r < 2; r++) { const R = []; for (let k = 0; k < Q.length; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % Q.length]; R.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } Q = R; }
  return Q.map(([x, y]) => [x + rnd(-0.5, 0.5) * 0.12, y + rnd(-0.5, 0.5) * 0.08]);
}
const plateIn = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const plateHas = (p, x, y) => plateIn(p.P, x, y);                                       // the one shape: inside this plate's outline (and so on it, or held off its face)
const plateKind = thick => thick <= 0.25 ? 'step' : thick <= 0.5 ? 'hop' : thick <= 1 ? 'high' : 'face';
const plateTop = p => p.base + p.thick;
const plateBox = P => { const xs = P.map(q => q[0]), ys = P.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
// one plate from its spec (a layout's line): its outline from its seed and turn; under is set by plateLayout
const plateAdd = (pl, s) => { const p = { x: s.x, y: s.y, w: s.w, h: s.h, seed: s.seed, base: s.base || 0, thick: s.thick, tone: s.tone || PL_TONE, rot: s.rot || 0, under: null, P: plateOutline(s.x, s.y, s.w, s.h, s.seed, PL_N, s.rot || 0) }; pl.list.push(p); return p; };
// the spec of the plate that would stand on p up a stack: shifted along the lean, a little smaller, as thick as given
// (the editor's D; build 217's stacks are rows of these)
const plateNext = (p, lean, thick = p.thick) => ({ x: p.x + lean[0], y: p.y + lean[1], w: Math.max(3, p.w - 0.45), h: Math.max(2.2, p.h - 0.28), seed: +(p.seed + 1.3).toFixed(2), base: plateTop(p), thick, tone: p.tone + 2, rot: p.rot });
// a screen's layout laid: LAYOUTS[id] (src/layouts/<id>.js), or the editor's working copy of it while it is being edited
function plateLayout(pl, id) {
  const L = state.edit && state.edit.id === id ? state.edit.layout : LAYOUTS[id]; if (!L) return;
  const ps = (L.plates || []).map(s => plateAdd(pl, s)); ps.forEach((p, i) => { const u = L.plates[i].under; p.under = u >= 0 && ps[u] && ps[u] !== p ? ps[u] : null; });
  for (const q of L.pits || []) platePit(pl, q.x, q.y, q.w, q.h, q.seed, q.floor, q.ledge);
  for (const sm of L.seams || []) plateSeam(pl, sm.spine);
}
// a pit: a ring punched straight down through every plate it crosses to floor (Ross: like punching out a hole; each
// plate shows its own cut face inside it). ledge (tiles): the way out, a staircase. Each plate down, the ring is cut
// back on its south and west sides by about that much (shrunk toward its north-east), so every plate under the top
// one keeps an L of its top inside the hole, a hop above the one below, and the floor lies on the far side, where the
// camera can see it (the view tips south: the near side of a deep hole is under its rim's overhang); from the floor
// you hop up them, south-west
const platePit = (pl, x, y, w, h, seed, floor, ledge = 0) => pl.pits.push({ x, y, floor, ledge, P: plateOutline(x, y, w, h, seed, 9) });
const plateSeam = (pl, spine) => pl.seams.push({ spine });                                // [[x, y, halfwidth]...] in tiles, hw under 0.25
// what a screen laid, worked out once: every plate's draw key (its foot's south edge, never before the one it stands
// on), each pit's cut plates (the ones containing its middle from its floor up), its floor and its top lip
function platesLay(m) {
  if (m.pl) return m.pl;
  const pl = { list: [], pits: [], seams: [], tone: m.plateTone || 143 }; m.plates(pl);
  for (const p of pl.list) { p.box = plateBox(p.P); p.kind = plateKind(p.thick); }
  const keyOf = (p, d = 0) => p.key !== undefined ? p.key : (p.key = Math.max(p.box[3], p.under && d < 64 ? keyOf(p.under, d + 1) + 1e-3 : -Infinity));   // (its foot's south edge, never before the one it stands on, whatever order the list has them)
  for (const p of pl.list) keyOf(p);
  // the painter's order where plates overlap on the ground (217, Ross: a plate laid partly inside another showed the
  // other's wall over it): what stands on a plate comes after it, a plate wholly above another's top comes after it,
  // and two that share height are ordered by whose foot lies further south where they overlap, not by their whole
  // outline; the keys are then nudged so the list's order holds (a key never moves north)
  const unders = p => { const S = new Set(); for (let u = p.under, d = 0; u && d < 64; u = u.under, d++) S.add(u); return S; }, UN = new Map(pl.list.map(p => [p, unders(p)]));
  const localS = (p, x0, x1) => { let m = -Infinity; for (const [x, y] of p.P) if (x >= x0 && x <= x1 && y > m) m = y; return m === -Infinity ? p.box[3] : m; };
  const before = (a, b) => { if (UN.get(b).has(a)) return true; if (UN.get(a).has(b)) return false;                  // a is painted before b (only asked of two that overlap on the ground)
    if (a.base >= plateTop(b) - 1e-6) return false; if (b.base >= plateTop(a) - 1e-6) return true;
    const x0 = Math.max(a.box[0], b.box[0]), x1 = Math.min(a.box[2], b.box[2]), d = localS(a, x0, x1) - localS(b, x0, x1); return Math.abs(d) > 0.05 ? d < 0 : a.key < b.key; };
  const after = new Map(pl.list.map(p => [p, new Set()])), L = pl.list;                       // what must come after each plate
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j]; if (!(a.box[0] < b.box[2] && b.box[0] < a.box[2] && a.box[1] < b.box[3] && b.box[1] < a.box[3])) continue; if (before(a, b)) after.get(a).add(b); else after.get(b).add(a); }
  const out = [], left = new Set(L);                                                           // then from the north: the plate nothing left must precede, the northmost of those (a cycle, if a layout makes one, just takes the northmost)
  while (left.size) { let pick = null; for (const p of left) if (![...left].some(q => q !== p && after.get(q).has(p)) && (!pick || p.key < pick.key)) pick = p; if (!pick) for (const p of left) if (!pick || p.key < pick.key) pick = p; out.push(pick); left.delete(pick); }
  pl.list = out;
  let prev = -Infinity; for (const p of pl.list) { p.key = Math.max(p.key, prev + 1e-3); prev = p.key; }
  for (const q of pl.pits) { q.cut = pl.list.filter(p => p.base >= q.floor - 0.01 && plateTop(p) > q.floor + 0.01 && (q.P.some(([x, y]) => plateHas(p, x, y)) || p.P.some(([x, y]) => plateIn(q.P, x, y))));   // every plate the ring crosses, from its floor up
    q.top = q.cut.length ? Math.max(...q.cut.map(plateTop)) : q.floor; q.last = q.cut.reduce((a, p) => !a || p.key > a.key ? p : a, null); q.box = plateBox(q.P);
    q.ring = new Map(); let R = q.P;                                                       // each cut plate's own ring: the top one the whole ring, each one down cut back by the ledge
    for (const p of q.cut.slice().sort((a, b) => plateTop(b) - plateTop(a))) { q.ring.set(p, R); if (q.ledge > 0) { const ax = Math.max(...R.map(v => v[0])), ay = Math.min(...R.map(v => v[1])), ny = Math.max(...R.map(v => v[1])), f = Math.max(0.2, 1 - q.ledge / Math.max(0.01, ny - ay)); R = R.map(([x, y]) => [ax + (x - ax) * f, ay + (y - ay) * f]); } } }
  return (m.pl = pl);
}
const pitHas = (q, p, x, y) => q.ring.has(p) && plateIn(q.ring.get(p), x, y);
// the ground's height in tiles above the base at a point: the top of the highest plate there, less the pits (0 off every plate)
function plateTopAt(pl, x, y, ok = null) { let h = 0; for (const p of pl.list) if ((!ok || ok(p)) && plateHas(p, x, y) && !pl.pits.some(q => pitHas(q, p, x, y))) h = Math.max(h, plateTop(p)); return h; }   // (in a pit: whatever is left under the cut, its floor or a ledge; ok: only the plates it passes)
// the hero on the plates (213): his ground is the top of the plate he stands on (h.lift, tiles above the base). A
// plate no more than PL_STEP above it is walked up; a higher one is a wall unless he is in the air at or above its
// top, and then he lands on it; walking or jumping off an edge drops him to the ground below (in the air at the
// height he was). Build 214 adds the drop's numbers (a puff, a stagger, a heart), Pip and the camera's lift
const PL_STEP = 0.25, PL_BODY = 0.35, PL_HEAD = 1.1;                                     // a step you walk up; how far round your middle your body reaches (a wall stops it, not just your middle); your height: a plate whose underside is that far above your ground you walk under (217)
function plateStepHero(m, h) {
  const pl = platesLay(m), x = h.x / UNIT, y = h.y / UNIT;
  if (h.liftAt !== state.scene) { h.liftAt = state.scene; let c = 0; for (let k = 0; k < 4; k++) c = plateTopAt(pl, x, y, p => p.base < c + PL_HEAD); h.lift = c; h.plPrev = [h.x, h.y]; }   // put down here: on the ground, then up whatever stands within head room of it (never on an overhang)
  const cur = h.lift, air = Math.max(0, h.z) / UNIT, up = T => T > cur + PL_STEP + 1e-6 && cur + air < T - 0.02;   // too high to walk up, and not above it in the air
  const under = p => p.base >= cur + PL_HEAD - 1e-6 && cur + air < plateTop(p) - 0.02, topAt = (x, y) => plateTopAt(pl, x, y, p => !under(p));   // an overhang clear of your head is passed under (unless you are in the air at or above its top: then you land on it)
  const body = (x, y) => { let t = topAt(x, y); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; t = Math.max(t, topAt(x + Math.cos(a) * PL_BODY, y + Math.sin(a) * PL_BODY)); } return t; };   // the highest ground under your body, not just your middle: no standing half inside a wall
  let T = topAt(x, y), wall = false; const was = h.plPrev ? body(h.plPrev[0] / UNIT, h.plPrev[1] / UNIT) : 0, into = (b) => up(b) && b > was + 1e-6;   // (a wall only stops you moving into it: stepping off a plate with your back against a higher one is fine)
  if (up(T) || into(body(x, y))) { const [px, py] = h.plPrev || [h.x, h.y]; wall = true;            // held: slide along the face if one axis is free
    if (!up(topAt(px / UNIT, y)) && !into(body(px / UNIT, y))) { h.x = px; h.vx = 0; } else if (!up(topAt(x, py / UNIT)) && !into(body(x, py / UNIT))) { h.y = py; h.vy = 0; } else { h.x = px; h.y = py; h.vx = h.vy = 0; }
    T = topAt(h.x / UNIT, h.y / UNIT); }
  if (T > cur) { h.z = Math.max(0, h.z - (T - cur) * UNIT); if (h.z <= 0) { h.z = 0; h.vz = Math.max(0, h.vz); if (h.vz === 0 && air > 0) spark(h.x, h.y + UNIT * 0.4, 'rgba(160,140,110,.8)', 4, 1.5); } }   // up a step, or landing on a top
  else if (T < cur) { h.z += (cur - T) * UNIT; if (h.vz === 0) h.airDist = 0; }                                    // off an edge: in the air, falling to the ground below
  h.lift = T; h.plPrev = [h.x, h.y];
  return wall;
}
// what stands on the plates is drawn after the plate it stands on: the key of the highest plate under a point at or
// below a height (drawMtn's list)
const plateKeyUnder = (pl, x, y, z) => pl.list.reduce((k, p) => plateTop(p) <= z + 1e-6 && plateHas(p, x, y) && !pl.pits.some(q => pitHas(q, p, x, y)) ? Math.max(k, p.key + 1e-3) : k, -Infinity);
// the plates over you (their underside clear of your head, over your middle): you are drawn before the first of them, so
// they cover you and the x-ray shows you through (the key of the first such plate, or Infinity)
const plateOverHero = (pl, x, y, z) => pl.list.reduce((k, p) => p.base >= z + PL_HEAD - 1e-6 && plateHas(p, x, y) ? Math.min(k, p.key) : k, Infinity);
// held off every plate (everything but the hero, until 214 lays the ground in layers): inside a foot plate's outline
// you're put back just outside its nearest edge, as the mountain holds
function plateHold(m, a) {
  const pl = platesLay(m), x = a.x / UNIT, y = a.y / UNIT;
  for (const p of pl.list) { if (p.base > 0 || !plateHas(p, x, y)) continue;
    let bd = Infinity, bx = x, by = y; const P = p.P;
    for (let i = 0; i < P.length; i++) { const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length], dx = x1 - x0, dy = y1 - y0, t = mtnClamp(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1e-9)), qx = x0 + dx * t, qy = y0 + dy * t, d = Math.hypot(x - qx, y - qy); if (d < bd) { bd = d; bx = qx; by = qy; } }
    const L = Math.hypot(bx - x, by - y) || 1, ux = (bx - x) / L, uy = (by - y) / L;
    a.x = (bx + ux * 0.06) * UNIT; a.y = (by + uy * 0.06) * UNIT; if (Math.abs(ux) > 0.3) a.vx = 0; if (Math.abs(uy) > 0.3) a.vy = 0;
    return true; }
  return false;
}
const platesAt = (pl, x, y, pad = 0) => pl.list.some(p => p.base === 0 && [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]].some(([dx, dy]) => plateHas(p, x + dx, y + dy)));   // a plate stands here (or within pad): nothing else is laid on it

// --- drawing. pr(x, y, z): a point z tiles above the base's surface on the screen (drawMtn passes mtnProj with the
// ground's height added); s the view's zoom, us the tile in px at it
const plPath = (R, dy = 0, g = ctx) => { g.beginPath(); R.forEach(([X, Y], i) => i ? g.lineTo(X, Y + dy) : g.moveTo(X, Y + dy)); g.closePath(); };
const plRgb = (v, d = 0) => 'rgb(' + Math.round(v) + ',' + Math.round(v + 2 + d) + ',' + Math.round(v - 5 + d) + ')';
// the brink and lip, as the rise's ravines have them at half weight, in grey: inside the edge three strokes darkest
// at it, then the lip, a dark line where the stone breaks off and a lighter rim above it, all the way round
function platePaintBrink(R, us) { ctx.save(); plPath(R); ctx.clip(); ctx.lineJoin = 'round';
  for (const [wk, col] of [[0.7, 'rgba(40,38,32,.07)'], [0.42, 'rgba(40,38,32,.1)'], [0.2, 'rgba(30,28,24,.18)']]) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, wk * us); plPath(R); ctx.stroke(); }
  ctx.restore(); }
function platePaintLip(R, s) { ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(28,28,24,.6)'; ctx.lineWidth = Math.max(1, 1.8 * s); plPath(R); ctx.stroke();
  ctx.strokeStyle = 'rgba(225,222,200,.3)'; ctx.lineWidth = Math.max(1, 1.2 * s); plPath(R, -1.6 * s); ctx.stroke(); }
// a top's texture, painted once in tile space (PL_PX px a tile, the plate's box): its grey (the base's: the ground's
// own colour tile by tile, the lean's shading in it), tone drift, grit, pebbles, short cracks and the odd long one,
// lichen flakes; the base denser, with loose stones lying on it. Laid on the screen through the projection each frame
function plateTex(p, m) {
  if (p.tex !== undefined) return p.tex;
  const key = [p.base_ ? 'b' : 'p', p.seed, p.tone, (p.box[2] - p.box[0]).toFixed(3), (p.box[3] - p.box[1]).toFixed(3)].join('|');   // the same seed and size paint the same texture (the editor relays the plates at every change: a move keeps its top)
  if (PL_TEX.has(key)) return (p.tex = PL_TEX.get(key));
  let tex = null;
  try { const [x0, y0, x1, y1] = p.box, wpx = Math.ceil((x1 - x0) * PL_PX), hpx = Math.ceil((y1 - y0) * PL_PX), cv = document.createElement('canvas'); cv.width = wpx; cv.height = hpx; const g = cv.getContext && cv.getContext('2d');
    if (g && g.fillRect) { const more = p.base_ ? 2.2 : 1, rnd = plateRng(p.seed * 131), area = wpx * hpx, tone = p.tone;
      if (!p.base_) { g.fillStyle = plRgb(tone); g.fillRect(0, 0, wpx, hpx); }                 // (the base has no fill of its own: the ground's rows show through)
      for (let f = 0; f < 3 * more; f++) { const gr = g.createRadialGradient(rnd(0, wpx), rnd(0, hpx), 0, wpx / 2, hpx / 2, Math.max(wpx, hpx) * 0.5); gr.addColorStop(0, rnd() < 0.5 ? 'rgba(255,255,250,.05)' : 'rgba(20,18,16,.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, wpx, hpx); }
      const ng = Math.round(area / 42); for (let i = 0; i < ng; i++) { g.fillStyle = rnd() < 0.45 ? 'rgba(255,255,250,' + rnd(0.08, 0.2) + ')' : 'rgba(18,16,14,' + rnd(0.1, 0.22) + ')'; g.fillRect(rnd(0, wpx), rnd(0, hpx), rnd(1, 2.2), rnd(1, 1.6)); }
      for (let i = 0; i < ng / 16; i++) { const x = rnd(0, wpx), y = rnd(0, hpx), r = rnd(1.5, 3.2); g.fillStyle = 'rgba(20,18,16,.22)'; g.beginPath(); g.ellipse(x + 1, y + 1, r, r * 0.7, 0, 0, 6.28); g.fill(); g.fillStyle = plRgb(tone + 14, 2); g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, 6.28); g.fill(); }
      const nc = Math.round((2 + area / 9000) * more); g.lineWidth = 1;
      for (let i = 0; i < nc; i++) { let x = rnd(0, wpx), y = rnd(0, hpx), a = rnd(0, 6.28); const long = rnd() < 0.18, segs = long ? 6 : 2 + Math.floor(rnd(0, 2)), pts = [[x, y]]; for (let k = 0; k < segs; k++) { a += rnd(-0.5, 0.5) * 1.1; const d = long ? rnd(8, 18) : rnd(3, 8); x += Math.cos(a) * d; y += Math.sin(a) * d; pts.push([x, y]); }
        g.strokeStyle = 'rgba(255,252,240,.18)'; g.beginPath(); pts.forEach(([X, Y], k) => k ? g.lineTo(X + 1, Y + 1) : g.moveTo(X + 1, Y + 1)); g.stroke();
        g.strokeStyle = long ? 'rgba(18,16,14,.55)' : 'rgba(26,24,20,.42)'; g.beginPath(); pts.forEach(([X, Y], k) => k ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.stroke(); }
      for (let i = 0; i < area / 40000 * more; i++) { if (rnd() < 0.5) continue; g.fillStyle = 'rgba(176,186,160,.3)'; const x = rnd(0, wpx), y = rnd(0, hpx); for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + rnd(-5, 5), y + rnd(-3, 3), rnd(2, 5), rnd(1.5, 3), rnd(0, 3), 0, 6.28); g.fill(); } }
      if (p.base_) for (let i = 0; i < area / 7000; i++) { const x = rnd(0, wpx), y = rnd(0, hpx), r = rnd(1.5, 3.5); g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + 1.2, y + 1.2, r, r * 0.6, 0, 0, 6.28); g.fill(); drawJagged(x, y, r, i * 0.7, ['#8c8a80', '#a09e94', '#6a6860'], null, g); }   // loose stones lying on the base
      tex = cv; } } catch (e) { tex = null; }
  if (tex) PL_TEX.set(key, tex);
  return (p.tex = tex);
}
// the texture's tiles [x0, y0] to [x1, y1] laid on the screen between the three corners the projection gives (one
// affine a chunk: a few tiles of the base at a time, a whole top at once)
function plateLay(tex, p, x0, y0, x1, y1, pr, z, clip = false) {
  const [bx0, by0] = p.box, sw = (x1 - x0) * PL_PX, sh = (y1 - y0) * PL_PX, [X0, Y0] = pr(x0, y0, z), [X1, Y1] = pr(x1, y0, z), [X2, Y2] = pr(x0, y1, z);
  ctx.save(); if (clip) { plPath([[X0, Y0], [X1, Y1], pr(x1, y1, z), [X2, Y2]]); ctx.clip(); }   // (a base chunk: cut to its own quad, the whole texture drawn through it, so no edge texel blends with nothing and neighbours meet on one line)
  ctx.transform((X1 - X0) / sw, (Y1 - Y0) / sw, (X2 - X0) / sh, (Y2 - Y0) / sh, X0, Y0); ctx.drawImage(tex, -(x0 - bx0) * PL_PX, -(y0 - by0) * PL_PX); ctx.restore();
}
// the faces: walls from the foot ring F to the top ring T (on the screen), on the edges whose foot lies outward of
// the lip and south of it; one gradient down the screen, each face darkened by its facing; strata; set-in stones
function platePaintFaces(T, F, thick, tone, seed, s, strata = null, hole = false) {
  const n = T.length, yTop = Math.min(...T.map(q => q[1])), yFoot = Math.max(...F.map(q => q[1])), us = UNIT * s;
  const face = i => { const j = (i + 1) % n, ex = T[j][0] - T[i][0], ey = T[j][1] - T[i][1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L, mx = (T[i][0] + T[j][0]) / 2, my = (T[i][1] + T[j][1]) / 2, fx = (F[i][0] + F[j][0]) / 2, fy = (F[i][1] + F[j][1]) / 2;
    return { j, nx, ny, seen: (fx - mx) * nx + (fy - my) * ny > 0.2 && (hole || fy > my + 0.2) }; };
  const g = ctx.createLinearGradient(0, yTop, 0, yFoot + 1); g.addColorStop(0, plRgb(tone * 0.5)); g.addColorStop(0.06, plRgb(tone * 0.9)); g.addColorStop(0.5, plRgb(tone * 0.74)); g.addColorStop(1, plRgb(tone * 0.56));
  const seen = [];
  for (let i = 0; i < n; i++) { const f = face(i); seen.push(f.seen); if (!f.seen) continue;
    const lit = hole ? mtnClamp(0.86 + 0.1 * (-f.nx), 0.8, 0.96) : mtnClamp(0.72 + 0.28 * (-f.nx) - 0.08 * f.ny, 0.5, 1);
    ctx.beginPath(); ctx.moveTo(T[i][0], T[i][1]); ctx.lineTo(T[f.j][0], T[f.j][1]); ctx.lineTo(F[f.j][0], F[f.j][1]); ctx.lineTo(F[i][0], F[i][1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    if (lit < 0.99) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - lit).toFixed(3) + ')'; ctx.fill(); } }
  const rings = strata ? strata.map(hz => (thick - hz) / thick).filter(t => t > 0.02 && t < 0.98) : thick > 0.3 ? [0.22, 0.4, 0.6] : [];
  ctx.strokeStyle = 'rgba(30,28,24,.22)'; ctx.lineWidth = Math.max(1, 1.2 * s);
  for (const t of rings) { let pen = false; ctx.beginPath(); for (let i = 0; i <= n; i++) { const k = i % n; if (!seen[k] && !seen[(k - 1 + n) % n]) { pen = false; continue; } const w = strata ? t : t + 0.04 * Math.sin(k * 0.9 + seed), x = T[k][0] + (F[k][0] - T[k][0]) * w, y = T[k][1] + (F[k][1] - T[k][1]) * w; pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } ctx.stroke(); }
  if (thick < 1.5) return;
  for (let i = 0; i < n; i++) { if (!seen[i] || (i * 5 + Math.round(seed)) % 7 !== 1) continue; const j = (i + 1) % n, [X, Y] = T[i], [x, y] = F[i], h = ((i * 31 + Math.round(seed) * 3) % 97) / 97, t0 = 1.5 / thick, t = t0 + h * (0.85 - t0), r = (0.12 + h * 0.4) * us, v = Math.round(126 - t * 50), px = X + (x - X) * t, py = Y + (y - Y) * t, wall = plRgb(tone * (1 - t * 0.45)).replace('rgb', 'rgba').replace(')', ',');
    ctx.save(); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(T[j][0], T[j][1]); ctx.lineTo(F[j][0], F[j][1]); ctx.lineTo(x, y); ctx.closePath(); ctx.clip();   // never off its own wall
    drawJagged(px, py, Math.max(2, r), i * 0.53 + seed, [plRgb(v), plRgb(v + 16), plRgb(v - 22)]);
    const gr = ctx.createRadialGradient(px, py - r * 0.5, 0, px, py - r * 0.2, r * 1.6); gr.addColorStop(0, wall + '.85)'); gr.addColorStop(0.55, wall + '.5)'); gr.addColorStop(1, wall + '0)');   // the wall over the join, feathered: most of the stone buried, a cap showing
    ctx.fillStyle = gr; ctx.fillRect(px - r * 2, py - r * 2, r * 4, r * 4); ctx.restore(); }
}
// a seam at one height, clipped to a top (or the base): the dark of the slit as wide as the crack, its east half
// darker; nothing outside its own width; stopped at every pit's rim at that height
function platePaintSeam(sm, z, clip, pits, pr, us) {
  ctx.save(); if (clip) { plPath(clip); ctx.clip(); }
  if (pits.length) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); for (const q of pits) { const R = q.P.map(([x, y]) => pr(x, y, z)); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); } ctx.clip('evenodd'); }
  const C = sm.spine.map(([x, y]) => pr(x, y, z)); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 1; i < C.length; i++) { const w = Math.max(2, sm.spine[i][2] * 2 * us);
    ctx.strokeStyle = 'rgb(44,44,40)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(C[i - 1][0], C[i - 1][1]); ctx.lineTo(C[i][0], C[i][1]); ctx.stroke();
    ctx.strokeStyle = 'rgb(14,14,12)'; ctx.lineWidth = w * 0.5; ctx.beginPath(); ctx.moveTo(C[i - 1][0] + w * 0.25, C[i - 1][1]); ctx.lineTo(C[i][0] + w * 0.25, C[i][1]); ctx.stroke(); }
  ctx.restore();
}
const plOn = (R, mg) => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [X, Y] of R) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; } return x1 > -mg && x0 < W + mg && y1 > -mg && y0 < H + mg; };
// the base plate under the whole scene: its texture, a wash over the ground's rows (drawMtn fills the rows under it
// first, in one go), laid in chunks of eight tiles between their own corners on the ground, under whatever clip is
// set (the base's ring, or the brink's band); only the chunks between X0 and X1 on the screen
function platesBase(m, pr, X0 = -Infinity, X1 = Infinity) {
  const pl = platesLay(m), p = pl.base || (pl.base = { base_: true, seed: m.seed * 1.7, tone: pl.tone, box: [-PL_MARGIN, -PL_MARGIN, m.len + PL_MARGIN, m.D + PL_MARGIN] }), tex = plateTex(p, m);
  if (!tex) return;
  const [bx0, by0, bx1, by1] = p.box;
  for (let y = by0; y < by1; y += 8) for (let x = bx0; x < bx1; x += 8) { const x1 = Math.min(bx1, x + 8), y1 = Math.min(by1, y + 8), [A, Ay] = pr(x, y, 0), [B, By] = pr(x1, y1, 0); if (B < X0 - 2 || A > X1 + 2 || By < -2 || Ay > H + 2) continue; plateLay(tex, p, x, y, x1, y1, pr, 0, true); }
}
const plateRing = m => { const R = [], [x0, y0, x1, y1] = [-PL_MARGIN, -PL_MARGIN, m.len + PL_MARGIN, m.D + PL_MARGIN]; for (let x = x0; x < x1; x++) R.push([x, y0]); for (let y = y0; y < y1; y++) R.push([x1, y]); for (let x = x1; x > x0; x--) R.push([x, y1]); for (let y = y1; y > y0; y--) R.push([x0, y]); return R; };   // the base's edge, a point a tile (the rows' columns)
// one plate on the screen, bottom up as the list has them: its faces and its top, less any pit through it (the ring
// swept from its base to its top: none of its stone is left there), the seams on its top, its brink and lip; then the
// hole through it, inside its own ring at its top and on its own outline: a shade (each plate looked down through a
// little darker), its own cut face (a quad an edge from its ring at its base to its ring at its top, the far walls,
// lit by the hole's own shade, 0.8 to 0.96), a line where it meets the plate under it, the hole's brink and lip.
// Nothing of a hole is painted outside its lip (docs/parked/mock-pitfall.js)
// a plate's top, less any pit through it, with the seams on it, its brink and lip
// you're down this plate's pit, below its top: the hole's inside (its far walls and the brink inside its lip) is
// behind you, so it leaves your box out (a clip; the caller's save/restore undoes it). Its top and lip are not: the
// camera looks down, so a layer above you is always nearer it than you are, and where it overlaps you it hides you
// (the x-ray shows you through it)
function plateBehindHero(p, top) {
  if (!PL_HERO || !PL_HERO.pit.ring.has(p) || top <= PL_HERO.lift + 1e-6) return false;
  const [x0, y0, x1, y1] = PL_HERO.box; ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip('evenodd'); return true;
}
function plateTopPaint(m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top)), cuts = pl.pits.filter(q => q.ring.has(p));
  ctx.save(); plPath(T); ctx.clip();
  for (const q of cuts) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); q.ring.get(p).forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.clip('evenodd'); }
  const tex = plateTex(p, m); if (tex) plateLay(tex, p, p.box[0], p.box[1], p.box[2], p.box[3], pr, top); else { ctx.fillStyle = plRgb(p.tone); ctx.fillRect(-W, -H, W * 3, H * 3); }
  for (const sm of pl.seams) platePaintSeam(sm, top, null, [], pr, us);
  platePaintBrink(T, us); platePaintLip(T, s);
  ctx.restore();
}
// the screen box of what a plate paints (its top ring and its foot ring)
const plateScreenBox = (p, pr) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of p.P) for (const z of [p.base, plateTop(p)]) { const [X, Y] = pr(x, y, z); if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; } return [x0, y0, x1, y1]; };
function drawPlate(m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top)), F = p.P.map(([x, y]) => pr(x, y, p.base));
  if (!plOn(T, us * 2) && !plOn(F, us * 2)) return;
  const cuts = pl.pits.filter(q => q.ring.has(p)), ring = (q, z) => q.ring.get(p).map(([x, y]) => pr(x, y, z));
  const outside = R => { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip('evenodd'); };
  ctx.save(); for (const q of cuts) for (const z of [p.base, (p.base + top) / 2, top]) outside(ring(q, z));
  platePaintFaces(T, F, p.thick, p.tone, p.seed, s); ctx.restore();
  plateTopPaint(m, p, pr, s);
  for (const q of cuts) { const R = ring(q, top), B = ring(q, p.base), n = R.length;
    ctx.save(); plPath(T); ctx.clip(); plPath(R); ctx.clip();
    ctx.fillStyle = 'rgba(12,14,14,.16)'; ctx.fillRect(-W, -H, W * 3, H * 3);
    let cx = 0, cy = 0; for (const [X, Y] of R) { cx += X / n; cy += Y / n; }
    plateBehindHero(p, top);                                                                // (down this pit below this plate: its far walls and the brink inside its lip are behind you)
    const yT = Math.min(...R.map(v => v[1])), yB = Math.max(...B.map(v => v[1]));
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mx = (R[i][0] + R[j][0]) / 2, my = (R[i][1] + R[j][1]) / 2, bx = (B[i][0] + B[j][0]) / 2, by = (B[i][1] + B[j][1]) / 2;
      if ((bx - mx) * (cx - mx) + (by - my) * (cy - my) <= 0.2) continue;                  // the far walls: their foot lies in toward the hole's middle
      const ex = R[j][0] - R[i][0], ey = R[j][1] - R[i][1], L = Math.hypot(ex, ey) || 1; let nx = ey / L; if ((mx - cx) * nx + (my - cy) * (-ex / L) > 0) nx = -nx;
      const lit = mtnClamp(0.86 + 0.1 * (-nx), 0.8, 0.96), g = ctx.createLinearGradient(0, yT, 0, yB + 1); g.addColorStop(0, plRgb(p.tone * 0.6 * lit)); g.addColorStop(0.12, plRgb(p.tone * 0.95 * lit)); g.addColorStop(1, plRgb(p.tone * 0.72 * lit));
      ctx.beginPath(); ctx.moveTo(R[i][0], R[i][1]); ctx.lineTo(R[j][0], R[j][1]); ctx.lineTo(B[j][0], B[j][1]); ctx.lineTo(B[i][0], B[i][1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.strokeStyle = 'rgba(28,26,22,.45)'; ctx.lineWidth = Math.max(1, 1.2 * s); plPath(B); ctx.stroke();
    platePaintBrink(R, us); ctx.restore();
    ctx.save(); plPath(T); ctx.clip(); platePaintLip(R, s); ctx.restore(); }
}
// System > Show tiles on a plates screen: the tiles lightened by the ground's height there (a pit is dark again)
function drawPlateTiles(m, pr) {
  const pl = platesLay(m), h = state.hero, hx = h.x / UNIT, x0 = Math.max(0, Math.floor(hx - 14)), x1 = Math.min(m.len, Math.ceil(hx + 14));
  for (let y = 0; y < m.D; y++) for (let x = x0; x < x1; x++) { const z = plateTopAt(pl, x + 0.5, y + 0.5); if (z <= 0) continue; const c = [pr(x, y, z), pr(x + 1, y, z), pr(x + 1, y + 1, z), pr(x, y + 1, z)]; plPath(c); ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, 0.12 + z * 0.1).toFixed(2) + ')'; ctx.fill(); }
}
