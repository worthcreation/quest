// ===== engine.js: The game loop: update(), enterScene, movement and physics, jumps, wind, ravines, rides, resetRun/newGame.

// =====================================================================
// Scenes: entering, leaving, geometry
// =====================================================================
const sceneDef = () => WORLD[state.scene];

function refreshSceneGeometry() {
  const sc = sceneDef();
  if (!sc) return;
  const rt = rtFor(sc.id);
  const F = { cavewall: 0.95, boulder: 0.95, pillar: 0.95, stalagmite: 0.8, shroom: 0.7, stone: 1, log: 1, wall: 1, bed: 1, table: 1, stove: 1, cliff: 1, cairn: 1, mirror: 1, chest: 1, lectern: 1, burrow: 1, cracked: 0.95, crag: 1.15, crate: 0.9, barrel: 0.85, stump: 1, campfire: 1, tent: 0.9, bramble: 1, reeds: 1, web: 1, vine: 1 };
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
  if (bar === 'cave') { say('The great stone falls to pieces: a cave, going deep into the hill!', state.hero.x, state.hero.y - UNIT, { key: 'burrow', life: 3.5 }); }
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
  if (id === 'hr3' && !state.inv.sawHighTitle) { state.inv.sawHighTitle = true; state.highTitle = { t: 0 }; }   // above the clouds for the first time
  state.grab = null; state.vistaBirds = [];
  state.pipGone = null;                              // Pip is wherever the new screen puts him
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
  if (id === 'w3' && state.inv.pipTaken && !state.inv.pipSaved && !rt.flags.cave && !state.inv.caveTold) { state.inv.caveTold = true; setTimeout(() => say('They squeezed past that big stone. Break it! Big ones take a few hits.', state.hero.x, state.hero.y - UNIT * 1.2, { key: 'npc', life: 3.5, hold: false }), 0); }
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
  const night = state.dusk && ['camp', 'tentin', 'start', 'meadow', 'riverbank'].includes(id);   // after camp's set up: twilight around home
  setMusic(bossAlive ? 'cave2' : tense ? 'sinister' : night ? 'twilight' : sc.music);
  setAmbience(night ? 'night' : sc.amb);
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
    if (along < ex.a - 0.04 || along > ex.b + 0.04) continue;   // only through the opening itself, not anywhere along that edge
    if (ex.locked && ex.locked()) return;
    if (Array.isArray(ex.arrive)) { transitionTo(ex.to, ex.arrive[0], ex.arrive[1], true); return; }   // doors put you back at the door
    if (ex.arrive === 'sinkhole') {
      const s = WORLD[ex.to].feat.cave;
      transitionTo(ex.to, s[0] - 2.6 * UNIT / W, s[1], true);   // back out of the cave mouth
      if (ex.say) setTimeout(() => say(ex.say, state.hero.x, state.hero.y - UNIT, { key: 'climb', life: 2.5 }), 0);
      return;
    }
    let al = Math.max(0.05, Math.min(0.95, along));
    { const back = (WORLD[ex.to].exits || []).find(b => b.side === OPP[ex.side] && b.to === state.scene); if (back && (al < back.a || al > back.b)) al = (back.a + back.b) / 2; }   // a diagonal step: come in at the far scene's own opening
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
  if (pressedNow.act && !state.radial && !state.menu) state.lastSlot = 'f';   // R's wheel opens on the key you last used
  coachUpdate();
  if (!state.menu) { updateBeetle(dt); updateTaunter(dt); }                                     // coached steps move on as you do them, menus included
  if (state.dusk && !state.menu && (!state.nightT || state.time > state.nightT)) {   // crickets, and now and then an owl
    state.nightT = state.time + 0.35 + Math.random() * 0.9;
    if (Math.random() < 0.06) sfx.owl((Math.random() - 0.5) * 1.4); else sfx.cricket((Math.random() - 0.5) * 1.6);
  }
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
  if (amb && amb.type === 'night') ambLevel(0.025);
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
    if (state.forceInteract) { state.forceInteract = false; if (state.cropFree) interact(); }
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
  if (state.time - h.rest > 1.2 && h.vig < mv) h.vig = Math.min(mv, h.vig + (0.45 + mv * 0.05) * 0.55 * (inv.squashBuff > 0 ? 2 : 1) * dt);   // slow on its own (build 114): food and friends are the quick way

  // movement
  const locked = h.stun > 0 || state.busy || state.pull.grip || h.ride || h.falling > 0 || (state.fish && !pressedNow.left && !pressedNow.right && !pressedNow.up && !pressedNow.down);
  if (h.ride && !h.ride.hop && pressedNow.act && h.z > UNIT * 0.3 && h.vig >= 0.8 && !state.carry) {   // stomp out of a gust
    h.ride = null; h.vx = 0; h.vy = 0; h.vz = 0; h.airDist = 99 * UNIT; state.cam.focus = null;
  }
  if (updateGrab(dt)) { /* carried by a hawk */ }
  else if (h.ride) updateRide(dt);
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
  if (!h.ride) { collideSolids(h, UNIT * 0.42); clampTo(h, UNIT * 0.5); clampCorridor(h, UNIT * 0.42); }
  h.stun -= dt; h.invuln -= dt; h.dashCool -= dt;
  updateJump(dt);

  if ((sc.chasms || sc.river || sc.deep) && !h.ride && h.falling <= 0 && h.dashT <= 0 && h.z <= 0) {
    if (isChasm(h.x, h.y)) { h.falling = 0.8; h.vx = 0; h.vy = 0; h.fallKind = sc.deep ? 'deep' : sc.river ? 'water' : 'pit'; if (sc.river || sc.deep) sfx.splash(); else sfx.plummet(); }
    else if (!isChasm(h.x, h.y, UNIT * 1.2)) h.safe = [h.x / W, h.y / H];
    else if (h.z <= 0 && (onRock(sc, h.x, h.y, UNIT * 0.4) || (sc.river && sc.river.stones && sc.river.stones.some(s => Math.hypot(h.x - s[0] * W, h.y - s[1] * H) < UNIT * 0.4)))) h.safe = [h.x / W, h.y / H];
  }

  if (!state.busy && !h.ride && h.falling <= 0) { checkEdges(); updateFeatures(dt); }
  if (!state.busy) {                                    // each part guarded: one creature's bug can't stop you moving
    for (const [name, f] of [['enemies', updateEnemies], ['hazards', updateHazards], ['shots', updateShots]]) {
      try { f(dt); } catch (err) { if (!(update.bad || (update.bad = {}))[name]) { update.bad[name] = true; console.error('update ' + name + ' failed (game continues):', err); }
        if (name === 'enemies') state.enemies = state.enemies.filter(e => e && isFinite(e.x) && isFinite(e.y)).map(e => { if (!e.mode) e.mode = 'idle'; return e; }); }
    }
    updatePlates(false);
  }

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

// on the mountain path the sides are rock: keep to the way
function clampCorridor(a, r, bothSides = false) {
  const sc = sceneDef(); if (!sc || !sc.corridor) return false;
  const rock = sc.corridor.rock || 'B', [l, rt] = corridorSpan(sc, a.y / H), x0 = l * W + r, x1 = rt * W - r;
  if (onIsland(sc, a.x / W, a.y / H)) return false;
  if (x0 > x1) { a.x = (l + rt) / 2 * W; return true; }
  if (a.x < x0 && (bothSides || rock !== 'R')) { a.x = x0; a.vx = Math.max(0, a.vx || 0); return true; }   // the rock stops you; the drop doesn't
  if (a.x > x1 && (bothSides || rock !== 'L')) { a.x = x1; a.vx = Math.min(0, a.vx || 0); return true; }
  return false;
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
    if (a.type === 'gremlin' && ((o.kind === 'wedge' && !o.small) || o.gap)) continue;   // gremlins slip through gaps you can't
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
  if (sc.corridor && sc.corridor.rock && !onIsland(sc, fx, fy)) { const [l, rt] = corridorSpan(sc, fy); if (sc.corridor.rock === 'L' ? fx > rt + px : fx < l - px) return true; }   // off the edge
  return sc.chasms.some(c => { const [x0, y0, x1, y1] = c; if (sc.vista) return fx > x0 - px && fx < x1 + px && fy > y0 - py && fy < y1 + py;
    const [a0, a1] = chasmSpan(c, x0 === 0 && x1 === 1 || (x1 - x0) >= (y1 - y0) ? fx : fy);
    return (x1 - x0) >= (y1 - y0) ? fx > x0 - px && fx < x1 + px && fy > a0 - py && fy < a1 + py : fy > y0 - py && fy < y1 + py && fx > a0 - px && fx < a1 + px; });
}
// a ravine's edges wander: broken, irregular lips (up to about a third of a tile either way), the same for walking and
// for drawing. For a wide ravine the top and bottom edges wander along x; for a tall one the sides wander along y.
function chasmSpan([x0, y0, x1, y1], t) {
  const wide = (x1 - x0) >= (y1 - y0), s = x0 * 13.1 + y0 * 7.3 + x1 * 3.7, amp = 0.34 * UNIT / (wide ? H : W);
  const n = k => (Math.sin(t * 23 + s + k) * 0.55 + Math.sin(t * 61 + s * 2 + k * 3) * 0.3 + Math.sin(t * 131 + k * 5) * 0.15);
  const lo = wide ? y0 : x0, hi = wide ? y1 : x1;
  return [lo > 0.001 ? lo + amp * n(1) : lo, hi < 0.999 ? hi + amp * n(2) : hi];
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
  if (f.cave) {                                          // the cave mouth: heaped with boulders until you break the loose one
    const sx = f.cave[0] * W, sy = f.cave[1] * H, d = Math.hypot(h.x - sx, h.y - sy), open = !!rt.flags.cave;
    if (!open && d < UNIT * 5) say('A great stone over something dark. They squeezed through the gap beside it.', sx, sy - UNIT * 2.6, { key: 'cave', tip: 'cave' });
    if (open && d < UNIT * 0.8) { say('Into the dark...', h.x, h.y - UNIT, { key: 'fall' }); sfx.fall(); zoomPulse(sx, sy, 'land'); transitionTo('c1', 0.08, 0.5); }
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
    const cs = corridorSpan(sc, (c[1] + c[3]) / 2), m = UNIT * 0.7 / W;
    let lo = Math.max(0.2, c[0] + 0.08), hi = Math.min(0.8, c[2] - 0.08);
    if (sc.corridor) { lo = Math.max(c[0] + 0.02, cs[0] + m); hi = Math.min(c[2] - 0.02, cs[1] - m); if (lo > hi) lo = hi = (cs[0] + cs[1]) / 2; }   // on the mountain path: the rocks stand on the way itself
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
