
// =====================================================================
// Food and farming skill: each vegetable restores a range of vigor (rarer, higher). Growing a vegetable
// raises your level with it: higher levels lift the bottom of its range, add to harvests, and at level 3
// give it a little extra. Your overall farming level makes seeds come back more often.
// =====================================================================
const FOOD = {
  berries: { lo: 0.1, hi: 0.2, rarity: 'common' },
  turnip: { lo: 0.15, hi: 0.3, rarity: 'common' },
  carrot: { lo: 0.25, hi: 0.4, rarity: 'uncommon' },
  pepper: { lo: 0.15, hi: 0.35, rarity: 'uncommon' },
  fish: { lo: 0.25, hi: 0.4, rarity: 'uncommon' },
  squash: { lo: 0.4, hi: 0.6, rarity: 'rare' },
};
const CROP_XP = [0, 3, 8, 15, 25, 40];                 // harvests of that crop to reach each level
const cropLevel = k => { const n = ((state.inv.cropXp || {})[k]) || 0; let l = 0; while (l + 1 < CROP_XP.length && n >= CROP_XP[l + 1]) l++; return l; };
const farmLevel = () => Math.floor(Object.values(state.inv.cropXp || {}).reduce((a, b) => a + b, 0) / 6);   // one level per six harvests of anything
function foodRange(k) {                                // higher levels raise the floor toward the top
  const F = FOOD[k] || { lo: 0.15, hi: 0.25 }, l = cropLevel(k);
  return [F.lo + (F.hi - F.lo) * Math.min(0.8, l * 0.16), F.hi];
}
const CROP_PERK = {                                    // what level 3 adds
  berries: 'restore twice as much when you\'re below half vigor',
  turnip: 'when it sturdies you, it adds 2 max vigor instead of 1',
  carrot: 'a spring in your step for 15 seconds',
  pepper: 'bigger fire for 90 seconds instead of 60',
  squash: 'faster vigor recovery for 20 seconds',
  fish: 'the swell lasts three minutes',
};
function eatFood(food) {
  const inv = state.inv, h = state.hero, i = inv.food.indexOf(food);
  if (i < 0) return;
  inv.food.splice(i, 1);
  sfx.munch(); zoomPulse(h.x, h.y, 'tap');
  const [lo, hi] = foodRange(food), perk = cropLevel(food) >= 3;
  let amt = lo + Math.random() * (hi - lo);
  if (food === 'berries' && perk && h.vig < maxVig() / 2) amt *= 2;
  if (food === 'turnip') {                             // a turnip works slowly: its vigor comes back over ten seconds or so
    inv.turnipRegen = (inv.turnipRegen || 0) + amt * maxVig();
    say(`+${Math.round(amt * maxVig())} vigor, slowly`, h.x, h.y - UNIT * 1.1, { key: 'eat', life: 1.6, color: '#b8f28a' });
    if (inv.vigBonus < 40 && Math.random() < 0.3 + cropLevel('turnip') * 0.08) { inv.vigBonus = Math.min(40, inv.vigBonus + (perk ? 2 : 1)); sfx.grow(); say(`Sturdier. Max vigor ${maxVig()}`, h.x, h.y - UNIT * 1.5, { key: 'grow', life: 2, color: '#b8f28a' }); }
    refreshButtons(); return;
  }
  heal(amt);                                           // everything else, the carrot first among them, mends you on the spot
  say(`+${Math.round(amt * maxVig())} vigor`, h.x, h.y - UNIT * 1.1, { key: 'eat', life: 1.4, color: '#b8f28a' });
  if (food === 'fish') { inv.fishBuff = perk ? 180 : 120; say('Your vigor swells for a while.', h.x, h.y - UNIT * 1.5, { key: 'grow', life: 2, color: '#9fd4ff' }); }
  if (food === 'pepper') { inv.pepper = perk ? 90 : 60; say('Hot! Your marsh fire will burn bigger for a while.', h.x, h.y - UNIT * 1.4, { key: 'pep', life: 2.5 }); }
  if (food === 'carrot' && perk) inv.carrotBuff = 15;
  if (food === 'squash' && perk) inv.squashBuff = 20;
  refreshButtons();
}
function gainCropXp(k) {
  const inv = state.inv, xp = inv.cropXp || (inv.cropXp = {}), before = cropLevel(k), fBefore = farmLevel();
  xp[k] = (xp[k] || 0) + 1;
  const h = state.hero;
  if (cropLevel(k) > before) { sfx.grow(); say(`${k[0].toUpperCase() + k.slice(1)} growing: level ${cropLevel(k)}${cropLevel(k) === 3 ? '! ' + CROP_PERK[k] : ''}`, h.x, h.y - UNIT * 1.8, { key: 'croplvl', life: 3.5, color: '#b8f28a' }); }
  if (farmLevel() > fBefore) say(`Farming level ${farmLevel()}: seeds come back more often`, h.x, h.y - UNIT * 2.4, { key: 'farmlvl', life: 3.5, color: '#ffe38a' });
}
// the mushroom's light: a slow, lilting glow that drifts between barely-there and shining, never quite the same twice
function shroomGlow(seed, t) {
  const a = Math.sin(t * 0.7 + seed) * 0.5 + 0.5, b = Math.sin(t * 1.13 + seed * 2.1) * 0.5 + 0.5, c = Math.sin(t * 0.29 + seed * 0.7) * 0.5 + 0.5;
  return 0.12 + 0.88 * Math.pow(a * 0.45 + b * 0.3 + c * 0.25, 2.2);   // mostly dim, now and then it blooms
}
function drawShroomRipples(x, y, u, found, key) {
  const t = state.time, woke = (state.shroomWoke || {})[key];
  const since = woke != null ? t - woke : 99;
  for (let k = 0; k < 3; k++) {                        // soft rings drifting out across the ground; many at first, then an occasional one
    const period = since < 8 ? 2.2 : 6.5, p = ((t + k * period / 3) % period) / period;
    if (!found && since > 8) continue;
    const a = (1 - p) * (since < 8 ? 0.35 : 0.14);
    ctx.strokeStyle = `rgba(210,180,255,${a})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y + u * 0.15, u * (0.6 + p * 3.2), u * (0.22 + p * 1.1), 0, 0, 6.28); ctx.stroke();
  }
}

// =====================================================================
// Quick slots: A, S, D and F, shown under the vigor bar in that order. F is your weapon. A, S and D hold
// whatever you put there: an ability, a food, a seed, or the other weapon. By default A dodges (once you
// can), S eats, D plants.
// =====================================================================
const SLOT_KEYS = ['a', 's', 'd'];
const SLOT_ACTION = { a: 'dash', s: 'eat', d: 'slotd' };
function slotsOf() {
  const inv = state.inv;
  if (!inv.slots) inv.slots = { a: null, s: { kind: 'food', id: 'auto' }, d: { kind: 'seed', id: 'auto' } };
  if (!inv.slots.a && inv.step) inv.slots.a = { kind: 'ability', id: 'dodge' };
  return inv.slots;
}
function autoFood() {
  const inv = state.inv, h = state.hero, miss = 1 - h.vig / maxVig();
  const auto = miss > 0.45 ? ['squash', 'fish', 'carrot', 'turnip', 'berries', 'pepper'] : ['berries', 'turnip', 'carrot', 'fish', 'squash', 'pepper'];
  const order = inv.favFood ? [inv.favFood, ...auto.filter(f => f !== inv.favFood)] : auto;
  return order.find(f => inv.food.includes(f)) || inv.food[0] || null;
}
function autoSeed() {
  const inv = state.inv;
  if (inv.favSeed && inv.bag[inv.favSeed] > 0) return inv.favSeed;
  return ['turnipseed', 'carrotseed', 'pepperseed', 'squashseed', 'thornseed', 'emberseed', 'ironseed', 'starseed'].find(k => inv.bag[k] > 0) || null;
}
// what a slot shows right now: an icon, and a count if it has one
function slotShow(s) {
  const inv = state.inv;
  if (!s) return null;
  if (s.kind === 'food') { const f = s.id === 'auto' ? autoFood() : s.id; return f ? { icon: f, n: inv.food.filter(x => x === f).length || null, dim: !inv.food.includes(f) } : { icon: 'carrot', dim: true }; }
  if (s.kind === 'seed') { const k = s.id === 'auto' ? autoSeed() : s.id; return k ? { icon: k, n: inv.bag[k] || null, dim: !(inv.bag[k] > 0) } : { icon: 'turnipseed', dim: true }; }
  if (s.kind === 'weapon') return { icon: s.id, n: s.id === 'acorn' ? inv.acorns : null, dim: s.id === 'acorn' ? !(inv.acorns > 0) : !inv.sword };
  if (s.kind === 'ability') return { icon: s.id === 'dodge' ? 'step' : 'fire', dim: s.id === 'dodge' ? !inv.step : !inv.fire };
  return null;
}
function plantHere(kind) {
  const sc = sceneDef(), h = state.hero, rt = rtFor(sc.id);
  if (!sc.feat.plots || !kind) return false;
  const plots = rt.flags.plots || (rt.flags.plots = sc.feat.plots.map(() => ({ s: 0, t: 0, lv: sc.feat.plotLv || 0 })));
  let best = -1, bd = UNIT * 1.3;
  sc.feat.plots.forEach(([fx, fy], i) => { const d = Math.hypot(h.x - fx * W, h.y - fy * H); if (d < bd && !plots[i].s) { bd = d; best = i; } });
  if (best < 0) return false;
  const p = plots[best], [px, py] = sc.feat.plots[best];
  state.inv.bag[kind]--; p.s = 1; p.t = state.playTime; p.seed = kind;
  sfx.plant(); spark(px * W, py * H, '#6a4a2a', 6, 2);
  say(SEEDS[kind].crop ? `Planted. ${CROP_NAME[SEEDS[kind].crop]} grow here.` : `${SEEDS[kind].name} planted.`, px * W, py * H - UNIT, { key: 'plot', life: 2 });
  return true;
}
// press a slot key: returns 'dodge' if that's what it asked for (the dodge itself runs with the rest of movement)
function useSlot(k) {
  const s = slotsOf()[k], inv = state.inv, h = state.hero;
  if (!s) return null;
  if (s.kind === 'ability') return s.id;                                 // 'dodge' or 'fire' (fire is held)
  if (s.kind === 'food') {
    const f = s.id === 'auto' ? autoFood() : s.id;
    if (!f || !inv.food.includes(f)) { sayHero('Nothing to eat in that slot.', { life: 1.4 }); return null; }
    if (h.vig >= maxVig()) { sayHero('Not hungry right now.', { life: 1.5 }); return null; }
    eatFood(f); return null;
  }
  if (s.kind === 'seed') {
    const kind = s.id === 'auto' ? autoSeed() : s.id;
    if (!kind || !(inv.bag[kind] > 0)) { sayHero('No seeds of that kind.', { life: 1.4 }); return null; }
    if (!plantHere(kind)) sayHero('Stand on an empty patch of rich soil.', { life: 1.6 });
    return null;
  }
  if (s.kind === 'weapon') {
    if (s.id === 'acorn' && !(inv.acorns > 0)) { sayHero('No acorns.', { life: 1.2 }); return null; }
    if (s.id === 'sword' && !inv.sword) return null;
    state.equip = s.id; state.active = s.id; sfx.tock(); return null;
  }
  return null;
}
const slotHeld = id => SLOT_KEYS.some(k => { const s = slotsOf()[k]; return s && s.kind === 'ability' && s.id === id && held[SLOT_ACTION[k]](); });
// "put in slot" actions for pack cells
function slotActs(entry) {
  return SLOT_KEYS.map(k => ({ label: `Slot ${K[SLOT_ACTION[k]] || k.toUpperCase()}`, fn: () => { slotsOf()[k] = entry; } }));
}
// the bar under the vigor display: A S D F, centred beneath it
function drawSlotBar(x0, y0, len, s) {
  const slots = slotsOf(), inv = state.inv, keys = [...SLOT_KEYS, 'f'], gap = s * 0.35, w = keys.length * s * 1.2 + (keys.length - 1) * gap;
  let x = x0 + len / 2 - w / 2 + s * 0.6;
  x = Math.max(x0 + s * 0.6, x);
  const y = y0;
  for (const k of keys) {
    const show = k === 'f' ? (state.equip === 'acorn' && inv.acorns > 0 ? { icon: 'acorn', n: inv.acorns } : inv.sword ? { icon: 'sword' } : null) : slotShow(slots[k]);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
    ctx.strokeStyle = 'rgba(255,227,138,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
    if (show) { ctx.globalAlpha = show.dim ? 0.35 : 1; drawItemIcon(show.icon, x, y, s * 0.78); ctx.globalAlpha = 1; }
    ctx.font = `bold ${Math.round(s * 0.36)}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe38a';
    ctx.fillText((k === 'f' ? K.act : (K[SLOT_ACTION[k]] || k)).toUpperCase().slice(0, 5), x - s * 0.55, y - s * 0.3);   // the key, top left
    if (show && show.n != null) { ctx.textAlign = 'right'; ctx.fillStyle = '#fdf6e3'; ctx.fillText(show.n, x + s * 0.55, y + s * 0.52); }
    ctx.textAlign = 'left';
    x += s * 1.2 + gap;
  }
  return x;
}

// ---------------- skills: quiet levels that grow with use ----------------
// No numbers on screen. Each skill counts uses (a hit counts double) and crosses a few steps; each step says one
// line in the skill colour, once. Acorns are the first; the sword, the dodge and farming take the same table later.
const SKILL_COLOR = '#c9a2ff';
const SKILLS = {
  acorn: { steps: [12, 36, 80, 150], lines: ['You feel slightly nimbler.', 'Probably easier to hit varmints with acorns now.', 'The acorn leaves your hand like it knows the way.', 'You could knock a gnat off a fencepost from here.'] },
  sword: { steps: [20, 60, 130, 240], lines: ['The sword sits better in your hand.', 'Your swings are finding their rhythm.', 'The blade goes where you look.', 'The rust is the only thing slow about this sword now.'] },
  dodge: { steps: [10, 30, 70, 130], lines: ['Your feet are a little quicker.', 'You slip aside without thinking about it.', 'Trouble has to guess where you went.', 'Nothing much lands on you these days.'] },
  farm:  { steps: [8, 24, 56, 110], lines: ['The soil feels friendlier.', 'You have a sense for what a patch wants.', 'Things come up a little sooner for you.', 'Pip would say you have the knack.'] },
};
function skillOf(id) { const inv = state.inv, sk = inv.skill || (inv.skill = {}); return sk[id] || (sk[id] = { n: 0, hits: 0, lvl: 0 }); }
function skillLevel(id) { return skillOf(id).lvl; }
function skillUse(id, hit = false) {
  const s = skillOf(id), def = SKILLS[id];
  if (hit) s.hits++; else s.n++;
  const prog = s.n + s.hits * 2;
  while (s.lvl < def.steps.length && prog >= def.steps[s.lvl]) {
    s.lvl++;
    sayHero(def.lines[s.lvl - 1], { key: 'skill', life: 3.8, color: SKILL_COLOR });
    sfx.heart();
  }
}
// testing only (arena System item): jump a skill straight to a level without the practice
function setSkillLevel(id, lvl) { const s = skillOf(id), def = SKILLS[id]; s.lvl = Math.max(0, Math.min(def.steps.length, lvl)); s.hits = 0; s.n = s.lvl ? def.steps[s.lvl - 1] : 0; }
// acorns: a thrown acorn leaves the hand a little off line (less with practice) and bends toward the nearest
// varmint inside a cone ahead of it (more with practice). Level 0 is barely there.
const ACORN_SPREAD = [7, 5, 3.5, 2, 1];                        // degrees either side, by level
const ACORN_HOME = [0.3, 0.8, 1.15, 1.5, 1.9];                    // radians per second of turn, by level
const ACORN_CONE = Math.cos(Math.PI / 5);                       // 36 degrees either side of the flight line
function acornSpread() { return (Math.random() * 2 - 1) * ACORN_SPREAD[skillLevel('acorn')] * Math.PI / 180; }
function steerAcorn(s, dt) {
  const lvl = skillLevel('acorn'), sp = Math.hypot(s.vx, s.vy);
  if (!sp) return;
  let best = null, bd = UNIT * (4 + lvl);
  for (const e of state.enemies) {
    if (!hittable(e) || s.hit.has(e)) continue;
    const dx = e.x - s.x, dy = e.y - s.y, d = Math.hypot(dx, dy);
    if (d >= bd || d < 1) continue;
    if ((dx * s.vx + dy * s.vy) / (d * sp) < ACORN_CONE) continue;
    bd = d; best = e;
  }
  if (!best) return;
  const have = Math.atan2(s.vy, s.vx), want = Math.atan2(best.y - s.y, best.x - s.x);
  let da = want - have; da = Math.atan2(Math.sin(da), Math.cos(da));
  const a = have + Math.max(-ACORN_HOME[lvl] * dt, Math.min(ACORN_HOME[lvl] * dt, da));
  s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp;
}

// the quick slot that holds seeds (and has one to plant): planting is that button, not F
function seedSlotKey() {
  const slots = slotsOf(), inv = state.inv;
  for (const k of SLOT_KEYS) { const sl = slots[k]; if (!sl || sl.kind !== 'seed') continue; const kind = sl.id === 'auto' ? autoSeed() : sl.id; if (kind && inv.bag[kind] > 0) return k; }
  return null;
}
const seedKeyLabel = () => { const k = seedSlotKey(); return k ? (K[SLOT_ACTION[k]] || k).toUpperCase() : K.act; };
