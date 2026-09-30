// ===== quests.js: QUESTS, steps, tracking, the quest HUD, the quest log.
const storyAt = k => (state.inv.story || 0) >= STORY[k];
// ---------------- the quest log ----------------
// Each quest is a short chain of steps. A step is done the first time its test passes (after the step before it),
// and that moment goes into inv.qlog. The Quests tab shows what's current, newest quest first, and a folded log
// underneath, newest first. Story beats elsewhere stay the source of truth; this only watches them.
const plantedIn = id => ((rtFor(id).flags.plots) || []).filter(p => p.s === 1).length;
// what each quest amounts to, said in the banner when it's done
const QUEST_DID = {
  garden: 'Seeds in the ground, and your first turnip pulled.',
  camp: 'A fire ring, a bench and a lean-to: home base.',
  pip: 'Pip is safe, and the tunnels know your name.',
  beans: 'The toad is fed, and grateful.',
  journal: 'Every map Pip ever drew, back where it belongs.',
  raft: 'Down the river and on to new water.',
  shrooms: 'The mushrooms will carry you now.',
};
const QUESTS = [
  { id: 'garden', name: 'Pip\'s garden', icon: 'turnipseed', start: () => storyAt('garden'), steps: [
    { id: 'seeds', name: 'Gather seeds', line: () => 'Run at the robin in the meadow. It drops turnip seeds.', done: () => (state.inv.bag.turnipseed || 0) > 0 || plantedIn('meadow') > 0 || storyAt('tocamp') },
    { id: 'plant', name: 'Plant seeds', line: () => `Stand on Pip's rich soil and press ${K.act}. ${Math.min(2, plantedIn('meadow'))} of 2 planted.`, done: () => storyAt('tocamp') },
    { id: 'later', name: 'Harvest a turnip', line: () => 'They grow while you are out. Come back to the meadow and pull one up.', done: () => (state.inv.harvests || 0) > 0 || Object.keys(state.inv.cropXp || {}).length > 0 },
  ], reward: () => {                                   // Pip's thank-you: a taste of each low vegetable, and carrot seeds to try
    const inv = state.inv; inv.food.push('turnip'); inv.food.push('carrot'); inv.bag.carrotseed = (inv.bag.carrotseed || 0) + 1;
    sfx.pickup(); sayHero('From Pip: a turnip, a carrot and some carrot seeds. Turnips mend you slowly; carrots, right away. Mash the two together sometime!', { key: 'reward', life: 6, color: '#b8f28a' });
    hearRecipe('mash');
    refreshButtons();
  } },
  { id: 'camp', name: 'Set up camp', icon: 'firering', start: () => storyAt('tocamp'), steps: [
    { id: 'follow', name: 'Follow Pip to the camp spot', line: () => 'North of the glade. Pip knows the way.', done: () => storyAt('gather') },
    { id: 'gather', name: 'Gather for the camp', line: () => { const c = campHave(); return `Smooth stones ${Math.min(5, c.stone)}/5, sticks ${Math.min(6, c.stick)}/6, rabbit fluff ${Math.min(4, c.fluff)}/4.`; }, done: () => { const c = campHave(); return c.stone >= 5 && c.stick >= 6 && c.fluff >= 4; } },
    { id: 'fire', name: 'Build the fire ring', line: () => `Set ${CAMP_PARTS.fire.stones} smooth stones in the ring (${campParts().stones} so far), then tinder: two sticks on the mat.`, done: () => campBuilt('fire') },
    { id: 'bench', name: 'Build the bench', line: () => `Two frames (${campParts().frames} set): each two sticks and rabbit glue, made on the mat.`, done: () => campBuilt('bench') },
  ] },
  { id: 'pip', name: 'Find Pip', icon: 'heart', start: () => state.inv.pipTaken || state.inv.pipSaved, steps: [
    { id: 'rescue', name: 'Find Pip', line: () => 'The gremlins ran off with Pip, deeper into the dark woods.', done: () => state.inv.pipSaved },
  ] },
  { id: 'beans', name: 'The toad\'s beans', icon: 'bean', start: () => rtFor('m2').flags.metToad || state.inv.beans || state.inv.fire, steps: [
    { id: 'beans', name: 'Bring the toad beans', line: () => `${state.inv.beans || 0} of ${BEANS} beans.`, done: () => !!state.inv.fire },
  ] },
  { id: 'journal', name: 'The stolen journal', icon: 'journal', start: () => state.inv.journal, steps: [
    { id: 'pages', name: 'Get the journal back', line: () => `Pages: ${state.inv.pages}. The thief runs toward the woods.`, done: () => state.inv.journal >= 3 },
  ] },
  { id: 'raft', name: 'Downriver', icon: 'driftwood', start: () => state.inv.raft, steps: [
    { id: 'build', name: 'Build a raft', line: () => `Driftwood ${state.inv.mats.driftwood}/4, thorns ${state.inv.mats.thorn}/2.`, done: () => state.inv.raft >= 2 },
    { id: 'ride', name: 'Ride it downriver', line: () => 'The raft waits at the jetty.', done: () => state.inv.raft >= 3 },
  ] },
  { id: 'shrooms', name: 'Traveler\'s mushrooms', icon: 'spores', start: () => state.inv.pipSaved || Object.keys(state.inv.shrooms).length > 0, steps: [
    { id: 'all', name: 'Find the traveler\'s mushrooms', line: () => `${Object.keys(state.inv.shrooms).length} of 6 found.`, done: () => Object.keys(state.inv.shrooms).length >= 6 },
  ] },
];
const QUEST_COLOR = '#ffe38a';
// runs a few times a second; quiet right after a load or a new game, so an old save's progress is filed without fanfare
function updateQuests(force) {
  if (ARENA || PUZZLE || !state.inv) return;
  if (!force && state.time - (state.questT || -9) < 0.25) return;
  state.questT = state.time;
  const inv = state.inv, qs = inv.quests || (inv.quests = {}), log = inv.qlog || (inv.qlog = []), quiet = !!state.questQuiet;
  state.questQuiet = false;
  const t = quiet && !log.length ? null : Math.floor(state.playTime || 0);
  for (const q of QUESTS) {
    let s = qs[q.id];
    const pulse = state.qPulse || (state.qPulse = {});
    if (!s) { if (!q.start()) continue; s = qs[q.id] = { at: t, step: 0 }; trackQuest(q.id, true); if (!quiet) { showTitle(q.name, 'a new quest', 'herald', 3.6); pulse[q.id] = state.time; } }   // a new quest: grand, and gone again on its own
    while (s.step < q.steps.length && q.steps[s.step].done()) {
      log.push({ q: q.id, s: q.steps[s.step].id, t });
      s.step++;
      if (!quiet) pulse[q.id] = state.time;              // a milestone: the HUD row lights up, then fades back
      if (s.step >= q.steps.length) { s.done = t; if (!quiet) { const tt = { text: q.name, sub: 'quest complete', style: 'herald', t: 0, life: 4.6, at: state.time, hold: false, note: QUEST_DID[q.id] || '' }; if (speakingNow()) (state.titleQ = state.titleQ || []).push(tt); else state.title = tt; sfx.fanfare(); if (q.reward) q.reward(); if (tracked(q.id)) (state.qDone = state.qDone || []).push({ q, t: state.time }); } }
    }
  }
}
// tracking: a quest marked active on the Quests tab shows on the quest HUD. New quests start tracked.
function tracked(id) { const t = state.inv.qtrack; return t ? !!t[id] : true; }
function trackQuest(id, on) { const t = state.inv.qtrack || (state.inv.qtrack = {}); if (on) t[id] = true; else delete t[id]; }
// what the HUD shows: tracked quests still under way, newest first
function trackedView() { return questView().cur.filter(c => tracked(c.q.id)); }
// the quest HUD: top right, small, out of the way. Mostly a light, see-through note; when a quest starts, moves on
// a step or finishes, its row flares bold and bright for a few seconds, then fades back to that light note.
// A finished quest stays a moment, ticked, then goes. Text keeps clear of it.
const Q_BRIGHT = 3.5, Q_FADE = 2.5, Q_DONE = 6;
function questGlow(t) { const a = state.time - t; return t == null || a < 0 ? 0 : a < Q_BRIGHT ? 1 : Math.max(0, 1 - (a - Q_BRIGHT) / Q_FADE); }
function drawQuestHud() {
  state.questHudRect = null;
  if (ARENA || PUZZLE || !state.started || state.menu || state.won || (state.intro && !state.intro.gone)) return;
  const pulse = state.qPulse || {}, done = (state.qDone = (state.qDone || []).filter(d => state.time - d.t < Q_DONE));
  const rows = trackedView().slice(0, 3).map(c => ({ icon: c.q.icon, name: c.step.name, line: c.step.line(), glow: questGlow(pulse[c.q.id]), done: false, t: pulse[c.q.id] }));
  for (const d of done) rows.unshift({ icon: d.q.icon, name: `${d.q.name} complete`, line: '', glow: questGlow(d.t), done: true, fade: Math.min(1, (Q_DONE - (state.time - d.t)) / 1.5), t: d.t });
  if (!rows.length) return;
  const fs = Math.round(Math.max(11, Math.min(15, UNIT * 0.4))), lh = fs * 1.25, pad = 8, icon = fs * 1.5;
  const wmax = Math.min(W * 0.34, 300), right = W - 12, top = 12;   // fixed in the corner; it's the background layer, everything else draws over it
  ctx.save(); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  let wmin = 0;
  for (const r of rows) {
    ctx.font = `bold ${fs}px Georgia, serif`; const nw = ctx.measureText(r.name).width;
    ctx.font = `${Math.round(fs * 0.85)}px "Courier New", monospace`; r.lines = r.line ? wrap(r.line, wmax - icon - pad * 2) : [];
    wmin = Math.max(wmin, Math.min(wmax + pad, Math.max(nw, ...r.lines.map(l => ctx.measureText(l).width), 0) + icon + pad * 3));
  }
  const bw = wmin, bx = right - bw;
  let y = top;
  for (const r of rows) {
    const g = r.glow, base = r.done ? r.fade : 1, bh = lh + r.lines.length * lh * 0.9 + pad * 1.4;
    const pop = g > 0 && state.time - r.t < 0.35 ? 1 + 0.06 * Math.sin((state.time - r.t) / 0.35 * Math.PI) : 1;
    ctx.save(); ctx.globalAlpha = base; ctx.translate(right, y + bh / 2); ctx.scale(pop, pop); ctx.translate(-right, -(y + bh / 2));
    ctx.fillStyle = `rgba(10,8,14,${0.14 + 0.5 * g})`; rounded(bx, y, bw, bh, 7); ctx.fill();
    if (g > 0) { ctx.shadowColor = r.done ? '#b8f28a' : '#ffcf5a'; ctx.shadowBlur = 14 * g; ctx.strokeStyle = r.done ? `rgba(184,242,138,${0.9 * g})` : `rgba(255,207,90,${0.9 * g})`; ctx.lineWidth = 1 + 1.5 * g; ctx.stroke(); ctx.shadowBlur = 0; }
    ctx.globalAlpha = base * (0.38 + 0.62 * g);                        // light and see-through, unless it just happened
    drawItemIcon(r.icon, bx + pad + icon * 0.5, y + bh / 2, icon);
    ctx.fillStyle = r.done ? '#b8f28a' : QUEST_COLOR; ctx.font = `bold ${fs}px Georgia, serif`; ctx.fillText(r.name, right - pad, y + pad * 0.6 + fs);
    ctx.fillStyle = '#fdf6e3'; ctx.font = `${Math.round(fs * 0.85)}px "Courier New", monospace`;
    r.lines.forEach((l, i) => ctx.fillText(l, right - pad, y + pad * 0.6 + fs + lh * 0.9 * (i + 1)));
    ctx.restore();
    y += bh + 4;
  }
  ctx.restore(); ctx.textAlign = 'left';
  state.questHudRect = { x: bx - 4, y: top - 4, w: bw + 16, h: y - top + 4 };
}
// what the tab shows: current objectives (newest quest first) and the log (newest first)
function questView() {
  updateQuests(true);
  const inv = state.inv, qs = inv.quests || {}, cur = [];
  for (const q of QUESTS) { const s = qs[q.id]; if (s && s.step < q.steps.length) cur.push({ q, s, step: q.steps[s.step] }); }
  cur.sort((a, b) => (b.s.at ?? -1) - (a.s.at ?? -1) || QUESTS.indexOf(b.q) - QUESTS.indexOf(a.q));
  const log = (inv.qlog || []).map((e, i) => { const q = QUESTS.find(x => x.id === e.q), st = q && q.steps.find(x => x.id === e.s); return q && st ? { q, st, t: e.t, i, last: st === q.steps[q.steps.length - 1] } : null; }).filter(Boolean).reverse();
  return { cur, log };
}
const clock = t => t == null ? '' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
