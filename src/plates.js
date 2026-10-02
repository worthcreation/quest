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
// Kinds by thickness (plateKind): step up to 0.25, hop to 0.5, high hop to 1, face over 1. Until build 214 lays the
// ground in layers, every plate holds (plateHold: the foot ring is a wall, as the mountain is).

const PL_PX = 40, PL_N = 12, PL_TONE = 134, PL_MARGIN = 8;                                            // texture px per tile; outline points before the cutting; the first plate's grey
function plateRng(seed) { const R = mulberry32((Math.floor(seed * 7919) * 2654435761) >>> 0); return (a = 0, b = 1) => a + R() * (b - a); }
// a plate's outline in tiles: squarish (a superellipse), corners knocked, a jog or two; worn, not cut
function plateOutline(cx, cy, w, h, seed, n = PL_N) {
  const rnd = plateRng(seed), P = [], rot = rnd(-0.5, 0.5) * 0.35;
  for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rnd(-0.5, 0.5) * 0.25, ex = Math.cos(a), ey = Math.sin(a), rr = Math.pow(Math.pow(Math.abs(ex), 4) + Math.pow(Math.abs(ey), 4), -1 / 4), j = rnd(0.86, 1.1), px = ex * rr * w / 2 * j, py = ey * rr * h / 2 * j; P.push([cx + px * Math.cos(rot) - py * Math.sin(rot) * 0.5, cy + py * Math.cos(rot) + px * Math.sin(rot) * 0.5]); }
  let Q = P; for (let r = 0; r < 2; r++) { const R = []; for (let k = 0; k < Q.length; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % Q.length]; R.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } Q = R; }
  return Q.map(([x, y]) => [x + rnd(-0.5, 0.5) * 0.12, y + rnd(-0.5, 0.5) * 0.08]);
}
const plateIn = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const plateHas = (p, x, y) => plateIn(p.P, x, y);                                       // the one shape: inside this plate's outline (and so on it, or held off its face)
const plateKind = thick => thick <= 0.25 ? 'step' : thick <= 0.5 ? 'hop' : thick <= 1 ? 'high' : 'face';
const plateTop = p => p.base + p.thick;
const plateBox = P => { const xs = P.map(q => q[0]), ys = P.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
// a stack: a foot plate and the ones on it, each on the top of the one under, shifted along the lean and a little
// smaller, as thick as kinds says; the plates are listed foot first (draw order needs the one under drawn first)
function plateStack(pl, x0, y0, w0, h0, lean, kinds, seed, tone = PL_TONE) {
  let base = 0, x = x0, y = y0, w = w0, h = h0, under = null;
  kinds.forEach((thick, i) => { const p = { x, y, w, h, seed: seed + i * 1.3, base, thick, tone: tone + i * 2, under, P: plateOutline(x, y, w, h, seed + i * 1.3) }; pl.list.push(p); under = p; base += thick; x += lean[0]; y += lean[1]; w = Math.max(3, w - 0.45); h = Math.max(2.2, h - 0.28); });
}
const platePit = (pl, x, y, w, h, seed, floor) => pl.pits.push({ x, y, floor, P: plateOutline(x, y, w, h, seed, 9) });
const plateSeam = (pl, spine) => pl.seams.push({ spine });                                // [[x, y, halfwidth]...] in tiles, hw under 0.25
// what a screen laid, worked out once: every plate's draw key (its foot's south edge, never before the one it stands
// on), each pit's cut plates (the ones containing its middle from its floor up), its floor and its top lip
function platesLay(m) {
  if (m.pl) return m.pl;
  const pl = { list: [], pits: [], seams: [], tone: m.plateTone || 143 }; m.plates(pl);
  for (const p of pl.list) { p.box = plateBox(p.P); p.key = Math.max(p.box[3], p.under ? p.under.key + 1e-3 : -Infinity); p.kind = plateKind(p.thick); }
  for (const q of pl.pits) { q.cut = pl.list.filter(p => plateHas(p, q.x, q.y) && p.base >= q.floor - 0.01 && plateTop(p) > q.floor + 0.01); q.top = q.cut.length ? Math.max(...q.cut.map(plateTop)) : q.floor; q.last = q.cut.reduce((a, p) => !a || p.key > a.key ? p : a, null); q.box = plateBox(q.P); }
  return (m.pl = pl);
}
const pitHas = (q, p, x, y) => q.cut.includes(p) && plateIn(q.P, x, y);
// the ground's height in tiles above the base at a point: the top of the highest plate there, less the pits (0 off every plate)
function plateTopAt(pl, x, y) { let h = 0; for (const p of pl.list) if (plateHas(p, x, y) && !pl.pits.some(q => pitHas(q, p, x, y))) h = Math.max(h, plateTop(p)); for (const q of pl.pits) if (plateIn(q.P, x, y) && q.cut.length && h >= q.top - 1e-6) h = q.floor; return h; }
// held off every plate (build 212, until 214 lays the ground in layers): inside a foot plate's outline you're put
// back just outside its nearest edge, as the mountain holds
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
function plCut(R, rings) { plPath(R); for (const Q of rings) Q.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.clip('evenodd'); }   // a top, less the pit rings through it
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
// one plate on the screen: its faces, its top (cut by any pit through it) with the seams across it, its brink and
// lip; then, if it is the last plate a pit cuts, the pit itself
function drawPlate(m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top)), F = p.P.map(([x, y]) => pr(x, y, p.base));
  if (!plOn(T, us * 2) && !plOn(F, us * 2)) return;
  const cuts = pl.pits.filter(q => q.cut.includes(p)), rings = cuts.map(q => q.P.map(([x, y]) => pr(x, y, top)));
  platePaintFaces(T, F, p.thick, p.tone, p.seed, s);
  ctx.save(); plCut(T, rings);
  const tex = plateTex(p, m); if (tex) plateLay(tex, p, p.box[0], p.box[1], p.box[2], p.box[3], pr, top); else { ctx.fillStyle = plRgb(p.tone); ctx.fillRect(-W, -H, W * 3, H * 3); }
  for (const sm of pl.seams) platePaintSeam(sm, top, null, cuts, pr, us);
  platePaintBrink(T, us); platePaintLip(T, s);
  ctx.restore();
  for (const q of cuts) if (q.last === p) drawPit(q, pr, s);
}
// a pit, after the last plate it cuts: a shade over it, its floor darkest at the far foot, then one wall from the
// floor to the top lip (the ring turned inward) with a line where each cut plate meets the next, lit by its own
// shade whatever it faces; the brink and lip inside; nothing of it outside its lip
function drawPit(q, pr, s) {
  const us = UNIT * s, R = q.P.map(([x, y]) => pr(x, y, q.top)), Fp = q.P.map(([x, y]) => pr(x, y, q.floor)), cx0 = Fp.reduce((t, a) => t + a[0], 0) / Fp.length, cy0 = Fp.reduce((t, a) => t + a[1], 0) / Fp.length;
  ctx.save(); plPath(R); ctx.clip();
  ctx.fillStyle = 'rgba(20,22,20,.2)'; ctx.fillRect(-W, -H, W * 3, H * 3);
  const g = ctx.createRadialGradient(cx0, cy0 + 7, 0, cx0, cy0, 2.2 * us); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
  platePaintFaces(R.slice().reverse(), Fp.slice().reverse(), q.top - q.floor, 122, q.x * 13 + q.y * 7, s, q.cut.map(p => plateTop(p) - q.floor), true);
  ctx.restore();
  platePaintBrink(R, us); platePaintLip(R, s);
}
// System > Show tiles on a plates screen: the tiles lightened by the ground's height there (a pit is dark again)
function drawPlateTiles(m, pr) {
  const pl = platesLay(m), h = state.hero, hx = h.x / UNIT, x0 = Math.max(0, Math.floor(hx - 14)), x1 = Math.min(m.len, Math.ceil(hx + 14));
  for (let y = 0; y < m.D; y++) for (let x = x0; x < x1; x++) { const z = plateTopAt(pl, x + 0.5, y + 0.5); if (z <= 0) continue; const c = [pr(x, y, z), pr(x + 1, y, z), pr(x + 1, y + 1, z), pr(x, y + 1, z)]; plPath(c); ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, 0.12 + z * 0.1).toFixed(2) + ')'; ctx.fill(); }
}
