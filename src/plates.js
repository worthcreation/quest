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
//   the top lip, lit by its own shade (0.8 to 0.96) and darker the deeper; inside the rim the ledges keep their
//   texture under a wash that deepens with depth, the floor darkest, one lip at the rim and nothing else (225).
//   Nothing of a hole is painted outside its lip.
// - seams: a crack under half a tile wide, its tones inside its own width (mid-dark, the east half near black),
//   painted on the base, then on each top after that top, clipped to it: it jogs up every face and a plate nearer the
//   eye hides it; it stops at a pit's rim.
// Kinds by thickness (plateKind): step up to 0.25, hop to 0.5, high hop to 1, face over 1. Until layered ground lays the
// ground in layers, every plate but the hero's holds (plateHold: the foot ring is a wall, as the mountain is).
// What a screen lays comes from its layout (LAYOUTS[id], src/layouts/<id>.js, laid in the editor: edit.js, 215):
// plates each { x, y, w, h, seed, base, thick, tone, rot, under } or a brush slab { kind: 'brush', pts, r, seed,
// base, thick, tone, under } (227, brushOutline), pits { x, y, w, h, seed, floor, ledge }, tunnels
// { spine, w, floor, roof } (222), seams { spine }. plateLayout reads it (the editor's working copy while that screen is being edited).

const LAYOUTS = {};                                                                     // a screen's laid plates by scene id (src/layouts/<id>.js fills it)
let PL_HERO = null;                                                                     // down a pit: { pit, lift, box } (drawMtn sets it each frame: the far walls above you leave your box out)
const PL_PX = 40, PL_N = 12, PL_TONE = 134, PL_MARGIN = 8, PL_TEX = new Map(), PL_TOPKEY = 1000;   // (PL_TOPKEY: the tops' draw keys start past any tile y)                                            // texture px per tile; outline points before the cutting; the first plate's grey
function plateRng(seed) { const R = mulberry32((Math.floor(seed * 7919) * 2654435761) >>> 0); return (a = 0, b = 1) => a + R() * (b - a); }
// a plate's outline in tiles: squarish (a superellipse), corners knocked, a jog or two; worn, not cut
function plateOutline(cx, cy, w, h, seed, n = PL_N, turn = 0) {                        // turn: the editor's R, radians: the finished outline turned rigidly about its middle (223: it was folded into the seed's skew, so it stretched the slab)
  const rnd = plateRng(seed), P = [], rot = rnd(-0.5, 0.5) * 0.35;
  for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rnd(-0.5, 0.5) * 0.25, ex = Math.cos(a), ey = Math.sin(a), rr = Math.pow(Math.pow(Math.abs(ex), 4) + Math.pow(Math.abs(ey), 4), -1 / 4), j = rnd(0.86, 1.1), px = ex * rr * w / 2 * j, py = ey * rr * h / 2 * j; P.push([cx + px * Math.cos(rot) - py * Math.sin(rot) * 0.5, cy + py * Math.cos(rot) + px * Math.sin(rot) * 0.5]); }
  let Q = P; for (let r = 0; r < 2; r++) { const R = []; for (let k = 0; k < Q.length; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % Q.length]; R.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } Q = R; }
  const ct = Math.cos(turn), st = Math.sin(turn);
  return Q.map(([x, y]) => [x + rnd(-0.5, 0.5) * 0.12, y + rnd(-0.5, 0.5) * 0.08]).map(([x, y]) => [cx + (x - cx) * ct - (y - cy) * st, cy + (x - cx) * st + (y - cy) * ct]);
}
// a brush slab's outline (227): the strip a round brush of radius r sweeps along a stroke's points, as one outline.
// The swept discs are rasterized on a quarter-tile grid (the field: r less the distance to the stroke), the boundary
// marched with each crossing interpolated along its cell edge, the loops joined, the biggest kept (a stroke that closes
// on itself leaves its hole), the run simplified (Douglas-Peucker, PL_BRUSH.simp tiles) and then worn as plateOutline
// wears its points, from the seed. Rebuilt the same way from the same points, radius and seed at every load
const PL_BRUSH = { g: 0.25, simp: 0.05, min: 0.3, max: 4 };                             // the grid step; the simplifying tolerance; the brush's smallest and largest radius
function brushOutline(pts, r, seed) {
  const g = PL_BRUSH.g, n = pts.length; if (!n) return [];
  const dist = (x, y) => { let d = Infinity; for (let i = 0; i < n; i++) { const [ax, ay] = pts[i], [bx, by] = pts[Math.min(n - 1, i + 1)], dx = bx - ax, dy = by - ay, t = mtnClamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1e-9)), e = Math.hypot(x - ax - dx * t, y - ay - dy * t); if (e < d) d = e; } return d; };
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), x0 = Math.floor((Math.min(...xs) - r) / g) - 1, y0 = Math.floor((Math.min(...ys) - r) / g) - 1, nx = Math.ceil((Math.max(...xs) + r) / g) + 2 - x0, ny = Math.ceil((Math.max(...ys) + r) / g) + 2 - y0;
  const f = new Float32Array((nx + 1) * (ny + 1)); for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) f[j * (nx + 1) + i] = r - dist((x0 + i) * g, (y0 + j) * g);   // (positive inside the strip)
  const F = (i, j) => f[j * (nx + 1) + i], key = (x, y) => (Math.round(x * 1e4) + ',' + Math.round(y * 1e4)), segs = [];
  const lerp = (i0, j0, i1, j1) => { const a = F(i0, j0), b = F(i1, j1), t = a / (a - b || 1e-9); return [(x0 + i0 + (i1 - i0) * t) * g, (y0 + j0 + (j1 - j0) * t) * g]; };   // where the field crosses 0 along a cell edge
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {                                // marching squares: the cell's corners (clockwise from the north-west), its edge crossings paired by case
    const c = (F(i, j) > 0 ? 8 : 0) | (F(i + 1, j) > 0 ? 4 : 0) | (F(i + 1, j + 1) > 0 ? 2 : 0) | (F(i, j + 1) > 0 ? 1 : 0); if (!c || c === 15) continue;
    const E = [lerp(i, j, i + 1, j), lerp(i + 1, j, i + 1, j + 1), lerp(i, j + 1, i + 1, j + 1), lerp(i, j, i, j + 1)];   // north, east, south, west
    const T = [null, [[2, 3]], [[1, 2]], [[1, 3]], [[0, 1]], [[0, 3], [1, 2]], [[0, 2]], [[0, 3]], [[0, 3]], [[0, 2]], [[0, 1], [2, 3]], [[0, 1]], [[1, 3]], [[1, 2]], [[2, 3]]][c];
    for (const [a, b] of T) segs.push([E[a], E[b]]); }
  const by = new Map(); for (const s of segs) for (const [p, q] of [[s[0], s[1]], [s[1], s[0]]]) { const k = key(p[0], p[1]); if (!by.has(k)) by.set(k, []); by.get(k).push(q); }
  const used = new Set(), loops = [];                                                     // the segments joined end to end into loops
  for (const s of segs) { const k0 = key(s[0][0], s[0][1]); if (used.has(k0)) continue; const L = []; let p = s[0], guard = 0;
    while (p && guard++ < segs.length * 2) { const k = key(p[0], p[1]); if (used.has(k)) break; used.add(k); L.push(p); p = (by.get(k) || []).find(q => !used.has(key(q[0], q[1]))); }
    if (L.length >= 3) loops.push(L); }
  if (!loops.length) return [];
  let P = loops.reduce((a, L) => Math.abs(polyArea(L)) > Math.abs(polyArea(a)) ? L : a); if (polyArea(P) < 0) P = P.slice().reverse();   // the biggest loop, wound as plateOutline winds
  P = polySimplify(P, PL_BRUSH.simp);
  const rnd = plateRng(seed); return P.map(([x, y]) => [x + rnd(-0.5, 0.5) * 0.12, y + rnd(-0.5, 0.5) * 0.08]);
}
// a closed run of points with every point within tol of the run through the ones kept (Douglas-Peucker, split at the two furthest apart)
function polySimplify(P, tol) {
  if (P.length < 6) return P; let b = 1, best = 0; for (let i = 0; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]); if (d > best) { best = d; b = i; } }
  const Q = P.concat([P[0]]), dp = (i0, i1) => { const [ax, ay] = Q[i0], [bx, by] = Q[i1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9; let far = -1, fd = tol; for (let i = i0 + 1; i < i1; i++) { const d = Math.abs((Q[i][0] - ax) * dy - (Q[i][1] - ay) * dx) / L; if (d > fd) { fd = d; far = i; } } return far < 0 ? [i0] : dp(i0, far).concat(dp(far, i1)); };
  return dp(0, b).concat(dp(b, Q.length - 1)).map(i => Q[i]);
}
const plateIn = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
// a plate less a ring that crosses its outline (222): the plate's outline with a notch cut out of it (or in pieces, if
// the ring runs right through), so the notch's walls are the plate's own faces and every edge meets (Ross: the pit's
// walls stopped short of the slab's edge). Weiler-Atherton for A less B, both simple; the pieces keep A's winding.
const polyArea = P => { let a = 0; for (let i = 0; i < P.length; i++) { const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
function polyDiff(A, B) {
  if ((polyArea(A) > 0) !== (polyArea(B) > 0)) B = B.slice().reverse();                  // (B wound as A is: walked backwards inside A)
  const X = [], na = A.length, nb = B.length;
  for (let i = 0; i < na; i++) { const [ax, ay] = A[i], [bx, by] = A[(i + 1) % na];
    for (let j = 0; j < nb; j++) { const [cx, cy] = B[j], [dx, dy] = B[(j + 1) % nb], den = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (Math.abs(den) < 1e-12) continue;
      const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / den, u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / den;
      if (t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9) X.push({ i, t, j, u, p: [ax + (bx - ax) * t, ay + (by - ay) * t] }); } }
  if (X.length < 2) return plateIn(B, A[0][0], A[0][1]) && !X.length ? [] : [A];          // (no crossing: wholly inside B, or untouched; a hole inside A is drawn as a hole)
  const list = (P, n, key, tk) => { const L = []; for (let i = 0; i < n; i++) { L.push({ p: P[i] }); X.filter(x => x[key] === i).sort((a, b) => a[tk] - b[tk]).forEach(x => L.push({ p: x.p, x })); } return L; };
  const LA = list(A, na, 'i', 't'), LB = list(B, nb, 'j', 'u');
  LA.forEach((n, k) => { if (n.x) n.x.a = k; }); LB.forEach((n, k) => { if (n.x) n.x.b = k; });
  let inside = plateIn(B, A[0][0], A[0][1]); for (const n of LA) if (n.x) { inside = !inside; n.x.out = !inside; }   // out: past it, A runs outside B
  const out = [], done = new Set();
  for (const s0 of X) { if (!s0.out || done.has(s0)) continue; const P = []; let cur = s0, guard = 0;
    while (guard++ < 4 * (na + nb)) { done.add(cur); P.push(cur.p);
      let k = cur.a; for (;;) { k = (k + 1) % LA.length; const n = LA[k]; if (n.x) { cur = n.x; break; } P.push(n.p); }   // along A, outside B, to where it goes in
      done.add(cur); P.push(cur.p);
      k = cur.b; for (;;) { k = (k - 1 + LB.length) % LB.length; const n = LB[k]; if (n.x) { cur = n.x; break; } P.push(n.p); }   // back along B, inside A, to where A comes out
      if (cur === s0) break; }
    if (P.length >= 3) out.push(P); }
  return out.length ? out : [A];
}
// a tunnel's strip (222): a spine in tiles and a width, as a ring (one side out, the other back)
function tunnelRing(spine, w) {
  const L = [], R = [], n = spine.length;
  for (let i = 0; i < n; i++) { const [x0, y0] = spine[Math.max(0, i - 1)], [x1, y1] = spine[Math.min(n - 1, i + 1)], d = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / d * w / 2, ny = (x1 - x0) / d * w / 2, [x, y] = spine[i]; L.push([x + nx, y + ny]); R.push([x - nx, y - ny]); }
  return L.concat(R.reverse());
}
const plateHas = (p, x, y) => plateIn(p.P, x, y);                                       // the one shape: inside this plate's outline (and so on it, or held off its face)
const plateKind = thick => thick <= 0.25 ? 'step' : thick <= 0.5 ? 'hop' : thick <= 1 ? 'high' : 'face';
const plateTop = p => p.base + p.thick;
const plateBox = P => { const xs = P.map(q => q[0]), ys = P.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
// one plate from its spec (a layout's line): its outline from its seed and turn, or a brush slab's from its stroke
// (kind 'brush': pts, r); under is set by plateLayout
const plateAdd = (pl, s) => {
  const brush = s.kind === 'brush', P = brush ? brushOutline(s.pts, s.r, s.seed) : plateOutline(s.x, s.y, s.w, s.h, s.seed, PL_N, s.rot || 0), b = plateBox(P.length ? P : [[s.x || 0, s.y || 0]]);   // (a brush slab: its outline from its stroke's points and radius; its middle and size are what that comes to)
  const p = { x: brush ? (b[0] + b[2]) / 2 : s.x, y: brush ? (b[1] + b[3]) / 2 : s.y, w: brush ? b[2] - b[0] : s.w, h: brush ? b[3] - b[1] : s.h, seed: s.seed, base: s.base || 0, thick: s.thick, tone: s.tone || PL_TONE, rot: s.rot || 0, under: null, brush, P }; pl.list.push(p); return p; };
// a screen's layout laid: LAYOUTS[id] (src/layouts/<id>.js), or the editor's working copy of it while it is being edited
function plateLayout(pl, id) {
  const L = state.edit && state.edit.id === id ? state.edit.layout : LAYOUTS[id]; if (!L) return;
  const ps = (L.plates || []).map(s => plateAdd(pl, s)); ps.forEach((p, i) => { p.li = i; const u = L.plates[i].under; p.under = u >= 0 && ps[u] && ps[u] !== p ? ps[u] : null; });   // (li: its line in the layout; the list's own order is the painter's, platesLay)
  for (const q of L.pits || []) platePit(pl, q.x, q.y, q.w, q.h, q.seed, q.floor, q.ledge);
  for (const t of L.tunnels || []) if (t.spine && t.spine.length >= 2) pl.pits.push({ tunnel: true, spine: t.spine, w: t.w, floor: t.floor, roof: t.roof, ledge: 0, P: tunnelRing(t.spine, t.w) });   // (a tunnel is a pit with a roof: the plates between its floor and its roof are cut along its strip, the ones over it stay)
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
// what a screen laid, worked out once: each pit's cut plates (the ones containing its middle from its floor up), its
// floor and its top lip, each plate's pieces and holes; then the painter's order (platesOrder), worked out again
// whenever the view turns (224: the editor's camera; m.pl.yaw is the turn it was worked out for)
function platesLay(m) {
  const yaw = state.mtn && state.mtn.m === m ? state.mtn.yaw || 0 : 0;
  if (m.pl) { if (m.pl.yaw !== yaw) platesOrder(m.pl, yaw); return m.pl; }
  const pl = { list: [], pits: [], seams: [], tone: m.plateTone || 143, yaw: null }; m.plates(pl);
  for (const p of pl.list) { p.box = plateBox(p.P); p.kind = plateKind(p.thick); }
  for (const q of pl.pits) { q.cut = pl.list.filter(p => p.base >= q.floor - 0.01 && plateTop(p) > q.floor + 0.01 && (q.roof == null || p.base < q.roof - 0.01) && (q.P.some(([x, y]) => plateHas(p, x, y)) || p.P.some(([x, y]) => plateIn(q.P, x, y))));   // every plate the ring crosses, from its floor up
    q.top = q.cut.length ? Math.max(...q.cut.map(plateTop)) : q.floor; q.box = plateBox(q.P);
    q.ring = new Map(); let R = q.P;                                                       // each cut plate's own ring: the top one the whole ring, each one down cut back by the ledge
    for (const p of q.cut.slice().sort((a, b) => plateTop(b) - plateTop(a))) { q.ring.set(p, R); if (q.ledge > 0) { const ax = Math.max(...R.map(v => v[0])), ay = Math.min(...R.map(v => v[1])), ny = Math.max(...R.map(v => v[1])), f = Math.max(0.2, 1 - q.ledge / Math.max(0.01, ny - ay)); R = R.map(([x, y]) => [ax + (x - ax) * f, ay + (y - ay) * f]); } } }
  // each plate's shape on the screen (222): its outline less every ring that crosses it (the pieces, O), and the rings
  // wholly inside it (holes, drawn as holes); a plate a ring swallows has no pieces
  for (const p of pl.list) { let O = [p.P]; p.holes = [];
    for (const q of pl.pits) { if (!q.ring.has(p)) continue; const R = q.ring.get(p);
      O = O.flatMap(P => { const D = polyDiff(P, R); if (D.length === 1 && D[0] === P && plateIn(P, R[0][0], R[0][1]) && !p.holes.includes(q)) p.holes.push(q); return D; }); }
    p.O = O; }
  platesOrder(pl, yaw);
  return (m.pl = pl);
}
// the painter's order, along the view's south (yaw: the view's turn, 0 in play; a tile's depth is mtnDepth, its place
// across the view mtnAcross): every plate's draw key (its foot's far edge, never before the one it stands on), then
// where plates overlap on the ground (217, Ross: a plate laid partly inside another showed the other's wall over it):
// what stands on a plate comes after it, a plate wholly above another's top comes after it, and two that share height
// are ordered by whose foot lies further south where they overlap, not by their whole outline; the keys are then
// nudged so the list's order holds (a key never moves north). fkey is the faces' turn; key the top's, by height
function platesOrder(pl, yaw) {
  const c = { yaw }, L = pl.list;
  for (const p of L) { p.key = undefined; let a0 = Infinity, a1 = -Infinity, d1 = -Infinity; p.D = p.P.map(([x, y]) => { const a = mtnAcross(x, y, c), d = mtnDepth(x, y, c); if (a < a0) a0 = a; if (a > a1) a1 = a; if (d > d1) d1 = d; return [a, d]; }); p.dbox = [a0, d1, a1]; }   // (its outline turned: across, depth; its span across and its far edge)
  const keyOf = (p, d = 0) => p.key !== undefined ? p.key : (p.key = Math.max(p.dbox[1], p.under && d < 64 ? keyOf(p.under, d + 1) + 1e-3 : -Infinity));
  for (const p of L) keyOf(p);
  const unders = p => { const S = new Set(); for (let u = p.under, d = 0; u && d < 64; u = u.under, d++) S.add(u); return S; }, UN = new Map(L.map(p => [p, unders(p)]));
  const localS = (p, a0, a1) => { let m = -Infinity; for (const [a, d] of p.D) if (a >= a0 && a <= a1 && d > m) m = d; return m === -Infinity ? p.dbox[1] : m; };
  const before = (a, b) => { if (UN.get(b).has(a)) return true; if (UN.get(a).has(b)) return false;                  // a is painted before b (only asked of two that overlap on the ground)
    if (a.base >= plateTop(b) - 1e-6) return false; if (b.base >= plateTop(a) - 1e-6) return true;
    const a0 = Math.max(a.dbox[0], b.dbox[0]), a1 = Math.min(a.dbox[2], b.dbox[2]), d = localS(a, a0, a1) - localS(b, a0, a1); return Math.abs(d) > 0.05 ? d < 0 : a.key < b.key; };
  const after = new Map(L.map(p => [p, new Set()]));                                          // what must come after each plate
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j]; if (!(a.box[0] < b.box[2] && b.box[0] < a.box[2] && a.box[1] < b.box[3] && b.box[1] < a.box[3])) continue; if (before(a, b)) after.get(a).add(b); else after.get(b).add(a); }
  const out = [], left = new Set(L);                                                           // then from the far side: the plate nothing left must precede, the furthest of those (a cycle, if a layout makes one, just takes the furthest)
  while (left.size) { let pick = null; for (const p of left) if (![...left].some(q => q !== p && after.get(q).has(p)) && (!pick || p.key < pick.key)) pick = p; if (!pick) for (const p of left) if (!pick || p.key < pick.key) pick = p; out.push(pick); left.delete(pick); }
  pl.list = out;
  let prev = -Infinity; for (const p of pl.list) { p.fkey = Math.max(p.key, prev + 1e-3); prev = p.fkey; }   // the faces' turn
  const byTop = pl.list.slice().sort((a, b) => (plateTop(a) - plateTop(b)) || (a.fkey - b.fkey)); byTop.forEach((p, i) => { p.key = PL_TOPKEY + i; });   // the tops' turn: by height (equal tops by the ground order), all after everything on the ground
  for (const q of pl.pits) q.last = q.cut.reduce((a, p) => !a || p.key > a.key ? p : a, null);
  pl.yaw = yaw;
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
// the lip and south of it; plain (Ross, 220, still E): one flat shade each, lit by its facing from the west, nothing
// painted on it (no band under the lip, no strata, no set-in stones: the stones' feathered wash showed as light smears)
function platePaintFaces(T, F, tone) {
  const n = T.length, drawn = [];                                                        // (drawn: the edges painted, for tests/edit.js)
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, ex = T[j][0] - T[i][0], ey = T[j][1] - T[i][1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L, mx = (T[i][0] + T[j][0]) / 2, my = (T[i][1] + T[j][1]) / 2, fx = (F[i][0] + F[j][0]) / 2, fy = (F[i][1] + F[j][1]) / 2;
    if (!((fx - mx) * nx + (fy - my) * ny > 0.2 && fy > my + 0.2)) continue;
    const lit = mtnClamp(0.72 + 0.28 * (-nx) - 0.08 * ny, 0.5, 1);
    ctx.beginPath(); ctx.moveTo(T[i][0], T[i][1]); ctx.lineTo(T[j][0], T[j][1]); ctx.lineTo(F[j][0], F[j][1]); ctx.lineTo(F[i][0], F[i][1]); ctx.closePath(); ctx.fillStyle = plRgb(tone * 0.78 * lit); ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke(); drawn.push(i); }   // (stroked in its own colour: no hairline between neighbours)
  return drawn;
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
  for (let y = by0; y < by1; y += 8) for (let x = bx0; x < bx1; x += 8) { const x1 = Math.min(bx1, x + 8), y1 = Math.min(by1, y + 8), C = [pr(x, y, 0), pr(x1, y, 0), pr(x, y1, 0), pr(x1, y1, 0)], A = Math.min(...C.map(v => v[0])), B = Math.max(...C.map(v => v[0])), Ay = Math.min(...C.map(v => v[1])), By = Math.max(...C.map(v => v[1])); if (B < X0 - 2 || A > X1 + 2 || By < -2 || Ay > H + 2) continue; plateLay(tex, p, x, y, x1, y1, pr, 0, true); }
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
// a cut layer down a pit (225, Ross: the cutout clean of everything but the hole's own depth shading): inside the rim
// its ledge keeps its own texture, no brink, lip or seam, and a dark wash deepens with how far below the rim it lies
// (PL_WASH); the floor (the base's ground inside the lowest ring) darkest; one lip, at the rim
const PL_WASH = [0.08, 0.45, 0.5];                                                        // the wash at the rim, how much more at the floor's depth; the floor's own
const plateRims = (pl, p, top) => pl.pits.filter(q => !q.tunnel && q.ring.has(p) && q.top > top + 1e-6);   // the pits this plate is a lower layer of (their rims above its top)
const pitDepth = (q, z) => (q.top - z) / Math.max(0.01, q.top - q.floor);                // 0 at the rim, 1 at the floor
function plateTopPaint(m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), Os = p.O.map(O => O.map(([x, y]) => pr(x, y, top))), rims = plateRims(pl, p, top);
  if (!Os.length) return;
  const pieces = () => { ctx.beginPath(); for (const T of Os) T.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.clip(); for (const q of p.holes) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); q.ring.get(p).forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.clip('evenodd'); } };   // (its pieces: a ring that crosses its edge is cut out of its outline; a ring inside it is a hole)
  const rimPath = q => plPath(q.P.map(([x, y]) => pr(x, y, top)));
  const tex = plateTex(p, m), lay = () => { if (tex) plateLay(tex, p, p.box[0], p.box[1], p.box[2], p.box[3], pr, top); else { ctx.fillStyle = plRgb(p.tone); ctx.fillRect(-W, -H, W * 3, H * 3); } };
  ctx.save(); if (rims.length) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); for (const q of rims) q.P.forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.clip('evenodd'); }   // outside every rim above it: as any top
  ctx.save(); pieces(); lay(); for (const sm of pl.seams) platePaintSeam(sm, top, null, [], pr, us); ctx.restore();
  for (const T of Os) { ctx.save(); plPath(T); ctx.clip(); platePaintBrink(T, us); ctx.restore(); platePaintLip(T, s); }
  ctx.restore();
  for (const q of rims) { ctx.save(); pieces(); rimPath(q); ctx.clip(); lay(); ctx.fillStyle = 'rgba(18,18,16,' + (PL_WASH[0] + PL_WASH[1] * pitDepth(q, top)).toFixed(2) + ')'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }   // inside a rim: its ledge, textured, under the depth's wash
}
// the screen box of what a plate paints (its top ring and its foot ring)
const plateScreenBox = (p, pr) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of p.P) for (const z of [p.base, plateTop(p)]) { const [X, Y] = pr(x, y, z); if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; } return [x0, y0, x1, y1]; };
// a plate is painted in two passes (220): its faces at its foot's turn (fkey: the painter's order on the ground, so a
// slab in front covers the wall behind it), its top, lip and the hole through it at its top's turn (key: by the top's
// height, the taller after the shorter, so a taller slab's edge covers a shorter one wherever they overlap on the
// screen: the eye is over you, and what is higher is nearer it)
function drawPlateFaces(m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p);
  for (const q of pl.pits) if (q.tunnel && p.base >= q.roof - 0.01 && p.box[0] < q.box[2] && q.box[0] < p.box[2] && p.box[1] < q.box[3] && q.box[1] < p.box[3]) {   // over a tunnel: the passage under it in shadow (seen through its mouths)
    ctx.save(); plPath(p.P.map(([x, y]) => pr(x, y, q.floor))); ctx.clip(); plPath(q.P.map(([x, y]) => pr(x, y, q.floor))); ctx.fillStyle = 'rgba(10,10,12,.62)'; ctx.fill(); ctx.restore(); }
  for (const O of p.O) { const T = O.map(([x, y]) => pr(x, y, top)), F = O.map(([x, y]) => pr(x, y, p.base)); if (plOn(T, us * 2) || plOn(F, us * 2)) platePaintFaces(T, F, p.tone); }   // (each piece's own walls: a notch's sides included)
}
function drawPlate(m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top));
  if (!plOn(T, us * 2)) return;
  const cuts = p.holes, ring = (q, z) => q.ring.get(p).map(([x, y]) => pr(x, y, z));       // (a hole wholly inside it; a ring across its edge is a notch, its walls the faces)
  plateTopPaint(m, p, pr, s);
  for (const q of cuts) { const R = ring(q, top), B = ring(q, p.base), n = R.length, rim = q.top <= top + 1e-6, d = pitDepth(q, top);
    ctx.save(); plPath(T); ctx.clip(); plPath(R); ctx.clip();
    let cx = 0, cy = 0; for (const [X, Y] of R) { cx += X / n; cy += Y / n; }
    if (!q.tunnel && p.base <= q.floor + 0.01) { plPath(B); ctx.fillStyle = 'rgba(18,18,16,' + PL_WASH[2] + ')'; ctx.fill(); }   // the floor, darkest (before the hero's box is left out: he stands on it)
    plateBehindHero(p, top);                                                                // (down this pit below this plate: its far walls are behind you)
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mx = (R[i][0] + R[j][0]) / 2, my = (R[i][1] + R[j][1]) / 2, bx = (B[i][0] + B[j][0]) / 2, by = (B[i][1] + B[j][1]) / 2;
      if ((bx - mx) * (cx - mx) + (by - my) * (cy - my) <= 0.2) continue;                  // the far walls: their foot lies in toward the hole's middle
      const ex = R[j][0] - R[i][0], ey = R[j][1] - R[i][1], L = Math.hypot(ex, ey) || 1; let nx = ey / L; if ((mx - cx) * nx + (my - cy) * (-ex / L) > 0) nx = -nx;
      const lit = mtnClamp(0.86 + 0.1 * (-nx), 0.8, 0.96), g = plRgb(p.tone * 0.8 * lit * (1 - 0.3 * d));   // (a pit's walls plain, no shade over the hole: Ross, 220; darker the deeper, 225)
      ctx.beginPath(); ctx.moveTo(R[i][0], R[i][1]); ctx.lineTo(R[j][0], R[j][1]); ctx.lineTo(B[j][0], B[j][1]); ctx.lineTo(B[i][0], B[i][1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.restore();
    if (rim) { ctx.save(); plPath(T); ctx.clip(); platePaintLip(R, s); ctx.restore(); } }   // the one lip: the rim's (no brink inside it, no line at a layer's base: 225)
}
// System > Show tiles on a plates screen: the tiles lightened by the ground's height there (a pit is dark again)
function drawPlateTiles(m, pr) {
  const pl = platesLay(m), h = state.hero, hx = h.x / UNIT, x0 = Math.max(0, Math.floor(hx - 14)), x1 = Math.min(m.len, Math.ceil(hx + 14));
  for (let y = 0; y < m.D; y++) for (let x = x0; x < x1; x++) { const z = plateTopAt(pl, x + 0.5, y + 0.5); if (z <= 0) continue; const c = [pr(x, y, z), pr(x + 1, y, z), pr(x + 1, y + 1, z), pr(x, y + 1, z)]; plPath(c); ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, 0.12 + z * 0.1).toFixed(2) + ')'; ctx.fill(); }
}
