
// =====================================================================
// Interacting: talk, rest at the fire, farm, lift the loose rock
// =====================================================================
function npcPos(n) { return [n.fx * W, n.fy * H]; }
function npcHere(n) { return n.kind !== 'pip' || (n.home ? state.inv.pipSaved : !state.inv.pipSaved); }
function interact() {
  const sc = sceneDef(), h = state.hero, rt = rtFor(sc.id);
  if (state.npcTalk) {
    if (pressedNow.act) advanceTalk();
    return true;
  }
  if (state.carry) return false;                    // hands full: F belongs to the rock
  if (pressedNow.act && pickUpHere()) return true;  // something at your feet: F picks it up (it sparkles harder as you near it)
  if (sc.feat.mirror && pressedNow.act && Math.hypot(h.x - sc.feat.mirror[0] * W, h.y - sc.feat.mirror[1] * H) < UNIT * 1.8) { state.menu = { view: 'poses', sel: 0, note: '' }; sfx.tock(); return true; }
  for (const q of sc.feat.portals || []) if (pressedNow.act && Math.hypot(h.x - q.fx * W, h.y - q.fy * H) < UNIT * 1.6) {
    if (q.pid.startsWith('zone:')) enterZone(q.pid.slice(5)); else enterPuzzle(PUZZLES.find(p => p.id === q.pid));
    return true;
  }
  if (state.fish) return true;                      // fishing has the hands
  if (riverSideQuest(sc, h)) return true;
  const nearPull = sc.pullables.some(p => !rt.pulled.has(p.id) && Math.hypot(h.x - p.fx * W, h.y - p.fy * H) < UNIT * 1.8);
  if (sc.feat.shroom) {
    const [mx, my] = sc.feat.shroom, d = Math.hypot(h.x - mx * W, h.y - my * H);
    if (d < UNIT * 2.3 && !state.inv.shrooms[sc.id]) {
      state.inv.shrooms[sc.id] = true;
      (state.shroomWoke = state.shroomWoke || {})[sc.id] = state.time;
      sfx.spores();
      for (let i = 0; i < 12; i++) state.fx.push({ x: mx * W + (Math.random() - 0.5) * UNIT, y: my * H - UNIT * 1.2, vx: (Math.random() - 0.5) * UNIT * 0.8, vy: -UNIT * (0.2 + Math.random() * 0.4), t: 0, life: 3, color: '#e8d8ff' });   // a few spores drift up, slowly
      if (state.inv.pipSaved) {
        showTitle('Traveler\'s Mushroom', `its spores will remember ${SHROOM_NAMES[sc.id]}`, 'relic', 3.5);
        say(`${K.act} at any mushroom you've found to travel between them.`, mx * W, my * H - UNIT * 1.6, { key: 'shroom', tip: 'shroom', life: 5 });
      } else if (!state.intro) say('A giant mushroom, glowing faintly.', mx * W, my * H - UNIT * 2, { key: 'shroom', life: 2.5 });
    }
    // found mushrooms grow spores over time; walk up to gather them
    if (d < UNIT * 2.3 && state.inv.shrooms[sc.id]) {
      const inv = state.inv, last = inv.sporeAt[sc.id] ?? state.playTime, ready = Math.min(3, Math.floor((state.playTime - last) / SPORE_TIME));
      if (inv.sporeAt[sc.id] == null) inv.sporeAt[sc.id] = state.playTime - SPORE_TIME;
      else if (ready > 0) {
        inv.spores += ready; inv.sporeAt[sc.id] = Math.max(last + ready * SPORE_TIME, state.playTime - SPORE_TIME * 2);
        if (inv.pipSaved) {
          sfx.spores(); say(`+${ready} spore${ready > 1 ? 's' : ''} (${inv.spores})`, mx * W, my * H - UNIT * 2, { key: 'spore', life: 2, color: '#e8d8ff' });
          say('Mushroom travel costs spores: the farther the jump, the more it takes.', mx * W, my * H + UNIT * 1.6, { key: 'sporetip', tip: 'spores', life: 4.5 });
        }
      }
    }
    if (d < UNIT * 1.9 && pressedNow.act && !state.inv.pipSaved) { say('It hums softly. You have no idea what to do with it.', mx * W, my * H - UNIT * 1.8, { key: 'shroom', life: 2.5 }); return true; }
    if (d < UNIT * 1.9 && pressedNow.act) {
      const dest = travelOptions(sc.id);
      if (!dest.length) say('No other mushrooms found yet. Each region hides one.', mx * W, my * H - UNIT * 1.4, { key: 'shroom', life: 2.5 });
      else ask(`Travel where? (${state.inv.spores} spores)`, mx * W, my * H - UNIT * 1.2, dest.map(o => `${SHROOM_NAMES[o.id]}: ${o.cost}`).concat('Stay'), i2 => { if (i2 < dest.length) sporeJump(dest[i2].id, dest[i2].cost); });
      return true;
    }
  }
  for (const n of sc.npcs) {
    if (!npcHere(n)) continue;
    const [nx, ny] = npcPos(n), d = Math.hypot(h.x - nx, h.y - ny);
    if (d < UNIT * 3.2) say(`${K.act} to talk`, nx, ny - UNIT * 1.5, { key: 'talk-' + n.kind, tip: 'talk', life: 2.5 });
    if (d < UNIT * 2 && pressedNow.act) { startTalk(n); return true; }
  }
  if (sc.feat.tentDoor && campBuilt('tent') && pressedNow.act && Math.hypot(h.x - sc.feat.tentDoor[0] * W, h.y - sc.feat.tentDoor[1] * H) < UNIT * 1.2) { sfx.tock(); transitionTo('tentin', 0.5, 0.8, true); return true; }
  if (sc.feat.bedroll && pressedNow.act && Math.hypot(h.x - sc.feat.bedroll[0] * W, h.y - sc.feat.bedroll[1] * H) < UNIT * 1.8) { h.vig = maxVig(); sfx.heart(); say('A quick nap. Vigor restored.', h.x, h.y - UNIT * 1.2, { key: 'item', life: 2.2, color: '#b8f28a' }); return true; }
  if (sc.feat.chest && pressedNow.act && Math.hypot(h.x - sc.feat.chest[0] * W, h.y - sc.feat.chest[1] * H) < UNIT * 1.6) { state.menu = { view: 'chest', col: 0, sel: 0, note: '' }; sfx.tock(); return true; }
  if (sc.feat.book && pressedNow.act && Math.hypot(h.x - sc.feat.book[0] * W, h.y - sc.feat.book[1] * H) < UNIT * 1.6) { state.menu = { view: 'book', page: 0 }; sfx.tock(); return true; }
  for (const b of sc.feat.buildSpots || []) {
    if (campBuilt(b.piece) || !pressedNow.act || Math.hypot(h.x - b.fx * W, h.y - b.fy * H) > UNIT * (b.r + 0.9)) continue;
    if ((rawOf()[PIECE_OF[b.piece]] || 0) > 0) { placePiece(b); return true; }
    say(`The ${RAW[PIECE_OF[b.piece]].toLowerCase()} goes here.`, b.fx * W, b.fy * H - UNIT, { key: 'spot', life: 2 }); return true;
  }
  if (sc.id === 'camp' && campBuilt('fire')) {
    const [fx, fy] = sc.feat.fire, d = Math.hypot(h.x - fx * W, h.y - fy * H);
    if (d < UNIT * 2.2) say(`${K.act} to rest by the fire`, fx * W, fy * H - UNIT * 1.2, { key: 'fire', tip: 'rest', life: 3 });
    if (d < UNIT * 1.7 && pressedNow.act) {
      h.vig = maxVig(); sfx.crackle(); sfx.heart(); zoomPulse(fx * W, fy * H, 'pickup');
      say('You rest by the fire. Vigor restored.', h.x, h.y - UNIT * 1.2, { key: 'item', life: 2.5 });
      say(`${K.menu} opens the menu. Save your progress there.`, h.x, h.y + UNIT * 2.2, { key: 'savetip', tip: 'save', life: 4 });
      return true;
    }
  }
  if (sc.feat.bench && (sc.id !== 'camp' || campBuilt('bench'))) {
    const [bx, by] = sc.feat.bench, d = Math.hypot(h.x - bx * W, h.y - by * H);
    if (d < UNIT * 2.4) say(`${K.act} to work at the bench`, bx * W, by * H - UNIT * 1.2, { key: 'bench', tip: 'bench', life: 3 });
    if (d < UNIT * 1.9 && pressedNow.act) { state.menu = { view: 'forge', sel: 0, note: '' }; state.keys = {}; state.prevKeys = {}; sfx.tock(); return true; }
  }
  if (sc.feat.plots && !nearPull) {
    const plots = rt.flags.plots || (rt.flags.plots = sc.feat.plots.map(() => ({ s: 0, t: 0, lv: sc.feat.plotLv || 0 })));
    let nearestPlot = -1, nd = UNIT * 0.8;              // the patch you're standing on, not just the first one in reach
    sc.feat.plots.forEach(([qx, qy], j) => { const dd = Math.hypot(h.x - qx * W, h.y - qy * H); if (dd <= nd) { nd = dd; nearestPlot = j; } });
    for (let i = 0; i < plots.length; i++) {
      const [px, py] = sc.feat.plots[i], d2 = Math.hypot(h.x - px * W, h.y - py * H);
      if (i !== nearestPlot) continue;
      const p = plots[i], stage = plotStage(p), crop = cropOfPlot(p, sc, i);
      const sk = seedSlotKey(), slotSeeds = p.s === 0 && !!sk && sk !== 'f';   // seeds on A/S/D: that key plants. Seeds on F: F plants them
      const have = slotSeeds ? [] : sk === 'f' ? [slotsOf().f.id] : Object.keys(SEEDS).filter(k => state.inv.bag[k] > 0);
      const next = PATCH[(p.lv || 0) + 1], improve = p.s === 0 && next && canAfford(next.cost);
      // a ripe crop has to be pulled up: hold F and it works loose, quicker the better you are at farming
      if (p.s === 1 && stage >= 3) {
        const cp = state.cropPull;
        if (!held.act()) { if (cp) state.cropPull = null; return false; }
        const c2 = cp && cp.i === i && cp.sc === sc.id ? cp : (state.cropPull = { i, sc: sc.id, t: 0, need: CROP_PULL[Math.min(CROP_PULL.length - 1, farmLevel())] });
        c2.t += state.frameDt || 1 / 60;
        if (Math.random() < 0.3) state.fx.push({ x: px * W + (Math.random() - 0.5) * UNIT * 0.6, y: py * H + UNIT * 0.1, vx: (Math.random() - 0.5) * UNIT * 2, vy: -UNIT * (0.5 + Math.random()), t: 0, life: 0.5, color: '#5a4128', size: UNIT * 0.06 });
        if (!c2.tugged) { c2.tugged = true; sfx.strain(); }
        if (c2.t < c2.need) return true;
        state.cropPull = null;
      }
      if (slotSeeds && !improve) { if (pressedNow.act) say(`${seedKeyLabel()} plants.`, px * W, py * H - UNIT, { key: 'plot', life: 1.6 }); if (!pressedNow.act) return false; return true; }
      if (improve && (slotSeeds || !have.length)) { if (!pressedNow.act) return false; payFor(next.cost); p.lv = (p.lv || 0) + 1; sfx.forge(); spark(px * W, py * H, '#c9a46a', 12, 2.5);   // seeds are on their own key: F composts
        say(`${next.name}: grows faster${next.bonus ? ', sometimes gives extra' : ''}${next.seedBack ? ', sometimes gives a seed back' : ''}.`, px * W, py * H - UNIT, { key: 'plot', life: 3.5, color: '#ffe38a' }); return true; }
      if (p.s === 0 && !have.length && !improve && !slotSeeds) say(`${patchOf(p).name}. Birds and gremlins drop seeds; rarer seeds come from tougher things.`, px * W, py * H - UNIT, { key: 'plot', tip: 'plot', life: 2.5 });
      if (!pressedNow.act && !(p.s === 1 && stage >= 3)) return false;
      const doImprove = () => {
        payFor(next.cost); p.lv = (p.lv || 0) + 1; sfx.forge(); spark(px * W, py * H, '#c9a46a', 12, 2.5); zoomPulse(px * W, py * H, 'pickup');
        say(`${next.name}: grows faster${next.bonus ? ', sometimes gives extra' : ''}${next.seedBack ? ', sometimes gives a seed back' : ''}.`, px * W, py * H - UNIT, { key: 'plot', life: 3.5, color: '#ffe38a' });
      };
      const plant = kind => {
        state.inv.bag[kind]--; p.s = 1; p.t = state.playTime; p.seed = kind;
        sfx.plant(); spark(px * W, py * H, '#6a4a2a', 6, 2);
        say(SEEDS[kind].crop ? `Planted. ${CROP_NAME[SEEDS[kind].crop]} grow here.` : `${SEEDS[kind].name} planted. It will take a while.`, px * W, py * H - UNIT, { key: 'plot', life: 2.5 });
      };
      const imp = improve ? [`${next.cost.acorn ? 'Compost it' : 'Improve'}: ${next.name} (${patchCost(next.cost)})`] : [];
      if (p.s === 0 && !have.length && improve) ask(`${patchOf(p).name}`, px * W, py * H - UNIT, imp, () => doImprove());
      else if (p.s === 0 && !improve && state.inv.favSeed && state.inv.bag[state.inv.favSeed] > 0) plant(state.inv.favSeed);
      else if (p.s === 0 && !improve && have.length === 1) plant(have[0]);
      else if (p.s === 0 && (have.length > 1 || improve)) ask('Plant which seed?', px * W, py * H - UNIT, have.map(k => `${SEEDS[k].name} x${state.inv.bag[k]}`).concat(imp), i2 => i2 < have.length ? plant(have[i2]) : doImprove());
      else if (p.s === 1 && stage >= 3) {                 // pulled all the way up
        const S = SEEDS[seedOfPlot(p, sc, i)], P = patchOf(p), extra = rng() < P.bonus + (S.yields ? 0 : cropLevel(crop) * 0.05) ? 1 : 0;
        p.s = 0; state.inv.harvests = (state.inv.harvests || 0) + 1; sfx.pop(); zoomPulse(px * W, py * H, 'pickup');
        if (S.yields) { const n0 = S.yields[1] + extra; for (let n = 0; n < n0; n++) collect({ type: S.yields[0], x: px * W, y: py * H }); say(`Harvested ${n0} ${MATS[S.yields[0]]}${extra ? ' (a good crop!)' : ''}`, px * W, py * H - UNIT, { key: 'plot', life: 2.2 }); }
        else {                                       // one seed, a few vegetables: the seed's own range, plus the patch's bonus
          const n0 = S.n[0] + Math.floor(rng() * (S.n[1] - S.n[0] + 1)) + extra;
          for (let n = 0; n < n0; n++) collect({ type: crop, x: px * W, y: py * H });
          say(n0 > 1 ? `${['', '', 'Two', 'Three', 'Four', 'Five'][n0] || n0} ${crop}s!${extra ? ' A good crop!' : ''}` : `A ${crop}!`, px * W, py * H - UNIT, { key: 'plot', life: 2 });
        }
        if (!S.yields) gainCropXp(crop);
        if (rng() < Math.min(0.85, P.seedBack + farmLevel() * 0.06)) { const sk = seedOfPlot(p, sc, i); state.inv.bag[sk] = (state.inv.bag[sk] || 0) + 1; say('...and a seed to plant again.', px * W, py * H - UNIT * 1.8, { key: 'plot2', life: 2, color: '#b8f28a' }); }
      }
      else if (p.s === 1) say(['Just planted.', 'A sprout!', 'Leafy. Nearly there.'][stage], px * W, py * H - UNIT, { key: 'plot', life: 2 });
      return true;
    }
  }
  if (!state.carry) {
    const rock = state.items.find(it => it.type === 'bigrock' && Math.hypot(h.x - it.x, h.y - it.y) < UNIT * 1.3);
    if (rock && pressedNow.act) { state.items.splice(state.items.indexOf(rock), 1); state.carry = 'rock'; state.carryT = state.time; sfx.lift(); refreshButtons(); return true; }
  } else if (pressedNow.act) { dropRock(); return true; }
  return false;
}
// Farm patches start as a wild tuft of rich earth and can be improved, one step at a time:
// faster growth, a chance of an extra harvest, a chance to get a seed back.
const PATCH = [
  { name: 'Tuft of rich soil', speed: 1, bonus: 0, seedBack: 0 },
  { name: 'Turned rich soil', speed: 1.2, bonus: 0, seedBack: 0.15, cost: { acorn: 3 }, how: 'work in acorn compost' },
  { name: 'Framed rich-soil bed', speed: 1.45, bonus: 0.35, seedBack: 0.25, cost: { thorn: 3 }, how: 'frame it with thorn-wood' },
  { name: 'Raised rich-soil bed', speed: 1.8, bonus: 0.7, seedBack: 0.35, cost: { ironwood: 1, ember: 1 }, how: 'raise it with ironwood and warm ember soil' },
];
const patchOf = p => PATCH[Math.min(PATCH.length - 1, p.lv || 0)];
const patchCost = c => Object.entries(c).map(([k, n]) => `${n} ${k === 'acorn' ? 'acorns' : MATS[k]}`).join(' + ');
function canAfford(c) { const inv = state.inv; return Object.entries(c).every(([k, n]) => (k === 'acorn' ? inv.acorns : inv.mats[k]) >= n); }
function payFor(c) { const inv = state.inv; for (const [k, n] of Object.entries(c)) { if (k === 'acorn') inv.acorns -= n; else inv.mats[k] -= n; } }
const CROP = { forest: 'turnip', woods: 'turnip', field: 'carrot', marsh: 'pepper', swamp: 'pepper', cave: 'squash' };
const CROP_NAME = { turnip: 'Turnips', carrot: 'Carrots', pepper: 'Bog peppers', squash: 'Squash', berries: 'Berries' };
// what was planted in a patch (old saves planted a plain "seed": that was the local vegetable's)
const seedOfPlot = (p, sc, i) => SEEDS[p.seed] ? p.seed : SEED_OF[(sc.feat.crops && sc.feat.crops[i]) || CROP[sc.area] || 'turnip'];
const cropOfPlot = (p, sc, i) => { const S = SEEDS[p.seed]; return S && S.crop ? S.crop : (sc.feat.crops && sc.feat.crops[i]) || CROP[sc.area] || 'turnip'; };
const plotStage = p => p.s ? Math.min(3, Math.floor((state.playTime - p.t) * patchOf(p).speed / (SEEDS[p.seed] || SEEDS.turnipseed).grow)) : 0;
function dropRock() {                               // set down a step ahead, the way you face
  const h = state.hero;
  state.carry = null;
  const x = h.x + h.fx * UNIT * 0.9, y = h.y + h.fy * UNIT * 0.9 + UNIT * 0.15;
  if (inMud(x, y)) sinkRock(x, y); else state.items.push({ type: 'bigrock', x, y });
  sfx.land(); refreshButtons();
}
// The wheel (hold R): every consumable you carry, for use right now. Hold R and press A, S, D or F: everything
// that could go in that slot; let go of R to put the highlighted one there. Both lists come from slotOptions().
function radialOptions(slot) {
  if (slot) return [...slotOptions(), { kind: 'none', id: 'none' }];
  return consumableOptions();
}
function radialLabel(o, slot) {
  if (o.kind === 'none') return `Empty ${slotLabel(slot)}`;
  const i = entryInfo(o), n = entryCount(o);
  if (slot) return `${slotLabel(slot)}: ${i.name}${o.kind === 'weapon' && o.id === 'sword' || o.kind === 'ability' ? '' : ' ' + n}`;
  return `${i.verb} ${i.name.toLowerCase()} (${n})`;
}
function applyRadial(r) {
  const opt = r.opts[r.sel];
  if (!opt) return;
  if (r.slot) { setSlot(r.slot, opt.kind === 'none' ? null : opt); sfx.tock(); const h = state.hero; say(radialLabel(opt, r.slot), h.x, h.y - UNIT * 1.2, { key: 'equip', life: 1.1, color: '#ffe38a' }); }
  else useEntry(opt);
}
// tap R: the F slot steps through your weapons
function cycleEquip() {
  const ws = slotOptions().filter(e => e.kind === 'weapon');
  if (!ws.length) return;
  const f = slotsOf().f, i = ws.findIndex(e => sameEntry(e, f)), next = ws[(i + 1) % ws.length];
  if (sameEntry(next, f)) return;
  setSlot('f', next); sfx.tock();
  const h = state.hero; say(radialLabel(next, 'f'), h.x, h.y - UNIT * 1.2, { key: 'equip', life: 0.9, color: '#ffe38a' });
}

const SPORE_TIME = 90;                               // seconds for a mushroom to grow one spore (holds up to 3)
// Travel costs spores by distance: 1 spore per 3 screens you'd otherwise walk (at least 1).
function screensBetween(a, b) {
  if (a === b) return 0;
  const adj = {};
  const link = (x, y) => { (adj[x] = adj[x] || new Set()).add(y); (adj[y] = adj[y] || new Set()).add(x); };
  for (const [id, sc] of Object.entries(WORLD)) for (const ex of sc.exits) link(id, ex.to);
  link('w3', 'c1');                                   // the sinkhole
  const seen = { [a]: 0 }, q = [a];
  while (q.length) { const x = q.shift(); for (const y of adj[x] || []) if (seen[y] == null) { seen[y] = seen[x] + 1; if (y === b) return seen[y]; q.push(y); } }
  return 12;
}
const sporeCost = (to, from = state.scene) => Math.max(1, Math.ceil(screensBetween(from, to) / 3));
function travelOptions(from) {
  return Object.keys(SHROOM_NAMES).filter(id => state.inv.shrooms[id] && id !== from).map(id => ({ id, cost: sporeCost(id, from) }));
}
function sporeJump(id, cost) {
  const inv = state.inv, h = state.hero;
  if (inv.spores < cost) { say(`Not enough spores: ${inv.spores}/${cost}. Found mushrooms grow more over time.`, h.x, h.y - UNIT * 1.3, { key: 'spore', life: 2.5 }); return false; }
  inv.spores -= cost;
  const to = WORLD[id].feat.shroom;
  sfx.spores();
  for (let i = 0; i < 28; i++) state.fx.push({ x: h.x + (Math.random() - 0.5) * UNIT, y: h.y, vx: (Math.random() - 0.5) * UNIT * 3, vy: -UNIT * (1 + Math.random() * 2), t: 0, life: 1.1, color: '#e8d8ff' });
  transitionTo(id, to[0], to[1] + 1.6 * UNIT / H);
  return true;
}
// ---------------- what F would do right now, and where: the nearest thing you can use ----------------
function findInteractable() {
  const h = state.hero, sc = sceneDef(), rt = rtFor(sc.id), inv = state.inv, f = sc.feat, c = [];
  if (state.menu || state.cut || state.busy || h.z > 0 || state.fish || state.npcTalk || state.choice || state.rapids) return null;
  const add = (x, y, verb, range, key) => { const d = Math.hypot(h.x - x, h.y - y); if (d < range * UNIT) c.push({ x, y, verb, d, key }); };
  for (const n of sc.npcs) if (npcHere(n)) { const [x, y] = npcPos(n); add(x, y, 'Talk', 2); }
  for (const q of f.portals || []) add(q.fx * W, q.fy * H, 'Enter', 1.6);
  if (f.mirror) add(f.mirror[0] * W, f.mirror[1] * H, 'Poses', 1.8);
  if (!state.carry) {
    for (const p of sc.pullables) if (!rt.pulled.has(p.id)) add(p.fx * W, p.fy * H, 'Pull', p.kind === 'sword' ? 0.9 : 1.8);   // the hidden hilt only shows it's a handle when you're right on it
    for (const it of state.items) if (it.type === 'bigrock') add(it.x, it.y, 'Lift', 1.3);
  }
  if (f.fire && sc.id === 'camp' && campBuilt('fire')) add(f.fire[0] * W, f.fire[1] * H, 'Rest', 1.7);
  if (f.bench && (sc.id !== 'camp' || campBuilt('bench'))) add(f.bench[0] * W, f.bench[1] * H, 'Craft', 1.9);
  for (const b of f.buildSpots || []) if (!campBuilt(b.piece) && (rawOf()[PIECE_OF[b.piece]] || 0) > 0) add(b.fx * W, b.fy * H, 'Build', b.r + 0.9);
  if (f.tentDoor && campBuilt('tent')) add(f.tentDoor[0] * W, f.tentDoor[1] * H, 'Enter', 1.2);
  if (f.bedroll) add(f.bedroll[0] * W, f.bedroll[1] * H, 'Nap', 1.8);
  if (f.chest) add(f.chest[0] * W, f.chest[1] * H, 'Storage', 1.6);
  if (f.book) add(f.book[0] * W, f.book[1] * H, 'Read', 1.6);
  if (f.shroom && inv.pipSaved && inv.shrooms[sc.id]) add(f.shroom[0] * W, f.shroom[1] * H, 'Travel', 1.9);
  if (f.plots && !state.carry) {
    const plots = rt.flags.plots || [];
    f.plots.forEach((q, i) => {
      const p = plots[i] || { s: 0 }, st = plotStage(p);
      const nx = PATCH[(p.lv || 0) + 1];
      if (p.s === 0 && seedSlotKey()) add(q[0] * W, q[1] * H, 'Plant', 0.8, seedKeyLabel());
      else if (p.s === 0 && Object.values(inv.bag).some(v => v > 0)) add(q[0] * W, q[1] * H, 'Plant', 0.8);
      else if (p.s === 0 && nx && canAfford(nx.cost)) add(q[0] * W, q[1] * H, nx.cost.acorn ? 'Compost' : 'Improve', 0.8);
      if (p.s && st >= 3) add(q[0] * W, q[1] * H, 'Hold: pull up', 0.8);
    });
  }
  if (f.dock && inv.raft) {
    const ok = inv.raft === 2 || (inv.mats.driftwood >= RAFT.driftwood && inv.mats.thorn >= RAFT.thorn);
    if (ok) add(f.dock[0] * W, f.dock[1] * H, inv.raft === 2 ? 'Launch' : 'Build raft', 2.2);
  }
  if (f.farside) {
    const x = f.farside[0] * W, y = f.farside[1] * H;
    if (!rt.flags.salvaged) add(x - UNIT * 0.05, y + UNIT * 1.35, 'Salvage', 1.4);
    add(x - UNIT * 0.05, y + UNIT * 0.65, 'Enter', 1.3);
  }
  if (f.tunnel && inv.tunnel) add(f.tunnel[0] * W, f.tunnel[1] * H, 'Dive', 2);
  if (f.fishing && inv.rod) for (const [x, y, i] of fishSpots(sc)) if (((state.fishCool[sc.id + i] || 0) - state.playTime) <= 0) add(x, y, 'Cast', 2.3);
  c.sort((a, b) => a.d - b.d);
  return c[0] || null;
}
// ---------------- the Downriver sidequest: a sign across the water, a raft, a pool, a tunnel ----------------
const RAFT = { driftwood: 4, thorn: 2 };
function riverSideQuest(sc, h) {
  const inv = state.inv, f = sc.feat;
  if (f.farside) {
    const [fx, fy] = f.farside, x = fx * W, y = fy * H, rt = rtFor(sc.id);
    // Nothing is said about the far side until you're actually over there and can see it plainly (inView: close, and no
    // river or trees between). From the start side it's just a place on the map. Never during Pip's opening.
    if (!rt.flags.sawFarside && !state.intro && !speakingNow() && inView(x, y + UNIT * 0.6, 6)) {
      rt.flags.sawFarside = true;
      say('A shack, a jetty, and something made of logs. Somebody lives here. Or did.', x + UNIT * 2, y - UNIT * 1.2, { key: 'farside', life: 5 });
    }
    // on the far side (reached by crossing the ford): the sign, the unfinished raft, the shack door
    const sign = [x + UNIT * 1.35, y - UNIT * 0.4], door = [x - UNIT * 0.05, y + UNIT * 0.65], wreck = [x - UNIT * 0.05, y + UNIT * 1.35];
    if (Math.hypot(h.x - sign[0], h.y - sign[1]) < UNIT * 1.6) say('"GONE DOWNRIVER TO THE GLEAMING POOL. BIGGEST FISH YOU EVER SAW. Old Wick."', sign[0], sign[1] - UNIT * 1.2, { key: 'sign', life: 3 });
    if (Math.hypot(h.x - wreck[0], h.y - wreck[1]) < UNIT * 1.4) {
      if (!inv.raft) {                                // touching Wick's raft is what starts it
        inv.raft = 1;
        /* the Downriver quest announces itself (quest banner) */
      }
      say(rt.flags.salvaged ? 'Old Wick\'s half-built raft, picked clean.' : 'Old Wick\'s first raft, never finished.', wreck[0], wreck[1] - UNIT, { key: 'wreck', life: 2.5 });
      if (pressedNow.act && !rt.flags.salvaged) { rt.flags.salvaged = true; inv.mats.driftwood += 2; sfx.lift(); say('+2 driftwood', h.x, h.y - UNIT * 1.2, { key: 'matdrift', life: 2, color: '#ffe38a' }); return true; }
    }
    if (Math.hypot(h.x - door[0], h.y - door[1]) < UNIT * 1.3) {
      say(`${K.act} to go inside`, door[0], door[1] - UNIT, { key: 'door', life: 1.5 });
      if (pressedNow.act) { sfx.tock(); transitionTo('shack', 0.5, 0.82, true); return true; }
    }
  }
  if (f.dock) {
    const [dx, dy] = f.dock, d = Math.hypot(h.x - dx * W, h.y - dy * H);
    if (d < UNIT * 2.2 && !inv.raft) say('An old jetty, weathered but solid.', dx * W, dy * H - UNIT * 1.3, { key: 'dock', life: 2 });
    if (d < UNIT * 2.2 && inv.raft) {
      const have = `${inv.mats.driftwood}/${RAFT.driftwood} driftwood, ${inv.mats.thorn}/${RAFT.thorn} thorns`;
      say(inv.raft >= 2 && inv.raft < 3 ? `${K.act} to push off downriver` : `The old jetty. A raft needs ${have}.`, dx * W, dy * H - UNIT * 1.3, { key: 'dock', life: 2.5 });
      if (pressedNow.act) {
        if (inv.raft === 1 || inv.raft >= 3) {
          if (inv.mats.driftwood >= RAFT.driftwood && inv.mats.thorn >= RAFT.thorn) {
            inv.mats.driftwood -= RAFT.driftwood; inv.mats.thorn -= RAFT.thorn; inv.raft = 2;
            sfx.forge(); zoomPulse(dx * W, dy * H, 'pickup');
            say('You lash the driftwood together with thorn twine. A raft!', dx * W, dy * H - UNIT * 1.3, { key: 'dock', life: 3 });
          } else say(`Not enough yet: ${have}. Driftwood washes up along the river.`, dx * W, dy * H - UNIT * 1.3, { key: 'dock', life: 3 });
        } else if (inv.raft === 2) startRaftRide();
        return true;
      }
    }
  }
  if (f.tunnel) {                                    // a gleam deep in the water: the way between the two falls
    const [tx, ty] = f.tunnel, d = Math.hypot(h.x - tx * W, h.y - ty * H);
    if (d < UNIT * 2) {
      if (!inv.tunnel) say('Something gleams far below the water. Too deep to reach from here.', tx * W, ty * H - UNIT * 1.4, { key: 'tunnel', life: 2.5 });
      else {
        say(`${K.act} to dive into the tunnel`, tx * W, ty * H - UNIT * 1.4, { key: 'tunnel', life: 2 });
        if (pressedNow.act) {
          const to = sc.id === 'gleampool' ? 'fallsbank' : 'gleampool', t = WORLD[to].feat.tunnel;
          sfx.splash(); spark(h.x, h.y, 'rgba(210,235,245,.9)', 16, 3);
          transitionTo(to, t[0], t[1] - 2.6 * UNIT / H);
          return true;
        }
      }
    }
  }
  if (f.fishing && inv.rod) {                        // cast at a ripple
    for (const [x, y, i] of fishSpots(sc)) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d > UNIT * 2.3) continue;
      const key = sc.id + i, cool = (state.fishCool[key] || 0) - state.playTime;
      say(cool > 0 ? 'The fish here are wary. Try another ripple.' : `${K.act} to cast`, x, y - UNIT * 1.2, { key: 'fish', life: 1.5 });
      if (pressedNow.act && cool <= 0) { startFishing(key, x, y); return true; }
    }
  } else if (f.fishing) {
    for (const [x, y] of fishSpots(sc)) if (Math.hypot(h.x - x, h.y - y) < UNIT * 2.3) say('Fish rise here. If only you had a rod.', x, y - UNIT * 1.2, { key: 'fish', life: 2 });
  }
  return false;
}
// fishing spots in pixels, always inside the pool's water (the pool is drawn as an ellipse 0.72 as tall as wide)
function fishSpots(sc) {
  if (sc.deep) { const d = sc.deep; return (sc.feat.fishing || []).map(([a, k], i) => [(d.fx + Math.cos(a) * d.rx * k) * W, (d.fy + Math.sin(a) * d.ry * k) * H, i]); }
  const p = state.pools[0];
  if (!p || !sc.feat.fishing) return [];
  return sc.feat.fishing.map(([a, k], i) => [p.x + Math.cos(a) * p.r * k, p.y + Math.sin(a) * p.r * 0.72 * k, i]);
}
// ---------------- the rapids: steer the raft between rocks, down to the falls ----------------
const RAPIDS = { len: 11, speed: 0.36, raftY: 0.72, planks: 3, accel: 55, maxV: 12, pull: 0.25 };
function rapidsChannel(D) {                           // centre and half-width of the river, in pixels, at distance D (screens)
  const cx = W * (0.5 + 0.16 * Math.sin(D * 1.1) + 0.06 * Math.sin(D * 2.7 + 1));
  const hw = Math.min(W * 0.45, Math.max(UNIT * 4.5, W * (0.27 - 0.05 * Math.sin(D * 0.8))));
  return [Math.max(hw + UNIT, Math.min(W - hw - UNIT, cx)), hw];
}
function newRapids() {
  const rocks = [];
  for (let D = 1.5; D < RAPIDS.len - 0.9; D += 0.38 + Math.random() * 0.22) {
    const [cx, hw] = rapidsChannel(D), n = Math.random() < 0.25 + D / RAPIDS.len * 0.5 ? 2 : 1, xs = [];
    for (let k = 0; k < n; k++) {
      for (let t = 0; t < 12; t++) {
        const x = (cx - hw * 0.85 + Math.random() * hw * 1.7) / W;
        if (xs.every(o => Math.abs(o - x) * W > UNIT * 5)) { xs.push(x); break; }     // always leave a raft-wide gap
      }
    }
    for (const x of xs) rocks.push({ D, x, r: 0.55 + Math.random() * 0.35 });
  }
  return { dist: 0, x: W * 0.5, vx: 0, planks: RAPIDS.planks, invuln: 0, phase: 'ride', t: 0, rocks, said: false };
}
function updateRapids(dt) {
  const r = state.rapids, h = state.hero, raftR = UNIT * 0.8, ry = H * RAPIDS.raftY;
  r.t += dt; r.invuln -= dt;
  if (!r.said) { r.said = true; say(`Steer with the arrows. ${K.u} paddles faster. Rocks break the raft.`, null, null, { key: 'rapids', life: 4 }); }
  if (r.phase === 'ride') {
    const pace = held.up() ? 1.25 : held.down() ? 0.7 : 1;
    r.dist += RAPIDS.speed * pace * dt;
    const steer = (held.right() ? 1 : 0) - (held.left() ? 1 : 0);
    r.vx += steer * UNIT * RAPIDS.accel * dt;
    const [cx, hw] = rapidsChannel(r.dist);
    r.vx += (cx - r.x) * RAPIDS.pull * dt;            // the current pulls toward the middle
    r.vx *= Math.exp(-(steer ? 1.2 : 3) * dt);
    r.vx = Math.max(-UNIT * RAPIDS.maxV, Math.min(UNIT * RAPIDS.maxV, r.vx));
    r.x += r.vx * dt;
    if (Math.abs(r.x - cx) > hw - raftR) {              // scrape the bank: bounced back, no damage
      r.x = cx + Math.sign(r.x - cx) * (hw - raftR); r.vx *= -0.35;
      if (r.t - (r.scrape || 0) > 0.4) { r.scrape = r.t; sfx.tock(); state.shake = 0.15; }
    }
    for (const k of r.rocks) {
      const y = ry - (k.D - r.dist) * H;
      if (Math.abs(y - ry) > UNIT * 2) continue;
      if (Math.hypot(r.x - k.x * W, ry - y) < k.r * UNIT + raftR && r.invuln <= 0) {
        r.planks--; r.invuln = 1.2; r.vx = Math.sign(r.x - k.x * W || 1) * UNIT * 9;
        state.shake = 0.5; sfx.crash(); spark(r.x, ry, '#9a7a4a', 10, 3); zoomPulse(r.x, ry, 'hurt');
        say(r.planks > 0 ? `Crack! ${r.planks} plank${r.planks > 1 ? 's' : ''} left.` : 'The raft splinters!', null, null, { key: 'rapids', life: 1.8, color: '#ffb080' });
        if (r.planks <= 0) { r.phase = 'wreck'; r.t = 0; }
      }
    }
    if (r.dist >= RAPIDS.len) { r.phase = 'falls'; r.t = 0; sfx.whoosh(); say('The falls!', null, null, { key: 'rapids', life: 1.5, color: '#ffe38a' }); }
    if (Math.random() < 0.5) state.fx.push({ x: r.x + (Math.random() - 0.5) * UNIT * 1.6, y: ry + UNIT * 0.6, vx: (Math.random() - 0.5) * UNIT, vy: UNIT * 3, t: 0, life: 0.5, color: 'rgba(220,240,250,.7)', size: UNIT * 0.15 });
  } else if (r.phase === 'falls') {
    r.dist += RAPIDS.speed * dt * 1.4;
    if (r.t > 1.1 && !r.gone) { r.gone = true; state.overFalls = true; state.flash = 0.5; transitionTo('gleampool', 0.8, 0.5, true); }
  } else if (r.phase === 'wreck' && r.t > 1.2 && !r.gone) {
    r.gone = true;
    const inv = state.inv; inv.raft = 1; inv.mats.driftwood += 2;
    const [ax, ay] = dockLanding();
    transitionTo('riverbank', ax, ay);
    setTimeout(() => say('You drag yourself ashore by the jetty, with two good logs. Build again and try another line.', state.hero.x, state.hero.y - UNIT * 1.3, { key: 'wreck', life: 5 }), 1100);
  }
  h.x = r.x; h.y = ry; h.z = Math.abs(Math.sin(r.t * 5)) * UNIT * 0.08; h.vx = r.vx; h.vy = 0; h.fx = 0; h.fy = -1;
  updateCam(dt);
}
function startRaftRide() {
  // push off from the jetty into the current, then follow the river downstream off the screen
  const sc = sceneDef(), rp = sc.river.pts, [dx, dy] = sc.feat.dock;
  let bi = 0, bd = Infinity, bp = rp[0];
  for (let i = 0; i < rp.length - 1; i++) {
    const [ax, ay] = rp[i], [bx, by] = rp[i + 1], vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((dx - ax) * vx + (dy - ay) * vy) / l2)), px = ax + vx * t, py = ay + vy * t, d = Math.hypot(px - dx, py - dy);
    if (d < bd) { bd = d; bi = i; bp = [px, py]; }
  }
  const pts = [[dx, dy], bp, ...rp.slice(bi + 1)];
  state.cut = { type: 'raft', t: 0, pts, step: 0 };
  state.inv.raft = 3;
  sfx.whoosh(); state.cam.focus = { z: 1.2, at: () => [state.hero.x, state.hero.y] };
}
// ---------------- fishing: cast, wait, strike when it bites ----------------
function startFishing(key, x, y) {
  state.fish = { key, x, y, t: rr(1.5, 4), phase: 'wait' };
  sfx.throw(); say('Wait for a bite...', x, y - UNIT * 1.2, { key: 'fish', life: 2 });
}
function updateFishing(dt) {
  const f = state.fish, h = state.hero;
  if (!f) return;
  if (pressedNow.jump || pressedNow.up || pressedNow.down || pressedNow.left || pressedNow.right) { state.fish = null; say('You reel in.', h.x, h.y - UNIT, { key: 'fish', life: 1 }); return; }
  f.t -= dt;
  if (f.phase === 'wait') {
    if (pressedNow.act) { state.fish = null; say('Too early. It swims off.', f.x, f.y - UNIT * 1.2, { key: 'fish', life: 1.6 }); state.fishCool[f.key] = state.playTime + 6; return; }
    if (f.t <= 0) { f.phase = 'bite'; f.t = 0.7; sfx.tock(); sfx.splash(); zoomPulse(f.x, f.y, 'tap'); say('!', f.x, f.y - UNIT, { key: 'fish', life: 0.7, size: 2, color: '#ffe38a' }); }
  } else if (f.phase === 'bite') {
    if (pressedNow.act) {
      state.fish = null; state.fishCool[f.key] = state.playTime + 20;
      sfx.pickup(); zoomPulse(f.x, f.y, 'pickup'); spark(f.x, f.y, 'rgba(210,235,245,.9)', 10, 3);
      state.items.push({ type: 'fish', x: h.x + h.fx * UNIT, y: h.y + h.fy * UNIT });
      if (rng() < 0.35) {                            // sometimes a seed in its belly
        const r = rng(), seed = r < 0.5 ? localSeed() : r < 0.75 ? 'thornseed' : r < 0.9 ? 'emberseed' : 'ironseed';
        state.items.push({ type: seed, x: h.x - h.fx * UNIT * 0.6 + UNIT * 0.5, y: h.y + UNIT * 0.6 });
        say('Something was in its belly!', h.x, h.y - UNIT * 1.6, { key: 'belly', life: 2 });
      }
      train(0.5);
    } else if (f.t <= 0) { state.fish = null; state.fishCool[f.key] = state.playTime + 6; say('It got away.', f.x, f.y - UNIT * 1.2, { key: 'fish', life: 1.6 }); }
  }
}
// ---------------- conversations ----------------
function npcLines(n) {
  const inv = state.inv, rt = rtFor(state.scene);
  if (n.kind === 'toad') {
    if (inv.fire) return { lines: ['Go on then. Light up the dark.', 'And mind the wind. It hates wind.', 'Oh, and keep your embers dry. Dried in a pouch, they feed the spark.'].concat(inv.pipSaved ? ['And stay off those purple mushroom spores. Last time I sniffed a pile of them I woke up in a cave.'] : []), then: () => learnRecipe('pouch', 'The toad taught you to keep embers.') };
    if (inv.beans >= BEANS) return { lines: ['My lunch! Every last bean!', 'Now stand back. Way back.'], then: startToadCut };
    if (!rt.flags.metToad) { rt.flags.metToad = true; return { lines: ['Hrrrmph. Somebody\'s been in my pantry.', 'Beans! My lunch! Little round ones, scattered all over this bog.', `Bring back all ${BEANS} and I'll teach you something... explosive.`] }; }
    return { lines: [`${inv.beans} of ${BEANS}. I'm wasting away here.`].concat(inv.beans >= 5 ? ['A couple rolled south, down into the swamp. Mind the lurkers.'] : []) };
  }
  if (n.kind === 'tortoise') {
    if (inv.tortoise) return { lines: [inv.pipSaved ? pick(['Slow and steady, young one.', 'Spores, is it? Skipping all that lovely walking. Hmph.']) : 'Slow and steady, young one.'] };
    return {
      lines: ['Oh! A visitor. The rabbits don\'t usually let anyone this close.', 'They aren\'t guarding treasure, you know. They\'re guarding me.', 'Old habit, from a race a long, long time ago.', 'Here. Take some of my patience with you.'],
      then: () => { inv.tortoise = true; setTimeout(() => learnRecipe('guard', 'The tortoise shows you how shells are layered.'), 0); sfx.heart(); zoomPulse(state.hero.x, state.hero.y, 'boss'); deepen('The tortoise\'s patience settles in you.'); state.items.push({ type: 'starseed', x: state.hero.x + UNIT, y: state.hero.y + UNIT }); say('And a seed from the old race\'s finish line. Plant it somewhere sunny.', npcPos(n)[0], npcPos(n)[1] - UNIT * 1.5, { key: 'npc2', life: 4 }); },
    };
  }
  if (n.kind === 'pip' && n.home) {
    if (inv.journal === 3) return { lines: ['My journal! You got it back!', 'Keep it. You\'ll make better use of the maps than me. They\'re in your menu.'], then: () => { inv.journal = 4; sfx.heart(); } };
    if (rt.flags.pipSpores && !inv.journal) {
      return { lines: ['I saw it! The gremlin with my journal, sneaking back toward the glade.', 'It\'ll run the way they dragged me: through the glade and into the woods.', 'Follow the torn pages. Please get it back.'],
        then: () => { inv.journal = 1; inv.thiefAt = 0; spawnPages(); /* the journal quest announces itself (quest banner) */ } };
    }
    if (!rt.flags.pipSpores) {
      rt.flags.pipSpores = true;
      return { lines: ['Home. I\'ve never been so happy to see that tent.', 'Remember the gremlins\' trick? Smash a bunch of spores at once near one of those big mushrooms, and you pop out at another.', 'You\'ve been picking spores up all along without knowing it, you know. Check your pockets.', 'Now that you know how, you can jump to any mushroom you\'ve found from anywhere, not just from another mushroom. Farther jumps take more spores.', 'Spore travel is in your menu now. Go on, try it.'] };
    }
    return { lines: [pick(['Found the swamp shrine yet? Those stones give me the shivers.', `You've got ${inv.spores} spores. A short hop is only 1.`, 'Each mushroom grows new spores while you\'re away. Visit them now and then.', 'I planted a few things while you were out. Check the plots!'])] };
  }
  if (n.kind === 'pip') {
    if (!broken(state.scene, 'cocoon')) return { lines: ['Mmmph! The vines! Cut me loose!'] };
    return { lines: ['You came for me!', 'Those gremlins dragged me all the way down here. I think they wanted me for dinner.', 'And one of them ran off with my journal. Every map I ever drew is in there.', 'Wait. Look at the spores drifting off that burst mushroom...', 'I remember now! The gremlins smash a whole handful of spores at once and POP, they\'re at another mushroom. That\'s how they got me down here so fast!', 'Scoop up all you can. Then let\'s go home. I\'ll put the kettle on.'], then: startRescue };
  }
  return { lines: ['...'] };
}
// the thief drops pages as it runs: two on each screen of its route
function spawnPages() {
  for (const id of THIEF_ROUTE) for (const q of WORLD[id].feat.pageSpots || []) {
    if (id === state.scene) state.items.push({ type: 'page', x: q[0] * W, y: q[1] * H });
    else rtFor(id).items.push({ type: 'page', fx: q[0], fy: q[1] });
  }
}
// once the toad has told you, the rest of his lunch turns up around the marsh
function spawnBeans() {
  for (const id of ['m1', 'm2', 'm3']) {
    const rt = rtFor(id);
    for (const q of WORLD[id].feat.beanSpots) {
      if (id === state.scene) state.items.push({ type: 'bean', x: q[0] * W, y: q[1] * H });
      else rt.items.push({ type: 'bean', fx: q[0], fy: q[1] });
    }
  }
}
function startTalk(n) {
  const { lines, then } = npcLines(n);
  state.npcTalk = { n, lines, i: -1, then };
  if (n.kind === 'toad') sfx.croak();
  advanceTalk();
}
function advanceTalk() {
  const t = state.npcTalk;
  t.i++;
  if (t.i >= t.lines.length) { state.npcTalk = null; unsay('npc'); if (t.then) t.then(); return; }
  const [nx, ny] = npcPos(t.n);
  sfx.talk();
  say(t.lines[t.i] + (t.i < t.lines.length - 1 ? '  \u25B8' : ''), nx, ny - UNIT * 1.4, { key: 'npc', life: 999, hold: false });
}

// =====================================================================
// Abilities: dash, eat, throw, marsh fire. All draw on vigor.
// =====================================================================
function updateAbilities(dt) {
  const h = state.hero, inv = state.inv;
  let wantDodge = false;
  if (!state.radial && state.swapT == null) for (const k of SLOT_KEYS) if (pressedNow[SLOT_ACTION[k]] && !state.actUsed) { const r = useSlot(k); if (r === 'dodge') wantDodge = true; }
  if (state.fSlotAbility === 'dodge') wantDodge = true;              // F holding the dodge
  state.fSlotAbility = null;
  if (wantDodge && inv.step && h.dashCool <= 0 && !h.ride && !state.pull.grip && !state.carry && spend(inv.step >= 3 ? 0.6 : 1.2)) {
    h.dashT = inv.step >= 3 ? 0.22 : 0.18; h.dashCool = inv.step >= 2 ? 0.5 : 0.85; h.invuln = Math.max(h.invuln, inv.step >= 3 ? 0.45 : 0.3);
    h.vx = h.fx * 1.2 * L(); h.vy = h.fy * 1.2 * L();
    state.dodged = false;
    sfx.dash();
  }
  // R: tap steps F through your weapons; hold opens the wheel of consumables (the world all but stops);
  // while holding, A/S/D/F switches the wheel to everything that could go in that slot. Point, then let go of R.
  if (pressedNow.swap && !state.carry) state.swapT = state.time;
  if (state.swapT != null) {
    if (held.swap()) {
      const pick = ALL_SLOTS.find(k => pressedNow[SLOT_ACTION[k]]);
      if (pick) state.radial = { slot: pick, opts: radialOptions(pick), sel: -1 };
      else if (!state.radial && state.time - state.swapT > 0.22 && radialOptions().length) state.radial = { slot: null, opts: radialOptions(), sel: -1 };
      if (state.radial) {
        const R = state.radial, cur = R.slot ? R.opts.findIndex(e => sameEntry(e, slotsOf()[R.slot])) : -1;
        if (pick && cur >= 0) R.sel = cur;                         // start on what's there now
        let x = 0, y = 0;
        if (state.radialPtr) [x, y] = state.radialPtr;
        else { if (held.up()) y -= 1; if (held.down()) y += 1; if (held.left()) x -= 1; if (held.right()) x += 1; }
        if (x || y) { const n = R.opts.length, a = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2); R.sel = Math.round(a / (Math.PI * 2 / n)) % n; }
      }
    } else {
      const r = state.radial;
      if (r) { if (r.sel >= 0) applyRadial(r); }
      else cycleEquip();
      state.radial = null; state.swapT = null; state.radialPtr = null;
    }
  }
  if (state.equip === 'acorn' && inv.acorns <= 0 && inv.sword) { state.equip = 'sword'; state.active = 'sword'; }
  // F throws whatever you hold: tap for a quick short throw (a rock is just set down ahead of you),
  // hold to wind up: longer holds throw faster, farther and harder. Rocks show where they'll land.
  const rock = state.carry === 'rock', acorn = !state.carry && state.equip === 'acorn' && inv.acorns > 0;
  if ((rock || acorn) && !state.pull.grip && !state.npcTalk) {
    // a throw only starts from a fresh press: not the press that picked the rock up, planted, talked, etc.
    if (pressedNow.act && h.z <= 0 && !state.aim.on && !state.actUsed && state.time - (state.carryT || -9) > 0.1) { state.aim.on = true; state.aim.t = 0; }
    if (state.aim.on) {
      if (held.act()) state.aim.t += dt;
      else {
        const k = Math.min(throwPower(), h.vig <= 1 ? 0.1 : 1), tap = state.aim.t < 0.18;   // spent arms can't throw hard
        state.aim.on = false; state.aim.t = 0;
        if (rock && tap) dropRock();
        else if (rock) { state.carry = null; spend(0.6 + k * 0.8) || true; launch('rock', k); refreshButtons(); }
        else if (spend(0.1 + k * 0.3)) { inv.acorns--; launch('acorn', k); state.active = 'acorn'; refreshButtons(); }
      }
    }
  } else state.aim.on = false;
  // marsh fire: breathe out gas while held, spark it on release
  const fh = state.fireHold;
  if (inv.fire && (held.fire() || slotHeld('fire')) && !state.carry && !state.pull.grip) {
    if (!fh.on) { fh.on = true; fh.emit = 0; fh.t = 0; sfx.hiss(); }
    fh.t = (fh.t || 0) + dt;
    if (h.vig > 0.3) {
      h.vig = Math.max(0, h.vig - 2.4 * dt); h.rest = state.time; train(2.4 * dt);
      const mv = maxVig();
      fh.emit += (8 + mv * 0.5) * dt;
      while (fh.emit >= 1) { fh.emit--; breathe(h, mv); }
      if (Math.random() < dt * 5) sfx.hiss();
    } else spend(99);
  } else if (fh.on) {
    fh.on = false;
    state.spark = { x: h.x + h.fx * UNIT * 1.2, y: h.y + h.fy * UNIT * 1.2, t: state.time + 0.35 };
    sfx.spark();
    spark(state.spark.x, state.spark.y, '#ffe38a', 5, 2);
  }
}
function breathe(from, mv) {
  const face = Math.atan2(from.fy, from.fx), hot = (state.inv.pepper > 0 ? 1.4 : 1) * (1 + state.inv.up.pouch * 0.15);
  const still = Math.hypot(from.vx, from.vy) < 0.04 * L();
  if (still) {
    // standing still, the cloud pools around you and swells the longer you breathe
    const grow = Math.min(2.8, 1 + state.fireHold.t * 0.35);
    const a = Math.random() * 6.28, rad = UNIT * (0.4 + Math.random() * (1 + mv * 0.03) * grow);
    const p = spawnPuff(from.x, from.y, Math.cos(a) * UNIT * 0.8, Math.sin(a) * UNIT * 0.8, UNIT * (0.7 + mv * 0.02) * rr(0.8, 1.2) * hot * Math.sqrt(grow));
    if (p) { p.anchor = true; p.ox = Math.cos(a) * rad; p.oy = Math.sin(a) * rad; }
    return;
  }
  // on the move, the gas is left behind as a trail that hangs in the air until it thins out
  const a = Math.random() * 6.28, sp = UNIT * rr(0.2, 0.7);
  const p = spawnPuff(from.x - from.vx * 0.05 + Math.cos(a) * UNIT * 0.3, from.y - from.vy * 0.05 + Math.sin(a) * UNIT * 0.3, Math.cos(a) * sp - from.vx * 0.15, Math.sin(a) * sp - from.vy * 0.15, UNIT * (0.6 + mv * 0.02) * rr(0.8, 1.15) * hot);
  if (p) p.trail = true;
}

// ---------------- projectiles (rocks, acorns) ----------------
// holding the throw winds it up over about a second: farther and harder the longer you hold
const throwPower = () => Math.min(1, state.aim.t / 1.0);
function throwParams(kind, k) {
  if (kind === 'rock') return { sp: 3 + 4.5 * k, vz: 3 + 2.5 * k, z: 1.2, g: 14 };
  const silk = state.inv.silk ? 1.35 : 1;
  return { sp: (6 + 9 * k) * silk, vz: 1.5 + 1.5 * k, z: 0.6, g: state.inv.silk ? 5 : 8 };
}
function rockLanding(h, k = throwPower()) {
  const T = throwParams('rock', k), t = (T.vz + Math.sqrt(T.vz * T.vz + 2 * T.g * T.z)) / T.g;
  const d = UNIT * (0.6 + T.sp * t);
  return [h.x + h.fx * d, h.y + h.fy * d];
}
function launch(kind, k = 1) {
  state.throwT = state.time;
  const h = state.hero, rock = kind === 'rock';
  const silk = rock ? 0 : state.inv.silk, T = throwParams(kind, k);
  const sp = UNIT * T.sp;
  let dx = h.fx, dy = h.fy;
  if (!rock) { const a = Math.atan2(h.fy, h.fx) + acornSpread(); dx = Math.cos(a); dy = Math.sin(a); skillUse('acorn'); }
  state.shots.push({ kind, x: h.x + h.fx * UNIT * 0.6, y: h.y + h.fy * UNIT * 0.6, vx: dx * sp, vy: dy * sp, z: UNIT * T.z, vz: UNIT * T.vz, g: UNIT * T.g, spin: 0, silk, hit: new Set(), force: 0.6 + 0.8 * k });
  sfx.throw();
  if (rock) state.shake = 0.1;
  if (state.bird) scareBird(h.x, h.y, 6);
}
function updateShots(dt) {
  for (let i = state.shots.length - 1; i >= 0; i--) {
    const s = state.shots[i], rock = s.kind === 'rock';
    if (!rock) steerAcorn(s, dt);
    s.x += s.vx * dt; s.y += s.vy * dt; s.vz -= s.g * dt; s.z += s.vz * dt; s.spin += dt * 12;
    let done = s.z <= 0 || s.x < -UNIT || s.x > W + UNIT || s.y < -UNIT || s.y > H + UNIT;
    if (rock && s.z <= 0) {                             // a rock that comes down on a stone, brambles, a burrow or a buried rock
      for (const o of state.solids) if (o.bar && ['cracked', 'bramble', 'burrow'].includes(o.kind) && Math.hypot(o.x - s.x, o.y - s.y) < o.r + UNIT * 0.45) { if (o.kind === 'bramble') breakBarrier(o.bar, 'rock'); else hitStone(o, s.force); break; }
      knockRocks(s.x, s.y, UNIT * 1.2);
    }
    for (const e of state.enemies) {
      if (done || s.hit.has(e) || !hittable(e) || Math.hypot(e.x - s.x, e.y - s.y) > e.r + UNIT * 0.3) continue;
      const d = Math.hypot(s.vx, s.vy) || 1;
      s.hit.add(e);
      if (!rock) skillUse('acorn', true);
      if (!rock && wears('embercharm')) { e.burn = Math.max(e.burn || 0, 2); spark(e.x, e.y, '#ffa04a', 6, 2); }   // the ember charm lights them
      damage(e, (rock ? 3 : s.silk ? 2 : 1) * s.force * power(), rock ? 'stab' : 'slash', s.vx / d, s.vy / d, s.force > 1.2 && SMALL.includes(e.type));
      if (s.silk >= 3 && !e.dead) { e.mode = 'stunned'; e.t = 1.2; }
      if (!(s.silk >= 2)) done = true;
    }
    if (!done) for (const o of state.solids) {        // high throws sail over low stones; thickets and boulder piles stand tall
      if (s.z > UNIT * (o.bar ? 3 : ['tree', 'deadtree'].includes(o.kind) ? 2.6 : o.kind === 'stone' ? 0.45 : 0.7)) continue;   // trees and thickets stand tall; ring stones are low
      if (Math.hypot(o.x - s.x, o.y - s.y) > o.r + UNIT * 0.2) continue;
      if (rock && o.bar && o.kind === 'bramble') breakBarrier(o.bar, 'rock');
      else if (rock && o.bar && (o.kind === 'cracked' || o.kind === 'burrow')) hitStone(o, s.force);
      else if (o.kind === 'tree') { state.treeShake[o.key] = state.time; sfx.rustle(); if (rock || rng() < 0.35) dropAcorn(o); if (!rock) sfx.tock(); }
      else if (!rock) sfx.tock();
      s.x -= s.vx * dt * 2; s.y -= s.vy * dt * 2;
      done = true; break;
    }
    if (state.bird && Math.hypot(state.bird.x - s.x, state.bird.y - s.y) < UNIT * 2) scareBird(s.x, s.y, 3);
    if (done) {
      state.shots.splice(i, 1);
      if (rock && inMud(s.x, s.y)) sinkRock(s.x, s.y);     // short of the mark and into the mud: stuck
      else if (rock && earthen(s.x, s.y) && Math.random() < 0.2) sinkRock(s.x, s.y, 'earth');   // or it digs into soft ground
      else if (rock) { state.items.push({ type: 'bigrock', x: Math.max(UNIT, Math.min(W - UNIT, s.x)), y: Math.max(UNIT, Math.min(H - UNIT, s.y)) }); sfx.crash(); state.shake = 0.2; spark(s.x, s.y, '#8a7a6a', 8, 2.5); }
      else if (Math.random() < 0.35) state.items.push({ type: 'acorn', x: s.x, y: s.y });
      if (state.scene === 'start' && rock && !broken('start', 'thicket')) say('Maybe if it hit the thicket...', s.x, s.y - UNIT, { key: 'rockhint', life: 2.5, tip: 'rockhint' });
      if (state.scene === 'w3' && rock && !broken('w3', 'swordthorns')) say('Thorns. A thrown rock broke the last lot.', s.x, s.y - UNIT, { key: 'rockhint3', life: 2.5, tip: 'rockhint3' });
    }
  }
}

// ---------------- marsh fire: a cloud of gas that catches and spreads ----------------
function spawnPuff(x, y, vx, vy, rMax) {
  if (state.gas.length > 170) return null;
  const p = { x, y, vx, vy, r: UNIT * 0.2, rMax, age: 0, life: rr(9, 13), ign: null, burn: 0, burnDur: rr(1.2, 2.0) };
  state.gas.push(p);
  return p;
}
function windNow() {
  const sc = sceneDef();
  if (sc.gusts) { const [wx, wy] = gustVec(); const k = 0.1 + state.gust * 0.5; return [wx * k * L(), wy * k * L()]; }
  if (sc.breeze) return [Math.sin(state.time * 0.1) * sc.breeze * L(), sc.breeze * 0.3 * L()];
  return [0, 0];
}
function updateGas(dt) {
  if (!state.gas.length && !state.spark) return;
  const [wx, wy] = windNow(), wmag = Math.hypot(wx, wy) / L();
  if (state.spark && state.time >= state.spark.t) {
    const sp = state.spark; state.spark = null;
    let best = null, bd = UNIT * 2.8;
    for (const p of state.gas) { const d = Math.hypot(p.x - sp.x, p.y - sp.y) - p.r; if (!p.burn && d < bd) { bd = d; best = p; } }
    if (best) { best.ign = state.time; sfx.whumpf(); zoomPulse(best.x, best.y, 'hit'); }
    else say(wmag > 0.05 ? 'The wind scattered the gas.' : 'Fizzle. Nothing to light.', sp.x, sp.y - UNIT, { key: 'fizzle', life: 1.8 });
  }
  const burning = [];
  for (let i = state.gas.length - 1; i >= 0; i--) {
    const p = state.gas[i];
    p.age += dt * (1 + wmag * 6);               // wind thins the cloud fast
    const k = Math.exp(-2 * dt);
    p.vx *= k; p.vy *= k;
    if (p.anchor) {                                 // a still breather's cloud stays with them, lit or not
      const h = state.hero, ax = h.x + p.ox - p.x, ay = h.y + p.oy - p.y;
      p.vx += ax * 4 * dt; p.vy += ay * 4 * dt;
      if (p.burn && !p.auraSet) { p.auraSet = true; p.burnDur *= 1.8; }
    }
    p.x += (p.vx + wx) * dt; p.y += (p.vy + wy) * dt;
    if (!p.burn) { p.rMax += UNIT * 0.08 * dt; p.r += (p.rMax - p.r) * (1 - Math.exp(-2 * dt)); }
    if (p.ign != null && !p.burn && state.time >= p.ign) p.burn = 0.001;
    if (p.burn) {
      p.burn += dt * (1 + wmag * 4);
      burning.push(p);
      if (Math.random() < dt * 8) state.fx.push({ x: p.x + (Math.random() - 0.5) * p.r, y: p.y, vx: wx * 0.5, vy: -UNIT * 1.5, t: 0, life: 0.6, color: Math.random() < 0.5 ? '#ffb347' : '#ff7a2a' });
      if (p.burn > p.burnDur) { state.gas.splice(i, 1); state.fx.push({ x: p.x, y: p.y, vx: wx * 0.3, vy: -UNIT * 0.5, t: 0, life: 1.4, color: 'smoke', size: p.r }); }
    } else if (p.age > p.life) state.gas.splice(i, 1);
  }
  if (!burning.length) return;
  if (Math.random() < dt * 3) sfx.crackle();
  for (const b of burning) {
    for (const p of state.gas) if (!p.burn && p.ign == null && Math.hypot(p.x - b.x, p.y - b.y) < (p.r + b.r) * 0.8) p.ign = state.time + rr(0.1, 0.25);
    for (const e of state.enemies) {
      if (!hittable(e) || (e.burnCool || 0) > state.time || Math.hypot(e.x - b.x, e.y - b.y) > b.r + e.r) continue;
      e.burnCool = state.time + 0.5;
      e.burn = Math.min(e.type === 'warden' ? 2 : 8, (e.burn || 0) + (state.inv.pepper > 0 ? 1.8 : 1.2) * (1 + state.inv.up.pouch * 0.25));   // it clings; more fire, longer panic
      damage(e, 1, 'fire', 0, 0);
    }
    for (const s of state.solids) if (s.bar && ['reeds', 'web', 'vine'].includes(s.kind) && Math.hypot(s.x - b.x, s.y - b.y) < b.r + s.r) { breakBarrier(s.bar, 'fire'); break; }
    for (const w of state.webs) if (!w.burn && Math.hypot(w.x - b.x, w.y - b.y) < w.r + b.r) igniteWeb(w);
    if (state.bird) scareBird(b.x, b.y, 4);
  }
}

// =====================================================================
// Cutscenes: intro storm, sword, toad, faint, ending
// =====================================================================
function startIntro() {
  state.night = 0; state.rain = 0; state.clouds2 = 0; state.fireLit = 1;
  rtFor('camp').flags.built_tent = true;               // Pip already pitched the tent at the camp spot
  if (state.scene !== 'riverbank') enterScene('riverbank');
  placeOldJetty(sceneDef());
  const [jx, jy, dx, dy] = sceneDef().feat.oldJetty, h = state.hero;
  { const sc = sceneDef(), fx = jx - dx * 1.2 * UNIT / W, fy = jy - dy * 1.2 * UNIT / H;   // nothing buried at the jetty's foot: that's where you stand
    sc.solids = sc.solids.filter(s => Math.hypot((s.fx - fx) * W, (s.fy - fy) * H) > UNIT * 2.6); refreshSceneGeometry(); }
  h.x = (jx - dx * 0.7 * UNIT / W) * W; h.y = (jy - dy * 0.7 * UNIT / H) * H; h.fx = dx; h.fy = dy; h.side = dx < 0 ? -1 : 1;   // on the bank at the jetty's foot, facing the water
  state.pip = { x: h.x - dx * UNIT * 0.9 - dy * UNIT * 1.0, y: h.y - dy * UNIT * 0.9 + dx * UNIT * 1.0, show: true, follow: true, side: -1 };
  for (let k = 0; k < 6; k++) collideSolids(state.pip, UNIT * 0.45);   // not inside (or behind) a rock at the jetty's foot
  state.intro = { step: 0, gone: false };              // not a cutscene: you can wander the bank while Pip talks
  setMusic('forest'); setAmbience('rain');
}
// The opening, mid-conversation on the old jetty. Each of Pip's lines waits until you've read it (action key);
// the screen edges stay closed until Pip is done and heads south. Then Pip wanders off the bottom of the
// screen and waits for you by the garden.
const INTRO_LINES = [
  '...no, LISTEN. Old Wick says the river runs to a pool so shiny it hurts your eyes!',
  'And past the woods? Treasure. Actual, real, heavy treasure!',
  'We\'re gonna need snacks. SO many snacks. Come on, my garden\'s just south!',
];
function updateIntro(dt) {
  const c = state.intro, p = state.pip, h = state.hero;
  if (!c) return;
  const finish = () => { state.intro = null; if (p) p.show = false; state.inv.story = Math.max(state.inv.story || 0, STORY.garden); };   // never winds the story back
  if (state.scene !== 'riverbank') { finish(); return; }
  if (!c.gone) {
    // while talking, Pip can't stand still: little wanders around the bank near where you started, pausing now and then
    if (!c.home) c.home = [p.x, p.y];
    if (c.wt && state.time - c.wtT > 3.5) c.wt = null;   // couldn't get there (a rock, the water's edge): pick somewhere else
    if (!c.wt || Math.hypot(p.x - c.wt[0], p.y - c.wt[1]) < UNIT * 0.2) {
      if (!c.pause) c.pause = state.time + 0.4 + Math.random() * 1.2;
      if (state.time > c.pause) { const a = Math.random() * 6.28, r = UNIT * (0.8 + Math.random() * 1.6); c.wt = [c.home[0] + Math.cos(a) * r, c.home[1] + Math.sin(a) * r * 0.7]; c.wtT = state.time; c.pause = 0; }
    }
    if (c.wt) {
      const dx = c.wt[0] - p.x, dy = c.wt[1] - p.y, d = Math.hypot(dx, dy);
      if (d > UNIT * 0.2) { const sp = Math.min(d, L() * sceneDef().speed * 0.55 * dt), ox = p.x, oy = p.y; p.x += dx / d * sp; p.y += dy / d * sp;
        if (isChasm(p.x, p.y, UNIT * 0.3)) { p.x = ox; p.y = oy; c.wt = null; c.pause = 0; }                 // not into the river
        collideSolids(p, UNIT * 0.38); clampTo(p, UNIT * 0.6); }
      p.side = Math.abs(dx) > UNIT * 0.2 ? (dx > 0 ? 1 : -1) : (h.x > p.x ? 1 : -1);
    } else p.side = h.x > p.x ? 1 : -1;
    if (heldText() || state.time - (state.dismissedAt || -9) < 0.35) return;
    if (c.step < INTRO_LINES.length) { say(INTRO_LINES[c.step], p.x, p.y - UNIT * 1.3, { key: 'npc', who: 'pip', color: '#bfe4ff' }); c.step++; }
    else { c.gone = true; c.t0 = state.time; }
    return;
  }
  const tx = W * 0.5, ty = H + UNIT * 1.2, dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, sp = L() * sceneDef().speed * 1.5 * dt;   // off at a run for the garden
  p.x += dx / d * sp; p.y += dy / d * sp; p.side = dx > 0 ? 1 : -1;
  collideSolids(p, UNIT * 0.38);
  if (p.y > H + UNIT * 0.6 || state.time - c.t0 > 12) finish();
}
// Pip's waiting spot by the garden: a step to the side of the first patch of rich soil
function gardenSpot() { const q = WORLD.meadow.feat.plots[0]; return [q[0] * W + UNIT * 1.25, q[1] * H - UNIT * 0.15]; }
// ---------------- Pip, before the gremlins: a step ahead of you, showing the way and explaining things ----------------
// Pip is with you everywhere until the gremlins strike, and always leads toward the woods
function pipWithYou() {
  const inv = state.inv, sc = WORLD[state.scene];
  return !ARENA && !PUZZLE && state.started && !inv.pipTaken && !inv.pipSaved && !inv.sword && !!sc && (sc.area !== 'indoor' || sc.id === 'tentin') && sc.area !== 'cave';   // Pip comes into the tent too
}
function pipExit(sc) {                                // where Pip is heading: the garden, then the camp spot, then the woods gate
  const inv = state.inv;
  if (!storyAt('tocamp') || (storyAt('gather') && !campDone())) return null;   // practising in the garden, or out gathering: Pip just keeps you company
  const goal = storyAt('adventure') ? 'w2' : 'camp';
  if (sc.id === goal) return null;
  let best = null, bd = screensBetween(sc.id, goal);
  for (const ex of sc.exits) { const d = screensBetween(ex.to, goal); if (d < bd && !(ex.locked && ex.locked())) { bd = d; best = ex; } }
  return best || null;
}
function placePipNearHero() {
  const old = state.pip && state.pip.visit;          // left before Pip got to say it: Pip can say it next time
  if (old && !old.said && state.inv.pipTips) delete state.inv.pipTips[old.key];
  // placed a few steps ahead of you toward where we're going (never behind you, so he never has to run around you)
  const h = state.hero, sc0 = sceneDef(), ex = sc0 && pipExit(sc0), [gx, gy] = ex ? edgePoint(ex.side, (ex.a + ex.b) / 2).map((v, i) => v * (i ? H : W)) : [h.x + h.fx * UNIT * 3, h.y + h.fy * UNIT * 3];
  const ddx = gx - h.x, ddy = gy - h.y, dd = Math.hypot(ddx, ddy) || 1, k0 = Math.min(dd, UNIT * 2.5);
  const bx = h.x + ddx / dd * k0 - ddy / dd * UNIT * 0.9, by = h.y + ddy / dd * k0 + ddx / dd * UNIT * 0.9;
  state.pip = { x: Math.max(UNIT, Math.min(W - UNIT, bx)), y: Math.max(UNIT, Math.min(H - UNIT, by)), show: true, follow: true };
}
// Pip's lines. The few that open the game and teach the garden wait for you to read them (PIP_HOLD); everything
// else is a light aside that fades on its own, and Pip leaves a good gap between them (PIP_GAP seconds).
const PIP_HOLD = new Set([]);                        // (the opening on the jetty is the only speech that waits; it isn't a pipSay)
const PIP_GAP = 8;
const CROP_PULL = [1.1, 0.8, 0.55, 0.35, 0.15];         // seconds of holding F to pull a crop, by farming level
// Reminders during the early game. If what Pip last suggested hasn't happened after a while, Pip walks to something
// that helps (the robin, a patch, the next exit, a stick you still need) and says it a new way. Each situation has a
// handful of phrasings, used in turn, never the same one twice running; the wait grows a little each time.
function remindNow(sc, h) {
  const inv = state.inv, f = sc.feat, P = q => [q[0] * W, q[1] * H], seeds = inv.bag.turnipseed || 0;
  if (sc.id === 'meadow' && inv.story === STORY.garden) {
    if (!seeds) { const b = state.bird, rb = b && b.mode === 'perch' ? [b.x, b.y + UNIT] : hollowPoint(), n = (state.remind && state.remind.n) || 0;
      const at = [rb, [(rb[0] + h.x) / 2, (rb[1] + h.y) / 2], [hollowPoint()[0], hollowPoint()[1] + UNIT * 1.2]][n % 3];   // by the robin, halfway to you, by its tree
      return { key: 'robin', at, lines: ['The robin drops seeds when you startle it. Run right at it!', 'Robin\'s back! Sneak close, then dash!', 'No seeds yet? That robin has plenty.', 'If it hides in its tree, jump and stomp by the trunk!', 'Go on, give the robin a scare!'] }; }
    const q = f.plots && f.plots.find((pl, i) => !((rtFor('meadow').flags.plots || [])[i] || {}).s);
    if (q) return { key: 'plant', at: P(q), lines: ['This patch is empty. Pop a seed in!', 'Right here! The dirt wants those seeds.', 'Stand on the soil and plant one.', 'Seeds do best in the ground, not your pocket!'] };
  }
  if (inv.story === STORY.tocamp || (storyAt('gather') && !campDone())) {
    const miss = campMissing(), want = Object.keys(miss);
    const it = state.items.filter(i => want.includes(i.type)).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    const NAME = { stone: 'smooth stone', stick: 'stick', fluff: 'tuft of fluff' };
    if (it) return { key: 'item-' + it.type, at: [it.x, it.y], lines: [`Here's a good ${NAME[it.type]}!`, `Grab this ${NAME[it.type]}!`, `Look, a ${NAME[it.type]}. We need that.`, `Don't miss this ${NAME[it.type]}!`] };
    const ex = pipExit(sc);
    if (ex) { const e = edgePoint(ex.side, (ex.a + ex.b) / 2), at = [e[0] * W - (ex.side === 'e' ? UNIT * 1.5 : ex.side === 'w' ? -UNIT * 1.5 : 0), e[1] * H - (ex.side === 's' ? UNIT * 1.5 : ex.side === 'n' ? -UNIT * 1.5 : 0)];
      return { key: 'exit-' + sc.id, at, lines: ['This way!', 'Let\'s try over here.', 'Follow me, it\'s not far.', 'Onward! Through here.'] }; }
  }
  return null;
}
function pipRemind(sc, p, h) {
  const inv = state.inv, R = state.remind || (state.remind = { t: state.time, i: {}, last: null, n: 0 });
  const prog = [inv.story, inv.bag.turnipseed || 0, ((rtFor('meadow').flags.plots) || []).filter(q => q.s).length, JSON.stringify(campHave()), sc.id].join('|');
  if (prog !== R.prog) {                              // something happened: start the clock again, and anything Pip was
    if (R.prog) for (const t of state.texts) if ((t.key === 'pip' || t.who === 'pip') && !t.hold && t.t > 0.3) { t.life = Math.min(t.life, t.t + 0.35); t.more = []; }   // urging you to do is done: it goes
    if (R.prog && p.visit && p.visit.key === 'remind') p.visit = null;
    R.prog = prog; R.t = state.time; R.n = 0; return;
  }
  if (p.visit || speakingNow() || state.time - (state.pipTalkT || -9) < PIP_GAP) return;
  if (state.time - R.t < 16 + R.n * 6) return;
  const r = remindNow(sc, h); if (!r) return;
  const k = R.i[r.key] = ((R.i[r.key] ?? -1) + 1) % r.lines.length;
  let line = r.lines[k]; if (line === R.last) line = r.lines[(k + 1) % r.lines.length];
  R.last = line; R.t = state.time; R.n++; state.pipTalkT = state.time;
  p.visit = { x: r.at[0], y: r.at[1], t0: state.time, text: line, key: 'remind', site: { x: r.at[0], y: r.at[1], r: 9 } };
}
function pipSay(key, text, at, sight = 7, site = null) {
  const tips = state.inv.pipTips || (state.inv.pipTips = {}), p = state.pip;
  if (tips[key] || p.visit || state.time - (state.pipTalkT || -9) < (PIP_HOLD.has(key) ? 2.2 : PIP_GAP) || speakingNow()) return false;
  if (at && Math.hypot(state.hero.x - at[0], state.hero.y - at[1]) > UNIT * sight) return false;   // wait until you're near enough to see it
  tips[key] = true; state.pipTalkT = state.time;
  if (at) { p.visit = { x: at[0], y: at[1], t0: state.time, text, key, site: site || { x: at[0], y: at[1], r: 8 } }; return true; }   // go over there first
  say(text, p.x, p.y - UNIT * 1.3, { key: 'pip', color: '#bfe4ff', site, hold: PIP_HOLD.has(key) ? undefined : false, size: PIP_HOLD.has(key) ? 1 : 0.9 });
  return true;
}
// out gathering for the camp: on a screen with camp materials (or off the usual paths), Pip says whether this
// place has given what it can, or what's still missing. Said again only when the answer changes.
const CAMP_NEED = { stone: 2, stick: 2, fluff: 3 };   // fire ring: 2 stones + a stick; bench: a stick, glue (2 fluff) and a fluff cushion
function campMissing() { const c = campHave(), out = {}; for (const [k, n] of Object.entries(CAMP_NEED)) if (c[k] < n) out[k] = n - c[k]; return out; }
function needWords(miss) {
  const w = { stone: n => `${n} smooth stone${n > 1 ? 's' : ''}`, stick: n => `${n} stick${n > 1 ? 's' : ''}`, fluff: n => `${n} tuft${n > 1 ? 's' : ''} of rabbit fluff` };
  const parts = Object.entries(miss).map(([k, n]) => w[k](n));
  return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];
}
function pipGatherTalk(sc, p) {
  if (sc.id === 'camp' || sc.id === 'tentin' || p.visit) return;
  const local = new Set((sc.initItems || []).map(o => o.type).filter(t => t in CAMP_NEED));
  if ((sc.spawns || []).some(o => o.type === 'rabbit')) local.add('fluff');
  const home = ['start', 'meadow', 'w1', 'w2', 'riverbank', 'f1', 'f2'];
  const miss = campMissing(), left = Object.keys(miss), here = left.filter(k => local.has(k));
  if (left.length && !local.size && home.includes(sc.id)) return;   // nothing to gather here and not lost: nothing to say
  const text = !left.length ? 'That\'s everything! Back to camp.'
    : local.size && !here.length ? `We have what we need from here. Still need ${needWords(miss)}.`
    : `Let's keep looking around. Still need ${needWords(miss)}.`;
  const key = left.length ? sc.id + '|' + text : 'all';        // "everything" is said once, wherever you are
  if (state.pipGatherKey === key || state.time - (state.pipTalkT || -9) < PIP_GAP || speakingNow()) return;
  state.pipGatherKey = key; state.pipTalkT = state.time;
  say(text, p.x, p.y - UNIT * 1.3, { key: 'pip', color: '#bfe4ff', hold: false, size: 0.9 });
}
// Pip's spot beside something: on the side facing you, a step away from it
function pipBeside(v) {
  const h = state.hero, dx = h.x - v.x, dy = h.y - v.y, d = Math.hypot(dx, dy) || 1;
  return [v.x + dx / d * UNIT * 1.3, v.y + dy / d * UNIT * 1.3];
}
// Pip gets excited: now and then while he's talking (more often on a line that ends in "!", and when he calls you
// over) he bounces on the spot, one to three quick hops. His speech bubble stays put.
function pipBounce(dt) {
  const p = state.pip; if (!p || !p.show) return;
  const mine = state.texts.filter(t => t.key === 'pip' || t.who === 'pip');
  for (const t of mine) if (!t.bounced) { t.bounced = true; if (Math.random() < (/!/.test(t.text) ? 0.6 : 0.2)) p.hop = { t: 0, n: 1 + Math.floor(Math.random() * 3) }; }
  if (!p.hop && mine.length && Math.random() < dt * 0.15) p.hop = { t: 0, n: 1 + Math.floor(Math.random() * 2) };
  if (p.hop) {
    p.hop.t += dt; const per = 0.26, k = p.hop.t / per;
    if (k >= p.hop.n) { p.hop = null; p.bz = 0; } else p.bz = Math.abs(Math.sin(Math.PI * (k % 1))) * UNIT * (0.3 + 0.08 * Math.sin(k * 5));
  }
}
function updatePip(dt) {
  pipBounce(dt);
  if (state.intro) { updateIntro(dt); return; }
  if (!pipWithYou()) { if (state.pip && state.pip.follow) state.pip.show = false; return; }
  const garden = state.inv.story === STORY.garden;     // Pip went ahead and is waiting by the garden, and stays there
  if (garden && state.scene !== 'meadow') { if (state.pip) state.pip.show = false; return; }
  if (garden && (!state.pip || !state.pip.show || !state.pip.atGarden)) { const [gx, gy] = gardenSpot(); state.pip = { x: gx, y: gy, show: true, follow: true, side: -1, atGarden: true }; }
  if (!state.pip || !state.pip.follow || !state.pip.show) placePipNearHero();
  const p = state.pip, h = state.hero, sc = sceneDef(), rt = rtFor(sc.id);
  // lead: stand a couple of steps from you, toward where we're going
  const ex = sc.id === 'w2' ? null : pipExit(sc), [gx, gy] = ex ? edgePoint(ex.side, (ex.a + ex.b) / 2).map((v, i) => v * (i ? H : W)) : [W / 2, H / 2];
  // Pip leads: out in front along the way to the exit, on one side of your line (his lane), and never loops around you.
  // Already a few steps ahead of you and roughly on the way? He waits there. Fallen behind (you ran past)? He
  // runs up his own side to get in front again.
  const dx = gx - h.x, dy = gy - h.y, dl = Math.hypot(dx, dy) || 1, lead = Math.min(dl, UNIT * 4.2), ux = dx / dl, uy = dy / dl;
  const ppx = p.x - h.x, ppy = p.y - h.y, along = ppx * ux + ppy * uy, side = -ppx * uy + ppy * ux;
  if (p.lane == null || Math.abs(side) > UNIT * 0.6) p.lane = side >= 0 ? 1 : -1;
  const waiting = along > Math.min(lead, UNIT * 3.4) - UNIT * 0.3 && along < UNIT * 9 && Math.abs(side) < UNIT * 4;   // up ahead and roughly on the way: he waits, even if you wander a bit
  if (waiting && !p.waitAt) p.waitAt = [p.x, p.y]; else if (!waiting) p.waitAt = null;
  // never standing still: waiting up ahead (or at his garden post) he paces and potters about the spot
  const pot = k => [Math.cos(state.time * 0.8 + k) * UNIT * 0.7 + Math.cos(state.time * 1.9 + k * 2) * UNIT * 0.2, Math.sin(state.time * 1.1 + k) * UNIT * 0.4];
  let tx = waiting ? p.waitAt[0] + pot(1)[0] : h.x + ux * lead - uy * p.lane * UNIT * 0.9, ty = waiting ? p.waitAt[1] + pot(1)[1] : h.y + uy * lead + ux * p.lane * UNIT * 0.9;
  if (garden && !p.visit) { const g = gardenSpot(), o = pot(3); tx = g[0] + o[0]; ty = g[1] + o[1]; }   // Pip's post is the garden (a reminder can take him off it)
  // Early on, if you don't follow, Pip goes on ahead: after a while he walks right off the screen, then pops back in
  // from that side to hurry you up, and heads off again. Only when there's somewhere to lead you (the way to camp,
  // or the way on while gathering).
  const early = state.inv.story === STORY.tocamp || (storyAt('gather') && !campDone());
  const L0 = p.lead || (p.lead = { best: dl, idle: 0, n: 0 });
  if (!early || !ex || p.visit || garden) { L0.idle = 0; L0.best = dl; }
  else if (dl < L0.best - UNIT) { L0.best = dl; L0.idle = 0; L0.phase = null; }
  else if (!speakingNow()) L0.idle += dt;
  if (early && ex && !p.visit && !garden) {
    const [ox, oy] = [gx + ux * UNIT * 3, gy + uy * UNIT * 3];                         // just past the exit, off the screen
    if (!L0.phase && L0.idle > 9) { L0.phase = 'going'; say(['I\'ll go on ahead!', 'This way! Come on!', 'Follow me!'][L0.n % 3], p.x, p.y - UNIT * 1.3, { key: 'pip', hold: false, color: '#bfe4ff' }); }
    if (L0.phase === 'going') { tx = ox; ty = oy; if (p.x < -UNIT || p.x > W + UNIT || p.y < -UNIT || p.y > H + UNIT) { L0.phase = 'away'; L0.t = state.time; } }
    if (L0.phase === 'away') { tx = ox; ty = oy; if (state.time - L0.t > 6) {                      // back in to hurry you along
      L0.phase = 'back'; L0.n++; p.x = gx + ux * UNIT * 0.8; p.y = gy + uy * UNIT * 0.8; p.waitAt = null;
      say(['Hurry up, slowpoke!', 'Come ON! It\'s this way!', 'Are you coming or not?', 'I\'m not getting any younger!'][(L0.n - 1) % 4], p.x - ux * UNIT * 2, p.y - uy * UNIT * 2 - UNIT * 1.3, { key: 'pip', hold: false, color: '#bfe4ff' });
      p.hop = { t: 0, n: 3 }; } }
    if (L0.phase === 'back') { tx = gx - ux * UNIT * 2.5; ty = gy - uy * UNIT * 2.5; if (Math.hypot(p.x - tx, p.y - ty) < UNIT * 0.6) { L0.phase = null; L0.idle = 0; } }
  }
  const v = p.visit;
  if (v) {                                            // walking over to point something out, then waiting there for you
    [tx, ty] = v.spot || pipBeside(v);
    const there = Math.hypot(p.x - tx, p.y - ty) < UNIT * 0.9;
    if (!v.said && (there || state.time - v.t0 > 2)) {
      v.said = state.time; v.spot = [p.x, p.y];      // this is where Pip stays
      say(v.text, p.x, p.y - UNIT * 1.3, { key: 'pip', color: '#bfe4ff', site: v.site, hold: PIP_HOLD.has(v.key) ? undefined : false, size: PIP_HOLD.has(v.key) ? 1 : 0.9 });
      p.side = v.x > p.x ? 1 : -1;
    }
    if (v.said) {
      const close = Math.hypot(h.x - p.x, h.y - p.y) < UNIT * 2.6;
      const reading = state.texts.some(t => t.hold && t.key === 'pip');
      if (close && state.time - v.said > 0.8 && !reading) { p.visit = null; state.pipTalkT = state.time; }   // you came over and read it: carry on together
      else if (v.key === 'remind' && state.time - v.said > 12) p.visit = null;                          // a reminder doesn't wait forever
      else if (!close && state.time - (v.call || v.said) > 7 && !speakingNow()) {                // still waiting: a nudge now and then
        v.call = state.time; state.pipCalls = (state.pipCalls || 0) + 1; say(['Over here!', 'This way!', 'Come see!', 'Psst! Here!', 'Hey! Over here!'][(state.pipCalls - 1) % 5], p.x, p.y - UNIT * 1.3, { key: 'pip', life: 1.8, color: '#bfe4ff', hold: false });
      }
    }
  }
  const mx = tx - p.x, my = ty - p.y, md = Math.hypot(mx, my);
  if (md > UNIT * ((waiting || garden) && !p.visit ? 0.04 : 0.3)) {   // pottering: small steps count too
    const sp = Math.min(md * 4, L() * sc.speed * (p.visit ? 1.2 : md > UNIT * 5 ? 1.35 : 1.0)) * dt, nx = p.x + mx / md * sp, ny = p.y + my / md * sp;   // walks, never dashes about
    if (!isChasm(nx, ny)) { p.x = nx; p.y = ny; }
    p.side = mx > 0 ? 1 : -1;
  }
  const offRoad = p.lead && (p.lead.phase === 'going' || p.lead.phase === 'away');
  if (!offRoad) { collideSolids(p, UNIT * 0.38); clampTo(p, UNIT * 0.5); }   // (heading off the screen: no clamping)
  if (garden || (waiting && !p.visit)) p.side = h.x > p.x ? 1 : -1;   // waiting up ahead: looking back at you
  p.stuck = md > UNIT * 0.5 && Math.hypot(p.x - (p.lx ?? p.x), p.y - (p.ly ?? p.y)) < 0.5 ? (p.stuck || 0) + dt : 0; p.lx = p.x; p.ly = p.y;
  if (!p.visit && !garden && !offRoad && (p.stuck > 1.5 || Math.hypot(p.x - h.x, p.y - h.y) > UNIT * 14)) placePipNearHero();   // only if truly stuck or lost: no popping in from nowhere
  const home = ['camp', 'start', 'meadow', 'w1', 'w2', 'riverbank', 'f1', 'f2'];
  const gathering = storyAt('gather') && !campDone();
  if (gathering) pipGatherTalk(sc, p);
  else if (!home.includes(sc.id) && !rt.flags.pipOff) { rt.flags.pipOff = true; state.pipTalkT = -9; pipSay('off-' + sc.id, 'The woods are the other way.'); }
  // what Pip explains, once each, as it comes up
  const near = (fx, fy, r) => Math.hypot(h.x - fx * W, h.y - fy * H) < UNIT * r, f = sc.feat, inv = state.inv;
  const P = q => [q[0] * W, q[1] * H], raw = rawOf(), known = inv.known || {};
  // the garden: plant your three seeds in the rich soil, then Pip has a place to show you
  pipRemind(sc, p, h);                                 // no progress for a while: a fresh nudge, from a new spot
  if (sc.id === 'meadow' && inv.story === STORY.garden) {
    const plot = f.plots && f.plots[0], b = state.bird, seeds = inv.bag.turnipseed || 0;
    const nearPip = Math.hypot(h.x - p.x, h.y - p.y) < UNIT * 7;   // Pip stays put and calls things out from the garden
    // Pip opens with the quest's first step (gather seeds), then the garden once you have some. Nothing else first.
    if (!seeds && !(inv.pipTips || {})['garden-open']) pipSay('garden-open', 'My garden! First we need seeds. The robin drops them when you startle it. Run right at it!', null, 7, { x: p.x, y: p.y, r: 14 });
    if (!seeds && b && b.mode === 'perch' && nearPip && (inv.pipTips || {})['garden-open']) pipSay('robin-lesson', 'There it is, on its perch. Go on, give it a scare!');
    if (seeds && plot && nearPip) pipSay('plots', 'I like to sprinkle seeds in this rich dirt. You can grow all kinds of stuff!', null, 7, { x: plot[0] * W, y: plot[1] * H, r: 9 });
    if (!seeds && b && b.mode === 'home') { p.robinHide = (p.robinHide || 0) + 1 / 60; if (p.robinHide > 5) pipSay('stomp', `It's hiding in its tree! Jump and stomp, ${K.jump} then ${K.act}, right by the trunk.`); } else if (b) p.robinHide = 0;
    const atPlots = plot && Math.hypot(h.x - plot[0] * W, h.y - plot[1] * H) < UNIT * 4;          // said at the site, and only while it's the thing in front of you
    if (seeds && inv.firstBirdSeed && atPlots) pipSay('firstseed', 'Stand over here and shove them in the dirt! They love this stuff.', null, 7, { x: plot[0] * W, y: plot[1] * H, r: 6 });
    const planted0 = (rt.flags.plots || []).filter(p => p.s === 1).length;
    if (planted0 === 1 && !seeds) pipSay('again', 'One more! The robin always comes back.');
    const planted = (rt.flags.plots || []).filter(p => p.s === 1).length;
    if (planted >= Math.min(2, f.plots.length)) inv.story = STORY.tocamp;   // the lesson's done, whatever Pip is busy saying
  }
  if (sc.id === 'meadow' && inv.story === STORY.tocamp) {
    if (p.visit && !p.visit.said) p.visit = null;        // drop anything half-said: this is the news
    p.atGarden = false;
    pipSay('tocamp', 'They\'ll grow while we\'re out. Now... I found the most AWESOME spot for a camp. Follow me!');
  }
  if (sc.id === 'camp') {
    const spot = p2 => (f.buildSpots || []).find(b => b.piece === p2);
    if (inv.story === STORY.tocamp) { if (pipSay('tada', 'TA-DA! Best spot in the whole world. I built us a lean-to! It mostly stays up.')) inv.story = STORY.gather; }
    else if (storyAt('gather') && !campDone()) {
      // Pip walks to the next mark still to build and says, in a line, what goes there and what it takes, or that you
      // have it all and how to make it, or where to set it down. What he says changes as you gather and craft.
      const pc = ['fire', 'bench'].find(q => !campBuilt(q)), b = pc && spot(pc);
      if (b) {
        const at = P([b.fx, b.fy]), NAME = { fire: 'fire ring', bench: 'workbench' }, n = k => raw[k] || 0;
        const glueOK = n('glue') >= 1 || n('fluff') >= 2;
        const need = pc === 'fire' ? { 'smooth stone': 2 - n('stone'), stick: 1 - n('stick') } : { stick: 1 - n('stick'), 'fluff': (n('glue') ? 1 : 3) - n('fluff') };
        const miss = Object.entries(need).filter(([, v]) => v > 0).map(([k, v]) => k === 'fluff' ? `${v} tuft${v > 1 ? 's' : ''} of fluff` : `${v} ${k}${v > 1 ? 's' : ''}`);
        let key, line;
        if (n(PIECE_OF[pc]) > 0) { key = 'set'; line = `Set the ${NAME[pc]} down right here!`; }
        else if (!miss.length && pc === 'bench' && !n('glue')) { key = 'glue'; line = `Glue first: two fluff on the Craft mat (${K.menu.toUpperCase()}).`; }
        else if (!miss.length) { key = 'craft'; line = pc === 'fire' ? `You've got it! Craft: two stones and a stick (${K.menu.toUpperCase()}).` : `You've got it! Craft: a stick, glue and fluff (${K.menu.toUpperCase()}).`; }
        else { key = 'need-' + miss.join(','); line = `${NAME[pc][0].toUpperCase() + NAME[pc].slice(1)} goes here. Still need ${miss.join(' and ')}.`; }
        pipSay('camp-' + pc + '-' + key, line, at, 14, { x: at[0], y: at[1], r: 7 });
      }
      if (Object.keys(inv.pipTips || {}).some(k => k.startsWith('camp-'))) pipSay('tentin', 'My book in the tent explains stuff.', P([0.33, 0.33]), 14);
    } else if (campDone() && !storyAt('adventure') && !state.cut) { if (pipSay('campdone', 'Home base! We did it! Here, I found this feather. It\'s for you.')) gainGear('feather'); if (!p.duskT) p.duskT = state.time; if (state.time - p.duskT > 3) startDusk(); }
    if (campDone() && f.shroom && near(...f.shroom, 4.5)) pipSay('shroom', 'That mushroom hums at night.', P(f.shroom));
  }
  if (inv.acorns > 0 && !storyAt('adventure') && inv.quests && inv.quests.garden && inv.quests.garden.done != null) pipSay('compost', 'Get enough of those acorns, and you can make some awesome compost!');
  if (sc.id === 'tentin' && f.chest) pipSay('chest', 'There are a couple of seeds in the chest, and some acorns. Work acorns into the garden soil and it makes awesome compost!', P(f.chest));
  if (storyAt('gather') && !campDone()) {                // out gathering: Pip spots the good stuff
    const nearIt = t => state.items.find(it => it.type === t && Math.hypot(it.x - h.x, it.y - h.y) < UNIT * 6);
    const st = nearIt('stone'), sk = nearIt('stick'), fl = nearIt('fluff');
    if (sc.id === 'riverbank' && st) pipSay('stones', 'Smooth stones! Nice flat ones.', [st.x, st.y]);
    if (sk) pipSay('sticks', 'Good sticks. Dry ones burn best.', [sk.x, sk.y]);
    const blade = !!bladeKind(), fluffNeed = (campMissing().fluff || 0) > 0;
    if (!blade && fluffNeed && (raw.stick || 0) >= 3) pipSay('sword-first', `Before the rabbits: three sticks make a wooden sword. Craft tab (${K.menu.toUpperCase()})!`);
    if (sc.id === 'f1' && fluffNeed) pipSay('fluff-wind', 'Fluff blows all over in this wind. Grab it quick!');
    if (sc.id === 'f2' && fluffNeed && !blade) pipSay('rabbit-sword', 'Rabbits have plenty of fluff. They won\'t hand it over! Make a wooden sword first.');
    if (sc.id === 'f2' && fluffNeed && blade) pipSay('rabbit-go', 'Rabbit! Get that fluff straight from the source!', state.enemies.find(e => e.type === 'rabbit') ? [state.enemies.find(e => e.type === 'rabbit').x, state.enemies.find(e => e.type === 'rabbit').y] : null, 12);
    if (fl) pipSay('fluff', 'Rabbit fluff! Don\'t ask the rabbits. They won\'t tell you.', [fl.x, fl.y]);
    if ((raw.stick || 0) >= 3 && craftSlots() >= 3 && !inv.sword && !(inv.woodsword > 0) && pipSay('woodsword', `Three sticks lashed together make a sword! Well, a wooden one. It won't last long, but it's a start. (${K.menu.toUpperCase()}, Craft)`)) hearRecipe('woodsword');
    if (sc.id !== 'camp' && Object.keys(inv.pipTips || {}).some(k => k.startsWith('camp-'))) pipSay('pound', 'Try pounding around in different places. You never know what you might knock loose!');
    if ((raw.fluff || 0) >= 2 && !known.glue) pipSay('craft2', `Two bits of fluff make rabbit glue. Open your pack, ${K.menu}, Craft tab!`);
    if (known.glue && craftSlots() >= 3 && (raw.stone || 0) >= 2 && !known.firering) pipSay('craft3', 'Two stones and a stick make a fire ring!');
  }
  if (sc.id === 'start' && storyAt('adventure')) {
    const rock = sc.pullables.find(r => r.id === 'rock'), loose = rock && rt.pulled.has(rock.id);
    if (!rt.flags.thicket) {
      const thicket = [W * 0.955, H * 0.5];
      pipSay('brambles', 'The blank part of the map is past these brambles. We need something heavy.', thicket, 14);
      const told = (state.inv.pipTips || {}).brambles;
      if (told && rock && !loose && !state.carry && near(rock.fx, rock.fy, 5)) pipSay('pull', rt.flags.knocked_rock ? 'It moved! Rock it back and forth!' : 'This rock\'s stuck fast. Jump and stomp right next to it!', [rock.fx * W, rock.fy * H]);
      if (state.carry) pipSay('throw', 'Throw it at the brambles!', thicket);
    } else {
      pipSay('smashed', 'Ha! The woods are east.', [W * 0.93, H * 0.5]);
      const tree = state.solids.filter(s => s.kind === 'tree').sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
      if (tree) pipSay('jump', 'Stomp by a tree for acorns.', [tree.x, tree.y]);
    }
  }
  if (sc.id === 'meadow' && state.bird && storyAt('tocamp')) pipSay('robin', 'Startle that robin for a seed.', [state.bird.x, state.bird.y + UNIT]);
  if (sc.id === 'w1') {
    const ks = sc.solids.find(s => s.bar === 'crack1' && s.kind === 'cracked'), kA = sc.solids.find(s => s.bar === 'knockA');
    if (!broken('w1', 'crack1')) {
      if (kA && !broken('w1', 'knockA') && !broken('w1', 'knockB')) pipSay('practice', 'See the cracked stones? Practise on those. Heave a rock and let it fly!', [kA.fx * W, kA.fy * H]);
      if (ks) pipSay('gate', 'Those boulders are wedged on a cracked stone. Throw a rock at it. Mind the mud: a short throw sinks.', [ks.fx * W, ks.fy * H], 12);
    } else pipSay('opened', 'CRASH! Onward!');
    pipSay('map-w1', 'Drawing the woods in... boulders, mud, a very suspicious tree.');
  }
  if (sc.id === 'start' && storyAt('adventure')) pipSay('map-start', 'Glade: big rock, brambles. On the map!');
  if (sc.id === 'w2') {
    const ks = sc.solids.find(s => s.bar === 'crack2' && s.kind === 'cracked');
    pipSay('map-w2', 'Last blank corner of the map! Past these boulders, and it\'s done.');
    if (!broken('w2', 'crack2')) pipSay('ring', 'That cracked stone is holding the whole pile up. It sits in a mud wallow: hit it square, or you\'ll be digging your rock out!', ks ? [ks.fx * W, ks.fy * H] : null);
    else if (!state.cut) startAbduct();              // the boulders tumble, and they were waiting
  }
}
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
    if (at(8.4)) say('Grab the lantern. Come on, come ON!', q.x, q.y - UNIT * 1.3, { key: 'npc', life: 2.4 });
    if (c.t > 10.6 && c.t < 11.6) q.y += UNIT * 4 * dt;
    if (at(11.6)) { state.cut = null; state.inv.story = STORY.adventure; state.inv.lantern = true; q.show = false; }
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

// =====================================================================
// Choices: a question with options in a bubble; arrows pick, act confirms
// =====================================================================
function ask(text, x, y, options, cb) {
  state.choice = { text, x, y, options, sel: 0, cb };
  state.keys = {}; state.prevKeys = {};
  sfx.talk();
}
function updateChoice() {
  const c = state.choice, n = c.options.length;
  if (pressedNow.left) { c.sel = (c.sel + n - 1) % n; sfx.tock(); }
  if (pressedNow.right) { c.sel = (c.sel + 1) % n; sfx.tock(); }
  if (pressedNow.act) { state.choice = null; c.cb(c.sel); }
  else if (!c.must && (pressedNow.up || pressedNow.down || pressedNow.jump || pressedNow.slotd)) state.choice = null;   // walking away (or D) cancels
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

// =====================================================================
// The bench: materials from rare crops become upgrades
// =====================================================================
// Recipes have to be found, discovered, or taught before the bench knows them.
const FORGE = [
  { k: 'cap', name: 'Stalker cap', what: 'Things falling from above bounce off your head.', how: 'Stitch two stalker ears onto a patch of stalker hide. Wear it proudly.', from: 'discovered when you first pick up a piece of a stalker', cost: [{ ear: 2, hide: 1 }], max: 1 },
  { k: 'edge', name: 'Honed edge', what: 'Slashes and whirlwinds cut deeper.', how: 'Draw thorns along the blade until it bites. More thorns, keener edge; the last pass needs ironwood to steady it.', from: 'discovered the first time you hold a thorn', cost: [{ thorn: 2 }, { thorn: 4 }, { thorn: 6, ironwood: 1 }] },
  { k: 'temper', name: 'Tempered blade', what: 'Stabs hit harder.', how: 'Wrap the blade in ironwood and quench it with thorn sap. Finish with an ember bloom.', from: 'a smith\'s scrap somewhere in the Dank Cave', cost: [{ ironwood: 1, thorn: 1 }, { ironwood: 2, thorn: 2 }, { ironwood: 3, ember: 1 }] },
  { k: 'guard', name: 'Ironwood guard', what: 'Take less damage.', how: 'Shape ironwood into a guard, layered like a shell. A star petal seals the last layer.', from: 'taught by someone slow and patient', cost: [{ ironwood: 2 }, { ironwood: 3 }, { ironwood: 4, starpetal: 1 }] },
  { k: 'pouch', name: 'Ember pouch', what: 'Marsh fire spreads wider and burns longer.', how: 'Dry ember blooms in a pouch at your belt. They feed the spark.', from: 'taught by someone who knows a thing about gas', cost: [{ ember: 2 }, { ember: 3 }, { ember: 4, starpetal: 1 }] },
  { k: 'silk', relic: true, name: 'Silk sling', what: 'Acorns fly faster and hit harder; at II they punch through; at III they tangle.', how: 'String diver silk into a sling for your acorns.', from: 'the silk of a diver', cost: [{ silkpart: 1 }, { silkpart: 1 }, { silkpart: 1 }] },
  { k: 'horn', relic: true, name: 'Horn-lashed blade', what: 'Stabs hit harder and knock back; at II chained stabs hit harder still; at III they reach farther.', how: 'Lash a charger horn along the blade.', from: 'the horn of a charger', cost: [{ hornpart: 1 }, { hornpart: 1 }, { hornpart: 1 }] },
  { k: 'star', name: 'Star-petal hilt', what: 'Deeper vigor and a more forgiving whirlwind.', how: 'Bind two star petals into the grip.', from: 'an offering at a sunken shrine', cost: [{ starpetal: 2 }], max: 1 },
];
function learnRecipe(k, source) {
  const inv = state.inv;
  if (inv.recipes[k]) return;
  inv.recipes[k] = true;
  const f = FORGE.find(o => o.k === k);
  sfx.pickup(); sfx.shing();
  showTitle(`Recipe: ${f.name}`, f.how, 'relic', 4.5);
  say(source || 'Work it at the camp bench.', state.hero.x, state.hero.y - UNIT * 1.3, { key: 'recipe', life: 3 });
}
const costText = c => Object.entries(c).map(([m, n]) => `${n} ${MATS[m]}`).join(', ');
function forgeItems() {
  const up = state.inv.up;
  return FORGE.map(f => {
    if (!state.inv.recipes[f.k]) return '??? (recipe not yet found)';
    const lv = f.relic ? state.inv[f.k] || 0 : up[f.k], max = f.max || 3;
    return lv >= max ? `${f.name} ${'I'.repeat(lv)}: done` : `${f.name} ${'I'.repeat(lv + 1)}: ${costText(f.cost[lv])}`;
  }).concat('Back');
}
function forgeSelect(i) {
  const m = state.menu;
  if (i >= FORGE.length) { state.menu = null; return; }
  const f = FORGE[i], inv = state.inv, lv = f.relic ? inv[f.k] || 0 : inv.up[f.k];
  if (!inv.recipes[f.k]) { m.note = `You don't know how to make this yet. Hint: ${f.from}.`; return; }
  if (lv >= (f.max || 3)) { m.note = 'Already as good as it gets.'; return; }
  const c = f.cost[lv];
  if (!Object.entries(c).every(([k, n]) => inv.mats[k] >= n)) { m.note = `Need ${costText(c)}. ${f.what}`; return; }
  for (const [k, n] of Object.entries(c)) inv.mats[k] -= n;
  if (f.relic) inv[f.k] = (inv[f.k] || 0) + 1; else inv.up[f.k]++;
  sfx.forge();
  m.note = `${f.name} ${'I'.repeat(f.relic ? inv[f.k] : inv.up[f.k])}. ${f.relic ? RELICS[f.k].levels[inv[f.k] - 1] : f.what}`;
  if (f.k === 'star') state.hero.vig = maxVig();
  if (f.k === 'cap') { inv.scalp = true; showTitle('Stalker Cap', 'ears and all. what falls on your head bounces off', 'relic', 3.5); }
}

// =====================================================================
// Menu: pause, equipment, save and load (3 slots), tips setting
// =====================================================================
const SLOTS = 3;
// the main menu is a list of [key, label]; every option lives here, nothing on the play screen
const MAIN_ITEMS = () => [
  ['resume', 'Resume'],
  ['pack', 'Pack'],
  ...(state.inv.pipSaved ? [['spores', `Spore travel (${state.inv.spores} spores)`]] : []),
  ['save', 'Save game'],
  ['load', 'Load game'],
  ['settings', 'Settings'],
  ['new', 'New adventure'],
];
const SETTINGS_ITEMS = () => [
  ['keys', 'Controls'],
  ['sound', `Sound: ${soundOn ? 'on' : 'off'}`],
  ...(canFullscreen() ? [['fs', `Full screen: ${inFullscreen() ? 'on' : 'off'}`]] : []),
  ['tips', `Tips: ${state.settings.tips === 'intro' ? 'introductions only' : 'always show'}`],
  ['back', 'Back'],
];
const setIndex = key => SETTINGS_ITEMS().findIndex(o => o[0] === key);
// ---------------- the pack: tabs of icons, one short line for whatever is selected ----------------
const PACK_TABS = ['Gear', 'Wear', 'Craft', 'Food', 'Seeds', 'Materials', 'Quests', 'Map', 'Status', 'System'];
// a tab shows only once there's something behind it
function tabShown(t) {
  const inv = state.inv;
  if (t === 'Wear') return gearOwned().length > 0;
  if (t === 'Food') return inv.food.length > 0;
  if (t === 'Seeds') return Object.values(inv.bag || {}).some(n => n > 0);
  if (t === 'Materials') return packCells('Materials').length > 0;
  if (t === 'Map') return inv.journal >= 3;
  return true;
}
function stepTab(i, d) { for (let k = 1; k <= PACK_TABS.length; k++) { const j = (i + d * k + PACK_TABS.length * 4) % PACK_TABS.length; if (tabShown(PACK_TABS[j])) return j; } return i; }
const SYSTEM_ITEMS = () => [
  ['resume', 'Resume'],
  ...(PUZZLE && state.puzzle ? [['retry', `Retry: ${state.puzzle.p.name}`], ['hub', 'Back to the puzzles']] : []),
  ...(ARENA && state.arena ? [['rezone', `Restart: ${state.arena.zone.name}`], ['glade', 'Back to the arena glade']] : []),
  ...(ARENA ? [['acornskill', `Acorn practice: level ${skillLevel('acorn')}`]] : []),
  ...(state.inv.pipSaved && !ARENA ? [['spores', `Spore travel (${state.inv.spores} spores)`]] : []),
  ['save', 'Save game'],
  ['load', 'Load game'],
  ['keys', 'Controls'],
  ['sound', `Sound: ${soundOn ? 'on' : 'off'}`],
  ...(canFullscreen() ? [['fs', `Full screen: ${inFullscreen() ? 'on' : 'off'}`]] : []),
  ['labels', `Action labels: ${state.settings.labels === false ? 'off' : 'on'}`],
  ['tiles', `Show tiles: ${state.settings.tiles ? 'on' : 'off'}`],
  ['levels', 'Testing: set levels'],
  ['new', 'New adventure'],
];
const SYS_TAB = () => PACK_TABS.indexOf('System');
function toSystem(key) {                              // sub-screens return to the System tab, on the item they came from
  const i = SYSTEM_ITEMS().findIndex(o => o[0] === key);
  Object.assign(state.menu, { view: 'pack', tab: SYS_TAB(), focus: 'grid', sys: Math.max(0, i), note: '' });
}
function systemSelect(i) {
  const m = state.menu, key = (SYSTEM_ITEMS()[i] || [])[0];
  sfx.pickup();
  if (key === 'resume') state.menu = null;
  if (key === 'retry') { state.menu = null; enterPuzzle(state.puzzle.p); }
  if (key === 'hub') { state.menu = null; state.puzzle = null; transitionTo('puzzlehub', 0.5, 0.88, true); }
  if (key === 'rezone') { state.menu = null; enterZone(state.arena.key); }
  if (key === 'glade') { state.menu = null; state.arena = null; transitionTo('arena', 0.5, 0.55, true); }
  if (key === 'acornskill') setSkillLevel('acorn', (skillLevel('acorn') + 1) % (SKILLS.acorn.steps.length + 1));
  if (key === 'save') Object.assign(m, { view: 'save', sel: 0, note: '' });
  if (key === 'load') Object.assign(m, { view: 'load', sel: 0, note: '' });
  if (key === 'keys') { if (TOUCH) m.note = 'Controls are the on-screen buttons on this device'; else Object.assign(m, { view: 'keys', sel: 0 }); }
  if (key === 'levels') Object.assign(m, { view: 'levels', sel: 0, note: '' });
  if (key === 'tiles') { state.settings.tiles = !state.settings.tiles; state.tileCache = null; saveSettings(); }
  if (key === 'sound') setSound(!soundOn);
  if (key === 'fs') { if (inFullscreen()) exitFullscreen(); else goFullscreen(); }
  if (key === 'tips') { state.settings.tips = state.settings.tips === 'intro' ? 'always' : 'intro'; saveSettings(); }
  if (key === 'labels') { state.settings.labels = state.settings.labels === false; saveSettings(); }
  if (key === 'new') Object.assign(m, { view: 'new', sel: 1 });
  if (key === 'spores') Object.assign(m, { view: 'spores', sel: 0, note: `You have ${state.inv.spores} spores. Farther jumps cost more.` });
}
const MAT_USE = { thorn: 'edge, temper, raft', ember: 'temper, pouch', ironwood: 'edge, temper, guard', starpetal: 'guard, pouch, hilt', ear: 'stalker cap', hide: 'stalker cap', driftwood: 'raft' };
const UP_ICON = { edge: 'thorn', temper: 'ember', guard: 'ironwood', pouch: 'ember', star: 'starpetal' };
// grid places for pack cells: a new section starts a new row (with its name above it)
function packLayout(cells, cols) {
  const out = []; let r = 0, c = 0, sec;
  cells.forEach((cell, i) => { if (i && (c >= cols || cell.sec !== sec)) { r++; c = 0; } sec = cell.sec; out.push({ r, c, head: c === 0 && cell.sec && (i === 0 || cells[i - 1].sec !== cell.sec) ? cell.sec : null }); c++; });
  return out;
}
// the Status tab: everything about you that grows, in one place
function statusRows() {
  const inv = state.inv, h = state.hero, rows = [];
  rows.push(['head', 'You']);
  rows.push(['row', 'Vigor', `${Math.ceil(h.vig)} of ${maxVig()}  \u00b7  depth ${inv.depth}${inv.vigBonus ? `  \u00b7  +${inv.vigBonus} from turnips` : ''}`]);
  rows.push(['head', 'Skills']);
  const SK = { acorn: 'Acorns', sword: 'Sword', dodge: 'Dodging', farm: 'Farming', gather: 'Gathering' };
  for (const [id, name] of Object.entries(SK)) { const s = skillOf(id), max = SKILLS[id].steps.length, need = SKILLS[id].steps[s.lvl], prog = s.n + s.hits * 2; rows.push(['skill', name, s.lvl, max, need ? Math.min(1, (prog - (SKILLS[id].steps[s.lvl - 1] || 0)) / (need - (SKILLS[id].steps[s.lvl - 1] || 0))) : 1]); }
  rows.push(['row', 'Gathering reach', `${gatherReach().toFixed(1)} tiles${autoRange('stick') ? `  \u00b7  common things come to you from ${autoRange('stick') >= 99 ? 'anywhere' : autoRange('stick').toFixed(1) + ' tiles'}` : ''}`]);
  const crops = Object.keys(inv.cropXp || {});
  if (crops.length || farmLevel()) { rows.push(['head', 'Garden']); rows.push(['row', 'Farming level', `${farmLevel()}  \u00b7  seeds come back ${Math.round(farmLevel() * 6)}% more often`]); for (const c of crops) rows.push(['row', c[0].toUpperCase() + c.slice(1), `level ${cropLevel(c)}`]); }
  const ups = FORGE.filter(f => f.relic ? inv[f.k] : inv.up[f.k]);
  if (ups.length || inv.step) { rows.push(['head', 'Upgrades']); for (const f of ups) rows.push(['row', f.name, 'I'.repeat(f.relic ? inv[f.k] : inv.up[f.k])]); if (inv.step) rows.push(['row', RELICS.step.name, 'I'.repeat(inv.step)]); }
  return rows;
}
// System > Testing: set levels straight away
const LEVEL_ROWS = () => [
  ...Object.keys(SKILLS).map(id => ({ label: `${id[0].toUpperCase() + id.slice(1)} skill: ${skillLevel(id)} of ${SKILLS[id].steps.length}`, adj: d => setSkillLevel(id, (skillLevel(id) + d + SKILLS[id].steps.length + 1) % (SKILLS[id].steps.length + 1)) })),
  { label: `Vigor depth: ${state.inv.depth}`, adj: d => { state.inv.depth = Math.max(0, Math.min(12, state.inv.depth + d)); state.hero.vig = maxVig(); } },
  { label: `Turnip vigor bonus: ${state.inv.vigBonus}`, adj: d => { state.inv.vigBonus = Math.max(0, Math.min(40, state.inv.vigBonus + d * 5)); state.hero.vig = maxVig(); } },
  { label: 'Everything to the top', adj: () => { for (const id of Object.keys(SKILLS)) setSkillLevel(id, SKILLS[id].steps.length); } },
  { label: 'Everything back to zero', adj: () => { for (const id of Object.keys(SKILLS)) setSkillLevel(id, 0); } },
  { label: 'Back', adj: null },
];
function packCells(tab) {
  if (tab === 'Craft') return craftCells();
  const inv = state.inv, cells = [], h = state.hero;
  const drop = (type, fn) => ({ label: 'Drop', fn: () => { fn(); state.items.push({ type, x: h.x + h.fx * UNIT * 1.4, y: h.y + h.fy * UNIT * 1.4 + UNIT * 0.3 }); } });
  if (tab === 'Gear') {
    if (inv.sword) cells.push({ icon: 'sword', name: inv.up.edge >= 3 ? 'Sword' : 'Rusty sword', line: `slash ${1 + 0.5 * inv.up.edge}, stab ${2 + 0.5 * inv.up.temper}`, mark: state.equip === 'sword', acts: slotActs({ kind: 'weapon', id: 'sword' }) });
    if (inv.woodsword > 0) cells.push({ icon: 'woodsword', name: 'Wooden sword', line: `three sticks, lashed. ${Math.round(inv.woodsword / WOOD_SWORD * 100)}% left before it splinters apart`, mark: state.equip === 'woodsword', acts: slotActs({ kind: 'weapon', id: 'woodsword' }) });
    if (inv.aug) cells.push({ icon: inv.aug.id, name: OUT_NAME[inv.aug.id], line: `on your blade: ${inv.aug.n} more hits` });
    if (inv.acorns) cells.push({ icon: 'acorn', name: 'Acorns', count: inv.acorns, line: 'throw with their key; hold to throw harder', mark: state.equip === 'acorn', acts: slotActs({ kind: 'weapon', id: 'acorn' }) });
    if (inv.rod) cells.push({ icon: 'rod', name: 'Old Wick\'s rod', line: 'cast where fish rise' });
    if (inv.fire) cells.push({ icon: 'fire', name: 'Marsh fire', line: `hold ${K.fire} to breathe, let go to spark`, acts: slotActs({ kind: 'ability', id: 'fire' }) });
    for (const k of ['step', 'silk', 'horn']) if (inv[k]) cells.push({ icon: k, name: RELICS[k].name, pips: inv[k], line: RELICS[k].levels[inv[k] - 1], acts: k === 'step' ? slotActs({ kind: 'ability', id: 'dodge' }) : [] });
    if (wears('embercharm')) cells.push({ icon: 'ember', name: 'Flare', line: 'a ring of sparks around you, from the ember charm', acts: slotActs({ kind: 'ability', id: 'flare' }) });
    for (const f of FORGE) if (f.k !== 'cap' && inv.up[f.k]) cells.push({ icon: UP_ICON[f.k], name: f.name, pips: f.k === 'star' ? 0 : inv.up[f.k], line: f.what });
    if (inv.journal >= 3) cells.push({ icon: 'journal', name: 'Pip\'s journal', line: 'maps: see the Map tab' });
    const SEC = c => ['sword', 'woodsword', 'acorn', 'thornwrap', 'emberoil'].includes(c.icon) ? 'Weapons' : ['fire', 'step', 'silk', 'horn', 'ember'].includes(c.icon) ? 'Abilities' : ['rod', 'journal'].includes(c.icon) ? 'Tools' : 'Upgrades';
    const ORD = ['Weapons', 'Abilities', 'Upgrades', 'Tools'];
    cells.forEach(c => { c.sec = SEC(c); }); cells.sort((a, b) => ORD.indexOf(a.sec) - ORD.indexOf(b.sec));
  }
  if (tab === 'Wear') {                                 // armaments, charms and flair: a few at a time, all of them visible on you
    const worn = inv.worn || [], n = wearSlots();
    for (const id of gearOwned()) {
      const on = worn.includes(id), W0 = WEAR[id];
      cells.push({ icon: id === 'cap' ? 'scalp' : 'wear_' + id, name: W0.name, mark: on, line: `${WEAR_KIND[W0.kind]} \u00b7 ${W0.line} (${worn.length} of ${n} worn)`,
        acts: [{ label: on ? 'Take off' : 'Wear', fn: () => { const r = toggleWear(id); if (r === 'full') state.menu.note = `You can wear ${n} at once. Take one off first.`; refreshButtons(); } }] });
    }
    if (!cells.length) cells.push({ icon: 'wear_feather', name: 'Nothing to wear yet', line: `Room for ${n}. Charms can be made on the craft mat; others turn up.` });
  }
  if (tab === 'Food') for (const f of [...new Set(inv.food)]) {
    const fav = inv.favFood === f;
    cells.push({ icon: f, name: foodName(f), count: inv.food.filter(x => x === f).length, star: fav, line: FOOD_INFO[f],
      acts: [{ label: 'Eat', fn: () => { state.menu = null; eatFood(f); } }, { label: fav ? 'Stop eating first' : 'Eat first', fn: () => { inv.favFood = fav ? null : f; } }, ...slotActs({ kind: 'food', id: f }), drop(f, () => inv.food.splice(inv.food.indexOf(f), 1))] });
  }
  if (tab === 'Seeds') for (const k of Object.keys(SEEDS)) if (inv.bag[k] > 0) {
    const fav = inv.favSeed === k;
    cells.push({ icon: k, name: SEEDS[k].name, count: inv.bag[k], star: fav, line: SEEDS[k].yields ? `grows ${MATS[SEEDS[k].yields[0]]}` : `grows ${SEEDS[k].n[0]} to ${SEEDS[k].n[1]} ${CROP_NAME[SEEDS[k].crop].toLowerCase()}`,
      acts: [{ label: fav ? 'Stop planting first' : 'Plant first', fn: () => { inv.favSeed = fav ? null : k; } }, ...slotActs({ kind: 'seed', id: k }), drop(k, () => inv.bag[k]--)] });
  }
  if (tab === 'Materials') for (const k of Object.keys(MATS)) if (inv.mats[k] > 0) cells.push({ icon: k === 'ember' ? 'ember' : k, name: MATS[k], count: inv.mats[k], line: `for ${MAT_USE[k] || 'crafting'}` });
  if (tab === 'Quests' && ARENA) {
    const recs = puzzleRecords();
    for (const [id, z] of Object.entries(ARENA_ZONES)) cells.push({ icon: { river: 'gremlin', cave: 'stalker', swamp: 'lurker', wind: 'rabbit' }[id], name: z.name, done: !!(recs['zone:' + id] || {}).clears, line: `${z.waves.length} waves in ${MAP_NAMES[z.scene] || z.scene}` });
    return cells;
  }
  return cells;
}
// the Quests tab as rows: one per current objective, the log header, and (when unfolded) the log entries
function questRows(v) {
  const rows = v.cur.map(c => ({ kind: 'cur', c }));
  if (!rows.length) rows.push({ kind: 'none' });
  if (v.log.length) { rows.push({ kind: 'loghead', n: v.log.length }); if (state.qlogOpen) for (const e of v.log) rows.push({ kind: 'log', e }); }
  return rows;
}
function updatePack() {
  const m = state.menu;
  if (!tabShown(PACK_TABS[m.tab])) m.tab = stepTab(m.tab, 1);
  const tab = PACK_TABS[m.tab], cells = tab === 'Map' || tab === 'System' || tab === 'Status' ? [] : packCells(tab), cols = m.cols || 5;
  const mv = (d) => { m.sel = Math.max(0, Math.min(cells.length - 1, m.sel + d)); sfx.tock(); };
  if (m.focus === 'tabs') {
    if (pressedNow.left) { m.tab = stepTab(m.tab, -1); m.sel = 0; sfx.tock(); }
    if (pressedNow.right) { m.tab = stepTab(m.tab, 1); m.sel = 0; sfx.tock(); }
    if (pressedNow.act || pressedNow.down) {
      if (tab === 'System') { m.focus = 'grid'; m.sys = m.sys || 0; sfx.tock(); }
      else if (tab === 'Quests' && !ARENA) { m.focus = 'grid'; m.qsel = 0; sfx.tock(); }
      else if (cells.length) { m.focus = 'grid'; m.sel = Math.min(m.sel, cells.length - 1); sfx.tock(); }
    }
    return;
  }
  if (tab === 'Quests' && !ARENA) {                    // current objectives, then the folded log
    const v = questView(), n = questRows(v).length;
    m.qsel = Math.min(m.qsel || 0, n - 1);
    if (pressedNow.up) { if (m.qsel <= 0) m.focus = 'tabs'; else m.qsel--; sfx.tock(); }
    if (pressedNow.down) { m.qsel = Math.min(n - 1, m.qsel + 1); sfx.tock(); }
    if (pressedNow.left) { m.tab = stepTab(m.tab, -1); m.focus = 'tabs'; sfx.tock(); }
    if (pressedNow.right) { m.tab = stepTab(m.tab, 1); m.focus = 'tabs'; sfx.tock(); }
    const row = questRows(v)[m.qsel];
    if (pressedNow.act && row && row.kind === 'loghead') { state.qlogOpen = !state.qlogOpen; sfx.tock(); }
    if (pressedNow.act && row && row.kind === 'cur') { trackQuest(row.c.q.id, !tracked(row.c.q.id)); sfx.tock(); }   // active on the HUD, or not
    return;
  }
  if (tab === 'System') {                              // a plain list
    const n = SYSTEM_ITEMS().length;
    m.sys = m.sys || 0;
    if (pressedNow.up) { if (m.sys === 0) m.focus = 'tabs'; else m.sys--; sfx.tock(); }
    if (pressedNow.down) { m.sys = Math.min(n - 1, m.sys + 1); sfx.tock(); }
    if (pressedNow.left) { m.tab = stepTab(m.tab, -1); m.focus = 'tabs'; sfx.tock(); }
    if (pressedNow.act) systemSelect(m.sys);
    return;
  }
  const cell = cells[m.sel];
  if (m.focus === 'acts') {
    const acts = (cell && cell.acts) || [];
    if (pressedNow.left || pressedNow.up) { m.act = Math.max(0, m.act - 1); sfx.tock(); }
    if (pressedNow.right || pressedNow.down) { m.act = Math.min(acts.length - 1, m.act + 1); sfx.tock(); }
    if (pressedNow.act && acts[m.act]) { acts[m.act].fn(); sfx.pickup(); if (state.menu) { m.focus = 'grid'; const n = packCells(tab).length; m.sel = Math.min(m.sel, Math.max(0, n - 1)); if (!n) m.focus = 'tabs'; } }
    if (pressedNow.jump) m.focus = 'grid';
    return;
  }
  if (!cells.length) { m.focus = 'tabs'; return; }
  if (pressedNow.left) mv(-1);
  if (pressedNow.right) mv(1);
  {                                                     // up and down go by rows (sections start new rows)
    const L = packLayout(cells, cols), cur = L[m.sel] || { r: 0, c: 0 };
    const row = r => L.map((q, i) => [q, i]).filter(([q]) => q.r === r);
    const go = r => { const R = row(r); if (!R.length) return false; m.sel = R.reduce((b, x) => Math.abs(x[0].c - cur.c) < Math.abs(b[0].c - cur.c) ? x : b)[1]; sfx.tock(); return true; };
    if (pressedNow.down) go(cur.r + 1);
    if (pressedNow.up && !go(cur.r - 1)) { m.focus = 'tabs'; sfx.tock(); }
  }
  if (tab === 'Craft' && pressedNow.act) { craftCellAct(cell); return; }
  if (pressedNow.act && cell && cell.acts && cell.acts.length) { m.focus = 'acts'; m.act = 0; sfx.tock(); }
}
const MAIN = () => MAIN_ITEMS().map(o => o[1]);
const mainIndex = key => MAIN_ITEMS().findIndex(o => o[0] === key);
const ACTIONS = Object.keys(DEFAULT_KEYS);
function toggleMenu() {
  if (!state.started) return;
  if (state.menu) { if (state.menu.view === 'pack') state.lastTab = state.menu.tab; state.menu = null; sfx.tock(); return; }
  state.menu = { view: 'pack', tab: state.lastTab || 0, sel: 0, focus: 'grid', act: 0, sys: 0, note: '' };
  state.keys = {}; state.prevKeys = {};
  sfx.tock();
}
function menuItems() {
  const m = state.menu;
  if (m.view === 'main') return MAIN();
  if (m.view === 'save' || m.view === 'load') return [...Array(SLOTS)].map((_, i) => `Slot ${i + 1}: ${slotInfo(i)}`).concat('Back');
  if (m.view === 'new') return ['Yes, start over', 'No, keep playing'];
  if (m.view === 'forge') return forgeItems();
  if (m.view === 'settings') return SETTINGS_ITEMS().map(o => o[1]);
  if (m.view === 'pack') return [];
  if (m.view === 'spores') return travelOptions(state.scene).map(o => `${SHROOM_NAMES[o.id]}: ${o.cost} spore${o.cost > 1 ? 's' : ''}`).concat('Back');
  if (m.view === 'levels') return LEVEL_ROWS().map(r => r.label + (r.adj && !/^Everything/.test(r.label) ? '   < >' : ''));
  if (m.view === 'keys') return ACTIONS.map(a => `${ACTION_NAMES[a]}: ${state.remap === a ? 'press a key...' : keyName(state.settings.keys[a])}`).concat('Reset to defaults', 'Back');
  return ['Back'];
}
// D backs out of anything: an action list to its grid, a grid to the tabs, the tabs (or any other screen) closes
function menuBack() {
  const m = state.menu;
  sfx.tock();
  if (m.view === 'pack') {
    if (m.focus === 'acts') { m.focus = 'grid'; return; }
    if (m.focus === 'grid') { m.focus = 'tabs'; return; }
    state.lastTab = m.tab;
  }
  if (['levels', 'keys', 'save', 'load'].includes(m.view)) { toSystem(m.view); return; }   // sub-screens step back to System
  state.menu = null; state.mat = state.mat || [];
}
function updateMenu() {
  if (state.remap) return;
  if (pressedNow.slotd) { menuBack(); return; }
  const m = state.menu, items = menuItems();
  if (m.view === 'pack') { updatePack(); return; }
  if (m.view === 'poses') { if (pressedNow.act) state.menu = null; return; }
  if (m.view === 'chest') { updateChest(m); return; }
  if (m.view === 'book') { const sp = m.page - (m.page % 2); if (pressedNow.left) m.page = Math.max(0, sp - 2); if (pressedNow.right) { const n = m.pageCount || BOOK.length; m.page = Math.min(n - 1 - ((n - 1) % 2), sp + 2); } if (pressedNow.act) state.menu = null; return; }   // two pages to a spread
  if (m.view === 'levels' && (pressedNow.left || pressedNow.right)) { const r = LEVEL_ROWS()[m.sel]; if (r && r.adj && !/^Everything/.test(r.label)) { r.adj(pressedNow.right ? 1 : -1); sfx.tock(); } }
  if (pressedNow.up) { m.sel = (m.sel + items.length - 1) % items.length; sfx.tock(); }
  if (pressedNow.down) { m.sel = (m.sel + 1) % items.length; sfx.tock(); }
  if (pressedNow.act) menuSelect(m.sel);
}
function menuTap(x, y) {
  const m = state.menu;
  if (m.view === 'pack') { const hit = (state.packHits || []).find(o => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h); if (hit) hit.fn(); return; }
  const r = (state.menuRects || []).find(o => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h);
  if (r) { state.menu.sel = r.i; menuSelect(r.i); }
}
function menuSelect(i) {
  const m = state.menu;
  sfx.pickup();
  if (m.view === 'forge') { forgeSelect(i); return; }
  if (m.view === 'main') {
    const key = (MAIN_ITEMS()[i] || [])[0];
    if (key === 'resume') state.menu = null;
    if (key === 'pack') Object.assign(m, { view: 'pack', tab: 0, sel: 0, focus: 'grid', act: 0 });
    if (key === 'settings') Object.assign(m, { view: 'settings', sel: 0 });
    if (key === 'save') Object.assign(m, { view: 'save', sel: 0, note: '' });
    if (key === 'load') Object.assign(m, { view: 'load', sel: 0, note: '' });
    if (key === 'new') Object.assign(m, { view: 'new', sel: 1 });
    if (key === 'spores') Object.assign(m, { view: 'spores', sel: 0, note: `You have ${state.inv.spores} spores. Farther jumps cost more.` });
  } else if (m.view === 'settings') {
    const key = (SETTINGS_ITEMS()[i] || [])[0];
    if (key === 'keys') { if (TOUCH) m.note = 'Controls are the on-screen buttons on this device'; else Object.assign(m, { view: 'keys', sel: 0 }); }
    if (key === 'sound') setSound(!soundOn);
    if (key === 'fs') { if (inFullscreen()) exitFullscreen(); else goFullscreen(); }
    if (key === 'tips') { state.settings.tips = state.settings.tips === 'intro' ? 'always' : 'intro'; saveSettings(); }
    if (key === 'back') Object.assign(m, { view: 'main', sel: mainIndex('settings') });
  } else if (m.view === 'spores') {
    const opts = travelOptions(state.scene);
    if (i >= opts.length) { toSystem('spores'); return; }
    if (state.inv.spores < opts[i].cost) { m.note = `Not enough spores: ${state.inv.spores}/${opts[i].cost}. Found mushrooms grow more over time.`; return; }
    state.menu = null;
    sporeJump(opts[i].id, opts[i].cost);
  } else if (m.view === 'levels') {                   // F raises (and wraps), arrows go either way
    const r = LEVEL_ROWS()[i];
    if (!r || !r.adj) { toSystem('levels'); return; }
    r.adj(1); m.note = r.label.startsWith('Everything') ? 'Done.' : '';
  } else if (m.view === 'keys') {
    if (i < ACTIONS.length) state.remap = ACTIONS[i];
    else if (i === ACTIONS.length) { state.settings.keys = { ...DEFAULT_KEYS }; refreshK(); saveSettings(); }
    else toSystem('keys');
  } else if (m.view === 'save' || m.view === 'load') {
    if (i >= SLOTS) { toSystem(m.view); return; }
    if (m.view === 'save') m.note = saveSlot(i) ? `Saved to slot ${i + 1}` : 'Could not save on this device';
    else if (slotInfo(i) === 'empty') m.note = 'That slot is empty';
    else if (loadSlot(i)) state.menu = null;
    else m.note = 'That save could not be read';
  } else if (m.view === 'new') {
    if (i === 0) { state.menu = null; newGame(); } else toSystem('new');
  } else Object.assign(m, { view: 'main', sel: 0 });
}

function serialize() {
  saveScene();
  const h = state.hero, rtOut = {};
  for (const [k, r] of Object.entries(RT)) rtOut[k] = { deadAt: r.deadAt, items: r.items, pulled: [...r.pulled], flags: r.flags, bossDead: r.bossDead };
  return { v: 16, seed: SEED, scene: state.scene, hero: { fx: h.x / W, fy: h.y / H, vig: h.vig }, inv: state.inv, rt: rtOut, seen: state.seen, tipsSeen: state.tipsSeen, playTime: state.playTime, carry: state.carry, area: sceneDef().area, when: Date.now() };
}
function saveSlot(i) { try { localStorage.setItem('quest-slot-' + i, JSON.stringify(serialize())); return true; } catch (e) { return false; } }
function readSlot(i) { try { const s = localStorage.getItem('quest-slot-' + i); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function slotInfo(i) {
  const d = readSlot(i);
  if (!d) return 'empty';
  const m = Math.floor(d.playTime / 60), s = Math.floor(d.playTime % 60);
  return `${AREA_NAMES[d.area] || '?'}, ${m}:${String(s).padStart(2, '0')}`;
}
// builds before 65 had one plain "seed" that grew the local vegetable: it becomes turnip seeds, and planted patches keep their crop
function migrateSeeds(inv) {
  const bag = inv.bag || (inv.bag = {});
  for (const k of Object.keys(SEEDS)) if (!(k in bag)) bag[k] = 0;
  if (bag.seed) { bag.turnipseed += bag.seed; }
  delete bag.seed;
  if (inv.favSeed === 'seed') inv.favSeed = 'turnipseed';
  if (inv.slots) for (const k of Object.keys(inv.slots)) { const s = inv.slots[k]; if (s && s.kind === 'seed' && s.id === 'seed') s.id = 'auto'; }
  for (const [id, rt] of Object.entries(RT)) { const sc = WORLD[id]; if (!sc || !rt.flags || !rt.flags.plots) continue; rt.flags.plots.forEach((p, i) => { if (p.s && !SEEDS[p.seed]) p.seed = seedOfPlot(p, sc, i); }); }
}
function loadSlot(i) {
  const d = readSlot(i);
  if (!d || !d.seed || d.v !== 16) return false;
  resetRun(d.seed);
  for (const [k, r] of Object.entries(d.rt)) RT[k] = { deadAt: r.deadAt || {}, items: r.items, pulled: new Set(r.pulled), flags: r.flags || {}, bossDead: r.bossDead };
  Object.assign(state.inv, d.inv);
  if (!state.inv.chestStocked) {                        // older saves: the chest gets its starting seeds and acorns too
    const ch = state.inv.chest || (state.inv.chest = {}); (ch.bag = ch.bag || {}).turnipseed = (ch.bag.turnipseed || 0) + 2; ch.acorns = (ch.acorns || 0) + 3; state.inv.chestStocked = true;
  }
  migrateSeeds(state.inv);
  state.seen = d.seen || {}; state.tipsSeen = Object.assign(state.tipsSeen, d.tipsSeen || {}); state.playTime = d.playTime || 0; state.carry = d.carry || null;
  if (d.scene === 'rapids' || !WORLD[d.scene]) enterScene(WORLD.gleampool && d.scene === 'cascade' ? 'gleampool' : 'riverbank'); else enterScene(d.scene, d.hero.fx, d.hero.fy);
  if (!d.inv.raw && (state.inv.sword || state.inv.pipTaken || state.inv.pipSaved || state.seen.w1)) { const rt = rtFor('camp'); for (const pc of ['fire', 'tent', 'bench']) rt.flags['built_' + pc] = true; refreshSceneGeometry(); }
  state.hero.vig = Math.min(maxVig(), d.hero.vig);
  sayHero('Game loaded.', { life: 1.5 });
  return true;
}
// every line of the inventory: [icon, title, detail]
const FOOD_INFO = new Proxy({}, { get: (_, k) => { const [lo, hi] = foodRange(k), l = cropLevel(k); return `restores ${Math.round(lo * 100)}-${Math.round(hi * 100)}% vigor${k === 'turnip' ? ' over time, sometimes sturdies you' : ''}${l ? ` \u00b7 level ${l}` : ''}${l >= 3 ? ', ' + CROP_PERK[k] : ''}`; } });
function inventoryLines() {
  const inv = state.inv, L2 = [];
  const sec = t => L2.push([null, t, null]);
  sec('Gear');
  if (inv.sword) L2.push(['acorn', 'Rusted sword', `${K.act}: slash, or hold and release to stab and lunge. Stab, slash, stab to chain. Three slashes in rhythm start a whirlwind. In the air: slam.`]);
  if (inv.scalp) L2.push(['scalp', 'Stalker cap', 'Stitched from stalker ears and hide. Things that fall on your head bounce off.']);
  for (const k of ['step', 'silk', 'horn']) if (inv[k]) L2.push([k, `${RELICS[k].name} ${'I'.repeat(inv[k])}`, RELICS[k].levels.slice(0, inv[k]).join(' ')]);
  if (inv.fire) L2.push(['fire', 'Marsh fire', `${K.fire}: breathe gas. Standing still, it gathers around you and stays with you when lit. Moving, it trails behind. Let go to spark it.`]);
  if (inv.tortoise) L2.push(['wisp', 'Tortoise\'s patience', 'Your vigor runs deeper.']);
  if (L2.length === 1) L2.push([null, '  nothing yet', null]);
  const foods = {}; inv.food.forEach(f => foods[f] = (foods[f] || 0) + 1);
  if (Object.keys(foods).length || inv.acorns) {
    sec('Food and throwables');
    for (const [f, n] of Object.entries(foods)) L2.push([f, `${f[0].toUpperCase() + f.slice(1)} x${n}`, `${K.eat}: ${FOOD_INFO[f] || 'food'}.`]);
    if (inv.acorns) L2.push(['acorn', `Acorns x${inv.acorns}`, `${inv.sword ? K.swap + ' to equip, then ' : ''}${K.act} throws; hold longer to throw faster and harder. Slash, pound or throw a rock at trees for more.`]);
  }
  const seeds = Object.keys(SEEDS).filter(k => inv.bag[k]);
  if (seeds.length) { sec('Seeds'); for (const k of seeds) L2.push([k, `${SEEDS[k].name} x${inv.bag[k]}  (${SEEDS[k].rarity})`, SEEDS[k].yields ? `Plant it; it grows ${MATS[SEEDS[k].yields[0]]}.` : `Plant them; ${SEEDS[k].n[0]} to ${SEEDS[k].n[1]} ${CROP_NAME[SEEDS[k].crop].toLowerCase()} grow.`]); }
  const mats = Object.keys(MATS).filter(k => inv.mats[k]);
  if (mats.length) { sec('Materials'); for (const k of mats) { const uses = FORGE.filter(f => inv.recipes[f.k] && f.cost.some(c => c[k])).map(f => f.name); L2.push([k, `${MATS[k]} x${inv.mats[k]}`, uses.length ? `Used for: ${uses.join(', ')}.` : 'You haven\'t learned a use for this yet.']); } }
  sec('Recipes');
  for (const f of FORGE) {
    if (inv.recipes[f.k]) L2.push([null, `${f.name}${inv.up[f.k] ? ' ' + 'I'.repeat(inv.up[f.k]) : ''}`, `${f.how} ${inv.up[f.k] >= (f.max || 3) ? 'Complete.' : 'Next: ' + costText(f.cost[inv.up[f.k]]) + '.'} ${f.what}`]);
    else L2.push([null, '???', `Not yet found. Hint: ${f.from}.`]);
  }
  sec('You');
  L2.push(['wisp', `Vigor ${Math.ceil(state.hero.vig)}/${maxVig()}`, `Depth ${inv.depth}, training ${inv.tlevel}, turnips eaten ${inv.vigBonus}.`]);
  if (false) L2.push(['page', `The stolen journal`, `The thief is somewhere along ${THIEF_ROUTE.join(', ')}. Pages found: ${state.inv.pages}.`]);
  L2.push([null, `World seed ${SEED}`, `Open the game with ?overview=${SEED} to see this world as a map.`]);
  L2.push([null, `Mushrooms found ${Object.keys(inv.shrooms).length}/${Object.keys(SHROOM_NAMES).length}`, Object.keys(inv.shrooms).map(k => SHROOM_NAMES[k]).join(', ') || 'none yet']);
  if (inv.beans && !inv.fire) L2.push(['bean', `Beans ${inv.beans}/${BEANS}`, 'For the toad\'s lunch.']);
  return L2;
}
function saveSettings() { try { localStorage.setItem('quest-settings', JSON.stringify({ settings: state.settings })); } catch (e) {} }
function loadSettings() {
  try {
    const d = JSON.parse(localStorage.getItem('quest-settings') || 'null');
    if (d && d.settings) { state.settings.tips = d.settings.tips || 'intro'; state.settings.keys = { ...DEFAULT_KEYS, ...(d.settings.keys || {}) }; if (new Set(Object.values(state.settings.keys)).size < Object.keys(state.settings.keys).length) state.settings.keys = { ...DEFAULT_KEYS }; /* two actions on one key (an old save): back to the defaults */ if (d.settings.sound === false) soundOn = false; if (d.settings.labels === false) state.settings.labels = false; if (d.settings.tiles) state.settings.tiles = true; }
  } catch (e) {}
  refreshK();
}

// =====================================================================
// Forest birds: peck about, burst into the air when you come close
// =====================================================================
const FLOCK = { arena: 3, arena_n: 2, fallsbank: 2, camp: 2, start: 3, meadow: 2, meadow2: 2, riverbank: 3, farbank: 3, w1: 3, w2: 2, w3: 1, f1: 2 };
function makeFlock(sc) {
  const n = FLOCK[sc.id] || 0, out = [];
  for (let i = 0; i < n; i++) out.push(landSpot({ mode: 'peck', t: Math.random() * 2, z: 0, c: ['#6b4a2a', '#5a5a62', '#8a6a3a'][i % 3] }));
  return out;
}
function landSpot(b) {
  for (let k = 0; k < 30; k++) {
    const x = W * (0.1 + Math.random() * 0.8), y = H * (0.15 + Math.random() * 0.75);
    if (state.solids.every(s => Math.hypot(s.x - x, s.y - y) > s.r + UNIT) && !isChasm(x, y)) { b.x = x; b.y = y; break; }
  }
  return b;
}
function scareFlock(x, y, range) {
  for (const b of state.flock) {
    if (b.mode !== 'peck' || Math.hypot(b.x - x, b.y - y) > UNIT * range) continue;
    const a = Math.atan2(b.y - y, b.x - x) + (Math.random() - 0.5);
    b.mode = 'fly'; b.vx = Math.cos(a) * 0.4 * L(); b.vy = Math.sin(a) * 0.4 * L() - UNIT * 3;
    sfx.flap(panOf(b.x));
    if (Math.random() < 0.12) state.items.push({ type: localSeed(), x: b.x, y: b.y });
  }
}
function updateFlock(dt) {
  const h = state.hero;
  for (const b of state.flock) {
    b.t -= dt;
    if (b.mode === 'peck') {
      if (b.t <= 0) { b.t = 0.5 + Math.random() * 1.5; b.x += (Math.random() - 0.5) * UNIT * 0.6; b.hop = 0.15; }
      b.hop = Math.max(0, (b.hop || 0) - dt);
      if (Math.hypot(h.x - b.x, h.y - b.y) < UNIT * 3) scareFlock(h.x, h.y, 3);
    } else if (b.mode === 'fly') {
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += UNIT * 5 * dt;
      if (b.z > UNIT * 8) { b.mode = 'gone'; b.t = 15 + Math.random() * 15; }
    } else if (b.mode === 'gone' && b.t <= 0) {
      landSpot(b);
      if (Math.hypot(h.x - b.x, h.y - b.y) < UNIT * 5) { b.t = 3; continue; }
      b.mode = 'land'; b.z = UNIT * 6; b.t = 1.2;
    } else if (b.mode === 'land') {
      b.z = Math.max(0, UNIT * 6 * b.t / 1.2);
      if (b.t <= 0) { b.mode = 'peck'; b.z = 0; }
    }
  }
}

// =====================================================================
// Webs: slow you down, and burn in a chain that lights up the cave
// =====================================================================
const inWeb = (x, y) => (state.webs || []).some(w => !w.burn && Math.hypot(x - w.x, y - w.y) < w.r * 0.9);
function igniteWeb(w) { if (w.burn || w.pending) return; w.pending = state.time + 0.08; }
function updateWebs(dt) {
  const rt = rtFor(state.scene);
  for (let i = state.webs.length - 1; i >= 0; i--) {
    const w = state.webs[i];
    if (w.pending && state.time >= w.pending && !w.burn) { w.burn = 0.001; w.pending = 0; if (Math.random() < 0.5) sfx.whumpf(); else sfx.crackle(); }
    if (!w.burn) continue;
    w.burn += dt;
    if (Math.random() < dt * 20) state.fx.push({ x: w.x + (Math.random() - 0.5) * w.r * 1.6, y: w.y + (Math.random() - 0.5) * w.r, vx: 0, vy: -UNIT * 1.6, t: 0, life: 0.6, color: Math.random() < 0.5 ? '#ffb347' : '#ff6a2a' });
    if (w.burn > 0.18 && !w.spread) {                // fire runs along to the next strands
      w.spread = true;
      for (const o of state.webs) if (o !== w && Math.hypot(o.x - w.x, o.y - w.y) < o.r + w.r + UNIT * 1.3) { o.pending = state.time + 0.12 + Math.random() * 0.15; }
      for (const p of state.gas) if (!p.burn && p.ign == null && Math.hypot(p.x - w.x, p.y - w.y) < p.r + w.r) p.ign = state.time + 0.1;
      for (const s of state.solids) if (s.bar && ['web', 'vine'].includes(s.kind) && Math.hypot(s.x - w.x, s.y - w.y) < w.r + s.r + UNIT) { breakBarrier(s.bar, 'fire'); break; }
    }
    for (const e of state.enemies) {                  // anything caught in a burning web catches too
      if (!hittable(e) || (e.webBurnt || 0) > state.time || Math.hypot(e.x - w.x, e.y - w.y) > w.r + e.r) continue;
      e.webBurnt = state.time + 1; e.burn = Math.min(8, (e.burn || 0) + 3); damage(e, 1, 'fire', 0, 0);
    }
    if (w.burn > 1.7) { if (w.idx != null) rt.flags['web' + w.idx] = true; state.webs.splice(i, 1); }
  }
}
function spinWeb(x, y) {                                // a diver's drop leaves fresh silk behind
  if (!state.webs || state.webs.length > 16) return;
  if (state.webs.some(w => Math.hypot(w.x - x, w.y - y) < w.r)) return;
  state.webs.push({ x, y, r: UNIT * rr(0.8, 1.2), idx: null, burn: 0 });
}
// ---------------- the Hollow's spore mushroom bursts when Pip is freed ----------------
function makeFloaters(n) { return Array.from({ length: n }, () => ({ x: Math.random() * W, y: H * (0.2 + Math.random() * 0.6), a: Math.random() * 6, s: 0.5 + Math.random() })); }
function burstDarkShroom() {
  const sc = sceneDef(), rt = rtFor(sc.id), f = sc.feat.darkShroom;
  if (!f || rt.flags.darkshroom) return;
  rt.flags.darkshroom = true;
  refreshSceneGeometry();
  const x = f[0] * W, y = f[1] * H;
  sfx.whumpf(); sfx.spores(); state.shake = 0.5; zoomPulse(x, y, 'boss');
  for (let i = 0; i < 40; i++) state.fx.push({ x, y: y - UNIT, vx: (Math.random() - 0.5) * UNIT * 6, vy: -UNIT * (1 + Math.random() * 3), t: 0, life: 1.8, color: '#e8d8ff' });
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, d = UNIT * (1.2 + Math.random() * 2.2); state.items.push({ type: 'spore', x: Math.max(UNIT, Math.min(W - UNIT, x + Math.cos(a) * d)), y: Math.max(UNIT, Math.min(H - UNIT, y + Math.sin(a) * d)) }); }
  state.floaters = makeFloaters(8);
  say('The mushroom bursts! Spores everywhere.', x, y - UNIT * 2, { key: 'burst', life: 3 });
}

// ---------------- the tent chest: move things between your pack and the chest, one at a time ----------------
function stashList(src) {
  const out = [];
  for (const [k, n] of Object.entries(src.food || {})) if (n > 0) out.push({ cat: 'food', k, n, icon: k, name: k[0].toUpperCase() + k.slice(1) });
  for (const [k, n] of Object.entries(src.bag || {})) if (n > 0) out.push({ cat: 'bag', k, n, icon: k, name: SEEDS[k].name });
  for (const [k, n] of Object.entries(src.raw || {})) if (n > 0) out.push({ cat: 'raw', k, n, icon: k, name: RAW[k] });
  for (const [k, n] of Object.entries(src.mats || {})) if (n > 0) out.push({ cat: 'mats', k, n, icon: k, name: MATS[k] });
  if (src.acorns > 0) out.push({ cat: 'acorns', k: 'acorn', n: src.acorns, icon: 'acorn', name: 'Acorns' });
  return out;
}
function packAsStash() { const inv = state.inv, food = {}; for (const f of inv.food) food[f] = (food[f] || 0) + 1; return { food, bag: inv.bag, raw: rawOf(), mats: inv.mats, acorns: inv.acorns }; }
function moveOne(e, toChest) {
  const inv = state.inv, ch = inv.chest || (inv.chest = {});
  const give = (cat, k) => { if (cat === 'food') { const i = inv.food.indexOf(k); if (i < 0) return false; inv.food.splice(i, 1); } else if (cat === 'acorns') { if (inv.acorns <= 0) return false; inv.acorns--; } else { const t = cat === 'raw' ? rawOf() : inv[cat]; if (!(t[k] > 0)) return false; t[k]--; } return true; };
  const take = (cat, k) => { const t = ch[cat] || (ch[cat] = {}); if (!(t[k] > 0)) return false; t[k]--; return true; };
  if (toChest) { if (!give(e.cat, e.k)) return; if (e.cat === 'acorns') ch.acorns = (ch.acorns || 0) + 1; else { const t = ch[e.cat] || (ch[e.cat] = {}); t[e.k] = (t[e.k] || 0) + 1; } }
  else {
    if (e.cat === 'acorns') { if (!(ch.acorns > 0)) return; ch.acorns--; inv.acorns = Math.min(30, inv.acorns + 1); }
    else { if (e.cat === 'food' && inv.food.length >= 8) { state.menu.note = 'Your pack can\'t hold more food.'; return; } if (!take(e.cat, e.k)) return; if (e.cat === 'food') inv.food.push(e.k); else { const t = e.cat === 'raw' ? rawOf() : inv[e.cat]; t[e.k] = (t[e.k] || 0) + 1; } }
  }
  sfx.tock();
}
function updateChest(m) {
  const lists = [stashList(packAsStash()), stashList(state.inv.chest || {})], L = lists[m.col];
  if (pressedNow.left) { m.col = 0; m.sel = Math.min(m.sel, Math.max(0, lists[0].length - 1)); }
  if (pressedNow.right) { m.col = 1; m.sel = Math.min(m.sel, Math.max(0, lists[1].length - 1)); }
  if (pressedNow.up) m.sel = Math.max(0, m.sel - 1);
  if (pressedNow.down) m.sel = Math.min(Math.max(0, L.length - 1), m.sel + 1);
  if (pressedNow.act && L[m.sel]) { m.note = ''; moveOne(L[m.sel], m.col === 0); const n = stashList(m.col === 0 ? packAsStash() : state.inv.chest || {}).length; m.sel = Math.min(m.sel, Math.max(0, n - 1)); }
}
// Pip's book: rules first, then training notes
// Pip's notes: one idea per line, a silly drawing beside each (drawn in drawDoodle, p7). Built when opened, so the
// keys shown are the ones you've set.
const BOOK_PAGES = () => [
  { title: 'Pip\'s Rules', bits: [['carrot', 'Always bring snacks.'], ['gremlin', 'Never trust a smiling gremlin.'], ['poke', 'If it glows, poke it first.']] },
  { title: 'Getting about', bits: [['arrows', TOUCH ? 'Walk with the pad.' : 'Arrows walk.'], ['jump', `${keyName(K.jump)} jumps.`], ['goldf', `${K.act.toUpperCase()} does what the gold label says.`]] },
  { title: 'Fighting', bits: [['slash', `Tap ${K.act.toUpperCase()}: slash.`], ['stab', `Hold ${K.act.toUpperCase()}, let go: stab!`], ['pound', `Jump, then ${K.act.toUpperCase()}: POUND.`]] },
  { title: 'Growing', bits: [['seed', 'Seed + dirt = snacks later.'], ['compost', 'Acorns in the dirt: compost!'], ['sprout', 'Wait. Then pull.']] },
  { title: 'Making', bits: [['mat', `${K.menu.toUpperCase()}, Craft: thing + thing = ?`], ['glue', 'Fluff + fluff = glue.'], ['mark', 'Camp pieces go on the X.']] },
  { title: 'Tired?', bits: [['zzz', 'Low vigor: slow and floppy.'], ['fire', 'Sit by the fire.'], ['snack', 'Eat something!']] },
];
const BOOK = { get length() { return BOOK_PAGES().length; } };
