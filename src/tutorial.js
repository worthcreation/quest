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
  saidAt: id => ((state.inv.tutAt || {})[id]),
  since: id => { const a = ((state.inv.tutAt || {})[id]); return a == null ? -1 : (state.playTime || 0) - a; },
  near: (at, tiles) => !!at && Math.hypot(state.hero.x - at[0], state.hero.y - at[1]) < UNIT * tiles,
  mark: piece => { const b = (WORLD.camp.feat.buildSpots || []).find(q => q.piece === piece); return b && [b.fx * W, b.fy * H]; },
  door: () => { const d = WORLD.camp.feat.tentDoor; return [d[0] * W, d[1] * H]; },
  flap: () => [W * 0.5, H * 0.94],
  campExit: () => { const e = WORLD.camp.exits[0]; const q = edgePoint(e.side, (e.a + e.b) / 2); return [q[0] * W, Math.min(H * 0.93, q[1] * H)]; },
  // a tour stop is done once Pip has said it and you came over (or waited long enough)
  noTour: () => (TUT.tip('tada') || state.inv.story > STORY.gather) && TUT.saidAt('tada') == null,   // jumped in (older save, test): no tour
  followed: (id, at) => TUT.saidAt(id) != null && (TUT.near(at, 3.5) || TUT.since(id) > 9),
  M: () => K.menu.toUpperCase(), F: () => K.act.toUpperCase(),
};
const TUTORIAL = [
  { id: 'seeds', begins: () => state.inv.story >= STORY.garden, done: () => TUT.seeds() > 0 || TUT.planted() > 0 || state.inv.story > STORY.garden,
    scene: 'meadow', spot: () => gardenSpot(),
    say: () => `See? Great dirt! It'll be a garden in no time. First we need seeds. There's a robin hiding in that hollow tree, and robins drop seeds when they're startled. Jump, then ${TUT.F()} in the air: POUND the ground right by the trunk!`,
    remind: () => state.inv.robinFlushed ? ['The robin drops seeds when you startle it. Run right at it!', 'Robin\'s back! Sneak close, then dash!', 'Go on, give the robin a scare!']
                                         : [`Jump, then ${TUT.F()} while you're in the air. Right by the trunk!`, 'It\'s still in the hollow tree. Pound the ground next to it!', `Space to jump, ${TUT.F()} to come down hard. By the tree!`],
    remindAt: n => state.inv.robinFlushed ? [TUT.robin(), [(TUT.robin()[0] + state.hero.x) / 2, (TUT.robin()[1] + state.hero.y) / 2]][n % 2] : [hollowPoint()[0] + UNIT * 1.2, hollowPoint()[1] + UNIT * 1.2] },
  { id: 'plant', done: () => TUT.planted() >= 2 || state.inv.story > STORY.garden, scene: 'meadow', spot: () => TUT.emptyPlot() || gardenSpot(),
    say: () => TUT.planted() === 1 && !TUT.seeds() ? 'One more! The robin always comes back.' : 'Stand over here and shove them in the dirt! They love this stuff.',
    key: () => (TUT.planted() === 1 && !TUT.seeds()) ? 'again' : 'first',
    remind: () => TUT.seeds() ? ['This patch is empty. Pop a seed in!', 'Right here! The dirt wants those seeds.', 'Stand on the soil and press F.', 'Seeds do best in the ground, not your pocket!'] : ['One more seed! Startle the robin again.', 'The robin always comes back. Give it a scare!'],
    remindAt: () => TUT.seeds() ? TUT.emptyPlot() : TUT.robin() },
  { id: 'tocamp', done: () => TUT.tip('tada') || state.inv.story >= STORY.gather || state.scene === 'camp', goal: () => 'camp', scene: 'meadow', spot: null,
    say: () => 'They\'ll grow while we\'re out. Now... I found the most AWESOME spot for a camp. Follow me!',
    remind: () => ['Camp\'s this way!', 'Come on, to the camp spot!', 'Follow me, it\'s not far.'], remindAt: () => TUT.exitSpot() },
  { id: 'tada', done: () => TUT.tip('tada') || state.inv.story >= STORY.gather, scene: 'camp', spot: null, once: 'tada',
    say: () => 'TA-DA! Best spot in the whole world. I built us a lean-to! It mostly stays up.' },
  // the camp tour: Pip shows you each spot, the lean-to last, goes in, you follow, he shows you inside, then out and away
  { id: 'tour-fire', done: () => TUT.noTour() || TUT.followed('tour-fire', TUT.mark('fire')) || campBuilt('fire'), scene: 'camp', spot: () => TUT.mark('fire'),
    say: () => 'This is where the fire goes: five smooth stones in a ring, and tinder in the middle.' },
  { id: 'tour-bench', done: () => TUT.noTour() || TUT.followed('tour-bench', TUT.mark('bench')) || campBuilt('bench'), scene: 'camp', spot: () => TUT.mark('bench'),
    say: () => 'And here, a workbench. Two frames of sticks and rabbit glue.' },
  { id: 'tour-tent', done: () => TUT.noTour() || state.scene === 'tentin' || TUT.saidAt('tour-inside') != null, scene: 'camp', spot: () => TUT.door(),
    say: () => 'And my lean-to! Come on in.', lead: { scene: 'camp', at: () => TUT.door(), hide: true, to: 'tentin', after: true },
    remind: () => ['In you come! The flap\'s right here.', 'Come inside!'], remindAt: () => TUT.door() },
  { id: 'tour-inside', done: () => TUT.noTour() || TUT.since('tour-inside') > 7 || state.scene === 'camp' && TUT.saidAt('tour-inside') != null, scene: 'tentin', spot: () => { const b = WORLD.tentin.feat.book; return [b[0] * W, b[1] * H + UNIT]; },
    say: () => 'My book: rules and tips, with drawings. The chest has seeds and acorns. That\'s my bed. Nap there when you\'re worn out.' },
  { id: 'tour-out', done: () => TUT.noTour() || state.scene === 'camp' && TUT.saidAt('tour-out') != null || TUT.saidAt('tour-exit') != null, scene: 'tentin', spot: null,
    say: () => 'Right! Let\'s go get what we need. Follow me!', lead: { scene: 'tentin', at: () => TUT.flap(), hide: true, to: 'camp', after: true } },
  { id: 'tour-exit', done: () => TUT.noTour() || state.scene !== 'camp' && TUT.saidAt('tour-exit') != null, scene: 'camp', spot: null, goal: () => 'start',
    say: () => 'This way! Sticks first, in the glade.', lead: { scene: 'camp', at: () => TUT.campExit(), hide: true, to: 'start', after: true },
    remind: () => ['Come on, this way!', 'The glade! Sticks!'], remindAt: () => TUT.campExit() },
  { id: 'sticks', done: () => !campMissing().stick, goal: () => 'start', scene: 'start', spot: () => TUT.nearItem('stick') && [TUT.nearItem('stick').x, TUT.nearItem('stick').y],
    say: () => 'Good sticks. Dry ones burn best. We need a couple.',
    remind: () => TUT.nearItem('stick') ? ['Here\'s a good stick!', 'Grab this stick!', 'Sticks, under the trees. We need them.'] : ['The rest are up in the trees! Jump and pound by a trunk.', `Space, then ${TUT.F()} in the air, right by a tree. Down they come!`, 'Give a tree a good thump!'],
    remindAt: () => { const it = TUT.nearItem('stick'); if (it) return [it.x, it.y]; const tr = state.solids.filter(s => s.kind === 'tree').sort((a, b) => Math.hypot(a.x - state.hero.x, a.y - state.hero.y) - Math.hypot(b.x - state.hero.x, b.y - state.hero.y))[0]; return tr ? [tr.x + tr.r + UNIT, tr.y + UNIT * 0.6] : TUT.exitSpot(); } },
  { id: 'stones', done: () => !campMissing().stone, goal: () => 'riverbank', scene: 'riverbank', spot: () => TUT.nearItem('stone') && [TUT.nearItem('stone').x, TUT.nearItem('stone').y],
    say: () => 'Smooth stones! Nice flat ones. Two of those.', remind: () => ['Here\'s a good smooth stone!', 'Grab this stone!', 'Flat ones, by the water.'], remindAt: () => { const it = TUT.nearItem('stone'); return it ? [it.x, it.y] : TUT.exitSpot(); } },
  { id: 'fluff', done: () => TUT.raw().fluff >= 2 || !TUT.fluffNeed(), goal: () => TUT.f1Fluff() ? 'f1' : 'rise', scene: 'f1', spot: () => TUT.nearItem('fluff') && [TUT.nearItem('fluff').x, TUT.nearItem('fluff').y],
    say: () => 'Fluff blows all over in this wind. Grab it quick!', remind: () => ['Quick, the fluff!', 'Don\'t let the wind take it!', 'Rabbit fluff. We need three tufts.'], remindAt: () => { const it = TUT.nearItem('fluff'); return it ? [it.x, it.y] : TUT.exitSpot(); } },
  { id: 'lesson', done: () => TUT.tip('craftLesson') || !TUT.fluffNeed(), once: 'craftLesson', hold: true, spot: null, goal: () => TUT.raw().stick >= 3 ? null : 'start',
    say: () => 'Two tufts! The bench needs more for its glue. There are rabbits to the south... but they are mean! Time you learned crafting. Let\'s make you a wooden sword.',
    after: () => { hearRecipe('woodsword'); startCoach('sword'); } },
  { id: 'sword', done: () => !!bladeKind() || !TUT.fluffNeed(), goal: () => TUT.raw().stick >= 3 ? null : 'start', spot: null,
    remind: () => TUT.raw().stick >= 3 ? [`Slap that sword together! ${TUT.M()}, Craft, wooden sword, Combine.`, 'Three sticks on the mat, then Combine!'] : ['Sticks first. The glade has plenty.', 'Three sticks for a sword!'], remindAt: () => TUT.exitSpot() },
  { id: 'rabbits', done: () => !TUT.fluffNeed(), goal: () => 'rise', scene: null, spot: null,
    say: () => state.scene === 'rise' ? 'There they are! Watch their eyes: when they flash red, jump aside. Then swing!' : 'And go! South, to the rabbits!',
    key: () => state.scene === 'rise' ? 'field' : 'go', remind: () => state.scene === 'rise' ? ['Rabbit! Get that fluff straight from the source!', 'Swing at it! It\'s got our fluff.'] : ['South! The rabbits have our fluff.', 'This way, to the rabbits!'],
    remindAt: () => { const r = state.enemies.find(e => e.type === 'rabbit'); return state.scene === 'rise' && r ? [r.x, r.y] : TUT.exitSpot(); } },
  { id: 'build', done: () => campDone(), goal: () => 'camp', scene: 'camp', spot: () => { const b = campMark(); return b && [b.fx * W, b.fy * H]; },
    say: () => campMarkLine(), key: () => campMarkLine(), remind: () => [campMarkLine()], remindAt: () => { const b = campMark(); return b && [b.fx * W, b.fy * H]; } },
  { id: 'homebase', done: () => gearOwned().includes('feather'), scene: 'camp', spot: null, hold: true, once: 'campdone', bounce: true,
    say: () => 'Home base! We did it! Here, I found this feather. It\'s for you.' },
];
// where the current step wants Pip to walk (and whether he steps out of sight on arriving, and to which screen), once he's said his line
function tutorialLead(sc) {
  const s = tutorialStep(); if (!s || !s.lead || s.lead.scene !== sc.id) return null;
  if (s.lead.after && TUT.saidAt(s.id) == null) return null;
  return { at: s.lead.at(), hide: s.lead.hide, to: s.lead.to };
}
function tutorialStep() {
  if (!state.inv || ARENA || PUZZLE || storyAt('adventure')) return null;
  const D = state.inv.tutDone || (state.inv.tutDone = {});       // once a step is done it stays done (walking away doesn't undo it)
  for (const s of TUTORIAL) { if (s.begins && !s.begins()) return null; if (D[s.id]) continue; if (!s.done()) return s; D[s.id] = true; }
  return null;
}
function tutorialGoal() { const s = tutorialStep(); return s && s.goal ? s.goal() : null; }
// the camp mark Pip stands at, and his one-line reading of it (what it takes, or that you have it, or set it down)
function campMark() { const f = WORLD.camp.feat, pc = ['fire', 'bench'].find(q => !campBuilt(q)); return pc && (f.buildSpots || []).find(b => b.piece === pc); }
function campMarkLine() {
  const b = campMark(); if (!b) return '';
  const raw = rawOf(), n = k => raw[k] || 0, P = campParts(), M = TUT.M(), taught = TUT.tip('craftLesson');
  if (b.piece === 'fire') {
    const left = CAMP_PARTS.fire.stones - P.stones;
    if (left > 0 && n('stone')) return `Set the stones here! ${Math.min(left, n('stone'))} of your stones go in the ring.`;
    if (left > 0) return `Fire ring goes here: ${left === CAMP_PARTS.fire.stones ? 'five smooth stones' : left + ' more smooth stone' + (left > 1 ? 's' : '')}, then tinder.`;
    if (n('tinder')) return 'Tinder in the middle, and we have a fire!';
    if (!taught) return 'The ring is done! It needs tinder. We\'ll make some soon.';
    return n('stick') >= 2 ? `Tinder: two sticks on the Craft mat (${M}).` : 'Tinder needs two sticks. The glade has plenty.';
  }
  const left = CAMP_PARTS.bench.frames - P.frames;
  if (n('benchframe')) return 'Set the frame here!';
  if (!taught) return 'The bench goes here: two frames. We\'ll make them soon.';
  if (n('glue') && n('stick') >= 2) return `Frame: two sticks and glue on the Craft mat (${M}). ${left} to go.`;
  if (n('fluff') >= 2 && !n('glue')) return `Glue first: two fluff on the Craft mat (${M}).`;
  return `The bench needs ${left} frame${left > 1 ? 's' : ''}: each two sticks and rabbit glue.`;
}

// ---------------------------------------------------------------------------------------------------------------
// Pip's other lines: flavour and the woods. Each: a key (said once), where (scene), when it applies, the words,
// optionally where Pip walks to say it (at) and how near you must be for that (sight). Order is priority.
// ---------------------------------------------------------------------------------------------------------------
const tipSaid = k => !!((state.inv.pipTips || {})[k]);
const PIP_LINES = [
  { key: 'compost', when: () => state.inv.acorns > 0 && !storyAt('adventure') && state.inv.quests && state.inv.quests.garden && state.inv.quests.garden.done != null,
    text: 'Get enough of those acorns, and you can make some awesome compost!' },
  { key: 'pound', when: sc => storyAt('gather') && !campDone() && sc.id !== 'camp' && TUT.tip('tada'),
    text: 'Try pounding around in different places. You never know what you might knock loose!' },
  { key: 'shroom', scene: 'camp', when: (sc, h) => campDone() && sc.feat.shroom && Math.hypot(h.x - sc.feat.shroom[0] * W, h.y - sc.feat.shroom[1] * H) < UNIT * 4.5, at: sc => [sc.feat.shroom[0] * W, sc.feat.shroom[1] * H],
    text: 'That mushroom hums at night.' },
  // the woods: the gremlins start to show themselves
  { key: 'peek-seen', scene: 'w1', when: () => !!rtFor('w1').flags.peekGone && state.time - rtFor('w1').flags.peekGone > 0.6, text: 'Did you SEE that?! Something green, behind the boulder!' },
  { key: 'taunt-seen', scene: 'w2', when: () => state.enemies.some(e => e.taunter && e.mode === 'taunt' && e.leaps >= 1), text: 'Ignore it! Gremlins. Rude little things.' },
  // the glade's sticks run out: the rest come down out of the trees when you pound by a trunk
  { key: 'slam-trees', scene: 'start', when: () => storyAt('gather') && campMissing().stick > 0 && !state.items.some(i => i.type === 'stick') && !campBuilt('fire'),
    at: () => { const tr = state.solids.filter(s => s.kind === 'tree').sort((a, b) => Math.hypot(a.x - state.hero.x, a.y - state.hero.y) - Math.hypot(b.x - state.hero.x, b.y - state.hero.y))[0]; return tr ? [tr.x + tr.r + UNIT, tr.y + UNIT * 0.6] : null; }, sight: 12,
    text: () => `That's all the sticks lying about. The rest are up in the trees! Jump, then ${TUT.F()} in the air: pound right by a trunk.` },
  // short of stones on the riverbank: the boulder by the water has more inside
  { key: 'stone-crag', scene: 'riverbank', when: sc => storyAt('gather') && campMissing().stone > 0 && sc.solids.some(s => s.bar === 'stonecrag') && !broken('riverbank', 'stonecrag') && !state.items.some(i => i.type === 'stone'),
    at: sc => { const q = sc.feat.stoneCrag; return [q[0] * W - UNIT * 1.6, q[1] * H]; }, sight: 12,
    text: () => `Still short! That boulder by the water is full of smooth stones. We need something heavy to throw at it...` },
  { key: 'stone-loosen', scene: 'riverbank', when: sc => tipSaid('stone-crag') && !broken('riverbank', 'stonecrag') && !rtFor('riverbank').pulled.has('riverrock') && !state.carry,
    at: sc => { const q = sc.feat.riverRock; return [q[0] * W + UNIT * 1.4, q[1] * H]; }, sight: 12,
    text: () => `That one! Stuck in the ground. Pound beside it to loosen it, then hold ${TUT.F()}, rock it, and pull it up!` },
  { key: 'stone-throw', scene: 'riverbank', when: () => state.carry === 'rock' && !broken('riverbank', 'stonecrag'),
    text: () => `Now throw it at the boulder! Hold ${TUT.F()} to aim, let go to throw.` },
  // the first ripe turnip: Pip shows you how to pull it up (how many rocks depends on your farming)
  { key: 'pull-turnip', scene: 'meadow', when: () => !state.inv.harvests && ((rtFor('meadow').flags.plots) || []).some(q => q.s === 1 && plotStage(q) >= 3),
    at: () => { const i = ((rtFor('meadow').flags.plots) || []).findIndex(q => q.s === 1 && plotStage(q) >= 3), q = WORLD.meadow.feat.plots[i]; return [q[0] * W + UNIT, q[1] * H]; }, sight: 12,
    text: () => cropNeed() ? `It's ripe! Grab hold (hold ${TUT.F()}), rock it ${K.l} ${K.r} a few times, then pull ${K.u}!` : `It's ripe! Just ${TUT.F()} and pull it up!` },
  // the rabbits' field: combat basics, in two lines
  { key: 'combat-eyes', scene: 'rise', when: () => !!bladeKind() && TUT.fluffNeed(),   // said where he stands: walking up to a rabbit is your job
    text: 'Watch their eyes! When they flash red, get out of the way. That\'s when they charge.' },
  { key: 'combat-swing', scene: 'rise', when: () => !!bladeKind() && TUT.fluffNeed() && TUT.tip('combat-eyes'),
    text: () => `Then swing (${K.act.toUpperCase()}) while it\'s close. A couple of hits and it\'s done. Or hold ${K.act.toUpperCase()} and let go: one big lunge.` },
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
    at: sc => { const k = sc.solids.find(s => s.bar === 'knockA'); return [k.fx * W, k.fy * H]; }, text: 'Little boulders! Practise on those. Heave a rock and let it fly!' },
  { key: 'gate', scene: 'w1', when: sc => !broken('w1', 'crack1') && sc.solids.some(s => s.bar === 'crack1' && s.kind === 'cracked'), sight: 12,
    at: sc => { const k = sc.solids.find(s => s.bar === 'crack1' && s.kind === 'cracked'); return [k.fx * W, k.fy * H]; }, text: 'Those boulders are wedged on a cracked stone. Throw a rock at it. Mind the mud: a short throw sinks.' },
  { key: 'opened', scene: 'w1', when: () => broken('w1', 'crack1'), text: 'CRASH! Onward!' },
  { key: 'map-w1', scene: 'w1', text: 'Drawing the woods in... boulders, big and small, a very suspicious tree.' },
  { key: 'map-w2', scene: 'w2', text: 'Last blank corner of the map! Past these boulders, and it\'s done.' },
  { key: 'ring', scene: 'w2', when: () => !broken('w2', 'crack2'), at: sc => { const k = sc.solids.find(s => s.bar === 'crack2'); return k ? [k.fx * W - UNIT * 2.5, k.fy * H] : null; },
    text: 'Another big one in the way. Keep hitting it; it cracks a bit more each time.' },
];

// ---------------------------------------------------------------------------------------------------------------
// Coached steps: instructions that stay on screen (even inside the pack) until you've actually done each one.
// startCoach(id) begins a sequence once; coachUpdate() (called every frame from update) moves it along; drawCoach
// (draw-ui.js) shows the current step. Each step: text, done(); an optional skip() leaves a step out.
// ---------------------------------------------------------------------------------------------------------------
const inPack = tab => state.menu && state.menu.view === 'pack' && (!tab || PACK_TABS[state.menu.tab] === tab);
const onMat = (k, n) => (state.mat || []).filter(x => x === k).length >= n;
const COACH = {
  sword: () => [
    { text: 'First, three sticks. The glade has plenty.', done: () => rawOf().stick >= 3 || !!bladeKind() },
    { text: `Open your pack: ${TUT.M()}`, done: () => inPack() || !!bladeKind() },
    { text: 'Go to the Craft tab: \u2190 \u2192', done: () => inPack('Craft') || !!bladeKind() },
    { text: `Under Recipes, pick the wooden sword and press ${TUT.F()}`, done: () => onMat('stick', 3) || !!bladeKind() },
    { text: `Press ${TUT.F()} on Combine`, done: () => !!bladeKind() },
    { text: `Close the pack: ${TUT.M()}`, done: () => !state.menu },
  ],
  tinder: () => [
    { text: 'Tinder takes two sticks. The glade has plenty.', done: () => rawOf().stick >= 2 || rawOf().tinder > 0 || campBuilt('fire') },
    { text: `Open your pack: ${TUT.M()}`, done: () => inPack() || rawOf().tinder > 0 || campBuilt('fire') },
    { text: 'Craft tab, then tinder under Recipes', done: () => onMat('stick', 2) || rawOf().tinder > 0 || campBuilt('fire') },
    { text: `Press ${TUT.F()} on Combine`, done: () => rawOf().tinder > 0 || campBuilt('fire') },
    { text: `Close the pack, then ${TUT.F()} at the ring`, done: () => campBuilt('fire') },
  ],
  pound: () => [
    { text: `Jump (${keyName(K.jump)}), then ${TUT.F()} in the air: pound the ground by the hollow tree`, done: () => !!state.inv.robinFlushed || (state.inv.bag.turnipseed || 0) > 0 },
    { text: 'Out it comes! Grab the seeds it dropped', done: () => (state.inv.bag.turnipseed || 0) > 0 || ((rtFor('meadow').flags.plots) || []).some(q => q.s) },
  ],
  combat: () => [
    { text: `Eyes flash red? Get out of the way! Then swing (${TUT.F()}) while it's close.`, done: () => (state.inv.rabbitKills || 0) >= 1 || !TUT.fluffNeed() },
    { text: `Got one! Now the other. Or hold ${TUT.F()}, let go: lunge.`, done: () => (state.inv.rabbitKills || 0) >= 2 || !TUT.fluffNeed() },
  ],
  frame: () => [
    { text: `Glue first: two fluff. Open your pack (${TUT.M()}), Craft, rabbit glue`, done: () => rawOf().glue > 0 || rawOf().benchframe > 0 || campBuilt('bench') },
    { text: 'Then a frame: two sticks and glue (Recipes: bench frame)', done: () => rawOf().benchframe > 0 || campBuilt('bench') },
    { text: `Close the pack, then ${TUT.F()} at the bench mark`, done: () => campParts().frames > 0 || campBuilt('bench') },
  ],
};
function startCoach(id) {
  const tips = state.inv.pipTips || (state.inv.pipTips = {});
  if (tips['coach-' + id] || !COACH[id]) return;
  tips['coach-' + id] = true; state.coach = { id, i: 0, t: state.time };
}
function coachUpdate() {
  if (!state.inv || ARENA || PUZZLE) return;
  // camp coaching starts on its own once the lesson has happened
  if (!state.coach && TUT.tip('craftLesson') && !campBuilt('fire') && campParts().stones >= CAMP_PARTS.fire.stones) { hearRecipe('tinder'); startCoach('tinder'); }
  if (!state.coach && TUT.tip('craftLesson') && campBuilt('fire') && !campBuilt('bench') && bladeKind()) { hearRecipe('glue'); hearRecipe('benchframe'); startCoach('frame'); }
  if (!state.coach && state.scene === 'rise' && bladeKind() && TUT.fluffNeed() && state.enemies.some(e => e.type === 'rabbit')) startCoach('combat');   // at the rabbits: the basics stay pinned until you've done it
  const c = state.coach; if (!c) return;
  const steps = COACH[c.id]();
  while (c.i < steps.length && steps[c.i].done()) { c.i++; c.t = state.time; sfx.tock(); c.said = false; }
  if (c.i >= steps.length) { state.coach = null; return; }
  const p = state.pip;                                  // out in the world, Pip says the current step (once), as himself
  if (!state.menu && !c.said && p && p.show && !heldText()) { c.said = true; pipLine(steps[c.i].text); }
}
