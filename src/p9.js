
// =====================================================================
// Arena: a glade ringed with stones and trees, one test zone off each edge.
// Open index.html?arena. Each zone throws five waves of its region's monsters, each harder.
// =====================================================================
var ARENA = typeof location !== 'undefined' && /(^|[?&])arena(=|&|$)/.test(location.search);
// Each zone is a real screen of the real world: same terrain, same rules, same enemies. The arena only
// decides which monsters come, in what order, and gives you a kit to fight them with.
const ARENA_ZONES = {
  river: { name: 'Forest river', scene: 'riverbank', at: [0.6, 0.85], waves: [[['rabbit', 2]], [['gremlin', 3]], [['gremlin', 3], ['rabbit', 2]], [['gremlin', 5]], [['thief', 1], ['gremlin', 4]]] },
  cave: { name: 'Cave', scene: 'c4', at: [0.06, 0.5], waves: [[['stalker', 2]], [['stalker', 2], ['glowworm', 2]], [['charger', 1], ['diver', 2]], [['stalker', 2], ['charger', 1], ['diver', 2]], [['charger', 2], ['stalker', 3], ['diver', 2], ['glowworm', 2]]] },
  swamp: { name: 'Swamp', scene: 'sw2', at: [0.5, 0.06], waves: [[['lurker', 2]], [['lurker', 3], ['glowworm', 2]], [['gremlin', 3], ['lurker', 3]], [['lurker', 4], ['gremlin', 3]], [['lurker', 4], ['glowworm', 3], ['gremlin', 4]]] },
  wind: { name: 'Windy ravines', scene: 'f4', at: [0.5, 0.06], waves: [[['rabbit', 3]], [['rabbit', 5]], [['gremlin', 3], ['rabbit', 3]], [['charger', 2]], [['charger', 2], ['rabbit', 4], ['gremlin', 2]]] },
};
// the arena glade: a hub added to the real world, like the puzzle hub
function genArenaHub(seed) {
  const saved = [W, H, UNIT];
  W = GEN.W; H = GEN.H; computeUnit();
  try {
    const hub = newScene({ id: 'arena', area: 'forest', msg: '', music: 'forest', amb: 'none', floor: '#4f9a52', heroStart: [0.5, 0.55] });
    edgeWall(hub, 'n', 'tree', 1.2, [], 1.3, 'green'); edgeWall(hub, 's', 'tree', 1.2, [], 1.3, 'green');
    edgeWall(hub, 'w', 'boulder', 1.1, [], 1.5); edgeWall(hub, 'e', 'boulder', 1.1, [], 1.5);
    hub.feat.portals = [['river', 0.5, 0.2], ['cave', 0.14, 0.5], ['swamp', 0.5, 0.66], ['wind', 0.86, 0.5]].map(([z, fx, fy]) => ({ pid: 'zone:' + z, fx, fy }));
    hub.feat.portals.forEach(p => claim(hub, p.fx, p.fy, 1.6));
    hub.feat.mirror = [0.32, 0.5]; hub.solids.push(solid(0.32, 0.5, 0.5, 'mirror')); claim(hub, 0.32, 0.5, 1.4);
    hub.feat.bench = [0.68, 0.32]; hub.solids.push(solid(0.68, 0.32, 0.6, 'bench')); claim(hub, 0.68, 0.32, 1.6);
    hub.feat.plots = []; hub.feat.crops = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const q = [0.24 + c * 0.045, 0.2 + r * 0.09]; hub.feat.plots.push(q); hub.feat.crops.push(['turnip', 'carrot', 'squash', 'pepper'][c]); claim(hub, q[0], q[1], 0.7); }
    decoFlowers(hub, 50);
    return hub;
  } finally { [W, H, UNIT] = saved; }
}
// a proper kit for testing: sword, acorns, fire, the relics at level I, food; seeds, materials and every recipe once
function arenaKit() {
  const inv = state.inv;
  Object.assign(inv, { sword: true, acorns: 30, fire: true, step: inv.step || 1, silk: inv.silk || 1, horn: inv.horn || 1, depth: 1, pipSaved: true });
  if (!inv.arenaStocked) {
    inv.arenaStocked = true;
    for (const f of FORGE) inv.recipes[f.k] = true;
    Object.assign(inv.bag, { seed: 6, thornseed: 3, emberseed: 2, ironseed: 2, starseed: 1 });
    Object.assign(inv.mats, { thorn: 4, ember: 2, ironwood: 3, starpetal: 1, ear: 2, hide: 1 });
  }
  while (inv.food.length < 6) inv.food.push(['squash', 'carrot', 'fish', 'turnip'][inv.food.length % 4]);
  state.equip = 'sword';
  state.hero.vig = maxVig();
  refreshButtons();
}
function startArena() {
  state.cut = null; state.night = 0; state.rain = 0; state.arena = null;
  arenaKit();
  enterScene('arena');
  showTitle('Arena', 'step onto a stone: each zone sends five waves', 'area', 3);
}
function enterZone(key) {
  const z = ARENA_ZONES[key];
  arenaKit();
  delete RT[z.scene];                               // a fresh copy of the real screen each time
  state.arena = { key, zone: z, scene: z.scene, wave: 0, phase: 'ready', t: 2.5 };
  transitionTo(z.scene, z.at[0], z.at[1], true);
}
function arenaEnter(id) {
  if (id === 'arena') { state.arena = null; arenaKit(); say('Rested and restocked.', null, null, { key: 'arena', life: 1.6, color: '#b8f28a' }); return; }
  const a = state.arena;
  if (!a) return;
  if (id !== a.scene) { state.arena = null; return; }  // walked off the zone's screen: the waves stop
  state.enemies = [];                               // only the waves fight you here
  a.wave = 0; a.phase = 'ready'; a.t = 2.5;
}
function arenaSpawnWave() {
  const a = state.arena, h = state.hero, sc = sceneDef(), spec = a.zone.waves[a.wave];
  let pool = 0;
  for (const [type, count] of spec) for (let k = 0; k < count; k++) {
    let x, y, tries = 0;
    do { x = W * rr(0.15, 0.85); y = H * rr(0.2, 0.8); tries++; }
    while (tries < 60 && (Math.hypot(x - h.x, y - h.y) < UNIT * 5 || isChasm(x, y, UNIT) || state.solids.some(s => Math.hypot(x - s.x, y - s.y) < s.r + UNIT)));
    let e;
    if (type === 'lurker') { const p = state.pools[pool % state.pools.length]; e = makeEnemy('lurker', p.x, p.y, -1, pool % state.pools.length); e.pool = p; pool++; }
    else e = makeEnemy(type, x, y, -1);
    if (type === 'thief') { e.cornered = true; e.mode = 'idle'; }
    e.t = Math.min(e.t || 1, 1.2) + k * 0.15;          // wake quickly, a little staggered
    state.enemies.push(e);
    spark(e.x, e.y, 'rgba(255,255,255,.7)', 8, 2);
  }
  sfx.cackle && sfx.cackle();
}
function updateArena(dt) {
  const a = state.arena;
  if (!a) return;
  a.t -= dt;
  const alive = state.enemies.filter(e => !e.dead).length;
  if (a.phase === 'ready' && a.t <= 0) { a.phase = 'fight'; arenaSpawnWave(); zoomPulse(state.hero.x, state.hero.y, 'title'); }
  else if (a.phase === 'fight' && alive === 0) {
    a.wave++;
    if (a.wave >= a.zone.waves.length) {
      a.phase = 'done'; sfx.victory(); showTitle(`${a.zone.name} cleared`, 'back to the glade', 'relic', 3.5);
      const recs = puzzleRecords(); const r = recs['zone:' + a.key] || (recs['zone:' + a.key] = { clears: 0 }); r.clears = (r.clears || 0) + 1; savePuzzleRecords(recs);
      setTimeout(() => { if (state.arena === a) transitionTo('arena', 0.5, 0.55); }, 4200);
    }
    else { a.phase = 'ready'; a.t = 3; heal(0.3); say(`Wave ${a.wave} cleared. Catch your breath.`, null, null, { key: 'arena', life: 2.5, color: '#b8f28a' }); }
  }
  a.left = alive;
}
// wave status, top centre, kept out of the text layout
function drawArenaBanner() {
  const a = ARENA && state.arena;
  state.arenaBanner = null;
  if (!a || state.menu) return;
  const n = a.zone.waves.length, label = a.phase === 'done' ? `${a.zone.name}: cleared` : a.phase === 'ready' ? `${a.zone.name}: wave ${a.wave + 1} of ${n} in ${Math.max(0, Math.ceil(a.t))}` : `${a.zone.name}: wave ${a.wave + 1} of ${n}, ${a.left || 0} left`;
  const fs = Math.round(Math.max(15, Math.min(20, UNIT * 0.55)));
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  const w = ctx.measureText(label).width + 28, h = fs * 1.9, x = (W - w) / 2, y = 10;
  ctx.fillStyle = 'rgba(10,8,14,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h); ctx.fill();
  for (let i = 0; i < n; i++) { ctx.fillStyle = i < a.wave || a.phase === 'done' ? '#b8f28a' : i === a.wave ? '#ffe38a' : 'rgba(255,255,255,.25)'; ctx.fillRect(x + 14 + i * ((w - 28) / n), y + h - 6, (w - 28) / n - 3, 3); }
  ctx.fillStyle = '#fdf6e3'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, W / 2, y + h / 2 - 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  state.arenaBanner = { x, y, w, h };
}
// the hub's wooden signs
function drawArenaSigns(sc) {
  for (const [fx, fy, label] of sc.feat.signs || []) {
    const x = fx * W, y = fy * H, u = UNIT;
    ctx.font = `bold ${Math.round(Math.max(13, u * 0.4))}px "Courier New", monospace`;
    const w = ctx.measureText(label).width + 16;
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - u * 0.06, y - u * 0.2, u * 0.12, u * 0.9);
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - w / 2, y - u * 0.75, w, u * 0.62);
    ctx.fillStyle = '#fdf6e3'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y - u * 0.44);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
}
