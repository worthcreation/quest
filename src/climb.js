// ===== climb.js: the mountain climb, a prototype of a new kind of screen. The camera stands still and the trail runs
// away into the distance; you climb from far and small to near and big, jumping the chasm wherever it's narrow
// enough, while the wind pushes you back up the slope and toward the edge. (System > Testing > Try the climb.)

const CLIMB = { f: 0.62, horizon: 0.26, camH: 3.4, hw: 1.25, wallH: 1.5, zNear: 3.3, zFar: 70, start: [2.4, 18], goalZ: 4.6 };
const climbCx = z => { const t = (z + 6) / 22, k = t - Math.floor(t), tri = 2 * Math.abs(k - 0.5) * 2 - 1, s = tri * tri * tri; return 2.6 * (0.6 * tri + 0.4 * s); };
const climbHw = z => 1.25 + 0.75 * Math.sin(z * 0.55 + 1.3);                     // the chasm narrows and widens: jump where it's narrow
const climbSlopeY = dx => dx < 0 ? CLIMB.wallH + (-dx - 1) * 0.36 : CLIMB.wallH - (dx - 1) * 0.58;   // left rises away, right falls away
function climbProj(x, y, z) { const f = H * CLIMB.f; return [W / 2 + (x - climbCx(5.6)) * f / z, H * CLIMB.horizon + (CLIMB.camH - y) * f / z]; }

function newClimb() {
  return { x: climbCx(CLIMB.start[1]) + CLIMB.start[0], z: CLIMB.start[1], vx: 0, vz: 0, h: 0, vh: 0, air: false, fall: 0, safe: null,
    gust: { phase: 'calm', t: 2.5, dir: 1 }, done: false, bg: null, bgKey: '' };
}
// where you are relative to the chasm: negative = left of it, positive = right; |d| < hw means you're over the drop
const climbSide = (x, z) => x - climbCx(z);
const overChasm = (x, z) => Math.abs(climbSide(x, z)) < climbHw(z);

function updateClimb(dt) {
  const c = state.climb, h = state.hero; if (!c) return;
  if (c.done) { c.doneT = (c.doneT || 0) + dt; if (c.doneT > 2.2) { const back = state.climbReturn || 'f1'; state.climb = null; enterScene(back); } return; }
  if (state.menu) return;
  // the wind: calm, a warning rustle, then a blow down the trail (away from you) and toward the edge
  const g = c.gust; g.t -= dt;
  if (g.t <= 0) { if (g.phase === 'calm') { g.phase = 'warn'; g.t = 0.9; g.dir = Math.random() < 0.5 ? -1 : 1; sfx.rustle(); } else if (g.phase === 'warn') { g.phase = 'blow'; g.t = 1.6; sfx.whoosh && sfx.whoosh(); } else { g.phase = 'calm'; g.t = 2 + Math.random() * 2.5; } }
  if (c.fall > 0) { c.fall += dt; if (c.fall > 0.9) { c.fall = 0; [c.x, c.z] = c.safe || [climbCx(CLIMB.start[1]) + CLIMB.start[0], CLIMB.start[1]]; c.h = 0; c.air = false; c.vx = c.vz = 0; hurtHero(1, 0, 0, { force: true }); } return; }
  // moving: left/right across, up = further off (down the climb), down = nearer (up the climb)
  const v = inputVector(), sp = 3.2, acc = c.air ? 2 : 12;
  c.vx += (v.x * sp - c.vx) * Math.min(1, acc * dt); c.vz += (-v.y * sp - c.vz) * Math.min(1, acc * dt);
  if (g.phase === 'blow') { const push = c.air ? 3.4 : 2.2; c.vz += push * dt * 3; c.vx += g.dir * push * dt * 2.2; }   // it shoves you back and sideways
  if (pressedNow.jump && !c.air) { c.air = true; c.vh = 5.2; c.vx *= 1.25; c.vz *= 1.25; sfx.jump(); }   // a running jump carries you
  c.x += c.vx * dt; c.z += c.vz * dt * Math.max(0.6, c.z / 8);                   // (further off, a step covers more of the trail)
  c.z = Math.max(CLIMB.zNear + 0.6, Math.min(40, c.z));
  const d = climbSide(c.x, c.z), hw = climbHw(c.z), reach = hw + 6;                // keep to the slopes you can see
  if (d < -reach) c.x = climbCx(c.z) - reach; if (d > reach) c.x = climbCx(c.z) + reach;
  if (c.air) { c.h += c.vh * dt; c.vh -= 14 * dt; if (c.h <= 0) { c.h = 0; c.air = false; } }
  if (!c.air) {
    if (overChasm(c.x, c.z)) { c.fall = 0.01; sfx.fall(); say('Whoa!', h.x, h.y - UNIT, { key: 'fall', life: 1 }); return; }
    c.safe = [c.x, c.z];
  }
  if (!c.air && c.z <= CLIMB.goalZ && climbSide(c.x, c.z) < 0) { c.done = true; sfx.fanfare(); showScroll('The climb', 'You made it up. (A prototype: the full mountain comes next.)'); }
  [h.x, h.y] = climbProj(c.x, climbSlopeY(climbSide(c.x, c.z)) + c.h, c.z);        // (for bubbles and particles)
  updateFx(dt);
}

// the still world is drawn once into a picture; you, the wind and the falling are drawn over it each frame
function drawClimb() {
  const c = state.climb; if (!c) return;
  const key = Math.round(W) + 'x' + Math.round(H);
  if (c.bgKey !== key) { c.bgKey = key; c.bg = null; try { const cv = document.createElement('canvas'); cv.width = Math.ceil(W); cv.height = Math.ceil(H); const g = cv.getContext && cv.getContext('2d'); if (g && g.fillRect) { paintClimb(g); c.bg = cv; } } catch (e) { c.bg = null; } }
  if (c.bg) ctx.drawImage(c.bg, 0, 0); else paintClimb(ctx);
  // the wind streaks: faint when it's coming, strong while it blows
  const gs = c.gust, a = gs.phase === 'blow' ? 0.7 : gs.phase === 'warn' ? 0.25 : 0;
  if (a) { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { const z = 5 + ((i * 3.1 + state.time * 9) % 40), x = climbCx(z) + (i % 4 - 1.5) * 2.2 + gs.dir * ((state.time * 3 + i) % 2), [sx, sy] = climbProj(x, 2.2, z), l = 70 * 5 / z; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + gs.dir * l * 0.5, sy - l * 0.3, sx + gs.dir * l, sy - l * 0.1); ctx.stroke(); } }
  // you: sized by how near you are
  const f = H * CLIMB.f, ground = climbSlopeY(climbSide(c.x, c.z)), s = 0.55 * f / c.z;
  const sink = c.fall > 0 ? c.fall / 0.9 : 0, [gx, gy] = climbProj(c.x, ground, c.z), [px, py] = climbProj(c.x, ground + c.h - sink * 4, c.z);
  if (!sink) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(gx, gy, s * 0.8 * (1 - Math.min(0.6, c.h / 3)), s * 0.22, 0, 0, 6.28); ctx.fill(); }
  ctx.save(); ctx.globalAlpha = 1 - sink; ctx.fillStyle = heroColor(); const ss = s * (1 - sink * 0.6); ctx.fillRect(px - ss / 2, py - ss, ss, ss); ctx.restore();
  // where the goal is: a little flag on the near left slope
  { const z = CLIMB.goalZ - 0.2, x = climbCx(z) - climbHw(z) - 1.2, [fx, fy] = climbProj(x, climbSlopeY(-(climbHw(z) + 1.2)), z); ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - UNIT * 1.6); ctx.stroke(); ctx.fillStyle = '#e05a4a'; ctx.beginPath(); ctx.moveTo(fx, fy - UNIT * 1.6); ctx.lineTo(fx + UNIT * 0.8, fy - UNIT * 1.35); ctx.lineTo(fx, fy - UNIT * 1.1); ctx.fill(); }
  drawFx();
}
function paintClimb(g) {
  const horizon = H * CLIMB.horizon, f = H * CLIMB.f, P = climbProj;
  const quad = (p, fill) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); };
  const mix = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - t) + parseInt(b.substr(1 + i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
  let gr = g.createLinearGradient(0, 0, 0, horizon + 40); gr.addColorStop(0, '#9cc4e4'); gr.addColorStop(1, '#dfeaf0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  quad([[W * 0.45, horizon + 30], [W * 0.62, horizon - H * 0.24], [W * 0.7, horizon - H * 0.19], [W * 0.84, horizon + 30]], '#9a948e');
  quad([[W * 0.58, horizon - H * 0.19], [W * 0.62, horizon - H * 0.24], [W * 0.66, horizon - H * 0.2], [W * 0.63, horizon - H * 0.19]], '#eef2f5');
  quad([[W * 0.1, horizon + 30], [W * 0.26, horizon - H * 0.1], [W * 0.4, horizon + 30]], '#aaa6a2');
  g.fillStyle = '#7fa36a'; g.fillRect(0, horizon - 8, W, 60);
  { const gg = g.createLinearGradient(0, horizon + 40, 0, H); gg.addColorStop(0, '#9fb3a0'); gg.addColorStop(1, '#6f8d62'); g.fillStyle = gg; g.fillRect(0, horizon + 40, W, H); }
  for (let i = 0; i < 70; i++) { const x = (i * 0.618 % 1) * W, y = horizon + 60 + (i * 0.377 % 1) * (H - horizon); g.fillStyle = 'rgba(60,90,55,.5)'; g.beginPath(); g.arc(x, y, 3 + (y - horizon) * 0.02, 0, 6.28); g.fill(); }
  const HAZE = '#c8d6de', step = 0.15; let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let z = CLIMB.zFar; z > CLIMB.zNear; z -= step) {
    const z2 = z - step, t = Math.min(1, (z - 3) / 55) ** 0.8, haze = col => mix(col, HAZE, t * 0.75), wallW = 6, wh = CLIMB.wallH;
    const L1 = climbCx(z) - climbHw(z), R1 = climbCx(z) + climbHw(z), L2 = climbCx(z2) - climbHw(z2), R2 = climbCx(z2) + climbHw(z2);
    quad([P(L1 - wallW, wh + wallW * 0.36, z), P(L1, wh, z), P(L2, wh, z2), P(L2 - wallW, wh + wallW * 0.36, z2)], haze(Math.floor(z) % 3 ? '#7d8a5c' : '#76845a'));   // the slope rising away
    quad([P(R1, wh, z), P(R1 + wallW, wh - wallW * 0.58, z), P(R2 + wallW, wh - wallW * 0.58, z2), P(R2, wh, z2)], haze(Math.floor(z) % 3 ? '#7f9460' : '#788c5c'));   // the slope falling to the valley
    quad([P(L1, -3, z), P(R1, -3, z), P(R2, -3, z2), P(L2, -3, z2)], haze('#161a12'));                                              // the chasm floor
    if (Math.floor(z / step) % 3 === 0) for (let k = 0; k < 2; k++) { const x = climbCx(z) + (rnd() - 0.5) * 2 * climbHw(z) * 0.9, [sx, sy] = P(x, -3, z), sz = 0.2 * f / z; quad([[sx - sz, sy], [sx - sz * 0.6, sy - sz * 0.8], [sx + sz * 0.3, sy - sz], [sx + sz, sy - sz * 0.3], [sx + sz * 0.8, sy]], haze(['#2a3022', '#343c2a', '#222819'][k % 3])); }
    quad([P(L1, wh, z), P(L1, -3, z), P(L2, -3, z2), P(L2, wh, z2)], haze('#7a5a3c'));                                              // the near side's cliff face
    quad([P(R1, wh, z), P(R1, -3, z), P(R2, -3, z2), P(R2, wh, z2)], haze('#5a4028'));                                              // the far side's, in shade
  }
  { const z = CLIMB.zNear, L = climbCx(z) - climbHw(z), R = climbCx(z) + climbHw(z), [lx, ly] = P(L, -3, z), [rx, ry] = P(R, -3, z), [ltx, lty] = P(L, CLIMB.wallH, z), [rtx, rty] = P(R, CLIMB.wallH, z);
    const lo = P(L - 6, CLIMB.wallH + 2.2, z), ro = P(R + 6, CLIMB.wallH - 3.5, z);
    quad([lo, [ltx, lty], [ltx, H], [0, H], [0, lo[1]]], '#7d8a5c'); quad([[ltx, lty], [lx, ly], [lx, H], [ltx, H]], '#7a5a3c');
    quad([[lx, ly], [rx, ry], [rx, H], [lx, H]], '#11140e'); quad([[rx, ry], [rtx, rty], [rtx, H], [rx, H]], '#5a4028'); quad([[rtx, rty], ro, [W, ro[1]], [W, H], [rtx, H]], '#7f9460'); }
  for (const [dx, z, r] of [[-3.5, 18, 0.6], [-5, 30, 0.8], [-2.8, 44, 0.7], [3.4, 24, 0.5], [-4.2, 9, 0.7]]) { const [sx, sy] = P(climbCx(z) + dx, climbSlopeY(dx), z), sz = r * f / z; quad([[sx - sz, sy], [sx - sz * 0.6, sy - sz * 0.9], [sx + sz * 0.2, sy - sz * 1.1], [sx + sz, sy - sz * 0.4], [sx + sz * 0.9, sy]], '#8a857c'); quad([[sx - sz * 0.6, sy - sz * 0.9], [sx + sz * 0.2, sy - sz * 1.1], [sx, sy - sz * 0.4]], '#a09a90'); }
}
