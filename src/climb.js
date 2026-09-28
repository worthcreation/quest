// ===== climb.js: the mountain climb, a new kind of screen, in several takes. Most are "trail" screens: a still camera
// looks down a winding chasm, you climb the green slopes from far (small) to near (big), jumping the chasm where it's
// narrow enough (or hopping islands), while the wind shoves you back and toward the edge. One is a side view. They run
// in a chain: climb1 > climb2 > ... > climb5, then out into the crags. (System > Testing > Try the climb.)

// ?mountain in the link starts straight on the climb (no creator, no opening). ?scene=f3 (any screen id) starts there.
var MOUNTAIN = typeof location !== 'undefined' && /(^|[?&])mountain(=|&|$)/.test(location.search);
var START_SCENE = typeof location !== 'undefined' ? ((/[?&]scene=([a-z0-9]+)/.exec(location.search) || [])[1] || null) : null;
function startTestScene(id) {                                  // set up enough of the story that a mid-game screen makes sense
  const inv = state.inv; inv.story = STORY.adventure; inv.tortoise = true; inv.sword = true; inv.acorns = 10; (inv.pipTips = inv.pipTips || {}).tada = true;
  state.intro = null; state.cut = null; state.pip = null; state.climbReturn = id; enterScene(id);
  showScroll('Test link', MOUNTAIN ? 'The climb. Keys 1 to 5 jump between the five climb screens; 0 goes to the first field.' : `Started on ${id}.`);
}
// the shadow's aim, to tune: lead (how far toward the landing it goes), arrive (when in the jump it gets there),
// follow (how quickly it chases; lower = lazier, smoother). On the ?mountain link: [ and ] change lead, - and = follow.
const SHADOW = { lead: 0.55, arrive: 0.9, follow: 7 };
const tri = (z, p, o) => { const t = (z + o) / p, k = t - Math.floor(t), v = 2 * Math.abs(k - 0.5) * 2 - 1; return 0.6 * v + 0.4 * v * v * v; };
// A zigzag of crossings: crossings [[z, 'R' or 'L'], ...] from far to near. Near each one the ravine narrows enough to
// jump; just past it, crags close the side you came along (you must cross). Between, the walkable ledges wind.
function zig(cross, wide = 1.9, narrow = 0.55) {
  const hw = z => { let w = wide; for (const [cz] of cross) { const k = Math.max(0, 1 - Math.abs(z - cz) / 1.1); w = Math.min(w, wide - (wide - narrow) * k * k * (3 - 2 * k)); } return w; };
  const band = (z, side) => {                                        // how wide the walkable ledge is on that side ('L' / 'R')
    let b = 2.6 + 0.7 * Math.sin(z * 0.9 + (side === 'L' ? 1 : 2.4));
    for (const [cz, from] of cross) if (from === side) { const m = Math.min(1, Math.max(0, Math.min(z - (cz - 3.4), (cz - 0.7) - z) / 0.5)); b = b * (1 - m) + 0.15 * m; }   // closed by crags (ramping in and out): you have to cross
    return b;
  };
  return { hw, band };
}
const ZIG1 = zig([[15.5, 'R'], [10.5, 'L'], [6.8, 'R']]), ZIG3 = zig([[19, 'R'], [15.2, 'L'], [11.8, 'R'], [8.6, 'L'], [6.2, 'R']], 1.6, 0.5), ZIG4 = zig([[13, 'R'], [9.2, 'L'], [6.4, 'R']]);
const CLIMBS = {
  climb1: { name: 'The wind trail', kind: 'trail', cam: { f: 0.62, horizon: 0.26, camH: 3.4 }, cx: z => 2.6 * tri(z, 22, 6), hw: ZIG1.hw, band: ZIG1.band, start: [2.4, 18], goalZ: 4.6, next: 'climb2' },
  climb2: { name: 'Stepping stones', kind: 'trail', cam: { f: 0.62, horizon: 0.24, camH: 3.6 }, mirror: true, cx: z => 1.4 * tri(z, 30, 4), hw: z => 2.6, start: [3.6, 20], goalZ: 4.6, next: 'climb3',
            islands: [[1.3, 17.5, 1.0], [-0.2, 15.2, 1.0], [1.0, 12.8, 0.95], [-0.8, 10.3, 0.95], [0.6, 8.0, 0.95], [-0.9, 6.3, 0.95]] },   // [x from the centre line, z, radius]: a stepping path across and down
  climb3: { name: 'The broken meadow', kind: 'trail', cam: { f: 0.8, horizon: 0.1, camH: 7.5 }, cx: () => 0, hw: () => 0, start: [0, 21.5], goalZ: 4.8, goalAny: true, next: 'climb4',
            // rifts running across the way (their edges wander; one is wide except at a narrow place), chasms, and a short ravine
            gap: (x, z) => {
              for (const [z0, z1, ph, nx] of [[18.3, 19.6, 1.3, null], [13.6, 15.0, 0.9, null], [9.0, 11.4, 2.1, 1.6], [6.0, 7.2, 0.4, null]]) {
                let a = z0 + 0.3 * Math.sin(x * 0.9 + ph), b = z1 + 0.3 * Math.sin(x * 1.1 + ph * 2);
                if (nx != null) b -= 1.1 * Math.exp(-((x - nx) ** 2) / 1.5);                       // the wide one narrows here
                if (z > a && z < b) return true;
              }
              for (const [hx, hz, rx, rz] of [[-3.2, 16.5, 1.4, 0.9], [3.6, 12.2, 1.2, 0.75], [-3.9, 8.1, 1.5, 0.6]]) if (((x - hx) / rx) ** 2 + ((z - hz) / rz) ** 2 < 1) return true;
              if (z > 15.4 && z < 18.0) { const lx = 4.5 - (18 - z) * 0.9; if (Math.abs(x - lx) < 0.55) return true; }   // a short ravine running down at an angle
              return false;
            } },
  climb4: { name: 'The steep way', kind: 'trail', cam: { f: 0.9, horizon: 0.08, camH: 7.5 }, mirror: true, cx: z => 2.2 * tri(z, 16, 3), hw: ZIG4.hw, band: ZIG4.band, start: [2.6, 16], goalZ: 5.2, next: 'climb5' },
  climb5: { name: 'The last ledges', kind: 'side', next: 'peak1' },
};
const climbDef = () => CLIMBS[state.scene] || CLIMBS.climb1;
const climbCx = (z, d = climbDef()) => d.cx(z);
const climbHw = (z, d = climbDef()) => d.hw(z);
const climbSlopeY = dx => 1.5;                                                   // the ledges are level ground
const climbBand = (z, side, d = climbDef()) => 12;                                // (testing) the green runs out past the screen's sides: only the ravine is in the way
function climbProj(x, y, z, d = climbDef()) {
  const f = H * d.cam.f, sx = (x - d.cx(5.6)) * f / z;
  return [W / 2 + (d.mirror ? -sx : sx), H * d.cam.horizon + (d.cam.camH - y) * f / z];
}
const climbSide = (x, z) => x - climbCx(z);
const onClimbIsland = (x, z, d = climbDef()) => (d.islands || []).some(([ix, iz, r]) => Math.hypot(x - (d.cx(iz) + ix), z - iz) < r);   // round tops
const overChasm = (x, z) => { if (onClimbIsland(x, z)) return false; const dd = climbDef(); if (dd.gap) return dd.gap(x, z) || Math.abs(x) > 11; const s = climbSide(x, z), a = Math.abs(s); return a < climbHw(z) || a > climbHw(z) + climbBand(z, s < 0 ? 'L' : 'R'); };   // the ravine, or off a ledge's outer edge

function newClimb(id) {
  const d = CLIMBS[id] || CLIMBS.climb1;
  if (d.kind === 'side') return newSideClimb();
  setTimeout(climbTip, 400);
  return { kind: 'trail', x: d.cx(d.start[1]) + d.start[0], z: d.start[1], vx: 0, vz: 0, h: 0, vh: 0, air: false, fall: 0, safe: null,
    gust: { phase: 'calm', t: 2.5, dir: 1 }, done: false, bg: null, bgKey: '' };
}
function climbTip() { if (!(state.inv.pipTips || {})['climb-shadow']) { (state.inv.pipTips = state.inv.pipTips || {})['climb-shadow'] = true; showScroll('Pay attention to your shadow', 'In the air, it shows where you\'ll land.'); } }
function climbFinish(c) {
  const d = climbDef(); c.done = true; sfx.fanfare();
  showScroll(d.name, d.next === 'peak1' ? 'Over the top, and into the crags.' : 'Onward and upward.');
}
function testHops() {
  if (!MOUNTAIN && !START_SCENE) return false;
  const tap = k => { if (state.keys[k]) { state.keys[k] = false; return true; } return false; };
  if (tap('[')) SHADOW.lead = Math.max(0, SHADOW.lead - 0.05); if (tap(']')) SHADOW.lead = Math.min(1, SHADOW.lead + 0.05);
  if (tap('-')) SHADOW.follow = Math.max(1, SHADOW.follow - 1); if (tap('=')) SHADOW.follow = Math.min(30, SHADOW.follow + 1);
  const ids = ['climb1', 'climb2', 'climb3', 'climb4', 'climb5'];
  for (let i = 0; i <= 5; i++) { const k = String(i); if (state.keys[k]) { state.keys[k] = false; state.climb = null; enterScene(i ? ids[i - 1] : 'f1'); state.climbReturn = i ? ids[i - 1] : 'f1'; return true; } }   // (the key is used up on the spot)
  return false;
}
function updateClimb(dt) {
  const c = state.climb; if (!c) return;
  if (testHops()) return;
  if (c.done) { c.doneT = (c.doneT || 0) + dt; if (c.doneT > 1.8) { const d = climbDef(), nx = MOUNTAIN && d.next === 'peak1' ? 'climb1' : d.next; state.climb = null; if (nx === 'peak1') enterScene('peak1', 0.5, 0.85); else enterScene(nx || state.climbReturn || 'f1'); } return; }
  if (state.menu) return;
  if (c.kind === 'side') { updateSideClimb(c, dt); updateFx(dt); return; }
  const d = climbDef(), h = state.hero, g = c.gust; g.t -= dt;
  if (g.t <= 0) { if (g.phase === 'calm') { g.phase = 'warn'; g.t = 0.9; g.dir = Math.random() < 0.5 ? -1 : 1; sfx.rustle(); } else if (g.phase === 'warn') { g.phase = 'blow'; g.t = 1.6; } else { g.phase = 'calm'; g.t = 2 + Math.random() * 2.5; } }
  if (c.fall > 0) { c.fall += dt; if (c.fall > 0.9) { c.fall = 0; [c.x, c.z] = c.safe || [d.cx(d.start[1]) + d.start[0], d.start[1]]; c.h = 0; c.air = false; c.vx = c.vz = 0; hurtHero(1, 0, 0, { force: true }); } return; }
  const v = inputVector(), sp = 3.2, acc = c.air ? 6 : 12, mx = d.mirror ? -v.x : v.x;   // you can steer a little in the air
  c.vx += (mx * sp - c.vx) * Math.min(1, acc * dt); c.vz += (-v.y * sp - c.vz) * Math.min(1, acc * dt);
  if (g.phase === 'blow') { const push = c.air ? 3.4 : 2.2; c.vz += push * dt * 3; c.vx += g.dir * push * dt * 2.2; }
  if (pressedNow.jump && !c.air) { c.jumpFrom = [c.x, c.z]; c.air = true; c.airT = 0; c.airDur = 2 * 5.2 / 14; c.vh = 5.2; c.vx *= 1.25; c.vz *= 1.25; sfx.jump(); }
  if (c.air) { c.airT = (c.airT || 0) + dt; if (c.vh > 0) c.peakH = c.h + c.vh * c.vh / 28; }
  if (c.air) {                                                                        // the shadow chases a point part way toward the landing, smoothly
    const tA = c.vh / 14 + Math.sqrt(Math.max(0, (c.vh / 14) ** 2 + 2 * c.h / 14)), lx = c.x + c.vx * tA, lz = c.z + c.vz * tA * Math.max(0.8, Math.min(1.4, c.z / 9));
    const u0 = Math.min(1, (c.airT || 0) / ((c.airDur || 0.74) * SHADOW.arrive)), lead = SHADOW.lead * u0 * u0 * (3 - 2 * u0);
    // the shadow rides along with you and eases ahead of you: it's your position plus a smoothed offset toward the
    // landing, so it never lags behind you (which looked like it slid backwards before moving on)
    const ox = (lx - c.x) * lead, oz = (lz - c.z) * lead;
    if (c.shox == null) { c.shox = 0; c.shoz = 0; }
    const kf = 1 - Math.exp(-SHADOW.follow * dt); c.shox += (ox - c.shox) * kf; c.shoz += (oz - c.shoz) * kf;
  } else { c.shx = null; c.shox = null; }
  const pz = c.z;
  c.x += c.vx * dt; c.z += c.vz * dt * Math.max(0.8, Math.min(1.4, c.z / 9));
  c.z = Math.max(4, Math.min(40, c.z));
  // (no crags for now: the ledges are platforms in the air, and off any edge you fall)
  if (c.air) { c.h += c.vh * dt; c.vh -= 14 * dt; if (c.h <= 0) { c.h = 0; c.air = false; } }
  if (!c.air) { if (overChasm(c.x, c.z)) { c.fall = 0.01; sfx.fall(); return; } c.safe = [c.x, c.z]; }
  if (!c.air && c.z <= d.goalZ && (d.goalAny || climbSide(c.x, c.z) < -climbHw(c.z))) climbFinish(c);
  [h.x, h.y] = climbProj(c.x, climbGround(c.x, c.z) + c.h, c.z);
  updateFx(dt);
}
const climbGround = (x, z) => onClimbIsland(x, z) ? 1.5 : climbSlopeY(climbSide(x, z));

function drawClimb() {
  const c = state.climb; if (!c) return;
  if (c.kind === 'side') { drawSideClimb(c); drawFx(); return; }
  const d = climbDef(), key = state.scene + Math.round(W) + 'x' + Math.round(H);
  if (c.bgKey !== key) { c.bgKey = key; c.bg = null; try { const cv = document.createElement('canvas'); cv.width = Math.ceil(W); cv.height = Math.ceil(H); const g = cv.getContext && cv.getContext('2d'); if (g && g.fillRect) { paintClimb(g, d); c.bg = cv; } } catch (e) { c.bg = null; } }
  if (c.bg) ctx.drawImage(c.bg, 0, 0); else paintClimb(ctx, d);
  const gs = c.gust, a = gs.phase === 'blow' ? 0.7 : gs.phase === 'warn' ? 0.25 : 0;
  if (a) { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { const z = 5 + ((i * 3.1 + state.time * 9) % 40), x = d.cx(z) + (i % 4 - 1.5) * 2.2 + gs.dir * ((state.time * 3 + i) % 2), [sx, sy] = climbProj(x, 2.2, z), l = 70 * 5 / z, dir = (d.mirror ? -1 : 1) * gs.dir; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + dir * l * 0.5, sy - l * 0.3, sx + dir * l, sy - l * 0.1); ctx.stroke(); } }
  const f = H * d.cam.f, ground = climbGround(c.x, c.z), s = 0.55 * f / c.z;
  const sink = c.fall > 0 ? c.fall / 0.9 : 0, [gx, gy] = climbProj(c.x, ground, c.z), [px, py] = climbProj(c.x, ground + c.h - sink * 4, c.z);
  if (!sink) {                                                                      // your shadow: in the air it runs ahead to where you'll come down (it tells the truth a moment early)
    let sx0 = gx, sy0 = gy, sw = s * 0.8;
    if (c.air) {
      // the shadow is a thing of its own: it chases a point part of the way from you toward where you'll land, smoothly,
      // so steering doesn't make it jump about. SHADOW.lead is how far ahead it goes (0 = under you, 1 = right on the landing)
      c.shx = c.x + (c.shox || 0); c.shz = c.z + (c.shoz || 0);                           // where you are, plus the eased lead
      [sx0, sy0] = climbProj(c.shx, overChasm(c.shx, c.shz) ? -3 : 1.5, c.shz); sw = 0.8 * 0.55 * H * d.cam.f / c.shz;
      const apex = c.vh * c.vh / 28 + c.h, hk = Math.max(0, Math.min(1, c.h / Math.max(0.3, c.vh > 0 ? apex : (c.peakH || apex))));
      sw *= 0.2 + 0.8 * (1 - hk) * (1 - hk);                                            // tiny at the top of the jump, growing as you come down
      if (overChasm(c.shx, c.shz)) sw *= 0.6;                                            // over the drop it falls far below: small and faint
    }
    ctx.fillStyle = `rgba(0,0,0,${c.air ? 0.38 : 0.25})`; ctx.beginPath(); ctx.ellipse(sx0, sy0, sw, sw * 0.28, 0, 0, 6.28); ctx.fill();
  }
  if (state.settings.tiles) drawClimbTiles(c, d);                                   // System > Show tiles: the grid laid on the ground, in perspective
  if (MOUNTAIN) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(8, H - 30, 330, 22); ctx.fillStyle = '#fdf6e3'; ctx.font = '13px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.fillText(`shadow lead ${SHADOW.lead.toFixed(2)} [ ]  follow ${SHADOW.follow.toFixed(0)} - =`, 14, H - 14); }
  ctx.save(); ctx.globalAlpha = 1 - sink; ctx.fillStyle = heroColor(); const ss = s * (1 - sink * 0.6); ctx.fillRect(px - ss / 2, py - ss, ss, ss); ctx.restore();
  { const z = d.goalZ - 0.2, x = d.cx(z) - d.hw(z) - 1.2, [fx, fy] = climbProj(x, climbSlopeY(-(d.hw(z) + 1.2)), z); ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - UNIT * 1.6); ctx.stroke(); ctx.fillStyle = '#e05a4a'; ctx.beginPath(); ctx.moveTo(fx, fy - UNIT * 1.6); ctx.lineTo(fx + UNIT * 0.8, fy - UNIT * 1.35); ctx.lineTo(fx, fy - UNIT * 1.1); ctx.fill(); }
  drawFx();
}
// the tile grid for the climb: one-tile squares on the ground, shrinking into the distance like everything else.
// Blue over the ravine, green on an island, gold under you; a width readout at each crossing's narrowest point.
function drawClimbTiles(c, d) {
  ctx.save(); ctx.lineWidth = 1;
  const x0 = Math.floor(d.cx(10) - 9), x1 = Math.ceil(d.cx(10) + 9), cellAt = (x, z) => onClimbIsland(x, z) ? 'isl' : overChasm(x, z) ? 'gap' : 'ok';
  for (let z = 40; z > 3.4; z -= 1) {
    const zb = Math.max(3.4, z - 1);
    for (let x = x0; x < x1; x++) {
      const me = c && Math.floor(c.x) === x && Math.ceil(c.z) === z, N = z < 14 ? 4 : 2;       // each tile is coloured in quarters (halves far off), so its colour follows the real edge
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const ax = x + i / N, bx = x + (i + 1) / N, az = z - j / N * (z - zb), bz = z - (j + 1) / N * (z - zb), k = cellAt((ax + bx) / 2, (az + bz) / 2);
        if (k === 'ok' && !me) continue;
        const q = [climbProj(ax, 1.5, az), climbProj(bx, 1.5, az), climbProj(bx, 1.5, bz), climbProj(ax, 1.5, bz)];
        ctx.beginPath(); q.forEach(([a, b], n) => n ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
        ctx.fillStyle = me ? 'rgba(255,215,90,.45)' : k === 'gap' ? 'rgba(80,140,255,.25)' : 'rgba(120,230,120,.3)'; ctx.fill();
      }
      const q = [climbProj(x, 1.5, z), climbProj(x + 1, 1.5, z), climbProj(x + 1, 1.5, zb), climbProj(x, 1.5, zb)];
      ctx.beginPath(); q.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.stroke();
    }
  }
  // the true edges, exactly as the game tests them: the ravine's two lips and each island's rim, as bright lines
  ctx.strokeStyle = 'rgba(120,255,255,.9)'; ctx.lineWidth = 2;
  for (const s of [-1, 1]) { ctx.beginPath(); for (let z = 40, i = 0; z > 3.4; z -= 0.2, i++) { const [a, b] = climbProj(d.cx(z) + s * d.hw(z), 1.5, z); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); } ctx.stroke(); }
  for (const [ix, iz, r] of d.islands || []) { ctx.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * 6.28, [sx, sy] = climbProj(d.cx(iz) + ix + Math.cos(a) * r, 1.5, iz + Math.sin(a) * r); k ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); } ctx.stroke(); }
  // how wide the ravine is at its narrow points (in tiles), so jumps can be tuned by the numbers
  ctx.font = 'bold 12px "Courier New", monospace'; ctx.textAlign = 'center';
  for (let z = 5; z < 30; z += 0.1) { const w = d.hw(z) * 2, wa = d.hw(z - 0.1) * 2, wb = d.hw(z + 0.1) * 2; if (w < wa && w <= wb && w < 3) { const [sx, sy] = climbProj(d.cx(z), 1.5, z); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(sx - 24, sy - 22, 48, 16); ctx.fillStyle = '#fdf6e3'; ctx.fillText(w.toFixed(1) + ' t', sx, sy - 10); } }
  if (c && c.air) { const [sx, sy] = climbProj(c.x, 1.5, c.z); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(sx - 34, sy + 6, 68, 16); ctx.fillStyle = '#fdf6e3'; ctx.fillText('jump ' + ((c.jumpFrom ? Math.hypot(c.x - c.jumpFrom[0], c.z - c.jumpFrom[1]) : 0)).toFixed(1) + ' t', sx, sy + 18); }
  ctx.restore();
}
// for screens shaped by a gap(x, z) function (bands, chasms, short ravines): far to near, row by row, each small
// cell is grass or a hole; a hole shows its dark floor, and where grass meets a hole on the side nearer you, the
// hole's far wall (facing you) drops away in brown; side walls where a hole runs along
function paintGapField(g, d, P, quad, mix, f) {
  const HAZE = '#c8d6de', wh = 1.5, dx = 0.25, X0 = -12, X1 = 12;
  for (let z = 60; z > 3.3; ) {
    const dz = z > 30 ? 0.5 : z > 15 ? 0.25 : 0.12, z2 = z - dz, t = Math.min(1, (z - 3) / 55) ** 0.8, haze = col => mix(col, HAZE, t * 0.75), zm = (z + z2) / 2;
    for (let x = X0; x < X1; x += dx) {
      const xm = x + dx / 2, hole = d.gap(xm, zm);
      if (!hole) { quad([P(x, wh, z), P(x + dx, wh, z), P(x + dx, wh, z2), P(x, wh, z2)], haze(Math.floor(z * 1.2) % 2 ? '#7d9a5c' : '#779456')); continue; }
      quad([P(x, -3, z), P(x + dx, -3, z), P(x + dx, -3, z2), P(x, -3, z2)], haze('#161a12'));
      if (!d.gap(xm, z + dz * 0.5)) quad([P(x, wh, z), P(x + dx, wh, z), P(x + dx, -3, z), P(x, -3, z)], haze('#7a5a3c'));            // its far wall, toward you
      const cxs = 0;
      if (xm < cxs && !d.gap(xm - dx, zm)) quad([P(x, wh, z), P(x, wh, z2), P(x, -3, z2), P(x, -3, z)], haze('#5a4028'));            // a side wall, on the far side of the hole from the middle
      if (xm > cxs && !d.gap(xm + dx, zm)) quad([P(x + dx, wh, z), P(x + dx, wh, z2), P(x + dx, -3, z2), P(x + dx, -3, z)], haze('#5a4028'));
    }
    z = z2;
  }
  // the lips, crisp: a dark line along every edge between grass and a hole, drawn on the grass
  g.strokeStyle = '#1c1208'; g.lineWidth = 2;
  for (let z = 30; z > 3.4; z -= 0.12) for (let x = X0; x < X1; x += dx) {
    const a = d.gap(x + dx / 2, z), b = d.gap(x + dx / 2, z - 0.12), c2 = d.gap(x + dx * 1.5, z);
    if (a !== b) { const [p1x, p1y] = P(x, wh, z - 0.06), [p2x, p2y] = P(x + dx, wh, z - 0.06); g.beginPath(); g.moveTo(p1x, p1y); g.lineTo(p2x, p2y); g.stroke(); }
    if (a !== c2) { const [p1x, p1y] = P(x + dx, wh, z), [p2x, p2y] = P(x + dx, wh, z - 0.12); g.beginPath(); g.moveTo(p1x, p1y); g.lineTo(p2x, p2y); g.stroke(); }
  }
  { const z = 3.3; quad([P(X0, wh, z), P(X1, wh, z), [W, H], [0, H]], '#7d9a5c'); }                       // the ground at your feet
}
function paintClimb(g, d) {
  const horizon = H * d.cam.horizon, f = H * d.cam.f, P = (x, y, z) => climbProj(x, y, z, d);
  const quad = (p, fill) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); };
  const mix = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - t) + parseInt(b.substr(1 + i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
  const mw = x => d.mirror ? W - x : x;
  let gr = g.createLinearGradient(0, 0, 0, horizon + 40); gr.addColorStop(0, '#9cc4e4'); gr.addColorStop(1, '#dfeaf0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (false) { quad([[mw(W * 0.45), horizon + 30], [mw(W * 0.62), horizon - H * 0.24], [mw(W * 0.7), horizon - H * 0.19], [mw(W * 0.84), horizon + 30]], '#9a948e');
    quad([[mw(W * 0.58), horizon - H * 0.19], [mw(W * 0.62), horizon - H * 0.24], [mw(W * 0.66), horizon - H * 0.2], [mw(W * 0.63), horizon - H * 0.19]], '#eef2f5');
    quad([[mw(W * 0.1), horizon + 30], [mw(W * 0.26), horizon - H * 0.1], [mw(W * 0.4), horizon + 30]], '#aaa6a2'); }
  g.fillStyle = '#7fa36a'; g.fillRect(0, horizon - 8, W, 60);
  { const gg = g.createLinearGradient(0, horizon + 40, 0, H); gg.addColorStop(0, '#9fb3a0'); gg.addColorStop(1, '#6f8d62'); g.fillStyle = gg; g.fillRect(0, horizon + 40, W, H); }
  for (let i = 0; i < 70; i++) { const x = (i * 0.618 % 1) * W, y = horizon + 60 + (i * 0.377 % 1) * (H - horizon); g.fillStyle = 'rgba(60,90,55,.5)'; g.beginPath(); g.arc(x, y, 3 + (y - horizon) * 0.02, 0, 6.28); g.fill(); }
  if (d.gap) { paintGapField(g, d, P, quad, mix, f); return; }
  const HAZE = '#c8d6de', step = 0.15, wh = 1.5; let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const isl = (d.islands || []).map(([ix, iz, r]) => ({ x: d.cx(iz) + ix, z: iz, r, drawn: false }));
  const lipL = [], lipR = [], lipOL = [], lipOR = [], band = (z, S) => 12;
  const crag = (x0, x0b, dir, z, z2, side, haze) => {                             // the crags beyond a ledge: a rough rock wall rising, stepping back
    const bump = k => wh + 1.6 + 1.1 * Math.abs(Math.sin(k * 1.7 + side)) + 0.5 * Math.abs(Math.sin(k * 4.3)), hTop = bump(z), hTop2 = bump(z2);
    quad([P(x0 + dir * 6, hTop + 1.6, z), P(x0, hTop, z), P(x0b, hTop2, z2), P(x0b + dir * 6, hTop2 + 1.6, z2)], haze(Math.floor(z * 1.5) % 3 ? '#8a857c' : '#817c74'));   // the rock above, stepping back and up
    quad([P(x0, wh, z), P(x0, hTop, z), P(x0b, hTop2, z2), P(x0b, wh, z2)], haze(side === 1 ? '#6c6760' : '#5c5852'));                              // its face toward the ledge
  };
  for (let z = 70; z > 3.3; z -= step) {
    const z2 = z - step, t = Math.min(1, (z - 3) / 55) ** 0.8, haze = col => mix(col, HAZE, t * 0.75);
    const L1 = d.cx(z) - d.hw(z), R1 = d.cx(z) + d.hw(z), L2 = d.cx(z2) - d.hw(z2), R2 = d.cx(z2) + d.hw(z2);
    const bL = band(z, 'L'), bR = band(z, 'R'), bL2 = band(z2, 'L'), bR2 = band(z2, 'R');
    { const oL = L1 - bL, oL2 = L2 - bL2, oR = R1 + bR, oR2 = R2 + bR2;                                          // (no crags for now) the ledges' outer edges drop away too
      quad([P(oL, wh, z), P(oL, -3, z), P(oL2, -3, z2), P(oL2, wh, z2)], haze('#5a4028')); quad([P(oR, wh, z), P(oR, -3, z), P(oR2, -3, z2), P(oR2, wh, z2)], haze('#7a5a3c'));
      lipOL.push(P(oL, wh, z)); lipOR.push(P(oR, wh, z)); }
    quad([P(L1 - bL, wh, z), P(L1, wh, z), P(L2, wh, z2), P(L2 - bL2, wh, z2)], haze(Math.floor(z) % 2 ? '#7d9a5c' : '#779456'));   // the ledges: level grass
    quad([P(R1, wh, z), P(R1 + bR, wh, z), P(R2 + bR2, wh, z2), P(R2, wh, z2)], haze(Math.floor(z) % 2 ? '#7d9a5c' : '#779456'));
    quad([P(L1, -3, z), P(R1, -3, z), P(R2, -3, z2), P(L2, -3, z2)], haze('#161a12'));
    if (Math.floor(z / step) % 3 === 0) for (let k = 0; k < 2; k++) { const x = d.cx(z) + (rnd() - 0.5) * 2 * d.hw(z) * 0.9, [sx, sy] = P(x, -3, z), sz = 0.2 * f / z; quad([[sx - sz, sy], [sx - sz * 0.6, sy - sz * 0.8], [sx + sz * 0.3, sy - sz], [sx + sz, sy - sz * 0.3], [sx + sz * 0.8, sy]], haze(['#2a3022', '#343c2a', '#222819'][k % 3])); }
    quad([P(L1, wh, z), P(L1, -3, z), P(L2, -3, z2), P(L2, wh, z2)], haze('#7a5a3c'));
    quad([P(R1, wh, z), P(R1, -3, z), P(R2, -3, z2), P(R2, wh, z2)], haze('#5a4028'));
    lipL.push([P(L1, wh, z), t]); lipR.push([P(R1, wh, z), t]);
    for (const q of isl) if (!q.drawn && q.z >= z2) {
      q.drawn = true; const n = 18, top = [], bot = [];
      for (let k = 0; k < n; k++) { const a = k / n * 6.28, px = q.x + Math.cos(a) * q.r, pz = q.z + Math.sin(a) * q.r; top.push(P(px, wh, pz)); bot.push(P(px, -3, pz)); }
      for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; if (Math.sin((k + 0.5) / n * 6.28) > 0.15) continue; quad([top[k], top[k2], bot[k2], bot[k]], haze(Math.cos((k + 0.5) / n * 6.28) < 0 ? '#7a5a3c' : '#5a4028')); }   // solid sides
      quad(top, haze('#7d9a5c')); g.strokeStyle = haze('#2a1c10'); g.lineWidth = 2.5; g.beginPath(); top.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke();
    }
  }
  for (const o of [lipOL, lipOR]) { g.strokeStyle = '#1c1208'; g.lineWidth = 3; g.beginPath(); o.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }   // the outer edges, crisp too
  for (const lip of [lipL, lipR]) {                                                  // the ravine's edge, drawn crisp: a dark line, a light grass rim
    g.lineJoin = 'round'; g.strokeStyle = '#1c1208'; g.lineWidth = 3; g.beginPath(); lip.forEach(([[x, y]], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    g.strokeStyle = 'rgba(190,220,150,.55)'; g.lineWidth = 1.5; g.beginPath(); lip.forEach(([[x, y]], i) => i ? g.lineTo(x, y - 2) : g.moveTo(x, y - 2)); g.stroke(); }
  { const z = 3.3, L = d.cx(z) - d.hw(z), R = d.cx(z) + d.hw(z), bL = band(z, 'L'), bR = band(z, 'R'), [lx, ly] = P(L, -3, z), [rx, ry] = P(R, -3, z), [ltx, lty] = P(L, wh, z), [rtx, rty] = P(R, wh, z), [lox] = P(L - bL, wh, z), [rox] = P(R + bR, wh, z);
    const ex = d.mirror ? W : 0, fx = d.mirror ? 0 : W;
    quad([[lox, lty], [ltx, lty], [ltx, H], [lox, H]], '#7d9a5c');
    quad([[ltx, lty], [lx, ly], [lx, H], [ltx, H]], '#7a5a3c'); quad([[lx, ly], [rx, ry], [rx, H], [lx, H]], '#11140e'); quad([[rx, ry], [rtx, rty], [rtx, H], [rx, H]], '#5a4028');
    quad([[rtx, rty], [rox, rty], [rox, H], [rtx, H]], '#7d9a5c'); }
}

// ---------- the side view: the mountain seen side on, ledges climbing to the right, the valley far below ----------
function newSideClimb() {
  const L = []; let x = 0, y = 0.78;
  for (let i = 0; i < 14; i++) { const w = 0.14 + ((i * 37) % 7) / 60; L.push([x, x + w, y]); x += w + 0.05 + ((i * 53) % 5) / 90; y -= 0.04 + ((i * 29) % 4) / 100; if (y < 0.25) y = 0.25; }
  return { kind: 'side', ledges: L, worldW: x, px: 0.05, py: L[0][2], vx: 0, vy: 0, air: false, safe: [0.05, L[0][2]], cam: 0, gust: { phase: 'calm', t: 2.5 }, done: false, fall: 0 };
}
function updateSideClimb(c, dt) {
  const g = c.gust; g.t -= dt;
  if (g.t <= 0) { if (g.phase === 'calm') { g.phase = 'warn'; g.t = 0.9; sfx.rustle(); } else if (g.phase === 'warn') { g.phase = 'blow'; g.t = 1.5; } else { g.phase = 'calm'; g.t = 2 + Math.random() * 2.5; } }
  const v = inputVector(), sp = 0.28;                                                      // units: screen widths per second
  c.vx += (v.x * sp - c.vx) * Math.min(1, (c.air ? 3 : 12) * dt);
  if (g.phase === 'blow') c.vx -= (c.air ? 0.5 : 0.3) * dt;                                // the wind comes down the mountain, against you
  if (pressedNow.jump && !c.air) { c.vy = -0.95; c.air = true; sfx.jump(); }
  c.vy += 2.4 * dt; c.px += c.vx * dt * (W / H > 1 ? H / W : 1) * 1.6; c.py += c.vy * dt * 0.6;
  const on = c.ledges.find(([a, b, y]) => c.px >= a && c.px <= b && c.py >= y - 0.005 && c.py <= y + 0.05 && c.vy >= 0);
  if (on) { c.py = on[2]; c.vy = 0; c.air = false; c.safe = [Math.min(on[1] - 0.02, Math.max(on[0] + 0.02, c.px)), on[2]]; } else c.air = true;
  c.px = Math.max(0.01, c.px);
  if (c.py > 1.05) { hurtHero(1, 0, 0, { force: true }); sfx.fall(); [c.px, c.py] = c.safe; c.vx = c.vy = 0; }   // off a ledge and down
  const last = c.ledges[c.ledges.length - 1]; if (!c.air && c.px >= last[0]) climbFinish(c);
  c.cam += (Math.max(0, Math.min(c.worldW - W / H * 0.9, c.px - 0.35 * W / H)) - c.cam) * Math.min(1, 4 * dt);
}
function drawSideClimb(c) {
  const sx = x => (x - c.cam) * H, sy = y => y * H;
  let gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9cc4e4'); gr.addColorStop(1, '#e4ecef'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  for (const [k, col, hgt] of [[0.1, '#b8b4b0', 0.5], [0.25, '#a19c96', 0.62]]) {            // far ranges, drifting slower than you
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) { const wx = x / H + c.cam * k; ctx.lineTo(x, H * (hgt - 0.12 * Math.abs(Math.sin(wx * 2.3)) - 0.08 * Math.sin(wx * 5.1))); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#8fae82'; ctx.fillRect(0, H * 0.86, W, H * 0.14);                                // the valley far below
  for (const [a, b, y] of c.ledges) {                                                        // each ledge: a grass top, a brown face, the mountain beneath
    const x0 = sx(a), x1 = sx(b), yy = sy(y); if (x1 < -50 || x0 > W + 50) continue;
    ctx.fillStyle = '#6b6560'; ctx.beginPath(); ctx.moveTo(x0 - 20, yy + 14); ctx.lineTo(x1 + 30, yy + 14); ctx.lineTo(x1 + 60, H); ctx.lineTo(x0 - 50, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a5a3c'; ctx.fillRect(x0, yy, x1 - x0, 16); ctx.fillStyle = '#6d8a3e'; ctx.fillRect(x0 - 3, yy - 5, x1 - x0 + 6, 8);
  }
  const g = c.gust; if (g.phase !== 'calm') { ctx.strokeStyle = `rgba(255,255,255,${g.phase === 'blow' ? 0.7 : 0.25})`; ctx.lineWidth = 2; for (let i = 0; i < 14; i++) { const x = W - ((i * 97 + state.time * 400) % (W + 200)), y = (i * 53) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 60, y + 4); ctx.stroke(); } }
  const last = c.ledges[c.ledges.length - 1], fx = sx(last[0] + 0.03), fy = sy(last[2]); ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - UNIT * 1.6); ctx.stroke(); ctx.fillStyle = '#e05a4a'; ctx.beginPath(); ctx.moveTo(fx, fy - UNIT * 1.6); ctx.lineTo(fx + UNIT * 0.8, fy - UNIT * 1.35); ctx.lineTo(fx, fy - UNIT * 1.1); ctx.fill();
  const s = UNIT * 0.8; ctx.fillStyle = heroColor(); ctx.fillRect(sx(c.px) - s / 2, sy(c.py) - s, s, s);
  [state.hero.x, state.hero.y] = [sx(c.px), sy(c.py) - s / 2];
}
