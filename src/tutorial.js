// ===== tutorial.js: the early game as one ordered list. Each step says what must be true to move on (done), where Pip
// leads (goal), where he stands and what he says when it starts (scene, spot, say), and how he nags if nothing happens
// (remind: phrasings used in turn, at a spot that helps). The driver (tutorialStep / tutorialGoal, used by pip.js)
// picks the first step not done. Everything Pip says for the tutorial lives here; pip.js only says it.
const TUT = {
  planted: () => ((rtFor('meadow').flags.plots) || []).filter(q => q.s).length,
  seeds: () => state.inv.bag.turnipseed || 0,
  fluffNeed: () => (campMissing().fluff || 0) > 0,
  raw: () => rawOf(),
  robin: () => { const b = state.bird; return b && b.mode === 'perch' ? [b.x, b.y + UNIT] : hollowPoint(); },
  plot: i => { const q = WORLD.meadow.feat.plots[Math.min(i, WORLD.meadow.feat.plots.length - 1)]; return [q[0] * W, q[1] * H]; },
  emptyPlot: () => { const q = WORLD.meadow.feat.plots.find((pl, i) => !(((rtFor('meadow').flags.plots) || [])[i] || {}).s); return q ? [q[0] * W, q[1] * H] : null; },
  nearItem: t => state.items.filter(i => i.type === t).sort((a, b) => Math.hypot(a.x - state.hero.x, a.y - state.hero.y) - Math.hypot(b.x - state.hero.x, b.y - state.hero.y))[0],
  exitSpot: () => { const sc = sceneDef(), ex = pipExit(sc); if (!ex) return null; const e = edgePoint(ex.side, (ex.a + ex.b) / 2); return [e[0] * W - (ex.side === 'e' ? UNIT * 1.5 : ex.side === 'w' ? -UNIT * 1.5 : 0), e[1] * H - (ex.side === 's' ? UNIT * 1.5 : ex.side === 'n' ? -UNIT * 1.5 : 0)]; },
  f1Fluff: () => (state.scene === 'f1' ? state.items : (RT.f1 ? RT.f1.items : (WORLD.f1.initItems || []))).some(i => i.type === 'fluff'),
  tip: k => (state.inv.pipTips || {})[k],
  M: () => K.menu.toUpperCase(), F: () => K.act.toUpperCase(),
};
const TUTORIAL = [
  { id: 'seeds', begins: () => state.inv.story >= STORY.garden, done: () => TUT.seeds() > 0 || TUT.planted() > 0 || state.inv.story > STORY.garden,
    scene: 'meadow', spot: () => gardenSpot(),
    say: () => 'My garden! First we need seeds. The robin drops them when you startle it. Run right at it!',
    remind: () => ['The robin drops seeds when you startle it. Run right at it!', 'Robin\'s back! Sneak close, then dash!', 'No seeds yet? That robin has plenty.', 'If it hides in its tree, jump and stomp by the trunk!', 'Go on, give the robin a scare!'],
    remindAt: n => [TUT.robin(), [(TUT.robin()[0] + state.hero.x) / 2, (TUT.robin()[1] + state.hero.y) / 2], [hollowPoint()[0], hollowPoint()[1] + UNIT * 1.2]][n % 3] },
  { id: 'plant', done: () => TUT.planted() >= 2 || state.inv.story > STORY.garden, scene: 'meadow', spot: () => TUT.emptyPlot() || gardenSpot(),
    say: () => TUT.planted() === 1 && !TUT.seeds() ? 'One more! The robin always comes back.' : 'Stand over here and shove them in the dirt! They love this stuff.',
    key: () => (TUT.planted() === 1 && !TUT.seeds()) ? 'again' : 'first',
    remind: () => TUT.seeds() ? ['This patch is empty. Pop a seed in!', 'Right here! The dirt wants those seeds.', 'Stand on the soil and press F.', 'Seeds do best in the ground, not your pocket!'] : ['One more seed! Startle the robin again.', 'The robin always comes back. Give it a scare!'],
    remindAt: () => TUT.seeds() ? TUT.emptyPlot() : TUT.robin() },
  { id: 'tocamp', done: () => TUT.tip('tada') || state.inv.story >= STORY.gather, goal: () => 'camp', scene: 'meadow', spot: null,
    say: () => 'They\'ll grow while we\'re out. Now... I found the most AWESOME spot for a camp. Follow me!',
    remind: () => ['Camp\'s this way!', 'Come on, to the camp spot!', 'Follow me, it\'s not far.'], remindAt: () => TUT.exitSpot() },
  { id: 'tada', done: () => TUT.tip('tada') || state.inv.story >= STORY.gather, scene: 'camp', spot: null, once: 'tada',
    say: () => 'TA-DA! Best spot in the whole world. I built us a lean-to! It mostly stays up.' },
  { id: 'sticks', done: () => !campMissing().stick, goal: () => 'start', scene: 'start', spot: () => TUT.nearItem('stick') && [TUT.nearItem('stick').x, TUT.nearItem('stick').y],
    say: () => 'Good sticks. Dry ones burn best. We need a couple.', remind: () => ['Here\'s a good stick!', 'Grab this stick!', 'Sticks, under the trees. We need them.'], remindAt: () => { const it = TUT.nearItem('stick'); return it ? [it.x, it.y] : TUT.exitSpot(); } },
  { id: 'stones', done: () => !campMissing().stone, goal: () => 'riverbank', scene: 'riverbank', spot: () => TUT.nearItem('stone') && [TUT.nearItem('stone').x, TUT.nearItem('stone').y],
    say: () => 'Smooth stones! Nice flat ones. Two of those.', remind: () => ['Here\'s a good smooth stone!', 'Grab this stone!', 'Flat ones, by the water.'], remindAt: () => { const it = TUT.nearItem('stone'); return it ? [it.x, it.y] : TUT.exitSpot(); } },
  { id: 'fluff', done: () => TUT.raw().fluff >= 2 || !TUT.fluffNeed(), goal: () => TUT.f1Fluff() ? 'f1' : 'f2', scene: 'f1', spot: () => TUT.nearItem('fluff') && [TUT.nearItem('fluff').x, TUT.nearItem('fluff').y],
    say: () => 'Fluff blows all over in this wind. Grab it quick!', remind: () => ['Quick, the fluff!', 'Don\'t let the wind take it!', 'Rabbit fluff. We need three tufts.'], remindAt: () => { const it = TUT.nearItem('fluff'); return it ? [it.x, it.y] : TUT.exitSpot(); } },
  { id: 'lesson', done: () => TUT.tip('craftLesson') || !TUT.fluffNeed(), once: 'craftLesson', hold: true, spot: null, goal: () => TUT.raw().stick >= 3 ? null : 'start',
    say: () => `Two tufts! The bench needs one more. There are rabbits to the south... but they are mean! Time you learned crafting. ` +
      (TUT.raw().stick >= 3 ? `Open your pack: ${TUT.M()}. Go to the Craft tab. Under Recipes, pick the wooden sword and press ${TUT.F()}: three sticks go on the mat. Then ${TUT.F()} on Combine!`
                             : `First, three sticks. Get some more back in the glade, then open your pack: ${TUT.M()}, Craft tab, and make a wooden sword.`),
    after: () => hearRecipe('woodsword') },
  { id: 'sword', done: () => !!bladeKind() || !TUT.fluffNeed(), goal: () => TUT.raw().stick >= 3 ? null : 'start', spot: null,
    remind: () => TUT.raw().stick >= 3 ? [`Slap that sword together! ${TUT.M()}, Craft, wooden sword, Combine.`, 'Three sticks on the mat, then Combine!'] : ['Sticks first. The glade has plenty.', 'Three sticks for a sword!'], remindAt: () => TUT.exitSpot() },
  { id: 'rabbits', done: () => !TUT.fluffNeed(), goal: () => 'f2', scene: null, spot: null,
    say: () => 'And go! South, to the rabbits!', remind: () => state.scene === 'f2' ? ['Rabbit! Get that fluff straight from the source!', 'Swing at it! It\'s got our fluff.'] : ['South! The rabbits have our fluff.', 'This way, to the rabbits!'],
    remindAt: () => { const r = state.enemies.find(e => e.type === 'rabbit'); return state.scene === 'f2' && r ? [r.x, r.y] : TUT.exitSpot(); } },
  { id: 'build', done: () => campDone(), goal: () => 'camp', scene: 'camp', spot: () => { const b = campMark(); return b && [b.fx * W, b.fy * H]; },
    say: () => campMarkLine(), key: () => campMarkLine(), remind: () => [campMarkLine()], remindAt: () => { const b = campMark(); return b && [b.fx * W, b.fy * H]; } },
  { id: 'homebase', done: () => gearOwned().includes('feather'), scene: 'camp', spot: null, hold: true, once: 'campdone', bounce: true,
    say: () => 'Home base! We did it! Here, I found this feather. It\'s for you.' },
];
function tutorialStep() {
  if (!state.inv || ARENA || PUZZLE || storyAt('adventure')) return null;
  for (const s of TUTORIAL) { if (s.begins && !s.begins()) return null; if (!s.done()) return s; }
  return null;
}
function tutorialGoal() { const s = tutorialStep(); return s && s.goal ? s.goal() : null; }
// the camp mark Pip stands at, and his one-line reading of it (what it takes, or that you have it, or set it down)
function campMark() { const f = WORLD.camp.feat, pc = ['fire', 'bench'].find(q => !campBuilt(q)); return pc && (f.buildSpots || []).find(b => b.piece === pc); }
function campMarkLine() {
  const b = campMark(); if (!b) return '';
  const pc = b.piece, raw = rawOf(), n = k => raw[k] || 0, NAME = { fire: 'fire ring', bench: 'workbench' }, M = TUT.M();
  const need = pc === 'fire' ? { 'smooth stone': 2 - n('stone'), stick: 1 - n('stick') } : { stick: 1 - n('stick'), fluff: (n('glue') ? 1 : 3) - n('fluff') };
  const miss = Object.entries(need).filter(([, v]) => v > 0).map(([k, v]) => k === 'fluff' ? `${v} tuft${v > 1 ? 's' : ''} of fluff` : `${v} ${k}${v > 1 ? 's' : ''}`);
  if (n(PIECE_OF[pc]) > 0) return `Set the ${NAME[pc]} down right here!`;
  if (!miss.length && !TUT.tip('craftLesson')) return `Got it all for the ${NAME[pc]}! We'll put it together soon.`;
  if (!miss.length && pc === 'bench' && !n('glue')) return `Glue first: two fluff on the Craft mat (${M}).`;
  if (!miss.length) return pc === 'fire' ? `You've got it! Craft: two stones and a stick (${M}).` : `You've got it! Craft: a stick, glue and fluff (${M}).`;
  return `${NAME[pc][0].toUpperCase() + NAME[pc].slice(1)} goes here. Still need ${miss.join(' and ')}.`;
}

// ---------------------------------------------------------------------------------------------------------------
// Pip's other lines: flavour and the woods. Each: a key (said once), where (scene), when it applies, the words,
// optionally where Pip walks to say it (at) and how near you must be for that (sight). Order is priority.
// ---------------------------------------------------------------------------------------------------------------
const PIP_LINES = [
  { key: 'compost', when: () => state.inv.acorns > 0 && !storyAt('adventure') && state.inv.quests && state.inv.quests.garden && state.inv.quests.garden.done != null,
    text: 'Get enough of those acorns, and you can make some awesome compost!' },
  { key: 'chest', scene: 'tentin', at: sc => [sc.feat.chest[0] * W, sc.feat.chest[1] * H],
    text: 'There are a couple of seeds in the chest, and some acorns. Work acorns into the garden soil and it makes awesome compost!' },
  { key: 'pound', when: sc => storyAt('gather') && !campDone() && sc.id !== 'camp' && TUT.tip('tada'),
    text: 'Try pounding around in different places. You never know what you might knock loose!' },
  { key: 'tentin', scene: 'camp', when: () => storyAt('gather') && !campDone() && Object.keys(state.inv.pipTips || {}).some(k => k.startsWith('tut-camp')), at: () => [0.33 * W, 0.33 * H], sight: 14,
    text: 'My book in the tent explains stuff.' },
  { key: 'shroom', scene: 'camp', when: (sc, h) => campDone() && sc.feat.shroom && Math.hypot(h.x - sc.feat.shroom[0] * W, h.y - sc.feat.shroom[1] * H) < UNIT * 4.5, at: sc => [sc.feat.shroom[0] * W, sc.feat.shroom[1] * H],
    text: 'That mushroom hums at night.' },
  // the glade, once the adventure is on: the brambles, the buried rock, the throw
  { key: 'brambles', scene: 'start', when: (sc, h, rt) => storyAt('adventure') && !rt.flags.thicket, at: () => [W * 0.955, H * 0.5], sight: 14,
    text: 'The blank part of the map is past these brambles. We need something heavy.' },
  { key: 'pull', scene: 'start', sight: 12,
    when: (sc, h, rt) => { const rock = sc.pullables.find(r => r.id === 'rock'); return storyAt('adventure') && !rt.flags.thicket && TUT.tip('brambles') && rock && !rt.pulled.has(rock.id) && !state.carry && Math.hypot(h.x - rock.fx * W, h.y - rock.fy * H) < UNIT * 5; },
    at: sc => { const r = sc.pullables.find(q => q.id === 'rock'); return [r.fx * W, r.fy * H]; },
    text: (sc, h, rt) => rt.flags.knocked_rock ? 'It moved! Rock it back and forth!' : 'This rock\'s stuck fast. Jump and stomp right next to it!' },
  { key: 'throw', scene: 'start', when: (sc, h, rt) => storyAt('adventure') && !rt.flags.thicket && !!state.carry, at: () => [W * 0.955, H * 0.5], text: 'Throw it at the brambles!' },
  { key: 'smashed', scene: 'start', when: (sc, h, rt) => storyAt('adventure') && !!rt.flags.thicket, at: () => [W * 0.93, H * 0.5], text: 'Ha! The woods are east.' },
  { key: 'jump', scene: 'start', when: (sc, h, rt) => storyAt('adventure') && !!rt.flags.thicket,
    at: (sc, h) => { const t = state.solids.filter(s => s.kind === 'tree').sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0]; return t ? [t.x, t.y] : null; },
    text: 'Stomp by a tree for acorns.' },
  { key: 'map-start', scene: 'start', when: () => storyAt('adventure'), text: 'Glade: big rock, brambles. On the map!' },
  // the woods: practice stones, the wedged boulders, the mud
  { key: 'practice', scene: 'w1', when: sc => !broken('w1', 'crack1') && sc.solids.some(s => s.bar === 'knockA') && !broken('w1', 'knockA') && !broken('w1', 'knockB'),
    at: sc => { const k = sc.solids.find(s => s.bar === 'knockA'); return [k.fx * W, k.fy * H]; }, text: 'See the cracked stones? Practise on those. Heave a rock and let it fly!' },
  { key: 'gate', scene: 'w1', when: sc => !broken('w1', 'crack1') && sc.solids.some(s => s.bar === 'crack1' && s.kind === 'cracked'), sight: 12,
    at: sc => { const k = sc.solids.find(s => s.bar === 'crack1' && s.kind === 'cracked'); return [k.fx * W, k.fy * H]; }, text: 'Those boulders are wedged on a cracked stone. Throw a rock at it. Mind the mud: a short throw sinks.' },
  { key: 'opened', scene: 'w1', when: () => broken('w1', 'crack1'), text: 'CRASH! Onward!' },
  { key: 'map-w1', scene: 'w1', text: 'Drawing the woods in... boulders, mud, a very suspicious tree.' },
  { key: 'map-w2', scene: 'w2', text: 'Last blank corner of the map! Past these boulders, and it\'s done.' },
  { key: 'ring', scene: 'w2', when: () => !broken('w2', 'crack2'), at: sc => { const k = sc.solids.find(s => s.bar === 'crack2' && s.kind === 'cracked'); return k ? [k.fx * W, k.fy * H] : null; },
    text: 'That cracked stone is holding the whole pile up. It sits in a mud wallow: hit it square, or you\'ll be digging your rock out!' },
];
