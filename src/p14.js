
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
  let amt = (lo + Math.random() * (hi - lo)) * (wears('mitts') ? 1.25 : 1);
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
const SLOT_KEYS = ['a', 's', 'd'];                       // the three extra keys; F is 'f' and is also the action key
const ALL_SLOTS = ['a', 's', 'd', 'f'];
const SLOT_ACTION = { a: 'dash', s: 'eat', d: 'slotd', f: 'act' };
const slotLabel = k => (K[SLOT_ACTION[k]] || k).toUpperCase().slice(0, 5);
const sameEntry = (x, y) => !!x && !!y && x.kind === y.kind && x.id === y.id;
function slotsOf() {
  const inv = state.inv;
  if (!inv.slots) inv.slots = { a: null, s: null, d: null, f: null };
  if (inv.slotV !== 2) {                                 // older saves: 'auto' slots become what they showed, F takes the weapon
    const sl = inv.slots;
    for (const k of SLOT_KEYS) { const s = sl[k]; if (s && s.id === 'auto') sl[k] = s.kind === 'food' ? (oldAutoFood() ? { kind: 'food', id: oldAutoFood() } : null) : (oldAutoSeed() ? { kind: 'seed', id: oldAutoSeed() } : null); }
    if (!('f' in sl) || !sl.f) sl.f = inv.sword ? { kind: 'weapon', id: 'sword' } : inv.acorns > 0 ? { kind: 'weapon', id: 'acorn' } : null;
    inv.slotV = 2;
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
  if (e.kind === 'weapon') return e.id === 'acorn' ? inv.acorns : inv.sword ? 1 : 0;
  if (e.kind === 'ability') return e.id === 'dodge' ? (inv.step ? 1 : 0) : e.id === 'fire' ? (inv.fire ? 1 : 0) : e.id === 'flare' ? (wears('embercharm') ? 1 : 0) : 0;
  return 0;
}
const ABILITY_NAME = { dodge: 'Dodge', fire: 'Marsh fire', flare: 'Flare' };
const ABILITY_ICON = { dodge: 'step', fire: 'fire', flare: 'ember' };
function entryInfo(e) {
  if (e.kind === 'food') return { icon: e.id, name: e.id[0].toUpperCase() + e.id.slice(1), verb: 'Eat' };
  if (e.kind === 'seed') return { icon: e.id, name: SEEDS[e.id].name, verb: 'Plant' };
  if (e.kind === 'weapon') return { icon: e.id, name: e.id === 'sword' ? 'Sword' : 'Acorns', verb: '' };
  return { icon: ABILITY_ICON[e.id], name: ABILITY_NAME[e.id], verb: '' };
}
// everything you could put in a slot right now, in a steady order: weapons, abilities, food, seeds
function slotOptions() {
  const inv = state.inv, o = [];
  if (inv.sword) o.push({ kind: 'weapon', id: 'sword' });
  if (inv.acorns > 0) o.push({ kind: 'weapon', id: 'acorn' });
  for (const id of ['dodge', 'fire', 'flare']) if (entryCount({ kind: 'ability', id })) o.push({ kind: 'ability', id });
  for (const f of ['berries', 'turnip', 'carrot', 'pepper', 'fish', 'squash']) if (inv.food.includes(f)) o.push({ kind: 'food', id: f });
  for (const f of [...new Set(inv.food)]) if (!o.some(e => e.kind === 'food' && e.id === f)) o.push({ kind: 'food', id: f });
  for (const k of Object.keys(SEEDS)) if (inv.bag[k] > 0) o.push({ kind: 'seed', id: k });
  return o;
}
const consumableOptions = () => slotOptions().filter(e => e.kind === 'food' || e.kind === 'seed');
function slotOf(e) { const sl = slotsOf(); return ALL_SLOTS.find(k => sameEntry(sl[k], e)) || null; }
// put something in a slot: it leaves any other slot it was in; null empties the slot
function setSlot(k, e) {
  const sl = slotsOf();
  if (e) for (const j of ALL_SLOTS) if (sameEntry(sl[j], e)) sl[j] = null;
  sl[k] = e ? { kind: e.kind, id: e.id } : null;
  if (e && e.kind === 'weapon' && k === 'f') { state.equip = e.id; state.active = e.id; }
  refreshButtons();
}
// the weapon in hand follows the slots: F's weapon if it has one, else any slotted weapon
function syncEquip() {
  const sl = slotsOf(), inv = state.inv, ws = ALL_SLOTS.map(k => sl[k]).filter(e => e && e.kind === 'weapon' && entryCount(e));
  if (!ws.some(e => e.id === state.equip)) state.equip = ws.length ? (sl.f && sl.f.kind === 'weapon' && entryCount(sl.f) ? sl.f.id : ws[0].id) : (inv.sword ? 'sword' : null);
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
    const order = e.kind === 'weapon' ? ['f', 'a', 's', 'd'] : ['a', 's', 'd'];
    const k = order.find(j => !sl[j]);
    if (k) { setSlot(k, e); changed = true; }
    else if (!state.tipsSeen.slotsFull && !ARENA && !PUZZLE) {        // never overwrite: show the way to swap instead
      state.tipsSeen.slotsFull = true;
      sayHero(`Your slots are full. Hold ${K.swap.toUpperCase()} and press a slot key to swap, or use the pack (${K.menu.toUpperCase()}).`, { life: 5, color: '#ffe38a' });
    }
  }
  syncEquip();
  if (changed) refreshButtons();
}
// what a slot shows right now: an icon and a count (nothing at all when empty)
function slotShow(s) {
  if (!s || !entryCount(s)) return null;
  const n = entryCount(s);
  return { icon: entryInfo(s).icon, n: s.kind === 'weapon' && s.id === 'sword' || s.kind === 'ability' ? null : n, on: s.kind === 'weapon' && state.equip === s.id };
}
// the plant button: the slot holding seeds you have
function seedSlotKey() {
  const sl = slotsOf();
  return ALL_SLOTS.find(k => sl[k] && sl[k].kind === 'seed' && entryCount(sl[k])) || null;
}
const seedKeyLabel = () => { const k = seedSlotKey(); return k ? slotLabel(k) : K.act; };
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
  if (e.kind === 'weapon') { state.equip = e.id; state.active = e.id; return null; }
  if (e.kind === 'ability') { if (e.id === 'flare') { flare(); return null; } return e.id; }   // 'dodge' / 'fire' run with movement
  return null;
}
// press a slot key: returns 'dodge' if that's what it asked for (the dodge itself runs with the rest of movement)
function useSlot(k) { return useEntry(slotsOf()[k]); }
const slotHeld = id => ALL_SLOTS.some(k => { const s = slotsOf()[k]; return s && s.kind === 'ability' && s.id === id && held[SLOT_ACTION[k]](); });
// a weapon slotted on A, S or D: holding that key is holding the weapon (the same swing, stab and throw code as F)
function slotWeaponHeld() {
  if (!state.started || state.menu || state.choice || state.radial || state.carry || state.swapT != null || !state.inv) return false;
  const sl = slotsOf();
  for (const k of SLOT_KEYS) { const e = sl[k]; if (e && e.kind === 'weapon' && entryCount(e) && held[SLOT_ACTION[k]]()) { state.equip = e.id; state.slotAct = true; return true; } }
  return false;
}
// "put in slot" actions for pack cells
function slotActs(entry) {
  return ALL_SLOTS.map(k => ({ label: sameEntry(slotsOf()[k], entry) ? `In ${slotLabel(k)}` : `Slot ${slotLabel(k)}`, fn: () => setSlot(k, entry) }));
}
// the bar under the vigor display: A S D F in fixed places; an empty slot draws nothing at all
function drawSlotBar(x0, y0, len, s) {
  const slots = slotsOf(), gap = s * 0.35, w = ALL_SLOTS.length * s * 1.2 + (ALL_SLOTS.length - 1) * gap;
  let x = Math.max(x0 + s * 0.6, x0 + len / 2 - w / 2 + s * 0.6), right = x0;
  const y = y0;
  for (const k of ALL_SLOTS) {
    const show = slotShow(slots[k]);
    if (show) {
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
      ctx.strokeStyle = show.on ? 'rgba(159,212,255,.8)' : 'rgba(255,227,138,.35)'; ctx.lineWidth = show.on ? 2 : 1; ctx.strokeRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
      drawItemIcon(show.icon, x, y, s * 0.78);
      ctx.font = `bold ${Math.round(s * 0.36)}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe38a';
      ctx.fillText(slotLabel(k), x - s * 0.55, y - s * 0.3);
      if (show.n != null) { ctx.textAlign = 'right'; ctx.fillStyle = '#fdf6e3'; ctx.fillText(show.n, x + s * 0.55, y + s * 0.52); }
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
  stonecharm: { name: 'River-stone charm', kind: 'armament', line: 'Hits cost you a quarter less vigor.' },
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
  if (worn.includes('feather')) { ctx.save(); ctx.translate(x - side * pw * 0.25, top); ctx.rotate(-side * 0.5); ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(0, -u * 0.22, u * 0.07, u * 0.24, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#7ab8e0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -u * 0.44); ctx.stroke(); ctx.restore(); }
  if (worn.includes('stonecharm')) { ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.ellipse(x, top + ph * 0.42, u * 0.09, u * 0.07, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#5a4128'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - pw * 0.3, top + ph * 0.3); ctx.lineTo(x, top + ph * 0.36); ctx.lineTo(x + pw * 0.3, top + ph * 0.3); ctx.stroke(); }
  if (worn.includes('mitts')) { ctx.fillStyle = '#6aa04a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * pw * 0.52, top + ph * 0.66, u * 0.1, 0, 6.28); ctx.fill(); } }
  if (worn.includes('embercharm')) { const g = 0.6 + 0.4 * Math.sin(state.time * 5); ctx.fillStyle = `rgba(255,${150 + 60 * g},60,${0.7 + 0.3 * g})`; ctx.beginPath(); ctx.arc(x + side * pw * 0.28, top + ph * 0.78, u * 0.08, 0, 6.28); ctx.fill(); }
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

