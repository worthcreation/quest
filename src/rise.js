// ===== rise.js: the rise. One long screen where the windy fields climb to the mountain's foot, laid out in tiles.
// It opens looking straight down, like the fields. Walk east and the view pulls back and tips up, so the grade shows
// (the contour lines bunch, the far edge rises into a skyline) and the mountain stands up ahead; walk back west and it
// comes in again. The camera follows only how far east you are. Like the climb it runs its own update and drawing, but it
// walks at the fields' speed and is drawn with the game's own stones and trees.
// Not joined to the map yet: ?scene=rise, or System > Testing. For now it loops: walk off either end and you come back
// in at the other, still walking the same way.

const RISE = { len: 86, flat: 0, grade: 0.0018, band: [8, 22], tilt: 0.95, lead: 6, lift: 4.5, X0: -16, X1: 124, Y0: -6, Y1: 72 };
const riseClamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const riseFoot = y => 74 + Math.sin(y * 0.35) * 2.5 + Math.sin(y * 0.9) * 0.8;       // where the mountain's stone begins
const risePathY = x => 15 + Math.sin(x * 0.13) * 2;                                   // the worn path, west to east
const riseInPass = (x, y) => x > riseFoot(y) - 2 && Math.abs(y - risePathY(x)) < 1.5; // the notch the path takes into the rock
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
// where you can stand: the one shape the game tests (the crags along the foot and the pass are drawn on its edge)
const riseOpen = (x, y) => y > RISE.band[0] + 0.6 && y < RISE.band[1] - 0.6 && (x < riseFoot(y) - 0.4 || riseInPass(x, y));

function riseColor(x, y) {
  const h = riseH(x, y), gx = riseH(x + 0.3, y) - riseH(x - 0.3, y), gy = riseH(x, y + 0.3) - riseH(x, y - 0.3);
  const lit = riseClamp(0.35 * gx / 0.6 - 0.2 * gy / 0.6, -0.8, 0.8) * (0.4 + 0.6 * riseClamp((h - 3) / 6));   // faces turned to the light (west) catch it
  const base = parseInt((WORLD.f7 ? WORLD.f7.floor : '#707a69').slice(1), 16), k = riseClamp((h - 5) / 6);    // the fields' grass, going over to stony turf, then stone
  let c = [base >> 16, (base >> 8) & 255, base & 255].map((v, i) => v + ([132, 130, 118][i] - v) * k);
  const d = Math.abs(y - risePathY(x));
  if (d < 0.75 && x > RISE.X0) { const w = (1 - d / 0.75) * 0.75; c = c.map((v, i) => v + ([150, 132, 98][i] - v) * w); }
  return 'rgb(' + c.map(v => Math.round(riseClamp(v + lit * 30, 0, 255))).join(',') + ')';
}

// the land, laid out once in tiles: rows of heights and colours, the contour lines, and everything standing on it
let RISE_LAND = null;
function riseLand() {
  if (RISE_LAND) return RISE_LAND;
  const { X0, X1, Y0, Y1 } = RISE, xs = []; for (let x = X0; x <= X1; x++) xs.push(x);
  const rows = []; let y = Y0;
  while (y < Y1) {
    const st = y >= RISE.band[0] - 1 && y < RISE.band[1] + 1 ? 0.25 : 0.5, y2 = y + st, ym = y + st / 2;   // finer rows where you walk
    const lv = [];                                                                                      // contour crossings: [level, x at y, x at y2]
    const cross = (L, yy) => { let a = RISE.flat, b = null; for (let x = RISE.flat; x < riseFoot(yy) + 3; x += 0.5) { if (riseH(x, yy) >= L) { b = x; break; } a = x; } if (b === null) return null; for (let i = 0; i < 14; i++) { const m = (a + b) / 2; if (riseH(m, yy) >= L) b = m; else a = m; } return b; };
    for (let L = 0.8; L < 12.8; L += 0.8) { const a = cross(L, y), b = cross(L, y2); if (a !== null && b !== null) lv.push([L, a, b]); }
    rows.push({ y, y2, top: xs.map(x => riseH(x, y)), bot: xs.map(x => riseH(x, y2)), cols: xs.map(x => riseColor(x, ym)), lv, grad: null });
    y = y2;
  }
  let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const props = [], put = (k, x, y, r, solid) => props.push({ k, x, y, r, solid, seed: rnd() * 9, v: Math.floor(rnd() * 3), by: y + (k === 'tuft' ? 0.1 : k === 'tree' ? 0.3 : r * 0.9) });
  const clearOf = (x, y, r) => !props.some(p => p.solid && Math.hypot(p.x - x, p.y - y) < p.r + r + 0.2);
  // the walls of the way: a line of stones along each side, smooth by the fields, rough as the ground rises
  for (const wy of RISE.band) for (let x = X0; x < riseFoot(wy) + 1; x += 1.25) { const r = 0.55 + rnd() * 0.35; put(x > 40 ? 'crag' : 'boulder', x + rnd() * 0.4, wy + (rnd() - 0.5) * 0.5, r, true); }
  // the mountain's foot and the pass: crags on the line you can't cross
  for (let y = Y0; y < Y1; y += 1.1) { const f = riseFoot(y); if (Math.abs(y - risePathY(f)) < 1.7) continue; put('crag', f + 0.3 + rnd() * 0.4, y, 0.9 + rnd() * 0.6, true); }
  for (let x = riseFoot(risePathY(76)) - 1; x < RISE.len + 4; x += 1.2) for (const sd of [-1, 1]) { const r = 0.5 + rnd() * 0.35, y = risePathY(x) + sd * (1.6 + r); if (x > riseFoot(y) - 0.5 && clearOf(x, y, r * 0.5)) put('crag', x, y, r, true); }
  for (let i = 0; i < 110; i++) { const y = Y0 + rnd() * (Y1 - Y0), x = riseFoot(y) + 1 + rnd() * 40, r = 0.7 + rnd() * 0.8; if (Math.abs(y - risePathY(x)) < 3.5 + r || !clearOf(x, y, r * 0.6)) continue; put('crag', x, y, r, true); }
  // on the way: a few stones and trees (never on the path), grass tufts everywhere green
  for (let i = 0; i < 60; i++) { const x = X0 + rnd() * (riseFoot(15) - X0 - 4), y = Y0 + rnd() * (Y1 - Y0), r = 0.45 + rnd() * 0.5; if (Math.abs(y - risePathY(x)) < 2.2 || !clearOf(x, y, r)) continue; put(x > 36 ? 'crag' : 'boulder', x, y, r, true); }
  for (let i = 0; i < 18; i++) { const x = X0 + rnd() * (70 - X0), y = Y0 + rnd() * (Y1 - Y0); if (Math.abs(y - risePathY(x)) < 2.4 || !clearOf(x, y, 0.4)) continue; put('tree', x, y, 0.35, true); }
  for (let i = 0; i < 420; i++) { const x = X0 + rnd() * (X1 - X0), y = Y0 + rnd() * (Y1 - Y0); if (x < riseFoot(y) - 1 && riseH(x, y) < 9) put('tuft', x, y, 0.3, false); }
  props.sort((a, b) => a.by - b.by);
  return (RISE_LAND = { xs, rows, props, solids: props.filter(p => p.solid) });
}

function newRise(fx) {
  const land = riseLand(), east = fx != null && fx > 0.5, x = east ? RISE.len - 1.2 : 1.2, y = risePathY(x);
  const r = { x, y, vx: 0, vy: 0, land };
  const p = riseView(x); Object.assign(r, { p, cx: x + riseLead(p), cy: y + (15 - y) * p - RISE.lift * p, ch: riseH(x, y) });
  return r;
}
// how far along the change you are (0 = looking straight down, 1 = pulled back and tipped at the foot)
const riseView = x => riseClamp((x - 1) / (RISE.len - 10));                        // evenly, from the first step to the foot: no late rush
const riseZoom = p => 1 - (1 - riseZoomMin()) * p;
const riseLead = p => Math.min(RISE.lead, 0.3 * W / 2 / (UNIT * riseZoom(p))) * p;   // how far ahead of you the view looks (less on a narrow screen)
function riseProj(x, y, z, r = state.rise) {
  const s = riseZoom(r.p), th = RISE.tilt * r.p;
  return [W / 2 + (x - r.cx) * UNIT * s, H / 2 + ((y - r.cy) * Math.cos(th) - (z - r.ch) * Math.sin(th)) * UNIT * s];
}

function updateRise(dt) {
  const r = state.rise; if (!r) return;
  if (testHops()) return;
  updateFx(dt); state.playTime += dt;
  const sc = sceneDef(), h = state.hero, still = state.busy || state.npcTalk || state.choice;
  const v = still ? { x: 0, y: 0 } : inputVector();
  if (v.x || v.y) { h.fx = v.x; h.fy = v.y; if (Math.abs(v.x) > 0.3) h.side = Math.sign(v.x); }
  const up = riseH(r.x + 0.5, r.y) - riseH(r.x - 0.5, r.y);                            // the grade under you (tiles up per tile east)
  const sp = sc.speed * L() / UNIT * (1 - Math.min(0.3, Math.max(0, up * v.x) * 0.6));  // the fields' pace, a touch slower uphill
  const k = 1 - Math.exp(-sc.accel * dt);
  r.vx += (v.x * sp - r.vx) * k; r.vy += (v.y * sp - r.vy) * k;
  const R0 = 0.42, nx = r.x + r.vx * dt, ny = r.y + r.vy * dt;
  if (riseOpen(nx, r.y) || nx < 0 || nx > RISE.len) r.x = nx; else r.vx = 0;           // slide along the edge you can't cross
  if (riseOpen(r.x, ny)) r.y = ny; else r.vy = 0;
  for (const p of r.land.solids) { const dx = r.x - p.x, dy = r.y - p.y, d = Math.hypot(dx, dy) || 0.001, mn = p.r + R0; if (d < mn) { const tx = p.x + dx / d * mn, ty = p.y + dy / d * mn; if (riseOpen(tx, ty)) { r.x = tx; r.y = ty; } } }
  if (!still && r.x < 0.2 && v.x < 0) { transitionTo('rise', 0.9, 0.5, true); return; }          // it loops: off the bottom, back in at the top
  if (!still && r.x > RISE.len - 0.2 && v.x > 0) { transitionTo('rise', 0.1, 0.5, true); return; }  // and off the top, back in at the bottom
  r.x = riseClamp(r.x, 0, RISE.len);
  // the view: pulled back and tipped by how far east you are, looking ahead up the slope; it eases, never snaps
  const p = riseView(r.x), e = 1 - Math.exp(-2.5 * dt);
  r.p += (p - r.p) * e; r.cx += (r.x + riseLead(p) - r.cx) * e; r.cy += (r.y + (15 - r.y) * p - RISE.lift * p - r.cy) * e; r.ch += (riseH(r.x, r.y) - r.ch) * e;
  const [sx, sy] = riseProj(r.x, r.y, riseH(r.x, r.y));                                 // the hero's place on screen, for speech and hints
  h.x = sx; h.y = sy - UNIT * riseZoom(r.p) * 0.5; h.vx = r.vx; h.vy = r.vy; h.z = 0;
}

function drawRise() {
  const r = state.rise; if (!r) return;
  const land = r.land, s = riseZoom(r.p), th = RISE.tilt * r.p, ct = Math.cos(th), st = Math.sin(th), us = UNIT * s;
  const sy = (y, z) => H / 2 + ((y - r.cy) * ct - (z - r.ch) * st) * us, sxOf = x => W / 2 + (x - r.cx) * us;
  // the sky and a far range, seen only once the view tips up past the land's far edge
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9cc6e4'); g.addColorStop(1, '#e8e2c8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const hz = sy(RISE.Y0, 0);
  if (hz > 0) { ctx.fillStyle = '#a9b4c4'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hz - UNIT * (1.2 + 2.4 * Math.abs(Math.sin(x * 0.004 + 1)) + 0.5 * Math.sin(x * 0.013))); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); }
  const i0 = Math.max(0, Math.floor(r.cx - W / 2 / us - 2 - RISE.X0)), i1 = Math.min(land.xs.length - 1, Math.ceil(r.cx + W / 2 / us + 2 - RISE.X0)), step = s > 0.75 ? 1 : 2;
  const idx = []; for (let i = i0; i < i1; i += step) idx.push(i); idx.push(i1);
  const h = state.hero; let pi = 0, heroDone = false;
  const drawHeroHere = () => {
    heroDone = true; const [px, py] = riseProj(r.x, r.y, riseH(r.x, r.y));
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(px + 2 * s, py, us * 0.55, us * 0.2, 0, 0, 6.28); ctx.fill();
    ctx.save(); ctx.translate(px, py - us * 0.45); ctx.scale(s, s); const ox = h.x; h.x = 0; drawHeroBody(h, UNIT, UNIT, 0, 1); h.x = ox; ctx.restore();   // the hero as drawn everywhere else, scaled with the view
  };
  const haze = y => Math.min(0.75, riseClamp((r.cy - y - 4) / 30, 0, 0.4) + riseClamp((RISE.Y0 + 6 - y) / 6) * 0.6) * r.p;
  for (const row of land.rows) {
    const yT = row.y, yB = row.y2;
    if (!row.grad) { row.grad = ctx.createLinearGradient(RISE.X0, 0, RISE.X1, 0); row.cols.forEach((c, i) => { if (i % 2 === 0 || i === row.cols.length - 1) row.grad.addColorStop(i / (land.xs.length - 1), c); }); }   // a stop every other tile is plenty
    let lo = Infinity, hi = -Infinity; const tp = idx.map(i => { const v = sy(yT, row.top[i]); lo = Math.min(lo, v); hi = Math.max(hi, v); return v; });
    const bp = idx.map(i => sy(yB, row.bot[i]) + 1);                                    // (a pixel of overlap: no seams)
    if (!(hi < -UNIT * 4 || Math.min(...bp) > H + UNIT * 4 && lo > H)) {
      ctx.save(); ctx.translate(W / 2 - r.cx * us, 0); ctx.scale(us, 1);                // x in tiles, y in pixels: the row's colours are a gradient along x
      ctx.beginPath(); idx.forEach((i, j) => j ? ctx.lineTo(land.xs[i], tp[j]) : ctx.moveTo(land.xs[i], tp[j])); for (let j = idx.length - 1; j >= 0; j--) ctx.lineTo(land.xs[idx[j]], bp[j]); ctx.closePath();
      ctx.fillStyle = row.grad; ctx.fill();
      const a = haze((yT + yB) / 2); if (a > 0.01) { ctx.fillStyle = `rgba(200,210,222,${a.toFixed(3)})`; ctx.fill(); }   // distance: the far land fades into the sky
      ctx.restore();
      if (row.lv.length) {                                                              // the contour lines: where they bunch, the ground climbs faster
        ctx.lineWidth = Math.max(1, 2 * s); ctx.lineCap = 'round';
        for (const hiL of [false, true]) {                                               // two strokes a row: the low lines, and the fainter high ones
          ctx.beginPath(); let any = false;
          for (const [Lv, xa, xb] of row.lv) if ((Lv >= 8) === hiL) { any = true; ctx.moveTo(sxOf(xa), sy(yT, Lv)); ctx.lineTo(sxOf(xb), sy(yB, Lv)); }
          if (any) { ctx.strokeStyle = hiL ? 'rgba(70,92,44,.2)' : 'rgba(70,92,44,.45)'; ctx.stroke(); }
        }
        ctx.lineCap = 'butt';
      }
    }
    while (pi < land.props.length && land.props[pi].by < yB) drawRiseProp(land.props[pi++], sxOf, sy, us, s);
    if (!heroDone && r.y + 0.45 < yB) drawHeroHere();
  }
  while (pi < land.props.length) drawRiseProp(land.props[pi++], sxOf, sy, us, s);
  if (!heroDone) drawHeroHere();
  if (state.settings.tiles) drawRiseTiles(r, sxOf, sy);
  drawFx();
}
function drawRiseProp(p, sxOf, sy, us, s) {
  const x = sxOf(p.x), y = sy(p.y, riseH(p.x, p.y));
  if (x < -us * 3 || x > W + us * 3 || y < -us * 3 || y > H + us * 4) return;
  if (p.k === 'tuft') { ctx.strokeStyle = '#7f8f5a'; ctx.lineWidth = Math.max(1, 1.5 * s); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 3 * s, y); ctx.lineTo(x + (i * 4 + Math.sin(state.time * 2 + p.seed) * 2) * s, y - us * 0.35); ctx.stroke(); } }
  else if (p.k === 'boulder') drawSolid({ kind: 'boulder', x, y, vis: p.r * us, flip: p.seed > 4.5 });
  else if (p.k === 'crag') {                                                          // drawn at full size and scaled with the view, so the zigzag keeps its shape as you zoom
    const rs = p.r * UNIT, amp = Math.max(2, rs * 0.15), soil = soilLinePts(0, rs * 0.2, rs * 2.2, amp, p.x), [ax, ay] = soil[0], [bx, by] = soil[soil.length - 1];
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(rs * 0.15, rs * 0.3, rs, rs * 0.45, 0, 0, 6.28); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.moveTo(ax - rs * 2, -rs * 3); ctx.lineTo(ax - rs * 2, ay); soil.forEach(([sx, sy]) => ctx.lineTo(sx, sy)); ctx.lineTo(bx + rs * 2, by); ctx.lineTo(bx + rs * 2, -rs * 3); ctx.closePath(); ctx.clip();   // sunk: nothing of the stone below its soil line
    drawJagged(0, -rs * 0.4, rs, p.seed * 13 + p.x, ['#86827a', '#9a968c', '#6e6a62']); ctx.restore();
    drawSoilLine(0, rs * 0.2, rs * 2.2, amp, p.x); ctx.restore();
  }
  else if (p.k === 'tree') { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawTree({ x: 0, y: 0, vis: UNIT * 1.4, v: p.v, kind: 'tree', pal: 'green', key: 'rise' + p.x.toFixed(1) }); ctx.restore(); }
}
// System > Show tiles: the grid laid on the ground, tipped and shrunk with the view; red where you can't stand
function drawRiseTiles(r, sxOf, sy) {
  ctx.save(); ctx.lineWidth = 1;
  const x0 = Math.floor(r.x - 14), x1 = Math.ceil(r.x + 14);
  for (let y = RISE.band[0]; y <= RISE.band[1]; y++) for (let x = x0; x < x1; x++) {
    const pt = (a, b) => [sxOf(a), sy(b, riseH(a, b))], c = [pt(x, y), pt(x + 1, y), pt(x + 1, y + 1), pt(x, y + 1)];
    ctx.beginPath(); c.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
    const me = Math.floor(r.x) === x && Math.floor(r.y) === y;
    if (me || !riseOpen(x + 0.5, y + 0.5)) { ctx.fillStyle = me ? 'rgba(255,220,90,.35)' : 'rgba(220,70,60,.22)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
  }
  ctx.restore();
}
