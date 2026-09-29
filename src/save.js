// ===== save.js: Save slots, settings, migrations for older saves.
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
function saveSettings() { try { localStorage.setItem('quest-settings', JSON.stringify({ settings: state.settings })); } catch (e) {} }
function loadSettings() {
  try {
    const d = JSON.parse(localStorage.getItem('quest-settings') || 'null');
    if (d && d.settings) { state.settings.tips = d.settings.tips || 'intro'; state.settings.keys = { ...DEFAULT_KEYS, ...(d.settings.keys || {}) }; if (new Set(Object.values(state.settings.keys)).size < Object.keys(state.settings.keys).length) state.settings.keys = { ...DEFAULT_KEYS }; /* two actions on one key (an old save): back to the defaults */ if (d.settings.sound === false) soundOn = false; if (d.settings.labels === false) state.settings.labels = false; if (d.settings.tiles) state.settings.tiles = true; if (d.settings.tag === false) state.settings.tag = false; if (d.settings.coords === false) state.settings.coords = false; }
  } catch (e) {}
  refreshK();
}
