// ===== highlands.js: The High Reaches, above the old summit. Vantage ledges looking down on the valley, a crossing,
// then above the clouds where the mountain worms breathe. Crystal-statue insects, mountain hawks that dive and grab,
// the red crystal beetle who (reluctantly) comes along, and the worms who will one day teach you to move the ground.

// ---------- the world: three screens north of the summit (peak3) ----------
function genHighlands(S, add) {
  const HR = [
    { id: 'hr1', msg: 'The Windy Ledge. The whole valley, far below.', vista: 'e', drop: [0.74, 0, 1, 1], statues: 3, insects: 2, hawks: 0 },
    { id: 'hr2', msg: 'The Crossing. Keep to the ridge.', vista: 'both', drop: null, ridge: true, statues: 4, insects: 1, hawks: 2, beetle: true },
    { id: 'hr3', msg: 'Above the Clouds', vista: 'clouds', drop: [0, 0, 0.18, 1], statues: 2, insects: 0, hawks: 1, worms: true },
  ];
  HR.forEach((C, k) => {
    const sc = add(newScene({ id: C.id, area: 'high', depth: 11 + k, msg: C.msg, music: 'field', amb: 'wind', floor: k === 2 ? '#a9a4a8' : '#948e88', speed: 0.42, accel: 8, chasms: [] }));
    sc.region = 'high'; sc.vista = C.vista;
    sc.exits = [{ side: 's', a: k ? 0.42 : 0.08, b: k ? 0.58 : 0.24, to: k ? HR[k - 1].id : 'peak3' }];   // hr1 is a diagonal step up from the old summit: you come in at its bottom-left
    if (k < HR.length - 1) sc.exits.push({ side: 'n', a: 0.42, b: 0.58, to: HR[k + 1].id });
    else sc.exits.push({ side: 'n', a: 0.42, b: 0.58, to: 'hrtop', locked: () => true });            // the peak: nothing has gone up and come back
    sc.gusts = [{ a: Math.PI / 2 * (k % 2 ? 1 : -1), s: 1 }, { a: 0, s: 0.6 }];
    // the drops: where the ledge ends and the view begins (fall = back down, a little hurt)
    if (C.drop) sc.chasms.push(C.drop);
    if (C.ridge) { sc.chasms.push([0, 0.22, 0.36, 0.78], [0.64, 0.22, 1, 0.78]); }                     // a ridge crossing with sky on both sides
    for (const side of ['n', 's', 'w', 'e']) {
      const ex = sc.exits.find(e => e.side === side);
      if ((C.vista === 'e' && side === 'e') || (C.vista === 'clouds' && side === 'w')) continue;          // no wall where the view is
      if (C.ridge && (side === 'w' || side === 'e')) continue;
      edgeWall(sc, side, 'cliff', 1.1, ex ? [[ex.a, ex.b]] : [], 1.3);
    }
    const inDrop = (x, y) => sc.chasms.some(([x0, y0, x1, y1]) => x > x0 - 0.05 && x < x1 + 0.05 && y > y0 - 0.05 && y < y1 + 0.05);
    const spot = r => { for (let t = 0; t < 40; t++) { const q = freeSpot(sc, [0.12, 0.88, 0.14, 0.86], r); if (!inDrop(q[0], q[1])) return q; } return null; };
    for (let t = 0; t < 4 + k; t++) { const q = spot(1.2); if (q) sc.solids.push(solid(q[0], q[1], rr(0.6, 1.1), 'boulder', null, { craggy: true })); }
    // crystal insects, grand or tormented, still for hundreds of years
    for (let t = 0; t < C.statues; t++) { const q = spot(1.6); if (q) sc.solids.push(solid(q[0], q[1], rr(0.8, 1.4), 'crystalbug', null, { form: rng() < 0.4 ? 'tormented' : 'grand', ph: rng() * 6, twitch: rng() < 0.35 })); }
    for (let t = 0; t < C.insects; t++) { const q = spot(1); if (q) sc.spawns.push({ type: 'mantis', fx: q[0], fy: q[1] }); }
    for (let t = 0; t < C.hawks; t++) sc.spawns.push({ type: 'hawk', fx: 0.3 + t * 0.4, fy: 0.3 });
    if (C.beetle) { const q = spot(1.4) || [0.5, 0.2]; sc.feat.beetle = q; claim(sc, q[0], q[1], 1.2); }
    if (C.worms) {                                                  // breathing tubes above the clouds, and one worm who talks
      sc.feat.snorkels = []; for (let t = 0; t < 7; t++) { const q = spot(0.8); if (q) { sc.feat.snorkels.push([q[0], q[1], rr(0.5, 1.1), rng() * 6]); claim(sc, q[0], q[1], 0.7); } }
      sc.feat.tunnels = []; for (let t = 0; t < 5; t++) { const q = spot(0.6); if (q) sc.feat.tunnels.push([q[0], q[1], rr(0.25, 0.6)]); }
      npc(sc, { kind: 'worm', fx: 0.62, fy: 0.3 });
    }
    for (let t = 0; t < 10; t++) { const fx = rng(), fy = rng(); if (!inDrop(fx, fy)) sc.deco.push({ kind: 'tuft', fx, fy, s: rr(0.4, 0.8), ph: rng() * 6 }); }
    sc.rocks = [];
  });
}

// ---------- what lives up here ----------
function makeHighCritter(type, b, u) {
  if (type === 'hawk') return { ...b, r: u * 0.55, hp: 3, dmg: 1, mode: 'circle', t: rr(2, 4), fly: true, ang: rng() * 6, cx: b.x, cy: b.y };
  if (type === 'mantis') return { ...b, r: u * 0.7, hp: 4, dmg: 1, mode: 'idle', t: 1 };
  return null;
}
// the hawk: circles high, its shadow on the ground; then a dive (the shadow shrinks to a dot, a shriek); it strikes you
// and knocks you back, or sometimes grabs you, carries you off and drops you (over a drop: you land a screen lower)
function hawkAI(e, dt) {
  const h = state.hero;
  e.t -= dt;
  if (e.mode === 'circle') {
    e.ang += dt * 0.6; e.cx += (h.x - e.cx) * dt * 0.3; e.cy += (h.y - e.cy) * dt * 0.3;
    e.x = e.cx + Math.cos(e.ang) * UNIT * 3; e.y = e.cy + Math.sin(e.ang) * UNIT * 2; e.alt = UNIT * 3;
    if (e.t <= 0 && !state.grab) { e.mode = 'dive'; e.t = 0.9; e.tx = h.x; e.ty = h.y; e.x0 = e.x; e.y0 = e.y; sfx.shriek ? sfx.shriek() : sfx.cackle(); }
  } else if (e.mode === 'dive') {
    const k = 1 - Math.max(0, e.t) / 0.9; e.x = e.x0 + (e.tx - e.x0) * k; e.y = e.y0 + (e.ty - e.y0) * k; e.alt = UNIT * 3 * (1 - k);
    if (e.t <= 0) {
      if (Math.hypot(h.x - e.x, h.y - e.y) < UNIT * 0.9 && h.z <= UNIT * 0.3 && !(h.invuln > 0)) {
        if (Math.random() < 0.35) { state.grab = { e, t: 0, dur: 1.6, dx: (Math.random() - 0.5) * 2, dy: (Math.random() - 0.5) * 2 }; say('Talons!', h.x, h.y - UNIT * 1.2, { key: 'hurt', life: 1.2, color: '#ffb080' }); }
        else { const d = Math.hypot(h.x - e.x0, h.y - e.y0) || 1; hurtHero(1, (h.x - e.x0) / d, (h.y - e.y0) / d); }
      }
      e.mode = 'climb'; e.t = 1.2;
    }
  } else if (e.mode === 'climb') { e.alt = Math.min(UNIT * 3, (e.alt || 0) + UNIT * 3 * dt); e.cx = e.x; e.cy = e.y; if (e.t <= 0) { e.mode = 'circle'; e.t = rr(3, 6); } }
  else if (e.mode === 'carry') { e.alt = UNIT * 1.6; }
}
function updateGrab(dt) {
  const g = state.grab, h = state.hero; if (!g) return false;
  g.t += dt; const e = g.e; e.mode = 'carry';
  const k = g.t / g.dur; h.x += g.dx * UNIT * 2.6 * dt; h.y += g.dy * UNIT * 2.6 * dt - UNIT * 0.2 * dt; h.z = UNIT * 1.4 * Math.sin(Math.min(1, k) * Math.PI * 0.9);
  h.x = Math.max(UNIT, Math.min(W - UNIT, h.x)); h.y = Math.max(UNIT, Math.min(H - UNIT, h.y)); e.x = h.x; e.y = h.y - UNIT * 0.6;
  if (pressedNow.act && g.t > 0.3) g.t = g.dur;                   // strike the legs: it lets go early
  if (g.t >= g.dur) {
    state.grab = null; e.mode = 'climb'; e.t = 1.5; h.z = 0;
    if (isChasm(h.x, h.y)) {                                       // dropped over the edge: down a screen, hurt
      const sc = sceneDef(), down = (sc.exits.find(x => x.side === 's') || {}).to;
      hurtHero(1, 0, 1); if (down) { say('Dropped! Down the mountain...', h.x, h.y - UNIT, { key: 'fall', life: 2 }); transitionTo(down, 0.5, 0.2); }
    } else { hurtHero(1, 0, 1); say('Dropped!', h.x, h.y - UNIT, { key: 'hurt', life: 1.2, color: '#ffb080' }); }
  }
  return true;
}
function mantisAI(e, dx, dy, dist, ease) {                        // a big mountain mantis: stalks, rears up, lunges
  if (e.mode === 'idle') { ease(0, 0, 4); if (dist < UNIT * 5) { e.mode = 'stalk'; e.t = 1.5; } }
  else if (e.mode === 'stalk') { ease(dx / dist * UNIT * 1.4, dy / dist * UNIT * 1.4, 3); if (e.t <= 0 && dist < UNIT * 2.6) { e.mode = 'rear'; e.t = 0.5; } else if (e.t <= 0) e.t = 1.2; }
  else if (e.mode === 'rear') { ease(0, 0, 10); if (e.t <= 0) { e.mode = 'lunge'; e.t = 0.35; e.vx = dx / dist * UNIT * 9; e.vy = dy / dist * UNIT * 9; } }
  else if (e.mode === 'lunge') { if (e.t <= 0) { e.mode = 'stalk'; e.t = 1.4; } }
}

// ---------- the red crystal beetle ----------
// Found on the Crossing. It doesn't want to come; it comes anyway, riding on you and clambering about. Near crystal
// or out in the wind it hums and gives back a little vigor; when you're low it will shove one of your snacks at you.
function interactBeetle(sc, h) {
  const b = sc.feat.beetle; if (!b || state.inv.beetle) return;
  const x = b[0] * W, y = b[1] * H; if (Math.hypot(h.x - x, h.y - y) > UNIT * 1.6 || !pressedNow.act) return;
  state.inv.beetle = { t: 0 };
  say('A tiny red beetle, glittering like cut glass. It clicks at you. Unimpressed. You hold out a hand. It looks at the hand. It looks at you. Then it climbs aboard anyway, muttering all the way up to your shoulder.', x, y - UNIT * 1.2, { key: 'npc', color: '#ff9aa6' });
  showScroll('A red crystal beetle', 'It rides along now, whether it likes it or not.'); return true;
}
function updateBeetle(dt) {
  const B = state.inv.beetle, h = state.hero; if (!B || !h) return;
  B.t = (B.t || 0) + dt; B.feedCd = Math.max(0, (B.feedCd || 0) - dt);
  const mv = maxVig(), sc = sceneDef();
  const nearCrystal = state.solids.some(s => s.kind === 'crystalbug' && Math.hypot(s.x - h.x, s.y - h.y) < UNIT * 3);
  const windy = sc.gusts && (state.gustPhase === 'blow' || state.gustPhase === 'gentle');
  if ((nearCrystal || windy) && h.vig < mv) { h.vig = Math.min(mv, h.vig + 0.25 * dt); if (Math.random() < dt * 3) state.fx.push({ x: h.x + (Math.random() - 0.5) * UNIT, y: h.y - UNIT * 0.6, vx: 0, vy: -UNIT * 0.8, t: 0, life: 0.6, color: '#ff6a7a', size: UNIT * 0.06 }); }
  if (h.vig < mv * 0.3 && B.feedCd <= 0 && state.inv.food.length) {                           // low? it helps itself to your pack, on your behalf
    const f = state.inv.food[0]; B.feedCd = 30; eatFood(f, true);
    notice(`The beetle shoves a ${foodName ? foodName(f) : f} at you.`, '#ff9aa6');
  }
}
function drawBeetleOnHero(x, top, pw, ph) {
  if (!state.inv.beetle) return;
  const t = state.time, a = t * 0.7, bx = x + Math.cos(a) * pw * 0.45, by = top + ph * 0.3 + Math.sin(a * 1.3) * ph * 0.25, u = UNIT;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.cos(a) * 0.6);
  ctx.fillStyle = '#c0203a'; ctx.beginPath(); ctx.ellipse(0, 0, u * 0.11, u * 0.08, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = 'rgba(255,190,200,.8)'; ctx.beginPath(); ctx.moveTo(-u * 0.05, -u * 0.05); ctx.lineTo(u * 0.02, -u * 0.07); ctx.lineTo(0, 0); ctx.fill();   // a glint on the crystal shell
  ctx.strokeStyle = '#401018'; ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(u * 0.08, s * u * 0.04); ctx.lineTo(u * 0.14, s * u * 0.08); ctx.stroke(); }
  ctx.restore();
}
function drawBeetleWaiting(sc) {
  const b = sc.feat.beetle; if (!b || state.inv.beetle) return;
  const x = b[0] * W, y = b[1] * H, u = UNIT, bob = Math.sin(state.time * 3) * u * 0.03;
  ctx.fillStyle = 'rgba(255,80,100,.18)'; ctx.beginPath(); ctx.arc(x, y, u * 0.5, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#c0203a'; ctx.beginPath(); ctx.ellipse(x, y + bob, u * 0.16, u * 0.11, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,210,.9)'; ctx.beginPath(); ctx.moveTo(x - u * 0.07, y - u * 0.06 + bob); ctx.lineTo(x + u * 0.03, y - u * 0.09 + bob); ctx.lineTo(x, y + bob); ctx.fill();
}

// ---------- the worms ----------
function wormLines() {
  const inv = state.inv;
  if (!inv.metWorm) { inv.metWorm = true; return { lines: [
    'Hhhhhhello! A visitor! Up HERE! Oh, it has been an age. A long, long age.',
    'Mind the tubes, little one. Those are noses. Well. Breathing bits. Ours.',
    'The air up here is the only air worth having. So we stretch up to it, all the way from down there. Some of us from very far down.',
    'The oldest of us are rooted so deep, they say, they touch the fire at the middle of everything. They say. Nobody\'s been to check.',
    'Nothing eats us. Nothing up here to eat us. Except, well. Us. The kingdoms do squabble. More than we like to admit.',
    'You move oddly. All legs, no ground. Come back when you\'re ready, and we\'ll teach you how the ground moves.',
  ] }; }
  return { lines: [pick(['The ground is only asleep. Wake it gently.', 'Above the peak? Hhhh. Nobody knows. Nobody\'s come back to tell.', 'Mind the hawks. They get ideas.'])] };
}
function drawWormNpc(n) {
  const [x, y] = npcPos(n), u = UNIT, t = state.time;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + u * 0.2, u * 0.9, u * 0.3, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.ellipse(x, y + u * 0.1, u * 0.75, u * 0.25, 0, 0, 6.28); ctx.fill();           // the hole it comes up from
  for (let i = 0; i < 6; i++) { const k = i / 5, sx = x + Math.sin(t * 1.3 + i * 0.7) * u * 0.18 * (1 - k), sy = y - i * u * 0.32;
    ctx.fillStyle = i % 2 ? '#c98a8a' : '#d89a96'; ctx.beginPath(); ctx.ellipse(sx, sy, u * (0.42 - k * 0.1), u * 0.2, 0, 0, 6.28); ctx.fill(); }
  const hx = x + Math.sin(t * 1.3 + 3.5) * u * 0.05, hy = y - u * 1.9;
  ctx.fillStyle = '#e4aaa4'; ctx.beginPath(); ctx.arc(hx, hy, u * 0.34, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#2a1a1a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + s * u * 0.12, hy - u * 0.04, u * 0.045, 0, 6.28); ctx.fill(); }
  ctx.strokeStyle = '#8a4a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy + u * 0.06, u * 0.12, 0.2, Math.PI - 0.2); ctx.stroke();   // friendly
  for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(230,240,255,${0.35 - i * 0.1})`; ctx.beginPath(); ctx.arc(hx + u * 0.4 + i * u * 0.25, hy - u * 0.3 - ((t * 0.8 + i * 0.3) % 1) * u * 0.8, u * (0.07 + i * 0.03), 0, 6.28); ctx.fill(); }   // breath in the cold
}
function drawSnorkels(sc) {
  for (const [fx, fy, s, ph] of sc.feat.snorkels || []) {
    const x = fx * W, y = fy * H, u = UNIT * s, t = state.time, br = 0.5 + 0.5 * Math.sin(t * 1.4 + ph);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, y + u * 0.2, u * 0.5, u * 0.18, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#c98a8a'; ctx.fillRect(x - u * 0.2, y - u * 1.1, u * 0.4, u * 1.2);
    ctx.fillStyle = '#e4aaa4'; ctx.beginPath(); ctx.ellipse(x, y - u * 1.1, u * (0.32 + br * 0.08), u * 0.14, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#5a2a2a'; ctx.beginPath(); ctx.ellipse(x, y - u * 1.1, u * (0.15 + br * 0.08), u * 0.06, 0, 0, 6.28); ctx.fill();   // it opens and closes as it breathes
  }
  for (const [fx, fy, s] of sc.feat.tunnels || []) { const x = fx * W, y = fy * H; ctx.fillStyle = '#2a2222'; ctx.beginPath(); ctx.ellipse(x, y, UNIT * s, UNIT * s * 0.5, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#6a5a58'; ctx.lineWidth = 2; ctx.stroke(); }
}

// ---------- crystal insects ----------
function drawCrystalBug(s) {
  const { x, y, vis: r } = s, u = UNIT, t = state.time;
  const near = Math.hypot(state.hero.x - x, state.hero.y - y) < UNIT * 3, tw = s.twitch && near ? Math.sin(t * 40) * u * 0.03 * (Math.sin(t * 2) > 0.7 ? 1 : 0) : 0;
  ctx.save(); ctx.translate(x + tw, y);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, r * 0.45, r * 1.1, r * 0.35, 0, 0, 6.28); ctx.fill();
  const tor = s.form === 'tormented', hue = tor ? ['#8a6aa8', '#b49ad0', '#5a4078'] : ['#7ab0c8', '#b8e0f0', '#4a7a98'];
  ctx.strokeStyle = hue[2]; ctx.lineWidth = Math.max(2, r * 0.06);                                  // legs, frozen mid-step (or mid-writhe)
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const a = (i - 1) * 0.6 + (tor ? Math.sin(i * 3.1 + s.ph) * 0.5 : 0); ctx.beginPath(); ctx.moveTo(sd * r * 0.3, (i - 1) * r * 0.25); ctx.lineTo(sd * r * 0.8, (i - 1) * r * 0.3 - r * 0.2); ctx.lineTo(sd * r * (1 + (tor ? 0.2 : 0)), (i - 1) * r * 0.35 + r * 0.25 * a); ctx.stroke(); }
  for (const [cy, rx, ry, c] of [[r * 0.35, r * 0.5, r * 0.4, 0], [-r * 0.15, r * 0.42, r * 0.32, 1], [-r * 0.6, r * 0.28, r * 0.24, 0]]) {   // abdomen, thorax, head as cut crystal
    ctx.fillStyle = hue[c]; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + (tor ? Math.sin(i + s.ph) * 0.3 : 0); ctx.lineTo(Math.cos(a) * rx, cy + Math.sin(a) * ry); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(-rx * 0.5, cy - ry * 0.4); ctx.lineTo(rx * 0.1, cy - ry * 0.8); ctx.lineTo(0, cy); ctx.fill();
  }
  if (tor) { ctx.strokeStyle = '#3a2050'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.lineTo(Math.cos(i * 1.7 + s.ph) * r * 0.9, -r * 0.6 + Math.sin(i * 1.7 + s.ph) * r * 0.7 - r * 0.3); ctx.stroke(); } }   // spikes and horns
  const gl = 0.25 + 0.2 * Math.sin(t * 1.5 + s.ph); ctx.fillStyle = `rgba(255,255,255,${gl})`; ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.7, r * 0.06, 0, 6.28); ctx.fill();   // a glint that comes and goes
  ctx.restore();
}

// ---------- the view down: the valley far below, the clouds, birds rising from the surface ----------
function drawValleyBelow(x0, y0, w, h, depth) {                   // the land below, close enough to read: treetops, a broad river, fields; it drifts slower than the ledge
  const cx = state.cam ? state.cam.x || W / 2 : W / 2, par = (cx - W / 2) * 0.15, u = UNIT, t = state.time;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = '#5f8a4a'; ctx.fillRect(x0, y0, w, h);                                                        // meadow far below
  let s = 7331; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(170,160,90,.35)' : 'rgba(120,150,70,.35)'; ctx.fillRect(x0 + rnd() * w + par, y0 + rnd() * h, u * (2 + rnd() * 3), u * (1.2 + rnd() * 2)); }   // fields
  const rx = k => x0 + w * (0.35 + 0.25 * Math.sin(k * 3.2 + 0.6)) + par, ry = k => y0 + h * k;              // the river winding down through it, about a tile and a half across
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#c8b886'; ctx.lineWidth = u * 1.9; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const k = i / 30 * 1.1 - 0.05; i ? ctx.lineTo(rx(k), ry(k)) : ctx.moveTo(rx(k), ry(k)); } ctx.stroke();   // sandy banks
  ctx.strokeStyle = '#5a9ac4'; ctx.lineWidth = u * 1.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(220,240,255,.35)'; ctx.lineWidth = 2; ctx.setLineDash([u * 0.5, u * 0.9]); ctx.lineDashOffset = -t * u * 0.6; ctx.stroke(); ctx.setLineDash([]);   // glints on the water, moving
  for (let i = 0; i < 90; i++) {                                                                                   // treetops: clumps of forest either side of the river
    const k = rnd(), side = rnd() < 0.5 ? -1 : 1, off = u * (1.3 + rnd() * 5), x = rx(k) + side * off, y = ry(k) + (rnd() - 0.5) * u;
    if (x < x0 - u || x > x0 + w + u) continue;
    const r = u * (0.35 + rnd() * 0.3); ctx.fillStyle = 'rgba(20,40,20,.35)'; ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.3, r, 0, 6.28); ctx.fill();
    ctx.fillStyle = rnd() < 0.3 ? '#3c6a34' : '#2f5a2c'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(140,190,110,.35)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, 6.28); ctx.fill();
  }
  ctx.fillStyle = 'rgba(200,220,240,.22)'; ctx.fillRect(x0, y0, w, h);                                            // a little haze: it's a long way down
  for (let i = 0; i < 3; i++) { const cxx = x0 + ((i * 0.41 + t * 0.006) % 1.3) * w - w * 0.15 + par * 2, cyy = y0 + h * (0.2 + i * 0.3);   // clouds drifting between you and it
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.ellipse(cxx + j * u * 1.3, cyy + Math.sin(j) * u * 0.3, u * (1.6 + j * 0.3), u * 0.7, 0, 0, 6.28); ctx.fill(); } }
  drawRisingBirds(x0, y0, w, h);
  ctx.restore();
}
function drawRisingBirds(x0, y0, w, h) {                           // tiny dots far below, rising and slowly coming into view
  const B = state.vistaBirds || (state.vistaBirds = []);
  if (B.length < 6 && Math.random() < 0.02) B.push({ fx: Math.random(), k: 0, sp: 0.03 + Math.random() * 0.03, ph: Math.random() * 6 });
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i]; b.k += b.sp / 60; if (b.k > 1) { B.splice(i, 1); continue; }
    const x = x0 + b.fx * w + Math.sin(state.time * 0.8 + b.ph) * UNIT * 0.4, y = y0 + h * (0.95 - b.k * 0.9), s = 2 + b.k * b.k * UNIT * 0.6, flap = Math.sin(state.time * 8 + b.ph);
    ctx.strokeStyle = `rgba(40,40,50,${0.4 + b.k * 0.5})`; ctx.lineWidth = Math.max(1, s * 0.25); ctx.beginPath(); ctx.moveTo(x - s, y - flap * s * 0.4); ctx.lineTo(x, y); ctx.lineTo(x + s, y - flap * s * 0.4); ctx.stroke();
  }
}
function drawCloudSea(x0, y0, w, h) {                               // above the clouds: white tops rolling away, the valley through the gaps
  drawValleyBelow(x0, y0, w, h, 0.6);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  for (let i = 0; i < 30; i++) { const fx = (i * 0.37 + state.time * 0.003) % 1.2 - 0.1, fy = (i * 0.61) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 + (i % 3) * 0.06})`; ctx.beginPath(); ctx.ellipse(x0 + fx * w, y0 + fy * h, UNIT * (1 + (i % 4) * 0.5), UNIT * 0.55, 0, 0, 6.28); ctx.fill(); }
  ctx.restore();
}
function drawHighVista(sc) {
  if (!sc.vista) return;
  for (const [x0, y0, x1, y1] of sc.chasms) { const r = [x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H]; sc.vista === 'clouds' ? drawCloudSea(...r) : drawValleyBelow(...r, 1); }
}
// the first time you come up above the clouds: a vista card, the title of the place
function drawHighTitle() {
  const T = state.highTitle; if (!T) return;
  try { drawHighTitleInner(T); } catch (e) { state.highTitle = null; }   // never let the card stop the game
}
function drawHighTitleInner(T) {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  if (T.t0 == null) T.t0 = now - (T.t || 0);
  T.t = now - T.t0;
  const anyKey = pressedNow.act || pressedNow.jump || pressedNow.menu || pressedNow.swap;
  if (T.t > 8 || (T.t > 1 && anyKey)) { state.highTitle = null; return; }
  const a = Math.min(1, T.t / 0.8, (8 - T.t) / 0.8);
  const e = Math.min(1, T.t / 6), zoom = 2.6 - 1.35 * (1 - Math.pow(1 - e, 3));      // starts close on the peak, pulls back slowly
  ctx.save(); ctx.globalAlpha = a;
  ctx.save(); ctx.translate(W * 0.5, H * 0.3); ctx.scale(zoom, zoom); ctx.translate(-W * 0.5, -H * 0.3);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f4c49a'); g.addColorStop(0.45, '#b8d4f0'); g.addColorStop(1, '#8aa8c8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);   // dawn sky
  ctx.fillStyle = '#6a8a5a'; ctx.fillRect(0, H * 0.72, W, H * 0.28);                                                                           // the valley, very far down
  ctx.strokeStyle = '#8ac0e0'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const k = i / 30; const xx = W * k, yy = H * (0.78 + Math.sin(k * 9) * 0.04 + k * 0.1); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
  for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.ellipse(((i * 0.29 + T.t * 0.01) % 1.2 - 0.1) * W, H * (0.6 + (i % 5) * 0.03), UNIT * (1.4 + (i % 3)), UNIT * 0.6, 0, 0, 6.28); ctx.fill(); }   // cloud tops
  ctx.fillStyle = '#8c8a9a'; ctx.beginPath(); ctx.moveTo(W * 0.02, H * 0.72); ctx.lineTo(W * 0.14, H * 0.5); ctx.lineTo(W * 0.24, H * 0.6); ctx.lineTo(W * 0.3, H * 0.72); ctx.fill();   // far ridges, bluish with distance
  ctx.beginPath(); ctx.moveTo(W * 0.72, H * 0.72); ctx.lineTo(W * 0.86, H * 0.46); ctx.lineTo(W * 0.98, H * 0.72); ctx.fill();
  ctx.fillStyle = '#7a716c'; ctx.beginPath(); ctx.moveTo(W * 0.22, H); ctx.lineTo(W * 0.38, H * 0.52); ctx.lineTo(W * 0.46, H * 0.3); ctx.lineTo(W * 0.5, H * 0.16); ctx.lineTo(W * 0.56, H * 0.28); ctx.lineTo(W * 0.66, H * 0.48); ctx.lineTo(W * 0.82, H); ctx.closePath(); ctx.fill();   // the mountain, going on up
  ctx.fillStyle = '#5e5652'; ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.16); ctx.lineTo(W * 0.56, H * 0.28); ctx.lineTo(W * 0.66, H * 0.48); ctx.lineTo(W * 0.82, H); ctx.lineTo(W * 0.58, H); ctx.lineTo(W * 0.54, H * 0.6); ctx.closePath(); ctx.fill();   // the shaded side
  ctx.strokeStyle = 'rgba(40,34,30,.35)'; ctx.lineWidth = 2; for (const [a, b, c, d] of [[0.47, 0.3, 0.42, 0.55], [0.52, 0.35, 0.5, 0.7], [0.58, 0.4, 0.62, 0.62]]) { ctx.beginPath(); ctx.moveTo(W * a, H * b); ctx.lineTo(W * c, H * d); ctx.stroke(); }   // ridges down its face
  ctx.fillStyle = '#eef3f8'; ctx.beginPath(); ctx.moveTo(W * 0.44, H * 0.34); ctx.lineTo(W * 0.46, H * 0.3); ctx.lineTo(W * 0.5, H * 0.16); ctx.lineTo(W * 0.56, H * 0.28); ctx.lineTo(W * 0.575, H * 0.33); ctx.lineTo(W * 0.53, H * 0.3); ctx.lineTo(W * 0.5, H * 0.34); ctx.lineTo(W * 0.47, H * 0.31); ctx.closePath(); ctx.fill();   // snow on the peak
  for (let i = 0; i < 5; i++) { const bx = W * (0.3 + i * 0.1), by = H * (0.62 - (i % 2) * 0.05), f = Math.sin(T.t * 6 + i); ctx.strokeStyle = 'rgba(40,40,50,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 8, by - f * 4); ctx.lineTo(bx, by); ctx.lineTo(bx + 8, by - f * 4); ctx.stroke(); }   // birds, rising
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.16, W * 0.12, UNIT * 0.5, 0, 0, 6.28); ctx.fill();          // a cloud round the very top
  ctx.restore();                                                                                                             // the words don't zoom
  const ta = Math.max(0, Math.min(1, (T.t - 1.2) / 1));
  ctx.globalAlpha = a * ta; ctx.textAlign = 'center'; ctx.fillStyle = '#fff8e8'; ctx.shadowColor = 'rgba(40,30,60,.5)'; ctx.shadowBlur = 12;
  ctx.font = `bold ${Math.round(Math.min(W / 14, UNIT * 1.4))}px Georgia, serif`; ctx.fillText('The High Reaches', W / 2, H * 0.44);
  ctx.font = `italic ${Math.round(UNIT * 0.5)}px Georgia, serif`; ctx.fillText('above the clouds, where nothing that went higher came back', W / 2, H * 0.44 + UNIT * 0.9);
  ctx.shadowBlur = 0; ctx.font = `${Math.round(UNIT * 0.32)}px "Courier New", monospace`; ctx.fillStyle = 'rgba(255,248,232,.7)'; if (T.t > 1) ctx.fillText(`${K.act.toUpperCase()} to go on`, W / 2, H - UNIT * 0.6);
  ctx.restore();
}

function drawHawk(e) {                                            // its shadow on the ground, the bird up at its altitude
  const u = UNIT, alt = e.alt || 0, t = state.time, sz = e.mode === 'dive' ? 1 + (1 - alt / (u * 3)) * 0.3 : 1, flap = e.mode === 'dive' ? 0.2 : Math.sin(t * 6 + e.ang);
  ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.2 * (1 - alt / (u * 3.2))})`; ctx.beginPath(); ctx.ellipse(e.x, e.y, u * (0.3 + 0.5 * alt / (u * 3)), u * 0.14, 0, 0, 6.28); ctx.fill();
  const y = e.y - alt - u * 0.3;
  ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.moveTo(e.x - u * 1.0 * sz, y - flap * u * 0.35); ctx.quadraticCurveTo(e.x - u * 0.4, y - u * 0.2, e.x, y); ctx.quadraticCurveTo(e.x + u * 0.4, y - u * 0.2, e.x + u * 1.0 * sz, y - flap * u * 0.35); ctx.lineTo(e.x, y + u * 0.18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a5a40'; ctx.beginPath(); ctx.ellipse(e.x, y + u * 0.05, u * 0.18, u * 0.32, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.moveTo(e.x - u * 0.06, y - u * 0.26); ctx.lineTo(e.x + u * 0.06, y - u * 0.26); ctx.lineTo(e.x, y - u * 0.38); ctx.fill();   // beak
  if (e.mode === 'dive') { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * u * 0.3, y - u * 0.4); ctx.lineTo(e.x + s * u * 0.5, y - u * 1.1); ctx.stroke(); } }   // whoosh
}
function drawMantis(e) {                                          // a big mountain mantis, green-grey, forelegs up
  const u = UNIT, r = e.r, rear = e.mode === 'rear' ? 1 : 0, t = state.time;
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.5, r * 1.1, r * 0.35, 0, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#4a5a3a'; ctx.lineWidth = Math.max(2, r * 0.08);
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(e.x + s * r * 0.2, e.y + i * r * 0.2); ctx.lineTo(e.x + s * r * 0.8, e.y + i * r * 0.3 + r * 0.3); ctx.stroke(); }
  ctx.fillStyle = e.flash > 0 ? '#fff' : '#7a8a5a'; ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.1, r * 0.35, r * 0.6, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = e.flash > 0 ? '#fff' : '#8a9a6a'; ctx.beginPath(); ctx.moveTo(e.x - r * 0.25, e.y - r * 0.55); ctx.lineTo(e.x + r * 0.25, e.y - r * 0.55); ctx.lineTo(e.x, e.y - r * 0.9); ctx.closePath(); ctx.fill();   // the triangle head
  ctx.strokeStyle = '#5a6a44'; ctx.lineWidth = Math.max(3, r * 0.1);
  for (const s of [-1, 1]) { const up = rear ? -0.9 : -0.4 + Math.sin(t * 2) * 0.05; ctx.beginPath(); ctx.moveTo(e.x + s * r * 0.2, e.y - r * 0.4); ctx.lineTo(e.x + s * r * 0.55, e.y - r * 0.4 + up * r); ctx.lineTo(e.x + s * r * 0.3, e.y - r * 0.6 + up * r * 0.6); ctx.stroke(); }   // the forelegs, raised to strike
  ctx.fillStyle = rear ? '#ff4a3a' : '#1a1a12'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * r * 0.12, e.y - r * 0.72, r * 0.05, 0, 6.28); ctx.fill(); }
}

function drawLedgeLips(sc) {                                      // a rough rock lip along each drop, so the edge reads as an edge
  for (const [x0, y0, x1, y1] of sc.chasms) {
    const X0 = x0 * W, Y0 = y0 * H, X1 = x1 * W, Y1 = y1 * H, u = UNIT;
    ctx.fillStyle = '#6e6862';
    const lip = (ax, ay, bx, by) => { const n = Math.ceil(Math.hypot(bx - ax, by - ay) / (u * 0.45)); for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; ctx.beginPath(); ctx.ellipse(x, y, u * 0.28, u * 0.2, i, 0, 6.28); ctx.fill(); } };
    if (X0 > 1) lip(X0, Y0, X0, Y1); if (X1 < W - 1) lip(X1, Y0, X1, Y1); if (Y0 > 1) lip(X0, Y0, X1, Y0); if (Y1 < H - 1) lip(X0, Y1, X1, Y1);
  }
}
