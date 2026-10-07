// ===== plates.js: the mountain's stone is a PLATE (build 212, docs/mountain-plan.md "Plates"): a worn squarish
// outline in tiles (plateOutline: a superellipse's twelve points, two rounds of corner-cutting, a small wobble), a
// base and a thickness in tiles above the scene's base plate. One shape for drawing and collision (plateHas). Drawn
// with the mountain's one projection (mtnProj: the rise's tilt and zoom, then the eye's push-out from the screen's
// centre, 1 + z / m.eye). What a screen lays (m.plates, at mtnLand) becomes m.pl: plates, pits and seams.
// - the look (235, docs/parked/mock-epic-*.js, Ross 7 Oct: married to the ground, nature's lines, no right angles,
//   inner walls like outer, tops as tops, seamless stacks): every outline roughened at three scales with bites
//   (roughRing, baked once, the same shape for collision); faces on the edges whose foot lies outward of the lip and
//   south of it (faces north only, Ross 2 Oct), one gradient each straight down the screen (plateWall: the crown lit,
//   the stone, the foot battered outward and grading into what it stands on: the ground's colour, or the top under
//   it); tops take the ground's colour under them (PL_GROUND of mtnColor), the shoulder darkening into the rim (scaled
//   by the slab) and the lip as tapering broken runs, all baked into the top's texture; the contact (a soft shadow on
//   the ground and scree) only at a foot on the base and under crags and boulders, baked into the base's texture;
//   a pit's walls painted by the same rule, occluded by depth; cracks taper to points; base seams taper and branch.
// - the base: one plate under the scene, its surface the slope and the generator's bumps (the ground's own rows,
//   their lean shading), the same texture denser as a wash over them (no fill of its own), loose stones lying on it,
//   laid in chunks of a few tiles and running PL_MARGIN tiles past the scene's edges so no edge of it shows.
// - pits: a hole through every plate above its floor; the tops cut at their own heights; one wall from the floor to
//   the top lip, lit by its own shade (0.8 to 0.96) and darker the deeper; inside the rim the ledges keep their
//   texture under a wash that deepens with depth, the floor darkest, one lip at the rim and nothing else (225).
//   Nothing of a hole is painted outside its lip.
// - cracks (231): drawn on the base, a hairline on the base only; drawn on a layer, a slit down through every layer
//   under it to the base, wider the deeper (plateCrack), a plate laid over it spanning it.
// Kinds by thickness (plateKind): step up to 0.25, hop to 0.5, high hop to 1, face over 1. Until layered ground lays the
// ground in layers, every plate but the hero's holds (plateHold: the foot ring is a wall, as the mountain is).
// What a screen lays comes from its layout (LAYOUTS[id], src/layouts/<id>.js, laid in the editor: edit.js, 215):
// plates each { x, y, w, h, seed, base, thick, tone, rot, under } or a brush slab { kind: 'brush', strokes: [{ pts, r }],
// plates: [{ x, y, w, h, seed, rot }], seed, base, thick, tone, under } (227, merged 228: brushOutline), pits { x, y, w, h, seed, floor, ledge }, tunnels
// { spine, w, floor, roof } (222), seams { spine, top } (a crack on the layer whose top is top; 0 the base), ravines { spine, w, depth, top, seed } (232). plateLayout reads it (the editor's working copy while that screen is being edited).

const LAYOUTS = {};                                                                     // a screen's laid plates by scene id (src/layouts/<id>.js fills it)
let PL_HERO = null;                                                                     // down a pit: { pit, lift, box } (drawMtn sets it each frame: the far walls above you leave your box out)
const PL_PX = 40, PL_N = 12, PL_TONE = 134, PL_MARGIN = 8, PL_TEX = new Map();                                            // texture px per tile; outline points before the cutting; the first plate's grey
function plateRng(seed) { const R = mulberry32((Math.floor(seed * 7919) * 2654435761) >>> 0); return (a = 0, b = 1) => a + R() * (b - a); }
// a plate's outline in tiles: squarish (a superellipse), corners knocked, a jog or two; worn, not cut
function plateOutline(cx, cy, w, h, seed, n = PL_N, turn = 0, rough = PL_ROUGH.plate, bites = PL_ROUGH.bites) {   // rough, bites: how broken (235); a pit's ring gets less and no bites, its ledges are narrow                        // turn: the editor's R, radians: the finished outline turned rigidly about its middle (223: it was folded into the seed's skew, so it stretched the slab)
  const rnd = plateRng(seed), P = [], rot = rnd(-0.5, 0.5) * 0.35;
  for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rnd(-0.5, 0.5) * 0.25, ex = Math.cos(a), ey = Math.sin(a), rr = Math.pow(Math.pow(Math.abs(ex), 4) + Math.pow(Math.abs(ey), 4), -1 / 4), j = rnd(0.86, 1.1), px = ex * rr * w / 2 * j, py = ey * rr * h / 2 * j; P.push([cx + px * Math.cos(rot) - py * Math.sin(rot) * 0.5, cy + py * Math.cos(rot) + px * Math.sin(rot) * 0.5]); }
  let Q = P; for (let r = 0; r < 2; r++) { const R = []; for (let k = 0; k < Q.length; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % Q.length]; R.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } Q = R; }
  const ct = Math.cos(turn), st = Math.sin(turn);
  return roughRing(Q.map(([x, y]) => [x + rnd(-0.5, 0.5) * 0.12, y + rnd(-0.5, 0.5) * 0.08]).map(([x, y]) => [cx + (x - cx) * ct - (y - cy) * st, cy + (x - cx) * st + (y - cy) * ct]), seed, rough, PL_ROUGH.step, bites);   // (235: broken at three scales, with bites)
}
// a brush slab's outline (227, merged in 228): one outline for all its parts, the strips a round brush of radius r
// sweeps along each stroke's points and any plain plates it took in (a plate's outline from its own seed). The parts
// are rasterized on a quarter-tile grid (the field: the largest of each part's reach, r less the distance to a stroke,
// a plate's signed distance in), the boundary marched with each crossing interpolated along its cell edge, the loops
// joined, the biggest kept (parts that close round a hole leave it filled), the run simplified (Douglas-Peucker,
// PL_BRUSH.simp tiles) and then worn as plateOutline wears its points, from the seed. Rebuilt the same way from the same
// parts and seed at every load. parts: { strokes: [{ pts, r }], plates: [{ x, y, w, h, seed, rot }] }
const PL_BRUSH = { g: 0.25, simp: 0.05, min: 0.3, max: 4 };                             // the grid step; the simplifying tolerance; the brush's smallest and largest radius
const segDist = (x, y, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = mtnClamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1e-9)); return Math.hypot(x - ax - dx * t, y - ay - dy * t); };
const PL_BRUSHC = new Map();                                                              // outlines by their parts and seed, each worked out once (229: a relay redid every brush slab's outline, 300 ms for a big one)
function brushOutline(parts, seed) {
  const strokes = (parts.strokes || []).filter(s => s.pts && s.pts.length), plates = parts.plates || []; if (!strokes.length && !plates.length) return [];
  const [ox, oy] = strokes.length ? strokes[0].pts[0] : [plates[0].x, plates[0].y], rel = JSON.stringify([seed, strokes.map(st => [st.r, st.pts.map(([x, y]) => [+(x - ox).toFixed(3), +(y - oy).toFixed(3)])]), plates.map(q => [+(q.x - ox).toFixed(3), +(q.y - oy).toFixed(3), q.w, q.h, q.seed, q.rot || 0])]);   // (moved as a whole, the same outline shifted)
  if (!PL_BRUSHC.has(rel)) { if (PL_BRUSHC.size > 64) PL_BRUSHC.clear(); PL_BRUSHC.set(rel, brushTrace(strokes.map(st => ({ r: st.r, pts: st.pts.map(([x, y]) => [x - ox, y - oy]) })), plates.map(q => ({ ...q, x: q.x - ox, y: q.y - oy })), seed)); }
  return PL_BRUSHC.get(rel).map(([x, y]) => [x + ox, y + oy]);
}
function brushTrace(strokes, plates0, seed) {
  const plates = plates0.map(q => plateOutline(q.x, q.y, q.w, q.h, q.seed, PL_N, q.rot || 0));
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity; for (const { pts, r } of strokes) for (const [x, y] of pts) { X0 = Math.min(X0, x - r); Y0 = Math.min(Y0, y - r); X1 = Math.max(X1, x + r); Y1 = Math.max(Y1, y + r); } for (const P of plates) for (const [x, y] of P) { X0 = Math.min(X0, x); Y0 = Math.min(Y0, y); X1 = Math.max(X1, x); Y1 = Math.max(Y1, y); }
  const g = PL_BRUSH.g, x0 = Math.floor(X0 / g) - 1, y0 = Math.floor(Y0 / g) - 1, nx = Math.ceil(X1 / g) + 2 - x0, ny = Math.ceil(Y1 / g) + 2 - y0, W1 = nx + 1;
  const f = new Float32Array(W1 * (ny + 1)).fill(-1);                                      // the field, stamped part by part over only the cells each part reaches (positive inside; -1 is far outside)
  const stamp = (bx0, by0, bx1, by1, fn) => { const i0 = Math.max(0, Math.floor(bx0 / g) - x0), i1 = Math.min(nx, Math.ceil(bx1 / g) - x0), j0 = Math.max(0, Math.floor(by0 / g) - y0), j1 = Math.min(ny, Math.ceil(by1 / g) - y0); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const v = fn((x0 + i) * g, (y0 + j) * g), k = j * W1 + i; if (v > f[k]) f[k] = v; } };
  for (const { pts, r } of strokes) for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[Math.min(pts.length - 1, i + 1)]; if (i && i === pts.length - 1) continue; stamp(Math.min(ax, bx) - r - g, Math.min(ay, by) - r - g, Math.max(ax, bx) + r + g, Math.max(ay, by) + r + g, (x, y) => r - segDist(x, y, ax, ay, bx, by)); }   // each segment: its capsule
  for (const P of plates) { const b = plateBox(P); stamp(b[0] - g, b[1] - g, b[2] + g, b[3] + g, (x, y) => { let d = Infinity; for (let i = 0; i < P.length; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length], e = segDist(x, y, ax, ay, bx, by); if (e < d) d = e; } return plateIn(P, x, y) ? d : -d; }); }
  const F = (i, j) => f[j * (nx + 1) + i], key = (x, y) => (Math.round(x * 1e4) + ',' + Math.round(y * 1e4)), segs = [];
  const lerp = (i0, j0, i1, j1) => { const a = F(i0, j0), b = F(i1, j1), t = a / (a - b || 1e-9); return [(x0 + i0 + (i1 - i0) * t) * g, (y0 + j0 + (j1 - j0) * t) * g]; };   // where the field crosses 0 along a cell edge
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {                                // marching squares: the cell's corners (clockwise from the north-west), its edge crossings paired by case
    const c = (F(i, j) > 0 ? 8 : 0) | (F(i + 1, j) > 0 ? 4 : 0) | (F(i + 1, j + 1) > 0 ? 2 : 0) | (F(i, j + 1) > 0 ? 1 : 0); if (!c || c === 15) continue;
    const E = [lerp(i, j, i + 1, j), lerp(i + 1, j, i + 1, j + 1), lerp(i, j + 1, i + 1, j + 1), lerp(i, j, i, j + 1)];   // north, east, south, west
    const T = [null, [[2, 3]], [[1, 2]], [[1, 3]], [[0, 1]], [[0, 3], [1, 2]], [[0, 2]], [[0, 3]], [[0, 3]], [[0, 2]], [[0, 1], [2, 3]], [[0, 1]], [[1, 3]], [[1, 2]], [[2, 3]]][c];
    for (const [a, b] of T) segs.push([E[a], E[b]]); }
  const by = new Map(); for (const sg of segs) for (const [p, q] of [[sg[0], sg[1]], [sg[1], sg[0]]]) { const k = key(p[0], p[1]); if (!by.has(k)) by.set(k, []); by.get(k).push(q); }
  const used = new Set(), loops = [];                                                     // the segments joined end to end into loops
  for (const sg of segs) { const k0 = key(sg[0][0], sg[0][1]); if (used.has(k0)) continue; const L = []; let p = sg[0], guard = 0;
    while (p && guard++ < segs.length * 2) { const k = key(p[0], p[1]); if (used.has(k)) break; used.add(k); L.push(p); p = (by.get(k) || []).find(q => !used.has(key(q[0], q[1]))); }
    if (L.length >= 3) loops.push(L); }
  if (!loops.length) return [];
  let P = loops.reduce((a, L) => Math.abs(polyArea(L)) > Math.abs(polyArea(a)) ? L : a); if (polyArea(P) < 0) P = P.slice().reverse();   // the biggest loop, wound as plateOutline winds
  P = polySimplify(P, PL_BRUSH.simp);
  const rnd = plateRng(seed); return roughRing(P.map(([x, y]) => [x + rnd(-0.5, 0.5) * 0.12, y + rnd(-0.5, 0.5) * 0.08]), seed, PL_ROUGH.brush, PL_ROUGH.step, PL_ROUGH.bites);   // (235: roughened as a plate's outline is, a little more)
}
// a brush slab's parts from its layout line (a 227 line had one stroke as pts and r)
const brushParts = s => ({ strokes: s.strokes || (s.pts ? [{ pts: s.pts, r: s.r }] : []), plates: s.plates || [] });
// an open run of points with every point within tol of the run through the ones kept (Douglas-Peucker; a brush stroke at release)
function polyThin(P, tol) {
  if (P.length < 3) return P.map(q => q.slice()); const dp = (i0, i1) => { const [ax, ay] = P[i0], [bx, by] = P[i1]; let far = -1, fd = tol; for (let i = i0 + 1; i < i1; i++) { const d = segDist(P[i][0], P[i][1], ax, ay, bx, by); if (d > fd) { fd = d; far = i; } } return far < 0 ? [i0] : dp(i0, far).concat(dp(far, i1)); };
  return dp(0, P.length - 1).concat([P.length - 1]).map(i => P[i].slice());
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
// a ravine (232; angled edges 233, Ross: the rim falls away as a slope through the layers, you slide in, a jump gets
// out while the rim is within reach): laid with the ravine brush (X) on the layer its first point lands on, a strip
// W wide cut from that layer's top down by its depth (snapped down to the base of the lowest layer it enters: a cut
// never stops inside a slab). Inside the strip the ground is a V: from the rim the height falls by 1/slope a tile
// inward (slope: the run per tile of depth, 1 is 45 degrees) until it reaches the floor, or the spine, whichever
// comes first (ravineH: one shape for collision and the drawing). The slope cuts every layer it crosses, each layer's
// edge a line across it. The cut is a tunnel-like pit (its roof just over the layer: plates laid over it span it).
// Rebuilt from its line { spine, w, depth, slope, top, seed } at every load. The 232 terraces are gone (this is the
// better answer to the same question)
const PL_RAV = { slope: 1, slide: 0.7, pull: 9, climb: 0.45, wMin: 0.6, wMax: 6, dMin: 0.2, dMax: 4, sMin: 0.15, sMax: 3 };   // slide: the grade (rise per run) past which you slide; pull: the downhill pull, tiles a second a second per unit grade; climb: how much of your walk is left going uphill on a grade of 1
function plateRavine(pl, rv, li) {
  const spine = rv.spine.map(q => [q[0], q[1]]), top = rv.top || 0, W = rv.w; if (spine.length < 2 || W <= 0) return;
  const strip = roughRing(capsuleRing(spine, W), rv.seed * 3 + 1, 1, 0.35), across = p => p.P.some(([x, y]) => plateIn(strip, x, y)) || strip.some(([x, y]) => plateHas(p, x, y));
  let floor = Math.max(0, top - rv.depth); for (let k = 0; k < 8; k++) { const p = pl.list.find(p => across(p) && p.base < floor - 1e-6 && plateTop(p) > floor + 1e-6); if (!p) break; floor = p.base; }   // (snapped down to a layer's base)
  const D = top - floor; if (D <= 1e-6) return;
  pl.pits.push({ tunnel: true, crack: true, rav: li, spine, w: W, top0: top, floor, roof: top + 1e-3, ledge: 0, P: strip, box: plateBox(strip), depth: D, slope: rv.slope || PL_RAV.slope });
}
const ravIn = (q, x, y) => x >= q.box[0] && x <= q.box[2] && y >= q.box[1] && y <= q.box[3] && plateIn(q.P, x, y);   // (its box first: the strip's ring is long)
// the distance from a point to a ravine's spine
const spineDist = (q, x, y) => { let d = Infinity; const S = q.spine; for (let i = 1; i < S.length; i++) { const e = segDist(x, y, S[i - 1][0], S[i - 1][1], S[i][0], S[i][1]); if (e < d) d = e; } return d; };
// the ground inside a sloped ravine at a point: the rim's height less the fall over the distance in from the rim
// the slope under a point, if it stands on a sloped ravine's side (not its floor, not a slab's top): its grade (rise
// per run) and the uphill direction (away from the spine), or null
function ravineSlope(pl, x, y) {
  for (const q of pl.pits) { if (!q.slope || !q.cut.length || !ravIn(q, x, y)) continue; const hr = ravineH(q, x, y); if (hr <= q.floor + 1e-6 || hr < plateTopAt(pl, x, y, null, false) - 1e-6) continue;
    const S = q.spine; let bd = Infinity, bx = x, by = y; for (let i = 1; i < S.length; i++) { const [ax, ay] = S[i - 1], [cx, cy] = S[i], dx = cx - ax, dy = cy - ay, t = mtnClamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1e-9)), qx = ax + dx * t, qy = ay + dy * t, d = Math.hypot(x - qx, y - qy); if (d < bd) { bd = d; bx = qx; by = qy; } }
    const L = Math.hypot(x - bx, y - by) || 1; return { g: 1 / q.slope, ux: (x - bx) / L, uy: (y - by) / L, q }; }
  return null;
}
const ravineH = (q, x, y) => { const d = Math.max(0, q.w / 2 - spineDist(q, x, y)); return Math.max(q.floor, q.top0 - d / q.slope); };
// a strip with round ends (233): a tunnelRing with a half circle at each end of the spine, so a ravine's V closes in a
// bowl at its ends rather than a square corner
function capsuleRing(spine, w) {
  const n = spine.length, R = tunnelRing(spine, w), half = R.length / 2, L = R.slice(0, half), Rr = R.slice(half), arc = (c, from, to, k = 7) => { const out = []; for (let i = 1; i < k; i++) { const a = from + (to - from) * i / k; out.push([c[0] + Math.cos(a) * w / 2, c[1] + Math.sin(a) * w / 2]); } return out; };
  const e = spine[n - 1], [ex, ey] = L[n - 1], a1 = Math.atan2(ey - e[1], ex - e[0]), s0 = spine[0], [sx, sy] = Rr[Rr.length - 1], a0 = Math.atan2(sy - s0[1], sx - s0[0]);
  return L.concat(arc(e, a1, a1 - Math.PI), Rr, arc(s0, a0, a0 - Math.PI));
}
// a ring roughened (234): resampled every PL_ROUGH.step and each point moved along its outward normal by noise at
// three scales (slow bulges, a mid wobble, a fine tooth), so an edge is broken the way a rock's is, never a drawn
// curve; the same shape then serves collision and drawing
const PL_ROUGH = { step: 0.18, slow: 0.16, mid: 0.06, fine: 0.025, plate: 1.3, brush: 1.6, bites: 3 }, plNoise = (t, seed) => Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 3.1 + seed * 1.3) * 0.3 + Math.sin(t * 7.3 + seed * 0.7) * 0.2;   // plate, brush: how much of it a plate's and a brush slab's outline get (a ravine's rim 1); bites: about how many bites in or spurs out a slab gets (235)
function roughRing(P, seed, amt = 1, step = PL_ROUGH.step, bites = 0) {
  const n = P.length, pts = []; for (let i = 0; i < n; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % n], L = Math.hypot(bx - ax, by - ay), k = Math.max(1, Math.round(L / step)); for (let j = 0; j < k; j++) { const t = j / k; pts.push([ax + (bx - ax) * t, ay + (by - ay) * t]); } }
  const m = pts.length, Q = [], rnd = plateRng(seed * 13 + 1), B = []; for (let b = 0; b < bites + Math.floor(rnd(0, 2)); b++) B.push([rnd(0, m), (rnd() < 0.5 ? -1 : 1) * rnd(0.25, 0.65) * amt / PL_ROUGH.plate, Math.max(2, (2 + rnd(0, 5)) * 0.18 / step)]);   // the bites: where, how deep (in or out, tiles), how wide (points)
  let s = 0; for (let i = 0; i < m; i++) { const [px, py] = pts[(i - 1 + m) % m], [nx, ny] = pts[(i + 1) % m], ex = nx - px, ey = ny - py, L = Math.hypot(ex, ey) || 1, ox = ey / L, oy = -ex / L; s += L / 2; let d = (plNoise(s * 0.5, seed) * PL_ROUGH.slow + plNoise(s * 1.6, seed + 5) * PL_ROUGH.mid + plNoise(s * 5.5, seed + 9) * PL_ROUGH.fine) * amt;
    for (const [at, dep, w] of B) { const dd = Math.min(Math.abs(i - at), m - Math.abs(i - at)); if (dd < w) d += dep * (1 - dd / w) * (1 - dd / w); }
    Q.push([pts[i][0] + ox * d, pts[i][1] + oy * d]); }
  return polyArea(Q) < 0 ? Q.reverse() : Q;
}
const plateHas = (p, x, y) => (!p.box || (x >= p.box[0] && x <= p.box[2] && y >= p.box[1] && y <= p.box[3])) && plateIn(p.P, x, y);   // the one shape: inside this plate's outline (and so on it, or held off its face); its box first (235: a roughened outline has a few hundred points)
const plateKind = thick => thick <= 0.25 ? 'step' : thick <= 0.5 ? 'hop' : thick <= 1 ? 'high' : 'face';
const plateTop = p => p.base + p.thick;
const plateBox = P => { const xs = P.map(q => q[0]), ys = P.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
// one plate from its spec (a layout's line): its outline from its seed and turn, or a brush slab's from its stroke
// (kind 'brush': pts, r); under is set by plateLayout
const plateAdd = (pl, s) => {
  const brush = s.kind === 'brush', P = brush ? brushOutline(brushParts(s), s.seed) : plateOutline(s.x, s.y, s.w, s.h, s.seed, PL_N, s.rot || 0), b = plateBox(P.length ? P : [[s.x || 0, s.y || 0]]);   // (a brush slab: its outline from its stroke's points and radius; its middle and size are what that comes to)
  const p = { x: brush ? (b[0] + b[2]) / 2 : s.x, y: brush ? (b[1] + b[3]) / 2 : s.y, w: brush ? b[2] - b[0] : s.w, h: brush ? b[3] - b[1] : s.h, seed: s.seed, base: s.base || 0, thick: s.thick, tone: s.tone || PL_TONE, rot: s.rot || 0, under: null, brush, P, box: b }; pl.list.push(p); return p; };
// a screen's layout laid: LAYOUTS[id] (src/layouts/<id>.js), or the editor's working copy of it while it is being edited
function plateLayout(pl, id) {
  const L = state.edit && state.edit.id === id ? state.edit.layout : LAYOUTS[id]; if (!L) return;
  const ps = (L.plates || []).map(s => plateAdd(pl, s)); ps.forEach((p, i) => { p.li = i; const u = L.plates[i].under; p.under = u >= 0 && ps[u] && ps[u] !== p ? ps[u] : null; });   // (li: its line in the layout; the list's own order is the painter's, platesLay)
  for (const q of L.pits || []) platePit(pl, q.x, q.y, q.w, q.h, q.seed, q.floor, q.ledge);
  for (const t of L.tunnels || []) if (t.spine && t.spine.length >= 2) pl.pits.push({ tunnel: true, spine: t.spine, w: t.w, floor: t.floor, roof: t.roof, ledge: 0, P: tunnelRing(t.spine, t.w) });   // (a tunnel is a pit with a roof: the plates between its floor and its roof are cut along its strip, the ones over it stay)
  (L.seams || []).forEach((sm, i) => plateCrack(pl, sm, i));
  (L.ravines || []).forEach((rv, i) => plateRavine(pl, rv, i));
}
// a pit: a ring punched straight down through every plate it crosses to floor (Ross: like punching out a hole; each
// plate shows its own cut face inside it). ledge (tiles): the way out, a staircase. Each plate down, the ring is cut
// back on its south and west sides by about that much (shrunk toward its north-east), so every plate under the top
// one keeps an L of its top inside the hole, a hop above the one below, and the floor lies on the far side, where the
// camera can see it (the view tips south: the near side of a deep hole is under its rim's overhang); from the floor
// you hop up them, south-west
const platePit = (pl, x, y, w, h, seed, floor, ledge = 0) => pl.pits.push({ x, y, floor, ledge, P: plateOutline(x, y, w, h, seed, 9, 0, 0.6, 0) });
// a crack (231, Ross: a crack belongs to the layer it is drawn on): on the base (top 0) a hairline, drawn on the base
// only (pl.seams: a plate over it spans it); drawn on a layer, a slit from that layer's top down to the base through
// every layer under it, its width by its depth (PL_CRACK: a tall stack gives a ravine), laid as a cut like a tunnel's
// (a pit with a roof just over the layer: plates at or above the roof are untouched). Under PL_SLIT wide you step
// over it (the ground ignores it); wider, you drop in. li: its line in the layout (the editor's pick)
const PL_CRACK = { w0: 0.25, perTile: 0.4, max: 2.0 }, PL_SLIT = 1.0, crackWidth = top => top > 0 ? +Math.min(PL_CRACK.max, PL_CRACK.w0 + PL_CRACK.perTile * top).toFixed(3) : 0;
function plateCrack(pl, sm, li) {
  const spine = sm.spine.map(q => [q[0], q[1]]), top = sm.top || 0;
  if (top <= 0 || spine.length < 2) { pl.seams.push({ spine, top: 0, li }); return; }
  const w = crackWidth(top); pl.pits.push({ tunnel: true, crack: true, li, spine, w, top0: top, floor: 0, roof: top + 1e-3, ledge: 0, P: crackRing(spine, w, li) });
}
// a crack's strip (235, Ross: no right angles): the spine resampled every half tile, the strip tapering to a point over
// its last tile and a half at each end, then roughened as every edge is; one shape for the cut and the drawing
function crackRing(spine0, w, seed) {
  const spine = []; for (let i = 1; i < spine0.length; i++) { const [ax, ay] = spine0[i - 1], [bx, by] = spine0[i], k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5)); for (let j = 0; j < k; j++) spine.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]); } spine.push(spine0[spine0.length - 1]);
  const n = spine.length, L = [], R = [], cum = [0]; let tot = 0; for (let i = 1; i < n; i++) { tot += Math.hypot(spine[i][0] - spine[i - 1][0], spine[i][1] - spine[i - 1][1]); cum.push(tot); }
  for (let i = 0; i < n; i++) { const [x0, y0] = spine[Math.max(0, i - 1)], [x1, y1] = spine[Math.min(n - 1, i + 1)], d = Math.hypot(x1 - x0, y1 - y0) || 1, t = Math.min(1, Math.min(cum[i], tot - cum[i]) / 1.5), k = w / 2 * (0.08 + 0.92 * Math.sqrt(t)), nx = -(y1 - y0) / d * k, ny = (x1 - x0) / d * k, [x, y] = spine[i]; L.push([x + nx, y + ny]); R.push([x - nx, y - ny]); }
  return roughRing(L.concat(R.reverse()), seed * 7 + 3, Math.min(1, w), 0.25);
}
// what a screen laid, worked out once: each pit's cut plates (the ones containing its middle from its floor up), its
// floor and its top lip, each plate's pieces and holes; then the painter's order (platesOrder), worked out again
// whenever the view turns (224: the editor's camera; m.pl.yaw is the turn it was worked out for)
function platesLay(m) {
  const yaw = state.mtn && state.mtn.m === m ? state.mtn.yaw || 0 : 0;
  if (m.pl) { if (m.pl.yaw !== yaw) platesOrder(m.pl, yaw); return m.pl; }
  const pl = { list: [], pits: [], seams: [], tone: m.plateTone || 143, yaw: null }; m.plates(pl);
  for (const p of pl.list) { p.box = plateBox(p.P); p.kind = plateKind(p.thick); p.tone += pl.tone - PL_TONE; }   // (235: tops in the ground's tone, a stack's own steps kept)
  for (const q of pl.pits) { q.cut = pl.list.filter(p => !(q.rav != null && p.rav === q.rav) && p.base >= q.floor - 0.01 && plateTop(p) > q.floor + 0.01 && (q.roof == null || p.base < q.roof - 0.01) && (q.P.some(([x, y]) => plateHas(p, x, y)) || p.P.some(([x, y]) => plateIn(q.P, x, y))));   // every plate the ring crosses, from its floor up
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
// nudged so the list's order holds (a key never moves north). fkey is the faces' turn; key the top's (229: in the
// ground order, later only for what it overlaps)
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
  // the tops' turn (229, Ross: a slab's top was painted over you standing south of it, and a stacked slab's walls lost
  // under the top it stands on: since 220 every top came after everything on the ground). A top keeps its place in the
  // ground order; only a plate it overlaps on the ground moves it later: worked out lowest first, a plate's walls come
  // after the top of every overlapping plate it stands at or above, its top after its walls and after the top of every
  // overlapping plate lower than it (equal tops by the ground order). So what stands south of a slab is drawn after it
  const ov = (a, b) => a.box[0] < b.box[2] && b.box[0] < a.box[2] && a.box[1] < b.box[3] && b.box[1] < a.box[3];
  const byTop = pl.list.slice().sort((a, b) => (plateTop(a) - plateTop(b)) || (a.fkey - b.fkey)), done = [];
  for (const p of byTop) { for (const q of done) if (ov(p, q)) { if (plateTop(q) <= p.base + 1e-6) p.fkey = Math.max(p.fkey, q.key + 1e-3); }
    p.key = p.fkey + 1e-4; for (const q of done) if (ov(p, q)) p.key = Math.max(p.key, q.key + 1e-3); done.push(p); }
  for (const q of pl.pits) q.last = q.cut.reduce((a, p) => !a || p.key > a.key ? p : a, null);
  pl.yaw = yaw;
}
const pitHas = (q, p, x, y) => !(q.crack && q.rav == null && q.w < PL_SLIT) && q.ring.has(p) && plateIn(q.ring.get(p), x, y);   // (a slit under PL_SLIT wide is stepped over: the ground ignores it)
// the ground's height in tiles above the base at a point: the top of the highest plate there, less the pits (0 off every plate)
function plateTopAt(pl, x, y, ok = null, rav = true) { let h = 0; for (const p of pl.list) if ((!ok || ok(p)) && plateHas(p, x, y) && !pl.pits.some(q => pitHas(q, p, x, y))) h = Math.max(h, plateTop(p));
  if (rav) for (const q of pl.pits) if (q.slope && q.cut.length && ravIn(q, x, y)) h = Math.max(h, ravineH(q, x, y)); return h; }   // (inside a sloped ravine: its V, from the rim down)   // (in a pit: whatever is left under the cut, its floor or a ledge; ok: only the plates it passes)
// the hero on the plates (213): his ground is the top of the plate he stands on (h.lift, tiles above the base). A
// plate no more than PL_STEP above it is walked up; a higher one is a wall unless he is in the air at or above its
// top, and then he lands on it; walking or jumping off an edge drops him to the ground below (in the air at the
// height he was). Build 214 adds the drop's numbers (a puff, a stagger, a heart), Pip and the camera's lift
const PL_STEP = 0.25, PL_BODY = 0.35, PL_HEAD = 1.1;                                     // a step you walk up; how far round your middle your body reaches (a wall stops it, not just your middle); your height: a plate whose underside is that far above your ground you walk under (217)
function plateStepHero(m, h) {
  const pl = platesLay(m), x = h.x / UNIT, y = h.y / UNIT;
  if (h.liftAt !== state.scene) { h.liftAt = state.scene; let c = 0; for (let k = 0; k < 4; k++) c = plateTopAt(pl, x, y, p => p.base < c + PL_HEAD); h.lift = c; h.plPrev = [h.x, h.y]; h.slideV = 0; }   // put down here: on the ground, then up whatever stands within head room of it (never on an overhang)
  const cur = h.lift, air = Math.max(0, h.z) / UNIT, up = T => T > cur + PL_STEP + 1e-6 && cur + air < T - 0.02;   // too high to walk up, and not above it in the air
  const under = p => p.base >= cur + PL_HEAD - 1e-6 && cur + air < plateTop(p) - 0.02, topAt = (x, y) => plateTopAt(pl, x, y, p => !under(p));   // an overhang clear of your head is passed under (unless you are in the air at or above its top: then you land on it)
  const body = (x, y) => { let t = plateTopAt(pl, x, y, p => !under(p), false); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; t = Math.max(t, plateTopAt(pl, x + Math.cos(a) * PL_BODY, y + Math.sin(a) * PL_BODY, p => !under(p), false)); } return t; };   // the highest ground under your body, not just your middle: no standing half inside a wall (the slabs only: a slope is not a wall)
  // a slope (233): the ground's grade where you stood; going up it you are slowed (or held, past PL_RAV.slide), and
  // it pulls you down it, faster the steeper, a slide that carries on a little; a jump is the way out while the rim is
  // within its reach
  const dt = state.dtLast || 1 / 60, [px, py] = h.plPrev || [h.x, h.y], sl = ravineSlope(pl, px / UNIT, py / UNIT) || ravineSlope(pl, x, y), g = sl ? sl.g : 0;   // (the slope where you stood, or the one you just stepped onto)
  if (g > 0.05 && h.z <= 0) { const { ux, uy } = sl, mx = h.x - px, my = h.y - py, upm = mx * ux + my * uy;   // (ux, uy: uphill)
    const steep = g >= PL_RAV.slide; if (upm > 0) { const keep = steep ? 0 : Math.max(0.2, 1 - PL_RAV.climb * g); h.x -= ux * upm * (1 - keep); h.y -= uy * upm * (1 - keep); }   // going up: slowed on a gentle side, held on a steep one
    h.slideV = steep ? Math.min(6, (h.slideV || 0) + g * PL_RAV.pull * dt) : upm > 0 ? 0 : Math.min(g * 1.5, (h.slideV || 0) + g * PL_RAV.pull * 0.35 * dt);   // a steep side: a slide that gathers; a gentle one: a drift down when you are not pushing up
    h.x -= ux * h.slideV * dt * UNIT; h.y -= uy * h.slideV * dt * UNIT; h.sliding = steep; }
  else { h.slideV = (h.slideV || 0) * 0.6; h.sliding = false; }
  const hx = h.x / UNIT, hy = h.y / UNIT;
  let T = topAt(hx, hy), wall = false; const was = h.plPrev ? body(px / UNIT, py / UNIT) : 0, into = (b) => up(b) && b > was + 1e-6;   // (a wall only stops you moving into it: stepping off a plate with your back against a higher one is fine)
  if (up(T) || into(body(hx, hy))) { wall = true;            // held: slide along the face if one axis is free
    if (!up(topAt(px / UNIT, hy)) && !into(body(px / UNIT, hy))) { h.x = px; h.vx = 0; } else if (!up(topAt(hx, py / UNIT)) && !into(body(hx, py / UNIT))) { h.y = py; h.vy = 0; } else { h.x = px; h.y = py; h.vx = h.vy = 0; }
    T = topAt(h.x / UNIT, h.y / UNIT); }
  if (T > cur) { h.z = Math.max(0, h.z - (T - cur) * UNIT); if (h.z <= 0) { h.z = 0; h.vz = Math.max(0, h.vz); if (h.vz === 0 && air > 0) spark(h.x, h.y + UNIT * 0.4, 'rgba(160,140,110,.8)', 4, 1.5); } }   // up a step, or landing on a top
  else if (T < cur) { if (cur - T < PL_STEP && h.z <= 0 && (g > 0.05 || ravineSlope(pl, h.x / UNIT, h.y / UNIT))) { /* down a slope: your feet stay on it */ } else { h.z += (cur - T) * UNIT; if (h.vz === 0) h.airDist = 0; } }   // off an edge: in the air, falling to the ground below
  h.lift = T; h.plPrev = [h.x, h.y];
  return wall;
}
// what stands on the plates is drawn after the plate it stands on: the key of the highest plate under a point at or
// below a height (drawMtn's list)
const plateKeyUnder = (pl, x, y, z) => { let k = pl.list.reduce((k, p) => plateTop(p) <= z + 1e-6 && plateHas(p, x, y) && !pl.pits.some(q => pitHas(q, p, x, y)) ? Math.max(k, p.key + 1e-3) : k, -Infinity);
  for (const q of pl.pits) if (q.slope && q.cut.length && ravIn(q, x, y)) { const low = q.cut.reduce((a, p) => !a || p.base < a.base ? p : a, null); if (low) k = Math.max(k, low.key + 1e-3); } return k; };   // (on a sloped ravine's side or floor: after the layer that draws its V)
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
// the lip (235, Ross: nature's lines are not crisp): not one stroke round the ring but runs that taper and lift, a
// heavier dark where the stone breaks and a light rim that comes and goes; on g (the screen, or a top's texture), R
// in g's px, s the stroke's scale, seeded so it never flickers
function platePaintLip(R, s, seed, g = ctx) { const n = R.length, rnd = plateRng(seed * 3 + 7); g.lineJoin = 'round'; g.lineCap = 'round';
  for (const [col, wk, dy, keep] of [['rgba(28,28,24,.75)', 2.2, 0, 0.85], ['rgba(225,222,200,.4)', 1.2, -1.6, 0.65]]) { let i = 0; g.strokeStyle = col; while (i < n) { if (rnd() > keep) { i += 2 + Math.floor(rnd(0, 4)); continue; } const len = 3 + Math.floor(rnd(0, 9));
      for (let k = 0; k < len && i + k < n; k++) { const t = k / len, w = wk * s * (0.4 + 0.9 * Math.sin(t * Math.PI)) * rnd(0.7, 1.3); g.lineWidth = Math.max(0.6, w); g.beginPath(); g.moveTo(R[(i + k) % n][0], R[(i + k) % n][1] + dy * s); g.lineTo(R[(i + k + 1) % n][0], R[(i + k + 1) % n][1] + dy * s); g.stroke(); } i += len + 1 + Math.floor(rnd(0, 3)); } } }
// the shoulder (235, no right angles): inside the rim the top darkens into the edge, so it rolls over into the face;
// scaled by the slab (sh: a hair on a stair ledge, the full roll on a cliff). On g, clipped to the ring by the caller
function platePaintShoulder(R, px, sh, g = ctx) { g.lineJoin = 'round';
  for (const [w, a] of [[0.7, 0.05], [0.42, 0.09], [0.2, 0.14], [0.08, 0.2]]) { g.strokeStyle = 'rgba(24,24,20,' + (a * sh).toFixed(3) + ')'; g.lineWidth = Math.max(1, w * px * sh); plPath(R, 0, g); g.stroke(); } }
// a colour string blended toward another (both 'rgb(r,g,b)')
const plBlend = (a, b, t) => { const A = a.match(/\d+/g).map(Number), B = b.match(/\d+/g).map(Number); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
// the ground's colour under a plate (mtnColor: the slope's shading and the stone by height at its middle), and its
// top's colour as it is painted (PL_GROUND of the ground's colour over its own tone: a slab on dark high ground is
// dark, one on the pale foot pale); worked out once a plate
const PL_GROUND = 0.55, plateGround = (m, p) => p.gcol || (p.gcol = mtnColor(m, p.x, p.y)), plateTopCol = (m, p) => plBlend(plRgb(p.tone), plateGround(m, p), PL_GROUND);
// the contact (235, Ross: married to the ground): a soft shadow on the ground round a foot ring that stands on the
// base (strokes outside it, each fainter and wider, offset south-east as the light falls from the north-west) and
// scree, pebbles and grit scattered along the foot; the same under a crag or boulder (a disc). Painted into the base
// plate's texture once (platesGround): nothing of it costs a frame. R in texture px; px a tile in them
function platePaintContact(g, R, px, seed, strength = 1) {
  g.lineJoin = 'round'; for (const [w, a, dx, dy] of [[1.1, 0.07, 0.25, 0.3], [0.7, 0.1, 0.18, 0.22], [0.35, 0.16, 0.1, 0.12], [0.14, 0.22, 0.04, 0.05]]) { g.strokeStyle = 'rgba(16,16,14,' + (a * strength).toFixed(3) + ')'; g.lineWidth = Math.max(1, w * px); plPath(R.map(([X, Y]) => [X + dx * px, Y + dy * px]), 0, g); g.stroke(); }
  const rnd = plateRng(seed * 7 + 1), n = R.length; let cx = 0, cy = 0; for (const [X, Y] of R) { cx += X / n; cy += Y / n; }
  for (let i = 0; i < n; i++) { const [x0, y0] = R[i], [x1, y1] = R[(i + 1) % n], L = Math.hypot(x1 - x0, y1 - y0) / px; let nx = (y1 - y0) / (L * px || 1), ny = -(x1 - x0) / (L * px || 1); if (((x0 + x1) / 2 - cx) * nx + ((y0 + y1) / 2 - cy) * ny < 0) { nx = -nx; ny = -ny; }   // (outward, whichever way the ring winds)
    for (let k = 0; k < L * 3 * strength; k++) { const t = rnd(), d = rnd() * rnd() * 0.5 + 0.05; plateScree(g, x0 + (x1 - x0) * t + nx * d * px, y0 + (y1 - y0) * t + ny * d * px, px * (0.03 + rnd() * 0.05 * (1.2 - d)), rnd); } }
}
const plateScree = (g, X, Y, r, rnd) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(X + 1, Y + 1, r, r * 0.65, 0, 0, 6.28); g.fill(); g.fillStyle = plRgb(118 + rnd() * 30); g.beginPath(); g.ellipse(X, Y, r, r * 0.65, 0, 0, 6.28); g.fill(); };
function platePropContact(g, X, Y, r, seed) { const gr = g.createRadialGradient(X + r * 0.3, Y + r * 0.15, r * 0.2, X + r * 0.3, Y + r * 0.15, r * 1.5); gr.addColorStop(0, 'rgba(16,16,14,.4)'); gr.addColorStop(1, 'rgba(16,16,14,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(X + r * 0.3, Y + r * 0.15, r * 1.5, r * 0.8, 0, 0, 6.28); g.fill();
  const rnd = plateRng(seed * 31 + 5); for (let k = 0; k < 10; k++) { const a = rnd() * 6.28, d = r * (0.9 + rnd() * 0.5); plateScree(g, X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.55 + r * 0.2, r * (0.04 + rnd() * 0.06), rnd); } }
// everything on the base's ground, into its texture: the contact under every foot on the base, and under every crag
// and boulder (the land's props: mtnLand). A stacked slab gets none (seamless stacks, Ross 7 Oct)
function platesGround(g, m, pl, box) {
  const px = PL_PX, X = x => (x - box[0]) * px, Y = y => (y - box[1]) * px;
  for (const p of pl.list) if (p.base <= 1e-6) platePaintContact(g, p.P.map(([x, y]) => [X(x), Y(y)]), px, p.seed, Math.min(1.4, 0.7 + p.thick * 0.3));
  const land = m.land; if (!land) return; for (const q of land.deco.concat(land.solids)) if (q.k === 'crag' || q.k === 'boulder') platePropContact(g, X(q.x), Y(q.y), q.r * px * (q.k === 'crag' ? 0.9 : 0.8), q.seed);
}
// a top's texture, painted once in tile space (PL_PX px a tile, the plate's box): its grey (the base's: the ground's
// own colour tile by tile, the lean's shading in it), tone drift, grit, pebbles, short cracks and the odd long one,
// lichen flakes; the base denser, with loose stones lying on it. Laid on the screen through the projection each frame
function plateTex(p, m) {
  if (p.tex !== undefined) return p.tex;
  const pl = platesLay(m), key = [p.base_ ? 'b' : 'p', p.seed, p.tone, (p.box[2] - p.box[0]).toFixed(3), (p.box[3] - p.box[1]).toFixed(3), p.base_ ? pl.list.filter(q => q.base <= 1e-6).map(q => q.seed + ':' + q.x.toFixed(2) + ':' + q.y.toFixed(2) + ':' + q.w.toFixed(2)).join() : p.rot + '|' + p.P.length + '|' + plateGround(m, p)].join('|');   // the same seed and size paint the same texture (the editor relays the plates at every change: a move keeps its top); the base's holds what stands on it (235), a top its ground's colour and its outline
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
      if (p.base_) platesGround(g, m, pl, p.box);                                           // the contact under every foot on it (235)
      else { const R = p.P.map(([x, y]) => [(x - x0) * PL_PX, (y - y0) * PL_PX]), sh = Math.min(1, Math.min(x1 - x0, y1 - y0) / 2.5);   // a top (235): the ground's colour over it, the shoulder inside its rim, the lip round it, all baked here: tops as tops
        g.fillStyle = plateGround(m, p); g.globalAlpha = PL_GROUND; g.fillRect(0, 0, wpx, hpx); g.globalAlpha = 1;
        g.save(); plPath(R, 0, g); g.clip(); platePaintShoulder(R, PL_PX, sh, g); g.restore(); platePaintLip(R, PL_PX / 40, p.seed, g); }
      tex = cv; } } catch (e) { tex = null; }
  if (tex) { if (PL_TEX.size > 40) PL_TEX.clear(); PL_TEX.set(key, tex); }
  return (p.tex = tex);
}
// the texture's tiles [x0, y0] to [x1, y1] laid on the screen between the three corners the projection gives (one
// affine a chunk: a few tiles of the base at a time, a whole top at once)
function plateLay(tex, p, x0, y0, x1, y1, pr, z, clip = false) {
  const [bx0, by0] = p.box, sw = (x1 - x0) * PL_PX, sh = (y1 - y0) * PL_PX, [X0, Y0] = pr(x0, y0, z), [X1, Y1] = pr(x1, y0, z), [X2, Y2] = pr(x0, y1, z);
  ctx.save(); if (clip) { plPath([[X0, Y0], [X1, Y1], pr(x1, y1, z), [X2, Y2]]); ctx.clip(); }   // (a base chunk: cut to its own quad, the whole texture drawn through it, so no edge texel blends with nothing and neighbours meet on one line)
  ctx.transform((X1 - X0) / sw, (Y1 - Y0) / sw, (X2 - X0) / sh, (Y2 - Y0) / sh, X0, Y0); ctx.drawImage(tex, -(x0 - bx0) * PL_PX, -(y0 - by0) * PL_PX); ctx.restore();
}
// one wall (235): a quad from the top edge Ti Tj to the foot Fi Fj, painted top to bottom through its stops (the
// crown lit, the stone, the foot), in one gradient straight down the screen; stroked in its own colour so no hairline
// shows between neighbours
function plateWall(Ti, Tj, Fi, Fj, stops) {
  const g = ctx.createLinearGradient(0, (Ti[1] + Tj[1]) / 2, 0, (Fi[1] + Fj[1]) / 2); for (const [t, c] of stops) g.addColorStop(t, c);
  ctx.beginPath(); ctx.moveTo(Ti[0], Ti[1]); ctx.lineTo(Tj[0], Tj[1]); ctx.lineTo(Fj[0], Fj[1]); ctx.lineTo(Fi[0], Fi[1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke();
}
// the faces: walls from the foot ring F to the top ring T (on the screen), on the edges whose foot lies outward of
// the lip and south of it, lit by their facing from the west; each (235, no right angles) its crown lit under the
// shoulder, the stone, and its foot battered outward (0.22 of its height) and grading into gc, the colour of what it
// stands on: the ground (and the talus baked under it), or the top of the slab under it (seamless stacks)
function platePaintFaces(T, F, tone, skip = null, gc = plRgb(tone * 0.72)) {
  const n = T.length, drawn = [];                                                        // (drawn: the edges painted, for tests/edit.js; skip: edges that are no wall, a sloped ravine's)
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (skip && skip(i, j)) continue; const ex = T[j][0] - T[i][0], ey = T[j][1] - T[i][1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L, mx = (T[i][0] + T[j][0]) / 2, my = (T[i][1] + T[j][1]) / 2, fx = (F[i][0] + F[j][0]) / 2, fy = (F[i][1] + F[j][1]) / 2;
    if (!((fx - mx) * nx + (fy - my) * ny > 0.2 && fy > my + 0.2)) continue;
    const lit = mtnClamp(0.72 + 0.28 * (-nx) - 0.08 * ny, 0.5, 1), bat = 0.22 * Math.max(1, fy - my), ox = nx * bat, oy = ny * bat + bat * 0.4;
    plateWall(T[i], T[j], [F[i][0] + ox, F[i][1] + oy], [F[j][0] + ox, F[j][1] + oy], [[0, plRgb(tone * 0.92 * lit)], [0.18, plRgb(tone * 0.78 * lit)], [0.7, plRgb(tone * 0.72 * lit)], [1, gc]]); drawn.push(i); }
  return drawn;
}
// a seam at one height, clipped to a top (or the base): the dark of the slit as wide as the crack, its east half
// darker; nothing outside its own width; stopped at every pit's rim at that height
function platePaintSeam(sm, z, clip, pits, pr, us) {
  ctx.save(); if (clip) { plPath(clip); ctx.clip(); }
  if (pits.length) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); for (const q of pits) { const R = q.P.map(([x, y]) => pr(x, y, z)); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); } ctx.clip('evenodd'); }
  const S0 = sm.spine, S = []; for (let i = 1; i < S0.length; i++) { const [ax, ay] = S0[i - 1], [bx, by] = S0[i], k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.6)); for (let j = 0; j < k; j++) S.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]); } S.push(S0[S0.length - 1]);
  const C = S.map(([x, y]) => pr(x, y, z)), n = C.length, rnd = plateRng((sm.li || 0) * 17 + 3); ctx.lineCap = 'round'; ctx.lineJoin = 'round';   // (235: the hairline tapers to nothing at its ends and throws a branch here and there; seeded, so it holds still)
  for (let i = 1; i < n; i++) { const t = (i - 0.5) / (n - 1), w = Math.max(0.8, 0.07 * us * Math.sin(t * Math.PI) * rnd(0.6, 1.4));
    ctx.strokeStyle = 'rgb(44,44,40)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(C[i - 1][0], C[i - 1][1]); ctx.lineTo(C[i][0], C[i][1]); ctx.stroke();
    ctx.strokeStyle = 'rgb(14,14,12)'; ctx.lineWidth = w * 0.5; ctx.beginPath(); ctx.moveTo(C[i - 1][0] + w * 0.25, C[i - 1][1]); ctx.lineTo(C[i][0] + w * 0.25, C[i][1]); ctx.stroke();
    if (rnd() < 0.35) { const a = Math.atan2(C[i][1] - C[i - 1][1], C[i][0] - C[i - 1][0]) + (rnd() < 0.5 ? 1 : -1) * rnd(0.6, 1.4), L = us * rnd(0.3, 1.2); ctx.strokeStyle = 'rgb(44,44,40)'; ctx.lineWidth = Math.max(0.6, w * 0.5); ctx.beginPath(); ctx.moveTo(C[i][0], C[i][1]); ctx.quadraticCurveTo(C[i][0] + Math.cos(a) * L * 0.5, C[i][1] + Math.sin(a) * L * 0.5 + 2, C[i][0] + Math.cos(a + 0.3) * L, C[i][1] + Math.sin(a + 0.3) * L); ctx.stroke(); } }   // a branch
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
  const pl = platesLay(m), top = plateTop(p), Os = p.O.map(O => O.map(([x, y]) => pr(x, y, top))), rims = plateRims(pl, p, top);
  if (!Os.length) return;
  const pieces = () => { ctx.beginPath(); for (const T of Os) T.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.clip(); for (const q of p.holes) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); q.ring.get(p).forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.clip('evenodd'); } };   // (its pieces: a ring that crosses its edge is cut out of its outline; a ring inside it is a hole)
  const rimPath = q => plPath(q.P.map(([x, y]) => pr(x, y, top)));
  const tex = plateTex(p, m), lay = () => { if (tex) plateLay(tex, p, p.box[0], p.box[1], p.box[2], p.box[3], pr, top); else { ctx.fillStyle = plRgb(p.tone); ctx.fillRect(-W, -H, W * 3, H * 3); } };
  ctx.save(); if (rims.length) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); for (const q of rims) q.P.forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.clip('evenodd'); }   // outside every rim above it: as any top
  ctx.save(); pieces(); lay(); ctx.restore();                                            // (no seam on a top since 231: a crack drawn on the base stays on the base; its shoulder and lip are in its texture, 235)
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
  for (const q of pl.pits) if (q.tunnel && !q.crack && p.base >= q.roof - 0.01 && p.box[0] < q.box[2] && q.box[0] < p.box[2] && p.box[1] < q.box[3] && q.box[1] < p.box[3]) {   // over a tunnel: the passage under it in shadow (seen through its mouths)
    ctx.save(); plPath(p.P.map(([x, y]) => pr(x, y, q.floor))); ctx.clip(); plPath(q.P.map(([x, y]) => pr(x, y, q.floor))); ctx.fillStyle = 'rgba(10,10,12,.62)'; ctx.fill(); ctx.restore(); }
  for (const q of pl.pits) if (q.crack && !q.slope && p.base <= q.floor + 0.01 && q.cut.includes(p)) { ctx.save(); plPath(p.P.map(([x, y]) => pr(x, y, q.floor))); ctx.clip(); plPath(q.P.map(([x, y]) => pr(x, y, q.floor))); ctx.fillStyle = 'rgba(18,18,16,' + Math.min(0.62, 0.22 + 0.28 * (q.depth || q.top0)).toFixed(2) + ')'; ctx.fill(); ctx.restore(); }   // a crack's floor through this bottom layer, dark by its depth (its strip crosses the outline: a notch, so no hole paints it)
  const sloped = pl.pits.filter(q => q.slope && q.cut.includes(p)), inSlope = (x, y) => sloped.some(q => plateIn(q.P, x, y));
  const gc = p.base <= 1e-6 ? plateGround(m, p) : plBlend(plateTopCol(m, p.under || p), 'rgb(0,0,0)', 0.04);   // the foot's colour: the ground, or the top it stands on (235: seamless stacks)
  for (const O of p.O) { const T = O.map(([x, y]) => pr(x, y, top)), F = O.map(([x, y]) => pr(x, y, p.base)); if (plOn(T, us * 2) || plOn(F, us * 2)) platePaintFaces(T, F, p.tone, sloped.length ? (i, j) => inSlope((O[i][0] + O[j][0]) / 2, (O[i][1] + O[j][1]) / 2) : null, gc); }   // (each piece's own walls: a notch's sides included; not a sloped ravine's: its side is a surface, drawRavineSlope)
}
function drawPlate(m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top));
  if (!plOn(T, us * 2)) return;
  const cuts = p.holes, ring = (q, z) => q.ring.get(p).map(([x, y]) => pr(x, y, z));       // (a hole wholly inside it; a ring across its edge is a notch, its walls the faces)
  plateTopPaint(m, p, pr, s);
  for (const q of pl.pits) if (q.slope && q.cut.includes(p) && p.base <= q.floor + 0.01) drawRavineSlope(m, q, pr, s);   // a sloped ravine: its V, drawn once, at its lowest layer's turn (233)
  for (const q of cuts) { if (q.slope) continue; const R = ring(q, top), B = ring(q, p.base), n = R.length, d = pitDepth(q, top);
    ctx.save(); plPath(T); ctx.clip(); plPath(R); ctx.clip();
    let cx = 0, cy = 0; for (const [X, Y] of R) { cx += X / n; cy += Y / n; }
    if ((!q.tunnel || q.crack) && p.base <= q.floor + 0.01) { plPath(B); ctx.fillStyle = 'rgba(18,18,16,' + (q.crack ? Math.min(0.62, 0.22 + 0.28 * (q.depth || q.top0)) : PL_WASH[2]).toFixed(2) + ')'; ctx.fill(); }   // the floor, darkest (before the hero's box is left out: he stands on it); a crack's darker the deeper
    plateBehindHero(p, top);                                                                // (down this pit below this plate: its far walls are behind you)
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mx = (R[i][0] + R[j][0]) / 2, my = (R[i][1] + R[j][1]) / 2, bx = (B[i][0] + B[j][0]) / 2, by = (B[i][1] + B[j][1]) / 2;
      if ((bx - mx) * (cx - mx) + (by - my) * (cy - my) <= 0.2) continue;                  // the far walls: their foot lies in toward the hole's middle
      const ex = R[j][0] - R[i][0], ey = R[j][1] - R[i][1], L = Math.hypot(ex, ey) || 1; let nx = ey / L; if ((mx - cx) * nx + (my - cy) * (-ex / L) > 0) nx = -nx;
      const lit = mtnClamp(0.78 + 0.18 * (-nx), 0.6, 1) * (1 - 0.45 * d), bat = 0.15 * Math.max(1, by - my), Bi = [B[i][0] + (cx - B[i][0]) * 0.03, B[i][1] + bat * 0.3], Bj = [B[j][0] + (cx - B[j][0]) * 0.03, B[j][1] + bat * 0.3];   // (235: an inner wall like an outer one, its crown lit, battered a little inward, occluded the deeper it sits under the rim, its foot the floor's dark)
      plateWall(R[i], R[j], Bi, Bj, [[0, plRgb(p.tone * 0.9 * lit)], [0.2, plRgb(p.tone * 0.76 * lit)], [0.75, plRgb(p.tone * 0.6 * lit)], [1, plRgb(p.tone * 0.42 * lit)]]); }
    ctx.restore();
  }
  for (const q of pl.pits) if (!q.slope && q.ring.has(p) && q.top <= top + 1e-6) { ctx.save(); plPath(T); ctx.clip(); platePaintLip(ring(q, top), s, q.P[0][0] * 7 + q.P[0][1]); ctx.restore(); }   // the one lip: the rim's, a hole's or a notch's (no brink inside it, no line at a layer's base: 225; 235: a top's own lip is in its texture)
}
// a sloped ravine's V on the screen (233, depth 234): the strip sampled along its spine and across it, each cell a
// quad at the surface's height, shaded by its lean (the side facing the view lit, the near side in its own shade),
// its value falling off with depth, the floor darkest; the near rim's shadow cast across the floor; each layer's edge
// a broken run across the slope where the surface crosses that layer's base (and the rim), the strata; the top
// darkening into the fall just outside the rim (the shoulder)
function drawRavineSlope(m, q, pr, s) {
  const us = UNIT * s, S0 = q.spine, S = []; for (let i = 1; i < S0.length; i++) { const [ax, ay] = S0[i - 1], [bx, by] = S0[i], k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5)); for (let j = 0; j < k; j++) S.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]); } S.push(S0[S0.length - 1]);
  { const [ax, ay] = S[0], [bx, by] = S[1], d = Math.hypot(bx - ax, by - ay) || 1; S.unshift([ax - (bx - ax) / d * q.w / 2, ay - (by - ay) / d * q.w / 2]); } { const m2 = S.length, [ax, ay] = S[m2 - 2], [bx, by] = S[m2 - 1], d = Math.hypot(bx - ax, by - ay) || 1; S.push([bx + (bx - ax) / d * q.w / 2, by + (by - ay) / d * q.w / 2]); }   // (and half a width past each end: the bowls)
  const n = S.length, NA = 12, W2 = q.w / 2, N = S.map((_, i) => { const [x0, y0] = S[Math.max(0, i - 1)], [x1, y1] = S[Math.min(n - 1, i + 1)], d = Math.hypot(x1 - x0, y1 - y0) || 1; return [-(y1 - y0) / d, (x1 - x0) / d]; }), nrm = i => N[i];   // (the normals: to the left of the stroke's direction, once)
  const at = (i, t) => { const [nx, ny] = N[i], x = S[i][0] + nx * t * W2 * 1.15, y = S[i][1] + ny * t * W2 * 1.15; return [x, y, ravineH(q, x, y)]; };
  const tone = q.cut[0].tone, dmax = Math.max(0.01, q.top0 - q.floor), rnd = plateRng(q.rav * 5 + 2);
  ctx.save(); plPath(q.P.map(([x, y]) => pr(x, y, q.top0))); ctx.clip();
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < NA; k++) { const t0 = -1 + 2 * k / NA, t1 = -1 + 2 * (k + 1) / NA, a = at(i, t0), b = at(i, t1), c = at(i + 1, t1), d = at(i + 1, t0);
    const zm = (a[2] + b[2] + c[2] + d[2]) / 4; if (zm > q.top0 - 1e-3) continue; const [nx, ny] = nrm(i), side = (t0 + t1) / 2 < 0 ? -1 : 1, flat = Math.abs(b[2] - a[2]) < 1e-3 && Math.abs(c[2] - a[2]) < 1e-3;
    const ux = nx * side, uy = ny * side, lit = flat ? 0.5 : mtnClamp(0.82 - 0.36 * uy - 0.14 * ux, 0.35, 1.08);   // the side facing the view (its uphill north) lit, the near side in its own shade; value falls off with depth
    const val = (u, v) => plRgb(tone * lit * (1 - 0.6 * (q.top0 - (u[2] + v[2]) / 2) / dmax) * (1 + 0.05 * plNoise((u[0] + v[0]) * 0.3 + (u[1] + v[1]) * 0.22, q.rav)));   // (235: the value at a cell's edge, a slow grain by place; a gradient across the cell between its two edges, so the cells read as one slope, not bands)
    const A = pr(a[0], a[1], a[2]), B = pr(b[0], b[1], b[2]), C = pr(c[0], c[1], c[2]), D = pr(d[0], d[1], d[2]), P0 = [(A[0] + D[0]) / 2, (A[1] + D[1]) / 2], ex = D[0] - A[0], ey = D[1] - A[1], eL = Math.hypot(ex, ey) || 1, dx = (B[0] + C[0]) / 2 - P0[0], dy = (B[1] + C[1]) / 2 - P0[1], along = (dx * ex + dy * ey) / eL, g = ctx.createLinearGradient(P0[0], P0[1], P0[0] + dx - ex / eL * along, P0[1] + dy - ey / eL * along); g.addColorStop(0, val(a, d)); g.addColorStop(1, val(b, c));   // (the gradient square to the cell's along edge, so its bands run along the slope, never leaning cell by cell)
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke(); }
  for (let i = 0; i < n - 1; i++) { const [, ny] = nrm(i), south = ny > 0 ? 1 : -1, r0 = at(i, south), r1 = at(i + 1, south), f0 = at(i, south * 0.05), f1 = at(i + 1, south * 0.05);   // the near rim's cast shadow: from the south rim across the floor, fading toward the far side
    const R0 = pr(r0[0], r0[1], r0[2]), R1 = pr(r1[0], r1[1], r1[2]), F0 = pr(f0[0], f0[1], f0[2]), F1 = pr(f1[0], f1[1], f1[2]), g = ctx.createLinearGradient(0, (R0[1] + R1[1]) / 2, 0, (F0[1] + F1[1]) / 2); g.addColorStop(0, 'rgba(8,10,12,.5)'); g.addColorStop(0.5, 'rgba(8,10,12,.25)'); g.addColorStop(1, 'rgba(8,10,12,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(R0[0], R0[1]); ctx.lineTo(R1[0], R1[1]); ctx.lineTo(F1[0], F1[1]); ctx.lineTo(F0[0], F0[1]); ctx.closePath(); ctx.fill(); }
  const levels = [q.top0].concat(q.cut.map(p => p.base).filter(b => b > q.floor + 1e-6 && b < q.top0 - 1e-6)); ctx.lineCap = 'round';   // the rim, and each layer's base the slope crosses: strata, as broken runs that swell and taper
  for (const z of levels) { const ds = W2 - (q.top0 - z) * q.slope; if (ds <= 0.02) continue; const R = tunnelRing(S, ds * 2), h = R.length / 2;
    for (const side of [R.slice(0, h), R.slice(h)]) { const C = side.map(([x, y]) => pr(x, y, z)); let i = 0; while (i < C.length - 1) { if (rnd() < 0.25) { i += 1 + Math.floor(rnd() * 2); continue; } const len = 2 + Math.floor(rnd() * 5);
        for (let k2 = 0; k2 < len && i + k2 < C.length - 1; k2++) { const t = k2 / len, w = (z === q.top0 ? 1.8 : 1.2) * s * (0.4 + 0.9 * Math.sin(t * Math.PI)); ctx.strokeStyle = z === q.top0 ? 'rgba(28,28,24,.6)' : 'rgba(26,24,20,.45)'; ctx.lineWidth = Math.max(0.6, w); ctx.beginPath(); ctx.moveTo(C[i + k2][0], C[i + k2][1]); ctx.lineTo(C[i + k2 + 1][0], C[i + k2 + 1][1]); ctx.stroke(); } i += len + 1; } } }
  ctx.restore(); ctx.save(); ctx.lineJoin = 'round'; const RP = q.P.map(([x, y]) => pr(x, y, q.top0));   // the shoulder: just outside the rim the top darkens into the fall
  for (const [w, a] of [[0.5, 0.06], [0.3, 0.08], [0.15, 0.11]]) { ctx.strokeStyle = 'rgba(20,20,18,' + a + ')'; ctx.lineWidth = w * us; plPath(RP); ctx.stroke(); } ctx.restore();
}
// System > Show tiles on a plates screen: the tiles lightened by the ground's height there (a pit is dark again)
function drawPlateTiles(m, pr) {
  const pl = platesLay(m), h = state.hero, hx = h.x / UNIT, x0 = Math.max(0, Math.floor(hx - 14)), x1 = Math.min(m.len, Math.ceil(hx + 14));
  for (let y = 0; y < m.D; y++) for (let x = x0; x < x1; x++) { const z = plateTopAt(pl, x + 0.5, y + 0.5); if (z <= 0) continue; const c = [pr(x, y, z), pr(x + 1, y, z), pr(x + 1, y + 1, z), pr(x, y + 1, z)]; plPath(c); ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, 0.12 + z * 0.1).toFixed(2) + ')'; ctx.fill(); }
}
