// ===== pip.js: Pip: the opening on the jetty, leading and waiting, the garden, reminders, camp talk, gathering guidance, bounces.
// =====================================================================
// Cutscenes: intro storm, sword, toad, faint, ending
// =====================================================================
function startIntro() {
  state.night = 0; state.rain = 0; state.clouds2 = 0; state.fireLit = 1;
  rtFor('camp').flags.built_tent = true;               // Pip already pitched the tent at the camp spot
  if (state.scene !== 'riverbank') enterScene('riverbank');
  placeOldJetty(sceneDef());
  const [jx, jy, dx, dy] = sceneDef().feat.oldJetty, h = state.hero;
  { const sc = sceneDef(), fx = jx - dx * 1.2 * UNIT / W, fy = jy - dy * 1.2 * UNIT / H;   // nothing buried at the jetty's foot: that's where you stand
    sc.solids = sc.solids.filter(s => Math.hypot((s.fx - fx) * W, (s.fy - fy) * H) > UNIT * 2.6); refreshSceneGeometry(); }
  h.x = (jx - dx * 0.7 * UNIT / W) * W; h.y = (jy - dy * 0.7 * UNIT / H) * H; h.fx = dx; h.fy = dy; h.side = dx < 0 ? -1 : 1;   // on the bank at the jetty's foot, facing the water
  state.pip = { x: h.x - dx * UNIT * 0.9 - dy * UNIT * 1.0, y: h.y - dy * UNIT * 0.9 + dx * UNIT * 1.0, show: true, follow: true, side: -1 };
  for (let k = 0; k < 6; k++) collideSolids(state.pip, UNIT * 0.45);   // not inside (or behind) a rock at the jetty's foot
  state.intro = { step: 0, gone: false };              // not a cutscene: you can wander the bank while Pip talks
  setMusic('forest'); setAmbience('rain');
}
// The opening, mid-conversation on the old jetty. Each of Pip's lines waits until you've read it (action key);
// the screen edges stay closed until Pip is done and heads south. Then Pip wanders off the bottom of the
// screen and waits for you by the garden.
const INTRO_LINES = [
  '...no, LISTEN. Old Wick says the river runs to a pool so shiny it hurts your eyes!',
  'And past the woods? Treasure. Actual, real, heavy treasure!',
  'We\'re gonna need snacks. SO many snacks. Come on, my garden\'s just south!',
];
function updateIntro(dt) {
  const c = state.intro, p = state.pip, h = state.hero;
  if (!c) return;
  const finish = () => { state.intro = null; if (p) p.show = false; state.inv.story = Math.max(state.inv.story || 0, STORY.garden); };   // never winds the story back
  if (state.scene !== 'riverbank') { finish(); return; }
  if (!c.gone) {
    // while talking, Pip can't stand still: little wanders around the bank near where you started, pausing now and then
    if (!c.home) c.home = [p.x, p.y];
    if (c.wt && state.time - c.wtT > 3.5) c.wt = null;   // couldn't get there (a rock, the water's edge): pick somewhere else
    if (!c.wt || Math.hypot(p.x - c.wt[0], p.y - c.wt[1]) < UNIT * 0.2) {
      if (!c.pause) c.pause = state.time + 0.4 + Math.random() * 1.2;
      if (state.time > c.pause) { const a = Math.random() * 6.28, r = UNIT * (0.8 + Math.random() * 1.6); c.wt = [c.home[0] + Math.cos(a) * r, c.home[1] + Math.sin(a) * r * 0.7]; c.wtT = state.time; c.pause = 0; }
    }
    if (c.wt) {
      const dx = c.wt[0] - p.x, dy = c.wt[1] - p.y, d = Math.hypot(dx, dy);
      if (d > UNIT * 0.2) { const sp = Math.min(d, L() * sceneDef().speed * 0.55 * dt), ox = p.x, oy = p.y; p.x += dx / d * sp; p.y += dy / d * sp;
        if (isChasm(p.x, p.y, UNIT * 0.3)) { p.x = ox; p.y = oy; c.wt = null; c.pause = 0; }                 // not into the river
        collideSolids(p, UNIT * 0.38); clampTo(p, UNIT * 0.6); }
      p.side = Math.abs(dx) > UNIT * 0.2 ? (dx > 0 ? 1 : -1) : (h.x > p.x ? 1 : -1);
    } else p.side = h.x > p.x ? 1 : -1;
    if (heldText() || state.time - (state.dismissedAt || -9) < 0.35) return;
    if (c.step < INTRO_LINES.length) { say(INTRO_LINES[c.step], p.x, p.y - UNIT * 1.3, { key: 'npc', who: 'pip', color: '#bfe4ff' }); c.step++; }
    else { c.gone = true; c.t0 = state.time; }
    return;
  }
  const tx = W * 0.5, ty = H + UNIT * 1.2, dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, sp = L() * sceneDef().speed * 1.5 * dt;   // off at a run for the garden
  p.x += dx / d * sp; p.y += dy / d * sp; p.side = dx > 0 ? 1 : -1;
  collideSolids(p, UNIT * 0.38);
  if (p.y > H + UNIT * 0.6 || state.time - c.t0 > 12) finish();
}
// Pip's waiting spot by the garden: a step to the side of the first patch of rich soil
function gardenSpot() { const q = WORLD.meadow.feat.plots[0]; return [q[0] * W + UNIT * 1.25, q[1] * H - UNIT * 0.15]; }
// ---------------- Pip, before the gremlins: a step ahead of you, showing the way and explaining things ----------------
// Pip is with you everywhere until the gremlins strike, and always leads toward the woods
function pipWithYou() {
  const inv = state.inv, sc = WORLD[state.scene];
  return !ARENA && !PUZZLE && state.started && !inv.pipTaken && !inv.pipSaved && !inv.sword && !!sc && (sc.area !== 'indoor' || sc.id === 'tentin') && sc.area !== 'cave';   // Pip comes into the tent too
}
// out gathering for camp, where Pip takes you next: sticks in the glade, stones on the riverbank, fluff on the windy
// field, then (fluff still short) the rabbits one field further, once you have a blade; back to camp when it's all in
function gatherGoal() {
  const miss = campMissing(), raw = rawOf();
  if (miss.stick) return 'start';
  if (miss.stone) return 'riverbank';
  if (miss.fluff) {
    const f1 = state.scene === 'f1' ? state.items : (RT.f1 ? RT.f1.items : (WORLD.f1.initItems || []));
    if (f1.some(i => i.type === 'fluff')) return 'f1';
    if (!bladeKind()) return (raw.stick || 0) >= 3 ? null : 'start';   // make the sword first (null: stay and craft)
    return 'f2';
  }
  return 'camp';
}
function pipExit(sc) {                                // where Pip is heading: the garden, then the camp spot, then the woods gate
  const inv = state.inv;
  if (!storyAt('tocamp')) return null;                 // practising in the garden
  const goal = storyAt('gather') && !campDone() ? gatherGoal() : storyAt('adventure') ? 'w2' : 'camp';   // out gathering: to wherever the next thing is
  if (!goal) return null;
  if (sc.id === goal) return null;
  let best = null, bd = screensBetween(sc.id, goal);
  for (const ex of sc.exits) { const d = screensBetween(ex.to, goal); if (d < bd && !(ex.locked && ex.locked())) { bd = d; best = ex; } }
  return best || null;
}
function placePipNearHero() {
  const old = state.pip && state.pip.visit;          // left before Pip got to say it: Pip can say it next time
  if (old && !old.said && state.inv.pipTips) delete state.inv.pipTips[old.key];
  // placed a few steps ahead of you toward where we're going (never behind you, so he never has to run around you)
  const h = state.hero, sc0 = sceneDef(), ex = sc0 && pipExit(sc0), [gx, gy] = ex ? edgePoint(ex.side, (ex.a + ex.b) / 2).map((v, i) => v * (i ? H : W)) : [h.x + h.fx * UNIT * 3, h.y + h.fy * UNIT * 3];
  const ddx = gx - h.x, ddy = gy - h.y, dd = Math.hypot(ddx, ddy) || 1, k0 = Math.min(dd, UNIT * 2.5);
  const bx = h.x + ddx / dd * k0 - ddy / dd * UNIT * 0.9, by = h.y + ddy / dd * k0 + ddx / dd * UNIT * 0.9;
  state.pip = { x: Math.max(UNIT, Math.min(W - UNIT, bx)), y: Math.max(UNIT, Math.min(H - UNIT, by)), show: true, follow: true };
}
// Pip's lines. The few that open the game and teach the garden wait for you to read them (PIP_HOLD); everything
// else is a light aside that fades on its own, and Pip leaves a good gap between them (PIP_GAP seconds).
const PIP_HOLD = new Set([]);                        // (the opening on the jetty is the only speech that waits; it isn't a pipSay)
const PIP_GAP = 8;
const CROP_ROCKS = [3, 2, 2, 1, 1, 0];                   // rocks back and forth before a crop comes up, by farming level (0 = just F)
const cropNeed = () => CROP_ROCKS[Math.min(CROP_ROCKS.length - 1, farmLevel())];
// Reminders during the early game. If what Pip last suggested hasn't happened after a while, Pip walks to something
// that helps (the robin, a patch, the next exit, a stick you still need) and says it a new way. Each situation has a
// handful of phrasings, used in turn, never the same one twice running; the wait grows a little each time.
function remindNow(sc, h) {
  const inv = state.inv, f = sc.feat, P = q => [q[0] * W, q[1] * H], seeds = inv.bag.turnipseed || 0;
  if (sc.id === 'meadow' && inv.story === STORY.garden) {
    if (!seeds) { const b = state.bird, rb = b && b.mode === 'perch' ? [b.x, b.y + UNIT] : hollowPoint(), n = (state.remind && state.remind.n) || 0;
      const at = [rb, [(rb[0] + h.x) / 2, (rb[1] + h.y) / 2], [hollowPoint()[0], hollowPoint()[1] + UNIT * 1.2]][n % 3];   // by the robin, halfway to you, by its tree
      return { key: 'robin', at, lines: ['The robin drops seeds when you startle it. Run right at it!', 'Robin\'s back! Sneak close, then dash!', 'No seeds yet? That robin has plenty.', 'If it hides in its tree, jump and stomp by the trunk!', 'Go on, give the robin a scare!'] }; }
    const q = f.plots && f.plots.find((pl, i) => !((rtFor('meadow').flags.plots || [])[i] || {}).s);
    if (q) return { key: 'plant', at: P(q), lines: ['This patch is empty. Pop a seed in!', 'Right here! The dirt wants those seeds.', 'Stand on the soil and plant one.', 'Seeds do best in the ground, not your pocket!'] };
  }
  if (inv.story === STORY.tocamp || (storyAt('gather') && !campDone())) {
    const miss = campMissing(), want = Object.keys(miss);
    const it = state.items.filter(i => want.includes(i.type)).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    const NAME = { stone: 'smooth stone', stick: 'stick', fluff: 'tuft of fluff' };
    if (it) return { key: 'item-' + it.type, at: [it.x, it.y], lines: [`Here's a good ${NAME[it.type]}!`, `Grab this ${NAME[it.type]}!`, `Look, a ${NAME[it.type]}. We need that.`, `Don't miss this ${NAME[it.type]}!`] };
    const ex = pipExit(sc);
    if (ex) { const e = edgePoint(ex.side, (ex.a + ex.b) / 2), at = [e[0] * W - (ex.side === 'e' ? UNIT * 1.5 : ex.side === 'w' ? -UNIT * 1.5 : 0), e[1] * H - (ex.side === 's' ? UNIT * 1.5 : ex.side === 'n' ? -UNIT * 1.5 : 0)];
      return { key: 'exit-' + sc.id, at, lines: ['This way!', 'Let\'s try over here.', 'Follow me, it\'s not far.', 'Onward! Through here.'] }; }
  }
  return null;
}
function pipRemind(sc, p, h) {
  const inv = state.inv, R = state.remind || (state.remind = { t: state.time, i: {}, last: null, n: 0 });
  const prog = [inv.story, inv.bag.turnipseed || 0, ((rtFor('meadow').flags.plots) || []).filter(q => q.s).length, JSON.stringify(campHave()), sc.id].join('|');
  if (prog !== R.prog) {                              // something happened: start the clock again, and anything Pip was
    if (R.prog) for (const t of state.texts) if ((t.key === 'pip' || t.who === 'pip') && !t.hold && t.t > 0.3) { t.life = Math.min(t.life, t.t + 0.35); t.more = []; }   // urging you to do is done: it goes
    if (R.prog && p.visit && p.visit.key === 'remind') p.visit = null;
    R.prog = prog; R.t = state.time; R.n = 0; return;
  }
  if (p.visit || speakingNow() || state.time - (state.pipTalkT || -9) < PIP_GAP) return;
  if (state.time - R.t < 16 + R.n * 6) return;
  const r = remindNow(sc, h); if (!r) return;
  const k = R.i[r.key] = ((R.i[r.key] ?? -1) + 1) % r.lines.length;
  let line = r.lines[k]; if (line === R.last) line = r.lines[(k + 1) % r.lines.length];
  R.last = line; R.t = state.time; R.n++; state.pipTalkT = state.time;
  p.visit = { x: r.at[0], y: r.at[1], t0: state.time, text: line, key: 'remind', site: { x: r.at[0], y: r.at[1], r: 9 } };
}
function pipSay(key, text, at, sight = 7, site = null) {
  const tips = state.inv.pipTips || (state.inv.pipTips = {}), p = state.pip;
  if (tips[key] || p.visit || state.time - (state.pipTalkT || -9) < (PIP_HOLD.has(key) ? 2.2 : PIP_GAP) || speakingNow()) return false;
  if (at && Math.hypot(state.hero.x - at[0], state.hero.y - at[1]) > UNIT * sight) return false;   // wait until you're near enough to see it
  tips[key] = true; state.pipTalkT = state.time;
  if (at) { p.visit = { x: at[0], y: at[1], t0: state.time, text, key, site: site || { x: at[0], y: at[1], r: 8 } }; return true; }   // go over there first
  say(text, p.x, p.y - UNIT * 1.3, { key: 'pip', color: '#bfe4ff', site, hold: PIP_HOLD.has(key) ? undefined : false, size: PIP_HOLD.has(key) ? 1 : 0.9 });
  return true;
}
// out gathering for the camp: on a screen with camp materials (or off the usual paths), Pip says whether this
// place has given what it can, or what's still missing. Said again only when the answer changes.
const CAMP_NEED = { stone: 2, stick: 2, fluff: 3 };   // fire ring: 2 stones + a stick; bench: a stick, glue (2 fluff) and a fluff cushion
function campMissing() { const c = campHave(), out = {}; for (const [k, n] of Object.entries(CAMP_NEED)) if (c[k] < n) out[k] = n - c[k]; return out; }
function needWords(miss) {
  const w = { stone: n => `${n} smooth stone${n > 1 ? 's' : ''}`, stick: n => `${n} stick${n > 1 ? 's' : ''}`, fluff: n => `${n} tuft${n > 1 ? 's' : ''} of rabbit fluff` };
  const parts = Object.entries(miss).map(([k, n]) => w[k](n));
  return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];
}
function pipGatherTalk(sc, p) {
  if (sc.id === 'camp' || sc.id === 'tentin' || p.visit) return;
  const local = new Set((sc.initItems || []).map(o => o.type).filter(t => t in CAMP_NEED));
  if ((sc.spawns || []).some(o => o.type === 'rabbit')) local.add('fluff');
  const home = ['start', 'meadow', 'w1', 'w2', 'riverbank', 'f1', 'f2'];
  const miss = campMissing(), left = Object.keys(miss), here = left.filter(k => local.has(k));
  if (left.length && !local.size && home.includes(sc.id)) return;   // nothing to gather here and not lost: nothing to say
  const text = !left.length ? 'That\'s everything! Back to camp.'
    : local.size && !here.length ? `We have what we need from here. Still need ${needWords(miss)}.`
    : `Let's keep looking around. Still need ${needWords(miss)}.`;
  const key = left.length ? sc.id + '|' + text : 'all';        // "everything" is said once, wherever you are
  if (state.pipGatherKey === key || state.time - (state.pipTalkT || -9) < PIP_GAP || speakingNow()) return;
  state.pipGatherKey = key; state.pipTalkT = state.time;
  say(text, p.x, p.y - UNIT * 1.3, { key: 'pip', color: '#bfe4ff', hold: false, size: 0.9 });
}
// Pip's spot beside something: on the side facing you, a step away from it
function pipBeside(v) {
  const h = state.hero, dx = h.x - v.x, dy = h.y - v.y, d = Math.hypot(dx, dy) || 1;
  return [v.x + dx / d * UNIT * 1.3, v.y + dy / d * UNIT * 1.3];
}
// Pip gets excited: now and then while he's talking (more often on a line that ends in "!", and when he calls you
// over) he bounces on the spot, one to three quick hops. His speech bubble stays put.
function pipBounce(dt) {
  const p = state.pip; if (!p || !p.show) return;
  const mine = state.texts.filter(t => t.key === 'pip' || t.who === 'pip');
  for (const t of mine) if (!t.bounced) { t.bounced = true; if (Math.random() < (/!/.test(t.text) ? 0.6 : 0.2)) p.hop = { t: 0, n: 1 + Math.floor(Math.random() * 3) }; }
  if (!p.hop && mine.length && Math.random() < dt * 0.15) p.hop = { t: 0, n: 1 + Math.floor(Math.random() * 2) };
  if (p.hop) {
    p.hop.t += dt; const per = 0.26, k = p.hop.t / per;
    if (k >= p.hop.n) { p.hop = null; p.bz = 0; } else p.bz = Math.abs(Math.sin(Math.PI * (k % 1))) * UNIT * (0.3 + 0.08 * Math.sin(k * 5));
  }
}
function updatePip(dt) {
  pipBounce(dt);
  if (state.intro) { updateIntro(dt); return; }
  if (!pipWithYou()) { if (state.pip && state.pip.follow) state.pip.show = false; return; }
  const garden = state.inv.story === STORY.garden;     // Pip went ahead and is waiting by the garden, and stays there
  if (garden && state.scene !== 'meadow') { if (state.pip) state.pip.show = false; return; }
  if (garden && (!state.pip || !state.pip.show || !state.pip.atGarden)) { const [gx, gy] = gardenSpot(); state.pip = { x: gx, y: gy, show: true, follow: true, side: -1, atGarden: true }; }
  if (!state.pip || !state.pip.follow || !state.pip.show) placePipNearHero();
  const p = state.pip, h = state.hero, sc = sceneDef(), rt = rtFor(sc.id);
  // lead: stand a couple of steps from you, toward where we're going
  const ex = sc.id === 'w2' ? null : pipExit(sc), [gx, gy] = ex ? edgePoint(ex.side, (ex.a + ex.b) / 2).map((v, i) => v * (i ? H : W)) : [W / 2, H / 2];
  // Pip leads: out in front along the way to the exit, on one side of your line (his lane), and never loops around you.
  // Already a few steps ahead of you and roughly on the way? He waits there. Fallen behind (you ran past)? He
  // runs up his own side to get in front again.
  const dx = gx - h.x, dy = gy - h.y, dl = Math.hypot(dx, dy) || 1, lead = Math.min(dl, UNIT * 4.2), ux = dx / dl, uy = dy / dl;
  const ppx = p.x - h.x, ppy = p.y - h.y, along = ppx * ux + ppy * uy, side = -ppx * uy + ppy * ux;
  if (p.lane == null || Math.abs(side) > UNIT * 0.6) p.lane = side >= 0 ? 1 : -1;
  const waiting = along > Math.min(lead, UNIT * 3.4) - UNIT * 0.3 && along < UNIT * 9 && Math.abs(side) < UNIT * 4;   // up ahead and roughly on the way: he waits, even if you wander a bit
  if (waiting && !p.waitAt) p.waitAt = [p.x, p.y]; else if (!waiting) p.waitAt = null;
  // never standing still: waiting up ahead (or at his garden post) he paces and potters about the spot
  const pot = k => [Math.cos(state.time * 0.8 + k) * UNIT * 0.7 + Math.cos(state.time * 1.9 + k * 2) * UNIT * 0.2, Math.sin(state.time * 1.1 + k) * UNIT * 0.4];
  let tx = waiting ? p.waitAt[0] + pot(1)[0] : h.x + ux * lead - uy * p.lane * UNIT * 0.9, ty = waiting ? p.waitAt[1] + pot(1)[1] : h.y + uy * lead + ux * p.lane * UNIT * 0.9;
  if (garden && !p.visit) { const g = gardenSpot(), o = pot(3); tx = g[0] + o[0]; ty = g[1] + o[1]; }   // Pip's post is the garden (a reminder can take him off it)
  // Early on, if you don't follow, Pip goes on ahead: after a while he walks right off the screen, then pops back in
  // from that side to hurry you up, and heads off again. Only when there's somewhere to lead you (the way to camp,
  // or the way on while gathering).
  const early = state.inv.story === STORY.tocamp || (storyAt('gather') && !campDone());
  const L0 = p.lead || (p.lead = { best: dl, idle: 0, n: 0 });
  if (!early || !ex || p.visit || garden) { L0.idle = 0; L0.best = dl; }
  else if (dl < L0.best - UNIT) { L0.best = dl; L0.idle = 0; L0.phase = null; }
  else if (!speakingNow()) L0.idle += dt;
  if (early && ex && !p.visit && !garden) {
    const [ox, oy] = [gx + ux * UNIT * 3, gy + uy * UNIT * 3];                         // just past the exit, off the screen
    if (!L0.phase && L0.idle > 9) { L0.phase = 'going'; say(['I\'ll go on ahead!', 'This way! Come on!', 'Follow me!'][L0.n % 3], p.x, p.y - UNIT * 1.3, { key: 'pip', hold: false, color: '#bfe4ff' }); }
    if (L0.phase === 'going') { tx = ox; ty = oy; if (p.x < -UNIT || p.x > W + UNIT || p.y < -UNIT || p.y > H + UNIT) { L0.phase = 'away'; L0.t = state.time; } }
    if (L0.phase === 'away') { tx = ox; ty = oy; if (state.time - L0.t > 6) {                      // back in to hurry you along
      L0.phase = 'back'; L0.n++; p.x = gx + ux * UNIT * 0.8; p.y = gy + uy * UNIT * 0.8; p.waitAt = null;
      say(['Hurry up, slowpoke!', 'Come ON! It\'s this way!', 'Are you coming or not?', 'I\'m not getting any younger!'][(L0.n - 1) % 4], p.x - ux * UNIT * 2, p.y - uy * UNIT * 2 - UNIT * 1.3, { key: 'pip', hold: false, color: '#bfe4ff' });
      p.hop = { t: 0, n: 3 }; } }
    if (L0.phase === 'back') { tx = gx - ux * UNIT * 2.5; ty = gy - uy * UNIT * 2.5; if (Math.hypot(p.x - tx, p.y - ty) < UNIT * 0.6) { L0.phase = null; L0.idle = 0; } }
  }
  const v = p.visit;
  if (v) {                                            // walking over to point something out, then waiting there for you
    [tx, ty] = v.spot || pipBeside(v);
    const there = Math.hypot(p.x - tx, p.y - ty) < UNIT * 0.9;
    if (!v.said && (there || state.time - v.t0 > 2)) {
      v.said = state.time; v.spot = [p.x, p.y];      // this is where Pip stays
      say(v.text, p.x, p.y - UNIT * 1.3, { key: 'pip', color: '#bfe4ff', site: v.site, hold: PIP_HOLD.has(v.key) ? undefined : false, size: PIP_HOLD.has(v.key) ? 1 : 0.9 });
      p.side = v.x > p.x ? 1 : -1;
    }
    if (v.said) {
      const close = Math.hypot(h.x - p.x, h.y - p.y) < UNIT * 2.6;
      const reading = state.texts.some(t => t.hold && t.key === 'pip');
      if (close && state.time - v.said > 0.8 && !reading) { p.visit = null; state.pipTalkT = state.time; }   // you came over and read it: carry on together
      else if (v.key === 'remind' && state.time - v.said > 12) p.visit = null;                          // a reminder doesn't wait forever
      else if (!close && state.time - (v.call || v.said) > 7 && !speakingNow()) {                // still waiting: a nudge now and then
        v.call = state.time; state.pipCalls = (state.pipCalls || 0) + 1; say(['Over here!', 'This way!', 'Come see!', 'Psst! Here!', 'Hey! Over here!'][(state.pipCalls - 1) % 5], p.x, p.y - UNIT * 1.3, { key: 'pip', life: 1.8, color: '#bfe4ff', hold: false });
      }
    }
  }
  const mx = tx - p.x, my = ty - p.y, md = Math.hypot(mx, my);
  if (md > UNIT * ((waiting || garden) && !p.visit ? 0.04 : 0.3)) {   // pottering: small steps count too
    const sp = Math.min(md * 4, L() * sc.speed * (p.visit ? 1.2 : md > UNIT * 5 ? 1.35 : 1.0)) * dt, nx = p.x + mx / md * sp, ny = p.y + my / md * sp;   // walks, never dashes about
    if (!isChasm(nx, ny)) { p.x = nx; p.y = ny; }
    p.side = mx > 0 ? 1 : -1;
  }
  const offRoad = p.lead && (p.lead.phase === 'going' || p.lead.phase === 'away');
  if (!offRoad) { collideSolids(p, UNIT * 0.38); clampTo(p, UNIT * 0.5); }   // (heading off the screen: no clamping)
  if (garden || (waiting && !p.visit)) p.side = h.x > p.x ? 1 : -1;   // waiting up ahead: looking back at you
  p.stuck = md > UNIT * 0.5 && Math.hypot(p.x - (p.lx ?? p.x), p.y - (p.ly ?? p.y)) < 0.5 ? (p.stuck || 0) + dt : 0; p.lx = p.x; p.ly = p.y;
  if (!p.visit && !garden && !offRoad && (p.stuck > 1.5 || Math.hypot(p.x - h.x, p.y - h.y) > UNIT * 14)) placePipNearHero();   // only if truly stuck or lost: no popping in from nowhere
  const home = ['camp', 'start', 'meadow', 'w1', 'w2', 'riverbank', 'f1', 'f2'];
  const gathering = storyAt('gather') && !campDone();
  if (gathering) pipGatherTalk(sc, p);
  else if (!home.includes(sc.id) && !rt.flags.pipOff) { rt.flags.pipOff = true; state.pipTalkT = -9; pipSay('off-' + sc.id, 'The woods are the other way.'); }
  // what Pip explains, once each, as it comes up
  const near = (fx, fy, r) => Math.hypot(h.x - fx * W, h.y - fy * H) < UNIT * r, f = sc.feat, inv = state.inv;
  const P = q => [q[0] * W, q[1] * H], raw = rawOf(), known = inv.known || {};
  // the garden: plant your three seeds in the rich soil, then Pip has a place to show you
  pipRemind(sc, p, h);                                 // no progress for a while: a fresh nudge, from a new spot
  if (sc.id === 'meadow' && inv.story === STORY.garden) {
    const plot = f.plots && f.plots[0], b = state.bird, seeds = inv.bag.turnipseed || 0;
    const nearPip = Math.hypot(h.x - p.x, h.y - p.y) < UNIT * 7;   // Pip stays put and calls things out from the garden
    // Pip opens with the quest's first step (gather seeds), then the garden once you have some. Nothing else first.
    if (!seeds && !(inv.pipTips || {})['garden-open']) pipSay('garden-open', 'My garden! First we need seeds. The robin drops them when you startle it. Run right at it!', null, 7, { x: p.x, y: p.y, r: 14 });
    if (!seeds && b && b.mode === 'perch' && nearPip && (inv.pipTips || {})['garden-open']) pipSay('robin-lesson', 'There it is, on its perch. Go on, give it a scare!');
    if (seeds && plot && nearPip) pipSay('plots', 'I like to sprinkle seeds in this rich dirt. You can grow all kinds of stuff!', null, 7, { x: plot[0] * W, y: plot[1] * H, r: 9 });
    if (!seeds && b && b.mode === 'home') { p.robinHide = (p.robinHide || 0) + 1 / 60; if (p.robinHide > 5) pipSay('stomp', `It's hiding in its tree! Jump and stomp, ${K.jump} then ${K.act}, right by the trunk.`); } else if (b) p.robinHide = 0;
    const atPlots = plot && Math.hypot(h.x - plot[0] * W, h.y - plot[1] * H) < UNIT * 4;          // said at the site, and only while it's the thing in front of you
    if (seeds && inv.firstBirdSeed && atPlots) pipSay('firstseed', 'Stand over here and shove them in the dirt! They love this stuff.', null, 7, { x: plot[0] * W, y: plot[1] * H, r: 6 });
    const planted0 = (rt.flags.plots || []).filter(p => p.s === 1).length;
    if (planted0 === 1 && !seeds) pipSay('again', 'One more! The robin always comes back.');
    const planted = (rt.flags.plots || []).filter(p => p.s === 1).length;
    if (planted >= Math.min(2, f.plots.length)) inv.story = STORY.tocamp;   // the lesson's done, whatever Pip is busy saying
  }
  if (sc.id === 'meadow' && inv.story === STORY.tocamp) {
    if (p.visit && !p.visit.said) p.visit = null;        // drop anything half-said: this is the news
    p.atGarden = false;
    pipSay('tocamp', 'They\'ll grow while we\'re out. Now... I found the most AWESOME spot for a camp. Follow me!');
  }
  if (sc.id === 'camp') {
    const spot = p2 => (f.buildSpots || []).find(b => b.piece === p2);
    if (inv.story === STORY.tocamp) { if (pipSay('tada', 'TA-DA! Best spot in the whole world. I built us a lean-to! It mostly stays up.')) inv.story = STORY.gather; }
    else if (storyAt('gather') && !campDone()) {
      // Pip walks to the next mark still to build and says, in a line, what goes there and what it takes, or that you
      // have it all and how to make it, or where to set it down. What he says changes as you gather and craft.
      const pc = ['fire', 'bench'].find(q => !campBuilt(q)), b = pc && spot(pc);
      if (b) {
        const at = P([b.fx, b.fy]), NAME = { fire: 'fire ring', bench: 'workbench' }, n = k => raw[k] || 0;
        const glueOK = n('glue') >= 1 || n('fluff') >= 2;
        const need = pc === 'fire' ? { 'smooth stone': 2 - n('stone'), stick: 1 - n('stick') } : { stick: 1 - n('stick'), 'fluff': (n('glue') ? 1 : 3) - n('fluff') };
        const miss = Object.entries(need).filter(([, v]) => v > 0).map(([k, v]) => k === 'fluff' ? `${v} tuft${v > 1 ? 's' : ''} of fluff` : `${v} ${k}${v > 1 ? 's' : ''}`);
        let key, line;
        if (n(PIECE_OF[pc]) > 0) { key = 'set'; line = `Set the ${NAME[pc]} down right here!`; }
        else if (!miss.length && !(inv.pipTips || {}).craftLesson) { key = 'have'; line = `Got it all for the ${NAME[pc]}! We'll put it together soon.`; }
        else if (!miss.length && pc === 'bench' && !n('glue')) { key = 'glue'; line = `Glue first: two fluff on the Craft mat (${K.menu.toUpperCase()}).`; }
        else if (!miss.length) { key = 'craft'; line = pc === 'fire' ? `You've got it! Craft: two stones and a stick (${K.menu.toUpperCase()}).` : `You've got it! Craft: a stick, glue and fluff (${K.menu.toUpperCase()}).`; }
        else { key = 'need-' + miss.join(','); line = `${NAME[pc][0].toUpperCase() + NAME[pc].slice(1)} goes here. Still need ${miss.join(' and ')}.`; }
        pipSay('camp-' + pc + '-' + key, line, at, 14, { x: at[0], y: at[1], r: 7 });
      }
      if (Object.keys(inv.pipTips || {}).some(k => k.startsWith('camp-'))) pipSay('tentin', 'My book in the tent explains stuff.', P([0.33, 0.33]), 14);
    } else if (campDone() && !storyAt('adventure') && !state.cut) {
      if (!(inv.pipTips || {}).campdone) {            // the big moment: Pip's line waits for you (F), then the feather, then dusk
        (inv.pipTips = inv.pipTips || {}).campdone = true; p.visit = null;
        say('Home base! We did it! Here, I found this feather. It\'s for you.', p.x, p.y - UNIT * 1.3, { key: 'npc', who: 'pip', color: '#bfe4ff' });
        p.hop = { t: 0, n: 3 };
      }
      if (!gearOwned().includes('feather') && !heldText()) gainGear('feather');
      if (gearOwned().includes('feather') && !heldText() && !(state.title && state.title.style === 'herald')) { if (!p.duskT) p.duskT = state.time; if (state.time - p.duskT > 3) startDusk(); }
    }
    if (campDone() && f.shroom && near(...f.shroom, 4.5)) pipSay('shroom', 'That mushroom hums at night.', P(f.shroom));
  }
  if (inv.acorns > 0 && !storyAt('adventure') && inv.quests && inv.quests.garden && inv.quests.garden.done != null) pipSay('compost', 'Get enough of those acorns, and you can make some awesome compost!');
  if (sc.id === 'tentin' && f.chest) pipSay('chest', 'There are a couple of seeds in the chest, and some acorns. Work acorns into the garden soil and it makes awesome compost!', P(f.chest));
  if (storyAt('gather') && !campDone()) {                // out gathering: Pip spots the good stuff
    const nearIt = t => state.items.find(it => it.type === t && Math.hypot(it.x - h.x, it.y - h.y) < UNIT * 6);
    const st = nearIt('stone'), sk = nearIt('stick'), fl = nearIt('fluff');
    if (sc.id === 'riverbank' && st) pipSay('stones', 'Smooth stones! Nice flat ones.', [st.x, st.y]);
    if (sk) pipSay('sticks', 'Good sticks. Dry ones burn best.', [sk.x, sk.y]);
    const blade = !!bladeKind(), fluffNeed = (campMissing().fluff || 0) > 0;
    if (false) pipSay('sword-first', `Before the rabbits: three sticks make a wooden sword. Craft tab (${K.menu.toUpperCase()})!`);
    if (sc.id === 'f1' && fluffNeed && state.items.some(i => i.type === 'fluff')) pipSay('fluff-wind', 'Fluff blows all over in this wind. Grab it quick!');
    const f1Empty = sc.id === 'f1' && !state.items.some(i => i.type === 'fluff');
    // two tufts in hand: the crafting lesson, one page at a time, Pip waits on you (F each). Not a word of crafting before this.
    if ((raw.fluff || 0) >= 2 && fluffNeed && !(inv.pipTips || {}).craftLesson && !heldText()) {
      (inv.pipTips = inv.pipTips || {}).craftLesson = true; p.visit = null; hearRecipe('woodsword');
      const enough = (raw.stick || 0) >= 3, M = K.menu.toUpperCase(), F = K.act.toUpperCase();
      say(`Two tufts! The bench needs one more. There are rabbits to the south... but they are mean! Time you learned crafting. ` +
        (enough ? `Open your pack: ${M}. Go to the Craft tab. Under Recipes, pick the wooden sword and press ${F}: three sticks go on the mat. Then ${F} on Combine!`
                : `First, three sticks. Get some more back in the glade, then open your pack: ${M}, Craft tab, and make a wooden sword.`),
        p.x, p.y - UNIT * 1.3, { key: 'npc', who: 'pip', color: '#bfe4ff' });
    }
    if (f1Empty && fluffNeed && blade && (inv.pipTips || {}).craftLesson && !(inv.pipTips || {})['and-go']) { p.visit = null; state.pipTalkT = -99; pipSay('and-go', 'And go! South, to the rabbits!'); }
    if (sc.id === 'f2' && fluffNeed && !blade) pipSay('rabbit-sword', 'Rabbits have plenty of fluff. They won\'t hand it over! Make a wooden sword first.');
    if (sc.id === 'f2' && fluffNeed && blade) pipSay('rabbit-go', 'Rabbit! Get that fluff straight from the source!', state.enemies.find(e => e.type === 'rabbit') ? [state.enemies.find(e => e.type === 'rabbit').x, state.enemies.find(e => e.type === 'rabbit').y] : null, 12);
    if (fl) pipSay('fluff', 'Rabbit fluff! Don\'t ask the rabbits. They won\'t tell you.', [fl.x, fl.y]);
    if (false && pipSay('woodsword', `Three sticks lashed together make a sword! Well, a wooden one. It won't last long, but it's a start. (${K.menu.toUpperCase()}, Craft)`)) hearRecipe('woodsword');
    if (sc.id !== 'camp' && Object.keys(inv.pipTips || {}).some(k => k.startsWith('camp-'))) pipSay('pound', 'Try pounding around in different places. You never know what you might knock loose!');
    if (false) pipSay('craft2', `Two bits of fluff make rabbit glue. Open your pack, ${K.menu}, Craft tab!`);
    if (false) pipSay('craft3', 'Two stones and a stick make a fire ring!');
  }
  if (sc.id === 'start' && storyAt('adventure')) {
    const rock = sc.pullables.find(r => r.id === 'rock'), loose = rock && rt.pulled.has(rock.id);
    if (!rt.flags.thicket) {
      const thicket = [W * 0.955, H * 0.5];
      pipSay('brambles', 'The blank part of the map is past these brambles. We need something heavy.', thicket, 14);
      const told = (state.inv.pipTips || {}).brambles;
      if (told && rock && !loose && !state.carry && near(rock.fx, rock.fy, 5)) pipSay('pull', rt.flags.knocked_rock ? 'It moved! Rock it back and forth!' : 'This rock\'s stuck fast. Jump and stomp right next to it!', [rock.fx * W, rock.fy * H]);
      if (state.carry) pipSay('throw', 'Throw it at the brambles!', thicket);
    } else {
      pipSay('smashed', 'Ha! The woods are east.', [W * 0.93, H * 0.5]);
      const tree = state.solids.filter(s => s.kind === 'tree').sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
      if (tree) pipSay('jump', 'Stomp by a tree for acorns.', [tree.x, tree.y]);
    }
  }
  if (sc.id === 'meadow' && state.bird && storyAt('tocamp')) pipSay('robin', 'Startle that robin for a seed.', [state.bird.x, state.bird.y + UNIT]);
  if (sc.id === 'w1') {
    const ks = sc.solids.find(s => s.bar === 'crack1' && s.kind === 'cracked'), kA = sc.solids.find(s => s.bar === 'knockA');
    if (!broken('w1', 'crack1')) {
      if (kA && !broken('w1', 'knockA') && !broken('w1', 'knockB')) pipSay('practice', 'See the cracked stones? Practise on those. Heave a rock and let it fly!', [kA.fx * W, kA.fy * H]);
      if (ks) pipSay('gate', 'Those boulders are wedged on a cracked stone. Throw a rock at it. Mind the mud: a short throw sinks.', [ks.fx * W, ks.fy * H], 12);
    } else pipSay('opened', 'CRASH! Onward!');
    pipSay('map-w1', 'Drawing the woods in... boulders, mud, a very suspicious tree.');
  }
  if (sc.id === 'start' && storyAt('adventure')) pipSay('map-start', 'Glade: big rock, brambles. On the map!');
  if (sc.id === 'w2') {
    const ks = sc.solids.find(s => s.bar === 'crack2' && s.kind === 'cracked');
    pipSay('map-w2', 'Last blank corner of the map! Past these boulders, and it\'s done.');
    if (!broken('w2', 'crack2')) pipSay('ring', 'That cracked stone is holding the whole pile up. It sits in a mud wallow: hit it square, or you\'ll be digging your rock out!', ks ? [ks.fx * W, ks.fy * H] : null);
    else if (!state.cut) startAbduct();              // the boulders tumble, and they were waiting
  }
}
