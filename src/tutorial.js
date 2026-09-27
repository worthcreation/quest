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
