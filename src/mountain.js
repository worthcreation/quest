// ===== mountain.js: the mountain's screens, one family from one generator (docs/mountain-plan.md). Each screen is a
// spec in MTN (by scene id): its size, how its ground rises (foot, pathY), where its way runs (pathD), its camera and
// its layout. The generator does the rest the same way for all of them: the ground's height and colour, the land's
// rows, the props as solids the game tests (collision and drawing from the same numbers), the scene, the camera,
// the drawing. Each screen runs on the main game: the hero, Pip, the rabbits, items, fire and barriers are all the
// usual code, in a scene bigger than the screen (sceneSize: while it is current, W and H are its own size in pixels;
// walking pace comes from the screen, L()). Only the drawing is its own: a moving camera opens looking straight down,
// like the fields; walk on and the view pulls back and tips up, so the grade shows and the mountain stands up ahead;
// walk back and it comes in again. Everything standing is drawn where it touches the ground, scaled with the view.
//
// The rise (RISE) is the first screen: one long slope, 86 tiles west to east and 30 deep, from the first field up to
// a pass into the mountain, and through it onto the stepping path (M2, scene mt2: the marsh already has m1 to m3 as ids),
// and from its pass onto the climb (climb.js, until each climb screen is remade here).
// At x 20, just past a tree, a wall of reeds crosses the way: for now nothing gets through it.
// A screen can have a ravine (m.rav): one shape, mtnGap, that the game tests (isChasm) and drawMtnRavine draws (a
// hole cut out of the ground's rows, its far wall and floor painted once beneath them).

const mtnClamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const RISE = {
  id: 'rise', len: 86, D: 30, flat: 0, grade: 0.0018, mid: 15, floor: '#7b9550', treeX: 18, barX: 20, inX: 4, outX: 81.2, tilt: 0.95, lead: 6, lift: 4.5,
  X0: -16, X1: 124, Y0: -6, Y1: 72, seed: 7, dx: 0.5,
  // the ravines (laid by riseRavines from the screen's seed): the big one in from the north edge down to the reeds (with
  // them it shuts the way), a thin crack edge to edge at x 40 jumped where the path crosses it, a short one in from the north at x 58
  ravs: null,
  foot: y => 74 + Math.sin(y * 0.35) * 2.5 + Math.sin(y * 0.9) * 0.8,                 // where the mountain's stone begins
  pathY: x => 15 + Math.sin(x * 0.13) * 2,                                             // the worn path, west to east
  // the whole path, as the map has it: down from the first field at the north-west corner, east up the rise, and at the
  // far end south through the pass, onto the climb. Distance to it, in tiles:
  pathD(x, y) {
    const { inX, outX, D } = this, y0 = this.pathY(inX + 6), y1 = this.pathY(outX);
    let d = x >= inX + 4 && x <= outX ? Math.abs(y - this.pathY(x)) : 99;
    if (y <= y0 + 0.5) { const t = mtnClamp((y + 1) / (y0 + 1)); d = Math.min(d, Math.abs(x - (inX + 6 * t * t))); }   // the way in, from the north
    if (y >= y1 - 0.5) { const t = mtnClamp((y - y1) / (D + 1 - y1)); d = Math.min(d, Math.abs(x - (outX + 0.6 * t))); }   // the way out, to the south
    return d;
  },
};
// The stepping path (M2, scene mt2), out of the rise's pass (the wind shelf, mt1, retired in 213): a fixed screen, pulled back and tipped so the whole
// of it is in view at once (on a phone it slides along with you). The ravine runs the length of the way, 5 across at
// either end, and for the middle stretch eats the banks wall to wall: the only way on is a chain of islands out in the
// drop, each at least 2 tiles across, each a sure running jump from the last, zigzagging east (genIslands lays them from
// the screen's seed, after the ravine: nothing of the ravine's own shape makes an island). One more island off the
// chain, a longer jump away (the dare; the secret: carrots). The pass at the far end leads south onto climb3 (until m3
// is remade).
// Since 212 it is the plates' test screen too (docs/mountain-plan.md "Plates"): grey throughout (stone everywhere,
// m.stone the base plate's grey, the ravine in the grey palette), the eye 14 tiles up (the push-out), and a few
// stacks, a pit and a seam laid on its banks (M2.plates), held off until 214 lays the ground in layers. Close
// throughout (Ross, 2 Oct): the view at p 0.35 and zoom 0.825, the still's, sliding with you.
const M2 = {
  id: 'mt2', len: 40, D: 24, flat: 0, grade: 0.002, mid: 12, floor: '#8f9188', stone: [143, 145, 136], stoneAt: -9, inX: 4, outX: 36.2, tilt: 0.95, lead: 0, lift: 2.5, eye: 40,
  X0: -16, X1: 80, Y0: -6, Y1: 60, seed: 23, dx: 0.5, fine: 9, fixed: { p: 0.35, zoom: 0.825, follow: true },
  ravs: null, isls: null, islTop: 'grass',                                               // islTop: 'grass' (the screen's dry turf) or 'bare' (stone and grit)
  foot: y => 33 + Math.sin(y * 0.4 + 2) * 2 + Math.sin(y * 0.9) * 0.7,
  // the drop: from x 6 to 33 (clear of the way in at x 4), 5 across at the ends, wall to wall (hw 12.5) from x 10 to 30, opening over a tile
  drop: { x0: 6, x1: 33, wide: [10, 30], hwEnd: 2.5, hwMid: 12.5 },
  side: x => x < 20 ? -1 : 1,                                                            // the path runs the north bank in, the south bank out
  bankY(x) { const d = this.drop, k = mtnClamp(x - d.wide[0]) * mtnClamp(d.wide[1] - x), open = k * k * (3 - 2 * k); return this.mid + this.side(x) * (d.hwEnd + 1.8 + 20 * open); },
  // the way: along the north bank to the west lip, island to island across the drop (the chain's line), the south bank
  // east and the pass south. Distance to it, in tiles:
  pathY(x) { return this.bankY(x); },
  pathD(x, y) {
    const { inX, outX, D } = this, y0 = this.pathY(inX + 6), y1 = this.pathY(outX), [wx0, wx1] = this.drop.wide;
    let d = x >= inX + 4 && x <= outX && (x < wx0 || x > wx1) ? Math.abs(y - this.pathY(x)) : 99;
    if (this.isls) { const ch = this.isls.filter(i => i.chain), P = [[wx0 - 1, this.pathY(wx0 - 1)]].concat(ch.map(i => [i.x, i.y]), [[wx1 + 1, this.pathY(wx1 + 1)]]);
      for (let i = 1; i < P.length; i++) { const [ax, ay] = P[i - 1], [bx, by] = P[i], dx = bx - ax, dy = by - ay, t = mtnClamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)); d = Math.min(d, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } }
    if (y <= y0 + 0.5) { const t = mtnClamp((y + 1) / (y0 + 1)); d = Math.min(d, Math.abs(x - (inX + 6 * t * t))); }
    if (y >= y1 - 0.5) { const t = mtnClamp((y - y1) / (D + 1 - y1)); d = Math.min(d, Math.abs(x - (outX + 0.6 * t))); }
    return d;
  },
};
// A flat board (scene flat, 215): open stone with nothing on it, the editor's scratch space (?edit=flat, Ross: a flat
// space to work in). No mountain (the foot far off east), no ravine, no way in or out: the edges hold. Grey, the eye
// over you, the close view, like mt2. Its layout is src/layouts/flat.js (empty as shipped).
const FLAT = {
  id: 'flat', len: 40, D: 24, flat: 0, grade: 0, mid: 12, floor: '#8f9188', stone: [143, 145, 136], stoneAt: -9, inX: 4, outX: 200, tilt: 0.95, lead: 0, lift: 2.5, eye: 40,
  X0: -16, X1: 80, Y0: -6, Y1: 60, seed: 29, dx: 0.5, fine: 9, fixed: { p: 0.35, zoom: 0.825, follow: true }, ravs: null, isls: null,
  foot: () => 200, pathY() { return this.mid; }, pathD: () => 99,
  layout() {}, plates: pl => plateLayout(pl, 'flat'),
  scene: { area: 'field', depth: 4, msg: 'The flat board.', music: 'field', amb: 'wind', floor: '#8f9188', speed: 0.45, accel: 8 },
  finish(sc) { const m = this; sc.mtnHold = a => mtnHold(m, a) || (a === state.hero ? plateStepHero(m, a) : plateHold(m, a)); },
};
// The canyon (scene epic, 236; composed 7 Oct as the test of the stone's look, Ross: Grand Canyon and Everest): 64 by
// 40 tiles of grey stone; two bottomless ravines from the rise's generator, hand-widened, as the south and west
// boundaries (the canyon about 6 tiles across, the side canyon in from the north); the mountain's own face at the east
// with crags heaped at it and big ones on the canyon's rims; brush slabs (src/layouts/epic.js): a cliff band three
// tiles thick with a second band on it, a cave (two walls and a roof with a mouth south), a shelf with a tier and a
// ravine through it, a ridge by the side canyon, a crack on the band's crown. Off the map, no way in or out (the
// edges and the ravines hold): ?scene=epic, ?edit=epic. The mocks (docs/parked/mock-epic*.js) render it from here.
const EPIC = {
  id: 'epic', len: 64, D: 40, flat: 0, grade: 0.004, mid: 20, floor: '#8f9188', stone: [143, 145, 136], stoneAt: -9, inX: 28, outX: 200, tilt: 0.95, lead: 0, lift: 2.5, eye: 40,
  X0: -16, X1: 110, Y0: -8, Y1: 70, seed: 41, dx: 0.5, fine: 9, fixed: { p: 0.35, zoom: 0.825, follow: true }, ravs: null, isls: null,
  foot: y => 52 + Math.sin(y * 0.3) * 2.5 + Math.sin(y * 0.8) * 0.9,                     // the mountain's face: the stone rises east of here
  pathY() { return this.mid; }, pathD: () => 99,                                           // (no way: inX only parks you at 28, 20, in the open)
  layout(lay) { const m = this, { put, rnd, clearOf } = lay;
    if (!m.ravs) { const seed = m.seed * 101;
      const canyon = genRavine('long', seed + 1, [-6, 30], 0.12, 60, 0.7); for (const q of canyon.spine[0]) q[2] = Math.min(3.0, q[2] * 1.4 + 0.6);   // the canyon along the south, about 6 tiles (wider breaks the outline tracing: the rows go black, (u))
      const side = genRavine('long', seed + 2, [12, -8], Math.PI / 2 + 0.25, 30, 0.6); for (const q of side.spine[0]) q[2] = Math.min(2.4, q[2] * 1.2 + 0.4);   // a side canyon in from the north
      m.ravs = [canyon, side]; m.ravDraw = null; }
    for (let i = 0; i < 90; i++) { const y = m.Y0 + rnd() * (m.Y1 - m.Y0), x = m.foot(y) + 0.5 + rnd() * 30, r = 1.0 + rnd() * 1.4; if (!clearOf(x, y, r * 0.6)) continue; put('crag', x, y, r, true); }   // the face: crags heaped
    for (let i = 0; i < 40; i++) { const x = m.X0 + rnd() * (m.foot(20) - m.X0), y = m.Y0 + rnd() * (m.Y1 - m.Y0), r = 0.9 + rnd() * 1.1; if (!mtnGap(m, x, y, r + 2.2) || mtnGap(m, x, y, r + 0.4) || !clearOf(x, y, r)) continue; put('crag', x, y, r, true); }   // big crags along the canyon rims
    for (let i = 0; i < 40; i++) { const x = m.X0 + rnd() * (m.foot(20) - m.X0 - 2), y = m.Y0 + rnd() * (m.Y1 - m.Y0), r = 0.5 + rnd() * 0.6; if (mtnGap(m, x, y, r + 0.4) || !clearOf(x, y, r)) continue; put(rnd() < 0.6 ? 'boulder' : 'crag', x, y, r, true); }
  },
  plates: pl => plateLayout(pl, 'epic'), late: true,                                      // built at its first visit (worldScene)
  scene: { area: 'field', depth: 4, msg: 'The canyon.', music: 'field', amb: 'wind', floor: '#8f9188', speed: 0.45, accel: 8 },
  finish(sc) { const m = this; sc.mtnHold = a => mtnHold(m, a) || (a === state.hero ? plateStepHero(m, a) : plateHold(m, a)); },
};
const MTN = { rise: RISE, mt2: M2, flat: FLAT, epic: EPIC };                    // every screen of the family, by scene id
// the lowest a moving view pulls back: never so far that you're a speck (a phone keeps you at least 20 px)
const mtnZoomMin = () => Math.max(0.5, 20 / UNIT);
// the ground's height in tiles: a gentle grade from the first step, steepening as it goes, then the mountain (cut by the way on)
function mtnH(m, x, y) {
  const f = m.foot(y), xb = Math.min(x, f), mm = x - f;
  let h = xb < m.flat ? 0 : m.grade * (xb - m.flat) ** 2;
  h += Math.max(0, xb - m.flat - 2) * 0.02 * Math.sin(y * 0.3 + x * 0.08);            // a little roll in it
  if (mm > 0) {
    const dy = y - m.pathY(x), notch = dy < 0 ? mtnClamp((-dy - 1.2) / 2.5) : 0.15 * mtnClamp((dy - 1.2) / 10);   // the mountain proper is north of the path; south of it only a low shoulder (so the way on stays in view)
    h += (11 * (1 - Math.exp(-mm * mm / 40)) + 4 * Math.max(0, Math.sin(y * 0.3 + 1)) * mtnClamp((mm - 5) / 8) + Math.min(12, Math.max(0, mm - 10)) * 0.25) * notch + mm * 0.12 * (1 - notch);
  }
  return Math.max(0, h);
}
// the ravine: its middle wanders along x (cy), its half-width (hw) narrows to a jump at each crossing. One shape for
// everything: mtnGap is the test the game makes (over the drop, with a margin in tiles), and drawMtnRavine draws its
// two lips from the same cy and hw (the ground's height is the banks' everywhere: things in the air over it keep
// their height)
// A ravine can also be a spine: polylines in tiles, each point [x, y, halfwidth]; the drop is everywhere nearer a
// spine than its width there (ravField, negative inside). Any shape comes out of it: long and winding, a thin crack,
// a round pit, a crack that spiders into branches. Its outline is traced from the field once (ravRings: marching
// squares at a fifth of a tile), and that is what the lips draw and the ground's rows are cut to
function ravField(r, x, y, want) {                                                       // want 'p': the nearest point of the spine [x, y, halfwidth] instead
  let f = Infinity, p = null;
  for (const br of r.spine) for (let i = 1; i < br.length; i++) {
    const [x0, y0, w0] = br[i - 1], [x1, y1, w1] = br[i], dx = x1 - x0, dy = y1 - y0, t = mtnClamp(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1e-9)), hw = w0 + (w1 - w0) * t;
    const d = Math.hypot(x - x0 - dx * t, y - y0 - dy * t) - hw; if (d < f) { f = d; p = [x0 + dx * t, y0 + dy * t, hw]; }
  }
  return want === 'p' ? p : f;
}
// the field sampled once on a grid a fifth of a tile apart (build 209): the outline is traced from it and the game's
// test (ravGap) reads it, rather than measuring every stretch of every spine each time something moves
function ravGrid(r) {
  if (r.grid) return r.grid;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const br of r.spine) for (const [x, y, w] of br) { x0 = Math.min(x0, x - w - 1); y0 = Math.min(y0, y - w - 1); x1 = Math.max(x1, x + w + 1); y1 = Math.max(y1, y + w + 1); }
  const st = 0.2, nx = Math.ceil((x1 - x0) / st) + 1, ny = Math.ceil((y1 - y0) / st) + 1, g = [];
  for (let j = 0; j < ny; j++) { g.push(new Float32Array(nx)); for (let i = 0; i < nx; i++) g[j][i] = ravField(r, x0 + i * st, y0 + j * st); }
  return (r.grid = { x0, y0, x1, y1, st, nx, ny, g });
}
// the field at a spot from the grid (bilinear); off the grid, nothing near
function ravFieldAt(r, x, y) {
  const G = ravGrid(r), fx = (x - G.x0) / G.st, fy = (y - G.y0) / G.st, i = Math.floor(fx), j = Math.floor(fy);
  if (i < 0 || j < 0 || i >= G.nx - 1 || j >= G.ny - 1) return 9;
  const u = fx - i, v = fy - j, a = G.g[j], b = G.g[j + 1];
  return (a[i] * (1 - u) + a[i + 1] * u) * (1 - v) + (b[i] * (1 - u) + b[i + 1] * u) * v;
}
function ravRings(r, iso = 0) {                                                          // iso: the level traced (0 the lip; 0.4 the brink's outer edge)
  const C = r.ringsAt || (r.ringsAt = {}); if (C[iso]) return C[iso];
  const { x0, y0, st, nx, ny } = ravGrid(r), g = iso ? ravGrid(r).g.map(row => row.map(v => v - iso)) : ravGrid(r).g;
  // every cell edge the outline crosses gets a point; each cell links its two (or four) crossings; then the links are walked into loops
  const key = (i, j, e) => (j * nx + i) * 2 + e, pts = new Map(), links = new Map();            // e 0: the edge from (i,j) to (i+1,j); e 1: from (i,j) to (i,j+1)
  const cross = (i, j, e) => { const k = key(i, j, e); if (!pts.has(k)) { const a = g[j][i], b = e ? g[j + 1][i] : g[j][i + 1], t = a / (a - b); pts.set(k, [x0 + (i + (e ? 0 : t)) * st, y0 + (j + (e ? t : 0)) * st]); } return k; };
  const link = (a, b) => { (links.get(a) || links.set(a, []).get(a)).push(b); (links.get(b) || links.set(b, []).get(b)).push(a); };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const c = (g[j][i] < 0 ? 1 : 0) | (g[j][i + 1] < 0 ? 2 : 0) | (g[j + 1][i + 1] < 0 ? 4 : 0) | (g[j + 1][i] < 0 ? 8 : 0); if (c === 0 || c === 15) continue;
    const T = () => cross(i, j, 0), R = () => cross(i + 1, j, 1), B = () => cross(i, j + 1, 0), L = () => cross(i, j, 1);
    const e = { 1: [L, T], 2: [T, R], 3: [L, R], 4: [R, B], 5: [L, B, T, R], 6: [T, B], 7: [L, B], 8: [B, L], 9: [T, B], 10: [T, L, R, B], 11: [R, B], 12: [R, L], 13: [T, R], 14: [L, T] }[c];
    for (let k = 0; k < e.length; k += 2) link(e[k](), e[k + 1]());
  }
  const rings = [], seen = new Set();
  for (const start of links.keys()) {
    if (seen.has(start)) continue;
    const ring = []; let cur = start, prev = -1;
    while (cur != null && !seen.has(cur)) { seen.add(cur); ring.push(pts.get(cur)); const nb = links.get(cur) || []; const nxt = nb.find(k => k !== prev && !seen.has(k)); prev = cur; cur = nxt; }
    let a = 0; for (let i = 0; i < ring.length; i++) { const [x0, y0] = ring[i], [x1, y1] = ring[(i + 1) % ring.length]; a += x0 * y1 - x1 * y0; }
    if (ring.length > 4 && Math.abs(a) > 2.4) rings.push(ring);                               // (a sliver of ground pinched between two branches is not worth a lip: under 1.2 tiles it's dropped)
  }
  const inside = ([px, py], ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > py !== yj > py && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; };
  return (C[iso] = rings.filter(a => !rings.some(b => b !== a && inside(a[0], b))));          // no islands: ground ringed by the drop is swallowed (islands are laid by their own generator)
}
// spines by kind, from a seed: long (winding, 2 to 3 wide), thin (a crack, under a tile), spider (a
// crack with branches forking off it, thinner as they go). from [x, y], heading dir (radians), about len tiles
function genRavine(kind, seed, from, dir, len, keep = 0.25) {                                // keep: how hard a walk holds its heading (0 wanders, 1 runs straight)
  const R = mulberry32((seed * 2654435761) >>> 0), rnd = (a, b) => a + R() * (b - a), spine = [];
  const walk = (x, y, a, n, w0, w1, jit, taper, keep = 0.25) => {                        // a polyline of n steps, width w0 going to w1, heading jittered by jit each step and pulled back toward a0 by keep, both ends tapered when taper
    const br = [], st = 1.2, a0 = a; for (let i = 0; i <= n; i++) { const t = i / n, end = taper ? Math.min(1, Math.min(i, n - i) / 2.5) : 1; br.push([x, y, (w0 + (w1 - w0) * t) * (0.25 + 0.75 * end) + 0.05]); a += rnd(-jit, jit) + 0.12 * Math.sin(i * 0.5 + seed); a += (a0 - a) * keep; x += Math.cos(a) * st; y += Math.sin(a) * st; } return br; };
  if (kind === 'long') spine.push(walk(from[0], from[1], dir, Math.round(len / 1.2), rnd(2, 2.8), rnd(2, 2.8), 0.18, true, keep));
  if (kind === 'thin') spine.push(walk(from[0], from[1], dir, Math.round(len / 1.2), rnd(0.45, 0.9), rnd(0.35, 0.8), 0.45, true, keep));
  if (kind === 'spider') {
    const main = walk(from[0], from[1], dir, Math.round(len / 1.2), rnd(1.1, 1.6), rnd(0.4, 0.8), 0.3, true); spine.push(main);
    const forks = Math.round(rnd(2, 4));
    for (let k = 0; k < forks; k++) {
      const at = main[Math.floor(rnd(2, main.length - 3))], side = R() < 0.5 ? -1 : 1, a = dir + side * rnd(0.6, 1.4), n = Math.round(rnd(3, 8));
      const br = walk(at[0], at[1], a, n, at[2] * 0.8, 0.12, 0.35, false); spine.push(br);
      if (R() < 0.5) spine.push(walk(br[Math.floor(n / 2)][0], br[Math.floor(n / 2)][1], a - side * rnd(0.6, 1.2), Math.round(rnd(2, 5)), 0.4, 0.1, 0.4, false));
    }
  }
  return { spine, floor: false, depth: kind === 'long' ? 7 : 4 };
}
// the river at the bottom of a ravine: its own generator (after the ravine's shape, and after any islands), a thread
// at the bottom of the biggest ones, where the walls meet; cached on the ravine
function genRavRiver(r) {
  if (r.river) return r.river;
  const R = mulberry32(((r.seed || 3) * 40503 + 7) >>> 0), out = [];
  for (const br of r.spine) {                                                               // only the big ones carry water (over 1.8 half-width on average, 8 reaches or more); no pools for now
    if (br.length < 8 || br.reduce((t, q) => t + q[2], 0) / br.length < 1.8) continue;
    out.push(br.map(q => q.slice()));                                                        // along the ravine's middle, where its walls meet at the bottom
  }
  void R;
  return (r.river = out);
}
// the stepping path's drop, laid by hand (no walk: its shape is the puzzle). A neck 5 across runs the length of the
// screen's middle, tapering at both ends; between d.wide the drop is wall to wall, as rows of spines two and a half
// tiles apart (the field is the nearest spine's, so rows side by side make one flat hole; their ends scallop the
// lips, each row's a little different). The river runs the neck only
function m2Ravine(m) {
  const d = m.drop, R = mulberry32((m.seed * 7919 + 3) >>> 0), neck = [], spine = [neck];
  for (let x = d.x0; x <= d.x1 + 1e-9; x += 1.2) { const end = Math.min(1, Math.min(x - d.x0, d.x1 - x) / 2.5); neck.push([x, m.mid + 0.3 * Math.sin(x * 0.7) + 0.12 * Math.sin(x * 3.1), d.hwEnd * (0.3 + 0.7 * end) + 0.15 * Math.sin(x * 2.3 + 1)]); }
  for (let y = -1.5; y <= m.D + 2 + 1e-9; y += 2.5) { /* (the rows reach past both edges: no strip of ground along them) */ const row = [], x0 = d.wide[0] + 2 + (R() - 0.5) * 0.8, x1 = d.wide[1] - 2 + (R() - 0.5) * 0.8; for (let x = x0; x < x1 + 1.2; x += 1.2) row.push([Math.min(x, x1), y + 0.15 * Math.sin(x * 1.1 + y), 2 + 0.1 * Math.sin(x * 1.7 + y * 0.9)]); spine.push(row); }
  return { spine, floor: false, depth: 7, seed: m.seed, river: [neck.map(q => q.slice())] };
}
// Islands: their own generator, after the ravines (nothing of a ravine's shape makes one), laid on purpose from the
// screen's seed. Each is a pillar out of the drop with a top at least 2 tiles across (r 1.0 to 1.4), its edge a bumpy
// ring; one shape, islField, for the game's test (mtnGap) and the drawing (islRing). genIslands lays a chain across
// the wide stretch: island after island east from the west lip, zigzagging, every gap between edges a sure running
// jump (1.15 to 1.35 tiles, against a reach of 2.2 at the start), until the east lip is one jump away; then one more
// off the chain, a longer jump (the dare, 1.6 to 1.75), with the secret on it
function islField(i, x, y) { const dx = x - i.x, dy = y - i.y, th = Math.atan2(dy, dx); return Math.hypot(dx, dy) - i.r * (1 + 0.1 * Math.sin(3 * th + i.s) + 0.06 * Math.sin(5 * th + 2 * i.s)); }
function islRing(i, inset = 0, n = 44) { const P = []; for (let k = 0; k < n; k++) { const th = k / n * Math.PI * 2, r = Math.max(0.05, i.r * (1 + 0.1 * Math.sin(3 * th + i.s) + 0.06 * Math.sin(5 * th + 2 * i.s)) - inset); P.push([i.x + Math.cos(th) * r, i.y + Math.sin(th) * r]); } return P; }
// the gap a player sees lining up on the next island: along the line from a (an island, or a point on a lip) to b,
// from where a's ground ends to where b's begins, in tiles (the rings are bumpy, so a circle's r would be off by a sixth)
function islGapTo(m, a, b) {
  const L = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, onA = t => a.r ? islField(a, a.x + ux * t, a.y + uy * t) < 0 : ravFieldAt(m.ravs[0], a.x + ux * t, a.y + uy * t) >= 0;
  let t0 = 0, t1 = L; while (t0 < L && onA(t0)) t0 += 0.02; while (t1 > t0 && islField(b, a.x + ux * t1, a.y + uy * t1) < 0) t1 -= 0.02;
  return t1 - t0;
}
// from an island's edge, along a direction, to the first ground of a bank (the hop off the chain onto the bank)
function ravGapOut(m, i, ux, uy) { let t = 0; while (t < 6 && islField(i, i.x + ux * t, i.y + uy * t) < 0) t += 0.02; const t0 = t; while (t < 6 && ravFieldAt(m.ravs[0], i.x + ux * t, i.y + uy * t) < 0) t += 0.02; return t - t0; }
const onIsl = (m, x, y, pad = 0) => !!m.isls && m.isls.some(i => islField(i, x, y) < -pad);   // on one, by more than pad
function genIslands(m) {
  const R = mulberry32((m.seed * 48271 + 5) >>> 0), rnd = (a, b) => a + R() * (b - a), [wx0, wx1] = m.drop.wide, out = [];
  const inDrop = (i, c = 0.7, self) => islRing(i, -c, 24).every(([x, y]) => ravFieldAt(m.ravs[0], x, y) < -0.05) && !out.some(o => o !== self && Math.hypot(o.x - i.x, o.y - i.y) < o.r + i.r + 1.1);   // the drop all round it (0.7 of a tile clear of any lip), clear of the others
  const lipW = m.pathY(wx0 - 1), lipE = m.pathY(wx1 + 1);                                 // where the way leaves the west bank and lands on the east
  let x = wx0 - 1, y = lipW, pr = 0, sd = Math.sign(m.mid - y) || 1, i = 0;
  while (ravFieldAt(m.ravs[0], x, y) > 0 && x < wx1) x += 0.1;                           // the first hop leaves the west lip itself
  for (; i < 12; i++) {                                                                   // each hop: about 2.7 tiles east and across to the other side of the middle, the next back again
    const r = rnd(1.0, 1.4), gap = rnd(1.15, 1.35), aim = mtnClamp(Math.atan2((m.mid + sd * rnd(1.5, 4)) - y, 2.7), -1.05, 1.05) * (i ? 1 : 0.45), n = { x: 0, y: 0, r, s: rnd(0, 6.3), chain: true };
    const prev = out[out.length - 1] || { x, y, r: 0 };
    let ok = false; for (let t = 0; t < 14 && !ok; t++) { const a = aim + rnd(-0.5, 0.5) * (t ? 1 : 0.3); let L = pr + gap + r * 1.08; n.x = x + Math.cos(a) * L; n.y = y + Math.sin(a) * L;
      L += gap - islGapTo(m, prev, n); n.x = x + Math.cos(a) * L; n.y = y + Math.sin(a) * L; ok = inDrop(n) && Math.abs(islGapTo(m, prev, n) - gap) < 0.05; }   // slid along the line until the gap on the ground is the one meant
    if (!ok) break;
    out.push(n); x = n.x; y = n.y; pr = r * 1.08; sd = -sd;
    if (Math.hypot(wx1 - 0.3 - x, lipE - y) - pr < 1.35 + 1.0) break;                     // the east lip is a jump away (a running jump from the island's edge lands on the bank): the chain is laid
  }
  if (out.length) {                                                                       // the last island: nudged toward the south bank until the hop onto it is a sure one
    const l = out[out.length - 1], prev = out[out.length - 2];
    for (let k = 0; k < 20; k++) { const g = ravGapOut(m, l, 0, 1); if (g <= 1.35) break; const n = { ...l, y: l.y + Math.min(0.1, g - 1.3) };
      if (prev) for (let j = 0; j < 20 && islGapTo(m, prev, n) > 1.33; j++) { const dx = prev.x - n.x, dy = prev.y - n.y, L = Math.hypot(dx, dy); n.x += dx / L * 0.05; n.y += dy / L * 0.05; }   // (and back toward the one before it, so that gap stays a sure jump too)
      if (!inDrop(n, 0.45, l)) break; l.x = n.x; l.y = n.y; }   // (nearer a lip than the others are to anything: 0.45 clear is still no step)
  }
  if (out.length) {                                                                       // the dare: off one of the middle islands, out toward the far side of the drop, a long jump away
    const order = out.slice(1, -1).sort((a, b) => Math.abs(a.x - 20) - Math.abs(b.x - 20)); let laid = false;
    for (const from of order) { const far = Math.sign(m.mid - from.y) || 1;
      for (let t = 0; t < 24 && !laid; t++) { const r = rnd(1.05, 1.3), a = far * (Math.PI / 2 + rnd(-0.6, 0.6)), gap = rnd(1.6, 1.75); let L = from.r * 1.08 + gap + r * 1.08; const n = { x: from.x + Math.cos(a) * L, y: from.y + Math.sin(a) * L, r, s: rnd(0, 6.3), chain: false, dare: true, from };
        L += gap - islGapTo(m, from, n); n.x = from.x + Math.cos(a) * L; n.y = from.y + Math.sin(a) * L;
        if (inDrop(n) && out.every(o => o === from || Math.hypot(o.x - n.x, o.y - n.y) > o.r + n.r + 2.4)) { out.push(n); laid = true; } }
      if (laid) break; }
  }
  return out;
}
const mtnRavs = m => m.ravs || [];
// for drawing, every spine ravine on a screen is one field (where two cross, the drop is one drop, not a strip of
// ground between): traced together, the deepest one's depth
function mtnDrawRavs(m) {
  if (m.ravDraw) return m.ravDraw;
  const sp = mtnRavs(m);
  return (m.ravDraw = sp.length ? ([{ spine: [].concat(...sp.map(r => r.spine)), floor: false, depth: Math.max(...sp.map(r => r.depth || 5)), river: [].concat(...sp.map(r => genRavRiver(r))) }]) : []);   // (each ravine's own river, or none if it says so)
}
const ravGap = (r, x, y, pad) => ravFieldAt(r, x, y) < pad;
const mtnGap = (m, x, y, pad = 0) => mtnRavs(m).some(r => ravGap(r, x, y, pad)) && !onIsl(m, x, y, pad);   // over the drop, unless on an island
// the way between its two walls of stone: 14 tiles wide where the view is close, opening out as it pulls back
const mtnHalf = (m, x) => 7 + 8 * mtnView(m, x);

function mtnColor(m, x, y) {
  const h = mtnH(m, x, y), gx = mtnH(m, x + 0.3, y) - mtnH(m, x - 0.3, y), gy = mtnH(m, x, y + 0.3) - mtnH(m, x, y - 0.3);
  const lit = mtnClamp(0.35 * gx / 0.6 - 0.2 * gy / 0.6, -0.8, 0.8) * (0.4 + 0.6 * mtnClamp((h - 3) / 6));   // faces turned to the light (west) catch it
  const base = parseInt(m.floor.slice(1), 16), k = mtnClamp((h - (m.stoneAt || 5)) / 6);       // the fields' grass, going over to stony turf, then stone
  let c = [base >> 16, (base >> 8) & 255, base & 255];
  if (m.earth) { const e = parseInt(m.earth.slice(1), 16), n = mtnClamp(0.5 + 0.9 * Math.sin(x * 0.37 + y * 0.9) * Math.sin(x * 0.11 - y * 0.23 + 2) + 0.3 * Math.sin(x * 1.3 + y * 0.4)); c = c.map((v, i) => v + ([e >> 16, (e >> 8) & 255, e & 255][i] - v) * n * n); }   // bare tan earth showing through the dry grass
  c = c.map((v, i) => v + ((m.stone || [132, 130, 118])[i] - v) * k);
  if (m.islTop === 'bare' && onIsl(m, x, y)) { const g = 0.5 + 0.5 * Math.sin(x * 2.1 + y * 1.7) * Math.sin(x * 0.7 - y * 1.3); c = c.map((v, i) => v + ([138 + g * 14, 128 + g * 12, 108 + g * 10][i] - v) * 0.85); }   // bare tops: grit and stone, no turf
  const d = m.pathD(x, y);
  if (d < 0.75 && x > m.X0 && !m.plates) { const w = (1 - d / 0.75) * 0.75; c = c.map((v, i) => v + ([150, 132, 98][i] - v) * w); }
  return 'rgb(' + c.map(v => Math.round(mtnClamp(v + lit * 30, 0, 255))).join(',') + ')';
}


// how far along the change you are (0 = looking straight down, 1 = pulled back and tipped at the far end)
const mtnView = (m, x) => m.fixed ? m.fixed.p : mtnClamp((x - 1) / (m.len - 10));   // evenly, from the first step to the foot: no late rush (a fixed screen holds one view)
// a moving view shrinks with p; a fixed screen (m.fixed) shows its whole width when the screen allows, never smaller than the floor
const mtnZoom = (p, m) => (state.edit ? state.edit.zoom : 1) * (m && m.fixed ? m.fixed.zoom || Math.max(mtnZoomMin(), Math.min(1, SW / ((m.len + 1) * UNIT))) : 1 - (1 - mtnZoomMin()) * p);   // (fixed.zoom: a close fixed view, the moving screens' zoom at that p; the editor's wheel scales it)
const mtnLead = (m, p) => Math.min(m.lead, 0.3 * SW / 2 / (UNIT * mtnZoom(p, m))) * p;   // how far ahead of you the view looks (less on a narrow screen)
// the one projection, tiles to the screen (whatever size the scene is): the view's zoom and tilt at p, then, on a
// screen with an eye (m.eye, tiles up: the plates' screens), the eye's push-out from the screen's centre of anything
// above the camera's ground, 1 + z / eye (linear, so a tall stack never blows up; the ravines' floors keep their
// 14 / (14 + depth), the same to first order)
const mtnPush = (z, c = state.mtn) => c.m.eye ? 1 + mtnClamp(z - c.ch, -c.m.eye / 2, c.m.eyeMax || 3) / c.m.eye : 1;   // the eye's push-out at a height (capped: the mountain past the foot, tens of tiles up, would fold its rows over and let the sky through)
// Turned (224, the editor's camera: c.yaw, radians; 0 in play): the ground is turned about the view's middle before
// the tilt, so the view's south is the turned y. mtnDepth gives that turned y for any point: every draw key that was
// a tile y (what stands where, the ravines' top edge, the plates' order in platesLay) is a depth along it instead
function mtnProj(x, y, z, c = state.mtn) {
  const s = mtnZoom(c.p, c.m), th = c.m.tilt * c.p, k = mtnPush(z, c), ps = c.yaw || 0, dx = x - c.cx, dy = y - c.cy, cs = Math.cos(ps), sn = Math.sin(ps), xr = dx * cs - dy * sn, yr = dx * sn + dy * cs;
  return [SW / 2 + xr * UNIT * s * k, SH / 2 + (yr * Math.cos(th) - (z - c.ch) * Math.sin(th)) * UNIT * s * k];
}
// the window (226): what was drawn before fn, round you, laid back over fn through a soft disc (full to 0.55 of its
// radius, gone at its edge; k its strength, opening). A copy of the screen's pixels there, before and after
const MTN_WIN = 2.2, MTN_XRAY = 0.7;                                                        // the window's radius in tiles; how much of you must be hidden for the x-ray
let MTN_WINCV = null;
function mtnWindow(w, k, fn) {
  const T = ctx.getTransform ? ctx.getTransform() : null, cv = ctx.canvas;
  if (!T || !cv || typeof document === 'undefined' || k <= 0) return fn();
  const x0 = T.a * (w.X - w.R) + T.e, y0 = T.d * (w.Y - w.R) + T.f, sz = Math.ceil(2 * w.R * T.a);
  if (!(sz > 0)) return fn();
  if (!MTN_WINCV) MTN_WINCV = document.createElement('canvas'); const c = MTN_WINCV; if (c.width !== sz || c.height !== sz) { c.width = sz; c.height = sz; } const g = c.getContext && c.getContext('2d'); if (!g || !g.drawImage) return fn();
  g.globalCompositeOperation = 'copy'; g.drawImage(cv, x0, y0, sz, sz, 0, 0, sz, sz);
  fn();
  g.globalCompositeOperation = 'destination-in'; const gr = g.createRadialGradient(sz / 2, sz / 2, sz * 0.275, sz / 2, sz / 2, sz / 2); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, sz, sz); g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, x0, y0); ctx.restore();
}
const windAt = (shapes, x, y) => { let n = 0; for (const P of shapes) for (let i = 0; i < P.length; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length]; if (ay <= y) { if (by > y && (bx - ax) * (y - ay) - (x - ax) * (by - ay) > 0) n++; } else if (by <= y && (bx - ax) * (y - ay) - (x - ax) * (by - ay) < 0) n--; } return n !== 0; };   // inside their union (nonzero: a hole wound the other way is out)
function mtnDepth(x, y, c = state.mtn) { const ps = c && c.yaw || 0; return ps ? x * Math.sin(ps) + y * Math.cos(ps) : y; }   // how far along the view's south a tile is (its y, until the view turns)
const mtnAcross = (x, y, c = state.mtn) => { const ps = c && c.yaw || 0; return ps ? x * Math.cos(ps) - y * Math.sin(ps) : x; };   // and how far along its east

// the land, laid out once in tiles: rows of heights and colours, and everything standing on it. A screen's layout
// puts its props in order from its own stream (m.seed), with the pieces below
function mtnLand(m) {
  if (m.land) return m.land;
  const { X0, X1, Y0, Y1 } = m, dx = m.dx || 1, xs = []; for (let x = X0; x <= X1 + 1e-9; x += dx) xs.push(x);   // the columns, a tile apart (dx: finer, where a ravine's edge needs it)
  let s = m.seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const props = [], put = (k, x, y, r, solid) => props.push({ k, x, y, r, solid, seed: rnd() * 9, v: Math.floor(rnd() * 3), by: y + (k === 'tuft' ? 0.1 : k === 'tree' ? 0.3 : r * 0.9) });
  const pl = m.plates ? platesLay(m) : null;                                             // the plates first (plates.js): nothing else stands on one
  const clearOf = (x, y, r) => !props.some(p => p.solid && Math.hypot(p.x - x, p.y - y) < p.r + r + 0.2) && !(pl && platesAt(pl, x, y, r + 0.3));
  m.layout({ m, put, rnd, clearOf });
  // what stands inside the scene is a solid the game tests; the rest (tufts, the far land) is only drawn
  const inside = p => p.solid && p.x > -2 && p.x < m.len + 2 && p.y > -2 && p.y < m.D + 2;
  const onLand = props.filter(p => !mtnGap(m, p.x, p.y, p.r + 0.3));                            // nothing stands in a ravine
  const deco = onLand.filter(p => !inside(p)).sort((a, b) => a.by - b.by);
  return (m.land = { xs, rows: null, solids: onLand.filter(inside), deco });
}
// grass tufts over the low ground
function mtnTufts({ m, put, rnd }, n) {
  for (let i = 0; i < n; i++) { const x = m.X0 + rnd() * (m.X1 - m.X0), y = m.Y0 + rnd() * (m.Y1 - m.Y0); if (x < m.foot(y) - 1 && mtnH(m, x, y) < 9 && !mtnGap(m, x, y, 0.4)) put('tuft', x, y, 0.3, false); }
}
// the pass at the far end: east into the mountain between two unbroken walls of crags, then south between two more,
// out of the screen; the mountain's stone heaped either side of it
function mtnPass({ m, put, rnd, clearOf }, open) {
  const { Y0, Y1 } = m, oX = m.outX, oW = oX - 2.9, oE = oX + 3.2, inPassOut = (x, y) => x > oX - 4.5 && x < oX + 4 && y > m.pathY(x) - 3;
  if (!open) for (let x = m.foot(m.pathY(oX - 5.2)) - 1; x < m.len + 2; x += 0.85) for (const sd of [-1, 1]) { if (sd > 0 && x > oW - 0.3) continue; const r = 0.55 + rnd() * 0.3, y = m.pathY(x) + sd * (1.6 + r); if (x > m.foot(y) - 0.5) put('crag', x, y, r, true); }
  if (!open) for (const [wx, from] of [[oW, m.pathY(oW) + 2.1], [oE, m.pathY(oE) - 1.6]]) for (let y = from; y < m.D + 1.5; y += 0.85) put('crag', wx + (rnd() - 0.5) * 0.2, y, 0.55 + rnd() * 0.3, true);
  for (let i = 0; i < 110; i++) { const y = Y0 + rnd() * (Y1 - Y0), x = m.foot(y) + 1 + rnd() * 40, r = 0.7 + rnd() * 0.8; if (m.pathD(x, y) < 3.5 + r || inPassOut(x, y) || !clearOf(x, y, r * 0.6)) continue; put('crag', x, y, r, true); }
}
// the rise's layout: its walls (the north one starts past the way in; a short wall closes the corner above it, another
// the west end), the first stretch, the foot, the pass, stones and trees on the way, tufts
function riseRavines(m) {
  const seed = m.seed * 101;
  const big = genRavine('long', seed + 1, [16.5, -8], Math.PI / 2, 25);
  { const br = big.spine[0], [x, y] = br[br.length - 1]; br.push([x + 1.3, y + 1.0, 1.7], [x + 2.4, y + 1.7, 1.1], [x + 3.1, y + 2.2, 0.5]); }   // its tail bends east and ends under the reeds
  const slit = genRavine('thin', seed + 2, [40, -8], Math.PI / 2, 46, 0.6);
  for (const q of slit.spine[0]) { const d = Math.abs(q[1] - m.pathY(q[0])); if (d < 2.2) q[2] = Math.min(q[2], 0.45 + 0.3 * d / 2.2); else q[2] = Math.max(q[2], 0.9); }   // a running jump where the path crosses it
  const third = genRavine('thin', seed + 3, [58, -8], Math.PI / 2 + 0.3, 14);
  return [big, slit, third];
}
RISE.layout = function (lay) {
  const m = this, { put, rnd, clearOf } = lay, { X0, Y0, Y1 } = m;
  const nearBar = x => Math.abs(x - m.barX) < 1.6;
  if (!m.ravs) { m.ravs = riseRavines(m); m.ravDraw = null; }
  // the first stretch: stones and trees to duck behind when a rabbit comes (off the path, inside the walls), and the
  // tree just before the reeds
  for (const [x, dy, k] of [[6, 4.5, 'boulder'], [8.5, -3.2, 'tree'], [10.5, 3.4, 'boulder'], [12.5, -4.5, 'boulder'], [13.5, 4.8, 'tree'], [15.5, -3, 'boulder'], [16.5, 3.2, 'boulder'], [7, -5.2, 'boulder']]) {
    const y = m.pathY(x) + dy; if (!mtnGap(m, x, y, 1.2)) put(k, x, y, k === 'tree' ? 1.2 : 0.7 + rnd() * 0.25, true);
  }
  mtnPass(lay, true);
  // on the way: a few stones and trees (never on the path, none by the reeds, no tree before the first), grass tufts
  for (let i = 0; i < 60; i++) { const x = X0 + rnd() * (m.foot(15) - X0 - 4), y = Y0 + rnd() * (Y1 - Y0), r = 0.45 + rnd() * 0.5; if (m.pathD(x, y) < 2.2 || nearBar(x) || mtnGap(m, x, y, r + 0.3) || !clearOf(x, y, r)) continue; put(x > 36 ? 'crag' : 'boulder', x, y, r, true); }
  for (let i = 0; i < 18; i++) { const x = 23 + rnd() * 47, y = Y0 + rnd() * (Y1 - Y0); if (m.pathD(x, y) < 2.4 || mtnGap(m, x, y, 1.0) || !clearOf(x, y, 0.6)) continue; put('tree', x, y, 1.2, true); }
  mtnTufts(lay, 420);
};
// the ground's rows, made the first time the rise is drawn (the world is built without them: tests load faster)
function mtnRows(m, land = mtnLand(m)) {
  if (land.rows) return land.rows;
  const { Y0, Y1 } = m, xs = land.xs, rows = []; let y = Y0;
  while (y < Y1) {
    const st = Math.abs(y - m.mid) < (m.fine || 3.5) ? 0.25 : 0.5, y2 = y + st, ym = y + st / 2;      // finer rows where the path wanders (and the ravine runs)
    rows.push({ y, y2, top: xs.map(x => mtnH(m, x, y)), bot: xs.map(x => mtnH(m, x, y2)), cols: xs.map(x => mtnColor(m, x, ym)), grad: null });
    y = y2;
  }
  return (land.rows = rows);
}
// collision radius as the game scales it for each kind (engine's refreshSceneGeometry): a stone collides at its drawn size
const MTN_KIND = { boulder: 'boulder', crag: 'crag', tree: 'tree' }, MTN_F = { boulder: 0.95, crag: 1.15, tree: 1 };

// a screen of the family as a scene, built with the world (no rng: the rest of the world is laid out exactly as before):
// its size, its props as solids, then whatever the screen adds (m.finish: barriers, spawns, exits)
function addMtn(S, add, m) {
  const land = mtnLand(m), { len, D } = m;
  const sc = add(newScene({ id: m.id, ...m.scene }));
  sc.virt = [len, D];                                                                   // its size in tiles (sceneSize)
  if (mtnRavs(m).length) { sc.chasms = []; sc.mtnGap = (x, y, pad) => mtnGap(m, x / UNIT, y / UNIT, pad / UNIT); }   // the ravine: isChasm asks the same shape the rows draw (chasms: the drop is in play)
  for (const p of land.solids) sc.solids.push({ fx: p.x / len, fy: p.y / D, r: p.k === 'tree' ? p.r : p.r / MTN_F[p.k], kind: MTN_KIND[p.k], v: p.v, flip: p.seed > 4.5, pal: 'green', rise: p.k, rr: p.r, seed: p.seed });
  m.finish(sc, S);
  return sc;
}
// a screen built only when it is first entered or edited (238: the canyon, EPIC.late): genWorld leaves it out, so the
// world's rng never sees it and a test that never goes there never pays for it. Built as buildWorld builds, at GEN's size
function worldScene(id) {
  const m = MTN[id];
  if (WORLD[id] || !m || !m.late) return WORLD[id];
  const saved = [W, H, UNIT]; W = GEN.W; H = GEN.H; computeUnit();
  try { return addMtn(WORLD, sc => (WORLD[sc.id] = sc), m); } finally { [W, H, UNIT] = saved; }
}
// the rise, where f2 was: the first field's south way leads in at the north-west corner, and the pass at the far end
// leads south onto the stepping path (213; the wind shelf, mt1, from 207 to 212)
RISE.scene = { area: 'field', depth: 2, msg: 'The ground starts to climb. Rabbits, too.', music: 'field', amb: 'wind', floor: RISE.floor, speed: 0.45, accel: 8 };
// the mountain holds you: east of its foot the stone rises and nothing walks on it, except along the way (the pass:
// within 2.2 tiles of the path, east into the mountain and south out of it). Something that gets in is put back on
// the nearer of the foot and the way's edge
function mtnHold(m, a) {
  const x = a.x / UNIT, y = a.y / UNIT, f = m.foot(y) + 0.3;
  if (x <= f || m.pathD(x, y) <= 2.2) return false;
  const cands = [[f, y]];                                                                // back west to the foot
  if (x <= m.outX + 2.2) { const px = Math.min(x, m.outX), py = m.pathY(px); cands.push([px, py + (y < py ? -2.15 : 2.15)]); }   // onto the way east
  { const y1 = m.pathY(m.outX); if (y >= y1 - 0.5) { const t = mtnClamp((y - y1) / (m.D + 1 - y1)), cx = m.outX + 0.6 * t; cands.push([cx + (x < cx ? -2.15 : 2.15), y]); } }   // onto the way south
  let best = null, bd = Infinity;
  for (const c of cands) { if (!(c[0] <= m.foot(c[1]) + 0.3 || m.pathD(c[0], c[1]) <= 2.2)) continue; const d = Math.hypot(c[0] - x, c[1] - y); if (d < bd) { bd = d; best = c; } }
  if (!best) return false;
  if (best[0] !== x) a.vx = 0; if (best[1] !== y) a.vy = 0;
  a.x = best[0] * UNIT; a.y = best[1] * UNIT;
  return true;
}
RISE.finish = function (sc, S) {
  const m = this, { len, D } = m, oX = m.outX, oW = oX - 2.9, oE = oX + 3.2;
  sc.mtnHold = a => mtnHold(m, a);
  // the wind, as on the first field: the same gusts (two gentle, one strong, from the same quarters), tall grass that
  // leans the way the next one will blow, loose fluff and you and Pip nudged or shoved, cloud shadows drifting.
  // (No ledges to ride to here: a jump into the strong gust is just a jump.)
  sc.gusts = S.f1.gusts.map(g => ({ ...g }));
  sc.feat.plants = [[4.5, -2.8], [14.5, 2.4], [30, -4], [47, 4.5], [62, -5]].filter(([x, dy]) => !mtnGap(m, x, m.pathY(x) + dy, 1)).map(([x, dy]) => [x / len, (m.pathY(x) + dy) / D]);
  // the reeds: dense, wall to wall, just past the tree at x 18. For now nothing gets through, fire included (no bar:
  // nothing breaks them). To open them to fire later, give each clump bar: 'risereeds'
  { const br = m.ravs[0].spine[0], tail = br.slice(-4), clump = (x, y, k) => sc.solids.push({ fx: x / len, fy: y / D, r: 0.72, kind: 'reeds', v: Math.abs(Math.floor(k)) % 3, flip: k % 2 < 1, pal: null, reedwall: true });
    tail.forEach(([x, y, w], i) => { clump(x, y + w + 0.45, i); clump(x, y - w - 0.45, i + 1); clump(x + 0.6, y, i + 2); });   // reeds along and over the big ravine's tail, both banks: no squeezing round its end
    const x = m.barX; for (let y = 16.0; y <= m.D + 1.2; y += 0.85) sc.solids.push({ fx: (x + Math.sin(y * 2.1) * 0.25) / len, fy: y / D, r: 0.72, kind: 'reeds', v: Math.floor(y) % 3, flip: y % 2 < 1, pal: null, reedwall: true }); }
  for (const [x, y] of [[11, 18.8], [11.5, 8.4]]) sc.spawns.push({ type: 'rabbit', fx: x / len, fy: y / D });   // two rabbits in the first stretch: two tufts of fluff
  const f1s = S.f1.exits.find(e => e.to === 'rise');
  sc.exits.push({ side: 'n', a: 0.8 / len, b: (m.inX + 3) / len, to: 'f1', arrive: [(f1s.a + f1s.b) / 2, 0.91] });
  sc.exits.push({ side: 's', a: (oW + 0.8) / len, b: (oE - 0.8) / len, to: 'mt2', arrive: [M2.inX / M2.len, 1.2 / M2.D] });   // through the pass onto the stepping path
  f1s.arrive = [m.inX / len, 1.2 / D];
};
// the stepping path's layout: the drop first (m2Ravine), then the islands laid across it (genIslands), then the pass
// (open: the edges and the mountain hold, as on the rise), stones on the banks (none near the way, none at a lip), tufts
M2.layout = function (lay) {
  const m = this, { put, rnd, clearOf } = lay, { X0, Y0, Y1 } = m;
  if (!m.ravs) { m.ravs = [m2Ravine(m)]; m.ravDraw = null; m.isls = genIslands(m); }
  mtnPass(lay, true);
  for (let i = 0; i < 40; i++) { const x = X0 + rnd() * (m.foot(12) - X0 - 4), y = Y0 + rnd() * (Y1 - Y0), r = 0.45 + rnd() * 0.5; if (m.pathD(x, y) < 2.2 || mtnGap(m, x, y, r + 1.2) || !clearOf(x, y, r)) continue; put('crag', x, y, r, true); }
  mtnTufts(lay, 200);
};
// the plates' test layout (212, the pit 213, in its file since 215): on the south-west bank a staggered stack of four with a pitfall punched
// through all of it to the base, each plate a ledge inside it a hop above the last (the way out), a short stack beside it with a face partway up, a perch of two, and a seam across the bank
// from the west edge to the drop's lip; on the north bank's east end a step of two. Nothing on the way.
M2.plates = pl => plateLayout(pl, 'mt2');                                                 // src/layouts/mt2.js (laid in the editor, ?edit=mt2)
M2.scene = { area: 'field', depth: 4, msg: 'The stepping path. Islands out in the drop, each a jump from the last.', music: 'field', amb: 'wind', floor: M2.floor, speed: 0.45, accel: 8 };
M2.finish = function (sc, S) {
  const m = this, { len, D } = m, oX = m.outX, oW = oX - 2.9, oE = oX + 3.2;
  sc.mtnHold = a => mtnHold(m, a) || (a === state.hero ? plateStepHero(m, a) : plateHold(m, a));   // the mountain holds; the hero climbs the plates (213), the rest are held off them until 214
  sc.mtnIsle = (x, y, pad) => onIsl(m, x / UNIT, y / UNIT, pad / UNIT);                  // on an island: no drop, no shove, a safe spot
  sc.gusts = S.f1.gusts.map(g => ({ ...g }));                                           // the same wind, over the drop (no rides here: this screen is jumped)
  sc.feat.plants = [[7, -2.4], [33, 2.4]].map(([x, dy]) => [x / len, (m.pathY(x) + dy) / D]);
  const dare = m.isls.find(i => i.dare);
  if (dare) for (const [dx, dy] of [[-0.5, 0.2], [0.5, 0.2]]) sc.initItems.push({ type: 'carrot', fx: (dare.x + dx) / len, fy: (dare.y + dy) / D });   // the dare's carrots
  for (const [x, dy] of [[7, 3.2], [33, -3]]) sc.spawns.push({ type: 'hare', fx: x / len, fy: (m.pathY(x) + dy) / D });   // a hare on each bank
  sc.exits.push({ side: 'n', a: 0.8 / len, b: (m.inX + 3) / len, to: 'rise', arrive: [RISE.outX / RISE.len, 1 - 1.2 / RISE.D] });
  sc.exits.push({ side: 's', a: (oW + 0.8) / len, b: (oE - 0.8) / len, to: 'climb3' });   // the climb lays its own start
};
// the scene's own size in pixels, while it is the current one (every other scene is the screen)
const sceneSize = id => { const sc = typeof WORLD !== 'undefined' && WORLD && WORLD[id]; return sc && sc.virt ? [sc.virt[0] * UNIT, sc.virt[1] * UNIT] : [SW, SH]; };

function newMtnCam(m) { const c = { m, p: 0, cx: 0, cy: m.mid, ch: 0 }; mtnCamera(0, c, true); for (const r of mtnDrawRavs(m)) if (r.spine) { ravRings(r); genRavRiver(r); } for (const r of mtnRavs(m)) if (r.spine) ravGrid(r); return c; }   // (the ravines worked out on the way in, not on the first frame)
// the view: pulled back and tipped by how far along you are, looking ahead up the slope; it eases, never snaps
function mtnCamera(dt, c = state.mtn, snap) {
  if (!c) return;
  const m = c.m, h = state.hero, x = h.x / UNIT, y = h.y / UNIT, p = mtnView(m, x), e = snap ? 1 : 1 - Math.exp(-2.5 * dt);
  if (state.edit && !state.edit.trying && state.scene === state.edit.id) { const E = state.edit; c.p = E.p; c.cx = E.cx; c.cy = E.cy; c.ch = mtnH(m, E.cx, E.cy); c.yaw = E.yaw || 0; return; }   // the editor's free view (edit.js)
  c.yaw = 0;                                                                            // (the game's own camera never turns: T tries the layout at it)
  if (m.fixed) {                                                                        // a still view at one tilt and zoom (the whole screen, or close: fixed.zoom); on a screen too narrow for it, it slides along with you, never past the ends
    const z = mtnZoom(p, m), half = SW / 2 / (UNIT * z), halfY = SH / 2 / (UNIT * z * Math.cos(m.tilt * p)), cx = m.fixed.follow ? x : half * 2 >= m.len ? m.len / 2 : mtnClamp(x, half, m.len - half), cy = m.fixed.follow ? y : halfY * 2 >= m.D ? m.mid - m.lift * p : mtnClamp(y, halfY, m.D - halfY);   // (follow: the view centres on you, past the scene's edges too, so the eye is always over you and you see down into whatever you're in)
    c.p = p; c.cx += (cx - c.cx) * e; c.cy += (cy - c.cy) * e; c.ch += (mtnH(m, c.cx, c.cy) - c.ch) * e; return;
  }
  c.p += (p - c.p) * e; c.cx += (x + mtnLead(m, p) - c.cx) * e; c.cy += (y + (m.mid - y) * p - m.lift * p - c.cy) * e; c.ch += (mtnH(m, x, y) - c.ch) * e;
}
// a point of the scene (in its pixels) on the screen: toScreen uses this on a mountain screen, so speech and hints sit right
const mtnToScreen = (x, y) => { const m = state.mtn.m, xt = x / UNIT, yt = y / UNIT; return mtnProj(xt, yt, mtnH(m, xt, yt) + (m.plates ? plateTopAt(platesLay(m), xt, yt) : 0)); };   // (on a plate, its top)

function drawMtn() {
  const r = state.mtn; if (!r) return;
  const m = r.m, land = mtnLand(m), s = mtnZoom(r.p, m), th = m.tilt * r.p, st = Math.sin(th), us = UNIT * s;
  const pt = (x, y, z) => mtnProj(x, y, z, r), gp = (x, y) => pt(x, y, mtnH(m, x, y));   // the one projection: a point in tiles at a height, and a point on the ground
  const pl = m.plates ? platesLay(m) : null, pr = (x, y, z) => pt(x, y, mtnH(m, x, y) + z);
  let win = null; const winOf = (o, fn) => () => win && (win.plates.has(o) || win.trees.has(o)) ? mtnWindow(win, r.winK, fn) : fn();   // (set once you're placed, below)   // a plates screen: heights above the base plate's surface
  const dep = (xt, yt) => mtnDepth(xt, yt, r), turned = !!r.yaw;                         // a thing's draw key: how far along the view's south it stands (its tile y, until the editor turns the view)
  // the sky and a far range, seen only once the view tips up past the land's far edge
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9cc6e4'); g.addColorStop(1, '#e8e2c8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const hz = pt(r.cx, m.Y0, 0)[1];
  if (hz > 0) { ctx.fillStyle = '#a9b4c4'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hz - UNIT * (1.2 + 2.4 * Math.abs(Math.sin(x * 0.004 + 1)) + 0.5 * Math.sin(x * 0.013))); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); }
  const dx = m.dx || 1, i0 = Math.max(0, Math.floor((r.cx - W / 2 / us - 2 - m.X0) / dx)), i1 = Math.min(land.xs.length - 1, Math.ceil((r.cx + W / 2 / us + 2 - m.X0) / dx));
  const idx = []; for (let i = i0; i < i1; i++) idx.push(i); idx.push(i1);   // (every tile, always: a stride that shifted with the camera made the ground's edges shimmer)
  // everything standing, back to front by where it touches the ground (in tiles, at its lowest edge: the ground laid
  // after it is all in front of it), drawn with the game's own code
  // at its spot on the tipped ground, scaled with the view; the ground's rows are laid between them
  const [VW, VH] = sceneSize(state.scene), SWH = [W, H];
  const lift = (xt, yt, o) => !pl ? 0 : o === state.hero && h.liftAt === state.scene ? h.lift || 0 : plateTopAt(pl, xt, yt);   // standing on a plate: drawn on its top
  const at = (px, py, fn, mg = 4, o) => { const xt = px / UNIT, yt = py / UNIT, z = lift(xt, yt, o), [X, Y] = pr(xt, yt, z), k = s * mtnPush(mtnH(m, xt, yt) + z, r); if (X < -us * mg || X > SWH[0] + us * mg || Y < -us * (mg + 1) || Y > SWH[1] + us * (mg + 1)) return; ctx.save(); ctx.translate(X, Y); ctx.scale(k, k); ctx.translate(-px, -py); [W, H] = [VW, VH]; try { fn(); } finally { [W, H] = SWH; ctx.restore(); } };   // (scaled with the eye's push-out: lower is further away and smaller)
  const one = (key, o, fn) => { const all = state[key]; state[key] = [o]; try { fn(); } finally { state[key] = all; } };   // the game's draw for a list, for one of them
  const list = [];
  for (const p of land.deco) list.push([dep(p.x, p.y) + (p.by - p.y), () => drawMtnProp(m, p, gp, us, s)]);
  const sc = sceneDef(), h = state.hero, stoneE = new Map();   // (stoneE: a stone's place in the list, to raise it past you: 239)
  for (const o of state.solids) {
    if (o.rise === 'tree' || o.kind === 'reeds') list.push([dep(o.x / UNIT, o.y / UNIT) + (o.kind === 'reeds' ? o.r / UNIT + 0.2 : 0.3), winOf(o, () => at(o.x, o.y, () => o.kind === 'reeds' ? drawSolid(o) : drawTree(o)))]);
    else if (o.rise) { const e = [dep(o.x / UNIT, o.y / UNIT) + o.rr * 0.9, () => drawMtnProp(m, { k: o.rise, x: o.x / UNIT, y: o.y / UNIT, r: o.rr, seed: o.seed }, gp, us, s)]; list.push(e); stoneE.set(o, e); }
  }
  let hole = null;                                                                      // the ravine: a hole in the ground's rows, painted once right after the row its north lip first reaches
  if ((mtnRavs(m).length || pl) && typeof Path2D === 'function') { hole = new Path2D(); hole.rect(-W, -H, W * 3, H * 3); }
  let holeY0 = Infinity, holeY1 = -Infinity, holeX0 = Infinity, holeX1 = -Infinity;                // the holes' extent on the screen: a row that misses it needs no clip
  const add = (P, pts) => { if (!P) return; pts.forEach(([X, Y], k) => k ? P.lineTo(X, Y) : P.moveTo(X, Y)); P.closePath(); };
  // a plates screen: the base plate covers the scene (the rows stop at its edge and it is painted first, in chunks,
  // the ravines and islands cut from it as the rows are cut elsewhere), and every plate is drawn in its turn
  // a plates screen: the base plate (the scene and a margin round it) is ground painted in one go, its rows first
  // and the plates' wash over them, before anything standing; the rows outside it go on as everywhere else, and every
  // plate is drawn in its turn
  let baseIn = null;
  if (pl && hole) { const ring = plateRing(m).map(([x, y]) => gp(x, y)); baseIn = new Path2D(); add(baseIn, ring); for (const [X, Y] of ring) { if (Y < holeY0) holeY0 = Y; if (Y > holeY1) holeY1 = Y; if (X < holeX0) holeX0 = X; if (X > holeX1) holeX1 = X; } }
  // a ravine is painted only on the land: clipped to below the land's far edge (the first row's top), never into the
  // sky; with the view turned (the editor) the base plate's ring is the land's edge
  let landClip = null;
  if (mtnDrawRavs(m).length && typeof Path2D === 'function') { if (turned && baseIn) landClip = baseIn; else { const row0 = mtnRows(m, land)[0]; landClip = new Path2D(); landClip.moveTo(-W, H * 3); idx.forEach(i => { const [X, Y] = pt(land.xs[i], row0.y, row0.top[i]); landClip.lineTo(X, Y); }); landClip.lineTo(W * 2, H * 3); landClip.closePath(); } }
  const onLand = fn => () => { ctx.save(); if (landClip) ctx.clip(landClip); fn(); ctx.restore(); };
  if (pl) platesListed(list, m, pl, pr, s, us, baseIn, hole, fillRows, winOf);
  for (const r0 of mtnDrawRavs(m)) {
    const rvs = mtnRavinePts(m, r0, gp); if (!rvs.length) continue;
    for (const rv of rvs) for (const [X, Y] of rv.N) { if (Y < holeY0) holeY0 = Y; if (Y > holeY1) holeY1 = Y; if (X < holeX0) holeX0 = X; if (X > holeX1) holeX1 = X; }
    // a spine ravine: the rows stop at its brink's outer edge, and the ravine paints the brink itself, ground first, at
    // its own turn (before anything standing south of its top: you, the reeds and the stones all stand on it)
    const proj = iso => ravRings(r0, iso).map(ring => ring.map(([x, y]) => gp(x, y))), band = hole ? new Path2D() : null, cutTo = hole;
    for (const O of proj(0.4)) { add(cutTo, O); for (const [X, Y] of O) { if (Y < holeY0) holeY0 = Y; if (Y > holeY1) holeY1 = Y; } }
    if (band) for (const O of proj(0.5)) add(band, O);   // (the brink's ground reaches a tenth of a tile past where the rows stop: the rows' edge falls on ground of its own colour, no seam)
    if (band) for (const rv of rvs) add(band, rv.N);
    // the islands: their tops are left in the rows (a ring inside the hole's, cut back 0.4 as the rows are at a lip),
    // their brink is a band 0.5 inside their edge, their pillars are painted inside the drop before the brink
    const pr2 = ring => ring.map(([x, y]) => gp(x, y));
    const isls = (m.isls || []).map(i => ({ i, N: pr2(islRing(i)), S: [], yTop: mtnDepth(i.x, i.y, r) - i.r, r: r0 }));
    for (const I of isls) { add(cutTo, pr2(islRing(I.i, 0.4))); if (!pl) add(band, pr2(islRing(I.i, 0.5))); add(band, I.N); }   // (on a plates screen the ground is painted before the ravine, so an island's whole top is the brink pass's: no hollow)
    list.push([Math.min(...rvs.map(rv => rv.yTop)) + 0.26, onLand(() => { for (const rv of rvs) drawMtnRavine(rv, s);
      if (isls.length) { ctx.save(); ctx.beginPath(); for (const rv of rvs) rv.N.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.clip(); { const d = I => { const [X, Y] = gp(I.i.x, I.i.y); return Math.hypot(X - W / 2, Y - H / 2); }; for (const I of isls.slice().sort((a, b) => d(b) - d(a))) drawMtnPillar(m, I.i, rvs[0], s, gp); } ctx.restore(); }   // (pillars outermost first: a pillar's wall reaches in toward the middle of the view, under the ones nearer it)
      if (band) drawMtnBrink(rvs.concat(isls), s, band, fillRows, ravPal(m)); })]);
  }
  const onK = (x, y, k) => { const xt = x / UNIT, yt = y / UNIT, z = pl ? plateTopAt(pl, xt, yt) : 0; return z > 0 ? Math.max(k, plateKeyUnder(pl, xt, yt, z)) : k; };   // on a plate: after its top
  for (const it of state.items) list.push([onK(it.x, it.y, dep(it.x / UNIT, it.y / UNIT) + 0.4), () => at(it.x, it.y, () => one('items', it, drawItems))]);
  for (const e of state.enemies) list.push([dep(e.x / UNIT, e.y / UNIT) + e.r / UNIT + 0.1, () => at(e.x, e.y, () => drawEnemy(e))]);
  for (const [fx, fy] of sc.feat.plants || []) { const px = fx * VW, py = fy * VH; list.push([dep(px / UNIT, py / UNIT) + 0.1, () => at(px, py, () => drawGustGrass(px, py, sc))]); }   // the tall grass, the wind's gauge
  if (pipDrawn(sc)) list.push([dep(state.pip.x / UNIT, state.pip.y / UNIT) + 0.55, () => at(state.pip.x, state.pip.y, drawPipNow)]);
  const T = plateHeroTurn({ m, r, pl, h, pr, gp, dep, us, s, stoneE }), heroHid = T.hid; win = T.win;   // your turn: plates.js
  list.push([T.hk, () => at(h.x, h.y, () => { if (state.edit && !state.edit.trying) ctx.globalAlpha = 0.35; drawHero(); }, 4, h)]);   // (parked faint while the editor is up)
  for (const sh of state.shots) list.push([dep(sh.x / UNIT, sh.y / UNIT) + 0.4, () => at(sh.x, sh.y, () => one('shots', sh, drawShots))]);
  if (h.ride && h.ride.wind) list.push([dep(h.ride.x1 / UNIT, h.ride.y1 / UNIT) + 0.2, () => at(h.ride.x1, h.ride.y1, drawLandingShadow)]);   // mid-ride: where you'll come down
  list.sort((a, b) => a[0] - b[0]);
  let baseOut = null; if (baseIn) { baseOut = new Path2D(); baseOut.rect(-W, -H, W * 3, H * 3); baseOut.addPath(baseIn); }   // everything but the base: the rows outside it
  // a row of ground on the screen: its top and bottom edges (a point a column, through the one projection), a pixel of overlap so no seams show
  const geo = new Map(), rowGeo = row => { let G = geo.get(row); if (G) return G;
    if (!row.grad) { row.grad = ctx.createLinearGradient(m.X0, 0, m.X1, 0); row.cols.forEach((c, i) => { if (i % 2 === 0 || i === row.cols.length - 1) row.grad.addColorStop(i / (land.xs.length - 1), c); }); }   // a stop every other tile is plenty
    let lo = Infinity, hi = -Infinity; const tp = idx.map(i => { const q = pt(land.xs[i], row.y, row.top[i]); lo = Math.min(lo, q[1]); hi = Math.max(hi, q[1]); return q; }), bp = idx.map(i => { const q = pt(land.xs[i], row.y2, row.bot[i]); q[1] += 1; return q; });
    G = { tp, bp, lo, hi, show: !(hi < -UNIT * 4 || Math.min(...bp.map(q => q[1])) > H + UNIT * 4 && lo > H) }; geo.set(row, G); return G; };
  const fillRow = (row, G, j0 = 0, j1 = idx.length - 1) => { ctx.save(); ctx.translate(W / 2 - r.cx * us, 0); ctx.scale(us, 1); ctx.beginPath(); for (let j = j0; j <= j1; j++) j > j0 ? ctx.lineTo((G.tp[j][0] - W / 2) / us + r.cx, G.tp[j][1]) : ctx.moveTo((G.tp[j][0] - W / 2) / us + r.cx, G.tp[j][1]); for (let j = j1; j >= j0; j--) ctx.lineTo((G.bp[j][0] - W / 2) / us + r.cx, G.bp[j][1]); ctx.closePath(); ctx.fillStyle = row.grad; ctx.fill(); ctx.restore(); };   // (the row's gradient runs in tiles across the screen; the path is drawn in that space)
  // the rows on the screen between two heights and two x's (the slice of each), back to front, under a clip: the brink's ground
  function fillRows(y0, y1, X0, X1, every) {
    let j0 = 0, j1 = idx.length - 1; while (j0 < j1 && gp(land.xs[idx[j0 + 1]], m.mid)[0] < X0) j0++; while (j1 > j0 && gp(land.xs[idx[j1 - 1]], m.mid)[0] > X1) j1--;
    const rows = mtnRows(m, land).filter(row => { const G = rowGeo(row); return G.show && G.hi >= y0 - 2 && G.lo <= y1 + 2; });
    if (turned && Math.cos(r.yaw) < 0) rows.reverse();                                                   // (turned more than a quarter: the far rows are the high-numbered ones)
    if (every || pl) for (const row of rows) fillRow(row, rowGeo(row), j0, j1);                          // (the base plate's ground, and a plates screen's brink: every row)
    else for (let k = 0; k < rows.length; k += 3) { const a = rowGeo(rows[k]), b = rowGeo(rows[Math.min(rows.length - 1, k + 2)]); fillRow(rows[Math.min(rows.length - 1, k + 1)], { tp: a.tp, bp: b.bp }, j0, j1); }   // (three rows at a time, the middle one's colours: under a narrow band nobody sees the difference)
    if (pl) platesBase(m, pr, X0, X1); }                                                                 // (on a plates screen the base plate's wash lies on the ground)
  let li = 0;
  for (const row of mtnRows(m, land)) {
    const yB = row.y2, G = rowGeo(row), { lo, hi } = G;
    if (G.show) {
      const cut = hole && hi >= holeY0 - 2 && lo <= holeY1 + 2 && holeX1 >= -2 && holeX0 <= W + 2;
      ctx.save(); if (cut) ctx.clip(hole, 'evenodd'); if (baseIn && cut) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); ctx.clip(); ctx.clip(baseOut, 'evenodd'); }   // (the rows stop at the ravines' lips, a spine ravine's brink, and on a plates screen at the base plate's edge; only rows the holes reach are clipped)
      fillRow(row, G); ctx.restore();
    }
    while (li < list.length && list[li][0] < yB) list[li++][1]();
  }
  while (li < list.length) list[li++][1]();
  { r.cover = 0; const shapes = heroHid(); r.xray = !!shapes;
    if (shapes) { const hz = pl && h.liftAt === state.scene ? h.lift || 0 : 0, [X, Y] = pr(h.x / UNIT, h.y / UNIT, hz), w = us * mtnPush(mtnH(m, h.x / UNIT, h.y / UNIT) + hz, r);
      ctx.save(); if (typeof Path2D === 'function') { const M = new Path2D(); for (const P of shapes) { P.forEach(([x, y], i) => i ? M.lineTo(x, y) : M.moveTo(x, y)); M.closePath(); } ctx.clip(M); }   // only where you're covered
      ctx.save(); ctx.globalAlpha = 0.38; at(h.x, h.y, drawHero, 4, h); ctx.restore();                                          // the x-ray: you, faint, over what covers you
      ctx.strokeStyle = 'rgba(255,248,220,.85)'; ctx.lineWidth = Math.max(1, 1.5 * s); ctx.setLineDash([4 * s, 3 * s]); ctx.strokeRect(X - w / 2, Y - h.z * s - w / 2, w, w); ctx.restore(); } }   // and your outline, there
  // things in the air and on top: cloud shadows on the ground, gas, sparks and dust, each where it is
  for (const c of state.clouds) at(c.x, c.y, () => { const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r); g.addColorStop(0, `rgba(20,25,35,${0.12 + (sc.depth || 0) * 0.02})`); g.addColorStop(1, 'rgba(20,25,35,0)'); ctx.fillStyle = g; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2); }, c.r / UNIT + 1);
  for (const gp2 of state.gas) at(gp2.x, gp2.y, () => one('gas', gp2, () => { drawGas(false); drawGas(true); }));
  for (const fp of state.fx) at(fp.x, fp.y, () => one('fx', fp, drawFx));
  if (state.settings.tiles) { if (pl) drawPlateTiles(m, pr); drawMtnTiles(r, gp); }
}
function drawMtnProp(m, p, gp, us, s) {
  const [x, y] = gp(p.x, p.y);
  if (x < -us * 3 || x > W + us * 3 || y < -us * 3 || y > H + us * 4) return;
  if (p.k === 'tuft') { ctx.strokeStyle = '#7f8f5a'; ctx.lineWidth = Math.max(1, 1.5 * s); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 3 * s, y); ctx.lineTo(x + (i * 4 + Math.sin(state.time * 2 + p.seed) * 2) * s, y - us * 0.35); ctx.stroke(); } }
  else if (p.k === 'boulder') drawSolid({ kind: 'boulder', x, y, vis: p.r * us, flip: p.seed > 4.5 });
  else if (p.k === 'crag') {                                                          // a picture drawn once at full size, scaled with the view: steady, and cheap
    const sp = mtnCragSprite(Math.floor(p.seed * 16 / 9)), k = p.r / MTN_CRAG_R * s;
    if (sp) ctx.drawImage(sp.cv, x - sp.ox * k, y - sp.oy * k, sp.cv.width * k, sp.cv.height * k);
    else { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); paintMtnCrag(ctx, Math.floor(p.seed * 16 / 9)); ctx.restore(); }
  }
  else if (p.k === 'tree') { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawTree({ x: 0, y: 0, vis: UNIT * p.r, v: p.v, kind: 'tree', pal: 'green', key: 'rise' + p.x.toFixed(1) }); ctx.restore(); }
}
// a ravine on the screen: each loop of its traced outline a ring of lip points (N), and under it the same ring far
// below (F: shrunk toward the middle of the view as a floor far below would be, and dropped with the tilt: a hole
// seen from above shows its walls on the sides away from you, and they slide as you walk); yTop its northmost tile
function mtnRavinePts(m, r, gp) {
  const out = [], c = state.mtn, k = 14 / (14 + (r.depth || 5)), drop = (r.depth || 5) * Math.sin(c.m.tilt * c.p) * UNIT * mtnZoom(c.p), CXt = W / 2, CYt = H / 2;
  for (const ring of ravRings(r)) { const P = ring.map(([x, y]) => gp(x, y)), F = P.map(([X, Y]) => [CXt + (X - CXt) * k, CYt + (Y - CYt) * k + drop * k]);
    out.push({ N: P, S: [], F, k, drop, yTop: Math.min(...ring.map(q => mtnDepth(q[0], q[1], c))), seed: Math.round(ring[0][0] * 7), r }); }
  return out;
}
function drawMtnRavine(rv, s) {
  if (rv.N.every(([X]) => X < -10) || rv.N.every(([X]) => X > W + 10)) return;
  drawMtnDrop(rv, s, (a, b) => { ctx.beginPath(); a.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); for (let i = b.length - 1; i >= 0; i--) ctx.lineTo(b[i][0], b[i][1]); ctx.closePath(); });
}
// a ravine with no floor to see: black, with the top of each wall showing just inside its lip (earth going over to
// nothing within a tile), and the lips as the other ravines have them
function drawMtnDrop(rv, s, poly) {
  const { N, S } = rv, c = state.mtn, us = UNIT * s, st = Math.sin(c.m.tilt * c.p), depth = rv.r.depth || 5;
  // the ring of the lips, and under it the same ring far below: shrunk toward the middle of the view, as a hole seen
  // from above shows its walls on the sides away from you, and dropped with the view's tilt
  let ring = N.concat(S.slice().reverse()); const k = rv.k || 14 / (14 + depth), drop = rv.drop || depth * st * us, CX = W / 2, CY = H / 2;
  { let a = 0; for (let i = 0; i < ring.length; i++) { const [x0, y0] = ring[i], [x1, y1] = ring[(i + 1) % ring.length]; a += x0 * y1 - x1 * y0; } if (a < 0) ring = ring.slice().reverse(); }   // clockwise on the screen, whichever way it was traced
  let F = rv.F ? rv.F : ring.map(([X, Y]) => [CX + (X - CX) * k, CY + (Y - CY) * k + drop * k]);
  if (rv.F) { let a = 0; for (let i = 0; i < N.length; i++) { const [x0, y0] = N[i], [x1, y1] = N[(i + 1) % N.length]; a += x0 * y1 - x1 * y0; } if (a < 0) F = F.slice().reverse(); }   // (reversed with the ring)
  ctx.save(); poly(N, S); ctx.clip();
  ctx.fillStyle = '#0c1014'; ctx.fillRect(0, 0, W, H);
  const pal = ravPal(c.m);
  drawRavWalls(ring, F, s, rv.seed, depth, () => drawRavRiver(rv, c, us, st, k, drop, CX, CY, s), pal);
  ctx.restore();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';                                          // the lips: a dark line where the bank breaks off, a lighter rim of grass above it
  for (const L of [N, S]) { if (!L.length) continue;
    ctx.strokeStyle = pal.lip; ctx.lineWidth = Math.max(2, 3.5 * s); ctx.beginPath(); L.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); if (!S.length) ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = pal.rim; ctx.lineWidth = Math.max(1, 1.8 * s); ctx.beginPath(); L.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y - 2.6 * s) : ctx.moveTo(X, Y - 2.6 * s)); if (!S.length) ctx.closePath(); ctx.stroke();
  }
}
// the water that cut a ravine, far down: a thread where the walls meet, in the dark, dark blue, a glint here and there
function drawRavRiver(rv, c, us, st, k, drop, CX, CY, s) {
  const at = (x, y) => { const [X, Y] = mtnProj(x, y, mtnH(c.m, x, y), c); return [CX + (X - CX) * k, CY + (Y - CY) * k + drop * k]; };
  for (const br of genRavRiver(rv.r)) {
    const P = br.map(([x, y]) => at(x, y)), w = br.reduce((t, q) => t + q[2], 0) / br.length * us * k;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const fade = i => Math.min(1, Math.min(i, P.length - 1 - i) / 4);                        // in and out of sight over four reaches at each end
    const ribbon = wk => { const Lh = [], Rh = []; for (let i = 0; i < P.length; i++) { const [X0, Y0] = P[Math.max(0, i - 1)], [X1, Y1] = P[Math.min(P.length - 1, i + 1)], dx = X1 - X0, dy = Y1 - Y0, L = Math.hypot(dx, dy) || 1, hw = Math.max(0.3, w * wk * fade(i) / 2);
        Lh.push([P[i][0] - dy / L * hw, P[i][1] + dx / L * hw]); Rh.push([P[i][0] + dy / L * hw, P[i][1] - dx / L * hw]); }
      ctx.beginPath(); Lh.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); for (let i = Rh.length - 1; i >= 0; i--) ctx.lineTo(Rh[i][0], Rh[i][1]); ctx.closePath(); ctx.fill(); };   // a ribbon, so the taper is one shape and no seams show
    for (const [col, wk] of [['rgba(22,48,64,.45)', 0.22], ['rgba(56,104,128,.3)', 0.08]]) { ctx.fillStyle = col; ribbon(wk); }
    ctx.strokeStyle = 'rgba(190,225,240,.3)'; ctx.lineWidth = Math.max(1, s);                 // the glints: a short dash on one reach in five
    for (let i = 1; i < P.length; i++) { if ((i * 7 + rv.seed) % 5 || fade(i) < 1) continue; const [X0, Y0] = P[i - 1], [X1, Y1] = P[i]; ctx.beginPath(); ctx.moveTo(X0 + (X1 - X0) * 0.3, Y0 + (Y1 - Y0) * 0.3); ctx.lineTo(X0 + (X1 - X0) * 0.6, Y0 + (Y1 - Y0) * 0.6); ctx.stroke(); }
  }
}
// the walls between a ring on the ground (a ravine's lip, an island's edge) and the same ring far below (F): a quad
// every other point, lit by where it faces (the light is from the west), dark at the overhang, into the haze; then
// strata and the set-in stones. ring runs clockwise on the screen for a hole (the walls face into it); for a pillar
// the caller passes it the other way round, so the walls face out. mid: drawn between the walls and their strata (the river)
// the ravines' colours: earth on the fields' screens (the walls' gradient from the lip into the haze, its last two
// stops fixed; the light from the west), grey on a plates screen (plates.js: lit by the hole's own shade, 0.8 to 0.96
// whatever a wall faces), the lips, rim and brink to match
const RAV_EARTH = { wall: [[0, [60, 44, 28]], [0.08, [72, 52, 32]], [0.2, [150, 112, 74]], [0.55, [104, 78, 50]], [0.85, [22, 26, 30], 1], [1, [12, 16, 20], 1]], lit: (nx, ny) => mtnClamp(0.45 + 0.55 * (0.5 + 0.5 * (-nx) - 0.15 * ny)), strata: 'rgba(30,22,14,.4)', lip: '#1c1208', rim: 'rgba(225,220,150,.7)', brink: [[0.7, 'rgba(70,52,30,.14)'], [0.42, 'rgba(70,52,30,.2)'], [0.2, 'rgba(50,36,20,.35)']] };
const RAV_GREY = { wall: [[0, [61, 63, 56]], [0.06, [112, 114, 105]], [0.5, [92, 94, 86]], [0.85, [22, 26, 30], 1], [1, [12, 16, 20], 1]], lit: nx => mtnClamp(0.86 + 0.1 * (-nx), 0.8, 0.96), strata: 'rgba(30,28,24,.22)', lip: 'rgba(28,28,24,.6)', rim: 'rgba(225,222,200,.3)', brink: [[0.7, 'rgba(40,38,32,.07)'], [0.42, 'rgba(40,38,32,.1)'], [0.2, 'rgba(30,28,24,.18)']] };
const ravPal = m => m.plates ? RAV_GREY : RAV_EARTH;
const ravWallAt = (pal, t) => { const W2 = pal.wall; for (let i = 1; i < W2.length; i++) if (t <= W2[i][0]) { const [t0, a] = W2[i - 1], [t1, b] = W2[i], u = (t - t0) / (t1 - t0); return a.map((v, k) => v + u * (b[k] - v)); } return W2[W2.length - 1][1]; };   // the wall's colour at depth t (0 the lip, 1 the foot), before its light
function drawRavWalls(ring, F, s, seed, depth, mid, pal = RAV_EARTH) {
  const us = UNIT * s;
  const off = (a, b, c2, d) => Math.max(a[0], b[0], c2[0], d[0]) < -2 || Math.min(a[0], b[0], c2[0], d[0]) > W + 2 || Math.max(a[1], b[1], c2[1], d[1]) < -2 || Math.min(a[1], b[1], c2[1], d[1]) > H + 2;
  for (let i = 0; i < ring.length; i += 2) {                                              // the walls: a quad every other lip point (a third of a tile or so), lit by where it faces (the light is from the west), dark at the lip's overhang, into the haze below; none off the screen
    const j = (i + 2) % ring.length, [X0, Y0] = ring[i], [X1, Y1] = ring[j], [x0, y0] = F[i], [x1, y1] = F[j];
    if (off(ring[i], ring[j], F[i], F[j])) continue;
    const ex = X1 - X0, ey = Y1 - Y0, L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L;    // n: the wall's facing, into the hole (the ring runs clockwise on the screen)
    const lit = pal.lit(nx, ny), mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2, fx = (x0 + x1) / 2, fy = (y0 + y1) / 2;
    if (Math.hypot(fx - mx, fy - my) < 1) continue;
    const g = ctx.createLinearGradient(mx, my, fx, fy), e = t => Math.round(t * lit);
    for (const [t, c, fixed] of pal.wall) g.addColorStop(t, fixed ? `rgb(${c.join(',')})` : `rgb(${e(c[0])},${e(c[1])},${e(c[2])})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y1); ctx.lineTo(x1, y1); ctx.lineTo(x0, y0); ctx.closePath(); ctx.fill();
  }
  if (mid) mid();
  ctx.strokeStyle = pal.strata; ctx.lineWidth = Math.max(1, 1.5 * s);           // strata, ring by ring down the walls
  for (const t of [0.22, 0.4, 0.6]) { ctx.beginPath(); ring.forEach(([X, Y], i) => { const w = t + 0.04 * Math.sin(i * 0.9 + seed); const x = X + (F[i][0] - X) * w, y = Y + (F[i][1] - Y) * w; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); }
  for (let i = 0; i < ring.length; i += 3) {                                             // grey stones set in the walls from a tile and a half under the lip down, most of each buried: a cap shows, jutting toward you; pebbles to boulders, dimmer the deeper
    const [X, Y] = ring[i], [x, y] = F[i], n = (i * 7 + seed) % 29 < 4 ? 1 : 0; if (!n || Math.hypot(x - X, y - Y) < 2 || X < -us * 3 || X > W + us * 3 || Y < -us * 3 || Y > H + us * 3) continue;
    for (let q = 0; q < n; q++) { const h = ((i * 31 + q * 17 + seed * 3) % 97) / 97, t0 = Math.min(0.7, 1.5 / depth), t = t0 + ((i * 13 + q * 29) % 53) / 53 * (0.6 - t0), r = (0.15 + h * h * 1.15) * us * (1 - t * 0.4), v = Math.round(118 - t * 90), d = v - 14, l = v + 16;
      const px = X + (x - X) * t + (h - 0.5) * us * 0.3, py = Y + (y - Y) * t, ax = x - X, ay = y - Y, L = Math.hypot(ax, ay) || 1, ox = ax / L * r, oy = ay / L * r;   // the stone juts out of the wall's face: down the wall on the screen, the way the wall falls away
      if (ring.some(([X2, Y2], i2) => Math.min(Math.abs(i2 - i), ring.length - Math.abs(i2 - i)) > 16 && Math.hypot(X2 - px, Y2 - py) < r * 1.5) || F.some(([X2, Y2]) => Math.hypot(X2 - px, Y2 - py) < r * 1.1)) continue;   // never across another stretch of lip (a fork's, the far side's) or the walls' foot
      const j = (i + 1) % ring.length, ex = ring[j][0] - X, ey = ring[j][1] - Y, eL = Math.hypot(ex, ey) || 1, lit = pal.lit(ey / eL, -ex / eL);   // the wall's light here, as the wall itself has it
      const wt = ravWallAt(pal, t);   // the earth's colour at this depth, from the wall's gradient
      const earth = a => `rgba(${wt.map(v => Math.round(v * lit)).join(',')},${a})`;
      // the cap: the stone cut by a line parallel to the lip (the wall's grain), the part down the wall from it showing, about a third
      const ux = ex / eL, uy = ey / eL, sink = -0.45, cx0 = px - ox * sink, cy0 = py - oy * sink, R2 = r * 3;   // (a quarter of a stone shows)
      const cap = () => { ctx.beginPath(); ctx.moveTo(cx0 - ux * R2, cy0 - uy * R2); ctx.lineTo(cx0 + ux * R2, cy0 + uy * R2); ctx.lineTo(cx0 + ux * R2 + ox / r * R2, cy0 + uy * R2 + oy / r * R2); ctx.lineTo(cx0 - ux * R2 + ox / r * R2, cy0 - uy * R2 + oy / r * R2); ctx.closePath(); };
      ctx.save(); cap(); ctx.clip();
      drawJagged(px, py, Math.max(2, r), i * 0.53 + q * 2.1 + seed, [`rgb(${v},${v - 2},${v - 8})`, `rgb(${l},${l - 2},${l - 8})`, `rgb(${Math.max(6, d)},${Math.max(6, d - 2)},${Math.max(6, d - 6)})`]);
      ctx.restore();
      // the earth at the join: an oblong, irregular patch of soil over the seam, on stone and wall alike, fading at its edges (as a crag sits in its soil line)
      let wc = wt.map(v => v * lit);                                                       // the wall's own colour at this depth and light (as its gradient paints it)
      { const mean = (wc[0] + wc[1] + wc[2]) / 3 || 1, want = v * 0.92; wc = wc.map(c => c * want / mean); }   // (a read that landed in the dark, or on the water, falls back to the wall's colour)   // the wall's hue at the stone's value, so the soil is as light or dark as the stone it sits on
      const soil = a => `rgba(${wc.map(c => Math.round(mtnClamp(c, 0, 255))).join(',')},${a})`, blob = (sc, a) => { ctx.fillStyle = soil(a); ctx.beginPath(); for (let j = 0; j < 14; j++) { const th = j / 14 * Math.PI * 2, rr = 1 + 0.22 * Math.sin(j * 2.1 + i) + 0.12 * Math.sin(j * 4.7 + q), ax0 = Math.cos(th) * r * 1.15 * rr * sc, ay0 = Math.sin(th) * r * 0.3 * rr * sc;
        const X = cx0 + ox * 0.04 + ux * ax0 + ox / r * ay0, Y = cy0 + oy * 0.04 + uy * ax0 + oy / r * ay0; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.closePath(); ctx.fill(); };
      for (let b = 0; b < 7; b++) blob(1 - b * 0.08, 0.11); }                                 // seven, each a little smaller: one soft fade, no steps
  }
}
// an island: a pillar out of the drop, seen from above: its ring (islRing) on the ground and the same ring far below
// (shrunk toward the middle of the view and dropped: rv.k and rv.drop). Solid stone, not a hole's wall (Ross, after
// 213; docs/parked/mock-pillars.js): lit by facing, the light from the west (0.6 to 1, smoothed round the ring: it
// turns, it doesn't step), ONE gradient along the pillar (a dark band under the lip, lit stone, into the drop's dark by
// about halfway), its seen side filled as one shape (no bands, no seams), faint strata near the top. The earth palette
// (no plates) keeps the old walls. The top is the brink pass's
function drawMtnPillar(m, isl, rv, s, gp) {
  const CX = W / 2, CY = H / 2, k = rv.k, drop = rv.drop;
  if (!m.plates) { let T = islRing(isl).map(([x, y]) => gp(x, y)); { let a = 0; for (let i = 0; i < T.length; i++) { const [x0, y0] = T[i], [x1, y1] = T[(i + 1) % T.length]; a += x0 * y1 - x1 * y0; } if (a > 0) T = T.slice().reverse(); }
    drawRavWalls(T, T.map(([X, Y]) => [CX + (X - CX) * k, CY + (Y - CY) * k + drop * k]), s, Math.round(isl.x * 13 + isl.y * 7), rv.r.depth || 5, null, RAV_EARTH); return; }
  const tone = 134, T = islRing(isl, 0, 64).map(([x, y]) => gp(x, y)), F = T.map(([X, Y]) => [CX + (X - CX) * k, CY + (Y - CY) * k + drop * k]), n = T.length;
  const cT = T.reduce((a, q) => [a[0] + q[0] / n, a[1] + q[1] / n], [0, 0]), cF = F.reduce((a, q) => [a[0] + q[0] / n, a[1] + q[1] / n], [0, 0]);
  const seg = []; for (let i = 0; i < n; i++) { const j = (i + 1) % n, ex = T[j][0] - T[i][0], ey = T[j][1] - T[i][1], L = Math.hypot(ex, ey) || 1; let nx = ey / L, ny = -ex / L; const mx = (T[i][0] + T[j][0]) / 2, my = (T[i][1] + T[j][1]) / 2; if ((mx - cT[0]) * nx + (my - cT[1]) * ny < 0) { nx = -nx; ny = -ny; }
    seg.push({ i, j, seen: ((F[i][0] + F[j][0]) / 2 - mx) * nx + ((F[i][1] + F[j][1]) / 2 - my) * ny > 0.2, lit: mtnClamp(0.8 + 0.25 * (-nx) - 0.05 * ny, 0.6, 1) }); }   // seen: its foot lies outward of its lip (it faces you)
  const ax = cF[0] - cT[0], ay = cF[1] - cT[1], AL = Math.hypot(ax, ay) || 1, ux = ax / AL, uy = ay / AL, r = Math.max(...T.map(q => Math.hypot(q[0] - cT[0], q[1] - cT[1]))), col = v => plRgb(v);
  const g = ctx.createLinearGradient(cT[0] - ux * r * 0.6, cT[1] - uy * r * 0.6, cF[0] + ux * r * 0.6, cF[1] + uy * r * 0.6);
  g.addColorStop(0, col(tone * 0.55)); g.addColorStop(0.07, col(tone)); g.addColorStop(0.3, col(tone * 0.82)); g.addColorStop(0.55, col(tone * 0.42)); g.addColorStop(0.78, 'rgb(16,20,24)'); g.addColorStop(1, '#0c1014');
  const quad = sg => { ctx.moveTo(T[sg.i][0], T[sg.i][1]); ctx.lineTo(T[sg.j][0], T[sg.j][1]); ctx.lineTo(F[sg.j][0], F[sg.j][1]); ctx.lineTo(F[sg.i][0], F[sg.i][1]); ctx.closePath(); };
  ctx.beginPath(); for (const sg of seg) if (sg.seen) quad(sg); ctx.fillStyle = g; ctx.fill();
  const lit = seg.map((sg, i) => { let t = 0, w = 0; for (let d = -3; d <= 3; d++) { const q = seg[(i + d + n) % n]; t += q.lit * (4 - Math.abs(d)); w += 4 - Math.abs(d); } return t / w; });
  for (const sg of seg) { if (!sg.seen) continue; const a = 1 - lit[sg.i]; if (a < 0.01) continue; ctx.beginPath(); quad(sg); ctx.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')'; ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke(); }
  for (const [t, a] of [[0.12, 0.26], [0.24, 0.18], [0.4, 0.1]]) { ctx.strokeStyle = 'rgba(28,26,22,' + a + ')'; ctx.lineWidth = Math.max(1, 1.2 * s); ctx.beginPath(); let pen = false;
    for (let i = 0; i <= n; i++) { const q = i % n; if (!seg[q].seen && !seg[(q - 1 + n) % n].seen) { pen = false; continue; } const w = t + 0.015 * Math.sin(q * 0.9 + isl.s * 5), x = T[q][0] + (F[q][0] - T[q][0]) * w, y = T[q][1] + (F[q][1] - T[q][1]) * w; pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } ctx.stroke(); }
}
// the brink: outside the hole, a band of broken ground along the lip, earth showing through the grass, darkest at
// the edge and fading out over a third of a tile; then the lip itself, a dark line where the bank breaks off and a
// lighter rim of grass above it. Painted once with its ravine: the ground under it first (the rows, clipped to the
// band between the lip and the field's 0.5 line; the rows themselves stop at 0.4), so everything standing on it is
// drawn over it
function drawMtnBrink(rvs, s, band, fillRows, pal = RAV_EARTH) {
  const us = UNIT * s, mg = us;                                                           // only the stretches of lip on the screen are stroked
  const ring = (rv, dy = 0) => { const P = rv.N, n = P.length, on = i => { const [X, Y] = P[(i + n) % n]; return X > -mg && X < W + mg && Y > -mg && Y < H + mg; }; ctx.beginPath(); let pen = false;
    for (let i = 0; i <= n; i++) { const k = i % n; if (on(k) || on(k - 1) || on(k + 1)) { const [X, Y] = P[k]; pen ? ctx.lineTo(X, Y + dy) : ctx.moveTo(X, Y + dy); pen = true; } else pen = false; } };
  ctx.save(); ctx.clip(band, 'evenodd');
  { let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity; for (const rv of rvs) for (const [X, Y] of rv.N) { if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; if (X < x0) x0 = X; if (X > x1) x1 = X; }   // the ground under the band, once over all of them (a plates screen's wash is translucent: laid twice it darkens)
    if (!(x1 < -us || x0 > W + us || y1 < -us || y0 > H + us)) fillRows(Math.max(-us, y0 - us), Math.min(H + us, y1 + us), Math.max(-us, x0 - us), Math.min(W + us, x1 + us)); } ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [wk, col] of pal.brink) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, wk * us); for (const rv of rvs) { ring(rv); ctx.stroke(); } }
  ctx.restore();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const rv of rvs) {
    ctx.strokeStyle = pal.lip; ctx.lineWidth = Math.max(2, 3.5 * s); ring(rv); ctx.stroke();
    ctx.strokeStyle = pal.rim; ctx.lineWidth = Math.max(1, 1.8 * s); ring(rv, -2.6 * s); ctx.stroke();
  }
}
// the crags: sixteen shapes, each painted once (per size of screen) at the biggest size one ever draws, then scaled
const MTN_CRAG_R = 1.6, MTN_CRAGS = {};
function paintMtnCrag(g, v) {                                                       // origin at the foot of the stone
  const rs = MTN_CRAG_R * UNIT, amp = Math.max(2, rs * 0.15), soil = soilLinePts(0, rs * 0.2, rs * 2.2, amp, v * 3.7), [ax, ay] = soil[0], [bx, by] = soil[soil.length - 1];
  groundShadow(0, 0, rs, rs * 0.45, 0, { dx: rs * 0.15, dy: rs * 0.3, ctx: g });
  g.save(); g.beginPath(); g.moveTo(ax - rs * 2, -rs * 3); g.lineTo(ax - rs * 2, ay); soil.forEach(([sx, sy]) => g.lineTo(sx, sy)); g.lineTo(bx + rs * 2, by); g.lineTo(bx + rs * 2, -rs * 3); g.closePath(); g.clip();   // sunk: nothing of the stone below its soil line
  drawJagged(0, -rs * 0.4, rs, v * 13.1 + 2.3, ['#86827a', '#9a968c', '#6e6a62'], null, g); g.restore();
  drawSoilLine(0, rs * 0.2, rs * 2.2, amp, v * 3.7, g);
}
function mtnCragSprite(v) {
  const key = v + ':' + Math.round(UNIT);
  if (key in MTN_CRAGS) return MTN_CRAGS[key];
  let sp = null;
  try { const rs = MTN_CRAG_R * UNIT, cv = document.createElement('canvas'); cv.width = Math.ceil(rs * 4.6); cv.height = Math.ceil(rs * 2.4); const g = cv.getContext && cv.getContext('2d');
    if (g && g.fillRect) { g.translate(rs * 2.3, rs * 1.6); paintMtnCrag(g, v); sp = { cv, ox: rs * 2.3, oy: rs * 1.6 }; } } catch (e) { sp = null; }
  return (MTN_CRAGS[key] = sp);
}
// System > Show tiles: the grid laid on the ground, tipped and shrunk with the view; red where a solid stands
function drawMtnTiles(r, gp) {
  const m = r.m;
  ctx.save(); ctx.lineWidth = 1;
  const h = state.hero, hx = h.x / UNIT, hyT = h.y / UNIT, x0 = Math.floor(hx - 14), x1 = Math.ceil(hx + 14);
  for (let y = 0; y < m.D; y++) for (let x = Math.max(0, x0); x < Math.min(m.len, x1); x++) {
    const c = [gp(x, y), gp(x + 1, y), gp(x + 1, y + 1), gp(x, y + 1)];
    ctx.beginPath(); c.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
    const me = Math.floor(hx) === x && Math.floor(hyT) === y, cx = (x + 0.5) * UNIT, cy = (y + 0.5) * UNIT;
    if (me || state.solids.some(o => Math.hypot(o.x - cx, o.y - cy) < o.r)) { ctx.fillStyle = me ? 'rgba(255,220,90,.35)' : 'rgba(220,70,60,.22)'; ctx.fill(); }
    else if (mtnGap(m, x + 0.5, y + 0.5)) { ctx.fillStyle = 'rgba(80,140,255,.28)'; ctx.fill(); }   // blue over the drop
    else if (onIsl(m, x + 0.5, y + 0.5)) { ctx.fillStyle = 'rgba(120,230,120,.3)'; ctx.fill(); }   // green on an island
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
  }
  ctx.restore();
}
