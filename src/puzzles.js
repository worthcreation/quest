// ===== puzzles.js: ?puzzle mode: the puzzle hub and runs.

// =====================================================================
// Puzzle test mode: index.html?puzzle. A hub of portal stones, one per puzzle in the real world.
// Each portal drops you into that puzzle, reset, with enemies cleared; solving it records your time.
// =====================================================================
var PUZZLE = typeof location !== 'undefined' && /(^|[?&])puzzle(=|&|$)/.test(location.search);
const PUZZLES = [
  { id: 'thicket', name: 'Glade brambles', scene: 'start', at: [0.2, 0.5], solved: () => broken('start', 'thicket') },
  { id: 'gate', name: 'Knock the prop', scene: 'w1', at: [0.06, 0.5], solved: () => broken('w1', 'crack1') },
  { id: 'ring', name: 'Mud wallow', scene: 'w2', at: [0.06, 0.5], solved: () => broken('w2', 'crack2') },
  { id: 'sword', name: 'Sword clearing', scene: 'w3', at: [0.06, 0.5], solved: () => !!state.inv.sword },
  { id: 'gusts', name: 'Wind ravines', scene: 'f3', at: [0.5, 0.06], solved: () => state.scene === 'f4' },
  { id: 'strong', name: 'Chained rides', scene: 'f5', at: [0.5, 0.06], solved: () => state.scene === 'f6' },
  { id: 'crags', name: 'The crags', scene: 'peak1', at: [0.06, 0.5], solved: () => state.scene === 'peak3' },
  { id: 'ford', name: 'Stepping stones', scene: 'ford', at: [0.5, 0.95], solved: () => state.scene === 'farbank' || (state.scene === 'ford' && state.hero.y < H * (0.5 - WORLD.ford.river.wH / 2)) },
  { id: 'rapids', name: 'Rapids', scene: 'rapids', raft: true, solved: () => state.scene === 'gleampool' },
  { id: 'reeds', name: 'Marsh reeds', scene: 'm3', at: [0.06, 0.5], fire: true, solved: () => broken('m3', 'reeds') },
  { id: 'webs', name: 'Web wall', scene: 'h2', at: [0.06, 0.5], fire: true, solved: () => broken('h2', 'webs') },
];
function puzzleRecords() { try { return JSON.parse(localStorage.getItem('quest-puzzles') || '{}'); } catch (e) { return {}; } }
function savePuzzleRecords(r) { try { localStorage.setItem('quest-puzzles', JSON.stringify(r)); } catch (e) {} }
function genPuzzleHub(seed) {
  const saved = [W, H, UNIT];
  W = GEN.W; H = GEN.H; computeUnit();
  try {
    const hub = newScene({ id: 'puzzlehub', area: 'forest', msg: '', music: 'forest', amb: 'none', floor: '#4f9a52', heroStart: [0.5, 0.88] });
    for (const side of ['n', 'w', 'e', 's']) edgeWall(hub, side, side === 'n' || side === 's' ? 'tree' : 'boulder', 1.1, [], 1.4, 'green');
    hub.feat.portals = PUZZLES.map((p, i) => ({ pid: p.id, fx: 0.12 + (i % 6) * 0.152, fy: i < 6 ? 0.32 : 0.62 }));
    hub.feat.portals.forEach(p => claim(hub, p.fx, p.fy, 1.4));
    decoFlowers(hub, 40);
    return hub;
  } finally { [W, H, UNIT] = saved; }
}
function startPuzzleHub() {
  state.cut = null; state.night = 0; state.rain = 0; state.puzzle = null;
  enterScene('puzzlehub');
  showTitle('Puzzles', 'step up to a stone and enter', 'area', 2.5);
}
function enterPuzzle(p) {
  const inv = state.inv;
  for (const id of [p.scene, 'f4', 'f6', 'farbank', 'gleampool', 'h1', 'h3']) delete RT[id];
  state.carry = null; state.aim.on = false;
  Object.assign(inv, { sword: false, fire: !!p.fire, raft: p.raft ? 2 : 0, tunnel: false });
  state.hero.vig = maxVig();
  state.puzzle = { p, t0: null, solved: false, tries: 0 };
  const recs = puzzleRecords(); (recs[p.id] = recs[p.id] || { tries: 0, solves: 0 }).tries++; savePuzzleRecords(recs);
  if (p.raft) { const [ax, ay] = dockLanding(); enterScene('riverbank', ax, ay); startRaftRide(); }
  else transitionTo(p.scene, p.at[0], p.at[1], true);
}
function updatePuzzle(dt) {
  const pz = state.puzzle;
  if (!pz || pz.solved) return;
  if (pz.t0 == null && state.scene !== 'puzzlehub') { pz.t0 = state.time; state.enemies = []; }   // the clock starts on arrival, no monsters
  if (pz.t0 != null && pz.p.solved()) {
    pz.solved = true;
    const t = state.time - pz.t0, recs = puzzleRecords(), r = recs[pz.p.id] || (recs[pz.p.id] = { tries: 0, solves: 0 });
    r.solves++; const best = !r.best || t < r.best; if (best) r.best = +t.toFixed(1); savePuzzleRecords(recs);
    sfx.victory();
    showTitle('Solved', `${pz.p.name} in ${t.toFixed(1)}s${best ? ', a new best' : ''}`, 'relic', 3.5);
    setTimeout(() => { if (state.puzzle === pz) transitionTo('puzzlehub', 0.5, 0.88); }, 4200);
  }
}
function drawPuzzlePortals(sc) {
  const recs = puzzleRecords();
  for (const q of sc.feat.portals || []) {
    const zone = q.pid.startsWith('zone:') ? ARENA_ZONES[q.pid.slice(5)] : null;
    const p = zone ? { id: q.pid, name: zone.name } : PUZZLES.find(o => o.id === q.pid), r = recs[p.id] || {}, x = q.fx * W, y = q.fy * H, u = UNIT, t = state.time;
    groundShadow(x, y, u * 0.9, u * 0.35, 0, { a: 0.2, dy: u * 0.35 });
    ctx.fillStyle = r.solves || r.clears ? '#b8d8a0' : '#b0aaa0'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.85, u * 0.5, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = `rgba(160,220,255,${0.5 + 0.3 * Math.sin(t * 3 + q.fx * 9)})`; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = `bold ${Math.round(Math.max(12, u * 0.36))}px "Courier New", monospace`; ctx.textAlign = 'center';
    ctx.fillStyle = '#fdf6e3'; ctx.fillText(p.name, x, y - u * 0.9);
    ctx.fillStyle = r.best ? '#ffe38a' : 'rgba(253,246,227,.55)';
    ctx.fillText(zone ? (r.clears ? `cleared ${r.clears}x` : 'five waves') : r.best ? `best ${r.best}s \u00b7 ${r.solves}/${r.tries}` : r.tries ? `0/${r.tries}` : 'untried', x, y + u * 1.2);
    ctx.textAlign = 'left';
  }
}
