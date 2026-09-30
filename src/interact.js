// ===== interact.js: F does what is here: interact(), findInteractable, patches (plant/compost menu, harvest), NPC talks, fishing, rapids, spore travel, the raft sidequest.

// =====================================================================
// Interacting: talk, rest at the fire, farm, lift the loose rock
// =====================================================================
function npcPos(n) { return [n.fx * W, n.fy * H]; }
function npcHere(n) { return n.kind !== 'pip' || (n.home ? state.inv.pipSaved : !state.inv.pipSaved); }
// F does what is here. Each handler looks at one kind of thing and returns true when it used the press (or false to
// stop: hands full, mid-talk). Falling through means "not mine". INTERACTIONS is the priority order.
function interactLantern(sc, h) {
  if (sc.id !== 'tentin' || state.inv.lantern || !state.dusk) return;
  const [x, y] = lanternSpot(); if (Math.hypot(h.x - x, h.y - y) > UNIT * 1.5 || !pressedNow.act) return;
  collect({ type: 'lantern', x, y }); return true;
}
const INTERACTIONS = [interactTalk, interactLantern, interactTrapdoor, (sc, h) => sc.feat.beetle ? interactBeetle(sc, h) : undefined, interactHandsFull, interactPickup, interactMirror, interactPortals, interactFishing, interactRiverQuest, interactMushroom, interactPeople, interactTentDoor, interactBedroll, interactChest, interactBook, interactBuild, interactCampfire, interactBench, interactPatches, interactLift];
function interact() {
  const sc = sceneDef(), h = state.hero, rt = rtFor(sc.id);
  const nearPull = sc.pullables.some(p => p.kind !== 'crop' && !pullLocked(p) && !rt.pulled.has(p.id) && Math.hypot(h.x - p.fx * W, h.y - p.fy * H) < UNIT * 1.8);
  for (const f of INTERACTIONS) { const r = f(sc, h, rt, nearPull); if (r === true || r === false) return r; }
  return false;
}
function interactTalk(sc, h, rt, nearPull) {
  if (state.npcTalk) {
    if (pressedNow.act) advanceTalk();
    return true;
  }
}
function interactHandsFull(sc, h, rt, nearPull) {
  if (state.carry) return false;                    // hands full: F belongs to the rock
}
function interactPickup(sc, h, rt, nearPull) {
  if (pressedNow.act && pickUpHere()) return true;  // something at your feet: F picks it up (it sparkles harder as you near it)
}
function interactMirror(sc, h, rt, nearPull) {
  if (sc.feat.mirror && pressedNow.act && Math.hypot(h.x - sc.feat.mirror[0] * W, h.y - sc.feat.mirror[1] * H) < UNIT * 1.8) { state.menu = { view: 'poses', sel: 0, note: '' }; sfx.tock(); return true; }
}
function interactPortals(sc, h, rt, nearPull) {
  for (const q of sc.feat.portals || []) if (pressedNow.act && Math.hypot(h.x - q.fx * W, h.y - q.fy * H) < UNIT * 1.6) {
    if (q.pid.startsWith('zone:')) enterZone(q.pid.slice(5)); else enterPuzzle(PUZZLES.find(p => p.id === q.pid));
    return true;
  }
}
function interactFishing(sc, h, rt, nearPull) {
  if (state.fish) return true;                      // fishing has the hands
}
function interactRiverQuest(sc, h, rt, nearPull) {
  if (riverSideQuest(sc, h)) return true;
}
function interactMushroom(sc, h, rt, nearPull) {
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
      openMapTab();                                   // spore travel lives on the Map tab now
      return true;
    }
  }
}
function interactPeople(sc, h, rt, nearPull) {
  for (const n of sc.npcs) {
    if (!npcHere(n)) continue;
    const [nx, ny] = npcPos(n), d = Math.hypot(h.x - nx, h.y - ny);
    if (d < UNIT * 3.2) say(`${K.act} to talk`, nx, ny - UNIT * 1.5, { key: 'talk-' + n.kind, tip: 'talk', life: 2.5 });
    if (d < UNIT * 2 && pressedNow.act) { startTalk(n); return true; }
  }
}
function interactTrapdoor(sc, h) {                   // the trapdoor in Old Wick's floor, down to his cellar
  const t = sc.feat.trapdoor; if (!t || !pressedNow.act || Math.hypot(h.x - t[0] * W, h.y - t[1] * H) > UNIT * 1.2) return;
  sfx.tock(); transitionTo('cellar', 0.5, 0.2); return true;
}
function openMapTab() { state.menu = { view: 'pack', tab: PACK_TABS.indexOf('Map'), sel: 0, focus: 'grid', act: 0, note: '' }; state.keys = {}; state.prevKeys = {}; sfx.tock(); }
function interactTentDoor(sc, h, rt, nearPull) {
  if (sc.feat.tentDoor && campBuilt('tent') && pressedNow.act && Math.hypot(h.x - sc.feat.tentDoor[0] * W, h.y - sc.feat.tentDoor[1] * H) < UNIT * 1.2) { sfx.tock(); transitionTo('tentin', 0.5, 0.8, true); return true; }
}
function interactBedroll(sc, h, rt, nearPull) {
  if (sc.feat.bedroll && pressedNow.act && Math.hypot(h.x - sc.feat.bedroll[0] * W, h.y - sc.feat.bedroll[1] * H) < UNIT * 1.8) { h.vig = maxVig(); sfx.heart(); say('A quick nap. Vigor restored.', h.x, h.y - UNIT * 1.2, { key: 'item', life: 2.2, color: '#b8f28a' }); return true; }
}
function interactChest(sc, h, rt, nearPull) {
  if (sc.feat.chest && pressedNow.act && Math.hypot(h.x - sc.feat.chest[0] * W, h.y - sc.feat.chest[1] * H) < UNIT * 1.6) { state.menu = { view: 'chest', col: 0, sel: 0, note: '' }; sfx.tock(); return true; }
}
function interactBook(sc, h, rt, nearPull) {
  if (sc.feat.book && pressedNow.act && Math.hypot(h.x - sc.feat.book[0] * W, h.y - sc.feat.book[1] * H) < UNIT * 1.6) { state.menu = { view: 'book', page: 0 }; sfx.tock(); return true; }
}
function interactBuild(sc, h, rt, nearPull) {
  for (const b of sc.feat.buildSpots || []) {
    if (campBuilt(b.piece) || !pressedNow.act || Math.hypot(h.x - b.fx * W, h.y - b.fy * H) > UNIT * (b.r + 0.9)) continue;
    const line = setCampPart(b);
    say(line || (b.piece === 'fire' ? `The fire ring goes here: ${CAMP_PARTS.fire.stones} smooth stones, then tinder.` : `The bench goes here: two frames.`), b.fx * W, b.fy * H - UNIT, { key: 'spot', life: 2.2 }); return true;
  }
}
function interactCampfire(sc, h, rt, nearPull) {
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
}
function interactBench(sc, h, rt, nearPull) {
  if (sc.feat.bench && (sc.id !== 'camp' || campBuilt('bench'))) {
    const [bx, by] = sc.feat.bench, d = Math.hypot(h.x - bx * W, h.y - by * H);
    if (d < UNIT * 2.4) say(`${K.act} to work at the bench`, bx * W, by * H - UNIT * 1.2, { key: 'bench', tip: 'bench', life: 3 });
    if (d < UNIT * 1.9 && pressedNow.act) { state.menu = { view: 'forge', sel: 0, note: '' }; state.keys = {}; state.prevKeys = {}; sfx.tock(); return true; }
  }
}
function interactPatches(sc, h, rt, nearPull) {
  if (sc.feat.plots && !nearPull) {
    const plots = rt.flags.plots || (rt.flags.plots = sc.feat.plots.map(() => ({ s: 0, t: 0, lv: sc.feat.plotLv || 0 })));
    let nearestPlot = -1, nd = UNIT * 0.8;              // the patch you're standing on, not just the first one in reach
    sc.feat.plots.forEach(([qx, qy], j) => { const dd = Math.hypot(h.x - qx * W, h.y - qy * H); if (dd <= nd) { nd = dd; nearestPlot = j; } });
    for (let i = 0; i < plots.length; i++) {
      const [px, py] = sc.feat.plots[i], d2 = Math.hypot(h.x - px * W, h.y - py * H);
      if (i !== nearestPlot) continue;
      const p = plots[i], stage = plotStage(p), crop = cropOfPlot(p, sc, i);
      const have = Object.keys(SEEDS).filter(k => state.inv.bag[k] > 0);   // every seed you carry is on offer
      const next = PATCH[(p.lv || 0) + 1], improve = p.s === 0 && next && canAfford(next.cost);
      // a ripe crop comes up like a buried rock: hold F, rock it left and right, then pull up (updatePull, kind 'crop').
      // Farming makes it easier (fewer rocks); at the top it's just F.
      if (p.s === 1 && stage >= 3) {
        if (cropNeed() > 0 && state.cropFree !== sc.id + ':' + i) return false;          // the pull does it
        if (state.cropFree !== sc.id + ':' + i && !pressedNow.act) return false;
        state.cropFree = null;
      }
      // F at an empty patch opens a small menu: plant any seed you carry, or compost the patch. Nothing to offer: a hint.
      if (p.s === 0 && !have.length && !improve) { if (pressedNow.act) say(`${patchOf(p).name}. Birds and gremlins drop seeds; rarer seeds come from tougher things.`, px * W, py * H - UNIT, { key: 'plot', life: 2.5 }); return pressedNow.act; }
      if (!pressedNow.act && !(p.s === 1 && stage >= 3)) return false;
      const doImprove = () => {
        payFor(next.cost); p.lv = (p.lv || 0) + 1; sfx.forge(); spark(px * W, py * H, '#c9a46a', 12, 2.5); zoomPulse(px * W, py * H, 'pickup');
        say(`${next.name}: grows faster${next.bonus ? ', sometimes gives extra' : ''}${next.seedBack ? ', sometimes gives a seed back' : ''}.`, px * W, py * H - UNIT, { key: 'plot', life: 3.5, color: '#ffe38a' });
      };
      if (p.s === 0) {
        const opts = have.map(k => `Plant ${SEEDS[k].name.toLowerCase()} (${state.inv.bag[k]})`).concat(improve ? [`${next.cost.acorn ? 'Compost' : 'Improve'} (${patchCost(next.cost)})`] : []);
        ask(patchOf(p).name, px * W, py * H - UNIT, opts, i2 => i2 < have.length ? plantHere(have[i2]) : doImprove());
      }
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
}
function interactLift(sc, h, rt, nearPull) {
  if (!state.carry) {
    const rock = state.items.find(it => it.type === 'bigrock' && Math.hypot(h.x - it.x, h.y - it.y) < UNIT * 1.3);
    if (rock && pressedNow.act) { state.items.splice(state.items.indexOf(rock), 1); state.carrySeed = rock.seed != null ? rock.seed : 3.7; state.carry = 'rock'; state.carryT = state.time; sfx.lift(); refreshButtons(); return true; }
  } else if (pressedNow.act) { dropRock(); return true; }
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
const SPORE_TIME = 90;                               // seconds for a mushroom to grow one spore (holds up to 3)
// Travel costs spores by distance: 1 spore per 3 screens you'd otherwise walk (at least 1).
let WORLD_ADJ = { world: null, adj: null };            // which screens touch which, built once per world (screensBetween runs every frame)
function screensBetween(a, b) {
  if (a === b) return 0;
  if (WORLD_ADJ.world !== WORLD) {
    const adj = {}, link = (x, y) => { (adj[x] = adj[x] || new Set()).add(y); (adj[y] = adj[y] || new Set()).add(x); };
    for (const [id, sc] of Object.entries(WORLD)) for (const ex of sc.exits) link(id, ex.to);
    link('w3', 'c1');                                 // the sinkhole
    WORLD_ADJ = { world: WORLD, adj };
  }
  const adj = WORLD_ADJ.adj, seen = { [a]: 0 }, q = [a];
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
    for (const p of sc.pullables) if (!rt.pulled.has(p.id) && !pullLocked(p)) add(p.fx * W, p.fy * H, 'Pull', p.kind === 'sword' ? 0.9 : 1.8);   // the hidden hilt only shows it's a handle when you're right on it
    for (const it of state.items) if (it.type === 'bigrock') add(it.x, it.y, 'Lift', 1.3);
  }
  if (f.fire && sc.id === 'camp' && campBuilt('fire')) add(f.fire[0] * W, f.fire[1] * H, 'Rest', 1.7);
  if (f.bench && (sc.id !== 'camp' || campBuilt('bench'))) add(f.bench[0] * W, f.bench[1] * H, 'Craft', 1.9);
  for (const b of f.buildSpots || []) if (!campBuilt(b.piece)) { const r0 = rawOf(), P = campParts(); const v = b.piece === 'fire' ? (P.stones < CAMP_PARTS.fire.stones && r0.stone ? 'Set stones' : P.stones >= CAMP_PARTS.fire.stones && r0.tinder ? 'Add tinder' : r0.firering ? 'Build' : null) : (r0.benchframe ? 'Set frame' : r0.benchkit ? 'Build' : null); if (v) add(b.fx * W, b.fy * H, v, b.r + 0.9); }
  if (f.tentDoor && campBuilt('tent')) add(f.tentDoor[0] * W, f.tentDoor[1] * H, 'Enter', 1.2);
  if (f.bedroll) add(f.bedroll[0] * W, f.bedroll[1] * H, 'Nap', 1.8);
  if (f.chest) add(f.chest[0] * W, f.chest[1] * H, 'Storage', 1.6);
  if (f.trapdoor) add(f.trapdoor[0] * W, f.trapdoor[1] * H, 'Go down', 1.2);
  if (sc.id === 'tentin' && !state.inv.lantern && state.dusk) { const [lx, ly] = lanternSpot(); add(lx, ly, 'Take lantern', 1.5); }
  if (f.book) add(f.book[0] * W, f.book[1] * H, 'Read', 1.6);
  if (f.shroom && inv.pipSaved && inv.shrooms[sc.id]) add(f.shroom[0] * W, f.shroom[1] * H, 'Travel', 1.9);
  if (f.plots && !state.carry) {
    const plots = rt.flags.plots || [];
    f.plots.forEach((q, i) => {
      const p = plots[i] || { s: 0 }, st = plotStage(p);
      const nx = PATCH[(p.lv || 0) + 1];
      if (p.s === 0 && Object.values(inv.bag).some(v => v > 0)) add(q[0] * W, q[1] * H, 'Plant', 0.8);
      else if (p.s === 0 && nx && canAfford(nx.cost)) add(q[0] * W, q[1] * H, nx.cost.acorn ? 'Compost' : 'Improve', 0.8);
      if (p.s && st >= 3 && !cropNeed()) add(q[0] * W, q[1] * H, 'Pull up', 0.8);
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
  if (n.kind === 'worm') return wormLines();
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
      return { lines: ['Home. I\'ve never been so happy to see that lean-to.', 'Remember the gremlins\' trick? Smash a bunch of spores at once near one of those big mushrooms, and you pop out at another.', 'You\'ve been picking spores up all along without knowing it, you know. Check your pockets.', 'Now that you know how, you can jump to any mushroom you\'ve found from anywhere, not just from another mushroom. Farther jumps take more spores.', 'Spore travel is in your menu now. Go on, try it.'] };
    }
    return { lines: [pick(['Found the swamp shrine yet? Those stones give me the shivers.', `You've got ${inv.spores} spores. A short hop is only 1.`, 'Each mushroom grows new spores while you\'re away. Visit them now and then.', 'I planted a few things while you were out. Check the plots!'])] };
  }
  if (n.kind === 'pip') {
    if (!broken(state.scene, 'cocoon')) return { lines: ['Mmmph! The vines! Cut me loose!'] };
    return { lines: ['You came for me!', 'Those gremlins dragged me all the way down here. I think they wanted me for dinner.', 'And one of them ran off with my journal. Every map I ever drew is in there.', 'Wait. Look at the spores drifting off that burst mushroom...', 'I remember now! The gremlins smash a whole handful of spores at once and POP, they\'re at another mushroom. That\'s how they got me down here so fast!', 'Look, they\'re clinging to you already. That\'s enough to get us home. I\'ll put the kettle on.'], then: startRescue };
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
