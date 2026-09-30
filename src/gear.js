// ===== gear.js: Slots and lanes (A S D F), wearables, food and eating, blades (steel and wooden), augmentations.

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
  mash: { lo: 0.35, hi: 0.5, rarity: 'made' },            // made on the mat
  salad: { lo: 0.5, hi: 0.7, rarity: 'made' },
  trailmix: { lo: 0.2, hi: 0.3, rarity: 'made' },
};
const FOOD_NAME = { mash: 'Root mash', salad: 'Garden salad', trailmix: 'Trail mix' };
const foodName = f => FOOD_NAME[f] || f[0].toUpperCase() + f.slice(1);
// ---------------- blades: the rusty sword from the stump, or a wooden one made of three sticks ----------------
// The wooden sword splinters as you use it: every hit on something takes a little out of it (swinging at air doesn't), and after a few
// good fights it shatters. It hits softer than steel. The same combat code swings either.
const WOOD_SWORD = 14;
function bladeKind() {
  const inv = state.inv, wood = inv.woodsword > 0;
  if (state.equip === 'woodsword' && wood) return 'wood';
  if (inv.sword) return 'steel';
  return wood ? 'wood' : null;
}
function bladeWear(n) {
  const inv = state.inv, h = state.hero;
  if (inv.aug && inv.aug.id) { /* augmentations wear per hit, in augBonus */ }
  if (bladeKind() !== 'wood') return;
  inv.woodsword = Math.max(0, inv.woodsword - n);
  const k = inv.woodsword;
  const tip = [h.x + h.fx * UNIT * 0.9, h.y + h.fy * UNIT * 0.9 - UNIT * 0.4];
  if (k > 0 && k <= 5) for (let i = 0; i < 3; i++) state.fx.push({ x: tip[0], y: tip[1], vx: (Math.random() - 0.5) * UNIT * 3, vy: -UNIT * (0.5 + Math.random() * 1.5), t: 0, life: 0.5, color: '#b08a5a', size: UNIT * 0.06 });   // splinters
  if (k === 4) heroNote('It\'s splintering...', 1.3, { key: 'wood', life: 1.6, color: '#d8b888' });
  if (k === 0) {                                   // shattered
    sfx.crash(); state.shake = 0.2; zoomPulse(h.x, h.y, 'parry');
    for (let i = 0; i < 16; i++) state.fx.push({ x: tip[0], y: tip[1], vx: (Math.random() - 0.5) * UNIT * 6, vy: -UNIT * (1 + Math.random() * 3), t: 0, life: 0.8, color: i % 2 ? '#b08a5a' : '#7a5a34', size: UNIT * 0.09 });
    heroNote('The wooden sword shatters!', 1.4, { key: 'wood', life: 2.2, color: '#ffb080' });
    state.atk = null; if (inv.aug && !inv.sword) inv.aug = null;
    tidySlots();
  }
}
// ---------------- augmentations: made on the mat, coat the blade you hold for a number of hits ----------------
const AUG = {
  thornwrap: { n: 8, what: 'the next 8 hits bite deeper.', bonus: 1 },
  emberoil: { n: 6, what: 'the next 6 hits set things alight.', bonus: 0.5, burn: 2.5 },
};
function augBonus(e) {
  const inv = state.inv, a = inv.aug;
  if (!a || !AUG[a.id]) return 0;
  const A = AUG[a.id];
  if (A.burn) { e.burn = Math.max(e.burn || 0, A.burn); spark(e.x, e.y, '#ffa04a', 5, 2); }
  if (--a.n <= 0) { inv.aug = null; const h = state.hero; heroNote(`The ${OUT_NAME[a.id].toLowerCase()} is used up.`, 1.3, { key: 'aug', life: 1.8 }); }
  return A.bonus;
}
function augGlint(len, w) {
  const a = state.inv.aug; if (!a) return;
  if (a.id === 'thornwrap') { ctx.fillStyle = '#7a3a8a'; for (let k = 0; k < 4; k++) { const x = len * (0.25 + k * 0.17); ctx.beginPath(); ctx.moveTo(x, -w * 0.9); ctx.lineTo(x + w * 0.4, -w / 2); ctx.lineTo(x - w * 0.2, -w / 2); ctx.fill(); } ctx.fillStyle = 'rgba(240,235,225,.7)'; ctx.fillRect(len * 0.2, -w / 2, len * 0.6, w * 0.3); }
  if (a.id === 'emberoil') { const f = 0.5 + 0.5 * Math.sin(state.time * 12); ctx.fillStyle = `rgba(255,${140 + 60 * f},60,.75)`; ctx.fillRect(len * 0.15, -w / 2, len * 0.8, w * 0.45); }
}
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
  let amt = (lo + Math.random() * (hi - lo)) * (wears('mitts') ? 1.25 : 1);
  if (food === 'berries' && perk && h.vig < maxVig() / 2) amt *= 2;
  if (food === 'turnip') {                             // a turnip works slowly: its vigor comes back over ten seconds or so
    inv.turnipRegen = (inv.turnipRegen || 0) + amt * maxVig();
    heroNote(`+${Math.round(amt * maxVig())} vigor, slowly`, 1.1, { key: 'eat', life: 1.6, color: '#b8f28a' });
    if (inv.vigBonus < 40 && Math.random() < 0.3 + cropLevel('turnip') * 0.08) { inv.vigBonus = Math.min(40, inv.vigBonus + (perk ? 2 : 1)); sfx.grow(); heroNote(`Sturdier. Max vigor ${maxVig()}`, 1.5, { key: 'grow', life: 2, color: '#b8f28a' }); }
    refreshButtons(); return;
  }
  heal(amt);                                           // everything else, the carrot first among them, mends you on the spot
  heroNote(`+${Math.round(amt * maxVig())} vigor`, 1.1, { key: 'eat', life: 1.4, color: '#b8f28a' });
  if (food === 'fish') { inv.fishBuff = perk ? 180 : 120; heroNote('Your vigor swells for a while.', 1.5, { key: 'grow', life: 2, color: '#9fd4ff' }); }
  if (food === 'pepper') { inv.pepper = perk ? 90 : 60; heroNote('Hot! Your marsh fire will burn bigger for a while.', 1.4, { key: 'pep', life: 2.5 }); }
  if (food === 'carrot' && perk) inv.carrotBuff = 15;
  if (food === 'trailmix') { inv.carrotBuff = Math.max(inv.carrotBuff || 0, 12); heroNote('A spring in your step.', 1.5, { key: 'grow', life: 1.8, color: '#b8f28a' }); }
  if (food === 'salad') inv.turnipRegen = (inv.turnipRegen || 0) + maxVig() * 0.15;
  if (food === 'squash' && perk) inv.squashBuff = 20;
  refreshButtons();
}
function gainCropXp(k) {
  const inv = state.inv, xp = inv.cropXp || (inv.cropXp = {}), before = cropLevel(k), fBefore = farmLevel();
  xp[k] = (xp[k] || 0) + 1;
  const h = state.hero;
  if (cropLevel(k) > before) { sfx.grow(); heroNote(`${k[0].toUpperCase() + k.slice(1)} growing: level ${cropLevel(k)}${cropLevel(k) === 3 ? '! ' + CROP_PERK[k] : ''}`, 1.8, { key: 'croplvl', life: 3.5, color: '#b8f28a' }); }
  if (farmLevel() > fBefore) showScroll(`Farming ${roman(farmLevel())}`, SKILL_INFO.farm(farmLevel()).replace(/^./, c => c.toUpperCase()) + '.', true);
}
// The mushroom's light: slow and erratic. Three slow waves, one of them wobbling its own speed, pushed through a steep
// curve so that the light spends most of its time low and only now and then swells up to its full brightness.
// Full brightness (1) is the ceiling; most moments sit well under half of it.
function shroomGlow(seed, t) {
  const a = Math.sin(t * 0.21 + seed), b = Math.sin(t * 0.34 + seed * 2.1 + 1.8 * Math.sin(t * 0.09 + seed * 1.3)), c = Math.sin(t * 0.067 + seed * 0.7);
  const m = (a * 0.38 + b * 0.42 + c * 0.2) * 0.5 + 0.5;
  return 0.05 + 0.95 * Math.pow(m, 4.2);
}
// Ripples across the ground, each its own: when it comes, how fast it spreads, how far, how round, thin or thick,
// a single ring, a double, a broken dashed one, or a wavering one. The old ripple brightness is the ceiling; each ripple
// draws its own strength from a steep curve, so most are faint and many barely there. Right after a mushroom wakes they
// come more often and brighter, still under that ceiling.
const SHROOM_RIP_MAX = 0.35, SHROOM_RIP_CALM = 0.14;
function drawShroomRipples(x, y, u, found, key) {
  const t = state.time, woke = (state.shroomWoke || {})[key], since = woke != null ? t - woke : 99, fresh = since < 8;
  const R = state.shroomRip || (state.shroomRip = {}), st = R[key] || (R[key] = { next: t + Math.random() * 2, list: [] });
  if (t < st.last) { st.next = t + Math.random() * 2; st.list = []; }     // time ran backwards (a new game): start over
  st.last = t;
  if ((found || fresh) && t >= st.next && st.list.length < 6) {
    const ceil = fresh ? SHROOM_RIP_MAX : SHROOM_RIP_CALM, r = Math.random();
    st.list.push({ t0: t, life: 3 + Math.random() * 5, reach: 2.2 + Math.random() * 2.6, flat: 0.28 + Math.random() * 0.14, lw: 0.8 + Math.random() * 1.6,
      a: ceil * Math.pow(Math.random(), 2.6), pat: r < 0.5 ? 'one' : r < 0.7 ? 'two' : r < 0.87 ? 'dash' : 'waver', ph: Math.random() * 6.28 });
    st.next = t + (fresh ? 0.5 + Math.random() * 1.2 : 1.8 + Math.random() * 5.5);
  }
  for (let i = st.list.length - 1; i >= 0; i--) {
    const g = st.list[i], p = (t - g.t0) / g.life;
    if (p >= 1) { st.list.splice(i, 1); continue; }
    const rad = u * (0.6 + p * g.reach), al = g.a * Math.sin(Math.min(1, p * 6) * Math.PI / 2) * (1 - p);
    ctx.strokeStyle = `rgba(210,180,255,${al})`; ctx.lineWidth = g.lw;
    const ring = (rr, dash) => {
      ctx.setLineDash && ctx.setLineDash(dash ? [u * 0.3, u * 0.25] : []);
      ctx.beginPath();
      if (g.pat === 'waver') for (let k = 0; k <= 40; k++) { const an = k / 40 * 6.28, w = 1 + 0.06 * Math.sin(an * 5 + g.ph + t * 0.8); ctx.lineTo(x + Math.cos(an) * rr * w, y + u * 0.15 + Math.sin(an) * rr * g.flat * 2.6 * w); }
      else ctx.ellipse(x, y + u * 0.15, rr, rr * g.flat * 2.6, 0, 0, 6.28);
      ctx.stroke();
    };
    ring(rad, g.pat === 'dash');
    if (g.pat === 'two' && rad > u * 0.9) { ctx.strokeStyle = `rgba(210,180,255,${al * 0.6})`; ring(rad - u * 0.35, false); }
    ctx.setLineDash && ctx.setLineDash([]);
  }
}

// =====================================================================
// Quick slots: A, S, D and F, shown under the vigor bar in that order. F is your weapon. A, S and D hold
// whatever you put there: an ability, a food, a seed, or the other weapon. By default A dodges (once you
// can), S eats, D plants.
// =====================================================================
// =====================================================================
// Slots: A S D F. Whatever sits in a slot, that key uses it. Anything can go in any slot. F is also the
// dynamic action: when there's something to do right here (talk, plant, lift, read) F does that first,
// otherwise it uses what's in the F slot. Slots start empty and draw nothing. New things you pick up drop
// into an empty slot on their own (weapons into F first); a full bar is never overwritten, you're pointed
// to R instead. One list of what can be slotted (slotOptions) feeds the wheel, the pack and auto-equip.
// =====================================================================
// Lanes: each key has a job, so things land somewhere you can guess. F: act, and your blade. D: things you throw
// (acorns). S: things you use up or call on (food, abilities). A: seeds. Tap a key to use it; hold A or S to pick
// which of that kind it holds (a wheel, the world slowed). Anything can still go anywhere from the pack or R.
const LANE_NAME = { f: 'Blade', d: 'Throw', s: 'Use', a: 'Use' };
function laneOf(e) { return e.kind === 'weapon' ? (e.id === 'acorn' ? 'd' : 'f') : 's'; }   // food and abilities: S first, then A
const laneAllows = (k, e) => !e || (k === 'f' ? e.kind === 'weapon' && e.id !== 'acorn' : k === 'd' ? e.kind === 'weapon' && e.id === 'acorn' : e.kind === 'food' || e.kind === 'ability');   // F: blades only, D: throwables, A/S: the rest
const SLOT_KEYS = ['a', 's', 'd'];                       // the three extra keys; F is 'f' and is also the action key
const ALL_SLOTS = ['a', 's', 'd', 'f'];
const SLOT_ACTION = { a: 'dash', s: 'eat', d: 'slotd', f: 'act' };
const slotLabel = k => (K[SLOT_ACTION[k]] || k).toUpperCase().slice(0, 5);
const sameEntry = (x, y) => !!x && !!y && x.kind === y.kind && x.id === y.id;
function slotsOf() {
  const inv = state.inv;
  if (!inv.slots) inv.slots = { a: null, s: null, d: null, f: null };
  if (inv.slotV === 2) { for (const k of ALL_SLOTS) if (inv.slots[k] && inv.slots[k].kind === 'seed') inv.slots[k] = null; inv.slotV = 3; }   // seeds left the slots in build 90
  if (inv.slotV !== 2 && inv.slotV !== 3) {                                 // older saves: 'auto' slots become what they showed, F takes the weapon
    const sl = inv.slots;
    for (const k of SLOT_KEYS) { const s = sl[k]; if (s && s.id === 'auto') sl[k] = s.kind === 'food' ? (oldAutoFood() ? { kind: 'food', id: oldAutoFood() } : null) : (oldAutoSeed() ? { kind: 'seed', id: oldAutoSeed() } : null); }
    if (!('f' in sl) || !sl.f) sl.f = inv.sword ? { kind: 'weapon', id: 'sword' } : inv.acorns > 0 ? { kind: 'weapon', id: 'acorn' } : null;
    inv.slotV = 3;
  }
  return inv.slots;
}
function oldAutoFood() { const inv = state.inv; return ['berries', 'turnip', 'carrot', 'fish', 'squash', 'pepper'].find(f => inv.food.includes(f)) || null; }
function oldAutoSeed() { const inv = state.inv; return Object.keys(SEEDS).find(k => inv.bag[k] > 0) || null; }
// how many of a slotted thing you have (abilities and the sword: 1 or 0)
function entryCount(e) {
  const inv = state.inv;
  if (!e) return 0;
  if (e.kind === 'food') return inv.food.filter(x => x === e.id).length;
  if (e.kind === 'seed') return inv.bag[e.id] || 0;
  if (e.kind === 'weapon') return e.id === 'acorn' ? inv.acorns : e.id === 'woodsword' ? (inv.woodsword > 0 ? 1 : 0) : inv.sword ? 1 : 0;
  if (e.kind === 'ability') return e.id === 'dodge' ? (inv.step ? 1 : 0) : e.id === 'fire' ? (inv.fire ? 1 : 0) : e.id === 'flare' ? (wears('embercharm') ? 1 : 0) : 0;
  return 0;
}
const ABILITY_NAME = { dodge: 'Dodge', fire: 'Marsh fire', flare: 'Flare' };
const ABILITY_ICON = { dodge: 'step', fire: 'fire', flare: 'ember' };
function entryInfo(e) {
  if (e.kind === 'food') return { icon: e.id, name: foodName(e.id), verb: 'Eat' };
  if (e.kind === 'seed') return { icon: e.id, name: SEEDS[e.id].name, verb: 'Plant' };
  if (e.kind === 'weapon') return { icon: e.id, name: e.id === 'sword' ? 'Sword' : e.id === 'woodsword' ? 'Wooden sword' : 'Acorns', verb: '' };
  return { icon: ABILITY_ICON[e.id], name: ABILITY_NAME[e.id], verb: '' };
}
// everything you could put in a slot right now, in a steady order: weapons, abilities, food, seeds
function slotOptions() {
  const inv = state.inv, o = [];
  if (inv.sword) o.push({ kind: 'weapon', id: 'sword' });
  if (inv.woodsword > 0) o.push({ kind: 'weapon', id: 'woodsword' });
  if (inv.acorns > 0) o.push({ kind: 'weapon', id: 'acorn' });
  for (const id of ['dodge', 'fire', 'flare']) if (entryCount({ kind: 'ability', id })) o.push({ kind: 'ability', id });
  for (const f of ['berries', 'turnip', 'carrot', 'pepper', 'fish', 'squash', 'trailmix', 'mash', 'salad']) if (inv.food.includes(f)) o.push({ kind: 'food', id: f });
  for (const f of [...new Set(inv.food)]) if (!o.some(e => e.kind === 'food' && e.id === f)) o.push({ kind: 'food', id: f });
  return o;                                            // (seeds aren't slotted: F at a patch plants them)
}
const consumableOptions = () => slotOptions().filter(e => e.kind === 'food' || e.kind === 'seed');
function slotOf(e) { const sl = slotsOf(); return ALL_SLOTS.find(k => sameEntry(sl[k], e)) || null; }
// put something in a slot: it leaves any other slot it was in; null empties the slot
function setSlot(k, e) {
  const sl = slotsOf(); if (!sameEntry(sl[k], e)) state.slotLit = state.time;   // a real change brightens the slots for a moment
  if (!laneAllows(k, e)) return;                      // keys keep their jobs: nothing lands on the wrong one
  if (e) for (const j of ALL_SLOTS) if (sameEntry(sl[j], e)) sl[j] = null;
  sl[k] = e ? { kind: e.kind, id: e.id } : null;
  if (e && e.kind === 'weapon' && k === 'f') setEquip(e.id);
  refreshButtons();
}
// the weapon in hand ('sword', 'woodsword', 'acorn' or null): every change goes through here
function setEquip(id) { state.equip = id; }
// the weapon in hand follows the slots: F's weapon if it has one, else any slotted weapon
function syncEquip() {
  const sl = slotsOf(), inv = state.inv, ws = ALL_SLOTS.map(k => sl[k]).filter(e => e && e.kind === 'weapon' && entryCount(e));
  setEquip(sl.f && sl.f.kind === 'weapon' && sl.f.id !== 'acorn' && entryCount(sl.f) ? sl.f.id : inv.sword ? 'sword' : inv.woodsword > 0 ? 'woodsword' : null);   // the hand holds F's blade
}
// a few times a second: empty slots whose thing ran out, and drop new things into empty slots (never over anything)
function tidySlots() {
  if (!state.inv || !state.started) return;
  const inv = state.inv, sl = slotsOf(), seen = inv.slotSeen || (inv.slotSeen = {});
  let changed = false;
  for (const k of ALL_SLOTS) if (sl[k] && !entryCount(sl[k])) { delete seen[sl[k].kind + ':' + sl[k].id]; sl[k] = null; changed = true; }
  for (const key of Object.keys(seen)) { const [kind, id] = key.split(':'); if (!entryCount({ kind, id })) delete seen[key]; }
  for (const e of slotOptions()) {
    const key = e.kind + ':' + e.id;
    if (seen[key]) continue;
    seen[key] = true;
    if (slotOf(e)) continue;
    const order = laneOf(e) === 's' ? ['s', 'a'] : [laneOf(e)];                 // its own keys only: F for blades, D for throws, S then A for the rest
    const k = order.find(j => !sl[j]);
    if (k) { setSlot(k, e); changed = true; }
  }
  syncEquip();
  if (changed) refreshButtons();
}
// what a slot shows right now: an icon and a count (nothing at all when empty)
function slotShow(s) {
  if (!s || !entryCount(s)) return null;
  const n = entryCount(s);
  return { icon: entryInfo(s).icon, n: s.kind === 'weapon' && (s.id === 'sword' || s.id === 'woodsword') || s.kind === 'ability' ? null : n, on: s.kind === 'weapon' && state.equip === s.id, wear: s.id === 'woodsword' ? state.inv.woodsword / WOOD_SWORD : null };
}
// plant from a patch: the nearest empty patch of rich soil within reach
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
// use one thing: the same path for a slot key, the wheel, and F when F holds a consumable
function useEntry(e) {
  const inv = state.inv, h = state.hero;
  if (!e || !entryCount(e)) return null;
  if (e.kind === 'food') { if (h.vig >= maxVig() && !(e.id === 'turnip' && inv.vigBonus < 40)) { sayHero('Not hungry right now.', { life: 1.5 }); return null; } eatFood(e.id); return null; }
  if (e.kind === 'seed') { if (!plantHere(e.id)) sayHero('Stand on an empty patch of rich soil.', { life: 1.6 }); return null; }
  if (e.kind === 'weapon') return null;                // blades swing from F, acorns throw from their key: nothing to do here
  if (e.kind === 'ability') { if (e.id === 'flare') { flare(); return null; } return e.id; }   // 'dodge' / 'fire' run with movement
  return null;
}
// press a slot key: returns 'dodge' if that's what it asked for (the dodge itself runs with the rest of movement)
// when Pip (or a tip) suggests using something, its slot on the HUD flashes for a few seconds
function flashSlot(k, secs = 4) { if (k) state.slotFlash = { k, until: state.time + secs }; state.slotLit = state.time; }
function flashFor(text) {
  if (!text) return; const t = text.toLowerCase(), F = K.act.toLowerCase();
  if (/acorn/.test(t) && /throw|fling|toss/.test(t)) return flashSlot(ALL_SLOTS.find(k => slotsOf()[k] && slotsOf()[k].id === 'acorn'));
  if (/\beat\b|snack|turnip at you/.test(t)) return flashSlot(ALL_SLOTS.find(k => slotsOf()[k] && slotsOf()[k].kind === 'food'));
  if (/marsh fire|breathe/.test(t)) return flashSlot(ALL_SLOTS.find(k => slotsOf()[k] && slotsOf()[k].id === 'fire'));
  if (/swing|lunge|slash/.test(t) || new RegExp(`\\b${F}\\b in the air|pound`).test(t)) return flashSlot('f');
}
function useSlot(k) { state.slotLit = state.time; return useEntry(slotsOf()[k]); }
const slotHeld = id => ALL_SLOTS.some(k => { const s = slotsOf()[k]; return s && s.kind === 'ability' && s.id === id && held[SLOT_ACTION[k]](); });
// "put in slot" actions for pack cells
function slotActs(entry) {
  return ALL_SLOTS.filter(k => laneAllows(k, entry)).map(k => ({ label: sameEntry(slotsOf()[k], entry) ? `In ${slotLabel(k)}` : `Slot ${slotLabel(k)}`, fn: () => setSlot(k, entry) }));
}
// the bar under the vigor display: A S D F in fixed places; an empty slot draws nothing at all
function drawSlotBar(x0, y0, len, s) {
  // only the filled ones are drawn, in A S D F order, as a group centred under the vigor bar
  const slots = slotsOf(), gap = s * 0.35, on = ALL_SLOTS.filter(k => slotShow(slots[k])), w = on.length * s * 1.2 + Math.max(0, on.length - 1) * gap;
  let x = x0 + len / 2 - w / 2 + s * 0.6, right = x0;
  const y = y0;
  for (const k of on) {
    const show = slotShow(slots[k]);
    {
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
      ctx.strokeStyle = show.on ? 'rgba(159,212,255,.8)' : 'rgba(255,227,138,.35)'; ctx.lineWidth = show.on ? 2 : 1; ctx.strokeRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
      const fl = state.slotFlash && state.slotFlash.k === k && state.time < state.slotFlash.until;   // suggested: it flashes
      if (fl) { const a = 0.5 + 0.5 * Math.sin(state.time * 10); ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = `rgba(255,227,138,${0.25 + 0.35 * a})`; ctx.fillRect(x - s * 0.75, y - s * 0.75, s * 1.5, s * 1.5); ctx.strokeStyle = `rgba(255,240,180,${0.6 + 0.4 * a})`; ctx.lineWidth = 3; ctx.strokeRect(x - s * 0.72, y - s * 0.72, s * 1.44, s * 1.44); ctx.restore(); }
      drawItemIcon(show.icon, x, y, s * 0.78);
      ctx.font = `bold ${Math.round(s * 0.36)}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe38a';
      ctx.fillText(slotLabel(k), x - s * 0.55, y - s * 0.3);
      if (show.n != null) { ctx.textAlign = 'right'; ctx.fillStyle = '#fdf6e3'; ctx.fillText(show.n, x + s * 0.55, y + s * 0.52); }
      if (show.wear != null) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - s * 0.5, y + s * 0.48, s, 3); ctx.fillStyle = show.wear > 0.35 ? '#d8b888' : '#ff9a6a'; ctx.fillRect(x - s * 0.5, y + s * 0.48, s * show.wear, 3); }
      ctx.textAlign = 'left'; right = x + s * 0.6;
    }
    x += s * 1.2 + gap;
  }
  return Math.max(right + s * 0.4, x0 + s * 0.6);
}
// the wheel's own ability: a ring of sparks from the ember charm
function flare() {
  const h = state.hero;
  if (!spend(1)) { sayHero('Too tired.', { life: 1.2 }); return; }
  sfx.whoosh(); state.shake = 0.15; zoomPulse(h.x, h.y, 'parry');
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.28; state.fx.push({ x: h.x, y: h.y, vx: Math.cos(a) * UNIT * 5, vy: Math.sin(a) * UNIT * 5, t: 0, life: 0.45, color: i % 2 ? '#ffb04a' : '#fff0a0', size: UNIT * 0.14 }); }
  for (const e of state.enemies) if (hittable(e) && Math.hypot(e.x - h.x, e.y - h.y) < UNIT * 2.2) { e.burn = Math.max(e.burn || 0, 1.5); damage(e, 1, 'fire', (e.x - h.x) / UNIT, (e.y - h.y) / UNIT); }
  for (const w of state.webs) if (!w.burn && Math.hypot(w.x - h.x, w.y - h.y) < UNIT * 2.4) igniteWeb(w);
  if (state.bird) scareBird(h.x, h.y, 3);
}

// =====================================================================
// Things you wear: armaments, charms and flair. Chosen in the pack (Wear tab), a few at a time, and always
// visible on you. Some change how a weapon or a food works, some give a new ability for your slots.
// =====================================================================
const WEAR = {
  cap:     { name: 'Stalker cap', kind: 'armament', line: 'Things falling from above bounce off.' },
  stonecharm: { name: 'Smooth-stone charm', kind: 'armament', line: 'Hits cost you a quarter less vigor.' },
  mitts:   { name: 'Gardener\'s mitts', kind: 'charm', line: 'Food mends a quarter more, and turnips work twice as fast.' },
  embercharm: { name: 'Ember charm', kind: 'charm', line: 'Acorns set things alight. Gives Flare: a ring of sparks for your slots.' },
  feather: { name: 'Pip\'s feather', kind: 'flair', line: 'Pip found it. It does nothing. It looks great.' },
};
const WEAR_KIND = { armament: 'Armament', charm: 'Charm', flair: 'Flair' };
const gearOwned = () => { const inv = state.inv, g = inv.gear || (inv.gear = []); if (inv.scalp && !g.includes('cap')) { g.push('cap'); if (!inv.worn) inv.worn = []; if (inv.worn.length < wearSlots()) inv.worn.push('cap'); } return g; };
const wearSlots = () => 2 + (state.inv.pipSaved ? 1 : 0) + (state.inv.tortoise ? 1 : 0);
const wears = id => gearOwned().includes(id) && (state.inv.worn || []).includes(id);
function gainGear(id, quiet) {
  const inv = state.inv, g = gearOwned(), worn = inv.worn || (inv.worn = []);
  if (!g.includes(id)) g.push(id);
  const put = worn.length < wearSlots() && !worn.includes(id);
  if (put) worn.push(id);
  if (!quiet) { sfx.shing(); showTitle(WEAR[id].name, `${WEAR[id].line}${put ? ' Wearing it now.' : ` Wear it from the pack (${K.menu.toUpperCase()}, Wear).`}`, 'relic', 4, true); }
}
function toggleWear(id) {
  const inv = state.inv, worn = inv.worn || (inv.worn = []);
  if (worn.includes(id)) { worn.splice(worn.indexOf(id), 1); return 'off'; }
  if (worn.length >= wearSlots()) return 'full';
  worn.push(id); return 'on';
}
// on the hero, every worn thing shows: drawn over the body at (x, top of head y), u = one tile
function drawWorn(x, top, pw, ph, u) {
  const worn = (state.inv.worn || []).filter(wears), side = state.hero.side || 1;
  drawBeetleOnHero(x, top, pw, ph);                  // the red beetle, clambering about
  if (state.inv.lantern) {                           // the candle lantern, hanging at your side, flickering
    const f = 0.85 + 0.15 * Math.sin(state.time * 11), lx = x - side * pw * 0.62, ly = top + ph * 0.62;
    ctx.strokeStyle = '#5a4128'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, ly - u * 0.2); ctx.lineTo(lx, ly - u * 0.08); ctx.stroke();
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(lx - u * 0.09, ly - u * 0.09, u * 0.18, u * 0.04); ctx.fillRect(lx - u * 0.09, ly + u * 0.12, u * 0.18, u * 0.04);
    ctx.fillStyle = `rgba(255,${190 + 40 * f},90,${0.85 * f})`; ctx.fillRect(lx - u * 0.07, ly - u * 0.05, u * 0.14, u * 0.17);
  }
  if (worn.includes('feather')) { ctx.save(); ctx.translate(x - side * pw * 0.25, top); ctx.rotate(-side * 0.5); ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(0, -u * 0.22, u * 0.07, u * 0.24, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#7ab8e0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -u * 0.44); ctx.stroke(); ctx.restore(); }
  if (worn.includes('stonecharm')) { ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.ellipse(x, top + ph * 0.42, u * 0.09, u * 0.07, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#5a4128'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - pw * 0.3, top + ph * 0.3); ctx.lineTo(x, top + ph * 0.36); ctx.lineTo(x + pw * 0.3, top + ph * 0.3); ctx.stroke(); }
  if (worn.includes('mitts')) { ctx.fillStyle = '#6aa04a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * pw * 0.52, top + ph * 0.66, u * 0.1, 0, 6.28); ctx.fill(); } }
  if (worn.includes('embercharm')) { const g = 0.6 + 0.4 * Math.sin(state.time * 5); ctx.fillStyle = `rgba(255,${150 + 60 * g},60,${0.7 + 0.3 * g})`; ctx.beginPath(); ctx.arc(x + side * pw * 0.28, top + ph * 0.78, u * 0.08, 0, 6.28); ctx.fill(); }
}
