// ===== menu.js: The pack (tabs, cells, sections, Status, System, testing levels), the forge, chest, book pages, choices.
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
  if (cells.length && cells[0].col != null) { const n = [0, 0, 0]; return cells.map(c => ({ c: c.col, r: n[c.col]++ })); }   // Craft: columns, a row each
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
  // each skill: its level and progress, what it does now, and what the next level brings
  const SK = { acorn: 'Acorns', sword: 'Sword', gather: 'Gathering' };
  for (const [id, name] of Object.entries(SK)) {
    const s = skillOf(id), max = SKILLS[id].steps.length, need = SKILLS[id].steps[s.lvl], prog = s.n + s.hits * 2;
    rows.push(['skill', name, s.lvl, max, need ? Math.min(1, (prog - (SKILLS[id].steps[s.lvl - 1] || 0)) / (need - (SKILLS[id].steps[s.lvl - 1] || 0))) : 1]);
    rows.push(['row', '  now', SKILL_INFO[id](s.lvl)]);
    if (s.lvl < max) rows.push(['row', '  next', SKILL_INFO[id](s.lvl + 1)]);
  }
  { const f = farmLevel(); rows.push(['row', 'Farming ' + roman(f), SKILL_INFO.farm(f)]); rows.push(['row', '  next', SKILL_INFO.farm(f + 1)]); }
  const crops = Object.keys(inv.cropXp || {});
  if (crops.length) { rows.push(['head', 'Garden']); for (const c of crops) rows.push(['row', c[0].toUpperCase() + c.slice(1), `level ${cropLevel(c)}`]); }
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
  if (tab === 'Craft' && cells[0] && cells[0].col != null) {           // columns: left / right move across, keeping the row as near as possible
    const L = packLayout(cells, cols), cur = L[m.sel] || { c: 0, r: 0 };
    const hop = d => { for (let c = cur.c + d; c >= 0 && c <= 2; c += d) { const col = L.map((q, i) => [q, i]).filter(([q]) => q.c === c); if (col.length) { m.sel = col[Math.min(cur.r, col.length - 1)][1]; sfx.tock(); return; } } };
    if (pressedNow.left) hop(-1); if (pressedNow.right) hop(1);
    if (pressedNow.down) { const nx = L.findIndex((q, i) => q.c === cur.c && q.r === cur.r + 1); if (nx >= 0) { m.sel = nx; sfx.tock(); } }
    if (pressedNow.up) { const nx = L.findIndex((q, i) => q.c === cur.c && q.r === cur.r - 1); if (nx >= 0) { m.sel = nx; sfx.tock(); } else { m.focus = 'tabs'; sfx.tock(); } }
    if (pressedNow.act) craftCellAct(cell);
    return;
  }
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
  { title: 'Your keys', bits: [['goldf', `${K.act.toUpperCase()}: do things, swing your blade.`], ['compost', `${slotLabel('d')}: throw acorns.`], ['snack', `${slotLabel('s')}, ${slotLabel('a')}: eat, use. Hold to pick.`], ['seed', `${K.act.toUpperCase()} at a patch: plant or compost.`]] },
  { title: 'Fighting', bits: [['slash', `Tap ${K.act.toUpperCase()}: slash.`], ['stab', `Hold ${K.act.toUpperCase()}, let go: stab!`], ['pound', `Jump, then ${K.act.toUpperCase()}: POUND.`]] },
  { title: 'Growing', bits: [['seed', 'Seed + dirt = snacks later.'], ['compost', 'Acorns in the dirt: compost!'], ['sprout', 'Wait. Then pull.']] },
  { title: 'Making', bits: [['mat', `${K.menu.toUpperCase()}, Craft: thing + thing = ?`], ['glue', 'Fluff + fluff = glue.'], ['mark', 'Camp pieces go on the X.']] },
  { title: 'Pip\'s map', map: true },
  { title: 'Still to map', todo: true },
  { title: 'Tired?', bits: [['zzz', 'Low vigor: slow and floppy.'], ['fire', 'Sit by the fire.'], ['snack', 'Eat something!']] },
];
const BOOK = { get length() { return BOOK_PAGES().length; } };
