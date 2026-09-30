// ===== combat.js: Blade combat: slashes, stabs (lunge), whirlwind, pound, sword-skill scaling.

// =====================================================================
// Combat. Tap F = slash (also blocks). Hold and release = stab, which lunges.
// Chain: stab, slash while lunging, then stab again in time, and the next
// stab lunges farther, hits harder, and bowls small things over. Chains to x3.
// =====================================================================
const SLASH = { dur: 0.22, cool: 0.22, reach: 1.7 };
const STAB  = { dur: 0.22, cool: 0.1, reach: 2.2, charge: 0.35, chainCharge: 0.18, knockChance: 0.6 };
// the vigor a sword swing costs (the lunge and the whirlwind have their own costs, below). Tune here.
const SWING_COST = 0.35;
const COMBO = { slashWindow: 0.7, stabWindow: 0.9 };

function updateCombat(dt) {
  const inv = state.inv, h = state.hero;
  // in the air, act slams down: sword or no sword, spinning or not (not when spent)
  if (pressedNow.act && h.z > UNIT * 0.3 && !state.slam && !state.carry && !h.ride && h.vig >= 0.8) {
    state.slam = true; h.vz = -UNIT * 16;
    if (state.whirl) { state.whirl = null; bumpCrazy('Spin dive'); }
    sfx.swoosh(); return;
  }
  if (!bladeKind() || state.pull.grip || h.ride || state.carry || state.time < (state.noSwingUntil || 0)) { if (state.carry) { state.hold.on = false; state.slashBuf = -9; } return; }
  const hold = state.hold, cb = state.combo;
  state.atkCool -= dt;
  const nearPullable = sceneDef().pullables.some(p => !pullLocked(p) && !rtFor(state.scene).pulled.has(p.id) && Math.hypot(h.x - p.fx * W, h.y - p.fy * H) < UNIT * 1.7);
  if (nearPullable) return;
  if (state.slam) return;
  if (state.whirl) { updateWhirl(dt); return; }
  if (pressedNow.act) { hold.on = true; hold.t = 0; hold.charged = false; if (bladeKind() !== 'wood') state.slashBuf = state.time; }   // a wooden sword slashes on release, so a hold can be a clean lunge
  // presses a hair early (mid-stab) are buffered, so you can slash right out of a lunge
  if (state.time - (state.slashBuf ?? -9) < 0.25) {
    if (false && state.time < (state.poundChain || 0)) {    // (a strike right after a pound no longer turns into a whirlwind)
      state.slashBuf = -9; state.poundChain = 0; state.chain.n = 0;
      bumpCrazy('Whirlwind'); startWhirl(); return;
    }
    if (state.atkCool <= 0) {
      if (!spend(SWING_COST)) { state.slashBuf = -9; return; }   // every swing costs a little vigor; too tired, no swing
      state.slashBuf = -9;
      const chained = cb.step === 'stab' && state.time - cb.t < COMBO.slashWindow;
      if (chained) { cb.step = 'slash'; cb.t = state.time; } else { cb.step = null; cb.level = 0; }
      // slashes in rhythm (not too quick, not too slow) swing wider each time, closing toward a full circle;
      // the seventh becomes a spin
      const ch = state.chain, gap = state.time - ch.t;
      ch.n = gap >= WHIRL.min && gap <= WHIRL.max ? ch.n + 1 : 1;
      ch.t = state.time;
      if (ch.n >= WHIRL.chain && bladeKind() === 'wood') ch.n = 0;   // three sticks can't spin: the rhythm just starts over
      if (ch.n >= WHIRL.chain) {
        ch.n = 0;
        if (h.vig >= 3) { startWhirl(); return; }
        heroNote('Too tired to spin', 1.2, { key: 'tired', life: 1.2, color: '#ffb080' });
      }
      if (ch.n >= 2) heroNote('\u2022 '.repeat(ch.n).trim(), 1.2, { key: 'chain', life: 0.55, color: ch.n >= 5 ? '#ffb347' : '#ffe38a' });
      const k = (ch.n - 1) / (WHIRL.chain - 1);
      state.active = 'sword';
      const slow = sluggish();                               // a tired arm swings slowly
      state.atk = { type: 'slash', t: 0, dur: SLASH.dur * (1 + k * 0.6) * slow, hit: new Set(), ax: h.fx, ay: h.fy, level: chained ? cb.level : 0, sweep: 1.25 + (Math.PI - 1.25) * k, n: ch.n };
      state.atkCool = SLASH.cool * slow;
      skillUse('sword');
      if (slow > 1.8) heroNote('Your arm is heavy...', 1.2, { key: 'tired', tip: 'tiredswing', life: 1.5, color: '#ffb080' });
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
      const need = (cb.step === 'slash' ? STAB.chainCharge : STAB.charge) * (1.2 - 0.1 * swordLv()) * sluggish();
      if (!hold.charged && hold.t > need) { hold.charged = true; sfx.charge(); }
    } else {
      if (bladeKind() === 'wood' && !hold.charged) state.slashBuf = state.time;   // let go before the lunge charged: a plain slash
      if (hold.charged && spend(0.6)) {
        const chained = cb.step === 'slash' && state.time - cb.t < COMBO.stabWindow;
        cb.level = chained ? Math.min(3, cb.level + 1) : 0;
        cb.step = 'stab'; cb.t = state.time;
        state.active = 'sword';
        state.atk = { type: 'stab', t: 0, dur: STAB.dur + cb.level * 0.04, hit: new Set(), ax: h.fx, ay: h.fy, level: cb.level, woodBreak: bladeKind() === 'wood' };   // a lunge splits a wooden sword
        skillUse('sword');
        state.atkCool = STAB.cool;
        h.dashT = 0.12 + cb.level * 0.05;                 // the lunge; you can slash out of it
        h.vx = h.fx * (0.75 + cb.level * 0.3) * L(); h.vy = h.fy * (0.75 + cb.level * 0.3) * L();
        if (cb.level) { sfx.flipStrike(); zoomPulse(h.x, h.y, cb.level >= 3 ? 'kill' : 'parry'); heroNote('x' + (cb.level + 1), 1.2, { key: 'combo', life: 0.9, color: '#ffe38a', size: 1 + cb.level * 0.2 }); }
        else sfx.stab();
        heroNote('Stab, then slash while you lunge, then stab again: each chained stab goes farther.', 1.6, { key: 'combotip', tip: 'combo', life: 5 });
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
      hit = along > -e.r && along < UNIT * (STAB.reach * lungeK() + (inv.horn >= 3 ? 0.5 : 0)) + e.r && perp < e.r + UNIT * 0.35;
    }
    if (hit) {
      a.hit.add(e);
      let dmg = a.type === 'slash' ? 1 + inv.up.edge * 0.5 : 2 + inv.up.temper * 0.5;
      if (a.type === 'stab') dmg *= lungeK() + 0.05;
      if (a.type === 'stab' && inv.horn) dmg += 1;
      if (a.type === 'stab' && a.level) dmg *= 1 + a.level * (inv.horn >= 2 ? 0.45 : 0.3);
      if (inv.slime > 0) dmg += 1;
      dmg = (dmg + augBonus(e)) * power() * (bladeKind() === 'wood' ? 0.6 : 1);
      if (a.type === 'stab' && a.woodBreak) dmg = Math.max(dmg, 2.2 * Math.max(0.5, power()));   // a wooden lunge is all or nothing: enough to fell a rabbit (it splits when the lunge ends)
      damage(e, dmg, a.type, dx / d, dy / d, a.type === 'stab' && a.level > 0 && monster(e).small);
      bladeWear(1); skillUse('sword', true);
    }
  }
  if (a.t >= a.dur) {                                   // a wooden sword takes two lunges that land: the first cracks it, the second splits it
    if (a.woodBreak && a.hit.size && bladeKind() === 'wood') {
      const inv2 = state.inv; inv2.woodLunges = (inv2.woodLunges || 0) + 1;
      if (inv2.woodLunges >= 2) { inv2.woodLunges = 0; bladeWear(999); }
      else { const h2 = state.hero; say('Crack! One more like that and it\'s kindling.', h2.x, h2.y - UNIT * 1.3, { key: 'wood', life: 2, color: '#d8b888' }); for (let i = 0; i < 6; i++) state.fx.push({ x: h2.x + h2.fx * UNIT, y: h2.y - UNIT * 0.3, vx: (Math.random() - 0.5) * UNIT * 3, vy: -UNIT * Math.random() * 2, t: 0, life: 0.5, color: '#b08a5a' }); }
    }
    state.atk = null;
  }
}
// ---------------- whirlwind: keep it spinning by striking on the beat ----------------
// sword practice (the 'sword' skill, 4 steps) makes the big moves bigger: the whirlwind lasts longer and hits
// harder, and can come round again sooner; the lunge (charged stab) charges quicker, reaches farther, hits harder
const swordLv = () => skillLevel('sword');
const whirlLen = () => 1.2 + 0.45 * swordLv();                    // 1.2 s untrained, 3 s at the top
const whirlHit = () => 0.7 + 0.1 * swordLv();
const whirlRest = () => 8 - 1.5 * swordLv();                     // seconds before you can spin again
const lungeK = () => 0.8 + 0.1 * swordLv();
const WHIRL = { chain: 7, min: 0.26, max: 0.62, length: 3, first: 0.62, window: 0.13, shrink: 0.88, fastest: 0.26, bonus: 0.5 };
function startWhirl() {
  const h = state.hero;
  if (state.time < (state.whirlCool || 0)) { heroNote('Too dizzy to spin again yet.', 1.2, { key: 'tired', life: 1.2, color: '#ffb080' }); return; }
  state.atk = null; state.hold.on = false; state.hold.charged = false;
  spend(1.5);
  state.whirl = { wood: bladeKind() === 'wood', t: 0, end: state.time + whirlLen(), cap: state.time + whirlLen() * 1.6, ang: Math.atan2(h.fy, h.fx), beat: WHIRL.first, next: state.time + WHIRL.first, streak: 0, hit: new Set(), lastRev: 0 };
  sfx.spin(); zoomPulse(h.x, h.y, 'kill'); state.shake = 0.2; cutVines(h);
  heroNote('Whirlwind!', 1.4, { key: 'combo', life: 1, color: '#ffe38a', size: 1.4 });
  say(`A short spin at first; practice makes it last. Strike ${K.act} as the ring closes to spin faster and longer. Jump to glide.`, h.x, h.y + UNIT * 2, { key: 'whirltip', tip: 'whirl', life: 5 });
}
function endWhirl(why) {
  const w = state.whirl, h = state.hero;
  if (!w) return;
  state.whirl = null;
  state.whirlCool = state.time + whirlRest();
  if (w.wood && bladeKind() === 'wood') bladeWear(999);   // three sticks can't take a whirlwind: it flies apart
  if (why === 'done') { h.stun = 0.3; sfx.dizzy(); heroNote('Whew.', 1.2, { key: 'combo', life: 0.8 }); }
  if (why === 'knocked' || why === 'flash') { h.stun = 0.35; state.shake = 0.3; sfx.crash(); heroNote(why === 'flash' ? 'The flash breaks your spin!' : 'Knocked out of your spin!', 1.2, { key: 'combo', life: 1.2 }); }
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
      w.end = Math.min(w.cap || Infinity, w.end + WHIRL.bonus);
      w.beat = Math.max(WHIRL.fastest, w.beat * WHIRL.shrink);
      w.next = state.time + w.beat;
      cutVines(h); sfx.whirlUp(w.streak); zoomPulse(h.x, h.y, w.streak % 4 ? 'tap' : 'parry');
      heroNote('x' + (w.streak + 1), 1.3, { key: 'combo', life: 0.6, color: '#ffe38a', size: 1 + Math.min(0.8, w.streak * 0.08) });
    }
  }
  const reach = UNIT * (1.9 + Math.min(0.8, w.streak * 0.06));
  for (const e of state.enemies) {
    if (w.hit.has(e) || !hittable(e)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
    if (d > reach + e.r) continue;
    w.hit.add(e);
    damage(e, ((1.2 + inv.up.edge * 0.5 + augBonus(e)) * whirlHit() * (1 + w.streak * 0.1) * power() * (bladeKind() === 'wood' ? 0.6 : 1) + (inv.slime > 0 ? 1 : 0)) * crazyMult(), 'slash', dx / d, dy / d, true);   // everything gets thrown back
    bladeWear(1);
  }
  if (Math.random() < 0.5) state.fx.push({ x: h.x + Math.cos(w.ang) * reach * 0.8, y: h.y + Math.sin(w.ang) * reach * 0.6, vx: 0, vy: 0, t: 0, life: 0.25, color: 'rgba(255,245,210,.7)', size: UNIT * 0.2 });
  if (state.bird) scareBird(h.x, h.y, 5);
  scareFlock(h.x, h.y, 5);
}
// ---------------- the crazy combo: whirl, jump, glide, pound, spin, whirl again ----------------
function bumpCrazy(label) {
  const c = state.crazy || (state.crazy = { n: 0, t: -9 }), h = state.hero;
  c.n = state.time - c.t < 2.5 ? c.n + 1 : 1; c.t = state.time;
  if (c.n >= 2) heroNote(`${label}! x${c.n}`, 1.6, { key: 'crazy', life: 1.1, color: c.n >= 5 ? '#ffb347' : '#ffe38a', size: 1 + Math.min(0.8, c.n * 0.1) });
}
const crazyMult = () => { const c = state.crazy; return c && state.time - c.t < 2.5 ? 1 + Math.min(1, c.n * 0.12) : 1; };
function slamDown() {
  const h = state.hero, inv = state.inv, armed = !!bladeKind();
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
  { const pc = state.solids.find(o => o.kind === 'crag' && o.pound && Math.hypot(o.x - h.x, o.y - h.y) < o.r + UNIT * 1.6); if (pc) hitCrag(pc); }   // a boulder that gives to a good stomp
  const ks = state.solids.find(o => o.bar && o.kind === 'cracked' && Math.hypot(o.x - h.x, o.y - h.y) < UNIT * 2.6);
  if (ks) say('It won\'t budge for a stomp. It needs a thrown rock.', ks.x, ks.y - UNIT, { key: 'stonehit', life: 2 });
  scareFlock(h.x, h.y, 6);
  shakeTreesAround(h, UNIT * 2.6);                                               // the thump knocks acorns loose
  poundLoose(h.x, h.y);
}
const slashActive = () => state.atk && state.atk.type === 'slash' && state.atk.t < state.atk.dur;
