// ===== draw-ui.js: HUD, titles and banners, text boxes and sparkles, action hints, the pack and menus, the book, the start screen.

// =====================================================================
// Drawing
// =====================================================================
// ---------- shared pieces ----------
function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.38);
  ctx.bezierCurveTo(x - s * 0.62, y - s * 0.02, x - s * 0.38, y - s * 0.55, x, y - s * 0.18);
  ctx.bezierCurveTo(x + s * 0.38, y - s * 0.55, x + s * 0.62, y - s * 0.02, x, y + s * 0.38);
  ctx.closePath();
}
function drawScalp(x, top, w) {                  // stalker scalp: fur cap, ears, spine tufts
  const fur = '#4a2218';
  for (const s of [-1, 1]) {
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.moveTo(x + s * w * 0.18, top - w * 0.12); ctx.lineTo(x + s * w * 0.52, top - w * 0.55); ctx.lineTo(x + s * w * 0.56, top + w * 0.02); ctx.fill();
    ctx.fillStyle = '#b8736a';
    ctx.beginPath(); ctx.moveTo(x + s * w * 0.3, top - w * 0.1); ctx.lineTo(x + s * w * 0.48, top - w * 0.4); ctx.lineTo(x + s * w * 0.49, top - w * 0.02); ctx.fill();
  }
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(x, top + w * 0.06, w * 0.56, w * 0.3, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - w * 0.56, top + w * 0.04, w * 1.12, w * 0.1);
  ctx.fillStyle = '#2a0f0b';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.14 - w * 0.06, top - w * 0.18); ctx.lineTo(x + i * w * 0.14, top - w * 0.36); ctx.lineTo(x + i * w * 0.14 + w * 0.06, top - w * 0.18); ctx.fill(); }
  ctx.strokeStyle = '#6b3526'; ctx.lineWidth = Math.max(1, w * 0.03);
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.18, top + w * 0.1); ctx.lineTo(x + i * w * 0.18 + w * 0.04, top - w * 0.04); ctx.stroke(); }
}
function drawItemIcon(type, x, y, s) {
  if (RAW[type] || type === 'mat') { ctx.save(); ctx.translate(x, y); const done = drawRawIcon(type, s); ctx.restore(); if (done) return; }
  ctx.save(); ctx.translate(x, y);
  switch (type) {
    case 'scalp': drawScalp(0, s * 0.2, s * 1.05); break;
    case 'wing':
      ctx.fillStyle = '#4b3558';
      ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.15); ctx.lineTo(0, -s * 0.45); ctx.lineTo(s * 0.55, s * 0.15);
      ctx.quadraticCurveTo(s * 0.35, 0, s * 0.2, s * 0.32); ctx.quadraticCurveTo(0, s * 0.1, -s * 0.2, s * 0.32); ctx.quadraticCurveTo(-s * 0.35, 0, -s * 0.55, s * 0.15); ctx.fill();
      ctx.strokeStyle = '#2a1c33'; ctx.lineWidth = Math.max(1, s * 0.05);
      for (const a of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.moveTo(0, -s * 0.45); ctx.lineTo(a * s, s * 0.2); ctx.stroke(); }
      break;
    case 'horn':
      ctx.strokeStyle = '#e6dcc0'; ctx.lineCap = 'round';
      ctx.lineWidth = s * 0.24; ctx.beginPath(); ctx.arc(-s * 0.05, s * 0.2, s * 0.38, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
      ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.arc(-s * 0.05, s * 0.2, s * 0.38, Math.PI * 1.6, Math.PI * 1.95); ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    case 'step':                                  // a stalker's hind claw on a cord
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.3, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke();
      ctx.fillStyle = '#4a1414'; ctx.beginPath(); ctx.moveTo(-s * 0.15, s * 0.05); ctx.quadraticCurveTo(s * 0.3, s * 0.1, s * 0.05, s * 0.5); ctx.lineTo(s * 0.02, s * 0.1); ctx.fill();
      ctx.fillStyle = '#e6dcc0'; ctx.beginPath(); ctx.moveTo(-s * 0.05, s * 0.2); ctx.quadraticCurveTo(s * 0.2, s * 0.3, s * 0.05, s * 0.5); ctx.fill();
      break;
    case 'silk':
      ctx.strokeStyle = '#e8e4f0'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(0, 0, s * (0.15 + i * 0.07), s * (0.3 - i * 0.03), i * 0.5, 0, 6.28); ctx.stroke(); }
      break;
    case 'squash':
      ctx.fillStyle = '#e0a030'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.4, s * 0.3, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#b8781a'; ctx.lineWidth = 1.5; for (const o of [-0.15, 0.15]) { ctx.beginPath(); ctx.ellipse(o * s, s * 0.08, s * 0.1, s * 0.28, 0, 0, 6.28); ctx.stroke(); }
      ctx.fillStyle = '#4a6a2a'; ctx.fillRect(-s * 0.04, -s * 0.34, s * 0.08, s * 0.16);
      break;
    case 'berries':
      ctx.fillStyle = '#6a2a7a'; for (const [bx, by] of [[-0.12, 0.05], [0.12, 0.05], [0, -0.1], [0, 0.18]]) { ctx.beginPath(); ctx.arc(bx * s, by * s, s * 0.14, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = '#4a8a3a'; ctx.beginPath(); ctx.ellipse(s * 0.15, -s * 0.28, s * 0.14, s * 0.07, -0.5, 0, 6.28); ctx.fill();
      break;
    case 'pepper':
      ctx.fillStyle = '#c8321e'; ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.2); ctx.quadraticCurveTo(s * 0.4, -s * 0.1, s * 0.1, s * 0.5); ctx.quadraticCurveTo(-s * 0.1, s * 0.1, -s * 0.15, -s * 0.2); ctx.fill();
      ctx.fillStyle = '#4a8a3a'; ctx.fillRect(-s * 0.2, -s * 0.32, s * 0.12, s * 0.15);
      break;
    case 'lumin': case 'glow': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.6);
      g.addColorStop(0, '#f2ffb0'); g.addColorStop(0.5, '#9ee85a'); g.addColorStop(1, 'rgba(120,220,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#c9f27a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.26, s * 0.32, 0, 0, 6.28); ctx.fill();
      break;
    }
    case 'haunch':
      ctx.fillStyle = '#f1ead8'; ctx.fillRect(s * 0.1, -s * 0.06, s * 0.42, s * 0.12);
      ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.08, s * 0.08, 0, 6.28); ctx.arc(s * 0.52, s * 0.08, s * 0.08, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#9a5a2a'; ctx.beginPath(); ctx.ellipse(-s * 0.12, 0, s * 0.36, s * 0.26, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#b8743a'; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.07, s * 0.15, s * 0.08, 0, 0, 6.28); ctx.fill();
      break;
    case 'turnip':
      ctx.fillStyle = '#5aa04a';
      for (const a of [-0.5, 0, 0.5]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-s * 0.05, -s * 0.6, s * 0.1, s * 0.35); ctx.restore(); }
      ctx.fillStyle = '#efe6f2'; ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.3, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#9b4f9e'; ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.3, Math.PI, 0); ctx.fill();
      break;
    case 'slime':
      ctx.fillStyle = '#7fae3a';
      ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.28, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.12, s * 0.2, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#c3e37a'; ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.16, s * 0.07, 0, 6.28); ctx.fill();
      break;
    case 'heart': heartPath(0, 0, s * 0.9); ctx.fillStyle = '#e03a3a'; ctx.fill(); break;
    case 'carrot':
      ctx.fillStyle = '#e8792a'; ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.2); ctx.lineTo(s * 0.12, -s * 0.2); ctx.lineTo(0, s * 0.5); ctx.fill();
      ctx.strokeStyle = '#b8541a'; ctx.lineWidth = 1; for (const y of [0, 0.15]) { ctx.beginPath(); ctx.moveTo(-s * 0.08, y * s); ctx.lineTo(s * 0.04, y * s); ctx.stroke(); }
      ctx.fillStyle = '#5aa04a'; for (const a of [-0.4, 0, 0.4]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-s * 0.04, -s * 0.5, s * 0.08, s * 0.32); ctx.restore(); }
      break;
    case 'acorn':
      ctx.fillStyle = '#a0662a'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.22, s * 0.28, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#6b4520'; ctx.beginPath(); ctx.ellipse(0, -s * 0.12, s * 0.26, s * 0.14, 0, 0, 6.28); ctx.fill();
      ctx.fillRect(-s * 0.03, -s * 0.34, s * 0.06, s * 0.12);
      break;
    case 'thornseed': case 'emberseed': case 'ironseed': case 'starseed': {
      const c = SEEDS[type].color;
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.18, s * 0.26, 0.5, 0, 6.28); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
      if (type === 'starseed' || type === 'emberseed') { ctx.fillStyle = `rgba(255,255,230,${0.4 + 0.3 * Math.sin(state.time * 5)})`; ctx.beginPath(); ctx.arc(-s * 0.05, -s * 0.08, s * 0.06, 0, 6.28); ctx.fill(); }
      break;
    }
    case 'thorn':
      ctx.fillStyle = '#7a3a8a'; ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.2); ctx.lineTo(s * 0.35, -s * 0.35); ctx.lineTo(0, s * 0.3); ctx.fill();
      ctx.fillStyle = '#c98ad8'; ctx.beginPath(); ctx.moveTo(-s * 0.1, s * 0.15); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s * 0.05, s * 0.1); ctx.fill();
      break;
    case 'ember': { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.45); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.5, '#ff8a2a'); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; ctx.beginPath(); ctx.ellipse(Math.cos(a) * s * 0.18, Math.sin(a) * s * 0.18, s * 0.2, s * 0.1, a, 0, 6.28); ctx.fill(); } break; }
    case 'ironwood': ctx.fillStyle = '#6a6e74'; ctx.fillRect(-s * 0.4, -s * 0.12, s * 0.8, s * 0.24); ctx.strokeStyle = '#8a9098'; ctx.lineWidth = 1; for (const o of [-0.05, 0.05]) { ctx.beginPath(); ctx.moveTo(-s * 0.38, o * s); ctx.lineTo(s * 0.38, o * s); ctx.stroke(); } ctx.fillStyle = '#4a4e54'; ctx.beginPath(); ctx.ellipse(s * 0.4, 0, s * 0.06, s * 0.12, 0, 0, 6.28); ctx.fill(); break;
    case 'starpetal': ctx.fillStyle = '#fff6c8'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 - Math.PI / 2, r = i % 2 ? s * 0.15 : s * 0.4; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); break;
    case 'fish':
      ctx.fillStyle = '#8ab8c8'; ctx.beginPath(); ctx.ellipse(-s * 0.05, 0, s * 0.35, s * 0.17, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.25, 0); ctx.lineTo(s * 0.48, -s * 0.18); ctx.lineTo(s * 0.48, s * 0.18); ctx.fill();
      ctx.fillStyle = '#e8f4f8'; ctx.beginPath(); ctx.ellipse(-s * 0.1, s * 0.05, s * 0.2, s * 0.06, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#1a2a30'; ctx.beginPath(); ctx.arc(-s * 0.28, -s * 0.03, s * 0.035, 0, 6.28); ctx.fill();
      break;
    case 'driftwood':
      ctx.fillStyle = '#9a8468'; ctx.save(); ctx.rotate(-0.3); ctx.fillRect(-s * 0.42, -s * 0.09, s * 0.84, s * 0.18);
      ctx.strokeStyle = '#6b5a44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.35, 0); ctx.lineTo(s * 0.35, 0); ctx.stroke(); ctx.restore();
      break;
    case 'rod':
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.4); ctx.lineTo(s * 0.4, -s * 0.4); ctx.stroke();
      ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.4); ctx.quadraticCurveTo(s * 0.5, 0, s * 0.3, s * 0.3); ctx.stroke();
      break;
    case 'ear':
      ctx.fillStyle = '#4a2218'; ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.3); ctx.lineTo(0, -s * 0.4); ctx.lineTo(s * 0.25, s * 0.3); ctx.fill();
      ctx.fillStyle = '#b8736a'; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.25); ctx.lineTo(0, -s * 0.2); ctx.lineTo(s * 0.12, s * 0.25); ctx.fill();
      break;
    case 'hide':
      ctx.fillStyle = '#5a2a1e'; ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.2); ctx.quadraticCurveTo(0, -s * 0.35, s * 0.35, -s * 0.15); ctx.lineTo(s * 0.3, s * 0.25); ctx.quadraticCurveTo(0, s * 0.35, -s * 0.3, s * 0.2); ctx.fill();
      ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.15, -s * 0.15); ctx.lineTo(i * s * 0.15 + s * 0.05, s * 0.15); ctx.stroke(); }
      break;
    case 'spores': case 'spores7':
      for (let i = 0; i < 6; i++) { const a = i * 1.05 + state.time, r = s * (0.12 + (i % 3) * 0.1); ctx.fillStyle = `rgba(232,216,255,${0.6 + 0.3 * Math.sin(state.time * 4 + i)})`; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, s * 0.08, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = '#9a6ad8'; ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, 6.28); ctx.fill();
      break;
    case 'sword':                                         // the old sword: grey steel, rust and all (never the wooden one's colour)
      ctx.save(); ctx.rotate(-0.8 - Math.PI / 2); ctx.translate(-s * 0.1, 0); drawSteelBlade(s * 0.62, s * 0.12, Math.min(3, state.inv.up.edge || 0)); ctx.restore();
      ctx.save(); ctx.rotate(-0.8);
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-s * 0.2, s * 0.1, s * 0.4, s * 0.07); ctx.fillRect(-s * 0.04, s * 0.17, s * 0.08, s * 0.25);
      ctx.restore(); break;
    case 'letter':
      ctx.fillStyle = '#f2e6c8'; ctx.fillRect(-s * 0.32, -s * 0.24, s * 0.64, s * 0.48);
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.32, -s * 0.24); ctx.lineTo(0, s * 0.05); ctx.lineTo(s * 0.32, -s * 0.24); ctx.stroke();
      ctx.fillStyle = '#3a2616'; ctx.fillRect(-s * 0.1, s * 0.12, s * 0.35, s * 0.07);
      break;
    case 'page':
      ctx.fillStyle = '#f2e6c8'; ctx.save(); ctx.rotate(0.2); ctx.fillRect(-s * 0.28, -s * 0.34, s * 0.56, s * 0.68);
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2 + i * s * 0.13); ctx.lineTo(s * 0.18, -s * 0.2 + i * s * 0.13); ctx.stroke(); }
      ctx.restore(); break;
    case 'journal':
      ctx.fillStyle = '#7a3a2a'; ctx.fillRect(-s * 0.35, -s * 0.4, s * 0.7, s * 0.8);
      ctx.fillStyle = '#f2e6c8'; ctx.fillRect(s * 0.3, -s * 0.36, s * 0.07, s * 0.72);
      ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, 6.28); ctx.fill();
      break;
    case 'recipe_temper': case 'recipe_star':
      ctx.fillStyle = '#e8dcb8'; ctx.fillRect(-s * 0.3, -s * 0.35, s * 0.6, s * 0.7);
      ctx.fillStyle = '#b8a47a'; ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.35, s * 0.08, 0, 6.28); ctx.arc(s * 0.3, s * 0.35, s * 0.08, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2 + i * s * 0.13); ctx.lineTo(s * 0.2, -s * 0.2 + i * s * 0.13); ctx.stroke(); }
      break;
    case 'woodsword': ctx.save(); ctx.rotate(-0.7); ctx.fillStyle = '#b08a5a'; ctx.fillRect(-s * 0.06, -s * 0.45, s * 0.12, s * 0.62); ctx.beginPath(); ctx.moveTo(-s * 0.06, -s * 0.45); ctx.lineTo(0, -s * 0.55); ctx.lineTo(s * 0.06, -s * 0.45); ctx.fill();
      ctx.fillStyle = '#7a5a34'; ctx.fillRect(-s * 0.2, s * 0.14, s * 0.4, s * 0.07); ctx.fillRect(-s * 0.05, s * 0.2, s * 0.1, s * 0.22); ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.07, s * 0.1); ctx.lineTo(s * 0.07, s * 0.02); ctx.stroke(); ctx.restore(); break;
    case 'thornwrap': ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.2, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#7a3a8a'; for (let k = 0; k < 5; k++) { const an = k / 5 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(an) * s * 0.2, Math.sin(an) * s * 0.14); ctx.lineTo(Math.cos(an) * s * 0.42, Math.sin(an) * s * 0.3); ctx.lineTo(Math.cos(an + 0.3) * s * 0.22, Math.sin(an + 0.3) * s * 0.15); ctx.fill(); } break;
    case 'emberoil': { ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 0.3, s * 0.18, 0, 0, 6.28); ctx.fill(); const g = ctx.createRadialGradient(0, s * 0.06, 0, 0, s * 0.06, s * 0.26); g.addColorStop(0, '#fff0a0'); g.addColorStop(1, 'rgba(255,110,40,.9)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, s * 0.06, s * 0.24, s * 0.12, 0, 0, 6.28); ctx.fill(); break; }
    case 'mash': case 'salad': ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.22, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = type === 'mash' ? '#e8c07a' : '#9fcf6a'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.36, s * 0.12, 0, 0, 6.28); ctx.fill();
      if (type === 'salad') { ctx.fillStyle = '#c0304a'; for (const [dx, dy] of [[-0.15, 0.02], [0.05, 0.06], [0.18, 0]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.05, 0, 6.28); ctx.fill(); } } else { ctx.fillStyle = '#e8792a'; ctx.fillRect(-s * 0.1, s * 0.03, s * 0.08, s * 0.05); } break;
    case 'trailmix': for (const [dx, dy, c] of [[-0.15, 0.05, '#a0662a'], [0.1, -0.05, '#6a2a5a'], [0.2, 0.12, '#a0662a'], [-0.02, 0.18, '#c0304a'], [-0.2, -0.12, '#6a2a5a']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.1, 0, 6.28); ctx.fill(); } break;
    case 'lantern': ctx.strokeStyle = '#5a4128'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -s * 0.32, s * 0.1, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-s * 0.2, -s * 0.24, s * 0.4, s * 0.08); ctx.fillRect(-s * 0.2, s * 0.26, s * 0.4, s * 0.08);
      ctx.fillStyle = 'rgba(255,215,110,.9)'; ctx.fillRect(-s * 0.15, -s * 0.16, s * 0.3, s * 0.42); ctx.fillStyle = '#fff4c0'; ctx.fillRect(-s * 0.03, -s * 0.02, s * 0.06, s * 0.14); break;
    case 'wear_feather': ctx.save(); ctx.rotate(-0.5); ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.13, s * 0.4, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#7ab8e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, s * 0.45); ctx.lineTo(0, -s * 0.38); ctx.stroke(); ctx.restore(); break;
    case 'wear_stonecharm': ctx.strokeStyle = '#d8ccb0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -s * 0.12, s * 0.28, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 0.24, s * 0.18, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-s * 0.07, s * 0.06, s * 0.08, s * 0.05, 0, 0, 6.28); ctx.fill(); break;
    case 'wear_mitts': ctx.fillStyle = '#6aa04a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * s * 0.2, 0, s * 0.17, s * 0.24, sx * 0.2, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(sx * s * 0.34, -s * 0.08, s * 0.06, s * 0.1, sx * 0.6, 0, 6.28); ctx.fill(); } ctx.fillStyle = '#efe6d2'; ctx.fillRect(-s * 0.38, s * 0.18, s * 0.76, s * 0.08); break;
    case 'wear_embercharm': { ctx.fillStyle = '#8f887c'; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, 6.28); ctx.fill(); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.2); g.addColorStop(0, '#fff0a0'); g.addColorStop(1, 'rgba(255,120,40,0.9)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.17, 0, 6.28); ctx.fill(); break; }
    // vegetable seeds, a small pinch of each, drawn the way the real ones look
    case 'turnipseed':                                 // tiny round beads, dark red-brown to near black, a glint on each
      for (const [ox, oy, r] of [[-0.16, 0.1, 0.11], [0.08, -0.14, 0.12], [0.18, 0.14, 0.1], [-0.04, 0.16, 0.09]]) {
        ctx.fillStyle = '#3a2016'; ctx.beginPath(); ctx.arc(ox * s, oy * s, r * s, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#7a3a26'; ctx.beginPath(); ctx.arc(ox * s, oy * s, r * s * 0.7, 0, 6.28); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,220,.7)'; ctx.beginPath(); ctx.arc((ox - r * 0.35) * s, (oy - r * 0.4) * s, r * s * 0.28, 0, 6.28); ctx.fill();
      }
      break;
    case 'carrotseed':                                 // small tan ovals, flat, ridged along their length
      for (const [ox, oy, a] of [[-0.15, 0.08, 0.6], [0.12, -0.12, -0.4], [0.16, 0.16, 1.1]]) {
        ctx.save(); ctx.translate(ox * s, oy * s); ctx.rotate(a);
        ctx.fillStyle = '#a8905e'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.1, s * 0.16, 0, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#6e5a34'; ctx.lineWidth = 1; for (const k of [-0.05, 0, 0.05]) { ctx.beginPath(); ctx.moveTo(k * s, -s * 0.13); ctx.lineTo(k * s, s * 0.13); ctx.stroke(); }
        ctx.restore();
      }
      break;
    case 'pepperseed':                                 // flat pale yellow discs, a slight notch where they hung
      for (const [ox, oy] of [[-0.14, 0.1], [0.1, -0.12], [0.16, 0.16]]) {
        ctx.fillStyle = '#e8d68a'; ctx.beginPath(); ctx.arc(ox * s, oy * s, s * 0.13, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#b8a45a'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#c8b46a'; ctx.beginPath(); ctx.arc((ox + 0.09) * s, (oy - 0.06) * s, s * 0.03, 0, 6.28); ctx.fill();
      }
      break;
    case 'squashseed':                                 // cream teardrops with a paler rim, one broad and one on its side
      for (const [ox, oy, a] of [[-0.1, 0.06, -0.3], [0.14, 0.02, 0.9]]) {
        ctx.save(); ctx.translate(ox * s, oy * s); ctx.rotate(a);
        ctx.fillStyle = '#e8dcb0'; ctx.beginPath(); ctx.moveTo(0, -s * 0.24); ctx.quadraticCurveTo(s * 0.18, -s * 0.05, s * 0.13, s * 0.14); ctx.quadraticCurveTo(0, s * 0.28, -s * 0.13, s * 0.14); ctx.quadraticCurveTo(-s * 0.18, -s * 0.05, 0, -s * 0.24); ctx.fill();
        ctx.strokeStyle = '#f8f2dc'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
      break;
    case 'bean':
      ctx.fillStyle = '#8b3a2a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.2, 0.3, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#d98a6a'; ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.06, s * 0.08, s * 0.04, 0.3, 0, 6.28); ctx.fill();
      break;
    case 'wisp': { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.5); g.addColorStop(0, '#f4ffe0'); g.addColorStop(0.4, '#b8f28a'); g.addColorStop(1, 'rgba(140,220,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 6.28); ctx.fill(); break; }
    case 'fire': { const g = ctx.createRadialGradient(0, s * 0.1, 0, 0, s * 0.1, s * 0.5); g.addColorStop(0, '#fff1a0'); g.addColorStop(0.5, '#ff9a3a'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.quadraticCurveTo(s * 0.45, 0, 0, s * 0.45); ctx.quadraticCurveTo(-s * 0.45, 0, 0, -s * 0.5); ctx.fill(); break; }
    case 'bigrock': drawRock(0, 0, s * 0.7); break;
    case 'maxheart': heartPath(0, 0, s); ctx.fillStyle = '#e03a3a'; ctx.fill(); ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = Math.max(2, s * 0.1); ctx.stroke(); break;
    case 'warden': heartPath(0, 0, s * 1.1); ctx.fillStyle = '#4a9ad8'; ctx.fill(); ctx.strokeStyle = '#c9e8ff'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.stroke(); break;
  }
  ctx.restore();
}
function drawItems() {
  for (const it of state.items) {
    if (it.type === 'bigrock') { drawRock(it.x, it.y, UNIT * 0.62); continue; }
    // things lie on the ground: a tight contact shadow, a little lean of their own, no floating
    const hsh = Math.abs(Math.sin(it.x * 12.9898 + it.y * 78.233)) % 1, lean = (hsh - 0.5) * 0.6;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(it.x + 1, it.y + UNIT * 0.2, UNIT * 0.28, UNIT * 0.07, 0, 0, 6.28); ctx.fill();
    ctx.save(); ctx.translate(it.x, it.y + UNIT * 0.08); ctx.rotate(lean); drawItemIcon(it.type, 0, 0, UNIT * 0.72); ctx.restore();
    if (it.type !== 'bigrock' && !TOUCH_PICKUP.has(it.type) && glowShows(it.type)) {     // the faint selection ring, inside gathering reach
      const dd = Math.hypot(state.hero.x - it.x, state.hero.y - it.y) / UNIT, R = gatherReach();
      if (dd < R) { const a = (0.07 + 0.06 * Math.min(1, gatherLevel() / 8)) * Math.min(1, (R - dd) / 0.6) * (0.85 + 0.15 * Math.sin(state.time * 2 + it.x));
        ctx.strokeStyle = `rgba(255,244,200,${a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(it.x, it.y + UNIT * 0.22, UNIT * 0.36, UNIT * 0.12, 0, 0, 6.28); ctx.stroke(); }
    }
    drawGlints(it, hsh);
  }
}
// Sparkles on things lying about: sparse and light. Usually one glint at a time, and never twice in the same spot
// in a row. Nine in ten are tiny and faint; now and then a bigger one (never bigger than a small star). They come a
// little more often as you get close, and a touch warmer within reach of F; that's the only cue, no button drawn.
const GLINTS = new WeakMap();
function drawGlints(it, hsh) {
  const h = state.hero, d = Math.hypot(h.x - it.x, h.y - it.y) / UNIT, reach = d < gatherReach() && h.z <= 0 && !state.carry;
  const near = Math.max(0, Math.min(1, 1 - (d - gatherReach()) / 5));
  const G = GLINTS.get(it) || { t: state.time, gl: [], lx: 0, ly: 0 }; GLINTS.set(it, G);
  const now = state.time, dt = Math.min(0.1, Math.max(0, now - G.t)); G.t = now;
  const gl = G.gl, rate = 0.12 + near * 0.5 + (reach ? 0.9 : 0), cap = reach ? 2 : 1;
  if (gl.length < cap && Math.random() < rate * dt) {
    let dx = 0, dy = 0;
    for (let tries = 0; tries < 6; tries++) {                            // somewhere new each time
      dx = (Math.random() - 0.5) * UNIT * 0.6; dy = -UNIT * (0.02 + Math.random() * 0.32);
      if (Math.hypot(dx - G.lx, dy - G.ly) > UNIT * 0.22) break;
    }
    G.lx = dx; G.ly = dy;
    const big = Math.random() < 0.1;
    gl.push({ t0: now, dur: big ? 0.3 + Math.random() * 0.35 : 0.15 + Math.random() * 0.25, dx, dy,
      r: big ? UNIT * (0.12 + Math.random() * 0.12) : UNIT * (0.035 + Math.random() * 0.035), a: big ? 0.45 + Math.random() * 0.3 : 0.18 + Math.random() * 0.17,
      kind: big && Math.random() < 0.4 ? 'star8' : 'star4', warm: reach });
  }
  for (let i = gl.length - 1; i >= 0; i--) {
    const g = gl[i], p = (now - g.t0) / g.dur;
    if (p >= 1 || p < 0) { gl.splice(i, 1); continue; }
    const k = Math.sin(p * Math.PI), x = it.x + g.dx, y = it.y + g.dy, r = g.r * k, a = g.a * k;
    ctx.fillStyle = g.warm ? `rgba(255,238,170,${a})` : `rgba(255,252,235,${a})`;
    const star = (rr, rot) => { ctx.beginPath(); for (let j = 0; j < 8; j++) { const an = rot + j * Math.PI / 4, q = j % 2 ? rr * 0.24 : rr; ctx.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q); } ctx.closePath(); ctx.fill(); };
    star(r, 0);
    if (g.kind === 'star8') star(r * 0.55, Math.PI / 4);
  }
}
// ---------- enemies ----------
function drawEnemy(e) {
  if (e.type === 'hawk') { drawHawk(e); return; }
  if (e.type === 'mantis') { drawMantis(e); return; }
  const alpha = e.mode === 'dead' ? Math.max(0, e.t / 0.9) : 1;
  const scale = e.mode === 'dead' ? 0.5 + 0.5 * alpha : 1;
  const white = e.flash > 0;
  ctx.save(); ctx.globalAlpha = alpha;
  const C = (c) => white ? '#fff' : c;
  switch (e.type) {
    case 'stalker': {
      const bs = UNIT * 1.4 * scale * (e.mode === 'windup' ? 1.12 : 1);
      ctx.fillStyle = C('#4a1414'); ctx.fillRect(e.x - bs / 2, e.y - bs / 2, bs, bs);
      for (const s of [-1, 1]) {                  // ears, the same ones the scalp keeps
        ctx.fillStyle = C('#4a1414'); ctx.beginPath(); ctx.moveTo(e.x + s * bs * 0.2, e.y - bs / 2); ctx.lineTo(e.x + s * bs * 0.48, e.y - bs * 0.95); ctx.lineTo(e.x + s * bs * 0.5, e.y - bs / 2); ctx.fill();
        ctx.fillStyle = C('#b8736a'); ctx.beginPath(); ctx.moveTo(e.x + s * bs * 0.28, e.y - bs / 2); ctx.lineTo(e.x + s * bs * 0.45, e.y - bs * 0.82); ctx.lineTo(e.x + s * bs * 0.46, e.y - bs / 2); ctx.fill();
      }
      ctx.fillStyle = C('#2a0b0b');
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(e.x + i * bs * 0.14 - bs * 0.06, e.y - bs / 2); ctx.lineTo(e.x + i * bs * 0.14, e.y - bs * 0.72); ctx.lineTo(e.x + i * bs * 0.14 + bs * 0.06, e.y - bs / 2); ctx.fill(); }
      break;
    }
    case 'charger': {
      const bw = UNIT * 1.6 * scale, bh = UNIT * 1.25 * scale;
      ctx.fillStyle = C('#3b2a18'); ctx.fillRect(e.x - bw / 2, e.y - bh / 2, bw, bh);
      ctx.fillStyle = C('#e6dcc0');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * bw * 0.3, e.y - bh / 2); ctx.lineTo(e.x + s * bw * 0.62, e.y - bh / 2 - bh * 0.45); ctx.lineTo(e.x + s * bw * 0.45, e.y - bh / 2); ctx.fill(); }
      if (e.mode === 'aim' && Math.random() < 0.3) spark(e.x - e.lx * bw * 0.6, e.y + bh * 0.4, '#5a4a3a', 1, 1.2);
      break;
    }
    case 'glowworm': {
      if (e.mode === 'glowup') { const k = 1 - e.t / 0.8, g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, UNIT * (0.6 + k * 1.4)); g.addColorStop(0, `rgba(245,255,200,${0.4 + k * 0.5})`); g.addColorStop(1, 'rgba(245,255,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, UNIT * (0.6 + k * 1.4), 0, 6.28); ctx.fill(); }
      for (let i = 3; i >= 0; i--) {
        const ox = Math.cos(e.seg + i * 0.8) * UNIT * 0.1 - i * UNIT * 0.22 * Math.sign(e.vx || 1), oy = Math.sin(e.seg * 1.3 + i) * UNIT * 0.08;
        ctx.fillStyle = C(i === 0 ? '#d8f58a' : '#9ec65a'); ctx.beginPath(); ctx.arc(e.x + ox, e.y + oy, e.r * (1 - i * 0.15), 0, 6.28); ctx.fill();
      }
      break;
    }
    case 'thief': case 'gremlin': {
      const hop = Math.abs(Math.sin(state.time * 18 + e.x)) * UNIT * (e.mode === 'dart' ? 0.2 : 0.08), y = e.y - hop, r = e.r * scale;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.8, r, r * 0.3, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#3c4a2a'); ctx.beginPath(); ctx.ellipse(e.x, y, r * 0.85, r, 0, 0, 6.28); ctx.fill();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * r * 0.5, y - r * 0.5); ctx.lineTo(e.x + s * r * 1.5, y - r * 1.0); ctx.lineTo(e.x + s * r * 0.7, y - r * 0.1); ctx.fill(); }
      ctx.fillStyle = '#ff4a2a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * r * 0.3, y - r * 0.25, UNIT * 0.07, 0, 6.28); ctx.fill(); }
      ctx.strokeStyle = '#e9e2d0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, y + r * 0.1, r * 0.35, 0.2, Math.PI - 0.2); ctx.stroke();
      if (e.type === 'thief') {                      // the stolen journal clutched overhead
        ctx.fillStyle = '#7a3a2a'; ctx.fillRect(e.x - r * 0.45, y - r * 1.55, r * 0.9, r * 0.65);
        ctx.fillStyle = '#f2e6c8'; ctx.fillRect(e.x - r * 0.38, y - r * 1.5, r * 0.76, r * 0.08);
      }
      break;
    }
    case 'rabbit': {
      const hop = e.mode === 'idle' ? Math.abs(Math.sin(state.time * 8)) * UNIT * 0.15 : Math.abs(Math.sin(state.time * 16)) * UNIT * 0.25;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.8, e.r, e.r * 0.3, 0, 0, 6.28); ctx.fill();
      const y = e.y - hop;
      ctx.fillStyle = C('#a88a60'); ctx.beginPath(); ctx.ellipse(e.x, y, e.r, e.r * 0.8, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#8a6e48');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(e.x + s * e.r * 0.3, y - e.r * 1.1, e.r * 0.18, e.r * 0.55, s * 0.2, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = C('#f2eee4'); ctx.beginPath(); ctx.arc(e.x - Math.sign(e.vx || 1) * e.r * 0.9, y, e.r * 0.25, 0, 6.28); ctx.fill();
      const rage = e.mode === 'rage', flash = rage && Math.sin(state.time * 30) > 0;
      ctx.fillStyle = e.mode === 'dart' || flash ? '#ff3a2a' : '#1a1410';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * e.r * 0.3, y - e.r * 0.2, UNIT * (rage ? 0.09 : 0.06), 0, 6.28); ctx.fill(); }
      if (flash) { ctx.fillStyle = 'rgba(255,60,40,.35)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * e.r * 0.3, y - e.r * 0.2, UNIT * 0.2, 0, 6.28); ctx.fill(); } }
      break;
    }
    case 'diver': {
      const hgt = e.hgt || 0, y = e.y - hgt * UNIT * 6;
      if (e.mode !== 'ceiling') {
        const k = 1 - hgt;
        ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(e.x, e.y + UNIT * 0.2, e.r * (0.4 + k * 0.8), e.r * (0.2 + k * 0.35), 0, 0, 6.28); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 0.4, e.r * 0.2, 0, 0, 6.28); ctx.fill();
        break;
      }
      const r = e.r * scale;
      ctx.strokeStyle = C('#2a1c33'); ctx.lineWidth = Math.max(1.5, UNIT * 0.06);
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const a = (i - 1.5) * 0.45, wig = Math.sin(state.time * 12 + i) * 0.1;
        ctx.beginPath(); ctx.moveTo(e.x, y); ctx.lineTo(e.x + s * r * 1.2 * Math.cos(a + wig), y + r * 0.9 * Math.sin(a + wig) - r * 0.3); ctx.lineTo(e.x + s * r * 1.5, y + r * (0.3 + i * 0.2)); ctx.stroke();
      }
      ctx.fillStyle = C('#4b3558'); ctx.beginPath(); ctx.ellipse(e.x, y, r * 0.7, r * 0.6, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#362640'); ctx.beginPath(); ctx.ellipse(e.x, y + r * 0.5, r * 0.5, r * 0.4, 0, 0, 6.28); ctx.fill();
      break;
    }
    case 'lurker': {
      const p = e.pool; if (!p) break;
      if (e.mode === 'submerged' || e.mode === 'ripple') {
        const k = e.mode === 'ripple' ? 1 - e.t / 0.8 : 0.2;
        ctx.strokeStyle = `rgba(170,200,190,${0.2 + k * 0.5})`; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { const rr_ = UNIT * (0.3 + i * 0.3) * (0.6 + k); ctx.beginPath(); ctx.ellipse(e.x, e.y, rr_, rr_ * 0.6, 0, 0, 6.28); ctx.stroke(); }
        if (Math.random() < 0.05 + k * 0.3) state.fx.push({ x: e.x + (Math.random() - 0.5) * UNIT, y: e.y, vx: 0, vy: -UNIT * 0.5, t: 0, life: 0.4, color: 'rgba(200,230,220,.6)' });
        break;
      }
      const rise = e.mode === 'bite' ? 1 - Math.max(0, e.t) / 0.3 : e.mode === 'sink' ? Math.max(0, e.t) / 0.4 : 1;
      const r = e.r * scale * (0.4 + 0.6 * rise), y = e.y - UNIT * 0.3 * rise;
      ctx.fillStyle = C('#2f4a3e'); ctx.beginPath(); ctx.ellipse(e.x, y, r, r * 1.1, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#4d6d52');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * r * 0.8, y); ctx.lineTo(e.x + s * r * 1.5, y - r * 0.3); ctx.lineTo(e.x + s * r * 0.9, y + r * 0.4); ctx.fill(); }
      ctx.fillStyle = C('#d8e0c8');
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(e.x + i * r * 0.22 - r * 0.08, y + r * 0.3); ctx.lineTo(e.x + i * r * 0.22, y + r * 0.6); ctx.lineTo(e.x + i * r * 0.22 + r * 0.08, y + r * 0.3); ctx.fill(); }
      ctx.fillStyle = '#e9ff6a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * r * 0.35, y - r * 0.3, UNIT * 0.08, 0, 6.28); ctx.fill(); }
      break;
    }
    case 'warden': {
      if (e.mode === 'dormant') { ctx.globalAlpha = 0.85; }
      const rear = e.mode === 'rear' ? 1 + 0.15 * (1 - e.t / 0.7) : 1;
      const bw = UNIT * 2.8 * scale * rear, bh = UNIT * 2.2 * scale * rear;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + bh * 0.45, bw * 0.55, bh * 0.2, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#3a4c4a'); ctx.beginPath(); ctx.ellipse(e.x, e.y, bw / 2, bh / 2, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = C('#4f6b3e');
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(e.x + (i - 2) * bw * 0.18, e.y - bh * 0.32 + Math.abs(i - 2) * bh * 0.06, bw * 0.12, bh * 0.1, 0, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = C('#e9e2d0');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x + s * bw * 0.18, e.y + bh * 0.15); ctx.quadraticCurveTo(e.x + s * bw * 0.36, e.y + bh * 0.3, e.x + s * bw * 0.3, e.y - bh * 0.05); ctx.lineTo(e.x + s * bw * 0.22, e.y + bh * 0.08); ctx.fill(); }
      break;
    }
  }
  ctx.restore();
}
function drawDiverThreads() {
  for (const e of state.enemies) if (e.type === 'diver' && e.mode !== 'ceiling' && e.mode !== 'dead') {
    const y = e.y - (e.hgt || 0) * UNIT * 6;
    ctx.strokeStyle = 'rgba(210,210,230,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(e.x, y); ctx.lineTo(e.x, -10); ctx.stroke();
  }
}
function drawEnemyEyes(e) {
  if (e.mode === 'dead') return;
  const h = state.hero, look = Math.atan2(h.y - e.y, h.x - e.x);
  const ox = Math.cos(look) * UNIT * 0.1, oy = Math.sin(look) * UNIT * 0.08;
  const glow = (col, pts, r) => { ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = UNIT * 0.6; for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill(); } ctx.shadowBlur = 0; };
  if (e.type === 'stalker' || e.type === 'charger') {
    const eyeY = e.y - UNIT * 0.2, d = UNIT * 0.28;
    if (e.mode === 'sleep') { ctx.fillStyle = 'rgba(255,60,40,.35)'; for (const s of [-1, 1]) ctx.fillRect(e.x + s * d - UNIT * 0.1, eyeY, UNIT * 0.2, UNIT * 0.04); }
    else {
      const warn = e.mode === 'windup' || e.mode === 'aim';
      glow(warn ? '#ffd23a' : e.type === 'charger' ? '#ff8a2a' : '#ff3b2a', [[e.x - d + ox, eyeY + oy], [e.x + d + ox, eyeY + oy]], UNIT * (warn ? 0.13 : 0.09));
    }
  }
  if (e.type === 'diver') {
    const y = e.y - (e.hgt || 0) * UNIT * 6;
    if (e.mode === 'ceiling') {                   // tiny glints up in the dark
      if (Math.sin(state.time * 2 + e.idx) > 0.6) glow('rgba(200,150,255,.6)', [[e.x - 4, e.y - UNIT * 0.2], [e.x + 4, e.y - UNIT * 0.2]], 1.5);
    } else glow('#c89bff', [[e.x - UNIT * 0.15, y - UNIT * 0.1], [e.x + UNIT * 0.15, y - UNIT * 0.1], [e.x - UNIT * 0.06, y - UNIT * 0.2], [e.x + UNIT * 0.06, y - UNIT * 0.2]], UNIT * 0.05);
  }
  if (e.type === 'warden' && e.mode !== 'dormant') {
    const warn = e.mode === 'aim' || e.mode === 'rear';
    glow(warn ? '#e8f8ff' : '#6fc3f5', [[e.x - UNIT * 0.45 + ox, e.y - UNIT * 0.3 + oy], [e.x + UNIT * 0.45 + ox, e.y - UNIT * 0.3 + oy]], UNIT * (warn ? 0.16 : 0.12));
  }
  if (e.mode === 'stunned') {
    ctx.fillStyle = '#ffe36a';
    for (let i = 0; i < 3; i++) { const a = state.time * 6 + i * 2.1; ctx.fillRect(e.x + Math.cos(a) * UNIT * 0.5 - 2, e.y - e.r - UNIT * 0.4 + Math.sin(a) * UNIT * 0.15 - 2, 4, 4); }
  }
}
function drawEyesDaylight() { for (const e of state.enemies) if (e.mode === 'stunned') drawEnemyEyes(e); }

// ---------- bird ----------
function drawBird() {
  const b = state.bird;
  if (b.mode === 'away' || b.mode === 'home') return;
  const s = UNIT * 0.35 * (1 + b.z / (UNIT * 4));
  const y = b.y - b.z;
  if (b.z > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.max(0.05, 0.2 - b.z / (UNIT * 40))})`; ctx.beginPath(); ctx.ellipse(b.x, b.y + UNIT, s * 0.6, s * 0.25, 0, 0, 6.28); ctx.fill(); }
  ctx.fillStyle = '#8a4a2a';
  if (b.mode === 'perch' || (b.mode === 'glide' && b.t < 0.05)) {
    const bob = Math.sin(state.time * 5) * 1.5;
    ctx.beginPath(); ctx.ellipse(b.x, b.y + bob, s * 0.55, s * 0.45, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#d86a3a'; ctx.beginPath(); ctx.ellipse(b.x + s * 0.1, b.y + bob + s * 0.1, s * 0.3, s * 0.25, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(b.x - s * 0.8, b.y + bob - s * 0.1, s * 0.35, s * 0.15);
    ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.moveTo(b.x + s * 0.5, b.y + bob - s * 0.1); ctx.lineTo(b.x + s * 0.8, b.y + bob); ctx.lineTo(b.x + s * 0.5, b.y + bob + s * 0.05); ctx.fill();
  } else {
    const flap = Math.sin(state.time * 30) * s * 0.8;
    ctx.beginPath(); ctx.ellipse(b.x, y, s * 0.4, s * 0.3, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x - s * 1.2, y - flap); ctx.lineTo(b.x - s * 0.3, y + s * 0.1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + s * 1.2, y - flap); ctx.lineTo(b.x + s * 0.3, y + s * 0.1); ctx.fill();
  }
}

// ---------- particles, drips ----------
function drawFx() {
  for (const p of state.fx) {
    const a = Math.max(0, 1 - p.t / p.life);
    if (p.color === 'shock') {
      ctx.strokeStyle = `rgba(230,215,180,${0.8 * a})`; ctx.lineWidth = UNIT * 0.25 * a + 1;
      const r = p.size * (0.3 + 0.7 * (1 - a));
      ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.55, 0, 0, 6.28); ctx.stroke();
    } else if (p.color === 'beam') {                       // light rising from a relic
      const g = ctx.createLinearGradient(p.x, p.y - UNIT * 8, p.x, p.y);
      g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(1, `rgba(255,240,180,${0.5 * a})`);
      ctx.fillStyle = g; ctx.fillRect(p.x - UNIT * 0.6, p.y - UNIT * 8, UNIT * 1.2, UNIT * 8);
    } else if (p.color === 'rain') {
      ctx.strokeStyle = `rgba(190,210,240,${0.45 * a})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02); ctx.stroke();
    } else if (p.color === 'smoke') {
      ctx.fillStyle = `rgba(80,80,80,${0.25 * a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + p.t), 0, 6.28); ctx.fill();
    } else if (p.color === 'streak') {
      ctx.strokeStyle = `rgba(240,245,230,${0.18 * a})`; ctx.lineWidth = 1.2;
      const m = Math.hypot(p.vx, p.vy) || 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / m * p.size * 2, p.y - p.vy / m * p.size * 2); ctx.stroke();
    } else if (p.color === 'leaf') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin + p.t * 6); ctx.globalAlpha = a;
      ctx.fillStyle = '#9aa84a'; ctx.fillRect(-UNIT * 0.12, -UNIT * 0.05, UNIT * 0.24, UNIT * 0.1); ctx.restore();
    } else if (p.color === 'note') {
      ctx.globalAlpha = a; ctx.fillStyle = '#fdf6e3'; ctx.font = `${Math.round(UNIT * 0.5)}px serif`; ctx.fillText('\u266A', p.x, p.y);
    } else if (p.life > 0) {
      ctx.globalAlpha = a; ctx.fillStyle = p.color;
      const s = p.size || Math.max(2, UNIT * 0.08);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
  }
  ctx.globalAlpha = 1;
}
function drawDrips() {
  const h = state.hero, reach = UNIT * 6;
  const lit = (x, y) => 0.3 + 0.7 * Math.max(0, 1 - Math.hypot(x - h.x, y - h.y) / reach);
  ctx.lineCap = 'round';
  for (const d of state.drops) {
    const len = Math.min(UNIT * 0.9, d.vy * 0.03);
    ctx.strokeStyle = `rgba(170,205,230,${0.8 * lit(d.x, d.y)})`; ctx.lineWidth = Math.max(1, UNIT * 0.05);
    ctx.beginPath(); ctx.moveTo(d.x, d.y - len); ctx.lineTo(d.x, d.y); ctx.stroke();
  }
  for (const s of state.splashes) {
    const k = s.t / 0.7, a = (1 - k) * lit(s.x, s.y);
    ctx.strokeStyle = `rgba(170,205,230,${0.7 * a})`; ctx.lineWidth = Math.max(1, UNIT * 0.04);
    ctx.beginPath(); ctx.ellipse(s.x, s.y, UNIT * 0.7 * k + 1, UNIT * 0.25 * k + 0.5, 0, 0, 6.28); ctx.stroke();
    ctx.fillStyle = `rgba(190,220,240,${0.9 * a})`;
    const r = Math.max(1, UNIT * 0.05);
    for (const b of s.bits) if (b.y <= s.y + 1) ctx.fillRect(b.x - r / 2, b.y - r / 2, r, r);
  }
  ctx.lineCap = 'butt';
}

// ---------- screen space: HUD, floating text, titles ----------
function wrap(text, maxW) {
  const words = text.split(' '), lines = [];
  let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
// ---------- floating text: laid out so no two boxes, the HUD, the title or the touch buttons overlap ----------
const TEXT = { min: 14, max: 19, pad: 8, gap: 6, readChars: 110, maxShown: 4 };
// areas of the screen text must stay out of
function reservedRects() {
  const r = [];
  if (state.hudRect) r.push(state.hudRect);
  if (state.title) r.push({ x: W * 0.1, y: H * 0.22 - UNIT * 1.6, w: W * 0.8, h: UNIT * (state.title.style === 'quest' || state.title.style === 'herald' ? 5.5 : 3.8) });
  if (state.arenaBanner) r.push(state.arenaBanner);
  // (the quest HUD is background: text is drawn over it rather than steering round it)
  if (state.actionHint && state.hintRect) r.push(state.hintRect);   // floating text keeps clear of the action label
  if (state.started && state.hero) {                  // never cover the hero
    const h = state.hero, [hx, hy] = toScreen(h.x, h.y - h.z), u = UNIT * state.cam.ez;
    r.push({ x: hx - u * 0.7, y: hy - u * 1.1, w: u * 1.4, h: u * 1.5 });
  }
  if (TOUCH && !state.menu) { r.push({ x: 0, y: H - 230, w: 230, h: 230 }); r.push({ x: W - 250, y: H - 230, w: 250, h: 230 }); }
  return r;
}
const overlaps = (a, b, g = 0) => a.x < b.x + b.w + g && b.x < a.x + a.w + g && a.y < b.y + b.h + g && b.y < a.y + a.h + g;
function layoutTexts() {
  const h = state.hero, placed = [], res = reservedRects(), boxes = [];
  const size = Math.round(Math.max(TEXT.min, Math.min(TEXT.max, UNIT * 0.52)));
  // long reads (letters, pages, signs) go in one panel at the bottom; only the newest shows
  const reads = state.texts.filter(t => t.text.length > TEXT.readChars && !SPEECH.has(t.key));   // speech never goes down here
  const read = reads[reads.length - 1];
  if (read) {
    ctx.font = `${size}px Georgia, serif`;
    const w = Math.min(W - 24, 720), lines = wrap(read.text, w - TEXT.pad * 3), lh = size * 1.4, bh = lines.length * lh + TEXT.pad * 2;
    const y = Math.max(20, H - bh - (TOUCH ? 240 : 24));
    const b = { t: read, x: (W - w) / 2, y, w, h: bh, lines, size, lh, panel: true };
    boxes.push(b); placed.push(b);
  }
  // the rest: the hero's own words first, then newest to oldest; anything that can't find clear room waits
  const speaking = speakingNow();
  const floats = state.texts.filter(t => (t.text.length <= TEXT.readChars || SPEECH.has(t.key)) && !(speaking && t.hint)).slice(-TEXT.maxShown)
    .sort((a, b) => (b.follow ? 1 : 0) - (a.follow ? 1 : 0) || a.t - b.t);
  for (const t of floats) {
    const fs = Math.round(size * t.size);
    ctx.font = `bold ${fs}px "Courier New", monospace`;
    const lines = t.badge ? [t.badge] : wrap(t.text, Math.min(W * 0.7, UNIT * (SPEECH.has(t.key) ? 7.5 : 10) * t.size, SPEECH.has(t.key) ? 340 : 460));
    const lh = fs * 1.3, bh = lines.length * lh + TEXT.pad * 1.4, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + TEXT.pad * 2.4;
    const sp = t.who === 'pip' && state.pip && state.pip.show ? state.pip : null;      // Pip's words ride along above Pip
    const wx = t.follow ? h.x : sp ? sp.x : t.x, wy = t.follow ? h.y - h.z - UNIT * 1.1 : sp ? sp.y - (sp.hz || 0) - UNIT * 1.3 : t.y;
    const [ax, ay] = toScreen(wx, wy);
    if (t.pos && t.pos.w === bw && !sp) {                    // already placed: it stays exactly there
      const b = { t, x: t.pos.x, y: t.pos.y, drawY: t.pos.y, w: bw, h: bh, lines, size: fs, lh };
      boxes.push(b); placed.push(b); continue;
    }
    if (sp && t.off && t.off.w !== bw) t.off = { dx: t.off.dx + t.off.w / 2 - bw / 2, dy: t.off.dy + (t.off.h || bh) - bh, w: bw, h: bh };   // a new page: same spot, new size
    if (sp && t.off) {                                        // riding with its speaker: same offset every frame, glided, never re-dodged
      const tx = Math.max(8, Math.min(W - bw - 8, ax + t.off.dx)), ty = Math.max(6, Math.min(H - bh - 6, ay + t.off.dy));
      t.sx = t.sx == null ? tx : t.sx + (tx - t.sx) * 0.25; t.sy = t.sy == null ? ty : t.sy + (ty - t.sy) * 0.25;
      const b = { t, x: t.sx, y: t.sy, drawY: t.sy, w: bw, h: bh, lines, size: fs, lh };
      boxes.push(b); placed.push(b); continue;
    }
    const x = Math.max(8, Math.min(W - bw - 8, ax - bw / 2));
    const pref = ay - bh;                             // above the thing it talks about
    let best = null, bestCost = Infinity;
    for (let k = 0; k < 24; k++) {                    // try the preferred spot, then step up and down around it
      const off = k === 0 ? 0 : (k % 2 ? -1 : 1) * Math.ceil(k / 2) * (bh * 0.5 + TEXT.gap);
      const y = pref + off;
      if (y < 6 || y + bh > H - 6) continue;
      const cand = { x, y, w: bw, h: bh };
      const hit = placed.some(p => overlaps(cand, p, TEXT.gap)) || res.some(p => overlaps(cand, p, 2));
      const cost = Math.abs(off) + (hit ? 1e6 : 0);
      if (cost < bestCost) { bestCost = cost; best = cand; }
      if (!hit) break;
    }
    if ((!best || bestCost >= 1e6) && SPEECH.has(t.key)) best = { x, y: Math.max(6, Math.min(H - bh - 6, pref)) };   // speech always shows, where it belongs
    if (!best || bestCost >= 1e6 && !SPEECH.has(t.key)) { t.ly = null; continue; }      // no clear room right now: better unseen than unreadable
    const y = best.y;
    if (sp) { t.off = { dx: best.x - ax, dy: y - ay, w: bw, h: bh }; t.sx = best.x; t.sy = y; }   // from now on it keeps this spot relative to Pip
    else t.pos = { x: best.x, y, w: bw };             // fixed from now on
    const b = { t, x: best.x, y, drawY: y, w: bw, h: bh, lines, size: fs, lh };
    boxes.push(b); placed.push(b);
  }
  state.textBoxes = boxes;                           // kept for the legibility tests
  return boxes;
}
function drawTexts() {
  for (const b of layoutTexts()) {
    const t = b.t, a = Math.min(1, t.t / 0.15) * Math.min(1, (t.life - t.t) / 0.5);
    ctx.globalAlpha = a;
    const y = b.panel ? b.y : b.drawY, speech = SPEECH.has(t.key) && !b.panel, wait = t.hold;
    // Two kinds of speech. Waiting words (they need F) sit in a solid box with a bright edge in the speaker's colour and
    // the key badge. Free words (they'll go by themselves) are a light, see-through bubble with no edge. Both point at
    // whoever is talking.
    ctx.fillStyle = b.panel ? 'rgba(20,16,12,.9)' : speech && !wait ? 'rgba(10,8,14,.5)' : 'rgba(10,8,14,.86)';
    if (speech && !wait) ctx.globalAlpha = a * 0.92;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(b.x, y, b.w, b.h, t.badge ? b.h / 2 : speech && !wait ? 12 : 8) : ctx.rect(b.x, y, b.w, b.h); ctx.fill();
    if (b.panel || t.badge) { ctx.strokeStyle = t.badge ? '#ffe38a' : 'rgba(255,227,138,.5)'; ctx.lineWidth = t.badge ? 2 : 1.5; ctx.stroke(); }
    if (speech && wait) { ctx.strokeStyle = t.color; ctx.lineWidth = 2; ctx.globalAlpha = a * (0.7 + 0.3 * Math.sin(state.time * 3)); ctx.stroke(); ctx.globalAlpha = a; }
    if (speech) {                                                            // the little tail toward the speaker
      const sp = t.who === 'pip' && state.pip && state.pip.show ? state.pip : null, [sx, sy] = toScreen(sp ? sp.x : t.x, sp ? sp.y - UNIT * 0.9 : t.y + UNIT * 0.4);
      const below = sy > y + b.h / 2, tx = Math.max(b.x + 12, Math.min(b.x + b.w - 12, sx)), ty = below ? y + b.h : y, tip = below ? Math.min(sy, ty + 12) : Math.max(sy, ty - 12);
      ctx.fillStyle = wait ? 'rgba(10,8,14,.86)' : 'rgba(10,8,14,.5)'; ctx.beginPath(); ctx.moveTo(tx - 7, ty); ctx.lineTo(tx + 7, ty); ctx.lineTo(tx + (sx - tx) * 0.3, tip); ctx.closePath(); ctx.fill();
    }
    if (t.badge) { ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${b.size}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(t.badge, b.x + b.w / 2, y + TEXT.pad * 0.7); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; continue; }
    ctx.fillStyle = t.color; ctx.textBaseline = 'top';
    if (b.panel) { ctx.font = `${b.size}px Georgia, serif`; ctx.textAlign = 'left'; b.lines.forEach((l, i) => ctx.fillText(l, b.x + TEXT.pad * 1.5, y + TEXT.pad + i * b.lh)); }
    else { ctx.font = speech && !wait ? `italic bold ${b.size}px "Courier New", monospace` : `bold ${b.size}px "Courier New", monospace`; ctx.textAlign = 'center'; b.lines.forEach((l, i) => ctx.fillText(l, b.x + b.w / 2, y + TEXT.pad * 0.7 + i * b.lh)); }
    ctx.globalAlpha = a;
    if (t.hold) drawReadOn(b.x + b.w, y + b.h, b.size);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  ctx.globalAlpha = 1;
}
// the small "read on" mark at the corner of anything that waits for you: the action key, or "tap" on a phone
function drawReadOn(x, y, size) {
  const k = 0.55 + 0.45 * Math.abs(Math.sin(state.time * 3)), lab = TOUCH ? 'tap' : K.act.toUpperCase().slice(0, 5), fs = Math.round(Math.max(10, size * 0.62));
  ctx.save(); ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(lab).width + fs * 0.9, h = fs * 1.35, bx = x - w * 0.5 - 4, by = y;
  ctx.globalAlpha *= k; ctx.fillStyle = '#ffe38a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx - w / 2, by - h / 2, w, h, h / 2) : ctx.rect(bx - w / 2, by - h / 2, w, h); ctx.fill();
  ctx.fillStyle = '#2a1e10'; ctx.fillText(lab, bx, by + 1);
  ctx.restore();
}
// ---------- quest banners, themed by region ----------
// Every place so far (meadow, glade, riverbank, forest, marsh, swamp, camp, the hollows) is the first region, the Vale:
// a green cloth ribbon with notched tails, gold trim and leaf sprigs. A new region adds its own theme here.
const REGION_THEME = {
  high: { cloth: '#3a5a86', cloth2: '#5a7eae', edge: '#223a5a', trim: '#f0e0b0', leaf: '#cfe4f4', text: ['#fffaf0', '#f4e0a8', '#c89a4e'], ink: '#1a2a3a', sprig: 'leaf' },
  vale: { cloth: '#2f5a2a', cloth2: '#447e3a', edge: '#1d3a1a', trim: '#e8c86a', leaf: '#8cc05a', text: ['#fff8d8', '#f2d27a', '#c8942e'], ink: '#1f2a12', sub: '#e8f4d8' },
  other: { cloth: '#3a3f55', cloth2: '#545b78', edge: '#22263a', trim: '#c8d0e8', leaf: '#a0a8c8', text: ['#ffffff', '#d8def0', '#9aa4c8'], ink: '#10131f', sub: '#e8ecf8' },
};
const regionOf = sc => (sc && sc.region) || 'vale';
function heraldImage(T) {
  const th = REGION_THEME[regionOf(sceneDef())] || REGION_THEME.other, dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = Math.min(W / 13, UNIT * 1.25), c = document.createElement('canvas'), g = c.getContext('2d');
  const font = `bold ${Math.round(size)}px Georgia, "Times New Roman", serif`; g.font = font;
  const tw = Math.max(g.measureText(T.text).width, size * 4), bw = tw + size * 3.2, bh = size * 1.9, tail = size * 0.9, pad = size * 0.6;
  g.font = `${Math.round(size * 0.4)}px Georgia, serif`; const nw = Math.max(T.note ? g.measureText(T.note).width : 0, T.sub ? g.measureText(T.sub).width * 1.05 : 0); g.font = font;
  c.width = Math.ceil((Math.max(bw + tail * 3.2, nw + pad * 2) + pad * 2) * dpr); c.height = Math.ceil((bh + size * (T.note ? 2.2 : 1.4) + pad) * dpr); c.dpr = dpr;
  g.scale(dpr, dpr); g.font = font;                                      // resizing the canvas reset the font
  const cx = c.width / dpr / 2, top = size * 1.1, y0 = top, y1 = top + bh, x0 = cx - bw / 2, x1 = cx + bw / 2;
  // tails, tucked behind, with a notch
  g.fillStyle = th.edge;
  for (const s of [-1, 1]) { const xe = s < 0 ? x0 : x1, xo = xe + s * tail * 1.6; g.beginPath(); g.moveTo(xe, y0 + bh * 0.22); g.lineTo(xo, y0 + bh * 0.22); g.lineTo(xo - s * tail * 0.55, y0 + bh * 0.6); g.lineTo(xo, y1 + bh * 0.02); g.lineTo(xe, y1 + bh * 0.02); g.closePath(); g.fill(); }
  // the cloth, a gentle wave, lighter across the middle
  const grad = g.createLinearGradient(0, y0, 0, y1); grad.addColorStop(0, th.cloth2); grad.addColorStop(0.5, th.cloth); grad.addColorStop(1, th.edge);
  g.fillStyle = grad; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, y0 - size * 0.25, x1, y0); g.lineTo(x1, y1); g.quadraticCurveTo(cx, y1 - size * 0.25, x0, y1); g.closePath(); g.fill();
  g.strokeStyle = th.trim; g.lineWidth = Math.max(1.5, size * 0.05);
  g.beginPath(); g.moveTo(x0 + size * 0.2, y0 + size * 0.14); g.quadraticCurveTo(cx, y0 - size * 0.1, x1 - size * 0.2, y0 + size * 0.14); g.stroke();
  g.beginPath(); g.moveTo(x0 + size * 0.2, y1 - size * 0.14); g.quadraticCurveTo(cx, y1 - size * 0.38, x1 - size * 0.2, y1 - size * 0.14); g.stroke();
  // leaf sprigs at each end
  for (const s of [-1, 1]) { const lx = cx + s * (bw / 2 - size * 0.55), ly = (y0 + y1) / 2 - size * 0.05;
    g.strokeStyle = th.leaf; g.lineWidth = Math.max(1, size * 0.04); g.beginPath(); g.moveTo(lx - s * size * 0.25, ly + size * 0.2); g.quadraticCurveTo(lx, ly, lx + s * size * 0.2, ly - size * 0.25); g.stroke();
    g.fillStyle = th.leaf; for (const [dx, dy, r] of [[-0.1, 0.1, 0.5], [0.08, -0.08, -0.4], [0.16, -0.2, 0.3]]) { g.save(); g.translate(lx + s * dx * size, ly + dy * size); g.rotate(s * r); g.beginPath(); g.ellipse(0, 0, size * 0.13, size * 0.06, 0, 0, 6.28); g.fill(); g.restore(); } }
  // the words: an ink shadow, then a gold gradient (no blur, so moving it is cheap)
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ty = (y0 + y1) / 2 - size * 0.1;
  g.fillStyle = th.ink; g.globalAlpha = 0.55; g.fillText(T.text, cx + size * 0.04, ty + size * 0.06); g.globalAlpha = 1;
  const tg = g.createLinearGradient(0, ty - size / 2, 0, ty + size / 2); tg.addColorStop(0, th.text[0]); tg.addColorStop(0.55, th.text[1]); tg.addColorStop(1, th.text[2]);
  g.fillStyle = tg; g.fillText(T.text, cx, ty);
  g.font = `italic ${Math.round(size * 0.42)}px Georgia, serif`; g.fillStyle = th.sub; g.globalAlpha = 0.9; g.fillText(T.sub, cx, top - size * 0.45);
  if (T.note) { g.font = `${Math.round(size * 0.4)}px Georgia, serif`; g.fillStyle = th.sub; g.fillText(T.note, cx, y1 + size * 0.5); }   // what was done
  return c;
}
// the coached step: a small fixed note at the top, over everything (the pack too), until you've done it
// while a quest banner is up, the y just below it (quest info sits there); otherwise null
function bannerBelow() { const b = state.bannerRect; return b && state.title && state.title.style === 'herald' && state.time - b.at < 0.2 ? b.y + b.h + 8 : null; }
function drawCoach() {
  const c = state.coach; if (!c) return;
  const steps = COACH[c.id](), s = steps[c.i]; if (!s) return;
  const fs = Math.round(Math.max(13, Math.min(17, UNIT * 0.44))), k = Math.min(1, (state.time - c.t) / 0.3);
  ctx.save(); ctx.font = `bold ${fs}px "Courier New", monospace`;
  const B = bannerBelow(), label = 'Pip: ', tw = ctx.measureText(label + s.text).width, dots = steps.length * fs * 0.6, w = Math.min(W - 24, tw + dots + fs * 2.4), h = fs * 2.1, x = (W - w) / 2, y = (B || 8) - (1 - k) * 10;   // under a banner, never over it
  ctx.globalAlpha = 0.6 + 0.4 * k;
  ctx.fillStyle = 'rgba(12,10,18,.9)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, h / 2) : ctx.rect(x, y, w, h); ctx.fill();
  ctx.strokeStyle = `rgba(191,228,255,${0.5 + 0.3 * Math.sin(state.time * 3)})`; ctx.lineWidth = 2; ctx.stroke();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = '#bfe4ff'; ctx.fillText(label, x + fs, y + h / 2 + 1);
  ctx.fillStyle = '#fdf6e3'; ctx.fillText(s.text, x + fs + ctx.measureText(label).width, y + h / 2 + 1);
  for (let i = 0; i < steps.length; i++) { ctx.fillStyle = i < c.i ? '#b8f28a' : i === c.i ? '#ffe38a' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(x + w - fs * 0.9 - (steps.length - 1 - i) * fs * 0.6, y + h / 2, fs * 0.18, 0, 6.28); ctx.fill(); }
  ctx.restore();
}
// the bottom-left feed: newest at the bottom, each line fades after a few seconds
function drawFeed() {
  const f = state.feed; if (!f || !f.length) return;
  const fs = Math.round(Math.max(12, Math.min(15, UNIT * 0.4))), lh = fs * 1.45, x = 14; let y = H - 16;
  ctx.save(); ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  for (let i = f.length - 1; i >= 0; i--) {
    const n = f[i]; n.t += 1 / 60; const a = Math.min(1, n.t / 0.2, (4 - n.t) / 0.8); if (a <= 0) { f.splice(i, 1); continue; }
    const w = ctx.measureText(n.text).width;
    ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#0c0a10'; ctx.fillRect(x - 6, y - fs - 3, w + 12, fs + 8);
    ctx.globalAlpha = a; ctx.fillStyle = n.color; ctx.fillText(n.text, x, y);
    y -= lh;
  }
  ctx.restore();
}
function drawScroll() {
  const q = state.scrolls; if (!q || !q.length) return;
  const S = q[0]; S.t += 1 / 60; if (S.t > S.life) { q.shift(); return; }
  const a = Math.min(1, S.t / 0.35, (S.life - S.t) / 0.6), fs = Math.round(Math.max(13, Math.min(16, UNIT * 0.42)));
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = HAND(Math.round(fs * 1.35), true); const tw = ctx.measureText(S.title).width;
  ctx.font = HAND(Math.round(fs * 1.15), false); const lines = wrap(S.text, Math.min(W * 0.6, 420)); const lw = Math.max(tw, ...lines.map(l => ctx.measureText(l).width));
  const w = Math.min(W - 40, lw + fs * 3), h = fs * (2.4 + lines.length * 1.25 + (S.status ? 1.3 : 0.4)), x = (W - w) / 2, y = H - h - Math.max(18, H * 0.04) + (1 - Math.min(1, S.t / 0.35)) * 12;   // near the bottom edge
  ctx.fillStyle = 'rgba(232,216,176,.72)'; ctx.fillRect(x, y, w, h);                                   // the paper: see-through, but the ink stays readable
  ctx.fillStyle = 'rgba(201,180,138,.8)'; for (const yy of [y - 5, y + h - 5]) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 8, yy, w + 16, 10, 5) : ctx.rect(x - 8, yy, w + 16, 10); ctx.fill(); }   // the rolled ends
  ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + 4, y + 6, w - 8, h - 12);
  ctx.textAlign = 'center'; ctx.fillStyle = '#5a3a1a'; ctx.font = HAND(Math.round(fs * 1.35), true); ctx.fillText(S.title, W / 2, y + fs * 1.9);
  ctx.fillStyle = '#3e2a1a'; ctx.font = HAND(Math.round(fs * 1.15), false); lines.forEach((l, i) => ctx.fillText(l, W / 2, y + fs * (3.2 + i * 1.25)));
  if (S.status) { ctx.fillStyle = 'rgba(62,42,26,.6)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`; ctx.fillText(`Status (${K.menu.toUpperCase()}) has more`, W / 2, y + h - fs * 0.7); }
  ctx.restore(); ctx.textAlign = 'left';
}
function drawTitle() {
  const T = state.title;
  if (!T) return;
  const k = T.t, fadeOut = Math.min(1, (T.life - k) / 0.6);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (T.style === 'herald') {                        // quest banners: drawn once to their own canvas, then only moved and faded (smooth)
    const img = T.img || (T.img = heraldImage(T));
    const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };   // smootherstep
    const fin = smooth(k / 0.9), unfurl = smooth(k / 0.75), fout = smooth((T.life - k) / 1.1), a = Math.min(fin, fout);
    const drift = (1 - fin) * UNIT * 0.5 - (1 - fout) * UNIT * 0.35;
    const dw = img.width / img.dpr, dh = img.height / img.dpr, x = W / 2 - dw / 2, y = Math.max(8, H * 0.18 - dh / 2) + drift;   // the banner owns the top; quest info goes under it
    state.bannerRect = { x, y, w: dw, h: dh, at: state.time };
    const vis = Math.max(1, img.width * unfurl), sx = (img.width - vis) / 2;           // the ribbon unrolls from the middle out
    ctx.globalAlpha = a;
    ctx.drawImage(img, sx, 0, vis, img.height, x + sx / img.dpr, y, vis / img.dpr, dh);
    } else if (T.style === 'quest') {
    const pop = k < 0.35 ? 2.2 - 1.2 * (k / 0.35) : 1 + 0.04 * Math.sin(k * 6) * Math.max(0, 1 - k);
    const size = Math.min(W / 4.2, UNIT * 3.4) * pop;
    ctx.globalAlpha = Math.min(1, k / 0.1) * fadeOut;
    if (k < 0.3) { ctx.fillStyle = `rgba(255,255,240,${0.6 * (1 - k / 0.3)})`; ctx.fillRect(0, 0, W, H); }
    ctx.font = `900 ${Math.round(size)}px Georgia, "Times New Roman", serif`;
    ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = size * 0.25;
    ctx.lineWidth = Math.max(3, size * 0.06); ctx.strokeStyle = '#3a2410';
    const y = H * 0.36;
    ctx.strokeText(T.text, W / 2, y);
    const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    g.addColorStop(0, '#fff6c8'); g.addColorStop(0.55, '#f2c94c'); g.addColorStop(1, '#b8792a');
    ctx.fillStyle = g; ctx.fillText(T.text, W / 2, y);
    ctx.shadowBlur = 0;
    if (k > 0.5) {
      ctx.globalAlpha = Math.min(1, (k - 0.5) / 0.4) * fadeOut;
      ctx.font = `italic ${Math.round(Math.max(14, size * 0.16))}px Georgia, serif`;
      ctx.fillStyle = '#fdf6e3'; ctx.fillText(T.sub, W / 2, y + size * 0.62);
    }
  } else {
    const size = Math.min(W / 12, UNIT * (T.style === 'end' ? 1.6 : 1.1));
    ctx.globalAlpha = Math.min(1, k / 0.4) * fadeOut;
    ctx.font = `bold ${Math.round(size)}px Georgia, serif`;
    const relic = T.style === 'relic';
    if (relic) { ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = size * 0.4; }
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText(T.text, W / 2 + 2, H * 0.22 + 2);
    ctx.fillStyle = relic ? '#ffe38a' : '#fdf6e3'; ctx.fillText(T.text, W / 2, H * 0.22);
    ctx.shadowBlur = 0;
    if (T.sub) { ctx.fillStyle = '#fdf6e3'; ctx.font = `${Math.round(size * 0.45)}px "Courier New", monospace`; wrap(T.sub, Math.min(W * 0.85, 560)).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.22 + size * (1.1 + i * 0.6))); }
    if (T.hold) drawReadOn(W / 2 + size * 1.2, H * 0.22 + size * (T.sub ? 2.1 : 1.1), size * 0.9);
  }
  ctx.restore();
}

// ---------------- full screen on phones ----------------
const standalone = () => window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const inFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || standalone();
function goFullscreen() {
  if (inFullscreen()) return;
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req) {
    try { const p = req.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => fullscreenTip()); } catch (e) { fullscreenTip(); }
  } else fullscreenTip();                            // iPhone Safari has no full-screen API for pages
}
function exitFullscreen() { const ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) ex.call(document); }
function fullscreenTip() {
  if (fullscreenTip.shown) return;                  // once per session is enough
  fullscreenTip.shown = true;
  const tip = document.getElementById('fsTip');
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  tip.textContent = ios ? 'For full screen on iPhone: tap Share, then "Add to Home Screen", and launch Quest from the new icon.' : 'Full screen is not available in this browser. Try "Add to Home Screen" from the browser menu.';
  tip.classList.remove('hidden');
  setTimeout(() => tip.classList.add('hidden'), 6000);
}
const canFullscreen = () => !standalone() && !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || /iPhone|iPad|iPod/.test(navigator.userAgent));
function begin() {
  if (state.started) return;
  if (TOUCH) goFullscreen();                         // the first tap on a phone also takes the screen
  state.started = true;
  startEl.remove();
  state.texts = []; state.title = null;
  if (ARENA) startArena(); else if (PUZZLE) startPuzzleHub(); else startIntro();
  startMusic();
}
function resizeCanvasOnly() {
  canvas.width = W * DPR; canvas.height = H * DPR;
  lightCv.width = Math.ceil(W / 2); lightCv.height = Math.ceil(H / 2);
}
function resize() {
  if (OVERVIEW) return;                              // the map page keeps its own size
  const oW = W, oH = H;
  DPR = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  resizeCanvasOnly();
  computeUnit();
  const sx = W / oW, sy = H / oH;
  for (const a of [state.hero, ...state.enemies, ...state.items, ...state.hazards, ...state.rings, state.bird].filter(Boolean)) { a.x *= sx; a.y *= sy; }
  if (sceneDef() && sceneDef().river && sceneDef().river.stones) layoutStones(sceneDef());
  refreshSceneGeometry();
}

const PARAMS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
let last = performance.now();
function loop(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state.slowmo > 0) { state.slowmo -= dt; dt *= 0.3; }
  // a bad frame should never stop the game: log it once and keep going
  try { update(dt); draw(); } catch (e) { if (!loop.warned) { loop.warned = true; console.error('Frame error (game continues):', e); } }
  requestAnimationFrame(loop);
}
// the sidequest's pieces: the far-bank camp, the jetty and raft, ripples, the tunnel's gleam, the cascade
function drawRiverQuest(sc) {
  const f = sc.feat, u = UNIT, inv = state.inv;
  if (f.farside) {
    const x = f.farside[0] * W, y = f.farside[1] * H;
    drawShack(x, y, u);
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + u * 1.3, y - u * 0.9, u * 0.1, u * 1.1); ctx.fillRect(x + u * 0.95, y - u * 1.05, u * 0.8, u * 0.4);   // sign
    ctx.fillStyle = '#3a2614'; ctx.fillRect(x + u * 1.05, y - u * 0.95, u * 0.6, u * 0.05); ctx.fillRect(x + u * 1.05, y - u * 0.82, u * 0.45, u * 0.05);
    if (!rtFor(sc.id).flags.salvaged) { ctx.fillStyle = '#9a7a4a'; for (let i = 0; i < 3; i++) ctx.fillRect(x - u * 0.4 + i * u * 0.3, y + u * 0.9, u * 0.22, u * 0.9); }   // Wick's unfinished raft
    else { ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x - u * 0.4, y + u * 1.6, u * 0.8, u * 0.12); }
  }
  if (f.dock) drawJetty(sc);
  if (f.oldJetty) drawOldJetty(sc);
  for (const [x, y, i] of fishSpots(sc)) {             // rising fish: rings that spread and fade, always in the water
    const k = (state.time * 0.7 + i * 0.37) % 1;
    ctx.strokeStyle = `rgba(230,245,250,${0.7 * (1 - k)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y, u * (0.2 + k * 0.8), u * (0.12 + k * 0.5), 0, 0, 6.28); ctx.stroke();
  }
  if (f.tunnel) {                                       // a gleam deep under the water
    const x = f.tunnel[0] * W, y = f.tunnel[1] * H, k = 0.5 + 0.5 * Math.sin(state.time * 2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, u * 1.2);
    g.addColorStop(0, `rgba(200,255,240,${0.35 + 0.35 * k})`); g.addColorStop(1, 'rgba(200,255,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, u * 1.2, u * 0.85, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(10,30,40,.55)'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.55, u * 0.35, 0, 0, 6.28); ctx.fill();
  }
  if (sc.river && sc.river.fall) {                       // the cascade: a white wall of falling water and spray
    const [fx, fy] = sc.river.fall, x = fx * W, y = fy * H, w = sc.river.w * u;
    ctx.fillStyle = 'rgba(240,250,255,.85)'; ctx.fillRect(x - w * 0.6, y - u * 0.4, w * 1.2, u * 1.1);
    ctx.strokeStyle = 'rgba(200,225,240,.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const xx = x - w * 0.55 + i * w * 0.12, off = (state.time * u * 8 + i * 17) % (u * 1.1); ctx.beginPath(); ctx.moveTo(xx, y - u * 0.4 + off); ctx.lineTo(xx, y - u * 0.1 + off); ctx.stroke(); }
    if (Math.random() < 0.6) state.fx.push({ x: x + (Math.random() - 0.5) * w, y: y + u * 0.8, vx: (Math.random() - 0.5) * u * 2, vy: -u * (0.5 + Math.random()), t: 0, life: 0.9, color: 'rgba(235,245,255,.7)', size: u * 0.2 });
  }
  const fi = state.fish;                                // the line and bobber while fishing
  if (fi) {
    const h = state.hero, bob = fi.phase === 'bite' ? Math.sin(state.time * 40) * 3 + 3 : Math.sin(state.time * 3) * 1.5;
    ctx.strokeStyle = 'rgba(230,230,220,.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(h.x + h.side * UNIT * 0.6, h.y - UNIT * 0.9); ctx.quadraticCurveTo((h.x + fi.x) / 2, Math.min(h.y, fi.y) - UNIT, fi.x, fi.y + bob); ctx.stroke();
    ctx.fillStyle = '#e04a3a'; ctx.beginPath(); ctx.arc(fi.x, fi.y + bob, UNIT * 0.12, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#f2efe6'; ctx.beginPath(); ctx.arc(fi.x, fi.y + bob - UNIT * 0.06, UNIT * 0.06, 0, 6.28); ctx.fill();
  }
  if (state.cut && state.cut.type === 'raft') {         // the raft under your feet
    const h = state.hero;
    ctx.fillStyle = '#9a7a4a'; for (let i = 0; i < 4; i++) ctx.fillRect(h.x - UNIT * 0.8 + i * UNIT * 0.4, h.y - UNIT * 0.2, UNIT * 0.36, UNIT * 1.0);
  }
}
// ---------------- HUD: vigor instead of hearts ----------------
function drawHUD() {
  if (!state.started || (state.intro && !state.intro.gone)) return;
  const h = state.hero, inv = state.inv, mv = maxVig(), r = Math.max(0, h.vig / mv);
  const s = Math.min(24, UNIT * 0.6), hgt = Math.max(10, s * 0.55), rowW0 = s * (ALL_SLOTS.length * 1.2 + (ALL_SLOTS.length - 1) * 0.35);
  const x0 = TOUCH ? 14 : W - rowW0 - 16, y0 = TOUCH ? 14 : H - hgt - s * 2.3 - 14;   // bottom-right corner (top-left on touch, clear of the buttons)
  // faded when nothing's happening: brightens while vigor is changing (hurt, spent, resting) and when a slot is used or changes
  if (state.hudVig == null || Math.abs(state.hudVig - h.vig) > 0.01) { state.hudVigT = state.time; state.hudVig = h.vig; }
  const hudA = Math.max(0.28, Math.min(1, 1 - (state.time - (state.hudVigT || -9) - 2.5) / 1.2)), slotA = Math.max(0.28, Math.min(1, 1 - (state.time - (state.slotLit || -9) - 2.5) / 1.2));
  const lowNow = h.vig / mv <= 0.35;
  ctx.save(); ctx.globalAlpha = lowNow ? 1 : hudA;
  // Vigor: the bar grows with your vigor up to one full layer of 17 (as wide as the A S D F row). Past that, each
  // further 17 lays another fill over the same bar, darker and more solid than the one below, without end. The first
  // fill is a very light green. The top layer's room shows faintly. Low on vigor, the frame pulses red.
  const LAYER = 17, rowW = s * (ALL_SLOTS.length * 1.2 + (ALL_SLOTS.length - 1) * 0.35);
  const len = rowW * Math.min(1, mv / LAYER), bx = x0 + (rowW - len) / 2;            // the bar and the slot row share a centre
  const fills = Math.max(1, Math.ceil(mv / LAYER - 1e-9)), v = Math.max(0, h.vig);
  const layer = i => { const k = 1 - Math.pow(0.55, i); return [Math.round(226 - 200 * k), Math.round(250 - 160 * k), Math.round(210 - 180 * k), 1 - 0.53 * Math.pow(0.55, i)]; };   // the first 17 at 47%, each further layer richer and more solid
  state.vigorBar = { x: bx, w: len, rowX: x0, rowW, fills };
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx - 3, y0 - 3, len + 6, hgt + 6);
  { const top = fills - 1, [cr, cg, cb] = layer(top); ctx.fillStyle = `rgba(${cr},${cg},${cb},0.2)`; ctx.fillRect(bx, y0, rowW * Math.min(1, (mv - top * LAYER) / LAYER), hgt); }
  for (let i = 0; i < fills; i++) {
    const f = Math.max(0, Math.min(1, (v - i * LAYER) / LAYER));
    if (f <= 0) break;
    const [cr, cg, cb, ca] = layer(i);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${ca})`; ctx.fillRect(bx, y0, rowW * f, hgt);
    if (i > 0) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(bx + rowW * f - 1, y0, 1, hgt); }   // where this layer's edge sits over the one below
  }
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(bx, y0, rowW * Math.min(1, v / LAYER), hgt * 0.3);
  if (r <= 0.35) { ctx.strokeStyle = `rgba(230,90,60,${0.55 + 0.45 * Math.sin(state.time * 8)})`; ctx.lineWidth = 2; ctx.strokeRect(bx - 2, y0 - 2, len + 4, hgt + 4); }
  ctx.font = `bold ${Math.round(hgt * 0.95)}px "Courier New", monospace`;
  const vt = len > rowW * 0.8 ? `vigor ${Math.ceil(h.vig)}/${mv}` : `${Math.ceil(h.vig)}/${mv}`;
  const lightBar = Math.ceil(v / LAYER - 1e-9) <= 2 && v > LAYER * 0.3;   // dark words on the pale fills, light words on the dark ones
  ctx.fillStyle = lightBar ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.55)'; ctx.fillText(vt, bx + 5, y0 + hgt * 0.85 + 1);
  ctx.fillStyle = lightBar ? '#22361a' : '#fdf6e3'; ctx.fillText(vt, bx + 4, y0 + hgt * 0.85);
  ctx.restore(); ctx.save(); ctx.globalAlpha = Math.max(slotA, state.menu || state.radial ? 1 : 0);
  // the quick slots, A S D F, centred under the vigor bar; timed effects sit small to the right of them
  let x = drawSlotBar(x0, y0 + hgt + s * 0.95, rowW, s), y = y0 + hgt + s * 0.95;
  const eff = (type, bar) => {
    const k = 0.7; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - s * 0.6 * k, y - s * 0.6 * k, s * 1.2 * k, s * 1.2 * k);
    drawItemIcon(type, x, y, s * 0.8 * k);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - s * 0.5 * k, y + s * 0.58 * k, s * k, 3); ctx.fillStyle = '#c9f27a'; ctx.fillRect(x - s * 0.5 * k, y + s * 0.58 * k, s * k * bar, 3);
    x += s * 1.0;
  };
  if (inv.lumin > 0) eff('lumin', Math.min(1, inv.lumin / 45));
  if (inv.pepper > 0) eff('pepper', Math.min(1, inv.pepper / 90));
  if (inv.fishBuff > 0) eff('fish', Math.min(1, inv.fishBuff / 180));
  if (inv.slime > 0) eff('slime', inv.slime / 25);
  if (inv.carrotBuff > 0) eff('carrot', inv.carrotBuff / 15);
  if (inv.squashBuff > 0) eff('squash', inv.squashBuff / 20);
  ctx.restore();
  const need = 25 * Math.pow(1.35, inv.tlevel);
  ctx.fillStyle = 'rgba(184,242,138,.6)'; ctx.fillRect(bx, y0 + hgt + 1, len * Math.min(1, inv.xp / need), 2);
  const boss = state.enemies.find(e => e.type === 'warden' && e.mode !== 'dormant' && e.mode !== 'talk' && !e.dead);
  if (boss) {
    const bw = Math.min(W * 0.6, 420), bx = (W - bw) / 2, by = H - 34;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 12);
    ctx.fillStyle = boss.enraged ? '#e0603a' : '#6fc3f5'; ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxHp), 8);
  }
  state.hudRect = TOUCH ? { x: 0, y: 0, w: rowW + 40, h: y0 + hgt + s * 1.8 } : { x: x0 - 12, y: y0 - 8, w: W - x0 + 12, h: H - y0 + 8 };   // text keeps out of here
  drawArenaBanner();
  drawRapidsHud();
}

// Pip's maps: every place you've been, blanks where you haven't, found mushrooms, a pulse where you are
function drawJournalMap(ox, oy, aw, ah, fs) {
  const ids = Object.keys(MAP_LAYOUT), cols = 15, rows = 13, cw = aw / cols, chh = ah / rows;
  const at = id => [ox + MAP_LAYOUT[id][0] * cw + cw * 0.12, oy + MAP_LAYOUT[id][1] * chh + chh * 0.12];
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(200,190,170,.35)';
  for (const id of ids) for (const ex of WORLD[id].exits) if (MAP_LAYOUT[ex.to] && state.seen[id] && state.seen[ex.to]) {
    const [ax, ay] = at(id), [bx, by] = at(ex.to);
    ctx.beginPath(); ctx.moveTo(ax + cw * 0.38, ay + chh * 0.38); ctx.lineTo(bx + cw * 0.38, by + chh * 0.38); ctx.stroke();
  }
  for (const id of ids) {
    const [bx, by] = at(id), seen = state.seen[id], here = id === state.scene;
    ctx.fillStyle = seen ? (REGION_COLOR[WORLD[id].area] || '#888') : 'rgba(255,255,255,.05)';
    ctx.fillRect(bx, by, cw * 0.76, chh * 0.76);
    if (here) { ctx.strokeStyle = `rgba(255,227,138,${0.6 + 0.4 * Math.sin(state.time * 6)})`; ctx.lineWidth = 3; ctx.strokeRect(bx - 2, by - 2, cw * 0.76 + 4, chh * 0.76 + 4); }
    if (seen && WORLD[id].feat.shroom) { ctx.fillStyle = state.inv.shrooms[id] ? '#b48af0' : '#6a5a88'; ctx.beginPath(); ctx.arc(bx + cw * 0.62, by + chh * 0.2, Math.max(3, cw * 0.09), 0, 6.28); ctx.fill(); }
  }
}
// the pack: a row of tabs, a grid of icons, one short line and a few actions for the selected icon
function drawPack(m, x, y, pw, fs) {
  const hits = state.packHits = [], tab = PACK_TABS[m.tab] || 'Gear';
  const rr_ = (x0, y0, w0, h0, r0) => { ctx.beginPath(); ctx.moveTo(x0 + r0, y0); ctx.arcTo(x0 + w0, y0, x0 + w0, y0 + h0, r0); ctx.arcTo(x0 + w0, y0 + h0, x0, y0 + h0, r0); ctx.arcTo(x0, y0 + h0, x0, y0, r0); ctx.arcTo(x0, y0, x0 + w0, y0, r0); ctx.closePath(); };
  const pwide = Math.min(W - 24, 680), px = (W - pwide) / 2;
  // tabs: only the ones with something behind them, each as wide as its word (the font shrinks to fit the row)
  const chips = PACK_TABS.map((t, i) => [t, i]).filter(([t]) => tabShown(t));
  let tfs = Math.round(fs * 0.8), cws;
  for (;;) { ctx.font = `${tfs}px "Courier New", monospace`; cws = chips.map(([t]) => ctx.measureText(t).width + tfs * 1.4); if (cws.reduce((a, b) => a + b, 0) + chips.length * 4 <= pwide || tfs <= 9) break; tfs--; }
  ctx.textAlign = 'center';
  const th = fs * 1.9, tot = cws.reduce((a, b) => a + b, 0) + (chips.length - 1) * 4; let cx = px + (pwide - tot) / 2;
  chips.forEach(([label, i], k) => {
    const cw = cws[k], on = m.tab === i, foc = on && m.focus === 'tabs';
    ctx.fillStyle = on ? 'rgba(242,201,76,.25)' : 'rgba(255,255,255,.06)'; rr_(cx, y - th * 0.75, cw, th, 6); ctx.fill();
    if (foc) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = on ? '#ffe38a' : '#d8d0c0'; ctx.fillText(label, cx + cw / 2, y + fs * 0.1);
    const x0 = cx; hits.push({ x: x0, y: y - th * 0.75, w: cw, h: th, fn: () => { m.tab = i; m.sel = 0; m.focus = 'grid'; } });
    cx += cw + 4;
  });
  y += th * 0.9;
  const areaH = H - y - fs * 7.5;
  if (tab === 'System') {                              // save, load, controls and settings as a plain list
    const items = SYSTEM_ITEMS(), lw = Math.min(pwide, 420), lx = (W - lw) / 2, rh = Math.max(fs * 2, 38);
    ctx.font = `${fs}px "Courier New", monospace`;
    items.forEach(([key, label], i) => {
      const yy = y + i * (rh + 4), on = m.focus !== 'tabs' && (m.sys || 0) === i;
      ctx.fillStyle = on ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.06)'; rr_(lx, yy, lw, rh, 8); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = on ? '#ffe38a' : '#fdf6e3'; ctx.textAlign = 'center'; ctx.fillText(label, W / 2, yy + rh * 0.66);
      hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { m.sys = i; m.focus = 'grid'; systemSelect(i); } });
    });
    if (m.note) { ctx.fillStyle = '#b8f28a'; ctx.fillText(m.note, W / 2, y + items.length * (rh + 4) + fs * 1.4); }
    ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`;
    drawTipMarquee(fs);
    return;
  }
  if (tab === 'Quests' && !ARENA) {                   // current objectives up top, the log folded underneath
    const v = questView(), rows = questRows(v), lw = pwide, lx = px, sel = m.focus !== 'tabs' ? (m.qsel || 0) : -1;
    const hOf = r => r.kind === 'cur' ? fs * 3.3 : fs * 1.7, gap = 4, avail = H - y - fs * 3;
    // keep the selected row on screen: start from the row that lets it fit
    let first = 0, tot = 0;
    for (let i = 0; i <= Math.max(0, sel); i++) tot += hOf(rows[i]) + gap;
    while (tot > avail && first < sel) { tot -= hOf(rows[first]) + gap; first++; }
    let yy = y + fs * 0.4;
    ctx.textAlign = 'left';
    if (first === 0) { ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`; ctx.fillText('CURRENT', lx + 6, yy + fs * 0.5); yy += fs * 1.0; }
    for (let i = first; i < rows.length; i++) {
      const r = rows[i], rh = hOf(r), on = i === sel;
      if (yy + rh > H - fs * 2.2) break;
      if (r.kind === 'loghead' && i > 0) yy += fs * 0.5;
      ctx.fillStyle = on ? 'rgba(242,201,76,.2)' : r.kind === 'log' ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.07)'; rr_(lx, yy, lw, rh, 8); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
      if (r.kind === 'cur') {
        const { q, s, step } = r.c;
        drawItemIcon(q.icon, lx + fs * 1.5, yy + rh / 2, fs * 1.7);
        ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${fs}px Georgia, serif`; ctx.fillText(step.name, lx + fs * 3, yy + fs * 1.25);
        const tag = q.steps.length > 1 ? `${q.name} \u00b7 step ${s.step + 1} of ${q.steps.length}` : q.name, on2 = tracked(q.id);
        ctx.fillStyle = 'rgba(253,246,227,.6)'; ctx.font = `${Math.round(fs * 0.72)}px "Courier New", monospace`; ctx.textAlign = 'right'; ctx.fillText(tag, lx + lw - 12, yy + fs * 1.2);
        ctx.fillStyle = on2 ? '#b8f28a' : 'rgba(253,246,227,.4)'; ctx.fillText(on2 ? (on ? `active \u00b7 ${K.act} to hide from HUD` : 'active') : (on ? `${K.act} to track on HUD` : 'not tracked'), lx + lw - 12, yy + fs * 2.6); ctx.textAlign = 'left';
        if (on2) { ctx.fillStyle = '#b8f28a'; ctx.beginPath(); ctx.arc(lx + fs * 0.55, yy + fs * 0.7, fs * 0.2, 0, 6.28); ctx.fill(); }
        ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`; ctx.fillText(step.line(), lx + fs * 3, yy + fs * 2.6);
      } else if (r.kind === 'none') {
        ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.85)}px "Courier New", monospace`; ctx.fillText('Nothing pressing. Look around.', lx + 14, yy + rh * 0.65);
      } else if (r.kind === 'loghead') {
        ctx.fillStyle = on ? '#ffe38a' : '#fdf6e3'; ctx.font = `${Math.round(fs * 0.85)}px "Courier New", monospace`;
        const tx = lx + 20, ty = yy + rh * 0.5, a = fs * 0.28; ctx.beginPath();          // a drawn fold arrow: fonts vary
        if (state.qlogOpen) { ctx.moveTo(tx - a, ty - a * 0.6); ctx.lineTo(tx + a, ty - a * 0.6); ctx.lineTo(tx, ty + a * 0.7); }
        else { ctx.moveTo(tx - a * 0.6, ty - a); ctx.lineTo(tx + a * 0.7, ty); ctx.lineTo(tx - a * 0.6, ty + a); }
        ctx.fill();
        ctx.fillText(`Log (${r.n})`, lx + 34, yy + rh * 0.66);
        ctx.fillStyle = 'rgba(253,246,227,.45)'; ctx.textAlign = 'right'; ctx.fillText(state.qlogOpen ? 'newest first' : `${K.act} to open`, lx + lw - 12, yy + rh * 0.66); ctx.textAlign = 'left';
        hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { m.qsel = i; m.focus = 'grid'; state.qlogOpen = !state.qlogOpen; } });
      } else {
        const e = r.e;
        ctx.strokeStyle = '#b8f28a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx + 16, yy + rh * 0.5); ctx.lineTo(lx + 20, yy + rh * 0.66); ctx.lineTo(lx + 27, yy + rh * 0.3); ctx.stroke();
        ctx.fillStyle = e.last ? '#b8f28a' : '#fdf6e3'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
        ctx.fillText(e.last && e.q.steps.length > 1 ? `${e.st.name}. ${e.q.name} complete.` : e.last ? `${e.q.name} complete.` : e.st.name, lx + 36, yy + rh * 0.66);
        ctx.fillStyle = 'rgba(253,246,227,.45)'; ctx.textAlign = 'right'; ctx.fillText(`${e.q.name}${e.t != null ? ' \u00b7 ' + clock(e.t) : ''}`, lx + lw - 12, yy + rh * 0.66); ctx.textAlign = 'left';
      }
      if (r.kind === 'cur') hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { if (m.qsel === i && m.focus === 'grid') trackQuest(r.c.q.id, !tracked(r.c.q.id)); m.qsel = i; m.focus = 'grid'; } });
      else if (r.kind !== 'loghead') hits.push({ x: lx, y: yy, w: lw, h: rh, fn: () => { m.qsel = i; m.focus = 'grid'; } });
      yy += rh + gap;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`;
    drawTipMarquee(fs);
    return;
  }
  if (tab === 'Map') {
    if (state.inv.journal >= 3) {
      const aw = pwide, ah = Math.min(areaH + fs * 4, aw * 13 / 15 * 0.8);
      drawJournalMap(px, y, aw, ah, fs);
      ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
      ctx.fillText(`${Object.keys(state.seen).filter(k => MAP_LAYOUT[k]).length} of ${Object.keys(MAP_LAYOUT).length} places \u00b7 you are at ${MAP_NAMES[state.scene] || state.scene}`, W / 2, y + ah + fs * 1.2);
    } else {
      drawItemIcon('journal', W / 2, y + fs * 3, fs * 3);
      ctx.fillStyle = '#d8d0c0'; ctx.fillText('Pip\'s maps are in Pip\'s journal.', W / 2, y + fs * 6);
    }
    return;
  }
  if (tab === 'Status') { drawStatusCards(px, y, pwide, fs); drawTipMarquee(fs); return; }   // cards, not a wall of text
  if (tab === 'Craft') y += drawCraftMat(px, y + fs * 0.6, pwide, fs) + fs * 1.2;
  const cells = packCells(tab);
  let cs = Math.max(52, Math.min(76, UNIT * 1.7)), gap = 8, cols = Math.max(3, Math.floor((pwide + gap) / (cs + gap)));
  m.cols = cols;
  let gx = px + (pwide - (cols * (cs + gap) - gap)) / 2;
  if (!cells.length) { ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.fillText({ Food: 'No food. Farms, rabbits and fish.', Seeds: 'No seeds. Birds, gremlins and fish drop them.', Materials: 'No materials yet. Grow them from seeds.', Gear: 'Nothing yet.' }[tab] || '', W / 2, y + fs * 2); }
  if (cells.length && cells[0].col != null) { drawCraftColumns(m, cells, px, y, pwide, fs, hits, rr_, tab === 'Gear' ? ['Weapons & tools', 'Abilities', 'Wearing'] : ['Make', 'Materials', 'Made']); }
  else {
  let LAY = packLayout(cells, cols), headH = cells.some(c => c.sec) ? fs * 1.1 : 0;
  {                                                    // sections take room: shrink the cells until everything clears the detail panel
    const limit = H - fs * 8.6, fit = () => { const rows = LAY.length ? LAY[LAY.length - 1].r + 1 : 0, heads = new Set(LAY.filter(q => q.head).map(q => q.r)).size; return y + rows * (cs + gap) + heads * headH <= limit; };
    while (!fit() && cs > 40) { cs -= 4; cols = Math.max(3, Math.floor((pwide + gap) / (cs + gap))); LAY = packLayout(cells, cols); }
    m.cols = cols; gx = px + (pwide - (cols * (cs + gap) - gap)) / 2;
  }
  const rowY = r => { let yy = y; for (let k = 0; k <= r; k++) { if (LAY.some(q => q.r === k && q.head)) yy += headH; if (k < r) yy += cs + gap; } return yy; };
  LAY.forEach((q, i) => { if (q.head) { ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,227,138,.75)'; ctx.font = `bold ${Math.round(fs * 0.7)}px Georgia, serif`; ctx.fillText(q.head, gx, rowY(q.r) - fs * 0.3); ctx.textAlign = 'center'; } });
  cells.forEach((c, i) => {
    const cx = gx + LAY[i].c * (cs + gap), cy = rowY(LAY[i].r), sel = i === m.sel && m.focus !== 'tabs';
    if (cy + cs > y + areaH) return;
    ctx.fillStyle = sel ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.07)'; rr_(cx, cy, cs, cs, 8); ctx.fill();
    if (sel) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
    if (c.mark) { ctx.strokeStyle = '#9fd4ff'; ctx.lineWidth = 2; rr_(cx + 3, cy + 3, cs - 6, cs - 6, 6); ctx.stroke(); }
    ctx.globalAlpha = c.done === false ? 0.55 : 1;
    drawItemIcon(c.icon, cx + cs / 2, cy + cs * 0.45, cs * 0.55);
    ctx.globalAlpha = 1;
    if (c.count != null && c.count > 0) { ctx.fillStyle = '#fdf6e3'; ctx.font = `bold ${Math.round(cs * 0.22)}px "Courier New", monospace`; ctx.textAlign = 'right'; ctx.fillText(c.count, cx + cs - 5, cy + cs - 6); ctx.textAlign = 'center'; }
    if (c.pips) for (let p = 0; p < 3; p++) { ctx.fillStyle = p < c.pips ? '#ffe38a' : 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(cx + 9 + p * 9, cy + cs - 9, 3, 0, 6.28); ctx.fill(); }
    if (c.star) { ctx.fillStyle = '#ffe38a'; ctx.beginPath(); for (let p = 0; p < 10; p++) { const a = p * Math.PI / 5 - Math.PI / 2, r0 = p % 2 ? 3 : 7; ctx.lineTo(cx + 12 + Math.cos(a) * r0, cy + 12 + Math.sin(a) * r0); } ctx.fill(); }
    if (c.done) { ctx.strokeStyle = '#b8f28a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + cs - 20, cy + 12); ctx.lineTo(cx + cs - 14, cy + 18); ctx.lineTo(cx + cs - 6, cy + 7); ctx.stroke(); }
    hits.push({ x: cx, y: cy, w: cs, h: cs, fn: () => { if (tab === 'Craft') { m.sel = i; m.focus = 'grid'; craftCellAct(c); return; } if (m.sel === i && m.focus !== 'tabs' && c.acts && c.acts.length) { m.focus = 'acts'; m.act = 0; } else { m.sel = i; m.focus = 'grid'; } } });
  });
  }
  // detail: name, one line, actions
  const c = m.focus !== 'tabs' ? cells[m.sel] : null, dy = H - fs * 6.8;
  if (c) {
    ctx.fillStyle = 'rgba(255,255,255,.06)'; rr_(px, dy - fs * 1.5, pwide, fs * 6.3, 10); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${fs}px Georgia, serif`; ctx.fillText(c.name, px + 14, dy);
    ctx.fillStyle = '#d8d0c0'; ctx.font = `${Math.round(fs * 0.82)}px "Courier New", monospace`;
    const dl = wrap(c.line || '', pwide - 28).slice(0, 2); dl.forEach((l, k) => ctx.fillText(l, px + 14, dy + fs * 1.3 + k * fs * 1.05));   // wraps, never runs off the panel
    const aY = (dl.length - 1) * fs * 1.05;
    let ax = px + 14;
    (c.acts || []).forEach((a, k) => {
      ctx.font = `${Math.round(fs * 0.82)}px "Courier New", monospace`;
      const w0 = ctx.measureText(a.label).width + 22, on = m.focus === 'acts' && m.act === k;
      ctx.fillStyle = on ? 'rgba(242,201,76,.35)' : 'rgba(255,255,255,.1)'; rr_(ax, dy + fs * 2.1 + aY, w0, fs * 1.6, 6); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = on ? '#ffe38a' : '#fdf6e3'; ctx.fillText(a.label, ax + 11, dy + fs * 3.2 + aY);
      hits.push({ x: ax, y: dy + fs * 2.1 + aY, w: w0, h: fs * 1.6, fn: () => { m.sel = cells.indexOf(c); m.focus = 'grid'; a.fn(); sfx.pickup(); } });
      ax += w0 + 8;
    });
    ctx.textAlign = 'center';
  }
  ctx.fillStyle = 'rgba(253,246,227,.55)'; ctx.font = `${Math.round(fs * 0.75)}px "Courier New", monospace`;
  drawTipMarquee(fs);
}
// the shine on whatever F would use, with a one-word label if labels are on
// System > Show tiles: the field as the game sees it, one square per tile. Ground you can't cross is tinted.
function drawTiles() {
  const sc = sceneDef(), key = sc.id + '|' + W + '|' + H + '|' + state.solids.length;
  if (!state.tileCache || state.tileCache.key !== key) {
    const cols = Math.ceil(W / UNIT), rows = Math.ceil(H / UNIT), bad = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = (c + 0.5) * UNIT, y = (r + 0.5) * UNIT; bad.push(isChasm(x, y) ? 2 : state.solids.some(s => Math.hypot(s.x - x, s.y - y) < s.r) ? 1 : 0); }
    state.tileCache = { key, cols, rows, bad };
  }
  const T = state.tileCache, z = state.cam.ez;
  ctx.save();
  for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) {
    const [sx, sy] = toScreen(c * UNIT, r * UNIT), s = UNIT * z, b = T.bad[r * T.cols + c];
    ctx.fillStyle = b === 2 ? 'rgba(80,140,255,.22)' : b === 1 ? 'rgba(255,90,70,.2)' : (r + c) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)';
    ctx.fillRect(sx, sy, s, s);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let c = 0; c <= T.cols; c++) { const [a0, b0] = toScreen(c * UNIT, 0), [a1, b1] = toScreen(c * UNIT, T.rows * UNIT); ctx.moveTo(a0, b0); ctx.lineTo(a1, b1); }
  for (let r = 0; r <= T.rows; r++) { const [a0, b0] = toScreen(0, r * UNIT), [a1, b1] = toScreen(T.cols * UNIT, r * UNIT); ctx.moveTo(a0, b0); ctx.lineTo(a1, b1); }
  ctx.stroke();
  const h = state.hero, [hx, hy] = toScreen(Math.floor(h.x / UNIT) * UNIT, Math.floor(h.y / UNIT) * UNIT);   // the tile you're on
  ctx.strokeStyle = 'rgba(255,227,138,.8)'; ctx.lineWidth = 2; ctx.strokeRect(hx, hy, UNIT * z, UNIT * z);
  ctx.restore();
}
// everything you could do right where the gold ring is, each with its key (F first)
function actionList(it) {
  const out = [], sc = sceneDef(), h = state.hero, near = (x, y, r) => Math.hypot(h.x - x, h.y - y) < UNIT * r;
  const jk = keyName(K.jump === ' ' ? ' ' : K.jump);
  if (itemAtFeet() && it.verb !== 'Pick up') out.push({ key: K.act, verb: 'Pick up' });
  out.push({ key: it.key || K.act, verb: it.verb });
  if (sc.feat.plots) {                                   // at an empty patch F opens the menu: say what's in it (plant, compost), nothing if neither
    const rt = rtFor(sc.id);
    sc.feat.plots.forEach(([fx, fy], i) => {
      const pp = (rt.flags.plots || [])[i] || {}; if (pp.s || !near(fx * W, fy * H, 1.3)) return;
      const seeds = Object.values(state.inv.bag || {}).some(n => n > 0), nx = PATCH[(pp.lv || 0) + 1], comp = nx && canAfford(nx.cost);
      for (let j = out.length - 1; j >= 0; j--) if (/^(Plant|Compost|Improve)/.test(out[j].verb)) out.splice(j, 1);
      if (seeds || comp) out.unshift({ key: K.act, verb: [seeds ? 'Plant' : '', comp ? (nx.cost.acorn ? 'Compost' : 'Improve') : ''].filter(Boolean).join(' / ') });
    });
  }
  for (const pl of sc.pullables) if (pl.kind === 'rock' && !pullLocked(pl) && !rtFor(sc.id).pulled.has(pl.id) && !rtFor(sc.id).flags['knocked_' + pl.id] && near(pl.fx * W, pl.fy * H, 2)) {   // stuck fast: pounding is the only thing to do yet
    const i = out.findIndex(o => o.verb === 'Pull'); if (i >= 0) out.splice(i, 1);
    out.push({ key: `${jk} ${K.act.toUpperCase()}`, verb: 'Pound it loose' }); break; }
  if (it.verb === 'Shake' || /tree/i.test(it.verb)) out.push({ key: `${jk} ${K.act.toUpperCase()}`, verb: 'Pound' });
  const plotHere = sc.feat.plots && sc.feat.plots.some(([fx, fy]) => near(fx * W, fy * H, 1.3));
  const res = out.filter((o, i) => out.findIndex(q => q.key === o.key && q.verb === o.verb) === i && !(plotHere && (o.verb === 'Compost' || o.verb === 'Improve' || o.verb === 'Plant') && o.key === K.act && out.some(q => q !== o && q.verb.startsWith(o.verb))));
  return res.sort((a, b) => (b.key === K.act) - (a.key === K.act)).slice(0, 3);   // F first, then the others
}
function drawActionHint() {
  const it = findInteractable();
  state.actionHint = it;
  if (!it) return;
  const [sx, sy] = toScreen(it.x, it.y), z = state.cam.ez, u = UNIT * z, t = state.time;
  ctx.strokeStyle = `rgba(255,236,160,${0.28 + 0.1 * Math.sin(t * 3)})`; ctx.lineWidth = 1.5;   // a thin ring on the ground, at half strength: this one
  ctx.beginPath(); ctx.ellipse(sx, sy + u * 0.3, u * 0.75, u * 0.28, 0, 0, 6.28); ctx.stroke();
  const k = (0.5 + 0.5 * Math.sin(t * 2.5)) * u * 0.1 + u * 0.03, tx = sx + u * 0.45, ty = sy - u * 0.55;   // one small twinkle
  ctx.fillStyle = 'rgba(255,248,210,.9)'; ctx.beginPath(); ctx.moveTo(tx, ty - k); ctx.lineTo(tx + k * 0.25, ty); ctx.lineTo(tx, ty + k); ctx.lineTo(tx - k * 0.25, ty); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(tx - k, ty); ctx.lineTo(tx, ty + k * 0.25); ctx.lineTo(tx + k, ty); ctx.lineTo(tx, ty - k * 0.25); ctx.closePath(); ctx.fill();
  if (state.settings.labels === false) return;
  const fs = Math.round(Math.max(13, Math.min(17, UNIT * 0.46)));
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  const acts = actionList(it), hgt = fs + 10;
  if (!acts.length) return;                     // one chip per thing you can do here: key, then what it does
  const parts = acts.map(a => { const kw = ctx.measureText(a.key).width + 12, lw = ctx.measureText(a.verb).width; return { ...a, kw, w: kw + lw + 14 }; });
  // stacked one above the other, key column lined up, F on top
  const w = Math.max(...parts.map(q => q.w)), gap = 5, tot = parts.length * hgt + (parts.length - 1) * gap, kwMax = Math.max(...parts.map(q => q.kw));
  const bx = Math.max(6, Math.min(W - w - (kwMax - Math.min(...parts.map(q => q.kw))) - 6, sx - w / 2)), by0 = Math.max(6, sy - u * 1.6 - tot);
  ctx.textBaseline = 'middle';
  parts.forEach((q, i) => {
    const by = by0 + i * (hgt + gap), cw = kwMax + (q.w - q.kw);
    ctx.globalAlpha = i === 0 ? 1 : 0.85;
    ctx.fillStyle = 'rgba(10,8,14,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, cw, hgt, hgt / 2) : ctx.rect(bx, by, cw, hgt); ctx.fill();
    ctx.fillStyle = '#ffe38a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx + 3, by + 3, kwMax, hgt - 6, (hgt - 6) / 2) : ctx.rect(bx + 3, by + 3, kwMax, hgt - 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#1a1420'; ctx.fillText(q.key, bx + 3 + kwMax / 2, by + hgt / 2 + 1);
    ctx.fillStyle = '#fdf6e3'; ctx.textAlign = 'left'; ctx.fillText(q.verb, bx + kwMax + 9, by + hgt / 2 + 1);
  });
  ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
  state.hintRect = { x: bx, y: by0, w: w + kwMax, h: tot }; state.hintActs = acts;
}
function drawChest(m) {
  ctx.fillStyle = 'rgba(12,10,16,.9)'; ctx.fillRect(0, 0, W, H);
  const fs = Math.round(Math.max(14, Math.min(18, UNIT * 0.46))), colW = Math.min(W * 0.44, 340), lh = fs * 2;
  const lists = [stashList(packAsStash()), stashList(state.inv.chest || {})];
  ctx.textAlign = 'center'; ctx.fillStyle = '#fdf6e3'; ctx.font = `bold ${fs * 1.3}px Georgia, serif`; ctx.fillText('Storage', W / 2, fs * 2.2);
  ['Your pack', 'The chest'].forEach((t, c) => {
    const x0 = W / 2 + (c ? 12 : -colW - 12), y0 = fs * 4;
    ctx.fillStyle = m.col === c ? '#ffe38a' : '#d8d0c0'; ctx.font = `bold ${fs}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.fillText(t, x0, y0);
    lists[c].forEach((e, i) => {
      const y = y0 + fs + i * lh, on = m.col === c && m.sel === i;
      if (y > H - fs * 3) return;
      ctx.fillStyle = on ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.05)'; ctx.fillRect(x0, y, colW, lh - 4);
      drawItemIcon(e.icon, x0 + lh * 0.5, y + lh * 0.45, lh * 0.7);
      ctx.fillStyle = '#fdf6e3'; ctx.font = `${fs}px "Courier New", monospace`; ctx.fillText(`${e.name}`, x0 + lh * 1.1, y + lh * 0.62);
      ctx.textAlign = 'right'; ctx.fillText(`${e.n}`, x0 + colW - 10, y + lh * 0.62); ctx.textAlign = 'left';
    });
    if (!lists[c].length) { ctx.fillStyle = 'rgba(253,246,227,.4)'; ctx.fillText('empty', x0, y0 + fs * 2); }
  });
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(253,246,227,.6)'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
  ctx.fillText(m.note || `\u2190 \u2192 pick a side \u00b7 ${K.act} moves one across \u00b7 ${K.menu} closes`, W / 2, H - fs);
  ctx.textAlign = 'left';
}
// Pip's book: an open book, two pages to a spread. Each page is a title and three short notes, each with a silly
// pencil drawing beside it. Handwriting is Caveat (a quick scrawl, still easy to read).
const HAND = (px, bold) => `${bold ? '700' : '500'} ${px}px Caveat, "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive`;
function drawBook(m) {
  ctx.fillStyle = 'rgba(12,10,16,.88)'; ctx.fillRect(0, 0, W, H);
  const pw = Math.min(W - 40, 760), ph = Math.min(H - 60, 480), x = (W - pw) / 2, y = (H - ph) / 2, fs = Math.round(Math.max(15, Math.min(20, UNIT * 0.5)));
  ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 10, y - 10, pw + 20, ph + 20);
  ctx.fillStyle = '#f2e6c8'; ctx.fillRect(x, y, pw, ph);
  const g = ctx.createLinearGradient(x + pw / 2 - 18, 0, x + pw / 2 + 18, 0); g.addColorStop(0, 'rgba(120,90,60,0)'); g.addColorStop(0.5, 'rgba(120,90,60,.35)'); g.addColorStop(1, 'rgba(120,90,60,0)');
  ctx.fillStyle = g; ctx.fillRect(x + pw / 2 - 18, y, 36, ph);                                   // the gutter
  const pages = BOOK_PAGES(), hs = Math.round(fs * 1.35), gutter = fs * 1.4;
  m.pageCount = pages.length;
  const sp = Math.min(m.page - (m.page % 2), pages.length - 1 - ((pages.length - 1) % 2));
  [sp, sp + 1].forEach((pi, side) => {
    const pg = pages[pi]; if (!pg) return;
    const x0 = x + (side ? pw / 2 + gutter : fs * 1.2), colW = pw / 2 - gutter - fs * 1.2;
    ctx.textAlign = 'left'; ctx.fillStyle = '#3a2616'; ctx.font = HAND(Math.round(hs * 1.35), true);
    ctx.fillText(pg.title, x0, y + fs * 2.6);
    ctx.strokeStyle = 'rgba(58,38,22,.5)'; ctx.lineWidth = 1.5; wobbleLine([[x0, y + fs * 3.1], [x0 + ctx.measureText(pg.title).width, y + fs * 3.2]], 11 + pi);
    if (pg.map) { drawBookMap(x0, y + fs * 3.8, colW, ph - fs * 5.6, hs, pi); }
    if (pg.todo) {                                     // what's left: places seen from the edge but not walked, and rumours of what's beyond
      let yy = y + fs * 4.6; ctx.font = HAND(hs, false); ctx.fillStyle = '#3e2a1a';
      for (const l of mapTodo()) { for (const w2 of wrap(l, colW)) { if (yy > y + ph - fs * 2.2) break; ctx.fillText(w2, x0, yy); yy += hs * 1.05; } yy += hs * 0.35; }
    }
    const bits = pg.bits || [], rowH = (ph - fs * 5.2) / Math.max(1, bits.length), ds = Math.min(rowH * 0.8, colW * 0.34);
    bits.forEach(([d, text], i) => {
      const ry = y + fs * 4 + i * rowH, cx = x0 + ds / 2, cy = ry + rowH / 2;
      drawDoodle(d, cx, cy, ds, pi * 7 + i);
      ctx.fillStyle = '#3e2a1a'; ctx.font = HAND(hs, false);
      const ls = wrap(text, colW - ds - fs); ls.forEach((l, k) => ctx.fillText(l, x0 + ds + fs * 0.8, cy + (k - (ls.length - 1) / 2) * hs * 1.05 + hs * 0.3));
    });
    ctx.fillStyle = '#9a8a70'; ctx.font = HAND(Math.round(fs * 1.1), false); ctx.textAlign = side ? 'right' : 'left';
    ctx.fillText(String(pi + 1), side ? x + pw - fs * 1.2 : x + fs * 1.2, y + ph - fs);
  });
  // how to use the book: one small, plain pill under it, always the same words
  const hint = TOUCH ? 'swipe or tap \u2190 \u2192 to turn   \u00b7   tap F to close' : `\u2190 \u2192  turn pages   \u00b7   ${K.act.toUpperCase()}  close`, hfs = Math.round(Math.max(12, Math.min(15, fs * 0.8)));
  ctx.font = `bold ${hfs}px "Courier New", monospace`; const hw = ctx.measureText(hint).width + hfs * 2, hh = hfs * 1.9, hx = (W - hw) / 2, hy = y + ph + 16;
  ctx.fillStyle = 'rgba(12,10,16,.85)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(hx, hy, hw, hh, hh / 2) : ctx.rect(hx, hy, hw, hh); ctx.fill();
  ctx.strokeStyle = 'rgba(242,230,200,.35)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#f2e6c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(hint, W / 2, hy + hh / 2 + 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(242,230,200,.55)'; ctx.font = HAND(Math.round(fs * 1.05), false); ctx.textAlign = 'center';
  ctx.fillText(`${sp + 1}-${Math.min(pages.length, sp + 2)} of ${pages.length}`, W / 2, y - 16); ctx.textAlign = 'left';
}
// Pip's map in the book: a pencil sketch of the places around home. Walked: inked with its name. Seen from next door
// but not walked: a dashed box, still to finish. Past that, a few arrows off the edge of the page: what's beyond.
const HOME_MAP = ['farbank', 'ford', 'riverbank', 'camp', 'meadow2', 'meadow', 'start', 'w1', 'w2', 'w3', 'foot', 'f1', 'f2', 'f3'];
const MAP_SHORT = { riverbank: 'River', camp: 'Camp', meadow: 'Garden', start: 'Glade', w1: 'Woods', w2: 'Woods', w3: 'Woods', f1: 'Field', f2: 'Field', f3: 'Field', farbank: 'Far bank', ford: 'Ford', meadow2: 'Rocks', foot: 'Old farm' };
// Craft in three columns: Make (Combine, recipes) on the left, Materials in the middle, Made (greyed) on the right
// Status as cards: you at the top (vigor), then one card per skill: a coloured strip, the name and level pips, a
// progress bar, and two short lines, now and next. Upgrades are a row of small badges at the bottom.
function drawStatusCards(px, y, pwide, fs) {
  const inv = state.inv, h = state.hero, u = fs;
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  // you
  const mv = maxVig(); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(px, y, pwide, u * 2.4);
  ctx.fillStyle = '#ffe38a'; ctx.font = `bold ${Math.round(u * 0.95)}px Georgia, serif`; ctx.fillText('Vigor', px + u, y + u * 1.55);
  const bx = px + u * 6, bw = pwide * 0.45; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(bx, y + u * 0.8, bw, u * 0.8); ctx.fillStyle = '#b8f28a'; ctx.fillRect(bx, y + u * 0.8, bw * Math.max(0, h.vig) / mv, u * 0.8);
  ctx.fillStyle = '#fdf6e3'; ctx.font = `${Math.round(u * 0.8)}px "Courier New", monospace`; ctx.fillText(`${Math.ceil(h.vig)} / ${mv}${inv.depth ? `   depth ${inv.depth}` : ''}`, bx + bw + u, y + u * 1.5);
  y += u * 3;
  // skill cards, two across
  const cards = [['acorn', 'Acorns', '#c9a2ff'], ['sword', 'Sword', '#9fd0ff'], ['gather', 'Gathering', '#b8f28a']].map(([id, name, col]) => {
    const s = skillOf(id), max = SKILLS[id].steps.length, need = SKILLS[id].steps[s.lvl], prev = SKILLS[id].steps[s.lvl - 1] || 0, prog = s.n + s.hits * 2;
    return { name, col, lvl: s.lvl, max, k: need ? Math.max(0, Math.min(1, (prog - prev) / (need - prev))) : 1, now: SKILL_INFO[id](s.lvl), next: s.lvl < max ? SKILL_INFO[id](s.lvl + 1) : 'mastered' };
  });
  const fl = farmLevel(); cards.push({ name: 'Farming', col: '#ffcf7a', lvl: fl, max: 5, k: ((Object.values(inv.cropXp || {}).reduce((a, b) => a + b, 0)) % 6) / 6, now: SKILL_INFO.farm(fl), next: SKILL_INFO.farm(fl + 1) });
  const gap = u * 0.8, cw = (pwide - gap) / 2, ch = u * 5.2;
  cards.forEach((c, i) => {
    const cx = px + (i % 2) * (cw + gap), cy = y + Math.floor(i / 2) * (ch + gap);
    if (cy + ch > H - u * 3) return;
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(cx, cy, cw, ch); ctx.fillStyle = c.col; ctx.fillRect(cx, cy, 4, ch);
    ctx.fillStyle = '#fdf6e3'; ctx.font = `bold ${Math.round(u * 0.95)}px Georgia, serif`; ctx.fillText(c.name, cx + u, cy + u * 1.35);
    const pip = Math.min(u * 0.55, (cw * 0.45) / Math.max(c.max, 1));
    for (let k = 0; k < Math.min(c.max, 12); k++) { ctx.fillStyle = k < c.lvl ? c.col : 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.arc(cx + cw - u * 0.8 - (Math.min(c.max, 12) - 1 - k) * pip * 1.25, cy + u * 1.05, pip * 0.42, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(cx + u, cy + u * 1.8, cw - u * 2, u * 0.32); ctx.fillStyle = c.col; ctx.fillRect(cx + u, cy + u * 1.8, (cw - u * 2) * c.k, u * 0.32);
    ctx.font = `${Math.round(u * 0.72)}px "Courier New", monospace`;
    const fit = t => { let s = t; while (ctx.measureText(s).width > cw - u * 4.2 && s.length > 4) s = s.slice(0, -2) + '\u2026'; return s; };
    ctx.fillStyle = 'rgba(255,227,138,.8)'; ctx.fillText('now', cx + u, cy + u * 3.1); ctx.fillStyle = '#fdf6e3'; ctx.fillText(fit(c.now), cx + u * 3.2, cy + u * 3.1);
    ctx.fillStyle = 'rgba(216,208,192,.6)'; ctx.fillText('next', cx + u, cy + u * 4.35); ctx.fillText(fit(c.next), cx + u * 3.2, cy + u * 4.35);
  });
  y += Math.ceil(cards.length / 2) * (ch + gap);
  // upgrades: small badges
  const ups = FORGE.filter(f => f.relic ? inv[f.k] : inv.up[f.k]).map(f => `${f.name} ${'I'.repeat(f.relic ? inv[f.k] : inv.up[f.k])}`);
  if (inv.step) ups.push(`${RELICS.step.name} ${'I'.repeat(inv.step)}`);
  if (ups.length && y < H - u * 4) {
    ctx.font = `${Math.round(u * 0.72)}px "Courier New", monospace`; let bx2 = px;
    for (const t of ups) { const w = ctx.measureText(t).width + u * 1.2; if (bx2 + w > px + pwide) break; ctx.fillStyle = 'rgba(255,227,138,.14)'; ctx.fillRect(bx2, y, w, u * 1.5); ctx.fillStyle = '#ffe38a'; ctx.fillText(t, bx2 + u * 0.6, y + u * 1.05); bx2 += w + u * 0.5; }
  }
  ctx.restore();
}
function drawCraftColumns(m, cells, px, y, pwide, fs, hits, rr_, heads) {
  const hasDesc = cells.some(c => c.desc), colW = pwide / 3, rh = hasDesc ? Math.max(40, Math.min(52, fs * 2.8)) : Math.max(30, Math.min(40, fs * 2.1)), gap = 5, limit = H - fs * 8.6, is = Math.min(rh * 0.72, 34);
  heads.forEach((t, c) => { ctx.textAlign = 'left'; ctx.fillStyle = c === 2 ? 'rgba(255,227,138,.4)' : 'rgba(255,227,138,.85)'; ctx.font = `bold ${Math.round(fs * 0.75)}px Georgia, serif`; ctx.fillText(t, px + c * colW + 6, y + fs * 0.2); });
  const n = [0, 0, 0], y0 = y + fs * 0.7;
  cells.forEach((cl, i) => {
    const c = cl.col, r = n[c]++, x = px + c * colW + 4, yy = y0 + r * (rh + gap), w = colW - 10, sel = i === m.sel && m.focus !== 'tabs';
    if (yy + rh > limit) return;
    ctx.globalAlpha = cl.grey ? 0.45 : 1;
    ctx.fillStyle = sel ? 'rgba(242,201,76,.22)' : cl.mat ? 'rgba(184,242,138,.12)' : 'rgba(255,255,255,.06)'; rr_(x, yy, w, rh, 7); ctx.fill();
    if (sel) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 2; ctx.stroke(); }
    drawItemIcon(cl.icon, x + rh / 2, yy + rh / 2, is * 0.8);
    ctx.fillStyle = cl.mat ? '#b8f28a' : '#fdf6e3'; ctx.font = `${cl.mat ? 'bold ' : ''}${Math.round(fs * 0.78)}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let label = cl.name; while (ctx.measureText(label).width > w - rh - (cl.count ? fs * 1.6 : 6) && label.length > 4) label = label.slice(0, -2) + '\u2026';
    if (cl.desc) {                                                    // name on top, a short note under it
      ctx.fillText(label, x + rh + 2, yy + rh * 0.33);
      ctx.fillStyle = cl.mark ? '#b8f28a' : 'rgba(216,208,192,.75)'; ctx.font = `${Math.round(fs * 0.62)}px "Courier New", monospace`;
      let d = cl.desc; while (ctx.measureText(d).width > w - rh - 6 && d.length > 4) d = d.slice(0, -2) + '\u2026';
      ctx.fillText(d, x + rh + 2, yy + rh * 0.72);
    } else ctx.fillText(label, x + rh + 2, yy + rh / 2 + 1);
    if (cl.count != null && cl.count > 0) { ctx.textAlign = 'right'; ctx.fillStyle = '#ffe38a'; ctx.fillText(cl.count, x + w - 6, yy + rh / 2 + 1); }
    if (cl.grey) { ctx.strokeStyle = '#b8f28a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w - 18, yy + rh / 2); ctx.lineTo(x + w - 13, yy + rh / 2 + 5); ctx.lineTo(x + w - 6, yy + rh / 2 - 5); ctx.stroke(); }
    ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    hits.push({ x, y: yy, w, h: rh, fn: () => { m.sel = i; m.focus = 'grid'; craftCellAct(cl); } });
  });
  ctx.textAlign = 'left';
}
function drawBookMap(x0, y0, w, h, hs, seed) {
  const ids = HOME_MAP.filter(id => MAP_LAYOUT[id] && WORLD[id]), xs = ids.map(id => MAP_LAYOUT[id][0]), ys = ids.map(id => MAP_LAYOUT[id][1]);
  const cx0 = Math.min(...xs), cy0 = Math.min(...ys), cols = Math.max(...xs) - cx0 + 1, rows = Math.max(...ys) - cy0 + 1;
  const cell = Math.min(w / cols, (h - hs * 2) / rows), ox = x0 + (w - cell * cols) / 2, oy = y0;
  const at = id => [ox + (MAP_LAYOUT[id][0] - cx0) * cell, oy + (MAP_LAYOUT[id][1] - cy0) * cell];
  const seen = id => !!state.seen[id], known = id => seen(id) || ids.some(o => seen(o) && WORLD[o].exits.some(e => e.to === id));
  ctx.save(); ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  for (const id of ids) if (seen(id)) for (const e of WORLD[id].exits) if (ids.includes(e.to) && known(e.to)) { const [a, b] = at(id), [c, d] = at(e.to); wobbleLine([[a + cell / 2, b + cell / 2], [c + cell / 2, d + cell / 2]], seed + 3); }
  ids.forEach((id, i) => {
    if (!known(id)) return;
    const [bx, by] = at(id), pad = cell * 0.12, bw = cell - pad * 2;
    if (seen(id)) { ctx.fillStyle = 'rgba(160,190,120,.35)'; ctx.fillRect(bx + pad, by + pad, bw, bw); ctx.setLineDash([]); }
    else ctx.setLineDash([4, 4]);
    wobbleLine([[bx + pad, by + pad], [bx + pad + bw, by + pad], [bx + pad + bw, by + pad + bw], [bx + pad, by + pad + bw], [bx + pad, by + pad]], seed + i * 7);
    ctx.setLineDash([]);
    ctx.fillStyle = seen(id) ? '#3e2a1a' : 'rgba(62,42,26,.55)'; ctx.font = HAND(Math.round(Math.min(hs * 0.8, cell * 0.28)), seen(id)); ctx.textAlign = 'center';
    ctx.fillText(seen(id) ? (MAP_SHORT[id] || id) : '?', bx + cell / 2, by + cell * 0.58);
    if (id === state.scene || (state.scene === 'tentin' && id === 'camp')) { ctx.fillStyle = '#c0304a'; ctx.beginPath(); ctx.arc(bx + cell * 0.78, by + cell * 0.25, Math.max(2.5, cell * 0.06), 0, 6.28); ctx.fill(); }
  });
  // off the page: what's beyond, as Pip imagines it
  ctx.font = HAND(Math.round(hs * 0.75), false); ctx.fillStyle = 'rgba(62,42,26,.7)'; ctx.textAlign = 'left';
  ctx.fillText('\u2193 the peaks?', ox + cell * 1.2, oy + rows * cell + hs * 0.9);
  ctx.textAlign = 'right'; ctx.fillText('deeper woods \u2192', ox + cols * cell, oy - hs * 0.3);
  ctx.textAlign = 'left'; ctx.fillText('\u2190 downriver', ox, oy - hs * 0.3);
  ctx.restore(); ctx.textAlign = 'left';
}
function mapTodo() {
  const out = [], seen = id => !!state.seen[id];
  const half = HOME_MAP.filter(id => !seen(id) && HOME_MAP.some(o => seen(o) && WORLD[o] && WORLD[o].exits.some(e => e.to === id)));
  for (const id of half.slice(0, 4)) out.push(`- ${MAP_SHORT[id] || id}: only peeked in. Still to draw.`);
  if (!seen('w3')) out.push('- Past the boulders in the woods. Something glints? No. Probably nothing.');
  out.push('- Downriver: Old Wick\'s pool, so shiny it hurts your eyes.');
  out.push('- South, past the windy fields: mountains. Who lives up there?');
  out.push('- I keep hearing digging under the woods...');
  return out;
}
// pencil lines that wobble a little, the same way every frame (seeded)
function wobbleLine(pts, seed, close) {
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280 - 0.5);
  ctx.beginPath();
  pts.forEach(([px, py], i) => { const jx = px + rnd() * 2.2, jy = py + rnd() * 2.2; i ? ctx.lineTo(jx, jy) : ctx.moveTo(jx, jy); });
  if (close) ctx.closePath();
  ctx.stroke();
}
const circlePts = (cx, cy, rx, ry, n = 14, a0 = 0, a1 = 6.28) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
// Pip's silly drawings: pencil outlines with a little colour, all stick figures and blobs
function drawDoodle(name, cx, cy, s, seed) {
  const L = (pts, c) => wobbleLine(pts, seed + (c || 0)), O = (x0, y0, rx, ry, c) => wobbleLine(circlePts(x0, y0, rx, ry), seed + (c || 0), true);
  const tint = (col, f) => { ctx.fillStyle = col; ctx.globalAlpha = 0.45; f(); ctx.fill(); ctx.globalAlpha = 1; };
  const r = s / 2;
  ctx.save(); ctx.strokeStyle = '#4a3420'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const guy = (x0, y0, k = 1) => { O(x0, y0 - r * 0.45 * k, r * 0.14 * k, r * 0.14 * k, 1); L([[x0, y0 - r * 0.31 * k], [x0, y0 + r * 0.05 * k]], 2); L([[x0 - r * 0.15 * k, y0 - r * 0.15 * k], [x0 + r * 0.15 * k, y0 - r * 0.15 * k]], 3); L([[x0 - r * 0.12 * k, y0 + r * 0.3 * k], [x0, y0 + r * 0.05 * k], [x0 + r * 0.12 * k, y0 + r * 0.3 * k]], 4); };
  switch (name) {
    case 'snack': tint('#b884d8', () => { ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 0.4, 0, 6.28); }); O(cx, cy + r * 0.1, r * 0.4, r * 0.4); L([[cx, cy - r * 0.3], [cx - r * 0.2, cy - r * 0.7]], 5); L([[cx, cy - r * 0.3], [cx + r * 0.15, cy - r * 0.75]], 6); L([[cx - r * 0.12, cy + r * 0.1], [cx - r * 0.05, cy + r * 0.2], [cx + r * 0.08, cy + r * 0.1]], 7); break;   // a happy turnip
    case 'gremlin': tint('#7aa05a', () => { ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, 6.28); }); O(cx, cy, r * 0.45, r * 0.42); L([[cx - r * 0.4, cy - r * 0.25], [cx - r * 0.7, cy - r * 0.6], [cx - r * 0.3, cy - r * 0.4]], 1); L([[cx + r * 0.4, cy - r * 0.25], [cx + r * 0.7, cy - r * 0.6], [cx + r * 0.3, cy - r * 0.4]], 2);
      L([[cx - r * 0.25, cy + r * 0.1], [cx, cy + r * 0.28], [cx + r * 0.25, cy + r * 0.1]], 3); O(cx - r * 0.15, cy - r * 0.1, r * 0.05, r * 0.05, 4); O(cx + r * 0.15, cy - r * 0.1, r * 0.05, r * 0.05, 5);
      ctx.strokeStyle = '#c0304a'; L([[cx + r * 0.55, cy - r * 0.05], [cx + r * 0.85, cy + r * 0.25]], 6); L([[cx + r * 0.55, cy + r * 0.25], [cx + r * 0.85, cy - r * 0.05]], 7); break;   // smiling = no
    case 'poke': tint('#b48af0', () => { ctx.beginPath(); ctx.ellipse(cx + r * 0.2, cy - r * 0.2, r * 0.4, r * 0.25, 0, Math.PI, 0); }); L(circlePts(cx + r * 0.2, cy - r * 0.2, r * 0.4, r * 0.25, 10, Math.PI, 6.28), 1); L([[cx + r * 0.2, cy - r * 0.2], [cx + r * 0.2, cy + r * 0.5]], 2);
      L([[cx - r * 0.8, cy + r * 0.5], [cx - r * 0.05, cy - r * 0.05]], 3); for (const [dx, dy] of [[0.35, -0.7], [0.65, -0.55], [0.0, -0.65]]) { L([[cx + dx * r, cy + dy * r - r * 0.08], [cx + dx * r, cy + dy * r + r * 0.08]], 4); L([[cx + dx * r - r * 0.08, cy + dy * r], [cx + dx * r + r * 0.08, cy + dy * r]], 5); } break;
    case 'arrows': for (const [dx, dy, a] of [[0, -0.5, -1.57], [0, 0.35, 1.57], [-0.45, 0.35, 3.14], [0.45, 0.35, 0]]) { const bx = cx + dx * r, by = cy + dy * r; L([[bx - r * 0.2, by - r * 0.2], [bx + r * 0.2, by - r * 0.2], [bx + r * 0.2, by + r * 0.2], [bx - r * 0.2, by + r * 0.2], [bx - r * 0.2, by - r * 0.2]], 1 + dx * 9 + dy * 7); L([[bx - Math.cos(a) * r * 0.1, by - Math.sin(a) * r * 0.1], [bx + Math.cos(a) * r * 0.1, by + Math.sin(a) * r * 0.1]], 2); } break;
    case 'jump': ctx.setLineDash([3, 4]); L(circlePts(cx, cy + r * 0.45, r * 0.7, r * 0.9, 12, Math.PI, 6.28), 1); ctx.setLineDash([]); guy(cx, cy - r * 0.2, 0.9); L([[cx - r * 0.9, cy + r * 0.6], [cx + r * 0.9, cy + r * 0.6]], 2); break;
    case 'goldf': tint('#f2c94c', () => { ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, 6.28); }); O(cx, cy, r * 0.42, r * 0.42); ctx.fillStyle = '#4a3420'; ctx.font = HAND(Math.round(r * 0.6), true); ctx.textAlign = 'center'; ctx.fillText(K.act.toUpperCase(), cx, cy + r * 0.2); ctx.textAlign = 'left';
      for (const a of [0.3, 1.2, 2.2, 3.4, 4.6, 5.6]) L([[cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55], [cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75]], a * 10); break;
    case 'slash': guy(cx - r * 0.4, cy + r * 0.2); L(circlePts(cx - r * 0.1, cy, r * 0.7, r * 0.6, 8, -1.2, 1.0), 5); L(circlePts(cx - r * 0.1, cy, r * 0.8, r * 0.7, 8, -1.1, 0.9), 6); break;
    case 'stab': guy(cx - r * 0.55, cy + r * 0.2); L([[cx - r * 0.3, cy], [cx + r * 0.8, cy]], 5); L([[cx + r * 0.6, cy - r * 0.15], [cx + r * 0.85, cy], [cx + r * 0.6, cy + r * 0.15]], 6); L([[cx - r * 0.1, cy - r * 0.3], [cx + r * 0.3, cy - r * 0.3]], 7); L([[cx - r * 0.1, cy + r * 0.3], [cx + r * 0.3, cy + r * 0.3]], 8); break;
    case 'pound': guy(cx, cy - r * 0.35, 0.8); L([[cx, cy + r * 0.05], [cx, cy + r * 0.35]], 5); L([[cx - r * 0.1, cy + r * 0.25], [cx, cy + r * 0.38], [cx + r * 0.1, cy + r * 0.25]], 6); for (const a of [-2.6, -2.1, -1.0, -0.5]) L([[cx + Math.cos(a) * r * 0.25, cy + r * 0.62 + Math.sin(a) * r * 0.1], [cx + Math.cos(a) * r * 0.7, cy + r * 0.62 + Math.sin(a) * r * 0.35]], a * 10); L([[cx - r * 0.9, cy + r * 0.65], [cx + r * 0.9, cy + r * 0.65]], 7); break;
    case 'seed': tint('#6a4a2a', () => { ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.45, r * 0.8, r * 0.25, 0, Math.PI, 0); }); L(circlePts(cx, cy + r * 0.45, r * 0.8, r * 0.25, 10, Math.PI, 6.28), 1); O(cx, cy - r * 0.45, r * 0.08, r * 0.1, 2); L([[cx, cy - r * 0.25], [cx, cy + r * 0.1]], 3); L([[cx - r * 0.1, cy], [cx, cy + r * 0.12], [cx + r * 0.1, cy]], 4); break;
    case 'compost': tint('#a0662a', () => { ctx.beginPath(); ctx.ellipse(cx - r * 0.45, cy - r * 0.25, r * 0.2, r * 0.25, 0, 0, 6.28); }); O(cx - r * 0.45, cy - r * 0.25, r * 0.2, r * 0.25, 1); L([[cx - r * 0.65, cy - r * 0.45], [cx - r * 0.25, cy - r * 0.45]], 2);
      L([[cx - r * 0.1, cy - r * 0.2], [cx + r * 0.3, cy - r * 0.2]], 3); L([[cx + r * 0.2, cy - r * 0.3], [cx + r * 0.32, cy - r * 0.2], [cx + r * 0.2, cy - r * 0.1]], 4); tint('#4a3018', () => { ctx.beginPath(); ctx.ellipse(cx + r * 0.3, cy + r * 0.4, r * 0.55, r * 0.22, 0, Math.PI, 0); }); L(circlePts(cx + r * 0.3, cy + r * 0.4, r * 0.55, r * 0.22, 10, Math.PI, 6.28), 5);
      for (const dx of [-0.1, 0.3, 0.7]) L([[cx + dx * r, cy + r * 0.2], [cx + dx * r + r * 0.04, cy + r * 0.05]], dx * 10 + 6); break;
    case 'sprout': L(circlePts(cx, cy + r * 0.5, r * 0.8, r * 0.22, 10, Math.PI, 6.28), 1); tint('#b884d8', () => { ctx.beginPath(); ctx.arc(cx, cy + r * 0.3, r * 0.25, Math.PI, 0); }); L(circlePts(cx, cy + r * 0.3, r * 0.25, r * 0.25, 8, Math.PI, 6.28), 2);
      L([[cx, cy + r * 0.05], [cx - r * 0.2, cy - r * 0.5]], 3); L([[cx, cy + r * 0.05], [cx + r * 0.22, cy - r * 0.55]], 4); L([[cx + r * 0.6, cy - r * 0.6], [cx + r * 0.6, cy - r * 0.1]], 5); L([[cx + r * 0.5, cy - r * 0.25], [cx + r * 0.6, cy - r * 0.1], [cx + r * 0.7, cy - r * 0.25]], 6); break;
    case 'mat': for (const [dx, ch] of [[-0.7, ''], [-0.05, '']]) { L([[cx + dx * r - r * 0.25, cy - r * 0.25], [cx + dx * r + r * 0.25, cy - r * 0.25], [cx + dx * r + r * 0.25, cy + r * 0.25], [cx + dx * r - r * 0.25, cy + r * 0.25], [cx + dx * r - r * 0.25, cy - r * 0.25]], dx * 10 + 1); }
      ctx.fillStyle = '#4a3420'; ctx.font = HAND(Math.round(r * 0.55), true); ctx.textAlign = 'center'; ctx.fillText('+', cx - r * 0.38, cy + r * 0.15); ctx.fillText('=', cx + r * 0.33, cy + r * 0.15); ctx.fillText('?', cx + r * 0.72, cy + r * 0.18); ctx.textAlign = 'left'; break;
    case 'glue': for (const dx of [-0.6, -0.1]) { tint('#ffffff', () => { ctx.beginPath(); ctx.arc(cx + dx * r, cy, r * 0.2, 0, 6.28); }); O(cx + dx * r, cy, r * 0.2, r * 0.18, dx * 10); }
      ctx.fillStyle = '#4a3420'; ctx.font = HAND(Math.round(r * 0.45), true); ctx.textAlign = 'center'; ctx.fillText('=', cx + r * 0.25, cy + r * 0.12); ctx.textAlign = 'left';
      L([[cx + r * 0.45, cy + r * 0.3], [cx + r * 0.45, cy - r * 0.2], [cx + r * 0.85, cy - r * 0.2], [cx + r * 0.85, cy + r * 0.3], [cx + r * 0.45, cy + r * 0.3]], 3); L([[cx + r * 0.55, cy - r * 0.2], [cx + r * 0.6, cy - r * 0.4], [cx + r * 0.7, cy - r * 0.4], [cx + r * 0.75, cy - r * 0.2]], 4); break;
    case 'mark': ctx.strokeStyle = '#c0304a'; L([[cx - r * 0.3, cy], [cx + r * 0.3, cy + r * 0.4]], 1); L([[cx + r * 0.3, cy], [cx - r * 0.3, cy + r * 0.4]], 2); ctx.strokeStyle = '#4a3420';
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; O(cx + Math.cos(a) * r * 0.55, cy - r * 0.35 + Math.sin(a) * r * 0.2, r * 0.1, r * 0.08, k + 3); } L([[cx, cy - r * 0.5], [cx, cy - r * 0.2]], 9); L([[cx, cy - r * 0.2], [cx + r * 0.04, cy + r * 0.0]], 10); break;
    case 'zzz': guy(cx - r * 0.3, cy + r * 0.2, 0.9); ctx.fillStyle = '#4a3420'; ctx.font = HAND(Math.round(r * 0.45), true); ctx.fillText('z', cx + r * 0.05, cy - r * 0.2); ctx.fillText('Z', cx + r * 0.3, cy - r * 0.45); ctx.fillText('Z', cx + r * 0.6, cy - r * 0.75); break;
    case 'fire': tint('#ff9a4a', () => { ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.6); ctx.quadraticCurveTo(cx + r * 0.4, cy, cx, cy + r * 0.3); ctx.quadraticCurveTo(cx - r * 0.4, cy, cx, cy - r * 0.6); });
      L([[cx, cy - r * 0.6], [cx + r * 0.3, cy - r * 0.1], [cx + r * 0.15, cy + r * 0.3], [cx - r * 0.15, cy + r * 0.3], [cx - r * 0.3, cy - r * 0.1], [cx, cy - r * 0.6]], 1); L([[cx - r * 0.5, cy + r * 0.45], [cx + r * 0.5, cy + r * 0.3]], 2); L([[cx - r * 0.5, cy + r * 0.3], [cx + r * 0.5, cy + r * 0.45]], 3); break;
    case 'carrot': tint('#e8792a', () => { ctx.beginPath(); ctx.moveTo(cx - r * 0.2, cy - r * 0.35); ctx.lineTo(cx + r * 0.2, cy - r * 0.35); ctx.lineTo(cx, cy + r * 0.6); ctx.closePath(); });
      L([[cx - r * 0.2, cy - r * 0.35], [cx + r * 0.2, cy - r * 0.35], [cx, cy + r * 0.6], [cx - r * 0.2, cy - r * 0.35]], 1); L([[cx, cy - r * 0.35], [cx - r * 0.15, cy - r * 0.7]], 2); L([[cx, cy - r * 0.35], [cx + r * 0.15, cy - r * 0.7]], 3); L([[cx - r * 0.05, cy - r * 0.1], [cx + r * 0.08, cy - r * 0.05]], 4); break;
  }
  ctx.restore();
}
function drawTipMarquee(fs) {
  const m = state.marquee || (state.marquee = { text: null, t0: 0 });
  ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
  const speed = Math.max(60, W * 0.07), y = H - fs * 0.8;
  if (!m.text || W - (state.time - m.t0) * speed + ctx.measureText(m.text).width < 0) {
    const pool = tipLibrary(); m.text = pool[Math.floor(Math.random() * pool.length)]; m.t0 = state.time;
  }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, y - fs * 0.95, W, fs * 1.35);
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - fs, W - 90, fs * 1.4); ctx.clip();
  ctx.fillStyle = 'rgba(253,246,227,.8)'; ctx.textAlign = 'left';
  ctx.fillText(m.text, W - (state.time - m.t0) * speed, y);
  ctx.restore();
}
// the quick-select wheel around the hero (drawn over the world, under the menu)
function drawRadial() {
  const r = state.radial;
  if (!r) return;
  const c = state.cam, h = state.hero, sx = W / 2 + (h.x - c.ex) * c.ez, sy = H / 2 + (h.y - c.ey) * c.ez - UNIT * 0.4;
  const R = Math.max(UNIT * 2.4, 90), n = r.opts.length, s = Math.max(UNIT * 0.9, 34);
  ctx.fillStyle = 'rgba(8,6,12,.35)'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = s * 1.3; ctx.beginPath(); ctx.arc(sx, sy, R, 0, 6.28); ctx.stroke();
  r.opts.forEach((o, i) => {
    const a = i / n * Math.PI * 2 - Math.PI / 2, x = sx + Math.cos(a) * R, y = sy + Math.sin(a) * R, on = i === r.sel;
    ctx.fillStyle = on ? 'rgba(242,201,76,.45)' : 'rgba(20,18,26,.8)'; ctx.beginPath(); ctx.arc(x, y, s * (on ? 0.72 : 0.6), 0, 6.28); ctx.fill();
    if (on) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 3; ctx.stroke(); }
    const inSlot = o.kind !== 'none' && slotOf(o);
    if (r.slot && sameEntry(o, slotsOf()[r.slot])) { ctx.strokeStyle = '#9fd4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, 6.28); ctx.stroke(); }
    if (o.kind === 'none') { ctx.strokeStyle = 'rgba(253,246,227,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s * 0.28, 0, 6.28); ctx.moveTo(x - s * 0.2, y + s * 0.2); ctx.lineTo(x + s * 0.2, y - s * 0.2); ctx.stroke(); }
    else drawItemIcon(entryInfo(o).icon, x, y, s * 0.75);
    if (inSlot) { ctx.font = `bold ${Math.round(s * 0.3)}px "Courier New", monospace`; ctx.fillStyle = '#ffe38a'; ctx.textAlign = 'center'; ctx.fillText(slotLabel(inSlot), x + s * 0.42, y - s * 0.38); ctx.textAlign = 'left'; }
  });
  const sel = r.opts[r.sel], fs = Math.round(Math.max(14, UNIT * 0.45));
  ctx.textAlign = 'center'; ctx.font = `bold ${fs}px "Courier New", monospace`;
  ctx.fillStyle = r.slot ? '#9fd4ff' : 'rgba(253,246,227,.75)';
  ctx.fillText(r.slot ? `${r.lane ? LANE_NAME[r.slot] + ': ' : 'Set '}${slotLabel(r.slot)}` : 'Use now', sx, sy - fs * 0.7);
  ctx.fillStyle = '#ffe38a'; ctx.fillText(sel ? radialLabel(sel, r.slot) : r.slot ? 'point, then let go' : `point, let go \u00b7 ${ALL_SLOTS.map(slotLabel).join('/')} to set a slot`, sx, sy + fs * 0.6);
  ctx.textAlign = 'left';
}
function drawMenu() {
  const m = state.menu, items = menuItems();
  if (m.view === 'poses') { drawPoseSheet(); return; }
  if (m.view === 'chest') { drawChest(m); return; }
  if (m.view === 'book') { drawBook(m); return; }
  ctx.fillStyle = 'rgba(8,6,12,.72)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(253,246,227,.45)'; ctx.font = '12px "Courier New", monospace';
  ctx.fillText(BUILD, W - 10, H - 8); ctx.textAlign = 'left';
  const pw = Math.min(W - 30, 520), fs = Math.round(Math.max(14, Math.min(20, UNIT * 0.55))), lh = fs * 2.1;
  const titles = { main: 'Paused', equip: 'Equipment', save: 'Save game', load: 'Load game', new: 'Start a new adventure?', keys: 'Controls', levels: 'Testing: set levels', forge: 'Workbench', pack: 'Pack', spores: 'Spore travel', settings: 'Settings' };
  let y = Math.max(40, H * 0.14);
  const x = (W - pw) / 2;
  ctx.textAlign = 'center'; ctx.fillStyle = '#fdf6e3';
  ctx.font = `bold ${Math.round(fs * 1.6)}px Georgia, serif`; ctx.fillText(titles[m.view], W / 2, y); y += fs * 2;
  ctx.font = `${fs}px "Courier New", monospace`;
  if (m.view === 'forge') {
    ctx.textAlign = 'left'; ctx.fillStyle = '#d8d0c0';
    ctx.fillText('Materials: ' + Object.keys(MATS).map(k => `${MATS[k]} ${state.inv.mats[k]}`).join(', '), x + 10, y); y += fs * 1.8;
    ctx.textAlign = 'center';
  }
  if (m.view === 'pack') { drawPack(m, x, y, pw, fs); ctx.textAlign = 'left'; return; }
  state.menuRects = [];
  items.forEach((label, i) => {
    const sel = i === m.sel;
    ctx.fillStyle = sel ? 'rgba(242,201,76,.22)' : 'rgba(255,255,255,.05)';
    ctx.fillRect(x, y - fs * 1.2, pw, lh - 6);
    ctx.fillStyle = sel ? '#ffe38a' : '#fdf6e3';
    ctx.fillText((sel ? '\u25B8 ' : '') + label, W / 2, y);
    state.menuRects.push({ x, y: y - fs * 1.2, w: pw, h: lh - 6, i });
    y += lh;
  });
  if (m.note) { ctx.fillStyle = '#b8f28a'; ctx.fillText(m.note, W / 2, y + fs * 0.4); y += lh; }
  ctx.fillStyle = 'rgba(253,246,227,.6)'; ctx.font = `${Math.round(fs * 0.8)}px "Courier New", monospace`;
  ctx.fillText(TOUCH ? 'tap to choose' : `\u2191 \u2193 to move, ${K.act} to choose, ${K.menu} to close`, W / 2, Math.min(H - 20, y + fs));
  ctx.textAlign = 'left';
}
