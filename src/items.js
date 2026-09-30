// ===== items.js: Things on the ground: pickup (F, gathering), collect(), drops and relics, seeds, buried rocks and pulls (rocks, sword, crops), mud, hidden loose spots, trees dropping sticks and acorns.
// =====================================================================
// Pulling things free: hold F, rock left/right, pull up
// =====================================================================
// a thrown rock (or a swing, or a stomp) against a breakable stone: tough stones take several good hits, and not every hit counts
// a thrown rock against a boulder (crag): every hit counts, and it takes as many as it is tiles across. Only that
// boulder breaks: it falls to pieces, and one piece is a rock you can pick up and throw at the next.
function hitCrag(o) {
  const rt = rtFor(state.scene), key = 'hits_' + o.bar, hp = o.hp || 1;
  rt.flags[key] = (rt.flags[key] || 0) + 1;
  if (rt.flags[key] >= hp) {
    const x = o.x, y = o.y, r = o.r;
    for (let i = 0; i < 18 + (o.size || 1) * 6; i++) { const a = Math.random() * 6.28, v = UNIT * (1.5 + Math.random() * 4); state.fx.push({ x: x + Math.cos(a) * r * 0.4, y: y + Math.sin(a) * r * 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v - UNIT * 2, t: 0, life: 0.6 + Math.random() * 0.5, color: i % 3 ? (o.tint || '#8a8478') : '#5a5048', size: UNIT * (0.1 + Math.random() * 0.18) }); }
    breakBarrier(o.bar, 'rock');
    if (o.drops) { for (const [type, n] of Object.entries(o.drops)) for (let i = 0; i < n; i++) { const a = i / n * 6.28; state.items.push(freeItemSpot({ type, x: x + Math.cos(a) * r * 0.7, y: y + Math.sin(a) * r * 0.5 })); } }   // what was inside
    else state.items.push(freeItemSpot({ type: 'bigrock', x: x + UNIT * 0.3, y: y + r * 0.5 }));   // a piece big enough to throw
    state.shake = 0.35 + (o.size || 1) * 0.05; sfx.crash();
  } else {
    sfx.crash(); state.shake = 0.12; spark(o.x, o.y - o.r * 0.2, '#9a948a', 8, 2);
    say(o.pound ? `Crack! Again!` : `Cracking! ${hp - rt.flags[key]} more.`, o.x, o.y - o.r - UNIT * 0.4, { key: 'stonehit', life: 1.4 });
  }
}
function hitStone(o, force) {
  const rt = rtFor(state.scene), cs = sceneDef().solids.find(s => s.bar === o.bar && s.kind === 'cracked') || sceneDef().solids.find(s => s.bar === o.bar), S = cs && cs.stone && STONES[cs.stone];
  const dur = S ? S.dur : 1, key = 'hits_' + o.bar;
  const counts = !S ? force >= 0.7 || rng() < 0.75 : rng() < 0.45 + 0.4 * Math.min(1, force);
  if (!counts) { sfx.tock(); spark(o.x, o.y, '#9a948a', 4, 1.5); say(S ? `${S.name}. It shrugs that one off.` : 'Glanced off! Try again.', o.x, o.y - UNIT, { key: 'stonehit', life: 1.4 }); return; }
  rt.flags[key] = (rt.flags[key] || 0) + 1;
  if (rt.flags[key] >= dur) breakBarrier(o.bar, 'rock');
  else { sfx.crash(); state.shake = 0.15; spark(o.x, o.y, S ? S.tint : '#8f887c', 8, 2); say(`${S.name}: cracking. ${dur - rt.flags[key]} more.`, o.x, o.y - UNIT, { key: 'stonehit', life: 1.6 }); }
}
// buried rocks have to be knocked loose before you can rock them out
// the big buried stones sit there from the start, but they're scenery until the adventure begins (after twilight):
// no pull, no pounding loose, no hint. Mud rocks (your own throws) and the sword are never locked.
function pullLocked(pl) { if (pl.early) return !(state.inv.pipTips || {})['stone-loosen']; return pl.kind === 'rock' && !pl.mud && !storyAt('adventure'); }   // an 'early' stone waits until Pip has shown you   // (a rock you threw and buried is never locked)
function knockRocks(x, y, reach) {
  const sc = sceneDef(), rt = rtFor(sc.id);
  for (const pl of sc.pullables) {
    if (pullLocked(pl)) continue;
    if (pl.kind !== 'rock' || rt.pulled.has(pl.id) || rt.flags['knocked_' + pl.id]) continue;
    const px = pl.fx * W, py = pl.fy * H;
    if (Math.hypot(px - x, py - y) > reach) continue;
    rt.flags['knocked_' + pl.id] = true; rt.flags['knockT_' + pl.id] = state.time;   // (for the pop)
    sfx.crash(); state.shake = 0.2; zoomPulse(px, py, 'parry');
    for (let d = 0; d < 10; d++) state.fx.push({ x: px + (Math.random() - 0.5) * UNIT, y: py + UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 4, vy: -UNIT * (1 + Math.random() * 2.5), t: 0, life: 0.7, color: Math.random() < 0.5 ? '#5a4128' : '#6e5234', size: UNIT * 0.09 });
    say(`THUNK. It shifted! Now hold ${K.act} and rock it.`, px, py - UNIT * 1.3, { key: 'pull', life: 3 });
  }
}
// ripe crops join the pullables while they're ripe (and need rocking), so they pull exactly like rocks and the sword
function syncCropPulls(sc) {
  sc.pullables = sc.pullables.filter(q => q.kind !== 'crop');
  const plots = sc.feat.plots, rt = rtFor(sc.id), need = cropNeed();
  if (!plots || !rt.flags.plots || !need) return;
  rt.flags.plots.forEach((q, i) => { if (q.s === 1 && plotStage(q) >= 3) sc.pullables.push({ id: 'crop' + i, kind: 'crop', plot: i, fx: plots[i][0], fy: plots[i][1], need }); });
}
const PULL = {
  crop: {
    approach: () => `Ripe! Hold ${K.act}, rock it ${K.l} ${K.r}, then pull ${K.u}`,
    fails: () => [`It's rooted in. Hold ${K.act} and rock it ${K.l} ${K.r}`, 'Pulling straight just stretches the leaves.'],
    rock: ['It wiggles.', 'The soil cracks.', 'Loosening...', `Loose! Pull ${K.u}`],
    notYet: () => `Not yet. Rock it ${K.l} ${K.r}`,
  },
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
  if (sc.feat.plots) syncCropPulls(sc);
  let near = null, nd = UNIT * 1.7;                  // the nearest one in reach (two ripe patches side by side: the one you're on)
  if (!state.carry) for (const pl of sc.pullables) {
    if (rt.pulled.has(pl.id) || pullLocked(pl)) continue;
    const d = Math.hypot(h.x - pl.fx * W, h.y - pl.fy * H);
    if (d < nd) { nd = d; near = pl; }
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
// soft ground: a thrown rock can bury itself where it lands, not only in mud (EARTHEN areas, off rock and water)
const EARTHEN = new Set(['forest', 'woods', 'field', 'marsh', 'swamp']);
const earthen = (x, y, sc = sceneDef()) => EARTHEN.has(sc.area) && !(sc.rocks && onRock(sc, x, y)) && !isChasm(x, y);
function sinkRock(x, y, how = 'mud') {
  const sc = sceneDef(), rt = rtFor(sc.id), id = 'mud' + (rt.flags.mudN = (rt.flags.mudN || 0) + 1);
  (rt.flags.mudRocks = rt.flags.mudRocks || []).push({ id, fx: x / W, fy: y / H });
  syncMudRocks(sc);
  sfx.splash(); state.shake = 0.12;
  for (let d = 0; d < 14; d++) state.fx.push({ x: x + (Math.random() - 0.5) * UNIT * 0.8, y, vx: (Math.random() - 0.5) * UNIT * 4, vy: -UNIT * (1 + Math.random() * 2.5), t: 0, life: 0.7, color: Math.random() < 0.5 ? '#3e2c18' : '#5a4128', size: UNIT * 0.1 });
  say(how === 'mud' ? 'Glorp. Stuck in the mud.' : 'Thunk. It buried itself in the soft earth.', x, y - UNIT * 1.2, { key: 'mud', life: 2.2, color: '#c9a86a' });
  say(`A buried rock is stuck fast. Pound beside it (${K.jump} then ${K.act}), then rock it and heave it out.`, x, y, { key: 'mudtip', tip: 'mud', life: 4 });
}
function freePullable(pl, x, y) {
  if (pl.kind === 'crop') { state.pull = newPull(null); unsay('pull'); state.cropFree = state.scene + ':' + pl.plot; state.forceInteract = true; syncCropPulls(sceneDef()); return; }   // the patch code harvests it
  if (pl.mud) { const rt = rtFor(state.scene); rt.flags.mudRocks = (rt.flags.mudRocks || []).filter(m => m.id !== pl.id); delete rt.flags['knocked_' + pl.id]; syncMudRocks(sceneDef()); }
  else rtFor(state.scene).pulled.add(pl.id);
  state.pull = newPull(null);
  unsay('pull');
  if (pl.kind === 'rock') {
    sfx.lift(); zoomPulse(x, y, 'pickup'); spark(x, y, '#6a4a2a', 12, 3);
    for (let d = 0; d < 18; d++) state.fx.push({ x: x + (Math.random() - 0.5) * UNIT, y: y + UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 5, vy: -UNIT * (2 + Math.random() * 3), t: 0, life: 0.8, color: Math.random() < 0.5 ? '#5a4128' : '#6e5234', size: UNIT * (0.08 + Math.random() * 0.06) });   // heaved out in a shower of dirt
    state.carry = 'rock'; state.carryT = state.time; state.carrySeed = rockSeedOf(pl); refreshButtons();
    say(`Heavy! It takes both hands. Tap ${K.act} to set it down ahead of you, or hold ${K.act} to aim and let go to throw.`, x, y - UNIT * 1.6, { key: 'pull', life: 5, tip: 'throw-rock' });
  } else startSwordCut();
}

// =====================================================================
// Drops: every monster leaves something tied to what it was
// =====================================================================
// Drop tables: rolled in order, first hit wins. Relics are rare and level up (to 3).
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
  for (const [t, p] of monster(e).drop || []) {
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
const TOUCH_PICKUP = new Set(['spore', 'spores7', 'wisp']);
const PICK_R = 1.15;                                     // tiles: how close F reaches for something on the ground
// the thing on the ground F would pick up right now (nearest, within reach), or null
// a dropped thing must be reachable: if it would land inside a tree or rock, it's nudged out past the edge
function freeItemSpot(it) {
  for (let k = 0; k < 8; k++) {
    const s = state.solids.find(o => o.kind !== 'shroom' && Math.hypot(o.x - it.x, o.y - it.y) < o.r + UNIT * 0.35);
    if (!s) break;
    const dx = it.x - s.x, dy = it.y - s.y, d = Math.hypot(dx, dy) || 1, r = s.r + UNIT * 0.45;
    it.x = s.x + (d < 1e-3 ? 0 : dx / d) * r; it.y = s.y + (d < 1e-3 ? 1 : dy / d) * r;
  }
  it.x = Math.max(UNIT * 0.6, Math.min(W - UNIT * 0.6, it.x)); it.y = Math.max(UNIT * 0.6, Math.min(H - UNIT * 0.6, it.y));
  return it;
}
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
const LETTER_TEXT = 'A letter, weighted with a pipe: "If you\'re reading this, you found my shack. Don\'t mind the smell. The pool downriver has fish as big as boots, so I lashed four logs of driftwood with thorn twine and went. The old jetty on the near bank still holds. Take the seeds, they\'ll only go to waste. Mind the rapids. Old Wick."';
function collect(it) {
  if ((it.type === 'spore' || it.type === 'spores7') && !state.inv.pipSaved) { state.inv.spores += it.type === 'spores7' ? 7 : 1; return; }   // pocketed without a word
  const inv = state.inv, h = state.hero;
  const tell = (s, life = 4, tip) => heroNote(s, 1.1, { key: 'item', life, tip });
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
      else { heroNote(`${S.name}! ${S.rarity}.`, 1.1, { key: 'item', life: 3, color: S.color }); say(`Rare seeds grow into materials for your gear. Work them at the camp bench.`, h.x, h.y + UNIT * 1.6, { key: 'seedtip', tip: 'rareseed', life: 5 }); }
      if (it.type === 'starseed' || it.type === 'ironseed') { state.slowmo = 0.4; sfx.shing(); }
      break;
    }
    case 'page': {
      inv.pages++;
      const note = PAGE_NOTES[(inv.pages - 1) % PAGE_NOTES.length];
      heroNote(`A page of Pip's journal: "${note}"`, 1.3, { key: 'page', life: 6, color: '#fff3c8' });
      const lore = PAGE_LORE[(inv.pages - 1) % PAGE_NOTES.length];
      if (lore && hearRecipe(lore)) say(`That gives you an idea for the mat: ${OUT_NAME[lore]}.`, h.x, h.y + UNIT * 1.2, { key: 'lore', life: 4, color: '#c9a2ff' });
      break;
    }
    case 'lantern': inv.lantern = true; sfx.pickup(); showTitle('Candle lantern', 'a warm pool of light, wherever you go', 'relic', 3.6); break;
    case 'journal':
      inv.journal = 3; sfx.victory();
      showTitle('Pip\'s Journal', 'every map Pip ever drew. Open Map in your menu, then bring it home', 'relic', 5);
      break;
    case 'letter':
      inv.letter = true;                                  // kept: Gear > Wick's letter, to read again
      heroNote('A letter, weighted with a pipe: "If you\'re reading this, you found my shack. Don\'t mind the smell. The pool downriver has fish as big as boots, so I lashed four logs of driftwood with thorn twine and went. The old jetty on the near bank still holds. Take the seeds, they\'ll only go to waste. Mind the rapids. Old Wick."', 1.3, { key: 'letter', life: 10, color: '#fff3c8' });
      break;
    case 'stick': case 'stone': case 'fluff':
      rawOf()[it.type] = (rawOf()[it.type] || 0) + 1;
      heroNote(`+1 ${RAW[it.type].toLowerCase()} (${rawOf()[it.type]})`, 1.1, { key: 'raw' + it.type, life: 1.4, color: '#ffe38a' });
      break;
    case 'driftwood': inv.mats.driftwood++; heroNote(`+1 driftwood (${inv.mats.driftwood})`, 1.1, { key: 'matdrift', life: 1.8, color: '#ffe38a' }); break;
    case 'rod': inv.rod = true; showTitle('Old Wick\'s fishing rod', `stand by a ripple and press ${K.act} to cast`, 'relic', 3.5); break;
    case 'fish': inv.food.push('fish'); tell(`A gleaming fish! ${K.eat} to eat: vigor now, and more of it for a while.`, 4, 'fish'); break;
    case 'recipe_temper': learnRecipe('temper', 'A smith\'s scrap, half eaten by damp.'); break;
    case 'recipe_star': learnRecipe('star', 'Carved on the shrine stone.'); break;
    case 'spores7': inv.spores += 7; if (inv.pipSaved) heroNote('+7 spores', 1.1, { key: 'item', life: 2, color: '#e8d8ff' }); break;   // silent until Pip explains them
    case 'spore': inv.spores++; if (inv.pipSaved) heroNote(`+1 spore (${inv.spores})`, 1.1, { key: 'spore', life: 1.2, color: '#e8d8ff' }); break;
    case 'ear': case 'hide':
      inv.mats[it.type]++;
      heroNote(`+1 ${MATS[it.type]} (ears ${inv.mats.ear}, hide ${inv.mats.hide})`, 1.1, { key: 'mat' + it.type, life: 2, color: '#ffe38a' });
      if (!inv.recipes.cap && !inv.scalp) setTimeout(() => learnRecipe('cap', 'Those ears would make a fine cap, with a scrap of hide to hold them.'), 0);
      break;
    case 'thorn': case 'ember': case 'ironwood': case 'starpetal': inv.mats[it.type]++;
      if (it.type === 'thorn' && !inv.recipes.edge) setTimeout(() => learnRecipe('edge', 'You test a thorn on your thumb. Sharp. It could hone a blade.'), 0); heroNote(`+1 ${MATS[it.type]}`, 1.1, { key: 'mat' + it.type, life: 1.6, color: '#ffe38a' }); break;
    case 'bean':
      inv.beans++;
      heroNote(inv.beans >= BEANS ? `All ${BEANS} beans! Back to the toad.` : `Bean ${inv.beans} of ${BEANS}`, 1.1, { key: 'item', life: 2.5 });
      break;
  }
  refreshButtons();
}

// Every outdoor screen hides a couple of spots where a good pound shakes something loose: a seed, an acorn, a
// stone, now and then something better. Nothing marks them. Close but not quite, the ground just rattles a little.
const LOOSE_FINDS = [['seed', 34], ['acorn', 22], ['stone', 14], ['stick', 10], ['berries', 8], ['thornseed', 6], ['carrotseed', 4], ['emberseed', 2]];
function looseSpots() {
  const sc = sceneDef(), rt = rtFor(sc.id);
  if (rt.flags.loose) return rt.flags.loose;
  const out = [];
  if (sc.area === 'indoor' || sc.id === 'puzzlehub' || sc.id === 'arena') return (rt.flags.loose = out);
  const n = 2 + (Math.random() < 0.4 ? 1 : 0);
  for (let tries = 0; out.length < n && tries < 60; tries++) {
    const x = UNIT * 1.5 + Math.random() * (W - UNIT * 3), y = UNIT * 1.5 + Math.random() * (H - UNIT * 3);
    if (isChasm(x, y, UNIT) || state.solids.some(s => Math.hypot(s.x - x, s.y - y) < s.r + UNIT * 0.8)) continue;
    out.push({ fx: x / W, fy: y / H, found: false });
  }
  return (rt.flags.loose = out);
}
// with a good gathering eye, the loose ground starts to show: a faint scuff at level 5, plainer as you go on
function drawLooseHints(sc) {
  const L = gatherLevel(); if (L < 5 || state.scene !== sc.id) return;
  const a = Math.min(0.4, 0.06 + (L - 5) * 0.05);
  for (const s of looseSpots()) {
    if (s.found) continue;
    const x = s.fx * W, y = s.fy * H;
    ctx.fillStyle = `rgba(90,62,34,${a})`; ctx.beginPath(); ctx.ellipse(x, y + UNIT * 0.1, UNIT * 0.42, UNIT * 0.16, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = `rgba(60,40,20,${a})`; for (const [dx, dy] of [[-0.18, 0.05], [0.12, 0.12], [0.2, 0.0]]) { ctx.beginPath(); ctx.arc(x + dx * UNIT, y + dy * UNIT, UNIT * 0.04, 0, 6.28); ctx.fill(); }
    if (L >= 9 && Math.sin(state.time * 1.3 + s.fx * 20) > 0.97) { ctx.fillStyle = 'rgba(255,240,200,.35)'; ctx.beginPath(); ctx.arc(x, y, UNIT * 0.06, 0, 6.28); ctx.fill(); }
  }
}
function poundLoose(x, y) {
  for (const s of looseSpots()) {
    if (s.found) continue;
    const sx = s.fx * W, sy = s.fy * H, d = Math.hypot(sx - x, sy - y);
    if (d < UNIT * 1.7) {
      s.found = true;
      let r = Math.random() * LOOSE_FINDS.reduce((a, f) => a + f[1], 0), type = 'acorn';
      for (const [t, w] of LOOSE_FINDS) { r -= w; if (r < 0) { type = t; break; } }
      if (type === 'seed') type = localSeed();
      state.items.push({ type, x: sx, y: sy + UNIT * 0.2 });
      spark(sx, sy, '#c9a86a', 10, 3); sfx.pickup(); zoomPulse(sx, sy, 'pickup');
      say('Something shook loose!', sx, sy - UNIT, { key: 'loose', life: 2, color: '#ffe38a' });
      return;
    }
    if (d < UNIT * 3.5) for (let i = 0; i < 5; i++) state.fx.push({ x: sx + (Math.random() - 0.5) * UNIT * 0.6, y: sy, vx: (Math.random() - 0.5) * UNIT, vy: -UNIT * (1 + Math.random() * 1.5), t: 0, life: 0.5, color: '#6a4a2a', size: UNIT * 0.07 });
  }
}
// vines give way to a few good cuts
function cutVines(h) {
  const rt = rtFor(state.scene);
  for (const s of state.solids) {
    if (s.kind !== 'vine' || Math.hypot(s.x - h.x, s.y - h.y) > UNIT * SLASH.reach + s.r) continue;
    const k = 'cut_' + s.bar;
    rt.flags[k] = (rt.flags[k] || 0) + 1;
    spark(s.x, s.y, '#4a8a3a', 5, 2); sfx.rustle();
    if (rt.flags[k] >= 4) breakBarrier(s.bar, 'cut');
    else say('The vines give a little.', s.x, s.y - UNIT, { key: 'vine', life: 1.2 });
    return;
  }
}
function shakeTreesAround(h, radius) {
  let any = false;
  const nearest = state.solids.filter(s => s.kind === 'tree').sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
  for (const s of state.solids) {
    if (s.kind !== 'tree' || Math.hypot(s.x - h.x, s.y - h.y) > radius + s.r) continue;
    state.treeShake[s.key] = state.time; any = true;
    const needSticks = storyAt('gather') && !campBuilt('fire') && campMissing().stick > 0, cool = (state.stickCool || (state.stickCool = {}))[s.key] || 0;
    if (needSticks && s === nearest && state.playTime > cool) {   // (only the tree you pounded by)                  // a good slam by a tree brings down a dry stick or two
      state.stickCool[s.key] = state.playTime + 6;
      const n = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; state.items.push(freeItemSpot({ type: 'stick', x: s.x + Math.cos(a) * (s.r + UNIT * 0.7), y: s.y + UNIT * 0.5 + Math.abs(Math.sin(a)) * UNIT * 0.4 })); }
      spark(s.x, s.y - UNIT, '#6a4a2a', 6, 2);
    } else dropAcorn(s);
  }
  if (any) sfx.rustle();
}
function dropAcorn(s) {
  if ((state.treeCool[s.key] || 0) >= state.playTime || rng() >= 0.7) return;
  state.treeCool[s.key] = state.playTime + 10;
  const a = Math.random() * 6.28;
  const type = Math.random() < 0.4 ? 'stick' : 'acorn';            // a dry stick comes down about as often as an acorn
  state.items.push({ type, x: s.x + Math.cos(a) * (s.r + UNIT * 0.6), y: s.y + UNIT * 0.4 + Math.abs(Math.sin(a)) * UNIT * 0.4 });
  spark(s.x, s.y - UNIT, '#3c7a3a', 6, 2);
}
// slashing a tree shakes it; sometimes an acorn falls
function shakeTrees(h, reachK) {
  for (const s of state.solids) {
    if (s.kind !== 'tree') continue;
    const dx = s.x - h.x, dy = s.y - h.y, d = Math.hypot(dx, dy) || 1;
    if (d > UNIT * SLASH.reach * reachK + s.r || (dx * h.fx + dy * h.fy) / d < 0.1) continue;
    state.treeShake[s.key] = state.time;
    sfx.rustle();
    dropAcorn(s);
  }
}
