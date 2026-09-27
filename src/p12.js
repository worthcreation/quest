
// =====================================================================
// The wind puzzle, made readable: landing ledges on every bank, a weathervane that shows the next gust,
// a dotted path that shows where a ride will land, and ravines that look like ravines.
// =====================================================================
// Wick's jetty: rooted on his bank beside the shack, pointing straight out into the current
function placeDock(sc) {
  const r = sc.river, [sx, sy] = sc.feat.farside, half = r.w * UNIT / 2;
  const R = [sx * W + UNIT * 3.4, sy * H + UNIT * 0.6];  // a few steps east of the shack
  let best = null;
  for (let i = 0; i < r.pts.length - 1; i++) {
    const ax = r.pts[i][0] * W, ay = r.pts[i][1] * H, bx = r.pts[i + 1][0] * W, by = r.pts[i + 1][1] * H, vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((R[0] - ax) * vx + (R[1] - ay) * vy) / (vx * vx + vy * vy))), qx = ax + vx * t, qy = ay + vy * t, d = Math.hypot(R[0] - qx, R[1] - qy);
    if (!best || d < best.d) best = { d, qx, qy };
  }
  const nx = (R[0] - best.qx) / best.d, ny = (R[1] - best.qy) / best.d;      // from the water toward Wick's bank
  const root = [best.qx + nx * (half + UNIT * 0.45), best.qy + ny * (half + UNIT * 0.45)];
  sc.feat.dock = [root[0] / W, root[1] / H];
  sc.feat.dockDir = [-nx, -ny];                                                // out over the water
}
// where you stand at the foot of the jetty, on dry ground (fractions)
function dockLanding() {
  const f = WORLD.riverbank.feat, [dx, dy] = f.dockDir || [0.5, 0.85];
  return [f.dock[0] - dx * UNIT * 1.1 / W, f.dock[1] - dy * UNIT * 1.1 / H];
}
// a jetty: two rows of posts, straight planks with a little wear, one board replaced; the raft ties up at the end
function drawJetty(sc) {
  const [fx, fy] = sc.feat.dock, [dx, dy] = sc.feat.dockDir || [0.5, 0.85], x = fx * W, y = fy * H, u = UNIT;
  // reaches a little under halfway across the water: 0.45 tiles of it over the bank, then 45% of the river's width
  const len = u * (0.45 + sc.river.w * 0.45), wid = u * 1.0, ang = Math.atan2(dy, dx), boards = Math.round(len / (u * 0.29));
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-u * 0.1, -wid / 2 + 4, len + u * 0.2, wid);          // shadow on the water
  for (let i = 0; i < boards; i++) {                                                                   // deck boards across the jetty
    const bx = i * len / boards, j = Math.sin(i * 12.9898) * 0.5, w0 = len / boards - 2;
    ctx.fillStyle = i === 3 ? '#9a7a4e' : i % 2 ? '#7a5a34' : '#83623a';                               // one board is newer wood
    ctx.fillRect(bx, -wid / 2 + j * 2, w0, wid + (i === boards - 2 ? -u * 0.08 : 0));
    ctx.fillStyle = 'rgba(40,26,14,.5)'; ctx.fillRect(bx + w0 * 0.5, -wid / 2 + u * 0.12, 2, 2); ctx.fillRect(bx + w0 * 0.5, wid / 2 - u * 0.16, 2, 2);   // nail heads
  }
  ctx.fillStyle = '#5a3f24'; ctx.fillRect(0, -wid / 2 - 2, len, 3); ctx.fillRect(0, wid / 2 - 1, len, 3);   // stringers
  ctx.fillStyle = '#4a3420';
  for (const px of [u * 0.15, len * 0.5, len - u * 0.12]) for (const py of [-wid / 2 - 3, wid / 2 - 3]) { ctx.fillRect(px - 3, py, 7, 7); }   // posts
  ctx.fillStyle = '#4a3420'; ctx.fillRect(len - u * 0.12 - 3, -wid / 2 - u * 0.45, 6, u * 0.45);        // a tall mooring post at the end
  if (state.inv.raft === 2) {                                                                          // the new raft, tied alongside the end
    ctx.save(); ctx.translate(len - u * 0.6, wid / 2 + u * 0.75); ctx.rotate(0.06);
    ctx.fillStyle = '#9a7a4a'; for (let i = 0; i < 4; i++) ctx.fillRect(-u * 0.75 + i * u * 0.38, -u * 0.5, u * 0.34, u * 1.0);
    ctx.strokeStyle = '#6b3a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-u * 0.75, -u * 0.25); ctx.lineTo(u * 0.75, -u * 0.25); ctx.moveTo(-u * 0.75, u * 0.25); ctx.lineTo(u * 0.75, u * 0.25); ctx.stroke();
    ctx.strokeStyle = '#c9b890'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(u * 0.7, -u * 0.4); ctx.quadraticCurveTo(u * 0.9, -u * 0.8, u * 0.8, -u * 1.2); ctx.stroke();   // the line to the post
    ctx.restore();
  }
  ctx.restore();
}
// Wick's shack: log walls, a lopsided roof with one board patched, a stone step, a crooked stovepipe. Sturdy, not neat.
function drawShack(x, y, u) {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 3, y + u * 0.55, u * 1.2, u * 0.3, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#8a8378'; ctx.fillRect(x - u * 0.95, y + u * 0.35, u * 1.75, u * 0.2);                 // stone footing
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - u * 0.9, y - u * 0.6, u * 1.65, u * 0.97);                  // walls
  ctx.strokeStyle = '#4e3520'; ctx.lineWidth = 1.5;
  for (let k = 1; k < 5; k++) { const yy = y - u * 0.6 + k * u * 0.19; ctx.beginPath(); ctx.moveTo(x - u * 0.9, yy); ctx.lineTo(x + u * 0.75 + (k === 3 ? u * 0.06 : 0), yy); ctx.stroke(); }   // log courses, one sticking out
  ctx.fillStyle = '#5a3f24'; ctx.fillRect(x - u * 0.98, y - u * 0.62, u * 0.12, u * 1.0); ctx.fillRect(x + u * 0.72, y - u * 0.62, u * 0.12, u * 1.0);   // corner posts
  ctx.fillStyle = '#3e2e1c'; ctx.beginPath(); ctx.moveTo(x - u * 1.18, y - u * 0.52); ctx.lineTo(x - u * 0.12, y - u * 1.35); ctx.lineTo(x + u * 1.02, y - u * 0.48); ctx.lineTo(x + u * 0.96, y - u * 0.4); ctx.lineTo(x - u * 1.12, y - u * 0.44); ctx.closePath(); ctx.fill();   // roof, longer on one side
  ctx.fillStyle = '#5c4a30'; ctx.beginPath(); ctx.moveTo(x + u * 0.25, y - u * 1.03); ctx.lineTo(x + u * 0.55, y - u * 0.8); ctx.lineTo(x + u * 0.48, y - u * 0.72); ctx.lineTo(x + u * 0.18, y - u * 0.95); ctx.fill();   // a patched board
  ctx.fillStyle = '#3a3a3e'; ctx.fillRect(x + u * 0.42, y - u * 1.35, u * 0.14, u * 0.42); ctx.fillRect(x + u * 0.38, y - u * 1.4, u * 0.22, u * 0.07);   // stovepipe, a touch crooked
  ctx.fillStyle = '#2a1c10'; ctx.fillRect(x - u * 0.28, y - u * 0.18, u * 0.42, u * 0.55);                // door
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - u * 0.32, y - u * 0.22, u * 0.5, u * 0.06);                 // lintel
  ctx.fillStyle = '#9fc8d8'; ctx.fillRect(x + u * 0.28, y - u * 0.35, u * 0.3, u * 0.22); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 1.5; ctx.strokeRect(x + u * 0.28, y - u * 0.35, u * 0.3, u * 0.22);   // window
  ctx.fillStyle = '#9a948a'; ctx.beginPath(); ctx.ellipse(x - u * 0.07, y + u * 0.46, u * 0.32, u * 0.11, 0, 0, 6.28); ctx.fill();   // stone step
}
// Ledges: grassy shelves on each bank, five across where there's room. Rides land on them; wind can't move you on them.
function layoutLedges(sc) {
  sc.rocks = (sc.rocks || []).filter(r => !r.ledge);
  const edges = [0.12].concat((sc.chasms || []).flatMap(c => [c[1], c[3]])).concat([0.9]).sort((a, b) => a - b);
  const R = mulberry32(((sc.ledgeSeed || 0.5) * 1e9) >>> 0), bands = [];
  for (let k = 0; k + 1 < edges.length; k++) { const a = edges[k], b = edges[k + 1]; if (b - a > 0.06 && !(sc.chasms || []).some(c => (a + b) / 2 > c[1] && (a + b) / 2 < c[3] && c[0] <= 0.01 && c[2] >= 0.99)) bands.push((a + b) / 2); }
  for (const fy of bands) for (let i = 0; i < 5; i++) {
    const fx = 0.15 + i * 0.175 + (R() - 0.5) * 0.04, x = fx * W, y = fy * H;
    if (isChasm(x, y, UNIT * 0.85)) continue;
    if (state.solids.some(s => Math.hypot(s.x - x, s.y - y) < s.r + UNIT * 1.1)) continue;
    sc.rocks.push({ fx, fy, r: 0.8, ledge: true });
  }
  // the weathervane: somewhere open on the top bank, where you'll see it before you commit
  const vy = bands.length ? bands[0] : 0.25;
  let vane = null;
  for (const fx of [0.85, 0.15, 0.7, 0.3, 0.5]) {
    const x = fx * W, y = vy * H - UNIT * 0.4;
    if (!isChasm(x, y, UNIT) && !state.solids.some(s => Math.hypot(s.x - x, s.y - y) < s.r + UNIT * 1.4) && !sc.rocks.some(r => r.ledge && Math.hypot(r.fx * W - x, r.fy * H - y) < UNIT * 1.6)) { vane = [fx, y / H]; break; }
  }
  sc.feat.vane = null;                                // no vane: the plants tell you
}
// where a gust ride from here would land: the nearest ledge within a cone around the wind's direction
function windTarget(sc, from) {
  const h = from || state.hero, g = sc.gusts && sc.gusts[state.gustIdx];
  if (!g) return null;
  const dx0 = Math.sin(g.a), dy0 = Math.cos(g.a), maxD = Math.max(H * 0.55, UNIT * 8);
  let best = null, bd = Infinity;
  for (const r of sc.rocks || []) {
    if (!r.ledge) continue;
    const x = r.fx * W, y = r.fy * H, dx = x - h.x, dy = y - h.y, d = Math.hypot(dx, dy);
    if (d < UNIT * 1.4 || d > maxD) continue;
    const ang = Math.acos(Math.max(-1, Math.min(1, (dx * dx0 + dy * dy0) / d)));
    if (ang > 0.75) continue;
    const score = ang * 3 + d / H;                       // closest to the wind's line first, then nearest
    if (score < bd) { bd = score; best = [x, y]; }
  }
  return best;
}
// the vane: turns to where the next gust will blow; its ring fills as the gust comes
function drawVane(sc) {
  const v = sc.feat.vane; if (!v || !sc.gusts) return;
  const x = v[0] * W, y = v[1] * H, u = UNIT * 1.5, n = sc.gusts.length;
  const g = state.gustPhase === 'lull' ? sc.gusts[(state.gustIdx + 1) % n] : sc.gusts[state.gustIdx];
  const want = Math.atan2(Math.cos(g.a), Math.sin(g.a));
  let cur = state.vaneA ?? want, diff = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  state.vaneA = cur + diff * 0.08;
  const T = { lull: 2.4, build: 1.2, blow: 1.4 }, frac = Math.min(1, state.gustT / T[state.gustPhase]);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 3, y + u * 0.15, u * 0.7, u * 0.25, 0, 0, 6.28); ctx.fill();
  ctx.strokeStyle = 'rgba(40,30,20,.5)'; ctx.lineWidth = u * 0.12; ctx.beginPath(); ctx.arc(x, y - u * 0.9, u * 0.55, 0, 6.28); ctx.stroke();
  ctx.strokeStyle = state.gustPhase === 'blow' ? '#ffffff' : state.gustPhase === 'build' ? '#ffe38a' : 'rgba(255,255,255,.5)';
  ctx.beginPath(); ctx.arc(x, y - u * 0.9, u * 0.55, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();   // time to the next change
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - u * 0.05, y - u * 0.9, u * 0.1, u * 0.95);
  ctx.save(); ctx.translate(x, y - u * 0.9); ctx.rotate(state.vaneA);
  ctx.fillStyle = '#c9a46a'; ctx.beginPath(); ctx.moveTo(u * 0.5, 0); ctx.lineTo(u * 0.18, -u * 0.18); ctx.lineTo(u * 0.18, u * 0.18); ctx.fill();
  ctx.fillRect(-u * 0.35, -u * 0.035, u * 0.6, u * 0.07);
  ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.moveTo(-u * 0.3, 0); ctx.lineTo(-u * 0.48, -u * 0.18); ctx.lineTo(-u * 0.48, u * 0.18); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#c9a46a'; ctx.beginPath(); ctx.arc(x, y - u * 0.9, u * 0.07, 0, 6.28); ctx.fill();
}
// the ride preview: while a gust builds or blows, a dotted arc from you to the ledge you'd land on
function drawWindPath(sc) {
  const h = state.hero;
  if (!sc.gusts || h.ride || h.z > 0 || state.gustPhase === 'lull') return;
  const tgt = windTarget(sc); if (!tgt) return;
  const blow = state.gustPhase === 'blow', d = Math.hypot(tgt[0] - h.x, tgt[1] - h.y), lift = UNIT * (1.6 + d / H * 3);
  for (let i = 1; i < 22; i++) {                        // dots marching along the path, dark-edged so they read on grass
    const p = i / 22, x = h.x + (tgt[0] - h.x) * p, y = h.y + (tgt[1] - h.y) * p - Math.sin(Math.PI * p) * lift;
    if ((i + Math.floor(state.time * 8)) % 3 === 0) continue;
    ctx.fillStyle = 'rgba(20,20,20,.35)'; ctx.beginPath(); ctx.arc(x, y + 1.5, UNIT * 0.13, 0, 6.28); ctx.fill();
    ctx.fillStyle = blow ? '#ffffff' : '#ffe38a'; ctx.beginPath(); ctx.arc(x, y, UNIT * 0.11, 0, 6.28); ctx.fill();
  }
  ctx.strokeStyle = blow ? '#ffffff' : 'rgba(255,227,138,.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(tgt[0], tgt[1], UNIT * (0.7 + 0.1 * Math.sin(state.time * 6)), UNIT * 0.35, 0, 0, 6.28); ctx.stroke();
}
// ravines: crumbling lips with grass hanging over, a rock face with strata on the far side, mist, a stream far below
function drawRavines(sc) {
  const t = state.time, u = UNIT;
  for (const [x0, y0, x1, y1] of sc.chasms || []) {
    const X0 = x0 * W, Y0 = y0 * H, X1 = x1 * W, Y1 = y1 * H, hgt = Y1 - Y0;
    const g = ctx.createLinearGradient(0, Y0, 0, Y1);
    g.addColorStop(0, '#3a2c1e'); g.addColorStop(0.35, '#1a140f'); g.addColorStop(0.75, '#0a0808'); g.addColorStop(1, '#231b12');
    ctx.fillStyle = g; ctx.fillRect(X0, Y0, X1 - X0, hgt);
    const face = Math.min(hgt * 0.38, u * 1.1);           // the far wall's face, layered rock
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(120,90,60,.35)' : 'rgba(90,66,44,.35)'; ctx.fillRect(X0, Y0 + face * k / 4, X1 - X0, face / 4); }
    ctx.strokeStyle = 'rgba(30,22,14,.45)'; ctx.lineWidth = 1;
    for (let x = X0; x < X1; x += u * 1.3) { ctx.beginPath(); ctx.moveTo(x, Y0 + face * 0.2); ctx.lineTo(x + u * 0.2, Y0 + face * 0.7); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(120,180,200,.55)'; ctx.lineWidth = Math.max(1.5, u * 0.07);   // a stream glinting far below
    ctx.beginPath(); for (let x = X0; x <= X1; x += u * 0.4) { const yy = Y0 + hgt * 0.78 + Math.sin(x * 0.02 + 1) * u * 0.12; x === X0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();
    ctx.fillStyle = 'rgba(220,240,250,.7)';
    for (let i = 0; i < 6; i++) { const x = X0 + ((i * 0.37 + t * 0.05) % 1) * (X1 - X0); ctx.fillRect(x, Y0 + hgt * 0.78 + Math.sin(x * 0.02 + 1) * u * 0.12 - 1, 3, 2); }
    for (let i = 0; i < 4; i++) {                          // mist drifting through
      const x = X0 + (((i * 0.29 + t * 0.02 * (i % 2 ? 1 : -1)) % 1 + 1) % 1) * (X1 - X0), yy = Y0 + hgt * (0.45 + 0.1 * Math.sin(t * 0.5 + i));
      ctx.fillStyle = 'rgba(200,210,215,.10)'; ctx.beginPath(); ctx.ellipse(x, yy, u * 2.2, hgt * 0.14, 0, 0, 6.28); ctx.fill();
    }
    ctx.strokeStyle = '#4e3a24'; ctx.lineWidth = 1.5;         // roots dangling from the near lip
    for (let x = X0 + u * 0.7; x < X1; x += u * 2.3) { if (isChasm(x, Y0 - 4)) continue; ctx.beginPath(); ctx.moveTo(x, Y0 + 2); ctx.quadraticCurveTo(x + u * 0.2 + Math.sin(t + x) * 2, Y0 + face * 0.6, x - u * 0.05, Y0 + face * 1.1); ctx.stroke(); }
    const lip = (yy, dir) => {                              // crumbling earth and overhanging grass along each edge
      for (let x = X0; x < X1; x += u * 0.5) {
        if (isChasm(x + u * 0.25, yy - dir * 4)) continue;
        const j = Math.sin(x * 0.13) * 0.5 + 0.5;
        ctx.fillStyle = '#6a5438'; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + u * 0.25, yy + dir * u * (0.18 + 0.2 * j)); ctx.lineTo(x + u * 0.5, yy); ctx.fill();
        ctx.fillStyle = '#6d8a3e'; ctx.beginPath(); ctx.moveTo(x, yy - dir * 2); ctx.lineTo(x + u * 0.12, yy + dir * u * 0.12 * j); ctx.lineTo(x + u * 0.3, yy - dir * 2); ctx.fill();
      }
    };
    lip(Y0, 1); lip(Y1, -1);
  }
  const h = state.hero;                                    // pebbles skitter off the edge near you
  if (sc.chasms && Math.hypot(h.vx, h.vy) > UNIT && Math.random() < 0.25 && h.z <= 0 && isChasm(h.x + h.vx * 0.12, h.y + h.vy * 0.12 + UNIT * 0.6))
    state.fx.push({ x: h.x + (Math.random() - 0.5) * UNIT * 0.6, y: h.y + UNIT * 0.5, vx: (Math.random() - 0.5) * UNIT, vy: UNIT * 3, t: 0, life: 0.7, color: 'rgba(90,70,50,.85)', size: UNIT * 0.08 });
}
// ledges: a raised earth shelf with a grass rim and a worn patch in the middle
function drawLedge(x, y, R) {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 2, y + R * 0.3, R * 1.05, R * 0.55, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#6a5438'; ctx.beginPath(); ctx.ellipse(x, y + R * 0.15, R, R * 0.58, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#7a9a48'; ctx.beginPath(); ctx.ellipse(x, y, R * 0.95, R * 0.5, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = 'rgba(150,120,80,.55)'; ctx.beginPath(); ctx.ellipse(x, y + R * 0.02, R * 0.45, R * 0.2, 0, 0, 6.28); ctx.fill();
}
// the landing shadow: nothing on the way up; from the top of the arc a small shadow appears where you'll land,
// growing to your full size as you come down onto it
function drawLandingShadow() {
  const h = state.hero, r = h.ride;
  if (!r || !r.wind) return;
  const p = Math.min(1, r.t / r.dur);
  if (p < 0.5) return;
  const k = 0.15 + 0.85 * ((p - 0.5) / 0.5);
  ctx.fillStyle = `rgba(0,0,0,${0.3 + 0.2 * k})`;
  ctx.beginPath(); ctx.ellipse(r.x1 + 2, r.y1 + UNIT * 0.45, UNIT * 0.55 * k, UNIT * 0.2 * k, 0, 0, 6.28); ctx.fill();
}
// during a ride: the edges of the screen dim so the crossing is the focus
function drawRideVignette() {
  const h = state.hero;
  if (!h.ride || !h.ride.wind) return;
  const p = Math.min(1, h.ride.t / h.ride.dur), k = Math.sin(Math.PI * p) * 0.35;
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,12,20,${k})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// mud wallows: dark, wet, a slow shine on top; bubbles now and then
function drawMud(sc) {
  for (const [fx, fy, r] of sc.mud || []) {
    const x = fx * W, y = fy * H, rx = r * UNIT, ry = r * UNIT * 0.62;
    ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.ellipse(x, y, rx * 1.06, ry * 1.08, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#34240f'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(20,12,4,.45)'; ctx.beginPath(); ctx.ellipse(x + rx * 0.1, y + ry * 0.12, rx * 0.7, ry * 0.6, 0, 0, 6.28); ctx.fill();
    const s = 0.5 + 0.5 * Math.sin(state.time * 0.6 + fx * 9);
    ctx.fillStyle = `rgba(255,236,200,${0.06 + 0.06 * s})`; ctx.beginPath(); ctx.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.35, ry * 0.12, -0.15, 0, 6.28); ctx.fill();
    for (let k = 0; k < 3; k++) {                                   // a bubble swells and pops
      const per = 3.2 + k * 1.3, ph = ((state.time + k * 1.7 + fx * 5) % per) / per;
      if (ph > 0.25) continue;
      const bx = x + Math.cos(k * 2.3 + fy * 11) * rx * 0.55, by = y + Math.sin(k * 2.3 + fy * 11) * ry * 0.5, br = UNIT * 0.1 * Math.sin(ph / 0.25 * Math.PI);
      ctx.strokeStyle = 'rgba(120,90,60,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx, by, Math.max(0.5, br), Math.PI, 0); ctx.stroke();
    }
  }
}
