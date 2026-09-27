'use strict';
// =====================================================================
// Screen
// =====================================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightCv = document.createElement('canvas');
const lctx = lightCv.getContext('2d');
const TOUCH = window.matchMedia('(pointer: coarse)').matches;
// Keys are remappable from the menu. K holds the on-screen names used in hints.
const DEFAULT_KEYS = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', act: 'f', jump: ' ', swap: 'r', dash: 'a', eat: 's', slotd: 'd', fire: 'e', menu: 'm' };
const ACTION_NAMES = { up: 'Move up', down: 'Move down', left: 'Move left', right: 'Move right', act: 'Use weapon / grab / talk / throw', jump: 'Jump', swap: 'Swap weapon', dash: 'Slot A (dodge)', eat: 'Slot S (eat)', slotd: 'Slot D (plant)', fire: 'Marsh fire', menu: 'Menu' };
const K = {};
function keyName(k) { return { ' ': 'Space', arrowup: '\u2191', arrowdown: '\u2193', arrowleft: '\u2190', arrowright: '\u2192', escape: 'Esc', enter: 'Enter' }[k] || (k.length === 1 ? k.toUpperCase() : k); }
function refreshK() {
  if (TOUCH) Object.assign(K, { act: 'A', jump: 'jump', swap: 'swap', dash: 'dodge', eat: 'eat', slotd: 'D', fire: 'fire', menu: 'menu', l: '\u25C0', r: '\u25B6', u: '\u25B2' });
  else { const m = (state && state.settings && state.settings.keys) || DEFAULT_KEYS; for (const a in DEFAULT_KEYS) K[a] = keyName(m[a]); K.l = K.left; K.r = K.right; K.u = K.up; }
}
var state;
refreshK();
document.getElementById('startHint').textContent = TOUCH ? 'd-pad to move, A to act' : 'arrow keys to move, F to act, Space to jump, M for menu';
let W = window.innerWidth, H = window.innerHeight, UNIT = 32, DPR = window.devicePixelRatio || 1;
const computeUnit = () => { UNIT = Math.max(20, Math.min(W, H) / 14); };
computeUnit();
const L = () => Math.max(W, H);

// =====================================================================
// Random (seeded per adventure; the seed is what a save file stores)
// =====================================================================
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let rng = Math.random;
const rr = (a, b) => a + rng() * (b - a);
const pick = arr => arr[Math.floor(rng() * arr.length)];
const clamp01 = v => Math.max(0.04, Math.min(0.96, v));

// =====================================================================
// World generation (done at a fixed virtual size so a seed always
// produces the same world on any screen)
// =====================================================================
const AREA_NAMES = { peak: 'The High Crags', indoor: 'Old Wick\'s Shack', river: 'The Gleaming River', forest: 'The Glade', woods: 'The Deep Woods', field: 'The Windswept Field', cave: 'The Dank Cave', marsh: 'The Marsh', swamp: 'The Sunken Swamp', hollow: 'The Hollow Beneath' };
const SHROOM_NAMES = { camp: 'Home camp', w2: 'Deep Woods', foot: 'Foothill Farm', c4: 'Dank Cave', m1: 'Marsh edge', sw2: 'Sunken Swamp' };
const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
// after the rescue: a gremlin fled with Pip's journal, back through the glade and the woods to where the sword was
const THIEF_ROUTE = ['start', 'w1', 'w2', 'w3'];
const BEANS = 7;              // always lying about: 1 on the toad's screen, 2 on each other marsh screen, 1 on each of the first two swamp screens

function edgePoint(side, along) {
  if (side === 'n') return [along, 0.03];
  if (side === 's') return [along, 0.97];
  if (side === 'w') return [0.03, along];
  return [0.97, along];
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function makePath(a, b, bends) {
  const pts = [a];
  for (let i = 1; i <= bends; i++) {
    const t = i / (bends + 1);
    pts.push([clamp01(a[0] + (b[0] - a[0]) * t + rr(-0.22, 0.22)), clamp01(a[1] + (b[1] - a[1]) * t + rr(-0.2, 0.2))]);
  }
  pts.push(b);
  return pts;
}
// A river is a centreline (upstream first) with a width, plus optional stepping stones of dry rock.
function riverHit(sc, x, y, pad = 0, stonesCount = true) {
  const r = sc.river; if (!r) return false;
  const half = (r.wH ? r.wH * H : r.w * UNIT) / 2 + pad;
  let d = Infinity;
  for (let i = 0; i < r.pts.length - 1; i++) d = Math.min(d, distSeg(x, y, r.pts[i][0] * W, r.pts[i][1] * H, r.pts[i + 1][0] * W, r.pts[i + 1][1] * H));
  if (d > half) return false;
  if (stonesCount && (r.stones || []).some(s => Math.hypot(x - s[0] * W, y - s[1] * H) < s[2] * UNIT * 0.9)) return false;
  return true;
}
function inRects(rects, fx, fy, pad = 0) { return rects.some(([x0, y0, x1, y1]) => fx > x0 - pad && fx < x1 + pad && fy > y0 - pad && fy < y1 + pad); }
function clearSpot(sc, fx, fy, rU, pathW, keep) {
  const x = fx * W, y = fy * H, r = rU * UNIT;
  for (const p of sc.paths) for (let i = 0; i < p.length - 1; i++)
    if (distSeg(x, y, p[i][0] * W, p[i][1] * H, p[i + 1][0] * W, p[i + 1][1] * H) < pathW * UNIT + r) return false;
  for (const k of keep) if (Math.hypot(x - k[0] * W, y - k[1] * H) < k[2] * UNIT + r) return false;
  for (const s of sc.solids) if (Math.hypot(x - s.fx * W, y - s.fy * H) < (s.r + rU) * UNIT * 0.85) return false;
  if (sc.chasms && inRects(sc.chasms, fx, fy, 0.04)) return false;
  if (riverHit(sc, x, y, r + UNIT * 0.5, false)) return false;
  if (onClaim(sc, fx, fy, rU * 0.6)) return false;          // no tree or boulder on top of something you use
  return true;
}
// Every solid carries a look: variant (branch pattern), flip, palette.
function solid(fx, fy, r, kind, pal, extra) { return Object.assign({ fx, fy, r, kind, v: Math.floor(rng() * 3), flip: rng() < 0.5, pal: pal || null }, extra); }
function scatter(sc, n, kind, rMin, rMax, pathW, keep = [], box = [0.06, 0.94, 0.08, 0.92], pal) {
  let placed = 0;
  for (let tries = 0; tries < n * 60 && placed < n; tries++) {
    const fx = rr(box[0], box[1]), fy = rr(box[2], box[3]), r = rr(rMin, rMax);
    if (clearSpot(sc, fx, fy, r, pathW, keep)) { sc.solids.push(solid(fx, fy, r, kind, pal)); placed++; }
  }
}
function edgeWall(sc, side, kind, rU, gaps, density = 1.6, pal) {
  const horiz = side === 'n' || side === 's', len = horiz ? W : H;
  const step = rU * UNIT * density, n = Math.ceil(len / step) + 1;
  for (let i = 0; i < n; i++) {
    const along = (i * step + rr(-0.15, 0.15) * step) / len;
    if (along < -0.02 || along > 1.02) continue;
    const margin = rU * UNIT * 1.2 / len;
    if (gaps.some(([a, b]) => along > a - margin && along < b + margin)) continue;
    const inset = rU * UNIT * 0.45, r = rU * rr(0.85, 1.2);
    const [fx, fy] = side === 'n' ? [along, inset / H] : side === 's' ? [along, 1 - inset / H]
      : side === 'w' ? [inset / W, along] : [1 - inset / W, along];
    sc.solids.push(solid(fx, fy, r, kind, pal));
  }
}
// A barrier is a line of solids sharing an id; breaking it removes them all.
function barrier(sc, id, kind, x0, y0, x1, y1, rU = 0.6) {
  const n = Math.max(2, Math.ceil(Math.hypot((x1 - x0) * W, (y1 - y0) * H) / (rU * UNIT * 1.2)));
  for (let i = 0; i <= n; i++) sc.solids.push(solid(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, rU, kind, null, { bar: id }));
}
function ringBarrier(sc, id, kind, cx, cy, radU, rU = 0.5) {
  for (let a = 0; a < 6.28; a += 0.55) sc.solids.push(solid(cx + Math.cos(a) * radU * UNIT / W, cy + Math.sin(a) * radU * UNIT / H, rU, kind, null, { bar: id }));
}
function gapAt(c, half = 0.09) { return [Math.max(0.1, c - half), Math.min(0.9, c + half)]; }
// every interactable (mushroom, plot, rock, plate, character, pickup) claims a patch of ground;
// nothing else may be placed on a claim, so no two ever share a spot
function claim(sc, fx, fy, rU) { sc.claims.push([fx, fy, rU]); }
const onClaim = (sc, fx, fy, rU) => sc.claims.some(c => Math.hypot((fx - c[0]) * W, (fy - c[1]) * H) < (c[2] + rU) * UNIT);
function pullable(sc, o) { sc.pullables.push(o); claim(sc, o.fx, o.fy, 1.4); }
function npc(sc, o) { sc.npcs.push(o); claim(sc, o.fx, o.fy, 1.5); }
function item(sc, ...os) { for (const o of os) { sc.initItems.push(o); claim(sc, o.fx, o.fy, 0.6); } }
function freeSpot(sc, box, rU, keep = []) {
  // first spot that clears everything; if the screen is too crowded, the spot that comes closest,
  // treating claims as the thing that must never be broken
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 400; i++) {
    const fx = rr(box[0], box[1]), fy = rr(box[2], box[3]);
    if (sc.chasms && inRects(sc.chasms, fx, fy, 0.05)) continue;
    const x = fx * W, y = fy * H;
    if (riverHit(sc, x, y, rU * UNIT, false)) continue;
    let score = Infinity;
    for (const c of sc.claims) score = Math.min(score, (Math.hypot(x - c[0] * W, y - c[1] * H) - (c[2] + rU) * UNIT) * 4);
    for (const s of sc.solids) score = Math.min(score, Math.hypot(x - s.fx * W, y - s.fy * H) - (s.r + rU) * UNIT);
    for (const k of keep) score = Math.min(score, Math.hypot(x - k[0] * W, y - k[1] * H) - k[2] * UNIT);
    if (score > 0) return [fx, fy];
    if (score > bestScore) { bestScore = score; best = [fx, fy]; }
  }
  return best || [rr(box[0], box[1]), rr(box[2], box[3])];
}
function decoFlowers(sc, n) {
  const cols = ['#f3e37a', '#f2f2f2', '#e98ac0', '#9fc6f5'];
  for (let i = 0; i < n; i++) sc.deco.push({ kind: 'flower', fx: rng(), fy: rng(), c: pick(cols) });
  for (let i = 0; i < 30; i++) sc.deco.push({ kind: 'grass', fx: rng(), fy: rng(), s: rr(0.5, 1) });
}
// farm patches: a few patches of rich soil near the path; what grows depends on the region
// spots other things already claim (puzzles, people) so farms and mushrooms keep their distance
const claimed = sc => sc.pullables.map(p => [p.fx, p.fy, 3]).concat((sc.feat.plates || []).map(p => [p.fx, p.fy, 3]), sc.npcs.map(n => [n.fx, n.fy, 3]), sc.pools.map(o => [o.fx, o.fy, o.r + 2]));
function addPlots(sc, n, box) {
  sc.feat.plots = sc.feat.plots || [];
  // try a few spots and keep the one with room for the most plots; test the whole row against what
  // was already there, then claim it (so plots don't block their neighbours)
  let row = [];
  for (let t = 0; t < 8 && row.length < n; t++) {
    const c = freeSpot(sc, t < 4 ? box : [0.12, 0.88, 0.15, 0.85], 2.2, claimed(sc));
    const r2 = Array.from({ length: n }, (_, i) => [c[0] + (i % 3) * 0.035 - 0.035, c[1] + Math.floor(i / 3) * 0.06])
      .filter(q => !onClaim(sc, q[0], q[1], 0.6) && !sc.pools.some(o => Math.hypot((q[0] - o.fx) * W, (q[1] - o.fy) * H) < (o.r + 0.9) * UNIT) && sc.solids.every(s => Math.hypot((q[0] - s.fx) * W, (q[1] - s.fy) * H) > (s.r * 0.6 + 0.6) * UNIT));
    if (r2.length > row.length) row = r2;
  }
  row.forEach(q => { sc.feat.plots.push(q); claim(sc, q[0], q[1], 0.7); });
}
// a traveler's mushroom, with a little farm beside it
function addShroom(sc, spot, plots = 3) {
  const p = spot || freeSpot(sc, [0.2, 0.8, 0.2, 0.8], 2.6, claimed(sc));
  sc.feat.shroom = p;
  sc.solids.push(solid(p[0], p[1], 0.7, 'shroom'));
  claim(sc, p[0], p[1], 1.8);
  if (plots) {
    sc.feat.plots = sc.feat.plots || [];
    let row = [];
    for (let t = 0; t < 8 && row.length < plots; t++) {
      const spread = 0.2 + t * 0.05;
      const c = freeSpot(sc, [Math.max(0.12, p[0] - spread), Math.min(0.88, p[0] + spread), Math.max(0.15, p[1] - spread), Math.min(0.85, p[1] + spread)], 1.8, [[...p, 2], ...claimed(sc)]);
      const r2 = Array.from({ length: plots }, (_, i) => [c[0] + (i - 1) * 0.035, c[1]])
        .filter(q => !sc.pools.some(o => Math.hypot((q[0] - o.fx) * W, (q[1] - o.fy) * H) < (o.r + 0.9) * UNIT) && !onClaim(sc, q[0], q[1], 0.6) && sc.solids.every(s => Math.hypot((q[0] - s.fx) * W, (q[1] - s.fy) * H) > (s.r * 0.6 + 0.6) * UNIT));   // never in the water, under anything, or in a trunk
      if (r2.length > row.length) row = r2;
    }
    row.forEach(q => { sc.feat.plots.push(q); claim(sc, q[0], q[1], 0.7); });
  }
}
// ---- rock puzzle pieces: stone plates, log gates held shut, rings of stones ----
function plate(sc, id, spot) { (sc.feat.plates = sc.feat.plates || []).push({ id, fx: spot[0], fy: spot[1] }); claim(sc, spot[0], spot[1], 1.3); }
// a cracked stone: a thrown rock knocks it apart. Some hold something; some are the keystone of a wedged boulder pile (rope unused now)
function keystone(sc, bar, at, rope, rU = 0.55, stone = null) { sc.solids.push(solid(at[0], at[1], rU, 'cracked', null, { bar, rope, stone })); claim(sc, at[0], at[1], rU + 0.8); }
// breakable stones: how many good hits they take, and what's inside
const STONES = {
  sandstone: { name: 'Sandstone', dur: 1, tint: '#c9a878', inside: [['stone', 0.8], ['seed', 0.3]] },   // 'seed' here means the local vegetable's seed
  granite: { name: 'Granite', dur: 2, tint: '#8f8a86', inside: [['stone', 1], ['stone', 0.6], ['ironseed', 0.12]] },
  geode: { name: 'Geode', dur: 3, tint: '#7a6a8a', inside: [['emberseed', 0.5], ['starseed', 0.08], ['thornseed', 0.4]] },
};
const pickStone = () => { const r = rng(); return r < 0.5 ? 'sandstone' : r < 0.85 ? 'granite' : 'geode'; };
function logGate(sc, bar, plateId, x0, y0, x1, y1) { barrier(sc, bar, 'log', x0, y0, x1, y1, 0.55); sc.solids.forEach(s => { if (s.bar === bar) s.plate = plateId; }); }
function stoneRing(sc, c, radU, gapAng = null, gapHalf = 0.5) {
  const n = Math.ceil(Math.PI * 2 * radU / 0.7);
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2;
    if (gapAng != null && Math.abs(Math.atan2(Math.sin(a - gapAng), Math.cos(a - gapAng))) < gapHalf) continue;
    sc.solids.push(solid(c[0] + Math.cos(a) * radU * UNIT / W, c[1] + Math.sin(a) * radU * UNIT / H, 0.45, 'stone'));
  }
}
function newScene(o) {
  return Object.assign({ claims: [], solids: [], deco: [], spawns: [], pullables: [], exits: [], pools: [], paths: [], feat: {}, npcs: [], initItems: [], speed: 0.5, accel: 10, shade: 0 }, o);
}

const GEN = { W: 1280, H: 800 };
function buildWorld(seed) {
  const saved = [W, H, UNIT];
  W = GEN.W; H = GEN.H; computeUnit();
  rng = mulberry32(seed >>> 0);
  try { return genWorld(); } finally { [W, H, UNIT] = saved; rng = mulberry32((seed ^ 0x9e3779b9) >>> 0); }
}

function genWorld() {
  const S = {};
  const add = sc => (S[sc.id] = sc);

  // ---------------- Camp (north of start): home, fire, tent, farm plots ----------------
  const camp = add(newScene({ id: 'camp', area: 'forest', msg: '', music: 'forest', amb: 'none', floor: '#4a8f4c', heroStart: [0.44, 0.5] }));
  camp.exits = [{ side: 's', a: 0.4, b: 0.6, to: 'start' }];
  camp.feat.fire = [0.5, 0.45];
  camp.feat.plots = [[0.2, 0.68], [0.28, 0.68], [0.36, 0.68], [0.2, 0.8], [0.28, 0.8], [0.36, 0.8]];
  camp.feat.pip = [0.58, 0.44];
  npc(camp, { kind: 'pip', fx: 0.6, fy: 0.5, home: true });
  camp.solids.push(solid(0.5, 0.45, 0.45, 'campfire'), solid(0.33, 0.33, 1.1, 'tent'), solid(0.64, 0.34, 0.6, 'bench'));
  camp.solids.slice(-3).forEach((s, i) => { s.showFlag = ['built_fire', 'built_tent', 'built_bench'][i]; });   // only Pip's tent stands at first
  camp.feat.buildSpots = [{ piece: 'fire', fx: 0.5, fy: 0.45, r: 0.9 }, { piece: 'bench', fx: 0.64, fy: 0.34, r: 0.9 }];
  camp.feat.tentDoor = [0.33, 0.33 + 1.25 * UNIT / H];
  claim(camp, 0.5, 0.45, 1.5); claim(camp, 0.33, 0.33, 1.8); claim(camp, 0.64, 0.34, 1.2);
  camp.feat.plots.forEach(p => claim(camp, p[0], p[1], 0.7));
  camp.feat.bench = [0.64, 0.34];
  camp.paths = [makePath([0.5, 0.97], [0.5, 0.55], 1), makePath([0.45, 0.55], [0.28, 0.74], 0)];
  // inside Pip's tent: a bedroll, a chest for storage, and Pip's book of rules and training on a crate
  const tentin = add(newScene({ id: 'tentin', area: 'indoor', msg: '', music: 'forest', amb: 'none', floor: '#6e5a3e', heroStart: [0.5, 0.8], speed: 0.4 }));
  tentin.feat.tentRoom = true; tentin.placeName = 'Pip\'s Lean-to';
  tentin.exits = [{ side: 's', a: 0.4, b: 0.6, to: 'camp', arrive: [0.33, 0.33 + 1.9 * UNIT / H] }];
  for (const side of ['n', 'w', 'e']) edgeWall(tentin, side, 'wall', 1.0, [], 1.2);
  edgeWall(tentin, 's', 'wall', 1.0, [[0.4, 0.6]], 1.2);
  tentin.solids.push(solid(0.3, 0.4, 1.0, 'bed'), solid(0.7, 0.38, 0.7, 'chest'), solid(0.5, 0.3, 0.6, 'lectern'));
  tentin.feat.bedroll = [0.3, 0.4]; tentin.feat.chest = [0.7, 0.38]; tentin.feat.book = [0.5, 0.3];
  edgeWall(camp, 'n', 'tree', 1.1, [], 1.5, 'green');
  edgeWall(camp, 'w', 'tree', 1.1, [], 1.6, 'green');
  edgeWall(camp, 'e', 'tree', 1.1, [], 1.6, 'green');
  addShroom(camp, [0.78, 0.62], 0);
  scatter(camp, 6, 'tree', 0.9, 1.2, 1.4, [[0.45, 0.5, 5], [0.28, 0.74, 4], [0.78, 0.62, 2.5]], undefined, 'green');
  decoFlowers(camp, 20);

  // ---------------- Start glade: the big rock, the thicket into the woods ----------------
  const start = add(newScene({ id: 'start', area: 'forest', msg: '', music: 'forest', amb: 'none', floor: '#3f8f4c', heroStart: [0.5, 0.12] }));
  start.feat.pip = [0.84, 0.5];
  start.exits = [
    { side: 'n', a: 0.4, b: 0.6, to: 'camp' },
    { side: 'w', a: 0.38, b: 0.62, to: 'meadow' },
    { side: 's', a: 0.42, b: 0.58, to: 'f1' },
    { side: 'e', a: 0.4, b: 0.6, to: 'w1', locked: () => !broken('start', 'thicket') },
  ];
  const rock = [rr(0.58, 0.7), rr(0.3, 0.7)];
  pullable(start, { id: 'rock', kind: 'rock', fx: rock[0], fy: rock[1], need: 5 });
  barrier(start, 'thicket', 'bramble', 0.955, 0.36, 0.955, 0.64, 0.65);
  start.paths = [[0.5, 0.03], [0.03, 0.5], [0.5, 0.97], [0.93, 0.5], rock].map(p => makePath([0.5, 0.5], p, 1));
  scatter(start, 11, 'tree', 0.9, 1.3, 1.5, [[...rock, 3], [0.9, 0.5, 3]], undefined, 'green');
  for (const t of ['stick', 'stick', 'stick', 'stick']) { const q = freeSpot(start, [0.1, 0.8, 0.15, 0.85], 0.6); item(start, { type: t, fx: q[0], fy: q[1] }); }   // sticks under the forest trees
  start.feat.pageSpots = [0, 1].map(() => { const q = freeSpot(start, [0.5, 0.9, 0.2, 0.8], 0.8); claim(start, q[0], q[1], 0.6); return q; });
  addPlots(start, 2, [0.15, 0.4, 0.6, 0.85]);
  decoFlowers(start, 26);

  // ---------------- Meadow (west): the robin's dead tree ----------------
  const meadow = add(newScene({ id: 'meadow', area: 'forest', msg: 'Birdsong drifts over the meadow', music: 'forest', amb: 'none', floor: '#4a9650' }));
  meadow.exits = [{ side: 'e', a: 0.38, b: 0.62, to: 'start' }, { side: 'n', a: 0.35, b: 0.65, to: 'riverbank' }, { side: 'w', a: 0.35, b: 0.65, to: 'meadow2' }];
  meadow.paths = [makePath([0.97, 0.5], [0.3, 0.5], 2), makePath([0.5, 0.03], [0.5, 0.5], 1), makePath([0.03, 0.5], [0.5, 0.5], 1)];
  meadow.feat.perches = [];
  for (let i = 0; i < 3; i++) {
    const p = freeSpot(meadow, [0.12, 0.8, 0.18, 0.85], 2.8);
    meadow.solids.push(solid(p[0], p[1], 0.9, 'deadtree', 'grey'));
    meadow.feat.perches.push(p);
  }
  scatter(meadow, 7, 'tree', 0.9, 1.3, 1.4, meadow.feat.perches.map(p => [...p, 2.2]), undefined, 'green');
  addPlots(meadow, 3, [0.5, 0.85, 0.2, 0.8]);             // Pip's little garden
  decoFlowers(meadow, 60);

  // ---------------- The river: it rises beyond the north edge of the riverbank, cuts across that screen's
  // north-west corner and flows west, where it widens into the ford north of the rocky meadow ----------------
  const riverbank = add(newScene({ id: 'riverbank', area: 'forest', msg: 'The river runs fast and deep here', music: 'forest', amb: 'rain', floor: '#4a9650' }));
  riverbank.river = { pts: [[0.62, -0.08], [0.5, 0.14], [0.3, 0.34], [0.12, 0.47], [-0.08, 0.56]], w: 3.2 };
  riverbank.exits = [{ side: 's', a: 0.35, b: 0.65, to: 'meadow' }, { side: 'w', a: 0.72, b: 0.95, to: 'ford' }];
  riverbank.feat.farside = [0.13, 0.13];          // across the water: Old Wick's shack, his sign, his unfinished raft (reach it by crossing the ford)
  placeDock(riverbank);                            // Wick's jetty, on his side of the river, a few steps from the shack
  edgeWall(riverbank, 'e', 'tree', 1.1, [], 1.5, 'green');
  riverbank.paths = [makePath([0.5, 0.97], [0.55, 0.6], 1), makePath([0.55, 0.6], [0.03, 0.85], 1)];
  scatter(riverbank, 7, 'tree', 0.9, 1.3, 1.4, [], [0.15, 0.9, 0.35, 0.9], 'green');
  scatter(riverbank, 3, 'boulder', 0.6, 1.0, 1.4, [], [0.2, 0.9, 0.3, 0.8]);
  { const q = freeSpot(riverbank, [0.3, 0.9, 0.5, 0.9], 0.8); item(riverbank, { type: 'driftwood', fx: q[0], fy: q[1] }); }
  {                                                   // river stones along the near bank
    const pts = riverbank.river.pts, half = riverbank.river.w * UNIT / 2;
    [0.25, 0.45, 0.65].forEach(t => {
      const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1))), u2 = t * (pts.length - 1) - seg;
      const [ax, ay] = pts[seg], [bx, by] = pts[seg + 1], cx = (ax + (bx - ax) * u2) * W, cy = (ay + (by - ay) * u2) * H;
      const vx = (bx - ax) * W, vy = (by - ay) * H, l = Math.hypot(vx, vy) || 1, nx = vy / l, ny = -vx / l, s2 = (nx + ny > 0 ? 1 : -1);   // the normal pointing to the south-east bank
      let off = half + UNIT * 1.3, fx = 0, fy = 0;
      for (let tries = 0; tries < 6; tries++, off += UNIT * 0.8) { fx = (cx + s2 * nx * off) / W; fy = (cy + s2 * ny * off) / H; if (!onClaim(riverbank, fx, fy, 0.6)) break; }   // step back from the water until the spot is free
      item(riverbank, { type: 'stone', fx, fy });
    });
  }
  decoFlowers(riverbank, 30);

  const meadow2 = add(newScene({ id: 'meadow2', area: 'forest', msg: 'Rocks break through the grass', music: 'forest', amb: 'none', floor: '#51994f' }));
  meadow2.exits = [{ side: 'e', a: 0.35, b: 0.65, to: 'meadow' }, { side: 'n', a: 0.35, b: 0.65, to: 'ford' }];
  edgeWall(meadow2, 'w', 'boulder', 1.0, [], 1.6);
  edgeWall(meadow2, 's', 'boulder', 1.0, [], 1.7);
  meadow2.paths = [makePath([0.97, 0.5], [0.5, 0.03], 2)];
  scatter(meadow2, 9, 'boulder', 0.6, 1.3, 1.5, [], [0.1, 0.9, 0.12, 0.88]);
  scatter(meadow2, 5, 'tree', 0.9, 1.2, 1.5, [], [0.1, 0.9, 0.12, 0.88], 'green');
  { const q = freeSpot(meadow2, [0.2, 0.8, 0.2, 0.8], 0.8); item(meadow2, { type: 'driftwood', fx: q[0], fy: q[1] }); }
  decoFlowers(meadow2, 35);

  // the ford: the river spreads wide and shallow over stones; only jumping gets you across
  const ford = add(newScene({ id: 'ford', area: 'forest', msg: 'Stepping stones. Too far apart to walk.', music: 'forest', amb: 'rain', floor: '#4f9a52' }));
  const stones = [0.8, 0.66, 0.52, 0.38, 0.24].map((y, k) => [0.5 + (k % 2 ? 0.07 : -0.05) + rr(-0.03, 0.03), y + rr(-0.015, 0.015), 0.75]);
  ford.river = { pts: [[1.08, 0.5], [0.5, 0.5], [-0.08, 0.5]], wH: 0.78, stones, banks: [[stones[stones.length - 1][0], 0.06], [stones[0][0], 0.94]] };
  ford.exits = [{ side: 's', a: 0.35, b: 0.65, to: 'meadow2' }, { side: 'e', a: 0.9, b: 0.99, to: 'riverbank' }, { side: 'n', a: 0.3, b: 0.7, to: 'farbank' }];
  stones.forEach(s => claim(ford, s[0], s[1], 1.2));
  item(ford, { type: 'driftwood', fx: rr(0.15, 0.3), fy: 0.955 });
  for (let t = 0; t < 12; t++) ford.deco.push({ kind: 'reedbank', fx: rng(), fy: rng() < 0.5 ? 0.08 : 0.92 });

  const farbank = add(newScene({ id: 'farbank', area: 'forest', msg: 'The far bank. A path winds north into the hills.', music: 'forest', amb: 'none', floor: '#4a9650' }));
  farbank.exits = [{ side: 's', a: 0.3, b: 0.7, to: 'ford' }];
  edgeWall(farbank, 'n', 'tree', 1.1, [], 1.4, 'green'); edgeWall(farbank, 'w', 'tree', 1.1, [], 1.5, 'green'); edgeWall(farbank, 'e', 'tree', 1.1, [], 1.5, 'green');
  farbank.paths = [makePath([0.5, 0.97], [0.5, 0.3], 1)];
  item(farbank, { type: 'starseed', fx: 0.5, fy: 0.3 }, { type: 'thornseed', fx: 0.36, fy: 0.42 }, { type: 'driftwood', fx: 0.66, fy: 0.62 });
  addPlots(farbank, 3, [0.2, 0.8, 0.4, 0.75]);
  scatter(farbank, 6, 'tree', 0.9, 1.3, 1.4, [], [0.1, 0.9, 0.15, 0.85], 'green');
  decoFlowers(farbank, 40);

  // ---------------- Old Wick's shack: one room, a smell, a letter, a few seeds ----------------
  const shack = add(newScene({ id: 'shack', area: 'indoor', placeName: 'Old Wick\'s Shack', msg: 'It smells of pipe smoke, wet wool and old fish.', music: 'forest', amb: 'none', floor: '#6b4e32', heroStart: [0.5, 0.8], speed: 0.4 }));
  shack.exits = [{ side: 's', a: 0.35, b: 0.65, to: 'riverbank', arrive: [0.12, 0.13 + 1.6 * UNIT / H] }];
  for (const side of ['n', 'w', 'e']) edgeWall(shack, side, 'wall', 1.0, [], 1.2);
  edgeWall(shack, 's', 'wall', 1.0, [[0.35, 0.65]], 1.2);
  shack.solids.push(solid(0.22, 0.32, 1.1, 'bed'), solid(0.7, 0.42, 0.9, 'table'), solid(0.82, 0.2, 0.7, 'stove'));
  item(shack, { type: 'letter', fx: 0.66, fy: 0.36 }, { type: 'thornseed', fx: 0.3, fy: 0.6 }, { type: 'thornseed', fx: 0.36, fy: 0.64 }, { type: 'carrotseed', fx: 0.78, fy: 0.62 });

  // ---------------- Downriver: ride the rapids (a steering section), go over the falls into the gleaming pool ----------------
  add(newScene({ id: 'rapids', area: 'river', msg: '', music: 'field', amb: 'falls', floor: '#2f6f8a' }));

  // the gleaming pool: all water. Shallows you can wade, deep water in the middle, the falls pouring in from the east
  const gleampool = add(newScene({ id: 'gleampool', area: 'river', msg: 'The foot of the falls. A great pool, gleaming.', music: 'marsh', amb: 'falls', floor: '#4f9ab0', speed: 0.3, accel: 6, heroStart: [0.74, 0.52] }));
  gleampool.wade = true;
  gleampool.deep = { fx: 0.45, fy: 0.52, rx: 0.2, ry: 0.27 };          // too deep to wade: you get pushed back to the shallows
  gleampool.feat.falls = [0.93, 0.08, 0.92];                            // x, top, bottom of the waterfall along the east side
  gleampool.feat.gleam = true;
  gleampool.feat.tunnel = [0.22, 0.52];                                 // at the deep water's west rim
  gleampool.feat.fishing = [[0.4, 1.12], [1.6, 1.12], [2.7, 1.12], [4.4, 1.12], [5.4, 1.12]];   // angle, and a little outside the deep rim
  claim(gleampool, 0.22, 0.52, 1.4);
  item(gleampool, { type: 'rod', fx: 0.8, fy: 0.2 });
  for (const side of ['n', 's', 'w']) edgeWall(gleampool, side, 'boulder', 1.0, [], 1.6);
  for (let fy = 0.05; fy <= 0.95; fy += 0.05) gleampool.solids.push(solid(0.97, fy, 1.0, 'wall'));   // you can't walk up the falls

  const fallsbank = add(newScene({ id: 'fallsbank', area: 'river', msg: 'Out from behind the falls, the river runs east', music: 'marsh', amb: 'falls', floor: '#4a9452' }));
  fallsbank.river = { pts: [[-0.08, 0.2], [0.3, 0.16], [0.6, 0.2], [1.08, 0.12]], w: 3.0 };
  fallsbank.pools = [{ fx: 0.55, fy: 0.66, r: 2.4, still: true }];
  fallsbank.feat.tunnel = [0.55, 0.68];
  claim(fallsbank, 0.55, 0.66, 3);
  fallsbank.exits = [{ side: 'w', a: 0.4, b: 0.6, to: 'c7' }, { side: 'e', a: 0.4, b: 0.6, to: 'm1' }];
  edgeWall(fallsbank, 's', 'tree', 1.1, [], 1.5, 'green');
  fallsbank.paths = [makePath([0.03, 0.5], [0.97, 0.5], 1)];
  scatter(fallsbank, 6, 'tree', 0.9, 1.3, 1.4, [], [0.08, 0.92, 0.35, 0.9], 'green');
  decoFlowers(fallsbank, 25);

  // ---------------- Deep woods (east): denser, darker, the sword in the shadows ----------------
  let west = [0.4, 0.6];
  for (let i = 1; i <= 3; i++) {
    const last = i === 3;
    const sc = add(newScene({
      id: 'w' + i, area: 'woods', depth: i, msg: ['Drag marks lead deeper', 'Cackling, somewhere ahead', 'The woods hold their breath here'][i - 1],
      music: 'woods', amb: 'none', floor: ['#35743e', '#2d6436', '#26552f'][i - 1], shade: [0.3, 0.5, 0.68][i - 1], speed: 0.48,
    }));
    const east = last ? null : gapAt(rr(0.25, 0.75), 0.1);
    sc.exits.push({ side: 'w', a: west[0], b: west[1], to: i === 1 ? 'start' : 'w' + (i - 1) });
    if (east) sc.exits.push({ side: 'e', a: east[0], b: east[1], to: 'w' + (i + 1) });
    edgeWall(sc, 'n', 'tree', 1.2, [], 1.3, 'deep');
    edgeWall(sc, 's', 'tree', 1.2, [], 1.3, 'deep');
    edgeWall(sc, 'w', 'tree', 1.2, [west], 1.3, 'deep');
    edgeWall(sc, 'e', 'tree', 1.2, east ? [east] : [], 1.3, 'deep');
    const wPt = edgePoint('w', (west[0] + west[1]) / 2);
    const keep = [];
    if (last) {
      const sword = [rr(0.55, 0.7), pick([0.28, 0.72])];
      sc.feat.stone = [0.86, 1 - sword[1]]; claim(sc, ...sc.feat.stone, 1.4); claim(sc, ...sword, 2.4);
      pullable(sc, { id: 'sword', kind: 'sword', fx: sword[0], fy: sword[1], need: 6 });
      sc.solids.push(solid(sword[0], sword[1], 0.55, 'stump'));
      sc.feat.sword = sword;
      sc.paths = [makePath(wPt, [sword[0] - 0.06, sword[1]], 2), makePath([sword[0], sword[1]], sc.feat.stone, 1)];
      keep.push([...sword, 2.2], [...sc.feat.stone, 2.5]);
    } else sc.paths = [makePath(wPt, edgePoint('e', (east[0] + east[1]) / 2), 2 + i)];
    // rock puzzles on the way to the sword, one more idea each screen
    if (i === 1) {                                   // a boulder pile wedged on a cracked keystone: knock the keystone out with a thrown rock.
                                                     // A mud wallow lies in front of it: a rock that falls short sinks and has to be pounded and pulled out
      barrier(sc, 'crack1', 'wedge', 0.955, east[0] - 0.03, 0.955, east[1] + 0.03, 0.6);
      const k = [0.9, (east[0] + east[1]) / 2]; keystone(sc, 'crack1', k, null);
      (sc.mud = sc.mud || []).push([k[0] - 2.2 * UNIT / W, k[1], 1.5]); keep.push([k[0] - 2.2 * UNIT / W, k[1], 2]);
      const r = freeSpot(sc, [0.2, 0.45, 0.2, 0.8], 2, [[...wPt, 3], [...k, 5]]);
      pullable(sc, { id: 'rock1', kind: 'rock', fx: r[0], fy: r[1], need: 3 });
      for (const n of ['knockA', 'knockB', 'knockC']) { const q = freeSpot(sc, [0.35, 0.7, 0.2, 0.8], 1.6, [[...wPt, 4], [...r, 3], [...k, 4]]); keystone(sc, n, q, null, 0.42, n === 'knockA' ? 'sandstone' : pickStone()); keep.push([...q, 1.6]); }   // practice stones: sandstone, granite, geode
      sc.paths.push(makePath(wPt, r, 1), makePath(r, k, 1));
      keep.push([...k, 3], [...r, 2.5]);
    }
    if (i === 2) {                                   // the boulder pile's keystone sits in the middle of a mud wallow: hit it square, or dig your rock out
      barrier(sc, 'crack2', 'wedge', 0.955, east[0] - 0.03, 0.955, east[1] + 0.03, 0.6);
      const p = freeSpot(sc, [0.5, 0.75, 0.3, 0.7], 3, [[...wPt, 8]]); keystone(sc, 'crack2', p, null); (sc.mud = sc.mud || []).push([p[0], p[1], 2.3]);
      const r = freeSpot(sc, [0.15, 0.4, 0.2, 0.8], 2, [[...wPt, 3], [...p, 5]]);
      pullable(sc, { id: 'rock2', kind: 'rock', fx: r[0], fy: r[1], need: 4 });
      sc.feat.hole = [0.9, (east[0] + east[1]) / 2];
      barrier(sc, 'burrow', 'burrow', 0.905, east[0] - 0.02, 0.905, east[1] + 0.02, 0.62);
      { const bs = sc.solids.filter(s => s.bar === 'burrow'); bs.forEach((s, k) => { s.holeMid = k === Math.floor(bs.length / 2); }); }   // one small odd hole in a heap of rock and roots
      for (const n of ['knockD', 'knockE']) { const q = freeSpot(sc, [0.2, 0.45, 0.15, 0.85], 1.6, [[...wPt, 4], [...r, 3], [...p, 6]]); keystone(sc, n, q, null, 0.42, pickStone()); keep.push([...q, 1.6]); }
      sc.paths.push(makePath(wPt, r, 1), makePath(r, [p[0] - 0.12, p[1]], 1));
      keep.push([...p, 7], [...r, 2.5]);
    }
    if (last) {                                      // thorns ring the sword; the only rock that can break them is penned in
      const sw = sc.feat.sword;
      ringBarrier(sc, 'swordthorns', 'bramble', sw[0], sw[1], 1.8, 0.55);
      const pen = freeSpot(sc, [0.2, 0.45, 0.2, 0.8], 3, [[...wPt, 4], [...sw, 5]]);
      const gapAng = Math.atan2((sw[1] - pen[1]) * H, (sw[0] - pen[0]) * W);
      stoneRing(sc, pen, 1.5, gapAng, 0.75);
      const g0 = gapAng - 0.7, g1 = gapAng + 0.7, R = 1.5 * UNIT;
      barrier(sc, 'crack3', 'wedge', pen[0] + Math.cos(g0) * R / W, pen[1] + Math.sin(g0) * R / H, pen[0] + Math.cos(g1) * R / W, pen[1] + Math.sin(g1) * R / H, 0.55);
      pullable(sc, { id: 'rock3a', kind: 'rock', fx: pen[0], fy: pen[1], need: 5 });
      const p = freeSpot(sc, [0.15, 0.5, 0.15, 0.85], 2, [[...pen, 4], [...wPt, 3]]); keystone(sc, 'crack3', p, null); (sc.mud = sc.mud || []).push([p[0] - 1.6 * UNIT / W, p[1], 1.1]);
      const r = freeSpot(sc, [0.1, 0.4, 0.15, 0.85], 2, [[...pen, 4], [...p, 3], [...wPt, 2]]);
      pullable(sc, { id: 'rock3b', kind: 'rock', fx: r[0], fy: r[1], need: 3 });
      sc.paths.push(makePath(wPt, r, 0), makePath(r, p, 0), makePath(p, [pen[0] + Math.cos(gapAng) * 0.08, pen[1] + Math.sin(gapAng) * 0.1], 0), makePath(pen, sw, 1));
      keep.push([...pen, 3.2], [...p, 2.5], [...r, 2.5], [...sw, 3.5]);
    }
    scatter(sc, 12 + i * 8, 'tree', 0.8, 1.3, 1.25 - i * 0.05, keep, [0.08, 0.92, 0.1, 0.9], 'deep');
    sc.feat.pageSpots = [0, 1].map(() => { const q = freeSpot(sc, [0.15, 0.85, 0.15, 0.85], 0.8); claim(sc, q[0], q[1], 0.6); return q; });
    if (i === 1) addPlots(sc, 2, [0.3, 0.7, 0.3, 0.7]);
    if (i === 2) addShroom(sc);
    for (let g = 0; g < i - 1; g++) { const q = freeSpot(sc, [0.3, 0.8, 0.2, 0.8], 1, [[...wPt, 5]]); sc.spawns.push({ type: 'gremlin', fx: q[0], fy: q[1], req: 'sword' }); }
    decoFlowers(sc, 8);
    if (last) sc.feat.glimpse = { to: sc.feat.stone, line: 'Down the hole! Follow me!' };
    // sun dapples drift through the canopy; one always wanders over the sword
    sc.feat.dapples = Array.from({ length: 14 - i * 2 }, () => ({ fx: rng(), fy: rng(), r: rr(0.8, 2.0), ax: rr(0.02, 0.06), ay: rr(0.02, 0.05), sp: rr(0.08, 0.2), ph: rng() * 6 }));
    if (last) sc.feat.dapples.push({ fx: sc.feat.sword[0], fy: sc.feat.sword[1], r: 1.1, ax: 0.07, ay: 0.06, sp: 0.35, ph: 0, sword: true });
    west = east;
  }

  // ---------------- Windswept field (south): a wind puzzle that builds up ----------------
  // a = angle (0 blows south, + toward east, PI blows north), s = strength (1 strong, .5 weak).
  // A strong gust carries you 0.3 of the screen height; a weak one only 0.14.
  // Every crossing also has a way back: a strong north gust.
  // Higher up the mountain, some gusts are too strong (s 2): jump into one and it throws you back to the foothill farm.
  // Ride a gust by jumping while it blows.
  const N = { a: Math.PI, s: 1 }, TOO = { a: Math.PI, s: 1 };
  const FIELD = [
    { msg: 'The mountain path begins', gusts: [{ a: -0.3, s: 1 }, { a: Math.PI + 0.3, s: 1 }, { a: 0.3, s: 1 }, { a: Math.PI - 0.3, s: 1 }], chasms: [], ups: [], sock: [0.5, 0.4], rabbits: 0 },
    { msg: 'Rabbits. They don\'t look friendly.', gusts: [{ a: 0, s: 1 }, { a: Math.PI, s: 1 }], chasms: [], ups: [], sock: [0.5, 0.35], rabbits: 1 },
    { msg: 'A ravine. Too wide to jump.', gusts: [{ a: 0, s: 1 }, N], chasms: [[0, 0.42, 1, 0.6]], ups: [[rr(0.3, 0.7), 0.35], [rr(0.3, 0.7), 0.66]], rabbits: 1, south: [0.2, 0.8] },
    { msg: 'The far bank is broken', gusts: [{ a: 0.6, s: 1 }, { a: -0.6, s: 1 }, N], chasms: [[0, 0.42, 1, 0.6], [0.45, 0.6, 1, 0.8]], ups: [[0.5, 0.35], [0.22, 0.66]], rabbits: 1, south: [0.12, 0.3] },
    { msg: 'Two ravines', gusts: [{ a: 0.5, s: 1 }, { a: 0, s: 1 }, { a: -0.5, s: 1 }, N], chasms: [[0, 0.3, 1, 0.46], [0, 0.6, 1, 0.76]], ups: [[rr(0.3, 0.7), 0.25], [rr(0.3, 0.7), 0.52], [rr(0.3, 0.7), 0.81]], rabbits: 2, south: [0.2, 0.8], extra: TOO },
    { msg: 'The rabbits guard every crossing', gusts: [{ a: 0.6, s: 1 }, { a: 0, s: 1 }, { a: -0.6, s: 1 }, { a: 0, s: 1 }, N], chasms: [[0, 0.3, 1, 0.46], [0, 0.6, 1, 0.76], [0.45, 0.76, 1, 0.9]], ups: [[0.5, 0.25], [0.5, 0.52], [0.22, 0.81]], rabbits: 2, south: [0.12, 0.3], extra: TOO },
    { msg: 'Whatever they guard is down there', gusts: [{ a: 0.6, s: 1 }, { a: 0, s: 1 }, { a: -0.6, s: 1 }, { a: 0, s: 1 }, N], chasms: [[0, 0.28, 1, 0.44], [0.5, 0.44, 1, 0.58], [0, 0.58, 1, 0.72]], ups: [[0.5, 0.23], [0.3, 0.51], [0.3, 0.77]], rabbits: 3, end: true, extra: TOO },
  ];
  let north = [0.42, 0.58];
  FIELD.forEach((F, k) => {
    const i = k + 1;
    const sc = add(newScene({
      id: 'f' + i, area: 'field', depth: i, msg: F.msg, music: 'field', amb: 'wind', floor: ['#7d9a4c', '#7b9550', '#789055', '#768a5a', '#74845f', '#727f64', '#707a69'][k], speed: 0.45, accel: 8,
      gusts: F.extra ? F.gusts.concat(F.extra) : F.gusts, chasms: F.chasms, feat: { updrafts: F.ups, plants: F.ups.length ? F.ups.map(u => [u[0] + 0.07, u[1] - 0.02]) : [F.sock] },
    }));
    const south = F.end ? null : F.south ? gapAt(rr(F.south[0], F.south[1]), 0.08) : gapAt(rr(0.22, 0.78), 0.08);
    sc.exits.push({ side: 'n', a: north[0], b: north[1], to: i === 1 ? 'start' : 'f' + (i - 1) });
    if (south) sc.exits.push({ side: 's', a: south[0], b: south[1], to: 'f' + (i + 1) });
    const nPt = edgePoint('n', (north[0] + north[1]) / 2);
    if (i === 1) sc.exits.push({ side: 'w', a: 0.4, b: 0.6, to: 'foot' });
    edgeWall(sc, 'w', 'boulder', 1.0, i === 1 ? [[0.4, 0.6]] : []);
    edgeWall(sc, 'e', 'boulder', 1.0, F.end ? [[0.76, 0.93]] : []);   // past the tortoise, on its bank, the climb begins
    edgeWall(sc, 'n', 'boulder', 1.0, [north]);
    edgeWall(sc, 's', 'boulder', 1.0, south ? [south] : []);
    const keep = F.ups.map(u => [...u, 2.4]).concat(sc.feat.plants.map(s => [...s, 1.2]));
    sc.feat.plants.forEach(p => claim(sc, p[0], p[1], 0.9));
    sc.paths = F.ups.length ? [makePath(nPt, F.ups[0], 1)] : [makePath(nPt, south ? edgePoint('s', (south[0] + south[1]) / 2) : [0.5, 0.8], 2)];
    if (south && F.ups.length) sc.paths.push(makePath([0.5, 0.86], edgePoint('s', (south[0] + south[1]) / 2), 0));
    const top = F.chasms.length ? F.chasms[0][1] - 0.06 : 0.88;
    scatter(sc, 3 + i, 'boulder', 0.7, 1.3, 1.8, keep, [0.1, 0.9, 0.12, Math.max(0.2, top)]);
    if (F.end) { npc(sc, { kind: 'tortoise', fx: 0.5, fy: 0.87 }); }
    if (i <= 2) addPlots(sc, 3, [0.2, 0.8, 0.3, 0.8]);
    for (let r = 0; r < F.rabbits; r++) {
      const box = F.end ? [0.2, 0.8, 0.76, 0.9] : F.chasms.length ? [0.15, 0.85, F.chasms[F.chasms.length - 1][3] + 0.04, 0.9] : [0.15, 0.85, 0.3, 0.85];
      const p = freeSpot(sc, box, 1.0);
      sc.spawns.push({ type: 'rabbit', fx: p[0], fy: p[1] });
    }
    for (let t = 0; t < 90; t++) { const fx = rng(), fy = rng(); if (!inRects(F.chasms, fx, fy)) sc.deco.push({ kind: 'tuft', fx, fy, s: rr(0.6, 1.3), ph: rng() * 6 }); }
    if (i <= 2) for (let t = 0; t < (i === 1 ? 3 : 2); t++) { const q = freeSpot(sc, [0.15, 0.85, 0.15, 0.4], 0.6); item(sc, { type: 'fluff', fx: q[0], fy: q[1] }); }   // rabbit fluff snagged on the grass
    // rock banks: out in the ravines to hop across on, and slabs on the banks; the wind can't move you on rock
    sc.rocks = [];
    sc.rockCols = F.chasms.map(() => rng());                                 // where each ravine's rock column stands, fixed per seed
    const edges = [0.1].concat(F.chasms.flatMap(c => [c[1], c[3]])).concat([0.92]).sort((a, b) => a - b);
    sc.windLedges = true; sc.ledgeSeed = rng();          // landing ledges on every bank, laid out in tiles on arrival
    if (F.end) sc.exits.push({ side: 'e', a: 0.76, b: 0.93, to: 'peak1', locked: () => !state.inv.tortoise });
    if (south) north = south;
  });

  // ---------------- The High Crags: above the tortoise. Stone, cliffs, ravines you can jump, rocky outcrops ----------------
  const CRAGS = [
    { id: 'peak1', msg: 'The grass gives out. Only stone from here up.', ravines: [0.28], cliffs: [[0.47, 0.42, 1]], from: 'w' },
    { id: 'peak2', msg: 'Cliffs and cracks all the way up', ravines: [0.2, 0.58], cliffs: [[0.4, 0.35, 1], [0.76, 0, 0.62]], from: 's' },
    { id: 'peak3', msg: 'The summit. Something huge circles overhead.', ravines: [0.72], cliffs: [], from: 's', top: true },
  ];
  CRAGS.forEach((C, k) => {
    const sc = add(newScene({ id: C.id, area: 'peak', depth: 8 + k, msg: C.msg, music: 'field', amb: 'wind', floor: '#8b8680', speed: 0.42, accel: 8, chasms: [] }));
    sc.ravines = C.ravines.map(y => ({ y, hU: 1.7 }));                       // sized in tiles when you arrive, so they're always jumpable
    sc.exits = [];
    if (C.from === 'w') sc.exits.push({ side: 'w', a: 0.4, b: 0.6, to: 'f7' }); else sc.exits.push({ side: 's', a: 0.42, b: 0.58, to: CRAGS[k - 1].id });
    if (!C.top) sc.exits.push({ side: 'n', a: 0.42, b: 0.58, to: CRAGS[k + 1].id });
    for (const side of ['n', 's', 'w', 'e']) { const ex = sc.exits.find(e => e.side === side); edgeWall(sc, side, 'cliff', 1.1, ex ? [[ex.a, ex.b]] : [], 1.3); }
    for (const [y, x0, x1] of C.cliffs) for (let x = x0; x <= x1; x += 0.045) sc.solids.push(solid(x, y, 0.75, 'cliff'));
    const band = y => C.ravines.some(r => Math.abs(y - r) < 0.08) || C.cliffs.some(c => Math.abs(y - c[0]) < 0.06);
    for (let t = 0; t < 7; t++) { const q = freeSpot(sc, [0.1, 0.9, 0.12, 0.88], 1.3); if (!band(q[1])) sc.solids.push(solid(q[0], q[1], rr(0.7, 1.2), 'boulder')); }
    for (let t = 0; t < 14; t++) { const fx = rng(), fy = rng(); if (!band(fy)) sc.deco.push({ kind: 'tuft', fx, fy, s: rr(0.5, 0.9), ph: rng() * 6 }); }
    sc.rocks = [];
    if (C.top) { sc.solids.push(solid(0.5, 0.33, 0.9, 'cairn')); item(sc, { type: 'starseed', fx: 0.5, fy: 0.42 }); }
  });

  // ---------------- Foothill farm: where the mountain wind dumps you. Many crops. ----------------
  const foot = add(newScene({ id: 'foot', area: 'field', depth: 0, msg: 'A sheltered farm at the mountain\'s foot', music: 'forest', amb: 'wind', floor: '#86a052', speed: 0.45, accel: 8, gusts: [{ a: 0.2, s: 1 }, { a: Math.PI - 0.2, s: 1 }, { a: -0.2, s: 1 }, { a: Math.PI + 0.2, s: 1 }], chasms: [], heroStart: [0.5, 0.3] }));
  foot.exits = [{ side: 'e', a: 0.4, b: 0.6, to: 'f1' }];
  foot.feat.plants = [];
  edgeWall(foot, 'n', 'boulder', 1.0, []); edgeWall(foot, 'w', 'boulder', 1.0, []); edgeWall(foot, 's', 'boulder', 1.0, []);
  edgeWall(foot, 'e', 'boulder', 1.0, [[0.4, 0.6]]);
  foot.paths = [makePath([0.97, 0.5], [0.3, 0.5], 1)];
  foot.feat.plots = [];
  foot.feat.crops = [];
  const CROPS = ['squash', 'carrot', 'berries', 'turnip', 'pepper', 'squash'];
  foot.feat.plotLv = 1;                              // someone farmed here before you: the rich soil is already turned
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { foot.feat.plots.push([0.22 + c * 0.06, 0.45 + r * 0.12]); foot.feat.crops.push(CROPS[c]); claim(foot, 0.22 + c * 0.06, 0.45 + r * 0.12, 0.7); }
  addShroom(foot, [0.82, 0.28], 0);
  scatter(foot, 4, 'boulder', 0.7, 1.1, 1.5, [[0.37, 0.51, 6], [0.82, 0.28, 2.5]], [0.1, 0.9, 0.12, 0.88]);
  for (let t = 0; t < 60; t++) foot.deco.push({ kind: 'tuft', fx: rng(), fy: rng(), s: rr(0.6, 1.3), ph: rng() * 6 });

  // ---------------- Cave: 7 screens, entered through the sinkhole in the woods ----------------
  const CAVE_SPAWNS = [
    ['stalker'], ['glowworm', 'glowworm', 'stalker'], ['diver', 'glowworm'], ['charger', 'diver'],
    ['stalker', 'diver', 'diver', 'glowworm'], ['charger', 'diver', 'diver', 'diver', 'glowworm'], ['warden'],
  ];
  const CAVE_MSG = ['Find the way out', 'Pale things crawl in the dark', 'Something skitters on the ceiling', 'Deeper still. Hooves scrape stone.', 'The ceiling is alive', 'The drips sound like footsteps', 'A roar of water ahead'];
  const CAVE_FLOOR = ['#1d1a22', '#1e1a21', '#201a21', '#211a1f', '#221a1e', '#231a1c', '#1c1d26'];
  west = null;
  for (let i = 1; i <= 7; i++) {
    const boss = i === 7;
    const sc = add(newScene({
      id: 'c' + i, area: 'cave', depth: i, msg: CAVE_MSG[i - 1], shade: 0.96, lightScale: 1,
      music: i <= 3 ? 'cave' : 'cave2', amb: boss ? 'falls' : 'none', drips: true,
      floor: CAVE_FLOOR[i - 1], speed: 0.3, accel: 6, heroStart: [0.08, 0.5],
    }));
    const east = boss ? [0.4, 0.6] : gapAt(rr(0.25, 0.75), 0.09);
    if (west) sc.exits.push({ side: 'w', a: west[0], b: west[1], to: 'c' + (i - 1) });
    else sc.exits.push({ side: 'w', a: 0.4, b: 0.6, to: 'w3', arrive: 'sinkhole', say: 'You climb the roots back up.' });
    sc.exits.push({ side: 'e', a: east[0], b: east[1], to: boss ? 'fallsbank' : 'c' + (i + 1), locked: boss ? () => !(RT.c7 && RT.c7.bossDead) : null });
    edgeWall(sc, 'n', 'cavewall', 1.1, [], 1.4);
    edgeWall(sc, 's', 'cavewall', 1.1, [], 1.4);
    edgeWall(sc, 'w', 'cavewall', 1.1, west ? [west] : [[0.4, 0.6]], 1.4);
    if (!boss) edgeWall(sc, 'e', 'cavewall', 1.1, [east], 1.4);
    const wPt = west ? edgePoint('w', (west[0] + west[1]) / 2) : [0.06, 0.5];
    sc.paths = [makePath(wPt, boss ? [0.8, 0.5] : edgePoint('e', (east[0] + east[1]) / 2), 2)];
    if (i === 4) addShroom(sc);
    if (i === 3) { const q = freeSpot(sc, [0.3, 0.8, 0.2, 0.8], 1, []); item(sc, { type: 'recipe_temper', fx: q[0], fy: q[1] }); }
    if (!boss) scatter(sc, 1 + i, 'stalagmite', 0.8, 1.2, 2.2, sc.feat.shroom ? [[...sc.feat.shroom, 3]] : [], [0.15, 0.85, 0.15, 0.85]);
    else {
      sc.feat.falls = true;
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + 0.5; sc.solids.push(solid(0.55 + Math.cos(a) * 0.22, 0.5 + Math.sin(a) * 0.3, 0.8, 'stalagmite')); }
    }
    CAVE_SPAWNS[i - 1].forEach(type => {
      const p = type === 'warden' ? [0.62, 0.5] : freeSpot(sc, [0.35, 0.85, 0.2, 0.8], 1.3, [[...wPt, 6]]);
      sc.spawns.push({ type, fx: p[0], fy: p[1] });
    });
    for (let t = 0; t < 46; t++) sc.deco.push({ kind: 'pebble', fx: rng(), fy: rng(), s: rr(0.4, 1.6), shade: rng() });
    if (i >= 3 && i <= 6) sc.webs = Array.from({ length: i - 1 }, () => { const q = freeSpot(sc, [0.2, 0.8, 0.2, 0.8], 1.2); return { fx: q[0], fy: q[1], r: rr(0.9, 1.4) }; });
    if (i === 3 || i === 6) sc.feat.glimpse = { to: edgePoint('e', (east[0] + east[1]) / 2), line: i === 3 ? 'Still here! Keep coming!' : 'I can hear water! Hurry!' };
    west = east;
  }

  // ---------------- Marsh: beans for the old toad, reeds hiding a darker cave ----------------
  const MARSH_MSG = ['Mist hangs over black water', 'Something big croaks nearby', 'Dry reeds choke a cave mouth'];
  west = [0.4, 0.6];
  for (let i = 1; i <= 3; i++) {
    const last = i === 3;
    const sc = add(newScene({ id: 'm' + i, area: 'marsh', depth: i, msg: MARSH_MSG[i - 1], music: 'marsh', amb: 'marsh', floor: '#3a4a2d', speed: 0.34, accel: 7, breeze: 0.02 }));
    // the river out of the falls bank enters at the top of the west edge and runs off the north edge
    if (i === 1) sc.river = { pts: [[-0.08, 0.12], [0.1, 0.08], [0.24, -0.08]], w: 2.8 };
    const east = last ? [0.4, 0.6] : gapAt(rr(0.25, 0.75), 0.1);
    sc.exits.push({ side: 'w', a: west[0], b: west[1], to: i === 1 ? 'fallsbank' : 'm' + (i - 1) });
    sc.exits.push({ side: 'e', a: east[0], b: east[1], to: last ? 'h1' : 'm' + (i + 1), locked: last ? () => !broken('m3', 'reeds') : null });
    edgeWall(sc, 'n', 'deadtree', 1.0, i === 1 ? [[0, 0.34]] : [], 1.9, 'bog');
    edgeWall(sc, 's', 'deadtree', 1.0, i === 2 ? [[0.4, 0.6]] : [], 1.9, 'bog');
    if (i === 2) sc.exits.push({ side: 's', a: 0.4, b: 0.6, to: 'sw1' });
    if (last) barrier(sc, 'reeds', 'reeds', 0.95, 0.34, 0.95, 0.66, 0.7);
    const wPt = edgePoint('w', (west[0] + west[1]) / 2), ePt = edgePoint('e', (east[0] + east[1]) / 2);
    sc.paths = [makePath(wPt, ePt, 2)];
    const npcSpot = i === 2 ? [rr(0.4, 0.6), rr(0.3, 0.7)] : null;
    if (npcSpot) npc(sc, { kind: 'toad', fx: npcSpot[0], fy: npcSpot[1] });
    for (let p = 0; p < 3 + i; p++) {
      const q = freeSpot(sc, [0.2, 0.8, 0.2, 0.8], 2.2, [[...wPt, 4], [...ePt, 3], ...(npcSpot ? [[...npcSpot, 3]] : []), ...sc.pools.map(o => [o.fx, o.fy, o.r + 2])]);
      sc.pools.push({ fx: q[0], fy: q[1], r: rr(1.2, 2.1) });
    }
    scatter(sc, 2 + i, 'deadtree', 0.7, 1.0, 1.8, sc.pools.map(o => [o.fx, o.fy, o.r + 0.5]), [0.1, 0.9, 0.15, 0.85], 'bog');
    const lurkers = [1, 1, 2][i - 1];
    for (let l = 0; l < lurkers; l++) sc.spawns.push({ type: 'lurker', fx: sc.pools[l].fx, fy: sc.pools[l].fy, pool: l });
    if (i === 1) addShroom(sc);
    for (let b = 0; b < (i === 2 ? 1 : 2); b++) {
      const q = freeSpot(sc, [0.1, 0.9, 0.15, 0.85], 0.8, sc.pools.map(o => [o.fx, o.fy, o.r]).concat(npcSpot ? [[...npcSpot, 3]] : []));
      item(sc, { type: 'bean', fx: q[0], fy: q[1] });
    }
    for (let t = 0; t < 50; t++) sc.deco.push({ kind: 'reed', fx: rng(), fy: rng(), s: rr(0.6, 1.2), ph: rng() * 6 });
    if (i === 1) sc.feat.glimpse = { to: ePt, line: 'Ugh, it stinks out here!' };
    if (i === 3) sc.feat.glimpse = { to: [0.99, 0.5], line: 'Past the reeds! They\'ve got a lair!' };
    west = east;
  }

  // ---------------- Sunken Swamp: south of the marsh, murkier, older ----------------
  const SWAMP_MSG = ['The marsh sinks into swamp', 'Things float here that shouldn\'t', 'Old stones rise from the water'];
  let north2 = [0.4, 0.6];
  for (let i = 1; i <= 3; i++) {
    const last = i === 3;
    const sc = add(newScene({ id: 'sw' + i, area: 'swamp', depth: i, msg: SWAMP_MSG[i - 1], music: 'swamp', amb: 'marsh', floor: ['#2f3d27', '#2b3824', '#283422'][i - 1], shade: 0.3 + i * 0.08, lightScale: 1.3, speed: 0.32, accel: 7, breeze: 0.01 }));
    sc.exits.push({ side: 'n', a: north2[0], b: north2[1], to: i === 1 ? 'm2' : 'sw' + (i - 1) });
    const south = last ? null : gapAt(rr(0.25, 0.75), 0.1);
    if (south) sc.exits.push({ side: 's', a: south[0], b: south[1], to: 'sw' + (i + 1) });
    edgeWall(sc, 'n', 'deadtree', 1.0, [north2], 1.6, 'bog');
    edgeWall(sc, 's', 'deadtree', 1.0, south ? [south] : [], 1.6, 'bog');
    edgeWall(sc, 'w', 'deadtree', 1.0, [], 1.6, 'bog');
    edgeWall(sc, 'e', 'deadtree', 1.0, [], 1.6, 'bog');
    const nPt = edgePoint('n', (north2[0] + north2[1]) / 2), sPt = south ? edgePoint('s', (south[0] + south[1]) / 2) : [0.5, 0.75];
    sc.paths = [makePath(nPt, sPt, 3)];
    if (i === 2) sc.feat.shroomSpot = freeSpot(sc, [0.25, 0.75, 0.25, 0.75], 3, [[...nPt, 4], [...sPt, 4]]);
    if (last) { sc.feat.shrine = [0.5, 0.72]; claim(sc, 0.5, 0.72, 1.8); sc.solids.push(solid(0.38, 0.72, 0.7, 'pillar', 'moss'), solid(0.62, 0.72, 0.7, 'pillar', 'moss')); }
    for (let p = 0; p < 4 + i; p++) {
      const q = freeSpot(sc, [0.15, 0.85, 0.2, 0.8], 2.2, [[...nPt, 4], [...sPt, 3], ...(sc.feat.shroomSpot ? [[...sc.feat.shroomSpot, 6]] : []), ...(last ? [[0.5, 0.72, 4]] : []), ...sc.pools.map(o => [o.fx, o.fy, o.r + 1.5])]);
      sc.pools.push({ fx: q[0], fy: q[1], r: rr(1.3, 2.4) });
    }
    scatter(sc, 5 + i * 2, 'deadtree', 0.7, 1.1, 1.5, sc.pools.map(o => [o.fx, o.fy, o.r + 0.4]).concat(sc.feat.shroom ? [[...sc.feat.shroom, 3]] : []), [0.1, 0.9, 0.12, 0.88], 'bog');
    if (i === 2) addShroom(sc, sc.feat.shroomSpot);
    const lurk = Math.min(sc.pools.length, i + 1);
    for (let l = 0; l < lurk; l++) sc.spawns.push({ type: 'lurker', fx: sc.pools[l].fx, fy: sc.pools[l].fy, pool: l });
    for (const type of [['glowworm'], ['gremlin', 'glowworm'], ['gremlin', 'gremlin', 'glowworm']][i - 1]) { const q = freeSpot(sc, [0.2, 0.8, 0.3, 0.8], 1.2, [[...nPt, 5]]); sc.spawns.push({ type, fx: q[0], fy: q[1] }); }
    if (i <= 2) { const q = freeSpot(sc, [0.15, 0.85, 0.2, 0.8], 0.8, sc.pools.map(o => [o.fx, o.fy, o.r])); item(sc, { type: 'bean', fx: q[0], fy: q[1] }); }
    if (last) item(sc, { type: 'recipe_star', fx: 0.5, fy: 0.64 }, { type: 'starseed', fx: 0.5, fy: 0.7 }, { type: 'emberseed', fx: 0.46, fy: 0.76 }, { type: 'ironseed', fx: 0.54, fy: 0.76 });
    for (let t = 0; t < 60; t++) sc.deco.push({ kind: 'reed', fx: rng(), fy: rng(), s: rr(0.6, 1.3), ph: rng() * 6 });
    if (south) north2 = south;
  }

  // ---------------- The Hollow Beneath: darker each screen; only fire lights it ----------------
  west = [0.4, 0.6];
  for (let i = 1; i <= 3; i++) {
    const last = i === 3;
    const sc = add(newScene({
      id: 'h' + i, area: 'hollow', depth: i, msg: ['Your light barely reaches the floor', 'Webs, thick as rope', 'Gremlin cackling echoes ahead'][i - 1],
      shade: 0.975, lightScale: [0.75, 0.55, 0.4][i - 1], music: 'cave2', amb: 'marsh', drips: true, floor: '#1a1d17', speed: 0.3, accel: 6, heroStart: [0.08, 0.5],
    }));
    const east = last ? null : gapAt(rr(0.3, 0.7), 0.1);
    sc.exits.push({ side: 'w', a: west[0], b: west[1], to: i === 1 ? 'm3' : 'h' + (i - 1) });
    if (east) sc.exits.push({ side: 'e', a: east[0], b: east[1], to: 'h' + (i + 1), locked: i === 2 ? () => !broken('h2', 'webs') : null });
    edgeWall(sc, 'n', 'cavewall', 1.1, [], 1.4, 'moss');
    edgeWall(sc, 's', 'cavewall', 1.1, [], 1.4, 'moss');
    edgeWall(sc, 'w', 'cavewall', 1.1, [west], 1.4, 'moss');
    edgeWall(sc, 'e', 'cavewall', 1.1, east ? [east] : [], 1.4, 'moss');
    const wPt = edgePoint('w', (west[0] + west[1]) / 2);
    const ePt = east ? edgePoint('e', (east[0] + east[1]) / 2) : [0.8, 0.5];
    sc.paths = [makePath(wPt, ePt, 2)];
    if (i === 2) barrier(sc, 'webs', 'web', 0.94, east[0] - 0.04, 0.94, east[1] + 0.04, 0.6);
    if (last) {
      npc(sc, { kind: 'pip', fx: 0.8, fy: 0.5 }); ringBarrier(sc, 'cocoon', 'vine', 0.8, 0.5, 1.3);
      sc.feat.darkShroom = [0.8 + 2.4 * UNIT / W, 0.5 - 1.6 * UNIT / H];       // the gremlins' spore mushroom, tangled in the same vines
      claim(sc, ...sc.feat.darkShroom, 1.4);
      sc.solids.push(solid(sc.feat.darkShroom[0], sc.feat.darkShroom[1], 0.8, 'shroom', null, { bar: 'darkshroom', dark: true }));
    }
    sc.webs = Array.from({ length: [4, 7, 5][i - 1] }, () => { const q = freeSpot(sc, [0.15, 0.85, 0.15, 0.85], 1.2, last ? [[0.8, 0.5, 3]] : []); return { fx: q[0], fy: q[1], r: rr(0.9, 1.5) }; });
    scatter(sc, 2 + i, 'stalagmite', 0.8, 1.2, 2.0, last ? [[0.8, 0.5, 3]] : [], [0.15, 0.85, 0.15, 0.85], 'moss');
    for (let p = 0; p < i; p++) {
      const q = freeSpot(sc, [0.3, 0.7, 0.2, 0.8], 2, [[...wPt, 5], [0.8, 0.5, 3.5]]);
      sc.pools.push({ fx: q[0], fy: q[1], r: rr(1.1, 1.6) });
    }
    const spawns = [['glowworm', 'lurker', 'gremlin'], ['diver', 'diver', 'glowworm', 'gremlin'], ['gremlin', 'gremlin', 'gremlin', 'lurker']][i - 1];
    let li = 0;
    spawns.forEach(type => {
      if (type === 'lurker') { const p = sc.pools[li]; sc.spawns.push({ type, fx: p.fx, fy: p.fy, pool: li++ }); return; }
      const q = freeSpot(sc, [0.35, 0.75, 0.2, 0.8], 1.2, [[...wPt, 6]]);
      sc.spawns.push({ type, fx: q[0], fy: q[1] });
    });
    for (let t = 0; t < 40; t++) sc.deco.push({ kind: 'pebble', fx: rng(), fy: rng(), s: rr(0.4, 1.4), shade: rng() });
    if (i === 2) sc.feat.glimpse = { to: ePt, line: 'Almost there! Don\'t stop!' };
    west = east;
  }
  return S;
}

// =====================================================================
// State
// =====================================================================
let WORLD = {};
let SEED = 1;
let RT = {};                   // runtime memory per scene: dead spawns, items, pulled things, flags
function rtFor(id) {
  if (!RT[id]) {
    const sc = WORLD[id];
    RT[id] = { deadAt: {}, items: sc ? sc.initItems.map(i => ({ ...i })) : [], pulled: new Set(), flags: {}, bossDead: false };
  }
  return RT[id];
}
const broken = (id, bar) => !!(RT[id] && RT[id].flags[bar]);

// vigor grows geometrically with depth (relics, the tortoise) and a little with training
const baseVig = depth => Math.round(8 * Math.pow(1.5, depth));
function newHero() { return { x: W * 0.5, y: H * 0.5, vx: 0, vy: 0, z: 0, stun: 0, invuln: 0, hurtT: -9, fx: 0, fy: 1, side: 1, vig: 8, rest: 0, dashT: 0, dashCool: 0, ride: null, falling: 0, safe: null }; }
// step, silk, horn are levelled relics (0 = not found, up to 3)
// seeds: vegetable seeds (turnip, carrot, pepper, squash) grow that vegetable; rarer seeds grow crafting materials
function newInv() { return { story: 0, chest: {}, raw: {}, known: {}, craftSlots: 2, pipTaken: false, pipTips: {}, favFood: null, favSeed: null, journal: 0, thiefAt: 0, pages: 0, raft: 0, rod: false, tunnel: false, fishBuff: 0, spores: 0, sporeAt: {}, pipSaved: false, recipes: {}, shrooms: {}, bag: { turnipseed: 0, carrotseed: 0, pepperseed: 0, squashseed: 0, thornseed: 0, emberseed: 0, ironseed: 0, starseed: 0 }, mats: { thorn: 0, ember: 0, ironwood: 0, starpetal: 0, ear: 0, hide: 0, driftwood: 0 }, up: { edge: 0, temper: 0, guard: 0, pouch: 0, star: 0, cap: 0 }, vigBonus: 0, xp: 0, tlevel: 0, sword: false, scalp: false, step: 0, silk: 0, horn: 0, fire: false, food: [], acorns: 0, seeds: 0, beans: 0, lumin: 0, slime: 0, pepper: 0, depth: 0, tortoise: false, skill: {}, quests: {}, qlog: [], harvests: 0 }; }
function newPull(id) { return { id, grip: false, wiggle: 0, lastSide: 0, tilt: 0, tries: 0, hinted: false }; }
const maxVig = () => Math.round((baseVig(state.inv.depth + state.inv.tlevel * 0.25 + (state.inv.up.star ? 1 : 0)) + state.inv.vigBonus) * (state.inv.fishBuff > 0 ? 1.3 : 1));

state = {
  scene: 'camp', hero: null, inv: newInv(), pull: newPull(null),
  enemies: [], items: [], hazards: [], rings: [], fx: [], texts: [], solids: [], pools: [], shots: [], gas: [],
  drops: [], splashes: [], dripTimer: 1, bird: null, clouds: [], gust: 0, gustT: 0, gustIdx: 0, gustPhase: 'lull',
  atk: null, atkCool: 0, hold: { on: false, t: 0, charged: false }, aim: { on: false, t: 0 }, fireHold: { on: false, emit: 0 }, spark: null,
  carry: null, combo: { step: null, t: -9, level: 0 }, treeCool: {}, treeShake: {}, stalCool: {}, flock: [], blind: 0, slowmo: 0,
  cut: null, title: null, menu: null, npcTalk: null,
  night: 0, rain: 0, flash: 0, playTime: 0,
  cam: { z: 1, x: 0, y: 0, focus: null, pulses: [], ez: 1, ex: 0, ey: 0 },
  started: false, won: false, busy: false, fade: 0, fadeTarget: 0, fadeRate: 4,
  shake: 0, time: 0, keys: {}, prevKeys: {}, entry: null, area: null, seen: {}, tipsSeen: {},
  settings: { tips: 'intro', keys: { ...DEFAULT_KEYS } }, remap: null, slam: false, equip: 'sword',
  choice: null, whirl: null, chain: { n: 0, t: -9 }, plateOn: {}, fish: null, fishCool: {},
};
state.hero = newHero();
