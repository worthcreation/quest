
// =====================================================================
// Combat. Tap F = slash (also blocks). Hold and release = stab, which lunges.
// Chain: stab, slash while lunging, then stab again in time, and the next
// stab lunges farther, hits harder, and bowls small things over. Chains to x3.
// =====================================================================
const SLASH = { dur: 0.22, cool: 0.22, reach: 1.7 };
const STAB  = { dur: 0.22, cool: 0.1, reach: 2.2, charge: 0.35, chainCharge: 0.18, knockChance: 0.6 };
const COMBO = { slashWindow: 0.7, stabWindow: 0.9 };
const SMALL = ['rabbit', 'glowworm', 'gremlin', 'diver', 'lurker', 'stalker'];

function updateCombat(dt) {
  const inv = state.inv, h = state.hero;
  // in the air, act slams down: sword or no sword, spinning or not (not when spent)
  if (pressedNow.act && h.z > UNIT * 0.3 && !state.slam && !state.carry && !h.ride && h.vig >= 0.8) {
    state.slam = true; h.vz = -UNIT * 16;
    if (state.whirl) { state.whirl = null; bumpCrazy('Spin dive'); }
    sfx.swoosh(); return;
  }
  if (!inv.sword || state.pull.grip || h.ride || state.carry) return;
  if (state.equip === 'acorn' && inv.acorns > 0) return;          // acorns in hand: F throws instead
  const hold = state.hold, cb = state.combo;
  state.atkCool -= dt;
  const nearPullable = sceneDef().pullables.some(p => !rtFor(state.scene).pulled.has(p.id) && Math.hypot(h.x - p.fx * W, h.y - p.fy * H) < UNIT * 1.7);
  if (nearPullable) return;
  if (state.slam) return;
  if (state.whirl) { updateWhirl(dt); return; }
  if (pressedNow.act) { hold.on = true; hold.t = 0; hold.charged = false; state.slashBuf = state.time; }
  // presses a hair early (mid-stab) are buffered, so you can slash right out of a lunge
  if (state.time - (state.slashBuf ?? -9) < 0.25) {
    if (state.time < (state.poundChain || 0)) {             // strike right after a pound's spin: straight into a whirlwind
      state.slashBuf = -9; state.poundChain = 0; state.chain.n = 0;
      bumpCrazy('Whirlwind'); startWhirl(); return;
    }
    if (state.atkCool <= 0) {
      state.slashBuf = -9;
      const chained = cb.step === 'stab' && state.time - cb.t < COMBO.slashWindow;
      if (chained) { cb.step = 'slash'; cb.t = state.time; } else { cb.step = null; cb.level = 0; }
      // slashes in rhythm (not too quick, not too slow) swing wider each time, closing toward a full circle;
      // the seventh becomes a spin
      const ch = state.chain, gap = state.time - ch.t;
      ch.n = gap >= WHIRL.min && gap <= WHIRL.max ? ch.n + 1 : 1;
      ch.t = state.time;
      if (ch.n >= WHIRL.chain) {
        ch.n = 0;
        if (h.vig >= 3) { startWhirl(); return; }
        say('Too tired to spin', h.x, h.y - UNIT * 1.2, { key: 'tired', life: 1.2, color: '#ffb080' });
      }
      if (ch.n >= 2) say('\u2022 '.repeat(ch.n).trim(), h.x, h.y - UNIT * 1.2, { key: 'chain', life: 0.55, color: ch.n >= 5 ? '#ffb347' : '#ffe38a' });
      const k = (ch.n - 1) / (WHIRL.chain - 1);
      state.active = 'sword';
      const slow = sluggish();                               // a tired arm swings slowly
      state.atk = { type: 'slash', t: 0, dur: SLASH.dur * (1 + k * 0.6) * slow, hit: new Set(), ax: h.fx, ay: h.fy, level: chained ? cb.level : 0, sweep: 1.25 + (Math.PI - 1.25) * k, n: ch.n };
      state.atkCool = SLASH.cool * slow;
      if (slow > 1.8) say('Your arm is heavy...', h.x, h.y - UNIT * 1.2, { key: 'tired', tip: 'tiredswing', life: 1.5, color: '#ffb080' });
      sfx.swoosh();
      if (state.bird) scareBird(h.x, h.y, 5);
      scareFlock(h.x, h.y, 5);
      shakeTrees(h, 1);
      knockRocks(h.x + h.fx * UNIT * 1.2, h.y + h.fy * UNIT * 1.2, UNIT * 1.1);   // a swing at a buried rock knocks it loose
      cutVines(h);
    }
  }
  if (hold.on) {
    if (held.act()) {
      hold.t += dt;
      const need = (cb.step === 'slash' ? STAB.chainCharge : STAB.charge) * sluggish();
      if (!hold.charged && hold.t > need) { hold.charged = true; sfx.charge(); }
    } else {
      if (hold.charged && spend(0.6)) {
        const chained = cb.step === 'slash' && state.time - cb.t < COMBO.stabWindow;
        cb.level = chained ? Math.min(3, cb.level + 1) : 0;
        cb.step = 'stab'; cb.t = state.time;
        state.active = 'sword';
        state.atk = { type: 'stab', t: 0, dur: STAB.dur + cb.level * 0.04, hit: new Set(), ax: h.fx, ay: h.fy, level: cb.level };
        state.atkCool = STAB.cool;
        h.dashT = 0.12 + cb.level * 0.05;                 // the lunge; you can slash out of it
        h.vx = h.fx * (0.75 + cb.level * 0.3) * L(); h.vy = h.fy * (0.75 + cb.level * 0.3) * L();
        if (cb.level) { sfx.flipStrike(); zoomPulse(h.x, h.y, cb.level >= 3 ? 'kill' : 'parry'); say('x' + (cb.level + 1), h.x, h.y - UNIT * 1.2, { key: 'combo', life: 0.9, color: '#ffe38a', size: 1 + cb.level * 0.2 }); }
        else sfx.stab();
        say('Stab, then slash while you lunge, then stab again: each chained stab goes farther.', h.x, h.y - UNIT * 1.6, { key: 'combotip', tip: 'combo', life: 5 });
      }
      hold.on = false; hold.charged = false;
    }
  }
  const a = state.atk;
  if (!a) return;
  a.t += dt;
  for (const e of state.enemies) {
    if (a.hit.has(e) || !hittable(e)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
    let hit;
    if (a.type === 'slash') {
      const sw = a.sweep || 1.25, reach = UNIT * SLASH.reach * (1 + ((a.n || 1) - 1) * 0.04);
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * a.ax + dy * a.ay) / d)));
      hit = d < reach + e.r && (ang <= sw + 0.15 || d < e.r + UNIT * 0.6);
    }
    else {
      const along = dx * a.ax + dy * a.ay, perp = Math.abs(dx * a.ay - dy * a.ax);
      hit = along > -e.r && along < UNIT * (STAB.reach + (inv.horn >= 3 ? 0.5 : 0)) + e.r && perp < e.r + UNIT * 0.35;
    }
    if (hit) {
      a.hit.add(e);
      let dmg = a.type === 'slash' ? 1 + inv.up.edge * 0.5 : 2 + inv.up.temper * 0.5;
      if (a.type === 'stab' && inv.horn) dmg += 1;
      if (a.type === 'stab' && a.level) dmg *= 1 + a.level * (inv.horn >= 2 ? 0.45 : 0.3);
      if (inv.slime > 0) dmg += 1;
      dmg *= power();
      damage(e, dmg, a.type, dx / d, dy / d, a.type === 'stab' && a.level > 0 && SMALL.includes(e.type));
    }
  }
  if (a.t >= a.dur) state.atk = null;
}
// ---------------- whirlwind: keep it spinning by striking on the beat ----------------
const WHIRL = { chain: 7, min: 0.26, max: 0.62, length: 3, first: 0.62, window: 0.13, shrink: 0.88, fastest: 0.26, bonus: 0.5 };
function startWhirl() {
  const h = state.hero;
  state.atk = null; state.hold.on = false; state.hold.charged = false;
  spend(1.5);
  state.whirl = { t: 0, end: state.time + WHIRL.length, ang: Math.atan2(h.fy, h.fx), beat: WHIRL.first, next: state.time + WHIRL.first, streak: 0, hit: new Set(), lastRev: 0 };
  sfx.spin(); zoomPulse(h.x, h.y, 'kill'); state.shake = 0.2; cutVines(h);
  say('Whirlwind!', h.x, h.y - UNIT * 1.4, { key: 'combo', life: 1, color: '#ffe38a', size: 1.4 });
  say(`It spins for 3 seconds. Strike ${K.act} as the ring closes to spin faster and longer. Jump to glide.`, h.x, h.y + UNIT * 2, { key: 'whirltip', tip: 'whirl', life: 5 });
}
function endWhirl(why) {
  const w = state.whirl, h = state.hero;
  if (!w) return;
  state.whirl = null;
  if (why === 'done') { h.stun = 0.3; sfx.dizzy(); say('Whew.', h.x, h.y - UNIT * 1.2, { key: 'combo', life: 0.8 }); }
  if (why === 'knocked' || why === 'flash') { h.stun = 0.35; state.shake = 0.3; sfx.crash(); say(why === 'flash' ? 'The flash breaks your spin!' : 'Knocked out of your spin!', h.x, h.y - UNIT * 1.2, { key: 'combo', life: 1.2 }); }
}
function updateWhirl(dt) {
  const w = state.whirl, h = state.hero, inv = state.inv;
  const win = WHIRL.window + (inv.up.star ? 0.05 : 0);
  w.t += dt;
  w.ang += (Math.PI * 2 / Math.max(WHIRL.fastest, w.beat)) * 1.5 * dt;
  if (w.ang - w.lastRev > Math.PI * 2) { w.lastRev = w.ang; w.hit.clear(); }
  if (state.time >= w.end) { endWhirl('done'); return; }
  if (state.time > w.next + win) w.next += w.beat;       // missing a beat just means no bonus
  if (pressedNow.act && Math.abs(state.time - w.next) <= win) {
    {
      w.streak++;
      if (!spend(0.35)) { endWhirl('done'); return; }
      w.end += WHIRL.bonus;
      w.beat = Math.max(WHIRL.fastest, w.beat * WHIRL.shrink);
      w.next = state.time + w.beat;
      cutVines(h); sfx.whirlUp(w.streak); zoomPulse(h.x, h.y, w.streak % 4 ? 'tap' : 'parry');
      say('x' + (w.streak + 1), h.x, h.y - UNIT * 1.3, { key: 'combo', life: 0.6, color: '#ffe38a', size: 1 + Math.min(0.8, w.streak * 0.08) });
    }
  }
  const reach = UNIT * (1.9 + Math.min(0.8, w.streak * 0.06));
  for (const e of state.enemies) {
    if (w.hit.has(e) || !hittable(e)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
    if (d > reach + e.r) continue;
    w.hit.add(e);
    damage(e, ((1.2 + inv.up.edge * 0.5) * (1 + w.streak * 0.1) * power() + (inv.slime > 0 ? 1 : 0)) * crazyMult(), 'slash', dx / d, dy / d, true);   // everything gets thrown back
  }
  if (Math.random() < 0.5) state.fx.push({ x: h.x + Math.cos(w.ang) * reach * 0.8, y: h.y + Math.sin(w.ang) * reach * 0.6, vx: 0, vy: 0, t: 0, life: 0.25, color: 'rgba(255,245,210,.7)', size: UNIT * 0.2 });
  if (state.bird) scareBird(h.x, h.y, 5);
  scareFlock(h.x, h.y, 5);
}
// ---------------- the crazy combo: whirl, jump, glide, pound, spin, whirl again ----------------
function bumpCrazy(label) {
  const c = state.crazy || (state.crazy = { n: 0, t: -9 }), h = state.hero;
  c.n = state.time - c.t < 2.5 ? c.n + 1 : 1; c.t = state.time;
  if (c.n >= 2) say(`${label}! x${c.n}`, h.x, h.y - UNIT * 1.6, { key: 'crazy', life: 1.1, color: c.n >= 5 ? '#ffb347' : '#ffe38a', size: 1 + Math.min(0.8, c.n * 0.1) });
}
const crazyMult = () => { const c = state.crazy; return c && state.time - c.t < 2.5 ? 1 + Math.min(1, c.n * 0.12) : 1; };
function slamDown() {
  const h = state.hero, inv = state.inv, armed = inv.sword;
  state.slam = false;
  sfx.slam(); state.shake = 0.45; zoomPulse(h.x, h.y, 'kill');
  spark(h.x, h.y + UNIT * 0.3, '#9a8a6a', 16, 4);
  state.fx.push({ x: h.x, y: h.y + UNIT * 0.3, vx: 0, vy: 0, t: 0, life: 0.45, color: 'shock', size: UNIT * (armed ? 2.6 : 2) });
  spend(0.8);
  bumpCrazy('Pound');
  for (const e of state.enemies) {
    if (!hittable(e)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
    if (d > UNIT * (armed ? 2.4 : 2) + e.r) continue;
    const swordDmg = 2 + (inv.horn ? 1 : 0) + (inv.slime > 0 ? 1 : 0);
    const dmg = armed ? swordDmg : swordDmg / 2;                                 // bare-handed: half the sword's
    damage(e, dmg * power() * crazyMult(), 'stab', dx / d, dy / d, true);
  }
  if (armed) {
    // the sword sweeps a full circle as you land; strike again right away to whirl
    state.atk = { type: 'slash', t: 0, dur: 0.3, hit: new Set(), ax: h.fx, ay: h.fy, level: 0, sweep: Math.PI, n: 7 };
    state.atkCool = 0.15; state.poundChain = state.time + 0.6; state.active = 'sword';
    sfx.spin();
    say(`${K.act} now to spin into a whirlwind`, h.x, h.y + UNIT * 1.8, { key: 'pcombo', tip: 'poundchain', life: 3 });
  }
  if (state.bird) scareBird(h.x, h.y, 6);
  if (state.bird) flushBird(h.x, h.y);                 // a stomp by the nest tree sends the robin bursting out of its hole
  knockRocks(h.x, h.y, UNIT * 2.4);
  const ks = state.solids.find(o => o.bar && o.kind === 'cracked' && Math.hypot(o.x - h.x, o.y - h.y) < UNIT * 2.6);
  if (ks) say('It won\'t budge for a stomp. It needs a thrown rock.', ks.x, ks.y - UNIT, { key: 'stonehit', life: 2 });
  scareFlock(h.x, h.y, 6);
  shakeTreesAround(h, UNIT * 2.6);                                               // the thump knocks acorns loose
}
// vines give way to a few good cuts
function cutVines(h) {
  const rt = rtFor(state.scene);
  for (const s of state.solids) {
    if (s.kind !== 'vine' || Math.hypot(s.x - h.x, s.y - h.y) > UNIT * SLASH.reach + s.r) continue;
    const k = 'cut_' + s.bar;
    rt.flags[k] = (rt.flags[k] || 0) + 1;
    spark(s.x, s.y, '#4a8a3a', 5, 2); sfx.rustle();
    if (rt.flags[k] >= 4) breakBarrier(s.bar, 'cut');
    else say('The vines give a little.', s.x, s.y - UNIT, { key: 'vine', life: 1.2 });
    return;
  }
}
function shakeTreesAround(h, radius) {
  let any = false;
  for (const s of state.solids) {
    if (s.kind !== 'tree' || Math.hypot(s.x - h.x, s.y - h.y) > radius + s.r) continue;
    state.treeShake[s.key] = state.time; any = true;
    dropAcorn(s);
  }
  if (any) sfx.rustle();
}
function dropAcorn(s) {
  if ((state.treeCool[s.key] || 0) >= state.playTime || rng() >= 0.7) return;
  state.treeCool[s.key] = state.playTime + 10;
  const a = Math.random() * 6.28;
  state.items.push({ type: 'acorn', x: s.x + Math.cos(a) * (s.r + UNIT * 0.6), y: s.y + UNIT * 0.4 + Math.abs(Math.sin(a)) * UNIT * 0.4 });
  spark(s.x, s.y - UNIT, '#3c7a3a', 6, 2);
}
// slashing a tree shakes it; sometimes an acorn falls
function shakeTrees(h, reachK) {
  for (const s of state.solids) {
    if (s.kind !== 'tree') continue;
    const dx = s.x - h.x, dy = s.y - h.y, d = Math.hypot(dx, dy) || 1;
    if (d > UNIT * SLASH.reach * reachK + s.r || (dx * h.fx + dy * h.fy) / d < 0.1) continue;
    state.treeShake[s.key] = state.time;
    sfx.rustle();
    dropAcorn(s);
  }
}
const slashActive = () => state.atk && state.atk.type === 'slash' && state.atk.t < state.atk.dur;

// =====================================================================
// Enemies
// =====================================================================
function makeEnemy(type, x, y, idx, poolIdx) {
  const b = { type, idx, x, y, vx: 0, vy: 0, t: 0, cool: 0, lx: 0, ly: 0, flash: 0, dead: false, hgt: 0, poolIdx: poolIdx == null ? null : poolIdx };
  const u = UNIT;
  switch (type) {
    case 'stalker':  return { ...b, r: u * 0.7, hp: 4, dmg: 1, mode: 'sleep', t: rr(1.5, 2.5) };
    case 'charger':  return { ...b, r: u * 0.75, hp: 5, dmg: 2, mode: 'sleep', t: 1.5 };
    case 'diver':    return { ...b, r: u * 0.55, hp: 3, dmg: 1, mode: 'ceiling', t: rr(1.5, 3.5), hgt: 1 };
    case 'glowworm': return { ...b, r: u * 0.4, hp: 1, dmg: 1, mode: 'crawl', t: 0, seg: Math.random() * 6, flashCool: rr(1, 3) };
    case 'rabbit':     return { ...b, r: u * 0.45, hp: 2, dmg: 1, mode: 'idle', t: rr(0.3, 1) };
    case 'gremlin':  return { ...b, r: u * 0.42, hp: 2, dmg: 1, mode: 'idle', t: rr(0.3, 1), fast: 1.25 };
    case 'thief':    return { ...b, r: u * 0.45, hp: 6, dmg: 1, mode: 'taunt', t: 1, fast: 1.45 };
    case 'lurker':   return { ...b, r: u * 0.55, hp: 3, dmg: 1, mode: 'submerged', t: 0, cool: rr(0.5, 2) };
    case 'warden':   return { ...b, r: u * 1.3, hp: 18, maxHp: 18, dmg: 2, mode: 'dormant', t: 0 };
  }
}
function hittable(e) {
  if (e.dead) return false;
  if (e.type === 'thief') return !!e.cornered;
  if (e.type === 'diver') return ['floor', 'stunned', 'ascend'].includes(e.mode);
  if (e.type === 'lurker') return ['bite', 'risen', 'stunned'].includes(e.mode);
  if (e.type === 'warden') return !['dormant', 'intro', 'talk'].includes(e.mode);
  return true;
}
function resumeMode(e) {
  const m = { thief: ['flee', 0.6], stalker: ['stalk', 0], charger: ['aim', 0.8], diver: ['ascend', 0.6], glowworm: ['crawl', 0], rabbit: ['flee', 0.8], gremlin: ['flee', 0.6], lurker: ['sink', 0.4], warden: ['prowl', 1.2] }[e.type];
  e.mode = m[0]; e.t = m[1];
}
function spark(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = UNIT * speed * (0.4 + Math.random());
    state.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 0.35 + Math.random() * 0.25, color });
  }
}
function updateFx(dt) {
  for (let i = state.fx.length - 1; i >= 0; i--) {
    const p = state.fx[i];
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.color !== 'streak' && p.color !== 'leaf') { p.vx *= 0.9; p.vy *= 0.9; }
    if (p.t > p.life) state.fx.splice(i, 1);
  }
}

function damage(e, amount, kind, nx, ny, bowl) {
  e.hp -= amount; e.hitT = state.time;
  e.flash = kind === 'fire' ? 0.06 : 0.15;
  if (kind !== 'fire') { spark(e.x - nx * e.r * 0.6, e.y - ny * e.r * 0.6, '#ffe7b0', kind === 'stab' ? 8 : 5, 4); sfx.whack(); zoomPulse(e.x, e.y, 'hit'); }
  if (e.hp <= 0) return kill(e);
  if (e.mode === 'sleep' || e.mode === 'dormant') resumeMode(e);
  if (e.type === 'warden') { if (e.hp <= e.maxHp / 2 && !e.enraged) { e.enraged = true; say('The Warden is enraged!', e.x, e.y - e.r - UNIT, { key: 'boss' }); sfx.roar(); zoomPulse(e.x, e.y, 'boss'); } return; }
  if (e.type === 'diver' || e.type === 'lurker') {
    if (kind === 'stab' && (state.inv.horn || Math.random() < STAB.knockChance)) { e.mode = 'stunned'; e.t = 1.0; }
    return;
  }
  const knock = bowl || (kind === 'stab' && (state.inv.horn || Math.random() < STAB.knockChance));
  if (knock) { e.vx = nx * 0.9 * L(); e.vy = ny * 0.9 * L(); e.mode = 'stunned'; e.t = 0.7; state.shake = 0.2; }
  else { e.vx += nx * 0.2 * L(); e.vy += ny * 0.2 * L(); }
}

function kill(e) {
  e.dead = true; e.mode = 'dead'; e.t = 0.9; e.vx = 0; e.vy = 0;
  sfx.death();
  state.shake = 0.3;
  spark(e.x, e.y, '#6b1a1a', 14, 3);
  if (e.idx >= 0) rtFor(state.scene).deadAt[e.idx] = state.playTime;
  if (e.type === 'thief') { state.items.push({ type: 'journal', x: e.x, y: e.y }); relicMoment('journal', e.x, e.y); state.inv.thiefAt = THIEF_ROUTE.length; return; }
  const t = dropFor(e);
  if (t) {
    state.items.push({ type: t, x: e.x, y: e.y });
    if (RELICS[t] || t === 'scalp' || t === 'warden') relicMoment(t, e.x, e.y);
  }
  if (e.type === 'warden') state.items.push({ type: 'spores7', x: e.x + UNIT * 1.2, y: e.y + UNIT * 0.6 });
  if (e.type === 'warden') {
    rtFor(state.scene).bossDead = true;
    zoomPulse(e.x, e.y, 'boss');
    state.shake = 0.8;
    setMusic('cave');
    say('Behind the falls, a passage opens.', W - UNIT * 4, H * 0.5 - UNIT * 2, { key: 'falls', life: 5 });
  } else zoomPulse(e.x, e.y, 'kill');
}

function parry(e) {
  const h = state.hero;
  const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
  sfx.clang();
  spark((e.x + h.x) / 2, (e.y + h.y) / 2, '#ffd23a', 12, 5);
  state.shake = 0.15;
  zoomPulse((e.x + h.x) / 2, (e.y + h.y) / 2, 'parry');
  h.vx -= dx / d * 0.25 * L(); h.vy -= dy / d * 0.25 * L();
  h.invuln = Math.max(h.invuln, 0.35);
  if (e.type === 'warden' && e.mode !== 'charge') return;      // blocked, but it shrugs it off
  e.mode = 'stunned';
  e.t = { diver: 1.6, lurker: 1.6, warden: 1.8 }[e.type] || 1.2;
  if (!['diver', 'lurker'].includes(e.type)) { e.vx = dx / d * 0.7 * L(); e.vy = dy / d * 0.7 * L(); }
}

const TOUCHES = {
  stalker: e => ['stalk', 'windup', 'lunge', 'recover'].includes(e.mode),
  charger: e => ['aim', 'charge', 'recover'].includes(e.mode),
  glowworm: e => e.mode === 'crawl' && e.cool <= 0,
  rabbit: e => e.mode === 'dart',
  gremlin: e => e.mode === 'dart',
  thief: e => e.cornered && e.mode === 'dart',
  warden: e => ['prowl', 'aim', 'charge', 'rear', 'recover'].includes(e.mode),
};

function updateEnemies(dt) {
  const h = state.hero;
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    const dx = h.x - e.x, dy = h.y - e.y, dist = Math.hypot(dx, dy) || 1;
    const ease = (tx, ty, rate) => { const k = 1 - Math.exp(-rate * dt); e.vx += (tx - e.vx) * k; e.vy += (ty - e.vy) * k; };
    e.t -= dt; e.cool -= dt; e.flash -= dt;
    if (e.mode === 'dead') { if (e.t <= 0) state.enemies.splice(i, 1); continue; }
    if (e.falling > 0) {                                // tumbling into a ravine or the river
      e.falling -= dt;
      if (e.falling <= 0) { e.mode = 'dead'; e.dead = true; e.t = 0; if (e.idx >= 0) rtFor(state.scene).deadAt[e.idx] = state.playTime; }
      continue;
    }
    const ox = e.x, oy = e.y;
    const burning = (e.burn || 0) > 0;
    if (burning) {
      e.burn -= dt;
      e.burnTick = (e.burnTick || 0) - dt;
      if (e.burnTick <= 0) { e.burnTick = 0.6; damage(e, 0.5, 'fire', 0, 0); if (Math.random() < 0.4) sfx.sizzle(); if (e.dead) continue; }
      if (Math.random() < dt * 14) state.fx.push({ x: e.x + (Math.random() - 0.5) * e.r, y: e.y - e.r * 0.3, vx: 0, vy: -UNIT * 1.4, t: 0, life: 0.5, color: Math.random() < 0.5 ? '#ffb347' : '#ff6a2a' });
    }
    if (burning && e.type !== 'warden' && !['ceiling', 'submerged', 'ripple', 'sink'].includes(e.mode)) {
      // too busy being on fire to fight: runs about wildly
      if ((e.panicT || 0) <= 0) { e.panicT = 0.35; const a = Math.random() * 6.28; e.lx = Math.cos(a); e.ly = Math.sin(a); }
      e.panicT -= dt;
      ease(e.lx * 0.35 * L(), e.ly * 0.35 * L(), 6);
      if (e.type === 'lurker') { e.x += e.vx * dt; e.y += e.vy * dt; }
    }
    else if (e.mode === 'stunned') { ease(0, 0, 4); if (e.t <= 0) resumeMode(e); }
    else AI[e.type](e, dx, dy, dist, ease, dt);

    if (e.type !== 'lurker') { e.x += e.vx * dt; e.y += e.vy * dt; }
    const ground = !(e.type === 'diver' && e.mode === 'ceiling') && e.type !== 'lurker';
    let bump = false;
    const escaping = e.type === 'thief' && !e.cornered;       // the thief slips through anything on its way out
    if (ground && !escaping) bump = collideSolids(e, e.r * 0.85);
    const lunging = e.mode === 'lunge' || e.mode === 'charge';
    if (bump && bump.kind === 'stalagmite' && lunging) quake(bump, e);
    if (!escaping) bump = clampTo(e, e.r) || bump;
    const scn = sceneDef();
    if (ground && !escaping && e.type !== 'warden' && (scn.chasms || scn.river || scn.deep) && isChasm(e.x, e.y)) {
      const carried = ['dart', 'charge', 'lunge', 'flee'].includes(e.mode) || state.time - (e.hitT || -9) < 0.8 || (e.panicT || 0) > 0;
      if (carried) {                                   // no stopping at that speed: over the edge
        e.falling = 0.7; e.vx *= 0.3; e.vy *= 0.3; sfx.plummet(); spark(e.x, e.y, 'rgba(160,140,110,.8)', 6, 2);
        say('Over the edge!', e.x, e.y - UNIT, { key: 'fallen', life: 1.2, color: '#b8f28a' });
      } else { e.x = ox; e.y = oy; e.vx *= -0.3; e.vy *= -0.3; }   // walking, it stops at the lip
    }
    if (lunging && h.dashT > 0 && !state.dodged && dist < e.r + UNIT * 1.3) {
      state.dodged = true; state.slowmo = state.inv.step >= 2 ? 0.7 : 0.45;
      zoomPulse(h.x, h.y, 'parry'); sfx.flip();
      say('Perfect dodge!', h.x, h.y - UNIT * 1.2, { key: 'dodge', life: 1, color: '#ffe38a' });
    }
    if (sceneDef().feat.falls && e.x > W - UNIT * 2.3 - e.r) { e.x = W - UNIT * 2.3 - e.r; bump = true; }
    if (bump && (e.mode === 'charge' || e.mode === 'lunge') && e.type !== 'stalker') {
      e.mode = 'stunned'; e.t = e.type === 'warden' ? 2.0 : 1.2;
      state.shake = e.type === 'warden' ? 0.5 : 0.2; sfx.crash();
      zoomPulse(e.x, e.y, e.type === 'warden' ? 'kill' : 'hit');
      spark(e.x, e.y, '#8a7a6a', 10, 3);
    }

    const touch = TOUCHES[e.type];
    if (touch && touch(e) && !burning && h.invuln <= 0 && h.z < UNIT * 0.5 && dist < (e.r + UNIT * 0.45) * 0.95) {
      const facing = (-dx * h.fx - dy * h.fy) / dist;
      if (slashActive() && facing > 0.2) parry(e);
      else if (hurtHero(e.dmg, e.x, e.y)) afterHit(e);
    }
  }
}
function afterHit(e) {
  if (e.type === 'stalker' || e.type === 'charger') { e.mode = 'recover'; e.t = 1.1; e.cool = 1.8; e.vx *= -0.3; e.vy *= -0.3; }
  if (e.type === 'rabbit' || e.type === 'gremlin' || e.type === 'thief') { e.mode = 'flee'; e.t = 1.0; e.cool = 2; }
  if (e.type === 'glowworm') e.cool = 1.5;
  if (e.type === 'warden') { e.mode = 'recover'; e.t = 1.0; }
}

const AI = {
  stalker(e, dx, dy, dist, ease) {
    switch (e.mode) {
      case 'sleep':
        if (e.t <= 0) { e.mode = 'stalk'; sfx.growl(); say('Something stirs in the dark', e.x, e.y - UNIT * 1.3, { key: 'wake' }); state.shake = 0.3; zoomPulse(e.x, e.y, 'hit'); }
        break;
      case 'stalk':
        ease(dx / dist * 0.22 * L(), dy / dist * 0.22 * L(), 3);
        if (dist < UNIT * 6 && e.cool <= 0) { e.mode = 'windup'; e.t = 0.45; e.lx = dx / dist; e.ly = dy / dist; sfx.windup(); }
        break;
      case 'windup': ease(0, 0, 10); if (e.t <= 0) { e.mode = 'lunge'; e.t = 0.45; e.vx = e.lx * 0.8 * L(); e.vy = e.ly * 0.8 * L(); } break;
      case 'lunge': if (e.t <= 0) { e.mode = 'recover'; e.t = 0.7; e.cool = 1.4; } break;
      case 'recover': ease(0, 0, 5); if (e.t <= 0) e.mode = 'stalk'; break;
    }
  },
  charger(e, dx, dy, dist, ease) {
    switch (e.mode) {
      case 'sleep': if (e.t <= 0) { e.mode = 'aim'; e.t = 0.9; sfx.growl(); state.shake = 0.3; } break;
      case 'aim':
        ease(0, 0, 8);
        if (e.t > 0.25) { e.lx = dx / dist; e.ly = dy / dist; }
        if (e.t <= 0) { e.mode = 'charge'; e.t = 1.2; e.vx = e.lx * 0.85 * L(); e.vy = e.ly * 0.85 * L(); sfx.snort(); }
        break;
      case 'charge': if (e.t <= 0) { e.mode = 'recover'; e.t = 0.9; } break;
      case 'recover': ease(0, 0, 5); if (e.t <= 0) { e.mode = 'aim'; e.t = 0.9 + Math.random() * 0.6; } break;
    }
  },
  glowworm(e, dx, dy, dist, ease, dt) {
    e.seg += 0.1;
    e.flashCool -= dt;
    if (e.mode === 'glowup') {                      // their weapon: a blinding flash
      ease(0, 0, 8);
      if (e.t <= 0) {
        e.mode = 'crawl'; e.flashCool = rr(4, 6);
        sfx.flash(); spark(e.x, e.y, '#f4ffc0', 16, 5);
        if (dist < UNIT * 5.5 && state.whirl) endWhirl('flash');
        if (dist < UNIT * 4.5) {
          if (state.inv.lumin > 0) say('Your own glow shrugs off the flash.', state.hero.x, state.hero.y - UNIT, { key: 'blind', life: 1.5 });
          else { state.blind = 1.8; zoomPulse(e.x, e.y, 'hurt'); say('Blinded!', state.hero.x, state.hero.y - UNIT, { key: 'blind', life: 1.5, color: '#ffffff' }); }
        }
      }
      return;
    }
    if (dist < UNIT * 3.5 && e.flashCool <= 0) { e.mode = 'glowup'; e.t = 0.8; sfx.charge(); return; }
    if (dist < UNIT * 5 && e.cool <= 0) ease(dx / dist * 0.07 * L(), dy / dist * 0.07 * L(), 2);
    else { if (e.t <= 0) { e.t = 2; const a = Math.random() * 6.28; e.lx = Math.cos(a); e.ly = Math.sin(a); } ease(e.lx * 0.03 * L(), e.ly * 0.03 * L(), 2); }
  },
  gremlin(e, dx, dy, dist, ease, dt) { AI.rabbit(e, dx, dy, dist, ease, dt, 1.25); },
  thief(e, dx, dy, dist, ease, dt) {
    if (e.cornered) return AI.rabbit(e, dx, dy, dist, ease, dt, 1.45);   // nowhere left to run: it fights
    if (e.mode === 'taunt') {                         // hops about waving the journal until you get close
      ease(0, 0, 6);
      if (e.t <= 0) { e.t = rr(1, 2); sfx.cackle(); }
      if (dist < UNIT * 5) {
        e.mode = 'flee';
        const next = THIEF_ROUTE[e.route + 1], ex = sceneDef().exits.find(o => o.to === next);
        const [fx, fy] = ex ? edgePoint(ex.side, (ex.a + ex.b) / 2) : [0.98, 0.5];
        e.lx = fx * W + (fx > 0.9 ? UNIT * 3 : fx < 0.1 ? -UNIT * 3 : 0); e.ly = fy * H + (fy > 0.9 ? UNIT * 3 : fy < 0.1 ? -UNIT * 3 : 0);
        say('It\'s getting away!', e.x, e.y - UNIT * 1.3, { key: 'thief', life: 1.5 });
      }
    } else if (e.mode === 'flee') {                  // too quick to catch: it always makes the next screen
      const tx = e.lx - e.x, ty = e.ly - e.y, td = Math.hypot(tx, ty) || 1;
      ease(tx / td * 0.75 * L(), ty / td * 0.75 * L(), 8);
      if (td < UNIT * 0.8 || e.x < -UNIT * 2 || e.x > W + UNIT * 2 || e.y < -UNIT * 2 || e.y > H + UNIT * 2) {
        e.dead = true; e.mode = 'dead'; e.t = 0; state.inv.thiefAt = Math.min(THIEF_ROUTE.length - 1, e.route + 1);
        say('Gone again. Follow the dropped pages.', state.hero.x, state.hero.y - UNIT * 1.2, { key: 'thief', life: 2.5 });
      }
    }
  },
  rabbit(e, dx, dy, dist, ease, dt, fast = 1) {
    switch (e.mode) {
      case 'idle':
        ease(0, 0, 4);
        if (e.t <= 0) { e.t = rr(0.5, 1.2); const a = Math.random() * 6.28; e.vx = Math.cos(a) * 0.3 * L(); e.vy = Math.sin(a) * 0.3 * L(); }
        if (dist < UNIT * 5 && e.cool <= 0) { e.mode = 'dart'; e.t = 1.1; }
        break;
      case 'dart': {
        const zig = Math.sin(state.time * 14) * 0.7, px = -dy / dist, py = dx / dist;
        ease((dx / dist + px * zig) * 0.6 * fast * L(), (dy / dist + py * zig) * 0.6 * fast * L(), 8);
        if (e.t <= 0) { e.mode = 'flee'; e.t = 0.8; e.cool = 1.5; }
        break;
      }
      case 'flee': ease(-dx / dist * 0.45 * L(), -dy / dist * 0.45 * L(), 6); if (e.t <= 0) { e.mode = 'idle'; e.t = 0.5; } break;
    }
  },
  diver(e, dx, dy, dist, ease, dt) {
    const h = state.hero;
    switch (e.mode) {
      case 'ceiling':
        e.hgt = 1;
        ease(dx / dist * 0.22 * L(), dy / dist * 0.22 * L(), 2);
        if (e.t <= 0 && dist < UNIT * 3) {
          e.mode = 'descend'; e.t = 0.9;
          e.lx = h.x + h.vx * 0.25; e.ly = h.y + h.vy * 0.25;
          e.vx = 0; e.vy = 0; e.parried = false;
          sfx.skitter(panOf(e.x));
        }
        break;
      case 'descend':
        e.x += (e.lx - e.x) * (1 - Math.exp(-10 * dt)); e.y += (e.ly - e.y) * (1 - Math.exp(-10 * dt));
        e.hgt = Math.max(0, e.t / 0.9);
        if (!e.parried && e.t < 0.28 && slashActive() && dist < UNIT * 1.9 && !state.inv.scalp) { e.parried = true; e.hgt = 0; parry(e); break; }
        if (e.t <= 0) {
          e.hgt = 0;
          spark(e.x, e.y, '#4b3558', 8, 3);
          if (dist < UNIT * 1.1 && h.z < UNIT * 0.5) {
            if (state.inv.scalp) {
              sfx.boing(); e.mode = 'stunned'; e.t = 1.6;
              zoomPulse(h.x, h.y, 'parry');
              say('Bonk! The scalp takes it.', h.x, h.y - UNIT * 1.2, { key: 'bonk', life: 1.8 });
              break;
            }
            hurtHero(e.dmg, e.x, e.y);
          }
          e.mode = 'floor'; e.t = 1.3;
          spinWeb(e.x, e.y);
        }
        break;
      case 'floor': ease(0, 0, 4); if (e.t <= 0) { e.mode = 'ascend'; e.t = 0.6; } break;
      case 'ascend': e.hgt = 1 - Math.max(0, e.t) / 0.6; ease(0, 0, 6); if (e.t <= 0) { e.mode = 'ceiling'; e.t = rr(2, 3.5); } break;
    }
    if (e.mode === 'stunned') e.hgt = 0;
  },
  lurker(e, dx, dy, dist) {
    const p = e.pool, h = state.hero;
    if (!p) return;
    switch (e.mode) {
      case 'submerged': {
        e.x = p.x; e.y = p.y;
        if (e.cool <= 0 && Math.hypot(h.x - p.x, h.y - p.y) < p.r + UNIT * 2.6) {
          const a = Math.atan2(h.y - p.y, h.x - p.x);
          e.x = p.x + Math.cos(a) * p.r * 0.7; e.y = p.y + Math.sin(a) * p.r * 0.7;
          e.mode = 'ripple'; e.t = 0.8; sfx.bubble();
        }
        break;
      }
      case 'ripple': if (e.t <= 0) { e.mode = 'bite'; e.t = 0.3; e.parried = false; sfx.splash(); spark(e.x, e.y, '#6a8a8a', 10, 3); } break;
      case 'bite':
        if (!e.parried && slashActive() && dist < UNIT * 1.9) { e.parried = true; parry(e); break; }
        if (e.t <= 0) { if (dist < UNIT * 1.5 && state.hero.z < UNIT * 0.5) hurtHero(e.dmg, e.x, e.y); e.mode = 'risen'; e.t = 1.2; }
        break;
      case 'risen': if (e.t <= 0) { e.mode = 'sink'; e.t = 0.4; } break;
      case 'sink': if (e.t <= 0) { e.mode = 'submerged'; e.cool = rr(1.5, 3); } break;
    }
  },
  warden(e, dx, dy, dist, ease) {
    const h = state.hero, fast = e.enraged ? 1.25 : 1;
    switch (e.mode) {
      case 'dormant':
        if (h.x > W * 0.3 && !state.cut) { e.mode = 'talk'; startWardenTalk(e); }
        break;
      case 'talk': ease(0, 0, 8); break;
      case 'intro': if (e.t <= 0) { state.cam.focus = null; e.mode = 'prowl'; e.t = 1.2; } break;
      case 'prowl':
        ease(dx / dist * 0.16 * fast * L(), dy / dist * 0.16 * fast * L(), 3);
        if (e.t <= 0) {
          if (dist > UNIT * 5 || Math.random() < 0.5) { e.mode = 'aim'; e.t = 0.8 / fast; sfx.snort(); }
          else { e.mode = 'rear'; e.t = 0.7 / fast; sfx.growl(); }
        }
        break;
      case 'aim':
        ease(0, 0, 8);
        if (e.t > 0.25) { e.lx = dx / dist; e.ly = dy / dist; }
        if (e.t <= 0) { e.mode = 'charge'; e.t = 1.1; e.vx = e.lx * 0.9 * fast * L(); e.vy = e.ly * 0.9 * fast * L(); }
        break;
      case 'charge': if (e.t <= 0) { e.mode = 'recover'; e.t = 0.9; } break;
      case 'rear':
        ease(0, 0, 8);
        if (e.t <= 0) {
          sfx.crash(); state.shake = 0.6; zoomPulse(e.x, e.y, 'kill');
          state.rings.push({ x: e.x, y: e.y, t: 0, dur: 0.9, r0: e.r, r1: e.r + UNIT * 6, hit: false });
          const n = e.enraged ? 5 : 3;
          for (let i = 0; i < n; i++) {
            const a = Math.random() * 6.28, d = i === 0 ? 0 : UNIT * rr(1, 3.2);
            state.hazards.push({ x: Math.max(UNIT, Math.min(W - UNIT * 3, h.x + Math.cos(a) * d)), y: Math.max(UNIT, Math.min(H - UNIT, h.y + Math.sin(a) * d)), t: -i * 0.15, dur: 1.0, r: UNIT * 0.8 });
          }
          e.mode = 'recover'; e.t = 1.1;
        }
        break;
      case 'recover': ease(0, 0, 5); if (e.t <= 0) { e.mode = 'prowl'; e.t = rr(1.0, 2.0) / fast; } break;
    }
  },
};

// something lunging into a stalagmite shakes the stalactites above loose
function quake(sg, e) {
  if ((state.stalCool[sg.key] || 0) > state.time) return;
  state.stalCool[sg.key] = state.time + 6;
  sfx.crash(); state.shake = 0.5;
  const n = e.type === 'warden' ? 3 : 1;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, d = i ? UNIT * rr(0.2, 0.7) : 0;
    state.hazards.push({ x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, t: -0.25 - i * 0.12, dur: 0.75, r: UNIT * 0.75, edmg: e.type === 'warden' ? 3 : 3, kind: 'stalactite' });
  }
  say('The ceiling shakes loose!', sg.x, sg.y - UNIT * 1.6, { key: 'quake', tip: 'quake', life: 2.5 });
}
// falling rocks and shockwaves from the boss
function updateHazards(dt) {
  const h = state.hero;
  for (let i = state.hazards.length - 1; i >= 0; i--) {
    const z = state.hazards[i];
    z.t += dt;
    if (z.t >= z.dur) {
      state.hazards.splice(i, 1);
      sfx.crash(); spark(z.x, z.y, '#7a6a5a', 8, 3); state.shake = Math.max(state.shake, 0.15);
      if (z.edmg) for (const e of state.enemies) if (!e.dead && e.mode !== 'ceiling' && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) {
        damage(e, z.edmg, 'fire', 0, 1); if (!e.dead) { e.mode = 'stunned'; e.t = e.type === 'warden' ? 2.2 : 1.4; }
        zoomPulse(e.x, e.y, 'kill');
      }
      if (state.whirl && Math.hypot(h.x - z.x, h.y - z.y) < z.r + UNIT * 1.6) endWhirl('knocked');
      if (Math.hypot(h.x - z.x, h.y - z.y) < z.r + UNIT * 0.4 && h.z < UNIT * 0.5) {
        if (state.inv.scalp) { sfx.boing(); say('Bonk! The scalp takes it.', h.x, h.y - UNIT * 1.2, { key: 'bonk', life: 1.8 }); zoomPulse(h.x, h.y, 'parry'); }
        else hurtHero(1, z.x, z.y);
      }
    }
  }
  for (let i = state.rings.length - 1; i >= 0; i--) {
    const g = state.rings[i];
    g.t += dt;
    const rad = g.r0 + (g.r1 - g.r0) * (g.t / g.dur);
    if (!g.hit && h.dashT <= 0 && h.z < UNIT * 0.3 && Math.abs(Math.hypot(h.x - g.x, h.y - g.y) - rad) < UNIT * 0.45) { g.hit = true; if (state.whirl) endWhirl('knocked'); hurtHero(1, g.x, g.y); }
    if (g.t >= g.dur) state.rings.splice(i, 1);
  }
}

// =====================================================================
// Water drips (cave)
// =====================================================================
function updateDrips(dt) {
  state.dripTimer -= dt;
  if (state.dripTimer <= 0) {
    state.dripTimer = 0.5 + Math.random() * 1.8;
    const x = Math.random() * W, landY = H * (0.08 + Math.random() * 0.9);
    state.drops.push({ x, y: landY - H * (0.25 + Math.random() * 0.45), landY, vy: H * 0.2 });
  }
  const g = H * 2.6;
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i];
    d.vy += g * dt; d.y += d.vy * dt;
    if (d.y >= d.landY) {
      state.drops.splice(i, 1);
      const bits = Array.from({ length: 3 + (Math.random() * 3 | 0) }, () => {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = UNIT * (1.5 + Math.random() * 2.5);
        return { x: d.x, y: d.landY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp };
      });
      state.splashes.push({ x: d.x, y: d.landY, t: 0, bits });
      sfx.drip(panOf(d.x));
    }
  }
  for (let i = state.splashes.length - 1; i >= 0; i--) {
    const s = state.splashes[i];
    s.t += dt;
    for (const b of s.bits) { b.vy += UNIT * 14 * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
    if (s.t > 0.7) state.splashes.splice(i, 1);
  }
}

// =====================================================================
// The meadow bird: calls now and then, always flies off when you come near
// =====================================================================
// perch = a branch tip of a dead tree; the first dead tree has the hollow the robin lives in
function perchPoint(i) { const p = WORLD.meadow.feat.perches[i]; return [p[0] * W + UNIT * 0.55 * (i % 2 ? -1 : 1), p[1] * H - UNIT * 1.45]; }
function hollowPoint() { const p = WORLD.meadow.feat.perches[0]; return [p[0] * W, p[1] * H - UNIT * 0.9]; }
function makeBird() { return { mode: 'home', p: 0, x: hollowPoint()[0], y: hollowPoint()[1], z: 0, vx: 0, vy: 0, t: rr(1, 3), gx: 0, gy: 0 }; }
function flyTo(b, gx, gy, z0, z1, dur, then) { Object.assign(b, { sx: b.x, sy: b.y, gx, gy, z0, z1, t: dur, dur, mode: 'glide', then }); }
function flushBird(x, y) {
  const b = state.bird, [hx, hy] = hollowPoint();
  if (!b || b.mode !== 'home' || Math.hypot(hx - x, hy + UNIT * 0.9 - y) > UNIT * 3.5) return;
  b.x = hx; b.y = hy; b.mode = 'perch';               // out of the hole it comes...
  spark(hx, hy, 'rgba(160,120,80,.9)', 8, 2);
  scareBird(hx, hy, 1);                               // ...in a flap of feathers, maybe dropping a seed
}
function scareBird(x, y, range) {
  const b = state.bird;
  if (!b || b.mode !== 'perch' || Math.hypot(b.x - x, b.y - y) > UNIT * range) return;
  const a = Math.atan2(b.y - y, b.x - x) + rr(-0.5, 0.5);
  b.mode = 'fly'; b.vx = Math.cos(a) * 0.35 * L(); b.vy = Math.sin(a) * 0.35 * L() - UNIT * 2;
  sfx.flap(panOf(b.x)); sfx.chirp(panOf(b.x));
  // in Pip's garden lesson the first try always works; after that it's the usual chance, and Pip cheers you on
  const lesson = state.inv.story === STORY.garden;
  let drop = Math.random() < 0.4;
  if (lesson && !state.inv.firstBirdSeed) { drop = true; state.inv.firstBirdSeed = true; }
  if (drop) { state.items.push({ type: 'seed', x: b.x, y: b.y + UNIT * 1.4 }); spark(b.x, b.y + UNIT, '#c9a86a', 3, 1); }
  else if (lesson && state.pip && state.pip.show) {
    const p = state.pip; say(['Doesn\'t always work. Let\'s try again!', 'Nothing! Doesn\'t always work. Again!', 'Ha, not this time. Wait for it to come back.'][Math.floor(Math.random() * 3)], p.x, p.y - UNIT * 1.3, { key: 'pip', life: 2.6, color: '#bfe4ff' });
  }
}
function updateBird(dt) {
  const b = state.bird, h = state.hero;
  b.t -= dt;
  if (b.mode === 'home') {                        // hidden in the hollow; pops out when it's quiet
    if (b.t <= 0 && Math.hypot(h.x - b.x, h.y - b.y) > UNIT * 5) {
      b.p = Math.floor(Math.random() * 3);
      const [gx, gy] = perchPoint(b.p);
      [b.x, b.y] = hollowPoint();
      sfx.flap(panOf(b.x));
      flyTo(b, gx, gy, 0, 0, 0.9, 'perch');
    } else if (b.t <= 0) b.t = 2;
    return;
  }
  if (b.mode === 'glide') {
    const p = 1 - Math.max(0, b.t) / b.dur, e = p * (2 - p);
    b.x = b.sx + (b.gx - b.sx) * e; b.y = b.sy + (b.gy - b.sy) * e; b.z = b.z0 + (b.z1 - b.z0) * e + Math.sin(p * Math.PI) * UNIT * 0.8;
    if (b.t <= 0) { b.mode = b.then; b.z = 0; b.t = b.then === 'home' ? rr(5, 9) : rr(1, 3); if (b.then === 'perch') sfx.chirp(panOf(b.x)); }
    return;
  }
  if (b.mode === 'perch') {
    if (b.t <= 0) {
      b.t = rr(3, 8);
      sfx.chirp(panOf(b.x));
      state.fx.push({ x: b.x + UNIT * 0.3, y: b.y - UNIT * 0.4, vx: UNIT * 0.4, vy: -UNIT * 0.8, t: 0, life: 1.4, color: 'note' });
    }
    scareBird(h.x, h.y, 3.5);
  } else if (b.mode === 'fly') {
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += UNIT * 4 * dt;
    if (b.z > UNIT * 8 || b.x < -UNIT * 4 || b.x > W + UNIT * 4 || b.y < -UNIT * 6 || b.y > H + UNIT * 4) { b.mode = 'away'; b.t = rr(6, 10); }
  } else if (b.mode === 'away') {
    if (b.t <= 0) {                                // comes home to the hollow
      const [gx, gy] = hollowPoint();
      b.x = Math.random() < 0.5 ? -UNIT * 3 : W + UNIT * 3; b.y = Math.random() * H * 0.6; b.z = UNIT * 6;
      flyTo(b, gx, gy, UNIT * 6, 0, 2.2, 'home');
    }
  }
}

// floating text timers
function updateTexts(dt) {
  if (!state.title && state.titleQ && state.titleQ.length && !speakingNow()) {
    const t = state.titleQ.shift();
    if (t.style !== 'area' || state.time - t.at < 8) { t.t = 0; state.title = t; }   // stale place names are dropped
  }
  for (let i = state.texts.length - 1; i >= 0; i--) { const t = state.texts[i]; t.t += dt; if (t.t > t.life) state.texts.splice(i, 1); }
  if (state.title) { state.title.t += dt; if (state.title.t > state.title.life) state.title = null; }
}
