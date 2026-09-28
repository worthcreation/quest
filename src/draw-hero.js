// ===== draw-hero.js: The hero model (poses, blade in hand).

// =====================================================================
// The hero, drawn: an original look after Ross's references. Tousled dark hair, amber eyes, warm brown
// skin, a brown tunic over a dark undershirt, a leather strap across the chest with a bronze buckle,
// belt and pouch, charcoal trousers, boots, a bandaged forearm, and a green cloak with a leather hem.
// Built from simple shapes and a few poses that switch with what you're doing.
// Live in the arena for now (MODEL_ON); the rest of the game keeps the square until this is signed off.
// =====================================================================
const MODEL_ON = () => ARENA || (typeof location !== 'undefined' && /(^|[?&])model(=|&|$)/.test(location.search));
const HERO_LOOK = {
  skin: '#8a5a3c', skinShade: '#6e4430', hair: '#3a2418', hairLit: '#6b3b22', eye: '#e0a030',
  tunic: '#5c4330', tunicShade: '#46321f', under: '#34343a', strap: '#6b4428', buckle: '#c08a3a',
  belt: '#4e3320', pants: '#3b383e', pantsShade: '#2c2a2f', boot: '#2e2119', bandage: '#d2c8b0',
  cloak: '#2f5a3a', cloakShade: '#23442c', hem: '#5a4028',
};
// angles: 0 hangs straight down, positive swings toward the way you face (pi/2 is straight ahead)
const POSES = {
  idle:   t => ({ bob: Math.sin(t * 2) * 0.015, lean: 0, legA: 0.05, legB: -0.05, kneeA: 0.05, kneeB: 0.05, armA: 0.15, armB: -0.1, elbA: 0.25, elbB: 0.2, cloak: 0.05 + Math.sin(t * 1.3) * 0.03 }),
  walk:   (t, p) => ({ bob: Math.abs(Math.sin(p)) * 0.05, lean: 0.06, legA: Math.sin(p) * 0.55, legB: -Math.sin(p) * 0.55, kneeA: Math.max(0, -Math.cos(p)) * 0.7, kneeB: Math.max(0, Math.cos(p)) * 0.7, armA: -Math.sin(p) * 0.5, armB: Math.sin(p) * 0.5, elbA: 0.35, elbB: 0.35, cloak: 0.35 }),
  dash:   () => ({ bob: 0, lean: 0.45, legA: 0.95, legB: -0.8, kneeA: 0.3, kneeB: 0.5, armA: -1.1, armB: -0.9, elbA: 0.2, elbB: 0.3, cloak: 1 }),
  jump:   () => ({ bob: 0, lean: 0.05, legA: 0.6, legB: -0.1, kneeA: 1.3, kneeB: 1.0, armA: 2.5, armB: 2.2, elbA: 0.3, elbB: 0.4, cloak: 0.6 }),
  fall:   t => ({ bob: 0, lean: -0.05, legA: 0.3, legB: -0.3, kneeA: 0.4, kneeB: 0.4, armA: 1.9 + Math.sin(t * 18) * 0.25, armB: -1.9 - Math.sin(t * 18) * 0.25, elbA: 0.2, elbB: 0.2, cloak: 0.9 }),
  pound:  () => ({ bob: 0.08, lean: 0.25, legA: 1.1, legB: 0.7, kneeA: 1.9, kneeB: 1.7, armA: 0.4, armB: 0.3, elbA: 0, elbB: 0.1, cloak: 0.9 }),
  slash:  (t, p, k) => ({ bob: 0, lean: 0.2, legA: 0.45, legB: -0.35, kneeA: 0.3, kneeB: 0.1, armA: -0.6 + k * 2.4, armB: -0.5, elbA: 0.1, elbB: 0.6, cloak: 0.5 }),
  stab:   (t, p, k) => ({ bob: 0, lean: 0.35, legA: 0.7, legB: -0.55, kneeA: 0.5, kneeB: 0.1, armA: 1.55, armB: -0.7, elbA: 0.05 + (1 - k) * 0.6, elbB: 0.5, cloak: 0.6 }),
  charge: t => ({ bob: 0.02, lean: -0.1, legA: 0.3, legB: -0.3, kneeA: 0.3, kneeB: 0.2, armA: -0.9 + Math.sin(t * 30) * 0.04, armB: 0.6, elbA: 1.4, elbB: 0.5, cloak: 0.2 }),
  aim:    t => ({ bob: 0, lean: -0.08, legA: 0.35, legB: -0.3, kneeA: 0.2, kneeB: 0.2, armA: -2.3, armB: 1.1, elbA: 0.9, elbB: 0.2, cloak: 0.2 }),
  throw:  () => ({ bob: 0, lean: 0.3, legA: 0.55, legB: -0.45, kneeA: 0.3, kneeB: 0.1, armA: 1.7, armB: -0.6, elbA: 0.05, elbB: 0.4, cloak: 0.5 }),
  carry:  (t, p) => ({ bob: Math.abs(Math.sin(p)) * 0.03, lean: 0, legA: Math.sin(p) * 0.35, legB: -Math.sin(p) * 0.35, kneeA: 0.3, kneeB: 0.3, armA: 2.95, armB: 2.95, elbA: 0.35, elbB: 0.35, cloak: 0.2 }),
  hurt:   () => ({ bob: 0, lean: -0.3, legA: 0.3, legB: -0.2, kneeA: 0.3, kneeB: 0.2, armA: 0.9, armB: -0.9, elbA: 0.5, elbB: 0.5, cloak: 0.5 }),
  fish:   t => ({ bob: Math.sin(t * 2) * 0.01, lean: 0.05, legA: 0.1, legB: -0.1, kneeA: 0.1, kneeB: 0.1, armA: 1.2, armB: 1.0, elbA: 0.4, elbB: 0.5, cloak: 0.1 }),
};
const POSE_ORDER = ['idle', 'walk', 'dash', 'jump', 'fall', 'pound', 'slash', 'stab', 'charge', 'aim', 'throw', 'carry', 'hurt'];
// which pose, from what the hero is doing right now
function heroPose(h) {
  const a = state.atk;
  if (h.falling > 0) return ['fall', 0];
  if (h.stun > 0 || state.time - (h.hurtT || -9) < 0.25) return ['hurt', 0];
  if (state.slam) return ['pound', 0];
  if (h.ride && !h.ride.hop) return ['fall', 0];
  if (h.dashT > 0) return ['dash', 0];
  if (a) return [a.type === 'stab' ? 'stab' : 'slash', Math.min(1, a.t / a.dur)];
  if (state.hold.charged) return ['charge', 0];
  if (state.time - (state.throwT || -9) < 0.25) return ['throw', 0];
  if (state.aim.on) return ['aim', 0];
  if (h.z > 0) return [h.vz > 0 ? 'jump' : 'fall', 0];
  if (state.carry === 'rock') return ['carry', 0];
  if (state.fish) return ['fish', 0];
  if (Math.hypot(h.vx, h.vy) > UNIT * 0.8) return ['walk', 0];
  return ['idle', 0];
}
function heroFacing(fx, fy) { return Math.abs(fy) > Math.abs(fx) * 1.1 ? (fy < 0 ? 'up' : 'down') : 'side'; }
// draw the hero standing on (x, footY); u is one tile. view: 'down' (front), 'up' (back), 'side' (flip -1 faces left)
function drawHeroModel(x, footY, u, poseName, k, view, flip, t, phase) {
  const L = HERO_LOOK, P = POSES[poseName](t, phase, k);
  const hipY = footY - u * (0.58 - P.bob), shY = footY - u * (1.02 - P.bob), headY = footY - u * (1.32 - P.bob);
  const leanX = view === 'side' ? P.lean * u * 0.35 * flip : 0;
  const side = view === 'side', back = view === 'up';
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // one limb: upper and lower segment, bending at the joint
  const limb = (sx, sy, ang, bend, len1, len2, w, col, end, endCol, endW, arm, out) => {
    const dir = side ? flip : 1;
    let a1 = ang, a2 = ang + bend * (ang >= 0 ? 1 : -1) * 0.9;
    let l1 = len1, l2 = len2, px, py, qx, qy;
    if (side) { px = sx + Math.sin(a1) * l1 * dir; py = sy + Math.cos(a1) * l1; qx = px + Math.sin(a2) * l2 * dir; qy = py + Math.cos(a2) * l2; }
    else if (arm) {                                    // facing you or away: a raised arm swings up and out to its side
      const r1 = Math.abs(a1), r2 = Math.abs(a2);
      px = sx + Math.sin(r1) * l1 * out; py = sy + Math.cos(r1) * l1;
      qx = px + Math.sin(r2) * l2 * out; qy = py + Math.cos(r2) * l2;
    } else {                                           // legs facing you: strides foreshorten
      const f1 = Math.max(0.5, Math.cos(a1 * 0.8)), f2 = Math.max(0.5, Math.cos(a2 * 0.8));
      px = sx + Math.sin(a1) * l1 * 0.12 * out; py = sy + l1 * f1;
      qx = px + Math.sin(a2) * l2 * 0.12 * out; qy = py + l2 * f2;
    }
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
    if (end) { ctx.fillStyle = endCol; ctx.beginPath(); ctx.ellipse(qx + (side ? flip * endW * 0.3 : 0), qy, endW, endW * 0.7, 0, 0, 6.28); ctx.fill(); }
    return [qx, qy];
  };
  const cx = x + leanX;
  // cloak, behind the body (in front of it from the back)
  const drawCloak = () => {
    const sway = P.cloak, top = shY - u * 0.02, bottom = footY - u * (0.22 - sway * 0.12);
    ctx.fillStyle = back ? L.cloak : L.cloakShade;
    ctx.beginPath();
    if (side) {
      const bx = cx - flip * u * (0.12 + sway * 0.55);
      ctx.moveTo(cx - flip * u * 0.05, top); ctx.quadraticCurveTo(bx - flip * u * 0.1, (top + bottom) / 2, bx, bottom + Math.sin(t * 6) * u * 0.03 * sway);
      ctx.lineTo(cx - flip * u * 0.05, bottom - u * 0.05); ctx.closePath();
    } else {
      const wd = u * (0.36 + sway * 0.08);
      ctx.moveTo(cx - u * 0.2, top); ctx.lineTo(cx + u * 0.2, top); ctx.lineTo(cx + wd, bottom); ctx.lineTo(cx - wd, bottom); ctx.closePath();
    }
    ctx.fill();
    ctx.fillStyle = L.hem;                           // the leather hem
    if (side) { const bx = cx - flip * u * (0.12 + sway * 0.55); ctx.beginPath(); ctx.ellipse(bx + flip * u * 0.06, bottom - u * 0.02, u * 0.1, u * 0.05, 0, 0, 6.28); ctx.fill(); }
    else { const wd = u * (0.36 + sway * 0.08); ctx.fillRect(cx - wd, bottom - u * 0.07, wd * 2, u * 0.07); }
  };
  if (!back) drawCloak();
  // legs
  const hx = side ? cx : cx;
  const legW = u * 0.16, thigh = u * 0.27, shin = u * 0.27;
  const legs = side ? [[hx, -1, P.legB, P.kneeB, L.pantsShade], [hx, 1, P.legA, P.kneeA, L.pants]] : [[hx - u * 0.1, -1, P.legB, P.kneeB, L.pants], [hx + u * 0.1, 1, P.legA, P.kneeA, L.pants]];
  for (const [lx, o, ang, bend, col] of legs) limb(lx, hipY, ang, bend, thigh, shin, legW, col, true, L.boot, u * 0.1, false, o);
  // torso: tunic, undershirt at the collar, strap, belt and pouch
  const tw = side ? u * 0.26 : u * 0.36;
  ctx.fillStyle = L.tunic;
  ctx.beginPath(); ctx.moveTo(cx - tw / 2, shY); ctx.lineTo(cx + tw / 2, shY); ctx.lineTo(cx + tw / 2 + u * 0.02, hipY + u * 0.06); ctx.lineTo(cx - tw / 2 - u * 0.02, hipY + u * 0.06); ctx.closePath(); ctx.fill();
  ctx.fillStyle = L.tunicShade; ctx.fillRect(cx - tw / 2, hipY - u * 0.04, tw, u * 0.1);
  if (!back) {
    ctx.fillStyle = L.under; ctx.beginPath(); ctx.moveTo(cx - u * 0.07, shY); ctx.lineTo(cx + u * 0.07, shY); ctx.lineTo(cx + (side ? flip * u * 0.02 : 0), shY + u * 0.1); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = L.strap; ctx.lineWidth = u * 0.07;          // the cross strap
  ctx.beginPath();
  if (side) { ctx.moveTo(cx - flip * tw * 0.3, shY + u * 0.02); ctx.lineTo(cx + flip * tw * 0.4, hipY - u * 0.05); }
  else { ctx.moveTo(cx - tw / 2 + u * 0.04, shY + u * 0.02); ctx.lineTo(cx + tw / 2 - u * 0.02, hipY - u * 0.06); }
  ctx.stroke();
  if (!back) { ctx.fillStyle = L.buckle; ctx.fillRect(cx + (side ? flip * u * 0.02 : u * 0.02) - u * 0.035, (shY + hipY) / 2 - u * 0.03, u * 0.07, u * 0.06); }
  ctx.fillStyle = L.belt; ctx.fillRect(cx - tw / 2 - u * 0.02, hipY - u * 0.06, tw + u * 0.04, u * 0.06);
  ctx.fillStyle = L.buckle; ctx.fillRect(cx + (side ? flip * u * 0.04 : 0) - u * 0.03, hipY - u * 0.06, u * 0.06, u * 0.06);
  ctx.fillStyle = L.strap; ctx.fillRect(cx + (side ? -flip * u * 0.16 : u * 0.14) - u * 0.05, hipY - u * 0.03, u * 0.1, u * 0.11);   // pouch
  if (back) drawCloak();
  // arms: the far one, then the near one; the near forearm is bandaged
  const armLen1 = u * 0.24, armLen2 = u * 0.24, armW = u * 0.12;
  const shoulders = side ? [[cx - flip * u * 0.02, P.armB, P.elbB, L.tunicShade, false, 1], [cx + flip * u * 0.04, P.armA, P.elbA, L.tunic, true, 1]] : [[cx - tw / 2 - u * 0.03, P.armB, P.elbB, L.tunic, false, back ? 1 : -1], [cx + tw / 2 + u * 0.03, P.armA, P.elbA, L.tunic, true, back ? -1 : 1]];
  let hand = null;
  for (const [sx, ang, bend, col, near, out] of shoulders) {
    const end = limb(sx, shY + u * 0.04, ang, bend, armLen1, armLen2, armW, col, true, near ? L.bandage : L.skin, u * 0.07, true, (sx < cx ? -1 : 1));
    if (near) {
      hand = end;
      ctx.strokeStyle = L.bandage; ctx.lineWidth = armW * 0.85;   // wraps on the near forearm
      const mx = (end[0] * 2 + sx) / 3, my = (end[1] * 2 + shY) / 3;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(end[0], end[1]); ctx.stroke();
    }
  }
  // head: face (or back of the head), then the messy hair
  const hr = u * 0.25, hcx = cx + (side ? flip * u * 0.03 : 0);
  ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(hcx, headY, hr * (side ? 0.9 : 1), hr * 1.05, 0, 0, 6.28); ctx.fill();
  if (!back) {
    ctx.fillStyle = L.eye;
    const ey = headY + hr * 0.05;
    if (side) { ctx.fillRect(hcx + flip * hr * 0.35 - u * 0.025, ey, u * 0.05, u * 0.04); }
    else { ctx.fillRect(hcx - hr * 0.42, ey, u * 0.06, u * 0.04); ctx.fillRect(hcx + hr * 0.42 - u * 0.06, ey, u * 0.06, u * 0.04); }
    ctx.fillStyle = L.skinShade; ctx.fillRect(hcx - u * 0.03 + (side ? flip * hr * 0.55 : 0), headY + hr * 0.45, u * 0.06, u * 0.02);
  }
  ctx.fillStyle = L.hair;                           // tousled: a cap of hair with spikes that sway
  ctx.beginPath(); ctx.ellipse(hcx - (side ? flip * hr * 0.12 : 0), headY - hr * (back ? 0.05 : 0.35), hr * 1.1, hr * (back ? 1.05 : 0.8), 0, 0, 6.28); ctx.fill();
  const spikes = back ? 9 : 7;
  for (let i = 0; i < spikes; i++) {
    const a = -Math.PI * (0.1 + 0.8 * i / (spikes - 1)) + (side ? -flip * 0.2 : 0), sw = Math.sin(t * 3 + i) * 0.08 + P.cloak * 0.15 * (side ? -flip : 0);
    const bx = hcx + Math.cos(a) * hr * 0.9, by = headY - hr * 0.3 + Math.sin(a) * hr * 0.75;
    ctx.beginPath(); ctx.moveTo(bx - Math.sin(a) * u * 0.06, by + Math.cos(a) * u * 0.06); ctx.lineTo(bx + Math.cos(a + sw) * u * 0.16, by + Math.sin(a + sw) * u * 0.16); ctx.lineTo(bx + Math.sin(a) * u * 0.06, by - Math.cos(a) * u * 0.06); ctx.fill();
  }
  if (!back) { ctx.beginPath(); ctx.moveTo(hcx - hr * 0.8, headY - hr * 0.2); ctx.quadraticCurveTo(hcx - hr * 0.2, headY + hr * 0.05, hcx + (side ? flip : 1) * hr * 0.3, headY - hr * 0.35); ctx.lineTo(hcx, headY - hr * 0.6); ctx.fill(); }   // fringe over the eyes
  ctx.fillStyle = L.hairLit; ctx.beginPath(); ctx.ellipse(hcx - hr * 0.3, headY - hr * 0.7, hr * 0.28, hr * 0.12, -0.4, 0, 6.28); ctx.fill();
  ctx.restore();
  return { hand, chestY: (shY + hipY) / 2, headTop: headY - hr * 1.2 };
}
// the hero in the world, using the model
function drawHeroModelInWorld(h, heroic) {
  const [pose, k] = heroPose(h), view = heroFacing(h.fx, h.fy), flip = h.side || (h.fx < 0 ? -1 : 1);
  const moved = Math.hypot(h.x - (h.mx ?? h.x), h.y - (h.my ?? h.y)); h.mx = h.x; h.my = h.y;
  h.walkPh = (h.walkPh || 0) + moved / (UNIT * 0.28);
  const u = UNIT * (h.falling > 0 ? Math.max(0.05, h.falling / 0.8) : 1) * heightScale(h.z);
  const footY = h.y + UNIT * 0.42 - h.z + (h.falling > 0 ? (1 - h.falling / 0.8) * UNIT : 0);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; const sh = 1 - Math.min(0.6, h.z / (UNIT * 5));
  if (!(h.ride && h.ride.wind)) { ctx.beginPath(); ctx.ellipse(h.x + 2, h.y + UNIT * 0.42, UNIT * 0.42 * sh, UNIT * 0.14 * sh, 0, 0, 6.28); ctx.fill(); }
  if (!state.cut && state.time - h.hurtT < 1.2 && Math.floor(state.time * 14) % 2) return;
  if (state.hold.charged) { ctx.fillStyle = `rgba(255,240,180,${0.3 + 0.2 * Math.sin(state.time * 30)})`; ctx.beginPath(); ctx.ellipse(h.x, footY - UNIT * 0.7, UNIT * 0.6, UNIT * 0.9, 0, 0, 6.28); ctx.fill(); }
  const info = drawHeroModel(h.x, footY, u, pose, k, view, flip, state.time, h.walkPh);
  const r = h.vig / maxVig();
  if (h.stun > 0 || r < 0.35) { ctx.fillStyle = h.stun > 0 ? 'rgba(255,255,255,.35)' : `rgba(60,50,80,${(0.35 - r) * 1.1})`; ctx.beginPath(); ctx.ellipse(h.x, footY - UNIT * 0.75, UNIT * 0.42, UNIT * 0.85, 0, 0, 6.28); ctx.fill(); }
  if (h.falling > 0) return;
  if (wears('cap')) drawScalp(h.x, info.headTop + UNIT * 0.15, UNIT);
  if (state.carry === 'rock') drawRock(h.x, info.headTop - UNIT * 0.2, UNIT * 0.62, state.carrySeed || 3.7);
  else if (state.inv.sword && !state.atk && !state.whirl && !state.slam && !heroic && info.hand && !(state.equip === 'acorn' && state.inv.acorns > 0)) {
    // at rest the sword sits in the near hand, point down and trailing behind
    const view = heroFacing(h.fx, h.fy), s = view === 'side' ? (h.side || 1) : 1;
    ctx.save(); ctx.translate(info.hand[0], info.hand[1]); ctx.rotate(Math.PI / 2 + s * 0.45); ctx.translate(-UNIT * 0.05, 0);
    drawBlade(UNIT * 0.62, UNIT * 0.09); drawHilt(); ctx.restore();
  }
  else if (state.inv.sword) drawSword(h, UNIT * 0.6, UNIT, info.chestY, heroic);
}
// the pose sheet: every pose, three ways round, animated (arena only, for review)
function drawPoseSheet() {
  const cols = 3, rows = POSE_ORDER.length, t = state.time;
  const cellW = Math.min((W - 40) / (cols + 1), 150), cellH = Math.min((H - 120) / Math.ceil(rows / 2), 150), u = Math.min(cellH / 2, cellW / 2.2);
  ctx.fillStyle = '#16131b'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fdf6e3'; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('Hero poses', W / 2, 34);
  ctx.font = '13px "Courier New", monospace'; ctx.fillStyle = 'rgba(253,246,227,.6)'; ctx.fillText(`front \u00b7 side \u00b7 back      ${K.menu} or ${K.act} to close`, W / 2, 54);
  const half = Math.ceil(rows / 2), blockW = cellW * (cols + 0.9);
  POSE_ORDER.forEach((name, i) => {
    const col0 = i < half ? 0 : 1, row = i % half, bx = W / 2 - blockW + col0 * blockW + 10, by = 80 + row * cellH;
    ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(bx, by, blockW - 20, cellH - 6);
    ctx.fillStyle = '#ffe38a'; ctx.textAlign = 'left'; ctx.font = 'bold 13px "Courier New", monospace'; ctx.fillText(name, bx + 6, by + 16);
    ['down', 'side', 'up'].forEach((v, j) => {
      const x = bx + cellW * 0.55 + j * cellW * 0.95, foot = by + cellH - 14;
      const k = (t * 1.2) % 1;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, foot, u * 0.4, u * 0.12, 0, 0, 6.28); ctx.fill();
      drawHeroModel(x, foot, u, name, k, v, 1, t, t * 8);
    });
  });
  ctx.textAlign = 'left';
}
