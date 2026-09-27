
// =====================================================================
// Scenes: entering, leaving, geometry
// =====================================================================
const sceneDef = () => WORLD[state.scene];

function refreshSceneGeometry() {
  const sc = sceneDef();
  if (!sc) return;
  const rt = rtFor(sc.id);
  const F = { cavewall: 0.95, boulder: 0.95, pillar: 0.95, stalagmite: 0.8, shroom: 0.7, stone: 1, log: 1, wall: 1, bed: 1, table: 1, stove: 1, cliff: 1, cairn: 1, mirror: 1, chest: 1, lectern: 1, burrow: 1, cracked: 0.95, stump: 1, campfire: 1, tent: 0.9, bramble: 1, reeds: 1, web: 1, vine: 1 };
  state.solids = sc.solids.filter(s => !(s.bar && rt.flags[s.bar]) && !(s.showFlag && !rt.flags[s.showFlag]) && !(s.plate && state.plateOn[s.plate])).map((s, i) => ({ ...s, x: s.fx * W, y: s.fy * H, r: s.r * UNIT * (F[s.kind] || 0.45), vis: s.r * UNIT, key: sc.id + ':' + sc.solids.indexOf(s) }));
  state.pools = sc.pools.map(p => ({ x: p.fx * W, y: p.fy * H, r: p.r * UNIT }));
  for (const e of state.enemies) if (e.poolIdx != null) e.pool = state.pools[e.poolIdx];
}
function breakBarrier(bar, how) {
  const rt = rtFor(state.scene);
  if (rt.flags[bar]) return;
  rt.flags[bar] = true;
  if (bar === 'cocoon') burstDarkShroom();
  const cs = sceneDef().solids.find(s => s.bar === bar && s.kind === 'cracked');
  if (cs) {
    const x = cs.fx * W, y = cs.fy * H;
    for (let i = 0; i < 14; i++) state.fx.push({ x, y, vx: (Math.random() - 0.5) * UNIT * 6, vy: -UNIT * (1 + Math.random() * 3), t: 0, life: 0.8, color: i % 2 ? '#8f887c' : '#6a4a2a', size: UNIT * 0.12 });
    const S = cs.stone && STONES[cs.stone];
    const finds = (S ? S.inside.filter(([, p]) => rng() < p).map(([t]) => t) : (rng() < 0.12 ? ['seed'] : [])).map(t => t === 'seed' ? localSeed() : t);
    finds.forEach((t, k) => state.items.push({ type: t, x: x + (k - (finds.length - 1) / 2) * UNIT * 0.6, y: y + UNIT * 0.5 }));
    if (finds.length) { say(finds.some(t => t !== 'stone' && !CROP_SEEDS.includes(t)) ? 'Something rare inside!' : 'Something inside!', x, y - UNIT, { key: 'find', life: 2, color: '#ffe38a' }); sfx.pickup(); }
  }
  if (bar === 'burrow') { say('The hole caves in. There\'s a tunnel through!', state.hero.x, state.hero.y - UNIT, { key: 'burrow', life: 3 }); }
  if (bar === 'thicket') { setMusic('forest'); const s0 = sceneDef().solids.find(s => s.bar === bar); for (let i = 0; i < 2; i++) state.items.push({ type: 'thornseed', x: s0.fx * W - UNIT * (1 + i), y: s0.fy * H + UNIT * (2 + i) }); }
  for (const s of state.solids) if (s.bar === bar) spark(s.x, s.y, how === 'fire' ? '#ff9a3a' : s.kind === 'web' ? '#dcdcd0' : '#6a4a2a', 6, 3);
  refreshSceneGeometry();
  state.shake = 0.3;
  sfx.crash();
  const s0 = sceneDef().solids.find(s => s.bar === bar);
  if (s0) zoomPulse(s0.fx * W, s0.fy * H, 'kill');
}

function saveScene() {
  const rt = rtFor(state.scene);
  rt.items = state.items.map(it => ({ type: it.type, fx: it.x / W, fy: it.y / H }));
}

function enterScene(id, fx, fy) {
  if (WORLD[state.scene] && RT[state.scene]) saveScene();
  const sc = WORLD[id], rt = rtFor(id);
  state.scene = id;
  syncMudRocks(sc);                                  // rocks sunk in this screen's mud (they outlive leaving and saving)
  state.pull = newPull(null);
  state.atk = null; state.hold = { on: false, t: 0, charged: false }; state.aim.on = false;
  state.npcTalk = null;
  const h = state.hero;
  const pos = fx != null ? [fx, fy] : (sc.heroStart || [0.5, 0.5]);
  Object.assign(h, { x: pos[0] * W, y: pos[1] * H, vx: 0, vy: 0, z: 0, vz: 0, stun: 0, invuln: 0.6, ride: null, falling: 0, dashT: 0, safe: [pos[0], pos[1]] });
  // the dead come back if you've been away a while (never the boss); some only show up later
  state.enemies = sc.spawns.map((s, i) => {
    const d = rt.deadAt[i];
    if (d != null && (s.type === 'warden' || state.playTime - d < 60)) return null;
    if (s.req && !state.inv[s.req]) return null;
    delete rt.deadAt[i];
    return makeEnemy(s.type, s.fx * W, s.fy * H, i, s.pool);
  }).filter(Boolean);
  state.flock = makeFlock(sc);
  state.items = rt.items.map(it => ({ type: it.type, x: it.fx * W, y: it.fy * H }));
  state.hazards = []; state.rings = []; state.fx = []; state.texts = []; state.shots = []; state.gas = []; state.spark = null;
  state.drops.length = 0; state.splashes.length = 0; state.dripTimer = 1;
  state.bird = id === 'meadow' ? makeBird() : null;
  state.clouds = sc.area === 'field' ? Array.from({ length: 4 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: UNIT * (4 + Math.random() * 4) })) : [];
  state.gustIdx = 0; state.gustPhase = 'lull'; state.gustT = 0; state.gust = 0; state.gustStep = 0; state.gustDur = 2 + Math.random();
  state.plateOn = {}; updatePlates(true);
  state.webs = (sc.webs || []).map((w, i) => ({ x: w.fx * W, y: w.fy * H, r: w.r * UNIT, idx: i, burn: 0, lit: null })).filter(w => !rt.flags['web' + w.idx]);
  state.floaters = sc.id === 'h3' && rt.flags.darkshroom ? makeFloaters(8) : [];
  refreshSceneGeometry();
  state.entry = { id, fx: pos[0], fy: pos[1] };
  state.enterT = state.time;

  let titled = false;
  const place = sc.placeName || AREA_NAMES[sc.area];
  if (state.area !== place) {
    state.area = place; titled = true;
    showTitle(place, null, 'area', 2.8);
    zoomPulse(h.x, h.y, 'title');
  }
  state.glimpse = null;
  if (id === 'w2' && state.inv.pipTaken && !rt.flags.burrow && !state.inv.burrowTold) { state.inv.burrowTold = true; say('That hole. Pip\'s down there. Smash it open with a rock!', h.x, h.y - UNIT, { key: 'burrow', life: 3 }); }
  if (sc.feat.glimpse && !rt.flags.glimpse && state.inv.pipTaken && !state.inv.pipSaved && state.started) {
    // Pip, carried off by gremlins, always just ahead of you
    rt.flags.glimpse = true;
    const to = sc.feat.glimpse.to, tx = to[0] * W, ty = to[1] * H;
    state.glimpse = { t: -0.4, x0: h.x + (tx - h.x) * 0.55, y0: h.y + (ty - h.y) * 0.55, x1: tx + (tx > W * 0.9 ? UNIT * 3 : 0), y1: ty, line: sc.feat.glimpse.line, x: 0, y: 0, down: sc.feat.stone && to === sc.feat.stone };
  }
  if (ARENA) arenaEnter(id);
  state.rapids = id === 'rapids' ? newRapids() : null;
  if (sc.river && sc.river.stones) layoutStones(sc);
  if (sc.ravines) sc.chasms = sc.ravines.map(r => [0, r.y - r.hU * UNIT / H / 2, 1, r.y + r.hU * UNIT / H / 2]);
  if (sc.rockCols) { const n0 = sc.solids.length; layoutRavineRocks(sc); if (sc.solids.length !== n0) refreshSceneGeometry(); }
  if (sc.windLedges) layoutLedges(sc);
  if (sc.feat.farside) { placeDock(sc); placeOldJetty(sc); }   // Wick's jetty over there, the old one on this side
  if (id === 'gleampool' && state.overFalls) {        // the raft goes over the falls and breaks up at the bottom
    state.overFalls = false;
    for (const [fx, fy] of [[0.78, 0.4], [0.84, 0.62]]) state.items.push({ type: 'driftwood', x: fx * W, y: fy * H });
    setTimeout(() => say('Over the falls! The raft breaks apart at the bottom. Two logs float free.', state.hero.x, state.hero.y - UNIT * 1.3, { key: 'falls', life: 4.5 }), 0);
    state.shake = 0.6;
  }
  const ti = THIEF_ROUTE.indexOf(id);
  if (state.inv.journal === 1 && ti === state.inv.thiefAt) {
    const last = ti === THIEF_ROUTE.length - 1;
    const spot = last ? WORLD.w3.feat.sword : [pos[0] < 0.5 ? 0.8 : 0.2, 0.5];
    const t = makeEnemy('thief', spot[0] * W + (last ? UNIT * 2.6 : 0), spot[1] * H, -1);
    t.mode = last ? 'idle' : 'taunt'; t.cornered = last; t.route = ti;
    state.enemies.push(t);
    if (!last) say('The thief! It has Pip\'s journal!', t.x, t.y - UNIT * 1.4, { key: 'thief', life: 2.5, color: '#ffe38a' });
    else say('Cornered! It won\'t give the journal up without a fight.', t.x, t.y - UNIT * 1.4, { key: 'thief', life: 3, color: '#ffe38a' });
  }
  if (id === 'gleampool' && !state.inv.tunnel) { state.inv.tunnel = true; state.inv.raft = 3; }
  if (sc.msg && !state.seen[id] && !pipWithYou() && !titled) say(sc.msg, h.x, h.y - UNIT * 0.8, { key: 'scene', life: 3.5 });   // with Pip along, Pip does the talking
  state.seen[id] = true;
  if (pipWithYou()) placePipNearHero();
  const bossAlive = id === 'c7' && !rt.bossDead;
  const tense = sc.area === 'woods' && state.inv.pipTaken && !state.inv.sword;
  setMusic(bossAlive ? 'cave2' : tense ? 'sinister' : sc.music);
  setAmbience(sc.amb);
  refreshButtons();
}

// arriving at a screen edge: slide along it to the nearest spot not blocked by rocks or trees
function nudgeFree() {
  const h = state.hero, horiz = h.y < UNIT * 2 || h.y > H - UNIT * 2;
  const blocked = (x, y) => state.solids.some(s => Math.hypot(s.x - x, s.y - y) < s.r + UNIT * 0.5) || isChasm(x, y);
  if (!blocked(h.x, h.y)) return;
  for (let d = UNIT * 0.4; d < Math.max(W, H); d += UNIT * 0.4) for (const sgn of [1, -1]) {
    const x = horiz ? h.x + d * sgn : h.x, y = horiz ? h.y : h.y + d * sgn;
    if (x > UNIT * 0.5 && x < W - UNIT * 0.5 && y > UNIT * 0.5 && y < H - UNIT * 0.5 && !blocked(x, y)) { h.x = x; h.y = y; state.entry.fx = x / W; state.entry.fy = y / H; h.safe = [x / W, y / H]; return; }
  }
}
function transitionTo(id, fx, fy, quick) {
  state.busy = true;
  state.fadeTarget = 1;
  state.fadeRate = quick ? 14 : 4;
  setTimeout(() => {
    enterScene(id, fx, fy);
    nudgeFree();
    state.fadeTarget = 0;
    setTimeout(() => { state.busy = false; }, quick ? 150 : 500);
  }, quick ? 280 : 1000);
}

function checkEdges() {
  const sc = sceneDef(), h = state.hero, r = UNIT * 0.5 + 8;
  if (state.npcTalk) return;                          // mid-conversation: finish it first (F), then go
  if (state.intro && !state.intro.gone) return;        // the opening: the bank is yours to wander, but not to leave until Pip heads off
  for (const ex of sc.exits) {
    let at = false, along = 0;
    if (ex.side === 'n') { at = h.y <= r && held.up(); along = h.x / W; }
    if (ex.side === 's') { at = h.y >= H - r && held.down(); along = h.x / W; }
    if (ex.side === 'w') { at = h.x <= r && held.left(); along = h.y / H; }
    if (ex.side === 'e') { at = h.x >= W - r && held.right(); along = h.y / H; }
    if (!at) continue;
    if (ex.locked && ex.locked()) return;
    if (Array.isArray(ex.arrive)) { transitionTo(ex.to, ex.arrive[0], ex.arrive[1], true); return; }   // doors put you back at the door
    if (ex.arrive === 'sinkhole') {
      const s = WORLD[ex.to].feat.stone;
      transitionTo(ex.to, s[0] - 2.2 * UNIT / W, s[1], true);
      if (ex.say) setTimeout(() => say(ex.say, state.hero.x, state.hero.y - UNIT, { key: 'climb', life: 2.5 }), 0);
      return;
    }
    const al = Math.max(0.05, Math.min(0.95, along));
    const inX = 1.2 * UNIT / W, inY = 1.2 * UNIT / H, side = OPP[ex.side];
    const [fx, fy] = side === 'n' ? [al, inY] : side === 's' ? [al, 1 - inY] : side === 'w' ? [inX, al] : [1 - inX, al];
    transitionTo(ex.to, fx, fy, true);
    return;
  }
}

function resetRun(seed) {
  SEED = seed;
  WORLD = buildWorld(seed);                         // one world; the test modes only add a hub to it
  if (ARENA) WORLD.arena = genArenaHub(seed);
  if (PUZZLE) WORLD.puzzlehub = genPuzzleHub(seed);
  RT = {};
  state.inv = newInv();
  state.hero = newHero();
  state.hero.vig = maxVig();
  state.items = []; state.enemies = []; state.carry = null;
  state.area = null; state.seen = {}; state.playTime = 0;
  state.won = false; state.cut = null; state.title = null; state.cam.focus = null; state.menu = null;
  state.night = 0; state.rain = 0;
  state.questQuiet = true; state.questT = -9; state.qlogOpen = false;
}
function newGame() {
  state.busy = true;
  state.fadeTarget = 1; state.fadeRate = 4;
  setTimeout(() => {
    resetRun((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
    if (ARENA) startArena(); else if (PUZZLE) startPuzzleHub(); else { enterScene('camp'); startIntro(); }
    state.fadeTarget = 0;
    state.busy = false;
  }, 900);
}

// =====================================================================
// Update
// =====================================================================
function update(dt) {
  if (state.radial) dt *= 0.05;                       // the wheel all but stops the world
  state.time += dt;
  state.fade += (state.fadeTarget - state.fade) * (1 - Math.exp(-state.fadeRate * dt));
  state.shake = Math.max(0, state.shake - dt);
  state.flash = Math.max(0, state.flash - dt * 2.5);
  state.blind = Math.max(0, state.blind - dt);
  updateCam(dt);
  updateTexts(dt);
  if (!state.started) return;
  state.frameDt = dt;
  readPresses();
  updateQuests();
  if (state.time - (state.slotT || -9) > 0.25) { state.slotT = state.time; tidySlots(); }
  // the action key first clears anything waiting to be read (a quest alert, someone talking); that press goes no further
  if (!state.menu && !state.choice && pressedNow.act && dismissHeld()) { pressedNow.act = false; state.dismissedAt = state.time; }
  if (state.menu) { updateMenu(); return; }
  if (state.choice) { updateChoice(); return; }
  if (state.rapids) { updateFx(dt); updateRapids(dt); if (PUZZLE) updatePuzzle(dt); return; }
  updateFx(dt);
  state.playTime += dt;
  const sc = sceneDef(), h = state.hero, inv = state.inv;
  if (sc.drips) updateDrips(dt);
  if (state.bird) updateBird(dt);
  if (state.flock.length) updateFlock(dt);
  if (state.glimpse) updateGlimpse(dt);
  if (sc.gusts) updateWind(dt, sc);
  if (sc.id === 'c7' && amb) ambLevel(0.04 + 0.28 * Math.max(0, h.x / W - 0.3), 900);
  if (sc.amb === 'marsh') ambLevel(0.05);
  if (sc.river) ambLevel(0.07 + 0.08 * Math.max(0, 1 - Math.min(...sc.river.pts.map(p => Math.hypot(h.x - p[0] * W, h.y - p[1] * H))) / (UNIT * 12)), 2200);   // rushing water, louder near it
  if (state.rain > 0) { ambLevel(0.2 * state.rain); for (let i = 0; i < 6 * state.rain; i++) state.fx.push({ x: Math.random() * W * 1.2 - W * 0.1, y: -10, vx: -UNIT * 3, vy: H * 1.6, t: 0, life: 0.7, color: 'rain' }); }
  updateGas(dt);
  updateWebs(dt);
  if (state.fish && !state.cut) updateFishing(dt);
  if (state.carry === 'rock' && Math.random() < dt * 0.9) { const hh = state.hero; state.fx.push({ x: hh.x + (Math.random() - 0.5) * UNIT * 0.5, y: hh.y - hh.z - UNIT * 1.1, vx: (Math.random() - 0.5) * UNIT, vy: UNIT * 2, t: 0, life: 0.7, color: '#5a4128', size: UNIT * 0.09 }); }
  if (!state.cut && !state.busy) updatePip(dt);
  if (ARENA) updateArena(dt);
  if (PUZZLE) updatePuzzle(dt);
  for (const fl of state.floaters) { fl.a += dt * fl.s; fl.x += Math.cos(fl.a) * UNIT * 0.4 * dt + UNIT * 0.15 * dt; fl.y += Math.sin(fl.a * 1.3) * UNIT * 0.3 * dt; if (fl.x > W + 20) fl.x = -20; }
  if (state.cut) { updateCut(dt); return; }
  if (state.won) return;

  if (!state.busy) {
    // anything F did here (plant, talk, lift, cast) uses up the press: no weapon rides along with it
    // F is the dynamic action: what's right here comes first. A weapon slotted on A/S/D skips that and just swings.
    state.actUsed = state.radial ? true : state.slotAct ? false : interact();
    if (!state.actUsed && !state.slotAct && pressedNow.act && !state.carry) {      // nothing to do here: F uses its slot
      const f = slotsOf().f;
      if (f && f.kind === 'weapon') { state.equip = f.id; state.active = f.id; }
      else if (f) { state.actUsed = true; const r = useEntry(f); if (r) state.fSlotAbility = r; }
    }
    if (!state.actUsed) { updatePull(dt); updateCombat(dt); }
    updateAbilities(dt);
  }
  for (const k of ['lumin', 'slime', 'pepper', 'fishBuff', 'carrotBuff', 'squashBuff']) if (inv[k] > 0) inv[k] = Math.max(0, inv[k] - dt);
  if (inv.turnipRegen > 0) {                          // a turnip's vigor, trickling back
    const give = Math.min(inv.turnipRegen, Math.max(0.35, inv.turnipRegen / 8) * dt * (wears('mitts') ? 2 : 1));
    inv.turnipRegen -= give; h.vig = Math.min(maxVig(), h.vig + give);
    if (h.vig >= maxVig()) inv.turnipRegen = 0;
  }
  if (h.vig > maxVig()) h.vig = maxVig();
  const mv = maxVig();
  if (state.time - h.rest > 1.2 && h.vig < mv) h.vig = Math.min(mv, h.vig + (0.45 + mv * 0.05) * (inv.squashBuff > 0 ? 2 : 1) * dt);

  // movement
  const locked = h.stun > 0 || state.busy || state.pull.grip || h.ride || h.falling > 0 || (state.fish && !pressedNow.left && !pressedNow.right && !pressedNow.up && !pressedNow.down);
  if (h.ride && !h.ride.hop && pressedNow.act && h.z > UNIT * 0.3 && h.vig >= 0.8 && !state.carry) {   // stomp out of a gust
    h.ride = null; h.vx = 0; h.vy = 0; h.vz = 0; h.airDist = 99 * UNIT; state.cam.focus = null;
  }
  if (h.ride) updateRide(dt);
  else if (h.falling > 0) updateFall(dt);
  else if (h.dashT > 0) {
    h.dashT -= dt;
    const nx = h.x + h.vx * dt, ny = h.y + h.vy * dt;
    if ((sc.river || sc.deep || sc.chasms) && h.z <= 0 && !isChasm(h.x, h.y) && isChasm(nx, ny)) { h.dashT = 0; h.vx *= 0.2; h.vy *= 0.2; }   // a dodge stops at the water's edge
    else { h.x = nx; h.y = ny; }
    if (Math.random() < 0.6) state.fx.push({ x: h.x, y: h.y, vx: 0, vy: 0, t: 0, life: 0.2, color: 'rgba(245,208,111,.5)', size: UNIT * 0.8 });
  } else {
    const inp = locked ? { x: 0, y: 0 } : inputVector();
    if (inp.x || inp.y) { h.fx = inp.x; h.fy = inp.y; if (Math.abs(inp.x) > 0.3) h.side = Math.sign(inp.x); }
    let spd = sc.speed * (inMud(h.x, h.y + UNIT * 0.2) ? 0.55 : 1) * (state.inv.carrotBuff > 0 ? 1.12 : 1) * weakness() * (state.hold.charged ? 0.45 : 1) * (state.carry === 'rock' ? 0.6 : 1) * (state.whirl ? 0.55 : 1) * (state.aim.on ? 0.5 : 1);   // aiming a throw slows you
    if (inPool(h.x, h.y)) spd *= 0.55;
    if (inWeb(h.x, h.y)) { spd *= 0.45; say('Sticky webs. They\'d burn nicely.', h.x, h.y - UNIT * 1.2, { key: 'webtip', tip: 'web', life: 3 }); }
    const k = 1 - Math.exp(-(h.stun > 0 ? 3 : sc.accel) * dt);
    h.vx += (inp.x * spd * L() - h.vx) * k;
    h.vy += (inp.y * spd * L() - h.vy) * k;
    if (h.z > 0 && h.vz < 0) {                         // coming down over a stepping stone or a rock bank: settle onto it, don't sail past
      const sc2 = sceneDef(), spots = (sc2.rocks || []).filter(r => r.island).map(r => [r.fx, r.fy, r.r]).concat(sc2.river && sc2.river.stones ? sc2.river.stones : []);
      if (spots.some(([fx, fy, rU]) => Math.hypot(h.x - fx * W, h.y - fy * H) < rU * UNIT * 0.7) && !spots.some(([fx, fy]) => Math.hypot(h.x - fx * W, h.y - fy * H) < 1)) { h.vx *= 0.4; h.vy *= 0.4; }
    }
    if (h.z > 0) {                                     // in the air you only carry so far, then drop
      const step = Math.hypot(h.vx, h.vy) * dt, left = jumpReach() * UNIT - (h.airDist || 0);
      if (left <= 0) { h.vx = 0; h.vy = 0; }
      else if (step > left) { h.vx *= left / step; h.vy *= left / step; }
      h.airDist = (h.airDist || 0) + Math.hypot(h.vx, h.vy) * dt;
    }
    h.x += h.vx * dt; h.y += h.vy * dt;
    if (sc.gusts && (state.gustPhase === 'blow' || state.gustPhase === 'gentle')) {   // loose fluff blows about in the wind, and can blow clean away
      const w = gustVec(), k = state.gustPhase === 'blow' ? 0.035 : 0.01;
      for (let i = state.items.length - 1; i >= 0; i--) { const it = state.items[i]; if (it.type !== 'fluff' || it.magnet) continue;
        it.x += w[0] * k * L() * dt; it.y += w[1] * k * L() * dt;
        if (it.x < -UNIT || it.x > W + UNIT || it.y < -UNIT || it.y > H + UNIT) { state.items.splice(i, 1); if (!state.tipsSeen.fluffGone) { state.tipsSeen.fluffGone = true; say('Whoosh! The wind took a tuft of fluff.', h.x, h.y - UNIT * 1.3, { key: 'wind', life: 2.5, color: '#d8f0ff' }); } } }
    }
    if (sc.gusts && h.z <= 0 && (state.gustPhase === 'blow' || state.gustPhase === 'gentle') && !onRock(sc, h.x, h.y)) { const w = gustVec(), k = state.gustPhase === 'blow' ? 0.09 : 0.035; h.x += w[0] * k * L() * dt; h.y += w[1] * k * L() * dt; }   // gentle gusts nudge, the strong one shoves   // same push, same direction as the streaks
  }
  if (!h.ride) { collideSolids(h, UNIT * 0.42); clampTo(h, UNIT * 0.5); }
  h.stun -= dt; h.invuln -= dt; h.dashCool -= dt;
  updateJump(dt);

  if ((sc.chasms || sc.river || sc.deep) && !h.ride && h.falling <= 0 && h.dashT <= 0 && h.z <= 0) {
    if (isChasm(h.x, h.y)) { h.falling = 0.8; h.vx = 0; h.vy = 0; h.fallKind = sc.deep ? 'deep' : sc.river ? 'water' : 'pit'; if (sc.river || sc.deep) sfx.splash(); else sfx.plummet(); }
    else if (!isChasm(h.x, h.y, UNIT * 1.2)) h.safe = [h.x / W, h.y / H];
    else if (h.z <= 0 && (onRock(sc, h.x, h.y, UNIT * 0.4) || (sc.river && sc.river.stones && sc.river.stones.some(s => Math.hypot(h.x - s[0] * W, h.y - s[1] * H) < UNIT * 0.4)))) h.safe = [h.x / W, h.y / H];
  }

  if (!state.busy && !h.ride && h.falling <= 0) { checkEdges(); updateFeatures(dt); }
  if (!state.busy) { updateEnemies(dt); updateHazards(dt); updateShots(dt); updatePlates(false); }

  // things on the ground wait for F (see pickUpHere), unless your gathering skill brings them to you: within their
  // auto range they drift over and are taken. Only what drifts or heals by nature is taken just by touching it.
  for (let i = state.items.length - 1; i >= 0; i--) {
    const it = state.items[i];
    if (it.type === 'bigrock') continue;
    const d = Math.hypot(h.x - it.x, h.y - it.y);
    if (TOUCH_PICKUP.has(it.type)) { if (!h.ride && d < UNIT * 0.9) { state.items.splice(i, 1); collect(it); } continue; }
    if (!it.magnet && !h.ride && !state.carry && d < UNIT * autoRange(it.type)) it.magnet = true;
    if (it.magnet) {
      const sp = Math.min(d, UNIT * (6 + 10 * Math.min(1, (it.mt = (it.mt || 0) + dt)))  * dt);
      it.x += (h.x - it.x) / (d || 1) * sp; it.y += (h.y - it.y) / (d || 1) * sp;
      if (d < UNIT * 0.5) { state.items.splice(i, 1); collect(it); gatherGain(it.type); }
    }
  }
}
// tired heroes are slow heroes
// the emptier your vigor, the slower you move, the softer you hit, and the harder hits land.
// At 1 vigor or less you're crawling, barely scratching things, and one good hit away from fainting.
function weakness() { const h = state.hero, r = h.vig / maxVig(); if (h.vig <= 1) return 0.35; return r < 0.35 ? 0.45 + r * 1.57 : 1; }
function power() { const h = state.hero, r = h.vig / maxVig(); if (h.vig <= 1) return 0.15; return r < 0.35 ? 0.3 + r * 2 : 1; }
// how sluggish attacks are: 1 when fresh, up to 3 when spent
function sluggish() { const h = state.hero, r = h.vig / maxVig(); if (h.vig <= 1) return 3; return r < 0.35 ? 1 + (0.35 - r) * 5 : 1; }
function frailty() { const h = state.hero, r = h.vig / maxVig(); if (h.vig <= 1) return 2; return r < 0.25 ? 1 + (0.25 - r) * 4 : 1; }
function spend(cost) {
  const h = state.hero;
  if (h.vig < cost * 0.5) { if (!state.tiredT || state.time - state.tiredT > 2) { state.tiredT = state.time; sfx.tired(); say('Too tired...', h.x, h.y - UNIT, { key: 'tired', life: 1.2, color: '#ffb080' }); } return false; }
  h.vig = Math.max(0, h.vig - cost); h.rest = state.time;
  train(cost);
  return true;
}
// using vigor slowly deepens it
function train(amount) {
  const inv = state.inv;
  inv.xp += amount;
  const need = 25 * Math.pow(1.35, inv.tlevel);
  if (inv.xp >= need) {
    inv.xp -= need; inv.tlevel++;
    sfx.grow();
    say(`Your vigor grows. ${maxVig()}`, state.hero.x, state.hero.y - UNIT * 1.4, { key: 'grow', life: 2.2, color: '#b8f28a' });
  }
}

function clampTo(a, r) {
  let wall = false;
  if (a.x < r) { a.x = r; a.vx = Math.max(0, a.vx); wall = true; }
  if (a.x > W - r) { a.x = W - r; a.vx = Math.min(0, a.vx); wall = true; }
  if (a.y < r) { a.y = r; a.vy = Math.max(0, a.vy); wall = true; }
  if (a.y > H - r) { a.y = H - r; a.vy = Math.min(0, a.vy); wall = true; }
  return wall;
}
function collideSolids(a, r) {
  let hit = null;
  for (const o of state.solids) {
    const dx = a.x - o.x, dy = a.y - o.y, d = Math.hypot(dx, dy) || 0.001, min = r + o.r;
    if (d < min) {
      const nx = dx / d, ny = dy / d;
      a.x = o.x + nx * min; a.y = o.y + ny * min;
      const vn = a.vx * nx + a.vy * ny;
      if (vn < 0) { a.vx -= vn * nx; a.vy -= vn * ny; }
      hit = o;
    }
  }
  return hit;
}
const inPool = (x, y) => state.pools.some(p => Math.hypot(x - p.x, y - p.y) < p.r * 0.85);
const onRock = (sc, x, y, pad = 0) => (sc.rocks || []).some(r => Math.hypot(x - r.fx * W, y - r.fy * H) < r.r * UNIT - pad);
// can you actually see this from where you stand? Close enough, and nothing you couldn't walk through in between:
// no river, chasm or deep water, no tree or big rock. Notices about a place wait for this.
function inView(x, y, tiles = 6) {
  const h = state.hero, d = Math.hypot(x - h.x, y - h.y);
  if (d > UNIT * tiles) return false;
  const n = Math.ceil(d / (UNIT * 0.3));
  for (let i = 1; i < n; i++) {
    const px = h.x + (x - h.x) * i / n, py = h.y + (y - h.y) * i / n;
    if (isChasm(px, py)) return false;
    if (state.solids.some(s => (s.kind === 'tree' || s.r > UNIT * 0.7) && Math.hypot(s.x - px, s.y - py) < s.r * 0.8)) return false;
  }
  return true;
}
function isChasm(x, y, pad = 0) {
  const sc = sceneDef();
  if (sc.rocks && onRock(sc, x, y, pad)) return false;
  if (sc.river && riverHit(sc, x, y, pad, pad === 0)) return true;
  if (sc.deep) { const d = sc.deep, dx = (x / W - d.fx) / d.rx, dy = (y / H - d.fy) / d.ry, k = 1 + pad / (Math.min(d.rx * W, d.ry * H)); if (dx * dx + dy * dy < k * k) return true; }
  if (!sc.chasms) return false;
  const fx = x / W, fy = y / H, px = pad / W, py = pad / H;
  return sc.chasms.some(([x0, y0, x1, y1]) => fx > x0 - px && fx < x1 + px && fy > y0 - py && fy < y1 + py);
}

function updateGlimpse(dt) {
  const g = state.glimpse;
  g.t += dt;
  const p = Math.max(0, Math.min(1, (g.t - 0.9) / 1.4)), e = p * p;
  g.x = g.x0 + (g.x1 - g.x0) * e; g.y = g.y0 + (g.y1 - g.y0) * e;
  if (g.t > 0 && !g.said) { g.said = true; say(g.line, g.x, g.y - UNIT * 1.4, { key: 'glimpse', life: 2.2, color: '#9fd4ff' }); sfx.cackle(); zoomPulse(g.x, g.y, 'parry'); }
  if (p >= 1 && !g.gone) { g.gone = true; if (g.down) sfx.fall(); setTimeout(() => say('Gone again. Always one step behind.', state.hero.x, state.hero.y - UNIT * 1.2, { key: 'miss', life: 2.5 }), 0); }
  if (g.t > 3) state.glimpse = null;
}
// ---------------- stone plates: weight on them lifts their log gate ----------------
function updatePlates(quiet) {
  const plates = sceneDef().feat.plates;
  if (!plates) return;
  const h = state.hero;
  let changed = false;
  for (const p of plates) {
    const x = p.fx * W, y = p.fy * H;
    const rock = state.items.some(it => it.type === 'bigrock' && Math.hypot(it.x - x, it.y - y) < UNIT * 1.1);
    const on = rock || (h.z <= 0 && !h.ride && Math.hypot(h.x - x, h.y - y) < UNIT * 0.7);
    if (on !== !!state.plateOn[p.id]) {
      state.plateOn[p.id] = on; changed = true;
      if (!quiet) {
        sfx.rumble(); sfx.tock(); state.shake = 0.2;
        const g = sceneDef().solids.find(s => s.plate === p.id);
        if (g) zoomPulse(g.fx * W, g.fy * H, on ? 'kill' : 'hit');
        if (on && !rock) say('The log shifts... but you can\'t hold it and walk through.', x, y - UNIT * 1.2, { key: 'plate', tip: 'plate-self', life: 3.5 });
        if (on && rock) say('The rock holds the plate down. The log rolls aside.', x, y - UNIT * 1.2, { key: 'plate', life: 3 });
      }
    }
    if (!on && Math.hypot(h.x - x, h.y - y) < UNIT * 2.5) say('A stone plate, worn smooth. Something heavy would hold it down.', x, y - UNIT * 1.2, { key: 'platehint', tip: 'plate', life: 4 });
  }
  if (changed) refreshSceneGeometry();
}
// ---------------- scene features ----------------
function updateFeatures(dt) {
  const sc = sceneDef(), h = state.hero, f = sc.feat, rt = rtFor(sc.id);
  if (f.stone) {
    const sx = f.stone[0] * W, sy = f.stone[1] * H, d = Math.hypot(h.x - sx, h.y - sy);
    if (d < UNIT * 3) say('A sinkhole. The storm opened it.', sx, sy - UNIT * 0.9, { key: 'stone', tip: 'stone' });
    if (d < UNIT * 0.7) { say('You slip into the dark...', h.x, h.y - UNIT, { key: 'fall' }); sfx.fall(); zoomPulse(sx, sy, 'land'); transitionTo('c1', 0.08, 0.5); }
  }
  if (f.shrine && !rtFor(sc.id).flags.shrine && Math.hypot(h.x - f.shrine[0] * W, h.y - f.shrine[1] * H) < UNIT * 3) {
    rtFor(sc.id).flags.shrine = true;
    say('A sunken shrine. The stones hum, as if something beneath is waiting. For now, its offerings are yours.', f.shrine[0] * W, f.shrine[1] * H - UNIT * 2, { key: 'shrine', life: 6 });
    zoomPulse(f.shrine[0] * W, f.shrine[1] * H, 'boss');
  }
  if (f.falls) {
    const lim = W - UNIT * 2.3 - UNIT * 0.45, gap = sc.exits.find(e => e.side === 'e');
    const open = rt.bossDead && h.y > gap.a * H + UNIT * 0.5 && h.y < gap.b * H - UNIT * 0.5;
    if (h.x > lim && !open) { h.x = lim; h.vx = Math.min(0, h.vx); }
  }
  if (sc.river && sc.river.stones && !isChasm(h.x, h.y) && h.y > H * 0.85) say(`Jump (${K.jump}) toward a stone to hop onto it.`, h.x, h.y - UNIT * 1.3, { key: 'hoptip', tip: 'hop', life: 4 });
  if (f.plants && f.plants.length && (sc.id === 'f1' || sc.id === 'f3')) { const s = f.plants[0]; if (Math.hypot(h.x - s[0] * W, h.y - s[1] * H) < UNIT * 3) say(`Tall grass leans the way the next gust will blow. Jump (${K.jump}) while it blows to ride it.`, s[0] * W, s[1] * H - UNIT * 1.8, { key: 'sock', tip: 'sock' + sc.id, life: 5 }); }
}

// ---------------- jumping: always available; slam down with the sword ----------------
// how far a jump can carry you, in tiles: short at first, growing with max vigor; the river (about 3.5 tiles
// of water) is out of reach until max vigor reaches 20. A tired hero reaches less.
function jumpReach() {
  const mv = maxVig(), base = mv < 20 ? 2.2 + 0.9 * Math.max(0, mv - 8) / 12 : Math.min(7, 3.9 + 0.8 * Math.log2(mv / 20));
  return base * (0.6 + 0.4 * weakness());
}
function jumpGrowth() { const mv = maxVig(); return [Math.max(0, Math.min(1, (mv - 8) / 12)), Math.min(0.5, 0.2 * Math.log2(Math.max(1, mv / 20)))]; }
function updateJump(dt) {
  const h = state.hero, sc = sceneDef();
  if (h.ride || h.falling > 0) return;
  if (pressedNow.jump && h.z <= 0 && !state.busy && !state.pull.grip && !state.carry) {
    // more vigor, higher and longer jumps, a little at a time; a tired hero barely leaves the ground
    const [f, g2] = jumpGrowth();
    h.vz = UNIT * (5.8 + 1.7 * f) * (1 + g2) * (0.6 + 0.4 * weakness()); h.z = 0.01; state.slam = false; h.jumpHold = 0; h.glideT = 0; h.airDist = 0;
    if (state.whirl) { state.whirl.air = true; bumpCrazy('Glide'); say(`${K.act} in the air to pound down`, h.x, h.y - UNIT * 1.8, { key: 'glidetip', tip: 'glide', life: 3 }); }
    sfx.jump(); train(0.3);
    if (sc.gusts && state.gustPhase === 'blow' && rideGust(sc)) return;
  }
  if (h.z > 0 || h.vz > 0) {
    // holding jump while rising floats you higher, for a short while
    const floating = !state.slam && h.vz > 0 && held.jump() && (h.jumpHold += dt) < 0.12 + 0.18 * jumpGrowth()[0] + 0.2 * jumpGrowth()[1];
    const gliding = state.whirl && !state.slam && (h.glideT = (h.glideT || 0) + dt) < 1.1;   // a spinning jump rides the air for a moment
    h.vz -= UNIT * (state.slam ? 60 : gliding ? (h.vz > 0 ? 16 : 6) : floating ? 11 : 30) * dt;
    if (gliding && h.vz < -UNIT * 3) h.vz = -UNIT * 3;
    h.z += h.vz * dt;
    if (gliding && Math.random() < 0.5) state.fx.push({ x: h.x + (Math.random() - 0.5) * UNIT * 2, y: h.y + UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 2, vy: -UNIT, t: 0, life: 0.5, color: 'streak', size: UNIT * 0.4 });
    if (h.z <= 0) {
      h.z = 0; h.vz = 0;
      if (sc.river && sc.river.stones) catchStone(h, sc);
      if (sc.rocks && sc.rocks.length) catchStone(h, { river: { stones: sc.rocks.filter(r => r.island).map(r => [r.fx, r.fy, r.r]) } });
      if (state.slam) slamDown();
      else { spark(h.x, h.y + UNIT * 0.4, 'rgba(160,140,110,.8)', 4, 1.5); }
    }
  }
}
// Stepping stones, laid out for this seed and this screen: each hop is straight up or on a diagonal
// (the ways you can move), about 1.85 tiles centre to centre. That's inside a jump even at the lowest
// vigor, and far enough apart that walking between them drops you in.
function layoutStones(sc) {
  const r = sc.river, R = mulberry32((SEED ^ 0x51f15e) >>> 0), rnd = (a, b) => a + R() * (b - a);
  const top = H * (0.5 - r.wH / 2), bottom = H * (0.5 + r.wH / 2), out = [];
  let x = W * rnd(0.3, 0.7), y = bottom + UNIT * 0.3, prev = 'n';
  for (let n = 0; n < 60 && y - top > UNIT * 1.9; n++) {
    let dir = R() < 0.45 ? 'n' : R() < 0.5 ? 'ne' : 'nw';
    if (prev !== 'n' && R() < 0.5) dir = prev;                       // runs of diagonals make zigzags and sweeps
    if (x < W * 0.2) dir = 'ne'; if (x > W * 0.8) dir = 'nw';
    const d = UNIT * rnd(1.75, 1.95), k = dir === 'n' ? [0, -1] : [dir === 'ne' ? 0.7071 : -0.7071, -0.7071];
    x += k[0] * d; y += k[1] * d; prev = dir;
    out.push([x / W, y / H, 0.8]);
  }
  r.stones = out;
}
// The mountain path's ravines each get a column of rock banks, spaced in tiles for this screen so every hop
// fits the shortest jump. The column stands where both banks are solid ground.
function layoutRavineRocks(sc) {
  sc.rocks = sc.rocks.filter(r => !r.island);
  sc.chasms.forEach((c, i) => {
    const inOther = (fx, fy) => sc.chasms.some((o, j) => j !== i && fx >= o[0] && fx <= o[2] && fy >= o[1] && fy <= o[3]);
    const lo = Math.max(0.2, c[0] + 0.08), hi = Math.min(0.8, c[2] - 0.08);
    // a clear run: solid ground above and below, nothing standing in the way of the hops
    const blocked = (fx, fy) => sc.solids.some(s => Math.hypot(fx * W - s.fx * W, fy * H - s.fy * H) < (s.r + 1.1) * UNIT);
    let fx = null;
    for (let t = 0; t < 30 && fx == null; t++) {
      const x = lo + (hi - lo) * ((sc.rockCols[i] + t * 0.137) % 1);
      if (!inOther(x, c[1] - 0.03) && !inOther(x, c[3] + 0.03) && !blocked(x, c[1] - UNIT * 0.8 / H) && !blocked(x, c[3] + UNIT * 0.8 / H) && !blocked(x, (c[1] + c[3]) / 2)) fx = x;
    }
    const full = c[0] <= 0.01 && c[2] >= 0.99;
    if (fx == null && full) {                          // a full-width ravine must be crossable: clear boulders off the best spot
      for (let t = 0; t < 30 && fx == null; t++) { const x = lo + (hi - lo) * ((sc.rockCols[i] + t * 0.137) % 1); if (!inOther(x, c[1] - 0.03) && !inOther(x, c[3] + 0.03)) fx = x; }
      if (fx != null) sc.solids = sc.solids.filter(s => s.kind !== 'boulder' || ![c[1] - UNIT * 0.8 / H, (c[1] + c[3]) / 2, c[3] + UNIT * 0.8 / H].some(fy => Math.hypot(fx * W - s.fx * W, fy * H - s.fy * H) < (s.r + 1.1) * UNIT));
    }
    if (fx == null) return;                           // this part of the ravine is walked around, not crossed
    const y0 = c[1] * H, y1 = c[3] * H, n = Math.max(1, Math.ceil((y1 - y0) / (UNIT * 1.85)) - 1);
    for (let k = 1; k <= n; k++) sc.rocks.push({ fx, fy: (y0 + (y1 - y0) * k / (n + 1)) / H, r: 0.85, island: true });
  });
}
// landing just short of a stone counts: you catch its edge
function catchStone(h, sc) {
  let best = null, bd = Infinity;
  for (const [fx, fy, rU] of sc.river.stones) { const d = Math.hypot(h.x - fx * W, h.y - fy * H); if (d < rU * UNIT * 1.3 && d < bd) { bd = d; best = [fx * W, fy * H, rU]; } }
  if (best && bd > best[2] * UNIT * 0.6) { const a = Math.atan2(h.y - best[1], h.x - best[0]); h.x = best[0] + Math.cos(a) * best[2] * UNIT * 0.55; h.y = best[1] + Math.sin(a) * best[2] * UNIT * 0.55; }
}
// stepping stones: a jump aimed at a stone lands you on it, so crossing is about choosing each hop
function hopToStone(sc) {
  const h = state.hero;
  let best = null, bd = Infinity;
  for (const [fx, fy] of sc.river.stones.concat(sc.river.banks || [])) {
    const x = fx * W, y = fy * H, dx = x - h.x, dy = y - h.y, d = Math.hypot(dx, dy);
    if (d < UNIT * 0.8 || d > Math.max(UNIT * 5.5, H * 0.2) || (dx * h.fx + dy * h.fy) / d < 0.55) continue;   // ahead of you and within a hop
    if (d < bd) { bd = d; best = [x, y]; }
  }
  if (!best) return false;
  h.ride = { t: 0, dur: 0.45 + bd / (UNIT * 14), x0: h.x, y0: h.y, x1: best[0], y1: best[1], hgt: UNIT * 1.3, hop: true };
  sfx.jump();
  return true;
}
function rideGust(sc) {
  const h = state.hero, tgt = windTarget(sc);
  if (!tgt) return false;                             // no ledge that way: just an ordinary jump
  const d = Math.hypot(tgt[0] - h.x, tgt[1] - h.y);
  h.ride = { t: 0, dur: 0.9 + d / (H * 0.3) * 0.8, x0: h.x, y0: h.y, x1: tgt[0], y1: tgt[1], hgt: UNIT * (1.6 + d / H * 3), wind: true };
  state.cam.focus = { z: 1.06, at: () => [(h.x + tgt[0]) / 2, (h.y + tgt[1]) / 2] };
  h.invuln = 2.2; sfx.whoosh();
  zoomPulse(h.x, h.y, 'pickup');
  return true;
}
function updateRide(dt) {
  const h = state.hero, r = h.ride;
  r.t += dt;
  const p = Math.min(1, r.t / r.dur), e = p * p * (3 - 2 * p);
  h.x = r.x0 + (r.x1 - r.x0) * e;
  h.y = r.y0 + (r.y1 - r.y0) * e;
  h.z = Math.sin(Math.PI * p) * (r.hgt || UNIT * 3.2);
  if (!r.hop && Math.random() < 0.5) state.fx.push({ x: h.x + (Math.random() - 0.5) * UNIT * 2, y: h.y + UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 3, vy: -UNIT * 2, t: 0, life: 0.6, color: 'leaf', spin: Math.random() * 6 });
  if (p >= 1 && r.blown) {
    h.ride = null; h.z = 0;
    if (h.safe) { h.x = h.safe[0] * W; h.y = h.safe[1] * H; }
    sfx.land(); state.shake = 0.3;
    say('The gust tumbles you back. Wait on the rock for it to pass.', h.x, h.y - UNIT, { key: 'blown', life: 3 });
    return;
  }
  if (p >= 1 && r.hop) {
    h.ride = null; h.z = 0; h.vz = 0; h.vx = 0; h.vy = 0;
    sfx.tock(); spark(h.x, h.y + UNIT * 0.3, 'rgba(210,235,245,.8)', 6, 1.5);
    return;
  }
  if (p >= 1 && r.wind) state.cam.focus = null;
  if (p >= 1) {
    h.ride = null; h.z = 0; h.vz = 0; h.vx = 0; h.vy = 0; h.rideCool = state.time + 1.5;
    for (let i = 0; i < 10; i++) state.fx.push({ x: h.x + (Math.random() - 0.5) * UNIT, y: h.y + UNIT * 0.35, vx: (Math.random() - 0.5) * UNIT * 3, vy: -UNIT * Math.random(), t: 0, life: 0.6, color: 'rgba(170,150,110,.7)', size: UNIT * 0.2 });
    clampTo(h, UNIT * 0.5);
    sfx.land(); zoomPulse(h.x, h.y, 'land'); state.shake = 0.2;
    spark(h.x, h.y + UNIT * 0.4, '#9a8a5a', 10, 3);
  }
}
function updateFall(dt) {
  const h = state.hero;
  h.falling -= dt;
  if (h.falling <= 0) {
    h.falling = 0;
    const s = h.safe || [state.entry.fx, state.entry.fy];
    h.x = s[0] * W; h.y = s[1] * H; h.vx = 0; h.vy = 0;
    say(h.fallKind === 'deep' ? 'Too deep! You splash back to the shallows.' : h.fallKind === 'water' ? 'The current sweeps you back to the bank.' : 'Ooof. Back up the bank.', h.x, h.y - UNIT, { key: 'fall', life: 1.8 });
    hurtHero(1, h.x, h.y, { noKnock: true, force: true });
  }
}

// ---------------- wind: a schedule of gusts the windsock announces ----------------
const gustVec = () => { const g = sceneDef().gusts[state.gustIdx]; return [Math.sin(g.a), Math.cos(g.a)]; };   // every gust the same strength
function updateWind(dt, sc) {
  state.gustT += dt;
  const SEQ = ['lull', 'gentle', 'lull', 'gentle', 'lull', 'blow'], T = { lull: 1.3, gentle: 1.1, blow: 1.8 };
  if (state.gustT > (state.gustDur || T[state.gustPhase])) {
    state.gustT = 0;
    state.gustStep = ((state.gustStep || 0) + 1) % SEQ.length;
    state.gustPhase = SEQ[state.gustStep];
    if (state.gustStep === 1) { state.gustIdx = (state.gustIdx + 1) % sc.gusts.length; state.gustTempo = 0.7 + Math.random() * 0.7; }   // a new series: maybe a new direction, its own pace
    state.gustDur = state.gustStep === 0 ? 3 + Math.random() * 1.6                                                   // a long, calm pause before each set of three
      : (state.gustPhase === 'lull' ? 0.85 : T[state.gustPhase]) * (state.gustTempo || 1) * (0.8 + Math.random() * 0.45);   // short ones inside it; every gust a little different
    if (state.gustPhase === 'gentle') sfx.whoosh();
    if (state.gustPhase === 'blow') { sfx.whoosh(); sfx.whoosh(); state.shake = Math.max(state.shake, 0.12); }
  }
  const target = state.gustPhase === 'blow' ? 1 : state.gustPhase === 'gentle' ? 0.4 : 0.08;
  state.gust += (target - state.gust) * (1 - Math.exp(-4 * dt));
  const g = sc.gusts[state.gustIdx];
  ambLevel(0.04 + state.gust * g.s * 0.2, 380 + state.gust * g.s * 800);
  const [wx, wy] = gustVec(), mag = Math.hypot(wx, wy) || 1;
  const n = state.gust * 4 * g.s;
  for (let i = 0; i < n; i++) if (Math.random() < 0.5) {
    // streaks start on the upwind side, whichever way the gust blows
    const up = wy < 0 ? H * (0.7 + Math.random() * 0.3) + UNIT * 2 : Math.random() * H * 0.3 - UNIT * 2;
    state.fx.push({ x: Math.random() * W - wx / mag * UNIT * 3, y: up, vx: wx / mag * L() * (0.5 + state.gust), vy: wy / mag * L() * (0.5 + state.gust), t: 0, life: 2.5, color: 'streak', size: UNIT * (0.8 + state.gust * 1.6) });
  }
  if (Math.random() < 0.05 + state.gust * 0.3) state.fx.push({ x: Math.random() * W, y: wy < 0 ? H + 10 : -10, vx: wx / mag * L() * 0.3, vy: wy / mag * L() * 0.3 + (wy < 0 ? -UNIT : UNIT), t: 0, life: 4, color: 'leaf', spin: Math.random() * 6 });
  for (const c of state.clouds) { c.x += L() * 0.02 * dt * wx / mag; c.y += L() * 0.02 * dt * wy / mag; if (c.x > W + c.r) c.x = -c.r; if (c.x < -c.r) c.x = W + c.r; if (c.y > H + c.r) c.y = -c.r; if (c.y < -c.r) c.y = H + c.r; }
}

// =====================================================================
// Pulling things free: hold F, rock left/right, pull up
// =====================================================================
// a thrown rock (or a swing, or a stomp) against a breakable stone: tough stones take several good hits, and not every hit counts
function hitStone(o, force) {
  const rt = rtFor(state.scene), cs = sceneDef().solids.find(s => s.bar === o.bar), S = cs && cs.stone && STONES[cs.stone];
  const dur = S ? S.dur : 1, key = 'hits_' + o.bar;
  const counts = !S ? force >= 0.7 || rng() < 0.75 : rng() < 0.45 + 0.4 * Math.min(1, force);
  if (!counts) { sfx.tock(); spark(o.x, o.y, '#9a948a', 4, 1.5); say(S ? `${S.name}. It shrugs that one off.` : 'Glanced off! Try again.', o.x, o.y - UNIT, { key: 'stonehit', life: 1.4 }); return; }
  rt.flags[key] = (rt.flags[key] || 0) + 1;
  if (rt.flags[key] >= dur) breakBarrier(o.bar, 'rock');
  else { sfx.crash(); state.shake = 0.15; spark(o.x, o.y, S ? S.tint : '#8f887c', 8, 2); say(`${S.name}: cracking. ${dur - rt.flags[key]} more.`, o.x, o.y - UNIT, { key: 'stonehit', life: 1.6 }); }
}
// buried rocks have to be knocked loose before you can rock them out
function knockRocks(x, y, reach) {
  const sc = sceneDef(), rt = rtFor(sc.id);
  for (const pl of sc.pullables) {
    if (pl.kind !== 'rock' || rt.pulled.has(pl.id) || rt.flags['knocked_' + pl.id]) continue;
    const px = pl.fx * W, py = pl.fy * H;
    if (Math.hypot(px - x, py - y) > reach) continue;
    rt.flags['knocked_' + pl.id] = true;
    sfx.crash(); state.shake = 0.2; zoomPulse(px, py, 'parry');
    for (let d = 0; d < 10; d++) state.fx.push({ x: px + (Math.random() - 0.5) * UNIT, y: py + UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 4, vy: -UNIT * (1 + Math.random() * 2.5), t: 0, life: 0.7, color: Math.random() < 0.5 ? '#5a4128' : '#6e5234', size: UNIT * 0.09 });
    say(`THUNK. It shifted! Now hold ${K.act} and rock it.`, px, py - UNIT * 1.3, { key: 'pull', life: 3 });
  }
}
const PULL = {
  rock: {
    approach: () => `A big rock, sunk deep in the earth. Knock it loose first: jump and stomp beside it`,
    fails: () => [`It's sunk deep in the mud. Keep holding ${K.act} and rock it ${K.l} ${K.r}`, `Pulling straight won't work. Hold on and rock it ${K.l} ${K.r}`],
    rock: ['It shifts.', 'Mud sucks at it.', 'Almost...', `Loose! Now pull ${K.u}`],
    notYet: () => `Not yet. Rock it more ${K.l} ${K.r}`,
  },
  sword: {
    approach: () => `A rusted sword, stuck fast in an old stump. ${K.act} to grab`,
    fails: () => ['You pull with everything you have. It won\'t budge.', 'The rust has welded blade to wood.', 'Your hands slip on the rust.', 'Like that rock, only much worse.'],
    rock: ['It creaks.', 'It creaks.', 'Flakes of rust fall away.', 'Flakes of rust fall away.', 'The wood groans and gives.', 'It\'s loose. Now pull.'],
    notYet: () => 'Not yet. It needs more working.',
  },
};
function updatePull(dt) {
  const sc = sceneDef(), rt = rtFor(sc.id), h = state.hero;
  let near = null;
  if (!state.carry) for (const pl of sc.pullables) {
    if (rt.pulled.has(pl.id)) continue;
    if (Math.hypot(h.x - pl.fx * W, h.y - pl.fy * H) < UNIT * 1.7) near = pl;
  }
  let p = state.pull;
  p.tilt += (p.lastSide * Math.min(1, p.wiggle / (near ? near.need : 6)) * 0.35 - p.tilt) * (1 - Math.exp(-8 * dt));
  if (!near) {
    p.grip = false;
    p.wiggle = Math.max(0, p.wiggle - dt * 0.4);
    if (p.hinted) { p.hinted = false; unsay('pull'); }
    return;
  }
  if (p.id !== near.id) p = state.pull = newPull(near.id);
  const x = near.fx * W, y = near.fy * H, T = PULL[near.kind];
  const tell = (s, tip) => say(s, x, y - UNIT * 1.3, { key: 'pull', life: 3.5, tip });
  if (!p.grip && !p.hinted) { p.hinted = true; tell(T.approach(), 'pull-' + near.kind); }
  if (near.kind === 'rock' && !rt.flags['knocked_' + near.id]) {     // still stuck fast: grabbing does nothing yet
    if (pressedNow.act) { sfx.strain(); tell(`Stuck fast. Knock it loose first: jump and stomp right beside it.`); }
    return;
  }
  if (pressedNow.act && !p.grip) {
    p.grip = true; sfx.strain();
    const f = T.fails();
    if (p.wiggle >= near.need) tell(`It's loose. Pull ${K.u}`);
    else tell(f[Math.min(p.tries++, f.length - 1)]);
    return;
  }
  if (p.grip && !held.act()) { p.grip = false; return; }
  if (!p.grip) return;
  if (pressedNow.left || pressedNow.right) {
    const side = pressedNow.left ? -1 : 1;
    if (side !== p.lastSide) {
      p.wiggle = Math.min(near.need, Math.floor(p.wiggle) + 1);
      if (near.kind === 'rock') for (let d = 0; d < 6; d++) state.fx.push({ x: near.fx * W + (Math.random() - 0.5) * UNIT * 1.2, y: near.fy * H + UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 3, vy: -UNIT * (1 + Math.random() * 2), t: 0, life: 0.6, color: Math.random() < 0.5 ? '#5a4128' : '#6e5234', size: UNIT * 0.09 });   // soil kicked up as it loosens
      p.lastSide = side;
      sfx.creak(side > 0);
      tell(T.rock[Math.min(T.rock.length - 1, Math.max(0, Math.round(p.wiggle / near.need * T.rock.length) - 1))]);
      state.shake = 0.08;
      zoomPulse(x, y, 'tap');
    } else tell('It\'s already leaning that way.');
  }
  if (pressedNow.up) {
    if (p.wiggle >= near.need) freePullable(near, x, y);
    else { sfx.strain(); const f = T.fails(); tell(p.wiggle > 0 ? T.notYet() : f[Math.min(p.tries++, f.length - 1)]); }
  }
  if (pressedNow.down) tell('You brace your feet.');
}
// ---------------- mud: slows you down, and swallows any rock that lands in it ----------------
// sc.mud = [[fx, fy, radius in tiles]]. A sunk rock becomes a buried rock right there (the same pound, rock and heave
// as any other: knockRocks / updatePull / freePullable), listed in rt.flags.mudRocks so it survives leaving and saving.
function inMud(x, y, sc = sceneDef()) { return (sc.mud || []).some(([fx, fy, r]) => { const dx = (x - fx * W) / (r * UNIT), dy = (y - fy * H) / (r * UNIT * 0.62); return dx * dx + dy * dy < 1; }); }
function syncMudRocks(sc) {
  const rt = rtFor(sc.id);
  sc.pullables = sc.pullables.filter(p => !p.mud);
  for (const m of rt.flags.mudRocks || []) sc.pullables.push({ id: m.id, kind: 'rock', fx: m.fx, fy: m.fy, need: 2, mud: true });
}
function sinkRock(x, y) {
  const sc = sceneDef(), rt = rtFor(sc.id), id = 'mud' + (rt.flags.mudN = (rt.flags.mudN || 0) + 1);
  (rt.flags.mudRocks = rt.flags.mudRocks || []).push({ id, fx: x / W, fy: y / H });
  syncMudRocks(sc);
  sfx.splash(); state.shake = 0.12;
  for (let d = 0; d < 14; d++) state.fx.push({ x: x + (Math.random() - 0.5) * UNIT * 0.8, y, vx: (Math.random() - 0.5) * UNIT * 4, vy: -UNIT * (1 + Math.random() * 2.5), t: 0, life: 0.7, color: Math.random() < 0.5 ? '#3e2c18' : '#5a4128', size: UNIT * 0.1 });
  say('Glorp. Stuck in the mud.', x, y - UNIT * 1.2, { key: 'mud', life: 2.2, color: '#c9a86a' });
  say(`A rock in the mud is stuck fast. Pound beside it (${K.jump} then ${K.act}), then rock it and heave it out.`, x, y, { key: 'mudtip', tip: 'mud', life: 4 });
}
function freePullable(pl, x, y) {
  if (pl.mud) { const rt = rtFor(state.scene); rt.flags.mudRocks = (rt.flags.mudRocks || []).filter(m => m.id !== pl.id); delete rt.flags['knocked_' + pl.id]; syncMudRocks(sceneDef()); }
  else rtFor(state.scene).pulled.add(pl.id);
  state.pull = newPull(null);
  unsay('pull');
  if (pl.kind === 'rock') {
    sfx.lift(); zoomPulse(x, y, 'pickup'); spark(x, y, '#6a4a2a', 12, 3);
    for (let d = 0; d < 18; d++) state.fx.push({ x: x + (Math.random() - 0.5) * UNIT, y: y + UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 5, vy: -UNIT * (2 + Math.random() * 3), t: 0, life: 0.8, color: Math.random() < 0.5 ? '#5a4128' : '#6e5234', size: UNIT * (0.08 + Math.random() * 0.06) });   // heaved out in a shower of dirt
    state.carry = 'rock'; state.carryT = state.time; refreshButtons();
    say(`Heavy! It takes both hands. Tap ${K.act} to set it down ahead of you, or hold ${K.act} to aim and let go to throw.`, x, y - UNIT * 1.6, { key: 'pull', life: 5, tip: 'throw-rock' });
  } else startSwordCut();
}

// =====================================================================
// Hero vigor: one pool for life and abilities
// =====================================================================
function hurtHero(dmg, fromX, fromY, opts = {}) {
  const h = state.hero;
  if (!opts.force && (h.invuln > 0 || h.ride || state.cut)) return false;
  if (state.whirl) endWhirl('hit');
  h.vig -= dmg * 2 * (1 - 0.15 * state.inv.up.guard) * frailty() * (wears('stonecharm') ? 0.75 : 1); h.rest = state.time + 0.8; h.hurtT = state.time;
  if (h.vig > 0 && h.vig <= 1) say('Exhausted...', h.x, h.y - UNIT * 1.2, { key: 'tired', life: 1.5, color: '#ffb080' });
  h.invuln = 1.2;
  sfx.hit();
  state.shake = 0.35;
  zoomPulse(h.x, h.y, 'hurt');
  state.hold.on = false; state.hold.charged = false; state.pull.grip = false;
  if (state.carry === 'rock') dropRock();
  if (!opts.noKnock) {
    const e = state.entry;
    let ax = h.x - fromX, ay = h.y - fromY; const al = Math.hypot(ax, ay) || 1;
    let bx = e.fx * W - h.x, by = e.fy * H - h.y; const bl = Math.hypot(bx, by) || 1;
    let kx = ax / al + 0.6 * bx / bl, ky = ay / al + 0.6 * by / bl; const kl = Math.hypot(kx, ky) || 1;
    h.vx = kx / kl * 0.9 * L(); h.vy = ky / kl * 0.9 * L(); h.stun = 0.5;
  }
  if (h.vig <= 0) {
    h.vig = 0;
    state.cut = { type: 'faint', t: 0 };
    state.fadeTarget = 1; state.fadeRate = 3;
    sfx.death();
  }
  return true;
}

// =====================================================================
// Drops: every monster leaves something tied to what it was
// =====================================================================
// Drop tables: rolled in order, first hit wins. Relics are rare and level up (to 3).
const DROPS = {
  stalker:  [['step', 0.1], ['ear', 0.25], ['hide', 0.15], ['ironseed', 0.05], ['wisp', 0.3]],
  diver:    [['silk', 0.12], ['ironseed', 0.05], ['wisp', 0.3]],
  charger:  [['horn', 0.14], ['ironseed', 0.08], ['wisp', 0.35]],
  glowworm: [['lumin', 0.3], ['emberseed', 0.08]],
  rabbit:   [['fluff', 0.3], ['carrot', 0.35], ['thornseed', 0.08], ['carrotseed', 0.12]],
  lurker:   [['slime', 0.25], ['emberseed', 0.08], ['wisp', 0.2]],
  gremlin:  [['thornseed', 0.1], ['turnipseed', 0.25], ['acorn', 0.3]],
  warden:   [['warden', 1]],
};
// Seeds, rarest last. Vegetable seeds (crop) grow that vegetable, one to a few per seed; the rest grow materials.
// Colours and shapes follow the real seeds: turnip seeds are tiny dark round beads, carrot seeds small tan ridged ovals,
// pepper seeds flat pale discs, squash seeds cream teardrops with a rim.
const SEEDS = {
  turnipseed: { name: 'Turnip seeds', rarity: 'Common', grow: 20, crop: 'turnip', n: [1, 3], color: '#4a2a1e' },
  carrotseed: { name: 'Carrot seeds', rarity: 'Common', grow: 24, crop: 'carrot', n: [1, 2], color: '#a8905e' },
  pepperseed: { name: 'Pepper seeds', rarity: 'Uncommon', grow: 28, crop: 'pepper', n: [1, 3], color: '#e8d68a' },
  squashseed: { name: 'Squash seeds', rarity: 'Uncommon', grow: 34, crop: 'squash', n: [1, 1], color: '#f2e8cc' },
  thornseed: { name: 'Thornseed', rarity: 'Uncommon', grow: 25, yields: ['thorn', 2], color: '#c98ad8' },
  emberseed: { name: 'Emberseed', rarity: 'Rare', grow: 32, yields: ['ember', 2], color: '#ffa04a' },
  ironseed:  { name: 'Ironseed', rarity: 'Rare', grow: 40, yields: ['ironwood', 1], color: '#b0b8c0' },
  starseed:  { name: 'Starseed', rarity: 'Very rare', grow: 60, yields: ['starpetal', 1], color: '#fff6c8' },
};
const SEED_OF = { turnip: 'turnipseed', carrot: 'carrotseed', pepper: 'pepperseed', squash: 'squashseed' };
const CROP_SEEDS = Object.keys(SEED_OF).map(k => SEED_OF[k]);
const isSeed = t => !!SEEDS[t];
// the seed that grows what this place grows (a stray "seed" drop becomes the local one)
function localSeed(sc) { sc = sc || sceneDef(); return SEED_OF[CROP[sc.area]] || 'turnipseed'; }
const PAGE_NOTES = [
  'Day 3. The robin\'s hollow tree is full of seeds. It drops them when it flies.',
  'The big mushrooms hum at night. I swear they\'re talking to each other.',
  'Fish in the gleaming pool bite if you wait for the ripple, then strike FAST.',
  'Rabbits on the mountain are guarding something. Something slow.',
  'Gremlins hate fire. Ember bloom stirred into glue, smeared on a blade: it burns what it cuts!',
  'The swamp stones hum like the mushrooms do. Lower, though. Older.',
  'If a gust is too strong, don\'t jump. You end up at the bottom. Ask me how I know.',
  'Thorns wound in rabbit fluff grip a blade and bite. Works anywhere, no bench needed.',
];
const PAGE_LORE = { 4: 'emberoil', 7: 'thornwrap' };            // pages that give you an idea for the mat
const MATS = { thorn: 'thorn', ember: 'ember bloom', ironwood: 'ironwood', starpetal: 'star petal', ear: 'stalker ear', hide: 'stalker hide', driftwood: 'driftwood', silkpart: 'diver silk', hornpart: 'charger horn' };
const RELICS = {
  step: { name: 'Stalker\'s Step', levels: [`${K.dash}: dodge, untouchable for a blink. Dodge a lunge at the last moment and time slows.`, 'Recovers faster between dodges.', 'Dodges cost half the vigor and last longer.'] },
  silk: { name: 'Diver Silk', levels: ['Strung into a sling: acorns fly faster and hit harder.', 'Acorns punch through and keep flying.', 'Acorns tangle what they hit, holding it still.'] },
  horn: { name: 'Charger Horn', levels: ['Lashed to your blade: stabs hit harder and always knock back.', 'Chained stabs hit harder still.', 'Your stabs reach farther.'] },
};
function itemExists(type) {
  if (state.items.some(i => i.type === type)) return true;
  return Object.values(RT).some(rt => rt.items.some(i => i.type === type));
}
function dropFor(e) {
  if (e.type === 'rabbit' && !campDone() && (campMissing().fluff || 0) > 0) return 'fluff';   // still short of fluff for camp: straight from the source
  for (const [t, p] of DROPS[e.type] || []) {
    if (rng() >= p) continue;
    if (RELICS[t] && ((state.inv[t] || 0) + (state.inv.mats[t + 'part'] || 0) >= 3 || itemExists(t))) return 'wisp';
    if (t === 'scalp' && (state.inv.scalp || itemExists('scalp'))) return 'wisp';
    return t;
  }
  return null;
}
// a relic landing is an event: light, fanfare, a slow breath, its name
function relicMoment(type, x, y) {
  sfx.fanfare(); zoomPulse(x, y, 'boss'); state.slowmo = 0.8;
  state.fx.push({ x, y, vx: 0, vy: 0, t: 0, life: 2.5, color: 'beam' });
}
function heal(frac, label) {
  const h = state.hero, mv = maxVig(), before = h.vig;
  h.vig = Math.min(mv, h.vig + mv * frac);
  say('+' + Math.round(h.vig - before), h.x, h.y - UNIT * 0.9, { key: 'heal', life: 1.2, color: '#b8f28a' });
}
function deepen(msg) {
  state.inv.depth++;
  state.hero.vig = maxVig();
  say(msg + ` Vigor ${maxVig()}.`, state.hero.x, state.hero.y - UNIT * 1.1, { key: 'item', life: 5 });
}
const TOUCH_PICKUP = new Set(['spore', 'spores7', 'wisp']);
const PICK_R = 1.15;                                     // tiles: how close F reaches for something on the ground
// the thing on the ground F would pick up right now (nearest, within reach), or null
function itemAtFeet() {
  const h = state.hero;
  if (h.z > 0 || state.carry) return null;
  let best = null, bd;
  bd = UNIT * gatherReach();
  for (const it of state.items) { if (it.type === 'bigrock' || TOUCH_PICKUP.has(it.type) || it.magnet) continue; const d = Math.hypot(h.x - it.x, h.y - it.y); if (d < bd) { bd = d; best = it; } }
  return best;
}
function pickUpHere() {
  const it = itemAtFeet();
  if (!it) return false;
  state.items.splice(state.items.indexOf(it), 1); collect(it); gatherGain(it.type);
  tidySlots();                                           // straight into an empty slot, so what's said next knows the key
  return true;
}
function collect(it) {
  if ((it.type === 'spore' || it.type === 'spores7') && !state.inv.pipSaved) { state.inv.spores += it.type === 'spores7' ? 7 : 1; return; }   // pocketed without a word
  const inv = state.inv, h = state.hero;
  const tell = (s, life = 4, tip) => say(s, h.x, h.y - UNIT * 1.1, { key: 'item', life, tip });
  zoomPulse(it.x, it.y, 'pickup');
  if (RELICS[it.type] || it.type === 'scalp') { sfx.shing(); state.slowmo = 0.5; }

  else if (it.type === 'wisp' || it.type === 'warden') sfx.heart(); else if (it.type === 'acorn' || CROP_SEEDS.includes(it.type) || it.type === 'bean') sfx.tock(); else sfx.pickup();
  switch (it.type) {
    case 'scalp': inv.scalp = true; showTitle('Stalker Scalp', 'ears and all. what falls on your head bounces off', 'relic', 3.5); break;
    case 'step': {
      inv.step = Math.min(3, inv.step + 1);
      const R = RELICS.step;
      showTitle(`${R.name}${inv.step > 1 ? ' ' + 'I'.repeat(inv.step) : ''}`, R.levels[inv.step - 1], 'relic', 4);
      break;
    }
    case 'silk': case 'horn': {                       // weapon parts: worked into your gear at the bench, not on their own
      const part = it.type + 'part';
      inv.mats[part] = (inv.mats[part] || 0) + 1;
      (inv.recipes = inv.recipes || {})[it.type] = true;
      showTitle(RELICS[it.type].name, `work it into your gear at the camp bench (${inv.mats[part]} in your pack)`, 'relic', 4);
      break;
    }
    case 'lumin': inv.lumin = Math.min(90, inv.lumin + 45); tell('Luminescence. Your light burns brighter, and their flashes can\'t blind you.', 4, 'lumin'); break;
    case 'pepper': inv.food.push('pepper'); tell(`A bog pepper. ${K.eat} to eat: a little vigor, and your marsh fire burns bigger for a while.`, 4, 'pepper'); break;
    case 'turnip': inv.food.push('turnip'); tell(`A turnip. ${K.eat} to eat. Turnips make you sturdier for good.`, 3.5, 'turnip'); break;
    case 'squash': inv.food.push('squash'); tell(`A squash. ${K.eat} to eat: a big meal.`, 3, 'squash'); break;
    case 'berries': inv.food.push('berries'); tell('Mountain berries. A small snack.', 3, 'berries'); break;
    case 'carrot':
      if (inv.food.length < 8) { inv.food.push('carrot'); tell(`A carrot. ${K.eat} to eat and restore vigor.`, 4, 'carrot'); }
      else heal(0.35);
      break;
    case 'slime': inv.slime = 25; tell('Lurker slime coats your blade. Every hit stings harder until it dries.', 4, 'slime'); break;
    case 'wisp': heal(0.2); break;
    case 'warden': deepen('The Warden\'s heart. Your vigor runs deeper.'); break;
    case 'acorn':
      inv.acorns = Math.min(30, inv.acorns + 1);
      if (!inv.sword) state.equip = 'acorn';
      tell(inv.sword ? `Acorn. ${K.swap} swaps to acorns; then ${K.act} throws, and holding it throws harder.` : `Acorn. ${K.act} throws it; hold for a harder throw.`, 4, 'acorn');
      break;
    case 'turnipseed': case 'carrotseed': case 'pepperseed': case 'squashseed': case 'thornseed': case 'emberseed': case 'ironseed': case 'starseed': {
      inv.bag[it.type] = (inv.bag[it.type] || 0) + 1;
      const S = SEEDS[it.type];
      if (S.crop) tell(`${S.name}. Plant them in any patch of rich soil; ${CROP_NAME[S.crop].toLowerCase()} grow.`, 3.5, 'seed-' + S.crop);
      else { say(`${S.name}! ${S.rarity}.`, h.x, h.y - UNIT * 1.1, { key: 'item', life: 3, color: S.color }); say(`Rare seeds grow into materials for your gear. Work them at the camp bench.`, h.x, h.y + UNIT * 1.6, { key: 'seedtip', tip: 'rareseed', life: 5 }); }
      if (it.type === 'starseed' || it.type === 'ironseed') { state.slowmo = 0.4; sfx.shing(); }
      break;
    }
    case 'page': {
      inv.pages++;
      const note = PAGE_NOTES[(inv.pages - 1) % PAGE_NOTES.length];
      say(`A page of Pip's journal: "${note}"`, h.x, h.y - UNIT * 1.3, { key: 'page', life: 6, color: '#fff3c8' });
      const lore = PAGE_LORE[(inv.pages - 1) % PAGE_NOTES.length];
      if (lore && hearRecipe(lore)) say(`That gives you an idea for the mat: ${OUT_NAME[lore]}.`, h.x, h.y + UNIT * 1.2, { key: 'lore', life: 4, color: '#c9a2ff' });
      break;
    }
    case 'journal':
      inv.journal = 3; sfx.victory();
      showTitle('Pip\'s Journal', 'every map Pip ever drew. Open Map in your menu, then bring it home', 'relic', 5);
      break;
    case 'letter':
      say('A letter, weighted with a pipe: "If you\'re reading this, you found my shack. Don\'t mind the smell. The pool downriver has fish as big as boots, so I lashed four logs of driftwood with thorn twine and went. The old jetty on the near bank still holds. Take the seeds, they\'ll only go to waste. Mind the rapids. Old Wick."', h.x, h.y - UNIT * 1.3, { key: 'letter', life: 10, color: '#fff3c8' });
      break;
    case 'stick': case 'stone': case 'fluff':
      rawOf()[it.type] = (rawOf()[it.type] || 0) + 1;
      say(`+1 ${RAW[it.type].toLowerCase()} (${rawOf()[it.type]})`, h.x, h.y - UNIT * 1.1, { key: 'raw' + it.type, life: 1.4, color: '#ffe38a' });
      break;
    case 'driftwood': inv.mats.driftwood++; say(`+1 driftwood (${inv.mats.driftwood})`, h.x, h.y - UNIT * 1.1, { key: 'matdrift', life: 1.8, color: '#ffe38a' }); break;
    case 'rod': inv.rod = true; showTitle('Old Wick\'s fishing rod', `stand by a ripple and press ${K.act} to cast`, 'relic', 3.5); break;
    case 'fish': inv.food.push('fish'); tell(`A gleaming fish! ${K.eat} to eat: vigor now, and more of it for a while.`, 4, 'fish'); break;
    case 'recipe_temper': learnRecipe('temper', 'A smith\'s scrap, half eaten by damp.'); break;
    case 'recipe_star': learnRecipe('star', 'Carved on the shrine stone.'); break;
    case 'spores7': inv.spores += 7; if (inv.pipSaved) say('+7 spores', h.x, h.y - UNIT * 1.1, { key: 'item', life: 2, color: '#e8d8ff' }); break;   // silent until Pip explains them
    case 'spore': inv.spores++; if (inv.pipSaved) say(`+1 spore (${inv.spores})`, h.x, h.y - UNIT * 1.1, { key: 'spore', life: 1.2, color: '#e8d8ff' }); break;
    case 'ear': case 'hide':
      inv.mats[it.type]++;
      say(`+1 ${MATS[it.type]} (ears ${inv.mats.ear}, hide ${inv.mats.hide})`, h.x, h.y - UNIT * 1.1, { key: 'mat' + it.type, life: 2, color: '#ffe38a' });
      if (!inv.recipes.cap && !inv.scalp) setTimeout(() => learnRecipe('cap', 'Those ears would make a fine cap, with a scrap of hide to hold them.'), 0);
      break;
    case 'thorn': case 'ember': case 'ironwood': case 'starpetal': inv.mats[it.type]++;
      if (it.type === 'thorn' && !inv.recipes.edge) setTimeout(() => learnRecipe('edge', 'You test a thorn on your thumb. Sharp. It could hone a blade.'), 0); say(`+1 ${MATS[it.type]}`, h.x, h.y - UNIT * 1.1, { key: 'mat' + it.type, life: 1.6, color: '#ffe38a' }); break;
    case 'bean':
      inv.beans++;
      say(inv.beans >= BEANS ? `All ${BEANS} beans! Back to the toad.` : `Bean ${inv.beans} of ${BEANS}`, h.x, h.y - UNIT * 1.1, { key: 'item', life: 2.5 });
      break;
  }
  refreshButtons();
}
