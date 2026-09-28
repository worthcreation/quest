// ===== draw.js: World drawing: ground, solids, patches, hero, Pip, enemies, items, mud, ravines.

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

let DRAW_SCENE_STRIDE = 1;                             // tests set this higher: the world is drawn every Nth frame, the UI every frame
function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const c = state.cam, sc = sceneDef();
  ctx.save();
  if (state.shake > 0) { const m = state.shake * UNIT * 0.5; ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m); }
  ctx.translate(W / 2, H / 2); ctx.scale(c.ez, c.ez); ctx.translate(-c.ex, -c.ey);
  state.frameNo = (state.frameNo || 0) + 1;
  if (DRAW_SCENE_STRIDE === 1 || state.frameNo % DRAW_SCENE_STRIDE === 0) { drawScene(sc); if (sc.id === 'tentin') { drawCandles(sc); drawTentLantern(sc); } if (sc.feat.snorkels) drawSnorkels(sc); if (sc.feat.beetle) drawBeetleWaiting(sc); }
  ctx.restore();
  if (state.dusk && sc.area !== 'indoor') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(60,40,110,.36)'); g.addColorStop(1, 'rgba(200,100,60,.18)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);   // twilight
    if (state.inv.lantern) {                          // the candle lantern: a warm pool of light around you, flickering a little
      const [lx, ly] = toScreen(state.hero.x, state.hero.y - state.hero.z), f = 0.9 + 0.1 * Math.sin(state.time * 11) + 0.05 * Math.sin(state.time * 27);
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, UNIT * 4 * f); lg.addColorStop(0, 'rgba(255,200,120,.28)'); lg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, UNIT * 4, 0, 6.28); ctx.fill();
    }
  }
  if (!state.intro) drawQuestHud();                     // the quest HUD is the bottom layer of the screen: hints, bubbles, banners all draw over it
  if (state.sporeTint > 0.01) { ctx.fillStyle = `rgba(150,100,220,${state.sporeTint * 0.55})`; ctx.fillRect(0, 0, W, H); }   // spore travel: the world goes violet
  if (state.dawn && state.time - state.dawn < 12) { const k = 1 - (state.time - state.dawn) / 12; ctx.fillStyle = `rgba(255,190,120,${0.22 * k})`; ctx.fillRect(0, 0, W, H); }   // first light
  if (sc.dim) {                                          // a dark room: the lantern (if you have it) and the mushroom glow
    const h = state.hero, [hx, hy] = toScreen(h.x, h.y), R = UNIT * (state.inv.lantern ? 4.5 : 2.2) * state.cam.ez;
    const g = ctx.createRadialGradient(hx, hy, R * 0.3, hx, hy, R); g.addColorStop(0, 'rgba(8,6,10,0)'); g.addColorStop(1, `rgba(8,6,10,${sc.dim + 0.3})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  drawRideVignette();
  if (state.settings.tiles) drawTiles();
  drawActionHint();
  drawHUD();
  drawRadial();
  if (state.flash > 0) { ctx.fillStyle = `rgba(235,240,255,${state.flash * 0.8})`; ctx.fillRect(0, 0, W, H); }
  if (state.fade > 0.01) { ctx.fillStyle = `rgba(0,0,0,${state.fade})`; ctx.fillRect(0, 0, W, H); }
  drawTexts();
  drawChoice();
  drawCoach();                                          // quest info first, so a banner always sits on top of it
  if (!state.menu) drawScroll();                       // every note is a scroll now (the bottom-left feed is gone)
  drawTitle();
  if (state.menu) { drawMenu(); drawCoach(); }       // (inside the pack the pinned step still shows over it)
  drawHighTitle();                                      // the High Reaches title card, over everything
}

// dusk in the lean-to: candles on the crate and the chest, flickering, each with a warm pool of light
const lanternSpot = () => { const b = WORLD.tentin.feat.bedroll; return [(b[0] + 0.07) * W, (b[1] + 0.1) * H]; };
function drawTentLantern(sc) {
  if (sc.id !== 'tentin' || state.inv.lantern) return;
  const [x, y] = lanternSpot(), u = UNIT, lit = !!state.dusk, f = 0.85 + 0.15 * Math.sin(state.time * 11);
  if (lit) { const g = ctx.createRadialGradient(x, y - u * 0.25, 0, x, y - u * 0.25, u * 2.4 * f); g.addColorStop(0, 'rgba(255,200,120,.35)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - u * 0.25, u * 2.4 * f, 0, 6.28); ctx.fill(); }
  ctx.strokeStyle = '#5a4128'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - u * 0.52, u * 0.1, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - u * 0.16, y - u * 0.46, u * 0.32, u * 0.07); ctx.fillRect(x - u * 0.16, y - u * 0.04, u * 0.32, u * 0.07);
  ctx.fillStyle = lit ? `rgba(255,${190 + 40 * f},90,.95)` : 'rgba(210,200,170,.55)'; ctx.fillRect(x - u * 0.12, y - u * 0.39, u * 0.24, u * 0.35);   // glass: glowing, or dull by day
  ctx.fillStyle = lit ? '#fff4c0' : '#efe6d2'; ctx.fillRect(x - u * 0.03, y - u * 0.26, u * 0.06, u * 0.15);   // the candle inside
}
function drawCandles(sc) {
  const f = sc.feat, spots = [f.book && [f.book[0] + 0.03, f.book[1] - 0.02], f.chest && [f.chest[0] - 0.03, f.chest[1] - 0.03], f.bedroll && [f.bedroll[0] + 0.07, f.bedroll[1] - 0.05]].filter(Boolean);
  spots.forEach(([fx, fy], i) => {
    const x = fx * W, y = fy * H, u = UNIT, fl = 0.8 + 0.12 * Math.sin(state.time * (9 + i * 2)) + 0.08 * Math.sin(state.time * (23 + i * 5));
    if (!state.dusk) { ctx.fillStyle = '#efe6d2'; ctx.fillRect(x - u * 0.06, y - u * 0.3, u * 0.12, u * 0.3); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - u * 0.01, y - u * 0.36, u * 0.02, u * 0.06); return; }   // unlit by day
    const g = ctx.createRadialGradient(x, y - u * 0.35, 0, x, y - u * 0.35, u * 2.2 * fl); g.addColorStop(0, 'rgba(255,200,120,.32)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - u * 0.35, u * 2.2 * fl, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(x - u * 0.06, y - u * 0.3, u * 0.12, u * 0.3);
    ctx.fillStyle = `rgba(255,${200 + 30 * fl},90,.95)`; ctx.beginPath(); ctx.ellipse(x, y - u * 0.38 - fl * u * 0.02, u * 0.05, u * 0.1 * fl, 0, 0, 6.28); ctx.fill();
  });
}
function drawScene(sc) {
  const dark = sc.area === 'cave' || sc.area === 'hollow';
  if (sc.id === 'rapids') { drawRapids(); drawFx(); return; }
  ctx.fillStyle = sc.floor; ctx.fillRect(0, 0, W, H);
  if (sc.wade) drawWaterScreen(sc); else if (sc.area === 'peak') drawCrags(sc); else drawGround(sc);
  if (sc.vista) { drawHighVista(sc); drawLedgeLips(sc); }   // the High Reaches: the view down past the edge
  drawMiniShrooms(sc);                                   // little mushrooms in the damp and dark places
  if (sc.corridor) drawMountainSides(sc);                // the mountain path: rock rising on either side of the way
  if (sc.feat.trapdoor) { const [tx, ty] = sc.feat.trapdoor, u = UNIT; ctx.fillStyle = '#4a3420'; ctx.fillRect(tx * W - u * 0.6, ty * H - u * 0.45, u * 1.2, u * 0.9); ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 2; ctx.strokeRect(tx * W - u * 0.6, ty * H - u * 0.45, u * 1.2, u * 0.9); ctx.fillStyle = '#8a7a5a'; ctx.beginPath(); ctx.arc(tx * W + u * 0.35, ty * H, u * 0.07, 0, 6.28); ctx.fill(); }   // Wick's trapdoor
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
  if (sc.feat.peek) layer.push([sc.feat.peek[1] * H + UNIT * 0.3, () => drawPeekGremlin(sc)]);   // peeking over the boulder (sorted with it, so the boulder hides its body)
  if (state.pip && state.pip.show && !sc.npcs.some(n => n.kind === 'pip' && npcHere(n)) && (state.pip.follow || sc.id === 'camp' || sc.id === 'start')) layer.push([state.pip.y, () => { const py = state.pip.y - (state.pip.hz || 0) - (state.pip.bz || 0); drawPip(state.pip.x, py, { side: state.pip.side, bound: state.pip.bound }); }]);
  if (state.gremlins && sc.id === 'w2') for (const g of state.gremlins) layer.push([g.y, () => drawEnemy({ type: g.book ? 'thief' : 'gremlin', x: g.x, y: g.y - (g.hz || 0), r: UNIT * 0.42, mode: 'dart', t: 1, flash: 0, vx: 1 })]);
  if (state.gremlins && sc.id === 'start') for (const g of state.gremlins) layer.push([g.y, () => drawEnemy({ type: g.book ? 'thief' : 'gremlin', x: g.x, y: g.y, r: UNIT * 0.42, mode: 'dart', t: 1, flash: 0, vx: 1 })]);
  layer.push([state.hero.y, drawHero]);
  const gl = state.glimpse;
  if (gl && gl.t > 0 && !gl.gone) layer.push([gl.y, () => {
    const shrink = gl.down ? 1 - Math.max(0, (gl.t - 1.9) / 0.4) : 1;
    ctx.save(); ctx.translate(gl.x, gl.y); ctx.scale(shrink, shrink); ctx.translate(-gl.x, -gl.y);
    drawPip(gl.x, gl.y, { bound: true });
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
    if (f.cave) {                                  // the cave mouth: a rocky outcrop with a dark arch going down into the hill
      const x = f.cave[0] * W, y = f.cave[1] * H, u = UNIT;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y + u * 0.9, u * 2.2, u * 0.7, 0, 0, 6.28); ctx.fill();
      drawJagged(x - u * 1.1, y - u * 0.5, u * 1.1, 11.3, ['#6f6a60', '#817b70', '#5c574e']); drawJagged(x + u * 1.1, y - u * 0.4, u * 1.05, 17.9, ['#6f6a60', '#817b70', '#5c574e']);
      drawJagged(x, y - u * 1.2, u * 1.2, 23.1, ['#77726a', '#8a8479', '#625d55']);
      ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.moveTo(x - u * 0.75, y + u * 0.55); ctx.lineTo(x - u * 0.7, y - u * 0.1); ctx.quadraticCurveTo(x, y - u * 0.95, x + u * 0.7, y - u * 0.1); ctx.lineTo(x + u * 0.75, y + u * 0.55); ctx.closePath(); ctx.fill();   // the arch
      const g = ctx.createLinearGradient(0, y - u * 0.7, 0, y + u * 0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,40,90,.35)'); ctx.fillStyle = g; ctx.fill();   // a faint cold breath from below
      ctx.fillStyle = '#4a3a24'; ctx.fillRect(x - u * 0.8, y + u * 0.5, u * 1.6, u * 0.12);   // the worn lip of the entrance
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
    ctx.lineCap = 'round';
    for (const d of sc.deco) {                        // clumps of thick dark reeds, blades bowing over, black bulrush heads
      const x = d.fx * W, y = d.fy * H, s = UNIT * 1.0 * d.s, sw = Math.sin(state.time * 0.9 + d.ph) * s * 0.07, w = Math.max(3, s * 0.09);
      ctx.fillStyle = 'rgba(10,14,8,.35)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 2, s * 0.35, s * 0.12, 0, 0, 6.28); ctx.fill();
      for (const [o, hk] of [[-0.18, 0.85], [0, 1], [0.16, 0.75], [0.3, 0.6]]) {
        ctx.strokeStyle = hk === 1 ? '#2e3a1c' : '#3a4622'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x + o * s, y); ctx.quadraticCurveTo(x + o * s + sw * 0.5, y - s * hk * 0.5, x + o * s + sw, y - s * hk); ctx.stroke();
      }
      ctx.fillStyle = '#34401e'; const bx = x + sw, by = y - s * 0.6, dir = d.ph > 3 ? 1 : -1;   // one saw-edged blade bowing out
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + dir * s * 0.3, by - s * 0.15, bx + dir * s * 0.5, by + s * 0.3); ctx.lineTo(bx + dir * s * 0.1, by + s * 0.08); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(x + sw, y - s * 0.92, w * 0.9, s * 0.16, 0, 0, 6.28); ctx.fill();   // the bulrush head
    }
    ctx.lineCap = 'butt';
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
  for (const c of sc.vista ? [] : sc.chasms || []) drawBrokenChasm(c, 'crag');

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
        } else if (p.s) { const cp = state.pull && state.pull.id === 'crop' + i && sc.pullables.find(q => q.id === 'crop' + i), lift = cp ? Math.min(1, state.pull.wiggle / cp.need) : 0;
          ctx.save(); ctx.translate(x, y - lift * UNIT * 0.3); if (cp) ctx.rotate(state.pull.tilt * 0.8); ctx.scale(0.4 + st * 0.25, 0.4 + st * 0.25); if (st >= 3) drawItemIcon(crop, 0, 0, UNIT); else { ctx.fillStyle = '#5aa04a'; ctx.fillRect(-2, -UNIT * 0.3, 4, UNIT * 0.3); if (st) { ctx.beginPath(); ctx.ellipse(-5, -UNIT * 0.3, 6, 3, -0.5, 0, 6.28); ctx.ellipse(5, -UNIT * 0.3, 6, 3, 0.5, 0, 6.28); ctx.fill(); } } ctx.restore(); }
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
// a throwing stone: lumpy and irregular, each one its own shape (seed), smooth-edged bumps, a lit top, a pit or two
function drawRock(x, y, r, seed = 3.7, shadow = true) {
  let s = Math.abs(Math.floor(seed * 9973)) % 233280 + 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = 7, pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + (rnd() - 0.5) * 0.5, rr = r * (0.78 + rnd() * 0.36); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.82]); }
  const blob = (sc, dx, dy) => { ctx.beginPath(); for (let i = 0; i < n; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n], mx = (ax + bx) / 2, my = (ay + by) / 2; if (!i) ctx.moveTo(x + dx + (pts[n - 1][0] + ax) / 2 * sc, y + dy + (pts[n - 1][1] + ay) / 2 * sc); ctx.quadraticCurveTo(x + dx + ax * sc, y + dy + ay * sc, x + dx + mx * sc, y + dy + my * sc); } ctx.closePath(); };
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,.22)'; blob(1, r * 0.15, r * 0.3); ctx.fill(); }
  ctx.fillStyle = '#86857c'; blob(1, 0, 0); ctx.fill();
  ctx.save(); blob(1, 0, 0); ctx.clip(); ctx.fillStyle = '#a2a196'; blob(0.72, -r * 0.18, -r * 0.2); ctx.fill();   // the lit top
  ctx.fillStyle = 'rgba(60,56,50,.35)'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(x + (rnd() - 0.4) * r * 0.9, y + (rnd() - 0.3) * r * 0.6, r * (0.08 + rnd() * 0.08), r * 0.06, rnd() * 3, 0, 6.28); ctx.fill(); }   // pits
  ctx.restore();
  ctx.strokeStyle = 'rgba(50,46,40,.45)'; ctx.lineWidth = 1.2; blob(1, 0, 0); ctx.stroke();
}
const rockSeedOf = pl => (pl.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 0.37 + pl.fx * 11;   // the same stone in the ground, in your arms, in the air
// where a stone meets the ground: just a zigzag brown line along its base, the look of being sunk in
function drawSoilLine(x, y, w, amp, seed = 1) {
  ctx.strokeStyle = 'rgba(74,56,34,.85)'; ctx.lineWidth = Math.max(2, amp * 0.5); ctx.lineJoin = 'round'; ctx.beginPath();
  const n = Math.max(6, Math.round(w / (amp * 1.6)));
  for (let i = 0; i <= n; i++) { const k = i / n, xx = x - w / 2 + k * w, yy = y - Math.sin(k * Math.PI) * amp * 0.9 + (i % 2 ? -amp * 0.45 : amp * 0.2) + Math.sin(i * 2.7 + seed) * amp * 0.15; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke(); ctx.lineJoin = 'miter';
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
      if (kind === 'boulder' && s.craggy) {                     // up the mountain the boulders turn rough: the woods' craggy stone, sunk in the ground
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.35, r * 1.05, r * 0.5, 0, 0, 6.28); ctx.fill();
        drawJagged(x, y - r * 0.1, r * 1.02, x * 2.9 + y * 4.1, ['#86827a', '#9a968c', '#6e6a62']);
        const fl = sceneDef().floor || '#7d9a4c', by = y + r * 0.45; ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(x - r * 1.2, by + r * 0.5);
        for (let i = 0; i <= 10; i++) { const k = i / 10; ctx.lineTo(x - r * 1.1 + k * r * 2.2, by - Math.sin(k * Math.PI) * r * 0.18 + Math.sin(i * 2.3 + x) * r * 0.04); } ctx.lineTo(x + r * 1.2, by + r * 0.5); ctx.closePath(); ctx.fill();
        break;
      }
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
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 - 1.57; ctx.fillStyle = '#7a7a70'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * u * 0.42, y + Math.sin(a) * u * 0.28, u * 0.12, 0, 6.28); ctx.fill(); }
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
      drawTravelShroom(x, y, u, found, glow, sceneDef().id);
      if (found && Math.random() < 0.008) state.fx.push({ x: x + (Math.random() - 0.5) * u, y: y - u * 1.2, vx: 0, vy: -u * 0.25, t: 0, life: 2.6, color: 'spore', size: u * 0.05 });
      break;
    }
    case 'stone':
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 2, y + r * 0.4, r, r * 0.45, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#7e7e74'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#9a9a8e'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.3, 0, 0, 6.28); ctx.fill();
      break;
    case 'wedge': {                                // one big irregular boulder each, jammed against its neighbours; moss in the joins
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.55, r * 1.2, r * 0.45, 0, 0, 6.28); ctx.fill();
      drawJagged(x, y - r * 0.1, r * 1.15, x * 3.1 + y * 7.7, ['#7d776c', '#8f887b', '#6c665c']);
      ctx.fillStyle = 'rgba(90,140,70,.55)'; ctx.beginPath(); ctx.ellipse(x + r * 0.2, y + r * 0.35, r * 0.3, r * 0.1, 0.3, 0, 6.28); ctx.fill();
      break;
    }
    case 'log':                                    // a heavy log braced across the way
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.5, r * 1.1, r * 0.4, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#5e4128'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.05, r * 0.85, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#46301c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r * 0.6, r * 0.45, 0, 0, 6.28); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.25, r * 0.2, 0, 0, 6.28); ctx.stroke();
      break;
    case 'wall': break;                                // the room draws its own walls
    case 'crystalbug': drawCrystalBug(s); break;
    case 'crate': ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - r + 3, y - r * 0.4 + 3, r * 2, r * 1.3); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - r, y - r * 0.8, r * 2, r * 1.4); ctx.strokeStyle = '#3a2814'; ctx.lineWidth = 2; ctx.strokeRect(x - r, y - r * 0.8, r * 2, r * 1.4); ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.8); ctx.lineTo(x + r, y + r * 0.6); ctx.moveTo(x + r, y - r * 0.8); ctx.lineTo(x - r, y + r * 0.6); ctx.stroke(); break;
    case 'barrel': ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.5, r * 0.9, r * 0.35, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.2, r * 0.85, r, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#3a2814'; ctx.lineWidth = 2; for (const k of [-0.5, 0.3]) { ctx.beginPath(); ctx.ellipse(x, y + k * r, r * 0.8, r * 0.2, 0, 0, Math.PI); ctx.stroke(); } break;
    case 'crag': {
      const hits = rtFor(state.scene).flags['hits_' + s.bar] || 0, k = hits / (s.hp || 1), lit = s.tint || '#8a8478';
      if (s.gap) { ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.ellipse(x + r * 0.98, y + r * 0.25, u * 0.22, r * 0.45, 0.15, 0, 6.28); ctx.fill(); }   // the narrow gap beside it
      drawJagged(x, y - r * 0.15, r * 1.05, x * 3.7 + y * 1.3, [lit, shade(lit, 18), shade(lit, -22)]);
      { const fl = sceneDef().floor || '#5f8a4a', by = y + r * 0.42;                  // sunk into the ground: soil banked up round its foot, a rim of dirt
        ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(x - r * 1.25, by + r * 0.5);
        for (let i = 0; i <= 12; i++) { const k = i / 12, xx = x - r * 1.15 + k * r * 2.3; ctx.lineTo(xx, by - Math.sin(k * Math.PI) * r * 0.22 + Math.sin(i * 2.7 + x) * r * 0.04); }
        ctx.lineTo(x + r * 1.25, by + r * 0.5); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(74,56,34,.75)'; ctx.lineWidth = Math.max(2, r * 0.06); ctx.beginPath();
        for (let i = 0; i <= 12; i++) { const k = i / 12, xx = x - r * 1.15 + k * r * 2.3, yy = by - Math.sin(k * Math.PI) * r * 0.22 + Math.sin(i * 2.7 + x) * r * 0.04; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
        }
      ctx.strokeStyle = 'rgba(28,20,12,.9)'; ctx.lineCap = 'round';
      let q = Math.abs(Math.floor((x * 13.1 + y * 7.7) * 1000)) % 233280; const rnd = () => (q = (q * 9301 + 49297) % 233280) / 233280;
      const cracks = Math.round(k * (4 + (s.size || 1) * 2));                                                           // more and longer with each hit
      for (let c = 0; c < cracks; c++) { const a = rnd() * 6.28, l = r * (0.35 + rnd() * 0.5) * (0.6 + k * 0.6); ctx.lineWidth = 1.5 + k * 2; ctx.beginPath(); let cx = x + Math.cos(a) * r * 0.15, cy = y - r * 0.15 + Math.sin(a) * r * 0.1; ctx.moveTo(cx, cy);
        for (let seg = 0; seg < 3; seg++) { cx += Math.cos(a + (rnd() - 0.5) * 0.9) * l / 3; cy += Math.sin(a + (rnd() - 0.5) * 0.9) * l / 3 * 0.8; ctx.lineTo(cx, cy); } ctx.stroke(); }
      ctx.lineCap = 'butt';
      break;
    }
    case 'cracked': {
      if (s.rope) { const rx = s.rope[0] * W, ry = s.rope[1] * H; ctx.strokeStyle = '#b09a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - r * 0.2); ctx.quadraticCurveTo((x + rx) / 2, (y + ry) / 2 + UNIT * 0.4, rx, ry); ctx.stroke(); }
      const ST = s.stone && STONES[s.stone], hits = rtFor(state.scene).flags['hits_' + s.bar] || 0;
      drawJagged(x, y, r * 1.1, x * 5.3 + y * 2.9, ['#8a8478', '#9c9587', '#766f64'], ST && ST.tint);   // big, faceted, rough: nothing like a smooth throwing stone
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
    case 'reeds': {                                // a wall of great dark reeds: thick stalks, saw-edged blades hanging over, black bulrush heads
      const t = state.time, seed = s.fx * 97 + s.fy * 13;
      ctx.fillStyle = 'rgba(10,14,8,.55)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.55, r * 1.35, r * 0.45, 0, 0, 6.28); ctx.fill();   // the dark mass at their feet
      const n = 9;
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1) - 0.5, hx = x + k * r * 2.2, ht = r * (1.9 + 0.7 * Math.abs(Math.sin(seed + i * 1.7))), sway = Math.sin(t * 0.7 + i * 0.9 + seed) * r * 0.08;
        const top = [hx + sway + k * r * 0.4, y + r * 0.5 - ht], w = Math.max(4, r * 0.16);
        const g = ctx.createLinearGradient(0, y + r * 0.6, 0, top[1]); g.addColorStop(0, '#12180c'); g.addColorStop(0.5, '#2e3a1c'); g.addColorStop(1, '#4a5228');
        ctx.strokeStyle = g; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, y + r * 0.6); ctx.quadraticCurveTo(hx + sway * 0.5, y - ht * 0.3, top[0], top[1]); ctx.stroke();
        if (i % 2 === 0) {                                                                         // a bulrush head: long, black-brown, a spike on top
          ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(top[0], top[1] + r * 0.28, w * 0.9, r * 0.32, sway * 0.02, 0, 6.28); ctx.fill();
          ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(top[0] + sway * 0.3, top[1] - r * 0.3); ctx.stroke();
        } else {                                                                                   // a blade bowing out and down, serrated
          const dir = (i % 4 === 1 ? -1 : 1), bx0 = top[0], by0 = top[1] + r * 0.2, bx1 = bx0 + dir * r * 0.9, by1 = by0 + r * 0.55;
          ctx.fillStyle = '#34401e'; ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.quadraticCurveTo(bx0 + dir * r * 0.5, by0 - r * 0.25, bx1, by1);
          for (let j = 5; j >= 0; j--) { const q = j / 5; ctx.lineTo(bx0 + (bx1 - bx0) * q + dir * (j % 2 ? 3 : 0), by0 + (by1 - by0) * q + (j % 2 ? 5 : 1)); }   // the saw teeth
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(200,210,150,.5)'; for (let i = 0; i < 3; i++) { const a = seed + i * 2.3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.8, y - r * (0.6 + (i % 2) * 0.6), 1.5, 0, 6.28); ctx.fill(); }   // thorns catching the light
      ctx.lineCap = 'butt';
      break;
    }
    case 'web':
      ctx.strokeStyle = 'rgba(225,225,215,.7)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + s.fx * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); ctx.stroke(); }
      for (const k of [0.4, 0.8, 1.15]) { ctx.beginPath(); ctx.arc(x, y, r * k, 0, 6.28); ctx.stroke(); }
      break;
  }
}

// ---------------- characters ----------------
const PIP_SIZE = 0.6;                                     // Pip is about 60% of your size
// Pip, drawn one way everywhere (following you, as a character in a scene, in the glimpse, tied up): 60% of your
// size, feet on the ground line, his colour and his two dot eyes. Every place that shows Pip calls this.
// Every traveler's mushroom is its own: the place it grows in picks its height, stem, cap shape, shade and markings.
const SHROOM_LOOKS = {
  camp: { h: 1.1, stem: 0.3, cap: 'dome', w: 0.85, c: ['#9a6ad8', '#7a5aa8'], mark: 'spots' },
  w2:   { h: 1.5, stem: 0.24, cap: 'cone', w: 0.7, c: ['#7a4ac0', '#5a3a90'], mark: 'rings' },
  foot: { h: 0.8, stem: 0.4, cap: 'flat', w: 1.15, c: ['#b07ad8', '#8a5aa8'], mark: 'stripes' },
  c4:   { h: 1.3, stem: 0.26, cap: 'bell', w: 0.8, c: ['#6a3a98', '#4a2a70'], mark: 'glowdots' },
  m1:   { h: 1.0, stem: 0.34, cap: 'frill', w: 0.95, c: ['#c07ad0', '#9a5aa8'], mark: 'spots' },
  sw2:  { h: 1.7, stem: 0.22, cap: 'dome', w: 0.75, c: ['#8a4a9a', '#6a3a78'], mark: 'rings' },
};
function drawTravelShroom(x, y, u, found, glow, id) {
  const L = SHROOM_LOOKS[id] || SHROOM_LOOKS.camp, ht = u * L.h, cy = y - ht - u * 0.05, cw = u * L.w;
  ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(x - u * L.stem / 2, y + u * 0.12); ctx.quadraticCurveTo(x - u * L.stem * 0.2, y - ht * 0.5, x - u * L.stem * 0.4, cy); ctx.lineTo(x + u * L.stem * 0.4, cy); ctx.quadraticCurveTo(x + u * L.stem * 0.3, y - ht * 0.5, x + u * L.stem / 2, y + u * 0.12); ctx.closePath(); ctx.fill();
  const g = ctx.createRadialGradient(x, cy, 0, x, cy, u * (1.2 + glow * 1.4)); g.addColorStop(0, `rgba(210,175,255,${0.1 + 0.45 * glow})`); g.addColorStop(1, 'rgba(210,175,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - u * 2.8, cy - u * 2.8, u * 5.6, u * 5.6);
  ctx.fillStyle = found ? L.c[0] : L.c[1]; ctx.beginPath();
  if (L.cap === 'dome') ctx.ellipse(x, cy, cw, u * 0.5, 0, Math.PI, 0);
  else if (L.cap === 'cone') { ctx.moveTo(x - cw, cy); ctx.quadraticCurveTo(x - cw * 0.3, cy - u * 0.4, x, cy - u * 1.0); ctx.quadraticCurveTo(x + cw * 0.3, cy - u * 0.4, x + cw, cy); }
  else if (L.cap === 'flat') { ctx.ellipse(x, cy, cw, u * 0.28, 0, Math.PI, 0); }
  else if (L.cap === 'bell') { ctx.moveTo(x - cw, cy + u * 0.15); ctx.bezierCurveTo(x - cw, cy - u * 0.9, x + cw, cy - u * 0.9, x + cw, cy + u * 0.15); }
  else { for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, rr2 = cw * (1 + (i % 2) * 0.1); ctx.lineTo(x + Math.cos(a) * rr2, cy + Math.sin(a) * u * 0.5); } }   // frilled edge
  ctx.closePath(); ctx.fill();
  const sp = k => found ? shroomGlow(k * 1.7 + x * 0.01, state.time * 0.9) : 0.15;
  if (L.mark === 'spots' || L.mark === 'glowdots') [[-0.45, -0.25], [0.1, -0.45], [0.45, -0.2], [-0.1, -0.15]].forEach(([dx, dy], k) => { ctx.fillStyle = L.mark === 'glowdots' ? `rgba(160,255,220,${0.3 + 0.7 * sp(k)})` : `rgba(245,232,255,${0.3 + 0.6 * sp(k)})`; ctx.beginPath(); ctx.arc(x + dx * cw, cy + dy * u, u * 0.09, 0, 6.28); ctx.fill(); });
  if (L.mark === 'rings') for (let k = 1; k <= 2; k++) { ctx.strokeStyle = `rgba(245,232,255,${0.25 + 0.5 * sp(k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, cy - u * 0.05, cw * (1 - k * 0.3), u * (0.45 - k * 0.12), 0, Math.PI, 0); ctx.stroke(); }
  if (L.mark === 'stripes') for (let k = -2; k <= 2; k++) { ctx.strokeStyle = `rgba(245,232,255,${0.25 + 0.5 * sp(k + 2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + k * cw * 0.3, cy); ctx.lineTo(x + k * cw * 0.2, cy - u * 0.24); ctx.stroke(); }
  if (found && Math.random() < 0.008) state.fx.push({ x: x + (Math.random() - 0.5) * u, y: cy, vx: (Math.random() - 0.5) * u * 0.2, vy: -u * 0.25, t: 0, life: 2.6, color: 'spore', size: u * 0.05 });   // a spore now and then, drifting up
}
// little mushrooms strewn about damp, dark places: clusters of two to five, each a small cap on a thin stem
const MINI_CAPS = { woods: ['#a07a4a', '#c8a878', '#7a5a3a', '#d8c8a8'], cave: ['#8ab0a0', '#6a8a9a', '#b0a0c8', '#c8d8c0'], forest: ['#b08a5a', '#d0b890', '#a05a3a'], cellar: ['#c8b890', '#a08a6a', '#d8d0b0', '#b0a0c0'], swamp: ['#8a8a5a', '#a0a070', '#6a7a4a'] };
function drawMiniShrooms(sc) {
  const list = sc.feat.minis; if (!list) return;
  const glowy = sc.area === 'cave' || sc.area === 'hollow' || sc.id === 'cellar';
  for (const [fx, fy, n, seed, kind] of list) {
    const x0 = fx * W, y0 = fy * H, caps = MINI_CAPS[kind] || MINI_CAPS.woods;
    for (let i = 0; i < n; i++) {
      const a = seed * 7 + i * 2.1, x = x0 + Math.cos(a) * UNIT * 0.28 * i, y = y0 + Math.sin(a) * UNIT * 0.12 * i, s = UNIT * (0.12 + ((seed * 13 + i * 5) % 7) / 50), c = caps[(Math.floor(seed * 10) + i) % caps.length];
      ctx.fillStyle = '#e8e0cc'; ctx.fillRect(x - s * 0.18, y - s * 1.1, s * 0.36, s * 1.1);
      if (glowy && i % 2 === 0) { ctx.fillStyle = `rgba(170,255,210,${0.12 + 0.08 * Math.sin(state.time * 1.3 + seed + i)})`; ctx.beginPath(); ctx.arc(x, y - s * 1.1, s * 1.6, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - s * 1.1, s * 0.75, s * 0.45, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - s * 0.25, y - s * 1.3, s * 0.12, 0, 6.28); ctx.fill();
    }
  }
}
function drawPip(x, y, o = {}) {
  ctx.save(); ctx.translate(x, y + UNIT * 0.5); ctx.scale(PIP_SIZE, PIP_SIZE); ctx.translate(-x, -(y + UNIT * 0.5));
  drawPerson(x, y, '#7ab8e0', 0);
  if (o.bound) drawVineWrap(x, y);
  ctx.restore();
}
function drawPerson(x, y, color, z, dim = 0) {
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 2, y + UNIT * 0.45, UNIT * 0.55, UNIT * 0.2, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(x - UNIT / 2, y - z - UNIT / 2, UNIT, UNIT);
  if (dim) { ctx.fillStyle = `rgba(40,40,60,${dim})`; ctx.fillRect(x - UNIT / 2, y - z - UNIT / 2, UNIT, UNIT); }
}
function drawNpc(n) {
  if (n.kind === 'worm') { drawWormNpc(n); return; }
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
    drawPip(x, y, { bound: n.bound });
  }
}
function drawHero() {
  const h = state.hero;
  if (MODEL_ON()) { drawHeroModelInWorld(h, state.cut && state.cut.type === 'sword'); return; }
  if (h.falling > 0) {
    const k = h.falling / 0.8, s = UNIT * k;
    ctx.fillStyle = heroColor(); ctx.fillRect(h.x - s / 2, h.y - s / 2 + (1 - k) * UNIT, s, s);
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
  ctx.fillStyle = h.stun > 0 ? '#ffffff' : heroColor();
  ctx.fillRect(h.x - pw / 2, y - ph / 2, pw, ph);
  if (r < 0.35) { ctx.fillStyle = `rgba(60,50,80,${(0.35 - r) * 1.3})`; ctx.fillRect(h.x - pw / 2, y - ph / 2, pw, ph); }
  if (wears('cap')) drawScalp(h.x, y - ph / 2, UNIT);
  drawWorn(h.x, y - ph / 2, pw, ph, UNIT);
  if (state.carry === 'rock') drawRock(h.x, y - ph / 2 - UNIT * 0.55, UNIT * 0.62, state.carrySeed || 3.7);
  else if (bladeKind() && !state.carry && state.time >= (state.noSwingUntil || 0) && !(state.cut && state.cut.type === 'sword' && !state.inv.sword)) drawSword(h, pw, ph, y, heroic);   // both hands on a stone: the blade's put away
}
// the steel blade on its own (honing level given), so the stump sword and the sword in hand look the same
// a big rough stone: an irregular outline of flat facets (seeded so it holds still), a lit face and a shadowed face
// a colour a little lighter (+) or darker (-)
function shade(hex, d) { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, v + d)); return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`; }
function drawJagged(x, y, r, seed, [mid, lit, dark], tint, g = ctx) {
  let s = Math.abs(Math.floor(seed * 1000)) % 233280; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = 9, pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.28 + (rnd() - 0.5) * 0.35, rr = r * (0.78 + rnd() * 0.32); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.82]); }
  g.fillStyle = mid; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill();
  if (tint) { g.globalAlpha = 0.42; g.fillStyle = tint; g.fill(); g.globalAlpha = 1; }   // a stone kind's colour, on the stone's own shape
  g.fillStyle = lit; g.beginPath(); g.moveTo(x, y); for (let i = 5; i <= 8; i++) g.lineTo(pts[i % n][0], pts[i % n][1]); g.lineTo(pts[0][0], pts[0][1]); g.closePath(); g.fill();   // the top-left faces catch the light
  g.fillStyle = dark; g.beginPath(); g.moveTo(x, y); for (let i = 1; i <= 3; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40,34,28,.5)'; g.lineWidth = 1.5; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.stroke();
}
function drawSteelBlade(len, w, edge) {
  ctx.fillStyle = ['#a4a8ab', '#b2b6b9', '#c2c6c9', '#d4d8db'][Math.min(3, edge)]; ctx.fillRect(0, -w / 2, len, w);
  ctx.beginPath(); ctx.moveTo(len, -w / 2); ctx.lineTo(len + w * 1.2, 0); ctx.lineTo(len, w / 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(len * 0.05, -w * 0.32, len * 0.9, Math.max(1, w * 0.14));
  if (edge < 3) {
    const spots = [[0.08, -0.3, 0.12, 0.5], [0.22, 0.05, 0.1, 0.45], [0.33, -0.4, 0.14, 0.4], [0.47, -0.05, 0.09, 0.55], [0.58, -0.35, 0.12, 0.35],
      [0.68, 0.1, 0.1, 0.4], [0.78, -0.25, 0.08, 0.5], [0.15, 0.2, 0.07, 0.3], [0.4, 0.25, 0.08, 0.25], [0.88, -0.1, 0.06, 0.4]];
    const n = [10, 6, 3][edge], a = [0.85, 0.65, 0.45][edge];
    for (let i = 0; i < n; i++) { const [sx, sy, sw, sh] = spots[i]; ctx.fillStyle = i % 3 ? `rgba(150,86,46,${a})` : `rgba(122,66,34,${a})`; ctx.beginPath(); ctx.ellipse(len * (sx + sw / 2), w * (sy + sh / 2), len * sw / 2, w * sh / 2, 0, 0, 6.28); ctx.fill(); }
  }
}
function bladeColor() { if (bladeKind() === 'wood') return '#b08a5a'; return state.inv.slime > 0 ? '#9fcf5a' : ['#a4a8ab', '#b2b6b9', '#c2c6c9', '#d4d8db'][Math.min(3, state.inv.up.edge)]; }
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
  if (!(state.inv.slime > 0)) {                                   // a thin shine along the steel
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(len * 0.05, -w * 0.32, len * 0.9, Math.max(1, w * 0.14));
  }
  if (state.inv.up.edge < 3 && !(state.inv.slime > 0)) {        // mottled with rust: many blooms at first, fewer and fainter with each honing
    const spots = [[0.08, -0.3, 0.12, 0.5], [0.22, 0.05, 0.1, 0.45], [0.33, -0.4, 0.14, 0.4], [0.47, -0.05, 0.09, 0.55], [0.58, -0.35, 0.12, 0.35],
      [0.68, 0.1, 0.1, 0.4], [0.78, -0.25, 0.08, 0.5], [0.15, 0.2, 0.07, 0.3], [0.4, 0.25, 0.08, 0.25], [0.88, -0.1, 0.06, 0.4]];
    const n = [10, 6, 3][state.inv.up.edge], a = [0.85, 0.65, 0.45][state.inv.up.edge];
    for (let i = 0; i < n; i++) { const [sx, sy, sw, sh] = spots[i]; ctx.fillStyle = i % 3 ? `rgba(150,86,46,${a})` : `rgba(122,66,34,${a})`; ctx.beginPath(); ctx.ellipse(len * (sx + sw / 2), w * (sy + sh / 2), len * sw / 2, w * sh / 2, 0, 0, 6.28); ctx.fill(); }
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
  if (state.aim.on && !state.carry && state.inv.acorns > 0) {       // winding up an acorn in the other hand; the blade stays out
    const s = -h.side;
    drawItemIcon('acorn', s * (pw * 0.5 + UNIT * 0.12), UNIT * 0.1, UNIT * 0.55);
    if (state.inv.silk) { ctx.strokeStyle = 'rgba(232,228,240,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s * pw * 0.45, UNIT * 0.25); ctx.lineTo(s * (pw * 0.5 + UNIT * 0.12), UNIT * 0.1); ctx.stroke(); }
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
    if (pl.kind === 'crop') return;                     // drawn with its patch
    if (pl.kind === 'rock') {
      const mud = false, lip = '#5a4128';                   // (a rock you threw and buried looks and works just like the first ones)
      const seed = rockSeedOf(pl);
      if (done) { ctx.fillStyle = 'rgba(46,34,20,.8)'; ctx.beginPath(); ctx.ellipse(x, y + UNIT * 0.3, UNIT * 0.5, UNIT * 0.16, 0, 0, 6.28); ctx.fill(); drawSoilLine(x, y + UNIT * 0.26, UNIT * 1.2, UNIT * 0.12, seed); return; }   // the hole it left
      const knockT = rtFor(sc.id).flags['knockT_' + pl.id], loose = !!rtFor(sc.id).flags['knocked_' + pl.id];
      const pop = loose && knockT != null ? Math.max(0, 1 - (state.time - knockT) / 0.5) : 0;                            // the stomp: a jolt up, then it settles
      const rise = (p ? Math.min(1, p.wiggle / (pl.need || 3)) * UNIT * 0.28 : 0) + (loose ? UNIT * 0.32 + Math.sin(pop * Math.PI) * UNIT * 0.35 : UNIT * 0.08);   // mostly sunk at first, its lumpy back showing; stomped loose, it pops up
      const lean = loose ? -0.55 - pop * 0.3 : 0;                                                                        // and sits well over on its side
      ctx.save(); ctx.beginPath(); ctx.rect(x - UNIT * 1.2, y - UNIT * 1.5, UNIT * 2.4, UNIT * 1.5 + UNIT * 0.2 + rise); ctx.clip();   // everything below the soil line is hidden
      ctx.translate(x, y + UNIT * 0.25 - rise); ctx.rotate(tilt + lean); drawRock(0, 0, UNIT * 0.72, seed, false); ctx.restore();
      drawSoilLine(x, y + UNIT * 0.2 + rise, UNIT * 1.4, UNIT * 0.13, seed);   // sunk in: the zigzag where stone meets soil, right at the cut
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
    ctx.save(); ctx.rotate(Math.PI / 2); drawSteelBlade(u * 1.2, u * 0.14, 0); ctx.restore();   // the blade, rust and all: the same steel as the sword in hand
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
    if (s.kind === 'rock') drawRock(s.x, s.y - s.z, UNIT * 0.6 * k, s.seed || 3.7);
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
const BUILD = 'build 137';                            // shown on the pause screen so you can tell which version is running

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
    let fx = 0.15 + i * 0.175 + (R() - 0.5) * 0.04;
    if (sc.corridor) { const [a, b] = corridorSpan(sc, fy); if (b - a < 0.2) { if (i > 1) continue; fx = a + (b - a) * (i ? 0.72 : 0.28); } else if (fx < a + 0.04 || fx > b - 0.04) continue; }   // on the mountain: ledges on the ground there is
    const x = fx * W, y = fy * H;
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
// a ravine or pit, seen from above, filled with clusters of the same rough stones the woods use: big and lit near the
// lips, smaller and darker toward the middle, where it's deepest and furthest from you
// the mountain on either side of the path: dark rock with a broken, bitten edge, rough stones heaped along it, and the
// rock face catching less light the further it is from the way (drawn once per screen and size, then stamped)
const MTN_CACHE = {};
function drawMountainSides(sc) {
  const key = sc.id + '|' + Math.round(W) + 'x' + Math.round(H);
  let img = MTN_CACHE[key];
  if (img === undefined) { img = null; try { const cv = document.createElement('canvas'); cv.width = Math.ceil(W); cv.height = Math.ceil(H); const g = cv.getContext && cv.getContext('2d'); if (g && g.fillRect && g.beginPath) { paintMountainSides(g, sc); img = cv; } } catch (e) { img = null; } MTN_CACHE[key] = img; }
  if (img) ctx.drawImage(img, 0, 0); else paintMountainSides(ctx, sc);
}
function paintMountainSides(g, sc) {
  const c = sc.corridor, u = UNIT, rockL = (c.rock || 'L') === 'L';
  let s = Math.abs(Math.floor(c.seed * 977)) % 233280 + 5; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const hx = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const edgeAt = y => { const [a, b] = corridorSpan(sc, y / H); return [a * W, b * W]; };
  const step = u * 0.3, rows = Math.ceil(H / step) + 1;
  // ---- the drop side: the depths (near black, small crags smaller and darker further down), the brown cliff face, islands
  { const pts = []; for (let i = 0; i <= rows; i++) { const y = Math.min(H, i * step), [a, b] = edgeAt(y); pts.push([rockL ? b : a, y]); }
    const far = rockL ? W : 0, dir = rockL ? 1 : -1;
    const region = () => { g.beginPath(); g.moveTo(far, 0); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(far, H); g.closePath(); };
    g.save(); region(); g.clip();
    g.fillStyle = '#10130d'; g.fillRect(0, 0, W, H);
    for (let L = 0; L < 4; L++) { const d = 1 - L / 3, n = 70 + L * 25, r = u * (0.08 + (1 - d) * 0.22), base = [22 + (1 - d) * 30, 27 + (1 - d) * 26, 16 + (1 - d) * 18];
      for (let i = 0; i < n; i++) { const y = rnd() * H, [a, b] = edgeAt(y), e = rockL ? b : a, x = e + dir * (u * 1.2 + rnd() * W * 0.5); drawJagged(x, y, r * (0.6 + rnd() * 0.7), x * 0.3 + y * 0.7 + L, [hx(base), hx(base.map(v => v + 12)), hx(base.map(v => v - 10))], null, g); }
      g.fillStyle = `rgba(6,10,4,${0.2 * d})`; g.fillRect(0, 0, W, H); }
    for (const q of c.islands || []) {                                                 // an island: brown sides falling into the dark, a grass top
      const cx = q.fx * W, cy = q.fy * H, rx = q.rx * W, ry = q.ry * H, rim = []; for (let k = 0; k < 18; k++) { const a = k / 18 * 6.28; rim.push([cx + Math.cos(a) * rx * (0.92 + Math.sin(k * 2.3) * 0.08), cy + Math.sin(a) * ry * (0.92 + Math.cos(k * 1.7) * 0.08)]); }
      const bot = rim.filter(([x, y]) => y >= cy - ry * 0.2).sort((m, n2) => m[0] - n2[0]), drop = bot.map(([x, y]) => [x + 5, y + u * 2.2]);
      g.beginPath(); bot.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); drop.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fillStyle = '#5a3c26'; g.fill();
      for (let i = 0; i < bot.length; i++) { const [x, y] = bot[i]; g.strokeStyle = i % 2 ? 'rgba(30,18,10,.55)' : 'rgba(140,100,64,.3)'; g.lineWidth = i % 3 ? 2 : 3; g.beginPath(); g.moveTo(x, y + 5); g.lineTo(x + 4, y + u * 2.1); g.stroke(); }
      const gr = g.createLinearGradient(0, cy, 0, cy + u * 2.6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,6,4,.8)'); g.fillStyle = gr; g.beginPath(); bot.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); drop.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
      g.beginPath(); rim.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = sc.floor; g.fill(); g.strokeStyle = '#1c1208'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = '#7f8f5a'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const x = cx + (rnd() - .5) * rx * 1.4, y = cy + (rnd() - .5) * ry * 1.2; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 4, y); g.lineTo(x + k * 5, y - u * 0.2); g.stroke(); } }
    }
    g.restore();
    const face = pts.map(([x, y]) => [x + dir * (u * 1.2 + Math.sin(y * 0.05) * 8), y]);   // the brown cliff face below the lip
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); face.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fillStyle = '#5a3c26'; g.fill();
    for (let i = 0; i < pts.length - 1; i++) { const [x, y] = pts[i]; g.strokeStyle = i % 2 ? 'rgba(30,18,10,.6)' : 'rgba(140,100,64,.35)'; g.lineWidth = i % 3 ? 2 : 4; g.beginPath(); g.moveTo(x + dir * 5, y + 3); g.lineTo(x + dir * u * 1.1, y + 9); g.stroke(); }
    const gr = g.createLinearGradient(pts[0][0], 0, pts[0][0] + dir * u * 1.4, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,6,4,.7)');
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); face.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fillStyle = gr; g.fill();
    g.strokeStyle = '#1c1208'; g.lineWidth = 3; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; g.fillStyle = '#6d8a3e'; g.beginPath(); g.moveTo(ax, ay); g.lineTo((ax + bx) / 2 + dir * 10, (ay + by) / 2); g.lineTo(bx, by); g.fill(); }   // grass hanging over the lip
  }
  // ---- the rock side: crags scattered back from the grass, tiny at its edge and growing fast into tall giants
  { const dir = rockL ? -1 : 1, crags = [];
    const edgeX = y => { const [a, b] = edgeAt(y); return rockL ? a : b; };
    { const pts = []; for (let i = 0; i <= rows; i++) { const y = Math.min(H, i * step); pts.push([edgeX(y) + dir * u * 0.9, y]); }
      g.beginPath(); g.moveTo(rockL ? 0 : W, 0); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(rockL ? 0 : W, H); g.closePath(); g.fillStyle = '#1f1c19'; g.fill(); }   // the dark behind the stones
    for (let i = 0; i < 95; i++) { const y = -u * 3 + rnd() * (H + u * 6), dist = Math.pow(rnd(), 0.7) * u * 5.5, k = dist / (u * 5.5), r = u * (0.12 + Math.pow(k, 1.1) * 3.4) * (0.7 + rnd() * 0.6);
      crags.push([edgeX(y) + dir * (dist + r * 0.55) + (rnd() - .5) * u * 0.3, y - k * u * 1.6 + (rnd() - .5) * u * 0.5, r, k]); }   // big ones sit back: none leans over the way
    for (let i = 0; i < 12; i++) { const y = rnd() * H, r = u * (0.1 + rnd() * 0.18); crags.push([edgeX(y) - dir * u * (0.5 + rnd() * 1.2), y, r, 0]); }   // strays out on the grass
    crags.sort((m, n2) => (n2[3] - m[3]) || (m[1] - n2[1]));
    for (const [cx, cy, r, k] of crags) { const sh = 118 - k * 70 + (r / u) * 3;
      g.fillStyle = `rgba(0,0,0,${0.3 - k * 0.2})`; g.beginPath(); g.ellipse(cx + r * 0.15, cy + r * 0.45, r * 1.05, r * 0.42, 0, 0, 6.28); g.fill();
      g.save(); g.translate(cx, cy); g.scale(0.8, 1.5 + k * 0.9); drawJagged(0, 0, r, cx * 0.37 + cy * 0.11, [hx([sh, sh - 4, sh - 8]), hx([sh + 24, sh + 20, sh + 14]), hx([sh - 24, sh - 26, sh - 28])], null, g); g.restore();   // tall: the lines run up
    }
  }
}
const RAVINE_CACHE = {};
function drawRavineStones(X0, Y0, X1, Y1, seed) {           // drawn once into a picture per ravine (they don't move), then just stamped
  const key = [X0, Y0, X1, Y1, UNIT].map(v => Math.round(v)).join(',');
  let img = RAVINE_CACHE[key];
  if (img === undefined) {
    img = null;
    try { const cv = document.createElement('canvas'); cv.width = Math.ceil(X1 - X0); cv.height = Math.ceil(Y1 - Y0); const g = cv.getContext && cv.getContext('2d'); if (g && g.fillRect && g.beginPath) { paintRavineStones(g, 0, 0, X1 - X0, Y1 - Y0, seed); img = cv; } } catch (e) { img = null; }
    RAVINE_CACHE[key] = img;
  }
  if (img) ctx.drawImage(img, X0, Y0); else paintRavineStones(ctx, X0, Y0, X1, Y1, seed);
}
function paintRavineStones(g, X0, Y0, X1, Y1, seed) {
  const w = X1 - X0, hgt = Y1 - Y0, u = UNIT;
  let s = Math.abs(Math.floor(seed * 1000)) % 233280 + 1; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  g.fillStyle = '#0e0c0e'; g.fillRect(X0, Y0, w, hgt);
  const layers = 8, toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  for (let L = layers - 1; L >= 0; L--) {                            // deepest first, so the nearer stones sit on top
    const d = L / (layers - 1), inset = Math.min(w, hgt) * 0.5 * d * 0.92, wide = w > hgt;
    const x0 = X0 + inset * (wide ? 0.15 : 1), x1 = X1 - inset * (wide ? 0.15 : 1), y0 = Y0 + inset * (wide ? 1 : 0.15), y1 = Y1 - inset * (wide ? 1 : 0.15);
    if (x1 <= x0 || y1 <= y0) continue;
    const shade = Math.round(140 - Math.pow(d, 0.8) * 124), base = [shade, shade - 6, shade - 14].map(v => Math.max(6, v));
    const cols = [toHex(base), toHex(base.map(v => v + 14)), toHex(base.map(v => v - 18))], r0 = u * (1.0 * Math.pow(1 - d, 1.4) + 0.12);   // big at the lips, pebbles far down
    const n = Math.min(260, Math.ceil(((x1 - x0) * (y1 - y0)) / (r0 * r0 * 2.2)) + 2);
    for (let i = 0; i < n; i++) { const cx = x0 + rnd() * (x1 - x0), cy = y0 + rnd() * (y1 - y0); drawJagged(cx, cy, r0 * (0.7 + rnd() * 0.6), cx * 0.37 + cy * 0.11, cols, null, g); }
    g.fillStyle = `rgba(6,5,8,${0.12 + d * 0.1})`; g.fillRect(x0, y0, x1 - x0, y1 - y0);   // the dark gathering below
  }
}
// one ravine, drawn with broken edges: the dark shape, the stones inside (clipped to it), then the lips along each edge
function drawBrokenChasm(c, style) {
  const [x0, y0, x1, y1] = c, wide = (x1 - x0) >= (y1 - y0), u = UNIT, step = u * 0.35;
  const A = [], B = [];                                               // the two wandering edges, in pixels
  if (wide) { for (let X = x0 * W; X <= x1 * W + 0.1; X += step) { const [a, b] = chasmSpan(c, X / W); A.push([X, a * H]); B.push([X, b * H]); } }
  else { for (let Y = y0 * H; Y <= y1 * H + 0.1; Y += step) { const [a, b] = chasmSpan(c, Y / H); A.push([a * W, Y]); B.push([b * W, Y]); } }
  const shape = () => { ctx.beginPath(); A.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = B.length - 1; i >= 0; i--) ctx.lineTo(B[i][0], B[i][1]); ctx.closePath(); };
  const pad = u * 0.4, X0 = x0 * W - (wide ? 0 : pad), X1 = x1 * W + (wide ? 0 : pad), Y0 = y0 * H - (wide ? pad : 0), Y1 = y1 * H + (wide ? pad : 0);
  ctx.save(); shape(); ctx.fillStyle = '#0e0c0e'; ctx.fill(); ctx.clip(); drawRavineStones(X0, Y0, X1, Y1, x0 * 31 + y0 * 17); ctx.restore();
  const lip = (pts, dir) => {                                         // crumbling earth (and grass, in the fields) hanging over each edge
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], mx = (ax + bx) / 2, my = (ay + by) / 2, j = Math.sin(ax * 0.13 + ay * 0.07) * 0.5 + 0.5;
      const nx = wide ? 0 : dir, ny = wide ? dir : 0;
      if ((ax <= 1 && !wide) || (ay <= 1 && wide && dir > 0 && y0 < 0.001)) continue;
      ctx.fillStyle = style === 'crag' ? '#6b665f' : '#6a5438'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx + nx * u * (0.18 + 0.2 * j), my + ny * u * (0.18 + 0.2 * j)); ctx.lineTo(bx, by); ctx.fill();
      if (style !== 'crag') { ctx.fillStyle = '#6d8a3e'; ctx.beginPath(); ctx.moveTo(ax - nx * 2, ay - ny * 2); ctx.lineTo(mx + nx * u * 0.12 * j, my + ny * u * 0.12 * j); ctx.lineTo(bx - nx * 2, by - ny * 2); ctx.fill(); }
    }
  };
  if (wide) { if (y0 > 0.001) lip(A, 1); if (y1 < 0.999) lip(B, -1); } else { if (x0 > 0.001) lip(A, 1); if (x1 < 0.999) lip(B, -1); }
}
function drawRavines(sc) {
  if (sc.vista) { drawHighVista(sc); return; }          // up in the High Reaches the drops look down on the valley
  const t = state.time, u = UNIT;
  for (const c of sc.chasms || []) drawBrokenChasm(c, 'field');
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
