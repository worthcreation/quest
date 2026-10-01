// ===== hammock.js: the two hammocks in Pip's lean-to. Laid out in tiles at enterScene (hammockShape is the one shape:
// the solids, the landing test and the painter all read it), jumped into or climbed into with F, rocking when you land,
// a nap after a short lie-in. Pip climbs into his at dusk and on the tour.
// Pip's hangs from the crossbar and runs away from you; yours is slung between two posts along the left wall.
const HAMMOCKS = [
  { who: 'pip', fx: 0.26, dy: 1.4, dir: [0, 1], len: 2.5, w: 0.92, zEnd: 1.4, head: 'bar', roundFoot: true,
    sheet: '#5e4a34', quilt: '#9a5848', collar: '#c9b07a', hem: '#8a6a44' },
  { who: 'hero', fx: null, tx: 1.6, dy: 4.5, dir: [1, 0], len: 3.2, w: 1.12, zEnd: 1.5,
    sheet: '#4e4436', quilt: '#6e7f68', collar: '#c2b48e', hem: '#7a6a50', cloth2: '#8a7a58' },
];
const ROCK = { k: 22, c: 2.2, push: 2.6, pipSway: 0.35 };          // the swing: a spring, its damping, the shove a landing gives, Pip's idle sway
// where a hammock stands on this screen, in pixels: both ties on the floor, the hanging line between them
function hammockShape(d) {
  const u = UNIT, top = H * 0.3, ax = d.fx != null ? d.fx * W : d.tx * u, ay = top + d.dy * u;
  const L = d.len * u, bx = ax + d.dir[0] * L, by = ay + d.dir[1] * L;
  return { A: [ax, ay], B: [bx, by], L, hw: d.w * u / 2, zEnd: d.zEnd * u, ex: d.dir[0], ey: d.dir[1] };
}
// the two hammocks on this screen: their shapes, their solids (posts, and the hanging body for Pip's), the nap spot
function layoutHammocks(sc) {
  sc.feat.hammocks = HAMMOCKS.map(d => ({ ...d, ...hammockShape(d), rock: 0, rockV: 0 }));
  for (const hm of sc.feat.hammocks) {
    const post = (p, r) => ({ kind: 'post', x: p[0], y: p[1], r, vis: r, key: 'hm' });
    if (hm.head !== 'bar') state.solids.push(post(hm.A, UNIT * 0.22));
    state.solids.push(post(hm.B, UNIT * 0.22));
    state.solids.push({ kind: 'hammock', hm, x: (hm.A[0] + hm.B[0]) / 2, y: (hm.A[1] + hm.B[1]) / 2, r: 0, vis: 0, key: 'hm' });   // the painter's anchor, no collision
    if (hm.who === 'pip') for (let t = 0.15; t <= 0.86; t += 0.14) state.solids.push({ kind: 'body', x: hm.A[0] + hm.ex * hm.L * t, y: hm.A[1] + hm.ey * hm.L * t, r: hm.hw * 0.7, vis: 0, key: 'hm' });   // his you walk round
  }
  const mine = hammockOf('hero');
  sc.feat.nap = [(mine.A[0] + mine.ex * mine.L * 0.5) / W, (mine.A[1] + mine.ey * mine.L * 0.5) / H];
}
const hammockOf = who => (sceneDef().feat.hammocks || []).find(h => h.who === who);
// over the body of your hammock (between its ties, inside its width), where a landing drops you in
function overHammock(x, y) {
  const hm = hammockOf('hero'); if (!hm) return null;
  const t = ((x - hm.A[0]) * hm.ex + (y - hm.A[1]) * hm.ey) / hm.L, off = Math.abs((x - hm.A[0]) * -hm.ey + (y - hm.A[1]) * hm.ex);
  return t > 0.2 && t < 0.8 && off < hm.hw * 1.1 ? hm : null;
}
function climbIn() {
  const hm = hammockOf('hero'), h = state.hero;
  state.hammock = { t: 0, napped: false }; hm.rockV = ROCK.push * (h.vx < 0 ? -1 : 1); hm.rock = 0;
  h.vx = 0; h.vy = 0; h.z = 0; h.vz = 0;
  sfx.tock();
}
function climbOut() {
  const hm = hammockOf('hero'), h = state.hero;
  state.hammock = null;
  h.x = hm.A[0] + hm.ex * hm.L * 0.5 + (hm.ey ? -hm.hw - UNIT * 0.9 : 0); h.y = hm.A[1] + hm.ey * hm.L * 0.5 + (hm.ex ? hm.hw + UNIT * 0.9 : 0);   // out onto the floor beside it
  h.z = 0.01; h.vz = UNIT * 3; hm.rockV = -ROCK.push * 0.6;
}
// Pip into his hammock, or out of it onto the floor beside the foot post
function pipHop(into) {
  const hm = hammockOf('pip'), p = state.pip; if (!hm || !p) return;
  state.pipIn = into;
  if (into) { hm.rockV = ROCK.push * 0.5; p.hop = { t: 0, n: 1 }; }
  else { p.x = hm.B[0] + hm.hw + UNIT * 0.5; p.y = hm.B[1] - UNIT * 0.3; p.hop = { t: 0, n: 1 }; }
  pipPin();
}
// where Pip sits while he's in: at the head end of his hammock
function pipPin() { const hm = hammockOf('pip'); if (hm && state.pipIn) { state.pip.x = hm.A[0] + hm.ex * hm.L * 0.34; state.pip.y = hm.A[1] + hm.ey * hm.L * 0.34 - hm.zEnd * 0.6; state.pip.show = true; } }
function updateHammocks(dt) {
  const sc = sceneDef(), h = state.hero;
  for (const hm of sc.feat.hammocks) {                 // a damped spring, plus a slow sway while Pip's in his
    hm.rockV -= (ROCK.k * hm.rock + ROCK.c * hm.rockV) * dt; hm.rock += hm.rockV * dt;
    if (hm.who === 'pip' && state.pipIn && Math.abs(hm.rock) < 0.05 && Math.abs(hm.rockV) < 0.2) hm.rock = Math.sin(state.time * 1.3) * ROCK.pipSway * 0.15;
  }
  if (state.pip && state.pip.hopNext && !state.pip.visit) { state.pip.hopNext = false; pipHop(true); }   // the tour: he hops in after walking over and saying his piece
  if (state.pipIn) { pipPin(); if (!state.cut && !state.busy) tutorialTalk(sc, state.pip, h); }   // his tour lines go on from the hammock
  const r = state.hammock; if (!r) return;
  r.t += dt;
  if (!r.napped && r.t >= 1) { r.napped = true; h.vig = maxVig(); sfx.heart(); heroNote('A quick nap. Vigor restored.', 1.2, { key: 'item', life: 2.2, color: '#b8f28a' }); }
  if (r.t > 0.4 && (pressedNow.jump || pressedNow.act || pressedNow.left || pressedNow.right || pressedNow.up || pressedNow.down)) { pressedNow.act = false; climbOut(); }
}
// a landing over your hammock drops you in (updateJump calls this as you touch down)
function landInHammock() { if (!state.hammock && !state.cut && overHammock(state.hero.x, state.hero.y)) { climbIn(); return true; } }
// F beside your hammock climbs in
function interactHammock(sc, h) {
  if (!sc.feat.nap || state.hammock || !pressedNow.act) return;
  if (Math.hypot(h.x - sc.feat.nap[0] * W, h.y - sc.feat.nap[1] * H) < UNIT * 1.9) { climbIn(); return true; }
}
// the painter: one dark sheet in a deep sag, its ends narrowing to flat bands up to the ties, the outside showing as a
// wall below the near hem, a quilt with a folded collar, one loose cloth over the rim. Whoever's in it lies along it.
SOLID_DRAW.hammock = (s) => {
  const hm = s.hm, u = UNIT, who = hm.who === 'pip' ? (state.pipIn ? 'pip' : null) : (state.hammock ? 'hero' : null);
  const [ax, ay] = hm.A, [bx, by] = hm.B, L = hm.L, ex = hm.ex, ey = hm.ey, nx = -ey, ny = ex;
  const zEnd = hm.zEnd, sag = (who ? 0.95 : 0.75) * u, hw = hm.hw, rk = hm.rock * u * 0.2, band = 0.22;
  const nearSign = ny > 0.3 ? 1 : ny < -0.3 ? -1 : 0, N = 40, xs = Array.from({ length: N + 1 }, (_, i) => L * i / N);
  const prof0 = x => { const t = x / L, e = Math.min(t, 1 - t); return e < band ? 0.16 + 0.3 * (e / band) : 0.46 + 0.54 * Math.sin(Math.PI * (e - band) / (1 - 2 * band)) ** 0.5; };   // a strap, then the body
  const prof = x => { const t = x / L, e = 1 - t; return hm.roundFoot && t > 0.5 ? (e < 0.05 ? 0.16 : e > 0.3 ? 1 : 0.16 + 0.84 * Math.sqrt(Math.max(0, 1 - ((0.3 - e) / 0.25) ** 2))) : prof0(x); };   // or a round bottom and a short tail
  const dip = x => Math.sin(Math.PI * x / L) ** 1.4;
  const S = (x, y) => { const d = dip(x); return [ax + ex * x + nx * (y + rk * d), ay + ey * x + ny * (y + rk * d) - zEnd + sag * d * (nearSign ? 1 : 0.3)]; };   // along, across: on screen, hung and sagging
  const Fl = (x, y) => [ax + ex * x + nx * y, ay + ey * x + ny * y];                                                                                            // the same on the floor
  const edge = (f, k, sc = 1) => xs.map(x => f(x, k * hw * prof(x) * sc));
  const poly = (pts, close = true) => { ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); if (close) ctx.closePath(); };
  const lens = (f, sc = 1) => [...edge(f, -1, sc), ...edge(f, 1, sc).reverse()];
  const ink = 'rgba(30,20,14,.22)';
  { const c = Fl(L / 2, 0), k = shadowScale(zEnd - sag, u);   // its shadow on the floor: the hero's rule, smaller the higher it hangs
    ctx.fillStyle = 'rgba(20,12,4,.2)'; poly(lens(Fl).map(([a, b]) => [c[0] + (a - c[0]) * k + u * 0.15, c[1] + (b - c[1]) * k + u * 0.1])); ctx.fill(); }
  const post = (px, py) => { ctx.fillStyle = 'rgba(40,28,16,.45)'; ctx.beginPath(); ctx.ellipse(px, py, u * 0.2, u * 0.07, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#4e3a24'; ctx.lineWidth = u * 0.13; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - zEnd - u * 0.1); ctx.lineTo(px - u * 0.14, py - zEnd - u * 0.36); ctx.moveTo(px, py - zEnd - u * 0.1); ctx.lineTo(px + u * 0.14, py - zEnd - u * 0.36); ctx.stroke(); };
  if (hm.head === 'bar') { const q = S(0, 0)[1]; ctx.fillStyle = hm.sheet; ctx.fillRect(ax - hw * 0.16, H * 0.3 - u * 0.1, hw * 0.32, q - H * 0.3 + u * 0.1); } else post(ax, ay);
  post(bx, by);
  poly(lens(S)); ctx.fillStyle = shade(hm.sheet, 10); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();   // the inside of the sheet
  ctx.save(); poly(lens(S)); ctx.clip(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,.03)';                   // faint pleats, tie to tie
  for (let k = -0.7; k <= 0.71; k += 0.35) { poly(xs.map(x => S(x, (k + 0.05 * Math.sin(x * 0.09 + k * 7)) * hw * prof(x))), false); ctx.stroke(); }
  ctx.restore();
  const wall = k => { const e = edge(S, k), low = e.map(([a, b], i) => [a, b + u * (nearSign ? 0.5 : 0.12) * dip(xs[i])]); poly([...e, ...low.reverse()]); ctx.fillStyle = hm.sheet; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke(); };   // the outside, below a hem
  const walls = () => { if (nearSign) wall(nearSign); else { wall(-1); wall(1); } };
  const hem = () => { if (!nearSign) return; ctx.strokeStyle = hm.hem; ctx.lineWidth = u * 0.06; poly(edge(S, nearSign), false); ctx.stroke(); };
  const quilt = (x0, x1) => { const e = xs.filter(x => x >= x0 && x <= x1), j = (x, k) => Math.sin(x * 0.3 + k * 3.1) * u * 0.035;   // a little lumpy, stitched across, just over the near rim
    const side = k => e.map((x, i) => S(x, k * hw * prof(x) * 0.97 + j(x, k) + (nearSign && k === nearSign ? u * 0.1 * Math.sin(Math.PI * i / (e.length - 1)) : 0)));
    poly([...side(-1), ...side(1).reverse()]); ctx.fillStyle = hm.quilt; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(30,20,14,.13)'; for (let x = x0 + (x1 - x0) / 4; x < x1 - 2; x += (x1 - x0) / 4) { const a = S(x, -hw * prof(x) * 0.9), b = S(x, hw * prof(x) * 0.9); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2 + ex * 5, (a[1] + b[1]) / 2 + ey * 5, b[0], b[1]); ctx.stroke(); } };
  const tongue = x => { if (!hm.cloth2) return; const k = nearSign || 1, [p, q] = S(x, k * hw * prof(x) * 0.95), dvx = nearSign ? 0 : k * nx, dvy = nearSign ? 1 : 0.5, l = 0.45 * u, w2 = 0.14 * u;   // one loose cloth over the rim
    ctx.fillStyle = hm.cloth2; ctx.beginPath(); ctx.moveTo(p - w2, q); ctx.quadraticCurveTo(p - w2 + dvx * l * 0.5, q + dvy * l * 0.6, p - w2 * 0.7 + dvx * l, q + dvy * l);
    ctx.lineTo(p + w2 * 0.6 + dvx * l * 0.92, q + dvy * l * 1.04); ctx.quadraticCurveTo(p + w2 + dvx * l * 0.4, q + dvy * l * 0.4, p + w2, q); ctx.closePath(); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(30,20,14,.25)'; ctx.beginPath(); ctx.moveTo(p, q + 4); ctx.lineTo(p + dvx * l * 0.8, q + dvy * l * 0.8); ctx.stroke(); };
  if (!who) { quilt(L * 0.4, L * (hm.roundFoot ? 0.7 : 0.74)); walls(); hem(); tongue(L * 0.58); return; }
  // someone in it: lying along it at the head end, the quilt pulled up over their lap with its collar folded back,
  // the wall in front; all of it kept inside the cloth
  const sz = u * (who === 'pip' ? PIP_SIZE : 1), col = who === 'pip' ? '#7ab8e0' : heroColor(), hxL = L * 0.34, [hx, hy] = S(hxL, 0), axis = Math.atan2(ey, ex);
  const inside = () => { ctx.save(); poly(lens(S, 0.96)); ctx.clip(); ctx.translate(hx, hy); ctx.rotate(axis - Math.PI / 2); ctx.translate(-hx, -hy); };   // local: down is toward the foot
  inside(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(hx - sz / 2, hy - sz * 0.5, sz, sz, sz * 0.08); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  quilt(hxL + sz * 0.15, L * (hm.roundFoot ? 0.78 : 0.84));
  inside();
  ctx.fillStyle = hm.quilt; ctx.beginPath(); ctx.moveTo(hx - sz * 0.7, hy + sz * 0.65); ctx.quadraticCurveTo(hx - sz * 0.62, hy + sz * 0.02, hx - sz * 0.2, hy + sz * 0.06); ctx.quadraticCurveTo(hx + sz * 0.1, hy - sz * 0.04, hx + sz * 0.64, hy + sz * 0.08); ctx.lineTo(hx + sz * 0.72, hy + sz * 0.65); ctx.closePath(); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
  ctx.fillStyle = hm.collar; ctx.beginPath(); ctx.moveTo(hx - sz * 0.62, hy + sz * 0.1); ctx.quadraticCurveTo(hx - sz * 0.2, hy - sz * 0.02, hx + sz * 0.1, hy); ctx.quadraticCurveTo(hx + sz * 0.4, hy - sz * 0.02, hx + sz * 0.64, hy + sz * 0.1); ctx.lineTo(hx + sz * 0.62, hy + sz * 0.24); ctx.quadraticCurveTo(hx, hy + sz * 0.14, hx - sz * 0.6, hy + sz * 0.24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  walls(); hem(); tongue(L * 0.6);
};
