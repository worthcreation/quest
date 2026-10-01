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
// a pass into the mountain, and through it onto the wind shelf (M1, scene mt1: the marsh already has m1 to m3 as ids),
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
// The wind shelf (M1, scene mt1), out of the rise's pass: the same kind of slope, drier (dry grass, tan earth showing
// through, stone sooner), split along its length by a ravine that winds with the way. It narrows to a running jump
// at three crossings, so the path zigzags from bank to bank; where it runs wide, grassy ledges face each other across
// it and the strong gust rides you over (ledge to ledge, as on the first field). At its widest, an island out in the
// drop, reached only by a ride: the screen's secret. The rise's rabbits a size up and snarling (hares). At the far
// end the ravine closes and a pass leads south onto the climb's second screen (climb2, until m2 is remade).
const M1 = {
  id: 'mt1', len: 64, D: 30, flat: 0, grade: 0.0021, mid: 15, floor: '#a4a45c', earth: '#b8976a', stoneAt: 4.2, inX: 4, outX: 58.2, tilt: 0.95, lead: 6, lift: 4.5,
  X0: -16, X1: 100, Y0: -6, Y1: 72, seed: 11, dx: 0.5, fine: 6,
  foot: y => 54 + Math.sin(y * 0.33 + 1) * 2.5 + Math.sin(y * 0.8) * 0.8,
  // the ravine: from x 5 to x 48 (closed again well before the foot), its middle wandering (cy), 5 tiles across where
  // it's wide (hw 2.5), a 1.3-tile jump at each crossing, 7 across at the island (x 42); 3 tiles deep. cross: the
  // crossings' x, in order: the path starts on the north bank and swaps banks at each
  rav: { x0: 5, x1: 48, depth: 3, cross: [13, 25, 36], island: [42, 1.0],
    cy: x => 15 + 2.2 * Math.sin(x * 0.21 + 0.8) + 0.12 * Math.sin(x * 3.1) + 0.08 * Math.sin(x * 7.3),
    hw(x) { let w = 2.5; for (const cx of this.cross) { const k = Math.max(0, 1 - Math.abs(x - cx) / 1.8); w = Math.min(w, 2.5 - 1.85 * k * k * (3 - 2 * k)); }
      { const k = Math.max(0, 1 - Math.abs(x - this.island[0]) / 4); w += 1 * k * k * (3 - 2 * k); }
      return w * mtnClamp((x - this.x0) / 3) * mtnClamp((this.x1 - x) / 3); } },
  side: x => M1.rav.cross.filter(c => c < x).length % 2 ? 1 : -1,                        // which bank the path is on at x
  pathY(x) { const r = this.rav; return r.cy(x) + this.side(x) * (r.hw(x) + 1.8); },
  pathD(x, y) {
    const { inX, outX, D } = this, y0 = this.pathY(inX + 6), y1 = this.pathY(outX);
    let d = x >= inX + 4 && x <= outX ? Math.abs(y - this.pathY(x)) : 99;
    for (const cx of this.rav.cross) { const a = this.pathY(cx - 0.7), b = this.pathY(cx + 0.7); if (y > Math.min(a, b) - 0.3 && y < Math.max(a, b) + 0.3) d = Math.min(d, Math.abs(x - cx)); }   // straight across at each crossing
    if (y <= y0 + 0.5) { const t = mtnClamp((y + 1) / (y0 + 1)); d = Math.min(d, Math.abs(x - (inX + 6 * t * t))); }
    if (y >= y1 - 0.5) { const t = mtnClamp((y - y1) / (D + 1 - y1)); d = Math.min(d, Math.abs(x - (outX + 0.6 * t))); }
    return d;
  },
};
const MTN = { rise: RISE, mt1: M1 };                                                    // every screen of the family, by scene id
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
const mtnRavs = m => m.ravs || (m.rav ? [m.rav] : []);
// for drawing, every spine ravine on a screen is one field (where two cross, the drop is one drop, not a strip of
// ground between): traced together, the deepest one's depth
function mtnDrawRavs(m) {
  if (m.ravDraw) return m.ravDraw;
  const sp = mtnRavs(m).filter(r => r.spine), rest = mtnRavs(m).filter(r => !r.spine);
  return (m.ravDraw = sp.length ? rest.concat([{ spine: [].concat(...sp.map(r => r.spine)), floor: false, depth: Math.max(...sp.map(r => r.depth || 5)) }]) : rest);
}
const ravGap = (r, x, y, pad) => r.spine ? ravFieldAt(r, x, y) < pad : r.axis === 'y' ? y > r.y0 && y < r.y1 && Math.abs(x - r.cx(y)) < r.hw(y) + pad : x > r.x0 && x < r.x1 && Math.abs(y - r.cy(x)) < r.hw(x) + pad;
const mtnGap = (m, x, y, pad = 0) => mtnRavs(m).some(r => ravGap(r, x, y, pad));
// the way between its two walls of stone: 14 tiles wide where the view is close, opening out as it pulls back
const mtnHalf = (m, x) => 7 + 8 * mtnView(m, x);

function mtnColor(m, x, y) {
  const h = mtnH(m, x, y), gx = mtnH(m, x + 0.3, y) - mtnH(m, x - 0.3, y), gy = mtnH(m, x, y + 0.3) - mtnH(m, x, y - 0.3);
  const lit = mtnClamp(0.35 * gx / 0.6 - 0.2 * gy / 0.6, -0.8, 0.8) * (0.4 + 0.6 * mtnClamp((h - 3) / 6));   // faces turned to the light (west) catch it
  const base = parseInt(m.floor.slice(1), 16), k = mtnClamp((h - (m.stoneAt || 5)) / 6);       // the fields' grass, going over to stony turf, then stone
  let c = [base >> 16, (base >> 8) & 255, base & 255];
  if (m.earth) { const e = parseInt(m.earth.slice(1), 16), n = mtnClamp(0.5 + 0.9 * Math.sin(x * 0.37 + y * 0.9) * Math.sin(x * 0.11 - y * 0.23 + 2) + 0.3 * Math.sin(x * 1.3 + y * 0.4)); c = c.map((v, i) => v + ([e >> 16, (e >> 8) & 255, e & 255][i] - v) * n * n); }   // bare tan earth showing through the dry grass
  c = c.map((v, i) => v + ([132, 130, 118][i] - v) * k);
  const d = m.pathD(x, y);
  if (d < 0.75 && x > m.X0) { const w = (1 - d / 0.75) * 0.75; c = c.map((v, i) => v + ([150, 132, 98][i] - v) * w); }
  return 'rgb(' + c.map(v => Math.round(mtnClamp(v + lit * 30, 0, 255))).join(',') + ')';
}


// how far along the change you are (0 = looking straight down, 1 = pulled back and tipped at the far end)
const mtnView = (m, x) => mtnClamp((x - 1) / (m.len - 10));                          // evenly, from the first step to the foot: no late rush
const mtnZoom = p => 1 - (1 - mtnZoomMin()) * p;
const mtnLead = (m, p) => Math.min(m.lead, 0.3 * SW / 2 / (UNIT * mtnZoom(p))) * p;   // how far ahead of you the view looks (less on a narrow screen)
function mtnProj(x, y, z, c = state.mtn) {                                             // tiles to the screen (whatever size the scene is)
  const s = mtnZoom(c.p), th = c.m.tilt * c.p;
  return [SW / 2 + (x - c.cx) * UNIT * s, SH / 2 + ((y - c.cy) * Math.cos(th) - (z - c.ch) * Math.sin(th)) * UNIT * s];
}

// the land, laid out once in tiles: rows of heights and colours, and everything standing on it. A screen's layout
// puts its props in order from its own stream (m.seed), with the pieces below
function mtnLand(m) {
  if (m.land) return m.land;
  const { X0, X1, Y0, Y1 } = m, dx = m.dx || 1, xs = []; for (let x = X0; x <= X1 + 1e-9; x += dx) xs.push(x);   // the columns, a tile apart (dx: finer, where a ravine's edge needs it)
  let s = m.seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const props = [], put = (k, x, y, r, solid) => props.push({ k, x, y, r, solid, seed: rnd() * 9, v: Math.floor(rnd() * 3), by: y + (k === 'tuft' ? 0.1 : k === 'tree' ? 0.3 : r * 0.9) });
  const clearOf = (x, y, r) => !props.some(p => p.solid && Math.hypot(p.x - x, p.y - y) < p.r + r + 0.2);
  m.layout({ m, put, rnd, clearOf });
  // what stands inside the scene is a solid the game tests; the rest (tufts, the far land) is only drawn
  const inside = p => p.solid && p.x > -2 && p.x < m.len + 2 && p.y > -2 && p.y < m.D + 2;
  const onLand = props.filter(p => !mtnGap(m, p.x, p.y, p.r + 0.3));                            // nothing stands in a ravine
  const deco = onLand.filter(p => !inside(p)).sort((a, b) => a.by - b.by);
  return (m.land = { xs, rows: null, solids: onLand.filter(inside), deco });
}
// the walls of the way: a line of stones along each side, smooth near the fields, rough as the ground rises
function mtnWalls({ m, put, rnd }, northFrom) {
  for (const sd of [-1, 1]) for (let x = sd < 0 ? northFrom : 0.4; x < 100; x += 1.25) { const wy = m.mid + sd * mtnHalf(m, x); if (x > m.foot(wy) + 1) break; const r = 0.55 + rnd() * 0.35; put(x > 40 ? 'crag' : 'boulder', x + rnd() * 0.4, wy + (rnd() - 0.5) * 0.5, r, true); }
}
// the mountain's foot: crags on the line you can't cross, but where the way goes on
function mtnFootCrags({ m, put, rnd }) {
  for (let y = m.Y0; y < m.Y1; y += 1.1) { const f = m.foot(y); if (Math.abs(y - m.pathY(f)) < 1.7 || mtnGap(m, f, y, 1.5)) continue; put('crag', f + 0.3 + rnd() * 0.4, y, 0.9 + rnd() * 0.6, true); }
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
// the rise, where f2 was: the first field's south way leads in at the north-west corner, and the pass at the far end
// leads south onto the wind shelf (build 207; the climb's first screen until then)
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
  sc.exits.push({ side: 's', a: (oW + 0.8) / len, b: (oE - 0.8) / len, to: 'mt1', arrive: [M1.inX / M1.len, 1.2 / M1.D] });   // through the pass onto the wind shelf
  f1s.arrive = [m.inX / len, 1.2 / D];
};
// the wind shelf's layout: the walls and the closed west end as on the rise, stones and the odd stunted tree on the
// banks (never on the path, never over the drop), the foot, the pass, tufts
M1.layout = function (lay) {
  const m = this, { put, rnd, clearOf } = lay, { X0, Y0, Y1 } = m, nW = m.inX + 3.5;
  mtnWalls(lay, nW);
  for (let y = 0.3; y < m.mid - mtnHalf(m, nW) - 0.6; y += 1.2) put('boulder', nW + (rnd() - 0.5) * 0.3, y, 0.55 + rnd() * 0.3, true);
  for (let y = 0.3; y < m.mid + mtnHalf(m, 0) - 0.6; y += 1.2) put('boulder', -0.1 + (rnd() - 0.5) * 0.3, y, 0.6 + rnd() * 0.3, true);
  mtnFootCrags(lay);
  mtnPass(lay);
  for (let i = 0; i < 70; i++) { const x = X0 + rnd() * (m.foot(15) - X0 - 4), y = Y0 + rnd() * (Y1 - Y0), r = 0.45 + rnd() * 0.5; if (m.pathD(x, y) < 2.2 || mtnGap(m, x, y, r + 1.2) || !clearOf(x, y, r)) continue; put(x > 30 ? 'crag' : 'boulder', x, y, r, true); }
  for (let i = 0; i < 7; i++) { const x = 8 + rnd() * 40, y = Y0 + rnd() * (Y1 - Y0); if (m.pathD(x, y) < 2.4 || mtnGap(m, x, y, 2.2) || !clearOf(x, y, 0.6)) continue; put('tree', x, y, 1.0, true); }
  mtnTufts(lay, 300);
};
M1.scene = { area: 'field', depth: 3, msg: 'The wind shelf. A ravine splits the way: jump it where it narrows.', music: 'field', amb: 'wind', floor: M1.floor, speed: 0.45, accel: 8 };
M1.finish = function (sc, S) {
  const m = this, { len, D } = m, r = m.rav, oX = m.outX, oW = oX - 2.9, oE = oX + 3.2;
  sc.gusts = S.f1.gusts.map(g => ({ ...g }));                                           // the same wind, blowing across the ravine
  sc.feat.plants = [[9, -2.6], [19.5, 2.4], [30, -2.4], [44, 2.2]].map(([x, dy]) => [x / len, (m.pathY(x) + dy) / D]);   // the tall grass, by each ledge pair and on the way
  // ledges: a pair facing each other across each wide stretch (a ride from one lands on the other), and at the widest,
  // one on each bank with the island between them: the ride goes bank, island, bank
  sc.rocks = [];
  const ledge = (x, y, R = 0.8) => sc.rocks.push({ fx: x / len, fy: y / D, r: R, ledge: true });
  for (const x of [19, 30.5, r.island[0]]) for (const sd of [-1, 1]) ledge(x, r.cy(x) + sd * (r.hw(x) + 1.1));
  sc.rocks.push({ fx: r.island[0] / len, fy: r.cy(r.island[0]) / D, r: r.island[1], ledge: true, island: true });   // the island: a pillar out of the drop
  for (const [x, dy] of [[-0.43, 0.25], [0.43, 0.25], [0, -0.5]]) sc.initItems.push({ type: dy < 0 ? 'acorn' : 'carrot', fx: (r.island[0] + x) / len, fy: (r.cy(r.island[0]) + dy) / D });   // the secret: what the wind left out there
  for (const [x, dy] of [[10, -3.2], [21, 3.4], [32, -3]]) sc.spawns.push({ type: 'hare', fx: x / len, fy: (m.pathY(x) + dy) / D });   // three hares, one to a stretch
  sc.exits.push({ side: 'n', a: 0.8 / len, b: (m.inX + 3) / len, to: 'rise', arrive: [RISE.outX / RISE.len, 1 - 1.2 / RISE.D] });
  sc.exits.push({ side: 's', a: (oW + 0.8) / len, b: (oE - 0.8) / len, to: 'climb2' });   // the climb lays its own start
};
// the scene's own size in pixels, while it is the current one (every other scene is the screen)
const sceneSize = id => { const sc = typeof WORLD !== 'undefined' && WORLD && WORLD[id]; return sc && sc.virt ? [sc.virt[0] * UNIT, sc.virt[1] * UNIT] : [SW, SH]; };

function newMtnCam(m) { const c = { m, p: 0, cx: 0, cy: m.mid, ch: 0 }; mtnCamera(0, c, true); for (const r of mtnDrawRavs(m)) if (r.spine) { ravRings(r); genRavRiver(r); } for (const r of mtnRavs(m)) if (r.spine) ravGrid(r); return c; }   // (the ravines worked out on the way in, not on the first frame)
// the view: pulled back and tipped by how far along you are, looking ahead up the slope; it eases, never snaps
function mtnCamera(dt, c = state.mtn, snap) {
  if (!c) return;
  const m = c.m, h = state.hero, x = h.x / UNIT, y = h.y / UNIT, p = mtnView(m, x), e = snap ? 1 : 1 - Math.exp(-2.5 * dt);
  c.p += (p - c.p) * e; c.cx += (x + mtnLead(m, p) - c.cx) * e; c.cy += (y + (m.mid - y) * p - m.lift * p - c.cy) * e; c.ch += (mtnH(m, x, y) - c.ch) * e;
}
// a point of the scene (in its pixels) on the screen: toScreen uses this on a mountain screen, so speech and hints sit right
const mtnToScreen = (x, y) => { const m = state.mtn.m; return mtnProj(x / UNIT, y / UNIT, mtnH(m, x / UNIT, y / UNIT)); };

function drawMtn() {
  const r = state.mtn; if (!r) return;
  const m = r.m, land = mtnLand(m), s = mtnZoom(r.p), th = m.tilt * r.p, ct = Math.cos(th), st = Math.sin(th), us = UNIT * s;
  const sy = (y, z) => H / 2 + ((y - r.cy) * ct - (z - r.ch) * st) * us, sxOf = x => W / 2 + (x - r.cx) * us;
  // the sky and a far range, seen only once the view tips up past the land's far edge
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9cc6e4'); g.addColorStop(1, '#e8e2c8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const hz = sy(m.Y0, 0);
  if (hz > 0) { ctx.fillStyle = '#a9b4c4'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hz - UNIT * (1.2 + 2.4 * Math.abs(Math.sin(x * 0.004 + 1)) + 0.5 * Math.sin(x * 0.013))); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); }
  const dx = m.dx || 1, i0 = Math.max(0, Math.floor((r.cx - W / 2 / us - 2 - m.X0) / dx)), i1 = Math.min(land.xs.length - 1, Math.ceil((r.cx + W / 2 / us + 2 - m.X0) / dx));
  const idx = []; for (let i = i0; i < i1; i++) idx.push(i); idx.push(i1);   // (every tile, always: a stride that shifted with the camera made the ground's edges shimmer)
  // everything standing, back to front by where it touches the ground (in tiles, at its lowest edge: the ground laid
  // after it is all in front of it), drawn with the game's own code
  // at its spot on the tipped ground, scaled with the view; the ground's rows are laid between them
  const [VW, VH] = sceneSize(state.scene), SWH = [W, H];
  const at = (px, py, fn, mg = 4) => { const xt = px / UNIT, yt = py / UNIT, X = sxOf(xt), Y = sy(yt, mtnH(m, xt, yt)); if (X < -us * mg || X > SWH[0] + us * mg || Y < -us * (mg + 1) || Y > SWH[1] + us * (mg + 1)) return; ctx.save(); ctx.translate(X, Y); ctx.scale(s, s); ctx.translate(-px, -py); [W, H] = [VW, VH]; try { fn(); } finally { [W, H] = SWH; ctx.restore(); } };
  const one = (key, o, fn) => { const all = state[key]; state[key] = [o]; try { fn(); } finally { state[key] = all; } };   // the game's draw for a list, for one of them
  const list = [];
  for (const p of land.deco) list.push([p.by, () => drawMtnProp(m, p, sxOf, sy, us, s)]);
  const sc = sceneDef(), h = state.hero;
  for (const o of state.solids) {
    if (o.rise === 'tree' || o.kind === 'reeds') list.push([o.y / UNIT + (o.kind === 'reeds' ? o.r / UNIT + 0.2 : 0.3), () => at(o.x, o.y, () => o.kind === 'reeds' ? drawSolid(o) : drawTree(o))]);
    else if (o.rise) list.push([o.y / UNIT + o.rr * 0.9, () => drawMtnProp(m, { k: o.rise, x: o.x / UNIT, y: o.y / UNIT, r: o.rr, seed: o.seed }, sxOf, sy, us, s)]);
  }
  for (const o of sc.rocks || []) list.push([o.fy * m.D + 0.3, () => { if (o.island) drawMtnIsland(m, o, sxOf, sy, us, st); at(o.fx * VW, o.fy * VH, () => drawLedge(o.fx * VW, o.fy * VH, o.r * UNIT)); }]);   // the ledges a gust ride lands on (an island stands on a pillar out of the drop)
  let hole = null;                                                                      // the ravine: a hole in the ground's rows, painted once right after the row its north lip first reaches
  if (mtnRavs(m).length && typeof Path2D === 'function') { hole = new Path2D(); hole.rect(-W, -H, W * 3, H * 3); }
  // a ravine is painted only on the land: clipped to below the land's far edge (the first row's top), never into the sky
  let landClip = null;
  if (mtnDrawRavs(m).length && typeof Path2D === 'function') { const row0 = mtnRows(m, land)[0]; landClip = new Path2D(); landClip.moveTo(-W, H * 3); idx.forEach(i => landClip.lineTo(sxOf(land.xs[i]), sy(row0.y, row0.top[i]))); landClip.lineTo(W * 2, H * 3); landClip.closePath(); }
  const onLand = fn => () => { ctx.save(); if (landClip) ctx.clip(landClip); fn(); ctx.restore(); };
  let holeY0 = Infinity, holeY1 = -Infinity, holeX0 = Infinity, holeX1 = -Infinity;                // the holes' extent on the screen: a row that misses it needs no clip
  for (const r0 of mtnDrawRavs(m)) {
    const rvs = mtnRavinePts(m, r0, sxOf, sy, hole); if (!rvs.length) continue;
    for (const rv of rvs) for (const [X, Y] of rv.N) { if (Y < holeY0) holeY0 = Y; if (Y > holeY1) holeY1 = Y; if (X < holeX0) holeX0 = X; if (X > holeX1) holeX1 = X; }
    if (!r0.spine) { for (const rv of rvs) list.push([rv.yTop + 0.26, onLand(() => drawMtnRavine(rv, s))]); continue; }
    // a spine ravine: the rows stop at its brink's outer edge, and the ravine paints the brink itself, ground first, at
    // its own turn (before anything standing south of its top: you, the reeds and the stones all stand on it)
    const proj = iso => ravRings(r0, iso).map(ring => ring.map(([x, y]) => [sxOf(x), sy(y, mtnH(m, x, y))])), band = hole ? new Path2D() : null;
    for (const O of proj(0.4)) { if (hole) { O.forEach(([X, Y], i) => i ? hole.lineTo(X, Y) : hole.moveTo(X, Y)); hole.closePath(); } for (const [X, Y] of O) { if (Y < holeY0) holeY0 = Y; if (Y > holeY1) holeY1 = Y; } }
    if (band) for (const O of proj(0.5)) { O.forEach(([X, Y], i) => i ? band.lineTo(X, Y) : band.moveTo(X, Y)); band.closePath(); }   // (the brink's ground reaches a tenth of a tile past where the rows stop: the rows' edge falls on ground of its own colour, no seam)
    if (band) for (const rv of rvs) { rv.N.forEach(([X, Y], i) => i ? band.lineTo(X, Y) : band.moveTo(X, Y)); band.closePath(); }
    list.push([Math.min(...rvs.map(rv => rv.yTop)) + 0.26, onLand(() => { for (const rv of rvs) drawMtnRavine(rv, s); if (band) drawMtnBrink(rvs, s, band, fillRows); })]);
  }
  for (const it of state.items) list.push([it.y / UNIT + 0.4, () => at(it.x, it.y, () => one('items', it, drawItems))]);
  for (const e of state.enemies) list.push([e.y / UNIT + e.r / UNIT + 0.1, () => at(e.x, e.y, () => drawEnemy(e))]);
  for (const [fx, fy] of sc.feat.plants || []) { const px = fx * VW, py = fy * VH; list.push([fy * m.D + 0.1, () => at(px, py, () => drawGustGrass(px, py, sc))]); }   // the tall grass, the wind's gauge
  if (pipDrawn(sc)) list.push([state.pip.y / UNIT + 0.55, () => at(state.pip.x, state.pip.y, drawPipNow)]);
  list.push([h.y / UNIT + 0.6, () => at(h.x, h.y, drawHero)]);
  for (const sh of state.shots) list.push([sh.y / UNIT + 0.4, () => at(sh.x, sh.y, () => one('shots', sh, drawShots))]);
  if (h.ride && h.ride.wind) list.push([h.ride.y1 / UNIT + 0.2, () => at(h.ride.x1, h.ride.y1, drawLandingShadow)]);   // mid-ride: where you'll come down
  list.sort((a, b) => a[0] - b[0]);
  // a row of ground on the screen: its top and bottom edges, a pixel of overlap so no seams show
  const geo = new Map(), rowGeo = row => { let G = geo.get(row); if (G) return G;
    if (!row.grad) { row.grad = ctx.createLinearGradient(m.X0, 0, m.X1, 0); row.cols.forEach((c, i) => { if (i % 2 === 0 || i === row.cols.length - 1) row.grad.addColorStop(i / (land.xs.length - 1), c); }); }   // a stop every other tile is plenty
    let lo = Infinity, hi = -Infinity; const tp = idx.map(i => { const v = sy(row.y, row.top[i]); lo = Math.min(lo, v); hi = Math.max(hi, v); return v; }), bp = idx.map(i => sy(row.y2, row.bot[i]) + 1);
    G = { tp, bp, lo, hi, show: !(hi < -UNIT * 4 || Math.min(...bp) > H + UNIT * 4 && lo > H) }; geo.set(row, G); return G; };
  const fillRow = (row, G, j0 = 0, j1 = idx.length - 1) => { ctx.save(); ctx.translate(W / 2 - r.cx * us, 0); ctx.scale(us, 1); ctx.beginPath(); for (let j = j0; j <= j1; j++) j > j0 ? ctx.lineTo(land.xs[idx[j]], G.tp[j]) : ctx.moveTo(land.xs[idx[j]], G.tp[j]); for (let j = j1; j >= j0; j--) ctx.lineTo(land.xs[idx[j]], G.bp[j]); ctx.closePath(); ctx.fillStyle = row.grad; ctx.fill(); ctx.restore(); };
  // the rows on the screen between two heights and two x's (the slice of each), back to front, under a clip: the brink's ground
  function fillRows(y0, y1, X0, X1) { let j0 = 0, j1 = idx.length - 1; while (j0 < j1 && sxOf(land.xs[idx[j0 + 1]]) < X0) j0++; while (j1 > j0 && sxOf(land.xs[idx[j1 - 1]]) > X1) j1--;
    const rows = mtnRows(m, land).filter(row => { const G = rowGeo(row); return G.show && G.hi >= y0 - 2 && G.lo <= y1 + 2; });
    for (let k = 0; k < rows.length; k += 3) { const a = rowGeo(rows[k]), b = rowGeo(rows[Math.min(rows.length - 1, k + 2)]); fillRow(rows[Math.min(rows.length - 1, k + 1)], { tp: a.tp, bp: b.bp }, j0, j1); } }   // (three rows at a time, the middle one's colours: under a narrow band nobody sees the difference)
  let li = 0;
  for (const row of mtnRows(m, land)) {
    const yB = row.y2, G = rowGeo(row), { lo, hi } = G;
    if (G.show) {
      const cut = hole && hi >= holeY0 - 2 && lo <= holeY1 + 2 && holeX1 >= -2 && holeX0 <= W + 2;
      ctx.save(); if (cut) ctx.clip(hole, 'evenodd');                                    // (the rows stop at the ravines' lips, a spine ravine's brink; only rows the holes reach are clipped)
      fillRow(row, G); ctx.restore();
    }
    while (li < list.length && list[li][0] < yB) list[li++][1]();
  }
  while (li < list.length) list[li++][1]();
  // things in the air and on top: cloud shadows on the ground, gas, sparks and dust, each where it is
  for (const c of state.clouds) at(c.x, c.y, () => { const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r); g.addColorStop(0, `rgba(20,25,35,${0.12 + (sc.depth || 0) * 0.02})`); g.addColorStop(1, 'rgba(20,25,35,0)'); ctx.fillStyle = g; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2); }, c.r / UNIT + 1);
  for (const gp of state.gas) at(gp.x, gp.y, () => one('gas', gp, () => { drawGas(false); drawGas(true); }));
  for (const fp of state.fx) at(fp.x, fp.y, () => one('fx', fp, drawFx));
  if (state.settings.tiles) drawMtnTiles(r, sxOf, sy);
}
function drawMtnProp(m, p, sxOf, sy, us, s) {
  const x = sxOf(p.x), y = sy(p.y, mtnH(m, p.x, p.y));
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
// an island in the ravine: a pillar of earth and stone from the floor up to its grassy top (drawLedge, drawn after)
function drawMtnIsland(m, o, sxOf, sy, us, st) {
  const x = o.fx * m.len, y = o.fy * m.D, g = mtnH(m, x, y), X = sxOf(x), Y = sy(y, g), drop = m.rav.depth * st * us, R = o.r * us, ry = R * 0.55;
  if (drop < 1) return;
  const gr = ctx.createLinearGradient(0, Y, 0, Y + drop + ry); gr.addColorStop(0, '#8a6a46'); gr.addColorStop(0.6, '#5e4630'); gr.addColorStop(1, '#2a2218');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(X - R, Y); ctx.lineTo(X - R * 0.92, Y + drop); ctx.ellipse(X, Y + drop, R * 0.92, ry * 0.9, 0, Math.PI, 0, true); ctx.lineTo(X + R, Y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,28,16,.45)'; ctx.lineWidth = Math.max(1, 1.5 * us / UNIT);
  for (const k of [0.35, 0.7]) { ctx.beginPath(); ctx.ellipse(X, Y + drop * k, R * (1 - 0.05 * k), ry * (0.9 + 0.1 * k), 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
}
// the ravine on the screen: its two lips (on the ground) and, three tiles down, its floor, sampled every quarter tile
// along it. hole is the opening the rows are clipped to (a Path2D: the whole screen with the opening cut out; null
// where there is no Path2D, as in the tests), yTop the north lip's smallest y, the key the painting is drawn at
function mtnRavinePts(m, r, sxOf, sy, hole) {
  const N = [], S = [], NF = [], SF = []; let yTop = Infinity;
  if (r.spine) {                                                                          // traced: each loop of the outline is its own ring (N), nothing in S
    const out = [];
    const c = state.mtn, k = 14 / (14 + (r.depth || 5)), drop = (r.depth || 5) * Math.sin(c.m.tilt * c.p) * UNIT * mtnZoom(c.p), CXt = W / 2, CYt = H / 2;
    for (const ring of ravRings(r)) { const P = ring.map(([x, y]) => [sxOf(x), sy(y, mtnH(m, x, y))]), top = Math.min(...ring.map(q => q[1]));
      // the bottom ring: the lip ring shrunk toward the middle of the view as a floor far below would be (a hole seen
      // from above shows its walls on the sides away from you, and they slide as you walk), dropped with the tilt
      const F = ring.map(([x, y]) => [CXt + (sxOf(x) - CXt) * k, CYt + (sy(y, mtnH(m, x, y)) - CYt) * k + drop * k]);
      out.push({ N: P, S: [], NF: P, SF: [], F, k, drop, hole, yTop: top, T: ring, seed: Math.round(ring[0][0] * 7), r }); }
    return out;
  }
  if (r.axis === 'y') {                                                                   // along y: N is the west lip, S the east (the walls run with the view: no far wall to see, a drop in the dark)
    for (let y = r.y0; y <= r.y1 + 1e-9; y += 0.25) {
      const cx = r.cx(y), hw = r.hw(y), xw = cx - hw, xe = cx + hw, g = mtnH(m, cx, y);
      N.push([sxOf(xw), sy(y, g)]); S.push([sxOf(xe), sy(y, g)]); NF.push([sxOf(xw), sy(y, g)]); SF.push([sxOf(xe), sy(y, g)]); yTop = Math.min(yTop, y);
    }
  } else {
    for (let x = r.x0; x <= r.x1 + 1e-9; x += 0.25) {
      const cy = r.cy(x), hw = r.hw(x), yn = cy - hw, ys = cy + hw, g = mtnH(m, x, cy);
      N.push([sxOf(x), sy(yn, g)]); S.push([sxOf(x), sy(ys, g)]); NF.push([sxOf(x), sy(yn, g - r.depth)]); SF.push([sxOf(x), sy(ys, g - r.depth)]); yTop = Math.min(yTop, yn);
    }
  }
  if (hole) { N.forEach(([X, Y], i) => i ? hole.lineTo(X, Y) : hole.moveTo(X, Y)); for (let i = S.length - 1; i >= 0; i--) hole.lineTo(S[i][0], S[i][1]); hole.closePath(); }
  return [{ N, S, NF, SF, hole, yTop, seed: (r.x0 || r.y0 || 1) * 7, r }];
}
function drawMtnRavine(rv, s) {
  const { N, S, NF, SF } = rv, poly = (a, b) => { ctx.beginPath(); a.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); for (let i = b.length - 1; i >= 0; i--) ctx.lineTo(b[i][0], b[i][1]); ctx.closePath(); };
  if (N.every(([X]) => X < -10) || N.every(([X]) => X > W + 10)) return;
  if (rv.r.floor === false) { drawMtnDrop(rv, s, poly); return; }
  ctx.fillStyle = '#17190f'; poly(NF, SF); ctx.fill();                                   // the floor, far below, dark
  ctx.save(); poly(NF, SF); ctx.clip();                                                   // heaped with the same rough stones the woods' ravines hold: bigger and lighter toward the far wall, pebbles in the dark
  for (let i = 0; i < NF.length; i += 3) { const [X0, Y0] = NF[i], [X1, Y1] = SF[i], L = Math.hypot(X1 - X0, Y1 - Y0); if (X0 < -40 || X0 > W + 40 || L < 6) continue;
    for (let k = 0; k < 3; k++) { const t = 0.12 + ((i * 7 + k * 5 + rv.seed) % 11) / 14 * 0.78, u = (i * 3 + k * 11) % 7 / 7, X = X0 + (X1 - X0) * t + (u - 0.5) * 10 * s, Y = Y0 + (Y1 - Y0) * t, sh = Math.round(92 - t * 70);
      drawJagged(X, Y, Math.max(2, (0.42 - t * 0.28) * (L / 4) * (0.7 + u * 0.5)), i * 0.37 + k * 1.3, ['#' + [sh, sh - 4, sh - 10].map(v => v.toString(16).padStart(2, '0')).join(''), '#' + [sh + 14, sh + 10, sh + 2].map(v => v.toString(16).padStart(2, '0')).join(''), '#' + [sh - 18, sh - 20, sh - 24].map(v => Math.max(6, v).toString(16).padStart(2, '0')).join('')]); } }
  ctx.restore();
  ctx.fillStyle = '#19160f'; poly(SF, S); ctx.fill();                                    // (the near wall: never seen, it faces away; painted so no sliver of ground shows at the lip)
  const g = ctx.createLinearGradient(0, N[0][1], 0, NF[0][1] + 1); g.addColorStop(0, '#8a6a46'); g.addColorStop(0.55, '#6e5236'); g.addColorStop(1, '#2a2218');
  ctx.fillStyle = g; poly(N, NF); ctx.fill();                                             // the far wall, facing you: earth, darker toward the bottom
  ctx.strokeStyle = 'rgba(40,28,16,.45)'; ctx.lineWidth = Math.max(1, 1.5 * s);           // strata along it
  for (const k of [0.3, 0.62]) { ctx.beginPath(); N.forEach(([X, Y], i) => { const Y2 = Y + (NF[i][1] - Y) * (k + 0.05 * Math.sin(i * 0.7 + rv.seed)); i ? ctx.lineTo(X, Y2) : ctx.moveTo(X, Y2); }); ctx.stroke(); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';                                          // the lips: a dark line where the bank breaks off, a lighter rim of grass above it
  for (const L of [N, S]) {
    ctx.strokeStyle = '#1c1208'; ctx.lineWidth = Math.max(1.5, 3 * s); ctx.beginPath(); L.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke();
    ctx.strokeStyle = 'rgba(210,205,140,.5)'; ctx.lineWidth = Math.max(1, 1.5 * s); ctx.beginPath(); L.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y - 2 * s) : ctx.moveTo(X, Y - 2 * s)); ctx.stroke();
  }
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
  const off = (a, b, c2, d) => Math.max(a[0], b[0], c2[0], d[0]) < -2 || Math.min(a[0], b[0], c2[0], d[0]) > W + 2 || Math.max(a[1], b[1], c2[1], d[1]) < -2 || Math.min(a[1], b[1], c2[1], d[1]) > H + 2;
  for (let i = 0; i < ring.length; i += 2) {                                              // the walls: a quad every other lip point (a third of a tile or so), lit by where it faces (the light is from the west), dark at the lip's overhang, into the haze below; none off the screen
    const j = (i + 2) % ring.length, [X0, Y0] = ring[i], [X1, Y1] = ring[j], [x0, y0] = F[i], [x1, y1] = F[j];
    if (off(ring[i], ring[j], F[i], F[j])) continue;
    const ex = X1 - X0, ey = Y1 - Y0, L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L;    // n: the wall's facing, into the hole (the ring runs clockwise on the screen)
    const lit = 0.5 + 0.5 * (-nx) - 0.15 * ny, mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2, fx = (x0 + x1) / 2, fy = (y0 + y1) / 2;
    if (Math.hypot(fx - mx, fy - my) < 1) continue;
    const g = ctx.createLinearGradient(mx, my, fx, fy), e = t => Math.round(t * mtnClamp(0.45 + 0.55 * lit)), col = (r, gg, b, t = 1) => `rgb(${e(r * t)},${e(gg * t)},${e(b * t)})`;
    g.addColorStop(0, col(60, 44, 28)); g.addColorStop(0.08, col(72, 52, 32)); g.addColorStop(0.2, col(150, 112, 74)); g.addColorStop(0.55, col(104, 78, 50)); g.addColorStop(0.85, 'rgb(22,26,30)'); g.addColorStop(1, '#0c1014');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y1); ctx.lineTo(x1, y1); ctx.lineTo(x0, y0); ctx.closePath(); ctx.fill();
  }
  if (rv.r.spine) {                                                                       // and, far down, the water that cut it: a thread where the walls meet, in the dark, dark blue, a glint here and there
    const sxOf = x => W / 2 + (x - c.cx) * us, syOf = (x, y) => H / 2 + ((y - c.cy) * Math.cos(c.m.tilt * c.p) - mtnH(c.m, x, y) * st) * us;
    const at = (x, y) => { const X = sxOf(x), Y = syOf(x, y); return [CX + (X - CX) * k, CY + (Y - CY) * k + drop * k]; };
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
  ctx.strokeStyle = 'rgba(30,22,14,.4)'; ctx.lineWidth = Math.max(1, 1.5 * s);           // strata, ring by ring down the walls
  for (const t of [0.22, 0.4, 0.6]) { ctx.beginPath(); ring.forEach(([X, Y], i) => { const w = t + 0.04 * Math.sin(i * 0.9 + rv.seed); const x = X + (F[i][0] - X) * w, y = Y + (F[i][1] - Y) * w; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); }
  for (let i = 0; i < ring.length; i += 3) {                                             // grey stones set in the walls from a tile and a half under the lip down, most of each buried: a cap shows, jutting toward you; pebbles to boulders, dimmer the deeper
    const [X, Y] = ring[i], [x, y] = F[i], n = (i * 7 + rv.seed) % 29 < 4 ? 1 : 0; if (!n || Math.hypot(x - X, y - Y) < 2 || X < -us * 3 || X > W + us * 3 || Y < -us * 3 || Y > H + us * 3) continue;
    for (let q = 0; q < n; q++) { const h = ((i * 31 + q * 17 + rv.seed * 3) % 97) / 97, t0 = Math.min(0.7, 1.5 / depth), t = t0 + ((i * 13 + q * 29) % 53) / 53 * (0.6 - t0), r = (0.15 + h * h * 1.15) * us * (1 - t * 0.4), v = Math.round(118 - t * 90), d = v - 14, l = v + 16;
      const px = X + (x - X) * t + (h - 0.5) * us * 0.3, py = Y + (y - Y) * t, ax = x - X, ay = y - Y, L = Math.hypot(ax, ay) || 1, ox = ax / L * r, oy = ay / L * r;   // the stone juts out of the wall's face: down the wall on the screen, the way the wall falls away
      if (ring.some(([X2, Y2], i2) => Math.min(Math.abs(i2 - i), ring.length - Math.abs(i2 - i)) > 16 && Math.hypot(X2 - px, Y2 - py) < r * 1.5) || F.some(([X2, Y2]) => Math.hypot(X2 - px, Y2 - py) < r * 1.1)) continue;   // never across another stretch of lip (a fork's, the far side's) or the walls' foot
      const j = (i + 1) % ring.length, ex = ring[j][0] - X, ey = ring[j][1] - Y, eL = Math.hypot(ex, ey) || 1, lit = mtnClamp(0.45 + 0.55 * (0.5 - 0.5 * (ey / eL) - 0.15 * (-ex / eL)));   // the wall's light here, as the wall itself has it
      const wt = t < 0.55 ? [150 - (t - 0.2) / 0.35 * 46, 112 - (t - 0.2) / 0.35 * 34, 74 - (t - 0.2) / 0.35 * 24] : [104 - (t - 0.55) / 0.3 * 82, 78 - (t - 0.55) / 0.3 * 52, 50 - (t - 0.55) / 0.3 * 20];   // the earth's colour at this depth, from the wall's gradient
      const earth = a => `rgba(${wt.map(v => Math.round(v * lit)).join(',')},${a})`;
      // the cap: the stone cut by a line parallel to the lip (the wall's grain), the part down the wall from it showing, about a third
      const ux = ex / eL, uy = ey / eL, sink = -0.45, cx0 = px - ox * sink, cy0 = py - oy * sink, R2 = r * 3;   // (a quarter of a stone shows)
      const cap = () => { ctx.beginPath(); ctx.moveTo(cx0 - ux * R2, cy0 - uy * R2); ctx.lineTo(cx0 + ux * R2, cy0 + uy * R2); ctx.lineTo(cx0 + ux * R2 + ox / r * R2, cy0 + uy * R2 + oy / r * R2); ctx.lineTo(cx0 - ux * R2 + ox / r * R2, cy0 - uy * R2 + oy / r * R2); ctx.closePath(); };
      ctx.save(); cap(); ctx.clip();
      drawJagged(px, py, Math.max(2, r), i * 0.53 + q * 2.1 + rv.seed, [`rgb(${v},${v - 2},${v - 8})`, `rgb(${l},${l - 2},${l - 8})`, `rgb(${Math.max(6, d)},${Math.max(6, d - 2)},${Math.max(6, d - 6)})`]);
      ctx.restore();
      // the earth at the join: an oblong, irregular patch of soil over the seam, on stone and wall alike, fading at its edges (as a crag sits in its soil line)
      let wc = wt.map(v => v * lit);                                                       // the wall's own colour at this depth and light (as its gradient paints it)
      { const mean = (wc[0] + wc[1] + wc[2]) / 3 || 1, want = v * 0.92; wc = wc.map(c => c * want / mean); }   // (a read that landed in the dark, or on the water, falls back to the wall's colour)   // the wall's hue at the stone's value, so the soil is as light or dark as the stone it sits on
      const soil = a => `rgba(${wc.map(c => Math.round(mtnClamp(c, 0, 255))).join(',')},${a})`, blob = (sc, a) => { ctx.fillStyle = soil(a); ctx.beginPath(); for (let j = 0; j < 14; j++) { const th = j / 14 * Math.PI * 2, rr = 1 + 0.22 * Math.sin(j * 2.1 + i) + 0.12 * Math.sin(j * 4.7 + q), ax0 = Math.cos(th) * r * 1.15 * rr * sc, ay0 = Math.sin(th) * r * 0.3 * rr * sc;
        const X = cx0 + ox * 0.04 + ux * ax0 + ox / r * ay0, Y = cy0 + oy * 0.04 + uy * ax0 + oy / r * ay0; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.closePath(); ctx.fill(); };
      for (let b = 0; b < 7; b++) blob(1 - b * 0.08, 0.11); }                                 // seven, each a little smaller: one soft fade, no steps
  }
  ctx.restore();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';                                          // the lips: a dark line where the bank breaks off, a lighter rim of grass above it
  for (const L of [N, S]) { if (!L.length) continue;
    ctx.strokeStyle = '#1c1208'; ctx.lineWidth = Math.max(2, 3.5 * s); ctx.beginPath(); L.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); if (!S.length) ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,220,150,.7)'; ctx.lineWidth = Math.max(1, 1.8 * s); ctx.beginPath(); L.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y - 2.6 * s) : ctx.moveTo(X, Y - 2.6 * s)); if (!S.length) ctx.closePath(); ctx.stroke();
  }
}
// the brink: outside the hole, a band of broken ground along the lip, earth showing through the grass, darkest at
// the edge and fading out over a third of a tile; then the lip itself, a dark line where the bank breaks off and a
// lighter rim of grass above it. Painted once with its ravine: the ground under it first (the rows, clipped to the
// band between the lip and the field's 0.5 line; the rows themselves stop at 0.4), so everything standing on it is
// drawn over it
function drawMtnBrink(rvs, s, band, fillRows) {
  const us = UNIT * s, mg = us;                                                           // only the stretches of lip on the screen are stroked
  const ring = (rv, dy = 0) => { const P = rv.N, n = P.length, on = i => { const [X, Y] = P[(i + n) % n]; return X > -mg && X < W + mg && Y > -mg && Y < H + mg; }; ctx.beginPath(); let pen = false;
    for (let i = 0; i <= n; i++) { const k = i % n; if (on(k) || on(k - 1) || on(k + 1)) { const [X, Y] = P[k]; pen ? ctx.lineTo(X, Y + dy) : ctx.moveTo(X, Y + dy); pen = true; } else pen = false; } };
  ctx.save(); ctx.clip(band, 'evenodd');
  for (const rv of rvs) { let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity; for (const [X, Y] of rv.N) { if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; if (X < x0) x0 = X; if (X > x1) x1 = X; } if (x1 < -us || x0 > W + us || y1 < -us || y0 > H + us) continue; fillRows(Math.max(-us, y0 - us), Math.min(H + us, y1 + us), Math.max(-us, x0 - us), Math.min(W + us, x1 + us)); } ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [wk, col] of [[0.7, 'rgba(70,52,30,.14)'], [0.42, 'rgba(70,52,30,.2)'], [0.2, 'rgba(50,36,20,.35)']]) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, wk * us); for (const rv of rvs) { ring(rv); ctx.stroke(); } }
  ctx.restore();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const rv of rvs) {
    ctx.strokeStyle = '#1c1208'; ctx.lineWidth = Math.max(2, 3.5 * s); ring(rv); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,220,150,.7)'; ctx.lineWidth = Math.max(1, 1.8 * s); ring(rv, -2.6 * s); ctx.stroke();
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
function drawMtnTiles(r, sxOf, sy) {
  const m = r.m;
  ctx.save(); ctx.lineWidth = 1;
  const h = state.hero, hx = h.x / UNIT, hyT = h.y / UNIT, x0 = Math.floor(hx - 14), x1 = Math.ceil(hx + 14);
  for (let y = 0; y < m.D; y++) for (let x = Math.max(0, x0); x < Math.min(m.len, x1); x++) {
    const pt = (a, b) => [sxOf(a), sy(b, mtnH(m, a, b))], c = [pt(x, y), pt(x + 1, y), pt(x + 1, y + 1), pt(x, y + 1)];
    ctx.beginPath(); c.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
    const me = Math.floor(hx) === x && Math.floor(hyT) === y, cx = (x + 0.5) * UNIT, cy = (y + 0.5) * UNIT;
    if (me || state.solids.some(o => Math.hypot(o.x - cx, o.y - cy) < o.r)) { ctx.fillStyle = me ? 'rgba(255,220,90,.35)' : 'rgba(220,70,60,.22)'; ctx.fill(); }
    else if (mtnGap(m, x + 0.5, y + 0.5)) { ctx.fillStyle = 'rgba(80,140,255,.28)'; ctx.fill(); }   // blue over the drop
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
  }
  ctx.restore();
}
