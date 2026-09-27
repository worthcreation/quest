
// =====================================================================
// Drawing: one scene painter for every area. Areas differ by palette,
// ground detail, and how much shade the lighting pass lays over them.
// =====================================================================
const PAL = {
  green: { trunk: '#5a3d22', leaf: ['#23572c', '#2e6c38', '#3a7d42'] },
  deep:  { trunk: '#3e2a18', leaf: ['#153a1d', '#1c4724', '#24552c'] },
  grey:  { trunk: '#6b5a48' },
  bog:   { trunk: '#2d2a22' },
};
// three branch patterns for dead trees: [height along trunk, angle, length, twig?]
const BRANCHES = [
  [[0.55, -0.9, 0.55, 1], [0.8, 0.8, 0.5, 0], [0.95, -0.3, 0.35, 0]],
  [[0.45, 1.0, 0.6, 1], [0.7, -1.1, 0.45, 1], [0.9, 0.4, 0.3, 0]],
  [[0.6, -1.3, 0.7, 0], [0.62, 1.2, 0.55, 1], [0.92, -0.5, 0.3, 1]],
];

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const c = state.cam, sc = sceneDef();
  ctx.save();
  if (state.shake > 0) { const m = state.shake * UNIT * 0.5; ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m); }
  ctx.translate(W / 2, H / 2); ctx.scale(c.ez, c.ez); ctx.translate(-c.ex, -c.ey);
  drawScene(sc);
  ctx.restore();
  if (state.dusk && sc.area !== 'indoor') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(60,40,110,.36)'); g.addColorStop(1, 'rgba(200,100,60,.18)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);   // twilight
    if (state.inv.lantern) {                          // the candle lantern: a warm pool of light around you, flickering a little
      const [lx, ly] = toScreen(state.hero.x, state.hero.y - state.hero.z), f = 0.9 + 0.1 * Math.sin(state.time * 11) + 0.05 * Math.sin(state.time * 27);
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, UNIT * 4 * f); lg.addColorStop(0, 'rgba(255,200,120,.28)'); lg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, UNIT * 4, 0, 6.28); ctx.fill();
    }
  }
  drawRideVignette();
  drawActionHint();
  drawHUD();
  drawRadial();
  if (state.flash > 0) { ctx.fillStyle = `rgba(235,240,255,${state.flash * 0.8})`; ctx.fillRect(0, 0, W, H); }
  if (state.fade > 0.01) { ctx.fillStyle = `rgba(0,0,0,${state.fade})`; ctx.fillRect(0, 0, W, H); }
  drawTexts();
  drawChoice();
  drawTitle();
  if (state.menu) drawMenu();
}

function drawScene(sc) {
  const dark = sc.area === 'cave' || sc.area === 'hollow';
  if (sc.id === 'rapids') { drawRapids(); drawFx(); return; }
  ctx.fillStyle = sc.floor; ctx.fillRect(0, 0, W, H);
  if (sc.wade) drawWaterScreen(sc); else if (sc.area === 'peak') drawCrags(sc); else drawGround(sc);
  if (sc.river) drawRiver(sc);
  if (sc.area === 'river' && sc.pools.length) drawPools(sc);
  drawRiverQuest(sc);
  if (sc.feat.signs) drawArenaSigns(sc);
  if (sc.rocks && sc.rocks.length) drawRockBanks(sc);
  if (sc.feat.buildSpots) drawBuildSpots(sc);
  if (sc.gusts) drawLandingShadow();
  if (sc.feat.portals) drawPuzzlePortals(sc);
  drawShadows();
  for (const s of state.solids) if (s.kind !== 'tree' && s.kind !== 'deadtree') drawSolid(s);
  drawPlots(sc);
  drawWebs();
  drawItems();
  drawGas(false);
  for (const z of state.hazards) { const k = Math.max(0, z.t / z.dur); ctx.fillStyle = `rgba(0,0,0,${0.2 + k * 0.4})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * k, z.r * 0.5 * k, 0, 0, 6.28); ctx.fill(); }
  for (const b of state.flock) if (b.z <= 0) drawSmallBird(b);
  // everything that stands up is drawn back to front by where it touches the ground,
  // so the hero passes behind a trunk above them and in front of one below
  const layer = [];
  for (const s of state.solids) if (s.kind === 'tree' || s.kind === 'deadtree') layer.push([s.y, () => drawTree(s)]);
  for (const pl of sc.pullables) layer.push([pl.fy * H + UNIT * 0.35, () => drawPullable(sc, pl)]);
  for (const e of state.enemies) layer.push([e.y, () => {
    if (e.falling > 0) {                               // shrinking away into the depths
      const k = e.falling / 0.7; ctx.save(); ctx.globalAlpha = k; ctx.translate(e.x, e.y + (1 - k) * UNIT * 0.6); ctx.scale(k, k); ctx.translate(-e.x, -e.y); drawEnemy(e); ctx.restore();
    } else drawEnemy(e);
  }]);
  for (const n of sc.npcs) if (npcHere(n)) layer.push([n.fy * H, () => drawNpc(n)]);
  if (state.pip && state.pip.show && (state.pip.follow || sc.id === 'camp' || sc.id === 'start')) layer.push([state.pip.y, () => { const py = state.pip.y - (state.pip.hz || 0); drawPerson(state.pip.x, py, '#7ab8e0', 0); if (state.pip.bound) drawVineWrap(state.pip.x, py); }]);
  if (state.gremlins && sc.id === 'w2') for (const g of state.gremlins) layer.push([g.y, () => drawEnemy({ type: g.book ? 'thief' : 'gremlin', x: g.x, y: g.y - (g.hz || 0), r: UNIT * 0.42, mode: 'dart', t: 1, flash: 0, vx: 1 })]);
  if (state.gremlins && sc.id === 'start') for (const g of state.gremlins) layer.push([g.y, () => drawEnemy({ type: g.book ? 'thief' : 'gremlin', x: g.x, y: g.y, r: UNIT * 0.42, mode: 'dart', t: 1, flash: 0, vx: 1 })]);
  layer.push([state.hero.y, drawHero]);
  const gl = state.glimpse;
  if (gl && gl.t > 0 && !gl.gone) layer.push([gl.y, () => {
    const shrink = gl.down ? 1 - Math.max(0, (gl.t - 1.9) / 0.4) : 1;
    ctx.save(); ctx.translate(gl.x, gl.y); ctx.scale(shrink, shrink); ctx.translate(-gl.x, -gl.y);
    drawPerson(gl.x, gl.y, '#7ab8e0', 0); drawVineWrap(gl.x, gl.y);
    for (const s of [-1, 1]) drawEnemy({ type: 'gremlin', x: gl.x + s * UNIT * 0.8, y: gl.y + UNIT * 0.2, r: UNIT * 0.42, mode: 'dart', t: 1, flash: 0, vx: 1 });
    ctx.restore();
  }]);
  layer.sort((a, b) => a[0] - b[0]).forEach(l => l[1]());
  drawShots();
  for (const b of state.flock) if (b.z > 0) drawSmallBird(b);
  if (state.bird) drawBird();
  for (const z of state.hazards) { const k = Math.max(0, z.t / z.dur); if (k > 0) { if (z.kind === 'stalactite') drawStalactite(z.x, z.y - (1 - k) * H * 0.6, z.r); else drawRock(z.x, z.y - (1 - k) * H * 0.6, z.r * 0.7); } }
  for (const g of state.rings) { const rad = g.r0 + (g.r1 - g.r0) * (g.t / g.dur); ctx.strokeStyle = `rgba(200,190,170,${0.7 * (1 - g.t / g.dur)})`; ctx.lineWidth = UNIT * 0.3; ctx.beginPath(); ctx.ellipse(g.x, g.y, rad, rad * 0.8, 0, 0, 6.28); ctx.stroke(); }
  drawDiverThreads();
  if (!dark) drawEyesDaylight();
  drawFx();
  if (sc.area === 'field') drawClouds(sc);
  if (sc.area === 'marsh' || sc.area === 'swamp') drawFog();
  drawLighting(sc);
  if (sc.drips) drawDrips();
  if (dark) for (const e of state.enemies) drawEnemyEyes(e);
  drawGas(true);
  drawSwordGlint(sc);
  if (sc.id === 'camp' && state.night > 0) drawSky();
  if (state.aim.on) drawAim();
  if (state.whirl) {                               // the beat: a ring closes in on you; strike as it touches
    const w = state.whirl, h = state.hero, k = Math.max(0, (w.next - state.time) / w.beat);
    const r = UNIT * (0.9 + k * 2.4);
    ctx.strokeStyle = k < 0.25 ? 'rgba(255,230,120,.95)' : 'rgba(255,245,210,.55)'; ctx.lineWidth = k < 0.25 ? 4 : 2;
    ctx.beginPath(); ctx.ellipse(h.x, h.y, r, r * 0.8, 0, 0, 6.28); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,245,210,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(h.x, h.y, UNIT * 0.9, UNIT * 0.72, 0, 0, 6.28); ctx.stroke();
  }
  if (state.blind > 0) { ctx.fillStyle = `rgba(250,255,235,${Math.min(0.92, state.blind / 1.8)})`; ctx.fillRect(-W, -H, W * 3, H * 3); }
}
function drawChoice() {
  const c = state.choice; if (!c) return;
  const fs = Math.round(Math.max(14, Math.min(19, UNIT * 0.52)));
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  const optW = c.options.map(o => ctx.measureText(o).width + 28), total = optW.reduce((a, b) => a + b, 0) + 10 * (c.options.length - 1);
  const bw = Math.max(ctx.measureText(c.text).width + 30, total + 20), bh = fs * 3.6;
  let [sx, sy] = toScreen(c.x, c.y); sy -= bh; if (sy < 50) sy = 50;
  sx = Math.max(bw / 2 + 8, Math.min(W - bw / 2 - 8, sx));
  ctx.fillStyle = 'rgba(10,8,14,.8)'; ctx.fillRect(sx - bw / 2, sy, bw, bh);
  ctx.textAlign = 'center'; ctx.fillStyle = '#fdf6e3'; ctx.fillText(c.text, sx, sy + fs * 1.3);
  let ox = sx - total / 2;
  state.choiceRects = [];
  c.options.forEach((o, i) => {
    const sel = i === c.sel;
    ctx.fillStyle = sel ? 'rgba(242,201,76,.35)' : 'rgba(255,255,255,.08)'; ctx.fillRect(ox, sy + fs * 1.9, optW[i], fs * 1.4);
    ctx.fillStyle = sel ? '#ffe38a' : '#fdf6e3'; ctx.fillText(o, ox + optW[i] / 2, sy + fs * 2.95);
    state.choiceRects.push({ x: ox, y: sy + fs * 1.9, w: optW[i], h: fs * 1.4, i });
    ox += optW[i] + 10;
  });
  ctx.textAlign = 'left';
}
function drawWebs() {
  for (const w of state.webs || []) {
    if (w.burn) {
      const k = w.burn / 1.7, g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 1.3);
      g.addColorStop(0, `rgba(255,220,130,${0.8 * (1 - k)})`); g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 1.3, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      continue;
    }
    ctx.strokeStyle = 'rgba(220,220,210,.45)'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + w.x * 0.01; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * 0.7); ctx.stroke(); }
    for (const k of [0.35, 0.65, 0.95]) { ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r * k, w.r * k * 0.7, 0, 0, 6.28); ctx.stroke(); }
  }
  for (const fl of state.floaters || []) {
    ctx.fillStyle = `rgba(232,216,255,${0.5 + 0.4 * Math.sin(state.time * 3 + fl.a)})`;
    ctx.beginPath(); ctx.arc(fl.x, fl.y, UNIT * 0.1, 0, 6.28); ctx.fill();
  }
}
function drawVineWrap(x, y) {
  ctx.strokeStyle = '#3f7a32'; ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y - UNIT * 0.3 + i * UNIT * 0.22, UNIT * 0.6, UNIT * 0.14, 0.2 * (i % 2 ? 1 : -1), 0, 6.28); ctx.stroke(); }
}
function drawStalactite(x, y, r) {
  ctx.fillStyle = '#4a4450'; ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 1.4); ctx.lineTo(x + r * 0.5, y - r * 1.4); ctx.lineTo(x, y + r * 0.6); ctx.fill();
  ctx.fillStyle = '#5c5664'; ctx.beginPath(); ctx.moveTo(x - r * 0.2, y - r * 1.4); ctx.lineTo(x + r * 0.05, y - r * 1.4); ctx.lineTo(x, y + r * 0.3); ctx.fill();
}
function drawSmallBird(b) {
  if (b.mode === 'gone') return;
  const s = UNIT * 0.26 * (1 + b.z / (UNIT * 5)), y = b.y - b.z - (b.hop ? UNIT * 0.1 : 0);
  if (b.z > 0) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + UNIT * 0.3, s * 0.5, s * 0.2, 0, 0, 6.28); ctx.fill(); }
  ctx.fillStyle = b.c;
  if (b.mode === 'peck') {
    const dip = Math.sin(state.time * 6 + b.x) > 0.7 ? s * 0.15 : 0;
    ctx.beginPath(); ctx.ellipse(b.x, y, s * 0.5, s * 0.36, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + s * 0.4, y - s * 0.2 + dip, s * 0.22, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#e8c04a'; ctx.fillRect(b.x + s * 0.58, y - s * 0.22 + dip, s * 0.18, s * 0.08);
  } else {
    const flap = Math.sin(state.time * 32 + b.x) * s * 0.8;
    ctx.beginPath(); ctx.ellipse(b.x, y, s * 0.4, s * 0.28, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x - s * 1.1, y - flap); ctx.lineTo(b.x - s * 0.2, y + s * 0.1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + s * 1.1, y - flap); ctx.lineTo(b.x + s * 0.2, y + s * 0.1); ctx.fill();
  }
}

// ---------------- ground ----------------
function drawGround(sc) {
  const f = sc.feat;
  if (sc.area === 'indoor') { if (sc.feat.tentRoom) drawTentRoom(); else drawRoom(); }
  if (sc.area === 'forest' || sc.area === 'woods' || sc.area === 'river') {
    for (const d of sc.deco) {
      if (d.kind === 'flower') { ctx.fillStyle = d.c; ctx.fillRect(d.fx * W, d.fy * H, 3, 3); }
      if (d.kind === 'grass') { ctx.strokeStyle = sc.area === 'woods' ? '#24552c' : '#357a40'; ctx.lineWidth = 1.5; const x = d.fx * W, y = d.fy * H, s = UNIT * 0.3 * d.s; ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.lineTo(x - s * 0.6, y - s); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 1.2); ctx.moveTo(x + s * 0.4, y); ctx.lineTo(x + s * 0.6, y - s); ctx.stroke(); }
    }
    for (const p of f.plates || []) {                // stone plates, sunk and glowing when held down
      const x = p.fx * W, y = p.fy * H, on = state.plateOn[p.id];
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + 3, UNIT * 0.85, UNIT * 0.45, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = on ? '#6a6a62' : '#8e8e84'; ctx.beginPath(); ctx.ellipse(x, y + (on ? 3 : 0), UNIT * 0.8, UNIT * 0.42, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = on ? `rgba(160,230,140,${0.6 + 0.3 * Math.sin(state.time * 4)})` : 'rgba(60,60,55,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y + (on ? 3 : 0), UNIT * 0.45, UNIT * 0.22, 0, 0, 6.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - UNIT * 0.2, y + (on ? 3 : 0)); ctx.lineTo(x + UNIT * 0.2, y + (on ? 3 : 0)); ctx.stroke();
    }
    if (f.stone) {                                 // the sinkhole
      const x = f.stone[0] * W, y = f.stone[1] * H;
      ctx.fillStyle = '#0c0a08'; ctx.beginPath(); ctx.ellipse(x, y, UNIT * 0.9, UNIT * 0.6, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 3; ctx.stroke();
    }
  } else if (sc.area === 'field') {
    for (let i = 0; i < 5; i++) {
      const y = H * (i / 4) + Math.sin(i * 1.7) * UNIT;
      const g = ctx.createLinearGradient(0, y - UNIT * 3, 0, y + UNIT * 3);
      g.addColorStop(0, 'rgba(255,255,200,0)'); g.addColorStop(0.5, i % 2 ? 'rgba(255,250,190,.10)' : 'rgba(30,50,20,.12)'); g.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = g; ctx.fillRect(0, y - UNIT * 3, W, UNIT * 6);
    }
    drawRavines(sc);
    const [wx, wy] = gustVec(), bend = wx * (0.25 + state.gust * 0.9);
    ctx.strokeStyle = sc.depth > 4 ? '#6d7f3e' : '#5f8a3a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const d of sc.deco) {
      const x = d.fx * W, y = d.fy * H, s = UNIT * 0.45 * d.s, sw = bend + Math.sin(state.time * 3 + d.ph) * 0.15;
      for (const o of [-0.35, 0, 0.35]) { ctx.moveTo(x + o * s, y); ctx.quadraticCurveTo(x + o * s + sw * s * 0.3, y - s * 0.6, x + o * s + sw * s, y - s * (1 - wy * 0.3 * state.gust)); }
    }
    ctx.stroke();
    for (const s of f.plants || []) drawGustGrass(s[0] * W, s[1] * H, sc);
  } else if (sc.area === 'cave' || sc.area === 'hollow') {
    for (const r of sc.deco) {
      ctx.fillStyle = r.shade > 0.5 ? (sc.area === 'hollow' ? '#232a1e' : '#26222c') : '#15131a';
      ctx.beginPath(); ctx.ellipse(r.fx * W, r.fy * H, UNIT * r.s * 0.7, UNIT * r.s * 0.42, 0, 0, 6.28); ctx.fill();
    }
    drawPools(sc);
    if (f.falls) drawFalls(rtFor(sc.id).bossDead);
    if (f.darkShroom && rtFor(sc.id).flags.darkshroom) {
      const x = f.darkShroom[0] * W, y = f.darkShroom[1] * H;
      ctx.fillStyle = '#1a1414'; ctx.beginPath(); ctx.ellipse(x, y, UNIT * 1.1, UNIT * 0.45, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#2e2622'; ctx.fillRect(x - UNIT * 0.15, y - UNIT * 0.5, UNIT * 0.3, UNIT * 0.5);
    }

  } else if (sc.area === 'marsh' || sc.area === 'swamp') {
    drawPools(sc);
    ctx.strokeStyle = '#6b7a40'; ctx.lineWidth = 2;
    for (const d of sc.deco) {
      const x = d.fx * W, y = d.fy * H, s = UNIT * 0.7 * d.s, sw = Math.sin(state.time * 1.5 + d.ph) * s * 0.1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y - s); ctx.moveTo(x + 4, y); ctx.lineTo(x + 4 + sw, y - s * 0.8); ctx.stroke();
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + sw - 2, y - s - 4, 4, 8);
    }
  }
  drawMud(sc);
  drawLooseHints(sc);
}
function drawPools(sc) {
  if (sc.area === 'river') {                           // still, gleaming water you can wade into
    for (const p of state.pools) {
      ctx.fillStyle = '#6b5a3a'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r + UNIT * 0.35, (p.r + UNIT * 0.35) * 0.72, 0, 0, 6.28); ctx.fill();
      const g = ctx.createRadialGradient(p.x - p.r * 0.2, p.y - p.r * 0.2, 0, p.x, p.y, p.r);
      g.addColorStop(0, '#6fc0d0'); g.addColorStop(0.6, '#3f8fa8'); g.addColorStop(1, '#2f6f8a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.72, 0, 0, 6.28); ctx.fill();
      if (sc.feat.gleam) for (let i = 0; i < 14; i++) {
        const a = i * 2.4, rr2 = p.r * (0.2 + (i % 5) * 0.15), k = 0.5 + 0.5 * Math.sin(state.time * 2.5 + i * 1.7);
        ctx.fillStyle = `rgba(255,255,240,${0.7 * k})`;
        const x = p.x + Math.cos(a) * rr2, y = p.y + Math.sin(a) * rr2 * 0.72;
        ctx.fillRect(x - 1, y - 4 * k, 2, 8 * k); ctx.fillRect(x - 4 * k, y - 1, 8 * k, 2);
      }
    }
    return;
  }
  for (const p of state.pools) {
    ctx.fillStyle = sc.area === 'hollow' ? '#0f1512' : '#1c2a24'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = sc.area === 'hollow' ? 'rgba(60,90,90,.25)' : 'rgba(90,140,150,.3)';        // water sheen
    ctx.beginPath(); ctx.ellipse(p.x - p.r * 0.2, p.y - p.r * 0.18, p.r * 0.55, p.r * 0.22, -0.2, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(40,55,40,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, 0, 0, 6.28); ctx.stroke();   // muddy bank
    ctx.strokeStyle = 'rgba(150,180,160,.25)'; ctx.lineWidth = 1.5;
    const k = (state.time * 0.4 + p.x) % 1;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 0.5 * (0.5 + k), p.r * 0.35 * (0.5 + k), 0, 0, 6.28); ctx.stroke();
    if (sc.area === 'marsh') { ctx.fillStyle = '#4c6b3a'; ctx.beginPath(); ctx.ellipse(p.x - p.r * 0.4, p.y + p.r * 0.2, UNIT * 0.3, UNIT * 0.2, 0, 0.3, 6); ctx.fill(); }
  }
}
// the river: muddy banks, deep water, current streaks that run downstream, stepping stones
function drawRiver(sc) {
  const r = sc.river, width = r.wH ? r.wH * H : r.w * UNIT;
  const path = () => { ctx.beginPath(); r.pts.forEach(([fx, fy], i) => ctx[i ? 'lineTo' : 'moveTo'](fx * W, fy * H)); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = width + UNIT * 0.9; path(); ctx.stroke();       // mud bank
  ctx.strokeStyle = '#2f6f8a'; ctx.lineWidth = width; path(); ctx.stroke();                     // deep water
  ctx.strokeStyle = '#3f86a0'; ctx.lineWidth = width * 0.55; path(); ctx.stroke();              // lighter channel
  // current: dashes carried along lanes parallel to the centreline, always upstream to downstream
  const lanes = r.wH ? [-0.3, -0.12, 0.06, 0.24] : [-0.22, 0, 0.22];
  ctx.lineWidth = Math.max(1.5, UNIT * 0.06);
  for (const off of lanes) {
    ctx.save();
    const [a, b] = [r.pts[0], r.pts[r.pts.length - 1]];
    const dx = (b[0] - a[0]) * W, dy = (b[1] - a[1]) * H, l = Math.hypot(dx, dy) || 1;
    ctx.translate(-dy / l * off * width, dx / l * off * width);                                  // shift sideways across the flow
    ctx.strokeStyle = 'rgba(210,235,245,.45)';
    ctx.setLineDash([UNIT * 0.6, UNIT * 1.4]);
    ctx.lineDashOffset = -((state.time * UNIT * 3.5 + off * 400) % (UNIT * 2));
    path(); ctx.stroke();
    ctx.restore();
  }
  ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.lineCap = 'butt';
  for (const [fx, fy, rU] of r.stones || []) {
    const x = fx * W, y = fy * H, rr_ = rU * UNIT;
    ctx.strokeStyle = 'rgba(220,240,245,.5)'; ctx.lineWidth = 2;                                 // wake on the upstream (east) side
    ctx.beginPath(); ctx.arc(x, y, rr_ * 1.15, -Math.PI * 0.35, Math.PI * 0.35); ctx.stroke();
    drawRock(x, y, rr_);
  }
  for (const d of sc.deco) if (d.kind === 'reedbank') {
    const x = d.fx * W, y = d.fy * H;
    ctx.strokeStyle = '#6b7a40'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 4, y); ctx.lineTo(x + i * 5 + Math.sin(state.time * 2 + i) * 2, y - UNIT * 0.6); ctx.stroke(); }
  }
}
// the rapids: banks that bend past, white water streaking by, rocks with foam, the falls' lip at the end
function drawRapids() {
  const r = state.rapids || newRapids(), ry = H * RAPIDS.raftY;
  ctx.fillStyle = '#2f6f8a'; ctx.fillRect(0, 0, W, H);
  const Dat = y => r.dist + (ry - y) / H;
  for (const side of [-1, 1]) {                       // the banks
    ctx.beginPath(); ctx.moveTo(side < 0 ? 0 : W, -10);
    for (let y = -10; y <= H + 10; y += 10) { const [cx, hw] = rapidsChannel(Dat(y)); ctx.lineTo(cx + side * (hw + UNIT * 0.4), y); }
    ctx.lineTo(side < 0 ? 0 : W, H + 10); ctx.closePath(); ctx.fillStyle = '#6b5a3a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(side < 0 ? 0 : W, -10);
    for (let y = -10; y <= H + 10; y += 10) { const [cx, hw] = rapidsChannel(Dat(y)); ctx.lineTo(cx + side * (hw + UNIT * 1.0), y); }
    ctx.lineTo(side < 0 ? 0 : W, H + 10); ctx.closePath(); ctx.fillStyle = '#4a7a44'; ctx.fill();
  }
  ctx.strokeStyle = 'rgba(220,240,250,.45)'; ctx.lineWidth = Math.max(1.5, UNIT * 0.06);   // white water rushing past
  const i0 = Math.floor((r.dist - 0.4) / 0.04);           // streaks fixed to the water, so they stream past as you go
  for (let i = i0; i < i0 + 45; i++) {
    const D = i * 0.04, [cx, hw] = rapidsChannel(D), hsh = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const x = cx + (hsh * 2 - 1) * hw * 0.9, y = ry - (D - r.dist) * H;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + UNIT * (0.6 + hsh * 0.8)); ctx.stroke();
  }
  for (const k of r.rocks) {
    const y = ry - (k.D - r.dist) * H;
    if (y < -UNIT * 2 || y > H + UNIT * 2) continue;
    ctx.strokeStyle = 'rgba(235,245,255,.75)'; ctx.lineWidth = 3;          // foam on the upstream side
    ctx.beginPath(); ctx.arc(k.x * W, y, k.r * UNIT * 1.25, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    drawRock(k.x * W, y, k.r * UNIT);
  }
  const lip = ry - (RAPIDS.len - r.dist) * H;          // the edge of the falls
  if (lip > -UNIT * 2) {
    ctx.fillStyle = 'rgba(200,225,240,.35)'; ctx.fillRect(0, Math.max(0, lip - UNIT * 3), W, UNIT * 3);
    ctx.fillStyle = '#f2f8fb'; ctx.fillRect(0, lip - UNIT * 0.3, W, UNIT * 0.6);
  }
  const h = state.hero, bob = Math.sin((r.t || 0) * 5) * 2;
  if (r.phase !== 'wreck') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(r.x - UNIT * 0.85, ry - UNIT * 0.35 + 4, UNIT * 1.7, UNIT * 1.1);
    ctx.fillStyle = '#9a7a4a';
    for (let i = 0; i < 4; i++) if (i < r.planks + 1) ctx.fillRect(r.x - UNIT * 0.8 + i * UNIT * 0.4, ry - UNIT * 0.35 + bob, UNIT * 0.36, UNIT * 1.05);
    ctx.strokeStyle = '#6b3a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x - UNIT * 0.8, ry - UNIT * 0.1 + bob); ctx.lineTo(r.x + UNIT * 0.8, ry - UNIT * 0.1 + bob); ctx.stroke();
  }
  if (r.invuln <= 0 || Math.floor(state.time * 12) % 2) drawHero();
}
function drawRapidsHud() {
  const r = state.rapids;
  if (!r || state.menu) return;
  const w = Math.min(W * 0.6, 320), h = 30, x = (W - w) / 2, y = 10;
  ctx.fillStyle = 'rgba(10,8,14,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h); ctx.fill();
  for (let i = 0; i < RAPIDS.planks; i++) { ctx.fillStyle = i < r.planks ? '#c9a46a' : 'rgba(255,255,255,.15)'; ctx.fillRect(x + 10 + i * 16, y + 7, 12, 16); }
  const px = x + 70, pw = w - 84;
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(px, y + 12, pw, 6);
  ctx.fillStyle = '#9fd4ff'; ctx.fillRect(px, y + 12, pw * Math.min(1, r.dist / RAPIDS.len), 6);
  ctx.fillStyle = '#f2f8fb'; ctx.fillRect(px + pw - 3, y + 8, 3, 14);
  state.arenaBanner = { x, y, w, h };
}
// the gleaming pool: shallows everywhere, a deep blue middle, the falls down the east side
function drawWaterScreen(sc) {
  const d = sc.deep, t = state.time;
  ctx.fillStyle = '#5aa6b8'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(120,150,110,.35)';              // pebbly shallows near the rocks
  for (let i = 0; i < 60; i++) { const x = (i * 0.618 % 1) * W, y = (i * 0.377 % 1) * H; ctx.beginPath(); ctx.ellipse(x, y, UNIT * 0.25, UNIT * 0.15, 0, 0, 6.28); ctx.fill(); }
  if (d) {
    const g = ctx.createRadialGradient(d.fx * W, d.fy * H, 0, d.fx * W, d.fy * H, Math.max(d.rx * W, d.ry * H));
    g.addColorStop(0, '#15415a'); g.addColorStop(0.75, '#1f5a74'); g.addColorStop(1, '#3a86a0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(d.fx * W, d.fy * H, d.rx * W, d.ry * H, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(200,235,245,.35)'; ctx.lineWidth = 2; ctx.stroke();
  }
  for (let i = 0; i < 26; i++) {                        // gleams
    const k = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 1.7), x = ((i * 0.618 + 0.1) % 1) * W, y = ((i * 0.414 + 0.2) % 1) * H;
    ctx.fillStyle = `rgba(255,255,240,${0.75 * k})`; ctx.fillRect(x - 1, y - 4 * k, 2, 8 * k); ctx.fillRect(x - 4 * k, y - 1, 8 * k, 2);
  }
  const f = sc.feat.falls;
  if (f) {                                             // the waterfall pouring in from the east
    const x0 = f[0] * W, y0 = f[1] * H, y1 = f[2] * H;
    ctx.fillStyle = '#e8f3f8'; ctx.fillRect(x0, y0, W - x0, y1 - y0);
    ctx.strokeStyle = 'rgba(150,190,210,.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const xx = x0 + ((i * 0.618) % 1) * (W - x0), off = (t * UNIT * 9 + i * 23) % (y1 - y0); ctx.beginPath(); ctx.moveTo(xx, y0 + off); ctx.lineTo(xx, y0 + off + UNIT * 0.6); ctx.stroke(); }
    ctx.fillStyle = 'rgba(245,250,255,.75)';           // churn at the foot
    for (let i = 0; i < 8; i++) { const yy = y0 + (i + 0.5) / 8 * (y1 - y0); ctx.beginPath(); ctx.arc(x0 - UNIT * 0.3, yy, UNIT * (0.5 + 0.2 * Math.sin(t * 6 + i)), 0, 6.28); ctx.fill(); }
    if (Math.random() < 0.7) state.fx.push({ x: x0 - UNIT * 0.4, y: y0 + Math.random() * (y1 - y0), vx: -UNIT * (1 + Math.random() * 2), vy: -UNIT * Math.random(), t: 0, life: 0.8, color: 'rgba(235,245,255,.7)', size: UNIT * 0.18 });
  }
}
// rock banks: flat grey slabs, mossy on top; the ones out in a ravine have a shadowed rim
function drawRockBanks(sc) {
  for (const r of sc.rocks) {
    const x = r.fx * W, y = r.fy * H, R = r.r * UNIT;
    if (r.ledge) { drawLedge(x, y, R); continue; }
    if (r.island) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, y + R * 0.25, R * 1.05, R * 0.8, 0, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#7d7870'; ctx.beginPath(); ctx.ellipse(x, y + R * 0.1, R, R * 0.72, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#a19b92'; ctx.beginPath(); ctx.ellipse(x, y, R * 0.92, R * 0.62, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(110,140,80,.45)'; ctx.beginPath(); ctx.ellipse(x - R * 0.3, y - R * 0.15, R * 0.35, R * 0.18, -0.3, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(50,45,40,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + R * 0.1, y - R * 0.3); ctx.lineTo(x + R * 0.35, y + R * 0.2); ctx.stroke();
  }
}
// the crags: bare stone, cracks, a few tough tufts, and ravines with dark depths
function drawCrags(sc) {
  ctx.fillStyle = sc.floor; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {                        // speckle and cracks
    const x = ((i * 0.618 + 0.13) % 1) * W, y = ((i * 0.377 + 0.07) % 1) * H;
    ctx.fillStyle = i % 3 ? 'rgba(60,56,52,.18)' : 'rgba(200,195,188,.18)'; ctx.beginPath(); ctx.ellipse(x, y, UNIT * 0.3, UNIT * 0.14, i, 0, 6.28); ctx.fill();
    if (i % 5 === 0) { ctx.strokeStyle = 'rgba(50,46,42,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + UNIT * 0.5, y + UNIT * 0.3); ctx.lineTo(x + UNIT * 0.7, y + UNIT * 0.8); ctx.stroke(); }
  }
  for (const [x0, y0, x1, y1] of sc.chasms || []) {
    const X0 = x0 * W, Y0 = y0 * H, X1 = x1 * W, Y1 = y1 * H;
    const g = ctx.createLinearGradient(0, Y0, 0, Y1); g.addColorStop(0, '#1c1a1e'); g.addColorStop(0.5, '#0c0b0e'); g.addColorStop(1, '#2a2629');
    ctx.fillStyle = g; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    ctx.fillStyle = '#6b665f';                          // jagged lips
    for (let x = X0; x < X1; x += UNIT * 0.5) { ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x + UNIT * 0.25, Y0 + UNIT * 0.18 * (1 + Math.sin(x))); ctx.lineTo(x + UNIT * 0.5, Y0); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, Y1); ctx.lineTo(x + UNIT * 0.25, Y1 - UNIT * 0.15 * (1 + Math.cos(x))); ctx.lineTo(x + UNIT * 0.5, Y1); ctx.fill(); }
  }
  for (const d of sc.deco) if (d.kind === 'tuft') { const x = d.fx * W, y = d.fy * H; ctx.strokeStyle = '#7f8f5a'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 3, y); ctx.lineTo(x + i * 4 + Math.sin(state.time * 2 + d.ph) * 2, y - UNIT * 0.35 * d.s); ctx.stroke(); } }
}
// Old Wick's shack: plank floor, log walls, a window, a lived-in mess
function drawRoom() {
  const u = UNIT;
  ctx.fillStyle = '#6b4e32'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#5a3f28'; ctx.lineWidth = 2;
  for (let y = u * 0.6; y < H; y += u * 0.6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = '#4a3220'; ctx.fillRect(0, 0, W, u * 1.2); ctx.fillRect(0, 0, u * 1.1, H); ctx.fillRect(W - u * 1.1, 0, u * 1.1, H);
  ctx.fillRect(0, H - u * 1.0, W * 0.35, u); ctx.fillRect(W * 0.65, H - u * 1.0, W * 0.35, u);
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; for (let x = u * 0.5; x < W; x += u * 1.4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, u * 1.2); ctx.stroke(); }
  ctx.fillStyle = '#9fc8d8'; ctx.fillRect(W * 0.45, u * 0.25, u * 1.4, u * 0.7); ctx.strokeStyle = '#3a2616'; ctx.strokeRect(W * 0.45, u * 0.25, u * 1.4, u * 0.7);   // window
  const g = ctx.createLinearGradient(0, u, 0, u * 5); g.addColorStop(0, 'rgba(255,250,210,.25)'); g.addColorStop(1, 'rgba(255,250,210,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W * 0.45, u * 1.2); ctx.lineTo(W * 0.45 + u * 1.4, u * 1.2); ctx.lineTo(W * 0.5 + u * 2.4, u * 5); ctx.lineTo(W * 0.4, u * 5); ctx.fill();
  ctx.strokeStyle = 'rgba(200,190,150,.6)'; ctx.lineWidth = 1;                   // a fishing net on the wall
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(W * 0.15 + i * u * 0.3, u * 0.2); ctx.lineTo(W * 0.15 + i * u * 0.3 + u * 0.6, u * 1.1); ctx.moveTo(W * 0.15 + i * u * 0.3 + u * 0.6, u * 0.2); ctx.lineTo(W * 0.15 + i * u * 0.3, u * 1.1); ctx.stroke(); }
  ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.ellipse(W * 0.45, H * 0.62, u * 1.6, u * 0.8, 0, 0, 6.28); ctx.fill();   // rag rug
  ctx.fillStyle = 'rgba(200,200,200,.18)'; for (let i = 0; i < 3; i++) { const t = (state.time * 0.3 + i / 3) % 1; ctx.beginPath(); ctx.arc(W * 0.82 + Math.sin(t * 6) * 4, H * 0.2 - u * 0.8 - t * u * 1.5, u * (0.15 + t * 0.2), 0, 6.28); ctx.fill(); }   // a stale curl of smoke
}
// the sidequest's pieces: the far-bank camp, the jetty and raft, ripples, the tunnel's gleam, the cascade
function drawRiverQuest(sc) {
  const f = sc.feat, u = UNIT, inv = state.inv;
  if (f.farside) {
    const x = f.farside[0] * W, y = f.farside[1] * H;
    drawShack(x, y, u);
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + u * 1.3, y - u * 0.9, u * 0.1, u * 1.1); ctx.fillRect(x + u * 0.95, y - u * 1.05, u * 0.8, u * 0.4);   // sign
    ctx.fillStyle = '#3a2614'; ctx.fillRect(x + u * 1.05, y - u * 0.95, u * 0.6, u * 0.05); ctx.fillRect(x + u * 1.05, y - u * 0.82, u * 0.45, u * 0.05);
    if (!rtFor(sc.id).flags.salvaged) { ctx.fillStyle = '#9a7a4a'; for (let i = 0; i < 3; i++) ctx.fillRect(x - u * 0.4 + i * u * 0.3, y + u * 0.9, u * 0.22, u * 0.9); }   // Wick's unfinished raft
    else { ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x - u * 0.4, y + u * 1.6, u * 0.8, u * 0.12); }
  }
  if (f.dock) drawJetty(sc);
  if (f.oldJetty) drawOldJetty(sc);
  for (const [x, y, i] of fishSpots(sc)) {             // rising fish: rings that spread and fade, always in the water
    const k = (state.time * 0.7 + i * 0.37) % 1;
    ctx.strokeStyle = `rgba(230,245,250,${0.7 * (1 - k)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y, u * (0.2 + k * 0.8), u * (0.12 + k * 0.5), 0, 0, 6.28); ctx.stroke();
  }
  if (f.tunnel) {                                       // a gleam deep under the water
    const x = f.tunnel[0] * W, y = f.tunnel[1] * H, k = 0.5 + 0.5 * Math.sin(state.time * 2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, u * 1.2);
    g.addColorStop(0, `rgba(200,255,240,${0.35 + 0.35 * k})`); g.addColorStop(1, 'rgba(200,255,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, u * 1.2, u * 0.85, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(10,30,40,.55)'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.55, u * 0.35, 0, 0, 6.28); ctx.fill();
  }
  if (sc.river && sc.river.fall) {                       // the cascade: a white wall of falling water and spray
    const [fx, fy] = sc.river.fall, x = fx * W, y = fy * H, w = sc.river.w * u;
    ctx.fillStyle = 'rgba(240,250,255,.85)'; ctx.fillRect(x - w * 0.6, y - u * 0.4, w * 1.2, u * 1.1);
    ctx.strokeStyle = 'rgba(200,225,240,.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const xx = x - w * 0.55 + i * w * 0.12, off = (state.time * u * 8 + i * 17) % (u * 1.1); ctx.beginPath(); ctx.moveTo(xx, y - u * 0.4 + off); ctx.lineTo(xx, y - u * 0.1 + off); ctx.stroke(); }
    if (Math.random() < 0.6) state.fx.push({ x: x + (Math.random() - 0.5) * w, y: y + u * 0.8, vx: (Math.random() - 0.5) * u * 2, vy: -u * (0.5 + Math.random()), t: 0, life: 0.9, color: 'rgba(235,245,255,.7)', size: u * 0.2 });
  }
  const fi = state.fish;                                // the line and bobber while fishing
  if (fi) {
    const h = state.hero, bob = fi.phase === 'bite' ? Math.sin(state.time * 40) * 3 + 3 : Math.sin(state.time * 3) * 1.5;
    ctx.strokeStyle = 'rgba(230,230,220,.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(h.x + h.side * UNIT * 0.6, h.y - UNIT * 0.9); ctx.quadraticCurveTo((h.x + fi.x) / 2, Math.min(h.y, fi.y) - UNIT, fi.x, fi.y + bob); ctx.stroke();
    ctx.fillStyle = '#e04a3a'; ctx.beginPath(); ctx.arc(fi.x, fi.y + bob, UNIT * 0.12, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#f2efe6'; ctx.beginPath(); ctx.arc(fi.x, fi.y + bob - UNIT * 0.06, UNIT * 0.06, 0, 6.28); ctx.fill();
  }
  if (state.cut && state.cut.type === 'raft') {         // the raft under your feet
    const h = state.hero;
    ctx.fillStyle = '#9a7a4a'; for (let i = 0; i < 4; i++) ctx.fillRect(h.x - UNIT * 0.8 + i * UNIT * 0.4, h.y - UNIT * 0.2, UNIT * 0.36, UNIT * 1.0);
  }
}
// tall grass by each updraft: it leans the way the next gust will blow, harder for stronger gusts
function drawGustGrass(x, y, sc) {
  const g = sc.gusts[state.gustIdx];
  const up = state.gust;                               // the plants are the gauge: a gentle lean, then flattened by the strong gust
  const lean = up * g.s, wx = Math.sin(g.a), wy = Math.cos(g.a);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 3, UNIT * 0.6, UNIT * 0.18, 0, 0, 6.28); ctx.fill();
  ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    const bx = x + i * UNIT * 0.12, hgt = UNIT * (1.3 + (i % 2 ? 0.25 : 0)), sway = Math.sin(state.time * (3 + g.s * 8) + i) * 0.08 * up;
    const tx = bx + (wx * lean * 0.9 + sway) * hgt, ty = y - hgt * (1 - lean * 0.55) + wy * lean * hgt * 0.45;
    ctx.strokeStyle = i % 2 ? '#8a9a4a' : '#a4ae5a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx, y - hgt * 0.5, tx, ty); ctx.stroke();
    ctx.fillStyle = '#c9b870'; ctx.beginPath(); ctx.ellipse(tx, ty, 3, 6, Math.atan2(ty - y, tx - bx) + Math.PI / 2, 0, 6.28); ctx.fill();
  }
  ctx.lineCap = 'butt';
}

// farm patches of rich soil, in every region
function drawPlots(sc) {
  const f = sc.feat;
  if (!f.plots) return;
      const plots = rtFor(sc.id).flags.plots || [];
      f.plots.forEach(([px, py], i) => {
        const x = px * W, y = py * H, p = plots[i] || { s: 0 }, st = plotStage(p);
        drawPatch(x, y, p.lv != null ? p.lv : (f.plotLv || 0), i);
        const S = SEEDS[seedOfPlot(p, sc, i)], crop = cropOfPlot(p, sc, i);
        if (p.s && S.yields && st >= 1) {                // rare crops: a plant of their own colour, the material showing when ripe
          ctx.save(); ctx.translate(x, y);
          ctx.strokeStyle = S.color; ctx.lineWidth = 2;
          for (let b = -1; b <= 1; b++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(b * UNIT * 0.2, -UNIT * 0.3 * st, b * UNIT * 0.25, -UNIT * 0.25 * st); ctx.stroke(); }
          if (st >= 3) { drawItemIcon(S.yields[0], 0, -UNIT * 0.8, UNIT * 0.7); if (Math.sin(state.time * 3 + i) > 0.9) spark(x, y - UNIT * 0.8, S.color, 1, 1); }
          ctx.restore();
        } else if (p.s) { ctx.save(); ctx.translate(x, y); ctx.scale(0.4 + st * 0.25, 0.4 + st * 0.25); if (st >= 3) drawItemIcon(crop, 0, 0, UNIT); else { ctx.fillStyle = '#5aa04a'; ctx.fillRect(-2, -UNIT * 0.3, 4, UNIT * 0.3); if (st) { ctx.beginPath(); ctx.ellipse(-5, -UNIT * 0.3, 6, 3, -0.5, 0, 6.28); ctx.ellipse(5, -UNIT * 0.3, 6, 3, 0.5, 0, 6.28); ctx.fill(); } } ctx.restore(); }
      });
    }

// a farm patch at each level: a tuft of rich soil, turned rich soil, a framed bed, a stone-edged raised bed
function drawPatch(x, y, lv, seed) {
  const u = UNIT, j = k => Math.sin(seed * 12.9898 + k * 78.233) * 0.5;       // small fixed wobbles per patch
  if (lv === 0) {
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, u * 0.5, u * 0.3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#4e3620';
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + (k - 2) * u * 0.16 + j(k) * u * 0.1, y + j(k + 9) * u * 0.1, u * (0.2 + 0.05 * j(k + 3)), u * 0.14, j(k + 5), 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#6a4a2c'; for (let k = 0; k < 4; k++) ctx.fillRect(x + (k - 1.5) * u * 0.18 + j(k + 11) * 4, y - u * 0.04 + j(k + 13) * 4, 3, 2);   // crumbs of rich earth
    ctx.strokeStyle = '#5f8a3a'; ctx.lineWidth = 1.5;
    for (const [ox, oy] of [[-0.45, -0.12], [0.42, 0.1], [0.1, -0.24]]) { ctx.beginPath(); ctx.moveTo(x + ox * u, y + oy * u); ctx.lineTo(x + ox * u - 2, y + oy * u - u * 0.18); ctx.moveTo(x + ox * u, y + oy * u); ctx.lineTo(x + ox * u + 3, y + oy * u - u * 0.15); ctx.stroke(); }
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - u * 0.5 + 2, y - u * 0.4 + 3, u, u * 0.8);
  if (lv >= 3) {                                            // raised bed: stone edging all round
    ctx.fillStyle = '#8f887c'; ctx.fillRect(x - u * 0.55, y - u * 0.44, u * 1.1, u * 0.88);
    ctx.fillStyle = '#a39b8e'; for (let k = 0; k < 6; k++) ctx.fillRect(x - u * 0.55 + k * u * 0.185, y - u * 0.44, u * 0.16, u * 0.08);
  }
  ctx.fillStyle = lv >= 3 ? '#4a321c' : '#6b4a2a'; ctx.fillRect(x - u * 0.45, y - u * 0.35, u * 0.9, u * 0.7);
  ctx.strokeStyle = lv >= 3 ? '#3a2614' : '#4e331b'; ctx.lineWidth = 2;
  for (const o of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(x - u * 0.38, y + o * u + j(o * 10) * 2); ctx.lineTo(x + u * 0.38, y + o * u - j(o * 10) * 2); ctx.stroke(); }
  if (lv >= 2) {                                            // a wooden frame with corner pegs
    ctx.strokeStyle = '#a07a48'; ctx.lineWidth = 3; ctx.strokeRect(x - u * 0.47, y - u * 0.37, u * 0.94, u * 0.74);
    ctx.fillStyle = '#c9a46a'; for (const [cx, cy] of [[-0.47, -0.37], [0.47, -0.37], [-0.47, 0.37], [0.47, 0.37]]) ctx.fillRect(x + cx * u - 2.5, y + cy * u - 5, 5, 7);
  }
  if (lv >= 3 && Math.sin(state.time * 2 + seed) > 0.96) spark(x + j(state.time) * u * 0.6, y - u * 0.1, 'rgba(255,170,90,.8)', 1, 1);   // warm ember soil
}
// ---------------- trees and solids ----------------
function drawShadows() {
  for (const s of state.solids) if (s.kind === 'tree' || s.kind === 'deadtree') {
    const sz = s.vis / UNIT;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(s.x + UNIT * 0.2, s.y + UNIT * 0.2, UNIT * (s.kind === 'tree' ? 1.0 : 0.5) * sz, UNIT * 0.45 * sz, 0, 0, 6.28); ctx.fill();
  }
}
function drawTree(s) {
  const sz = s.vis / UNIT, u = UNIT * sz, dir = s.flip ? -1 : 1;
  const shook = state.time - (state.treeShake[s.key] || -9);
  const wob = shook < 0.4 ? Math.sin(shook * 40) * (0.4 - shook) * 0.25 : 0;
  ctx.save(); ctx.translate(s.x, s.y); ctx.scale(dir, 1); ctx.rotate(wob);
  if (s.kind === 'tree') {
    const P = PAL[s.pal] || PAL.green;
    ctx.fillStyle = P.trunk; ctx.fillRect(-u * 0.18, -u * 0.6, u * 0.36, u * 0.7);
    const lobes = [
      [[0, -1.0, 0.95, 0], [-0.25, -1.2, 0.55, 1]],
      [[-0.4, -0.9, 0.62, 0], [0.4, -0.95, 0.6, 0], [0, -1.35, 0.62, 1], [-0.1, -1.1, 0.4, 2]],
      [[0, -1.15, 0.7, 0], [0, -1.75, 0.45, 1], [0.25, -0.9, 0.5, 0], [-0.15, -1.5, 0.3, 2]],
    ][s.v];
    for (const [lx, ly, lr, c] of lobes) { ctx.fillStyle = P.leaf[c]; ctx.beginPath(); ctx.arc(lx * u, ly * u, lr * u, 0, 6.28); ctx.fill(); }
  } else {
    const P = PAL[s.pal] || PAL.grey;
    ctx.strokeStyle = P.trunk; ctx.lineCap = 'round';
    const hgt = u * 1.6;
    ctx.lineWidth = u * 0.26; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(u * 0.05, -hgt); ctx.stroke();
    for (const [at, ang, len, twig] of BRANCHES[s.v]) {
      const y = -hgt * at, ex = Math.sin(ang) * len * u, ey = y - Math.cos(ang) * len * u * 0.7;
      ctx.lineWidth = u * 0.1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ex, ey); ctx.stroke();
      if (twig) { ctx.lineWidth = u * 0.05; ctx.beginPath(); ctx.moveTo(ex * 0.7, y + (ey - y) * 0.7); ctx.lineTo(ex * 0.7 + Math.sign(ex) * u * 0.2, ey - u * 0.2); ctx.stroke(); }
    }
    if (sceneDef().id === 'meadow' && Math.abs(s.fx - WORLD.meadow.feat.perches[0][0]) < 1e-6) {   // the robin's hollow
      ctx.fillStyle = '#1a120c'; ctx.beginPath(); ctx.ellipse(u * 0.03, -u * 0.9, u * 0.09, u * 0.13, 0, 0, 6.28); ctx.fill();
    }
    ctx.lineCap = 'butt';
  }
  ctx.restore();
}
function drawRock(x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.35, r, r * 0.45, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#8a8a80'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#a3a397'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.32, -0.3, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#5a4a36'; ctx.beginPath(); ctx.ellipse(x + r * 0.2, y + r * 0.45, r * 0.55, r * 0.18, 0, 0, 6.28); ctx.fill();
}
function drawSolid(s) {
  const { x, y, vis: r, kind } = s, u = UNIT;
  switch (kind) {
    case 'stalagmite': {
      const moss = s.pal === 'moss', cr = (state.stalCool[s.key] || 0) > state.time;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x + r * 0.2, y + r * 0.25, r * 0.8, r * 0.35, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = moss ? '#2c3526' : '#3a3440'; ctx.beginPath(); ctx.moveTo(x - r * 0.75, y + r * 0.2); ctx.lineTo(x - r * 0.15, y - r * 1.6); ctx.lineTo(x + r * 0.1, y - r * 1.3); ctx.lineTo(x + r * 0.75, y + r * 0.2); ctx.fill();
      ctx.fillStyle = moss ? '#3a4632' : '#4a4452'; ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * 0.1); ctx.lineTo(x - r * 0.15, y - r * 1.5); ctx.lineTo(x - r * 0.05, y + r * 0.1); ctx.fill();
      if (cr) { ctx.strokeStyle = '#15121a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 0.2, y - r * 0.6); ctx.lineTo(x + r * 0.1, y - r * 0.2); ctx.lineTo(x - r * 0.1, y + r * 0.1); ctx.stroke(); }
      break;
    }
    case 'vine':
      ctx.strokeStyle = '#2f5a26'; ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) { const a = i * 2.1 + s.fx * 7; ctx.beginPath(); ctx.arc(x, y, r * (0.6 + i * 0.2), a, a + 2.4); ctx.stroke(); }
      ctx.fillStyle = '#4a8a3a'; for (let i = 0; i < 4; i++) { const a = i * 1.6 + s.fy * 5; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.22, r * 0.12, a, 0, 6.28); ctx.fill(); }
      break;
    case 'boulder': case 'cavewall': case 'pillar': {
      const cave = kind !== 'boulder', moss = s.pal === 'moss';
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.2, r, r * 0.8, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = moss ? '#262e22' : cave ? '#2e2a33' : '#8a8a80';
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.85, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = moss ? '#33402a' : cave ? '#3b3640' : '#a3a397';
      ctx.beginPath(); ctx.ellipse(x - r * 0.25 * (s.flip ? -1 : 1), y - r * 0.25, r * 0.5, r * 0.35, -0.3, 0, 6.28); ctx.fill();
      if (!cave) { ctx.fillStyle = '#6f7a58'; ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.4, r * 0.35, r * 0.18, 0, 0, 6.28); ctx.fill(); }
      break;
    }
    case 'stump':
      ctx.fillStyle = '#4a321c'; ctx.beginPath(); ctx.ellipse(x, y + u * 0.15, u * 0.6, u * 0.35, 0, 0, 6.28); ctx.fill();
      ctx.fillRect(x - u * 0.6, y - u * 0.1, u * 1.2, u * 0.25);
      ctx.fillStyle = '#7d6242'; ctx.beginPath(); ctx.ellipse(x, y - u * 0.1, u * 0.6, u * 0.32, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#5d4630'; ctx.lineWidth = 1.5;
      for (const k of [0.56, 0.29]) { ctx.beginPath(); ctx.ellipse(x, y - u * 0.1, u * 0.6 * k, u * 0.32 * k, 0, 0, 6.28); ctx.stroke(); }
      break;
    case 'campfire': {
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; ctx.fillStyle = '#7a7a70'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * u * 0.42, y + Math.sin(a) * u * 0.28, u * 0.12, 0, 6.28); ctx.fill(); }
      ctx.strokeStyle = '#4a2f1a'; ctx.lineWidth = u * 0.1; ctx.beginPath(); ctx.moveTo(x - u * 0.25, y + u * 0.1); ctx.lineTo(x + u * 0.25, y - u * 0.1); ctx.moveTo(x - u * 0.25, y - u * 0.1); ctx.lineTo(x + u * 0.25, y + u * 0.1); ctx.stroke();
      if (state.fireLit !== 0) {
        const fl = 1 + 0.15 * Math.sin(state.time * 17) + 0.1 * Math.sin(state.time * 29);
        const g = ctx.createRadialGradient(x, y - u * 0.2, 0, x, y - u * 0.2, u * 0.5 * fl);
        g.addColorStop(0, '#fff1a0'); g.addColorStop(0.5, '#ff9a3a'); g.addColorStop(1, 'rgba(255,80,20,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - u * 0.2, u * 0.5 * fl, 0, 6.28); ctx.fill();
        if (Math.random() < 0.1) state.fx.push({ x, y: y - u * 0.4, vx: (Math.random() - 0.5) * u, vy: -u * 1.5, t: 0, life: 0.8, color: '#ffb347' });
      } else if (Math.random() < 0.05) state.fx.push({ x, y: y - u * 0.2, vx: 0, vy: -u * 0.4, t: 0, life: 1.5, color: 'smoke', size: u * 0.2 });
      break;
    }
    case 'shroom': {                               // traveler's mushroom: tall pale stem, glowing violet cap
      const found = s.dark || state.inv.shrooms[sceneDef().id], glow = found ? shroomGlow(x * 0.01, state.time) : 0.06 + 0.03 * Math.sin(state.time * 0.3);
      drawShroomRipples(x, y, u, found, sceneDef().id);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + u * 0.2, u * 0.8, u * 0.25, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - u * 0.15, y - u * 1.1, u * 0.3, u * 1.25);
      const g = ctx.createRadialGradient(x, y - u * 1.2, 0, x, y - u * 1.2, u * (1.2 + glow * 1.4));
      g.addColorStop(0, `rgba(210,175,255,${0.1 + 0.45 * glow})`); g.addColorStop(1, 'rgba(210,175,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - u * 2.8, y - u * 4, u * 5.6, u * 5.6);
      ctx.fillStyle = found ? '#9a6ad8' : '#7a5aa8'; ctx.beginPath(); ctx.ellipse(x, y - u * 1.15, u * 0.85, u * 0.5, 0, Math.PI, 0); ctx.fill();
      [[-0.4, -1.35], [0.1, -1.5], [0.45, -1.3], [-0.1, -1.25]].forEach(([dx, dy], k) => { const sp = found ? shroomGlow(k * 1.7 + x * 0.01, state.time * 0.9) : 0.15; ctx.fillStyle = `rgba(245,232,255,${0.3 + 0.6 * sp})`; ctx.beginPath(); ctx.arc(x + dx * u, y + dy * u, u * (0.07 + 0.03 * sp), 0, 6.28); ctx.fill(); });   // each spot twinkles on its own
      if (found && Math.random() < 0.008) state.fx.push({ x: x + (Math.random() - 0.5) * u, y: y - u * 1.2, vx: 0, vy: -u * 0.25, t: 0, life: 2.6, color: '#e8d8ff' });
      break;
    }
    case 'stone':
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 2, y + r * 0.4, r, r * 0.45, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#7e7e74'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#9a9a8e'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.3, 0, 0, 6.28); ctx.fill();
      break;
    case 'wedge': {                                // boulders heaped and wedged against each other, moss in the cracks
      const k = Math.abs(Math.sin(x * 7.1 + y * 3.3));
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.55, r * 1.15, r * 0.42, 0, 0, 6.28); ctx.fill();
      drawRock(x - r * 0.25, y + r * 0.1, r * (0.95 + k * 0.2)); drawRock(x + r * 0.35, y - r * 0.15, r * (0.8 + k * 0.15));
      ctx.fillStyle = 'rgba(90,140,70,.55)'; ctx.beginPath(); ctx.ellipse(x + r * 0.05, y - r * 0.05, r * 0.28, r * 0.12, 0.4, 0, 6.28); ctx.fill();
      break;
    }
    case 'log':                                    // a heavy log braced across the way
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.5, r * 1.1, r * 0.4, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#5e4128'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.05, r * 0.85, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#46301c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r * 0.6, r * 0.45, 0, 0, 6.28); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.25, r * 0.2, 0, 0, 6.28); ctx.stroke();
      break;
    case 'wall': break;                                // the room draws its own walls
    case 'cracked': {
      if (s.rope) { const rx = s.rope[0] * W, ry = s.rope[1] * H; ctx.strokeStyle = '#b09a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - r * 0.2); ctx.quadraticCurveTo((x + rx) / 2, (y + ry) / 2 + UNIT * 0.4, rx, ry); ctx.stroke(); }
      drawRock(x, y, r * 1.05);
      const ST = s.stone && STONES[s.stone], hits = rtFor(state.scene).flags['hits_' + s.bar] || 0;
      if (ST) { ctx.fillStyle = ST.tint; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.ellipse(x, y - r * 0.1, r * 0.95, r * 0.75, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
      if (s.stone === 'geode') { ctx.fillStyle = 'rgba(190,150,255,.7)'; ctx.fillRect(x + r * 0.2, y - r * 0.3, 3, 3); ctx.fillRect(x - r * 0.35, y + r * 0.1, 2, 2); }   // a glint of crystal
      ctx.strokeStyle = 'rgba(30,22,14,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - r * 0.1, y - r * 0.7); ctx.lineTo(x + r * 0.08, y - r * 0.25); ctx.lineTo(x - r * 0.12, y + r * 0.05); ctx.lineTo(x + r * 0.15, y + r * 0.45); ctx.moveTo(x + r * 0.08, y - r * 0.25); ctx.lineTo(x + r * 0.45, y - r * 0.2); ctx.stroke();
      for (let k = 0; k < hits; k++) { ctx.beginPath(); ctx.moveTo(x - r * 0.6 + k * r * 0.4, y - r * 0.5); ctx.lineTo(x - r * 0.3 + k * r * 0.4, y + r * 0.2); ctx.lineTo(x - r * 0.5 + k * r * 0.4, y + r * 0.6); ctx.stroke(); }   // each good hit adds a crack
      break;
    }
    case 'burrow': {                                   // a knot of roots and rock around a small, odd hole
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 2, y + r * 0.5, r * 1.2, r * 0.45, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#5a5048'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.15, r * 0.9, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#6e645a'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.5, r * 0.35, -0.4, 0, 6.28); ctx.fill();
      if (s.holeMid) {
        ctx.fillStyle = '#120c10'; ctx.beginPath(); ctx.ellipse(x + r * 0.05, y + r * 0.1, r * 0.32, r * 0.26, 0.2, 0, 6.28); ctx.fill();
        ctx.fillStyle = `rgba(150,110,200,${0.25 + 0.15 * Math.sin(state.time * 2 + x)})`; ctx.beginPath(); ctx.ellipse(x + r * 0.05, y + r * 0.1, r * 0.2, r * 0.14, 0, 0, 6.28); ctx.fill();   // something glows faintly down there
      }
      ctx.strokeStyle = '#3e2c1c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 0.9, y - r * 0.2); ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.7, x + r * 0.2, y - r * 0.5); ctx.moveTo(x + r * 0.5, y + r * 0.6); ctx.quadraticCurveTo(x + r * 0.9, y + r * 0.2, x + r * 1.0, y - r * 0.3); ctx.stroke();
      break;
    }
    case 'chest':
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - u * 0.55, y + u * 0.2, u * 1.15, u * 0.2);
      ctx.fillStyle = '#7a5230'; ctx.fillRect(x - u * 0.55, y - u * 0.35, u * 1.1, u * 0.6);
      ctx.fillStyle = '#8a6238'; ctx.fillRect(x - u * 0.58, y - u * 0.55, u * 1.16, u * 0.25);
      ctx.fillStyle = '#c9a46a'; ctx.fillRect(x - u * 0.06, y - u * 0.35, u * 0.12, u * 0.16);
      break;
    case 'lectern':
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - u * 0.45, y - u * 0.3, u * 0.9, u * 0.55);
      ctx.fillStyle = '#8a3a2a'; ctx.fillRect(x - u * 0.38, y - u * 0.5, u * 0.36, u * 0.26); ctx.fillStyle = '#9a4a3a'; ctx.fillRect(x + u * 0.02, y - u * 0.5, u * 0.36, u * 0.26);
      ctx.fillStyle = '#f2e6c8'; ctx.fillRect(x - u * 0.34, y - u * 0.47, u * 0.3, u * 0.2); ctx.fillRect(x + u * 0.05, y - u * 0.47, u * 0.3, u * 0.2);
      break;
    case 'mirror':                                     // a standing mirror in a wooden frame
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - u * 0.45, y - u * 1.5, u * 0.9, u * 1.6); ctx.fillRect(x - u * 0.55, y + u * 0.05, u * 1.1, u * 0.15);
      ctx.fillStyle = '#a8c8d8'; ctx.fillRect(x - u * 0.34, y - u * 1.4, u * 0.68, u * 1.35);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(x - u * 0.3, y - u * 0.9); ctx.lineTo(x - u * 0.05, y - u * 1.35); ctx.lineTo(x + u * 0.05, y - u * 1.35); ctx.lineTo(x - u * 0.3, y - u * 0.7); ctx.fill();
      break;
    case 'cliff': {                                    // a knee-high rock step, lit on top
      ctx.fillStyle = '#5e5953'; ctx.beginPath(); ctx.ellipse(x, y + u * 0.15, s.r * 1.15, s.r * 0.75, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#9b958d'; ctx.beginPath(); ctx.ellipse(x, y - u * 0.12, s.r * 1.05, s.r * 0.55, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = 'rgba(40,36,32,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - s.r * 0.5, y - u * 0.1); ctx.lineTo(x - s.r * 0.1, y + u * 0.1); ctx.stroke();
      break;
    }
    case 'cairn':
      for (let i = 0; i < 4; i++) { const w0 = u * (0.9 - i * 0.18); ctx.fillStyle = i % 2 ? '#8e8880' : '#a7a197'; ctx.beginPath(); ctx.ellipse(x, y - i * u * 0.32, w0, u * 0.22, 0, 0, 6.28); ctx.fill(); }
      break;
    case 'bed':
      ctx.fillStyle = '#5a3f28'; ctx.fillRect(x - u * 1.0, y - u * 0.7, u * 2.0, u * 1.4);
      ctx.fillStyle = '#8a7a6a'; ctx.fillRect(x - u * 0.9, y - u * 0.6, u * 1.8, u * 1.2);
      ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - u * 0.85, y - u * 0.55, u * 0.6, u * 0.5);
      ctx.fillStyle = '#6a4a3a'; ctx.fillRect(x - u * 0.2, y - u * 0.6, u * 1.1, u * 1.2);
      break;
    case 'table':
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - u * 0.8, y + u * 0.3, u * 1.7, u * 0.25);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - u * 0.9, y - u * 0.5, u * 1.8, u * 0.9);
      ctx.fillStyle = '#e8e4d8'; ctx.beginPath(); ctx.arc(x + u * 0.4, y - u * 0.1, u * 0.18, 0, 6.28); ctx.fill();   // a chipped cup
      ctx.fillStyle = '#3a2616'; ctx.fillRect(x - u * 0.6, y - u * 0.2, u * 0.4, u * 0.08);                            // a pipe
      break;
    case 'stove':
      ctx.fillStyle = '#3a3a3e'; ctx.fillRect(x - u * 0.6, y - u * 0.6, u * 1.2, u * 1.2);
      ctx.fillStyle = '#2a2a2e'; ctx.fillRect(x - u * 0.2, y - u * 1.4, u * 0.4, u * 0.8);
      ctx.fillStyle = '#4a2a1a'; ctx.fillRect(x - u * 0.35, y - u * 0.1, u * 0.7, u * 0.35);
      break;
    case 'bench':
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - u * 0.7, y + u * 0.2, u * 1.5, u * 0.2);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - u * 0.7, y - u * 0.35, u * 1.4, u * 0.3);
      ctx.fillRect(x - u * 0.6, y - u * 0.05, u * 0.12, u * 0.35); ctx.fillRect(x + u * 0.48, y - u * 0.05, u * 0.12, u * 0.35);
      ctx.fillStyle = '#7a7a80'; ctx.fillRect(x - u * 0.2, y - u * 0.55, u * 0.4, u * 0.22);
      ctx.fillStyle = '#5a5a60'; ctx.fillRect(x - u * 0.3, y - u * 0.33, u * 0.6, u * 0.06);
      break;
    case 'tent': {                                     // Pip's lean-to: a crossbar on two forked sticks, a wall of leaning sticks, a blanket flung over one end
      const jj = k => Math.sin(k * 12.9898) * 0.5;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + u * 0.2, y + u * 0.5, r * 1.15, r * 0.35, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#2a1c10'; ctx.beginPath(); ctx.moveTo(x - r * 0.85, y + u * 0.5); ctx.lineTo(x - r * 0.8, y - r * 0.55); ctx.lineTo(x + r * 0.8, y - r * 0.6); ctx.lineTo(x + r * 0.9, y + u * 0.5); ctx.fill();   // the dark inside
      for (let k = 0; k < 11; k++) {                 // the sticks, leaning back from the ground to the crossbar, all different
        const bx = x - r * 0.95 + k * r * 0.19, len = r * (1.15 + jj(k) * 0.25);
        ctx.strokeStyle = k % 4 === 1 ? '#8a6a44' : k % 3 ? '#6b4e30' : '#7a5c3a'; ctx.lineWidth = u * (0.1 + 0.03 * jj(k + 2));
        ctx.beginPath(); ctx.moveTo(bx, y + u * 0.5); ctx.lineTo(bx + jj(k + 5) * u * 0.25, y + u * 0.5 - len); ctx.stroke();
      }
      ctx.fillStyle = '#b05a4a'; ctx.beginPath(); ctx.moveTo(x + r * 0.15, y - r * 0.65); ctx.lineTo(x + r * 0.95, y - r * 0.6); ctx.lineTo(x + r * 1.0, y + u * 0.2); ctx.lineTo(x + r * 0.2, y + u * 0.3); ctx.fill();   // the blanket
      ctx.strokeStyle = '#e0c090'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + r * 0.2, y - r * 0.3); ctx.lineTo(x + r * 0.97, y - r * 0.28); ctx.stroke();
      ctx.strokeStyle = '#4e3a24'; ctx.lineWidth = u * 0.12; ctx.beginPath(); ctx.moveTo(x - r * 1.05, y - r * 0.62); ctx.lineTo(x + r * 1.08, y - r * 0.7); ctx.stroke();   // crossbar, a bit crooked
      ctx.lineWidth = u * 0.1; ctx.beginPath(); ctx.moveTo(x - r * 1.0, y + u * 0.5); ctx.lineTo(x - r * 1.0, y - r * 0.75); ctx.moveTo(x + r * 1.03, y + u * 0.5); ctx.lineTo(x + r * 1.06, y - r * 0.8); ctx.stroke();   // forked uprights
      ctx.fillStyle = '#5f8a3a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x - r * 0.6 + k * r * 0.25, y - r * 0.6 + jj(k) * 4, u * 0.2, u * 0.08, jj(k + 1), 0, 6.28); ctx.fill(); }   // leafy branches on top
      break;
    }
    case 'bramble':                                // storm-piled thorns
      ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + s.fy * 20; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, r * (0.5 + i * 0.1), a, a + 3.5); ctx.stroke(); }
      ctx.fillStyle = '#5a3e22'; for (let i = 0; i < 8; i++) { const a = i * 0.8 + s.fx * 9; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); ctx.lineTo(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1); ctx.lineTo(x + Math.cos(a + 0.2) * r * 0.8, y + Math.sin(a + 0.2) * r * 0.8); ctx.fill(); }
      ctx.fillStyle = '#355a28'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.2, 0, 6.28); ctx.fill();
      break;
    case 'reeds':                                  // dry reeds, same strokes as marsh reeds, packed tight
      ctx.strokeStyle = '#a8955a'; ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) { const sw = Math.sin(state.time + i) * 3; ctx.beginPath(); ctx.moveTo(x + i * r * 0.25, y + r * 0.6); ctx.lineTo(x + i * r * 0.25 + sw, y - r * 1.2); ctx.stroke(); }
      ctx.fillStyle = '#7a6438'; for (let i = -2; i <= 2; i += 2) ctx.fillRect(x + i * r * 0.25 - 2, y - r * 1.25, 4, 9);
      break;
    case 'web':
      ctx.strokeStyle = 'rgba(225,225,215,.7)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + s.fx * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); ctx.stroke(); }
      for (const k of [0.4, 0.8, 1.15]) { ctx.beginPath(); ctx.arc(x, y, r * k, 0, 6.28); ctx.stroke(); }
      break;
  }
}

// ---------------- characters ----------------
function drawPerson(x, y, color, z, dim = 0) {
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 2, y + UNIT * 0.45, UNIT * 0.55, UNIT * 0.2, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(x - UNIT / 2, y - z - UNIT / 2, UNIT, UNIT);
  if (dim) { ctx.fillStyle = `rgba(40,40,60,${dim})`; ctx.fillRect(x - UNIT / 2, y - z - UNIT / 2, UNIT, UNIT); }
}
function drawNpc(n) {
  const [x, y] = npcPos(n);
  if (n.kind === 'toad') {
    const c = state.cut && state.cut.type === 'toad' ? state.cut : null, sw = c ? (c.swell || 0) : 0;
    const bob = Math.sin(state.time * 2) * 2, s = UNIT * (1.1 + sw * 0.6);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.55, s, s * 0.3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#5a6b32'; ctx.beginPath(); ctx.ellipse(x, y + bob, s, s * 0.75, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#c9c07a'; ctx.beginPath(); ctx.ellipse(x, y + bob + s * 0.25, s * (0.6 + sw * 0.3), s * 0.4, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#44542a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i * 2.1) * s * 0.6, y + bob - s * 0.2 + Math.sin(i * 1.7) * s * 0.2, s * 0.08, 0, 6.28); ctx.fill(); }
    for (const k of [-1, 1]) { ctx.fillStyle = '#6b7c3a'; ctx.beginPath(); ctx.arc(x + k * s * 0.45, y + bob - s * 0.55, s * 0.22, 0, 6.28); ctx.fill(); ctx.fillStyle = '#e8d24a'; ctx.beginPath(); ctx.arc(x + k * s * 0.45, y + bob - s * 0.58, s * 0.12, 0, 6.28); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(x + k * s * 0.45 - s * 0.1, y + bob - s * 0.6, s * 0.2, s * 0.05); }
  } else if (n.kind === 'tortoise') {
    const s = UNIT * 0.9, hd = Math.sin(state.time * 0.8) * 3;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.5, s * 1.1, s * 0.3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#8a8a62'; ctx.beginPath(); ctx.ellipse(x - s * 1.05, y + hd * 0.2, s * 0.3, s * 0.24, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#5a5a3a'; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.72, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - s, y - 2, s * 2, s * 0.25);
    ctx.strokeStyle = '#3e3e26'; ctx.lineWidth = 2;
    for (const [hx, hy] of [[0, -0.4], [-0.45, -0.2], [0.45, -0.2]]) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; ctx[i ? 'lineTo' : 'moveTo'](x + hx * s + Math.cos(a) * s * 0.2, y + hy * s + Math.sin(a) * s * 0.16); } ctx.closePath(); ctx.stroke(); }
    ctx.fillStyle = '#111'; ctx.fillRect(x - s * 1.18, y - s * 0.05 + hd * 0.2, 3, 3);
  } else if (n.kind === 'pip') {
    drawPerson(x, y, '#7ab8e0', 0);
    ctx.fillStyle = '#1a2a3a'; ctx.fillRect(x - UNIT * 0.2, y - UNIT * 0.15, 3, 3); ctx.fillRect(x + UNIT * 0.1, y - UNIT * 0.15, 3, 3);
  }
}
function drawHero() {
  const h = state.hero;
  if (MODEL_ON()) { drawHeroModelInWorld(h, state.cut && state.cut.type === 'sword'); return; }
  if (h.falling > 0) {
    const k = h.falling / 0.8, s = UNIT * k;
    ctx.fillStyle = '#f5d06f'; ctx.fillRect(h.x - s / 2, h.y - s / 2 + (1 - k) * UNIT, s, s);
    return;
  }
  const blink = !state.cut && state.time - h.hurtT < 1.2 && Math.floor(state.time * 14) % 2;
  const sp = Math.hypot(h.vx, h.vy), stretch = Math.min(0.18, sp / 3000);
  const pw = UNIT * (1 + stretch * Math.abs(h.vx) / (sp || 1)), ph = UNIT * (1 + stretch * Math.abs(h.vy) / (sp || 1));
  const y = h.y - h.z, sh = 1 - Math.min(0.6, h.z / (UNIT * 5)), near = heightScale(h.z);
  if (!(h.ride && h.ride.wind)) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(h.x + 2, h.y + ph * 0.45, pw * 0.55 * sh, pw * 0.2 * sh, 0, 0, 6.28); ctx.fill(); }   // the shadow stays on the ground, at ground size
  if (near > 1.001) { ctx.save(); ctx.translate(h.x, y); ctx.scale(near, near); ctx.translate(-h.x, -y); drawHeroBody(h, pw, ph, y, sh); ctx.restore(); return; }
  drawHeroBody(h, pw, ph, y, sh);
}
// up in the air is closer to the viewer: grow a little with height (never more than a third bigger)
function heightScale(z) { return 1 + Math.min(0.33, Math.max(0, z) / UNIT * 0.12); }
function drawHeroBody(h, pw, ph, y, sh) {
  const blink = !state.cut && state.time - h.hurtT < 1.2 && Math.floor(state.time * 14) % 2;
  if (blink) return;
  if (state.hold.charged) { ctx.fillStyle = `rgba(255,240,180,${0.35 + 0.25 * Math.sin(state.time * 30)})`; ctx.fillRect(h.x - pw / 2 - 3, y - ph / 2 - 3, pw + 6, ph + 6); }
  const heroic = state.cut && state.cut.type === 'sword';
  if (heroic && h.z > 0) {
    ctx.save(); ctx.translate(h.x, y); ctx.rotate(state.time * 0.8); ctx.fillStyle = 'rgba(255,245,200,.22)';
    for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(UNIT * 3, -UNIT * 0.35); ctx.lineTo(UNIT * 3, UNIT * 0.35); ctx.fill(); }
    ctx.restore();
  }
  const r = h.vig / maxVig();
  ctx.fillStyle = h.stun > 0 ? '#ffffff' : '#f5d06f';
  ctx.fillRect(h.x - pw / 2, y - ph / 2, pw, ph);
  if (r < 0.35) { ctx.fillStyle = `rgba(60,50,80,${(0.35 - r) * 1.3})`; ctx.fillRect(h.x - pw / 2, y - ph / 2, pw, ph); }
  if (wears('cap')) drawScalp(h.x, y - ph / 2, UNIT);
  drawWorn(h.x, y - ph / 2, pw, ph, UNIT);
  if (state.carry === 'rock') drawRock(h.x, y - ph / 2 - UNIT * 0.55, UNIT * 0.62);
  else if (bladeKind()) drawSword(h, pw, ph, y, heroic);
}
function bladeColor() { if (bladeKind() === 'wood') return '#b08a5a'; return state.inv.slime > 0 ? '#9fcf5a' : ['#8a5a3a', '#9a7358', '#ad9a84', '#c9c2b6'][Math.min(3, state.inv.up.edge)]; }
function drawBlade(len, w) {
  ctx.fillStyle = bladeColor(); ctx.fillRect(0, -w / 2, len, w);
  ctx.beginPath(); ctx.moveTo(len, -w / 2); ctx.lineTo(len + w * 1.2, 0); ctx.lineTo(len, w / 2); ctx.fill();
  if (bladeKind() === 'wood') {                                  // grain, and cracks that open as it wears down
    const wear = 1 - state.inv.woodsword / WOOD_SWORD;
    ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
    ctx.strokeStyle = `rgba(40,24,10,${0.3 + 0.6 * wear})`;
    for (let k = 0; k < Math.floor(wear * 5); k++) { const cx = len * (0.2 + k * 0.17); ctx.beginPath(); ctx.moveTo(cx, -w / 2); ctx.lineTo(cx + w * 0.4, 0); ctx.lineTo(cx - w * 0.2, w / 2); ctx.stroke(); }
    if (state.inv.aug) augGlint(len, w);
    return;
  }
  if (state.inv.aug) augGlint(len, w);
  if (state.inv.up.edge < 3 && !(state.inv.slime > 0)) {        // rust blooms, fading with each honing
    ctx.fillStyle = `rgba(164,104,63,${0.8 - state.inv.up.edge * 0.25})`;
    ctx.fillRect(len * 0.25, -w / 2, len * 0.14, w * 0.6); ctx.fillRect(len * 0.6, -w * 0.1, len * 0.1, w * 0.6);
  }
  if (state.inv.horn) { ctx.fillStyle = '#e6dcc0'; ctx.beginPath(); ctx.moveTo(len - UNIT * 0.1, -w * 1.1); ctx.quadraticCurveTo(len + UNIT * 0.35, -w * 0.6, len + UNIT * 0.3, w * 0.2); ctx.lineTo(len - UNIT * 0.1, w * 0.8); ctx.fill(); }
}
function drawHilt() { ctx.fillStyle = '#7a4a1c'; ctx.fillRect(-UNIT * 0.05, -UNIT * 0.18, UNIT * 0.08, UNIT * 0.36); ctx.fillRect(-UNIT * 0.26, -UNIT * 0.04, UNIT * 0.22, UNIT * 0.08); }
function drawSword(h, pw, ph, y, heroic) {
  const a = state.atk;
  ctx.save(); ctx.translate(h.x, y);
  if (heroic) {
    ctx.rotate(-Math.PI / 2); ctx.translate(ph * 0.5, 0);
    drawBlade(UNIT * 1.2, UNIT * 0.13); drawHilt();
    const tw = 0.5 + 0.5 * Math.sin(state.time * 20);
    ctx.fillStyle = `rgba(255,255,230,${0.6 + 0.4 * tw})`; ctx.translate(UNIT * 1.3, 0); ctx.rotate(state.time * 3);
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(0, -1.5, UNIT * 0.4 * (0.6 + tw * 0.4), 3); }
    ctx.restore(); return;
  }
  if (state.whirl) {
    const w = state.whirl, r = UNIT * (1.9 + Math.min(0.8, w.streak * 0.06));
    ctx.strokeStyle = `rgba(255,${230 - Math.min(120, w.streak * 12)},150,.35)`; ctx.lineWidth = UNIT * 0.3;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.75, w.ang - 2.2, w.ang); ctx.stroke();
    ctx.rotate(w.ang); ctx.translate(UNIT * 0.45, 0); drawBlade(UNIT * 1.2, UNIT * 0.13); drawHilt();
    ctx.restore(); return;
  }
  if (state.slam) { ctx.rotate(Math.PI / 2); ctx.translate(ph * 0.4, 0); drawBlade(UNIT * 1.1, UNIT * 0.13); drawHilt(); ctx.restore(); return; }
  if (!a && state.equip === 'acorn' && state.inv.acorns > 0) {
    // an acorn ready in the hand; the sword is put away, not shown
    const s = h.side;
    drawItemIcon('acorn', s * (pw * 0.5 + UNIT * 0.12), UNIT * 0.1, UNIT * 0.55);
    if (state.inv.silk) { ctx.strokeStyle = 'rgba(232,228,240,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s * pw * 0.45, UNIT * 0.25); ctx.lineTo(s * (pw * 0.5 + UNIT * 0.12), UNIT * 0.1); ctx.stroke(); }
    ctx.restore(); return;
  }
  if (!a) {
    // worn at the side the hero faces, point down and angled back from the way you walk
    const s = h.side, ang = Math.PI / 2 - s * 0.35;
    ctx.translate(s * (pw * 0.5 + UNIT * 0.08), UNIT * 0.08 + h.fy * UNIT * 0.08);
    ctx.rotate(ang); ctx.translate(UNIT * 0.1, 0);
    drawBlade(UNIT * 0.75, UNIT * 0.1); drawHilt();
    ctx.restore(); return;
  }
  const ab = Math.atan2(a.ay, a.ax), p = Math.min(1, a.t / a.dur);
  if (a.type === 'slash') {
    const sweep = a.sweep || 1.25, ang = ab - sweep + p * sweep * 2, lv = a.level || 0, n = a.n || 1;
    const warm = Math.min(1, (n - 1) / 5);
    ctx.strokeStyle = lv || n > 1 ? `rgba(255,${Math.round(250 - warm * 80)},${Math.round(230 - warm * 150)},${(0.55 + warm * 0.3) * (1 - p)})` : `rgba(255,250,230,${0.55 * (1 - p)})`;
    ctx.lineWidth = UNIT * (0.35 + warm * 0.15);
    ctx.beginPath(); ctx.arc(0, 0, UNIT * 1.2 * (1 + (n - 1) * 0.04), ab - sweep, ang); ctx.stroke();
    ctx.rotate(ang); ctx.translate(UNIT * 0.5, 0);
    drawBlade(UNIT * 1.15, UNIT * 0.12); drawHilt();
  } else {
    const ext = Math.sin(p * Math.PI);
    ctx.rotate(ab); ctx.translate(UNIT * (0.4 + ext * 0.7), 0);
    drawBlade(UNIT * 1.2, UNIT * 0.12); drawHilt();
    const lv = a.level || 0;
    ctx.strokeStyle = lv ? `rgba(255,220,110,${0.8 * ext})` : `rgba(255,250,230,${0.5 * ext})`; ctx.lineWidth = 2 + lv * 2;
    ctx.beginPath(); ctx.moveTo(UNIT * 0.2, 0); ctx.lineTo(UNIT * (1.4 + ext * (0.8 + lv * 0.4)), 0); ctx.stroke();
  }
  ctx.restore();
}
function drawPullable(sc, pl) {
  const rt = rtFor(sc.id);
  {
    const x = pl.fx * W, y = pl.fy * H, done = rt.pulled.has(pl.id);
    const p = state.pull.id === pl.id ? state.pull : null;
    const tilt = p ? p.tilt + (p.grip ? Math.sin(state.time * 60) * 0.02 : 0) : 0;
    if (pl.kind === 'rock') {
      const mud = pl.mud, lip = mud ? '#3a2a18' : '#5a4128';
      ctx.fillStyle = mud ? '#2e2214' : '#4a3a24'; ctx.beginPath(); ctx.ellipse(x, y + UNIT * 0.3, UNIT * 0.8, UNIT * 0.35, 0, 0, 6.28); ctx.fill();
      if (done) { ctx.fillStyle = '#2e2214'; ctx.beginPath(); ctx.ellipse(x, y + UNIT * 0.3, UNIT * 0.6, UNIT * 0.24, 0, 0, 6.28); ctx.fill(); return; }   // the hole it left
      const rise = p ? Math.min(1, p.wiggle / (pl.need || 3)) * UNIT * 0.28 : 0;
      ctx.save(); ctx.beginPath(); ctx.rect(x - UNIT * 1.2, y - UNIT * 1.5, UNIT * 2.4, UNIT * 1.5 + UNIT * 0.2 + rise); ctx.clip();   // everything below the soil line is hidden
      ctx.translate(x, y + UNIT * 0.25 - rise); ctx.rotate(tilt); drawRock(0, 0, UNIT * 0.72); ctx.restore();
      ctx.fillStyle = lip; ctx.beginPath(); ctx.ellipse(x, y + UNIT * 0.28, UNIT * 0.78, UNIT * 0.2, 0, 0, Math.PI); ctx.fill();   // the soil (or mud) lip in front
      if (mud) { ctx.fillStyle = 'rgba(255,240,210,.18)'; ctx.beginPath(); ctx.ellipse(x - UNIT * 0.25, y + UNIT * 0.3, UNIT * 0.2, UNIT * 0.05, 0, 0, 6.28); ctx.fill(); }
      else { ctx.fillStyle = '#6b8a3a'; for (let k = -2; k <= 2; k++) ctx.fillRect(x + k * UNIT * 0.28, y + UNIT * 0.36, 2, -UNIT * 0.14); }   // a few grass blades at the rim
    } else {
      const c = state.cut && state.cut.type === 'sword' ? state.cut : null;
      if (done && c && !state.inv.sword) { drawSwordReveal(x, y, c.t); return; }
      if (done) { ctx.fillStyle = '#2a1a0c'; ctx.fillRect(x - UNIT * 0.08, y - UNIT * 0.14, UNIT * 0.16, UNIT * 0.06); return; }
      // hidden: sunk to the hilt in the old stump, moss grown over the guard. Just a dark knob, easy to take for a snag.
      const d = Math.hypot(state.hero.x - x, state.hero.y - y) / UNIT, seen = Math.max(0.35, Math.min(1, 1.4 - d * 0.15));
      ctx.save(); ctx.globalAlpha = seen; ctx.translate(x, y - UNIT * 0.1); ctx.rotate(tilt * 0.5 - 0.12);
      ctx.fillStyle = '#3e2a18'; ctx.fillRect(-UNIT * 0.05, -UNIT * 0.62, UNIT * 0.1, UNIT * 0.3);
      ctx.fillStyle = '#4a6a34'; ctx.beginPath(); ctx.ellipse(0, -UNIT * 0.33, UNIT * 0.2, UNIT * 0.08, 0, 0, 6.28); ctx.fill();   // moss over the guard
      ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, -UNIT * 0.64, UNIT * 0.07, 0, 6.28); ctx.fill();
      ctx.fillStyle = 'rgba(90,130,70,.8)'; ctx.fillRect(-UNIT * 0.06, -UNIT * 0.52, UNIT * 0.05, UNIT * 0.08);
      ctx.restore();
    }
  }
}
// the blade coming out of the stump: light first, through the cracks, then the blade itself, rising, rust and all,
// with a bright line running up it. Drawn at the stump until the hero takes it.
function drawSwordReveal(x, y, t) {
  const R0 = 1.5, TAKE = 3.1, u = UNIT, glow = Math.min(1, t / R0), rise = Math.max(0, Math.min(1, (t - R0) / (TAKE - R0)));
  const e = 1 - Math.pow(1 - rise, 3), top = y - u * 0.3 - e * u * 1.6;
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.55 * glow;                                   // rays of light fanning up out of the stump
  ctx.translate(x, y - u * 0.3); ctx.rotate(Math.sin(t * 0.7) * 0.1);
  for (let i = 0; i < 9; i++) { const an = -Math.PI / 2 + (i - 4) * 0.2, L0 = u * (1.2 + glow * 2.8) * (0.7 + 0.3 * Math.sin(t * 3 + i * 1.7));
    const g = ctx.createLinearGradient(0, 0, Math.cos(an) * L0, Math.sin(an) * L0); g.addColorStop(0, 'rgba(255,244,190,.85)'); g.addColorStop(1, 'rgba(255,244,190,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an - 0.05) * L0, Math.sin(an - 0.05) * L0); ctx.lineTo(Math.cos(an + 0.05) * L0, Math.sin(an + 0.05) * L0); ctx.fill(); }
  ctx.restore();
  const hg = ctx.createRadialGradient(x, y - u * 0.3, 0, x, y - u * 0.3, u * (0.6 + glow * 1.4)); hg.addColorStop(0, `rgba(255,236,170,${0.7 * glow})`); hg.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = hg; ctx.fillRect(x - u * 2.2, y - u * 2.4, u * 4.4, u * 4.4);
  if (rise > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(x - u, top - u * 0.8, u * 2, (y - u * 0.3) - (top - u * 0.8)); ctx.clip();   // what's still in the stump stays hidden
    ctx.translate(x, top);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-u * 0.07, 0, u * 0.14, u * 1.2);                   // the blade, rust and all
    ctx.fillStyle = '#a4683f'; ctx.fillRect(-u * 0.07, u * 0.25, u * 0.06, u * 0.3);
    const ln = ((t - R0) * 1.4) % 1;                                                               // a line of light running up it
    ctx.fillStyle = 'rgba(255,250,220,.9)'; ctx.fillRect(-u * 0.02, u * 1.2 * (1 - ln) - u * 0.15, u * 0.04, u * 0.3);
    ctx.fillStyle = '#5b3b22'; ctx.fillRect(-u * 0.26, -u * 0.1, u * 0.52, u * 0.1);
    ctx.fillStyle = '#4a2f1a'; ctx.fillRect(-u * 0.06, -u * 0.45, u * 0.12, u * 0.35);
    ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.arc(0, -u * 0.48, u * 0.09, 0, 6.28); ctx.fill();
    ctx.restore();
  }
}
function drawShots() {
  for (const s of state.shots) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + UNIT * 0.2, UNIT * (s.kind === 'rock' ? 0.5 : 0.15), UNIT * 0.1, 0, 0, 6.28); ctx.fill();
    const k = heightScale(s.z);
    if (s.kind === 'rock') drawRock(s.x, s.y - s.z, UNIT * 0.6 * k);
    else { ctx.save(); ctx.translate(s.x, s.y - s.z); ctx.rotate(s.spin); drawItemIcon('acorn', 0, 0, UNIT * 0.6 * k); ctx.restore(); }
  }
}
function drawAim() {
  const h = state.hero, k = throwPower(), len = UNIT * (state.carry === 'rock' ? 2.5 : 1.5 + 5 * k);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(h.x - UNIT * 0.5, h.y + UNIT * 0.7, UNIT, 4);
  ctx.fillStyle = k >= 1 ? '#ffb347' : '#ffe38a'; ctx.fillRect(h.x - UNIT * 0.5, h.y + UNIT * 0.7, UNIT * k, 4);
  if (state.carry === 'rock') {                    // where the rock will come down
    const [lx, ly] = rockLanding(h), pulse = 0.5 + 0.5 * Math.sin(state.time * 8);
    ctx.strokeStyle = `rgba(255,230,140,${0.5 + pulse * 0.4})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(lx, ly, UNIT * 0.7, UNIT * 0.4, 0, 0, 6.28); ctx.stroke();
    ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.quadraticCurveTo((h.x + lx) / 2, (h.y + ly) / 2 - UNIT * 2.5, lx, ly); ctx.stroke(); ctx.setLineDash([]);
    return;
  }
  ctx.strokeStyle = 'rgba(255,250,220,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + h.fx * len, h.y + h.fy * len); ctx.stroke(); ctx.setLineDash([]);
}

// ---------------- gas and fire ----------------
function drawGas(flames) {
  for (const p of state.gas) {
    if (!flames && !p.burn) {
      const a = 0.16 * Math.min(1, (p.life - p.age) / 2);
      ctx.fillStyle = `rgba(175,200,95,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
    } else if (flames && p.burn) {
      const k = p.burn / p.burnDur, fl = 1 + 0.15 * Math.sin(state.time * 25 + p.x);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * fl);
      g.addColorStop(0, `rgba(255,240,160,${0.8 * (1 - k)})`); g.addColorStop(0.45, `rgba(255,140,40,${0.6 * (1 - k)})`); g.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * fl, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    }
  }
}

// ---------------- light and shade (caves, deep woods, night) ----------------
function dapplePos(d) { return [(d.fx + Math.sin(state.time * d.sp + d.ph) * d.ax) * W, (d.fy + Math.cos(state.time * d.sp * 0.8 + d.ph) * d.ay) * H, d.r * UNIT]; }
function drawLighting(sc) {
  const night = sc.id === 'camp' ? state.night : 0;
  const shade = Math.max(sc.shade || 0, night * 0.9);
  if (shade <= 0.01) return;
  const h = state.hero, woods = sc.area === 'woods';
  lctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, W, H);
  lctx.fillStyle = woods ? `rgba(4,14,8,${shade})` : sc.area === 'swamp' ? `rgba(8,16,10,${shade})` : night ? `rgba(6,8,22,${shade})` : `rgba(4,2,8,${shade})`;
  lctx.fillRect(0, 0, W, H);
  lctx.globalCompositeOperation = 'destination-out';
  const light = (x, y, r, a = 1) => { const g = lctx.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); lctx.fillStyle = g; lctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const flicker = 1 + 0.03 * Math.sin(state.time * 11) + 0.02 * Math.sin(state.time * 23);
  if (woods) {
    for (const d of sc.feat.dapples) { const [x, y, r] = dapplePos(d); light(x, y, r, 0.9); }
    light(h.x, h.y, UNIT * 1.6, 0.35);
  } else if (night) {
    const [fx, fy] = sc.feat.fire;
    if (state.fireLit) light(fx * W, fy * H, UNIT * 5 * flicker, 1);
    if (state.pip && state.pip.show) light(state.pip.x, state.pip.y, UNIT * 2.2, 0.7);
    light(h.x, h.y, UNIT * 1.2, 0.4);
  } else {
    light(h.x, h.y - h.z, UNIT * 5.5 * flicker * (sc.lightScale || 1) * (1 + 0.8 * Math.min(1, state.inv.lumin / 45)));
    for (const e of state.enemies) if (e.type === 'glowworm' && !e.dead) light(e.x, e.y, UNIT * (e.mode === 'glowup' ? 2.2 + (0.8 - e.t) * 4 : 2.2), 0.8);
    for (const it of state.items) light(it.x, it.y, UNIT * 1.3, 0.7);
    if (sc.area === 'cave') for (const ex of sc.exits) { const [px, py] = edgePoint(ex.side, (ex.a + ex.b) / 2); if (!(ex.locked && ex.locked())) light(px * W, py * H, UNIT * 3, 0.5); }
    if (sc.feat.falls) for (let y = 0; y < H; y += UNIT * 2) light(W - UNIT, y, UNIT * 4, 0.55);
    if (sc.id === 'c1') light(0, H * 0.5, UNIT * 2.5, 0.3);
  }
  if (sc.feat.shroom) light(sc.feat.shroom[0] * W, sc.feat.shroom[1] * H - UNIT, UNIT * 2.6, 0.8);
  for (const w of state.webs || []) if (w.burn) light(w.x, w.y, w.r * 4.5, 0.95);
  for (const fl of state.floaters || []) light(fl.x, fl.y, UNIT * 0.9, 0.5);
  for (const p of state.gas) if (p.burn) light(p.x, p.y, p.r * 2.6, 0.95 * (1 - p.burn / p.burnDur * 0.6));
  ctx.drawImage(lightCv, 0, 0, W, H);
}
// the sword in the woods only shows itself when a patch of sun slides over it
function drawSwordGlint(sc) {
  if (!sc.feat.sword || rtFor(sc.id).pulled.has('sword')) return;
  const x = sc.feat.sword[0] * W, y = sc.feat.sword[1] * H - UNIT * 1.1;
  let lit = 0;
  for (const d of sc.feat.dapples) { const [dx, dy, r] = dapplePos(d); lit = Math.max(lit, 1 - Math.hypot(dx - x, dy - y) / r); }
  if (lit > 0.35) {
    if (!state.glintOn) { state.glintOn = true; sfx.glint(); }
    const k = (lit - 0.35) / 0.65, tw = 0.6 + 0.4 * Math.sin(state.time * 18);
    ctx.save(); ctx.translate(x, y); ctx.rotate(state.time * 1.5);
    ctx.fillStyle = `rgba(255,255,235,${k * tw})`;
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(0, -1, UNIT * 0.5 * k, 2); }
    ctx.restore();
  } else state.glintOn = false;
}
function drawSky() {
  const n = state.night * (1 - (state.clouds2 || 0));
  if (n > 0.02) for (let i = 0; i < 70; i++) {
    const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * W, y = (Math.cos(i * 37.3) * 0.5 + 0.5) * H;
    ctx.fillStyle = `rgba(255,255,240,${n * (0.35 + 0.35 * Math.sin(state.time * 2 + i))})`; ctx.fillRect(x, y, 2, 2);
  }
  if (state.clouds2 > 0) { ctx.fillStyle = `rgba(20,22,35,${state.clouds2 * 0.35})`; ctx.fillRect(0, 0, W, H); }
}
function drawClouds(sc) {
  for (const c of state.clouds) {
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, `rgba(20,25,35,${0.12 + (sc.depth || 0) * 0.02})`); g.addColorStop(1, 'rgba(20,25,35,0)');
    ctx.fillStyle = g; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
  }
  ctx.fillStyle = `rgba(40,50,70,${0.03 * (sc.depth || 0)})`; ctx.fillRect(0, 0, W, H);
}
function drawFog() {
  for (let i = 0; i < 5; i++) {
    const x = ((state.time * 12 + i * 300) % (W + 400)) - 200, y = H * (0.15 + i * 0.18);
    const g = ctx.createRadialGradient(x, y, 0, x, y, UNIT * 6);
    g.addColorStop(0, 'rgba(200,210,190,.13)'); g.addColorStop(1, 'rgba(200,210,190,0)');
    ctx.fillStyle = g; ctx.fillRect(x - UNIT * 6, y - UNIT * 6, UNIT * 12, UNIT * 12);
  }
  for (let i = 0; i < 12; i++) {
    const x = (Math.sin(state.time * 0.3 + i * 2.1) * 0.5 + 0.5) * W, y = (Math.cos(state.time * 0.23 + i * 1.3) * 0.5 + 0.5) * H;
    ctx.fillStyle = `rgba(230,255,140,${0.4 + 0.4 * Math.sin(state.time * 3 + i)})`; ctx.fillRect(x, y, 3, 3);
  }
}
function drawFalls(open) {
  const x0 = W - UNIT * 2.3;
  ctx.fillStyle = '#3d6680'; ctx.fillRect(x0, 0, W - x0, H);
  ctx.strokeStyle = 'rgba(210,235,255,.45)'; ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const x = x0 + (i / 16) * (W - x0) + 3, off = (state.time * UNIT * 9 + i * 57) % (UNIT * 3);
    for (let y = -UNIT * 3 + off; y < H; y += UNIT * 3) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + UNIT * 1.4); ctx.stroke(); }
  }
  if (open) { const ex = sceneDef().exits.find(e => e.side === 'e'); ctx.fillStyle = '#0c1014'; ctx.beginPath(); ctx.ellipse(W - UNIT * 0.6, (ex.a + ex.b) / 2 * H, UNIT * 1.6, (ex.b - ex.a) / 2 * H, 0, 0, 6.28); ctx.fill(); }
  if (Math.random() < 0.4) state.fx.push({ x: x0 + Math.random() * UNIT, y: Math.random() * H, vx: -UNIT * (1 + Math.random() * 2), vy: (Math.random() - 0.5) * UNIT, t: 0, life: 1.2, color: 'rgba(220,240,255,.5)', size: UNIT * 0.25 });
}

// ---------------- HUD: vigor instead of hearts ----------------
function drawHUD() {
  if (!state.started || (state.intro && !state.intro.gone)) return;
  const h = state.hero, inv = state.inv, mv = maxVig(), r = Math.max(0, h.vig / mv);
  const s = Math.min(24, UNIT * 0.6), x0 = 14, y0 = 14, hgt = Math.max(10, s * 0.55);
  // Vigor: the bar grows with your vigor up to one full layer of 17 (as wide as the A S D F row). Past that, each
  // further 17 lays another fill over the same bar, darker and more solid than the one below, without end. The first
  // fill is a very light green. The top layer's room shows faintly. Low on vigor, the frame pulses red.
  const LAYER = 17, rowW = s * (ALL_SLOTS.length * 1.2 + (ALL_SLOTS.length - 1) * 0.35);
  const len = rowW * Math.min(1, mv / LAYER), bx = x0 + (rowW - len) / 2;            // the bar and the slot row share a centre
  const fills = Math.max(1, Math.ceil(mv / LAYER - 1e-9)), v = Math.max(0, h.vig);
  const layer = i => { const k = 1 - Math.pow(0.55, i); return [Math.round(226 - 200 * k), Math.round(250 - 160 * k), Math.round(210 - 180 * k), 0.88 + 0.12 * k]; };
  state.vigorBar = { x: bx, w: len, rowX: x0, rowW, fills };
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx - 3, y0 - 3, len + 6, hgt + 6);
  { const top = fills - 1, [cr, cg, cb] = layer(top); ctx.fillStyle = `rgba(${cr},${cg},${cb},0.2)`; ctx.fillRect(bx, y0, rowW * Math.min(1, (mv - top * LAYER) / LAYER), hgt); }
  for (let i = 0; i < fills; i++) {
    const f = Math.max(0, Math.min(1, (v - i * LAYER) / LAYER));
    if (f <= 0) break;
    const [cr, cg, cb, ca] = layer(i);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${ca})`; ctx.fillRect(bx, y0, rowW * f, hgt);
    if (i > 0) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(bx + rowW * f - 1, y0, 1, hgt); }   // where this layer's edge sits over the one below
  }
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(bx, y0, rowW * Math.min(1, v / LAYER), hgt * 0.3);
  if (r <= 0.35) { ctx.strokeStyle = `rgba(230,90,60,${0.55 + 0.45 * Math.sin(state.time * 8)})`; ctx.lineWidth = 2; ctx.strokeRect(bx - 2, y0 - 2, len + 4, hgt + 4); }
  ctx.font = `bold ${Math.round(hgt * 0.95)}px "Courier New", monospace`;
  const vt = len > rowW * 0.8 ? `vigor ${Math.ceil(h.vig)}/${mv}` : `${Math.ceil(h.vig)}/${mv}`;
  const lightBar = Math.ceil(v / LAYER - 1e-9) <= 2 && v > LAYER * 0.3;   // dark words on the pale fills, light words on the dark ones
  ctx.fillStyle = lightBar ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.55)'; ctx.fillText(vt, bx + 5, y0 + hgt * 0.85 + 1);
  ctx.fillStyle = lightBar ? '#22361a' : '#fdf6e3'; ctx.fillText(vt, bx + 4, y0 + hgt * 0.85);
  // the quick slots, A S D F, centred under the vigor bar; timed effects sit small to the right of them
  let x = drawSlotBar(x0, y0 + hgt + s * 0.95, rowW, s), y = y0 + hgt + s * 0.95;
  const eff = (type, bar) => {
    const k = 0.7; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - s * 0.6 * k, y - s * 0.6 * k, s * 1.2 * k, s * 1.2 * k);
    drawItemIcon(type, x, y, s * 0.8 * k);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - s * 0.5 * k, y + s * 0.58 * k, s * k, 3); ctx.fillStyle = '#c9f27a'; ctx.fillRect(x - s * 0.5 * k, y + s * 0.58 * k, s * k * bar, 3);
    x += s * 1.0;
  };
  if (inv.lumin > 0) eff('lumin', Math.min(1, inv.lumin / 45));
  if (inv.pepper > 0) eff('pepper', Math.min(1, inv.pepper / 90));
  if (inv.fishBuff > 0) eff('fish', Math.min(1, inv.fishBuff / 180));
  if (inv.slime > 0) eff('slime', inv.slime / 25);
  if (inv.carrotBuff > 0) eff('carrot', inv.carrotBuff / 15);
  if (inv.squashBuff > 0) eff('squash', inv.squashBuff / 20);
  const need = 25 * Math.pow(1.35, inv.tlevel);
  ctx.fillStyle = 'rgba(184,242,138,.6)'; ctx.fillRect(bx, y0 + hgt + 1, len * Math.min(1, inv.xp / need), 2);
  const boss = state.enemies.find(e => e.type === 'warden' && e.mode !== 'dormant' && e.mode !== 'talk' && !e.dead);
  if (boss) {
    const bw = Math.min(W * 0.6, 420), bx = (W - bw) / 2, by = H - 34;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 12);
    ctx.fillStyle = boss.enraged ? '#e0603a' : '#6fc3f5'; ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxHp), 8);
  }
  state.hudRect = { x: 0, y: 0, w: Math.max(rowW + 24, x + s * 0.2), h: y0 + hgt + s * 1.8 };   // text keeps out of here
  drawQuestHud();
  drawArenaBanner();
  drawRapidsHud();
}

// ---------------- menu ----------------
const EQUIP = [
  ['sword', 'Rusted sword', `${K.act}: tap to slash, hold and release to stab and lunge. Stab, slash, stab in rhythm to chain.`],
  ['scalp', 'Stalker cap', 'Things falling from above bounce off.'],
  ['step', 'Stalker\'s Step', `${K.dash}: dodge. Last-moment dodges slow time.`],
  ['horn', 'Charger horn', 'Stabs hit harder and always knock back.'],
  ['silk', 'Diver silk', 'A sling for your acorns.'],
  ['fire', 'Marsh fire', `${K.fire}: hold to breathe gas, let go to spark it. Wind scatters it.`],
  ['tortoise', 'Tortoise\'s patience', 'Your vigor runs deeper.'],
];
// Pip's maps: every place you've been, blanks where you haven't, found mushrooms, a pulse where you are
function drawJournalMap(ox, oy, aw, ah, fs) {
  const ids = Object.keys(MAP_LAYOUT), cols = 15, rows = 13, cw = aw / cols, chh = ah / rows;
  const at = id => [ox + MAP_LAYOUT[id][0] * cw + cw * 0.12, oy + MAP_LAYOUT[id][1] * chh + chh * 0.12];
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(200,190,170,.35)';
  for (const id of ids) for (const ex of WORLD[id].exits) if (MAP_LAYOUT[ex.to] && state.seen[id] && state.seen[ex.to]) {
    const [ax, ay] = at(id), [bx, by] = at(ex.to);
    ctx.beginPath(); ctx.moveTo(ax + cw * 0.38, ay + chh * 0.38); ctx.lineTo(bx + cw * 0.38, by + chh * 0.38); ctx.stroke();
  }
  for (const id of ids) {
    const [bx, by] = at(id), seen = state.seen[id], here = id === state.scene;
    ctx.fillStyle = seen ? (REGION_COLOR[WORLD[id].area] || '#888') : 'rgba(255,255,255,.05)';
    ctx.fillRect(bx, by, cw * 0.76, chh * 0.76);
    if (here) { ctx.strokeStyle = `rgba(255,227,138,${0.6 + 0.4 * Math.sin(state.time * 6)})`; ctx.lineWidth = 3; ctx.strokeRect(bx - 2, by - 2, cw * 0.76 + 4, chh * 0.76 + 4); }
    if (seen && WORLD[id].feat.shroom) { ctx.fillStyle = state.inv.shrooms[id] ? '#b48af0' : '#6a5a88'; ctx.beginPath(); ctx.arc(bx + cw * 0.62, by + chh * 0.2, Math.max(3, cw * 0.09), 0, 6.28); ctx.fill(); }
  }
}
// the pack: a row of tabs, a grid of icons, one short line and a few actions for the selected icon
function drawPack(m, x, y, pw, fs) {
  const hits = state.packHits = [], tab = PACK_TABS[m.tab] || 'Gear';
  const rr_ = (x0, y0, w0, h0, r0) => { ctx.beginPath(); ctx.moveTo(x0 + r0, y0); ctx.arcTo(x0 + w0, y0, x0 + w0, y0 + h0, r0); ctx.arcTo(x0 + w0, y0 + h0, x0, y0 + h0, r0); ctx.arcTo(x0, y0 + h0, x0, y0, r0); ctx.arcTo(x0, y0, x0 + w0, y0, r0); ctx.closePath(); };
  const pwide = Math.min(W - 24, 680), px = (W - pwide) / 2;
  // tabs: only the ones with something behind them, each as wide as its word (the font shrinks to fit the row)
  const chips = PACK_TABS.map((t, i) => [t, i]).filter(([t]) => tabShown(t));
  let tfs = Math.round(fs * 0.8), cws;
  for (;;) { ctx.font = `${tfs}px "Courier New", monospace`; cws = chips.map(([t]) => ctx.measureText(t).width + tfs * 1.4); if (cws.reduce((a, b) => a + b, 0) + chips.length * 4 <= pwide || tfs <= 9) break; tfs--; }
  ctx.textAlign = 'center';
  const th = fs * 1.9, tot = cws.reduce((a, b) => a + b, 0) + (chips.length - 1) * 4; let cx = px + (pwide - tot) / 2;
  chips.forEach(([label, i], k) => {
    const cw = cws[k], on = m.tab === i, foc = on && m.focus === 'tabs';
    ctx.fillStyle = on ? 'rgba(242,201,76,.25)' : 'rgba(255,255,255,.06)'; rr_(cx, y - th * 0.75, cw, th, 6); ctx.fill();
    if (foc) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = on ? '#ffe38a' : '#d8d0c0'; ctx.fillText(label, cx + cw / 2, y + fs * 0.1);
    const x0 = cx; hits.push({ x: x0, y: y - th * 0.75, w: cw, h: th, fn: () => { m.tab = i; m.sel = 0; m.focus = 'grid'; } });
    cx += cw + 4;
  });
  y += th * 0.9;
  const areaH = H - y - fs * 7.5;
  if (tab === 'System') {                              // save, load, controls and settings as a plain list
    const items = SYSTEM_ITEMS(), lw = Math.min(pwide, 420), lx = (W - lw) / 2, rh = Math.max(fs * 2, 38);
    ctx.font = `${fs}px "Courier New", monospace`;
    items.forEach(([key, label], i) => {
      const yy = y + i * (rh + 4), on = m.focus !== 'tabs' && (m.sys || 0) === i;
      ctx.fillStyle = on ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.06)'; rr_(lx, yy, lw, rh, 8); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = on ? '#ffe38a' : '#fdf6e3'; ctx.textAlign = 'center'; ctx.fillText(label, W / 2, yy + rh * 0.66);
      hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { m.sys = i; m.focus = 'grid'; systemSelect(i); } });
    });
    if (m.note) { ctx.fillStyle = '#b8f28a'; ctx.fillText(m.note, W / 2, y + items.length * (rh + 4) + fs * 1.4); }
    ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`;
    drawTipMarquee(fs);
    return;
  }
  if (tab === 'Quests' && !ARENA) {                   // current objectives up top, the log folded underneath
    const v = questView(), rows = questRows(v), lw = pwide, lx = px, sel = m.focus !== 'tabs' ? (m.qsel || 0) : -1;
    const hOf = r => r.kind === 'cur' ? fs * 3.3 : fs * 1.7, gap = 4, avail = H - y - fs * 3;
    // keep the selected row on screen: start from the row that lets it fit
    let first = 0, tot = 0;
    for (let i = 0; i <= Math.max(0, sel); i++) tot += hOf(rows[i]) + gap;
    while (tot > avail && first < sel) { tot -= hOf(rows[first]) + gap; first++; }
    let yy = y + fs * 0.4;
    ctx.textAlign = 'left';
    if (first === 0) { ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`; ctx.fillText('CURRENT', lx + 6, yy + fs * 0.5); yy += fs * 1.0; }
    for (let i = first; i < rows.length; i++) {
      const r = rows[i], rh = hOf(r), on = i === sel;
      if (yy + rh > H - fs * 2.2) break;
      if (r.kind === 'loghead' && i > 0) yy += fs * 0.5;
      ctx.fillStyle = on ? 'rgba(242,201,76,.2)' : r.kind === 'log' ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.07)'; rr_(lx, yy, lw, rh, 8); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
      if (r.kind === 'cur') {
        const { q, s, step } = r.c;
        drawItemIcon(q.icon, lx + fs * 1.5, yy + rh / 2, fs * 1.7);
        ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${fs}px Georgia, serif`; ctx.fillText(step.name, lx + fs * 3, yy + fs * 1.25);
        const tag = q.steps.length > 1 ? `${q.name} \u00b7 step ${s.step + 1} of ${q.steps.length}` : q.name, on2 = tracked(q.id);
        ctx.fillStyle = 'rgba(253,246,227,.6)'; ctx.font = `${Math.round(fs * 0.72)}px "Courier New", monospace`; ctx.textAlign = 'right'; ctx.fillText(tag, lx + lw - 12, yy + fs * 1.2);
        ctx.fillStyle = on2 ? '#b8f28a' : 'rgba(253,246,227,.4)'; ctx.fillText(on2 ? (on ? `active \u00b7 ${K.act} to hide from HUD` : 'active') : (on ? `${K.act} to track on HUD` : 'not tracked'), lx + lw - 12, yy + fs * 2.6); ctx.textAlign = 'left';
        if (on2) { ctx.fillStyle = '#b8f28a'; ctx.beginPath(); ctx.arc(lx + fs * 0.55, yy + fs * 0.7, fs * 0.2, 0, 6.28); ctx.fill(); }
        ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`; ctx.fillText(step.line(), lx + fs * 3, yy + fs * 2.6);
      } else if (r.kind === 'none') {
        ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.85)}px "Courier New", monospace`; ctx.fillText('Nothing pressing. Look around.', lx + 14, yy + rh * 0.65);
      } else if (r.kind === 'loghead') {
        ctx.fillStyle = on ? '#ffe38a' : '#fdf6e3'; ctx.font = `${Math.round(fs * 0.85)}px "Courier New", monospace`;
        const tx = lx + 20, ty = yy + rh * 0.5, a = fs * 0.28; ctx.beginPath();          // a drawn fold arrow: fonts vary
        if (state.qlogOpen) { ctx.moveTo(tx - a, ty - a * 0.6); ctx.lineTo(tx + a, ty - a * 0.6); ctx.lineTo(tx, ty + a * 0.7); }
        else { ctx.moveTo(tx - a * 0.6, ty - a); ctx.lineTo(tx + a * 0.7, ty); ctx.lineTo(tx - a * 0.6, ty + a); }
        ctx.fill();
        ctx.fillText(`Log (${r.n})`, lx + 34, yy + rh * 0.66);
        ctx.fillStyle = 'rgba(253,246,227,.45)'; ctx.textAlign = 'right'; ctx.fillText(state.qlogOpen ? 'newest first' : `${K.act} to open`, lx + lw - 12, yy + rh * 0.66); ctx.textAlign = 'left';
        hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { m.qsel = i; m.focus = 'grid'; state.qlogOpen = !state.qlogOpen; } });
      } else {
        const e = r.e;
        ctx.strokeStyle = '#b8f28a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx + 16, yy + rh * 0.5); ctx.lineTo(lx + 20, yy + rh * 0.66); ctx.lineTo(lx + 27, yy + rh * 0.3); ctx.stroke();
        ctx.fillStyle = e.last ? '#b8f28a' : '#fdf6e3'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
        ctx.fillText(e.last && e.q.steps.length > 1 ? `${e.st.name}. ${e.q.name} complete.` : e.last ? `${e.q.name} complete.` : e.st.name, lx + 36, yy + rh * 0.66);
        ctx.fillStyle = 'rgba(253,246,227,.45)'; ctx.textAlign = 'right'; ctx.fillText(`${e.q.name}${e.t != null ? ' \u00b7 ' + clock(e.t) : ''}`, lx + lw - 12, yy + rh * 0.66); ctx.textAlign = 'left';
      }
      if (r.kind === 'cur') hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { if (m.qsel === i && m.focus === 'grid') trackQuest(r.c.q.id, !tracked(r.c.q.id)); m.qsel = i; m.focus = 'grid'; } });
      else if (r.kind !== 'loghead') hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { m.qsel = i; m.focus = 'grid'; } });
      yy += rh + gap;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`;
    drawTipMarquee(fs);
    return;
  }
  if (tab === 'Map') {
    if (state.inv.journal >= 3) {
      const aw = pwide, ah = Math.min(areaH + fs * 4, aw * 13 / 15 * 0.8);
      drawJournalMap(px, y, aw, ah, fs);
      ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
      ctx.fillText(`${Object.keys(state.seen).filter(k => MAP_LAYOUT[k]).length} of ${Object.keys(MAP_LAYOUT).length} places \u00b7 you are at ${MAP_NAMES[state.scene] || state.scene}`, W / 2, y + ah + fs * 1.2);
    } else {
      drawItemIcon('journal', W / 2, y + fs * 3, fs * 3);
      ctx.fillStyle = '#d8d0c0'; ctx.fillText('Pip\'s maps are in Pip\'s journal.', W / 2, y + fs * 6);
    }
    return;
  }
  if (tab === 'Status') {                              // everything about you that grows, read-only
    let yy = y + fs * 0.4; const lx = px + 14, vx = px + pwide * 0.42;
    for (const r of statusRows()) {
      if (yy > H - fs * 3) break;
      if (r[0] === 'head') { yy += fs * 0.5; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${Math.round(fs * 0.9)}px Georgia, serif`; ctx.fillText(r[1], lx, yy + fs * 0.8); yy += fs * 1.3; continue; }
      ctx.textAlign = 'left'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`; ctx.fillStyle = '#d8d0c0'; ctx.fillText(r[1], lx + fs, yy + fs * 0.8);
      if (r[0] === 'skill') {
        const bw = pwide * 0.3, bh = fs * 0.45; ctx.fillStyle = '#fdf6e3'; ctx.fillText(`level ${r[2]} of ${r[3]}`, vx, yy + fs * 0.8);
        const bx = vx + fs * 8; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(bx, yy + fs * 0.4, bw, bh); ctx.fillStyle = '#c9a2ff'; ctx.fillRect(bx, yy + fs * 0.4, bw * (r[2] >= r[3] ? 1 : r[4]), bh);
      } else { ctx.fillStyle = '#fdf6e3'; const ls = wrap(r[2], pwide - (vx - px) - 14); ls.forEach((l, k) => ctx.fillText(l, vx, yy + fs * 0.8 + k * fs * 1.05)); yy += (ls.length - 1) * fs * 1.05; }
      yy += fs * 1.25;
    }
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`;
    drawTipMarquee(fs);
    return;
  }
  if (tab === 'Craft') y += drawCraftMat(px, y + fs * 0.6, pwide, fs) + fs * 1.2;
  const cells = packCells(tab);
  const cs = Math.max(52, Math.min(76, UNIT * 1.7)), gap = 8, cols = Math.max(3, Math.floor((pwide + gap) / (cs + gap)));
  m.cols = cols;
  const gx = px + (pwide - (cols * (cs + gap) - gap)) / 2;
  if (!cells.length) { ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.fillText({ Food: 'No food. Farms, rabbits and fish.', Seeds: 'No seeds. Birds, gremlins and fish drop them.', Materials: 'No materials yet. Grow them from seeds.', Gear: 'Nothing yet.' }[tab] || '', W / 2, y + fs * 2); }
  const LAY = packLayout(cells, cols), headH = cells.some(c => c.sec) ? fs * 1.1 : 0;
  const rowY = r => { let yy = y; for (let k = 0; k <= r; k++) { if (LAY.some(q => q.r === k && q.head)) yy += headH; if (k < r) yy += cs + gap; } return yy; };
  LAY.forEach((q, i) => { if (q.head) { ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,227,138,.75)'; ctx.font = `bold ${Math.round(fs * 0.7)}px Georgia, serif`; ctx.fillText(q.head, gx, rowY(q.r) - fs * 0.3); ctx.textAlign = 'center'; } });
  cells.forEach((c, i) => {
    const cx = gx + LAY[i].c * (cs + gap), cy = rowY(LAY[i].r), sel = i === m.sel && m.focus !== 'tabs';
    if (cy + cs > y + areaH) return;
    ctx.fillStyle = sel ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.07)'; rr_(cx, cy, cs, cs, 8); ctx.fill();
    if (sel) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
    if (c.mark) { ctx.strokeStyle = '#9fd4ff'; ctx.lineWidth = 2; rr_(cx + 3, cy + 3, cs - 6, cs - 6, 6); ctx.stroke(); }
    ctx.globalAlpha = c.done === false ? 0.55 : 1;
    drawItemIcon(c.icon, cx + cs / 2, cy + cs * 0.45, cs * 0.55);
    ctx.globalAlpha = 1;
    if (c.count != null && c.count > 0) { ctx.fillStyle = '#fdf6e3'; ctx.font = `bold ${Math.round(cs * 0.22)}px "Courier New", monospace`; ctx.textAlign = 'right'; ctx.fillText(c.count, cx + cs - 5, cy + cs - 6); ctx.textAlign = 'center'; }
    if (c.pips) for (let p = 0; p < 3; p++) { ctx.fillStyle = p < c.pips ? '#ffe38a' : 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(cx + 9 + p * 9, cy + cs - 9, 3, 0, 6.28); ctx.fill(); }
    if (c.star) { ctx.fillStyle = '#ffe38a'; ctx.beginPath(); for (let p = 0; p < 10; p++) { const a = p * Math.PI / 5 - Math.PI / 2, r0 = p % 2 ? 3 : 7; ctx.lineTo(cx + 12 + Math.cos(a) * r0, cy + 12 + Math.sin(a) * r0); } ctx.fill(); }
    if (c.done) { ctx.strokeStyle = '#b8f28a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + cs - 20, cy + 12); ctx.lineTo(cx + cs - 14, cy + 18); ctx.lineTo(cx + cs - 6, cy + 7); ctx.stroke(); }
    hits.push({ x: cx, y: cy, w: cs, h: cs, fn: () => { if (tab === 'Craft') { m.sel = i; m.focus = 'grid'; craftCellAct(c); return; } if (m.sel === i && m.focus !== 'tabs' && c.acts && c.acts.length) { m.focus = 'acts'; m.act = 0; } else { m.sel = i; m.focus = 'grid'; } } });
  });
  // detail: name, one line, actions
  const c = m.focus !== 'tabs' ? cells[m.sel] : null, dy = H - fs * 6.8;
  if (c) {
    ctx.fillStyle = 'rgba(255,255,255,.06)'; rr_(px, dy - fs * 1.5, pwide, fs * 6.3, 10); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${fs}px Georgia, serif`; ctx.fillText(c.name, px + 14, dy);
    ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.82)}px "Courier New", monospace`;
    const dl = wrap(c.line || '', pwide - 28).slice(0, 2); dl.forEach((l, k) => ctx.fillText(l, px + 14, dy + fs * 1.3 + k * fs * 1.05));   // wraps, never runs off the panel
    const aY = (dl.length - 1) * fs * 1.05;
    let ax = px + 14;
    (c.acts || []).forEach((a, k) => {
      ctx.font = `${Math.round(fs * 0.82)}px "Courier New", monospace`;
      const w0 = ctx.measureText(a.label).width + 22, on = m.focus === 'acts' && m.act === k;
      ctx.fillStyle = on ? 'rgba(242,201,76,.35)' : 'rgba(255,255,255,.1)'; rr_(ax, dy + fs * 2.1 + aY, w0, fs * 1.6, 6); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = on ? '#ffe38a' : '#fdf6e3'; ctx.fillText(a.label, ax + 11, dy + fs * 3.2 + aY);
      hits.push({ x: ax, y: dy + fs * 2.1 + aY, w: w0, h: fs * 1.6, fn: () => { m.sel = cells.indexOf(c); m.focus = 'grid'; a.fn(); sfx.pickup(); } });
      ax += w0 + 8;
    });
    ctx.textAlign = 'center';
  }
  ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`;
  drawTipMarquee(fs);
}
// the shine on whatever F would use, with a one-word label if labels are on
function drawActionHint() {
  const it = findInteractable();
  state.actionHint = it;
  if (!it) return;
  const [sx, sy] = toScreen(it.x, it.y), z = state.cam.ez, u = UNIT * z, t = state.time;
  ctx.strokeStyle = `rgba(255,236,160,${0.28 + 0.1 * Math.sin(t * 3)})`; ctx.lineWidth = 1.5;   // a thin ring on the ground, at half strength: this one
  ctx.beginPath(); ctx.ellipse(sx, sy + u * 0.3, u * 0.75, u * 0.28, 0, 0, 6.28); ctx.stroke();
  const k = (0.5 + 0.5 * Math.sin(t * 2.5)) * u * 0.1 + u * 0.03, tx = sx + u * 0.45, ty = sy - u * 0.55;   // one small twinkle
  ctx.fillStyle = 'rgba(255,248,210,.9)'; ctx.beginPath(); ctx.moveTo(tx, ty - k); ctx.lineTo(tx + k * 0.25, ty); ctx.lineTo(tx, ty + k); ctx.lineTo(tx - k * 0.25, ty); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(tx - k, ty); ctx.lineTo(tx, ty + k * 0.25); ctx.lineTo(tx + k, ty); ctx.lineTo(tx, ty - k * 0.25); ctx.closePath(); ctx.fill();
  if (state.settings.labels === false) return;
  const fs = Math.round(Math.max(13, Math.min(17, UNIT * 0.46)));
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  const key = it.key || K.act, kw = ctx.measureText(key).width + 12, lw = ctx.measureText(it.verb).width, w = kw + lw + 14, hgt = fs + 10;
  const bx = Math.max(6, Math.min(W - w - 6, sx - w / 2)), by = Math.max(6, sy - u * 1.6 - hgt);
  ctx.fillStyle = 'rgba(10,8,14,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, hgt, hgt / 2) : ctx.rect(bx, by, w, hgt); ctx.fill();
  ctx.fillStyle = '#ffe38a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx + 3, by + 3, kw, hgt - 6, (hgt - 6) / 2) : ctx.rect(bx + 3, by + 3, kw, hgt - 6); ctx.fill();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillStyle = '#1a1420'; ctx.fillText(key, bx + 3 + kw / 2, by + hgt / 2 + 1);
  ctx.fillStyle = '#fdf6e3'; ctx.textAlign = 'left'; ctx.fillText(it.verb, bx + kw + 9, by + hgt / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  state.hintRect = { x: bx, y: by, w, h: hgt };
}
function drawChest(m) {
  ctx.fillStyle = 'rgba(12,10,16,.9)'; ctx.fillRect(0, 0, W, H);
  const fs = Math.round(Math.max(14, Math.min(18, UNIT * 0.46))), colW = Math.min(W * 0.44, 340), lh = fs * 2;
  const lists = [stashList(packAsStash()), stashList(state.inv.chest || {})];
  ctx.textAlign = 'center'; ctx.fillStyle = '#fdf6e3'; ctx.font = `bold ${fs * 1.3}px Georgia, serif`; ctx.fillText('Storage', W / 2, fs * 2.2);
  ['Your pack', 'The chest'].forEach((t, c) => {
    const x0 = W / 2 + (c ? 12 : -colW - 12), y0 = fs * 4;
    ctx.fillStyle = m.col === c ? '#ffe38a' : '#d8d0c0'; ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.fillText(t, x0, y0);
    lists[c].forEach((e, i) => {
      const y = y0 + fs + i * lh, on = m.col === c && m.sel === i;
      if (y > H - fs * 3) return;
      ctx.fillStyle = on ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.05)'; ctx.fillRect(x0, y, colW, lh - 4);
      drawItemIcon(e.icon, x0 + lh * 0.5, y + lh * 0.45, lh * 0.7);
      ctx.fillStyle = '#fdf6e3'; ctx.font = `${fs}px "Courier New", monospace`; ctx.fillText(`${e.name}`, x0 + lh * 1.1, y + lh * 0.62);
      ctx.textAlign = 'right'; ctx.fillText(`${e.n}`, x0 + colW - 10, y + lh * 0.62); ctx.textAlign = 'left';
    });
    if (!lists[c].length) { ctx.fillStyle = 'rgba(253,246,227,.4)'; ctx.fillText('empty', x0, y0 + fs * 2); }
  });
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(253,246,227,.6)'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
  ctx.fillText(m.note || `\u2190 \u2192 pick a side \u00b7 ${K.act} moves one across \u00b7 ${K.menu} closes`, W / 2, H - fs);
  ctx.textAlign = 'left';
}
function drawBook(m) {
  ctx.fillStyle = 'rgba(12,10,16,.88)'; ctx.fillRect(0, 0, W, H);
  const pw = Math.min(W - 40, 640), ph = Math.min(H - 60, 460), x = (W - pw) / 2, y = (H - ph) / 2, fs = Math.round(Math.max(15, Math.min(20, UNIT * 0.5)));
  ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 10, y - 10, pw + 20, ph + 20);
  ctx.fillStyle = '#f2e6c8'; ctx.fillRect(x, y, pw, ph);
  ctx.strokeStyle = 'rgba(120,90,60,.4)'; ctx.beginPath(); ctx.moveTo(x + pw / 2, y); ctx.lineTo(x + pw / 2, y + ph); ctx.stroke();
  const p = BOOK[m.page];
  ctx.fillStyle = '#3a2616'; ctx.font = `bold ${Math.round(fs * 1.2)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.fillText(p.title, W / 2, y + fs * 2.2);
  ctx.font = `${fs}px Georgia, serif`; ctx.textAlign = 'left';
  let yy = y + fs * 4;
  for (const l of p.lines) for (const w2 of wrap(l, pw - fs * 3)) { ctx.fillText(w2, x + fs * 1.5, yy); yy += fs * 1.5; }
  ctx.textAlign = 'center'; ctx.fillStyle = '#7a6a50'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
  ctx.fillText(`page ${m.page + 1} of ${BOOK.length}   \u2190 \u2192 to turn   ${K.act} closes`, W / 2, y + ph - fs);
  ctx.textAlign = 'left';
}
// tips live here: one at a time, scrolling right to left along the bottom of the menu
function tipLibrary() {
  const inv = state.inv, t = [
    TOUCH ? 'Tap an icon, then tap it again for what you can do with it.' : `Arrows move around the pack. ${K.act} shows what you can do with something. ${K.menu} closes.`,
    `Seven slashes in rhythm become a whirlwind.`,
    `Hold ${K.act} and let go to stab. Stab, slash, stab chains hit harder.`,
    `Jump, then ${K.act} in the air to pound the ground.`,
    `Tap ${K.swap} to swap weapons. Hold it for the quick-select wheel.`,
    `${K.eat} eats. Choose which food comes first in the Food tab.`,
    `Carrying a rock: hold ${K.act} to aim, tap to set it down.`,
    'More max vigor means longer, higher jumps.',
    'Craft: put things on the mat, and if they make something, the result shows. Start with two, later three.',
    'Mountain gusts come in threes: two gentle, then a strong one from the same way. Watch the tall grass.',
    'Jump any time during the strong gust and it carries you to the next ledge downwind.',
    'The wind can\'t move you on a grassy ledge or a rock. Wait there for the gust you want.',
    'Turnips raise your max vigor for good.',
    'When vigor runs low every swing is slow and weak. Rest a moment.',
    'Startled birds drop seeds. Plant them in rich soil.',
    `Hold ${K.act} on a big rock and pull away from it to wiggle it free.`,
    'Stone plates hold gates open while something heavy sits on them.',
    TOUCH ? 'Use the pad to walk.' : 'Arrow keys walk.',
    'Slash, stomp or throw a rock at a tree to shake acorns loose.',
  ];
  if (inv.fire) t.push(`Hold ${K.fire} to breathe marsh gas, let go to spark it.`);
  if (inv.step) t.push(`${K.dash} dodges. Dodge a lunge at the last moment and time slows.`);
  if (inv.rod) t.push('Fish rise in still water. Strike the moment it bites.');
  if (Object.keys(inv.shrooms || {}).length) t.push('Traveler\'s mushrooms grow spores for fast travel.');
  return t.concat(state.tipPool || []);
}
function drawTipMarquee(fs) {
  const m = state.marquee || (state.marquee = { text: null, t0: 0 });
  ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
  const speed = Math.max(60, W * 0.07), y = H - fs * 0.8;
  if (!m.text || W - (state.time - m.t0) * speed + ctx.measureText(m.text).width < 0) {
    const pool = tipLibrary(); m.text = pool[Math.floor(Math.random() * pool.length)]; m.t0 = state.time;
  }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, y - fs * 0.95, W, fs * 1.35);
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - fs, W - 90, fs * 1.4); ctx.clip();
  ctx.fillStyle = 'rgba(253,246,227,.8)'; ctx.textAlign = 'left';
  ctx.fillText(m.text, W - (state.time - m.t0) * speed, y);
  ctx.restore();
}
// the quick-select wheel around the hero (drawn over the world, under the menu)
function drawRadial() {
  const r = state.radial;
  if (!r) return;
  const c = state.cam, h = state.hero, sx = W / 2 + (h.x - c.ex) * c.ez, sy = H / 2 + (h.y - c.ey) * c.ez - UNIT * 0.4;
  const R = Math.max(UNIT * 2.4, 90), n = r.opts.length, s = Math.max(UNIT * 0.9, 34);
  ctx.fillStyle = 'rgba(8,6,12,.35)'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = s * 1.3; ctx.beginPath(); ctx.arc(sx, sy, R, 0, 6.28); ctx.stroke();
  r.opts.forEach((o, i) => {
    const a = i / n * Math.PI * 2 - Math.PI / 2, x = sx + Math.cos(a) * R, y = sy + Math.sin(a) * R, on = i === r.sel;
    ctx.fillStyle = on ? 'rgba(242,201,76,.45)' : 'rgba(20,18,26,.8)'; ctx.beginPath(); ctx.arc(x, y, s * (on ? 0.72 : 0.6), 0, 6.28); ctx.fill();
    if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 3; ctx.stroke(); }
    const inSlot = o.kind !== 'none' && slotOf(o);
    if (r.slot && sameEntry(o, slotsOf()[r.slot])) { ctx.strokeStyle = '#9fd4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, 6.28); ctx.stroke(); }
    if (o.kind === 'none') { ctx.strokeStyle = 'rgba(253,246,227,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s * 0.28, 0, 6.28); ctx.moveTo(x - s * 0.2, y + s * 0.2); ctx.lineTo(x + s * 0.2, y - s * 0.2); ctx.stroke(); }
    else drawItemIcon(entryInfo(o).icon, x, y, s * 0.75);
    if (inSlot) { ctx.font = `bold ${Math.round(s * 0.3)}px "Courier New", monospace`; ctx.fillStyle = '#ffe38a'; ctx.textAlign = 'center'; ctx.fillText(slotLabel(inSlot), x + s * 0.42, y - s * 0.38); ctx.textAlign = 'left'; }
  });
  const sel = r.opts[r.sel], fs = Math.round(Math.max(14, UNIT * 0.45));
  ctx.textAlign = 'center'; ctx.font = `bold ${fs}px "Courier New", monospace`;
  ctx.fillStyle = r.slot ? '#9fd4ff' : 'rgba(253,246,227,.75)';
  ctx.fillText(r.slot ? `Set ${slotLabel(r.slot)}` : 'Use now', sx, sy - fs * 0.7);
  ctx.fillStyle = '#ffe38a'; ctx.fillText(sel ? radialLabel(sel, r.slot) : r.slot ? 'point, then let go' : `point, let go \u00b7 ${ALL_SLOTS.map(slotLabel).join('/')} to set a slot`, sx, sy + fs * 0.6);
  ctx.textAlign = 'left';
}
const BUILD = 'build 76';                            // shown on the pause screen so you can tell which version is running
function drawMenu() {
  const m = state.menu, items = menuItems();
  if (m.view === 'poses') { drawPoseSheet(); return; }
  if (m.view === 'chest') { drawChest(m); return; }
  if (m.view === 'book') { drawBook(m); return; }
  ctx.fillStyle = 'rgba(8,6,12,.72)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(253,246,227,.45)'; ctx.font = '12px "Courier New", monospace';
  ctx.fillText(BUILD, W - 10, H - 8); ctx.textAlign = 'left';
  const pw = Math.min(W - 30, 520), fs = Math.round(Math.max(14, Math.min(20, UNIT * 0.55))), lh = fs * 2.1;
  const titles = { main: 'Paused', equip: 'Equipment', save: 'Save game', load: 'Load game', new: 'Start a new adventure?', keys: 'Controls', levels: 'Testing: set levels', forge: 'Workbench', pack: 'Pack', spores: 'Spore travel', settings: 'Settings' };
  let y = Math.max(40, H * 0.14);
  const x = (W - pw) / 2;
  ctx.textAlign = 'center'; ctx.fillStyle = '#fdf6e3';
  ctx.font = `bold ${Math.round(fs * 1.6)}px Georgia, serif`; ctx.fillText(titles[m.view], W / 2, y); y += fs * 2;
  ctx.font = `${fs}px "Courier New", monospace`;
  if (m.view === 'forge') {
    ctx.textAlign = 'left'; ctx.fillStyle = '#d8d0c0';
    ctx.fillText('Materials: ' + Object.keys(MATS).map(k => `${MATS[k]} ${state.inv.mats[k]}`).join(', '), x + 10, y); y += fs * 1.8;
    ctx.textAlign = 'center';
  }
  if (m.view === 'pack') { drawPack(m, x, y, pw, fs); ctx.textAlign = 'left'; return; }
  state.menuRects = [];
  items.forEach((label, i) => {
    const sel = i === m.sel;
    ctx.fillStyle = sel ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.05)';
    ctx.fillRect(x, y - fs * 1.2, pw, lh - 6);
    ctx.fillStyle = sel ? '#ffe38a' : '#fdf6e3';
    ctx.fillText((sel ? '\u25B8 ' : '') + label, W / 2, y);
    state.menuRects.push({ x, y: y - fs * 1.2, w: pw, h: lh - 6, i });
    y += lh;
  });
  if (m.note) { ctx.fillStyle = '#b8f28a'; ctx.fillText(m.note, W / 2, y + fs * 0.4); y += lh; }
  ctx.fillStyle = 'rgba(253,246,227,.6)'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
  ctx.fillText(TOUCH ? 'tap to choose' : `\u2191 \u2193 to move, ${K.act} to choose, ${K.menu} to close`, W / 2, Math.min(H - 20, y + fs));
  ctx.textAlign = 'left';
}
