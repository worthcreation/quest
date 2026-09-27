// ===== skills.js: Quiet skills that grow with use: acorn, sword, dodge, farm, gathering (reach, auto-gather, glow rules).
// ---------------- skills: quiet levels that grow with use ----------------
// No numbers on screen. Each skill counts uses (a hit counts double) and crosses a few steps; each step says one
// line in the skill colour, once. Acorns are the first; the sword, the dodge and farming take the same table later.
const SKILL_COLOR = '#c9a2ff';
const SKILLS = {
  acorn: { steps: [12, 36, 80, 150], lines: ['You feel slightly nimbler.', 'Probably easier to hit varmints with acorns now.', 'The acorn leaves your hand like it knows the way.', 'You could knock a gnat off a fencepost from here.'] },
  sword: { steps: [20, 60, 130, 240], lines: ['The sword sits better in your hand.', 'Your swings are finding their rhythm.', 'The blade goes where you look.', 'The rust is the only thing slow about this sword now.'] },
  dodge: { steps: [10, 30, 70, 130], lines: ['Your feet are a little quicker.', 'You slip aside without thinking about it.', 'Trouble has to guess where you went.', 'Nothing much lands on you these days.'] },
  farm:  { steps: [8, 24, 56, 110], lines: ['The soil feels friendlier.', 'You have a sense for what a patch wants.', 'Things come up a little sooner for you.', 'Pip would say you have the knack.'] },
  gather: { steps: [8, 20, 40, 70, 110, 165, 240, 340, 470, 640, 860, 1150],
    lines: ['Your hands are quicker at picking things up.', 'Little things seem to find their way to you.', 'Things come to you when you pass close by.',
      'You reach a little farther without thinking.', 'Odd bits of ground catch your eye now.', 'Thorns and blooms come to you too.',
      'You gather as you walk, a few steps either side.', 'Rare things glint at you from farther off.', 'Rare things come to your hand now.',
      'You barely stop to pick anything up anymore.', 'Even strange things show themselves to you.', 'Whatever is lying about, you have it.'] },
};
// ---------------- gathering: a skill that grows with every pickup ----------------
// At first you take what's on the ground by pressing F within touch reach. As the skill grows, that reach grows,
// and things start coming to you on their own, from farther and farther away, until almost anything on screen does.
// Rarer things need more skill both to come on their own and to show their faint selection ring. Hidden spots (the
// loose ground a pound can shake open) start to show at higher levels.
const GATHER_TIER = {};
for (const t of ['stick', 'stone', 'fluff', 'acorn', 'berries', 'turnip', 'carrot', 'pepper', 'squash', 'fish', 'bean', 'turnipseed', 'carrotseed', 'glue']) GATHER_TIER[t] = 0;
for (const t of ['thorn', 'ember', 'ironwood', 'driftwood', 'ear', 'hide', 'thornseed', 'pepperseed', 'squashseed', 'shard']) GATHER_TIER[t] = 1;
for (const t of ['starpetal', 'emberseed', 'ironseed', 'silk', 'horn', 'step', 'lumin', 'page']) GATHER_TIER[t] = 2;
for (const t of ['starseed', 'scalp', 'journal', 'letter', 'relic']) GATHER_TIER[t] = 3;
const tierOf = t => GATHER_TIER[t] ?? 1;
const AUTO_NEED = [3, 6, 9, 12], GLOW_NEED = [0, 0, 5, 11];         // level to come on its own / to show its ring, by tier
const gatherLevel = () => skillLevel('gather');
const gatherReach = () => PICK_R + gatherLevel() * 0.3;                // tiles: F reaches this far (and the faint ring shows)
function autoRange(t) {                                                // tiles: this comes to you on its own from here (0: never)
  const L = gatherLevel(), need = AUTO_NEED[tierOf(t)];
  if (L < need) return 0;
  return L >= 12 ? 99 : 0.8 + (L - need) * 1.2 + (need === 3 ? 0 : 0.5);
}
const glowShows = t => gatherLevel() >= GLOW_NEED[tierOf(t)];
function gatherGain(t) { skillUse('gather'); if (tierOf(t) >= 2) { skillUse('gather'); skillUse('gather'); } }
// what each level of a skill does, for the Status tab ("now" and "next") and the level-up scroll
const roman = n => ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n] || String(n);
const SKILL_NAME = { acorn: 'Acorns', sword: 'Sword', gather: 'Gathering', dodge: 'Dodging', farm: 'Farming' };
const SKILL_INFO = {
  acorn: L => `acorns stray up to ${ACORN_SPREAD[Math.min(L, 4)]}\u00b0; they curve toward varmints ${['barely', 'a little', 'fairly well', 'well', 'sharply'][Math.min(L, 4)]}`,
  sword: L => `(steel sword) whirlwind ${(1.2 + 0.45 * L).toFixed(1)} s, hits x${(0.7 + 0.1 * L).toFixed(1)}, rest ${8 - 1.5 * L} s; lunge x${(0.8 + 0.1 * L).toFixed(1)}`,
  gather: L => { const at = (need, base) => L < need ? 'not yet' : L >= 12 ? 'anywhere' : `${(0.8 + (L - need) * 1.2 + base).toFixed(1)} tiles`; return `reach ${(PICK_R + L * 0.3).toFixed(1)} tiles; things come to you: common ${at(3, 0)}, uncommon ${at(6, 0.5)}, rare ${at(9, 0.5)}`; },
  dodge: L => `quicker on your feet (level ${L})`,
  farm: L => `crops come up after ${CROP_ROCKS[Math.min(L, CROP_ROCKS.length - 1)] || 'just'} ${CROP_ROCKS[Math.min(L, CROP_ROCKS.length - 1)] ? 'rocks' : 'F'}; seeds come back ${L * 6}% more often`,
};
function skillOf(id) { const inv = state.inv, sk = inv.skill || (inv.skill = {}); return sk[id] || (sk[id] = { n: 0, hits: 0, lvl: 0 }); }
function skillLevel(id) { return skillOf(id).lvl; }
function skillUse(id, hit = false) {
  const s = skillOf(id), def = SKILLS[id];
  if (hit) s.hits++; else s.n++;
  const prog = s.n + s.hits * 2;
  while (s.lvl < def.steps.length && prog >= def.steps[s.lvl]) {
    s.lvl++;
    showScroll(`${SKILL_NAME[id] || id} ${roman(s.lvl)}`, def.lines[s.lvl - 1], true);   // a small scroll low on the screen; Status has the details
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
