// ===== cutscenes.js: Scripted moments: dusk and the lantern, the abduction, the sword reveal, the toad, the rescue, the ending, the warden talk.
// in the woods, right before the sword: the gremlins take Pip, and the journal with them
function startDusk() { state.cut = { type: 'dusk', t: 0, step: 0 }; }
function startAbduct() {
  const p = state.pip;
  state.cut = { type: 'abduct', t: 0, step: 0 };
  p.bound = 0;
  const hole = sceneDef().feat.hole || [1.02, p.y / H];
  state.gremlins = [0, 1, 2].map(i => ({ x: hole[0] * W, y: hole[1] * H + (i - 1) * UNIT * 0.3, show: true }));
  state.cam.focus = null;                              // no close-up: you're free to run at them
}
function startAmbush() {
  const f = WORLD.start.feat.pip;
  state.cut = { type: 'ambush', t: 0, step: 0 };
  state.pip = { x: f[0] * W, y: f[1] * H, show: true, bound: 0 };
  state.gremlins = [0, 1, 2].map(i => ({ x: W + UNIT * (1 + i), y: f[1] * H + (i - 1) * UNIT * 1.4, show: true }));
  state.cam.focus = { z: 1.2, at: () => [W * 0.75, f[1] * H] };
}
// The blade comes out slowly: the old stump rumbles and cracks, light leaks out of it, the blade rises rust and all
// with a line of light running up it, and only then is it yours: a leap, rays, the title.
function startSwordCut() {
  const h = state.hero, sw = sceneDef().feat.sword || [h.x / W, h.y / H];
  state.dusk = false;
  state.cut = { type: 'sword', t: 0, step: 0, landed: false, titled: false, sx: sw[0] * W, sy: sw[1] * H };
  h.vx = 0; h.vy = 0;
  sfx.strain(); state.shake = 0.25;
  state.cam.focus = { z: 1.7, at: () => [state.cut && state.cut.type === 'sword' && !state.inv.sword ? state.cut.sx : state.hero.x, (state.cut && state.cut.type === 'sword' && !state.inv.sword ? state.cut.sy : state.hero.y) - UNIT] };
}
function startToadCut() {
  const n = sceneDef().npcs.find(o => o.kind === 'toad');
  state.cut = { type: 'toad', t: 0, n, step: 0 };
  state.cam.focus = { z: 1.25, at: () => npcPos(n) };
}
function startRescue() {
  const inv = state.inv;
  inv.pipSaved = true;
  sfx.victory(); zoomPulse(state.hero.x, state.hero.y, 'boss');
  setTimeout(() => { transitionTo('camp', 0.5, 0.58); setTimeout(() => say('Pip wants a word by the fire.', state.hero.x, state.hero.y - UNIT * 1.3, { key: 'npc', life: 4 }), 0); }, 0);
}
function startEnding() {
  state.won = true;
  sfx.victory();
  const h = state.hero;
  zoomPulse(h.x, h.y, 'boss');
  showTitle('To be continued', TOUCH ? 'tap to begin a new adventure' : 'press R to begin a new adventure', 'end', 9999);
}
function updateCut(dt) {
  const c = state.cut, h = state.hero;
  const at = (t) => c.t >= t && c.step < t * 10 + 1 && (c.step = t * 10 + 1);
  if (heldText()) return;                              // a line is waiting to be read: the scene holds for it
  c.t += dt;
  if (false) {
  } else if (c.type === 'dusk') {                       // later that day: twilight in the lean-to, and Pip can't sit still
    const p = state.pip;
    if (at(0.1)) { state.fadeTarget = 1; state.fadeRate = 3; }
    if (at(1.2)) {
      state.dusk = true; enterScene('tentin', 0.4, 0.62); state.fadeTarget = 0;
      state.pip = { x: W * 0.58, y: H * 0.55, show: true, follow: true, side: -1 }; state.hero.fx = 1; state.hero.fy = 0; state.hero.side = 1;
    }
    const q = state.pip;
    if (at(2.2)) say('...and THAT\'S why we cannot wait until tomorrow!', q.x, q.y - UNIT * 1.3, { key: 'npc', life: 2.8 });
    if (at(5.2)) say('There is just enough light left to finish the map of the forest.', q.x, q.y - UNIT * 1.3, { key: 'npc', life: 3 });
    if (at(8.4)) say('Grab the lantern by my bed. Come on, come ON!', q.x, q.y - UNIT * 1.3, { key: 'npc', life: 2.4, who: 'pip', hold: false, color: '#bfe4ff' });
    if (c.t > 10.6 && c.t < 11.6) q.y += UNIT * 4 * dt;
    if (at(9.4) && !state.inv.lantern && !state.items.some(i => i.type === 'lantern')) { const lb = WORLD.tentin.feat.bedroll; state.items.push({ type: 'lantern', x: (lb[0] + 0.06) * W, y: (lb[1] + 0.1) * H }); }   // it's there on the floor by the bedroll
    if (at(11.6)) { state.cut = null; state.inv.story = STORY.adventure; q.show = false; }
  } else if (c.type === 'abduct') {                    // you can run at them the whole time; they hop clear at the last moment, every time
    const p = state.pip, gs = state.gremlins;
    const hole = sceneDef().feat.hole || [1.02, p.y / H], hx = hole[0] * W, hy = hole[1] * H;
    { const v = inputVector(), sp = L() * sceneDef().speed * dt;           // your legs still work
      if (v.x || v.y) { h.x += v.x * sp; h.y += v.y * sp; h.fx = v.x; h.fy = v.y; h.side = v.x ? Math.sign(v.x) : h.side; }
      h.vx = v.x * sp / Math.max(dt, 1e-6); h.vy = v.y * sp / Math.max(dt, 1e-6); collideSolids(h, UNIT * 0.38); clampTo(h, UNIT * 0.5); }
    const hop = c.hop;
    if (hop) {                                                             // mid-hop: an arc to the new spot
      const k = Math.min(1, (c.t - hop.t0) / 0.3), lift = Math.sin(k * Math.PI) * UNIT * 1.1;
      const mv = o => { o.x = o.hx0 + (o.hx1 - o.hx0) * k; o.y = o.hy0 + (o.hy1 - o.hy0) * k; o.hz = lift; };
      mv(p); gs.forEach(mv);
      if (k >= 1) { c.hop = null; p.hz = 0; gs.forEach(g => { g.hz = 0; }); }
    } else if (!c.gone && c.t > 0.3 && Math.hypot(h.x - p.x, h.y - p.y) < UNIT * 1.6) {   // too close: away they spring
      const ax = p.x - h.x, ay = p.y - h.y, al = Math.hypot(ax, ay) || 1, tx = hx - p.x, ty = hy - p.y, tl = Math.hypot(tx, ty) || 1;
      let dx = ax / al * 0.7 + tx / tl * 0.5, dy = ay / al * 0.7 + ty / tl * 0.5; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const jump = UNIT * (3.2 + Math.random() * 0.8), nx = Math.max(UNIT, Math.min(W - UNIT * 0.6, p.x + dx * jump)), ny = Math.max(UNIT, Math.min(H - UNIT, p.y + dy * jump));
      c.hop = { t0: c.t }; p.hx0 = p.x; p.hy0 = p.y; p.hx1 = nx; p.hy1 = ny;
      gs.forEach(g => { g.hx0 = g.x; g.hy0 = g.y; g.hx1 = nx + (g.x - p.x); g.hy1 = ny + (g.y - p.y); });
      sfx.cackle(); spark(p.x, p.y + UNIT * 0.3, '#8a7a5a', 6, 2);
      if (!c.jeer) { c.jeer = true; say(c.t < 2.3 ? 'Hee hee! Too slow!' : 'Nyah! Can\'t catch us!', p.x, p.y - UNIT * 1.6, { key: 'npc', hold: false, life: 1.6, color: '#b8e08a' }); }
    }
    if (at(0.3)) say('The map\'s nearly... hey. What\'s that weird little hole?', p.x, p.y - UNIT * 1.3, { key: 'npc', life: 2.4, hold: false });
    if (at(1.2)) setMusic('sinister');
    if (!c.hop && c.t > 1.4 && c.t < 2.4) gs.forEach((g, i) => { g.x += (p.x + (i - 1) * UNIT * 0.8 - g.x) * (1 - Math.exp(-6 * dt)); g.y += (p.y + (i - 1) * UNIT * 0.6 - g.y) * (1 - Math.exp(-6 * dt)); });
    if (at(1.6)) { sfx.cackle(); state.shake = 0.3; }
    if (at(2.3)) { p.bound = 1; sfx.rustle(); say('Hey! Let go! HELP! That\'s my journal!', p.x, p.y - UNIT * 1.3, { key: 'npc', life: 2.2, hold: false }); zoomPulse(p.x, p.y, 'parry'); gs[1].book = true; }
    if (!c.hop && !c.gone && c.t > 3.2) {                // dragged to the hole, and down it (however many hops it takes)
      const dx = hx - p.x, dy = hy - p.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(d, UNIT * 5 * dt);
      p.x += dx / d * sp; p.y += dy / d * sp; gs.forEach((g, i) => { g.x += (p.x + (i - 1) * UNIT * 0.5 - g.x) * 0.2; g.y += (p.y + (i - 1) * UNIT * 0.4 - g.y) * 0.2; });
      if (d < UNIT * 0.4) { c.gone = c.t; p.show = false; gs.forEach(g => { g.show = false; }); sfx.cackle(); }
    }
    if ((c.gone && c.t > c.gone + 0.3) || c.t > 11) {
      p.show = false; p.follow = false; p.hz = 0; state.gremlins = null; state.cam.focus = null; state.cut = null;
      state.inv.pipTaken = true;
      say('Down the hole! It\'s too small to follow. Smash it open with a rock!', h.x, h.y - UNIT * 1.2, { key: 'npc', life: 3.5 });
    }
  } else if (c.type === 'ambush') {
    const p = state.pip, gs = state.gremlins, rt = rtFor('start');
    if (at(0.4)) say('Come on, slowpoke! The woods are right...', p.x, p.y - UNIT * 1.3, { key: 'npc', life: 2 });
    if (c.t > 2 && c.t < 3) gs.forEach((g, i) => { g.x += (p.x + (i - 1) * UNIT * 0.8 - g.x) * (1 - Math.exp(-6 * dt)); g.y += (p.y + (i - 1) * UNIT * 0.6 - g.y) * (1 - Math.exp(-6 * dt)); });
    if (at(1.6)) setMusic('sinister');
    if (at(2.1)) { sfx.cackle(); state.shake = 0.3; }
    if (at(2.8)) { p.bound = 1; sfx.rustle(); say('Hey! Let go! HELP! That\'s my journal!', p.x, p.y - UNIT * 1.3, { key: 'npc', life: 2.2 }); zoomPulse(p.x, p.y, 'parry'); gs[1].book = true; }
    if (c.t > 3.8 && c.t < 5.5) { p.x += UNIT * 5 * dt; gs.forEach((g, i) => { if (i < 2) g.x += UNIT * 5 * dt; }); }
    if (c.t > 4.2 && c.t < 5.4) { const g = gs[2]; g.x += (W * 0.95 - g.x) * (1 - Math.exp(-4 * dt)); }
    if (at(5.5)) { rt.flags.ambush = true; refreshSceneGeometry(); sfx.crash(); state.shake = 0.4; zoomPulse(W * 0.95, H * 0.5, 'kill'); sfx.cackle(); }
    if (c.t > 5.5) gs[2].x += UNIT * 6 * dt;
    if (at(7)) {
      p.show = false; state.gremlins = null; state.cam.focus = null; state.cut = null;
      say('The gremlins piled thorns behind Pip. You need a way through.', h.x, h.y - UNIT * 1.2, { key: 'npc', life: 4 });
    }
  } else if (c.type === 'sword') {
    const R0 = 1.5, TAKE = 3.1, a = TAKE + 0.1, b = TAKE + 1.2;
    if (c.t < TAKE) {                                   // the stump gives it up: rumble, moss and bark, light through the cracks
      if (Math.random() < 0.35) state.shake = Math.max(state.shake, 0.06 + 0.08 * c.t / TAKE);
      if (Math.random() < 0.4) state.fx.push({ x: c.sx + (Math.random() - 0.5) * UNIT, y: c.sy - UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 2, vy: -UNIT * (0.5 + Math.random() * 1.5), t: 0, life: 0.8, color: Math.random() < 0.5 ? '#5a7a3a' : '#5a4128', size: UNIT * 0.08 });
      if (c.t > R0 && Math.random() < 0.3) state.fx.push({ x: c.sx + (Math.random() - 0.5) * UNIT * 0.2, y: c.sy - UNIT * (0.4 + (c.t - R0) / (TAKE - R0) * 1.3), vx: (Math.random() - 0.5) * UNIT * 0.6, vy: UNIT * 0.8, t: 0, life: 0.9, color: '#8a4a2a', size: UNIT * 0.05 });   // rust flakes
    }
    if (at(0.6)) sfx.crash();
    if (at(1.5)) sfx.hum && sfx.hum();
    if (at(2.4)) { sfx.shing(); state.flash = 0.25; }
    if (at(TAKE)) { state.inv.sword = true; sfx.fanfare(); zoomPulse(h.x, h.y, 'boss'); state.flash = 0.5; }
    h.z = c.t > a && c.t < b ? Math.sin(Math.PI * (c.t - a) / (b - a)) * UNIT * 2.6 : 0;
    if (c.t > a && c.t < b && Math.random() < 0.6) spark(h.x, h.y - h.z - UNIT, '#fff3c0', 1, 2);
    if (!c.landed && c.t >= b) { c.landed = true; h.z = 0; sfx.land(); state.shake = 0.35; zoomPulse(h.x, h.y, 'land'); spark(h.x, h.y + UNIT * 0.4, '#8a7a5a', 16, 3.5); }
    if (!c.titled && c.t >= b + 0.2) { c.titled = true; sfx.flash(); showTitle('The Blade', 'rusted, waiting, and yours', 'herald', 3.6); }
    if (c.t >= b + 2.2) state.cam.focus = null;
    if (c.t >= b + 2.6) { state.cut = null; say(`Tap ${K.act} to slash. Hold and release to stab.`, h.x, h.y - UNIT * 1.2, { key: 'tip', life: 5, tip: 'sword' }); }
  } else if (c.type === 'toad') {
    const [tx, ty] = npcPos(c.n);
    if (at(0.2)) sfx.munch();
    if (at(0.9)) sfx.munch();
    if (at(1.6)) sfx.munch();
    c.swell = c.t < 2 ? 0 : c.t < 3.2 ? (c.t - 2) / 1.2 : Math.max(0, 1 - (c.t - 3.2) * 1.5);
    if (at(3.2)) { sfx.burp(); state.shake = 0.3; zoomPulse(tx, ty, 'parry'); }
    if (c.t > 3.2 && c.t < 4.6) for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28, sp = UNIT * rr(1.5, 3.5); spawnPuff(tx, ty, Math.cos(a) * sp, Math.sin(a) * sp, UNIT * rr(0.9, 1.4)); }
    if (at(5.4)) { sfx.spark(); state.spark = { x: tx + UNIT, y: ty, t: state.time + 0.1 }; }
    if (at(6)) zoomPulse(tx, ty, 'boss');
    if (at(8)) say('That, friend, is marsh fire.', tx, ty - UNIT * 1.4, { key: 'npc', life: 3 });
    if (at(11)) {
      state.inv.fire = true; refreshButtons(); state.cam.focus = null; state.cut = null;
      state.items.push({ type: 'emberseed', x: tx + UNIT * 1.2, y: ty + UNIT });
      showTitle('Marsh Fire', `hold ${K.fire} to breathe it out, let go to light it`, 'area', 3.5);
      say('Doesn\'t care much for wind, mind. Come back and see me once you\'ve grown some embers. I know a trick.', tx, ty - UNIT * 1.4, { key: 'npc', life: 5 });
    }
  } else if (c.type === 'raft') {
    // drift along the river to the edge of the screen, then the rapids take over
    const pts = c.pts, seg = pts.length - 1, p = Math.min(1, c.t / 3.2) * seg, i2 = Math.min(seg - 1, Math.floor(p)), u = p - i2;
    h.x = (pts[i2][0] + (pts[i2 + 1][0] - pts[i2][0]) * u) * W; h.y = (pts[i2][1] + (pts[i2 + 1][1] - pts[i2][1]) * u) * H;
    h.x = Math.max(UNIT, Math.min(W - UNIT, h.x)); h.y = Math.max(UNIT, Math.min(H - UNIT, h.y));
    if (Math.random() < 0.4) spark(h.x, h.y + UNIT * 0.4, 'rgba(210,235,245,.8)', 1, 2);
    if (at(0.4)) say('The current takes the raft...', h.x, h.y - UNIT * 1.4, { key: 'npc', life: 2.5, hold: false });
    if (at(3.4)) { sfx.whoosh(); sfx.crash(); state.shake = 0.8; state.flash = 0.4; say('Rapids!', h.x, h.y - UNIT * 1.4, { key: 'npc', life: 1.5, color: '#ffe38a', hold: false }); }
    if (at(4.2)) { state.cut = null; state.cam.focus = null; transitionTo('rapids', 0.5, RAPIDS.raftY, true); }
  } else if (c.type === 'warden') {
    updateWardenTalk(c, dt);
  } else if (c.type === 'faint') {
    if (c.t > 1.3 && !c.moved) {
      c.moved = true;
      h.vig = maxVig();
      const e = state.entry, sc0 = sceneDef();
      const resume = (sc0.chasms && sc0.chasms.length) || sc0.river || sc0.rocks ? h.safe : null;
      if (resume && sc0.id === e.id) { h.x = resume[0] * W; h.y = resume[1] * H; state.enemies.forEach(en => { if (!en.dead && Math.hypot(en.x - h.x, en.y - h.y) < UNIT * 4) { en.x += (en.x - h.x) * 0.8; } }); }
      else enterScene(e.id, e.fx, e.fy);
      state.fadeTarget = 0;
      sayHero('You come to, a little wiser.');
    }
    if (c.t > 2.2) state.cut = null;
  }
}

// ---------------- the Falls Warden has had a day ----------------
function startWardenTalk(e) {
  state.cut = { type: 'warden', t: 0, e, i: -1, wait: 0 };
  sfx.roar(); state.shake = 0.7; zoomPulse(e.x, e.y, 'boss');
  state.cam.focus = { z: 1.3, at: () => [e.x, e.y] };
  say('The Falls Warden', e.x, e.y - e.r - UNIT * 1.8, { key: 'bosstitle', life: 3, size: 1.5, color: '#9fd4ff' });
}
const WARDEN_LINES = [
  'WHO GOES THERE? ANOTHER ONE?! AFTER MY SPORES, ARE YOU?',
  'First that crusty old TORTOISE comes by to lecture me about PATIENCE.',
  'Then that bloated TOAD fills my whole waterfall with his... his FUMES!',
  'I have had IT with swamp creatures. So tell me, and tell me true.',
];
function updateWardenTalk(c, dt) {
  const e = c.e;
  c.wait -= dt;
  if (c.i < WARDEN_LINES.length && (c.wait <= 0 || pressedNow.act)) {
    c.i++; c.wait = 2.6;
    if (c.i < WARDEN_LINES.length) { sfx.growl(); state.shake = 0.15; say(WARDEN_LINES[c.i], e.x, e.y - e.r - UNIT * 0.6, { key: 'npc', life: 99, color: '#d8ecff' }); }
    else {
      unsay('npc');
      ask('Do you like BEANS?', e.x, e.y - e.r - UNIT * 0.6, ['Yes', 'No'], sel => {
        const line = sel === 0 ? 'THEN YOU\'LL SMELL JUST LIKE THAT OTHER SWAMP CREATURE! RRRAAAH!' : 'BAH! SKIN AND BONES! YOU NEED TO EAT MORE PROTEIN!';
        say(line, e.x, e.y - e.r - UNIT * 0.6, { key: 'npc', life: 3, color: '#ffb0a0' });
        sfx.roar(); state.shake = 0.8; zoomPulse(e.x, e.y, 'boss');
        setMusic('boss');
        state.cam.focus = null; state.cut = null;
        const h = state.hero, dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1;
        e.mode = 'charge'; e.t = 1.1; e.vx = dx / d * 0.95 * L(); e.vy = dy / d * 0.95 * L();   // straight at you
      });
      state.choice.must = true;
    }
  }
}
