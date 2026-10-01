// ===== critters.js: Enemies (the MONSTERS table), damage and kills, the robin, rabbits/flocks, webs, hazards, fx particles.
// =====================================================================
// MONSTERS: one entry per kind. Adding a monster is one entry here plus its draw function in draw-ui.js.
//   stats(u, b)  the fields makeEnemy adds to the base (r, hp, dmg, mode, t ...); b is the base (x, y ...)
//   ai(e, dx, dy, dist, ease, dt)  runs every frame it isn't stunned or panicking (dx, dy: toward the hero)
//   touches(e)   when it hurts the hero on contact (none: never by touch)
//   hittable(e)  when your blade can reach it (none: always, unless dead or the taunter)
//   resume       [mode, t] it picks up in after a stun or a wake
//   afterHit(e)  what it does after it hurt you
//   onHit(e, kind, nx, ny, bowl)  after damage that didn't kill it; return true to skip the usual knockback
//   onKill(e)    after its drop lands; return true to skip the usual kill pulse
//   onParry(e)   return true if it shrugs a parry off
//   parryStun    seconds stunned by a parry (1.2)
//   drop         [[item, chance], ...] tried in order, rarest first
//   draw(e, C, scale), eyes(e, glow, ox, oy)  in draw-ui.js (C(colour) is white while it flashes)
//   small        light enough to bowl over with a heavy stab or a hard throw
//   flags: boss (never respawns, no panic, no falling, hits walls harder), water (stays in its pool, moves only in
//   panic), rooted (no knockback from a parry), flies (its own movement, no walls), slips(e) (passes through
//   everything), airborne(e) (off the ground: no collision, no chasm), crash: false (a lunge into a wall doesn't stun
//   it), slim (fits through gaps you can't)
// =====================================================================
const MONSTERS = {
  stalker: {
    stats: u => ({ r: u * 0.7, hp: 4, dmg: 1, mode: 'sleep', t: rr(1.5, 2.5) }),
    small: true, resume: ['stalk', 0], crash: false,
    touches: e => ['stalk', 'windup', 'lunge', 'recover'].includes(e.mode),
    afterHit: e => { e.mode = 'recover'; e.t = 1.1; e.cool = 1.8; e.vx *= -0.3; e.vy *= -0.3; },
    drop: [['step', 0.1], ['ear', 0.25], ['hide', 0.15], ['ironseed', 0.05], ['wisp', 0.3]],
    draw: drawStalker, eyes: (e, glow, ox, oy) => eyesGlare(e, glow, ox, oy, '#ff3b2a'),
    ai(e, dx, dy, dist, ease) {
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
  },
  charger: {
    stats: u => ({ r: u * 0.75, hp: 5, dmg: 2, mode: 'sleep', t: 1.5 }),
    resume: ['aim', 0.8],
    touches: e => ['aim', 'charge', 'recover'].includes(e.mode),
    afterHit: e => { e.mode = 'recover'; e.t = 1.1; e.cool = 1.8; e.vx *= -0.3; e.vy *= -0.3; },
    drop: [['horn', 0.14], ['ironseed', 0.08], ['wisp', 0.35]],
    draw: drawCharger, eyes: (e, glow, ox, oy) => eyesGlare(e, glow, ox, oy, '#ff8a2a'),
    ai(e, dx, dy, dist, ease) {
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
  },
  diver: {
    stats: u => ({ r: u * 0.55, hp: 3, dmg: 1, mode: 'ceiling', t: rr(1.5, 3.5), hgt: 1 }),
    small: true, rooted: true, resume: ['ascend', 0.6], parryStun: 1.6,
    hittable: e => ['floor', 'stunned', 'ascend'].includes(e.mode),
    airborne: e => e.mode === 'ceiling',
    onHit: stunOnStab,
    drop: [['silk', 0.12], ['ironseed', 0.05], ['wisp', 0.3]],
    draw: drawDiver, eyes: eyesDiver,
    ai(e, dx, dy, dist, ease, dt) {
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
          if (!e.parried && e.t < 0.28 && slashActive() && dist < UNIT * 1.9 && !wears('cap')) { e.parried = true; e.hgt = 0; parry(e); break; }
          if (e.t <= 0) {
            e.hgt = 0;
            spark(e.x, e.y, '#4b3558', 8, 3);
            if (dist < UNIT * 1.1 && h.z < UNIT * 0.5) {
              if (wears('cap')) {
                sfx.boing(); e.mode = 'stunned'; e.t = 1.6;
                zoomPulse(h.x, h.y, 'parry');
                heroNote('Bonk! The scalp takes it.', 1.2, { key: 'bonk', life: 1.8 });
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
  },
  glowworm: {
    stats: u => ({ r: u * 0.4, hp: 1, dmg: 1, mode: 'crawl', t: 0, seg: Math.random() * 6, flashCool: rr(1, 3) }),
    small: true, resume: ['crawl', 0],
    touches: e => e.mode === 'crawl' && e.cool <= 0,
    afterHit: e => { e.cool = 1.5; },
    drop: [['lumin', 0.3], ['emberseed', 0.08]],
    draw: drawGlowworm,
    ai(e, dx, dy, dist, ease, dt) {
      e.seg += 0.1;
      e.flashCool -= dt;
      if (e.mode === 'glowup') {                      // their weapon: a blinding flash
        ease(0, 0, 8);
        if (e.t <= 0) {
          e.mode = 'crawl'; e.flashCool = rr(4, 6);
          sfx.flash(); spark(e.x, e.y, '#f4ffc0', 16, 5);
          if (dist < UNIT * 5.5 && state.whirl) endWhirl('flash');
          if (dist < UNIT * 4.5) {
            if (state.inv.lumin > 0) heroNote('Your own glow shrugs off the flash.', 1, { key: 'blind', life: 1.5 });
            else { state.blind = 1.8; zoomPulse(e.x, e.y, 'hurt'); heroNote('Blinded!', 1, { key: 'blind', life: 1.5, color: '#ffffff' }); }
          }
        }
        return;
      }
      if (dist < UNIT * 3.5 && e.flashCool <= 0) { e.mode = 'glowup'; e.t = 0.8; sfx.charge(); return; }
      if (dist < UNIT * 5 && e.cool <= 0) ease(dx / dist * 0.07 * L(), dy / dist * 0.07 * L(), 2);
      else { if (e.t <= 0) { e.t = 2; const a = Math.random() * 6.28; e.lx = Math.cos(a); e.ly = Math.sin(a); } ease(e.lx * 0.03 * L(), e.ly * 0.03 * L(), 2); }
    },
  },
  rabbit: {
    stats: u => ({ r: u * 0.45, hp: 2, dmg: 1, mode: 'idle', t: rr(0.3, 1) }),
    small: true, resume: ['flee', 0.8],
    touches: e => e.mode === 'dart',
    afterHit: fleeAfterHit,
    onKill: e => { state.inv.rabbitKills = (state.inv.rabbitKills || 0) + 1; },
    drop: [['fluff', 0.3], ['carrot', 0.35], ['thornseed', 0.08], ['carrotseed', 0.12]],
    draw: drawRabbit,
    ai(e, dx, dy, dist, ease, dt, fast = 1) {
      switch (e.mode) {
        case 'idle':
          ease(0, 0, 4);
          if (e.t <= 0) { e.t = rr(0.5, 1.2); const a = Math.random() * 6.28; e.vx = Math.cos(a) * 0.3 * L(); e.vy = Math.sin(a) * 0.3 * L(); }
          if (dist < UNIT * 5 && e.cool <= 0) { e.mode = 'rage'; e.t = 0.55; }   // the tell: it freezes and its eyes flash, then it comes
          break;
        case 'rage': ease(0, 0, 12); if (e.t <= 0) { e.mode = 'dart'; e.t = 1.1; } break;
        case 'dart': {
          const zig = Math.sin(state.time * 14) * 0.7, px = -dy / dist, py = dx / dist;
          ease((dx / dist + px * zig) * 0.6 * fast * L(), (dy / dist + py * zig) * 0.6 * fast * L(), 8);
          if (e.t <= 0) { e.mode = 'flee'; e.t = 0.8; e.cool = 1.5; }
          break;
        }
        case 'flee': ease(-dx / dist * 0.45 * L(), -dy / dist * 0.45 * L(), 6); if (e.t <= 0) { e.mode = 'idle'; e.t = 0.5; } break;
      }
    },
  },
  hare: {                                           // the mountain's rabbit: a size up, a hit tougher, and it snarls before it comes
    stats: u => ({ r: u * 0.58, hp: 3, dmg: 1, mode: 'idle', t: rr(0.3, 1) }),
    small: true, resume: ['flee', 0.8],
    touches: e => e.mode === 'dart',
    afterHit: fleeAfterHit,
    onKill: e => { state.inv.rabbitKills = (state.inv.rabbitKills || 0) + 1; },
    drop: [['fluff', 0.35], ['carrot', 0.4], ['thornseed', 0.08], ['carrotseed', 0.12]],
    draw: (e, C, scale) => { drawRabbit(e, C, scale); drawSnarl(e); },
    ai(e, dx, dy, dist, ease, dt) { MONSTERS.rabbit.ai(e, dx, dy, dist, ease, dt, 1.1); },
  },
  gremlin: {
    stats: u => ({ r: u * 0.42, hp: 2, dmg: 1, mode: 'idle', t: rr(0.3, 1), fast: 1.25 }),
    small: true, slim: true, resume: ['flee', 0.6],
    touches: e => e.mode === 'dart',
    afterHit: fleeAfterHit,
    drop: [['thornseed', 0.1], ['turnipseed', 0.25], ['acorn', 0.3]],
    draw: drawGremlin,
    ai(e, dx, dy, dist, ease, dt) { MONSTERS.rabbit.ai(e, dx, dy, dist, ease, dt, 1.25); },
  },
  thief: {                                          // the gremlin with Pip's journal: runs a route, fights when cornered
    stats: u => ({ r: u * 0.45, hp: 6, dmg: 1, mode: 'taunt', t: 1, fast: 1.45 }),
    resume: ['flee', 0.6],
    hittable: e => !!e.cornered,
    slips: e => !e.cornered,                        // it slips through anything on its way out
    touches: e => e.cornered && e.mode === 'dart',
    afterHit: fleeAfterHit,
    onKill: e => { state.items.push({ type: 'journal', x: e.x, y: e.y }); relicMoment('journal', e.x, e.y); state.inv.thiefAt = THIEF_ROUTE.length; return true; },
    draw: drawGremlin,
    ai(e, dx, dy, dist, ease, dt) {
      if (e.cornered) return MONSTERS.rabbit.ai(e, dx, dy, dist, ease, dt, 1.45);   // nowhere left to run: it fights
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
          heroNote('Gone again. Follow the dropped pages.', 1.2, { key: 'thief', life: 2.5 });
        }
      }
    },
  },
  lurker: {
    stats: u => ({ r: u * 0.55, hp: 3, dmg: 1, mode: 'submerged', t: 0, cool: rr(0.5, 2) }),
    small: true, water: true, rooted: true, resume: ['sink', 0.4], parryStun: 1.6,
    hittable: e => ['bite', 'risen', 'stunned'].includes(e.mode),
    onHit: stunOnStab,
    drop: [['slime', 0.25], ['emberseed', 0.08], ['wisp', 0.2]],
    draw: drawLurker,
    ai(e, dx, dy, dist) {
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
  },
  warden: {                                         // the boss behind the falls
    stats: u => ({ r: u * 1.3, hp: 18, maxHp: 18, dmg: 2, mode: 'dormant', t: 0 }),
    boss: true, resume: ['prowl', 1.2], parryStun: 1.8,
    hittable: e => !['dormant', 'intro', 'talk'].includes(e.mode),
    onParry: e => e.mode !== 'charge',              // blocked, but it shrugs it off
    touches: e => ['prowl', 'aim', 'charge', 'rear', 'recover'].includes(e.mode),
    afterHit: e => { e.mode = 'recover'; e.t = 1.0; },
    onHit: e => { if (e.hp <= e.maxHp / 2 && !e.enraged) { e.enraged = true; say('The Warden is enraged!', e.x, e.y - e.r - UNIT, { key: 'boss' }); sfx.roar(); zoomPulse(e.x, e.y, 'boss'); } return true; },
    onKill: e => {
      state.items.push({ type: 'spores7', x: e.x + UNIT * 1.2, y: e.y + UNIT * 0.6 });
      rtFor(state.scene).bossDead = true;
      zoomPulse(e.x, e.y, 'boss');
      state.shake = 0.8;
      setMusic('cave');
      say('Behind the falls, a passage opens.', W - UNIT * 4, H * 0.5 - UNIT * 2, { key: 'falls', life: 5 });
      return true;
    },
    drop: [['warden', 1]],
    draw: drawWarden, eyes: eyesWarden,
    ai(e, dx, dy, dist, ease) {
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
  },
  // the High Reaches
  hawk: {                                           // circles high, its shadow on the ground; then a dive (the shadow shrinks to a dot, a shriek);
    // it strikes you and knocks you back, or sometimes grabs you, carries you off and drops you (over a drop: you land a screen lower; updateGrab)
    stats: (u, b) => ({ r: u * 0.55, hp: 3, dmg: 1, mode: 'circle', t: rr(1, 2), fly: true, ang: rng() * 6, cx: b.x, cy: b.y }),
    flies: true, resume: ['climb', 0.5],
    draw: drawHawk,
    ai(e, dx, dy, dist, ease, dt) {
      const h = state.hero;
      if (e.mode === 'circle') {
        e.ang += dt * 0.6; e.cx += (h.x - e.cx) * dt * 0.3; e.cy += (h.y - e.cy) * dt * 0.3;
        e.x = e.cx + Math.cos(e.ang) * UNIT * 3; e.y = e.cy + Math.sin(e.ang) * UNIT * 2; e.alt = UNIT * 3;
        if (e.t <= 0 && !state.grab) { e.mode = 'dive'; e.t = 0.45; e.tx = h.x; e.ty = h.y; e.x0 = e.x; e.y0 = e.y; sfx.shriek ? sfx.shriek() : sfx.cackle(); }
      } else if (e.mode === 'dive') {
        const k = 1 - Math.max(0, e.t) / 0.45; e.x = e.x0 + (e.tx - e.x0) * k; e.y = e.y0 + (e.ty - e.y0) * k; e.alt = UNIT * 3 * (1 - k);
        if (e.t <= 0) {
          if (Math.hypot(h.x - e.x, h.y - e.y) < UNIT * 0.9 && h.z <= UNIT * 0.3 && !(h.invuln > 0)) {
            if (Math.random() < 0.35) { state.grab = { e, t: 0, dur: 1.6, dx: (Math.random() - 0.5) * 2, dy: (Math.random() - 0.5) * 2 }; heroNote('Talons!', 1.2, { key: 'hurt', life: 1.2, color: '#ffb080' }); }
            else { const d = Math.hypot(h.x - e.x0, h.y - e.y0) || 1; hurtHero(1, (h.x - e.x0) / d, (h.y - e.y0) / d); }
          }
          e.mode = 'climb'; e.t = 0.6;
        }
      } else if (e.mode === 'climb') { e.alt = Math.min(UNIT * 3, (e.alt || 0) + UNIT * 3 * dt); e.cx = e.x; e.cy = e.y; if (e.t <= 0) { e.mode = 'circle'; e.t = rr(1.5, 3); } }
      else if (e.mode === 'carry') { e.alt = UNIT * 1.6; }
    },
  },
  mantis: {                                         // a big mountain mantis: stalks, rears up, lunges
    stats: u => ({ r: u * 0.7, hp: 4, dmg: 1, mode: 'idle', t: 1 }),
    resume: ['stalk', 1],
    draw: drawMantis,
    ai(e, dx, dy, dist, ease) {
      if (e.mode === 'idle') { ease(0, 0, 4); if (dist < UNIT * 5) { e.mode = 'stalk'; e.t = 1.5; } }
      else if (e.mode === 'stalk') { ease(dx / dist * UNIT * 1.4, dy / dist * UNIT * 1.4, 3); if (e.t <= 0 && dist < UNIT * 2.6) { e.mode = 'rear'; e.t = 0.5; } else if (e.t <= 0) e.t = 1.2; }
      else if (e.mode === 'rear') { ease(0, 0, 10); if (e.t <= 0) { e.mode = 'lunge'; e.t = 0.35; e.vx = dx / dist * UNIT * 9; e.vy = dy / dist * UNIT * 9; } }
      else if (e.mode === 'lunge') { if (e.t <= 0) { e.mode = 'stalk'; e.t = 1.4; } }
    },
  },
};
// shared bits of the table
function fleeAfterHit(e) { e.mode = 'flee'; e.t = 1.0; e.cool = 2; }
function stunOnStab(e, kind) { if (kind === 'stab' && (state.inv.horn || Math.random() < STAB.knockChance)) { e.mode = 'stunned'; e.t = 1.0; } return true; }
const monster = e => MONSTERS[e.type] || {};        // the entry (empty for anything that isn't a monster: the hero, Pip)

function makeEnemy(type, x, y, idx, poolIdx) {
  const b = { type, idx, x, y, vx: 0, vy: 0, t: 0, cool: 0, lx: 0, ly: 0, flash: 0, dead: false, hgt: 0, poolIdx: poolIdx == null ? null : poolIdx };
  return { ...b, ...MONSTERS[type].stats(UNIT, b) };
}
function hittable(e) {
  if (e.dead || e.taunter) return false;                 // the taunting gremlin is never where your blade is
  const M = monster(e);
  return M.hittable ? M.hittable(e) : true;
}
function resumeMode(e) {
  const m = monster(e).resume || ['idle', 1];         // anything without an entry picks itself back up (this was the High Reaches freeze)
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
  const M = monster(e);
  if (M.onHit && M.onHit(e, kind, nx, ny, bowl)) return;
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
  const t = dropFor(e);
  if (t) {
    state.items.push({ type: t, x: e.x, y: e.y });
    if (RELICS[t] || t === 'scalp' || t === 'warden') relicMoment(t, e.x, e.y);
  }
  const M = monster(e);
  if (M.onKill && M.onKill(e)) return;
  zoomPulse(e.x, e.y, 'kill');
}

function parry(e) {
  const h = state.hero, M = monster(e);
  const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
  sfx.clang();
  spark((e.x + h.x) / 2, (e.y + h.y) / 2, '#ffd23a', 12, 5);
  state.shake = 0.15;
  zoomPulse((e.x + h.x) / 2, (e.y + h.y) / 2, 'parry');
  h.vx -= dx / d * 0.25 * L(); h.vy -= dy / d * 0.25 * L();
  h.invuln = Math.max(h.invuln, 0.35);
  if (M.onParry && M.onParry(e)) return;
  e.mode = 'stunned';
  e.t = M.parryStun || 1.2;
  if (!M.rooted) { e.vx = dx / d * 0.7 * L(); e.vy = dy / d * 0.7 * L(); }
}

function updateEnemies(dt) {
  const h = state.hero;
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i], M = monster(e);
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
    if (burning && !M.boss && !['ceiling', 'submerged', 'ripple', 'sink'].includes(e.mode)) {
      // too busy being on fire to fight: runs about wildly
      if ((e.panicT || 0) <= 0) { e.panicT = 0.35; const a = Math.random() * 6.28; e.lx = Math.cos(a); e.ly = Math.sin(a); }
      e.panicT -= dt;
      ease(e.lx * 0.35 * L(), e.ly * 0.35 * L(), 6);
      if (M.water) { e.x += e.vx * dt; e.y += e.vy * dt; }
    }
    else if (e.mode === 'stunned') { ease(0, 0, 4); if (e.t <= 0) resumeMode(e); }
    else if (e.taunter) { tauntAI(e, dx, dy, dist, dt); continue; }
    else if (M.flies) { M.ai(e, dx, dy, dist, ease, dt); continue; }   // its own movement, no walls
    else M.ai(e, dx, dy, dist, ease, dt);

    if (!M.water) { e.x += e.vx * dt; e.y += e.vy * dt; }
    const ground = !(M.airborne && M.airborne(e)) && !M.water;
    let bump = false;
    const escaping = !!(M.slips && M.slips(e));
    if (ground && !escaping) bump = collideSolids(e, e.r * 0.85);
    const lunging = e.mode === 'lunge' || e.mode === 'charge';
    if (bump && bump.kind === 'stalagmite' && lunging) quake(bump, e);
    if (!escaping) bump = clampTo(e, e.r) || bump;
    const scn = sceneDef();
    if (ground && !escaping && !M.boss && (scn.chasms || scn.river || scn.deep) && isChasm(e.x, e.y)) {
      const carried = ['dart', 'charge', 'lunge', 'flee'].includes(e.mode) || state.time - (e.hitT || -9) < 0.8 || (e.panicT || 0) > 0;
      if (carried) {                                   // no stopping at that speed: over the edge
        e.falling = 0.7; e.vx *= 0.3; e.vy *= 0.3; sfx.plummet(); spark(e.x, e.y, 'rgba(160,140,110,.8)', 6, 2);
        say('Over the edge!', e.x, e.y - UNIT, { key: 'fallen', life: 1.2, color: '#b8f28a' });
      } else { e.x = ox; e.y = oy; e.vx *= -0.3; e.vy *= -0.3; }   // walking, it stops at the lip
    }
    if (lunging && h.dashT > 0 && !state.dodged && dist < e.r + UNIT * 1.3) {
      state.dodged = true; state.slowmo = state.inv.step >= 2 ? 0.7 : 0.45;
      zoomPulse(h.x, h.y, 'parry'); sfx.flip();
      heroNote('Perfect dodge!', 1.2, { key: 'dodge', life: 1, color: '#ffe38a' });
    }
    if (sceneDef().feat.falls && e.x > W - UNIT * 2.3 - e.r) { e.x = W - UNIT * 2.3 - e.r; bump = true; }
    if (bump && lunging && M.crash !== false) {         // into a wall at full tilt
      e.mode = 'stunned'; e.t = M.boss ? 2.0 : 1.2;
      state.shake = M.boss ? 0.5 : 0.2; sfx.crash();
      zoomPulse(e.x, e.y, M.boss ? 'kill' : 'hit');
      spark(e.x, e.y, '#8a7a6a', 10, 3);
    }

    if (M.touches && M.touches(e) && !burning && h.invuln <= 0 && h.z < UNIT * 0.5 && dist < (e.r + UNIT * 0.45) * 0.95) {
      const facing = (-dx * h.fx - dy * h.fy) / dist;
      if (slashActive() && facing > 0.2) parry(e);
      else if (hurtHero(e.dmg, e.x, e.y) && M.afterHit) M.afterHit(e);
    }
  }
}

// something lunging into a stalagmite shakes the stalactites above loose
function quake(sg, e) {
  if ((state.stalCool[sg.key] || 0) > state.time) return;
  state.stalCool[sg.key] = state.time + 6;
  sfx.crash(); state.shake = 0.5;
  const n = monster(e).boss ? 3 : 1;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, d = i ? UNIT * rr(0.2, 0.7) : 0;
    state.hazards.push({ x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, t: -0.25 - i * 0.12, dur: 0.75, r: UNIT * 0.75, edmg: 3, kind: 'stalactite' });
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
        damage(e, z.edmg, 'fire', 0, 1); if (!e.dead) { e.mode = 'stunned'; e.t = monster(e).boss ? 2.2 : 1.4; }
        zoomPulse(e.x, e.y, 'kill');
      }
      if (state.whirl && Math.hypot(h.x - z.x, h.y - z.y) < z.r + UNIT * 1.6) endWhirl('knocked');
      if (Math.hypot(h.x - z.x, h.y - z.y) < z.r + UNIT * 0.4 && h.z < UNIT * 0.5) {
        if (wears('cap')) { sfx.boing(); heroNote('Bonk! The scalp takes it.', 1.2, { key: 'bonk', life: 1.8 }); zoomPulse(h.x, h.y, 'parry'); }
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
  if (robinHiding()) { state.inv.robinFlushed = true; sfx.fanfare && sfx.chirp(panOf(hx)); }   // the pound lesson: done
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
  let drop = Math.random() < (lesson ? 0.8 : 0.4);            // doubled during Pip's garden lesson
  if (lesson && !state.inv.firstBirdSeed) { drop = true; state.inv.firstBirdSeed = true; }
  if (drop) { state.items.push(freeItemSpot({ type: 'turnipseed', x: b.x, y: b.y + UNIT * 1.4 })); spark(b.x, b.y + UNIT, '#c9a86a', 3, 1); }
  else if (lesson && state.pip && state.pip.show && !speakingNow()) {
    pipLine(['Doesn\'t always work. Let\'s try again!', 'Nothing that time! Wait for it to come back.', 'Ha, it kept them. Again!', 'So close! The robin always comes back.'][(state.robinMiss = ((state.robinMiss || 0) + 1)) % 4], { life: 2.6 });
  }
}
// Pip's garden lesson starts with the robin tucked away in its hollow tree. It won't come out on its own: you learn
// to pound (jump, then F in the air) right by the trunk, and out it bursts, dropping the first seeds.
const robinHiding = () => state.scene === 'meadow' && state.inv.story === STORY.garden && !state.inv.robinFlushed && !((state.inv.bag.turnipseed || 0) > 0);
function updateBird(dt) {
  const b = state.bird, h = state.hero;
  b.t -= dt;
  if (robinHiding() && b.mode !== 'home') { [b.x, b.y] = hollowPoint(); b.mode = 'home'; b.z = 0; b.t = 99; }
  if (robinHiding()) { b.t = 99; return; }            // stays in its hole until you pound by the trunk
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

// =====================================================================
// Forest birds: peck about, burst into the air when you come close
// =====================================================================
const FLOCK = { arena: 3, arena_n: 2, fallsbank: 2, camp: 2, start: 3, meadow: 2, meadow2: 2, riverbank: 3, farbank: 3, w1: 3, w2: 2, w3: 1, f1: 2 };
function makeFlock(sc) {
  const n = FLOCK[sc.id] || 0, out = [];
  for (let i = 0; i < n; i++) out.push(landSpot({ mode: 'peck', t: Math.random() * 2, z: 0, c: ['#6b4a2a', '#5a5a62', '#8a6a3a'][i % 3] }));
  return out;
}
function landSpot(b) {
  for (let k = 0; k < 30; k++) {
    const x = W * (0.1 + Math.random() * 0.8), y = H * (0.15 + Math.random() * 0.75);
    if (state.solids.every(s => Math.hypot(s.x - x, s.y - y) > s.r + UNIT) && !isChasm(x, y)) { b.x = x; b.y = y; break; }
  }
  return b;
}
function scareFlock(x, y, range) {
  for (const b of state.flock) {
    if (b.mode !== 'peck' || Math.hypot(b.x - x, b.y - y) > UNIT * range) continue;
    const a = Math.atan2(b.y - y, b.x - x) + (Math.random() - 0.5);
    b.mode = 'fly'; b.vx = Math.cos(a) * 0.4 * L(); b.vy = Math.sin(a) * 0.4 * L() - UNIT * 3;
    sfx.flap(panOf(b.x));
    if (Math.random() < 0.12) state.items.push({ type: localSeed(), x: b.x, y: b.y });
  }
}
function updateFlock(dt) {
  const h = state.hero;
  for (const b of state.flock) {
    b.t -= dt;
    if (b.mode === 'peck') {
      if (b.t <= 0) { b.t = 0.5 + Math.random() * 1.5; b.x += (Math.random() - 0.5) * UNIT * 0.6; b.hop = 0.15; }
      b.hop = Math.max(0, (b.hop || 0) - dt);
      if (Math.hypot(h.x - b.x, h.y - b.y) < UNIT * 3) scareFlock(h.x, h.y, 3);
    } else if (b.mode === 'fly') {
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += UNIT * 5 * dt;
      if (b.z > UNIT * 8) { b.mode = 'gone'; b.t = 15 + Math.random() * 15; }
    } else if (b.mode === 'gone' && b.t <= 0) {
      landSpot(b);
      if (Math.hypot(h.x - b.x, h.y - b.y) < UNIT * 5) { b.t = 3; continue; }
      b.mode = 'land'; b.z = UNIT * 6; b.t = 1.2;
    } else if (b.mode === 'land') {
      b.z = Math.max(0, UNIT * 6 * b.t / 1.2);
      if (b.t <= 0) { b.mode = 'peck'; b.z = 0; }
    }
  }
}

// =====================================================================
// Webs: slow you down, and burn in a chain that lights up the cave
// =====================================================================
const inWeb = (x, y) => (state.webs || []).some(w => !w.burn && Math.hypot(x - w.x, y - w.y) < w.r * 0.9);
function igniteWeb(w) { if (w.burn || w.pending) return; w.pending = state.time + 0.08; }
function updateWebs(dt) {
  const rt = rtFor(state.scene);
  for (let i = state.webs.length - 1; i >= 0; i--) {
    const w = state.webs[i];
    if (w.pending && state.time >= w.pending && !w.burn) { w.burn = 0.001; w.pending = 0; if (Math.random() < 0.5) sfx.whumpf(); else sfx.crackle(); }
    if (!w.burn) continue;
    w.burn += dt;
    if (Math.random() < dt * 20) state.fx.push({ x: w.x + (Math.random() - 0.5) * w.r * 1.6, y: w.y + (Math.random() - 0.5) * w.r, vx: 0, vy: -UNIT * 1.6, t: 0, life: 0.6, color: Math.random() < 0.5 ? '#ffb347' : '#ff6a2a' });
    if (w.burn > 0.18 && !w.spread) {                // fire runs along to the next strands
      w.spread = true;
      for (const o of state.webs) if (o !== w && Math.hypot(o.x - w.x, o.y - w.y) < o.r + w.r + UNIT * 1.3) { o.pending = state.time + 0.12 + Math.random() * 0.15; }
      for (const p of state.gas) if (!p.burn && p.ign == null && Math.hypot(p.x - w.x, p.y - w.y) < p.r + w.r) p.ign = state.time + 0.1;
      for (const s of state.solids) if (s.bar && ['web', 'vine'].includes(s.kind) && Math.hypot(s.x - w.x, s.y - w.y) < w.r + s.r + UNIT) { breakBarrier(s.bar, 'fire'); break; }
    }
    for (const e of state.enemies) {                  // anything caught in a burning web catches too
      if (!hittable(e) || (e.webBurnt || 0) > state.time || Math.hypot(e.x - w.x, e.y - w.y) > w.r + e.r) continue;
      e.webBurnt = state.time + 1; e.burn = Math.min(8, (e.burn || 0) + 3); damage(e, 1, 'fire', 0, 0);
    }
    if (w.burn > 1.7) { if (w.idx != null) rt.flags['web' + w.idx] = true; state.webs.splice(i, 1); }
  }
}
function spinWeb(x, y) {                                // a diver's drop leaves fresh silk behind
  if (!state.webs || state.webs.length > 16) return;
  if (state.webs.some(w => Math.hypot(w.x - x, w.y - y) < w.r)) return;
  state.webs.push({ x, y, r: UNIT * rr(0.8, 1.2), idx: null, burn: 0 });
}
// ---------------- the Hollow's spore mushroom bursts when Pip is freed ----------------
function makeFloaters(n) { return Array.from({ length: n }, () => ({ x: Math.random() * W, y: H * (0.2 + Math.random() * 0.6), a: Math.random() * 6, s: 0.5 + Math.random() })); }
function burstDarkShroom() {
  const sc = sceneDef(), rt = rtFor(sc.id), f = sc.feat.darkShroom;
  if (!f || rt.flags.darkshroom) return;
  rt.flags.darkshroom = true;
  refreshSceneGeometry();
  const x = f[0] * W, y = f[1] * H;
  sfx.whumpf(); sfx.spores(); state.shake = 0.5; zoomPulse(x, y, 'boss');
  for (let i = 0; i < 60; i++) { const a = Math.random() * 6.28, sp = UNIT * (3 + Math.random() * 7); state.fx.push({ x, y: y - UNIT, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - UNIT * 1.5, t: 0, life: 0.6 + Math.random() * 0.8, color: 'spore', size: UNIT * (0.05 + Math.random() * 0.08) }); }   // sparks of spore light zipping away, fizzling out
  state.inv.spores = (state.inv.spores || 0) + 8;                   // the spores cling to you (no pickups strewn about)
  state.floaters = makeFloaters(8);
  say('The mushroom bursts! Spores everywhere.', x, y - UNIT * 2, { key: 'burst', life: 3 });
}

// ---------- gremlins who tease you in the woods, before the ambush ----------
// The first one peeks out from behind the boulder at the end of the first woods screen, and ducks away when you come.
function drawPeekGremlin(sc) {
  const pk = sc.feat.peek, rt = rtFor(sc.id); if (!pk || !storyAt('adventure') || broken(sc.id, 'crack1') || state.inv.pipTaken) return;
  const x = pk[0] * W, y = pk[1] * H, h = state.hero, near = Math.hypot(h.x - x, h.y - y) < UNIT * 5.5;
  if (near && !rt.flags.peekGone) { rt.flags.peekGone = state.time; sfx.cackle(); say('Hee hee!', x, y - UNIT, { key: 'gremlin', life: 1.2, color: '#c8e070' }); }
  const k = rt.flags.peekGone ? Math.min(1, (state.time - rt.flags.peekGone) / 0.35) : 0; if (k >= 1) return;
  const bob = Math.sin(state.time * 2.2) * UNIT * 0.08, yy = y + bob + k * UNIT * 0.9, u = UNIT;
  ctx.save(); ctx.beginPath(); ctx.rect(x - u, yy - u, u * 2, u + (1 - k) * u * 0.2); ctx.clip();
  ctx.fillStyle = '#4a6a2a'; ctx.beginPath(); ctx.ellipse(x, yy, u * 0.34, u * 0.28, 0, 0, 6.28); ctx.fill();          // a green head
  ctx.beginPath(); ctx.moveTo(x - u * 0.3, yy - u * 0.1); ctx.lineTo(x - u * 0.55, yy - u * 0.35); ctx.lineTo(x - u * 0.22, yy - u * 0.2); ctx.fill();   // pointy ears
  ctx.beginPath(); ctx.moveTo(x + u * 0.3, yy - u * 0.1); ctx.lineTo(x + u * 0.55, yy - u * 0.35); ctx.lineTo(x + u * 0.22, yy - u * 0.2); ctx.fill();
  ctx.fillStyle = '#ffe060'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * u * 0.12, yy - u * 0.03, u * 0.06, 0, 6.28); ctx.fill(); }   // yellow eyes
  ctx.restore();
}
// The second runs at you halfway across the second woods screen, stops just out of reach to jeer, and leaps away every
// time you swing or chase. After a few leaps it runs back the way it came, laughing.
const TAUNTS = ['Nyah nyah!', 'Too slow!', 'Can\'t catch me!', 'Hee hee hee!', 'Missed!'];
function updateTaunter(dt) {
  const sc = sceneDef(), rt = rtFor(sc.id), h = state.hero;
  if (sc.id !== 'w2' || rt.flags.taunted || !storyAt('adventure') || state.inv.pipTaken || broken('w2', 'crack2') || state.cut) return;
  if (!state.enemies.some(e => e.taunter) && h.x > W * 0.42) {                      // halfway: out it comes, from the way on
    const e = makeEnemy('gremlin', W + UNIT, h.y + (Math.random() - 0.5) * UNIT * 2, 0);
    Object.assign(e, { taunter: true, mode: 'taunt-in', leaps: 0, t: 0 }); state.enemies.push(e); sfx.cackle();
  }
}
function tauntAI(e, dx, dy, dist, dt) {
  const h = state.hero; e.t += dt;
  const say2 = () => say(TAUNTS[(e.leaps + Math.floor(e.t)) % TAUNTS.length], e.x, e.y - UNIT * 1.1, { key: 'gremlin', life: 1.1, color: '#c8e070' });
  if (e.leap) {                                                                     // mid-leap: an arc, well out of reach
    const L = e.leap; L.t += dt; const k = Math.min(1, L.t / L.dur);
    e.x = L.x0 + (L.x1 - L.x0) * k; e.y = L.y0 + (L.y1 - L.y0) * k; e.hz = Math.sin(k * Math.PI) * UNIT * 1.3;
    if (k >= 1) { e.leap = null; e.hz = 0; say2(); }
    return;
  }
  if (e.mode === 'taunt-in') {                                                      // runs right at you
    const d = Math.max(1, dist); e.x += (dx / d) * UNIT * 7 * dt; e.y += (dy / d) * UNIT * 7 * dt;
    if (dist < UNIT * 2.8) { e.mode = 'taunt'; e.t = 0; say2(); }
  } else if (e.mode === 'taunt') {                                                  // hops on the spot, jeering; leaps if you come at it or swing
    e.hz = Math.abs(Math.sin(e.t * 8)) * UNIT * 0.2;
    const threat = dist < UNIT * 2.2 || (state.atk && dist < UNIT * 3.4) || (state.hold && state.hold.on && dist < UNIT * 3.4);
    if (threat) {
      e.leaps++; sfx.cackle();
      if (e.leaps >= 4) { e.mode = 'taunt-out'; return; }
      const away = Math.atan2(e.y - h.y, e.x - h.x) + (Math.random() - 0.5) * 1.2, R = UNIT * 3.4;
      let x1 = e.x + Math.cos(away) * R, y1 = e.y + Math.sin(away) * R; x1 = Math.max(UNIT, Math.min(W - UNIT, x1)); y1 = Math.max(UNIT * 1.5, Math.min(H - UNIT * 1.5, y1));
      e.leap = { x0: e.x, y0: e.y, x1, y1, t: 0, dur: 0.45 };
    } else if (e.t > 9) e.mode = 'taunt-out';
  } else if (e.mode === 'taunt-out') {                                              // back the way it came, laughing
    e.x += UNIT * 8 * dt; e.hz = Math.abs(Math.sin(e.t * 12)) * UNIT * 0.25;
    if (Math.random() < dt * 1.5) say('Hee hee hee!', e.x, e.y - UNIT, { key: 'gremlin', life: 0.9, color: '#c8e070' });
    if (e.x > W + UNIT) { e.dead = true; e.gone = true; state.enemies.splice(state.enemies.indexOf(e), 1); rtFor('w2').flags.taunted = true; }
  }
}
