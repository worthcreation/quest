// ===== actions.js: Throwing (acorns on their key, carried rocks on F), the R wheel and lane wheels, abilities (fire, dodge), shots.
function dropRock() {                               // set down a step ahead, the way you face
  const h = state.hero;
  state.carry = null;
  const x = h.x + h.fx * UNIT * 0.9, y = h.y + h.fy * UNIT * 0.9 + UNIT * 0.15;
  if (inMud(x, y)) sinkRock(x, y); else state.items.push({ type: 'bigrock', x, y });
  sfx.land(); refreshButtons();
}
// The wheel (hold R): every consumable you carry, for use right now. Hold R and press A, S, D or F: everything
// that could go in that slot; let go of R to put the highlighted one there. Both lists come from slotOptions().
function radialOptions(slot) {
  if (slot) return [...slotOptions().filter(e => laneAllows(slot, e)), { kind: 'none', id: 'none' }];
  return consumableOptions();
}
function radialLabel(o, slot) {
  if (o.kind === 'none') return `Empty ${slotLabel(slot)}`;
  const i = entryInfo(o), n = entryCount(o);
  if (slot) return `${slotLabel(slot)}: ${i.name}${o.kind === 'weapon' && o.id === 'sword' || o.kind === 'ability' ? '' : ' ' + n}`;
  return `${i.verb} ${i.name.toLowerCase()} (${n})`;
}
function applyRadial(r) {
  const opt = r.opts[r.sel];
  if (!opt) return;
  if (r.slot) { setSlot(r.slot, opt.kind === 'none' ? null : opt); sfx.tock(); const h = state.hero; say(radialLabel(opt, r.slot), h.x, h.y - UNIT * 1.2, { key: 'equip', life: 1.1, color: '#ffe38a' }); }
  else useEntry(opt);
}
// tap R: the F slot steps through your weapons
function cycleEquip() {
  const ws = slotOptions().filter(e => e.kind === 'weapon' && e.id !== 'acorn');   // tap R: between your blades
  if (!ws.length) return;
  const f = slotsOf().f, i = ws.findIndex(e => sameEntry(e, f)), next = ws[(i + 1) % ws.length];
  if (sameEntry(next, f)) return;
  setSlot('f', next); sfx.tock();
  const h = state.hero; say(radialLabel(next, 'f'), h.x, h.y - UNIT * 1.2, { key: 'equip', life: 0.9, color: '#ffe38a' });
}

// =====================================================================
// Abilities: dash, eat, throw, marsh fire. All draw on vigor.
// =====================================================================
function updateAbilities(dt) {
  const h = state.hero, inv = state.inv;
  let wantDodge = false;
  // A and S: a tap uses what's there (on release, so a hold can mean something else); a hold opens that lane's wheel.
  // D uses on press as before (holding D aims a throw).
  const LH = state.laneHold || (state.laneHold = {});
  if (state.swapT == null) for (const k of ['a', 's']) {
    const act = SLOT_ACTION[k], down = held[act]();
    if (pressedNow[act] && !state.radial) LH[k] = { t0: state.time, open: false };
    const L = LH[k]; if (!L) continue;
    if (down && !L.open && state.time - L.t0 > 0.22 && laneOptions(k).length) {
      L.open = true; const cur = laneOptions(k).findIndex(e => sameEntry(e, slotsOf()[k]));
      state.radial = { slot: k, lane: true, opts: laneOptions(k), sel: Math.max(0, cur) }; sfx.tock();
    }
    if (!down) {
      if (L.open && state.radial && state.radial.lane) { applyRadial(state.radial); state.radial = null; }
      else if (!L.open && !state.actUsed) { const r = useSlot(k); if (r === 'dodge') wantDodge = true; }
      LH[k] = null;
    }
  }
  if (laneOptions('s').length >= 3 && !state.tipsSeen.lanes) {   // once you have a choice, say how to make it
    state.tipsSeen.lanes = true; sayHero(`Tap ${slotLabel('s')} or ${slotLabel('a')} to use. Hold one to pick what it holds.`, { life: 4.5, color: '#ffe38a' });
  }
  if (state.radial && state.radial.lane) {                 // steering the lane wheel
    let x = 0, y = 0; if (held.up()) y -= 1; if (held.down()) y += 1; if (held.left()) x -= 1; if (held.right()) x += 1;
    const R = state.radial; if (x || y) { const n = R.opts.length, a = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2); R.sel = Math.round(a / (Math.PI * 2 / n)) % n; }
  }
  if (!state.radial && state.swapT == null && pressedNow[SLOT_ACTION.d] && !state.actUsed) { const r = useSlot('d'); if (r === 'dodge') wantDodge = true; }
  if (state.fSlotAbility === 'dodge') wantDodge = true;              // F holding the dodge
  state.fSlotAbility = null;
  if (wantDodge && inv.step && h.dashCool <= 0 && !h.ride && !state.pull.grip && !state.carry && spend(inv.step >= 3 ? 0.6 : 1.2)) {
    h.dashT = inv.step >= 3 ? 0.22 : 0.18; h.dashCool = inv.step >= 2 ? 0.5 : 0.85; h.invuln = Math.max(h.invuln, inv.step >= 3 ? 0.45 : 0.3);
    h.vx = h.fx * 1.2 * L(); h.vy = h.fy * 1.2 * L();
    state.dodged = false;
    sfx.dash();
  }
  // R: tap steps F through your weapons; hold opens the wheel of consumables (the world all but stops);
  // while holding, A/S/D/F switches the wheel to everything that could go in that slot. Point, then let go of R.
  if (pressedNow.swap && !state.carry && !(state.radial && state.radial.lane)) state.swapT = state.time;
  if (state.swapT != null) {
    if (held.swap()) {
      const pick = ALL_SLOTS.find(k => pressedNow[SLOT_ACTION[k]]);
      if (pick) state.radial = { slot: pick, opts: radialOptions(pick), sel: -1 };
      else if (!state.radial && state.time - state.swapT > 0.22 && radialOptions().length) state.radial = { slot: null, opts: radialOptions(), sel: -1 };
      if (state.radial) {
        const R = state.radial, cur = R.slot ? R.opts.findIndex(e => sameEntry(e, slotsOf()[R.slot])) : -1;
        if (pick && cur >= 0) R.sel = cur;                         // start on what's there now
        let x = 0, y = 0;
        if (state.radialPtr) [x, y] = state.radialPtr;
        else { if (held.up()) y -= 1; if (held.down()) y += 1; if (held.left()) x -= 1; if (held.right()) x += 1; }
        if (x || y) { const n = R.opts.length, a = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2); R.sel = Math.round(a / (Math.PI * 2 / n)) % n; }
      }
    } else {
      const r = state.radial;
      if (r) { if (r.sel >= 0) applyRadial(r); }
      else cycleEquip();
      state.radial = null; state.swapT = null; state.radialPtr = null;
    }
  }
  if (state.equip === 'acorn' && inv.acorns <= 0 && inv.sword) { state.equip = 'sword'; state.active = 'sword'; }
  // F throws whatever you hold: tap for a quick short throw (a rock is just set down ahead of you),
  // hold to wind up: longer holds throw faster, farther and harder. Rocks show where they'll land.
  // A carried rock throws with F. Acorns throw with their own key (D), on their own: you can wind up an acorn and
  // swing your blade at the same time.
  const aSlot = ALL_SLOTS.find(k => slotsOf()[k] && slotsOf()[k].id === 'acorn'), tk = state.carry === 'rock' ? 'act' : aSlot && SLOT_ACTION[aSlot];
  const rock = state.carry === 'rock', acorn = !state.carry && !!aSlot && inv.acorns > 0;
  if ((rock || acorn) && !state.pull.grip && !state.npcTalk && !state.radial) {
    // a throw only starts from a fresh press: not the press that picked the rock up, planted, talked, etc.
    if (pressedNow[tk] && h.z <= 0 && !state.aim.on && !(rock && state.actUsed) && state.time - (state.carryT || -9) > 0.1) { state.aim.on = true; state.aim.t = 0; }
    if (state.aim.on) {
      if (held[tk]()) state.aim.t += dt;
      else {
        const k = Math.min(throwPower(), h.vig <= 1 ? 0.1 : 1), tap = state.aim.t < 0.18;   // spent arms can't throw hard
        state.aim.on = false; state.aim.t = 0;
        if (rock && tap) dropRock();
        else if (rock) { state.carry = null; spend(0.6 + k * 0.8) || true; launch('rock', k); refreshButtons(); }
        else if (spend(0.1 + k * 0.3)) { inv.acorns--; state.slotLit = state.time; launch('acorn', k); refreshButtons(); }
      }
    }
  } else state.aim.on = false;
  // marsh fire: breathe out gas while held, spark it on release
  const fh = state.fireHold;
  if (inv.fire && (held.fire() || slotHeld('fire')) && !state.carry && !state.pull.grip) {
    if (!fh.on) { fh.on = true; fh.emit = 0; fh.t = 0; sfx.hiss(); }
    fh.t = (fh.t || 0) + dt;
    if (h.vig > 0.3) {
      h.vig = Math.max(0, h.vig - 2.4 * dt); h.rest = state.time; train(2.4 * dt);
      const mv = maxVig();
      fh.emit += (8 + mv * 0.5) * dt;
      while (fh.emit >= 1) { fh.emit--; breathe(h, mv); }
      if (Math.random() < dt * 5) sfx.hiss();
    } else spend(99);
  } else if (fh.on) {
    fh.on = false;
    state.spark = { x: h.x + h.fx * UNIT * 1.2, y: h.y + h.fy * UNIT * 1.2, t: state.time + 0.35 };
    sfx.spark();
    spark(state.spark.x, state.spark.y, '#ffe38a', 5, 2);
  }
}
function breathe(from, mv) {
  const face = Math.atan2(from.fy, from.fx), hot = (state.inv.pepper > 0 ? 1.4 : 1) * (1 + state.inv.up.pouch * 0.15);
  const still = Math.hypot(from.vx, from.vy) < 0.04 * L();
  if (still) {
    // standing still, the cloud pools around you and swells the longer you breathe
    const grow = Math.min(2.8, 1 + state.fireHold.t * 0.35);
    const a = Math.random() * 6.28, rad = UNIT * (0.4 + Math.random() * (1 + mv * 0.03) * grow);
    const p = spawnPuff(from.x, from.y, Math.cos(a) * UNIT * 0.8, Math.sin(a) * UNIT * 0.8, UNIT * (0.7 + mv * 0.02) * rr(0.8, 1.2) * hot * Math.sqrt(grow));
    if (p) { p.anchor = true; p.ox = Math.cos(a) * rad; p.oy = Math.sin(a) * rad; }
    return;
  }
  // on the move, the gas is left behind as a trail that hangs in the air until it thins out
  const a = Math.random() * 6.28, sp = UNIT * rr(0.2, 0.7);
  const p = spawnPuff(from.x - from.vx * 0.05 + Math.cos(a) * UNIT * 0.3, from.y - from.vy * 0.05 + Math.sin(a) * UNIT * 0.3, Math.cos(a) * sp - from.vx * 0.15, Math.sin(a) * sp - from.vy * 0.15, UNIT * (0.6 + mv * 0.02) * rr(0.8, 1.15) * hot);
  if (p) p.trail = true;
}

// ---------------- projectiles (rocks, acorns) ----------------
// holding the throw winds it up over about a second: farther and harder the longer you hold
const throwPower = () => Math.min(1, state.aim.t / 1.0);
function throwParams(kind, k) {
  if (kind === 'rock') return { sp: 3 + 4.5 * k, vz: 3 + 2.5 * k, z: 1.2, g: 14 };
  const silk = state.inv.silk ? 1.35 : 1;
  return { sp: (6 + 9 * k) * silk, vz: 1.5 + 1.5 * k, z: 0.6, g: state.inv.silk ? 5 : 8 };
}
function rockLanding(h, k = throwPower()) {
  const T = throwParams('rock', k), t = (T.vz + Math.sqrt(T.vz * T.vz + 2 * T.g * T.z)) / T.g;
  const d = UNIT * (0.6 + T.sp * t);
  return [h.x + h.fx * d, h.y + h.fy * d];
}
function launch(kind, k = 1) {
  state.throwT = state.time;
  const h = state.hero, rock = kind === 'rock';
  const silk = rock ? 0 : state.inv.silk, T = throwParams(kind, k);
  const sp = UNIT * T.sp;
  let dx = h.fx, dy = h.fy;
  if (!rock) { const a = Math.atan2(h.fy, h.fx) + acornSpread(); dx = Math.cos(a); dy = Math.sin(a); skillUse('acorn'); }
  state.shots.push({ kind, x: h.x + h.fx * UNIT * 0.6, y: h.y + h.fy * UNIT * 0.6, vx: dx * sp, vy: dy * sp, z: UNIT * T.z, vz: UNIT * T.vz, g: UNIT * T.g, spin: 0, silk, hit: new Set(), force: 0.6 + 0.8 * k });
  sfx.throw();
  if (rock) state.shake = 0.1;
  if (state.bird) scareBird(h.x, h.y, 6);
}
function updateShots(dt) {
  for (let i = state.shots.length - 1; i >= 0; i--) {
    const s = state.shots[i], rock = s.kind === 'rock';
    if (!rock) steerAcorn(s, dt);
    s.x += s.vx * dt; s.y += s.vy * dt; s.vz -= s.g * dt; s.z += s.vz * dt; s.spin += dt * 12;
    let done = s.z <= 0 || s.x < -UNIT || s.x > W + UNIT || s.y < -UNIT || s.y > H + UNIT;
    if (rock && s.z <= 0) {                             // a rock that comes down on a stone, brambles, a burrow or a buried rock
      for (const o of state.solids) if (o.bar && ['cracked', 'bramble', 'burrow'].includes(o.kind) && Math.hypot(o.x - s.x, o.y - s.y) < o.r + UNIT * 0.45) { if (o.kind === 'bramble') breakBarrier(o.bar, 'rock'); else hitStone(o, s.force); break; }
      knockRocks(s.x, s.y, UNIT * 1.2);
    }
    for (const e of state.enemies) {
      if (done || s.hit.has(e) || !hittable(e) || Math.hypot(e.x - s.x, e.y - s.y) > e.r + UNIT * 0.3) continue;
      const d = Math.hypot(s.vx, s.vy) || 1;
      s.hit.add(e);
      if (!rock) skillUse('acorn', true);
      if (!rock && wears('embercharm')) { e.burn = Math.max(e.burn || 0, 2); spark(e.x, e.y, '#ffa04a', 6, 2); }   // the ember charm lights them
      damage(e, (rock ? 3 : s.silk ? 2 : 1) * s.force * power(), rock ? 'stab' : 'slash', s.vx / d, s.vy / d, s.force > 1.2 && SMALL.includes(e.type));
      if (s.silk >= 3 && !e.dead) { e.mode = 'stunned'; e.t = 1.2; }
      if (!(s.silk >= 2)) done = true;
    }
    if (!done) for (const o of state.solids) {        // high throws sail over low stones; thickets and boulder piles stand tall
      if (s.z > UNIT * (o.bar ? 3 : ['tree', 'deadtree'].includes(o.kind) ? 2.6 : o.kind === 'stone' ? 0.45 : 0.7)) continue;   // trees and thickets stand tall; ring stones are low
      if (Math.hypot(o.x - s.x, o.y - s.y) > o.r + UNIT * 0.2) continue;
      if (rock && o.bar && o.kind === 'bramble') breakBarrier(o.bar, 'rock');
      else if (rock && o.bar && (o.kind === 'cracked' || o.kind === 'burrow')) hitStone(o, s.force);
      else if (o.kind === 'tree') { state.treeShake[o.key] = state.time; sfx.rustle(); if (rock || rng() < 0.35) dropAcorn(o); if (!rock) sfx.tock(); }
      else if (!rock) sfx.tock();
      s.x -= s.vx * dt * 2; s.y -= s.vy * dt * 2;
      done = true; break;
    }
    if (state.bird && Math.hypot(state.bird.x - s.x, state.bird.y - s.y) < UNIT * 2) scareBird(s.x, s.y, 3);
    if (done) {
      state.shots.splice(i, 1);
      if (rock && inMud(s.x, s.y)) sinkRock(s.x, s.y);     // short of the mark and into the mud: stuck
      else if (rock && earthen(s.x, s.y) && Math.random() < 0.2) sinkRock(s.x, s.y, 'earth');   // or it digs into soft ground
      else if (rock) { state.items.push({ type: 'bigrock', x: Math.max(UNIT, Math.min(W - UNIT, s.x)), y: Math.max(UNIT, Math.min(H - UNIT, s.y)) }); sfx.crash(); state.shake = 0.2; spark(s.x, s.y, '#8a7a6a', 8, 2.5); }
      else if (Math.random() < 0.35) state.items.push({ type: 'acorn', x: s.x, y: s.y });
      if (state.scene === 'start' && rock && !broken('start', 'thicket')) say('Maybe if it hit the thicket...', s.x, s.y - UNIT, { key: 'rockhint', life: 2.5, tip: 'rockhint' });
      if (state.scene === 'w3' && rock && !broken('w3', 'swordthorns')) say('Thorns. A thrown rock broke the last lot.', s.x, s.y - UNIT, { key: 'rockhint3', life: 2.5, tip: 'rockhint3' });
    }
  }
}

// ---------------- marsh fire: a cloud of gas that catches and spreads ----------------
function spawnPuff(x, y, vx, vy, rMax) {
  if (state.gas.length > 170) return null;
  const p = { x, y, vx, vy, r: UNIT * 0.2, rMax, age: 0, life: rr(9, 13), ign: null, burn: 0, burnDur: rr(1.2, 2.0) };
  state.gas.push(p);
  return p;
}
function windNow() {
  const sc = sceneDef();
  if (sc.gusts) { const [wx, wy] = gustVec(); const k = 0.1 + state.gust * 0.5; return [wx * k * L(), wy * k * L()]; }
  if (sc.breeze) return [Math.sin(state.time * 0.1) * sc.breeze * L(), sc.breeze * 0.3 * L()];
  return [0, 0];
}
function updateGas(dt) {
  if (!state.gas.length && !state.spark) return;
  const [wx, wy] = windNow(), wmag = Math.hypot(wx, wy) / L();
  if (state.spark && state.time >= state.spark.t) {
    const sp = state.spark; state.spark = null;
    let best = null, bd = UNIT * 2.8;
    for (const p of state.gas) { const d = Math.hypot(p.x - sp.x, p.y - sp.y) - p.r; if (!p.burn && d < bd) { bd = d; best = p; } }
    if (best) { best.ign = state.time; sfx.whumpf(); zoomPulse(best.x, best.y, 'hit'); }
    else say(wmag > 0.05 ? 'The wind scattered the gas.' : 'Fizzle. Nothing to light.', sp.x, sp.y - UNIT, { key: 'fizzle', life: 1.8 });
  }
  const burning = [];
  for (let i = state.gas.length - 1; i >= 0; i--) {
    const p = state.gas[i];
    p.age += dt * (1 + wmag * 6);               // wind thins the cloud fast
    const k = Math.exp(-2 * dt);
    p.vx *= k; p.vy *= k;
    if (p.anchor) {                                 // a still breather's cloud stays with them, lit or not
      const h = state.hero, ax = h.x + p.ox - p.x, ay = h.y + p.oy - p.y;
      p.vx += ax * 4 * dt; p.vy += ay * 4 * dt;
      if (p.burn && !p.auraSet) { p.auraSet = true; p.burnDur *= 1.8; }
    }
    p.x += (p.vx + wx) * dt; p.y += (p.vy + wy) * dt;
    if (!p.burn) { p.rMax += UNIT * 0.08 * dt; p.r += (p.rMax - p.r) * (1 - Math.exp(-2 * dt)); }
    if (p.ign != null && !p.burn && state.time >= p.ign) p.burn = 0.001;
    if (p.burn) {
      p.burn += dt * (1 + wmag * 4);
      burning.push(p);
      if (Math.random() < dt * 8) state.fx.push({ x: p.x + (Math.random() - 0.5) * p.r, y: p.y, vx: wx * 0.5, vy: -UNIT * 1.5, t: 0, life: 0.6, color: Math.random() < 0.5 ? '#ffb347' : '#ff7a2a' });
      if (p.burn > p.burnDur) { state.gas.splice(i, 1); state.fx.push({ x: p.x, y: p.y, vx: wx * 0.3, vy: -UNIT * 0.5, t: 0, life: 1.4, color: 'smoke', size: p.r }); }
    } else if (p.age > p.life) state.gas.splice(i, 1);
  }
  if (!burning.length) return;
  if (Math.random() < dt * 3) sfx.crackle();
  for (const b of burning) {
    for (const p of state.gas) if (!p.burn && p.ign == null && Math.hypot(p.x - b.x, p.y - b.y) < (p.r + b.r) * 0.8) p.ign = state.time + rr(0.1, 0.25);
    for (const e of state.enemies) {
      if (!hittable(e) || (e.burnCool || 0) > state.time || Math.hypot(e.x - b.x, e.y - b.y) > b.r + e.r) continue;
      e.burnCool = state.time + 0.5;
      e.burn = Math.min(e.type === 'warden' ? 2 : 8, (e.burn || 0) + (state.inv.pepper > 0 ? 1.8 : 1.2) * (1 + state.inv.up.pouch * 0.25));   // it clings; more fire, longer panic
      damage(e, 1, 'fire', 0, 0);
    }
    for (const s of state.solids) if (s.bar && ['reeds', 'web', 'vine'].includes(s.kind) && Math.hypot(s.x - b.x, s.y - b.y) < b.r + s.r) { breakBarrier(s.bar, 'fire'); break; }
    for (const w of state.webs) if (!w.burn && Math.hypot(w.x - b.x, w.y - b.y) < w.r + b.r) igniteWeb(w);
    if (state.bird) scareBird(b.x, b.y, 4);
  }
}
