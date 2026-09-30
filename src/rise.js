// ===== rise.js: the rise, the second screen of the fields (where f2 was). One long slope, 86 tiles west to east
// and 30 deep, from the first field up to a pass into the mountain, and on to the third field.
// It runs on the main game: the hero, Pip, the rabbits, items, fire and the barrier are all the usual code, in a scene
// bigger than the screen (sceneSize: while the rise is current, W and H are its own size in pixels; walking pace
// comes from the screen, L()). Only the drawing is its own: it opens looking straight down, like the fields; walk
// east and the view pulls back and tips up, so the grade shows and the mountain stands up ahead; walk back and it
// comes in again. Everything standing is drawn where it touches the ground, scaled with the view.
// At x 20, just past a tree, a wall of reeds crosses the way: for now nothing gets through it.

const RISE = { len: 86, D: 30, flat: 0, grade: 0.0018, mid: 15, floor: '#7b9550', treeX: 18, barX: 20, inX: 4, outX: 81.2, tilt: 0.95, lead: 6, lift: 4.5, X0: -16, X1: 124, Y0: -6, Y1: 72 };
const riseClamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const riseFoot = y => 74 + Math.sin(y * 0.35) * 2.5 + Math.sin(y * 0.9) * 0.8;       // where the mountain's stone begins
const risePathY = x => 15 + Math.sin(x * 0.13) * 2;                                   // the worn path, west to east
// the whole path, as the map has it: down from the first field at the north-west corner, east up the rise, and at the
// far end south through the pass, down to the third field. Distance to it, in tiles:
function risePathD(x, y) {
  const { inX, outX, D } = RISE, y0 = risePathY(inX + 6), y1 = risePathY(outX);
  let d = x >= inX + 4 && x <= outX ? Math.abs(y - risePathY(x)) : 99;
  if (y <= y0 + 0.5) { const t = riseClamp((y + 1) / (y0 + 1)); d = Math.min(d, Math.abs(x - (inX + 6 * t * t))); }   // the way in, from the north
  if (y >= y1 - 0.5) { const t = riseClamp((y - y1) / (D + 1 - y1)); d = Math.min(d, Math.abs(x - (outX + 0.6 * t))); }   // the way out, to the south
  return d;
}
// the lowest the view pulls back: never so far that you're a speck (a phone keeps you at least 20 px)
const riseZoomMin = () => Math.max(0.5, 20 / UNIT);
// the ground's height in tiles: a gentle grade from the first step, steepening as it goes, then the mountain (cut by the pass)
function riseH(x, y) {
  const f = riseFoot(y), xb = Math.min(x, f), m = x - f;
  let h = xb < RISE.flat ? 0 : RISE.grade * (xb - RISE.flat) ** 2;
  h += Math.max(0, xb - RISE.flat - 2) * 0.02 * Math.sin(y * 0.3 + x * 0.08);            // a little roll in it
  if (m > 0) {
    const dy = y - risePathY(x), notch = dy < 0 ? riseClamp((-dy - 1.2) / 2.5) : 0.15 * riseClamp((dy - 1.2) / 10);   // the mountain proper is north of the path; south of it only a low shoulder (so the pass stays in view)
    h += (11 * (1 - Math.exp(-m * m / 40)) + 4 * Math.max(0, Math.sin(y * 0.3 + 1)) * riseClamp((m - 5) / 8) + Math.min(12, Math.max(0, m - 10)) * 0.25) * notch + m * 0.12 * (1 - notch);
  }
  return Math.max(0, h);
}
// the way between its two walls of stone: 14 tiles wide by the fields, opening out as the view pulls back, 30 at the foot
const riseHalf = x => 7 + 8 * riseView(x);

function riseColor(x, y) {
  const h = riseH(x, y), gx = riseH(x + 0.3, y) - riseH(x - 0.3, y), gy = riseH(x, y + 0.3) - riseH(x, y - 0.3);
  const lit = riseClamp(0.35 * gx / 0.6 - 0.2 * gy / 0.6, -0.8, 0.8) * (0.4 + 0.6 * riseClamp((h - 3) / 6));   // faces turned to the light (west) catch it
  const base = parseInt(RISE.floor.slice(1), 16), k = riseClamp((h - 5) / 6);    // the fields' grass, going over to stony turf, then stone
  let c = [base >> 16, (base >> 8) & 255, base & 255].map((v, i) => v + ([132, 130, 118][i] - v) * k);
  const d = risePathD(x, y);
  if (d < 0.75 && x > RISE.X0) { const w = (1 - d / 0.75) * 0.75; c = c.map((v, i) => v + ([150, 132, 98][i] - v) * w); }
  return 'rgb(' + c.map(v => Math.round(riseClamp(v + lit * 30, 0, 255))).join(',') + ')';
}


// how far along the change you are (0 = looking straight down, 1 = pulled back and tipped at the foot)
const riseView = x => riseClamp((x - 1) / (RISE.len - 10));                        // evenly, from the first step to the foot: no late rush
const riseZoom = p => 1 - (1 - riseZoomMin()) * p;
const riseLead = p => Math.min(RISE.lead, 0.3 * SW / 2 / (UNIT * riseZoom(p))) * p;   // how far ahead of you the view looks (less on a narrow screen)
function riseProj(x, y, z, r = state.rise) {                                          // tiles to the screen (whatever size the scene is)
  const s = riseZoom(r.p), th = RISE.tilt * r.p;
  return [SW / 2 + (x - r.cx) * UNIT * s, SH / 2 + ((y - r.cy) * Math.cos(th) - (z - r.ch) * Math.sin(th)) * UNIT * s];
}

// the land, laid out once in tiles: rows of heights and colours, and everything standing on it
let RISE_LAND = null;
function riseLand() {
  if (RISE_LAND) return RISE_LAND;
  const { X0, X1, Y0, Y1 } = RISE, xs = []; for (let x = X0; x <= X1; x++) xs.push(x);
  let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const props = [], put = (k, x, y, r, solid) => props.push({ k, x, y, r, solid, seed: rnd() * 9, v: Math.floor(rnd() * 3), by: y + (k === 'tuft' ? 0.1 : k === 'tree' ? 0.3 : r * 0.9) });
  const clearOf = (x, y, r) => !props.some(p => p.solid && Math.hypot(p.x - x, p.y - y) < p.r + r + 0.2);
  const nearBar = x => Math.abs(x - RISE.barX) < 1.6, inPassOut = (x, y) => x > RISE.outX - 4.5 && x < RISE.outX + 4 && y > risePathY(x) - 3;
  // the walls of the way: a line of stones along each side, smooth by the fields, rough as the ground rises. The north
  // one starts past the way in; a short wall closes the corner above it, another the west end
  const nW = RISE.inX + 3.5;
  for (const sd of [-1, 1]) for (let x = sd < 0 ? nW : 0.4; x < 100; x += 1.25) { const wy = RISE.mid + sd * riseHalf(x); if (x > riseFoot(wy) + 1) break; const r = 0.55 + rnd() * 0.35; put(x > 40 ? 'crag' : 'boulder', x + rnd() * 0.4, wy + (rnd() - 0.5) * 0.5, r, true); }
  for (let y = 0.3; y < RISE.mid - riseHalf(nW) - 0.6; y += 1.2) put('boulder', nW + (rnd() - 0.5) * 0.3, y, 0.55 + rnd() * 0.3, true);
  for (let y = 0.3; y < RISE.mid + riseHalf(0) - 0.6; y += 1.2) put('boulder', -0.1 + (rnd() - 0.5) * 0.3, y, 0.6 + rnd() * 0.3, true);
  // the first stretch: stones and trees to duck behind when a rabbit comes (off the path, inside the walls), and the
  // tree just before the reeds
  for (const [x, dy, k] of [[6, 4.5, 'boulder'], [8.5, -3.2, 'tree'], [10.5, 3.4, 'boulder'], [12.5, -4.5, 'boulder'], [13.5, 4.8, 'tree'], [15.5, -3, 'boulder'], [16.5, 3.2, 'boulder'], [7, -5.2, 'boulder']]) {
    const y = risePathY(x) + dy; if (Math.abs(y - RISE.mid) < riseHalf(x) - 1.2) put(k, x, y, k === 'tree' ? 1.2 : 0.7 + rnd() * 0.25, true);
  }
  put('tree', RISE.treeX, risePathY(RISE.treeX) - 2.8, 1.2, true);
  // the mountain's foot and the pass: crags on the line you can't cross
  for (let y = Y0; y < Y1; y += 1.1) { const f = riseFoot(y); if (Math.abs(y - risePathY(f)) < 1.7) continue; put('crag', f + 0.3 + rnd() * 0.4, y, 0.9 + rnd() * 0.6, true); }
  // the pass: east between two unbroken walls, then south down to the third field between two more
  const oX = RISE.outX, oW = oX - 2.9, oE = oX + 3.2;
  for (let x = riseFoot(risePathY(76)) - 1; x < RISE.len + 2; x += 0.85) for (const sd of [-1, 1]) { if (sd > 0 && x > oW - 0.3) continue; const r = 0.55 + rnd() * 0.3, y = risePathY(x) + sd * (1.6 + r); if (x > riseFoot(y) - 0.5) put('crag', x, y, r, true); }
  for (const [wx, from] of [[oW, risePathY(oW) + 2.1], [oE, risePathY(oE) - 1.6]]) for (let y = from; y < RISE.D + 1.5; y += 0.85) put('crag', wx + (rnd() - 0.5) * 0.2, y, 0.55 + rnd() * 0.3, true);
  for (let i = 0; i < 110; i++) { const y = Y0 + rnd() * (Y1 - Y0), x = riseFoot(y) + 1 + rnd() * 40, r = 0.7 + rnd() * 0.8; if (risePathD(x, y) < 3.5 + r || inPassOut(x, y) || !clearOf(x, y, r * 0.6)) continue; put('crag', x, y, r, true); }
  // on the way: a few stones and trees (never on the path, none by the reeds, no tree before the first), grass tufts
  for (let i = 0; i < 60; i++) { const x = X0 + rnd() * (riseFoot(15) - X0 - 4), y = Y0 + rnd() * (Y1 - Y0), r = 0.45 + rnd() * 0.5; if (risePathD(x, y) < 2.2 || nearBar(x) || !clearOf(x, y, r)) continue; put(x > 36 ? 'crag' : 'boulder', x, y, r, true); }
  for (let i = 0; i < 18; i++) { const x = 23 + rnd() * 47, y = Y0 + rnd() * (Y1 - Y0); if (risePathD(x, y) < 2.4 || !clearOf(x, y, 0.6)) continue; put('tree', x, y, 1.2, true); }
  for (let i = 0; i < 420; i++) { const x = X0 + rnd() * (X1 - X0), y = Y0 + rnd() * (Y1 - Y0); if (x < riseFoot(y) - 1 && riseH(x, y) < 9) put('tuft', x, y, 0.3, false); }
  // what stands inside the scene is a solid the game tests; the rest (tufts, the far land) is only drawn
  const inside = p => p.solid && p.x > -2 && p.x < RISE.len + 2 && p.y > -2 && p.y < RISE.D + 2;
  const deco = props.filter(p => !inside(p)).sort((a, b) => a.by - b.by);
  return (RISE_LAND = { xs, rows: null, solids: props.filter(inside), deco });
}
// the ground's rows, made the first time the rise is drawn (the world is built without them: tests load faster)
function riseRows(land = riseLand()) {
  if (land.rows) return land.rows;
  const { Y0, Y1 } = RISE, xs = land.xs, rows = []; let y = Y0;
  while (y < Y1) {
    const st = Math.abs(y - RISE.mid) < 3.5 ? 0.25 : 0.5, y2 = y + st, ym = y + st / 2;                  // finer rows where the path wanders
    rows.push({ y, y2, top: xs.map(x => riseH(x, y)), bot: xs.map(x => riseH(x, y2)), cols: xs.map(x => riseColor(x, ym)), grad: null });
    y = y2;
  }
  return (land.rows = rows);
}
// collision radius as the game scales it for each kind (engine's refreshSceneGeometry): a stone collides at its drawn size
const RISE_KIND = { boulder: 'boulder', crag: 'crag', tree: 'tree' }, RISE_F = { boulder: 0.95, crag: 1.15, tree: 1 };

// the scene, built with the world (no rng: the rest of the world is laid out exactly as before). It takes f2's place:
// the first field's south way leads in at the north-west corner, and the pass at the far end leads south into the
// third field: in and out as the map lays them (f1 above, f3 below).
function addRise(S, add) {
  const land = riseLand(), { len, D } = RISE, oX = RISE.outX, oW = oX - 2.9, oE = oX + 3.2;
  const sc = add(newScene({ id: 'rise', area: 'field', depth: 2, msg: 'The ground starts to climb. Rabbits, too.', music: 'field', amb: 'wind', floor: RISE.floor, speed: 0.45, accel: 8 }));
  sc.virt = [len, D];                                                                   // its size in tiles (sceneSize)
  // the wind, as on the first field: the same gusts (two gentle, one strong, from the same quarters), tall grass that
  // leans the way the next one will blow, loose fluff and you and Pip nudged or shoved, cloud shadows drifting.
  // (No ledges to ride to here: a jump into the strong gust is just a jump.)
  sc.gusts = S.f1.gusts.map(g => ({ ...g }));
  sc.feat.plants = [[4.5, -2.8], [14.5, 2.4], [30, -4], [47, 4.5], [62, -5]].map(([x, dy]) => [x / len, (risePathY(x) + dy) / D]);
  for (const p of land.solids) sc.solids.push({ fx: p.x / len, fy: p.y / D, r: p.k === 'tree' ? p.r : p.r / RISE_F[p.k], kind: RISE_KIND[p.k], v: p.v, flip: p.seed > 4.5, pal: 'green', rise: p.k, rr: p.r, seed: p.seed });
  // the reeds: dense, wall to wall, just past the tree at x 18. For now nothing gets through, fire included (no bar:
  // nothing breaks them). To open them to fire later, give each clump bar: 'risereeds'
  { const x = RISE.barX, hw = riseHalf(x); for (let y = RISE.mid - hw + 0.5; y <= RISE.mid + hw - 0.5; y += 0.85) sc.solids.push({ fx: (x + Math.sin(y * 2.1) * 0.25) / len, fy: y / D, r: 0.72, kind: 'reeds', v: Math.floor(y) % 3, flip: y % 2 < 1, pal: null, reedwall: true }); }
  for (const [x, y] of [[11, 18.8], [15, 11.6]]) sc.spawns.push({ type: 'rabbit', fx: x / len, fy: y / D });   // two rabbits in the first stretch: two tufts of fluff
  const f1s = S.f1.exits.find(e => e.to === 'f2'), f3n = S.f3.exits.find(e => e.to === 'f2');
  sc.exits.push({ side: 'n', a: 0.8 / len, b: (RISE.inX + 3) / len, to: 'f1', arrive: [(f1s.a + f1s.b) / 2, 0.91] });
  sc.exits.push({ side: 's', a: (oW + 0.8) / len, b: (oE - 0.8) / len, to: 'f3', arrive: [(f3n.a + f3n.b) / 2, 0.09] });
  Object.assign(f1s, { to: 'rise', arrive: [RISE.inX / len, 1.2 / D] });
  Object.assign(f3n, { to: 'rise', arrive: [RISE.outX / len, 1 - 1.2 / D] });
  delete S.f2;
  return sc;
}
// the scene's own size in pixels, while it is the current one (every other scene is the screen)
const sceneSize = id => { const sc = typeof WORLD !== 'undefined' && WORLD && WORLD[id]; return sc && sc.virt ? [sc.virt[0] * UNIT, sc.virt[1] * UNIT] : [SW, SH]; };

function newRise() { const r = { p: 0, cx: 0, cy: RISE.mid, ch: 0 }; riseCamera(0, r, true); return r; }
// the view: pulled back and tipped by how far east you are, looking ahead up the slope; it eases, never snaps
function riseCamera(dt, r = state.rise, snap) {
  if (!r) return;
  const h = state.hero, x = h.x / UNIT, y = h.y / UNIT, p = riseView(x), e = snap ? 1 : 1 - Math.exp(-2.5 * dt);
  r.p += (p - r.p) * e; r.cx += (x + riseLead(p) - r.cx) * e; r.cy += (y + (RISE.mid - y) * p - RISE.lift * p - r.cy) * e; r.ch += (riseH(x, y) - r.ch) * e;
}
// a point of the scene (in its pixels) on the screen: toScreen uses this on the rise, so speech and hints sit right
const riseToScreen = (x, y) => riseProj(x / UNIT, y / UNIT, riseH(x / UNIT, y / UNIT));

function drawRise() {
  const r = state.rise; if (!r) return;
  const land = riseLand(), s = riseZoom(r.p), th = RISE.tilt * r.p, ct = Math.cos(th), st = Math.sin(th), us = UNIT * s;
  const sy = (y, z) => H / 2 + ((y - r.cy) * ct - (z - r.ch) * st) * us, sxOf = x => W / 2 + (x - r.cx) * us;
  // the sky and a far range, seen only once the view tips up past the land's far edge
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9cc6e4'); g.addColorStop(1, '#e8e2c8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const hz = sy(RISE.Y0, 0);
  if (hz > 0) { ctx.fillStyle = '#a9b4c4'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hz - UNIT * (1.2 + 2.4 * Math.abs(Math.sin(x * 0.004 + 1)) + 0.5 * Math.sin(x * 0.013))); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); }
  const i0 = Math.max(0, Math.floor(r.cx - W / 2 / us - 2 - RISE.X0)), i1 = Math.min(land.xs.length - 1, Math.ceil(r.cx + W / 2 / us + 2 - RISE.X0));
  const idx = []; for (let i = i0; i < i1; i++) idx.push(i); idx.push(i1);   // (every tile, always: a stride that shifted with the camera made the ground's edges shimmer)
  // everything standing, back to front by where it touches the ground (in tiles, at its lowest edge: the ground laid
  // after it is all in front of it), drawn with the game's own code
  // at its spot on the tipped ground, scaled with the view; the ground's rows are laid between them
  const [VW, VH] = sceneSize(state.scene), SWH = [W, H];
  const at = (px, py, fn, m = 4) => { const xt = px / UNIT, yt = py / UNIT, X = sxOf(xt), Y = sy(yt, riseH(xt, yt)); if (X < -us * m || X > SWH[0] + us * m || Y < -us * (m + 1) || Y > SWH[1] + us * (m + 1)) return; ctx.save(); ctx.translate(X, Y); ctx.scale(s, s); ctx.translate(-px, -py); [W, H] = [VW, VH]; try { fn(); } finally { [W, H] = SWH; ctx.restore(); } };
  const one = (key, o, fn) => { const all = state[key]; state[key] = [o]; try { fn(); } finally { state[key] = all; } };   // the game's draw for a list, for one of them
  const list = [];
  for (const p of land.deco) list.push([p.by, () => drawRiseProp(p, sxOf, sy, us, s)]);
  const sc = sceneDef(), h = state.hero;
  for (const o of state.solids) {
    if (o.rise === 'tree' || o.kind === 'reeds') list.push([o.y / UNIT + (o.kind === 'reeds' ? o.r / UNIT + 0.2 : 0.3), () => at(o.x, o.y, () => o.kind === 'reeds' ? drawSolid(o) : drawTree(o))]);
    else if (o.rise) list.push([o.y / UNIT + o.rr * 0.9, () => drawRiseProp({ k: o.rise, x: o.x / UNIT, y: o.y / UNIT, r: o.rr, seed: o.seed }, sxOf, sy, us, s)]);
  }
  for (const it of state.items) list.push([it.y / UNIT + 0.4, () => at(it.x, it.y, () => one('items', it, drawItems))]);
  for (const e of state.enemies) list.push([e.y / UNIT + e.r / UNIT + 0.1, () => at(e.x, e.y, () => drawEnemy(e))]);
  for (const [fx, fy] of sc.feat.plants || []) { const px = fx * VW, py = fy * VH; list.push([fy * RISE.D + 0.1, () => at(px, py, () => drawGustGrass(px, py, sc))]); }   // the tall grass, the wind's gauge
  if (pipDrawn(sc)) list.push([state.pip.y / UNIT + 0.55, () => at(state.pip.x, state.pip.y, drawPipNow)]);
  list.push([h.y / UNIT + 0.6, () => at(h.x, h.y, drawHero)]);
  for (const sh of state.shots) list.push([sh.y / UNIT + 0.4, () => at(sh.x, sh.y, () => one('shots', sh, drawShots))]);
  list.sort((a, b) => a[0] - b[0]);
  let li = 0;
  for (const row of riseRows(land)) {
    const yT = row.y, yB = row.y2;
    if (!row.grad) { row.grad = ctx.createLinearGradient(RISE.X0, 0, RISE.X1, 0); row.cols.forEach((c, i) => { if (i % 2 === 0 || i === row.cols.length - 1) row.grad.addColorStop(i / (land.xs.length - 1), c); }); }   // a stop every other tile is plenty
    let lo = Infinity, hi = -Infinity; const tp = idx.map(i => { const v = sy(yT, row.top[i]); lo = Math.min(lo, v); hi = Math.max(hi, v); return v; });
    const bp = idx.map(i => sy(yB, row.bot[i]) + 1);                                    // (a pixel of overlap: no seams)
    if (!(hi < -UNIT * 4 || Math.min(...bp) > H + UNIT * 4 && lo > H)) {
      ctx.save(); ctx.translate(W / 2 - r.cx * us, 0); ctx.scale(us, 1);                // x in tiles, y in pixels: the row's colours are a gradient along x
      ctx.beginPath(); idx.forEach((i, j) => j ? ctx.lineTo(land.xs[i], tp[j]) : ctx.moveTo(land.xs[i], tp[j])); for (let j = idx.length - 1; j >= 0; j--) ctx.lineTo(land.xs[idx[j]], bp[j]); ctx.closePath();
      ctx.fillStyle = row.grad; ctx.fill(); ctx.restore();
    }
    while (li < list.length && list[li][0] < yB) list[li++][1]();
  }
  while (li < list.length) list[li++][1]();
  // things in the air and on top: cloud shadows on the ground, gas, sparks and dust, each where it is
  for (const c of state.clouds) at(c.x, c.y, () => { const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r); g.addColorStop(0, `rgba(20,25,35,${0.12 + (sc.depth || 0) * 0.02})`); g.addColorStop(1, 'rgba(20,25,35,0)'); ctx.fillStyle = g; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2); }, c.r / UNIT + 1);
  for (const gp of state.gas) at(gp.x, gp.y, () => one('gas', gp, () => { drawGas(false); drawGas(true); }));
  for (const fp of state.fx) at(fp.x, fp.y, () => one('fx', fp, drawFx));
  if (state.settings.tiles) drawRiseTiles(r, sxOf, sy);
}
function drawRiseProp(p, sxOf, sy, us, s) {
  const x = sxOf(p.x), y = sy(p.y, riseH(p.x, p.y));
  if (x < -us * 3 || x > W + us * 3 || y < -us * 3 || y > H + us * 4) return;
  if (p.k === 'tuft') { ctx.strokeStyle = '#7f8f5a'; ctx.lineWidth = Math.max(1, 1.5 * s); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 3 * s, y); ctx.lineTo(x + (i * 4 + Math.sin(state.time * 2 + p.seed) * 2) * s, y - us * 0.35); ctx.stroke(); } }
  else if (p.k === 'boulder') drawSolid({ kind: 'boulder', x, y, vis: p.r * us, flip: p.seed > 4.5 });
  else if (p.k === 'crag') {                                                          // a picture drawn once at full size, scaled with the view: steady, and cheap
    const sp = riseCragSprite(Math.floor(p.seed * 16 / 9)), k = p.r / RISE_CRAG_R * s;
    if (sp) ctx.drawImage(sp.cv, x - sp.ox * k, y - sp.oy * k, sp.cv.width * k, sp.cv.height * k);
    else { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); paintRiseCrag(ctx, Math.floor(p.seed * 16 / 9)); ctx.restore(); }
  }
  else if (p.k === 'tree') { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawTree({ x: 0, y: 0, vis: UNIT * p.r, v: p.v, kind: 'tree', pal: 'green', key: 'rise' + p.x.toFixed(1) }); ctx.restore(); }
}
// the crags: sixteen shapes, each painted once (per size of screen) at the biggest size one ever draws, then scaled
const RISE_CRAG_R = 1.6, RISE_CRAGS = {};
function paintRiseCrag(g, v) {                                                       // origin at the foot of the stone
  const rs = RISE_CRAG_R * UNIT, amp = Math.max(2, rs * 0.15), soil = soilLinePts(0, rs * 0.2, rs * 2.2, amp, v * 3.7), [ax, ay] = soil[0], [bx, by] = soil[soil.length - 1];
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(rs * 0.15, rs * 0.3, rs, rs * 0.45, 0, 0, 6.28); g.fill();
  g.save(); g.beginPath(); g.moveTo(ax - rs * 2, -rs * 3); g.lineTo(ax - rs * 2, ay); soil.forEach(([sx, sy]) => g.lineTo(sx, sy)); g.lineTo(bx + rs * 2, by); g.lineTo(bx + rs * 2, -rs * 3); g.closePath(); g.clip();   // sunk: nothing of the stone below its soil line
  drawJagged(0, -rs * 0.4, rs, v * 13.1 + 2.3, ['#86827a', '#9a968c', '#6e6a62'], null, g); g.restore();
  drawSoilLine(0, rs * 0.2, rs * 2.2, amp, v * 3.7, g);
}
function riseCragSprite(v) {
  const key = v + ':' + Math.round(UNIT);
  if (key in RISE_CRAGS) return RISE_CRAGS[key];
  let sp = null;
  try { const rs = RISE_CRAG_R * UNIT, cv = document.createElement('canvas'); cv.width = Math.ceil(rs * 4.6); cv.height = Math.ceil(rs * 2.4); const g = cv.getContext && cv.getContext('2d');
    if (g && g.fillRect) { g.translate(rs * 2.3, rs * 1.6); paintRiseCrag(g, v); sp = { cv, ox: rs * 2.3, oy: rs * 1.6 }; } } catch (e) { sp = null; }
  return (RISE_CRAGS[key] = sp);
}
// System > Show tiles: the grid laid on the ground, tipped and shrunk with the view; red where a solid stands
function drawRiseTiles(r, sxOf, sy) {
  ctx.save(); ctx.lineWidth = 1;
  const h = state.hero, hx = h.x / UNIT, hyT = h.y / UNIT, x0 = Math.floor(hx - 14), x1 = Math.ceil(hx + 14);
  for (let y = 0; y < RISE.D; y++) for (let x = Math.max(0, x0); x < Math.min(RISE.len, x1); x++) {
    const pt = (a, b) => [sxOf(a), sy(b, riseH(a, b))], c = [pt(x, y), pt(x + 1, y), pt(x + 1, y + 1), pt(x, y + 1)];
    ctx.beginPath(); c.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
    const me = Math.floor(hx) === x && Math.floor(hyT) === y, cx = (x + 0.5) * UNIT, cy = (y + 0.5) * UNIT;
    if (me || state.solids.some(o => Math.hypot(o.x - cx, o.y - cy) < o.r)) { ctx.fillStyle = me ? 'rgba(255,220,90,.35)' : 'rgba(220,70,60,.22)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
  }
  ctx.restore();
}
